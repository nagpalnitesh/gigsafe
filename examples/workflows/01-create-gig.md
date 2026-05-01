# Workflow 1: Create a Gig

## Overview
A client creates a gig with milestones, funds the escrow, and makes it available for freelancers.

## Prerequisites
- Phantom/Solflare wallet on Devnet
- SOL for gas fees (~0.01 SOL)
- Test USDC (use the faucet at /faucet)

## Steps

### Step 1: Connect Wallet
1. Navigate to gigsafe.wildsnap.in
2. Click "Select Wallet" → Choose Phantom
3. Ensure you're on Devnet (Settings → Developer Settings → Testnet Mode)

### Step 2: Get Test USDC
1. Go to /faucet
2. Click "Mint 1000 USDC"
3. Approve the transaction in Phantom
4. Wait for confirmation

### Step 3: Choose a Template (Optional)
1. Go to /create
2. Browse 8 pre-built templates:
   - Landing Page Design & Dev (400 USDC, 14 days)
   - Smart Contract Audit (1000 USDC, 21 days)
   - Logo & Branding (300 USDC, 10 days)
   - etc.
3. Click a template to auto-fill the form

### Step 4: Fill the Form (or customize template)
```
Title: "Build a Landing Page for SaaS Startup"
Description: "Modern responsive landing page with hero, pricing, testimonials..."
Category: 💻 Development
Milestones:
  1. Design Mockups — 50 USDC
  2. Frontend Development — 100 USDC
  3. Deploy & QA — 50 USDC
Deadline: 2 weeks from now
```

### Step 5: AI Suggest (Optional)
1. Type a title
2. Click the purple "✨ AI Suggest" button
3. AI auto-fills description, milestones, category, and deadline
4. Review and adjust as needed

### Step 6: Review Risk Assessment
- AI Risk Indicator appears below the form
- Shows score (0-100), risk level, factors, and suggestions
- Example: "Medium Risk — Single milestone, all-or-nothing"

### Step 7: Create & Fund
1. Click "Create Gig & Lock 200.00 USDC"
2. **Transaction 1:** Create gig on-chain (approve in Phantom)
3. **Transaction 2:** Fund escrow with USDC (approve in Phantom)
4. Wait for both confirmations
5. Redirected to gig detail page

## What Happens On-Chain
```
create_gig instruction:
  - Creates GigAccount PDA: seeds = ["gig", client_pubkey, gig_id]
  - Creates Escrow Token Account PDA: seeds = ["escrow", gig_pda]
  - Stores: title, milestones, deadline, status=Open

fund_gig instruction:
  - Transfers USDC from client ATA → escrow PDA
  - Updates funded_amount on GigAccount
  - Emits GigFunded event
```

## Off-Chain Data Stored
```json
{
  "gigPda": "...",
  "description": "Modern responsive landing page...",
  "milestoneNames": ["Design Mockups", "Frontend Development", "Deploy & QA"],
  "category": "development",
  "createdBy": "client-wallet-address"
}
```

## Verification
- Gig visible on /gigs (Browse Gigs)
- Status: "Open" with "Funded ✓" badge
- PDA visible on Solana Explorer
- Notification sent to client: "Gig Created"
- Activity logged to platform feed

## Test Case
```bash
# Verify via API
curl -s https://gigsafe.wildsnap.in/api/metadata?gigPda=<GIG_PDA>
# Should return description, milestone names, category
```
