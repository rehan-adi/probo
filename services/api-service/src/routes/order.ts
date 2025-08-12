import { Hono } from 'hono';
import { placeOrder } from '@/controllers/order';
import { authorization } from '@/middlewares/authorization';

export const orderRoutes = new Hono();

orderRoutes.post('/place', authorization, placeOrder);
