import { Hono } from 'hono';
import { isAdmin } from '@/middlewares/isAdmin';
import { authorization } from '@/middlewares/authorization';
import {
	resolveMarket,
	getDashboardMetrics,
	getUsers,
	getTransactions,
	getMarkets,
} from '@/controllers/admin';
import {
	getPendingVerifications,
	updatePendingVerification,
	getUserVerificationDetailsForAdmin,
} from '@/controllers/verification';

export const aapiRoutes = new Hono();

aapiRoutes.use('*', authorization, isAdmin);

aapiRoutes.get('/verification/pending', getPendingVerifications);
aapiRoutes.post('/verification/verify', updatePendingVerification);
aapiRoutes.get('/verification/:userId', getUserVerificationDetailsForAdmin);

aapiRoutes.post('/markets/resolve', resolveMarket);
aapiRoutes.get('/analytics/dashboard', getDashboardMetrics);
aapiRoutes.get('/users', getUsers);
aapiRoutes.get('/transactions', getTransactions);
aapiRoutes.get('/markets', getMarkets);
