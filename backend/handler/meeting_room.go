package handler

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/ethereal-office/backend/db"
	"github.com/ethereal-office/backend/model"
	"github.com/ethereal-office/backend/ws"
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

// CheckMeetingRoom verifies if a meeting room exists (active or permanent).
func CheckMeetingRoom(hub *ws.Hub) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		roomID := r.PathValue("roomId")
		if roomID == "" {
			http.Error(w, "missing roomId", http.StatusBadRequest)
			return
		}
		floorSlug := r.URL.Query().Get("floor")

		// Check DB for permanent room
		isPermanent := false
		if db.DB != nil {
			var room model.MeetingRoom
			if err := db.DB.Where("room_id = ?", roomID).First(&room).Error; err == nil {
				isPermanent = true
				if floorSlug == "" {
					floorSlug = room.FloorSlug
				}
			}
		}

		// Check hub for active quick meeting
		isActive := false
		if floorSlug != "" {
			isActive = hub.MeetingExists(floorSlug, roomID)
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]any{
			"exists":    isPermanent || isActive,
			"permanent": isPermanent,
			"active":    isActive,
		})
	}
}

// HandleMeetingLeave handles POST to notify that a user left a meeting.
// This is called from the meeting page (which has no WS connection) via HTTP.
func HandleMeetingLeave(hub *ws.Hub) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}
		var body struct {
			MeetingID string `json:"meetingId"`
			UserID    string `json:"userId"`
			FloorSlug string `json:"floorSlug"`
		}
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.MeetingID == "" || body.FloorSlug == "" {
			log.Printf("[meeting-leave] bad request: meetingId=%q floor=%q err=%v", body.MeetingID, body.FloorSlug, err)
			http.Error(w, "invalid body", http.StatusBadRequest)
			return
		}
		log.Printf("[meeting-leave] user=%s leaving meeting=%s floor=%s", body.UserID, body.MeetingID, body.FloorSlug)
		hub.RemoveMeetingParticipant(body.FloorSlug, body.MeetingID, body.UserID)
		w.WriteHeader(http.StatusOK)
	}
}

// HandleMeetingLogs returns archived meeting logs for a floor.
func HandleMeetingLogs() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		slug := r.PathValue("slug")
		if slug == "" {
			http.Error(w, "missing slug", http.StatusBadRequest)
			return
		}
		var logs []model.MeetingLog
		if db.DB != nil {
			db.DB.Where("floor_slug = ?", slug).Order("started_at DESC").Limit(50).Find(&logs)
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(logs)
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
