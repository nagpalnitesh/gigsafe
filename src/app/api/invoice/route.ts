import { NextRequest, NextResponse } from "next/server";
import { dbGetMetadata, dbGetProfile } from "@/lib/db";

/**
 * GET /api/invoice?gigPda=xxx&format=json
 * 
 * Generates invoice data for a completed gig.
 * Frontend renders this as a downloadable receipt.
 */
export async function GET(req: NextRequest) {
  const gigPda = req.nextUrl.searchParams.get("gigPda");
  const gigTitle = req.nextUrl.searchParams.get("title") ?? "Untitled Gig";
  const clientWallet = req.nextUrl.searchParams.get("client") ?? "";
  const freelancerWallet = req.nextUrl.searchParams.get("freelancer") ?? "";
  const totalBudget = req.nextUrl.searchParams.get("budget") ?? "0";
  const releasedAmount = req.nextUrl.searchParams.get("released") ?? "0";
  const status = req.nextUrl.searchParams.get("status") ?? "Unknown";
  const createdAt = req.nextUrl.searchParams.get("createdAt") ?? "";

  if (!gigPda) {
    return NextResponse.json({ error: "gigPda required" }, { status: 400 });
  }

  // Fetch metadata and profiles
  const metadata = dbGetMetadata(gigPda);
  const clientProfile = clientWallet ? dbGetProfile(clientWallet) : null;
  const freelancerProfile = freelancerWallet ? dbGetProfile(freelancerWallet) : null;

  const platformFee = parseFloat(totalBudget) * 0.005; // 0.5%
  const invoiceNumber = `GS-${gigPda.slice(0, 8).toUpperCase()}`;

  const invoice = {
    invoiceNumber,
    date: new Date().toISOString(),
    gigPda,
    gigTitle,
    description: metadata?.description ?? "",
    category: metadata?.category ?? "",
    
    client: {
      wallet: clientWallet,
      name: clientProfile?.displayName ?? `${clientWallet.slice(0, 4)}...${clientWallet.slice(-4)}`,
    },
    freelancer: {
      wallet: freelancerWallet,
      name: freelancerProfile?.displayName ?? `${freelancerWallet.slice(0, 4)}...${freelancerWallet.slice(-4)}`,
    },

    milestones: (metadata?.milestoneNames ?? []).map((name: string, i: number) => ({
      index: i,
      name,
    })),

    financial: {
      totalBudget: parseFloat(totalBudget),
      releasedAmount: parseFloat(releasedAmount),
      platformFee: Math.round(platformFee * 100) / 100,
      freelancerReceived: parseFloat(releasedAmount) - platformFee,
      currency: "USDC",
      network: "Solana (Devnet)",
    },

    status,
    createdAt: createdAt ? new Date(parseInt(createdAt) * 1000).toISOString() : "",
    
    verification: {
      programId: "2UFrdXwUEDtr5uXsVrCYuvnGoaESQM9UqVVovEYmsAY4",
      explorerUrl: `https://explorer.solana.com/address/${gigPda}?cluster=devnet`,
    },
  };

  return NextResponse.json(invoice);
}
