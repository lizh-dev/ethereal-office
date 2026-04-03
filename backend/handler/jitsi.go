package handler

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"
)

// POST /api/jitsi/token — generates a JWT for Jitsi Meet access
func CreateJitsiToken(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Room     string `json:"room"`
		UserName string `json:"userName"`
	}
	if err := decodeJSON(r, &body); err != nil || body.Room == "" || body.UserName == "" {
		writeError(w, http.StatusBadRequest, "room and userName are required")
		return
	}

	secret := os.Getenv("JWT_JITSI_SECRET")
	if secret == "" {
		secret = "ethereal-jitsi-secret-key-change-in-production"
	}

	token, err := generateJitsiJWT(secret, body.Room, body.UserName)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to generate token")
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{
		"token": token,
		"url":   fmt.Sprintf("https://localhost:8443/%s?jwt=%s", body.Room, token),
	})
}

func generateJitsiJWT(secret, room, userName string) (string, error) {
	header := map[string]string{"alg": "HS256", "typ": "JWT"}
	now := time.Now().Unix()
	payload := map[string]interface{}{
		"iss":  "ethereal_office",
		"aud":  "jitsi",
		"sub":  "meet.jitsi",
		"room": room,
		"exp":  now + 3600, // 1 hour
		"iat":  now,
		"context": map[string]interface{}{
			"user": map[string]string{
				"name": userName,
			},
		},
	}

	headerJSON, _ := json.Marshal(header)
	payloadJSON, _ := json.Marshal(payload)

	headerB64 := base64URLEncode(headerJSON)
	payloadB64 := base64URLEncode(payloadJSON)

	sigInput := headerB64 + "." + payloadB64
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write([]byte(sigInput))
	sig := base64URLEncode(mac.Sum(nil))

	return sigInput + "." + sig, nil
}

func base64URLEncode(data []byte) string {
	s := base64.StdEncoding.EncodeToString(data)
	s = strings.TrimRight(s, "=")
	s = strings.ReplaceAll(s, "+", "-")
	s = strings.ReplaceAll(s, "/", "_")
	return s
}
