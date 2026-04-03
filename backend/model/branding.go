package model

import (
	"time"

	"github.com/google/uuid"
)

type FloorBranding struct {
	ID          uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	FloorID     uuid.UUID `gorm:"type:uuid;uniqueIndex;not null" json:"floorId"`
	LogoURL     string    `json:"logoUrl"`
	AccentColor string    `gorm:"default:'#0ea5e9'" json:"accentColor"`
	FloorTitle  string    `json:"floorTitle"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}
