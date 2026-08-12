import { logger } from '@/libs/logger';
import { getCookie } from 'hono/cookie';
import { Context, MiddlewareHandler } from 'hono';
import { verifyAccessToken } from '@/utils/token';

export const optionalAuthorization: MiddlewareHandler = async (c: Context, next) => {
	try {
		let token = getCookie(c, 'accessToken');

		if (!token) {
			const authHeader = c.req.header('Authorization');
			if (authHeader && authHeader.startsWith('Bearer ')) {
				token = authHeader.substring(7);
			}
		}

		if (token) {
			const payload = await verifyAccessToken(token);
			if (payload?.id) {
				const { id, email, role } = payload;
				c.set('user', { id, email, role });
			}
		}
	} catch (error) {
		logger.debug({ error }, 'Optional access token verification skipped or expired');
	}

	await next();
};
