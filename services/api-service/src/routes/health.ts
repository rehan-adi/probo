import { Hono } from 'hono';
import { healthCheck } from '@/controllers/health';

/**
 * Health check route
 *
 * GET /api/v1/health/ -> check server health
 */

export const healthRoutes = new Hono();

healthRoutes.get('/', healthCheck);
