# portfolio + ctf / notes viewer

Ultra-light Next.js (App Router) site that reads plain Markdown / Obsidian
notes from **two** folders — `content/writeups/` (CTF write-ups) and
`content/notes/` (security notes) — and shows them in a slick overlay modal.
Clean, framed, warm-gray aesthetic with charcoal terminal blocks, single-screen
layout, and a tiny canvas Tetris for fun.

No database, no CMS. Drop in a `.md` file, it appears.

## Stack

- **Next.js 15** (App Router, React Server Components)
- **Tailwind CSS 3** — design tokens in [`tailwind.config.ts`](tailwind.config.ts)
- **gray-matter** — frontmatter parsing
- **react-markdown** + **remark-gfm** — markdown rendering

`react-markdown` (plain remark/rehype) is used rather than MDX because these
are hand-written Obsidian notes: they contain stray `<...>` and `{...}` that an
MDX/JSX parser would choke on. react-markdown renders them safely.

Syntax highlighting is a lightweight custom code block (dark `#111` card + copy
button) to avoid pulling in a full highlighter. To add real tokenization later,
add `rehype-highlight` to the `rehypePlugins` prop of the `<ReactMarkdown>` in
[`components/WriteupContent.tsx`](components/WriteupContent.tsx).

## Run

```bash
npm install
npm run dev      # http://localhost:3000
npm run build && npm start
```

## Folder structure

```
app/
  layout.tsx                     # root html/body
  page.tsx                       # single-screen home; renders ?writeup= / ?note= modal
  not-found.tsx
  writeups/[slug]/page.tsx       # standalone write-up page (direct load / SEO)
  api/asset/[kind]/[slug]/[...path]/route.ts   # streams note-local images (both kinds)

components/
  Taskbar.tsx         # minimal status bar: OS · STATUS · live UTC clock · theme toggle
  ThemeToggle.tsx     # dark/light switch (flips .dark on <html>, persists)
  TerminalCard.tsx    # left-top terminal: whoami + skills + cert + contact CTA
  KnowledgeBase.tsx   # left-bottom: dual-tab writeups/notes list (custom scroll)
  Sidebar.tsx         # right column: media · music · game · footer (stacked)
  MediaBox.tsx        #   sidebar media image (site.mediaSrc)
  MusicPlayer.tsx     #   lofi player: waveform seek bar + play/next, autoplay
  BlockGame.tsx       #   <canvas> monochrome Tetris (arrow keys)
  ActionFooter.tsx    #   Resume PDF button + icon-only social row
  SocialIcons.tsx     # inline SVG marks (github/linkedin/x/tryhackme)
  DifficultyPill.tsx  # [Easy]/[Medium]/[Hard] badge
  WriteupContent.tsx  # shared renderer (header + markdown body + footer)
  Modal.tsx           # blurred backdrop sheet (Esc / click-out / × to close)
  CodeBlock.tsx       # charcoal code block + copy button
  CopyButton.tsx
  WriteupFooter.tsx   # "copy link" / "copy md" quick actions
  mdx-components.tsx  # react-markdown element overrides

lib/
  content.ts    # read/parse/sort both collections (writeup | note)
  mdx.ts        # Obsidian image preprocessing (see below)
  site.ts       # name, bio, links, media src, lofi tracks — edit this

content/writeups/    # <-- CTF write-ups (.md) live here
content/notes/       # <-- security notes (.md) live here
public/gif.jpg       # <-- sidebar media image (site.mediaSrc)
public/audio/*.mp3   # <-- lofi tracks (listed in site.tracks)
public/resume.pdf    # <-- replace the placeholder with your resume
```

## Importing from an Obsidian vault

`content/writeups/` is **generated** from an Obsidian vault by
[`scripts/import-vault.mjs`](scripts/import-vault.mjs). It reads flat `.md`
notes, resolves each `![[Pasted image …]]` embed against the whole vault (images
are copied next to the note), and generates frontmatter (title from the
filename, date from mtime, tags inferred from the body — platform/OS/web/privesc).

```bash
npm run import                       # uses the default vault path
node scripts/import-vault.mjs "/path/to/vault/ctf writeups"   # or pass one
```

The default vault path is set at the top of the script — edit `VAULT_ROOT` /
`SRC` there if your vault moves. Notes shorter than ~40 chars and the
`incomplete/` drafts folder are skipped. Re-run any time you add write-ups.

## Adding a write-up manually

If you're not importing from a vault, either form works:

- `content/writeups/my-slug.md` — a flat file, or
- `content/writeups/my-slug/index.md` — an Obsidian-style folder note with its
  images sitting alongside it.

Frontmatter:

```markdown
---
title: "Cap"
date: 2026-05-02
slug: cap                    # optional; defaults to the filename/folder name
tags: [hackthebox, linux, web, privesc]
difficulty: Easy             # optional; Easy | Medium | Hard | Insane → list badge
summary: "One-line teaser."  # optional
---
```

`difficulty` (when present, write-ups only) renders a colour-coded `[Easy]` /
`[Medium]` / `[Hard]` badge; notes fall back to their first `[tag]`. The importer
seeds difficulty from a per-box map; edit that map or the note's frontmatter.

Persona copy — name, bio, skills, certification, resume link, and the social
links (GitHub / LinkedIn / TryHackMe / X) — all live in
[`lib/site.ts`](lib/site.ts).

Both lists auto-sort newest-first and number entries `03 | 02 | 01`.

## Two collections + dual tabs

`content/writeups/` and `content/notes/` are read by the same generic parser
([`lib/content.ts`](lib/content.ts), keyed by `kind: "writeup" | "note"`). The
[`KnowledgeBase`](components/KnowledgeBase.tsx) component toggles between them
with `[ CTF Writeups ]` / `[ Cyber Notes ]` tabs. Three sample notes ship in
`content/notes/`; replace them with your own. (The Obsidian importer only touches
write-ups — security notes often contain client findings, so nothing there is
auto-published.)

## Images (Obsidian-friendly)

Images live next to the note and are served through a route handler — no build
step, no copying into `public/`. Both dialects are rewritten automatically
([`lib/mdx.ts`](lib/mdx.ts)):

```markdown
![[board-annotated.svg]]           <- Obsidian embed
![[shot.png|a caption]]            <- Obsidian embed with alt text
![alt](./diagram.png)              <- relative standard markdown
![alt](attachments/photo.jpg)      <- relative subfolder
```

…all become `/api/asset/<kind>/<slug>/<path>` (kind = `writeup` or `note`).
Absolute URLs (`https://…`, `data:`) and root-relative `/…` paths in `public/`
are left untouched. The route resolves paths strictly inside the note's own
directory (path traversal → 403).

## Asymmetrical single-screen layout

Warm cream backdrop (`#ebeae7`), a centered white card with a thin `#e5e5e5`
border, charcoal accent panels. The home page is `h-screen` / `overflow-hidden`
on desktop — the **outer page never scrolls**.

The content is a **65 / 35 grid** (`lg:grid-cols-[65fr_35fr]` in
[`page.tsx`](app/page.tsx)):

- **Left (65%)** — [`TerminalCard`](components/TerminalCard.tsx) on top, then
  [`KnowledgeBase`](components/KnowledgeBase.tsx) filling the rest. Only the list
  scrolls, in its own region with a custom scrollbar (`.scrollbar-custom` in
  [`globals.css`](app/globals.css)).
- **Right (35%)** — [`Sidebar`](components/Sidebar.tsx) stacks media → music →
  game → footer; the game flexes to absorb leftover height.

On mobile the grid collapses to one column and the card's content area scrolls,
so nothing is cut off. The [`Taskbar`](components/Taskbar.tsx) shows
`OS: Linux · STATUS: OPTIMAL · UTC clock`; the clock is real.

## Dark theme

The toggle lives at the right of the [`Taskbar`](components/Taskbar.tsx). Every
colour is a semantic token backed by a CSS variable (defined in
[`globals.css`](app/globals.css) under `:root` and `.dark`), so flipping the
`.dark` class on `<html>` swaps the whole palette at once — no per-component
`dark:` variants. Tokens are R G B triplets so Tailwind opacity modifiers
(`text-ink/70`) still work. `ink` is the primary foreground (dark→light), while
`accent` is the charcoal button surface (stays dark in both themes).

The choice persists to `localStorage`; a tiny inline script in
[`layout.tsx`](app/layout.tsx) applies it (or the OS `prefers-color-scheme`)
before first paint to avoid a flash. The toggle briefly adds a `theme-switching`
class that disables transitions during the swap, so var-driven colours repaint
instantly instead of freezing mid-transition.

## Lofi music player

[`MusicPlayer`](components/MusicPlayer.tsx) is a dependency-free player over one
`<audio>` element. The charcoal **waveform doubles as the seek bar** (played bars
fill in, click to scrub); controls are prev / play-pause / next. It **attempts
autoplay** on mount and, when the browser blocks audible autoplay, starts on the
first user gesture. Tracks are listed in [`site.tracks`](lib/site.ts) — drop the
`.mp3` files in `public/audio/`. (Files ship absent, so the player is silent
until you add them; `preload="none"` keeps it from fetching early.)

## Media box + resume/socials

[`MediaBox`](components/MediaBox.tsx) shows `site.mediaSrc` (`/gif.jpg`).
[`ActionFooter`](components/ActionFooter.tsx) is the `View / Download Resume PDF`
button → `/resume.pdf` plus an **icon-only** social row (crisp inline SVGs from
[`SocialIcons`](components/SocialIcons.tsx)). `public/resume.pdf` ships as a
**placeholder** — replace it with your resume.

## Mini-game

[`BlockGame`](components/BlockGame.tsx) is a self-contained `<canvas>` Tetris
(10×16 grid, grayscale blocks on `#111`). No libraries. Click / Tab to focus,
then `← → move · ↑ rotate · ↓ soft-drop · space start/hard-drop · P pause`.
Arrow keys are captured only while the canvas is focused (they never scroll the
page), the canvas scales to fit short viewports, and it pauses when the tab is
hidden.

## Modal behaviour (`?writeup=slug` / `?note=slug`)

The home route is dynamic (`export const dynamic = "force-dynamic"`) and renders
the modal **on the server** from the query param:

- click a list item → `<Link href="/?writeup=slug" scroll={false}>` (or `?note=`)
  → client-side navigation updates the URL and swaps in the server-rendered
  modal, **no full reload**, list scroll preserved;
- refresh / shared link → the modal renders directly from the server;
- the standalone `/writeups/<slug>` page still exists for SEO;
- `Esc`, backdrop click, or the × button → `router.push("/", { scroll: false })`.
# portfolio
