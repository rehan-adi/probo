import { logger } from '@/utils/logger';
import { prisma } from '@probo/database';

export const updateTradersCount = async (data: any) => {
	try {
		await prisma.market.update({
			where: {
				id: data.marketId,
			},
			data: {
				numberOfTraders: {
					increment: 1,
				},
			},
		});
	} catch (error) {
		logger.error(
			{
				alert: true,
				context: 'TRADERS_COUNT_DB_UPDATE_FAIL',
				error,
				data,
			},
			'Failed to update database for traders count',
		);
		throw error;
	}
};
