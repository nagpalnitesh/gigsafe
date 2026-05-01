# Workflow 6: Freelancer Bidding

## Overview
Freelancers can bid on open gigs with their proposed price and a pitch message. Clients review and accept/reject bids.

## Steps

### Freelancer: Submit a Bid
1. Navigate to an Open, Funded gig
2. Scroll to "Bids" section
3. Enter proposed amount (e.g., 180 USDC for a 200 USDC gig)
4. Write a pitch: "Why you should pick me"
5. Click "Bid"
6. Bid appears as "pending"

### Client: Review Bids
1. Open gig detail page
2. See all bids with:
   - Bidder profile (name, avatar)
   - Proposed amount
   - Delta from budget (e.g., "10% below budget")
   - Pitch message
   - Status badge
3. Click ✓ to accept or ✗ to reject

### Client: Accept a Bid
1. Click the green checkmark on a bid
2. Bid status → "accepted"
3. Freelancer sees: "Your bid was accepted! Accept the gig above to start working."
4. Freelancer clicks "Accept This Gig" button

### Freelancer: Withdraw a Bid
1. If bid is still pending, freelancer can resubmit with different amount
2. Previous bid is overwritten (UPSERT)

## API Examples

### Submit a bid
```bash
curl -X POST https://gigsafe.wildsnap.in/api/bids \
  -H "Content-Type: application/json" \
  -d '{
    "gigPda": "ABC123...",
    "bidder": "freelancer-wallet",
    "amount": "180",
    "message": "5 years React experience. Can deliver in 7 days."
  }'
```

### Get bids for a gig
```bash
curl "https://gigsafe.wildsnap.in/api/bids?gigPda=ABC123..."
```

### Accept a bid
```bash
curl -X POST https://gigsafe.wildsnap.in/api/bids \
  -H "Content-Type: application/json" \
  -d '{
    "action": "update_status",
    "gigPda": "ABC123...",
    "bidder": "freelancer-wallet",
    "status": "accepted"
  }'
```

## Database Schema
```sql
CREATE TABLE bids (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  gig_pda TEXT NOT NULL,
  bidder TEXT NOT NULL,
  amount REAL NOT NULL,
  message TEXT,
  status TEXT DEFAULT 'pending',  -- pending, accepted, rejected, withdrawn
  created_at INTEGER,
  UNIQUE(gig_pda, bidder)  -- one bid per freelancer per gig
);
```

## Test Cases

### Happy Path
1. Freelancer A bids 180 USDC with message
2. Freelancer B bids 170 USDC with message
3. Client reviews both
4. Client accepts Freelancer B's bid
5. Freelancer B accepts gig on-chain

### Bid Updates
1. Freelancer bids 200 USDC
2. Freelancer rebids at 180 USDC → old bid replaced

### Validation
- Amount must be > 0
- Message max 500 characters
- One bid per freelancer per gig (upsert)
- Rate limited: 20 writes/min per IP
