import { producer } from './client';

export const produceToRetryTopic = async (message: any) => {
	await producer.send({
		topic: 'process_db_retry',
		messages: [{ value: JSON.stringify(message) }],
	});
};
