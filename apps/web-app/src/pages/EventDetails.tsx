import { api } from '@/lib/axios';
import { socket } from '@/socket';
import { useAuthStore } from '@/store/auth';
import { ChevronRight, Bookmark, Share2, RefreshCcw } from 'lucide-react';
import { useParams, Link } from 'react-router-dom';
import pfpIcon from '@/assets/images/pfp.avif';
import { formatDistanceToNow } from 'date-fns';
import PlaceOrder from '@/components/PlaceOrder';
import TimelineSection from '@/components/Timeline';
import downloadIcon from '@/assets/images/download.avif';
import defaultThumbnail from '@/assets/images/logo.avif';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import ShareModal from '@/components/modals/ShareModal';
import OrderbookLadder from '@/components/OrderbookLadder';

interface TradeExecutedEvent {
	marketId: string;
	makerId: string;
	takerId: string;
	makerOrderId: string;
	takerOrderId: string;
	stockType: string;
	takerAction: string;
	price: number;
	quantity: number;
	timestamp: string;
	matchType: string;
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
	timeline: any[];
	trades: TradeExecutedEvent[];
	volume: number;
	traders: number;
	endTime: string;
	category?: string;
	overview: {
		EndDate: string;
		startDate?: string;
		eos?: string;
		Rules?: string;
	}
}

export default function EventDetails() {
	const { symbol } = useParams<{ symbol: string }>();

	const { isLoggedIn } = useAuthStore();
	const loggedIn = isLoggedIn();

	const [market, setMarket] = useState<Market | null>(null);
	const [loading, setLoading] = useState(true);

	const [activeBoxTab, setActiveBoxTab] = useState<'orderbook' | 'activity'>('orderbook');
	const [innerTab, setInnerTab] = useState<'Yes' | 'No'>('Yes');
	const [isBookmarked, setIsBookmarked] = useState(false);
	const [isMobileOrderOpen, setIsMobileOrderOpen] = useState(false);
	const [isOrderbookLocked, setIsOrderbookLocked] = useState(false);
	const [isShareModalOpen, setIsShareModalOpen] = useState(false);
	const [resetScrollToken, setResetScrollToken] = useState(0);

	const maskPhoneNumber = (phone: string) => {
		if (!phone || phone.length < 4) return phone;
		const last4 = phone.slice(-4);
		const masked = '*'.repeat(phone.length - 4);
		return masked + last4;
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
				try {
					if (!prev) return prev;
					if (!data) return prev;

					const updatedOrderbook = {
						yes: [...(prev.orderbook?.yes || [])],
						no: [...(prev.orderbook?.no || [])],
					};

					const incomingOrderbook = data.orderbook || data.Orderbook;
					if (incomingOrderbook) {
						['yes', 'no'].forEach((side) => {
							const sideKey = side as keyof typeof updatedOrderbook;
							const capitalized = side.charAt(0).toUpperCase() + side.slice(1);
							const updates = incomingOrderbook[side] || incomingOrderbook[capitalized];
							if (!Array.isArray(updates)) return;

							updates.forEach((update: any) => {
								const idx = updatedOrderbook[sideKey].findIndex(
									(o: any) => o.price === update.price,
								);

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
							});

							updatedOrderbook[sideKey].sort((a: any, b: any) =>
								side === 'yes' ? b.price - a.price : a.price - b.price,
							);
						});
					}

					const newYesPrice = typeof data.yesPrice === 'number' ? data.yesPrice : prev.yesPrice;
					const newNoPrice = typeof data.noPrice === 'number' ? data.noPrice : prev.noPrice;

					let newVolume = prev.volume || 0;
					let newTraders = prev.traders || 0;
					let updatedTrades = [...(prev.trades || [])];
					let newTimeline = [...(prev.timeline || [])];

					if (data.trades && Array.isArray(data.trades)) {
						data.trades.forEach((newTrade: TradeExecutedEvent) => {
							const exists = updatedTrades.some(
								(trade: TradeExecutedEvent) =>
									trade.makerOrderId === newTrade.makerOrderId &&
									trade.takerOrderId === newTrade.takerOrderId &&
									trade.price === newTrade.price &&
									trade.timestamp === newTrade.timestamp,
							);
							if (!exists) {
								updatedTrades.unshift(newTrade);
								newVolume += (newTrade.price * newTrade.quantity) / 10;
							}
						});
						updatedTrades = updatedTrades.slice(0, 50);
					}

					return {
						...prev,
						orderbook: updatedOrderbook,
						yesPrice: newYesPrice,
						noPrice: newNoPrice,
						timeline: newTimeline,
						trades: updatedTrades,
						volume: newVolume,
						traders: newTraders,
					};
				} catch (err) {
					console.error('Error processing socket MESSAGE:', err);
					return prev;
				}
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
			.then((res) => {
				setMarket(res.data.data);
				if (loggedIn && res.data.data) {
					checkBookmark(res.data.data.marketId);
				}
			})
			.catch((err) => console.error('Error fetching market details:', err))
			.finally(() => setLoading(false));
	}, [symbol, loggedIn]);

	const checkBookmark = async (marketId: string) => {
		try {
			const res = await api.get('/profile/watchlist');
			if (res.data?.success) {
				const isSaved = res.data.data.some((m: any) => m.id === marketId);
				setIsBookmarked(isSaved);
			}
		} catch (error) {
			console.error('Failed to fetch watchlist', error);
		}
	};

	const toggleBookmark = async () => {
		if (!market || !loggedIn) return;
		try {
			if (isBookmarked) {
				await api.delete(`/profile/watchlist/${market.marketId}`);
				setIsBookmarked(false);
			} else {
				await api.post('/profile/watchlist', { marketId: market.marketId });
				setIsBookmarked(true);
			}
		} catch (error) {
			console.error('Failed to toggle bookmark', error);
		}
	};

	if (loading) return <p className="p-4 text-foreground">Loading...</p>;
	if (!market) return <p className="p-4 text-foreground">Market not found.</p>;

	const calculateOrderbookDisplay = (outcome: 'Yes' | 'No') => {
		let bids: any[] = [];
		let asks: any[] = [];

		if (outcome === 'Yes') {
			bids = (market.orderbook?.yes || [])
				.filter((o) => o.price > 0 && o.quantity > 0)
				.sort((a, b) => b.price - a.price)
				.slice(0, 15);

			asks = (market.orderbook?.no || [])
				.filter((o) => o.price > 0 && o.quantity > 0 && o.price < 10)
				.map((o) => ({ price: 10 - o.price, quantity: o.quantity }))
				.sort((a, b) => b.price - a.price)
				.slice(0, 15);
		} else {
			bids = (market.orderbook?.no || [])
				.filter((o) => o.price > 0 && o.quantity > 0)
				.sort((a, b) => b.price - a.price)
				.slice(0, 15);

			asks = (market.orderbook?.yes || [])
				.filter((o) => o.price > 0 && o.quantity > 0 && o.price < 10)
				.map((o) => ({ price: 10 - o.price, quantity: o.quantity }))
				.sort((a, b) => b.price - a.price)
				.slice(0, 15);
		}

		return { bids, asks };
	};

	const { bids, asks } = calculateOrderbookDisplay(innerTab);

	return (
		<div className="w-full bg-background min-h-screen py-4 flex items-start justify-center text-foreground transition-colors">
			<div className="flex gap-12 w-full px-[128px] pt-20 max-[1220px]:px-[40px] max-[640px]:px-[20px]">
				<div className="w-[70%] max-[1160px]:w-[65%] max-[970px]:w-full">
					<div className="flex justify-between items-start mb-8 gap-4">
						<div className="flex items-start gap-4">
							<div className="w-16 h-16 md:w-[72px] md:h-[72px] shrink-0 rounded-xl overflow-hidden border border-border shadow-sm">
								<img
									src={market.thumbnail || defaultThumbnail}
									alt={market.title}
									className="w-full h-full object-cover bg-white dark:bg-[#262626]"
								/>
							</div>
							<div>
								<div className="flex items-center gap-2 mb-2">
									<span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider bg-muted/60 px-2.5 py-1 rounded-md border border-border/50">
										{market.category || 'Event'}
									</span>
								</div>
								<h1 className="md:text-xl text-lg font-bold leading-tight">
									{market.title}
								</h1>
							</div>
						</div>

						<div className="flex gap-2 shrink-0">
							<button onClick={toggleBookmark} className="p-2 border border-border rounded-lg bg-card text-foreground hover:bg-muted transition shadow-sm">
								<Bookmark size={18} fill={isBookmarked ? "currentColor" : "none"} />
							</button>
							<button onClick={() => setIsShareModalOpen(true)} className="p-2 border border-border rounded-lg bg-card text-foreground hover:bg-muted transition shadow-sm">
								<Share2 size={18} />
							</button>
						</div>
					</div>

					<div className="mb-6">
						<TimelineSection
							symbol={market.symbol}
							yesPrice={market.yesPrice}
							noPrice={market.noPrice}
							volume={market.volume || 0}
							overview={market.overview}
							traders={market.traders || 0}
						/>
					</div>

					<div className="mb-8 border border-border rounded-xl shadow-sm bg-card overflow-hidden">
						<div className="flex border-b border-border bg-muted/30">
							{['Orderbook', 'Activity'].map((tab) => (
								<button
									key={tab}
									onClick={() => setActiveBoxTab(tab.toLowerCase() as any)}
									className={`flex-1 py-3.5 text-sm font-bold relative transition ${activeBoxTab === tab.toLowerCase()
										? 'text-foreground'
										: 'text-muted-foreground hover:text-foreground'
										}`}
								>
									{tab}
									{activeBoxTab === tab.toLowerCase() && (
										<div className="absolute bottom-0 left-0 w-full h-[2px] bg-foreground"></div>
									)}
								</button>
							))}
						</div>

						<div className="p-5 md:p-6 h-[650px] flex flex-col">
							{activeBoxTab === 'orderbook' && (
								<div className="flex flex-col h-full min-h-0">
									<div className="flex justify-between items-center mb-4 border-b border-border w-full shrink-0">
										<div className="flex gap-6">
											{['Yes', 'No'].map((tab) => (
												<button
													key={tab}
													onClick={() => {
												setInnerTab(tab as any);
												setTimeout(() => setResetScrollToken(prev => prev + 1), 60);
											}}
													className={`py-2 text-sm font-bold relative transition-colors ${innerTab === tab
														? 'text-foreground'
														: 'text-muted-foreground hover:text-foreground'
														}`}
												>
													Trade {tab.toUpperCase()}
													{innerTab === tab && (
														<div className="absolute bottom-0 left-0 w-full h-[2px] bg-foreground"></div>
													)}
												</button>
											))}
										</div>
										<div className="flex items-center gap-2">
											<button
												onClick={() => setResetScrollToken(prev => prev + 1)}
												className="flex items-center justify-center p-1.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted/50 border border-transparent transition-colors"
												title="Re-centre Spread"
											>
												<RefreshCcw className="w-4 h-4" />
											</button>
											<button
												onClick={() => setIsOrderbookLocked(!isOrderbookLocked)}
												className={`flex items-center justify-center p-1.5 rounded-md transition-colors border ${isOrderbookLocked ? 'bg-blue-500/10 text-blue-500 border-blue-500/30' : 'text-muted-foreground hover:text-foreground border-transparent hover:bg-muted/50'}`}
												title={isOrderbookLocked ? "Unlock Scroll" : "Lock Scroll (Center Spread)"}
											>
												<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
											</button>
										</div>
									</div>

									<div className="w-full flex-1 min-h-0">
										<OrderbookLadder
											bids={bids}
											asks={asks}
											onPriceSelect={(price, qty) => {
												// Select price in order form
											}}
											isLocked={isOrderbookLocked}
											resetScrollToken={resetScrollToken}
										/>
									</div>
								</div>
							)}

							{activeBoxTab === 'activity' && (
								<div className="flex flex-col h-full min-h-0 relative">
									<div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-card to-transparent z-10 pointer-events-none"></div>

									<div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-muted-foreground/20 hover:scrollbar-thumb-muted-foreground/40 space-y-1">
										{market.trades && market.trades.length > 0 ? (
											<div className="space-y-4">
												{market.trades.map((trade, idx) => (
													<div
														key={idx}
														className="flex items-center justify-between p-3 bg-white/50 border border-border/40 rounded-xl"
													>
														<div className="flex items-center gap-3">
															<div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
																T
															</div>
															<div className="flex flex-col">
																<span className="font-semibold text-sm">Trade Executed</span>
																<span className="text-xs text-muted-foreground">
																	{new Date(trade.timestamp).toLocaleTimeString()}
																</span>
															</div>
														</div>
														<div className="flex flex-col items-end">
															<span className="font-bold text-sm">
																{trade.quantity} shares
															</span>
															<span
																className={`text-xs font-semibold ${
																	trade.stockType.toLowerCase() === 'yes'
																		? 'text-[#00c853]'
																		: 'text-[#ff3d00]'
																}`}
															>
																{trade.stockType} @ ₹{trade.price}
															</span>
														</div>
													</div>
												))}
											</div>
										) : (
											<div className="flex flex-col items-center justify-center h-full text-center py-12">
												<span className="text-muted-foreground/50 text-4xl mb-3">⚬</span>
												<div className="text-sm font-medium text-muted-foreground">No activities yet</div>
												<div className="text-xs text-muted-foreground/70 mt-1">Trades will appear here in real-time</div>
											</div>
										)}
									</div>
									<div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-card to-transparent z-10 pointer-events-none"></div>
								</div>
							)}
						</div>
					</div>

					<div className="mb-8 bg-card p-6 border border-border rounded-xl shadow-sm">
						<h2 className="text-lg font-bold mb-5 text-foreground">About the Event</h2>
						<div className="flex flex-col md:flex-row md:items-start justify-between gap-6 md:gap-4 mb-8 text-sm">
							<div className="flex-1 flex flex-col gap-1.5 min-w-0 pr-4">
								<span className="text-muted-foreground font-semibold text-xs uppercase tracking-wider">Source of Truth</span>
								<a href="https://icc-cricket.com" target="_blank" rel="noopener noreferrer" className="text-blue-500 font-medium hover:underline flex items-center gap-1 line-clamp-2" title="Official ICC announcements and match results from icc-cricket.com">
									Official ICC announcements and match results
									<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
								</a>
							</div>
							<div className="flex-1 flex flex-col gap-1.5 min-w-0">
								<span className="text-muted-foreground font-semibold text-xs uppercase tracking-wider">Event started</span>
								<span className="text-foreground font-medium">
									{market.overview?.startDate ? new Date(market.overview.startDate).toLocaleDateString(undefined, {
										day: '2-digit', month: 'short', year: 'numeric',
									}) : '--'}
								</span>
							</div>
							<div className="flex-1 flex flex-col gap-1.5 min-w-0">
								<span className="text-muted-foreground font-semibold text-xs uppercase tracking-wider">Event expires</span>
								<span className="text-foreground font-medium">
									{market.overview?.EndDate ? new Date(market.overview.EndDate).toLocaleDateString(undefined, {
										day: '2-digit', month: 'short', year: 'numeric',
									}) : '--'}
								</span>
							</div>
						</div>

						<div className="space-y-6">
							<div>
								<h3 className="text-foreground mb-2 text-sm font-bold">Event Overview</h3>
								<p className="text-sm font-semibold text-black">{market.overview.eos}</p>
							</div>
							<div>
								<h3 className="text-foreground mb-2 text-sm font-bold">Rules</h3>
								<p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">{market.overview?.Rules}</p>
							</div>
						</div>
					</div>

					{/* Comments Section */}
					<div className="mb-12 bg-card p-6 border border-border rounded-xl shadow-sm">
						<h2 className="text-lg font-bold mb-6 text-foreground">Comments</h2>
						<div className="flex gap-4 items-start mb-8">
							<img src={pfpIcon} alt="You" className="w-10 h-10 rounded-full border border-border shrink-0" />
							<div className="flex-1">
								<textarea
									placeholder="Add a comment..."
									className="w-full bg-background border border-border rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none text-foreground placeholder:text-muted-foreground"
									rows={2}
								/>
								<div className="flex justify-end mt-3">
									<button className="bg-foreground text-background font-bold text-sm px-6 py-2 rounded-lg hover:opacity-90 transition">
										Post
									</button>
								</div>
							</div>
						</div>

						<div className="space-y-6">
							{/* Mock Comment 1 */}
							<div className="flex gap-4">
								<div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-orange-400 shrink-0"></div>
								<div>
									<div className="flex items-center gap-2.5 mb-1.5">
										<span className="font-bold text-sm text-foreground">fmfwd</span>
										<span className="text-[10px] font-bold text-green-600 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">17.5K Yes</span>
										<span className="text-xs font-semibold text-muted-foreground">11h ago</span>
									</div>
									<p className="text-sm text-foreground">turn gay since I do copytrading!</p>
								</div>
							</div>

							{/* Mock Comment 2 */}
							<div className="flex gap-4">
								<div className="w-10 h-10 rounded-full bg-gradient-to-tr from-yellow-600 to-red-400 shrink-0"></div>
								<div>
									<div className="flex items-center gap-2.5 mb-1.5">
										<span className="font-bold text-sm text-foreground">socialwolf3115</span>
										<span className="text-xs font-semibold text-muted-foreground">17h ago</span>
									</div>
									<p className="text-sm text-foreground">copy trading hits while im sleeping</p>
								</div>
							</div>
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
								<div className="w-full bg-muted mt-3 rounded-xl flex p-6 border border-border">
									<div className="flex flex-col flex-1 justify-center">
										<h3 className="text-lg font-bold mb-3 leading-tight text-foreground">
											DOWNLOAD APP FOR BETTER EXPERIENCE
										</h3>
										<button className="bg-foreground mt-2 text-background text-sm font-bold px-5 py-2.5 rounded-lg w-max">
											Download Now
										</button>
									</div>
									<div className="flex-1 flex justify-end items-center">
										<img
											src={downloadIcon}
											alt="Download Icon"
											className="w-24 h-24 object-contain"
										/>
									</div>
								</div>
								<div className="flex bg-card p-4 w-full gap-3 rounded-xl border border-border shadow-sm">
									<button className="text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900 cursor-pointer bg-blue-50 dark:bg-blue-950/30 text-sm px-3 py-2.5 rounded-lg w-full font-bold transition hover:bg-blue-100 dark:hover:bg-blue-900/50">
										Yes ₹{market.yesPrice}
									</button>
									<button className="text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900 cursor-pointer bg-red-50 dark:bg-red-950/30 text-sm px-3 py-2.5 rounded-lg w-full font-bold transition hover:bg-red-100 dark:hover:bg-red-900/50">
										No ₹{market.noPrice}
									</button>
								</div>
							</div>
						</>
					)}
				</div>
			</div>

			{/* Mobile Bottom Order Bar (Opens PlaceOrder) */}
			<div className="hidden max-[970px]:flex justify-between items-center px-6 py-4 bg-card border-t border-border bottom-0 fixed w-full z-50 gap-4">
				<button onClick={() => { setInnerTab('Yes'); setIsMobileOrderOpen(true); }} className="text-green-600 border border-green-200 bg-green-50 dark:bg-green-950/30 text-sm px-3 py-3 rounded-lg w-full font-bold">
					Yes ₹{market.yesPrice}
				</button>
				<button onClick={() => { setInnerTab('No'); setIsMobileOrderOpen(true); }} className="text-red-600 border border-red-200 bg-red-50 dark:bg-red-950/30 text-sm px-3 py-3 rounded-lg w-full font-bold">
					No ₹{market.noPrice}
				</button>
			</div>

			{/* Mobile Order Popup/Drawer */}
			{isMobileOrderOpen && (
				<div className="fixed inset-0 z-[60] flex flex-col justify-end bg-black/60 backdrop-blur-sm" onClick={() => setIsMobileOrderOpen(false)}>
					<motion.div
						initial={{ y: "100%" }}
						animate={{ y: 0 }}
						exit={{ y: "100%" }}
						transition={{ type: "spring", bounce: 0, duration: 0.4 }}
						className="bg-card w-full rounded-t-2xl p-4"
						onClick={(e) => e.stopPropagation()}
					>
						<div className="w-12 h-1.5 bg-border rounded-full mx-auto mb-4" />
						{loggedIn ? (
							<PlaceOrder
								symbol={market.symbol}
								marketId={market.marketId}
								yPrice={market.yesPrice}
								nPrice={market.noPrice}
								yOrderPrice={market.yesPrice}
								nOrderPrice={market.noPrice}
								onOrderPlaced={() => {
									setIsMobileOrderOpen(false);
								}}
							/>
						) : (
							<div className="text-center py-6">
								<h3 className="font-bold text-lg mb-2">Login Required</h3>
								<p className="text-muted-foreground mb-4">Please log in to place an order</p>
							</div>
						)}
					</motion.div>
				</div>
			)}

			<ShareModal
				isOpen={isShareModalOpen}
				onClose={() => setIsShareModalOpen(false)}
				title={market.title}
				url={window.location.href}
			/>
		</div>
	);
}
