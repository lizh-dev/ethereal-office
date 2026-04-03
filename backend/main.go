package main

import (
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/ethereal-office/backend/db"
	"github.com/ethereal-office/backend/handler"
	"github.com/ethereal-office/backend/ws"
)

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		if origin != "" {
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, X-Edit-Token, X-Owner-Password, X-Admin-Secret, Stripe-Signature, Authorization")
		}
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func main() {
	db.Init()

	hub := ws.NewHub()
	go hub.Run()

	mux := http.NewServeMux()

	// REST API — Floors
	mux.HandleFunc("POST /api/floors", handler.CreateFloor)
	mux.HandleFunc("GET /api/floors/{slug}", handler.GetFloor)
	mux.HandleFunc("PATCH /api/floors/{slug}", handler.UpdateFloor)
	mux.HandleFunc("POST /api/floors/{slug}/verify-owner", handler.VerifyOwner)
	mux.HandleFunc("POST /api/floors/{slug}/verify-password", handler.VerifyPassword)
	mux.HandleFunc("DELETE /api/floors/{slug}", handler.DeleteFloor)
	mux.HandleFunc("GET /api/floors/{slug}/subscription", handler.GetFloorSubscription)
	mux.HandleFunc("GET /api/floors/{slug}/permissions", handler.GetFloorPermissions)
	mux.HandleFunc("POST /api/floors/{slug}/files", handler.UploadFile)
	mux.HandleFunc("GET /api/floors/{slug}/files/{id}", handler.DownloadFile)

	// SSO
	mux.HandleFunc("GET /api/floors/{slug}/sso/config", handler.GetSSOConfig)
	mux.HandleFunc("PUT /api/floors/{slug}/sso/config", handler.RequirePlanFeature("sso", handler.UpdateSSOConfig))
	mux.HandleFunc("GET /api/floors/{slug}/sso/login", handler.SSOLogin)
	mux.HandleFunc("GET /api/floors/{slug}/sso/callback", handler.SSOCallback)
	mux.HandleFunc("GET /api/floors/{slug}/sso/verify", handler.VerifySSOSession)

	// Branding
	mux.HandleFunc("GET /api/floors/{slug}/branding", handler.GetFloorBranding)
	mux.HandleFunc("PUT /api/floors/{slug}/branding", handler.RequirePlanFeature("customBranding", handler.UpdateFloorBranding))
	mux.HandleFunc("POST /api/floors/{slug}/branding/logo", handler.RequirePlanFeature("customBranding", handler.UploadBrandingLogo))
	mux.HandleFunc("GET /api/floors/{slug}/branding/logo/{file}", handler.ServeBrandingLogo)

	// Auth
	mux.HandleFunc("POST /api/auth/register", handler.Register)
	mux.HandleFunc("POST /api/auth/login", handler.Login)
	mux.HandleFunc("GET /api/auth/me", handler.GetMe)
	mux.HandleFunc("POST /api/auth/logout", handler.Logout)

	// Members
	mux.HandleFunc("GET /api/floors/{slug}/members", handler.ListMembers)
	mux.HandleFunc("POST /api/floors/{slug}/members/invite", handler.InviteMember)
	mux.HandleFunc("DELETE /api/floors/{slug}/members/{memberId}", handler.RemoveMember)

	// Admin API
	mux.HandleFunc("POST /api/admin/login", handler.AdminLogin)
	mux.HandleFunc("GET /api/admin/dashboard", handler.AdminDashboard)
	mux.HandleFunc("GET /api/admin/floors", handler.AdminListFloors)
	mux.HandleFunc("DELETE /api/admin/floors/{slug}", handler.AdminDeleteFloor)
	mux.HandleFunc("GET /api/admin/subscriptions", handler.AdminListSubscriptions)
	mux.HandleFunc("GET /api/admin/transactions", handler.AdminListTransactions)

	// Payments (Stripe)
	mux.HandleFunc("POST /api/payments/checkout", handler.CreateCheckoutSession)
	mux.HandleFunc("POST /api/payments/verify", handler.VerifyCheckoutSession)
	mux.HandleFunc("POST /api/payments/webhook", handler.HandleStripeWebhook)
	mux.HandleFunc("POST /api/payments/portal", handler.CreatePortalSession)

	// API key management (owner auth + Pro plan)
	mux.HandleFunc("POST /api/floors/{slug}/api-keys", handler.RequirePlanFeature("apiAccess", handler.CreateAPIKey))
	mux.HandleFunc("GET /api/floors/{slug}/api-keys", handler.RequirePlanFeature("apiAccess", handler.ListAPIKeys))
	mux.HandleFunc("DELETE /api/floors/{slug}/api-keys/{keyId}", handler.RequirePlanFeature("apiAccess", handler.RevokeAPIKey))

	// Public API (API key auth)
	mux.HandleFunc("GET /api/v1/floors/{slug}", handler.RequireAPIKeyAuth(handler.PublicGetFloor))
	mux.HandleFunc("GET /api/v1/floors/{slug}/members", handler.RequireAPIKeyAuth(handler.PublicGetMembers(hub)))
	mux.HandleFunc("GET /api/v1/floors/{slug}/zones", handler.RequireAPIKeyAuth(handler.PublicGetZones))

	// Meeting rooms
	mux.HandleFunc("/api/floors/{slug}/meeting-rooms", handler.HandleMeetingRooms())
	mux.HandleFunc("/api/meeting-rooms/", handler.HandleMeetingRoomDelete())
	mux.HandleFunc("GET /api/meetings/{roomId}/check", handler.CheckMeetingRoom(hub))
	mux.HandleFunc("GET /api/floors/{slug}/meeting-logs", handler.HandleMeetingLogs())
	mux.HandleFunc("POST /api/meetings/leave", handler.HandleMeetingLeave(hub))
	mux.HandleFunc("POST /api/meetings/verify-password", handler.HandleVerifyMeetingPassword(hub))

	// WebSocket
	mux.HandleFunc("GET /ws", handler.HandleWebSocket(hub))

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	fmt.Printf("Server starting on :%s\n", port)
	log.Fatal(http.ListenAndServe(":"+port, corsMiddleware(mux)))
}
