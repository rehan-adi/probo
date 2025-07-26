import { Hono } from 'hono';
import { authorization } from '@/middlewares/authorization';
import {
	getVerificationDetails,
	getVerificationStatus,
	submitKyc,
	submitPaymentMethods,
} from '@/controllers/verification';

export const verificationRoutes = new Hono();

verificationRoutes.get('/', authorization, getVerificationDetails);
verificationRoutes.get('/status', authorization, getVerificationStatus);

verificationRoutes.post('/kyc/submit', authorization, submitKyc);
verificationRoutes.post('/payment-method/submit', authorization, submitPaymentMethods);
