import type { Activity } from './activity-schema'

export type CoachActivityView = {
    title: string
    setup: string
    objective: string
    rules: string[]
    scoring: string
    constraints: string
    coachingPoints: string[]
    teams: string
}

const RULE_BLOCKLIST = [
    'Affordance lens',
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
    'Two-sided exchange rule must describe',
    'must describe',
    'rule must',
]

const COACHING_BLOCKLIST = [
    'Coach the players to choose, read, react, based on, decision, adapt, option',
    'Players solve this activity by pursuing:',
    'Players read pressure and decide whether to secure, progress, or switch based on the live picture.',
    'Players react to space, support, and opponent recovery before the next action.',
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

function firstSentences(value: string, maxSentences: number, maxChars: number): string {
    const sentences = splitReadableSentences(value).slice(0, maxSentences)
    return shortenText(sentences.join(' '), maxChars)
}

function removeSystemObjectivePhrase(value: string): string {
    return normalizeLine(value)
        .replace(/\s*Players solve this activity by pursuing:\s*/i, '. ')
        .replace(/\s+/g, ' ')
        .trim()
}

function filterMeaningfulRules(rules: string[]): string[] {
    return uniqueNonEmpty(
        rules
            .map((rule) => normalizeLine(rule))
            .filter((rule) => !RULE_BLOCKLIST.some((blocked) => rule.includes(blocked)))
            .slice(0, 4)
    )
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

function summarizeScoring(constraints: string[]): string {
    const constraintSummary = summarizeConstraints(constraints)
    const secondSentence = constraintSummary
        ? `Award bonus points when players use the listed constraints successfully: ${constraintSummary}.`
        : 'Award bonus points when players use the listed constraints successfully.'
    return firstSentences(
        `Teams score by keeping possession under pressure and progressing toward the target. ${secondSentence}`,
        2,
        320
    )
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
        setup: activity.setup,
        objective: firstSentences(removeSystemObjectivePhrase(activity.objective), 2, 220),
        rules: filterMeaningfulRules(activity.rules),
        scoring: summarizeScoring(activity.constraints),
        constraints: summarizeConstraints(activity.constraints),
        coachingPoints: coachPointsFromFocus(activity.coachingFocus),
        teams: simplifyTeams(activity.teams),
    }
}
