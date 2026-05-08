import type { Activity } from './activity-schema'
import type { ActivityMechanics } from './build-activity-mechanics'

type MechanicsComparableActivity = Partial<Activity> & {
}

type ValidateActivityMechanicsInput = {
    activity: MechanicsComparableActivity
    mechanics: Partial<ActivityMechanics>
    skeleton?: unknown
}

type ValidateActivityMechanicsResult = {
    valid: boolean
    errors: string[]
}

function sortValue(value: unknown): unknown {
    if (Array.isArray(value)) {
        return value.map(sortValue)
    }
    if (value && typeof value === 'object') {
        const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b))
        const out: Record<string, unknown> = {}
        for (const [key, next] of entries) {
            out[key] = sortValue(next)
        }
        return out
    }
    return value
}

function stableStringify(value: unknown): string {
    return JSON.stringify(sortValue(value))
}

function arraysOfStrings(value: unknown): string[] | null {
    if (!Array.isArray(value)) {
        return null
    }
    return value.map((entry) => String(entry))
}

function stringValue(value: unknown): string | null {
    return typeof value === "string" ? value : null
}

function collectErrors(result: boolean, code: string, errors: string[]): void {
    if (!result) {
        errors.push(code)
    }
}

function compareExactArray(activityValue: unknown, mechanicsValue: unknown): boolean {
    const left = arraysOfStrings(activityValue)
    const right = arraysOfStrings(mechanicsValue)
    if (left === null || right === null) {
        return false
    }
    return stableStringify(left) === stableStringify(right)
}

function compareExactString(activityValue: unknown, mechanicsValue: unknown): boolean {
    const left = stringValue(activityValue)
    const right = stringValue(mechanicsValue)
    if (left === null || right === null) {
        return false
    }
    return stableStringify(left) === stableStringify(right)
}

function mechanicsScoringString(mechanics: Partial<ActivityMechanics>): string | null {
    const scoring = arraysOfStrings(mechanics.scoring)
    if (scoring === null) {
        return null
    }
    return scoring.join('\n')
}

export function validateActivityMechanics(input: ValidateActivityMechanicsInput): ValidateActivityMechanicsResult {
    const { activity, mechanics } = input
    const errors: string[] = []

    collectErrors(compareExactArray(activity.rules, mechanics.rules), 'rules_mismatch', errors)

    const activityScoring = stringValue(activity.scoring)
    const expectedScoring = mechanicsScoringString(mechanics)
    collectErrors(
        activityScoring !== null && expectedScoring !== null && stableStringify(activityScoring) === stableStringify(expectedScoring),
        'scoring_mismatch',
        errors
    )

    collectErrors(compareExactArray(activity.constraints, mechanics.constraints), 'constraints_mismatch', errors)

    if (mechanics.teams !== undefined || activity.teams !== undefined) {
        collectErrors(compareExactString(activity.teams, mechanics.teams), 'teams_mismatch', errors)
    }

    return {
        valid: errors.length === 0,
        errors,
    }
}
