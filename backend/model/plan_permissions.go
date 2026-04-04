package model

// PlanPermissions defines what features each plan can access.
type PlanPermissions struct {
	VoiceCall              bool `json:"voiceCall"`
	VideoCall              bool `json:"videoCall"`
	ScreenShare            bool `json:"screenShare"`
	FileShare              bool `json:"fileShare"`
	MeetingBoard           bool `json:"meetingBoard"`
	MeetingInlineBoard     bool `json:"meetingInlineBoard"`
	PerParticipantBoard    bool `json:"perParticipantBoard"`
	FloorTemplates         bool `json:"floorTemplates"`
	AdminFeatures          bool `json:"adminFeatures"`
	PrioritySupport        bool `json:"prioritySupport"`
	MaxMembers             int  `json:"maxMembers"`             // 0 = unlimited
	MaxMeetingParticipants int  `json:"maxMeetingParticipants"` // 0 = unlimited
	MaxConcurrentMeetings  int  `json:"maxConcurrentMeetings"`  // 0 = unlimited
	MaxBoards              int  `json:"maxBoards"`              // 0 = unlimited
	MaxFloors              int  `json:"maxFloors"`              // 0 = unlimited
	PremiumThemes          bool `json:"premiumThemes"`
	CustomBranding         bool `json:"customBranding"`
	SSO                    bool `json:"sso"`
	DedicatedEnv           bool `json:"dedicatedEnv"`
	SLA                    bool `json:"sla"`
	APIAccess              bool `json:"apiAccess"`
}

var PlanPermissionsMap = map[PlanType]PlanPermissions{
	PlanFree: {
		VoiceCall:              true,
		VideoCall:              true,
		ScreenShare:            true,  // Jitsi内蔵、ゲートなし
		FileShare:              false, // file.go でゲート済み
		MeetingBoard:           true,
		MeetingInlineBoard:     false, // Pro限定: ミーティング内ボード
		PerParticipantBoard:    false, // Pro限定: 参加者ごとの個別ボード
		FloorTemplates:         false, // EditorPanel で Pro 判定
		AdminFeatures:          true,
		PrioritySupport:        false,
		MaxMembers:             10,  // hub.go で強制
		MaxMeetingParticipants: 4,   // hub.go で強制
		MaxConcurrentMeetings:  1,   // hub.go で強制
		MaxBoards:              1,   // board.go で強制
		MaxFloors:              1,   // floor.go で強制
		PremiumThemes:          false,
		CustomBranding:         false, // main.go でゲート済み
		SSO:                    false, // main.go でゲート済み
		DedicatedEnv:           false,
		SLA:                    false,
		APIAccess:              false, // main.go でゲート済み
	},
	PlanPro: {
		VoiceCall:              true,
		VideoCall:              true,
		ScreenShare:            true,
		FileShare:              true,
		MeetingBoard:           true,
		MeetingInlineBoard:     true,
		PerParticipantBoard:    true,
		FloorTemplates:         true,
		AdminFeatures:          true,
		PrioritySupport:        true,
		MaxMembers:             0, // unlimited
		MaxMeetingParticipants: 0, // unlimited
		MaxConcurrentMeetings:  0, // unlimited
		MaxBoards:              0, // unlimited
		MaxFloors:              0, // unlimited
		PremiumThemes:          true,
		CustomBranding:         true,
		SSO:                    true,
		DedicatedEnv:           true,
		SLA:                    true,
		APIAccess:              true,
	},
}

// GetFloorPlan returns the active plan for a floor slug.
func GetFloorPlan(floorID string) PlanType {
	return PlanFree // default; overridden by handler lookup
}
