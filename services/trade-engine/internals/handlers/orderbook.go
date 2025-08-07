package handlers

import (
	"fmt"
	"trade-engine/internals/engine"
	"trade-engine/internals/types"

	"github.com/mitchellh/mapstructure"
)

type GetOrderBookRequest struct {
	MarketId string `mapstructure:"marketId"`
}

func GetOrderBook(payload types.QueuePayload) types.QueueResponse {
	var req GetOrderBookRequest

	if err := mapstructure.Decode(payload.Data, &req); err != nil {
		return types.QueueResponse{
			ResponseId: payload.ResponseId,
			Status:     types.Error,
			Message:    "Invalid request data",
			Retryable:  false,
		}
	}

	market, ok := engine.EngineInstance.GetMarket(req.MarketId)

	if !ok {
		return types.QueueResponse{
			ResponseId: payload.ResponseId,
			Status:     types.Error,
			Message:    fmt.Sprintf("Market %s not found", req.MarketId),
			Retryable:  false,
		}
	}

	market.Mu.RLock()
	defer market.Mu.RUnlock()

	return types.QueueResponse{
		ResponseId: payload.ResponseId,
		Status:     types.Success,
		Message:    "Order book fetched successfully",
		Data:       market.OrderBook,
	}
}
