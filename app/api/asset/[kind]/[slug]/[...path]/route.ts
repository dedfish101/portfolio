import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { getDir, type Kind } from "@/lib/content";

const MIME: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".svg": "image/svg+xml",
  ".bmp": "image/bmp",
};

/** Streams note-local images for either collection: /api/asset/<kind>/<slug>/<path> */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ kind: string; slug: string; path: string[] }> },
) {
  const { kind, slug, path: segments } = await params;
  if (kind !== "writeup" && kind !== "note") {
    return new NextResponse("Bad kind", { status: 400 });
  }

  const baseDir = getDir(kind as Kind, slug);
  if (!baseDir) return new NextResponse("Not found", { status: 404 });

  const rel = segments.map((s) => decodeURIComponent(s)).join("/");
  const target = path.resolve(baseDir, rel);

  // Prevent path traversal outside the note's own directory.
  const root = path.resolve(baseDir);
  if (target !== root && !target.startsWith(root + path.sep)) {
    return new NextResponse("Forbidden", { status: 403 });
  }
  if (!fs.existsSync(target) || !fs.statSync(target).isFile()) {
    return new NextResponse("Not found", { status: 404 });
  }

  const ext = path.extname(target).toLowerCase();
  return new NextResponse(fs.readFileSync(target), {
    status: 200,
    headers: {
      "Content-Type": MIME[ext] ?? "application/octet-stream",
      "Cache-Control": "public, max-age=3600, must-revalidate",
    },
  });
}
