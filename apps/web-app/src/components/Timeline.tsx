import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ChartConfig } from "@/components/ui/chart";
import settingIcon from '@/assets/images/settings_gray.svg';
import { ArrowRightLeft, BarChart as BarIcon } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, } from '@/components/ui/chart';
import { Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';


interface TimelineData {
	YesPrice: string;
	NoPrice: string;
	Timestamp: string;
}

interface TimelineChartProps {
	data: TimelineData[];
}

const chartConfig = {
	desktop: {
		label: "Desktop",
	},
	mobile: {
		label: "Mobile",
	},
} satisfies ChartConfig

export default function TimelineChart({ data }: TimelineChartProps) {
	const [view, setView] = useState<'yes' | 'no'>('yes');
	const [showSettings, setShowSettings] = useState(false);
	const [showBar, setShowBar] = useState(false);

	const chartData = data.map((d) => ({
		yes: Number(d.YesPrice),
		no: Number(d.NoPrice),
		time: d.Timestamp,
	}));

	const formatTime = (timestamp: string) => {
		const date = new Date(timestamp);
		return `${date.getHours().toString().padStart(2, '0')}.${date.getMinutes().toString().padStart(2, '0')}`;
	};

	const last = data[data.length - 1];
	const yesProb = (Number(last.YesPrice) / (Number(last.YesPrice) + Number(last.NoPrice))) * 100;
	const noProb = (Number(last.NoPrice) / (Number(last.YesPrice) + Number(last.NoPrice))) * 100;

	return (
		<Card className="bg-white rounded-2xl border shadow-none">
			<CardHeader className="flex items-center justify-between mb-3">
				<div className="flex items-center gap-3">
					<button
						onClick={() => setView(view === 'yes' ? 'no' : 'yes')}
						className={`p-2.5 rounded-md transition ${view === 'yes' ? 'bg-[#ECF4FF]' : 'bg-[#FDF3F2]'}`}
					>
						<ArrowRightLeft className={`h-4 w-4 ${view === 'yes' ? 'text-[#0063F5]' : 'text-[#D90429]'}`} />
					</button>

					<div className="flex flex-col items-start font-semibold text-xs">
						{view.toUpperCase()}
						<span className={`text-base ${view === 'yes' ? 'text-[#0063F5]' : 'text-[#D90429]'}`}>
							{view === 'yes' ? Math.round(yesProb) : Math.round(noProb)}% Probability
						</span>
					</div>
				</div>

				<div>
					<img
						src={settingIcon}
						alt="Setting Icon"
						className="cursor-pointer"
						onClick={() => setShowSettings((prev) => !prev)}
					/>
				</div>
			</CardHeader>

			<AnimatePresence>
				{showSettings && (
					<motion.div
						initial={{ opacity: 0, height: 0 }}
						animate={{ opacity: 1, height: 'auto' }}
						exit={{ opacity: 0, height: 0 }}
						className="mb-4 flex items-center gap-2 px-7 py-4 bg-white rounded-lg overflow-hidden"
					>
						<button
							onClick={() => setShowBar((prev) => !prev)}
							className={`flex items-center gap-2 px-5 py-2 text-sm cursor-pointer rounded-md transition border ${showBar ? 'bg-gray-50 text-black' : 'bg-white text-black'
								}`}
						>
							<BarIcon className="w-4 text-blue-600 h-4" />
							Bar View
						</button>
					</motion.div>
				)}
			</AnimatePresence>

			<CardContent className="grid gap-4">
				<div className="relative h-72 w-full flex">
					<div className="flex-1">
						<ResponsiveContainer width="100%" height="100%">
							<AreaChart data={chartData}>
								<Tooltip
									formatter={(value: any, name: any) => [`${value}%`, name.toUpperCase()]}
									contentStyle={{ border: 'none', borderRadius: '8px' }}
									cursor={{ strokeDasharray: '4 4', stroke: '#9ca3af' }}
								/>
								<Area
									type="bumpX"
									dataKey={view}
									stroke={view === 'yes' ? '#197BFF' : '#FF1D1D'}
									fill={view === 'yes' ? 'rgba(25,123,255,0.2)' : 'rgba(255,29,29,0.2)'}
									strokeWidth={2}
									dot={false}
									isAnimationActive
									animationDuration={700}
								/>
								<Area
									type="monotone"
									dataKey={view}
									stroke="transparent"
									fill="transparent"
									activeDot={{
										r: 5,
										stroke: view === 'yes' ? '#197BFF' : '#FF1D1D',
										fill: view === 'yes' ? '#197BFF' : '#FF1D1D',
									}}
								/>
							</AreaChart>
						</ResponsiveContainer>
					</div>

					<div className="flex flex-col text-gray-500 justify-between max-h-56 text-[10px] pl-2">
						<span>100%</span>
						<span>75%</span>
						<span>50%</span>
						<span>25%</span>
					</div>
				</div>

				<div className="flex justify-between text-[10px] max-w-2xl font-medium text-gray-500">
					{chartData.map((d: any) => (
						<span key={d.time}>{formatTime(d.time)}</span>
					))}
				</div>

				{showBar && (
					<motion.div
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: 10 }}
					>
						<Card className="border-none shadow-none">
							<CardHeader className='px-0'>
								<div className="flex items-center justify-between">
									<h3 className="font-semibold">Bar Chart - Timeline</h3>
								</div>
							</CardHeader>
							<CardContent>
								<ChartContainer config={chartConfig}>
									<BarChart
										accessibilityLayer
										data={chartData}
										barCategoryGap="20%"
										margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
									>
										  <CartesianGrid vertical={false} />
										<XAxis
											dataKey="time"
											tickLine={false}
											axisLine={false}
											tickFormatter={formatTime}
										/>
										<YAxis
											tickLine={false}
											axisLine={false}
											tickFormatter={() => ''}
										/>
										<ChartTooltip
											cursor={false}
											content={({ active, payload }) => {
												if (active && payload && payload.length) {
													const time = formatTime(payload[0].payload.time);
													return (
														<div className="bg-white p-2 rounded shadow border">
															<div className="text-xs text-gray-500">{time}</div>
															{payload.map((p: any) => (
																<div
																	key={p.dataKey}
																	className={`text-sm font-medium ${p.dataKey === 'yes' ? 'text-[#197BFF]' : 'text-[#FF1D1D]'}`}
																>
																	{p.dataKey.toUpperCase()}: {p.value}
																</div>
															))}
														</div>
													);
												}
												return null;
											}}
										/>
										<Bar dataKey="yes" fill="#197BFF" radius={[4, 4, 0, 0]} barSize={14} />
										<Bar dataKey="no" fill="#FF1D1D" radius={[4, 4, 0, 0]} barSize={14} />
									</BarChart>
								</ChartContainer>
							</CardContent>
						</Card>

					</motion.div>
				)}
			</CardContent>
		</Card>
	);
}
