import { useState } from 'react';
import { Loader2 } from 'lucide-react';
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

export default function PlaceOrder({
	yPrice,
	nPrice,
	yOrderPrice,
	nOrderPrice,
	symbol,
	marketId,
	onOrderPlaced,
}: PlaceOrderProps) {
	const [activeTab, setActiveTab] = useState<'YES' | 'NO'>('YES');
	const [orderType, setOrderType] = useState<'LIMIT' | 'MARKET'>('LIMIT');

	const [yesQty, setYesQty] = useState<number | string>(1);
	const [noQty, setNoQty] = useState<number | string>(1);
	const [yesOrderPrice, setYesOrderPrice] = useState(yOrderPrice || 5.0);
	const [noOrderPrice, setNoOrderPrice] = useState(nOrderPrice || 5.0);

	const activePrice = activeTab === 'YES' ? yesOrderPrice : noOrderPrice;
	const activeQty = activeTab === 'YES' ? Number(yesQty) : Number(noQty);
	const currentMarketPrice = activeTab === 'YES' ? yPrice : nPrice;
	
	const executionPrice = orderType === 'LIMIT' ? activePrice : currentMarketPrice;
	const totalInvestment = executionPrice * activeQty;
	const estimatedReturn = 10 * activeQty; // Win yields ₹10 per share

	const { mutate, isPending } = usePlaceOrderMutation();

	const handleQtyChange = (val: string) => {
		// Allow empty string for backspacing
		if (val === '') {
			activeTab === 'YES' ? setYesQty('') : setNoQty('');
			return;
		}
		
		const num = parseInt(val);
		if (!isNaN(num) && num > 0 && num <= 1000) { // arbitrary max
			activeTab === 'YES' ? setYesQty(num) : setNoQty(num);
		}
	};

	const handlePlaceOrder = () => {
		if (activeQty <= 0) {
			toast.error('Quantity must be greater than 0');
			return;
		}

		const orderData = {
			side: activeTab,
			symbol,
			action: 'BUY',
			price: executionPrice,
			orderType,
			quantity: activeQty,
			marketId,
		};

		mutate(orderData, {
			onSuccess: (res) => {
				if (res.data.success) {
					toast.success(`Successfully placed ${activeTab} order`);
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

	const activeColor = activeTab === 'YES' ? '#00c853' : '#ff3d00'; // Polymarket-ish green/red
	const activeBg = activeTab === 'YES' ? 'rgba(0, 200, 83, 0.1)' : 'rgba(255, 61, 0, 0.1)';

	return (
		<div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-5 space-y-6">
			{/* Buy / Sell Toggle - keeping it simple with YES/NO for Probo logic */}
			<div className="flex bg-gray-100/80 p-1 rounded-xl relative overflow-hidden">
				{['YES', 'NO'].map((tab) => {
					const isActive = activeTab === tab;
					const tabPrice = tab === 'YES' ? yPrice : nPrice;
					return (
						<button
							key={tab}
							onClick={() => setActiveTab(tab as 'YES' | 'NO')}
							className={`flex-1 py-3 text-sm font-bold z-10 transition-colors ${
								isActive
									? tab === 'YES'
										? 'text-[#00c853]'
										: 'text-[#ff3d00]'
									: 'text-gray-500 hover:text-gray-700'
							}`}
						>
							<div className="flex justify-center gap-2 items-center">
								<span>Buy {tab}</span>
								<span className="opacity-70 font-medium">₹{tabPrice?.toFixed(1) || '0.0'}</span>
							</div>
						</button>
					);
				})}
				<motion.div
					className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-lg shadow-sm"
					animate={{
						left: activeTab === 'YES' ? '4px' : 'calc(50%)',
					}}
					transition={{ type: 'spring', stiffness: 400, damping: 30 }}
				/>
			</div>

			{/* Order Type Pill Tabs */}
			<div className="flex gap-2 text-xs font-semibold">
				{['LIMIT', 'MARKET'].map((type) => (
					<button
						key={type}
						onClick={() => setOrderType(type as 'LIMIT' | 'MARKET')}
						className={`px-4 py-1.5 rounded-full transition-all duration-200 ${
							orderType === type
								? 'bg-gray-800 text-white shadow-sm'
								: 'bg-gray-100 text-gray-500 hover:bg-gray-200'
						}`}
					>
						{type}
					</button>
				))}
			</div>

			<div className="space-y-4">
				{/* Price Input */}
				<div className="flex flex-col gap-2">
					<div className="flex justify-between items-center text-sm font-medium text-gray-600">
						<span>Price</span>
					</div>
					
					{orderType === 'MARKET' ? (
						<div className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 flex justify-between items-center text-gray-400 cursor-not-allowed">
							<span className="font-semibold text-lg">Market Price</span>
							<span className="font-bold text-gray-800">₹{currentMarketPrice?.toFixed(1) || '0.0'}</span>
						</div>
					) : (
						<div className="w-full relative group">
							<div className="w-full bg-white border-2 border-gray-200 focus-within:border-gray-800 rounded-xl flex items-center transition-colors overflow-hidden">
								<span className="pl-4 text-gray-500 font-medium">₹</span>
								<input
									type="number"
									value={activePrice}
									onChange={(e) => {
										const val = parseFloat(e.target.value);
										if (!isNaN(val) && val >= 0.5 && val <= 9.5) {
											activeTab === 'YES' ? setYesOrderPrice(val) : setNoOrderPrice(val);
										}
									}}
									className="w-full bg-transparent p-4 text-lg font-bold text-gray-800 outline-none"
									step="0.5"
									min="0.5"
									max="9.5"
								/>
							</div>
							<div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
								<button 
									onClick={() => {
										const newPrice = Math.max(0.5, activePrice - 0.5);
										activeTab === 'YES' ? setYesOrderPrice(newPrice) : setNoOrderPrice(newPrice);
									}}
									className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-600 font-bold transition-colors"
								>
									-
								</button>
								<button 
									onClick={() => {
										const newPrice = Math.min(9.5, activePrice + 0.5);
										activeTab === 'YES' ? setYesOrderPrice(newPrice) : setNoOrderPrice(newPrice);
									}}
									className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-600 font-bold transition-colors"
								>
									+
								</button>
							</div>
						</div>
					)}
				</div>

				{/* Quantity Input */}
				<div className="flex flex-col gap-2">
					<div className="flex justify-between items-center text-sm font-medium text-gray-600">
						<span>Shares</span>
					</div>
					
					<div className="w-full relative group">
						<div className="w-full bg-white border-2 border-gray-200 focus-within:border-gray-800 rounded-xl flex items-center transition-colors overflow-hidden">
							<input
								type="number"
								value={activeTab === 'YES' ? yesQty : noQty}
								onChange={(e) => handleQtyChange(e.target.value)}
								className="w-full bg-transparent p-4 text-lg font-bold text-gray-800 outline-none"
								min="1"
							/>
						</div>
						<div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
							<button 
								onClick={() => handleQtyChange(String(Math.max(1, activeQty - 1)))}
								className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-600 font-bold transition-colors"
							>
								-
							</button>
							<button 
								onClick={() => handleQtyChange(String(activeQty + 1))}
								className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-600 font-bold transition-colors"
							>
								+
							</button>
						</div>
					</div>
				</div>
			</div>

			{/* Returns Summary */}
			<div className="bg-gray-50 p-4 rounded-xl space-y-3 text-sm">
				<div className="flex justify-between items-center">
					<span className="text-gray-500 font-medium">Avg price</span>
					<span className="font-semibold">₹{executionPrice?.toFixed(1)}</span>
				</div>
				<div className="flex justify-between items-center">
					<span className="text-gray-500 font-medium">Estimated cost</span>
					<span className="font-semibold text-gray-900">₹{totalInvestment?.toFixed(1)}</span>
				</div>
				<div className="h-px w-full bg-gray-200"></div>
				<div className="flex justify-between items-center">
					<span className="text-gray-500 font-medium">Potential payout</span>
					<span className="font-bold text-[#00c853]">₹{estimatedReturn?.toFixed(1)}</span>
				</div>
			</div>

			<motion.button
				whileHover={{ scale: 1.01 }}
				whileTap={{ scale: 0.98 }}
				onClick={handlePlaceOrder}
				disabled={isPending}
				style={{ backgroundColor: activeColor }}
				className="w-full py-4 rounded-xl cursor-pointer text-base font-bold text-white shadow-lg transition-colors flex justify-center items-center gap-2"
			>
				{isPending ? (
					<Loader2 className="animate-spin w-5 h-5" />
				) : (
					`Place Order`
				)}
			</motion.button>
		</div>
	);
}
