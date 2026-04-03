package handler

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"net/http"
	"os"
	"time"

	"github.com/ethereal-office/backend/db"
	"github.com/ethereal-office/backend/model"
	"golang.org/x/crypto/bcrypt"
)

// POST /api/auth/register
func Register(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Email       string `json:"email"`
		Password    string `json:"password"`
		DisplayName string `json:"displayName"`
	}
	if err := decodeJSON(r, &body); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request")
		return
	}
	if body.Email == "" || body.Password == "" {
		writeError(w, http.StatusBadRequest, "email and password are required")
		return
	}
	if len(body.Password) < 6 {
		writeError(w, http.StatusBadRequest, "password must be at least 6 characters")
		return
	}

	// Check existing
	var existing model.Account
	if err := db.DB.Where("email = ?", body.Email).First(&existing).Error; err == nil {
		writeError(w, http.StatusConflict, "このメールアドレスは既に登録されています")
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(body.Password), bcrypt.DefaultCost)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "registration failed")
		return
	}

	account := model.Account{
		Email:        body.Email,
		PasswordHash: string(hash),
		DisplayName:  body.DisplayName,
	}
	if err := db.DB.Create(&account).Error; err != nil {
		writeError(w, http.StatusInternalServerError, "registration failed")
		return
	}

	token := generateJWT(account.ID.String(), account.Email)
	setAuthCookie(w, token)

	writeJSON(w, http.StatusCreated, map[string]any{
		"account": account,
		"token":   token,
	})
}

// POST /api/auth/login
func Login(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := decodeJSON(r, &body); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request")
		return
	}

	var account model.Account
	if err := db.DB.Where("email = ?", body.Email).First(&account).Error; err != nil {
		writeError(w, http.StatusUnauthorized, "メールアドレスまたはパスワードが正しくありません")
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(account.PasswordHash), []byte(body.Password)); err != nil {
		writeError(w, http.StatusUnauthorized, "メールアドレスまたはパスワードが正しくありません")
		return
	}

	token := generateJWT(account.ID.String(), account.Email)
	setAuthCookie(w, token)

	writeJSON(w, http.StatusOK, map[string]any{
		"account": account,
		"token":   token,
	})
}

// GET /api/auth/me
func GetMe(w http.ResponseWriter, r *http.Request) {
	accountID := getAccountIDFromRequest(r)
	if accountID == "" {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	var account model.Account
	if err := db.DB.Where("id = ?", accountID).First(&account).Error; err != nil {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	writeJSON(w, http.StatusOK, account)
}

// POST /api/auth/logout
func Logout(w http.ResponseWriter, r *http.Request) {
	http.SetCookie(w, &http.Cookie{
		Name:     "auth_token",
		Value:    "",
		Path:     "/",
		MaxAge:   -1,
		HttpOnly: true,
	})
	writeJSON(w, http.StatusOK, map[string]bool{"ok": true})
}

// Simple HMAC-based token (not full JWT for simplicity)
func generateJWT(accountID, email string) string {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = "dev-jwt-secret"
	}
	expiry := time.Now().Add(7 * 24 * time.Hour).Unix()
	payload := accountID + "|" + email + "|" + time.Unix(expiry, 0).Format(time.RFC3339)

	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write([]byte(payload))
	sig := hex.EncodeToString(mac.Sum(nil))

	return payload + "|" + sig
}

func setAuthCookie(w http.ResponseWriter, token string) {
	http.SetCookie(w, &http.Cookie{
		Name:     "auth_token",
		Value:    token,
		Path:     "/",
		MaxAge:   7 * 24 * 3600,
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
	})
}

func getAccountIDFromRequest(r *http.Request) string {
	// Check cookie
	cookie, err := r.Cookie("auth_token")
	if err != nil {
		// Check Authorization header
		token := r.Header.Get("Authorization")
		if token == "" {
			return ""
		}
		return validateToken(token)
	}
	return validateToken(cookie.Value)
}

func validateToken(token string) string {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = "dev-jwt-secret"
	}

	// Split: accountID|email|expiry|sig
	parts := splitToken(token)
	if len(parts) != 4 {
		return ""
	}

	payload := parts[0] + "|" + parts[1] + "|" + parts[2]
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write([]byte(payload))
	expectedSig := hex.EncodeToString(mac.Sum(nil))

	if !hmac.Equal([]byte(parts[3]), []byte(expectedSig)) {
		return ""
	}

	// Check expiry
	expiry, err := time.Parse(time.RFC3339, parts[2])
	if err != nil || time.Now().After(expiry) {
		return ""
	}

	return parts[0] // accountID
}

func splitToken(token string) []string {
	result := []string{}
	start := 0
	count := 0
	for i, ch := range token {
		if ch == '|' {
			result = append(result, token[start:i])
			start = i + 1
			count++
			if count == 3 {
				result = append(result, token[start:])
				return result
			}
		}
	}
	if start < len(token) {
		result = append(result, token[start:])
	}
	return result
}
