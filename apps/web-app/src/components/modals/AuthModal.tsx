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
			if (e.key === 'Escape' && onboardModalOpen) {
				if (!['username', 'referral'].includes(step)) {
					closeOnboardModal();
				}
			}
		};
		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [onboardModalOpen, closeOnboardModal, step]);

	const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
		if (info.offset.y > 100 || info.velocity.y > 500) {
			if (!['username', 'referral'].includes(step)) {
				closeOnboardModal();
			}
		}
	};

	const modalVariants = isMobile
		? {
				hidden: { y: '100%' },
				visible: { y: 0, transition: { type: 'spring', damping: 25, stiffness: 300 } },
				exit: { y: '100%', transition: { type: 'spring', damping: 25, stiffness: 300 } },
			}
		: {
				hidden: { opacity: 0 },
				visible: { opacity: 1, transition: { duration: 0.15, ease: 'easeOut' } },
				exit: { opacity: 0, transition: { duration: 0.1, ease: 'easeIn' } },
			};

	return (
		<AnimatePresence>
			{onboardModalOpen && (
				<div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center sm:p-4">
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						onClick={() => {
							if (!['username', 'referral'].includes(step)) {
								closeOnboardModal();
							}
						}}
						className="absolute inset-0 bg-black/60 backdrop-blur-sm"
					/>

					<motion.div
						ref={containerRef}
						variants={modalVariants as any}
						initial="hidden"
						animate="visible"
						exit="exit"
						drag={isMobile ? 'y' : false}
						dragControls={dragControls}
						dragListener={false}
						dragConstraints={{ top: 0 }}
						dragElastic={0.2}
						onDragEnd={handleDragEnd}
						className={`w-full md:w-[420px] h-[85vh] ${step === 'provider' ? 'md:h-[500px]' : 'md:h-auto'} bg-white dark:bg-[#1C1C1E] md:rounded-[24px] rounded-t-[24px] shadow-2xl relative z-10 flex flex-col overflow-hidden md:transition-[height] md:duration-300`}
					>
						{isMobile && (
							<div
								className="w-full flex justify-center py-4 cursor-grab active:cursor-grabbing z-20 touch-none shrink-0 bg-white dark:bg-[#1C1C1E] rounded-t-[24px]"
								onPointerDown={(e) => dragControls.start(e)}
							>
								<div className="w-12 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600" />
							</div>
						)}

						<div className="w-full h-full flex flex-col overflow-y-auto scrollbar-hide pt-2 md:pt-0">
							<div className="w-full px-6 py-6 md:px-8 md:py-8 relative flex flex-col justify-center">
								<AnimatePresence mode="wait">
									{step === 'provider' && (
										<ProviderSelect
											key="provider"
											onSelectEmail={(email) => {
												setEmail(email);
												setStep('email-otp');
											}}
											onNextUsername={() => {
												setStep('username');
											}}
											onNextReferral={() => {
												setStep('referral');
											}}
										/>
									)}

									{step === 'email-otp' && (
										<EmailOtp
											key="email-otp"
											email={email}
											onBack={() => setStep('provider')}
											onNextUsername={() => {
												setStep('username');
											}}
											onNextReferral={() => {
												setStep('referral');
											}}
										/>
									)}

									{step === 'username' && (
										<UsernameSetup key="username" onNext={() => setStep('referral')} />
									)}

									{step === 'referral' && <ReferralAndPrefs key="referral" />}
								</AnimatePresence>
							</div>
						</div>
					</motion.div>
				</div>
			)}
		</AnimatePresence>
	);
}
