import { useMutation } from '@tanstack/react-query';
import { submitKyc, submitPaymentMethod, verify } from '@/api/verification';

export const useSubmitKycMutation = () => {
	return useMutation({
		mutationKey: ['kycVerification'],
		mutationFn: ({
			panName,
			panNumber,
			DOB,
		}: {
			panName: string;
			panNumber: string;
			DOB: string;
		}) => submitKyc(panName, panNumber, DOB),
	});
};

export const useSubmitPaymentMutation = () => {
	return useMutation({
		mutationKey: ['paymentVerification'],
		mutationFn: ({
			upiId,
			bankAccountNumber,
			ifscCode,
		}: {
			upiId: string;
			bankAccountNumber: string;
			ifscCode: string;
		}) => submitPaymentMethod(upiId, bankAccountNumber, ifscCode),
	});
};

export const useVerifyVerificationMutation = () => {
	return useMutation({
		mutationKey: ['verifyVerification'],
		mutationFn: ({
			id,
			kycStatus,
			paymentStatus,
			kycRemark,
			paymentRemark,
		}: {
			id: string;
			kycStatus: string;
			paymentStatus: string;
			kycRemark: string;
			paymentRemark: string;
		}) => verify(id, kycStatus, paymentStatus, kycRemark, paymentRemark),
	});
};
