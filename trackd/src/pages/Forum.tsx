import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useStore } from '../lib/store'
import { useThreads } from '../lib/community'
import type { DbThread } from '../lib/supabase'
import { byId } from '../data/catalog'
import { useAuthGate } from '../components/Auth'
import { toastError } from '../components/Toast'

type Board = DbThread['board']

const BOARDS: { id: Board | 'all'; label: string; blurb: string }[] = [
  { id: 'all', label: 'All boards', blurb: 'Everything, newest first' },
  { id: 'general', label: 'General', blurb: 'Watercooler talk about anything on screen' },
  { id: 'recommendations', label: 'Recommendations', blurb: 'What should I watch next?' },
  { id: 'upcoming', label: 'Upcoming & News', blurb: 'Trailers, dates, hype and dread' },
  { id: 'title', label: 'Title discussions', blurb: 'Threads attached to a specific title' },
]

export default function Forum() {
  const { profile } = useStore()
  const { require: requireAuth } = useAuthGate()
  const navigate = useNavigate()
  const [board, setBoard] = useState<Board | 'all'>('all')
  const { threads, loading, createThread } = useThreads({ board })

  const [composing, setComposing] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newText, setNewText] = useState('')
  const [newBoard, setNewBoard] = useState<'general' | 'recommendations' | 'upcoming'>('general')
  const [busy, setBusy] = useState(false)

  const startComposing = () => {
    if (composing) { setComposing(false); return }
    if (!requireAuth()) return
    setComposing(true)
  }

  const create = async () => {
    if (!newTitle.trim() || !newText.trim()) return
    setBusy(true)
    try {
      const id = await createThread(profile?.id ?? null, newBoard, newTitle.trim(), newText.trim())
      setComposing(false)
      setNewTitle('')
      setNewText('')
      navigate(`/forum/thread/${id}`)
    } catch (e) {
      toastError(e)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page">
      <div className="forum-head">
        <h1 className="page-title">Forum</h1>
        <button className="btn btn-primary" onClick={startComposing}>
          {composing ? 'Cancel' : '+ New thread'}
        </button>
      </div>

      {composing && (
        <div className="panel compose">
          <h2>Start a thread</h2>
          <div className="compose-row">
            <select className="input input-small" value={newBoard} onChange={e => setNewBoard(e.target.value as typeof newBoard)}>
              <option value="general">General</option>
              <option value="recommendations">Recommendations</option>
              <option value="upcoming">Upcoming &amp; News</option>
            </select>
            <input className="input" placeholder="Thread title" value={newTitle} onChange={e => setNewTitle(e.target.value)} maxLength={140} />
          </div>
          <textarea className="input" rows={4} placeholder="Opening post — make it a good one" value={newText} onChange={e => setNewText(e.target.value)} maxLength={5000} />
          <button className="btn btn-primary btn-small" onClick={() => void create()} disabled={busy || !newTitle.trim() || !newText.trim()}>
            {busy ? 'Posting…' : 'Post thread'}
          </button>
        </div>
      )}

      <div className="board-tabs">
        {BOARDS.map(b => (
          <button key={b.id} className={`tab ${board === b.id ? 'active' : ''}`} onClick={() => setBoard(b.id)} title={b.blurb}>
            {b.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="empty">Loading threads…</p>
      ) : (
        <div className="thread-list">
          {threads.map(t => {
            const linked = t.title_id ? byId.get(t.title_id) : undefined
            return (
              <Link key={t.id} to={`/forum/thread/${t.id}`} className="thread-row">
                <span className="home-thread-avatar">{t.author?.avatar ?? '💬'}</span>
                <div className="thread-row-main">
                  <div className="home-thread-title">{t.title}</div>
                  <div className="home-thread-meta">
                    {t.author?.username ?? 'someone'} · {BOARDS.find(b => b.id === t.board)?.label}
                    {linked && <> · <span className="thread-linked">{linked.name}</span></>}
                  </div>
                </div>
                <div className="thread-row-side">
                  <div className="thread-count">{t.post_count} posts</div>
                  <div className="muted">last: {t.last_post_at.slice(0, 10)}</div>
                </div>
              </Link>
            )
          })}
          {threads.length === 0 && <p className="empty">No threads on this board yet — start one.</p>}
        </div>
      )}
    </div>
  )
}
