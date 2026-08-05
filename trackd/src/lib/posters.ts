import data from '../data/posters.json'

export interface PosterEntry {
  image?: string
  synopsis?: string
  extScore?: string
  meta?: [string, string][]
  link?: string
  linkLabel?: string
}

/**
 * Poster art and external metadata, baked in at build time by `npm run sync:posters`.
 * Titles with no entry fall back to a generated gradient card.
 */
// JSON widens the meta tuples to string[][], so route through unknown.
const POSTERS = data as unknown as Record<string, PosterEntry>

export function posterFor(titleId: string): PosterEntry | undefined {
  return POSTERS[titleId]
}
