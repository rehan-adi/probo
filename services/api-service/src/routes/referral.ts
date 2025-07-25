import { Hono } from 'hono';
import { submitReferral } from '@/controllers/referral';
import { authorization } from '@/middlewares/authorization';

export const referralRoutes = new Hono();

referralRoutes.post('/submit', authorization, submitReferral);
