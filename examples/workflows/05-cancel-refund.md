# Workflow 5: Cancel Gig & Refund

## Overview
Client cancels a gig before a freelancer accepts. Full refund from escrow.

## Prerequisites
- Gig must be Open (not Active)
- Gig must be funded
- Caller must be the client

## Steps

### Step 1: Navigate to Gig
1. Go to gig detail page
2. Verify status is "Open" and "Funded ✓"

### Step 2: Cancel
1. Click "Cancel Gig & Refund" (red button at bottom)
2. Approve transaction in Phantom
3. Full USDC amount returns to client wallet
4. Gig status → **Cancelled**
5. Notification: "Gig Cancelled — Funds refunded"

## What Happens On-Chain
```
cancel_gig instruction:
  - Caller must be gig.client
  - Gig must be Open (no freelancer assigned)
  - Transfers ALL tokens from escrow → client ATA
  - Closes escrow token account (rent returned)
  - Status: Open → Cancelled
  - Emits GigCancelled event
```

## Test Cases

### Happy Path
1. Client creates and funds gig (200 USDC)
2. No freelancer accepts
3. Client cancels → 200 USDC returned
4. Status = Cancelled

### Error Cases
- Cancel Active gig (freelancer already accepted) → **Error: cannot cancel active gig**
- Non-client tries to cancel → **Error: unauthorized**
- Cancel already-cancelled gig → **Error: gig not open**
- Cancel unfunded gig → **Error: not funded**
