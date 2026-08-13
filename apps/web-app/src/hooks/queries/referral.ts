import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/axios';

export function useReferralQuery() {
	return useQuery({
		queryKey: ['referral-info'],
		queryFn: async () => {
			const res = await api.get('/referral/info');
			return res.data;
		},
		staleTime: 1000 * 30, // 30 seconds
	});
}

export function useSubmitReferralMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (data: { referralCode: string }) => {
			const res = await api.post('/referral/submit', data);
			return res.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['referral-info'] });
			queryClient.invalidateQueries({ queryKey: ['user-profile'] });
			queryClient.invalidateQueries({ queryKey: ['wallet'] });
		},
	});
}
