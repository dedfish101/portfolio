import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { byId, typeLabel } from '../data/catalog'
import { useStore, isVisible } from '../lib/store'
import { similarTo } from '../lib/recommend'
import { posterFor } from '../lib/posters'
import { useReviews, useThreads } from '../lib/community'
import { useAuthGate } from '../components/Auth'
import { toastError } from '../components/Toast'
import { Poster, ScorePill, Stars, StatusPicker, TitleCard, Row, daysUntil, formatDate, formatMembers } from '../components/ui'

export default function TitleDetail() {
  const { id } = useParams()
  const title = id ? byId.get(id) : undefined
  const store = useStore()
  const { require: requireAuth, open } = useAuthGate()

  const { reviews, voted, loading: reviewsLoading, addReview, voteHelpful } =
    useReviews(id ?? '', store.user?.id ?? null, store.profile?.id ?? null)
  const { threads, createThread } = useThreads({ titleId: id })

  const [reviewText, setReviewText] = useState('')
  const [reviewRating, setReviewRating] = useState(8)
  const [spoiler, setSpoiler] = useState(false)
  const [revealed, setRevealed] = useState<string[]>([])
  const [threadTitle, setThreadTitle] = useState('')
  const [threadText, setThreadText] = useState('')
  const [busy, setBusy] = useState(false)

  if (!title) {
    return <div className="page"><h1 className="page-title">Title not found</h1><Link to="/browse" className="btn">Back to Browse</Link></div>
  }

  const similar = similarTo(title.id, 8).filter(t => isVisible(t, store.prefs)).slice(0, 6)
  const ext = posterFor(title.id)
  const myRating = store.ratings[title.id] ?? null
  const isFav = store.favorites.includes(title.id)

  const submitReview = async () => {
    if (!reviewText.trim()) return
    if (!requireAuth()) return
    setBusy(true)
    try {
      await addReview(reviewRating, reviewText.trim(), spoiler)
      setReviewText('')
      setSpoiler(false)
    } catch (e) {
      toastError(e)
    } finally {
      setBusy(false)
    }
  }

  const submitThread = async () => {
    if (!threadTitle.trim() || !threadText.trim()) return
    if (!requireAuth()) return
    setBusy(true)
    try {
      await createThread(store.profile?.id ?? null, 'title', threadTitle.trim(), threadText.trim(), title.id)
      setThreadTitle('')
      setThreadText('')
    } catch (e) {
      toastError(e)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page">
      <div className="detail-hero">
        <Poster title={title} size="lg" />
        <div className="detail-info">
          <div className="detail-tags">
            <span className={`type-tag type-${title.type}`}>{typeLabel(title.type)}</span>
            {title.status === 'upcoming' && title.releaseDate && (
              <span className="pill pill-soon">Releases {formatDate(title.releaseDate)} · {daysUntil(title.releaseDate)} days</span>
            )}
          </div>
          <h1>{title.name}</h1>
          <p className="detail-meta">
            {title.year} · {title.creator}
            {title.episodes ? ` · ${title.episodes} episodes` : ''}
            {title.runtime ? ` · ${title.runtime} min` : ''}
            {' · '}{formatMembers(title.members)} members
          </p>
          <div className="detail-genres">
            {title.genres.map(g => <span key={g} className="genre-chip">{g}</span>)}
            {title.tags.map(t => <span key={t} className="tag-chip">#{t}</span>)}
          </div>
          <p className="detail-synopsis">{title.synopsis}</p>
          <div className="detail-score"><ScorePill score={title.score} /> <span className="muted">community score</span></div>

          <div className="detail-actions">
            <StatusPicker titleId={title.id} />
            <button
              className={`fav-btn ${isFav ? 'active' : ''}`}
              onClick={() => {
                if (!requireAuth()) return
                store.toggleFavorite(title.id).catch(toastError)
              }}
            >
              {isFav ? '♥ Favorited' : '♡ Favorite'}
            </button>
          </div>
          <div className="detail-rate">
            <span className="muted">Your rating:</span>
            <Stars value={myRating} onChange={v => {
              if (!requireAuth()) return
              store.setRating(title.id, v).catch(toastError)
            }} />
          </div>
        </div>
      </div>

      {ext && (ext.synopsis || (ext.meta?.length ?? 0) > 0 || ext.extScore) && (
        <section className="panel ext-panel">
          <div className="ext-head">
            <h2>Details</h2>
            {ext.extScore && <span className="pill pill-gold">{ext.extScore}</span>}
            {ext.link && (
              <a className="ext-link" href={ext.link} target="_blank" rel="noreferrer">{ext.linkLabel} ↗</a>
            )}
          </div>
          {(ext.meta?.length ?? 0) > 0 && (
            <div className="ext-meta">
              {ext.meta!.map(([k, v]) => (
                <div key={k} className="ext-meta-item">
                  <span className="muted">{k}</span>
                  <span>{v}</span>
                </div>
              ))}
            </div>
          )}
          {ext.synopsis && <p className="ext-syn">{ext.synopsis}</p>}
        </section>
      )}

      <div className="detail-columns">
        <section className="panel">
          <h2>Reviews <span className="count-badge">{reviews.length}</span></h2>
          {store.user ? (
            <div className="review-form">
              <div className="review-form-row">
                <label className="muted">Score</label>
                <select className="input input-small" value={reviewRating} onChange={e => setReviewRating(Number(e.target.value))}>
                  {Array.from({ length: 10 }, (_, i) => 10 - i).map(n => <option key={n} value={n}>{n}/10</option>)}
                </select>
                <label className="check">
                  <input type="checkbox" checked={spoiler} onChange={e => setSpoiler(e.target.checked)} />
                  Contains spoilers
                </label>
              </div>
              <textarea
                className="input" rows={3} maxLength={5000}
                placeholder={`What did you think of ${title.name}?`}
                value={reviewText} onChange={e => setReviewText(e.target.value)}
              />
              <button className="btn btn-primary btn-small" onClick={() => void submitReview()} disabled={busy || !reviewText.trim()}>
                {busy ? 'Posting…' : 'Post review'}
              </button>
            </div>
          ) : (
            <div className="signin-prompt">
              <p className="muted">Sign in to write a review.</p>
              <button className="btn btn-small" onClick={() => open('signin')}>Sign in</button>
            </div>
          )}

          {reviewsLoading && <p className="empty">Loading reviews…</p>}
          {!reviewsLoading && reviews.length === 0 && <p className="empty">No reviews yet — be the first.</p>}
          {reviews.map(r => (
            <article key={r.id} className="review">
              <div className="review-head">
                <span className="avatar-sm">{r.author?.avatar ?? '👤'}</span>
                <strong>{r.author?.username ?? 'someone'}</strong>
                <span className="pill pill-blue">★ {r.rating}/10</span>
                <span className="muted review-date">{r.created_at.slice(0, 10)}</span>
              </div>
              {r.spoiler && !revealed.includes(r.id) ? (
                <button className="spoiler-cover" onClick={() => setRevealed(v => [...v, r.id])}>
                  ⚠️ Spoiler review — click to reveal
                </button>
              ) : (
                <p className="review-text">{r.body}</p>
              )}
              <button
                className={`helpful-btn ${voted.includes(r.id) ? 'voted' : ''}`}
                onClick={() => {
                  if (!requireAuth()) return
                  voteHelpful(r.id).catch(toastError)
                }}
              >
                👍 Helpful · {r.helpful_count}
              </button>
            </article>
          ))}
        </section>

        <section className="panel">
          <h2>Discussions <span className="count-badge">{threads.length}</span></h2>
          {store.user ? (
            <div className="thread-form">
              <input
                className="input" maxLength={140}
                placeholder="Start a discussion about this title…"
                value={threadTitle} onChange={e => setThreadTitle(e.target.value)}
              />
              <textarea
                className="input" rows={2} maxLength={5000}
                placeholder="Your opening post"
                value={threadText} onChange={e => setThreadText(e.target.value)}
              />
              <button className="btn btn-primary btn-small" onClick={() => void submitThread()} disabled={busy || !threadTitle.trim() || !threadText.trim()}>
                Start thread
              </button>
            </div>
          ) : (
            <div className="signin-prompt">
              <p className="muted">Sign in to start a discussion.</p>
              <button className="btn btn-small" onClick={() => open('signin')}>Sign in</button>
            </div>
          )}
          {threads.length === 0 && <p className="empty">No discussions yet for this title.</p>}
          {threads.map(t => (
            <Link key={t.id} to={`/forum/thread/${t.id}`} className="thread-item">
              <span className="home-thread-avatar">{t.author?.avatar ?? '💬'}</span>
              <div>
                <div className="home-thread-title">{t.title}</div>
                <div className="home-thread-meta">{t.author?.username ?? 'someone'} · {t.post_count} posts · {t.created_at.slice(0, 10)}</div>
              </div>
            </Link>
          ))}
        </section>
      </div>

      <Row heading="More like this">
        {similar.map(t => <TitleCard key={t.id} title={t} />)}
      </Row>
    </div>
  )
}
