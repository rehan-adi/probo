package handlers

import (
	"matching-engine/internals/engine"
	"matching-engine/internals/services/kafka"
	"matching-engine/internals/types"

	"github.com/mitchellh/mapstructure"
)

type SplitMergeDataRequest struct {
	UserId   string `mapstructure:"userId"`
	MarketId string `mapstructure:"marketId"`
	Symbol   string `mapstructure:"symbol"`
	Quantity int    `mapstructure:"quantity"`
}

func SplitShares(payload types.QueuePayload) types.QueueResponse {
	var data SplitMergeDataRequest

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

	if data.Quantity <= 0 {
		return types.QueueResponse{
			ResponseId: payload.ResponseId,
			Status:     types.Error,
			Message:    "Quantity must be greater than 0",
		}
	}

	totalCost := float64(data.Quantity * 10)

	engine.EngineInstance.UM.Lock()
	user, exists := engine.EngineInstance.User[data.UserId]
	if !exists {
		engine.EngineInstance.UM.Unlock()
		return types.QueueResponse{
			ResponseId: payload.ResponseId,
			Status:     types.Error,
			Message:    "User not found",
		}
	}

	if user.Balance.WalletBalance.Amount < totalCost {
		engine.EngineInstance.UM.Unlock()
		return types.QueueResponse{
			ResponseId: payload.ResponseId,
			Status:     types.Error,
			Message:    "Insufficient balance",
		}
	}

	// Deduct balance
	user.Balance.WalletBalance.Amount -= totalCost

	// Add shares
	if user.Balance.StockBalance == nil {
		user.Balance.StockBalance = make(map[string]types.StockBalance)
	}
	stock := user.Balance.StockBalance[data.Symbol]
	stock.Yes += data.Quantity
	stock.No += data.Quantity
	user.Balance.StockBalance[data.Symbol] = stock

	engine.EngineInstance.UM.Unlock()

	// Notify DB processor to update postgres
	kafka.ProduceEventToDBProcessor("process_db", "SHARES_SPLIT", map[string]interface{}{
		"userId":   data.UserId,
		"marketId": data.MarketId,
		"symbol":   data.Symbol,
		"quantity": data.Quantity,
		"cost":     totalCost,
	})

	return types.QueueResponse{
		ResponseId: payload.ResponseId,
		Status:     types.Success,
		Message:    "Shares split successfully",
	}
}

func MergeShares(payload types.QueuePayload) types.QueueResponse {
	var data SplitMergeDataRequest

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

	if data.Quantity <= 0 {
		return types.QueueResponse{
			ResponseId: payload.ResponseId,
			Status:     types.Error,
			Message:    "Quantity must be greater than 0",
		}
	}

	totalRefund := float64(data.Quantity * 10)

	engine.EngineInstance.UM.Lock()
	user, exists := engine.EngineInstance.User[data.UserId]
	if !exists {
		engine.EngineInstance.UM.Unlock()
		return types.QueueResponse{
			ResponseId: payload.ResponseId,
			Status:     types.Error,
			Message:    "User not found",
		}
	}

	if user.Balance.StockBalance == nil {
		engine.EngineInstance.UM.Unlock()
		return types.QueueResponse{
			ResponseId: payload.ResponseId,
			Status:     types.Error,
			Message:    "No shares found",
		}
	}

	stock := user.Balance.StockBalance[data.Symbol]
	if stock.Yes < data.Quantity || stock.No < data.Quantity {
		engine.EngineInstance.UM.Unlock()
		return types.QueueResponse{
			ResponseId: payload.ResponseId,
			Status:     types.Error,
			Message:    "Insufficient YES or NO shares to merge",
		}
	}

	// Deduct shares
	stock.Yes -= data.Quantity
	stock.No -= data.Quantity
	user.Balance.StockBalance[data.Symbol] = stock

	// Add balance
	user.Balance.WalletBalance.Amount += totalRefund

	engine.EngineInstance.UM.Unlock()

	// Notify DB processor to update postgres
	kafka.ProduceEventToDBProcessor("process_db", "SHARES_MERGED", map[string]interface{}{
		"userId":   data.UserId,
		"marketId": data.MarketId,
		"symbol":   data.Symbol,
		"quantity": data.Quantity,
		"refund":   totalRefund,
	})

	return types.QueueResponse{
		ResponseId: payload.ResponseId,
		Status:     types.Success,
		Message:    "Shares merged successfully",
	}
}
