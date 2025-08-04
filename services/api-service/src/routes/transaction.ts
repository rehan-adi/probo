import { Hono } from 'hono';
import { authorization } from '@/middlewares/authorization';
import { getTransactionHistory } from '@/controllers/transaction';

export const transactionRoutes = new Hono();

// for fetching all transaction history
transactionRoutes.get('/', authorization, getTransactionHistory);
