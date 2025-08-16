package handlers

import (
	"matching-engine/internals/engine"
	"matching-engine/internals/types"

	"github.com/mitchellh/mapstructure"
	"github.com/rs/zerolog/log"
)

type AddReferralBonusDataRequest struct {
	UserId string  `json:"userId"`
	Amount float64 `json:"amount"`
}

func AddReferralBonus(payload types.QueuePayload) types.QueueResponse {
	var data AddReferralBonusDataRequest

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

	user, exists := engine.EngineInstance.User[data.UserId]
	if !exists {
		log.Error().
			Str("userId", data.UserId).
			Msg("User not found in engine")
		return types.QueueResponse{
			ResponseId: payload.ResponseId,
			Status:     types.Error,
			Message:    "User not found",
			Retryable:  false,
		}
	}

	user.Balance.WalletBalance.Amount += data.Amount

	log.Info().
		Str("userId", data.UserId).
		Float64("bonus", data.Amount).
		Msg("Referral bonus added to wallet")

	return types.QueueResponse{
		ResponseId: payload.ResponseId,
		Status:     types.Success,
		Message:    "Referral bonus added",
	}
}
