import { Hono } from 'hono';
import { getPortfolio, getMarketPosition } from '@/controllers/portfolio';
import { authorization } from '@/middlewares/authorization';

export const portfolioRoutes = new Hono();

portfolioRoutes.get('/', authorization, getPortfolio);
portfolioRoutes.get('/position/:marketId', authorization, getMarketPosition);
