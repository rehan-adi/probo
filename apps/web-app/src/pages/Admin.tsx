import { useEffect, useState } from 'react';
import { adminApi } from '@/config/axios';
import { toast } from 'sonner';
import { Loader2, Users, Activity, DollarSign, TrendingUp, Calendar } from 'lucide-react';
import {
	AreaChart,
	Area,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
	PieChart,
	Pie,
	Cell,
	Legend,
} from 'recharts';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { formatINR, formatNumber, formatDate } from '@/lib/format';

export default function Admin() {
	const [metrics, setMetrics] = useState<any>(null);
	const [loading, setLoading] = useState(true);
	const [period, setPeriod] = useState('7d');

	const fetchData = async () => {
		try {
			setLoading(true);
			const metricsRes = await adminApi.get(`/analytics/dashboard`);
			if (metricsRes.data.success) {
				setMetrics(metricsRes.data.data);
			}
		} catch (err) {
			console.error('Failed to fetch admin data', err);
			toast.error('Failed to fetch dashboard data');
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchData();
	}, []);

	if (loading && !metrics) {
		return (
			<AdminLayout>
				<div className="flex justify-center items-center h-[calc(100vh-100px)]">
					<Loader2 className="animate-spin w-8 h-8 text-blue-600 dark:text-blue-500" />
				</div>
			</AdminLayout>
		);
	}

	const CustomTooltip = ({ active, payload, label }: any) => {
		if (active && payload && payload.length) {
			return (
				<div className="bg-white dark:bg-[#2C2C2E] border border-gray-200 dark:border-white/10 p-3 rounded-lg shadow-xl">
					<p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{formatDate(label)}</p>
					{payload.map((entry: any, index: number) => (
						<p
							key={index}
							className="text-sm font-bold text-gray-900 dark:text-white flex items-center"
						>
							<span className="mr-2" style={{ color: entry.color || entry.fill }}>
								●
							</span>
							{entry.name === 'volume' ? 'Volume: ' : ''}
							{formatINR(entry.value)}
						</p>
					))}
				</div>
			);
		}
		return null;
	};

	const COLORS = ['#10b981', '#6b7280', '#3b82f6'];

	return (
		<AdminLayout>
			<div className="space-y-6">
				<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
					<div>
						<h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
							Dashboard
						</h2>
						<p className="text-muted-foreground mt-1 text-sm text-gray-500 dark:text-gray-400">
							Overview of your platform's performance and activity.
						</p>
					</div>

					<div className="flex items-center gap-3">
						<Select value={period} onValueChange={setPeriod}>
							<SelectTrigger className="w-[180px] bg-white dark:bg-[#1C1C1E] border-gray-200 dark:border-white/10">
								<Calendar className="w-4 h-4 mr-2 text-gray-500" />
								<SelectValue placeholder="Select Period" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="7d">Last 7 Days</SelectItem>
								<SelectItem value="30d">Last 30 Days</SelectItem>
								<SelectItem value="90d">Last 90 Days</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>

				{/* Metrics Section */}
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
					<Card className="dark:bg-[#1C1C1E] dark:border-white/10 shadow-sm border-gray-200 overflow-hidden relative">
						<div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
								Total Revenue
							</CardTitle>
							<div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
								<DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
							</div>
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold text-gray-900 dark:text-white">
								{formatINR(metrics?.totalRevenue)}
							</div>
							<div className="flex items-center mt-1 space-x-2">
								<span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded">
									+12.5%
								</span>
								<p className="text-xs text-muted-foreground text-gray-500">from last month</p>
							</div>
						</CardContent>
					</Card>

					<Card className="dark:bg-[#1C1C1E] dark:border-white/10 shadow-sm border-gray-200 overflow-hidden relative">
						<div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
								Active Markets
							</CardTitle>
							<div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
								<Activity className="h-4 w-4 text-blue-600 dark:text-blue-400" />
							</div>
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold text-gray-900 dark:text-white">
								{formatNumber(metrics?.totalMarkets)}
							</div>
							<div className="flex items-center mt-1 space-x-2">
								<span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded">
									+4
								</span>
								<p className="text-xs text-muted-foreground text-gray-500">new this week</p>
							</div>
						</CardContent>
					</Card>

					<Card className="dark:bg-[#1C1C1E] dark:border-white/10 shadow-sm border-gray-200 overflow-hidden relative">
						<div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
								Trading Volume
							</CardTitle>
							<div className="w-8 h-8 rounded-full bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
								<TrendingUp className="h-4 w-4 text-amber-600 dark:text-amber-400" />
							</div>
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold text-gray-900 dark:text-white">
								{formatINR(metrics?.totalVolume)}
							</div>
							<div className="flex items-center mt-1 space-x-2">
								<span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded">
									+24.8%
								</span>
								<p className="text-xs text-muted-foreground text-gray-500">from last month</p>
							</div>
						</CardContent>
					</Card>

					<Card className="dark:bg-[#1C1C1E] dark:border-white/10 shadow-sm border-gray-200 overflow-hidden relative">
						<div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
								Total Users
							</CardTitle>
							<div className="w-8 h-8 rounded-full bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center">
								<Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
							</div>
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold text-gray-900 dark:text-white">
								{formatNumber(metrics?.totalUsers)}
							</div>
							<div className="flex items-center mt-1 space-x-2">
								<span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded">
									+182
								</span>
								<p className="text-xs text-muted-foreground text-gray-500">new this month</p>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Chart Section */}
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2 mt-6">
					<Card className="col-span-1 dark:bg-[#1C1C1E] dark:border-white/10 shadow-sm border-gray-200">
						<CardHeader className="pb-2">
							<CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
								Revenue Overview
							</CardTitle>
							<CardDescription className="text-gray-500 dark:text-gray-400">
								Daily revenue over the{' '}
								{period === '7d'
									? 'last 7 days'
									: period === '30d'
										? 'last 30 days'
										: 'last 90 days'}
								.
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="h-[300px] w-full mt-4">
								{metrics?.revenueChart && metrics.revenueChart.length > 0 ? (
									<ResponsiveContainer width="100%" height="100%">
										<AreaChart
											data={metrics.revenueChart}
											margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
										>
											<defs>
												<linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
													<stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
													<stop offset="95%" stopColor="#10b981" stopOpacity={0} />
												</linearGradient>
											</defs>
											<CartesianGrid
												strokeDasharray="3 3"
												vertical={false}
												stroke="#888"
												opacity={0.15}
											/>
											<XAxis
												dataKey="date"
												stroke="#888888"
												fontSize={12}
												tickLine={false}
												axisLine={false}
												tick={{ fill: '#888' }}
												dy={10}
												tickFormatter={(value) => {
													const date = new Date(value);
													return date.toLocaleDateString('en-US', {
														month: 'short',
														day: 'numeric',
													});
												}}
											/>
											<YAxis
												stroke="#888888"
												fontSize={12}
												tickLine={false}
												axisLine={false}
												tickFormatter={(value) => `₹${value}`}
												dx={-10}
											/>
											<Tooltip content={<CustomTooltip />} />
											<Area
												type="monotone"
												dataKey="amount"
												name="Revenue"
												stroke="#10b981"
												strokeWidth={3}
												fillOpacity={1}
												fill="url(#colorRevenue)"
												activeDot={{ r: 6, strokeWidth: 0, fill: '#10b981' }}
												animationDuration={1000}
											/>
										</AreaChart>
									</ResponsiveContainer>
								) : (
									<div className="flex h-full flex-col items-center justify-center text-gray-500">
										<Activity className="w-12 h-12 text-gray-300 dark:text-gray-700 mb-3" />
										<p>No revenue data available</p>
									</div>
								)}
							</div>
						</CardContent>
					</Card>

					<Card className="col-span-1 dark:bg-[#1C1C1E] dark:border-white/10 shadow-sm border-gray-200">
						<CardHeader className="pb-2">
							<CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
								Trading Volume Overview
							</CardTitle>
							<CardDescription className="text-gray-500 dark:text-gray-400">
								Daily trading volume over the{' '}
								{period === '7d'
									? 'last 7 days'
									: period === '30d'
										? 'last 30 days'
										: 'last 90 days'}
								.
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="h-[300px] w-full mt-4">
								{metrics?.revenueChart && metrics.revenueChart.length > 0 ? (
									<ResponsiveContainer width="100%" height="100%">
										<AreaChart
											data={metrics.revenueChart}
											margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
										>
											<defs>
												<linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
													<stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
													<stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
												</linearGradient>
											</defs>
											<CartesianGrid
												strokeDasharray="3 3"
												vertical={false}
												stroke="#888"
												opacity={0.15}
											/>
											<XAxis
												dataKey="date"
												stroke="#888888"
												fontSize={12}
												tickLine={false}
												axisLine={false}
												tick={{ fill: '#888' }}
												dy={10}
												tickFormatter={(value) => {
													const date = new Date(value);
													return date.toLocaleDateString('en-US', {
														month: 'short',
														day: 'numeric',
													});
												}}
											/>
											<YAxis
												stroke="#888888"
												fontSize={12}
												tickLine={false}
												axisLine={false}
												tickFormatter={(value) => `₹${value}`}
												dx={-10}
											/>
											<Tooltip content={<CustomTooltip />} />
											<Area
												type="monotone"
												dataKey="volume"
												name="Volume"
												stroke="#3b82f6"
												strokeWidth={3}
												fillOpacity={1}
												fill="url(#colorVolume)"
												activeDot={{ r: 6, strokeWidth: 0, fill: '#3b82f6' }}
												animationDuration={1000}
											/>
										</AreaChart>
									</ResponsiveContainer>
								) : (
									<div className="flex h-full flex-col items-center justify-center text-gray-500">
										<Activity className="w-12 h-12 text-gray-300 dark:text-gray-700 mb-3" />
										<p>No volume data available</p>
									</div>
								)}
							</div>
						</CardContent>
					</Card>
				</div>

				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mt-6">
					<Card className="col-span-4 lg:col-span-7 dark:bg-[#1C1C1E] dark:border-white/10 shadow-sm border-gray-200">
						<CardHeader className="pb-2">
							<CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
								Market Status
							</CardTitle>
							<CardDescription className="text-gray-500 dark:text-gray-400">
								Distribution of all markets.
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="h-[300px] w-full mt-8">
								{metrics?.marketDistribution &&
								metrics.marketDistribution.some((m: any) => m.value > 0) ? (
									<ResponsiveContainer width="100%" height="100%">
										<PieChart>
											<Pie
												data={metrics.marketDistribution}
												cx="50%"
												cy="50%"
												innerRadius={60}
												outerRadius={90}
												paddingAngle={5}
												dataKey="value"
												stroke="none"
											>
												{metrics.marketDistribution.map((_: any, index: number) => (
													<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
												))}
											</Pie>
											<Tooltip
												contentStyle={{
													borderRadius: '8px',
													border: '1px solid rgba(255,255,255,0.1)',
													backgroundColor: 'var(--tw-prose-body, #2C2C2E)',
												}}
												itemStyle={{ color: '#fff', fontWeight: 600 }}
											/>
											<Legend verticalAlign="bottom" height={36} />
										</PieChart>
									</ResponsiveContainer>
								) : (
									<div className="flex h-full flex-col items-center justify-center text-gray-500">
										<Activity className="w-12 h-12 text-gray-300 dark:text-gray-700 mb-3" />
										<p>No market data available</p>
									</div>
								)}
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</AdminLayout>
	);
}
