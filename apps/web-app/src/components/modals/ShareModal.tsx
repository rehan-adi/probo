import { X, Copy, Check, Twitter, Link as LinkIcon, Send } from 'lucide-react';
import { useState } from 'react';

interface ShareModalProps {
	isOpen: boolean;
	onClose: () => void;
	title: string;
	url: string;
}

export default function ShareModal({ isOpen, onClose, title, url }: ShareModalProps) {
	const [copied, setCopied] = useState(false);

	if (!isOpen) return null;

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(url);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch (err) {
			console.error('Failed to copy', err);
		}
	};

	const shareText = encodeURIComponent(`Trade on this event on Probstreet: ${title}`);
	const shareUrl = encodeURIComponent(url);

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm font-sans">
			<div
				className="bg-card w-full max-w-md rounded-2xl shadow-xl border border-border overflow-hidden transform transition-all"
				onClick={(e) => e.stopPropagation()}
			>
				{/* Header */}
				<div className="flex justify-between items-center p-5 border-b border-border/50">
					<h2 className="text-lg font-bold text-foreground">Share this Event</h2>
					<button
						onClick={onClose}
						className="p-1.5 rounded-full hover:bg-muted text-muted-foreground transition-colors"
					>
						<X className="w-5 h-5" />
					</button>
				</div>

				{/* Body */}
				<div className="p-6 space-y-6">
					<div className="flex justify-center gap-6">
						<a
							href={`https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`}
							target="_blank"
							rel="noreferrer"
							className="flex flex-col items-center gap-2 group"
						>
							<div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
								<Twitter className="w-5 h-5 text-blue-500" />
							</div>
							<span className="text-xs font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
								Twitter
							</span>
						</a>

						<a
							href={`https://t.me/share/url?url=${shareUrl}&text=${shareText}`}
							target="_blank"
							rel="noreferrer"
							className="flex flex-col items-center gap-2 group"
						>
							<div className="w-12 h-12 rounded-full bg-sky-500/10 flex items-center justify-center group-hover:bg-sky-500/20 transition-colors">
								<Send className="w-5 h-5 text-sky-500" />
							</div>
							<span className="text-xs font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
								Telegram
							</span>
						</a>

						<a
							href={`https://wa.me/?text=${shareText} ${shareUrl}`}
							target="_blank"
							rel="noreferrer"
							className="flex flex-col items-center gap-2 group"
						>
							<div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
								<svg className="w-5 h-5 text-emerald-500" viewBox="0 0 24 24" fill="currentColor">
									<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
								</svg>
							</div>
							<span className="text-xs font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
								WhatsApp
							</span>
						</a>
					</div>

					<div className="relative mt-6">
						<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
							<LinkIcon className="h-4 w-4 text-muted-foreground" />
						</div>
						<input
							type="text"
							readOnly
							value={url}
							className="block w-full pl-10 pr-24 py-3 bg-muted/30 border border-border rounded-xl text-sm font-medium text-foreground focus:outline-none focus:border-primary/50"
						/>
						<button
							onClick={handleCopy}
							className="absolute inset-y-1.5 right-1.5 flex items-center gap-1.5 px-3 bg-foreground text-background font-bold text-xs rounded-lg hover:bg-foreground/90 transition-colors"
						>
							{copied ? (
								<>
									<Check className="w-3.5 h-3.5" /> Copied
								</>
							) : (
								<>
									<Copy className="w-3.5 h-3.5" /> Copy
								</>
							)}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
