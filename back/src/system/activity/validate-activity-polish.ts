export interface ActivityPolish {
    title: string
    setup: string
    objective: string
    coachingFocus: string[]
}

const SYSTEM_OWNED_POLISH_FIELDS = [
    'rules',
    'scoring',
    'constraints',
    'teams',
    'decisionCues',
    'opponentConsequences',
    'twoSidedExchangeRule',
    'twoSidedScoringConsequence',
    'scoringSystem',
    'winCondition',
] as const

function isNonEmptyString(v: unknown): v is string {
    return typeof v === 'string' && v.trim().length > 0
}

function isNonEmptyStringArray(v: unknown): v is string[] {
    return Array.isArray(v) && v.length > 0 && v.every((x) => typeof x === 'string' && x.trim().length > 0)
}

/**
 * Phase 3.5 vocabulary guardrail: 'baseline', 'twist', and 'variation' are internal
 * profile terminology and must not appear in coach-facing polish fields (title, setup,
 * objective, coachingFocus). If the AI slips one through despite the prompt instruction,
 * fail polish validation so the model retries rather than shipping a leaked label.
 */
const LEAKED_PROFILE_VOCAB: RegExp[] = [/\bbaseline\b/i, /\btwist\b/i, /\bvariation\b/i, /\bvariations\b/i]

function assertNoLeakedProfileVocab(activityIndexOneBased: number, field: string, value: string): void {
    for (const re of LEAKED_PROFILE_VOCAB) {
        if (re.test(value)) {
            const match = value.match(re)?.[0]
            throw new Error(
                `Activity ${activityIndexOneBased}: ${field} contains internal profile terminology ("${match}"). The words "baseline", "twist", and "variation" are not coach-facing; rewrite using concrete environmental description.`
            )
        }
    }
}

export function validateActivityPolishPayload(parsed: unknown): ActivityPolish[] {
    if (parsed === null || typeof parsed !== 'object') {
        throw new Error('Assembly polish payload must be an object.')
    }

    const root = parsed as Record<string, unknown>
    const activities = root.activities
    if (!Array.isArray(activities) || activities.length !== 3) {
        throw new Error('Assembly polish payload must include "activities" array of length 3.')
    }

    return activities.map((item, index) => {
        if (item === null || typeof item !== 'object') {
            throw new Error(`Activity ${index + 1}: polish entry must be a non-null object.`)
        }
        const o = item as Record<string, unknown>
        for (const field of SYSTEM_OWNED_POLISH_FIELDS) {
            if (field in o) {
                throw new Error(`Activity ${index + 1}: ai_polish_contains_system_owned_field:${field}`)
            }
        }
        if (!isNonEmptyString(o.title)) throw new Error(`Activity ${index + 1}: title must be a non-empty string`)
        if (!isNonEmptyString(o.setup)) throw new Error(`Activity ${index + 1}: setup must be a non-empty string`)
        if (!isNonEmptyString(o.objective)) throw new Error(`Activity ${index + 1}: objective must be a non-empty string`)
        if (!isNonEmptyStringArray(o.coachingFocus)) {
            throw new Error(`Activity ${index + 1}: coachingFocus must be a non-empty array of non-empty strings`)
        }

        const title = String(o.title).trim()
        const setup = String(o.setup).trim()
        const objective = String(o.objective).trim()
        const coachingFocus = (o.coachingFocus as string[]).map((s) => s.trim())

        // Phase 3.5 vocabulary guardrail — internal profile terminology must not leak into
        // coach-facing fields. See the LEAKED_PROFILE_VOCAB list above.
        assertNoLeakedProfileVocab(index + 1, 'title', title)
        assertNoLeakedProfileVocab(index + 1, 'setup', setup)
        assertNoLeakedProfileVocab(index + 1, 'objective', objective)
        coachingFocus.forEach((line, focusIndex) =>
            assertNoLeakedProfileVocab(index + 1, `coachingFocus[${focusIndex}]`, line)
        )

        return { title, setup, objective, coachingFocus }
    })
}
