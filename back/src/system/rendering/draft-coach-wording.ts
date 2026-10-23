/**
 * **DRAFT coach wording for objects and for scoring at an object, read as data** — Stage G, 23 October 2026 (the design of 25 October 2026,
 * section 3: *"goal wording per role, from wording data"*; the no-exception ratchet: *"New wording for a goal comes from data, never from a
 * branch beside ZONE_ENTRY_EVENT"*).
 *
 * Christian, reply filed 26 October 2026, item 1: *"The opposing team may have a different primary scoring event where authorized by the
 * selected context."* Item 5: *"[The object] should be centered on the building team's end line, facing into the playing area, with its
 * structure outside the playing area."* (his noun bracketed: the coupling ratchet keeps a sport's nouns out of this layer; the data file
 * quotes him whole). His reply filed 25 October 2026, item 3: *"A defensive regain alone does not earn a point."*
 *
 * The words live in `docs/audits/draft-coach-wording.json`, keyed by register vocabulary values (an object's kind, row O2; a scoring
 * event, row V1), so no engine file names a kind or a sport noun. Everything here is DRAFT: no sentence built from it is approved wording,
 * and the loader refuses a file that says otherwise. Each entry is checked against the register (a kind of the O2 vocabulary, an event of
 * the V1 vocabulary whose target, by the register's target-type map, is an object of that kind) and carries his words for what it says
 * (`basis`). A file that cannot be used loads as no wording at all, with the reason: then no sentence is said from it, and fidelity refuses
 * any game that needs one, exactly as before this stage (fail-closed). Read once, at module load; build.js copies the file beside the bundle.
 *
 * Read by the renderer (`render-concrete-game.ts`: the Set up sentence placing an object, and how a team scores at an object) and by the
 * fidelity check (`fidelity.ts` Q2: a scoring sentence for a kind with no wording is refused). Nothing here decides anything about a game.
 */
import fs from 'node:fs'
import path from 'node:path'

import { loadRegister } from '../derivation/corpus'
import { AUDITS_DIR } from '../derivation/knowledge-root'
import { indexRegister, RegisterIndex } from '../derivation/register'

export const DRAFT_COACH_WORDING_FILE = path.join(AUDITS_DIR, 'draft-coach-wording.json')
export const DRAFT_COACH_WORDING_SOURCE = 'docs/audits/draft-coach-wording.json' as const

/** His words for what an entry says, verbatim, and the reply they are filed in. */
export interface WordingBasis {
    words: string[]
    citedAs: string
}

/** The words said after an object of a kind is placed on an end line, saying where its structure stands. */
export interface ObjectKindWording {
    kind: string
    standsOutsideArea: string
    basis: WordingBasis
}

/**
 * **The words for an object placed facing one way** — the Stage G review fix, 23 October 2026: keyed by a member of the register's facing
 * vocabulary (the facing row the objectGeometry block names, O6), said after ', ' in the placing sentence. They were a table in the
 * renderer; they are coach words, so they live here with the rest of the placing sentence's words. His reply filed 26 October 2026, item 5:
 * *"[The object] should be centered on the building team's end line, facing into the playing area, with its structure outside the playing
 * area."*
 */
export interface FacingWording {
    facing: string
    words: string
    basis: WordingBasis
}

/**
 * What a clause after a scoring lead states: `MEANING`, what the event itself counts (said wherever the lead is said); `NO_OTHER_SCORE`,
 * that nothing else scores for the team (said only where the team scores by an event of its own and no occurrence also counts for it).
 */
export type ClauseStates = 'MEANING' | 'NO_OTHER_SCORE'
export const CLAUSE_STATES: ClauseStates[] = ['MEANING', 'NO_OTHER_SCORE']

export interface ScoringClause {
    text: string
    states: ClauseStates
    basis: WordingBasis
}

/** How a team scores by an event whose target is an object: the lead (slots {carrier} and {target}), and the clauses after it. */
export interface ScoringAtObjectWording {
    event: string
    targetKind: string
    lead: string
    basis: WordingBasis
    clauses: ScoringClause[]
}

/**
 * **The one sentence the d26 design holds for the sport's normal laws, HELD and never served** — H2, 23 October 2026 (the d26 design's
 * section 3.2, Communication: *"One DRAFT Coach Details sentence, "Otherwise, normal [sport] rules apply", with the sport noun from
 * data."* *"The served zone text is unchanged until he approves."*). His reply filed 26 October 2026, item 10: *"The normal Laws of the Game
 * should apply by default wherever they are applicable, unless an activity introduces an explicit, knowledge-authorized modification."*
 * Whole in the data file (so the sport's noun is data, never this layer's), with his words for it; read only by the default-laws account
 * of the review evidence (`realization/default-laws-check.ts`, `build-activity.ts`), which shows it held. No renderer reads it.
 */
export interface NormalLawsWording {
    words: string
    held: string
    basis: WordingBasis
}

export interface DraftCoachWording {
    objectKinds: ObjectKindWording[]
    facings: FacingWording[]
    scoringAtObjects: ScoringAtObjectWording[]
    /** H2: the held sentence for the sport's normal laws, or null where the file carries none. */
    normalLaws: NormalLawsWording | null
}

/** The wording as loaded, and why it could not be used (then it is empty). */
export interface DraftCoachWordingLoad {
    wording: DraftCoachWording
    why: string | null
}

const filled = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0
const FILE_KEYS = new Set(['about', 'status', 'entryShape', 'objectKinds', 'facings', 'scoringAtObjects', 'normalLaws'])
const NORMAL_LAWS_KEYS = new Set(['words', 'held', 'basis'])
const OBJECT_KEYS = new Set(['kind', 'standsOutsideArea', 'basis'])
const FACING_KEYS = new Set(['facing', 'words', 'basis'])
const SCORING_KEYS = new Set(['event', 'targetKind', 'lead', 'basis', 'clauses'])
const CLAUSE_KEYS = new Set(['text', 'states', 'basis'])
const SLOT = /\{([^{}]*)\}/g
const slotsIn = (text: string): string[] => [...text.matchAll(SLOT)].map(match => match[1])
const strayBrace = (text: string): boolean => text.replace(SLOT, '').includes('{') || text.replace(SLOT, '').includes('}')

function basisUnusableBecause(basis: any): string | null {
    if (!basis || typeof basis !== 'object' || Array.isArray(basis)) return 'its basis is not an object'
    if (!Array.isArray(basis.words) || !basis.words.length || !basis.words.every(filled)) return 'its basis quotes none of his words'
    if (!filled(basis.citedAs) || !/^his reply filed \d{1,2} [A-Z][a-z]+ \d{4}, items? /.test(basis.citedAs)) return 'its basis does not say which of his replies the words are filed in, and where'
    return null
}

/**
 * **Why the file cannot be used, or null** — its keys and DRAFT status (it never carries an approval: his approved words are
 * approved-coach-wording.json's), and every entry: its keys, its kind or event a member of the register's vocabulary, a scoring event whose
 * target the register's target-type map says is an object of the entry's kind, the lead's slots exactly {carrier} and {target}, a clause's
 * only {carrier}, a known `states`, his words for each, and no kind or event listed twice. A facing entry (the Stage G review fix) names a
 * member of the register's facing vocabulary, once, with words holding no slot and his words for them.
 */
export function draftCoachWordingUnusableBecause(file: any, index: RegisterIndex): string | null {
    if (!file || typeof file !== 'object' || Array.isArray(file)) return 'the file is not an object'
    for (const key of Object.keys(file)) if (!FILE_KEYS.has(key)) return `the file carries "${key}", which no such file holds (an approval belongs in approved-coach-wording.json, never here)`
    if (file.status !== 'DRAFT') return `its status is ${JSON.stringify(file.status)}: every word here is DRAFT until he approves it, and then it moves to approved-coach-wording.json`
    const geometry = index.objectGeometry
    const kindAttribute = geometry ? index.rows.get(geometry.kindRow)?.selectorAttribute : undefined
    const objectKinds = geometry && kindAttribute ? (index.vocabularies.get(`${geometry.kindRow}.${kindAttribute}`) ?? []) : []
    const scoring = index.roleScoring
    const events = scoring ? (index.vocabularies.get(scoring.kindVocabulary) ?? []) : []
    const facingVocabulary = geometry && geometry.facingRow && geometry.facingLeaf ? (index.vocabularies.get(`${geometry.facingRow}.${geometry.facingLeaf}`) ?? []) : []
    if (!Array.isArray(file.objectKinds) || !Array.isArray(file.facings) || !Array.isArray(file.scoringAtObjects)) return 'it holds no objectKinds, facings and scoringAtObjects lists'
    const kinds = new Set<string>()
    for (const [n, entry] of (file.objectKinds as any[]).entries()) {
        const which = `object kind ${n + 1}`
        if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return `${which} is not an object`
        for (const key of Object.keys(entry)) if (!OBJECT_KEYS.has(key)) return `${which} carries "${key}"`
        if (!filled(entry.kind) || !objectKinds.includes(entry.kind)) return `${which} names ${JSON.stringify(entry.kind)}, which is no object kind of the register's vocabulary`
        if (kinds.has(entry.kind)) return `${which} lists ${entry.kind} again`
        kinds.add(entry.kind)
        if (!filled(entry.standsOutsideArea) || slotsIn(entry.standsOutsideArea).length || strayBrace(entry.standsOutsideArea)) return `${which}: its words where its structure stands are missing or hold a slot`
        const basis = basisUnusableBecause(entry.basis)
        if (basis) return `${which}: ${basis}`
    }
    const facings = new Set<string>()
    for (const [n, entry] of (file.facings as any[]).entries()) {
        const which = `facing ${n + 1}`
        if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return `${which} is not an object`
        for (const key of Object.keys(entry)) if (!FACING_KEYS.has(key)) return `${which} carries "${key}"`
        if (!filled(entry.facing) || !facingVocabulary.includes(entry.facing)) return `${which} names ${JSON.stringify(entry.facing)}, which is no member of the register's facing vocabulary`
        if (facings.has(entry.facing)) return `${which} lists ${entry.facing} again`
        facings.add(entry.facing)
        if (!filled(entry.words) || slotsIn(entry.words).length || strayBrace(entry.words)) return `${which}: its words are missing or hold a slot`
        const basis = basisUnusableBecause(entry.basis)
        if (basis) return `${which}: ${basis}`
    }
    const pairs = new Set<string>()
    for (const [n, entry] of (file.scoringAtObjects as any[]).entries()) {
        const which = `scoring entry ${n + 1}`
        if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return `${which} is not an object`
        for (const key of Object.keys(entry)) if (!SCORING_KEYS.has(key)) return `${which} carries "${key}"`
        if (!filled(entry.event) || !events.includes(entry.event)) return `${which} names the event ${JSON.stringify(entry.event)}, which is no member of the register's scoring-event vocabulary`
        if (!filled(entry.targetKind) || !objectKinds.includes(entry.targetKind)) return `${which} names the target kind ${JSON.stringify(entry.targetKind)}, which is no object kind of the register's vocabulary`
        const targets = scoring?.targetTypes.get(entry.event) ?? []
        if (!targets.some(target => target.target === 'object' && target.type === entry.targetKind)) return `${which}: the register's target-type map does not say ${entry.event} scores at an object of the kind ${entry.targetKind}`
        if (pairs.has(`${entry.event}|${entry.targetKind}`)) return `${which} lists ${entry.event} at ${entry.targetKind} again`
        pairs.add(`${entry.event}|${entry.targetKind}`)
        if (!filled(entry.lead) || strayBrace(entry.lead) || JSON.stringify([...new Set(slotsIn(entry.lead))].sort()) !== JSON.stringify(['carrier', 'target'])) return `${which}: its lead must hold exactly the slots {carrier} and {target}`
        const basis = basisUnusableBecause(entry.basis)
        if (basis) return `${which}: ${basis}`
        if (!Array.isArray(entry.clauses)) return `${which} holds no clauses list`
        for (const [k, clause] of (entry.clauses as any[]).entries()) {
            const at = `${which}, clause ${k + 1}`
            if (!clause || typeof clause !== 'object' || Array.isArray(clause)) return `${at} is not an object`
            for (const key of Object.keys(clause)) if (!CLAUSE_KEYS.has(key)) return `${at} carries "${key}"`
            if (!filled(clause.text) || strayBrace(clause.text) || slotsIn(clause.text).some(slot => slot !== 'carrier')) return `${at}: its words are missing or hold a slot other than {carrier}`
            if (!CLAUSE_STATES.includes(clause.states)) return `${at} states ${JSON.stringify(clause.states)}, which is none of ${CLAUSE_STATES.join(', ')}`
            const own = basisUnusableBecause(clause.basis)
            if (own) return `${at}: ${own}`
        }
    }
    // H2 (23 October 2026): the held sentence for the sport's normal laws, where the file carries it - whole words with no slot, why it is
    // held, and his words for it.
    if (file.normalLaws !== undefined) {
        const entry = file.normalLaws
        if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return 'its normalLaws entry is not an object'
        for (const key of Object.keys(entry)) if (!NORMAL_LAWS_KEYS.has(key)) return `its normalLaws entry carries "${key}"`
        if (!filled(entry.words) || slotsIn(entry.words).length || strayBrace(entry.words)) return 'its normalLaws words are missing or hold a slot'
        if (!filled(entry.held)) return 'its normalLaws entry does not say why it is held (held)'
        const basis = basisUnusableBecause(entry.basis)
        if (basis) return `its normalLaws entry: ${basis}`
    }
    return null
}

const EMPTY: DraftCoachWording = { objectKinds: [], facings: [], scoringAtObjects: [], normalLaws: null }

/** The wording from a parsed file, copied, or none with why. */
export function draftCoachWordingLoadOf(file: any, index: RegisterIndex): DraftCoachWordingLoad {
    const why = draftCoachWordingUnusableBecause(file, index)
    if (why) return { wording: JSON.parse(JSON.stringify(EMPTY)), why: `${DRAFT_COACH_WORDING_SOURCE} cannot be used: ${why}` }
    return {
        wording: {
            objectKinds: JSON.parse(JSON.stringify(file.objectKinds)),
            facings: JSON.parse(JSON.stringify(file.facings)),
            scoringAtObjects: JSON.parse(JSON.stringify(file.scoringAtObjects)),
            normalLaws: file.normalLaws === undefined ? null : JSON.parse(JSON.stringify(file.normalLaws)),
        },
        why: null,
    }
}

function readWording(): DraftCoachWordingLoad {
    try {
        const text = fs.readFileSync(DRAFT_COACH_WORDING_FILE, 'utf8')
        return draftCoachWordingLoadOf(JSON.parse(text.charCodeAt(0) === 0xfeff ? text.slice(1) : text), indexRegister(loadRegister()))
    } catch (error) {
        return { wording: JSON.parse(JSON.stringify(EMPTY)), why: `${DRAFT_COACH_WORDING_SOURCE} could not be read: ${error instanceof Error ? error.message : String(error)}` }
    }
}

let loaded: DraftCoachWordingLoad | null = null
/** The wording as loaded at first use, as a copy (with why, where it could not be used). */
export function draftCoachWordingLoad(): DraftCoachWordingLoad {
    if (!loaded) loaded = readWording()
    return JSON.parse(JSON.stringify(loaded))
}

/** How a team scores by this event at an object of this kind, or null where no DRAFT wording is written for it. */
export function scoringAtObjectWording(event: unknown, targetKind: unknown, wording: DraftCoachWording = draftCoachWordingLoad().wording): ScoringAtObjectWording | null {
    return wording.scoringAtObjects.find(entry => entry.event === event && (targetKind === undefined || entry.targetKind === targetKind)) ?? null
}

/** Whether any DRAFT wording says how a team scores by this event at an object (of any kind). */
export const scoresAtAnObject = (event: unknown, wording: DraftCoachWording = draftCoachWordingLoad().wording): boolean => wording.scoringAtObjects.some(entry => entry.event === event)

/** The words for an object of this kind placed on an end line, or null where none are written. */
export function objectKindWording(kind: unknown, wording: DraftCoachWording = draftCoachWordingLoad().wording): ObjectKindWording | null {
    return wording.objectKinds.find(entry => entry.kind === kind) ?? null
}

/** The words for an object placed facing this way, or null where none are written (the Stage G review fix). */
export function facingWording(facing: unknown, wording: DraftCoachWording = draftCoachWordingLoad().wording): FacingWording | null {
    return wording.facings.find(entry => entry.facing === facing) ?? null
}

/** A DRAFT template with its slots filled, or null where a slot it holds has no value. */
export function fillSlots(text: string, values: Record<string, string>): string | null {
    let missing = false
    const out = text.replace(SLOT, (_, slot: string) => {
        if (typeof values[slot] !== 'string') missing = true
        return String(values[slot])
    })
    return missing ? null : out
}
