import Redis from 'ioredis';
import { ENV } from '@/config/env';
import { logger } from '@/utils/logger';

/**
 * General Redis client for cache, rate-limit, queue push.
 * Non-blocking operations only.
 */

export const client = new Redis({
	host: ENV.REDIS_HOST,
	port: Number(ENV.REDIS_PORT),
	db: 0,
});

client.on('connect', () => {
	logger.info('Connected to Redis client');
});

client.on('error', () => {
	logger.error('Failed to connect to Redis client');
});

/**
 * Pub/Sub dedicated client (used only for `.subscribe()`).
 */

export const pubsubClient = new Redis({
	host: ENV.REDIS_PUBSUB_HOST,
	port: Number(ENV.REDIS_PUBSUB_PORT),
	db: 0,
});

pubsubClient.on('connect', () => {
	logger.info('PubSub client is connected');
});

pubsubClient.on('error', () => {
	logger.error('PubSub client connection failed');
});
