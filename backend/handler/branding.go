package handler

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/ethereal-office/backend/db"
	"github.com/ethereal-office/backend/model"
)

const brandingUploadDir = "/tmp/ethereal-uploads/branding"

type UpdateBrandingRequest struct {
	LogoURL     string `json:"logoUrl"`
	AccentColor string `json:"accentColor"`
	FloorTitle  string `json:"floorTitle"`
}

// GET /api/floors/{slug}/branding
func GetFloorBranding(w http.ResponseWriter, r *http.Request) {
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

	var branding model.FloorBranding
	if err := db.DB.Where("floor_id = ?", floor.ID).First(&branding).Error; err != nil {
		// Return defaults if no branding record exists
		writeJSON(w, http.StatusOK, map[string]any{
			"logoUrl":     "",
			"accentColor": "#0ea5e9",
			"floorTitle":  "",
		})
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"logoUrl":     branding.LogoURL,
		"accentColor": branding.AccentColor,
		"floorTitle":  branding.FloorTitle,
	})
}

// PUT /api/floors/{slug}/branding
func UpdateFloorBranding(w http.ResponseWriter, r *http.Request) {
	slug := r.PathValue("slug")
	if slug == "" {
		writeError(w, http.StatusBadRequest, "slug is required")
		return
	}

	// Verify owner permission
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

	var req UpdateBrandingRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	// Create or update branding record
	var branding model.FloorBranding
	result := db.DB.Where("floor_id = ?", floor.ID).First(&branding)

	if result.Error != nil {
		// Create new record
		branding = model.FloorBranding{
			FloorID:     floor.ID,
			LogoURL:     req.LogoURL,
			AccentColor: req.AccentColor,
			FloorTitle:  req.FloorTitle,
		}
		if branding.AccentColor == "" {
			branding.AccentColor = "#0ea5e9"
		}
		if err := db.DB.Create(&branding).Error; err != nil {
			writeError(w, http.StatusInternalServerError, "failed to create branding")
			return
		}
	} else {
		// Update existing record
		updates := map[string]any{
			"logo_url":     req.LogoURL,
			"accent_color": req.AccentColor,
			"floor_title":  req.FloorTitle,
		}
		if req.AccentColor == "" {
			updates["accent_color"] = "#0ea5e9"
		}
		if err := db.DB.Model(&branding).Updates(updates).Error; err != nil {
			writeError(w, http.StatusInternalServerError, "failed to update branding")
			return
		}
		db.DB.Where("floor_id = ?", floor.ID).First(&branding)
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"logoUrl":     branding.LogoURL,
		"accentColor": branding.AccentColor,
		"floorTitle":  branding.FloorTitle,
	})
}

// POST /api/floors/{slug}/branding/logo
func UploadBrandingLogo(w http.ResponseWriter, r *http.Request) {
	slug := r.PathValue("slug")
	if slug == "" {
		writeError(w, http.StatusBadRequest, "slug is required")
		return
	}

	// Verify owner permission
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

	r.Body = http.MaxBytesReader(w, r.Body, maxUploadSize)
	if err := r.ParseMultipartForm(maxUploadSize); err != nil {
		writeError(w, http.StatusBadRequest, "ファイルが大きすぎます（最大10MB）")
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		writeError(w, http.StatusBadRequest, "ファイルが見つかりません")
		return
	}
	defer file.Close()

	// Generate unique filename
	b := make([]byte, 16)
	rand.Read(b)
	ext := filepath.Ext(header.Filename)
	storedName := hex.EncodeToString(b) + ext

	// Ensure upload directory exists
	dir := filepath.Join(brandingUploadDir, slug)
	os.MkdirAll(dir, 0755)

	// Save file
	dst, err := os.Create(filepath.Join(dir, storedName))
	if err != nil {
		writeError(w, http.StatusInternalServerError, "ファイル保存に失敗しました")
		return
	}
	defer dst.Close()

	if _, err := io.Copy(dst, file); err != nil {
		writeError(w, http.StatusInternalServerError, "ファイル保存に失敗しました")
		return
	}

	url := fmt.Sprintf("/api/floors/%s/branding/logo/%s", slug, storedName)

	writeJSON(w, http.StatusCreated, map[string]string{
		"url": url,
	})
}

// GET /api/floors/{slug}/branding/logo/{file}
func ServeBrandingLogo(w http.ResponseWriter, r *http.Request) {
	slug := r.PathValue("slug")
	filename := r.PathValue("file")

	if slug == "" || filename == "" {
		writeError(w, http.StatusBadRequest, "slug and file are required")
		return
	}

	// Sanitize filename to prevent directory traversal
	filename = filepath.Base(filename)
	if strings.Contains(filename, "..") {
		writeError(w, http.StatusBadRequest, "invalid filename")
		return
	}

	filePath := filepath.Join(brandingUploadDir, slug, filename)
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		writeError(w, http.StatusNotFound, "file not found")
		return
	}

	http.ServeFile(w, r, filePath)
}
