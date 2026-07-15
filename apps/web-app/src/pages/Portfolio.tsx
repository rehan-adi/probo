import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import axios from 'axios';
import { PROBO_API } from '@/utils/constants';
import { useAuthStore } from '@/store/auth';

interface PortfolioData {
	stockBalances: any[];
	activeOrders: any[];
}

export default function Portfolio() {
	const [data, setData] = useState<PortfolioData | null>(null);
	const [loading, setLoading] = useState(true);
	const token = useAuthStore((state) => state.token);

	useEffect(() => {
		const fetchPortfolio = async () => {
			try {
				const res = await axios.get(`${PROBO_API}/portfolio/get`, {
					headers: { Authorization: `Bearer ${token}` },
				});
				if (res.data.success) {
					setData(res.data.data);
				}
			} catch (err) {
				console.error('Failed to fetch portfolio', err);
			} finally {
				setLoading(false);
			}
		};

		if (token) fetchPortfolio();
	}, [token]);

	if (loading) {
		return (
			<div className="flex justify-center items-center h-64">
				<Loader2 className="animate-spin w-8 h-8 text-gray-500" />
			</div>
		);
	}

	return (
		<div className="max-w-4xl mx-auto p-4 md:p-8">
			<h1 className="text-2xl font-bold text-gray-900 mb-8">My Portfolio</h1>

			<div className="space-y-8">
				{/* Positions Section */}
				<section>
					<h2 className="text-lg font-semibold text-gray-800 mb-4">Open Positions</h2>
					{data?.stockBalances?.length === 0 ? (
						<p className="text-gray-500 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">No open positions.</p>
					) : (
						<div className="grid gap-4">
							{data?.stockBalances.map((pos) => (
								<div key={pos.id} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
									<div className="flex items-center gap-4">
										{pos.market.thumbnail && (
											<img src={pos.market.thumbnail} alt="Market" className="w-12 h-12 rounded-lg object-cover" />
										)}
										<div>
											<h3 className="font-semibold text-gray-900">{pos.market.title}</h3>
											<p className="text-sm text-gray-500">Status: {pos.market.status}</p>
										</div>
									</div>
									<div className="flex gap-6 text-sm">
										<div className="text-center">
											<p className="text-gray-500 font-medium">YES</p>
											<p className="font-bold text-[#00c853]">{pos.yesQuantity} shares</p>
										</div>
										<div className="text-center">
											<p className="text-gray-500 font-medium">NO</p>
											<p className="font-bold text-[#ff3d00]">{pos.noQuantity} shares</p>
										</div>
									</div>
								</div>
							))}
						</div>
					)}
				</section>

				{/* Active Orders Section */}
				<section>
					<h2 className="text-lg font-semibold text-gray-800 mb-4">Active Orders</h2>
					{data?.activeOrders?.length === 0 ? (
						<p className="text-gray-500 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">No active orders.</p>
					) : (
						<div className="grid gap-4">
							{data?.activeOrders.map((order) => (
								<div key={order.id} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
									<div>
										<h3 className="font-semibold text-gray-900">{order.market.title}</h3>
										<p className="text-sm text-gray-500">
											{order.orderType} {order.stockType} @ ₹{Number(order.price).toFixed(1)}
										</p>
									</div>
									<div className="text-right text-sm">
										<p className="text-gray-500">Quantity: {order.quantity}</p>
										<p className="text-gray-500">Traded: {order.tradedQuantity}</p>
										<span className="inline-block mt-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold">
											{order.status}
										</span>
									</div>
								</div>
							))}
						</div>
					)}
				</section>
			</div>
		</div>
	);
}
