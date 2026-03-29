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
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
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

	// REST API
	mux.HandleFunc("POST /api/floors", handler.CreateFloor)
	mux.HandleFunc("GET /api/floors/{slug}", handler.GetFloor)
	mux.HandleFunc("PATCH /api/floors/{slug}", handler.UpdateFloor)
	mux.HandleFunc("DELETE /api/floors/{slug}", handler.DeleteFloor)

	// WebSocket
	mux.HandleFunc("GET /ws", handler.HandleWebSocket(hub))

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	fmt.Printf("Server starting on :%s\n", port)
	log.Fatal(http.ListenAndServe(":"+port, corsMiddleware(mux)))
}
