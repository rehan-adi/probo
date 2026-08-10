import { logger } from '@/libs/logger';
import { dbConsumer } from '@/libs/kafka/consumer';
import { connectProducer, disconnectProducer } from '@/libs/kafka/client';

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
