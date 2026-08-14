import { useState, useRef, useEffect } from 'react';
import { Loader2, ChevronDown } from 'lucide-react';
import { usePlaceOrderMutation } from '@/hooks/mutations/order';
import { useSplitSharesMutation, useMergeSharesMutation } from '@/hooks/mutations/event';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface PlaceOrderProps {
	yPrice: number;
	nPrice: number;
	yOrderPrice: number;
	nOrderPrice: number;
	onOrderPlaced?: () => void;
	symbol: string;
	marketId: string;
	title?: string;
	thumbnail?: string;
}

export default function PlaceOrder({
	yPrice,
	nPrice,
	yOrderPrice,
	nOrderPrice,
	symbol,
	marketId,
	onOrderPlaced,
	title,
	thumbnail,
}: PlaceOrderProps) {
	const [action, setAction] = useState<'BUY' | 'SELL'>('BUY');
	const [activeTab, setActiveTab] = useState<'YES' | 'NO'>('YES');
	const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT' | 'SPLIT' | 'MERGE'>('MARKET');
	const [dropdownOpen, setDropdownOpen] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);

	const [yesOrderPrice, setYesOrderPrice] = useState<string | number>(yOrderPrice || 5.0);
	const [noOrderPrice, setNoOrderPrice] = useState<string | number>(nOrderPrice || 5.0);
	const [amount, setAmount] = useState<number | string>('');
	const [shares, setShares] = useState<number | string>(0);

	const placeOrder = usePlaceOrderMutation();
	const splitShares = useSplitSharesMutation();
	const mergeShares = useMergeSharesMutation();

	const isSplitMerge = orderType === 'SPLIT' || orderType === 'MERGE';
	const isLimit = orderType === 'LIMIT';
	const isMarket = orderType === 'MARKET';

	useEffect(() => {
		if (yOrderPrice && activeTab === 'YES') setYesOrderPrice(yOrderPrice);
		if (nOrderPrice && activeTab === 'NO') setNoOrderPrice(nOrderPrice);
	}, [yOrderPrice, nOrderPrice, activeTab]);

	useEffect(() => {
		const handler = (e: MouseEvent) => {
			if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
				setDropdownOpen(false);
		};
		if (dropdownOpen) document.addEventListener('mousedown', handler);
		return () => document.removeEventListener('mousedown', handler);
	}, [dropdownOpen]);

	const activePrice = activeTab === 'YES' ? yesOrderPrice : noOrderPrice;
	const currentMarketPrice = activeTab === 'YES' ? yPrice : nPrice;

	// For market orders, amount-based. For limit, price+shares based
	const numAmount = Number(amount) || 0;
	const numShares = Number(shares) || 0;

	let estimatedCost = 0;
	let fee = 0;
	let displayShares = 0;

	if (isSplitMerge) {
		estimatedCost = numShares * 10.0;
	} else if (isMarket) {
		estimatedCost = numAmount;
		displayShares = currentMarketPrice > 0 ? Math.floor(numAmount / currentMarketPrice) : 0;
		fee = estimatedCost * 0.0025;
	} else {
		// Limit
		const limitPrice = Number(activePrice) || 0;
		estimatedCost = numShares * limitPrice;
		fee = estimatedCost * 0.0025;
	}

	const totalCost = estimatedCost + fee;
	const isActionPending = placeOrder.isPending || splitShares.isPending || mergeShares.isPending;

	const handleAction = () => {
		if (isSplitMerge) {
			if (numShares <= 0) {
				toast.error('Enter valid quantity');
				return;
			}
			const mutation = orderType === 'SPLIT' ? splitShares : mergeShares;
			mutation.mutate(
				{ symbol, quantity: numShares },
				{
					onSuccess: (res) => {
						if (res.data?.success) {
							toast.success(res.data.message);
							onOrderPlaced?.();
							setShares(0);
						} else {
							toast.error(res.data?.error || `Failed to ${orderType.toLowerCase()}`);
						}
					},
					onError: () => toast.error(`Error processing ${orderType.toLowerCase()}`),
				},
			);
			return;
		}

		if (isMarket) {
			if (displayShares <= 0) {
				toast.error('Enter a valid amount');
				return;
			}
			placeOrder.mutate(
				{
					side: activeTab,
					symbol,
					action,
					price: currentMarketPrice,
					orderType: 'MARKET',
					quantity: displayShares,
					marketId,
				},
				{
					onSuccess: (res) => {
						if (res.data?.success) {
							toast.success(`Order placed: ${action} ${activeTab} x ${displayShares}`);
							onOrderPlaced?.();
							setAmount('');
						} else {
							toast.error(res.data?.error || res.data?.message || 'Failed');
						}
					},
					onError: () => toast.error('Error placing order'),
				},
			);
		} else {
			// Limit
			const limitPrice = Number(activePrice) || 0;
			if (limitPrice <= 0) {
				toast.error('Enter valid price');
				return;
			}
			if (numShares <= 0) {
				toast.error('Enter valid shares');
				return;
			}
			placeOrder.mutate(
				{
					side: activeTab,
					symbol,
					action,
					price: limitPrice,
					orderType: 'LIMIT',
					quantity: numShares,
					marketId,
				},
				{
					onSuccess: (res) => {
						if (res.data?.success) {
							toast.success(`Order placed: ${action} ${activeTab} x ${numShares}`);
							onOrderPlaced?.();
							setShares(0);
						} else {
							toast.error(res.data?.error || res.data?.message || 'Failed');
						}
					},
					onError: () => toast.error('Error placing order'),
				},
			);
		}
	};

	const setPrice = (val: number) => {
		if (val < 0.5) val = 0.5;
		if (val > 9.5) val = 9.5;
		activeTab === 'YES' ? setYesOrderPrice(val.toFixed(1)) : setNoOrderPrice(val.toFixed(1));
	};

	const orderTypeLabel =
		orderType === 'MARKET'
			? 'Market'
			: orderType === 'LIMIT'
				? 'Limit'
				: orderType === 'SPLIT'
					? 'Split'
					: 'Merge';

	return (
		<div className="bg-card border border-border rounded-2xl p-5 w-full">
			{/* Header: Thumbnail + Title */}
			{title && (
				<div className="flex items-start gap-3 mb-5">
					<div className="w-10 h-10 shrink-0 rounded-md overflow-hidden bg-muted">
						<img
							src={
								!thumbnail || thumbnail.includes('34d989f64bf44f84bf3dfd398f6d2b67.png')
									? 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=100&h=100&fit=crop'
									: thumbnail
							}
							alt=""
							className="w-full h-full object-cover"
						/>
					</div>
					<div className="min-w-0 flex-1">
						<p className="text-[15px] text-muted-foreground font-medium leading-tight line-clamp-2">
							{title}
						</p>
					</div>
				</div>
			)}

			{/* Buy / Sell tabs + Order Type dropdown */}
			{!isSplitMerge && (
				<div className="flex items-center justify-between mb-5">
					<div className="flex gap-1">
						{(['BUY', 'SELL'] as const).map((a) => (
							<button
								key={a}
								onClick={() => setAction(a)}
								className={`px-4 py-1.5 text-sm font-bold transition-colors relative cursor-pointer ${
									action === a ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
								}`}
							>
								{a === 'BUY' ? 'Buy' : 'Sell'}
								{action === a && (
									<motion.div
										layoutId="action-underline"
										className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground rounded-full"
									/>
								)}
							</button>
						))}
					</div>

					<div className="relative" ref={dropdownRef}>
						<button
							onClick={() => setDropdownOpen(!dropdownOpen)}
							className="flex items-center gap-1 text-sm font-semibold text-foreground hover:text-foreground/80 transition-colors cursor-pointer"
						>
							{orderTypeLabel}
							<ChevronDown
								className={`w-4 h-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
							/>
						</button>
						<AnimatePresence>
							{dropdownOpen && (
								<motion.div
									initial={{ opacity: 0, y: -4 }}
									animate={{ opacity: 1, y: 0 }}
									exit={{ opacity: 0, y: -4 }}
									transition={{ duration: 0.12 }}
									className="absolute top-full right-0 mt-2 z-50 bg-popover border border-border rounded-xl shadow-2xl overflow-hidden min-w-[140px]"
								>
									{(['Market', 'Limit'] as const).map((opt) => (
										<button
											key={opt}
											onClick={() => {
												setOrderType(opt.toUpperCase() as any);
												setDropdownOpen(false);
											}}
											className={`w-full px-5 py-3 text-sm font-semibold text-left transition-colors hover:bg-muted cursor-pointer ${
												orderType === opt.toUpperCase()
													? 'text-foreground'
													: 'text-muted-foreground'
											}`}
										>
											{opt}
										</button>
									))}
									<div className="h-px bg-muted mx-3" />
									{(['Split', 'Merge'] as const).map((opt) => (
										<button
											key={opt}
											onClick={() => {
												setOrderType(opt.toUpperCase() as any);
												setDropdownOpen(false);
											}}
											className={`w-full px-5 py-3 text-sm font-semibold text-left transition-colors hover:bg-muted cursor-pointer ${
												orderType === opt.toUpperCase()
													? 'text-foreground'
													: 'text-muted-foreground'
											}`}
										>
											{opt}
										</button>
									))}
								</motion.div>
							)}
						</AnimatePresence>
					</div>
				</div>
			)}

			{isSplitMerge && (
				<div className="flex items-center justify-between mb-5">
					<p className="text-sm font-bold text-foreground">
						{orderType === 'SPLIT' ? 'Split Shares' : 'Merge Shares'}
					</p>
					<div className="relative" ref={dropdownRef}>
						<button
							onClick={() => setDropdownOpen(!dropdownOpen)}
							className="flex items-center gap-1 text-sm font-semibold text-foreground hover:text-foreground/80 transition-colors cursor-pointer"
						>
							{orderTypeLabel}
							<ChevronDown
								className={`w-4 h-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
							/>
						</button>
						<AnimatePresence>
							{dropdownOpen && (
								<motion.div
									initial={{ opacity: 0, y: -4 }}
									animate={{ opacity: 1, y: 0 }}
									exit={{ opacity: 0, y: -4 }}
									transition={{ duration: 0.12 }}
									className="absolute top-full right-0 mt-2 z-50 bg-popover border border-border rounded-xl shadow-2xl overflow-hidden min-w-[140px]"
								>
									{(['Market', 'Limit', 'Split', 'Merge'] as const).map((opt) => (
										<button
											key={opt}
											onClick={() => {
												setOrderType(opt.toUpperCase() as any);
												setDropdownOpen(false);
											}}
											className={`w-full px-5 py-3 text-sm font-semibold text-left transition-colors hover:bg-muted cursor-pointer ${
												orderType === opt.toUpperCase()
													? 'text-foreground'
													: 'text-muted-foreground'
											}`}
										>
											{opt}
										</button>
									))}
								</motion.div>
							)}
						</AnimatePresence>
					</div>
				</div>
			)}

			{/* YES / NO Outcome Buttons */}
			{!isSplitMerge && (
				<div className="flex gap-2 mb-6">
					<button
						onClick={() => setActiveTab('YES')}
						className={`flex-1 py-3 text-sm font-medium rounded-md transition-all cursor-pointer ${
							activeTab === 'YES'
								? 'bg-green-600 text-white'
								: 'bg-muted text-muted-foreground hover:bg-accent'
						}`}
					>
						Yes ₹{yPrice.toFixed(1)}
					</button>
					<button
						onClick={() => setActiveTab('NO')}
						className={`flex-1 py-3 text-sm font-medium rounded-md transition-all cursor-pointer ${
							activeTab === 'NO'
								? 'bg-red-600 text-white'
								: 'bg-muted text-muted-foreground hover:bg-accent'
						}`}
					>
						No ₹{nPrice.toFixed(1)}
					</button>
				</div>
			)}

			{/* Market Order: Amount input */}
			{isMarket && (
				<div className="mb-5">
					<div className="flex items-center justify-between mb-2">
						<div>
							<p className="text-[15px] font-medium text-foreground">Amount</p>
						</div>
						<div className="text-right flex items-center justify-end">
							<span className="text-3xl font-medium text-muted-foreground mr-1">₹</span>
							<input
								type="number"
								value={amount}
								onChange={(e) => setAmount(e.target.value)}
								placeholder="0"
								className="text-3xl font-medium text-right bg-transparent border-none focus:outline-none focus:ring-0 w-24 p-0 text-foreground placeholder:text-muted-foreground/50 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
							/>
						</div>
					</div>

					<div className="flex gap-2 mt-4">
						{[1, 5, 10, 100].map((v) => (
							<button
								key={v}
								onClick={() => setAmount((prev) => (Number(prev) || 0) + v)}
								className="flex-1 py-2 text-xs font-medium text-muted-foreground bg-muted rounded-md hover:bg-accent hover:text-foreground transition-colors whitespace-nowrap cursor-pointer"
							>
								+₹{v}
							</button>
						))}
					</div>
				</div>
			)}

			{/* Limit Order: Price + Shares */}
			{isLimit && (
				<div className="space-y-5 mb-5">
					<div className="flex items-center justify-between">
						<p className="text-[15px] font-medium text-foreground">Limit price</p>
						<div className="flex items-center gap-0 bg-muted rounded-md overflow-hidden">
							<button
								onClick={() => setPrice(Number(activePrice) - 0.5)}
								className="px-3 py-2 text-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors cursor-pointer"
							>
								−
							</button>
							<div className="px-3 py-2 text-sm font-medium text-foreground min-w-[60px] text-center">
								₹{Number(activePrice).toFixed(1)}
							</div>
							<button
								onClick={() => setPrice(Number(activePrice) + 0.5)}
								className="px-3 py-2 text-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors cursor-pointer"
							>
								+
							</button>
						</div>
					</div>

					<div className="flex items-center justify-between">
						<p className="text-[15px] font-medium text-foreground">Shares</p>
						<div className="bg-muted rounded-md overflow-hidden">
							<input
								type="number"
								value={shares}
								onChange={(e) => setShares(e.target.value)}
								placeholder="0"
								className="w-24 py-2 text-sm text-right font-medium bg-transparent border-none focus:outline-none focus:ring-0 pr-3 text-foreground placeholder:text-muted-foreground [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
								min="0"
							/>
						</div>
					</div>

					<div className="flex gap-2">
						{[-100, -10, 10, 100].map((v) => (
							<button
								key={v}
								onClick={() => setShares((prev) => Math.max(0, (Number(prev) || 0) + v))}
								className="flex-1 py-2 text-xs font-medium text-muted-foreground bg-muted rounded-md hover:bg-accent hover:text-foreground transition-colors whitespace-nowrap cursor-pointer"
							>
								{v > 0 ? '+' : ''}
								{v}
							</button>
						))}
					</div>
				</div>
			)}

			{/* Split/Merge: Shares input */}
			{isSplitMerge && (
				<div className="space-y-5 mb-5">
					<div className="flex items-center justify-between">
						<p className="text-[15px] font-medium text-foreground">Shares</p>
						<div className="bg-muted rounded-md overflow-hidden">
							<input
								type="number"
								value={shares}
								onChange={(e) => setShares(e.target.value)}
								placeholder="0"
								className="w-24 py-2 text-sm text-right font-medium bg-transparent border-none focus:outline-none focus:ring-0 pr-3 text-foreground placeholder:text-muted-foreground [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
								min="0"
							/>
						</div>
					</div>

					<div className="flex gap-2">
						{[10, 50, 100, 500].map((v) => (
							<button
								key={v}
								onClick={() => setShares(v)}
								className="flex-1 py-2 text-xs font-medium text-muted-foreground bg-muted rounded-md hover:bg-accent hover:text-foreground transition-colors whitespace-nowrap cursor-pointer"
							>
								{v}
							</button>
						))}
					</div>
				</div>
			)}

			{/* Summary */}
			<div className="border-t border-border pt-4 space-y-2 mb-5">
				<div className="flex justify-between items-center text-sm">
					<span className="text-muted-foreground">Total</span>
					<span className="text-foreground font-medium">₹{totalCost.toFixed(2)}</span>
				</div>
				{!isSplitMerge && (
					<div className="flex justify-between items-center text-sm">
						<span className="text-muted-foreground">Fee (0.25%)</span>
						<span className="text-foreground font-medium">₹{fee.toFixed(2)}</span>
					</div>
				)}
				{isMarket && displayShares > 0 && (
					<div className="flex justify-between items-center text-sm">
						<span className="text-muted-foreground">Est. shares</span>
						<span className="text-foreground font-medium">{displayShares}</span>
					</div>
				)}
			</div>

			{/* Action Button */}
			<button
				onClick={handleAction}
				disabled={
					isActionPending ||
					(isMarket ? numAmount <= 0 : isSplitMerge ? numShares <= 0 : numShares <= 0)
				}
				className={`w-full py-3.5 px-4 rounded-md font-medium text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
					isActionPending || (isMarket ? numAmount <= 0 : numShares <= 0)
						? 'bg-muted text-muted-foreground cursor-not-allowed'
						: isSplitMerge
							? 'bg-primary text-primary-foreground hover:brightness-110'
							: activeTab === 'YES'
								? 'bg-green-600 hover:bg-green-500 text-white'
								: 'bg-red-600 hover:bg-red-500 text-white'
				}`}
			>
				{isActionPending && <Loader2 size={16} className="animate-spin" />}
				{isSplitMerge
					? `${orderType} Shares`
					: `${action === 'BUY' ? 'Buy' : 'Sell'} ${activeTab === 'YES' ? 'Yes' : 'No'}`}
			</button>
		</div>
	);
}
