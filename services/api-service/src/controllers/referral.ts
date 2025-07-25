import { Context } from 'hono';
import { logger } from '@/utils/logger';
import { prisma } from '@probo/database';
import { referralCodeSchema } from '@/validations/referral';

/**
 * This handler will get referal code or skip and change is new user to false. If referal code is provided then the owner of the code will get reward.
 * @param c Hono context
 * @returns Json response
 */

export const submitReferral = async (c: Context) => {
	try {
		const userId = c.get('user').id;

		if (!userId) {
			logger.warn('Unauthorized access attempt to /referral');
			return c.json(
				{
					success: false,
					error: 'Unauthorized',
				},
				401,
			);
		}

		const { referralCode, skip } = await c.req.json<{ referralCode?: string; skip?: boolean }>();

		const user = await prisma.user.findUnique({ where: { id: userId } });

		if (!user) {
			return c.json(
				{
					success: false,
					error: 'User not found',
				},
				404,
			);
		}

		if (!user.isNewUser) {
			return c.json(
				{
					success: false,
					error: 'Already processed referral',
				},
				400,
			);
		}

		if (skip) {
			try {
				await prisma.user.update({
					where: { id: userId },
					data: { isNewUser: false },
				});
			} catch (error) {
				logger.error({ error }, 'database update failed for new user update');
				return c.json(
					{
						status: false,
						error: 'Failed to skip referral',
					},
					500,
				);
			}

			return c.json({
				success: true,
				message: 'Referral skipped successfully',
			});
		}

		const validateData = referralCodeSchema.safeParse({ referralCode });

		if (!validateData.success) {
			logger.warn({ error: validateData.error }, 'Failed to validate referal code');
			return c.json(
				{
					success: false,
					error: 'Failed to validate referal code',
				},
				400,
			);
		}

		const referrer = await prisma.user.findFirst({
			where: { referralCode },
		});

		if (!referrer || !referrer.id) {
			return c.json(
				{
					success: false,
					error: 'Invalid referral code',
				},
				400,
			);
		}

		if (referrer.id === userId) {
			return c.json(
				{
					success: false,
					error: 'You cannot refer yourself',
				},
				400,
			);
		}

		await prisma.$transaction(async (tx) => {
			await tx.inrBalance.update({
				where: { userId: referrer.id },
				data: {
					balance: {
						increment: 20,
					},
				},
			});

			await tx.transactionHistory.create({
				data: {
					userId: referrer.id,
					type: 'REFERRAL_REWARD',
					status: 'SUCCESS',
					amount: '20.00',
					remarks: `Referral bonus from ${userId}`,
				},
			});

			await tx.user.update({
				where: { id: userId },
				data: {
					isNewUser: false,
					referrerId: referrer.id,
				},
			});
		});

		logger.info(
			{
				userId,
				referrerId: referrer.id,
			},
			'Referral processed successfully',
		);

		return c.json({
			success: true,
			message: 'Referral processed successfully',
		});
	} catch (error) {
		logger.error({ error }, 'Referral processing failed');
		return c.json(
			{
				success: false,
				error: 'Internal server error',
			},
			500,
		);
	}
};