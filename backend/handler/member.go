package handler

import (
	"net/http"
	"time"

	"github.com/ethereal-office/backend/db"
	"github.com/ethereal-office/backend/model"
	"github.com/google/uuid"
)

// GET /api/floors/{slug}/members
func ListMembers(w http.ResponseWriter, r *http.Request) {
	slug := r.PathValue("slug")
	var floor model.Floor
	if err := db.DB.Where("slug = ?", slug).First(&floor).Error; err != nil {
		writeError(w, http.StatusNotFound, "floor not found")
		return
	}

	var members []model.FloorMember
	db.DB.Where("floor_id = ?", floor.ID).Preload("Account").Find(&members)

	writeJSON(w, http.StatusOK, members)
}

// POST /api/floors/{slug}/members/invite
func InviteMember(w http.ResponseWriter, r *http.Request) {
	slug := r.PathValue("slug")
	accountID := getAccountIDFromRequest(r)
	if accountID == "" {
		writeError(w, http.StatusUnauthorized, "ログインが必要です")
		return
	}

	var floor model.Floor
	if err := db.DB.Where("slug = ?", slug).First(&floor).Error; err != nil {
		writeError(w, http.StatusNotFound, "floor not found")
		return
	}

	// Check inviter is owner or admin
	var inviter model.FloorMember
	if err := db.DB.Where("floor_id = ? AND account_id = ? AND role IN ?", floor.ID, accountID, []string{"owner", "admin"}).First(&inviter).Error; err != nil {
		writeError(w, http.StatusForbidden, "招待権限がありません")
		return
	}

	var body struct {
		Email string `json:"email"`
		Role  string `json:"role"`
	}
	if err := decodeJSON(r, &body); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request")
		return
	}
	if body.Email == "" {
		writeError(w, http.StatusBadRequest, "email is required")
		return
	}
	if body.Role == "" {
		body.Role = "member"
	}

	// Find or create account
	var account model.Account
	if err := db.DB.Where("email = ?", body.Email).First(&account).Error; err != nil {
		// Account doesn't exist yet — create placeholder
		account = model.Account{
			Email:       body.Email,
			DisplayName: body.Email,
		}
		db.DB.Create(&account)
	}

	// Check if already member
	var existing model.FloorMember
	if err := db.DB.Where("floor_id = ? AND account_id = ?", floor.ID, account.ID).First(&existing).Error; err == nil {
		writeError(w, http.StatusConflict, "既にメンバーです")
		return
	}

	inviterID, _ := uuid.Parse(accountID)
	member := model.FloorMember{
		FloorID:   floor.ID,
		AccountID: account.ID,
		Role:      model.MemberRole(body.Role),
		InvitedBy: &inviterID,
		JoinedAt:  time.Now(),
	}
	if err := db.DB.Create(&member).Error; err != nil {
		writeError(w, http.StatusInternalServerError, "招待に失敗しました")
		return
	}

	writeJSON(w, http.StatusCreated, member)
}

// DELETE /api/floors/{slug}/members/{memberId}
func RemoveMember(w http.ResponseWriter, r *http.Request) {
	slug := r.PathValue("slug")
	memberId := r.PathValue("memberId")
	accountID := getAccountIDFromRequest(r)
	if accountID == "" {
		writeError(w, http.StatusUnauthorized, "ログインが必要です")
		return
	}

	var floor model.Floor
	if err := db.DB.Where("slug = ?", slug).First(&floor).Error; err != nil {
		writeError(w, http.StatusNotFound, "floor not found")
		return
	}

	// Check requester is owner or admin
	var requester model.FloorMember
	if err := db.DB.Where("floor_id = ? AND account_id = ? AND role IN ?", floor.ID, accountID, []string{"owner", "admin"}).First(&requester).Error; err != nil {
		writeError(w, http.StatusForbidden, "権限がありません")
		return
	}

	result := db.DB.Where("id = ? AND floor_id = ?", memberId, floor.ID).Delete(&model.FloorMember{})
	if result.RowsAffected == 0 {
		writeError(w, http.StatusNotFound, "メンバーが見つかりません")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
