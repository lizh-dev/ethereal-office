package ws

import (
	"log"
	"math"
	"sync"
	"time"

	"github.com/ethereal-office/backend/db"
	"github.com/ethereal-office/backend/model"
)

const maxChatHistory = 100

// disconnectedInfo holds a recently disconnected user's state for reconnection recovery.
type disconnectedInfo struct {
	Info         UserInfo
	DisconnectAt time.Time
}

// activeMeeting tracks an in-progress meeting within a room.
type activeMeeting struct {
	ID           string
	Name         string
	CreatedBy    string // userId
	CreatorName  string
	HasPassword  bool
	Participants map[string]bool // userId set
	CreatedAt    time.Time
}

type Room struct {
	clients              map[string]*Client
	chatHistory          []ChatMessage
	lastActive           time.Time
	recentlyDisconnected map[string]*disconnectedInfo // userId -> info
	activeMeetings       map[string]*activeMeeting    // meetingId -> meeting
}

type Hub struct {
	rooms      map[string]*Room
	mu         sync.RWMutex
	register   chan *Client
	unregister chan *Client
}

func NewHub() *Hub {
	return &Hub{
		rooms:      make(map[string]*Room),
		register:   make(chan *Client),
		unregister: make(chan *Client),
	}
}

func (h *Hub) Run() {
	cleanupTicker := time.NewTicker(5 * time.Minute)
	defer cleanupTicker.Stop()

	for {
		select {
		case client := <-h.register:
			h.addClient(client)
		case client := <-h.unregister:
			h.removeClient(client)
		case <-cleanupTicker.C:
			h.cleanupEmptyRooms()
		}
	}
}

func (h *Hub) cleanupEmptyRooms() {
	h.mu.Lock()
	defer h.mu.Unlock()
	for slug, room := range h.rooms {
		// Clean up expired reconnection entries (older than 60 seconds)
		for uid, di := range room.recentlyDisconnected {
			if time.Since(di.DisconnectAt) > 120*time.Second {
				delete(room.recentlyDisconnected, uid)
			}
		}

		if len(room.clients) == 0 && time.Since(room.lastActive) > 30*time.Minute {
			delete(h.rooms, slug)
			log.Printf("[cleanup] empty room %s removed", slug)
		}
	}
}

func (h *Hub) getOrCreateRoom(slug string) *Room {
	h.mu.Lock()
	defer h.mu.Unlock()

	room, ok := h.rooms[slug]
	if !ok {
		room = &Room{
			clients:              make(map[string]*Client),
			chatHistory:          make([]ChatMessage, 0),
			lastActive:           time.Now(),
			recentlyDisconnected: make(map[string]*disconnectedInfo),
			activeMeetings:       make(map[string]*activeMeeting),
		}
		h.rooms[slug] = room
	}
	room.lastActive = time.Now()
	return room
}

func (h *Hub) addClient(client *Client) {
	room := h.getOrCreateRoom(client.room)

	h.mu.Lock()

	// Enforce max members per plan
	floorPlan := model.PlanFree
	var floorRecord model.Floor
	if db.DB != nil {
		if err := db.DB.Where("slug = ?", client.room).First(&floorRecord).Error; err == nil {
			var sub model.Subscription
			if err := db.DB.Where("floor_id = ? AND status IN ?", floorRecord.ID, []string{"active", "trialing"}).First(&sub).Error; err == nil {
				floorPlan = sub.Plan
			}
		}
	}
	perms := model.PlanPermissionsMap[floorPlan]
	if perms.MaxMembers > 0 && len(room.clients) >= perms.MaxMembers {
		h.mu.Unlock()
		log.Printf("[%s] rejected %s: room full (%d/%d, plan=%s)", client.room, client.info.Name, len(room.clients), perms.MaxMembers, floorPlan)
		reject := OutgoingMessage{
			Type:   "error",
			Status: "room_full",
			Text:   "このフロアの同時接続数上限に達しました。Proプランにアップグレードすると最大50人まで接続できます。",
		}
		client.send <- MarshalMessage(reject)
		go func() { client.conn.Close() }()
		return
	}

	// Check if this user was recently disconnected — restore position only, NOT seat
	if di, ok := room.recentlyDisconnected[client.info.ID]; ok {
		if time.Since(di.DisconnectAt) < 120*time.Second {
			client.info.X = di.Info.X
			client.info.Y = di.Info.Y
			// Do NOT restore SeatID — user must re-sit manually
			client.info.Status = "online"
			log.Printf("[%s] %s reconnected, position restored", client.room, client.info.Name)
		}
		delete(room.recentlyDisconnected, client.info.ID)
	}

	// Evict stale client with the same userId (e.g. zombie from broken connection)
	if old, exists := room.clients[client.info.ID]; exists && old != client {
		log.Printf("[%s] evicting stale client %s (%s) - same ID", client.room, old.info.ID, old.info.Name)
		delete(room.clients, old.info.ID)
		go func() { old.conn.Close() }()
	}

	room.clients[client.info.ID] = client
	h.mu.Unlock()

	// Load chat history from DB (last 50 messages)
	var dbMessages []model.ChatMessage
	if db.DB != nil {
		db.DB.Where("floor_slug = ?", client.room).
			Order("created_at DESC").
			Limit(50).
			Find(&dbMessages)
	}
	// Convert to ws ChatMessage in chronological order (oldest first)
	chatHistory := make([]ChatMessage, 0, len(dbMessages))
	for i := len(dbMessages) - 1; i >= 0; i-- {
		chatHistory = append(chatHistory, ChatMessage{
			UserID:    dbMessages[i].UserID,
			UserName:  dbMessages[i].UserName,
			Text:      dbMessages[i].Text,
			Timestamp: dbMessages[i].CreatedAt.UnixMilli(),
		})
	}

	// Load DM history for this user (last 100 DMs sent or received)
	var dmHistory []DMHistoryItem
	if db.DB != nil {
		var dbDMs []model.DMMessage
		db.DB.Where("floor_slug = ? AND (from_id = ? OR to_id = ?)", client.room, client.info.ID, client.info.ID).
			Order("created_at DESC").
			Limit(100).
			Find(&dbDMs)
		for i := len(dbDMs) - 1; i >= 0; i-- {
			dmHistory = append(dmHistory, DMHistoryItem{
				From:      dbDMs[i].FromID,
				To:        dbDMs[i].ToID,
				Text:      dbDMs[i].Text,
				Timestamp: dbDMs[i].CreatedAt.UTC().Format(time.RFC3339),
			})
		}
	}

	// floorPlan and perms already resolved at top of addClient

	// Build active meetings list
	meetingList := h.getMeetingList(client.room)

	// Send welcome with existing users, chat history, DM history, plan permissions, and active meetings
	users := h.getRoomUsers(client.room)
	welcome := OutgoingMessage{
		Type:        MsgWelcome,
		UserID:      client.info.ID,
		Users:       users,
		ChatHistory: chatHistory,
		DMHistory:   dmHistory,
		SeatID:      client.info.SeatID,
		X:           client.info.X,
		Y:           client.info.Y,
		Plan:        string(floorPlan),
		Permissions: &perms,
		Meetings:    meetingList,
	}
	client.send <- MarshalMessage(welcome)

	// Broadcast user_joined to others
	h.broadcastToRoom(client.room, OutgoingMessage{
		Type: MsgUserJoined,
		User: &client.info,
	}, client.info.ID)

	log.Printf("[%s] %s joined (total: %d)", client.room, client.info.Name, len(room.clients))
}

func (h *Hub) removeClient(client *Client) {
	h.mu.Lock()
	room, ok := h.rooms[client.room]
	if ok {
		// Save user info for potential reconnection
		if room.recentlyDisconnected == nil {
			room.recentlyDisconnected = make(map[string]*disconnectedInfo)
		}
		room.recentlyDisconnected[client.info.ID] = &disconnectedInfo{
			Info:         client.info,
			DisconnectAt: time.Now(),
		}
		delete(room.clients, client.info.ID)
		// Don't delete room immediately so reconnection state is preserved
		if len(room.clients) == 0 {
			room.lastActive = time.Now() // Update for cleanup timer
		}
	}
	h.mu.Unlock()
	close(client.send)

	// If user was seated, broadcast stand first
	if client.info.SeatID != "" {
		h.broadcastToRoom(client.room, OutgoingMessage{
			Type:   MsgUserStood,
			UserID: client.info.ID,
		}, "")
	}

	// Broadcast user_left
	h.broadcastToRoom(client.room, OutgoingMessage{
		Type:   MsgUserLeft,
		UserID: client.info.ID,
	}, "")

	log.Printf("[%s] %s left", client.room, client.info.Name)
}

func (h *Hub) Register(client *Client) {
	h.register <- client
}

// HasRecentlyDisconnected checks whether a userId exists in the room's recently
// disconnected map and is still within the 60-second TTL window.
func (h *Hub) HasRecentlyDisconnected(slug, userID string) bool {
	h.mu.RLock()
	defer h.mu.RUnlock()
	room, ok := h.rooms[slug]
	if !ok {
		return false
	}
	di, ok := room.recentlyDisconnected[userID]
	if !ok {
		return false
	}
	return time.Since(di.DisconnectAt) < 120*time.Second
}

func (h *Hub) getRoomUsers(slug string) []UserInfo {
	h.mu.RLock()
	defer h.mu.RUnlock()

	room, ok := h.rooms[slug]
	if !ok {
		return nil
	}

	users := make([]UserInfo, 0, len(room.clients))
	for _, c := range room.clients {
		users = append(users, c.info)
	}
	return users
}

// GetRoomUsers is an exported wrapper around getRoomUsers for use by
// external packages (e.g. public API handlers).
func (h *Hub) GetRoomUsers(roomSlug string) []UserInfo {
	return h.getRoomUsers(roomSlug)
}

func (h *Hub) broadcastToRoom(slug string, msg OutgoingMessage, excludeID string) {
	data := MarshalMessage(msg)

	h.mu.RLock()
	defer h.mu.RUnlock()

	room, ok := h.rooms[slug]
	if !ok {
		return
	}

	for id, client := range room.clients {
		if id == excludeID {
			continue
		}
		select {
		case client.send <- data:
		default:
			// Client buffer full, skip
		}
	}
}

func (h *Hub) handleMessage(client *Client, msg IncomingMessage) {
	switch msg.Type {
	case MsgMove:
		client.info.X = msg.X
		client.info.Y = msg.Y
		client.info.SeatID = ""
		h.broadcastToRoom(client.room, OutgoingMessage{
			Type:   MsgUserMoved,
			UserID: client.info.ID,
			X:      msg.X,
			Y:      msg.Y,
		}, client.info.ID)

	case MsgSit:
		client.info.X = msg.X
		client.info.Y = msg.Y
		client.info.SeatID = msg.SeatID
		h.broadcastToRoom(client.room, OutgoingMessage{
			Type:   MsgUserSat,
			UserID: client.info.ID,
			SeatID: msg.SeatID,
			X:      msg.X,
			Y:      msg.Y,
		}, client.info.ID)

	case MsgStand:
		client.info.SeatID = ""
		h.broadcastToRoom(client.room, OutgoingMessage{
			Type:   MsgUserStood,
			UserID: client.info.ID,
		}, client.info.ID)

	case MsgChat:
		now := time.Now()
		chatMsg := ChatMessage{
			UserID:    client.info.ID,
			UserName:  client.info.Name,
			Text:      msg.Text,
			Timestamp: now.UnixMilli(),
		}

		// Save to in-memory cache
		h.mu.Lock()
		room := h.rooms[client.room]
		if room != nil {
			room.chatHistory = append(room.chatHistory, chatMsg)
			if len(room.chatHistory) > maxChatHistory {
				room.chatHistory = room.chatHistory[1:]
			}
		}
		h.mu.Unlock()

		// Persist to DB
		if db.DB != nil {
			dbMsg := model.ChatMessage{
				FloorSlug: client.room,
				UserID:    client.info.ID,
				UserName:  client.info.Name,
				Text:      msg.Text,
				CreatedAt: now,
			}
			if err := db.DB.Create(&dbMsg).Error; err != nil {
				log.Printf("[%s] failed to persist chat message: %v", client.room, err)
			}
		}

		h.broadcastToRoom(client.room, OutgoingMessage{
			Type:    MsgUserChat,
			Message: &chatMsg,
		}, "")

	case MsgStatus:
		client.info.Status = msg.Status
		client.info.StatusMessage = msg.StatusMessage
		h.broadcastToRoom(client.room, OutgoingMessage{
			Type:          MsgUserStatus,
			UserID:        client.info.ID,
			Status:        msg.Status,
			StatusMessage: msg.StatusMessage,
		}, client.info.ID)

	case MsgKick:
		if msg.TargetUserID == "" {
			return
		}
		h.mu.RLock()
		room := h.rooms[client.room]
		h.mu.RUnlock()
		if room == nil {
			return
		}
		h.mu.RLock()
		target, ok := room.clients[msg.TargetUserID]
		h.mu.RUnlock()
		if !ok {
			return
		}
		// Send kicked message to target
		target.send <- MarshalMessage(OutgoingMessage{
			Type:   MsgKicked,
			UserID: msg.TargetUserID,
		})
		// Close target's connection after a short delay
		go func() {
			time.Sleep(500 * time.Millisecond)
			target.conn.Close()
		}()
		log.Printf("[%s] %s kicked %s", client.room, client.info.Name, target.info.Name)

	case MsgSceneUpdate:
		// Notify other users that the floor scene has been updated
		h.broadcastToRoom(client.room, OutgoingMessage{
			Type:   MsgSceneUpdated,
			UserID: client.info.ID,
		}, client.info.ID)

	case MsgReaction:
		if msg.Emoji != "" {
			h.broadcastToRoom(client.room, OutgoingMessage{
				Type:   MsgUserReaction,
				UserID: client.info.ID,
				Emoji:  msg.Emoji,
			}, "")
		}

	case MsgMedia:
		if msg.IsMuted != nil {
			client.info.IsMuted = *msg.IsMuted
		}
		if msg.IsCamOn != nil {
			client.info.IsCamOn = *msg.IsCamOn
		}
		h.broadcastToRoom(client.room, OutgoingMessage{
			Type:    MsgUserMedia,
			UserID:  client.info.ID,
			IsMuted: msg.IsMuted,
			IsCamOn: msg.IsCamOn,
		}, client.info.ID)

	case MsgProfileUpdate:
		if msg.Name != "" {
			client.info.Name = msg.Name
		}
		if msg.AvatarStyle != "" {
			client.info.AvatarStyle = msg.AvatarStyle
		}
		if msg.AvatarSeed != "" {
			client.info.AvatarSeed = msg.AvatarSeed
		}
		h.broadcastToRoom(client.room, OutgoingMessage{
			Type:        MsgUserProfileUpdated,
			UserID:      client.info.ID,
			Name:        client.info.Name,
			AvatarStyle: client.info.AvatarStyle,
			AvatarSeed:  client.info.AvatarSeed,
		}, client.info.ID)

	case MsgDM:
		if msg.TargetUserID == "" || msg.Text == "" {
			return
		}
		h.mu.RLock()
		room := h.rooms[client.room]
		h.mu.RUnlock()
		if room == nil {
			return
		}

		now := time.Now()
		ts := now.UTC().Format(time.RFC3339)

		// Persist DM to DB
		if db.DB != nil {
			dbDM := model.DMMessage{
				FloorSlug: client.room,
				FromID:    client.info.ID,
				FromName:  client.info.Name,
				ToID:      msg.TargetUserID,
				Text:      msg.Text,
				CreatedAt: now,
			}
			if err := db.DB.Create(&dbDM).Error; err != nil {
				log.Printf("[%s] failed to persist DM: %v", client.room, err)
			}
		}

		dmMsg := OutgoingMessage{
			Type:      MsgDMReceived,
			From:      client.info.ID,
			To:        msg.TargetUserID,
			Text:      msg.Text,
			Timestamp: ts,
		}
		data := MarshalMessage(dmMsg)

		// Send to target (if online)
		h.mu.RLock()
		target, ok := room.clients[msg.TargetUserID]
		h.mu.RUnlock()
		if ok {
			select {
			case target.send <- data:
			default:
			}
		}
		// Echo back to sender
		select {
		case client.send <- data:
		default:
		}
		log.Printf("[%s] DM from %s to %s (target online: %v)", client.room, client.info.Name, msg.TargetUserID, ok)

	case MsgCallRequest:
		if msg.TargetUserID == "" {
			return
		}
		h.mu.RLock()
		room := h.rooms[client.room]
		h.mu.RUnlock()
		if room == nil {
			return
		}
		h.mu.RLock()
		target, ok := room.clients[msg.TargetUserID]
		h.mu.RUnlock()
		if !ok {
			return
		}
		data := MarshalMessage(OutgoingMessage{
			Type:   MsgCallRequestReceived,
			UserID: client.info.ID,
			Name:   client.info.Name,
		})
		select {
		case target.send <- data:
		default:
		}
		log.Printf("[%s] call request from %s to %s", client.room, client.info.Name, target.info.Name)

	case MsgCallAccept:
		if msg.TargetUserID == "" {
			return
		}
		h.mu.RLock()
		room := h.rooms[client.room]
		h.mu.RUnlock()
		if room == nil {
			return
		}
		h.mu.RLock()
		target, ok := room.clients[msg.TargetUserID]
		h.mu.RUnlock()
		if !ok {
			return
		}
		data := MarshalMessage(OutgoingMessage{
			Type:   MsgCallAcceptReceived,
			UserID: client.info.ID,
		})
		select {
		case target.send <- data:
		default:
		}
		log.Printf("[%s] call accepted by %s for %s", client.room, client.info.Name, target.info.Name)

	case MsgCallDecline:
		if msg.TargetUserID == "" {
			return
		}
		h.mu.RLock()
		room := h.rooms[client.room]
		h.mu.RUnlock()
		if room == nil {
			return
		}
		h.mu.RLock()
		target, ok := room.clients[msg.TargetUserID]
		h.mu.RUnlock()
		if !ok {
			return
		}
		data := MarshalMessage(OutgoingMessage{
			Type:   MsgCallDeclineReceived,
			UserID: client.info.ID,
		})
		select {
		case target.send <- data:
		default:
		}
		log.Printf("[%s] call declined by %s for %s", client.room, client.info.Name, target.info.Name)

	case MsgCallEnd:
		if msg.TargetUserID == "" {
			return
		}
		h.mu.RLock()
		endRoom := h.rooms[client.room]
		h.mu.RUnlock()
		if endRoom == nil {
			return
		}
		h.mu.RLock()
		endTarget, endOk := endRoom.clients[msg.TargetUserID]
		h.mu.RUnlock()
		if !endOk {
			return
		}
		endData := MarshalMessage(OutgoingMessage{
			Type:   MsgCallEndReceived,
			UserID: client.info.ID,
		})
		select {
		case endTarget.send <- endData:
		default:
		}

	case MsgBoardUpdate:
		// Relay board data to all users in the same room (except sender)
		h.broadcastToRoom(client.room, OutgoingMessage{
			Type:      MsgBoardUpdated,
			UserID:    client.info.ID,
			BoardData: msg.BoardData,
			MeetingID: msg.MeetingID,
		}, client.info.ID)

	case MsgWhisper:
		if msg.Text == "" {
			return
		}
		h.mu.RLock()
		room := h.rooms[client.room]
		h.mu.RUnlock()
		if room == nil {
			return
		}
		// Find all clients in the same room within 150 scene units
		const whisperDist = 150.0
		ts := time.Now().UTC().Format(time.RFC3339)
		whisperMsg := OutgoingMessage{
			Type:      MsgUserWhisper,
			UserID:    client.info.ID,
			Name:      client.info.Name,
			Text:      msg.Text,
			Timestamp: ts,
		}
		data := MarshalMessage(whisperMsg)
		h.mu.RLock()
		for _, c := range room.clients {
			if c.info.ID == client.info.ID {
				// Also send to sender so they see their own whisper
				select {
				case c.send <- data:
				default:
				}
				continue
			}
			dx := c.info.X - client.info.X
			dy := c.info.Y - client.info.Y
			dist := math.Sqrt(dx*dx + dy*dy)
			if dist <= whisperDist {
				select {
				case c.send <- data:
				default:
				}
			}
		}
		h.mu.RUnlock()

	case MsgMeetingStart:
		h.handleMeetingStart(client, msg)

	case MsgMeetingJoin:
		h.handleMeetingJoin(client, msg)

	case MsgMeetingLeave:
		h.handleMeetingLeave(client, msg)
	}
}

// --- Meeting lifecycle ---

func (h *Hub) getMeetingList(slug string) []ActiveMeetingInfo {
	h.mu.RLock()
	defer h.mu.RUnlock()
	room, ok := h.rooms[slug]
	if !ok {
		return nil
	}
	list := make([]ActiveMeetingInfo, 0, len(room.activeMeetings))
	for _, m := range room.activeMeetings {
		pids := make([]string, 0, len(m.Participants))
		for uid := range m.Participants {
			pids = append(pids, uid)
		}
		list = append(list, ActiveMeetingInfo{
			ID:           m.ID,
			Name:         m.Name,
			CreatedBy:    m.CreatedBy,
			CreatorName:  m.CreatorName,
			HasPassword:  m.HasPassword,
			Participants: pids,
			CreatedAt:    m.CreatedAt.UnixMilli(),
		})
	}
	return list
}

func (h *Hub) getFloorPerms(slug string) model.PlanPermissions {
	floorPlan := model.PlanFree
	if db.DB != nil {
		var floor model.Floor
		if err := db.DB.Where("slug = ?", slug).First(&floor).Error; err == nil {
			var sub model.Subscription
			if err := db.DB.Where("floor_id = ? AND status IN ?", floor.ID, []string{"active", "trialing"}).First(&sub).Error; err == nil {
				floorPlan = sub.Plan
			}
		}
	}
	return model.PlanPermissionsMap[floorPlan]
}

func (h *Hub) handleMeetingStart(client *Client, msg IncomingMessage) {
	if msg.MeetingID == "" {
		return
	}

	h.mu.Lock()
	room, ok := h.rooms[client.room]
	if !ok {
		h.mu.Unlock()
		return
	}

	// Enforce concurrent meeting limit
	perms := h.getFloorPerms(client.room)
	if perms.MaxConcurrentMeetings > 0 && len(room.activeMeetings) >= perms.MaxConcurrentMeetings {
		h.mu.Unlock()
		client.send <- MarshalMessage(OutgoingMessage{
			Type: MsgMeetingError,
			Text: "Freeプランでは同時に1つのミーティングまでです。",
		})
		return
	}

	// Create meeting
	room.activeMeetings[msg.MeetingID] = &activeMeeting{
		ID:           msg.MeetingID,
		Name:         msg.MeetingName,
		CreatedBy:    client.info.ID,
		CreatorName:  client.info.Name,
		HasPassword:  msg.HasPassword,
		Participants: map[string]bool{client.info.ID: true},
		CreatedAt:    time.Now(),
	}
	h.mu.Unlock()

	// Broadcast to all
	h.broadcastToRoom(client.room, OutgoingMessage{
		Type:        MsgMeetingStarted,
		MeetingID:   msg.MeetingID,
		MeetingName: msg.MeetingName,
		HasPassword: msg.HasPassword,
		UserID:      client.info.ID,
		Name:        client.info.Name,
		Participants: 1,
	}, "")

	log.Printf("[%s] meeting started: %s by %s", client.room, msg.MeetingName, client.info.Name)
}

func (h *Hub) handleMeetingJoin(client *Client, msg IncomingMessage) {
	if msg.MeetingID == "" {
		return
	}

	h.mu.Lock()
	room, ok := h.rooms[client.room]
	if !ok {
		h.mu.Unlock()
		return
	}

	meeting, ok := room.activeMeetings[msg.MeetingID]
	if !ok {
		h.mu.Unlock()
		return
	}

	// Enforce participant limit
	perms := h.getFloorPerms(client.room)
	if perms.MaxMeetingParticipants > 0 && len(meeting.Participants) >= perms.MaxMeetingParticipants {
		h.mu.Unlock()
		client.send <- MarshalMessage(OutgoingMessage{
			Type:            MsgMeetingError,
			Text:            "ミーティングの参加上限に達しています。",
			MeetingID:       msg.MeetingID,
			MaxParticipants: perms.MaxMeetingParticipants,
		})
		return
	}

	meeting.Participants[client.info.ID] = true
	count := len(meeting.Participants)
	h.mu.Unlock()

	h.broadcastToRoom(client.room, OutgoingMessage{
		Type:         MsgMeetingJoined,
		MeetingID:    msg.MeetingID,
		UserID:       client.info.ID,
		Name:         client.info.Name,
		Participants: count,
	}, "")

	log.Printf("[%s] %s joined meeting %s (%d participants)", client.room, client.info.Name, msg.MeetingID, count)
}

func (h *Hub) handleMeetingLeave(client *Client, msg IncomingMessage) {
	if msg.MeetingID == "" {
		return
	}

	h.mu.Lock()
	room, ok := h.rooms[client.room]
	if !ok {
		h.mu.Unlock()
		return
	}

	meeting, ok := room.activeMeetings[msg.MeetingID]
	if !ok {
		h.mu.Unlock()
		return
	}

	delete(meeting.Participants, client.info.ID)
	count := len(meeting.Participants)

	// Remove meeting if empty
	if count == 0 {
		delete(room.activeMeetings, msg.MeetingID)
	}
	h.mu.Unlock()

	h.broadcastToRoom(client.room, OutgoingMessage{
		Type:         MsgMeetingLeft,
		MeetingID:    msg.MeetingID,
		UserID:       client.info.ID,
		Participants: count,
	}, "")

	log.Printf("[%s] %s left meeting %s (%d remaining)", client.room, client.info.Name, msg.MeetingID, count)
}
