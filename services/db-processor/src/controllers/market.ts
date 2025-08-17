import { logger } from '@/utils/logger';
import { prisma } from '@probo/database';

export const updateTradersCount = async (data: any) => {
	try {
		console.log(data);
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

export const updateStockPrice = async (data: any) => {
	try {
		console.log('data is', data);
		await prisma.market.update({
			where: {
				id: data.marketId,
			},
			data: {
				yesPrice: data.yesPrice,
				NoPrice: data.noPrice,
			},
		});
	} catch (error) {
		logger.error(
			{
				alert: true,
				context: 'STOCK_PRICE_DB_UPDATE_FAIL',
				error,
				data,
			},
			'Failed to update database for stock price',
		);
		throw error;
	}
};
