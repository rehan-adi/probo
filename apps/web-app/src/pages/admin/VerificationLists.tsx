import { Link } from 'react-router-dom';
import { Loader2, Eye } from 'lucide-react';
import { useGetAllPendingVerification } from '@/hooks/queries/verification';

export default function VerificationListsPage() {
	const { data, isLoading, isError } = useGetAllPendingVerification();

	const formatDate = (dateStr?: string) => {
		if (!dateStr) return '-';
		return new Date(dateStr).toLocaleDateString('en-US', {
			month: 'long',
			day: 'numeric',
			year: 'numeric',
		});
	};

	if (isLoading) {
		return (
			<div className="w-full flex justify-center items-center h-64">
				<Loader2 className="w-6 h-6 animate-spin text-black" />
			</div>
		);
	}

	if (isError) {
		return <div className="p-6 text-red-500">Failed to load verifications. Please try again.</div>;
	}

	const verifications: any[] = data?.data?.data || [];

	return (
		<div className="w-full flex justify-center md:p-6 p-4 md:pt-24 pt-20 bg-[#f4f4f5]">
			<div className="w-full max-w-6xl flex flex-col items-start">
				<h1 className="md:text-2xl text-lg font-bold mb-6 text-black">KYC Verifications</h1>

				<div className="bg-white w-full rounded-2xl border border-gray-400/35 overflow-hidden">
					{verifications.length === 0 ? (
						<div className="flex justify-center items-center h-[500px]">
							<p className="text-black text-lg">No pending verifications</p>
						</div>
					) : (
						<div className="overflow-x-auto scrollbar-hide">
							<table className="w-full border-collapse min-w-[950px] text-sm">
								<thead>
									<tr className="text-left font-medium text-black border-b bg-gray-50">
										<th className="py-3 px-2 pl-4 whitespace-nowrap">Phone</th>
										<th className="py-3 px-2 whitespace-nowrap">PAN Name</th>
										<th className="py-3 px-2 whitespace-nowrap">PAN Status</th>
										<th className="py-3 px-2 whitespace-nowrap">PAN Submitted</th>
										<th className="py-3 px-2 whitespace-nowrap">Type</th>
										<th className="py-3 px-2 whitespace-nowrap">Payment Status</th>
										<th className="py-3 px-2 whitespace-nowrap">Payment Submitted</th>
										<th className="py-3 px-2 text-center whitespace-nowrap">Action</th>
									</tr>
								</thead>
								<tbody>
									{verifications.map((v) => {
										const kyc = v.kycs?.[0];
										const payment = v.paymentMethods?.[0];

										return (
											<tr
												key={v.id}
												className="border-b text-sm last:border-none bg-white hover:bg-gray-50 transition"
											>
												<td className="py-2 px-2 pl-4 whitespace-nowrap">{v.phone}</td>
												<td className="py-2 px-2 whitespace-nowrap">{kyc?.panName || '-'}</td>
												<td className="py-2 px-2 whitespace-nowrap font-medium">
													<span
														className={`px-2 py-1 rounded text-xs font-medium ${
															kyc?.status === 'PENDING'
																? 'bg-yellow-100 text-yellow-700'
																: kyc?.status === 'VERIFIED'
																	? 'bg-green-100 text-green-700'
																	: 'bg-red-100 text-red-700'
														}`}
													>
														{kyc?.status || '-'}
													</span>
												</td>
												<td className="py-2 px-2 whitespace-nowrap">
													{formatDate(kyc?.submittedAt)}
												</td>
												<td className="py-2 px-2 font-semibold whitespace-nowrap">
													{payment?.type || '-'}
												</td>
												<td className="py-2 px-2 whitespace-nowrap">
													<span
														className={`px-2 py-1 rounded text-xs font-medium ${
															payment?.status === 'PENDING'
																? 'bg-yellow-100 text-yellow-700'
																: payment?.status === 'VERIFIED'
																	? 'bg-green-100 text-green-700'
																	: 'bg-red-100 text-red-700'
														}`}
													>
														{payment?.status || '-'}
													</span>
												</td>
												<td className="py-2 px-2 whitespace-nowrap">
													{formatDate(payment?.submittedAt)}
												</td>
												<td className="py-2 px-2 text-center whitespace-nowrap">
													<Link
														to={`/verifications/${v.id}`}
														className="inline-flex items-center gap-1 px-3 py-2 text-sm rounded-lg bg-[#262626] text-white hover:bg-black transition"
													>
														<Eye className="w-4 h-4" />
													</Link>
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						</div>
					)}
				</div>
			</div>

			<style>{`
				/* hide scrollbar */
				.scrollbar-hide::-webkit-scrollbar {
					display: none;
				}
				.scrollbar-hide {
					-ms-overflow-style: none;
					scrollbar-width: none;
				}
			`}</style>
		</div>
	);
}
