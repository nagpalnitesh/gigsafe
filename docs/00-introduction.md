# Introduction

## What is GigSafe?

GigSafe is a **trustless freelance escrow protocol** built on Solana. It replaces the broken middleman model (Upwork, Fiverr, Freelancer.com) with on-chain escrow, milestone-based payments, and AI-powered dispute resolution.

**The problem:** Traditional freelance platforms charge 10-20% fees, hold payments for 14+ days, and resolve disputes through slow manual processes. Freelancers in developing countries often can't even access these platforms due to banking restrictions.

**The solution:** GigSafe locks funds in a Solana PDA (Program Derived Address) escrow. Payments release per milestone. Disputes are resolved by AI in minutes, not weeks. Fee: 0.5%.

## Key Features

- **On-Chain Escrow** — Client funds are locked in a non-custodial smart contract. No middleman holds your money.
- **Milestone Payments** — Break projects into up to 10 milestones. Funds release as each is approved.
- **AI Dispute Resolution** — Disagreements are analyzed by AI that reviews evidence and suggests fair splits.
- **Instant Payouts** — Freelancers receive USDC the moment work is approved (~0.4s on Solana).
- **0.5% Fee** — Compared to 10-20% on traditional platforms.
- **Borderless** — Anyone with a Solana wallet can participate. No bank account required.

## Architecture

GigSafe has two main components:

1. **Protocol** — An Anchor (Rust) program deployed on Solana that handles escrow, milestones, and dispute resolution on-chain.
2. **Frontend** — A Next.js 16 web app that provides the user interface for creating gigs, managing milestones, and connecting wallets.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Smart Contract | Rust + Anchor 0.32 |
| Frontend | Next.js 16 (App Router) |
| Styling | Tailwind CSS v4 |
| Animations | Framer Motion |
| Wallet | @solana/wallet-adapter |
| Token | SPL Token (USDC) |
| Network | Solana Devnet |

## Links

- **Live App:** [gigsafe.wildsnap.in](https://gigsafe.wildsnap.in)
- **GitHub:** [github.com/indiebyte/gigsafe](https://github.com/indiebyte/gigsafe)
- **Twitter:** [@gigsafe_sol](https://x.com/gigsafe_sol)
- **Program ID:** `2UFrdXwUEDtr5uXsVrCYuvnGoaESQM9UqVVovEYmsAY4`
