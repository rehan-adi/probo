import crypto from 'crypto';
import { Context } from 'hono';
import { prisma } from '@probo/database';
import { logger } from '@/utils/logger';
import { sendOtp } from '@/lib/twilio/otp';
import { client } from '@/lib/redis/connection';
import { generateJwtToken } from '@/utils/token';
import { deleteCookie, setCookie } from 'hono/cookie';
import { generateReferralCode } from '@/utils/generateReferralCode';
import { loginSchema, verifyOtpSchema } from '@/validations/auth';

/**
 * This login controller creates an account if it doesn't exist and sends OTP,
 * @param c - Hono context
 * @returns Json response
 */

export const login = async (c: Context) => {
	try {
		const data = await c.req.json<{ phone: string }>();

		const validateData = loginSchema.safeParse(data);

		if (!validateData.success) {
			logger.error(`data validation failed ${validateData.data}`);
			return c.json(
				{
					success: false,
					error: validateData.error,
				},
				400,
			);
		}

		logger.info(`data is validate for ${validateData.data.phone}`);

		const phone = validateData.data.phone;

		const existingUser = await prisma.user.findUnique({
			where: {
				phone: phone,
			},
		});

		logger.info('Existing user query result:', existingUser);

		const otp = crypto.randomInt(100000, 999999).toString();
		logger.info(`otp is ${otp}`);

		await client.set(`otp:${phone}`, otp, 'EX', 310);

		if (existingUser) {
			try {
				await sendOtp(phone, otp);
				logger.info('OTP send for existing user');
			} catch (err) {
				return c.json({ success: false, message: 'Failed to send OTP. Try again later.' }, 502);
			}

			return c.json(
				{
					success: true,
					message: 'Please check SMS section for the OTP!!',
					isFirstLogin: existingUser.isNewUser,
				},
				200,
			);
		}

		const referalCode = generateReferralCode();

		const user = await prisma.user.create({
			data: {
				phone: phone,
				referralCode: referalCode,
			},
		});

		try {
			await sendOtp(phone, otp);
			logger.info('OTP send for new user');
		} catch (err) {
			return c.json({ success: false, message: 'Failed to send OTP. Try again later.' }, 502);
		}

		return c.json(
			{
				success: true,
				message: 'Please check SMS section for the OTP!!',
				isFirstLogin: true,
				data: {
					id: user.id,
					phone: user.phone,
					isNewUser: user.isNewUser,
				},
			},
			201,
		);
	} catch (error) {
		logger.error(`Error in login handler: ${error}`, error);
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
 * This verify controller will verify otp and generate jwt token and add joining balance to users inr wallet
 * @param c Hono context
 * @returns Json response
 */

export const verify = async (c: Context) => {
	try {
		const data = await c.req.json<{ phone: string; otp: string }>();

		const validatdata = verifyOtpSchema.safeParse(data);

		if (!validatdata.success) {
			logger.error(`failed to validate data ${validatdata.data}`);
			return c.json(
				{
					success: false,
					error: validatdata.error,
				},
				400,
			);
		}

		const key = `otp:${validatdata.data.phone}`;

		const savedOtp = await client.get(key);

		if (!savedOtp) {
			logger.error(`Otp is no more present ${validatdata.data}`);
			return c.json(
				{
					success: false,
					message: 'OTP expired or invalid. Please request a new one.',
				},
				401,
			);
		}

		if (savedOtp !== validatdata.data.otp) {
			logger.error(`Otp is not valid for ${validatdata.data.phone}`);
			return c.json({ success: false, message: 'Invalid OTP. Please try again.' }, 401);
		}

		await client.del(key);

		const user = await prisma.user.findFirst({
			where: {
				phone: validatdata.data.phone,
			},
		});

		if (!user) {
			return c.json(
				{
					success: false,
					error: 'User not found',
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
			}
		}

		const token = await generateJwtToken(user.id, user.phone, user.role);

		setCookie(c, 'token', token, {
			secure: true,
			httpOnly: true,
			maxAge: 7 * 24 * 60 * 60,
			expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
			sameSite: 'Strict',
		});

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
		logger.error('Error occored at verify handler', error);
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
	deleteCookie(c, 'token');

	logger.info(`User loges out, IP: ${c.req.header('x-forwarded-for') || c.req.header('host')}`);

	return c.json(
		{
			success: true,
			message: 'You have been logged out successfully.',
		},
		200,
	);
};
