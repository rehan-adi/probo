import { logger } from '@/utils/logger';
import { Context } from 'hono';
import { prisma } from '@probo/database';

export const getTransactionHistory = async (c: Context) => {
	try {
		const userId = c.get('user').id;

		if (!userId) {
			logger.warn(
				{
					context: 'GET_TRANSACTION_HISTORY_UNAUTHORIZED',
				},
				'Unauthorized access attempt to getTransactionHistory',
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
			return c.json(
				{
					success: false,
					message: 'User not found',
				},
				404,
			);
		}

		const allTransactionHistory = await prisma.transactionHistory.findMany({
			where: {
				userId,
			},
			select: {
				id: true,
				amount: true,
				type: true,
				status: true,
				remarks: true,
				createdAt: true,
			},
			orderBy: {
				createdAt: 'desc',
			},
		});

		return c.json(
			{
				success: true,
				message: '',
				data: allTransactionHistory,
			},
			200,
		);
	} catch (error) {
		logger.error(
			{
				alert: true,
				context: 'GET_TRANSACTION_HISTORY_FAIL',
				error,
			},
			'Unhandled error in getTransactionHistory controller',
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
