import { Context } from 'hono';
import { logger } from '@/utils/logger';
import { prisma } from '@probo/database';
import { EVENTS } from '@/constants/constants';
import { pushToQueue } from '@/lib/redis/queue';
import { balanceSchema } from '@/validations/balance';

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

/**
 * Deposite or Onramp balance to user wallet
 * @param c Hono context
 * @returns Json esponse
 */

export const deposit = async (c: Context) => {
	try {
		const userId = c.get('user').id;

		if (!userId) {
			logger.warn(
				{
					context: 'DEPOSIT_UNAUTHORIZED',
				},
				'Unauthorized access attempt to deposit',
			);
			return c.json(
				{
					success: false,
					error: 'Unauthorized',
				},
				401,
			);
		}

		const user = await prisma.user.findUnique({
			where: {
				id: userId,
			},
		});

		if (!user) {
			logger.warn(
				{
					context: 'DEPOSIT_USER_NOT_FOUND',
					userId,
				},
				'User not found in database',
			);
			return c.json(
				{
					success: false,
					message: 'User not found',
				},
				404,
			);
		}

		const data = await c.req.json<{ amount: string }>();

		const validateData = balanceSchema.safeParse(data);

		if (!validateData.success) {
			logger.warn(
				{
					context: 'DEPOSIT_VALIDATION_FAILED',
					error: validateData.error.issues,
				},
				'Invalid amount input during deposit',
			);
			return c.json(
				{
					success: false,
					message: 'Validation failed',
					error: validateData.error.issues,
				},
				400,
			);
		}

		try {
			await prisma.$transaction(async (tx) => {
				await tx.inrBalance.update({
					where: { userId },
					data: {
						balance: {
							increment: validateData.data.amount,
						},
					},
				});

				await tx.transactionHistory.create({
					data: {
						userId: userId,
						type: 'DEPOSIT',
						status: 'SUCCESS',
						amount: validateData.data.amount,
					},
				});
			});

			logger.info({ userId }, 'Deposit DB transaction succeeded');
		} catch (error) {
			logger.error(
				{
					alert: true,
					context: 'DEPOSIT_TX_FAIL',
					error,
					userId,
				},
				'Database transaction failed',
			);
			return c.json(
				{
					success: false,
					message: 'Failed to process deposit',
				},
				500,
			);
		}

		let response = await pushToQueue(EVENTS.DEPOSIT_BALANCE, {
			userId: userId,
			amount: validateData.data.amount,
		});

		if (!response.success && response.retryable) {
			for (let i = 0; i < 3; i++) {
				response = await pushToQueue(EVENTS.DEPOSIT_BALANCE, {
					userId: userId,
					amount: validateData.data.amount,
				});
				if (response.success) {
					logger.info({ attempt: i + 1, userId }, 'Engine sync succeeded on retry');
					break;
				}
			}
		}

		if (response.success) {
			logger.info({ userId }, 'Engine sync done');
		} else {
			logger.warn({ userId, alert: true }, 'Engine sync failed after retries');
		}

		return c.json(
			{
				success: true,
				message: 'Deposit completed successfully',
			},
			200,
		);
	} catch (error) {
		logger.error(
			{
				alert: true,
				context: 'DEPOSIT_CONTROLLER_FAIL',
				error,
			},
			'Unhandled error in deposit controller',
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

export const getDepositAmount = async (c: Context) => {
	try {
		const userId = c.get('user').id;

		if (!userId) {
			logger.warn(
				{
					context: 'GET_DEPOSIT_AMOUNT_UNAUTHORIZED',
				},
				'Unauthorized access attempt to getDepositAmount',
			);
			return c.json(
				{
					success: false,
					error: 'Unauthorized',
				},
				401,
			);
		}

		const user = await prisma.user.findUnique({
			where: {
				id: userId,
			},
		});

		if (!user) {
			logger.warn(
				{
					context: 'GET_DEPOSIT_AMOUNT_USER_NOT_FOUND',
					userId,
				},
				'User not found in database',
			);
			return c.json(
				{
					success: false,
					message: 'User not found',
				},
				404,
			);
		}

		const { _sum } = await prisma.transactionHistory.aggregate({
			_sum: {
				amount: true,
			},
			where: {
				userId,
				type: 'DEPOSIT',
				status: 'SUCCESS',
			},
		});

		const total = _sum.amount || 0;

		return c.json(
			{
				success: true,
				data: {
					totalDepositAmount: total,
				},
			},
			200,
		);
	} catch (error) {
		logger.error(
			{
				alert: true,
				context: 'GET_DEPOSIT_AMOUNT_CONTROLLER_FAIL',
				error,
			},
			'Unhandled error in getDepositAmount controller',
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
