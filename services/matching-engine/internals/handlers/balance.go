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
			Interface("payload", payload.Data).
			Msg("Failed to decode payload data request")
		return types.QueueResponse{
			ResponseId: payload.ResponseId,
			Status:     types.Error,
			Retryable:  true,
			Message:    "Invalid request data for init balance",
		}
	}

	engine.EngineInstance.UM.RLock()
	user, exists := engine.EngineInstance.User[data.UserId]
	engine.EngineInstance.UM.RUnlock()

	if !exists {
		log.Error().
			Str("userId", data.UserId).
			Msg("User not found in InitBalance handler")
		return types.QueueResponse{
			ResponseId: payload.ResponseId,
			Status:     types.Error,
			Retryable:  false,
			Message:    "User not found. Please contact support team",
		}
	}

	user.Mutex.Lock()
	defer user.Mutex.Unlock()

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
			Interface("payload", payload.Data).
			Msg("Failed to decode payload data request")
		return types.QueueResponse{
			ResponseId: payload.ResponseId,
			Status:     types.Error,
			Retryable:  true,
			Message:    "Invalid request data for get balance",
		}
	}

	engine.EngineInstance.UM.RLock()
	user, exists := engine.EngineInstance.User[data.UserId]
	engine.EngineInstance.UM.RUnlock()

	if !exists {
		log.Error().
			Str("userId", data.UserId).
			Msg("User not found in GetBalance handler")
		return types.QueueResponse{
			ResponseId: payload.ResponseId,
			Status:     types.Error,
			Retryable:  false,
			Message:    "User not found. Please contact support team",
		}
	}

	return types.QueueResponse{
		ResponseId: payload.ResponseId,
		Status:     types.Success,
		Message:    "Balance fetched successfully",
		Data: map[string]interface{}{
			"userId": user.ID,
			"amount": user.Balance.WalletBalance.Amount,
			"locked": user.Balance.WalletBalance.Locked,
		},
	}

}

// Deposit handles user Deposit requests and updates balance safely.

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
			Msg("failed to decode Deposit data request")
		return types.QueueResponse{
			ResponseId: payload.ResponseId,
			Status:     types.Error,
			Retryable:  true,
			Message:    "Invalid request data for deposit",
		}
	}

	if data.Amount <= 0 {
		return types.QueueResponse{
			ResponseId: payload.ResponseId,
			Status:     types.Error,
			Retryable:  false,
			Message:    "Amount must be greater than 0",
		}
	}

	engine.EngineInstance.UM.RLock()
	user, exists := engine.EngineInstance.User[data.UserId]
	engine.EngineInstance.UM.RUnlock()

	if !exists {
		log.Error().
			Str("userId", data.UserId).
			Msg("User not found in Deposit handler")
		return types.QueueResponse{
			ResponseId: payload.ResponseId,
			Status:     types.Error,
			Retryable:  false,
			Message:    "User not found. Please contact support team",
		}
	}

	user.Mutex.Lock()
	defer user.Mutex.Unlock()

	user.Balance.WalletBalance.Amount += data.Amount

	log.Info().
		Str("userId", data.UserId).
		Float64("amount", data.Amount).
		Float64("newBalance", user.Balance.WalletBalance.Amount).
		Msg("Deposit processed")

	return types.QueueResponse{
		ResponseId: payload.ResponseId,
		Status:     types.Success,
		Message:    "Deposit processed successfully",
		Data: map[string]interface{}{
			"userId":           user.ID,
			"depositAmount":    data.Amount,
			"remainingBalance": user.Balance.WalletBalance.Amount,
		},
	}

}

// Withdraw handles user withdrawal requests and updates balance safely.
// if Kyc and Payment method is verified only then user can verify.

type WithdrawDataRequest struct {
	UserId string  `json:"userId"`
	Amount float64 `json:"amount"`
}

func Withdraw(payload types.QueuePayload) types.QueueResponse {

	var data WithdrawDataRequest

	if err := mapstructure.Decode(payload.Data, &data); err != nil {
		log.Error().
			Err(err).
			Interface("payload", payload.Data).
			Msg("failed to decode Withdraw data request")
		return types.QueueResponse{
			ResponseId: payload.ResponseId,
			Status:     types.Error,
			Retryable:  true,
			Message:    "Invalid request data for withdrawal",
		}
	}

	if data.Amount <= 0 {
		return types.QueueResponse{
			ResponseId: payload.ResponseId,
			Status:     types.Error,
			Retryable:  false,
			Message:    "Amount must be greater than 0",
		}
	}

	engine.EngineInstance.UM.RLock()
	user, exists := engine.EngineInstance.User[data.UserId]
	engine.EngineInstance.UM.RUnlock()

	if !exists {
		log.Error().
			Str("userId", data.UserId).
			Msg("User not found in Withdraw handler")
		return types.QueueResponse{
			ResponseId: payload.ResponseId,
			Status:     types.Error,
			Retryable:  false,
			Message:    "User not found. Please contact support team",
		}
	}

	user.Mutex.Lock()
	defer user.Mutex.Unlock()

	if user.KycVerificationStatus == types.KYC_VERIFIED && user.PaymentVerificationStatus == types.PAYMENT_VERIFIED {

		if user.Balance.WalletBalance.Amount < data.Amount {
			return types.QueueResponse{
				ResponseId: payload.ResponseId,
				Status:     types.Error,
				Retryable:  false,
				Message:    "Insufficient balance for withdrawal",
				Data: map[string]interface{}{
					"userId":  user.ID,
					"balance": user.Balance.WalletBalance.Amount,
				},
			}
		}

		user.Balance.WalletBalance.Amount -= data.Amount

		log.Info().
			Str("userId", data.UserId).
			Float64("amount", data.Amount).
			Float64("remainingBalance", user.Balance.WalletBalance.Amount).
			Msg("Withdrawal successful")

		return types.QueueResponse{
			ResponseId: payload.ResponseId,
			Status:     types.Success,
			Message:    "Withdrawal successful",
			Data: map[string]interface{}{
				"userId":           user.ID,
				"withdrawnAmount":  data.Amount,
				"remainingBalance": user.Balance.WalletBalance.Amount,
			},
		}
	} else {
		log.Warn().Msg("User is not verified")
		return types.QueueResponse{
			ResponseId: payload.ResponseId,
			Status:     types.Error,
			Retryable:  false,
			Message:    "Kyc and payment method is not verified. Please verify to withdraw money",
		}
	}
}
