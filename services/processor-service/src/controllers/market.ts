import { logger } from '@/utils/logger';
import { prisma } from '@probo/database';

export const updateTradersCount = async (data: any) => {
	try {
		console.log(data);
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
		console.log('data is', data);
		await prisma.market.update({
			where: {
				id: data.marketId,
			},
			data: {
				yesPrice: data.yesPrice,
				NoPrice: data.noPrice,
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

export const recordActivity = async (data: any) => {
	try {
		logger.info({ data }, 'RECORD_ACTIVITY received');
		const { buyerId, sellerId, outcome, price, quantity, matchType } = data;

		// Skip malformed legacy messages in the queue to clear the backlog
		if (buyerId === 'System' || !data.marketId) {
			logger.info('Skipping malformed System message');
			return;
		}
		
		const qty = Number(quantity);
		const executionPrice = Number(price);
		
		// If outcome is Yes, buyer is buying Yes, seller is selling Yes
		// If outcome is No, buyer is buying No, seller is selling No
		const field = outcome === 'Yes' ? 'yes' : 'no';

		await prisma.$transaction(async (tx) => {
			if (matchType === 'STANDARD') {
				// Buyer: -Locked INR, +Shares
				await tx.inrBalance.updateMany({
					where: { userId: buyerId },
					data: { locked: { decrement: executionPrice * qty } }
				});
				// Upsert buyer stock
				const buyerStock = await tx.stockBalance.findFirst({ where: { userId: buyerId, marketId: data.marketId } });
				if (buyerStock) {
					await tx.stockBalance.update({
						where: { id: buyerStock.id },
						data: { [`${field}Quantity`]: { increment: qty } }
					});
				} else {
					await tx.stockBalance.create({
						data: { userId: buyerId, marketId: data.marketId, [`${field}Quantity`]: qty }
					});
				}

				// Seller: -Locked Shares, +Wallet INR
				await tx.stockBalance.updateMany({
					where: { userId: sellerId, marketId: data.marketId },
					data: { [`${field}Locked`]: { decrement: qty } }
				});
				await tx.inrBalance.updateMany({
					where: { userId: sellerId },
					data: { balance: { increment: executionPrice * qty } }
				});

				// Ledger entries
				await tx.ledgerEntry.create({
					data: { fromAccount: 'EXCHANGE_ESCROW', toAccount: sellerId, amount: executionPrice * qty, type: 'BET', referenceId: data.marketId }
				});
				
			} else if (matchType === 'MINT') {
				// Two buyers. buyerId = YesBuyer, sellerId = NoBuyer
				// Both lose Locked INR, both gain shares.
				const yesPrice = executionPrice;
				const noPrice = 10.0 - executionPrice;

				// Yes Buyer
				await tx.inrBalance.updateMany({
					where: { userId: buyerId },
					data: { locked: { decrement: yesPrice * qty } }
				});
				const yesStock = await tx.stockBalance.findFirst({ where: { userId: buyerId, marketId: data.marketId } });
				if (yesStock) {
					await tx.stockBalance.update({ where: { id: yesStock.id }, data: { yesQuantity: { increment: qty } } });
				} else {
					await tx.stockBalance.create({ data: { userId: buyerId, marketId: data.marketId, yesQuantity: qty } });
				}

				// No Buyer
				await tx.inrBalance.updateMany({
					where: { userId: sellerId },
					data: { locked: { decrement: noPrice * qty } }
				});
				const noStock = await tx.stockBalance.findFirst({ where: { userId: sellerId, marketId: data.marketId } });
				if (noStock) {
					await tx.stockBalance.update({ where: { id: noStock.id }, data: { noQuantity: { increment: qty } } });
				} else {
					await tx.stockBalance.create({ data: { userId: sellerId, marketId: data.marketId, noQuantity: qty } });
				}
				
			} else if (matchType === 'MERGE') {
				// Two sellers. Both lose Locked Shares, both gain Wallet INR.
				const yesPrice = executionPrice;
				const noPrice = 10.0 - executionPrice;

				// Yes Seller
				await tx.stockBalance.updateMany({
					where: { userId: buyerId, marketId: data.marketId },
					data: { yesLocked: { decrement: qty } }
				});
				await tx.inrBalance.updateMany({
					where: { userId: buyerId },
					data: { balance: { increment: yesPrice * qty } }
				});

				// No Seller
				await tx.stockBalance.updateMany({
					where: { userId: sellerId, marketId: data.marketId },
					data: { noLocked: { decrement: qty } }
				});
				await tx.inrBalance.updateMany({
					where: { userId: sellerId },
					data: { balance: { increment: noPrice * qty } }
				});

				// Ledger entries
				await tx.ledgerEntry.createMany({
					data: [
						{ fromAccount: 'EXCHANGE_ESCROW', toAccount: buyerId, amount: yesPrice * qty, type: 'BET', referenceId: data.marketId },
						{ fromAccount: 'EXCHANGE_ESCROW', toAccount: sellerId, amount: noPrice * qty, type: 'BET', referenceId: data.marketId }
					]
				});
			}
		});
	} catch (error) {
		logger.error({ error, data, context: 'RECORD_ACTIVITY_FAIL' }, 'Failed to record activity');
		throw error;
	}
};

export const updateMarketTimeline = async (data: any) => {
	try {
		logger.info({ data }, 'UPDATE_MARKET_TIMELINE received');
	} catch (error) {
		logger.error(
			{ error, data, context: 'UPDATE_MARKET_TIMELINE_FAIL' },
			'Failed to update timeline',
		);
		throw error;
	}
};

export const recordOrderPlaced = async (data: any) => {
	try {
		logger.info({ data }, 'ORDER_PLACED received');

		// Extract variables
		const { userId, marketId, side, action, price, originalQuantity } = data;
		const totalCost = Number(price) * Number(originalQuantity);

		await prisma.$transaction(async (tx) => {
			if (action === 'BUY') {
				// Lock INR
				await tx.inrBalance.updateMany({
					where: { userId },
					data: {
						balance: { decrement: totalCost },
						locked: { increment: totalCost },
					},
				});

				// Create Ledger Entry
				await tx.ledgerEntry.create({
					data: {
						fromAccount: userId,
						toAccount: 'EXCHANGE_ESCROW',
						amount: totalCost,
						type: 'BET',
						referenceId: marketId,
					},
				});
			} else {
				// SELL: Lock Stocks
				const field = side === 'Yes' ? 'yes' : 'no';
				await tx.stockBalance.updateMany({
					where: { userId, marketId },
					data: {
						[`${field}Quantity`]: { decrement: Number(originalQuantity) },
						[`${field}Locked`]: { increment: Number(originalQuantity) },
					},
				});
			}
		});

	} catch (error) {
		logger.error({ error, data, context: 'ORDER_PLACED_FAIL' }, 'Failed to record order placement');
		throw error;
	}
};

export const handleOrderCancelled = async (data: any) => {
	try {
		const { userId, refund, type, marketId } = data;
		const qty = Number(refund);

		await prisma.$transaction(async (tx) => {
			if (type === 'INR') {
				await tx.inrBalance.updateMany({
					where: { userId },
					data: {
						locked: { decrement: qty },
						balance: { increment: qty },
					},
				});
				await tx.ledgerEntry.create({
					data: { fromAccount: 'EXCHANGE_ESCROW', toAccount: userId, amount: qty, type: 'REFUND', referenceId: marketId || 'CANCEL' }
				});
			} else if (type === 'YES_STOCK' || type === 'NO_STOCK') {
				const field = type === 'YES_STOCK' ? 'yes' : 'no';
				await tx.stockBalance.updateMany({
					where: { userId, marketId },
					data: {
						[`${field}Locked`]: { decrement: qty },
						[`${field}Quantity`]: { increment: qty },
					},
				});
			}
		});
	} catch (error) {
		logger.error({ error, data }, 'Failed to process order cancellation');
		throw error;
	}
};

export const handleMarketResolved = async (data: any) => {
	try {
		const { marketId, result } = data;
		
		// If Cancel, refund initial investment? No, let's just use Yes/No winner.
		// A Yes share pays out 10. A No share pays out 10.
		if (result !== 'Yes' && result !== 'No') return;
		
		const field = result === 'Yes' ? 'yesQuantity' : 'noQuantity';

		const holders = await prisma.stockBalance.findMany({
			where: { marketId, [field]: { gt: 0 } },
		});

		await prisma.$transaction(async (tx) => {
			for (const holder of holders) {
				const payout = Number(holder[field]) * 10.0;
				
				// Add INR
				await tx.inrBalance.updateMany({
					where: { userId: holder.userId },
					data: { balance: { increment: payout } }
				});

				// Create Ledger Entry
				await tx.ledgerEntry.create({
					data: { fromAccount: 'EXCHANGE_ESCROW', toAccount: holder.userId, amount: payout, type: 'WINNINGS', referenceId: marketId }
				});
			}

			// Delete all stock balances for this market as it is closed
			await tx.stockBalance.deleteMany({
				where: { marketId }
			});
		});

	} catch (error) {
		logger.error({ error, data }, 'Failed to process market resolution');
		throw error;
	}
};
