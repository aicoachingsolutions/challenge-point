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
 *
 * R2, 24 October 2026 (the d27 design's stage R2, its section 2.8), for his reply filed 27 October 2026, items 3 and 4: the words of the one
 * restart after every dead ball (`deadBallRestart`, keyed by the register's common value of row RP1) and the coach's noun for each restart
 * law of the Sport Profile (`restartLawNouns`), read by the renderer's restart sentences and by fidelity (V9), which also reads the held
 * normal-rules sentence to refuse it wherever an adaptation is owed.
 *
 * R3, 24 October 2026 (the d27 design's stage R3), for his reply filed 27 October 2026, item 2: the one sentence for a law an activity
 * departs from without replacing it (`departedLaws`, keyed by a Sport Profile law that is no restart law), read by the renderer's How it
 * works and by fidelity (V9).
 */
import fs from 'node:fs'
import path from 'node:path'

import { loadRegister, loadSportDefaultLaws } from '../derivation/corpus'
import { DefaultLaws } from '../derivation/default-laws'
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

/**
 * **When a restart happens, for a trigger the renderer's own table has no words for** — R1, 24 October 2026 (the d27 design's section 2.8:
 * *"The trigger phrases come from data. draft-coach-wording.json gains a `triggers` map"*). Christian, reply filed 27 October 2026, item 4:
 * *"Whenever the [object] becomes dead, play resets to a new [specialized-role]-initiated build-out."* and the occasions he lists (his nouns
 * bracketed: the coupling ratchet keeps a sport's nouns out of this layer; the data file quotes him whole). Keyed by a member of the register's
 * trigger vocabulary; the phrase may hold the slot {carrier} (the kind of the object played with) and nothing else. Read by the renderer's
 * restart sentence (`render-concrete-game.ts`), before its own table; a trigger with neither has no words, so its restart is not said and
 * fidelity refuses the game, exactly as before.
 *
 * **R2, 24 October 2026: the common restart's moments only, in the order listed** (the d27 design's section 2.8; the R1 review's should-fix:
 * two triggers sharing a phrase claim more than a game holding only one of them would). Read only for a game whose dead-ball restart policy
 * (register row RP1) is the register's common value, where every trigger the block classes as making the ball dead restarts play in the one
 * group; a game keeping a restart per trigger is said by the renderer's own table and its out-of-play sentences, exactly as before R1.
 */
export interface TriggerWording {
    trigger: string
    phrase: string
    basis: WordingBasis
}

/**
 * **The words of the one restart after every dead ball** — R2, 24 October 2026 (the d27 design's stage R2, its section 2.8: *"draft-coach-
 * wording.json gains a `triggers` map, a `deadBallRestart.COMMON` entry and `restartLawNouns`, each with his words"*). Christian, reply
 * filed 27 October 2026, item 4: *"Ball becomes dead: initiate a new [specialized-role] build-out."* (his noun bracketed, as above). Keyed by
 * the register's dead-ball block's common value (row RP1), never by an activity: `starts` ("{taker} starts play") and `restarts` ("restarts
 * it whenever the {carrier} is dead") open the How it works sentence of a group of restarts holding the start and every dead-ball
 * transition; `noOtherRestarts` ("There are no {restarts} in this activity") is the Restarts and ball out sentence, its slot the nouns below
 * of the laws the game's default-laws account records as departed from. Read by the renderer only (`render-concrete-game.ts`).
 */
export interface DeadBallRestartWording {
    starts: string
    restarts: string
    noOtherRestarts: string
    basis: WordingBasis
}

/**
 * **The coach's noun for a restart law the sport's profile names** — R2, 24 October 2026 (the d27 design's section 2.8: *"It names only the
 * restart laws the account records as DEPARTED that have a noun in `restartLawNouns`"*). Keyed by the id of a law the Sport Profile's
 * defaultLaws block names and marks `restart`; `then`, where given, is said after "; " wherever the noun is said (his item 3, for the restart
 * a foul is sanctioned by: fouls still matter). Read by the renderer's Restarts and ball out sentence and by fidelity (V9), in the order listed.
 */
export interface RestartLawNoun {
    law: string
    noun: string
    then?: string
    basis: WordingBasis
}

/**
 * **The one sentence for a law an activity departs from without replacing it** — R3, 24 October 2026 (the d27 design's stage R3, its
 * section 2.8: *"[No restriction on position], said once, in both versions"*). Christian, reply filed 27 October 2026, item 2: *"I approve
 * no [restriction on position] for this initial realization, with that modification communicated once to the coach."* (his noun bracketed:
 * the coupling ratchet keeps a sport's nouns out of this layer; the data file quotes him whole). Keyed by the id of a law the Sport
 * Profile's defaultLaws block names and does not mark a restart law (a restart law is named by the Restarts and ball out sentence, from
 * `restartLawNouns`, so no law is told twice); `words` is the whole sentence, with no slot and no final full stop (an instruction carries
 * none). Read by the renderer (said once, in How it works, where the game's default-laws account records the law as departed from) and by
 * fidelity (V9: a law departed from for communication is cited by exactly one sentence).
 */
export interface DepartedLawWording {
    law: string
    words: string
    basis: WordingBasis
}

export interface DraftCoachWording {
    objectKinds: ObjectKindWording[]
    facings: FacingWording[]
    scoringAtObjects: ScoringAtObjectWording[]
    /** H2: the held sentence for the sport's normal laws, or null where the file carries none. */
    normalLaws: NormalLawsWording | null
    /** R1: the phrases for when a restart happens, by trigger (empty where the file carries none). R2: the common restart's moments only. */
    triggers: TriggerWording[]
    /** R2: the words of the common restart, by the policy value they are said for (empty where the file carries none). */
    deadBallRestart: Record<string, DeadBallRestartWording>
    /** R2: the coach's noun for each restart law, in the order said (empty where the file carries none). */
    restartLawNouns: RestartLawNoun[]
    /** R3: the one sentence for each law an activity departs from without replacing it (empty where the file carries none). */
    departedLaws: DepartedLawWording[]
}

/** The wording as loaded, and why it could not be used (then it is empty). */
export interface DraftCoachWordingLoad {
    wording: DraftCoachWording
    why: string | null
}

const filled = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0
const FILE_KEYS = new Set(['about', 'status', 'entryShape', 'objectKinds', 'facings', 'scoringAtObjects', 'normalLaws', 'triggers', 'deadBallRestart', 'restartLawNouns', 'departedLaws'])
const DEPARTED_LAW_KEYS = new Set(['law', 'words', 'basis'])
const NORMAL_LAWS_KEYS = new Set(['words', 'held', 'basis'])
const TRIGGER_KEYS = new Set(['trigger', 'phrase', 'basis'])
const DEAD_BALL_KEYS = new Set(['starts', 'restarts', 'noOtherRestarts', 'basis'])
const RESTART_NOUN_KEYS = new Set(['law', 'noun', 'then', 'basis'])
/** A template whose slots are exactly these (each said at least once), with no stray brace (R2). */
const slotsExactly = (text: unknown, slots: string[]): boolean =>
    filled(text) && !strayBrace(text) && JSON.stringify([...new Set(slotsIn(text))].sort()) === JSON.stringify([...slots].sort())
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
export function draftCoachWordingUnusableBecause(file: any, index: RegisterIndex, laws: DefaultLaws | null = loadSportDefaultLaws()): string | null {
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
    // R1 (24 October 2026): the phrases for when a restart happens, where the file carries them - each a member of the register's trigger
    // vocabulary, once, its phrase holding no slot but {carrier}, with his words for it.
    if (file.triggers !== undefined) {
        if (!Array.isArray(file.triggers)) return 'its triggers entry is not a list'
        const triggerVocabulary = index.vocabularies.get('trigger') ?? []
        const triggers = new Set<string>()
        for (const [n, entry] of (file.triggers as any[]).entries()) {
            const which = `trigger ${n + 1}`
            if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return `${which} is not an object`
            for (const key of Object.keys(entry)) if (!TRIGGER_KEYS.has(key)) return `${which} carries "${key}"`
            if (!filled(entry.trigger) || !triggerVocabulary.includes(entry.trigger)) return `${which} names ${JSON.stringify(entry.trigger)}, which is no member of the register's trigger vocabulary`
            if (triggers.has(entry.trigger)) return `${which} lists ${entry.trigger} again`
            triggers.add(entry.trigger)
            if (!filled(entry.phrase) || strayBrace(entry.phrase) || slotsIn(entry.phrase).some(slot => slot !== 'carrier')) return `${which}: its phrase is missing or holds a slot other than {carrier}`
            const basis = basisUnusableBecause(entry.basis)
            if (basis) return `${which}: ${basis}`
        }
    }
    /**
     * R2 (24 October 2026; the d27 design's section 2.9, V9: "the wording loader refuses a trigger key outside the vocabulary, a law key outside
     * the profile, wrong slots, a COMMON entry without his words, and any claim of approval"): the common restart's words, keyed only by the
     * register's dead-ball block's common value (the per-trigger value has no sentence of its own), each template with exactly its slots and
     * his words for it; and each restart law's noun, a law the Sport Profile names and marks a restart, once, with no slot and his words. A
     * claim of approval is refused as every other key no entry holds is (an approval belongs in approved-coach-wording.json).
     */
    if (file.deadBallRestart !== undefined) {
        const entries = file.deadBallRestart
        if (!entries || typeof entries !== 'object' || Array.isArray(entries)) return 'its deadBallRestart entry is not an object'
        const spec = index.deadBallRestart
        for (const [value, entry] of Object.entries(entries as Record<string, any>)) {
            const which = `its deadBallRestart entry ${value}`
            if (!spec || value !== spec.common) return `${which} is keyed by no common value of the register's deadBallRestart block${spec ? ` (${spec.common})` : ''}: only the common restart has words of its own`
            if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return `${which} is not an object`
            for (const key of Object.keys(entry)) if (!DEAD_BALL_KEYS.has(key)) return `${which} carries "${key}"`
            if (!slotsExactly(entry.starts, ['taker'])) return `${which}: its starts must hold exactly the slot {taker}`
            if (!filled(entry.restarts) || strayBrace(entry.restarts) || slotsIn(entry.restarts).some(slot => slot !== 'carrier')) return `${which}: its restarts is missing or holds a slot other than {carrier}`
            if (!slotsExactly(entry.noOtherRestarts, ['restarts'])) return `${which}: its noOtherRestarts must hold exactly the slot {restarts}`
            const basis = basisUnusableBecause(entry.basis)
            if (basis) return `${which}: ${basis}`
        }
    }
    if (file.restartLawNouns !== undefined) {
        if (!Array.isArray(file.restartLawNouns)) return 'its restartLawNouns entry is not a list'
        if (file.restartLawNouns.length && !laws) return 'it lists restartLawNouns, and the Sport Profile names no default laws'
        const named = new Set<string>()
        for (const [n, entry] of (file.restartLawNouns as any[]).entries()) {
            const which = `restart law noun ${n + 1}`
            if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return `${which} is not an object`
            for (const key of Object.keys(entry)) if (!RESTART_NOUN_KEYS.has(key)) return `${which} carries "${key}"`
            const law = (laws?.laws ?? []).find(candidate => candidate.id === entry.law)
            if (!filled(entry.law) || !law) return `${which} names ${JSON.stringify(entry.law)}, which is no law the Sport Profile's defaultLaws block names`
            if (!law.restart) return `${which} names ${entry.law}, which the Sport Profile does not mark as a restart law`
            if (named.has(entry.law)) return `${which} lists ${entry.law} again`
            named.add(entry.law)
            if (!filled(entry.noun) || slotsIn(entry.noun).length || strayBrace(entry.noun)) return `${which}: its noun is missing or holds a slot`
            if (entry.then !== undefined && (!filled(entry.then) || slotsIn(entry.then).length || strayBrace(entry.then))) return `${which}: its then is empty or holds a slot`
            const basis = basisUnusableBecause(entry.basis)
            if (basis) return `${which}: ${basis}`
        }
    }
    /**
     * R3 (24 October 2026; the d27 design's section 2.9, V9): the one sentence for each law an activity departs from without replacing it -
     * a law the Sport Profile names, never one it marks a restart law (that one is named by the Restarts and ball out sentence, so a law is
     * never told twice), once, its words whole with no slot and no final full stop, with his words for it.
     */
    if (file.departedLaws !== undefined) {
        if (!Array.isArray(file.departedLaws)) return 'its departedLaws entry is not a list'
        if (file.departedLaws.length && !laws) return 'it lists departedLaws, and the Sport Profile names no default laws'
        const named = new Set<string>()
        for (const [n, entry] of (file.departedLaws as any[]).entries()) {
            const which = `departed law ${n + 1}`
            if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return `${which} is not an object`
            for (const key of Object.keys(entry)) if (!DEPARTED_LAW_KEYS.has(key)) return `${which} carries "${key}"`
            const law = (laws?.laws ?? []).find(candidate => candidate.id === entry.law)
            if (!filled(entry.law) || !law) return `${which} names ${JSON.stringify(entry.law)}, which is no law the Sport Profile's defaultLaws block names`
            if (law.restart) return `${which} names ${entry.law}, which the Sport Profile marks as a restart law: a restart law is named by the Restarts and ball out sentence (restartLawNouns), never by a sentence of its own`
            if (named.has(entry.law)) return `${which} lists ${entry.law} again`
            named.add(entry.law)
            if (!filled(entry.words) || slotsIn(entry.words).length || strayBrace(entry.words)) return `${which}: its words are missing or hold a slot`
            if (entry.words.trim().endsWith('.')) return `${which}: its words end with a full stop, which no instruction carries`
            const basis = basisUnusableBecause(entry.basis)
            if (basis) return `${which}: ${basis}`
        }
    }
    return null
}

const EMPTY: DraftCoachWording = { objectKinds: [], facings: [], scoringAtObjects: [], normalLaws: null, triggers: [], deadBallRestart: {}, restartLawNouns: [], departedLaws: [] }

/** The wording from a parsed file, copied, or none with why. */
export function draftCoachWordingLoadOf(file: any, index: RegisterIndex, laws: DefaultLaws | null = loadSportDefaultLaws()): DraftCoachWordingLoad {
    const why = draftCoachWordingUnusableBecause(file, index, laws)
    if (why) return { wording: JSON.parse(JSON.stringify(EMPTY)), why: `${DRAFT_COACH_WORDING_SOURCE} cannot be used: ${why}` }
    return {
        wording: {
            objectKinds: JSON.parse(JSON.stringify(file.objectKinds)),
            facings: JSON.parse(JSON.stringify(file.facings)),
            scoringAtObjects: JSON.parse(JSON.stringify(file.scoringAtObjects)),
            normalLaws: file.normalLaws === undefined ? null : JSON.parse(JSON.stringify(file.normalLaws)),
            triggers: file.triggers === undefined ? [] : JSON.parse(JSON.stringify(file.triggers)),
            deadBallRestart: file.deadBallRestart === undefined ? {} : JSON.parse(JSON.stringify(file.deadBallRestart)),
            restartLawNouns: file.restartLawNouns === undefined ? [] : JSON.parse(JSON.stringify(file.restartLawNouns)),
            departedLaws: file.departedLaws === undefined ? [] : JSON.parse(JSON.stringify(file.departedLaws)),
        },
        why: null,
    }
}

/** The DRAFT phrase for when a restart on this trigger happens, or null where none is written (R1). */
export function triggerWording(trigger: unknown, wording: DraftCoachWording = draftCoachWordingLoad().wording): TriggerWording | null {
    return wording.triggers.find(entry => entry.trigger === trigger) ?? null
}

/** Where the DRAFT data lists this trigger's phrase, or -1 (R2: the common restart's moments are said in the order listed). */
export function triggerWordingOrder(trigger: unknown, wording: DraftCoachWording = draftCoachWordingLoad().wording): number {
    return wording.triggers.findIndex(entry => entry.trigger === trigger)
}

/** The DRAFT words of the restart said for this dead-ball restart policy value, or null where none are written (R2). */
export function deadBallRestartWording(value: unknown, wording: DraftCoachWording = draftCoachWordingLoad().wording): DeadBallRestartWording | null {
    return typeof value === 'string' && Object.prototype.hasOwnProperty.call(wording.deadBallRestart, value) ? wording.deadBallRestart[value] : null
}

/** The coach's nouns for the restart laws, in the order said (R2). */
export function restartLawNouns(wording: DraftCoachWording = draftCoachWordingLoad().wording): RestartLawNoun[] {
    return wording.restartLawNouns.map(entry => ({ ...entry, basis: { words: [...entry.basis.words], citedAs: entry.basis.citedAs } }))
}

/** The one sentence for each law an activity departs from without replacing it, in the order listed (R3). */
export function departedLawWordings(wording: DraftCoachWording = draftCoachWordingLoad().wording): DepartedLawWording[] {
    return wording.departedLaws.map(entry => ({ ...entry, basis: { words: [...entry.basis.words], citedAs: entry.basis.citedAs } }))
}

/** The slots a DRAFT template holds, by name (R1: whether a phrase names the object played with, so its sentence cites the object). */
export const slotsOf = (text: string): string[] => slotsIn(text)

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
