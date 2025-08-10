import { api } from '@/lib/axios';
import { useAuthStore } from '@/store/auth';
import { ChevronRight } from 'lucide-react';
import { useParams } from 'react-router-dom';
import PlaceOrder from '@/components/PlaceOrder';
import shareIcon from '@/assets/images/share-icon.svg';
import PlusIcon from '@/assets/images/plus_circled.svg';
import downloadIcon from '@/assets/images/download.avif';
import React, { useEffect, useRef, useState } from 'react';

export default function MarketDetails() {
	const { symbol } = useParams<{ symbol: string }>();

	const { isLoggedIn } = useAuthStore();

	const loggedIn = isLoggedIn();

	const [market, setMarket] = useState<any>(null);
	const [loading, setLoading] = useState(true);
	const [activeTab, setActiveTab] = useState('orderbook');

	const orderbookRef = useRef<HTMLDivElement>(null);
	const timelineRef = useRef<HTMLDivElement>(null);
	const overviewRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!symbol) return;
		api
			.get(`/market/${symbol}`)
			.then((res) => setMarket(res.data.data))
			.catch((err) => console.error('Error fetching market details:', err))
			.finally(() => setLoading(false));
	}, [symbol]);

	const handleTabClick = (tab: string) => {
		setActiveTab(tab);
		let targetRef: React.RefObject<HTMLDivElement | null> | null = null;

		if (tab === 'orderbook') targetRef = orderbookRef;
		if (tab === 'timeline') targetRef = timelineRef;
		if (tab === 'overview') targetRef = overviewRef;

		if (targetRef?.current) {
			targetRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
		}
	};

	const [innerTab, setInnerTab] = useState('orderbook');

	const yesOrders = [
		{ price: 3.5, qty: 10 },
		{ price: 4, qty: 39 },
		{ price: 4.5, qty: 499 },
		{ price: 5, qty: 496 },
		{ price: 9, qty: 5 },
	];

	const noOrders = [
		{ price: 8, qty: 120 },
		{ price: 8.5, qty: 1155 },
		{ price: 9, qty: 3 },
		{ price: 9.5, qty: 46 },
		{ price: 0, qty: 0 },
	];

	if (loading) return <p className="p-4">Loading...</p>;
	if (!market) return <p className="p-4">Market not found.</p>;

	return (
		<div className="w-full bg-[#f4f4f5] min-h-screen py-4 flex items-start justify-center">
			<div className="flex gap-12 w-full px-[128px] pt-20 max-[1220px]:px-[40px] max-[640px]:px-[20px]">
				<div className="w-[70%] max-[1160px]:w-[65%] max-[970px]:w-full">
					<div className="flex mb-6 justify-between items-center">
						<div className="flex items-center gap-1">
							<span className="text-[15px] text-[#757575]">Home</span>
							<ChevronRight size={20} className="text-[#757575]" />
							<span className="font-medium text-[#262626] text-[15px]">Event Details</span>
						</div>
						<button className="bg-transparent border-none cursor-pointer">
							<img src={shareIcon} alt="Share" className="w-5 h-5" />
						</button>
					</div>

					<div className="flex justify-between items-center mb-10 md:gap-4 gap-3">
						<div className="flex gap-6 items-center">
							<img
								src={market.thumbnail}
								alt={market.title}
								className="md:w-24 w-20 md:h-24 h-20 object-cover rounded"
							/>
							<h1 className="md:text-3xl text-base sm:text-2xl max-w-xl font-semibold">
								{market.title}
							</h1>
						</div>
						<div className="sm:flex flex-col justify-between hidden">
							<img src={PlusIcon} alt="" className="w-[18px] h-[18px]" />
						</div>
					</div>

					<div className="flex gap-4 mb-8">
						{['orderbook', 'timeline', 'overview'].map((tab) => (
							<button
								key={tab}
								onClick={() => handleTabClick(tab)}
								className={`pb-2 capitalize relative w-28 text-[#545454] ${
									activeTab === tab
										? 'after:content-[""] after:absolute after:left-0 after:bottom-0 after:w-full after:h-[2px] after:bg-black'
										: ''
								}`}
							>
								{tab.replace(/^\w/, (c) => c.toUpperCase())}
							</button>
						))}
					</div>

					{loggedIn && (
						<div ref={orderbookRef} className="mb-12 bg-white px-6 py-4 border rounded-lg">
							<div className="flex gap-8 border-b-2 mb-6 border-[#ededed]">
								{['orderbook', 'Activity'].map((tab) => (
									<button
										key={tab}
										onClick={() => setInnerTab(tab)}
										className={`pb-2 capitalize text-[#545454] relative ${
											innerTab === tab
												? 'after:content-[""] text-black after:absolute after:left-0 after:bottom-[-2px] after:w-full after:h-[2px] after:bg-black font-semibold'
												: 'text-[#575757]'
										}`}
									>
										{tab}
									</button>
								))}
							</div>

							{innerTab === 'orderbook' && (
								<div className="grid grid-cols-2 gap-5 text-sm">
									<div>
										<div className="grid grid-cols-2 pb-3">
											<span className="font-semibold">PRICE</span>
											<span className="text-right">
												QTY <span className="text-[#197BFF]">YES</span>
											</span>
										</div>
										{yesOrders.map((yes, idx) => {
											const maxQty = Math.max(...yesOrders.map((o) => o.qty));
											const widthPercent = (yes.qty / maxQty) * 100;

											return (
												<div key={idx} className="grid grid-cols-2 border-t">
													<span className="px-1 py-1.5">{yes.price}</span>
													<span
														className="text-right relative py-1.5 px-1"
														style={{
															background: `linear-gradient(to left, #BCD8FE ${widthPercent}%, transparent ${widthPercent}%)`,
														}}
													>
														{yes.qty}
													</span>
												</div>
											);
										})}
									</div>

									<div>
										<div className="grid grid-cols-2 pb-3">
											<span className="font-semibold">PRICE</span>
											<span className="text-right">
												QTY <span className="text-[#DC2804]">NO</span>
											</span>
										</div>
										{noOrders.map((no, idx) => {
											const maxQty = Math.max(...noOrders.map((o) => o.qty));
											const widthPercent = (no.qty / maxQty) * 100;

											return (
												<div key={idx} className="grid grid-cols-2 border-t">
													<span className="px-1 py-1.5">{no.price}</span>
													<span
														className="text-right relative py-1.5 px-1"
														style={{
															background: `linear-gradient(to left, #FFDCDB ${widthPercent}%, transparent ${widthPercent}%)`,
														}}
													>
														{no.qty}
													</span>
												</div>
											);
										})}
									</div>
								</div>
							)}

							{innerTab === 'activity' && (
								<div className="text-sm text-gray-500">Activity log will be shown here...</div>
							)}
						</div>
					)}

					<div ref={timelineRef} className="mb-12">
						<h2 className="text-lg font-bold mb-2">Timeline</h2>
						<p>Timeline content here...</p>
					</div>

					<div ref={overviewRef} className="sm:bg-white sm:p-8 rounded-lg sm:border">
						<h2 className="text-xl font-semibold mb-6">About the Event</h2>

						<div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-black font-semibold text-xs">
							<div className="flex flex-col md:block">
								<span className="md:block">Source of Truth</span>
								<span className="text-xs text-blue-500 font-normal md:hidden">
									{market.overview.SourceOfTruth}
								</span>
							</div>

							<div className="flex flex-col md:block">
								<span className="md:block">Trading started on</span>
								<span className="text-xs text-[#757575] font-normal md:hidden">
									{new Date(market.overview?.StartDate).toLocaleDateString(undefined, {
										day: '2-digit',
										month: 'short',
										year: 'numeric',
									})}
								</span>
							</div>

							<div className="flex flex-col md:block">
								<span className="md:block">Event expires on</span>
								<span className="text-xs text-[#757575] font-normal md:hidden">
									{new Date(market.overview?.EndDate).toLocaleDateString(undefined, {
										day: '2-digit',
										month: 'short',
										year: 'numeric',
									})}
								</span>
							</div>
						</div>

						<div className="hidden md:grid grid-cols-3 gap-4 mb-5 mt-1">
							<div className="text-xs text-blue-500">{market.overview.SourceOfTruth}</div>
							<div className="text-xs text-[#757575]">
								{new Date(market.overview?.StartDate).toLocaleDateString(undefined, {
									day: '2-digit',
									month: 'short',
									year: 'numeric',
								})}
							</div>
							<div className="text-xs text-[#757575]">
								{new Date(market.overview?.EndDate).toLocaleDateString(undefined, {
									day: '2-digit',
									month: 'short',
									year: 'numeric',
								})}
							</div>
						</div>

						<div className="mb-6 mt-6">
							<h2 className="text-black mb-1 text-xs font-semibold">Event Overview & Statistics</h2>
							<p className="text-xs leading-relaxed text-[#757575]">{market.overview.EOS}</p>
						</div>
						<div>
							<h2 className="text-black mb-1 text-xs font-semibold">Rules</h2>
							<p className="text-xs leading-relaxed text-[#757575]">{market.overview.Rules}</p>
						</div>
					</div>
				</div>

				<div className="w-[30%] max-[1160px]:w-[35%] max-[970px]:hidden">
					{loggedIn ? (
						<PlaceOrder
							nPrice={market.yesPrice}
							yPrice={market.noPrice}
							yesSide={{ price: 9.5, maxQty: 9111, limitPrice: 19 }}
							noSide={{ price: 8.5, maxQty: 10000, limitPrice: 20 }}
							onOrderPlaced={() => {
								console.log('Order placed, refresh data if needed');
							}}
						/>
					) : (
						<>
							<div className="space-y-6">
								<div className="w-full bg-[#EDEDED] mt-3 rounded-xl flex p-5">
									<div className="flex flex-col flex-1 justify-center">
										<h3 className="text-xl font-semibold mb-2">
											DOWNLOAD APP FOR BETTER & FAST EXPERIENCE
										</h3>
										<button className="bg-[#262626] mt-2 text-white text-sm font-semibold px-4 py-2.5 rounded">
											Download Now
										</button>
									</div>
									<div className="flex-1 flex justify-end items-center">
										<img
											src={downloadIcon}
											alt="Download Icon"
											className="w-28 h-28 object-contain"
										/>
									</div>
								</div>
								<div className="flex bg-white p-4 w-full gap-3 rounded-lg border border-opacity-50">
									<button className="text-[#197BFF] border border-[#BAD6FF] cursor-pointer bg-[#E8F2FF] text-sm px-3 py-2 rounded-sm w-full font-semibold">
										Yes ₹{market.yesPrice}
									</button>
									<button className="text-[#DC2804] border border-[#F9D8D6] cursor-pointer bg-[#FDF3F2] text-sm px-3 py-2 rounded-sm w-full font-semibold">
										No ₹{market.noPrice}
									</button>
								</div>
							</div>
						</>
					)}
				</div>
			</div>

			<div className="hidden max-[970px]:flex justify-between items-center px-10 py-3 bg-white bottom-0 fixed w-full z-50 gap-6">
				<button className="text-[#197BFF] cursor-pointer bg-[#E8F2FF] text-sm px-3 py-2.5 rounded-sm w-full font-semibold border border-[#BAD6FF] ">
					Yes ₹{market.yesPrice}
				</button>
				<button className="text-[#DC2804] cursor-pointer bg-[#FDF3F2] border border-[#F9D8D6]  text-sm px-3 py-2.5 rounded-sm w-full font-semibold">
					No ₹{market.noPrice}
				</button>
			</div>
		</div>
	);
}
