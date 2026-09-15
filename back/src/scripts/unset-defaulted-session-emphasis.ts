/**
 * One-time data repair: remove the session emphasis the schema filled in, where no coach could choose.
 *
 * WHY. Until 14 Sep the Session schema defaulted `sessionEmphasis` to 'applying', and Mongoose WROTE
 * that default onto every session it created. Removing the schema default fixes new sessions only: a
 * session already stored with 'applying' keeps running the narrow profile, whose three activities are
 * near-identical by design, whenever its activities are generated again.
 *
 * WHICH SESSIONS. The session form stopped offering an emphasis on 29 Aug 2026 (efc58b8). From then on
 * no coach could choose one, so every stored 'applying' is the schema's value, not a decision. Earlier
 * sessions came from a form that offered the choice pre-filled with 'applying'; a real choice and an
 * untouched default cannot be told apart, so they are left alone. Override the cutoff with --since if
 * the form change reached production later than the commit date.
 *
 * SAFE BY DEFAULT. Without --apply it only reports. It reads and writes the raw collection, so it sees
 * what is stored rather than what the schema would present.
 *
 *   DB_CONNECTION_STRING=... npx ts-node --files -r tsconfig-paths/register ./src/scripts/unset-defaulted-session-emphasis.ts
 *   DB_CONNECTION_STRING=... npx ts-node --files -r tsconfig-paths/register ./src/scripts/unset-defaulted-session-emphasis.ts --apply [--since=2026-08-29]
 */
import 'dotenv/config'
import '../loadEnv'

import mongoose from 'mongoose'

import Session from '../models/session.model'

const FORM_STOPPED_OFFERING_EMPHASIS = '2026-08-29'

async function main(): Promise<void> {
    const uri = process.env.DB_CONNECTION_STRING
    if (!uri) throw new Error('DB_CONNECTION_STRING is required.')

    const apply = process.argv.includes('--apply')
    const sinceArg = process.argv.find((arg) => arg.startsWith('--since='))
    const since = new Date(sinceArg ? sinceArg.slice('--since='.length) : FORM_STOPPED_OFFERING_EMPHASIS)
    if (Number.isNaN(since.getTime())) throw new Error('--since must be a date, for example --since=2026-08-29')

    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10_000 })
    try {
        const sessions = Session.collection
        const stored = await sessions.aggregate([{ $group: { _id: '$sessionEmphasis', count: { $sum: 1 } } }]).toArray()
        console.log('Stored sessionEmphasis values:')
        for (const row of stored) console.log(`  ${row._id === null || row._id === undefined ? '(absent)' : row._id}: ${row.count}`)

        const sinceLabel = since.toISOString().slice(0, 10)
        const repair = { sessionEmphasis: 'applying', createdAt: { $gte: since } }
        const toRepair = await sessions.countDocuments(repair)
        const leftAlone = await sessions.countDocuments({ sessionEmphasis: 'applying', createdAt: { $lt: since } })
        console.log(`'applying' on sessions created on or after ${sinceLabel}, when no coach could choose: ${toRepair}`)
        console.log(`'applying' on earlier sessions, left alone because a coach may have chosen it: ${leftAlone}`)

        if (!apply) {
            console.log('Dry run: nothing changed. Re-run with --apply to remove the value from the first group.')
            return
        }
        const result = await sessions.updateMany(repair, { $unset: { sessionEmphasis: '' } })
        console.log(`Removed the defaulted emphasis from ${result.modifiedCount} sessions.`)
    } finally {
        await mongoose.disconnect()
    }
}

main().catch((error) => {
    console.error(error)
    process.exit(1)
})
