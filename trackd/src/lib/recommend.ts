import { STATIC_MEDIA } from './media'
import type { MediaItem } from './media'
import type { WatchStatus } from './store'

const byId = new Map(STATIC_MEDIA.map(m => [m.id, m]))
const CATALOG = STATIC_MEDIA

export interface Recommendation {
  title: MediaItem
  score: number
  reasons: string[]
}

/**
 * Content-based recommender.
 * Builds a taste profile from the user's ratings + list statuses
 * (weighted genre/tag/type preferences), then scores every unseen title
 * by profile affinity + community prior, with a similar-title explanation.
 */
/** Deterministic 0..1 from a title id + roll, so a given roll is reproducible. */
function jitterFor(id: string, roll: number): number {
  let h = 2166136261 ^ roll
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return ((h >>> 0) % 10000) / 10000
}

export function recommend(
  ratings: Record<string, number>,
  statuses: Record<string, WatchStatus>,
  favorites: string[],
  limit = 12,
  visible: (t: MediaItem) => boolean = () => true,
  /** Bump to draw a different sample of strong candidates — powers "show me more". */
  roll = 0,
): { recs: Recommendation[]; topGenres: [string, number][]; poolSize: number } {
  const genrePref = new Map<string, number>()
  const tagPref = new Map<string, number>()
  const typePref = new Map<string, number>()

  const liked: MediaItem[] = [] // titles the user demonstrably enjoyed, for "because you liked X"

  const bump = (map: Map<string, number>, key: string, w: number) => {
    map.set(key, (map.get(key) ?? 0) + w)
  }

  const signalFor = (id: string): number => {
    let w = 0
    const r = ratings[id]
    if (r !== undefined) w += (r - 5.5) / 4.5 // -1..+1 centred on 5.5
    const st = statuses[id]
    if (st === 'completed') w += 0.35
    if (st === 'watching') w += 0.5
    if (st === 'planned') w += 0.2
    if (st === 'dropped') w -= 0.8
    if (favorites.includes(id)) w += 0.7
    return w
  }

  const interacted = new Set<string>([
    ...Object.keys(ratings), ...Object.keys(statuses), ...favorites,
  ])

  for (const id of interacted) {
    const t = byId.get(id)
    if (!t) continue
    const w = signalFor(id)
    for (const g of t.genres) bump(genrePref, g, w)
    for (const tag of t.tags) bump(tagPref, tag, w * 0.8)
    bump(typePref, t.type, w * 0.5)
    if (w > 0.6) liked.push(t)
  }

  const seen = new Set(
    [...interacted].filter(id => {
      const st = statuses[id]
      return st === 'completed' || st === 'watching' || st === 'dropped' || ratings[id] !== undefined
    }),
  )

  const jaccard = (a: MediaItem, b: MediaItem): number => {
    const sa = new Set([...a.genres, ...a.tags])
    const sb = new Set([...b.genres, ...b.tags])
    let inter = 0
    for (const x of sa) if (sb.has(x)) inter++
    return inter / (sa.size + sb.size - inter)
  }

  const recs: Recommendation[] = []

  for (const t of CATALOG) {
    if (seen.has(t.id)) continue
    if (!visible(t)) continue

    let affinity = 0
    let topGenre = ''
    let topGenreW = 0
    for (const g of t.genres) {
      const w = genrePref.get(g) ?? 0
      affinity += w
      if (w > topGenreW) { topGenreW = w; topGenre = g }
    }
    for (const tag of t.tags) affinity += (tagPref.get(tag) ?? 0) * 0.8
    affinity += (typePref.get(t.type) ?? 0) * 0.5

    // Community prior keeps cold-start sane; upcoming titles use hype (members).
    const prior = t.status === 'upcoming'
      ? 6.5 + Math.min(2, t.members / 500000)
      : t.score
    const popularity = Math.log10(Math.max(t.members, 1)) / 7

    const score = affinity * 2 + prior * 0.55 + popularity

    const reasons: string[] = []
    let bestSim: MediaItem | null = null
    let bestSimScore = 0.24 // threshold: only claim similarity when meaningful
    for (const l of liked) {
      if (l.id === t.id) continue
      const s = jaccard(l, t)
      if (s > bestSimScore) { bestSimScore = s; bestSim = l }
    }
    if (bestSim) reasons.push(`Because you liked ${bestSim.name}`)
    if (topGenreW > 0.5) reasons.push(`You rate ${topGenre} highly`)
    if (t.status === 'upcoming') reasons.push('Highly anticipated')
    else if (t.score >= 8.8) reasons.push('Universally acclaimed')
    if (reasons.length === 0) reasons.push(t.score >= 8.5 ? 'Critically loved' : 'Trending with the community')

    recs.push({ title: t, score, reasons: reasons.slice(0, 2) })
  }

  recs.sort((a, b) => b.score - a.score)

  const topGenres = [...genrePref.entries()]
    .filter(([, w]) => w > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5) as [string, number][]

  // Roll 0 is the honest best-first ranking. Later rolls draw a different sample
  // from a pool of strong candidates, so "show me more" yields genuinely new
  // titles rather than reshuffling the same ones — then re-sorts by merit.
  let chosen: Recommendation[]
  if (roll === 0) {
    chosen = recs.slice(0, limit)
  } else {
    const pool = recs.slice(0, Math.min(recs.length, Math.max(limit * 2, limit + 8)))
    chosen = pool
      .map(r => ({ r, k: jitterFor(r.title.id, roll) }))
      .sort((a, b) => a.k - b.k)
      .slice(0, limit)
      .map(x => x.r)
      .sort((a, b) => b.score - a.score)
  }

  return { recs: chosen, topGenres, poolSize: recs.length }
}

/** Similar titles for a detail page, independent of user taste. */
export function similarTo(id: string, limit = 6): MediaItem[] {
  const base = byId.get(id)
  if (!base) return []
  const sim = (a: MediaItem, b: MediaItem): number => {
    const sa = new Set([...a.genres, ...a.tags])
    const sb = new Set([...b.genres, ...b.tags])
    let inter = 0
    for (const x of sa) if (sb.has(x)) inter++
    const typeBonus = a.type === b.type ? 0.08 : 0
    return inter / (sa.size + sb.size - inter) + typeBonus
  }
  return CATALOG
    .filter(t => t.id !== id)
    .map(t => ({ t, s: sim(base, t) }))
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map(x => x.t)
}
