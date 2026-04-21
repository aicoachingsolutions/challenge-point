import './loadEnv'
import mongoose from 'mongoose'

import Logger from './logger'
import { syncAffordanceRegistryToMongo } from './system/sync-affordances'

async function main() {
    const uri = process.env.DB_CONNECTION_STRING?.trim()
    if (!uri) {
        throw new Error('DB_CONNECTION_STRING is required to sync affordances.')
    }

    await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 10_000,
    })

    try {
        const result = await syncAffordanceRegistryToMongo()
        Logger.info(`[affordance-sync] completed (${result.created} created, ${result.updated} updated).`)
    } finally {
        await mongoose.disconnect()
    }
}

main().catch((error) => {
    Logger.error(`[affordance-sync] failed: ${error instanceof Error ? error.message : String(error)}`)
    process.exit(1)
})

