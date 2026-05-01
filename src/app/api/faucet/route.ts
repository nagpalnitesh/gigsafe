import { NextRequest, NextResponse } from "next/server";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import {
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from "@solana/spl-token";
import fs from "fs";
import path from "path";

const USDC_MINT = new PublicKey("AM1TfNi6rFnGH2evzyxV7eCu1LnJRdrYDG9kq3mhpXhf");
const RPC = "https://api.devnet.solana.com";
const MAX_AMOUNT = 10000; // Max 10,000 USDC per request
const DECIMALS = 6;

// Rate limit: simple in-memory tracker
const rateLimits = new Map<string, number>();
const RATE_LIMIT_MS = 30_000; // 30 seconds between requests

function getMintAuthority(): Keypair {
  const keyPath = path.join(
    process.env.HOME || "/home/ubuntu",
    ".config/solana/id.json"
  );
  const raw = JSON.parse(fs.readFileSync(keyPath, "utf-8"));
  return Keypair.fromSecretKey(Uint8Array.from(raw));
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { wallet, amount = 1000 } = body;

    if (!wallet) {
      return NextResponse.json({ error: "wallet is required" }, { status: 400 });
    }

    let recipient: PublicKey;
    try {
      recipient = new PublicKey(wallet);
    } catch {
      return NextResponse.json({ error: "Invalid wallet address" }, { status: 400 });
    }

    if (amount <= 0 || amount > MAX_AMOUNT) {
      return NextResponse.json(
        { error: `Amount must be 1-${MAX_AMOUNT}` },
        { status: 400 }
      );
    }

    // Rate limit check
    const lastRequest = rateLimits.get(wallet);
    if (lastRequest && Date.now() - lastRequest < RATE_LIMIT_MS) {
      const waitSec = Math.ceil((RATE_LIMIT_MS - (Date.now() - lastRequest)) / 1000);
      return NextResponse.json(
        { error: `Rate limited. Try again in ${waitSec}s` },
        { status: 429 }
      );
    }
    rateLimits.set(wallet, Date.now());

    const connection = new Connection(RPC, "confirmed");
    const authority = getMintAuthority();

    // Get or create ATA for recipient
    const ata = await getOrCreateAssociatedTokenAccount(
      connection,
      authority,
      USDC_MINT,
      recipient
    );

    // Mint tokens
    const mintAmount = BigInt(amount) * BigInt(10 ** DECIMALS);
    const signature = await mintTo(
      connection,
      authority,
      USDC_MINT,
      ata.address,
      authority,
      mintAmount
    );

    return NextResponse.json({
      signature,
      amount,
      token: "USDC (devnet)",
      mint: USDC_MINT.toString(),
      recipient: wallet,
      ata: ata.address.toString(),
    });
  } catch (err: unknown) {
    console.error("Faucet error:", err);
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
