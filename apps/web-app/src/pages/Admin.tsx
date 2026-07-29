import { useEffect, useState } from 'react';
import axios from 'axios';
import { PROBO_API } from '@/constants/constants';
import { useAuthStore } from '@/store/auth';
import { toast } from 'sonner';
import { Loader2, ShieldCheck, CheckCircle, XCircle } from 'lucide-react';

export default function Admin() {
	const [markets, setMarkets] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [resolvingId, setResolvingId] = useState<string | null>(null);
	const token = useAuthStore((state) => state.token);

	const fetchMarkets = async () => {
		try {
			const res = await axios.get(`${PROBO_API}/market`);
			if (res.data.success) {
				const openMarkets = res.data.data.filter((m: any) => m.status === 'open' || m.status === 'OPEN');
				setMarkets(openMarkets);
			}
		} catch (err) {
			console.error('Failed to fetch markets', err);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchMarkets();
	}, []);

	const handleResolve = async (marketId: string, result: 'YES' | 'NO') => {
		if (!confirm(`Are you sure you want to resolve this market as ${result}? This action is irreversible and will distribute funds.`)) {
			return;
		}

		setResolvingId(marketId);
		try {
			const res = await axios.post(
				`${PROBO_API}/market/resolve`,
				{ marketId, result },
				{ headers: { Authorization: `Bearer ${token}` } }
			);

			if (res.data.success) {
				toast.success(`Market resolved successfully as ${result}`);
				fetchMarkets(); // Refresh list
			} else {
				toast.error(res.data.message || 'Failed to resolve market');
			}
		} catch (err: any) {
			const message = err.response?.data?.error || err.message || 'Error resolving market';
			toast.error(message);
		} finally {
			setResolvingId(null);
		}
	};

	if (loading) {
		return (
			<div className="flex justify-center items-center min-h-[60vh]">
				<Loader2 className="animate-spin w-8 h-8 text-primary" />
			</div>
		);
	}

	return (
		<div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8 font-sans">
			<div className="flex items-center gap-3 mb-8">
				<ShieldCheck className="w-8 h-8 text-primary" />
				<h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
			</div>

			<div className="bg-card border border-border shadow-sm rounded-2xl p-6 md:p-8">
				<h2 className="text-xl font-bold mb-6 flex items-center gap-2">
					Open Markets Awaiting Resolution
					<span className="bg-primary text-white text-xs px-2 py-0.5 rounded-full">{markets.length}</span>
				</h2>

				{markets.length === 0 ? (
					<div className="text-center py-12 border border-dashed border-border rounded-xl bg-muted/20">
						<CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3 opacity-50" />
						<p className="text-muted-foreground font-medium">All markets have been resolved!</p>
					</div>
				) : (
					<div className="space-y-4">
						{markets.map((market) => (
							<div key={market.id || market.marketId} className="flex flex-col md:flex-row items-center justify-between p-4 border border-border rounded-xl bg-muted/10 gap-4 hover:border-primary/50 transition-colors">
								<div className="flex-1">
									<h3 className="font-bold text-foreground line-clamp-2">{market.title}</h3>
									<div className="flex gap-4 mt-2 text-sm">
										<span className="text-muted-foreground">Vol: <span className="font-semibold text-foreground">₹{market.volume || 0}</span></span>
										<span className="text-muted-foreground">Category: <span className="font-semibold text-foreground uppercase">{market.category || 'EVENT'}</span></span>
									</div>
								</div>
								
								<div className="flex items-center gap-3 shrink-0 w-full md:w-auto">
									<button 
										disabled={resolvingId === (market.id || market.marketId)}
										onClick={() => handleResolve(market.id || market.marketId, 'YES')}
										className="flex-1 md:flex-none px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition shadow-sm flex justify-center items-center gap-2 disabled:opacity-50"
									>
										{resolvingId === (market.id || market.marketId) ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
										Resolve YES
									</button>
									<button 
										disabled={resolvingId === (market.id || market.marketId)}
										onClick={() => handleResolve(market.id || market.marketId, 'NO')}
										className="flex-1 md:flex-none px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition shadow-sm flex justify-center items-center gap-2 disabled:opacity-50"
									>
										{resolvingId === (market.id || market.marketId) ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
										Resolve NO
									</button>
								</div>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
