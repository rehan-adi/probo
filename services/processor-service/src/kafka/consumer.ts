import { consumer } from './client';
import { logger } from '@/utils/logger';
import { processToDB } from '@/processor/processor';
import { produceToRetryTopic } from './retryProducer';

export const dbConsumer = async () => {
	await consumer.connect();
	await consumer.subscribe({ topics: ['process_db', 'process_db_retry'], fromBeginning: true });

	await consumer.run({
		autoCommit: false,
		eachMessage: async ({ topic, partition, message }) => {
			if (!message.value) return;

			const rawValue = message.value.toString();
			const event = JSON.parse(rawValue);

			const eventType: string = event.type;
			const eventData: any = event.data;

			try {
				await processToDB(eventType, eventData);
				await consumer.commitOffsets([
					{ topic, partition, offset: (Number(message.offset) + 1).toString() },
				]);
			} catch (error) {
				logger.error({ error, eventType, eventData }, 'DB update failed, sending to retry topic');
				await produceToRetryTopic({ type: eventType, data: eventData });

				await consumer.commitOffsets([
					{ topic, partition, offset: (Number(message.offset) + 1).toString() },
				]);
			}
		},
	});

	process.on('SIGINT', async () => {
		await consumer.disconnect();
		logger.info('consumer disconnect');
		process.exit();
	});
};
