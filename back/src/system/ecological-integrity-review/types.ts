/**
 * Ecological Integrity Review Layer — type contracts.
 *
 * Per Christian's spec, this layer performs an interaction-property audit, not a certification.
 * It does NOT produce pass/fail scores or correctness ratings. Each category produces four
 * structured buckets that describe what the activity preserves, removes, trades off, and risks.
 *
 * See ./language-templates.ts for the probabilistic phrasing helpers all finding strings flow
 * through. Findings should never assert absolute ecological claims ("This is ecological.") —
 * only observational/probabilistic ones ("This may reduce timing variability.").
 */

export type CategoryName =
    | 'Constraint Integrity'
    | 'Opposition Integrity'
    | 'Decision Integrity'
    | 'Representativeness Integrity'
    | 'Incentive Integrity'
    | 'Scaling Integrity'

export const CATEGORY_ORDER: readonly CategoryName[] = [
    'Constraint Integrity',
    'Opposition Integrity',
    'Decision Integrity',
    'Representativeness Integrity',
    'Incentive Integrity',
    'Scaling Integrity',
] as const

/** Per-category audit result. No score, no pass/fail. */
export interface CategoryFinding {
    category: CategoryName
    /** Interaction properties the activity appears to keep available. */
    preservedInteractionProperties: string[]
    /** Interaction properties the activity appears to remove or limit. */
    removedInteractionProperties: string[]
    /** Tradeoffs the activity's structure may introduce. */
    possibleTradeoffs: string[]
    /** Risks of drifting away from preserved interaction over iterations. */
    possibleEcologicalDriftRisks: string[]
    /** Free-form observational notes that don't fit the four buckets above. */
    reviewNotes: string[]
}

/** Top-level review report. */
export interface EcologicalIntegrityReport {
    activityRef: {
        title: string
        archetypeName: string | undefined
        slotIndex: number | undefined
    }
    reviewTimestamp: string
    reviewLayerVersion: string
    findings: CategoryFinding[]
    /** Cross-category observations — patterns that show up across categories. Optional addition; remove if undesired. */
    crossCategoryObservations: string[]
}

/**
 * Minimal shape of an activity the review layer needs to operate.
 * Designed to accept either the structured Activity (from completion.service) or the legacy
 * IActivity (where field names may be mapped slightly differently — the runner takes care of
 * normalization). All optional fields degrade the review gracefully when absent.
 */
export interface ReviewableActivity {
    title: string
    setup?: string
    teams?: string
    objective: string
    rules: string[]
    scoring: string
    constraints?: string[]
    coachingFocus?: string[]
    winCondition?: string
}

/** Supplementary context the analyzers can use when available. */
export interface ReviewContext {
    archetypeName?: string
    selectedAffordanceTitles?: string[]
    selectedConstraintTitles?: string[]
    slotIndex?: 1 | 2 | 3
    /** Field dimensions (length × width) if known. Used by Scaling Integrity. */
    fieldDimensions?: { length?: number; width?: number; type?: string }
    /** Total player count if known. */
    playerCount?: number
}

export const REVIEW_LAYER_VERSION = '1.0.0'
