# GigSafe — Product Requirements Document

**Version:** 1.0 | **Date:** April 6, 2026 | **Author:** Nitesh Nagpal

---

## 1. Overview

GigSafe is a trustless freelance escrow platform on Solana with milestone payments, AI-powered dispute resolution, and an embeddable SDK for third-party platforms. 0.5% fee vs the industry standard 10-20%.

## 2. User Personas

### Client (Rahul)
- 35, startup founder in Bangalore
- Hires freelancers for design, development, content
- Pain: paid $2,000 upfront, freelancer ghosted, Upwork dispute took 3 weeks
- Want: funds locked until work is delivered, instant release on approval

### Freelancer (Maria)
- 28, UI designer in Buenos Aires
- Works on Upwork and Fiverr
- Pain: Upwork takes 20% on first $500, payout takes 14 days, disputes are opaque
- Want: get paid instantly, keep 99.5%, fair dispute resolution

### Platform Builder (Dev)
- 30, building a DAO contributor platform
- Needs payment infrastructure for task completion
- Pain: building escrow from scratch is complex
- Want: `npm install @gigsafe/sdk`, embed widget, done

## 3. Requirements

### 3.1 Core Protocol (P0)

**create_gig** — Client creates a gig
- Title, description, milestones (name + amount), total budget, deadline, token (USDC/SOL)
- Generates shareable link
- Stores on-chain as GigAccount PDA

**fund_gig** — Client deposits into escrow
- Transfers tokens from client wallet to escrow PDA
- Can fund after creation (split from create for flexibility)

**accept_gig** — Freelancer accepts
- Freelancer signs to accept
- Stores freelancer pubkey on gig account
- Status: Open → Active

**submit_milestone** — Freelancer submits work
- Marks milestone as submitted
- Optional: stores evidence hash (IPFS link)

**approve_milestone** — Client approves
- Releases milestone amount from escrow to freelancer
- Milestone status: Submitted → Approved
- If all milestones approved → Gig Complete

**request_dispute** — Either party disputes
- Gig status: Active → Disputed
- Both parties can submit evidence

**resolve_dispute** — Resolution
- AI analyzes evidence, suggests split
- Both parties accept → funds distribute
- Gig status: Disputed → Resolved

**cancel_gig** — Client cancels
- Only before freelancer accepts
- Full refund from escrow to client

### 3.2 Frontend (P0)

**Create Gig page** — Form with title, description, milestones, budget, token
**Browse Gigs page** — List of open gigs
**Gig Detail page** — Status, milestones, actions, evidence, chat
**Client Dashboard** — My posted gigs, spending, active escrows
**Freelancer Dashboard** — My gigs, earnings, history, withdraw
**Dispute page** — Submit evidence, view AI verdict, accept/reject

### 3.3 AI Dispute Resolution (P0)

- Groq API (Llama 3.1 70B, free)
- Prompt: analyze both sides' evidence against original requirements
- Output: suggested split (e.g., 70/30) with reasoning
- Both parties can accept → auto-execute

### 3.4 SDK / Embeddable Widget (P1)

- `npm install @gigsafe/sdk`
- `<GigSafeButton>` React component
- Webhook on events: gig created, milestone approved, disputed, resolved

### 3.5 Invoicing (P1)

- Generate invoice from gig details
- Shareable link with QR code
- PDF export

## 4. User Flows

### Client Flow
```
1. Connect wallet
2. Click "Post a Gig"
3. Fill form: title, description, milestones, budget, token
4. Click "Create" → sign tx → GigAccount created on-chain
5. Click "Fund Escrow" → sign tx → tokens locked in PDA
6. Share link with freelancer
7. Freelancer submits milestone → notification
8. Review deliverable → click "Approve" → funds release
9. Repeat for each milestone → done
```

### Freelancer Flow
```
1. Receive gig link from client
2. Connect wallet → view gig details
3. Click "Accept Gig" → sign tx
4. Work on milestone → submit deliverable
5. Client approves → funds hit wallet instantly
6. Dashboard shows earnings history
```

### Dispute Flow
```
1. Either party clicks "Raise Dispute"
2. Both submit evidence (text, links, screenshots)
3. AI analyzes → suggests split
4. Both accept → funds distribute
5. If rejected → escalate (future: community arbitration)
```

## 5. Gig Account Structure

```rust
pub struct GigAccount {
    pub client: Pubkey,
    pub freelancer: Option<Pubkey>,
    pub title: String,
    pub total_budget: u64,
    pub token_mint: Pubkey,
    pub status: GigStatus,       // Open, Active, Completed, Disputed, Resolved, Cancelled
    pub milestones: Vec<Milestone>,
    pub deadline: i64,
    pub created_at: i64,
    pub escrow_bump: u8,
    pub bump: u8,
}

pub struct Milestone {
    pub name: String,
    pub amount: u64,
    pub status: MilestoneStatus, // Pending, Submitted, Approved, Disputed
    pub evidence_hash: Option<String>,
}
```

## 6. Out of Scope (Hackathon)

- Mainnet deployment
- Real identity/KYC
- Community arbitration (AI only)
- Mobile native app
- IPFS content storage
- Chat between client/freelancer
- Reputation/ratings system
