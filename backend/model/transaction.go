package model

import (
	"time"

	"github.com/google/uuid"
)

type TransactionType string

const (
	TxTypeSubscription TransactionType = "subscription"
	TxTypeOneTime      TransactionType = "one_time"
	TxTypeRefund       TransactionType = "refund"
)

type TransactionStatus string

const (
	TxStatusSucceeded TransactionStatus = "succeeded"
	TxStatusPending   TransactionStatus = "pending"
	TxStatusFailed    TransactionStatus = "failed"
	TxStatusRefunded  TransactionStatus = "refunded"
)

type Transaction struct {
	ID                    uuid.UUID         `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	FloorID               *uuid.UUID        `gorm:"type:uuid;index" json:"floorId,omitempty"`
	Floor                 *Floor            `gorm:"foreignKey:FloorID" json:"floor,omitempty"`
	SubscriptionID        *uuid.UUID        `gorm:"type:uuid;index" json:"subscriptionId,omitempty"`
	Email                 string            `gorm:"not null" json:"email"`
	Amount                int               `gorm:"not null" json:"amount"`
	Currency              string            `gorm:"type:varchar(3);not null;default:'jpy'" json:"currency"`
	Type                  TransactionType   `gorm:"type:varchar(20);not null" json:"type"`
	Status                TransactionStatus `gorm:"type:varchar(20);not null;default:'pending'" json:"status"`
	StripePaymentIntentID string            `gorm:"index" json:"-"`
	StripeInvoiceID       string            `json:"-"`
	Description           string            `json:"description,omitempty"`
	CreatedAt             time.Time         `json:"createdAt"`
}
