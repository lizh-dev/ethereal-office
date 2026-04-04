package handler

import (
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/ethereal-office/backend/db"
	"github.com/ethereal-office/backend/model"
	"github.com/stripe/stripe-go/v82"
	billingportalsession "github.com/stripe/stripe-go/v82/billingportal/session"
	checkoutsession "github.com/stripe/stripe-go/v82/checkout/session"
	"github.com/stripe/stripe-go/v82/webhook"
)

func initStripe() {
	stripe.Key = os.Getenv("STRIPE_SECRET_KEY")
}

// GET /api/floors/{slug}/subscription
func GetFloorSubscription(w http.ResponseWriter, r *http.Request) {
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

	// First try active/trialing, then fall back to most recent subscription
	var sub model.Subscription
	if err := db.DB.Where("floor_id = ? AND status IN ?", floor.ID, []string{"active", "trialing"}).First(&sub).Error; err != nil {
		// Try to find any recent subscription (canceled, past_due, etc.)
		if err2 := db.DB.Where("floor_id = ?", floor.ID).Order("updated_at DESC").First(&sub).Error; err2 != nil {
			writeJSON(w, http.StatusOK, map[string]any{
				"plan":   "free",
				"status": "none",
			})
			return
		}
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"plan":               sub.Plan,
		"status":             sub.Status,
		"currentPeriodEnd":   sub.CurrentPeriodEnd,
		"currentPeriodStart": sub.CurrentPeriodStart,
		"cancelAtPeriodEnd":  sub.CancelAtPeriodEnd,
		"email":              sub.Email,
	})
}

// POST /api/payments/checkout
func CreateCheckoutSession(w http.ResponseWriter, r *http.Request) {
	initStripe()

	var body struct {
		FloorSlug  string `json:"floorSlug"`
		Email      string `json:"email"`
		Plan       string `json:"plan"`
		SuccessURL string `json:"successUrl"`
		CancelURL  string `json:"cancelUrl"`
	}
	if err := decodeJSON(r, &body); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if body.FloorSlug == "" || body.Email == "" || body.SuccessURL == "" || body.CancelURL == "" {
		writeError(w, http.StatusBadRequest, "floorSlug, email, successUrl, cancelUrl are required")
		return
	}

	// Verify floor exists
	var floor model.Floor
	if err := db.DB.Where("slug = ?", body.FloorSlug).First(&floor).Error; err != nil {
		writeError(w, http.StatusNotFound, "floor not found")
		return
	}

	// Check if already subscribed
	var existingSub model.Subscription
	if err := db.DB.Where("floor_id = ? AND status = ?", floor.ID, "active").First(&existingSub).Error; err == nil {
		writeError(w, http.StatusConflict, "floor already has an active subscription")
		return
	}

	// Resolve price ID
	priceID := os.Getenv("STRIPE_PRO_PRICE_ID")
	if priceID == "" {
		writeError(w, http.StatusInternalServerError, "price not configured")
		return
	}

	params := &stripe.CheckoutSessionParams{
		Mode: stripe.String(string(stripe.CheckoutSessionModeSubscription)),
		LineItems: []*stripe.CheckoutSessionLineItemParams{
			{
				Price:    stripe.String(priceID),
				Quantity: stripe.Int64(1),
			},
		},
		CustomerEmail: stripe.String(body.Email),
		SuccessURL:    stripe.String(body.SuccessURL + "?session_id={CHECKOUT_SESSION_ID}"),
		CancelURL:     stripe.String(body.CancelURL),
		Metadata: map[string]string{
			"floor_slug": body.FloorSlug,
			"floor_id":   floor.ID.String(),
			"plan":       body.Plan,
		},
	}

	sess, err := checkoutsession.New(params)
	if err != nil {
		log.Printf("Stripe checkout error: %v", err)
		writeError(w, http.StatusInternalServerError, "failed to create checkout session")
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{
		"sessionId":  sess.ID,
		"sessionUrl": sess.URL,
	})
}

// POST /api/payments/verify — called from frontend after successful checkout redirect
func VerifyCheckoutSession(w http.ResponseWriter, r *http.Request) {
	initStripe()

	var body struct {
		SessionID string `json:"sessionId"`
	}
	if err := decodeJSON(r, &body); err != nil || body.SessionID == "" {
		writeError(w, http.StatusBadRequest, "sessionId is required")
		return
	}

	sess, err := checkoutsession.Get(body.SessionID, &stripe.CheckoutSessionParams{
		Params: stripe.Params{
			Expand: []*string{stripe.String("subscription")},
		},
	})
	if err != nil {
		log.Printf("Failed to get checkout session: %v", err)
		writeError(w, http.StatusBadRequest, "invalid session")
		return
	}

	if sess.PaymentStatus != stripe.CheckoutSessionPaymentStatusPaid {
		writeError(w, http.StatusBadRequest, "payment not completed")
		return
	}

	floorSlug, ok := sess.Metadata["floor_slug"]
	if !ok {
		writeError(w, http.StatusBadRequest, "missing floor info")
		return
	}

	var floor model.Floor
	if err := db.DB.Where("slug = ?", floorSlug).First(&floor).Error; err != nil {
		writeError(w, http.StatusNotFound, "floor not found")
		return
	}

	// Check if subscription already exists (idempotent)
	var existingSub model.Subscription
	if err := db.DB.Where("floor_id = ? AND status = ?", floor.ID, "active").First(&existingSub).Error; err == nil {
		writeJSON(w, http.StatusOK, map[string]any{
			"status": "already_active",
			"plan":   existingSub.Plan,
		})
		return
	}

	plan := model.PlanPro

	customerID := ""
	if sess.Customer != nil {
		customerID = sess.Customer.ID
	}
	subscriptionID := ""
	if sess.Subscription != nil {
		subscriptionID = sess.Subscription.ID
	}

	sub := model.Subscription{
		FloorID:              floor.ID,
		Email:                sess.CustomerEmail,
		Plan:                 plan,
		Status:               model.SubStatusActive,
		StripeCustomerID:     customerID,
		StripeSubscriptionID: subscriptionID,
		CurrentPeriodStart:   time.Now(),
		CurrentPeriodEnd:     time.Now().AddDate(0, 1, 0),
	}

	if err := db.DB.Create(&sub).Error; err != nil {
		log.Printf("Failed to create subscription: %v", err)
		writeError(w, http.StatusInternalServerError, "failed to activate subscription")
		return
	}

	// Record transaction
	tx := model.Transaction{
		FloorID:        &floor.ID,
		SubscriptionID: &sub.ID,
		Email:          sess.CustomerEmail,
		Amount:         int(sess.AmountTotal),
		Currency:       string(sess.Currency),
		Type:           model.TxTypeSubscription,
		Status:         model.TxStatusSucceeded,
		Description:    fmt.Sprintf("Pro plan subscription for floor %s", floor.Name),
	}
	db.DB.Create(&tx)

	log.Printf("Subscription activated for floor %s (plan=%s, email=%s)", floor.Slug, sub.Plan, sub.Email)

	writeJSON(w, http.StatusOK, map[string]any{
		"status": "activated",
		"plan":   sub.Plan,
	})
}

// POST /api/payments/webhook
func HandleStripeWebhook(w http.ResponseWriter, r *http.Request) {
	initStripe()

	body, err := io.ReadAll(io.LimitReader(r.Body, 65536))
	if err != nil {
		writeError(w, http.StatusBadRequest, "failed to read body")
		return
	}

	whSecret := os.Getenv("STRIPE_WEBHOOK_SECRET")
	event, err := webhook.ConstructEventWithOptions(body, r.Header.Get("Stripe-Signature"), whSecret, webhook.ConstructEventOptions{
		IgnoreAPIVersionMismatch: true,
	})
	if err != nil {
		log.Printf("Webhook signature verification failed: %v", err)
		writeError(w, http.StatusBadRequest, "invalid signature")
		return
	}

	switch event.Type {
	case "checkout.session.completed":
		handleCheckoutCompleted(event)
	case "customer.subscription.updated":
		handleSubscriptionUpdated(event)
	case "customer.subscription.deleted":
		handleSubscriptionDeleted(event)
	case "invoice.paid":
		handleInvoicePaid(event)
	}

	w.WriteHeader(http.StatusOK)
}

func getStr(obj map[string]interface{}, key string) string {
	if v, ok := obj[key]; ok && v != nil {
		if s, ok := v.(string); ok {
			return s
		}
	}
	return ""
}

func getMetadata(obj map[string]interface{}) map[string]string {
	m := map[string]string{}
	if md, ok := obj["metadata"].(map[string]interface{}); ok {
		for k, v := range md {
			if s, ok := v.(string); ok {
				m[k] = s
			}
		}
	}
	return m
}

func handleCheckoutCompleted(event stripe.Event) {
	obj := event.Data.Object
	metadata := getMetadata(obj)

	floorSlug := metadata["floor_slug"]
	if floorSlug == "" {
		log.Printf("No floor_slug in checkout metadata")
		return
	}

	plan := model.PlanPro

	var floor model.Floor
	if err := db.DB.Where("slug = ?", floorSlug).First(&floor).Error; err != nil {
		log.Printf("Floor not found for slug %s: %v", floorSlug, err)
		return
	}

	customerEmail := getStr(obj, "customer_email")
	customerID := getStr(obj, "customer")
	subscriptionID := getStr(obj, "subscription")
	amountTotal := 0
	if v, ok := obj["amount_total"].(float64); ok {
		amountTotal = int(v)
	}
	currency := getStr(obj, "currency")

	sub := model.Subscription{
		FloorID:              floor.ID,
		Email:                customerEmail,
		Plan:                 plan,
		Status:               model.SubStatusActive,
		StripeCustomerID:     customerID,
		StripeSubscriptionID: subscriptionID,
		CurrentPeriodStart:   time.Now(),
		CurrentPeriodEnd:     time.Now().AddDate(0, 1, 0),
	}

	if err := db.DB.Create(&sub).Error; err != nil {
		log.Printf("Failed to create subscription: %v", err)
		return
	}

	tx := model.Transaction{
		FloorID:        &floor.ID,
		SubscriptionID: &sub.ID,
		Email:          customerEmail,
		Amount:         amountTotal,
		Currency:       currency,
		Type:           model.TxTypeSubscription,
		Status:         model.TxStatusSucceeded,
		Description:    fmt.Sprintf("Pro plan subscription for floor %s", floor.Name),
	}
	db.DB.Create(&tx)

	log.Printf("Subscription created for floor %s (%s)", floor.Slug, sub.Plan)
}

func handleSubscriptionUpdated(event stripe.Event) {
	subID, _ := event.Data.Object["id"].(string)
	status, _ := event.Data.Object["status"].(string)

	var sub model.Subscription
	if err := db.DB.Where("stripe_subscription_id = ?", subID).First(&sub).Error; err != nil {
		return
	}

	updates := map[string]any{"status": status}
	if periodEnd, ok := event.Data.Object["current_period_end"].(float64); ok {
		updates["current_period_end"] = time.Unix(int64(periodEnd), 0)
	}
	if periodStart, ok := event.Data.Object["current_period_start"].(float64); ok {
		updates["current_period_start"] = time.Unix(int64(periodStart), 0)
	}
	if cancelAtEnd, ok := event.Data.Object["cancel_at_period_end"].(bool); ok {
		updates["cancel_at_period_end"] = cancelAtEnd
	}

	db.DB.Model(&sub).Updates(updates)
}

func handleSubscriptionDeleted(event stripe.Event) {
	subID, _ := event.Data.Object["id"].(string)

	now := time.Now()
	db.DB.Model(&model.Subscription{}).
		Where("stripe_subscription_id = ?", subID).
		Updates(map[string]any{
			"status":      "canceled",
			"canceled_at": &now,
		})
}

func handleInvoicePaid(event stripe.Event) {
	invoiceID, _ := event.Data.Object["id"].(string)
	subID, _ := event.Data.Object["subscription"].(string)
	amountPaid, _ := event.Data.Object["amount_paid"].(float64)
	currency, _ := event.Data.Object["currency"].(string)
	email, _ := event.Data.Object["customer_email"].(string)

	var sub model.Subscription
	if err := db.DB.Where("stripe_subscription_id = ?", subID).First(&sub).Error; err != nil {
		return
	}

	tx := model.Transaction{
		FloorID:         &sub.FloorID,
		SubscriptionID:  &sub.ID,
		Email:           email,
		Amount:          int(amountPaid),
		Currency:        currency,
		Type:            model.TxTypeSubscription,
		Status:          model.TxStatusSucceeded,
		StripeInvoiceID: invoiceID,
		Description:     "Subscription renewal",
	}
	db.DB.Create(&tx)
}

// POST /api/payments/portal
func CreatePortalSession(w http.ResponseWriter, r *http.Request) {
	initStripe()

	var body struct {
		FloorSlug string `json:"floorSlug"`
		ReturnURL string `json:"returnUrl"`
	}
	if err := decodeJSON(r, &body); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	var floor model.Floor
	if err := db.DB.Where("slug = ?", body.FloorSlug).First(&floor).Error; err != nil {
		writeError(w, http.StatusNotFound, "floor not found")
		return
	}

	var sub model.Subscription
	if err := db.DB.Where("floor_id = ? AND status = ?", floor.ID, "active").First(&sub).Error; err != nil {
		writeError(w, http.StatusNotFound, "no active subscription")
		return
	}

	params := &stripe.BillingPortalSessionParams{
		Customer:  stripe.String(sub.StripeCustomerID),
		ReturnURL: stripe.String(body.ReturnURL),
	}

	sess, err := billingportalsession.New(params)
	if err != nil {
		log.Printf("Portal session error: %v", err)
		writeError(w, http.StatusInternalServerError, "failed to create portal session")
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{
		"url": sess.URL,
	})
}
