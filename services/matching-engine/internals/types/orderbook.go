package types

import "time"

type OrderBook struct {
	YesBids *BidHeap
	YesAsks *AskHeap
	NoBids  *BidHeap
	NoAsks  *AskHeap
}

type PriceQuantity struct {
	Price    float64 `json:"price"`
	Quantity int     `json:"quantity"`
}

type AggregatedOrderBook struct {
	Yes []PriceQuantity `json:"yes"`
	No  []PriceQuantity `json:"no"`
}

type TradeExecutedEvent struct {
	MarketId      string    `json:"marketId"`
	MakerId       string    `json:"makerId"`
	TakerId       string    `json:"takerId"`
	MakerOrderId  string    `json:"makerOrderId"`
	TakerOrderId  string    `json:"takerOrderId"`
	StockType     string    `json:"stockType"`
	TakerAction   string    `json:"takerAction"`
	Price         float64   `json:"price"`
	Quantity      int       `json:"quantity"`
	Timestamp     time.Time `json:"timestamp"`
	MatchType     string    `json:"matchType"`
}
