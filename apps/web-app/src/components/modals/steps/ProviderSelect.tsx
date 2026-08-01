import api from '@/config/axios';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Loader, Mail } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { useModalStore } from '@/store/modal';
import { useGoogleLogin } from '@react-oauth/google';

interface ProviderSelectProps {
	onSelectEmail: (email: string) => void;
	onNextUsername: (user: any) => void;
	onNextReferral: (user: any) => void;
}

export default function ProviderSelect({ onSelectEmail, onNextUsername, onNextReferral }: ProviderSelectProps) {
	const { closeOnboardModal } = useModalStore();
	const { login } = useAuthStore();
	const [email, setEmail] = useState('');
	const [isSendingOtp, setIsSendingOtp] = useState(false);
	const [isOAuthLoading, setIsOAuthLoading] = useState(false);
	const [lastProvider, setLastProvider] = useState<string | null>(null);

	const isValidEmail = /^\S+@\S+\.\S+$/.test(email);

	useEffect(() => {
		const storedLastProvider = localStorage.getItem('last_provider');
		if (storedLastProvider) {
			setLastProvider(storedLastProvider);
		}
	}, []);

	const googleLogin = useGoogleLogin({
		onSuccess: async (tokenResponse) => {
			setIsOAuthLoading(true);
			try {
				const res = await api.post('/auth/google/callback', {
					idToken: tokenResponse.access_token,
				});

				if (res.data.success) {
					localStorage.setItem('last_provider', 'google');

					const { user } = res.data.data;

					if (user.onboardingStatus === 'PENDING_USERNAME') {
						onNextUsername(user);
					} else if (user.onboardingStatus === 'PENDING_PREFERENCES') {
						onNextReferral(user);
					} else {
						login(user);
						closeOnboardModal();
					}
				}
			} catch (error) {
				console.error('Google Auth Failed', error);
			} finally {
				setIsOAuthLoading(false);
			}
		},
	});

	const handleProviderClick = (provider: string) => {
		localStorage.setItem('last_provider', provider);
		setLastProvider(provider);
		if (provider === 'email') {
			handleSendEmailOtp();
		} else if (provider === 'google') {
			googleLogin();
		} else {
			alert(`${provider} OAuth coming soon!`);
		}
	};

	const handleSendEmailOtp = async () => {
		if (!isValidEmail) return;

		setIsSendingOtp(true);
		try {
			await api.post('/auth/send-otp', { email });
			onSelectEmail(email);
		} catch (error: any) {
			alert(error.response?.data?.error || 'Failed to send OTP');
		} finally {
			setIsSendingOtp(false);
		}
	};

	const renderLastUsedIndicator = () => (
		<span className="absolute -top-1 -right-1 flex h-3 w-3 z-10">
			<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
			<span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500 border-2 border-white dark:border-slate-900"></span>
		</span>
	);

	return (
		<motion.div
			initial={{ opacity: 0, scale: 0.98 }}
			animate={{ opacity: 1, scale: 1 }}
			exit={{ opacity: 0, scale: 0.98 }}
			transition={{ duration: 0.3 }}
			className="flex flex-col h-full justify-center max-w-[310px] mx-auto w-full py-2"
		>
			<div className="text-center mb-6">
				<h2 className="text-lg font-medium text-black dark:text-white tracking-tight">
					Continue to Your Account
				</h2>
			</div>

			<div className="flex flex-col gap-3">
				{/* Email Authentication */}
				<div className="flex flex-col relative">
					{lastProvider === 'email' && renderLastUsedIndicator()}
					<div className="relative">
						<Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
						<input
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							placeholder="Email address"
							className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-[#28292E] border border-gray-200 dark:border-white/5 rounded-xl focus:outline-none transition-all text-[13px] text-gray-900 dark:text-white placeholder:text-gray-500"
							onKeyDown={(e) => {
								if (e.key === 'Enter' && isValidEmail) handleProviderClick('email');
							}}
						/>
					</div>
					<button
						className={`mt-2.5 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-[13px] font-medium transition-all shadow-sm active:scale-[0.98] cursor-pointer ${isValidEmail ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-100 dark:bg-white/5 text-gray-400 cursor-not-allowed'}`}
						disabled={!isValidEmail || isSendingOtp}
						onClick={() => handleProviderClick('email')}
					>
						{isSendingOtp ? <Loader className="w-4 h-4 animate-spin" /> : 'Continue with Email'}
					</button>
				</div>

				<div className="flex items-center my-1 opacity-50">
					<div className="flex-1 h-px bg-gray-200 dark:bg-white/10"></div>
					<span className="px-3 text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-widest">OR</span>
					<div className="flex-1 h-px bg-gray-200 dark:bg-white/10"></div>
				</div>

				{/* Social Authentication */}
				<div className="grid grid-cols-1 gap-2.5">
					<button
						className="relative flex items-center justify-center gap-2.5 w-full px-4 py-3 border border-gray-200 dark:border-transparent rounded-xl hover:bg-gray-50 dark:hover:bg-gray-200 transition-all text-[13px] font-medium text-gray-700 dark:text-gray-900 disabled:opacity-50 active:scale-[0.98] bg-white dark:bg-white cursor-pointer shadow-sm"
						disabled={isOAuthLoading}
						onClick={() => handleProviderClick('google')}
					>
						{isOAuthLoading ? <Loader className="w-4 h-4 animate-spin" /> : (
							<>
								{lastProvider === 'google' && renderLastUsedIndicator()}
								<svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" xmlns="http://www.w3.org/2000/svg">
									<path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
									<path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
									<path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
									<path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
								</svg>
								Continue with Google
							</>
						)}
					</button>

					<button
						className="relative flex items-center justify-center gap-2.5 w-full px-4 py-3 border border-gray-200 dark:border-transparent rounded-xl hover:bg-gray-50 dark:hover:bg-gray-200 transition-all text-[13px] font-medium text-gray-700 dark:text-gray-900 disabled:opacity-50 active:scale-[0.98] bg-white dark:bg-white cursor-pointer shadow-sm"
						disabled={isOAuthLoading}
						onClick={() => handleProviderClick('apple')}
					>
						{lastProvider === 'apple' && renderLastUsedIndicator()}
						<svg viewBox="0 0 24 24" className="w-[18px] h-[18px] fill-current text-black" xmlns="http://www.w3.org/2000/svg">
							<path d="M16.365 14.786c-.033-2.617 2.14-3.89 2.235-3.945-1.22-1.782-3.118-2.023-3.8-2.062-1.616-.163-3.155.952-3.978.952-.823 0-2.09-1.002-3.418-.973-1.724.03-3.322.998-4.205 2.533-1.787 3.093-.457 7.675 1.285 10.188.851 1.229 1.862 2.605 3.195 2.553 1.284-.052 1.776-.83 3.324-.83 1.547 0 1.99.83 3.325.801 1.378-.029 2.247-1.256 3.093-2.49 1.054-1.538 1.488-3.031 1.51-3.107-.034-.015-2.9-1.11-2.934-4.04zM15.42 6.541c.699-.844 1.171-2.02 1.042-3.19-.997.04-2.222.664-2.942 1.508-.574.67-1.135 1.874-.985 3.018 1.113.086 2.18-.592 2.885-1.336z" />
						</svg>
						Continue with Apple
					</button>

					<button
						className="relative flex items-center justify-center gap-2.5 w-full px-4 py-3 border border-gray-200 dark:border-transparent rounded-xl hover:bg-gray-50 dark:hover:bg-gray-200 transition-all text-[13px] font-medium text-gray-700 dark:text-gray-900 disabled:opacity-50 active:scale-[0.98] bg-white dark:bg-white cursor-pointer shadow-sm"
						disabled={isOAuthLoading}
						onClick={() => handleProviderClick('telegram')}
					>
						{lastProvider === 'telegram' && renderLastUsedIndicator()}
						<svg viewBox="0 0 24 24" className="w-[18px] h-[18px] fill-[#2AABEE]" xmlns="http://www.w3.org/2000/svg">
							<path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.892-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
						</svg>
						Continue with Telegram
					</button>
				</div>
			</div>
		</motion.div>
	);
}
