package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/datatypes"
)

type Floor struct {
	ID              uuid.UUID      `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	Slug            string         `gorm:"uniqueIndex;not null" json:"slug"`
	Name            string         `gorm:"not null" json:"name"`
	CreatorName     *string        `json:"creatorName,omitempty"`
	EditToken       string         `gorm:"not null" json:"-"`           // legacy, kept for migration
	Password        *string        `json:"-"`                           // optional entry password
	OwnerPassword   *string        `json:"-"`                           // password to enter edit mode
	OwnerEmail      string         `gorm:"not null;default:''" json:"ownerEmail"`
	ExcalidrawScene datatypes.JSON `gorm:"type:jsonb" json:"excalidrawScene,omitempty"`
	Zones           datatypes.JSON `gorm:"type:jsonb" json:"zones,omitempty"`
	Settings        datatypes.JSON `gorm:"type:jsonb;default:'{}'" json:"settings,omitempty"`
	LastActiveAt    time.Time      `gorm:"autoUpdateTime" json:"lastActiveAt"`
	CreatedAt       time.Time      `json:"createdAt"`
	UpdatedAt       time.Time      `json:"updatedAt"`
}
