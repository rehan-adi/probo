import z from 'zod';

/**
 * Auth Validation Schemas
 *
 * - loginSchema: Validates user phone number for login/signup
 * - verifyOtpSchema: Validates phone number and OTP for verification
 */

export const loginSchema = z.object({
	phone: z.string().regex(/^[6-9]\d{9}$/, { message: 'Invalid phone number' }),
});

export const verifyOtpSchema = z.object({
	phone: z.string().regex(/^[6-9]\d{9}$/, { message: 'Invalid phone number' }),
	otp: z.string().regex(/^\d{6}$/, { message: 'OTP must be a 6-digit number' }),
});
