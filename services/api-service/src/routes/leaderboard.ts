import { Hono } from 'hono';
import { getLeaderboard } from '@/controllers/leaderboard';
import { optionalAuthorization } from '@/middlewares/optionalAuthorization';

export const leaderboardRoutes = new Hono();

leaderboardRoutes.get('/', optionalAuthorization, getLeaderboard);
