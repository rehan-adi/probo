import { logger } from '@/libs/logger';
import { prisma } from '@probo/database';
import { redisPublisher } from '@/libs/redis/connection';

export const updateTradersCount = async (data: any) => {
	try {
		await prisma.market.update({
			where: {
				id: data.marketId,
			},
			data: {
				numberOfTraders: {
					increment: 1,
				},
			},
		});
	} catch (error) {
		logger.error(
			{
				alert: true,
				context: 'TRADERS_COUNT_DB_UPDATE_FAIL',
				error,
				data,
			},
			'Failed to update database for traders count',
		);
		throw error;
	}
};

export const updateStockPrice = async (data: any) => {
	try {
		await prisma.market.update({
			where: {
				id: data.marketId,
			},
			data: {
				yesPrice: data.yesPrice,
				noPrice: data.noPrice,
			},
		});
	} catch (error) {
		logger.error(
			{
				alert: true,
				context: 'STOCK_PRICE_DB_UPDATE_FAIL',
				error,
				data,
			},
			'Failed to update database for stock price',
		);
		throw error;
	}
};

export const handleMarketResolved = async (data: any) => {
	try {
		const { marketId, result } = data;

		if (!['YES', 'NO', 'CANCEL'].includes(result)) {
			logger.warn({ marketId, result }, 'Invalid market resolution result');
			return;
		}

		const payoutsToEngine: { userId: string; amount: number }[] = [];

		await prisma.$transaction(async (tx) => {
			// Update Market result and status
			await tx.market.update({
				where: { id: marketId },
				data: { result, status: 'CLOSED' },
			});

			const holders = await tx.position.findMany({
				where: { marketId },
			});

			for (const holder of holders) {
				let payout = 0;

				if (result === 'YES') {
					payout = Number(holder.yesQuantity) * 10.0;
				} else if (result === 'NO') {
					payout = Number(holder.noQuantity) * 10.0;
				} else if (result === 'CANCEL') {
					payout =
						Number(holder.yesInvested) +
						Number(holder.noInvested) -
						Number(holder.yesSellValue) -
						Number(holder.noSellValue);
				}

				if (payout > 0) {
					// Add INR to wallet
					await tx.wallet.update({
						where: { userId: holder.userId },
						data: { balance: { increment: payout } },
					});

					// Create Ledger Entry for winnings/refund
					await tx.ledgerEntry.create({
						data: {
							fromAccount: 'EXCHANGE_ESCROW',
							toAccount: holder.userId,
							amount: payout,
							type: result === 'CANCEL' ? 'REFUND' : 'WINNINGS',
							referenceId: marketId,
						},
					});

					payoutsToEngine.push({ userId: holder.userId, amount: payout });
				}
			}

			// Keep the position history, just don't delete them, maybe just zero out the balances?
			await tx.position.deleteMany({
				where: { marketId },
			});
		});

		// Push deposits to the engine so memory balances stay in sync
		for (const payout of payoutsToEngine) {
			await redisPublisher.lpush(
				'engine:queue',
				JSON.stringify({
					responseId: `payout-${marketId}-${payout.userId}`,
					eventType: 'DEPOSIT_BALANCE',
					data: {
						userId: payout.userId,
						amount: payout.amount,
					},
				}),
			);
		}
	} catch (error) {
		logger.error({ error, data }, 'Failed to process market resolution');
		throw error;
	}
};
