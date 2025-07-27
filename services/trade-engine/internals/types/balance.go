package types

// Hold user wallet balances and stock balance (IE -> 10rs wallet balance, 2 yes stock in market abc).
type Balance struct {
	WalletBalance WalletBalance

	StockBalance map[string]StockBalance
}

type WalletBalance struct {
	Amount float64
	Locked float64
}

type StockBalance struct {
	Yes int
	No  int
}
