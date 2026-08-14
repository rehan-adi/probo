package handlers

import (
	"matching-engine/internals/engine"
	"matching-engine/internals/types"
	"matching-engine/internals/utils"
	"time"

	"github.com/mitchellh/mapstructure"
)

type BuyOrderDataRequest struct {
	UserId    string  `mapstructure:"userId"`
	OrderId   string  `mapstructure:"orderId"`
	MarketId  string  `mapstructure:"marketId"`
	Side      string  `mapstructure:"side"`
	Symbol    string  `mapstructure:"symbol"`
	Price     float64 `mapstructure:"price"`
	Action    string  `mapstructure:"action"`
	OrderType string  `mapstructure:"orderType"`
	Quantity  int     `mapstructure:"quantity"`
}

type PlaceOrderMessage struct {
	Order     types.Order
	ReplyChan chan types.OrderResponse
}

func BuyOrder(payload types.QueuePayload) types.QueueResponse {

	var data BuyOrderDataRequest

	if err := mapstructure.Decode(payload.Data, &data); err != nil {
		return types.QueueResponse{
			ResponseId: payload.ResponseId,
			Status:     types.Error,
			Retryable:  false,
			Message:    "failed to validate payload data " + err.Error(),
		}
	}

	market, ok := engine.EngineInstance.GetMarket(data.Symbol)

	if !ok {
		return types.QueueResponse{
			ResponseId: payload.ResponseId,
			Status:     types.Error,
			Message:    "Market not found",
		}
	}

	if market.Status == types.Close {
		return types.QueueResponse{
			ResponseId: payload.ResponseId,
			Status:     types.Error,
			Message:    "Market is closed",
		}
	}

	replyChannel := make(chan interface{})

	orderId := data.OrderId
	if orderId == "" {
		orderId = utils.GenerateOrderID()
	}

	order := types.Order{
		UserId:    data.UserId,
		OrderId:   orderId,
		MarketId:  data.MarketId,
		Symbol:    data.Symbol,
		Side:      types.Side(data.Side),
		Price:     data.Price,
		Action:    types.Action(data.Action),
		OrderType: types.OrderType(data.OrderType),
		Quantity:  data.Quantity,
		Timestamp: time.Now().UTC(),
	}

	market.Inbox <- types.MarketMessage{
		Type:      types.MarketPlaceOrder,
		Payload:   order,
		ReplyChan: replyChannel,
	}

	rawResp := <-replyChannel

	placeOrderResp, ok := rawResp.(types.OrderResponse)

	if !ok {
		return types.QueueResponse{
			ResponseId: payload.ResponseId,
			Status:     types.Error,
			Message:    "Invalid response from market, having internal issues.",
		}
	}

	status := types.Error

	if placeOrderResp.Success {
		status = types.Success
	}

	return types.QueueResponse{
		ResponseId: payload.ResponseId,
		Status:     status,
		Message:    placeOrderResp.Message,
		Data:       placeOrderResp.Data,
	}

}

type SellOrderDataRequest struct {
	UserId    string  `mapstructure:"userId"`
	MarketId  string  `mapstructure:"marketId"`
	OrderId   string  `mapstructure:"orderId"`
	Symbol    string  `mapstructure:"symbol"`
	Side      string  `mapstructure:"side"`
	Price     float64 `mapstructure:"price"`
	Action    string  `mapstructure:"action"`
	OrderType string  `mapstructure:"orderType"`
	Quantity  int     `mapstructure:"quantity"`
}

func SellOrder(payload types.QueuePayload) types.QueueResponse {

	var data SellOrderDataRequest

	if err := mapstructure.Decode(payload.Data, &data); err != nil {
		return types.QueueResponse{
			ResponseId: payload.ResponseId,
			Status:     types.Error,
			Retryable:  false,
			Message:    "failed to validate payload data " + err.Error(),
		}
	}

	market, ok := engine.EngineInstance.GetMarket(data.Symbol)

	if !ok {
		return types.QueueResponse{
			ResponseId: payload.ResponseId,
			Status:     types.Error,
			Retryable:  false,
			Message:    "Market not found",
		}
	}

	if market.Status == types.Close {
		return types.QueueResponse{
			ResponseId: payload.ResponseId,
			Status:     types.Error,
			Message:    "Market is closed",
		}
	}

	replyChannel := make(chan interface{})

	orderId := data.OrderId
	if orderId == "" {
		orderId = utils.GenerateOrderID()
	}

	order := types.Order{
		UserId:    data.UserId,
		OrderId:   orderId,
		MarketId:  data.MarketId,
		Symbol:    data.Symbol,
		Side:      types.Side(data.Side),
		Price:     data.Price,
		Action:    types.SELL,
		OrderType: types.OrderType(data.OrderType),
		Quantity:  data.Quantity,
		Timestamp: time.Now().UTC(),
	}

	market.Inbox <- types.MarketMessage{
		Type:      types.MarketSellOrder,
		Payload:   order,
		ReplyChan: replyChannel,
	}

	rawResp := <-replyChannel

	placeOrderResp, ok := rawResp.(types.OrderResponse)

	if !ok {
		return types.QueueResponse{
			ResponseId: payload.ResponseId,
			Status:     types.Error,
			Message:    "Invalid response from market, having internal issues.",
		}
	}

	status := types.Error

	if placeOrderResp.Success {
		status = types.Success
	}

	return types.QueueResponse{
		ResponseId: payload.ResponseId,
		Status:     status,
		Message:    placeOrderResp.Message,
		Data:       placeOrderResp.Data,
	}

}

func CancelOrder(payload types.QueuePayload) types.QueueResponse {
	var data types.CancelOrderPayload

	if err := mapstructure.Decode(payload.Data, &data); err != nil {
		return types.QueueResponse{
			ResponseId: payload.ResponseId,
			Status:     types.Error,
			Retryable:  false,
			Message:    "failed to validate payload data " + err.Error(),
		}
	}

	market, ok := engine.EngineInstance.GetMarket(data.Symbol)

	if !ok {
		return types.QueueResponse{
			ResponseId: payload.ResponseId,
			Status:     types.Error,
			Retryable:  false,
			Message:    "Market not found",
		}
	}

	if market.Status == types.Close {
		return types.QueueResponse{
			ResponseId: payload.ResponseId,
			Status:     types.Error,
			Message:    "Market is closed",
		}
	}

	replyChannel := make(chan interface{})

	market.Inbox <- types.MarketMessage{
		Type:      types.MarketCancelOrder,
		Payload:   data,
		ReplyChan: replyChannel,
	}

	rawResp := <-replyChannel
	resp, ok := rawResp.(types.OrderResponse)

	if !ok {
		return types.QueueResponse{
			ResponseId: payload.ResponseId,
			Status:     types.Error,
			Message:    "Invalid response from market, having internal issues.",
		}
	}

	status := types.Error
	if resp.Success {
		status = types.Success
	}

	return types.QueueResponse{
		ResponseId: payload.ResponseId,
		Status:     status,
		Message:    resp.Message,
	}
}
