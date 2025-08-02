import { api } from '@/lib/axios';

export const getBalance = () => {
	return api.get('/balance/get');
};
