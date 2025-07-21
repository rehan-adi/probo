import pino from 'pino';

const isDev = Bun.env.NODE_ENV !== 'production';

export const createLogger = (serviceName: string) => {
	const transport = isDev
		? {
				target: 'pino-pretty',
				options: {
					colorize: true,
					translateTime: 'yyyy-mm-dd HH:MM:ss.l',
					ignore: 'pid,hostname',
					messageFormat: `[${serviceName}] {msg}`,
				},
			}
		: undefined;

	const pinoLogger = pino(
		{
			level: process.env.LOG_LEVEL || 'info',
			base: {
				service: serviceName,
			},
			...(isDev && { transport }),
		},
		pino.destination(1),
	);

	return {
		info: pinoLogger.info.bind(pinoLogger),
		warn: pinoLogger.warn.bind(pinoLogger),
		error: pinoLogger.error.bind(pinoLogger),
		debug: pinoLogger.debug.bind(pinoLogger),
		child: pinoLogger.child.bind(pinoLogger),
	};
};
