import { api } from '@/lib/axios';
import { useEffect, useState } from 'react';
import CategoryNav from '@/components/CategoryNav';
import workerIcon from '@/assets/images/worker.avif';
import downloadIcon from '@/assets/images/download.avif';
import barChartIcon from '@/assets/images/Bar_Chart.avif';
import { Clock } from 'lucide-react';

export default function EventsPage() {
	const [events, setEvents] = useState<any[]>([]);

	const [selectedCategoryId, setSelectedCategoryId] = useState('all');
	const [selectedCategoryName, setSelectedCategoryName] = useState('All Events');

	useEffect(() => {
		const fetchEvents = async () => {
			try {
				let url = '/market';
				if (selectedCategoryId !== 'all') {
					url = `/market/${selectedCategoryId}`;
				}
				const response = await api.get(url);
				setEvents(response.data.data);
			} catch (err) {
				console.error('Error fetching events:', err);
			}
		};

		fetchEvents();
	}, [selectedCategoryId]);

	return (
		<div className="w-full bg-[#f4f4f5] md:py-4 py-1 px-4 md:pt-20 pt-16 flex flex-col gap-4 lg:px-12">
			<CategoryNav
				selectedCategoryId={selectedCategoryId}
				onCategoryChange={(id, name) => {
					setSelectedCategoryId(id);
					setSelectedCategoryName(name);
				}}
			/>
			<div className="flex gap-16">
				<div className="w-full">
					<h1 className="text-xl font-semibold border-b border-gray-400/20 pb-3 mb-3">
						{selectedCategoryName}
					</h1>
					<div className="flex-1 grid max-w-7xl grid-cols-1 md:grid-cols-2 gap-4">
						{events.length > 0 ? (
							events.map((event, idx) => (
								<div
									key={idx}
									className="bg-white rounded-xl p-4 flex flex-col justify-between gap-2 h-[220px]"
								>
									<div>
										<div className="flex items-center">
											<img src={barChartIcon} className="w-4 h-4 mr-1" />
											<p className="text-xs">{event.numberOfTraders} traders</p>
										</div>

										<div className="flex gap-3 mt-2.5">
											<img
												src={event.thumbnail || workerIcon}
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
											<Clock size={16} className='text-[#262626]'/>
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
										<button className="text-[#197BFF] bg-[#E8F2FF] text-xs px-3 py-2.5 rounded-sm w-full font-semibold">
											Yes ₹{event.yesPrice}
										</button>
										<button className="text-[#DC2804] bg-[#FDF3F2] text-xs px-3 py-2.5 rounded-sm w-full font-semibold">
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
				<div className="w-[630px] rounded-xl lg:flex hide-1200 hidden items-start">
					<div className="w-full bg-[#EDEDED] rounded-xl flex p-6">
						<div className="flex flex-col flex-1 justify-center">
							<h3 className="text-xl font-semibold mb-2">
								DOWNLOAD APP FOR BETTER & FAST EXPERIENCE
							</h3>
							<button className="bg-[#262626] mt-2 text-white text-sm font-semibold px-3 py-2.5 rounded">
								Download Now
							</button>
						</div>
						<div className="flex-1 flex justify-end items-center">
							<img src={downloadIcon} alt="Download Icon" className="w-28 h-28 object-contain" />
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
