package types

import (
	"sync"
	"time"
)

type MarketMessageType string

const (
	MarketPlaceOrder   MarketMessageType = "PLACE_ORDER"
	MarketSellOrder    MarketMessageType = "SELL_ORDER"
	MarketCancelOrder  MarketMessageType = "CANCEL_ORDER"
	MarketGetOrderBook MarketMessageType = "GET_ORDERBOOK"
)

type MarketMessage struct {
	Type      MarketMessageType
	Payload   interface{}
	ReplyChan chan interface{}
}

type Market struct {
	MarketId        string
	Title           string
	Symbol          string
	YesPrice        float32
	NoPrice         float32
	Thumbnail       string
	CategoryId      string
	NumberOfTraders int16
	Traders         map[string]struct{}
	Volume          float64
	Status          MarketStatus
	OrderBook       *OrderBook

	Overview   Overview
	Activities []Activity
	Timeline   []PricePoint
	Inbox      chan MarketMessage
	Mu         sync.RWMutex
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
	Rules         string
	EOS           string
}

type PricePoint struct {
	Timestamp time.Time
	YesPrice  float64
	NoPrice   float64
}

type Activity struct {
	Buyerphone  string    `json:"buyerPhone"`
	SellerPhone string    `json:"sellerPhone"`
	Outcome     string    `json:"outcome"`
	Price       float64   `json:"price"`
	Quantity    int       `json:"quantity"`
	Timestamp   time.Time `json:"timestamp"`
}
