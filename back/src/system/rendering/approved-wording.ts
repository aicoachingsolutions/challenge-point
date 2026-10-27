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
 * The table started EMPTY (14 October 2026); its first entry is his own sentence for the build-out scoring rule (reply filed
 * 19 October 2026, item 1, "Approved with revised wording"), added 18 October 2026 (stage M5). Read through `AUDITS_DIR`, so the bundled server finds it in
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
    /**
     * **What he approved for this entry before** — P1, 25 October 2026, his reply filed 28 October 2026, item 9: *"I approve simplifying the
     * sentence to:"* and *"This is a communication simplification, not a change in scoring eligibility."* Oldest first, each with its own
     * approval and his words replacing it. Never said and never matched: the record of his earlier approval, kept rather than deleted.
     */
    superseded?: SupersededSentence[]
}

/** A sentence he approved and later replaced, with both approvals in his words (P1). */
export interface SupersededSentence {
    sentence: string
    /** For a template: the slot values that reproduced it. */
    example?: Record<string, string>
    approvedBy: { who: string; date: string; quote: string; ccs: string }
    supersededBy: { who: string; date: string; quote: string; citedAs: string }
}

const SECTIONS = new Set(['Set up', 'Players', 'How it works', 'How to score', 'What to watch'])
const filled = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0
const isDate = (value: unknown): boolean => filled(value) && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value))

/**
 * **Why a record of superseded sentences cannot be kept, or null** (P1, 25 October 2026). Absent is fine; present, it is a non-empty list,
 * oldest first, each with its sentence (verbatim in its own approval's quote, as any approved sentence is), its approval and his words
 * replacing it (who, a date no earlier than the approval's, his words and where they are filed); none is the current sentence.
 */
export function supersededUnusableBecause(superseded: unknown, current: string): string | null {
    if (superseded === undefined) return null
    if (!Array.isArray(superseded) || !superseded.length) return 'its superseded record is not a list of sentences'
    for (const [n, record] of superseded.entries()) {
        const which = `superseded sentence ${n + 1}`
        if (!record || typeof record !== 'object') return `${which} is not an object`
        if (!filled(record.sentence)) return `${which} has no sentence`
        if (record.sentence === current) return `${which} is the current sentence`
        const approval = record.approvedBy
        if (!approval || !filled(approval.who) || !isDate(approval.date) || !filled(approval.quote) || !filled(approval.ccs)) return `${which} does not carry its approval (who, date, quote and ccs)`
        if (!approval.quote.includes(record.sentence)) return `${which} is not in the quote of its approval`
        const replaced = record.supersededBy
        if (!replaced || !filled(replaced.who) || !isDate(replaced.date) || !filled(replaced.quote) || !filled(replaced.citedAs)) return `${which} does not say who replaced it, when, in which words and where (supersededBy)`
        if (replaced.date < approval.date) return `${which} is replaced before it was approved`
    }
    return null
}

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
    // P1 (25 October 2026): his current sentence stands in his current approval's words, and what it replaced is kept whole.
    if (entry.superseded !== undefined && !approval.quote.includes(entry.sentence)) return 'it replaces an earlier sentence, and its own is not in the quote of his approval'
    return supersededUnusableBecause(entry.superseded, entry.sentence)
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
    /**
     * `replaces` and `with` (P1, 25 October 2026, his reply filed 28 October 2026, item 5: *"I approve replacing "each team keeps attacking
     * the same zone" with: "Each team keeps attacking the same target.""*): where his approval replaces a clause of the sentence he approved
     * before (the last `superseded` one), the clause he names and his replacement, each verbatim in the quote.
     */
    approvedBy: { who: string; date: string; quote: string; ccs: string; replaces?: string; with?: string }
    /** What he approved for this template before, oldest first (P1); never said and never matched. */
    superseded?: SupersededSentence[]
    /** The role his words name (P1, FIRST_BLOCK_CHOICE): said only in a game that holds it. */
    role?: string
    /** `EQUIPMENT` (P1, his reply filed 28 October 2026, item 3): an equipment template, with what each part states and what the game must hold. */
    kind?: 'EQUIPMENT'
    states?: EquipmentPartState[]
    when?: EquipmentWhen
}

/**
 * **What a part of an equipment sentence states, and so what it cites** — P1, 25 October 2026 (his reply filed 28 October 2026, item 3: *"Yes,
 * please include a concise equipment list."*). `TARGET_OBJECT`: the one object a team scores at, its kind, the team that defends it and its
 * size (slot {size}, the cited pairing's object in whole feet); `CARRIER`: the object played with; `TEAMS_AND_PERFORMER`: the teams' count
 * (a number word bound to the teams) and the colour that tells the named performer apart (the applied law's clause).
 */
export type EquipmentPartState = 'TARGET_OBJECT' | 'CARRIER' | 'TEAMS_AND_PERFORMER'
export const EQUIPMENT_PART_STATES: EquipmentPartState[] = ['TARGET_OBJECT', 'CARRIER', 'TEAMS_AND_PERFORMER']

/** What a game must hold for every word of an equipment sentence to be true of it (P1). */
export interface EquipmentWhen {
    /** The one object a team scores at (its kind, and the performer whose team defends it), or null: the game sets out no such object. */
    targetObject: { kind: string; defendedBy: string } | null
    /** The kind of the object played with. */
    carrier: string
    /** How many teams. */
    teams: number
    /** The performer the sentence tells apart by colour, and the words of the TEAMS_AND_PERFORMER part that do. */
    distinguishes: { performer: string; words: string }
}

/**
 * **Why an equipment sentence's shape cannot be used, or null** (P1): one state per part, each part's state one of the three, each of the three
 * at most once, TARGET_OBJECT exactly where `when` names an object (and {size} only in that part), CARRIER and TEAMS_AND_PERFORMER always,
 * `when` complete, and the distinguishing words inside the TEAMS_AND_PERFORMER part. Shared by the approved templates and the DRAFT entries
 * (`draft-coach-wording.ts`), so both are read the one way.
 */
export function equipmentShapeUnusableBecause(parts: unknown, states: unknown, when: any): string | null {
    if (!Array.isArray(parts) || !parts.length || !parts.every(filled)) return 'it has no parts'
    if (!Array.isArray(states) || states.length !== parts.length) return 'it does not give one state per part'
    if (!states.every(state => (EQUIPMENT_PART_STATES as string[]).includes(state))) return `a part states something other than ${EQUIPMENT_PART_STATES.join(', ')}`
    if (new Set(states).size !== states.length) return 'two parts state the same thing'
    if (!when || typeof when !== 'object') return 'it does not say what the game must hold (when)'
    const target = when.targetObject
    if (target !== null && (!target || typeof target !== 'object' || !filled(target.kind) || !filled(target.defendedBy))) return 'its targetObject is neither null nor { kind, defendedBy }'
    if (states.includes('TARGET_OBJECT') !== (target !== null)) return 'it states a target object exactly where it names none, or names one it does not state'
    if (!states.includes('CARRIER') || !states.includes('TEAMS_AND_PERFORMER')) return 'it does not state the object played with and the teams'
    if (!filled(when.carrier)) return 'it names no object played with (carrier)'
    if (!Number.isInteger(when.teams) || when.teams < 1) return 'it names no count of teams'
    const told = when.distinguishes
    if (!told || !filled(told.performer) || !filled(told.words)) return 'it names no performer it tells apart, or not the words that do (distinguishes)'
    const teamsPart = parts[states.indexOf('TEAMS_AND_PERFORMER')] as string
    if (!teamsPart.includes(told.words)) return 'its distinguishing words are not in the part that states the teams and the performer'
    for (const [n, part] of (parts as string[]).entries()) {
        const slots = [...part.matchAll(/\{(\w+)\}/g)].map(match => match[1])
        if (slots.some(slot => slot !== 'size') || (slots.includes('size') && states[n] !== 'TARGET_OBJECT')) return 'a slot other than {size}, or {size} outside the part stating the target object'
    }
    return null
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
    /**
     * **A clause he replaced** — P1, 25 October 2026 (his reply filed 28 October 2026, item 5: *"I approve replacing "each team keeps attacking
     * the same zone" with: "Each team keeps attacking the same target.""*). Where his approval names the clause it replaces (`replaces`) and his
     * replacement (`with`), each must stand verbatim in his quote, and his sentence is the last superseded sentence with that clause replaced -
     * his replacement taking the clause's own capital and losing its full stop, since it stands inside the sentence. So his whole new sentence
     * need not be in the quote, and the record still cannot drift from his words. Every other template needs his sentence in the quote.
     */
    if (approval.replaces !== undefined || approval.with !== undefined) {
        if (!filled(approval.replaces) || !filled(approval.with)) return 'it names a replacement without both the clause replaced and his replacement'
        if (!approval.quote.includes(approval.replaces) || !approval.quote.includes(approval.with)) return 'the clause it replaces, or his replacement, is not in the quote of his approval'
        const earlier = Array.isArray(entry.superseded) ? entry.superseded[entry.superseded.length - 1] : undefined
        if (!earlier || !filled(earlier.sentence)) return 'it replaces a clause and keeps no sentence it was replaced in (superseded)'
        if (!earlier.sentence.includes(approval.replaces)) return 'the clause it replaces is not in the sentence it superseded'
        const first = approval.replaces.charAt(0)
        const body = approval.with.replace(/\.$/, '')
        const replacement = `${first === first.toLowerCase() ? body.charAt(0).toLowerCase() : body.charAt(0).toUpperCase()}${body.slice(1)}`
        if (earlier.sentence.split(approval.replaces).join(replacement) !== entry.sentence) return `his sentence is not the one he replaced with "${approval.replaces}" made "${replacement}"`
    } else if (!approval.quote.includes(entry.sentence)) return 'his sentence is not in the quote of his approval'
    if (!Array.isArray(entry.parts) || !entry.parts.length || !entry.parts.every(filled)) return 'it has no parts'
    if (!entry.example || typeof entry.example !== 'object') return 'it gives no example values'
    const reproduced = fillTemplate(entry.parts, entry.example)
    if (reproduced === null) return 'a slot of its parts has no example value'
    if (reproduced !== entry.sentence.replace(/\.$/, '')) return `its parts with the example values read "${reproduced}", not his sentence`
    const superseded = supersededUnusableBecause(entry.superseded, entry.sentence)
    if (superseded) return superseded
    if (entry.role !== undefined && !filled(entry.role)) return 'it names an empty role'
    if (entry.kind !== undefined) {
        if (entry.kind !== 'EQUIPMENT') return `its kind ${JSON.stringify(entry.kind)} is not one a template has`
        const shape = equipmentShapeUnusableBecause(entry.parts, entry.states, entry.when)
        if (shape) return `as an equipment template, ${shape}`
    } else if (entry.states !== undefined || entry.when !== undefined) return 'it gives states or when without being an equipment template'
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

/** The id the renderer reads his first-block sentence by (P1, his reply filed 28 October 2026, item 4): a name, never words. */
export const FIRST_BLOCK_CHOICE = 'FIRST_BLOCK_CHOICE'

/** The kind of an equipment template (P1, his reply filed 28 October 2026, item 3): the renderer tries every usable one, in table order. */
export const EQUIPMENT_KIND = 'EQUIPMENT'

/** The approved entries, as copies. */
export const approvedWording = (): ApprovedWording[] => TABLE.approved.map(entry => JSON.parse(JSON.stringify(entry)))

/** The entries in the file that may NOT be used — each one a data defect the test reports. */
export const unapprovedWording = (): { id: string; why: string }[] => TABLE.unapproved.map(entry => ({ ...entry }))
