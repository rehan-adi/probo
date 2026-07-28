import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRightLeft, Settings, TrendingUp, Clock, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import {
	Tooltip,
	ResponsiveContainer,
	AreaChart,
	Area,
	XAxis,
	YAxis,
	CartesianGrid,
} from 'recharts';
import { format } from 'date-fns';

interface TimelineData {
	YesPrice: string;
	NoPrice: string;
	Timestamp: string;
}

interface TimelineChartProps {
	data: TimelineData[];
	volume?: number;
	EndDate?: string;
	traders?: number;
	overview?: { EndDate: string };
}

type Timeframe = '1H' | '6H' | '1D' | '1W' | '1M' | 'ALL';

export default function TimelineChart({ data, volume = 0, traders = 0, overview }: TimelineChartProps) {
	const [view, setView] = useState<'yes' | 'no'>('yes');
	const [timeframe, setTimeframe] = useState<Timeframe>('ALL');
	
	// Settings State
	const [showSettings, setShowSettings] = useState(false);
	const [autoScale, setAutoScale] = useState(true);
	const [showXAxis, setShowXAxis] = useState(true);
	const [showYAxis, setShowYAxis] = useState(false);
	const [showGridHorizontal, setShowGridHorizontal] = useState(false);
	const [showGridVertical, setShowGridVertical] = useState(false);
	const [displayFormat, setDisplayFormat] = useState<'price' | 'probability' | 'both'>('probability');
	
	const settingsRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
				setShowSettings(false);
			}
		};
		if (showSettings) {
			document.addEventListener('mousedown', handleClickOutside);
		}
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [showSettings]);

	if (!data || data.length === 0) {
		return (
			<Card className="bg-background rounded-2xl border shadow-none p-8 text-center text-muted-foreground text-sm">
				No timeline data available yet.
			</Card>
		);
	}

	const allChartData = data.map((d) => ({
		yes: Number(d.YesPrice),
		no: Number(d.NoPrice),
		time: new Date(d.Timestamp).getTime(),
	}));

	// Client-side timeframe filtering
	const getTimeframeMs = (tf: Timeframe): number => {
		switch (tf) {
			case '1H': return 60 * 60 * 1000;
			case '6H': return 6 * 60 * 60 * 1000;
			case '1D': return 24 * 60 * 60 * 1000;
			case '1W': return 7 * 24 * 60 * 60 * 1000;
			case '1M': return 30 * 24 * 60 * 60 * 1000;
			case 'ALL': default: return Infinity;
		}
	};

	const chartData = timeframe === 'ALL'
		? allChartData
		: allChartData.filter(d => d.time >= Date.now() - getTimeframeMs(timeframe));

	const formatTime = (timestamp: number) => {
		if (timeframe === '1H') return format(timestamp, 'HH:mm');
		if (timeframe === '6H' || timeframe === '1D') return format(timestamp, 'ha');
		if (timeframe === '1W') return format(timestamp, 'MMM d');
		if (timeframe === '1M') return format(timestamp, 'MMM d');
		return format(timestamp, 'MMM yyyy'); // ALL
	};

	const last = data[data.length - 1];
	const yesProb = (Number(last.YesPrice) / (Number(last.YesPrice) + Number(last.NoPrice))) * 100;
	const noProb = (Number(last.NoPrice) / (Number(last.YesPrice) + Number(last.NoPrice))) * 100;

	const getRemainingTime = (endDateStr?: string) => {
		if (!endDateStr) return '--';
		const end = new Date(endDateStr).getTime();
		const now = Date.now();
		const diff = end - now;
		if (diff <= 0) return 'Ended';
		
		const hours = Math.floor(diff / (1000 * 60 * 60));
		if (hours > 0) return `${hours}h`;
		const minutes = Math.floor(diff / (1000 * 60));
		return `${minutes}m`;
	};

	// Calculate Y-domain for auto scaling
	const yDomain = autoScale ? ['dataMin - 1', 'dataMax + 1'] : [0, 10];

	return (
		<Card className="bg-background rounded-2xl border shadow-none">
			<div className="flex items-center justify-between p-4 pb-0">
				<div className="flex items-center gap-3">
					<button
						onClick={() => setView(view === 'yes' ? 'no' : 'yes')}
						className={`p-2.5 rounded-md transition ${view === 'yes' ? 'bg-blue-500/10' : 'bg-red-500/10'}`}
					>
						<ArrowRightLeft
							className={`h-4 w-4 ${view === 'yes' ? 'text-blue-500' : 'text-red-500'}`}
						/>
					</button>

					<div className="flex flex-col items-start font-semibold text-xs text-muted-foreground">
						{view.toUpperCase()} PROBABILITY
						<span className={`text-base font-bold ${view === 'yes' ? 'text-blue-500' : 'text-red-500'}`}>
							{view === 'yes' ? Math.round(yesProb) : Math.round(noProb)}%
						</span>
					</div>
				</div>
			</div>

			<CardContent className="grid gap-4 pt-4 relative">
				<div className="relative h-72 w-full flex">
					<div className="flex-1">
						<ResponsiveContainer width="100%" height="100%">
							<AreaChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
								<defs>
									<linearGradient id="colorYes" x1="0" y1="0" x2="0" y2="1">
										<stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
										<stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
									</linearGradient>
									<linearGradient id="colorNo" x1="0" y1="0" x2="0" y2="1">
										<stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
										<stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
									</linearGradient>
								</defs>
								{showGridHorizontal || showGridVertical ? (
									<CartesianGrid 
										strokeDasharray="3 3" 
										horizontal={showGridHorizontal} 
										vertical={showGridVertical} 
										stroke="currentColor" 
										className="opacity-10" 
									/>
								) : null}
								{showXAxis && (
									<XAxis 
										dataKey="time" 
										tickFormatter={formatTime} 
										tickLine={false} 
										axisLine={false} 
										minTickGap={30}
										className="text-[10px] fill-muted-foreground"
									/>
								)}
								{showYAxis && (
									<YAxis 
										domain={yDomain} 
										tickLine={false} 
										axisLine={false} 
										width={35}
										className="text-[10px] fill-muted-foreground"
										tickFormatter={(val) => displayFormat === 'probability' ? `${val}%` : `₹${Number(val).toFixed(1)}`}
									/>
								)}
								<Tooltip
									formatter={(value: any, name: any) => [
										displayFormat === 'probability' 
											? `${value}%` 
											: displayFormat === 'price' 
												? `₹${Number(value).toFixed(1)}` 
												: `₹${Number(value).toFixed(1)} (${value}%)`, 
										name.toUpperCase()
									]}
									labelFormatter={(label) => format(label, 'MMM d, yyyy HH:mm')}
									contentStyle={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)', borderRadius: '8px', color: 'var(--foreground)', fontSize: '12px' }}
									cursor={{ strokeDasharray: '4 4', stroke: '#9ca3af' }}
								/>
								<Area
									type="stepAfter"
									dataKey={view}
									stroke={view === 'yes' ? '#3b82f6' : '#ef4444'}
									fill={view === 'yes' ? 'url(#colorYes)' : 'url(#colorNo)'}
									strokeWidth={2}
									dot={false}
									isAnimationActive
									animationDuration={700}
								/>
							</AreaChart>
						</ResponsiveContainer>
					</div>
				</div>

				{/* Bottom Header: Stats & Timeframes */}
				<div className="flex flex-col md:flex-row items-center justify-between mt-2 pt-4 border-t border-border/50 gap-4">
					<div className="flex items-center gap-5 text-xs font-bold w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
						<div className="flex items-center gap-1.5 whitespace-nowrap px-1">
							<TrendingUp className="w-3.5 h-3.5 text-muted-foreground" /> 
							<span className="text-foreground">₹{(volume || 0).toLocaleString()}</span>
						</div>
						<div className="flex items-center gap-1.5 whitespace-nowrap px-1">
							<Clock className="w-3.5 h-3.5 text-muted-foreground" /> 
							<span className="text-muted-foreground">{getRemainingTime(overview?.EndDate)}</span>
						</div>
						<div className="flex items-center gap-1.5 whitespace-nowrap px-1">
							<Users className="w-3.5 h-3.5 text-muted-foreground" /> 
							<span className="text-muted-foreground">{traders || 0}</span>
						</div>
					</div>

					<div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
						<div className="flex items-center gap-1 p-1">
							{(['1H', '6H', '1D', '1W', '1M', 'ALL'] as Timeframe[]).map((tf) => (
								<button 
									key={tf} 
									onClick={() => setTimeframe(tf)}
									className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-colors ${timeframe === tf ? 'text-foreground bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
								>
									{tf}
								</button>
							))}
						</div>
						<div className="relative" ref={settingsRef}>
							<button 
								onClick={() => setShowSettings((prev) => !prev)}
								className={`p-1.5 rounded-lg transition-colors ${showSettings ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
							>
								<Settings className="w-4 h-4" />
							</button>

							<AnimatePresence>
								{showSettings && (
									<motion.div
										initial={{ opacity: 0, scale: 0.95, y: 5 }}
										animate={{ opacity: 1, scale: 1, y: 0 }}
										exit={{ opacity: 0, scale: 0.95, y: 5 }}
										transition={{ duration: 0.15 }}
										className="absolute right-0 bottom-full mb-2 z-50 w-56 bg-card border border-border rounded-xl shadow-xl p-4 space-y-4"
									>
										<div>
											<h4 className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground mb-3">Chart Settings</h4>
											<div className="space-y-3">
												<ToggleSwitch label="Auto Scale" checked={autoScale} onChange={setAutoScale} />
												<ToggleSwitch label="Show X-Axis" checked={showXAxis} onChange={setShowXAxis} />
												<ToggleSwitch label="Show Y-Axis" checked={showYAxis} onChange={setShowYAxis} />
												<ToggleSwitch label="Horizontal Grid" checked={showGridHorizontal} onChange={setShowGridHorizontal} />
												<ToggleSwitch label="Vertical Grid" checked={showGridVertical} onChange={setShowGridVertical} />
											</div>
										</div>
										<div className="pt-3 border-t border-border">
											<h4 className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground mb-3">Display Mode</h4>
											<div className="flex bg-muted/50 p-1 rounded-lg border border-border/50">
												{(['price', 'probability', 'both'] as const).map((mode) => (
													<button
														key={mode}
														onClick={() => setDisplayFormat(mode)}
														className={`flex-1 py-1.5 text-[10px] font-bold uppercase rounded-md transition-colors ${displayFormat === mode ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
													>
														{mode}
													</button>
												))}
											</div>
										</div>
									</motion.div>
								)}
							</AnimatePresence>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

function ToggleSwitch({ label, checked, onChange }: { label: string, checked: boolean, onChange: (v: boolean) => void }) {
	return (
		<label 
			className="flex items-center justify-between cursor-pointer group"
			onClick={(e) => {
				e.preventDefault();
				onChange(!checked);
			}}
		>
			<span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{label}</span>
			<div className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${checked ? 'bg-blue-500' : 'bg-muted-foreground/30'}`}>
				<span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-4.5' : 'translate-x-1'}`} style={{ transform: checked ? 'translateX(18px)' : 'translateX(2px)' }} />
			</div>
		</label>
	);
}
