package model

import (
	"time"

	"github.com/google/uuid"
)

type File struct {
	ID        uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	FloorSlug string    `gorm:"not null;index" json:"floorSlug"`
	UserID    string    `gorm:"not null" json:"userId"`
	UserName  string    `gorm:"not null" json:"userName"`
	FileName  string    `gorm:"not null" json:"fileName"`
	FileSize  int64     `gorm:"not null" json:"fileSize"`
	MimeType  string    `gorm:"not null" json:"mimeType"`
	FilePath  string    `gorm:"not null" json:"-"`
	URL       string    `gorm:"-" json:"url"`
	CreatedAt time.Time `json:"createdAt"`
}
