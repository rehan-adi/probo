import { Hono } from 'hono';
import { createMarket } from '@/controllers/market';
import { authorization } from '@/middlewares/authorization';

export const marketRoutes = new Hono();

marketRoutes.post('/create', authorization, createMarket);
