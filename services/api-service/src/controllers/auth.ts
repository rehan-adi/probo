import crypto from 'crypto';
import { Context } from 'hono';
import { logger } from '@/utils/logger';
import { prisma } from '@probo/database';
import { sendOtp } from '@/lib/twilio/otp';
import { EVENTS } from '@/constants/constants';
import { client } from '@/lib/redis/connection';
import { pushToQueue } from '@/lib/redis/queue';
import { generateJwtToken } from '@/utils/token';
import { deleteCookie, setCookie } from 'hono/cookie';
import { loginSchema, verifyOtpSchema } from '@/validations/auth';
import { generateReferralCode } from '@/utils/generateReferralCode';

/**
 * Handles user login by sending an OTP.
 * If the user doesn't exist, a new account is created.
 * Also pushes a message to the engine; retries on failure.
 *
 * @param c - Hono context
 * @returns JSON response
 */

export const login = async (c: Context) => {
	try {
		const data = await c.req.json<{ phone: string }>();

		const validateData = loginSchema.safeParse(data);

		if (!validateData.success) {
			logger.warn(
				{
					context: 'LOGIN_VALIDATE',
					error: validateData.error.issues,
				},
				'Invalid phone number during login',
			);
			return c.json(
				{
					success: false,
					message: 'Validation failed',
					error: validateData.error.issues,
				},
				400,
			);
		}

		const phone = validateData.data.phone;

		const otp = crypto.randomInt(100000, 999999).toString();
		logger.info({ otp }, 'OTP generated for phone %s', phone);

		await client.set(`otp:${phone}`, otp, 'EX', 300);

		const existingUser = await prisma.user.findUnique({
			where: {
				phone: phone,
			},
		});

		if (existingUser) {
			try {
				await sendOtp(phone, otp);
				logger.info('OTP sent for existing user');
			} catch (err) {
				logger.error(
					{
						alert: true,
						context: 'LOGIN_OTP_SEND_FAIL',
						phone,
						error: err,
					},
					'Failed to send OTP to existing user',
				);

				return c.json(
					{
						success: false,
						message: 'Failed to send OTP. Try again later.',
					},
					502,
				);
			}

			return c.json(
				{
					success: true,
					message: 'Please check SMS section for the OTP!!',
					isNewUser: existingUser.isNewUser,
				},
				200,
			);
		}

		const referralCode = generateReferralCode();

		const user = await prisma.user.create({
			data: {
				phone: phone,
				referralCode: referralCode,
			},
		});

		logger.info({ phone: user.phone }, 'New user created with phone:');

		const payload = {
			id: user.id,
			phone: user.phone,
			kycVerificationStatus: user.kycVerificationStatus,
			paymentVerificationStatus: user.paymentVerificationStatus,
		};

		const response = await pushToQueue(EVENTS.CREATE_USER, payload);

		if (!response.success && response.retryable) {
			logger.warn(
				{
					context: 'ENGINE_SYNC_RETRY',
					userId: user.id,
					message: response.message,
				},
				'Engine sync failed but retryable. Retrying...',
			);

			const maxRetries = 3;
			const retryDelay = 500;

			let engineSynced = false;

			for (let attempt = 1; attempt <= maxRetries; attempt++) {
				const retryResponse = await pushToQueue(EVENTS.CREATE_USER, payload);

				if (retryResponse.success) {
					logger.info(
						{
							userId: user.id,
							attempt,
						},
						'✅ User synced to engine successfully',
					);
					engineSynced = true;
					break;
				}

				if (!retryResponse.retryable) {
					logger.error(
						{
							alert: true,
							context: 'ENGINE_SYNC_FAILED_NON_RETRYABLE',
							userId: user.id,
							message: response.message,
						},
						'❌ Engine sync failed and not retryable',
					);
					break;
				}

				logger.warn(
					{
						context: 'ENGINE_SYNC_RETRY',
						userId: user.id,
						attempt,
						message: response.message,
					},
					'⚠️ Engine sync failed but retryable. Retrying...',
				);

				await new Promise((res) => setTimeout(res, retryDelay));
			}

			if (!engineSynced) {
				logger.error(
					{
						alert: true,
						context: 'ENGINE_SYNC_MAX_RETRIES_EXCEEDED',
						userId: user.id,
					},
					'❌ Engine sync failed after all retries',
				);
			} else {
				logger.info({ userId: user.id }, '✅ Engine sync done successfully after retries');
			}
		}

		try {
			await sendOtp(phone, otp);
			logger.info('OTP sent for new user');
		} catch (err) {
			logger.error(
				{
					alert: true,
					context: 'LOGIN_OTP_SEND_FAIL_NEW',
					userId: user.id,
					error: err,
				},
				'Failed to send OTP to new user',
			);

			return c.json(
				{
					success: false,
					message: 'Failed to send OTP. Try again later.',
				},
				502,
			);
		}

		return c.json(
			{
				success: true,
				message: 'Please check SMS section for the OTP!!',
				data: {
					id: user.id,
					phone: user.phone,
					isNewUser: user.isNewUser,
					otp: otp, // if snedOtp not worked fallback for user login
				},
			},
			201,
		);
	} catch (error) {
		logger.error(
			{
				alert: true,
				context: 'LOGIN_CONTROLLER_FAIL',
				error,
			},
			'Unhandled error in login controller',
		);

		return c.json(
			{
				success: false,
				error: 'Internal server error',
			},
			500,
		);
	}
};

/**
 * This verify controller will verify otp and generate jwt token
 * Add joining balance to users inr wallet and also push message to engine with retries.
 * @param c Hono context
 * @returns Json response
 */

export const verify = async (c: Context) => {
	try {
		const data = await c.req.json<{ phone: string; otp: string }>();

		const validateData = verifyOtpSchema.safeParse(data);

		if (!validateData.success) {
			logger.warn(
				{
					context: 'VERIFY_VALIDATE',
					error: validateData.error.issues,
				},
				'Invalid phone number ot otp during verify',
			);
			return c.json(
				{
					success: false,
					message: 'Validation failed',
					error: validateData.error.issues,
				},
				400,
			);
		}

		const key = `otp:${validateData.data.phone}`;

		const savedOtp = await client.get(key);

		if (!savedOtp) {
			logger.warn(
				{
					phone: validateData.data.phone,
				},
				'OTP not found or expired for user',
			);
			return c.json(
				{
					success: false,
					message: 'OTP expired or invalid. Please request a new one.',
				},
				401,
			);
		}

		if (savedOtp !== validateData.data.otp) {
			logger.warn(
				{
					phone: validateData.data.phone,
				},
				'Invalid OTP entered',
			);
			return c.json(
				{
					success: false,
					message: 'Invalid OTP. Please try again.',
				},
				401,
			);
		}

		await client.del(key);

		const user = await prisma.user.findFirst({
			where: {
				phone: validateData.data.phone,
			},
		});

		if (!user) {
			return c.json(
				{
					success: false,
					message: 'User not found',
				},
				404,
			);
		}

		if (user.isNewUser) {
			const existingBalance = await prisma.inrBalance.findFirst({
				where: {
					userId: user.id,
				},
			});

			if (!existingBalance) {
				try {
					await prisma.$transaction(async (tx) => {
						await tx.inrBalance.create({
							data: {
								userId: user.id,
								balance: '15.00',
								locked: '0.00',
							},
						});

						await tx.transactionHistory.create({
							data: {
								userId: user.id,
								type: 'SIGNUP_BONUS',
								status: 'SUCCESS',
								amount: '15.00',
								remarks: 'signin bonus credited',
							},
						});
					});

					let response = await pushToQueue(EVENTS.INIT_BALANCE, {
						userId: user.id,
						amount: 15.0,
						locked: 0.0,
					});

					let retries = 0;
					const maxRetries = 2;

					while (!response.success && response.retryable && retries < maxRetries) {
						logger.warn(
							{
								context: 'VERIFY_SYNC_RETRY',
								retry: retries + 1,
								userId: user.id,
							},
							`Retrying sync to engine...`,
						);

						await new Promise((resolve) => setTimeout(resolve, 500));

						response = await pushToQueue(EVENTS.INIT_BALANCE, {
							userId: user.id,
							balance: 15.0,
							locked: 0.0,
						});
						if (response.success) break;
						retries++;
					}

					if (!response.success) {
						logger.error(
							{
								alert: true,
								context: 'VERIFY_ENGINE_SYNC_FAIL',
								userId: user.id,
								engineError: response?.error ?? response?.message,
							},
							'Signup bonus added in db but failed to sync in engine',
						);
					}

					if (response.success) {
						logger.info({ userId: user.id }, 'Engine sync done properly');
					}
				} catch (error) {
					logger.error(
						{
							alert: true,
							context: 'SIGNUP_BONUS_ADD_FAIL',
							userId: user.id,
							error,
						},
						'Failed to credit signup bonus',
					);
					return c.json(
						{
							success: false,
							message: 'Please try again later.',
						},
						500,
					);
				}
			}
		}

		const token = await generateJwtToken(user.id, user.phone, user.role);

		setCookie(c, 'token', token, {
			secure: true,
			httpOnly: true,
			maxAge: 7 * 24 * 60 * 60,
			expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
			sameSite: 'Strict',
			path: '/',
		});

		logger.info({ userId: user.id }, 'User logged in successfully with OTP');

		return c.json(
			{
				success: true,
				message: 'Login successful and OTP verified.',
				data: {
					id: user.id,
					isNewUser: user.isNewUser,
				},
				token: token,
			},
			200,
		);
	} catch (error) {
		logger.error(
			{
				alert: true,
				context: 'VERIFY_CONTROLLER_FAIL',
				error,
			},
			'Unhandled error in verify controller',
		);
		return c.json(
			{
				success: false,
				error: 'Internal server error',
			},
			500,
		);
	}
};

/**
 * Logs out the user by clearing the authentication cookie.
 * @param c - Hono Context
 * @returns JSON response with logout confirmation
 */

export const logout = async (c: Context) => {
	try {
		deleteCookie(c, 'token');

		logger.info(
			`User logs out, IP: ${c.req.header('x-forwarded-for') || c.req.header('host') || 'unknown'}`,
		);

		return c.json(
			{
				success: true,
				message: 'You have been logged out successfully.',
			},
			200,
		);
	} catch (error) {
		logger.error(
			{
				alert: true,
				context: 'LOGOUT_CONTROLLER_FAIL',
				error,
			},
			'Unhandled error in logout controller',
		);
		return c.json(
			{
				success: false,
				message: 'Internal server error',
			},
			500,
		);
	}
};
