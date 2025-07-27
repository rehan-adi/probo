import { logger } from '@/utils/logger';

const checkEnv = (key: string) => {
	const value = Bun.env[key];

	if (!value) {
		logger.error(`❌ Missing required environment variable: ${key}`);
		throw new Error(`❌ Missing required environment variable: ${key}`);
	}
	return value;
};

export const ENV = {
	PORT: checkEnv('PORT'),

	JWT_SECRET: checkEnv('JWT_SECRET'),

	REDIS_HOST: checkEnv('REDIS_HOST'),
	REDIS_PORT: checkEnv('REDIS_PORT'),

	REDIS_PUBSUB_HOST: checkEnv('REDIS_PUBSUB_HOST'),
	REDIS_PUBSUB_PORT: checkEnv('REDIS_PUBSUB_PORT'),

	TWILIO_SID: checkEnv('TWILIO_SID'),
	TWILIO_TOKEN: checkEnv('TWILIO_TOKEN'),
	TWILIO_NUMBER: checkEnv('TWILIO_NUMBER'),
};
