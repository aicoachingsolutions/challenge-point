/**
 * Opposition Integrity analyzer.
 *
 * Christian's framing: "Evaluate whether opposition meaningfully shapes interaction.
 * Could attackers succeed while largely ignoring defenders? Do defenders influence timing
 * and spacing? Does pressure alter available affordances? Are opponents functionally
 * meaningful or decorative?"
 *
 * What this analyzer observes:
 *   - presence of opposition markers (opponent, defenders, pressure, contest)
 *   - presence of passive-defender markers (unopposed, take turns, coach serves)
 *   - whether the exchange rule (rules[0] in our generation) names what the opponent does
 *     when the attacker misreads — a structural symmetry check
 *   - whether scoring/win condition references defensive consequence or only attacking success
 *   - whether teams description specifies live opposition vs static role assignment
 */

import {
    appearsToInvite,
    appearsToLimit,
    likelyPreserves,
    mayCreateRiskOf,
    mayReduce,
    mayWeaken,
    factThenInterpretation,
} from './language-templates'
import {
    OPPOSITION_MARKERS,
    PASSIVE_DEFENDER_MARKERS,
    clipSnippet,
    countWordStems,
    detectPhrases,
    joinActivityText,
    normalize,
} from './text-scanning'
import type { CategoryFinding, ReviewContext, ReviewableActivity } from './types'

export function analyzeOppositionIntegrity(
    activity: ReviewableActivity,
    _context?: ReviewContext
): CategoryFinding {
    const finding: CategoryFinding = {
        category: 'Opposition Integrity',
        preservedInteractionProperties: [],
        removedInteractionProperties: [],
        possibleTradeoffs: [],
        possibleEcologicalDriftRisks: [],
        reviewNotes: [],
    }

    const fullText = joinActivityText(activity)
    const teamsText = activity.teams ?? ''
    const exchangeRule = activity.rules[0] ?? ''
    const scoringText = activity.scoring ?? ''
    const winCondition = activity.winCondition ?? ''

    // ─── Passive-defender flags (high-impact drift signal) ─────────────────
    const passive = detectPhrases(fullText, PASSIVE_DEFENDER_MARKERS)
    if (passive.length > 0) {
        finding.removedInteractionProperties.push(
            factThenInterpretation(
                `Passive-defender markers detected: ${passive.map((p) => `"${p}"`).join(', ')}`,
                appearsToLimit("opposition's role in shaping the attacker's decision picture")
            )
        )
        finding.possibleEcologicalDriftRisks.push(
            `${mayCreateRiskOf('uncontested progression where the opponent is functionally decorative')}`
        )
    }

    // ─── Opposition marker density across the bundle ───────────────────────
    const oppHits = countWordStems(fullText, OPPOSITION_MARKERS).reduce((s, e) => s + e.count, 0)
    if (oppHits >= 5) {
        finding.preservedInteractionProperties.push(
            `Opposition vocabulary (opponent / defenders / pressure / contest / press / regain) appears ${oppHits} times across the bundle. ${likelyPreserves(
                'a continuously contested decision picture'
            )}`
        )
    } else if (oppHits <= 1 && passive.length === 0) {
        finding.removedInteractionProperties.push(
            `Opposition vocabulary appears only ${oppHits} time${oppHits === 1 ? '' : 's'} across the bundle. ${mayWeaken(
                "the opponent's structural role in the activity description"
            )}`
        )
    }

    // ─── Teams description: live opposition? ──────────────────────────────
    const teamsLower = normalize(teamsText)
    const hasLiveOpposition = /live|contest|press|regain|under pressure|defending team|defenders/.test(teamsLower)
    const hasAttackOnly = teamsLower && !hasLiveOpposition
    if (hasLiveOpposition) {
        finding.preservedInteractionProperties.push(
            `Teams description frames the contest as live and bidirectional. ${likelyPreserves(
                'opponent influence on timing, spacing, and affordance visibility'
            )}`
        )
    } else if (hasAttackOnly) {
        finding.removedInteractionProperties.push(
            `Teams description does not reference live opposition or contest dynamics. ${mayWeaken(
                "the opponent's effect on the decision picture"
            )}`
        )
    }

    // ─── Exchange rule symmetry: does it name what the opponent does? ──────
    if (exchangeRule) {
        const exchangeLower = normalize(exchangeRule)
        const namesOpponentAction = /opponent|defending team|other (?:team|side)|regain|counter|press/i.test(exchangeLower)
        const hasIfThenStructure = /if .* then|but if .* then/i.test(exchangeLower)
        if (namesOpponentAction && hasIfThenStructure) {
            finding.preservedInteractionProperties.push(
                `Exchange rule names what the opponent does on attacker misread: "${clipSnippet(exchangeRule, 160)}". ${likelyPreserves(
                    'two-sided contest structure where opponent action has consequence'
                )}`
            )
        } else if (!namesOpponentAction) {
            finding.removedInteractionProperties.push(
                `Exchange rule does not explicitly name the opponent's response. ${mayWeaken(
                    'symmetry between attacker opportunity and defender consequence'
                )}`
            )
        }
    } else {
        finding.reviewNotes.push(
            `No exchange rule (rules[0]) present to analyze for opposition symmetry.`
        )
    }

    // ─── Scoring: does it reference defensive consequence? ─────────────────
    const scoringPlusWin = `${scoringText} ${winCondition}`.toLowerCase()
    const defensiveScoring = /regain|turnover|recover|delay|deny|opponent gains?|defending team|interception/.test(scoringPlusWin)
    const attackingOnlyScoring = !defensiveScoring && /point|goal|score/i.test(scoringPlusWin)
    if (defensiveScoring) {
        finding.preservedInteractionProperties.push(
            `Scoring references defensive outcomes (regain / turnover / recovery / delay / opponent gains). ${appearsToInvite(
                'defenders to play for outcomes that count as advantage, not only to prevent attacks'
            )}`
        )
    } else if (attackingOnlyScoring) {
        finding.possibleTradeoffs.push(
            `Scoring references attacking outcomes (point/goal/score) without reciprocal defensive outcomes. ${mayReduce(
                "defenders' visible stake in the contest's reward structure"
            )}`
        )
    }

    // ─── Pressure framing on attacker actions ──────────────────────────────
    const pressureUnderActions = /under (?:pressure|opposition|live contest|live opposition)/i.test(fullText)
    if (pressureUnderActions) {
        finding.preservedInteractionProperties.push(
            `Action language is repeatedly qualified by 'under pressure' / 'under live opposition'. ${likelyPreserves(
                "pressure's influence on action selection"
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
            `No opposition markers detected in the activity text. The activity description may be too thin to evaluate Opposition Integrity, or opposition may be implicit.`
        )
    }

    return finding
}
