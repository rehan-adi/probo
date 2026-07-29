import { useState, useEffect, useRef } from 'react';
import { Search, X, Flame, TrendingUp, Clock, Target, DollarSign, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDebounce } from '@/hooks/useDebounce';
import axios from 'axios';

const BROWSE_CATEGORIES = [
	{ id: 'new', name: 'New', icon: <Target className="w-4 h-4" /> },
	{ id: 'trending', name: 'Trending', icon: <TrendingUp className="w-4 h-4" /> },
	{ id: 'popular', name: 'Popular', icon: <Flame className="w-4 h-4" /> },
	{ id: 'liquid', name: 'Liquid', icon: <DollarSign className="w-4 h-4" /> },
	{ id: 'ending-soon', name: 'Ending Soon', icon: <Clock className="w-4 h-4" /> },
	{ id: 'competitive', name: 'Competitive', icon: <Activity className="w-4 h-4" /> },
];

const HOT_TOPICS = [
	{ id: 'live-crypto', name: 'Live Crypto', icon: '📈' },
	{ id: 'politics', name: 'Politics', icon: '🏛️' },
	{ id: 'middle-east', name: 'Middle East', icon: '🌍' },
	{ id: 'crypto', name: 'Crypto', icon: '₿' },
	{ id: 'sports', name: 'Sports', icon: '🏀' },
	{ id: 'pop-culture', name: 'Pop Culture', icon: '🍿' },
];

export default function SearchInput() {
	const navigate = useNavigate();
	const [isOpen, setIsOpen] = useState(false);
	const [query, setQuery] = useState('');
	const [results, setResults] = useState<any[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);

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
		if (debouncedQuery.trim().length > 0) {
			fetchResults(debouncedQuery);
		} else {
			setResults([]);
		}
	}, [debouncedQuery]);

	const fetchResults = async (q: string) => {
		setIsLoading(true);
		try {
			const res = await axios.get(`http://localhost:3000/api/v1/markets/search?q=${q}&limit=6`, {
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
		<div className="relative w-full max-w-md hidden md:block" ref={dropdownRef}>
			<div className="relative flex items-center">
				<Search className="absolute left-3 w-4 h-4 text-gray-500" />
				<input
					type="text"
					placeholder="Search markets..."
					className="w-full bg-card border border-border text-foreground rounded-md pl-9 pr-8 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
					value={query}
					onChange={(e) => {
						setQuery(e.target.value);
						if (!isOpen) setIsOpen(true);
					}}
					onFocus={() => setIsOpen(true)}
				/>
				{query && (
					<button
						className="absolute right-3 text-gray-500 hover:text-foreground"
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
								Browse
							</h3>
							<div className="flex flex-wrap gap-2 mb-6">
								{BROWSE_CATEGORIES.map((cat) => (
									<button
										key={cat.id}
										className="flex items-center gap-2 px-3 py-1.5 text-sm bg-background border border-border hover:bg-muted rounded-full text-foreground"
									>
										{cat.icon}
										<span>{cat.name}</span>
									</button>
								))}
							</div>

							<h3 className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">
								Category
							</h3>
							<div className="grid grid-cols-2 gap-2">
								{HOT_TOPICS.map((topic) => (
									<button
										key={topic.id}
										className="flex items-center gap-3 px-3 py-2 text-sm bg-background border border-border hover:bg-muted rounded-xl text-foreground text-left"
									>
										<span className="text-lg">{topic.icon}</span>
										<span className="font-medium">{topic.name}</span>
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
											className="flex items-center gap-3 px-4 py-3 hover:bg-muted text-left"
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
