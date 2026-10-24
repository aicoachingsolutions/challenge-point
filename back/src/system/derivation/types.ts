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
     * **A ruled pairing** (23 October 2026, stage B): the id of an item IN THE SAME CONTRACT that carries `defersTo`; this item yields
     * together with it, wherever it defers, and never on its own. Written only by a ruled restatement, which the restatement loader
     * admits only where the item it names carries `defersTo` in that contract (corpus-restatement.ts); honoured in
     * `realization-deferral.ts`. The design's K2: the region a deferring objective reference points to (GF2-03.e) yields with that
     * reference (GF2-08.f). No item carries it on 23 October 2026: whether any does is his restatement (F2 of the design).
     */
    defersWith?: unknown
    /**
     * The context-manipulation relationship a provisional realization's item cites as its authority (15 October 2026, stage
     * K4): the id of an entry of the authorization records' `contextManipulationRelationships`, checked at load
     * (`learning-goal-authorizations.ts`) and read by the deferral (`realization-deferral.ts`). Since stage A (22 October 2026,
     * register version 16) the id of a relationship of ANY kind the records hold (`contextRelationships`).
     */
    authorizedBy?: unknown
    /**
     * **The role-yield marker** (stage A, 22 October 2026, register version 16; `ROLE_YIELD_KEY`): written only by a ruled ITEM
     * restatement (corpus-restatement.ts, only on an owner ruling quoting his words, only from `ROLE_YIELD_MARKERS`). Every other way in is
     * refused (stage A review fix): an added item carrying it is not inserted and a corpus item's is not honoured (both named in the
     * restatement tally), and a provisional realization or the Sport Profile carrying it fails its loader. It says that a
     * REQUIRED permitted set on the event or target rows may be departed from for ONE role, where that role's own event (row B9) and
     * objective reference cite a confirmed relationship naming this item (GA-ROLE-EVENTS, clause 6). It removes nothing: the item
     * keeps governing every other role and every game without such a citation.
     */
    yieldsForRole?: unknown
    /**
     * **The departures from the sport's normal laws an item records** (H2, 23 October 2026; `default-laws.ts`): which law, why, his words,
     * the whole of it or a part, and optionally the precondition whose absence it rests on. Written only on a provisional realization's
     * items and validated by its loader against the Sport Profile's default-laws block; read only by the default-laws account
     * (`realization/default-laws-check.ts`) after realization. Derivation reads nothing of it.
     */
    departsFrom?: unknown
}

/**
 * **The role-yield marker, as the engine implements it** — stage A, 22 October 2026 (register version 16). Christian, reply filed 25
 * October 2026, item 2: *"Please implement this as a general role-specific scoring capability, preserving structural validation and
 * knowledge authorization."* The key an item restatement may write and its closed list of values; the register's `roleScoring.roleYield`
 * must name exactly these (halt H1 in `register.ts`), so the loader (which reads no register) and the gate read one list. No item
 * carries it on 22 October 2026: whether any item yields is his ruling (restatement S1 of the note sent to him).
 */
export const ROLE_YIELD_KEY = 'yieldsForRole'
export const ROLE_YIELD_MARKERS = ['AUTHORIZED_ROLE_SCORING'] as const

/**
 * Every field of `ContractItem`, one entry each: the compiler refuses this record when a field is added to the record type and not here, or
 * named here and not there, so `ENGINE_ITEM_KEYS` cannot fall behind the type.
 */
const CONTRACT_ITEM_FIELDS: Record<keyof ContractItem, true> = {
    itemId: true,
    row: true,
    selector: true,
    requirement: true,
    value: true,
    strictness: true,
    valueStatus: true,
    scope: true,
    basis: true,
    basisEvidence: true,
    checkability: true,
    structuralClause: true,
    comparison: true,
    category: true,
    defersTo: true,
    defersWith: true,
    authorizedBy: true,
    [ROLE_YIELD_KEY]: true,
    departsFrom: true,
}

/**
 * **Every item field the engine reads by name** — stage A re-review fix, 23 October 2026. Every field of the item record (`ContractItem`,
 * kept complete by the compiler above: among them `itemId`, the item's identity, which supersessions, no-row sets and deferrals match on;
 * `authorizedBy`, the relationship citation the deferral, the role yields and the context-scoring guard read; `category`, the provisional
 * realization's authority), plus the fields engine code reads off an item that the record type does not declare: the authored spelling of the
 * identity (`id`, renamed to `itemId` at load), the contract an item is filed under once read (`contractId`), and a provisional item's own
 * choice, words and citation (`choice`, `words`, `citedAs`, read by realization and the review evidence). Read by the restatement ledger's
 * integrity gate (corpus-restatement.ts `provenanceNoteKeysOf`), which refuses a provenance-note key naming any of them, so a declared note can
 * never stand for a field anything reads. Which keys the knowledge files put on items that engine source names is measured against this list
 * in the stage A unit test, so a new read cannot slip past it.
 */
export const ENGINE_ITEM_KEYS: readonly string[] = [...Object.keys(CONTRACT_ITEM_FIELDS), 'id', 'contractId', 'choice', 'words', 'citedAs']

/**
 * **Where a marked item yields, in this composition** (stage A, 22 October 2026): the items of other selected contributions that write
 * a role's own event (row B9) or an objective's reference (row J2) and cite a CONFIRMED relationship of the context their contribution
 * realizes, which authorizes their row and names this item among those it supersedes (`realization-deferral.ts` `applyRoleYields`).
 * Recorded on a COPY of the marked item's contract; nothing is removed. Read by GA-ROLE-EVENTS clause 6 only.
 */
export interface RoleYield {
    itemId: string
    marker: string
    /**
     * Each citing item counted, with what its relationship authorizes (stage A review fix, 22 October 2026): the one scoring event and the
     * one role it is confirmed for. An item on the event row is counted only where the event it writes IS that event.
     */
    citedBy: { contractId: string; itemId: string; row: string; relationship: string; scoringEvent: string; role: string }[]
    /**
     * Citing items NOT counted, each with why (stage A review fix): an event-row item writing an event its relationship does not confirm,
     * or a relationship naming no scoring event or no role (which authorizes no role yield). Absent where there is none.
     */
    refused?: { contractId: string; itemId: string; row: string; relationship: string; why: string }[]
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
    /**
     * Items of this contract carrying the role-yield marker, each with the citing items that may depart from it for one role in this
     * composition (stage A, 22 October 2026; `RoleYield`). Absent wherever no marked item is cited.
     */
    roleYields?: RoleYield[]
}

/** An item that defers in this composition, with what it defers to (stage K4, ruling C56). */
export interface DeferredItem {
    item: ContractItem
    defersTo: string
    /** The items that author the row per team and cite the relationship. */
    deferredTo: { contractId: string; itemId: string }[]
    /** The relationship they cite. */
    relationship: string
    /**
     * Where this item yields only because the item it is paired with does (stage B, 23 October 2026; `ContractItem.defersWith`): that
     * item's id, in the same contract. `deferredTo` and `relationship` are then that item's. Absent on an item that defers in its own right.
     */
    defersWith?: string
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
    /**
     * **The objects the session states it has, by kind** — 23 October 2026 (stage E, register version 19, `sessionResources`); his reply
     * filed 25 October 2026, item 4: *"Please add the general ability to represent goal availability as a session resource"*. Object kind
     * (a kind the register's `sessionResources` lists) to how many the session has and how wide they are, in metres. Absent, or a kind
     * absent from it, means NOT STATED, never none, exactly as for `roles`; a count of 0 is a statement that there are none.
     *
     * Availability, never involvement: an object is in a game only where the game's knowledge establishes it, and the availability rule
     * (`realization/assemble-concrete-game.ts` objectAvailabilityRefusal) only asks this statement to cover the objects of a listed kind the
     * game holds. The width is a realization input too: read by a term whose extent the session may state (RC-21's `central`, `extentFrom`
     * SESSION_STATED_WIDTH), used as stated and never a default (it replaced stage B's `statedObjectWidthsM`, so the width has one source).
     * Which stated objects SUIT an activity is decision 4 of the note sent to him: the statement says nothing about it.
     */
    objects?: Record<string, StatedObjects>
}

/**
 * What a session states of the objects of one kind (stage E): how many it has, and how wide they are, in metres, where it says - and (H4,
 * register version 22) the value it states for each attribute the register lists for the kind (`sessionResources.attributes`), under the
 * attribute's name, present only where stated. The stored session, the review's answer and the envelope carry this one shape.
 */
export interface StatedObjects {
    count: number
    widthM?: number
    [attribute: string]: number | string | undefined
}

/** The value a session states for one attribute of its objects of a kind (H4), or null where it states none. */
export function statedAttributeOf(objects: unknown, kind: string, attribute: string): string | null {
    const stated = objects && typeof objects === 'object' && Object.prototype.hasOwnProperty.call(objects, kind) ? (objects as Record<string, unknown>)[kind] : undefined
    const value = stated && typeof stated === 'object' ? (stated as Record<string, unknown>)[attribute] : undefined
    return typeof value === 'string' && value.trim().length > 0 ? value : null
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
    /**
     * **Which team stands at each end in this block, where the ends are exchanged** — stage D, 23 October 2026, register version 18 (row
     * B10, the endAssignment block), his reply filed 25 October 2026, item 5: *"Team-end assignments may change between coach-controlled
     * blocks when the authorized activity configuration requires it."* Each end (a setup assignment) -> the setup assignment whose team, as
     * realization binds it for the first block, holds that end in this block: the identity in the first block, the two ends exchanged in the
     * second. Present only where the game's end assignment is the exchange, so every block of a game that keeps its ends is exactly what it
     * was (its id, its fixture and every key read from it). Entailed, never chosen (`role-blocks.ts`); applied by realization to the binding
     * it was given (`realize.ts`), so team identity stays the binding's and the end stays the designation's.
     */
    ends?: Record<string, string>
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
    /**
     * `RELATIVE` added 15 October 2026 (stage K6, register version 13) for his M7, reply filed 17 October 2026: *"M7 — Target
     * relative to pressure reference: Approved if required."* RC-21's canonical *"beyond X (for team T)"* made machine-readable:
     * the extent reaches X's far edge in T's attacking direction. `of` and `forTeam` carry the referent and the team.
     */
    kind: 'COUNT' | 'INTERVAL' | 'SET' | 'QUALITATIVE' | 'RELATIVE'
    /** For a RELATIVE bound: the register's relation (`beyond`), the element it is relative to, and the team whose direction it reads. */
    relation?: string
    of?: { contractId: string; itemId: string }
    forTeam?: string
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

/**
 * **A begin-condition referent (register V5 valueType, version 3): the restarts that begin a build-out episode** — 15
 * October 2026, stage K5, ruling C58. His words, reply filed 18 October 2026, item 4, acknowledging the begin condition's
 * wording (quoted whole in ruling C58, corpus-restatements.json): *"This provides the checkable event distinction needed to
 * separate deliberate build-out starts from ordinary restarts."*
 *
 * A condition's referent written this way names no element and no place: it designates the transitions of the game that
 * are such a restart — stopping and restarting play (T6 STOP_RESUME), beginning an episode (T7 true), and meeting one of
 * the `arms` (a taker the restart is taken by, T3; or a restart kind). `GA-EPISODE-REACHABLE` decides which transitions
 * meet it (gates.ts `buildOutStarters`), so no ordinary restart is ever read as a deliberate build-out start. Only a ruled
 * restatement writes one (C58); it is never inferred from prose.
 */
export interface BeginConditionReferent {
    beginsEpisodeOf: string
    arms: ({ takenBy: string } | { restartKind: string })[]
    asAuthored?: string
}

/** Recognised in one place, beside `relationalReferentOf`, so derivation and the gates agree on what counts. */
export function beginConditionReferentOf(value: unknown): BeginConditionReferent | null {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null
    const v = value as any
    if (typeof v.beginsEpisodeOf !== 'string' || !Array.isArray(v.arms) || !v.arms.length || v.structuralRef || v.objectiveReferenceOf) return null
    const wellFormed = v.arms.every((arm: any) => arm && typeof arm === 'object' && (typeof arm.takenBy === 'string') !== (typeof arm.restartKind === 'string'))
    return wellFormed ? (v as BeginConditionReferent) : null
}

/**
 * **A position stated relative to another element, for a team: RC-21's "beyond X (for team T)"** — 15 October 2026, stage K6,
 * register version 13, his M7 (reply filed 17 October 2026): *"M7 — Target relative to pressure reference: Approved if
 * required."* RC-21's test, canonical prose since 18 September: *"the element's near edge is at or past X's far edge, in T's
 * attacking direction"*. `term` names the register's machine-readable term (`relativeTerms.machineReadable.terms`, kind
 * `relative`), `of` the element X by a typed structural reference (SD-98), and `forTeam` a registered team designation whose
 * direction of attack the relation reads — a role holder answers through the role block the game is derived for.
 *
 * On an extent row (S5) it is a RELATIVE bound beside the element's anchor; as a start placement's region (P10, version 2) it
 * is the part of the area beyond X in that direction. Written only in an item, never inferred; the gates resolve `of`
 * (GA-REFERENCE-INTEGRITY) and check the relation on realized geometry (GA-RELATIVE-PLACEMENT).
 */
export interface RelativePosition {
    term: string
    of: { structuralRef: { contractId: string; itemId: string }; asAuthored?: string }
    forTeam: string
    asAuthored?: string
}

/** Recognised in one place, beside `structuralRefOf`, so derivation, realization and the gates agree on what counts. */
export function relativePositionOf(value: unknown): RelativePosition | null {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null
    const v = value as any
    return typeof v.term === 'string' && typeof v.forTeam === 'string' && structuralRefOf(v.of) && !v.structuralRef && !v.objectiveReferenceOf ? (v as RelativePosition) : null
}

/**
 * **A position measured from the end line a team defends — RC-21's "own end (of team T)" with a distance from it** — 15 October
 * 2026, stage K6, register version 13 (S5.valueType version 2). Register S5 reads *"interval along the axis, in metres or
 * relative"*; in a game played in role blocks the end a team defends is decided by the block, so an interval in metres states
 * its origin: `offsetM` metres measured from the end line `forTeam` defends, into the area. Written for his reply filed 18
 * October 2026, item 3: *"Pressure reference: 20 m from the building team's end line."* Only an item writes one.
 */
export interface TeamEndPosition {
    term: string
    forTeam: string
    offsetM: { from: number; to: number }
    asAuthored?: string
}

export function teamEndPositionOf(value: unknown): TeamEndPosition | null {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null
    const v = value as any
    const offset = v.offsetM
    const finite = (n: unknown) => typeof n === 'number' && Number.isFinite(n) && n >= 0
    return typeof v.term === 'string' && typeof v.forTeam === 'string' && offset && finite(offset.from) && finite(offset.to) && offset.from <= offset.to && !v.of ? (v as TeamEndPosition) : null
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
