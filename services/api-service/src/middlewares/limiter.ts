import { Context, Next } from 'hono';
import { client } from '@/lib/redis/connection';
import { RateLimiterRedis } from 'rate-limiter-flexible';

const limiter = new RateLimiterRedis({
	storeClient: client,
	points: 3,
	duration: 600,
	blockDuration: 600,
	keyPrefix: 'ratelimit',
});

export const rateLimiter = async (c: Context, next: Next) => {
	const key =
		c.req.header('x-forwarded-for') ||
		c.req.header('cf-connecting-ip') ||
		c.req.header('host') ||
		'unknown-ip';

	try {
		await limiter.consume(key);
		await next();
	} catch (_err) {
		return c.json(
			{
				success: false,
				message: 'Too many requests. Please wait and try again.',
			},
			429,
		);
	}
};
