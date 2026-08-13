import { Hono } from 'hono';
import { rateLimiter } from '@/middlewares/limiter';
import { authorization } from '@/middlewares/authorization';
import {
	getReferralCode,
	referralLeaderboard,
	submitReferral,
	getReferralEarnings,
	getReferralInfo,
} from '@/controllers/referral';

export const referralRoutes = new Hono();

referralRoutes.get('/', authorization, getReferralCode);
referralRoutes.get('/info', authorization, getReferralInfo);
referralRoutes.post('/submit', authorization, submitReferral);
referralRoutes.get(
	'/referral-earnings',
	authorization,
	rateLimiter({ points: 30, duration: 60 }),
	getReferralEarnings,
);
referralRoutes.get('/leaderboard', rateLimiter({ points: 50, duration: 60 }), referralLeaderboard);
