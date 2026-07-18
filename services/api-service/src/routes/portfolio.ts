import { Hono } from 'hono';
import { getPortfolio } from '@/controllers/portfolio';
import { authorization } from '@/middlewares/authorization';

export const portfolioRoutes = new Hono();

portfolioRoutes.get('/get', authorization, getPortfolio);
