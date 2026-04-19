import './loadEnv'
import mongoose from 'mongoose'

import server from './server'
import Logger from './logger'
mongoose.set('strictQuery', true)

const port = process.env.PORT || 8000

/** Shorten Mongo URI for logs (drop query string; do not print credentials in typical URIs). */
function mongoUriForLog(uri: string): string {
    const base = uri.split('?')[0]
    return base.replace(/\/\/([^@]+)@/, '//***@')
}

const MONGO_HINT =
    'Start MongoDB first. From the repo root: docker compose up -d   ' +
    'Or install MongoDB locally and use DB_CONNECTION_STRING=mongodb://127.0.0.1:27017/challenge-point'

const start = async () => {
    const uri = process.env.DB_CONNECTION_STRING?.trim()
    if (!uri) {
        Logger.error(
            'Cannot start: DB_CONNECTION_STRING is missing. Set it in back/src/.env.development (or dist/.env.production). ' +
                MONGO_HINT
        )
        process.exit(1)
    }

    Logger.info(`Connecting to MongoDB at ${mongoUriForLog(uri)} …`)

    try {
        await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 10_000,
        })
        Logger.info('MongoDB connection established.')
    } catch (error: unknown) {
        const err = error as Error & { name?: string }
        const name = err?.name ?? 'Error'
        const message = err?.message ?? String(error)

        Logger.error(`MongoDB connection failed (${name}): ${message}`)
        Logger.error(
            'The API will not start without a database. ' +
                'If nothing is listening on the host/port in DB_CONNECTION_STRING, that is the problem. ' +
                MONGO_HINT
        )
        process.exit(1)
    }

    try {
        server.listen(port, () => {
            Logger.info(`Express server started on port: ${port}`)
        })
    } catch (error) {
        Logger.error(`Failed to start HTTP server: ${error}`)
        process.exit(1)
    }
}

start()
