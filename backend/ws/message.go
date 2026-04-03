package ws

import (
	"encoding/json"

	"github.com/ethereal-office/backend/model"
)

// Client→Server message types
const (
	MsgMove   = "move"
	MsgSit    = "sit"
	MsgStand  = "stand"
	MsgChat   = "chat"
	MsgStatus = "status"
	MsgMedia    = "media"
	MsgReaction    = "reaction"
	MsgSceneUpdate = "scene_update"
	MsgKick          = "kick"
	MsgProfileUpdate = "profile_update"
	MsgDM            = "dm"
	MsgWhisper       = "whisper"
	MsgCallRequest   = "call_request"
	MsgCallAccept    = "call_accept"
	MsgCallDecline   = "call_decline"
	MsgCallEnd      = "call_end"
	MsgBoardUpdate  = "board_update"
	MsgMeetingStart = "meeting_start"
	MsgMeetingJoin  = "meeting_join"
	MsgMeetingLeave = "meeting_leave"
)

// Server→Client message types
const (
	MsgWelcome    = "welcome"
	MsgUserJoined = "user_joined"
	MsgUserLeft   = "user_left"
	MsgUserMoved  = "user_moved"
	MsgUserSat    = "user_sat"
	MsgUserStood  = "user_stood"
	MsgUserChat   = "user_chat"
	MsgUserStatus = "user_status"
	MsgUserMedia     = "user_media"
	MsgUserReaction     = "user_reaction"
	MsgSceneUpdated     = "scene_updated"
	MsgKicked             = "kicked"
	MsgUserProfileUpdated = "user_profile_updated"
	MsgDMReceived  = "dm_received"
	MsgUserWhisper = "user_whisper"
	MsgCallRequestReceived   = "call_request_received"
	MsgCallAcceptReceived    = "call_accept_received"
	MsgCallDeclineReceived   = "call_decline_received"
	MsgCallEndReceived  = "call_end_received"
	MsgBoardUpdated     = "board_updated"
	MsgMeetingStarted   = "meeting_started"
	MsgMeetingJoined    = "meeting_joined"
	MsgMeetingLeft      = "meeting_left"
	MsgMeetingList      = "meeting_list"
	MsgMeetingError     = "meeting_error"
	MsgMeetingEnded     = "meeting_ended" // Creator left → all participants must leave
)

type IncomingMessage struct {
	Type     string  `json:"type"`
	X        float64 `json:"x,omitempty"`
	Y        float64 `json:"y,omitempty"`
	SeatID   string  `json:"seatId,omitempty"`
	Text     string  `json:"text,omitempty"`
	Status   string  `json:"status,omitempty"`
	StatusMessage string `json:"statusMessage,omitempty"`
	IsMuted  *bool   `json:"isMuted,omitempty"`
	IsCamOn  *bool   `json:"isCameraOn,omitempty"`
	Emoji        string  `json:"emoji,omitempty"`
	TargetUserID string  `json:"targetUserId,omitempty"`
	Name         string  `json:"name,omitempty"`
	AvatarStyle  string  `json:"avatarStyle,omitempty"`
	AvatarSeed   string  `json:"avatarSeed,omitempty"`
	SDP          string  `json:"sdp,omitempty"`
	Candidate    string  `json:"candidate,omitempty"`
	BoardData    string  `json:"boardData,omitempty"`
	MeetingID    string  `json:"meetingId,omitempty"`
	MeetingName  string  `json:"meetingName,omitempty"`
	HasPassword  bool    `json:"hasPassword,omitempty"`
	Password     string  `json:"password,omitempty"` // Only used in meeting_start (client→server), never broadcast
}

type UserInfo struct {
	ID            string  `json:"id"`
	Name          string  `json:"name"`
	AvatarStyle   string  `json:"avatarStyle,omitempty"`
	AvatarSeed    string  `json:"avatarSeed,omitempty"`
	Status        string  `json:"status"`
	StatusMessage string  `json:"statusMessage,omitempty"`
	X             float64 `json:"x"`
	Y             float64 `json:"y"`
	SeatID        string  `json:"seatId,omitempty"`
	IsMuted       bool    `json:"isMuted"`
	IsCamOn       bool    `json:"isCameraOn"`
}

type ChatMessage struct {
	UserID    string `json:"userId"`
	UserName  string `json:"userName,omitempty"`
	Text      string `json:"text"`
	Timestamp int64  `json:"timestamp"`
}

type DMHistoryItem struct {
	From      string `json:"from"`
	To        string `json:"to"`
	Text      string `json:"text"`
	Timestamp string `json:"timestamp"`
}

type OutgoingMessage struct {
	Type          string          `json:"type"`
	UserID        string          `json:"userId,omitempty"`
	User          *UserInfo       `json:"user,omitempty"`
	Users         []UserInfo      `json:"users,omitempty"`
	X             float64         `json:"x,omitempty"`
	Y             float64         `json:"y,omitempty"`
	SeatID        string          `json:"seatId,omitempty"`
	Status        string          `json:"status,omitempty"`
	StatusMessage string          `json:"statusMessage,omitempty"`
	Message       *ChatMessage    `json:"message,omitempty"`
	ChatHistory   []ChatMessage   `json:"chatHistory,omitempty"`
	DMHistory     []DMHistoryItem `json:"dmHistory,omitempty"`
	IsMuted       *bool           `json:"isMuted,omitempty"`
	IsCamOn       *bool           `json:"isCameraOn,omitempty"`
	Emoji         string          `json:"emoji,omitempty"`
	Name          string          `json:"name,omitempty"`
	AvatarStyle   string          `json:"avatarStyle,omitempty"`
	AvatarSeed    string          `json:"avatarSeed,omitempty"`
	From          string          `json:"from,omitempty"`
	To            string          `json:"to,omitempty"`
	Text          string          `json:"text,omitempty"`
	Timestamp     string          `json:"timestamp,omitempty"`
	SDP           string                  `json:"sdp,omitempty"`
	Candidate     string                  `json:"candidate,omitempty"`
	Plan          string                  `json:"plan,omitempty"`
	Permissions   *model.PlanPermissions  `json:"permissions,omitempty"`
	BoardData     string                  `json:"boardData,omitempty"`
	MeetingID     string                  `json:"meetingId,omitempty"`
	MeetingName   string                  `json:"meetingName,omitempty"`
	HasPassword   bool                    `json:"hasPassword,omitempty"`
	Meetings      []ActiveMeetingInfo     `json:"meetings,omitempty"`
	Participants  int                     `json:"participants"`
	MaxParticipants int                   `json:"maxParticipants,omitempty"`
}

// ActiveMeetingInfo is the wire representation of an active meeting.
type ActiveMeetingInfo struct {
	ID           string   `json:"id"`
	Name         string   `json:"name"`
	CreatedBy    string   `json:"createdBy"`
	CreatorName  string   `json:"creatorName"`
	HasPassword  bool     `json:"hasPassword"`
	Participants []string `json:"participants"`
	CreatedAt    int64    `json:"createdAt"`
}

func MarshalMessage(msg OutgoingMessage) []byte {
	data, _ := json.Marshal(msg)
	return data
}
