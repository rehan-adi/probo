package handlers

import (
	"matching-engine/internals/engine"
	"matching-engine/internals/types"

	"github.com/mitchellh/mapstructure"
	"github.com/rs/zerolog/log"
)

type CreateUserDataRequest struct {
	ID            string              `mapstructure:"id"`
	Name          string              `mapstructure:"name"`
	Username      string              `mapstructure:"username"`
	Phone         string              `mapstructure:"phone"`
	KycStatus     types.KycStatus     `mapstructure:"kycVerificationStatus"`
	PaymentStatus types.PaymentStatus `mapstructure:"paymentVerificationStatus"`
}

func CreateUser(payload types.QueuePayload) types.QueueResponse {

	var data CreateUserDataRequest

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

	displayName := data.Name
	if displayName == "" {
		displayName = data.Username
	}

	engine.EngineInstance.UM.Lock()
	defer engine.EngineInstance.UM.Unlock()

	if existingUser, exists := engine.EngineInstance.User[data.ID]; exists {
		if displayName != "" && existingUser.Name == "" {
			existingUser.Name = displayName
		}
		log.Warn().
			Str("id", data.ID).
			Str("name", existingUser.Name).
			Msg("User already exists in engine memory")
		return types.QueueResponse{
			ResponseId: payload.ResponseId,
			Status:     types.Success,
			Message:    "User already exists",
			Retryable:  false,
		}
	}

	user := &types.User{
		ID:                        data.ID,
		Name:                      displayName,
		Phone:                     data.Phone,
		KycVerificationStatus:     data.KycStatus,
		PaymentVerificationStatus: data.PaymentStatus,
		Balance: &types.Balance{
			WalletBalance: types.WalletBalance{
				Amount: 0.0,
				Locked: 0.0,
			},
			StockBalance: make(map[string]types.StockBalance),
		},
	}

	engine.EngineInstance.User[data.ID] = user

	log.Info().
		Str("id", data.ID).
		Msg("User added to engine memory")

	return types.QueueResponse{
		ResponseId: payload.ResponseId,
		Status:     types.Success,
		Message:    "User created in engine",
	}
}
