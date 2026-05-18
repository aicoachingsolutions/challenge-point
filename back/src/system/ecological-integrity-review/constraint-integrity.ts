/**
 * Constraint Integrity analyzer.
 *
 * Christian's framing: "Evaluate whether constraints shape the environment OR prescribe
 * behavior directly. Review questions: Could multiple viable solutions still emerge? Does
 * success require adaptation or compliance? Are any actions unintentionally guaranteed?
 * Does the activity reward solving the environment or satisfying the rule?"
 *
 * What this analyzer observes:
 *   - prescriptive phrases ("must pass", "always X", "only use")
 *   - exact-count requirements ("exactly 3 passes", "within 5 seconds")
 *   - sequence markers ("after every", "first … then")
 *   - multi-option markers ("choose between", "decide whether", "or recycle")
 *   - environmental markers in the rules ("zone", "channel", "area", "time window")
 *   - decision-stem density across the bundle
 *
 * Interpretation: a high prescriptive load with low multi-option/decision density tilts the
 * activity toward compliance. Strong environmental markers + multi-option language tilts it
 * toward shaping. Findings populate the four buckets accordingly.
 */

import {
    appearsToInvite,
    appearsToRemove,
    couldUnintentionallyScript,
    factThenInterpretation,
    likelyPreserves,
    mayCollapse,
    mayOverConstrain,
    mayTradeOff,
} from './language-templates'
import {
    EXACT_COUNT_REGEX,
    ENVIRONMENTAL_MARKERS,
    MULTI_OPTION_MARKERS,
    PRESCRIPTIVE_PHRASES,
    SEQUENCE_REGEX,
    clipSnippet,
    countWordStems,
    decisionStemCount,
    detectPhrases,
    findAllMatches,
    joinActivityText,
} from './text-scanning'
import type { CategoryFinding, ReviewContext, ReviewableActivity } from './types'

export function analyzeConstraintIntegrity(
    activity: ReviewableActivity,
    _context?: ReviewContext
): CategoryFinding {
    const finding: CategoryFinding = {
        category: 'Constraint Integrity',
        preservedInteractionProperties: [],
        removedInteractionProperties: [],
        possibleTradeoffs: [],
        possibleEcologicalDriftRisks: [],
        reviewNotes: [],
    }

    const fullText = joinActivityText(activity)
    const ruleText = activity.rules.join(' ')
    const scoringText = activity.scoring ?? ''
    const constraintsText = (activity.constraints ?? []).join(' ')

    // ─── Prescriptive phrases ──────────────────────────────────────────────
    const prescriptive = detectPhrases(fullText, PRESCRIPTIVE_PHRASES)
    if (prescriptive.length > 0) {
        finding.removedInteractionProperties.push(
            factThenInterpretation(
                `Prescriptive phrase(s) detected: ${prescriptive.map((p) => `"${p}"`).join(', ')}`,
                appearsToRemove('open action selection')
            )
        )
        finding.possibleEcologicalDriftRisks.push(
            factThenInterpretation(
                `Scoring or rules anchored to prescriptive language`,
                couldUnintentionallyScript('the specific action named in the rule')
            )
        )
    }

    // ─── Exact-count / sequence markers ────────────────────────────────────
    const exactCounts = findAllMatches(fullText, EXACT_COUNT_REGEX)
    if (exactCounts.length > 0) {
        finding.possibleTradeoffs.push(
            factThenInterpretation(
                `Exact count language present (${exactCounts.map((c) => `"${c}"`).join(', ')})`,
                mayTradeOff(
                    'temporal variability',
                    'a clear scoring gate the coach can call out'
                )
            )
        )
    }

    const hasSequenceMarker = SEQUENCE_REGEX.test(fullText)
    if (hasSequenceMarker) {
        finding.possibleEcologicalDriftRisks.push(
            factThenInterpretation(
                `Sequence-of-actions language present`,
                mayCollapse('decision diversity into following the sequence')
            )
        )
    }

    // ─── Multi-option / decision markers ───────────────────────────────────
    const multiOption = detectPhrases(fullText, MULTI_OPTION_MARKERS)
    if (multiOption.length >= 2) {
        finding.preservedInteractionProperties.push(
            factThenInterpretation(
                `Multiple-option markers present (${multiOption.slice(0, 3).map((m) => `"${m.trim()}"`).join(', ')}${multiOption.length > 3 ? ', …' : ''})`,
                likelyPreserves('open action selection')
            )
        )
    }

    const decisionCount = decisionStemCount(fullText)
    if (decisionCount >= 4) {
        finding.preservedInteractionProperties.push(
            `Decision-stem language appears ${decisionCount} times across the bundle. ${likelyPreserves(
                'adaptation as the primary success path'
            )}`
        )
    } else if (decisionCount <= 1) {
        finding.removedInteractionProperties.push(
            `Decision-stem language is sparse (${decisionCount} occurrence${decisionCount === 1 ? '' : 's'}). ${mayCollapse(
                'visible decision-making in the coach-facing description'
            )}`
        )
    }

    // ─── Environmental vs behavioral framing of constraints ────────────────
    const constraintEnvHits = countWordStems(constraintsText, ENVIRONMENTAL_MARKERS).reduce((s, e) => s + e.count, 0)
    const constraintPrescriptiveHits = detectPhrases(constraintsText, PRESCRIPTIVE_PHRASES).length
    if (constraintEnvHits >= 2 && constraintPrescriptiveHits === 0) {
        finding.preservedInteractionProperties.push(
            `Constraint descriptions reference environmental markers (zone/channel/area/space/time window) and avoid behavior-prescription language. ${appearsToInvite(
                'players to solve the environment rather than satisfy a rule'
            )}`
        )
    } else if (constraintPrescriptiveHits > 0) {
        finding.removedInteractionProperties.push(
            `Constraint descriptions contain ${constraintPrescriptiveHits} prescriptive phrase reference${
                constraintPrescriptiveHits === 1 ? '' : 's'
            }. ${mayOverConstrain('how the player addresses the constraint problem')}`
        )
    }

    // ─── Rule-vs-environment balance in rules[] ────────────────────────────
    const ruleEnvHits = countWordStems(ruleText, ENVIRONMENTAL_MARKERS).reduce((s, e) => s + e.count, 0)
    if (ruleEnvHits >= 3) {
        finding.preservedInteractionProperties.push(
            `Rules describe environmental conditions (zone/area/time window references appear ${ruleEnvHits} times). ${likelyPreserves(
                'multiple viable solutions emerging from the same setup'
            )}`
        )
    }

    // ─── Scoring framing: indirect vs compliance-anchored ──────────────────
    const scoringPrescriptive = detectPhrases(scoringText, PRESCRIPTIVE_PHRASES).length
    if (scoringPrescriptive > 0) {
        finding.possibleEcologicalDriftRisks.push(
            `Scoring text contains prescriptive phrasing. ${mayCollapse(
                'open action selection into compliance with the scoring rule'
            )}`
        )
    }

    // ─── Note when nothing flagged ─────────────────────────────────────────
    if (
        finding.preservedInteractionProperties.length === 0 &&
        finding.removedInteractionProperties.length === 0 &&
        finding.possibleTradeoffs.length === 0 &&
        finding.possibleEcologicalDriftRisks.length === 0
    ) {
        finding.reviewNotes.push(
            `No constraint-related markers detected in the activity text. Constraint Integrity cannot be inferred from the text alone — consider whether the activity description is too thin to evaluate or whether the constraints have been embedded implicitly.`
        )
    }

    // ─── Snippet of the activity's constraints for traceability ────────────
    if ((activity.constraints?.length ?? 0) > 0) {
        finding.reviewNotes.push(
            `Constraints surfaced to coach: ${activity.constraints!
                .map((c) => `"${clipSnippet(c, 80)}"`)
                .join('; ')}`
        )
    }

    return finding
}
