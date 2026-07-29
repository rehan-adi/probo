import { useEffect, useState } from 'react';
import { Loader2, TrendingUp, Clock, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { PROBO_API } from '@/constants/constants';
import { useAuthStore } from '@/store/auth';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { formatDistanceToNow } from 'date-fns';

interface PortfolioData {
	stockBalances: any[];
	activeOrders: any[];
	recentActivity: any[];
}

// Generate some mock chart data for a beautiful visual effect
const generateMockChartData = () => {
	const data = [];
	let base = 5000;
	for (let i = 0; i < 30; i++) {
		base = base + (Math.random() * 400 - 150);
		data.push({ name: `Day ${i + 1}`, value: Math.max(base, 0) });
	}
	return data;
};

export default function Portfolio() {
	const [data, setData] = useState<PortfolioData | null>(null);
	const [loading, setLoading] = useState(true);
	const [chartData] = useState(() => generateMockChartData());
	const token = useAuthStore((state) => state.token);

	// Pagination for Activity
	const [activityPage, setActivityPage] = useState(1);
	const activityPerPage = 5;

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
			<div className="flex justify-center items-center min-h-[60vh]">
				<Loader2 className="animate-spin w-8 h-8 text-primary" />
			</div>
		);
	}

	const totalActivityPages = data?.recentActivity ? Math.ceil(data.recentActivity.length / activityPerPage) : 0;
	const currentActivity = data?.recentActivity?.slice((activityPage - 1) * activityPerPage, activityPage * activityPerPage);

	return (
		<div className="max-w-5xl mx-auto p-4 md:p-8 space-y-8 font-sans">
			{/* Header & Chart Section */}
			<section className="bg-card border border-border shadow-sm rounded-2xl p-6 md:p-8 relative overflow-hidden">
				<div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 relative z-10">
					<div>
						<h1 className="text-3xl font-bold text-foreground">Portfolio Value</h1>
						<div className="flex items-center gap-2 mt-2">
							<span className="text-4xl font-extrabold tracking-tight">₹{chartData[chartData.length - 1]?.value.toFixed(2)}</span>
							<span className="text-sm font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-md flex items-center gap-1">
								<TrendingUp className="w-4 h-4" /> +12.4%
							</span>
						</div>
					</div>
					<div className="mt-4 md:mt-0 flex gap-2">
						<button className="px-3 py-1.5 text-xs font-semibold bg-muted text-foreground rounded-lg">1D</button>
						<button className="px-3 py-1.5 text-xs font-semibold bg-primary text-white shadow-md rounded-lg">1W</button>
						<button className="px-3 py-1.5 text-xs font-semibold bg-muted text-foreground rounded-lg">1M</button>
						<button className="px-3 py-1.5 text-xs font-semibold bg-muted text-foreground rounded-lg">ALL</button>
					</div>
				</div>

				<div className="h-[240px] w-full -mx-4 md:mx-0">
					<ResponsiveContainer width="100%" height="100%">
						<AreaChart data={chartData}>
							<defs>
								<linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
									<stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
									<stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
								</linearGradient>
							</defs>
							<Tooltip 
								contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
								labelStyle={{ display: 'none' }}
								itemStyle={{ color: 'hsl(var(--primary))', fontWeight: 'bold' }}
							/>
							<Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
						</AreaChart>
					</ResponsiveContainer>
				</div>
			</section>

			<div className="grid md:grid-cols-3 gap-8">
				{/* Left Column: Positions & Orders */}
				<div className="md:col-span-2 space-y-8">
					{/* Open Positions */}
					<section>
						<h2 className="text-xl font-bold text-foreground mb-4">Open Positions</h2>
						{data?.stockBalances?.length === 0 ? (
							<div className="bg-muted/30 border border-border/50 rounded-xl p-8 text-center flex flex-col items-center">
								<AlertCircle className="w-8 h-8 text-muted-foreground mb-2" />
								<p className="text-muted-foreground font-medium">No open positions right now.</p>
							</div>
						) : (
							<div className="grid gap-4">
								{data?.stockBalances?.map((pos) => (
									<div key={pos.id} className="bg-card p-5 rounded-xl border border-border shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all hover:border-border/80 hover:shadow-md">
										<div className="flex items-center gap-4 flex-1 w-full">
											{pos.market.thumbnail && (
												<img src={pos.market.thumbnail} alt="" className="w-14 h-14 rounded-lg object-cover border border-border/50 shrink-0" />
											)}
											<div className="flex-1 min-w-0">
												<h3 className="font-bold text-foreground text-sm line-clamp-2 leading-snug">{pos.market.title}</h3>
												<div className="flex items-center gap-2 mt-2">
													<span className="inline-block text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded uppercase tracking-wider border border-primary/20">
														{pos.market.status}
													</span>
												</div>
											</div>
										</div>
										<div className="flex gap-3 shrink-0 w-full sm:w-auto">
											<div className="flex flex-col items-center justify-center bg-blue-500/10 px-5 py-2.5 rounded-lg border border-blue-500/20 flex-1 sm:flex-none min-w-[90px]">
												<p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest mb-1">YES</p>
												<p className="font-extrabold text-blue-700 text-xl leading-none">{pos.yesQuantity}</p>
											</div>
											<div className="flex flex-col items-center justify-center bg-red-500/10 px-5 py-2.5 rounded-lg border border-red-500/20 flex-1 sm:flex-none min-w-[90px]">
												<p className="text-[10px] text-red-600 font-bold uppercase tracking-widest mb-1">NO</p>
												<p className="font-extrabold text-red-700 text-xl leading-none">{pos.noQuantity}</p>
											</div>
										</div>
									</div>
								))}
							</div>
						)}
					</section>

					{/* Active Orders */}
					<section>
						<h2 className="text-xl font-bold text-foreground mb-4">Active Orders</h2>
						{data?.activeOrders?.length === 0 ? (
							<div className="bg-muted/30 border border-border/50 rounded-xl p-8 text-center">
								<p className="text-muted-foreground font-medium">No active limit orders.</p>
							</div>
						) : (
							<div className="grid gap-4">
								{data?.activeOrders?.map((order) => (
									<div key={order.id} className="bg-card p-5 rounded-xl border border-border shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all hover:border-border/80">
										<div className="flex-1 min-w-0">
											<h3 className="font-bold text-foreground text-sm mb-2 line-clamp-1">{order.market.title}</h3>
											<div className="flex items-center gap-2">
												<span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider border ${
													order.orderType === 'BUY' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-rose-500/10 text-rose-600 border-rose-500/20'
												}`}>
													{order.orderType}
												</span>
												<span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider border ${
													order.stockType === 'YES' ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' : 'bg-red-500/10 text-red-600 border-red-500/20'
												}`}>
													{order.stockType}
												</span>
												<span className="text-sm font-bold text-foreground ml-1">
													₹{Number(order.price).toFixed(1)}
												</span>
											</div>
										</div>
										<div className="flex items-center gap-6 shrink-0 w-full md:w-auto mt-2 md:mt-0 pt-3 md:pt-0 border-t border-border/50 md:border-0">
											<div className="flex flex-col">
												<span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Filled</span>
												<span className="font-bold text-foreground text-sm">{order.tradedQuantity} <span className="text-muted-foreground text-xs font-medium">/ {order.quantity}</span></span>
											</div>
											<div className="flex flex-col items-end min-w-[80px]">
												<span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Status</span>
												<span className="inline-block px-2 py-0.5 bg-amber-500/10 text-amber-600 rounded text-[10px] font-bold uppercase tracking-wider border border-amber-500/20">
													{order.status}
												</span>
											</div>
										</div>
									</div>
								))}
							</div>
						)}
					</section>
				</div>

				{/* Right Column: Activity */}
				<div className="space-y-4">
					<h2 className="text-xl font-bold text-foreground mb-4">Recent Activity</h2>
					<div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
						{currentActivity?.length === 0 ? (
							<div className="p-8 text-center">
								<p className="text-muted-foreground text-sm font-medium">No recent activity.</p>
							</div>
						) : (
							<div className="divide-y divide-border/50">
								{currentActivity?.map((act) => (
									<div key={act.id} className="p-4 hover:bg-muted/30 transition-colors">
										<div className="flex justify-between items-start mb-2">
											<div className="flex items-center gap-2">
												<span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider border ${
													act.orderType === 'BUY' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-rose-500/10 text-rose-600 border-rose-500/20'
												}`}>
													{act.orderType}
												</span>
												<span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider border ${
													act.stockType === 'YES' ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' : 'bg-red-500/10 text-red-600 border-red-500/20'
												}`}>
													{act.stockType}
												</span>
												<span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider border ${
													act.status === 'COMPLETED' ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' : 'bg-muted text-muted-foreground border-border/50'
												}`}>
													{act.status}
												</span>
											</div>
											<div className="flex items-center gap-1 text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
												<Clock className="w-3 h-3" />
												{formatDistanceToNow(new Date(act.createdAt), { addSuffix: true })}
											</div>
										</div>
										<p className="text-sm font-semibold text-foreground line-clamp-1 mb-3">{act.market.title}</p>
										<div className="flex justify-between items-center text-xs">
											<div className="flex flex-col">
												<span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Quantity</span>
												<span className="font-bold text-foreground text-sm">{act.quantity}</span>
											</div>
											<div className="flex flex-col items-end">
												<span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Price</span>
												<span className="font-bold text-foreground text-sm">₹{Number(act.price).toFixed(1)}</span>
											</div>
										</div>
									</div>
								))}
							</div>
						)}
						{/* Pagination Controls */}
						{totalActivityPages > 1 && (
							<div className="p-3 border-t border-border/50 flex justify-between items-center bg-muted/20">
								<button 
									onClick={() => setActivityPage(p => Math.max(1, p - 1))}
									disabled={activityPage === 1}
									className="px-3 py-1 text-xs font-semibold text-foreground bg-background border border-border rounded-md disabled:opacity-50"
								>
									Prev
								</button>
								<span className="text-xs font-medium text-muted-foreground">Page {activityPage} of {totalActivityPages}</span>
								<button 
									onClick={() => setActivityPage(p => Math.min(totalActivityPages, p + 1))}
									disabled={activityPage === totalActivityPages}
									className="px-3 py-1 text-xs font-semibold text-foreground bg-background border border-border rounded-md disabled:opacity-50"
								>
									Next
								</button>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
