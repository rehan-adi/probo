import { Context } from 'hono';
import { logger } from '@/utils/logger';
import { EVENTS } from '@/constants/constants';
import { pushToQueue } from '@/lib/redis/queue';

/**
 * Get user's balance from engine
 * @param c Hono context
 * @returns Json response with user balance
 */
export const getBalance = async (c: Context) => {
	try {
		const userId = c.get('user').id;

		if (!userId) {
			logger.warn(
				{
					context: 'GET_BALANCE_UNAUTHORIZED',
				},
				'Unauthorized access attempt to getBalance',
			);
			return c.json(
				{
					success: false,
					error: 'Unauthorized',
				},
				401,
			);
		}

		const response = await pushToQueue(EVENTS.GET_BALANCE, { userId });

		if (!response.success) {
			logger.error(
				{
					alert: true,
					userId,
					context: 'GET_BALANCE_ENGINE_FAIL',
				},
				'Failed to fetch balance from engine',
			);
			return c.json(
				{
					success: false,
					message: response.message,
					error: response.error,
				},
				500,
			);
		}

		logger.info({ userId, response }, 'Balance get from engine ');

		return c.json(
			{
				success: true,
				message: response.message,
				data: response.data,
			},
			200,
		);
	} catch (error) {
		logger.error(
			{
				alert: true,
				context: 'GET_BALANCE_CONTROLLER_FAIL',
				error,
			},
			'Unhandled error in getBalance controller',
		);
		return c.json(
			{
				success: false,
				error: 'Internal server error',
			},
			500,
		);
	}
};
