import { defineConfig, loadEnv } from 'vite'
import type { Plugin } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Mirrors api/tmdb.ts during `vite dev`, so local development behaves exactly
 * like production and TMDB_API_KEY never has to reach the browser bundle.
 */
function tmdbDevProxy(key: string): Plugin {
  const ALLOWED = /^(search\/(movie|tv)|movie\/\d+|tv\/\d+|configuration)$/
  return {
    name: 'tmdb-dev-proxy',
    configureServer(server) {
      server.middlewares.use('/api/tmdb', async (req, res) => {
        const send = (code: number, body: unknown) => {
          res.statusCode = code
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(body))
        }
        if (!key) return send(501, { error: 'TMDB_API_KEY is not set in .env.local' })

        const url = new URL(req.url ?? '', 'http://localhost')
        const path = url.searchParams.get('path') ?? ''
        if (!ALLOWED.test(path)) return send(400, { error: `Unsupported path: ${path}` })

        const upstream = new URL(`https://api.themoviedb.org/3/${path}`)
        for (const [k, v] of url.searchParams) if (k !== 'path') upstream.searchParams.set(k, v)

        const headers: Record<string, string> = { Accept: 'application/json' }
        if (key.startsWith('eyJ')) headers.Authorization = `Bearer ${key}`
        else upstream.searchParams.set('api_key', key)

        try {
          const r = await fetch(upstream, { headers })
          const text = await r.text()
          res.statusCode = r.status
          res.setHeader('Content-Type', 'application/json')
          res.end(text)
        } catch (e) {
          send(502, { error: String(e) })
        }
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  // Read TMDB_API_KEY from .env.local without exposing it via import.meta.env.
  const env = loadEnv(mode, process.cwd(), '')
  return { plugins: [react(), tmdbDevProxy(env.TMDB_API_KEY ?? '')] }
})
