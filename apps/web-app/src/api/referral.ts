import { api } from '@/lib/axios';

export const submitReferral = (data: { referralCode?: string } | { skip: true }) => {
	return api.post('/referral/submit', data);
};
