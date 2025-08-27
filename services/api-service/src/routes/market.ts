import { Hono } from 'hono';
import { authorization } from '@/middlewares/authorization';
import {
	createMarket,
	addLiquidity,
	getAllMarket,
	getMarketDetails,
	getMarketsByCategory,
} from '@/controllers/market';

export const marketRoutes = new Hono();

marketRoutes.get('/', getAllMarket);
marketRoutes.get('/category/:categoryId', getMarketsByCategory);
marketRoutes.post('/create', authorization, createMarket);
marketRoutes.post('/liquidity-add', authorization, addLiquidity);

marketRoutes.get('/:symbol', getMarketDetails);
