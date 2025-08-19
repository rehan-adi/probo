import { useQuery } from '@tanstack/react-query';
import {
	getKycVerififcationStatus,
	getKycVerififcationDetails,
	getAllPendingVerifications,
} from '@/api/verification';

export const useGetVerificationStatus = () => {
	return useQuery({
		queryKey: ['verificationStatus'],
		queryFn: () => getKycVerififcationStatus(),
	});
};

export const useGetVerificationDetails = () => {
	return useQuery({
		queryKey: ['verificationDetails'],
		queryFn: () => getKycVerififcationDetails(),
	});
};

export const useGetAllPendingVerification = () => {
	return useQuery({
		queryKey: ['pendingVerifications'],
		queryFn: () => getAllPendingVerifications(),
	});
};
