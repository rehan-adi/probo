import { api } from '@/lib/axios';

export const getKycVerififcationStatus = () => {
	return api.get('/verification/status');
};

export const submitKyc = (panName: string, panNumber: string, DOB: string) => {
	return api.post('/verification/kyc/submit', { panName, panNumber, DOB });
};
