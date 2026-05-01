import { NextRequest, NextResponse } from "next/server";
import { dbGetNotifications, dbAddNotification, dbMarkNotificationsRead, dbGetUnreadCount } from "@/lib/db";

export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get("wallet");
  const unreadOnly = req.nextUrl.searchParams.get("unread");

  if (!wallet) {
    return NextResponse.json({ error: "wallet required" }, { status: 400 });
  }

  if (unreadOnly) {
    const count = dbGetUnreadCount(wallet);
    return NextResponse.json({ unread: count });
  }

  const notifs = dbGetNotifications(wallet);
  return NextResponse.json(notifs.map((n: any) => ({
    id: n.id,
    wallet: n.wallet,
    type: n.type,
    title: n.title,
    message: n.message,
    gigPda: n.gig_pda,
    gigTitle: n.gig_title,
    read: !!n.read,
    createdAt: n.created_at,
  })));
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === "mark_read") {
      const { wallet, ids } = body;
      if (!wallet) return NextResponse.json({ error: "wallet required" }, { status: 400 });
      dbMarkNotificationsRead(wallet, ids);
      return NextResponse.json({ success: true });
    }

    const { wallet, type, title, message, gigPda, gigTitle } = body;
    if (!wallet || !type || !title || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    dbAddNotification(wallet, { type, title, message, gigPda, gigTitle });
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 500 }
    );
  }
}
