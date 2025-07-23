import Redis from 'ioredis';
import { ENV } from '@/config/env';
import { logger } from '@/utils/logger';

/**
 * Redis client used for caching and rate limiting.
 * Uses database 0 for general cache and rate-limit storage.
 */

export const client = new Redis({
	host: ENV.REDIS_HOST,
	port: Number(ENV.REDIS_PORT),
	db: 0,
});

client.on('connect', () => {
	logger.info('connected to redis');
});

client.on('error', () => {
	logger.error('Failed to connect to redis');
});

/**
 * Redis client dedicated to queue operations.
 * Uses database 1 for storing job queues.
 */

export const queueClient = new Redis({
	host: ENV.REDIS_QUEUE_HOST,
	port: Number(ENV.REDIS_QUEUE_PORT),
	db: 1,
});

queueClient.on('connect', () => {
	logger.info('Queue client is connected');
});

queueClient.on('error', () => {
	logger.error('Queue client connection failed');
});
