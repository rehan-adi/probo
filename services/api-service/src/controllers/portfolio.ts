import { Context } from 'hono';
import { prisma } from '@probo/database';
import { logger } from '@/utils/logger';

export const getPortfolio = async (c: Context) => {
	try {
		const user = c.get('user');
		if (!user) {
			return c.json({ success: false, message: 'Unauthorized' }, 401);
		}

		// Fetch stock balances
		const stockBalances = await prisma.stockBalance.findMany({
			where: { userId: user.id },
			include: {
				market: {
					select: {
						id: true,
						title: true,
						symbol: true,
						thumbnail: true,
						status: true,
						result: true,
					},
				},
			},
		});

		// Fetch active orders (PENDING or PARTIAL)
		const activeOrders = await prisma.order.findMany({
			where: { 
				userId: user.id,
				status: { in: ['PENDING', 'PARTIAL'] },
			},
			include: {
				market: {
					select: {
						id: true,
						title: true,
						symbol: true,
					},
				},
			},
			orderBy: { createdAt: 'desc' },
		});

		return c.json({
			success: true,
			data: {
				stockBalances,
				activeOrders,
			},
		});
	} catch (error: any) {
		logger.error({ context: 'GET_PORTFOLIO', message: error.message });
		return c.json({ success: false, message: 'Internal server error' }, 500);
	}
};
