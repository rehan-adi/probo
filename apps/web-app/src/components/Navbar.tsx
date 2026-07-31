import { useTranslation } from 'react-i18next';
import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
	Menu, Gift, Bell, ChevronDown, User,
	LogOut, Settings, Briefcase, Info
} from 'lucide-react';
import SearchInput from './SearchInput';
import CategoryNav from './CategoryNav';
import MenuModal from './modals/MenuModal';
import { useAuthStore } from '@/store/auth';
import logo from '@/assets/images/logo.avif';
import { useModalStore } from '@/store/modal';
import pfpIcon from '@/assets/images/pfp.avif';
import walletIcon from '@/assets/images/wallet.svg';
import HowItWorksModal from './modals/HowItWorksModal';
import { motion, AnimatePresence } from 'framer-motion';
import { useBalanceQuery } from '@/hooks/queries/balance';

export default function Navbar() {
	const { t } = useTranslation();
	const location = useLocation();
	const isEventsPage = location.pathname === '/events' || location.pathname === '/';
	const { user } = useAuthStore();
	const { openOnboardModal } = useModalStore();
	const { data: balance, isLoading: balanceLoading } = useBalanceQuery();

	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const [isProfileOpen, setIsProfileOpen] = useState(false);
	const [isNotificationOpen, setIsNotificationOpen] = useState(false);
	const [showHowItWorks, setShowHowItWorks] = useState(false);

	const menuRef = useRef<HTMLDivElement>(null);
	const profileRef = useRef<HTMLDivElement>(null);
	const notifRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (menuRef.current && !menuRef.current.contains(e.target as Node)) setIsMenuOpen(false);
			if (profileRef.current && !profileRef.current.contains(e.target as Node)) setIsProfileOpen(false);
			if (notifRef.current && !notifRef.current.contains(e.target as Node)) setIsNotificationOpen(false);
		};
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	const handleLogout = async () => {
		try {
			await useAuthStore.getState().logout();
		} catch (error) {
			console.error('Logout failed', error);
		}
	};

	return (
		<>
			<nav className="w-full bg-white dark:bg-[#090C1A] fixed top-0 z-[50] transition-colors flex flex-col">
				<div className={`w-full px-6 ${isEventsPage ? '' : 'border-b border-gray-100 dark:border-gray-800'}`}>
					<div className="max-w-7xl mx-auto h-16 flex items-center justify-between gap-4">

						<div className="flex items-center gap-6 flex-1">
							<Link to="/events" className="shrink-0">
								<img src={logo} className="w-[112px] md:w-[130px] object-contain" alt="Logo" />
							</Link>

							<div className="hidden md:flex items-center gap-4 flex-1 max-w-[500px]">
								<div className="w-full">
									<SearchInput />
								</div>
							</div>
						</div>

						<div className="flex items-center gap-2 lg:gap-2 shrink-0">

							{!user && (
								<>
									<button
										onClick={() => setShowHowItWorks(true)}
										className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md text-black dark:text-white bg-gray-100 dark:bg-slate-800 transition-colors cursor-pointer"
									>
										<div className="flex items-center justify-center">
											<Info size={14} className="text-black dark:text-white" />
										</div>
										{t('How it works')}
									</button>

									<button
										onClick={openOnboardModal}
										className="bg-black dark:bg-white text-white dark:text-black font-medium text-sm px-4 py-1.5 rounded-md hover:opacity-90 transition-opacity cursor-pointer whitespace-nowrap"
									>
										{t('Sign In')}
									</button>

									<div ref={menuRef} className="relative hidden lg:block" onMouseLeave={() => setIsMenuOpen(false)}>
										<button
											onMouseEnter={() => setIsMenuOpen(true)}
											className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors text-gray-700 dark:text-gray-300"
										>
											<Menu size={22} />
										</button>
										<AnimatePresence>
											{isMenuOpen && (
												<MenuModal onClose={() => setIsMenuOpen(false)} />
											)}
										</AnimatePresence>
									</div>
								</>
							)}

							{user?.role === 'USER' && (
								<div className="flex items-center gap-4 lg:gap-6">
									{/* Refer & Earn */}
									<div className="hidden lg:flex group relative items-center gap-2 cursor-pointer p-2 rounded-xl hover:bg-orange-50 text-orange-600 transition-all overflow-hidden w-10 hover:w-[130px]">
										<Gift size={20} className="shrink-0" />
										<span className="whitespace-nowrap text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300">
											{t('Refer & Earn')}
										</span>
									</div>

									{/* Notifications */}
									<div ref={notifRef} className="relative">
										<button
											onClick={() => setIsNotificationOpen(!isNotificationOpen)}
											className="p-2.5 rounded-xl hover:bg-gray-100 transition-colors text-gray-600 relative"
										>
											<Bell size={20} />
											<span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
										</button>
										<AnimatePresence>
											{isNotificationOpen && (
												<motion.div
													initial={{ opacity: 0, y: 10, scale: 0.95 }}
													animate={{ opacity: 1, y: 0, scale: 1 }}
													exit={{ opacity: 0, y: 10, scale: 0.95 }}
													className="absolute right-0 top-12 w-64 bg-white shadow-xl rounded-xl border border-gray-100 p-4 text-center z-50"
												>
													<Bell size={32} className="mx-auto text-gray-300 mb-2" />
													<p className="text-sm font-medium text-gray-800">No new notifications</p>
													<p className="text-xs text-gray-500 mt-1">You're all caught up!</p>
												</motion.div>
											)}
										</AnimatePresence>
									</div>

									{/* Wallet */}
									<Link
										to="/wallet"
										className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
									>
										<img src={walletIcon} alt="Wallet" className="w-4 h-4" />
										<span className="font-semibold text-sm">
											₹{balanceLoading ? '0' : balance?.data?.data?.amount ?? 0}
										</span>
									</Link>

									<div className="hidden lg:block w-px h-6 bg-gray-200" /> {/* Divider */}

									{/* Profile */}
									<div ref={profileRef} className="relative">
										<div
											onMouseEnter={() => setIsProfileOpen(true)}
											className="flex items-center gap-1.5 cursor-pointer p-1 rounded-full hover:bg-gray-50 transition-colors"
										>
											<img src={pfpIcon} alt="Profile" className="w-9 h-9 rounded-full object-cover border border-gray-200" />
											<ChevronDown size={16} className="text-gray-500" />
										</div>

										<AnimatePresence>
											{isProfileOpen && (
												<div onMouseLeave={() => setIsProfileOpen(false)}>
													<motion.div
														initial={{ opacity: 0, y: 10 }}
														animate={{ opacity: 1, y: 0 }}
														exit={{ opacity: 0, y: 10 }}
														className="absolute right-0 top-12 w-56 bg-white shadow-xl rounded-xl py-2 border border-gray-100 z-50"
													>
														<div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 mb-1">
															<img src={pfpIcon} alt="Profile" className="w-10 h-10 rounded-full object-cover" />
															<div className="flex flex-col">
																<span className="text-sm font-semibold text-gray-900 truncate max-w-[120px]">
																	@{user.username || 'User'}
																</span>
															</div>
														</div>

														<div className="flex flex-col gap-0.5 px-2">
															<Link to="/profile" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700 transition-colors">
																<User size={16} className="text-gray-400" /> {t('Profile')}
															</Link>
															<Link to="/portfolio" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700 transition-colors">
																<Briefcase size={16} className="text-gray-400" /> {t('Portfolio')}
															</Link>
															<Link to="/settings" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700 transition-colors">
																<Settings size={16} className="text-gray-400" /> {t('Settings')}
															</Link>

															<div className="h-px bg-gray-100 my-1 mx-2" />

															<button
																onClick={handleLogout}
																className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-50 text-sm font-medium text-red-600 transition-colors w-full text-left"
															>
																<LogOut size={16} /> Logout
															</button>
														</div>
													</motion.div>
												</div>
											)}
										</AnimatePresence>
									</div>
								</div>
							)}
						</div>
					</div>
				</div>
				{isEventsPage && <CategoryNav />}
			</nav>
			{isEventsPage && <div className="h-12 w-full" />}

			{user?.role === 'USER' && (
				<BottomNavbar
					onOpenSearch={() => { }}
					onOpenMenu={() => setIsMenuOpen(true)}
				/>
			)}

			<AnimatePresence>
				{showHowItWorks && (
					<HowItWorksModal onClose={() => setShowHowItWorks(false)} />
				)}
			</AnimatePresence>
		</>
	);
}
