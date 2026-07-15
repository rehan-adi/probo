import { Hono } from 'hono';
import { getPortfolio } from '@/controllers/portfolio';
import { isAuth } from '@/middlewares/authorization';

export const portfolioRoutes = new Hono();

portfolioRoutes.get('/get', isAuth, getPortfolio);
