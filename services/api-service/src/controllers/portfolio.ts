import { Context } from 'hono';
import { logger } from '@/libs/logger';
import { prisma } from '@probo/database';

export const getPortfolio = async (c: Context) => {
	try {
		const user = c.get('user');

		if (!user) {
			return c.json({ success: false, message: 'Unauthorized' }, 401);
		}

		const positions = await prisma.position.findMany({
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
						yesPrice: true,
						noPrice: true,
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
				positions,
				activeOrders,
				recentActivity,
			},
		});
	} catch (error: any) {
		logger.error({ context: 'GET_PORTFOLIO', message: error.message });
		return c.json({ success: false, message: 'Internal server error' }, 500);
	}
};
