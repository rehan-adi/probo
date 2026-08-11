import { logger } from '@/libs/logger';
import { Context, MiddlewareHandler } from 'hono';

export const isAdmin: MiddlewareHandler = async (c: Context, next) => {
	const user = c.get('user');

	if (!user || user.role !== 'ADMIN') {
		logger.warn(
			{
				context: 'IS_ADMIN_MIDDLEWARE',
				userId: user?.id,
				role: user?.role,
			},
			'Unauthorized attempt to access admin route',
		);
		return c.json(
			{
				success: false,
				message: 'Unauthorized: Admin access required',
			},
			403,
		);
	}

	await next();
};
