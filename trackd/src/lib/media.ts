import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import { byId as staticById, CATALOG } from '../data/catalog'
import type { MediaType, Title } from '../data/catalog'
import { posterFor } from './posters'

/**
 * A title from any catalogue, in one shape.
 *
 * Ids are namespaced by provider — `anilist:9253`, `tvmaze:41007`,
 * `tmdb:movie:27205`. Bare ids such as `frieren` are the original bundled
 * catalogue, kept working so existing lists, reviews and threads never break.
 */
export interface MediaItem {
  id: string
  name: string
  type: MediaType
  year: number
  genres: string[]
  tags: string[]
  synopsis: string
  score: number
  members: number
  status: 'released' | 'upcoming'
  releaseDate?: string
  episodes?: number
  runtime?: number
  creator: string
  poster?: string
  palette: number
  source: string
  sourceUrl?: string
}

/** Stable pseudo-random palette index so cards without art still look distinct. */
export function paletteFor(id: string): number {
  let h = 2166136261
  for (let i = 0; i < id.length; i++) { h ^= id.charCodeAt(i); h = Math.imul(h, 16777619) }
  return (h >>> 0) % 37
}

export function fromStatic(t: Title): MediaItem {
  return { ...t, poster: posterFor(t.id)?.image, source: 'catalog' }
}

export const STATIC_MEDIA: MediaItem[] = CATALOG.map(fromStatic)

const thisYear = new Date().getFullYear()
const strip = (s: string) => s.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
const clamp = (s: string, n = 700) => (s.length <= n ? s : s.slice(0, n).replace(/\s+\S*$/, '') + '…')

/* ------------------------------------------------------------------ AniList */
/* eslint-disable @typescript-eslint/no-explicit-any */

const ANILIST_QUERY = `
query($s:String,$page:Int){
  Page(page:$page,perPage:20){
    media(search:$s,type:ANIME,sort:SEARCH_MATCH,isAdult:false){
      id title{english romaji} startDate{year} status format episodes duration
      averageScore popularity genres description(asHtml:false)
      coverImage{extraLarge large} siteUrl studios(isMain:true){nodes{name}}
    }
  }
}`

function mapAniList(m: any): MediaItem {
  const id = `anilist:${m.id}`
  return {
    id,
    name: m.title?.english ?? m.title?.romaji ?? 'Untitled',
    type: 'anime',
    year: m.startDate?.year ?? 0,
    genres: m.genres ?? [],
    tags: m.format ? [String(m.format).toLowerCase()] : [],
    synopsis: m.description ? clamp(strip(String(m.description).replace(/<br\s*\/?>/g, ' '))) : '',
    score: m.averageScore ? m.averageScore / 10 : 0,
    members: m.popularity ?? 0,
    status: m.status === 'NOT_YET_RELEASED' ? 'upcoming' : 'released',
    episodes: m.episodes ?? undefined,
    runtime: m.format === 'MOVIE' ? (m.duration ?? undefined) : undefined,
    creator: m.studios?.nodes?.[0]?.name ?? 'Unknown studio',
    poster: m.coverImage?.extraLarge ?? m.coverImage?.large,
    palette: paletteFor(id),
    source: 'AniList',
    sourceUrl: m.siteUrl,
  }
}

async function searchAniList(q: string): Promise<MediaItem[]> {
  const res = await fetch('https://graphql.anilist.co', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ query: ANILIST_QUERY, variables: { s: q, page: 1 } }),
  })
  if (!res.ok) throw new Error(`AniList ${res.status}`)
  const json = await res.json()
  return (json.data?.Page?.media ?? []).map(mapAniList)
}

async function getAniList(numericId: string): Promise<MediaItem | null> {
  const res = await fetch('https://graphql.anilist.co', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      query: ANILIST_QUERY.replace('search:$s,type:ANIME,sort:SEARCH_MATCH,isAdult:false', 'id:$id')
        .replace('$s:String', '$id:Int'),
      variables: { id: Number(numericId), page: 1 },
    }),
  })
  if (!res.ok) return null
  const json = await res.json()
  const m = json.data?.Page?.media?.[0]
  return m ? mapAniList(m) : null
}

/* ------------------------------------------------------------------ TVMaze */

function mapTvMaze(s: any): MediaItem {
  const id = `tvmaze:${s.id}`
  const year = Number((s.premiered ?? '').slice(0, 4)) || 0
  return {
    id,
    name: s.name ?? 'Untitled',
    type: 'series',
    year,
    genres: s.genres ?? [],
    tags: s.type ? [String(s.type).toLowerCase()] : [],
    synopsis: s.summary ? clamp(strip(s.summary)) : '',
    score: s.rating?.average ?? 0,
    members: Math.round((s.weight ?? 0) * 1000),
    status: year > thisYear || s.status === 'In Development' ? 'upcoming' : 'released',
    runtime: s.averageRuntime ?? undefined,
    creator: s.network?.name ?? s.webChannel?.name ?? 'Unknown network',
    poster: s.image?.original ?? s.image?.medium,
    palette: paletteFor(id),
    source: 'TVMaze',
    sourceUrl: s.url,
  }
}

async function searchTvMaze(q: string): Promise<MediaItem[]> {
  const res = await fetch(`https://api.tvmaze.com/search/shows?q=${encodeURIComponent(q)}`)
  if (!res.ok) throw new Error(`TVMaze ${res.status}`)
  const rows = await res.json()
  return (rows ?? []).map((r: any) => mapTvMaze(r.show))
}

async function getTvMaze(id: string): Promise<MediaItem | null> {
  const res = await fetch(`https://api.tvmaze.com/shows/${encodeURIComponent(id)}`)
  if (!res.ok) return null
  return mapTvMaze(await res.json())
}

/* -------------------------------------------------------------------- TMDB */
/* Routed through our own /api/tmdb so the key stays server-side. */

let tmdbUp: boolean | null = null

async function tmdb(path: string, params: Record<string, string> = {}): Promise<any | null> {
  if (tmdbUp === false) return null
  const qs = new URLSearchParams({ path, ...params })
  try {
    const res = await fetch(`/api/tmdb?${qs}`)
    if (res.status === 501 || res.status === 503) { tmdbUp = false; return null }
    if (!res.ok) return null
    tmdbUp = true
    return await res.json()
  } catch {
    tmdbUp = false
    return null
  }
}

export function tmdbConfigured(): boolean | null { return tmdbUp }

const TMDB_IMG = 'https://image.tmdb.org/t/p/w500'

function mapTmdb(r: any, kind: 'movie' | 'tv'): MediaItem {
  const id = `tmdb:${kind}:${r.id}`
  const date = r.release_date ?? r.first_air_date ?? ''
  const year = Number(date.slice(0, 4)) || 0
  return {
    id,
    name: r.title ?? r.name ?? 'Untitled',
    type: kind === 'movie' ? 'movie' : 'series',
    year,
    genres: [],
    tags: [],
    synopsis: r.overview ? clamp(r.overview) : '',
    score: r.vote_average ?? 0,
    members: Math.round(r.popularity ?? 0),
    status: !date || year > thisYear ? 'upcoming' : 'released',
    releaseDate: date || undefined,
    runtime: r.runtime ?? undefined,
    creator: r.original_language ? String(r.original_language).toUpperCase() : 'TMDB',
    poster: r.poster_path ? TMDB_IMG + r.poster_path : undefined,
    palette: paletteFor(id),
    source: 'TMDB',
    sourceUrl: `https://www.themoviedb.org/${kind}/${r.id}`,
  }
}

async function searchTmdb(q: string, kind: 'movie' | 'tv'): Promise<MediaItem[]> {
  const json = await tmdb(`search/${kind}`, { query: q, include_adult: 'false' })
  return (json?.results ?? []).map((r: any) => mapTmdb(r, kind))
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/* ------------------------------------------------------------------ Search */

export interface SearchResult {
  items: MediaItem[]
  /** Providers that failed, so the UI can say so instead of silently under-reporting. */
  failed: string[]
  moviesUnavailable: boolean
}

const relevance = (q: string) => (m: MediaItem) => {
  const n = m.name.toLowerCase()
  const s = q.toLowerCase()
  if (n === s) return 0
  if (n.startsWith(s)) return 1
  if (n.includes(s)) return 2
  return 3
}

/** Searches every configured catalogue at once and merges the results. */
export async function searchMedia(query: string, types?: MediaType[]): Promise<SearchResult> {
  const q = query.trim()
  if (q.length < 2) return { items: [], failed: [], moviesUnavailable: false }
  const want = (t: MediaType) => !types || types.length === 0 || types.includes(t)

  const jobs: { name: string; run: Promise<MediaItem[]> }[] = []
  if (want('anime')) jobs.push({ name: 'AniList', run: searchAniList(q) })
  if (want('series')) jobs.push({ name: 'TVMaze', run: searchTvMaze(q) })
  if (want('movie')) jobs.push({ name: 'TMDB', run: searchTmdb(q, 'movie') })

  const settled = await Promise.allSettled(jobs.map(j => j.run))
  const items: MediaItem[] = []
  const failed: string[] = []
  settled.forEach((r, i) => {
    if (r.status === 'fulfilled') items.push(...r.value)
    else failed.push(jobs[i].name)
  })

  // Bundled catalogue entries also match, so classic titles keep their reviews.
  const lower = q.toLowerCase()
  const fromCatalog = STATIC_MEDIA.filter(m => want(m.type) && m.name.toLowerCase().includes(lower))
  const seen = new Set(fromCatalog.map(m => m.name.toLowerCase() + m.year))
  const merged = [...fromCatalog, ...items.filter(m => {
    const k = m.name.toLowerCase() + m.year
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })]

  const rel = relevance(q)
  merged.sort((a, b) => rel(a) - rel(b) || b.members - a.members)

  return {
    items: merged.slice(0, 60),
    failed,
    moviesUnavailable: want('movie') && tmdbUp === false,
  }
}

/* ----------------------------------------------------------------- Resolve */

const memo = new Map<string, MediaItem | null>()

/** Resolves any id: bundled catalogue, cached row, or a live provider lookup. */
export async function resolveMedia(id: string): Promise<MediaItem | null> {
  if (memo.has(id)) return memo.get(id) ?? null

  const bundled = staticById.get(id)
  if (bundled) {
    const m = fromStatic(bundled)
    memo.set(id, m)
    return m
  }

  const { data } = await supabase.from('media').select('*').eq('id', id).maybeSingle()
  if (data) {
    const m: MediaItem = {
      id: data.id, name: data.name, type: data.type, year: data.year ?? 0,
      genres: data.genres ?? [], tags: data.tags ?? [], synopsis: data.synopsis ?? '',
      score: data.score ? Number(data.score) : 0, members: 0,
      status: data.year && data.year > thisYear ? 'upcoming' : 'released',
      episodes: data.episodes ?? undefined, runtime: data.runtime ?? undefined,
      creator: data.creator ?? '', poster: data.poster ?? undefined,
      palette: paletteFor(data.id), source: data.source, sourceUrl: data.source_url ?? undefined,
    }
    memo.set(id, m)
    return m
  }

  const live = await fetchFromProvider(id)
  memo.set(id, live)
  return live
}

async function fetchFromProvider(id: string): Promise<MediaItem | null> {
  const [provider, a, b] = id.split(':')
  try {
    if (provider === 'anilist') return await getAniList(a)
    if (provider === 'tvmaze') return await getTvMaze(a)
    if (provider === 'tmdb') {
      const kind = a === 'tv' ? 'tv' : 'movie'
      const json = await tmdb(`${kind}/${b}`)
      return json ? mapTmdb(json, kind) : null
    }
  } catch { /* fall through */ }
  return null
}

/**
 * Caches a title so lists, dashboards and recommendations can read it later.
 * Insert-only: rows are immutable from the client, so re-caching an already
 * known title is a no-op rather than an error.
 */
export async function cacheMedia(m: MediaItem): Promise<void> {
  if (m.source === 'catalog') return // bundled titles need no row
  memo.set(m.id, m)
  const { error } = await supabase.from('media').upsert({
    id: m.id, type: m.type, name: m.name, year: m.year || null,
    poster: m.poster ?? null, synopsis: m.synopsis || null,
    genres: m.genres, tags: m.tags, score: m.score || null,
    episodes: m.episodes ?? null, runtime: m.runtime ?? null,
    creator: m.creator || null, source: m.source, source_url: m.sourceUrl ?? null,
  }, { onConflict: 'id', ignoreDuplicates: true })
  // Surfacing this matters: a silent failure here leaves lists unable to render
  // the title later, with no clue why.
  if (error) throw new Error(`Couldn't save "${m.name}": ${error.message}`)
}

/** Resolves a set of ids for list and dashboard views, bundled or external. */
export function useMediaMap(ids: string[]): Map<string, MediaItem> {
  const key = ids.slice().sort().join(',')
  const [map, setMap] = useState<Map<string, MediaItem>>(new Map())
  useEffect(() => {
    let alive = true
    const list = key ? key.split(',') : []
    void resolveMany(list).then(m => { if (alive) setMap(m) })
    return () => { alive = false }
  }, [key])
  return map
}

/** Bulk-resolves ids for list/dashboard views. */
export async function resolveMany(ids: string[]): Promise<Map<string, MediaItem>> {
  const out = new Map<string, MediaItem>()
  const need: string[] = []
  for (const id of ids) {
    const bundled = staticById.get(id)
    if (bundled) out.set(id, fromStatic(bundled))
    else if (memo.has(id)) { const m = memo.get(id); if (m) out.set(id, m) }
    else need.push(id)
  }
  if (need.length) {
    const { data } = await supabase.from('media').select('*').in('id', need)
    for (const row of data ?? []) {
      const m = await resolveMedia(row.id)
      if (m) out.set(row.id, m)
    }
  }
  return out
}
