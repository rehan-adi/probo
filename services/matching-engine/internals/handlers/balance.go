package handlers

import (
	"matching-engine/internals/engine"
	"matching-engine/internals/types"

	"github.com/mitchellh/mapstructure"
	"github.com/rs/zerolog/log"
)

type InitBalanceDataRequest struct {
	UserId string  `json:"userId"`
	Amount float64 `json:"amount"`
	Locked float64 `json:"locked"`
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

	user.Balance.WalletBalance.Amount = data.Amount
	user.Balance.WalletBalance.Locked = data.Locked

	log.Info().
		Str("userId", data.UserId).
		Float64("balance", data.Amount).
		Float64("locked", data.Locked).
		Msg("User balance initialized in engine")

	return types.QueueResponse{
		ResponseId: payload.ResponseId,
		Status:     types.Success,
		Message:    "Balance initialized successfully",
	}
}

type GetBalanceDataRequest struct {
	UserId string `json:"userId"`
}

func GetBalance(payload types.QueuePayload) types.QueueResponse {

	var data GetBalanceDataRequest

	if err := mapstructure.Decode(payload.Data, &data); err != nil {
		log.Error().
			Err(err).
			Str("responseId", payload.ResponseId).
			Msg("Failed to decode payload data")
		return types.QueueResponse{
			ResponseId: payload.ResponseId,
			Status:     types.Error,
			Message:    "Invalid data structure",
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

	return types.QueueResponse{
		ResponseId: payload.ResponseId,
		Status:     types.Success,
		Message:    "Balance fetched successfully",
		Data:       user.Balance.WalletBalance.Amount,
	}

}

type DepositDataRequest struct {
	UserId string  `json:"userId"`
	Amount float64 `json:"amount"`
}

func Deposit(payload types.QueuePayload) types.QueueResponse {

	var data DepositDataRequest

	if err := mapstructure.Decode(payload.Data, &data); err != nil {
		log.Error().
			Err(err).
			Interface("payload", payload.Data).
			Msg("Failed to decode deposit payload")

		return types.QueueResponse{
			ResponseId: payload.ResponseId,
			Status:     types.Error,
			Retryable:  true,
			Message:    "Invalid format",
		}
	}

	engine.EngineInstance.UM.Lock()
	defer engine.EngineInstance.UM.Unlock()

	user, ok := engine.EngineInstance.User[data.UserId]

	if !ok {
		log.Error().
			Str("userId", data.UserId).
			Msg("User not found in deposit handler")
		return types.QueueResponse{
			ResponseId: payload.ResponseId,
			Status:     types.Error,
			Retryable:  false,
			Message:    "User not found",
		}
	}

	user.Balance.WalletBalance.Amount += data.Amount

	return types.QueueResponse{
		ResponseId: payload.ResponseId,
		Status:     types.Success,
		Message:    "Deposit processed successfully",
	}

}
