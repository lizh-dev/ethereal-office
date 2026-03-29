package ws

import "encoding/json"

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
)

type IncomingMessage struct {
	Type     string  `json:"type"`
	X        float64 `json:"x,omitempty"`
	Y        float64 `json:"y,omitempty"`
	SeatID   string  `json:"seatId,omitempty"`
	Text     string  `json:"text,omitempty"`
	Status   string  `json:"status,omitempty"`
	IsMuted  *bool   `json:"isMuted,omitempty"`
	IsCamOn  *bool   `json:"isCameraOn,omitempty"`
	Emoji    string  `json:"emoji,omitempty"`
}

type UserInfo struct {
	ID          string  `json:"id"`
	Name        string  `json:"name"`
	AvatarStyle string  `json:"avatarStyle,omitempty"`
	AvatarSeed  string  `json:"avatarSeed,omitempty"`
	Status      string  `json:"status"`
	X           float64 `json:"x"`
	Y           float64 `json:"y"`
	SeatID      string  `json:"seatId,omitempty"`
	IsMuted     bool    `json:"isMuted"`
	IsCamOn     bool    `json:"isCameraOn"`
}

type ChatMessage struct {
	UserID    string `json:"userId"`
	Text      string `json:"text"`
	Timestamp int64  `json:"timestamp"`
}

type OutgoingMessage struct {
	Type        string        `json:"type"`
	UserID      string        `json:"userId,omitempty"`
	User        *UserInfo     `json:"user,omitempty"`
	Users       []UserInfo    `json:"users,omitempty"`
	X           float64       `json:"x,omitempty"`
	Y           float64       `json:"y,omitempty"`
	SeatID      string        `json:"seatId,omitempty"`
	Status      string        `json:"status,omitempty"`
	Message     *ChatMessage  `json:"message,omitempty"`
	ChatHistory []ChatMessage `json:"chatHistory,omitempty"`
	IsMuted     *bool         `json:"isMuted,omitempty"`
	IsCamOn     *bool         `json:"isCameraOn,omitempty"`
	Emoji       string        `json:"emoji,omitempty"`
}

func MarshalMessage(msg OutgoingMessage) []byte {
	data, _ := json.Marshal(msg)
	return data
}
