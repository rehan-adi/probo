import { useState } from 'react';

interface OrderSide {
	price: number;
	maxQty: number;
	limitPrice: number;
}

interface PlaceOrderProps {
	yesSide: OrderSide;
	noSide: OrderSide;
	yPrice: number;
	nPrice: number;
	onOrderPlaced?: () => void;
}

export default function PlaceOrder({
	yesSide,
	noSide,
	yPrice,
	nPrice,
	onOrderPlaced,
}: PlaceOrderProps) {
	const [activeTab, setActiveTab] = useState<'Yes' | 'No'>('Yes');

	const [yesPrice, setYesPrice] = useState(yPrice);
	const [yesQty, setYesQty] = useState(1);

	const [noPrice, setNoPrice] = useState(nPrice);
	const [noQty, setNoQty] = useState(1);

	const activePrice = activeTab === 'Yes' ? yesPrice : noPrice;
	const activeQty = activeTab === 'Yes' ? yesQty : noQty;
	const activeMaxQty = activeTab === 'Yes' ? yesSide.maxQty : noSide.maxQty;
	const activeLimitPrice = activeTab === 'Yes' ? yesSide.limitPrice : noSide.limitPrice;

	const setActivePrice = (val: number) => {
		if (activeTab === 'Yes') setYesPrice(val);
		else setNoPrice(val);
	};

	const setActiveQty = (val: number) => {
		if (activeTab === 'Yes') setYesQty(val);
		else setNoQty(val);
	};

	const handlePriceChange = (delta: number) => {
		const newPrice = Math.max(0, Math.round((activePrice + delta) * 10) / 10);
		setActivePrice(newPrice);
	};

	const handleQtyChange = (delta: number) => {
		const newQty = Math.min(activeMaxQty, Math.max(1, activeQty + delta));
		setActiveQty(newQty);
	};

	const handlePlaceOrder = async () => {};

	return (
		<div className="bg-white rounded-xl shadow p-4">
			<div className="flex rounded-4xl border overflow-hidden mb-6">
				{['Yes', 'No'].map((tab) => {
					const isActive = activeTab === tab;
					const activeClasses =
						tab === 'Yes' ? 'bg-[#197BFF] text-white' : 'bg-[#E7685A] text-white';
					const inactiveClasses = 'bg-white text-gray-700';

					const tabPrice = tab === 'Yes' ? yesPrice : noPrice;

					return (
						<button
							key={tab}
							onClick={() => setActiveTab(tab as 'Yes' | 'No')}
							className={`flex-1 py-2 rounded-4xl transition-colors ${
								isActive ? activeClasses : inactiveClasses
							}`}
						>
							<div className="flex justify-center gap-1 text-sm font-semibold items-center">
								<span>{tab}</span>
								<span>₹{tabPrice.toFixed(1)}</span>
							</div>
						</button>
					);
				})}
			</div>

			<div className="border p-4 rounded-xl mb-5 space-y-5">
				<div className="flex justify-between items-center">
					<div>
						<h1 className="font-semibold text-base">Price</h1>
						<span className="text-xs text-gray-500">{activeMaxQty} qty available</span>
					</div>
					<div className="flex items-center border w-28 p-1 rounded-md gap-4">
						<button onClick={() => handlePriceChange(-0.5)} className="h-6 w-6 bg-gray-200 rounded">
							−
						</button>
						<span className="text-base font-semibold">₹{activePrice.toFixed(1)}</span>
						<button onClick={() => handlePriceChange(0.5)} className="h-6 w-6 bg-gray-200 rounded">
							+
						</button>
					</div>
				</div>

				<div className="flex justify-between items-center">
					<h1 className="font-semibold text-base">Quantity</h1>
					<div className="flex items-center justify-between border p-1 w-28 rounded-md gap-4">
						<button onClick={() => handleQtyChange(-1)} className="h-6 w-6 bg-gray-200 rounded">
							−
						</button>
						<span className="text-lg font-semibold">{activeQty}</span>
						<button onClick={() => handleQtyChange(1)} className="h-6 w-6 bg-gray-200 rounded">
							+
						</button>
					</div>
				</div>
			</div>

			<button
				onClick={handlePlaceOrder}
				className={`w-full py-3 rounded-md text-sm font-semibold text-white
		${activeTab === 'Yes' ? 'bg-[#197BFF]' : 'bg-[#E7685A]'}`}
			>
				Place Order
			</button>
		</div>
	);
}
