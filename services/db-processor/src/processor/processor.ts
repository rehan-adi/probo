import { DB_EVENTS } from '@/constants/constants';
import { recordActivity, recordOrderPlaced, updateMarketTimeline, updateStockPrice, updateTradersCount } from '@/controllers/market';

export const processToDB = async (eventType: string, data: any) => {
	switch (eventType) {
		case DB_EVENTS.INCREASE_TRADERS_COUNT:
			await updateTradersCount(data);
			break;

		case DB_EVENTS.UPDATE_STOCK_PRICE:
			await updateStockPrice(data);
			break;

		case DB_EVENTS.UPDATE_MARKET_TIMELINE:
			await updateMarketTimeline(data);
			break;

		case DB_EVENTS.RECORD_ACTIVITY:
			await recordActivity(data);
			break;

		case DB_EVENTS.ORDER_PLACED:
			await recordOrderPlaced(data);
			break;

		default:
			throw new Error(`Unknown event type: ${eventType}`);
	}
};
