import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { GENRES } from '../data/catalog'
import type { MediaType } from '../data/catalog'
import { TitleCard } from '../components/ui'
import { useStore, isVisible } from '../lib/store'
import { searchMedia, STATIC_MEDIA } from '../lib/media'
import type { MediaItem } from '../lib/media'

type SortKey = 'relevance' | 'popularity' | 'score' | 'year' | 'name'

export default function Browse() {
  const { prefs } = useStore()
  const [query, setQuery] = useState('')
  const [type, setType] = useState<MediaType | 'all'>('all')
  const [genre, setGenre] = useState('all')
  const [sort, setSort] = useState<SortKey>('relevance')

  const [results, setResults] = useState<MediaItem[]>([])
  const [searching, setSearching] = useState(false)
  const [failed, setFailed] = useState<string[]>([])
  const [noMovies, setNoMovies] = useState(false)
  const seq = useRef(0)

  const typesFilter = useMemo(() => (type === 'all' ? undefined : [type]), [type])

  // Debounced live search across every configured catalogue.
  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) {
      setResults([]); setSearching(false); setFailed([]); setNoMovies(false)
      return
    }
    setSearching(true)
    const mine = ++seq.current
    const timer = setTimeout(() => {
      void searchMedia(q, typesFilter).then(r => {
        if (mine !== seq.current) return // a newer keystroke won
        setResults(r.items)
        setFailed(r.failed)
        setNoMovies(r.moviesUnavailable)
        setSearching(false)
      }).catch(() => { if (mine === seq.current) setSearching(false) })
    }, 320)
    return () => clearTimeout(timer)
  }, [query, typesFilter])

  const shown = useMemo(() => {
    const base = query.trim().length >= 2 ? results : STATIC_MEDIA
    const list = base.filter(m => {
      if (!isVisible(m, prefs)) return false
      if (type !== 'all' && m.type !== type) return false
      if (genre !== 'all' && !m.genres.includes(genre)) return false
      return true
    })
    if (sort === 'relevance') return list
    const sorters: Record<Exclude<SortKey, 'relevance'>, (a: MediaItem, b: MediaItem) => number> = {
      popularity: (a, b) => b.members - a.members,
      score: (a, b) => b.score - a.score,
      year: (a, b) => b.year - a.year,
      name: (a, b) => a.name.localeCompare(b.name),
    }
    return [...list].sort(sorters[sort])
  }, [results, query, type, genre, sort, prefs])

  const isSearch = query.trim().length >= 2

  return (
    <div className="page">
      <h1 className="page-title">Search</h1>
      <p className="muted page-lead">
        Live search across AniList (anime), TVMaze (series) and TMDB (films) — not just a fixed list.
      </p>

      <div className="filters">
        <input
          className="input search-input"
          placeholder="Search any movie, series or anime…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          autoFocus
        />
        <div className="seg">
          {(['all', 'movie', 'series', 'anime'] as const).map(t => (
            <button key={t} className={`seg-btn ${type === t ? 'active' : ''}`} onClick={() => setType(t)}>
              {t === 'all' ? 'All' : t === 'movie' ? 'Movies' : t === 'series' ? 'Series' : 'Anime'}
            </button>
          ))}
        </div>
        <select className="input" value={genre} onChange={e => setGenre(e.target.value)}>
          <option value="all">All genres</option>
          {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
        <select className="input" value={sort} onChange={e => setSort(e.target.value as SortKey)}>
          <option value="relevance">Best match</option>
          <option value="popularity">Most popular</option>
          <option value="score">Highest rated</option>
          <option value="year">Newest</option>
          <option value="name">A–Z</option>
        </select>
      </div>

      {noMovies && (
        <div className="notice">
          <strong>Films aren't searchable yet.</strong> Anime and series come from keyless
          catalogues, but films need a TMDB key set as <code>TMDB_API_KEY</code> on the server.
          Anime and series results below are complete.
        </div>
      )}
      {failed.length > 0 && !noMovies && (
        <div className="notice">Couldn't reach {failed.join(' and ')} just now — showing what loaded.</div>
      )}

      <p className="result-count">
        {searching
          ? 'Searching…'
          : isSearch
            ? `${shown.length} result${shown.length === 1 ? '' : 's'}`
            : `Browsing ${shown.length} featured titles — start typing to search everything`}
      </p>

      <div className="grid">
        {shown.map(m => <TitleCard key={m.id} title={m} />)}
      </div>

      {!searching && isSearch && shown.length === 0 && (
        <p className="empty">
          Nothing matched. Try fewer words, or check your{' '}
          <Link to="/profile">content preferences</Link> if you've hidden a type.
        </p>
      )}
    </div>
  )
}
