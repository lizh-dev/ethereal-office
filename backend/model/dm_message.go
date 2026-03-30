package model

import "time"

type DMMessage struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	FloorSlug string    `gorm:"index;not null" json:"floorSlug"`
	FromID    string    `gorm:"not null" json:"fromId"`
	FromName  string    `json:"fromName"`
	ToID      string    `gorm:"index;not null" json:"toId"`
	Text      string    `gorm:"not null" json:"text"`
	CreatedAt time.Time `json:"createdAt"`
}
