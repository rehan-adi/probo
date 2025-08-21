import { api } from '@/lib/axios';

export const placeOrder = (
	side: string,
	symbol: string,
	actio: string,
	price: number,
	orderType: string,
	quantity: number,
	marketId: string,
) => {
	return api.post('/order/place', { side, symbol, actio, price, orderType, quantity, marketId });
};
