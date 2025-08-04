import { api } from '@/lib/axios';

export const getBalance = () => {
	return api.get('/balance/get');
};

export const getDepositAmount = () => {
	return api.get('/balance/deposit');
};

export const deposit = (amount: string) => {
	return api.post('/balance/deposit', { amount });
};
