import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { requireExtensionKey } from './middleware/auth.js'
import { analyzeHandler } from './routes/analyze.js'
import { styleProfileHandler } from './routes/style-profile.js'

const app = express()
const PORT = process.env.PORT ?? 3000

// ── Middleware ────────────────────────────────────────────────────────────────

app.use(
  cors({
    // Allow requests from Chrome extensions and any localhost origin during development
    origin: (origin, callback) => {
      if (
        !origin ||
        origin.startsWith('chrome-extension://') ||
        origin.startsWith('http://localhost') ||
        origin.startsWith('http://127.0.0.1')
      ) {
        callback(null, true)
      } else {
        callback(new Error(`CORS: origin ${origin} not allowed`))
      }
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'X-Extension-Key'],
  }),
)

app.use(express.json({ limit: '1mb' }))

// ── Health check (no auth) ────────────────────────────────────────────────────

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// ── Protected API routes ──────────────────────────────────────────────────────

app.post('/api/analyze', requireExtensionKey, analyzeHandler)
app.post('/api/style-profile', requireExtensionKey, styleProfileHandler)

// ── 404 handler ───────────────────────────────────────────────────────────────

app.use((_req, res) => {
  res.status(404).json({ code: 'NOT_FOUND', message: 'Route not found' })
})

// ── Global error handler ──────────────────────────────────────────────────────

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[server] Unhandled error:', err)
  res.status(500).json({ code: 'INTERNAL_ERROR', message: err.message ?? 'Unknown error' })
})

// ── Start ──────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`✅  Post-call backend listening on port ${PORT}`)
  console.log(`   Health: http://localhost:${PORT}/health`)
  console.log(`   Analyze: POST http://localhost:${PORT}/api/analyze`)
  console.log(`   Style:   POST http://localhost:${PORT}/api/style-profile`)
})
