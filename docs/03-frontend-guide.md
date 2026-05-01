# Frontend Guide

## Overview

The GigSafe frontend is a **Next.js 16** application using the App Router. It provides a complete interface for interacting with the GigSafe protocol on Solana.

## Tech Stack

| Technology | Purpose |
|-----------|---------|
| Next.js 16 | React framework (App Router) |
| TypeScript | Type safety |
| Tailwind CSS v4 | Utility-first styling |
| Framer Motion | Animations & transitions |
| @solana/wallet-adapter | Wallet connection |
| @coral-xyz/anchor | Program interaction |
| Lucide React | Icons |

## Pages

### Landing Page (`/`)

The homepage showcases GigSafe's value proposition:
- Hero section with stats (0.5% fee, ~0.4s payouts, $0 hidden charges)
- How it works (4-step flow)
- Feature grid (6 key features)
- Comparison table vs Upwork/Fiverr/Freelancer.com
- Pricing tiers (Starter through Enterprise)
- SDK code preview
- FAQ section
- CTA section

### Create Gig (`/create`)

A form for clients to post new gigs:
- Title input (max 64 chars)
- Token selector (USDC on devnet)
- Dynamic milestone builder (1-10 milestones with names + amounts)
- Deadline picker
- Budget summary
- Two-step transaction: `createGig` → `fundGig`
- Redirects to gig detail page on success

### Browse Gigs (`/gigs`)

Lists all on-chain gigs:
- Fetches all `GigAccount` PDAs from the program
- Shows status badge, title, milestone count, budget, deadline
- Links to individual gig pages
- Loading skeletons during fetch
- Empty state for fresh deployments

### Gig Detail (`/gig/[id]`)

Full gig view with role-based actions:
- Header with status, funding badge, title
- Client/freelancer addresses, deadline, budget
- Escrow breakdown (total, released, remaining)
- Milestone list with status indicators
- **Freelancer actions:** Accept gig, Submit milestone
- **Client actions:** Approve milestone (triggers payment), Cancel gig
- Completion celebration state
- All transactions link to Solana Explorer

### Dashboard (`/dashboard`)

Personal gig management:
- Sections: "My Gigs as Client" and "My Gigs as Freelancer"
- Filtered from all on-chain gigs by connected wallet
- Quick access to post new gigs

## Components

### `WalletProvider`

Wraps the app with Solana wallet adapters:

```tsx
// src/components/WalletProvider.tsx
<ConnectionProvider endpoint="https://api.devnet.solana.com">
  <WalletProvider wallets={[Phantom, Solflare]} autoConnect>
    <WalletModalProvider>{children}</WalletModalProvider>
  </WalletProvider>
</ConnectionProvider>
```

### `Navbar`

Sticky navigation with:
- Logo + brand name
- DEVNET badge
- Navigation links (Browse, Post, Dashboard)
- Wallet button (connect/disconnect)
- SOL balance display
- Address copy + dropdown menu

### `Toast`

Custom toast notification system:
- Success (green), Error (red), Loading (spinner) states
- Auto-dismiss after 6 seconds
- Action buttons (e.g., "View on Explorer")
- Stacked bottom-right positioning
- Framer Motion enter/exit animations

## Hooks

### `useProgram`

Returns an Anchor `Program` instance connected to the user's wallet:

```tsx
import { useProgram } from "@/hooks/useProgram";

function MyComponent() {
  const program = useProgram(); // null if wallet not connected
  
  if (!program) return <p>Connect wallet</p>;
  
  // Use program to call instructions
  const gigs = await fetchAllGigs(program);
}
```

## Library Functions (`src/lib/program.ts`)

### PDA Derivation

```typescript
// Derive gig PDA from client pubkey + gig ID
const [gigPda, bump] = deriveGigPDA(clientPubkey, gigId);

// Derive escrow PDA from gig PDA
const [escrowPda, escrowBump] = deriveEscrowPDA(gigPda);
```

### Instruction Wrappers

All on-chain instructions have TypeScript wrappers:

```typescript
// Create a new gig
await createGig(program, gigId, title, milestoneAmounts, deadline, tokenMint);

// Fund the escrow
await fundGig(program, gigId);

// Freelancer accepts
await acceptGig(program, gigId);

// Submit milestone work
await submitMilestone(program, gigId, milestoneIndex);

// Approve and pay
await approveMilestone(program, clientKey, gigId, milestoneIndex, freelancerWallet, tokenMint);

// Cancel and refund
await cancelGig(program, clientKey, gigId, tokenMint);
```

### Utilities

```typescript
// Convert between human-readable and on-chain amounts
toSmallestUnits(100)     // → BN(100_000_000) for 6 decimal USDC
fromSmallestUnits(bn)    // → 100.0

// Display helpers
shortenKey("ABC...XYZ")  // → "ABC...XYZ"
```

## Styling

Global styles are minimal — Tailwind v4 handles everything:

```css
/* src/app/globals.css */
@import "tailwindcss";

:root {
  --background: #030712;
  --foreground: #f9fafb;
}
```

### Color Palette

| Color | Usage | Hex |
|-------|-------|-----|
| Emerald 400 | Primary accent | `#34d399` |
| Emerald 500 | Buttons, CTAs | `#10b981` |
| Cyan 400 | Secondary accent | `#22d3ee` |
| Gray 400 | Body text | `#9ca3af` |
| Gray 600 | Muted text | `#4b5563` |
| Dark BG | Background | `#030712` |

## Adding a New Page

1. Create `src/app/your-page/page.tsx`
2. Use `"use client"` directive for wallet interaction
3. Use `useProgram()` hook to get the Anchor program
4. Use `useToast()` for transaction feedback
5. Follow existing patterns for loading states and error handling

Example:

```tsx
"use client";

import { useProgram } from "@/hooks/useProgram";
import { useToast } from "@/components/Toast";

export default function NewPage() {
  const program = useProgram();
  const toast = useToast();

  const handleAction = async () => {
    const loadingId = toast.loading("Processing...");
    try {
      // Call program instruction
      toast.dismiss(loadingId);
      toast.success("Done! 🎉");
    } catch (err) {
      toast.dismiss(loadingId);
      toast.error(`Error: ${err.message}`);
    }
  };

  return <div>...</div>;
}
```
