package types

type Balance struct {
	WalletBalance WalletBalance
	StockBalance  map[string]StockBalance
}

type WalletBalance struct {
	Amount float64
	Locked float64
}

type StockBalance struct {
	Yes       int
	No        int
	LockedYes int
	LockedNo  int
}
