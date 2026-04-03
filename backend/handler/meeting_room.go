package handler

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/ethereal-office/backend/db"
	"github.com/ethereal-office/backend/model"
)

type createRoomRequest struct {
	Name     string `json:"name"`
	Password string `json:"password,omitempty"`
	UserID   string `json:"userId"`
	UserName string `json:"userName"`
}

// HandleMeetingRooms handles GET (list) and POST (create) for permanent meeting rooms.
func HandleMeetingRooms() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		slug := strings.TrimPrefix(r.URL.Path, "/api/floors/")
		slug = strings.TrimSuffix(slug, "/meeting-rooms")
		if slug == "" {
			http.Error(w, "missing slug", http.StatusBadRequest)
			return
		}

		switch r.Method {
		case http.MethodGet:
			var rooms []model.MeetingRoom
			if db.DB != nil {
				db.DB.Where("floor_slug = ?", slug).Order("created_at ASC").Find(&rooms)
			}
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(rooms)

		case http.MethodPost:
			var req createRoomRequest
			if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
				http.Error(w, "invalid body", http.StatusBadRequest)
				return
			}
			if req.Name == "" {
				http.Error(w, "name required", http.StatusBadRequest)
				return
			}

			roomID := fmt.Sprintf("%s-%s-%d", slug, strings.ReplaceAll(req.Name, " ", "-"), time.Now().UnixMilli())
			room := model.MeetingRoom{
				FloorSlug:   slug,
				RoomID:      roomID,
				Name:        req.Name,
				CreatedBy:   req.UserID,
				CreatorName: req.UserName,
				HasPassword: req.Password != "",
				Password:    req.Password, // In production, hash this
				Permanent:   true,
			}
			if db.DB != nil {
				if err := db.DB.Create(&room).Error; err != nil {
					http.Error(w, "failed to create room", http.StatusInternalServerError)
					return
				}
			}
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusCreated)
			json.NewEncoder(w).Encode(room)

		default:
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		}
	}
}

// HandleMeetingRoomDelete handles DELETE for a specific permanent room.
func HandleMeetingRoomDelete() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodDelete {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}
		// Path: /api/meeting-rooms/{roomId}
		roomID := strings.TrimPrefix(r.URL.Path, "/api/meeting-rooms/")
		if roomID == "" {
			http.Error(w, "missing room ID", http.StatusBadRequest)
			return
		}
		if db.DB != nil {
			db.DB.Where("room_id = ?", roomID).Delete(&model.MeetingRoom{})
		}
		w.WriteHeader(http.StatusNoContent)
	}
}
