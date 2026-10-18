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

/**
 * **The one element of a collection said only in approved words whose field equals a value** — stage M3, 17 October 2026 (design
 * step L8). Christian, reply filed 19 October 2026, item 1: *"Approved with revised wording"*, one sentence of his for a scoring rule
 * the game holds in five parts — the building role's credit bound (row B8, on a role element) and the four conditions on the primary
 * event (rows V3-V6, each its own element). An entry matched element by element could only say his sentence once per element (four
 * or five times), so a cover may name the element it holds on: `base` is a collection the renderer says only in approved words,
 * `field` a field of its elements (a role's own name is its selector attribute, which has no row of its own), `equals` the value
 * that picks the element out. The locator is data, so no role, condition type or sport term is written in code.
 */
export interface ElementLocator {
    base: string
    field: string
    equals: unknown
}

/**
 * **A value as one canonical string: object keys sorted at every depth** — stage M3 (design step L8). `JSON.stringify` follows the
 * order keys were written in, so an approved cover written `{ "role": …, "objectiveReferenceOf": … }` failed to equal the game's
 * `{ "objectiveReferenceOf": …, "role": … }` (READ in the design; measured in approved-wording.unit.ts). Equality of approved values
 * is equality of what they say, never of how the file spelled them.
 */
export function canonicalJson(value: unknown): string {
    const sorted = (node: unknown): unknown => {
        if (Array.isArray(node)) return node.map(sorted)
        if (node && typeof node === 'object') return Object.fromEntries(Object.keys(node as object).sort().map(key => [key, sorted((node as Record<string, unknown>)[key])]))
        return node
    }
    return JSON.stringify(sorted(value)) ?? 'undefined'
}

export interface ApprovedWording {
    id: string
    /** `element` (stage M3): every cover of an entry names the element it holds on, or none does (`unusableBecause`). */
    covers: { row: string; match: WordingMatch; element?: ElementLocator }[]
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
        if (cover.element !== undefined) {
            const locator = cover.element
            if (!locator || typeof locator !== 'object' || !filled(locator.base) || !filled(locator.field) || !('equals' in locator)) return `the cover on ${cover.row} names an element it cannot pick out (base, field and equals are required)`
        }
    }
    // Stage M3: an entry is said once for the elements it names, or once per element it holds on; never half of each.
    const located = entry.covers.filter((cover: any) => cover.element !== undefined).length
    if (located && located !== entry.covers.length) return 'it mixes covers that name their element with covers that do not'
    if (located && entry.slots !== undefined && Object.keys(entry.slots ?? {}).length) return 'a slot names no element, and its covers each name one'
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

/**
 * **A sentence he approved for a template the renderer already says** — stage M4, 17 October 2026 (design step L10). His reply filed
 * 19 October 2026, item 4: *"I approve both of your proposed revisions:"* … *"Use: "When possession changes, play carries on without a
 * stoppage, and each team keeps attacking the same zone.""* An entry (above) holds wording for a field the renderer may NOT say on its
 * own; this sentence translates fields it already says (a transition's play state, the objectives' teams, the targets' noun), so making
 * them withheld would refuse every game that holds them. So it is a template: its parts are the renderer's words, `{slot}`s are filled
 * from the game and cited, and it is usable only where (a) it carries his approval as an entry does, (b) his sentence appears verbatim
 * in the quote, and (c) its parts, filled with the example values, reproduce his sentence exactly (a final full stop aside — a
 * coach-facing instruction carries none). So the record cannot drift from his words, and a renderer saying the template is saying them.
 * Filled with any other value (the demonstrations' "line") the sentence is a generalization of his words: DRAFT.
 */
export interface ApprovedTemplateSentence {
    id: string
    /** What it says and where the renderer says it (documentation). */
    renders: string
    /** The parts the renderer joins, in order; `{slot}` names a slot. */
    parts: string[]
    /** The slot values that reproduce his sentence. */
    example: Record<string, string>
    /** His sentence, verbatim. */
    sentence: string
    approvedBy: { who: string; date: string; quote: string; ccs: string }
}

/** The template's parts joined, each `{slot}` filled from `values`; null where a slot has no value. */
export function fillTemplate(parts: string[], values: Record<string, string>): string | null {
    let missing = false
    const text = parts.join('').replace(/\{(\w+)\}/g, (_, slot: string) => {
        if (typeof values[slot] !== 'string') missing = true
        return String(values[slot])
    })
    return missing ? null : text
}

/** Why a template sentence cannot be used, or null where it can. */
export function templateUnusableBecause(entry: any): string | null {
    if (!entry || typeof entry !== 'object') return 'not an object'
    if (!filled(entry.id)) return 'it has no id'
    const approval = entry.approvedBy
    if (!approval || !filled(approval.who)) return 'it does not say who approved it'
    if (!isDate(approval.date)) return 'it carries no approval date'
    if (!filled(approval.quote)) return 'it carries no verbatim approval'
    if (!filled(approval.ccs)) return 'it does not name the standard it was reviewed under'
    if (!filled(entry.sentence)) return 'it has no sentence'
    if (!approval.quote.includes(entry.sentence)) return 'his sentence is not in the quote of his approval'
    if (!Array.isArray(entry.parts) || !entry.parts.length || !entry.parts.every(filled)) return 'it has no parts'
    if (!entry.example || typeof entry.example !== 'object') return 'it gives no example values'
    const reproduced = fillTemplate(entry.parts, entry.example)
    if (reproduced === null) return 'a slot of its parts has no example value'
    if (reproduced !== entry.sentence.replace(/\.$/, '')) return `its parts with the example values read "${reproduced}", not his sentence`
    return null
}

export const APPROVED_WORDING_FILE = path.join(AUDITS_DIR, 'approved-coach-wording.json')

const FILE = JSON.parse(fs.readFileSync(APPROVED_WORDING_FILE, 'utf8').replace(/^﻿/, ''))
const TABLE = partitionWording(FILE.entries ?? [])
const TEMPLATES = (FILE.approvedTemplateSentences ?? []).map((entry: any) => ({ entry, why: templateUnusableBecause(entry) }))

/** The template sentences that may be used, as copies (stage M4). */
export const approvedTemplateSentences = (): ApprovedTemplateSentence[] => TEMPLATES.filter((t: any) => !t.why).map((t: any) => JSON.parse(JSON.stringify(t.entry)))

/** The template sentences in the file that may NOT be used — each one a data defect the test reports (stage M4). */
export const unapprovedTemplateSentences = (): { id: string; why: string }[] => TEMPLATES.filter((t: any) => t.why).map((t: any) => ({ id: String(t.entry?.id ?? '(no id)'), why: String(t.why) }))

/** The id the renderer reads his possession sentence by (stage M4): a name for the template, never words. */
export const POSSESSION_CONTINUES = 'POSSESSION_CONTINUES'

/** The approved entries, as copies. */
export const approvedWording = (): ApprovedWording[] => TABLE.approved.map(entry => JSON.parse(JSON.stringify(entry)))

/** The entries in the file that may NOT be used — each one a data defect the test reports. */
export const unapprovedWording = (): { id: string; why: string }[] => TABLE.unapproved.map(entry => ({ ...entry }))
