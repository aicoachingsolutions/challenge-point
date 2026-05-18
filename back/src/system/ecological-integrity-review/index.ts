/**
 * Ecological Integrity Review Layer — entry point.
 *
 * Inspects an activity (and optional ReviewContext) and returns a structured report across
 * the six integrity dimensions defined in Christian's spec. Findings are observational and
 * probabilistic — no pass/fail, no scores, no certification.
 *
 * Usage:
 *   import { reviewActivity } from '.../ecological-integrity-review'
 *   const report = reviewActivity(activity, context?)
 */

import { analyzeConstraintIntegrity } from './constraint-integrity'
import { analyzeDecisionIntegrity } from './decision-integrity'
import { analyzeIncentiveIntegrity } from './incentive-integrity'
import { analyzeOppositionIntegrity } from './opposition-integrity'
import { analyzeRepresentativenessIntegrity } from './representativeness-integrity'
import { analyzeScalingIntegrity } from './scaling-integrity'
import {
    CATEGORY_ORDER,
    REVIEW_LAYER_VERSION,
    type CategoryFinding,
    type CategoryName,
    type EcologicalIntegrityReport,
    type ReviewContext,
    type ReviewableActivity,
} from './types'

/**
 * Cross-category synthesis. Looks at the six findings together and surfaces patterns visible
 * only at the bundle level (e.g., "decision language is strong but opposition is weak — the
 * decisions may not be opponent-driven"). Optional addition per spec; safe to disable if
 * Christian prefers strict per-category isolation.
 */
function deriveCrossCategoryObservations(findings: CategoryFinding[]): string[] {
    const out: string[] = []
    const byName: Partial<Record<CategoryName, CategoryFinding>> = {}
    for (const f of findings) byName[f.category] = f

    const constraintPreserved = (byName['Constraint Integrity']?.preservedInteractionProperties.length ?? 0) > 0
    const constraintRisks = (byName['Constraint Integrity']?.possibleEcologicalDriftRisks.length ?? 0) > 0
    const oppPreserved = (byName['Opposition Integrity']?.preservedInteractionProperties.length ?? 0) > 0
    const oppRemoved = (byName['Opposition Integrity']?.removedInteractionProperties.length ?? 0) > 0
    const decisionPreserved = (byName['Decision Integrity']?.preservedInteractionProperties.length ?? 0) > 0
    const decisionRemoved = (byName['Decision Integrity']?.removedInteractionProperties.length ?? 0) > 0
    const representRemoved = (byName['Representativeness Integrity']?.removedInteractionProperties.length ?? 0) > 0
    const incentiveRisks = (byName['Incentive Integrity']?.possibleEcologicalDriftRisks.length ?? 0) > 0
    const scalingRemoved = (byName['Scaling Integrity']?.removedInteractionProperties.length ?? 0) > 0

    if (decisionPreserved && oppRemoved) {
        out.push(
            'Decision Integrity shows preserved decision language while Opposition Integrity flags weakness. This may indicate the decisions described in the text are not opponent-driven — worth verifying that the live picture under contest is what shapes the named decisions.'
        )
    }

    if (constraintPreserved && incentiveRisks) {
        out.push(
            'Constraint Integrity appears preserved while Incentive Integrity flags drift risks. Constraints may shape the environment well, but the scoring layer may pull players toward a single solution path — worth inspecting whether scoring rewards solving the environment or executing a specific action.'
        )
    }

    if (representRemoved && scalingRemoved) {
        out.push(
            'Both Representativeness and Scaling Integrity flag removed properties. The activity description may be too thin to evaluate — most contextual variables that define how it is set up and played are absent from the coach-facing text.'
        )
    }

    if (constraintRisks && decisionRemoved) {
        out.push(
            'Constraint Integrity flags drift risks while Decision Integrity shows sparse decision language. The activity may be drifting toward a compliance pattern; live observation should check whether players are reading a picture or executing a known answer.'
        )
    }

    if (oppPreserved && decisionPreserved && constraintPreserved && !incentiveRisks && !scalingRemoved) {
        out.push(
            'All six dimensions surface preserved interaction properties without flagging drift risks. The text-level review does not reveal collapse points — observation under play is the next step in the review cycle.'
        )
    }

    return out
}

/**
 * Run the full review across all six categories.
 */
export function reviewActivity(
    activity: ReviewableActivity,
    context?: ReviewContext
): EcologicalIntegrityReport {
    const analyzers: Record<CategoryName, (a: ReviewableActivity, c?: ReviewContext) => CategoryFinding> = {
        'Constraint Integrity': analyzeConstraintIntegrity,
        'Opposition Integrity': analyzeOppositionIntegrity,
        'Decision Integrity': analyzeDecisionIntegrity,
        'Representativeness Integrity': analyzeRepresentativenessIntegrity,
        'Incentive Integrity': analyzeIncentiveIntegrity,
        'Scaling Integrity': analyzeScalingIntegrity,
    }

    const findings: CategoryFinding[] = CATEGORY_ORDER.map((name) => analyzers[name](activity, context))

    return {
        activityRef: {
            title: activity.title,
            archetypeName: context?.archetypeName,
            slotIndex: context?.slotIndex,
        },
        reviewTimestamp: new Date().toISOString(),
        reviewLayerVersion: REVIEW_LAYER_VERSION,
        findings,
        crossCategoryObservations: deriveCrossCategoryObservations(findings),
    }
}

export type { CategoryFinding, CategoryName, EcologicalIntegrityReport, ReviewContext, ReviewableActivity } from './types'
export { CATEGORY_ORDER, REVIEW_LAYER_VERSION } from './types'
