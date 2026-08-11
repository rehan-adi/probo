import { Context } from 'hono';
import { logger } from '@/libs/logger';
import { EVENTS } from '@/config/constants';
import { pushToQueue } from '@/libs/redis/queue';
import { prisma } from '@probo/database';

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

		const order = await prisma.order.create({
			data: {
				userId: userId,
				marketId: body.marketId,
				stockSymbol: body.symbol,
				stockType: body.side === 'YES' ? 'YES' : 'NO',
				quantity: Number(body.quantity),
				price: Number(body.price),
				orderType: 'BUY',
				totalPrice: Number(body.price) * Number(body.quantity),
				status: 'PENDING',
			},
		});

		const response = await pushToQueue(EVENTS.PLACE_ORDER, {
			orderId: order.id,
			userId: userId,
			marketId: body.marketId,
			symbol: body.symbol,
			side: body.side,
			price: Number(body.price),
			action: 'BUY',
			orderType: body.orderType,
			quantity: Number(body.quantity),
		});

		if (!response.success) {
			await prisma.order.update({
				where: { id: order.id },
				data: { status: 'FAILED' },
			});
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

		const order = await prisma.order.create({
			data: {
				userId: userId,
				marketId: body.marketId,
				stockSymbol: body.symbol,
				stockType: body.side === 'YES' ? 'YES' : 'NO',
				quantity: Number(body.quantity),
				price: Number(body.price),
				orderType: 'SELL',
				totalPrice: Number(body.price) * Number(body.quantity),
				status: 'PENDING',
			},
		});

		const response = await pushToQueue(EVENTS.SELL_ORDER, {
			orderId: order.id,
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
			await prisma.order.update({
				where: { id: order.id },
				data: { status: 'FAILED' },
			});
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

export const cancel = async (c: Context) => {
	try {
		const userId = c.get('user').id;
		if (!userId) return c.json({ success: false, error: 'Unauthorized' }, 401);

		const body = await c.req.json<{ orderId: string; marketId: string }>();
		if (!body.orderId || !body.marketId) {
			return c.json({ success: false, error: 'Missing orderId or marketId' }, 400);
		}

		// Check if order exists
		const order = await prisma.order.findUnique({ where: { id: body.orderId } });
		if (!order || order.userId !== userId) {
			return c.json({ success: false, error: 'Order not found or unauthorized' }, 404);
		}

		const response = await pushToQueue('CANCEL_ORDER', {
			orderId: body.orderId,
			userId: userId,
			marketId: body.marketId,
			symbol: order.stockSymbol,
		});

		if (!response.success) {
			return c.json({ success: false, error: response.message }, 400);
		}

		return c.json({ success: true, message: 'Order cancelled successfully' });
	} catch (error) {
		return c.json({ success: false, error: 'Internal server error' }, 500);
	}
};
