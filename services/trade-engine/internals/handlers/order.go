package handlers

import (
	"trade-engine/internals/engine"
	"trade-engine/internals/types"

	"github.com/mitchellh/mapstructure"
)

type PlaceOrderDataRequest struct {
	UserId    string  `mapstructure:"userId"`
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
	ReplyChan chan types.PlaceOrderResponse
}

func PlaceOrder(payload types.QueuePayload) types.QueueResponse {

	var data PlaceOrderDataRequest

	if err := mapstructure.Decode(payload.Data, &data); err != nil {
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

	order := types.Order{
		UserId:    data.UserId,
		MarketId:  data.MarketId,
		Symbol:    data.Symbol,
		Side:      types.Side(data.Side),
		Price:     data.Price,
		Action:    types.Action(data.Action),
		OrderType: types.OrderType(data.OrderType),
		Quantity:  data.Quantity,
	}

	market.Inbox <- types.MarketMessage{
		Type:      types.MarketPlaceOrder,
		Payload:   order,
		ReplyChan: replyChannel,
	}

	rawResp := <-replyChannel

	placeOrderResp, ok := rawResp.(types.PlaceOrderResponse)
	if !ok {
		return types.QueueResponse{
			ResponseId: payload.ResponseId,
			Status:     types.Error,
			Message:    "Invalid response from market",
		}
	}

	// Convert PlaceOrderResponse -> QueueResponse
	status := types.Error
	if placeOrderResp.Success {
		status = types.Success
	}

	return types.QueueResponse{
		ResponseId: payload.ResponseId,
		Status:     status,
		Message:    placeOrderResp.Message,
		Data:       nil,
	}

}
