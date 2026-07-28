import { Context } from 'hono';
import { logger } from '@/utils/logger';
import { prisma } from '@probo/database';

export const getPortfolio = async (c: Context) => {
	try {
		const user = c.get('user');

		if (!user) {
			return c.json({ success: false, message: 'Unauthorized' }, 401);
		}

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

		const recentActivity = await prisma.order.findMany({
			where: { userId: user.id },
			include: {
				market: {
					select: {
						id: true,
						title: true,
						symbol: true,
						thumbnail: true,
					},
				},
			},
			orderBy: { createdAt: 'desc' },
			take: 50,
		});

		return c.json({
			success: true,
			data: {
				stockBalances,
				activeOrders,
				recentActivity,
			},
		});
	} catch (error: any) {
		logger.error({ context: 'GET_PORTFOLIO', message: error.message });
		return c.json({ success: false, message: 'Internal server error' }, 500);
	}
};
