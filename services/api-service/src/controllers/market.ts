import slugify from 'slugify';
import { Context } from 'hono';
import { customAlphabet } from 'nanoid';
import { logger } from '@/utils/logger';
import { prisma } from '@probo/database';
import { EVENTS } from '@/constants/constants';
import { pushToQueue } from '@/lib/redis/queue';
import { createMarketSchema } from '@/validations/market';

const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 6);

/**
 * Create market controller, for admin only
 * @param c Hono context
 * @returns Json response
 */

export const createMarket = async (c: Context) => {
	try {
		const user = c.get('user');

		if (user?.role !== 'ADMIN') {
			logger.warn(
				{
					context: 'CREATE_MARKET_UNAUTHORIZED',
					userId: user?.id,
				},
				'Unauthorized attempt to createMarket',
			);
			return c.json(
				{
					success: false,
					message: 'Unauthorized',
				},
				403,
			);
		}

		const body = await c.req.json();
		const parsed = createMarketSchema.safeParse(body);

		if (!parsed.success) {
			logger.warn(
				{
					context: 'CREATE_MARKET_VALIDATE_ERROR',
					error: parsed.error.issues,
				},
				'Validation error',
			);
			return c.json(
				{
					success: false,
					message: 'Validation error',
					error: parsed.error.issues,
				},
				400,
			);
		}

		const data = parsed.data;

		const category = await prisma.category.findUnique({
			where: { id: data.categoryId },
		});

		if (!category) {
			return c.json(
				{
					success: false,
					message: 'Invalid categoryId',
				},
				400,
			);
		}

		const slug = slugify(data.title, { lower: true, strict: true });
		const symbol = `${slug}-${nanoid()}`;

		const existingMarket = await prisma.market.findFirst({
			where: {
				OR: [{ symbol: symbol }, { title: data.title }],
			},
		});

		if (existingMarket) {
			logger.warn(
				{
					context: 'CREATE_MARKET_CONFLICT',
					userId: user?.id,
					title: data.title,
					symbol,
				},
				'Market already exists with the same title or symbol',
			);
			return c.json(
				{
					success: false,
					message: 'Market already exists with same title or symbol',
				},
				409,
			);
		}

		const newMarket = await prisma.market.create({
			data: {
				title: data.title,
				symbol,
				yesPrice: 5.0,
				NoPrice: 5.0,
				description: data.description,
				startTime: data.startTime,
				endTime: data.endTime,
				thumbnail: data.thumbnail,
				categoryId: data.categoryId,
				sourceOfTruth: data.sourceOfTruth,
			},
		});

		const yesPrice = parseFloat(newMarket.yesPrice.toString());
		const noPrice = parseFloat(newMarket.NoPrice.toString());

		const queuePayload = {
			marketId: newMarket.id,
			symbol: newMarket.symbol,
			yesPrice: yesPrice,
			NoPrice: noPrice,
			endDate: newMarket.endTime,
			startDate: newMarket.startTime,
			categoryId: newMarket.categoryId,
			description: newMarket.description,
			SourceOfTruth: newMarket.sourceOfTruth,
		};

		let response = await pushToQueue(EVENTS.CREATE_MARKET, queuePayload);

		if (!response.success && response.retryable) {
			for (let attempt = 0; attempt < 3; attempt++) {
				response = await pushToQueue(EVENTS.CREATE_MARKET, queuePayload);
				if (response.success) break;
			}
		}

		if (!response.success) {
			logger.error(
				{
					alert: true,
					context: 'CREATE_MARKET_QUEUE_PUSH_FAILED',
					marketId: newMarket.id,
				},
				'Failed to push CREATE_MARKET job to queue',
			);
		} else {
			logger.info(
				{
					context: 'CREATE_MARKET_SUCCESS',
					userId: user?.id,
					marketId: newMarket.id,
					symbol,
				},
				'Market created and enqueued successfully',
			);
		}

		return c.json(
			{
				success: true,
				message: 'Market created successfully',
				data: {
					id: newMarket.id,
					symbol,
				},
			},
			201,
		);
	} catch (error) {
		logger.error(
			{
				alert: true,
				context: 'CREATE_MARKET_CONTROLLER_FAIL',
				error,
				userId: c.get('user')?.id,
			},
			'Unhandled error during market creation',
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
