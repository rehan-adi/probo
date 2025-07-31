import { Hono } from 'hono';
import { authorization } from '@/middlewares/authorization';
import {
	getPendingVerifications,
	getUserVerificationDetailsForAdmin,
	getVerificationDetails,
	getVerificationStatus,
	submitKyc,
	submitPaymentMethods,
	updatePendingVerification,
} from '@/controllers/verification';
import { rateLimiter } from '@/middlewares/limiter';

export const verificationRoutes = new Hono();

verificationRoutes.get(
	'/',
	authorization,
	rateLimiter({ points: 20, duration: 300 }),
	getVerificationDetails,
);
verificationRoutes.get(
	'/status',
	authorization,
	rateLimiter({ points: 50, duration: 300 }),
	getVerificationStatus,
);

// kyc and payment method submit routes
verificationRoutes.post(
	'/kyc/submit',
	rateLimiter({ points: 5, duration: 300 }),
	authorization,
	submitKyc,
);
verificationRoutes.post(
	'/payment-method/submit',
	authorization,
	rateLimiter({ points: 5, duration: 300 }),
	submitPaymentMethods,
);

// admin routes
verificationRoutes.get('/pending', authorization, getPendingVerifications);
verificationRoutes.post('/verify', authorization, updatePendingVerification);

verificationRoutes.get('/:userId', authorization, getUserVerificationDetailsForAdmin);
