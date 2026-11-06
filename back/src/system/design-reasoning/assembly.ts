/**
 * **The bounded activity-assembly experiment: validation, assembly, Christian's six classes, the requirement account and the coach-text join** —
 * review pathway only, offline (Christian's second reply of 5 November 2026: *"I authorize a bounded, offline, review-only
 * activity-assembly experiment"* / *"Where a choice cannot be authorized, an illustrative value may be used for this offline prototype if
 * clearly labeled and kept outside production selection authority."* / *"Please distinguish what actually determined the configuration from
 * material merely consulted or cited."*).
 *
 * WHAT IT IS. The architecture has no configuration step (Steps 3-5 are held). So the configuration is a labelled decision record we
 * entered (`assembly-experiment.review.json`): each value carries a declared standing, the items that decided it (Christian's words with the exact
 * substring that states the value, a knowledge cell, or, for a value Christian's words do not state, our own illustrative choice or our own
 * reading) and what was only consulted. Three roles are never decisive and are printed as what they are: Christian's words that PERMIT an
 * illustrative value (permittedBy), Christian's words an OURS value is OUR READING of (readingOf), and Christian's words that SET THE SCOPE a computed
 * value is used in (scopeSetBy). Some values are read from knowledge by code (the Game Problems and compatible Game Forms the Stage 1/2
 * code computes, and a few knowledge cells). This file:
 *   - validates the record by hand (unknown keys and wrong types at every level, unknown standings, missing words, file or a received date
 *     that is not a real date, missing value evidence, a number Christian's words state that is not the number Christian's evidence's word gives, Christian's
 *     example words or reference-only material among what decided a value, a declared status stronger than what decided it, a malformed
 *     placeholder, a quotation mark in a template that quotes nothing: each throws);
 *   - assembles the activity, failing closed where the record disagrees with what the code computes (Step 1 unresolved; the illustrative
 *     form not among the compatible ones; Game Problem ids that differ from the ones Christian's words name; a scoring event the routed context
 *     does not hold);
 *   - places each decision in one of Christian's six classes, in Christian's order, as the weakest over what decided it and its declared status;
 *   - joins the requirement account (Christian's four categories; category 3 never counts as satisfied);
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
import { activeContextRelationships, cell, Cite, contextIdentityRules, contextProperty, DesignKnowledge, isStanding, OpenDecision, RelationshipRow, Ruling, SOURCE, sourceStanding, Standing } from './knowledge'
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
    ENTERED_EVIDENCED: 'ENTERED, VALUE EVIDENCED IN CHRISTIAN\'S WORDS',
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

/**
 * What decided a value: one of Christian's rulings or a knowledge cell (each with the exact words that state the value), or one of three bare
 * items that state where no authority decided it: our illustrative choice, our own reading, or no authorized value at all.
 */
export interface DecisiveItem {
    rulingRef?: string
    knowledgeRef?: KnowledgeRef
    ref?: 'UNRESOLVED' | 'ILLUSTRATIVE' | 'OURS'
    standing: Standing
    valueEvidence?: string
}

/** The bare decisive items, each with the only standing it may carry. */
export const BARE_DECISIVE: Record<NonNullable<DecisiveItem['ref']>, Standing> = { UNRESOLVED: 'UNRESOLVED', ILLUSTRATIVE: 'ILLUSTRATIVE', OURS: 'OURS' }

/** Christian's words in a non-decisive role (permittedBy, readingOf, scopeSetBy): the ruling and the exact words quoted. */
export interface RoleItem {
    rulingRef: string
    quote: string
    /** permittedBy only: Christian's permission names this very value (it is still our choice to use it). */
    namesValue?: true
}

/** The three non-decisive roles Christian's words can play beside a value, as the report prints them. */
export const ROLES = ['permittedBy', 'readingOf', 'scopeSetBy'] as const
export type Role = (typeof ROLES)[number]

/** What kind of words a registry entry holds (Christian's words are not all rulings). */
export const RULING_KINDS = ['RULING', 'QUESTION', 'OBSERVATION', 'HYPOTHETICAL', 'DEFINITION'] as const
export type RulingKind = (typeof RULING_KINDS)[number]

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
    /** A number Christian's words state: the word Christian's evidence uses for it ("Two"); the validator requires it to give the value. */
    evidenceStates?: string
    declaredStatus: Standing
    howReached: HowReached
    readBy?: ReadBy
    knowledgeRef?: KnowledgeRef
    decidedBy: DecisiveItem[]
    consulted: ConsultedItem[]
    statusSetBy: Array<{ rulingRef: string }>
    /** Christian's words permitting an ILLUSTRATIVE value (never decisive: the value is our choice). */
    permittedBy?: RoleItem[]
    /** Christian's words an OURS value is our reading of (never decisive: the reading is ours). */
    readingOf?: RoleItem[]
    /** Christian's words setting the scope a computed value is used in, in this experiment (never decisive). */
    scopeSetBy?: RoleItem[]
    note: string
}

export interface AssemblyRuling extends Ruling {
    received: string
    file: string
    provisional: boolean
    kind: RulingKind
    /** Christian's words made the item owner-authored canonical knowledge: a decisive item citing it may carry APPROVED. */
    establishesCanonicalKnowledge?: true
    /** The values Christian's scope words are said of, where the entry decides several and the scope words qualify only some (our reading). */
    scopePaths?: string[]
}

export interface AccountEntry {
    id: string
    requirementRef: { table: string; row: string }
    clause: string | null
    reading: string | null
    /** One of Christian's four categories, or the record's marker for a clause that is no requirement under its reading. */
    category: string
    standard: string
    paths: string[]
    observableConditions: string | null
    /** Category 3 only: whether the observable conditions are in the coach guidance. */
    inCoachGuidance?: boolean
    note: string
}

export type OpenDecisionClass = 'ASSEMBLY' | 'SCORING_FIDELITY_OR_PRODUCTION' | 'SUITABILITY' | 'NON_BLOCKING' | 'OUR_READING' | 'KNOWN_RISK'
export const OPEN_DECISION_CLASSES: OpenDecisionClass[] = ['ASSEMBLY', 'SCORING_FIDELITY_OR_PRODUCTION', 'SUITABILITY', 'NON_BLOCKING', 'OUR_READING', 'KNOWN_RISK']

export type ReportRefKey = 'experimentPurpose' | 'acceptance' | 'limits' | 'caveat' | 'futureFeedbackQuestion' | 'lawsPrinciple' | 'diagram' | 'sixClasses' | 'diagnostic' | 'provenanceRuling' | 'diagramRuling'
export const REPORT_REF_KEYS: ReportRefKey[] = ['experimentPurpose', 'acceptance', 'limits', 'caveat', 'futureFeedbackQuestion', 'lawsPrinciple', 'diagram', 'sixClasses', 'diagnostic', 'provenanceRuling', 'diagramRuling']

export type BindingKey =
    | 'illustrativeForm'
    | 'scoringEvent'
    | 'scoringMeans'
    | 'teamCount'
    | 'playersPerTeam'
    | 'areaLength'
    | 'areaWidth'
    | 'targetZoneDepth'
    | 'targetZonePlacement'
    // The DRAFT diagram's further reads (Christian's reply of 6 November, section 9): it reads paths only through these.
    | 'includesEndZones'
    | 'equalNumbers'
    | 'keepers'
    | 'keepersCounted'
    | 'halfwayLine'
    | 'centreMark'
    | 'markers'
    | 'attackDirections'
    | 'bibs'
    | 'startMethod'
    | 'startDistance'
    | 'targetZonePositioning'
    | 'gameFormAlternatives'
export const BINDING_KEYS: BindingKey[] = [
    'illustrativeForm', 'scoringEvent', 'scoringMeans', 'teamCount', 'playersPerTeam', 'areaLength', 'areaWidth', 'targetZoneDepth', 'targetZonePlacement',
    'includesEndZones', 'equalNumbers', 'keepers', 'keepersCounted', 'halfwayLine', 'centreMark', 'markers', 'attackDirections', 'bibs', 'startMethod', 'startDistance', 'targetZonePositioning', 'gameFormAlternatives',
]

/** Where a placement value puts its target zones, for the DRAFT diagram only (data, labelled OURS; an unmapped placement throws). */
export interface PlacementGeometry {
    standing: string
    zones: Array<{ along: 'FROM_START' | 'FROM_END' }>
    across: 'FULL_WIDTH'
}

export interface Experiment {
    standing: string
    learningGoalId: string
    /** The controlled vocabulary the scoring event's description is read from (a name in the data, never a literal in code). */
    scoringEventVocabulary: string
    gameForm: { illustrativeChoice: string; standing: Standing; rulingRefs: string[]; choicePath: string }
    gameProblemScope: { primaryGameProblemIds: string[]; secondaryGameProblemIds: string[]; rulingRefs: string[]; idResolution: string; note: string }
    /** The words the report quotes in fixed places, each with the exact quote (limits prints every sentence of its ruling). */
    reportRefs: Record<ReportRefKey, { rulingRef: string; quote?: string }>
    bindings: Record<BindingKey, string>
    /** How many target zones each placement value means (read by code; an unmapped placement throws). */
    placementZoneCount: Record<string, number>
    /** Where each placement value puts its zones (OURS, data), read by the DRAFT diagram only; one entry per placement the count maps. */
    placementGeometry: Record<string, PlacementGeometry>
    derived: Array<{ id: string; formula: 'AREA_PER_PLAYER_TOTAL' | 'AREA_PER_PLAYER_OUTSIDE_TARGET_ZONES'; label: string; note: string }>
    rulings: AssemblyRuling[]
    requiredPartsRulingRef: string
    requiredParts: Array<{ id: string; part: string; paths: string[]; generatedFromTrace?: true }>
    designBlockPaths: string[]
    /** Our short summary of why this design, each sentence naming the values it rests on (their weakest class is its marker). */
    whyThisDesign: Array<{ text: string; paths: string[] }>
    exemptions: Array<{ path: string; reason: string; nonActivity?: true }>
    choices: Choice[]
    laws: Array<{ lawId: string | null; situation?: string; status: 'APPLIES' | 'DEPARTED' | 'NOT APPLICABLE' | 'ADAPTATION OWED'; paths: string[]; reason: string }>
    contractItems: Array<{ itemId: string; mappedTo: string[]; notUsed?: string }>
    contractDeclarationsReported: Array<{ row: string; declaration: string; what: string; how: string }>
    requirementAccountRulingRef: string
    accountCategories: string[]
    accountStandards: string[]
    accountOutsideCategories: string
    requirementAccount: AccountEntry[]
    suitability: {
        standing: string
        properties: Array<{ property: string; structural: { status: 'EXPRESSED_BY_CONFIGURATION' | 'NOT_SUPPLIED'; paths: string[]; rows: string[] }; functional: { status: 'ONLY_VERIFIABLE_IN_PLAY' }; note: string }>
        scale: { status: string; statement: string; openDecision: string }
        exposure: Array<{ aspect: string; status: string }>
        identityPoint: { statement: string; rows: string[] }
        scopeTension: { statement: string; rulingRefs: string[] }
        addNothing: { status: string; statement: string; rulingRef: string; quote: string }
        reviewPoints: Array<{ id: string; statement: string; rulingRefs: string[] }>
    }
    scenarios: {
        standing: string
        rulingRef: string
        rulesRef: string
        circumstances: Array<{ key: string; label: string }>
        scopeCircumstance: { key: string; holdsWhen: boolean; rulingRefs: string[]; whenNotEstablished: string }
        insufficientWhen: Array<{ key: string; value: boolean }>
        requirementLink: { requirementId: string; circumstanceKey: string; engagesWhen: boolean; rulingRefs: string[]; report: string }
        uncertaintyReport: string
        widthCheck: { note: string }
        items: Array<{ id: string; words: string; configuredActivity: Record<string, { value: boolean | 'NOT_SUPPLIED'; label: string }>; expected: { mismatchReported: boolean; uncertaintyReported: boolean; scopeEstablished: boolean } }>
    }
    reconciliations: Array<{ id: string; title: string; rulingRefs: string[]; showPaths?: string[]; items: string[]; smallest?: string }>
    /** An answered decision keeps its id (traceability) and names the ruling that answered it; it is printed apart, never as open. */
    openDecisions: Array<{ id: string; blocks: OpenDecisionClass; question: string; rulingRefs: string[]; handling: string; answeredBy?: { rulingRef: string; statement: string } }>
    /** Every value, premise or open decision a reply of Christian's retired or changed: before, after, the reply's lines, the date. */
    changeLog: Array<{ path: string; before: string; after: string; n6Lines: string; date: string }>
    /** An examination Christian asked for, printed in the review copy (ours: every cell a reading of the record's geometry). */
    restartExamination: { standing: string; rulingRefs: string[]; cases: string; columns: string[]; rows: Array<{ id: string; candidate: string; cells: string[] }>; verdict: string; stillFlagged: string; reviewNotes: string[] }
    /** Readings of ours that sit inside a ruling's or a cell's printed text, each with the values it bears on. */
    readingsInsidePremises: { question: string; items: Array<{ id: string; reading: string; paths: string[]; premise: string }> }
    reconciliation: { rulingRef: string; assessmentItems: Array<{ item: string; carriedBy: string }>; reuse: Array<{ work: string; status: string; why: string }>; stillOpen: string[] }
    dependencies: Array<{ id: string; what: string; options: string }>
    secondGoalNeeds: string[]
}

/** A template's wording status (RC3 6.1): approved word for word, an abbreviated presentation derived from approved wording, or newly proposed. */
export const WORDING_STATUSES = ['APPROVED CANONICAL', 'ABBREVIATED FROM APPROVED WORDING', 'NEWLY PROPOSED'] as const
export type WordingStatus = (typeof WORDING_STATUSES)[number]

export interface WordingTemplate {
    id: string
    section: string
    text: string
    expresses: string[]
    whenValue?: Record<string, ChoiceValue>
    status: WordingStatus
    quote?: { rulingRef: string }
    /** A sentence of ours that quotes words of Christian's inside it: each double-quoted span must be verbatim in that ruling's words. */
    quotesWithin?: { rulingRef: string }
    /** A review disclosure: shown in the review copy, marked, and dropped from a coach copy. */
    reviewOnly?: true
    /** The template belongs to this goal (GOAL) or its context (CONTEXT), not to the Game Form level: a second goal rewrites it. */
    scope?: 'GOAL' | 'CONTEXT'
}

/**
 * The DRAFT diagram's words (Christian's reply of 6 November, section 9): every word the drawing prints, by binding key, never by path. A
 * `{binding}` placeholder is filled with the value the binding names; `{goal}` in the banner with the record's goal id.
 */
export interface DiagramWords {
    standing: string
    banner: string
    /** Drawing labels only (the record names no team). */
    teamLabels: string[]
    /** Which way each drawing label's arrow points: presentation (OURS), flagged; the record does not say which team attacks which end. */
    teamAttacks: Array<'TOWARD_END' | 'TOWARD_START'>
    teamCount: string
    zonePlaceholder: string
    caption: string
    flagsTitle: string
    flags: string[]
    notDrawnTitle: string
    notDrawn: Array<{ what: string; why: string }>
    keyTitle: string
    /** One key line per value drawn, in order. */
    elements: Array<{ binding: BindingKey; name: string }>
    valueWords: Partial<Record<BindingKey, Record<string, string>>>
    units: Partial<Record<BindingKey, string>>
    noValue: string
    computed: { halfway: string; centre: string }
    measuredContext: string
}

export interface Wording {
    standing: string
    keyedFor: { gameForm: string; scoringEvent: string; note: string }
    coachTerms: { targetZone: string; markedLine: string; source: string }
    sections: Array<{ id: string; level: 'Coach Overview' | 'Coach Details'; title: string; rc3: string }>
    templates: WordingTemplate[]
    diagram: DiagramWords
}

const DIAGRAM_WORD_KEYS = ['standing', 'banner', 'teamLabels', 'teamAttacks', 'teamCount', 'zonePlaceholder', 'caption', 'flagsTitle', 'flags', 'notDrawnTitle', 'notDrawn', 'keyTitle', 'elements', 'valueWords', 'units', 'noValue', 'computed', 'measuredContext']

/** The diagram words, validated by hand: known keys only, strings where strings belong, bindings that exist, no quotation mark. */
function validateDiagramWords(where: string, raw: unknown): void {
    const d = onlyKeys(where, raw, DIAGRAM_WORD_KEYS, DIAGRAM_WORD_KEYS)
    const strings: string[] = []
    for (const key of ['standing', 'banner', 'teamCount', 'zonePlaceholder', 'caption', 'flagsTitle', 'notDrawnTitle', 'keyTitle', 'noValue', 'measuredContext']) {
        if (!isString(d[key])) throw new Error(`${where}.${key}: must be a string`)
        strings.push(d[key] as string)
    }
    if (!isStringList(d.teamLabels) || (d.teamLabels as string[]).length < 2 || !isStringList(d.flags)) throw new Error(`${where}: teamLabels (two or more) and flags are lists of strings`)
    strings.push(...(d.teamLabels as string[]), ...(d.flags as string[]))
    const attacks = d.teamAttacks as unknown[]
    if (!Array.isArray(attacks) || attacks.length !== (d.teamLabels as string[]).length || !attacks.every((a) => a === 'TOWARD_END' || a === 'TOWARD_START') || new Set(attacks).size !== 2) throw new Error(`${where}.teamAttacks: one direction per team label, both directions used`)
    ;(d.notDrawn as unknown[]).forEach((n, i) => {
        const o = onlyKeys(`${where}.notDrawn[${i}]`, n, ['what', 'why'], ['what', 'why'])
        if (!isString(o.what) || !isString(o.why)) throw new Error(`${where}.notDrawn[${i}]: what and why are strings`)
        strings.push(o.what as string, o.why as string)
    })
    const bindings = new Set<string>()
    ;(d.elements as unknown[]).forEach((e, i) => {
        const o = onlyKeys(`${where}.elements[${i}]`, e, ['binding', 'name'], ['binding', 'name'])
        if (BINDING_KEYS.indexOf(o.binding as BindingKey) < 0 || bindings.has(o.binding as string)) throw new Error(`${where}.elements[${i}]: a binding key, listed once`)
        bindings.add(o.binding as string)
        if (!isString(o.name)) throw new Error(`${where}.elements[${i}]: name must be a string`)
        strings.push(o.name as string)
    })
    for (const key of ['valueWords', 'units']) {
        if (!isObject(d[key])) throw new Error(`${where}.${key}: an object keyed by binding`)
        for (const [b, v] of Object.entries(d[key] as Record<string, unknown>)) {
            if (BINDING_KEYS.indexOf(b as BindingKey) < 0) throw new Error(`${where}.${key}.${b}: not a binding key`)
            if (key === 'units' && !isString(v)) throw new Error(`${where}.units.${b}: must be a string`)
            if (key === 'valueWords' && (!isObject(v) || !Object.values(v).every(isString))) throw new Error(`${where}.valueWords.${b}: maps values to words`)
            if (key === 'valueWords') strings.push(...Object.values(v as Record<string, string>))
        }
    }
    const computed = onlyKeys(`${where}.computed`, d.computed, ['halfway', 'centre'], ['halfway', 'centre'])
    if (!isString(computed.halfway) || !isString(computed.centre)) throw new Error(`${where}.computed: halfway and centre are strings`)
    // The drawing quotes nothing: a double quotation mark would present words as Christian's that no check verifies.
    for (const s of strings) if (s.indexOf('"') >= 0) throw new Error(`${where}: a quotation mark in a diagram word (${s.slice(0, 40)})`)
}

// An open decision of the experiment reuses the Stage 1/2 shape where it fits: the question, Christian's words (by reference) and the handling.
export type AssemblyOpenDecision = Pick<OpenDecision, 'id' | 'question' | 'handling'> & { blocks: Experiment['openDecisions'][number]['blocks']; rulingRefs: string[] }

const deepCopy = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

/** The committed experiment record, a fresh deep copy each call (unvalidated: pass it to `validateExperiment`). */
export const committedExperimentData = (): unknown => deepCopy(experimentData)
/** The committed DRAFT wording, a fresh deep copy each call (unvalidated: pass it to `validateWording`). */
export const committedWordingData = (): unknown => deepCopy(wordingData)

// ---------------------------------------------------------------------------------------------------------------------------------------
// Christian's six classes, in Christian's order (AUTH: "For every material design choice, identify whether it follows from: ...")
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

/** Each standing's class when it decides something. PROVISIONAL (Christian's example words) and REFERENCE ONLY never decide: they throw. */
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

/** How a standing is printed. The code's PROVISIONAL is Christian's words given as an example, never Christian's provisional decisions. */
export const standingLabel = (s: Standing): string => (s === 'PROVISIONAL' ? 'CHRISTIAN\'S EXAMPLE WORDS (PROVISIONAL)' : s)

export interface ClassInput {
    standing: Standing
    provisional?: boolean
}

/**
 * Christian's class for one decision: the weakest, in Christian's order, over every decisive item and the declared status. A RULING whose ruling Christian called
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

/** Christian's class with Christian's words, without their closing full stop (so it reads inside a sentence). */
export const classLabel = (c: SixClass): string => `class ${c}: ${SIX_CLASSES[c - 1].slice(0, -1)}`

/**
 * Christian's reply of 6 November, section 7: a missing value, our logical interpretation and an illustrative choice "have different
 * implications for future authorization", so each is labelled apart (our labels, with what each implies), and a value a premise of
 * authority determines is labelled by its weakest determining premise's standing.
 */
export const VALUE_LABELS = {
    UNRESOLVED: 'UNRESOLVED: no authorized value; needs a knowledge decision',
    OURS: 'OURS: LOGICAL INFERENCE (our reading, not canonical; needs Christian\'s confirmation)',
    ILLUSTRATIVE: 'ILLUSTRATIVE (for this offline test only; to be replaced before any production use)',
} as const

/** One determining premise: what it is, its standing and whether its ruling is provisional (the flag the class computation used). */
export interface PremiseItem {
    ref: string
    standing: Standing
    provisional: boolean
}
/** A determining premise's standing as printed: its standing, with ', provisional' where its ruling is. */
export const premiseStandingLabel = (p: { standing: Standing; provisional: boolean }): string => `${standingLabel(p.standing)}${p.provisional ? ', provisional' : ''}`

export interface Premises {
    /** The determining premise(s) of the weakest class among them, each with that class. */
    weakest: Array<PremiseItem & { sixClass: SixClass }>
    /** The other determining premises, counted by their printed standing. */
    rest: Record<string, number>
}

/** The weakest determining premise(s) of a value, by class, and a tally of the rest by standing (the overall class never hides them). */
export function premisesOf(decisive: PremiseItem[]): Premises {
    const withClass = decisive.map((p) => ({ ...p, sixClass: sixClassOf([{ standing: p.standing, provisional: p.provisional }]) }))
    const worst = withClass.length ? Math.max(...withClass.map((p) => p.sixClass)) : 0
    const rest: Record<string, number> = {}
    for (const p of withClass.filter((x) => x.sixClass !== worst)) rest[premiseStandingLabel(p)] = (rest[premiseStandingLabel(p)] ?? 0) + 1
    return { weakest: withClass.filter((x) => x.sixClass === worst), rest }
}

/**
 * A value's label, from how it reached the activity: UNRESOLVED, OURS or ILLUSTRATIVE by Christian's three kinds; otherwise the standing of
 * its weakest determining premise (', provisional' where its ruling is). The one function every printed class uses.
 */
export function valueLabel(howReached: HowReached, premises: Premises, sixClass: SixClass, declared: Standing): string {
    if (howReached === 'UNRESOLVED') return VALUE_LABELS.UNRESOLVED
    if (howReached === 'ENTERED_OUR_INFERENCE') return VALUE_LABELS.OURS
    if (howReached === 'ENTERED_ILLUSTRATIVE') return VALUE_LABELS.ILLUSTRATIVE
    const weakest = premises.weakest
    if (!weakest.length || weakest[0].sixClass < sixClass) return sixClass === 6 ? 'LOGICAL INFERENCE (computed by the Stage 1/2 code)' : `declared ${standingLabel(declared)}`
    return [...new Set(weakest.map(premiseStandingLabel))].join(' / ')
}

/** A value's class with its label: Christian's words for the class, then the label. */
export const classAndLabel = (c: { sixClass: SixClass; label: string }): string => `${classLabel(c.sixClass)}; ${c.label}`

/** The weakest determining premise(s) named, and the rest tallied, in words. */
export const premisesWords = (p: Premises): string => {
    const weakest = p.weakest.map((x) => `${x.ref} [${premiseStandingLabel(x)}]`).join('; ')
    const rest = Object.entries(p.rest).map(([s, n]) => `${n} ${s}`).join(', ')
    return `weakest determining premise${p.weakest.length === 1 ? '' : 's'}: ${weakest || 'none'}; the rest: ${rest || 'none'}`
}

const DATE_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
/** A YYYY-MM-DD date as "5 November 2026". */
export const longDate = (iso: string): string => `${Number(iso.slice(8, 10))} ${DATE_MONTHS[Number(iso.slice(5, 7)) - 1]} ${iso.slice(0, 4)}`

/** The marker a review-copy sentence carries: the weakest class among the values it expresses (class 1 unmarked). */
export function markerOf(c: SixClass | null): string {
    if (c === null) return '[review note]'
    if (c === 1) return ''
    return `[${classLabel(c)}]`
}

/**
 * A sentence's marker from the classes and labels of the values it expresses: the weakest class, with the label where every value has the
 * same class and label; where they differ in either, each value's class and label too (so a sentence is never read as wholly as weak, or
 * as strong, as one of its values, and an inference is never read as a missing value). A review-only sentence says so.
 */
export function sentenceMarker(classes: Array<{ path: string; sixClass: SixClass; label?: string }>, reviewOnly = false): string {
    const weakest = classes.length ? (Math.max(...classes.map((c) => c.sixClass)) as SixClass) : null
    const distinct = new Set(classes.map((c) => `${c.sixClass}|${c.label ?? ''}`))
    let marker = markerOf(weakest)
    if (distinct.size === 1 && marker && classes[0].label) marker = `${marker.slice(0, -1)}; ${classes[0].label}]`
    if (distinct.size > 1 && marker) marker = `${marker.slice(0, -1)}; by value: ${classes.map((c) => `${c.path} class ${c.sixClass}${c.label ? ` (${c.label})` : ''}`).join(', ')}]`
    if (reviewOnly) marker = `${marker ? `${marker} ` : ''}(review only: dropped from a coach copy)`
    return marker
}

// ---------------------------------------------------------------------------------------------------------------------------------------
// Hand-written validation
// ---------------------------------------------------------------------------------------------------------------------------------------

const fail = (where: string, why: string): never => {
    throw new Error(`assembly-experiment.review.json ${where}: ${why}`)
}
const isObject = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === 'object' && !Array.isArray(v)
const isString = (v: unknown): v is string => typeof v === 'string' && v.length > 0
/** A real calendar date written YYYY-MM-DD (a date that does not exist, such as 30 February, is refused rather than rolled over). */
const isDate = (v: unknown): boolean => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(`${v}T12:00:00Z`)) && new Date(`${v}T12:00:00Z`).toISOString().slice(0, 10) === v
const isStringList = (v: unknown): v is string[] => Array.isArray(v) && v.every(isString)

/**
 * A numeric value Christian's words state, read from the word Christian's evidence uses for it ("Two", or digits). Words up to twenty, in lower case or
 * with a capital first letter; anything else is not a number word and gives null.
 */
const NUMBER_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty']
export function statedNumber(word: string): number | null {
    if (/^\d+(\.\d+)?$/.test(word)) return Number(word)
    const i = NUMBER_WORDS.findIndex((w) => w === word || `${w.charAt(0).toUpperCase()}${w.slice(1)}` === word)
    return i >= 0 ? i : null
}

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
    'standing', 'learningGoalId', 'scoringEventVocabulary', 'gameForm', 'gameProblemScope', 'reportRefs', 'bindings', 'placementZoneCount', 'derived', 'rulings', 'requiredPartsRulingRef',
    'requiredParts', 'designBlockPaths', 'whyThisDesign', 'exemptions', 'choices', 'laws', 'contractItems', 'contractDeclarationsReported', 'requirementAccountRulingRef',
    'accountCategories', 'accountStandards', 'accountOutsideCategories', 'requirementAccount', 'suitability', 'scenarios', 'reconciliations', 'openDecisions', 'reconciliation',
    'dependencies', 'secondGoalNeeds',
    // Christian's reply of 6 November: the change log (before and after, for every value or decision it retired or changed), the end-line
    // restart's examination (section 6) and our readings inside a premise (section 7).
    'changeLog', 'restartExamination', 'readingsInsidePremises',
    // Section 9: the placement geometry the DRAFT diagram reads.
    'placementGeometry',
]
const RULING_KEYS = ['id', 'decision', 'subject', 'scope', 'scopeWords', 'scopeCovers', 'scopePaths', 'kind', 'establishesCanonicalKnowledge', 'canonicalAmendment', 'words', 'supersedes', 'received', 'file', 'provisional']
const CHOICE_KEYS = ['path', 'value', 'valueIsEvidence', 'evidenceStates', 'declaredStatus', 'howReached', 'readBy', 'knowledgeRef', 'decidedBy', 'consulted', 'statusSetBy', 'permittedBy', 'readingOf', 'scopeSetBy', 'note']

/**
 * The record, validated. Throws on: an unknown key anywhere this checks; an unknown standing; a ruling without words, file or received
 * date; a scope without Christian's scope words; a decisive RULING or APPROVED item without the exact substring of Christian's words (or the cell) that
 * states the value; Christian's example words or reference-only material among what decided a value; a ruling reference not in the registry; a
 * declared status stronger than what decided it; an UNRESOLVED value that is not exactly one UNRESOLVED decisive item with no value.
 */
export function validateExperiment(raw: unknown): Experiment {
    const top = onlyKeys('(top)', raw, TOP_KEYS, TOP_KEYS)
    if (!isString(top.standing) || !isString(top.learningGoalId)) fail('(top)', 'standing and learningGoalId must be strings')

    // Rulings: filed once each, with Christian's words, a repository-independent file reference and the received date.
    if (!Array.isArray(top.rulings) || !top.rulings.length) fail('rulings', 'must be a non-empty list')
    const rulings = new Map<string, AssemblyRuling>()
    ;(top.rulings as unknown[]).forEach((r, i) => {
        const where = `rulings[${i}]`
        const o = onlyKeys(where, r, RULING_KEYS, ['id', 'decision', 'subject', 'scope', 'canonicalAmendment', 'words', 'received', 'file', 'provisional'])
        if (!isString(o.id)) fail(where, 'id must be a string')
        if (rulings.has(o.id as string)) fail(where, `ruling ${String(o.id)} filed twice`)
        if (!isString(o.decision) || !isString(o.subject)) fail(where, 'decision and subject must be strings')
        if ('scopeCovers' in o && !isString(o.scopeCovers)) fail(where, 'scopeCovers must be a string')
        if ('supersedes' in o && !isStringList(o.supersedes)) fail(where, 'supersedes must be a list of ids')
        if (!Array.isArray(o.words) || !o.words.length || !(o.words as unknown[]).every(isString)) fail(where, 'words must be a non-empty list of strings')
        if (!isString(o.file)) fail(where, 'file must be a repository-independent reference')
        if ((o.file as string).indexOf('AppData') >= 0 || (o.file as string).indexOf('scratchpad') >= 0) fail(where, 'file must never be a scratchpad path')
        if (!isDate(o.received)) fail(where, 'received must be a YYYY-MM-DD date (US Eastern)')
        if (typeof o.provisional !== 'boolean') fail(where, 'provisional must be true or false')
        if ((RULING_KINDS as readonly string[]).indexOf(o.kind as string) < 0) fail(where, `unknown kind ${JSON.stringify(o.kind)}`)
        if ('establishesCanonicalKnowledge' in o && (o.establishesCanonicalKnowledge !== true || o.kind !== 'RULING')) fail(where, 'establishesCanonicalKnowledge is true, and only on a ruling')
        if (o.canonicalAmendment !== false) fail(where, 'no ruling filed here is a canonical amendment')
        if (o.scope !== null && !isString(o.scope)) fail(where, 'scope must be a string or null')
        if (o.scope !== null) {
            if (!Array.isArray(o.scopeWords) || !o.scopeWords.length) fail(where, 'a scope needs Christian\'s scope words')
            for (const w of o.scopeWords as string[]) if (!(o.words as string[]).some((x) => x.indexOf(w) >= 0)) fail(where, `scope words "${w}" are not in Christian's words`)
            if ('scopePaths' in o && (!isStringList(o.scopePaths) || !(o.scopePaths as string[]).length)) fail(where, 'scopePaths, when present, is a non-empty list of the values Christian\'s scope words are said of')
        } else if ('scopeWords' in o || 'scopePaths' in o) fail(where, 'scope words or scopePaths without a scope')
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
                if (r.kind !== 'RULING') fail(dw, `${r.id} holds Christian's ${r.kind.toString()} words, not a ruling: it cannot decide a value`)
                if (!(s === 'RULING' || (s === 'APPROVED' && r.establishesCanonicalKnowledge === true))) fail(dw, 'a ruling of Christian\'s decides with standing RULING (APPROVED only where Christian\'s words made the item canonical knowledge)')
            }
            if ('knowledgeRef' in di) knowledgeRefOk(`${dw}.knowledgeRef`, di.knowledgeRef)
            if ('ref' in di) {
                const bare = BARE_DECISIVE[di.ref as NonNullable<DecisiveItem['ref']>]
                if (!bare || bare !== s) fail(dw, 'a bare ref is allowed only as { ref: UNRESOLVED | ILLUSTRATIVE | OURS } with the same standing')
                if ('valueEvidence' in di) fail(dw, 'a bare ref quotes no evidence: no authority states the value')
            }
            if (s === 'RULING' || s === 'APPROVED') {
                if (!isString(di.valueEvidence)) fail(dw, 'a decisive RULING or APPROVED item needs valueEvidence, the exact substring that states the value')
                if ('rulingRef' in di && !(rulings.get(di.rulingRef as string) as AssemblyRuling).words.some((w) => w.indexOf(di.valueEvidence as string) >= 0)) fail(dw, 'valueEvidence is not in Christian\'s words')
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
        // Christian's words in a non-decisive role: each quote exact in Christian's words; a permission naming the value must contain it.
        for (const role of ROLES) {
            if (!(role in o)) continue
            if (!Array.isArray(o[role]) || !(o[role] as unknown[]).length) fail(at, `${role} must be a non-empty list when present`)
            ;(o[role] as unknown[]).forEach((x, j) => {
                const rw = `${at}.${role}[${j}]`
                const ri = onlyKeys(rw, x, role === 'permittedBy' ? ['rulingRef', 'quote', 'namesValue'] : ['rulingRef', 'quote'], ['rulingRef', 'quote'])
                const r = rulingOk(rw, ri.rulingRef)
                if (!isString(ri.quote) || !r.words.some((w) => w.indexOf(ri.quote as string) >= 0)) fail(rw, 'the quote is not in Christian\'s words')
                if ('namesValue' in ri && (ri.namesValue !== true || (ri.quote as string).indexOf(String(v)) < 0)) fail(rw, 'namesValue: Christian\'s quoted words must contain the value')
            })
        }

        // The declared status is never stronger than what decided the value (compared by standing; Christian's provisional flag only weakens).
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
        // A value Christian's words do not state is decided by us, never by Christian's words: an illustrative value by our choice (Christian's permission printed
        // beside it), our inference by our reading (the words read printed beside it). Christian's words never "state" either.
        const onlyBare = (ref: 'ILLUSTRATIVE' | 'OURS') => (o.decidedBy as DecisiveItem[]).length === 1 && (o.decidedBy as DecisiveItem[])[0].ref === ref
        if (how === 'ENTERED_ILLUSTRATIVE' && (!onlyBare('ILLUSTRATIVE') || !('permittedBy' in o))) fail(at, 'an illustrative value is decided by { ref: ILLUSTRATIVE } alone, with the words that permit it under permittedBy')
        if (how === 'ENTERED_OUR_INFERENCE' && (!onlyBare('OURS') || !('readingOf' in o))) fail(at, 'our inference is decided by { ref: OURS } alone, with the words it reads under readingOf')
        if ('permittedBy' in o && how !== 'ENTERED_ILLUSTRATIVE') fail(at, 'permittedBy belongs only to an illustrative value')
        if ('readingOf' in o && how !== 'ENTERED_OUR_INFERENCE') fail(at, 'readingOf belongs only to our inference')
        if ('scopeSetBy' in o && how !== 'READ_BY_CODE') fail(at, 'scopeSetBy belongs only to a value the code computes')
        if (decisive.some((d) => d.standing === 'ILLUSTRATIVE') && how !== 'ENTERED_ILLUSTRATIVE') fail(at, 'an ILLUSTRATIVE decisive item belongs only to an illustrative value')
        if (decisive.some((d) => d.standing === 'OURS') && (o.decidedBy as DecisiveItem[]).some((d) => d.ref === 'OURS') && how !== 'ENTERED_OUR_INFERENCE') fail(at, 'an OURS decisive item belongs only to our inference')
        if (how === 'ENTERED_EVIDENCED') {
            if (['APPROVED', 'RULING', 'CANDIDATE'].indexOf(declared) < 0) fail(at, 'an evidenced value is declared APPROVED, RULING or CANDIDATE')
            if (!(o.decidedBy as DecisiveItem[]).some((d) => (d.standing === 'RULING' || d.standing === 'APPROVED') && isString(d.valueEvidence))) fail(at, 'an evidenced value needs a decisive item with value evidence')
        }
        if ('valueIsEvidence' in o) {
            if (o.valueIsEvidence !== true || v !== (o.decidedBy as DecisiveItem[])[0]?.valueEvidence) fail(at, 'valueIsEvidence: the value must equal its first decisive item\'s evidence')
        }
        // A number Christian's words state is bound to the word Christian's evidence uses for it, so a changed number is refused, never printed as Christian's.
        if (how === 'ENTERED_EVIDENCED' && typeof v === 'number' && !('evidenceStates' in o)) fail(at, 'a number evidenced in Christian\'s words names, under evidenceStates, the word Christian\'s evidence uses for it')
        if ('evidenceStates' in o) {
            const word = o.evidenceStates
            if (!isString(word) || how !== 'ENTERED_EVIDENCED' || typeof v !== 'number') fail(at, 'evidenceStates belongs only to a number evidenced in Christian\'s words')
            if (!(o.decidedBy as DecisiveItem[]).some((d) => (d.standing === 'RULING' || d.standing === 'APPROVED') && isString(d.valueEvidence) && d.valueEvidence.indexOf(word as string) >= 0)) fail(at, `evidenceStates "${String(word)}" is not in the evidence that states the value`)
            if (statedNumber(word as string) !== v) fail(at, `evidenceStates "${String(word)}" states ${String(statedNumber(word as string))}, not the value ${String(v)}`)
        }
    })
    const choicePaths = [...paths]
    const pathOk = (where: string, p: unknown) => {
        if (!isString(p) || !paths.has(p)) fail(where, `path ${JSON.stringify(p)} is not a choice`)
    }
    for (const r of rulings.values()) for (const p of r.scopePaths ?? []) pathOk(`rulings (${r.id}).scopePaths`, p)

    // Top-level references.
    const gf = onlyKeys('gameForm', top.gameForm, ['illustrativeChoice', 'standing', 'rulingRefs', 'choicePath'], ['illustrativeChoice', 'standing', 'rulingRefs', 'choicePath'])
    standingOk('gameForm.standing', gf.standing)
    ;(gf.rulingRefs as unknown[]).forEach((r) => rulingOk('gameForm.rulingRefs', r))
    pathOk('gameForm.choicePath', gf.choicePath)
    const formChoice = (top.choices as Choice[]).find((c) => c.path === gf.choicePath) as Choice
    if (formChoice.value !== gf.illustrativeChoice || formChoice.declaredStatus !== gf.standing) fail(`gameForm (${String(gf.choicePath)})`, 'the illustrative choice and its standing must equal the choice at choicePath')
    const gp = onlyKeys('gameProblemScope', top.gameProblemScope, ['primaryGameProblemIds', 'secondaryGameProblemIds', 'rulingRefs', 'idResolution', 'note'], ['primaryGameProblemIds', 'secondaryGameProblemIds', 'rulingRefs', 'idResolution', 'note'])
    if (!isStringList(gp.primaryGameProblemIds) || !isStringList(gp.secondaryGameProblemIds) || !isString(gp.idResolution) || !isString(gp.note)) fail('gameProblemScope', 'the id lists are lists of ids; idResolution and note are strings')
    ;(gp.rulingRefs as unknown[]).forEach((r) => rulingOk('gameProblemScope.rulingRefs', r))
    if (!isString(top.scoringEventVocabulary)) fail('scoringEventVocabulary', 'must name the vocabulary')
    const bindings = onlyKeys('bindings', top.bindings, BINDING_KEYS, BINDING_KEYS)
    for (const [key, p] of Object.entries(bindings)) pathOk(`bindings.${key}`, p)
    if (!isObject(top.placementZoneCount) || !Object.values(top.placementZoneCount).every((n) => typeof n === 'number' && Number.isInteger(n) && n >= 0)) fail('placementZoneCount', 'maps each placement value to a whole number of target zones')
    // The placement geometry: exactly the placements the count maps, each with as many zones as the count says, labelled ours.
    if (!isObject(top.placementGeometry)) fail('placementGeometry', 'maps each placement value to where its zones lie')
    if (JSON.stringify(Object.keys(top.placementGeometry).sort()) !== JSON.stringify(Object.keys(top.placementZoneCount).sort())) fail('placementGeometry', 'the same placements as placementZoneCount')
    for (const [placement, g] of Object.entries(top.placementGeometry)) {
        const o = onlyKeys(`placementGeometry.${placement}`, g, ['standing', 'zones', 'across'], ['standing', 'zones', 'across'])
        if (!isString(o.standing) || (o.standing as string).indexOf('OURS') !== 0) fail(`placementGeometry.${placement}`, 'a standing labelled OURS')
        if (o.across !== 'FULL_WIDTH') fail(`placementGeometry.${placement}`, `unknown extent across ${JSON.stringify(o.across)}`)
        if (!Array.isArray(o.zones) || o.zones.length !== (top.placementZoneCount as Record<string, number>)[placement]) fail(`placementGeometry.${placement}`, 'as many zones as placementZoneCount says')
        ;(o.zones as unknown[]).forEach((z, i) => {
            const zz = onlyKeys(`placementGeometry.${placement}.zones[${i}]`, z, ['along'], ['along'])
            if (zz.along !== 'FROM_START' && zz.along !== 'FROM_END') fail(`placementGeometry.${placement}.zones[${i}]`, 'along is FROM_START or FROM_END')
        })
    }
    ;(top.derived as unknown[]).forEach((d, i) => {
        const o = onlyKeys(`derived[${i}]`, d, ['id', 'formula', 'label', 'note'], ['id', 'formula', 'label', 'note'])
        if (['AREA_PER_PLAYER_TOTAL', 'AREA_PER_PLAYER_OUTSIDE_TARGET_ZONES'].indexOf(o.formula as string) < 0) fail(`derived[${i}]`, 'unknown formula')
        if (paths.has(o.id as string)) fail(`derived[${i}]`, 'a derived value is not a choice')
    })
    // Every choice path is in one of Christian's nine parts, each part Christian's words verbatim; exemptions and the design block name choices only.
    const partsRuling = rulingOk('requiredPartsRulingRef', top.requiredPartsRulingRef)
    const inParts = new Set<string>()
    ;(top.requiredParts as unknown[]).forEach((p, i) => {
        const o = onlyKeys(`requiredParts[${i}]`, p, ['id', 'part', 'paths', 'generatedFromTrace'], ['id', 'part', 'paths'])
        if (!partsRuling.words.some((w) => w === o.part)) fail(`requiredParts[${i}]`, 'the part must be Christian\'s words verbatim')
        for (const x of o.paths as unknown[]) {
            pathOk(`requiredParts[${i}]`, x)
            inParts.add(x as string)
        }
    })
    for (const p of choicePaths) if (!inParts.has(p)) fail('requiredParts', `${p} is in none of the nine parts`)
    for (const p of top.designBlockPaths as unknown[]) pathOk('designBlockPaths', p)
    ;(top.whyThisDesign as unknown[]).forEach((w, i) => {
        const o = onlyKeys(`whyThisDesign[${i}]`, w, ['text', 'paths'], ['text', 'paths'])
        if (!isString(o.text)) fail(`whyThisDesign[${i}]`, 'text must be a string')
        placeholdersWellFormed(`assembly-experiment.review.json whyThisDesign[${i}]`, o.text as string)
        for (const x of [...(o.paths as unknown[]), ...placeholdersOf(o.text as string)]) pathOk(`whyThisDesign[${i}]`, x)
    })
    ;(top.exemptions as unknown[]).forEach((e, i) => {
        const o = onlyKeys(`exemptions[${i}]`, e, ['path', 'reason', 'nonActivity'], ['path', 'reason'])
        pathOk(`exemptions[${i}]`, o.path)
        if (!isString(o.reason)) fail(`exemptions[${i}]`, 'an exemption needs a reason')
        if ('nonActivity' in o && o.nonActivity !== true) fail(`exemptions[${i}]`, 'nonActivity is true when present')
    })
    ;(top.laws as unknown[]).forEach((l, i) => {
        const o = onlyKeys(`laws[${i}]`, l, ['lawId', 'situation', 'status', 'paths', 'reason'], ['lawId', 'status', 'paths', 'reason'])
        if (!(o.lawId === null || isString(o.lawId)) || !isString(o.reason) || ('situation' in o && !isString(o.situation))) fail(`laws[${i}]`, 'lawId is a law id or null; reason (and situation) are strings')
        if (['APPLIES', 'DEPARTED', 'NOT APPLICABLE', 'ADAPTATION OWED'].indexOf(o.status as string) < 0) fail(`laws[${i}]`, 'unknown status')
        for (const x of o.paths as unknown[]) pathOk(`laws[${i}]`, x)
    })
    ;(top.contractItems as unknown[]).forEach((c, i) => {
        const o = onlyKeys(`contractItems[${i}]`, c, ['itemId', 'mappedTo', 'notUsed'], ['itemId', 'mappedTo'])
        for (const x of o.mappedTo as unknown[]) pathOk(`contractItems[${i}]`, x)
        if (!(o.mappedTo as unknown[]).length && !isString(o.notUsed)) fail(`contractItems[${i}]`, 'an item mapped to nothing needs its reason')
    })
    ;(top.contractDeclarationsReported as unknown[]).forEach((d, i) => {
        const o = onlyKeys(`contractDeclarationsReported[${i}]`, d, ['row', 'declaration', 'what', 'how'], ['row', 'declaration', 'what', 'how'])
        for (const key of ['row', 'declaration', 'what', 'how']) if (!isString(o[key])) fail(`contractDeclarationsReported[${i}]`, `${key} must be a string`)
    })
    // The requirement account: Christian's four categories and three standards, verbatim from Christian's ruling.
    const accounting = rulingOk('requirementAccountRulingRef', top.requirementAccountRulingRef)
    if (!Array.isArray(top.accountCategories) || top.accountCategories.length !== 4) fail('accountCategories', 'Christian\'s four categories')
    for (const c of top.accountCategories as string[]) if (!accounting.words.some((w) => w === c)) fail('accountCategories', `"${c}" is not Christian's wording`)
    for (const s of top.accountStandards as string[]) if (!accounting.words.some((w) => w.indexOf(`${s}:`) === 0)) fail('accountStandards', `"${s}" is not Christian's wording`)
    if (!isString(top.accountOutsideCategories) || (top.accountCategories as string[]).indexOf(top.accountOutsideCategories as string) >= 0) fail('accountOutsideCategories', 'a marker of ours, never one of Christian\'s four categories')
    ;(top.requirementAccount as unknown[]).forEach((a, i) => {
        const o = onlyKeys(`requirementAccount[${i}]`, a, ['id', 'requirementRef', 'clause', 'reading', 'category', 'standard', 'paths', 'observableConditions', 'inCoachGuidance', 'note'], ['id', 'requirementRef', 'clause', 'reading', 'category', 'standard', 'paths', 'observableConditions', 'note'])
        const req = onlyKeys(`requirementAccount[${i}].requirementRef`, o.requirementRef, ['table', 'row'], ['table', 'row'])
        if (!isString(req.table) || !isString(req.row)) fail(`requirementAccount[${i}].requirementRef`, 'table and row must be strings')
        const outside = o.category === top.accountOutsideCategories
        if ((top.accountCategories as string[]).indexOf(o.category as string) < 0 && !outside) fail(`requirementAccount[${i}]`, 'category not one of Christian\'s four (nor the record\'s not-a-requirement marker)')
        if (outside && o.reading !== 'FOR_EXAMPLE') fail(`requirementAccount[${i}]`, 'only the "for example" reading makes a clause no requirement')
        if ((top.accountStandards as string[]).indexOf(o.standard as string) < 0) fail(`requirementAccount[${i}]`, 'standard not one of Christian\'s three')
        for (const x of o.paths as unknown[]) pathOk(`requirementAccount[${i}]`, x)
        const cat3 = o.category === (top.accountCategories as string[])[2]
        if (cat3 && !isString(o.observableConditions)) fail(`requirementAccount[${i}]`, 'category 3 names the observable conditions')
        if (cat3 !== ('inCoachGuidance' in o) || ('inCoachGuidance' in o && typeof o.inCoachGuidance !== 'boolean')) fail(`requirementAccount[${i}]`, 'a category 3 line, and only one, says whether its observable conditions are in the coach guidance')
    })
    const suit = onlyKeys('suitability', top.suitability, ['standing', 'properties', 'scale', 'exposure', 'identityPoint', 'scopeTension', 'addNothing', 'reviewPoints'], ['standing', 'properties', 'scale', 'exposure', 'identityPoint', 'scopeTension', 'addNothing', 'reviewPoints'])
    ;(suit.properties as unknown[]).forEach((p, i) => {
        const o = onlyKeys(`suitability.properties[${i}]`, p, ['property', 'structural', 'functional', 'note'], ['property', 'structural', 'functional', 'note'])
        const s = onlyKeys(`suitability.properties[${i}].structural`, o.structural, ['status', 'paths', 'rows'], ['status', 'paths', 'rows'])
        if (['EXPRESSED_BY_CONFIGURATION', 'NOT_SUPPLIED'].indexOf(s.status as string) < 0) fail(`suitability.properties[${i}]`, 'unknown structural status')
        for (const x of s.paths as unknown[]) pathOk(`suitability.properties[${i}]`, x)
        if (onlyKeys(`suitability.properties[${i}].functional`, o.functional, ['status'], ['status']).status !== 'ONLY_VERIFIABLE_IN_PLAY') fail(`suitability.properties[${i}]`, 'functional meaningfulness is only verifiable in play')
    })
    const scale = onlyKeys('suitability.scale', suit.scale, ['status', 'statement', 'openDecision'], ['status', 'statement', 'openDecision'])
    for (const key of ['status', 'statement', 'openDecision']) if (!isString(scale[key])) fail('suitability.scale', `${key} must be a string`)
    ;(suit.exposure as unknown[]).forEach((e, i) => {
        const o = onlyKeys(`suitability.exposure[${i}]`, e, ['aspect', 'status'], ['aspect', 'status'])
        if (!isString(o.aspect) || !isString(o.status)) fail(`suitability.exposure[${i}]`, 'aspect and status must be strings')
    })
    const identity = onlyKeys('suitability.identityPoint', suit.identityPoint, ['statement', 'rows'], ['statement', 'rows'])
    if (!isString(identity.statement) || !isStringList(identity.rows)) fail('suitability.identityPoint', 'a statement and a list of row ids')
    const addNothing = onlyKeys('suitability.addNothing', suit.addNothing, ['status', 'statement', 'rulingRef', 'quote'], ['status', 'statement', 'rulingRef', 'quote'])
    const quoteOk = (where: string, rulingRef: unknown, quote: unknown) => {
        const r = rulingOk(where, rulingRef)
        if (!isString(quote) || !r.words.some((w) => w.indexOf(quote) >= 0)) fail(where, 'the quote is not in Christian\'s words')
    }
    quoteOk('suitability.addNothing', addNothing.rulingRef, addNothing.quote)
    const tension = onlyKeys('suitability.scopeTension', suit.scopeTension, ['statement', 'rulingRefs'], ['statement', 'rulingRefs'])
    ;(tension.rulingRefs as unknown[]).forEach((r) => rulingOk('suitability.scopeTension', r))
    ;(suit.reviewPoints as unknown[]).forEach((p, i) => {
        const o = onlyKeys(`suitability.reviewPoints[${i}]`, p, ['id', 'statement', 'rulingRefs'], ['id', 'statement', 'rulingRefs'])
        ;(o.rulingRefs as unknown[]).forEach((r) => rulingOk(`suitability.reviewPoints[${i}]`, r))
    })
    const sc = onlyKeys('scenarios', top.scenarios, ['standing', 'rulingRef', 'rulesRef', 'circumstances', 'scopeCircumstance', 'insufficientWhen', 'requirementLink', 'uncertaintyReport', 'widthCheck', 'items'], ['standing', 'rulingRef', 'rulesRef', 'circumstances', 'scopeCircumstance', 'insufficientWhen', 'requirementLink', 'uncertaintyReport', 'widthCheck', 'items'])
    const scRuling = rulingOk('scenarios.rulingRef', sc.rulingRef)
    rulingOk('scenarios.rulesRef', sc.rulesRef)
    if (!isString(sc.standing) || !isString(sc.uncertaintyReport)) fail('scenarios', 'standing and uncertaintyReport must be strings')
    const keys = (sc.circumstances as unknown[]).map((c, i) => {
        const o = onlyKeys(`scenarios.circumstances[${i}]`, c, ['key', 'label'], ['key', 'label'])
        if (!isString(o.key) || !isString(o.label)) fail(`scenarios.circumstances[${i}]`, 'key and label must be strings')
        return o.key as string
    })
    const scope = onlyKeys('scenarios.scopeCircumstance', sc.scopeCircumstance, ['key', 'holdsWhen', 'rulingRefs', 'whenNotEstablished'], ['key', 'holdsWhen', 'rulingRefs', 'whenNotEstablished'])
    if (keys.indexOf(scope.key as string) < 0 || typeof scope.holdsWhen !== 'boolean') fail('scenarios.scopeCircumstance', 'a known circumstance key, and the value at which the scope holds')
    ;(scope.rulingRefs as unknown[]).forEach((r) => rulingOk('scenarios.scopeCircumstance', r))
    ;(sc.insufficientWhen as unknown[]).forEach((w, i) => {
        const o = onlyKeys(`scenarios.insufficientWhen[${i}]`, w, ['key', 'value'], ['key', 'value'])
        if (keys.indexOf(o.key as string) < 0 || typeof o.value !== 'boolean') fail(`scenarios.insufficientWhen[${i}]`, 'a known circumstance key and a true or false value')
    })
    const widthCheck = onlyKeys('scenarios.widthCheck', sc.widthCheck, ['note'], ['note'])
    if (!isString(widthCheck.note)) fail('scenarios.widthCheck', 'note must be a string')
    ;(sc.items as unknown[]).forEach((s, i) => {
        const o = onlyKeys(`scenarios.items[${i}]`, s, ['id', 'words', 'configuredActivity', 'expected'], ['id', 'words', 'configuredActivity', 'expected'])
        if (!scRuling.words.some((w) => w === o.words)) fail(`scenarios.items[${i}]`, 'Christian\'s scenario sentence must be verbatim')
        const expected = onlyKeys(`scenarios.items[${i}].expected`, o.expected, ['mismatchReported', 'uncertaintyReported', 'scopeEstablished'], ['mismatchReported', 'uncertaintyReported', 'scopeEstablished'])
        if (!Object.values(expected).every((b) => typeof b === 'boolean')) fail(`scenarios.items[${i}].expected`, 'each expectation is true or false')
        const ca = o.configuredActivity as Record<string, { value: unknown; label: string }>
        if (JSON.stringify(Object.keys(ca).sort()) !== JSON.stringify([...keys].sort())) fail(`scenarios.items[${i}]`, 'every circumstance, and only those, is stated')
        for (const [key, x] of Object.entries(ca)) {
            onlyKeys(`scenarios.items[${i}].${key}`, x, ['value', 'label'], ['value', 'label'])
            if (!(x.value === true || x.value === false || x.value === 'NOT_SUPPLIED')) fail(`scenarios.items[${i}].${key}`, 'true, false or NOT_SUPPLIED')
        }
    })
    const link = onlyKeys('scenarios.requirementLink', sc.requirementLink, ['requirementId', 'circumstanceKey', 'engagesWhen', 'rulingRefs', 'report'], ['requirementId', 'circumstanceKey', 'engagesWhen', 'rulingRefs', 'report'])
    ;(link.rulingRefs as unknown[]).forEach((r) => rulingOk('scenarios.requirementLink', r))
    if (keys.indexOf(link.circumstanceKey as string) < 0) fail('scenarios.requirementLink', 'unknown circumstance key')
    if (!isString(link.requirementId) || typeof link.engagesWhen !== 'boolean' || !isString(link.report)) fail('scenarios.requirementLink', 'a requirement id, a true or false engagesWhen and a report')
    const refs = onlyKeys('reportRefs', top.reportRefs, REPORT_REF_KEYS, REPORT_REF_KEYS)
    for (const [key, ref] of Object.entries(refs)) {
        const o = onlyKeys(`reportRefs.${key}`, ref, ['rulingRef', 'quote'], ['rulingRef'])
        if ('quote' in o) quoteOk(`reportRefs.${key}`, o.rulingRef, o.quote)
        else rulingOk(`reportRefs.${key}`, o.rulingRef)
    }
    // Christian's six classes, as this file prints them, are Christian's words verbatim, filed in the registry entry the report cites for them.
    const classes = rulingOk('reportRefs.sixClasses', (refs.sixClasses as { rulingRef: unknown }).rulingRef)
    for (const c of SIX_CLASSES) if (!classes.words.some((w) => w === c)) fail('reportRefs.sixClasses', `Christian's class "${c}" is not a word of ${classes.id}`)
    ;(top.reconciliations as unknown[]).forEach((r, i) => {
        const o = onlyKeys(`reconciliations[${i}]`, r, ['id', 'title', 'rulingRefs', 'showPaths', 'items', 'smallest'], ['id', 'title', 'rulingRefs', 'items'])
        ;(o.rulingRefs as unknown[]).forEach((x) => rulingOk(`reconciliations[${i}]`, x))
        for (const p of (o.showPaths as unknown[]) ?? []) pathOk(`reconciliations[${i}].showPaths`, p)
        if ('smallest' in o && !isString(o.smallest)) fail(`reconciliations[${i}]`, 'smallest must be a string')
    })
    const decisionIds = new Set<string>()
    ;(top.openDecisions as unknown[]).forEach((d, i) => {
        const o = onlyKeys(`openDecisions[${i}]`, d, ['id', 'blocks', 'question', 'rulingRefs', 'handling', 'answeredBy'], ['id', 'blocks', 'question', 'rulingRefs', 'handling'])
        if (!isString(o.id) || decisionIds.has(o.id as string)) fail(`openDecisions[${i}]`, 'an id, listed once')
        decisionIds.add(o.id as string)
        if (OPEN_DECISION_CLASSES.indexOf(o.blocks as OpenDecisionClass) < 0) fail(`openDecisions[${i}]`, 'unknown blocking class')
        if (!isString(o.question) || !isString(o.handling)) fail(`openDecisions[${i}]`, 'question and handling must be strings')
        ;(o.rulingRefs as unknown[]).forEach((r) => rulingOk(`openDecisions[${i}]`, r))
        // An answered decision names the ruling that answered it, which is among its rulings, and says how.
        if ('answeredBy' in o) {
            const a = onlyKeys(`openDecisions[${i}].answeredBy`, o.answeredBy, ['rulingRef', 'statement'], ['rulingRef', 'statement'])
            rulingOk(`openDecisions[${i}].answeredBy`, a.rulingRef)
            if (!isString(a.statement)) fail(`openDecisions[${i}].answeredBy`, 'statement must be a string')
            if ((o.rulingRefs as string[]).indexOf(a.rulingRef as string) < 0) fail(`openDecisions[${i}].answeredBy`, 'the answering ruling is among the decision\'s rulings')
        }
    })
    // The change log: every entry names what changed, before and after, the reply's lines that occasioned it, and the date.
    if (!Array.isArray(top.changeLog) || !top.changeLog.length) fail('changeLog', 'must be a non-empty list')
    ;(top.changeLog as unknown[]).forEach((c, i) => {
        const o = onlyKeys(`changeLog[${i}]`, c, ['path', 'before', 'after', 'n6Lines', 'date'], ['path', 'before', 'after', 'n6Lines', 'date'])
        for (const key of ['path', 'before', 'after', 'n6Lines']) if (!isString(o[key])) fail(`changeLog[${i}]`, `${key} must be a string`)
        if (!/^N6 l\.\d+(-\d+)?(, \d+(-\d+)?)*$/.test(o.n6Lines as string)) fail(`changeLog[${i}]`, 'n6Lines names the reply\'s lines, as "N6 l.<n>[-<m>][, <n>...]"')
        if (!isDate(o.date)) fail(`changeLog[${i}]`, 'date must be a YYYY-MM-DD date')
        if (o.before === o.after) fail(`changeLog[${i}]`, 'before and after are the same')
    })
    // The restart examination: every row has one cell per column.
    const ex = onlyKeys('restartExamination', top.restartExamination, ['standing', 'rulingRefs', 'cases', 'columns', 'rows', 'verdict', 'stillFlagged', 'reviewNotes'], ['standing', 'rulingRefs', 'cases', 'columns', 'rows', 'verdict', 'stillFlagged', 'reviewNotes'])
    for (const key of ['standing', 'cases', 'verdict', 'stillFlagged']) if (!isString(ex[key])) fail('restartExamination', `${key} must be a string`)
    ;(ex.rulingRefs as unknown[]).forEach((r) => rulingOk('restartExamination.rulingRefs', r))
    if (!isStringList(ex.columns) || !(ex.columns as string[]).length || !isStringList(ex.reviewNotes)) fail('restartExamination', 'columns and reviewNotes are lists of strings')
    if (!Array.isArray(ex.rows) || !ex.rows.length) fail('restartExamination', 'rows must be a non-empty list')
    ;(ex.rows as unknown[]).forEach((r, i) => {
        const o = onlyKeys(`restartExamination.rows[${i}]`, r, ['id', 'candidate', 'cells'], ['id', 'candidate', 'cells'])
        if (!isString(o.id) || !isString(o.candidate) || !isStringList(o.cells)) fail(`restartExamination.rows[${i}]`, 'id, candidate and cells are strings')
        if ((o.cells as string[]).length !== (ex.columns as string[]).length) fail(`restartExamination.rows[${i}]`, `${(o.cells as string[]).length} cells for ${(ex.columns as string[]).length} columns`)
    })
    // Our readings inside a premise: each names the values it bears on.
    const rip = onlyKeys('readingsInsidePremises', top.readingsInsidePremises, ['question', 'items'], ['question', 'items'])
    if (!isString(rip.question) || !Array.isArray(rip.items) || !rip.items.length) fail('readingsInsidePremises', 'a question and a non-empty list of items')
    ;(rip.items as unknown[]).forEach((r, i) => {
        const o = onlyKeys(`readingsInsidePremises.items[${i}]`, r, ['id', 'reading', 'paths', 'premise'], ['id', 'reading', 'paths', 'premise'])
        if (!isString(o.id) || !isString(o.reading) || !isString(o.premise) || !isStringList(o.paths) || !(o.paths as string[]).length) fail(`readingsInsidePremises.items[${i}]`, 'id, reading, premise and a non-empty list of paths')
        if ((o.reading as string).indexOf('OURS') !== 0) fail(`readingsInsidePremises.items[${i}]`, 'a reading of ours is labelled OURS')
        for (const p of o.paths as string[]) pathOk(`readingsInsidePremises.items[${i}]`, p)
    })
    const reconciliation = onlyKeys('reconciliation', top.reconciliation, ['rulingRef', 'assessmentItems', 'reuse', 'stillOpen'], ['rulingRef', 'assessmentItems', 'reuse', 'stillOpen'])
    rulingOk('reconciliation.rulingRef', reconciliation.rulingRef)
    ;(reconciliation.assessmentItems as unknown[]).forEach((a, i) => {
        const o = onlyKeys(`reconciliation.assessmentItems[${i}]`, a, ['item', 'carriedBy'], ['item', 'carriedBy'])
        if (!isString(o.item) || !isString(o.carriedBy)) fail(`reconciliation.assessmentItems[${i}]`, 'item and carriedBy must be strings')
    })
    ;(reconciliation.reuse as unknown[]).forEach((r, i) => {
        const o = onlyKeys(`reconciliation.reuse[${i}]`, r, ['work', 'status', 'why'], ['work', 'status', 'why'])
        if (!isString(o.work) || !isString(o.status) || !isString(o.why)) fail(`reconciliation.reuse[${i}]`, 'work, status and why must be strings')
    })
    if (!isStringList(reconciliation.stillOpen)) fail('reconciliation.stillOpen', 'a list of strings')
    ;(top.dependencies as unknown[]).forEach((d, i) => {
        const o = onlyKeys(`dependencies[${i}]`, d, ['id', 'what', 'options'], ['id', 'what', 'options'])
        if (!isString(o.id) || !isString(o.what) || !isString(o.options)) fail(`dependencies[${i}]`, 'id, what and options must be strings')
    })
    if (!isStringList(top.secondGoalNeeds)) fail('secondGoalNeeds', 'a list of strings')
    return top as unknown as Experiment
}

/** The DRAFT wording, validated against the record: known sections, known paths, `expresses` equal to its placeholders and whenValue keys. */
export function validateWording(raw: unknown, experiment: Experiment): Wording {
    const where = 'assembly-wording.draft.json'
    const top = onlyKeys(where, raw, ['standing', 'keyedFor', 'coachTerms', 'sections', 'templates', 'diagram'], ['standing', 'keyedFor', 'coachTerms', 'sections', 'templates', 'diagram'])
    if (!isString(top.standing)) throw new Error(`${where}: standing must be a string`)
    validateDiagramWords(`${where} diagram`, top.diagram)
    const keyedFor = onlyKeys(`${where} keyedFor`, top.keyedFor, ['gameForm', 'scoringEvent', 'note'], ['gameForm', 'scoringEvent', 'note'])
    const coachTerms = onlyKeys(`${where} coachTerms`, top.coachTerms, ['targetZone', 'markedLine', 'source'], ['targetZone', 'markedLine', 'source'])
    for (const v of [...Object.values(keyedFor), ...Object.values(coachTerms)]) if (!isString(v)) throw new Error(`${where}: keyedFor and coachTerms hold strings`)
    if (!Array.isArray(top.sections) || !top.sections.length) throw new Error(`${where}: sections must be a non-empty list`)
    const sections = new Set(
        (top.sections as unknown[]).map((s, i) => {
            const o = onlyKeys(`${where} sections[${i}]`, s, ['id', 'level', 'title', 'rc3'], ['id', 'level', 'title', 'rc3'])
            if (!isString(o.id) || !isString(o.title) || !isString(o.rc3)) throw new Error(`${where} sections[${i}]: id, title and rc3 must be strings`)
            if (o.level !== 'Coach Overview' && o.level !== 'Coach Details') throw new Error(`${where} sections[${i}]: level is "Coach Overview" or "Coach Details", not ${JSON.stringify(o.level)}`)
            return o.id as string
        })
    )
    const paths = new Set(experiment.choices.map((c) => c.path))
    const ids = new Set<string>()
    for (const t of top.templates as unknown[]) {
        const o = onlyKeys(`${where} template`, t, ['id', 'section', 'text', 'expresses', 'whenValue', 'status', 'quote', 'quotesWithin', 'reviewOnly', 'scope'], ['id', 'section', 'text', 'expresses', 'status'])
        const at = `${where} ${String(o.id)}`
        if (ids.has(o.id as string)) throw new Error(`${at}: template listed twice`)
        ids.add(o.id as string)
        if (!sections.has(o.section as string)) throw new Error(`${at}: unknown section`)
        if ((WORDING_STATUSES as readonly string[]).indexOf(o.status as string) < 0) throw new Error(`${at}: unknown status`)
        if ('reviewOnly' in o && o.reviewOnly !== true) throw new Error(`${at}: reviewOnly is true when present`)
        if ('scope' in o && o.scope !== 'GOAL' && o.scope !== 'CONTEXT') throw new Error(`${at}: scope is GOAL or CONTEXT`)
        if (!isString(o.text)) throw new Error(`${at}: text must be a string`)
        placeholdersWellFormed(at, o.text as string)
        // A double quotation mark presents words as quoted: only a quoted template (checked verbatim below) may carry one, or a placeholder
        // whose value is printed in quotation marks; any other quoted span would escape the checks of quoted text.
        if (o.quote === undefined && o.quotesWithin === undefined && (o.text as string).split(/"\{[A-Za-z0-9.]+\}"/).join('').indexOf('"') >= 0) throw new Error(`${at}: a quotation mark in a template that quotes nothing`)
        // A sentence of ours quoting Christian's words inside it: each double-quoted span verbatim in the ruling it cites, and at least one.
        if (o.quotesWithin !== undefined) {
            if (o.quote !== undefined) throw new Error(`${at}: quote and quotesWithin together`)
            const q = onlyKeys(`${at}.quotesWithin`, o.quotesWithin, ['rulingRef'], ['rulingRef'])
            const r = experiment.rulings.find((x) => x.id === q.rulingRef)
            if (!r) throw new Error(`${at}: quotesWithin names no ruling of the registry`)
            const spans = [...(o.text as string).matchAll(/"([^"]*)"/g)].map((m) => m[1])
            if (!spans.length || (o.text as string).split('"').length % 2 !== 1) throw new Error(`${at}: quotesWithin needs whole double-quoted spans`)
            for (const s of spans) if (!r.words.some((w) => w.indexOf(s) >= 0)) throw new Error(`${at}: "${s}" is not in the words of ${r.id}`)
        }
        const placeholders = placeholdersOf(o.text as string)
        const whenKeys = Object.keys((o.whenValue as Record<string, unknown>) ?? {})
        for (const p of [...placeholders, ...whenKeys]) if (!paths.has(p)) throw new Error(`${at}: unknown path ${p}`)
        const said = [...new Set([...placeholders, ...whenKeys])].sort()
        if (JSON.stringify([...(o.expresses as string[])].sort()) !== JSON.stringify(said)) throw new Error(`${at}: expresses must equal its placeholders and whenValue paths (${said.join(', ')})`)
        // An abbreviated presentation is locked (whenValue) to the approved cell it derives from, so a changed cell refuses the sentence.
        if (o.status === 'ABBREVIATED FROM APPROVED WORDING' && !whenKeys.some((p) => experiment.choices.find((c) => c.path === p)?.readBy === 'DISPLAY_CELL')) throw new Error(`${at}: an abbreviated presentation names, by whenValue, the approved cell it derives from`)
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

/** Every brace in a template belongs to a well-formed `{path}` placeholder; a malformed one would be neither checked nor filled, so it throws. */
export function placeholdersWellFormed(at: string, text: string): void {
    const rest = text.split(/\{[A-Za-z0-9.]+\}/).join('')
    if (rest.indexOf('{') >= 0 || rest.indexOf('}') >= 0) throw new Error(`${at}: a malformed placeholder (a brace outside a {path} placeholder)`)
}

// ---------------------------------------------------------------------------------------------------------------------------------------
// Assembly
// ---------------------------------------------------------------------------------------------------------------------------------------

/**
 * Display text read from knowledge cells after the decisions (never by this file): by configuration path, names by id, and each requirement
 * the account cites by "<table> <row>" (its statement cell, printed beside its account lines; no decision reads it).
 */
export interface DisplayTexts {
    cells: Record<string, { text: string; cite: Cite }>
    names: Record<string, { text: string; cite: Cite }>
    goalName: { text: string; cite: Cite }
    statements: Record<string, { text: string; cite: Cite }>
}

export type AssembledValue = ChoiceValue | string[]

export interface AssembledChoice {
    path: string
    value: AssembledValue
    rendered: string
    howReached: HowReached
    declaredStatus: Standing
    computed: boolean
    /**
     * What decided the value: Stage 1/2's own influence trace for a computed value; our record for an entered one. Each item carries the
     * provisional flag its class was computed with (a ruling of Christian's called provisional; false for every other item).
     */
    decidedBy: Array<TraceItem & { provisional: boolean }>
    /** The weakest determining premise(s) and a tally of the rest (Christian's reply of 6 November, section 7: no source obscured). */
    premises: Premises
    /** The value's label (VALUE_LABELS, or the weakest determining premise's standing), printed after the class wherever it is printed. */
    label: string
    consulted: TraceItem[]
    statusSetBy: TraceItem[]
    /** Christian's words in the non-decisive roles: permitting an illustrative value, read by our inference, setting a computed value's scope. */
    permittedBy: TraceItem[]
    readingOf: TraceItem[]
    scopeSetBy: TraceItem[]
    traceLabel: string
    sixClass: SixClass
    /** True when every decisive ruling of a value declared RULING is one Christian called provisional (so its class is 3). */
    allDecisiveRulingsProvisional: boolean
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
    /** Over the activity's values only (the values recorded but not part of the activity are listed in nonActivity). */
    counts: { values: number; activityValues: number; nonActivity: string[]; howReached: Record<HowReached, number>; classes: Record<string, number> }
}

const RECORD_LABEL = 'our record of what decided it (OURS), not a computed influence'
/** How a ruling that sets a premise's status is printed (it sets the standing, and so the class; it decides no value). */
export const STATUS_SET_BY_ROLE = 'sets this premise\'s standing, and so the class; decides no value'
const COMPUTED_LABEL = 'computed by the Stage 1/2 code: its own influence trace, unchanged'

function rulingItem(r: AssemblyRuling, role: string, standing: Standing = 'RULING'): TraceItem {
    return item(`${r.id} (received ${longDate(r.received)}${r.provisional ? '; provisional' : ''})`, standing, role, { file: SOURCE.assemblyExperiment, table: 'rulings', row: r.id })
}
const refText = (k: KnowledgeRef): string => `${k.source} ${k.table} ${k.row}${k.column ? ` ${k.column}` : ''}`

/**
 * A ruling's scope as printed beside the value it decides: Christian's scope words, or that Christian stated none. Where the entry's scope words are said
 * of other values only (scopePaths), the value printed has no scope stated, and the scope words are shown as said of those values.
 */
export const scopeText = (r: AssemblyRuling, path: string | null = null): string => {
    const covers = r.scopeCovers ? `; ${r.scopeCovers.slice(-1) === '.' ? r.scopeCovers.slice(0, -1) : r.scopeCovers}` : ''
    const words = `"${(r.scopeWords ?? []).join('"; "')}"`
    if (!r.scope) return 'general, no scope stated'
    if (path !== null && r.scopePaths && r.scopePaths.indexOf(path) < 0) return `no scope stated for this decision (the entry's scope words, ${words}, are said of ${r.scopePaths.join(', ')}${covers})`
    return `scope ${r.scope}: ${words}${covers}`
}

/**
 * How Christian's words read when they decide a value: provisional, canonical, or a ruling; always with the received date and the words. For a
 * value the code reads from a knowledge cell, Christian's words select what the code reads and the cell states the value; otherwise Christian's words
 * state the value (each such word pinned against the value in the unit test).
 */
export function decidingWords(r: AssemblyRuling, evidence: string, standing: Standing, c: { path: string; howReached: HowReached }): string {
    const who = standing === 'APPROVED' && r.establishesCanonicalKnowledge ? 'Christian\'s ruling making it owner-authored canonical knowledge' : r.provisional ? 'Christian\'s provisional ruling' : 'Christian\'s ruling'
    const role = c.howReached === 'READ_BY_CODE' ? 'selects what the code reads; the cell states the value' : 'states the value'
    return `${who}, received ${longDate(r.received)}: "${evidence}" (${role}; ${scopeText(r, c.path)})`
}

/** The class of what a reading of ours reads: the class the ruling would give if it decided, or that the words are not a ruling. */
export const readsWhat = (r: AssemblyRuling): string =>
    r.kind === 'RULING' ? `it reads a ruling of ${classLabel(sixClassOf([{ standing: r.establishesCanonicalKnowledge ? 'APPROVED' : 'RULING', provisional: r.provisional }]))}` : `it reads Christian's ${r.kind} words, which decide nothing`

/** How Christian's words read in a non-decisive role. */
export function roleWords(role: Role, r: AssemblyRuling, x: RoleItem): string {
    const when = `received ${longDate(r.received)}`
    if (role === 'permittedBy') return `permits an illustrative value, ${when}: "${x.quote}" (${x.namesValue ? 'a permission that names this value; the choice to use it is ours' : 'a permission; it does not state the value'})`
    if (role === 'readingOf') return `our reading (OURS) of Christian's words, ${when}: "${x.quote}" (Christian's words do not state the value; ${readsWhat(r)})`
    return `sets the scope for this experiment, ${when}: "${x.quote}" (decides nothing)`
}

/** The column holding a row's status, and the column a row is found by, for the tables a decisive cell may come from (no narrative). */
const ROW_KEYS: Record<string, { key: string; status: string | null }> = {
    learning_goals: { key: 'ID', status: 'Status' },
    relationships: { key: 'relationship_id', status: 'status' },
    properties: { key: 'property_id', status: 'status' },
    controlled_vocabulary: { key: 'value', status: null },
}
const ACTIVE_STATUSES = ['ACTIVE', 'Active']

/**
 * The standing a decisive knowledge cell may carry, read from knowledge: the source's own standing, and only while its row is active.
 * A row that is not active, or missing, throws; so does a recorded standing stronger than the source's (a label never upgrades).
 */
export function cellStanding(k: DesignKnowledge, ref: KnowledgeRef, recorded: Standing): Standing {
    const tableKeys = ROW_KEYS[ref.table]
    const rows = ((((k as unknown as Record<string, Record<string, Array<Record<string, unknown>>>>)[ref.source] ?? {})[ref.table]) ?? []) as Array<Record<string, unknown>>
    if (!tableKeys || !rows.length) throw new Error(`${refText(ref)}: a table the assembly cannot read a standing from`)
    let key = ref.row
    let vocabulary: string | null = null
    if (ref.table === 'controlled_vocabulary') {
        const space = ref.row.indexOf(' ')
        vocabulary = ref.row.slice(0, space)
        key = ref.row.slice(space + 1)
    }
    const row = rows.find((r) => cell(r, tableKeys.key) === key && (vocabulary === null || cell(r, 'vocabulary') === vocabulary))
    if (!row) throw new Error(`${refText(ref)}: the row is missing`)
    if (tableKeys.status && ACTIVE_STATUSES.indexOf(cell(row, tableKeys.status)) < 0) throw new Error(`${refText(ref)}: not an active row (status ${cell(row, tableKeys.status)}), so it cannot decide a value`)
    const derived = sourceStanding(k, ref.source)
    const rank = (s: Standing) => CLASS_OF_STANDING[s] as SixClass
    if (rank(recorded) < rank(derived)) throw new Error(`${refText(ref)}: recorded ${recorded}, stronger than its source's standing ${derived}`)
    return recorded
}

/** The related id of a context relationship row a knowledge reference names (ids only; it must be ACTIVE and the routed context's). */
export function relationshipRelatedId(k: DesignKnowledge, rpcId: string, ref: KnowledgeRef): { relatedId: string; cite: Cite } {
    const row = k.contexts.relationships.find((r) => cell(r, 'relationship_id') === ref.row)
    if (!row || cell(row, 'status') !== 'ACTIVE' || cell(row, 'rpc_id') !== rpcId) throw new Error(`the assembly reads ${ref.row}, which is not an ACTIVE row of the routed context`)
    return { relatedId: cell(row, 'related_id'), cite: { file: SOURCE.contexts, table: 'relationships', row: ref.row } }
}

/**
 * The computed scoring-event membership: the routing row and the context's relationship row, each with its source's governed standing
 * (read as Stage 1/2 read it, never typed), so a change to a source's standing moves the conclusion's weakest standing and its class.
 * Established by approved knowledge as its basis, as Stage 1/2 record a context conclusion; its standing is the weakest of its items.
 */
export function scoringEventMembership(k: DesignKnowledge, rpcId: string, routing: Cite, eventRow: RelationshipRow, events: RelationshipRow[]): ComputedConclusion {
    return {
        id: 'scoring-event membership',
        statement: `${eventRow.relatedId} is one of ${rpcId}'s ACTIVE scoring events (${events.map((r) => r.relatedId).join(', ')}); membership does not choose among them.`,
        establishedBy: 'APPROVED KNOWLEDGE',
        trace: {
            influencedBy: [
                item(citeRef(routing), sourceStanding(k, 'planning'), `the routing row names ${rpcId}`, routing),
                item(citeRef(eventRow.cite), sourceStanding(k, 'contexts'), `${rpcId} relates ${eventRow.relatedId} (${eventRow.type} ${eventRow.strength})`, eventRow.cite),
            ],
            consulted: [],
            citedOnly: [],
        },
    }
}

/**
 * Assemble the activity from the computed Steps 1 and 2, the validated record and the display texts. Fails closed: Step 1 must be
 * RESOLVED; the illustrative form must be among the compatible forms; the resolution's Game Problem ids must equal the ids Christian's words name;
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
        throw new Error(`the resolution's Game Problems (${resolution.gameProblems.primary.join(', ')}; ${resolution.gameProblems.secondary.join(', ')}) are not the ones Christian's words name (${scope.primaryGameProblemIds.join(', ')}; ${scope.secondaryGameProblemIds.join(', ')})`)
    }
    const formChoice = choiceAt(experiment.bindings.illustrativeForm)
    if (forms.compatible.indexOf(String(formChoice.value)) < 0) throw new Error(`the illustrative form ${String(formChoice.value)} is not among the compatible forms (${forms.compatible.join(', ') || 'none'})`)
    const eventChoice = choiceAt(experiment.bindings.scoringEvent)
    const events = activeContextRelationships(k, rpcId, 'SCORING_EVENT')
    const eventRow = events.find((r) => r.relatedId === eventChoice.value)
    if (!eventRow) throw new Error(`the scoring event (${experiment.bindings.scoringEvent}) ${String(eventChoice.value)} is not one of ${rpcId}'s ACTIVE scoring events (${events.map((r) => r.relatedId).join(', ') || 'none'})`)
    // The cell that describes the scoring event must be the vocabulary row of that very event (never another event's description).
    const meansRef = choiceAt(experiment.bindings.scoringMeans).knowledgeRef
    if (!meansRef || meansRef.table !== 'controlled_vocabulary' || meansRef.row !== `${experiment.scoringEventVocabulary} ${String(eventChoice.value)}`) {
        throw new Error(`the scoring-event description is read from ${meansRef ? refText(meansRef) : 'nothing'}, not from the vocabulary row of the scoring event ${String(eventChoice.value)}`)
    }
    // A decisive knowledge cell's standing is read from knowledge: its row must be active, and the record may not upgrade it.
    for (const c of experiment.choices) for (const d of c.decidedBy) if (d.knowledgeRef) cellStanding(k, d.knowledgeRef, d.standing)

    const computed: ComputedConclusion[] = [
        { id: 'game problems', statement: `Game Problems by ${resolution.gameProblems.basis}: primary ${resolution.gameProblems.primary.join(', ')}; secondary ${resolution.gameProblems.secondary.join(', ') || 'none'} (filed scope ${resolution.gameProblems.scope ?? 'none'}${resolution.gameProblems.continuedBy ? `, continued by ${resolution.gameProblems.continuedBy.ruling}` : ''}).`, establishedBy: resolution.gameProblems.establishedBy, trace: resolution.gameProblems.trace },
        ...(resolution.profile?.findings ?? []).map((f) => ({ id: `secondary finding ${f.requirement}`, statement: `${f.requirement} (${f.requirementName}): the secondary ${f.secondary.gameProblemId} rates it ${f.secondary.rating}, the primary ${f.primary.gameProblemId} ${f.primary.rating}; ${f.outcome}; not promoted.`, establishedBy: f.establishedBy, trace: f.trace })),
        { id: 'game forms', statement: `${forms.status}: ${forms.compatible.join(', ')}; preference ${forms.preference.status}.`, establishedBy: forms.establishedBy, trace: forms.trace },
        scoringEventMembership(k, rpcId, resolution.context.routing, eventRow, events),
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
                // No finding is itself computed: the absence carries the trace of the profile computation that found none (never class 6).
                const profileTrace = resolution.profile?.effectiveProfile.trace ?? { influencedBy: [], consulted: [], citedOnly: [] }
                computedTrace = findings.length ? { influencedBy: findings.flatMap((f) => f.trace.influencedBy), consulted: findings.flatMap((f) => f.trace.consulted), citedOnly: findings.flatMap((f) => f.trace.citedOnly) } : profileTrace
                establishedBy = findings.length ? 'INSUFFICIENT EVIDENCE' : resolution.profile?.effectiveProfile.establishedBy ?? null
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
        // Each decisive item carries the provisional flag its class is computed with: a ruling's own flag; false for every other item
        // (the Stage 1/2 trace's items included, whose class is computed from their standing alone).
        const recorded = c.decidedBy.map((d) => {
            if (d.rulingRef) {
                const r = byId.get(d.rulingRef) as AssemblyRuling
                return { ...rulingItem(r, decidingWords(r, d.valueEvidence as string, d.standing, c), d.standing), provisional: r.provisional }
            }
            if (d.knowledgeRef) return { ...item(refText(d.knowledgeRef), d.standing, d.valueEvidence ? `the cell: "${d.valueEvidence}"` : 'the row'), provisional: false }
            if (d.ref === 'ILLUSTRATIVE') return { ...item('ILLUSTRATIVE', 'ILLUSTRATIVE', 'chosen by us: an illustrative value, which no authority gives'), provisional: false }
            if (d.ref === 'OURS') return { ...item('OURS', 'OURS', 'our own reading, which no authority gives as the value'), provisional: false }
            return { ...item('UNRESOLVED', 'UNRESOLVED', 'no authorized value exists'), provisional: false }
        })
        const decidedBy = computedTrace ? [...computedTrace.influencedBy.map((i) => ({ ...i, provisional: false })), ...recorded] : recorded
        const roleItems = (role: Role) => (c[role] ?? []).map((x) => rulingItem(byId.get(x.rulingRef) as AssemblyRuling, roleWords(role, byId.get(x.rulingRef) as AssemblyRuling, x)))
        const decisiveRulings = c.decidedBy.filter((d) => d.rulingRef).map((d) => byId.get(d.rulingRef as string) as AssemblyRuling)
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
        const sixClass = sixClassOf(classInputs, c.declaredStatus, establishedBy === 'LOGICAL INFERENCE' ? establishedBy : null)
        const premises = premisesOf(decidedBy.map((i) => ({ ref: i.ref, standing: i.standing, provisional: i.provisional })))
        return {
            path: c.path,
            value,
            rendered,
            howReached: c.howReached,
            declaredStatus: c.declaredStatus,
            computed: computedTrace !== null,
            decidedBy,
            premises,
            label: valueLabel(c.howReached, premises, sixClass, c.declaredStatus),
            consulted,
            statusSetBy: c.statusSetBy.map((s) => rulingItem(byId.get(s.rulingRef) as AssemblyRuling, STATUS_SET_BY_ROLE)),
            permittedBy: roleItems('permittedBy'),
            readingOf: roleItems('readingOf'),
            scopeSetBy: roleItems('scopeSetBy'),
            traceLabel: computedTrace ? COMPUTED_LABEL : RECORD_LABEL,
            sixClass,
            allDecisiveRulingsProvisional: c.declaredStatus === 'RULING' && decisiveRulings.length > 0 && decisiveRulings.every((r) => r.provisional),
            note: c.note,
        }
    })

    // Values derived in code from entered values: computed here, never typed. The number of target zones is read from the placement value.
    const num = (p: string) => {
        const v = choiceAt(p).value
        if (typeof v !== 'number') throw new Error(`the value (${p}) must be a number to derive from`)
        return v
    }
    const b = experiment.bindings
    const placement = String(choiceAt(b.targetZonePlacement).value)
    const zoneCount = experiment.placementZoneCount[placement]
    if (typeof zoneCount !== 'number') throw new Error(`the placement (${b.targetZonePlacement}) ${placement} maps to no number of target zones (placementZoneCount)`)
    const players = num(b.teamCount) * num(b.playersPerTeam)
    const round1 = (n: number) => Math.round(n * 10) / 10
    const fromPaths = [b.areaLength, b.areaWidth, b.teamCount, b.playersPerTeam]
    const derived = experiment.derived.map((d) => {
        const used = d.formula === 'AREA_PER_PLAYER_TOTAL' ? fromPaths : [...fromPaths, b.targetZoneDepth, b.targetZonePlacement]
        const value = d.formula === 'AREA_PER_PLAYER_TOTAL' ? round1((num(b.areaLength) * num(b.areaWidth)) / players) : round1(((num(b.areaLength) - zoneCount * num(b.targetZoneDepth)) * num(b.areaWidth)) / players)
        const cls = Math.max(...used.map((p) => (choices.find((c) => c.path === p) as AssembledChoice).sixClass)) as SixClass
        return { id: d.id, value, label: d.label, fromPaths: used, sixClass: cls, note: d.note }
    })

    // The counts cover the activity's values only; the values recorded but not part of the activity are listed apart.
    const nonActivity = experiment.exemptions.filter((e) => e.nonActivity).map((e) => e.path)
    const activityChoices = choices.filter((c) => nonActivity.indexOf(c.path) < 0)
    const howReached = Object.fromEntries(HOW_REACHED.map((h) => [h, activityChoices.filter((c) => c.howReached === h).length])) as Record<HowReached, number>
    const classes = Object.fromEntries(SIX_CLASSES.map((_, i) => [classLabel((i + 1) as SixClass), activityChoices.filter((c) => c.sixClass === i + 1).length]))
    return { learningGoalId: experiment.learningGoalId, rpcId, choices, derived, computed, counts: { values: choices.length, activityValues: activityChoices.length, nonActivity, howReached, classes } }
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
    /** A review disclosure: printed in the review copy, marked, and dropped from a coach copy. */
    reviewOnly: boolean
    scope: 'GOAL' | 'CONTEXT' | null
}

export interface ComposedActivity {
    sections: Array<{ id: string; level: string; title: string; rc3: string; sentences: ComposedSentence[] }>
    /** Every path a sentence expresses, review-only sentences included. */
    expressed: string[]
    /** The paths a coach copy expresses (review-only sentences dropped). */
    expressedInCoachCopy: string[]
}

/**
 * Fill every template. Pure. Throws on a placeholder or whenValue path that is not a choice, on `expresses` that differ from what the
 * template says, and on a whenValue that does not equal the assembled value (so a changed value can never leave a stale sentence).
 */
export function composeCoachActivity(wording: Wording, activity: AssembledActivity): ComposedActivity {
    const byPath = new Map(activity.choices.map((c) => [c.path, c]))
    const sectionIds = new Set(wording.sections.map((s) => s.id))
    const sentences: ComposedSentence[] = wording.templates.map((t) => {
        // A sentence with no section would be dropped from the text while its values still counted as expressed: it throws instead.
        if (!sectionIds.has(t.section)) throw new Error(`template ${t.id}: unknown section ${t.section}`)
        placeholdersWellFormed(`template ${t.id}`, t.text)
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
        const classes = t.expresses.map((p) => ({ path: p, sixClass: (byPath.get(p) as AssembledChoice).sixClass, label: (byPath.get(p) as AssembledChoice).label }))
        const sixClass = classes.length ? (Math.max(...classes.map((c) => c.sixClass)) as SixClass) : null
        const reviewOnly = t.reviewOnly === true
        return { id: t.id, section: t.section, text, expresses: [...t.expresses], status: t.status, sixClass, marker: sentenceMarker(classes, reviewOnly), quoted: Boolean(t.quote), reviewOnly, scope: t.scope ?? null }
    })
    const sections = wording.sections.map((s) => ({ id: s.id, level: s.level, title: s.title, rc3: s.rc3, sentences: sentences.filter((x) => x.section === s.id) }))
    // What is expressed is read from the sentences placed in sections, never from the template list.
    const placed = sections.flatMap((s) => s.sentences)
    return {
        sections,
        expressed: [...new Set(placed.flatMap((x) => x.expresses))].sort(),
        expressedInCoachCopy: [...new Set(placed.filter((x) => !x.reviewOnly).flatMap((x) => x.expresses))].sort(),
    }
}

/** How the review pathway resolved the Game Problems, in words (never "computed" for a ruling's designation). */
const BASIS_WORDS: Record<string, string> = {
    SCOPED_RULING: "resolved by the review pathway from Christian's scoped ruling for this goal (the planning model's translation for it is unpopulated)",
    APPROVED_TRANSLATION: "read by the review pathway from the planning model's approved translation",
}
export const basisWords = (basis: string | null): string => (basis && BASIS_WORDS[basis]) || `resolved by the review pathway (basis ${String(basis)})`
/** The same, short, for a list of what the code computed (so a designation read from Christian's ruling is never listed as computed knowledge). */
const BASIS_SHORT: Record<string, string> = {
    SCOPED_RULING: "read from Christian's scoped ruling by the resolution code, because the planning model's translation is unpopulated",
    APPROVED_TRANSLATION: "read from the planning model's approved translation by the resolution code",
}
export const basisShort = (basis: string | null): string => (basis && BASIS_SHORT[basis]) || `read by the resolution code (basis ${String(basis)})`

/** The labelled learning-design block shown beside the RC3 activity: the goal, the Game Problems and the Game Form, from the assembly. */
export function designBlock(experiment: Experiment, activity: AssembledActivity, display: DisplayTexts, forms: GameFormSelection, basis: string | null): Array<{ text: string; expresses: string[]; marker: string }> {
    const at = (p: string) => activity.choices.find((c) => c.path === p) as AssembledChoice
    const scopeRulings = experiment.gameProblemScope.rulingRefs.map((id) => experiment.rulings.find((r) => r.id === id) as AssemblyRuling)
    const scopeWords = scopeRulings.flatMap((r) => (r.scopeWords ?? []).map((w) => `"${w}" (received ${longDate(r.received)})`))
    const lines: Array<{ text: string; expresses: string[]; marker?: string }> = []
    lines.push({ text: `Learning Goal: ${display.goalName.text}.`, expresses: [], marker: '[the Learning Goal Christian authorized; its name read from the planning model by code]' })
    // Each block path is found by how it is read, never by its name.
    const readAs = (readBy: ReadBy): string | undefined => experiment.designBlockPaths.find((p) => experiment.choices.find((c) => c.path === p)?.readBy === readBy)
    const primary = readAs('RESOLUTION_PRIMARY')
    const secondary = readAs('RESOLUTION_SECONDARY')
    const finding = readAs('RESOLUTION_FINDINGS')
    const candidate = readAs('CONTEXT_RELATIONSHIP_ROW')
    const alternatives = readAs('COMPATIBLE_ALTERNATIVES')
    const form = experiment.bindings.illustrativeForm
    if (!alternatives || experiment.designBlockPaths.indexOf(form) < 0) throw new Error('the design block shows the illustrative form and its compatible alternatives')
    if (primary && secondary) lines.push({ text: `Game Problems: ${at(primary).rendered} is the primary problem and ${at(secondary).rendered} a secondary consideration, ${basisWords(basis)}; the scope for this experiment is set by Christian's words: ${scopeWords.join('; ')}.`, expresses: [primary, secondary] })
    if (finding) lines.push({ text: `Secondary finding: ${at(finding).rendered}.`, expresses: [finding] })
    if (candidate) lines.push({ text: `Candidate only: ${at(candidate).rendered} is shown as a candidate relationship and is not used.`, expresses: [candidate] })
    const others = forms.compatible.length - 1
    lines.push({ text: `Game Form: ${at(form).rendered}, used as an illustrative choice; ${others ? `${at(alternatives).rendered} ${others === 1 ? 'is a compatible alternative' : 'are compatible alternatives'}` : 'no other form is compatible'}, with no ranking among the ${forms.compatible.length} compatible forms.`, expresses: [form, alternatives] })
    return lines.map((l) => ({ text: l.text, expresses: l.expresses, marker: l.marker ?? sentenceMarker(l.expresses.map((p) => ({ path: p, sixClass: at(p).sixClass, label: at(p).label }))) }))
}

// ---------------------------------------------------------------------------------------------------------------------------------------
// The requirement account (Christian's 29 October ruling): applicable requirements in Christian's four categories; category 3 never satisfied
// ---------------------------------------------------------------------------------------------------------------------------------------

export interface AccountLine extends AccountEntry {
    requirementStatus: string
    requirementRole: string
    satisfied: boolean
    downgraded: string | null
    /** Set when the requirement row is not ACTIVE: the line is listed, excluded and never counted. */
    excluded: string | null
}

export interface AccountCounts {
    /** Per reading of the scoring row: each category's count over the counted lines (the identity rules count under both readings). */
    byReading: Record<string, Record<string, number>>
    excluded: string[]
}

export function requirementAccountOf(k: DesignKnowledge, experiment: Experiment, activity: AssembledActivity): { lines: AccountLine[]; counts: AccountCounts } {
    const cats = experiment.accountCategories
    const identity = contextIdentityRules(k, activity.rpcId)
    const lines = experiment.requirementAccount.map((a): AccountLine => {
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
        // Only an active requirement is accounted for: any other row is listed as excluded and never counted.
        const excluded = requirementStatus === 'ACTIVE' ? null : `${a.requirementRef.row} is ${requirementStatus || 'without a status'}, not an active requirement: excluded, not counted`
        // Categories 1 and 2 hold only where every cited value is in the assembled activity; otherwise the line falls to category 4,
        // and says why (an UNRESOLVED value is never present, so a clause resting on one can never pass).
        let category = a.category
        let downgraded: string | null = null
        if (category === cats[0] || category === cats[1]) {
            const missing = a.paths.filter((p) => {
                const c = activity.choices.find((x) => x.path === p)
                return !c || c.value === null || (Array.isArray(c.value) && !c.value.length)
            })
            if (missing.length) {
                category = cats[3]
                downgraded = `a cited value is missing from the assembled activity (${missing.join(', ')})`
            }
        }
        return { ...a, category, requirementStatus, requirementRole, satisfied: !excluded && (category === cats[0] || category === cats[1]), downgraded, excluded }
    })
    const counted = lines.filter((l) => !l.excluded)
    const readings = [...new Set(experiment.requirementAccount.map((a) => a.reading).filter((r): r is string => r !== null))]
    const byReading = Object.fromEntries(
        readings.map((reading) => {
            const under = counted.filter((l) => l.reading === null || l.reading === reading)
            return [reading, Object.fromEntries([...cats, experiment.accountOutsideCategories].map((c) => [c, under.filter((l) => l.category === c).length]))]
        })
    )
    return { lines, counts: { byReading, excluded: lines.filter((l) => l.excluded).map((l) => l.id) } }
}
