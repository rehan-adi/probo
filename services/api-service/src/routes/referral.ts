import { Hono } from 'hono';
import { rateLimiter } from '@/middlewares/limiter';
import { authorization } from '@/middlewares/authorization';
import { referralLeaderboard, submitReferral, getReferralEarnings } from '@/controllers/referral';

/**
 * Referral Routes
 *
 * GET    /api/v1/referral/             → Get all referrals and earnings for logged-in user
 * POST   /api/v1/referral/submit       → Submit referral code (only once per user)
 * GET    /api/v1/referral/leaderboard  → Fetch top 5 earners leaderboard
 */

export const referralRoutes = new Hono();

referralRoutes.post('/submit', authorization, submitReferral);
referralRoutes.get(
	'/referral-earnings',
	authorization,
	rateLimiter({ points: 30, duration: 60 }),
	getReferralEarnings,
);
referralRoutes.get('/leaderboard', rateLimiter({ points: 50, duration: 60 }), referralLeaderboard);
