package model

import (
	"time"

	"github.com/google/uuid"
)

type SSOProvider string

const (
	SSOProviderGoogle SSOProvider = "google"
)

type FloorSSOConfig struct {
	ID            uuid.UUID   `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	FloorID       uuid.UUID   `gorm:"type:uuid;uniqueIndex;not null" json:"floorId"`
	Enabled       bool        `gorm:"default:false" json:"enabled"`
	Provider      SSOProvider `gorm:"type:varchar(20);default:'google'" json:"provider"`
	AllowedDomain string      `json:"allowedDomain"`
	CreatedAt     time.Time   `json:"createdAt"`
	UpdatedAt     time.Time   `json:"updatedAt"`
}

type FloorSSOSession struct {
	ID        uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	FloorID   uuid.UUID `gorm:"type:uuid;not null;index" json:"floorId"`
	Email     string    `gorm:"not null" json:"email"`
	Name      string    `json:"name"`
	Token     string    `gorm:"uniqueIndex;not null" json:"-"`
	ExpiresAt time.Time `json:"expiresAt"`
	CreatedAt time.Time `json:"createdAt"`
}
