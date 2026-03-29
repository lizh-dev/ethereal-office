package handler

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"net/http"

	"github.com/ethereal-office/backend/db"
	"github.com/ethereal-office/backend/model"
)

type CreateFloorRequest struct {
	Name        string `json:"name"`
	CreatorName string `json:"creatorName,omitempty"`
}

type UpdateFloorRequest struct {
	Name            *string         `json:"name,omitempty"`
	ExcalidrawScene json.RawMessage `json:"excalidrawScene,omitempty"`
	Zones           json.RawMessage `json:"zones,omitempty"`
}

func generateSlug() string {
	b := make([]byte, 4)
	rand.Read(b)
	return hex.EncodeToString(b)
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}

func writeError(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, map[string]string{"error": msg})
}

// POST /api/floors
func CreateFloor(w http.ResponseWriter, r *http.Request) {
	var req CreateFloorRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if req.Name == "" {
		writeError(w, http.StatusBadRequest, "name is required")
		return
	}

	editToken := generateSlug() + generateSlug() // 16 hex chars
	floor := model.Floor{
		Slug:      generateSlug(),
		Name:      req.Name,
		EditToken: editToken,
	}
	if req.CreatorName != "" {
		floor.CreatorName = &req.CreatorName
	}

	if err := db.DB.Create(&floor).Error; err != nil {
		writeError(w, http.StatusInternalServerError, "failed to create floor")
		return
	}

	// Return editToken only on creation (json:"-" hides it in other responses)
	writeJSON(w, http.StatusCreated, map[string]any{
		"id":          floor.ID,
		"slug":        floor.Slug,
		"name":        floor.Name,
		"creatorName": floor.CreatorName,
		"editToken":   editToken,
		"createdAt":   floor.CreatedAt,
	})
}

// GET /api/floors/{slug}
func GetFloor(w http.ResponseWriter, r *http.Request) {
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

	writeJSON(w, http.StatusOK, floor)
}

// PATCH /api/floors/{slug}
func UpdateFloor(w http.ResponseWriter, r *http.Request) {
	slug := r.PathValue("slug")
	if slug == "" {
		writeError(w, http.StatusBadRequest, "slug is required")
		return
	}

	// Verify edit token from header
	editToken := r.Header.Get("X-Edit-Token")
	if editToken == "" {
		writeError(w, http.StatusForbidden, "edit token required")
		return
	}

	var floor model.Floor
	if err := db.DB.Where("slug = ?", slug).First(&floor).Error; err != nil {
		writeError(w, http.StatusNotFound, "floor not found")
		return
	}

	if floor.EditToken != editToken {
		writeError(w, http.StatusForbidden, "invalid edit token")
		return
	}

	var req UpdateFloorRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	updates := map[string]any{}
	if req.Name != nil {
		updates["name"] = *req.Name
	}
	if req.ExcalidrawScene != nil {
		updates["excalidraw_scene"] = req.ExcalidrawScene
	}
	if req.Zones != nil {
		updates["zones"] = req.Zones
	}

	if len(updates) > 0 {
		if err := db.DB.Model(&floor).Updates(updates).Error; err != nil {
			writeError(w, http.StatusInternalServerError, "failed to update floor")
			return
		}
	}

	// Reload
	db.DB.Where("slug = ?", slug).First(&floor)
	writeJSON(w, http.StatusOK, floor)
}

// POST /api/floors/{slug}/verify-token
func VerifyEditToken(w http.ResponseWriter, r *http.Request) {
	slug := r.PathValue("slug")
	editToken := r.Header.Get("X-Edit-Token")
	if slug == "" || editToken == "" {
		writeJSON(w, http.StatusOK, map[string]bool{"canEdit": false})
		return
	}

	var floor model.Floor
	if err := db.DB.Where("slug = ?", slug).First(&floor).Error; err != nil {
		writeJSON(w, http.StatusOK, map[string]bool{"canEdit": false})
		return
	}

	writeJSON(w, http.StatusOK, map[string]bool{"canEdit": floor.EditToken == editToken})
}

// DELETE /api/floors/{slug}
func DeleteFloor(w http.ResponseWriter, r *http.Request) {
	slug := r.PathValue("slug")
	if slug == "" {
		writeError(w, http.StatusBadRequest, "slug is required")
		return
	}

	result := db.DB.Where("slug = ?", slug).Delete(&model.Floor{})
	if result.RowsAffected == 0 {
		writeError(w, http.StatusNotFound, "floor not found")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
