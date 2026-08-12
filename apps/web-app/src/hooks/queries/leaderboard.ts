import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/axios';

export interface LeaderboardEntry {
	rank: number;
	userId: string;
	name: string;
	username: string;
	avatar: string | null;
	profit: number;
	volume?: number;
}

export interface UserRankData {
	rank: number | null;
	profit: number;
}

export interface LeaderboardResponse {
	success: boolean;
	data: {
		timeframe: string;
		leaderboard: LeaderboardEntry[];
		userRank: UserRankData | null;
	};
}

export function useLeaderboardQuery(timeframe: string = 'all_time') {
	return useQuery<LeaderboardResponse>({
		queryKey: ['leaderboard', timeframe],
		queryFn: async () => {
			const res = await api.get(`/leaderboard?timeframe=${timeframe}`);
			return res.data;
		},
		staleTime: 30 * 1000,
	});
}
