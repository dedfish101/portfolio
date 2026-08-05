/**
 * TMDB proxy (Vercel serverless function).
 *
 * Keeps TMDB_API_KEY server-side — it is never shipped to the browser — and lets
 * responses be cached at the edge, which keeps us well inside TMDB's rate limits.
 *
 * Returns 501 when no key is configured, which the client treats as
 * "movies unavailable" rather than as an error.
 */

const ALLOWED = /^(search\/(movie|tv)|movie\/\d+|tv\/\d+|configuration)$/

export const config = { runtime: 'edge' }

export default async function handler(req: Request): Promise<Response> {
  const key = process.env.TMDB_API_KEY ?? ''
  if (!key) {
    return Response.json(
      { error: 'TMDB_API_KEY is not configured on the server.' },
      { status: 501 },
    )
  }

  const url = new URL(req.url)
  const path = url.searchParams.get('path') ?? ''
  if (!ALLOWED.test(path)) {
    return Response.json({ error: `Unsupported path: ${path}` }, { status: 400 })
  }

  const upstream = new URL(`https://api.themoviedb.org/3/${path}`)
  for (const [k, v] of url.searchParams) {
    if (k !== 'path') upstream.searchParams.set(k, v)
  }

  const headers: Record<string, string> = { Accept: 'application/json' }
  // v4 read tokens are JWTs and use the Authorization header; v3 keys go in the query.
  if (key.startsWith('eyJ')) headers.Authorization = `Bearer ${key}`
  else upstream.searchParams.set('api_key', key)

  const res = await fetch(upstream, { headers })
  if (!res.ok) {
    return Response.json({ error: `TMDB responded ${res.status}` }, { status: res.status })
  }

  return new Response(res.body, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      // Cache hard: title metadata barely changes, and this is what keeps us
      // comfortably inside TMDB's rate limits under real traffic.
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
    },
  })
}
