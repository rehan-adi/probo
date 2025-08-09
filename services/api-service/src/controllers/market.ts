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
			title: newMarket.title,
			symbol: newMarket.symbol,
			description: newMarket.description,
			yesPrice: yesPrice,
			NoPrice: noPrice,
			thumbnail: newMarket.thumbnail,
			endDate: newMarket.endTime,
			startDate: newMarket.startTime,
			categoryId: newMarket.categoryId,
			sourceOfTruth: newMarket.sourceOfTruth,
			numberOftraders: newMarket.numberOfTraders,
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
				error: error instanceof Error ? error.message : error,
				stack: error instanceof Error ? error.stack : undefined,
				userId: c.get('user')?.id,
			},
			'Unhandled error during market creation',
		);
		return c.json(
			{
				success: false,
				message: 'Internal server error',
				error: error instanceof Error ? error.message : 'Unknown error',
			},
			500,
		);
	}
};

/**
 * fetch all markets or events from db
 * @param c Hono context
 * @returns json response
 */

export const getAllMarket = async (c: Context) => {
	try {
		const markets = await prisma.market.findMany({
			where: {
				status: 'OPEN',
			},
			orderBy: {
				createdAt: 'desc',
			},
			select: {
				id: true,
				title: true,
				description: true,
				yesPrice: true,
				NoPrice: true,
				endTime: true,
				numberOfTraders: true,
				thumbnail: true,
				categoryId: true,
				sourceOfTruth: true,
				status: true,
				symbol: true,
			},
		});

		return c.json(
			{
				success: true,
				message: 'Markets or events fetched successfully',
				data: markets,
			},
			200,
		);
	} catch (error) {
		logger.error(
			{
				alert: true,
				context: 'GET_ALL_MARKET_CONTROLLER_FAIL',
				error: error instanceof Error ? error.message : error,
				stack: error instanceof Error ? error.stack : undefined,
			},
			'Unhandled error during get all market',
		);

		return c.json(
			{
				success: false,
				message: 'Internal server error',
				error: error instanceof Error ? error.message : 'Unknown error',
			},
			500,
		);
	}
};

/**
 * fetch market or event from db for a category (Crypto, Cricket)
 * @param c Hono context
 * @returns json response
 */

export const getMarketsByCategory = async (c: Context) => {
	try {
		const categoryId = c.req.param('categoryId');

		if (!categoryId) {
			logger.warn(
				{
					context: 'GET_MARKETS_BY_CATEGORY_MISSING_PARAM',
				},
				'Missing categoryId in request',
			);
			return c.json(
				{
					success: false,
					message: 'categoryId is required',
				},
				400,
			);
		}

		const category = await prisma.category.findUnique({
			where: { id: categoryId },
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

		const markets = await prisma.market.findMany({
			where: {
				categoryId,
				status: 'OPEN',
			},
			orderBy: {
				createdAt: 'desc',
			},
			select: {
				id: true,
				title: true,
				categoryId: true,
				description: true,
				yesPrice: true,
				NoPrice: true,
				endTime: true,
				numberOfTraders: true,
				thumbnail: true,
				sourceOfTruth: true,
				status: true,
				symbol: true,
			},
		});

		return c.json(
			{
				success: true,
				message: 'Markets fetched successfully',
				data: markets,
			},
			200,
		);
	} catch (error) {
		logger.error(
			{
				alert: true,
				context: 'GET_MARKET_DETAILS_CONTROLLER_FAIL',
				error: error instanceof Error ? error.message : error,
				stack: error instanceof Error ? error.stack : undefined,
			},
			'Unhandled error during fetching markets by category',
		);

		return c.json(
			{
				success: false,
				message: 'Internal server error',
				error: error instanceof Error ? error.message : 'Unknown error',
			},
			500,
		);
	}
};

/**
 * Get Market details from engine and send back to clien which includes orderbook, timeline and activity of the market.
 * @param c Hono context
 * @returns Json response with market details
 */

export const getMarketDetails = async (c: Context) => {
	try {
		const symbol = c.req.param('symbol');

		if (!symbol) {
			logger.warn({
				context: 'GET_MARKET_DETAILS',
				reason: 'Missing symbol parameter',
			});
			return c.json(
				{
					success: false,
					message: 'Symbol parameter is required',
				},
				400,
			);
		}

		const response = await pushToQueue(EVENTS.GET_MARKET_WITH_SYMBOL, { symbol });

		if (response.error) {
			logger.error(
				{
					alert: true,
					context: 'GET_MARKET_DETAILS_ENGINE_ERROR',
					symbol,
					engineMessage: response.message || 'No message from engine',
					engineData: response.data || null,
				},
				'Engine failed to return market details',
			);

			return c.json(
				{
					success: false,
					message: 'Unable to fetch market details at the moment. Please try again later.',
					error: response.message || 'Unknown error message',
				},
				502,
			);
		}

		logger.info(
			{
				context: 'GET_MARKET_DETAILS_SUCCESS',
				symbol,
				engineMessage: response.message,
				dataPreview: response.data ? JSON.stringify(response.data).slice(0, 200) : null,
			},
			'Successfully retrieved market details from engine',
		);

		return c.json(
			{
				success: true,
				message: response.message || 'Market details retrieved successfully',
				data: response.data,
			},
			200,
		);
	} catch (error) {
		logger.error(
			{
				alert: true,
				context: 'GET_MARKET_DETAILS_CONTROLLER_FAIL',
				error: error instanceof Error ? error.message : error,
				stack: error instanceof Error ? error.stack : undefined,
			},
			'Unhandled error during getMarketDetails',
		);

		return c.json(
			{
				success: false,
				message: 'Internal server error',
				error: error instanceof Error ? error.message : 'Unknown error',
			},
			500,
		);
	}
};
