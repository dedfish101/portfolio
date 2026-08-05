/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { useStore } from '../lib/store'

interface AuthGate {
  /** Returns true if signed in; otherwise opens the sign-in modal and returns false. */
  require: () => boolean
  open: (mode?: 'signin' | 'signup') => void
}

const Ctx = createContext<AuthGate | null>(null)

export function useAuthGate(): AuthGate {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAuthGate must be used inside AuthProvider')
  return ctx
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user } = useStore()
  const [mode, setMode] = useState<'signin' | 'signup' | null>(null)

  const gate: AuthGate = {
    require: () => {
      if (user) return true
      setMode('signin')
      return false
    },
    open: (m = 'signin') => setMode(m),
  }

  // Close automatically once a session exists.
  useEffect(() => { if (user) setMode(null) }, [user])

  return (
    <Ctx.Provider value={gate}>
      {children}
      {mode && <AuthModal mode={mode} setMode={setMode} onClose={() => setMode(null)} />}
    </Ctx.Provider>
  )
}

function AuthModal({
  mode, setMode, onClose,
}: {
  mode: 'signin' | 'signup'
  setMode: (m: 'signin' | 'signup') => void
  onClose: () => void
}) {
  const { signIn, signUp } = useStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    setBusy(true)
    try {
      if (mode === 'signup') {
        await signUp(email.trim(), password)
        setSent(true) // if confirmations are on, the session won't exist yet
      } else {
        await signIn(email.trim(), password)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal" onMouseDown={e => e.stopPropagation()} role="dialog" aria-modal="true">
        <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        {sent ? (
          <>
            <h2>Check your email</h2>
            <p className="muted">
              We sent a confirmation link to <strong>{email}</strong>. Click it, then sign in.
            </p>
            <button className="btn btn-primary" onClick={() => { setSent(false); setMode('signin') }}>
              Back to sign in
            </button>
          </>
        ) : (
          <>
            <h2>{mode === 'signup' ? 'Create your account' : 'Welcome back'}</h2>
            <p className="muted modal-sub">
              {mode === 'signup'
                ? 'Track what you watch, rate it, and join the discussion.'
                : 'Sign in to keep tracking where you left off.'}
            </p>
            <form onSubmit={submit} className="auth-form">
              <label className="field">
                <span>Email</span>
                <input
                  className="input" type="email" required autoComplete="email"
                  value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com"
                />
              </label>
              <label className="field">
                <span>Password</span>
                <input
                  className="input" type="password" required minLength={8}
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 8 characters"
                />
              </label>
              {error && <p className="auth-error">{error}</p>}
              <button className="btn btn-primary" type="submit" disabled={busy}>
                {busy ? 'Working…' : mode === 'signup' ? 'Create account' : 'Sign in'}
              </button>
            </form>
            <p className="muted auth-switch">
              {mode === 'signup' ? 'Already have an account? ' : "Don't have an account? "}
              <button className="linkish" onClick={() => { setError(''); setMode(mode === 'signup' ? 'signin' : 'signup') }}>
                {mode === 'signup' ? 'Sign in' : 'Sign up'}
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  )
}

/** Wraps an action so it prompts for sign-in instead of failing for logged-out visitors. */
export function useGuarded() {
  const { require } = useAuthGate()
  return useCallback(
    (fn: () => void | Promise<void>) => () => {
      if (!require()) return
      void fn()
    },
    [require],
  )
}
