import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';

interface NewsItem {
	id: string;
	title: string;
	url: string;
	publishedAt: string;
	source: string;
}

const mockNews: NewsItem[] = [
	{
		id: '1',
		title: 'Will Apple release iPhone 18 in 2026?',
		url: '#',
		publishedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
		source: 'TechCrunch',
	},
	{
		id: '2',
		title: 'Will Apple release a new product line before 2027?',
		url: '#',
		publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
		source: 'The Verge',
	},
	{
		id: '3',
		title: 'Will Apple release a touchscreen MacBook in 2026?',
		url: '#',
		publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
		source: 'MacRumors',
	},
];

interface MarketNewsProps {
	title?: string;
}

export default function MarketNews({ title }: MarketNewsProps) {
	const [newsList, setNewsList] = useState<NewsItem[]>(mockNews);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (!title) return;

		const fetchNews = async () => {
			setLoading(true);
			try {
				// Using RSS2JSON proxy with Google News RSS to fetch real news without an API key
				// Extract primary keywords from title for better search (first 3-4 words usually)
				const keywords = encodeURIComponent(title.split(' ').slice(0, 4).join(' '));
				const rssUrl = `https://news.google.com/rss/search?q=${keywords}&hl=en-US&gl=US&ceid=US:en`;
				const response = await fetch(
					`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`,
				);
				const data = await response.json();

				if (data.status === 'ok' && data.items && data.items.length > 0) {
					const fetchedNews: NewsItem[] = data.items
						.slice(0, 3)
						.map((article: any, index: number) => {
							// Google News often formats title as "Article Title - Source Name"
							const titleParts = article.title.split(' - ');
							const source = titleParts.length > 1 ? titleParts.pop() : 'News';
							const cleanTitle = titleParts.join(' - ');

							return {
								id: String(index),
								title: cleanTitle,
								url: article.link,
								publishedAt: article.pubDate,
								source: source,
							};
						});
					setNewsList(fetchedNews);
				} else {
					setNewsList(mockNews); // fallback if no results
				}
			} catch (error) {
				console.error('Error fetching news:', error);
				setNewsList(mockNews); // fallback on error
			} finally {
				setLoading(false);
			}
		};

		fetchNews();
	}, [title]);

	const formatTimeAgo = (dateString: string) => {
		try {
			return formatDistanceToNow(new Date(dateString), { addSuffix: true });
		} catch (e) {
			return 'recently';
		}
	};

	if (loading) {
		return (
			<div className="w-full mt-6">
				<h3 className="text-[15px] font-bold text-foreground mb-4">Related News</h3>
				<div className="animate-pulse space-y-4">
					{[1, 2, 3].map((i) => (
						<div key={i} className="flex flex-col gap-2">
							<div className="h-4 bg-muted rounded w-full"></div>
							<div className="h-3 bg-muted rounded w-24"></div>
						</div>
					))}
				</div>
			</div>
		);
	}

	return (
		<div className="w-full mt-6">
			<h3 className="text-[15px] font-bold text-foreground mb-4">Related News</h3>

			<div className="space-y-1">
				{newsList.map((news) => (
					<a
						key={news.id}
						href={news.url}
						target="_blank"
						rel="noopener noreferrer"
						className="block py-3 cursor-pointer group hover:bg-muted/30 -mx-2 px-2 rounded-lg transition-colors"
					>
						<p className="text-[14px] font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug mb-1">
							{news.title}
						</p>
						<div className="flex items-center gap-2 text-[12px] text-muted-foreground font-medium">
							<span>{news.source}</span>
							<span>•</span>
							<span>{formatTimeAgo(news.publishedAt)}</span>
						</div>
					</a>
				))}
			</div>
		</div>
	);
}
