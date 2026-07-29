package engine

import (
	"container/heap"
	"matching-engine/internals/types"
	"time"
)

// ProcessLimitOrder matches a LIMIT or MARKET order against the orderbook using synthetic matching.
func (e *Engine) ProcessLimitOrder(market *types.Market, order *types.Order, isMarketOrder bool) []types.TradeExecutedEvent {
	var trades []types.TradeExecutedEvent

	market.Mu.Lock()
	defer market.Mu.Unlock()

	for order.Filled < order.Quantity {
		var bestStandard *types.Order
		var bestSynthetic *types.Order

		if order.Side == types.Yes && order.Action == types.BUY {
			if market.OrderBook.YesAsks.Len() > 0 {
				bestStandard = market.OrderBook.YesAsks.OrderHeap[0]
			}
			if market.OrderBook.NoBids.Len() > 0 {
				bestSynthetic = market.OrderBook.NoBids.OrderHeap[0]
			}
		} else if order.Side == types.No && order.Action == types.BUY {
			if market.OrderBook.NoAsks.Len() > 0 {
				bestStandard = market.OrderBook.NoAsks.OrderHeap[0]
			}
			if market.OrderBook.YesBids.Len() > 0 {
				bestSynthetic = market.OrderBook.YesBids.OrderHeap[0]
			}
		} else if order.Side == types.Yes && order.Action == types.SELL {
			if market.OrderBook.YesBids.Len() > 0 {
				bestStandard = market.OrderBook.YesBids.OrderHeap[0]
			}
			if market.OrderBook.NoAsks.Len() > 0 {
				bestSynthetic = market.OrderBook.NoAsks.OrderHeap[0]
			}
		} else if order.Side == types.No && order.Action == types.SELL {
			if market.OrderBook.NoBids.Len() > 0 {
				bestStandard = market.OrderBook.NoBids.OrderHeap[0]
			}
			if market.OrderBook.YesAsks.Len() > 0 {
				bestSynthetic = market.OrderBook.YesAsks.OrderHeap[0]
			}
		}

		if bestStandard == nil && bestSynthetic == nil {
			break
		}

		var matchOrder *types.Order
		var isSynthetic bool
		var matchType string // standard, mint, or merge

		if bestStandard != nil && bestSynthetic == nil {
			matchOrder = bestStandard
			isSynthetic = false
		} else if bestSynthetic != nil && bestStandard == nil {
			matchOrder = bestSynthetic
			isSynthetic = true
		} else {
			synthPrice := 10.0 - bestSynthetic.Price
			if order.Action == types.BUY {
				if bestStandard.Price < synthPrice {
					matchOrder = bestStandard
					isSynthetic = false
				} else if synthPrice < bestStandard.Price {
					matchOrder = bestSynthetic
					isSynthetic = true
				} else {
					if bestStandard.Timestamp.Before(bestSynthetic.Timestamp) {
						matchOrder = bestStandard
						isSynthetic = false
					} else {
						matchOrder = bestSynthetic
						isSynthetic = true
					}
				}
			} else {
				if bestStandard.Price > synthPrice {
					matchOrder = bestStandard
					isSynthetic = false
				} else if synthPrice > bestStandard.Price {
					matchOrder = bestSynthetic
					isSynthetic = true
				} else {
					if bestStandard.Timestamp.Before(bestSynthetic.Timestamp) {
						matchOrder = bestStandard
						isSynthetic = false
					} else {
						matchOrder = bestSynthetic
						isSynthetic = true
					}
				}
			}
		}

		matchPrice := matchOrder.Price
		if isSynthetic {
			matchPrice = 10.0 - matchOrder.Price
		}

		if order.Action == types.BUY && order.Price < matchPrice {
			break
		} else if order.Action == types.SELL && order.Price > matchPrice {
			break
		}

		if matchOrder.UserId == order.UserId {
			popOrderFromHeap(market, matchOrder)
			continue
		}

		tradeQty := order.Quantity - order.Filled
		matchRemaining := matchOrder.Quantity - matchOrder.Filled
		if matchRemaining < tradeQty {
			tradeQty = matchRemaining
		}

		order.Filled += tradeQty
		matchOrder.Filled += tradeQty

		if order.Action == types.BUY {
			if isSynthetic {
				matchType = "MINT"
			} else {
				matchType = "STANDARD"
			}
		} else {
			if isSynthetic {
				matchType = "MERGE"
			} else {
				matchType = "STANDARD"
			}
		}

		e.settleTradeBalances(order, matchOrder, tradeQty, matchPrice, matchType)

		var makerId, takerId, makerOrderId, takerOrderId string
		takerId = order.UserId
		takerOrderId = order.OrderId
		makerId = matchOrder.UserId
		makerOrderId = matchOrder.OrderId

		trades = append(trades, types.TradeExecutedEvent{
			MarketId:      market.MarketId,
			MakerId:       makerId,
			TakerId:       takerId,
			MakerOrderId:  makerOrderId,
			TakerOrderId:  takerOrderId,
			StockType:     string(order.Side),
			TakerAction:   string(order.Action),
			Price:         matchPrice,
			Quantity:      tradeQty,
			Timestamp:     time.Now(),
			MatchType:     matchType,
		})

		if matchOrder.Filled == matchOrder.Quantity {
			popOrderFromHeap(market, matchOrder)
		}
	}

	if order.Filled < order.Quantity && !isMarketOrder {
		pushOrderToHeap(market, order)
	}

	// Refund unfilled portion for market buy orders
	if isMarketOrder && order.Filled < order.Quantity && order.Action == types.BUY {
		e.UM.Lock()
		u := e.User[order.UserId]
		refund := order.Price * float64(order.Quantity - order.Filled)
		u.Balance.WalletBalance.Locked -= refund
		u.Balance.WalletBalance.Amount += refund
		e.UM.Unlock()
	}

	return trades
}

func popOrderFromHeap(market *types.Market, order *types.Order) {
	if order.Side == types.Yes && order.Action == types.BUY {
		heap.Pop(market.OrderBook.YesBids)
	} else if order.Side == types.Yes && order.Action == types.SELL {
		heap.Pop(market.OrderBook.YesAsks)
	} else if order.Side == types.No && order.Action == types.BUY {
		heap.Pop(market.OrderBook.NoBids)
	} else if order.Side == types.No && order.Action == types.SELL {
		heap.Pop(market.OrderBook.NoAsks)
	}
}

func pushOrderToHeap(market *types.Market, order *types.Order) {
	if order.Side == types.Yes && order.Action == types.BUY {
		heap.Push(market.OrderBook.YesBids, order)
	} else if order.Side == types.Yes && order.Action == types.SELL {
		heap.Push(market.OrderBook.YesAsks, order)
	} else if order.Side == types.No && order.Action == types.BUY {
		heap.Push(market.OrderBook.NoBids, order)
	} else if order.Side == types.No && order.Action == types.SELL {
		heap.Push(market.OrderBook.NoAsks, order)
	}
}

func (e *Engine) settleTradeBalances(order, matchOrder *types.Order, qty int, executionPrice float64, matchType string) {
	e.UM.Lock()
	defer e.UM.Unlock()

	u1 := e.User[order.UserId]
	u2 := e.User[matchOrder.UserId]

	// Safeguard against nil StockBalance maps (e.g. AMM Bot loaded from snapshot or fresh)
	if u1.Balance.StockBalance == nil {
		u1.Balance.StockBalance = make(map[string]types.StockBalance)
	}
	if u2.Balance.StockBalance == nil {
		u2.Balance.StockBalance = make(map[string]types.StockBalance)
	}

	switch matchType {
	case "STANDARD":
		var buyer, seller *types.User
		var buyerSide types.Side
		if order.Action == types.BUY {
			buyer, seller = u1, u2
			buyerSide = order.Side
		} else {
			buyer, seller = u2, u1
			buyerSide = matchOrder.Side
		}

		buyerStock := buyer.Balance.StockBalance[order.Symbol]
		sellerStock := seller.Balance.StockBalance[order.Symbol]

		if buyerSide == types.Yes {
			buyerStock.Yes += qty
			sellerStock.Yes -= qty
		} else {
			buyerStock.No += qty
			sellerStock.No -= qty
		}

		buyer.Balance.StockBalance[order.Symbol] = buyerStock
		seller.Balance.StockBalance[order.Symbol] = sellerStock

		buyer.Balance.WalletBalance.Locked -= executionPrice * float64(qty)
		seller.Balance.WalletBalance.Amount += executionPrice * float64(qty)

	case "MINT":
		var yesBuyer, noBuyer *types.User
		if order.Side == types.Yes {
			yesBuyer, noBuyer = u1, u2
		} else {
			yesBuyer, noBuyer = u2, u1
		}

		yStock := yesBuyer.Balance.StockBalance[order.Symbol]
		yStock.Yes += qty
		yesBuyer.Balance.StockBalance[order.Symbol] = yStock
		yesBuyer.Balance.WalletBalance.Locked -= executionPrice * float64(qty) 

		nStock := noBuyer.Balance.StockBalance[order.Symbol]
		nStock.No += qty
		noBuyer.Balance.StockBalance[order.Symbol] = nStock
		noBuyer.Balance.WalletBalance.Locked -= (10.0 - executionPrice) * float64(qty)

	case "MERGE":
		var yesSeller, noSeller *types.User
		if order.Side == types.Yes {
			yesSeller, noSeller = u1, u2
		} else {
			yesSeller, noSeller = u2, u1
		}

		yStock := yesSeller.Balance.StockBalance[order.Symbol]
		yStock.Yes -= qty
		yesSeller.Balance.StockBalance[order.Symbol] = yStock
		yesSeller.Balance.WalletBalance.Amount += executionPrice * float64(qty)

		nStock := noSeller.Balance.StockBalance[order.Symbol]
		nStock.No -= qty
		noSeller.Balance.StockBalance[order.Symbol] = nStock
		noSeller.Balance.WalletBalance.Amount += (10.0 - executionPrice) * float64(qty)
	}
}


