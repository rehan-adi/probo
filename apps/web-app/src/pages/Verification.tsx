import { useState } from 'react';
import kycTitleIcon from '@/assets/images/kyc_title.avif';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useSubmitKycMutation } from '@/hooks/mutations/verification';
import { Loader2 } from 'lucide-react';

export default function KycVerificationPage() {
	const [panName, setPanName] = useState('');
	const [panNumber, setPanNumber] = useState('');
	const [DOB, setDOB] = useState<Date | null>(null);
	const [isSubmitted, setIsSubmitted] = useState(false);

	const { mutate, isPending } = useSubmitKycMutation();

	const handleSubmit = async () => {
		if (!DOB) return;

		mutate(
			{ panName, panNumber, DOB: DOB.toISOString().split('T')[0] },
			{
				onSuccess: (data) => {
					console.log('KYC submitted successfully:', data);
					setIsSubmitted(true);
				},
				onError: (error: any) => {
					console.error('Error submitting KYC:', error);
					alert('Something went wrong. Please try again.');
				},
			},
		);
	};

	const isValidPan = (pan: string) => {
		return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan);
	};

	const isFormValid = panName.trim() !== '' && isValidPan(panNumber) && DOB !== null;

	return (
		<div className="w-full min-h-screen bg-[#f4f4f5] flex justify-center items-center">
			<div className="max-w-4xl flex items-start justify-center flex-col md:px-0 px-3 md:py-2 w-full pt-20 md:pt-24">
				<div className="flex items-center justify-center mb-5 gap-3">
					<div className="flex justify-center md:justify-start">
						<img src={kycTitleIcon} alt="KYC Illustration" className="w-16 h-16 object-contain" />
					</div>

					<div className="text-left">
						<h2 className="text-2xl font-semibold">KYC Verification</h2>
						<p className="text-[#545454] text-base">It takes just 5 minutes</p>
					</div>
				</div>

				<div className="w-full bg-white rounded-2xl py-4 px-4">
					<div className="text-sm max-w-[350px] rounded-lg mb-6">
						<h3 className="text-[10px] mb-2 font-semibold text-[#B32306]">IMPORTAMT</h3>
						<p className="text-[#545454] text-sm">
							Bank and PAN card details should be of the same person. Incorrect or different details
							may lead to permanent block.
						</p>
					</div>

					<div className="space-y-10 max-w-[350px]">
						<div>
							<label className="block text-[#262626] mb-1">Name (as in PAN card)</label>
							<input
								type="text"
								placeholder="Type the full name"
								value={panName}
								onChange={(e) => setPanName(e.target.value)}
								className="w-full px-4 py-3 border border-gray-400/40 rounded-lg focus:outline-none"
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
								className="w-full px-4 py-3 border border-gray-400/40 rounded-lg focus:outline-none"
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
								className="w-full px-4 py-3 border border-gray-400/40 rounded-lg focus:outline-none"
							/>
						</div>

						{isSubmitted ? (
							<button
								className="w-full bg-[#262626] text-white py-3 text-sm font-medium rounded-lg transition hover:bg-opacity-90"
								onClick={() => {
									console.log('Proceed to add payment details');
								}}
							>
								Add Payment Details
							</button>
						) : (
							<button
								onClick={handleSubmit}
								disabled={!isFormValid || isPending}
								className={`w-full py-3 text-sm font-medium rounded-lg transition ${
									!isFormValid
										? 'bg-[#EDEDED] text-[#B0B0B0] cursor-not-allowed'
										: 'bg-[#262626] text-white'
								}`}
							>
								{isPending ? <Loader2 className="animate-spin w-4 h-4" /> : <>Continue</>}
							</button>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
