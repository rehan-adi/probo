package handlers

import (
	"trade-engine/internals/engine"
	"trade-engine/internals/types"

	"github.com/mitchellh/mapstructure"
	"github.com/rs/zerolog/log"
)

type InitBalanceDataRequest struct {
	UserId  string  `json:"userId"`
	Balance float64 `json:"balance"`
	Locked  float64 `json:"locked"`
}

func InitBalance(payload types.QueuePayload) types.QueueResponse {

	var data InitBalanceDataRequest

	if err := mapstructure.Decode(payload.Data, &data); err != nil {
		log.Error().
			Err(err).
			Str("responseId", payload.ResponseId).
			Msg("Failed to decode payload data")
		return types.QueueResponse{
			ResponseId: payload.ResponseId,
			Status:     types.Error,
			Message:    "Invalid data structure",
			Retryable:  true,
		}
	}

	engine.EngineInstance.UM.Lock()
	defer engine.EngineInstance.UM.Unlock()

	user, ok := engine.EngineInstance.User[data.UserId]

	if !ok {
		log.Error().
			Str("userId", data.UserId).
			Msg("User not found in engine memory")
		return types.QueueResponse{
			ResponseId: payload.ResponseId,
			Status:     types.Error,
			Message:    "user not found",
			Retryable:  false,
		}
	}

	user.Balance.WalletBalance.Amount = data.Balance
	user.Balance.WalletBalance.Locked = data.Locked

	log.Info().
		Str("userId", data.UserId).
		Float64("balance", data.Balance).
		Float64("locked", data.Locked).
		Msg("User balance initialized in engine")

	return types.QueueResponse{
		ResponseId: payload.ResponseId,
		Status:     types.Success,
		Message:    "Balance initialized in engine",
	}
}
