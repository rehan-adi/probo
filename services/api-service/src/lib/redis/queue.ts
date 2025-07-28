import { v4 as uuid } from 'uuid';
import { logger } from '@/utils/logger';
import { client, pubsubClient } from '@/lib/redis/connection';

/**
 * Pushes an event payload to the Redis queue and waits for a response.
 *
 * @param eventType - The type of event being pushed (e.g., "ADD_BALANCE")
 * @param data - The payload data to send with the event
 * @returns The response from the engine if successful, or an error object
 */

type EngineResponse = {
	success: boolean;
	message: string;
	data?: any;
	error?: string;
	retryable?: boolean;
};

export const pushToQueue = async (eventType: string, data: any): Promise<EngineResponse> => {
	const responseId = uuid();
	const responseChannel = `engine:response:${responseId}`;

	const payload = {
		responseId,
		eventType,
		data,
	};

	return new Promise<EngineResponse>(async (resolve) => {
		let handled = false;

		logger.info({ responseId }, 'Waiting for engine response');

		const messageHandler = async (channel: string, message: string) => {
			if (channel === responseChannel) {
				logger.info({ responseId, message }, '✅ Received engine response');

				handled = true;
				clearTimeout(timeout);
				await pubsubClient.unsubscribe(responseChannel);
				pubsubClient.removeListener('message', messageHandler);

				try {
					const parsed = JSON.parse(message);

					const status = parsed.status ?? parsed.Status;
					const messageText = parsed.message ?? parsed.Message;
					const retryable = parsed.retryable ?? parsed.Retryable;
					const data = parsed.data ?? parsed.Data;

					resolve({
						success: status === 'success',
						message: messageText || '',
						data: data ?? null,
						error: status === 'error' ? messageText : undefined,
						retryable: retryable ?? true,
					});
				} catch (err) {
					resolve({
						success: false,
						message: 'Invalid JSON from engine',
						error: 'Parse error',
					});
				}
			}
		};

		pubsubClient.on('message', messageHandler);

		await pubsubClient.subscribe(responseChannel);

		await client.lpush('engine:queue', JSON.stringify(payload));
		logger.info({ payload }, 'Pushed payload to engine queue');

		const timeout = setTimeout(async () => {
			if (!handled) {
				logger.warn({ responseChannel }, '⏰ Timeout waiting for engine response');
				await pubsubClient.unsubscribe(responseChannel);
				pubsubClient.removeListener('message', messageHandler);
				resolve({
					success: false,
					message: 'Timeout waiting for engine response',
					retryable: true,
				});
			}
		}, 5000);
	});
};
