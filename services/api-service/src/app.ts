import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

import { authRoutes } from '@/routes/auth';
import { healthRoutes } from '@/routes/health';

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
app.route('/api/v1/health', healthRoutes);
app.route('/api/v1/auth', authRoutes);

export default app;
