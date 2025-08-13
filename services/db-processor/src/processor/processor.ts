import { DB_EVENTS } from '@/constants/constants';
import { updateTradersCount } from '@/controllers/market';

export const processToDB = async (eventType: string, data: any) => {
	switch (eventType) {
		case DB_EVENTS.INCREASE_TRADERS_COUNT:
			await updateTradersCount(data);
			break;

		default:
			throw new Error(`Unknown event type: ${eventType}`);
	}
};
