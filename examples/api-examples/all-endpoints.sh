#!/bin/bash
# GigSafe API Examples — Every endpoint with sample requests
# Usage: bash examples/api-examples/all-endpoints.sh

BASE="${BASE_URL:-http://127.0.0.1:3001}"
echo "🔌 GigSafe API Examples"
echo "Base: $BASE"
echo "========================"

section() { echo -e "\n\033[1;36m=== $1 ===\033[0m"; }
endpoint() { echo -e "\n\033[1;33m$1\033[0m"; }

# ── METADATA ──────────────────────────────────────────
section "Metadata API"

endpoint "POST /api/metadata — Save gig metadata"
curl -s -X POST "$BASE/api/metadata" \
  -H "Content-Type: application/json" \
  -d '{
    "gigPda": "example-gig-123",
    "description": "Build a modern landing page with animations",
    "milestoneNames": ["Design", "Development", "Launch"],
    "category": "development",
    "createdBy": "wallet123"
  }' | python3 -m json.tool

endpoint "GET /api/metadata?gigPda=example-gig-123 — Get single gig"
curl -s "$BASE/api/metadata?gigPda=example-gig-123" | python3 -m json.tool

endpoint "GET /api/metadata — Get all metadata"
curl -s "$BASE/api/metadata" | python3 -m json.tool

# ── PROFILES ──────────────────────────────────────────
section "Profile API"

endpoint "POST /api/profile — Create profile"
curl -s -X POST "$BASE/api/profile" \
  -H "Content-Type: application/json" \
  -d '{
    "wallet": "example-wallet-456",
    "displayName": "Demo User",
    "bio": "Full-stack developer specializing in Solana",
    "skills": ["Rust", "React", "TypeScript"],
    "twitter": "@demouser",
    "github": "demouser"
  }' | python3 -m json.tool

endpoint "GET /api/profile?wallet=example-wallet-456 — Get profile"
curl -s "$BASE/api/profile?wallet=example-wallet-456" | python3 -m json.tool

# ── REVIEWS ───────────────────────────────────────────
section "Reviews API"

endpoint "POST /api/reviews — Submit review"
curl -s -X POST "$BASE/api/reviews" \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "example-wallet-456",
    "review": {
      "gigPda": "example-gig-123",
      "gigTitle": "Landing Page",
      "reviewer": "reviewer-wallet",
      "reviewerRole": "client",
      "rating": 5,
      "comment": "Outstanding work! Delivered early with great quality."
    }
  }' | python3 -m json.tool

endpoint "GET /api/reviews?wallet=example-wallet-456 — Get reputation"
curl -s "$BASE/api/reviews?wallet=example-wallet-456" | python3 -m json.tool

endpoint "GET /api/reviews?wallet=...&gigPda=...&reviewer=... — Check if reviewed"
curl -s "$BASE/api/reviews?wallet=example-wallet-456&gigPda=example-gig-123&reviewer=reviewer-wallet" | python3 -m json.tool

# ── NOTIFICATIONS ─────────────────────────────────────
section "Notifications API"

endpoint "POST /api/notifications — Create notification"
curl -s -X POST "$BASE/api/notifications" \
  -H "Content-Type: application/json" \
  -d '{
    "wallet": "example-wallet-456",
    "type": "milestone_approved",
    "title": "Milestone Approved! 💰",
    "message": "Design Mockups approved. 50.00 USDC sent to your wallet.",
    "gigPda": "example-gig-123",
    "gigTitle": "Landing Page"
  }' | python3 -m json.tool

endpoint "GET /api/notifications?wallet=...&unread=true — Unread count"
curl -s "$BASE/api/notifications?wallet=example-wallet-456&unread=true" | python3 -m json.tool

endpoint "GET /api/notifications?wallet=... — All notifications"
curl -s "$BASE/api/notifications?wallet=example-wallet-456" | python3 -m json.tool

endpoint "POST /api/notifications — Mark all read"
curl -s -X POST "$BASE/api/notifications" \
  -H "Content-Type: application/json" \
  -d '{"action": "mark_read", "wallet": "example-wallet-456"}' | python3 -m json.tool

# ── MESSAGES ──────────────────────────────────────────
section "Messages API"

endpoint "POST /api/messages — Send message"
curl -s -X POST "$BASE/api/messages" \
  -H "Content-Type: application/json" \
  -d '{
    "gigPda": "example-gig-123",
    "sender": "example-wallet-456",
    "message": "Hey, milestone 1 is ready for review!"
  }' | python3 -m json.tool

endpoint "GET /api/messages?gigPda=... — Get messages"
curl -s "$BASE/api/messages?gigPda=example-gig-123" | python3 -m json.tool

# ── BIDS ──────────────────────────────────────────────
section "Bids API"

endpoint "POST /api/bids — Submit bid"
curl -s -X POST "$BASE/api/bids" \
  -H "Content-Type: application/json" \
  -d '{
    "gigPda": "example-gig-123",
    "bidder": "bidder-wallet-789",
    "amount": "180",
    "message": "5 years React experience. Can deliver in 10 days."
  }' | python3 -m json.tool

endpoint "GET /api/bids?gigPda=... — Get bids for gig"
curl -s "$BASE/api/bids?gigPda=example-gig-123" | python3 -m json.tool

endpoint "POST /api/bids — Accept bid"
curl -s -X POST "$BASE/api/bids" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "update_status",
    "gigPda": "example-gig-123",
    "bidder": "bidder-wallet-789",
    "status": "accepted"
  }' | python3 -m json.tool

# ── RISK ASSESSMENT ───────────────────────────────────
section "Risk Assessment API"

endpoint "POST /api/risk — Low risk gig"
curl -s -X POST "$BASE/api/risk" \
  -H "Content-Type: application/json" \
  -d '{"budget": "500", "milestones": "3", "deadline": "2026-06-01"}' | python3 -m json.tool

endpoint "POST /api/risk — High risk gig (single milestone, tight deadline)"
curl -s -X POST "$BASE/api/risk" \
  -H "Content-Type: application/json" \
  -d '{"budget": "5000", "milestones": "1", "deadline": "2026-04-16"}' | python3 -m json.tool

# ── AI SUGGEST ────────────────────────────────────────
section "AI Suggest API"

endpoint "POST /api/suggest — Generate milestone structure"
curl -s -X POST "$BASE/api/suggest" \
  -H "Content-Type: application/json" \
  -d '{"title": "Build a React Native food delivery app"}' | python3 -m json.tool

# ── INVOICE ───────────────────────────────────────────
section "Invoice API"

endpoint "GET /api/invoice — Generate receipt"
curl -s "$BASE/api/invoice?gigPda=example-gig-123&title=Landing+Page&client=wallet1&freelancer=wallet2&budget=200&released=200&status=Completed&createdAt=1700000000" | python3 -m json.tool

# ── ACTIVITY FEED ─────────────────────────────────────
section "Activity Feed API"

endpoint "POST /api/activity — Log activity"
curl -s -X POST "$BASE/api/activity" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "gig_created",
    "title": "New Gig Posted",
    "description": "Landing Page for SaaS Startup",
    "gigPda": "example-gig-123",
    "gigTitle": "Landing Page",
    "actor": "example-wallet-456",
    "amount": 200
  }' | python3 -m json.tool

endpoint "GET /api/activity — Get feed"
curl -s "$BASE/api/activity?limit=10" | python3 -m json.tool

# ── FILES ─────────────────────────────────────────────
section "Files API"

endpoint "GET /api/files?gigPda=... — Get uploaded files"
curl -s "$BASE/api/files?gigPda=example-gig-123" | python3 -m json.tool

echo -e "\n\033[1;32m✅ All API examples completed\033[0m"
