import { NextRequest, NextResponse } from "next/server";
import { dbGetMessages, dbAddMessage } from "@/lib/db";
import { limits, getClientIP } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  const gigPda = req.nextUrl.searchParams.get("gigPda");
  if (!gigPda) {
    return NextResponse.json({ error: "gigPda required" }, { status: 400 });
  }

  const messages = dbGetMessages(gigPda);
  return NextResponse.json(messages.map((m: any) => ({
    id: m.id,
    gigPda: m.gig_pda,
    sender: m.sender,
    message: m.message,
    timestamp: m.created_at,
  })));
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { gigPda, sender, message } = body;

    // Rate limit
    const rl = limits.message(getClientIP(req));
    if (!rl.allowed) {
      return NextResponse.json(
        { error: `Rate limited. Try again in ${Math.ceil(rl.resetIn / 1000)}s.` },
        { status: 429 }
      );
    }

    if (!gigPda || !sender || !message?.trim()) {
      return NextResponse.json({ error: "gigPda, sender, message required" }, { status: 400 });
    }

    if (message.length > 1000) {
      return NextResponse.json({ error: "Message too long (max 1000 chars)" }, { status: 400 });
    }

    const chatMsg = dbAddMessage(gigPda, sender, message.trim());
    return NextResponse.json(chatMsg);
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to send" },
      { status: 500 }
    );
  }
}
