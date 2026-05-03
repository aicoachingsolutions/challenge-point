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

export interface TestLibrarySelectionResult {
    archetype: TestLibraryV0Archetype
    affordanceLenses: TestLibraryV0AffordanceLens[]
    constraints: TestLibraryV0Constraint[]
    selectionTrace: {
        queryCorpus: string
        archetype: SelectionReasonEntry
        affordanceLenses: SelectionReasonEntry[]
        constraints: SelectionReasonEntry[]
        /** Combined objective for the winning lens+constraint combination */
        objectiveScore: number
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
