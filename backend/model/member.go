package model

import (
	"time"

	"github.com/google/uuid"
)

type MemberRole string

const (
	RoleOwner  MemberRole = "owner"
	RoleAdmin  MemberRole = "admin"
	RoleMember MemberRole = "member"
	RoleGuest  MemberRole = "guest"
)

type FloorMember struct {
	ID        uuid.UUID  `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	FloorID   uuid.UUID  `gorm:"type:uuid;not null;index" json:"floorId"`
	AccountID uuid.UUID  `gorm:"type:uuid;not null;index" json:"accountId"`
	Account   Account    `gorm:"foreignKey:AccountID" json:"account,omitempty"`
	Role      MemberRole `gorm:"type:varchar(20);not null;default:'member'" json:"role"`
	InvitedBy *uuid.UUID `gorm:"type:uuid" json:"invitedBy,omitempty"`
	JoinedAt  time.Time  `json:"joinedAt"`
	CreatedAt time.Time  `json:"createdAt"`
}
