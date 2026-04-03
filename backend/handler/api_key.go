package handler

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"net/http"
	"time"

	"github.com/ethereal-office/backend/db"
	"github.com/ethereal-office/backend/model"
	"github.com/google/uuid"
)

func generateAPIKey() (key string, hash string) {
	b := make([]byte, 24)
	rand.Read(b)
	key = "eo_" + hex.EncodeToString(b)
	h := sha256.Sum256([]byte(key))
	hash = hex.EncodeToString(h[:])
	return
}

// verifyOwnerAuth checks the X-Owner-Password header against the floor's owner password.
// Returns the floor on success, or writes an error and returns nil.
func verifyOwnerAuth(w http.ResponseWriter, r *http.Request) *model.Floor {
	slug := r.PathValue("slug")
	if slug == "" {
		writeError(w, http.StatusBadRequest, "slug is required")
		return nil
	}

	var floor model.Floor
	if err := db.DB.Where("slug = ?", slug).First(&floor).Error; err != nil {
		writeError(w, http.StatusNotFound, "floor not found")
		return nil
	}

	ownerPw := r.Header.Get("X-Owner-Password")
	if floor.OwnerPassword == nil || *floor.OwnerPassword == "" {
		writeError(w, http.StatusForbidden, "owner password not set")
		return nil
	}

	if ownerPw != *floor.OwnerPassword {
		writeError(w, http.StatusForbidden, "invalid owner password")
		return nil
	}

	return &floor
}

// POST /api/floors/{slug}/api-keys
func CreateAPIKey(w http.ResponseWriter, r *http.Request) {
	floor := verifyOwnerAuth(w, r)
	if floor == nil {
		return
	}

	var body struct {
		Name string `json:"name"`
	}
	if err := decodeJSON(r, &body); err != nil || body.Name == "" {
		writeError(w, http.StatusBadRequest, "name is required")
		return
	}

	key, hash := generateAPIKey()
	prefix := key[:10] + "..."

	apiKey := model.APIKey{
		FloorID:   floor.ID,
		Name:      body.Name,
		KeyHash:   hash,
		KeyPrefix: prefix,
	}
	if err := db.DB.Create(&apiKey).Error; err != nil {
		writeError(w, http.StatusInternalServerError, "failed to create API key")
		return
	}

	writeJSON(w, http.StatusCreated, map[string]any{
		"id":        apiKey.ID,
		"floorId":   apiKey.FloorID,
		"name":      apiKey.Name,
		"keyPrefix": apiKey.KeyPrefix,
		"key":       key,
		"createdAt": apiKey.CreatedAt,
	})
}

// GET /api/floors/{slug}/api-keys
func ListAPIKeys(w http.ResponseWriter, r *http.Request) {
	floor := verifyOwnerAuth(w, r)
	if floor == nil {
		return
	}

	var keys []model.APIKey
	if err := db.DB.Where("floor_id = ?", floor.ID).Order("created_at DESC").Find(&keys).Error; err != nil {
		writeError(w, http.StatusInternalServerError, "failed to list API keys")
		return
	}

	writeJSON(w, http.StatusOK, keys)
}

// DELETE /api/floors/{slug}/api-keys/{keyId}
func RevokeAPIKey(w http.ResponseWriter, r *http.Request) {
	floor := verifyOwnerAuth(w, r)
	if floor == nil {
		return
	}

	keyId := r.PathValue("keyId")
	if keyId == "" {
		writeError(w, http.StatusBadRequest, "keyId is required")
		return
	}

	keyUUID, err := uuid.Parse(keyId)
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid keyId")
		return
	}

	now := time.Now()
	result := db.DB.Model(&model.APIKey{}).
		Where("id = ? AND floor_id = ? AND revoked_at IS NULL", keyUUID, floor.ID).
		Update("revoked_at", now)

	if result.RowsAffected == 0 {
		writeError(w, http.StatusNotFound, "API key not found or already revoked")
		return
	}

	writeJSON(w, http.StatusOK, map[string]bool{"ok": true})
}
