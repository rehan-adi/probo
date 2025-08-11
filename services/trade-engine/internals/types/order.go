package types

import "time"

type Side string
type OrderType string
type Action string

const (
	Yes Side = "YES"
	No  Side = "NO"
)

const (
	LIMIT  OrderType = "LIMIT"
	MARKET OrderType = "MARKET"
)

const (
	BUY  Action = "BUY"
	SELL Action = "SELL"
)

type Order struct {
	OrderId   string
	UserId    string
	MarketId  string
	Symbol    string
	Price     float64
	Quantity  int
	Filled    int
	Side      Side
	Action    Action
	OrderType OrderType
	Timestamp time.Time
}
