import { Hono } from 'hono';
import { getProfile, updateProfile } from '@/controllers/profile';
import { isAuth } from '@/middlewares/authorization';

export const profileRoutes = new Hono();

profileRoutes.get('/get', isAuth, getProfile);
profileRoutes.patch('/update', isAuth, updateProfile);
