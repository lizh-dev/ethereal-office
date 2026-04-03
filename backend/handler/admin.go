package handler

import (
	"math"
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/ethereal-office/backend/db"
	"github.com/ethereal-office/backend/model"
)

// adminAuth validates X-Admin-Secret header against ADMIN_SECRET env var.
func adminAuth(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		secret := os.Getenv("ADMIN_SECRET")
		if secret == "" {
			writeError(w, http.StatusServiceUnavailable, "admin not configured")
			return
		}
		if r.Header.Get("X-Admin-Secret") != secret {
			writeError(w, http.StatusUnauthorized, "unauthorized")
			return
		}
		next.ServeHTTP(w, r)
	}
}

// POST /api/admin/login — validate admin secret, return ok
func AdminLogin(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Secret string `json:"secret"`
	}
	if err := decodeJSON(r, &body); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request")
		return
	}
	expected := os.Getenv("ADMIN_SECRET")
	if expected == "" || body.Secret != expected {
		writeError(w, http.StatusUnauthorized, "invalid secret")
		return
	}
	writeJSON(w, http.StatusOK, map[string]bool{"ok": true})
}

// GET /api/admin/dashboard
func AdminDashboard(w http.ResponseWriter, r *http.Request) {
	adminAuth(func(w http.ResponseWriter, r *http.Request) {
		var totalFloors int64
		db.DB.Model(&model.Floor{}).Count(&totalFloors)

		var activeFloors int64
		since := time.Now().Add(-24 * time.Hour)
		db.DB.Model(&model.Floor{}).Where("last_active_at > ?", since).Count(&activeFloors)

		var totalSubscriptions int64
		db.DB.Model(&model.Subscription{}).Where("status = ?", "active").Count(&totalSubscriptions)

		// Revenue last 30 days
		var revenue30d int64
		thirtyDaysAgo := time.Now().AddDate(0, 0, -30)
		db.DB.Model(&model.Transaction{}).
			Where("status = ? AND created_at > ?", "succeeded", thirtyDaysAgo).
			Select("COALESCE(SUM(amount), 0)").Scan(&revenue30d)

		// Revenue previous 30 days
		var revenuePrev30d int64
		sixtyDaysAgo := time.Now().AddDate(0, 0, -60)
		db.DB.Model(&model.Transaction{}).
			Where("status = ? AND created_at > ? AND created_at <= ?", "succeeded", sixtyDaysAgo, thirtyDaysAgo).
			Select("COALESCE(SUM(amount), 0)").Scan(&revenuePrev30d)

		var totalTransactions int64
		db.DB.Model(&model.Transaction{}).Count(&totalTransactions)

		writeJSON(w, http.StatusOK, map[string]any{
			"totalFloors":        totalFloors,
			"activeFloors":       activeFloors,
			"totalSubscriptions": totalSubscriptions,
			"revenue30d":         revenue30d,
			"revenuePrev30d":     revenuePrev30d,
			"totalTransactions":  totalTransactions,
		})
	})(w, r)
}

// GET /api/admin/floors?page=1&limit=20&search=xxx
func AdminListFloors(w http.ResponseWriter, r *http.Request) {
	adminAuth(func(w http.ResponseWriter, r *http.Request) {
		page, _ := strconv.Atoi(r.URL.Query().Get("page"))
		limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
		search := r.URL.Query().Get("search")

		if page < 1 {
			page = 1
		}
		if limit < 1 || limit > 100 {
			limit = 20
		}
		offset := (page - 1) * limit

		query := db.DB.Model(&model.Floor{})
		if search != "" {
			query = query.Where("name ILIKE ? OR slug ILIKE ?", "%"+search+"%", "%"+search+"%")
		}

		var total int64
		query.Count(&total)

		var floors []model.Floor
		query.Order("created_at DESC").Offset(offset).Limit(limit).Find(&floors)

		type floorItem struct {
			ID               string     `json:"id"`
			Slug             string     `json:"slug"`
			Name             string     `json:"name"`
			CreatorName      *string    `json:"creatorName"`
			HasPassword      bool       `json:"hasPassword"`
			HasOwnerPassword bool       `json:"hasOwnerPassword"`
			LastActiveAt     time.Time  `json:"lastActiveAt"`
			CreatedAt        time.Time  `json:"createdAt"`
			Plan             string     `json:"plan"`
		}

		items := make([]floorItem, len(floors))
		for i, f := range floors {
			plan := "free"
			var sub model.Subscription
			if err := db.DB.Where("floor_id = ? AND status = ?", f.ID, "active").First(&sub).Error; err == nil {
				plan = string(sub.Plan)
			}
			items[i] = floorItem{
				ID:               f.ID.String(),
				Slug:             f.Slug,
				Name:             f.Name,
				CreatorName:      f.CreatorName,
				HasPassword:      f.Password != nil && *f.Password != "",
				HasOwnerPassword: f.OwnerPassword != nil && *f.OwnerPassword != "",
				LastActiveAt:     f.LastActiveAt,
				CreatedAt:        f.CreatedAt,
				Plan:             plan,
			}
		}

		writeJSON(w, http.StatusOK, map[string]any{
			"floors":     items,
			"total":      total,
			"page":       page,
			"limit":      limit,
			"totalPages": int(math.Ceil(float64(total) / float64(limit))),
		})
	})(w, r)
}

// DELETE /api/admin/floors/{slug}
func AdminDeleteFloor(w http.ResponseWriter, r *http.Request) {
	adminAuth(func(w http.ResponseWriter, r *http.Request) {
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
	})(w, r)
}

// GET /api/admin/subscriptions?page=1&limit=20
func AdminListSubscriptions(w http.ResponseWriter, r *http.Request) {
	adminAuth(func(w http.ResponseWriter, r *http.Request) {
		page, _ := strconv.Atoi(r.URL.Query().Get("page"))
		limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
		status := r.URL.Query().Get("status")

		if page < 1 {
			page = 1
		}
		if limit < 1 || limit > 100 {
			limit = 20
		}
		offset := (page - 1) * limit

		query := db.DB.Model(&model.Subscription{}).Preload("Floor")
		if status != "" {
			query = query.Where("status = ?", status)
		}

		var total int64
		query.Count(&total)

		var subs []model.Subscription
		query.Order("created_at DESC").Offset(offset).Limit(limit).Find(&subs)

		writeJSON(w, http.StatusOK, map[string]any{
			"subscriptions": subs,
			"total":         total,
			"page":          page,
			"limit":         limit,
			"totalPages":    int(math.Ceil(float64(total) / float64(limit))),
		})
	})(w, r)
}

// GET /api/admin/transactions?page=1&limit=20
func AdminListTransactions(w http.ResponseWriter, r *http.Request) {
	adminAuth(func(w http.ResponseWriter, r *http.Request) {
		page, _ := strconv.Atoi(r.URL.Query().Get("page"))
		limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))

		if page < 1 {
			page = 1
		}
		if limit < 1 || limit > 100 {
			limit = 20
		}
		offset := (page - 1) * limit

		var total int64
		db.DB.Model(&model.Transaction{}).Count(&total)

		var txs []model.Transaction
		db.DB.Preload("Floor").Order("created_at DESC").Offset(offset).Limit(limit).Find(&txs)

		writeJSON(w, http.StatusOK, map[string]any{
			"transactions": txs,
			"total":        total,
			"page":         page,
			"limit":        limit,
			"totalPages":   int(math.Ceil(float64(total) / float64(limit))),
		})
	})(w, r)
}
