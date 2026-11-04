/**
 * **The knowledge the design-reasoning stage reasons over, as one value that can be copied and changed in a test** — Stage 1, review pathway
 * only (Christian's reply to the development proposal, received 3 November 2026, item 8).
 *
 * WHY ONE VALUE. The proposal's acceptance checks 2 and 8 change the knowledge in a test copy (the goals' wording; one CAR rating, one context
 * strength, one form declaration, one ruling) and require exactly the dependent decisions to move. The existing loaders each bind to their own
 * committed file at module load, so they cannot be handed a copy. This file therefore gathers the committed workbooks into one value, read as
 * they are, and gives the stage small readers over that value. Where an existing loader takes its data as a parameter it is reused
 * (`gameProblemsForLearningGoal`); everywhere else the reader applies the loader's own rule (ACTIVE relationship rows only, as `rpcLibrary`
 * does), and the unit test requires every reader to agree with the existing loader on the committed knowledge.
 *
 * WHAT IS NEVER READ. Narrative is carried by the workbooks for coaches and reviewers, and the stage never reads it: no Learning Goal name,
 * coach definition, "choose this when" text, entry-language phrase, Practice Situation name, relationship note or statement text. The readers
 * below take ids, relationship rows, ratings, statuses and declared id columns only. A static test pins this.
 *
 * Sport-neutral: the sport's module arrives through the sport layer (`../sport-module/design-knowledge-sources.ts`).
 */
import atmWorkbook from '../knowledge-core/atm-workbook.rc1.2.json'
import gameArchetypeWorkbook from '../knowledge-core/game-archetype-workbook.rc1.1.json'
import gpWorkbook from '../knowledge-core/gp-library.rc1.json'
import { gameProblemsForLearningGoal } from '../session-planning/session-planning-model'
import sessionPlanningWorkbook from '../session-planning/session-planning-model.rc1.json'
import { SPORT_MODULE_WORKBOOK_PATH, sportModuleWorkbookRows } from '../sport-module/design-knowledge-sources'
import rpcWorkbook from '../sport-module/rpc-library.rc1.json'
import selectionBasis from './selection-basis.json'
import stage1Rulings from './stage1-rulings.json'

type Row = Record<string, unknown>

/** Where a fact came from: the repository file, the table (sheet) in it, and the row's key. */
export interface Cite {
    file: string
    table: string
    row: string
}

export const SOURCE = {
    planning: 'back/src/system/session-planning/session-planning-model.rc1.json',
    contexts: 'back/src/system/sport-module/rpc-library.rc1.json',
    car: 'back/src/system/knowledge-core/atm-workbook.rc1.2.json',
    gameProblems: 'back/src/system/knowledge-core/gp-library.rc1.json',
    archetypes: 'back/src/system/knowledge-core/game-archetype-workbook.rc1.1.json',
    sportModule: SPORT_MODULE_WORKBOOK_PATH,
    rulings: 'back/src/system/design-reasoning/stage1-rulings.json',
    basis: 'back/src/system/design-reasoning/selection-basis.json',
} as const

export interface ScopedTranslation {
    id: string
    learningGoalId: string
    primaryGameProblemIds: string[]
    secondaryGameProblemIds: string[]
    scope: string
    qualifier: string
    words: string[]
}

export interface RecordedRequirement {
    id: string
    status: string
    appliesWhenGameProblemsInclude: string[]
    statement: string
    words: string[]
    whatIsMissing: string
}

export interface OpenDecision {
    id: string
    appliesWhen: 'SECONDARY_DIVERGES' | 'LEARNING_GOAL'
    learningGoalId?: string
    rpcId?: string
    question: string
    words: string[]
    handling: string
}

export interface Stage1Rulings {
    standing: string
    source: string
    scopedTranslations: ScopedTranslation[]
    requirements: RecordedRequirement[]
    openDecisions: OpenDecision[]
}

export interface Ordering {
    order: string[]
    unordered?: string[]
    excludes?: string[]
    basis: string
    cites: Cite[]
}

export interface SelectionBasis {
    standing: string
    contextRelationshipStrength: Ordering
    contextRelationshipType: Ordering
    formGameProblemDeclaration: Ordering
    compatibilityGate: string
    dominanceRule: string
}

/** Every workbook the stage reads, whole. A test passes a changed deep copy; nothing else does. */
export interface DesignKnowledge {
    planning: { learning_goals: Row[]; engine_translation: Row[]; rpc_routing: Row[] } & Row
    contexts: { registry: Row[]; relationships: Row[]; controlled_vocabulary: Row[]; identity_rules: Row[] } & Row
    car: { metadata: Row; ratings: Row[] } & Row
    gameProblems: { gameProblems: Row[]; relationships: Row[] } & Row
    archetypes: { knowledge: Row[] } & Row
    sportModule: { metadata: Row; game_forms: Row[] } & Row
    rulings: Stage1Rulings
    basis: SelectionBasis
}

const deepCopy = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

/** The committed knowledge, as a fresh deep copy each call, so no caller can change what another reads. */
export function committedKnowledge(): DesignKnowledge {
    return deepCopy({
        planning: sessionPlanningWorkbook,
        contexts: rpcWorkbook,
        car: atmWorkbook,
        gameProblems: gpWorkbook,
        archetypes: gameArchetypeWorkbook,
        sportModule: sportModuleWorkbookRows(),
        rulings: stage1Rulings,
        basis: selectionBasis,
    }) as unknown as DesignKnowledge
}

/** A cell as text; empty and null both read as ''. */
export const cell = (row: Row | undefined, column: string): string => {
    const value = row?.[column]
    return value === null || value === undefined ? '' : String(value).trim()
}

/** A declared id list (ids separated by `;` or `,`) split at its separator. The ids are read, never inferred. */
export const idList = (row: Row | undefined, column: string): string[] =>
    cell(row, column)
        .split(/[;,]/)
        .map((id) => id.trim())
        .filter(Boolean)

// ---------------------------------------------------------------------------------------------------------------------------------------
// Session Planning Model: goal identity, Engine Translation and RPC routing (ids only)
// ---------------------------------------------------------------------------------------------------------------------------------------

export function learningGoalExists(k: DesignKnowledge, learningGoalId: string): { exists: boolean; status: string; cite: Cite } {
    const row = k.planning.learning_goals.find((r) => cell(r, 'ID') === learningGoalId)
    return { exists: Boolean(row), status: cell(row, 'Status'), cite: { file: SOURCE.planning, table: 'learning_goals', row: learningGoalId } }
}

/** The approved translation, by the Session Planning Model's own reader (null while the bridge is unpopulated). */
export function approvedTranslation(
    k: DesignKnowledge,
    learningGoalId: string
): { primary: string[]; secondary: string[]; cite: Cite } | null {
    // The loader's data parameter is typed to its own workbook interface, which it does not export; the shape is the same object.
    const ids = gameProblemsForLearningGoal(learningGoalId, k.planning as never)
    if (!ids) return null
    return { ...ids, cite: { file: SOURCE.planning, table: 'engine_translation', row: learningGoalId } }
}

/** Whether the translation row exists at all (a missing row and an unpopulated row are different states). */
export function translationRowExists(k: DesignKnowledge, learningGoalId: string): boolean {
    return k.planning.engine_translation.some((r) => cell(r, 'Learning Goal ID') === learningGoalId)
}

export function routedContext(k: DesignKnowledge, learningGoalId: string): { rpcId: string; cite: Cite } | null {
    const rows = k.planning.rpc_routing.filter((r) => cell(r, 'Learning Goal ID') === learningGoalId)
    if (rows.length !== 1) return null
    return { rpcId: cell(rows[0], 'Routed RPC ID'), cite: { file: SOURCE.planning, table: 'rpc_routing', row: learningGoalId } }
}

// ---------------------------------------------------------------------------------------------------------------------------------------
// Context library: registry and ACTIVE relationship rows
// ---------------------------------------------------------------------------------------------------------------------------------------

export interface RelationshipRow {
    relationshipId: string
    rpcId: string
    library: string
    relatedId: string
    type: string
    strength: string
    cite: Cite
}

/** ACTIVE relationship rows only, the context library's own rule (`activeRelationships` in rpc-library.ts). */
export function activeContextRelationships(k: DesignKnowledge, rpcId: string, library: string): RelationshipRow[] {
    return k.contexts.relationships
        .filter((r) => cell(r, 'status') === 'ACTIVE' && cell(r, 'rpc_id') === rpcId && cell(r, 'related_library') === library)
        .map((r) => ({
            relationshipId: cell(r, 'relationship_id'),
            rpcId,
            library,
            relatedId: cell(r, 'related_id'),
            type: cell(r, 'relationship_type'),
            strength: cell(r, 'relationship_strength'),
            cite: { file: SOURCE.contexts, table: 'relationships', row: cell(r, 'relationship_id') },
        }))
}

export function contextRegistryRow(
    k: DesignKnowledge,
    rpcId: string
): { canonicalStatus: string; runtimeStatus: string; libraryRuntimeStatus: string; cite: Cite } | null {
    const row = k.contexts.registry.find((r) => cell(r, 'rpc_id') === rpcId)
    if (!row) return null
    const metadata = (k.contexts.metadata ?? {}) as Row
    return {
        canonicalStatus: cell(row, 'canonical_status'),
        runtimeStatus: cell(row, 'runtime_status'),
        libraryRuntimeStatus: cell(metadata, 'runtime_status'),
        cite: { file: SOURCE.contexts, table: 'registry', row: rpcId },
    }
}

// ---------------------------------------------------------------------------------------------------------------------------------------
// CAR Matrix: ratings rows and the merge precedence its metadata declares
// ---------------------------------------------------------------------------------------------------------------------------------------

/** The four CAR requirement columns, in the workbook's own order, with the full names its metadata gives them. */
export const CAR_REQUIREMENTS = ['FOI', 'OP', 'SA', 'CIO'] as const
export type CarRequirement = (typeof CAR_REQUIREMENTS)[number]

export function carRequirementNames(k: DesignKnowledge): Record<CarRequirement, string> {
    const m = k.car.metadata
    return {
        FOI: cell(m, 'car_foi_definition'),
        OP: cell(m, 'car_op_definition'),
        SA: cell(m, 'car_sa_definition'),
        CIO: cell(m, 'car_cio_definition'),
    }
}

export interface CarRow {
    gameProblemId: string
    ratings: Record<CarRequirement, string>
    rowStatus: string
    validationStatus: string
    confidence: string
    evidenceType: string
    cite: Cite
}

export function carRow(k: DesignKnowledge, gameProblemId: string): CarRow | null {
    const row = k.car.ratings.find((r) => cell(r, 'game_problem_id') === gameProblemId)
    if (!row) return null
    return {
        gameProblemId,
        ratings: { FOI: cell(row, 'FOI'), OP: cell(row, 'OP'), SA: cell(row, 'SA'), CIO: cell(row, 'CIO') },
        rowStatus: cell(row, 'row_status'),
        validationStatus: cell(row, 'validation_status'),
        confidence: cell(row, 'confidence'),
        evidenceType: cell(row, 'evidence_type'),
        cite: { file: SOURCE.car, table: 'ratings', row: gameProblemId },
    }
}

/** `merge_precedence` as the metadata writes it (`E>S>NR`), strongest first. */
export function carMergePrecedence(k: DesignKnowledge): { order: string[]; asWritten: string; cite: Cite } {
    const asWritten = cell(k.car.metadata, 'merge_precedence')
    return {
        order: asWritten
            .split('>')
            .map((code) => code.trim())
            .filter(Boolean),
        asWritten,
        cite: { file: SOURCE.car, table: 'metadata', row: 'merge_precedence' },
    }
}

// ---------------------------------------------------------------------------------------------------------------------------------------
// Game Problem library and archetype workbook
// ---------------------------------------------------------------------------------------------------------------------------------------

export function gameProblemExists(k: DesignKnowledge, gameProblemId: string): boolean {
    return k.gameProblems.gameProblems.some((g) => cell(g, 'ID') === gameProblemId)
}

/** Relationship rows of the Game Problem library between two of the given Game Problems. */
export function gameProblemRelationshipsAmong(
    k: DesignKnowledge,
    ids: string[]
): Array<{ source: string; relationship: string; target: string; cite: Cite }> {
    return k.gameProblems.relationships
        .filter((r) => ids.includes(cell(r, 'Source_ID')) && ids.includes(cell(r, 'Target_ID')))
        .map((r) => ({
            source: cell(r, 'Source_ID'),
            relationship: cell(r, 'Relationship'),
            target: cell(r, 'Target_ID'),
            cite: { file: SOURCE.gameProblems, table: 'relationships', row: `${cell(r, 'Source_ID')} ${cell(r, 'Relationship')} ${cell(r, 'Target_ID')}` },
        }))
}

/** The archetype workbook's one GAME_PROBLEM_RELATIONSHIP row for an archetype and a Game Problem (its Uniqueness_Invariant). */
export function archetypeGameProblemRole(
    k: DesignKnowledge,
    archetypeId: string,
    gameProblemId: string
): { role: string; cite: Cite } | null {
    const row = k.archetypes.knowledge.find(
        (r) =>
            cell(r, 'Archetype_ID') === archetypeId &&
            cell(r, 'Knowledge_Type') === 'GAME_PROBLEM_RELATIONSHIP' &&
            cell(r, 'Target_ID') === gameProblemId
    )
    return row ? { role: cell(row, 'Knowledge_Role'), cite: { file: SOURCE.archetypes, table: 'knowledge', row: cell(row, 'Record_ID') } } : null
}

// ---------------------------------------------------------------------------------------------------------------------------------------
// The sport's module: Game Form declarations (ids and declared structural fields only)
// ---------------------------------------------------------------------------------------------------------------------------------------

export interface GameFormDeclaration {
    gameFormId: string
    status: string
    archetypeId: string
    primaryGameProblemIds: string[]
    secondaryGameProblemIds: string[]
    minimumPlayers: string
    maximumPlayers: string
    moduleStatus: string
    cite: Cite
}

export function gameFormDeclaration(k: DesignKnowledge, gameFormId: string): GameFormDeclaration | null {
    const row = k.sportModule.game_forms.find((r) => cell(r, 'game_form_id') === gameFormId)
    if (!row) return null
    return {
        gameFormId,
        status: cell(row, 'status'),
        archetypeId: cell(row, 'canonical_game_archetype_id'),
        primaryGameProblemIds: idList(row, 'primary_game_problem_ids'),
        secondaryGameProblemIds: idList(row, 'secondary_game_problem_ids'),
        minimumPlayers: cell(row, 'minimum_players'),
        maximumPlayers: cell(row, 'maximum_players'),
        moduleStatus: cell(k.sportModule.metadata, 'module_status'),
        cite: { file: SOURCE.sportModule, table: 'game_forms', row: gameFormId },
    }
}
