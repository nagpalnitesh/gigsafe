# Protocol Architecture

## Overview

The GigSafe protocol is a Solana program built with [Anchor](https://www.anchor-lang.com/) 0.32. It manages the full lifecycle of a freelance gig — from creation and funding through milestone completion to dispute resolution.

## On-Chain State

### GigAccount

Every gig creates a **GigAccount** PDA (Program Derived Address) that stores all state:

```rust
#[account]
pub struct GigAccount {
    pub client: Pubkey,           // Who posted the gig
    pub freelancer: Pubkey,       // Who accepted it
    pub token_mint: Pubkey,       // SPL token (USDC)
    pub title: String,            // Gig title (max 64 chars)
    pub total_budget: u64,        // Total across all milestones
    pub funded_amount: u64,       // Amount deposited in escrow
    pub released_amount: u64,     // Amount paid out so far
    pub status: GigStatus,        // Open, Active, Completed, Cancelled, Disputed
    pub milestone_count: u8,      // Number of milestones (1-10)
    pub milestone_amounts: Vec<u64>,   // Budget per milestone
    pub milestone_statuses: Vec<u8>,   // Pending(0), Submitted(1), Approved(2)
    pub deadline: i64,            // Unix timestamp
    pub created_at: i64,          // Unix timestamp
    pub gig_id: u64,             // Unique ID (client-generated)
    pub escrow_bump: u8,         // PDA bump for escrow account
    pub bump: u8,                // PDA bump for this account
}
```

### PDA Seeds

```
GigAccount:  ["gig", client_pubkey, gig_id_bytes]
Escrow ATA:  ["escrow", gig_pda]
```

## Instructions (8 total)

### 1. `create_gig`

Creates a new gig with milestones and deadline.

**Signer:** Client  
**Params:** `gig_id`, `title`, `milestone_amounts[]`, `deadline`  
**Accounts:** `token_mint`

```
Client → create_gig → GigAccount PDA created (status: Open)
```

### 2. `fund_gig`

Client deposits the full budget into the escrow PDA.

**Signer:** Client  
**Flow:** Transfers SPL tokens from client's ATA → escrow ATA

```
Client's USDC → escrow PDA (status: Open, funded ✓)
```

### 3. `accept_gig`

Freelancer accepts an open, funded gig.

**Signer:** Freelancer  
**Validation:** Gig must be Open and funded

```
Freelancer accepts → status: Open → Active
```

### 4. `submit_milestone`

Freelancer marks a milestone as complete.

**Signer:** Freelancer  
**Params:** `milestone_index`  
**Validation:** Milestone must be Pending, gig must be Active

```
Milestone status: Pending(0) → Submitted(1)
```

### 5. `approve_milestone`

Client approves a submitted milestone. Funds for that milestone release instantly to the freelancer.

**Signer:** Client  
**Params:** `milestone_index`  
**Flow:** Escrow → Freelancer's ATA (milestone amount)

```
Milestone: Submitted(1) → Approved(2)
USDC transferred to freelancer
If all milestones approved → status: Completed
```

### 6. `request_dispute`

Either party can dispute an active gig.

**Signer:** Client or Freelancer  
**Validation:** Gig must be Active

```
status: Active → Disputed
```

### 7. `resolve_dispute`

AI dispute resolver (authority) settles the dispute by splitting funds.

**Signer:** Dispute authority  
**Params:** `client_basis_points`, `freelancer_basis_points`  
**Flow:** Splits remaining escrow between both parties

```
AI analyzes evidence → splits funds → status: Completed
```

### 8. `cancel_gig`

Client cancels an open gig and gets a full refund.

**Signer:** Client  
**Validation:** Gig must be Open (no freelancer accepted yet)

```
Escrow refunded to client → status: Cancelled
```

## Lifecycle Diagram

```
  create_gig → fund_gig → [Open/Funded]
                              │
                         accept_gig
                              │
                          [Active]
                         /    │    \
              submit_ms   request_dispute   cancel*
                  │              │
             [Submitted]    [Disputed]
                  │              │
             approve_ms    resolve_dispute
                  │              │
            [Approved] ────→ [Completed]
            (if all ms)
```

*Cancel only before acceptance

## Error Codes

| Code | Name | Description |
|------|------|-------------|
| 6000 | InvalidMilestoneCount | Must have 1-10 milestones |
| 6001 | InvalidDeadline | Deadline must be in the future |
| 6002 | TitleTooLong | Title exceeds 64 characters |
| 6003 | GigNotOpen | Gig is not in Open status |
| 6004 | GigNotActive | Gig is not in Active status |
| 6005 | GigNotFunded | Gig has not been funded yet |
| 6006 | AlreadyFunded | Gig is already funded |
| 6007 | UnauthorizedFreelancer | Only the assigned freelancer can do this |
| 6008 | UnauthorizedClient | Only the client can do this |
| 6009 | InvalidMilestoneIndex | Milestone index out of range |
| 6010 | MilestoneNotPending | Milestone is not in Pending status |
| 6011 | MilestoneNotSubmitted | Milestone is not in Submitted status |
| 6012 | InvalidBasisPoints | Basis points must sum to 10000 |
| 6013 | Overflow | Arithmetic overflow |

## Events

The program emits 8 events for off-chain indexing:

- `GigCreated` — New gig with milestones
- `GigFunded` — Escrow funded
- `GigAccepted` — Freelancer accepted
- `MilestoneSubmitted` — Work submitted
- `MilestoneApproved` — Work approved + paid
- `DisputeRequested` — Dispute opened
- `DisputeResolved` — AI resolved dispute
- `GigCancelled` — Gig cancelled + refunded

## Security Considerations

- **Non-custodial:** Funds are in PDA escrows, not in any wallet
- **Checked math:** All arithmetic uses checked operations (no overflow)
- **PDA validation:** All accounts are derived and verified via seeds
- **Authority checks:** Every instruction validates the signer against the gig's client/freelancer
- **SPL token standard:** Uses `anchor_spl::token` for all transfers
