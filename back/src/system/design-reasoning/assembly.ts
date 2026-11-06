/**
 * **The bounded activity-assembly experiment: validation, assembly, his six classes, the requirement account and the coach-text join** —
 * review pathway only, offline (Christian's second reply of 5 November 2026: *"I authorize a bounded, offline, review-only
 * activity-assembly experiment"* / *"Where a choice cannot be authorized, an illustrative value may be used for this offline prototype if
 * clearly labeled and kept outside production selection authority."* / *"Please distinguish what actually determined the configuration from
 * material merely consulted or cited."*).
 *
 * WHAT IT IS. The architecture has no configuration step (Steps 3-5 are held). So the configuration is a labelled decision record we
 * entered (`assembly-experiment.review.json`): each value carries a declared standing, the items that decided it (his words with the exact
 * substring that states the value, or a knowledge cell) and what was only consulted. Some values are read from knowledge by code (the
 * Game Problems and compatible Game Forms the Stage 1/2 code computes, and a few knowledge cells). This file:
 *   - validates the record by hand (unknown keys, unknown standings, missing words, file or received date, missing value evidence, his
 *     example words or reference-only material among what decided a value, a declared status stronger than what decided it: each throws);
 *   - assembles the activity, failing closed where the record disagrees with what the code computes (Step 1 unresolved; the illustrative
 *     form not among the compatible ones; Game Problem ids that differ from the ones his words name; a scoring event the routed context
 *     does not hold);
 *   - places each decision in one of his six classes, in his order, as the weakest over what decided it and its declared status;
 *   - joins the requirement account (his four categories; category 3 never counts as satisfied);
 *   - fills the DRAFT coach wording (`assembly-wording.draft.json`): placeholders and checked values only, so the text can say nothing the
 *     record does not hold, and every sentence carries the weakest class among the values it expresses.
 *
 * WHAT IT IS NOT. Not the production renderer, not approved wording, not served, not a selection input. Display text (the coach
 * definition, the scoring event's description, names) arrives as an argument, read from knowledge cells elsewhere after the decisions; no
 * decision here reads narrative. No goal, Game Problem, context, Game Form or row id, and no configuration path, appears in this file: they
 * live in the two JSON files.
 */
import experimentData from './assembly-experiment.review.json'
import wordingData from './assembly-wording.draft.json'
import { activeContextRelationships, cell, Cite, contextIdentityRules, contextProperty, DesignKnowledge, isStanding, OpenDecision, Ruling, SOURCE, Standing } from './knowledge'
import { GameFormSelection } from './forms'
import { DesignResolution } from './resolve'
import { citeRef, EstablishedBy, InfluenceTrace, item, TraceItem } from './trace'

// ---------------------------------------------------------------------------------------------------------------------------------------
// Shapes (the JSON files are validated against these by hand; nothing is trusted by cast alone)
// ---------------------------------------------------------------------------------------------------------------------------------------

export const HOW_REACHED = ['READ_BY_CODE', 'ENTERED_EVIDENCED', 'ENTERED_ILLUSTRATIVE', 'ENTERED_OUR_INFERENCE', 'UNRESOLVED'] as const
export type HowReached = (typeof HOW_REACHED)[number]
export const HOW_REACHED_LABEL: Record<HowReached, string> = {
    READ_BY_CODE: 'READ FROM KNOWLEDGE BY CODE',
    ENTERED_EVIDENCED: 'ENTERED, VALUE EVIDENCED IN HIS WORDS',
    ENTERED_ILLUSTRATIVE: 'ENTERED, ILLUSTRATIVE',
    ENTERED_OUR_INFERENCE: 'ENTERED, OUR INFERENCE',
    UNRESOLVED: 'UNRESOLVED',
}

/** How a READ_BY_CODE value is read. Generic: none names a goal or a row. */
export const READ_BY = ['DISPLAY_CELL', 'RESOLUTION_PRIMARY', 'RESOLUTION_SECONDARY', 'RESOLUTION_FINDINGS', 'COMPATIBLE_ALTERNATIVES', 'CONTEXT_RELATIONSHIP_ROW'] as const
export type ReadBy = (typeof READ_BY)[number]

export interface KnowledgeRef {
    source: string
    table: string
    row: string
    column?: string
}

export interface DecisiveItem {
    rulingRef?: string
    knowledgeRef?: KnowledgeRef
    ref?: 'UNRESOLVED'
    standing: Standing
    valueEvidence?: string
}

export interface ConsultedItem {
    rulingRef?: string
    knowledgeRef?: KnowledgeRef
    ref?: string
    standing: Standing
    note: string
}

export type ChoiceValue = string | number | boolean | null

export interface Choice {
    path: string
    value: ChoiceValue
    valueIsEvidence?: true
    declaredStatus: Standing
    howReached: HowReached
    readBy?: ReadBy
    knowledgeRef?: KnowledgeRef
    decidedBy: DecisiveItem[]
    consulted: ConsultedItem[]
    statusSetBy: Array<{ rulingRef: string }>
    note: string
}

export interface AssemblyRuling extends Ruling {
    received: string
    file: string
    provisional: boolean
}

export interface AccountEntry {
    id: string
    requirementRef: { table: string; row: string }
    clause: string | null
    reading: string | null
    category: string
    standard: string
    paths: string[]
    observableConditions: string | null
    note: string
}

export interface Experiment {
    standing: string
    learningGoalId: string
    gameForm: { illustrativeChoice: string; standing: Standing; rulingRefs: string[]; choicePath: string }
    gameProblemScope: { primaryGameProblemIds: string[]; secondaryGameProblemIds: string[]; rulingRefs: string[]; idResolution: string; note: string }
    /** The rulings the report quotes in fixed places (his question, his acceptance test, his limits, the kickoff caveat, the coach question). */
    reportRefs: Record<'experimentPurpose' | 'acceptance' | 'limits' | 'kickoffCaveat' | 'futureFeedbackQuestion', string>
    bindings:Record<'illustrativeForm' | 'scoringEvent' | 'teamCount' | 'playersPerTeam' | 'areaLength' | 'areaWidth' | 'targetZoneDepth', string>
    derived: Array<{ id: string; formula: 'AREA_PER_OUTFIELD_PLAYER_TOTAL' | 'AREA_PER_OUTFIELD_PLAYER_OUTSIDE_TARGET_ZONES'; label: string; targetZoneCount: number; note: string }>
    rulings: AssemblyRuling[]
    requiredParts: Array<{ id: string; part: string; paths: string[]; generatedFromTrace?: true }>
    designBlockPaths: string[]
    exemptions: Array<{ path: string; reason: string }>
    choices: Choice[]
    laws: Array<{ lawId: string | null; situation?: string; status: 'APPLIES' | 'DEPARTED' | 'NOT APPLICABLE' | 'ADAPTATION OWED'; paths: string[]; reason: string }>
    contractItems: Array<{ itemId: string; mappedTo: string[]; notUsed?: string }>
    contractDeclarationsReported: Array<{ row: string; declaration: string; what: string; how: string }>
    requirementAccountRulingRef: string
    accountCategories: string[]
    accountStandards: string[]
    requirementAccount: AccountEntry[]
    suitability: {
        standing: string
        properties: Array<{ property: string; structural: { status: 'EXPRESSED_BY_CONFIGURATION' | 'NOT_SUPPLIED'; paths: string[]; rows: string[] }; functional: { status: 'ONLY_VERIFIABLE_IN_PLAY' }; note: string }>
        scale: { status: string; statement: string; openDecision: string }
        exposure: Array<{ aspect: string; status: string }>
        identityPoint: { statement: string; rows: string[] }
        addNothing: { status: string; statement: string; rulingRef: string }
    }
    scenarios: {
        standing: string
        rulingRef: string
        circumstances: Array<{ key: string; label: string }>
        decidingCircumstances: string[]
        insufficientWhen: Array<{ key: string; value: boolean }>
        requirementLink: { requirementId: string; circumstanceKey: string; engagesWhen: boolean; rulingRefs: string[]; report: string }
        uncertaintyReport: string
        widthCheck: { configuredArea: { lengthM: number; widthM: number }; availableSpace: { lengthM: number; widthM: number }; playersPerTeam: number[]; standing: string; note: string }
        items: Array<{ id: string; words: string; configuredActivity: Record<string, { value: boolean | 'NOT_SUPPLIED'; label: string }>; expected: { mismatchReported: boolean; uncertaintyReported: boolean } }>
    }
    reconciliations: Array<{ id: string; title: string; rulingRefs: string[]; showPaths?: string[]; items: string[] }>
    openDecisions: Array<{ id: string; blocks: 'ASSEMBLY' | 'SCORING_FIDELITY_OR_PRODUCTION' | 'SUITABILITY' | 'NON_BLOCKING'; question: string; rulingRefs: string[]; handling: string }>
    reconciliation: { rulingRef: string; assessmentItems: Array<{ item: string; carriedBy: string }>; reuse: Array<{ work: string; status: string; why: string }>; stillOpen: string[] }
    dependencies: Array<{ id: string; what: string; options: string }>
    secondGoalNeeds: string[]
}

export interface WordingTemplate {
    id: string
    section: string
    text: string
    expresses: string[]
    whenValue?: Record<string, ChoiceValue>
    status: 'APPROVED CANONICAL' | 'NEWLY PROPOSED'
    quote?: { rulingRef: string }
}

export interface Wording {
    standing: string
    keyedFor: { gameForm: string; scoringEvent: string; note: string }
    coachTerms: { targetZone: string; markedLine: string; source: string }
    sections: Array<{ id: string; level: 'Coach Overview' | 'Coach Details'; title: string; rc3: string }>
    templates: WordingTemplate[]
}

// An open decision of the experiment reuses the Stage 1/2 shape where it fits: the question, his words (by reference) and the handling.
export type AssemblyOpenDecision = Pick<OpenDecision, 'id' | 'question' | 'handling'> & { blocks: Experiment['openDecisions'][number]['blocks']; rulingRefs: string[] }

const deepCopy = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

/** The committed experiment record, a fresh deep copy each call (unvalidated: pass it to `validateExperiment`). */
export const committedExperimentData = (): unknown => deepCopy(experimentData)
/** The committed DRAFT wording, a fresh deep copy each call (unvalidated: pass it to `validateWording`). */
export const committedWordingData = (): unknown => deepCopy(wordingData)

// ---------------------------------------------------------------------------------------------------------------------------------------
// His six classes, in his order (AUTH: "For every material design choice, identify whether it follows from: ...")
// ---------------------------------------------------------------------------------------------------------------------------------------

export const SIX_CLASSES = [
    'Approved canonical knowledge.',
    'An explicit scoped ruling.',
    'Candidate or provisional knowledge.',
    'A stated test assumption.',
    'An illustrative configuration choice.',
    'An unsupported or unresolved relationship.',
] as const
export type SixClass = 1 | 2 | 3 | 4 | 5 | 6

/** Each standing's class when it decides something. PROVISIONAL (his example words) and REFERENCE ONLY never decide: they throw. */
const CLASS_OF_STANDING: Record<Standing, SixClass | 'NEVER_DECISIVE'> = {
    APPROVED: 1,
    RULING: 2,
    PROVISIONAL: 'NEVER_DECISIVE',
    CANDIDATE: 3,
    'REFERENCE ONLY': 'NEVER_DECISIVE',
    OURS: 6,
    'TEST ASSUMPTION': 4,
    'TEST INPUT': 4,
    ILLUSTRATIVE: 5,
    UNRESOLVED: 6,
}

/** How a standing is printed. The code's PROVISIONAL is his words given as an example, never his provisional decisions. */
export const standingLabel = (s: Standing): string => (s === 'PROVISIONAL' ? 'HIS EXAMPLE WORDS (PROVISIONAL)' : s)

export interface ClassInput {
    standing: Standing
    provisional?: boolean
}

/**
 * His class for one decision: the weakest, in his order, over every decisive item and the declared status. A RULING whose ruling he called
 * provisional is class 3 ("Candidate or provisional knowledge."). Nothing decisive, an OURS or UNRESOLVED item, or a conclusion
 * established by logical inference is class 6. A standing outside the type throws.
 */
export function sixClassOf(decisive: ClassInput[], declared: Standing | null = null, establishedBy: EstablishedBy | null = null): SixClass {
    if (!decisive.length || establishedBy === 'LOGICAL INFERENCE') return 6
    let worst: SixClass = 1
    const consider = (s: ClassInput) => {
        if (!isStanding(s.standing)) throw new Error(`unknown standing "${String(s.standing)}"`)
        const c = CLASS_OF_STANDING[s.standing]
        if (c === 'NEVER_DECISIVE') throw new Error(`${standingLabel(s.standing)} can never decide a value`)
        const cls: SixClass = s.standing === 'RULING' && s.provisional ? 3 : c
        if (cls > worst) worst = cls
    }
    for (const d of decisive) consider(d)
    if (declared !== null) consider({ standing: declared })
    return worst
}

/** His class with his words, without their closing full stop (so it reads inside a sentence). */
export const classLabel = (c: SixClass): string => `class ${c}: ${SIX_CLASSES[c - 1].slice(0, -1)}`

const DATE_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
/** A YYYY-MM-DD date as "5 November 2026". */
export const longDate = (iso: string): string => `${Number(iso.slice(8, 10))} ${DATE_MONTHS[Number(iso.slice(5, 7)) - 1]} ${iso.slice(0, 4)}`

/** The marker a review-copy sentence carries: the weakest class among the values it expresses (class 1 unmarked). */
export function markerOf(c: SixClass | null): string {
    if (c === null) return '[no configuration value: OURS]'
    if (c === 1) return ''
    return `[${classLabel(c)}]`
}

// ---------------------------------------------------------------------------------------------------------------------------------------
// Hand-written validation
// ---------------------------------------------------------------------------------------------------------------------------------------

const fail = (where: string, why: string): never => {
    throw new Error(`assembly-experiment.review.json ${where}: ${why}`)
}
const isObject = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === 'object' && !Array.isArray(v)
const isString = (v: unknown): v is string => typeof v === 'string' && v.length > 0
const isDate = (v: unknown): boolean => typeof v === 'string' && v.length === 10 && v[4] === '-' && v[7] === '-' && !Number.isNaN(Date.parse(`${v}T12:00:00Z`))

function onlyKeys(where: string, v: unknown, allowed: string[], required: string[]): Record<string, unknown> {
    if (!isObject(v)) return fail(where, 'not an object')
    for (const key of Object.keys(v)) if (allowed.indexOf(key) < 0) fail(where, `unknown key "${key}"`)
    for (const key of required) if (!(key in v)) fail(where, `missing key "${key}"`)
    return v
}

function knowledgeRefOk(where: string, v: unknown): void {
    const r = onlyKeys(where, v, ['source', 'table', 'row', 'column'], ['source', 'table', 'row'])
    for (const key of ['source', 'table', 'row']) if (!isString(r[key])) fail(where, `${key} must be a string`)
    if ('column' in r && !isString(r.column)) fail(where, 'column must be a string')
}

/** A standing read from data: exact member of the type (no trimming, no case-folding). */
function standingOk(where: string, v: unknown): Standing {
    if (!isStanding(v)) return fail(where, `unknown standing ${JSON.stringify(v)}`)
    return v
}

const TOP_KEYS = [
    'standing', 'learningGoalId', 'gameForm', 'gameProblemScope', 'reportRefs', 'bindings', 'derived', 'rulings', 'requiredParts', 'designBlockPaths', 'exemptions', 'choices', 'laws',
    'contractItems', 'contractDeclarationsReported', 'requirementAccountRulingRef', 'accountCategories', 'accountStandards', 'requirementAccount', 'suitability', 'scenarios',
    'reconciliations', 'openDecisions', 'reconciliation', 'dependencies', 'secondGoalNeeds',
]
const RULING_KEYS = ['id', 'decision', 'subject', 'scope', 'scopeWords', 'scopeCovers', 'canonicalAmendment', 'words', 'supersedes', 'received', 'file', 'provisional']
const CHOICE_KEYS = ['path', 'value', 'valueIsEvidence', 'declaredStatus', 'howReached', 'readBy', 'knowledgeRef', 'decidedBy', 'consulted', 'statusSetBy', 'note']

/**
 * The record, validated. Throws on: an unknown key anywhere this checks; an unknown standing; a ruling without words, file or received
 * date; a scope without his scope words; a decisive RULING or APPROVED item without the exact substring of his words (or the cell) that
 * states the value; his example words or reference-only material among what decided a value; a ruling reference not in the registry; a
 * declared status stronger than what decided it; an UNRESOLVED value that is not exactly one UNRESOLVED decisive item with no value.
 */
export function validateExperiment(raw: unknown): Experiment {
    const top = onlyKeys('(top)', raw, TOP_KEYS, TOP_KEYS)
    if (!isString(top.standing) || !isString(top.learningGoalId)) fail('(top)', 'standing and learningGoalId must be strings')

    // Rulings: filed once each, with his words, a repository-independent file reference and the received date.
    if (!Array.isArray(top.rulings) || !top.rulings.length) fail('rulings', 'must be a non-empty list')
    const rulings = new Map<string, AssemblyRuling>()
    ;(top.rulings as unknown[]).forEach((r, i) => {
        const where = `rulings[${i}]`
        const o = onlyKeys(where, r, RULING_KEYS, ['id', 'decision', 'subject', 'scope', 'canonicalAmendment', 'words', 'received', 'file', 'provisional'])
        if (!isString(o.id)) fail(where, 'id must be a string')
        if (rulings.has(o.id as string)) fail(where, `ruling ${String(o.id)} filed twice`)
        if (!Array.isArray(o.words) || !o.words.length || !(o.words as unknown[]).every(isString)) fail(where, 'words must be a non-empty list of strings')
        if (!isString(o.file)) fail(where, 'file must be a repository-independent reference')
        if ((o.file as string).indexOf('AppData') >= 0 || (o.file as string).indexOf('scratchpad') >= 0) fail(where, 'file must never be a scratchpad path')
        if (!isDate(o.received)) fail(where, 'received must be a YYYY-MM-DD date (US Eastern)')
        if (typeof o.provisional !== 'boolean') fail(where, 'provisional must be true or false')
        if (o.canonicalAmendment !== false) fail(where, 'no ruling filed here is a canonical amendment')
        if (o.scope !== null && !isString(o.scope)) fail(where, 'scope must be a string or null')
        if (o.scope !== null) {
            if (!Array.isArray(o.scopeWords) || !o.scopeWords.length) fail(where, 'a scope needs his scope words')
            for (const w of o.scopeWords as string[]) if (!(o.words as string[]).some((x) => x.indexOf(w) >= 0)) fail(where, `scope words "${w}" are not in his words`)
        } else if ('scopeWords' in o) fail(where, 'scope words without a scope')
        rulings.set(o.id as string, o as unknown as AssemblyRuling)
    })
    const rulingOk = (where: string, id: unknown): AssemblyRuling => {
        if (!isString(id) || !rulings.has(id)) return fail(where, `ruling reference ${JSON.stringify(id)} is not in the registry`)
        return rulings.get(id) as AssemblyRuling
    }

    // Choices: one standing per path; decisive items carry their evidence.
    if (!Array.isArray(top.choices) || !top.choices.length) fail('choices', 'must be a non-empty list')
    const paths = new Set<string>()
    ;(top.choices as unknown[]).forEach((c, i) => {
        const where = `choices[${i}]`
        const o = onlyKeys(where, c, CHOICE_KEYS, ['path', 'value', 'declaredStatus', 'howReached', 'decidedBy', 'consulted', 'statusSetBy', 'note'])
        if (!isString(o.path)) fail(where, 'path must be a string')
        const at = `${where} (${String(o.path)})`
        if (paths.has(o.path as string)) fail(at, 'path listed twice')
        paths.add(o.path as string)
        const declared = standingOk(`${at}.declaredStatus`, o.declaredStatus)
        if (CLASS_OF_STANDING[declared] === 'NEVER_DECISIVE') fail(at, `${standingLabel(declared)} cannot be a declared status`)
        if (HOW_REACHED.indexOf(o.howReached as HowReached) < 0) fail(at, `unknown howReached ${JSON.stringify(o.howReached)}`)
        const v = o.value
        if (!(v === null || typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean')) fail(at, 'value must be a string, number, boolean or null')
        if (!isString(o.note)) fail(at, 'note must be a string')
        if (!Array.isArray(o.decidedBy) || !Array.isArray(o.consulted) || !Array.isArray(o.statusSetBy)) fail(at, 'decidedBy, consulted and statusSetBy must be lists')
        const decisive = (o.decidedBy as unknown[]).map((d, j) => {
            const dw = `${at}.decidedBy[${j}]`
            const di = onlyKeys(dw, d, ['rulingRef', 'knowledgeRef', 'ref', 'standing', 'valueEvidence'], ['standing'])
            const kinds = ['rulingRef', 'knowledgeRef', 'ref'].filter((key) => key in di)
            if (kinds.length !== 1) fail(dw, 'exactly one of rulingRef, knowledgeRef or ref')
            const s = standingOk(`${dw}.standing`, di.standing)
            if (CLASS_OF_STANDING[s] === 'NEVER_DECISIVE') fail(dw, `${standingLabel(s)} can never decide a value`)
            let provisional = false
            if ('rulingRef' in di) {
                const r = rulingOk(dw, di.rulingRef)
                provisional = r.provisional
                if (s !== 'RULING') fail(dw, 'a ruling of his decides with standing RULING')
            }
            if ('knowledgeRef' in di) knowledgeRefOk(`${dw}.knowledgeRef`, di.knowledgeRef)
            if ('ref' in di && (di.ref !== 'UNRESOLVED' || s !== 'UNRESOLVED')) fail(dw, 'a bare ref is allowed only as { ref: UNRESOLVED, standing: UNRESOLVED }')
            if (s === 'RULING' || s === 'APPROVED') {
                if (!isString(di.valueEvidence)) fail(dw, 'a decisive RULING or APPROVED item needs valueEvidence, the exact substring that states the value')
                if ('rulingRef' in di && !(rulings.get(di.rulingRef as string) as AssemblyRuling).words.some((w) => w.indexOf(di.valueEvidence as string) >= 0)) fail(dw, 'valueEvidence is not in his words')
            } else if ('valueEvidence' in di && !isString(di.valueEvidence)) fail(dw, 'valueEvidence must be a string')
            return { standing: s, provisional }
        })
        ;(o.consulted as unknown[]).forEach((x, j) => {
            const cw = `${at}.consulted[${j}]`
            const ci = onlyKeys(cw, x, ['rulingRef', 'knowledgeRef', 'ref', 'standing', 'note'], ['standing', 'note'])
            if (['rulingRef', 'knowledgeRef', 'ref'].filter((key) => key in ci).length !== 1) fail(cw, 'exactly one of rulingRef, knowledgeRef or ref')
            standingOk(`${cw}.standing`, ci.standing)
            if ('rulingRef' in ci) rulingOk(cw, ci.rulingRef)
            if ('knowledgeRef' in ci) knowledgeRefOk(`${cw}.knowledgeRef`, ci.knowledgeRef)
            if ('ref' in ci && !isString(ci.ref)) fail(cw, 'ref must be a string')
            if (!isString(ci.note)) fail(cw, 'note must be a string')
        })
        ;(o.statusSetBy as unknown[]).forEach((x, j) => rulingOk(`${at}.statusSetBy[${j}]`, onlyKeys(`${at}.statusSetBy[${j}]`, x, ['rulingRef'], ['rulingRef']).rulingRef))

        // The declared status is never stronger than what decided the value (compared by standing; his provisional flag only weakens).
        for (const d of decisive) {
            const dc = CLASS_OF_STANDING[d.standing] as SixClass
            const cc = CLASS_OF_STANDING[declared] as SixClass
            if (cc < dc) fail(at, `declared status ${declared} is stronger than a decisive ${d.standing} item`)
        }
        // A declared APPROVED, RULING or CANDIDATE status is carried by a decisive item of that standing (a ruling that only sets a status
        // is printed under statusSetBy, never here); a value the code computes brings its own trace instead.
        if (decisive.length && ['APPROVED', 'RULING', 'CANDIDATE'].indexOf(declared) >= 0 && !decisive.some((d) => d.standing === declared)) fail(at, `declared ${declared}, but no decisive item has that standing`)
        // How the value reached the activity, and what that requires.
        const how = o.howReached as HowReached
        if (how === 'UNRESOLVED' || declared === 'UNRESOLVED') {
            if (!(how === 'UNRESOLVED' && declared === 'UNRESOLVED' && v === null && decisive.length === 1 && decisive[0].standing === 'UNRESOLVED')) fail(at, 'an UNRESOLVED value has no value and exactly one decisive item { ref: UNRESOLVED, standing: UNRESOLVED }')
        } else if (decisive.some((d) => d.standing === 'UNRESOLVED')) fail(at, 'an UNRESOLVED decisive item belongs only to an UNRESOLVED value')
        if (how === 'READ_BY_CODE') {
            if (v !== null) fail(at, 'a value read by code has no entered value')
            if (READ_BY.indexOf(o.readBy as ReadBy) < 0) fail(at, `unknown readBy ${JSON.stringify(o.readBy)}`)
            if ((o.readBy === 'DISPLAY_CELL' || o.readBy === 'CONTEXT_RELATIONSHIP_ROW') !== ('knowledgeRef' in o)) fail(at, 'a cell or row read needs exactly its knowledgeRef')
            if ('knowledgeRef' in o) knowledgeRefOk(`${at}.knowledgeRef`, o.knowledgeRef)
        } else {
            if ('readBy' in o || 'knowledgeRef' in o) fail(at, 'readBy and knowledgeRef belong only to a value read by code')
            if (how !== 'UNRESOLVED' && v === null) fail(at, 'an entered value cannot be empty')
        }
        if (how === 'ENTERED_ILLUSTRATIVE' && declared !== 'ILLUSTRATIVE') fail(at, 'an illustrative value is declared ILLUSTRATIVE')
        if (how === 'ENTERED_OUR_INFERENCE' && declared !== 'OURS') fail(at, 'our inference is declared OURS')
        if (how === 'ENTERED_EVIDENCED') {
            if (['APPROVED', 'RULING', 'CANDIDATE'].indexOf(declared) < 0) fail(at, 'an evidenced value is declared APPROVED, RULING or CANDIDATE')
            if (!(o.decidedBy as DecisiveItem[]).some((d) => (d.standing === 'RULING' || d.standing === 'APPROVED') && isString(d.valueEvidence))) fail(at, 'an evidenced value needs a decisive item with value evidence')
        }
        if ('valueIsEvidence' in o) {
            if (o.valueIsEvidence !== true || v !== (o.decidedBy as DecisiveItem[])[0]?.valueEvidence) fail(at, 'valueIsEvidence: the value must equal its first decisive item\'s evidence')
        }
    })
    const choicePaths = [...paths]
    const pathOk = (where: string, p: unknown) => {
        if (!isString(p) || !paths.has(p)) fail(where, `path ${JSON.stringify(p)} is not a choice`)
    }

    // Top-level references.
    const gf = onlyKeys('gameForm', top.gameForm, ['illustrativeChoice', 'standing', 'rulingRefs', 'choicePath'], ['illustrativeChoice', 'standing', 'rulingRefs', 'choicePath'])
    standingOk('gameForm.standing', gf.standing)
    ;(gf.rulingRefs as unknown[]).forEach((r) => rulingOk('gameForm.rulingRefs', r))
    pathOk('gameForm.choicePath', gf.choicePath)
    const formChoice = (top.choices as Choice[]).find((c) => c.path === gf.choicePath) as Choice
    if (formChoice.value !== gf.illustrativeChoice || formChoice.declaredStatus !== gf.standing) fail('gameForm', 'the illustrative choice and its standing must equal the choice at choicePath')
    const gp = onlyKeys('gameProblemScope', top.gameProblemScope, ['primaryGameProblemIds', 'secondaryGameProblemIds', 'rulingRefs', 'idResolution', 'note'], ['primaryGameProblemIds', 'secondaryGameProblemIds', 'rulingRefs', 'idResolution', 'note'])
    ;(gp.rulingRefs as unknown[]).forEach((r) => rulingOk('gameProblemScope.rulingRefs', r))
    const bindings = onlyKeys('bindings', top.bindings, ['illustrativeForm', 'scoringEvent', 'teamCount', 'playersPerTeam', 'areaLength', 'areaWidth', 'targetZoneDepth'], ['illustrativeForm', 'scoringEvent', 'teamCount', 'playersPerTeam', 'areaLength', 'areaWidth', 'targetZoneDepth'])
    for (const [key, p] of Object.entries(bindings)) pathOk(`bindings.${key}`, p)
    ;(top.derived as unknown[]).forEach((d, i) => {
        const o = onlyKeys(`derived[${i}]`, d, ['id', 'formula', 'label', 'targetZoneCount', 'note'], ['id', 'formula', 'label', 'targetZoneCount', 'note'])
        if (['AREA_PER_OUTFIELD_PLAYER_TOTAL', 'AREA_PER_OUTFIELD_PLAYER_OUTSIDE_TARGET_ZONES'].indexOf(o.formula as string) < 0) fail(`derived[${i}]`, 'unknown formula')
        if (paths.has(o.id as string)) fail(`derived[${i}]`, 'a derived value is not a choice')
    })
    // Every choice path is in one of his nine parts; exemptions and the design block name choices only.
    const inParts = new Set<string>()
    ;(top.requiredParts as unknown[]).forEach((p, i) => {
        const o = onlyKeys(`requiredParts[${i}]`, p, ['id', 'part', 'paths', 'generatedFromTrace'], ['id', 'part', 'paths'])
        for (const x of o.paths as unknown[]) {
            pathOk(`requiredParts[${i}]`, x)
            inParts.add(x as string)
        }
    })
    for (const p of choicePaths) if (!inParts.has(p)) fail('requiredParts', `${p} is in none of the nine parts`)
    for (const p of top.designBlockPaths as unknown[]) pathOk('designBlockPaths', p)
    ;(top.exemptions as unknown[]).forEach((e, i) => {
        const o = onlyKeys(`exemptions[${i}]`, e, ['path', 'reason'], ['path', 'reason'])
        pathOk(`exemptions[${i}]`, o.path)
        if (!isString(o.reason)) fail(`exemptions[${i}]`, 'an exemption needs a reason')
    })
    ;(top.laws as unknown[]).forEach((l, i) => {
        const o = onlyKeys(`laws[${i}]`, l, ['lawId', 'situation', 'status', 'paths', 'reason'], ['lawId', 'status', 'paths', 'reason'])
        if (['APPLIES', 'DEPARTED', 'NOT APPLICABLE', 'ADAPTATION OWED'].indexOf(o.status as string) < 0) fail(`laws[${i}]`, 'unknown status')
        for (const x of o.paths as unknown[]) pathOk(`laws[${i}]`, x)
    })
    ;(top.contractItems as unknown[]).forEach((c, i) => {
        const o = onlyKeys(`contractItems[${i}]`, c, ['itemId', 'mappedTo', 'notUsed'], ['itemId', 'mappedTo'])
        for (const x of o.mappedTo as unknown[]) pathOk(`contractItems[${i}]`, x)
        if (!(o.mappedTo as unknown[]).length && !isString(o.notUsed)) fail(`contractItems[${i}]`, 'an item mapped to nothing needs its reason')
    })
    // The requirement account: his four categories and three standards, verbatim from his ruling.
    const accounting = rulingOk('requirementAccountRulingRef', top.requirementAccountRulingRef)
    if (!Array.isArray(top.accountCategories) || top.accountCategories.length !== 4) fail('accountCategories', 'his four categories')
    for (const c of top.accountCategories as string[]) if (!accounting.words.some((w) => w === c)) fail('accountCategories', `"${c}" is not his wording`)
    for (const s of top.accountStandards as string[]) if (!accounting.words.some((w) => w.indexOf(`${s}:`) === 0)) fail('accountStandards', `"${s}" is not his wording`)
    ;(top.requirementAccount as unknown[]).forEach((a, i) => {
        const o = onlyKeys(`requirementAccount[${i}]`, a, ['id', 'requirementRef', 'clause', 'reading', 'category', 'standard', 'paths', 'observableConditions', 'note'], ['id', 'requirementRef', 'clause', 'reading', 'category', 'standard', 'paths', 'observableConditions', 'note'])
        if ((top.accountCategories as string[]).indexOf(o.category as string) < 0) fail(`requirementAccount[${i}]`, 'category not one of his four')
        if ((top.accountStandards as string[]).indexOf(o.standard as string) < 0) fail(`requirementAccount[${i}]`, 'standard not one of his three')
        for (const x of o.paths as unknown[]) pathOk(`requirementAccount[${i}]`, x)
        if (o.category === (top.accountCategories as string[])[2] && !isString(o.observableConditions)) fail(`requirementAccount[${i}]`, 'category 3 names the observable conditions')
    })
    const suit = onlyKeys('suitability', top.suitability, ['standing', 'properties', 'scale', 'exposure', 'identityPoint', 'addNothing'], ['standing', 'properties', 'scale', 'exposure', 'identityPoint', 'addNothing'])
    ;(suit.properties as unknown[]).forEach((p, i) => {
        const o = onlyKeys(`suitability.properties[${i}]`, p, ['property', 'structural', 'functional', 'note'], ['property', 'structural', 'functional', 'note'])
        const s = onlyKeys(`suitability.properties[${i}].structural`, o.structural, ['status', 'paths', 'rows'], ['status', 'paths', 'rows'])
        if (['EXPRESSED_BY_CONFIGURATION', 'NOT_SUPPLIED'].indexOf(s.status as string) < 0) fail(`suitability.properties[${i}]`, 'unknown structural status')
        for (const x of s.paths as unknown[]) pathOk(`suitability.properties[${i}]`, x)
        if (onlyKeys(`suitability.properties[${i}].functional`, o.functional, ['status'], ['status']).status !== 'ONLY_VERIFIABLE_IN_PLAY') fail(`suitability.properties[${i}]`, 'functional meaningfulness is only verifiable in play')
    })
    rulingOk('suitability.addNothing', (suit.addNothing as Record<string, unknown>).rulingRef)
    const sc = onlyKeys('scenarios', top.scenarios, ['standing', 'rulingRef', 'circumstances', 'decidingCircumstances', 'insufficientWhen', 'requirementLink', 'uncertaintyReport', 'widthCheck', 'items'], ['standing', 'rulingRef', 'circumstances', 'decidingCircumstances', 'insufficientWhen', 'requirementLink', 'uncertaintyReport', 'widthCheck', 'items'])
    const scRuling = rulingOk('scenarios.rulingRef', sc.rulingRef)
    const keys = (sc.circumstances as Array<{ key: string }>).map((c) => c.key)
    ;(sc.items as unknown[]).forEach((s, i) => {
        const o = onlyKeys(`scenarios.items[${i}]`, s, ['id', 'words', 'configuredActivity', 'expected'], ['id', 'words', 'configuredActivity', 'expected'])
        if (!scRuling.words.some((w) => w === o.words)) fail(`scenarios.items[${i}]`, 'his scenario sentence must be verbatim')
        const ca = o.configuredActivity as Record<string, { value: unknown; label: string }>
        if (JSON.stringify(Object.keys(ca).sort()) !== JSON.stringify([...keys].sort())) fail(`scenarios.items[${i}]`, 'every circumstance, and only those, is stated')
        for (const [key, x] of Object.entries(ca)) {
            onlyKeys(`scenarios.items[${i}].${key}`, x, ['value', 'label'], ['value', 'label'])
            if (!(x.value === true || x.value === false || x.value === 'NOT_SUPPLIED')) fail(`scenarios.items[${i}].${key}`, 'true, false or NOT_SUPPLIED')
        }
    })
    const link = sc.requirementLink as Record<string, unknown>
    ;(link.rulingRefs as unknown[]).forEach((r) => rulingOk('scenarios.requirementLink', r))
    if (keys.indexOf(link.circumstanceKey as string) < 0) fail('scenarios.requirementLink', 'unknown circumstance key')
    const refKeys = ['experimentPurpose', 'acceptance', 'limits', 'kickoffCaveat', 'futureFeedbackQuestion']
    const refs = onlyKeys('reportRefs', top.reportRefs, refKeys, refKeys)
    for (const [key, id] of Object.entries(refs)) rulingOk(`reportRefs.${key}`, id)
    ;(top.reconciliations as unknown[]).forEach((r, i) => {
        const o = onlyKeys(`reconciliations[${i}]`, r, ['id', 'title', 'rulingRefs', 'showPaths', 'items'], ['id', 'title', 'rulingRefs', 'items'])
        ;(o.rulingRefs as unknown[]).forEach((x) => rulingOk(`reconciliations[${i}]`, x))
        for (const p of (o.showPaths as unknown[]) ?? []) pathOk(`reconciliations[${i}].showPaths`, p)
    })
    ;(top.openDecisions as unknown[]).forEach((d, i) => {
        const o = onlyKeys(`openDecisions[${i}]`, d, ['id', 'blocks', 'question', 'rulingRefs', 'handling'], ['id', 'blocks', 'question', 'rulingRefs', 'handling'])
        if (['ASSEMBLY', 'SCORING_FIDELITY_OR_PRODUCTION', 'SUITABILITY', 'NON_BLOCKING'].indexOf(o.blocks as string) < 0) fail(`openDecisions[${i}]`, 'unknown blocking class')
        ;(o.rulingRefs as unknown[]).forEach((r) => rulingOk(`openDecisions[${i}]`, r))
    })
    rulingOk('reconciliation.rulingRef', (top.reconciliation as Record<string, unknown>).rulingRef)
    return top as unknown as Experiment
}

/** The DRAFT wording, validated against the record: known sections, known paths, `expresses` equal to its placeholders and whenValue keys. */
export function validateWording(raw: unknown, experiment: Experiment): Wording {
    const where = 'assembly-wording.draft.json'
    const top = onlyKeys(where, raw, ['standing', 'keyedFor', 'coachTerms', 'sections', 'templates'], ['standing', 'keyedFor', 'coachTerms', 'sections', 'templates'])
    const sections = new Set((top.sections as Array<{ id: string }>).map((s) => s.id))
    const paths = new Set(experiment.choices.map((c) => c.path))
    const ids = new Set<string>()
    for (const t of top.templates as unknown[]) {
        const o = onlyKeys(`${where} template`, t, ['id', 'section', 'text', 'expresses', 'whenValue', 'status', 'quote'], ['id', 'section', 'text', 'expresses', 'status'])
        const at = `${where} ${String(o.id)}`
        if (ids.has(o.id as string)) throw new Error(`${at}: template listed twice`)
        ids.add(o.id as string)
        if (!sections.has(o.section as string)) throw new Error(`${at}: unknown section`)
        if (o.status !== 'APPROVED CANONICAL' && o.status !== 'NEWLY PROPOSED') throw new Error(`${at}: unknown status`)
        const placeholders = placeholdersOf(o.text as string)
        const whenKeys = Object.keys((o.whenValue as Record<string, unknown>) ?? {})
        for (const p of [...placeholders, ...whenKeys]) if (!paths.has(p)) throw new Error(`${at}: unknown path ${p}`)
        const said = [...new Set([...placeholders, ...whenKeys])].sort()
        if (JSON.stringify([...(o.expresses as string[])].sort()) !== JSON.stringify(said)) throw new Error(`${at}: expresses must equal its placeholders and whenValue paths (${said.join(', ')})`)
        if (o.quote !== undefined) {
            const q = onlyKeys(`${at}.quote`, o.quote, ['rulingRef'], ['rulingRef'])
            const r = experiment.rulings.find((x) => x.id === q.rulingRef)
            if (!r || !r.words.some((w) => w.indexOf(o.text as string) >= 0)) throw new Error(`${at}: a quoted sentence must be verbatim in the ruling it cites`)
        }
    }
    return top as unknown as Wording
}

/** The `{path}` placeholders of a template, in order. */
export function placeholdersOf(text: string): string[] {
    return [...text.matchAll(/\{([A-Za-z0-9.]+)\}/g)].map((m) => m[1])
}

// ---------------------------------------------------------------------------------------------------------------------------------------
// Assembly
// ---------------------------------------------------------------------------------------------------------------------------------------

/** Display text read from knowledge cells after the decisions (never by this file): by configuration path, and names by id. */
export interface DisplayTexts {
    cells: Record<string, { text: string; cite: Cite }>
    names: Record<string, { text: string; cite: Cite }>
    goalName: { text: string; cite: Cite }
}

export type AssembledValue = ChoiceValue | string[]

export interface AssembledChoice {
    path: string
    value: AssembledValue
    rendered: string
    howReached: HowReached
    declaredStatus: Standing
    computed: boolean
    /** What decided the value: Stage 1/2's own influence trace for a computed value; our record for an entered one. */
    decidedBy: TraceItem[]
    consulted: TraceItem[]
    statusSetBy: TraceItem[]
    traceLabel: string
    sixClass: SixClass
    provisionalRulings: Array<{ id: string; received: string; words: string }>
    note: string
}

export interface ComputedConclusion {
    id: string
    statement: string
    establishedBy: EstablishedBy
    trace: InfluenceTrace
}

export interface AssembledActivity {
    learningGoalId: string
    rpcId: string
    choices: AssembledChoice[]
    derived: Array<{ id: string; value: number; label: string; fromPaths: string[]; sixClass: SixClass; note: string }>
    computed: ComputedConclusion[]
    counts: { howReached: Record<HowReached, number>; classes: Record<string, number> }
}

const RECORD_LABEL = 'our record of what decided it (OURS), not a computed influence'
const COMPUTED_LABEL = 'computed by the Stage 1/2 code: its own influence trace, unchanged'

function rulingItem(r: AssemblyRuling, role: string): TraceItem {
    return item(`${r.id} (received ${longDate(r.received)}${r.provisional ? '; provisional' : ''})`, 'RULING', role, { file: SOURCE.assemblyExperiment, table: 'rulings', row: r.id })
}
const refText = (k: KnowledgeRef): string => `${k.source} ${k.table} ${k.row}${k.column ? ` ${k.column}` : ''}`

/** The related id of a context relationship row a knowledge reference names (ids only; it must be ACTIVE and the routed context's). */
export function relationshipRelatedId(k: DesignKnowledge, rpcId: string, ref: KnowledgeRef): { relatedId: string; cite: Cite } {
    const row = k.contexts.relationships.find((r) => cell(r, 'relationship_id') === ref.row)
    if (!row || cell(row, 'status') !== 'ACTIVE' || cell(row, 'rpc_id') !== rpcId) throw new Error(`the assembly reads ${ref.row}, which is not an ACTIVE row of the routed context`)
    return { relatedId: cell(row, 'related_id'), cite: { file: SOURCE.contexts, table: 'relationships', row: ref.row } }
}

/**
 * Assemble the activity from the computed Steps 1 and 2, the validated record and the display texts. Fails closed: Step 1 must be
 * RESOLVED; the illustrative form must be among the compatible forms; the resolution's Game Problem ids must equal the ids his words name;
 * the scoring event must be one of the routed context's ACTIVE scoring events; every display cell a value needs must be supplied.
 */
export function assembleActivity(k: DesignKnowledge, resolution: DesignResolution, forms: GameFormSelection, experiment: Experiment, display: DisplayTexts): AssembledActivity {
    if (resolution.learningGoalId !== experiment.learningGoalId) throw new Error('the resolution is for another goal than the record')
    if (resolution.status !== 'RESOLVED' || !resolution.context) throw new Error(`Step 1 is ${resolution.status}: nothing is assembled`)
    const rpcId = resolution.context.rpcId
    const byId = new Map(experiment.rulings.map((r) => [r.id, r]))
    const choiceAt = (p: string) => experiment.choices.find((c) => c.path === p) as Choice
    const scope = experiment.gameProblemScope
    if (JSON.stringify(resolution.gameProblems.primary) !== JSON.stringify(scope.primaryGameProblemIds) || JSON.stringify(resolution.gameProblems.secondary) !== JSON.stringify(scope.secondaryGameProblemIds)) {
        throw new Error(`the resolution's Game Problems (${resolution.gameProblems.primary.join(', ')}; ${resolution.gameProblems.secondary.join(', ')}) are not the ones his words name (${scope.primaryGameProblemIds.join(', ')}; ${scope.secondaryGameProblemIds.join(', ')})`)
    }
    const formChoice = choiceAt(experiment.bindings.illustrativeForm)
    if (forms.compatible.indexOf(String(formChoice.value)) < 0) throw new Error(`the illustrative form ${String(formChoice.value)} is not among the compatible forms (${forms.compatible.join(', ') || 'none'})`)
    const eventChoice = choiceAt(experiment.bindings.scoringEvent)
    const events = activeContextRelationships(k, rpcId, 'SCORING_EVENT')
    const eventRow = events.find((r) => r.relatedId === eventChoice.value)
    if (!eventRow) throw new Error(`the scoring event ${String(eventChoice.value)} is not one of ${rpcId}'s ACTIVE scoring events (${events.map((r) => r.relatedId).join(', ') || 'none'})`)

    const computed: ComputedConclusion[] = [
        { id: 'game problems', statement: `Game Problems by ${resolution.gameProblems.basis}: primary ${resolution.gameProblems.primary.join(', ')}; secondary ${resolution.gameProblems.secondary.join(', ') || 'none'} (filed scope ${resolution.gameProblems.scope ?? 'none'}${resolution.gameProblems.continuedBy ? `, continued by ${resolution.gameProblems.continuedBy.ruling}` : ''}).`, establishedBy: resolution.gameProblems.establishedBy, trace: resolution.gameProblems.trace },
        ...(resolution.profile?.findings ?? []).map((f) => ({ id: `secondary finding ${f.requirement}`, statement: `${f.requirement} (${f.requirementName}): the secondary ${f.secondary.gameProblemId} rates it ${f.secondary.rating}, the primary ${f.primary.gameProblemId} ${f.primary.rating}; ${f.outcome}; not promoted.`, establishedBy: f.establishedBy, trace: f.trace })),
        { id: 'game forms', statement: `${forms.status}: ${forms.compatible.join(', ')}; preference ${forms.preference.status}.`, establishedBy: forms.establishedBy, trace: forms.trace },
        {
            id: 'scoring-event membership',
            statement: `${String(eventChoice.value)} is one of ${rpcId}'s ACTIVE scoring events (${events.map((r) => r.relatedId).join(', ')}); membership does not choose among them.`,
            establishedBy: 'APPROVED KNOWLEDGE',
            trace: { influencedBy: [item(citeRef(resolution.context.routing), 'APPROVED', `the routing row names ${rpcId}`, resolution.context.routing), item(citeRef(eventRow.cite), 'APPROVED', `${rpcId} relates ${eventRow.relatedId} (${eventRow.type} ${eventRow.strength})`, eventRow.cite)], consulted: [], citedOnly: [] },
        },
    ]
    const computedOf = (readBy: ReadBy): ComputedConclusion | null =>
        readBy === 'RESOLUTION_PRIMARY' || readBy === 'RESOLUTION_SECONDARY' ? computed[0] : readBy === 'COMPATIBLE_ALTERNATIVES' ? (computed.find((c) => c.id === 'game forms') as ComputedConclusion) : null

    const nameOf = (id: string): string => {
        const n = display.names[id]
        if (!n) throw new Error(`no display name supplied for ${id}`)
        return n.text
    }
    const choices: AssembledChoice[] = experiment.choices.map((c) => {
        let value: AssembledValue = c.value
        let rendered = c.value === null ? 'none (no authorized value)' : String(c.value)
        let computedTrace: InfluenceTrace | null = null
        let establishedBy: EstablishedBy | null = null
        if (c.howReached === 'READ_BY_CODE') {
            const readBy = c.readBy as ReadBy
            if (readBy === 'DISPLAY_CELL') {
                const d = display.cells[c.path]
                if (!d) throw new Error(`no display text supplied for ${c.path} (${refText(c.knowledgeRef as KnowledgeRef)})`)
                value = d.text
                rendered = d.text
            } else if (readBy === 'RESOLUTION_PRIMARY' || readBy === 'RESOLUTION_SECONDARY') {
                value = readBy === 'RESOLUTION_PRIMARY' ? [...resolution.gameProblems.primary] : [...resolution.gameProblems.secondary]
                rendered = (value as string[]).map(nameOf).join(' and ')
            } else if (readBy === 'RESOLUTION_FINDINGS') {
                const findings = resolution.profile?.findings ?? []
                value = findings.map((f) => `${f.requirement}:${f.secondary.gameProblemId}>${f.primary.gameProblemId}:${f.outcome}`)
                rendered = findings.length ? findings.map((f) => `${f.requirementName} is rated more strongly for ${nameOf(f.secondary.gameProblemId)} (${f.secondary.rating}) than for ${nameOf(f.primary.gameProblemId)} (${f.primary.rating}); not promoted (${f.outcome})`).join('; ') : 'none'
                computedTrace = findings.length ? { influencedBy: findings.flatMap((f) => f.trace.influencedBy), consulted: findings.flatMap((f) => f.trace.consulted), citedOnly: findings.flatMap((f) => f.trace.citedOnly) } : { influencedBy: [], consulted: [], citedOnly: [] }
                establishedBy = findings.length ? 'INSUFFICIENT EVIDENCE' : null
            } else if (readBy === 'COMPATIBLE_ALTERNATIVES') {
                value = forms.compatible.filter((id) => id !== formChoice.value)
                rendered = (value as string[]).map(nameOf).join(' and ')
            } else {
                const row = relationshipRelatedId(k, rpcId, c.knowledgeRef as KnowledgeRef)
                value = row.relatedId
                rendered = nameOf(row.relatedId)
            }
            const cc = computedOf(readBy)
            if (cc) {
                computedTrace = cc.trace
                establishedBy = cc.establishedBy
            }
        } else if (typeof c.value === 'string' && display.names[c.value]) {
            rendered = display.names[c.value].text
        }
        const recorded = c.decidedBy.map((d) => {
            if (d.rulingRef) return rulingItem(byId.get(d.rulingRef) as AssemblyRuling, d.valueEvidence ? `states the value: "${d.valueEvidence}"` : 'decides the value')
            if (d.knowledgeRef) return item(refText(d.knowledgeRef), d.standing, d.valueEvidence ? `the cell: "${d.valueEvidence}"` : 'the row')
            return item('UNRESOLVED', 'UNRESOLVED', 'no authorized value exists')
        })
        const decidedBy = computedTrace ? [...computedTrace.influencedBy, ...recorded] : recorded
        const provisionalRulings = c.decidedBy
            .filter((d) => d.rulingRef && (byId.get(d.rulingRef) as AssemblyRuling).provisional)
            .map((d) => ({ id: d.rulingRef as string, received: (byId.get(d.rulingRef as string) as AssemblyRuling).received, words: d.valueEvidence ?? '' }))
        const classInputs: ClassInput[] = [
            ...(computedTrace ? computedTrace.influencedBy.map((i) => ({ standing: i.standing })) : []),
            ...c.decidedBy.map((d) => ({ standing: d.standing, provisional: d.rulingRef ? (byId.get(d.rulingRef) as AssemblyRuling).provisional : false })),
        ]
        const consulted = [
            ...(computedTrace ? computedTrace.consulted : []),
            ...c.consulted.map((x) => {
                if (x.rulingRef) return rulingItem(byId.get(x.rulingRef) as AssemblyRuling, x.note)
                if (x.knowledgeRef) return item(refText(x.knowledgeRef), x.standing, x.note)
                return item(x.ref as string, x.standing, x.note)
            }),
        ]
        return {
            path: c.path,
            value,
            rendered,
            howReached: c.howReached,
            declaredStatus: c.declaredStatus,
            computed: computedTrace !== null,
            decidedBy,
            consulted,
            statusSetBy: c.statusSetBy.map((s) => rulingItem(byId.get(s.rulingRef) as AssemblyRuling, 'sets the status (printed, never decisive)')),
            traceLabel: computedTrace ? COMPUTED_LABEL : RECORD_LABEL,
            sixClass: sixClassOf(classInputs, c.declaredStatus, establishedBy === 'LOGICAL INFERENCE' ? establishedBy : null),
            provisionalRulings,
            note: c.note,
        }
    })

    // Values derived in code from entered values: computed here, never typed, so they cannot go stale.
    const num = (p: string) => {
        const v = choiceAt(p).value
        if (typeof v !== 'number') throw new Error(`${p} must be a number to derive from`)
        return v
    }
    const b = experiment.bindings
    const players = num(b.teamCount) * num(b.playersPerTeam)
    const round1 = (n: number) => Math.round(n * 10) / 10
    const fromPaths = [b.areaLength, b.areaWidth, b.teamCount, b.playersPerTeam]
    const derived = experiment.derived.map((d) => {
        const used = d.formula === 'AREA_PER_OUTFIELD_PLAYER_TOTAL' ? fromPaths : [...fromPaths, b.targetZoneDepth]
        const value = d.formula === 'AREA_PER_OUTFIELD_PLAYER_TOTAL' ? round1((num(b.areaLength) * num(b.areaWidth)) / players) : round1(((num(b.areaLength) - d.targetZoneCount * num(b.targetZoneDepth)) * num(b.areaWidth)) / players)
        const cls = Math.max(...used.map((p) => (choices.find((c) => c.path === p) as AssembledChoice).sixClass)) as SixClass
        return { id: d.id, value, label: d.label, fromPaths: used, sixClass: cls, note: d.note }
    })

    const howReached = Object.fromEntries(HOW_REACHED.map((h) => [h, choices.filter((c) => c.howReached === h).length])) as Record<HowReached, number>
    const classes = Object.fromEntries(SIX_CLASSES.map((_, i) => [classLabel((i + 1) as SixClass), choices.filter((c) => c.sixClass === i + 1).length]))
    return { learningGoalId: experiment.learningGoalId, rpcId, choices, derived, computed, counts: { howReached, classes } }
}

// ---------------------------------------------------------------------------------------------------------------------------------------
// The coach text: a DRAFT template fill, keyed by configuration path
// ---------------------------------------------------------------------------------------------------------------------------------------

export interface ComposedSentence {
    id: string
    section: string
    text: string
    expresses: string[]
    status: WordingTemplate['status']
    sixClass: SixClass | null
    marker: string
    quoted: boolean
}

export interface ComposedActivity {
    sections: Array<{ id: string; level: string; title: string; rc3: string; sentences: ComposedSentence[] }>
    expressed: string[]
}

/**
 * Fill every template. Pure. Throws on a placeholder or whenValue path that is not a choice, on `expresses` that differ from what the
 * template says, and on a whenValue that does not equal the assembled value (so a changed value can never leave a stale sentence).
 */
export function composeCoachActivity(wording: Wording, activity: AssembledActivity): ComposedActivity {
    const byPath = new Map(activity.choices.map((c) => [c.path, c]))
    const sentences: ComposedSentence[] = wording.templates.map((t) => {
        const placeholders = placeholdersOf(t.text)
        const when = t.whenValue ?? {}
        for (const p of [...placeholders, ...Object.keys(when)]) if (!byPath.has(p)) throw new Error(`template ${t.id}: unknown path ${p}`)
        const said = [...new Set([...placeholders, ...Object.keys(when)])].sort()
        if (JSON.stringify([...t.expresses].sort()) !== JSON.stringify(said)) throw new Error(`template ${t.id}: expresses ${t.expresses.join(', ')} but says ${said.join(', ')}`)
        for (const [p, expected] of Object.entries(when)) {
            const actual = (byPath.get(p) as AssembledChoice).value
            if (actual !== expected) throw new Error(`template ${t.id}: whenValue ${p} = ${JSON.stringify(expected)}, but the assembled value is ${JSON.stringify(actual)}`)
        }
        const text = t.text.replace(/\{([A-Za-z0-9.]+)\}/g, (_, p: string) => (byPath.get(p) as AssembledChoice).rendered)
        const classes = t.expresses.map((p) => (byPath.get(p) as AssembledChoice).sixClass)
        const sixClass = classes.length ? (Math.max(...classes) as SixClass) : null
        return { id: t.id, section: t.section, text, expresses: [...t.expresses], status: t.status, sixClass, marker: markerOf(sixClass), quoted: Boolean(t.quote) }
    })
    return {
        sections: wording.sections.map((s) => ({ id: s.id, level: s.level, title: s.title, rc3: s.rc3, sentences: sentences.filter((x) => x.section === s.id) })),
        expressed: [...new Set(sentences.flatMap((x) => x.expresses))].sort(),
    }
}

/** The labelled learning-design block shown beside the RC3 activity: the Game Problems and the Game Form, generated from the assembly. */
export function designBlock(experiment: Experiment, activity: AssembledActivity, display: DisplayTexts): Array<{ text: string; expresses: string[]; marker: string }> {
    const at = (p: string) => activity.choices.find((c) => c.path === p) as AssembledChoice
    const scopeRulings = experiment.gameProblemScope.rulingRefs.map((id) => experiment.rulings.find((r) => r.id === id) as AssemblyRuling)
    const scopeWords = scopeRulings.flatMap((r) => (r.scopeWords ?? []).map((w) => `"${w}" (received ${longDate(r.received)})`))
    const lines: Array<{ text: string; expresses: string[] }> = []
    // Each block path is found by how it is read, never by its name.
    const readAs = (readBy: ReadBy): string | undefined => experiment.designBlockPaths.find((p) => experiment.choices.find((c) => c.path === p)?.readBy === readBy)
    const primary = readAs('RESOLUTION_PRIMARY')
    const secondary = readAs('RESOLUTION_SECONDARY')
    const finding = readAs('RESOLUTION_FINDINGS')
    const candidate = readAs('CONTEXT_RELATIONSHIP_ROW')
    const alternatives = readAs('COMPATIBLE_ALTERNATIVES')
    const form = experiment.bindings.illustrativeForm
    if (!alternatives || experiment.designBlockPaths.indexOf(form) < 0) throw new Error('the design block shows the illustrative form and its compatible alternatives')
    if (primary && secondary) lines.push({ text: `Game Problems: ${at(primary).rendered} is the primary problem and ${at(secondary).rendered} a secondary consideration, as the review pathway's resolution computes them; his scope words: ${scopeWords.join('; ')}.`, expresses: [primary, secondary] })
    if (finding) lines.push({ text: `Secondary finding: ${at(finding).rendered}.`, expresses: [finding] })
    if (candidate) lines.push({ text: `Candidate only: ${at(candidate).rendered} is shown as a candidate relationship and is not used.`, expresses: [candidate] })
    lines.push({ text: `Game Form: ${at(form).rendered}, used as an illustrative choice; ${at(alternatives).rendered} are compatible alternatives, with no ranking among the three.`, expresses: [form, alternatives] })
    lines.push({ text: `Learning Goal: ${display.goalName.text}.`, expresses: [] })
    return lines.map((l) => {
        const classes = l.expresses.map((p) => at(p).sixClass)
        return { ...l, marker: markerOf(classes.length ? (Math.max(...classes) as SixClass) : null) }
    })
}

// ---------------------------------------------------------------------------------------------------------------------------------------
// The requirement account (his 29 October ruling): applicable requirements in his four categories; category 3 never satisfied
// ---------------------------------------------------------------------------------------------------------------------------------------

export interface AccountLine extends AccountEntry {
    requirementStatus: string
    requirementRole: string
    satisfied: boolean
    downgraded: string | null
}

export function requirementAccountOf(k: DesignKnowledge, experiment: Experiment, activity: AssembledActivity): { lines: AccountLine[]; counts: Record<string, number> } {
    const cats = experiment.accountCategories
    const identity = contextIdentityRules(k, activity.rpcId)
    const lines = experiment.requirementAccount.map((a) => {
        let requirementStatus = ''
        let requirementRole = ''
        if (a.requirementRef.table === 'identity_rules') {
            const r = identity.find((x) => x.identityRuleId === a.requirementRef.row)
            if (!r) throw new Error(`${a.id}: ${a.requirementRef.row} is not an identity rule of ${activity.rpcId}`)
            requirementStatus = r.status
            requirementRole = r.role
        } else if (a.requirementRef.table === 'properties') {
            const p = contextProperty(k, a.requirementRef.row)
            if (!p || p.rpcId !== activity.rpcId) throw new Error(`${a.id}: ${a.requirementRef.row} is not a property of ${activity.rpcId}`)
            requirementStatus = p.status
            requirementRole = p.category
        } else throw new Error(`${a.id}: unknown requirement table ${a.requirementRef.table}`)
        // Category 1 holds only where every cited value is in the assembled activity; otherwise it falls to category 4, and says why.
        let category = a.category
        let downgraded: string | null = null
        if (category === cats[0]) {
            const missing = a.paths.filter((p) => {
                const c = activity.choices.find((x) => x.path === p)
                return !c || c.value === null || (Array.isArray(c.value) && !c.value.length)
            })
            if (missing.length) {
                category = cats[3]
                downgraded = `a cited value is missing from the assembled activity (${missing.join(', ')})`
            }
        }
        return { ...a, category, requirementStatus, requirementRole, satisfied: category === cats[0] || category === cats[1], downgraded }
    })
    const counts = Object.fromEntries(cats.map((c) => [c, lines.filter((l) => l.category === c).length]))
    return { lines, counts }
}
