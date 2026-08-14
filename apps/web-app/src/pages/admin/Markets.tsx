import { toast } from 'sonner';
import { adminApi } from '@/config/axios';
import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import AdminLayout from '@/components/admin/AdminLayout';
import {
	Loader2,
	CheckCircle,
	XCircle,
	Ban,
	Search,
	Activity,
	CalendarDays,
	Users,
	AlertTriangle,
	X,
} from 'lucide-react';
import { formatINR, formatDate } from '@/lib/format';

// ─── Resolve Modal ────────────────────────────────────────────────────────────
function ResolveModal({
	market,
	resolvingId,
	onResolve,
	onClose,
}: {
	market: any;
	resolvingId: string | null;
	onResolve: (id: string, result: 'YES' | 'NO' | 'CANCEL') => void;
	onClose: () => void;
}) {
	const busy = resolvingId === market.id;

	const modal = (
		<div
			onClick={(e) => {
				if (e.target === e.currentTarget && !busy) onClose();
			}}
			style={{
				position: 'fixed',
				inset: 0,
				zIndex: 99999,
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				padding: '16px',
				backgroundColor: 'rgba(0,0,0,0.55)',
			}}
		>
			<div
				style={{
					background: 'var(--modal-bg, #fff)',
					borderRadius: '12px',
					width: '100%',
					maxWidth: '360px',
					boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
					overflow: 'hidden',
				}}
				className="bg-white dark:bg-[#1C1C1E]"
			>
				{/* Header */}
				<div className="flex items-start justify-between p-5 border-b border-gray-200 dark:border-white/10">
					<div className="flex-1 min-w-0 pr-3">
						<p className="font-semibold text-gray-900 dark:text-white text-base">Resolve Market</p>
						<p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
							{market.title}
						</p>
					</div>
					<button
						type="button"
						disabled={busy}
						onClick={onClose}
						style={{ flexShrink: 0, cursor: busy ? 'not-allowed' : 'pointer' }}
						className="p-1 rounded text-gray-400 hover:text-gray-700 dark:hover:text-white disabled:opacity-40"
					>
						<X style={{ width: 16, height: 16 }} />
					</button>
				</div>

				{/* Warning */}
				<div className="mx-5 mt-4 p-3 rounded-lg flex gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-500/30">
					<AlertTriangle
						style={{ width: 14, height: 14, flexShrink: 0, marginTop: 2, color: '#d97706' }}
					/>
					<p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
						Irreversible — funds are distributed immediately after resolution.
					</p>
				</div>

				{/* Buttons */}
				<div className="p-5 flex flex-col gap-2">
					<button
						type="button"
						disabled={busy}
						onClick={() => onResolve(market.id, 'YES')}
						style={{ cursor: busy ? 'not-allowed' : 'pointer' }}
						className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium border transition-colors disabled:opacity-50 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/20"
					>
						{busy ? (
							<Loader2 style={{ width: 16, height: 16 }} className="animate-spin shrink-0" />
						) : (
							<CheckCircle style={{ width: 16, height: 16, flexShrink: 0 }} />
						)}
						Resolve as YES
					</button>

					<button
						type="button"
						disabled={busy}
						onClick={() => onResolve(market.id, 'NO')}
						style={{ cursor: busy ? 'not-allowed' : 'pointer' }}
						className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium border transition-colors disabled:opacity-50 bg-red-50 hover:bg-red-100 text-red-700 border-red-200 dark:bg-red-500/10 dark:hover:bg-red-500/20 dark:text-red-400 dark:border-red-500/20"
					>
						{busy ? (
							<Loader2 style={{ width: 16, height: 16 }} className="animate-spin shrink-0" />
						) : (
							<XCircle style={{ width: 16, height: 16, flexShrink: 0 }} />
						)}
						Resolve as NO
					</button>

					<button
						type="button"
						disabled={busy}
						onClick={() => onResolve(market.id, 'CANCEL')}
						style={{ cursor: busy ? 'not-allowed' : 'pointer' }}
						className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium border transition-colors disabled:opacity-50 bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200 dark:bg-white/5 dark:hover:bg-white/10 dark:text-gray-300 dark:border-white/10"
					>
						{busy ? (
							<Loader2 style={{ width: 16, height: 16 }} className="animate-spin shrink-0" />
						) : (
							<Ban style={{ width: 16, height: 16, flexShrink: 0 }} />
						)}
						Cancel Market (Refund All)
					</button>
				</div>
			</div>
		</div>
	);

	return createPortal(modal, document.body);
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
	if (status === 'OPEN') {
		return (
			<span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20">
				Open
			</span>
		);
	}
	if (status === 'CLOSED') {
		return (
			<span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200 dark:bg-white/5 dark:text-gray-400 dark:border-white/10">
				Closed
			</span>
		);
	}
	return (
		<span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200 dark:bg-white/5 dark:text-gray-400 dark:border-white/10">
			{status}
		</span>
	);
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminMarkets() {
	const [markets, setMarkets] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [resolvingId, setResolvingId] = useState<string | null>(null);
	const [search, setSearch] = useState('');
	const [statusFilter, setStatusFilter] = useState('ALL');
	const [resolveTarget, setResolveTarget] = useState<any>(null);
	const [page, setPage] = useState(0);
	const PAGE_SIZE = 10;

	const fetchMarkets = useCallback(async () => {
		try {
			const res = await adminApi.get('/markets');
			if (res.data.success) setMarkets(res.data.data);
		} catch {
			toast.error('Failed to fetch markets');
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchMarkets();
	}, [fetchMarkets]);

	const handleResolve = useCallback(
		async (marketId: string, result: 'YES' | 'NO' | 'CANCEL') => {
			setResolvingId(marketId);
			try {
				const res = await adminApi.post('/markets/resolve', { marketId, resolution: result });
				if (res.data.success) {
					toast.success(`Market resolved as ${result}`);
					setResolveTarget(null);
					fetchMarkets();
				} else {
					toast.error(res.data.error || res.data.message || 'Failed to resolve market');
				}
			} catch (err: any) {
				toast.error(
					err.response?.data?.error ||
						err.response?.data?.message ||
						err.message ||
						'Error resolving market',
				);
			} finally {
				setResolvingId(null);
			}
		},
		[fetchMarkets],
	);

	const filtered = markets.filter((m) => {
		const matchStatus = statusFilter === 'ALL' || m.status === statusFilter;
		const matchSearch =
			!search ||
			m.title?.toLowerCase().includes(search.toLowerCase()) ||
			m.symbol?.toLowerCase().includes(search.toLowerCase());
		return matchStatus && matchSearch;
	});

	const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
	const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

	// Reset to page 0 when filter/search changes
	useEffect(() => {
		setPage(0);
	}, [search, statusFilter]);

	return (
		<AdminLayout>
			<div className="space-y-6">
				{/* Header */}
				<div>
					<h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
						Markets
					</h2>
					<p className="text-gray-500 dark:text-gray-400 mt-1">
						Manage and resolve markets across the platform.
					</p>
				</div>

				{/* Filters */}
				<div className="flex flex-col sm:flex-row items-center justify-between gap-4">
					{/* Status tabs */}
					<div className="flex items-center gap-1 p-1 rounded-lg bg-gray-100 dark:bg-[#1C1C1E]">
						{['ALL', 'OPEN', 'CLOSED'].map((s) => (
							<button
								key={s}
								type="button"
								onClick={() => setStatusFilter(s)}
								className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
									statusFilter === s
										? 'bg-white dark:bg-[#2C2C2E] text-gray-900 dark:text-white shadow-sm'
										: 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
								}`}
							>
								{s === 'ALL' ? 'All Markets' : s.charAt(0) + s.slice(1).toLowerCase()}
							</button>
						))}
					</div>

					{/* Search */}
					<div className="relative w-full sm:w-72">
						<Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
						<input
							type="text"
							placeholder="Search markets..."
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1C1C1E] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>
				</div>

				{/* Table */}
				<div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1C1C1E] shadow-sm overflow-hidden">
					{loading ? (
						<div className="flex justify-center items-center h-48">
							<Loader2 className="animate-spin w-8 h-8 text-blue-500" />
						</div>
					) : (
						<div className="overflow-x-auto">
							<table className="w-full text-sm">
								<thead className="bg-gray-50 dark:bg-[#2C2C2E]">
									<tr className="border-b border-gray-200 dark:border-white/10">
										<th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
											Market
										</th>
										<th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
											Status
										</th>
										<th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
											Volume
										</th>
										<th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
											Traders
										</th>
										<th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
											Ends At
										</th>
										<th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
											Actions
										</th>
									</tr>
								</thead>
								<tbody>
									{paged.length === 0 ? (
										<tr>
											<td
												colSpan={6}
												className="text-center py-16 text-gray-400 dark:text-gray-500"
											>
												<Activity className="w-8 h-8 mx-auto mb-2 opacity-20" />
												<p>No markets found</p>
											</td>
										</tr>
									) : (
										paged.map((market) => (
											<tr
												key={market.id}
												className="border-b border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors"
											>
												{/* Title */}
												<td className="px-4 py-3">
													<div className="flex items-center gap-3 max-w-[200px]">
														{market.thumbnail ? (
															<img
																src={market.thumbnail}
																alt=""
																className="w-9 h-9 rounded-md object-cover border border-gray-200 dark:border-white/10 shrink-0"
															/>
														) : (
															<div className="w-9 h-9 rounded-md bg-gray-100 dark:bg-[#2C2C2E] flex items-center justify-center shrink-0 border border-gray-200 dark:border-white/10">
																<Activity className="w-4 h-4 text-gray-400" />
															</div>
														)}
														<div className="min-w-0">
															<p
																className="font-medium text-gray-900 dark:text-white truncate"
																title={market.title}
															>
																{market.title}
															</p>
															<p className="text-xs text-gray-400 truncate">
																{market.symbol || market.id?.substring(0, 8)}
															</p>
														</div>
													</div>
												</td>

												{/* Status */}
												<td className="px-4 py-3">
													<StatusBadge status={market.status} />
												</td>

												{/* Volume */}
												<td className="px-4 py-3 font-semibold text-gray-900 dark:text-white whitespace-nowrap">
													{formatINR(Number(market.volume || 0))}
												</td>

												{/* Traders */}
												<td className="px-4 py-3">
													<span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
														<Users className="w-3.5 h-3.5" />
														{market.numberOfTraders || 0}
													</span>
												</td>

												{/* End time */}
												<td className="px-4 py-3 whitespace-nowrap">
													<span className="flex items-center gap-1 text-gray-500 dark:text-gray-400 text-xs">
														<CalendarDays className="w-3.5 h-3.5" />
														{formatDate(market.endTime)}
													</span>
												</td>

												{/* Actions */}
												<td className="px-4 py-3 text-right">
													<button
														type="button"
														disabled={market.status !== 'OPEN'}
														onClick={() => setResolveTarget(market)}
														className="px-3 py-1.5 text-xs font-medium rounded-md border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 bg-white dark:bg-transparent hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
													>
														Resolve
													</button>
												</td>
											</tr>
										))
									)}
								</tbody>
							</table>
						</div>
					)}
				</div>

				{/* Pagination */}
				{!loading && totalPages > 1 && (
					<div className="flex items-center justify-between">
						<span className="text-sm text-gray-500 dark:text-gray-400">
							Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of{' '}
							{filtered.length} markets
						</span>
						<div className="flex gap-2">
							<button
								type="button"
								disabled={page === 0}
								onClick={() => setPage((p) => p - 1)}
								className="px-3 py-1.5 text-sm rounded-md border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 bg-white dark:bg-transparent hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
							>
								Previous
							</button>
							<button
								type="button"
								disabled={page >= totalPages - 1}
								onClick={() => setPage((p) => p + 1)}
								className="px-3 py-1.5 text-sm rounded-md border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 bg-white dark:bg-transparent hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
							>
								Next
							</button>
						</div>
					</div>
				)}
			</div>

			{/* Portal modal */}
			{resolveTarget && (
				<ResolveModal
					market={resolveTarget}
					resolvingId={resolvingId}
					onResolve={handleResolve}
					onClose={() => {
						if (!resolvingId) setResolveTarget(null);
					}}
				/>
			)}
		</AdminLayout>
	);
}
