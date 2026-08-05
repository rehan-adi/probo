import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useState, useRef, useEffect } from 'react';
import {
	Menu, Gift, Bell,
	LogOut, Settings, Briefcase, Info, Trophy, Moon, Activity
} from 'lucide-react';
import SearchInput from './SearchInput';
import CategoryNav from './CategoryNav';
import BottomNavbar from './BottomNavbar';
import { useAuthStore } from '@/store/auth';
import logo from '@/assets/images/logo.avif';
import { useModalStore } from '@/store/modal';
import { useThemeStore } from '@/store/theme';
import pfpIcon from '@/assets/images/pfp.avif';
import SearchModal from './modals/SearchModal';
import LanguageSelector from './LanguageSelector';
import walletIcon from '@/assets/images/wallet.svg';
import HowItWorksModal from './modals/HowItWorksModal';
import { motion, AnimatePresence } from 'framer-motion';
import { useBalanceQuery } from '@/hooks/queries/balance';

export default function Navbar() {
	const { t, i18n } = useTranslation();
	const { user } = useAuthStore();
	const { openOnboardModal } = useModalStore();
	const { theme, toggleTheme } = useThemeStore();
	const { data: balance, isLoading: balanceLoading } = useBalanceQuery();

	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const [isProfileOpen, setIsProfileOpen] = useState(false);
	const [isSearchOpen, setIsSearchOpen] = useState(false);
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
			useAuthStore.getState().logout();
		} catch (error) {
			console.error('Logout failed', error);
		}
	};

	return (
		<>
			<nav className="w-full bg-white dark:bg-[#090C1A] fixed top-0 z-[50] transition-colors flex flex-col">
				<div className={`w-full px-6`}>
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

									<div ref={menuRef} className="relative">
										<button
											onClick={() => setIsMenuOpen(!isMenuOpen)}
											className="hidden lg:block p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors text-gray-700 dark:text-gray-300 cursor-pointer"
										>
											<Menu size={22} />
										</button>
										<AnimatePresence>
											{isMenuOpen && (
												<div onMouseLeave={() => setIsMenuOpen(false)}>
													<motion.div
														initial={{ opacity: 0, y: 10 }}
														animate={{ opacity: 1, y: 0 }}
														exit={{ opacity: 0, y: 10 }}
														className="absolute right-0 top-12 w-56 bg-white dark:bg-slate-900 shadow-xl rounded-xl py-2 border border-gray-100 dark:border-slate-800 z-50"
													>
														<div className="px-2">
															<Link to="/leaderboard" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors cursor-pointer">
																<Trophy size={16} className="text-black dark:text-white" />
																{t('Leaderboard')}
															</Link>

															<button className="flex w-full items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors cursor-pointer">
																<Activity size={16} className="text-black dark:text-white" />
																{t('Status')}
															</button>

															<button
																onClick={toggleTheme}
																className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors cursor-pointer"
																role="switch"
																aria-checked={theme === 'dark'}
															>
																<div className="flex items-center gap-3">
																	<Moon size={16} className="text-black dark:text-white" />
																	<span>{t('Dark Mode')}</span>
																</div>
																<div className={`relative inline-flex h-[22px] w-[42px] shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-opacity-75 ${theme === 'dark' ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}`}>
																	<span className="sr-only">Toggle Dark Mode</span>
																	<span
																		aria-hidden="true"
																		className={`pointer-events-none inline-block h-[18px] w-[18px] transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${theme === 'dark' ? 'translate-x-5' : 'translate-x-0'}`}
																	/>
																</div>
															</button>

															<div className="h-px bg-gray-100 dark:bg-slate-800 my-1 mx-2" />

															<LanguageSelector />
														</div>
													</motion.div>
												</div>
											)}
										</AnimatePresence>
									</div>
								</>
							)}

							{user?.role === 'USER' && (
								<div className="flex items-center gap-2 lg:gap-2">
									{/* Wallet - Hidden on mobile, shown on bottom nav instead */}
									<Link
										to="/wallet"
										className="hidden md:flex items-center gap-2 border border-gray-200 dark:border-white/10 px-8 py-1 rounded-md hover:bg-gray-50 dark:hover:bg-white/5 transition-colors h-8"
									>
										<img src={walletIcon} alt="Wallet" className="w-4 h-4 dark:invert" />
										<span className="font-semibold text-sm text-gray-900 dark:text-white">
											₹{balanceLoading ? '0' : balance?.data?.data?.amount ?? 0}
										</span>
									</Link>

									<div className="flex group relative items-center justify-center p-0.5 w-9 h-8 border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors rounded-md cursor-pointer">
										<Gift size={20} className="text-gray-700 dark:text-gray-300" />
										<div className="absolute top-12 left-1/2 -translate-x-1/2 bg-gray-900 dark:bg-white dark:text-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
											Refer & Reward
										</div>
									</div>

									<div ref={notifRef} className="relative">
										<button
											onClick={() => setIsNotificationOpen(!isNotificationOpen)}
											className="flex items-center justify-center w-9 h-8 p-0.5 border border-gray-200 dark:border-white/10 cursor-pointer rounded-md hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-gray-700 dark:text-gray-300 relative"
										>
											<Bell size={19} className="text-black dark:text-white" />
										</button>
										<AnimatePresence>
											{isNotificationOpen && (
												<motion.div
													initial={{ opacity: 0, y: 10, scale: 0.95 }}
													animate={{ opacity: 1, y: 0, scale: 1 }}
													exit={{ opacity: 0, y: 10, scale: 0.95 }}
													className="absolute right-0 top-12 w-64 bg-white dark:bg-[#1C1C1E] shadow-xl rounded-xl border border-gray-100 dark:border-white/10 p-4 text-center z-50"
												>
													<Bell size={32} className="mx-auto text-gray-300 dark:text-gray-600 mb-2" />
													<p className="text-sm font-medium text-gray-800 dark:text-gray-200">No new notifications</p>
													<p className="text-xs text-gray-500 dark:text-gray-400 mt-1">You're all caught up!</p>
												</motion.div>
											)}
										</AnimatePresence>
									</div>

									<div ref={profileRef} className="relative">
										<div
											onMouseEnter={() => setIsProfileOpen(true)}
											className="flex items-center cursor-pointer p-0.5 rounded-full hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
										>
											<img src={user?.avatarUrl || pfpIcon} alt="Profile" className="w-[34px] h-[34px] rounded-full object-cover border border-gray-200 dark:border-white/10" />
										</div>

										<AnimatePresence>
											{isProfileOpen && (
												<div onMouseLeave={() => setIsProfileOpen(false)}>
													<motion.div
														initial={{ opacity: 0, y: 10 }}
														animate={{ opacity: 1, y: 0 }}
														exit={{ opacity: 0, y: 10 }}
														className="absolute right-0 top-12 w-56 bg-white dark:bg-[#1C1C1E] shadow-xl rounded-xl py-2 border border-gray-100 dark:border-white/10 z-50"
													>
														<div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-white/5 mb-1">
															<img src={user?.avatarUrl || pfpIcon} alt="Profile" className="w-10 h-10 rounded-full object-cover" />
															<div className="flex flex-col">
																<span className="text-sm font-bold text-gray-900 dark:text-gray-100">{user?.username || 'User'}</span>
															</div>
														</div>

														<div className="px-2">
															<Link to="/settings" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors">
																<Settings size={16} className="text-black dark:text-white" /> {t('Settings')}
															</Link>
															<Link to="/portfolio" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors">
																<Briefcase size={16} className="text-black dark:text-white" /> {t('Portfolio')}
															</Link>
															<Link to="/leaderboard" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors">
																<Trophy size={16} className="text-black dark:text-white" /> {t('Leaderboard')}
															</Link>

															<button className="flex w-full items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors cursor-pointer">
																<Activity size={16} className="text-black dark:text-white" />
																{t('Status')}
															</button>

															<button
																onClick={toggleTheme}
																className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors cursor-pointer"
																role="switch"
																aria-checked={theme === 'dark'}
															>
																<div className="flex items-center gap-3">
																	<Moon size={16} className="text-black dark:text-white" />
																	<span>{t('Dark Mode')}</span>
																</div>
																<div className={`relative inline-flex h-[22px] w-[42px] shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-opacity-75 ${theme === 'dark' ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}`}>
																	<span className="sr-only">Toggle Dark Mode</span>
																	<span
																		aria-hidden="true"
																		className={`pointer-events-none inline-block h-[18px] w-[18px] transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${theme === 'dark' ? 'translate-x-5' : 'translate-x-0'}`}
																	/>
																</div>
															</button>

															<div className="h-px bg-gray-100 dark:bg-white/5 my-1 mx-2" />

															<LanguageSelector />

															<button
																onClick={handleLogout}
																className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-sm font-medium text-red-600 dark:text-red-400 transition-colors w-full text-left"
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
				<CategoryNav />
			</nav>
			<div className="h-12 w-full" />

			<BottomNavbar
				onOpenSearch={() => setIsSearchOpen(true)}
				onOpenMenu={() => setIsMenuOpen(true)}
			/>

			<AnimatePresence>
				{showHowItWorks && (
					<HowItWorksModal onClose={() => setShowHowItWorks(false)} />
				)}
			</AnimatePresence>

			<AnimatePresence>
				{isSearchOpen && (
					<SearchModal onClose={() => setIsSearchOpen(false)} />
				)}
			</AnimatePresence>
		</>
	);
}
