import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useDebounce } from '@/hooks/useDebounce';
import { useState, useEffect, useRef } from 'react';
import { Search, X, Flame, TrendingUp, Clock, Target, DollarSign, Activity } from 'lucide-react';

const BROWSE_CATEGORIES = [
	{ id: 'new', name: 'New', icon: <Target className="w-4 h-4" /> },
	{ id: 'trending', name: 'Trending', icon: <TrendingUp className="w-4 h-4" /> },
	{ id: 'popular', name: 'Popular', icon: <Flame className="w-4 h-4" /> },
	{ id: 'liquid', name: 'Liquid', icon: <DollarSign className="w-4 h-4" /> },
	{ id: 'ending-soon', name: 'Ending Soon', icon: <Clock className="w-4 h-4" /> },
	{ id: 'competitive', name: 'Competitive', icon: <Activity className="w-4 h-4" /> },
];

export default function SearchInput() {
	const navigate = useNavigate();
	const [isOpen, setIsOpen] = useState(false);
	const [query, setQuery] = useState('');
	const [results, setResults] = useState<any[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	const debouncedQuery = useDebounce(query, 300);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
				setIsOpen(false);
			}
		};
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (
				e.key === '/' &&
				document.activeElement?.tagName !== 'INPUT' &&
				document.activeElement?.tagName !== 'TEXTAREA'
			) {
				e.preventDefault();
				inputRef.current?.focus();
			}
		};
		document.addEventListener('keydown', handleKeyDown);
		return () => document.removeEventListener('keydown', handleKeyDown);
	}, []);

	useEffect(() => {
		if (debouncedQuery.trim().length > 0) {
			fetchResults(debouncedQuery);
		} else {
			setResults([]);
		}
	}, [debouncedQuery]);

	const fetchResults = async (q: string) => {
		setIsLoading(true);
		try {
			const res = await axios.get(`http://localhost:3000/api/v1/market/search?q=${q}&limit=6`, {
				withCredentials: true,
			});
			if (res.data?.success) {
				setResults(res.data.data);
			}
		} catch (error) {
			console.error('Search failed', error);
		} finally {
			setIsLoading(false);
		}
	};

	const handleNavigate = (path: string) => {
		setIsOpen(false);
		navigate(path);
	};

	return (
		<div className="relative w-full max-w-lg hidden md:block" ref={dropdownRef}>
			<div className="relative flex items-center group">
				<Search className="absolute left-3.5 w-4 h-4 text-gray-400 group-focus-within:text-gray-900 dark:group-focus-within:text-gray-100 transition-colors" />
				<input
					ref={inputRef}
					type="text"
					placeholder="Search markets..."
					className="w-full bg-[#F4F5F6] dark:bg-slate-800 text-gray-900 dark:text-gray-100 rounded-md pl-10 pr-10 py-2.5 text-[15px] focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-1 focus:ring-gray-200 dark:focus:ring-gray-700 shadow-sm transition-all placeholder:text-gray-500"
					value={query}
					onChange={(e) => {
						setQuery(e.target.value);
						if (!isOpen) setIsOpen(true);
					}}
					onFocus={() => setIsOpen(true)}
				/>
				{!query ? (
					<div className="absolute right-3.5 text-gray-400 font-semibold text-sm pointer-events-none transition-opacity group-focus-within:opacity-0">
						/
					</div>
				) : (
					<button
						className="absolute right-3.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors bg-transparent rounded-md p-0.5"
						onClick={() => setQuery('')}
					>
						<X className="w-4 h-4" />
					</button>
				)}
			</div>

			{isOpen && (
				<div className="absolute top-full mt-2 w-[500px] max-h-[80vh] overflow-y-auto bg-card border border-border rounded-xl shadow-lg z-50">
					{query.trim().length === 0 ? (
						<div className="p-4">
							<h3 className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">
								Browse Categories
							</h3>
							<div className="flex flex-wrap gap-2 mb-6">
								{BROWSE_CATEGORIES.map((cat) => (
									<button
										key={cat.id}
										onClick={() => handleNavigate(`/category/${cat.id}`)}
										className="flex items-center gap-2 px-3 py-1.5 text-sm bg-background border border-border hover:bg-gray-200 dark:hover:bg-muted rounded-full text-foreground cursor-pointer transition-colors"
									>
										{cat.icon}
										<span>{cat.name}</span>
									</button>
								))}
							</div>
						</div>
					) : (
						<div className="py-2">
							<div className="flex gap-2 px-4 pb-2 border-b border-border">
								<button className="text-sm font-semibold text-foreground px-3 py-1 bg-muted rounded-md">
									Markets
								</button>
								<button className="text-sm font-semibold text-gray-500 px-3 py-1 hover:text-foreground">
									Profiles
								</button>
							</div>

							{isLoading ? (
								<div className="p-4 text-center text-sm text-gray-500">Loading...</div>
							) : results.length > 0 ? (
								<div className="flex flex-col mt-2">
									{results.map((market) => (
										<button
											key={market.id}
											onClick={() => handleNavigate(`/events/${market.symbol}`)}
											className="flex items-center gap-3 px-4 py-3 hover:bg-gray-200 dark:hover:bg-muted text-left"
										>
											<img
												src={market.thumbnail || 'https://via.placeholder.com/40'}
												alt={market.title}
												className="w-10 h-10 rounded shadow-sm object-cover bg-background"
											/>
											<div className="flex-1 overflow-hidden">
												<p className="text-sm font-medium text-foreground truncate">
													{market.title}
												</p>
											</div>
											<div className="text-right whitespace-nowrap">
												<span className="text-sm font-semibold text-foreground">
													{Math.round(market.yesPrice * 10)}%
												</span>
											</div>
										</button>
									))}
									<div className="p-4 border-t border-border mt-2">
										<button
											onClick={() => handleNavigate(`/search?q=${encodeURIComponent(query)}`)}
											className="text-sm text-blue-500 hover:text-blue-400 font-medium"
										>
											See all results &rarr;
										</button>
									</div>
								</div>
							) : (
								<div className="p-4 text-center text-sm text-gray-500">
									No results found for "{query}"
								</div>
							)}
						</div>
					)}
				</div>
			)}
		</div>
	);
}
