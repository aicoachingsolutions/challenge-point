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
 * exactly as with no record — where (C1, below: was "it is not PROPOSED or carries `approvedBy` anywhere") a reading's standing or approval
 * is not as C1 requires, or the record's status is not what its readings make it; a key is not one the record's shape has; a reading
 * names an entry that is not an approved entry, or a part the entry does not have (a sentence it lacks, a leading clause where the sentence
 * has no ";", parts out of order, the whole entry); its `words` are not that part's words; a cover is not one of the entry's (its index,
 * row or locator); a cover is listed twice; its `statedBy` is not found verbatim in that part's words; its `why` is empty; its `note` is
 * not found verbatim in the entry's own note; two readings are of the same parts; a reading states nothing.
 *
 * A reading applies only to the entry it was checked against: handed an entry of the same id whose words or covers differ (a copy changed
 * for a test), it gives nothing. Every extract built on it names it (`ReadingRecord`): for an administrator, "reading PROPOSED, awaiting
 * confirmation" (DRAFT words), or since C1 "reading approved"; a coach sees no status.
 *
 * **Stage 3F, 22 October 2026: meaning, not citations.** His reply filed 23 October 2026, item 4: *"An abbreviation should be accepted only
 * when the overview as a whole preserves the material meaning of the full rule, including relevant initial conditions, scoring eligibility,
 * and exceptions."* and *"The system should evaluate the meaning of the complete overview rather than simply confirm that related words or
 * conditions appear somewhere."* So:
 *
 *   - his wording said WHOLE is read too: a reading may be of every sentence of an entry, whole (for an entry of one sentence, that
 *     sentence), and an approved sentence said whole states only what its reading gives it (`derived-wording.ts` `wholeReadingsFor`);
 *   - several parts state what each part states: where no reading of exactly those parts is recorded and every one of them has its own,
 *     the reading of the parts together is the union (never more than some part's own reading says);
 *   - a reading may record what its parts do NOT state (`doesNotState`), each with our reason, for an administrator's evidence;
 *   - the 3E review's should-fix 1 (a wrong reading was accepted): a note fragment a reading cites must name its cover's row; and where the
 *     entry's own note maps a row to quoted words (the form "'{words}' ({row}"), a reading claiming a cover on that row must cite that
 *     mapping, and the quoted words must lie inside the parts read. Keyed by row and read from the entry's note; nothing here names one.
 *
 * **C1, his reply filed 24 October 2026, item 1: approval per reading.** *"I agree with your interpretation of the approved scoring
 * statements."* The readings the overview uses that our email of 23 October described are APPROVED; every other reading stays PROPOSED. So
 * the standing is the reading's own, never the file's: each reading carries `status`, APPROVED only with `approvedBy` (who, the date, the
 * reply it is filed in, naming that date in words, and his words verbatim), PROPOSED only without it; `approvedBy` appears nowhere else
 * (not on the file, a part, a cover stated or one not stated); and the file's `status` must be what its readings make it (PROPOSED where
 * none is approved, APPROVED where all are, PARTLY_APPROVED otherwise). A loosening of the 3E rule ("approvedBy anywhere refuses the whole
 * record"), compensated by those checks and by the unit test pinning which readings are approved and his words in each. What an extract or
 * a sentence said whole is kept by names the standing of exactly the readings it is read by (`recordFor`): APPROVED only where every one
 * of them is ("reading approved", for an administrator), else PROPOSED ("reading PROPOSED, awaiting confirmation").
 */
import fs from 'node:fs'
import path from 'node:path'

import { AUDITS_DIR } from '../derivation/knowledge-root'
import { ApprovedWording, approvedWording, canonicalJson } from './approved-wording'
import { CoverReading, ExtractUnit, NO_RECORDED_READING, ReadingExplanation, ReadingRecord, sentencesOf, textOfUnits, unitsUnusableBecause } from './derived-wording'

/** Where the record is read from (`build.js` copies it beside the bundle), and how it is named to an administrator. */
export const READINGS_FILE = path.join(AUDITS_DIR, 'approved-wording-readings.json')
export const READINGS_SOURCE = 'docs/audits/approved-wording-readings.json' as const
/** What an administrator is told of an extract built on a reading of the record that is PROPOSED (DRAFT words). */
export const READING_PROPOSED_LABEL = 'reading PROPOSED, awaiting confirmation'
/** C1: what an administrator is told of an extract, or a sentence said whole, built only on readings he approved (DRAFT words). */
export const READING_APPROVED_LABEL = 'reading approved'

/** C1: a reading's own standing. */
export type ReadingStatus = 'PROPOSED' | 'APPROVED'

/** C1: his approval of a reading: who, the date (YYYY-MM-DD), the reply it is filed in (naming that date in words), and his words verbatim. */
export interface ReadingApproval {
    who: string
    date: string
    filed: string
    quote: string
}

/** One cover a reading says its parts state, with the words of his that state it and our reason. */
export interface ReadingStatement {
    coverIndex: number
    row: string
    element: unknown
    statedBy: string
    why: string
    note: string | null
}

/** One cover a reading says its parts do NOT state (stage 3F), with our reason. */
export interface ReadingOmission {
    coverIndex: number
    row: string
    element: unknown
    why: string
}

/** One reading: an entry, the parts of it read (numbered from 0 here, as `ExtractUnit` numbers them), their words, and what they state. */
export interface WordingReading {
    entry: string
    units: ExtractUnit[]
    words: string
    states: ReadingStatement[]
    /** Stage 3F: the covers it says its parts do not state, each with why (none where it says nothing of them). */
    doesNotState: ReadingOmission[]
    /** C1: its own standing, and his approval where it is APPROVED (null where it is PROPOSED). */
    status: ReadingStatus
    approvedBy: ReadingApproval | null
}

/** The record's standing, read from its readings (C1). */
export type RecordStatus = 'PROPOSED' | 'PARTLY_APPROVED' | 'APPROVED'

/** The record as loaded: its standing (C1: what its readings make it) with its readings, or UNUSABLE with why (then no reading is recorded). */
export interface ReadingsLoad {
    status: RecordStatus | 'UNUSABLE'
    readings: WordingReading[]
    why: string | null
}

const FILE_KEYS = new Set(['about', 'status', 'proposal', 'readingShape', 'readings'])
const READING_KEYS = new Set(['entry', 'parts', 'words', 'states', 'doesNotState', 'status', 'approvedBy'])
const APPROVAL_KEYS = new Set(['who', 'date', 'filed', 'quote'])
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const PART_KEYS = new Set(['sentence', 'part'])
const STATE_KEYS = new Set(['coverIndex', 'row', 'element', 'statedBy', 'why', 'note'])
const OMISSION_KEYS = new Set(['coverIndex', 'row', 'element', 'why'])
const nonEmpty = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0
const isObject = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value)

/** A text's words: split wherever a character is neither a letter nor a digit (a row id is one word: "V3" never matches inside "V30"). */
const wordsOf = (text: string): string[] => text.split(/[^A-Za-z0-9]+/).filter(Boolean)
const isWordChar = (ch: string): boolean => /[A-Za-z0-9]/.test(ch)

/** Every part of a statement, whole: each sentence of it whole, in order. */
const isWhole = (sentences: { text: string }[], units: ExtractUnit[]): boolean =>
    units.length === sentences.length && units.every((unit, n) => unit.sentence === n && unit.part === 'WHOLE_SENTENCE')

/**
 * **Where an entry's own note maps a row to quoted words** — stage 3F (the 3E review's should-fix 1): each place the note says
 * "'{words}' ({row}" followed by "," or ")", for a row the entry covers, with the words between the opening quote (one not inside a word)
 * and the closing one. `mapping` is the note's text from the opening quote through the row, which a reading claiming that row must cite.
 */
export function noteMappingsOf(note: string, rows: Set<string>): { row: string; words: string; mapping: string }[] {
    const found: { row: string; words: string; mapping: string }[] = []
    const close = "' ("
    for (let at = note.indexOf(close); at >= 0; at = note.indexOf(close, at + 1)) {
        const after = note.slice(at + close.length)
        let length = 0
        while (length < after.length && isWordChar(after[length])) length++
        const row = after.slice(0, length)
        if (!rows.has(row) || (after[length] !== ',' && after[length] !== ')')) continue
        let open = note.lastIndexOf("'", at - 1)
        while (open > 0 && isWordChar(note[open - 1])) open = note.lastIndexOf("'", open - 1)
        if (open < 0) continue
        const words = note.slice(open + 1, at)
        if (!words.trim()) continue
        found.push({ row, words, mapping: note.slice(open, at + close.length + row.length) })
    }
    return found
}

/** Whether a value carries `approvedBy` at any depth (C1: only a reading itself may, and only where it is APPROVED). */
const carriesApproval = (value: unknown): boolean =>
    Array.isArray(value) ? value.some(carriesApproval) : isObject(value) ? Object.keys(value).includes('approvedBy') || Object.values(value).some(carriesApproval) : false

/** A date as YYYY-MM-DD, read: its year, month (from 1) and day; null where it is not a calendar date. */
function dateOf(value: string): { year: number; month: number; day: number } | null {
    const parts = value.split('-')
    if (parts.length !== 3 || parts[0].length !== 4 || parts[1].length !== 2 || parts[2].length !== 2 || !parts.every(part => [...part].every(ch => ch >= '0' && ch <= '9'))) return null
    const [year, month, day] = parts.map(Number)
    const date = new Date(Date.UTC(year, month - 1, day))
    return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day ? { year, month, day } : null
}

/**
 * **Why an approval of one item of a record cannot be used, or null** (C1, shared with the essentials table's rules): exactly who, a
 * calendar date, the reply it is filed in (which says "filed" and that date in words: "filed 24 October 2026") and his words.
 */
export function approvalUnusableBecause(approval: unknown): string | null {
    if (!isObject(approval)) return 'its approval is not an object'
    for (const key of Object.keys(approval)) if (!APPROVAL_KEYS.has(key)) return `its approval carries "${key}", which no approval holds`
    if (!nonEmpty(approval.who)) return 'its approval does not say who approved it'
    const date = typeof approval.date === 'string' ? dateOf(approval.date) : null
    if (!date) return `its approval date ${JSON.stringify(approval.date ?? null)} is not a calendar date (YYYY-MM-DD)`
    const named = `${date.day} ${MONTHS[date.month - 1]} ${date.year}`
    if (!nonEmpty(approval.filed) || !approval.filed.includes(`filed ${named}`)) return `its approval does not name the reply it is filed in, by the date ${named} ("filed ${named}")`
    if (!nonEmpty(approval.quote)) return 'its approval does not give his words'
    return null
}

/**
 * **Why a reading's standing cannot be used, or null** (C1): `status` PROPOSED with no `approvedBy`, or APPROVED with `approvedBy` that
 * `approvalUnusableBecause` accepts.
 */
function standingUnusableBecause(reading: Record<string, unknown>): string | null {
    if (reading.status !== 'PROPOSED' && reading.status !== 'APPROVED') return `its status is ${JSON.stringify(reading.status)}: a reading is PROPOSED or APPROVED`
    if (reading.status === 'PROPOSED') return 'approvedBy' in reading ? 'it is PROPOSED and carries approvedBy: a PROPOSED reading has no approval' : null
    if (!('approvedBy' in reading)) return 'it is APPROVED and carries no approvedBy: a reading is APPROVED only with his approval, in his words'
    return approvalUnusableBecause(reading.approvedBy)
}

/** Why one reading cannot be used against these entries, or null. */
function readingUnusableBecause(reading: any, wording: ApprovedWording[]): string | null {
    if (!isObject(reading)) return 'it is not an object'
    for (const key of Object.keys(reading)) if (!READING_KEYS.has(key)) return `it carries "${key}", which no reading holds`
    // C1: an approval is the reading's own, never a part's or a cover's; and its standing is PROPOSED or APPROVED, as the approval says.
    if (carriesApproval([reading.parts, reading.states, reading.doesNotState, reading.approvedBy])) return 'it carries approvedBy inside it: only a reading itself is approved'
    const standing = standingUnusableBecause(reading)
    if (standing) return standing
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
    // Stage 3F: his wording said whole is read too (every sentence of it, whole); any other parts are an extract's.
    const parts = isWhole(sentences, units) ? null : unitsUnusableBecause(sentences, units)
    if (parts) return `its parts of ${entry.id}: ${parts}`
    const words = textOfUnits(sentences, units)!
    if (reading.words !== words) return `its words ${JSON.stringify(reading.words)} are not those parts of ${entry.id}: ${JSON.stringify(words)}`
    if (!Array.isArray(reading.states) || !reading.states.length) return 'it states nothing: a reading that keeps nothing is no reading'
    const note = typeof (entry as any).note === 'string' ? ((entry as any).note as string) : ''
    const mappings = noteMappingsOf(note, new Set(entry.covers.map(cover => cover.row)))
    /** A cover of the entry, by its index, named with its own row and locator; or why not. */
    const coverAt = (index: unknown, row: unknown, element: unknown, what: string): string | null => {
        if (!Number.isInteger(index) || (index as number) < 0 || (index as number) >= entry.covers.length) return `it ${what} cover ${JSON.stringify(index)}, which ${entry.id} does not have`
        const cover = entry.covers[index as number]
        if (row !== cover.row || canonicalJson(element ?? null) !== canonicalJson(cover.element ?? null)) return `its cover ${index} is named with another row or locator than ${entry.id} gives it`
        return null
    }
    const seen = new Set<number>()
    for (const state of reading.states) {
        if (!isObject(state)) return 'a cover it states is not an object'
        for (const key of Object.keys(state)) if (!STATE_KEYS.has(key)) return `a cover it states carries "${key}", which no cover holds`
        const index = state.coverIndex
        const named = coverAt(index, state.row, state.element, 'states')
        if (named) return named
        const cover = entry.covers[index as number]
        if (seen.has(index as number)) return `it states cover ${index} twice`
        seen.add(index as number)
        if (!nonEmpty(state.statedBy)) return `it gives no words of his for cover ${index}`
        if (!words.includes(state.statedBy)) return `its words for cover ${index}, ${JSON.stringify(state.statedBy)}, are not found verbatim in those parts of ${entry.id}`
        if (!nonEmpty(state.why)) return `it gives no reason for cover ${index}`
        if (state.note !== null && (!nonEmpty(state.note) || !note.includes(state.note))) return `its note for cover ${index}, ${JSON.stringify(state.note)}, is not found verbatim in ${entry.id}'s own note`
        // Stage 3F (the 3E review's should-fix 1): a note fragment names its cover's row; where his entry's note maps that row to quoted
        // words, the reading cites that mapping, and those words are inside the parts read.
        if (state.note !== null && !wordsOf(state.note as string).includes(cover.row)) return `its note for cover ${index}, ${JSON.stringify(state.note)}, does not name the row ${cover.row} it is cited for`
        const mapped = mappings.filter(mapping => mapping.row === cover.row)
        if (mapped.length) {
            const cited = mapped.find(mapping => typeof state.note === 'string' && (state.note as string).includes(mapping.mapping))
            if (!cited) return `${entry.id}'s note maps ${cover.row} to ${mapped.map(mapping => JSON.stringify(mapping.words)).join(' or ')}, and its reading of cover ${index} does not cite that mapping`
            if (!words.includes(cited.words)) return `${entry.id}'s note maps ${cover.row} to ${JSON.stringify(cited.words)}, which is not in the parts read, so they cannot state cover ${index}`
        }
    }
    // Stage 3F: what the parts do NOT state, each a cover of the entry it does not also state, with a reason.
    if (reading.doesNotState !== undefined) {
        if (!Array.isArray(reading.doesNotState) || !reading.doesNotState.length) return 'its doesNotState is not a list of covers'
        const left = new Set<number>()
        for (const omission of reading.doesNotState) {
            if (!isObject(omission)) return 'a cover it does not state is not an object'
            for (const key of Object.keys(omission)) if (!OMISSION_KEYS.has(key)) return `a cover it does not state carries "${key}", which no such cover holds`
            const index = omission.coverIndex
            const named = coverAt(index, omission.row, omission.element, 'does not state')
            if (named) return named
            if (seen.has(index as number)) return `it both states and does not state cover ${index}`
            if (left.has(index as number)) return `it says twice that it does not state cover ${index}`
            left.add(index as number)
            if (!nonEmpty(omission.why)) return `it gives no reason why it does not state cover ${index}`
        }
    }
    return null
}

/**
 * **Why the record cannot be used, or null** (module comment). `wording` is the approved table the readings are checked against (the
 * loader's own by default; a test may hand another).
 */
export function readingsUnusableBecause(file: any, wording: ApprovedWording[] = approvedWording()): string | null {
    if (!isObject(file)) return 'the record is not an object'
    // C1: an approval is a reading's own (checked per reading below), never the record's. The shape's description of the field (in
    // `readingShape`, which nothing reads) is not one.
    if (carriesApproval(Object.fromEntries(Object.entries(file).filter(([key]) => key !== 'readings' && key !== 'readingShape')))) return 'it carries approvedBy outside its readings: his approval is of a reading, never of the record'
    for (const key of Object.keys(file)) if (!FILE_KEYS.has(key)) return `the record carries "${key}", which no record holds`
    if (!Array.isArray(file.readings)) return 'it has no list of readings'
    const read = new Set<string>()
    for (const reading of file.readings) {
        const why = readingUnusableBecause(reading, wording)
        if (why) return `the reading of ${JSON.stringify(reading?.entry ?? null)} ${JSON.stringify(reading?.parts ?? null)}: ${why}`
        const key = canonicalJson([reading.entry, reading.parts])
        if (read.has(key)) return `${reading.entry} ${JSON.stringify(reading.parts)} is read twice`
        read.add(key)
    }
    // C1: the record's standing is what its readings make it, never more.
    const standing = recordStatusOf((file.readings as any[]).map(reading => reading.status as ReadingStatus))
    if (file.status !== standing) return `its status is ${JSON.stringify(file.status)}, and its readings make it ${standing}: the record says what its readings are, never more`
    return null
}

/** C1: the record's standing from its readings' own: APPROVED where every one is, PROPOSED where none is, PARTLY_APPROVED otherwise. */
export const recordStatusOf = (statuses: ReadingStatus[]): RecordStatus =>
    statuses.length && statuses.every(status => status === 'APPROVED') ? 'APPROVED' : statuses.some(status => status === 'APPROVED') ? 'PARTLY_APPROVED' : 'PROPOSED'

/** The record from its parsed file: its readings (parts numbered from 0), or UNUSABLE with why. */
export function readingsLoadOf(file: any, wording: ApprovedWording[] = approvedWording()): ReadingsLoad {
    const why = readingsUnusableBecause(file, wording)
    if (why) return { status: 'UNUSABLE', readings: [], why }
    const readings: WordingReading[] = (file.readings as any[]).map(reading => ({
        entry: String(reading.entry),
        units: (reading.parts as any[]).map(part => ({ sentence: part.sentence - 1, part: part.part })),
        words: String(reading.words),
        states: (reading.states as any[]).map(state => ({ coverIndex: state.coverIndex, row: state.row, element: JSON.parse(JSON.stringify(state.element ?? null)), statedBy: state.statedBy, why: state.why, note: state.note })),
        doesNotState: ((reading.doesNotState ?? []) as any[]).map(omission => ({ coverIndex: omission.coverIndex, row: omission.row, element: JSON.parse(JSON.stringify(omission.element ?? null)), why: omission.why })),
        status: reading.status as ReadingStatus,
        approvedBy: reading.status === 'APPROVED' ? { who: String(reading.approvedBy.who), date: String(reading.approvedBy.date), filed: String(reading.approvedBy.filed), quote: String(reading.approvedBy.quote) } : null,
    }))
    return { status: recordStatusOf(readings.map(reading => reading.status)), readings, why: null }
}

/** Where the record is and the standing of a reading in it, as an extract built on a PROPOSED reading names it (DRAFT label). */
export const PROPOSED_READING_RECORD: ReadingRecord = { source: READINGS_SOURCE, status: 'PROPOSED', label: READING_PROPOSED_LABEL, labelStatus: 'DRAFT' }
/** C1: the same, for an extract or a sentence said whole read only by readings he approved (DRAFT label). */
export const APPROVED_READING_RECORD: ReadingRecord = { source: READINGS_SOURCE, status: 'APPROVED', label: READING_APPROVED_LABEL, labelStatus: 'DRAFT' }

/** C1: the record each reading was built from (`coverReadingOf`), so its account describes exactly that record. */
const BUILT_FROM = new WeakMap<CoverReading, ReadingsLoad>()

/** C1: a reading's name for an administrator, read from the record: its entry and parts ("A-W1 sentence 2", "... sentence 1, leading clause"). */
export const readingNameOf = (reading: { entry: string; units: ExtractUnit[] }): string =>
    `${reading.entry} ${reading.units.map(unit => `sentence ${unit.sentence + 1}${unit.part === 'LEADING_CLAUSE' ? ', leading clause' : ''}`).join(' + ')}`

/**
 * **The reading the record gives** (`CoverReading`, with its `record`): for an entry and parts it reads, the covers they state, in order;
 * for anything else, or an entry whose words or covers are not the ones the reading was checked against, none. An unusable record gives
 * no reading at all (`NO_RECORDED_READING`).
 *
 * Stage 3F: where no reading of exactly these parts is recorded and there are several, each with a reading of its own, the parts together
 * state what each states (the union, never more); his wording said whole is read the same way (every sentence of it, whole). `explain`
 * gives the record's words and reasons for those covers, and what it says the parts do not state (a cover another part states is not
 * listed as unstated).
 */
export function coverReadingOf(load: ReadingsLoad, wording: ApprovedWording[] = approvedWording()): CoverReading {
    if (load.status === 'UNUSABLE') return NO_RECORDED_READING
    const checkedAgainst = new Map(wording.map(entry => [entry.id, canonicalJson([entry.sentence, entry.covers])] as const))
    const exactly = (entry: ApprovedWording, units: ExtractUnit[]): WordingReading | undefined => load.readings.find(candidate => candidate.entry === entry.id && canonicalJson(candidate.units) === canonicalJson(units))
    /** The readings these parts are read by: the one of exactly these parts, else one per part where every part has one; else null. */
    const readingsFor = (entry: ApprovedWording, units: ExtractUnit[]): WordingReading[] | null => {
        if (checkedAgainst.get(entry.id) !== canonicalJson([entry.sentence, entry.covers])) return null
        const found = exactly(entry, units)
        if (found) return [found]
        if (units.length < 2) return null
        const each = units.map(unit => exactly(entry, [unit]))
        return each.every((one): one is WordingReading => !!one) ? each : null
    }
    const reading = ((entry: ApprovedWording, units: ExtractUnit[]): number[] | null => {
        const read = readingsFor(entry, units)
        return read ? [...new Set(read.flatMap(one => one.states.map(state => state.coverIndex)))].sort((a, b) => a - b) : null
    }) as CoverReading
    // C1: the standing of exactly the readings these parts are read by: APPROVED only where every one of them is.
    reading.recordFor = (entry: ApprovedWording, units: ExtractUnit[]): ReadingRecord | null => {
        const read = readingsFor(entry, units)
        if (!read) return null
        return { ...(read.every(one => one.status === 'APPROVED') ? APPROVED_READING_RECORD : PROPOSED_READING_RECORD) }
    }
    BUILT_FROM.set(reading, load)
    reading.explain = (entry: ApprovedWording, units: ExtractUnit[]): ReadingExplanation | null => {
        const read = readingsFor(entry, units)
        if (!read) return null
        const states = new Map<number, ReadingExplanation['states'][number]>()
        for (const one of read) for (const state of one.states) if (!states.has(state.coverIndex)) states.set(state.coverIndex, { index: state.coverIndex, statedBy: state.statedBy, why: state.why })
        const left = new Map<number, ReadingExplanation['doesNotState'][number]>()
        for (const one of read) for (const omission of one.doesNotState) if (!states.has(omission.coverIndex) && !left.has(omission.coverIndex)) left.set(omission.coverIndex, { index: omission.coverIndex, why: omission.why })
        const byIndex = (a: { index: number }, b: { index: number }) => a.index - b.index
        return { states: [...states.values()].sort(byIndex), doesNotState: [...left.values()].sort(byIndex) }
    }
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

/**
 * The record as an administrator is told of it: where it is, its standing and its label, why it cannot be used, and (C1) which of its
 * readings he approved and which remain PROPOSED, each named by its entry and parts.
 */
export interface ReadingsAccount {
    source: typeof READINGS_SOURCE
    status: RecordStatus | 'UNUSABLE'
    label: string | null
    labelStatus: 'DRAFT'
    why: string | null
    approved: string[]
    proposed: string[]
}
/** C1: the record's label for an administrator (DRAFT words), naming the readings still PROPOSED where some are approved. */
const recordLabelOf = (status: RecordStatus | 'UNUSABLE', approved: string[], proposed: string[]): string | null =>
    status === 'PROPOSED'
        ? READING_PROPOSED_LABEL
        : status === 'APPROVED'
          ? READING_APPROVED_LABEL
          : status === 'PARTLY_APPROVED'
            ? `readings partly approved. Approved: ${approved.join('; ')}. Still PROPOSED, awaiting confirmation: ${proposed.join('; ')}`
            : null
export const readingsAccountOf = (load: ReadingsLoad): ReadingsAccount => {
    const approved = load.readings.filter(reading => reading.status === 'APPROVED').map(readingNameOf)
    const proposed = load.readings.filter(reading => reading.status !== 'APPROVED').map(readingNameOf)
    return { source: READINGS_SOURCE, status: load.status, label: recordLabelOf(load.status, approved, proposed), labelStatus: 'DRAFT', why: load.why, approved, proposed }
}

/**
 * The account of a reading handed in without its record (stage 3F, the 3E review's bookkeeping item: the account always describes the
 * reading the overview was built with): the account of the record it was built from (C1; was: PROPOSED where it named the PROPOSED
 * record), UNUSABLE for a reading built from none.
 */
export const readingsAccountOfReading = (reading: CoverReading): ReadingsAccount => {
    const load = BUILT_FROM.get(reading)
    return load
        ? readingsAccountOf(load)
        : { source: READINGS_SOURCE, status: 'UNUSABLE', label: null, labelStatus: 'DRAFT', why: 'the overview was built with a reading handed in that names no record of what parts of his wording state', approved: [], proposed: [] }
}
