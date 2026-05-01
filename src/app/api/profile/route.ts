import { NextRequest, NextResponse } from "next/server";
import { dbGetProfile, dbSaveProfile } from "@/lib/db";

export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get("wallet");
  if (!wallet) {
    return NextResponse.json({ error: "wallet required" }, { status: 400 });
  }

  const profile = dbGetProfile(wallet);
  return NextResponse.json(profile ?? { wallet });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { wallet, displayName, bio, avatar, skills, twitter, github, website } = body;

    if (!wallet) {
      return NextResponse.json({ error: "wallet required" }, { status: 400 });
    }
    if (displayName && displayName.length > 50) {
      return NextResponse.json({ error: "Display name too long (max 50)" }, { status: 400 });
    }
    if (bio && bio.length > 280) {
      return NextResponse.json({ error: "Bio too long (max 280)" }, { status: 400 });
    }
    if (skills && skills.length > 10) {
      return NextResponse.json({ error: "Max 10 skills" }, { status: 400 });
    }

    dbSaveProfile(wallet, { displayName, bio, avatar, skills, twitter, github, website });
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to save" },
      { status: 500 }
    );
  }
}
