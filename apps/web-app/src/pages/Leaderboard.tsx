import { useState } from 'react';
import { formatAmount } from '@/lib/format';
import { useAuthStore } from '@/store/auth';
import { useLeaderboardQuery } from '@/hooks/queries/leaderboard';
import { Loader2, Crown, Award, User as UserIcon, ChevronDown } from 'lucide-react';

export default function LeaderboardPage() {
	const [timeframe, setTimeframe] = useState<'all_time' | 'monthly' | 'weekly' | 'today'>('all_time');
	const [isMobileSelectOpen, setIsMobileSelectOpen] = useState(false);
	const { data, isLoading } = useLeaderboardQuery(timeframe);
	const currentUser = useAuthStore((state) => state.user);

	const rawLeaderboard = data?.data?.leaderboard || [];
	const leaderboard = rawLeaderboard.filter((item) => item.profit > 0);

	const timeframeLabels: Record<string, string> = {
		today: 'Today',
		weekly: 'Weekly',
		monthly: 'Monthly',
		all_time: 'All',
	};

	return (
		<div className="w-full min-h-screen bg-[#f4f4f5] dark:bg-[#090C1A] flex justify-center md:pt-10 pt-8 pb-6 md:pb-8 transition-colors">
			<div className="w-full md:max-w-5xl px-6 md:px-6 flex flex-col gap-4">

				<div className="flex items-start justify-between mb-1 md:mb-5">
					<h1 className="md:text-2xl text-xl font-medium text-gray-900 dark:text-white tracking-tight">
						Leaderboard
					</h1>

					<div className="relative md:hidden">
						<button
							onClick={() => setIsMobileSelectOpen(!isMobileSelectOpen)}
							className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-[#161B26] border border-gray-300 dark:border-white/10 text-gray-900 dark:text-white shadow-sm flex items-center gap-1.5 cursor-pointer"
						>
							<span>{timeframeLabels[timeframe]}</span>
							<ChevronDown size={14} className="text-gray-500 dark:text-gray-400" />
						</button>

						{isMobileSelectOpen && (
							<div
								onMouseLeave={() => setIsMobileSelectOpen(false)}
								className="absolute right-0 top-9 w-32 bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-white/10 rounded-xl shadow-xl py-1 z-50 overflow-hidden"
							>
								{(['today', 'weekly', 'monthly', 'all_time'] as const).map((tf) => (
									<button
										key={tf}
										onClick={() => {
											setTimeframe(tf);
											setIsMobileSelectOpen(false);
										}}
										className={`w-full text-left px-3 py-2 text-xs font-medium transition ${timeframe === tf
											? 'bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white font-semibold'
											: 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'
											}`}
									>
										{timeframeLabels[tf]}
									</button>
								))}
							</div>
						)}
					</div>

					<div className="hidden md:inline-flex bg-gray-200/80 dark:bg-[#161B26] p-0.5 rounded-md border border-gray-300/80 dark:border-white/10">
						<button
							onClick={() => setTimeframe('today')}
							className={`px-4 py-1.5 text-xs font-medium border-r border-gray-300/80 dark:border-white/10 transition-all cursor-pointer ${timeframe === 'today'
								? 'bg-white dark:bg-[#202738] text-gray-900 dark:text-white font-semibold shadow-sm rounded-sm'
								: 'text-gray-600 dark:text-gray-400 hover:bg-gray-300/40 dark:hover:bg-white/5'
								}`}
						>
							Today
						</button>
						<button
							onClick={() => setTimeframe('weekly')}
							className={`px-4 py-1.5 text-xs font-medium border-r border-gray-300/80 dark:border-white/10 transition-all cursor-pointer ${timeframe === 'weekly'
								? 'bg-white dark:bg-[#202738] text-gray-900 dark:text-white font-semibold shadow-sm rounded-sm'
								: 'text-gray-600 dark:text-gray-400 hover:bg-gray-300/40 dark:hover:bg-white/5'
								}`}
						>
							Weekly
						</button>
						<button
							onClick={() => setTimeframe('monthly')}
							className={`px-4 py-1.5 text-xs font-medium border-r border-gray-300/80 dark:border-white/10 transition-all cursor-pointer ${timeframe === 'monthly'
								? 'bg-white dark:bg-[#202738] text-gray-900 dark:text-white font-semibold shadow-sm rounded-sm'
								: 'text-gray-600 dark:text-gray-400 hover:bg-gray-300/40 dark:hover:bg-white/5'
								}`}
						>
							Monthly
						</button>
						<button
							onClick={() => setTimeframe('all_time')}
							className={`px-4 py-1.5 text-xs font-medium transition-all cursor-pointer ${timeframe === 'all_time'
								? 'bg-white dark:bg-[#202738] text-gray-900 dark:text-white font-semibold shadow-sm rounded-sm'
								: 'text-gray-600 dark:text-gray-400 hover:bg-gray-300/40 dark:hover:bg-white/5'
								}`}
						>
							All
						</button>
					</div>
				</div>

				{/* Table Header Row (Profit 2nd, Volume Last) */}
				<div className="w-full">
					<div className="px-2 md:px-3 py-2 grid grid-cols-12 text-xs font-semibold text-gray-500 dark:text-gray-400 border-b border-gray-300 dark:border-white/10 uppercase tracking-wider">
						<div className="col-span-6 md:col-span-6 flex items-center gap-3 md:gap-4">
							<span className="w-5 md:w-6 text-center">#</span>
							<span>Trader</span>
						</div>
						<div className="col-span-3 md:col-span-3 text-right">
							Profit
						</div>
						<div className="col-span-3 md:col-span-3 text-right">
							Volume
						</div>
					</div>

					{/* Table Rows */}
					{isLoading ? (
						<div className="w-full h-64 flex items-center justify-center">
							<Loader2 className="w-8 h-8 animate-spin text-gray-400 dark:text-gray-600" />
						</div>
					) : leaderboard.length === 0 ? (
						<div className="py-16 text-center text-sm text-gray-500 dark:text-gray-400">
							No profit-making leaderboard entries for this timeframe yet.
						</div>
					) : (
						<div className="divide-y divide-gray-200/80 dark:divide-white/5">
							{leaderboard.map((item, idx) => {
								const rankNum = idx + 1;
								const isMe = currentUser && currentUser.id === item.userId;
								const displayName = isMe ? 'You' : item.name;

								return (
									<div
										key={item.userId}
										className={`px-2 md:px-3 py-3 grid grid-cols-12 items-center transition-colors rounded-xl ${isMe
											? 'bg-blue-500/10 dark:bg-blue-500/15 border border-blue-500/20'
											: 'hover:bg-gray-200/60 dark:hover:bg-white/5'
											}`}
									>
										{/* Rank & User Details */}
										<div className="col-span-6 md:col-span-6 flex items-center gap-2.5 md:gap-4 overflow-hidden">
											<div className="w-5 md:w-6 flex items-center justify-center shrink-0">
												{rankNum === 1 ? (
													<div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center">
														<Crown size={13} className="fill-amber-500" />
													</div>
												) : rankNum === 2 ? (
													<div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-slate-300/30 text-slate-400 flex items-center justify-center">
														<Award size={13} className="fill-slate-400" />
													</div>
												) : rankNum === 3 ? (
													<div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-amber-700/20 text-amber-700 dark:text-amber-600 flex items-center justify-center">
														<Award size={13} className="fill-amber-700 dark:fill-amber-600" />
													</div>
												) : (
													<span className="text-xs font-medium text-gray-500 dark:text-gray-400">
														{rankNum}
													</span>
												)}
											</div>

											{/* Avatar (w-7 h-7 on mobile for large numbers fit) */}
											<div className="w-7 h-7 md:w-9 md:h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-xs md:text-sm shadow-sm overflow-hidden shrink-0">
												{item.avatar ? (
													<img src={item.avatar} alt={displayName} className="w-full h-full object-cover" />
												) : (
													displayName.charAt(0).toUpperCase() || <UserIcon size={14} />
												)}
											</div>

											{/* Name */}
											<div className="truncate">
												<span
													className={`text-xs md:text-sm font-semibold truncate block ${isMe
														? 'text-blue-600 dark:text-blue-400 font-bold'
														: 'text-gray-900 dark:text-white'
														}`}
												>
													{displayName}
												</span>
											</div>
										</div>

										{/* Profit Column (2nd position - Black/White Medium font) */}
										<div className="col-span-3 md:col-span-3 text-right">
											<span className="text-xs md:text-sm font-medium text-gray-900 dark:text-white">
												+₹{formatAmount(item.profit)}
											</span>
										</div>

										{/* Volume Column (Last position) */}
										<div className="col-span-3 md:col-span-3 text-right">
											<span className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400">
												₹{formatAmount(item.volume || 0)}
											</span>
										</div>
									</div>
								);
							})}
						</div>
					)}
				</div>

			</div>
		</div>
	);
}
