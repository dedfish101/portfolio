#!/usr/bin/env node
/**
 * Turn a source image into the site's favicon set.
 *
 *   node scripts/make-favicon.mjs path/to/image.png
 *
 * Writes app/favicon.ico (16/32/48) and app/icon.png (180px, also used as the
 * Apple touch icon). Next.js picks both up automatically and serves them with a
 * content hash, so browsers don't cling to a stale cached favicon.
 *
 * Pixel art: uses nearest-neighbour ("point") scaling so blocks stay sharp
 * instead of turning to mush, and auto-trims uniform padding around the subject
 * so it fills the tab instead of floating in a tiny island.
 *
 * Requires ImageMagick (`magick`).
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";

const src = process.argv[2];
const KEEP_BG = process.argv.includes("--keep-bg"); // skip transparency conversion

if (!src || !existsSync(src)) {
  console.error("usage: node scripts/make-favicon.mjs <image> [--keep-bg]");
  console.error("  --keep-bg   keep the source background instead of making it transparent");
  process.exit(1);
}

const app = path.join(process.cwd(), "app");
mkdirSync(app, { recursive: true });

const run = (args) => execFileSync("magick", args, { stdio: "inherit" });

// 1. Trim uniform padding, then pad back a small even margin so the art isn't
//    flush against the edge. -fuzz absorbs near-black/near-white noise.
const trimmed = path.join(app, ".favicon-src.png");
run([
  src,
  "-fuzz", "8%",
  "-trim", "+repage",
  "-bordercolor", "none",
  "-border", "6%",
  "-background", "none",
  "-gravity", "center",
  "-extent", "100%x100%",
  trimmed,
]);

// 2. Multi-resolution .ico. "point" filter keeps pixel art crisp.
run([
  trimmed,
  "-filter", "point",
  "-background", "none",
  "-define", "icon:auto-resize=16,32,48",
  path.join(app, "favicon.ico"),
]);

// 3. 180px PNG for high-DPI tabs / mobile home-screen icons.
run([
  trimmed,
  "-filter", "point",
  "-background", "none",
  "-resize", "180x180",
  path.join(app, "icon.png"),
]);

rmSync(trimmed, { force: true }); // don't leave the intermediate in app/

console.log("\n✓ wrote app/favicon.ico and app/icon.png");
console.log("  Restart the dev server, then hard-refresh (Ctrl+Shift+R).");
if (!KEEP_BG) {
  console.log("  Tip: pass --keep-bg if you wanted the original backdrop kept.");
}
