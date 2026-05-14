import cors from 'cors'
import express, { type NextFunction, type Request, type Response } from 'express'
import helmet from 'helmet'

import { logRouter, morganMiddleware } from './logger'
import BaseRouter from './routes/api'
import { s3Router } from './services/s3.service'

/**
 * Per-request timeout. Without this Express has no upper bound on how long a request can hold
 * a handler — during the Phase 1 stress test, slow generation requests held handler context
 * for minutes, accumulating until auth (also event-loop bound) starved. 90s is well above the
 * worst-case happy-path generation (selection ~1s + 2x AI calls @ 45s each capped by OpenAI
 * timeout) but cuts off pathologically slow requests cleanly with a 504.
 */
const REQUEST_TIMEOUT_MS = 90_000

function requestTimeout(ms: number) {
    return (req: Request, res: Response, next: NextFunction): void => {
        const timer = setTimeout(() => {
            if (res.headersSent) return
            res.status(504).json({
                error: 'Request timed out',
                message: `Request exceeded ${ms}ms timeout.`,
            })
        }, ms)
        const clear = () => clearTimeout(timer)
        res.on('finish', clear)
        res.on('close', clear)
        next()
    }
}

const app = express()
const DEFAULT_DEV_ORIGINS = ['http://localhost:5173', 'http://localhost:4173', 'http://localhost:3000']
// Preview deployments match challenge-point-*.vercel.app; production alias is challenge-point.vercel.app (no extra hyphen).
const DEFAULT_PRODUCTION_ORIGINS = [
    'https://challenge-point.vercel.app',
    'https://challenge-point-*.vercel.app',
]

function parseAllowedOrigins(value?: string): string[] {
    const configuredOrigins = String(value ?? '')
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean)

    return Array.from(new Set([...DEFAULT_DEV_ORIGINS, ...DEFAULT_PRODUCTION_ORIGINS, ...configuredOrigins]))
}

function escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function matchesAllowedOrigin(origin: string, allowedOrigin: string): boolean {
    if (allowedOrigin.includes('*')) {
        const pattern = `^${escapeRegex(allowedOrigin).replace(/\\\*/g, '.*')}$`
        return new RegExp(pattern, 'i').test(origin)
    }

    return origin.toLowerCase() === allowedOrigin.toLowerCase()
}

const allowedOrigins = parseAllowedOrigins(process.env.CORS_ORIGINS)

const corsOptions: cors.CorsOptions = {
    origin(origin, callback) {
        if (!origin) {
            callback(null, true)
            return
        }

        const allowed = allowedOrigins.some((allowedOrigin) => matchesAllowedOrigin(origin, allowedOrigin))
        callback(null, allowed)
    },
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Refresh-Token', 'X-Requested-With'],
    optionsSuccessStatus: 204,
}

// Middleware
app.use(cors(corsOptions))
app.options('*', cors(corsOptions))

// Per-request timeout — applied early so it covers parsing, routing, and handler work.
app.use(requestTimeout(REQUEST_TIMEOUT_MS))

// Parsing JSON
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Use Morgan for HTTP logging integrated with Winston
app.use(morganMiddleware)

// Security
if (process.env.NODE_ENV === 'production') {
    app.use(helmet())
}

// Routes
app.use('/api', BaseRouter)
app.use('/api/s3', s3Router)
app.use('/api/log', logRouter)

export default app
