# GigSafe

**Freelance payments, finally safe.**

Trustless escrow on Solana with milestone payments, AI dispute resolution, and 0.5% fees.

[![Built on Solana](https://img.shields.io/badge/Built%20on-Solana-14F195?style=flat&logo=solana)](https://solana.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

---

## What is GigSafe?

GigSafe replaces the broken freelance payment model. Instead of trusting a platform with 20% fees and 14-day payouts, funds are locked in on-chain escrow — released only when milestones are approved.

- **For Clients:** Your money is safe until work is delivered. Cancel anytime before approval.
- **For Freelancers:** Get paid instantly on approval. No 30-day payment terms. No platform taking 20%.
- **For Platforms:** Embed GigSafe escrow in your marketplace with our SDK.

## How It Works

```
Client creates gig → Funds escrow (USDC/SOL) → Freelancer works
→ Submits deliverable → Client approves → Instant payout
```

If there's a dispute → AI analyzes evidence → Suggests fair resolution.

## Architecture

```
┌─────────────────────────────────────────────────┐
│                   GigSafe App                    │
│           Next.js · React · TailwindCSS          │
│         Wallet Adapter · Dashboard               │
├─────────────────────────────────────────────────┤
│                @gigsafe/sdk                      │
│             TypeScript SDK                       │
│   createGig · fundEscrow · approve · dispute     │
├─────────────────────────────────────────────────┤
│              Solana Program                      │
│         Anchor (Rust) Smart Contract             │
│    PDA Escrows · Milestones · AI Disputes        │
├─────────────────────────────────────────────────┤
│                  Solana                          │
│       400ms finality · <$0.001 fees · USDC       │
└─────────────────────────────────────────────────┘
```

## Protocol

| Instruction | Description |
|---|---|
| `create_gig` | Client creates gig with title, milestones, budget |
| `fund_gig` | Client deposits USDC/SOL into PDA escrow |
| `accept_gig` | Freelancer accepts the gig |
| `submit_milestone` | Freelancer marks milestone complete |
| `approve_milestone` | Client approves → funds release for that milestone |
| `request_dispute` | Either party raises a dispute |
| `resolve_dispute` | AI/arbitrator resolves → funds split accordingly |
| `cancel_gig` | Client cancels (only before freelancer starts) → full refund |

## Key Features

| Feature | GigSafe | Upwork | Fiverr |
|---|---|---|---|
| Platform fee | **0.5%** | 10-20% | 20% |
| Payout speed | **Instant** | 7-14 days | 14 days |
| Dispute resolution | **AI (minutes)** | Manual (weeks) | Manual (weeks) |
| Custody | **Non-custodial (PDA)** | Platform holds funds | Platform holds funds |
| Global access | **Anywhere (USDC)** | Banking required | Banking required |
| Transparency | **On-chain** | Opaque | Opaque |

## Tech Stack

| Layer | Technology |
|---|---|
| Smart Contract | Rust · Anchor |
| SDK | TypeScript · @solana/web3.js |
| Frontend | Next.js 16 · React · TailwindCSS · Framer Motion |
| Wallet | Phantom · Solflare |
| Tokens | USDC · SOL |
| AI | Groq (Llama 3.3 70B) for dispute resolution + risk assessment |
| Network | Solana Devnet → Mainnet |

## Quick Start

### Prerequisites
- Node.js 18+ or Bun
- Solana CLI + Anchor CLI
- Rust toolchain

### Landing Page
```bash
git clone https://github.com/indiepilotai/gigsafe.git
cd gigsafe
bun install
bun run dev
```

### Smart Contract (coming soon)
```bash
cd programs/gigsafe
anchor build
anchor test
anchor deploy --provider.cluster devnet
```

## Roadmap

- [x] Landing page with SEO
- [x] Solana program (8 instructions, 13/13 tests passing)
- [x] TypeScript SDK (@gigsafe/sdk)
- [x] Full app (create, browse, detail, dashboard)
- [x] AI dispute resolution (Groq/Llama 3.3 70B)
- [x] Deploy to devnet
- [x] User profiles + reputation system
- [x] In-gig messaging
- [x] Notification system
- [x] AI memory system (risk assessment + pattern-aware disputes)
- [x] File upload for deliverables
- [x] Milestone names + gig descriptions
- [x] Deadline enforcement
- [x] Server-side data persistence
- [ ] Demo video
- [ ] Hackathon submission
- [ ] Embeddable widget
- [ ] Invoice generation
- [ ] Mainnet deployment

## Links

| | |
|---|---|
| Landing Page | [gigsafe.pixxmo.com](https://gigsafe.pixxmo.com) |
| Twitter | [@nagpalnitesh](https://x.com/nagpalnitesh) |

## Hackathon

Built for the **Solana Frontier Hackathon** (April 6 – May 11, 2026) by [@nagpalnitesh](https://x.com/nagpalnitesh).

## License

MIT
