import { Context } from 'hono';
import { logger } from '@/libs/logger';
import { prisma } from '@probo/database';
import { usernameSchema, referralSchema, notificationPrefsSchema } from '@/validations/onboarding';

const logAudit = async (
	action: string,
	userId?: string,
	ip?: string,
	userAgent?: string,
	metadata?: any,
) => {
	try {
		await prisma.auditLog.create({
			data: { action, userId, ip, userAgent, metadata: metadata ? metadata : undefined },
		});
	} catch (error) {
		logger.error({ error, action, userId }, 'Failed to write audit log');
	}
};

/**
 * @desc Checks the availability of a requested username by querying the database case-insensitively.
 * @param c Hono Context
 * @returns JSON response
 */
export const checkUsername = async (c: Context) => {
	try {
		const username = c.req.query('username');

		if (!username)
			return c.json(
				{
					success: false,
					error: 'Username query parameter is required',
				},
				400,
			);

		const existingUser = await prisma.user.findFirst({
			where: { username: { equals: username, mode: 'insensitive' } },
		});

		return c.json({
			success: true,
			data: { isAvailable: !existingUser },
		});
	} catch (error) {
		logger.error({ error }, 'Check username failed');
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
 * @desc updateUsername controller logic
 * @param c Hono Context
 * @returns JSON response
 */
export const updateUsername = async (c: Context) => {
	try {
		const user = c.get('user');
		const body = await c.req.json();

		const result = usernameSchema.safeParse(body);

		if (!result.success)
			return c.json(
				{
					success: false,
					error: result.error.issues,
				},
				400,
			);

		const existingUser = await prisma.user.findFirst({
			where: {
				username: {
					equals: result.data.username,
					mode: 'insensitive',
				},
			},
		});

		if (existingUser)
			return c.json(
				{
					success: false,
					error: 'Username is already taken',
				},
				400,
			);

		const avatarUrl = `https://api.dicebear.com/10.x/avataaars/svg?seed=${encodeURIComponent(result.data.username)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffdfbf,ffd5dc,c4f0c5`;

		const updatedUser = await prisma.user.update({
			where: { id: user.id },
			data: {
				username: result.data.username,
				avatarUrl,
				onboardingStatus: 'PENDING_PREFERENCES',
			},
		});

		await logAudit('SET_USERNAME', user.id, undefined, undefined, {
			username: result.data.username,
		});

		return c.json({
			success: true,
			message: 'Username updated successfully',
			data: { onboardingStatus: updatedUser.onboardingStatus },
		});
	} catch (error: any) {
		logger.error({ error }, 'Update username failed');
		return c.json(
			{
				success: false,
				error: error.message || 'Internal server error',
			},
			400,
		);
	}
};

/**
 * @desc updatePreferences controller logic
 * @param c Hono Context
 * @returns JSON response
 */
export const updatePreferences = async (c: Context) => {
	try {
		const user = c.get('user');
		const body = await c.req.json();

		if (body.referralCode) {
			const refResult = referralSchema.safeParse({ referralCode: body.referralCode });
			if (refResult.success && refResult.data.referralCode) {
				try {
					const referrer = await prisma.user.findUnique({
						where: { referralCode: refResult.data.referralCode },
					});
					if (!referrer) return c.json({ success: false, error: 'Invalid referral code' }, 400);
					if (referrer.id === user.id)
						return c.json({ success: false, error: 'Cannot use your own referral code' }, 400);

					const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
					if (dbUser?.referrerId)
						return c.json({ success: false, error: 'Referral code already applied' }, 400);

					await prisma.$transaction(async (tx) => {
						await tx.user.update({ where: { id: user.id }, data: { referrerId: referrer.id } });

						await tx.wallet.update({
							where: { userId: user.id },
							data: { balance: { increment: 10.0 } },
						});
						await tx.transaction.create({
							data: {
								userId: user.id,
								type: 'REFERRAL_REWARD',
								status: 'SUCCESS',
								amount: '10.00',
								remarks: 'Extra bonus for applying referral code',
							},
						});

						await tx.referral.create({
							data: {
								referrerId: referrer.id,
								referredId: user.id,
								amount: 20.0,
								isReferrer: true,
								status: 'PENDING',
							},
						});
					});
					await logAudit('APPLY_REFERRAL', user.id, undefined, undefined, {
						referralCode: refResult.data.referralCode,
					});
				} catch (err: any) {
					return c.json({ success: false, error: err.message }, 400);
				}
			}
		}

		const prefsResult = notificationPrefsSchema.safeParse(body.notifications || {});
		if (!prefsResult.success)
			return c.json({ success: false, error: prefsResult.error.issues }, 400);

		await prisma.notificationSettings.upsert({
			where: { userId: user.id },
			update: prefsResult.data,
			create: { userId: user.id, ...prefsResult.data },
		});
		await logAudit('SET_NOTIFICATIONS', user.id, undefined, undefined, prefsResult.data);

		const updatedUser = await prisma.user.update({
			where: { id: user.id },
			data: { onboardingStatus: 'COMPLETED', isNewUser: false },
		});
		await logAudit('COMPLETE_ONBOARDING', user.id);

		return c.json({
			success: true,
			message: 'Preferences updated and onboarding completed',
			data: { onboardingStatus: updatedUser.onboardingStatus },
		});
	} catch (error: any) {
		logger.error({ error }, 'Update preferences failed');
		return c.json({ success: false, error: error.message || 'Internal server error' }, 400);
	}
};
