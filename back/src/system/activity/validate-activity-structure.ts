import type { Activity, ActivityValidationBlock } from './activity-schema'

/**
 * Prohibited substrings (case-insensitive). Any match fails validation — no threshold, no offset by open-decision language.
 * Keep in sync with completion prompt and validate-generated-activity (legacy IActivity path).
 */
export const ABSOLUTE_PRESCRIPTIVE_PHRASES = [
    'must pass',
    'must dribble',
    'must shoot',
    'only use',
    'required sequence',
    'repeat this pattern',
    'perform this technique',
    'players must',
] as const

/**
 * Returns which prohibited phrases appear in `text` (lowercased scan). Used for error messages and legacy validation.
 */
export function findPrescriptivePhraseViolations(text: string): string[] {
    const lower = text.toLowerCase()
    const found = new Set<string>()
    for (const phrase of ABSOLUTE_PRESCRIPTIVE_PHRASES) {
        if (lower.includes(phrase)) {
            found.add(phrase)
        }
    }
    return [...found]
}

const OPPOSITION_INDICATORS = /\bvs\.?\b|defenders|attackers|compete|competing|opposed|opponent|opponents|pressure|contest|challenge\b/i
const ISOLATED_DRILL_INDICATORS = /\bunopposed\b|\bwithout defenders\b|\bisolated drill\b|\bline up\b|\btake turns\b|\bone at a time\b|\bcoach serves\b/i

const DECISION_INDICATORS =
    /\bchoose\b|\bread\b|\breact\b|\bbased on\b|\bif\b.*\bthen\b|\bwhen\b.*\bdecide\b|\bdecision\b|\badapt\b|\boption\b|\bmay (be )?use(d)?\b|\boptions?\b|\bavailable\b|\bactive\b|\bopen\b|\bremains? (live|active|open)\b|\bcontinues? live\b|\bwhichever\b|\beither\b/i

const CONSEQUENCE_INDICATORS =
    /\bscor(e|ing)\b|\bpoints?\b|\bwin condition\b|\bwin\b|\blose\b|\boutcome\b|\bsuccess\b|\bfailure\b|\bpenalty\b|\bbonus\b|\bgoal\b|\brestart\b/i

function joinActivityText(a: Pick<Activity, 'rules' | 'constraints' | 'setup' | 'teams' | 'objective' | 'scoring' | 'coachingFocus'>): string {
    return [
        a.setup,
        a.teams,
        a.objective,
        a.scoring,
        ...a.rules,
        ...a.constraints,
        ...a.coachingFocus,
    ].join('\n')
}

function assessOpposition(text: string): { ok: boolean; reason?: string } {
    if (ISOLATED_DRILL_INDICATORS.test(text)) {
        return { ok: false, reason: 'Content reads as isolated drill or non-opposed setup.' }
    }
    if (!OPPOSITION_INDICATORS.test(text)) {
        return { ok: false, reason: 'No clear opposition or contested interaction between groups.' }
    }
    return { ok: true }
}

function assessDecisionMaking(text: string): { ok: boolean; reason?: string } {
    if (!DECISION_INDICATORS.test(text)) {
        return { ok: false, reason: 'No clear decision-making language (choose/read/react/conditional).' }
    }
    return { ok: true }
}

function assessConsequence(text: string): { ok: boolean; reason?: string } {
    if (!CONSEQUENCE_INDICATORS.test(text)) {
        return { ok: false, reason: 'No scoring system, win logic, or success/failure outcome described.' }
    }
    return { ok: true }
}

function isNonEmptyString(v: unknown): v is string {
    return typeof v === 'string' && v.trim().length > 0
}

function isNonEmptyStringArray(v: unknown): v is string[] {
    return Array.isArray(v) && v.length > 0 && v.every((x) => typeof x === 'string' && x.trim().length > 0)
}

/**
 * Validates one Activity: structure (A), environmental integrity + prescriptive scan (B),
 * then sets `validation` from computed checks. Throws on any failure — no partial pass.
 */
export function validateActivityStructure(raw: unknown): Activity {
    if (raw === null || typeof raw !== 'object') {
        throw new Error('Activity must be a non-null object.')
    }

    const o = raw as Record<string, unknown>

    const title = o.title
    const setup = o.setup
    const teams = o.teams
    const objective = o.objective
    const rules = o.rules
    const scoring = o.scoring
    const constraints = o.constraints
    const coachingFocus = o.coachingFocus

    const structuralReasons: string[] = []
    if (!isNonEmptyString(title)) structuralReasons.push('title must be a non-empty string')
    if (!isNonEmptyString(setup)) structuralReasons.push('setup must be a non-empty string')
    if (!isNonEmptyString(teams)) structuralReasons.push('teams must be a non-empty string')
    if (!isNonEmptyString(objective)) structuralReasons.push('objective must be a non-empty string')
    if (!isNonEmptyString(scoring)) structuralReasons.push('scoring must be a non-empty string')
    if (!isNonEmptyStringArray(rules)) structuralReasons.push('rules must be a non-empty array of non-empty strings')
    if (!isNonEmptyStringArray(constraints)) structuralReasons.push('constraints must be a non-empty array of non-empty strings')
    if (!isNonEmptyStringArray(coachingFocus)) structuralReasons.push('coachingFocus must be a non-empty array of non-empty strings')

    if (structuralReasons.length > 0) {
        throw new Error(structuralReasons.join(' '))
    }

    const activity: Activity = {
        title: (title as string).trim(),
        setup: (setup as string).trim(),
        teams: (teams as string).trim(),
        objective: (objective as string).trim(),
        rules: (rules as string[]).map((s) => s.trim()),
        scoring: (scoring as string).trim(),
        constraints: (constraints as string[]).map((s) => s.trim()),
        coachingFocus: (coachingFocus as string[]).map((s) => s.trim()),
        validation: {
            hasOpposition: false,
            hasDecisionMaking: false,
            hasConsequence: false,
            avoidsPrescriptiveActions: false,
        },
    }

    const fullText = joinActivityText(activity)

    const prescriptiveViolations = findPrescriptivePhraseViolations(fullText)
    if (prescriptiveViolations.length > 0) {
        throw new Error(`Prescriptive language detected: ${prescriptiveViolations.join(', ')}`)
    }

    const opp = assessOpposition(fullText)
    const dec = assessDecisionMaking(fullText)
    const cons = assessConsequence(fullText)

    const validation: ActivityValidationBlock = {
        hasOpposition: opp.ok,
        hasDecisionMaking: dec.ok,
        hasConsequence: cons.ok,
        avoidsPrescriptiveActions: true,
    }

    activity.validation = validation

    const failures: string[] = []
    if (!validation.hasOpposition) failures.push(opp.reason ?? 'Opposition check failed.')
    if (!validation.hasDecisionMaking) failures.push(dec.reason ?? 'Decision-making check failed.')
    if (!validation.hasConsequence) failures.push(cons.reason ?? 'Consequence check failed.')

    if (failures.length > 0) {
        throw new Error(failures.join(' '))
    }

    return activity
}

const EXPECTED_COUNT = 3

/** Validates AI assembly wrapper: exactly three activities, each passing validateActivityStructure. */
export function validateActivitiesAssemblyPayload(parsed: unknown): Activity[] {
    if (parsed === null || typeof parsed !== 'object') {
        throw new Error('Assembly payload must be an object.')
    }
    const root = parsed as Record<string, unknown>
    const activities = root.activities
    if (!Array.isArray(activities) || activities.length !== EXPECTED_COUNT) {
        throw new Error(`Assembly payload must include "activities" array of length ${EXPECTED_COUNT}.`)
    }

    const out: Activity[] = []
    activities.forEach((item, index) => {
        try {
            out.push(validateActivityStructure(item))
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err)
            throw new Error(`Activity ${index + 1}: ${msg}`)
        }
    })

    return out
}
