import { Hono } from 'hono';
import { authorization } from '@/middlewares/authorization';
import { createMarket, getAllMarket, getMarketsByCategory } from '@/controllers/market';

export const marketRoutes = new Hono();

marketRoutes.get('/', getAllMarket);
marketRoutes.get('/:categoryId', getMarketsByCategory);
marketRoutes.post('/create', authorization, createMarket);
