/**
 * Decision Integrity analyzer.
 *
 * Christian's framing: "Evaluate whether players are solving genuinely live problems.
 * Are multiple options truly available? Does the activity preserve uncertainty? Could
 * memorized compliance succeed consistently? Are players adapting dynamically to
 * changing information?"
 *
 * What this analyzer observes:
 *   - density of decision-stem language (choose, decide, read, react, adapt, option, …)
 *     across objective, rules, scoring, coachingFocus
 *   - presence of multi-option enumeration (X, Y, or Z phrasing)
 *   - presence of conditional / uncertain framing (when X happens, based on the picture, …)
 *   - presence of compliance / memorization markers (pattern, repetition, repeat, …)
 *   - whether decision language appears in the objective specifically (high-impact field)
 */

import {
    appearsToInvite,
    couldUnintentionallyScript,
    factThenInterpretation,
    likelyPreserves,
    mayCollapse,
    mayReduce,
    mayWeaken,
} from './language-templates'
import {
    COMPLIANCE_MARKERS,
    DECISION_STEMS,
    MULTI_OPTION_MARKERS,
    countWordStems,
    decisionStemCount,
    detectPhrases,
    joinActivityText,
} from './text-scanning'
import type { CategoryFinding, ReviewContext, ReviewableActivity } from './types'

export function analyzeDecisionIntegrity(
    activity: ReviewableActivity,
    _context?: ReviewContext
): CategoryFinding {
    const finding: CategoryFinding = {
        category: 'Decision Integrity',
        preservedInteractionProperties: [],
        removedInteractionProperties: [],
        possibleTradeoffs: [],
        possibleEcologicalDriftRisks: [],
        reviewNotes: [],
    }

    const fullText = joinActivityText(activity)
    const objective = activity.objective ?? ''
    const coachingText = (activity.coachingFocus ?? []).join(' ')

    // ─── Decision-stem density (whole bundle) ─────────────────────────────
    const totalDecisionStems = decisionStemCount(fullText)
    const objectiveDecisionStems = decisionStemCount(objective)
    const coachingDecisionStems = decisionStemCount(coachingText)

    if (totalDecisionStems >= 6) {
        finding.preservedInteractionProperties.push(
            `Decision-stem language (${DECISION_STEMS.join(' / ')}) appears ${totalDecisionStems} times across the bundle. ${likelyPreserves(
                'an open decision picture for the player'
            )}`
        )
    } else if (totalDecisionStems <= 2) {
        finding.removedInteractionProperties.push(
            `Decision-stem language is sparse (${totalDecisionStems} occurrence${totalDecisionStems === 1 ? '' : 's'} across the bundle). ${mayReduce(
                'visible evidence that players are choosing rather than executing'
            )}`
        )
    }

    if (objectiveDecisionStems === 0) {
        finding.removedInteractionProperties.push(
            `Objective text contains no decision-stem language. ${mayWeaken(
                "the player's framing of the activity as a decision problem"
            )}`
        )
    } else if (objectiveDecisionStems >= 2) {
        finding.preservedInteractionProperties.push(
            `Objective contains ${objectiveDecisionStems} decision-stem reference${objectiveDecisionStems === 1 ? '' : 's'}. ${appearsToInvite(
                'the player to frame the activity as a live read-and-decide problem'
            )}`
        )
    }

    if (coachingDecisionStems >= 3) {
        finding.preservedInteractionProperties.push(
            `Coaching focus contains ${coachingDecisionStems} decision-stem references. ${likelyPreserves(
                'observation focus on the decisions players are making rather than the patterns they are executing'
            )}`
        )
    }

    // ─── Multi-option enumeration ─────────────────────────────────────────
    const multiOpts = detectPhrases(fullText, MULTI_OPTION_MARKERS)
    if (multiOpts.length >= 2) {
        finding.preservedInteractionProperties.push(
            `Multiple-option markers present (${multiOpts.slice(0, 4).map((m) => `"${m.trim()}"`).join(', ')}${multiOpts.length > 4 ? ', …' : ''}). ${likelyPreserves(
                'multiple solution paths through the same situation'
            )}`
        )
    }

    // Look for "X, Y, or Z" enumeration patterns: e.g., "secure, progress, or switch"
    const enumeratedOptions = /\b\w+,\s*\w+,\s*or\s+\w+\b/g
    const enumerations = fullText.match(enumeratedOptions)
    if (enumerations && enumerations.length > 0) {
        finding.preservedInteractionProperties.push(
            `Action enumerations present (${enumerations.slice(0, 3).map((e) => `"${e}"`).join('; ')}${enumerations.length > 3 ? ', …' : ''}). ${appearsToInvite(
                'multiple legitimate responses to the same picture'
            )}`
        )
    }

    // ─── Conditional / uncertainty framing ─────────────────────────────────
    const conditionalRegex = /\b(?:when|if|whether|depending on|based on the|live picture|live read)\b/gi
    const conditionalCount = (fullText.match(conditionalRegex) || []).length
    if (conditionalCount >= 4) {
        finding.preservedInteractionProperties.push(
            `Conditional / uncertainty framing appears ${conditionalCount} times (when / if / whether / depending on / based on / live picture). ${likelyPreserves(
                'the uncertainty that makes the decision problem live'
            )}`
        )
    } else if (conditionalCount <= 1) {
        finding.removedInteractionProperties.push(
            `Conditional language is sparse (${conditionalCount} occurrence${conditionalCount === 1 ? '' : 's'}). ${mayReduce(
                'visible evidence that the problem is contingent on a changing picture'
            )}`
        )
    }

    // ─── Compliance / memorization markers ─────────────────────────────────
    const compliance = countWordStems(fullText, COMPLIANCE_MARKERS).filter((e) => e.count > 0)
    if (compliance.length > 0) {
        const stems = compliance.map((c) => `"${c.stem}"`).join(', ')
        finding.possibleEcologicalDriftRisks.push(
            factThenInterpretation(
                `Compliance / repetition markers present: ${stems}`,
                couldUnintentionallyScript('the rehearsed pattern instead of the live decision')
            )
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
            `No decision-language markers detected. The text may be describing the activity from a structural angle rather than a decision-problem angle — worth inspecting the objective and coachingFocus specifically.`
        )
    }

    // ─── Closing summary observation ───────────────────────────────────────
    if (totalDecisionStems >= 6 && (compliance.length === 0)) {
        finding.reviewNotes.push(
            `Decision-stem density is high and no compliance / repetition markers were detected. Worth verifying in observation that players are in fact choosing across the multiple options the text names, not merely defaulting to one preferred solution path.`
        )
    } else if (totalDecisionStems <= 2 && compliance.length > 0) {
        finding.reviewNotes.push(
            `Decision language is sparse while compliance / repetition markers are present. ${mayCollapse(
                'the activity toward rehearsal of a known pattern'
            )}`
        )
    }

    return finding
}
