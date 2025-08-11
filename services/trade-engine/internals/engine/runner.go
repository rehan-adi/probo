package engine

import (
	"trade-engine/internals/types"

	"github.com/rs/zerolog/log"
)

func (e *Engine) runMarket(market *types.Market) {
	log.Info().Str("marketId", market.MarketId).Msg("Started market goroutine")

	for msg := range market.Inbox {
		switch msg.Type {

		case types.MarketPlaceOrder:
			order, ok := msg.Payload.(types.Order)
			if !ok {
				log.Error().Msg("invalid payload type for MarketPlaceOrder")
				msg.ReplyChan <- types.PlaceOrderResponse{
					Success: false,
					Message: "Invalid payload type",
				}
				continue
			}

			result := e.handlePlaceOrder(market, order)
			msg.ReplyChan <- result

		default:
			log.Error().Str("marketId", market.MarketId).Msg("Unknown message type")
		}
	}
}
