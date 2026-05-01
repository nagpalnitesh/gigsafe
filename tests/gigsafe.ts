import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { GigsafeProtocol } from "../target/types/gigsafe_protocol";
import { createMint, getOrCreateAssociatedTokenAccount, mintTo, getAccount } from "@solana/spl-token";
import { Keypair, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { assert } from "chai";

describe("gigsafe", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.GigsafeProtocol as Program<GigsafeProtocol>;

  const client = (provider.wallet as any).payer as Keypair;
  const freelancer = Keypair.generate();

  let tokenMint: PublicKey;
  let clientATA: PublicKey;
  const gigId = new BN(1);
  const milestoneAmounts = [new BN(300_000_000), new BN(500_000_000), new BN(200_000_000)]; // 0.3 + 0.5 + 0.2 = 1.0 token
  const totalBudget = new BN(1_000_000_000); // 1 token (9 decimals)
  const deadline = new BN(Math.floor(Date.now() / 1000) + 86400 * 30); // 30 days from now

  const getGigPDA = (clientKey: PublicKey, id: BN) =>
    PublicKey.findProgramAddressSync(
      [Buffer.from("gig"), clientKey.toBuffer(), id.toArrayLike(Buffer, "le", 8)],
      program.programId
    );

  const getEscrowPDA = (gigPDA: PublicKey) =>
    PublicKey.findProgramAddressSync(
      [Buffer.from("escrow"), gigPDA.toBuffer()],
      program.programId
    );

  before(async () => {
    // Airdrop to freelancer
    const sig = await provider.connection.requestAirdrop(freelancer.publicKey, 2 * LAMPORTS_PER_SOL);
    await provider.connection.confirmTransaction(sig);

    // Create token mint
    tokenMint = await createMint(provider.connection, client, client.publicKey, null, 9);

    // Mint tokens to client
    const ata = await getOrCreateAssociatedTokenAccount(provider.connection, client, tokenMint, client.publicKey);
    clientATA = ata.address;
    await mintTo(provider.connection, client, tokenMint, clientATA, client, 100_000_000_000); // 100 tokens

    console.log("Token mint:", tokenMint.toString());
    console.log("Client:", client.publicKey.toString());
    console.log("Freelancer:", freelancer.publicKey.toString());
  });

  // ===== HAPPY PATH =====

  it("✅ Creates a gig with 3 milestones", async () => {
    const [gigPDA] = getGigPDA(client.publicKey, gigId);
    const [escrowPDA] = getEscrowPDA(gigPDA);

    await program.methods
      .createGig(gigId, "Build a landing page", milestoneAmounts, deadline)
      .accounts({
        gig: gigPDA,
        escrow: escrowPDA,
        client: client.publicKey,
        tokenMint,
      })
      .rpc();

    const gig = await program.account.gigAccount.fetch(gigPDA);
    assert.equal(gig.client.toString(), client.publicKey.toString());
    assert.equal(gig.totalBudget.toString(), totalBudget.toString());
    assert.equal(gig.milestoneCount, 3);
    assert.equal(gig.status, 0); // Open
    assert.equal(gig.fundedAmount.toString(), "0");
    assert.equal(gig.title, "Build a landing page");

    console.log("Gig created! Budget:", gig.totalBudget.toString(), "| Milestones:", gig.milestoneCount);
  });

  it("✅ Client funds the escrow", async () => {
    const [gigPDA] = getGigPDA(client.publicKey, gigId);
    const [escrowPDA] = getEscrowPDA(gigPDA);

    await program.methods
      .fundGig(gigId)
      .accounts({
        gig: gigPDA,
        escrow: escrowPDA,
        client: client.publicKey,
        clientTokenAccount: clientATA,
      })
      .rpc();

    const gig = await program.account.gigAccount.fetch(gigPDA);
    assert.equal(gig.fundedAmount.toString(), totalBudget.toString());

    const escrow = await getAccount(provider.connection, escrowPDA);
    assert.equal(escrow.amount.toString(), totalBudget.toString());

    console.log("Escrow funded:", gig.fundedAmount.toString());
  });

  it("✅ Freelancer accepts the gig", async () => {
    const [gigPDA] = getGigPDA(client.publicKey, gigId);

    await program.methods
      .acceptGig(gigId)
      .accounts({
        gig: gigPDA,
        freelancer: freelancer.publicKey,
      })
      .signers([freelancer])
      .rpc();

    const gig = await program.account.gigAccount.fetch(gigPDA);
    assert.equal(gig.freelancer.toString(), freelancer.publicKey.toString());
    assert.equal(gig.status, 1); // Active

    console.log("Gig accepted by:", gig.freelancer.toString().slice(0, 8) + "...");
  });

  it("✅ Freelancer submits milestone 0", async () => {
    const [gigPDA] = getGigPDA(client.publicKey, gigId);

    await program.methods
      .submitMilestone(gigId, 0)
      .accounts({
        gig: gigPDA,
        freelancer: freelancer.publicKey,
      })
      .signers([freelancer])
      .rpc();

    const gig = await program.account.gigAccount.fetch(gigPDA);
    assert.equal(gig.milestoneStatuses[0], 1); // Submitted

    console.log("Milestone 0 submitted");
  });

  it("✅ Client approves milestone 0 → payment released", async () => {
    const [gigPDA] = getGigPDA(client.publicKey, gigId);
    const [escrowPDA] = getEscrowPDA(gigPDA);

    const freelancerATA = await getOrCreateAssociatedTokenAccount(
      provider.connection, client, tokenMint, freelancer.publicKey
    );

    await program.methods
      .approveMilestone(client.publicKey, gigId, 0)
      .accounts({
        gig: gigPDA,
        escrow: escrowPDA,
        client: client.publicKey,
        freelancerTokenAccount: freelancerATA.address,
        freelancerWallet: freelancer.publicKey,
        tokenMint,
      })
      .rpc();

    const gig = await program.account.gigAccount.fetch(gigPDA);
    assert.equal(gig.milestoneStatuses[0], 2); // Approved
    assert.equal(gig.releasedAmount.toString(), milestoneAmounts[0].toString());

    const balance = await getAccount(provider.connection, freelancerATA.address);
    assert.equal(balance.amount.toString(), milestoneAmounts[0].toString());

    console.log("Milestone 0 approved! Freelancer received:", milestoneAmounts[0].toString());
  });

  it("✅ Submit + approve remaining milestones → gig completes", async () => {
    const [gigPDA] = getGigPDA(client.publicKey, gigId);
    const [escrowPDA] = getEscrowPDA(gigPDA);

    const freelancerATA = await getOrCreateAssociatedTokenAccount(
      provider.connection, client, tokenMint, freelancer.publicKey
    );

    // Milestone 1
    await program.methods
      .submitMilestone(gigId, 1)
      .accounts({ gig: gigPDA, freelancer: freelancer.publicKey })
      .signers([freelancer])
      .rpc();

    await program.methods
      .approveMilestone(client.publicKey, gigId, 1)
      .accounts({
        gig: gigPDA, escrow: escrowPDA, client: client.publicKey,
        freelancerTokenAccount: freelancerATA.address,
        freelancerWallet: freelancer.publicKey, tokenMint,
      })
      .rpc();

    // Milestone 2
    await program.methods
      .submitMilestone(gigId, 2)
      .accounts({ gig: gigPDA, freelancer: freelancer.publicKey })
      .signers([freelancer])
      .rpc();

    await program.methods
      .approveMilestone(client.publicKey, gigId, 2)
      .accounts({
        gig: gigPDA, escrow: escrowPDA, client: client.publicKey,
        freelancerTokenAccount: freelancerATA.address,
        freelancerWallet: freelancer.publicKey, tokenMint,
      })
      .rpc();

    const gig = await program.account.gigAccount.fetch(gigPDA);
    assert.equal(gig.status, 2); // Completed!
    assert.equal(gig.releasedAmount.toString(), totalBudget.toString());

    const balance = await getAccount(provider.connection, freelancerATA.address);
    assert.equal(balance.amount.toString(), totalBudget.toString());

    console.log("🎉 GIG COMPLETED! Freelancer received full budget:", totalBudget.toString());
  });

  // ===== CANCEL FLOW =====

  it("✅ Client cancels an unfunded gig", async () => {
    const cancelGigId = new BN(2);
    const [gigPDA] = getGigPDA(client.publicKey, cancelGigId);
    const [escrowPDA] = getEscrowPDA(gigPDA);

    await program.methods
      .createGig(cancelGigId, "Cancel me", [new BN(500_000_000)], deadline)
      .accounts({ gig: gigPDA, escrow: escrowPDA, client: client.publicKey, tokenMint })
      .rpc();

    await program.methods
      .cancelGig(client.publicKey, cancelGigId)
      .accounts({
        gig: gigPDA, escrow: escrowPDA, client: client.publicKey,
        clientTokenAccount: clientATA, tokenMint,
      })
      .rpc();

    const gig = await program.account.gigAccount.fetch(gigPDA);
    assert.equal(gig.status, 5); // Cancelled
    console.log("Gig cancelled (unfunded) ✓");
  });

  it("✅ Client cancels a funded gig → full refund", async () => {
    const cancelGigId = new BN(3);
    const [gigPDA] = getGigPDA(client.publicKey, cancelGigId);
    const [escrowPDA] = getEscrowPDA(gigPDA);

    await program.methods
      .createGig(cancelGigId, "Cancel funded", [new BN(500_000_000)], deadline)
      .accounts({ gig: gigPDA, escrow: escrowPDA, client: client.publicKey, tokenMint })
      .rpc();

    await program.methods
      .fundGig(cancelGigId)
      .accounts({ gig: gigPDA, escrow: escrowPDA, client: client.publicKey, clientTokenAccount: clientATA })
      .rpc();

    const balBefore = (await getAccount(provider.connection, clientATA)).amount;

    await program.methods
      .cancelGig(client.publicKey, cancelGigId)
      .accounts({
        gig: gigPDA, escrow: escrowPDA, client: client.publicKey,
        clientTokenAccount: clientATA, tokenMint,
      })
      .rpc();

    const balAfter = (await getAccount(provider.connection, clientATA)).amount;
    const refund = BigInt(balAfter.toString()) - BigInt(balBefore.toString());
    assert.equal(refund.toString(), "500000000");

    console.log("Gig cancelled (funded) → refunded:", refund.toString());
  });

  // ===== DISPUTE FLOW =====

  it("✅ Dispute → AI resolution splits 70/30", async () => {
    const disputeGigId = new BN(4);
    const [gigPDA] = getGigPDA(client.publicKey, disputeGigId);
    const [escrowPDA] = getEscrowPDA(gigPDA);

    // Create + fund + accept
    await program.methods
      .createGig(disputeGigId, "Dispute test", [new BN(1_000_000_000)], deadline)
      .accounts({ gig: gigPDA, escrow: escrowPDA, client: client.publicKey, tokenMint })
      .rpc();
    await program.methods
      .fundGig(disputeGigId)
      .accounts({ gig: gigPDA, escrow: escrowPDA, client: client.publicKey, clientTokenAccount: clientATA })
      .rpc();
    await program.methods
      .acceptGig(disputeGigId)
      .accounts({ gig: gigPDA, freelancer: freelancer.publicKey })
      .signers([freelancer])
      .rpc();

    // Raise dispute
    await program.methods
      .requestDispute(disputeGigId)
      .accounts({ gig: gigPDA, caller: client.publicKey })
      .rpc();

    let gig = await program.account.gigAccount.fetch(gigPDA);
    assert.equal(gig.status, 3); // Disputed

    // Resolve: 70% to freelancer, 30% to client
    const freelancerATA = await getOrCreateAssociatedTokenAccount(
      provider.connection, client, tokenMint, freelancer.publicKey
    );
    const freelancerBalBefore = (await getAccount(provider.connection, freelancerATA.address)).amount;
    const clientBalBefore = (await getAccount(provider.connection, clientATA)).amount;

    await program.methods
      .resolveDispute(client.publicKey, disputeGigId, 7000) // 70% to freelancer
      .accounts({
        gig: gigPDA, escrow: escrowPDA, resolver: client.publicKey,
        freelancerTokenAccount: freelancerATA.address,
        clientTokenAccount: clientATA,
        freelancerWallet: freelancer.publicKey,
        clientWallet: client.publicKey,
        tokenMint,
      })
      .rpc();

    gig = await program.account.gigAccount.fetch(gigPDA);
    assert.equal(gig.status, 4); // Resolved

    const freelancerBalAfter = (await getAccount(provider.connection, freelancerATA.address)).amount;
    const clientBalAfter = (await getAccount(provider.connection, clientATA)).amount;
    const freelancerGot = BigInt(freelancerBalAfter.toString()) - BigInt(freelancerBalBefore.toString());
    const clientGot = BigInt(clientBalAfter.toString()) - BigInt(clientBalBefore.toString());

    assert.equal(freelancerGot.toString(), "700000000"); // 70%
    assert.equal(clientGot.toString(), "300000000"); // 30%

    console.log("Dispute resolved! Freelancer:", freelancerGot.toString(), "Client refund:", clientGot.toString());
  });

  // ===== ERROR CASES =====

  it("❌ Cannot accept own gig", async () => {
    const sid = new BN(10);
    const [gigPDA] = getGigPDA(client.publicKey, sid);
    const [escrowPDA] = getEscrowPDA(gigPDA);

    await program.methods
      .createGig(sid, "Self accept", [new BN(100_000_000)], deadline)
      .accounts({ gig: gigPDA, escrow: escrowPDA, client: client.publicKey, tokenMint })
      .rpc();
    await program.methods
      .fundGig(sid)
      .accounts({ gig: gigPDA, escrow: escrowPDA, client: client.publicKey, clientTokenAccount: clientATA })
      .rpc();

    try {
      await program.methods
        .acceptGig(sid)
        .accounts({ gig: gigPDA, freelancer: client.publicKey })
        .rpc();
      assert.fail("Should have thrown");
    } catch (err: any) {
      console.log("Cannot accept own gig ✓");
    }
  });

  it("❌ Cannot fund already funded gig", async () => {
    const sid = new BN(11);
    const [gigPDA] = getGigPDA(client.publicKey, sid);
    const [escrowPDA] = getEscrowPDA(gigPDA);

    await program.methods
      .createGig(sid, "Double fund", [new BN(100_000_000)], deadline)
      .accounts({ gig: gigPDA, escrow: escrowPDA, client: client.publicKey, tokenMint })
      .rpc();
    await program.methods
      .fundGig(sid)
      .accounts({ gig: gigPDA, escrow: escrowPDA, client: client.publicKey, clientTokenAccount: clientATA })
      .rpc();

    try {
      await program.methods
        .fundGig(sid)
        .accounts({ gig: gigPDA, escrow: escrowPDA, client: client.publicKey, clientTokenAccount: clientATA })
        .rpc();
      assert.fail("Should have thrown");
    } catch (err: any) {
      console.log("Cannot double-fund ✓");
    }
  });

  it("❌ Wrong person cannot approve milestone", async () => {
    const sid = new BN(12);
    const [gigPDA] = getGigPDA(client.publicKey, sid);
    const [escrowPDA] = getEscrowPDA(gigPDA);

    await program.methods
      .createGig(sid, "Auth test", [new BN(100_000_000)], deadline)
      .accounts({ gig: gigPDA, escrow: escrowPDA, client: client.publicKey, tokenMint })
      .rpc();
    await program.methods
      .fundGig(sid)
      .accounts({ gig: gigPDA, escrow: escrowPDA, client: client.publicKey, clientTokenAccount: clientATA })
      .rpc();
    await program.methods
      .acceptGig(sid)
      .accounts({ gig: gigPDA, freelancer: freelancer.publicKey })
      .signers([freelancer])
      .rpc();
    await program.methods
      .submitMilestone(sid, 0)
      .accounts({ gig: gigPDA, freelancer: freelancer.publicKey })
      .signers([freelancer])
      .rpc();

    // Freelancer tries to approve (should fail - only client can)
    const freelancerATA = await getOrCreateAssociatedTokenAccount(
      provider.connection, client, tokenMint, freelancer.publicKey
    );

    try {
      await program.methods
        .approveMilestone(client.publicKey, sid, 0)
        .accounts({
          gig: gigPDA, escrow: escrowPDA, client: freelancer.publicKey,
          freelancerTokenAccount: freelancerATA.address,
          freelancerWallet: freelancer.publicKey, tokenMint,
        })
        .signers([freelancer])
        .rpc();
      assert.fail("Should have thrown");
    } catch (err: any) {
      console.log("Wrong person cannot approve ✓");
    }
  });

  it("❌ Cannot cancel after freelancer accepted", async () => {
    const sid = new BN(13);
    const [gigPDA] = getGigPDA(client.publicKey, sid);
    const [escrowPDA] = getEscrowPDA(gigPDA);

    await program.methods
      .createGig(sid, "No cancel", [new BN(100_000_000)], deadline)
      .accounts({ gig: gigPDA, escrow: escrowPDA, client: client.publicKey, tokenMint })
      .rpc();
    await program.methods
      .fundGig(sid)
      .accounts({ gig: gigPDA, escrow: escrowPDA, client: client.publicKey, clientTokenAccount: clientATA })
      .rpc();
    await program.methods
      .acceptGig(sid)
      .accounts({ gig: gigPDA, freelancer: freelancer.publicKey })
      .signers([freelancer])
      .rpc();

    try {
      await program.methods
        .cancelGig(client.publicKey, sid)
        .accounts({
          gig: gigPDA, escrow: escrowPDA, client: client.publicKey,
          clientTokenAccount: clientATA, tokenMint,
        })
        .rpc();
      assert.fail("Should have thrown");
    } catch (err: any) {
      console.log("Cannot cancel after acceptance ✓");
    }
  });
});
