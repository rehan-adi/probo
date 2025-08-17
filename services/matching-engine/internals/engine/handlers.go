package engine

import (
	"encoding/json"
	"matching-engine/internals/services/kafka"
	"matching-engine/internals/types"
	"matching-engine/internals/utils"
	"sort"
	"time"

	"github.com/rs/zerolog/log"
)

func (e *Engine) handlePlaceOrder(msg types.MarketMessage, market *types.Market) {

	order, ok := msg.Payload.(types.Order)

	if !ok {
		msg.ReplyChan <- types.PlaceOrderResponse{
			Success: false,
			Message: "invalid payload type for PLACE_ORDER",
		}
		return
	}

	e.UM.Lock()
	user, exists := e.User[order.UserId]

	if !exists {
		e.UM.Unlock()
		msg.ReplyChan <- types.PlaceOrderResponse{
			Success: false,
			Message: "user not found",
		}
		return
	}

	if user.Balance.StockBalance == nil {

		user.Balance.StockBalance = make(map[string]types.StockBalance)
	}
	e.UM.Unlock()

	totalCost := order.Price * float64(order.Quantity)

	if order.Action == types.BUY {
		e.UM.Lock()
		if user.Balance.WalletBalance.Amount < totalCost {
			e.UM.Unlock()
			msg.ReplyChan <- types.PlaceOrderResponse{
				Success: false,
				Message: "insufficient wallet balance",
			}
			return
		}
		user.Balance.WalletBalance.Amount -= totalCost
		user.Balance.WalletBalance.Locked += totalCost
		e.UM.Unlock()
	} else if order.Action == types.SELL {
		e.UM.Lock()
		stock := user.Balance.StockBalance[order.Symbol]
		if order.Side == types.Yes && stock.Yes < order.Quantity {
			e.UM.Unlock()
			msg.ReplyChan <- types.PlaceOrderResponse{
				Success: false,
				Message: "not enough YES shares",
			}
			return
		}
		if order.Side == types.No && stock.No < order.Quantity {
			e.UM.Unlock()
			msg.ReplyChan <- types.PlaceOrderResponse{
				Success: false,
				Message: "not enough NO shares",
			}
			return
		}
		if order.Side == types.Yes {
			stock.Yes -= order.Quantity
		} else {
			stock.No -= order.Quantity
		}
		user.Balance.StockBalance[order.Symbol] = stock
		e.UM.Unlock()
	}

	market.Mu.Lock()
	defer market.Mu.Unlock()

	if order.OrderType == types.MARKET {
		var oppositeBook []*types.Order
		if order.Side == types.Yes {
			oppositeBook = market.OrderBook.No
		} else {
			oppositeBook = market.OrderBook.Yes
		}

		qtyToFill := order.Quantity

		for i := 0; i < len(oppositeBook) && qtyToFill > 0; {
			bestMatch := oppositeBook[i]
			availableQty := bestMatch.Quantity - bestMatch.Filled
			tradeQty := qtyToFill
			if availableQty < tradeQty {
				tradeQty = availableQty
			}

			bestMatch.Filled += tradeQty
			qtyToFill -= tradeQty

			e.UM.Lock()
			buyer := e.User[order.UserId]
			seller := e.User[bestMatch.UserId]

			if order.Action == types.BUY {
				stock := buyer.Balance.StockBalance[order.Symbol]
				if order.Side == types.Yes {
					stock.Yes += tradeQty
				} else {
					stock.No += tradeQty
				}
				buyer.Balance.StockBalance[order.Symbol] = stock
				buyer.Balance.WalletBalance.Locked -= order.Price * float64(tradeQty)
				seller.Balance.WalletBalance.Amount += order.Price * float64(tradeQty)
			} else {
				stock := buyer.Balance.StockBalance[order.Symbol]
				if order.Side == types.Yes {
					stock.No += tradeQty
				} else {
					stock.Yes += tradeQty
				}
				buyer.Balance.StockBalance[order.Symbol] = stock
				seller.Balance.WalletBalance.Amount += order.Price * float64(tradeQty)
			}
			e.UM.Unlock()

			market.Activities = append(market.Activities, types.Activity{
				BuyerName:  buyer.Phone,
				SellerName: seller.Phone,
				Outcome:    string(order.Side),
				Price:      order.Price,
				Quantity:   tradeQty,
				Timestamp:  time.Now(),
			})

			if bestMatch.Filled == bestMatch.Quantity {
				oppositeBook = append(oppositeBook[:i], oppositeBook[i+1:]...)
			} else {
				i++
			}
		}

		if order.Side == types.Yes {
			market.OrderBook.No = oppositeBook
		} else {
			market.OrderBook.Yes = oppositeBook
		}

		aggOrderBook := utils.AggregateOrderBook(market.OrderBook)

		payload := map[string]interface{}{
			"symbol":    order.Symbol,
			"orderbook": aggOrderBook,
		}

		data, err := json.Marshal(payload)

		if err != nil {
			log.Error().Err(err).Msg("failed to marshal payload for broadcast")
		} else {
			e.BroadcastMessage("stream:data", string(data))
		}

		log.Info().
			Str("marketId", market.MarketId).
			Int("YesOrders", len(market.OrderBook.Yes)).
			Int("NoOrders", len(market.OrderBook.No)).
			Msg("Order book updated after MARKET order and broadcast to stream service")

	} else if order.OrderType == types.LIMIT {
		orderCopy := order

		if order.Side == types.Yes {
			market.OrderBook.Yes = append(market.OrderBook.Yes, &orderCopy)
			sort.Slice(market.OrderBook.Yes, func(i, j int) bool {
				return market.OrderBook.Yes[i].Price > market.OrderBook.Yes[j].Price
			})
		} else {
			market.OrderBook.No = append(market.OrderBook.No, &orderCopy)
			sort.Slice(market.OrderBook.No, func(i, j int) bool {
				return market.OrderBook.No[i].Price > market.OrderBook.No[j].Price
			})
		}

		aggOrderBook := utils.AggregateOrderBook(market.OrderBook)

		payload := map[string]interface{}{
			"symbol":    order.Symbol,
			"orderbook": aggOrderBook,
		}

		data, err := json.Marshal(payload)

		if err != nil {
			log.Error().Err(err).Msg("failed to marshal payload for broadcast")
		} else {
			e.BroadcastMessage("stream:data", string(data))
		}

		log.Info().
			Str("marketId", market.MarketId).
			Int("YesOrders", len(market.OrderBook.Yes)).
			Int("NoOrders", len(market.OrderBook.No)).
			Msg("Order book updated after LIMIT order")
	}

	if _, exists := market.Traders[order.UserId]; !exists {
		market.Traders[order.UserId] = struct{}{}
		market.NumberOfTraders++

		// push events to kafka for DB update
		err := kafka.ProduceEventToDBProcessor(
			"process_db",
			string(types.INCREASE_TRADERS_COUNT),
			map[string]interface{}{
				"marketId": order.MarketId,
				"count":    1,
			},
		)

		if err != nil {
			log.Error().Err(err).Msg("Failed to produce Kafka event")
		}

	}

	msg.ReplyChan <- types.PlaceOrderResponse{
		Success: true,
		Message: `order placed successfully`,
		Data:    order,
	}
}

func (e *Engine) GetOrderBook(symbol string) (types.AggregatedOrderBook, bool) {

	e.MM.RLock()
	market, ok := e.Market[symbol]
	e.MM.RUnlock()

	if !ok {
		return types.AggregatedOrderBook{}, false
	}

	replyChan := make(chan interface{})

	market.Inbox <- types.MarketMessage{
		Type:      types.MarketGetOrderBook,
		ReplyChan: replyChan,
	}

	resp := <-replyChan

	aggOrderBook, ok := resp.(types.AggregatedOrderBook)

	if !ok {
		return types.AggregatedOrderBook{}, false
	}
	return aggOrderBook, true
}
