package model

import (
	"time"

	"github.com/google/uuid"
)

type PlanType string

const (
	PlanFree PlanType = "free"
	PlanPro  PlanType = "pro"
)

type SubscriptionStatus string

const (
	SubStatusActive   SubscriptionStatus = "active"
	SubStatusCanceled SubscriptionStatus = "canceled"
	SubStatusPastDue  SubscriptionStatus = "past_due"
	SubStatusTrialing SubscriptionStatus = "trialing"
)

type Subscription struct {
	ID                   uuid.UUID          `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	FloorID              uuid.UUID          `gorm:"type:uuid;not null;index" json:"floorId"`
	Floor                Floor              `gorm:"foreignKey:FloorID" json:"floor,omitempty"`
	Email                string             `gorm:"not null" json:"email"`
	Plan                 PlanType           `gorm:"type:varchar(20);not null;default:'pro'" json:"plan"`
	Status               SubscriptionStatus `gorm:"type:varchar(20);not null;default:'active'" json:"status"`
	StripeCustomerID     string             `gorm:"index" json:"-"`
	StripeSubscriptionID string             `gorm:"uniqueIndex" json:"-"`
	StripePriceID        string             `json:"-"`
	CurrentPeriodStart   time.Time          `json:"currentPeriodStart"`
	CurrentPeriodEnd     time.Time          `json:"currentPeriodEnd"`
	CanceledAt           *time.Time         `json:"canceledAt,omitempty"`
	CreatedAt            time.Time          `json:"createdAt"`
	UpdatedAt            time.Time          `json:"updatedAt"`
}
