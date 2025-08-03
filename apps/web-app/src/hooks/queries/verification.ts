import { getKycVerififcationStatus } from '@/api/verification';
import { useQuery } from '@tanstack/react-query';

export const useGetVerificationStaus = () => {
	return useQuery({
		queryKey: ['verificationStatis'],
		queryFn: () => getKycVerififcationStatus(),
	});
};
