import './loadEnv'
import mongoose from 'mongoose'

import Logger from './logger'
import { syncConstraintRegistryToMongo } from './system/sync-constraints'

async function main() {
    const uri = process.env.DB_CONNECTION_STRING?.trim()
    if (!uri) {
        throw new Error('DB_CONNECTION_STRING is required to sync constraints.')
    }

    await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 10_000,
    })

    try {
        const result = await syncConstraintRegistryToMongo()
        Logger.info(`[constraint-sync] completed (${result.created} created, ${result.updated} updated).`)
    } finally {
        await mongoose.disconnect()
    }
}

main().catch((error) => {
    Logger.error(`[constraint-sync] failed: ${error instanceof Error ? error.message : String(error)}`)
    process.exit(1)
})

