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

type Activity struct {
	BuyerId     string    `json:"buyerId"`
	SellerId    string    `json:"sellerId"`
	Buyerphone  string    `json:"buyerPhone"`
	SellerPhone string    `json:"sellerPhone"`
	Outcome     string    `json:"outcome"`
	Price       float64   `json:"price"`
	Quantity    int       `json:"quantity"`
	Timestamp   time.Time `json:"timestamp"`
	MatchType   string    `json:"matchType"`
}
