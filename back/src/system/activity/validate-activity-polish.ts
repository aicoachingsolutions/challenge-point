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

        return {
            title: String(o.title).trim(),
            setup: String(o.setup).trim(),
            objective: String(o.objective).trim(),
            coachingFocus: (o.coachingFocus as string[]).map((s) => s.trim()),
        }
    })
}
