package model

import "time"

type ChatMessage struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	FloorSlug string    `gorm:"index;not null" json:"floorSlug"`
	UserID    string    `gorm:"not null" json:"userId"`
	UserName  string    `json:"userName"`
	Text      string    `gorm:"not null" json:"text"`
	CreatedAt time.Time `json:"createdAt"`
}
