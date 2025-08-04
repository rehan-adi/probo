import { useAuthStore } from '@/store/auth';
import { useQuery } from '@tanstack/react-query';
import { getBalance, getDepositAmount } from '@/api/balance';

export const useBalanceQuery = () => {
	const isLoggedIn = useAuthStore((s) => s.isLoggedIn());

	return useQuery({
		queryKey: ['balance'],
		queryFn: () => getBalance(),
		enabled: isLoggedIn,
		retry: 2,
		retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
		refetchOnMount: false,
		refetchOnWindowFocus: true,
		staleTime: 1000 * 60 * 5,
	});
};

export const useDepositAmountQuery = () => {
	return useQuery({
		queryKey: ['totalDepositAmount'],
		queryFn: () => getDepositAmount(),
		retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
		refetchOnMount: false,
		refetchOnWindowFocus: true,
		staleTime: 1000 * 60 * 5,
	});
};
