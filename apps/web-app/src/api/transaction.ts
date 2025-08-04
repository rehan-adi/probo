import { api } from '@/lib/axios';

export const getTransactionHistory = () => {
	return api.get('/transaction');
};
