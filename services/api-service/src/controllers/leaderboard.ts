import { Context } from 'hono';
import { logger } from '@/libs/logger';
import { prisma } from '@probo/database';
import { client as redis } from '@/libs/redis/connection';

export const syncLeaderboardFromDB = async (redisKey: string) => {
	try {
		logger.info({ redisKey }, 'Hydrating Redis leaderboard from PostgreSQL...');

		const earnings = await prisma.ledgerEntry.groupBy({
			by: ['toAccount'],
			where: { type: 'WINNINGS' },
			_sum: { amount: true },
		});

		if (earnings.length === 0) {
			return;
		}

		const pipeline = redis.pipeline();

		for (const item of earnings) {
			if (item.toAccount && item._sum.amount) {
				const profit = Number(item._sum.amount);
				if (profit > 0) {
					pipeline.zadd(redisKey, profit, item.toAccount);
				}
			}
		}
		await pipeline.exec();
		await redis.expire(redisKey, 86400);

		logger.info({ redisKey, count: earnings.length }, 'Successfully hydrated Redis leaderboard');
	} catch (error) {
		logger.error({ error, redisKey }, 'Failed to hydrate Redis leaderboard from DB');
	}
};

export const getLeaderboard = async (c: Context) => {
	try {
		const timeframe = c.req.query('timeframe') || 'all_time';
		const now = new Date();

		let redisKey = 'leaderboard:all_time';

		if (timeframe === 'today') {
			const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
			redisKey = `leaderboard:today:${todayStr}`;
		} else if (timeframe === 'monthly') {
			const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
			redisKey = `leaderboard:monthly:${yearMonth}`;
		} else if (timeframe === 'weekly') {
			const startOfYear = new Date(now.getFullYear(), 0, 1);
			const weekNum = Math.ceil(
				((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7,
			);
			redisKey = `leaderboard:weekly:${now.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
		}

		const exists = await redis.exists(redisKey);

		if (!exists) {
			await syncLeaderboardFromDB(redisKey);
		}

		const rawResults = await redis.zrevrange(redisKey, 0, 99, 'WITHSCORES');

		const topUsers: { userId: string; score: number }[] = [];

		for (let i = 0; i < rawResults.length; i += 2) {
			const score = parseFloat(rawResults[i + 1]);
			if (score > 0) {
				topUsers.push({
					userId: rawResults[i],
					score,
				});
			}
		}

		const userIds = topUsers.map((u) => u.userId);

		const currentUser = c.get('user');

		if (currentUser?.id && !userIds.includes(currentUser.id)) {
			userIds.push(currentUser.id);
		}

		const users = await prisma.user.findMany({
			where: { id: { in: userIds } },
			select: {
				id: true,
				username: true,
				avatarUrl: true,
				email: true,
			},
		});

		const userMap = new Map(users.map((u) => [u.id, u]));

		// Query exact trade records for all users (both maker & taker trades)
		const trades = await prisma.trade.findMany({
			where: {
				OR: [{ makerId: { in: userIds } }, { takerId: { in: userIds } }],
			},
			select: {
				makerId: true,
				takerId: true,
				price: true,
				quantity: true,
			},
		});

		const volumeMap = new Map<string, number>();

		for (const trade of trades) {
			const tradeVal = Number(trade.price) * trade.quantity;
			if (trade.makerId) {
				volumeMap.set(trade.makerId, (volumeMap.get(trade.makerId) || 0) + tradeVal);
			}
			if (trade.takerId && trade.takerId !== trade.makerId) {
				volumeMap.set(trade.takerId, (volumeMap.get(trade.takerId) || 0) + tradeVal);
			}
		}

		const leaderboard = topUsers.slice(0, 50).map((entry, index) => {
			const profile = userMap.get(entry.userId);
			const displayName =
				profile?.username || profile?.email?.split('@')[0] || `Trader #${entry.userId.slice(-4)}`;
			const actualVolume = volumeMap.get(entry.userId) || 0;

			return {
				rank: index + 1,
				userId: entry.userId,
				name: displayName,
				username: profile?.username || `trader_${entry.userId.slice(-4)}`,
				avatar: profile?.avatarUrl || null,
				profit: entry.score,
				volume: Math.round(actualVolume * 100) / 100,
			};
		});

		let userRankData: { rank: number | null; profit: number } | null = null;

		if (currentUser?.id) {
			const zeroBasedRank = await redis.zrevrank(redisKey, currentUser.id);
			const scoreStr = await redis.zscore(redisKey, currentUser.id);
			userRankData = {
				rank: zeroBasedRank !== null ? zeroBasedRank + 1 : null,
				profit: scoreStr ? parseFloat(scoreStr) : 0,
			};
		}

		return c.json({
			success: true,
			data: {
				timeframe,
				leaderboard,
				userRank: userRankData,
			},
		});
	} catch (error) {
		logger.error({ error }, 'Failed to fetch leaderboard');
		return c.json(
			{
				success: false,
				message: 'Failed to fetch leaderboard',
			},
			500,
		);
	}
};
