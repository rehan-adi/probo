import { api } from '@/lib/axios';
import { Clock } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { useEffect, useState } from 'react';
import { useModalStore } from '@/store/modal';
import downloadIcon from '@/assets/images/download.avif';
import defaultThumbnail from '@/assets/images/logo.avif';
import barChartIcon from '@/assets/images/Bar_Chart.avif';
import { useNavigate, useSearchParams } from 'react-router-dom';


export default function EventsPage() {
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const [events, setEvents] = useState<any[]>([]);
	const { user } = useAuthStore();
	const { openOnboardModal } = useModalStore();

	const selectedCategoryName = searchParams.get('category') || 'All Events';

	useEffect(() => {
		const fetchEvents = async () => {
			try {
				let url = '/market';
				if (selectedCategoryName !== 'All Events') {
					url = `/market/category/${selectedCategoryName}`;
				}
				const response = await api.get(url);
				setEvents(response.data.data);
			} catch (err) {
				console.error('Error fetching events:', err);
			}
		};

		fetchEvents();
	}, [selectedCategoryName]);

	return (
		<div className="w-full bg-gray-50 dark:bg-[#090C1A] min-h-screen">
			<div className="max-w-7xl mx-auto md:px-0 px-6 py-6 md:py-8 flex flex-col gap-6">
				<div className="flex gap-16">
					<div className="w-full">
						<h1 className="text-xl font-semibold border-b border-gray-200 dark:border-gray-800 pb-3 mb-4 text-gray-900 dark:text-white">
							{selectedCategoryName}
						</h1>
						<div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
							{events.length > 0 ? (
								events.map((event, idx) => (
									<div
										key={idx}
										onClick={() => navigate(`/events/${event.symbol}`)}
										className="bg-white cursor-pointer rounded-xl p-4 flex flex-col justify-between gap-2 h-[220px]"
									>
										<div>
											<div className="flex items-center">
												<img src={barChartIcon} className="w-4 h-4 mr-1" />
												<p className="text-xs">{event.numberOfTraders} traders</p>
											</div>

											<div className="flex gap-3 mt-2.5">
												<img
													src={event.thumbnail || defaultThumbnail}
													alt={event.title}
													className="w-16 h-16 object-cover rounded-lg"
												/>
												<h2 className="md:text-base text-xs font-medium line-clamp-2 leading-snug md:max-h-[100px] overflow-hidden">
													{event.title}
												</h2>
											</div>
										</div>

										<div>
											<p className="text-xs flex items-center justify-start gap-3">
												<Clock size={16} className="text-[#262626]" />
												Expires in{' '}
												{(() => {
													const now = new Date();
													const target = new Date(event.endTime);
													const diffMs = target.getTime() - now.getTime();

													if (diffMs <= 0) return 'Expired';

													const diffMinutes = Math.floor(diffMs / (1000 * 60));
													const hours = Math.floor(diffMinutes / 60);
													const minutes = diffMinutes % 60;

													return hours > 0 ? `${hours}h ${minutes}m left` : `${minutes}m left`;
												})()}
											</p>
										</div>

										<div className="flex gap-4 w-full">
											<button className="text-[#197BFF] cursor-pointer bg-[#E8F2FF] text-xs px-3 py-2.5 rounded-sm w-full font-semibold">
												Yes ₹{event.yesPrice}
											</button>
											<button className="text-[#DC2804] cursor-pointer bg-[#FDF3F2] text-xs px-3 py-2.5 rounded-sm w-full font-semibold">
												No ₹{event.NoPrice}
											</button>
										</div>
									</div>
								))
							) : (
								<p className="text-gray-500">No events found.</p>
							)}
						</div>
					</div>
					{!user && (
						<div className="w-[630px] rounded-xl lg:flex hide-1200 hidden items-start">
							<div className="w-full bg-[#EDEDED] dark:bg-gray-800 rounded-xl flex p-5">
								<div className="flex flex-col w-[65%] justify-center pr-4">
									<div className="inline-flex items-center gap-1.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-500 text-xs font-bold px-2.5 py-1 rounded-full mb-3 w-max">
										<span>🎁</span> LIMITED TIME OFFER
									</div>
									<h3 className="text-xl font-bold leading-tight mb-2 dark:text-white">
										UNLOCK UP TO ₹25 WELCOME BONUS!
									</h3>
									<p className="text-sm text-gray-600 dark:text-gray-400 mb-4 font-medium">
										Get <span className="font-semibold text-black dark:text-white">₹15</span> instantly on signin and <span className="font-semibold text-black dark:text-white">₹10</span> extra with a referral code.
									</p>
									<button
										onClick={openOnboardModal}
										className="bg-black dark:bg-white text-white dark:text-black font-medium text-sm px-4 py-1.5 mt-2 rounded-md hover:opacity-90 transition-opacity cursor-pointer whitespace-nowrap w-max"
									>
										Claim Reward
									</button>
								</div>
								<div className="w-[35%] flex justify-end items-center">
									<img src={downloadIcon} alt="Bonus" className="w-24 h-24 lg:w-28 lg:h-28 object-contain" />
								</div>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
