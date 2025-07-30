import { Hono } from 'hono';
import { rateLimiter } from '@/middlewares/limiter';
import { authorization } from '@/middlewares/authorization';
import {
	getReferralCode,
	referralLeaderboard,
	submitReferral,
	getReferralEarnings,
} from '@/controllers/referral';

/**
 * Referral Routes
 *
 * GET    /api/v1/referral/                   → Get referral code
 * POST   /api/v1/referral/submit             → Submit referral code (only once per user)
 * GET    /api/v1/referral/referral-earnings  → Get earnings for a user only referral earnings
 * GET    /api/v1/referral/leaderboard        → Fetch top 5 earners leaderboard
 */

export const referralRoutes = new Hono();

referralRoutes.get('/', authorization, getReferralCode);
referralRoutes.post('/submit', authorization, submitReferral);
referralRoutes.get(
	'/referral-earnings',
	authorization,
	rateLimiter({ points: 30, duration: 60 }),
	getReferralEarnings,
);
referralRoutes.get('/leaderboard', rateLimiter({ points: 50, duration: 60 }), referralLeaderboard);
