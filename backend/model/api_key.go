package model

import (
	"time"

	"github.com/google/uuid"
)

type APIKey struct {
	ID         uuid.UUID  `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	FloorID    uuid.UUID  `gorm:"type:uuid;not null;index" json:"floorId"`
	Name       string     `gorm:"not null" json:"name"`
	KeyHash    string     `gorm:"not null" json:"-"`
	KeyPrefix  string     `gorm:"not null" json:"keyPrefix"`
	LastUsedAt *time.Time `json:"lastUsedAt,omitempty"`
	ExpiresAt  *time.Time `json:"expiresAt,omitempty"`
	RevokedAt  *time.Time `json:"revokedAt,omitempty"`
	CreatedAt  time.Time  `json:"createdAt"`
}
