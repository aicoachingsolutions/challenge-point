/**
 * Derivation engine — the records of the design package, revision 5, §1.8.
 *
 * Nothing here is invented: every record, field and closed list is the package's. Where the package
 * does not establish a semantic, the engine stops and reports it (SD-48) rather than completing the
 * behaviour here.
 *
 * Implementation increment 1 covers stages 0–2 (load, normalise, index). Types the later stages need
 * are declared where increment 1 populates them, and omitted where it does not.
 */

// ---------------------------------------------------------------------------------------------
// Closed lists — the register's `vocabularies.contractEnums`, and the package's own closed lists.
// ---------------------------------------------------------------------------------------------

export const REQUIREMENTS = ['EQUALS', 'RANGE', 'COUNT', 'EXISTS', 'NOT_EXISTS', 'POSITIONED', 'ORIENTED', 'COMPARES'] as const
export const STRICTNESSES = ['REQUIRED', 'SUPPORTING', 'EXCLUSION'] as const
export const VALUE_STATUSES = ['REQUIRED_RANGE', 'PREFERRED_DEFAULT', 'TYPICAL_EXAMPLE', 'N/A'] as const
export const SCOPES = ['WHOLE_GAME', 'PER_TEAM', 'PER_OBJECTIVE_SET', 'OWN_INVOLVEMENT', 'BUILD_OUT_EPISODE'] as const
export const BASES = ['AUTHORED', 'ASSUMED', 'OWNER_RULING', 'ENGINE_ONLY'] as const
export const CHECKABILITIES = ['STRUCTURAL', 'PARTLY_STRUCTURAL', 'OUTSIDE_BOUNDARY'] as const
export const DECLARATIONS = ['CLAIMED', 'EXCLUDED', 'NON_CLAIMED', 'NOT_AUTHORED', 'UNDECLARED'] as const
export const COMPARISON_OPERATORS = ['=', '!=', '<', '<=', '>', '>='] as const

/** Package §3.2 — the six failure kinds. */
export const FAILURE_KINDS = ['LOAD_REFUSAL', 'REFERENCE_DEFECT', 'GAP', 'INVENTED', 'COLLISION', 'RELATIONSHIP_CONFLICT'] as const

/** Package §3.3 — the closed refusal list. Adding one is a design change. */
export const REFUSAL_KINDS = [
    'NO_AGGREGATE_FUNCTION',
    'NO_MODIFIER_ORDER_RULE',
    'MODIFIER_OPERATION_MISSING',
    'RULE_NOT_EXECUTABLE',
    'OPERAND_NOT_SCALAR',
    'VALUE_NOT_COMPARABLE',
    'NOT_FILLABLE',
    'UNBOUNDED_COUNT_FILL',
    'PASS_DIVERGENCE',
    'CHECK_NOT_EXECUTABLE',
    'SELECTION_CONTRACT_MISMATCH',
    'INPUT_DEFECT',
    'CONSERVATION_VIOLATION',
] as const

/** Derivation spec §2 — every line gets exactly one, first that applies. */
export const VERDICTS = ['UNRESOLVED', 'FREE(b)', 'RESOLVED:ENTAILED', 'NOT_AUTHORED', 'FREE(a)', 'FREE(choice)', 'INVENTED'] as const

/** Package §1.8 — the closed forward-result vocabulary, first that applies. */
export const FORWARD_RESULTS = [
    'NOT_CHECKABLE_OUTSIDE_REPRESENTATION',
    'INERT',
    'SATISFIED',
    'VIOLATED',
    'PENDING_CHOICE',
    'UNMET',
    'ADAPTED',
    'NOT_REALIZED',
    'NOT_EVALUABLE',
] as const

export type Verdict = (typeof VERDICTS)[number]
export type ForwardResult = (typeof FORWARD_RESULTS)[number]
/** AM-23's codes, in his order. Increment 3 distinguishes the three it can decide. */
export type ReasonCode = 'declared gap' | 'coverage' | 'excluded'

export type Requirement = (typeof REQUIREMENTS)[number]
export type Scope = (typeof SCOPES)[number]
export type FailureKind = (typeof FAILURE_KINDS)[number]
export type RefusalKind = (typeof REFUSAL_KINDS)[number]
export type LineState = 'ENUMERATED' | 'WITHDRAWN' | 'CONDITIONAL'

// ---------------------------------------------------------------------------------------------
// Input records — package §1.8.
// ---------------------------------------------------------------------------------------------

export interface SpecClause {
    document: string
    section: string
}

export interface ItemRef {
    contractId: string
    itemId: string
}

export interface ContractItem {
    itemId: string
    row: unknown
    selector?: unknown
    requirement?: unknown
    value?: unknown
    strictness?: unknown
    valueStatus?: unknown
    scope?: unknown
    basis?: unknown
    basisEvidence?: unknown
    checkability?: unknown
    structuralClause?: unknown
    comparison?: unknown
}

export interface Declaration {
    row: unknown
    selector?: unknown
    scope?: unknown
    declaration: unknown
    note?: unknown
}

export interface LoadedContract {
    contractId: string
    objectId: string
    objectKind?: string
    knowledgeVersion?: string
    registerVersion?: string
    items: ContractItem[]
    declarations: Declaration[]
    relationshipRules?: unknown[]
    notAuthored?: unknown[]
}

export interface SelectionEntry {
    objectId: string
    knowledgeVersion?: string
}

export interface Envelope {
    players?: number
    lengthM?: number
    widthM?: number
    durationMin?: number
}

export interface DerivationInput {
    selection: SelectionEntry[]
    contracts: LoadedContract[]
    envelope: Envelope
    register: any
    derivationRules: { version: string; adoptedLabels?: string[] }
    candidate?: unknown
}

// ---------------------------------------------------------------------------------------------
// Output records — package §1.3, §1.6, §1.8.
// ---------------------------------------------------------------------------------------------

export interface Versions {
    register: string
    vocabularies: Record<string, string>
    derivation: string
    engine: string
    contracts: { id: string; version: string }[]
    objects: { id: string; version: string }[]
}

export interface FailureRecord {
    failureId: string
    kind: FailureKind
    stage: number
    locus: { lineId?: string; itemRef?: ItemRef; contractId?: string }
    implicated: { contractIds: string[]; objectIds: string[] }
    clause: SpecClause
    offendingInput?: string
    detailRef?: string
}

export interface RefusalRecord {
    refusalId: string
    kind: RefusalKind
    cause: string
    stage: number
    clause: SpecClause
    openQuestion: { clause: SpecClause; quote: string } | null
    affects: { lineIds: string[]; itemRefs: ItemRef[]; contractIds: string[] }
    failureRef?: string
}

/**
 * An element class — package §2.3, SD-47. One per existence item: *the elements satisfying this
 * item's selector*. Never merged with another class, and carrying no individual identity.
 */
export interface ElementClass {
    classId: string
    row: string
    /** The first contribution to establish it, by canonical order. Kept for a stable id and locus. */
    fromItem: ItemRef
    /** Every contribution that establishes it. More than one only on a singleton row (SD-84). */
    supportedBy: ItemRef[]
    /** Set on a singleton class: the standing decision whose invariant fixes the row at one (SD-84). */
    singletonBy?: string
    /** Attribute constraints from the selector: `=` fixes one value, `IN` a set, `CONTAINS` a member. */
    constraints: SelectorPredicate
    cardinality: { min: number | null; max: number | null }
}

export interface ResolutionLine {
    lineId: string
    elementId: string | null
    row: string
    member: string | null
    lineState: LineState
    conditionalOn?: string
}

export interface RunReport {
    mode: 'DERIVATION' | 'CHECKING'
    halted: boolean
    divergent: boolean
    inputDigest: string
    counts: Record<string, number>
}

/** What increment 1 returns: stages 0–2 only. Later stages extend this record, never replace it. */
export interface PartialResult {
    versions: Versions | null
    classes: ElementClass[]
    lines: ResolutionLine[]
    triggers: string[]
    failures: FailureRecord[]
    refusals: RefusalRecord[]
    run: RunReport
    /** Discrepancies between code and specification, reported rather than resolved (SD-48). */
    stopped: { where: string; why: string }[]
}

// ---------------------------------------------------------------------------------------------
// Selectors — the register's `selectorSyntax`.
// ---------------------------------------------------------------------------------------------

export type SelectorTerm =
    | { attribute: string; op: '='; value: string }
    | { attribute: string; op: 'IN'; values: string[] }
    | { attribute: string; op: 'CONTAINS'; value: string }

// ---------------------------------------------------------------------------------------------
// Support and bounds — package §1.8. Support is knowledge entailment only: a candidate value is
// never support (SD-40), and an assumed item bounds but never entails (§3).
// ---------------------------------------------------------------------------------------------

export type SupportRef =
    | { kind: 'CONTRACT_ITEM'; contractId: string; itemId: string; relation: 'ENTAILS' | 'NARROWS' }
    | { kind: 'STANDING_DECISION'; id: string }
    | { kind: 'SESSION'; row: string }

export interface Bounds {
    kind: 'COUNT' | 'INTERVAL' | 'SET' | 'QUALITATIVE'
    min?: number | null
    max?: number | null
    members?: unknown[]
    /** The authored words, for a qualitative bound. SD-15 forbids inventing a number here. */
    term?: string
}

export interface SelectorPredicate {
    /** `*` or an absent selector: matches any element of the row, using no attribute. */
    any: boolean
    terms: SelectorTerm[]
}
