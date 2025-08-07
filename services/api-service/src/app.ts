import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { Context, Hono } from 'hono';

import { authRoutes } from '@/routes/auth';
import { healthRoutes } from '@/routes/health';
import { marketRoutes } from './routes/market';
import { balanceRoutes } from './routes/balance';
import { referralRoutes } from './routes/referral';
import { categoriesRoutes } from './routes/categories';
import { generatePresignedUrl } from './lib/aws/presign';
import { transactionRoutes } from './routes/transaction';
import { verificationRoutes } from './routes/verification';

const app = new Hono();

// middlewares
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

// routes
app.route('/api/v1/auth', authRoutes);
app.route('/api/v1/health', healthRoutes);
app.route('/api/v1/market', marketRoutes);
app.route('/api/v1/balance', balanceRoutes);
app.route('/api/v1/referral', referralRoutes);
app.route('/api/v1/categories', categoriesRoutes);
app.route('/api/v1/transaction', transactionRoutes);
app.route('/api/v1/verification', verificationRoutes);

/**
 * this route is for generating Presigned Url, called by frontend in Create Event page
 */

app.post('/api/v1/generate/url', async (c: Context) => {
	const body = await c.req.json();

	const { fileName, fileType } = body;

	if (!fileName || !fileType) {
		return c.json(
			{
				success: false,
				message: 'Missing file name or type',
			},
			400,
		);
	}

	const { url, publicUrl } = await generatePresignedUrl(fileName, fileType);
	return c.json({
		success: true,
		message: 'Presinges url generated',
		url,
		publicUrl,
	});
});

export default app;
