import { submitReferral } from '@/api/referral';
import { useMutation } from '@tanstack/react-query';

export const useSubmitReferral = () => {
	return useMutation({
		mutationKey: ['submitReferral'],
		mutationFn: (payload: { referralCode?: string } | { skip: true }) => submitReferral(payload),
	});
};
