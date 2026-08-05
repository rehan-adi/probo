import Redis from 'ioredis';
import { logger } from './logger.js';

export const redisPublisher = new Redis({
	host: process.env.REDIS_HOST || 'localhost',
	port: Number(process.env.REDIS_PORT) || 6379,
});

redisPublisher.on('connect', () => {
	logger.info('Processor connected to Redis Pub/Sub');
});

redisPublisher.on('error', (err) => {
	logger.error('Failed to connect to Redis', err);
});
