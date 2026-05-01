#!/bin/bash
# GigSafe API Integration Tests
# Tests all server-side APIs

BASE="http://127.0.0.1:3001"
PASS=0
FAIL=0
TOTAL=0

test_api() {
  TOTAL=$((TOTAL + 1))
  local name="$1"
  local method="$2"
  local endpoint="$3"
  local data="$4"
  local expected="$5"

  if [ "$method" = "GET" ]; then
    response=$(curl -s "$BASE$endpoint")
  else
    response=$(curl -s -X "$method" "$BASE$endpoint" -H "Content-Type: application/json" -d "$data")
  fi

  if echo "$response" | grep -qF "$expected"; then
    echo "✅ $name"
    PASS=$((PASS + 1))
  else
    echo "❌ $name"
    echo "   Expected: $expected"
    echo "   Got: $response"
    FAIL=$((FAIL + 1))
  fi
}

echo "🧪 GigSafe API Tests"
echo "===================="
echo ""

# ── Metadata API ──────────────────────────────────────
echo "📦 Metadata API"

test_api "GET empty metadata" \
  "GET" "/api/metadata?gigPda=nonexistent" "" \
  "{}"

test_api "POST save metadata" \
  "POST" "/api/metadata" \
  '{"gigPda":"test-gig-1","description":"Test gig description","milestoneNames":["Design","Dev","Launch"],"createdBy":"wallet123"}' \
  "success"

test_api "GET saved metadata" \
  "GET" "/api/metadata?gigPda=test-gig-1" "" \
  "Test gig description"

test_api "GET metadata has milestones" \
  "GET" "/api/metadata?gigPda=test-gig-1" "" \
  "Design"

echo ""

# ── Profile API ───────────────────────────────────────
echo "👤 Profile API"

test_api "GET empty profile" \
  "GET" "/api/profile?wallet=newuser" "" \
  "wallet"

test_api "POST save profile" \
  "POST" "/api/profile" \
  '{"wallet":"testuser1","displayName":"Alice","bio":"Solana dev","skills":["Rust","React"],"twitter":"@alice"}' \
  "success"

test_api "GET saved profile name" \
  "GET" "/api/profile?wallet=testuser1" "" \
  "Alice"

test_api "GET saved profile skills" \
  "GET" "/api/profile?wallet=testuser1" "" \
  "Rust"

test_api "POST reject long name" \
  "POST" "/api/profile" \
  '{"wallet":"x","displayName":"AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"}' \
  "too long"

echo ""

# ── Reviews API ───────────────────────────────────────
echo "⭐ Reviews API"

test_api "GET empty reputation" \
  "GET" "/api/reviews?wallet=nobody" "" \
  "averageRating"

test_api "POST submit review" \
  "POST" "/api/reviews" \
  '{"walletAddress":"freelancer1","review":{"gigPda":"gig1","gigTitle":"Landing Page","reviewer":"client1","reviewerRole":"client","rating":5,"comment":"Great work!","timestamp":1700000000}}' \
  "success"

test_api "GET reputation after review" \
  "GET" "/api/reviews?wallet=freelancer1" "" \
  "averageRating"

test_api "GET has reviewed check" \
  "GET" "/api/reviews?wallet=freelancer1&gigPda=gig1&reviewer=client1" "" \
  "true"

test_api "GET has NOT reviewed check" \
  "GET" "/api/reviews?wallet=freelancer1&gigPda=gig1&reviewer=someone_else" "" \
  "false"

test_api "POST reject invalid rating" \
  "POST" "/api/reviews" \
  '{"walletAddress":"x","review":{"gigPda":"g","gigTitle":"t","reviewer":"r","reviewerRole":"client","rating":10,"comment":"","timestamp":1}}' \
  "Rating must be 1-5"

echo ""

# ── Notifications API ─────────────────────────────────
echo "🔔 Notifications API"

test_api "POST create notification" \
  "POST" "/api/notifications" \
  '{"wallet":"user1","type":"gig_accepted","title":"Gig Accepted","message":"A freelancer accepted your gig.","gigPda":"gig-abc"}' \
  "success"

test_api "GET notifications" \
  "GET" "/api/notifications?wallet=user1" "" \
  "Gig Accepted"

test_api "GET unread count" \
  "GET" "/api/notifications?wallet=user1&unread=true" "" \
  "unread"

test_api "POST mark read" \
  "POST" "/api/notifications" \
  '{"action":"mark_read","wallet":"user1"}' \
  "success"

test_api "GET unread count after mark read" \
  "GET" "/api/notifications?wallet=user1&unread=true" "" \
  '"unread":0'

echo ""

# ── Messages API ──────────────────────────────────────
echo "💬 Messages API"

test_api "GET empty messages" \
  "GET" "/api/messages?gigPda=empty-gig" "" \
  "[]"

test_api "POST send message" \
  "POST" "/api/messages" \
  '{"gigPda":"chat-gig-1","sender":"client-wallet","message":"Hey, how is the progress?"}' \
  "client-wallet"

test_api "POST send reply" \
  "POST" "/api/messages" \
  '{"gigPda":"chat-gig-1","sender":"freelancer-wallet","message":"Almost done! Submitting today."}' \
  "freelancer-wallet"

test_api "GET messages ordered" \
  "GET" "/api/messages?gigPda=chat-gig-1" "" \
  "how is the progress"

test_api "POST reject empty message" \
  "POST" "/api/messages" \
  '{"gigPda":"x","sender":"y","message":"   "}' \
  "required"

test_api "POST reject long message" \
  "POST" "/api/messages" \
  "{\"gigPda\":\"x\",\"sender\":\"y\",\"message\":\"$(python3 -c "print('A'*1001)")\"}" \
  "too long"

echo ""

# ── Risk API ──────────────────────────────────────────
echo "🧠 Risk Assessment API"

test_api "POST low risk gig" \
  "POST" "/api/risk" \
  '{"budget":"500","milestones":"3","deadline":"2026-06-01"}' \
  '"level":"low"'

test_api "POST medium risk (single milestone)" \
  "POST" "/api/risk" \
  '{"budget":"200","milestones":"1","deadline":"2026-05-01"}' \
  "Single milestone"

test_api "POST high risk (single + tight deadline)" \
  "POST" "/api/risk" \
  '{"budget":"10000","milestones":"1","deadline":"2026-04-15"}' \
  "Single milestone"

test_api "POST reject missing fields" \
  "POST" "/api/risk" \
  '{"budget":"100"}' \
  "required"

echo ""

# ── Bids API ──────────────────────────────────────────
echo "💰 Bids API"

test_api "POST submit bid" \
  "POST" "/api/bids" \
  '{"gigPda":"bid-gig","bidder":"freelancer-a","amount":"250","message":"I have 5 years experience"}' \
  "success"

test_api "GET bids for gig" \
  "GET" "/api/bids?gigPda=bid-gig" "" \
  "freelancer-a"

test_api "POST accept bid" \
  "POST" "/api/bids" \
  '{"action":"update_status","gigPda":"bid-gig","bidder":"freelancer-a","status":"accepted"}' \
  "success"

test_api "POST reject missing amount" \
  "POST" "/api/bids" \
  '{"gigPda":"x","bidder":"y"}' \
  "required"

echo ""

# ── Files API ─────────────────────────────────────────
echo "📁 Files API"

test_api "GET empty files" \
  "GET" "/api/files?gigPda=no-files-gig" "" \
  "[]"

echo ""

# ── Summary ───────────────────────────────────────────
echo "===================="
echo "Results: $PASS passed, $FAIL failed, $TOTAL total"
echo ""

if [ $FAIL -eq 0 ]; then
  echo "🎉 All tests passed!"
  exit 0
else
  echo "⚠️  Some tests failed"
  exit 1
fi
