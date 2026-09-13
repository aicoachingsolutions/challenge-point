/**
 * Representative Performance Context Library loader — schema RC1, library RC1.1.
 *
 * Canonical source: `back/data/sport-modules/soccer/rpc-workbook.rc1.1.xlsm`, Christian's RC1.1
 * workbook with its Implementation Staging mechanically resolved (`resolve-rpc-staging.py`), projected
 * completely into `rpc-library.rc1.json` (`project-rpc-workbook.py` — never hand-edit). The file name
 * carries the SCHEMA version, which stays RC1 while the schema is frozen.
 *
 * WHAT THIS LAYER IS FOR. Identity had nowhere to live. Game Problems are sport-universal by design,
 * so none of them can say "convert a chance"; the affordance lens was left owning the primary success
 * condition, and a finishing activity ended up rewarding space exploitation. A Representative
 * Performance Context owns the recurring sport situation and its identity — representative question,
 * purpose, primary success identity, primary scoring identity — and sits ABOVE Representative Game
 * Forms, which become the organizational realizations compatible with it (Christian, 2026-09-12).
 *
 * THE WORKBOOK STANDARD SHAPES THIS FILE, principle by principle:
 *   * Relationship-Based Design — compatibility is read from the Relationships sheet, by canonical id.
 *   * Human and Machine Separation — narrative is never parsed. Statements are carried as text for
 *     coach translation and validation; nothing here derives a rule from a sentence.
 *   * Fail Loudly — `validateRpcLibraryIntegrity` is the gate. A dangling id, an out-of-vocabulary
 *     value or a context missing one of its identity statements is a defined failure.
 *   * Implementation Staging "is never consumed by runtime reasoning" — it is exposed only so the
 *     library can refuse to claim ACTIVE while unresolved entries remain.
 *
 * NOT WIRED TO SELECTION YET. Same sequencing that worked for the Sport Module and Experience
 * Design: prove the knowledge loads and validates before it changes an activity, so a behaviour
 * change can be attributed to exactly one thing.
 */
import rpcWorkbook from './rpc-library.rc1.json'
import gameArchetypeWorkbook from '../knowledge-core/game-archetype-workbook.rc1.1.json'
import gpLibraryWorkbook from '../knowledge-core/gp-library.rc1.json'
import sessionPlanningWorkbook from '../session-planning/session-planning-model.rc1.json'
import sportModuleWorkbook from './soccer-module.rc1-v3.json'

export type RpcRow = Record<string, string | number | boolean | null>

export interface RpcWorkbook {
    source_workbook: string
    header_row: number
    registry: RpcRow[]
    statements: RpcRow[]
    relationships: RpcRow[]
    properties: RpcRow[]
    identity_rules: RpcRow[]
    transitions: RpcRow[]
    validation_rules: RpcRow[]
    controlled_vocabulary: RpcRow[]
    implementation_staging: RpcRow[]
    metadata_rows: RpcRow[]
    metadata: Record<string, string | number | boolean | null>
}

const WB = rpcWorkbook as unknown as RpcWorkbook

/** The loader version this code understands. A workbook declaring another schema is refused. */
export const SUPPORTED_SCHEMA_VERSION = 'RC1'

const text = (row: RpcRow | undefined, column: string): string => {
    const value = row?.[column]
    return value === null || value === undefined ? '' : String(value).trim()
}

export type StatementType =
    | 'REPRESENTATIVE_QUESTION'
    | 'REPRESENTATIVE_PURPOSE'
    | 'PRIMARY_SUCCESS_IDENTITY'
    | 'PRIMARY_SCORING_IDENTITY'
    | 'COACH_TRANSLATION'

const REQUIRED_STATEMENT_TYPES: readonly StatementType[] = [
    'REPRESENTATIVE_QUESTION',
    'REPRESENTATIVE_PURPOSE',
    'PRIMARY_SUCCESS_IDENTITY',
    'PRIMARY_SCORING_IDENTITY',
    'COACH_TRANSLATION',
]

/** Which column of which child sheet must use which controlled vocabulary. */
const VOCABULARY_COLUMNS: ReadonlyArray<readonly [keyof RpcWorkbook, string, string]> = [
    ['registry', 'canonical_status', 'canonical_status'],
    ['registry', 'runtime_status', 'runtime_status'],
    ['statements', 'statement_type', 'statement_type'],
    ['relationships', 'relationship_type', 'relationship_type'],
    ['relationships', 'relationship_strength', 'relationship_strength'],
    ['properties', 'importance', 'importance'],
    ['identity_rules', 'identity_role', 'identity_role'],
    ['transitions', 'transition_type', 'transition_type'],
    ['implementation_staging', 'mapping_status', 'mapping_status'],
]

/** Stable identifier column per sheet — every one must be present and unique. */
const ID_COLUMNS: ReadonlyArray<readonly [keyof RpcWorkbook, string]> = [
    ['registry', 'rpc_id'],
    ['statements', 'statement_id'],
    ['relationships', 'relationship_id'],
    ['properties', 'property_id'],
    ['identity_rules', 'identity_rule_id'],
    ['transitions', 'transition_id'],
    ['validation_rules', 'validation_id'],
    ['implementation_staging', 'mapping_id'],
]

/**
 * The canonical identifier set each related_library resolves against. A library not listed here is
 * an error rather than a pass: an unknown library is a relationship nothing can check.
 */
function canonicalIds(): Record<string, Set<string>> {
    const ga = gameArchetypeWorkbook as unknown as { archetypes: Array<Record<string, unknown>> }
    const gp = gpLibraryWorkbook as unknown as { gameProblems: Array<Record<string, unknown>> }
    const sp = sessionPlanningWorkbook as unknown as { learning_goals: Array<Record<string, unknown>> }
    const sm = sportModuleWorkbook as unknown as { game_forms: Array<Record<string, unknown>> }
    return {
        GAME_ARCHETYPE: new Set(ga.archetypes.map((r) => String(r['Archetype_ID']))),
        GAME_PROBLEM: new Set(gp.gameProblems.map((r) => String(r['ID']))),
        LEARNING_GOAL: new Set(sp.learning_goals.map((r) => String(r['ID']))),
        GAME_FORM: new Set(sm.game_forms.map((r) => String(r['game_form_id']))),
    }
}

export interface RpcIntegrityResult {
    valid: boolean
    errors: string[]
}

export interface PlanningRoute {
    learningGoalId: string
    rpcId: string
}

/** The Session Planning Model's own statement of each Guided Learning Goal's route (RC1.1). */
function planningRoutes(): PlanningRoute[] {
    const sp = sessionPlanningWorkbook as unknown as { rpc_routing?: Array<Record<string, unknown>> }
    return (sp.rpc_routing ?? []).map((r) => ({
        learningGoalId: String(r['Learning Goal ID'] ?? '').trim(),
        rpcId: String(r['Routed RPC ID'] ?? '').trim(),
    }))
}

/** The gate. Accepts a workbook and routes so tests can prove each check fails on a mutated copy. */
export function validateRpcLibraryIntegrity(data: RpcWorkbook = WB, routes: PlanningRoute[] = planningRoutes()): RpcIntegrityResult {
    const errors: string[] = []
    const meta = data.metadata ?? {}

    if (String(meta['workbook_schema_version'] ?? '') !== SUPPORTED_SCHEMA_VERSION) {
        errors.push(
            `Workbook declares schema "${String(meta['workbook_schema_version'])}"; this loader supports ` +
                `"${SUPPORTED_SCHEMA_VERSION}". The schema is frozen, so a different version is a different contract.`
        )
    }

    const declaredCount = Number(meta['canonical_rpc_count'])
    if (declaredCount !== data.registry.length) {
        errors.push(`Metadata declares ${declaredCount} contexts; the Registry holds ${data.registry.length}.`)
    }

    for (const [sheet, column] of ID_COLUMNS) {
        const seen = new Set<string>()
        for (const row of data[sheet] as RpcRow[]) {
            const id = text(row, column)
            if (!id) errors.push(`${String(sheet)} has a row with no ${column}.`)
            else if (seen.has(id)) errors.push(`${String(sheet)} repeats identifier "${id}".`)
            seen.add(id)
        }
    }

    const vocabulary = new Map<string, Set<string>>()
    for (const row of data.controlled_vocabulary) {
        const name = text(row, 'vocabulary')
        if (!vocabulary.has(name)) vocabulary.set(name, new Set())
        vocabulary.get(name)!.add(text(row, 'value'))
    }
    for (const [sheet, column, vocab] of VOCABULARY_COLUMNS) {
        const allowed = vocabulary.get(vocab)
        if (!allowed) {
            errors.push(`Controlled vocabulary "${vocab}" is not declared.`)
            continue
        }
        for (const row of data[sheet] as RpcRow[]) {
            const value = text(row, column)
            if (value && !allowed.has(value)) {
                errors.push(`${String(sheet)}.${column} = "${value}" is outside controlled vocabulary "${vocab}".`)
            }
        }
    }

    const rpcIds = new Set(data.registry.map((r) => text(r, 'rpc_id')))
    const childSheets: Array<keyof RpcWorkbook> = [
        'statements',
        'relationships',
        'properties',
        'identity_rules',
        'validation_rules',
        'implementation_staging',
    ]
    for (const sheet of childSheets) {
        for (const row of data[sheet] as RpcRow[]) {
            const rpcId = text(row, 'rpc_id')
            if (!rpcIds.has(rpcId)) errors.push(`${String(sheet)} row references unknown context "${rpcId}".`)
        }
    }
    for (const row of data.transitions) {
        for (const column of ['from_rpc', 'to_rpc']) {
            if (!rpcIds.has(text(row, column))) {
                errors.push(`Transition "${text(row, 'transition_id')}" ${column} "${text(row, column)}" is not a context.`)
            }
        }
    }

    for (const rpcId of rpcIds) {
        for (const type of REQUIRED_STATEMENT_TYPES) {
            const matches = data.statements.filter(
                (s) => text(s, 'rpc_id') === rpcId && text(s, 'statement_type') === type && text(s, 'statement_text')
            )
            if (matches.length !== 1) {
                errors.push(
                    `Context "${rpcId}" has ${matches.length} ${type} statements; exactly one is required — ` +
                        `identity that is missing, or stated twice, cannot be validated against.`
                )
            }
        }
        if (!data.identity_rules.some((r) => text(r, 'rpc_id') === rpcId && text(r, 'identity_role') === 'REQUIRED')) {
            errors.push(`Context "${rpcId}" has no REQUIRED identity rule, so nothing defines what must stay true.`)
        }
    }

    const canonical = canonicalIds()
    for (const row of data.relationships) {
        const id = text(row, 'relationship_id')
        const library = text(row, 'related_library')
        const relatedId = text(row, 'related_id')
        const known = canonical[library]
        if (!known) {
            errors.push(`Relationship "${id}" points into "${library}", which this loader cannot verify.`)
        } else if (!known.has(relatedId)) {
            errors.push(`Relationship "${id}" references ${library} "${relatedId}", which does not exist.`)
        }
        if (!text(row, 'provenance')) {
            errors.push(`Relationship "${id}" has no provenance; the Workbook Standard requires it.`)
        }
    }

    // ONE FACT, TWO STATEMENTS, SO THEY MUST AGREE. At RC1.1 the Session Planning Model routes each
    // Guided Learning Goal to a context, and this workbook states the same routes as LEARNING_GOAL
    // relationships. If they drift apart, which one the selector happened to read would decide what a
    // coach gets, so a disagreement is a defined failure rather than a silent preference.
    const learningGoalLinks = data.relationships.filter(
        (r) => text(r, 'related_library') === 'LEARNING_GOAL' && text(r, 'status') === 'ACTIVE'
    )
    for (const route of routes) {
        if (!rpcIds.has(route.rpcId)) {
            errors.push(`Session Planning routes "${route.learningGoalId}" to "${route.rpcId}", which is not a context.`)
        } else if (!learningGoalLinks.some((r) => text(r, 'rpc_id') === route.rpcId && text(r, 'related_id') === route.learningGoalId)) {
            errors.push(
                `Session Planning routes "${route.learningGoalId}" to ${route.rpcId}, but this workbook has no ACTIVE ` +
                    `LEARNING_GOAL relationship stating that route.`
            )
        }
    }
    for (const link of learningGoalLinks) {
        const route = routes.find((r) => r.learningGoalId === text(link, 'related_id'))
        if (!route || route.rpcId !== text(link, 'rpc_id')) {
            errors.push(
                `Relationship "${text(link, 'relationship_id')}" links ${text(link, 'rpc_id')} to Learning Goal ` +
                    `"${text(link, 'related_id')}", but Session Planning routes that goal to ${route ? route.rpcId : 'no context'}.`
            )
        }
    }

    // A deferral or rejection is the knowledge owner's decision, and a decision recorded without its
    // reason cannot be revisited deliberately — which is the whole point of deferring rather than
    // inferring (Christian, 13 Sep, on the 43 Affordance Targets).
    for (const row of data.implementation_staging) {
        const status = text(row, 'mapping_status')
        if ((status === 'DEFERRED' || status === 'REJECTED') && !text(row, 'notes')) {
            errors.push(`Staging "${text(row, 'mapping_id')}" is ${status} with no note recording why.`)
        }
    }

    // "No workbook may reach ACTIVE status while unresolved staging entries remain."
    const unresolved = data.implementation_staging.filter((r) => text(r, 'mapping_status') === 'NEEDS_CANONICAL_ID')
    const claimsActive =
        String(meta['runtime_status'] ?? '') === 'ACTIVE' || data.registry.some((r) => text(r, 'runtime_status') === 'ACTIVE')
    if (unresolved.length > 0 && claimsActive) {
        errors.push(
            `The workbook claims ACTIVE with ${unresolved.length} unresolved staging entries; the Workbook ` +
                `Standard does not allow ACTIVE until staging is empty.`
        )
    }

    return { valid: errors.length === 0, errors }
}

export interface RepresentativePerformanceContext {
    id: string
    name: string
    canonicalStatus: string
    runtimeStatus: string
    representativeQuestion: string
    representativePurpose: string
    primarySuccessIdentity: string
    primaryScoringIdentity: string
    coachTranslation: string
}

export interface ContextRelationship {
    relationshipId: string
    rpcId: string
    library: string
    relatedId: string
    type: string
    strength: string
}

const statement = (rpcId: string, type: StatementType): string =>
    text(WB.statements.find((s) => text(s, 'rpc_id') === rpcId && text(s, 'statement_type') === type), 'statement_text')

function toContext(row: RpcRow): RepresentativePerformanceContext {
    const id = text(row, 'rpc_id')
    return {
        id,
        name: text(row, 'rpc_name'),
        canonicalStatus: text(row, 'canonical_status'),
        runtimeStatus: text(row, 'runtime_status'),
        representativeQuestion: statement(id, 'REPRESENTATIVE_QUESTION'),
        representativePurpose: statement(id, 'REPRESENTATIVE_PURPOSE'),
        primarySuccessIdentity: statement(id, 'PRIMARY_SUCCESS_IDENTITY'),
        primaryScoringIdentity: statement(id, 'PRIMARY_SCORING_IDENTITY'),
        coachTranslation: statement(id, 'COACH_TRANSLATION'),
    }
}

function toRelationship(row: RpcRow): ContextRelationship {
    return {
        relationshipId: text(row, 'relationship_id'),
        rpcId: text(row, 'rpc_id'),
        library: text(row, 'related_library'),
        relatedId: text(row, 'related_id'),
        type: text(row, 'relationship_type'),
        strength: text(row, 'relationship_strength'),
    }
}

/** Only relationships whose status is ACTIVE are knowledge; anything else is not yet. */
const activeRelationships = (): ContextRelationship[] =>
    WB.relationships.filter((r) => text(r, 'status') === 'ACTIVE').map(toRelationship)

export const rpcLibrary = {
    sourceWorkbook: WB.source_workbook,
    schemaVersion: String(WB.metadata['workbook_schema_version'] ?? ''),
    /** The RPC Library release the workbook represents — distinct from the frozen schema version. */
    libraryVersion: String(WB.metadata['rpc_library_version'] ?? ''),
    /** PROPOSED until every staging entry is resolved; see validateRpcLibraryIntegrity. */
    runtimeStatus: String(WB.metadata['runtime_status'] ?? ''),

    contexts: (): RepresentativePerformanceContext[] => WB.registry.map(toContext),

    context: (rpcId: string): RepresentativePerformanceContext | undefined => {
        const row = WB.registry.find((r) => text(r, 'rpc_id') === rpcId)
        return row ? toContext(row) : undefined
    },

    relationships: (rpcId: string, library?: string): ContextRelationship[] =>
        activeRelationships().filter((r) => r.rpcId === rpcId && (!library || r.library === library)),

    /** Contexts a Learning Goal is compatible with, strongest relationship first. */
    contextsForLearningGoal: (learningGoalId: string): ContextRelationship[] =>
        activeRelationships()
            .filter((r) => r.library === 'LEARNING_GOAL' && r.relatedId === learningGoalId)
            .sort((a, b) => strengthRank(a.strength) - strengthRank(b.strength)),

    /** Representative Game Forms compatible with a context — its organizational realizations. */
    gameFormsForContext: (rpcId: string): ContextRelationship[] =>
        activeRelationships()
            .filter((r) => r.rpcId === rpcId && r.library === 'GAME_FORM')
            .sort((a, b) => strengthRank(a.strength) - strengthRank(b.strength)),

    identityRules: (rpcId: string): RpcRow[] => WB.identity_rules.filter((r) => text(r, 'rpc_id') === rpcId),
    properties: (rpcId: string, category?: string): RpcRow[] =>
        WB.properties.filter((r) => text(r, 'rpc_id') === rpcId && (!category || text(r, 'property_category') === category)),
    transitionsFrom: (rpcId: string): RpcRow[] => WB.transitions.filter((r) => text(r, 'from_rpc') === rpcId),
    validationRules: (rpcId: string, runtimeStage?: string): RpcRow[] =>
        WB.validation_rules.filter((r) => text(r, 'rpc_id') === rpcId && (!runtimeStage || text(r, 'runtime_stage') === runtimeStage)),

    /** For reporting only — the Workbook Standard forbids reasoning from staging. */
    unresolvedStaging: (): RpcRow[] =>
        WB.implementation_staging.filter((r) => text(r, 'mapping_status') === 'NEEDS_CANONICAL_ID'),
    /** Mappings deliberately postponed. Reported, never reasoned from, and they never block ACTIVE. */
    deferredStaging: (): RpcRow[] => WB.implementation_staging.filter((r) => text(r, 'mapping_status') === 'DEFERRED'),
}

/** REQUIRED before PRIMARY before SECONDARY before SUPPORTING; unknown strengths sort last. */
function strengthRank(strength: string): number {
    const order = ['REQUIRED', 'PRIMARY', 'SECONDARY', 'SUPPORTING']
    const index = order.indexOf(strength)
    return index === -1 ? order.length : index
}
