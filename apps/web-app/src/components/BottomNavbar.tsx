import homeIcon from '@/assets/images/home.svg';
import portfolioIcon from '@/assets/images/portfolio.svg';

export default function BottomNavbar() {
	return (
		<div className="fixed bottom-0 left-0 right-0 h-12 bg-white border-t border-gray-300/50 flex justify-around items-center md:hidden z-50">
			<div className="flex flex-col items-center justify-center cursor-pointer">
				<img src={homeIcon} alt="Home icon" className={`w-5 h-5`} />
				<span className={`text-xs`}>Home</span>
			</div>
			<div className="flex flex-col items-center justify-center cursor-pointer">
				<img src={portfolioIcon} alt="Portfolio icon" className={`w-5 h-5`} />
				<span className={`text-xs`}>Portfolio</span>
			</div>
		</div>
	);
}
