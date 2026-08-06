import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

import { authRoutes } from '@/routes/auth';
import { orderRoutes } from '@/routes/order';
import { healthRoutes } from '@/routes/health';
import { marketRoutes } from '@/routes/market';
import { paymentRoutes } from '@/routes/payment';
import { profileRoutes } from '@/routes/profile';
import { balanceRoutes } from '@/routes/balance';
import { settingsRoutes } from '@/routes/settings';
import { referralRoutes } from '@/routes/referral';
import { portfolioRoutes } from '@/routes/portfolio';
import { onboardingRoutes } from '@/routes/onboarding';
import { categoriesRoutes } from '@/routes/categories';
import { transactionRoutes } from '@/routes/transaction';
import { verificationRoutes } from '@/routes/verification';

const app = new Hono();


app.use(logger());
app.use(
	cors({
		origin: ['http://localhost:5173'],
		allowHeaders: ['Content-Type', 'Authorization', 'X-Custom-Header'],
		allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
		exposeHeaders: ['Content-Length', 'X-Custom-Header'],
		maxAge: 86400,
		credentials: true,
	}),
);
app.use('*', async (c, next) => {
	c.header('X-Content-Type-Options', 'nosniff');
	c.header('X-Frame-Options', 'DENY');
	c.header('X-XSS-Protection', '1; mode=block');
	c.header('Referrer-Policy', 'no-referrer');
	await next();
});


app.route('/api/v1/auth', authRoutes);
app.route('/api/v1/order', orderRoutes);
app.route('/api/v1/health', healthRoutes);
app.route('/api/v1/market', marketRoutes);
app.route('/api/v1/balance', balanceRoutes);
app.route('/api/v1/profile', profileRoutes);
app.route('/api/v1/payments', paymentRoutes);
app.route('/api/v1/settings', settingsRoutes);
app.route('/api/v1/referral', referralRoutes);
app.route('/api/v1/portfolio', portfolioRoutes);
app.route('/api/v1/onboarding', onboardingRoutes);
app.route('/api/v1/categories', categoriesRoutes);
app.route('/api/v1/transaction', transactionRoutes);
app.route('/api/v1/verification', verificationRoutes);


export default app;
