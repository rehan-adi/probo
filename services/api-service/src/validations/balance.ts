import { z } from 'zod';

export const balanceSchema = z.object({
	amount: z.coerce
		.number()
		.positive({ message: 'Amount must be greater than 0' })
		.refine((val) => /^\d+(\.\d{1,2})?$/.test(val.toString()), {
			message: 'Amount must have up to 2 decimal places',
		}),
});
