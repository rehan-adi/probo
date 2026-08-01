import EmailOtp from './steps/EmailOtp';
import type { PanInfo } from 'framer-motion';
import { useModalStore } from '@/store/modal';
import UsernameSetup from './steps/UsernameSetup';
import { useState, useEffect, useRef } from 'react';
import ProviderSelect from './steps/ProviderSelect';
import ReferralAndPrefs from './steps/ReferralAndPrefs';
import { AnimatePresence, motion, useDragControls } from 'framer-motion';

type AuthStep = 'provider' | 'email-otp' | 'username' | 'referral';

export default function AuthModal() {
	const { onboardModalOpen, closeOnboardModal } = useModalStore();
	const [step, setStep] = useState<AuthStep>('provider');
	const [email, setEmail] = useState('');

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const [tempUser, setTempUser] = useState<any>(null);

	const [isMobile, setIsMobile] = useState(false);
	const dragControls = useDragControls();
	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const checkMobile = () => setIsMobile(window.innerWidth < 768);
		checkMobile();
		window.addEventListener('resize', checkMobile);
		return () => window.removeEventListener('resize', checkMobile);
	}, []);

	useEffect(() => {
		if (onboardModalOpen) {
			setStep('provider');
			setEmail('');
		}
	}, [onboardModalOpen]);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape' && onboardModalOpen) closeOnboardModal();
		};
		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [onboardModalOpen, closeOnboardModal]);

	const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
		if (info.offset.y > 100 || info.velocity.y > 500) {
			closeOnboardModal();
		}
	};

	const modalVariants = isMobile
		? {
			hidden: { y: '100%' },
			visible: { y: 0, transition: { type: 'spring', damping: 25, stiffness: 200 } },
			exit: { y: '100%', transition: { type: 'spring', damping: 25, stiffness: 200 } }
		}
		: {
			hidden: { opacity: 0, scale: 0.95 },
			visible: { opacity: 1, scale: 1, transition: { duration: 0.2, ease: 'easeOut' } },
			exit: { opacity: 0, scale: 0.95, transition: { duration: 0.15, ease: 'easeIn' } }
		};

	return (
		<AnimatePresence>
			{onboardModalOpen && (
				<div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center sm:p-4">
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						onClick={closeOnboardModal}
						className="absolute inset-0 bg-black/60 backdrop-blur-sm"
					/>

					<motion.div
						ref={containerRef}
						variants={modalVariants}
						initial="hidden"
						animate="visible"
						exit="exit"
						drag={isMobile ? "y" : false}
						dragControls={dragControls}
						dragListener={false}
						dragConstraints={{ top: 0 }}
						dragElastic={0.2}
						onDragEnd={handleDragEnd}
						className="w-full md:w-[720px] bg-white dark:bg-[#1C1C1E] md:rounded-[24px] rounded-t-[24px] shadow-2xl relative z-10 flex flex-col md:flex-row overflow-hidden md:h-[420px] max-h-[90vh]"
					>

						{isMobile && (
							<div
								className="w-full flex justify-center py-4 cursor-grab active:cursor-grabbing shrink-0 z-20 absolute top-0 bg-transparent touch-none"
								onPointerDown={(e) => dragControls.start(e)}
							>
								<div className="w-12 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600" />
							</div>
						)}

						<div className="w-full h-full flex flex-col md:flex-row overflow-y-auto scrollbar-hide pt-10 md:pt-0">

							{/* Left Panel - Marketing / Brand */}
							<div className="w-full md:w-[42%] bg-blue-600 relative overflow-hidden flex flex-col justify-between p-8 md:p-10 shrink-0">
								{/* Background CSS Art */}
								<div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-800" />

								{/* Abstract Geometric Elements */}
								<div className="absolute -top-20 -left-20 w-56 h-56 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-40" />
								<div className="absolute top-1/3 -right-10 w-40 h-40 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-40" />
								<div className="absolute -bottom-24 left-1/4 w-64 h-64 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30" />

								{/* Simple Marketing Content */}
								<div className="relative z-10 flex flex-col h-full justify-between">
									<div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20">
										<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline><polyline points="16 7 22 7 22 13"></polyline></svg>
									</div>
									
									<div className="text-white mt-auto">
										<h2 className="text-2xl font-bold mb-3 tracking-tight leading-snug">
											Trade on Real<br />World Events
										</h2>
										<p className="text-blue-100/80 text-[14px] font-normal leading-relaxed">
											Fast markets. Instant execution. Join millions predicting the future.
										</p>
									</div>
								</div>
							</div>

							{/* Right Panel - Auth Steps */}
							<div className="w-full md:w-[58%] px-6 py-6 md:px-8 md:py-8 relative flex flex-col justify-center">
								<AnimatePresence mode="wait">
									{step === 'provider' && (
										<ProviderSelect
											key="provider"
											onSelectEmail={(email) => {
												setEmail(email);
												setStep('email-otp');
											}}
											onNextUsername={(user) => {
												setTempUser(user);
												setStep('username');
											}}
											onNextReferral={(user) => {
												setTempUser(user);
												setStep('referral');
											}}
										/>
									)}

									{step === 'email-otp' && (
										<EmailOtp
											key="email-otp"
											email={email}
											onBack={() => setStep('provider')}
											onNextUsername={(user) => {
												setTempUser(user);
												setStep('username');
											}}
											onNextReferral={(user) => {
												setTempUser(user);
												setStep('referral');
											}}
										/>
									)}

									{step === 'username' && (
										<UsernameSetup
											key="username"
											onNext={() => setStep('referral')}
										/>
									)}

									{step === 'referral' && (
										<ReferralAndPrefs key="referral" />
									)}
								</AnimatePresence>
							</div>
						</div>
					</motion.div>
				</div>
			)}
		</AnimatePresence>
	);
}
