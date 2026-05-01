# Workflow 7: Profiles & Reputation

## Overview
Users build on-platform identity with profiles, skills, and reputation from completed gigs.

## User Profile

### Create/Edit Profile
1. Navigate to /profile
2. Fill in:
   - **Display Name** (max 50 chars) — e.g., "Alice Chen"
   - **Bio** (max 280 chars) — e.g., "Solana developer. 5 years React."
   - **Skills** (up to 10) — e.g., "Rust", "React", "TypeScript"
   - **Twitter** — e.g., "@alice"
   - **GitHub** — e.g., "alicechen"
   - **Website** — e.g., "https://alice.dev"
3. Click "Save Profile"
4. Profile persists in SQLite database

### View Public Profile
- Every wallet has a public page at `/u/<wallet-address>`
- Shows: name, bio, skills, social links, review history
- Deterministic avatar color generated from wallet address
- UserBadge component shows name throughout the app

### UserBadge Everywhere
- Gig detail page: client and freelancer shown with name + avatar
- Browse gigs: creator shown with name
- Chat messages: sender shown with name
- Bids: bidder shown with name + avatar

## Reputation System

### How Reviews Work
1. Gig must be Completed or Resolved
2. Both parties can review each other
3. Rate 1-5 stars + optional comment (max 200 chars)
4. One review per gig per reviewer (updates on resubmit)

### Review Flow
1. Gig completes → "Reviews & Reputation" section appears
2. Client rates freelancer: ⭐⭐⭐⭐⭐ "Excellent work!"
3. Freelancer rates client: ⭐⭐⭐⭐ "Clear requirements, fast approvals"
4. Both get notified: "New Review ⭐"

### Reputation Display
- Star rating + count shown next to wallet addresses
- Example: ⭐ 4.8 (12 reviews)
- Visible on: gig detail, public profile, browse gigs

### ReputationBadge Component
```tsx
<ReputationBadge wallet="wallet-address" />
// Renders: ⭐ 4.5 (3)
```

## API Examples

### Save profile
```bash
curl -X POST https://gigsafe.wildsnap.in/api/profile \
  -H "Content-Type: application/json" \
  -d '{
    "wallet": "ABC123...",
    "displayName": "Alice Chen",
    "bio": "Solana developer",
    "skills": ["Rust", "React", "TypeScript"],
    "twitter": "@alice"
  }'
```

### Get reputation
```bash
curl "https://gigsafe.wildsnap.in/api/reviews?wallet=ABC123..."
# Returns: { reviews: [...], averageRating: 4.5, totalGigs: 3 }
```

### Submit review
```bash
curl -X POST https://gigsafe.wildsnap.in/api/reviews \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "freelancer-wallet",
    "review": {
      "gigPda": "...",
      "gigTitle": "Landing Page",
      "reviewer": "client-wallet",
      "reviewerRole": "client",
      "rating": 5,
      "comment": "Delivered ahead of schedule!"
    }
  }'
```

## Test Cases

### Profile
1. Create profile → verify saved
2. Update profile → fields updated
3. View /u/<wallet> → shows profile
4. Empty profile → shows wallet address only
5. Name too long (>50 chars) → rejected

### Reviews
1. Submit 5-star review → reputation = 5.0
2. Submit second review from another gig → avg updates
3. Duplicate review (same gig+reviewer) → updates existing
4. Rating out of range (0, 6, 10) → rejected
5. Check hasReviewed → true/false correctly
