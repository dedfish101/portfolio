import { useCallback, useEffect, useState } from 'react'
import { supabase, friendlyError, REVIEW_SELECT, THREAD_SELECT, POST_SELECT } from './supabase'
import type { DbReview, DbThread, DbPost } from './supabase'

type Board = DbThread['board']

/** Reviews for one title, plus the current user's "helpful" votes. */
export function useReviews(titleId: string, userId: string | null, profileId: string | null) {
  const [reviews, setReviews] = useState<DbReview[]>([])
  const [voted, setVoted] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('reviews').select(REVIEW_SELECT)
      .eq('title_id', titleId)
      .order('helpful_count', { ascending: false })
    const rows = (data ?? []) as unknown as DbReview[]
    setReviews(rows)
    if (userId && rows.length) {
      const { data: v } = await supabase
        .from('review_helpful').select('review_id')
        .eq('user_id', userId).in('review_id', rows.map(r => r.id))
      setVoted((v ?? []).map(x => x.review_id as string))
    } else {
      setVoted([])
    }
    setLoading(false)
  }, [titleId, userId])

  useEffect(() => { setLoading(true); void load() }, [load])

  const addReview = useCallback(async (rating: number, body: string, spoiler: boolean) => {
    if (!profileId) throw new Error('You need to be signed in to review.')
    const { error } = await supabase.from('reviews')
      .insert({ author_id: profileId, title_id: titleId, rating, body, spoiler })
    if (error) throw new Error(friendlyError(error))
    await load()
  }, [profileId, titleId, load])

  const voteHelpful = useCallback(async (reviewId: string) => {
    if (!userId) throw new Error('You need to be signed in to vote.')
    if (voted.includes(reviewId)) return
    const { error } = await supabase.from('review_helpful').insert({ review_id: reviewId, user_id: userId })
    if (error) throw new Error(friendlyError(error))
    setVoted(v => [...v, reviewId])
    setReviews(rs => rs.map(r => r.id === reviewId ? { ...r, helpful_count: r.helpful_count + 1 } : r))
  }, [userId, voted])

  return { reviews, voted, loading, addReview, voteHelpful }
}

/** Thread listings. Pass a board, or "all"; pass titleId to scope to one title. */
export function useThreads(opts: { board?: Board | 'all'; titleId?: string; limit?: number }) {
  const { board = 'all', titleId, limit } = opts
  const [threads, setThreads] = useState<DbThread[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    let q = supabase.from('threads').select(THREAD_SELECT).order('last_post_at', { ascending: false })
    if (board !== 'all') q = q.eq('board', board)
    if (titleId) q = q.eq('title_id', titleId)
    if (limit) q = q.limit(limit)
    const { data } = await q
    setThreads((data ?? []) as unknown as DbThread[])
    setLoading(false)
  }, [board, titleId, limit])

  useEffect(() => { setLoading(true); void load() }, [load])

  const createThread = useCallback(async (
    profileId: string | null, newBoard: Board, title: string, body: string, forTitleId?: string,
  ): Promise<string> => {
    if (!profileId) throw new Error('You need to be signed in to post.')
    const { data, error } = await supabase.from('threads')
      .insert({ board: newBoard, title, author_id: profileId, title_id: forTitleId ?? null })
      .select('id').single()
    if (error) throw new Error(friendlyError(error))
    const threadId = data.id as string
    const { error: pe } = await supabase.from('posts')
      .insert({ thread_id: threadId, author_id: profileId, body })
    if (pe) throw new Error(friendlyError(pe))
    await load()
    return threadId
  }, [load])

  return { threads, loading, createThread, reload: load }
}

/** One thread with its posts, plus the current user's likes. */
export function useThread(threadId: string | undefined, userId: string | null, profileId: string | null) {
  const [thread, setThread] = useState<DbThread | null>(null)
  const [posts, setPosts] = useState<DbPost[]>([])
  const [liked, setLiked] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!threadId) { setLoading(false); return }
    const [t, p] = await Promise.all([
      supabase.from('threads').select(THREAD_SELECT).eq('id', threadId).maybeSingle(),
      supabase.from('posts').select(POST_SELECT).eq('thread_id', threadId).order('created_at'),
    ])
    setThread((t.data ?? null) as unknown as DbThread | null)
    const rows = (p.data ?? []) as unknown as DbPost[]
    setPosts(rows)
    if (userId && rows.length) {
      const { data: l } = await supabase
        .from('post_likes').select('post_id')
        .eq('user_id', userId).in('post_id', rows.map(r => r.id))
      setLiked((l ?? []).map(x => x.post_id as string))
    } else {
      setLiked([])
    }
    setLoading(false)
  }, [threadId, userId])

  useEffect(() => { setLoading(true); void load() }, [load])

  const reply = useCallback(async (body: string) => {
    if (!profileId) throw new Error('You need to be signed in to reply.')
    if (!threadId) return
    const { error } = await supabase.from('posts').insert({ thread_id: threadId, author_id: profileId, body })
    if (error) throw new Error(friendlyError(error))
    await load()
  }, [profileId, threadId, load])

  const likePost = useCallback(async (postId: string) => {
    if (!userId) throw new Error('You need to be signed in to like posts.')
    if (liked.includes(postId)) return
    const { error } = await supabase.from('post_likes').insert({ post_id: postId, user_id: userId })
    if (error) throw new Error(friendlyError(error))
    setLiked(l => [...l, postId])
    setPosts(ps => ps.map(p => p.id === postId ? { ...p, like_count: p.like_count + 1 } : p))
  }, [userId, liked])

  return { thread, posts, liked, loading, reply, likePost }
}

/** How much a given profile has contributed, for their profile page. */
export function useAuthorCounts(profileId: string | null) {
  const [counts, setCounts] = useState({ reviews: 0, posts: 0 })
  useEffect(() => {
    if (!profileId) { setCounts({ reviews: 0, posts: 0 }); return }
    void (async () => {
      const [r, p] = await Promise.all([
        supabase.from('reviews').select('*', { count: 'exact', head: true }).eq('author_id', profileId),
        supabase.from('posts').select('*', { count: 'exact', head: true }).eq('author_id', profileId),
      ])
      setCounts({ reviews: r.count ?? 0, posts: p.count ?? 0 })
    })()
  }, [profileId])
  return counts
}

/** Aggregate counts for the home page hero. */
export function useSiteStats() {
  const [stats, setStats] = useState({ posts: 0, members: 0 })
  useEffect(() => {
    void (async () => {
      const [p, m] = await Promise.all([
        supabase.from('posts').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
      ])
      setStats({ posts: p.count ?? 0, members: m.count ?? 0 })
    })()
  }, [])
  return stats
}
