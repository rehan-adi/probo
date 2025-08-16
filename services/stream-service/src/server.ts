import { ENV } from '@/config/env';
import { httpServer } from './app';
import { logger } from './utils/logger';
import { startStreamSubscriber } from './lib/redis';

async function startStreamService() {
	try {
		await startStreamSubscriber();

		httpServer.listen(ENV.PORT, () => {
			logger.info(`Stream service running on port ${ENV.PORT}`);
		});
	} catch (err) {
		logger.error('Failed to start stream service: ' + err);
		process.exit(1);
	}
}

startStreamService();
