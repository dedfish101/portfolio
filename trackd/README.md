# track'd

A movie, series & anime tracker with real user accounts, a recommendation engine, reviews, and community forums.

**Stack:** React + TypeScript + Vite (frontend) · Supabase (Postgres, Auth, Row Level Security) · Vercel (hosting).
Runs on the free tier of both — **$0/month** at this scale.

> **Maintaining or handing this off?** See [MAINTENANCE.md](MAINTENANCE.md) for the
> architecture, security model, operational runbook and known gaps.

## Run locally

```sh
npm install
cp .env.example .env.local   # values are publishable; safe as-is
npm run dev
```

## Features

- **Accounts** — email + password signup. A profile row is created automatically by a
  database trigger, with a unique username derived from the email address.
- **Track everything** — Watching / Completed / Plan to Watch / Dropped, 1–10 ratings, favourites.
- **One-click list control** — every card has a status button and favourite toggle underneath.
  Logged-out visitors get a sign-in prompt instead of a silent failure.
- **Profile** — editable username, bio and avatar; stats (completed, mean score, hours watched),
  genre breakdown, list tabs, and an activity feed.
- **Recommendation engine** (`src/lib/recommend.ts`) — content-based. Builds a genre/tag/type taste
  vector from your ratings, statuses and favourites (dropped titles count against a genre,
  favourites count double), blends a community-score prior, and explains every pick.
- **Reviews** — one per user per title, with spoiler covers and helpful votes.
- **Forums** — General / Recommendations / Upcoming boards plus per-title discussion threads.
- **Content preferences** — hide anime, movies or series site-wide, stored per account.

## Catalogue — live search

Search hits real catalogues, not a fixed list:

| Type | Provider | Key needed? |
|---|---|---|
| Anime | AniList GraphQL | No |
| Series | TVMaze | No |
| Movies | TMDB | **Yes** |

Title ids are namespaced by provider (`anilist:9253`, `tvmaze:41007`, `tmdb:movie:27205`).
Bare ids such as `frieren` are the original bundled catalogue, still resolved client-side so
existing lists, reviews and threads keep working.

When a title is first tracked, a snapshot is written to the `media` table so lists, dashboards
and recommendations can read it without re-querying providers. That table is **insert-only from
the client** — allowing updates would let one account rewrite a title's name or poster for
everyone.

TMDB is reached through `/api/tmdb` (a Vercel edge function, mirrored by a Vite dev middleware),
so `TMDB_API_KEY` stays server-side and responses are edge-cached for a day. Without the key,
anime and series search fully and the UI says films are unavailable.

## Architecture notes

Only user-generated content lives in Postgres.

**Every table has Row Level Security.** Public content is world-readable; writes are restricted to
the owning account. Vote and post counters are maintained by database triggers and are **not**
updatable by clients — `UPDATE` is granted column-by-column, because a table-level grant would
cover every column and let users inflate their own counts.

Trigger functions live in a private `internal` schema so PostgREST cannot expose them as
`/rpc/` endpoints.

## Posters

`npm run sync:posters` fetches poster art and metadata **once, at build time**, and writes
`src/data/posters.json`, which is committed. Nothing is fetched from a third party at runtime:
no API key reaches the browser, no rate limits, no hotlinking.

| Type | Source |
|---|---|
| Anime | AniList (keyless) |
| Series | TMDB, falling back to TVMaze (keyless) |
| Movies | TMDB — **requires `TMDB_API_KEY`** |

Without a TMDB key, anime and series resolve and movies fall back to generated gradient cards.
To complete them, get a free key at <https://www.themoviedb.org/settings/api>, then:

```sh
TMDB_API_KEY=your_key npm run sync:posters
```

TMDB requires the attribution rendered in the app footer.

## Deploying

Hosted on Vercel with **Root Directory** set to `trackd`. Set these environment variables in the
Vercel project (both are publishable, protected by RLS):

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

`vercel.json` rewrites all non-asset routes to `index.html` so client-side routing works on refresh.
