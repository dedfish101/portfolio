import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { typeLabel } from '../data/catalog'
import type { MediaItem } from '../lib/media'
import { cacheMedia } from '../lib/media'
import { useStore, STATUS_LABELS } from '../lib/store'
import type { WatchStatus } from '../lib/store'
import { useAuthGate } from './Auth'
import { toastError } from './Toast'

const PALETTES = [
  ['#1a2980', '#26d0ce'], ['#0f2027', '#78ffd6'], ['#3a1c71', '#ffaf7b'],
  ['#141e30', '#5b86e5'], ['#134e5e', '#71b280'], ['#c33764', '#f8b500'],
  ['#42275a', '#f8cdda'], ['#232526', '#ff512f'], ['#200122', '#6f0000'],
  ['#fc466b', '#3f5efb'], ['#3c1053', '#ad5389'], ['#355c7d', '#c06c84'],
  ['#0f3443', '#34e89e'], ['#2b5876', '#4e4376'], ['#0f0c29', '#24c6dc'],
  ['#16222a', '#3a6073'], ['#1f1c2c', '#928dab'], ['#870000', '#190a05'],
  ['#20002c', '#cbb4d4'], ['#e65c00', '#f9d423'], ['#3e5151', '#decba4'],
  ['#0b486b', '#f56217'], ['#b31217', '#e6a919'], ['#485563', '#29323c'],
  ['#f46b45', '#eea849'], ['#5a3f37', '#8fd3a4'], ['#1e3c72', '#ffb347'],
  ['#4b134f', '#c94b4b'], ['#2c3e50', '#bdc3c7'], ['#ff416c', '#fff047'],
  ['#654ea3', '#eaafc8'], ['#0f2027', '#e0a458'], ['#2b0000', '#a0a0a0'],
  ['#0e3b43', '#e94f37'], ['#3d0c11', '#d9a441'], ['#003973', '#e5e5be'],
  ['#d31027', '#ea384d'],
]

export function Poster({ title, size = 'md' }: { title: MediaItem; size?: 'sm' | 'md' | 'lg' }) {
  const [broken, setBroken] = useState(false)
  const [c1, c2] = PALETTES[title.palette % PALETTES.length]
  const initials = title.name.split(/\s+/).slice(0, 2).map(w => w[0]).join('')
  const img = !broken && title.poster ? title.poster : null
  return (
    <div className={`poster poster-${size}`} style={{ background: `linear-gradient(150deg, ${c1}, ${c2})` }}>
      {img ? (
        <img className="poster-img" src={img} alt={`${title.name} poster`} onError={() => setBroken(true)} />
      ) : (
        <>
          <span className="poster-initials">{initials}</span>
          <span className="poster-name">{title.name}</span>
        </>
      )}
      {title.status === 'upcoming' && <span className="poster-badge">SOON</span>}
    </div>
  )
}

export function ScorePill({ score }: { score: number }) {
  if (!score) return <span className="pill pill-muted">TBA</span>
  const cls = score >= 8.5 ? 'pill-gold' : score >= 7.5 ? 'pill-green' : 'pill-blue'
  return <span className={`pill ${cls}`}>★ {score.toFixed(1)}</span>
}

const QUICK_OPTIONS: { status: WatchStatus; icon: string }[] = [
  { status: 'watching', icon: '▶' },
  { status: 'completed', icon: '✓' },
  { status: 'planned', icon: '＋' },
  { status: 'dropped', icon: '✕' },
]

const MENU_W = 190

/** One-click list control that sits under a card — no need to open the title page. */
export function QuickStatus({ titleId, item }: { titleId: string; item?: MediaItem }) {
  const { statuses, setStatus, favorites, toggleFavorite } = useStore()
  const { require: requireAuth } = useAuthGate()
  const current = statuses[titleId]
  const isFav = favorites.includes(titleId)
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ left: 0, top: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // The menu is viewport-positioned so that card and row overflow can't clip it, which
  // means it must be re-anchored to its button whenever anything moves. Tracking that with
  // a frame loop rather than scroll listeners covers every cause of movement — page scroll,
  // sideways row scroll, layout shift — and costs nothing while the menu is closed.
  const place = useCallback(() => {
    const r = btnRef.current?.getBoundingClientRect()
    if (!r) return
    const offscreen = r.bottom < 0 || r.top > window.innerHeight || r.right < 0 || r.left > window.innerWidth
    if (offscreen) { setOpen(false); return }
    const menuH = menuRef.current?.offsetHeight ?? (current ? 236 : 196)
    const flip = r.bottom + 6 + menuH > window.innerHeight - 8
    const left = Math.max(8, Math.min(r.left, window.innerWidth - MENU_W - 8))
    const top = flip ? Math.max(8, r.top - menuH - 6) : r.bottom + 6
    setPos(p => (p.left === left && p.top === top ? p : { left, top }))
  }, [current])

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node
      if (btnRef.current?.contains(target) || menuRef.current?.contains(target)) return
      setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    let raf = requestAnimationFrame(function tick() {
      place()
      raf = requestAnimationFrame(tick)
    })
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
      cancelAnimationFrame(raf)
    }
  }, [open, place])

  const toggleMenu = () => {
    if (open) { setOpen(false); return }
    place()
    setOpen(true)
  }

  const pick = (s: WatchStatus | null) => {
    setOpen(false)
    if (!requireAuth()) return
    // Cache the title first, so lists can render it even if the provider is slow later.
    const write = async () => {
      if (item) await cacheMedia(item)
      await setStatus(titleId, s !== null && current === s ? null : s)
    }
    write().catch(toastError)
  }

  const onFavorite = () => {
    if (!requireAuth()) return
    const write = async () => {
      if (item) await cacheMedia(item)
      await toggleFavorite(titleId)
    }
    write().catch(toastError)
  }

  return (
    <div className="quick-bar">
      <button
        ref={btnRef}
        className={`quick-btn ${current ? `has-status st-${current}` : ''}`}
        onClick={toggleMenu}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="quick-label">{current ? STATUS_LABELS[current] : '+ Add to list'}</span>
        <span className="quick-caret">▾</span>
      </button>
      <button
        className={`quick-fav ${isFav ? 'active' : ''}`}
        onClick={onFavorite}
        title={isFav ? 'Remove from favorites' : 'Add to favorites'}
        aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
      >
        {isFav ? '♥' : '♡'}
      </button>

      {open && (
        <div
          ref={menuRef}
          className="quick-menu"
          role="menu"
          style={{ left: pos.left, top: pos.top, width: MENU_W }}
        >
          {QUICK_OPTIONS.map(o => (
            <button
              key={o.status}
              className={`quick-item st-${o.status} ${current === o.status ? 'active' : ''}`}
              onClick={() => pick(o.status)}
              role="menuitem"
            >
              <span className="quick-item-icon">{o.icon}</span>
              {STATUS_LABELS[o.status]}
              {current === o.status && <span className="quick-item-check">✓</span>}
            </button>
          ))}
          {current && (
            <button className="quick-item quick-remove" onClick={() => pick(null)} role="menuitem">
              <span className="quick-item-icon">⌫</span>
              Remove from list
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export function TitleCard({ title, note }: { title: MediaItem; note?: string }) {
  const { ratings } = useStore()
  const myRating = ratings[title.id]
  return (
    <div className="card-wrap">
      <Link to={`/title/${title.id}`} className="card">
        <Poster title={title} />
        <div className="card-body">
          <div className="card-title">{title.name}</div>
          <div className="card-meta">
            <span className={`type-tag type-${title.type}`}>{typeLabel(title.type)}</span>
            <span className="card-year">{title.year}</span>
            <ScorePill score={title.score} />
          </div>
          {note && <div className="card-note">{note}</div>}
          {myRating !== undefined && (
            <div className="card-mine"><span className="mini-rating">Your score: {myRating}/10</span></div>
          )}
        </div>
      </Link>
      <QuickStatus titleId={title.id} item={title} />
    </div>
  )
}

export function Row({ heading, sub, children }: { heading: string; sub?: string; children: React.ReactNode }) {
  return (
    <section className="row-section">
      <div className="row-head">
        <h2>{heading}</h2>
        {sub && <p className="row-sub">{sub}</p>}
      </div>
      <div className="row-scroll">{children}</div>
    </section>
  )
}

export function Stars({ value, onChange }: { value: number | null; onChange: (v: number | null) => void }) {
  return (
    <div className="stars" role="radiogroup" aria-label="Your rating">
      {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
        <button
          key={n}
          className={`star ${value !== null && n <= value ? 'on' : ''}`}
          onClick={() => onChange(value === n ? null : n)}
          title={`${n}/10`}
          aria-label={`Rate ${n} out of 10`}
        >★</button>
      ))}
      {value !== null && <span className="stars-value">{value}/10</span>}
    </div>
  )
}

const STATUS_ORDER: WatchStatus[] = ['watching', 'completed', 'planned', 'dropped']

export function StatusPicker({ titleId, item }: { titleId: string; item?: MediaItem }) {
  const { statuses, setStatus } = useStore()
  const { require: requireAuth } = useAuthGate()
  const current = statuses[titleId]
  return (
    <div className="status-picker">
      {STATUS_ORDER.map(s => (
        <button
          key={s}
          className={`status-btn st-${s} ${current === s ? 'active' : ''}`}
          onClick={() => {
            if (!requireAuth()) return
            const write = async () => {
              if (item) await cacheMedia(item)
              await setStatus(titleId, current === s ? null : s)
            }
            write().catch(toastError)
          }}
        >
          {STATUS_LABELS[s]}
        </button>
      ))}
    </div>
  )
}

export function daysUntil(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000)
}

export function formatDate(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

export function formatMembers(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
  if (n >= 1000) return Math.round(n / 1000) + 'K'
  return String(n)
}
