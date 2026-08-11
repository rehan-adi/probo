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
	const endpoint = action.toLowerCase() === 'sell' ? '/order/sell' : '/order/buy';
	return api.post(endpoint, { side, symbol, action, price, orderType, quantity, marketId });
};

export const cancelOrder = (orderId: string, marketId: string) => {
	return api.post('/order/cancel', { orderId, marketId });
};
