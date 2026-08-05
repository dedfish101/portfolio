import { Link } from 'react-router-dom'
import type { Title } from '../data/catalog'
import { useStore, isVisible } from '../lib/store'
import { recommend } from '../lib/recommend'
import { TitleCard } from '../components/ui'

export default function Recommendations() {
  const { ratings, statuses, favorites, prefs } = useStore()
  const interactions = Object.keys(ratings).length + Object.keys(statuses).length + favorites.length
  const { recs, topGenres } = recommend(ratings, statuses, favorites, 18, (t: Title) => isVisible(t, prefs))
  const maxW = topGenres[0]?.[1] ?? 1

  return (
    <div className="page">
      <h1 className="page-title">Recommendations</h1>
      {interactions === 0 ? (
        <div className="panel">
          <h2>Cold start</h2>
          <p>The engine hasn't seen your taste yet, so these are community favorites. Rate a few titles or add them to your lists and this page will retune itself instantly.</p>
          <Link to="/browse" className="btn btn-primary btn-small">Rate some titles</Link>
        </div>
      ) : (
        <div className="panel taste-panel">
          <h2>Your taste profile</h2>
          <p className="muted">Built from {interactions} signals — ratings, list statuses, and favorites. Dropped shows count against a genre; favorites count double.</p>
          {topGenres.length > 0 && (
            <div className="genre-bars">
              {topGenres.map(([g, w]) => (
                <div key={g} className="genre-bar-row">
                  <span className="genre-bar-label">{g}</span>
                  <div className="genre-bar-track">
                    <div className="genre-bar-fill" style={{ width: `${Math.max(8, (w / maxW) * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="grid">
        {recs.map(r => (
          <TitleCard key={r.title.id} title={r.title} note={r.reasons.join(' · ')} />
        ))}
      </div>
    </div>
  )
}
