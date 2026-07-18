import { Hono } from 'hono';
import { getProfile, updateProfile, addToWatchlist, removeFromWatchlist, getWatchlist } from '@/controllers/profile';
import { authorization } from '@/middlewares/authorization';

export const profileRoutes = new Hono();

profileRoutes.get('/get', authorization, getProfile);
profileRoutes.patch('/update', authorization, updateProfile);

profileRoutes.post('/watchlist', authorization, addToWatchlist);
profileRoutes.delete('/watchlist/:marketId', authorization, removeFromWatchlist);
profileRoutes.get('/watchlist', authorization, getWatchlist);
