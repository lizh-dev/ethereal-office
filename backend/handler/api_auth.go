package handler

import (
	"crypto/sha256"
	"encoding/hex"
	"net/http"
	"strings"
	"time"

	"github.com/ethereal-office/backend/db"
	"github.com/ethereal-office/backend/model"
)

// RequireAPIKeyAuth is a middleware that validates API key authentication
// via the Authorization: Bearer eo_... header.
func RequireAPIKeyAuth(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			writeError(w, http.StatusUnauthorized, "missing Authorization header")
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || parts[0] != "Bearer" || !strings.HasPrefix(parts[1], "eo_") {
			writeError(w, http.StatusUnauthorized, "invalid Authorization header format")
			return
		}

		key := parts[1]
		h := sha256.Sum256([]byte(key))
		keyHash := hex.EncodeToString(h[:])

		var apiKey model.APIKey
		if err := db.DB.Where("key_hash = ? AND revoked_at IS NULL", keyHash).First(&apiKey).Error; err != nil {
			writeError(w, http.StatusUnauthorized, "invalid or revoked API key")
			return
		}

		// Check expiry
		if apiKey.ExpiresAt != nil && time.Now().After(*apiKey.ExpiresAt) {
			writeError(w, http.StatusUnauthorized, "API key has expired")
			return
		}

		// Verify the API key belongs to the floor in the URL path
		slug := r.PathValue("slug")
		if slug != "" {
			var floor model.Floor
			if err := db.DB.Where("slug = ?", slug).First(&floor).Error; err != nil {
				writeError(w, http.StatusNotFound, "floor not found")
				return
			}
			if apiKey.FloorID != floor.ID {
				writeError(w, http.StatusForbidden, "API key does not belong to this floor")
				return
			}
		}

		// Update last_used_at
		now := time.Now()
		db.DB.Model(&apiKey).Update("last_used_at", now)

		next.ServeHTTP(w, r)
	}
}
