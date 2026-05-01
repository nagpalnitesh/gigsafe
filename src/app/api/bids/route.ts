import { NextRequest, NextResponse } from "next/server";
import { dbGetBids, dbSubmitBid, dbUpdateBidStatus, dbGetBidsByBidder } from "@/lib/db";
import { limits, getClientIP } from "@/lib/rate-limit";

// GET /api/bids?gigPda=xxx — get bids for a gig
// GET /api/bids?bidder=xxx — get bids by a bidder
export async function GET(req: NextRequest) {
  const gigPda = req.nextUrl.searchParams.get("gigPda");
  const bidder = req.nextUrl.searchParams.get("bidder");

  if (gigPda) {
    const bids = dbGetBids(gigPda);
    return NextResponse.json(bids.map((b: any) => ({
      id: b.id,
      gigPda: b.gig_pda,
      bidder: b.bidder,
      amount: b.amount,
      message: b.message,
      status: b.status,
      createdAt: b.created_at,
    })));
  }

  if (bidder) {
    const bids = dbGetBidsByBidder(bidder);
    return NextResponse.json(bids.map((b: any) => ({
      id: b.id,
      gigPda: b.gig_pda,
      bidder: b.bidder,
      amount: b.amount,
      message: b.message,
      status: b.status,
      createdAt: b.created_at,
    })));
  }

  return NextResponse.json({ error: "gigPda or bidder required" }, { status: 400 });
}

// POST /api/bids — submit or update bid
export async function POST(req: NextRequest) {
  try {
    const rl = limits.write(getClientIP(req));
    if (!rl.allowed) {
      return NextResponse.json(
        { error: `Rate limited. Try again in ${Math.ceil(rl.resetIn / 1000)}s.` },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { action } = body;

    // Update bid status (accept/reject)
    if (action === "update_status") {
      const { gigPda, bidder, status } = body;
      if (!gigPda || !bidder || !["accepted", "rejected", "withdrawn"].includes(status)) {
        return NextResponse.json({ error: "Invalid request" }, { status: 400 });
      }
      dbUpdateBidStatus(gigPda, bidder, status);
      return NextResponse.json({ success: true });
    }

    // Submit bid
    const { gigPda, bidder, amount, message } = body;
    if (!gigPda || !bidder || !amount || amount <= 0) {
      return NextResponse.json({ error: "gigPda, bidder, amount required" }, { status: 400 });
    }
    if (message && message.length > 500) {
      return NextResponse.json({ error: "Message too long (max 500)" }, { status: 400 });
    }

    dbSubmitBid(gigPda, bidder, parseFloat(amount), message);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 500 }
    );
  }
}
