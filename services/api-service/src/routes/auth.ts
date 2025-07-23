import { Hono } from 'hono';
import { login, logout, verify } from '@/controllers/auth';
import { rateLimiter } from '@/middlewares/limiter';

/**
 * Auth specific Routes
 *
 * POST /api/v1/auth/login       → Login or Signup users and send OTP
 * POST /api/v1/auth/verify-otp  → Verify OTP, issue JWT token and add welcome bonus to user's inr balance
 * POST /api/v1/auth/logout      → Logout and clear JWT cookie
 */

export const authRoutes = new Hono();

authRoutes.post('/login', rateLimiter({ points: 3, duration: 300 }), login);
authRoutes.post('/logout', logout);
authRoutes.post('/verify-otp', rateLimiter({ points: 3, duration: 300 }), verify);
