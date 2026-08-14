import { useState } from 'react';
import api from '@/config/axios';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useModalStore } from '@/store/modal';

export default function ReferralAndPrefs() {
	const { closeOnboardModal } = useModalStore();
	const [referralCode, setReferralCode] = useState('');
	const [isSubmittingReferral, setIsSubmittingReferral] = useState(false);

	const handleCompleteOnboarding = async (skipRef = false) => {
		setIsSubmittingReferral(true);
		try {
			const payload: any = {
				notifications: {
					emailNewMarket: true,
					emailOrderFills: true,
					inAppNewMarket: true,
					inAppTradeExecuted: true,
				},
			};

			if (!skipRef && referralCode.trim()) {
				payload.referralCode = referralCode.trim();
			}

			await api.post('/onboarding/preferences', payload);
			closeOnboardModal();
			window.location.reload(); // Reload to hydrate fully and load UI
		} catch (error: any) {
			alert(error.response?.data?.error || 'Failed to complete onboarding');
		} finally {
			setIsSubmittingReferral(false);
		}
	};

	return (
		<motion.div
			initial={{ opacity: 0, scale: 0.98 }}
			animate={{ opacity: 1, scale: 1 }}
			exit={{ opacity: 0, scale: 0.98 }}
			transition={{ duration: 0.3 }}
			className="flex flex-col h-full justify-center max-w-[333px] mx-auto w-full py-4 md:py-2"
		>
			<div className="text-left mb-6">
				<h2 className="text-xl font-semibold text-black dark:text-white tracking-tight">
					Got a referral code from a friend?
				</h2>
				<p className="text-gray-500 dark:text-gray-400 text-sm mt-1.5 font-medium">
					Enter it below for a joining bonus.
				</p>
			</div>

			<div className="flex flex-col relative">
				<input
					type="text"
					value={referralCode}
					onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
					placeholder="Enter code (optional)"
					className="w-full px-4 py-3 bg-gray-50 dark:bg-[#28292E] border border-gray-200 dark:border-white/5 rounded-md focus:outline-none transition-all text-[13px] text-gray-900 dark:text-white placeholder:text-gray-500 placeholder:text-[12px] placeholder:normal-case placeholder:tracking-normal text-left tracking-widest font-medium uppercase"
				/>

				<div className="flex gap-2.5 mt-4">
					<button
						onClick={() => handleCompleteOnboarding(true)}
						disabled={isSubmittingReferral}
						className="flex-1 py-2.5 rounded-md text-[13px] font-medium text-black dark:text-white bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
					>
						Skip
					</button>
					<button
						onClick={() => handleCompleteOnboarding(false)}
						disabled={!referralCode.trim() || isSubmittingReferral}
						className="flex-1 flex justify-center items-center py-2.5 rounded-md text-[13px] font-medium transition-all bg-black text-white hover:bg-gray-900 dark:bg-white dark:text-black dark:hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-black dark:disabled:hover:bg-white cursor-pointer"
					>
						{isSubmittingReferral ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
					</button>
				</div>
			</div>
		</motion.div>
	);
}
