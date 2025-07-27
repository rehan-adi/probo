package types

import "sync"

// This will hold user details and balances (Wallet and stock).
// Mutex guards concurrent access to Balance during operations.

type User struct {
	ID            string
	Phone         string
	KycStatus     bool
	PaymentStatus bool
	Balance       *Balance
	Mutex         sync.Mutex
}
