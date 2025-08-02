import { api } from '@/lib/axios';

export const login = (phone: string) => {
	return api.post('/auth/login', { phone });
};

export const verify = (otp: string, phone: string) => {
	return api.post('/auth/verify-otp', { otp, phone });
};

export const logout = () => {
	return api.post('/auth/logout');
};
