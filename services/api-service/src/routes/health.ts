import { Hono } from 'hono';
import { healthCheck } from '@/controllers/health';

export const healthRoutes = new Hono();

healthRoutes.get('/', healthCheck);
