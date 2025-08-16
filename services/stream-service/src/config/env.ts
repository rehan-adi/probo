export const ENV = {
	PORT: Bun.env.PORT,
	REDIS_DB: Bun.env.REDIS_DB,
	REDIS_HOST: Bun.env.REDIS_HOST,
	REDIS_PORT: Bun.env.REDIS_PORT,
} as const;
