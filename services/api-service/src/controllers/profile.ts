import { Context } from 'hono';
import { prisma } from '@probo/database';
import { logger } from '@/utils/logger';

export const getProfile = async (c: Context) => {
	try {
		const user = c.get('user');
		if (!user) {
			return c.json({ success: false, message: 'Unauthorized' }, 401);
		}

		const dbUser = await prisma.user.findUnique({
			where: { id: user.id },
			select: {
				id: true,
				name: true,
				phone: true,
				profilePic: true,
				createdAt: true,
			},
		});

		if (!dbUser) {
			return c.json({ success: false, message: 'User not found' }, 404);
		}

		return c.json({
			success: true,
			data: dbUser,
		});
	} catch (error: any) {
		logger.error({ context: 'GET_PROFILE', message: error.message });
		return c.json({ success: false, message: 'Internal server error' }, 500);
	}
};

export const updateProfile = async (c: Context) => {
	try {
		const user = c.get('user');
		if (!user) {
			return c.json({ success: false, message: 'Unauthorized' }, 401);
		}

		const body = await c.req.json();
		const { name, profilePic } = body;

		const updateData: any = {};
		if (name !== undefined) updateData.name = name;
		if (profilePic !== undefined) updateData.profilePic = profilePic;

		const updatedUser = await prisma.user.update({
			where: { id: user.id },
			data: updateData,
			select: {
				id: true,
				name: true,
				phone: true,
				profilePic: true,
			},
		});

		return c.json({
			success: true,
			message: 'Profile updated successfully',
			data: updatedUser,
		});
	} catch (error: any) {
		logger.error({ context: 'UPDATE_PROFILE', message: error.message });
		return c.json({ success: false, message: 'Internal server error' }, 500);
	}
};

export const addToWatchlist = async (c: Context) => {
	try {
		const user = c.get('user');
		if (!user) return c.json({ success: false, message: 'Unauthorized' }, 401);

		const body = await c.req.json();
		const { marketId } = body;

		if (!marketId) {
			return c.json({ success: false, message: 'marketId is required' }, 400);
		}

		await prisma.watchlist.upsert({
			where: { userId_marketId: { userId: user.id, marketId } },
			update: {},
			create: { userId: user.id, marketId },
		});

		return c.json({ success: true, message: 'Added to watchlist' });
	} catch (error: any) {
		logger.error({ context: 'ADD_WATCHLIST', message: error.message });
		return c.json({ success: false, message: 'Internal server error' }, 500);
	}
};

export const removeFromWatchlist = async (c: Context) => {
	try {
		const user = c.get('user');
		if (!user) return c.json({ success: false, message: 'Unauthorized' }, 401);

		const { marketId } = c.req.param();

		await prisma.watchlist.delete({
			where: { userId_marketId: { userId: user.id, marketId } },
		});

		return c.json({ success: true, message: 'Removed from watchlist' });
	} catch (error: any) {
		logger.error({ context: 'REMOVE_WATCHLIST', message: error.message });
		return c.json({ success: false, message: 'Internal server error' }, 500);
	}
};

export const getWatchlist = async (c: Context) => {
	try {
		const user = c.get('user');
		if (!user) return c.json({ success: false, message: 'Unauthorized' }, 401);

		const watchlist = await prisma.watchlist.findMany({
			where: { userId: user.id },
			include: {
				market: {
					select: {
						id: true,
						title: true,
						yesPrice: true,
						NoPrice: true,
						thumbnail: true,
						symbol: true,
						status: true,
					},
				},
			},
			orderBy: { createdAt: 'desc' },
		});

		return c.json({ success: true, data: watchlist.map((w) => w.market) });
	} catch (error: any) {
		logger.error({ context: 'GET_WATCHLIST', message: error.message });
		return c.json({ success: false, message: 'Internal server error' }, 500);
	}
};
