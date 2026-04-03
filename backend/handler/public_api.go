package handler

import (
	"encoding/json"
	"net/http"

	"github.com/ethereal-office/backend/db"
	"github.com/ethereal-office/backend/model"
	"github.com/ethereal-office/backend/ws"
)

// GET /api/v1/floors/{slug}
func PublicGetFloor(w http.ResponseWriter, r *http.Request) {
	slug := r.PathValue("slug")
	if slug == "" {
		writeError(w, http.StatusBadRequest, "slug is required")
		return
	}

	var floor model.Floor
	if err := db.DB.Where("slug = ?", slug).First(&floor).Error; err != nil {
		writeError(w, http.StatusNotFound, "floor not found")
		return
	}

	// Count zones from the JSON field
	zoneCount := 0
	if floor.Zones != nil {
		var zones []json.RawMessage
		if err := json.Unmarshal(floor.Zones, &zones); err == nil {
			zoneCount = len(zones)
		}
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"name":      floor.Name,
		"slug":      floor.Slug,
		"createdAt": floor.CreatedAt,
		"zoneCount": zoneCount,
	})
}

// PublicGetMembers returns online members for a floor. It needs a hub reference
// to look up connected users, so it's created as a closure.
func PublicGetMembers(hub *ws.Hub) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		slug := r.PathValue("slug")
		if slug == "" {
			writeError(w, http.StatusBadRequest, "slug is required")
			return
		}

		// Verify floor exists
		var floor model.Floor
		if err := db.DB.Where("slug = ?", slug).First(&floor).Error; err != nil {
			writeError(w, http.StatusNotFound, "floor not found")
			return
		}

		users := hub.GetRoomUsers(slug)
		if users == nil {
			users = []ws.UserInfo{}
		}

		// Return a simplified view of online members
		members := make([]map[string]any, 0, len(users))
		for _, u := range users {
			members = append(members, map[string]any{
				"id":     u.ID,
				"name":   u.Name,
				"status": u.Status,
				"seatId": u.SeatID,
				"x":      u.X,
				"y":      u.Y,
			})
		}

		writeJSON(w, http.StatusOK, map[string]any{
			"floor":   slug,
			"online":  len(members),
			"members": members,
		})
	}
}

// GET /api/v1/floors/{slug}/zones
func PublicGetZones(w http.ResponseWriter, r *http.Request) {
	slug := r.PathValue("slug")
	if slug == "" {
		writeError(w, http.StatusBadRequest, "slug is required")
		return
	}

	var floor model.Floor
	if err := db.DB.Where("slug = ?", slug).First(&floor).Error; err != nil {
		writeError(w, http.StatusNotFound, "floor not found")
		return
	}

	// Parse zones JSON to return structured data
	var zones []json.RawMessage
	if floor.Zones != nil {
		if err := json.Unmarshal(floor.Zones, &zones); err != nil {
			zones = []json.RawMessage{}
		}
	} else {
		zones = []json.RawMessage{}
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"floor": slug,
		"zones": zones,
	})
}
