/**
 * Coach-facing wording he has APPROVED, read from data — and nothing else.
 *
 * Christian, 14 October 2026, approving Step 4's third component: *"Enable accurate coach-facing communication
 * of scoring conditions and information rules, using approved language."* And his standing instruction that
 * new coach wording goes to him for approval under the Coach Communication Standard.
 *
 * **Why a table and not a branch of prose.** A condition or an information rule is a rule of the game, and a
 * renderer that paraphrased one would be writing rules on its own authority — the failure SD-103 names. So the
 * renderer may say such a field only in a sentence he approved, matched to the exact value it translates, and
 * every field no approved sentence covers is WITHHELD and the activity refused at communication. The wording is
 * data, so no sport vocabulary enters this code.
 *
 * **An entry without its approval is not an entry.** It must carry `approvedBy` with who approved it, the date,
 * his words verbatim and the standard it was reviewed under. Anything else is returned as unapproved, never
 * used, and the data test fails on it — so a sentence cannot slip into a coach's activity by being added here
 * with good intentions.
 *
 * The table starts EMPTY (14 October 2026). Read through `AUDITS_DIR`, so the bundled server finds it in
 * `dist/knowledge`; `build.js` copies it.
 */
import fs from 'node:fs'
import path from 'node:path'

import { AUDITS_DIR } from '../derivation/knowledge-root'

export type WordingMatch = { equals: unknown } | { refersToOwnCondition: true }

export interface ApprovedWording {
    id: string
    covers: { row: string; match: WordingMatch }[]
    sentence: string
    /** Each slot is filled from one field of the same element, which is then cited. */
    slots?: Record<string, { field: string }>
    section: 'Set up' | 'Players' | 'How it works' | 'How to score' | 'What to watch'
    approvedBy: { who: string; date: string; quote: string; ccs: string }
}

const SECTIONS = new Set(['Set up', 'Players', 'How it works', 'How to score', 'What to watch'])
const filled = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0
const isDate = (value: unknown): boolean => filled(value) && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value))

/** Why an entry cannot be used, or null where it can. */
export function unusableBecause(entry: any): string | null {
    if (!entry || typeof entry !== 'object') return 'not an object'
    if (!filled(entry.id)) return 'it has no id'
    const approval = entry.approvedBy
    if (!approval || !filled(approval.who)) return 'it does not say who approved it'
    if (!isDate(approval.date)) return 'it carries no approval date'
    if (!filled(approval.quote)) return 'it carries no verbatim approval'
    if (!filled(approval.ccs)) return 'it does not name the standard it was reviewed under'
    if (!filled(entry.sentence)) return 'it has no sentence'
    if (!SECTIONS.has(entry.section)) return `its section "${entry.section}" is not one an activity has`
    if (!Array.isArray(entry.covers) || !entry.covers.length) return 'it covers nothing'
    for (const cover of entry.covers) {
        if (!filled(cover?.row)) return 'a cover names no row'
        const match = cover.match ?? {}
        if (!('equals' in match) && match.refersToOwnCondition !== true) return `the cover on ${cover.row} has no match it can be tested by`
    }
    return null
}

/** The entries split into those that may be used and those that may not, with why. */
export function partitionWording(entries: unknown[]): { approved: ApprovedWording[]; unapproved: { id: string; why: string }[] } {
    const approved: ApprovedWording[] = []
    const unapproved: { id: string; why: string }[] = []
    for (const entry of entries) {
        const why = unusableBecause(entry)
        if (why) unapproved.push({ id: String((entry as any)?.id ?? '(no id)'), why })
        else approved.push(JSON.parse(JSON.stringify(entry)) as ApprovedWording)
    }
    return { approved, unapproved }
}

export const APPROVED_WORDING_FILE = path.join(AUDITS_DIR, 'approved-coach-wording.json')

const TABLE = partitionWording(JSON.parse(fs.readFileSync(APPROVED_WORDING_FILE, 'utf8').replace(/^﻿/, '')).entries ?? [])

/** The approved entries, as copies. */
export const approvedWording = (): ApprovedWording[] => TABLE.approved.map(entry => JSON.parse(JSON.stringify(entry)))

/** The entries in the file that may NOT be used — each one a data defect the test reports. */
export const unapprovedWording = (): { id: string; why: string }[] => TABLE.unapproved.map(entry => ({ ...entry }))
