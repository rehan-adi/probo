import { v4 as uuid } from 'uuid';
import { logger } from '@/utils/logger';
import { queueClient } from '@/lib/redis/connection';

/**
 * Pushes an event payload to the Redis queue and waits for a response.
 *
 * @param eventType - The type of event being pushed (e.g., "ADD_BALANCE")
 * @param data - The payload data to send with the event
 * @returns The response from the engine if successful, or an error object
 */

export const pushToQueue = async (eventType: string, data: any) => {
	const respId = uuid();
	const response_queue = `engine:response:queue:${respId}`;

	try {
		const payload = {
			respId,
			eventType,
			data,
		};

		await queueClient.lpush('engine:queue', JSON.stringify(payload));

		logger.info('Event pushed to queue. Event type:', payload.eventType);

		const result = await queueClient.brpop(response_queue, 30);

		if (!result) {
			logger.warn(`Response timeout for event: ${eventType}, respId: ${respId}`);
			return {
				success: false,
				message: 'response timeout',
				data: null,
			};
		}

		const [, message] = result;
		const parsed = JSON.parse(message);

		return {
			success: true,
			message: parsed,
		};
	} catch (error) {
		logger.error(`Failed to push to queue for event: ${eventType}. Error: ${error}`);
		return {
			success: false,
			data: null,
			error: error instanceof Error ? error.message : String(error),
		};
	}
};
