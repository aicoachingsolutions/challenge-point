import type { Activity } from './activity-schema'

export type CoachActivityView = {
    title: string
    setup: string[]
    objective: string
    rules: string[]
    scoring: string[]
    constraints: string
    coachingPoints: string[]
    teams: string
}

const RULE_BLOCKLIST = [
    'Affordance lens',
    'Affordance tag emphasis',
    'Constraint-support pattern',
    'Scoring-support pattern',
    'Players should recognize',
    'Archetype incentive pattern support',
    'Archetype constraint pattern support',
    'Archetype objective emphasis',
    'Archetype interaction structure',
    'Assembly guardrail',
    'Interaction exchange',
    'Opponent consequence emphasis',
    'If a team recognizes the live opportunity created by',
    'Archetype identity:',
    'Players solve this activity',
    'Selected foundation constraint',
    'Selected shaping constraint',
    'Selected consequence constraint',
    'Two-sided exchange rule must describe',
    'must describe',
    'rule must',
    'The activity interaction should follow',
]

const COACHING_BLOCKLIST = [
    'Coach the players to choose, read, react, based on, decision, adapt, option',
    'Players solve this activity by pursuing:',
    'Players read pressure and decide whether to secure, progress, or switch based on the live picture.',
    'Players read pressure and decide whether to secure',
    'Players react to space, support, and opponent recovery before the next action.',
    'Players react to space, support, and opponent recovery',
    'Affordance lens',
    'Affordance decision cue',
    'Constraint-support pattern',
    'Scoring-support pattern',
    'Archetype objective emphasis',
    'The activity interaction should follow',
]

function normalizeLine(value: string | undefined): string {
    return String(value ?? '')
        .replace(/â€¦/g, '')
        .replace(/\.{2,}/g, '.')
        .replace(/\s+\./g, '.')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/\.\s*\./g, '.')
        .replace(/[.\s]+$/g, '')
}

function uniqueNonEmpty(lines: string[]): string[] {
    const seen = new Set<string>()
    const out: string[] = []
    for (const line of lines.map(normalizeLine).filter(Boolean)) {
        const key = line.toLowerCase()
        if (seen.has(key)) continue
        seen.add(key)
        out.push(line)
    }
    return out
}

function shortenText(value: string, max = 220): string {
    const next = normalizeLine(value)
    if (next.length <= max) return next
    return next.slice(0, max).trimEnd()
}

function splitReadableSentences(value: string): string[] {
    return uniqueNonEmpty(
        value
            .split(/\n+/)
            .flatMap((line) => line.split(/(?<=[.!?])\s+/))
            .map((line) => line.trim())
            .filter(Boolean)
    )
}

function sentenceText(value: string): string {
    const line = normalizeLine(value)
    return line ? `${line}.` : ''
}

function cleanObjective(value: string): string {
    const withoutSystemPhrase = String(value ?? '')
        .replace(/\s*Players solve this activity by pursuing:\s*/i, '. ')
        .replace(/\s+/g, ' ')
        .trim()
    const sentences = splitReadableSentences(withoutSystemPhrase).slice(0, 2).map(sentenceText)
    const text = sentences.join(' ')
    return text.length <= 220 ? text : sentenceText(text.slice(0, 220))
}

function filterMeaningfulRules(rules: string[]): string[] {
    return uniqueNonEmpty(
        rules
            .map((rule) => normalizeLine(rule))
            .filter((rule) => !RULE_BLOCKLIST.some((blocked) => rule.includes(blocked)))
            .slice(0, 4)
    )
}

function setupLines(activity: Activity): string[] {
    const setupSentences = splitReadableSentences(activity.setup)
    const playerCount =
        setupSentences.find((line) => /\b\d+\s*v\s*\d+\b/i.test(line)) ?? simplifyTeams(activity.teams)
    const fieldSetup = setupSentences
        .filter(
            (line) =>
                !/\b\d+\s*v\s*\d+\b/i.test(line) && !/^play starts\b/i.test(line) && !/^game starts\b/i.test(line)
        )
        .join('. ')
    return uniqueNonEmpty([
        `Field setup: ${fieldSetup || activity.setup}`,
        `Player count: ${playerCount}`,
        'Restart rule: Restart quickly from the spot of the turnover, score, or coach stoppage.',
    ]).slice(0, 3)
}

function summarizeConstraints(constraints: string[]): string {
    const selectedTitles = constraints
        .filter((line) => line.startsWith('Selected '))
        .map((line) => {
            const match = line.match(/"([^"]+)"/)
            return match?.[1] ?? ''
        })
        .filter(Boolean)

    if (selectedTitles.length > 0) {
        return uniqueNonEmpty(selectedTitles).slice(0, 2).join('; ')
    }

    const fallback = constraints
        .filter((line) => !RULE_BLOCKLIST.some((blocked) => line.includes(blocked)))
        .slice(0, 2)
    return shortenText(uniqueNonEmpty(fallback).join(' '), 240)
}

function scoringLines(constraints: string[]): string[] {
    const constraintSummary = summarizeConstraints(constraints)
    return uniqueNonEmpty([
        'Main scoring rule: Teams score by keeping possession under pressure and progressing toward the target.',
        constraintSummary
            ? `Optional bonus rule: Award bonus points when players use the listed constraints successfully: ${constraintSummary}.`
            : 'Optional bonus rule: Award bonus points when players use the listed constraints successfully.',
    ]).slice(0, 2)
}

function coachPointsFromFocus(coachingFocus: string[]): string[] {
    return uniqueNonEmpty(
        coachingFocus
            .map((line) => normalizeLine(line))
            .filter((line) => !COACHING_BLOCKLIST.some((blocked) => line.includes(blocked)))
            .map((line) => line.replace(/^Coaching emphasis:\s*/i, '').trim())
            .slice(0, 4)
    )
}

function simplifyTeams(value: string): string {
    const normalized = normalizeLine(value).replace(/Player structure logic:\s*Even numbers\.?/i, 'Use even numbers.')
    if (normalized.includes('Two teams compete in the same direction')) {
        return 'Use two even teams. One team keeps and progresses possession while the other pressures, wins it back, and attacks the other way.'
    }
    return normalized
}

export function mapActivityToCoachView(activity: Activity): CoachActivityView {
    return {
        title: activity.title,
        setup: setupLines(activity),
        objective: cleanObjective(activity.objective),
        rules: filterMeaningfulRules(activity.rules),
        scoring: scoringLines(activity.constraints),
        constraints: summarizeConstraints(activity.constraints),
        coachingPoints: coachPointsFromFocus(activity.coachingFocus),
        teams: simplifyTeams(activity.teams),
    }
}
