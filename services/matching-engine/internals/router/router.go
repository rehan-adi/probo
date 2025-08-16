package router

import (
	"matching-engine/internals/handlers"
	"matching-engine/internals/types"

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

	case "GET_MARKET_WITH_SYMBOL":
		return handlers.GetMarketDetails(payload)

	case "PLACE_ORDER":
		return handlers.PlaceOrder(payload)

	default:
		log.Warn().Str("eventType", payload.EventType).Msg("Unhandled event type")
		return types.QueueResponse{
			ResponseId: payload.ResponseId,
			Status:     "error",
			Message:    "Unhandled event type: " + payload.EventType,
		}
	}
}
