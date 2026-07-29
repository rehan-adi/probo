import { DB_EVENTS } from '@/constants/constants';
import {
	recordTradeExecution,
	recordOrderPlaced,
	updateStockPrice,
	updateTradersCount,
	handleOrderCancelled,
	handleMarketResolved,
} from '@/controllers/market';

export const processToDB = async (eventType: string, data: any) => {
	switch (eventType) {
		case DB_EVENTS.INCREASE_TRADERS_COUNT:
			await updateTradersCount(data);
			break;

		case DB_EVENTS.UPDATE_STOCK_PRICE:
			await updateStockPrice(data);
			break;


		case DB_EVENTS.TRADE_EXECUTED:
			await recordTradeExecution(data);
			break;

		case DB_EVENTS.ORDER_PLACED:
			await recordOrderPlaced(data);
			break;

		case DB_EVENTS.ORDER_CANCELLED:
			await handleOrderCancelled(data);
			break;

		case DB_EVENTS.MARKET_RESOLVED:
			await handleMarketResolved(data);
			break;

		default:
			throw new Error(`Unknown event type: ${eventType}`);
	}
};
