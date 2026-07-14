

interface OrderbookLadderProps {
	orderbook: {
		yes: { price: number; quantity: number }[];
		no: { price: number; quantity: number }[];
	};
	onPriceSelect: (side: 'YES' | 'NO', price: number, qty: number) => void;
}

export default function OrderbookLadder({ orderbook, onPriceSelect }: OrderbookLadderProps) {
	// Filter out 0 prices and sort
	const yesOrders = (orderbook?.yes || [])
		.filter((o) => o.price > 0 && o.quantity > 0)
		.sort((a, b) => b.price - a.price)
		.slice(0, 7);

	const noOrders = (orderbook?.no || [])
		.filter((o) => o.price > 0 && o.quantity > 0)
		.sort((a, b) => a.price - b.price)
		.slice(0, 7);

	const maxYesQty = yesOrders.length > 0 ? Math.max(...yesOrders.map((o) => o.quantity)) : 0;
	const maxNoQty = noOrders.length > 0 ? Math.max(...noOrders.map((o) => o.quantity)) : 0;
	const maxTotalQty = Math.max(maxYesQty, maxNoQty);

	return (
		<div className="bg-white rounded-xl shadow p-4 space-y-2 mt-4 text-sm font-medium">
			<h3 className="font-semibold text-gray-800 mb-4 px-1 text-base">Orderbook Depth</h3>

			<div className="grid grid-cols-2 gap-4">
				{/* YES Orders (Bids) */}
				<div className="flex flex-col">
					<div className="grid grid-cols-2 text-xs text-gray-500 font-semibold mb-2 px-1">
						<span className="text-left text-[#197BFF]">YES QTY</span>
						<span className="text-right">PRICE</span>
					</div>
					{yesOrders.length === 0 && <div className="text-gray-400 text-xs px-1">No open bids</div>}
					{yesOrders.map((order, idx) => {
						const width = maxTotalQty > 0 ? (order.quantity / maxTotalQty) * 100 : 0;
						return (
							<div
								key={`yes-${idx}`}
								className="grid grid-cols-2 items-center cursor-pointer hover:bg-gray-50 transition-colors py-[6px] px-1 relative group"
								onClick={() => onPriceSelect('YES', order.price, order.quantity)}
							>
								{/* Background volume bar */}
								<div
									className="absolute right-0 top-0 bottom-0 bg-[#E8F2FF] -z-10 transition-all duration-300"
									style={{ width: `${width}%` }}
								/>
								<span className="text-left text-gray-700 font-medium">{order.quantity}</span>
								<span className="text-right text-[#197BFF] font-semibold">{order.price.toFixed(1)}</span>
							</div>
						);
					})}
				</div>

				{/* NO Orders (Asks) */}
				<div className="flex flex-col">
					<div className="grid grid-cols-2 text-xs text-gray-500 font-semibold mb-2 px-1">
						<span className="text-left">PRICE</span>
						<span className="text-right text-[#DC2804]">NO QTY</span>
					</div>
					{noOrders.length === 0 && <div className="text-gray-400 text-xs text-right px-1">No open asks</div>}
					{noOrders.map((order, idx) => {
						const width = maxTotalQty > 0 ? (order.quantity / maxTotalQty) * 100 : 0;
						return (
							<div
								key={`no-${idx}`}
								className="grid grid-cols-2 items-center cursor-pointer hover:bg-gray-50 transition-colors py-[6px] px-1 relative group"
								onClick={() => onPriceSelect('NO', order.price, order.quantity)}
							>
								{/* Background volume bar */}
								<div
									className="absolute left-0 top-0 bottom-0 bg-[#FDF3F2] -z-10 transition-all duration-300"
									style={{ width: `${width}%` }}
								/>
								<span className="text-left text-[#DC2804] font-semibold">{order.price.toFixed(1)}</span>
								<span className="text-right text-gray-700 font-medium">{order.quantity}</span>
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
}
