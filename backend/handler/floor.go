package handler

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"net/http"

	"github.com/ethereal-office/backend/db"
	"github.com/ethereal-office/backend/model"
	"gorm.io/datatypes"
)

type CreateFloorRequest struct {
	Name            string          `json:"name"`
	CreatorName     string          `json:"creatorName,omitempty"`
	Password        string          `json:"password,omitempty"`
	OwnerPassword   string          `json:"ownerPassword,omitempty"`
	ExcalidrawScene json.RawMessage `json:"excalidrawScene,omitempty"`
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
	if req.Password != "" {
		floor.Password = &req.Password
	}
	if req.OwnerPassword != "" {
		floor.OwnerPassword = &req.OwnerPassword
	}
	if req.ExcalidrawScene != nil {
		floor.ExcalidrawScene = datatypes.JSON(req.ExcalidrawScene)
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

	writeJSON(w, http.StatusOK, map[string]any{
		"id":              floor.ID,
		"slug":            floor.Slug,
		"name":            floor.Name,
		"creatorName":     floor.CreatorName,
		"excalidrawScene": floor.ExcalidrawScene,
		"zones":           floor.Zones,
		"hasPassword":      floor.Password != nil && *floor.Password != "",
		"hasOwnerPassword": floor.OwnerPassword != nil && *floor.OwnerPassword != "",
		"createdAt":       floor.CreatedAt,
		"updatedAt":       floor.UpdatedAt,
	})
}

// PATCH /api/floors/{slug}
func UpdateFloor(w http.ResponseWriter, r *http.Request) {
	slug := r.PathValue("slug")
	if slug == "" {
		writeError(w, http.StatusBadRequest, "slug is required")
		return
	}

	// Verify owner permission via owner password or legacy edit token
	ownerPw := r.Header.Get("X-Owner-Password")
	editToken := r.Header.Get("X-Edit-Token")

	var floor model.Floor
	if err := db.DB.Where("slug = ?", slug).First(&floor).Error; err != nil {
		writeError(w, http.StatusNotFound, "floor not found")
		return
	}

	authorized := false
	if floor.OwnerPassword != nil && *floor.OwnerPassword != "" {
		authorized = ownerPw == *floor.OwnerPassword
	} else {
		authorized = editToken != "" && floor.EditToken == editToken
	}
	if !authorized {
		writeError(w, http.StatusForbidden, "not authorized to edit")
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

// POST /api/floors/{slug}/verify-owner
func VerifyOwner(w http.ResponseWriter, r *http.Request) {
	slug := r.PathValue("slug")
	var body struct {
		OwnerPassword string `json:"ownerPassword"`
	}
	json.NewDecoder(r.Body).Decode(&body)

	if slug == "" {
		writeJSON(w, http.StatusOK, map[string]bool{"canEdit": false})
		return
	}

	var floor model.Floor
	if err := db.DB.Where("slug = ?", slug).First(&floor).Error; err != nil {
		writeJSON(w, http.StatusOK, map[string]bool{"canEdit": false})
		return
	}

	// No owner password set on floor - check editToken
	if floor.OwnerPassword == nil || *floor.OwnerPassword == "" {
		editToken := r.Header.Get("X-Edit-Token")
		writeJSON(w, http.StatusOK, map[string]bool{"canEdit": editToken != "" && floor.EditToken == editToken})
		return
	}

	// Owner password is set but none provided - deny
	if body.OwnerPassword == "" {
		writeJSON(w, http.StatusOK, map[string]bool{"canEdit": false})
		return
	}

	writeJSON(w, http.StatusOK, map[string]bool{"canEdit": body.OwnerPassword == *floor.OwnerPassword})
}

// POST /api/floors/{slug}/verify-password
func VerifyPassword(w http.ResponseWriter, r *http.Request) {
	slug := r.PathValue("slug")
	var body struct {
		Password string `json:"password"`
	}
	json.NewDecoder(r.Body).Decode(&body)

	var floor model.Floor
	if err := db.DB.Where("slug = ?", slug).First(&floor).Error; err != nil {
		writeJSON(w, http.StatusOK, map[string]bool{"ok": false})
		return
	}

	if floor.Password == nil || *floor.Password == "" {
		writeJSON(w, http.StatusOK, map[string]bool{"ok": true})
		return
	}

	writeJSON(w, http.StatusOK, map[string]bool{"ok": body.Password == *floor.Password})
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
