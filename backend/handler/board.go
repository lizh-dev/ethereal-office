package handler

import (
	"net/http"
	"strings"

	"github.com/ethereal-office/backend/db"
	"github.com/ethereal-office/backend/model"
)

// GET /api/floors/{slug}/board-access?boardId=xxx
// Validates that a board ID is allowed for the given floor and its plan.
func CheckBoardAccess(w http.ResponseWriter, r *http.Request) {
	slug := r.PathValue("slug")
	boardId := r.URL.Query().Get("boardId")
	userId := r.URL.Query().Get("userId")
	_ = userId // reserved for future per-participant access control
	if slug == "" || boardId == "" {
		writeError(w, http.StatusBadRequest, "slug and boardId are required")
		return
	}

	// 1. Floor must exist
	var floor model.Floor
	if err := db.DB.Where("slug = ?", slug).First(&floor).Error; err != nil {
		writeJSON(w, http.StatusNotFound, map[string]any{
			"allowed": false,
			"error":   "floor_not_found",
		})
		return
	}

	// 2. Get plan permissions
	plan := getFloorPlan(slug)
	perms := model.PlanPermissionsMap[plan]

	// 3. Board ID must belong to this floor (prefix check)
	if !strings.HasPrefix(boardId, slug+"-") {
		writeJSON(w, http.StatusForbidden, map[string]any{
			"allowed": false,
			"error":   "invalid_board",
		})
		return
	}

	// 4. Free plan: only one board allowed ({slug}-board)
	if perms.MaxBoards > 0 && boardId != slug+"-board" {
		writeJSON(w, http.StatusForbidden, map[string]any{
			"allowed":   false,
			"error":     "board_limit",
			"maxBoards": perms.MaxBoards,
		})
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"allowed":   true,
		"maxBoards": perms.MaxBoards,
	})
}
