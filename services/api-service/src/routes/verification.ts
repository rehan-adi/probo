import { Hono } from 'hono';
import { authorization } from '@/middlewares/authorization';
import { getVerificationStatus, submitKyc, submitPaymentMethods } from '@/controllers/verification';

export const verificationRoutes = new Hono();

verificationRoutes.get('/status', authorization, getVerificationStatus);
verificationRoutes.post('/kyc/submit', authorization, submitKyc);
verificationRoutes.post('/payment-method/submit', authorization, submitPaymentMethods);
