import { Home, Search, Menu } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function BottomNavbar({ 
	onOpenSearch, 
	onOpenMenu 
}: { 
	onOpenSearch: () => void;
	onOpenMenu: () => void;
}) {
	const { t } = useTranslation();

	return (
		<div className="fixed bottom-0 w-full bg-white border-t border-gray-200 py-2 px-6 flex justify-between items-center z-50 md:hidden pb-safe">
			<NavLink
				to="/events"
				end
				className={({ isActive }) => 
					`flex flex-col items-center gap-1 transition-colors ${isActive ? 'text-black' : 'text-gray-400 hover:text-gray-600'}`
				}
			>
				<Home size={22} className="stroke-[2.5]" />
				<span className="text-[10px] font-semibold">{t('Home')}</span>
			</NavLink>

			<NavLink 
				to="/search"
				className={({ isActive }) => 
					`flex flex-col items-center gap-1 transition-colors ${isActive ? 'text-black' : 'text-gray-400 hover:text-gray-600'}`
				}
			>
				<Search size={22} className="stroke-[2.5]" />
				<span className="text-[10px] font-semibold">{t('Search')}</span>
			</NavLink>

			<button 
				onClick={onOpenMenu}
				className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-600 transition-colors"
			>
				<Menu size={22} className="stroke-[2.5]" />
				<span className="text-[10px] font-semibold">{t('More')}</span>
			</button>
		</div>
	);
}
