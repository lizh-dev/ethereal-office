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

type Room struct {
	clients              map[string]*Client
	chatHistory          []ChatMessage
	lastActive           time.Time
	recentlyDisconnected map[string]*disconnectedInfo // userId -> info
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
			if time.Since(di.DisconnectAt) > 20*time.Second {
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
		}
		h.rooms[slug] = room
	}
	room.lastActive = time.Now()
	return room
}

func (h *Hub) addClient(client *Client) {
	room := h.getOrCreateRoom(client.room)

	h.mu.Lock()
	// Check if this user was recently disconnected — restore position only, NOT seat
	if di, ok := room.recentlyDisconnected[client.info.ID]; ok {
		if time.Since(di.DisconnectAt) < 20*time.Second {
			client.info.X = di.Info.X
			client.info.Y = di.Info.Y
			// Do NOT restore SeatID — user must re-sit manually
			client.info.Status = "online"
			log.Printf("[%s] %s reconnected, position restored", client.room, client.info.Name)
		}
		delete(room.recentlyDisconnected, client.info.ID)
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

	// Send welcome with existing users and chat history from DB
	users := h.getRoomUsers(client.room)
	welcome := OutgoingMessage{
		Type:        MsgWelcome,
		UserID:      client.info.ID,
		Users:       users,
		ChatHistory: chatHistory,
		SeatID:      client.info.SeatID,
		X:           client.info.X,
		Y:           client.info.Y,
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
	return time.Since(di.DisconnectAt) < 20*time.Second
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

	case MsgRTCOffer:
		if msg.TargetUserID == "" || msg.SDP == "" {
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
			Type:   MsgRTCOfferRelay,
			UserID: client.info.ID,
			SDP:    msg.SDP,
		})
		select {
		case target.send <- data:
		default:
		}

	case MsgRTCAnswer:
		if msg.TargetUserID == "" || msg.SDP == "" {
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
			Type:   MsgRTCAnswerRelay,
			UserID: client.info.ID,
			SDP:    msg.SDP,
		})
		select {
		case target.send <- data:
		default:
		}

	case MsgRTCCandidate:
		if msg.TargetUserID == "" || msg.Candidate == "" {
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
			Type:      MsgRTCCandidateRelay,
			UserID:    client.info.ID,
			Candidate: msg.Candidate,
		})
		select {
		case target.send <- data:
		default:
		}

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
		h.mu.RLock()
		target, ok := room.clients[msg.TargetUserID]
		h.mu.RUnlock()
		if !ok {
			return
		}
		ts := time.Now().UTC().Format(time.RFC3339)
		dmMsg := OutgoingMessage{
			Type:      MsgDMReceived,
			From:      client.info.ID,
			To:        msg.TargetUserID,
			Text:      msg.Text,
			Timestamp: ts,
		}
		data := MarshalMessage(dmMsg)
		// Send to target
		select {
		case target.send <- data:
		default:
		}
		// Echo back to sender
		select {
		case client.send <- data:
		default:
		}
		log.Printf("[%s] DM from %s to %s", client.room, client.info.Name, target.info.Name)

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
	}
}
