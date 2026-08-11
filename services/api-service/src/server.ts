import app from '@/app';
import { ENV } from '@/config/env';
import { logger } from '@/libs/logger';

Bun.serve({
	fetch: app.fetch,
	port: ENV.PORT,
});

logger.info(`API service is running at http://localhost:${ENV.PORT}`);
