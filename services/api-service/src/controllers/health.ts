import { Context } from 'hono';

export const healthCheck = (c: Context) => {
	return c.json(
		{
			success: true,
			message: 'api server is healthy',
		},
		200,
	);
};
