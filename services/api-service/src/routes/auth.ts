import { Hono } from 'hono';
import {
	initSignin,
	verifyOtp,
	googleCallback,
	discordCallback,
	telegramCallback,
	logout,
	refresh,
	getMe,
	getSessions,
	logoutAll,
} from '@/controllers/auth';
import { rateLimiter } from '@/middlewares/limiter';
import { authorization } from '@/middlewares/authorization';

export const authRoutes = new Hono();

const authLimiter = rateLimiter({ points: 100, duration: 60 });
const loginLimiter = rateLimiter({ points: 100, duration: 300 });

authRoutes.post('/init-signin', authLimiter, initSignin);
authRoutes.post('/verify-otp', loginLimiter, verifyOtp);

authRoutes.post('/google/callback', loginLimiter, googleCallback);
authRoutes.post('/discord/callback', loginLimiter, discordCallback);
authRoutes.post('/telegram/callback', loginLimiter, telegramCallback);

authRoutes.post('/logout', logout);
authRoutes.use('/*', authorization);
authRoutes.post('/refresh', refresh);

authRoutes.get('/me', getMe);
authRoutes.get('/sessions', getSessions);
authRoutes.post('/logout-all', logoutAll);
