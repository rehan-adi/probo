import { clsx } from 'clsx';
import api from '@/config/axios';
import { OTPInput } from 'input-otp';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth';
import { useModalStore } from '@/store/modal';
import { Loader2, ArrowLeft, RefreshCw } from 'lucide-react';

interface EmailOtpProps {
	email: string;
	onBack: () => void;
	onNextUsername: (user: any) => void;
	onNextReferral: (user: any) => void;
}

export default function EmailOtp({ email, onBack, onNextUsername, onNextReferral }: EmailOtpProps) {
	const { closeOnboardModal } = useModalStore();
	const { login } = useAuthStore();

	const [otpCode, setOtpCode] = useState('');
	const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
	const [secondsLeft, setSecondsLeft] = useState(120);
	const [canResend, setCanResend] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (secondsLeft > 0) {
			const timer = setInterval(() => setSecondsLeft((prev) => prev - 1), 1000);
			return () => clearInterval(timer);
		} else {
			setCanResend(true);
		}
	}, [secondsLeft]);

	useEffect(() => {
		if (otpCode.length === 6) {
			handleVerifyOtp(otpCode);
		}
	}, [otpCode]);

	const handleSendEmailOtp = async () => {
		try {
			await api.post('/auth/init-signin', { email });
			setSecondsLeft(60);
			setCanResend(false);
			setError(null);
		} catch (error: any) {
			setError(error.response?.data?.error || 'Failed to resend OTP');
		}
	};

	const handleVerifyOtp = async (code: string) => {
		setIsVerifyingOtp(true);
		setError(null);
		try {
			const res = await api.post('/auth/verify-otp', { email, otp: code });
			const userData = res.data.data;

			login(userData);

			if (userData.onboardingStatus === 'PENDING_USERNAME') {
				onNextUsername(userData);
			} else if (userData.onboardingStatus === 'PENDING_PREFERENCES') {
				onNextReferral(userData);
			} else {
				closeOnboardModal();
			}
		} catch (error: any) {
			setError(error.response?.data?.error || 'Invalid or expired OTP');
		} finally {
			setIsVerifyingOtp(false);
		}
	};

	return (
		<motion.div
			initial={{ opacity: 0, scale: 0.98 }}
			animate={{ opacity: 1, scale: 1 }}
			exit={{ opacity: 0, scale: 0.98 }}
			transition={{ duration: 0.3 }}
			className="flex flex-col h-full justify-center max-w-sm mx-auto w-full py-4 relative"
		>
			<button
				onClick={onBack}
				className="absolute -top-4 -left-4 text-sm font-medium text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors flex items-center gap-1.5 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 cursor-pointer"
			>
				<ArrowLeft className="w-4 h-4" />
			</button>

			<div className="text-left mb-8 w-full mt-4">
				<h2 className="text-[22px] font-semibold mb-2 text-gray-900 dark:text-white tracking-tight">Check your email</h2>
				<p className="text-gray-500 dark:text-gray-400 text-[13px] font-medium leading-relaxed max-w-[260px]">
					We've sent a 6-digit verification code to <span className="font-semibold text-gray-900 dark:text-white">{email}</span>
				</p>
			</div>

			<div className="flex flex-col items-start w-full">
				<div className={`transition-opacity duration-300 w-full ${isVerifyingOtp ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
					<OTPInput
						maxLength={6}
						value={otpCode}
						onChange={(val) => {
							setOtpCode(val);
							if (error) setError(null);
						}}
						render={({ slots }) => (
							<div className="flex gap-2 w-full justify-between sm:justify-start sm:gap-2.5">
								{slots.map((slot, idx) => (
									<div
										key={idx}
										className={clsx(
											"relative flex items-center justify-center w-10 h-12 text-xl font-bold rounded-md transition-all duration-300",
											"border bg-gray-50 dark:bg-white/5 shadow-none",
											slot.isActive
												? "border-black bg-white dark:border-white dark:bg-white/10 z-10"
												: "border-gray-200 dark:border-white/10",
											slot.char && !slot.isActive ? "border-gray-300 dark:border-white/20" : "",
											"text-gray-900 dark:text-white"
										)}
									>
										{slot.char !== null && <div>{slot.char}</div>}
										{slot.hasFakeCaret && (
											<div className="pointer-events-none absolute inset-0 flex items-center justify-center animate-pulse">
												<div className="w-[2px] h-5 bg-black dark:bg-white rounded-full" />
											</div>
										)}
									</div>
								))}
							</div>
						)}
					/>
				</div>

				<div className="mt-4 h-12 w-full flex flex-col items-start justify-center text-sm">
					{isVerifyingOtp ? (
						<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-black dark:text-white font-medium">
							<Loader2 className="animate-spin w-4 h-4" />
							Verifying...
						</motion.div>
					) : error ? (
						<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-500 font-medium bg-red-50 dark:bg-red-500/10 px-4 py-2 rounded-lg w-full text-left">
							{error}
						</motion.div>
					) : canResend ? (
						<button onClick={handleSendEmailOtp} className="flex items-center gap-1.5 text-black dark:text-white font-semibold hover:underline bg-gray-100 dark:bg-white/10 px-4 py-2 rounded-md transition-colors cursor-pointer">
							<RefreshCw className="w-4 h-4" /> Resend code
						</button>
					) : (
						<p className="text-gray-500 dark:text-gray-400 font-medium">
							Resend code in <span className="font-bold text-gray-900 dark:text-white">{secondsLeft}s</span>
						</p>
					)}
				</div>


			</div>
		</motion.div>
	);
}
