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

export const recordActivity = async (data: any) => {
	try {
		logger.info({ data }, 'RECORD_ACTIVITY received');
	} catch (error) {
		logger.error({ error, data, context: 'RECORD_ACTIVITY_FAIL' }, 'Failed to record activity');
		throw error;
	}
};

export const updateMarketTimeline = async (data: any) => {
	try {
		logger.info({ data }, 'UPDATE_MARKET_TIMELINE received');
	} catch (error) {
		logger.error({ error, data, context: 'UPDATE_MARKET_TIMELINE_FAIL' }, 'Failed to update timeline');
		throw error;
	}
};

export const recordOrderPlaced = async (data: any) => {
	try {
		logger.info({ data }, 'ORDER_PLACED received');
	} catch (error) {
		logger.error({ error, data, context: 'ORDER_PLACED_FAIL' }, 'Failed to record order placement');
		throw error;
	}
};
