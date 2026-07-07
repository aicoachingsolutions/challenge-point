/**
 * Suitability weights for the selection engine.
 *
 * Architecture mapping (Knowledge Core, Batch 2 — Design Weighting Methodology):
 * these values ARE the "Suitability Assessment" methodology. The methodology (how a
 * suitability score is composed from additive, inspectable bonuses) is intended to stay
 * stable; the *evidence* informing the individual weights is expected to evolve continually
 * as the Experience Library grows and field evidence accumulates.
 *
 * This module is the single authoritative, inspectable home for those weights so they can be
 * revised (eventually via Knowledge Governance / a config layer) WITHOUT touching Reasoning
 * Models (candidate generation) or Deterministic Design Logic (the bounded-search commitment).
 * Keep this file free of logic — it is data, not reasoning. Every weight is additive and each
 * emits a matching `reason` token in `generateSelection`, preserving traceability.
 *
 * Higher = a stronger nudge toward that candidate when the condition holds. Weights are
 * relative to one another, not absolute measures of quality (suitability is contextual).
 */
export interface SelectionSuitabilityWeights {
    /** Lens whose affordance the selected archetype primarily affords. */
    lensArchetypeAffordanceMatch: number
    /** Lens anchored to the archetype's phase of play. */
    lensPhaseGameTemplateAnchor: number
    /** Constraint whose target affordance matches a selected lens. */
    constraintTargetMatchesSelectedLens: number
    /** Constraint whose target affordance matches an archetype affordance. */
    constraintTargetMatchesArchetypeAffordance: number
    /** Constraint whose archetype matches one the selected archetype recommends. */
    constraintArchetypeRecommendedType: number
    /**
     * Information-shaping constraint when the goal expresses information intent (parser Group K).
     * Deliberately the largest weight: info constraints target "perception" (no lens coupling),
     * so without this intent bonus they never surface. See generateSelection Round 8C note.
     */
    constraintInformationIntentMatch: number
    /** Combo includes a foundation-role constraint (when the library carries that role). */
    balanceFoundation: number
    /** Combo includes a shaping-role constraint (when the library carries that role). */
    balanceShaping: number
    /** Combo includes a consequence-role constraint (when the library carries that role). */
    balanceConsequence: number
}

/**
 * Current (RC0) weights — carried over verbatim from the previously hardcoded literals so this
 * extraction is behavior-preserving. Adjust these as evidence accrues; no engine code changes.
 */
export const SELECTION_SUITABILITY_WEIGHTS: SelectionSuitabilityWeights = {
    lensArchetypeAffordanceMatch: 8,
    lensPhaseGameTemplateAnchor: 2,
    constraintTargetMatchesSelectedLens: 10,
    constraintTargetMatchesArchetypeAffordance: 6,
    constraintArchetypeRecommendedType: 3,
    constraintInformationIntentMatch: 12,
    balanceFoundation: 6,
    balanceShaping: 6,
    balanceConsequence: 4,
}
