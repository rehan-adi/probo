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
				await prisma.$transaction(async (tx) => {
					await tx.user.update({
						where: { id: userId },
						data: { isNewUser: false },
					});

					await tx.referral.create({
						data: {
							referrerId: null,
							referredId: user.id,
							amount: 0,
						},
					});
				});
			} catch (error) {
				logger.error({ error }, 'Database update failed for skip referral');
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

			await tx.referral.create({
				data: {
					referrerId: referrer.id,
					referredId: user.id,
					amount: 20,
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

/**
 * Get all users referred by the current user with earnings info
 *
 * @param c Hono context
 * @returns JSON with referral earnings
 */

export const getReferralEarnings = async (c: Context) => {
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

		const referrals = await prisma.referral.findMany({
			where: {
				referrerId: userId,
			},
			include: {
				referred: {
					select: {
						id: true,
						phone: true,
						createdAt: true,
					},
				},
			},
			orderBy: {
				createdAt: 'desc',
			},
		});

		const formatted = referrals.map((ref) => ({
			id: ref.referred.id,
			phone: ref.referred.phone,
			joinedAt: ref.referred.createdAt,
			amount: Number(ref.amount),
		}));

		return c.json(
			{
				success: true,
				data: formatted,
				message: 'Referral earnings fetched successfully',
			},
			200,
		);
	} catch (error) {
		logger.error({ error }, 'Failed to get referral earnings');
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
 * Fetches the top 5 users with the highest referral earnings.
 * @param c - Hono context
 * @returns JSON response containing the top earners
 */

export const referralLeaderboard = async (c: Context) => {
	try {
		const topReferrers = await prisma.referral.groupBy({
			by: ['referrerId'],
			_sum: {
				amount: true,
			},
			orderBy: {
				_sum: {
					amount: 'desc',
				},
			},
			take: 5,
		});

		const userIds = topReferrers.map((r) => r.referrerId);
		const filteredUserIds = userIds.filter((id): id is string => id !== null);

		const users = await prisma.user.findMany({
			where: {
				id: {
					in: filteredUserIds,
				},
			},
			select: {
				id: true,
				phone: true,
				totalReferralReward: true,
				createdAt: true,
			},
		});

		const leaderboard = users.map((user) => {
			const refData = topReferrers.find((r) => r.referrerId === user.id);
			return {
				id: user.id,
				phone: user.phone,
				totalEarned: refData?._sum.amount || 0,
				joinedAt: user.createdAt,
			};
		});

		return c.json({
			success: true,
			leaderboard,
		});
	} catch (error) {
		logger.error({ error }, 'Failed to fetch referral leaderboard');
		return c.json(
			{
				success: false,
				error: 'Internal server error',
			},
			500,
		);
	}
};
