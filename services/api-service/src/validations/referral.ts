import { z } from 'zod';

export const referralCodeSchema = z.object({
	referralCode: z
		.string()
		.length(6, { message: 'Referral code must be exactly 6 characters long' }),
});
