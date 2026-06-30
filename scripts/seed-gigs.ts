/**
 * Seed script: creates dummy gigs on devnet for testing/demo.
 * Run: npx ts-node --esm scripts/seed-gigs.ts
 * Or:  bun run scripts/seed-gigs.ts
 */
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { Program, AnchorProvider, BN, Wallet, Idl } from "@coral-xyz/anchor";
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import * as fs from "fs";
import * as path from "path";

// Config
const RPC = "https://api.devnet.solana.com";
const PROGRAM_ID = new PublicKey("2UFrdXwUEDtr5uXsVrCYuvnGoaESQM9UqVVovEYmsAY4");
const TOKEN_MINT = new PublicKey("5ZpAiCXV9kgRm5Sa8755cJ9YYwuJtgZdZEKY1a5zPyYV");
const KEYPAIR_PATH = `${process.env.HOME}/.config/solana/id.json`;
const IDL_PATH = path.resolve(__dirname, "../src/lib/idl/gigsafe_protocol.json");

// Dummy gigs to create
const DUMMY_GIGS = [
  {
    title: "Build a DeFi Dashboard",
    milestones: [500, 1200, 500, 300], // in token units (human-readable)
    deadlineDays: 30,
  },
  {
    title: "Design NFT Collection (50 pcs)",
    milestones: [400, 400, 400],
    deadlineDays: 25,
  },
  {
    title: "Solana Smart Contract Audit",
    milestones: [2500, 2500],
    deadlineDays: 20,
  },
  {
    title: "Landing Page + Branding Kit",
    milestones: [600, 800, 400],
    deadlineDays: 14,
  },
  {
    title: "Technical Blog Posts (5 articles)",
    milestones: [100, 100, 100, 100, 100],
    deadlineDays: 35,
  },
];

function deriveGigPDA(client: PublicKey, gigId: BN): [PublicKey, number] {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64LE(BigInt(gigId.toString()));
  return PublicKey.findProgramAddressSync(
    [Buffer.from("gig"), client.toBuffer(), buf],
    PROGRAM_ID
  );
}

async function main() {
  // Load keypair
  const raw = JSON.parse(fs.readFileSync(KEYPAIR_PATH, "utf-8"));
  const keypair = Keypair.fromSecretKey(Uint8Array.from(raw));
  console.log(`Wallet: ${keypair.publicKey.toBase58()}`);

  // Setup
  const connection = new Connection(RPC, "confirmed");
  const wallet = new Wallet(keypair);
  const provider = new AnchorProvider(connection, wallet, { commitment: "confirmed" });
  const idl = JSON.parse(fs.readFileSync(IDL_PATH, "utf-8")) as Idl;
  const program = new Program(idl, provider);

  // Ensure ATA exists for the token
  const clientAta = await getAssociatedTokenAddress(TOKEN_MINT, keypair.publicKey);
  const ataInfo = await connection.getAccountInfo(clientAta);
  if (!ataInfo) {
    console.log("Creating ATA for client...");
    const { Transaction } = await import("@solana/web3.js");
    const tx = new Transaction().add(
      createAssociatedTokenAccountInstruction(keypair.publicKey, clientAta, keypair.publicKey, TOKEN_MINT)
    );
    await provider.sendAndConfirm(tx);
  }

  const balance = await connection.getTokenAccountBalance(clientAta);
  console.log(`Token balance: ${balance.value.uiAmountString}`);

  const decimals = 6;

  for (let i = 0; i < DUMMY_GIGS.length; i++) {
    const gig = DUMMY_GIGS[i];
    const gigId = new BN(Date.now() + i * 1000);
    const milestoneAmounts = gig.milestones.map((m) => new BN(m * 10 ** decimals));
    const deadline = new BN(Math.floor(Date.now() / 1000) + gig.deadlineDays * 86400);

    console.log(`\n--- Creating gig ${i + 1}: "${gig.title}" ---`);
    console.log(`  GigID: ${gigId.toString()}`);
    console.log(`  Budget: ${gig.milestones.reduce((a, b) => a + b, 0)} tokens`);
    console.log(`  Milestones: ${gig.milestones.length}`);

    try {
      // Create gig
      const [gigPda] = deriveGigPDA(keypair.publicKey, gigId);
      console.log(`  PDA: ${gigPda.toBase58()}`);

      const createTx = await (program.methods as any)
        .createGig(gigId, gig.title, milestoneAmounts, deadline)
        .accounts({ tokenMint: TOKEN_MINT })
        .rpc();
      console.log(`  ✅ Created: ${createTx}`);

      // Fund gig
      const fundTx = await (program.methods as any)
        .fundGig(gigId)
        .rpc();
      console.log(`  ✅ Funded: ${fundTx}`);
    } catch (err: any) {
      console.error(`  ❌ Error: ${err.message || err}`);
    }

    // Small delay to avoid rate limits
    await new Promise((r) => setTimeout(r, 2000));
  }

  console.log("\n🎉 Done seeding gigs!");
}

main().catch(console.error);
