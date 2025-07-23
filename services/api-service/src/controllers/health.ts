import { Context } from 'hono';

/**
 * Health check endpoint for the API server.
 * @param c - Hono Context
 * @returns JSON response for API health
 */

export const healthCheck = (c: Context) => {
	return c.json(
		{
			success: true,
			status: 'ok',
			message: 'api server is healthy',
			timestamp: new Date().toISOString(),
		},
		200,
	);
};
