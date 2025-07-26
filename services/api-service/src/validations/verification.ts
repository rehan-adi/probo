import { z } from 'zod';

const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
const dobRegex = /^\d{4}-\d{2}-\d{2}$/;

export const kycVerificationSchema = z.object({
	panName: z
		.string()
		.trim()
		.min(3, { message: 'PAN name must be at least 3 characters long' })
		.max(100, { message: 'PAN name must be under 100 characters' }),

	panNumber: z
		.string()
		.trim()
		.toUpperCase()
		.regex(panRegex, { message: 'Invalid PAN number format (e.g., ABCDE1234F)' }),

	DOB: z
		.string()
		.trim()
		.regex(dobRegex, { message: 'DOB must be in YYYY-MM-DD format' })
		.refine(
			(dateStr) => {
				const date = new Date(dateStr);
				return !isNaN(date.getTime());
			},
			{ message: 'Invalid date of birth' },
		),
});

export const paymentVerificationSchema = z
	.object({
		upiId: z.string().optional(),
		bankAccountNumber: z.string().optional(),
		ifscCode: z.string().optional(),
	})
	.refine(
		(data) => {
			if (data.bankAccountNumber && data.ifscCode) return true;

			// UPI: only upiId is present
			if (data.upiId) return true;

			// Invalid if none match
			return false;
		},
		{
			message: 'Provide either upiId or both bankAccountNumber and ifscCode.',
		},
	);
