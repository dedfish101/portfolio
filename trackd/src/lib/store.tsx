/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase, friendlyError } from './supabase'
import type { DbEntry, DbProfile } from './supabase'
import type { Title } from '../data/catalog'

export type WatchStatus = 'watching' | 'completed' | 'planned' | 'dropped'

export interface Prefs {
  hideAnime: boolean
  hideMovies: boolean
  hideSeries: boolean
}

export interface Profile {
  id: string
  username: string
  avatar: string
  bio: string
  joined: string
}

export interface Activity {
  id: string
  text: string
  titleId: string
  date: string
}

interface StoreApi {
  ready: boolean
  user: User | null
  profile: Profile | null
  prefs: Prefs
  statuses: Record<string, WatchStatus>
  ratings: Record<string, number>
  favorites: string[]
  activity: Activity[]

  signUp: (email: string, password: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>

  setStatus: (titleId: string, status: WatchStatus | null) => Promise<void>
  setRating: (titleId: string, rating: number | null) => Promise<void>
  toggleFavorite: (titleId: string) => Promise<void>
  updateProfile: (p: { username?: string; bio?: string; avatar?: string }) => Promise<void>
  setPrefs: (p: Partial<Prefs>) => Promise<void>
}

const DEFAULT_PREFS: Prefs = { hideAnime: false, hideMovies: false, hideSeries: false }

const Ctx = createContext<StoreApi | null>(null)

function entriesToMaps(rows: DbEntry[]) {
  const statuses: Record<string, WatchStatus> = {}
  const ratings: Record<string, number> = {}
  const favorites: string[] = []
  const activity: Activity[] = []
  for (const r of rows) {
    if (r.status) statuses[r.title_id] = r.status
    if (r.rating !== null) ratings[r.title_id] = r.rating
    if (r.favorite) favorites.push(r.title_id)
    const bits: string[] = []
    if (r.status) bits.push(`marked as ${r.status}`)
    if (r.rating !== null) bits.push(`rated ${r.rating}/10`)
    if (bits.length) {
      activity.push({
        id: r.title_id,
        text: bits.join(' · '),
        titleId: r.title_id,
        date: r.updated_at.slice(0, 10),
      })
    }
  }
  activity.sort((a, b) => b.date.localeCompare(a.date))
  return { statuses, ratings, favorites, activity }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  const [session, setSession] = useState<Session | null>(null)
  const [row, setRow] = useState<DbProfile | null>(null)
  const [entries, setEntries] = useState<DbEntry[]>([])

  const user = session?.user ?? null

  useEffect(() => {
    let alive = true
    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return
      setSession(data.session)
      if (!data.session) setReady(true)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s)
      if (!s) {
        setRow(null)
        setEntries([])
        setReady(true)
      }
    })
    return () => { alive = false; sub.subscription.unsubscribe() }
  }, [])

  // Load the signed-in user's profile and lists.
  useEffect(() => {
    if (!user) return
    let alive = true
    void (async () => {
      const [p, e] = await Promise.all([
        supabase.from('profiles').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('entries').select('*').eq('user_id', user.id),
      ])
      if (!alive) return
      if (p.data) setRow(p.data as DbProfile)
      setEntries((e.data ?? []) as DbEntry[])
      setReady(true)
    })()
    return () => { alive = false }
  }, [user])

  const { statuses, ratings, favorites, activity } = useMemo(() => entriesToMaps(entries), [entries])

  // Derived objects must be memoised, or the store value below changes identity on
  // every render and re-renders every consumer in the app.
  const prefs: Prefs = useMemo(() => row
    ? { hideAnime: row.hide_anime, hideMovies: row.hide_movies, hideSeries: row.hide_series }
    : DEFAULT_PREFS, [row])

  const profile: Profile | null = useMemo(() => row
    ? { id: row.id, username: row.username, avatar: row.avatar, bio: row.bio, joined: row.created_at.slice(0, 10) }
    : null, [row])

  /** Upserts one field of the user's entry for a title, keeping local state in sync. */
  const patchEntry = useCallback(async (titleId: string, patch: Partial<DbEntry>) => {
    if (!user) throw new Error('You need to be signed in to do that.')
    const existing = entries.find(e => e.title_id === titleId)
    const next: DbEntry = {
      user_id: user.id,
      title_id: titleId,
      status: existing?.status ?? null,
      rating: existing?.rating ?? null,
      favorite: existing?.favorite ?? false,
      updated_at: new Date().toISOString(),
      ...patch,
    }
    // An entry with nothing left on it is just clutter.
    const empty = next.status === null && next.rating === null && !next.favorite
    if (empty) {
      const { error } = await supabase.from('entries').delete().eq('user_id', user.id).eq('title_id', titleId)
      if (error) throw new Error(friendlyError(error))
      setEntries(es => es.filter(e => e.title_id !== titleId))
      return
    }
    const { error } = await supabase.from('entries').upsert(next, { onConflict: 'user_id,title_id' })
    if (error) throw new Error(friendlyError(error))
    setEntries(es => {
      const rest = es.filter(e => e.title_id !== titleId)
      return [...rest, next]
    })
  }, [user, entries])

  const api = useMemo<StoreApi>(() => ({
    ready, user, profile, prefs, statuses, ratings, favorites, activity,

    async signUp(email, password) {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) throw new Error(friendlyError(error))
    },
    async signIn(email, password) {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw new Error(friendlyError(error))
    },
    async signOut() {
      await supabase.auth.signOut()
    },

    setStatus: (titleId, status) => patchEntry(titleId, { status }),
    setRating: (titleId, rating) => patchEntry(titleId, { rating }),
    toggleFavorite: (titleId) => {
      const cur = entries.find(e => e.title_id === titleId)?.favorite ?? false
      return patchEntry(titleId, { favorite: !cur })
    },

    async updateProfile(p) {
      if (!row) throw new Error('You need to be signed in to do that.')
      const { data, error } = await supabase.from('profiles').update(p).eq('id', row.id).select().single()
      if (error) throw new Error(friendlyError(error))
      setRow(data as DbProfile)
    },

    async setPrefs(p) {
      if (!row) throw new Error('You need to be signed in to do that.')
      const patch = {
        ...(p.hideAnime !== undefined ? { hide_anime: p.hideAnime } : {}),
        ...(p.hideMovies !== undefined ? { hide_movies: p.hideMovies } : {}),
        ...(p.hideSeries !== undefined ? { hide_series: p.hideSeries } : {}),
      }
      const prev = row
      setRow({ ...row, ...patch }) // optimistic: toggles should feel instant
      const { data, error } = await supabase.from('profiles').update(patch).eq('id', row.id).select().single()
      if (error) { setRow(prev); throw new Error(friendlyError(error)) }
      setRow(data as DbProfile)
    },
  }), [ready, user, profile, prefs, statuses, ratings, favorites, activity, row, entries, patchEntry])

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>
}

export function useStore(): StoreApi {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useStore must be used inside StoreProvider')
  return ctx
}

/** Whether a title passes the user's content preferences (hide anime / movies / series). */
export function isVisible(t: Title, prefs: Prefs): boolean {
  if (prefs.hideAnime && t.type === 'anime') return false
  if (prefs.hideMovies && t.type === 'movie') return false
  if (prefs.hideSeries && t.type === 'series') return false
  return true
}

export const STATUS_LABELS: Record<WatchStatus, string> = {
  watching: 'Watching',
  completed: 'Completed',
  planned: 'Plan to Watch',
  dropped: 'Dropped',
}
