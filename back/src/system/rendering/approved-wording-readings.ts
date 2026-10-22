/**
 * **What a part of his approved wording states: the PROPOSED record, loaded and checked** — stage 3E, 22 October 2026.
 *
 * His reply filed 22 October 2026, item 4: *"I approve generating abbreviated versions of approved statements for the Coach Overview,
 * provided their meaning remains accurate."* and *"Shortening must not introduce new meanings, omit a condition that changes the essential
 * understanding, or silently turn a qualified rule into an unrestricted one."*
 *
 * A verbatim extract of an approved entry (`derived-wording.ts`) keeps exactly the covers a recorded reading gives it, and none where no
 * reading is recorded. Which covers a part of an entry states is a reading of his words, which no field of the approved table records and
 * nothing computes, so it is DATA (`docs/audits/approved-wording-readings.json`): keyed by approved-entry id, as his approved wording itself
 * is, PROPOSED (the coordinator's decision for stage 3E), with no approval of its own. Nothing here names an entry, a row or a value.
 *
 * The loader (`readingsUnusableBecause`) refuses the whole record — so no extract keeps anything and the overview says his sentences whole,
 * exactly as with no record — where: it is not PROPOSED or carries `approvedBy` anywhere; a key is not one the record's shape has; a reading
 * names an entry that is not an approved entry, or a part the entry does not have (a sentence it lacks, a leading clause where the sentence
 * has no ";", parts out of order, the whole entry); its `words` are not that part's words; a cover is not one of the entry's (its index,
 * row or locator); a cover is listed twice; its `statedBy` is not found verbatim in that part's words; its `why` is empty; its `note` is
 * not found verbatim in the entry's own note; two readings are of the same parts; a reading states nothing.
 *
 * A reading applies only to the entry it was checked against: handed an entry of the same id whose words or covers differ (a copy changed
 * for a test), it gives nothing. Every extract built on it names it (`ReadingRecord`): for an administrator, "reading PROPOSED, awaiting
 * confirmation" (DRAFT words); a coach sees no status.
 */
import fs from 'node:fs'
import path from 'node:path'

import { AUDITS_DIR } from '../derivation/knowledge-root'
import { ApprovedWording, approvedWording, canonicalJson } from './approved-wording'
import { CoverReading, ExtractUnit, NO_RECORDED_READING, ReadingRecord, sentencesOf, textOfUnits, unitsUnusableBecause } from './derived-wording'

/** Where the record is read from (`build.js` copies it beside the bundle), and how it is named to an administrator. */
export const READINGS_FILE = path.join(AUDITS_DIR, 'approved-wording-readings.json')
export const READINGS_SOURCE = 'docs/audits/approved-wording-readings.json' as const
/** What an administrator is told of an extract built on the record while it is PROPOSED (DRAFT words). */
export const READING_PROPOSED_LABEL = 'reading PROPOSED, awaiting confirmation'

/** One cover a reading says its parts state, with the words of his that state it and our reason. */
export interface ReadingStatement {
    coverIndex: number
    row: string
    element: unknown
    statedBy: string
    why: string
    note: string | null
}

/** One reading: an entry, the parts of it read (numbered from 0 here, as `ExtractUnit` numbers them), their words, and what they state. */
export interface WordingReading {
    entry: string
    units: ExtractUnit[]
    words: string
    states: ReadingStatement[]
}

/** The record as loaded: PROPOSED with its readings, or UNUSABLE with why (then no reading is recorded). */
export interface ReadingsLoad {
    status: 'PROPOSED' | 'UNUSABLE'
    readings: WordingReading[]
    why: string | null
}

const FILE_KEYS = new Set(['about', 'status', 'proposal', 'readingShape', 'readings'])
const READING_KEYS = new Set(['entry', 'parts', 'words', 'states'])
const PART_KEYS = new Set(['sentence', 'part'])
const STATE_KEYS = new Set(['coverIndex', 'row', 'element', 'statedBy', 'why', 'note'])
const nonEmpty = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0
const isObject = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value)

/** Whether a value carries `approvedBy` at any depth: a reading has no approval of its own. */
const carriesApproval = (value: unknown): boolean =>
    Array.isArray(value) ? value.some(carriesApproval) : isObject(value) ? Object.keys(value).includes('approvedBy') || Object.values(value).some(carriesApproval) : false

/** Why one reading cannot be used against these entries, or null. */
function readingUnusableBecause(reading: any, wording: ApprovedWording[]): string | null {
    if (!isObject(reading)) return 'it is not an object'
    for (const key of Object.keys(reading)) if (!READING_KEYS.has(key)) return `it carries "${key}", which no reading holds`
    const entry = wording.find(candidate => candidate.id === reading.entry)
    if (!entry) return `it names ${JSON.stringify(reading.entry)}, which is not an approved entry`
    if (!Array.isArray(reading.parts) || !reading.parts.length) return 'it names no part of its entry'
    for (const part of reading.parts) {
        if (!isObject(part)) return 'a part is not an object'
        for (const key of Object.keys(part)) if (!PART_KEYS.has(key)) return `a part carries "${key}", which no part holds`
        if (!Number.isInteger(part.sentence) || (part.sentence as number) < 1) return 'a part names no sentence (numbered from 1)'
    }
    const units: ExtractUnit[] = reading.parts.map((part: any) => ({ sentence: part.sentence - 1, part: part.part }))
    const sentences = sentencesOf(entry.sentence)
    const parts = unitsUnusableBecause(sentences, units)
    if (parts) return `its parts of ${entry.id}: ${parts}`
    const words = textOfUnits(sentences, units)!
    if (reading.words !== words) return `its words ${JSON.stringify(reading.words)} are not those parts of ${entry.id}: ${JSON.stringify(words)}`
    if (!Array.isArray(reading.states) || !reading.states.length) return 'it states nothing: a reading that keeps nothing is no reading'
    const note = typeof (entry as any).note === 'string' ? ((entry as any).note as string) : ''
    const seen = new Set<number>()
    for (const state of reading.states) {
        if (!isObject(state)) return 'a cover it states is not an object'
        for (const key of Object.keys(state)) if (!STATE_KEYS.has(key)) return `a cover it states carries "${key}", which no cover holds`
        const index = state.coverIndex
        if (!Number.isInteger(index) || (index as number) < 0 || (index as number) >= entry.covers.length) return `it states cover ${JSON.stringify(index)}, which ${entry.id} does not have`
        const cover = entry.covers[index as number]
        if (state.row !== cover.row || canonicalJson(state.element ?? null) !== canonicalJson(cover.element ?? null)) return `its cover ${index} is named with another row or locator than ${entry.id} gives it`
        if (seen.has(index as number)) return `it states cover ${index} twice`
        seen.add(index as number)
        if (!nonEmpty(state.statedBy)) return `it gives no words of his for cover ${index}`
        if (!words.includes(state.statedBy)) return `its words for cover ${index}, ${JSON.stringify(state.statedBy)}, are not found verbatim in those parts of ${entry.id}`
        if (!nonEmpty(state.why)) return `it gives no reason for cover ${index}`
        if (state.note !== null && (!nonEmpty(state.note) || !note.includes(state.note))) return `its note for cover ${index}, ${JSON.stringify(state.note)}, is not found verbatim in ${entry.id}'s own note`
    }
    return null
}

/**
 * **Why the record cannot be used, or null** (module comment). `wording` is the approved table the readings are checked against (the
 * loader's own by default; a test may hand another).
 */
export function readingsUnusableBecause(file: any, wording: ApprovedWording[] = approvedWording()): string | null {
    if (!isObject(file)) return 'the record is not an object'
    if (carriesApproval(file)) return 'it carries approvedBy: a reading of his wording has no approval of its own, and this record stays PROPOSED'
    for (const key of Object.keys(file)) if (!FILE_KEYS.has(key)) return `the record carries "${key}", which no record holds`
    if (file.status !== 'PROPOSED') return `its status is ${JSON.stringify(file.status)}: the record is PROPOSED until he confirms it, and this loader knows no confirmation`
    if (!Array.isArray(file.readings)) return 'it has no list of readings'
    const read = new Set<string>()
    for (const reading of file.readings) {
        const why = readingUnusableBecause(reading, wording)
        if (why) return `the reading of ${JSON.stringify(reading?.entry ?? null)} ${JSON.stringify(reading?.parts ?? null)}: ${why}`
        const key = canonicalJson([reading.entry, reading.parts])
        if (read.has(key)) return `${reading.entry} ${JSON.stringify(reading.parts)} is read twice`
        read.add(key)
    }
    return null
}

/** The record from its parsed file: its readings (parts numbered from 0), or UNUSABLE with why. */
export function readingsLoadOf(file: any, wording: ApprovedWording[] = approvedWording()): ReadingsLoad {
    const why = readingsUnusableBecause(file, wording)
    if (why) return { status: 'UNUSABLE', readings: [], why }
    return {
        status: 'PROPOSED',
        readings: (file.readings as any[]).map(reading => ({
            entry: String(reading.entry),
            units: (reading.parts as any[]).map(part => ({ sentence: part.sentence - 1, part: part.part })),
            words: String(reading.words),
            states: (reading.states as any[]).map(state => ({ coverIndex: state.coverIndex, row: state.row, element: JSON.parse(JSON.stringify(state.element ?? null)), statedBy: state.statedBy, why: state.why, note: state.note })),
        })),
        why: null,
    }
}

/** Where the record is and its standing, as an extract built on it names it (DRAFT label). */
export const PROPOSED_READING_RECORD: ReadingRecord = { source: READINGS_SOURCE, status: 'PROPOSED', label: READING_PROPOSED_LABEL, labelStatus: 'DRAFT' }

/**
 * **The reading the record gives** (`CoverReading`, with its `record`): for an entry and parts it reads, the covers they state, in order;
 * for anything else, or an entry whose words or covers are not the ones the reading was checked against, none. An unusable record gives
 * no reading at all (`NO_RECORDED_READING`).
 */
export function coverReadingOf(load: ReadingsLoad, wording: ApprovedWording[] = approvedWording()): CoverReading {
    if (load.status !== 'PROPOSED') return NO_RECORDED_READING
    const checkedAgainst = new Map(wording.map(entry => [entry.id, canonicalJson([entry.sentence, entry.covers])] as const))
    const reading = ((entry: ApprovedWording, units: ExtractUnit[]): number[] | null => {
        if (checkedAgainst.get(entry.id) !== canonicalJson([entry.sentence, entry.covers])) return null
        const found = load.readings.find(candidate => candidate.entry === entry.id && canonicalJson(candidate.units) === canonicalJson(units))
        return found ? found.states.map(state => state.coverIndex).sort((a, b) => a - b) : null
    }) as CoverReading
    reading.record = { ...PROPOSED_READING_RECORD }
    return reading
}

function readRecord(): ReadingsLoad {
    try {
        const text = fs.readFileSync(READINGS_FILE, 'utf8')
        return readingsLoadOf(JSON.parse(text.charCodeAt(0) === 0xfeff ? text.slice(1) : text))
    } catch (error) {
        return { status: 'UNUSABLE', readings: [], why: `${READINGS_SOURCE} could not be read: ${error instanceof Error ? error.message : String(error)}` }
    }
}
const RECORD = readRecord()
const RECORDED = coverReadingOf(RECORD)

/** The record as loaded at module load, as a copy. */
export const recordedReadings = (): ReadingsLoad => JSON.parse(JSON.stringify(RECORD))
/** The reading the record gives (the serving path's), checked against the approved table at module load. */
export const recordedReading = (): CoverReading => RECORDED

/** The record as an administrator is told of it: where it is, its standing and its label, and why it cannot be used. */
export interface ReadingsAccount {
    source: typeof READINGS_SOURCE
    status: 'PROPOSED' | 'UNUSABLE'
    label: string | null
    labelStatus: 'DRAFT'
    why: string | null
}
export const readingsAccountOf = (load: ReadingsLoad): ReadingsAccount => ({
    source: READINGS_SOURCE,
    status: load.status,
    label: load.status === 'PROPOSED' ? READING_PROPOSED_LABEL : null,
    labelStatus: 'DRAFT',
    why: load.why,
})
