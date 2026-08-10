import { z } from 'zod';

export const KafkaMessageSchema = z.object({
	type: z.string(),
	data: z.any(),
});
