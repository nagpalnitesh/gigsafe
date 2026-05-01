import { NextRequest, NextResponse } from "next/server";
import { dbGetReputation, dbSubmitReview, dbHasReviewed } from "@/lib/db";

export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get("wallet");
  const gigPda = req.nextUrl.searchParams.get("gigPda");
  const reviewer = req.nextUrl.searchParams.get("reviewer");

  if (!wallet) {
    return NextResponse.json({ error: "wallet required" }, { status: 400 });
  }

  if (gigPda && reviewer) {
    const reviewed = dbHasReviewed(wallet, gigPda, reviewer);
    return NextResponse.json({ hasReviewed: reviewed });
  }

  const rep = dbGetReputation(wallet);
  return NextResponse.json(rep);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { walletAddress, review } = body;

    if (!walletAddress || !review || !review.gigPda || !review.reviewer || !review.rating) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (review.rating < 1 || review.rating > 5) {
      return NextResponse.json({ error: "Rating must be 1-5" }, { status: 400 });
    }

    dbSubmitReview(walletAddress, {
      gigPda: review.gigPda,
      gigTitle: review.gigTitle ?? "",
      reviewer: review.reviewer,
      reviewerRole: review.reviewerRole ?? "client",
      rating: review.rating,
      comment: review.comment ?? "",
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to save" },
      { status: 500 }
    );
  }
}
