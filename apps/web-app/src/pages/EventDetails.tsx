import { api } from '@/lib/axios';
import { socket } from '@/socket';
import { useAuthStore } from '@/store/auth';
import { ChevronRight } from 'lucide-react';
import { useParams } from 'react-router-dom';
import pfpIcon from '@/assets/images/pfp.avif';
import { formatDistanceToNow } from "date-fns";
import PlaceOrder from '@/components/PlaceOrder';
import TimelineSection from '@/components/Timeline';
import shareIcon from '@/assets/images/share-icon.svg';
import PlusIcon from '@/assets/images/plus_circled.svg';
import downloadIcon from '@/assets/images/download.avif';
import React, { useEffect, useRef, useState } from 'react';

interface Activity {
	id?: string;
	buyerPhone: string;
	sellerPhone: string;
	outcome: string;
	price: number;
	quantity: number;
	timestamp: string;
	buyPrice?: number;
	sellPrice?: number;
}

interface Market {
	symbol: string;
	marketId: string;
	title: string;
	thumbnail: string;
	yesPrice: number;
	noPrice: number;
	orderbook: {
		yes: any[];
		no: any[];
	};
	activities: Activity[];
	timeline: any[];
	overview: any;
}

export default function EventDetails() {
	const { symbol } = useParams<{ symbol: string }>();

	const { isLoggedIn } = useAuthStore();
	const loggedIn = isLoggedIn();

	const [market, setMarket] = useState<Market | null>(null);
	const [loading, setLoading] = useState(true);
	const [activeTab, setActiveTab] = useState('orderbook');

	const orderbookRef = useRef<HTMLDivElement>(null);
	const timelineRef = useRef<HTMLDivElement>(null);
	const overviewRef = useRef<HTMLDivElement>(null);

	const maskPhoneNumber = (phone: string) => {
		if (!phone || phone.length < 4) return phone;
		const last4 = phone.slice(-4);
		const masked = '*'.repeat(phone.length - 4);
		return masked + last4;
	};

	const getOppositeActivityColor = (outcome: string) => {
		return outcome === 'YES' ? 'text-[#DC2804]' : 'text-[#197BFF]';
	};

	useEffect(() => {
		if (!symbol) return;

		if (socket.connected) {
			socket.emit('SUBSCRIBE', symbol);
		} else {
			socket.connect();
			socket.once('connect', () => {
				socket.emit('SUBSCRIBE', symbol);
			});
		}

		socket.on('MESSAGE', (data) => {
			setMarket((prev: Market | null) => {
				if (!prev) return data;

				console.log('socket data is ', data);

				const updatedOrderbook = { ...prev.orderbook };

				['yes', 'no'].forEach((side) => {
					const sideKey = side as keyof typeof updatedOrderbook;
					const updates =
						data.orderbook[side] || data.orderbook[side.charAt(0).toUpperCase() + side.slice(1)];
					updates?.forEach((update: any) => {
						const idx = updatedOrderbook[sideKey].findIndex((o: any) => o.price === update.price);

						if (idx > -1) {
							if (update.quantity > 0) {
								updatedOrderbook[sideKey][idx] = update;
							} else {
								updatedOrderbook[sideKey].splice(idx, 1);
							}
						} else {
							if (update.quantity > 0) {
								updatedOrderbook[sideKey].push(update);
							}
						}

						updatedOrderbook[sideKey].sort((a: any, b: any) =>
							side === 'yes' ? b.price - a.price : a.price - b.price,
						);
					});
				});

				const newYesPrice = data.yesPrice;
				const newNoPrice = data.noPrice;

				let updatedActivities = [...prev.activities];
				if (data.activities && Array.isArray(data.activities)) {
					data.activities.forEach((newActivity: Activity) => {
						const exists = updatedActivities.some(
							(act: Activity) =>
								act.buyerPhone === newActivity.buyerPhone &&
								act.sellerPhone === newActivity.sellerPhone &&
								act.price === newActivity.price &&
								act.timestamp === newActivity.timestamp
						);
						if (!exists) {
							updatedActivities.unshift(newActivity);
						}
					});
					updatedActivities = updatedActivities.slice(0, 50);
				}

				return {
					...prev,
					orderbook: updatedOrderbook,
					yesPrice: newYesPrice,
					noPrice: newNoPrice,
					activities: updatedActivities
				};
			});
		});

		return () => {
			socket.emit('UNSUBSCRIBE', symbol);
			socket.off('MESSAGE');
			socket.off('connect');
			socket.disconnect();
		};
	}, [symbol]);

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
								className={`pb-2 capitalize cursor-pointer relative w-28 text-[#545454] ${activeTab === tab
									? 'after:content-[""] after:absolute after:left-0 after:bottom-0 after:w-full after:h-[2px] after:bg-black'
									: ''
									}`}
							>
								{tab.replace(/^\w/, (c) => c.toUpperCase())}
							</button>
						))}
					</div>

					{loggedIn && (
						<div ref={orderbookRef} className="mb-8 bg-white px-6 py-4 border rounded-lg">
							<div className="flex gap-8 border-b-2 mb-6 border-[#ededed]">
								{['orderbook', 'Activity'].map((tab) => (
									<button
										key={tab}
										onClick={() => setInnerTab(tab)}
										className={`pb-2 capitalize cursor-pointer text-[#545454] relative ${innerTab === tab
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
										{(() => {
											const yesOrders =
												market?.orderbook?.yes?.filter((order: any) => order.price > 0) || [];

											const sortedOrders = yesOrders.sort((a: any, b: any) => a.price - b.price);

											const displayOrders = [
												...sortedOrders.slice(0, 5),
												...Array(Math.max(0, 5 - sortedOrders.length)).fill({
													price: 0,
													quantity: 0,
												}),
											];

											const maxQty =
												yesOrders.length > 0
													? Math.max(...yesOrders.map((o: any) => o.quantity))
													: 0;

											return displayOrders.map(
												(yes: { quantity: number; price: number }, idx: number) => {
													const widthPercent = maxQty > 0 ? (yes.quantity / maxQty) * 100 : 0;

													return (
														<div key={idx} className="grid grid-cols-2 border-t">
															<span className="px-1 py-1.5">{yes.price}</span>
															<span
																className="text-right relative py-1.5 px-1 block"
																style={{
																	background: `linear-gradient(to left, #BCD8FE ${widthPercent}%, transparent ${widthPercent}%)`,
																}}
															>
																{yes.quantity}
															</span>
														</div>
													);
												},
											);
										})()}
									</div>

									<div>
										<div className="grid grid-cols-2 pb-3">
											<span className="font-semibold">PRICE</span>
											<span className="text-right">
												QTY <span className="text-[#DC2804]">NO</span>
											</span>
										</div>
										{(() => {
											const noOrders =
												market?.orderbook?.no?.filter((order: any) => order.price > 0) || [];

											// sort by price ascending
											const sortedOrders = noOrders.sort((a: any, b: any) => a.price - b.price);

											// Take top 5 or fill with placeholders
											const displayOrders = [
												...sortedOrders.slice(0, 5),
												...Array(Math.max(0, 5 - sortedOrders.length)).fill({
													price: 0,
													quantity: 0,
												}),
											];

											const maxQty =
												noOrders.length > 0 ? Math.max(...noOrders.map((o: any) => o.quantity)) : 0;

											return displayOrders.map(
												(no: { quantity: number; price: number }, idx: number) => {
													const widthPercent = maxQty > 0 ? (no.quantity / maxQty) * 100 : 0;

													return (
														<div key={idx} className="grid grid-cols-2 border-t">
															<span className="px-1 py-1.5">{no.price}</span>
															<span
																className="text-right relative py-1.5 px-1 block"
																style={{
																	background: `linear-gradient(to left, #FFDCDB ${widthPercent}%, transparent ${widthPercent}%)`,
																}}
															>
																{no.quantity}
															</span>
														</div>
													);
												},
											);
										})()}
									</div>
								</div>
							)}

							{innerTab === 'Activity' && (
								<div className="">
									<div className="flex justify-between mb-2 items-center">
										<div className="text-center">
											<h3 className="font-semibold text-xs">BUYER</h3>
										</div>
										<div className="text-center">
											<h3 className="font-semibold text-xs">SELLER</h3>
										</div>
									</div>

									{market?.activities?.slice(0, 5).map((activity: Activity, index: number) => (
										<div
											key={activity.id || index}
											className={`grid grid-cols-3 gap-4 items-center py-3 ${index < 4 ? 'border-b border-gray-100' : ''
												}`}
										>
											<div className="flex flex-col md:flex-row md:items-center items-start gap-4">
												<img
													src={pfpIcon}
													alt="Buyer"
													className="md:w-10 w-9 md:h-10 h-9 rounded-full border"
												/>
												<div>
													<p className={`font-medium md:text-sm text-xs`}>
														{maskPhoneNumber(activity.buyerPhone)}
													</p>
												</div>
											</div>

											<div className="text-center">
												<div className="space-y-1">
													<p className="md:text-xs text-[10px] text-black">
														{formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
													</p>
												</div>
											</div>

											<div className="flex flex-col md:flex-row md:items-center items-end gap-4 justify-end">
												<img
													src={pfpIcon}
													alt="Seller"
													className="md:w-10 w-9 md:h-10 h-9 rounded-full border order-first md:order-last"
												/>
												<div className="md:text-sm text-xs text-right order-last md:order-first">
													<p className="font-medium">
														{maskPhoneNumber(activity.sellerPhone)}
													</p>
												</div>
											</div>

										</div>
									))}

									{(!market?.activities || market.activities.length === 0) && (
										<div className="text-center py-8 text-gray-500">
											No activities yet
										</div>
									)}
								</div>
							)}
						</div>
					)}

					<div ref={timelineRef} className="mb-12">
						<TimelineSection data={market.timeline} />
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
							symbol={market.symbol}
							marketId={market.marketId}
							yPrice={market.yesPrice}
							nPrice={market.noPrice}
							yOrderPrice={market.yesPrice}
							nOrderPrice={market.noPrice}
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
