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

export const pushToQueue = async (eventType: string, data: any) => {
	const responseId = uuid();
	const responseChannel = `engine:response:${responseId}`;

	try {
		const payload = {
			responseId,
			eventType,
			data,
		};

		await pubsubClient.subscribe(responseChannel);

		await client.lpush('engine:queue', JSON.stringify(payload));

		logger.info('Event pushed to queue:', payload.eventType);

		const result = await new Promise((resolve) => {
			const timeout = setTimeout(async () => {
				await pubsubClient.unsubscribe(responseChannel);
				resolve({
					success: false,
					message: 'Timeout waiting for engine response',
					data: null,
				});
			}, 30000);

			pubsubClient.once('message', async (channel, message) => {
				if (channel === responseChannel) {
					clearTimeout(timeout);
					await pubsubClient.unsubscribe(responseChannel);
					resolve({
						success: true,
						message: JSON.parse(message),
					});
				}
			});
		});

		return result;
	} catch (error) {
		logger.error(`Failed to push to queue for event: ${eventType}. Error: ${error}`);
		return {
			success: false,
			data: null,
			error: error instanceof Error ? error.message : String(error),
		};
	}
};
