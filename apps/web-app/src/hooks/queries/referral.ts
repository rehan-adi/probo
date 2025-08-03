import { useQuery } from '@tanstack/react-query';
import { getreferralCode } from '@/api/referral';

export const useGetReferralCodeQuery = () => {
	return useQuery({
		queryKey: ['getreferralCode'],
		queryFn: getreferralCode,
		staleTime: Infinity,
		gcTime: Infinity,
		refetchOnWindowFocus: false,
		refetchOnReconnect: false,
		refetchInterval: false,
	});
};
