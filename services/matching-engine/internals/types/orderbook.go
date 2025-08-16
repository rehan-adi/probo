package types

type OrderBook struct {
	Yes []*Order
	No  []*Order
}

type PriceQuantity struct {
	Price    float64 `json:"price"`
	Quantity int     `json:"quantity"`
}

type AggregatedOrderBook struct {
	Yes []PriceQuantity `json:"yes"`
	No  []PriceQuantity `json:"no"`
}
