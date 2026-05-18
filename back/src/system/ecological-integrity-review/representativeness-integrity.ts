/**
 * Representativeness Integrity analyzer.
 *
 * Christian's framing: "Evaluate preserved informational relationships. What informational
 * variables are preserved? What informational variables are removed? Does the activity
 * preserve meaningful game interaction? Does scaling maintain relevant interaction structure?"
 *
 * What this analyzer observes:
 *   - presence of game-context language (live game, opposed teams, restart, transition moment, etc.)
 *   - absence of isolated-drill language (unopposed reps, lined up, take turns, coach-fed)
 *   - directional consequence (does losing the ball matter? does scoring chain to opponent response?)
 *   - presence of scoring tied to live interaction vs technical completion
 *   - presence of named informational variables (pressure, support, space, timing, body shape, etc.)
 */

import {
    appearsToInvite,
    appearsToLimit,
    appearsToSupport,
    factThenInterpretation,
    likelyPreserves,
    mayReduce,
    mayWeaken,
} from './language-templates'
import {
    PASSIVE_DEFENDER_MARKERS,
    clipSnippet,
    countWordStems,
    detectPhrases,
    joinActivityText,
} from './text-scanning'
import type { CategoryFinding, ReviewContext, ReviewableActivity } from './types'

const INFORMATIONAL_VARIABLES = [
    'pressure',
    'support',
    'space',
    'spacing',
    'timing',
    'body shape',
    'shape',
    'angle',
    'angles',
    'distance',
    'cover',
    'gap',
    'lane',
    'channel',
    'numbers',
    'overload',
    'transition moment',
    'live picture',
] as const

const GAME_CONTEXT_MARKERS = [
    'live',
    'live game',
    'live opposition',
    'live pressure',
    'restart',
    'restarts',
    'turnover',
    'transition',
    'opposed',
    'contest',
    'contested',
    'next action',
    'continuation',
] as const

const ISOLATED_DRILL_MARKERS = [
    'isolated drill',
    'technical drill',
    'technique drill',
    'unopposed',
    'no defenders',
    'no opposition',
    'coach feeds',
    'coach serves',
    'take turns',
    'one at a time',
    'lined up',
    'repetition drill',
] as const

export function analyzeRepresentativenessIntegrity(
    activity: ReviewableActivity,
    context?: ReviewContext
): CategoryFinding {
    const finding: CategoryFinding = {
        category: 'Representativeness Integrity',
        preservedInteractionProperties: [],
        removedInteractionProperties: [],
        possibleTradeoffs: [],
        possibleEcologicalDriftRisks: [],
        reviewNotes: [],
    }

    const fullText = joinActivityText(activity)
    const exchangeRule = activity.rules[0] ?? ''

    // ─── Game-context markers ──────────────────────────────────────────────
    const contextHits = countWordStems(fullText, GAME_CONTEXT_MARKERS).reduce((s, e) => s + e.count, 0)
    if (contextHits >= 4) {
        finding.preservedInteractionProperties.push(
            `Game-context language (live / opposed / restart / turnover / transition / continuation) appears ${contextHits} times. ${likelyPreserves(
                'a continuous live-game interaction structure'
            )}`
        )
    } else if (contextHits <= 1) {
        finding.removedInteractionProperties.push(
            `Game-context language appears only ${contextHits} time${contextHits === 1 ? '' : 's'}. ${mayWeaken(
                'the framing of the activity as a continuous live game'
            )}`
        )
    }

    // ─── Isolated-drill markers ────────────────────────────────────────────
    const isolated = detectPhrases(fullText, ISOLATED_DRILL_MARKERS)
    const passive = detectPhrases(fullText, PASSIVE_DEFENDER_MARKERS)
    const allIsolated = Array.from(new Set([...isolated, ...passive]))
    if (allIsolated.length > 0) {
        finding.removedInteractionProperties.push(
            factThenInterpretation(
                `Isolated-drill or passive-opposition markers detected: ${allIsolated.map((p) => `"${p}"`).join(', ')}`,
                appearsToLimit('representativeness — the activity may operate outside a live game frame')
            )
        )
    }

    // ─── Named informational variables ─────────────────────────────────────
    const namedVariables = countWordStems(fullText, INFORMATIONAL_VARIABLES).filter((v) => v.count > 0)
    if (namedVariables.length >= 4) {
        const stems = namedVariables.slice(0, 6).map((v) => v.stem).join(', ')
        finding.preservedInteractionProperties.push(
            `${namedVariables.length} informational variables are explicitly named in the text (${stems}${namedVariables.length > 6 ? ', …' : ''}). ${appearsToSupport(
                'players reading the same information they would read in a real match'
            )}`
        )
    } else if (namedVariables.length <= 1) {
        finding.removedInteractionProperties.push(
            `Informational variables are sparsely named (${namedVariables.length} reference${namedVariables.length === 1 ? '' : 's'} across the bundle). ${mayReduce(
                "visibility of the perceptual variables that should drive the player's action selection"
            )}`
        )
    }

    // ─── Directional consequence (does losing the ball matter?) ────────────
    const directionalConsequence = /opponent gains?|other (?:team|side) (?:attacks?|gains?)|counter-?attack|regain.*?advantage|advantage.*?immediately/i.test(
        fullText
    )
    if (directionalConsequence) {
        finding.preservedInteractionProperties.push(
            `Directional consequence on misread / loss is referenced (opponent gains advantage, other side attacks, counter-attack, …). ${likelyPreserves(
                'the cost-side of the live decision picture'
            )}`
        )
    } else {
        finding.possibleTradeoffs.push(
            `No explicit directional consequence on misread / loss is referenced. ${mayReduce(
                'the perceived cost of poor decisions, which may flatten the risk-reward picture'
            )}`
        )
    }

    // ─── Exchange-rule structure check ─────────────────────────────────────
    if (exchangeRule) {
        const hasLiveContinuation = /next action stays live|play continues|continues live|continuation/i.test(exchangeRule)
        if (hasLiveContinuation) {
            finding.preservedInteractionProperties.push(
                `Exchange rule references live continuation after the outcome: "${clipSnippet(exchangeRule, 160)}". ${appearsToSupport(
                    'continuous interaction rather than discrete trial structure'
                )}`
            )
        }
    }

    // ─── Optional context-driven observation (when ReviewContext supplied) ─
    if (context?.archetypeName) {
        finding.reviewNotes.push(
            `Game form: ${context.archetypeName}. The selected archetype defines the representativeness anchor — check that the named variables above align with the affordances this archetype is intended to produce.`
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
            `No representativeness markers detected. The text may be too thin to evaluate this dimension, or the representativeness signal is carried by structural elements not present in the coach-facing fields (e.g., setup-only).`
        )
    }

    return finding
}
