import { Context } from 'hono';
import { logger } from '@/libs/logger';
import { prisma } from '@probstreet/database';
import { EVENTS } from '@/config/constants';
import { pushToQueue } from '@/libs/redis/queue';
import { referralCodeSchema } from '@/validations/referral';

/**
 * Get referral code of the logged-in user
 * @param c Hono context
 * @returns Json response
 */

export const getReferralCode = async (c: Context) => {
	try {
		const userId = c.get('user').id;

		if (!userId) {
			logger.warn(
				{
					context: 'GET_REFERRAL_CODE_UNAUTHORIZED',
				},
				'Unauthorized access attempt to /referral route',
			);
			return c.json(
				{
					success: false,
					error: 'Unauthorized',
				},
				401,
			);
		}

		const referralData = await prisma.user.findUnique({
			where: {
				id: userId,
			},
			select: {
				referralCode: true,
			},
		});

		if (!referralData) {
			logger.warn(
				{
					context: 'GET_REFERRAL_CODE_NOT_FOUND',
					userId,
				},
				'Referral code not found for user',
			);
			return c.json(
				{
					success: false,
					message: 'Failed to find code for user',
				},
				404,
			);
		}

		return c.json(
			{
				success: true,
				message: 'Referral code fetched successfully',
				data: referralData,
			},
			200,
		);
	} catch (error) {
		logger.error(
			{
				alert: true,
				context: 'GET_REFERRAL_CODE_CONTROLLER_FAIL',
				error,
			},
			'Unhandled error in getReferralCode controller',
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
 * This handler will get referal code or skip and change is new user to false. If referal code is provided then the owner of the code will get reward.
 * @param c Hono context
 * @returns Json response
 */

export const submitReferral = async (c: Context) => {
	try {
		const userId = c.get('user').id;

		if (!userId) {
			logger.warn(
				{
					context: 'SUBMIT_REFERRAL_UNAUTHORIZED',
				},
				'Unauthorized access attempt to /referral route',
			);
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
			logger.warn(
				{
					context: 'SUBMIT_REFERRAL',
					error: validateData.error.issues,
				},
				'Failed to validate referal code',
			);
			return c.json(
				{
					success: false,
					message: 'validation failed',
					error: validateData.error.issues,
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

		try {
			await prisma.$transaction(async (tx) => {
				await tx.wallet.update({
					where: { userId },
					data: {
						balance: {
							increment: 10,
						},
					},
				});

				await tx.transaction.create({
					data: {
						userId,
						type: 'REFERRAL_REWARD',
						status: 'SUCCESS',
						amount: '10.00',
						remarks: `Bonus for applying referral code ${referralCode}`,
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
						isReferrer: true,
						status: 'PENDING',
					},
				});
			});
		} catch (error) {
			logger.error(
				{
					alert: true,
					contsxt: 'SUBMIT_REFERRAL',
					error,
				},
				'DB transaction failed during referral',
			);
			return c.json(
				{
					success: false,
					message: 'failed to update db, Internal error',
				},
				500,
			);
		}

		let response = await pushToQueue(EVENTS.REFERRAL_CREDIT, {
			userId: referrer.id,
			amount: 20,
		});

		if (!response.success && response.retryable) {
			for (let i = 0; i < 3; i++) {
				await new Promise((r) => setTimeout(r, 500));

				response = await pushToQueue(EVENTS.REFERRAL_CREDIT, {
					userId: referrer.id,
					amount: 20,
				});

				if (response.success) break;
			}
		}

		if (response.success) {
			logger.info('Engine sync done properly');
		}

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

export const getReferralInfo = async (c: Context) => {
	try {
		const userId = c.get('user').id;

		if (!userId) {
			return c.json(
				{
					success: false,
					error: 'Unauthorized',
				},
				401,
			);
		}

		const user = await prisma.user.findUnique({
			where: { id: userId },
			select: {
				id: true,
				username: true,
				email: true,
				referralCode: true,
				referrerId: true,
				totalReferralReward: true,
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

		let cleanCode = user.referralCode;

		if (!cleanCode.startsWith('PROB-')) {
			cleanCode = `PROB-${cleanCode.toUpperCase()}`;
			await prisma.user
				.update({
					where: { id: userId },
					data: { referralCode: cleanCode },
				})
				.catch(() => {});
		}

		const origin = c.req.header('origin') || 'http://localhost:5173';
		const referralLink = `${origin}/events?ref=${cleanCode}`;

		const referrals = await prisma.referral.findMany({
			where: {
				referrerId: userId,
				isReferrer: true,
			},
			include: {
				referred: {
					select: {
						id: true,
						username: true,
						email: true,
						phone: true,
						createdAt: true,
					},
				},
			},
			orderBy: { createdAt: 'desc' },
		});

		const totalInvited = referrals.length;
		const completedCount = referrals.filter((r) => r.status === 'COMPLETED').length;
		const pendingCount = referrals.filter((r) => r.status === 'PENDING').length;

		const totalEarnings = referrals
			.filter((r) => r.status === 'COMPLETED')
			.reduce((acc, r) => acc + Number(r.amount || 20), 0);

		const invitedFriends = referrals.map((ref) => {
			const username =
				ref.referred.username ||
				ref.referred.email?.split('@')[0] ||
				ref.referred.phone ||
				'Trader';
			return {
				id: ref.referred.id,
				username: username,
				joinedAt: ref.createdAt,
				status: ref.status,
				rewardAmount: Number(ref.amount || 20),
			};
		});

		const [tradeCount, totalDeposits] = await Promise.all([
			prisma.order.count({ where: { userId, status: 'COMPLETED' } }),
			prisma.transaction.aggregate({
				where: { userId, type: 'DEPOSIT', status: 'SUCCESS' },
				_sum: { amount: true },
			}),
		]);

		const depositTotal = Number(totalDeposits._sum.amount || 0);

		const rewardTasks = [
			{
				id: 'welcome_bonus',
				title: 'Welcome Trading Bonus',
				description: 'Sign up & complete onboarding to receive ₹15 trading bonus',
				reward: 15,
				type: 'PROMOTIONAL',
				status: 'CLAIMED',
				isWithdrawable: false,
			},
			{
				id: 'tiered_deposit_50',
				title: 'Recharge ₹50+',
				description: 'Recharge ₹50+ to earn ₹5 bonus (unlocks ₹10 reward for your inviter)',
				reward: 5,
				type: 'BONUS',
				status: depositTotal >= 50 ? 'COMPLETED' : 'PENDING',
				progress: Math.min(Math.round((depositTotal / 50) * 100), 100),
				isWithdrawable: true,
			},
			{
				id: 'tiered_deposit_100',
				title: 'Recharge ₹100+',
				description: 'Recharge ₹100+ to earn ₹10 bonus (unlocks ₹20 reward for your inviter)',
				reward: 10,
				type: 'BONUS',
				status: depositTotal >= 100 ? 'COMPLETED' : 'PENDING',
				progress: Math.min(Math.round((depositTotal / 100) * 100), 100),
				isWithdrawable: true,
			},
			{
				id: 'trades_50',
				title: '50 Trades Milestone',
				description: 'Complete 50 trades on any prediction market to earn ₹5 cash bonus',
				reward: 5,
				type: 'MILESTONE',
				status: tradeCount >= 50 ? 'COMPLETED' : 'IN_PROGRESS',
				progress: Math.min(Math.round((tradeCount / 50) * 100), 100),
				completedCount: tradeCount,
				targetCount: 50,
				isWithdrawable: true,
			},
			{
				id: 'trades_100',
				title: '100 Trades Milestone',
				description: 'Complete 100 trades on any prediction market to earn ₹10 cash bonus',
				reward: 10,
				type: 'MILESTONE',
				status: tradeCount >= 100 ? 'COMPLETED' : 'IN_PROGRESS',
				progress: Math.min(Math.round((tradeCount / 100) * 100), 100),
				completedCount: tradeCount,
				targetCount: 100,
				isWithdrawable: true,
			},
			{
				id: 'trades_500',
				title: '500 Trades Milestone',
				description: 'Complete 500 trades on any prediction market to earn ₹30 cash bonus',
				reward: 30,
				type: 'MILESTONE',
				status: tradeCount >= 500 ? 'COMPLETED' : 'IN_PROGRESS',
				progress: Math.min(Math.round((tradeCount / 500) * 100), 100),
				completedCount: tradeCount,
				targetCount: 500,
				isWithdrawable: true,
			},
		];

		return c.json({
			success: true,
			data: {
				referralCode: cleanCode,
				referralLink,
				hasAppliedReferral: Boolean(user.referrerId),
				totalEarnings: Math.round(totalEarnings * 100) / 100,
				totalInvited,
				completedCount,
				pendingCount,
				invitedFriends,
				rewardTasks,
			},
		});
	} catch (error) {
		logger.error({ error }, 'Failed to fetch referral info');
		return c.json(
			{
				success: false,
				error: 'Internal server error',
			},
			500,
		);
	}
};
