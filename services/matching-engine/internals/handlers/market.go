package handlers

import (
	"fmt"
	"matching-engine/internals/engine"
	"matching-engine/internals/types"
	"matching-engine/internals/utils"
	"time"

	"github.com/mitchellh/mapstructure"
	"github.com/rs/zerolog/log"
)

type CreateMarketDataRequest struct {
	ID              string  `mapstructure:"marketId"`
	Title           string  `mapstructure:"title"`
	Symbol          string  `mapstructure:"symbol"`
	YesPrice        float32 `mapstructure:"yesPrice"`
	NoPrice         float32 `mapstructure:"NoPrice"`
	EOS             string  `mapstructure:"eos"`
	Rules           string  `mapstructure:"rules"`
	Thumbnail       string  `mapstructure:"thumbnail"`
	CategoryId      string  `mapstructure:"categoryId"`
	StartDate       string  `mapstructure:"startDate"`
	EndDate         string  `mapstructure:"endDate"`
	SourceOfTruth   string  `mapstructure:"sourceOfTruth"`
	NumberOfTraders int16   `mapstructure:"numberOfTraders"`
}

type GetMarketDetailsDataRequest struct {
	Symbol string `json:"symbol"`
}

func CreateMarket(payload types.QueuePayload) types.QueueResponse {
	var data CreateMarketDataRequest

	if err := mapstructure.Decode(payload.Data, &data); err != nil {
		log.Error().
			Err(err).
			Str("responseId", payload.ResponseId).
			Msg("Failed to decode payload")
		return types.QueueResponse{
			ResponseId: payload.ResponseId,
			Status:     types.Error,
			Message:    "Invalid data structure",
			Retryable:  true,
		}
	}

	startTime, err := time.Parse(time.RFC3339, data.StartDate)

	if err != nil {
		log.Error().Err(err).Msg("Invalid startDate format")
		return types.QueueResponse{
			ResponseId: payload.ResponseId,
			Status:     types.Error,
			Message:    "Invalid startDate format",
			Retryable:  false,
		}
	}

	endTime, err := time.Parse(time.RFC3339, data.EndDate)

	if err != nil {
		log.Error().Err(err).Msg("Invalid endDate format")
		return types.QueueResponse{
			ResponseId: payload.ResponseId,
			Status:     types.Error,
			Message:    "Invalid endDate format",
			Retryable:  false,
		}
	}

	market := &types.Market{
		MarketId:        data.ID,
		Title:           data.Title,
		Symbol:          data.Symbol,
		YesPrice:        data.YesPrice,
		NoPrice:         data.NoPrice,
		Thumbnail:       data.Thumbnail,
		CategoryId:      data.CategoryId,
		NumberOfTraders: data.NumberOfTraders,
		Traders:         make(map[string]struct{}),
		Volume:          0,
		Status:          types.Open,
		Inbox:           make(chan types.MarketMessage, 100),
		OrderBook: &types.OrderBook{
			Yes: make([]*types.Order, 0),
			No:  make([]*types.Order, 0),
		},
		Overview: types.Overview{
			SourceOfTruth: data.SourceOfTruth,
			StartDate:     startTime,
			EndDate:       endTime,
			EOS:           data.EOS,
			Rules:         data.Rules,
		},
	}

	engine.EngineInstance.AddMarket(market)

	log.Info().
		Str("marketId", data.ID).
		Msg("Market created and added to engine")

	return types.QueueResponse{
		ResponseId: payload.ResponseId,
		Status:     types.Success,
		Message:    "Market created",
	}
}

func GetMarketDetails(payload types.QueuePayload) types.QueueResponse {

	var data GetMarketDetailsDataRequest

	if err := mapstructure.Decode(payload.Data, &data); err != nil {
		return types.QueueResponse{
			ResponseId: payload.ResponseId,
			Status:     types.Error,
			Message:    "Invalid format",
		}
	}

	engine.EngineInstance.MM.RLock()
	market, ok := engine.EngineInstance.Market[data.Symbol]
	engine.EngineInstance.MM.RUnlock()

	if !ok {
		return types.QueueResponse{
			ResponseId: payload.ResponseId,
			Status:     types.Error,
			Message:    "Market not found",
		}
	}

	orderBook, ok := engine.EngineInstance.GetOrderBook(market.Symbol)

	if !ok {
		orderBook = types.AggregatedOrderBook{}
		fmt.Println("Order book is empty")
	}

	log.Info().
		Str("marketId", market.MarketId).
		Int("YesOrders", len(orderBook.Yes)).
		Int("NoOrders", len(orderBook.No)).
		Msg("Fetched order book")

	return types.QueueResponse{
		ResponseId: payload.ResponseId,
		Status:     types.Success,
		Message:    "Market details fetched successfully",
		Data: struct {
			MarketId        string                    `json:"marketId"`
			Title           string                    `json:"title"`
			Symbol          string                    `json:"symbol"`
			YesPrice        float32                   `json:"yesPrice"`
			NoPrice         float32                   `json:"noPrice"`
			Thumbnail       string                    `json:"thumbnail"`
			EOS             string                    `json:"eos"`
			Rules           string                    `json:"rules"`
			Volume          float64                   `json:"volume"`
			Status          string                    `json:"status"`
			OrderBook       types.AggregatedOrderBook `json:"orderbook"`
			Overview        types.Overview            `json:"overview"`
			Activities      []types.Activity          `json:"activities"`
			Timeline        []types.PricePoint        `json:"timeline"`
			NumberOfTraders int16                     `json:"numberOfTraders"`
		}{
			MarketId:        market.MarketId,
			Title:           market.Title,
			Symbol:          market.Symbol,
			Volume:          market.Volume,
			YesPrice:        market.YesPrice,
			Thumbnail:       market.Thumbnail,
			EOS:             market.Overview.EOS,
			Rules:           market.Overview.Rules,
			NoPrice:         market.NoPrice,
			Status:          string(market.Status),
			OrderBook:       orderBook,
			Overview:        market.Overview,
			Activities:      market.Activities,
			Timeline:        market.Timeline,
			NumberOfTraders: market.NumberOfTraders,
		},
	}
}

type AddLiquidityDataRequest struct {
	UserId      string  `mapstructure:"userId"`
	Phone       string  `mapstructure:"phone"`
	MarketId    string  `mapstructure:"marketId"`
	Symbol      string  `mapstructure:"symbol"`
	Role        string  `mapstructure:"role"`
	PriceYes    float64 `mapstructure:"priceYes"`
	PriceNo     float64 `mapstructure:"priceNo"`
	QuantityYes int     `mapstructure:"quantityYes"`
	QuantityNo  int     `mapstructure:"quantityNo"`
}

func AddLiquidity(payload types.QueuePayload) types.QueueResponse {

	var data AddLiquidityDataRequest

	if err := mapstructure.Decode(payload.Data, &data); err != nil {
		log.Error().
			Err(err).
			Interface("payload", payload.Data).
			Msg("Failed to decode payload data request")
		return types.QueueResponse{
			ResponseId: payload.ResponseId,
			Status:     types.Error,
			Retryable:  false,
			Message:    "failed to validate payload data " + err.Error(),
		}
	}

	engine.EngineInstance.MM.RLock()
	market, ok := engine.EngineInstance.GetMarket(data.Symbol)
	engine.EngineInstance.MM.RUnlock()

	if !ok {
		return types.QueueResponse{
			ResponseId: payload.ResponseId,
			Status:     types.Error,
			Retryable:  false,
			Message:    "Market not found fuck you",
		}
	}

	if market.Status == types.Close {
		return types.QueueResponse{
			ResponseId: payload.ResponseId,
			Status:     types.Error,
			Retryable:  false,
			Message:    "Market is closed",
		}
	}

	replyBuyYes := make(chan interface{}, 1)
	replySellYes := make(chan interface{}, 1)
	replyBuyNo := make(chan interface{}, 1)
	replySellNo := make(chan interface{}, 1)

	yesOrderBuy := types.Order{
		OrderId:   utils.GenerateOrderID(),
		UserId:    data.UserId,
		MarketId:  data.MarketId,
		Symbol:    data.Symbol,
		Side:      types.Yes,
		Price:     data.PriceYes,
		Role:      types.Role(data.Role),
		Quantity:  data.QuantityYes,
		Action:    types.BUY,
		OrderType: types.LIMIT,
		Timestamp: time.Now().UTC(),
	}

	noOrderBuy := types.Order{
		OrderId:   utils.GenerateOrderID(),
		UserId:    data.UserId,
		MarketId:  data.MarketId,
		Symbol:    data.Symbol,
		Side:      types.No,
		Price:     data.PriceNo,
		Role:      types.Role(data.Role),
		Quantity:  data.QuantityNo,
		Action:    types.BUY,
		OrderType: types.LIMIT,
		Timestamp: time.Now().UTC(),
	}

	yesOrderSell := types.Order{
		OrderId:   utils.GenerateOrderID(),
		UserId:    data.UserId,
		MarketId:  data.MarketId,
		Symbol:    data.Symbol,
		Side:      types.Yes,
		Price:     data.PriceYes,
		Role:      types.Role(data.Role),
		Quantity:  data.QuantityYes,
		Action:    types.SELL,
		OrderType: types.LIMIT,
		Timestamp: time.Now().UTC(),
	}

	noOrderSell := types.Order{
		OrderId:   utils.GenerateOrderID(),
		UserId:    data.UserId,
		MarketId:  data.MarketId,
		Symbol:    data.Symbol,
		Side:      types.No,
		Price:     data.PriceNo,
		Role:      types.Role(data.Role),
		Quantity:  data.QuantityNo,
		Action:    types.SELL,
		OrderType: types.LIMIT,
		Timestamp: time.Now().UTC(),
	}

	market.Inbox <- types.MarketMessage{
		Type:      types.MarketPlaceOrder,
		Payload:   yesOrderBuy,
		ReplyChan: replyBuyYes,
	}
	market.Inbox <- types.MarketMessage{
		Type:      types.MarketPlaceOrder,
		Payload:   noOrderBuy,
		ReplyChan: replyBuyNo,
	}

	market.Inbox <- types.MarketMessage{
		Type:      types.MarketSellOrder,
		Payload:   yesOrderSell,
		ReplyChan: replySellYes,
	}

	market.Inbox <- types.MarketMessage{
		Type:      types.MarketSellOrder,
		Payload:   noOrderSell,
		ReplyChan: replySellNo,
	}

	respBuyYes, _ := (<-replyBuyYes).(types.OrderResponse)
	respSellYes, _ := (<-replySellYes).(types.OrderResponse)
	respBuyNo, _ := (<-replyBuyNo).(types.OrderResponse)
	respSellNo, _ := (<-replySellNo).(types.OrderResponse)

	return types.QueueResponse{
		ResponseId: payload.ResponseId,
		Status:     types.Success,
		Message:    "Liquidity added successfully",
		Data: map[string]interface{}{
			"yesBuy":  respBuyYes,
			"yesSell": respSellYes,
			"noBuy":   respBuyNo,
			"noSell":  respSellNo,
		},
	}

}
