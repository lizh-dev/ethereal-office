package handler

import (
	"net/http"

	"github.com/ethereal-office/backend/db"
	"github.com/ethereal-office/backend/model"
)

// getFloorPlan looks up the active plan for a floor by slug.
func getFloorPlan(slug string) model.PlanType {
	var floor model.Floor
	if err := db.DB.Where("slug = ?", slug).First(&floor).Error; err != nil {
		return model.PlanFree
	}
	var sub model.Subscription
	if err := db.DB.Where("floor_id = ? AND status IN ?", floor.ID, []string{"active", "trialing"}).First(&sub).Error; err != nil {
		return model.PlanFree
	}
	return sub.Plan
}

// GET /api/floors/{slug}/permissions
func GetFloorPermissions(w http.ResponseWriter, r *http.Request) {
	slug := r.PathValue("slug")
	if slug == "" {
		writeError(w, http.StatusBadRequest, "slug is required")
		return
	}

	plan := getFloorPlan(slug)
	perms := model.PlanPermissionsMap[plan]

	writeJSON(w, http.StatusOK, map[string]any{
		"plan":        plan,
		"permissions": perms,
	})
}

// RequirePlanFeature returns a middleware that blocks requests if the floor's plan
// doesn't include the given feature. The floor slug is read from the URL path.
func RequirePlanFeature(feature string, next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		slug := r.PathValue("slug")
		if slug == "" {
			writeError(w, http.StatusBadRequest, "slug is required")
			return
		}

		plan := getFloorPlan(slug)
		perms := model.PlanPermissionsMap[plan]

		allowed := false
		switch feature {
		case "voiceCall":
			allowed = perms.VoiceCall
		case "videoCall":
			allowed = perms.VideoCall
		case "screenShare":
			allowed = perms.ScreenShare
		case "fileShare":
			allowed = perms.FileShare
		case "meetingBoard":
			allowed = perms.MeetingBoard
		case "floorTemplates":
			allowed = perms.FloorTemplates
		case "adminFeatures":
			allowed = perms.AdminFeatures
		case "customBranding":
			allowed = perms.CustomBranding
		case "sso":
			allowed = perms.SSO
		case "apiAccess":
			allowed = perms.APIAccess
		}

		if !allowed {
			writeJSON(w, http.StatusForbidden, map[string]any{
				"error":           "upgrade_required",
				"requiredPlan":    "pro",
				"currentPlan":     plan,
				"feature":         feature,
				"message":         "この機能はProプラン以上で利用できます",
			})
			return
		}

		next.ServeHTTP(w, r)
	}
}
