import { api } from '@/lib/axios';

export const getKycVerififcationStatus = () => {
	return api.get('/verification/status');
};

export const getKycVerififcationDetails = () => {
	return api.get('/verification');
};

export const submitKyc = (panName: string, panNumber: string, DOB: string) => {
	return api.post('/verification/kyc/submit', { panName, panNumber, DOB });
};

export const submitPaymentMethod = (upiId: string, bankAccountNumber: string, ifscCode: string) => {
	return api.post('/verification/payment-method/submit', { upiId, bankAccountNumber, ifscCode });
};

export const getAllPendingVerifications = () => {
	return api.get('/verification/pending');
};

export const getUserVerificationDetails = async (userId: string) => {
	const response = await api.get(`/verification/${userId}`);
	return response.data;
};

export const verify = (
	userId: string,
	kycStatus?: string,
	paymentStatus?: string,
	kycRemark?: string,
	paymentRemark?: string,
) => {
	return api.post('/verification/verify', { userId, kycStatus, kycRemark, paymentStatus, paymentRemark });
};
