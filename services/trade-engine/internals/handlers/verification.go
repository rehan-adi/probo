package handlers

import (
	"trade-engine/internals/engine"
	"trade-engine/internals/types"

	"github.com/mitchellh/mapstructure"
	"github.com/rs/zerolog/log"
)

type verificationDataRequest struct {
	UserId        string `mapstructure:"userId"`
	KycStatus     string `mapstructure:"kycStatus"`
	PaymentStatus string `mapstructure:"paymentStatus"`
}

func UpdateVerificationStatus(payload types.QueuePayload) types.QueueResponse {
	var data verificationDataRequest

	if err := mapstructure.Decode(payload.Data, &data); err != nil {
		log.Error().
			Err(err).
			Str("responseId", payload.ResponseId).
			Msg("Failed to decode payload data into DTO")
		return types.QueueResponse{
			ResponseId: payload.ResponseId,
			Status:     types.Error,
			Message:    "Invalid data structure",
			Retryable:  true,
		}
	}

	engine.EngineInstance.UM.RLock()
	defer engine.EngineInstance.UM.RUnlock()

	user, exists := engine.EngineInstance.User[data.UserId]

	if !exists {
		log.Warn().
			Str("userId", data.UserId).
			Msg("User not found in engine memory")
		return types.QueueResponse{
			ResponseId: payload.ResponseId,
			Status:     types.Error,
			Message:    "User not found",
			Retryable:  false,
		}
	}

	user.Mutex.Lock()
	defer user.Mutex.Unlock()

	if data.KycStatus == "VERIFIED" {
		user.KycVerificationStatus = types.KYC_VERIFIED
	} else {
		user.KycVerificationStatus = types.KYC_NOT_VERIFIED
	}

	if data.PaymentStatus == "VERIFIED" {
		user.PaymentVerificationStatus = types.PAYMENT_VERIFIED
	} else {
		user.PaymentVerificationStatus = types.PAYMENT_NOT_VERIFIED
	}

	log.Info().
		Str("userId", data.UserId).
		Msg("Updated user verification statuses")

	return types.QueueResponse{
		ResponseId: payload.ResponseId,
		Status:     types.Success,
		Message:    "Verification status updated",
	}
}
