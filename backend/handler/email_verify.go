package handler

import (
	"bytes"
	"crypto/rand"
	"encoding/json"
	"fmt"
	"math/big"
	"net/http"
	"os"
	"sync"
	"time"
)

type verifyEntry struct {
	Code      string
	ExpiresAt time.Time
}

var (
	verifyStore = map[string]verifyEntry{}
	verifyMu    sync.Mutex
)

func generateCode() string {
	code := ""
	for i := 0; i < 6; i++ {
		n, _ := rand.Int(rand.Reader, big.NewInt(10))
		code += fmt.Sprintf("%d", n.Int64())
	}
	return code
}

// POST /api/email/send-code
func SendVerifyCode(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Email string `json:"email"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.Email == "" {
		writeError(w, http.StatusBadRequest, "email is required")
		return
	}

	code := generateCode()

	verifyMu.Lock()
	verifyStore[body.Email] = verifyEntry{
		Code:      code,
		ExpiresAt: time.Now().Add(10 * time.Minute),
	}
	verifyMu.Unlock()

	// Send via Resend or SMTP based on env
	provider := os.Getenv("EMAIL_PROVIDER")
	if provider == "" {
		provider = "resend"
	}

	var sendErr error
	switch provider {
	case "smtp":
		sendErr = sendViaSMTP(body.Email, code)
	default:
		sendErr = sendViaResend(body.Email, code)
	}

	if sendErr != nil {
		fmt.Printf("Email send error: %v\n", sendErr)
		writeError(w, http.StatusInternalServerError, "メールの送信に失敗しました")
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"status": "sent"})
}

// POST /api/email/verify-code
func VerifyCode(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Email string `json:"email"`
		Code  string `json:"code"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.Email == "" || body.Code == "" {
		writeError(w, http.StatusBadRequest, "email and code are required")
		return
	}

	verifyMu.Lock()
	entry, ok := verifyStore[body.Email]
	if ok && entry.Code == body.Code && time.Now().Before(entry.ExpiresAt) {
		delete(verifyStore, body.Email)
		verifyMu.Unlock()
		writeJSON(w, http.StatusOK, map[string]bool{"verified": true})
		return
	}
	verifyMu.Unlock()

	writeJSON(w, http.StatusOK, map[string]bool{"verified": false})
}

func sendViaResend(to, code string) error {
	apiKey := os.Getenv("RESEND_API_KEY")
	if apiKey == "" {
		// Dev mode: print to console
		fmt.Printf("[DEV] Verification code for %s: %s\n", to, code)
		return nil
	}

	payload := map[string]any{
		"from":    os.Getenv("RESEND_FROM_EMAIL"),
		"to":      []string{to},
		"subject": "Ethereal Office — 認証コード",
		"html":    fmt.Sprintf(`<div style="font-family:sans-serif;max-width:400px;margin:0 auto;padding:32px"><h2 style="color:#0ea5e9">Ethereal Office</h2><p>フロア作成の認証コードです:</p><div style="font-size:32px;font-weight:bold;letter-spacing:8px;text-align:center;padding:16px;background:#f0f9ff;border-radius:8px;color:#0369a1">%s</div><p style="color:#6b7280;font-size:14px;margin-top:16px">このコードは10分間有効です。</p></div>`, code),
	}
	body, _ := json.Marshal(payload)

	req, _ := http.NewRequest("POST", "https://api.resend.com/emails", bytes.NewReader(body))
	req.Header.Set("Authorization", "Bearer "+apiKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		return fmt.Errorf("resend API returned %d", resp.StatusCode)
	}
	return nil
}

func sendViaSMTP(to, code string) error {
	// Future: net/smtp implementation for self-hosted VPS
	// For now, fall back to console logging
	fmt.Printf("[SMTP-STUB] Verification code for %s: %s\n", to, code)
	return nil
}
