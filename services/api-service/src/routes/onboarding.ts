import { Hono } from 'hono';
import { authorization } from '@/middlewares/authorization';
import { checkUsername, updateUsername, updatePreferences } from '@/controllers/onboarding';

export const onboardingRoutes = new Hono();

onboardingRoutes.use('/*', authorization);

onboardingRoutes.get('/username/check', checkUsername);
onboardingRoutes.post('/username', updateUsername);

onboardingRoutes.post('/preferences', updatePreferences);
