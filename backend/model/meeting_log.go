package model

import "time"

// MeetingLog records a completed (or active) meeting for archive purposes.
type MeetingLog struct {
	ID              uint       `gorm:"primaryKey" json:"id"`
	FloorSlug       string     `gorm:"index;not null" json:"floorSlug"`
	MeetingID       string     `gorm:"index;not null" json:"meetingId"`
	Name            string     `gorm:"not null" json:"name"`
	CreatedBy       string     `json:"createdBy"`
	CreatorName     string     `json:"creatorName"`
	MaxParticipants int        `json:"maxParticipants"` // peak participant count
	StartedAt       time.Time  `json:"startedAt"`
	EndedAt         *time.Time `json:"endedAt"` // null if still active
}
