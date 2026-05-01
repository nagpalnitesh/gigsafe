import { NextRequest, NextResponse } from "next/server";
import { dbGetActivityFeed, dbAddActivity } from "@/lib/db";

// GET /api/activity — get platform activity feed
export async function GET(req: NextRequest) {
  const limit = parseInt(req.nextUrl.searchParams.get("limit") ?? "30");
  const feed = dbGetActivityFeed(Math.min(limit, 100));
  
  return NextResponse.json(feed.map((a: any) => ({
    id: a.id,
    type: a.type,
    title: a.title,
    description: a.description,
    gigPda: a.gig_pda,
    gigTitle: a.gig_title,
    actor: a.actor,
    amount: a.amount,
    createdAt: a.created_at,
  })));
}

// POST /api/activity — log an activity (called internally)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, title, description, gigPda, gigTitle, actor, amount } = body;

    if (!type || !title) {
      return NextResponse.json({ error: "type and title required" }, { status: 400 });
    }

    dbAddActivity({ type, title, description, gigPda, gigTitle, actor, amount });
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 500 }
    );
  }
}
