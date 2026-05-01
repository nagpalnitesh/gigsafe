# Testing

## Protocol Tests

The smart contract has **13 integration tests** covering all instructions and error cases.

### Running Tests

```bash
cd gigsafe-protocol
anchor test
```

This starts a local validator, deploys the program, and runs all tests.

### Test Coverage

| Test | Description |
|------|-------------|
| ✅ Creates a gig | Creates gig with 3 milestones, verifies PDA state |
| ✅ Funds a gig | Deposits USDC into escrow PDA |
| ✅ Accepts a gig | Freelancer accepts, status → Active |
| ✅ Submits milestone | Freelancer marks milestone as submitted |
| ✅ Approves milestone | Client approves, funds transfer to freelancer |
| ✅ Approves all milestones | Auto-completes gig when all approved |
| ✅ Cancels unfunded gig | Client cancels before funding |
| ✅ Cancels funded gig | Client cancels, gets full refund |
| ✅ Rejects submit on wrong milestone | Can't submit already-submitted milestone |
| ✅ Rejects approve on unsubmitted | Can't approve pending milestone |
| ✅ Rejects accept on unfunded | Can't accept before funding |
| ✅ Rejects unauthorized freelancer | Only assigned freelancer can submit |
| ✅ Rejects unauthorized client | Only gig client can approve |

### Writing New Tests

Tests are in TypeScript using Anchor's test framework:

```typescript
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { GigsafeProtocol } from "../target/types/gigsafe_protocol";

describe("gigsafe", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.GigsafeProtocol as Program<GigsafeProtocol>;

  it("creates a gig", async () => {
    const gigId = new anchor.BN(Date.now());
    const milestoneAmounts = [
      new anchor.BN(100_000_000), // 100 USDC
      new anchor.BN(200_000_000), // 200 USDC
    ];
    
    const tx = await program.methods
      .createGig(gigId, "Test Gig", milestoneAmounts, new anchor.BN(deadline))
      .accounts({ tokenMint: usdcMint })
      .rpc();
    
    // Verify on-chain state
    const [gigPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("gig"), provider.wallet.publicKey.toBuffer(), gigId.toArrayLike(Buffer, "le", 8)],
      program.programId
    );
    
    const gig = await program.account.gigAccount.fetch(gigPda);
    assert.equal(gig.title, "Test Gig");
    assert.equal(gig.milestoneCount, 2);
  });
});
```

## Frontend Testing

Currently, the frontend relies on manual testing against devnet. Future additions:

- [ ] Unit tests with Vitest for utility functions
- [ ] Component tests with React Testing Library
- [ ] E2E tests with Playwright
- [ ] Mock wallet adapter for CI testing

## Manual Testing Checklist

### Happy Path
- [ ] Connect wallet (Phantom/Solflare)
- [ ] Create a gig with 3 milestones
- [ ] Fund the escrow
- [ ] Switch to freelancer wallet
- [ ] Accept the gig
- [ ] Submit milestone 1
- [ ] Switch to client wallet
- [ ] Approve milestone 1 (verify USDC transfer)
- [ ] Repeat for milestones 2-3
- [ ] Verify gig shows as Completed

### Error Cases
- [ ] Try creating a gig without wallet → shows connect prompt
- [ ] Try accepting unfunded gig → shows error
- [ ] Try submitting as non-freelancer → shows error
- [ ] Try approving unsubmitted milestone → shows error
- [ ] Cancel a funded, unaccepted gig → verify refund

### Cross-Browser
- [ ] Chrome + Phantom
- [ ] Firefox + Phantom
- [ ] Brave + built-in wallet
- [ ] Mobile (Phantom app browser)
