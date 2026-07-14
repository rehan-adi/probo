import { Context } from 'hono';
import { ENV } from '@/config/env';
import { logger } from '@/utils/logger';
import { prisma } from '@probo/database';
import { EVENTS } from '@/constants/constants';
import { pushToQueue } from '@/lib/redis/queue';
import { cashfree } from '@/lib/cashfree/client';

export const initPayment = async (c: Context) => {
	try {
		const userId = c.get('user').id;
		const { amount } = await c.req.json<{ amount: number }>();

		if (!amount || amount <= 0) {
			return c.json({ success: false, error: 'Invalid amount' }, 400);
		}

		const user = await prisma.user.findUnique({
			where: { id: userId },
		});

		if (!user) {
			return c.json({ success: false, error: 'User not found' }, 404);
		}

		const orderId = `order_${Date.now()}_${userId.slice(0, 8)}`;

		const response = await cashfree.PGCreateOrder({
			order_amount: amount,
			order_currency: "INR",
			order_id: orderId,
			customer_details: {
				customer_id: userId,
				customer_phone: user.phone,
				customer_email: user.email || "test@probo.com",
				customer_name: "Probo User"
			},
			order_meta: {
				return_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/wallet?order_id={order_id}`,
				notify_url: `${ENV.BACKEND_ORIGIN}/api/v1/payments/webhook`,
			}
		});

		return c.json({
			success: true,
			data: response.data
		}, 200);
	} catch (error) {
		logger.error({ error }, 'Failed to initialize payment');
		return c.json({ success: false, error: 'Internal server error' }, 500);
	}
};

export const paymentVerify = async (c: Context) => {
	try {
		const orderId = c.req.param('orderId');

		if (!orderId) {
			return c.json({ success: false, error: 'Missing orderId' }, 400);
		}

		const response = await cashfree.PGOrderFetchPayments(orderId);

		const isSuccess = response.data?.some(payment => payment.payment_status === 'SUCCESS');

		return c.json({
			success: true,
			paymentStatus: isSuccess ? 'SUCCESS' : 'PENDING'
		}, 200);

	} catch (error) {
		logger.error({ error }, 'Failed to verify payment');
		return c.json({ success: false, error: 'Internal server error' }, 500);
	}
};


export const paymentWebhook = async (c: Context) => {
	try {
		const signature = c.req.header('x-webhook-signature');
		const timestamp = c.req.header('x-webhook-timestamp');
		const rawBody = await c.req.text();

		try {
			cashfree.PGVerifyWebhookSignature(signature as string, rawBody, timestamp as string);
		} catch (err) {
			logger.error({ err }, 'Webhook signature verification failed');
			return c.json({ success: false, error: 'Invalid signature' }, 401);
		}

		const body = JSON.parse(rawBody);

		if (body.type === 'PAYMENT_SUCCESS_WEBHOOK') {
			const payment = body.data.payment;
			const amount = payment.payment_amount;
			const customerId = body.data.customer_details.customer_id;

			await prisma.$transaction(async (tx) => {
				const existing = await tx.ledgerEntry.findFirst({
					where: { referenceId: payment.cf_payment_id }
				});

				if (existing) {
					logger.info({ paymentId: payment.cf_payment_id }, 'Webhook already processed');
					return;
				}


				await tx.inrBalance.upsert({
					where: { userId: customerId },
					update: { balance: { increment: amount } },
					create: { userId: customerId, balance: amount, locked: 0 }
				});


				await tx.ledgerEntry.create({
					data: {
						fromAccount: 'PAYMENT_GATEWAY',
						toAccount: customerId,
						amount: amount,
						type: 'DEPOSIT',
						referenceId: payment.cf_payment_id
					}
				});

				await tx.transactionHistory.create({
					data: {
						userId: customerId,
						type: 'DEPOSIT',
						amount: amount,
						status: 'SUCCESS'
					}
				});
			});

			await pushToQueue(EVENTS.DEPOSIT_BALANCE, {
				userId: customerId,
				amount: amount
			});

			logger.info({ customerId, amount }, 'Payment processed successfully');
		}

		return c.json({ success: true }, 200);
	} catch (error) {
		logger.error({ error }, 'Failed to process webhook');
		return c.json({ success: false, error: 'Internal server error' }, 500);
	}
};
