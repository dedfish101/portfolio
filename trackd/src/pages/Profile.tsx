import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { byId } from '../data/catalog'
import { useStore, STATUS_LABELS } from '../lib/store'
import type { WatchStatus } from '../lib/store'
import { useAuthorCounts } from '../lib/community'
import { TitleCard } from '../components/ui'
import { useAuthGate } from '../components/Auth'
import { toastError } from '../components/Toast'

const AVATARS = ['🍿', '🎬', '📺', '🌸', '👺', '🤖', '🐉', '🦊', '🌙', '⚡', '🎭', '🛸']
const TABS: (WatchStatus | 'favorites' | 'ratings')[] = ['watching', 'completed', 'planned', 'dropped', 'favorites', 'ratings']

export default function Profile() {
  const store = useStore()
  const { profile, prefs, statuses, ratings, favorites, activity, user, ready } = store
  const { open } = useAuthGate()
  const counts = useAuthorCounts(profile?.id ?? null)
  const [tab, setTab] = useState<typeof TABS[number]>('watching')
  const [editing, setEditing] = useState(false)
  const [draftName, setDraftName] = useState('')
  const [draftBio, setDraftBio] = useState('')
  const [busy, setBusy] = useState(false)

  const stats = useMemo(() => {
    const c: Record<WatchStatus, number> = { watching: 0, completed: 0, planned: 0, dropped: 0 }
    for (const s of Object.values(statuses)) c[s]++
    const vals = Object.values(ratings)
    const mean = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0

    let minutes = 0
    for (const [id, s] of Object.entries(statuses)) {
      if (s !== 'completed' && s !== 'watching') continue
      const t = byId.get(id)
      if (!t) continue
      minutes += t.runtime ?? (t.episodes ?? 0) * 24
    }

    const genreCount = new Map<string, number>()
    for (const id of new Set([...Object.keys(statuses), ...Object.keys(ratings)])) {
      const t = byId.get(id)
      if (!t) continue
      for (const g of t.genres) genreCount.set(g, (genreCount.get(g) ?? 0) + 1)
    }
    const topGenres = [...genreCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6)

    return { counts: c, mean, hours: Math.round(minutes / 60), topGenres, maxGenre: topGenres[0]?.[1] ?? 1, rated: vals.length }
  }, [statuses, ratings])

  const tabTitles = useMemo(() => {
    if (tab === 'favorites') return favorites.map(id => byId.get(id)).filter(t => t !== undefined)
    if (tab === 'ratings') {
      return Object.entries(ratings).sort((a, b) => b[1] - a[1]).map(([id]) => byId.get(id)).filter(t => t !== undefined)
    }
    return Object.entries(statuses).filter(([, s]) => s === tab).map(([id]) => byId.get(id)).filter(t => t !== undefined)
  }, [tab, statuses, ratings, favorites])

  if (!ready) return <div className="page"><p className="empty">Loading…</p></div>

  if (!user || !profile) {
    return (
      <div className="page">
        <div className="panel signed-out">
          <h1>Your profile lives here</h1>
          <p className="muted">
            Create a free account to track what you watch, rate titles, get recommendations
            tuned to your taste, and post in the forums.
          </p>
          <div className="hero-actions">
            <button className="btn btn-primary" onClick={() => open('signup')}>Create an account</button>
            <button className="btn" onClick={() => open('signin')}>Sign in</button>
          </div>
        </div>
      </div>
    )
  }

  const saveProfile = async () => {
    setBusy(true)
    try {
      await store.updateProfile({ username: draftName.trim() || profile.username, bio: draftBio })
      setEditing(false)
    } catch (e) {
      toastError(e)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page">
      <div className="profile-head">
        <div className="profile-avatar">{profile.avatar}</div>
        <div className="profile-id">
          {editing ? (
            <div className="profile-edit">
              <input className="input" value={draftName} onChange={e => setDraftName(e.target.value)} placeholder="Username" maxLength={24} />
              <textarea className="input" rows={2} value={draftBio} onChange={e => setDraftBio(e.target.value)} placeholder="Bio" maxLength={160} />
              <div className="avatar-picker">
                {AVATARS.map(a => (
                  <button
                    key={a}
                    className={`avatar-opt ${profile.avatar === a ? 'active' : ''}`}
                    onClick={() => store.updateProfile({ avatar: a }).catch(toastError)}
                  >{a}</button>
                ))}
              </div>
              <div className="hero-actions">
                <button className="btn btn-primary btn-small" onClick={() => void saveProfile()} disabled={busy}>
                  {busy ? 'Saving…' : 'Save'}
                </button>
                <button className="btn btn-small" onClick={() => setEditing(false)}>Cancel</button>
              </div>
            </div>
          ) : (
            <>
              <h1>{profile.username}</h1>
              <p className="muted">{profile.bio || 'No bio yet.'}</p>
              <p className="muted profile-joined">
                Joined {profile.joined} · {counts.reviews} review{counts.reviews === 1 ? '' : 's'} · {counts.posts} forum post{counts.posts === 1 ? '' : 's'}
              </p>
              <button className="btn btn-small" onClick={() => { setDraftName(profile.username); setDraftBio(profile.bio); setEditing(true) }}>
                Edit profile
              </button>
            </>
          )}
        </div>
        <div className="profile-stats">
          <div className="stat"><strong>{stats.counts.completed}</strong><span>completed</span></div>
          <div className="stat"><strong>{stats.counts.watching}</strong><span>watching</span></div>
          <div className="stat"><strong>{stats.counts.planned}</strong><span>planned</span></div>
          <div className="stat"><strong>{stats.rated}</strong><span>rated</span></div>
          <div className="stat"><strong>{stats.mean ? stats.mean.toFixed(1) : '—'}</strong><span>mean score</span></div>
          <div className="stat"><strong>{stats.hours}</strong><span>hours watched</span></div>
        </div>
      </div>

      <section className="panel prefs-panel">
        <h2>Content preferences</h2>
        <p className="muted prefs-blurb">
          Hidden types disappear from Home, Browse, Upcoming, and your recommendations.
          Your lists, direct links, and forum threads still work.
        </p>
        <div className="prefs-row">
          <label className="check">
            <input type="checkbox" checked={prefs.hideAnime} onChange={e => store.setPrefs({ hideAnime: e.target.checked }).catch(toastError)} />
            Hide anime
          </label>
          <label className="check">
            <input type="checkbox" checked={prefs.hideMovies} onChange={e => store.setPrefs({ hideMovies: e.target.checked }).catch(toastError)} />
            Hide movies
          </label>
          <label className="check">
            <input type="checkbox" checked={prefs.hideSeries} onChange={e => store.setPrefs({ hideSeries: e.target.checked }).catch(toastError)} />
            Hide series
          </label>
        </div>
      </section>

      {stats.topGenres.length > 0 && (
        <section className="panel genre-panel">
          <h2>Your genres</h2>
          <div className="genre-bars">
            {stats.topGenres.map(([g, n]) => (
              <div key={g} className="genre-bar-row">
                <span className="genre-bar-label">{g}</span>
                <div className="genre-bar-track">
                  <div className="genre-bar-fill" style={{ width: `${(n / stats.maxGenre) * 100}%` }} />
                </div>
                <span className="genre-bar-n">{n}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="tabs">
        {TABS.map(t => (
          <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t === 'favorites' ? `♥ Favorites (${favorites.length})`
              : t === 'ratings' ? `★ Rated (${stats.rated})`
              : `${STATUS_LABELS[t]} (${stats.counts[t]})`}
          </button>
        ))}
      </div>

      {tabTitles.length === 0 ? (
        <p className="empty">Nothing here yet. <Link to="/browse">Browse titles</Link> and add them to your lists.</p>
      ) : (
        <div className="grid">
          {tabTitles.map(t => <TitleCard key={t.id} title={t} />)}
        </div>
      )}

      <section className="panel">
        <h2>Recent activity</h2>
        {activity.length === 0 && <p className="empty">Your activity feed will appear here as you track things.</p>}
        <ul className="activity">
          {activity.slice(0, 15).map(a => {
            const t = byId.get(a.titleId)
            return (
              <li key={a.id}>
                <span className="muted">{a.date}</span>{' — '}
                {a.text}{t && <> · <Link to={`/title/${t.id}`}>{t.name}</Link></>}
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}
