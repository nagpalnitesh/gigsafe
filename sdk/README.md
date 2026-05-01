# @gigsafe/sdk

TypeScript SDK for **GigSafe** — trustless freelance escrow on Solana.

## Install

```bash
npm install @gigsafe/sdk @coral-xyz/anchor @solana/web3.js
```

## Quick Start

```typescript
import { GigSafe, DEVNET_USDC_MINT } from "@gigsafe/sdk";

// Initialize with your wallet
const gs = new GigSafe(wallet);

// Create and fund a gig in one call
const { createTx, fundTx, gigPda } = await gs.createAndFundGig({
  gigId: Date.now(),
  title: "Build a landing page",
  milestoneAmounts: [200, 300, 500],  // USDC per milestone
  deadline: new Date("2026-06-01"),
  tokenMint: DEVNET_USDC_MINT,
});

console.log("Gig created:", gigPda.toString());
```

## Full Lifecycle

```typescript
// 1. Client creates & funds
const { gigPda } = await gs.createAndFundGig({ ... });

// 2. Freelancer accepts
await gs.acceptGig(gigId);

// 3. Freelancer submits milestone
await gs.submitMilestone(gigId, 0);

// 4. Client approves → freelancer gets paid instantly
await gs.approveMilestone(clientKey, gigId, 0, freelancerWallet, tokenMint);

// 5. If dispute: raise it
await gs.requestDispute(gigId);

// 6. Resolve with AI-recommended split
await gs.resolveDispute(clientKey, gigId, 7000, freelancerWallet, clientWallet, tokenMint);
// 7000 = 70% to freelancer, 30% refund to client
```

## Queries

```typescript
// Fetch all gigs
const gigs = await gs.fetchAllGigs();

// Fetch by PDA
const gig = await gs.fetchGig(gigPda);

// Fetch by role
const clientGigs = await gs.fetchGigsByClient(walletPubkey);
const freelancerGigs = await gs.fetchGigsByFreelancer(walletPubkey);

// Helpers
gs.getStatusLabel(gig.status);        // "Active"
gs.getApprovedCount(gig);             // 2
gs.getRemainingAmount(gig);           // 300.00
GigSafe.shortenKey(gig.client);       // "A1b2...x9Y0"
```

## API Reference

### Constructor

```typescript
new GigSafe(wallet: Wallet, config?: {
  rpcEndpoint?: string;     // default: devnet
  tokenDecimals?: number;   // default: 6 (USDC)
})
```

### Instructions

| Method | Description |
|--------|-------------|
| `createGig(params)` | Create a new gig with milestones |
| `fundGig(gigId)` | Fund escrow with full budget |
| `createAndFundGig(params)` | Create + fund in one call |
| `acceptGig(gigId)` | Accept as freelancer |
| `submitMilestone(gigId, index)` | Mark milestone complete |
| `approveMilestone(...)` | Approve + pay freelancer |
| `requestDispute(gigId)` | Raise a dispute |
| `resolveDispute(...)` | Split funds per ruling |
| `cancelGig(...)` | Cancel + refund (before accept) |

### Queries

| Method | Returns |
|--------|---------|
| `fetchAllGigs()` | All on-chain gigs |
| `fetchGig(pda)` | Single gig by PDA |
| `fetchGigsByClient(pubkey)` | Gigs where pubkey is client |
| `fetchGigsByFreelancer(pubkey)` | Gigs where pubkey is freelancer |

## Links

- **Protocol:** [github.com/indiebyte/gigsafe](https://github.com/indiebyte/gigsafe)
- **Live App:** [gigsafe.wildsnap.in](https://gigsafe.wildsnap.in)
- **Twitter:** [@gigsafe_sol](https://x.com/gigsafe_sol)

## License

MIT
