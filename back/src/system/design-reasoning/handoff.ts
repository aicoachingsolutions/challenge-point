/**
 * **The reusable configuration handoff** — review pathway only, isolated, TEST-ONLY (Christian's reply received 7 November 2026, section 1:
 * *"I authorize the bounded implementation and testing of your proposed handoff between the existing review pathway and the checked
 * configuration/rendering machinery."* / *"This authorization is for an isolated development pathway only."*).
 *
 * WHAT IT DOES, in Christian's four verbs:
 *   - RECEIVE a case: the Learning Goal, then Step 1 (the resolved context and Game Problems) and Step 2 (the Game Form result), both RUN
 *     here through `runStage1`, never copied from data; and the case's inputs (session, Christian's words and how each enters the chain,
 *     illustrative values, TEST-ONLY treatments), validated by hand (`validateHandoffInputs`).
 *   - DETERMINE the form: Step 2's SELECTED form; or, where Step 2 leaves compatible alternatives, only a form the inputs name with a stated
 *     basis (an illustrative choice a filed ruling permits, or our logical inference), checked to be among the compatible ones, the others
 *     retained with no preference; with no named form the run stops ('alternatives retained; no basis to select'). The form enters the
 *     chain explicitly; the chain's own keyword-scorer pick is recorded as not used and never reported as a selection.
 *   - PRODUCE: the chain request (a TEST-ONLY in-memory record and realization built from the case's rulings, the draft store where the
 *     context has no contract, choices for open lines, labelled stand-in items, the review-only wording), run by the injected chain, which
 *     reads back the configuration lines, the rendered sentences with their from-paths, the laws and requirement accounts, the diagram and
 *     the refusal.
 *   - PRESERVE: every line graded by its determining premises (the grading map, OURS, `GRADING_MAP`), weakest first in Christian's six
 *     classes (`sixClassOf`), each premise printed with its own standing and source; every sentence graded by the lines its from-paths join;
 *     the decision kinds A, B and C per line by our rule (`decisionKindOf`), for Christian's review; refusals, gaps, alternatives, illustrative
 *     values and TEST-ONLY treatments listed apart; and on every configuration the line `OPPORTUNITIES_NOT_ESTABLISHED`.
 *   - Since S3b (DESIGN 3.6): a manipulation applied on a relationship is placed in the selection and every line it brings rests on that
 *     relationship; a value proposed for a line is applied only as illustrative and never over a ruling's value; a TEST-ONLY Game Problem in the
 *     record is reported as a mismatch, never switched; each refusal is read back to what it rests on (`RefusalBasis`); and `compareResults`
 *     says exactly what changed between a case and a variant of it.
 *   - Since the review of 7 November: the refusal reading counts ASSUMED items and bounds as ours, prints the basis mix, reads the chain's own
 *     account behind a refusal met before any game exists (failing checks' own results, owed lines' classification) and lists apart a cited line
 *     nobody established (a gap); a line's relation item is graded; a knowledge ruling item prints its evidence; the inputs validator refuses a
 *     coach-input session with no ruling, a choice whose provisional flag differs from its ruling's, and an unknown treatment kind; the case
 *     data's notes are printed from the data; the diagram is compared over its whole projection.
 *   - Since the review's second round: a gap is a cited owed line no requirement declaration reaches by the chain's own reach of its element;
 *     an open line refused for being outside its permitted set is read through the bounding items the chain names; each cited item prints its
 *     class; a communication refusal is a renderer capability gap only where every code is Q3.
 *   - Since the isolated foundational test (stage 9; Christian's authorization, pasted 10 November 2026): a case may declare that the chain
 *     CONSUMES Step 1's resolved Game Problem and Step 2's SELECTED form (`ChainRequest.consume`; the form is then consumed, never placed, and
 *     nothing is placed), and the result carries what the chain's own account recorded it consumed (`consumption`), apart from the chain's own
 *     reading; a TEST-ONLY treatment may replace one declaration of a contract on the chain's copy, or name the classification of the laws the
 *     chain's own check reads. Every other case runs exactly as before, and its result carries no new field.
 *   - Since the safeguards slice of stage 9 (DESIGN-9 sections 3 and 4): a consuming case may declare the TEST-ONLY bypass of the numerical
 *     size rule (SIZE_RULE_BYPASS) and manipulations that enter only through the record's authorized set (`entersBy: 'RECORD'`, never placed),
 *     each line they bring resting on its relationship stand-in (class 4 at best); the chain's answer may carry what the safeguards read
 *     (`observed`, `recordSet`), never copied into a result. The safeguards' pure check is `safeguards.ts`.
 *
 * WHAT IT IS NOT. Not a configuration step of the live engine, not served, not an authorization, not a selection input. It imports no
 * module of the checked chain: the chain arrives as an injected, structurally typed interface (`HandoffChain`), wired only by the unit test.
 * It names no goal, Game Problem, context, Game Form, law or data id, and no sport word: every such value lives in its data file and test.
 */
import { citedDateOf, classLabel, premiseStandingLabel, receivedOf, SIX_CLASSES, SixClass, sixClassOf, VALUE_LABELS } from './assembly'
import { committedKnowledge, DesignKnowledge, isStanding, Standing } from './knowledge'
import { runStage1, Stage1Result } from './stage1'
import { weakestStanding } from './trace'

// ---------------------------------------------------------------------------------------------------------------------------------------
// The case inputs (the review data file), validated by hand
// ---------------------------------------------------------------------------------------------------------------------------------------

export interface HandoffRuling {
    id: string
    words: string[]
    file: string
    /** The received date (ISO); for a reply whose received date is not recorded (`dateBasis`), the date it was pasted and filed. */
    received: string
    replyOfDay?: string
    /** Optional: PASTED_WITHOUT_HEADER where the reply was pasted without its mail header, so `received` holds the paste date (stage 9 review). */
    dateBasis?: 'PASTED_WITHOUT_HEADER'
    /** With `dateBasis` only: how a citation names the reply in place of a received date (data, never the stage's own words). */
    citedAs?: string
    provisional: boolean
    scope: string | null
}
/**
 * What a result's entry for a ruling serializes beside its `received` field: a marked ruling's date basis and the name a citation gives the
 * reply, so the results never present a paste date as a received date (stage 9 review); nothing for an unmarked ruling, whose entry is unchanged.
 */
export type DatedEntry = { dateBasis?: 'PASTED_WITHOUT_HEADER'; citedAs?: string }
const datedEntryOf = (r: HandoffRuling): DatedEntry => (r.dateBasis ? { dateBasis: r.dateBasis, citedAs: r.citedAs } : {})

/** How one of Christian's rulings enters the checked chain for a case (or that it does not). */
export const ENTERS_AS = [
    'RECORD_RULING',
    'RECORD_GAME_PROBLEM_SCOPE',
    'FORM_PERMISSION',
    'SUPPLIED_CHOICE',
    'LAW_DEPARTURE',
    'EMPTY_CONSTRAINT_SET',
    'ILLUSTRATIVE_PERMISSION',
    'LAWS_CHECK_BASIS',
    'SESSION_BOUND',
    'REPORT_ONLY',
] as const
export type EntersAs = (typeof ENTERS_AS)[number]

export const FORM_BASES = ['ILLUSTRATIVE', 'LOGICAL_INFERENCE', 'STRUCTURAL_CASE'] as const
export type FormBasis = (typeof FORM_BASES)[number]

export interface NamedForm {
    named: string
    basis: FormBasis
    rulingRefs: string[]
    why: string
}

export interface CaseSession {
    players: number
    lengthM: number
    widthM: number
    durationMin: number
    specializedRoles: number
    goals: number | null
    label: 'ILLUSTRATIVE' | 'COACH_INPUT'
    rulingRefs: string[]
}

export interface SuppliedChoiceInput {
    lineId: string
    value: unknown
    rulingRef: string | null
    standing: 'RULING' | 'ILLUSTRATIVE'
    provisional: boolean
}

export interface StandInInput {
    id: string
    contractId: string
    label: 'ILLUSTRATIVE' | 'TEST ASSUMPTION'
    why: string
    rulingRefs: string[]
    item: Record<string, unknown> & { itemId: string; value: string }
}

/**
 * The kinds of TEST-ONLY treatment the cases use (a closed list, so a misspelled kind is refused rather than printed as a treatment that does
 * nothing). WITHHOLD_ITEMS acts on the chain request; the others say what the case's chain wiring does, for the report. Since the isolated
 * foundational test (stage 9), three more act on the chain request, each only where a case declares it: REPLACE_DECLARATION (one declaration
 * of a contract replaced on the chain's copy, `declaration`), CONSUMED_STEPS (Step 1's resolved Game Problem and Step 2's SELECTED form handed
 * to the chain for its TEST-ONLY consumption, `ChainRequest.consume`) and LAWS_CLASSIFICATION (the classification of the laws the chain's own
 * check reads: our DRAFT classification, with the treatment's labelled stand-in for one law where it names one, `standIn`). Since the
 * safeguards slice of stage 9 (DESIGN-9 section 4), SIZE_RULE_BYPASS also acts on the request, only beside CONSUMED_STEPS: the chain's TEST-ONLY
 * bypass of the numerical size rule (and of nothing else) for the record route's authorized set (`ChainRequest.consume.sizeRuleBypass`).
 * Since stage W1 (b) of the foundational package (11 November 2026), K2_RETAIN_FORM acts on the request, only beside CONSUMED_STEPS: the review
 * pathway's K2 result (no manipulation proposed) handed to the chain in place of a per-goal authorization record, with K2's rule and limit
 * (`k2`, word indexes of a ruling); the draft store is then read without its records. Refused beside the size-rule bypass, a TEST-ONLY
 * record, or any manipulation with a relationship (placed or entering by the record route). Since stage W1 (c1), GP_COVERAGE_LENSES acts
 * on the request, only beside CONSUMED_STEPS: the chain's lens candidates and signal groups taken from Step 1's Game Problem Coverage row in
 * both branches (`ChainRequest.consume.coverageLenses`); a measurement treatment, never the consumption's default. Since stage W2 (11 November
 * 2026), FOUNDATION_PRESENCE_BYPASS acts on the request, only beside SIZE_RULE_BYPASS: the package check need find no foundation member (our
 * classification of foundation presence as a quota, reversible by removing it; every selected member is still validated under the switch).
 */
export const TREATMENT_KINDS = ['IN_MEMORY_RECORD', 'IN_MEMORY_REALIZATION', 'DRAFT_STORE', 'LAWS_CHECK', 'WITHHOLD_ITEMS', 'VEHICLE', 'REPLACE_DECLARATION', 'CONSUMED_STEPS', 'LAWS_CLASSIFICATION', 'SIZE_RULE_BYPASS', 'K2_RETAIN_FORM', 'GP_COVERAGE_LENSES', 'FOUNDATION_PRESENCE_BYPASS', 'ILLUSTRATIVE_CARRIERS', 'PROPOSED_CONFIGURATION', 'PROPOSED_PENDING', 'CANDIDATE_WORDING'] as const

export interface TreatmentInput {
    id: string
    kind: (typeof TREATMENT_KINDS)[number]
    what: string
    effect: string
    why: string
    label: string
    contractId?: string
    itemIds?: string[]
    rulingRefs?: string[]
    /** REPLACE_DECLARATION only: the one declaration of `contractId` replaced (its row, selector and declaration) and what replaces it. */
    declaration?: { row: string; selector: string; from: string; to: string; qualifier?: string }
    /** LAWS_CLASSIFICATION only, optional: one law read with another materiality, a labelled TEST-ONLY stand-in (neither our reading nor a ruling). */
    standIn?: { law: string; materiality: string }
    /** K2_RETAIN_FORM only (stage W1 (b)): the ruling holding K2 and the indexes of its rule and of its limit among that ruling's words. */
    k2?: { rulingRef: string; rule: number; limit: number }
    /**
     * ILLUSTRATIVE_CARRIERS only (stage W4 of the foundational package, 11 November 2026): the ILLUSTRATIVE carrier file (`draft-store.ts`
     * `loadIllustrativeCarriers`, a path under docs/audits/drafts) and the groups of it this treatment adds to the case's draft store, on the
     * chain's copy only. Only beside CONSUMED_STEPS and a draft store; its label begins ILLUSTRATIVE.
     */
    carriers?: { file: string; groups: string[] }
    /**
     * PROPOSED_CONFIGURATION only (stage B1 of the complete-activity package, 12 November 2026): our PROPOSED configuration's file
     * (`draft-store.ts` `loadProposedRealization`, a path under docs/audits/drafts), and the ruling words (by index) it is put to Christian
     * under, carried into the build's review-level account. Only beside CONSUMED_STEPS, K2_RETAIN_FORM and a draft store; its label begins
     * PROPOSED. PROPOSED_PENDING (the same stage) names nothing: it is declared only beside PROPOSED_CONFIGURATION.
     */
    proposed?: { file: string; basis: { rulingRef: string; words: number[] }; lawDepartures?: true }
    /**
     * CANDIDATE_WORDING only (stage B2 of the complete-activity package, 12 November 2026): our CANDIDATE coach wording's file
     * (`candidate-coach-wording.ts`, a path under docs/audits/drafts), read by the chain's renderer and fidelity beside the approved table, never
     * in it. Only beside PROPOSED_CONFIGURATION (review level); its label begins CANDIDATE. PROPOSED_CONFIGURATION's `lawDepartures` (the same
     * stage) carries the configuration file's PROPOSED departures from the Laws and its check; absent, the configuration is read without them.
     */
    wording?: { file: string }
}

export interface ProposedManipulation {
    id: string
    purpose: string
    manipulation: string
    /** A TEST-ONLY stand-in for an authorized relationship (class 4, never knowledge), or absent. */
    relationship?: { ref: string; label: 'TEST ASSUMPTION'; why: string }
    /**
     * Since the safeguards slice of stage 9 (DESIGN-9 section 4), optional: RECORD where the manipulation enters ONLY through the TEST-ONLY
     * record's authorized set (the record route, on a run that consumes Steps 1 and 2), never placed, so the chain's own selection checks
     * examine it; the record is the draft store's, and the wiring holds the set the chain consulted to the case's record-route manipulations.
     * Every line it brings still rests on its relationship stand-in (class 4 at best). Absent: the placement route, as before.
     */
    entersBy?: 'RECORD'
}

/**
 * A value proposed for a line (Tests B, Christian's reply of 7 November, section 11: "When knowledge is insufficient, the system identifies the
 * missing relationship, retains alternatives where appropriate, and does not fabricate a selection."). It is applied only as an ILLUSTRATIVE
 * supplied choice, and never over a line the case closes on a ruling of Christian's with a different value: that is reported as contrary to the
 * ruling and the ruling's value stays. Whether the value is admissible is the chain's to say (its realizer refuses a value outside the line's
 * alternatives, or a value for a line nothing established).
 */
export interface ProposedChoice {
    id: string
    lineId: string
    value: unknown
    why: string
    rulingRefs: string[]
}

/**
 * A Game Problem put into the TEST-ONLY record in place of Step 1's primary (Tests B): the record's gate requires one, and no line of the chain
 * reads it. Step 1's resolution stands and is what the report names; the difference is reported, never switched (Christian's reply of 7 November,
 * section 9: "with mismatch reporting rather than automatic switching").
 */
export interface GameProblemOverride {
    id: string
    label: 'TEST ASSUMPTION'
    why: string
    rulingRefs: string[]
}

/**
 * A note the case's data asks the report to print in one of its sections (the result standing, the coach text, the diagram), in the data's own
 * words; where it quotes Christian, each quotation is named by its ruling and the index of the words in that ruling, and printed verbatim.
 */
export interface CaseNote {
    section: 'standing' | 'text' | 'diagram'
    text: string
    quotes?: Array<{ rulingRef: string; word: number }>
}

/** Where an illustrative value is drawn on the checked diagram (its key in the diagram model), so the diagram block can list it. */
export const DIAGRAM_KEYS = ['area', 'counts', 'zones'] as const

export interface CaseInput {
    id: string
    basedOn?: string
    label: string
    resultStanding: string
    goalId: string | null
    form: NamedForm | { fromStep2: true }
    session: CaseSession
    purpose: { rulingRefs: string[]; sourceEvidence: string; approvalEvidence: string } | null
    chain: {
        records: 'TEST_ONLY' | 'PRODUCTION'
        draftStore: string | null
        supplement: boolean
        vehicle: { goalId: string; removeContext: boolean; lawsStandIn: { law: string; materiality: string } | null; treatmentRef: string } | null
    }
    record: {
        by: string
        rulingRefs: string[]
        gameProblemScopeRefs: string[]
        authorizedConstraints: string[]
        constraintRulingRefs: string[]
        constraintFinding: string
    } | null
    realization: {
        id: string
        by: string
        rulingRefs: string[]
        departures: Array<{ law: string; extent: string; rulingRefs: string[]; because: string }>
        lawsCheck: { mode: string; rulingRefs: string[]; treatmentRef: string; because: string }
    } | null
    rulings: Array<{ ref: string; entersAs: EntersAs; how: string }>
    suppliedChoices: SuppliedChoiceInput[]
    standIns: StandInInput[]
    illustrative: Array<{ id: string; what: string; value: string; how: string; rulingRefs: string[]; onDiagram?: (typeof DIAGRAM_KEYS)[number] }>
    testOnlyTreatments: TreatmentInput[]
    proposedManipulations: ProposedManipulation[]
    decisionKindOverrides: Array<{ path: string; kind: DecisionKind; contextual: boolean; rulingRefs: string[] }>
    notCarried: Array<{ id: string; what: string; rulingRefs: string[]; where: string; label: string }>
    /** Optional (absent = none): values proposed for lines, each applied only as described at `ProposedChoice`. */
    proposedChoices?: ProposedChoice[]
    /** Optional (absent = none): a TEST-ONLY Game Problem for the record, as described at `GameProblemOverride`. */
    gameProblemOverride?: GameProblemOverride | null
    /** Optional (absent = none): notes the report prints from the data, as described at `CaseNote`. */
    reportNotes?: CaseNote[]
    /**
     * Optional: the ruling whose words hold Step 1's qualifier, so the report prints the qualifier as Christian's words with its received date
     * (only where the qualifier Step 1 returns is, word for word, among that ruling's words; otherwise it is printed as a value).
     */
    qualifierRulingRef?: string
}

export interface GradingTables {
    /**
     * Each source an item's evidence may cite, with the standing printed beside a restatement of it: the review pathway's standing for it
     * (`knowledgeSource`, checked by the test), or, for a source that table has no entry for, the file's own status fields (`ownStatus`, checked
     * by the test against the file).
     */
    sources: Array<{ id: string; markers: string[]; source: string; sourceStanding: string; knowledgeSource: string | null; ownStatus?: { file: string; fields: string[] } }>
    standingDecisions: Array<{ id: string; specLine: number; sourceCell: string; reference: string; referenceLine: number; provisional: boolean }>
    choiceFiles: Array<{ file: string; standing: 'OURS' | 'RULING'; provisional?: boolean; why: string }>
    lawsDefault: { principleRef: string; encoding: string }
}

export interface HandoffInputs {
    standing: string
    rulings: HandoffRuling[]
    cases: CaseInput[]
    grading: GradingTables
}

const isObject = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v)
const filled = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0
const deepCopy = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T
const isDate = (v: unknown): boolean => {
    if (typeof v !== 'string' || v.length !== 10 || v[4] !== '-' || v[7] !== '-') return false
    const d = new Date(`${v}T00:00:00Z`)
    return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v
}

/** Every ruling reference a case makes, wherever it makes it (form, session, purpose, record, realization, choices, stand-ins, lists). */
function citedRefs(c: Record<string, unknown>): string[] {
    const refs: string[] = []
    const take = (v: unknown) => {
        if (Array.isArray(v)) for (const x of v) if (typeof x === 'string') refs.push(x)
    }
    const walk = (v: unknown) => {
        if (Array.isArray(v)) v.forEach(walk)
        else if (isObject(v))
            for (const [key, x] of Object.entries(v)) {
                if (key === 'rulingRefs' || key === 'gameProblemScopeRefs' || key === 'constraintRulingRefs') take(x)
                else if ((key === 'rulingRef' || key === 'qualifierRulingRef') && typeof x === 'string') refs.push(x)
                else walk(x)
            }
    }
    for (const [key, v] of Object.entries(c)) if (key !== 'rulings') walk(v)
    return [...new Set(refs)]
}

/** Stage B1: whether a case's treatments declare K2's result (a PROPOSED configuration is read only beside it). */
const k2Declared = (treatments: Record<string, unknown>[]): boolean => treatments.some((t) => t.kind === 'K2_RETAIN_FORM')

const CASE_KEYS = ['id', 'basedOn', 'label', 'resultStanding', 'goalId', 'form', 'session', 'purpose', 'chain', 'record', 'realization', 'rulings', 'suppliedChoices', 'standIns', 'illustrative', 'testOnlyTreatments', 'proposedManipulations', 'decisionKindOverrides', 'notCarried', 'proposedChoices', 'gameProblemOverride', 'reportNotes', 'qualifierRulingRef']
const NOTE_SECTIONS = ['standing', 'text', 'diagram']
const RULING_KEYS = ['id', 'words', 'file', 'received', 'replyOfDay', 'dateBasis', 'citedAs', 'provisional', 'scope']

/**
 * The review data, checked by hand and returned as a deep copy with every case's `basedOn` resolved (a case states only what differs from its
 * base; one level). Throws, naming every defect: unknown keys, a ruling without words, file or a real received date, a reference to a
 * ruling the file does not hold, a form basis outside the closed list, a stand-in without its label, a treatment without what, effect and
 * why, a supplied choice standing on no ruling that does not say it is ILLUSTRATIVE. Since the review of 7 November also: a coach-input session
 * citing no ruling for its bound; a supplied choice on a ruling whose provisional flag differs from that ruling's; a treatment kind outside
 * `TREATMENT_KINDS`, or one naming items to withhold that is not WITHHOLD_ITEMS; a note in an unknown section or quoting words a ruling does
 * not hold. Every case is returned as a deep copy, based on another or not.
 */
export function validateHandoffInputs(raw: unknown): HandoffInputs {
    const errors: string[] = []
    if (!isObject(raw)) throw new Error('handoff inputs: not an object')
    if (!filled(raw.standing)) errors.push('the file says nothing about what it is (standing)')
    const rulings = Array.isArray(raw.rulings) ? (raw.rulings as unknown[]) : []
    if (!rulings.length) errors.push('the file holds no ruling')
    const ids = new Set<string>()
    for (const [i, r] of rulings.entries()) {
        if (!isObject(r)) {
            errors.push(`ruling ${i + 1} is not an object`)
            continue
        }
        for (const key of Object.keys(r)) if (RULING_KEYS.indexOf(key) < 0) errors.push(`ruling ${String(r.id)}: unknown key ${key}`)
        if (!filled(r.id)) errors.push(`ruling ${i + 1} has no id`)
        if (ids.has(String(r.id))) errors.push(`ruling ${String(r.id)} is defined twice`)
        ids.add(String(r.id))
        if (!Array.isArray(r.words) || !r.words.length || !(r.words as unknown[]).every(filled)) errors.push(`ruling ${String(r.id)} quotes no words`)
        if (!filled(r.file)) errors.push(`ruling ${String(r.id)} names no file`)
        if (!isDate(r.received)) errors.push(`ruling ${String(r.id)}: the received date is not a real date`)
        // A reply pasted without its mail header keeps its paste date in `received`, marked, and names itself for citations (both or neither).
        if (r.dateBasis !== undefined && r.dateBasis !== 'PASTED_WITHOUT_HEADER') errors.push(`ruling ${String(r.id)}: dateBasis is PASTED_WITHOUT_HEADER or absent`)
        if ((r.dateBasis === undefined) !== (r.citedAs === undefined) || (r.citedAs !== undefined && !filled(r.citedAs))) errors.push(`ruling ${String(r.id)}: a dateBasis and the name a citation gives the reply (citedAs) come together`)
        if (typeof r.provisional !== 'boolean') errors.push(`ruling ${String(r.id)} does not say whether it is provisional`)
    }
    const known = (ref: unknown, where: string) => {
        if (!filled(ref) || !ids.has(ref)) errors.push(`${where}: ${JSON.stringify(ref)} is not a ruling the file holds`)
    }
    const rawCases = Array.isArray(raw.cases) ? (raw.cases as unknown[]) : []
    if (!rawCases.length) errors.push('the file holds no case')
    const byId = new Map<string, Record<string, unknown>>()
    for (const c of rawCases) if (isObject(c) && filled(c.id)) byId.set(c.id, c)
    const cases: CaseInput[] = []
    for (const [i, c] of rawCases.entries()) {
        if (!isObject(c)) {
            errors.push(`case ${i + 1} is not an object`)
            continue
        }
        for (const key of Object.keys(c)) if (CASE_KEYS.indexOf(key) < 0) errors.push(`case ${String(c.id)}: unknown key ${key}`)
        let merged: Record<string, unknown> = deepCopy(c)
        if (c.basedOn !== undefined) {
            const base = byId.get(String(c.basedOn))
            if (!base) errors.push(`case ${String(c.id)} is based on ${String(c.basedOn)}, which the file does not hold`)
            else if (base.basedOn !== undefined) errors.push(`case ${String(c.id)} is based on ${String(c.basedOn)}, itself a variant (one level only)`)
            else merged = { ...deepCopy(base), ...deepCopy(c) }
        }
        const at = `case ${String(merged.id)}`
        if (!filled(merged.id) || !filled(merged.label) || !filled(merged.resultStanding)) errors.push(`${at}: id, label and resultStanding are required`)
        if (merged.goalId !== null && !filled(merged.goalId)) errors.push(`${at}: goalId is a goal id or null (a structural case)`)
        const form = merged.form
        if (!isObject(form)) errors.push(`${at}: no form`)
        else if (form.fromStep2 === true) {
            if (merged.goalId === null) errors.push(`${at}: a structural case has no Step 2 to take its form from`)
        } else {
            if (!filled(form.named)) errors.push(`${at}: the form is neither taken from Step 2 nor named`)
            if ((FORM_BASES as readonly string[]).indexOf(String(form.basis)) < 0) errors.push(`${at}: the form's basis ${JSON.stringify(form.basis)} is none of ${FORM_BASES.join(', ')}`)
            if (!filled(form.why)) errors.push(`${at}: the form's basis says nothing (why)`)
            for (const ref of Array.isArray(form.rulingRefs) ? form.rulingRefs : []) known(ref, `${at} form`)
            if (form.basis === 'ILLUSTRATIVE' && !(Array.isArray(form.rulingRefs) && form.rulingRefs.length)) errors.push(`${at}: an illustrative form must cite the ruling that permits it`)
            if ((form.basis === 'STRUCTURAL_CASE') !== (merged.goalId === null)) errors.push(`${at}: a STRUCTURAL_CASE form is exactly the form of a case with no Learning Goal`)
        }
        const session = merged.session
        if (!isObject(session)) errors.push(`${at}: no session`)
        else {
            for (const key of ['players', 'lengthM', 'widthM', 'durationMin', 'specializedRoles']) if (typeof session[key] !== 'number' || !Number.isFinite(session[key] as number)) errors.push(`${at}: session.${key} is not a number`)
            if (session.label !== 'ILLUSTRATIVE' && session.label !== 'COACH_INPUT') errors.push(`${at}: the session is labelled neither ILLUSTRATIVE nor COACH_INPUT`)
            if (session.label === 'COACH_INPUT' && !(Array.isArray(session.rulingRefs) && session.rulingRefs.length)) errors.push(`${at}: a coach-input session cites no ruling for the bound it is within`)
            for (const ref of Array.isArray(session.rulingRefs) ? session.rulingRefs : []) known(ref, `${at} session`)
        }
        for (const entry of Array.isArray(merged.rulings) ? (merged.rulings as unknown[]) : []) {
            if (!isObject(entry)) continue
            known(entry.ref, `${at} rulings`)
            if ((ENTERS_AS as readonly string[]).indexOf(String(entry.entersAs)) < 0) errors.push(`${at}: ${String(entry.ref)} enters as ${JSON.stringify(entry.entersAs)}, none of the closed list`)
            if (!filled(entry.how)) errors.push(`${at}: ${String(entry.ref)} does not say how it enters`)
        }
        for (const choice of Array.isArray(merged.suppliedChoices) ? (merged.suppliedChoices as unknown[]) : []) {
            if (!isObject(choice)) continue
            if (!filled(choice.lineId)) errors.push(`${at}: a supplied choice names no line`)
            if (choice.standing === 'RULING') {
                known(choice.rulingRef, `${at} supplied choice ${String(choice.lineId)}`)
                const ruled = rulings.find((r) => isObject(r) && r.id === choice.rulingRef) as Record<string, unknown> | undefined
                if (ruled && choice.provisional !== ruled.provisional) errors.push(`${at}: supplied choice ${String(choice.lineId)} is marked provisional ${String(choice.provisional)}, and its ruling ${String(choice.rulingRef)} is provisional ${String(ruled.provisional)}`)
            } else if (choice.standing !== 'ILLUSTRATIVE' || choice.rulingRef !== null) errors.push(`${at}: supplied choice ${String(choice.lineId)} stands on no ruling and is not labelled ILLUSTRATIVE`)
        }
        for (const s of Array.isArray(merged.standIns) ? (merged.standIns as unknown[]) : []) {
            if (!isObject(s)) continue
            if (s.label !== 'ILLUSTRATIVE' && s.label !== 'TEST ASSUMPTION') errors.push(`${at}: stand-in ${String(s.id)} is labelled neither ILLUSTRATIVE nor TEST ASSUMPTION`)
            if (!filled(s.why) || !filled(s.contractId) || !isObject(s.item) || !filled(s.item.itemId) || !filled(s.item.value)) errors.push(`${at}: stand-in ${String(s.id)} must say why, name its contract and carry its item with an id and a value`)
        }
        for (const t of Array.isArray(merged.testOnlyTreatments) ? (merged.testOnlyTreatments as unknown[]) : []) {
            if (!isObject(t) || !filled(t.id) || !filled(t.what) || !filled(t.effect) || !filled(t.why) || !filled(t.label)) errors.push(`${at}: a TEST-ONLY treatment must say what, its effect, why and its label`)
            else if ((TREATMENT_KINDS as readonly string[]).indexOf(String(t.kind)) < 0) errors.push(`${at}: treatment ${t.id}: the kind ${JSON.stringify(t.kind)} is none of ${TREATMENT_KINDS.join(', ')}`)
            else if (t.kind === 'WITHHOLD_ITEMS' && (!filled(t.contractId) || !Array.isArray(t.itemIds) || !t.itemIds.length)) errors.push(`${at}: treatment ${t.id} withholds items and names none`)
            else if (t.kind === 'REPLACE_DECLARATION') {
                const d = t.declaration
                if (!filled(t.contractId) || t.itemIds !== undefined || !isObject(d) || !filled(d.row) || !filled(d.selector) || !filled(d.from) || !filled(d.to) || (d.qualifier !== undefined && !filled(d.qualifier)))
                    errors.push(`${at}: treatment ${t.id} replaces a declaration: it names its contract and the declaration (row, selector, from, to; a qualifier only as words), and no items`)
            } else if (t.kind !== 'WITHHOLD_ITEMS' && (t.contractId !== undefined || t.itemIds !== undefined)) errors.push(`${at}: treatment ${t.id} names a contract or items, and only WITHHOLD_ITEMS acts on them (REPLACE_DECLARATION names a contract and one of its declarations)`)
            if (isObject(t) && t.declaration !== undefined && t.kind !== 'REPLACE_DECLARATION') errors.push(`${at}: treatment ${String(t.id)} names a declaration, and only REPLACE_DECLARATION replaces one`)
            // W4 (foundational package): ILLUSTRATIVE carriers name their file and groups, are labelled ILLUSTRATIVE, and only this kind names carriers.
            if (isObject(t) && (t.carriers !== undefined || t.kind === 'ILLUSTRATIVE_CARRIERS')) {
                const k = t.carriers as Record<string, unknown> | undefined
                if (t.kind !== 'ILLUSTRATIVE_CARRIERS' || !isObject(k) || !filled(k.file) || !Array.isArray(k.groups) || !k.groups.length || !(k.groups as unknown[]).every(filled) || !String(t.label).startsWith('ILLUSTRATIVE'))
                    errors.push(`${at}: treatment ${String(t.id)}: ILLUSTRATIVE carriers belong only to ILLUSTRATIVE_CARRIERS, which names its file and at least one group (carriers: file, groups) and is labelled ILLUSTRATIVE`)
            }
            // Stage B1 (complete-activity package): a PROPOSED configuration names its file and the ruling words it is put under, and is
            // labelled PROPOSED; only this kind names one.
            if (isObject(t) && (t.proposed !== undefined || t.kind === 'PROPOSED_CONFIGURATION')) {
                const p = t.proposed as Record<string, unknown> | undefined
                const b = isObject(p) ? (p.basis as Record<string, unknown> | undefined) : undefined
                const ruled = isObject(b) ? (rulings.find((r) => isObject(r) && r.id === b.rulingRef) as Record<string, unknown> | undefined) : undefined
                const inWords = (n: unknown) => typeof n === 'number' && Number.isInteger(n) && !!ruled && Array.isArray(ruled.words) && n >= 0 && n < (ruled.words as unknown[]).length
                if (t.kind !== 'PROPOSED_CONFIGURATION' || !isObject(p) || !filled(p.file) || !isObject(b) || !ruled || !Array.isArray(b.words) || !b.words.length || !(b.words as unknown[]).every(inWords) || !String(t.label).startsWith('PROPOSED'))
                    errors.push(`${at}: treatment ${String(t.id)}: a PROPOSED configuration belongs only to PROPOSED_CONFIGURATION, which names its file and the words of a ruling the file holds it is put under (proposed: file, basis: rulingRef, words) and is labelled PROPOSED`)
                // Stage B2: the configuration's PROPOSED departures from the Laws are carried only where the treatment says so (true, or absent).
                if (isObject(p) && p.lawDepartures !== undefined && p.lawDepartures !== true) errors.push(`${at}: treatment ${String(t.id)}: lawDepartures is true or absent`)
            }
            // Stage B2 (complete-activity package): our CANDIDATE wording names its file and is labelled CANDIDATE; only this kind names one.
            if (isObject(t) && (t.wording !== undefined || t.kind === 'CANDIDATE_WORDING')) {
                const w = t.wording as Record<string, unknown> | undefined
                if (t.kind !== 'CANDIDATE_WORDING' || !isObject(w) || !filled(w.file) || !String(t.label).startsWith('CANDIDATE'))
                    errors.push(`${at}: treatment ${String(t.id)}: our CANDIDATE wording belongs only to CANDIDATE_WORDING, which names its file (wording: file) and is labelled CANDIDATE`)
            }
            if (isObject(t) && t.standIn !== undefined && (t.kind !== 'LAWS_CLASSIFICATION' || !isObject(t.standIn) || !filled(t.standIn.law) || (t.standIn.materiality !== 'PROCEDURAL' && t.standIn.materiality !== 'MATERIAL')))
                errors.push(`${at}: treatment ${String(t.id)}: a stand-in for one law's materiality belongs only to LAWS_CLASSIFICATION and names the law and PROCEDURAL or MATERIAL`)
        }
        // The kinds that act on the chain request once per case, and what each needs (stage 9).
        const treatments = (Array.isArray(merged.testOnlyTreatments) ? (merged.testOnlyTreatments as unknown[]) : []).filter(isObject)
        const ofKind = (kind: string) => treatments.filter((t) => t.kind === kind)
        if (ofKind('CONSUMED_STEPS').length > 1 || ofKind('LAWS_CLASSIFICATION').length > 1) errors.push(`${at}: CONSUMED_STEPS and LAWS_CLASSIFICATION are each declared at most once`)
        const manipulations = (Array.isArray(merged.proposedManipulations) ? (merged.proposedManipulations as unknown[]) : []).filter(isObject)
        if (ofKind('CONSUMED_STEPS').length) {
            if (!isObject(merged.form) || merged.form.fromStep2 !== true || merged.goalId === null) errors.push(`${at}: CONSUMED_STEPS consumes Step 2's SELECTED form: the case has a Learning Goal and takes its form from Step 2`)
            // No manipulation enters by placement on a consuming run (the design of stage 9: the place route is not used); one may enter only
            // through the record's authorized set (entersBy RECORD).
            if (manipulations.some((m) => m.relationship !== undefined && m.entersBy !== 'RECORD')) errors.push(`${at}: a case that consumes Steps 1 and 2 places no manipulation (no relationship stand-in outside the record route)`)
            // A consuming run may not alter the selection (the wiring only observes it), so a vehicle's declared treatment could not be applied.
            if (isObject(merged.chain) && isObject(merged.chain.vehicle)) errors.push(`${at}: CONSUMED_STEPS is not declared beside a TEST-ONLY vehicle (a consuming run may not alter the selection, so a vehicle's removeContext could not be applied)`)
        }
        // The safeguards slice (DESIGN-9 section 4): the size-rule bypass and the record route exist only on a consuming run.
        if (ofKind('SIZE_RULE_BYPASS').length > 1 || (ofKind('SIZE_RULE_BYPASS').length && !ofKind('CONSUMED_STEPS').length)) errors.push(`${at}: SIZE_RULE_BYPASS is declared at most once, and only beside CONSUMED_STEPS (the record route)`)
        // Stage W2 (E3): foundation presence bypassed, once, only under the switch (where every selected member is validated).
        if (ofKind('FOUNDATION_PRESENCE_BYPASS').length > 1 || (ofKind('FOUNDATION_PRESENCE_BYPASS').length && !ofKind('SIZE_RULE_BYPASS').length)) errors.push(`${at}: FOUNDATION_PRESENCE_BYPASS is declared at most once, and only beside SIZE_RULE_BYPASS (the switch)`)
        for (const m of manipulations.filter((x) => x.entersBy !== undefined)) {
            if (m.entersBy !== 'RECORD' || !ofKind('CONSUMED_STEPS').length || !isObject(m.relationship)) errors.push(`${at}: manipulation ${String(m.id)} enters by the record route (entersBy RECORD) only on a run that consumes Steps 1 and 2, on a TEST-ONLY relationship stand-in`)
        }
        // Stage W1 (b): K2's result in place of a per-goal record: once, only on a consuming run, never beside the size-rule bypass, a TEST-ONLY
        // record or a manipulation with a relationship (placed or by the record route), and naming K2's rule and limit among a ruling's words.
        const k2 = ofKind('K2_RETAIN_FORM')
        if (k2.length > 1 || (k2.length && !ofKind('CONSUMED_STEPS').length)) errors.push(`${at}: K2_RETAIN_FORM is declared at most once, and only beside CONSUMED_STEPS`)
        // Stage W1 (c1): the Coverage-row lenses, once, only on a consuming run (they need Step 1's Game Problem).
        if (ofKind('GP_COVERAGE_LENSES').length > 1 || (ofKind('GP_COVERAGE_LENSES').length && !ofKind('CONSUMED_STEPS').length)) errors.push(`${at}: GP_COVERAGE_LENSES is declared at most once, and only beside CONSUMED_STEPS`)
        // W4 (foundational package): ILLUSTRATIVE carriers are added only to a consuming run's draft store.
        if (ofKind('ILLUSTRATIVE_CARRIERS').length && (!ofKind('CONSUMED_STEPS').length || !isObject(merged.chain) || !filled(merged.chain.draftStore))) errors.push(`${at}: ILLUSTRATIVE_CARRIERS adds to a draft store, only on a run that consumes Steps 1 and 2 and reads one`)
        // Stage B1 (complete-activity package): a PROPOSED configuration once, only beside K2's result on a consuming run that reads a draft
        // store; PROPOSED_PENDING once, only beside it.
        if (ofKind('PROPOSED_CONFIGURATION').length > 1 || (ofKind('PROPOSED_CONFIGURATION').length && (!ofKind('CONSUMED_STEPS').length || !k2Declared(treatments) || !isObject(merged.chain) || !filled(merged.chain.draftStore))))
            errors.push(`${at}: PROPOSED_CONFIGURATION is declared at most once, only beside CONSUMED_STEPS and K2_RETAIN_FORM on a run that reads a draft store`)
        if (ofKind('PROPOSED_PENDING').length > 1 || (ofKind('PROPOSED_PENDING').length && !ofKind('PROPOSED_CONFIGURATION').length)) errors.push(`${at}: PROPOSED_PENDING is declared at most once, and only beside PROPOSED_CONFIGURATION`)
        // Stage B2: our CANDIDATE wording once, only at review level (beside a PROPOSED configuration).
        if (ofKind('CANDIDATE_WORDING').length > 1 || (ofKind('CANDIDATE_WORDING').length && !ofKind('PROPOSED_CONFIGURATION').length)) errors.push(`${at}: CANDIDATE_WORDING is declared at most once, and only beside PROPOSED_CONFIGURATION`)
        // Stage B2: the configuration's own check of the Laws stands in place of a classification the chain's check would read, never beside one.
        if (ofKind('LAWS_CLASSIFICATION').length && ofKind('PROPOSED_CONFIGURATION').some((t) => isObject(t.proposed) && t.proposed.lawDepartures === true))
            errors.push(`${at}: LAWS_CLASSIFICATION is not declared beside a PROPOSED configuration carried with its departures from the Laws (its own check holds the activity)`)
        if (k2.length && ofKind('SIZE_RULE_BYPASS').length) errors.push(`${at}: K2_RETAIN_FORM is never declared beside SIZE_RULE_BYPASS (K2's result is the empty set; the bypass is for a record's evaluated set)`)
        if (k2.length && (merged.record !== null && merged.record !== undefined || (isObject(merged.chain) && merged.chain.records === 'TEST_ONLY'))) errors.push(`${at}: K2_RETAIN_FORM stands in place of a per-goal authorization record, never beside one (the case has a TEST-ONLY record)`)
        if (k2.length && manipulations.some((m) => m.relationship !== undefined)) errors.push(`${at}: K2_RETAIN_FORM is handed only where no proposed manipulation has a relationship (placed or entering by the record route): K2 yields no manipulation`)
        for (const t of treatments.filter((x) => x.k2 !== undefined || x.kind === 'K2_RETAIN_FORM')) {
            const q = t.k2
            const ruled = isObject(q) ? (rulings.find((r) => isObject(r) && r.id === q.rulingRef) as Record<string, unknown> | undefined) : undefined
            const inRange = (n: unknown) => typeof n === 'number' && Number.isInteger(n) && !!ruled && Array.isArray(ruled.words) && n >= 0 && n < (ruled.words as unknown[]).length
            if (t.kind !== 'K2_RETAIN_FORM' || !isObject(q) || !ruled || !inRange(q.rule) || !inRange(q.limit) || q.rule === q.limit)
                errors.push(`${at}: treatment ${String(t.id)}: K2's rule and limit belong only to K2_RETAIN_FORM, which names them as two words of a ruling the file holds (k2: rulingRef, rule, limit)`)
        }
        if (ofKind('LAWS_CLASSIFICATION').length && (isObject(merged.realization) || (isObject(merged.chain) && isObject(merged.chain.vehicle) && isObject(merged.chain.vehicle.lawsStandIn))))
            errors.push(`${at}: LAWS_CLASSIFICATION is not declared beside a TEST-ONLY realization's check or a vehicle's stand-in`)
        for (const i of Array.isArray(merged.illustrative) ? (merged.illustrative as unknown[]) : []) {
            if (isObject(i) && i.onDiagram !== undefined && (DIAGRAM_KEYS as readonly string[]).indexOf(String(i.onDiagram)) < 0) errors.push(`${at}: illustrative ${String(i.id)} is drawn as ${JSON.stringify(i.onDiagram)}, none of ${DIAGRAM_KEYS.join(', ')}`)
        }
        if (merged.reportNotes !== undefined) {
            if (!Array.isArray(merged.reportNotes)) errors.push(`${at}: reportNotes must be a list`)
            else
                for (const n of merged.reportNotes as unknown[]) {
                    if (!isObject(n) || NOTE_SECTIONS.indexOf(String(n.section)) < 0 || !filled(n.text)) {
                        errors.push(`${at}: a note names its section (${NOTE_SECTIONS.join(', ')}) and its text`)
                        continue
                    }
                    for (const q of Array.isArray(n.quotes) ? (n.quotes as unknown[]) : []) {
                        const ruled = isObject(q) ? (rulings.find((r) => isObject(r) && r.id === q.rulingRef) as Record<string, unknown> | undefined) : undefined
                        if (!isObject(q) || !ruled || typeof q.word !== 'number' || !Array.isArray(ruled.words) || q.word < 0 || q.word >= ruled.words.length) errors.push(`${at}: a note quotes words a ruling of the file does not hold`)
                    }
                }
        }
        if (merged.qualifierRulingRef !== undefined) known(merged.qualifierRulingRef, `${at} qualifier`)
        for (const o of Array.isArray(merged.decisionKindOverrides) ? (merged.decisionKindOverrides as unknown[]) : []) {
            if (!isObject(o) || !filled(o.path) || (DECISION_KINDS as readonly string[]).indexOf(String(o.kind)) < 0) errors.push(`${at}: a decision-kind override names a path and one of ${DECISION_KINDS.join(', ')}`)
        }
        for (const m of Array.isArray(merged.proposedManipulations) ? (merged.proposedManipulations as unknown[]) : []) {
            if (!isObject(m) || !filled(m.id) || !filled(m.purpose) || !filled(m.manipulation)) errors.push(`${at}: a proposed manipulation names its id, its purpose and the manipulation`)
            else if (m.relationship !== undefined && (!isObject(m.relationship) || m.relationship.label !== 'TEST ASSUMPTION' || !filled(m.relationship.ref) || !filled(m.relationship.why))) errors.push(`${at}: manipulation ${m.id}: a relationship stand-in is labelled TEST ASSUMPTION and says its reference and why (never knowledge)`)
        }
        if (merged.proposedChoices !== undefined) {
            if (!Array.isArray(merged.proposedChoices)) errors.push(`${at}: proposedChoices must be a list`)
            else
                for (const p of merged.proposedChoices as unknown[]) {
                    if (!isObject(p) || !filled(p.id) || !filled(p.lineId) || p.value === undefined || !filled(p.why) || !Array.isArray(p.rulingRefs) || !p.rulingRefs.length) errors.push(`${at}: a proposed choice names its id, its line, its value, why, and the ruling that permits an illustrative value`)
                    else for (const ref of p.rulingRefs as unknown[]) known(ref, `${at} proposed choice ${p.id}`)
                }
        }
        if (merged.gameProblemOverride !== undefined && merged.gameProblemOverride !== null) {
            const o = merged.gameProblemOverride
            if (!isObject(o) || !filled(o.id) || o.label !== 'TEST ASSUMPTION' || !filled(o.why) || !Array.isArray(o.rulingRefs)) errors.push(`${at}: a Game Problem override names its id, is labelled TEST ASSUMPTION and says why`)
            else for (const ref of o.rulingRefs as unknown[]) known(ref, `${at} Game Problem override`)
            if (merged.chain && isObject(merged.chain) && merged.chain.records !== 'TEST_ONLY') errors.push(`${at}: a Game Problem override enters only a TEST-ONLY record`)
        }
        for (const list of ['rulings', 'suppliedChoices', 'standIns', 'illustrative', 'testOnlyTreatments', 'proposedManipulations', 'decisionKindOverrides', 'notCarried']) {
            if (!Array.isArray(merged[list])) errors.push(`${at}: ${list} must be a list (an empty list says it holds none)`)
        }
        if (isObject(merged.record)) {
            for (const ref of [...((merged.record.rulingRefs as unknown[]) ?? []), ...((merged.record.gameProblemScopeRefs as unknown[]) ?? []), ...((merged.record.constraintRulingRefs as unknown[]) ?? [])]) known(ref, `${at} record`)
            if (!filled(merged.record.constraintFinding)) errors.push(`${at}: the record's constraint set carries no finding`)
        }
        if (isObject(merged.realization)) {
            for (const ref of (merged.realization.rulingRefs as unknown[]) ?? []) known(ref, `${at} realization`)
            for (const d of (merged.realization.departures as unknown[]) ?? []) if (isObject(d)) for (const ref of (d.rulingRefs as unknown[]) ?? []) known(ref, `${at} departure`)
        }
        // Every ruling the case cites anywhere is listed among its rulings, with how it enters the chain (so the report's list is complete).
        const listedRefs = new Set((Array.isArray(merged.rulings) ? (merged.rulings as unknown[]) : []).map((e) => (isObject(e) ? String(e.ref) : '')))
        for (const ref of citedRefs(merged)) if (!listedRefs.has(ref)) errors.push(`${at}: cites ${ref} without listing it among its rulings (how it enters the chain)`)
        cases.push(merged as unknown as CaseInput)
    }
    const grading = raw.grading
    if (!isObject(grading)) errors.push('the file holds no grading tables')
    else {
        for (const key of ['sources', 'standingDecisions', 'choiceFiles']) if (!Array.isArray(grading[key])) errors.push(`grading.${key} must be a list`)
        if (!isObject(grading.lawsDefault)) errors.push('grading.lawsDefault is missing')
        else known(grading.lawsDefault.principleRef, 'grading.lawsDefault')
    }
    if (errors.length) throw new Error(`handoff inputs refused: ${errors.join(' | ')}`)
    return { standing: String(raw.standing), rulings: deepCopy(rulings) as HandoffRuling[], cases, grading: deepCopy(grading) as GradingTables }
}

// ---------------------------------------------------------------------------------------------------------------------------------------
// The injected chain (structurally typed; the unit test wires the real one)
// ---------------------------------------------------------------------------------------------------------------------------------------

/** What the handoff asks the checked chain to build. Every alteration it names is made on a copy, by the chain's own TEST-ONLY options. */
export interface ChainRequest {
    caseId: string
    /** The Learning Goal to build, or a vehicle for a structural case (named by the data, labelled a TEST-ONLY treatment). */
    goalId: string | null
    vehicle: CaseInput['chain']['vehicle']
    session: CaseSession
    /** The form the handoff determined; the chain's selection receives it explicitly, replacing whatever its own scorer picked. */
    formId: string
    /** Step 1's context (null in a structural case); the chain's context is compared with it. */
    contextId: string | null
    records:
        | 'PRODUCTION'
        | {
              learningGoalId: string
              contextId: string
              gameProblemId: string
              ruledOn: string
              by: string
              ruling: string[]
              authorizedConstraints: string[]
              authorizedConstraintsFinding: string
              provisionalRealization: string | null
          }
    realization: {
        id: string
        realizes: string
        ruledOn: string
        by: string
        citedAs: string
        words: string[]
        departures: Array<{ law: string; extent: string; because: string; words: string[]; citedAs: string }>
        lawsCheck: { mode: string; because: string; words: string[]; citedAs: string }
    } | null
    draftStore: string | null
    withhold: Array<{ contractId: string; itemIds: string[]; treatmentId: string }>
    standIns: Array<{ contractId: string; item: Record<string, unknown> }>
    choices: Array<{ lineId: string; value: unknown; because: string }>
    /**
     * Manipulations the handoff applied (each on an authorized relationship, or in a test on a TEST-ONLY stand-in for one), placed in the
     * selection explicitly, as the form is. The record's own authorized set is never widened by the handoff: measured, a record-backed pool
     * holding a lone manipulation is refused at selection (no compatible combination; the form's other roles stay unfilled), so the record
     * keeps what Christian ruled.
     */
    place: Array<{ id: string; manipulationId: string; relationshipRef: string }>
    supplement: boolean
    /** True where the case's realization declares REPORT: the harness then holds each owed law to the DRAFT materiality reading. */
    holdReportedLawsToMateriality: boolean
    /**
     * Present only where the case declares CONSUMED_STEPS (the isolated foundational test, stage 9; Christian's authorization, pasted 10
     * November 2026, section 1): Step 1's resolved primary Game Problem with its basis, and Step 2's SELECTED form with its standing words and the
     * grade of every cell it rests on, as Steps 1 and 2 returned them in this run, for the chain to consume rather than select from wording.
     * `place` is then empty (the wiring refuses otherwise): the form is consumed, never placed, and no manipulation is placed.
     */
    consume?: {
        gameProblem: { gameProblemId: string; basis: string; label: string }
        gameForm: { formId: string; standing: string; cells: Array<{ cell: string; grade: string }> }
        /** Present (true) only where the case declares SIZE_RULE_BYPASS: the chain's TEST-ONLY bypass of the numerical size rule, and of nothing else. */
        sizeRuleBypass?: true
        /**
         * Present only where the case declares K2_RETAIN_FORM (stage W1 (b)): the review pathway's K2 result, the empty set, with K2's rule and
         * its limit in Christian's words and their citation; the chain reads the draft store without its records under it.
         */
        k2?: { basis: 'K2_REVIEW_ONLY'; set: string[]; rulingRef: string; rule: string; limit: string; cited: string; treatmentId: string }
        /** Present (true) only where the case declares GP_COVERAGE_LENSES (stage W1 (c1)): the lenses and signal groups from Step 1's Coverage row. */
        coverageLenses?: true
        /** Present (true) only where the case declares FOUNDATION_PRESENCE_BYPASS (stage W2, E3), always beside `sizeRuleBypass`. */
        foundationPresenceBypass?: true
    }
    /**
     * Present only where a consuming case names manipulations that enter by the record route (`ProposedManipulation.entersBy`): their ids. The
     * wiring holds the authorized set of the record the chain consulted to exactly these (fail closed); nothing is placed.
     */
    recordRoute?: string[]
    /** Present only where the case declares REPLACE_DECLARATION treatments: each replaces one declaration of a contract, on the chain's copy. */
    replaceDeclarations?: Array<{ contractId: string; row: string; selector: string; from: string; to: string; qualifier: string | null; treatmentId: string }>
    /** Present only where the case declares LAWS_CLASSIFICATION: the chain's laws check reads our DRAFT classification, with the stand-in where one is named. */
    laws?: { standIn: { law: string; materiality: string } | null; treatmentId: string }
    /** Present only where the case declares ILLUSTRATIVE_CARRIERS treatments (W4): each adds its groups to the draft store, on the chain's copy. */
    illustrative?: Array<{ file: string; groups: string[]; treatmentId: string }>
    /**
     * Present only where the case declares PROPOSED_CONFIGURATION (stage B1 of the complete-activity package): our PROPOSED configuration's
     * file, the treatment, PROPOSED_PENDING's id where the case declares it, and the ruling words it is put to Christian under (each with its
     * received date). The chain loads it through its gate, makes its restatement replacements on the draft store's copy and hands it to the
     * entry's TEST-ONLY upstream option, beside K2's result.
     */
    proposed?: { file: string; treatmentId: string; pendingTreatmentId: string | null; basis: Array<{ words: string; received: string }>; lawDepartures?: true }
    /**
     * Present only where the case declares CANDIDATE_WORDING (stage B2 of the complete-activity package): our CANDIDATE coach wording's file and
     * the treatment. The chain loads it through its gate and hands its entries to the entry's TEST-ONLY `candidateWording` option.
     */
    candidateWording?: { file: string; treatmentId: string; rulings: Array<{ id: string; words: string[]; received: string }> }
}

/** One configuration line as the chain answered it (from the realized game's fixture), in the chain's own words. */
export interface ChainLine {
    kind: 'DERIVED' | 'CHOICE' | 'NOT_ESTABLISHED' | 'ENTAILED' | 'INSTANTIATION' | 'LAW' | 'SESSION_ROLES'
    lineId: string
    path: string
    value: unknown
    /** DERIVED: what supports it, as the chain records it. */
    support?: Array<{ kind: string; contractId?: string; itemId?: string; id?: string; row?: string }>
    strength?: string
    /** CHOICE */
    because?: string
    closure?: string
    defaultedBy?: string | null
    assumedBound?: boolean
    permitted?: unknown[] | null
    /** CHOICE: where the value came from: the case's supplied choice, or a realization-choices file (named). */
    chosenBy?: { case: true } | { file: string }
    /**
     * CHOICE, since stage 9, where the chain records it: each item of the TEST-ONLY draft store that shaped the line, as the chain names it on
     * the line (its contract, item and relation, e.g. NARROWS). Read only by a consuming run's account of the draft items (never graded here).
     */
    draftShapedBy?: Array<{ contractId: string; itemId: string; relation: string }>
    /** NOT_ESTABLISHED */
    reason?: string
    /**
     * NOT_ESTABLISHED, stage B1 of the complete-activity package: present only where every non-claim that decided the line states that the
     * field needs no further value (classify.ts `nonClaimState`: an established absence, Christian's M6), with the contracts whose declarations
     * those are. Read by the safeguards (a clause line declared so by the restatement itself is carried, never a gap); never graded here.
     */
    nonClaim?: { state: 'NO_FURTHER_VALUE'; by: string[] }
    /** ENTAILED / INSTANTIATION: the element class it belongs to. */
    classId?: string
    /** DERIVED geometry: the term that bounded its extent, where one did. */
    extentTerm?: string | null
    /** DERIVED geometry: the item whose element the line's position is stated relative to, as the chain names it (its relation's `of`). */
    relationOf?: { contractId: string; itemId: string } | null
    /** LAW: the law, its status, and what departed from it. */
    law?: string
    lawStatus?: string
    removedByRealization?: boolean
}

export interface ChainSentence {
    section: string
    block: string | null
    status: string
    text: string
    from: string[]
    /** Where the build was refused at communication, the review draft's wording mark; otherwise null. */
    wording: string | null
    reviewOnly: boolean
}

export interface ChainAnswer {
    outcome: 'served' | 'refused'
    stage: string | null
    summary: string | null
    reasons: string[]
    /** The game form the chain's own selection picked before the handoff placed its form; null where selection refused first. */
    scorerPick: string[] | null
    account: {
        gameFormId: string | null
        contextId: string | null
        contextContract: string | null
        /** `names`: the Game Problem library's name for each id named here, read by the wiring through the display reader (for the report only). */
        gameProblem: { status: string; gameProblemId: string | null; inferredFromWording: string | null; names?: Record<string, string> } | null
        constraints: string[]
        affordanceLenses: string[]
    } | null
    /**
     * The contracts the chain derived from, item by item. `evidenceWithheld`, where the wiring sets it, says why the item's evidence is not to
     * be printed verbatim (the report then names the item and does not print it).
     */
    contracts: Array<{ contractId: string; origin: 'KNOWLEDGE' | 'DRAFT_STORE' | 'REALIZATION' | 'PROPOSED'; items: Array<{ itemId: string; row: string; basis: string; category: string | null; basisEvidence: string; provisional?: boolean | null; evidenceWithheld?: string | null }> }>
    lines: ChainLine[]
    sentences: ChainSentence[]
    /** True where the sentences are the served text; false where they are the review draft of a communication refusal; none otherwise. */
    sentencesServed: boolean | null
    withheld: Array<{ path: string; reason: string }>
    laws: { mode: string | null; owed: string[]; reportedForReview: string[] } | null
    requirementAccount: { status: string; contract: string | null; components: Array<[string, string]> } | null
    diagram: { served: boolean; verdict: string | null; area: unknown; counts: unknown; legend: unknown; zones: unknown[]; findings: unknown[]; dimensions: unknown[]; targets: unknown[]; teams: unknown[] } | null
    /** Each manipulation the request placed, with the contracts the chain derived from for it (matched by the chain's own knowledge key). */
    placed: Array<{ id: string; contractIds: string[] }>
    /** The fidelity check's violations on the served text (0 for a served activity); null where the build stopped before communication. */
    fidelityViolations: number | null
    /**
     * The chain's own account behind a refusal met before any game exists (structure or realization), as the chain reports it: each failing
     * pre-realization check's own result (its why and the lines it names), each owed line with the declarations it was decided over, and each
     * open line's permitted alternatives with the items that bound it. Null where the build was served or stopped elsewhere. Read only by the
     * refusal reading; it changes no check.
     */
    refusalDetail?: {
        failingChecks: Array<{ checkId: string; why: string; subjects: string[] }>
        /**
         * Each owed line with the declarations the chain decided it over and, for each, the chain's own reach of the line's element class
         * (`reach`: TRUE, FALSE or UNDETERMINED as the chain's reach function answers, UNREADABLE where the selector did not parse, null where the
         * line names no class); `scope`, the declaration's scope, and `scopeReaches`, whether that scope reaches the element class by the
         * chain's own scope rule (classify.ts: an own-involvement declaration reaches only the classes its own object forms; null where the line
         * names no class); `rowWide` where that set is every declaration on the row; `establishing`, the contracts whose items form the
         * element class (the chain's establishing objects; empty where the line names no class).
         */
        owedLines: Array<{ lineId: string; verdict: string; reason: string | null; declared: string[]; governedBy: Array<{ contractId: string; declaration: string; selector: string | null; reach: string | null; scope: string | null; scopeReaches: boolean | null }>; rowWide: boolean; elementClass: string | null; establishing: string[] }>
        /** Each open line's permitted alternatives and the items bounding it as the chain names them (its narrowing items, its bounding items). */
        openLines: Array<{ lineId: string; permitted: unknown[] | null; boundedBy: Array<{ contractId: string; itemId: string; how: 'NARROWING' | 'BOUNDING' }> }>
    } | null
    /**
     * Present only on a run whose request carried `consume`: what the chain's own account recorded it consumed (read by the wiring from the
     * build's account, never from the request), so a report can tell consumption from agreement. `gameProblem`: Step 1's Game Problem as the
     * selection carried it, beside (never in place of) the chain's own reading, which `account.gameProblem` still holds. `form`: Step 2's form as
     * carried, standing and grades kept. `formCandidatesScored`: the forms the chain's scorer ranked, and where that list was read
     * (`formCandidatesFrom`: the selection trace's ranking, or, where the selector refused before it returned a trace, the list it was handed).
     * `constraintAuthority` and `constraintCandidateIds`: whose authority the candidate constraints carried, and which they were.
     * `sizeRuleBypassed`: whether the TEST-ONLY bypass of the numerical size rule was in force. `selectionObservedOnly`: the wiring's
     * selection hook only observed (the build throws on a change). `draftStatus`: the build's own label for a build made from the draft store.
     * Stage W1 (a), 11 November 2026: `hintsGameProblemId` and `hintsGoverned`, the Game Problem that governed the lens hints and matched
     * signals and whether its Coverage row replaced the wording's candidates (null where the chain recorded none); `lensCandidateIds` and
     * `hintsSignals`, the lens candidates and matched signals of the hints the chain's selector was handed.
     */
    consumption?: {
        gameProblem: { gameProblemId: string; basis: string; label: string; source: string } | null
        form: { formId: string; standing: string; cells: Array<{ cell: string; grade: string }> } | null
        formCandidatesScored: string[]
        formCandidatesFrom: string
        constraintAuthority: string
        constraintCandidateIds: string[]
        sizeRuleBypassed: boolean
        hintsGameProblemId: string | null
        hintsGoverned: boolean | null
        lensCandidateIds: string[]
        hintsSignals: string[]
        /** Stage W1 (b): the review pathway's K2 result as the chain's account recorded it (its rule and limit carried), or null where a record governed. */
        reviewManipulations: { basis: string; set: string[]; rule: string; limit: string; cited: string } | null
        /** Stage W1 (c1): where the lens candidates came from (the governed hints, or Step 1's Coverage row under GP_COVERAGE_LENSES). */
        hintsLensesFrom: string
        /** Stage W2 (E3): present (true) only where the build's account records FOUNDATION_PRESENCE_BYPASS handed on. */
        foundationPresenceBypassed?: true
        /** True where the hook ran and only observed; null where it never ran (the selection returned nothing). */
        selectionObservedOnly: boolean | null
        draftStatus: string | null
    } | null
    /**
     * Present only on a run whose request carried `recordRoute` (the safeguards slice of stage 9): each constraint the chain built from the
     * record's authorized set, with the contracts it derived for it (matched by the chain's own knowledge key), so the lines a record-route
     * manipulation brings rest on its relationship stand-in. Empty where nothing was built.
     */
    recordSet?: Array<{ id: string; contractIds: string[] }>
    /**
     * What the reasoning-disconnection safeguards read beside the account (the safeguards slice of stage 9, DESIGN-9 section 3), read by the
     * wiring from the build on every request; never copied into the handoff's result, so no case's result or evidence changes. Null fields
     * where the build carries none: `constraintAuthority` (whose authority the candidate constraints carried) and `constraintGap` (the selection
     * gap), from the account's constraint source; `lensIds`, the engine's lenses by id; `contextInThisActivity`, the account's display of the
     * context's approved condition; `scoringCondition`, the requirement account's state for the approved condition (review builds only).
     */
    /** Stage B1: present only on a request carrying a PROPOSED configuration (`ChainReviewLevel`). */
    reviewLevel?: ChainReviewLevel
    observed?: {
        constraintAuthority: string | null
        constraintGap: string | null
        lensIds: string[]
        contextInThisActivity: boolean | null
        scoringCondition: { state: string; rowId: string | null; carried: boolean } | null
    }
}

/**
 * Stage B1 of the complete-activity package: the build's review-level account of a request carrying a PROPOSED configuration
 * (`ChainRequest.proposed`), read from the build (never from the request); absent elsewhere. Read by the tests only, never printed whole (a
 * pending finding is the guard's own sentence, which may hold a gendered pronoun).
 */
export interface ChainReviewLevel {
    status: string
    proposedElements: { contractId: string; treatmentId: string; items: Array<{ itemId: string; category: string; waitsOn: string | null }> }
    pendingApproval: Array<{ treatmentId: string; item: string; questionId: string | null; finding: string; blocks: string[] }>
    basis: Array<{ words: string; received: string }>
}

export interface HandoffChain {
    build(request: ChainRequest): ChainAnswer
}

// ---------------------------------------------------------------------------------------------------------------------------------------
// The grading map (OURS, DESIGN section 4.1), Christian's six classes in Christian's words
// ---------------------------------------------------------------------------------------------------------------------------------------

export const PREMISE_KINDS = [
    'RESTATED_ITEM',
    'KNOWLEDGE_RULING_ITEM',
    'ASSUMED_ITEM',
    'ENGINE_ONLY_ITEM',
    'DRAFT_ITEM',
    'ILLUSTRATIVE_ITEM',
    'PROPOSED_ITEM',
    'REALIZATION_ITEM',
    'STANDING_DECISION',
    'CASE_CHOICE_RULING',
    'CASE_CHOICE_ILLUSTRATIVE',
    'FILE_CHOICE_RULING',
    'FILE_CHOICE_OURS',
    'COACH',
    'ASSUMED_BOUND',
    'STAND_IN',
    'SESSION_ILLUSTRATIVE',
    'SESSION_COACH_INPUT',
    'LAWS_DEFAULT_PRINCIPLE',
    'LAWS_ENCODING',
    'LAW_DEPARTURE',
    'FORM_SELECTED',
    'FORM_ILLUSTRATIVE',
    'FORM_INFERENCE',
    'UNRESOLVED',
] as const
export type PremiseKind = (typeof PREMISE_KINDS)[number]

/**
 * Each kind of determining premise, the standing it is graded with (Christian's class follows from it through `sixClassOf`) and what is
 * printed for it. OURS (DESIGN section 4.1): never APPROVED for a restatement of ours, whatever its source's standing (printed beside it);
 * an ILLUSTRATIVE value never above class 5; a TEST-ONLY stand-in never above its declared label (class 4 or 5); the coach's choice claims
 * no class. `standing: null` claims none.
 */
export const GRADING_MAP: Record<PremiseKind, { standing: Standing | null; label: string; what: string }> = {
    RESTATED_ITEM: { standing: 'CANDIDATE', label: 'our restatement of {source}', what: 'a contract item we restated (basis AUTHORED) from a source; the source\'s own standing is printed beside it, never this item\'s' },
    KNOWLEDGE_RULING_ITEM: { standing: 'RULING', label: 'RULING', what: 'a knowledge item with basis OWNER_RULING (class 3 where the ruling is provisional)' },
    ASSUMED_ITEM: { standing: 'OURS', label: 'OURS: assumption in our restatement', what: 'a contract item with basis ASSUMED; what rests on it inherits it' },
    ENGINE_ONLY_ITEM: { standing: 'OURS', label: 'OURS: engine convention', what: 'a contract item with basis ENGINE_ONLY' },
    DRAFT_ITEM: { standing: 'CANDIDATE', label: 'DRAFT knowledge (ours, unreviewed)', what: 'an item of a DRAFT contract read from the TEST-ONLY draft store' },
    ILLUSTRATIVE_ITEM: { standing: 'ILLUSTRATIVE', label: `${VALUE_LABELS.ILLUSTRATIVE}: a TEST-ONLY carrier, not knowledge`, what: 'an item an ILLUSTRATIVE carrier treatment added to the draft store (category ILLUSTRATIVE, W4): graded by its category, never by its basis' },
    // Stage B1 (complete-activity package): graded OURS (class 6), the class of what needs Christian's confirmation, never above it.
    PROPOSED_ITEM: { standing: 'OURS', label: "PROPOSED: our proposal of new knowledge, for Christian's approval; not knowledge, not approved, not a ruling", what: 'an item of a PROPOSED configuration (category PROPOSED, stage B1): graded by its category, never by its basis' },
    REALIZATION_ITEM: { standing: 'RULING', label: 'RULING', what: 'an item of a provisional realization quoting Christian, graded by its ruling (class 3 where provisional)' },
    STANDING_DECISION: { standing: 'RULING', label: 'RULING', what: 'an engine standing decision that records a ruling of Christian\'s (the table is data, checked against the specification); one that records none is OURS: engine convention' },
    CASE_CHOICE_RULING: { standing: 'RULING', label: 'RULING', what: 'a choice the case supplies for an open line, on a ruling of Christian\'s (class 3 where provisional)' },
    CASE_CHOICE_ILLUSTRATIVE: { standing: 'ILLUSTRATIVE', label: VALUE_LABELS.ILLUSTRATIVE, what: 'a choice the case supplies for an open line, illustrative' },
    FILE_CHOICE_RULING: { standing: 'RULING', label: 'RULING', what: 'a choice from a realization-choices file whose entries quote Christian (class 3 where provisional)' },
    FILE_CHOICE_OURS: { standing: 'OURS', label: 'OURS: a realization choice of ours, not knowledge', what: 'a choice from a realization-choices file that says it is a realizer\'s input, not knowledge' },
    COACH: { standing: null, label: 'the coach decides', what: 'a line the chain leaves to the coach (closure COACH_DECIDES): no class claimed' },
    ASSUMED_BOUND: { standing: 'OURS', label: 'OURS: assumption in our restatement', what: 'the authored bound a justified default closes a line within, where that bound is ASSUMED' },
    STAND_IN: { standing: null, label: '{declared}', what: 'a TEST-ONLY stand-in item, graded by the label its input declares (ILLUSTRATIVE class 5, TEST ASSUMPTION class 4), never by the item\'s own basis' },
    SESSION_ILLUSTRATIVE: { standing: 'ILLUSTRATIVE', label: VALUE_LABELS.ILLUSTRATIVE, what: 'a session input entered offline' },
    SESSION_COACH_INPUT: { standing: 'RULING', label: 'coach input, within a ruled bound', what: 'a coach\'s session input within ruled testing boundaries: the bound\'s ruling gives the class' },
    LAWS_DEFAULT_PRINCIPLE: { standing: 'RULING', label: 'RULING', what: 'Christian\'s standing principle that the Laws apply by default' },
    LAWS_ENCODING: { standing: 'CANDIDATE', label: 'DRAFT: our per-law encoding', what: 'what each law requires here, as our DRAFT encoding says' },
    LAW_DEPARTURE: { standing: 'RULING', label: 'RULING', what: 'a departure from a law recorded on a provisional realization, by its ruling (class 3 where provisional)' },
    FORM_SELECTED: { standing: null, label: '{weakest of Step 2}', what: 'the form Step 2 SELECTED, graded by the weakest standing among what decided it' },
    FORM_ILLUSTRATIVE: { standing: 'ILLUSTRATIVE', label: VALUE_LABELS.ILLUSTRATIVE, what: 'a form the case names as illustrative, permitted by a filed ruling and checked among the compatible forms' },
    FORM_INFERENCE: { standing: 'OURS', label: VALUE_LABELS.OURS, what: 'a form the case names on our logical inference, checked among the compatible forms' },
    UNRESOLVED: { standing: 'UNRESOLVED', label: VALUE_LABELS.UNRESOLVED, what: 'a line no premise determines; the missing basis is named' },
}

export interface Premise {
    kind: PremiseKind
    ref: string
    standing: Standing | null
    provisional: boolean
    sixClass: SixClass | null
    label: string
    /** A restatement's source and that source's own standing, printed apart from the item's. */
    source?: string
    sourceStanding?: string
    note?: string
}

/** A premise built from its kind (the map), with its class computed by Christian's six classes. */
function premise(kind: PremiseKind, ref: string, opts: { provisional?: boolean; standing?: Standing; label?: string; source?: string; sourceStanding?: string; note?: string } = {}): Premise {
    const map = GRADING_MAP[kind]
    const standing = opts.standing ?? map.standing
    const provisional = opts.provisional === true
    const sixClass = standing === null ? null : sixClassOf([{ standing, provisional }])
    const base = opts.label ?? map.label
    const label = standing === 'RULING' && provisional && !opts.label ? premiseStandingLabel({ standing, provisional }) : base
    const out: Premise = { kind, ref, standing, provisional, sixClass, label }
    if (opts.source !== undefined) out.source = opts.source
    if (opts.sourceStanding !== undefined) out.sourceStanding = opts.sourceStanding
    if (opts.note !== undefined) out.note = opts.note
    return out
}

/** The six classes with Christian's words, for the report. */
export const CLASS_WORDS: string[] = SIX_CLASSES.map((words, i) => `class ${i + 1}: ${words}`)

/** Printed on every configuration (DESIGN section 3.2 item 6). */
export const OPPORTUNITIES_NOT_ESTABLISHED = 'Productive, recurring opportunities to meet the intended Game Problem: not established (no approved relationship ties a Game Problem to any line)'

// ---------------------------------------------------------------------------------------------------------------------------------------
// Decision kinds A, B and C (Christian's reply of 7 November, section 8): OURS, for Christian's review
// ---------------------------------------------------------------------------------------------------------------------------------------

export const DECISION_KINDS = ['A', 'B', 'C'] as const
export type DecisionKind = (typeof DECISION_KINDS)[number]

/** The rule, printed in the report (DESIGN section 4.3; R6 section 2.2 item 6). OURS. */
export const DECISION_KIND_RULE = [
    'A where choosing differently, within what the form and the Laws permit, would materially change the affordance landscape, opposition, scoring consequences, challenge or representative information: here, a line chosen among alternatives, a default that has an alternative, a law departed from, or a value carried by a stand-in;',
    'B where the value is entailed by the selected form, the Sport Profile, an engine standing decision or the Laws\' default, or is a necessary adaptation (still scrutinized, never exempt);',
    'C where several values are admissible and none changes the above: here, a line the chain leaves to the coach; any functional bound on it stays B;',
    'session players, dimensions and duration are contextual A by the case\'s overrides; a line nothing establishes is no configuration value and has no kind.',
]

/**
 * The examination Christian asked for (Christian's reply of 7 November, section 8: whether the existing knowledge and configuration structures can
 * distinguish the three kinds without another library or architectural layer), as the report prints it. OURS, for Christian's review.
 */
export const DECISION_KIND_EXAMINATION = [
    'What the existing structures already mark, per line: where a value may come from (the register\'s source kinds and fill permissions); its authority (Christian\'s six classes; a contract item\'s basis); how binding it is (strictness, value status, a derived line\'s strength); who decides it (the chain\'s coach-decided closure; a record\'s authorized adjustments); what the coach must be told (the overview essentials table); and, for the Laws only, whether an owed adaptation is material (our DRAFT classification).',
    'None of them alone separates the three kinds: a coach-adjustable line can be learning-governing, a structurally checked part can be learning-governing, a material law adaptation merges meaning with structural validity, and the illustrative class holds all three kinds.',
    'What suffices without a new library or layer: one field in the handoff\'s output (each line\'s kind, computed by the rule above from the markers the chain already writes) and per-case overrides in the review data where the boundary is contextual. Routine choices (bib colours, spare balls, marking equipment, the coach\'s position, delivery details) are not configuration values here: the handoff holds no value, no ruling and no line for them, and leaves them to the coach.',
]

// ---------------------------------------------------------------------------------------------------------------------------------------
// The result
// ---------------------------------------------------------------------------------------------------------------------------------------

export interface GradedLine {
    lineId: string
    path: string
    kind: ChainLine['kind']
    value: unknown
    premises: Premise[]
    sixClass: SixClass | null
    label: string
    decisionKind: DecisionKind | null
    decisionKindContextual: boolean
    note: string | null
}

export interface GradedSentence {
    section: string
    block: string | null
    text: string
    status: string
    wording: string
    reviewOnly: boolean
    from: string[]
    joined: string[]
    /** Paths that join a line only through the element the line belongs to (the element's establishing item). */
    throughElement: string[]
    unjoined: string[]
    sixClass: SixClass | null
    label: string
    otherLabels: string[]
}

/**
 * What a refusal rests on, for Christian's second reply of 7 November, section 2 ("A check based solely on a candidate interpretation may
 * conservatively refuse a configuration without establishing that the configuration violates approved knowledge."). OURS, computed from the
 * refusal's own reasons and from the chain's own account behind a refusal met before any game exists (each failing check's own result, each
 * owed line's classification and the chain's reach of each declaration it was decided over, each open line's bounding items): each line or
 * element they cite is read back to the item that establishes its element, or, for an open line refused for being outside its permitted set (a
 * reason saying the value is not one of the permitted alternatives) whose bounding items the chain names, to those items (the element's item
 * named as not bounding it), and that item's basis and class are printed, with its source and that source's standing; a cited owed line
 * prints the requirement declarations that reach its element (`owedBy`); a cited owed line that no requirement declaration among those it was
 * decided over reaches (the chain's own reach of the line's element class and the chain's own scope rule, `REQUIREMENT_DECLARATIONS`,
 * `reachesTheElement`) is listed apart as a line nobody established (a gap). The verdict is computed
 * over the cited items: RESTATEMENT-ONLY where every cited item is ours and unreviewed (a restated contract item, a DRAFT store item, or an
 * ASSUMED item or bound), with no ruling of Christian's among them; MIXED where at least one cited item rests on a ruling of Christian's; NOT
 * KNOWLEDGE where the refusal cites no item (a missing contract, a missing choices file, an engine check or rule, or only lines nobody
 * established; said which). The basis mix is printed with every verdict. It changes no check.
 */
export interface RefusalBasis {
    stage: string
    codes: string[]
    /**
     * Each line or element cited, read back to the item that establishes its element, or, for an open line refused for being outside its
     * permitted set (a reason saying the value is not one of the permitted alternatives) whose bounding items the chain names, to each of those
     * items (`elementNotBounding` then names the element's item, which does not bound the line), with that item's basis, its grading and class,
     * its source and the source's standing, where the citation was found (a reason, a failing check's own result, or the chain's own account of
     * the open line), the chain's own classification of the line where the chain gives one, and, for an owed line, which requirement
     * declarations reach its element (`owedBy`; OURS, read from the chain's reach and scope rule).
     */
    cited: Array<{ ref: string; contractId: string; itemId: string; basis: string; origin: string; premiseKind: PremiseKind; label: string; sixClass: SixClass | null; note: string | null; source: string | null; sourceStanding: string | null; via: string; chainReading: string | null; owedBy: string | null; elementNotBounding: string | null }>
    /** Cited owed lines no requirement declaration reaches (see above), each with the chain's reading and its element's item; listed after the verdict. */
    gaps: Array<{ ref: string; why: string; element: string }>
    verdict: 'RESTATEMENT-ONLY' | 'MIXED' | 'NOT KNOWLEDGE'
    why: string
    /** The cited items counted by basis and grading, e.g. '2 AUTHORED (DRAFT store item)'; 'none' where nothing is cited. */
    mix: string
}

/**
 * Items a test typed itself on a TEST-ONLY realization in the words of one of Christian's rulings, to be graded in a refusal reading by
 * Christian's own label for what they type (here 'ILLUSTRATIVE', where the ruling's words say so; the test checks that), not by the basis
 * the realization gate requires such items to carry. The gate's typing is not changed.
 */
export interface LabelledItems {
    contractId: string
    itemIds: string[]
    rulingRef: string
    label: 'ILLUSTRATIVE'
    why: string
}

export interface HandoffResult {
    caseId: string
    label: string
    resultStanding: string
    goalId: string | null
    receive: {
        step1: null | {
            status: string
            basis: string | null
            primary: string[]
            secondary: string[]
            contextId: string | null
            scope: string | null
            qualifier: string | null
            /**
             * The ruling whose words hold the qualifier word for word, with its received date (and, for a reply pasted without its mail header,
             * its date basis and the name a citation gives it: `DatedEntry`); null where the case names none or they differ.
             */
            qualifierRuling: ({ ref: string; received: string } & DatedEntry) | null
            establishedBy: string
            missing: string[]
        }
        step2: null | { status: string; selected: string | null; compatible: string[]; preference: string; missing: string[] }
        scopeSetBy: string[]
    }
    form: {
        decision: 'SELECTED_BY_STEP_2' | 'NAMED' | 'STRUCTURAL_CASE' | 'STOP'
        formId: string | null
        premise: Premise | null
        why: string
        alternativesRetained: string[]
        stop: string | null
    }
    manipulations: Array<{ id: string; purpose: string; manipulation: string; outcome: string; premise: Premise | null; placedContracts: string[] }>
    proposedChoices: Array<{ id: string; lineId: string; value: unknown; applied: boolean; outcome: string }>
    chain: null | {
        outcome: string
        stage: string | null
        summary: string | null
        reasons: string[]
        scorerPick: string | null
        contextComparison: string
        gameProblemComparison: string
        /** Where the case put a TEST-ONLY Game Problem into the record: the difference from Step 1, reported, never switched; else null. */
        gameProblemOverride: string | null
        affordanceLenses: string
        constraints: string[]
        fidelityViolations: number | null
    }
    lines: GradedLine[]
    sentences: GradedSentence[]
    sentencesServed: boolean | null
    withheld: Array<{ path: string; reason: string }>
    laws: ChainAnswer['laws']
    lawEntries: Array<{ lineId: string; law: string; status: string; removedByRealization: boolean }>
    requirementAccount: ChainAnswer['requirementAccount']
    diagram: ChainAnswer['diagram']
    refusal: { stage: string; reasons: string[] } | null
    /** What a refusal rests on (Christian's second reply of 7 November, section 2), computed by `refusalBasisOf`; null where nothing refused. */
    refusalBasis: RefusalBasis | null
    gaps: string[]
    purpose: null | { sourceEvidence: string; approvalEvidence: string; rulingRefs: string[] }
    rulings: Array<{ ref: string; entersAs: EntersAs; how: string; words: string[]; received: string; provisional: boolean; scope: string | null } & DatedEntry>
    illustrative: CaseInput['illustrative']
    testOnlyTreatments: TreatmentInput[]
    standIns: Array<{ id: string; label: string; why: string; determines: string[] }>
    notCarried: CaseInput['notCarried']
    /** The case's notes, with each quotation resolved to Christian's words and received date (with the date basis, `DatedEntry`, where marked). */
    reportNotes: Array<{ section: CaseNote['section']; text: string; quotes: Array<{ ref: string; words: string; received: string } & DatedEntry> }>
    opportunities: string
    counts: { lines: number; byClass: Record<string, number>; byKind: Record<string, number>; sentences: number }
    /**
     * Present only on a run whose case declares CONSUMED_STEPS (stage 9): what the chain recorded it consumed (`ChainAnswer.consumption`), the
     * items of the TEST-ONLY draft store that entered derivation (`draftItemsDerived`, each 'contract item', read from the contracts the chain
     * derived from; empty where the run stopped before derivation), and each line of the built game that the chain records a draft item as
     * shaping (`draftShaped`: the line, its value, and each 'contract item relation'). Null where the chain's account recorded no consumption
     * (a refusal before the selection returned anything): that absence is itself printed.
     */
    consumption?: (NonNullable<ChainAnswer['consumption']> & { draftItemsDerived: string[]; draftShaped: Array<{ lineId: string; value: unknown; by: string[] }>; illustrativeItemsDerived?: string[] }) | null
}

// ---------------------------------------------------------------------------------------------------------------------------------------
// Receive and Determine the form
// ---------------------------------------------------------------------------------------------------------------------------------------

const rulingOf = (inputs: HandoffInputs, id: string): HandoffRuling => {
    const r = inputs.rulings.find((x) => x.id === id)
    if (!r) throw new Error(`handoff: no ruling ${id}`)
    return r
}
/** Christian's words with their received date, as a `because` or a citation reads them. */
const citedWords = (r: HandoffRuling): string => `Christian, ${citedDateOf(r)}${r.provisional ? ' (provisional)' : ''}: ${r.words.map((w) => `"${w}"`).join(' ')}`
const citedAs = (r: HandoffRuling): string => (r.dateBasis ? `Christian's ${citedDateOf(r)}` : `Christian's reply received ${receivedOf(r)}`)

function receiveStep1(result: Stage1Result | null, c: CaseInput, inputs: HandoffInputs): HandoffResult['receive'] {
    if (!result) return { step1: null, step2: null, scopeSetBy: [] }
    const r = result.resolution
    const g = result.gameForm
    const qualifier = r.gameProblems.qualifier
    const holder = c.qualifierRulingRef ? rulingOf(inputs, c.qualifierRulingRef) : null
    return {
        step1: {
            status: r.status,
            basis: r.gameProblems.basis,
            primary: [...r.gameProblems.primary],
            secondary: [...r.gameProblems.secondary],
            contextId: r.context?.rpcId ?? null,
            scope: r.gameProblems.scope,
            qualifier,
            qualifierRuling: qualifier && holder && holder.words.some((w) => w.indexOf(qualifier) >= 0) ? { ref: holder.id, received: receivedOf(holder), ...datedEntryOf(holder) } : null,
            establishedBy: r.gameProblems.establishedBy,
            missing: r.missing.map((m) => JSON.stringify(m)),
        },
        step2: { status: g.status, selected: g.selected, compatible: [...g.compatible], preference: g.preference?.status ?? 'NONE', missing: g.missing.map((m) => JSON.stringify(m)) },
        scopeSetBy: [],
    }
}

function determineForm(c: CaseInput, s1: Stage1Result | null, inputs: HandoffInputs): HandoffResult['form'] {
    const stop = (why: string, retained: string[] = []): HandoffResult['form'] => ({ decision: 'STOP', formId: null, premise: null, why, alternativesRetained: retained, stop: why })
    if (!s1) {
        const named = c.form as NamedForm
        return {
            decision: 'STRUCTURAL_CASE',
            formId: named.named,
            premise: premise('FORM_ILLUSTRATIVE', `${named.named} (structural case, no Learning Goal)`, { note: named.why }),
            why: named.why,
            alternativesRetained: [],
            stop: null,
        }
    }
    const r = s1.resolution
    const g = s1.gameForm
    if (r.status !== 'RESOLVED') return stop(`Step 1 is ${r.status}: ${r.missing.map((m) => m.kind).join(', ') || 'nothing resolved'}; no form is placed`)
    if ('fromStep2' in c.form) {
        if (g.status === 'SELECTED' && g.selected) {
            const decisive = g.trace.influencedBy.map((i) => ({ standing: i.standing, provisional: false }))
            const weakest = weakestStanding(g.trace)
            const p = premise('FORM_SELECTED', `Step 2 SELECTED ${g.selected}`, { standing: weakest ?? 'UNRESOLVED', label: weakest ?? VALUE_LABELS.UNRESOLVED, note: g.statement })
            p.sixClass = sixClassOf(decisive)
            return { decision: 'SELECTED_BY_STEP_2', formId: g.selected, premise: p, why: g.statement, alternativesRetained: [], stop: null }
        }
        if (g.status === 'COMPATIBLE_ALTERNATIVES') return stop('alternatives retained; no basis to select', [...g.compatible])
        return stop(`Step 2 is ${g.status}: ${g.missing.map((m) => m.kind).join(', ') || 'no form'}`, [...g.compatible])
    }
    const named = c.form as NamedForm
    if (g.status !== 'COMPATIBLE_ALTERNATIVES' && g.status !== 'SELECTED') return stop(`Step 2 is ${g.status}: a named form cannot be checked against compatible forms`, [...g.compatible])
    if (g.compatible.indexOf(named.named) < 0) return stop(`the named form ${named.named} is not among the compatible forms (${g.compatible.join(', ') || 'none'})`, [...g.compatible])
    for (const ref of named.rulingRefs) rulingOf(inputs, ref)
    const p =
        named.basis === 'ILLUSTRATIVE'
            ? premise('FORM_ILLUSTRATIVE', `${named.named}, permitted by ${named.rulingRefs.join(', ')}`, { note: named.why })
            : premise('FORM_INFERENCE', `${named.named}: ${named.why}`)
    return { decision: 'NAMED', formId: named.named, premise: p, why: named.why, alternativesRetained: g.compatible.filter((f) => f !== named.named), stop: null }
}

// ---------------------------------------------------------------------------------------------------------------------------------------
// Produce: the chain request
// ---------------------------------------------------------------------------------------------------------------------------------------

function chainRequest(c: CaseInput, s1: Stage1Result | null, formId: string, inputs: HandoffInputs, place: ChainRequest['place']): ChainRequest {
    const contextId = s1?.resolution.context?.rpcId ?? null
    let records: ChainRequest['records'] = 'PRODUCTION'
    if (c.chain.records === 'TEST_ONLY') {
        if (!s1 || !c.record || !contextId) throw new Error(`case ${c.id}: a TEST-ONLY record needs Step 1's context and the case's record inputs`)
        const words = c.record.rulingRefs.flatMap((ref) => rulingOf(inputs, ref).words)
        const dated = c.record.rulingRefs.map((ref) => rulingOf(inputs, ref).received).sort()
        records = {
            learningGoalId: c.goalId as string,
            contextId,
            // Step 1's primary, unless the case puts a TEST-ONLY Game Problem here (Tests B); no line of the chain reads it either way.
            gameProblemId: c.gameProblemOverride ? c.gameProblemOverride.id : (s1.resolution.gameProblems.primary[0] ?? ''),
            ruledOn: dated[dated.length - 1],
            by: c.record.by,
            ruling: words,
            // Exactly the record's own set: the handoff never widens it (an applied manipulation is placed in the selection, `place`).
            authorizedConstraints: [...c.record.authorizedConstraints],
            authorizedConstraintsFinding: c.record.constraintFinding,
            provisionalRealization: c.realization ? c.realization.id : null,
        }
    }
    let realization: ChainRequest['realization'] = null
    if (c.realization) {
        if (!contextId) throw new Error(`case ${c.id}: a realization needs Step 1's context`)
        const rs = c.realization.rulingRefs.map((ref) => rulingOf(inputs, ref))
        const latest = [...rs].sort((a, b) => a.received.localeCompare(b.received))[rs.length - 1]
        const check = c.realization.lawsCheck
        const checkRulings = check.rulingRefs.map((ref) => rulingOf(inputs, ref))
        realization = {
            id: c.realization.id,
            realizes: contextId,
            ruledOn: latest.received,
            by: c.realization.by,
            citedAs: rs.map(citedAs).join('; '),
            words: rs.flatMap((r) => r.words),
            departures: c.realization.departures.map((d) => {
                const ds = d.rulingRefs.map((ref) => rulingOf(inputs, ref))
                return { law: d.law, extent: d.extent, because: d.because, words: ds.flatMap((r) => r.words), citedAs: ds.map(citedAs).join('; ') }
            }),
            lawsCheck: { mode: check.mode, because: check.because, words: checkRulings.flatMap((r) => r.words), citedAs: checkRulings.map(citedAs).join('; ') },
        }
    }
    const withhold = c.testOnlyTreatments.filter((t) => t.kind === 'WITHHOLD_ITEMS').map((t) => ({ contractId: t.contractId as string, itemIds: [...(t.itemIds as string[])], treatmentId: t.id }))
    // Stage 9: the treatments that act on the request, each only where the case declares it.
    const replaceDeclarations = c.testOnlyTreatments
        .filter((t) => t.kind === 'REPLACE_DECLARATION' && t.declaration)
        .map((t) => {
            const d = t.declaration as NonNullable<TreatmentInput['declaration']>
            return { contractId: t.contractId as string, row: d.row, selector: d.selector, from: d.from, to: d.to, qualifier: d.qualifier ?? null, treatmentId: t.id }
        })
    const lawsTreatment = c.testOnlyTreatments.find((t) => t.kind === 'LAWS_CLASSIFICATION')
    // W4 (foundational package): each ILLUSTRATIVE carrier treatment, in the case's order, with its file and groups.
    const illustrative = c.testOnlyTreatments.filter((t) => t.kind === 'ILLUSTRATIVE_CARRIERS' && t.carriers).map((t) => ({ file: t.carriers!.file, groups: [...t.carriers!.groups], treatmentId: t.id }))
    // Stage B1 (complete-activity package): the PROPOSED configuration, where the case declares it, with the ruling words it is put under.
    const proposedTreatment = c.testOnlyTreatments.find((t) => t.kind === 'PROPOSED_CONFIGURATION' && t.proposed)
    const pendingTreatment = c.testOnlyTreatments.find((t) => t.kind === 'PROPOSED_PENDING')
    const proposed: ChainRequest['proposed'] = proposedTreatment
        ? (() => {
              const r = rulingOf(inputs, proposedTreatment.proposed!.basis.rulingRef)
              return {
                  file: proposedTreatment.proposed!.file,
                  treatmentId: proposedTreatment.id,
                  pendingTreatmentId: pendingTreatment ? pendingTreatment.id : null,
                  basis: proposedTreatment.proposed!.basis.words.map((n) => ({ words: r.words[n], received: r.received })),
                  // Stage B2: the configuration's PROPOSED departures from the Laws, only where the treatment carries them.
                  ...(proposedTreatment.proposed!.lawDepartures === true ? { lawDepartures: true as const } : {}),
              }
          })()
        : undefined
    // Stage B2 (complete-activity package): our CANDIDATE wording, where the case declares it.
    const wordingTreatment = c.testOnlyTreatments.find((t) => t.kind === 'CANDIDATE_WORDING' && t.wording)
    let consume: ChainRequest['consume'] | undefined
    if (c.testOnlyTreatments.some((t) => t.kind === 'CONSUMED_STEPS')) {
        const g = s1?.gameForm
        const gp = s1?.resolution.gameProblems
        if (!s1 || !g || !gp || g.status !== 'SELECTED' || g.selected !== formId || !gp.primary.length || !gp.basis)
            throw new Error(`case ${c.id}: CONSUMED_STEPS hands the chain Step 1's resolved primary Game Problem and Step 2's SELECTED form, and this run has not both (Step 2 ${g ? g.status : 'not run'})`)
        consume = {
            gameProblem: { gameProblemId: gp.primary[0], basis: gp.basis, label: 'as resolved by Step 1 (review pathway)' },
            gameForm: { formId, standing: g.statement, cells: g.trace.influencedBy.map((i) => ({ cell: i.ref, grade: i.standing })) },
            // The safeguards slice: the numerical size rule bypassed, only where the case declares it.
            ...(c.testOnlyTreatments.some((t) => t.kind === 'SIZE_RULE_BYPASS') ? { sizeRuleBypass: true as const } : {}),
            // Stage W1 (c1): the Coverage-row lenses, only where the case declares them.
            ...(c.testOnlyTreatments.some((t) => t.kind === 'GP_COVERAGE_LENSES') ? { coverageLenses: true as const } : {}),
            // Stage W2 (E3): foundation presence bypassed, only where the case declares it (the validator holds it beside the switch).
            ...(c.testOnlyTreatments.some((t) => t.kind === 'FOUNDATION_PRESENCE_BYPASS') ? { foundationPresenceBypass: true as const } : {}),
        }
        // Stage W1 (b): K2's result in place of a per-goal record, only where the case declares it: the empty set and K2's words, as data.
        const k2 = c.testOnlyTreatments.find((t) => t.kind === 'K2_RETAIN_FORM')
        if (k2 && k2.k2) {
            const r = rulingOf(inputs, k2.k2.rulingRef)
            consume.k2 = { basis: 'K2_REVIEW_ONLY', set: [], rulingRef: r.id, rule: r.words[k2.k2.rule], limit: r.words[k2.k2.limit], cited: `${r.id}, ${citedDateOf(r)}`, treatmentId: k2.id }
        }
    } else if (c.testOnlyTreatments.some((t) => t.kind === 'K2_RETAIN_FORM')) {
        throw new Error(`case ${c.id}: K2_RETAIN_FORM hands K2's result only to a run that consumes Steps 1 and 2`)
    }
    // The safeguards slice: the manipulations that enter by the record route (never placed), held by the wiring to the record consulted.
    const recordRoute = c.proposedManipulations.filter((m) => m.entersBy === 'RECORD').map((m) => m.manipulation)
    const choices = c.suppliedChoices.map((ch) => ({
        lineId: ch.lineId,
        value: ch.value,
        because: ch.rulingRef ? citedWords(rulingOf(inputs, ch.rulingRef)) : `${VALUE_LABELS.ILLUSTRATIVE}: chosen among the alternatives our restatement of the form lists (CANDIDATE), for this case only`,
    }))
    return {
        caseId: c.id,
        goalId: c.goalId,
        vehicle: c.chain.vehicle ? deepCopy(c.chain.vehicle) : null,
        session: deepCopy(c.session),
        formId,
        contextId,
        records,
        realization,
        draftStore: c.chain.draftStore,
        withhold,
        standIns: c.standIns.map((s) => ({ contractId: s.contractId, item: deepCopy(s.item) })),
        choices,
        place: place.map((p) => ({ ...p })),
        supplement: c.chain.supplement,
        holdReportedLawsToMateriality: c.realization?.lawsCheck.mode === 'REPORT',
        ...(consume ? { consume } : {}),
        ...(recordRoute.length ? { recordRoute } : {}),
        ...(replaceDeclarations.length ? { replaceDeclarations } : {}),
        ...(lawsTreatment ? { laws: { standIn: lawsTreatment.standIn ? { ...lawsTreatment.standIn } : null, treatmentId: lawsTreatment.id } } : {}),
        ...(illustrative.length ? { illustrative } : {}),
        ...(proposed ? { proposed } : {}),
        // The recorded rulings travel with it: the wording's gate holds every quote of Christian's to them (verbatim, with the received date).
        ...(wordingTreatment ? { candidateWording: { file: wordingTreatment.wording!.file, treatmentId: wordingTreatment.id, rulings: inputs.rulings.map((r) => ({ id: r.id, words: [...r.words], received: r.received })) } } : {}),
    }
}

// ---------------------------------------------------------------------------------------------------------------------------------------
// Preserve: grade every line and sentence
// ---------------------------------------------------------------------------------------------------------------------------------------

interface GradingContext {
    c: CaseInput
    inputs: HandoffInputs
    answer: ChainAnswer
    standInByItem: Map<string, StandInInput>
    standInByTerm: Map<string, StandInInput>
    /** Each contract the chain derived from for a placed manipulation, with the manipulation and the relationship it was applied on. */
    relationshipByContract: Map<string, ProposedManipulation & { relationship: NonNullable<ProposedManipulation['relationship']> }>
    /** Items a test typed itself, graded by Christian's own label for what they type (see `LabelledItems`); none in a case's own run. */
    labelled: LabelledItems[]
}

/** The contracts a line belongs to: what supports it, the element class it names, and the class its own id names. */
function lineContracts(line: ChainLine): string[] {
    const out: string[] = []
    for (const s of line.support ?? []) if (s.contractId) out.push(s.contractId)
    const own = classParts(line.lineId.split('::')[0])
    if (own) out.push(own.contractId)
    const cls = line.classId ? classParts(line.classId) : null
    if (cls) out.push(cls.contractId)
    return [...new Set(out)]
}

/** A value inside a premise's reference: a word in single quotation marks (double ones are kept for Christian's words), anything else as is. */
const valueWords = (v: unknown): string => (typeof v === 'string' ? `'${v}'` : JSON.stringify(v))

/** An element class id as the chain writes it, `c:<contract id>:<item id>`, read into its contract and item (no handle is read). */
function classParts(classId: string): { contractId: string; itemId: string } | null {
    if (classId.slice(0, 2) !== 'c:') return null
    const rest = classId.slice(2)
    const cut = rest.lastIndexOf(':')
    if (cut <= 0) return null
    return { contractId: rest.slice(0, cut), itemId: rest.slice(cut + 1) }
}

/** The premise an item of a contract the chain derived from is graded by. */
function itemPremise(ctx: GradingContext, contractId: string, itemId: string): Premise {
    const ref = `${contractId} ${itemId}`
    const standIn = ctx.standInByItem.get(itemId)
    if (standIn && standIn.contractId === contractId) {
        return premise('STAND_IN', `${ref} (TEST-ONLY stand-in ${standIn.id})`, { standing: standIn.label, label: standIn.label === 'ILLUSTRATIVE' ? VALUE_LABELS.ILLUSTRATIVE : standIn.label, note: standIn.why })
    }
    const contract = ctx.answer.contracts.find((x) => x.contractId === contractId)
    const item = contract?.items.find((x) => x.itemId === itemId)
    if (!contract || !item) return premise('UNRESOLVED', `${ref}: the item is not among the contracts the chain derived from`)
    const cited = sourcesCited(ctx, item.basisEvidence)
    // W4 (foundational package): an ILLUSTRATIVE carrier is graded by its category before anything else (never as a draft restatement).
    if (item.category === 'ILLUSTRATIVE') return premise('ILLUSTRATIVE_ITEM', ref)
    // Stage B1 (complete-activity package): a PROPOSED item likewise, by its category, never as a realization in Christian's words.
    if (item.category === 'PROPOSED') return premise('PROPOSED_ITEM', ref)
    if (contract.origin === 'DRAFT_STORE') return premise('DRAFT_ITEM', ref, cited)
    const labelled = ctx.labelled.find((l) => l.contractId === contractId && l.itemIds.indexOf(itemId) >= 0)
    if (labelled) {
        const r = rulingOf(ctx.inputs, labelled.rulingRef)
        return premise('REALIZATION_ITEM', ref, {
            standing: 'ILLUSTRATIVE',
            label: VALUE_LABELS.ILLUSTRATIVE,
            note: `Christian's own label for what these items type is illustrative (${r.id}, ${citedDateOf(r)}); ${labelled.why}; the realization gate types such items ${item.basis} only because a provisional realization's items must carry that basis, and that typing is not changed`,
        })
    }
    if (contract.origin === 'REALIZATION') {
        const ownRealization = ctx.c.realization && contractId.endsWith(`:${ctx.c.realization.id}`)
        return premise('REALIZATION_ITEM', ref, { provisional: true, note: ownRealization ? 'a TEST-ONLY realization of this case, in Christian\'s words' : 'a production provisional realization, in Christian\'s words' })
    }
    if (item.basis === 'ASSUMED') return premise('ASSUMED_ITEM', ref, cited)
    if (item.basis === 'ENGINE_ONLY') return premise('ENGINE_ONLY_ITEM', ref)
    // Which ruling: the item's own evidence, verbatim (never parsed), and a provisional flag only where the item records one.
    if (item.basis === 'OWNER_RULING') return premise('KNOWLEDGE_RULING_ITEM', ref, { provisional: item.provisional === true, note: item.evidenceWithheld ? `the item's evidence is not printed here: ${item.evidenceWithheld}` : `the item's evidence, verbatim: ${item.basisEvidence}` })
    if (item.basis === 'AUTHORED') return premise('RESTATED_ITEM', ref, { label: cited.sourceStanding === 'not recorded' ? `our restatement: ${cited.source}` : `our restatement of ${cited.source}`, ...cited })
    return premise('UNRESOLVED', `${ref}: basis ${item.basis} has no reading in the grading map`)
}

/**
 * The sources an item's evidence cites, read from the grading table's markers (a file name, or a row prefix the source alone uses), each with
 * its own standing; where the evidence cites none the table knows, it says so rather than guessing one.
 */
function sourcesCited(ctx: GradingContext, evidence: string): { source: string; sourceStanding: string } {
    const found = ctx.inputs.grading.sources.filter((s) => s.markers.some((m) => evidence.indexOf(m) >= 0))
    if (!found.length) return { source: 'an item whose evidence names no source in our standing table', sourceStanding: 'not recorded' }
    return { source: found.map((s) => s.source).join(' and '), sourceStanding: found.map((s) => s.sourceStanding).join('; ') }
}

function standingDecisionPremise(ctx: GradingContext, id: string): Premise {
    const row = ctx.inputs.grading.standingDecisions.find((x) => x.id === id)
    if (!row) throw new Error(`handoff grading: the standing decision ${id} is not in the grading table (fail closed: add it, checked against the specification)`)
    return premise('STANDING_DECISION', `${id} (records ${row.reference})`, { provisional: row.provisional })
}

function sessionPremise(ctx: GradingContext, what: string): Premise {
    const s = ctx.c.session
    if (s.label === 'COACH_INPUT') {
        const rs = s.rulingRefs.map((ref) => rulingOf(ctx.inputs, ref))
        const provisional = rs.some((r) => r.provisional)
        return premise('SESSION_COACH_INPUT', `session input: ${what}, within ${s.rulingRefs.join(', ')}`, { provisional, label: `coach input, within a ruled bound (RULING${provisional ? ', provisional' : ''})` })
    }
    return premise('SESSION_ILLUSTRATIVE', `session input: ${what}`)
}

function linePremises(ctx: GradingContext, line: ChainLine): { premises: Premise[]; note: string | null } {
    const premises: Premise[] = []
    let note: string | null = null
    if (line.kind === 'DERIVED') {
        for (const s of line.support ?? []) {
            if (s.kind === 'CONTRACT_ITEM' && s.contractId && s.itemId) premises.push(itemPremise(ctx, s.contractId, s.itemId))
            else if (s.kind === 'STANDING_DECISION' && s.id) premises.push(standingDecisionPremise(ctx, s.id))
            else if (s.kind === 'SESSION') premises.push(sessionPremise(ctx, `${s.row ?? 'the session'} = ${valueWords(line.value)}`))
            else premises.push(premise('UNRESOLVED', `support of kind ${s.kind} has no reading in the grading map`))
        }
        // The item the line's position is stated relative to, as the chain names it (its relation's `of`): graded as any item is.
        if (line.relationOf) premises.push(itemPremise(ctx, line.relationOf.contractId, line.relationOf.itemId))
        if (line.extentTerm) {
            const standIn = ctx.standInByTerm.get(line.extentTerm)
            if (standIn) premises.push(premise('STAND_IN', `${standIn.contractId} ${standIn.item.itemId} (TEST-ONLY stand-in ${standIn.id}): the extent`, { standing: standIn.label, label: standIn.label === 'ILLUSTRATIVE' ? VALUE_LABELS.ILLUSTRATIVE : standIn.label, note: standIn.why }))
            else note = `its extent is bounded by the term '${line.extentTerm}'; the chain does not name the item it comes from, so the extent is not graded here`
        }
        if (line.strength === 'DEFAULT') note = `${note ? `${note}; ` : ''}a default (an alternative exists)`
    } else if (line.kind === 'CHOICE') {
        if (line.closure === 'COACH_DECIDES') premises.push(premise('COACH', `${line.lineId}: the coach decides`))
        else if (line.defaultedBy) {
            premises.push(premise(line.assumedBound ? 'ASSUMED_BOUND' : 'RESTATED_ITEM', `the one value the line's authored bound admits${line.assumedBound ? ', a bound ASSUMED in our restatement' : ''}, closed by the justified-default rule ${line.defaultedBy}`, line.assumedBound ? {} : { label: 'our restatement (the authored bound)' }))
            note = `a justified default (${line.defaultedBy})${line.assumedBound ? ', resting on an ASSUMED bound' : ''}`
        } else if (line.chosenBy && 'case' in line.chosenBy) {
            const supplied = ctx.c.suppliedChoices.find((x) => x.lineId === line.lineId)
            if (!supplied) premises.push(premise('UNRESOLVED', `${line.lineId}: chosen by the case, and the case lists no such choice`))
            else if (supplied.standing === 'RULING') premises.push(premise('CASE_CHOICE_RULING', `${line.lineId} = ${valueWords(line.value)} on ${supplied.rulingRef}`, { provisional: supplied.provisional }))
            else premises.push(premise('CASE_CHOICE_ILLUSTRATIVE', `${line.lineId} = ${valueWords(line.value)} (the case's illustrative choice)`))
        } else if (line.chosenBy && 'file' in line.chosenBy) {
            const file = line.chosenBy.file
            const row = ctx.inputs.grading.choiceFiles.find((x) => x.file === file)
            if (!row) throw new Error(`handoff grading: the realization-choices file ${file} is not in the grading table`)
            premises.push(row.standing === 'RULING' ? premise('FILE_CHOICE_RULING', `${file}: ${line.lineId}`, { provisional: row.provisional === true }) : premise('FILE_CHOICE_OURS', `${file}: ${line.lineId}`, { note: row.why }))
        } else premises.push(premise('UNRESOLVED', `${line.lineId}: chosen, and the chain did not say by whom`))
    } else if (line.kind === 'NOT_ESTABLISHED') {
        premises.push(premise('UNRESOLVED', `${line.lineId}: nothing establishes it (${line.reason ?? 'no reason given'})`))
    } else if (line.kind === 'ENTAILED' || line.kind === 'INSTANTIATION') {
        const parts = line.classId ? classParts(line.classId) : null
        if (parts) premises.push(itemPremise(ctx, parts.contractId, parts.itemId))
        if (line.kind === 'ENTAILED') premises.push(sessionPremise(ctx, `players = ${ctx.c.session.players}`))
        note = line.kind === 'ENTAILED' ? `entailed by the chain: ${String(line.because ?? '')}` : 'an element the class establishes'
    } else if (line.kind === 'SESSION_ROLES') {
        premises.push(sessionPremise(ctx, `specialized roles = ${ctx.c.session.specializedRoles}`))
    } else if (line.kind === 'LAW') {
        const principle = rulingOf(ctx.inputs, ctx.inputs.grading.lawsDefault.principleRef)
        if (line.lawStatus === 'DEPARTED' && line.removedByRealization) {
            const departure = ctx.c.realization?.departures.find((d) => d.law === line.law)
            // Stage B3 of the complete-activity package: a departure carried by the case's PROPOSED configuration (its laws block, read only
            // under lawDepartures) is ours, PROPOSED, for Christian's approval: never graded as a ruling of a production provisional realization.
            const proposedLaws = ctx.c.testOnlyTreatments.find((t) => t.kind === 'PROPOSED_CONFIGURATION' && t.proposed?.lawDepartures === true)
            if (departure) {
                const provisional = departure.rulingRefs.some((ref) => rulingOf(ctx.inputs, ref).provisional)
                premises.push(premise('LAW_DEPARTURE', `${line.law} departed from, ${departure.extent}, on ${departure.rulingRefs.join(', ')}`, { provisional }))
            } else if (proposedLaws) premises.push(premise('PROPOSED_ITEM', `${line.law} departed from on our PROPOSED configuration (${proposedLaws.id}: its laws block; ours, not a ruling)`))
            else premises.push(premise('LAW_DEPARTURE', `${line.law} departed from on a production provisional realization`, { provisional: true }))
        } else if (line.lawStatus === 'DEPARTED') {
            premises.push(premise('REALIZATION_ITEM', `${line.law} departed from by a provisional realization's items`, { provisional: true }))
        } else if (line.lawStatus === 'ADAPTATION_OWED') {
            premises.push(premise('UNRESOLVED', `${line.law}: an adaptation is owed (the laws account names why)`))
        } else {
            premises.push(premise('LAWS_DEFAULT_PRINCIPLE', `the Laws apply by default (${principle.id}, ${citedDateOf(principle, true)})`))
            premises.push(premise('LAWS_ENCODING', `${line.law} ${line.lawStatus}: ${ctx.inputs.grading.lawsDefault.encoding}`))
        }
    }
    // A line a placed manipulation brought into the game also rests on the relationship it was applied on: in a test, a TEST-ONLY stand-in
    // (class 4), which this premise makes the line's ceiling; never knowledge. A line nothing establishes holds no value, so none is added.
    if (line.kind !== 'NOT_ESTABLISHED') {
        const owners = lineContracts(line)
        const applied = new Map<string, ProposedManipulation & { relationship: NonNullable<ProposedManipulation['relationship']> }>()
        for (const [contractId, m] of ctx.relationshipByContract) if (owners.indexOf(contractId) >= 0) applied.set(m.id, m)
        for (const m of applied.values())
            premises.push(premise('STAND_IN', `${m.relationship.ref}: the TEST-ONLY relationship ${m.purpose} to ${m.manipulation} (manipulation ${m.id})`, { standing: 'TEST ASSUMPTION', label: 'TEST ASSUMPTION', note: m.relationship.why }))
    }
    return { premises, note }
}

/** A line's class: the weakest over its classed premises (the coach's claims none); its label: the weakest premise's (DESIGN section 4.2). */
function gradeOf(premises: Premise[]): { sixClass: SixClass | null; label: string } {
    const classed = premises.filter((p) => p.sixClass !== null)
    if (!classed.length) return premises.length ? { sixClass: null, label: premises[0].label } : { sixClass: 6, label: VALUE_LABELS.UNRESOLVED }
    const worst = Math.max(...classed.map((p) => p.sixClass as number)) as SixClass
    const labels = [...new Set(classed.filter((p) => p.sixClass === worst).map((p) => p.label))]
    return { sixClass: worst, label: labels.join(' / ') }
}

/** The kind of a line by our rule (OURS), overridden per case where the boundary is contextual. */
export function decisionKindOf(line: ChainLine, premises: Premise[], overrides: CaseInput['decisionKindOverrides']): { kind: DecisionKind | null; contextual: boolean } {
    const override = overrides.find((o) => o.path === line.path)
    if (override) return { kind: override.kind, contextual: override.contextual }
    if (line.kind === 'NOT_ESTABLISHED') return { kind: null, contextual: false }
    if (line.kind === 'CHOICE' && line.closure === 'COACH_DECIDES') return { kind: 'C', contextual: false }
    if (line.kind === 'CHOICE' && line.closure === 'CHOSEN_AMONG_ALTERNATIVES') return { kind: 'A', contextual: false }
    if (line.kind === 'DERIVED' && line.strength === 'DEFAULT') return { kind: 'A', contextual: false }
    if (premises.some((p) => p.kind === 'STAND_IN' || p.kind === 'LAW_DEPARTURE' || p.kind === 'CASE_CHOICE_RULING' || p.kind === 'CASE_CHOICE_ILLUSTRATIVE')) return { kind: 'A', contextual: false }
    return { kind: 'B', contextual: false }
}

/** A from-path with every bracketed part emptied (`a[x].b` -> `a[].b`), to join a generic path the renderer cites. */
function emptied(p: string): string {
    let out = ''
    let depth = 0
    for (const ch of p) {
        if (ch === '[') {
            if (depth === 0) out += '['
            depth++
            continue
        }
        if (ch === ']') {
            depth--
            if (depth === 0) out += ']'
            continue
        }
        if (depth === 0) out += ch
    }
    return out
}

/** The element class a path names, where it names one: `<collection>[c:...]` followed by nothing or a field. */
function elementClassOf(p: string): string | null {
    const open = p.indexOf('[c:')
    if (open < 0) return null
    const close = p.indexOf(']', open)
    if (close < 0) return null
    return p.slice(open + 1, close)
}

function gradeSentence(ctx: GradingContext, s: ChainSentence, lines: GradedLine[]): GradedSentence {
    const joined: string[] = []
    const throughElement: string[] = []
    const unjoined: string[] = []
    const classes: Array<{ sixClass: SixClass; label: string }> = []
    const add = (l: GradedLine) => {
        if (joined.indexOf(l.lineId) < 0) joined.push(l.lineId)
        if (l.sixClass !== null) classes.push({ sixClass: l.sixClass, label: l.label })
    }
    for (const p of s.from) {
        const exact = lines.filter((l) => l.path === p)
        const generic = exact.length ? [] : lines.filter((l) => emptied(l.path) === p)
        const instance = exact.length || generic.length ? [] : lines.filter((l) => l.path === `${p}[]`)
        const collection = exact.length || generic.length || instance.length ? [] : lines.filter((l) => l.path.slice(0, p.length + 1) === `${p}[`)
        const found = [...exact, ...generic, ...instance, ...collection]
        if (found.length) {
            found.forEach(add)
            continue
        }
        const classId = elementClassOf(p)
        const parts = classId ? classParts(classId) : null
        if (parts) {
            const pr = itemPremise(ctx, parts.contractId, parts.itemId)
            throughElement.push(`${p} (the element of ${classId}; ${pr.sixClass === null ? pr.label : classLabel(pr.sixClass)}; ${pr.label})`)
            if (pr.sixClass !== null) classes.push({ sixClass: pr.sixClass, label: pr.label })
            continue
        }
        unjoined.push(p)
    }
    const worst = classes.length ? (Math.max(...classes.map((x) => x.sixClass)) as SixClass) : null
    const labelsAtWorst = [...new Set(classes.filter((x) => x.sixClass === worst).map((x) => x.label))]
    const others = [...new Set(classes.filter((x) => x.sixClass !== worst).map((x) => `${classLabel(x.sixClass)}; ${x.label}`))]
    return {
        section: s.section,
        block: s.block,
        text: s.text,
        status: s.status,
        wording: s.wording ?? (s.reviewOnly ? 'DRAFT' : 'the renderer\'s'),
        reviewOnly: s.reviewOnly,
        from: [...s.from],
        joined,
        throughElement,
        unjoined,
        sixClass: worst,
        label: worst === null ? (joined.length ? 'the coach decides' : 'no line joined') : labelsAtWorst.join(' / '),
        otherLabels: others,
    }
}

/** A token of a refusal reason with the punctuation that ends it removed (a colon, comma, full stop, closing bracket or ellipsis). */
function bareToken(t: string): string {
    let out = t
    for (;;) {
        const last = out.slice(-1)
        if (last === ':' || last === ',' || last === '.' || last === ')' || last === ';' || last === String.fromCharCode(0x2026)) out = out.slice(0, -1)
        else return out
    }
}

/** A token made only of capital letters and underscores, holding an underscore (an engine's refusal code), with any opening bracket removed. */
function engineCode(t: string): string | null {
    const bare = t.slice(0, 1) === '(' ? t.slice(1) : t
    if (bare.length < 4 || bare.indexOf('_') < 0) return null
    for (const ch of bare) if (!((ch >= 'A' && ch <= 'Z') || ch === '_')) return null
    return bare
}

/**
 * The refusal codes its reasons name: the gate invariants (GA- tokens) and the fidelity questions, in order of first mention; at selection,
 * the selection's own code (a capital-letter code in its reason).
 */
function refusalCodes(stage: string, reasons: string[]): string[] {
    const codes: string[] = []
    for (const reason of reasons) {
        for (const raw of reason.split(' ')) {
            const t = bareToken(raw)
            if (t.slice(0, 3) === 'GA-' && codes.indexOf(t) < 0) codes.push(t)
            const code = stage === 'selection' ? engineCode(t) : null
            if (code && codes.indexOf(code) < 0) codes.push(code)
        }
        if (reason.slice(0, 10) === 'fidelity Q') {
            const q = reason.split(':')[0]
            if (codes.indexOf(q) < 0) codes.push(q)
        }
    }
    return codes.length ? codes : [`${stage} refusal`]
}

/**
 * What a refusal met outside a case's own run rests on (a test that builds through the chain directly, such as the time-boxed restart), read
 * from the contracts that build derived from and, where the test read it, the chain's own account behind the refusal, by the same reading as a
 * case's refusal. `labelled` grades items the test typed itself by Christian's own label for them (`LabelledItems`).
 */
export function refusalBasisOfBuild(
    c: CaseInput,
    inputs: HandoffInputs,
    stage: string,
    reasons: string[],
    contracts: ChainAnswer['contracts'],
    extra: { detail?: ChainAnswer['refusalDetail']; labelled?: LabelledItems[] } = {},
): RefusalBasis {
    const answer = { contracts, refusalDetail: extra.detail ?? null } as ChainAnswer
    return refusalBasisOf({ c, inputs, answer, standInByItem: new Map(c.standIns.map((x) => [x.item.itemId, x])), standInByTerm: new Map(), relationshipByContract: new Map(), labelled: extra.labelled ?? [] }, stage, reasons)
}

/** How a premise kind is named in a refusal's basis mix. */
const MIX_WORDS: Partial<Record<PremiseKind, string>> = {
    RESTATED_ITEM: 'restated item',
    DRAFT_ITEM: 'DRAFT store item',
    ILLUSTRATIVE_ITEM: 'ILLUSTRATIVE carrier',
    PROPOSED_ITEM: 'PROPOSED item',
    ASSUMED_ITEM: 'assumed item',
    ASSUMED_BOUND: 'assumed bound',
    KNOWLEDGE_RULING_ITEM: 'ruling item',
    REALIZATION_ITEM: 'realization item',
    ENGINE_ONLY_ITEM: 'engine-only item',
}

/** The cited items counted by basis and grading, in order of first mention: '2 AUTHORED (DRAFT store item)', '1 AUTHORED, 3 ASSUMED' and so on. */
function mixOf(cited: RefusalBasis['cited']): string {
    const counts: Array<[string, number]> = []
    for (const x of cited) {
        const key = `${x.basis} (${MIX_WORDS[x.premiseKind] ?? x.premiseKind}${x.label === VALUE_LABELS.ILLUSTRATIVE ? ', graded ILLUSTRATIVE' : ''})`
        const at = counts.find((e) => e[0] === key)
        if (at) at[1]++
        else counts.push([key, 1])
    }
    return counts.length ? counts.map(([key, n]) => `${n} ${key}`).join(', ') : 'none'
}

/**
 * The declaration kinds that state a requirement: the chain's own list of the kinds that stay in force against a more specific statement
 * (classify.ts, `GENERAL_REQUIREMENTS`, which classify.ts does not export; the unit test holds this copy to that literal in classify.ts's
 * source text, test E4). Only a declaration of these kinds can say that someone owes a line.
 */
export const REQUIREMENT_DECLARATIONS = ['NOT_AUTHORED', 'EXCLUDED', 'CLAIMED']

/**
 * Whether a declaration reaches the line's element class, read from the chain's own reach of it (the wiring passes reach.ts `reaches` for the
 * element class) and the chain's own scope rule (the wiring passes `scopeReaches`, its mirror of classify.ts's rule, held to classify.ts's
 * source text by test E4): its scope reaches the class (an own-involvement declaration reaches only the classes its own object forms) and its
 * reach is anything but FALSE, which is how the chain's classification keeps a requirement in force against a class (classify.ts
 * `governingDeclarations`: its scope reaches the class and its selector is not FALSE for it; an unreadable selector keeps reaching; and
 * reach.ts's invariant: undetermined is never rounded to false). A line that names no class is read row-wide by the chain, so every
 * declaration on its row reaches it. The rule that uses this is OURS.
 */
const reachesTheElement = (g: { reach: string | null; scopeReaches: boolean | null }): boolean => g.scopeReaches !== false && g.reach !== 'FALSE'

/** Why a requirement declaration does not reach the element, in the chain's own terms (its scope rule first, as classify.ts applies it); said after 'whose'. */
const whyNotReaching = (g: { reach: string | null; scope: string | null; scopeReaches: boolean | null }): string =>
    g.scopeReaches === false
        ? `scope (${g.scope ?? 'none'}) does not reach it: an own-involvement declaration reaches only the classes its own object forms (the chain's scope rule)`
        : 'selector does not reach it (the chain\'s own reach: FALSE)'

/** A declaration as the reading names it. */
const declarationWords = (g: { contractId: string; declaration: string; selector: string | null }): string => `${g.contractId} ${g.declaration}${g.selector ? ` (${g.selector})` : ''}`

/** The chain's line verdicts, glossed where the reading prints them (the chain's words, kept apart from ours). */
const LINE_VERDICT_GLOSS: Record<string, string> = { NOT_AUTHORED: 'nothing authored its value' }

/**
 * Which requirement declarations owe a cited owed line (OURS, read from the chain's reach and scope rule, as the gap rule reads them): each
 * one that reaches the element, said as a declaration of a contract establishing the element or of another contract; where the chain decided
 * the line row-wide and no establishing contract states anything explicit that reaches the element (the chain's own test for reading a line
 * row-wide: a declaration of an establishing contract that is not UNDECLARED, whose scope reaches the class and whose selector reaches it
 * TRUE), that is said, with the establishing contracts' own declarations on the row. It says nothing about what a correction would change.
 */
function owedByWords(owed: NonNullable<ChainAnswer['refusalDetail']>['owedLines'][number]): string | null {
    const reaching = owed.governedBy.filter((g) => REQUIREMENT_DECLARATIONS.indexOf(g.declaration) >= 0 && reachesTheElement(g))
    if (!reaching.length) return null
    const whose = (g: { contractId: string }) => (owed.establishing.indexOf(g.contractId) >= 0 ? 'a declaration of the contract establishing the element' : 'a declaration of another contract')
    const named = reaching.map((g) => `${declarationWords(g)}, ${whose(g)}`).join('; ')
    const establishingOnRow = owed.governedBy.filter((g) => owed.establishing.indexOf(g.contractId) >= 0)
    const explicit = establishingOnRow.filter((g) => g.declaration !== 'UNDECLARED' && g.scopeReaches !== false && g.reach === 'TRUE')
    const rowWide =
        owed.rowWide && owed.establishing.length && !explicit.length
            ? `; applied row-wide, because no contract establishing the element (${owed.establishing.join(', ')}) states anything explicit that reaches it: ${
                  establishingOnRow.length
                      ? `its declarations on the row are ${establishingOnRow.map((g) => `${g.declaration}${g.selector ? ` (${g.selector})` : ''} [reach ${g.reach ?? 'no class'}${g.scopeReaches === false ? ', scope does not reach' : ''}]`).join('; ')}${establishingOnRow.some((g) => g.declaration === 'UNDECLARED' && g.reach === 'TRUE') ? ' (UNDECLARED is recorded silence: the element is left undeclared)' : ''}`
                      : 'it makes no declaration on the row'
              }`
            : ''
    return `the requirement declaration${reaching.length === 1 ? '' : 's'} reaching the element: ${named}${rowWide}`
}

const classWordsOf = (c: SixClass | null): string => (c === null ? 'no class claimed' : `class ${c}`)

/**
 * What a refusal rests on (see `RefusalBasis`). OURS: a reading of the refusal's reasons and of the chain's own account behind it; it changes no
 * check and no outcome.
 */
function refusalBasisOf(ctx: GradingContext, stage: string, reasons: string[]): RefusalBasis {
    const codes = refusalCodes(stage, reasons)
    const detail = ctx.answer.refusalDetail ?? null
    const cited: RefusalBasis['cited'] = []
    const gaps: RefusalBasis['gaps'] = []
    // Where the citations are read: the refusal's reasons, then each failing check's own result (its why and the lines it names), which can
    // name items the reasons do not (a trigger's item; a line the reasons cut short).
    const texts: Array<{ text: string; via: string }> = [
        ...reasons.map((text) => ({ text, via: 'its reasons' })),
        ...(detail?.failingChecks ?? []).flatMap((check) => [check.why, ...check.subjects].map((text) => ({ text, via: `the failing check ${check.checkId}'s own result` }))),
    ]
    const read = (contractId: string, itemId: string) => {
        const contract = ctx.answer.contracts.find((x) => x.contractId === contractId)
        const item = contract?.items.find((x) => x.itemId === itemId)
        return { origin: contract ? contract.origin : 'none', basis: item ? item.basis : 'not among the contracts the chain derived from', p: itemPremise(ctx, contractId, itemId) }
    }
    const seen = new Set<string>()
    for (const { text, via } of texts)
        for (const raw of text.split(' ')) {
            const t = bareToken(raw)
            if (t.slice(0, 2) !== 'c:' || seen.has(t)) continue
            const parts = classParts(t.split('::')[0])
            if (!parts) continue
            seen.add(t)
            const { origin, basis, p } = read(parts.contractId, parts.itemId)
            const elementWords = `item ${parts.itemId} of ${parts.contractId}, basis ${basis}; graded ${p.kind}, ${classWordsOf(p.sixClass)}, '${p.label}'${p.note ? ` (${p.note})` : ''}`
            const owed = detail?.owedLines.find((l) => l.lineId === t) ?? null
            // The chain's words are kept apart from ours (review of 7 November, round 3): its line verdict (NOT_AUTHORED: nothing authored the
            // line's value) and its reason (e.g. 'declared gap', which is not our gap) are printed as the chain's.
            const gloss = owed ? LINE_VERDICT_GLOSS[owed.verdict] : undefined
            const chainReading = owed
                ? `the chain's line verdict ${owed.verdict}${gloss ? ` (${gloss})` : ''}, its reason '${owed.reason ?? 'none'}', decided over the declarations ${owed.governedBy.map((g) => `${declarationWords(g)} [the chain's reach of the element: ${g.reach ?? 'no class'}${g.scopeReaches === false ? `; its scope, ${g.scope ?? 'none'}, does not reach the element (the chain's scope rule)` : ''}]`).join('; ') || 'none'}${owed.rowWide ? ' (row-wide: every declaration on the row)' : ''}`
                : null
            // A cited owed line that no requirement declaration it was decided over reaches (the chain's own reach of its element and its scope
            // rule): nobody established it, whatever reason the chain's precedence gives it (a declaration that does not reach the element can
            // still name it).
            if (owed && t.indexOf('::') > 0) {
                const requirements = owed.governedBy.filter((g) => REQUIREMENT_DECLARATIONS.indexOf(g.declaration) >= 0)
                if (!requirements.some(reachesTheElement)) {
                    const said = requirements.length
                        ? `its reason '${owed.reason ?? 'none'}' comes${owed.rowWide ? ' row-wide' : ''} from ${requirements.length === 1 ? 'a requirement declaration that does' : 'requirement declarations that do'} not reach this element: ${requirements.map((g) => `${declarationWords(g)}, whose ${whyNotReaching(g)}`).join('; ')}`
                        : 'no requirement declaration is among those the chain decided it over'
                    gaps.push({ ref: t, why: `${chainReading}; ${said}; no requirement declaration reaches it, so nobody established it: a line nobody established (a gap)`, element: `its element is established by ${elementWords}` })
                    continue
                }
            }
            // An open line refused for being outside its permitted set (the reason citing it says the value is not one of the permitted
            // alternatives), whose bounding items the chain names (its narrowing, its bounds): read back to those items, and the element's own
            // item named as not bounding it (where it is not among them). An open line cited for any other reason is read through its element.
            const open = via === 'its reasons' && text.indexOf('not one of the permitted alternatives') >= 0 ? (detail?.openLines.find((o) => o.lineId === t) ?? null) : null
            if (open && open.boundedBy.length) {
                const elementBounds = open.boundedBy.some((b) => b.contractId === parts.contractId && b.itemId === parts.itemId)
                const openReading = `the chain names the line open, its permitted alternatives ${open.permitted ? open.permitted.map(valueWords).join(', ') : 'not named'}, bounded by ${open.boundedBy.map((b) => `${b.contractId} ${b.itemId} (${b.how === 'NARROWING' ? 'a narrowing item' : 'a bounding item'})`).join('; ')}`
                for (const b of open.boundedBy) {
                    const bound = read(b.contractId, b.itemId)
                    cited.push({ ref: t, contractId: b.contractId, itemId: b.itemId, basis: bound.basis, origin: bound.origin, premiseKind: bound.p.kind, label: bound.p.label, sixClass: bound.p.sixClass, note: bound.p.note ?? null, source: bound.p.source ?? null, sourceStanding: bound.p.sourceStanding ?? null, via: `${via}; the bound read from the chain's own account of the open line, its ${b.how === 'NARROWING' ? 'narrowing items' : 'bounding items'}`, chainReading: openReading, owedBy: null, elementNotBounding: elementBounds ? null : `its element is established by ${elementWords}, which does not bound the line` })
                }
                continue
            }
            cited.push({ ref: t, contractId: parts.contractId, itemId: parts.itemId, basis, origin, premiseKind: p.kind, label: p.label, sixClass: p.sixClass, note: p.note ?? null, source: p.source ?? null, sourceStanding: p.sourceStanding ?? null, via, chainReading, owedBy: owed && t.indexOf('::') > 0 ? owedByWords(owed) : null, elementNotBounding: null })
        }
    const mix = mixOf(cited)
    const gapWords = gaps.length ? `; ${gaps.length} cited line${gaps.length === 1 ? '' : 's'} nobody established (a gap), listed after` : ''
    const all = reasons.join(' ')
    if (!cited.length) {
        if (gaps.length) return { stage, codes, cited, gaps, mix, verdict: 'NOT KNOWLEDGE', why: `a gap: the refusal cites no item, only ${gaps.length === 1 ? 'a line' : `${gaps.length} lines`} nobody established` }
        const which =
            all.indexOf('has no contribution contract') >= 0
                ? 'a missing contract'
                : all.indexOf('no realization choices') >= 0
                  ? 'a missing choices file'
                  : stage === 'selection'
                    ? `an engine selection rule (${codes.join(', ')})`
                    : // A capability gap only where every code is Q3 (something established that no instruction carries); a Q1, Q2 or Q4 finding is a
                      // disagreement, an unsupported statement or a changed status, read as an engine check.
                      stage === 'communication' && codes.length > 0 && codes.every((code) => code === 'fidelity Q3')
                      ? `a renderer capability gap: the checked renderer has no sentence for what the game establishes (${codes.join(', ')})`
                      : `an engine check (${codes.join(', ')})`
        return { stage, codes, cited, gaps, mix, verdict: 'NOT KNOWLEDGE', why: `the refusal cites no item: ${which}` }
    }
    const ours: PremiseKind[] = ['RESTATED_ITEM', 'DRAFT_ITEM', 'ASSUMED_ITEM', 'ASSUMED_BOUND']
    const ruling = (x: RefusalBasis['cited'][number]) => (x.premiseKind === 'KNOWLEDGE_RULING_ITEM' || x.premiseKind === 'REALIZATION_ITEM') && x.label !== VALUE_LABELS.ILLUSTRATIVE
    if (cited.every((x) => ours.indexOf(x.premiseKind) >= 0)) return { stage, codes, cited, gaps, mix, verdict: 'RESTATEMENT-ONLY', why: `every cited item is ours and unreviewed (${mix}), with no ruling of Christian's among them${gapWords}` }
    if (cited.some(ruling)) return { stage, codes, cited, gaps, mix, verdict: 'MIXED', why: `at least one cited item rests on a ruling of Christian's (${mix})${gapWords}` }
    return { stage, codes, cited, gaps, mix, verdict: 'NOT KNOWLEDGE', why: `the cited items are neither ours and unreviewed nor rulings (${mix})${gapWords}` }
}

// ---------------------------------------------------------------------------------------------------------------------------------------
// The run
// ---------------------------------------------------------------------------------------------------------------------------------------

/** One case through the handoff: Receive, Determine the form, Manipulations, Chain request, Determine and Produce, Preserve. */
export function runHandoff(c: CaseInput, inputs: HandoffInputs, chain: HandoffChain, knowledge: DesignKnowledge = committedKnowledge()): HandoffResult {
    const s1 = c.goalId ? runStage1(c.goalId, knowledge) : null
    const receive = receiveStep1(s1, c, inputs)
    if (c.record) receive.scopeSetBy = c.record.gameProblemScopeRefs.map((ref) => {
        const r = rulingOf(inputs, ref)
        return `${r.id} (${citedDateOf(r)}; scope ${r.scope ?? 'none stated'}): sets the scope only, decides nothing`
    })
    const form = determineForm(c, s1, inputs)
    const rulings = c.rulings.map((entry) => {
        const r = rulingOf(inputs, entry.ref)
        return { ref: entry.ref, entersAs: entry.entersAs, how: entry.how, words: [...r.words], received: receivedOf(r), ...datedEntryOf(r), provisional: r.provisional, scope: r.scope }
    })
    // Manipulations: applied only with an authorized relationship; in a test only, a labelled TEST-ONLY stand-in for one (class 4). An applied
    // manipulation is placed in the selection explicitly, as the form is; the record's own authorized set is never widened.
    const place: ChainRequest['place'] = []
    const manipulationEntries = c.proposedManipulations.map((m) => {
        // The safeguards slice: a manipulation entering by the record route is never placed; the chain's selection examines it in the record's set.
        if (m.entersBy === 'RECORD' && m.relationship) {
            return { id: m.id, purpose: m.purpose, manipulation: m.manipulation, outcome: `enters through the TEST-ONLY record's authorized set (the record route), never placed; it rests on a TEST-ONLY stand-in relationship (${m.relationship.ref}), never knowledge`, premise: premise('STAND_IN', m.relationship.ref, { standing: 'TEST ASSUMPTION', label: 'TEST ASSUMPTION', note: m.relationship.why }) }
        }
        if (m.relationship && m.relationship.label === 'TEST ASSUMPTION') {
            place.push({ id: m.manipulation, manipulationId: m.id, relationshipRef: m.relationship.ref })
            return { id: m.id, purpose: m.purpose, manipulation: m.manipulation, outcome: `applied on a TEST-ONLY stand-in relationship (${m.relationship.ref}), never knowledge: placed in the selection explicitly; the record's authorized set is unchanged`, premise: premise('STAND_IN', m.relationship.ref, { standing: 'TEST ASSUMPTION', label: 'TEST ASSUMPTION', note: m.relationship.why }) }
        }
        return { id: m.id, purpose: m.purpose, manipulation: m.manipulation, outcome: `no authorized relationship: ${m.purpose} to ${m.manipulation}; the configuration is unchanged`, premise: null }
    })
    // Proposed values: applied only as ILLUSTRATIVE supplied choices, never over a line the case closes on a ruling of Christian's.
    const effective: CaseInput = { ...c, suppliedChoices: c.suppliedChoices.map((x) => ({ ...x })) }
    const proposedChoices = (c.proposedChoices ?? []).map((p) => {
        const ruled = effective.suppliedChoices.find((x) => x.lineId === p.lineId && x.standing === 'RULING')
        if (ruled) {
            const r = rulingOf(inputs, ruled.rulingRef as string)
            const same = JSON.stringify(ruled.value) === JSON.stringify(p.value)
            return {
                id: p.id,
                lineId: p.lineId,
                value: deepCopy(p.value),
                applied: false,
                outcome: same
                    ? `already the value Christian's ruling ${r.id} (${citedDateOf(r)}${r.provisional ? ', provisional' : ''}) gives the line; nothing changes`
                    : `contrary to Christian's ruling ${r.id} (${citedDateOf(r)}${r.provisional ? ', provisional' : ''}), which closes the line as ${valueWords(ruled.value)}: not applied; the line keeps the ruling's value`,
            }
        }
        const existing = effective.suppliedChoices.findIndex((x) => x.lineId === p.lineId)
        const entry: SuppliedChoiceInput = { lineId: p.lineId, value: deepCopy(p.value), rulingRef: null, standing: 'ILLUSTRATIVE', provisional: false }
        if (existing >= 0) effective.suppliedChoices[existing] = entry
        else effective.suppliedChoices.push(entry)
        return { id: p.id, lineId: p.lineId, value: deepCopy(p.value), applied: true, outcome: `applied as an ILLUSTRATIVE supplied choice (permitted by ${p.rulingRefs.join(', ')}); whether the line admits it is the chain's to say` }
    })
    const base = {
        caseId: c.id,
        label: c.label,
        resultStanding: c.resultStanding,
        goalId: c.goalId,
        receive,
        form,
        proposedChoices,
        purpose: c.purpose ? deepCopy(c.purpose) : null,
        rulings,
        illustrative: deepCopy(c.illustrative),
        testOnlyTreatments: deepCopy(c.testOnlyTreatments),
        notCarried: deepCopy(c.notCarried),
        reportNotes: (c.reportNotes ?? []).map((n) => ({
            section: n.section,
            text: n.text,
            quotes: (n.quotes ?? []).map((q) => {
                const r = rulingOf(inputs, q.rulingRef)
                return { ref: r.id, words: r.words[q.word], received: receivedOf(r), ...datedEntryOf(r) }
            }),
        })),
        opportunities: OPPORTUNITIES_NOT_ESTABLISHED,
    }
    if (form.decision === 'STOP' || !form.formId) {
        return {
            ...base,
            chain: null,
            lines: [],
            sentences: [],
            sentencesServed: null,
            withheld: [],
            laws: null,
            lawEntries: [],
            requirementAccount: null,
            diagram: null,
            refusal: { stage: 'handoff (form)', reasons: [form.stop ?? 'no form'] },
            refusalBasis: { stage: 'handoff (form)', codes: ['handoff (form) refusal'], cited: [], gaps: [], mix: 'none', verdict: 'NOT KNOWLEDGE', why: `the handoff stopped before the chain: ${form.stop ?? 'no form'}` },
            manipulations: manipulationEntries.map((m) => ({ ...m, placedContracts: [] })),
            gaps: [form.stop ?? 'no form'],
            standIns: c.standIns.map((x) => ({ id: x.id, label: x.label, why: x.why, determines: [] })),
            counts: { lines: 0, byClass: {}, byKind: {}, sentences: 0 },
        }
    }
    const request = chainRequest(effective, s1, form.formId, inputs, place)
    const answer = chain.build(request)
    const relationshipByContract: GradingContext['relationshipByContract'] = new Map()
    for (const p of answer.placed) {
        const m = c.proposedManipulations.find((x) => x.manipulation === p.id && x.relationship && x.entersBy !== 'RECORD')
        if (m && m.relationship) for (const contractId of p.contractIds) relationshipByContract.set(contractId, { ...m, relationship: m.relationship })
    }
    // The safeguards slice: the record-route manipulations the chain built, with the contracts it derived for each (the wiring's `recordSet`).
    for (const b of answer.recordSet ?? []) {
        const m = c.proposedManipulations.find((x) => x.manipulation === b.id && x.relationship && x.entersBy === 'RECORD')
        if (m && m.relationship) for (const contractId of b.contractIds) relationshipByContract.set(contractId, { ...m, relationship: m.relationship })
    }
    const ctx: GradingContext = {
        c: effective,
        inputs,
        answer,
        standInByItem: new Map(c.standIns.map((x) => [x.item.itemId, x])),
        standInByTerm: new Map(c.standIns.map((x) => [x.item.value, x])),
        relationshipByContract,
        labelled: [],
    }
    const lines: GradedLine[] = answer.lines.map((line) => {
        const { premises, note } = linePremises(ctx, line)
        const grade = gradeOf(premises)
        const kind = decisionKindOf(line, premises, c.decisionKindOverrides)
        return { lineId: line.lineId, path: line.path, kind: line.kind, value: line.value, premises, sixClass: grade.sixClass, label: grade.label, decisionKind: kind.kind, decisionKindContextual: kind.contextual, note }
    })
    const sentences = answer.sentences.map((s) => gradeSentence(ctx, s, lines))
    const scorer = answer.scorerPick
    // Stage 9: on a consuming run the form was consumed, never placed, so the scorer line says what the chain's own account recorded.
    const consuming = request.consume !== undefined
    const recorded = consuming ? (answer.consumption ?? null) : null
    const scorerWords = consuming
        ? recorded
            ? `consumption run: the chain's scorer ranked only ${recorded.formCandidatesScored.join(', ') || 'no form'} (read from ${recorded.formCandidatesFrom}), its candidate forms filtered to Step 2's ${form.formId}; the handoff placed no form`
            : `consumption run: the chain's account recorded no consumption (its selection ${scorer === null ? 'returned nothing' : `picked ${scorer.join(', ') || 'none'}`}); the handoff placed no form`
        : scorer === null
          ? null
          : `${scorer.join(', ') || 'none'} (the chain's own keyword-scorer pick: not used; the handoff placed ${form.formId})`
    const step1Context = receive.step1?.contextId ?? null
    const chainContext = answer.account?.contextId ?? null
    const gp = answer.account?.gameProblem ?? null
    const step1Gp = receive.step1 ? `primary ${receive.step1.primary.join(', ') || 'none'}, secondary ${receive.step1.secondary.join(', ') || 'none'}` : 'none (structural case)'
    /**
     * A Game Problem id with its name, where the chain's answer carries one (the unit wiring reads the names through the display reader, after
     * the decisions; this stage file reads no name column).
     */
    const gpWords = (id: string | null): string => {
        if (!id) return 'none'
        const name = gp?.names?.[id]
        return name ? `${id} '${name}'` : id
    }
    const gaps: string[] = []
    if (answer.outcome === 'refused') gaps.push(`the chain refused at ${answer.stage ?? 'an unnamed stage'}: ${answer.reasons.join('; ')}`)
    for (const l of lines.filter((x) => x.kind === 'NOT_ESTABLISHED')) gaps.push(`${l.lineId} (${l.path}): not established`)
    for (const l of lines.filter((x) => x.kind === 'LAW' && x.premises.some((p) => p.kind === 'UNRESOLVED'))) gaps.push(`${l.lineId}: ${l.premises.map((p) => p.ref).join('; ')}`)
    for (const n of c.notCarried) gaps.push(`${n.id} ${n.what}: not carried (${n.label})`)
    const byClass: Record<string, number> = {}
    const byKind: Record<string, number> = {}
    for (const l of lines) {
        const k = l.sixClass === null ? 'no class (the coach decides)' : `class ${l.sixClass}`
        byClass[k] = (byClass[k] ?? 0) + 1
        const d = l.decisionKind ?? 'no kind'
        byKind[d] = (byKind[d] ?? 0) + 1
    }
    return {
        ...base,
        chain: {
            outcome: answer.outcome,
            stage: answer.stage,
            summary: answer.summary,
            reasons: [...answer.reasons],
            scorerPick: scorerWords,
            contextComparison:
                step1Context === null
                    ? `structural case: no Step 1 context; the chain's account reads ${chainContext ?? 'none'}`
                    : chainContext === step1Context
                      ? `the chain's context equals Step 1's (${step1Context})`
                      : `MISMATCH: Step 1 resolves ${step1Context}; the chain's account reads ${chainContext ?? 'none'} (reported, never switched)`,
            gameProblemComparison: !gp
                ? `the chain's account carries no Game Problem; Step 1: ${step1Gp}`
                : !receive.step1 && c.chain.vehicle
                  ? // A structural case has no Game Problem: what the account names is the vehicle goal's, said as such (never this case's, never a standing).
                    `a structural case has no Game Problem of its own; the chain's account names the vehicle goal's (${c.chain.vehicle.goalId}, the TEST-ONLY vehicle): ${gpWords(gp.gameProblemId)}${gp.inferredFromWording ? `, inferred from wording (${gpWords(gp.inferredFromWording)})` : ''}; it is not this case's Game Problem and not a standing; no line of the chain reads a Game Problem`
                  : `the chain's account reads ${gp.status} ${gpWords(gp.gameProblemId)}${gp.inferredFromWording ? ` (inferred from wording: ${gpWords(gp.inferredFromWording)})` : ''}; Step 1: ${step1Gp}; no line of the chain reads a Game Problem; a difference is reported, never switched`,
            gameProblemOverride: c.gameProblemOverride
                ? `MISMATCH, reported and never switched: the TEST-ONLY record carries ${c.gameProblemOverride.id} (${c.gameProblemOverride.label}; ${c.gameProblemOverride.why}${c.gameProblemOverride.rulingRefs.length ? `; ${c.gameProblemOverride.rulingRefs.join(', ')}` : ''}), where Step 1 resolves ${step1Gp}; Step 1's resolution stands and is what this report names; no line of the chain reads a Game Problem, so no line can follow either`
                : null,
            affordanceLenses: answer.account && answer.account.affordanceLenses.length ? `${answer.account.affordanceLenses.join('; ')}: the chain's vocabulary lenses, not contracted knowledge, not a selection` : 'none',
            constraints: answer.account ? [...answer.account.constraints] : [],
            fidelityViolations: answer.fidelityViolations,
        },
        manipulations: manipulationEntries.map((m) => {
            // The safeguards slice: a record-route manipulation says whether the chain built it, and from which contracts; it is never placed.
            const viaRecord = c.proposedManipulations.find((x) => x.id === m.id)?.entersBy === 'RECORD'
            const built = viaRecord ? (answer.recordSet ?? []).find((b) => b.id === m.manipulation) : undefined
            const outcome = viaRecord ? `${m.outcome}; ${built ? `the chain built it from ${built.contractIds.join(', ') || 'no contract'}` : 'the chain did not build it'}` : m.outcome
            return { ...m, outcome, placedContracts: viaRecord ? [] : [...(answer.placed.find((p) => p.id === m.manipulation && m.premise !== null)?.contractIds ?? [])] }
        }),
        lines,
        sentences,
        sentencesServed: answer.sentencesServed,
        withheld: deepCopy(answer.withheld),
        laws: deepCopy(answer.laws),
        lawEntries: answer.lines.filter((l) => l.kind === 'LAW' && l.path.indexOf('.laws[') > 0).map((l) => ({ lineId: l.lineId, law: String(l.law), status: String(l.lawStatus), removedByRealization: l.removedByRealization === true })),
        requirementAccount: deepCopy(answer.requirementAccount),
        diagram: deepCopy(answer.diagram),
        refusal: answer.outcome === 'refused' ? { stage: String(answer.stage), reasons: [...answer.reasons] } : null,
        refusalBasis: answer.outcome === 'refused' ? refusalBasisOf(ctx, String(answer.stage), answer.reasons) : null,
        gaps,
        standIns: c.standIns.map((x) => ({ id: x.id, label: x.label, why: x.why, determines: lines.filter((l) => l.premises.some((p) => p.kind === 'STAND_IN' && p.ref.indexOf(x.id) >= 0)).map((l) => l.lineId) })),
        counts: { lines: lines.length, byClass, byKind, sentences: sentences.length },
        // Stage 9, only on a consuming run (so no other case's result changes): what the chain recorded it consumed, and the draft items derived.
        ...(consuming
            ? {
                  consumption: recorded
                      ? {
                            ...deepCopy(recorded),
                            draftItemsDerived: answer.contracts.filter((x) => x.origin === 'DRAFT_STORE').flatMap((x) => x.items.filter((i) => i.category !== 'ILLUSTRATIVE').map((i) => `${x.contractId} ${i.itemId}`)),
                            // W4 (foundational package): ILLUSTRATIVE carriers listed apart, present only where a carrier treatment added any.
                            ...(answer.contracts.some((x) => x.items.some((i) => i.category === 'ILLUSTRATIVE'))
                                ? { illustrativeItemsDerived: answer.contracts.flatMap((x) => x.items.filter((i) => i.category === 'ILLUSTRATIVE').map((i) => `${x.contractId} ${i.itemId} (ILLUSTRATIVE)`)) }
                                : {}),
                            draftShaped: answer.lines.filter((l) => l.draftShapedBy && l.draftShapedBy.length).map((l) => ({ lineId: l.lineId, value: deepCopy(l.value), by: (l.draftShapedBy ?? []).map((d) => `${d.contractId} ${d.itemId} ${d.relation}`) })),
                        }
                      : null,
              }
            : {}),
    }
}

// ---------------------------------------------------------------------------------------------------------------------------------------
// Comparing two runs (Tests A, B and C): exactly what changed between a case and a variant of it, and what did not
// ---------------------------------------------------------------------------------------------------------------------------------------

export interface HandoffComparison {
    baseCase: string
    variantCase: string
    outcome: [string | null, string | null]
    stage: [string | null, string | null]
    sentences: {
        before: number
        after: number
        kept: number
        /**
         * A sentence of the base replaced by one of the variant, paired by section in reading order; `null` on one side where none pairs. Each
         * side's wording standing (APPROVED, DRAFT or the renderer's) is kept beside its grade.
         */
        changed: Array<{ section: string; before: string | null; after: string | null; fromChanged: boolean | null; gradeBefore: string | null; gradeAfter: string | null; wordingBefore: string | null; wordingAfter: string | null }>
        /** A sentence said word for word in both, whose from-paths or grade differ. */
        keptButChanged: Array<{ text: string; fromChanged: boolean; gradeBefore: string; gradeAfter: string; wording: string }>
    }
    lines: {
        before: number
        after: number
        changed: Array<{ lineId: string; before: unknown; after: unknown; gradeBefore: string; gradeAfter: string }>
        added: string[]
        removed: string[]
    }
    diagram: { changed: string[]; before: ChainAnswer['diagram']; after: ChainAnswer['diagram'] }
    identical: { lines: boolean; sentences: boolean; diagram: boolean }
    /** The variant's refusal, where it was refused (its stage and reasons, as the chain or the handoff gave them). */
    variantRefusal: { stage: string; reasons: string[] } | null
}

const gradeWords = (sixClass: SixClass | null, label: string): string => `${sixClass === null ? 'no class' : `class ${sixClass}`}; ${label}`
const same = (a: unknown, b: unknown): boolean => JSON.stringify(a) === JSON.stringify(b)

/** What changed from `base` to `variant`: outcome and stage, the sentences (by text), the lines (by id) and the diagram (by key). Pure. */
export function compareResults(base: HandoffResult, variant: HandoffResult): HandoffComparison {
    const before = base.sentences
    const after = variant.sentences
    const unmatchedAfter = after.map((_, i) => i)
    const keptPairs: Array<[number, number]> = []
    const removed: number[] = []
    before.forEach((s, i) => {
        const at = unmatchedAfter.find((j) => after[j].text === s.text)
        if (at === undefined) removed.push(i)
        else {
            keptPairs.push([i, at])
            unmatchedAfter.splice(unmatchedAfter.indexOf(at), 1)
        }
    })
    const changed: HandoffComparison['sentences']['changed'] = []
    const added = [...unmatchedAfter]
    for (const i of removed) {
        const at = added.find((j) => after[j].section === before[i].section)
        const b = before[i]
        if (at === undefined) changed.push({ section: b.section, before: b.text, after: null, fromChanged: null, gradeBefore: gradeWords(b.sixClass, b.label), gradeAfter: null, wordingBefore: b.wording, wordingAfter: null })
        else {
            added.splice(added.indexOf(at), 1)
            const a = after[at]
            changed.push({ section: b.section, before: b.text, after: a.text, fromChanged: !same(b.from, a.from), gradeBefore: gradeWords(b.sixClass, b.label), gradeAfter: gradeWords(a.sixClass, a.label), wordingBefore: b.wording, wordingAfter: a.wording })
        }
    }
    for (const j of added) changed.push({ section: after[j].section, before: null, after: after[j].text, fromChanged: null, gradeBefore: null, gradeAfter: gradeWords(after[j].sixClass, after[j].label), wordingBefore: null, wordingAfter: after[j].wording })
    const keptButChanged = keptPairs
        .filter(([i, j]) => !same(before[i].from, after[j].from) || before[i].sixClass !== after[j].sixClass || before[i].label !== after[j].label)
        .map(([i, j]) => ({ text: before[i].text, fromChanged: !same(before[i].from, after[j].from), gradeBefore: gradeWords(before[i].sixClass, before[i].label), gradeAfter: gradeWords(after[j].sixClass, after[j].label), wording: after[j].wording }))
    const linesBefore = new Map(base.lines.map((l) => [l.lineId, l]))
    const linesAfter = new Map(variant.lines.map((l) => [l.lineId, l]))
    const lineChanges: HandoffComparison['lines']['changed'] = []
    for (const [id, l] of linesBefore) {
        const v = linesAfter.get(id)
        if (v && (!same(l.value, v.value) || l.sixClass !== v.sixClass || l.label !== v.label)) lineChanges.push({ lineId: id, before: l.value, after: v.value, gradeBefore: gradeWords(l.sixClass, l.label), gradeAfter: gradeWords(v.sixClass, v.label) })
    }
    const db = base.diagram
    const dv = variant.diagram
    // The diagram compared over its whole projection: dimensions, targets and teams too (since the review of 7 November), so 'exactly' holds.
    const diagramKeys = ['served', 'verdict', 'area', 'counts', 'legend', 'zones', 'findings', 'dimensions', 'targets', 'teams'] as const
    const diagramChanged = !db || !dv ? (same(db, dv) ? [] : ['the diagram itself']) : diagramKeys.filter((k) => !same(db[k], dv[k]))
    return {
        baseCase: base.caseId,
        variantCase: variant.caseId,
        outcome: [base.chain?.outcome ?? null, variant.chain?.outcome ?? null],
        stage: [base.refusal?.stage ?? null, variant.refusal?.stage ?? null],
        sentences: { before: before.length, after: after.length, kept: keptPairs.length, changed, keptButChanged },
        lines: {
            before: base.lines.length,
            after: variant.lines.length,
            changed: lineChanges,
            added: variant.lines.filter((l) => !linesBefore.has(l.lineId)).map((l) => l.lineId),
            removed: base.lines.filter((l) => !linesAfter.has(l.lineId)).map((l) => l.lineId),
        },
        diagram: { changed: diagramChanged, before: deepCopy(db), after: deepCopy(dv) },
        identical: { lines: same(base.lines, variant.lines), sentences: same(base.sentences, variant.sentences), diagram: same(db, dv) },
        variantRefusal: variant.refusal ? { stage: variant.refusal.stage, reasons: [...variant.refusal.reasons] } : null,
    }
}

/**
 * One test as the report lists it (Christian's reply of 7 November, section 13: "Please distinguish implemented functionality, passing
 * engineering tests, and ecological suitability in the report."): what it shows, what was measured, and its verdict as the unit test ran it.
 * Ecological suitability is never established by any of them, and the report says so for each.
 */
export interface HandoffTestRecord {
    id: string
    group: string
    cites: string
    title: string
    shows: string
    measured: string[]
    /** 'passing engineering test', or the failure as the unit test met it. */
    verdict: string
}

/**
 * One refusal in the evidence and what it rests on, with whether it obstructs the configuration pathway (the test or case says which), and any
 * notes the test measured beside the reading (an item the chain's own account does not name, found by the test and said how).
 */
export interface RefusalEntry {
    where: string
    basis: RefusalBasis
    obstructs: string
    notes?: string[]
}

/**
 * One measured run of a Learning Goal, for the report's 'where each Learning Goal stops' block (review of 7 November, round 3): the run's own
 * result (with its own result standing) and where in the evidence it was run (a case, or a test). Every value the block prints is read from
 * `result`, except `where`.
 */
export interface GoalStopRun {
    goalId: string
    where: string
    result: HandoffResult
}

/** Every case of the inputs, in file order. */
export function runHandoffCases(inputs: HandoffInputs, chain: HandoffChain, knowledge: DesignKnowledge = committedKnowledge()): HandoffResult[] {
    return inputs.cases.map((c) => runHandoff(c, inputs, chain, knowledge))
}

/**
 * The inputs one goal's cases hold, counted for the report against the hand-authored record they replace: Christian's rulings (distinct),
 * the illustrative values and the TEST-ONLY treatments (distinct, over the goal's cases), the supplied choices and the stand-ins.
 */
export function inputCounts(inputs: HandoffInputs, goalId: string): { cases: string[]; rulings: number; enteringTheChain: number; reportOnly: number; illustrative: number; testOnlyTreatments: number; suppliedChoices: number; standIns: number } {
    const cases = inputs.cases.filter((c) => c.goalId === goalId)
    const rulingRefs = new Set<string>()
    const entering = new Set<string>()
    const reportOnly = new Set<string>()
    for (const c of cases)
        for (const r of c.rulings) {
            rulingRefs.add(r.ref)
            if (r.entersAs === 'REPORT_ONLY') reportOnly.add(r.ref)
            else entering.add(r.ref)
        }
    for (const ref of entering) reportOnly.delete(ref)
    const illustrative = new Set(cases.flatMap((c) => c.illustrative.map((i) => i.id)))
    const treatments = new Set(cases.flatMap((c) => c.testOnlyTreatments.map((t) => t.id)))
    const choices = new Set(cases.flatMap((c) => c.suppliedChoices.map((s) => s.lineId)))
    const standIns = new Set(cases.flatMap((c) => c.standIns.map((s) => s.id)))
    return { cases: cases.map((c) => c.id), rulings: rulingRefs.size, enteringTheChain: entering.size, reportOnly: reportOnly.size, illustrative: illustrative.size, testOnlyTreatments: treatments.size, suppliedChoices: choices.size, standIns: standIns.size }
}

/** A standing read from data, checked (the map's own entries are typed). */
export const checkedStanding = (v: unknown): Standing => {
    if (!isStanding(v)) throw new Error(`unknown standing ${JSON.stringify(v)}`)
    return v
}
