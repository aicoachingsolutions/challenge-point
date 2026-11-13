/**
 * **For tests only. Our CANDIDATE coach wording for a review-level activity, its reader and the gate it is held to** — stage B2 of the A02
 * complete-activity package, 12 November 2026. Christian, received 12 November 2026: "Please prepare candidate coach-facing wording for my
 * review, with the complete approved meaning preserved in the underlying representation." and "Produce one complete A02 activity through the
 * checked pathway, at review level, with all required conditions grounded in approved knowledge."
 *
 * The file it reads (docs/audits/drafts/a02-composition/a02-coach-wording.CANDIDATE.json) holds:
 *   - `entries`: sentences in the approved table's cover shape (`id`, `covers` with element locators, `sentence`, `section`), each carrying
 *     `candidateBy` (who: 'ours', the date, the approved rows it restates and Christian's rulings it rests on, each verbatim) in place of
 *     `approvedBy`. The renderer and fidelity read them only where a TEST-ONLY build hands them in (build-activity.ts `candidateWording`),
 *     beside the approved table and never in it: an entry here carries no approval, so the approved table's own loader would refuse it.
 *   - `printerOnly`: sentences the engine never says (the placement rule of a PROPOSED configuration, an optional restart arrangement, scoring
 *     details, a learning explanation), printed by the review print beside the served text, each with its label.
 *
 * NOT LIVE, NOT APPROVED. No route, no engine module and no approved table reads this module or the file (a scan in a02-hpe1.unit.ts; the
 * production bundle test names both as absent). Sport-neutral: what a quote must be verbatim in (the rows, the recorded rulings) and the words
 * no sentence may hold are handed in by the caller (`CandidateWordingSources`), so no sport term or sport file is named here.
 *
 * THE GATE (`candidateWordingRefusals`), every defect named, the file refused whole on any:
 *   - the file stands CANDIDATE (TEST-ONLY, NOT APPROVED, NOT LIVE) and is labelled CANDIDATE;
 *   - an entry or a printed sentence carrying `approvedBy` (an approval this file can never hold);
 *   - an entry whose shape the renderer cannot read: no id, no sentence, a section no activity has, no cover, a cover without its row, its
 *     `equals` match or its element locator (every cover names its element, so the entry is said once);
 *   - a cover on a row outside the rows only approved words may say (render-concrete-game.ts `wordedOnlyRows`);
 *   - a `candidateBy` that is not ours, or not dated, or restates no row and rests on no ruling; a restated row whose words are not verbatim
 *     in it at the line named; a ruling quote not verbatim in that recorded ruling, or with another received date;
 *   - a sentence holding any of the words the caller names as never to be said (the live origin sentence our rulings replace);
 *   - a printed sentence with no part of the four, or labelled other than PROPOSED or CANDIDATE; an id used twice.
 */
import fs from 'node:fs'
import path from 'node:path'

import { AUDITS_DIR } from '../derivation/knowledge-root'
import { ApprovedWording } from './approved-wording'
import { wordedOnlyRows } from './render-concrete-game'

export const CANDIDATE_COACH_WORDING_FILE = path.join(AUDITS_DIR, 'drafts', 'a02-composition', 'a02-coach-wording.CANDIDATE.json')

/** The four parts Christian named for the coach's text (received 12 November 2026, item 5), in order. */
export const FOUR_PARTS = ['Setup', 'Rules', 'Scoring', 'Learning explanation'] as const
export type FourPart = (typeof FOUR_PARTS)[number]

/** A row restated, at its line, in its own words. */
export interface RestatedRow {
    rowId: string
    line: number
    words: string
}
/** Christian's words a candidate sentence rests on: the recorded ruling, the quote and the date it was received. */
export interface RulingQuote {
    ruling: string
    quote: string
    received: string
}
export interface CandidateBy {
    who: 'ours'
    date: string
    restates: RestatedRow[]
    rulings: RulingQuote[]
}
/** An entry in the approved table's cover shape, with `candidateBy` in place of `approvedBy`. */
export interface CandidateWordingEntry {
    id: string
    covers: ApprovedWording['covers']
    sentence: string
    section: ApprovedWording['section']
    candidateBy: CandidateBy
}
/** A sentence the engine never says, printed by the review print in its part, with its label. */
export interface PrintedOnlySentence {
    id: string
    part: FourPart
    label: 'PROPOSED' | 'CANDIDATE'
    sentence: string
    candidateBy: CandidateBy
}
export interface CandidateWording {
    file: string
    standing: string
    entries: CandidateWordingEntry[]
    printerOnly: PrintedOnlySentence[]
}

/** What the gate holds the file's quotes and sentences to, handed in by the caller (so this module names no sport file or term). */
export interface CandidateWordingSources {
    /** Why a restated row does not hold (its row unknown, its line not the row's, its words not verbatim in it), or null where it holds. */
    citation: (cited: RestatedRow) => string | null
    /** The recorded rulings a candidate sentence may rest on: each id, Christian's words and the date received. */
    rulings: { id: string; words: string[]; received: string }[]
    /** Words no candidate sentence may hold. */
    never: string[]
}

export class CandidateWordingRefused extends Error {
    readonly reasons: string[]
    constructor(reasons: string[]) {
        super(`The CANDIDATE coach wording is refused:\n  - ${reasons.join('\n  - ')}`)
        this.name = 'CandidateWordingRefused'
        this.reasons = reasons
    }
}

const SECTIONS = ['Set up', 'Players', 'How it works', 'How to score', 'What to watch']
const filled = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0
const isObject = (value: unknown): value is Record<string, any> => !!value && typeof value === 'object' && !Array.isArray(value)
const isDate = (value: unknown): boolean => filled(value) && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value))

/** Every defect of `candidateBy`, named at `at`. */
function candidateByRefusals(by: any, at: string, sources: CandidateWordingSources): string[] {
    const reasons: string[] = []
    if (!isObject(by)) return [`${at} carries no candidateBy (who, date, restates, rulings)`]
    if (by.who !== 'ours') reasons.push(`${at}: candidateBy names ${JSON.stringify(by.who ?? null)}, not 'ours' (a candidate sentence is our wording, never Christian's)`)
    if (!isDate(by.date)) reasons.push(`${at}: candidateBy carries no date`)
    const restates: any[] = Array.isArray(by.restates) ? by.restates : []
    const rulings: any[] = Array.isArray(by.rulings) ? by.rulings : []
    if (!Array.isArray(by.restates) || !Array.isArray(by.rulings)) reasons.push(`${at}: candidateBy lists its restated rows and its rulings (each a list, either may be empty)`)
    if (!restates.length && !rulings.length) reasons.push(`${at}: candidateBy restates no row and rests on no ruling`)
    restates.forEach((cited, n) => {
        const why = sources.citation(cited)
        if (why) reasons.push(`${at}, restated row ${n + 1}: ${why}`)
    })
    rulings.forEach((quoted, n) => {
        const where = `${at}, ruling ${n + 1}`
        const ruling = sources.rulings.find(r => r.id === quoted?.ruling)
        if (!ruling) reasons.push(`${where}: ${JSON.stringify(quoted?.ruling ?? null)} is no recorded ruling`)
        else if (!filled(quoted?.quote) || !ruling.words.some(words => words.includes(quoted.quote))) reasons.push(`${where}: the quote is not verbatim in the recorded ruling ${ruling.id}`)
        else if (quoted?.received !== ruling.received) reasons.push(`${where}: the quote is dated ${JSON.stringify(quoted?.received ?? null)}, and ${ruling.id} was received ${ruling.received}`)
    })
    return reasons
}

/** Every defect of a CANDIDATE wording file; empty where it holds. */
export function candidateWordingRefusals(raw: any, sources: CandidateWordingSources): string[] {
    const reasons: string[] = []
    const standing = raw?.standing
    if (!filled(standing) || !standing.startsWith('CANDIDATE') || !['TEST-ONLY', 'NOT APPROVED', 'NOT LIVE'].every(words => standing.includes(words))) reasons.push('the file does not stand CANDIDATE, TEST-ONLY, NOT APPROVED and NOT LIVE')
    if (raw?.label !== 'CANDIDATE') reasons.push(`the file is labelled ${JSON.stringify(raw?.label ?? null)}, not CANDIDATE`)
    const rows = new Set(wordedOnlyRows())
    const seen = new Set<string>()
    const idOf = (x: any, kind: string): string => {
        const id = String(x?.id ?? '')
        if (!filled(x?.id)) reasons.push(`${kind} has no id`)
        else if (seen.has(id)) reasons.push(`${kind} ${id} uses an id used before in the file`)
        seen.add(id)
        return id
    }
    const neverIn = (sentence: string, at: string) => {
        for (const words of sources.never) if (filled(words) && sentence.includes(words)) reasons.push(`${at}: its sentence holds "${words}", which no candidate sentence may say`)
    }
    const entries: any[] = Array.isArray(raw?.entries) ? raw.entries : []
    if (!entries.length) reasons.push('the file holds no entry')
    for (const entry of entries) {
        const at = `entry ${idOf(entry, 'an entry') || '(no id)'}`
        if (isObject(entry) && 'approvedBy' in entry) reasons.push(`${at} carries approvedBy: a candidate entry is never approved wording`)
        if (!filled(entry?.sentence)) reasons.push(`${at} has no sentence`)
        else neverIn(entry.sentence, at)
        if (!SECTIONS.includes(entry?.section)) reasons.push(`${at}: its section ${JSON.stringify(entry?.section ?? null)} is not one an activity has`)
        const covers: any[] = Array.isArray(entry?.covers) ? entry.covers : []
        if (!covers.length) reasons.push(`${at} covers nothing`)
        for (const cover of covers) {
            if (!filled(cover?.row)) {
                reasons.push(`${at}: a cover names no row`)
                continue
            }
            if (!rows.has(cover.row)) reasons.push(`${at}: the cover on ${cover.row} is on a row the renderer says in its own words; only the rows approved words alone may say (${[...rows].join(', ')}) take a candidate sentence`)
            if (!isObject(cover.match) || !('equals' in cover.match)) reasons.push(`${at}: the cover on ${cover.row} has no equals match`)
            const locator = cover.element
            if (!isObject(locator) || !filled(locator.base) || !filled(locator.field) || !('equals' in locator)) reasons.push(`${at}: the cover on ${cover.row} names no element it holds on (base, field and equals): a candidate entry is said once, for the elements it names`)
        }
        reasons.push(...candidateByRefusals(entry?.candidateBy, at, sources))
    }
    const printed: any[] = Array.isArray(raw?.printerOnly) ? raw.printerOnly : []
    if (raw?.printerOnly !== undefined && !Array.isArray(raw.printerOnly)) reasons.push('printerOnly is not a list')
    for (const sentence of printed) {
        const at = `printed sentence ${idOf(sentence, 'a printed sentence') || '(no id)'}`
        if (isObject(sentence) && 'approvedBy' in sentence) reasons.push(`${at} carries approvedBy: a candidate sentence is never approved wording`)
        if (!(FOUR_PARTS as readonly string[]).includes(sentence?.part)) reasons.push(`${at}: its part ${JSON.stringify(sentence?.part ?? null)} is none of ${FOUR_PARTS.join(', ')}`)
        if (sentence?.label !== 'PROPOSED' && sentence?.label !== 'CANDIDATE') reasons.push(`${at} is labelled ${JSON.stringify(sentence?.label ?? null)}, neither PROPOSED nor CANDIDATE`)
        if (!filled(sentence?.sentence)) reasons.push(`${at} has no sentence`)
        else neverIn(sentence.sentence, at)
        reasons.push(...candidateByRefusals(sentence?.candidateBy, at, sources))
    }
    return reasons
}

/** Read and gate the CANDIDATE wording file; throws CandidateWordingRefused naming every defect. */
export function loadCandidateWording(sources: CandidateWordingSources, file: string = CANDIDATE_COACH_WORDING_FILE): CandidateWording {
    let raw: any
    try {
        raw = JSON.parse(fs.readFileSync(file, 'utf8').replace(/^﻿/, ''))
    } catch (error) {
        throw new CandidateWordingRefused([`the file does not parse: ${error instanceof Error ? error.message : String(error)}`])
    }
    const reasons = candidateWordingRefusals(raw, sources)
    if (reasons.length) throw new CandidateWordingRefused(reasons)
    const copy = JSON.parse(JSON.stringify(raw))
    return { file: path.basename(file), standing: String(copy.standing), entries: copy.entries, printerOnly: copy.printerOnly ?? [] }
}

/**
 * The entries as a table the renderer and fidelity read beside the approved one (`renderConcreteGame`, `checkFidelity`): copies, in the
 * approved table's cover shape, each keeping its `candidateBy` and carrying no approval. Never added to the approved table's file.
 */
export const candidateTable = (wording: CandidateWording): ApprovedWording[] => wording.entries.map(entry => JSON.parse(JSON.stringify(entry)) as unknown as ApprovedWording)
