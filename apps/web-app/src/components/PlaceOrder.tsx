import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { usePlaceOrderMutation } from '@/hooks/mutations/order';

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

	const [yesQty, setYesQty] = useState(1);
	const [noQty, setNoQty] = useState(1);
	const [yesOrderPrice, setYesOrderPrice] = useState(yOrderPrice);
	const [noOrderPrice, setNoOrderPrice] = useState(nOrderPrice);
	const [orderType, setOrderType] = useState<'LIMIT' | 'MARKET'>('LIMIT');

	const activePrice = activeTab === 'YES' ? yesOrderPrice : noOrderPrice;
	const activeQty = activeTab === 'YES' ? yesQty : noQty;
	const currentMarketPrice = activeTab === 'YES' ? yPrice : nPrice;

	const handlePriceChange = (delta: number) => {
		if (orderType === 'MARKET') return;
		const newPrice = Math.max(0, Math.round((activePrice + delta) * 10) / 10);
		if (activeTab === 'YES') {
			setYesOrderPrice(newPrice);
		} else {
			setNoOrderPrice(newPrice);
		}
	};

	const handleQtyChange = (delta: number) => {
		if (activeTab === 'YES') {
			setYesQty((prev) => Math.max(1, prev + delta));
		} else {
			setNoQty((prev) => Math.max(1, prev + delta));
		}
	};

	const { mutate, isPending } = usePlaceOrderMutation();

	const handlePlaceOrder = () => {
		const orderData = {
			side: activeTab,
			symbol,
			action: 'BUY',
			price: orderType === 'LIMIT' ? activePrice : currentMarketPrice,
			orderType,
			quantity: activeQty,
			marketId,
		};

		mutate(orderData, {
			onSuccess: () => onOrderPlaced?.(),
			onError: (err) => console.error('Order failed', err),
		});
	};

	return (
		<div className="bg-white rounded-xl shadow p-4 space-y-4">
			<div className="flex rounded-full overflow-hidden border mb-5">
				{['YES', 'NO'].map((tab) => {
					const isActive = activeTab === tab;
					const tabPrice = tab === 'YES' ? yPrice : nPrice;
					return (
						<button
							key={tab}
							onClick={() => setActiveTab(tab as 'YES' | 'NO')}
							className={`flex-1 py-2 text-sm cursor-pointer font-semibold transition-colors ${
								isActive
									? tab === 'YES'
										? 'bg-[#197BFF] text-white'
										: 'bg-[#E7685A] text-white'
									: 'bg-white text-gray-700'
							}`}
						>
							<div className="flex justify-center gap-1 items-center">
								<span>{tab}</span>
								<span>₹{tabPrice.toFixed(1)}</span>
							</div>
						</button>
					);
				})}
			</div>

			<div className="flex gap-4 mb-4 text-sm px-3 font-semibold rounded-full">
				{['LIMIT', 'MARKET'].map((type) => (
					<button
						key={type}
						onClick={() => setOrderType(type as 'LIMIT' | 'MARKET')}
						className={`pb-1 cursor-pointer transition-all duration-200 ${
							orderType === type
								? 'border-b-2 border-black text-black'
								: 'border-b border-transparent text-gray-500'
						}`}
					>
						{type}
					</button>
				))}
			</div>

			<div className="flex flex-col border rounded-md gap-3 p-2">
				<div className="flex-1 p-2 flex items-center justify-between">
					<h1 className="text-base font-semibold">Price</h1>
					{orderType === 'MARKET' ? (
						<span className="text-sm font-medium text-gray-700">
							Market Price: ₹{currentMarketPrice.toFixed(1)}
						</span>
					) : (
						<div className="flex border px-1 rounded-md min-w-[133px] items-center gap-2">
							<button
								type="button"
								onClick={(e) => {
									e.preventDefault();
									e.stopPropagation();
									handlePriceChange(-0.5);
								}}
								className="h-6 w-6 bg-gray-100 rounded flex items-center justify-center text-sm font-bold cursor-pointer transition-colors select-none"
							>
								−
							</button>
							<span className="text-base font-semibold min-w-[60px] text-center px-2 py-1 rounded">
								₹{activePrice.toFixed(1)}
							</span>
							<button
								type="button"
								onClick={(e) => {
									e.preventDefault();
									e.stopPropagation();
									handlePriceChange(0.5);
								}}
								className="h-6 w-6 bg-gray-100 rounded flex items-center justify-center text-sm font-bold cursor-pointer transition-colors select-none"
							>
								+
							</button>
						</div>
					)}
				</div>

				<div className="flex-1 p-2 flex items-center justify-between">
					<h1 className="text-base font-semibold">Quantity</h1>
					<div className="flex items-center px-1 rounded-md justify-between gap-2 border min-w-[133px]">
						<button
							type="button"
							onClick={(e) => {
								e.preventDefault();
								e.stopPropagation();
								handleQtyChange(-1);
							}}
							className="h-6 w-6 bg-gray-100 rounded flex items-center justify-center text-sm font-bold cursor-pointer transition-colors select-none"
						>
							−
						</button>
						<span className="text-base font-semibold min-w-[40px] text-center px-2 py-1 rounded">
							{activeQty}
						</span>
						<button
							type="button"
							onClick={(e) => {
								e.preventDefault();
								e.stopPropagation();
								handleQtyChange(1);
							}}
							className="h-6 w-6 bg-gray-100 rounded flex items-center justify-center text-sm font-bold cursor-pointer transition-colors select-none"
						>
							+
						</button>
					</div>
				</div>
			</div>

			<button
				onClick={handlePlaceOrder}
				className={`w-full py-3 rounded-md cursor-pointer text-sm font-semibold text-white transition-colors ${
					activeTab === 'YES'
						? 'bg-[#197BFF] hover:bg-[#1563D9]'
						: 'bg-[#E7685A] hover:bg-[#D55A4C]'
				}`}
				disabled={isPending}
			>
				{isPending ? (
					<div className="flex justify-center items-center">
						<Loader2 className="animate-spin w-4" />
					</div>
				) : (
					<>Place Order</>
				)}
			</button>
		</div>
	);
}
