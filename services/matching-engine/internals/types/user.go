package types

import "sync"

type KycStatus string

const (
	KYC_NOT_VERIFIED KycStatus = "NOT_VERIFIED"
	KYC_PENDING      KycStatus = "PENDING"
	KYC_VERIFIED     KycStatus = "VERIFIED"
	KYC_REJECTED     KycStatus = "REJECTED"
)

type PaymentStatus string

const (
	PAYMENT_NOT_VERIFIED PaymentStatus = "NOT_VERIFIED"
	PAYMENT_PENDING      PaymentStatus = "PENDING"
	PAYMENT_VERIFIED     PaymentStatus = "VERIFIED"
	PAYMENT_REJECTED     PaymentStatus = "REJECTED"
)

type User struct {
	ID                        string
	Phone                     string
	KycVerificationStatus     KycStatus
	PaymentVerificationStatus PaymentStatus
	Balance                   *Balance
	Mutex                     sync.Mutex
}
