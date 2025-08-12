package engine

import (
	"trade-engine/internals/types"
	"trade-engine/internals/utils"

	"github.com/rs/zerolog/log"
)

func (e *Engine) runMarket(market *types.Market) {
	log.Info().Str("marketId", market.MarketId).Msg("Started market goroutine")

	for msg := range market.Inbox {
		switch msg.Type {

		case types.MarketPlaceOrder:
			e.handlePlaceOrder(msg, market)

		case types.MarketGetOrderBook:
			market.Mu.RLock()
			aggOrderBook := utils.AggregateOrderBook(market.OrderBook)
			market.Mu.RUnlock()

			msg.ReplyChan <- aggOrderBook

		default:
			log.Error().Str("marketId", market.MarketId).Msg("Unknown message type")
		}
	}
}
