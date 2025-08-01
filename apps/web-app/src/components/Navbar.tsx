import { useState } from 'react';
import BottomNavbar from './BottomNavbar';
import { useAuthStore } from '@/store/auth';
import { useModalStore } from '@/store/modal';
import logo from '@/assets/images/logo.avif';
import { LINKS } from '@/constants/constants';
import pfpIcon from '@/assets/images/pfp.avif';
import homeIcon from '@/assets/images/home.svg';
import walletIcon from '@/assets/images/wallet.svg';
import { ChevronDown, Menu, X } from 'lucide-react';
import portfolioIcon from '@/assets/images/portfolio.svg';
import translationIcon from '@/assets/images/translation.avif';

export default function Navbar() {
	const { user } = useAuthStore();
	const { openOnboardModal } = useModalStore();
	const [isOpen, setIsOpen] = useState(false);

	return (
		<div className="w-full bg-[#f4f4f5] fixed md:h-16 h-12 flex items-center justify-between px-4 lg:px-14 z-50 custom-px">
			<div className="flex items-center gap-14 lg:gap-14">
				<img src={logo} className="md:w-28 w-[67px] md:h-8 h-[18px]" alt="Logo" />

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
					</div>
				)}
			</div>

			{user ? (
				<div className="flex justify-between items-center lg:gap-8 gap-4">
					<div className="md:flex hidden justify-center items-center flex-col">
						<img src={homeIcon} alt="Home icon" className="w-5 h-5" />
						<span className="text-sm">Home</span>
					</div>
					<div className="md:flex hidden justify-center items-center flex-col">
						<img src={portfolioIcon} alt="Portfolio icon" className="w-5 h-5" />
						<span className="text-sm">Portfolio</span>
					</div>

					<div className="lg:py-2 py-1 pl-3 pr-8 gap-6 border rounded border-gray-300/50 flex items-center">
						<img src={walletIcon} alt="Wallet icon" className="w-4 h-4" />
						<span className="text-gray-800 text-sm font-semibold">₹11</span>
					</div>

					<div className="flex justify-center gap-0.5 items-center">
						<img
							src={pfpIcon}
							alt="Profile icon"
							className="lg:w-10 w-8 lg:h-10 h-8 rounded-full"
						/>
						<ChevronDown size={22} />
					</div>

					<BottomNavbar />
				</div>
			) : (
				<>
					<div className="hidden lg:flex items-center gap-4">
						<div className="whitespace-nowrap text-xs text-right">
							<span className="block">
								For 18 years and <br />
								<span>above only</span>
							</span>
						</div>

						<button className="bg-white text-black font-semibold text-sm px-4 lg:px-8 py-2 border border-gray-500/30 cursor-pointer rounded">
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
	);
}
