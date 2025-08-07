package types

import (
	"sync"
	"time"
)

type MarketMessage interface{}

type Market struct {
	MarketId    string
	Symbol      string
	Decsription string
	Category    string
	Volume      float64
	YesPrice    float32
	NoPrice     float32
	Status      MarketStatus
	OrderBook   *OrderBook
	Overview    Overview
	Activities  []Activity
	Timeline    []PricePoint
	Inbox       chan MarketMessage
	Mu          sync.RWMutex
}

type MarketStatus string

const (
	Open  MarketStatus = "open"
	Close MarketStatus = "close"
)

type Overview struct {
	StartDate     time.Time
	EndDate       time.Time
	SourceOfTruth string
	Details       string
}
type PricePoint struct {
	Timestamp time.Time
	YesPrice  float64
	NoPrice   float64
	Volume    float64
}

type Activity struct {
	BuyerName  string    `json:"buyerName"`
	SellerName string    `json:"sellerName"`
	Outcome    string    `json:"outcome"`
	Price      float64   `json:"price"`
	Quantity   int       `json:"quantity"`
	Timestamp  time.Time `json:"timestamp"`
}
