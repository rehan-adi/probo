import { CheckCircle, Clock, XCircle } from 'lucide-react';

export function VerificationPreview({ data }: { data: any }) {

	console.log(data.data)

	return (
		<div className="w-full bg-white rounded-xl py-4 px-4">
			<h1 className="text-black mb-6 text-lg font-medium">KYC Details</h1>
			<div className="space-y-8 max-w-[357px]">
				<div className="relative">
					<label className="block text-[#262626] mb-1">Name (as in PAN card)</label>
					<input
						type="text"
						disabled
						value={data.kyc.panName}
						className="w-full px-3 py-2.5 pr-10 border border-gray-300 rounded-lg cursor-not-allowed text-[#444] bg-gray-50"
					/>
					<span className="absolute right-3 top-11">
						{data.kyc.status === 'PENDING' && <Clock className="w-4 h-4 text-gray-400" />}

						{data.kyc.status === 'VERIFIED' && <CheckCircle className="w-4 h-4 text-green-500" />}

						{data.kyc.status === 'REJECTED' && <XCircle className="w-4 h-4 text-red-500" />}
					</span>
				</div>

				<div className='relative'>
					<label className="block text-[#262626] mb-1">PAN card number</label>
					<input
						type="text"
						disabled
						value={data.kyc.panNumber}
						className="w-full px-3 py-2.5 pr-10 border border-gray-300 rounded-lg cursor-not-allowed text-[#444] bg-gray-50"
					/>
					<span className="absolute right-3 top-11">
						{data.kyc.status === 'PENDING' && <Clock className="w-4 h-4 text-gray-400" />}

						{data.kyc.status === 'VERIFIED' && <CheckCircle className="w-4 h-4 text-green-500" />}

						{data.kyc.status === 'REJECTED' && <XCircle className="w-4 h-4 text-red-500" />}
					</span>
				</div>

				<div className='relative'>
					<label className="block text-[#262626] mb-1">Date of Birth</label>
					<input
						type="text"
						disabled
						value={data.kyc.dob}
						className="w-full px-3 py-2.5 pr-10 border border-gray-300 rounded-lg cursor-not-allowed text-[#444] bg-gray-50"
					/>
					<span className="absolute right-3 top-11">
						{data.kyc.status === 'PENDING' && <Clock className="w-4 h-4 text-gray-400" />}

						{data.kyc.status === 'VERIFIED' && <CheckCircle className="w-4 h-4 text-green-500" />}

						{data.kyc.status === 'REJECTED' && <XCircle className="w-4 h-4 text-red-500" />}
					</span>
				</div>
			</div>

			<div className="space-y-8 max-w-[357px]">
				<h1 className="text-black mt-8 text-lg font-medium">Payment Details</h1>
				{data.paymentMethod.type === 'UPI' ? (
					<div className='relative'>
						<label className="block text-[#262626] mb-1">UPI ID</label>
						<input
							type="text"
							disabled
							value={data.upiId}
							className="w-full px-3 py-2.5 pr-10 border border-gray-300 rounded-lg cursor-not-allowed text-[#444] bg-gray-50"
						/>
						<span className="absolute right-3 top-11">
							{data.kyc.status === 'PENDING' && <Clock className="w-4 h-4 text-gray-400" />}

							{data.kyc.status === 'VERIFIED' && <CheckCircle className="w-4 h-4 text-green-500" />}

							{data.kyc.status === 'REJECTED' && <XCircle className="w-4 h-4 text-red-500" />}
						</span>
					</div>
				) : (
					<>
						<div className='relative'>
							<label className="block text-[#262626] mb-1">Bank Account Number</label>
							<input
								type="text"
								disabled
								value={data.paymentMethod.accountNumber}
								className="w-full px-3 py-2.5 pr-10 border border-gray-300 rounded-lg cursor-not-allowed text-[#444] bg-gray-50"
							/>
							<span className="absolute right-3 top-11">
								{data.paymentMethod.status === 'PENDING' && (
									<Clock className="w-4 h-4 text-gray-400" />
								)}

								{data.paymentMethod.status === 'VERIFIED' && (
									<CheckCircle className="w-4 h-4 text-green-500" />
								)}

								{data.paymentMethod.status === 'REJECTED' && (
									<XCircle className="w-4 h-4 text-red-500" />
								)}
							</span>
						</div>

						<div className='relative'>
							<label className="block text-[#262626] mb-1">IFSC Code</label>
							<input
								type="text"
								disabled
								value={data.paymentMethod.ifscCode}
								className="w-full px-3 py-2.5 pr-10 border border-gray-300 rounded-lg cursor-not-allowed text-[#444] bg-gray-50"
							/>
							<span className="absolute right-3 top-11">
								{data.paymentMethod.status === 'PENDING' && (
									<Clock className="w-4 h-4 text-gray-400" />
								)}

								{data.paymentMethod.status === 'VERIFIED' && (
									<CheckCircle className="w-4 h-4 text-green-500" />
								)}

								{data.paymentMethod.status === 'REJECTED' && (
									<XCircle className="w-4 h-4 text-red-500" />
								)}
							</span>
						</div>
					</>
				)}
			</div>
		</div>
	);
}
