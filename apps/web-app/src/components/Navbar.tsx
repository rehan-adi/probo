import { logout } from '@/api/auth';
import BottomNavbar from './BottomNavbar';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';
import { useModalStore } from '@/store/modal';
import logo from '@/assets/images/logo.avif';
import { LINKS } from '@/constants/constants';
import pfpIcon from '@/assets/images/pfp.avif';
import { useEffect, useRef, useState } from 'react';
import walletIcon from '@/assets/images/wallet.svg';
import { Link, useNavigate } from 'react-router-dom';
import homeActiveIcon from '@/assets/images/home.svg';
import homeIcon from '@/assets/images/home-active.svg';
import portfolioIcon from '@/assets/images/portfolio.svg';
import { useBalanceQuery } from '@/hooks/queries/balance';
import LogoutModalIcon from '@/assets/images/LogoutModal.svg';
import translationIcon from '@/assets/images/translation.avif';
import portfolioAtiveIcon from '@/assets/images/portfolio-active.svg';
import { ChevronDown, ClipboardCheck, LogOut, Menu, Store, X } from 'lucide-react';

export default function Navbar() {
	const navigate = useNavigate();

	const { user } = useAuthStore();
	const { openOnboardModal } = useModalStore();

	const [isOpen, setIsOpen] = useState(false);
	const [menuOpen, setMenuOpen] = useState(false);
	const [showLogoutModal, setShowLogoutModal] = useState(false);

	const menuRef = useRef<HTMLDivElement>(null);

	const toggleMenu = () => setMenuOpen((prev) => !prev);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
				setMenuOpen(false);
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, []);

	const { data: balance, isLoading } = useBalanceQuery();

	const handleLogout = async () => {
		try {
			const response = await logout();

			if (response.status == 200) {
				useAuthStore.getState().logout();
				navigate('/');
			}
		} catch (error) {
			console.error('Logout failed', error);
		}
	};

	return (
		<nav className="w-full bg-[#f4f4f5] fixed px-4 lg:px-12 z-50 custom-px">
			<div className="md:h-16 h-12 border-b border-gray-300/50 flex items-center justify-between">
				<div className="flex items-center gap-14 lg:gap-14">
					<Link to="/events">
						<img src={logo} className="md:w-[120px] w-[67px] md:h-8 h-[18px]" alt="Logo" />
					</Link>

					{!user && (
						<div className="hidden md:flex items-center gap-9 lg:gap-9 custom-gap text-sm">
							<a
								href={LINKS.team}
								target="_blank"
								rel="noopener noreferrer"
								className="hover:underline"
							>
								Team 11
							</a>
							<a
								href={LINKS.read}
								target="_blank"
								rel="noopener noreferrer"
								className="hover:underline"
							>
								Read
							</a>
							<a
								href={LINKS.trust}
								target="_blank"
								rel="noopener noreferrer"
								className="hover:underline"
							>
								Trust & Safety
							</a>
							<a
								href={LINKS.careers}
								target="_blank"
								rel="noopener noreferrer"
								className="hover:underline"
							>
								Careers
							</a>
							<a
								href={LINKS.about}
								target="_blank"
								rel="noopener noreferrer"
								className="hover:underline"
							>
								About us
							</a>
						</div>
					)}
				</div>

				{user?.role == 'USER' && (
					<div className="flex justify-between items-center lg:gap-8 gap-4">
						<NavLink
							to="/events"
							end
							className="md:flex hidden justify-center items-center flex-col"
						>
							{({ isActive }) => (
								<>
									<img
										src={isActive ? homeActiveIcon : homeIcon}
										alt="Home icon"
										className="w-5 h-6"
									/>
									<span className="text-sm">Home</span>
								</>
							)}
						</NavLink>
						<NavLink
							to="/portfolio"
							end
							className="md:flex hidden justify-center items-center flex-col"
						>
							{({ isActive }) => (
								<>
									<img
										src={isActive ? portfolioAtiveIcon : portfolioIcon}
										alt="Home icon"
										className="w-5 h-6"
									/>
									<span className="text-sm">Portfolio</span>
								</>
							)}
						</NavLink>
						<Link
							to="/wallet"
							className="lg:py-2 py-1 pl-3 pr-8 gap-6 border rounded border-gray-300/50 flex items-center hover:bg-gray-100 transition"
						>
							<img src={walletIcon} alt="Wallet icon" className="w-4 h-4" />
							{isLoading ? (
								<span className="text-gray-800 text-sm font-semibold">₹0</span>
							) : (
								<span className="text-gray-800 text-sm font-semibold">
									₹{balance?.data.data.amount ?? 0}
								</span>
							)}
						</Link>

						<div
							ref={menuRef}
							className="relative flex justify-center gap-0.5 items-center cursor-pointer"
						>
							<div onClick={toggleMenu} className="flex items-center gap-0.5">
								<img
									src={pfpIcon}
									alt="Profile icon"
									className="lg:w-10 w-8 lg:h-10 h-8 rounded-full"
								/>
								<ChevronDown size={22} />
							</div>

							{menuOpen && (
								<div className="absolute right-6 top-12 bg-[#f4f4f5] shadow-md rounded-md py-2 px-4 text-sm border border-gray-400/25 flex flex-col z-50">
									<button
										onClick={() => setShowLogoutModal(true)}
										className="flex items-center cursor-pointer justify-start px-1 pr-24 py-1.5 gap-2 text-left w-full text-sm font-medium text-gray-700"
									>
										<LogOut size={22} /> Logout
									</button>
								</div>
							)}
						</div>

						{showLogoutModal && (
							<div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-3.5 sm:px-0 ">
								<div className="relative w-full max-w-sm sm:max-w-[600px] bg-white flex justify-center items-center flex-col rounded-xl px-5 py-4 text-center shadow-lg">
									<button
										onClick={() => setShowLogoutModal(false)}
										className="absolute top-3.5 text-gray-500 right-4"
									>
										<X />
									</button>

									{/* Icon and Content */}
									<img
										src={LogoutModalIcon}
										className="w-[70px] mt-9 mb-1.5 sm:mb-2.5 h-20"
										alt=""
									/>
									<h2 className="text-base sm:text-2xl font-semibold">
										Are you sure you want to log out?
									</h2>

									{/* Buttons */}
									<div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-6 mt-4 mb-2 sm:mb-0">
										<button
											onClick={() => setShowLogoutModal(false)}
											className="px-[120px] sm:px-28 py-[9px] sm:py-[13px] w-full bg-white text-black rounded-xl text-sm font-semibold border border-gray-400/30 cursor-pointer"
										>
											Cancel
										</button>
										<button
											onClick={handleLogout}
											className="px-[120px] sm:px-28 py-[9px] sm:py-[13px] w-full bg-[#262626] text-white rounded-xl text-sm font-semibold"
										>
											Logout
										</button>
									</div>
								</div>
							</div>
						)}

						<BottomNavbar />
					</div>
				)}

				{!(user?.role === 'USER' || user?.role === 'ADMIN') && (
					<>
						<div className="hidden lg:flex items-center gap-4">
							<div className="whitespace-nowrap text-xs text-right">
								<span className="block">
									For 18 years and <br />
									<span>above only</span>
								</span>
							</div>

							<button className="bg-white text-black font-semibold text-sm px-4 lg:px-8 py-2 border border-gray-400/30 cursor-pointer rounded">
								Download App
							</button>

							<button
								onClick={openOnboardModal}
								className="bg-[#262626] cursor-pointer text-white font-semibold text-sm px-5 lg:px-8 py-2 border border-gray-500/10 rounded"
							>
								Login/Signup
							</button>

							<img src={translationIcon} alt="Translate" className="w-5 cursor-pointer h-5" />
						</div>

						<div className="flex lg:hidden items-center gap-3">
							<img src={translationIcon} alt="Translate" className="w-5 cursor-pointer h-5" />
							<button className="cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
								<Menu size={25} className="w-5 h-7" />
							</button>
						</div>
					</>
				)}

				{user?.role === 'ADMIN' && (
					<div className="flex items-center gap-8">
						<a href="/events/create" className="flex flex-col items-center cursor-pointer">
							<Store className="w-5 h-5" />
							<span className="text-sm md:flex hidden text-[#262626]">Create Event</span>
						</a>

						<a href="/verifications" className="flex flex-col items-center cursor-pointer">
							<ClipboardCheck className="w-5 h-5" />
							<span className="text-sm md:flex hidden text-[#262626]">Verifications</span>
						</a>
						<div
							ref={menuRef}
							className="relative flex justify-center gap-0.5 items-center cursor-pointer"
						>
							<div onClick={toggleMenu} className="flex items-center gap-0.5">
								<img
									src={pfpIcon}
									alt="Profile icon"
									className="lg:w-10 w-8 lg:h-10 h-8 rounded-full"
								/>
								<ChevronDown size={22} />
							</div>

							{menuOpen && (
								<div className="absolute right-6 top-12 bg-[#f4f4f5] shadow-md rounded-md py-2 px-4 text-sm border border-gray-400/25 flex flex-col z-50">
									<button
										onClick={() => setShowLogoutModal(true)}
										className="flex items-center cursor-pointer justify-start px-1 pr-24 py-1.5 gap-2 text-left w-full text-sm font-medium text-gray-700"
									>
										<LogOut size={22} /> Logout
									</button>
								</div>
							)}
						</div>

						{showLogoutModal && (
							<div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-3.5 sm:px-0 ">
								<div className="relative w-full max-w-sm sm:max-w-[600px] bg-white flex justify-center items-center flex-col rounded-xl px-5 py-4 text-center shadow-lg">
									<button
										onClick={() => setShowLogoutModal(false)}
										className="absolute top-3.5 text-gray-500 right-4"
									>
										<X />
									</button>

									<img
										src={LogoutModalIcon}
										className="w-[70px] mt-9 mb-1.5 sm:mb-2.5 h-20"
										alt=""
									/>
									<h2 className="text-base sm:text-2xl font-semibold">
										Are you sure you want to log out?
									</h2>

									{/* Buttons */}
									<div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-6 mt-4 mb-2 sm:mb-0">
										<button
											onClick={() => setShowLogoutModal(false)}
											className="px-[120px] sm:px-28 py-[9px] sm:py-[13px] w-full bg-white text-black rounded-xl text-sm font-semibold border border-gray-400/30 cursor-pointer"
										>
											Cancel
										</button>
										<button
											onClick={handleLogout}
											className="px-[120px] sm:px-28 py-[9px] sm:py-[13px] w-full bg-[#262626] text-white rounded-xl text-sm font-semibold"
										>
											Logout
										</button>
									</div>
								</div>
							</div>
						)}
					</div>
				)}

				{!user && isOpen && (
					<div className="fixed inset-0 bg-black/40 z-50" onClick={() => setIsOpen(false)}>
						<div
							className={`fixed top-0 right-0 w-60 h-full bg-[#f4f4f5] z-50 px-5 py-3.5 flex flex-col gap-6 text-sm transition-transform duration-300 transform ${
								isOpen ? 'translate-x-0' : 'translate-x-full'
							}`}
							onClick={(e) => e.stopPropagation()}
						>
							<button
								className="self-end cursor-pointer text-xl font-semibold"
								onClick={() => setIsOpen(false)}
							>
								<X />
							</button>

							<a
								href="https://probo.in/team-11"
								target="_blank"
								rel="noopener noreferrer"
								className="hover:underline"
							>
								Team 11
							</a>
							<a
								href="https://probo.in/read"
								target="_blank"
								rel="noopener noreferrer"
								className="hover:underline"
							>
								Read
							</a>
							<a
								href="https://probo.in/trust&safety"
								target="_blank"
								rel="noopener noreferrer"
								className="hover:underline"
							>
								Trust & Safety
							</a>
							<a
								href="https://probo.in/careers"
								target="_blank"
								rel="noopener noreferrer"
								className="hover:underline"
							>
								Careers
							</a>

							<button className="bg-white text-black font-semibold text-sm px-4 py-2 border border-gray-500/30 cursor-pointer rounded">
								Download App
							</button>

							<button
								onClick={openOnboardModal}
								className="bg-[#262626] text-white font-semibold text-sm px-4 py-2 border border-gray-500/10 cursor-pointer rounded"
							>
								Login/Signup
							</button>
						</div>
					</div>
				)}
			</div>
		</nav>
	);
}
