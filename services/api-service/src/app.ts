import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

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

// routes
app.route('/api/v1/health', healthRoutes);

export default app;
