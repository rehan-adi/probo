import { z } from 'zod';

export const createMarketSchema = z
	.object({
		title: z
			.string()
			.min(3, { message: 'Title must be at least 3 characters' })
			.max(100, { message: 'Title must be under 100 characters' }),
		description: z
			.string()
			.max(2000, { message: 'Description must be under 2000 characters' })
			.optional(),
		startTime: z.coerce.date(),
		endTime: z.coerce.date(),
		thumbnail: z.union([z.url(), z.literal('')]).optional(),
		categoryId: z.string().min(1, { message: 'Category ID is required' }),
		sourceOfTruth: z
			.string()
			.max(300, { message: 'Source must be under 300 characters' })
			.optional(),
	})
	.refine((data) => data.endTime > data.startTime, {
		message: 'End time must be after start time',
		path: ['endTime'],
	});
