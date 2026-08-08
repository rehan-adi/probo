import { Hono } from 'hono';
import { authorization } from '@/middlewares/authorization';
import { getSettings, updateProfile, updateNotifications, deleteAccount } from '../controllers/settings';

export const settingsRoutes = new Hono();

settingsRoutes.use('/*', authorization);

settingsRoutes.get('/', getSettings);
settingsRoutes.put('/profile', updateProfile);
settingsRoutes.put('/notifications', updateNotifications);
settingsRoutes.delete('/account', deleteAccount);