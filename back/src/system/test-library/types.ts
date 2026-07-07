/** Types mirror CSV header rows under `back/src/system/test-library/csv/`. */

export interface TestLibraryV0AffordanceLens {
    /** Stable id derived from title (tl-v0-lens-*) */
    id: string
    title: string
    description: string
    type: string
    affordanceTagGroup: string
    notes: string
    contextualAudit: string
    suggestedConstraintPrompt: string
    category: string
    gameTemplateAnchor: string[]
    designIntent: string
    constraintSupport: string[]
    exampleConsequencePatterns: string[]
    visibilityTriggers: string[]
    logicUsageNote: string
    /**
     * Optional list of coach-language synonyms / common phrases that should match this lens during
     * selection scoring. Bridges the gap between formal library text and natural coach vocabulary.
     * Example: Line-Breaking Opportunity might include ["penetrating pass", "split defenders",
     * "between the lines", "third-man run", "line-breaking"]. Selection adds these to the searchable
     * text for the entry.
     */
    coachVocabulary?: string[]
}

export interface TestLibraryV0Constraint {
    /** Stable id derived from title (tl-v0-constraint-*) */
    id: string
    title: string
    description: string
    type: string
    affordanceTagGroup: string
    notes: string
    contextualAudit: string
    suggestedConstraintPrompt: string
    category: string
    gameTemplateAnchor: string[]
    designIntent: string
    constraintArchetype: string
    constraintRole: string
    primaryConstraintType: string
    includesIncentiveLayer: boolean
    incentiveMechanism: string
    visibilityEffect: string
    targetAffordancePrimary: string
    logicUsageNote: string
    /** See TestLibraryV0AffordanceLens.coachVocabulary. */
    coachVocabulary?: string[]
    /**
     * Optional setup-specific parameters this entry implies (field zones, time windows, numerical
     * structures, equipment specifics, etc.). Surfaces in the AI prompt's setupFrame so the
     * generated activity setup includes concrete coaching parameters rather than generic
     * "marking cones if needed" placeholder text. One string per parameter; brief, imperative.
     */
    setupGuidance?: string[]
    /**
     * Concrete environmental REALIZATIONS of an information mechanic (Round 8D.3) — distinct ways the
     * mechanic can actually be built into the environment (e.g. "the live target switches after the
     * first penetrating pass"), NOT prescribed player behaviors. The assembly directive presents these
     * as a "pick one and build the activity around it" menu so the AI instantiates the information
     * problem instead of merely describing it. Used by information constraints.
     */
    environmentalRealizations?: string[]
}

export interface TestLibraryV0Archetype {
    /** Stable id — same as game_form_id */
    id: string
    game_form_id: string
    game_form_name: string
    objective: string
    interaction_structure: string
    directionality_type: string
    phase_of_play: string
    player_structure_logic: string
    typical_affordances: string[]
    recommended_constraint_types: string[]
    representative_design_notes: string
    primaryAffordances: string[]
    secondaryAffordances: string[]
    constraintFit_structural: string
    constraintFit_shaping: string
    constraintFit_consequence: string
    recommendedConstraintTypes: string[]
    exampleConstraintPatterns: string[]
    exampleIncentivePatterns: string[]
    logicUsageNote: string
    /** See TestLibraryV0AffordanceLens.coachVocabulary. */
    coachVocabulary?: string[]
    /**
     * Optional setup-specific parameters this entry implies (field zones, time windows, numerical
     * structures, equipment specifics, etc.). Surfaces in the AI prompt's setupFrame so the
     * generated activity setup includes concrete coaching parameters rather than generic
     * "marking cones if needed" placeholder text. One string per parameter; brief, imperative.
     */
    setupGuidance?: string[]
}

export interface TestLibrarySelectionInput {
    learningGoals: string[]
    sport?: string
    sessionDescription?: string
    challengeLevel?: string
}

export type ConstraintBalanceBucket = 'foundation' | 'shaping' | 'consequence'

export interface SelectionReasonEntry {
    id: string
    score: number
    reasons: string[]
}

/**
 * One candidate in a "why it won" ranking. The engine already scores every candidate during
 * selection and keeps only the winner; this surfaces the discarded scores for the debug view.
 * `selected` marks whether the candidate ended up in the final activity.
 */
export interface SelectionRankingEntry {
    id: string
    name: string
    score: number
    reasons: string[]
    /** True when this candidate was chosen for the final activity. */
    selected: boolean
    /**
     * True when routing left this candidate in the eligible pool. A high score with `eligible: false`
     * means the parser routed a relevant candidate OUT — i.e. a routing gap, not a coverage gap.
     */
    eligible: boolean
}

/**
 * How well the coach's input resolved to an intent-aligned candidate pool before selection.
 * Realizes the Deterministic Design Logic traceability requirement (Batch 2): a commitment made
 * from a generic/unnarrowed pool must be distinguishable from an intent-matched one, not silent.
 * - matched    — at least one specific signal group fired; intent resolved.
 * - fallback   — only the generic soccer default (Z_soccer_general) fired; a sensible package was
 *                committed, but coach intent was NOT specifically resolved.
 * - unresolved — no signal group fired; selection scored against the full unfiltered library. The
 *                deterministic "defined failure state": a commitment is still produced, but it is
 *                not traceable to resolved intent — treat as low confidence.
 */
export type SelectionResolutionStatus = 'matched' | 'fallback' | 'unresolved'

export interface SelectionResolution {
    status: SelectionResolutionStatus
    /** Human-readable explanation naming what did or did not resolve (traceability). */
    reason: string
    /** The signalGroup:* signals that drove resolution (empty when unresolved). */
    matchedSignalGroups: string[]
}

export interface TestLibrarySelectionResult {
    archetype: TestLibraryV0Archetype
    affordanceLenses: TestLibraryV0AffordanceLens[]
    constraints: TestLibraryV0Constraint[]
    /** Explicit, inspectable resolution status — see SelectionResolution. */
    resolution: SelectionResolution
    selectionTrace: {
        queryCorpus: string
        archetype: SelectionReasonEntry
        affordanceLenses: SelectionReasonEntry[]
        constraints: SelectionReasonEntry[]
        /** Combined objective for the winning lens+constraint combination */
        objectiveScore: number
        /**
         * Developer/testing instrumentation — full candidate rankings ("why it won"), not just the
         * selected items. Each list is sorted best-first using the same ordering the selector uses.
         */
        ranking: {
            archetypes: SelectionRankingEntry[]
            affordanceLenses: SelectionRankingEntry[]
            constraints: SelectionRankingEntry[]
            /** Winning archetype score minus the runner-up's; 0 = tie-broken, null = single candidate. */
            archetypeMargin: number | null
        }
    }
}

/** Row skipped while converting CSV → TypeScript (see generate-data-from-csv.mjs). */
export interface TestLibraryConversionSkippedRow {
    sourceFile: string
    /** 1-based row index in the CSV file (header is row 1). */
    csvRowNumber: number
    reason: string
    /** Title, game_form_id, or similar when available */
    identifier?: string
}

export interface TestLibraryConversionValidationError {
    sourceFile: string
    phase: 'header' | 'parse'
    message: string
}

/** Emitted as `libraryConversionReport.ts` when running generate-data-from-csv.mjs */
export interface TestLibraryV0LoadReport {
    generatedAtIso: string
    sourceCsvRelativeDir: string
    counts: {
        totalArchetypesLoaded: number
        totalAffordanceLensesLoaded: number
        totalConstraintsLoaded: number
    }
    csvStats: {
        affordanceLenses: { dataRowsAttempted: number; dataRowsAccepted: number }
        constraints: { dataRowsAttempted: number; dataRowsAccepted: number }
        archetypes: { dataRowsAttempted: number; dataRowsAccepted: number }
    }
    skippedRows: TestLibraryConversionSkippedRow[]
    validationErrors: TestLibraryConversionValidationError[]
}
