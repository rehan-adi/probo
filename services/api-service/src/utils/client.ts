import { Context } from 'hono';

export const getClientInfo = (c: Context) => ({
	ip: c.req.header('x-forwarded-for') || 'unknown',
	userAgent: c.req.header('user-agent') || 'unknown',
});
