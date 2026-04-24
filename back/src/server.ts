import cors from 'cors'
import express from 'express'
import helmet from 'helmet'

import { logRouter, morganMiddleware } from './logger'
import BaseRouter from './routes/api'
import { s3Router } from './services/s3.service'

const app = express()
const DEFAULT_DEV_ORIGINS = ['http://localhost:5173', 'http://localhost:4173', 'http://localhost:3000']
const DEFAULT_PRODUCTION_ORIGINS = ['https://challenge-point-*.vercel.app']

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
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    optionsSuccessStatus: 204,
}

// Middleware
app.use(cors(corsOptions))
app.options('*', cors(corsOptions))

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
