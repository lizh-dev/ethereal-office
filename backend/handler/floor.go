package handler

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"net/http"
	"regexp"

	"github.com/ethereal-office/backend/db"
	"github.com/ethereal-office/backend/model"
	"gorm.io/datatypes"
)

var validSlugRegex = regexp.MustCompile(`^[a-zA-Z0-9][a-zA-Z0-9_-]{2,29}$`)

type CreateFloorRequest struct {
	Name            string          `json:"name"`
	OwnerEmail      string          `json:"ownerEmail"`
	CustomSlug      string          `json:"customSlug,omitempty"`
	CreatorName     string          `json:"creatorName,omitempty"`
	Password        string          `json:"password,omitempty"`
	OwnerPassword   string          `json:"ownerPassword,omitempty"`
	ExcalidrawScene json.RawMessage `json:"excalidrawScene,omitempty"`
}

type UpdateFloorRequest struct {
	Name            *string         `json:"name,omitempty"`
	CustomSlug      *string         `json:"customSlug,omitempty"`
	ExcalidrawScene json.RawMessage `json:"excalidrawScene,omitempty"`
	Zones           json.RawMessage `json:"zones,omitempty"`
	Settings        json.RawMessage `json:"settings,omitempty"`
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

func decodeJSON(r *http.Request, v any) error {
	return json.NewDecoder(r.Body).Decode(v)
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
	if req.OwnerEmail == "" {
		writeError(w, http.StatusBadRequest, "ownerEmail is required")
		return
	}

	// Free plan: 1 floor limit per email
	var existingCount int64
	db.DB.Model(&model.Floor{}).Where("owner_email = ?", req.OwnerEmail).Count(&existingCount)
	if existingCount > 0 {
		// Check if this email has a Pro subscription
		var sub model.Subscription
		hasPro := db.DB.Where("owner_email = ? AND status IN ?", req.OwnerEmail, []string{"active", "trialing"}).First(&sub).Error == nil
		if !hasPro {
			writeJSON(w, http.StatusForbidden, map[string]any{
				"error":   "floor_limit",
				"message": "Freeプランは1フロアまでです。Proにアップグレードするとフロアを無制限に作成できます。",
			})
			return
		}
	}

	// Determine slug: custom (Pro only) or random
	slug := generateSlug()
	if req.CustomSlug != "" {
		// Custom slug requires Pro
		var sub model.Subscription
		hasPro := db.DB.Where("owner_email = ? AND status IN ?", req.OwnerEmail, []string{"active", "trialing"}).First(&sub).Error == nil
		if !hasPro {
			writeJSON(w, http.StatusForbidden, map[string]any{
				"error":   "pro_required",
				"message": "カスタムIDはProプラン限定です",
			})
			return
		}
		if !validSlugRegex.MatchString(req.CustomSlug) {
			writeJSON(w, http.StatusBadRequest, map[string]any{
				"error":   "invalid_slug",
				"message": "IDは英数字・ハイフン・アンダースコアで3〜30文字です",
			})
			return
		}
		// Check availability
		var count int64
		db.DB.Model(&model.Floor{}).Where("slug = ?", req.CustomSlug).Count(&count)
		if count > 0 {
			writeJSON(w, http.StatusConflict, map[string]any{
				"error":   "slug_taken",
				"message": "このIDは既に使用されています",
			})
			return
		}
		slug = req.CustomSlug
	}

	editToken := generateSlug() + generateSlug() // 16 hex chars
	floor := model.Floor{
		Slug:       slug,
		Name:       req.Name,
		OwnerEmail: req.OwnerEmail,
		EditToken:  editToken,
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
		"ownerEmail":      floor.OwnerEmail,
		"creatorName":     floor.CreatorName,
		"excalidrawScene": floor.ExcalidrawScene,
		"zones":           floor.Zones,
		"settings":        floor.Settings,
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
	if req.CustomSlug != nil && *req.CustomSlug != "" {
		newSlug := *req.CustomSlug
		// Pro check
		if floor.OwnerEmail != "" {
			var sub model.Subscription
			hasPro := db.DB.Where("owner_email = ? AND status IN ?", floor.OwnerEmail, []string{"active", "trialing"}).First(&sub).Error == nil
			if !hasPro {
				writeJSON(w, http.StatusForbidden, map[string]any{"error": "pro_required", "message": "カスタムIDはProプラン限定です"})
				return
			}
		}
		if !validSlugRegex.MatchString(newSlug) {
			writeJSON(w, http.StatusBadRequest, map[string]any{"error": "invalid_slug", "message": "IDは英数字・ハイフン・アンダースコアで3〜30文字です"})
			return
		}
		var count int64
		db.DB.Model(&model.Floor{}).Where("slug = ? AND id != ?", newSlug, floor.ID).Count(&count)
		if count > 0 {
			writeJSON(w, http.StatusConflict, map[string]any{"error": "slug_taken", "message": "このIDは既に使用されています"})
			return
		}
		updates["slug"] = newSlug
	}
	if req.ExcalidrawScene != nil {
		updates["excalidraw_scene"] = req.ExcalidrawScene
	}
	if req.Zones != nil {
		updates["zones"] = req.Zones
	}
	if req.Settings != nil {
		// Merge with existing settings
		existing := map[string]any{}
		if floor.Settings != nil {
			json.Unmarshal(floor.Settings, &existing)
		}
		incoming := map[string]any{}
		json.Unmarshal(req.Settings, &incoming)
		for k, v := range incoming {
			existing[k] = v
		}
		merged, _ := json.Marshal(existing)
		updates["settings"] = merged
	}

	if len(updates) > 0 {
		if err := db.DB.Model(&floor).Updates(updates).Error; err != nil {
			writeError(w, http.StatusInternalServerError, "failed to update floor")
			return
		}
	}

	// Reload (use ID since slug may have changed)
	db.DB.First(&floor, floor.ID)
	writeJSON(w, http.StatusOK, map[string]any{
		"slug":    floor.Slug,
		"name":    floor.Name,
		"updated": true,
	})
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

// GET /api/floors/check-slug?slug=xxx
func CheckSlugAvailability(w http.ResponseWriter, r *http.Request) {
	slug := r.URL.Query().Get("slug")
	if slug == "" {
		writeError(w, http.StatusBadRequest, "slug is required")
		return
	}
	if !validSlugRegex.MatchString(slug) {
		writeJSON(w, http.StatusOK, map[string]any{"available": false, "reason": "IDは英数字・ハイフン・アンダースコアで3〜30文字です"})
		return
	}
	var count int64
	db.DB.Model(&model.Floor{}).Where("slug = ?", slug).Count(&count)
	writeJSON(w, http.StatusOK, map[string]any{"available": count == 0})
}

// GET /api/floors/by-owner?email=xxx
func GetFloorsByOwner(w http.ResponseWriter, r *http.Request) {
	email := r.URL.Query().Get("email")
	if email == "" {
		writeError(w, http.StatusBadRequest, "email is required")
		return
	}

	var floors []model.Floor
	db.DB.Where("owner_email = ?", email).Order("created_at DESC").Find(&floors)

	type floorSummary struct {
		ID        string `json:"id"`
		Slug      string `json:"slug"`
		Name      string `json:"name"`
		CreatedAt string `json:"createdAt"`
	}

	result := make([]floorSummary, 0, len(floors))
	for _, f := range floors {
		result = append(result, floorSummary{
			ID:        f.ID.String(),
			Slug:      f.Slug,
			Name:      f.Name,
			CreatedAt: f.CreatedAt.Format("2006-01-02T15:04:05Z"),
		})
	}

	writeJSON(w, http.StatusOK, result)
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
