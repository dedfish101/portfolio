import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Title } from '../data/catalog'
import { useStore, isVisible } from '../lib/store'
import { recommend } from '../lib/recommend'
import { TitleCard } from '../components/ui'
import { toastError } from '../components/Toast'

export default function Recommendations() {
  const { ratings, statuses, favorites, prefs, refresh, user } = useStore()
  const [roll, setRoll] = useState(0)
  const [busy, setBusy] = useState(false)

  const interactions = Object.keys(ratings).length + Object.keys(statuses).length + favorites.length
  // Showing fewer than the candidate pool is what makes "show me more" meaningful.
  const { recs, topGenres, poolSize } = recommend(
    ratings, statuses, favorites, 12, (t: Title) => isVisible(t, prefs), roll,
  )
  const canReroll = poolSize > recs.length
  const maxW = topGenres[0]?.[1] ?? 1

  const reload = async () => {
    setBusy(true)
    try {
      // Pull any list changes made elsewhere, then reshuffle comparable picks.
      await refresh()
      setRoll(r => r + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (e) {
      toastError(e)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page">
      <div className="fyp-head">
        <div>
          <h1 className="page-title">For You</h1>
          {roll > 0 && <p className="muted fyp-roll">Fresh mix #{roll + 1}</p>}
        </div>
        <button
          className="btn btn-primary reload-btn"
          onClick={() => void reload()}
          disabled={busy || !canReroll}
          title={canReroll ? undefined : "You've tracked nearly everything in the catalog"}
        >
          <span className={`reload-icon ${busy ? 'spinning' : ''}`}>↻</span>
          {busy ? 'Finding more…' : canReroll ? 'Show me more' : 'Nothing more to show'}
        </button>
      </div>

      {interactions === 0 ? (
        <div className="panel">
          <h2>Cold start</h2>
          <p>
            The engine hasn't seen your taste yet, so these are community favourites.
            {user
              ? ' Rate a few titles or add them to your lists and this page retunes itself instantly.'
              : ' Sign in and rate a few titles to make this yours.'}
          </p>
          <Link to="/browse" className="btn btn-primary btn-small">Rate some titles</Link>
        </div>
      ) : (
        <div className="panel taste-panel">
          <h2>Your taste profile</h2>
          <p className="muted">
            Built from {interactions} signal{interactions === 1 ? '' : 's'} — ratings, list statuses and favourites.
            Dropped titles count against a genre; favourites count double.
          </p>
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

      {recs.length === 0 ? (
        <p className="empty">
          You've tracked everything that matches your content preferences. Try unhiding a
          type on your <Link to="/profile">profile</Link>.
        </p>
      ) : (
        <div className="grid">
          {recs.map(r => <TitleCard key={r.title.id} title={r.title} note={r.reasons.join(' · ')} />)}
        </div>
      )}
    </div>
  )
}
