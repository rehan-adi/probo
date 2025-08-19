import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import kycTitleIcon from '@/assets/images/kyc_title.avif';
import { VerificationPreview } from '@/components/VerificationPreview';
import { useSubmitKycMutation, useSubmitPaymentMutation } from '@/hooks/mutations/verification';
import { useGetVerificationStatus, useGetVerificationDetails } from '@/hooks/queries/verification';

export default function KycVerificationPage() {
	// kyc related states
	const [panName, setPanName] = useState('');
	const [panNumber, setPanNumber] = useState('');
	const [DOB, setDOB] = useState<Date | null>(null);

	// payment related states
	const [ifscCode, setIfscCode] = useState('');
	const [upiId, setUpiId] = useState('');
	const [bankAccountNumber, setBankAccountNumber] = useState('');
	const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'BANK'>('BANK');

	const { data: verificationData } = useGetVerificationDetails();
	const { data: statusData, isLoading, refetch } = useGetVerificationStatus();
	const { mutate: submitKyc, isPending: kycPending } = useSubmitKycMutation();
	const { mutate: submitPayment, isPending: paymentPending } = useSubmitPaymentMutation();

	const handleSubmitKyc = () => {
		if (!DOB) return;
		submitKyc(
			{ panName, panNumber, DOB: DOB.toISOString().split('T')[0] },
			{
				onSuccess: () => {
					refetch();
				},
			},
		);
	};

	const handleSubmitPayment = () => {
		if (paymentMethod === 'UPI' && !upiId) return;
		if (paymentMethod === 'BANK' && (!bankAccountNumber || !ifscCode)) return;

		submitPayment(
			{
				upiId,
				bankAccountNumber,
				ifscCode,
			},
			{
				onSuccess: () => {
					refetch();
				},
			},
		);
	};

	const isValidPan = (pan: string) => /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan);
	const isFormValid = panName.trim() !== '' && isValidPan(panNumber) && DOB !== null;

	if (isLoading) {
		return (
			<div className="flex justify-center bg-[#f4f4f5] items-center h-screen">
				<Loader2 className="animate-spin w-6 h-6" />
			</div>
		);
	}

	const { kycVerificationStatus, paymentVerificationStatus } = statusData?.data.data || {};

	console.log(verificationData);
	console.log(kycVerificationStatus);
	console.log(paymentVerificationStatus);

	return (
		<div className="w-full bg-[#f4f4f5] flex justify-center items-start">
			<div className="max-w-[950px] flex flex-col items-start px-3 md:py-2 w-full pt-20 md:pt-[90px]">
				<div className="flex items-center mb-4 gap-4">
					<img src={kycTitleIcon} alt="KYC Illustration" className="w-16 h-16 object-contain" />
					<div>
						<h2 className="text-2xl font-semibold">KYC verification</h2>
						<p className="text-[#545454] text-base">It takes just 5 minutes</p>
					</div>
				</div>

				<div className="w-full rounded-xl">
					{(kycVerificationStatus === 'NOT_VERIFIED' || kycVerificationStatus === 'REJECTED') && (
						<div className="w-full bg-white rounded-xl py-4 px-4">
							<div className="text-sm max-w-[357px] rounded-lg mb-6">
								<h3 className="text-[10px] mb-1.5 font-semibold text-[#B32306] tracking-wide">
									IMPORTAMT
								</h3>
								<p className="text-[#545454] text-sm">
									Bank and PAN card details should be of the same person. Incorrect or different
									details may lead to permanent block.
								</p>
							</div>

							<div className="space-y-10 max-w-[357px]">
								<div>
									<label className="block text-[#262626] mb-1">Name (as in PAN card)</label>
									<input
										type="text"
										placeholder="Type the full name"
										value={panName}
										onChange={(e) => setPanName(e.target.value)}
										className="w-full px-3 py-3 border border-gray-400/30 rounded-lg focus:outline-none"
									/>
								</div>

								<div>
									<label className="block text-[#262626] mb-1">PAN card number</label>
									<input
										type="text"
										placeholder="PAN number (10 digits)"
										maxLength={10}
										value={panNumber}
										onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
										className="w-full px-3 py-3 border border-gray-400/30 rounded-lg focus:outline-none"
									/>
								</div>

								<div>
									<label className="block text-[#262626] mb-1">Date of Birth</label>
									<DatePicker
										onChange={(date: Date | null) => setDOB(date)}
										dateFormat="dd/MM/yyyy"
										placeholderText="DD/MM/YYYY"
										showMonthDropdown
										selected={DOB}
										showYearDropdown
										dropdownMode="select"
										wrapperClassName="w-full"
										className="w-full px-3 py-3 border border-gray-400/30 rounded-lg focus:outline-none"
									/>
								</div>

								<button
									onClick={handleSubmitKyc}
									disabled={!isFormValid || kycPending}
									className={`w-full py-3 text-sm font-semibold rounded-lg ${
										!isFormValid
											? 'bg-[#EDEDED] text-[#B0B0B0] cursor-not-allowed'
											: 'bg-[#262626] text-white cursor-pointer'
									}`}
								>
									{kycPending ? <Loader2 className="animate-spin w-4 h-4" /> : 'Continue'}
								</button>
							</div>
						</div>
					)}

					{kycVerificationStatus === 'PENDING' &&
						(paymentVerificationStatus === 'NOT_VERIFIED' ||
							paymentVerificationStatus === 'REJECTED') && (
							<div className="w-full rounded-xl bg-white min-h-[50vh] py-4 px-4">
								<div className="text-sm max-w-[357px] rounded-lg mb-6">
									<h3 className="text-[10px] mb-2 font-semibold text-green-700">PAYMENT DETAILS</h3>
									<p className="text-[#545454] text-sm">
										Please provide your payment method. Make sure the details are correct to avoid
										failed transactions.
									</p>
								</div>

								<div className="space-y-10 max-w-[350px]">
									<div>
										<label className="block text-[#262626] mb-2 font-medium">
											Select Payment Method
										</label>
										<div className="flex items-center gap-6">
											<label className="flex items-center gap-2 cursor-pointer">
												<input
													type="radio"
													checked={paymentMethod === 'BANK'}
													onChange={() => setPaymentMethod('BANK')}
													className="accent-[#262626]"
												/>
												Bank
											</label>
											<label className="flex items-center gap-2 cursor-pointer">
												<input
													type="radio"
													checked={paymentMethod === 'UPI'}
													onChange={() => setPaymentMethod('UPI')}
													className="accent-[#262626]"
												/>
												UPI
											</label>
										</div>
									</div>

									{paymentMethod === 'UPI' && (
										<div>
											<label className="block text-[#262626] mb-1">UPI ID</label>
											<input
												type="text"
												placeholder="example@upi"
												value={upiId}
												onChange={(e) => setUpiId(e.target.value)}
												className="w-full px-3 py-3 border border-gray-400/30 rounded-lg focus:outline-none"
											/>
										</div>
									)}

									{paymentMethod === 'BANK' && (
										<>
											<div>
												<label className="block text-[#262626] mb-1">Bank Account Number</label>
												<input
													type="text"
													placeholder="Enter account number"
													value={bankAccountNumber}
													onChange={(e) => setBankAccountNumber(e.target.value)}
													className="w-full px-3 py-3 border border-gray-400/30 rounded-lg focus:outline-none"
												/>
											</div>
											<div>
												<label className="block text-[#262626] mb-1">IFSC Code</label>
												<input
													type="text"
													placeholder="Enter IFSC code"
													value={ifscCode}
													onChange={(e) => setIfscCode(e.target.value)}
													className="w-full px-4 py-3 border border-gray-400/40 rounded-lg focus:outline-none"
												/>
											</div>
										</>
									)}

									<button
										onClick={handleSubmitPayment}
										disabled={paymentPending}
										className={`w-full py-3 text-sm font-semibold rounded-lg ${
											paymentPending
												? 'bg-[#EDEDED] text-[#B0B0B0] cursor-not-allowed'
												: 'bg-[#262626] text-white cursor-pointer'
										}`}
									>
										{paymentPending ? (
											<Loader2 className="animate-spin w-4 h-4" />
										) : (
											'Submit Payment'
										)}
									</button>
								</div>
							</div>
						)}

					{kycVerificationStatus === 'VERIFIED' &&
						(paymentVerificationStatus === 'NOT_VERIFIED' ||
							paymentVerificationStatus === 'REJECTED') && (
							<div className="w-full rounded-xl bg-white min-h-[50vh] py-4 px-4">
								<div className="text-sm max-w-[357px] rounded-lg mb-6">
									<h3 className="text-[10px] mb-2 font-semibold text-green-700">PAYMENT DETAILS</h3>
									<p className="text-[#545454] text-sm">
										Please provide your payment method. Make sure the details are correct to avoid
										failed transactions.
									</p>
								</div>

								<div className="space-y-10 max-w-[350px]">
									<div>
										<label className="block text-[#262626] mb-2 font-medium">
											Select Payment Method
										</label>
										<div className="flex items-center gap-6">
											<label className="flex items-center gap-2 cursor-pointer">
												<input
													type="radio"
													checked={paymentMethod === 'BANK'}
													onChange={() => setPaymentMethod('BANK')}
													className="accent-[#262626]"
												/>
												Bank
											</label>
											<label className="flex items-center gap-2 cursor-pointer">
												<input
													type="radio"
													checked={paymentMethod === 'UPI'}
													onChange={() => setPaymentMethod('UPI')}
													className="accent-[#262626]"
												/>
												UPI
											</label>
										</div>
									</div>

									{paymentMethod === 'UPI' && (
										<div>
											<label className="block text-[#262626] mb-1">UPI ID</label>
											<input
												type="text"
												placeholder="example@upi"
												value={upiId}
												onChange={(e) => setUpiId(e.target.value)}
												className="w-full px-3 py-3 border border-gray-400/30 rounded-lg focus:outline-none"
											/>
										</div>
									)}

									{paymentMethod === 'BANK' && (
										<>
											<div>
												<label className="block text-[#262626] mb-1">Bank Account Number</label>
												<input
													type="text"
													placeholder="Enter account number"
													value={bankAccountNumber}
													onChange={(e) => setBankAccountNumber(e.target.value)}
													className="w-full px-3 py-3 border border-gray-400/30 rounded-lg focus:outline-none"
												/>
											</div>
											<div>
												<label className="block text-[#262626] mb-1">IFSC Code</label>
												<input
													type="text"
													placeholder="Enter IFSC code"
													value={ifscCode}
													onChange={(e) => setIfscCode(e.target.value)}
													className="w-full px-4 py-3 border border-gray-400/40 rounded-lg focus:outline-none"
												/>
											</div>
										</>
									)}

									<button
										onClick={handleSubmitPayment}
										disabled={paymentPending}
										className={`w-full py-3 text-sm font-semibold rounded-lg ${
											paymentPending
												? 'bg-[#EDEDED] text-[#B0B0B0] cursor-not-allowed'
												: 'bg-[#262626] text-white cursor-pointer'
										}`}
									>
										{paymentPending ? (
											<Loader2 className="animate-spin w-4 h-4" />
										) : (
											'Submit Payment'
										)}
									</button>
								</div>
							</div>
						)}

					{((kycVerificationStatus === 'PENDING' && paymentVerificationStatus === 'PENDING') ||
						(kycVerificationStatus === 'VERIFIED' && paymentVerificationStatus === 'VERIFIED')) && (
						<VerificationPreview data={verificationData?.data.data} />
					)}
				</div>
			</div>
		</div>
	);
}
