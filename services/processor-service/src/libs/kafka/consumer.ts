import { consumer } from './client';
import { logger } from '@/libs/logger';
import { processToDB } from '@/processor/processor';
import { produceToRetryTopic } from './retryProducer';
import { KafkaMessageSchema } from '@/schemas/kafka';

export const dbConsumer = async () => {
	await consumer.connect();
	await consumer.subscribe({ topics: ['process_db', 'process_db_retry'], fromBeginning: true });

	await consumer.run({
		autoCommit: false,
		eachMessage: async ({ topic, partition, message }) => {
			if (!message.value) return;

			const rawValue = message.value.toString();

			try {
				const event = JSON.parse(rawValue);
				const parsedEvent = KafkaMessageSchema.parse(event);

				const eventType: string = parsedEvent.type;
				const eventData: any = parsedEvent.data;

				await processToDB(eventType, eventData);

				await consumer.commitOffsets([
					{ topic, partition, offset: (Number(message.offset) + 1).toString() },
				]);
			} catch (error) {
				logger.error(
					{ error, rawValue },
					'DB update failed or validation error, sending to retry topic',
				);

				let retryPayload = rawValue;
				try {
					retryPayload = JSON.parse(rawValue);
				} catch (e) {}

				await produceToRetryTopic(retryPayload);

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
