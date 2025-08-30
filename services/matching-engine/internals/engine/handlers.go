package engine

import (
	"encoding/json"
	"matching-engine/internals/services/kafka"
	"matching-engine/internals/types"
	"matching-engine/internals/utils"
	"math"
	"sort"
	"time"

	"github.com/rs/zerolog/log"
)

func (e *Engine) handleBuyOrder(msg types.MarketMessage, market *types.Market) {

	order, ok := msg.Payload.(types.Order)

	if !ok {
		msg.ReplyChan <- types.OrderResponse{
			Success: false,
			Message: "invalid payload type for PLACE_ORDER",
		}
		return
	}

	isAdmin := order.Role == types.ADMIN

	e.UM.Lock()

	user, exists := e.User[order.UserId]

	if !exists {
		e.UM.Unlock()
		msg.ReplyChan <- types.OrderResponse{
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
		if !isAdmin {
			e.UM.Lock()

			if user.Balance.WalletBalance.Amount < totalCost {
				e.UM.Unlock()
				msg.ReplyChan <- types.OrderResponse{
					Success: false,
					Message: "insufficient wallet balance",
					Data:    user.Balance.WalletBalance.Amount,
				}
				return
			}
			user.Balance.WalletBalance.Amount -= totalCost
			user.Balance.WalletBalance.Locked += totalCost
			e.UM.Unlock()
		}
	}

	switch order.OrderType {

	case types.LIMIT:
		market.Mu.Lock()
		defer market.Mu.Unlock()

		var oppositeBook []*types.Order

		if order.Side == types.Yes {
			oppositeBook = market.OrderBook.Yes
		} else {
			oppositeBook = market.OrderBook.No
		}

		quantityToFill := order.Quantity

		var activities []types.Activity

		for i := 0; i < len(oppositeBook) && quantityToFill > 0; {
			oppOrder := oppositeBook[i]

			if oppOrder.Action != types.SELL {
				i++
				continue
			}

			remaining := oppOrder.Quantity - oppOrder.Filled

			if oppOrder.UserId == order.UserId {
				log.Debug().Str("oppOrderId", oppOrder.OrderId).Msg("Skip self-trade")
				i++
				continue
			}

			if order.Price < oppOrder.Price {
				break
			}

			availableQty := remaining
			tradeQty := quantityToFill

			if availableQty < tradeQty {
				tradeQty = availableQty
			}

			log.Debug().
				Str("oppOrderId", oppOrder.OrderId).
				Int("tradeQty", tradeQty).
				Msg("Executing trade (LIMIT BUY)")

			oppOrder.Filled += tradeQty
			quantityToFill -= tradeQty

			e.UM.Lock()
			buyer := e.User[order.UserId]
			seller := e.User[oppOrder.UserId]

			if order.Side == types.Yes {
				buyerStock := buyer.Balance.StockBalance[order.Symbol]
				buyerStock.Yes += tradeQty
				buyer.Balance.StockBalance[order.Symbol] = buyerStock
			} else {
				buyerStock := buyer.Balance.StockBalance[order.Symbol]
				buyerStock.No += tradeQty
				buyer.Balance.StockBalance[order.Symbol] = buyerStock
			}

			buyer.Balance.WalletBalance.Locked -= oppOrder.Price * float64(tradeQty)
			seller.Balance.WalletBalance.Amount += oppOrder.Price * float64(tradeQty)
			e.UM.Unlock()

			activities = append(activities, types.Activity{
				Buyerphone:  buyer.Phone,
				SellerPhone: seller.Phone,
				Outcome:     string(order.Side),
				Price:       oppOrder.Price,
				Quantity:    tradeQty,
				Timestamp:   time.Now(),
			})

			if oppOrder.Filled == oppOrder.Quantity {
				oppositeBook = append(oppositeBook[:i], oppositeBook[i+1:]...)
			} else {
				i++
			}
		}

		if order.Side == types.Yes {
			market.OrderBook.Yes = oppositeBook
		} else {
			market.OrderBook.No = oppositeBook
		}

		if quantityToFill > 0 {
			order.Quantity = quantityToFill
			if order.Side == types.Yes {
				market.OrderBook.Yes = append(market.OrderBook.Yes, &order)
				sort.Slice(market.OrderBook.Yes, func(i, j int) bool {
					return market.OrderBook.Yes[i].Price > market.OrderBook.Yes[j].Price
				})
			} else {
				market.OrderBook.No = append(market.OrderBook.No, &order)
				sort.Slice(market.OrderBook.No, func(i, j int) bool {
					return market.OrderBook.No[i].Price > market.OrderBook.No[j].Price
				})
			}
		}

		aggOrderBook := utils.AggregateOrderBook(market.OrderBook)
		probability := utils.GetYesProbability(aggOrderBook)

		yesPrice := math.Round(probability*10*2) / 2
		noPrice := math.Round((1-probability)*10*2) / 2

		priceChanged := yesPrice != float64(market.YesPrice) || noPrice != float64(market.NoPrice)
		market.YesPrice = float32(yesPrice)
		market.NoPrice = float32(noPrice)

		kafka.ProduceEventToDBProcessor(
			"process_db",
			string(types.UPDATE_STOCK_PRICE),
			map[string]interface{}{
				"marketId": order.MarketId,
				"yesPrice": yesPrice,
				"noPrice":  noPrice,
			},
		)

		if priceChanged {
			timeline := types.PricePoint{
				Timestamp: time.Now(),
				YesPrice:  yesPrice,
				NoPrice:   noPrice,
			}
			market.Timeline = append(market.Timeline, timeline)

			kafka.ProduceEventToDBProcessor(
				"process_db",
				string(types.UPDATE_MARKET_TIMELINE),
				map[string]interface{}{
					"marketId": order.MarketId,
					"timeline": timeline,
				},
			)
		}

		if len(activities) > 0 {
			market.Activities = append(market.Activities, activities...)
		}

		payload := map[string]interface{}{
			"symbol":     order.Symbol,
			"orderbook":  aggOrderBook,
			"yesPrice":   yesPrice,
			"noPrice":    noPrice,
			"timeline":   market.Timeline,
			"activities": activities,
		}

		data, err := json.Marshal(payload)
		if err != nil {
			log.Error().Err(err).Msg("failed to marshal payload for broadcast")
		} else {
			e.BroadcastMessage("stream:data", string(data))
		}

		for _, act := range activities {
			kafka.ProduceEventToDBProcessor(
				"process_db",
				string(types.RECORD_ACTIVITY),
				act,
			)
		}

		log.Info().
			Str("marketId", market.MarketId).
			Int("YesOrders", len(market.OrderBook.Yes)).
			Int("NoOrders", len(market.OrderBook.No)).
			Msg("LIMIT order processed")

	case types.MARKET:
		market.Mu.Lock()
		defer market.Mu.Unlock()

		var oppositeBook []*types.Order

		if order.Side == types.Yes {
			oppositeBook = market.OrderBook.Yes
		} else {
			oppositeBook = market.OrderBook.No
		}

		quantityToFill := order.Quantity
		var activities []types.Activity

		for i := 0; i < len(oppositeBook) && quantityToFill > 0; {
			oppOrder := oppositeBook[i]

			if oppOrder.Action != types.SELL {
				i++
				continue
			}

			remaining := oppOrder.Quantity - oppOrder.Filled

			if oppOrder.UserId == order.UserId {
				log.Debug().Str("oppOrderId", oppOrder.OrderId).Msg("Skip self-trade")
				i++
				continue
			}

			availableQty := remaining
			tradeQty := quantityToFill
			if availableQty < tradeQty {
				tradeQty = availableQty
			}

			log.Debug().
				Str("oppOrderId", oppOrder.OrderId).
				Int("tradeQty", tradeQty).
				Msg("Executing trade (MARKET BUY)")

			oppOrder.Filled += tradeQty
			quantityToFill -= tradeQty

			e.UM.Lock()

			buyer := e.User[order.UserId]
			seller := e.User[oppOrder.UserId]

			if order.Side == types.Yes {
				buyerStock := buyer.Balance.StockBalance[order.Symbol]
				buyerStock.Yes += tradeQty
				buyer.Balance.StockBalance[order.Symbol] = buyerStock
			} else {
				buyerStock := buyer.Balance.StockBalance[order.Symbol]
				buyerStock.No += tradeQty
				buyer.Balance.StockBalance[order.Symbol] = buyerStock
			}
			buyer.Balance.WalletBalance.Locked -= oppOrder.Price * float64(tradeQty)
			seller.Balance.WalletBalance.Amount += oppOrder.Price * float64(tradeQty)
			e.UM.Unlock()

			activities = append(activities, types.Activity{
				Buyerphone:  buyer.Phone,
				SellerPhone: seller.Phone,
				Outcome:     string(order.Side),
				Price:       oppOrder.Price,
				Quantity:    tradeQty,
				Timestamp:   time.Now(),
			})

			if oppOrder.Filled == oppOrder.Quantity {
				oppositeBook = append(oppositeBook[:i], oppositeBook[i+1:]...)
			} else {
				i++
			}
		}

		if order.Side == types.Yes {
			market.OrderBook.Yes = oppositeBook
		} else {
			market.OrderBook.No = oppositeBook
		}

		kafka.ProduceEventToDBProcessor(
			"process_db",
			string(types.ORDER_PLACED),
			map[string]interface{}{
				"orderId":           order.OrderId,
				"marketId":          order.MarketId,
				"symbol":            order.Symbol,
				"userId":            order.UserId,
				"side":              string(order.Side),
				"action":            string(order.Action),
				"price":             order.Price,
				"originalQuantity":  order.Quantity,
				"filledQuantity":    order.Quantity - quantityToFill,
				"remainingQuantity": quantityToFill,
				"timestamp":         time.Now(),
			},
		)

		aggOrderBook := utils.AggregateOrderBook(market.OrderBook)
		probability := utils.GetYesProbability(aggOrderBook)

		yesPrice := math.Round(probability*10*2) / 2
		noPrice := math.Round((1-probability)*10*2) / 2
		priceChanged := yesPrice != float64(market.YesPrice) || noPrice != float64(market.NoPrice)

		market.YesPrice = float32(yesPrice)
		market.NoPrice = float32(noPrice)

		if priceChanged {
			timeline := types.PricePoint{
				Timestamp: time.Now(),
				YesPrice:  yesPrice,
				NoPrice:   noPrice,
			}
			market.Timeline = append(market.Timeline, timeline)

			kafka.ProduceEventToDBProcessor(
				"process_db",
				string(types.UPDATE_MARKET_TIMELINE),
				map[string]interface{}{
					"marketId": order.MarketId,
					"timeline": timeline,
				},
			)
		}

		if len(activities) > 0 {
			market.Activities = append(market.Activities, activities...)
		}

		payload := map[string]interface{}{
			"symbol":     order.Symbol,
			"orderbook":  aggOrderBook,
			"yesPrice":   yesPrice,
			"noPrice":    noPrice,
			"timeline":   market.Timeline,
			"activities": activities,
		}

		data, _ := json.Marshal(payload)
		e.BroadcastMessage("stream:data", string(data))

		for _, act := range activities {
			kafka.ProduceEventToDBProcessor(
				"process_db",
				string(types.RECORD_ACTIVITY),
				act,
			)
		}

		log.Info().
			Str("marketId", market.MarketId).
			Int("YesOrders", len(market.OrderBook.Yes)).
			Int("NoOrders", len(market.OrderBook.No)).
			Msg("MARKET order processed")
	}

	if _, exists := market.Traders[order.UserId]; !exists {
		market.Traders[order.UserId] = struct{}{}
		market.NumberOfTraders++
		kafka.ProduceEventToDBProcessor(
			"process_db",
			string(types.INCREASE_TRADERS_COUNT),
			map[string]interface{}{
				"marketId": order.MarketId,
				"count":    1,
			},
		)
	}

	msg.ReplyChan <- types.OrderResponse{
		Success: true,
		Message: "order placed successfully",
		Data:    order,
	}
}

func (e *Engine) handleSellOrder(msg types.MarketMessage, market *types.Market) {
	order, ok := msg.Payload.(types.Order)

	if !ok {
		msg.ReplyChan <- types.OrderResponse{
			Success: false,
			Message: "invalid payload type for SELL_ORDER",
		}
		return
	}

	isAdmin := order.Role == types.ADMIN

	e.UM.RLock()
	user, exists := e.User[order.UserId]
	e.UM.RUnlock()

	if !exists {
		msg.ReplyChan <- types.OrderResponse{
			Success: false,
			Message: "User not found",
		}
		return
	}

	if !isAdmin {
		stock, ok := user.Balance.StockBalance[order.Symbol]

		if !ok {
			msg.ReplyChan <- types.OrderResponse{
				Success: false,
				Message: "User has no stock for this market",
			}
			return
		}

		var availableQty int

		if order.Side == types.Yes {
			availableQty = stock.Yes
		} else {
			availableQty = stock.No
		}

		if availableQty < order.Quantity {
			msg.ReplyChan <- types.OrderResponse{
				Success: false,
				Message: "Not enough stocks to sell.",
				Data:    availableQty,
			}
			return
		}

		e.UM.Lock()

		if order.Side == types.Yes {
			stock.Yes -= order.Quantity
		} else {
			stock.No -= order.Quantity
		}
		user.Balance.StockBalance[order.Symbol] = stock
		e.UM.Unlock()

	}

	e.MM.Lock()
	defer e.MM.Unlock()

	var oppositeBook []*types.Order

	if order.Side == types.Yes {
		oppositeBook = market.OrderBook.Yes
	} else {
		oppositeBook = market.OrderBook.No
	}

	quantityToSell := order.Quantity
	originalQuantity := order.Quantity
	var activities []types.Activity

	for i := 0; i < len(oppositeBook) && quantityToSell > 0; {
		oppOrder := oppositeBook[i]

		if oppOrder.Action != types.BUY {
			i++
			continue
		}

		remaining := oppOrder.Quantity - oppOrder.Filled

		if oppOrder.UserId == order.UserId {
			log.Debug().Str("oppOrderId", oppOrder.OrderId).Msg("Skip self-trade")
			i++
			continue
		}

		availableOppQty := remaining
		tradeQty := quantityToSell
		if availableOppQty < tradeQty {
			tradeQty = availableOppQty
		}

		log.Debug().
			Str("oppOrderId", oppOrder.OrderId).
			Int("tradeQty", tradeQty).
			Msg("Executing trade (SELL)")

		oppOrder.Filled += tradeQty
		quantityToSell -= tradeQty

		e.UM.Lock()

		buyer := e.User[oppOrder.UserId]
		seller := user

		if order.Side == types.Yes {
			buyerStock := buyer.Balance.StockBalance[order.Symbol]
			buyerStock.Yes += tradeQty
			buyer.Balance.StockBalance[order.Symbol] = buyerStock

		} else {
			buyerStock := buyer.Balance.StockBalance[order.Symbol]
			buyerStock.No += tradeQty
			buyer.Balance.StockBalance[order.Symbol] = buyerStock

		}

		seller.Balance.WalletBalance.Amount += oppOrder.Price * float64(tradeQty)
		buyer.Balance.WalletBalance.Locked -= oppOrder.Price * float64(tradeQty)
		e.UM.Unlock()

		activities = append(activities, types.Activity{
			Buyerphone:  buyer.Phone,
			SellerPhone: seller.Phone,
			Outcome:     string(order.Side),
			Price:       oppOrder.Price,
			Quantity:    tradeQty,
			Timestamp:   time.Now(),
		})

		if oppOrder.Filled == oppOrder.Quantity {
			oppositeBook = append(oppositeBook[:i], oppositeBook[i+1:]...)
		} else {
			i++
		}
	}

	if order.Side == types.Yes {
		market.OrderBook.Yes = oppositeBook
	} else {
		market.OrderBook.No = oppositeBook
	}

	if quantityToSell > 0 {
		order.Quantity = quantityToSell
		order.Filled = 0
		if order.Side == types.Yes {
			market.OrderBook.Yes = append(market.OrderBook.Yes, &order)
			sort.Slice(market.OrderBook.Yes, func(i, j int) bool {
				return market.OrderBook.Yes[i].Price > market.OrderBook.Yes[j].Price
			})
		} else {
			market.OrderBook.No = append(market.OrderBook.No, &order)
			sort.Slice(market.OrderBook.No, func(i, j int) bool {
				return market.OrderBook.No[i].Price > market.OrderBook.No[j].Price
			})
		}
	}

	if len(activities) > 0 {
		market.Activities = append(market.Activities, activities...)
	}

	kafka.ProduceEventToDBProcessor(
		"process_db",
		string(types.ORDER_PLACED),
		map[string]interface{}{
			"orderId":           order.OrderId,
			"marketId":          order.MarketId,
			"symbol":            order.Symbol,
			"userId":            order.UserId,
			"side":              string(order.Side),
			"action":            string(order.Action),
			"price":             order.Price,
			"originalQuantity":  originalQuantity,
			"filledQuantity":    originalQuantity - quantityToSell,
			"remainingQuantity": quantityToSell,
			"timestamp":         time.Now(),
		},
	)

	msg.ReplyChan <- types.OrderResponse{
		Success: true,
		Message: "Sell order processed",
		Data:    activities,
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
