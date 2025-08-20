import { deposit, withdraw } from '@/api/balance';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export const useDepositMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationKey: ['deposit'],
		mutationFn: (amount: string) => deposit(amount),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['balance'] });
		},
	});
};

export const useWithdrawMutation = () => {
	return useMutation({
		mutationKey: ['withdrawl'],
		mutationFn: ({
			amount,
			currentWalletAmount,
		}: {
			amount: string;
			currentWalletAmount: string;
		}) => withdraw(amount, currentWalletAmount),
	});
};
