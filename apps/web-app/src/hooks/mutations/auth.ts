import { login, verify } from '@/api/auth';
import { useAuthStore } from '@/store/auth';
import { useMutation } from '@tanstack/react-query';

export const useLoginMutation = () => {
	return useMutation({
		mutationKey: ['login'],
		mutationFn: (phone: string) => login(phone),
		onSuccess: () => {
			console.log('done login');
		},
		onError: (error) => {
			console.error('Failed to send OTP:', error);
		},
	});
};

export const useVerifyMutation = () => {
	return useMutation({
		mutationKey: ['verify'],
		mutationFn: ({ phone, otp }: { phone: string; otp: string }) => verify(otp, phone),
		onSuccess: (response) => {
			const { data, token } = response.data;

			useAuthStore.getState().setUserWithToken(
				{
					id: data.id,
					phone: data.phone,
					role: data.role,
					isNewUser: data.isNewUser,
				},
				token,
			);
		},
		onError: (error) => {
			console.error('Failed to verify', error);
		},
	});
};