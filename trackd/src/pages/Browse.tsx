import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CATALOG, GENRES } from '../data/catalog'
import type { MediaType } from '../data/catalog'
import { TitleCard } from '../components/ui'
import { useStore, isVisible } from '../lib/store'

type SortKey = 'popularity' | 'score' | 'year' | 'name'

export default function Browse() {
  const { prefs } = useStore()
  const [query, setQuery] = useState('')
  const [type, setType] = useState<MediaType | 'all'>('all')
  const [genre, setGenre] = useState('all')
  const [sort, setSort] = useState<SortKey>('popularity')
  const [includeUpcoming, setIncludeUpcoming] = useState(true)

  const hiddenTypes = [
    prefs.hideAnime && 'anime',
    prefs.hideMovies && 'movies',
    prefs.hideSeries && 'series',
  ].filter((x): x is string => Boolean(x))

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = CATALOG.filter(t => {
      if (!isVisible(t, prefs)) return false
      if (!includeUpcoming && t.status === 'upcoming') return false
      if (type !== 'all' && t.type !== type) return false
      if (genre !== 'all' && !t.genres.includes(genre)) return false
      if (q && !(
        t.name.toLowerCase().includes(q) ||
        t.creator.toLowerCase().includes(q) ||
        t.tags.some(tag => tag.includes(q)) ||
        t.genres.some(g => g.toLowerCase().includes(q))
      )) return false
      return true
    })
    const sorters: Record<SortKey, (a: typeof list[0], b: typeof list[0]) => number> = {
      popularity: (a, b) => b.members - a.members,
      score: (a, b) => b.score - a.score,
      year: (a, b) => b.year - a.year,
      name: (a, b) => a.name.localeCompare(b.name),
    }
    return [...list].sort(sorters[sort])
  }, [query, type, genre, sort, includeUpcoming, prefs])

  return (
    <div className="page">
      <h1 className="page-title">Browse</h1>
      <div className="filters">
        <input
          className="input search-input"
          placeholder="Search titles, creators, tags…"
          value={query}
          onChange={e => setQuery(e.target.value)}
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
          <option value="popularity">Most popular</option>
          <option value="score">Highest rated</option>
          <option value="year">Newest</option>
          <option value="name">A–Z</option>
        </select>
        <label className="check">
          <input type="checkbox" checked={includeUpcoming} onChange={e => setIncludeUpcoming(e.target.checked)} />
          Include upcoming
        </label>
      </div>

      <p className="result-count">
        {results.length} title{results.length === 1 ? '' : 's'}
        {hiddenTypes.length > 0 && (
          <span className="hidden-note"> · {hiddenTypes.join(' & ')} hidden by your <Link to="/profile">content preferences</Link></span>
        )}
      </p>
      <div className="grid">
        {results.map(t => <TitleCard key={t.id} title={t} />)}
      </div>
      {results.length === 0 && <p className="empty">Nothing matches those filters. Try loosening them.</p>}
    </div>
  )
}
