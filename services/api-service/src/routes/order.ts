import { Hono } from 'hono';
import { buy, sell } from '@/controllers/order';
import { authorization } from '@/middlewares/authorization';

export const orderRoutes = new Hono();

orderRoutes.post('/buy', authorization, buy);
orderRoutes.post('/sell', authorization, sell);
