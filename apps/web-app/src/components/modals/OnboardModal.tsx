import { MoveLeft, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useModalStore } from '@/store/modal';
import OTPInput from '../input';

export default function OnboardModal() {
	const { onboardModalOpen, closeOnboardModal } = useModalStore();

	const [phone, setPhone] = useState('');
	const [isChecked, setIsChecked] = useState(false);
	const [step, setStep] = useState<'phone' | 'otp'>('phone');

	const [secondsLeft, setSecondsLeft] = useState(30);
	const [canResend, setCanResend] = useState(false);

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

	const handleResend = async () => {
		try {
		} catch (error) {}
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
							className={`mt-12 bg-[#262626] text-white px-4 py-4 rounded-2xl w-full text-sm font-medium transition-opacity ${
								isChecked ? 'opacity-100' : 'opacity-50 cursor-not-allowed'
							}`}
							disabled={!isChecked}
							onClick={() => {
								if (phone.length < 10) {
									alert('Please enter a valid phone number');
									return;
								}
								setStep('otp');
							}}
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
							<span className="text-lg mr-1">
								<MoveLeft />
							</span>{' '}
							Back
						</button>

						<h2 className="text-xl font-semibold mb-1">Verify phone</h2>
						<p className="text-[#757575] text-sm mb-6">OTP has been sent to +91 {phone}</p>
						<OTPInput
							onComplete={(otpCode) => {
								console.log('Entered OTP:', otpCode);
								fetch('/api/verify-otp', {
									method: 'POST',
									headers: {
										'Content-Type': 'application/json',
									},
									body: JSON.stringify({ phone, otp: otpCode }),
								})
									.then((res) => {
										if (!res.ok) throw new Error('OTP verification failed');
										return res.json();
									})
									.then((data) => {
										console.log('OTP verified successfully', data);
										closeOnboardModal();
										window.location.href = '/';
									})
									.catch(() => {});
							}}
						/>
						<span className="text-sm mt-4 text-[#757575]">
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

						<button
							className={`mt-12 bg-[#262626] text-white px-4 py-4 rounded-2xl w-full text-sm font-medium transition-opacity ${
								isChecked ? 'opacity-100' : 'opacity-50 cursor-not-allowed'
							}`}
							onClick={() => {
								closeOnboardModal();
								window.location.href = '/';
							}}
						>
							Verify
						</button>
					</div>
				)}
			</div>
		</div>
	);
}
