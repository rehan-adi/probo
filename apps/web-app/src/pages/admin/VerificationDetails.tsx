import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Textarea } from '@/components/ui/textarea';
import { getUserVerificationDetails } from '@/api/verification';
import { ChevronRight, Clock, Loader2, Phone, X } from 'lucide-react';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { useVerifyVerificationMutation } from '@/hooks/mutations/verification';

export default function VerificationDetailsPage() {
	const { id } = useParams();
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [verification, setVerification] = useState<any>(null);

	const [kycStatus, setKycStatus] = useState('');
	const [kycRemark, setKycRemark] = useState('');
	const [paymentStatus, setPaymentStatus] = useState('');
	const [paymentRemark, setPaymentRemark] = useState('');

	const { mutate, isPending } = useVerifyVerificationMutation();

	useEffect(() => {
		if (!id) return;

		const fetchData = async () => {
			const data = await getUserVerificationDetails(id);
			setVerification(data);
		};

		fetchData();
	}, [id]);

	const formatDate = (dateStr: any) => {
		return new Date(dateStr).toLocaleString('en-US', {
			month: 'long',
			day: 'numeric',
			year: 'numeric',
			hour: 'numeric',
			minute: '2-digit',
		});
	};

	const handleSubmit = () => {
		if (!id) return;

		mutate(
			{ id, kycStatus, paymentStatus, kycRemark, paymentRemark },
			{
				onSuccess: () => {
					setIsModalOpen(false);
				},
			},
		);
	};

	if (!verification)
		return (
			<div className="h-screen flex justify-center items-center w-full bg-[#f4f4f5]">
				<Loader2 className="w-6 h-6 animate-spin" />
			</div>
		);

	return (
		<div className="w-full flex justify-center md:p-6 p-4 md:pt-24 pt-20 bg-[#f4f4f5]">
			<div className="w-full max-w-5xl flex flex-col items-start space-y-6">
				<div className="flex items-center gap-1">
					<Link to="/verifications" className="flex items-center text-[15px] text-[#757575]">
						<span>Verifications</span>
					</Link>
					<ChevronRight size={20} className="text-[#757575]" />
					<span className="font-medium text-[#262626] text-[15px]">Verification Details</span>
				</div>

				<h1 className="md:text-2xl text-xl font-semibold text-black">Verification Details</h1>

				<div className="bg-white w-full rounded-2xl border border-gray-400/20 p-3 md:p-5 space-y-8 text-black">
					<div>
						<h2 className="text-lg font-semibold mb-3">General Info</h2>
						<div className="md:text-base text-sm md:max-w-md w-full">
							<div className="grid grid-cols-3 py-2">
								<div className="flex gap-2 items-center justify-start">
									<Phone className="w-4" />
									<span className="font-medium text-black">Phone</span>
								</div>
								<span className="text-black mt-0.5 whitespace-nowrap">
									+91 {verification.data.phone}
								</span>
							</div>
							<div className="grid grid-cols-3 py-2">
								<div className="flex gap-2 items-center justify-start">
									<Clock className="w-4" />
									<span className="font-medium text-black">Submitted</span>
								</div>
								<span className="col-span-2 mt-0.5 text-black">
									{formatDate(verification.data.kyc.submittedAt)}
								</span>
							</div>
						</div>
					</div>

					<div>
						<h2 className="text-lg font-semibold mb-3">KYC Information</h2>
						<div className="md:text-base text-sm md:max-w-md w-full">
							<div className="grid grid-cols-3 py-2">
								<span className="font-medium text-black">Status</span>
								<span className="col-span-2">{verification.data.kyc.status}</span>
							</div>
							<div className="grid grid-cols-3 py-2">
								<dt className="font-medium text-black">PAN Name</dt>
								<dd className="col-span-2">{verification.data.kyc.panName}</dd>
							</div>
							<div className="grid grid-cols-3 py-2">
								<dt className="font-medium text-black">PAN Number</dt>
								<dd className="col-span-2 text-black">{verification.data.kyc.panNumber}</dd>
							</div>
						</div>
					</div>

					<div>
						<h2 className="text-lg font-medium mb-3">Payment Information</h2>
						<div className="md:text-base text-sm md:max-w-md w-full">
							<div className="grid grid-cols-3 py-2">
								<span className="font-medium text-black">Status</span>
								<span className="col-span-2 text-black">
									{verification.data.paymentMethod.status}
								</span>
							</div>
							<div className="grid grid-cols-3 py-2">
								<span className="font-medium md:flex hidden text-black">Account Number</span>
								<span className="font-medium flex md:hidden text-black">Acc Number</span>
								<span className="col-span-2 text-black">
									{verification.data.paymentMethod.accountNumber}
								</span>
							</div>
							<div className="grid grid-cols-3 py-2">
								<span className="font-medium text-black">IFSC Code</span>
								<span className="col-span-2 text-black">
									{verification.data.paymentMethod.ifscCode}
								</span>
							</div>
						</div>
					</div>

					<div className="flex md:justify-end justify-start pt-4">
						<button
							className="px-5 py-2 bg-[#262626] text-sm font-medium text-white rounded-md hover:bg-black transition"
							onClick={() => setIsModalOpen(true)}
						>
							Continue
						</button>
					</div>
				</div>
			</div>

			{isModalOpen && (
				<div className="fixed inset-0 flex items-center px-3 md:px-0 justify-center bg-black/50 z-50">
					<div className="bg-white w-full max-w-lg rounded-2xl shadow-lg p-6 relative">
						<div className="flex justify-between items-center mb-6">
							<h2 className="text-xl font-semibold text-black">Verification Action</h2>
							<button className="text-black cursor-pointer" onClick={() => setIsModalOpen(false)}>
								<X size={20} />
							</button>
						</div>

						<div className="space-y-6">
							<div>
								<label className="block text-base mb-2 font-medium text-black">KYC Decision</label>
								<Select value={kycStatus} onValueChange={setKycStatus}>
									<SelectTrigger className="w-full">
										<SelectValue placeholder="Select" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="VERIFIED">Verify</SelectItem>
										<SelectItem value="REJECTED">Reject</SelectItem>
									</SelectContent>
								</Select>

								<Textarea
									placeholder="KYC Remark (optional)"
									value={kycRemark}
									onChange={(e) => setKycRemark(e.target.value)}
									className="mt-3"
								/>
							</div>

							{/* Payment */}
							<div>
								<label className="block text-base mb-2 font-medium text-black">
									Payment Decision
								</label>
								<Select value={paymentStatus} onValueChange={setPaymentStatus}>
									<SelectTrigger className="w-full">
										<SelectValue placeholder="Select" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="VERIFIED">Verify</SelectItem>
										<SelectItem value="REJECTED">Reject</SelectItem>
									</SelectContent>
								</Select>

								<Textarea
									placeholder="Payment Remark (optional)"
									value={paymentRemark}
									onChange={(e) => setPaymentRemark(e.target.value)}
									className="mt-3"
								/>
							</div>
						</div>

						<div className="flex justify-end gap-3 mt-6">
							<button
								className="px-10 py-3 rounded-lg bg-[#262626] text-white text-sm font-medium cursor-pointer"
								onClick={handleSubmit}
							>
								{isPending ? (
									<>
										<Loader2  className='animate-spin w-5 h-5'/>
									</>
								) : (
									<>Submit</>
								)}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
