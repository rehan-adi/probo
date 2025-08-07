package engine

import (
	"trade-engine/internals/types"

	"github.com/rs/zerolog/log"
)

func (e *Engine) runMarket(market *types.Market) {
	log.Info().Str("marketId", market.MarketId).Msg("Started market goroutine")

	for msg := range market.Inbox {
		switch m := msg.(type) {

		case types.GetOrderBookMessage:
			log.Info().Str("marketId", market.MarketId).Msg("Returning order book")
			m.ReplyChan <- market.OrderBook

		default:
			log.Error().Str("marketId", market.MarketId).Msg("Unknown message received")
		}
	}
}
