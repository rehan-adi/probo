import { io } from '@/app';
import Redis from 'ioredis';
import { ENV } from '@/config/env';
import { logger } from '@/utils/logger';

const redisSubscriber = new Redis({
	host: ENV.REDIS_HOST,
	port: Number(ENV.REDIS_PORT),
	db: Number(ENV.REDIS_DB),
});

redisSubscriber.on('connect', () => {
	logger.info('Connected to Redis');
});

redisSubscriber.on('error', () => {
	logger.error('Failed to connect to Redis');
});

export const startStreamSubscriber = async () => {
	await redisSubscriber.subscribe('stream:data', (err) => {
		if (err) {
			logger.error('Failed to subscribe to stream:data');
		}
	});

	redisSubscriber.on('message', (channel, message) => {
		try {
			const data = JSON.parse(message);

			if (data.symbol) {
				io.to(data.symbol).emit('MESSAGE', data);
			} else {
				logger.warn('Message missing symbol: ' + message);
			}
		} catch (e) {
			logger.error('Invalid message format from Redis: ' + message);
		}
	});
};
