import { NextRequest, NextResponse } from "next/server";
import { dbGetMetadata, dbSaveMetadata, dbGetAllMetadata } from "@/lib/db";

export async function GET(req: NextRequest) {
  const gigPda = req.nextUrl.searchParams.get("gigPda");
  
  if (gigPda) {
    const meta = dbGetMetadata(gigPda);
    return NextResponse.json(meta ?? {});
  }
  
  const all = dbGetAllMetadata();
  return NextResponse.json(all);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { gigPda, description, milestoneNames, category, createdBy } = body;
    
    if (!gigPda) {
      return NextResponse.json({ error: "gigPda required" }, { status: 400 });
    }
    
    dbSaveMetadata(gigPda, { description, milestoneNames, category, createdBy });
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to save" },
      { status: 500 }
    );
  }
}
