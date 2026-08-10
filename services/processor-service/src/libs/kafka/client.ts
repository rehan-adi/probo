import { logger } from '@/libs/logger';
import { ENV } from '@/config/env';
import { Kafka, logLevel, Partitioners } from 'kafkajs';

export const kafkaClient = new Kafka({
	logLevel: logLevel.ERROR,
	brokers: [ENV.KAFKA_BROKERS],
	clientId: 'processor-service-consumer',
});

export const producer = kafkaClient.producer({
	createPartitioner: Partitioners.LegacyPartitioner,
});
export const consumer = kafkaClient.consumer({ groupId: 'group-1' });

export const connectProducer = async () => {
	logger.info('Producer is connected');
	await producer.connect();
};

export const disconnectProducer = async () => {
	await producer.disconnect();
};
