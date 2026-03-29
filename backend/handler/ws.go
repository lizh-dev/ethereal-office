package handler

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/ethereal-office/backend/ws"
	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		allowed := os.Getenv("WS_ALLOWED_ORIGINS")
		if allowed == "" {
			return true // dev mode
		}
		origin := r.Header.Get("Origin")
		for _, o := range strings.Split(allowed, ",") {
			if strings.TrimSpace(o) == origin {
				return true
			}
		}
		return false
	},
}

func HandleWebSocket(hub *ws.Hub) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		floor := r.URL.Query().Get("floor")
		name := r.URL.Query().Get("name")
		avatarStyle := r.URL.Query().Get("avatar")
		avatarSeed := r.URL.Query().Get("seed")

		if floor == "" || name == "" {
			http.Error(w, "floor and name are required", http.StatusBadRequest)
			return
		}

		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			log.Printf("ws upgrade error: %v", err)
			return
		}

		userID := fmt.Sprintf("user-%s", uuid.New().String()[:8])
		info := ws.UserInfo{
			ID:          userID,
			Name:        name,
			AvatarStyle: avatarStyle,
			AvatarSeed:  avatarSeed,
			Status:      "online",
			X:           400,
			Y:           300,
		}

		client := ws.NewClient(hub, conn, floor, info)
		hub.Register(client)

		go client.WritePump()
		go client.ReadPump()
	}
}
