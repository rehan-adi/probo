import { httpServer, io } from './app';
import { logger } from './utils/logger';
import { startStreamSubscriber } from './lib/redis';

async function startStreamService() {
	try {
		await startStreamSubscriber();

		httpServer.listen(1000, () => {
			logger.info(`Stream service running on port ${1000}`);
		});
	} catch (err) {
		logger.error('Failed to start stream service: ' + err);
		process.exit(1);
	}
}

startStreamService();
