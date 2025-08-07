package router

import (
	"trade-engine/internals/handlers"
	"trade-engine/internals/types"

	"github.com/rs/zerolog/log"
)

func RouteEvent(payload types.QueuePayload) types.QueueResponse {

	switch payload.EventType {

	case "CREATE_USER":
		return handlers.CreateUser(payload)

	case "INIT_BALANCE":
		return handlers.InitBalance(payload)

	case "REFERRAL_CREDIT":
		return handlers.AddReferralBonus(payload)

	case "VERIFICATION_STATUS_UPDATE":
		return handlers.UpdateVerificationStatus(payload)

	case "GET_BALANCE":
		return handlers.GetBalance(payload)

	case "DEPOSIT_BALANCE":
		return handlers.Deposit(payload)

	case "CREATE_MARKET":
		return handlers.CreateMarket(payload)

	case "GET_MARKETS":
		return handlers.GetAllMarkets()

	// case "GET_ORDERBOOK":
	// 	return handlers.GetOrderBook(payload)

	default:
		log.Warn().Str("eventType", payload.EventType).Msg("Unhandled event type")
		return types.QueueResponse{
			ResponseId: payload.ResponseId,
			Status:     "error",
			Message:    "Unhandled event type: " + payload.EventType,
		}
	}
}
