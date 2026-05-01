# Workflow 2: Accept a Gig (Freelancer)

## Overview
A freelancer browses available gigs, optionally places a bid, and accepts a gig to start working.

## Prerequisites
- Different wallet than the client (Freelancer wallet)
- SOL for gas fees

## Steps

### Step 1: Browse Gigs
1. Navigate to /gigs
2. Use search bar to find gigs by title or address
3. Filter by:
   - **Status:** Open, Active, Completed, etc.
   - **Category:** Development, Design, Writing, etc.
4. Sort by: Newest, Budget High→Low, Deadline
5. Pagination: 10 gigs per page

### Step 2: Review Gig Detail
1. Click on a gig card
2. Review:
   - Description
   - Milestones and amounts
   - Total budget in escrow
   - Deadline (with urgency badges)
   - Category badge
   - Client profile (click for full profile)
   - PDA address (verify on Explorer)

### Step 3: Place a Bid (Optional)
1. In the "Bids" section, enter your proposed amount
2. Add a message explaining why you're the right fit
3. Click "Bid"
4. Wait for client to accept/reject

```
Example bid:
  Amount: 180 USDC (10% below 200 USDC budget)
  Message: "I've built 15+ landing pages. Can deliver in 7 days.
            Portfolio: mysite.com"
```

### Step 4: Accept the Gig
1. Click "Accept This Gig — 200.00 USDC Escrowed"
2. Approve transaction in Phantom
3. Status changes: Open → **Active**
4. You are now the assigned freelancer

## What Happens On-Chain
```
accept_gig instruction:
  - Sets gig.freelancer = caller's pubkey
  - Changes status: Open → Active
  - Emits GigAccepted event
```

## Notifications
- **Client receives:** "Gig Accepted! 🎉 — A freelancer accepted your gig"
- Activity logged to platform feed

## Test Cases

### Happy Path
1. Freelancer connects wallet
2. Browses to an Open, Funded gig
3. Clicks Accept → transaction succeeds
4. Status = Active, freelancer assigned

### Error Cases
- Client tries to accept own gig → **Error: cannot accept your own gig**
- Accept a non-funded gig → **Error: gig not funded**
- Accept an already-active gig → **Error: gig not open**
- Insufficient SOL for gas → **Wallet error: insufficient funds**

### Bid Workflow
1. Freelancer submits bid (180 USDC, with message)
2. Bid appears in Bids section
3. Client sees bid with accept/reject buttons
4. Client clicks Accept → bid status = accepted
5. Freelancer can now click Accept Gig button
