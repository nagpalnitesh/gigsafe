# GigSafe — Technical Requirements Document

**Version:** 1.0 | **Date:** April 6, 2026

---

## 1. System Architecture

```
┌──────────────────────────────────────────────────────────┐
│                      GigSafe App                          │
│                Next.js · React · TailwindCSS              │
│            Wallet Adapter · Framer Motion                 │
├──────────────────────────────────────────────────────────┤
│                    @gigsafe/sdk                           │
│    createGig · fundGig · acceptGig · submitMilestone      │
│    approveMilestone · requestDispute · resolveDispute      │
├──────────────────────────────────────────────────────────┤
│                  Solana Program                           │
│              Anchor (Rust) Smart Contract                 │
│        GigAccount PDA · Escrow PDA · Milestones           │
├──────────────────────────────────────────────────────────┤
│                      Solana                               │
│          Devnet → Mainnet · USDC · SOL                    │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│                   AI Dispute Service                      │
│              Groq API · Llama 3.1 70B                     │
│         Evidence analysis · Fair split suggestion          │
└──────────────────────────────────────────────────────────┘
```

## 2. On-Chain Account Structures

### GigAccount (PDA)
```rust
#[account]
pub struct GigAccount {
    pub client: Pubkey,                // 32
    pub freelancer: Pubkey,            // 32 (Pubkey::default if not accepted)
    pub token_mint: Pubkey,            // 32
    pub total_budget: u64,             // 8
    pub funded_amount: u64,            // 8
    pub released_amount: u64,          // 8
    pub status: u8,                    // 1 (0=Open,1=Active,2=Completed,3=Disputed,4=Resolved,5=Cancelled)
    pub milestone_count: u8,           // 1
    pub deadline: i64,                 // 8
    pub created_at: i64,               // 8
    pub gig_id: u64,                   // 8
    pub escrow_bump: u8,               // 1
    pub bump: u8,                      // 1
}
// PDA seeds: ["gig", client, gig_id]
```

### MilestoneAccount (PDA)
```rust
#[account]
pub struct MilestoneAccount {
    pub gig: Pubkey,                   // 32 — parent gig
    pub index: u8,                     // 1
    pub amount: u64,                   // 8
    pub status: u8,                    // 1 (0=Pending,1=Submitted,2=Approved,3=Disputed)
    pub bump: u8,                      // 1
}
// PDA seeds: ["milestone", gig_pda, index]
```

### Escrow (Token Account PDA)
```rust
// Standard SPL Token Account
// Authority: GigAccount PDA
// PDA seeds: ["escrow", gig_pda]
```

## 3. Instructions

### create_gig
- **Params:** gig_id, total_budget, milestone_count, milestone_amounts[], deadline
- **Creates:** GigAccount PDA + MilestoneAccount PDAs
- **Validation:** budget > 0, milestones sum = budget, deadline in future

### fund_gig
- **Params:** (none, derives from gig)
- **Action:** Transfer tokens from client ATA → escrow PDA
- **Validation:** caller = client, gig status = Open, amount = total_budget

### accept_gig
- **Params:** (none)
- **Action:** Set freelancer = signer, status = Active
- **Validation:** gig status = Open, freelancer slot empty

### submit_milestone
- **Params:** milestone_index
- **Action:** Set milestone status = Submitted
- **Validation:** caller = freelancer, gig = Active, milestone = Pending

### approve_milestone
- **Params:** milestone_index
- **Action:** Release milestone amount from escrow → freelancer ATA
- **Validation:** caller = client, milestone = Submitted
- **Side effect:** If all milestones approved → gig status = Completed

### request_dispute
- **Params:** milestone_index (optional, can dispute whole gig)
- **Action:** Set gig status = Disputed
- **Validation:** caller = client OR freelancer, gig = Active

### resolve_dispute
- **Params:** freelancer_share (basis points), client_share (basis points)
- **Action:** Split remaining escrow according to shares
- **Validation:** caller = designated resolver (initially: client authority, future: DAO)
- **Note:** AI suggests the split off-chain, on-chain just executes it

### cancel_gig
- **Params:** (none)
- **Action:** Refund all escrow → client, close accounts
- **Validation:** caller = client, gig = Open (freelancer hasn't accepted)

## 4. Events

```rust
#[event] pub struct GigCreated { gig_id, client, total_budget, milestone_count, deadline }
#[event] pub struct GigFunded { gig_id, amount, token_mint }
#[event] pub struct GigAccepted { gig_id, freelancer }
#[event] pub struct MilestoneSubmitted { gig_id, milestone_index }
#[event] pub struct MilestoneApproved { gig_id, milestone_index, amount }
#[event] pub struct DisputeRaised { gig_id, raised_by }
#[event] pub struct DisputeResolved { gig_id, freelancer_amount, client_refund }
#[event] pub struct GigCancelled { gig_id, refund_amount }
```

## 5. Error Codes

```rust
#[error_code]
pub enum GigSafeError {
    InvalidBudget,
    MilestoneAmountMismatch,
    DeadlineInPast,
    GigNotOpen,
    GigNotActive,
    GigNotDisputed,
    AlreadyFunded,
    AlreadyAccepted,
    MilestoneNotPending,
    MilestoneNotSubmitted,
    Unauthorized,
    InvalidMilestoneIndex,
    MathOverflow,
    InvalidDisputeShares,
}
```

## 6. AI Dispute Resolution

### Flow
```
1. Dispute raised on-chain → gig status = Disputed
2. Frontend: both parties submit evidence via API
3. Backend: sends to Groq (Llama 3.1 70B) with structured prompt
4. AI returns: { freelancerShare: 7000, clientShare: 3000, reasoning: "..." }
5. Frontend: shows verdict to both parties
6. If both accept → on-chain resolve_dispute with AI's suggested split
7. If rejected → manual resolution (future: community vote)
```

### Prompt Structure
```
You are a fair and impartial dispute resolver for a freelance gig.

GIG DETAILS:
- Title: {title}
- Budget: {budget} USDC
- Milestones: {milestones}
- Deadline: {deadline}

CLIENT'S EVIDENCE:
{client_evidence}

FREELANCER'S EVIDENCE:
{freelancer_evidence}

Based on the evidence, determine a fair split of the escrowed funds.
Output JSON: { "freelancerShare": <0-10000>, "clientShare": <0-10000>, "reasoning": "<explanation>" }
Shares are in basis points (10000 = 100%).
```

## 7. Frontend Pages

| Page | Route | Description |
|---|---|---|
| Landing | `/` | Marketing page (done) |
| Create Gig | `/create` | Form to post a new gig |
| Browse | `/gigs` | List of open gigs |
| Gig Detail | `/gig/[id]` | Full gig view with actions |
| Client Dashboard | `/dashboard/client` | Posted gigs, spending |
| Freelancer Dashboard | `/dashboard/freelancer` | My gigs, earnings |
| Dispute | `/gig/[id]/dispute` | Evidence submission + AI verdict |

## 8. SDK API

```typescript
class GigSafe {
  createGig(params: CreateGigParams): Promise<CreateGigResult>;
  fundGig(gigPDA: PublicKey): Promise<TxResult>;
  acceptGig(gigPDA: PublicKey): Promise<TxResult>;
  submitMilestone(gigPDA: PublicKey, index: number): Promise<TxResult>;
  approveMilestone(gigPDA: PublicKey, index: number): Promise<TxResult>;
  requestDispute(gigPDA: PublicKey): Promise<TxResult>;
  resolveDispute(gigPDA: PublicKey, shares: DisputeShares): Promise<TxResult>;
  cancelGig(gigPDA: PublicKey): Promise<TxResult>;
  
  // Read
  getGig(gigPDA: PublicKey): Promise<GigAccount>;
  getMilestones(gigPDA: PublicKey): Promise<MilestoneAccount[]>;
  getGigsForClient(client: PublicKey): Promise<GigAccount[]>;
  getGigsForFreelancer(freelancer: PublicKey): Promise<GigAccount[]>;
}
```

## 9. Testing Plan

| Test | Type |
|---|---|
| Create gig with 3 milestones | Happy path |
| Fund gig with USDC | Happy path |
| Freelancer accepts | Happy path |
| Submit + approve milestone 1 | Happy path |
| Approve all milestones → gig completes | Happy path |
| Client cancels before acceptance | Happy path |
| Dispute → resolve with 70/30 split | Happy path |
| Wrong person tries to approve | Error |
| Fund already funded gig | Error |
| Accept already accepted gig | Error |
| Submit milestone out of order | Error |
| Cancel after freelancer accepted | Error |
| Milestone amounts don't sum to budget | Error |
