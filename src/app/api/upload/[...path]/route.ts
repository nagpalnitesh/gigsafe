import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");

const MIME_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".pdf": "application/pdf",
  ".zip": "application/zip",
  ".txt": "text/plain",
  ".md": "text/markdown",
  ".json": "application/json",
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: segments } = await params;
    if (!segments || segments.length < 2) {
      return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    }

    // Sanitize: prevent directory traversal
    const sanitized = segments.map((s) => s.replace(/[^a-zA-Z0-9._-]/g, ""));
    const filePath = path.join(UPLOAD_DIR, ...sanitized);

    // Security: ensure path is within upload dir
    if (!filePath.startsWith(UPLOAD_DIR)) {
      return NextResponse.json({ error: "Invalid path" }, { status: 403 });
    }

    if (!existsSync(filePath)) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const buffer = await readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (err: unknown) {
    console.error("File serve error:", err);
    return NextResponse.json({ error: "Failed to serve file" }, { status: 500 });
  }
}
