import { Context, Hono } from 'hono';
import { logger } from '@/utils/logger';
import { prisma } from '@probo/database';

export const categoriesRoutes = new Hono();

categoriesRoutes.get('/', async (c: Context) => {
	try {
		const categories = await prisma.category.findMany({
			select: {
				id: true,
				categoryName: true,
			},
		});

		return c.json(
			{
				success: true,
				message: 'Fetched categories successfully',
				data: categories,
			},
			200,
		);
	} catch (error) {
		logger.error(
			{
				alert: true,
				context: 'CATEGORIES_ROUTE_FAIL',
				error,
			},
			'Unhandled error in categoriesRoutes',
		);
		return c.json(
			{
				success: false,
				error: 'Internal server error',
			},
			500,
		);
	}
});
