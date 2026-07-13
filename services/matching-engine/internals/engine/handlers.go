package engine

import (
	"encoding/json"
	"matching-engine/internals/services/kafka"
	"matching-engine/internals/types"
	"matching-engine/internals/utils"
	"math"
	"time"

	"github.com/rs/zerolog/log"
)

func (e *Engine) handleOrder(msg types.MarketMessage, market *types.Market) {
	order, ok := msg.Payload.(types.Order)
	if !ok {
		msg.ReplyChan <- types.OrderResponse{Success: false, Message: "invalid payload"}
		return
	}

	isAdmin := order.Role == types.ADMIN
	e.UM.Lock()
	user, exists := e.User[order.UserId]
	if !exists {
		e.UM.Unlock()
		msg.ReplyChan <- types.OrderResponse{Success: false, Message: "user not found"}
		return
	}

	user.LastActive = time.Now()
	
	if user.Balance.StockBalance == nil {
		user.Balance.StockBalance = make(map[string]types.StockBalance)
	}

	// Risk Check
	isMarketOrder := order.OrderType == types.MARKET
	if order.Action == types.BUY {
		if isMarketOrder {
			order.Price = 10.0
		}
		totalCost := order.Price * float64(order.Quantity)
		if !isAdmin {
			if user.Balance.WalletBalance.Amount < totalCost {
				e.UM.Unlock()
				msg.ReplyChan <- types.OrderResponse{Success: false, Message: "insufficient balance", Data: user.Balance.WalletBalance.Amount}
				return
			}
			user.Balance.WalletBalance.Amount -= totalCost
			user.Balance.WalletBalance.Locked += totalCost
		}
	} else { // SELL
		if isMarketOrder {
			order.Price = 0.0
		}
		if !isAdmin {
			stock := user.Balance.StockBalance[order.Symbol]
			availableQty := stock.Yes
			if order.Side == types.No {
				availableQty = stock.No
			}
			if availableQty < order.Quantity {
				e.UM.Unlock()
				msg.ReplyChan <- types.OrderResponse{Success: false, Message: "insufficient stocks", Data: availableQty}
				return
			}
			if order.Side == types.Yes {
				stock.Yes -= order.Quantity
			} else {
				stock.No -= order.Quantity
			}
			user.Balance.StockBalance[order.Symbol] = stock
		}
	}
	e.UM.Unlock()

	// Track Traders
	if _, exists := market.Traders[order.UserId]; !exists {
		market.Traders[order.UserId] = struct{}{}
		market.NumberOfTraders++
		kafka.ProduceEventToDBProcessor("process_db", string(types.INCREASE_TRADERS_COUNT), map[string]interface{}{"marketId": order.MarketId, "count": 1})
	}

	// Match Engine execution
	activities := e.ProcessLimitOrder(market, &order, isMarketOrder)

	// Post trade stuff
	kafka.ProduceEventToDBProcessor("process_db", string(types.ORDER_PLACED), map[string]interface{}{
		"orderId": order.OrderId, "marketId": order.MarketId, "symbol": order.Symbol,
		"userId": order.UserId, "side": string(order.Side), "action": string(order.Action),
		"price": order.Price, "originalQuantity": order.Quantity, "filledQuantity": order.Filled,
		"timestamp": time.Now(),
	})

	if len(activities) > 0 {
		market.Activities = append(market.Activities, activities...)
		for _, act := range activities {
			kafka.ProduceEventToDBProcessor("process_db", string(types.RECORD_ACTIVITY), act)
		}
	}

	// Broadcast Orderbook update
	market.Mu.RLock()
	aggOrderBook := utils.AggregateOrderBook(market.OrderBook)
	market.Mu.RUnlock()
	probability := utils.GetYesProbability(aggOrderBook)
	yesPrice := math.Round(probability*10*2) / 2
	noPrice := math.Round((1-probability)*10*2) / 2
	
	if yesPrice != float64(market.YesPrice) || noPrice != float64(market.NoPrice) {
		market.YesPrice = float32(yesPrice)
		market.NoPrice = float32(noPrice)
		timeline := types.PricePoint{Timestamp: time.Now(), YesPrice: yesPrice, NoPrice: noPrice}
		market.Timeline = append(market.Timeline, timeline)
		kafka.ProduceEventToDBProcessor("process_db", string(types.UPDATE_MARKET_TIMELINE), map[string]interface{}{
			"marketId": order.MarketId, "timeline": timeline,
		})
		kafka.ProduceEventToDBProcessor("process_db", string(types.UPDATE_STOCK_PRICE), map[string]interface{}{
			"marketId": order.MarketId, "yesPrice": yesPrice, "noPrice": noPrice,
		})
	}

	payload := map[string]interface{}{
		"symbol": order.Symbol, "orderbook": aggOrderBook,
		"yesPrice": yesPrice, "noPrice": noPrice,
		"timeline": market.Timeline, "activities": activities,
	}
	data, err := json.Marshal(payload)
	if err != nil {
		log.Error().Err(err).Msg("failed to marshal payload")
	} else {
		e.BroadcastMessage("stream:data", string(data))
	}

	log.Info().Str("marketId", market.MarketId).Str("type", string(order.OrderType)).Int("filled", order.Filled).Msg("Order processed")

	msg.ReplyChan <- types.OrderResponse{Success: true, Message: "order processed", Data: order}
}

func (e *Engine) GetOrderBook(symbol string) (types.AggregatedOrderBook, bool) {
	e.MM.RLock()
	market, ok := e.Market[symbol]
	e.MM.RUnlock()

	if !ok {
		return types.AggregatedOrderBook{}, false
	}

	replyChan := make(chan interface{})
	market.Inbox <- types.MarketMessage{Type: types.MarketGetOrderBook, ReplyChan: replyChan}
	resp := <-replyChan

	aggOrderBook, ok := resp.(types.AggregatedOrderBook)
	if !ok {
		return types.AggregatedOrderBook{}, false
	}
	return aggOrderBook, true
}
