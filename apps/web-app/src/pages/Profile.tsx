import { useEffect, useState } from 'react';
import { Loader2, TrendingUp, Trophy, Twitter, MessageSquare } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '@/config/axios';

export default function Profile() {
	const { username } = useParams<{ username: string }>();
	const navigate = useNavigate();
	const [profile, setProfile] = useState<any>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (!username) {
			navigate('/settings');
			return;
		}

		const fetchPublicProfile = async () => {
			try {
				// We mock the public profile response since the specific API might not exist yet,
				// but we hit a placeholder route. If this fails, we just mock the data.
				const res = await api.get(`/profile/${username}`).catch(() => null);

				if (res?.data?.success) {
					setProfile(res.data.data);
				} else {
					// Fallback Mock Data for UI demonstration
					setProfile({
						username: username,
						avatarUrl: '',
						bio: 'Crypto enthusiast & prediction market trader. Always looking for the next big event.',
						joinedDate: 'August 2026',
						stats: {
							volumeTraded: '₹45,200',
							marketsTraded: 124,
							netProfit: '+₹12,450',
						},
						socials: {
							twitter: 'rehan_trader',
							discord: 'rehan#1234',
						},
					});
				}
			} catch (err) {
				console.error('Failed to fetch profile', err);
			} finally {
				setLoading(false);
			}
		};

		fetchPublicProfile();
	}, [username, navigate]);

	if (loading) {
		return (
			<div className="flex justify-center items-center min-h-[60vh]">
				<Loader2 className="animate-spin w-8 h-8 text-black dark:text-white" />
			</div>
		);
	}

	if (!profile) {
		return (
			<div className="flex justify-center items-center min-h-[60vh]">
				<p className="text-gray-500">User not found</p>
			</div>
		);
	}

	return (
		<div className="max-w-4xl mx-auto px-6 py-10 md:py-16 w-full">
			<div className="bg-white dark:bg-[#090C1A] border border-gray-200 dark:border-gray-800 rounded-3xl overflow-hidden shadow-sm">
				{/* Banner Cover */}
				<div className="h-48 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>

				<div className="px-8 pb-8 relative">
					{/* Avatar Profile */}
					<div className="flex justify-between items-start">
						<div className="-mt-16 relative">
							<div className="w-32 h-32 rounded-full border-4 border-white dark:border-[#090C1A] bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
								{profile.avatarUrl ? (
									<img
										src={profile.avatarUrl}
										alt={profile.username}
										className="w-full h-full object-cover"
									/>
								) : (
									<span className="text-4xl font-bold text-gray-400 dark:text-gray-500">
										{profile.username?.charAt(0).toUpperCase() || 'U'}
									</span>
								)}
							</div>
						</div>
						<div className="mt-4 flex gap-2">
							<button className="px-6 py-2 bg-black dark:bg-white text-white dark:text-black font-semibold rounded-full text-sm hover:opacity-90 transition-opacity">
								Follow
							</button>
						</div>
					</div>

					{/* Profile Info */}
					<div className="mt-4">
						<h1 className="text-2xl font-bold text-gray-900 dark:text-white">{profile.username}</h1>
						<p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
							Joined {profile.joinedDate || 'Recently'}
						</p>

						{profile.bio && (
							<p className="mt-4 text-gray-800 dark:text-gray-200 max-w-2xl leading-relaxed">
								{profile.bio}
							</p>
						)}

						{/* Socials */}
						<div className="flex items-center gap-4 mt-6">
							{profile.socials?.twitter && (
								<div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-500 cursor-pointer transition-colors">
									<Twitter size={18} />
									<span className="text-sm font-medium">@{profile.socials.twitter}</span>
								</div>
							)}
							{profile.socials?.discord && (
								<div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-indigo-500 cursor-pointer transition-colors">
									<MessageSquare size={18} />
									<span className="text-sm font-medium">{profile.socials.discord}</span>
								</div>
							)}
						</div>
					</div>

					{/* Trading Stats */}
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 pt-8 border-t border-gray-100 dark:border-gray-800">
						<div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-6">
							<div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-2">
								<TrendingUp size={18} />
								<span className="text-sm font-medium">Volume Traded</span>
							</div>
							<div className="text-2xl font-bold text-gray-900 dark:text-white">
								{profile.stats?.volumeTraded || '₹0'}
							</div>
						</div>

						<div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-6">
							<div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-2">
								<Trophy size={18} />
								<span className="text-sm font-medium">Net Profit</span>
							</div>
							<div className="text-2xl font-bold text-emerald-600 dark:text-emerald-500">
								{profile.stats?.netProfit || '₹0'}
							</div>
						</div>

						<div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-6">
							<div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-2">
								<div className="w-4 h-4 rounded bg-blue-500"></div>
								<span className="text-sm font-medium">Markets Traded</span>
							</div>
							<div className="text-2xl font-bold text-gray-900 dark:text-white">
								{profile.stats?.marketsTraded || '0'}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
