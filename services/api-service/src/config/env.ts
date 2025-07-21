const checkEnv = (key: string) => {
	const value = Bun.env[key];

	if (!value) {
		throw new Error(`❌ Missing required environment variable: ${key}`);
	}
	return value;
};

export const ENV = {
	PORT: checkEnv('PORT'),
};
