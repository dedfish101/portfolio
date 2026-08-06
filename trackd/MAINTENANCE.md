# track'd — operations & maintenance guide

Everything needed to run, change, debug and hand off this project.
Last verified: 6 August 2026.

---

## 1. Where everything lives

| Thing | Location |
|---|---|
| **Source code** | `/home/dedfish/wind/portfolio/trackd` (a subfolder of your Next.js portfolio repo) |
| **Git remote** | `git@github.com:dedfish101/portfolio.git` |
| **Branch** | `favicon-and-dev-origins` — **not yet merged to `main`** |
| **Database + auth** | Supabase project `trackd`, ref `tjfjbkikdqjsmjujnczn` |
| **Supabase org** | `DotingArc995612's Org` (`lupqarhgefxockdyssbn`) |
| **Region** | `ap-northeast-2` (Seoul) — cannot be changed after creation |
| **API URL** | `https://tjfjbkikdqjsmjujnczn.supabase.co` |
| **Dashboard** | <https://supabase.com/dashboard/project/tjfjbkikdqjsmjujnczn> |
| **Hosting** | Vercel — **not deployed yet** |
| **Poster images** | `public/posters/` (16 files, 1.8 MB, committed to git) |

There is a second, unrelated Supabase project in the same org
(`DotingArc995612's Project`, paused). track'd does not touch it.

### Keys

Both Supabase values are **publishable** — they are designed to ship in a browser
bundle and are safe to commit. Every table is protected by Row Level Security, so
they grant nothing beyond what an anonymous visitor may do.

```
VITE_SUPABASE_URL=https://tjfjbkikdqjsmjujnczn.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_QbTkFPnWjKPDAgHjudtMeA_WQZhvmL4
```

`TMDB_API_KEY` is **not** publishable. It stays server-side (`.env.local` locally,
Vercel environment variables in production) and is never bundled.

The Supabase **service role key** is not used anywhere in this project. Never put
it in client code — it bypasses all RLS.

---

## 2. Running it locally

```sh
cd /home/dedfish/wind/portfolio/trackd
npm install
cp .env.example .env.local      # values are already correct
npm run dev                     # http://localhost:5173
```

| Command | What it does |
|---|---|
| `npm run dev` | Vite dev server, includes the `/api/tmdb` proxy middleware |
| `npm run build` | Typecheck (`tsc -b`) then production build to `dist/` |
| `npm run preview` | Serve the built `dist/` locally |
| `npm run lint` | oxlint |
| `npm run sync:posters` | Refresh bundled poster art (see §7) |

The 6 lint warnings are cosmetic React-fast-refresh notes about files exporting
both components and helpers. They do not affect the build.

---

## 3. How it works

### Shape of the app

A single-page React app. **Nothing is server-rendered.** The browser talks
directly to Supabase's REST API; Row Level Security — not application code — is
what keeps users out of each other's data.

```
Browser (React SPA)
   ├── supabase-js  ──►  Supabase Postgres + Auth   (all user data)
   ├── fetch        ──►  AniList / TVMaze           (live search, keyless)
   └── fetch        ──►  /api/tmdb  ──►  TMDB       (films; key stays server-side)
```

### Two kinds of title, one interface

This is the single most important concept in the codebase.

- **Bundled titles** — the original 42, hardcoded in `src/data/catalog.ts`, with
  poster art baked into `src/data/posters.json`. Ids are bare words: `frieren`.
- **Live titles** — anything found by search. Ids are namespaced by provider:
  `anilist:9253`, `tvmaze:41007`, `tmdb:movie:27205`.

`src/lib/media.ts` hides the difference behind one type, `MediaItem`, and one
resolver, `resolveMedia(id)`, which checks in order: bundled catalogue → `media`
table → live provider call. Everything in the UI consumes `MediaItem` and does
not care where a title came from.

**Why bundled titles still exist:** your existing lists, the 12 seeded reviews and
the 2 title-linked forum threads all reference bare ids. Keeping the resolver
backwards-compatible means none of that had to be migrated or lost.

### The `media` table

When someone tracks a live title, a snapshot of it is written to `media` so that
lists, the dashboard and recommendations can render later without re-querying
AniList or TMDB.

It is **insert-only from the client**. Every user reads the same row, so an
`UPDATE` grant would let one account rewrite a title's name or poster for
everybody. First writer wins; rows are immutable from the browser.

### File map

| File | Responsibility |
|---|---|
| `src/lib/supabase.ts` | Client construction, DB row types, error humanising |
| `src/lib/store.tsx` | Auth session, profile, prefs, and the user's lists. The one global context |
| `src/lib/media.ts` | `MediaItem`, provider adapters, search, resolve, cache |
| `src/lib/community.ts` | Reviews / threads / posts — loaded per page, not globally |
| `src/lib/recommend.ts` | Taste profile and ranking, including the reroll |
| `src/lib/posters.ts` | Reads the build-time `posters.json` |
| `src/components/ui.tsx` | Poster, TitleCard, QuickStatus, StatusPicker, Stars |
| `src/components/charts.tsx` | Dependency-free SVG charts + the validated palette |
| `src/components/Auth.tsx` | Sign-in modal and the `require()` gate |
| `src/components/Toast.tsx` | Global notifications |
| `api/tmdb.ts` | Vercel edge function proxying TMDB |
| `vite.config.ts` | Mirrors that proxy during `npm run dev` |
| `scripts/sync-posters.ts` | Build-time poster fetcher |

### Data flow when someone tracks a title

1. `QuickStatus` checks `requireAuth()` — opens the sign-in modal if signed out.
2. `cacheMedia(item)` inserts the snapshot into `media` (no-op if already known).
3. `setStatus()` upserts a row in `entries`.
4. Local state updates only *after* the write succeeds, so the UI never lies.

---

## 4. Database

11 migrations applied, all via the Supabase MCP connector. Current tables:

| Table | Rows | Holds |
|---|---|---|
| `profiles` | 18 | 2 real accounts + 16 seeded community members |
| `entries` | 5 | One row per (user, title): status, rating, favourite |
| `reviews` | 12 | Seeded reviews |
| `review_helpful` | 0 | Helpful votes |
| `threads` | 8 | Forum threads |
| `posts` | 20 | Forum posts |
| `post_likes` | 0 | Post likes |
| `media` | 0 | Cache of live titles — fills as people track things |

### Security model — read this before changing grants

Four rules the schema depends on:

1. **RLS is on for every table.** Public content is world-readable; writes are
   restricted to the owning account.
2. **`UPDATE` is granted column-by-column, never table-wide.** A table-level
   `UPDATE` grant covers *every* column, including counters. This was a real bug:
   users could set `helpful_count` on their own review to 99999. Column grants are
   the fix — `REVOKE UPDATE (col)` does **not** work against a table-level grant.
3. **Counters are trigger-maintained** (`helpful_count`, `like_count`,
   `post_count`, `last_post_at`) and not client-writable.
4. **Trigger functions live in the private `internal` schema**, so PostgREST
   cannot expose them as `/rpc/` endpoints.

`entries.user_id`, `review_helpful.user_id` and `post_likes.user_id` default to
`auth.uid()`, so clients never state who they are and cannot get it wrong.

### Profiles are decoupled from auth

`profiles.user_id` is nullable. The 16 seeded community members have no login —
that is how the site launched with real discussion instead of empty boards. A
database trigger (`internal.handle_new_user`) creates a profile on signup with a
unique username derived from the email local part.

### Check security after any schema change

Use the Supabase MCP `get_advisors` tool, or the dashboard's Advisors tab. It
catches missing RLS, exposed functions and similar. Currently one open warning:
**leaked-password protection is disabled** — enable it under Authentication →
Policies.

---

## 5. Deploying

Not deployed yet. To do it:

1. **Merge or point Vercel at the branch.** Vercel builds `main` by default; the
   code is currently on `favicon-and-dev-origins`.
2. Import `dedfish101/portfolio` into Vercel.
3. Set **Root Directory** to `trackd` — critical, or Vercel builds the Next.js
   portfolio instead.
4. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `TMDB_API_KEY` (optional; enables film search)
5. Deploy. `vercel.json` rewrites non-asset routes to `index.html` so client-side
   routing survives a refresh.
6. In Supabase → Authentication → URL Configuration, set **Site URL** to the
   Vercel domain so auth emails and redirects point at the right place.

---

## 6. Routine maintenance

### Turn off email confirmation (do this first)

Currently **ON**, and it has already stranded one of the existing accounts —
never confirmed, so it has never been able to sign in. Supabase's built-in mailer
only sends 2–3 messages per hour, which is not enough for real signups.

> Supabase → Authentication → Sign In / Providers → Email → **Confirm email: off**

For production later, connect SMTP (Resend's free tier is 3,000/month) and turn
confirmation back on.

### Keep the database awake

**Free Supabase projects pause after ~7 days with no activity.** Your other
project is paused for exactly this reason. If track'd sleeps, the site breaks
until you hit *Restore* in the dashboard. Real traffic prevents it; otherwise a
free uptime pinger hitting the site daily will do.

### Moderating content

There is **no moderation UI yet**. To remove abusive content, use the Supabase
SQL editor:

```sql
-- see recent posts with their authors
select p.id, pr.username, p.body, p.created_at
from posts p join profiles pr on pr.id = p.author_id
order by p.created_at desc limit 50;

delete from posts   where id = '<post-uuid>';
delete from threads where id = '<thread-uuid>';   -- cascades to its posts
delete from reviews where id = '<review-uuid>';

-- ban an account entirely (cascades to all their content)
delete from auth.users where email = '<address>';
```

### Common queries

```sql
-- growth
select count(*) from auth.users;
select date_trunc('day', created_at) d, count(*) from auth.users group by d order by d;

-- most tracked titles
select title_id, count(*) c from entries group by title_id order by c desc limit 20;

-- how big the live-title cache has grown
select type, count(*) from media group by type;
```

---

## 7. Poster art

`npm run sync:posters` refreshes `src/data/posters.json` for the **bundled 42
only** — live search titles carry their own poster URLs and need no sync.

Sources: AniList (anime), TMDB then TVMaze (series), TMDB then Wikipedia (films).
Wikimedia asks that its image servers not be hotlinked, so anything sourced from
Wikipedia is downloaded into `public/posters/` and served from your own domain.

With a TMDB key in `.env.local` the script picks it up automatically and produces
better film art. Commit both `src/data/posters.json` and any new
`public/posters/*` files afterwards.

---

## 8. Troubleshooting

| Symptom | Cause and fix |
|---|---|
| Signup appears to work but the user can never sign in | Email confirmation is on. See §6 |
| Everything 500s / site suddenly dead | Free project paused after 7 idle days. Restore in the dashboard |
| Films return no search results | No `TMDB_API_KEY` on the server. Anime and series are unaffected |
| "permission denied for table X" on a write | A column-level grant is missing. See §4 rule 2 |
| A write silently does nothing | Supabase **returns** errors rather than throwing. Always check `{ error }` — this exact bug hid a failure in `cacheMedia` |
| Routes 404 after refresh in production | `vercel.json` rewrites missing, or Root Directory not set to `trackd` |
| Parent portfolio build fails | `trackd` must stay in the root `tsconfig.json` `exclude` array |

---

## 9. Known gaps

Honest list of what is not done:

- **Recommendations only draw from the bundled 42.** Titles added via live search
  do not yet influence or appear in For You. The `media` table now makes this
  fixable.
- **No moderation tooling** — no reporting, blocking, or admin view. Do this
  before promoting the site publicly.
- **No public profile pages.** `/u/:username` is linked by the dashboard's share
  button but the route does not exist yet. `profiles` and `entries` are already
  world-readable, so it is mostly UI work.
- **No rate limiting** on posting beyond Supabase defaults.
- **No tests.** Verification so far has been manual, driven through the browser
  and the REST API.
- Vercel's Hobby tier is **non-commercial** — monetising requires Pro ($20/mo).

---

## 10. Starting a fresh chat about this project

Paste this into a new conversation:

> I'm working on **track'd**, a movie/series/anime tracker with real user accounts.
>
> - Code: `/home/dedfish/wind/portfolio/trackd` — a Vite + React + TypeScript SPA
>   inside my Next.js portfolio repo (`github.com/dedfish101/portfolio`), on branch
>   `favicon-and-dev-origins`.
> - Backend: Supabase project `trackd`, ref `tjfjbkikdqjsmjujnczn`. Postgres + Auth
>   with Row Level Security on every table.
> - Hosting: intended for Vercel with Root Directory `trackd`. Not deployed yet.
> - Read `trackd/MAINTENANCE.md` first — it documents the architecture, the
>   security model, and the known gaps.
>
> Key things to know: titles come from two places — 42 bundled ones in
> `src/data/catalog.ts` with bare ids, and live search results from
> AniList/TVMaze/TMDB with namespaced ids like `anilist:9253`. `src/lib/media.ts`
> unifies both. `UPDATE` grants are deliberately column-by-column, never
> table-wide. Films need `TMDB_API_KEY` server-side; anime and series are keyless.
>
> [then say what you want to work on]

If the assistant has the Supabase connector authorised it can inspect and migrate
the database directly. Ask it to run `get_advisors` after any schema change.
