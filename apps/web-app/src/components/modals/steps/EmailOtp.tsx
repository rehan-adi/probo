import { clsx } from 'clsx';
import { OTPInput } from 'input-otp';
import api from '@/config/axios';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth';
import { useModalStore } from '@/store/modal';
import { Loader, ArrowLeft, RefreshCw, Mail } from 'lucide-react';

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
	const [secondsLeft, setSecondsLeft] = useState(60);
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
			await api.post('/auth/send-otp', { email });
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

			<div className="text-center mb-8">
				<div className="mx-auto w-12 h-12 bg-blue-50 dark:bg-blue-900/20 text-blue-500 rounded-full flex items-center justify-center mb-4">
					<Mail className="w-6 h-6" />
				</div>
				<h2 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white tracking-tight">Check your email</h2>
				<p className="text-gray-500 dark:text-gray-400 text-sm font-medium leading-relaxed">
					We've sent a verification code to <br />
					<span className="font-bold text-gray-900 dark:text-white">{email}</span>
				</p>
			</div>

			<div className="flex flex-col items-center">
				<div className={`transition-opacity duration-300 ${isVerifyingOtp ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
					<OTPInput
						maxLength={6}
						value={otpCode}
						onChange={(val) => {
							setOtpCode(val);
							if (error) setError(null);
						}}
						render={({ slots }) => (
							<div className="flex gap-2.5">
								{slots.map((slot, idx) => (
									<div
										key={idx}
										className={clsx(
											"relative flex items-center justify-center w-12 h-14 text-2xl font-bold rounded-md transition-all duration-300",
											"border bg-gray-50 dark:bg-white/5 shadow-none",
											slot.isActive
												? "border-blue-500 bg-white dark:bg-white/10 z-10"
												: "border-gray-200 dark:border-white/10",
											slot.char && !slot.isActive ? "border-gray-300 dark:border-white/20" : "",
											"text-gray-900 dark:text-white"
										)}
									>
										{slot.char !== null && <div>{slot.char}</div>}
										{slot.hasFakeCaret && (
											<div className="pointer-events-none absolute inset-0 flex items-center justify-center animate-pulse">
												<div className="w-[2px] h-6 bg-blue-500 rounded-full" />
											</div>
										)}
									</div>
								))}
							</div>
						)}
					/>
				</div>

				<div className="mt-8 h-12 w-full flex flex-col items-center justify-center text-sm">
					{isVerifyingOtp ? (
						<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-blue-600 font-medium">
							<Loader className="animate-spin w-4 h-4" />
							Verifying your code...
						</motion.div>
					) : error ? (
						<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-500 font-medium bg-red-50 dark:bg-red-500/10 px-4 py-2 rounded-lg w-full text-center">
							{error}
						</motion.div>
					) : canResend ? (
						<button onClick={handleSendEmailOtp} className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-semibold hover:underline bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-lg transition-colors cursor-pointer">
							<RefreshCw className="w-4 h-4" /> Resend code
						</button>
					) : (
						<p className="text-gray-500 dark:text-gray-400 font-medium">
							Resend code in <span className="font-bold text-gray-900 dark:text-white">{secondsLeft}s</span>
						</p>
					)}
				</div>

				{!isVerifyingOtp && (
					<button onClick={onBack} className="mt-6 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors underline underline-offset-4 decoration-gray-300 dark:decoration-slate-700 cursor-pointer">
						Change Email
					</button>
				)}
			</div>
		</motion.div>
	);
}
