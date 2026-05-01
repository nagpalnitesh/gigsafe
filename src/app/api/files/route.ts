import { NextRequest, NextResponse } from "next/server";
import { dbGetFiles } from "@/lib/db";

export async function GET(req: NextRequest) {
  const gigPda = req.nextUrl.searchParams.get("gigPda");

  if (!gigPda) {
    return NextResponse.json({ error: "gigPda required" }, { status: 400 });
  }

  const files = dbGetFiles(gigPda);
  return NextResponse.json(files.map((f: any) => ({
    filename: f.filename,
    originalName: f.original_name,
    size: f.size,
    type: f.type,
    url: f.url,
    milestoneIndex: f.milestone_index,
    uploadedAt: f.created_at,
  })));
}
