import { useQuery } from '@tanstack/react-query';
import { getTransactionHistory } from '@/api/transaction';

export const useGetTransactionHistoryQuery = () => {
	return useQuery({
		queryKey: ['transaction'],
		queryFn: getTransactionHistory,
		refetchOnMount: true,
		refetchOnWindowFocus: false,
	});
};
