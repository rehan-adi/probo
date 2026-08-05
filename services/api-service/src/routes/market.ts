import { Hono } from 'hono';
import { authorization } from '@/middlewares/authorization';
import {
	createMarket,
	addLiquidity,
	getAllMarket,
	getMarketDetails,
	getMarketsByCategory,
	resolveMarket,
	searchMarkets,
	getMarketKlines,
	getMarketTrades,
	getMarketStats,
} from '@/controllers/market';

export const marketRoutes = new Hono();

marketRoutes.get('/', getAllMarket);
marketRoutes.get('/category/:categoryParam', getMarketsByCategory);
marketRoutes.post('/create', authorization, createMarket);
marketRoutes.post('/liquidity-add', authorization, addLiquidity);
marketRoutes.post('/resolve', authorization, resolveMarket);

marketRoutes.get('/search', searchMarkets);
marketRoutes.get('/:symbol', getMarketDetails);
marketRoutes.get('/:symbol/klines', getMarketKlines);
marketRoutes.get('/:symbol/trades', getMarketTrades);
marketRoutes.get('/:symbol/stats', getMarketStats);
