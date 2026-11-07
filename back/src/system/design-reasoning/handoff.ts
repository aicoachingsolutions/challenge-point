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
 *
 * WHAT IT IS NOT. Not a configuration step of the live engine, not served, not an authorization, not a selection input. It imports no
 * module of the checked chain: the chain arrives as an injected, structurally typed interface (`HandoffChain`), wired only by the unit test.
 * It names no goal, Game Problem, context, Game Form, law or data id, and no sport word: every such value lives in its data file and test.
 */
import { classLabel, longDate, premiseStandingLabel, receivedOf, SIX_CLASSES, SixClass, sixClassOf, VALUE_LABELS } from './assembly'
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
    received: string
    replyOfDay?: string
    provisional: boolean
    scope: string | null
}

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

export interface TreatmentInput {
    id: string
    kind: string
    what: string
    effect: string
    why: string
    label: string
    contractId?: string
    itemIds?: string[]
    rulingRefs?: string[]
}

export interface ProposedManipulation {
    id: string
    purpose: string
    manipulation: string
    /** A TEST-ONLY stand-in for an authorized relationship (class 4, never knowledge), or absent. */
    relationship?: { ref: string; label: 'TEST ASSUMPTION'; why: string }
}

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
    illustrative: Array<{ id: string; what: string; value: string; how: string; rulingRefs: string[] }>
    testOnlyTreatments: TreatmentInput[]
    proposedManipulations: ProposedManipulation[]
    decisionKindOverrides: Array<{ path: string; kind: DecisionKind; contextual: boolean; rulingRefs: string[] }>
    notCarried: Array<{ id: string; what: string; rulingRefs: string[]; where: string; label: string }>
}

export interface GradingTables {
    sources: Array<{ id: string; markers: string[]; source: string; sourceStanding: string; knowledgeSource: string }>
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
                else if (key === 'rulingRef' && typeof x === 'string') refs.push(x)
                else walk(x)
            }
    }
    for (const [key, v] of Object.entries(c)) if (key !== 'rulings') walk(v)
    return [...new Set(refs)]
}

const CASE_KEYS = ['id', 'basedOn', 'label', 'resultStanding', 'goalId', 'form', 'session', 'purpose', 'chain', 'record', 'realization', 'rulings', 'suppliedChoices', 'standIns', 'illustrative', 'testOnlyTreatments', 'proposedManipulations', 'decisionKindOverrides', 'notCarried']
const RULING_KEYS = ['id', 'words', 'file', 'received', 'replyOfDay', 'provisional', 'scope']

/**
 * The review data, checked by hand and returned as a deep copy with every case's `basedOn` resolved (a case states only what differs from its
 * base; one level). Throws, naming every defect: unknown keys, a ruling without words, file or a real received date, a reference to a
 * ruling the file does not hold, a form basis outside the closed list, a stand-in without its label, a treatment without what, effect and
 * why, a supplied choice standing on no ruling that does not say it is ILLUSTRATIVE.
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
        let merged: Record<string, unknown> = c
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
            if (choice.standing === 'RULING') known(choice.rulingRef, `${at} supplied choice ${String(choice.lineId)}`)
            else if (choice.standing !== 'ILLUSTRATIVE' || choice.rulingRef !== null) errors.push(`${at}: supplied choice ${String(choice.lineId)} stands on no ruling and is not labelled ILLUSTRATIVE`)
        }
        for (const s of Array.isArray(merged.standIns) ? (merged.standIns as unknown[]) : []) {
            if (!isObject(s)) continue
            if (s.label !== 'ILLUSTRATIVE' && s.label !== 'TEST ASSUMPTION') errors.push(`${at}: stand-in ${String(s.id)} is labelled neither ILLUSTRATIVE nor TEST ASSUMPTION`)
            if (!filled(s.why) || !filled(s.contractId) || !isObject(s.item) || !filled(s.item.itemId) || !filled(s.item.value)) errors.push(`${at}: stand-in ${String(s.id)} must say why, name its contract and carry its item with an id and a value`)
        }
        for (const t of Array.isArray(merged.testOnlyTreatments) ? (merged.testOnlyTreatments as unknown[]) : []) {
            if (!isObject(t) || !filled(t.id) || !filled(t.what) || !filled(t.effect) || !filled(t.why) || !filled(t.label)) errors.push(`${at}: a TEST-ONLY treatment must say what, its effect, why and its label`)
            else if (t.kind === 'WITHHOLD_ITEMS' && (!filled(t.contractId) || !Array.isArray(t.itemIds) || !t.itemIds.length)) errors.push(`${at}: treatment ${t.id} withholds items and names none`)
        }
        for (const o of Array.isArray(merged.decisionKindOverrides) ? (merged.decisionKindOverrides as unknown[]) : []) {
            if (!isObject(o) || !filled(o.path) || (DECISION_KINDS as readonly string[]).indexOf(String(o.kind)) < 0) errors.push(`${at}: a decision-kind override names a path and one of ${DECISION_KINDS.join(', ')}`)
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
    supplement: boolean
    /** True where the case's realization declares REPORT: the harness then holds each owed law to the DRAFT materiality reading. */
    holdReportedLawsToMateriality: boolean
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
    /** NOT_ESTABLISHED */
    reason?: string
    /** ENTAILED / INSTANTIATION: the element class it belongs to. */
    classId?: string
    /** DERIVED geometry: the term that bounded its extent, where one did. */
    extentTerm?: string | null
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
        gameProblem: { status: string; gameProblemId: string | null; inferredFromWording: string | null } | null
        constraints: string[]
        affordanceLenses: string[]
    } | null
    contracts: Array<{ contractId: string; origin: 'KNOWLEDGE' | 'DRAFT_STORE' | 'REALIZATION'; items: Array<{ itemId: string; row: string; basis: string; category: string | null; basisEvidence: string }> }>
    lines: ChainLine[]
    sentences: ChainSentence[]
    /** True where the sentences are the served text; false where they are the review draft of a communication refusal; none otherwise. */
    sentencesServed: boolean | null
    withheld: Array<{ path: string; reason: string }>
    laws: { mode: string | null; owed: string[]; reportedForReview: string[] } | null
    requirementAccount: { status: string; contract: string | null; components: Array<[string, string]> } | null
    diagram: { served: boolean; verdict: string | null; area: unknown; counts: unknown; legend: unknown; zones: unknown[]; findings: unknown[] } | null
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
    manipulations: Array<{ id: string; purpose: string; manipulation: string; outcome: string; premise: Premise | null }>
    chain: null | {
        outcome: string
        stage: string | null
        summary: string | null
        reasons: string[]
        scorerPick: string | null
        contextComparison: string
        gameProblemComparison: string
        affordanceLenses: string
        constraints: string[]
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
    gaps: string[]
    purpose: null | { sourceEvidence: string; approvalEvidence: string; rulingRefs: string[] }
    rulings: Array<{ ref: string; entersAs: EntersAs; how: string; words: string[]; received: string; provisional: boolean; scope: string | null }>
    illustrative: Array<{ id: string; what: string; value: string; how: string; rulingRefs: string[] }>
    testOnlyTreatments: TreatmentInput[]
    standIns: Array<{ id: string; label: string; why: string; determines: string[] }>
    notCarried: CaseInput['notCarried']
    opportunities: string
    counts: { lines: number; byClass: Record<string, number>; byKind: Record<string, number>; sentences: number }
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
const citedWords = (r: HandoffRuling): string => `Christian, received ${receivedOf(r)}${r.provisional ? ' (provisional)' : ''}: ${r.words.map((w) => `"${w}"`).join(' ')}`
const citedAs = (r: HandoffRuling): string => `Christian's reply received ${receivedOf(r)}`

function receiveStep1(result: Stage1Result | null): HandoffResult['receive'] {
    if (!result) return { step1: null, step2: null, scopeSetBy: [] }
    const r = result.resolution
    const g = result.gameForm
    return {
        step1: {
            status: r.status,
            basis: r.gameProblems.basis,
            primary: [...r.gameProblems.primary],
            secondary: [...r.gameProblems.secondary],
            contextId: r.context?.rpcId ?? null,
            scope: r.gameProblems.scope,
            qualifier: r.gameProblems.qualifier,
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

function chainRequest(c: CaseInput, s1: Stage1Result | null, formId: string, inputs: HandoffInputs, appliedManipulations: string[]): ChainRequest {
    const contextId = s1?.resolution.context?.rpcId ?? null
    let records: ChainRequest['records'] = 'PRODUCTION'
    if (c.chain.records === 'TEST_ONLY') {
        if (!s1 || !c.record || !contextId) throw new Error(`case ${c.id}: a TEST-ONLY record needs Step 1's context and the case's record inputs`)
        const words = c.record.rulingRefs.flatMap((ref) => rulingOf(inputs, ref).words)
        const dated = c.record.rulingRefs.map((ref) => rulingOf(inputs, ref).received).sort()
        records = {
            learningGoalId: c.goalId as string,
            contextId,
            gameProblemId: s1.resolution.gameProblems.primary[0] ?? '',
            ruledOn: dated[dated.length - 1],
            by: c.record.by,
            ruling: words,
            authorizedConstraints: [...c.record.authorizedConstraints, ...appliedManipulations],
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
    const choices = c.suppliedChoices.map((ch) => ({
        lineId: ch.lineId,
        value: ch.value,
        because: ch.rulingRef ? citedWords(rulingOf(inputs, ch.rulingRef)) : `${VALUE_LABELS.ILLUSTRATIVE}: chosen among the alternatives the form authorizes, for this case only`,
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
        supplement: c.chain.supplement,
        holdReportedLawsToMateriality: c.realization?.lawsCheck.mode === 'REPORT',
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
    if (contract.origin === 'DRAFT_STORE') return premise('DRAFT_ITEM', ref, cited)
    if (contract.origin === 'REALIZATION') {
        const ownRealization = ctx.c.realization && contractId.endsWith(`:${ctx.c.realization.id}`)
        return premise('REALIZATION_ITEM', ref, { provisional: true, note: ownRealization ? 'a TEST-ONLY realization of this case, in Christian\'s words' : 'a production provisional realization, in Christian\'s words' })
    }
    if (item.basis === 'ASSUMED') return premise('ASSUMED_ITEM', ref, cited)
    if (item.basis === 'ENGINE_ONLY') return premise('ENGINE_ONLY_ITEM', ref)
    if (item.basis === 'OWNER_RULING') return premise('KNOWLEDGE_RULING_ITEM', ref)
    if (item.basis === 'AUTHORED') return premise('RESTATED_ITEM', ref, { label: `our restatement of ${cited.source}`, ...cited })
    return premise('UNRESOLVED', `${ref}: basis ${item.basis} has no reading in the grading map`)
}

/**
 * The sources an item's evidence cites, read from the grading table's markers (a file name, or a row prefix the source alone uses), each with
 * its own standing; where the evidence cites none the table knows, it says so rather than guessing one.
 */
function sourcesCited(ctx: GradingContext, evidence: string): { source: string; sourceStanding: string } {
    const found = ctx.inputs.grading.sources.filter((s) => s.markers.some((m) => evidence.indexOf(m) >= 0))
    if (!found.length) return { source: 'the restated object (its evidence names no source the grading table knows)', sourceStanding: 'not recorded' }
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
        if (line.extentTerm) {
            const standIn = ctx.standInByTerm.get(line.extentTerm)
            if (standIn) premises.push(premise('STAND_IN', `${standIn.contractId} ${standIn.item.itemId} (TEST-ONLY stand-in ${standIn.id}): the extent`, { standing: standIn.label, label: standIn.label === 'ILLUSTRATIVE' ? VALUE_LABELS.ILLUSTRATIVE : standIn.label, note: standIn.why }))
            else note = `its extent is bounded by the term '${line.extentTerm}', which no stand-in of the case declares`
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
            if (departure) {
                const provisional = departure.rulingRefs.some((ref) => rulingOf(ctx.inputs, ref).provisional)
                premises.push(premise('LAW_DEPARTURE', `${line.law} departed from, ${departure.extent}, on ${departure.rulingRefs.join(', ')}`, { provisional }))
            } else premises.push(premise('LAW_DEPARTURE', `${line.law} departed from on a production provisional realization`, { provisional: true }))
        } else if (line.lawStatus === 'DEPARTED') {
            premises.push(premise('REALIZATION_ITEM', `${line.law} departed from by a provisional realization's items`, { provisional: true }))
        } else if (line.lawStatus === 'ADAPTATION_OWED') {
            premises.push(premise('UNRESOLVED', `${line.law}: an adaptation is owed (the laws account names why)`))
        } else {
            premises.push(premise('LAWS_DEFAULT_PRINCIPLE', `the Laws apply by default (${principle.id}, received ${longDate(principle.received)})`))
            premises.push(premise('LAWS_ENCODING', `${line.law} ${line.lawStatus}: ${ctx.inputs.grading.lawsDefault.encoding}`))
        }
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

// ---------------------------------------------------------------------------------------------------------------------------------------
// The run
// ---------------------------------------------------------------------------------------------------------------------------------------

/** One case through the handoff: Receive, Determine the form, Manipulations, Chain request, Determine and Produce, Preserve. */
export function runHandoff(c: CaseInput, inputs: HandoffInputs, chain: HandoffChain, knowledge: DesignKnowledge = committedKnowledge()): HandoffResult {
    const s1 = c.goalId ? runStage1(c.goalId, knowledge) : null
    const receive = receiveStep1(s1)
    if (c.record) receive.scopeSetBy = c.record.gameProblemScopeRefs.map((ref) => {
        const r = rulingOf(inputs, ref)
        return `${r.id} (received ${receivedOf(r)}; scope ${r.scope ?? 'none stated'}): sets the scope only, decides nothing`
    })
    const form = determineForm(c, s1, inputs)
    const rulings = c.rulings.map((entry) => {
        const r = rulingOf(inputs, entry.ref)
        return { ref: entry.ref, entersAs: entry.entersAs, how: entry.how, words: [...r.words], received: receivedOf(r), provisional: r.provisional, scope: r.scope }
    })
    // Manipulations: applied only with an authorized relationship; in a test only, a labelled TEST-ONLY stand-in for one (class 4).
    const applied: string[] = []
    const manipulations = c.proposedManipulations.map((m) => {
        if (m.relationship && m.relationship.label === 'TEST ASSUMPTION') {
            applied.push(m.manipulation)
            return { id: m.id, purpose: m.purpose, manipulation: m.manipulation, outcome: `applied on a TEST-ONLY stand-in relationship (${m.relationship.ref}), never knowledge`, premise: premise('STAND_IN', m.relationship.ref, { standing: 'TEST ASSUMPTION', label: 'TEST ASSUMPTION', note: m.relationship.why }) }
        }
        return { id: m.id, purpose: m.purpose, manipulation: m.manipulation, outcome: `no authorized relationship: ${m.purpose} to ${m.manipulation}; the configuration is unchanged`, premise: null }
    })
    const base = {
        caseId: c.id,
        label: c.label,
        resultStanding: c.resultStanding,
        goalId: c.goalId,
        receive,
        form,
        manipulations,
        purpose: c.purpose ? deepCopy(c.purpose) : null,
        rulings,
        illustrative: deepCopy(c.illustrative),
        testOnlyTreatments: deepCopy(c.testOnlyTreatments),
        notCarried: deepCopy(c.notCarried),
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
            gaps: [form.stop ?? 'no form'],
            standIns: c.standIns.map((x) => ({ id: x.id, label: x.label, why: x.why, determines: [] })),
            counts: { lines: 0, byClass: {}, byKind: {}, sentences: 0 },
        }
    }
    const request = chainRequest(c, s1, form.formId, inputs, applied)
    const answer = chain.build(request)
    const ctx: GradingContext = {
        c,
        inputs,
        answer,
        standInByItem: new Map(c.standIns.map((x) => [x.item.itemId, x])),
        standInByTerm: new Map(c.standIns.map((x) => [x.item.value, x])),
    }
    const lines: GradedLine[] = answer.lines.map((line) => {
        const { premises, note } = linePremises(ctx, line)
        const grade = gradeOf(premises)
        const kind = decisionKindOf(line, premises, c.decisionKindOverrides)
        return { lineId: line.lineId, path: line.path, kind: line.kind, value: line.value, premises, sixClass: grade.sixClass, label: grade.label, decisionKind: kind.kind, decisionKindContextual: kind.contextual, note }
    })
    const sentences = answer.sentences.map((s) => gradeSentence(ctx, s, lines))
    const scorer = answer.scorerPick
    const step1Context = receive.step1?.contextId ?? null
    const chainContext = answer.account?.contextId ?? null
    const gp = answer.account?.gameProblem ?? null
    const step1Gp = receive.step1 ? `primary ${receive.step1.primary.join(', ') || 'none'}, secondary ${receive.step1.secondary.join(', ') || 'none'}` : 'none (structural case)'
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
            scorerPick: scorer === null ? null : `${scorer.join(', ') || 'none'} (the chain's own keyword-scorer pick: not used; the handoff placed ${form.formId})`,
            contextComparison:
                step1Context === null
                    ? `structural case: no Step 1 context; the chain's account reads ${chainContext ?? 'none'}`
                    : chainContext === step1Context
                      ? `the chain's context equals Step 1's (${step1Context})`
                      : `MISMATCH: Step 1 resolves ${step1Context}; the chain's account reads ${chainContext ?? 'none'} (reported, never switched)`,
            gameProblemComparison: gp
                ? `the chain's account reads ${gp.status} ${gp.gameProblemId ?? 'none'}${gp.inferredFromWording ? ` (inferred from wording: ${gp.inferredFromWording})` : ''}; Step 1: ${step1Gp}; no line of the chain reads a Game Problem; a difference is reported, never switched`
                : `the chain's account carries no Game Problem; Step 1: ${step1Gp}`,
            affordanceLenses: answer.account && answer.account.affordanceLenses.length ? `${answer.account.affordanceLenses.join('; ')}: the chain's vocabulary lenses, not contracted knowledge, not a selection` : 'none',
            constraints: answer.account ? [...answer.account.constraints] : [],
        },
        lines,
        sentences,
        sentencesServed: answer.sentencesServed,
        withheld: deepCopy(answer.withheld),
        laws: deepCopy(answer.laws),
        lawEntries: answer.lines.filter((l) => l.kind === 'LAW' && l.path.indexOf('.laws[') > 0).map((l) => ({ lineId: l.lineId, law: String(l.law), status: String(l.lawStatus), removedByRealization: l.removedByRealization === true })),
        requirementAccount: deepCopy(answer.requirementAccount),
        diagram: deepCopy(answer.diagram),
        refusal: answer.outcome === 'refused' ? { stage: String(answer.stage), reasons: [...answer.reasons] } : null,
        gaps,
        standIns: c.standIns.map((x) => ({ id: x.id, label: x.label, why: x.why, determines: lines.filter((l) => l.premises.some((p) => p.kind === 'STAND_IN' && p.ref.indexOf(x.id) >= 0)).map((l) => l.lineId) })),
        counts: { lines: lines.length, byClass, byKind, sentences: sentences.length },
    }
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
