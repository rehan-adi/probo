import { useMutation } from '@tanstack/react-query';
import axios from 'axios';

export const useInitPaymentMutation = () => {
	return useMutation({
		mutationFn: async (amount: number) => {
			const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/payments/init`, { amount }, {
				withCredentials: true,
			});
			return res.data;
		},
	});
};
