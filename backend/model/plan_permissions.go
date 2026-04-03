package model

// PlanPermissions defines what features each plan can access.
type PlanPermissions struct {
	VoiceCall              bool `json:"voiceCall"`
	VideoCall              bool `json:"videoCall"`
	ScreenShare            bool `json:"screenShare"`
	FileShare              bool `json:"fileShare"`
	MeetingBoard           bool `json:"meetingBoard"`
	FloorTemplates         bool `json:"floorTemplates"`
	AdminFeatures          bool `json:"adminFeatures"`
	PrioritySupport        bool `json:"prioritySupport"`
	MaxMembers             int  `json:"maxMembers"`             // 0 = unlimited
	MaxMeetingParticipants int  `json:"maxMeetingParticipants"` // 0 = unlimited
	MaxConcurrentMeetings  int  `json:"maxConcurrentMeetings"`  // 0 = unlimited
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
		ScreenShare:            false,
		FileShare:              false,
		MeetingBoard:           true,
		FloorTemplates:         false,
		AdminFeatures:          false,
		PrioritySupport:        false,
		MaxMembers:             10,
		MaxMeetingParticipants: 4,
		MaxConcurrentMeetings:  1,
		CustomBranding:         false,
		SSO:                    false,
		DedicatedEnv:           false,
		SLA:                    false,
		APIAccess:              false,
	},
	PlanPro: {
		VoiceCall:              true,
		VideoCall:              true,
		ScreenShare:            true,
		FileShare:              true,
		MeetingBoard:           true,
		FloorTemplates:         true,
		AdminFeatures:          true,
		PrioritySupport:        true,
		MaxMembers:             0, // unlimited
		MaxMeetingParticipants: 0, // unlimited
		MaxConcurrentMeetings:  0, // unlimited
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
