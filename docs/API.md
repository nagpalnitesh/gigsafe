# GigSafe API Documentation

Base URL: `https://gigsafe.wildsnap.in`

All responses are JSON. Write endpoints accept JSON body with `Content-Type: application/json`.

---

## Authentication (Optional)

Write endpoints support wallet signature authentication via headers:

| Header | Description |
|--------|-------------|
| `x-wallet` | Solana wallet address (base58) |
| `x-message` | Signed message: `GigSafe:api:<timestamp>` |
| `x-signature` | Base58-encoded Ed25519 signature |

Signatures must be within 5 minutes. Auth is currently optional but will be required for write operations in production.

---

## Metadata

### GET /api/metadata

Get gig metadata (description, milestone names, category).

**Query params:**
- `gigPda` (optional) — specific gig PDA. If omitted, returns all metadata.

**Response (single gig):**
```json
{
  "description": "Build a modern landing page...",
  "milestoneNames": ["Design", "Development", "Launch"],
  "category": "development",
  "createdBy": "A1b2...x9Y0",
  "updatedAt": 1700000000000
}
```

### POST /api/metadata

Save gig metadata.

**Body:**
```json
{
  "gigPda": "...",
  "description": "...",
  "milestoneNames": ["Design", "Dev"],
  "category": "design",
  "createdBy": "wallet-address"
}
```

---

## Profiles

### GET /api/profile

Get user profile.

**Query params:**
- `wallet` (required) — Solana wallet address

**Response:**
```json
{
  "wallet": "A1b2...x9Y0",
  "displayName": "Alice",
  "bio": "Solana developer",
  "skills": ["Rust", "React", "TypeScript"],
  "twitter": "@alice",
  "github": "alice",
  "website": "https://alice.dev",
  "updatedAt": 1700000000000
}
```

### POST /api/profile

Save/update user profile.

**Body:**
```json
{
  "wallet": "A1b2...x9Y0",
  "displayName": "Alice",
  "bio": "Solana developer",
  "skills": ["Rust", "React"],
  "twitter": "@alice",
  "github": "alice",
  "website": "https://alice.dev"
}
```

**Validation:**
- `displayName`: max 50 chars
- `bio`: max 280 chars
- `skills`: max 10 items

---

## Reviews

### GET /api/reviews

Get reputation or check review status.

**Query params:**
- `wallet` (required) — wallet being reviewed
- `gigPda` + `reviewer` (optional) — check if specific review exists

**Response (reputation):**
```json
{
  "reviews": [
    {
      "gigPda": "...",
      "gigTitle": "Landing Page",
      "reviewer": "client-wallet",
      "reviewerRole": "client",
      "rating": 5,
      "comment": "Great work!",
      "timestamp": 1700000000000
    }
  ],
  "averageRating": 4.5,
  "totalGigs": 3
}
```

**Response (has reviewed):**
```json
{ "hasReviewed": true }
```

### POST /api/reviews

Submit a review.

**Body:**
```json
{
  "walletAddress": "freelancer-wallet",
  "review": {
    "gigPda": "...",
    "gigTitle": "Landing Page",
    "reviewer": "client-wallet",
    "reviewerRole": "client",
    "rating": 5,
    "comment": "Excellent work, delivered on time!"
  }
}
```

**Validation:** Rating must be 1-5. Duplicate reviews (same gig + reviewer) are updated.

---

## Notifications

### GET /api/notifications

Get notifications or unread count.

**Query params:**
- `wallet` (required)
- `unread=true` (optional) — return only unread count

**Response (list):**
```json
[
  {
    "id": "1700000000000-abc123",
    "wallet": "...",
    "type": "milestone_approved",
    "title": "Milestone Approved! 💰",
    "message": "Design Mockups approved on \"Landing Page\". 50.00 USDC sent.",
    "gigPda": "...",
    "gigTitle": "Landing Page",
    "read": false,
    "createdAt": 1700000000000
  }
]
```

**Response (unread count):**
```json
{ "unread": 3 }
```

**Notification types:**
`gig_created`, `gig_accepted`, `milestone_submitted`, `milestone_approved`, `dispute_raised`, `dispute_resolved`, `gig_cancelled`, `review_received`

### POST /api/notifications

Create notification or mark read.

**Create:**
```json
{
  "wallet": "...",
  "type": "gig_accepted",
  "title": "Gig Accepted!",
  "message": "A freelancer accepted your gig.",
  "gigPda": "...",
  "gigTitle": "Landing Page"
}
```

**Mark read:**
```json
{
  "action": "mark_read",
  "wallet": "...",
  "ids": ["id1", "id2"]  // optional — omit to mark all read
}
```

---

## Messages

### GET /api/messages

Get chat messages for a gig.

**Query params:**
- `gigPda` (required)

**Response:**
```json
[
  {
    "id": "1700000000000-abc123",
    "gigPda": "...",
    "sender": "client-wallet",
    "message": "Hey, how is the progress?",
    "timestamp": 1700000000000
  }
]
```

### POST /api/messages

Send a message. Rate limited: 30/min per IP.

**Body:**
```json
{
  "gigPda": "...",
  "sender": "wallet-address",
  "message": "Almost done! Submitting today."
}
```

**Validation:** Max 1000 chars. Empty/whitespace-only rejected.

---

## Risk Assessment

### POST /api/risk

AI-powered risk assessment for gig creation.

**Body:**
```json
{
  "budget": "500",
  "milestones": "3",
  "deadline": "2026-06-01"
}
```

**Response:**
```json
{
  "score": 80,
  "level": "low",
  "factors": [],
  "suggestions": []
}
```

**Risk levels:** `low` (70-100), `medium` (40-69), `high` (0-39)

---

## Dispute Resolution

### POST /api/dispute/resolve

AI-powered dispute analysis. Rate limited: 5/min per IP.

**Body:**
```json
{
  "gigTitle": "Landing Page",
  "milestones": [
    { "index": 0, "amount": 100, "status": "Approved" },
    { "index": 1, "amount": 200, "status": "Submitted" }
  ],
  "totalBudget": 500,
  "remainingAmount": 400,
  "clientEvidence": "Work was incomplete...",
  "freelancerEvidence": "I delivered everything..."
}
```

**Response:**
```json
{
  "freelancer_bps": 7000,
  "client_bps": 3000,
  "reasoning": "Based on evidence, freelancer completed ~70% of work...",
  "confidence": "high",
  "model": "llama-3.3-70b-versatile"
}
```

`freelancer_bps` is basis points (7000 = 70%).

---

## Files

### GET /api/files

Get uploaded deliverables for a gig.

**Query params:**
- `gigPda` (required)

**Response:**
```json
[
  {
    "filename": "ms0_1700000000.png",
    "originalName": "mockup.png",
    "size": 245000,
    "type": "image/png",
    "url": "/api/upload/gigPda/ms0_1700000000.png",
    "milestoneIndex": 0,
    "uploadedAt": 1700000000000
  }
]
```

### POST /api/upload

Upload a deliverable file. Multipart form data.

**Form fields:**
- `file` — the file (max 10MB)
- `gigPda` — gig PDA address
- `milestoneIndex` — milestone number

**Accepted types:** PNG, JPEG, GIF, WebP, PDF, ZIP, TXT, MD, JSON

---

## Rate Limits

| Endpoint | Limit |
|----------|-------|
| General API reads | 60 req/min per IP |
| Write operations | 20 req/min per IP |
| AI endpoints (dispute, risk) | 5 req/min per IP |
| Messages | 30 req/min per IP |

Rate limited responses return `429` with `Retry-After` header.

---

## Categories

Available gig categories:

| ID | Label | Icon |
|----|-------|------|
| `development` | Development | 💻 |
| `design` | Design | 🎨 |
| `writing` | Writing | ✍️ |
| `marketing` | Marketing | 📢 |
| `video` | Video & Animation | 🎬 |
| `audio` | Audio & Music | 🎵 |
| `consulting` | Consulting | 💼 |
| `data` | Data & AI | 📊 |
| `security` | Security | 🔒 |
| `translation` | Translation | 🌍 |
| `other` | Other | 📦 |

---

## Bids

### GET /api/bids

Get bids for a gig or by a bidder.

**Query params:**
- `gigPda` — get bids for a specific gig
- `bidder` — get bids by a specific wallet

**Response:**
```json
[
  {
    "id": 1,
    "gigPda": "...",
    "bidder": "freelancer-wallet",
    "amount": 180.00,
    "message": "I can deliver in 10 days with my 5 years of experience.",
    "status": "pending",
    "createdAt": 1700000000000
  }
]
```

**Bid statuses:** `pending`, `accepted`, `rejected`, `withdrawn`

### POST /api/bids

Submit a bid or update bid status. Rate limited: 20/min per IP.

**Submit bid:**
```json
{
  "gigPda": "...",
  "bidder": "freelancer-wallet",
  "amount": "180",
  "message": "Why you should pick me..."
}
```

**Update bid status (client only):**
```json
{
  "action": "update_status",
  "gigPda": "...",
  "bidder": "freelancer-wallet",
  "status": "accepted"
}
```

**Validation:** Amount must be > 0. Message max 500 chars. One bid per freelancer per gig (updates on resubmit).

---

## Invoice

### GET /api/invoice

Generate invoice data for a completed gig.

**Query params:**
- `gigPda` (required)
- `title` — gig title
- `client` — client wallet
- `freelancer` — freelancer wallet
- `budget` — total budget (USDC)
- `released` — released amount (USDC)
- `status` — gig status
- `createdAt` — unix timestamp

**Response:**
```json
{
  "invoiceNumber": "GS-ABCD1234",
  "date": "2026-04-14T...",
  "gigTitle": "Landing Page",
  "client": { "wallet": "...", "name": "Alice" },
  "freelancer": { "wallet": "...", "name": "Bob" },
  "milestones": [...],
  "financial": {
    "totalBudget": 500,
    "releasedAmount": 500,
    "platformFee": 2.50,
    "freelancerReceived": 497.50,
    "currency": "USDC"
  },
  "verification": {
    "programId": "...",
    "explorerUrl": "https://explorer.solana.com/..."
  }
}
```
