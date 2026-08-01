/**
 * Import CTF write-up notes from an Obsidian vault into content/writeups/.
 *
 * The vault stores notes as flat `.md` files and images in a separate
 * `image archive/` folder (Obsidian resolves `![[name.png]]` vault-wide).
 * This script turns each note into a self-contained folder note:
 *
 *   content/writeups/<slug>/index.md      (+ generated frontmatter)
 *   content/writeups/<slug>/<image>.png   (copied next to the note)
 *
 * so the site's asset route can serve images relative to each note — no
 * dependency on the vault at runtime. Re-run it whenever you add write-ups.
 *
 *   node scripts/import-vault.mjs ["/path/to/vault/ctf writeups"]
 */
import fs from "node:fs";
import path from "node:path";

const VAULT_ROOT = "/home/dedfish/Documents/heven  15-2-25";
const SRC =
  process.argv[2] || path.join(VAULT_ROOT, "ctf writeups");
const OUT = path.join(process.cwd(), "content", "writeups");

// Folders inside SRC we don't treat as publishable notes.
const SKIP_DIRS = new Set(["image archive", "incomplete", ".obsidian"]);

/**
 * Best-effort difficulty per box (HTB/THM), keyed by slug. These are inferred —
 * correct any of them here or in the note's frontmatter. Unmapped boxes render
 * without a badge.
 */
const DIFFICULTY = {
  cap: "Easy",
  cyborg: "Easy",
  gamingserver: "Easy",
  lazyadmin: "Easy",
  ignite: "Easy",
  "chill-hack": "Easy",
  "brooklyn-nine-nine": "Easy",
  "chocolate-factory": "Easy",
  startup: "Easy",
  wonderland: "Medium",
  relevant: "Medium",
  convertmyvideo: "Medium",
  "sector-21": "Medium",
  monitorsfour: "Medium",
  pterodactyl: "Medium",
  red: "Hard",
};

/* ---------- helpers ---------------------------------------------------- */

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function smartTitle(name) {
  // Keep intentional camel-case single words (GamingServer, MonitorsFour).
  if (/[A-Z]/.test(name) && !name.includes(" ")) return name;
  return name.replace(/\b\w/g, (c) => c.toUpperCase());
}

function isoDate(d) {
  return new Date(d).toISOString().slice(0, 10);
}

/** Index every file in the vault by basename for `![[embed]]` resolution. */
function buildImageIndex(root) {
  const index = new Map();
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === ".obsidian" || entry.name === ".git") continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (!index.has(entry.name)) index.set(entry.name, full);
    }
  };
  walk(root);
  return index;
}

/** Light tag inference from the note body + platform detection. */
function inferTags(body) {
  const t = body.toLowerCase();
  const tags = [];
  const add = (x) => !tags.includes(x) && tags.push(x);

  if (/hackthebox|app\.hackthebox|10\.129\./.test(t)) add("hackthebox");
  else if (/tryhackme|10\.10\.\d/.test(t)) add("tryhackme");

  if (/windows|evil-winrm|\.exe\b|administrator|smbclient|impacket/.test(t))
    add("windows");
  else if (/ssh|\/etc\/passwd|bash|ubuntu|\bsudo\b/.test(t)) add("linux");

  if (/http|nginx|apache|wordpress|\bsqli\b|\bxss\b|\bphp\b|burp|lfi|rce/.test(t))
    add("web");
  if (/privilege escalation|sudo -l|\bsuid\b|privesc|cron|capabilit/.test(t))
    add("privesc");

  if (tags.length === 0) add("ctf");
  return tags.slice(0, 4);
}

/** Collect image references (wikilink + standard) from a note. */
function findImages(body) {
  const refs = new Set();
  for (const m of body.matchAll(/!\[\[([^\]|]+?)(?:\|[^\]]*)?\]\]/g)) {
    refs.add(m[1].trim());
  }
  for (const m of body.matchAll(/!\[[^\]]*\]\(\s*<?([^)>\s]+)>?[^)]*\)/g)) {
    const url = m[1];
    if (!/^(https?:)?\/\//i.test(url) && !url.startsWith("data:"))
      refs.add(decodeURIComponent(url.replace(/^\.\//, "")));
  }
  return [...refs];
}

/* ---------- main ------------------------------------------------------- */

if (!fs.existsSync(SRC)) {
  console.error(`✗ source not found: ${SRC}`);
  process.exit(1);
}

const imageIndex = buildImageIndex(VAULT_ROOT);

// content/writeups is generated from the vault — start clean.
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

const notes = fs
  .readdirSync(SRC, { withFileTypes: true })
  .filter((e) => e.isFile() && e.name.endsWith(".md"))
  .map((e) => e.name);

let imported = 0;
const missing = [];

for (const file of notes) {
  const abs = path.join(SRC, file);
  const base = file.replace(/\.md$/, "");
  const body = fs.readFileSync(abs, "utf8").trim();

  if (body.length < 40) {
    console.log(`· skip (stub): ${file}`);
    continue;
  }

  const slug = slugify(base);
  const dir = path.join(OUT, slug);
  fs.mkdirSync(dir, { recursive: true });

  // Copy referenced images next to the note (keep original basenames).
  for (const ref of findImages(body)) {
    const name = path.basename(ref);
    const source = imageIndex.get(name);
    if (source && fs.existsSync(source)) {
      fs.copyFileSync(source, path.join(dir, name));
    } else {
      missing.push(`${file} → ${name}`);
    }
  }

  const fmLines = [
    "---",
    `title: ${JSON.stringify(smartTitle(base))}`,
    `date: ${isoDate(fs.statSync(abs).mtime)}`,
    `slug: ${slug}`,
    `tags: [${inferTags(body).join(", ")}]`,
  ];
  if (DIFFICULTY[slug]) fmLines.push(`difficulty: ${DIFFICULTY[slug]}`);
  fmLines.push("---", "");
  const frontmatter = fmLines.join("\n");

  fs.writeFileSync(path.join(dir, "index.md"), frontmatter + body + "\n");
  imported += 1;
  console.log(`✓ ${slug}`);
}

console.log(`\nImported ${imported} write-up(s) → ${path.relative(process.cwd(), OUT)}`);
if (missing.length) {
  console.log(`\n⚠ ${missing.length} image(s) not found in vault:`);
  for (const m of missing) console.log(`  - ${m}`);
}
