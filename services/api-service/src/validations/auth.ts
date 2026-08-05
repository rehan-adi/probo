import z from 'zod';

export const sendEmailOtpSchema = z.object({
	email: z.string().email({ message: 'Invalid email address' }),
});

export const verifyEmailOtpSchema = z.object({
	email: z.string().email({ message: 'Invalid email address' }),
	otp: z.string().regex(/^\d{6}$/, { message: 'OTP must be a 6-digit number' }),
});

export const verifyGoogleSchema = z.object({
	idToken: z.string().min(1, 'Token is required'),
});

export const verifyDiscordSchema = z.object({
	accessToken: z.string().min(1, 'Discord Access Token is required'),
});

export const verifyTelegramSchema = z.object({
	initData: z.string().optional(),
	widgetData: z.any().optional(),
}).refine(data => data.initData || data.widgetData, {
	message: 'Either initData or widgetData is required'
});
