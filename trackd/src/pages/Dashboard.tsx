import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { byId, typeLabel } from '../data/catalog'
import type { MediaType } from '../data/catalog'
import { useStore, STATUS_LABELS } from '../lib/store'
import type { WatchStatus } from '../lib/store'
import { useAuthorCounts } from '../lib/community'
import { useAuthGate } from '../components/Auth'
import { Columns, BarsH, Donut, TrendLine, STATUS_COLORS, TYPE_COLORS, SERIES } from '../components/charts'
import { toast } from '../components/Toast'

const STATUS_ORDER: WatchStatus[] = ['watching', 'completed', 'planned', 'dropped']
const TYPE_ORDER: MediaType[] = ['movie', 'series', 'anime']

function monthKey(iso: string) { return iso.slice(0, 7) }

function lastMonths(n: number): string[] {
  const out: string[] = []
  const d = new Date()
  d.setDate(1)
  for (let i = n - 1; i >= 0; i--) {
    const m = new Date(d.getFullYear(), d.getMonth() - i, 1)
    out.push(`${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}`)
  }
  return out
}

export default function Dashboard() {
  const { profile, statuses, ratings, favorites, activity, user, ready } = useStore()
  const { open } = useAuthGate()
  const counts = useAuthorCounts(profile?.id ?? null)

  const d = useMemo(() => {
    const status: Record<WatchStatus, number> = { watching: 0, completed: 0, planned: 0, dropped: 0 }
    for (const s of Object.values(statuses)) status[s]++

    const typeCount: Record<MediaType, number> = { movie: 0, series: 0, anime: 0 }
    const genre = new Map<string, number>()
    const decade = new Map<string, number>()
    let minutes = 0

    const tracked = new Set([...Object.keys(statuses), ...Object.keys(ratings), ...favorites])
    for (const id of tracked) {
      const t = byId.get(id)
      if (!t) continue
      typeCount[t.type]++
      for (const g of t.genres) genre.set(g, (genre.get(g) ?? 0) + 1)
      const dec = `${Math.floor(t.year / 10) * 10}s`
      decade.set(dec, (decade.get(dec) ?? 0) + 1)
      const s = statuses[id]
      if (s === 'completed' || s === 'watching') minutes += t.runtime ?? (t.episodes ?? 0) * 24
    }

    // rating histogram 1..10
    const hist = Array.from({ length: 10 }, (_, i) => ({
      label: String(i + 1),
      value: Object.values(ratings).filter(r => r === i + 1).length,
    }))

    const vals = Object.values(ratings)
    const mean = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0
    // How generous a rater you are, vs. the community score of the same titles.
    let deltaSum = 0, deltaN = 0
    for (const [id, r] of Object.entries(ratings)) {
      const t = byId.get(id)
      if (t?.score) { deltaSum += r - t.score; deltaN++ }
    }

    const months = lastMonths(8)
    const perMonth = new Map(months.map(m => [m, 0]))
    for (const a of activity) {
      const k = monthKey(a.date)
      if (perMonth.has(k)) perMonth.set(k, (perMonth.get(k) ?? 0) + 1)
    }

    return {
      status, typeCount, minutes, hist, mean, tracked: tracked.size,
      bias: deltaN ? deltaSum / deltaN : 0,
      topGenres: [...genre.entries()].sort((a, b) => b[1] - a[1]).slice(0, 7),
      decades: [...decade.entries()].sort((a, b) => a[0].localeCompare(b[0])),
      trend: months.map(m => ({ label: m.slice(2).replace('-', '/'), value: perMonth.get(m) ?? 0 })),
    }
  }, [statuses, ratings, favorites, activity])

  if (!ready) return <div className="page"><p className="empty">Loading…</p></div>

  if (!user || !profile) {
    return (
      <div className="page">
        <div className="panel signed-out">
          <h1>Your dashboard</h1>
          <p className="muted">
            Charts of everything you watch — rating spread, genre mix, how your scores
            compare to the community, and how much time you've actually spent.
          </p>
          <div className="hero-actions">
            <button className="btn btn-primary" onClick={() => open('signup')}>Create an account</button>
            <button className="btn" onClick={() => open('signin')}>Sign in</button>
          </div>
        </div>
      </div>
    )
  }

  const hours = Math.round(d.minutes / 60)
  const days = (d.minutes / 1440).toFixed(1)

  const share = async () => {
    const url = `${window.location.origin}/u/${profile.username}`
    try {
      await navigator.clipboard.writeText(url)
      toast('Profile link copied to clipboard', 'ok')
    } catch {
      toast(url, 'ok')
    }
  }

  return (
    <div className="page">
      <div className="fyp-head">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="muted">Everything {profile.username} has watched, in numbers.</p>
        </div>
        <button className="btn btn-small" onClick={() => void share()}>🔗 Share my taste</button>
      </div>

      <div className="tiles">
        <div className="tile">
          <span className="tile-value">{d.tracked}</span>
          <span className="tile-label">titles tracked</span>
        </div>
        <div className="tile">
          <span className="tile-value">{hours.toLocaleString()}</span>
          <span className="tile-label">hours watched</span>
          <span className="tile-foot">≈ {days} days</span>
        </div>
        <div className="tile">
          <span className="tile-value">{d.mean ? d.mean.toFixed(1) : '—'}</span>
          <span className="tile-label">mean score</span>
          {d.mean > 0 && (
            <span className="tile-foot">
              {d.bias >= 0 ? '+' : ''}{d.bias.toFixed(1)} vs community
            </span>
          )}
        </div>
        <div className="tile">
          <span className="tile-value">{counts.reviews + counts.posts}</span>
          <span className="tile-label">contributions</span>
          <span className="tile-foot">{counts.reviews} reviews · {counts.posts} posts</span>
        </div>
      </div>

      <div className="dash-grid">
        <section className="panel chart-card">
          <h2>How you rate</h2>
          <p className="muted chart-sub">Distribution of your scores, 1–10</p>
          <Columns
            data={d.hist.map(h => ({ ...h, color: SERIES.blue }))}
            format={n => `${n} title${n === 1 ? '' : 's'}`}
            emptyNote="Rate some titles to see your scoring shape."
          />
        </section>

        <section className="panel chart-card">
          <h2>Library by status</h2>
          <p className="muted chart-sub">Where everything sits right now</p>
          <Donut
            centerLabel={String(Object.values(d.status).reduce((a, b) => a + b, 0))}
            data={STATUS_ORDER.map(s => ({
              label: STATUS_LABELS[s], value: d.status[s], color: STATUS_COLORS[s],
            }))}
            emptyNote="Add titles to your lists to see the split."
          />
        </section>

        <section className="panel chart-card">
          <h2>What you watch</h2>
          <p className="muted chart-sub">Movies vs series vs anime</p>
          <Donut
            centerLabel={String(d.tracked)}
            data={TYPE_ORDER.map(t => ({
              label: typeLabel(t), value: d.typeCount[t], color: TYPE_COLORS[t],
            }))}
            emptyNote="Track a few titles to see your mix."
          />
        </section>

        <section className="panel chart-card">
          <h2>Top genres</h2>
          <p className="muted chart-sub">Across everything you've tracked</p>
          <BarsH
            data={d.topGenres.map(([g, n]) => ({ label: g, value: n, color: SERIES.aqua }))}
            emptyNote="Your genre mix appears once you track something."
          />
        </section>

        <section className="panel chart-card wide">
          <h2>Activity</h2>
          <p className="muted chart-sub">List updates per month, last 8 months</p>
          <TrendLine data={d.trend} emptyNote="Track a few titles and your activity shows up here." />
        </section>

        <section className="panel chart-card">
          <h2>Era spread</h2>
          <p className="muted chart-sub">Release decade of what you track</p>
          <BarsH
            data={d.decades.map(([dec, n]) => ({ label: dec, value: n, color: SERIES.orange }))}
            emptyNote="No titles tracked yet."
          />
        </section>
      </div>

      <p className="muted dash-foot">
        Want different picks? <Link to="/recommendations">For You</Link> retunes from these numbers.
      </p>
    </div>
  )
}
