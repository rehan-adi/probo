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

	default:
		log.Warn().Str("eventType", payload.EventType).Msg("Unhandled event type")
		return types.QueueResponse{
			ResponseId: payload.ResponseId,
			Status:     "error",
			Message:    "Unhandled event type: " + payload.EventType,
		}
	}

}
