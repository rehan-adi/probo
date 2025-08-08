import { api } from '@/lib/axios';

export const getAllCategoary = () => {
	return api.get('/categories');
};
