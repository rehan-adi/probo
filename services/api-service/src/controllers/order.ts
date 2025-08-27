import { Context } from 'hono';
import { logger } from '@/utils/logger';
import { EVENTS } from '@/constants/constants';
import { pushToQueue } from '@/lib/redis/queue';

/**
 * Buy order controller which push event to engine for Buy a yes or no stock
 * @param c Hono Context
 * @returns Json Response
 */

export const buy = async (c: Context) => {
	try {
		const userId = c.get('user').id;

		if (!userId) {
			logger.warn(
				{
					context: 'PLACE_ORDER_UNAUTHORIZED',
				},
				'Unauthorized access attempt to placeOrder',
			);
			return c.json(
				{
					success: false,
					error: 'Unauthorized',
				},
				401,
			);
		}

		const body = await c.req.json<{
			side: string;
			symbol: string;
			price: number;
			orderType: string;
			quantity: number;
			marketId: string;
		}>();

		const response = await pushToQueue(EVENTS.PLACE_ORDER, {
			userId: userId,
			marketId: body.marketId,
			side: body.side,
			symbol: body.symbol,
			price: Number(body.price),
			action: 'BUY',
			orderType: body.orderType,
			quantity: Number(body.quantity),
		});

		if (!response.success) {
			logger.error(
				{
					alert: true,
					context: 'PLACE_ORDER_FAIL',
					error: response.error,
				},
				'',
			);
			return c.json(
				{
					success: false,
					message: response.message,
					error: response.error,
				},
				502,
			);
		}

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
				contect: 'PLACE_ORDER_CONTROLLER_FAIL',
				error: error instanceof Error ? error.message : error,
				stack: error instanceof Error ? error.stack : undefined,
				userId: c.get('user')?.id,
			},
			'Unhandled error during place order',
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

/**
 * Sell controller which push event to engine for selling stock
 * @param c Hono Context
 * @returns Json Response
 */

export const sell = async (c: Context) => {
	try {
		const userId = c.get('user').id;

		if (!userId) {
			logger.warn(
				{
					context: 'SELL_ORDER_UNAUTHORIZED',
				},
				'Unauthorized access attempt to sellOrder',
			);
			return c.json(
				{
					success: false,
					error: 'Unauthorized',
				},
				401,
			);
		}

		const body = await c.req.json<{
			side: string;
			symbol: string;
			price: number;
			orderType: string;
			quantity: number;
			marketId: string;
		}>();

		const response = await pushToQueue(EVENTS.SELL_ORDER, {
			userId: userId,
			marketId: body.marketId,
			side: body.side,
			symbol: body.symbol,
			price: Number(body.price),
			action: 'SELL',
			orderType: body.orderType,
			quantity: Number(body.quantity),
		});

		if (!response.success) {
			logger.error(
				{
					alert: true,
					context: 'SELL_ORDER_FAIL',
					error: response.error,
				},
				'',
			);
			return c.json(
				{
					success: false,
					message: response.message,
					error: response.error,
				},
				502,
			);
		}

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
				contect: 'SELL_ORDER_CONTROLLER_FAIL',
				error: error instanceof Error ? error.message : error,
				stack: error instanceof Error ? error.stack : undefined,
				userId: c.get('user')?.id,
			},
			'Unhandled error during sell order',
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
