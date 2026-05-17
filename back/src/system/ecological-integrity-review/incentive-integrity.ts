/**
 * Incentive Integrity analyzer.
 *
 * Christian's framing: "Evaluate whether incentives shape interaction indirectly rather than
 * scripting action. Is scoring shaping action value or forcing compliance? Could incentives
 * unintentionally overdetermine behavior? Are players still free to solve the problem
 * differently? Does scoring preserve adaptive decision-making?"
 *
 * What this analyzer observes:
 *   - whether scoring rewards a specific named action vs a class of outcomes
 *   - whether multiple pathways to score are visible
 *   - presence of bonus / multiplier language that may over-reward a specific solution
 *   - whether scoring is conditional ("counts only when …") which is structurally indirect
 *   - whether the scoring text contains prescriptive phrasing (a hidden-scripting signal)
 */

import {
    appearsToInvite,
    couldUnintentionallyReward,
    couldUnintentionallyScript,
    factThenInterpretation,
    likelyPreserves,
    mayCollapse,
    mayOverConstrain,
    mayTradeOff,
} from './language-templates'
import {
    PRESCRIPTIVE_PHRASES,
    clipSnippet,
    detectPhrases,
    joinActivityText,
    normalize,
} from './text-scanning'
import type { CategoryFinding, ReviewContext, ReviewableActivity } from './types'

export function analyzeIncentiveIntegrity(
    activity: ReviewableActivity,
    _context?: ReviewContext
): CategoryFinding {
    const finding: CategoryFinding = {
        category: 'Incentive Integrity',
        preservedInteractionProperties: [],
        removedInteractionProperties: [],
        possibleTradeoffs: [],
        possibleEcologicalDriftRisks: [],
        reviewNotes: [],
    }

    const scoring = activity.scoring ?? ''
    const winCondition = activity.winCondition ?? ''
    const fullText = joinActivityText(activity)

    // ─── Compliance markers in scoring (hidden scripting) ──────────────────
    const scoringPrescriptive = detectPhrases(scoring, PRESCRIPTIVE_PHRASES)
    if (scoringPrescriptive.length > 0) {
        finding.possibleEcologicalDriftRisks.push(
            factThenInterpretation(
                `Scoring text contains prescriptive phrase(s): ${scoringPrescriptive.map((p) => `"${p}"`).join(', ')}`,
                couldUnintentionallyScript('the prescribed action by tying scoring directly to it')
            )
        )
    }

    // ─── Conditional ("counts only when…") indirect framing ────────────────
    const conditionalScoringRegex = /counts? only when|counts? when|live advantage|advantage when|only count(?:s)? if/gi
    const conditionalHits = (scoring.match(conditionalScoringRegex) || []).length
    if (conditionalHits > 0) {
        finding.preservedInteractionProperties.push(
            `Scoring is framed as conditional ("counts only when …" appears ${conditionalHits} time${conditionalHits === 1 ? '' : 's'}). ${appearsToInvite(
                'players to solve the situation rather than perform a fixed action; scoring shapes value indirectly'
            )}`
        )
    }

    // ─── Multiple-pathway scoring ─────────────────────────────────────────
    const pathwayRegex = /\b(?:bonus|extra|double points?|multiplier|advantage)\b/gi
    const pathwayHits = (scoring.match(pathwayRegex) || []).length
    if (pathwayHits >= 1) {
        finding.reviewNotes.push(
            `Scoring includes bonus / advantage / multiplier language (${pathwayHits} reference${pathwayHits === 1 ? '' : 's'}). ${mayTradeOff(
                'simplicity',
                'a more granular shaping of action value'
            )}`
        )
    }

    // ─── Single-action over-reward detection ───────────────────────────────
    const overRewardRegex = /(?:point|points|bonus|reward)\s+(?:for|when)\s+(?:the\s+)?(?:player|team)\s+(?:exactly|specifically|only)\b/i
    if (overRewardRegex.test(normalize(scoring))) {
        finding.possibleEcologicalDriftRisks.push(
            `Scoring language targets a specifically-named action with restrictive qualifiers. ${couldUnintentionallyReward(
                'one exact action over the range of viable alternatives'
            )}`
        )
    }

    // ─── Two-sided incentives (opponent gains too) ─────────────────────────
    const opponentGains = /opponent (?:gains?|inherits?|earns?|attacks?)/i.test(scoring + ' ' + winCondition)
    if (opponentGains) {
        finding.preservedInteractionProperties.push(
            `Scoring references opponent gain on misread. ${likelyPreserves(
                'two-sided incentive structure — value moves toward whichever side reads the picture better'
            )}`
        )
    } else {
        finding.possibleTradeoffs.push(
            `No reciprocal opponent-gain language is present in scoring. ${mayCollapse(
                "defenders' visible stake in the incentive structure"
            )}`
        )
    }

    // ─── Diversity of scoring vocabulary ──────────────────────────────────
    const distinctScoringVerbs = new Set<string>()
    for (const verb of ['reward', 'count', 'score', 'earn', 'gain', 'advantage']) {
        if (new RegExp(`\\b${verb}`, 'i').test(scoring)) distinctScoringVerbs.add(verb)
    }
    if (distinctScoringVerbs.size >= 3) {
        finding.preservedInteractionProperties.push(
            `Scoring vocabulary spans multiple framing verbs (${[...distinctScoringVerbs].join(', ')}). ${appearsToInvite(
                'multiple legitimate ways for the outcome to register'
            )}`
        )
    }

    // ─── Long scoring text without conditional gates ──────────────────────
    if (scoring.length > 200 && conditionalHits === 0) {
        finding.possibleTradeoffs.push(
            `Scoring text is long (${scoring.length} characters) but contains no conditional "counts only when …" framing. ${mayOverConstrain(
                'how the outcome is awarded; verify scoring is shaping value rather than mandating a recipe'
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
            `No incentive markers detected. The scoring description may be too sparse to evaluate Incentive Integrity, or scoring may be implicit. Surface scoring as a first-class field if absent.`
        )
    }

    // ─── Snippet anchor for traceability ───────────────────────────────────
    if (scoring) {
        finding.reviewNotes.push(`Scoring lead-in: "${clipSnippet(scoring, 200)}"`)
    }

    return finding
}
