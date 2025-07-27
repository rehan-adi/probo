package types

import "time"

type Side string

const (
	Yes Side = "yes"
	No  Side = "no"
)

type Order struct {
	OrderId   string
	UserId    string
	MarketId  string
	Price     float64
	Quantity  int
	Filled    int
	Side      Side
	Timestamp time.Time
}
