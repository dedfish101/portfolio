import { Link } from 'react-router-dom'
import { STATIC_MEDIA } from '../lib/media'
import type { MediaItem } from '../lib/media'
import { TitleCard, Row, daysUntil, formatDate } from '../components/ui'
import { useStore, isVisible } from '../lib/store'
import { recommend } from '../lib/recommend'
import { useThreads, useSiteStats } from '../lib/community'
import { useAuthGate } from '../components/Auth'

export default function Home() {
  const { ratings, statuses, favorites, prefs, user } = useStore()
  const { open } = useAuthGate()
  const { threads } = useThreads({ limit: 3 })
  const stats = useSiteStats()
  const vis = (t: MediaItem) => isVisible(t, prefs)

  const released = STATIC_MEDIA.filter(t => t.status === 'released' && vis(t))
  const trending = [...released].sort((a, b) => b.members - a.members).slice(0, 10)
  const topRated = [...released].sort((a, b) => b.score - a.score).slice(0, 10)
  const upcoming = STATIC_MEDIA.filter(t => t.status === 'upcoming' && vis(t))
    .sort((a, b) => (a.releaseDate ?? '').localeCompare(b.releaseDate ?? ''))
    .slice(0, 8)
  const { recs } = recommend(ratings, statuses, favorites, 8, vis)
  const hasTaste = Object.keys(ratings).length + Object.keys(statuses).length > 0

  return (
    <div className="page">
      <div className="hero">
        <h1>Every movie, series &amp; anime.<br />One watchlist.</h1>
        <p>Track what you watch, rate it, get recommendations tuned to your taste, and argue about it in the forums.</p>
        <div className="hero-actions">
          {user ? (
            <>
              <Link className="btn btn-primary" to="/browse">Browse the catalog</Link>
              <Link className="btn" to="/recommendations">Get recommendations</Link>
            </>
          ) : (
            <>
              <button className="btn btn-primary" onClick={() => open('signup')}>Create a free account</button>
              <Link className="btn" to="/browse">Browse without an account</Link>
            </>
          )}
        </div>
        <div className="hero-stats">
          <div><strong>{STATIC_MEDIA.length}+</strong><span>titles</span></div>
          <div><strong>{stats.members}</strong><span>members</span></div>
          <div><strong>{stats.posts}</strong><span>forum posts</span></div>
        </div>
      </div>

      {hasTaste && recs.length > 0 && (
        <Row heading="Picked for you" sub="From your ratings and lists — see all on the Recommendations page">
          {recs.map(r => <TitleCard key={r.title.id} title={r.title} note={r.reasons[0]} />)}
        </Row>
      )}

      <Row heading="Trending now" sub="Most tracked across the community">
        {trending.map(t => <TitleCard key={t.id} title={t} />)}
      </Row>

      <Row heading="Top rated of all time">
        {topRated.map(t => <TitleCard key={t.id} title={t} />)}
      </Row>

      <Row heading="Coming soon" sub="Countdowns on the Upcoming page">
        {upcoming.map(t => (
          <TitleCard key={t.id} title={t} note={t.releaseDate ? `${formatDate(t.releaseDate)} · in ${daysUntil(t.releaseDate)} days` : undefined} />
        ))}
      </Row>

      <section className="home-forum">
        <div className="row-head">
          <h2>Latest in the forums</h2>
          <p className="row-sub">Where the community argues in good faith (mostly)</p>
        </div>
        <div className="home-threads">
          {threads.map(t => (
            <Link key={t.id} to={`/forum/thread/${t.id}`} className="home-thread">
              <span className="home-thread-avatar">{t.author?.avatar ?? '💬'}</span>
              <div>
                <div className="home-thread-title">{t.title}</div>
                <div className="home-thread-meta">{t.author?.username ?? 'someone'} · {t.post_count} posts</div>
              </div>
            </Link>
          ))}
        </div>
        <Link to="/forum" className="btn btn-small">Open the forum →</Link>
      </section>
    </div>
  )
}
