package utils

import (
	"sort"
	"trade-engine/internals/types"
)

func aggregateOrders(orders []*types.Order) []types.PriceQuantity {
	priceMap := make(map[float64]int)
	for _, order := range orders {
		remaining := order.Quantity - order.Filled
		if remaining > 0 {
			priceMap[order.Price] += remaining
		}
	}

	var result []types.PriceQuantity
	for price, qty := range priceMap {
		result = append(result, types.PriceQuantity{
			Price:    price,
			Quantity: qty,
		})
	}

	sort.Slice(result, func(i, j int) bool {
		return result[i].Price < result[j].Price
	})

	return result
}

func AggregateOrderBook(ob *types.OrderBook) types.AggregatedOrderBook {
	return types.AggregatedOrderBook{
		Yes: aggregateOrders(ob.Yes),
		No:  aggregateOrders(ob.No),
	}
}
