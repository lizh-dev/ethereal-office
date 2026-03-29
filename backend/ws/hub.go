package ws

import (
	"log"
	"sync"
	"time"
)

const maxChatHistory = 100

type Room struct {
	clients     map[string]*Client
	chatHistory []ChatMessage
	lastActive  time.Time
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
			clients:     make(map[string]*Client),
			chatHistory: make([]ChatMessage, 0),
			lastActive:  time.Now(),
		}
		h.rooms[slug] = room
	}
	room.lastActive = time.Now()
	return room
}

func (h *Hub) addClient(client *Client) {
	room := h.getOrCreateRoom(client.room)

	h.mu.Lock()
	room.clients[client.info.ID] = client
	h.mu.Unlock()

	// Send welcome with existing users and chat history
	users := h.getRoomUsers(client.room)
	welcome := OutgoingMessage{
		Type:        MsgWelcome,
		UserID:      client.info.ID,
		Users:       users,
		ChatHistory: room.chatHistory,
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
		delete(room.clients, client.info.ID)
		if len(room.clients) == 0 {
			delete(h.rooms, client.room)
		}
	}
	h.mu.Unlock()
	close(client.send)

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
		chatMsg := ChatMessage{
			UserID:    client.info.ID,
			Text:      msg.Text,
			Timestamp: time.Now().UnixMilli(),
		}
		h.mu.Lock()
		room := h.rooms[client.room]
		if room != nil {
			room.chatHistory = append(room.chatHistory, chatMsg)
			if len(room.chatHistory) > maxChatHistory {
				room.chatHistory = room.chatHistory[1:]
			}
		}
		h.mu.Unlock()

		h.broadcastToRoom(client.room, OutgoingMessage{
			Type:    MsgUserChat,
			Message: &chatMsg,
		}, "")

	case MsgStatus:
		client.info.Status = msg.Status
		h.broadcastToRoom(client.room, OutgoingMessage{
			Type:   MsgUserStatus,
			UserID: client.info.ID,
			Status: msg.Status,
		}, client.info.ID)

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
	}
}
