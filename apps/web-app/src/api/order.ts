import { api } from '@/lib/axios';

export const placeOrder = (
	side: string,
	symbol: string,
	action: string,
	price: number,
	orderType: string,
	quantity: number,
	marketId: string,
) => {
	return api.post('/order/buy', { side, symbol, action, price, orderType, quantity, marketId });
};
