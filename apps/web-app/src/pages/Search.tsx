import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Search() {
	const [searchParams, setSearchParams] = useSearchParams();
	const navigate = useNavigate();
	const query = searchParams.get('q') || '';
	
	const [results, setResults] = useState<any[]>([]);
	const [total, setTotal] = useState(0);
	const [page, setPage] = useState(1);
	const [hasMore, setHasMore] = useState(true);
	const [isLoading, setIsLoading] = useState(false);

	const observer = useRef<IntersectionObserver | null>(null);

	const fetchResults = async (searchQuery: string, pageNum: number, append = false) => {
		if (!searchQuery.trim()) {
			setResults([]);
			setTotal(0);
			return;
		}

		setIsLoading(true);
		try {
			const res = await axios.get(`http://localhost:3000/api/v1/market/search?q=${searchQuery}&page=${pageNum}&limit=10`, {
				withCredentials: true,
			});
			if (res.data?.success) {
				setResults((prev) => (append ? [...prev, ...res.data.data] : res.data.data));
				setTotal(res.data.total);
				setHasMore(res.data.hasMore);
			}
		} catch (error) {
			console.error('Search failed', error);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		setPage(1);
		setResults([]);
		setHasMore(true);
		fetchResults(query, 1);
	}, [query]);

	const lastElementRef = useCallback((node: HTMLDivElement) => {
		if (isLoading) return;
		if (observer.current) observer.current.disconnect();
		observer.current = new IntersectionObserver((entries) => {
			if (entries[0].isIntersecting && hasMore) {
				const nextPage = page + 1;
				setPage(nextPage);
				fetchResults(query, nextPage, true);
			}
		});
		if (node) observer.current.observe(node);
	}, [isLoading, hasMore, query, page]);

	return (
		<div className="pt-24 pb-12 px-4 max-w-5xl mx-auto min-h-screen text-foreground">
			<div className="mb-8">
				<input
					type="text"
					value={query}
					onChange={(e) => setSearchParams({ q: e.target.value })}
					placeholder="Search markets..."
					className="w-full text-2xl md:text-4xl bg-transparent font-semibold border-none outline-none placeholder:text-gray-500"
				/>
			</div>

			{query.trim() && (
				<div className="mb-6 text-gray-500">
					Found {total} results
				</div>
			)}

			<div className="flex flex-col gap-4">
				{results.map((market, index) => {
					const isLast = index === results.length - 1;
					return (
						<div
							key={market.id}
							ref={isLast ? lastElementRef : null}
							onClick={() => navigate(`/events/${market.symbol}`)}
							className="flex flex-col md:flex-row md:items-center gap-4 p-4 bg-card border border-border rounded-xl cursor-pointer hover:bg-muted transition"
						>
							<img
								src={market.thumbnail || 'https://via.placeholder.com/60'}
								alt={market.title}
								className="w-16 h-16 rounded object-cover bg-background"
							/>
							<div className="flex-1">
								<h3 className="text-lg font-medium">{market.title}</h3>
								<div className="text-sm text-gray-500 mt-1">
									Volume: $10K • Ends: {new Date(market.endTime).toLocaleDateString()}
								</div>
							</div>
							<div className="flex gap-4 items-center mt-3 md:mt-0">
								<div className="text-right">
									<p className="text-sm text-gray-500">Yes</p>
									<p className="font-semibold text-green-500">{Math.round(market.yesPrice * 10)}%</p>
								</div>
								<div className="text-right">
									<p className="text-sm text-gray-500">No</p>
									<p className="font-semibold text-red-500">{Math.round(market.NoPrice * 10)}%</p>
								</div>
							</div>
						</div>
					);
				})}

				{isLoading && (
					<div className="flex flex-col gap-4">
						{[...Array(3)].map((_, i) => (
							<div key={i} className="flex gap-4 p-4 bg-card border border-border rounded-xl animate-pulse">
								<div className="w-16 h-16 bg-muted rounded"></div>
								<div className="flex-1 space-y-2">
									<div className="h-4 bg-muted rounded w-3/4"></div>
									<div className="h-4 bg-muted rounded w-1/2"></div>
								</div>
							</div>
						))}
					</div>
				)}

				{!isLoading && results.length === 0 && query.trim() !== '' && (
					<div className="text-center text-gray-500 mt-12">
						No markets found for "{query}".
					</div>
				)}
			</div>
		</div>
	);
}
