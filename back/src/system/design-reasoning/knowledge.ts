/**
 * **The knowledge the design-reasoning stage reasons over, as one value that can be copied and changed in a test** — Stages 1 and 2, review
 * pathway only (Christian's reply to the development proposal, received 3 November 2026, item 8; his reply to the Stage 2 decision package,
 * received 4 November 2026, which authorized "a bounded, review-only demonstration using the D1, D3, D5 and D6 directions").
 *
 * STAGE 2 CHANGES. His D3 withdrew our Game Form orderings, so `selection-basis.json` is no longer read (the repository history keeps it).
 * Two review-only data files join the value: `stage2-rulings.json` (his D1-D6 words, and the structures they govern) and
 * `conditions-of-use.stage2.json` (our conditions-of-use entries in the structure he approved under D5). Three readers are added, each
 * taking ids, categories, roles and statuses only: a context's property row by id, an archetype's integrity-condition rows, and whether a
 * value is in the context library's controlled vocabulary.
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
import conditionsOfUse from './conditions-of-use.stage2.json'
import stage1Rulings from './stage1-rulings.json'
import stage2Rulings from './stage2-rulings.json'

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
    stage2Rulings: 'back/src/system/design-reasoning/stage2-rulings.json',
    conditionsOfUse: 'back/src/system/design-reasoning/conditions-of-use.stage2.json',
    fixture: 'back/src/system/design-reasoning/width-scenarios.test-fixture.json',
    /** The bounded assembly experiment (his second reply of 5 November 2026): our labelled decision record, and our DRAFT coach wording. */
    assemblyExperiment: 'back/src/system/design-reasoning/assembly-experiment.review.json',
    assemblyWording: 'back/src/system/design-reasoning/assembly-wording.draft.json',
} as const

export interface ScopedTranslation {
    id: string
    learningGoalId: string
    primaryGameProblemIds: string[]
    secondaryGameProblemIds: string[]
    scope: string
    qualifier: string
    words: string[]
    /** A later ruling of his that retains this designation (Stage 2: D1). */
    continuedBy?: { ruling: string; file: string; words: string[]; note: string }
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
    /** Set when a later ruling of his answers or replaces the question; a superseded decision is no longer attached to any result. */
    supersededBy?: { ruling: string; file: string; note: string }
}

export interface Stage1Rulings {
    standing: string
    source: string
    scopedTranslations: ScopedTranslation[]
    requirements: RecordedRequirement[]
    openDecisions: OpenDecision[]
}

// ---------------------------------------------------------------------------------------------------------------------------------------
// Stage 2: his D1-D6 rulings and our conditions-of-use entries, as data (shapes only; the content is in the two JSON files)
// ---------------------------------------------------------------------------------------------------------------------------------------

/**
 * The standing a source carries. TEST ASSUMPTION and TEST INPUT mark the fixture's values. PROVISIONAL marks his words given as an
 * illustrative example, not as a ruling (it appears among an entry's sources, never in an influence trace).
 *
 * ASSEMBLY EXPERIMENT (his second reply of 5 November 2026, which allows "an illustrative value ... for this offline prototype if clearly
 * labeled"). Two standings are appended at the end, so every earlier member keeps its place: ILLUSTRATIVE (a configuration value chosen for
 * the offline prototype and labelled as such) and UNRESOLVED (no authorized value exists). The list is the single source of the type, so a
 * standing read from a data file can be checked against it at run time; Stage 2 never meets the two new members, and the trace's grouping
 * refuses them (fail closed).
 */
export const STANDINGS = ['APPROVED', 'RULING', 'PROVISIONAL', 'CANDIDATE', 'REFERENCE ONLY', 'OURS', 'TEST ASSUMPTION', 'TEST INPUT', 'ILLUSTRATIVE', 'UNRESOLVED'] as const
export type Standing = (typeof STANDINGS)[number]

/** Whether a value read from a data file is one of the standings (exact string; no trimming, no case-folding). */
export const isStanding = (value: unknown): value is Standing => typeof value === 'string' && (STANDINGS as readonly string[]).indexOf(value) >= 0

export interface Ruling {
    id: string
    decision: string
    subject: string
    /** His scope, only where his words state one (quoted in `scopeWords`); null where they state none. */
    scope: string | null
    scopeWords?: string[]
    /** OURS: what his scope words cover, where they cover part of the ruling only. */
    scopeCovers?: string
    canonicalAmendment: boolean
    words: string[]
    supersedes?: string[]
    /** Assembly experiment: the US Eastern date his reply was received (never one of our filing dates). */
    received?: string
    /** Assembly experiment: a repository-independent reference to the reply (the sources-repository path, or the received date and first words). */
    file?: string
    /** Assembly experiment: true where his own words call the decision provisional. */
    provisional?: boolean
}

export interface ReferenceCitation {
    ref: string
    standing: Standing
    documentStatus: string
    received: string
    quotes: string[]
    use: string
    /** OURS: a possible tension with his D1 reading, noted for his reconciliation; decides nothing. */
    tension?: string
}

export interface IntegrityClassification {
    conditionId: string
    recordId: string
    class: 'REQUIRED CONDITION' | 'BREACH DESCRIPTION'
    /** OURS (INFERRED), not his D6: the structural signal we map to the condition. */
    structuralSignal: 'OPPOSITION_PRESENT' | 'CONTINUOUS_PLAY_BASELINE' | null
}

export interface Stage2Rulings {
    standing: string
    source: string
    sourceStandings: Record<string, { standing: Standing; basis: string } | string>
    rulings: Ruling[]
    compositeProfile: {
        ruling: string
        effectiveProfileRule: string
        effectiveProfileWording: string
        unionViewWording: string
        findingOutcomes: string[]
        findingOutcomesStanding: string
        reconciliationRelationships: Array<{ id: string; requirement: string; outcome: string; words: string[] }>
        findingReason: string
        findingDescription: string
        citedOnly: ReferenceCitation[]
        carMergeNote: { ref: string; standing: Standing; quote: string; ourReading: string }
    }
    gameFormStep: {
        ruling: string
        gate: {
            standing: string
            excludedContextRelationshipTypes: string[]
            excludedArchetypeGameProblemRoles: string[]
            governedPreferenceTypes: string[]
            vocabularyCite: Cite
            vocabularyQuote: string
        }
        exclusionWording: string
        selectedWording: string
        alternativesWording: string
        compatibilityLabel: string
        archetypeLabel: string
        governedPreferenceWording: string
        whatCouldDistinguish: { standing: string; items: Array<{ id: string; what: string; check: 'GOVERNED_PREFERENCE_ROW' | 'RECORDED_ABSENT'; limitation: string }> }
        conditionalPreferenceWords: string
        defendingGoalsWords: string
        /** OURS: the goals his D3 sentence on the missing defending-goal relationships covers, by id. */
        knowledgePopulationFinding: { standing: string; learningGoalIds: string[] }
    }
    relevance: {
        ruling: string
        structuralPreconditions: {
            standing: string
            appliesToArchetypeIds: string[]
            label: string
            items: Array<{ id: string; statement: string; requirement: string; signal: 'OPPOSITION_PRESENT' | null; ourIdentification: string }>
        }
        continuousPlayBaselineEntry: string
        conditionsOfUseRuling: string
        integrityConditions: {
            standing: string
            wordingConfirmation: string
            structuralSignalStanding: string
            noVerdictQuote: string
            noVerdictSource: { ref: string; standing: Standing }
            classification: IntegrityClassification[]
        }
        authorizedDepartures: Array<{ learningGoalId: string; departure: string; words: string[] }>
        authorizedDeparturesNote: string
        frameworkPrinciples: { standing: string; principles: Array<{ id: string; principle: string; pinnedBy: string[]; exercised: string }>; waiting: string }
    }
    widthComparison: { ruling: string; referenceCitationRuling: string; longTermRequirementRuling: string }
    openDecisions: OpenDecision[]
}

export interface EntrySource {
    ref: string
    file?: string
    standing: Standing
    quote: string
}

export interface EntryAssumption {
    id: string
    statement: string
    handling: 'DECIDING_CIRCUMSTANCE' | 'STRUCTURAL_CHECK' | 'BACKGROUND_UNVERIFIED'
    circumstance?: string
    check?: 'EQUAL_NUMBERS'
    rule?: string
}

export type EvidenceClass = 'ESTABLISHED PRINCIPLE' | 'LOGICAL INFERENCE' | 'CAUSAL HYPOTHESIS' | 'REFERENCE KNOWLEDGE'
export type PermittedEngineUse = 'TEST-ONLY COMPARISON' | 'STRUCTURAL CHECK AND UNCERTAINTY REPORTING' | 'TRACE CITATION ONLY' | 'DEFERRED'

export type EntryKind = 'conceptual or structural principle (proposed; pending his acceptance)' | 'hypothesis' | 'reference knowledge, cited only (not a premise)'

export interface ConditionOfUse {
    id: string
    statement: string
    evidenceClass: EvidenceClass
    kind: EntryKind
    contentStanding: string
    appliesToGameProblemIds: string[]
    appliesToArchetypeIds?: string[]
    requirement?: string
    sources: EntrySource[]
    intendedInfluence: string
    assumptions: EntryAssumption[]
    limitations: string[]
    failureModes?: Array<{ mode: string; source: EntrySource | null }>
    comparison?: { invites: 'PRIMARY' | 'SECONDARY'; decidingCircumstances: Record<string, boolean> }
    fieldEvidence: string
    permittedEngineUse: PermittedEngineUse
}

export interface WidthRisk {
    kind: 'ENTRY' | 'CONTEXT_PROPERTY' | 'INTEGRITY_CONDITION'
    entryId?: string
    propertyId?: string
    expectedCategory?: string
    conditionId?: string
    quote?: string
    link: string
}

export interface ConditionsOfUse {
    standing: string
    vocabulary: Record<string, unknown>
    entries: ConditionOfUse[]
    widthComparison: {
        standing: string
        hypotheses: string[]
        /** OURS: each circumstance; `qualifierTensionWhen` names the value that sits uneasily with the qualifier of the ruling that set the primary. */
        circumstances: Array<{ key: string; label: string; futureSource: string; qualifierTensionWhen?: boolean; qualifierTensionNote?: string }>
        proposalBasis: string
        proposalLabel: string
        structuralFactLabel: string
        structuralEntries: string[]
        structuralChecks: Array<{ entryId: string; check: 'AREA' | 'NUMBERS'; standing: string }>
        boundaryEntry: string
        /** OURS: the role the boundary entry plays in a trace (consulted, never decisive). */
        boundaryRole: string
        /** OURS: where the not-offered consequence comes from, named in the trace of a scenario it decides. */
        notOfferedBasis: string
        referenceEntries: string[]
        deferredEntries: string[]
        risksOfWidening: WidthRisk[]
        longTermRequirementId: string
    }
}

/** Every workbook the stage reads, whole. A test passes a changed deep copy; nothing else does. */
export interface DesignKnowledge {
    planning: { learning_goals: Row[]; engine_translation: Row[]; rpc_routing: Row[] } & Row
    contexts: { registry: Row[]; relationships: Row[]; controlled_vocabulary: Row[]; identity_rules: Row[]; properties: Row[]; validation_rules: Row[] } & Row
    car: { metadata: Row; ratings: Row[] } & Row
    gameProblems: { gameProblems: Row[]; relationships: Row[] } & Row
    archetypes: { knowledge: Row[] } & Row
    sportModule: { metadata: Row; game_forms: Row[] } & Row
    rulings: Stage1Rulings
    stage2Rulings: Stage2Rulings
    conditionsOfUse: ConditionsOfUse
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
        stage2Rulings,
        conditionsOfUse,
    }) as unknown as DesignKnowledge
}

/** The standing the Stage 2 rulings file gives one of the stage's sources (planning, contexts, car, archetypes, sportModule, ...). */
export function sourceStanding(k: DesignKnowledge, source: string): Standing {
    const entry = k.stage2Rulings.sourceStandings[source]
    return typeof entry === 'object' && entry ? entry.standing : 'OURS'
}

/** One of his rulings in the Stage 2 file, by id; a missing id is a broken data file, so it throws rather than guessing. */
export function ruling(k: DesignKnowledge, id: string): Ruling {
    const found = k.stage2Rulings.rulings.find((r) => r.id === id)
    if (!found) throw new Error(`stage2-rulings.json holds no ruling ${id}`)
    return found
}

/** One conditions-of-use entry, by id; a missing id is a broken data file, so it throws rather than guessing. */
export function conditionOfUse(k: DesignKnowledge, id: string): ConditionOfUse {
    const found = k.conditionsOfUse.entries.find((e) => e.id === id)
    if (!found) throw new Error(`conditions-of-use.stage2.json holds no entry ${id}`)
    return found
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

/**
 * Stage 2: the archetype workbook's ORGANIZATIONAL_INTEGRITY_CONDITION rows for one archetype, by their ids and role. Their statements are
 * never read here: what a condition means for the demonstration comes from his D6 classification, held as data in `stage2-rulings.json`.
 */
export function archetypeIntegrityConditions(
    k: DesignKnowledge,
    archetypeId: string
): Array<{ conditionId: string; recordId: string; role: string; cite: Cite }> {
    return k.archetypes.knowledge
        .filter((r) => cell(r, 'Archetype_ID') === archetypeId && cell(r, 'Knowledge_Type') === 'ORGANIZATIONAL_INTEGRITY_CONDITION')
        .map((r) => ({ conditionId: cell(r, 'Target_ID'), recordId: cell(r, 'Record_ID'), role: cell(r, 'Knowledge_Role'), cite: { file: SOURCE.archetypes, table: 'knowledge', row: cell(r, 'Record_ID') } }))
        .sort((a, b) => a.conditionId.localeCompare(b.conditionId, 'en', { numeric: true }))
}

/** Stage 2: one property row of the context library, by id: its context, category, importance and status (never its text). */
export function contextProperty(
    k: DesignKnowledge,
    propertyId: string
): { propertyId: string; rpcId: string; category: string; importance: string; status: string; cite: Cite } | null {
    const row = (k.contexts.properties ?? []).find((r) => cell(r, 'property_id') === propertyId)
    if (!row) return null
    return {
        propertyId,
        rpcId: cell(row, 'rpc_id'),
        category: cell(row, 'property_category'),
        importance: cell(row, 'importance'),
        status: cell(row, 'status'),
        cite: { file: SOURCE.contexts, table: 'properties', row: propertyId },
    }
}

/** Stage 2: whether a value is in one of the context library's controlled vocabularies (vocabulary and value columns only). */
export function contextVocabularyHas(k: DesignKnowledge, vocabulary: string, value: string): boolean {
    return k.contexts.controlled_vocabulary.some((r) => cell(r, 'vocabulary') === vocabulary && cell(r, 'value') === value)
}

/** Assembly experiment: a context's identity rules, by id: their role and status (never their text). */
export function contextIdentityRules(k: DesignKnowledge, rpcId: string): Array<{ identityRuleId: string; rpcId: string; role: string; status: string; cite: Cite }> {
    return (k.contexts.identity_rules ?? [])
        .filter((r) => cell(r, 'rpc_id') === rpcId)
        .map((r) => ({ identityRuleId: cell(r, 'identity_rule_id'), rpcId, role: cell(r, 'identity_role'), status: cell(r, 'status'), cite: { file: SOURCE.contexts, table: 'identity_rules', row: cell(r, 'identity_rule_id') } }))
        .sort((a, b) => a.identityRuleId.localeCompare(b.identityRuleId, 'en', { numeric: true }))
}

/** Assembly experiment: a context's validation rules, by id: their domain, runtime stage and status (never their text). */
export function contextValidationRules(k: DesignKnowledge, rpcId: string): Array<{ validationId: string; rpcId: string; domain: string; stage: string; status: string; cite: Cite }> {
    return (k.contexts.validation_rules ?? [])
        .filter((r) => cell(r, 'rpc_id') === rpcId)
        .map((r) => ({ validationId: cell(r, 'validation_id'), rpcId, domain: cell(r, 'validation_domain'), stage: cell(r, 'runtime_stage'), status: cell(r, 'status'), cite: { file: SOURCE.contexts, table: 'validation_rules', row: cell(r, 'validation_id') } }))
        .sort((a, b) => a.validationId.localeCompare(b.validationId, 'en', { numeric: true }))
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
