package engine

import (
	"trade-engine/internals/types"
)

func (e *Engine) handlePlaceOrder(market *types.Market, order types.Order) types.PlaceOrderResponse {

	return types.PlaceOrderResponse{
		Success: true,
	}
}
