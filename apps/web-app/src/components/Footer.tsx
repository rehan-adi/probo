import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import logo from '@/assets/images/logo.avif';
import darkLogo from '@/assets/images/dark-logo.avif';
import tradeViewIcon from '@/assets/images/trading-view.avif';
import { Instagram, Linkedin, ShieldAlert } from 'lucide-react';

export default function Footer() {
	const { t } = useTranslation();
	const year = new Date().getFullYear();

	return (
		<footer className="bg-white dark:bg-[#090C1A] border-t border-gray-100 dark:border-gray-800 px-6 py-10 md:py-12 text-sm text-gray-600 dark:text-gray-400 pb-20 md:pb-10 transition-colors">
			<div className="max-w-7xl mx-auto flex flex-col gap-8 md:gap-10">
				<div className="w-full">
					<Link to="/events" className="shrink-0 w-36 md:w-44 cursor-pointer inline-block">
						<img src={logo} alt="Probstreet Logo" className="w-full object-contain dark:hidden" />
						<img
							src={darkLogo}
							alt="Probstreet Logo"
							className="w-full object-contain hidden dark:block"
						/>
					</Link>
				</div>

				<div className="flex flex-col md:flex-row justify-between gap-10 md:gap-16">
					{/* Text Column */}
					<div className="md:w-1/3">
						<p className="text-gray-600 dark:text-gray-400 font-medium max-w-sm leading-relaxed text-[15px] md:text-base mb-6">
							{t(
								'Trade on the worlds leading prediction market. Buy shares in global events and earn when you are right.',
							)}
						</p>

						{/* Socials */}
						<div className="flex items-center gap-6 text-black dark:text-white mt-10">
							<a href="#" className="cursor-pointer hover:opacity-70 transition-opacity">
								<svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
									<path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
								</svg>
							</a>
							<a href="#" className="cursor-pointer hover:opacity-70 transition-opacity">
								<Instagram className="w-5 h-5" />
							</a>
							<a href="#" className="cursor-pointer hover:opacity-70 transition-opacity">
								<svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
									<path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
								</svg>
							</a>
							<a href="#" className="cursor-pointer hover:opacity-70 transition-opacity">
								<Linkedin className="w-5 h-5" fill="currentColor" />
							</a>
						</div>
					</div>

					{/* Quick Links Column */}
					<div className="grid grid-cols-2 gap-8 md:gap-12 md:w-1/3">
						<div className="flex flex-col gap-4 items-start">
							<h3 className="font-semibold text-gray-900 dark:text-white mb-2 tracking-wide uppercase text-[15px]">
								Organization
							</h3>
							<Link
								to="/events"
								className="relative group text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white font-medium transition-colors"
							>
								Events
								<span className="absolute left-0 bottom-0 w-0 h-[1.5px] bg-black dark:bg-white transition-all duration-300 group-hover:w-full"></span>
							</Link>
							<Link
								to="/about"
								className="relative group text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white font-medium transition-colors"
							>
								About Us
								<span className="absolute left-0 bottom-0 w-0 h-[1.5px] bg-black dark:bg-white transition-all duration-300 group-hover:w-full"></span>
							</Link>
							<Link
								to="/blog"
								className="relative group text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white font-medium transition-colors"
							>
								Blogs & Articles
								<span className="absolute left-0 bottom-0 w-0 h-[1.5px] bg-black dark:bg-white transition-all duration-300 group-hover:w-full"></span>
							</Link>
						</div>
						<div className="flex flex-col gap-4 items-start">
							<h3 className="font-semibold text-gray-900 dark:text-white mb-2 tracking-wide uppercase text-[15px]">
								Resources
							</h3>
							<Link
								to="/privacy"
								className="relative group text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white font-medium transition-colors"
							>
								Privacy & Policy
								<span className="absolute left-0 bottom-0 w-0 h-[1.5px] bg-black dark:bg-white transition-all duration-300 group-hover:w-full"></span>
							</Link>
							<Link
								to="/terms"
								className="relative group text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white font-medium transition-colors"
							>
								Terms of Service
								<span className="absolute left-0 bottom-0 w-0 h-[1.5px] bg-black dark:bg-white transition-all duration-300 group-hover:w-full"></span>
							</Link>
						</div>
					</div>

					{/* Partners Column */}
					<div className="flex flex-col gap-5 md:gap-6 md:w-1/3">
						<h3 className="font-semibold text-gray-900 dark:text-white mb-1 tracking-wide uppercase text-[15px]">
							Backed By
						</h3>
						<div className="flex flex-wrap items-center gap-7">
							<img src={tradeViewIcon} alt="TradingView" className="h-8 object-contain" />
							<img
								src="https://upload.wikimedia.org/wikipedia/commons/9/93/Amazon_Web_Services_Logo.svg"
								alt="AWS"
								className="h-6 mt-0.5 object-contain dark:brightness-0 dark:invert"
							/>
							<img
								src="https://upload.wikimedia.org/wikipedia/commons/3/37/Firebase_Logo.svg"
								alt="Firebase"
								className="h-6 object-contain"
							/>
						</div>

						<div className="mt-3 p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-100 dark:border-slate-700/50 flex gap-3.5 items-start">
							<ShieldAlert size={22} className="text-red-500 shrink-0 mt-0.5" />
							<div>
								<h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1 tracking-tight">
									18+ Play Responsibly
								</h4>
								<p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed font-medium">
									This platform involves financial risk and may be habit-forming. Please play
									responsibly.
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>

			<div className="max-w-7xl mx-auto mt-10 pt-8 border-t border-gray-200 dark:border-gray-800 flex flex-col items-center md:items-start text-sm md:text-base font-medium text-gray-700 dark:text-gray-400">
				<p>© {year} Probstreet. All rights reserved.</p>
			</div>
		</footer>
	);
}
