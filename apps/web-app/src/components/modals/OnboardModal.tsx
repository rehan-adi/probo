import OTPInput from '../OtpInput';
import { useEffect, useState } from 'react';
import { useModalStore } from '@/store/modal';
import { useSubmitReferral } from '@/hooks/mutations/referral';
import { Loader, MessageSquare, MoveLeft, Phone, X } from 'lucide-react';
import { useLoginMutation, useVerifyMutation } from '@/hooks/mutations/auth';

export default function OnboardModal() {
	const { onboardModalOpen, closeOnboardModal } = useModalStore();

	const loginMutation = useLoginMutation();
	const verifyMutation = useVerifyMutation();
	const { mutate: submitReferral } = useSubmitReferral();

	const [phone, setPhone] = useState('');
	const [referralCode, setReferralCode] = useState('');

	const [isChecked, setIsChecked] = useState(false);
	const [step, setStep] = useState<'phone' | 'otp' | 'referral'>('phone');

	const [secondsLeft, setSecondsLeft] = useState(30);
	const [canResend, setCanResend] = useState(false);

	const [otpCode, setOtpCode] = useState('');
	const [isVerifying, setIsVerifying] = useState(false);
	const [isSubmittingReferral, setIsSubmittingReferral] = useState(false);

	const [_, setIsResending] = useState(false);

	useEffect(() => {
		if (step === 'otp' && secondsLeft > 0) {
			const timer = setInterval(() => {
				setSecondsLeft((prev) => prev - 1);
			}, 1000);

			return () => clearInterval(timer);
		}

		if (secondsLeft === 0) {
			setCanResend(true);
		}
	}, [step, secondsLeft]);

	if (!onboardModalOpen) return null;

	const isValidIndianPhone = (phone: string) => {
		return /^[6-9]\d{9}$/.test(phone);
	};
	const isValidOtp = (otp: string) => /^\d{6}$/.test(otp);
	const isPhoneValid = isValidIndianPhone(phone);
	const isOtpValid = isValidOtp(otpCode);

	const handleGetOtp = () => {
		if (!isValidIndianPhone(phone)) {
			alert('Please enter a valid Indian phone number');
			return;
		}
		if (!isChecked) {
			alert('Please accept the terms to continue');
			return;
		}

		setIsResending(true);
		loginMutation.mutate(phone, {
			onSuccess: () => {
				setStep('otp');
			},
			onError: () => alert('Failed to send OTP'),
			onSettled: () => setIsResending(false),
		});
	};

	const handleVerifyOtp = () => {
		if (!isValidOtp(otpCode)) {
			alert('Please enter a valid 6-digit OTP');
			return;
		}
		setIsVerifying(true);
		verifyMutation.mutate(
			{ phone, otp: otpCode },
			{
				onSuccess: (res) => {
					const { isNewUser } = res.data.data;

					console.log('OTP verified successfully', res.data.data.isNewUser);

					if (isNewUser) {
						setStep('referral');
					} else {
						closeOnboardModal();
						window.location.href = '/';
					}
				},

				onError: () => alert('OTP verification failed'),
				onSettled: () => setIsVerifying(false),
			},
		);
	};

	const handleResend = () => {
		loginMutation.mutate(phone, {
			onSuccess: () => {
				setSecondsLeft(60);
				setCanResend(false);
			},
			onError: () => {
				alert('Failed to resend OTP');
			},
		});
	};

	const handleReferralSubmit = (referralCode?: string) => {
		const trimmedCode = referralCode?.trim();
		const skip = !trimmedCode;

		const payload = skip ? { skip: true } : { referralCode: trimmedCode! };

		setIsSubmittingReferral(true);
		submitReferral(payload, {
			onSuccess: () => {
				closeOnboardModal();
				window.location.href = '/';
			},
			onError: () => {
				alert('Referral failed');
			},
			onSettled: () => {
				setIsSubmittingReferral(false);
			},
		});
	};

	return (
		<div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
			<div className="bg-white px-6 pt-20 pb-4 rounded-xl w-[90%] max-w-xl relative">
				<button
					className="absolute top-3.5 right-4 text-2xl font-bold text-gray-500 cursor-pointer"
					onClick={closeOnboardModal}
				>
					<X />
				</button>

				{step === 'phone' && (
					<div className="md:px-16 px-0">
						<h2 className="text-xl font-semibold mb-1">Enter your mobile number</h2>
						<p className="text-[#757575] text-sm mb-6">We’ll send you an OTP</p>

						<div className="flex items-center border border-gray-500/20 rounded-xl overflow-hidden mb-4">
							<span className="px-6 border-r border-gray-500/20 py-3.5 text-base text-[#262626] select-none">
								+91
							</span>
							<input
								type="tel"
								value={phone}
								onChange={(e) => setPhone(e.target.value)}
								placeholder="Phone number"
								className="flex-1 px-8 py-2 focus:outline-none text-base placeholder:text-[#757575]"
							/>
						</div>

						<div className="flex items-start gap-2 mt-6">
							<input
								type="checkbox"
								id="agree"
								checked={isChecked}
								onChange={(e) => setIsChecked(e.target.checked)}
								className="mt-1 cursor-pointer"
							/>
							<label
								htmlFor="agree"
								className="text-sm text-[#757575] leading-tight cursor-pointer"
							>
								This game may be habit forming or financially risky. Play responsibly.{' '}
								<span className="text-blue-600 underline">Terms and Conditions</span> and{' '}
								<span className="text-blue-600 underline">Privacy Policy</span> apply. I certify
								that I am above 18 years. Participation is permitted only as per the applicable
								state laws.
							</label>
						</div>

						<button
							className={`mt-12 px-4 py-4 rounded-2xl w-full text-sm font-medium transition-opacity ${
								isChecked && isPhoneValid
									? 'bg-[#262626] text-white opacity-100'
									: 'bg-[#262626] text-white opacity-50 cursor-not-allowed'
							}`}
							disabled={!isChecked || !isValidIndianPhone(phone)}
							onClick={handleGetOtp}
						>
							Get OTP
						</button>
					</div>
				)}

				{step === 'otp' && (
					<div className="md:px-20 px-0">
						<button
							onClick={() => setStep('phone')}
							className="text-base cursor-pointer font-medium mb-5 text-[#545454] flex items-center gap-1"
						>
							<span className="text-lg font-normal mr-1">
								<MoveLeft />
							</span>{' '}
							Back
						</button>

						<h2 className="text-xl font-semibold mb-1">Verify phone</h2>
						<p className="text-[#757575] text-sm mb-6">OTP has been sent to +91 {phone}</p>

						<OTPInput value={otpCode} onChange={setOtpCode} />

						<span className="text-sm mt-1 text-[#757575]">
							{canResend ? (
								<>
									Didn’t receive OTP?
									<button
										onClick={() => {
											handleResend();
											setSecondsLeft(60);
											setCanResend(false);
										}}
										className="text-[#1975F3] font-medium ml-1"
									>
										Resend OTP
									</button>
								</>
							) : (
								<>
									Resend OTP in{' '}
									<span className="text-[#1975F3] font-semibold">{secondsLeft} sec</span>
								</>
							)}
						</span>

						<div className="flex items-center justify-start mt-2.5 gap-4">
							<span className="flex gap-1 justify-center items-center text-[#197BFF]">
								<MessageSquare size={19} className="" />
								SMS
							</span>
							<span className="flex justify-center items-center gap-1 text-[#197BFF]">
								<Phone size={19} className="" />
								Call
							</span>
						</div>

						<button
							className={`mt-8 px-4 py-4 rounded-2xl w-full text-sm font-medium transition-opacity ${
								isChecked && isOtpValid && !isVerifying
									? 'bg-[#262626] text-white opacity-100'
									: 'bg-[#262626] text-white opacity-50 cursor-not-allowed'
							}`}
							disabled={!isChecked || !isOtpValid || isVerifying}
							onClick={handleVerifyOtp}
						>
							{isVerifying ? 'Verifying...' : 'Verify'}
						</button>
					</div>
				)}

				{step === 'referral' && (
					<div className="md:px-16 px-0">
						<h2 className="text-xl font-semibold mb-6">Got a referral code?</h2>

						<div className="flex items-center border border-gray-500/20 rounded-xl overflow-hidden mb-12">
							<input
								type="text"
								value={referralCode}
								onChange={(e) => setReferralCode(e.target.value)}
								placeholder="Enter referral code"
								className="flex-1 px-6 py-3.5 focus:outline-none text-base placeholder:text-[#757575]"
							/>
						</div>

						<div className="flex flex-col gap-4 mt-6 mb-4">
							<button
								onClick={() => handleReferralSubmit(referralCode)}
								disabled={!referralCode.trim() || isSubmittingReferral}
								className={`flex-1 px-4 py-4 rounded-2xl text-sm font-medium transition-opacity ${
									referralCode.trim() && !isSubmittingReferral
										? 'bg-[#262626] text-white cursor-pointer opacity-100'
										: 'bg-[#262626] text-white cursor-not-allowed'
								}`}
							>
								{isSubmittingReferral ? <Loader className="animate-spin w-6 h-6" /> : 'Continue'}
							</button>

							<button
								onClick={() => handleReferralSubmit(undefined)}
								className="flex-1 px-4 py-4 rounded-2xl text-sm font-medium border border-gray-400/30 cursor-pointer text-[#262626]"
							>
								Skip
							</button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
