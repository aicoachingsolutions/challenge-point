import type { Activity } from './activity-schema'
import type { ActivitySkeletonBundle, ActivitySkeletonSlot } from './build-activity-skeleton'
import { normalizeText, tokenize } from '../text'

const ARCHETYPE_FALLBACK_STOP = new Set(['games', 'game', 'directional', 'possession'])

/**
 * Objective, rules, scoring, constraints, coachingFocus — not setup or teams.
 * Mechanics must be satisfied outside setup alone.
 */
export function joinSkeletonMechanicBundle(activity: Activity): string {
    return [activity.objective, activity.scoring, ...activity.rules, ...activity.constraints, ...activity.coachingFocus].join('\n')
}

function joinScoringAndRules(activity: Activity): string {
    return [activity.scoring, ...activity.rules].join('\n')
}

const DECISION_INDICATORS =
    /\bchoose\b|\bread\b|\breact\b|\bbased on\b|\bif\b.*\bthen\b|\bwhen\b.*\bdecide\b|\bdecision\b|\badapt\b|\boption\b|\bmay (be )?use(d)?\b|\boptions?\b|\bavailable\b|\bactive\b|\bopen\b|\bremains? (live|active|open)\b|\bcontinues? live\b|\bwhichever\b|\beither\b/i

const CONSEQUENCE_INDICATORS =
    /\bscor(e|ing)\b|\bpoints?\b|\bwin condition\b|\bwin\b|\blose\b|\boutcome\b|\bsuccess\b|\bfailure\b|\bpenalty\b|\bbonus\b|\bgoal\b|\brestart\b/i

function escapeRegExp(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** When long archetype bullets are paraphrased, still require archetype-specific vocabulary from the game form name. */
function archetypeNameFallbackMatches(bundle: string, archetypeName: string): boolean {
    const words = tokenize(archetypeName).filter((t) => t.length > 3 && !ARCHETYPE_FALLBACK_STOP.has(t))
    if (words.length === 0) {
        return false
    }
    return words.some((t) => new RegExp(`\\b${escapeRegExp(t)}\\b`, 'i').test(bundle))
}

/** Whether text reflects enough of the requirement for skeleton compliance (keyword overlap + optional phrase match). */
export function matchesMechanicRequirement(bundle: string, requirement: string): boolean {
    const normB = normalizeText(bundle)
    const normReq = normalizeText(requirement)
    if (!normReq) {
        return true
    }
    if (normReq.length <= 120 && normB.includes(normReq)) {
        return true
    }

    const reqTokens = tokenize(requirement).filter((t) => t.length > 3 && t !== 'must')
    if (reqTokens.length === 0) {
        return normB.includes(normReq.slice(0, Math.min(60, normReq.length)))
    }
    if (reqTokens.length <= 2) {
        return reqTokens.every((t) => new RegExp(`\\b${escapeRegExp(t)}\\b`, 'i').test(bundle))
    }

    const hits = reqTokens.filter((t) => new RegExp(`\\b${escapeRegExp(t)}\\b`, 'i').test(bundle))
    const ratio = normReq.length > 140 ? 0.28 : 0.35
    const threshold = Math.max(2, Math.ceil(reqTokens.length * ratio))
    return hits.length >= threshold
}

function affordanceFailureSummary(mechanicLine: string): string {
    const colonForm = mechanicLine.match(/^Affordance lens "([^"]+)":\s*([\s\S]+)$/)
    const emDashForm = mechanicLine.match(/^Affordance lens "([^"]+)"\s*—\s*([\s\S]+)$/)
    const titleMatch = colonForm ?? emDashForm
    if (titleMatch) {
        const shortTitle = titleMatch[1].replace(/\s+Opportunity\s*$/i, '').trim()
        const body = titleMatch[2].trim()
        const head = body.split(/\.\s/)[0] ?? body
        const clipped = head.length > 140 ? `${head.slice(0, 137)}…` : head
        return `${shortTitle} requires scoring/rules tied to: ${clipped}`
    }
    const clipped = mechanicLine.length > 160 ? `${mechanicLine.slice(0, 157)}…` : mechanicLine
    return clipped
}

function constraintFailureSummary(line: string): string {
    const clipped = line.length > 180 ? `${line.slice(0, 177)}…` : line
    return clipped
}

/**
 * Validates one activity against its skeleton slot. Returns human-readable failure lines (empty if ok).
 */
export function validateActivityAgainstSkeleton(
    activity: Activity,
    slot: ActivitySkeletonSlot,
    activityIndex: 1 | 2 | 3
): string[] {
    const bundle = joinSkeletonMechanicBundle(activity)
    const scoringRules = joinScoringAndRules(activity)
    const reasons: string[] = []
    const prefix = `Activity ${activityIndex} missing skeleton mechanic:`

    const archeOk =
        slot.requiredArchetypeMechanics.some((m) => matchesMechanicRequirement(bundle, m)) ||
        archetypeNameFallbackMatches(bundle, slot.archetypeName)
    if (!archeOk) {
        reasons.push(
            `${prefix} at least one archetype pattern from the skeleton (directional play, opposition, live contest, or archetype cues) must appear in objective, rules, scoring, constraints, or coachingFocus.`
        )
    }

    for (const m of slot.requiredAffordanceMechanics) {
        if (!matchesMechanicRequirement(bundle, m)) {
            reasons.push(`${prefix} ${affordanceFailureSummary(m)}`)
        }
    }

    for (const m of slot.requiredConstraintMechanics) {
        if (!matchesMechanicRequirement(bundle, m)) {
            reasons.push(`${prefix} ${constraintFailureSummary(m)}`)
        }
    }

    if (!DECISION_INDICATORS.test(bundle)) {
        reasons.push(
            `${prefix} explicit decision language (e.g. choose, read, react, based on, decision, adapt, option) in objective, rules, scoring, constraints, or coachingFocus — not setup alone.`
        )
    }

    const scoringConsequenceOk = CONSEQUENCE_INDICATORS.test(activity.scoring) || CONSEQUENCE_INDICATORS.test(scoringRules)
    const scoringReflectsSkeleton = slot.requiredScoringMechanics.some(
        (m) => matchesMechanicRequirement(scoringRules, m) || matchesMechanicRequirement(bundle, m)
    )

    if (!scoringConsequenceOk) {
        reasons.push(
            `${prefix} consequence/scoring — scoring or rules must state points, outcomes, advantage, or win logic tied to the contest (not setup alone).`
        )
    }
    if (!scoringReflectsSkeleton) {
        reasons.push(
            `${prefix} scoring/rules must reflect skeleton obligations (archetype + affordance + constraint scoring lines from the payload).`
        )
    }

    return reasons
}

export function validateActivitiesAgainstSkeleton(activities: Activity[], bundle: ActivitySkeletonBundle): void {
    if (activities.length !== bundle.activities.length) {
        throw new Error(`Skeleton validation: expected ${bundle.activities.length} activities, got ${activities.length}.`)
    }
    const failures: string[] = []
    for (let i = 0; i < activities.length; i++) {
        const n = (i + 1) as 1 | 2 | 3
        failures.push(...validateActivityAgainstSkeleton(activities[i], bundle.activities[i], n))
    }
    if (failures.length > 0) {
        throw new Error(failures.join('\n'))
    }
}
