package handler

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/ethereal-office/backend/db"
	"github.com/ethereal-office/backend/model"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
)

func getGoogleOAuthConfig(slug string) *oauth2.Config {
	baseURL := os.Getenv("APP_BASE_URL")
	if baseURL == "" {
		baseURL = "http://localhost:3000"
	}

	return &oauth2.Config{
		ClientID:     os.Getenv("GOOGLE_CLIENT_ID"),
		ClientSecret: os.Getenv("GOOGLE_CLIENT_SECRET"),
		RedirectURL:  fmt.Sprintf("%s/api/floors/%s/sso/callback", baseURL, slug),
		Scopes:       []string{"openid", "email", "profile"},
		Endpoint:     google.Endpoint,
	}
}

// GET /api/floors/{slug}/sso/config
func GetSSOConfig(w http.ResponseWriter, r *http.Request) {
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

	var config model.FloorSSOConfig
	if err := db.DB.Where("floor_id = ?", floor.ID).First(&config).Error; err != nil {
		writeJSON(w, http.StatusOK, map[string]any{
			"enabled":       false,
			"provider":      "google",
			"allowedDomain": "",
		})
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"enabled":       config.Enabled,
		"provider":      config.Provider,
		"allowedDomain": config.AllowedDomain,
	})
}

// PUT /api/floors/{slug}/sso/config
func UpdateSSOConfig(w http.ResponseWriter, r *http.Request) {
	slug := r.PathValue("slug")
	if slug == "" {
		writeError(w, http.StatusBadRequest, "slug is required")
		return
	}

	// Verify owner auth
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
		writeError(w, http.StatusForbidden, "not authorized")
		return
	}

	var body struct {
		Enabled       bool   `json:"enabled"`
		AllowedDomain string `json:"allowedDomain"`
	}
	if err := decodeJSON(r, &body); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	var config model.FloorSSOConfig
	if err := db.DB.Where("floor_id = ?", floor.ID).First(&config).Error; err != nil {
		// Create new config
		config = model.FloorSSOConfig{
			FloorID:       floor.ID,
			Enabled:       body.Enabled,
			Provider:      model.SSOProviderGoogle,
			AllowedDomain: body.AllowedDomain,
		}
		if err := db.DB.Create(&config).Error; err != nil {
			writeError(w, http.StatusInternalServerError, "failed to create SSO config")
			return
		}
	} else {
		// Update existing config
		config.Enabled = body.Enabled
		config.AllowedDomain = body.AllowedDomain
		if err := db.DB.Save(&config).Error; err != nil {
			writeError(w, http.StatusInternalServerError, "failed to update SSO config")
			return
		}
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"enabled":       config.Enabled,
		"provider":      config.Provider,
		"allowedDomain": config.AllowedDomain,
	})
}

// GET /api/floors/{slug}/sso/login
func SSOLogin(w http.ResponseWriter, r *http.Request) {
	slug := r.PathValue("slug")
	if slug == "" {
		writeError(w, http.StatusBadRequest, "slug is required")
		return
	}

	oauthConfig := getGoogleOAuthConfig(slug)
	if oauthConfig.ClientID == "" || oauthConfig.ClientSecret == "" {
		writeError(w, http.StatusInternalServerError, "Google OAuth is not configured")
		return
	}

	url := oauthConfig.AuthCodeURL(slug, oauth2.AccessTypeOffline)
	http.Redirect(w, r, url, http.StatusTemporaryRedirect)
}

// GET /api/floors/{slug}/sso/callback
func SSOCallback(w http.ResponseWriter, r *http.Request) {
	slug := r.PathValue("slug")
	if slug == "" {
		writeError(w, http.StatusBadRequest, "slug is required")
		return
	}

	// Verify state matches slug
	state := r.URL.Query().Get("state")
	if state != slug {
		writeError(w, http.StatusBadRequest, "invalid state parameter")
		return
	}

	code := r.URL.Query().Get("code")
	if code == "" {
		writeError(w, http.StatusBadRequest, "authorization code is required")
		return
	}

	oauthConfig := getGoogleOAuthConfig(slug)

	// Exchange authorization code for tokens
	token, err := oauthConfig.Exchange(r.Context(), code)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to exchange authorization code")
		return
	}

	// Fetch user info from Google
	client := oauthConfig.Client(r.Context(), token)
	resp, err := client.Get("https://www.googleapis.com/oauth2/v2/userinfo")
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to fetch user info")
		return
	}
	defer resp.Body.Close()

	var userInfo struct {
		Email string `json:"email"`
		Name  string `json:"name"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&userInfo); err != nil {
		writeError(w, http.StatusInternalServerError, "failed to parse user info")
		return
	}

	// Check floor exists
	var floor model.Floor
	if err := db.DB.Where("slug = ?", slug).First(&floor).Error; err != nil {
		writeError(w, http.StatusNotFound, "floor not found")
		return
	}

	// Check allowed domain if set
	var config model.FloorSSOConfig
	if err := db.DB.Where("floor_id = ?", floor.ID).First(&config).Error; err == nil {
		if config.AllowedDomain != "" {
			emailParts := strings.Split(userInfo.Email, "@")
			if len(emailParts) != 2 || emailParts[1] != config.AllowedDomain {
				baseURL := os.Getenv("APP_BASE_URL")
				if baseURL == "" {
					baseURL = "http://localhost:3000"
				}
				http.Redirect(w, r, fmt.Sprintf("%s/f/%s?sso_error=domain_not_allowed", baseURL, slug), http.StatusTemporaryRedirect)
				return
			}
		}
	}

	// Generate random session token (32 hex bytes)
	tokenBytes := make([]byte, 32)
	rand.Read(tokenBytes)
	sessionToken := hex.EncodeToString(tokenBytes)

	// Create SSO session
	session := model.FloorSSOSession{
		FloorID:   floor.ID,
		Email:     userInfo.Email,
		Name:      userInfo.Name,
		Token:     sessionToken,
		ExpiresAt: time.Now().Add(24 * time.Hour),
	}
	if err := db.DB.Create(&session).Error; err != nil {
		writeError(w, http.StatusInternalServerError, "failed to create SSO session")
		return
	}

	// Set cookie
	cookieName := fmt.Sprintf("sso_token_%s", slug)
	http.SetCookie(w, &http.Cookie{
		Name:     cookieName,
		Value:    sessionToken,
		Path:     "/",
		MaxAge:   24 * 3600,
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
	})

	// Redirect to floor
	baseURL := os.Getenv("APP_BASE_URL")
	if baseURL == "" {
		baseURL = "http://localhost:3000"
	}
	http.Redirect(w, r, fmt.Sprintf("%s/f/%s", baseURL, slug), http.StatusTemporaryRedirect)
}

// GET /api/floors/{slug}/sso/verify
func VerifySSOSession(w http.ResponseWriter, r *http.Request) {
	slug := r.PathValue("slug")
	if slug == "" {
		writeError(w, http.StatusBadRequest, "slug is required")
		return
	}

	cookieName := fmt.Sprintf("sso_token_%s", slug)
	cookie, err := r.Cookie(cookieName)
	if err != nil || cookie.Value == "" {
		writeJSON(w, http.StatusOK, map[string]any{
			"authenticated": false,
		})
		return
	}

	var session model.FloorSSOSession
	if err := db.DB.Where("token = ? AND expires_at > ?", cookie.Value, time.Now()).First(&session).Error; err != nil {
		writeJSON(w, http.StatusOK, map[string]any{
			"authenticated": false,
		})
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"authenticated": true,
		"email":         session.Email,
		"name":          session.Name,
	})
}
