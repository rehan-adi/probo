import app from '@/app';
import { ENV } from '@/config/env';
import { logger } from '@/utils/logger';

Bun.serve({
	fetch: app.fetch,
	port: ENV.PORT,
});

logger.info(`🚀 API service running → http://localhost:${ENV.PORT}`);
