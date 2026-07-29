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

export const recordTradeExecution = async (data: any) => {
	try {
		logger.info({ data }, 'TRADE_EXECUTED received');
		const {
			marketId,
			makerId,
			takerId,
			makerOrderId,
			takerOrderId,
			stockType,
			takerAction,
			price,
			quantity,
			matchType,
		} = data;

		// Skip malformed legacy messages in the queue to clear the backlog
		if (makerId === 'System' || !marketId) {
			logger.info('Skipping malformed System message');
			return;
		}

		const qty = Number(quantity);
		const executionPrice = Number(price);

		await prisma.$transaction(async (tx) => {
			// Insert immutable Trade record
			await tx.trade.create({
				data: {
					marketId,
					makerId,
					takerId,
					makerOrderId,
					takerOrderId,
					stockType,
					takerAction,
					price: executionPrice,
					quantity: qty,
					matchType,
				},
			});

			// Update Market Volume
			await tx.market.update({
				where: { id: marketId },
				data: { volume: { increment: qty * 10 } },
			});

			if (matchType === 'STANDARD') {
				if (takerAction === 'BUY') {
					// Taker buys stockType from Maker
					const field = stockType.toLowerCase();
					
					// Taker: -Locked INR, +Shares
					await tx.inrBalance.updateMany({
						where: { userId: takerId },
						data: { locked: { decrement: executionPrice * qty } },
					});
					const takerStock = await tx.stockBalance.findFirst({ where: { userId: takerId, marketId } });
					if (takerStock) {
						await tx.stockBalance.update({
							where: { id: takerStock.id },
							data: { [`${field}Quantity`]: { increment: qty } },
						});
					} else {
						await tx.stockBalance.create({
							data: { userId: takerId, marketId, [`${field}Quantity`]: qty },
						});
					}

					// Maker: -Locked Shares, +Wallet INR
					await tx.stockBalance.updateMany({
						where: { userId: makerId, marketId },
						data: { [`${field}Locked`]: { decrement: qty } },
					});
					await tx.inrBalance.updateMany({
						where: { userId: makerId },
						data: { balance: { increment: executionPrice * qty } },
					});

					// Ledger entries
					await tx.ledgerEntry.create({
						data: { fromAccount: 'EXCHANGE_ESCROW', toAccount: makerId, amount: executionPrice * qty, type: 'BET', referenceId: marketId },
					});
				} else {
					// Taker sells stockType to Maker
					const field = stockType.toLowerCase();

					// Taker: -Locked Shares, +Wallet INR
					await tx.stockBalance.updateMany({
						where: { userId: takerId, marketId },
						data: { [`${field}Locked`]: { decrement: qty } },
					});
					await tx.inrBalance.updateMany({
						where: { userId: takerId },
						data: { balance: { increment: executionPrice * qty } },
					});

					// Maker: -Locked INR, +Shares
					await tx.inrBalance.updateMany({
						where: { userId: makerId },
						data: { locked: { decrement: executionPrice * qty } },
					});
					const makerStock = await tx.stockBalance.findFirst({ where: { userId: makerId, marketId } });
					if (makerStock) {
						await tx.stockBalance.update({
							where: { id: makerStock.id },
							data: { [`${field}Quantity`]: { increment: qty } },
						});
					} else {
						await tx.stockBalance.create({
							data: { userId: makerId, marketId, [`${field}Quantity`]: qty },
						});
					}

					// Ledger entries
					await tx.ledgerEntry.create({
						data: { fromAccount: 'EXCHANGE_ESCROW', toAccount: takerId, amount: executionPrice * qty, type: 'BET', referenceId: marketId },
					});
				}
			} else if (matchType === 'MINT') {
				// Both are BUYERS.
				const yesPrice = stockType === 'YES' ? executionPrice : 10.0 - executionPrice;
				const noPrice = stockType === 'YES' ? 10.0 - executionPrice : executionPrice;
				
				const yesBuyerId = stockType === 'YES' ? takerId : makerId;
				const noBuyerId = stockType === 'YES' ? makerId : takerId;

				// Yes Buyer
				await tx.inrBalance.updateMany({
					where: { userId: yesBuyerId },
					data: { locked: { decrement: yesPrice * qty } },
				});
				const yesStock = await tx.stockBalance.findFirst({ where: { userId: yesBuyerId, marketId } });
				if (yesStock) {
					await tx.stockBalance.update({ where: { id: yesStock.id }, data: { yesQuantity: { increment: qty } } });
				} else {
					await tx.stockBalance.create({ data: { userId: yesBuyerId, marketId, yesQuantity: qty } });
				}

				// No Buyer
				await tx.inrBalance.updateMany({
					where: { userId: noBuyerId },
					data: { locked: { decrement: noPrice * qty } },
				});
				const noStock = await tx.stockBalance.findFirst({ where: { userId: noBuyerId, marketId } });
				if (noStock) {
					await tx.stockBalance.update({ where: { id: noStock.id }, data: { noQuantity: { increment: qty } } });
				} else {
					await tx.stockBalance.create({ data: { userId: noBuyerId, marketId, noQuantity: qty } });
				}
			} else if (matchType === 'MERGE') {
				// Both are SELLERS.
				const yesPrice = stockType === 'YES' ? executionPrice : 10.0 - executionPrice;
				const noPrice = stockType === 'YES' ? 10.0 - executionPrice : executionPrice;

				const yesSellerId = stockType === 'YES' ? takerId : makerId;
				const noSellerId = stockType === 'YES' ? makerId : takerId;

				// Yes Seller
				await tx.stockBalance.updateMany({
					where: { userId: yesSellerId, marketId },
					data: { yesLocked: { decrement: qty } },
				});
				await tx.inrBalance.updateMany({
					where: { userId: yesSellerId },
					data: { balance: { increment: yesPrice * qty } },
				});

				// No Seller
				await tx.stockBalance.updateMany({
					where: { userId: noSellerId, marketId },
					data: { noLocked: { decrement: qty } },
				});
				await tx.inrBalance.updateMany({
					where: { userId: noSellerId },
					data: { balance: { increment: noPrice * qty } },
				});

				// Ledger entries
				await tx.ledgerEntry.createMany({
					data: [
						{ fromAccount: 'EXCHANGE_ESCROW', toAccount: yesSellerId, amount: yesPrice * qty, type: 'BET', referenceId: marketId },
						{ fromAccount: 'EXCHANGE_ESCROW', toAccount: noSellerId, amount: noPrice * qty, type: 'BET', referenceId: marketId },
					],
				});
			}

			// Helper to update Order table
			const updateOrder = async (orderId: string, tradeQty: number) => {
				if (!orderId) return;
				const order = await tx.order.findUnique({ where: { id: orderId } });
				if (order) {
					const newTraded = order.filledQuantity + tradeQty;
					const newStatus = newTraded >= order.quantity ? 'COMPLETED' : 'PARTIAL';
					await tx.order.update({
						where: { id: orderId },
						data: { filledQuantity: newTraded, status: newStatus },
					});
				}
			};

			await updateOrder(makerOrderId, qty);
			await updateOrder(takerOrderId, qty);
		});
	} catch (error) {
		logger.error({ error, data, context: 'TRADE_EXECUTED_FAIL' }, 'Failed to record trade execution');
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
