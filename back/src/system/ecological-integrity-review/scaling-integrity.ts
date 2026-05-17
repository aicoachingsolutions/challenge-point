/**
 * Scaling Integrity analyzer.
 *
 * Christian's framing: "Evaluate whether simplification preserves meaningful interaction.
 * Was environmental scaling attempted before restrictive rules? Does simplification preserve
 * perception-action relationships? What tradeoffs were introduced through scaling? Does
 * reduced complexity still preserve meaningful adaptation?"
 *
 * What this analyzer observes:
 *   - presence of concrete environmental parameters in setup: field dimensions, zones, time
 *     windows, numerical structures
 *   - whether restrictive rules dominate over environmental shaping
 *   - whether the simplification removes opposition / pressure variables
 *   - placeholder language ("if needed", "appropriate to") that signals under-specified setup
 */

import {
    appearsToInvite,
    appearsToLimit,
    factThenInterpretation,
    likelyPreserves,
    mayReduce,
    mayTradeOff,
    mayWeaken,
} from './language-templates'
import {
    PRESCRIPTIVE_PHRASES,
    clipSnippet,
    countWordStems,
    detectPhrases,
    findAllMatches,
    joinActivityText,
} from './text-scanning'
import type { CategoryFinding, ReviewContext, ReviewableActivity } from './types'

const FIELD_DIMENSION_REGEX = /\b\d+\s?(?:m|meters?|x|by)\s?\d+\b|\b\d+\s?(?:m|meters?)\s+(?:long|wide|deep|across)\b/gi

const NUMERICAL_STRUCTURE_REGEX = /\b\d+\s?v\s?\d+\b|\b\d+v\d+\b|\b\d+\s+(?:players?|attackers?|defenders?|neutrals?)\b/gi

const TIME_WINDOW_REGEX = /\b\d+\s?(?:seconds?|secs?|minutes?|mins?)\b|\b\d+-second\b/gi

const ZONE_REFERENCE_REGEX = /\b(?:zone|zones|channel|channels|lane|lanes|area|areas|grid|third|thirds)\b/gi

const SETUP_PLACEHOLDER_MARKERS = [
    'if needed',
    'as needed',
    'as appropriate',
    'appropriate to',
    'as required',
    'choose appropriate',
    'optional',
] as const

export function analyzeScalingIntegrity(
    activity: ReviewableActivity,
    context?: ReviewContext
): CategoryFinding {
    const finding: CategoryFinding = {
        category: 'Scaling Integrity',
        preservedInteractionProperties: [],
        removedInteractionProperties: [],
        possibleTradeoffs: [],
        possibleEcologicalDriftRisks: [],
        reviewNotes: [],
    }

    const setup = activity.setup ?? ''
    const fullText = joinActivityText(activity)

    // ─── Setup presence ────────────────────────────────────────────────────
    if (!setup.trim()) {
        finding.removedInteractionProperties.push(
            `No setup description is present on the activity. ${appearsToLimit(
                'evaluability of Scaling Integrity — scaling cannot be assessed against an absent setup'
            )}`
        )
        return finding
    }

    // ─── Concrete environmental parameters ────────────────────────────────
    const dimensions = findAllMatches(setup, FIELD_DIMENSION_REGEX)
    const structures = findAllMatches(setup, NUMERICAL_STRUCTURE_REGEX)
    const windows = findAllMatches(setup, TIME_WINDOW_REGEX)
    const zoneRefs = (setup.match(ZONE_REFERENCE_REGEX) || []).length

    const concreteParameterCount = dimensions.length + structures.length + windows.length + (zoneRefs > 0 ? 1 : 0)
    if (concreteParameterCount >= 2) {
        const parts: string[] = []
        if (dimensions.length) parts.push(`field dimensions (${dimensions.join(', ')})`)
        if (structures.length) parts.push(`numerical structure (${structures.join(', ')})`)
        if (windows.length) parts.push(`time window(s) (${windows.join(', ')})`)
        if (zoneRefs > 0) parts.push(`zone / channel references (${zoneRefs})`)
        finding.preservedInteractionProperties.push(
            `Setup names concrete environmental parameters — ${parts.join('; ')}. ${likelyPreserves(
                'the coach\'s ability to physically scale the activity without inventing parameters'
            )}`
        )
    } else if (concreteParameterCount === 0) {
        finding.removedInteractionProperties.push(
            `Setup does not name field dimensions, numerical structure, time windows, or zones. ${mayReduce(
                "the coach's ability to scale the activity faithfully — most scaling choices fall to ad-hoc invention at run time"
            )}`
        )
    }

    // ─── Restrictive-rule load relative to environmental framing ──────────
    const setupPrescriptive = detectPhrases(setup, PRESCRIPTIVE_PHRASES)
    if (setupPrescriptive.length > 0) {
        finding.possibleEcologicalDriftRisks.push(
            factThenInterpretation(
                `Setup contains prescriptive phrasing: ${setupPrescriptive.map((p) => `"${p}"`).join(', ')}`,
                mayTradeOff(
                    'environmental scaling',
                    'a behavior rule that constrains how players use the space'
                )
            )
        )
    }

    // ─── Placeholder / under-specified setup language ─────────────────────
    const placeholders = detectPhrases(setup, SETUP_PLACEHOLDER_MARKERS)
    if (placeholders.length > 0) {
        finding.possibleTradeoffs.push(
            factThenInterpretation(
                `Setup uses placeholder qualifiers (${placeholders.map((p) => `"${p}"`).join(', ')})`,
                mayWeaken(
                    'the specificity of the setup; the coach may default to a generic configuration that loses scaling intent'
                )
            )
        )
    }

    // ─── Setup length & informativeness ────────────────────────────────────
    const setupLength = setup.trim().length
    if (setupLength < 40) {
        finding.removedInteractionProperties.push(
            `Setup description is very short (${setupLength} characters). ${mayWeaken(
                'representativeness — most environmental scaling decisions are absent from the text'
            )}`
        )
    }

    // ─── Opposition presence inside scaled setup ──────────────────────────
    const setupReferencesLiveOpposition = /live|opposed|defender|defending team|pressing|press\b/i.test(setup)
    if (!setupReferencesLiveOpposition) {
        finding.possibleTradeoffs.push(
            `Setup does not reference live opposition. ${mayReduce(
                "the visibility of opposition in the scaling layer; the activity's contest may live entirely in the rules / scoring sections"
            )}`
        )
    } else {
        finding.preservedInteractionProperties.push(
            `Setup references live opposition. ${appearsToInvite(
                'environmental scaling that preserves contest pressure rather than simplifying it away'
            )}`
        )
    }

    // ─── Cross-check against ReviewContext (if supplied) ──────────────────
    if (context?.fieldDimensions?.length && context?.fieldDimensions?.width) {
        const expectedDim = `${context.fieldDimensions.length}x${context.fieldDimensions.width}`
        if (!setup.toLowerCase().includes(String(context.fieldDimensions.length)) ||
            !setup.toLowerCase().includes(String(context.fieldDimensions.width))) {
            finding.reviewNotes.push(
                `Session-level field dimensions (${expectedDim}) do not appear verbatim in the setup text. The activity may have rescaled silently, or the coach-facing setup may omit the session dimension. Worth verifying.`
            )
        }
    }

    if (context?.playerCount && !new RegExp(`\\b${context.playerCount}\\b`).test(setup)) {
        finding.reviewNotes.push(
            `Session-level player count (${context.playerCount}) does not appear in the setup text. The activity may have abstracted away the count or scaled it inside the rules.`
        )
    }

    // ─── Snippet anchor for traceability ───────────────────────────────────
    finding.reviewNotes.push(`Setup lead-in: "${clipSnippet(setup, 200)}"`)

    return finding
}
