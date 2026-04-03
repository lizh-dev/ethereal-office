package model

import "time"

// MeetingRoom represents a persistent (permanent) meeting room associated with a floor.
// Quick meetings are ephemeral and managed in-memory by the WebSocket hub.
type MeetingRoom struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	FloorSlug   string    `gorm:"index;not null" json:"floorSlug"`
	RoomID      string    `gorm:"uniqueIndex;not null" json:"roomId"` // URL-safe meeting identifier
	Name        string    `gorm:"not null" json:"name"`
	CreatedBy   string    `gorm:"not null" json:"createdBy"`   // userId
	CreatorName string    `json:"creatorName"`
	HasPassword bool      `gorm:"default:false" json:"hasPassword"`
	Password    string    `json:"-"`                           // hashed, never sent to client
	Permanent   bool      `gorm:"default:true" json:"permanent"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}
