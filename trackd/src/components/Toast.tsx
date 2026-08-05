/* eslint-disable react-refresh/only-export-components */
import { useEffect, useState } from 'react'

interface Toast { id: number; text: string; kind: 'error' | 'ok' }

type Listener = (t: Toast) => void
const listeners = new Set<Listener>()
let nextId = 0

/** Fire-and-forget notification, usable from anywhere including non-React code. */
export function toast(text: string, kind: 'error' | 'ok' = 'error') {
  const t = { id: ++nextId, text, kind }
  for (const l of listeners) l(t)
}

export function toastError(e: unknown) {
  toast(e instanceof Error ? e.message : String(e), 'error')
}

export function Toaster() {
  const [items, setItems] = useState<Toast[]>([])

  useEffect(() => {
    const add: Listener = t => {
      setItems(list => [...list, t])
      setTimeout(() => setItems(list => list.filter(x => x.id !== t.id)), 4000)
    }
    listeners.add(add)
    return () => { listeners.delete(add) }
  }, [])

  if (!items.length) return null
  return (
    <div className="toaster" role="status" aria-live="polite">
      {items.map(t => (
        <div key={t.id} className={`toast toast-${t.kind}`}>{t.text}</div>
      ))}
    </div>
  )
}
