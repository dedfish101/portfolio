import { Link } from 'react-router-dom'
import { CATALOG, typeLabel } from '../data/catalog'
import { useStore, isVisible } from '../lib/store'
import { useAuthGate } from '../components/Auth'
import { toastError } from '../components/Toast'
import { Poster, daysUntil, formatDate, formatMembers } from '../components/ui'

export default function Upcoming() {
  const store = useStore()
  const { require: requireAuth } = useAuthGate()
  const upcoming = CATALOG.filter(t => t.status === 'upcoming' && isVisible(t, store.prefs))
    .sort((a, b) => (a.releaseDate ?? '').localeCompare(b.releaseDate ?? ''))
  const maxHype = Math.max(1, ...upcoming.map(t => t.members))

  return (
    <div className="page">
      <h1 className="page-title">Upcoming</h1>
      <p className="muted page-lead">
        Release countdowns with community hype. "Remind me" adds the title to your Plan to Watch list.
        Argue about all of it on the <Link to="/forum">Upcoming &amp; News board</Link>.
      </p>

      <div className="upcoming-list">
        {upcoming.map(t => {
          const days = t.releaseDate ? daysUntil(t.releaseDate) : null
          const planned = store.statuses[t.id] === 'planned'
          return (
            <div key={t.id} className="upcoming-row">
              <Link to={`/title/${t.id}`}><Poster title={t} size="sm" /></Link>
              <div className="upcoming-main">
                <Link to={`/title/${t.id}`} className="upcoming-name">{t.name}</Link>
                <div className="home-thread-meta">
                  <span className={`type-tag type-${t.type}`}>{typeLabel(t.type)}</span>
                  {' '}{t.creator} · {t.releaseDate ? formatDate(t.releaseDate) : 'TBA'}
                </div>
                <p className="upcoming-syn">{t.synopsis}</p>
                <div className="hype">
                  <span className="muted">Hype</span>
                  <div className="genre-bar-track hype-track">
                    <div className="genre-bar-fill" style={{ width: `${(t.members / maxHype) * 100}%` }} />
                  </div>
                  <span className="muted">{formatMembers(t.members)} tracking</span>
                </div>
              </div>
              <div className="upcoming-side">
                {days !== null && (
                  <div className="countdown">
                    <strong>{days}</strong>
                    <span>days</span>
                  </div>
                )}
                <button
                  className={`btn btn-small ${planned ? 'btn-done' : ''}`}
                  onClick={() => {
                    if (!requireAuth()) return
                    store.setStatus(t.id, planned ? null : 'planned').catch(toastError)
                  }}
                >
                  {planned ? '✓ On your list' : '🔔 Remind me'}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
