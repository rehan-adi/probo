import { Context } from 'hono';
import { db } from '@/lib/db';
import { logger } from '@/utils/logger';
import { getCookie } from 'hono/cookie';
import { verifyToken } from '@/utils/token';

export const getProfile = async (c: Context) => {
	try {
		const user = c.get('user');
		if (!user) {
			return c.json({ success: false, message: 'Unauthorized' }, 401);
		}

		const dbUser = await db.user.findUnique({
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

		const updatedUser = await db.user.update({
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
