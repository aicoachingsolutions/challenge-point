/**
 * **The requirement bindings: how each applicable, approved context requirement is accounted for, as data of ours for his review, and
 * the gate that file is held to** — 29 October 2026 (the requirement account, report only; R-1 and R-2 of its specification).
 *
 * Christian, his reply filed 3 November 2026, section 2: *"Each generated activity should be evaluated against the applicable, approved
 * context requirements, accounting for each component of a scoring condition rather than simply confirming that the condition exists."*
 * *"For the initial increment, please proceed with the requirement report and review-page evidence."* And: *"let's verify the
 * classifications before enabling refusals broadly"*. So every classification in the file is OURS and DRAFT, shown on the review page for
 * his review, and nothing read from it refuses an activity (`requirement-account.ts`).
 *
 * **What the file is.** One entry per contracted context (`docs/audits/requirement-bindings.json`), one per applicable row of his context
 * workbook, split into parts. Each part has a kind, one of his three standards, and either typed item patterns, the guard's reading of the
 * event kind, an observable, or a cause. A pattern finds the items that carry a requirement by register row, selector term, requirement,
 * strictness, value and the kind of contract the item sits in — never by item id — so the file names no item, element, contract,
 * realization or Learning Goal (gate check 9), and the reader holds no activity-specific code.
 *
 * **Where it is read.** Only by the requirement-account reader, for an administrator's review build, after realization; never by
 * derivation, so it is outside every input digest (`derivation/engine.ts` `canonicalInput`). Bundled by `build.js` beside the other runtime
 * knowledge and found through `AUDITS_DIR`; read lazily, once, at the first administrator's review build, never at module load: a defect in
 * it must not stop the server or reach a coach's build (it becomes the account's own status). The unit test runs the gate on the real file,
 * so a defect still fails CI.
 *
 * **Every workbook the gate reads comes from a bundled JSON module** (the R-engine review's M2): the context workbook and the archetype
 * workbook a KNOWLEDGE_ROW observable cites are imported here as modules, as `rpc-library.ts` imports them, and resolved by a fixed map —
 * never through `fs` or a repository path, which in the bundle (where `__dirname` is `dist`) would read nothing, the reader would fail
 * quietly into its error status, and the built-bundle proof would pass with no account computed. This file reads one file through `fs`:
 * the bindings themselves.
 *
 * **Three modes** (the R-engine review's M1): PRODUCTION, the file above, held to the production contracts; DRAFT, the TEST-ONLY RPC-003
 * bindings of the draft store (`draft-store.ts` `loadDraftRequirementBindings`), held to the draft store's contracts; MERGED, the two
 * together (`draft-store.ts` `mergeRequirementBindings`, TEST-ONLY, kept out of this production module: round 2, R3 S5), each context held
 * to exactly one contract. No production entry point builds with DRAFT or MERGED.
 *
 * **What a scoring-condition component pins** (round 2, R1 S2): in PRODUCTION, each component's condition facet pins the scope his approved
 * knowledge carries, and each of its other facets pins the value and scope; the gate holds every pin to an item of the context's contract,
 * so a pin can only restate his knowledge, and the reader reads 4 where a contract or a finished game holds anything else.
 *
 * Sport-neutral: rows, roles, categories and terms are data; no goal, context, team or sport term is written here.
 */
import fs from 'node:fs'
import path from 'node:path'

import gameArchetypeWorkbook from '../knowledge-core/game-archetype-workbook.rc1.1.json'
import rpcWorkbook from '../sport-module/rpc-library.rc1.json'
import { loadCorpusContracts, loadProvisionalRealizations, loadRegister, loadSportProfile } from '../derivation/corpus'
import { knowledgeKey } from '../derivation/knowledge-key'
import { AUDITS_DIR } from '../derivation/knowledge-root'
import { indexRegister, RegisterIndex } from '../derivation/register'
import { CONDITION_ROW } from '../derivation/resolved-game'
import { parseSelector } from '../derivation/selector'
import { DECLARATIONS, LoadedContract, REQUIREMENTS, SCOPES, STRICTNESSES } from '../derivation/types'
import { sessionPlanningModel } from '../session-planning/session-planning-model'
import { PRIMARY_SCORING_CONDITION, rpcLibrary, RpcRow } from '../sport-module/rpc-library'
import { CONDITION_TYPE_PREFIX, constitutedConditionTypes } from './context-scoring-guard'
import { MECHANISM_DEMONSTRATIONS } from './mechanism-demonstrations'

export const REQUIREMENT_BINDINGS_FILE = path.join(AUDITS_DIR, 'requirement-bindings.json')
export const REQUIREMENT_BINDINGS_SOURCE = 'docs/audits/requirement-bindings.json' as const

/** His three standards, by id (his reply filed 3 November 2026, section 2; the words are `requirement-account.ts` `HIS_STANDARDS`). */
export const STANDARDS = ['STRUCTURAL_VALIDITY', 'LEARNING_DESIGN_RELEVANCE', 'FIELD_EFFECTIVENESS'] as const
export type RequirementStandard = (typeof STANDARDS)[number]
export const PART_KINDS = ['PATTERN', 'SCORING_CONDITION_COMPONENT', 'GUARD_EVENT_KIND', 'COACH_OBSERVED', 'UNSUPPORTED'] as const
export type PartKind = (typeof PART_KINDS)[number]
/** The kinds of contract a carrier may sit in. A constraint's or the Sport Profile's item is shown as considered, never counted (S7). */
export const CARRIER_KINDS = ['CONTEXT', 'REALIZATION', 'GAME_FORM'] as const
export type CarrierKind = (typeof CARRIER_KINDS)[number]
export const OBSERVABLE_SOURCES = ['WORKBOOK_EXPECTED_EVIDENCE', 'KNOWLEDGE_ROW', 'OURS'] as const
export type ObservableSource = (typeof OBSERVABLE_SOURCES)[number]
/** Whether the coach watches for the observable to occur, or for it not to (an end condition naming what must not happen). */
export const OBSERVABLE_EXPECTATIONS = ['PRESENT', 'ABSENT'] as const
export const AUTHORED_CAUSES = ['MISSING_KNOWLEDGE', 'MISSING_IMPLEMENTATION'] as const
/** When a referent facet's carrier holds by construction (the R-rulings review's S3): a relational referent (register V5, version 2). */
export const BY_CONSTRUCTION_WHEN = ['RELATIONAL_REFERENT'] as const
export const BINDINGS_MODES = ['PRODUCTION', 'DRAFT', 'MERGED'] as const
export type BindingsMode = (typeof BINDINGS_MODES)[number]
/** The reader's fixed carrier rule, which the file may restate and never loosen (gate check 2). */
export const ELIGIBLE_BASES = ['AUTHORED', 'OWNER_RULING'] as const
export const ELIGIBLE_FORWARD = ['SATISFIED'] as const

export interface TermPattern {
    attribute: string
    value: string
}
/** One typed pattern over register rows. It never names an item, an element, a contract, a realization or a goal. */
export interface ItemPattern {
    /** Unique within the part. */
    id: string
    /** DRAFT words, ours. */
    label: string
    /** A register row id. */
    row: string
    /** A subset of REQUIREMENTS; absent = any. */
    requirement?: string[]
    /** A subset of STRICTNESSES; absent = REQUIRED or SUPPORTING. */
    strictness?: string[]
    /** Each must hold of the item's parsed selector; absent = any selector. */
    terms?: TermPattern[]
    /** The value the item must author, and the finished game hold (compared by `sameValue`). */
    value?: unknown
    /** The scopes the item may be authored for (a subset of SCOPES); absent = any. Round 2, R1 S2. */
    scope?: string[]
    /** Instead of an item: a declaration of the contract on the row (the R-rulings review's S2: "no further value" told from "missing"). */
    declaration?: { kind: string; qualifier: string }
    /** Flag a carrier whose finished-game referent holds by construction (S3). */
    byConstructionWhen?: (typeof BY_CONSTRUCTION_WHEN)[number]
    /** The kinds of contract a carrier may sit in. */
    from: CarrierKind[]
}
export type OutsidePattern = Pick<ItemPattern, 'row' | 'requirement' | 'strictness' | 'terms' | 'from'>
export interface KnowledgeRowCitation {
    file: string
    table: string
    rowId: string
    field: string
}
export interface Observable {
    text: string
    source: ObservableSource
    citedAs: KnowledgeRowCitation | null
    expect?: (typeof OBSERVABLE_EXPECTATIONS)[number]
}
/** Control and exclusion are evaluated against the progression outcome (the R-rulings review's M1; his replies filed 16 and 17 October 2026). */
export interface SameReferent {
    component: string
    facet: string
    because: string
}
export interface BindingPart {
    id: string
    label: string
    kind: PartKind
    standard: RequirementStandard
    /** The scoring-condition component the part concerns: required on SCORING_CONDITION_COMPONENT; allowed on any part of that row. */
    component?: string
    /** His words the component stands for, verbatim in the row's text (the R-rulings review's S1). */
    rowSpan?: string
    facets?: ItemPattern[]
    /** COACH_OBSERVED only; null = "observable not identified" (account 4, his category 3 needs one). */
    observable?: Observable | null
    /** COACH_OBSERVED only; informational, never counted. */
    recordedOutsideBy?: OutsidePattern[]
    /** UNSUPPORTED only. */
    cause?: { kind: (typeof AUTHORED_CAUSES)[number]; detail: string }
    sameReferentAs?: SameReferent
    /** Rows outside the accounted set this part accounts for (shown under "Not accounted" with where they are accounted). */
    accountsFor?: string[]
    standingNote?: string
}
export interface BindingRow {
    rowId: string
    parts: BindingPart[]
}
export interface ContextBindings {
    contextId: string
    rows: BindingRow[]
}
export interface RoleLists {
    identityRoles: string[]
    propertyCategories: string[]
    validationDomains: string[]
}
export interface Applicability {
    standing: 'DRAFT'
    accounted: RoleLists
    listedNotAccounted: RoleLists & { why: string }
    /** Validation domains evaluated over the alternatives a build returns (the R-rulings review's S8): NOT_APPLICABLE to one activity. */
    overReturnedAlternatives: { validationDomains: string[]; why: string }
}
export interface RequirementBindings {
    about: string
    standing: string
    schemaVersion: 1
    version: string
    applicability: Applicability
    carriers: { standing: 'DRAFT'; eligibleBases: string[]; eligibleForward: string[]; gameFormRelationship: string }
    contexts: ContextBindings[]
    /** Stamped by the loader, never authored: the source shown in the account. */
    file: string
    /** Stamped by the loader, never authored: the production file, the TEST-ONLY draft, or the two merged (TEST-ONLY). */
    mode: BindingsMode
}

export class RequirementBindingsRefused extends Error {
    constructor(
        readonly file: string,
        readonly reasons: string[],
        /** The file could not be read at all (an I/O failure, perhaps transient): never memoized (round 2, R1 NIT 7). */
        readonly unreadable: boolean = false,
    ) {
        super(`${file} failed its integrity gate: ${reasons.join(' | ')}`)
        this.name = 'RequirementBindingsRefused'
    }
}

// ── Values and selectors, read once for the gate and the reader ────────────────────────────────────────────────────────────────────────

/**
 * Canonical text of a value: object keys sorted, so key order never decides equality. JSON semantics: a key whose value is undefined is
 * dropped, so `{a: 1, b: undefined}` reads as `{a: 1}` (harmless for authored JSON knowledge, which holds no undefined; round 2, R1 NIT 8).
 */
export function canonical(value: unknown): string {
    const sort = (node: unknown): unknown =>
        Array.isArray(node) ? node.map(sort) : node && typeof node === 'object' ? Object.fromEntries(Object.keys(node as object).sort().map(key => [key, sort((node as any)[key])])) : node
    return JSON.stringify(sort(value))
}
/**
 * **A value equal to another** (the R-rulings review's M1). Scalars compare as text (the register's values are authored as text: a boolean
 * field holds `"true"` in one item and `true` in another); anything else as canonical JSON. A set-valued field holds its members in a list,
 * so a member is equal by being in it, as realization's own "nothing lost" check reads it (`realize.ts` `nothingLost`).
 */
export function sameValue(authored: unknown, realized: unknown): boolean {
    if (Array.isArray(realized) && !Array.isArray(authored)) return realized.some(member => sameValue(authored, member))
    const scalar = (value: unknown) => value === null || ['string', 'number', 'boolean'].includes(typeof value)
    if (scalar(authored) && scalar(realized)) return String(authored) === String(realized)
    return canonical(authored) === canonical(realized)
}
/**
 * **A pinned value equal to the knowledge's own, exactly** (the round-2 recheck's N1, 29 October 2026). A pin restates his approved value,
 * so it is compared without `sameValue`'s membership rule: an item whose value was widened into a list that still holds the pinned member is
 * a different value and must not read as carried. Scalars still compare as text, for the reason `sameValue` gives.
 */
export function samePinnedValue(pinned: unknown, authored: unknown): boolean {
    const scalar = (value: unknown) => value === null || ['string', 'number', 'boolean'].includes(typeof value)
    if (scalar(pinned) && scalar(authored)) return String(pinned) === String(authored)
    return canonical(pinned) === canonical(authored)
}
/** Whether a parsed selector term holds a pattern's term: `=` that value, or `IN` a set holding it (one predicate, R3 NIT 2). */
export const termHeld = (held: { attribute: string; op: string; value?: string; values?: string[] }, term: TermPattern): boolean =>
    held.attribute === term.attribute && ((held.op === '=' && held.value === term.value) || (held.op === 'IN' && (held.values ?? []).includes(term.value)))
/** Whether an item's selector, parsed against its row, holds every term of a pattern. */
export function selectorHolds(selector: unknown, row: string, terms: TermPattern[] | undefined, index: RegisterIndex): boolean {
    const held = (parseSelector(selector, row, index).predicate?.terms ?? []) as { attribute: string; op: string; value?: string; values?: string[] }[]
    return (terms ?? []).every(term => held.some(entry => termHeld(entry, term)))
}
/** The prefix of the Sport Profile's contracts (`corpus.ts` `loadSportProfile`), shared by the gate and the reader (R3 NIT 13). */
export const SPORT_PROFILE_PREFIX = 'sport-profile:'

// ── His context workbook, read through the bundled module ──────────────────────────────────────────────────────────────────────────────

export type RowSheet = 'identity_rules' | 'properties' | 'validation_rules'
/** One ACTIVE row of a context on the three sheets the account reads, with his words verbatim. */
export interface ContextRow {
    rowId: string
    sheet: RowSheet
    /** The identity role, property category or validation domain, as the workbook holds it. */
    role: string
    text: string
    /** The validation row's expected evidence, verbatim; null on the other sheets. */
    expectedEvidence: string | null
}
const cell = (row: RpcRow | undefined, column: string): string => {
    const value = row?.[column]
    return value === null || value === undefined ? '' : String(value).trim()
}
const SHEETS: { sheet: RowSheet; key: string; role: string; text: string; list: keyof RoleLists }[] = [
    { sheet: 'identity_rules', key: 'identity_rule_id', role: 'identity_role', text: 'identity_statement', list: 'identityRoles' },
    { sheet: 'properties', key: 'property_id', role: 'property_category', text: 'property_text', list: 'propertyCategories' },
    { sheet: 'validation_rules', key: 'validation_id', role: 'validation_domain', text: 'validation_rule', list: 'validationDomains' },
]

/** Every ACTIVE row of a context on the three sheets: identity rows by id, then properties by id, then validation rows by id. */
export function contextRowsOf(contextId: string): ContextRow[] {
    const read: Record<RowSheet, RpcRow[]> = { identity_rules: rpcLibrary.identityRules(contextId), properties: rpcLibrary.properties(contextId), validation_rules: rpcLibrary.validationRules(contextId) }
    return SHEETS.flatMap(({ sheet, key, role, text }) =>
        read[sheet]
            .filter(row => cell(row, 'status') === 'ACTIVE')
            .map(row => ({ rowId: cell(row, key), sheet, role: cell(row, role), text: cell(row, text), expectedEvidence: sheet === 'validation_rules' ? cell(row, 'expected_evidence') : null }))
            .sort((a, b) => a.rowId.localeCompare(b.rowId)),
    )
}

/**
 * **The applicable rows of a context, and every other ACTIVE row with why** — one reading for the gate and the reader (the R-engine review's
 * S6): a row is accounted where its role, category or domain is in `accounted`; every other ACTIVE row is listed, never dropped silently.
 */
export function applicableRows(contextId: string, applicability: Pick<Applicability, 'accounted' | 'listedNotAccounted'>): { accounted: ContextRow[]; notAccounted: (ContextRow & { why: string })[] } {
    const accounted: ContextRow[] = []
    const notAccounted: (ContextRow & { why: string })[] = []
    for (const row of contextRowsOf(contextId)) {
        const list = SHEETS.find(entry => entry.sheet === row.sheet)!.list
        if ((applicability.accounted[list] ?? []).includes(row.role)) accounted.push(row)
        else
            notAccounted.push({
                ...row,
                why: (applicability.listedNotAccounted[list] ?? []).includes(row.role) ? applicability.listedNotAccounted.why : `its ${row.sheet === 'identity_rules' ? 'identity role' : row.sheet === 'properties' ? 'property category' : 'validation domain'} ${row.role} is neither accounted nor listed`,
            })
    }
    return { accounted, notAccounted }
}

/**
 * **The workbooks a KNOWLEDGE_ROW observable may cite, by the repository path it names, each resolved to its bundled module** (M2). Each
 * table by its own primary key; `context` names the column a context workbook's row carries its context in, so an observable cites a row
 * of the context it accounts for.
 */
const KNOWLEDGE_WORKBOOKS: Record<string, { json: unknown; tables: Record<string, string>; context: string | null }> = {
    'back/src/system/sport-module/rpc-library.rc1.json': { json: rpcWorkbook, tables: { properties: 'property_id', identity_rules: 'identity_rule_id', validation_rules: 'validation_id' }, context: 'rpc_id' },
    'back/src/system/knowledge-core/game-archetype-workbook.rc1.1.json': { json: gameArchetypeWorkbook, tables: { knowledge: 'Record_ID' }, context: null },
}

const norm = (text: string): string => text.replace(/\s+/g, ' ').trim()
/**
 * Whether a quotation is verbatim in one of the values: a whitespace-tolerant, otherwise exact, substring. Derived from
 * `derivation/draft-store.ts` `verbatimIn` (lines 185-197 at 7fd9713), never imported (the draft store is TEST-ONLY, and a static test holds
 * every production module away from it), without its ellipsis stitching: the gate refuses an ellipsis before this is asked (the R-rulings
 * review's N2; round 2, R3 NIT 3).
 */
function verbatimIn(quotation: string, values: string[]): boolean {
    const wanted = norm(quotation)
    return wanted.length > 0 && values.some(value => norm(value).includes(wanted))
}
const ELLIPSES = ['...', '…']
const hasEllipsis = (text: string): boolean => ELLIPSES.some(mark => text.includes(mark))

// ── The production knowledge the gate holds the file to, read once ─────────────────────────────────────────────────────────────────────

interface GateKnowledge {
    index: RegisterIndex
    production: LoadedContract[]
    /** Every item id of a production contract, the Sport Profile and a provisional realization (gate check 9). */
    itemIds: string[]
    realizationIds: string[]
    goalIds: Set<string>
    demonstrationIds: Set<string>
    contexts: Set<string>
    identityRoleVocabulary: Set<string>
    propertyCategories: Set<string>
    validationDomains: Set<string>
}
let knowledgeMemo: GateKnowledge | null = null
function gateKnowledge(): GateKnowledge {
    if (knowledgeMemo) return knowledgeMemo
    const production = loadCorpusContracts()
    const realizations = loadProvisionalRealizations()
    const workbook = rpcWorkbook as unknown as { identity_rules: RpcRow[]; properties: RpcRow[]; validation_rules: RpcRow[]; controlled_vocabulary: RpcRow[] }
    knowledgeMemo = {
        index: indexRegister(loadRegister()),
        production,
        itemIds: [...new Set([...production, ...loadSportProfile(), ...realizations].flatMap(contract => (contract.items ?? []).map(item => String(item.itemId))))].filter(Boolean),
        realizationIds: realizations.map(realization => realization.provisionalId),
        // The ids a Learning Goal or a mechanism demonstration is asked by (the R-engine review's N9: never `activityReviewOptions`, a cycle).
        goalIds: new Set((sessionPlanningModel.learningGoals() as any[]).map(goal => String(goal.ID))),
        demonstrationIds: new Set(MECHANISM_DEMONSTRATIONS.map(demonstration => demonstration.id)),
        contexts: new Set(rpcLibrary.contexts().map(context => context.id)),
        // Gate check 3 (the R-engine review's N2): the identity role by the workbook's controlled vocabulary; the category and domain, which
        // the workbook gives no vocabulary for, by the values its rows hold.
        identityRoleVocabulary: new Set(workbook.controlled_vocabulary.filter(row => cell(row, 'vocabulary') === 'identity_role').map(row => cell(row, 'value'))),
        propertyCategories: new Set(workbook.properties.map(row => cell(row, 'property_category'))),
        validationDomains: new Set(workbook.validation_rules.map(row => cell(row, 'validation_domain'))),
    }
    return knowledgeMemo
}
/** The production contract of a context, where it has one: a corpus contract keyed by the context. */
export function productionContextContract(contextId: string): LoadedContract | null {
    return gateKnowledge().production.find(contract => knowledgeKey(contract.contractId) === knowledgeKey(contextId)) ?? null
}
/** Every context with a production contract. */
export function productionContractedContexts(): string[] {
    const known = gateKnowledge().contexts
    return [...new Set(gateKnowledge().production.map(contract => knowledgeKey(contract.contractId)))].filter(id => known.has(id))
}

// ── The gate ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

const isObject = (value: unknown): value is Record<string, any> => !!value && typeof value === 'object' && !Array.isArray(value)
const filled = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0
const isStringList = (value: unknown): value is string[] => Array.isArray(value) && value.every(entry => typeof entry === 'string')
function closed(where: string, value: Record<string, unknown>, allowed: string[], reasons: string[]): void {
    for (const key of Object.keys(value)) if (!allowed.includes(key)) reasons.push(`${where} carries the unknown key ${JSON.stringify(key)}`)
}
function stringsOf(value: unknown, out: string[] = []): string[] {
    if (typeof value === 'string') out.push(value)
    else if (Array.isArray(value)) value.forEach(entry => stringsOf(entry, out))
    else if (isObject(value)) Object.values(value).forEach(entry => stringsOf(entry, out))
    return out
}

const TOP_KEYS = ['about', 'standing', 'schemaVersion', 'version', 'applicability', 'carriers', 'contexts']
const PART_KEYS = ['id', 'label', 'kind', 'standard', 'component', 'rowSpan', 'facets', 'observable', 'recordedOutsideBy', 'cause', 'sameReferentAs', 'accountsFor', 'standingNote']
const FACET_KEYS = ['id', 'label', 'row', 'requirement', 'strictness', 'terms', 'value', 'scope', 'declaration', 'byConstructionWhen', 'from']
const OUTSIDE_KEYS = ['row', 'requirement', 'strictness', 'terms', 'from']
const STRUCTURAL_KINDS: PartKind[] = ['PATTERN', 'SCORING_CONDITION_COMPONENT', 'GUARD_EVENT_KIND']
const CONTRACT_PREFIXES = ['restated:', 'provisional:', 'blind:', SPORT_PROFILE_PREFIX]

/**
 * **Every defect of a bindings file, named; empty where it passes** (the specification's 1.3, with the reviews' corrections). `mode`:
 * PRODUCTION holds the file to the production contracts; DRAFT to `draftContracts` (the TEST-ONLY draft store's); MERGED holds each context
 * to exactly one of the two.
 *
 *  1. closed keys; a DRAFT standing (in DRAFT and MERGED, `DRAFT - TEST-ONLY`); schema version 1; a version;
 *  2. carriers no looser than the reader's fixed rule;
 *  3. applicability in his vocabularies, accounted and listed disjoint, the domains evaluated over alternatives among the accounted;
 *  4. each context in his library, with its contract by mode, every production-contracted context bound (PRODUCTION, MERGED), and every
 *     role or category its ACTIVE rows hold either accounted or listed (S6);
 *  5. each applicable row bound exactly once, and nothing else;
 *  6. each part: kind, standard (structural kinds structural only; coach observation never structural, and for relevance only on his
 *     workbook's expected evidence naming a coach's judgment, S5), component and words of his row (S1), accountsFor, sameReferentAs;
 *  7. each facet: a register row, his vocabularies, selector attributes the row offers, carrier kinds, a declaration's kind;
 *  8. kind by kind: a component's condition facet on the conditions row, and every condition type the context's contract constitutes bound
 *     as a component; an observable verbatim in what it cites, read through the bundled workbooks (M2), with no ellipsis (N2);
 *  9. nothing activity-keyed: no contract prefix, item id, realization id, Learning Goal id or demonstration id in any string but the
 *     file's `about` and `standing`; and, in PRODUCTION, no TEST-ONLY words (they mark test data).
 */
export function requirementBindingsRefusals(raw: unknown, deps: { mode: BindingsMode; draftContracts?: LoadedContract[] }): string[] {
    const reasons: string[] = []
    const known = gateKnowledge()
    const draftContracts = deps.draftContracts ?? []
    if (!isObject(raw)) return ['the requirement bindings are not an object']
    closed('the file', raw, TOP_KEYS, reasons)

    // 1.
    const testOnly = deps.mode === 'DRAFT' || deps.mode === 'MERGED'
    if (!filled(raw.about)) reasons.push('the file has no about')
    if (!filled(raw.standing) || !raw.standing.startsWith('DRAFT')) reasons.push(`the file's standing does not start DRAFT (${JSON.stringify(raw.standing ?? null)})`)
    else if (testOnly && !raw.standing.startsWith('DRAFT - TEST-ONLY')) reasons.push(`in ${deps.mode} mode the standing must start "DRAFT - TEST-ONLY" (${JSON.stringify(raw.standing)})`)
    if (raw.schemaVersion !== 1) reasons.push(`schemaVersion is ${JSON.stringify(raw.schemaVersion ?? null)}, not 1`)
    if (!filled(raw.version)) reasons.push('the file has no version')

    // 2.
    const carriers = raw.carriers
    if (!isObject(carriers)) reasons.push('the file has no carriers')
    else {
        closed('carriers', carriers, ['standing', 'eligibleBases', 'eligibleForward', 'gameFormRelationship'], reasons)
        if (carriers.standing !== 'DRAFT') reasons.push('carriers do not stand DRAFT')
        if (!isStringList(carriers.eligibleBases) || !carriers.eligibleBases.length || carriers.eligibleBases.some(basis => !(ELIGIBLE_BASES as readonly string[]).includes(basis)))
            reasons.push(`carriers.eligibleBases ${JSON.stringify(carriers.eligibleBases ?? null)} is looser than the reader's rule (${ELIGIBLE_BASES.join(', ')})`)
        if (!isStringList(carriers.eligibleForward) || JSON.stringify(carriers.eligibleForward) !== JSON.stringify(ELIGIBLE_FORWARD))
            reasons.push(`carriers.eligibleForward ${JSON.stringify(carriers.eligibleForward ?? null)} is not the reader's rule (${ELIGIBLE_FORWARD.join(', ')})`)
        if (!filled(carriers.gameFormRelationship)) reasons.push('carriers name no game form relationship')
    }

    // 3.
    const applicability = raw.applicability
    let accounted: RoleLists = { identityRoles: [], propertyCategories: [], validationDomains: [] }
    let listed: RoleLists = { identityRoles: [], propertyCategories: [], validationDomains: [] }
    if (!isObject(applicability)) reasons.push('the file has no applicability')
    else {
        closed('applicability', applicability, ['standing', 'accounted', 'listedNotAccounted', 'overReturnedAlternatives'], reasons)
        if (applicability.standing !== 'DRAFT') reasons.push('applicability does not stand DRAFT')
        const vocabularies: Record<keyof RoleLists, Set<string>> = { identityRoles: known.identityRoleVocabulary, propertyCategories: known.propertyCategories, validationDomains: known.validationDomains }
        const lists = (where: string, value: unknown, extra: string[]): RoleLists => {
            const out: RoleLists = { identityRoles: [], propertyCategories: [], validationDomains: [] }
            if (!isObject(value)) {
                reasons.push(`applicability.${where} is not an object`)
                return out
            }
            closed(`applicability.${where}`, value, ['identityRoles', 'propertyCategories', 'validationDomains', ...extra], reasons)
            for (const key of Object.keys(out) as (keyof RoleLists)[]) {
                const entries = value[key]
                if (!isStringList(entries)) {
                    reasons.push(`applicability.${where}.${key} is not a list`)
                    continue
                }
                for (const entry of entries) if (!vocabularies[key].has(entry)) reasons.push(`applicability.${where}.${key} names ${JSON.stringify(entry)}, which his workbook does not hold`)
                out[key] = entries
            }
            return out
        }
        accounted = lists('accounted', applicability.accounted, [])
        listed = lists('listedNotAccounted', applicability.listedNotAccounted, ['why'])
        if (isObject(applicability.listedNotAccounted) && !filled(applicability.listedNotAccounted.why)) reasons.push('applicability.listedNotAccounted says no why')
        for (const key of Object.keys(accounted) as (keyof RoleLists)[]) for (const entry of accounted[key]) if (listed[key].includes(entry)) reasons.push(`applicability names ${entry} both accounted and listed`)
        const over = applicability.overReturnedAlternatives
        if (!isObject(over)) reasons.push('applicability.overReturnedAlternatives is not an object')
        else {
            closed('applicability.overReturnedAlternatives', over, ['validationDomains', 'why'], reasons)
            if (!isStringList(over.validationDomains)) reasons.push('applicability.overReturnedAlternatives.validationDomains is not a list')
            else for (const domain of over.validationDomains) if (!accounted.validationDomains.includes(domain)) reasons.push(`applicability.overReturnedAlternatives names ${domain}, which is not accounted`)
            if (!filled(over.why)) reasons.push('applicability.overReturnedAlternatives says no why')
        }
    }

    // 4. and 5. to 8.
    const contexts = raw.contexts
    if (!Array.isArray(contexts)) {
        reasons.push('the file has no list of contexts')
        return reasons
    }
    const draftOf = (contextId: string) => draftContracts.find(contract => knowledgeKey(contract.contractId) === knowledgeKey(contextId)) ?? null
    const bound = new Set<string>()
    for (const [at, entry] of contexts.entries()) {
        const where = `contexts[${at}]`
        if (!isObject(entry)) {
            reasons.push(`${where} is not an object`)
            continue
        }
        closed(where, entry, ['contextId', 'rows'], reasons)
        const contextId = String(entry.contextId ?? '')
        if (!known.contexts.has(contextId)) {
            reasons.push(`${where} names ${JSON.stringify(entry.contextId ?? null)}, which is not a context of his library`)
            continue
        }
        if (bound.has(contextId)) reasons.push(`${contextId} is bound twice`)
        bound.add(contextId)
        const production = productionContextContract(contextId)
        const draft = draftOf(contextId)
        let contract: LoadedContract | null = null
        if (deps.mode === 'PRODUCTION') {
            if (!production) reasons.push(`${contextId} has no production contract: its bindings belong in the TEST-ONLY draft bindings`)
            contract = production
        } else if (deps.mode === 'DRAFT') {
            if (!draft) reasons.push(`${contextId} has no contract in the draft store`)
            contract = draft
        } else {
            if (production && draft) reasons.push(`${contextId} has both a production contract and a draft one; merged bindings hold each context to exactly one`)
            else if (!production && !draft) reasons.push(`${contextId} has neither a production contract nor a draft one`)
            contract = production ?? draft
        }
        // S6: every role or category of an ACTIVE row of a bound context is accounted or listed.
        for (const row of contextRowsOf(contextId)) {
            const list = SHEETS.find(sheet => sheet.sheet === row.sheet)!.list
            if (!accounted[list].includes(row.role) && !listed[list].includes(row.role)) reasons.push(`${contextId}: ${row.rowId}'s ${row.role} is neither accounted nor listed in applicability (nothing of his workbook is dropped silently)`)
        }
        // A context bound in MERGED mode to its production contract is held as PRODUCTION is (the pins); a draft one as DRAFT is.
        contextRefusals(contextId, entry.rows, accounted, listed, contract, known, reasons, deps.mode === 'MERGED' ? (production ? 'PRODUCTION' : 'DRAFT') : deps.mode)
    }
    if (deps.mode !== 'DRAFT') for (const contextId of productionContractedContexts()) if (!bound.has(contextId)) reasons.push(`${contextId} has a production contract and no bindings`)

    // 9.
    const prefixes = [...new Set([...CONTRACT_PREFIXES, ...draftContracts.map(contract => `${contract.contractId.split(':')[0]}:`)])]
    const itemIds = [...new Set([...known.itemIds, ...draftContracts.flatMap(contract => (contract.items ?? []).map(item => String(item.itemId)))])].filter(Boolean)
    const { about: _about, standing: _standing, ...scanned } = raw
    for (const text of stringsOf(scanned)) {
        // Production knowledge carries no TEST-ONLY words: they mark test data, and the build's own tests read them as such.
        if (deps.mode === 'PRODUCTION' && text.includes('TEST-ONLY')) reasons.push(`a production string says TEST-ONLY: ${JSON.stringify(text.slice(0, 120))}`)
        for (const prefix of prefixes) if (text.includes(prefix)) reasons.push(`a string names a contract (${prefix}): ${JSON.stringify(text.slice(0, 120))}`)
        for (const id of itemIds) if (text.includes(id)) reasons.push(`a string names the item ${id}: ${JSON.stringify(text.slice(0, 120))}`)
        for (const id of known.realizationIds) if (text.includes(id)) reasons.push(`a string names the provisional realization ${id}: ${JSON.stringify(text.slice(0, 120))}`)
        for (const token of text.match(/[A-Za-z0-9]+/g) ?? []) if (known.goalIds.has(token)) reasons.push(`a string names the Learning Goal ${token}: ${JSON.stringify(text.slice(0, 120))}`)
        for (const token of text.match(/[A-Za-z0-9_-]+/g) ?? []) if (known.demonstrationIds.has(token)) reasons.push(`a string names the mechanism demonstration ${token}: ${JSON.stringify(text.slice(0, 120))}`)
    }
    return reasons
}

/** Checks 5 to 8 for one context. */
function contextRefusals(contextId: string, rows: unknown, accounted: RoleLists, listed: RoleLists, contract: LoadedContract | null, known: GateKnowledge, reasons: string[], mode: BindingsMode): void {
    if (!Array.isArray(rows)) {
        reasons.push(`${contextId}: no list of rows`)
        return
    }
    const all = contextRowsOf(contextId)
    const { accounted: applicable } = applicableRows(contextId, { accounted, listedNotAccounted: { ...listed, why: '' } })
    const seen = new Set<string>()
    const accountedFor = new Set<string>()
    const components = new Set<string>()
    for (const [at, entry] of rows.entries()) {
        const where = `${contextId} rows[${at}]`
        if (!isObject(entry)) {
            reasons.push(`${where} is not an object`)
            continue
        }
        closed(where, entry, ['rowId', 'parts'], reasons)
        const rowId = String(entry.rowId ?? '')
        const row = all.find(candidate => candidate.rowId === rowId)
        if (!row) {
            reasons.push(`${where}: ${JSON.stringify(entry.rowId ?? null)} is not an ACTIVE row of ${contextId} in his workbook`)
            continue
        }
        if (!applicable.some(candidate => candidate.rowId === rowId)) reasons.push(`${contextId}: ${rowId} (${row.role}) is outside the applicable set`)
        if (seen.has(rowId)) reasons.push(`${contextId}: ${rowId} is bound twice`)
        seen.add(rowId)
        if (!Array.isArray(entry.parts) || !entry.parts.length) {
            reasons.push(`${contextId} ${rowId}: no parts`)
            continue
        }
        const partIds = new Set<string>()
        const scoringRow = row.sheet === 'properties' && row.role === PRIMARY_SCORING_CONDITION
        for (const [partAt, part] of entry.parts.entries()) {
            const label = `${contextId} ${rowId} part ${isObject(part) && filled(part.id) ? part.id : `[${partAt}]`}`
            if (!isObject(part)) {
                reasons.push(`${label} is not an object`)
                continue
            }
            closed(label, part, PART_KEYS, reasons)
            if (!filled(part.id)) reasons.push(`${label} has no id`)
            else if (partIds.has(part.id)) reasons.push(`${label}: the id is used twice in the row`)
            partIds.add(String(part.id))
            if (!filled(part.label)) reasons.push(`${label} has no label`)
            if (!(PART_KINDS as readonly string[]).includes(part.kind)) reasons.push(`${label}: unknown kind ${JSON.stringify(part.kind ?? null)}`)
            if (!(STANDARDS as readonly string[]).includes(part.standard)) reasons.push(`${label}: unknown standard ${JSON.stringify(part.standard ?? null)}`)
            const kind = part.kind as PartKind
            // 6. Standards by kind. His words: "A requirement should not automatically count as satisfied merely because the coach could
            // theoretically judge it." (his reply filed 3 November 2026, section 2.)
            if (STRUCTURAL_KINDS.includes(kind) && part.standard !== 'STRUCTURAL_VALIDITY') reasons.push(`${label}: a ${kind} part takes STRUCTURAL_VALIDITY only`)
            if (kind === 'COACH_OBSERVED' && part.standard === 'STRUCTURAL_VALIDITY') reasons.push(`${label}: coach observation never takes STRUCTURAL_VALIDITY`)
            /**
             * The R-rulings review's S5: his relevance standard is "a grounded relationship to the intended Game Problem and affordances" and
             * field effectiveness the one "requiring coach observation" (same reply). So coach observation stands for relevance only where his
             * workbook's own expected evidence names a coach's judgment; anywhere else a relevance part with no grounded relationship is
             * UNSUPPORTED. Our DRAFT rule, read mechanically: the expected evidence names the coach.
             */
            if (kind === 'COACH_OBSERVED' && part.standard === 'LEARNING_DESIGN_RELEVANCE') {
                const observable = part.observable
                if (!isObject(observable) || observable.source !== 'WORKBOOK_EXPECTED_EVIDENCE' || !/\bcoach\b/i.test(String(observable.text ?? '')))
                    reasons.push(`${label}: coach observation stands for learning-design relevance only on his workbook's expected evidence naming a coach's judgment`)
            }
            // Component, and his words it stands for (S1).
            if (part.component !== undefined) {
                if (!filled(part.component)) reasons.push(`${label}: an empty component`)
                else if (!scoringRow) reasons.push(`${label}: a component is named only on a ${PRIMARY_SCORING_CONDITION} row`)
            }
            if (kind === 'SCORING_CONDITION_COMPONENT') {
                if (!scoringRow) reasons.push(`${label}: a SCORING_CONDITION_COMPONENT part sits only on a ${PRIMARY_SCORING_CONDITION} row`)
                if (!filled(part.component)) reasons.push(`${label}: a SCORING_CONDITION_COMPONENT part names its component`)
                else components.add(part.component)
                if (!filled(part.rowSpan)) reasons.push(`${label}: a SCORING_CONDITION_COMPONENT part quotes the words of his row it stands for (rowSpan)`)
            }
            if (part.rowSpan !== undefined) {
                if (!STRUCTURAL_KINDS.includes(kind) || !filled(part.component)) reasons.push(`${label}: rowSpan is carried only by a structural part naming a component`)
                else if (hasEllipsis(String(part.rowSpan)) || !verbatimIn(String(part.rowSpan), [row.text])) reasons.push(`${label}: rowSpan ${JSON.stringify(part.rowSpan)} is not verbatim, whole, in his row's text`)
            }
            // accountsFor: rows outside the accounted set, each accounted once.
            if (part.accountsFor !== undefined) {
                if (!isStringList(part.accountsFor) || !part.accountsFor.length) reasons.push(`${label}: accountsFor is not a list of rows`)
                else
                    for (const other of part.accountsFor) {
                        const found = all.find(candidate => candidate.rowId === other)
                        if (!found) reasons.push(`${label}: accountsFor names ${other}, which is not an ACTIVE row of ${contextId}`)
                        else if (applicable.some(candidate => candidate.rowId === other)) reasons.push(`${label}: accountsFor names ${other}, which is accounted in its own right`)
                        if (accountedFor.has(other)) reasons.push(`${label}: ${other} is accounted for twice`)
                        accountedFor.add(other)
                    }
            }
            // 7. and 8. by kind.
            const facets = part.facets
            const isPatternKind = kind === 'PATTERN' || kind === 'SCORING_CONDITION_COMPONENT'
            if (isPatternKind) {
                if (!Array.isArray(facets) || !facets.length) reasons.push(`${label}: a ${kind} part has at least one facet`)
                else {
                    const facetIds = new Set<string>()
                    for (const [facetAt, facet] of facets.entries()) {
                        const facetLabel = `${label} facet ${isObject(facet) && filled(facet.id) ? facet.id : `[${facetAt}]`}`
                        if (isObject(facet) && filled(facet.id)) {
                            if (facetIds.has(facet.id)) reasons.push(`${facetLabel}: the id is used twice in the part`)
                            facetIds.add(facet.id)
                        }
                        facetRefusals(facetLabel, facet, FACET_KEYS, true, known, reasons)
                    }
                    if (kind === 'SCORING_CONDITION_COMPONENT') {
                        const first = facets[0]
                        const term = isObject(first) && Array.isArray(first.terms) ? first.terms.find((t: any) => t?.attribute === CONDITION_TYPE_PREFIX.slice(0, -1) && t?.value === part.component) : null
                        if (
                            !isObject(first) ||
                            first.row !== CONDITION_ROW ||
                            JSON.stringify(first.requirement) !== JSON.stringify(['EXISTS']) ||
                            JSON.stringify(first.strictness) !== JSON.stringify(['REQUIRED']) ||
                            !term ||
                            !isStringList(first.from) ||
                            first.from.some(kindOf => !['CONTEXT', 'REALIZATION'].includes(kindOf)) ||
                            first.declaration !== undefined
                        )
                            reasons.push(`${label}: a component's first facet is its condition on ${CONDITION_ROW} (EXISTS, REQUIRED, ${CONDITION_TYPE_PREFIX}${String(part.component)}, from the context or the realization)`)
                        /**
                         * Round 2, R1 S2: in PRODUCTION a component pins what his approved knowledge carries — its condition's scope, and each other
                         * facet's value and scope (a declaration facet aside) — so an altered value or scope reads 4 rather than 1.
                         */
                        if (mode === 'PRODUCTION')
                            for (const [facetAt, facet] of facets.entries()) {
                                if (!isObject(facet) || facet.declaration !== undefined) continue
                                const where = `${label} facet ${filled(facet.id) ? facet.id : `[${facetAt}]`}`
                                if (!Array.isArray(facet.scope)) reasons.push(`${where}: a scoring-condition component pins the scope its knowledge carries`)
                                if (facetAt > 0 && !Object.prototype.hasOwnProperty.call(facet, 'value')) reasons.push(`${where}: a scoring-condition component pins the value its knowledge carries`)
                            }
                    }
                    /**
                     * Round 2, R1 S2: a pin can only restate his knowledge. Every facet pinning a value or a scope, on a component of the scoring
                     * condition, is held by an item of the context's contract on that row whose selector holds the facet's terms.
                     */
                    if (contract && kind === 'SCORING_CONDITION_COMPONENT')
                        for (const facet of facets) {
                            if (!isObject(facet) || facet.declaration !== undefined || (facet.value === undefined && facet.scope === undefined)) continue
                            if (!known.index.rows.has(String(facet.row))) continue
                            const held = (contract.items ?? []).some(
                                item =>
                                    String(item.row) === String(facet.row) &&
                                    selectorHolds(item.selector, String(item.row), facet.terms, known.index) &&
                                    (facet.value === undefined || samePinnedValue(facet.value, item.value)) &&
                                    (!Array.isArray(facet.scope) || facet.scope.includes(String(item.scope))),
                            )
                            if (!held) reasons.push(`${label} facet ${String(facet.id)}: its pinned ${facet.value !== undefined ? 'value' : 'scope'} is held by no item of ${contextId}'s contract on ${String(facet.row)}; a pin restates his knowledge, never adds to it`)
                        }
                }
            } else if (facets !== undefined) reasons.push(`${label}: a ${kind} part carries no facets`)
            if (kind === 'COACH_OBSERVED') {
                observableRefusals(label, part.observable, row, contextId, reasons)
                if (part.recordedOutsideBy !== undefined) {
                    if (!Array.isArray(part.recordedOutsideBy)) reasons.push(`${label}: recordedOutsideBy is not a list`)
                    else part.recordedOutsideBy.forEach((pattern: unknown, outsideAt: number) => facetRefusals(`${label} recordedOutsideBy[${outsideAt}]`, pattern, OUTSIDE_KEYS, false, known, reasons))
                }
            } else {
                if (part.observable !== undefined) reasons.push(`${label}: only a COACH_OBSERVED part carries an observable`)
                if (part.recordedOutsideBy !== undefined) reasons.push(`${label}: only a COACH_OBSERVED part carries recordedOutsideBy`)
            }
            if (kind === 'UNSUPPORTED') {
                if (!isObject(part.cause) || !(AUTHORED_CAUSES as readonly string[]).includes(part.cause.kind) || !filled(part.cause.detail)) reasons.push(`${label}: an UNSUPPORTED part names its cause (${AUTHORED_CAUSES.join(' or ')}) and why`)
                else closed(`${label} cause`, part.cause, ['kind', 'detail'], reasons)
            } else if (part.cause !== undefined) reasons.push(`${label}: only an UNSUPPORTED part carries a cause`)
            if (part.standingNote !== undefined && !filled(part.standingNote)) reasons.push(`${label}: an empty standingNote`)
        }
        // sameReferentAs, once every part of the row is known.
        for (const part of entry.parts as any[]) {
            if (!isObject(part) || part.sameReferentAs === undefined) continue
            const label = `${contextId} ${rowId} part ${String(part.id)}`
            const same = part.sameReferentAs
            if (part.kind !== 'SCORING_CONDITION_COMPONENT' || !isObject(same)) {
                reasons.push(`${label}: sameReferentAs is carried only by a SCORING_CONDITION_COMPONENT part, as {component, facet, because}`)
                continue
            }
            closed(`${label} sameReferentAs`, same, ['component', 'facet', 'because'], reasons)
            const other = (entry.parts as any[]).find(candidate => isObject(candidate) && candidate.kind === 'SCORING_CONDITION_COMPONENT' && candidate.component === same.component && candidate !== part)
            if (!other) reasons.push(`${label}: sameReferentAs names ${JSON.stringify(same.component ?? null)}, which is no other component of the row`)
            const hasFacet = (candidate: any) => Array.isArray(candidate?.facets) && candidate.facets.some((facet: any) => facet?.id === same.facet)
            if (!hasFacet(part) || (other && !hasFacet(other))) reasons.push(`${label}: sameReferentAs names the facet ${JSON.stringify(same.facet ?? null)}, which both parts must hold`)
            if (!filled(same.because)) reasons.push(`${label}: sameReferentAs says no because`)
        }
    }
    for (const row of applicable) if (!seen.has(row.rowId)) reasons.push(`${contextId}: the applicable row ${row.rowId} (${row.role}) has no entry`)
    // 8. Completeness against the contract: every condition type it constitutes is a component (a component it lacks is allowed: that is how
    // a removed component shows as missing).
    if (contract) for (const { type, itemId } of constitutedConditionTypes(contract)) if (!components.has(type)) reasons.push(`${contextId}: its contract constitutes the ${type} condition (${itemId}, on ${CONDITION_ROW}), which no component binds; a binding may never omit a component the contract carries`)
}

/** Check 7: one facet (or, with `isFacet` false, a recordedOutsideBy pattern). */
function facetRefusals(where: string, facet: unknown, keys: string[], isFacet: boolean, known: GateKnowledge, reasons: string[]): void {
    if (!isObject(facet)) {
        reasons.push(`${where} is not an object`)
        return
    }
    closed(where, facet, keys, reasons)
    if (isFacet) {
        if (!filled(facet.id)) reasons.push(`${where} has no id`)
        if (!filled(facet.label)) reasons.push(`${where} has no label`)
    }
    const rowId = String(facet.row ?? '')
    const row = known.index.rows.get(rowId)
    if (!row) reasons.push(`${where}: row ${JSON.stringify(facet.row ?? null)} is not in the register`)
    if (facet.requirement !== undefined && (!isStringList(facet.requirement) || !facet.requirement.length || facet.requirement.some(entry => !(REQUIREMENTS as readonly string[]).includes(entry))))
        reasons.push(`${where}: requirement ${JSON.stringify(facet.requirement)} is outside ${REQUIREMENTS.join(', ')}`)
    if (facet.strictness !== undefined && (!isStringList(facet.strictness) || !facet.strictness.length || facet.strictness.some(entry => !(STRICTNESSES as readonly string[]).includes(entry))))
        reasons.push(`${where}: strictness ${JSON.stringify(facet.strictness)} is outside ${STRICTNESSES.join(', ')}`)
    if (facet.terms !== undefined) {
        if (!Array.isArray(facet.terms)) reasons.push(`${where}: terms is not a list`)
        else {
            // The rule `parseSelector` applies: a field row's attributes are its owner row's.
            const source = known.index.ownerRow.get(rowId) || rowId
            const attributes = known.index.rows.get(source)?.selectorAttributes ?? []
            for (const term of facet.terms) {
                if (!isObject(term) || !filled(term.attribute) || !filled(term.value)) reasons.push(`${where}: a term is not {attribute, value}`)
                else {
                    closed(`${where} term`, term, ['attribute', 'value'], reasons)
                    if (!attributes.includes(term.attribute)) reasons.push(`${where}: ${term.attribute} is not a selector attribute of ${source} (registered: ${attributes.join(', ') || 'none'})`)
                }
            }
        }
    }
    if (!isStringList(facet.from) || !facet.from.length || facet.from.some(entry => !(CARRIER_KINDS as readonly string[]).includes(entry))) reasons.push(`${where}: from ${JSON.stringify(facet.from ?? null)} is not a non-empty list of ${CARRIER_KINDS.join(', ')}`)
    if (!isFacet) return
    if (facet.declaration !== undefined) {
        const declaration = facet.declaration
        if (!isObject(declaration) || !(DECLARATIONS as readonly string[]).includes(declaration.kind) || !filled(declaration.qualifier)) reasons.push(`${where}: a declaration facet names a declaration kind (${DECLARATIONS.join(', ')}) and its qualifier`)
        else closed(`${where} declaration`, declaration, ['kind', 'qualifier'], reasons)
        if (facet.requirement !== undefined || facet.strictness !== undefined || facet.value !== undefined || facet.scope !== undefined) reasons.push(`${where}: a declaration facet carries no requirement, strictness, value or scope`)
    }
    if (facet.scope !== undefined && (!isStringList(facet.scope) || !facet.scope.length || facet.scope.some(entry => !(SCOPES as readonly string[]).includes(entry))))
        reasons.push(`${where}: scope ${JSON.stringify(facet.scope)} is outside ${SCOPES.join(', ')}`)
    if (facet.byConstructionWhen !== undefined && !(BY_CONSTRUCTION_WHEN as readonly string[]).includes(facet.byConstructionWhen)) reasons.push(`${where}: byConstructionWhen ${JSON.stringify(facet.byConstructionWhen)} is not one of ${BY_CONSTRUCTION_WHEN.join(', ')}`)
    if (Object.prototype.hasOwnProperty.call(facet, 'value') && (facet.value === null || facet.value === undefined)) reasons.push(`${where}: a value facet names its value`)
}

/** Check 8 for a COACH_OBSERVED part's observable. */
function observableRefusals(label: string, observable: unknown, row: ContextRow, contextId: string, reasons: string[]): void {
    if (observable === null) return
    if (!isObject(observable)) {
        reasons.push(`${label}: the observable is neither null nor {text, source, citedAs}`)
        return
    }
    closed(`${label} observable`, observable, ['text', 'source', 'citedAs', 'expect'], reasons)
    const text = String(observable.text ?? '')
    if (!filled(observable.text)) reasons.push(`${label}: the observable has no text`)
    if (hasEllipsis(text)) reasons.push(`${label}: the observable stitches words with an ellipsis; quote one passage whole`)
    if (observable.expect !== undefined && !(OBSERVABLE_EXPECTATIONS as readonly string[]).includes(observable.expect)) reasons.push(`${label}: expect ${JSON.stringify(observable.expect)} is not one of ${OBSERVABLE_EXPECTATIONS.join(', ')}`)
    if (observable.source === 'WORKBOOK_EXPECTED_EVIDENCE') {
        if (row.expectedEvidence === null || text !== row.expectedEvidence) reasons.push(`${label}: the observable is not his row's expected evidence exactly (${JSON.stringify(row.expectedEvidence)})`)
        if (observable.citedAs !== null) reasons.push(`${label}: an observable from the expected evidence cites nothing else (citedAs null)`)
    } else if (observable.source === 'KNOWLEDGE_ROW') {
        const cited = observable.citedAs
        if (!isObject(cited)) {
            reasons.push(`${label}: a KNOWLEDGE_ROW observable cites {file, table, rowId, field}`)
            return
        }
        closed(`${label} citedAs`, cited, ['file', 'table', 'rowId', 'field'], reasons)
        const workbook = KNOWLEDGE_WORKBOOKS[String(cited.file)]
        if (!workbook) {
            reasons.push(`${label}: cites ${JSON.stringify(cited.file)}, which is not a workbook the gate reads (${Object.keys(KNOWLEDGE_WORKBOOKS).join(', ')})`)
            return
        }
        const key = workbook.tables[String(cited.table)]
        if (!key) {
            reasons.push(`${label}: ${String(cited.table)} is not a table of ${String(cited.file)} the gate reads (${Object.keys(workbook.tables).join(', ')})`)
            return
        }
        const rows = (((workbook.json as any)?.[String(cited.table)] ?? []) as unknown[]).filter((candidate): candidate is Record<string, unknown> => isObject(candidate) && candidate[key] === cited.rowId)
        if (rows.length !== 1) {
            reasons.push(`${label}: ${String(cited.file)} holds ${rows.length} rows ${String(cited.rowId)} in ${String(cited.table)}; an observable cites exactly one`)
            return
        }
        const [found] = rows
        if (workbook.context && found[workbook.context] !== contextId) reasons.push(`${label}: ${String(cited.rowId)} is a row of ${String(found[workbook.context])}, not of ${contextId}`)
        if (!filled(cited.field) || !Object.prototype.hasOwnProperty.call(found, cited.field)) reasons.push(`${label}: ${JSON.stringify(cited.field ?? null)} is not a field of ${String(cited.rowId)}`)
        else if (!verbatimIn(text, [String(found[cited.field] ?? '')])) reasons.push(`${label}: ${JSON.stringify(text)} is not verbatim in ${String(cited.rowId)} ${String(cited.field)}`)
    } else if (observable.source === 'OURS') {
        if (observable.citedAs !== null) reasons.push(`${label}: an observable of ours cites nothing (citedAs null)`)
    } else reasons.push(`${label}: unknown observable source ${JSON.stringify(observable.source ?? null)}`)
}

// ── Loading ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

/** The production bindings, held to the gate in PRODUCTION mode; throws `RequirementBindingsRefused` naming every defect. */
export function loadRequirementBindings(file: string = REQUIREMENT_BINDINGS_FILE): RequirementBindings {
    const shown = path.resolve(file) === path.resolve(REQUIREMENT_BINDINGS_FILE) ? REQUIREMENT_BINDINGS_SOURCE : path.basename(file)
    /** Round 2, R1 NIT 7: the server's absolute path never reaches an administrator's answer; the file is named as the repository names it. */
    const withoutPath = (message: string) => [file, path.resolve(file)].reduce((text, spelled) => text.split(spelled).join(shown), message)
    let text: string
    try {
        text = fs.readFileSync(file, 'utf8')
    } catch (error) {
        throw new RequirementBindingsRefused(shown, [`the file cannot be read: ${withoutPath(error instanceof Error ? error.message : String(error))}`], true)
    }
    let raw: unknown
    try {
        // The BOM strip every knowledge reader uses (corpus.ts readJson).
        raw = JSON.parse(text.replace(/^﻿/, ''))
    } catch (error) {
        throw new RequirementBindingsRefused(shown, [`the file does not parse: ${withoutPath(error instanceof Error ? error.message : String(error))}`])
    }
    const reasons = requirementBindingsRefusals(raw, { mode: 'PRODUCTION' })
    if (reasons.length) throw new RequirementBindingsRefused(shown, reasons)
    return { ...(JSON.parse(JSON.stringify(raw)) as Omit<RequirementBindings, 'file' | 'mode'>), file: shown, mode: 'PRODUCTION' }
}

/**
 * **Read once, at the first administrator's review build, never at module load** (the specification's 1.1): a malformed file must not
 * stop the server or a coach's build. A refusal becomes the account's own status, BINDINGS_REFUSED, beside an activity otherwise unchanged.
 * A file that could not be read at all is not remembered (round 2, R1 NIT 7): the next administrator's build reads it again, so a transient
 * failure does not disable the account until the server restarts; a file that was read and refused is.
 */
let memo: { bindings: RequirementBindings | null; why: string | null } | null = null
export function requirementBindingsLoad(): { bindings: RequirementBindings | null; why: string | null } {
    if (memo) return memo
    try {
        memo = { bindings: loadRequirementBindings(), why: null }
        return memo
    } catch (error) {
        const result = { bindings: null, why: error instanceof Error ? error.message : String(error) }
        if (!(error instanceof RequirementBindingsRefused && error.unreadable)) memo = result
        return result
    }
}
