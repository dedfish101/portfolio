import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

/** The two markdown collections, each backed by its own folder. */
export type Kind = "writeup" | "note";

export const DIRS: Record<Kind, string> = {
  writeup: path.join(process.cwd(), "content", "writeups"),
  note: path.join(process.cwd(), "content", "notes"),
};

export type Difficulty = "Easy" | "Medium" | "Hard" | "Insane";

export type DocMeta = {
  title: string;
  date: string; // ISO string
  tags: string[];
  slug: string;
  summary?: string;
  difficulty?: Difficulty;
};

export type Doc = {
  kind: Kind;
  meta: DocMeta;
  content: string; // raw markdown body (no frontmatter)
  /** Directory that images in this note are resolved relative to. */
  dir: string;
  filePath: string;
};

type Entry = { slug: string; filePath: string; dir: string };

/**
 * A post is either:
 *   <dir>/<slug>.md
 *   <dir>/<slug>/index.md   (Obsidian-style folder note)
 * Images are always resolved relative to the note's own directory.
 */
function resolveEntries(kind: Kind): Entry[] {
  const root = DIRS[kind];
  if (!fs.existsSync(root)) return [];

  const entries: Entry[] = [];
  for (const name of fs.readdirSync(root)) {
    const full = path.join(root, name);
    const stat = fs.statSync(full);

    if (stat.isDirectory()) {
      const index = path.join(full, "index.md");
      if (fs.existsSync(index)) entries.push({ slug: name, filePath: index, dir: full });
    } else if (name.endsWith(".md")) {
      entries.push({ slug: name.replace(/\.md$/, ""), filePath: full, dir: root });
    }
  }
  return entries;
}

function readDoc(kind: Kind, entry: Entry): Doc {
  const raw = fs.readFileSync(entry.filePath, "utf8");
  const { data, content } = matter(raw);

  const slug = String(data.slug ?? entry.slug);
  const meta: DocMeta = {
    title: String(data.title ?? slug),
    date: normalizeDate(data.date),
    tags: normalizeTags(data.tags),
    slug,
    summary: data.summary ? String(data.summary) : undefined,
    difficulty: normalizeDifficulty(data.difficulty),
  };
  return { kind, meta, content, dir: entry.dir, filePath: entry.filePath };
}

function normalizeDate(value: unknown): string {
  if (!value) return "";
  const d = new Date(value as string);
  return Number.isNaN(d.getTime()) ? String(value) : d.toISOString();
}

function normalizeDifficulty(value: unknown): Difficulty | undefined {
  if (typeof value !== "string") return undefined;
  const map: Record<string, Difficulty> = {
    easy: "Easy",
    medium: "Medium",
    hard: "Hard",
    insane: "Insane",
  };
  return map[value.trim().toLowerCase()];
}

function normalizeTags(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((t) => String(t).replace(/^#/, ""));
  if (typeof value === "string") {
    return value
      .split(/[,\s]+/)
      .map((t) => t.replace(/^#/, "").trim())
      .filter(Boolean);
  }
  return [];
}

/** All posts in a collection, newest first. */
export function getAll(kind: Kind): Doc[] {
  return resolveEntries(kind)
    .map((e) => readDoc(kind, e))
    .sort((a, b) => (a.meta.date < b.meta.date ? 1 : -1));
}

export function getSlugs(kind: Kind): string[] {
  return resolveEntries(kind).map((e) => e.slug);
}

export function getBySlug(kind: Kind, slug: string): Doc | null {
  const match = resolveEntries(kind).find((e) => e.slug === slug);
  if (match) return readDoc(kind, match);
  return getAll(kind).find((d) => d.meta.slug === slug) ?? null;
}

/** On-disk directory for a slug (used by the asset route). */
export function getDir(kind: Kind, slug: string): string | null {
  const match = resolveEntries(kind).find((e) => e.slug === slug);
  if (match) return match.dir;
  return getBySlug(kind, slug)?.dir ?? null;
}
