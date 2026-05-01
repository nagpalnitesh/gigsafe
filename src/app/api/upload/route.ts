import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { existsSync } from "fs";
import { dbAddFile } from "@/lib/db";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  "image/png", "image/jpeg", "image/gif", "image/webp",
  "application/pdf",
  "application/zip", "application/x-zip-compressed",
  "text/plain", "text/markdown",
  "application/json",
];

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const gigPda = formData.get("gigPda") as string | null;
    const milestoneIndex = formData.get("milestoneIndex") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (!gigPda) {
      return NextResponse.json({ error: "gigPda is required" }, { status: 400 });
    }

    // Validate size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 });
    }

    // Validate type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `File type not allowed: ${file.type}` },
        { status: 400 }
      );
    }

    // Create gig-specific upload directory
    const gigDir = path.join(UPLOAD_DIR, gigPda);
    if (!existsSync(gigDir)) {
      await mkdir(gigDir, { recursive: true });
    }

    // Generate safe filename
    const ext = path.extname(file.name) || "";
    const timestamp = Date.now();
    const safeFilename = `ms${milestoneIndex ?? "x"}_${timestamp}${ext}`;
    const filePath = path.join(gigDir, safeFilename);

    // Write file
    const bytes = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(bytes));

    const fileRef = {
      filename: safeFilename,
      originalName: file.name,
      size: file.size,
      type: file.type,
      url: `/api/upload/${gigPda}/${safeFilename}`,
      milestoneIndex: milestoneIndex ? parseInt(milestoneIndex) : 0,
      uploadedAt: Date.now(),
    };

    // Persist file reference to database
    dbAddFile(gigPda, fileRef);

    return NextResponse.json(fileRef);
  } catch (err: unknown) {
    console.error("Upload error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload failed" },
      { status: 500 }
    );
  }
}
