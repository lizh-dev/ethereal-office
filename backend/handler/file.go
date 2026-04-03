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

const maxUploadSize = 10 << 20 // 10MB
const uploadDir = "/tmp/ethereal-uploads"

// POST /api/floors/{slug}/files
func UploadFile(w http.ResponseWriter, r *http.Request) {
	slug := r.PathValue("slug")
	if slug == "" {
		writeError(w, http.StatusBadRequest, "slug is required")
		return
	}

	// Check floor plan allows file sharing
	plan := getFloorPlan(slug)
	perms := model.PlanPermissionsMap[plan]
	if !perms.FileShare {
		writeJSON(w, http.StatusForbidden, map[string]any{
			"error":        "upgrade_required",
			"requiredPlan": "pro",
			"feature":      "fileShare",
			"message":      "ファイル共有はProプラン以上で利用できます",
		})
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

	userId := r.FormValue("userId")
	userName := r.FormValue("userName")
	if userId == "" || userName == "" {
		writeError(w, http.StatusBadRequest, "userId and userName are required")
		return
	}

	// Generate unique filename
	b := make([]byte, 16)
	rand.Read(b)
	ext := filepath.Ext(header.Filename)
	storedName := hex.EncodeToString(b) + ext

	// Ensure upload directory exists
	dir := filepath.Join(uploadDir, slug)
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

	// Save to DB
	fileRecord := model.File{
		FloorSlug: slug,
		UserID:    userId,
		UserName:  userName,
		FileName:  header.Filename,
		FileSize:  header.Size,
		MimeType:  header.Header.Get("Content-Type"),
		FilePath:  filepath.Join(dir, storedName),
	}
	if err := db.DB.Create(&fileRecord).Error; err != nil {
		writeError(w, http.StatusInternalServerError, "DB保存に失敗しました")
		return
	}

	fileRecord.URL = fmt.Sprintf("/api/floors/%s/files/%s", slug, fileRecord.ID)

	writeJSON(w, http.StatusCreated, fileRecord)
}

// GET /api/floors/{slug}/files/{id}
func DownloadFile(w http.ResponseWriter, r *http.Request) {
	slug := r.PathValue("slug")
	id := r.PathValue("id")

	var file model.File
	if err := db.DB.Where("id = ? AND floor_slug = ?", id, slug).First(&file).Error; err != nil {
		writeError(w, http.StatusNotFound, "ファイルが見つかりません")
		return
	}

	w.Header().Set("Content-Type", file.MimeType)
	w.Header().Set("Content-Disposition", fmt.Sprintf("inline; filename=\"%s\"", strings.ReplaceAll(file.FileName, "\"", "_")))
	http.ServeFile(w, r, file.FilePath)
}
