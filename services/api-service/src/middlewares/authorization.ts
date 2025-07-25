import { verify } from 'hono/jwt';
import { ENV } from '@/config/env';
import { logger } from '@/utils/logger';
import { getCookie } from 'hono/cookie';
import { Context, MiddlewareHandler } from 'hono';

export const authorization: MiddlewareHandler = async (c: Context, next) => {
	try {
		const token = getCookie(c, 'token');

		if (!token) {
			logger.warn('No token found in cookies');
			return c.json({ success: false, message: 'Unauthorized' }, 401);
		}

		const payload = await verify(token, ENV.JWT_SECRET);

		const { id, phone, role } = payload as {
			id: string;
			phone: string;
			role: string;
		};

		c.set('user', { id, phone, role });

		await next();
	} catch (error) {
		logger.error('JWT verification failed:', error);
		return c.json({ success: false, message: 'Invalid or expired token' }, 401);
	}
};
