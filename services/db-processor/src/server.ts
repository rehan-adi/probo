import { logger } from '@/utils/logger';
import { dbConsumer } from '@/kafka/consumer';
import { connectProducer, disconnectProducer } from '@/kafka/client';

async function startDBProcessor() {
	await connectProducer();
	logger.info('DB processor is running and ready to process');
	await dbConsumer();

	process.on('SIGINT', async () => {
		await disconnectProducer();
		process.exit(0);
	});
}

startDBProcessor();
