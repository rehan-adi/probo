import { api } from '@/lib/axios';

export const getKycVerififcationStatus = () => {
	return api.get('/verification/status');
};
