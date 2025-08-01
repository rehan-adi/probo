import { Hono } from 'hono';
import { getBalance } from '@/controllers/balance';
import { authorization } from '@/middlewares/authorization';

export const balanceRoutes = new Hono();

balanceRoutes.get('/get', authorization, getBalance);
