import { useState, useRef, useEffect } from 'react';
import { Loader2, ChevronDown } from 'lucide-react';
import { usePlaceOrderMutation } from '@/hooks/mutations/order';
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
}

function Dropdown({ value, options, onChange, colorMap }: {
	value: string;
	options: string[];
	onChange: (v: string) => void;
	colorMap?: Record<string, string>;
}) {
	const [open, setOpen] = useState(false);
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const handler = (e: MouseEvent) => {
			if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
		};
		if (open) document.addEventListener('mousedown', handler);
		return () => document.removeEventListener('mousedown', handler);
	}, [open]);

	const activeColor = colorMap?.[value] || 'text-foreground';

	return (
		<div className="relative" ref={ref}>
			<button
				onClick={() => setOpen(!open)}
				className={`flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-md transition-colors bg-muted/50 hover:bg-muted border border-border/50 ${activeColor}`}
			>
				{value}
				<ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
			</button>
			<AnimatePresence>
				{open && (
					<motion.div
						initial={{ opacity: 0, y: -4 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -4 }}
						transition={{ duration: 0.12 }}
						className="absolute top-full left-0 mt-1 z-50 bg-card border border-border rounded-lg shadow-xl overflow-hidden min-w-full"
					>
						{options.map((opt) => (
							<button
								key={opt}
								onClick={() => { onChange(opt); setOpen(false); }}
								className={`w-full px-4 py-2 text-xs font-bold text-left transition-colors hover:bg-muted ${value === opt ? (colorMap?.[opt] || 'text-foreground') + ' bg-muted/50' : 'text-muted-foreground'}`}
							>
								{opt}
							</button>
						))}
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}

export default function PlaceOrder({
	yPrice,
	nPrice,
	yOrderPrice,
	nOrderPrice,
	symbol,
	marketId,
	onOrderPlaced,
}: PlaceOrderProps) {
	const [action, setAction] = useState<'BUY' | 'SELL'>('BUY');
	const [activeTab, setActiveTab] = useState<'YES' | 'NO'>('YES');
	const [orderType, setOrderType] = useState<'LIMIT' | 'MARKET'>('LIMIT');

	const [yesOrderPrice, setYesOrderPrice] = useState<string | number>(yOrderPrice || 5.0);
	const [noOrderPrice, setNoOrderPrice] = useState<string | number>(nOrderPrice || 5.0);
	const [shares, setShares] = useState<number | string>(1);

	const activePrice = activeTab === 'YES' ? yesOrderPrice : noOrderPrice;
	const currentMarketPrice = activeTab === 'YES' ? yPrice : nPrice;
	const executionPrice = orderType === 'LIMIT' ? Number(activePrice) || 0 : currentMarketPrice;

	const numShares = Number(shares) || 0;
	const estimatedCost = numShares * executionPrice;

	const { mutate, isPending } = usePlaceOrderMutation();

	const handlePriceChange = (val: string) => {
		if (val === '') {
			activeTab === 'YES' ? setYesOrderPrice('') : setNoOrderPrice('');
			return;
		}
		activeTab === 'YES' ? setYesOrderPrice(val) : setNoOrderPrice(val);
	};

	const handlePlaceOrder = () => {
		if (numShares <= 0) {
			toast.error('Amount too low to trade 1 share');
			return;
		}
		if (executionPrice < 0.5 || executionPrice > 9.5) {
			toast.error('Price must be between 0.5 and 9.5');
			return;
		}

		const orderData = {
			side: activeTab,
			symbol,
			action,
			price: executionPrice,
			orderType,
			quantity: numShares,
			marketId,
		};

		mutate(orderData, {
			onSuccess: (res) => {
				if (res.data.success) {
					toast.success(`Successfully placed ${action} ${activeTab} order`);
					onOrderPlaced?.();
				} else {
					toast.error(res.data.message || 'Failed to place order');
				}
			},
			onError: (err: any) => {
				const message = err.response?.data?.message || err.message || 'Failed to place order';
				toast.error(message);
				console.error('Order failed', err);
			},
		});
	};

	const isYes = activeTab === 'YES';
	const bgAccent = isYes ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700';

	return (
		<div className="bg-card rounded-xl shadow-sm border border-border p-5 w-full flex flex-col font-sans">
			{/* Compact Trading Toolbar — Single Line */}
			<div className="flex items-center gap-2 mb-5">
				{/* BUY / SELL Toggle */}
				<div className="flex bg-muted/60 p-0.5 rounded-lg border border-border/50">
					<button
						onClick={() => setAction('BUY')}
						className={`px-3.5 py-1.5 text-xs font-bold rounded-md transition-all ${
							action === 'BUY'
								? 'bg-background text-foreground shadow-sm'
								: 'text-muted-foreground hover:text-foreground'
						}`}
					>
						Buy
					</button>
					<button
						onClick={() => setAction('SELL')}
						className={`px-3.5 py-1.5 text-xs font-bold rounded-md transition-all ${
							action === 'SELL'
								? 'bg-background text-foreground shadow-sm'
								: 'text-muted-foreground hover:text-foreground'
						}`}
					>
						Sell
					</button>
				</div>

				{/* YES / NO Dropdown */}
				<Dropdown
					value={activeTab}
					options={['YES', 'NO']}
					onChange={(v) => setActiveTab(v as 'YES' | 'NO')}
					colorMap={{ YES: 'text-green-500', NO: 'text-red-500' }}
				/>

				{/* LIMIT / MARKET Dropdown */}
				<Dropdown
					value={orderType === 'LIMIT' ? 'Limit' : 'Market'}
					options={['Limit', 'Market']}
					onChange={(v) => setOrderType(v.toUpperCase() as 'LIMIT' | 'MARKET')}
				/>
			</div>

			<div className="space-y-4 mb-6">
				{/* Price Input */}
				<div className="flex flex-col gap-1.5">
					<label className="text-xs font-bold text-muted-foreground tracking-wide ml-1">PRICE</label>
					<div className={`flex items-center justify-between bg-muted/20 border transition-colors rounded-xl p-3 focus-within:border-foreground/40 hover:border-border/80 ${orderType === 'MARKET' ? 'opacity-70 bg-muted/40 cursor-not-allowed' : 'border-border'}`}>
						{orderType === 'MARKET' ? (
							<>
								<span className="text-sm text-muted-foreground">Market Price</span>
								<span className="text-sm font-bold text-foreground">₹{Number(currentMarketPrice || 0).toFixed(1)}</span>
							</>
						) : (
							<>
								<input
									type="number"
									value={activePrice}
									onChange={(e) => handlePriceChange(e.target.value)}
									className="w-full bg-transparent text-lg font-bold text-foreground outline-none"
									step="0.5"
									min="0.5"
									max="9.5"
									placeholder="0.0"
								/>
								<span className="text-sm font-bold text-muted-foreground">₹</span>
							</>
						)}
					</div>
				</div>

				{/* Amount/Shares Input */}
				<div className="flex flex-col gap-1.5">
					<label className="text-xs font-bold text-muted-foreground tracking-wide ml-1">QUANTITY</label>
					<div className="flex items-center justify-between bg-muted/20 border border-border transition-colors rounded-xl p-3 focus-within:border-foreground/40 hover:border-border/80">
						<input
							type="number"
							value={shares}
							onChange={(e) => setShares(e.target.value)}
							className="w-full bg-transparent text-lg font-bold text-foreground outline-none"
							min="1"
							placeholder="0"
						/>
						<span className="text-sm font-bold text-muted-foreground">Shares</span>
					</div>
				</div>

				{/* Quick Quantity Buttons */}
				<div className="flex items-center gap-2">
					{[10, 25, 50, 100].map(qty => (
						<button 
							key={qty} 
							onClick={() => setShares((Number(shares) || 0) + qty)}
							className="flex-1 py-1.5 text-xs font-semibold bg-muted/50 hover:bg-muted text-foreground rounded-lg border border-border/50 transition-colors"
						>
							+{qty}
						</button>
					))}
					<button 
						onClick={() => setShares(1000)}
						className="flex-1 py-1.5 text-xs font-semibold bg-muted/50 hover:bg-muted text-foreground rounded-lg border border-border/50 transition-colors"
					>
						MAX
					</button>
				</div>
			</div>

			<div className="mt-auto">
				<div className="flex justify-between items-center text-xs text-muted-foreground mb-3 px-1">
					<span>Estimated {action === 'BUY' ? 'Cost' : 'Return'}</span>
					<span className="font-bold text-foreground">₹{estimatedCost?.toFixed(2)}</span>
				</div>

				{/* Submit Button */}
				<motion.button
					whileHover={{ scale: 1.01 }}
					whileTap={{ scale: 0.98 }}
					onClick={handlePlaceOrder}
					disabled={isPending}
					className="w-full py-2.5 rounded-md cursor-pointer text-base font-bold text-white dark:text-black bg-black dark:bg-white shadow-md transition-all flex justify-center items-center gap-2 hover:opacity-90 hover:shadow-lg"
				>
					{isPending ? (
						<Loader2 className="animate-spin w-5 h-5" />
					) : (
						'Trade'
					)}
				</motion.button>
			</div>
		</div>
	);
}
