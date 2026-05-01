# Creating Your First Gig

This guide walks you through creating, funding, and managing a gig on GigSafe using the devnet deployment.

## Prerequisites

1. **Phantom** or **Solflare** wallet installed and set to **Devnet**
2. Some **devnet SOL** for transaction fees (get from [faucet](https://faucet.solana.com))
3. Some **devnet USDC** for funding the gig (see below)

## Step 1: Get Devnet USDC

GigSafe uses a custom devnet USDC token for testing. You'll need some to fund gigs.

The devnet USDC mint address is:
```
5ZpAiCXV9kgRm5Sa8755cJ9YYwuJtgZdZEKY1a5zPyYV
```

To mint some test USDC, you can use the Solana CLI:

```bash
# Create a token account for the devnet USDC
spl-token create-account 5ZpAiCXV9kgRm5Sa8755cJ9YYwuJtgZdZEKY1a5zPyYV

# If you're the mint authority, mint some tokens
spl-token mint 5ZpAiCXV9kgRm5Sa8755cJ9YYwuJtgZdZEKY1a5zPyYV 1000
```

## Step 2: Connect Your Wallet

1. Go to [gigsafe.wildsnap.in](https://gigsafe.wildsnap.in)
2. Click **"Select Wallet"** in the top right
3. Choose your wallet (Phantom/Solflare)
4. Approve the connection
5. You should see your address and SOL balance in the navbar

## Step 3: Create the Gig

1. Click **"Post a Gig"** in the navbar (or the hero CTA)
2. Fill in the form:
   - **Title:** Describe the work (e.g., "Design a logo for my startup")
   - **Token:** USDC (devnet) — pre-selected
   - **Milestones:** Add 1-10 milestones with names and amounts
     - Example: "Research & Concepts" — 50 USDC
     - Example: "Final Design" — 100 USDC
     - Example: "Source Files" — 50 USDC
   - **Deadline:** When the work should be complete
3. Review the **Total Budget** summary at the bottom

## Step 4: Create & Fund

Click **"Create Gig & Lock [amount] USDC"**. This triggers two transactions:

1. **`createGig`** — Creates the on-chain GigAccount with your milestones
2. **`fundGig`** — Transfers USDC from your wallet to the escrow PDA

Your wallet will prompt you to approve both transactions. Once confirmed, you'll be redirected to the gig detail page.

## Step 5: Share the Gig

The gig detail page URL contains the PDA address:
```
https://gigsafe.wildsnap.in/gig/[PDA_ADDRESS]
```

Share this link with the freelancer you want to hire. They can view the gig details and accept it.

## Step 6: Freelancer Accepts

When a freelancer visits the gig page with their wallet connected, they'll see an **"Accept This Gig"** button. Clicking it:

1. Calls `acceptGig` on-chain
2. Sets the freelancer's address on the gig
3. Changes status from **Open** → **Active**

## Step 7: Milestone Workflow

### Freelancer Submits Work

For each completed milestone, the freelancer clicks **"Submit"** next to the milestone. This marks it as submitted on-chain.

### Client Approves & Pays

The client reviews the work and clicks **"Approve & Pay"**. This:

1. Marks the milestone as approved
2. **Instantly transfers** the milestone amount from escrow → freelancer's wallet
3. If all milestones are approved, the gig is marked as **Completed** 🎉

## Step 8: What If There's a Dispute?

If either party is unhappy, they can request a dispute. The AI dispute resolver reviews evidence and splits the remaining funds fairly.

(Full dispute flow documentation coming in a future update.)

## Step 9: Cancel a Gig

If no freelancer has accepted yet, the client can click **"Cancel Gig & Refund"** to:
1. Get a full refund of the escrowed USDC
2. Set the gig status to **Cancelled**

## Transaction Costs

| Action | Approx. Cost |
|--------|-------------|
| Create Gig | ~0.01 SOL (rent + tx fee) |
| Fund Gig | ~0.005 SOL (tx fee) |
| Accept Gig | ~0.005 SOL |
| Submit Milestone | ~0.005 SOL |
| Approve Milestone | ~0.005 SOL |
| Cancel Gig | ~0.005 SOL |

All costs are in SOL for transaction fees. The USDC amounts are separate.

## Verifying On-Chain

Every transaction links to [Solana Explorer](https://explorer.solana.com/?cluster=devnet). You can verify:

- The escrow PDA holds the expected USDC
- Milestone statuses match what you see in the UI
- Funds transferred to the correct addresses

The program ID is always: `2UFrdXwUEDtr5uXsVrCYuvnGoaESQM9UqVVovEYmsAY4`
