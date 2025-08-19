import { NavLink } from 'react-router-dom';
import homeActiveIcon from '@/assets/images/home.svg';
import homeIcon from '@/assets/images/home-active.svg';
import portfolioIcon from '@/assets/images/portfolio.svg';
import portfolioAtiveIcon from '@/assets/images/portfolio-active.svg';

export default function BottomNavbar() {
	return (
		<div className="fixed bottom-0 left-0 right-0 h-12 bg-white border-t border-gray-300/50 flex justify-around items-center md:hidden z-50">
			<NavLink
				to="/events"
				end
				className="flex flex-col items-center justify-center cursor-pointer"
			>
				{({ isActive }) => (
					<>
						<img src={isActive ? homeActiveIcon : homeIcon} alt="Home icon" className="w-5 h-6" />
						<span className="text-sm">Home</span>
					</>
				)}
			</NavLink>
			<NavLink
				to="/portfolio"
				end
				className="flex flex-col items-center justify-center cursor-pointer"
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
		</div>
	);
}
