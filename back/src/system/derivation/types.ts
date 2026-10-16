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

import type { MemberDesignations } from './designation'

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
/**
 * AM-23 as extended 29 September: one code per declaration, in a precedence where a **statement always
 * outranks a silence**. Three codes could not express a five-declaration vocabulary, so an explicit
 * exclusion and a declared non-claim were both reported as `coverage` — *nobody looked* — when an
 * object had looked and said otherwise.
 *
 * **Diagnostic only.** Which code a line carries does not change whether it blocks realization.
 */
export type ReasonCode = 'declared gap' | 'excluded' | 'not constrained' | 'claimed but unresolved' | 'coverage' | 'no coverage'

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
    /**
     * What the item's authority is, where the item states it (15 October 2026, stage K2): PROVISIONAL_REALIZATION_CHOICE
     * on every item of a record-named provisional realization (`corpus.ts` `loadProvisionalRealizations`), absent on
     * canonical knowledge. Carried onto every support entry the item gives a derived value.
     */
    category?: unknown
    /**
     * A ruled supersession on an item (15 October 2026, stage K4, ruling C56): only `DEFERS_TO_AUTHORIZED_REALIZATION`, written
     * only by a restatement. Honoured in `realization-deferral.ts`.
     */
    defersTo?: unknown
    /**
     * The context-manipulation relationship a provisional realization's item cites as its authority (15 October 2026, stage
     * K4): the id of an entry of the authorization records' `contextManipulationRelationships`, checked at load
     * (`learning-goal-authorizations.ts`) and read by the deferral (`realization-deferral.ts`).
     */
    authorizedBy?: unknown
}

export interface Declaration {
    row: unknown
    selector?: unknown
    scope?: unknown
    declaration: unknown
    note?: unknown
    /** A ruled supersession, written only by a restatement (corpus-restatement.ts); see `DeclarationReach.defersTo`. */
    defersTo?: unknown
    /**
     * **Which of his three states a non-claim is** (register `contractEnums.declarationQualifier`, 15 October 2026,
     * stage K1) — valid only on NON_CLAIMED, validated at load (load.ts). Absent means a LEGACY non-claim: "this object
     * does not constrain this row", exactly as before. See `NO_FURTHER_VALUE` / `UNRESTRICTED` below.
     */
    qualifier?: unknown
}

/**
 * **His three states, kept apart in the machine-readable representation** — 17 October M6: *"the machine-readable
 * representation must preserve the distinction between: No further value is required. The value is explicitly
 * unrestricted. A necessary value is missing. These must not collapse into the same operational meaning, even if
 * their current surface representation is similar."*
 *
 *   - `NO_FURTHER_VALUE` — a non-claim that STATES the field needs nothing more: an established absence. It passes,
 *     never blocks, is never filled, and nothing is said to the coach. Unlike a legacy non-claim it is an explicit
 *     statement, so it may set a ruled deferral aside (classify.ts `governingDeclarations`).
 *   - `UNRESTRICTED` — registered so the state exists and cannot collapse into another, but REFUSED AT LOAD (load.ts):
 *     no operational reading of "any value" has been ruled. Refusing is OUR engineering default, fail-closed; SD-39
 *     (a non-claim permits a choice only inside an already-supported choice space) is the existing ruled grounding
 *     for the alternative reading, and which applies is his to say.
 *   - A necessary value MISSING is not a qualifier: it stays NOT_AUTHORED ('declared gap') or an unresolved claim
 *     ('claimed but unresolved') — the two codes that block — unchanged.
 */
export const NO_FURTHER_VALUE = 'NO_FURTHER_VALUE'
export const UNRESTRICTED = 'UNRESTRICTED'

/**
 * The one supersession the data may name (15 October 2026, his answer 9): a general declaration that DEFERS to the
 * object establishing an element, wherever that object speaks explicitly. Read from the declaration's `defersTo`,
 * which only a ruled restatement writes (corpus-restatement.ts), and honoured in one place (classify.ts
 * `governingDeclarations`) — never from a row or contract named in code. No declaration carries it on 15 October
 * 2026: whether any statement in the knowledge is such a relationship is his decision. Here, beside the record
 * it marks, so the restatement loader can name it without importing the classifier.
 */
export const DEFERS_TO_ESTABLISHING_OBJECT = 'ESTABLISHING_OBJECT'

/**
 * **The second supersession, and the first for an ITEM** — 15 October 2026 (stage K4, ruling C56). Christian, reply filed 17
 * October 2026, D6: *"If the 6 + GK versus 5 configuration requires a narrow exception to the possession game's
 * equal-outfield-number rule, please document it as a knowledge-authorized realization, preserving equal numbers as an
 * alternative."* An item carrying it (written only by a ruled restatement, corpus-restatement.ts) defers wherever a selected
 * contribution authors the same row per team and cites a confirmed context-manipulation relationship authorizing that row
 * (realization-deferral.ts); it is then listed as the alternative and never evaluated. The supersession vocabulary is one
 * list with two members, each for one kind of statement; any other value is refused at load.
 */
export const DEFERS_TO_AUTHORIZED_REALIZATION = 'AUTHORIZED_REALIZATION'

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
    /**
     * Items of this contract that DEFER in this composition (15 October 2026, stage K4, ruling C56): moved out of `items`
     * by `realization-deferral.ts`, so that no check evaluates them, and kept here whole with what they defer to, so the
     * alternative stays visible. Absent wherever nothing defers.
     */
    deferredItems?: DeferredItem[]
}

/** An item that defers in this composition, with what it defers to (stage K4, ruling C56). */
export interface DeferredItem {
    item: ContractItem
    defersTo: string
    /** The items that author the row per team and cite the relationship. */
    deferredTo: { contractId: string; itemId: string }[]
    /** The relationship they cite. */
    relationship: string
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
    /**
     * **Specialized-role availability, as session context** — adopted 30 September. Role name to
     * count. The role names themselves are sport knowledge and this layer knows none of them; it
     * carries whatever the session states.
     *
     * It exists because `players: 12` says how many people are there and nothing about what they are,
     * so a roster could not derive without implicitly treating every one of them as an outfield player.
     * Stating availability is not stating involvement: a role available in the session is instantiated
     * into a particular game only where the selected knowledge establishes it, and only an instantiated
     * group has a participation state at all.
     *
     * That sentence was the rule and, until 13 October, not the behaviour: the roster rule took every
     * stated count off every team. It now reads what a team HOLDS from the game and asks of this count
     * only that it cover it — see `rosterFor` in `realization/assemble-concrete-game.ts`.
     *
     * The pathway is deliberately shaped so a Team Profile can supply defaults and a session override
     * them — both upstream. The engine reads whatever it is given and infers nothing from silence: an
     * absent entry means *not stated*, never *none available*.
     */
    roles?: Record<string, number>
}

export interface DerivationInput {
    selection: SelectionEntry[]
    contracts: LoadedContract[]
    envelope: Envelope
    register: any
    derivationRules: { version: string; adoptedLabels?: string[] }
    candidate?: unknown
    /** The role block this game is derived for (stage K3, his M1); absent for every game without role blocks. */
    roleBlock?: RoleBlock
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
    /**
     * **What an instantiated team meets, for a standing property** (15 October 2026, stage K2, his M2) — set only on the
     * member class realization forms for a team (`post-realization-gate.ts`), from `designation.ts`, the one resolver.
     * A derived class never carries it: derivation classes fix no designation (SD-95), so stage 4 is unchanged.
     *
     * **One exception since 15 October 2026 (stage K3, his M1): an objective REGION carries what it is the target of.**
     * *"Allow target configurations to reflect each team's role during the block."* The register's derived attribute
     * `targetOf` (version 10) is set before reach on the classes the objectives reference — from the objectives' own
     * selectors and the reference items that entail them (`designation.ts` `targetDesignations`), never from the region's
     * authored selector, which is unchanged. It is what lets a selector name "the target the building team attacks"
     * without creating a third region. Every other derived class still carries nothing here.
     */
    designations?: MemberDesignations
}

/**
 * **The role block a game is derived for** — 15 October 2026 (stage K3), his M1 (reply filed 17 October 2026): *"Keep role
 * assignments separate from fixed ends. Allow target configurations to reflect each team's role during the block. The
 * coach controls the exchange."* Each role of the register's role vocabulary, bound to the setup assignment
 * (TEAM_AT_AXIS_*) whose team holds it in this block. The two bijections of two roles onto two ends are entailed, never
 * chosen (`role-blocks.ts`); which is played first is the coach's. It is INPUT, like the envelope: it enters the input
 * digest and the gate context, and realization records it beside the game — never as a property of the game.
 */
export interface RoleBlock {
    /** The block, named by its own bindings (`BUILDING=TEAM_AT_AXIS_START,PRESSING=TEAM_AT_AXIS_END`). */
    blockId: string
    /** Role -> the setup assignment holding it in this block. */
    holders: Record<string, string>
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
    /**
     * SD-93 — named conditions a run must not report silently. They are neither derivation gaps nor
     * refusals: the knowledge is present and well-formed, and something about how it is scoped or
     * structured stops it reaching a line. Without a name of their own they surface downstream as
     * unrelated unauthored rows, which is exactly how Wide Zone's twelve lines read for a week.
     */
    diagnostics: NamedDiagnostic[]
}

export interface NamedDiagnostic {
    code: string
    /** The contract, class or line the condition is about. */
    where: string
    detail: string
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
    // `CARRIES` is SD-92's relation: the value came from the selector of the existence item that
    // established the element, not from an item written on the row. It is still that item's support,
    // so it is a CONTRACT_ITEM; naming the relation keeps the two visibly different in provenance.
    // `category` (15 October 2026, stage K2): the item's own category where it carries one — today only an item of a
    // record-named provisional realization, PROVISIONAL_REALIZATION_CHOICE. Added at assembly (resolved-game.ts), so a
    // reader of the game can tell his choice for one activity from canonical knowledge (his 16 October item 10).
    | { kind: 'CONTRACT_ITEM'; contractId: string; itemId: string; relation: 'ENTAILS' | 'NARROWS' | 'CARRIES'; category?: string }
    | { kind: 'STANDING_DECISION'; id: string }
    | { kind: 'SESSION'; row: string }

export interface Bounds {
    kind: 'COUNT' | 'INTERVAL' | 'SET' | 'QUALITATIVE'
    min?: number | null
    max?: number | null
    members?: unknown[]
    /** The authored words, for a qualitative bound. SD-15 forbids inventing a number here. */
    term?: string
    /**
     * The bound states a PREFERRED_DEFAULT, not a requirement. It is carried so a consumer can offer
     * it and record departures from it, and it must never be enforced as though it were required -
     * intersecting a preference with a requirement turns the preference into a ceiling the knowledge
     * does not state (SD-90 governs the relationship).
     */
    preferred?: boolean
    /**
     * The bound comes from an EXCLUSION item: what it carries is what the value may NOT be. Added 13 October.
     *
     * An exclusion that does not entail lands in a line's bounds beside the requirements, and it used to
     * arrive shaped exactly like one — `{ kind: 'SET', members: [...] }`, the shape of a permitted set. A
     * reader that takes `members` for the values a line may hold therefore took a forbidden value for a
     * permitted one. So the bound says which it is, and every reader that asks "what may this be?" skips
     * it. Whether a value BREACHES an exclusion is not decided from here: that is the forward list's job,
     * over typed `forbiddenValues`, and prose members are not something to compare a value with.
     */
    forbidden?: boolean
    /**
     * The bound comes from an `ASSUMED` item — the restater's reading, not authored guidance. Added 14 October
     * 2026 so an assumed bound is never offered to a coach as though the knowledge stated it. Present only
     * where true.
     */
    assumed?: true
    /** min/max are FRACTIONS of the named axis, not metres - a proportional rule, resolved at realization. */
    fractionOfAxis?: boolean
    /** Which axis a fractional bound is of, where the bound itself knows. */
    axis?: string
}

/**
 * **A typed structural reference (SD-98), recognised in one place.** The gates read one when they resolve a
 * referent and derivation reads one when SD-101 compares a contribution with a class's own selector, and the
 * two must agree on what counts as typed. It lives here, beside the shared record types, so derivation does
 * not import the gates to ask (14 October 2026, Step 4 component 1).
 */
export function structuralRefOf(value: unknown): { contractId: string; itemId: string } | null {
    const ref = value && typeof value === 'object' ? (value as any).structuralRef : null
    return ref && typeof ref.contractId === 'string' && typeof ref.itemId === 'string' ? ref : null
}

/**
 * **A relational referent (register V5 valueType, version 8): "the objective reference of designation D"** — 15
 * October 2026, stage K1, capability M8. His 17 October words: *"M8 — Controlled arrival and long-clearance
 * validation: Approved. Apply the qualifying conditions to the target and scoring episode actually being evaluated.
 * The purpose is to recognize controlled, functional progression rather than reward an uncontrolled clearance."*
 *
 * A condition's referent written this way names no element directly: it names the J2 reference of each objective
 * held by the game whose role is `role` and whose team is the one `objectiveReferenceOf` designates at the trigger
 * (for SCORING_TEAM, the team that scored — so per team, the target THAT team attacks). The gates resolve it
 * (gates.ts `resolveRelational`) to the held objectives' own references, so it composes with any game form without
 * naming another contract's items. Only a ruled restatement writes one (C57); it is never inferred from prose, and
 * it is never a route to reference open text — an objective whose reference is open text resolves to open text.
 * "the objective reference of SCORING_TEAM" is OUR M8 wording, which he approved; it is not his sentence.
 */
export interface RelationalReferent {
    objectiveReferenceOf: string
    role: string
    asAuthored?: string
}

/** Recognised in one place, beside `structuralRefOf`, so derivation and the gates agree on what counts. */
export function relationalReferentOf(value: unknown): RelationalReferent | null {
    if (!value || typeof value !== 'object') return null
    const v = value as any
    return typeof v.objectiveReferenceOf === 'string' && typeof v.role === 'string' && !v.structuralRef ? (v as RelationalReferent) : null
}

export interface SelectorPredicate {
    /** `*` or an absent selector: matches any element of the row, using no attribute. */
    any: boolean
    terms: SelectorTerm[]
}
