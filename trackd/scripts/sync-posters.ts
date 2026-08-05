/**
 * Build-time poster + metadata sync.
 *
 *   npm run sync:posters
 *
 * Writes src/data/posters.json, which the app imports directly. Nothing is
 * fetched from a third party at runtime, so there is no API key in the browser
 * bundle, no rate limiting, and no hotlinking of images we are not allowed to use.
 *
 * Sources:
 *   anime         -> AniList GraphQL (keyless; covers licensed for API use)
 *   movie / series-> TMDB when TMDB_API_KEY is set (see .env.example)
 *   series        -> TVMaze as a keyless fallback
 *
 * TMDB requires this attribution, which the app renders in its footer:
 *   "This product uses the TMDB API but is not endorsed or certified by TMDB."
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { CATALOG } from '../src/data/catalog'
import type { Title } from '../src/data/catalog'

const HERE = dirname(fileURLToPath(import.meta.url))
// Wikimedia asks that its image servers not be hotlinked, so anything sourced
// from there is downloaded into public/posters/ and served from our own domain.
const UA = 'trackd-poster-sync/1.0 (https://github.com/dedfish101/portfolio)'

export interface PosterEntry {
  image?: string
  synopsis?: string
  extScore?: string
  meta?: [string, string][]
  link?: string
  linkLabel?: string
}

// Pick up TMDB_API_KEY from .env.local so the key stays on your machine and never
// has to be passed on the command line (where it would land in shell history).
try { process.loadEnvFile(resolve(HERE, '../.env.local')) } catch { /* no local env */ }

const TMDB_KEY = process.env.TMDB_API_KEY ?? ''
const TMDB_IMG = 'https://image.tmdb.org/t/p/w500'
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))
const strip = (s: string) => s.replace(/<[^>]*>/g, '').trim()

function trim(s: string, max = 620): string {
  const clean = s.trim()
  if (clean.length <= max) return clean
  const cut = clean.slice(0, max)
  const end = cut.lastIndexOf('. ')
  return end > 200 ? cut.slice(0, end + 1) : cut + '…'
}

function tmdbHeaders(): Record<string, string> {
  // v4 read tokens are JWTs and go in the Authorization header; v3 keys go in the query.
  return TMDB_KEY.startsWith('eyJ') ? { Authorization: `Bearer ${TMDB_KEY}` } : {}
}

function tmdbUrl(path: string, params: Record<string, string>): string {
  const u = new URL(`https://api.themoviedb.org/3${path}`)
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v)
  if (!TMDB_KEY.startsWith('eyJ')) u.searchParams.set('api_key', TMDB_KEY)
  return u.toString()
}

/* eslint-disable @typescript-eslint/no-explicit-any */
async function fromTmdb(t: Title): Promise<PosterEntry | null> {
  if (!TMDB_KEY) return null
  const kind = t.type === 'series' ? 'tv' : 'movie'
  const res = await fetch(
    tmdbUrl(`/search/${kind}`, { query: t.search ?? t.name, include_adult: 'false' }),
    { headers: tmdbHeaders() },
  )
  if (!res.ok) throw new Error(`TMDB ${res.status} for ${t.name}`)
  const json: any = await res.json()
  const results: any[] = json.results ?? []
  if (!results.length) return null

  const yearOf = (r: any) => Number((r.release_date ?? r.first_air_date ?? '').slice(0, 4))
  const hit =
    results.find(r => Math.abs(yearOf(r) - t.year) <= 1 && r.poster_path) ??
    results.find(r => r.poster_path) ??
    results[0]
  if (!hit?.poster_path) return null

  const meta: [string, string][] = []
  const date = hit.release_date ?? hit.first_air_date
  if (date) meta.push([kind === 'tv' ? 'First aired' : 'Released', date])
  if (hit.original_language) meta.push(['Language', String(hit.original_language).toUpperCase()])
  if (hit.vote_count) meta.push(['TMDB votes', String(hit.vote_count)])

  return {
    image: TMDB_IMG + hit.poster_path,
    synopsis: hit.overview ? trim(hit.overview) : undefined,
    extScore: hit.vote_average ? `TMDB ★ ${Number(hit.vote_average).toFixed(1)}` : undefined,
    meta,
    link: `https://www.themoviedb.org/${kind}/${hit.id}`,
    linkLabel: 'TMDB',
  }
}

async function fromAniList(t: Title): Promise<PosterEntry | null> {
  const res = await fetch('https://graphql.anilist.co', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      query: `query($search:String){Media(search:$search,type:ANIME){
        title{romaji english} coverImage{extraLarge large} description(asHtml:false)
        averageScore episodes format status siteUrl studios(isMain:true){nodes{name}}
      }}`,
      variables: { search: t.search ?? t.name },
    }),
  })
  if (!res.ok) throw new Error(`AniList ${res.status} for ${t.name}`)
  const json: any = await res.json()
  const m = json.data?.Media
  if (!m?.coverImage) return null

  const meta: [string, string][] = []
  if (m.studios?.nodes?.length) meta.push(['Studio', m.studios.nodes.map((s: any) => s.name).join(', ')])
  if (m.format) meta.push(['Format', String(m.format).replaceAll('_', ' ')])
  if (m.status) meta.push(['Status', String(m.status).replaceAll('_', ' ').toLowerCase()])
  if (m.episodes) meta.push(['Episodes', String(m.episodes)])

  return {
    image: m.coverImage.extraLarge ?? m.coverImage.large,
    synopsis: m.description ? trim(strip(String(m.description).replace(/<br\s*\/?>/g, ' '))) : undefined,
    extScore: m.averageScore ? `AniList ★ ${(m.averageScore / 10).toFixed(1)}` : undefined,
    meta,
    link: m.siteUrl,
    linkLabel: 'AniList',
  }
}

/**
 * Keyless movie fallback. Wikipedia's REST summary endpoint exposes the article's
 * lead image, which for films is the theatrical poster — unlike the Action API's
 * pageimages, which omits non-free media.
 */
async function fromWikipedia(t: Title): Promise<PosterEntry | null> {
  const pages = [t.wiki ?? t.name, `${t.name} (film)`]
  for (const page of pages) {
    const url = 'https://en.wikipedia.org/api/rest_v1/page/summary/' +
      encodeURIComponent(page.replaceAll(' ', '_'))
    const res = await fetch(url, { headers: { 'User-Agent': UA } })
    if (!res.ok) continue
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    const d: any = await res.json()
    const image = d.thumbnail?.source ?? d.originalimage?.source
    if (!image) continue
    return {
      image,
      synopsis: d.extract ? trim(d.extract) : undefined,
      meta: [],
      link: d.content_urls?.desktop?.page,
      linkLabel: 'Wikipedia',
    }
  }
  return null
}

/** Mirrors Wikimedia-hosted art locally; other CDNs are fine to link directly. */
async function localize(id: string, url: string): Promise<string> {
  if (!url.includes('upload.wikimedia.org')) return url
  const res = await fetch(url, { headers: { 'User-Agent': UA } })
  if (!res.ok) return url
  const raw = (url.split('?')[0].split('.').pop() ?? 'jpg').toLowerCase()
  const ext = ['jpg', 'jpeg', 'png', 'webp'].includes(raw) ? raw : 'jpg'
  const dir = resolve(HERE, '../public/posters')
  mkdirSync(dir, { recursive: true })
  writeFileSync(resolve(dir, `${id}.${ext}`), Buffer.from(await res.arrayBuffer()))
  return `/posters/${id}.${ext}`
}

async function fromTvMaze(t: Title): Promise<PosterEntry | null> {
  const res = await fetch(`https://api.tvmaze.com/singlesearch/shows?q=${encodeURIComponent(t.search ?? t.name)}`)
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`TVMaze ${res.status} for ${t.name}`)
  const show: any = await res.json()
  if (!show?.image) return null

  const meta: [string, string][] = []
  const network = show.network?.name ?? show.webChannel?.name
  if (network) meta.push(['Network', network])
  if (show.premiered) meta.push(['Premiered', show.premiered])
  if (show.status) meta.push(['Status', show.status])

  return {
    image: show.image.original ?? show.image.medium,
    synopsis: show.summary ? trim(strip(show.summary)) : undefined,
    extScore: show.rating?.average ? `TVMaze ★ ${show.rating.average}` : undefined,
    meta,
    link: show.url,
    linkLabel: 'TVMaze',
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

async function resolveTitle(t: Title): Promise<PosterEntry | null> {
  const chain =
    t.type === 'anime'
      ? [fromAniList, fromTmdb]
      : t.type === 'series'
        ? [fromTmdb, fromTvMaze, fromWikipedia]
        : [fromTmdb, fromWikipedia]
  for (const fn of chain) {
    try {
      const got = await fn(t)
      if (got?.image) {
        got.image = await localize(t.id, got.image)
        return got
      }
    } catch (e) {
      console.warn(`  ! ${t.name}: ${(e as Error).message}`)
    }
  }
  return null
}

async function main() {
  if (!TMDB_KEY) {
    console.warn('TMDB_API_KEY not set — using keyless sources (AniList / TVMaze / Wikipedia).')
    console.warn('Set the key for higher-quality art and richer metadata on films.\n')
  }

  const out: Record<string, PosterEntry> = {}
  let ok = 0
  const missing: string[] = []

  for (const t of CATALOG) {
    const entry = await resolveTitle(t)
    if (entry) {
      out[t.id] = entry
      ok++
      console.log(`  ✓ ${t.name} — ${entry.linkLabel}`)
    } else {
      missing.push(t.name)
      console.log(`  · ${t.name} — no poster`)
    }
    await sleep(t.type === 'anime' ? 400 : 120)
  }

  const dest = resolve(HERE, '../src/data/posters.json')
  writeFileSync(dest, JSON.stringify(out, null, 1) + '\n')

  console.log(`\n${ok}/${CATALOG.length} titles resolved -> src/data/posters.json`)
  if (missing.length) console.log(`No poster for: ${missing.join(', ')}`)
}

await main()
