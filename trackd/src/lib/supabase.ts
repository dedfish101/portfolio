import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!url || !key) {
  throw new Error(
    'Missing VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY. ' +
    'Copy .env.example to .env.local (local dev) or set them in your host\'s environment variables.',
  )
}

// The publishable key is meant to ship in client bundles; every table is guarded
// by row level security, so it grants nothing beyond what an anonymous visitor may do.
export const supabase = createClient(url, key, {
  auth: { persistSession: true, autoRefreshToken: true },
})

export interface DbProfile {
  id: string
  user_id: string | null
  username: string
  avatar: string
  bio: string
  hide_anime: boolean
  hide_movies: boolean
  hide_series: boolean
  created_at: string
}

export interface DbEntry {
  user_id: string
  title_id: string
  status: 'watching' | 'completed' | 'planned' | 'dropped' | null
  rating: number | null
  favorite: boolean
  updated_at: string
}

export interface DbReview {
  id: string
  author_id: string
  title_id: string
  rating: number
  body: string
  spoiler: boolean
  helpful_count: number
  created_at: string
  author: { username: string; avatar: string } | null
}

export interface DbThread {
  id: string
  board: 'general' | 'recommendations' | 'upcoming' | 'title'
  title_id: string | null
  title: string
  author_id: string
  post_count: number
  last_post_at: string
  created_at: string
  author: { username: string; avatar: string } | null
}

export interface DbPost {
  id: string
  thread_id: string
  author_id: string
  body: string
  like_count: number
  created_at: string
  author: { username: string; avatar: string } | null
}

const AUTHOR = 'author:profiles!inner(username,avatar)'

export const REVIEW_SELECT = `id,author_id,title_id,rating,body,spoiler,helpful_count,created_at,${AUTHOR}`
export const THREAD_SELECT = `id,board,title_id,title,author_id,post_count,last_post_at,created_at,${AUTHOR}`
export const POST_SELECT = `id,thread_id,author_id,body,like_count,created_at,${AUTHOR}`

/** Turns Supabase/Postgres errors into something worth showing a person. */
export function friendlyError(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e)
  if (msg.includes('duplicate key') && msg.includes('reviews')) return 'You have already reviewed this title.'
  if (msg.includes('row-level security')) return 'You need to be signed in to do that.'
  if (msg.includes('profiles_username_key')) return 'That username is taken.'
  if (msg.includes('Invalid login credentials')) return 'Wrong email or password.'
  if (msg.includes('already registered')) return 'That email already has an account — try signing in.'
  if (msg.toLowerCase().includes('password')) return msg
  return msg
}
