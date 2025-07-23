import { Context, Next } from 'hono';
import { client } from '@/lib/redis/connection';
import { RateLimiterRedis, RateLimiterRes } from 'rate-limiter-flexible';

type BlockOptions = {
	points?: number; // how many actions allowed
	duration?: number; // seconds
	blockDuration?: number; // seconds to block after limit
	keyPrefix?: string; // Redis key prefix
};

/**
 * Creates a rate limiter middleware with custom options.
 *
 * @param options - points, duration, blockDuration, keyPrefix
 * @returns Hono middleware function
 */
export const rateLimiter = ({
	points = 3,
	duration = 600,
	blockDuration = 600,
	keyPrefix = 'ratelimit',
}: BlockOptions = {}) => {
	const limiter = new RateLimiterRedis({
		storeClient: client,
		points,
		duration,
		blockDuration,
		keyPrefix,
	});

	return async (c: Context, next: Next) => {
		const key =
			c.req.header('x-forwarded-for') ||
			c.req.header('cf-connecting-ip') ||
			c.req.header('host') ||
			'unknown-ip';

		try {
			await limiter.consume(key);
			await next();
		} catch (_err: unknown) {
			const err = _err as RateLimiterRes;

			return c.json(
				{
					success: false,
					message: 'Too many requests. Please wait and try again.',
					retryAfter: err.msBeforeNext / 1000,
				},
				429,
			);
		}
	};
};
