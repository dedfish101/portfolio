import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useStore } from '../lib/store'
import { useThread } from '../lib/community'
import { byId } from '../data/catalog'
import { useAuthGate } from '../components/Auth'
import { toastError } from '../components/Toast'

export default function ThreadView() {
  const { id } = useParams()
  const { user, profile } = useStore()
  const { require: requireAuth, open } = useAuthGate()
  const { thread, posts, liked, loading, reply, likePost } = useThread(id, user?.id ?? null, profile?.id ?? null)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)

  if (loading) return <div className="page page-narrow"><p className="empty">Loading thread…</p></div>

  if (!thread) {
    return (
      <div className="page page-narrow">
        <h1 className="page-title">Thread not found</h1>
        <Link to="/forum" className="btn">Back to Forum</Link>
      </div>
    )
  }

  const linked = thread.title_id ? byId.get(thread.title_id) : undefined

  const submit = async () => {
    if (!text.trim()) return
    if (!requireAuth()) return
    setBusy(true)
    try {
      await reply(text.trim())
      setText('')
    } catch (e) {
      toastError(e)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page page-narrow">
      <Link to="/forum" className="crumb">← Forum</Link>
      <h1 className="thread-title">{thread.title}</h1>
      <p className="muted">
        Started by {thread.author?.username ?? 'someone'} · {thread.created_at.slice(0, 10)}
        {linked && <> · about <Link to={`/title/${linked.id}`}>{linked.name}</Link></>}
      </p>

      <div className="posts">
        {posts.map((p, i) => (
          <article key={p.id} className={`post ${i === 0 ? 'post-op' : ''}`}>
            <div className="post-side">
              <span className="avatar-sm">{p.author?.avatar ?? '👤'}</span>
            </div>
            <div className="post-main">
              <div className="post-head">
                <strong>{p.author?.username ?? 'someone'}</strong>
                {i === 0 && <span className="op-badge">OP</span>}
                <span className="muted">{p.created_at.slice(0, 10)}</span>
              </div>
              <p className="post-text">{p.body}</p>
              <button
                className={`helpful-btn ${liked.includes(p.id) ? 'voted' : ''}`}
                onClick={() => {
                  if (!requireAuth()) return
                  likePost(p.id).catch(toastError)
                }}
              >
                ❤ {p.like_count}
              </button>
            </div>
          </article>
        ))}
      </div>

      {user ? (
        <div className="reply-box">
          <textarea
            className="input"
            rows={3}
            placeholder={`Reply as ${profile?.username ?? 'you'}…`}
            value={text}
            maxLength={5000}
            onChange={e => setText(e.target.value)}
          />
          <button className="btn btn-primary btn-small" onClick={() => void submit()} disabled={busy || !text.trim()}>
            {busy ? 'Posting…' : 'Post reply'}
          </button>
        </div>
      ) : (
        <div className="panel signin-prompt">
          <p className="muted">Sign in to join this discussion.</p>
          <button className="btn btn-primary btn-small" onClick={() => open('signin')}>Sign in</button>
        </div>
      )}
    </div>
  )
}
