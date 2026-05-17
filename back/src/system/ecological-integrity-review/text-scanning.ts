/**
 * Shared pattern-detection helpers for the Ecological Integrity Review Layer.
 *
 * Detection here is deterministic: each helper scans for a defined set of phrase or regex
 * markers and returns what it found. Interpretation of those findings happens in the
 * category analyzers (which decide whether a finding goes into preserved/removed/tradeoffs/
 * drift-risks) and in language-templates.ts (which wraps interpretive sentences in
 * probabilistic verbs).
 *
 * No helper here renders a finding string. They report observations only.
 */

import type { ReviewableActivity } from './types'

// ─── Phrase / pattern dictionaries ──────────────────────────────────────────

export const PRESCRIPTIVE_PHRASES = [
    'must pass',
    'must dribble',
    'must shoot',
    'only use',
    'required to',
    'every player must',
    'must always',
    'always pass',
    'always dribble',
    'one-touch only',
    'two-touch only',
    'three-touch only',
    'players must',
    'required sequence',
    'repeat this pattern',
    'perform this technique',
] as const

export const EXACT_COUNT_REGEX = /\b(?:exactly|only|minimum|maximum)\s+\d+\s+(?:pass|passes|touch|touches|seconds?)\b/gi

export const SEQUENCE_REGEX = /\b(?:after every|before scoring|immediately after every|first .* then|sequence of)\b/i

export const DECISION_STEMS = ['choose', 'decide', 'read', 'react', 'adapt', 'option', 'whether', 'based on', 'when to'] as const

export const MULTI_OPTION_MARKERS = [
    'choose between',
    'decide whether',
    'option to',
    'either',
    'depending on',
    'based on the picture',
    'based on the live',
    ', or ',
    ' or recycle',
    ' or hold',
    ' or switch',
    ' or attack',
] as const

export const ENVIRONMENTAL_MARKERS = [
    'zone',
    'channel',
    'lane',
    'area',
    'field',
    'pitch',
    'width',
    'depth',
    'space',
    'time window',
    'numerical',
    'overload',
    'underload',
] as const

export const OPPOSITION_MARKERS = [
    'opponent',
    'opponents',
    'defenders',
    'defender',
    'defending team',
    'live opposition',
    'live pressure',
    'pressure',
    'press',
    'pressing',
    'contest',
    'contested',
    'counter',
    'counter-attack',
    'counterattack',
    'regain',
    'turnover',
] as const

export const PASSIVE_DEFENDER_MARKERS = [
    'unopposed',
    'without defenders',
    'no defender',
    'no opposition',
    'coach serves',
    'take turns',
    'one at a time',
    'line up',
    'shadow defence',
    'passive defenders',
    'walking defenders',
] as const

export const CONSEQUENCE_MARKERS = [
    'point',
    'points',
    'score',
    'scoring',
    'goal',
    'goals',
    'restart',
    'bonus',
    'penalty',
    'reward',
    'win condition',
    'turnover',
    'advantage',
    'continuation',
] as const

export const COMPLIANCE_MARKERS = [
    'pattern',
    'repetition',
    'repeat',
    'memorize',
    'memorized',
    'rehearse',
    'rehearsed',
    'technique drill',
    'technical drill',
    'line up',
    'back in line',
] as const

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Lowercase, normalize whitespace. Does NOT remove punctuation — many of our
 * detection patterns depend on it.
 */
export function normalize(text: string): string {
    return text.toLowerCase().replace(/\s+/g, ' ').trim()
}

/** Detect each phrase from the list that appears as a substring of the text (case-insensitive). */
export function detectPhrases(text: string, phrases: readonly string[]): string[] {
    const lower = normalize(text)
    const hits: string[] = []
    for (const p of phrases) {
        if (lower.includes(p.toLowerCase())) hits.push(p)
    }
    return Array.from(new Set(hits))
}

/** Count whole-word occurrences of each stem from the list. Returns an array of matched stems with counts. */
export function countWordStems(text: string, stems: readonly string[]): Array<{ stem: string; count: number }> {
    const out: Array<{ stem: string; count: number }> = []
    for (const stem of stems) {
        const re = new RegExp(`\\b${escapeRegex(stem)}\\b`, 'gi')
        const matches = text.match(re)
        if (matches && matches.length > 0) out.push({ stem, count: matches.length })
    }
    return out
}

/** Find all matches of a regex in text and return them (or empty array). */
export function findAllMatches(text: string, re: RegExp): string[] {
    const matches = text.match(re)
    return matches ? Array.from(new Set(matches.map((m) => m.trim()))) : []
}

/** Total count of distinct decision-stem occurrences across the supplied text. */
export function decisionStemCount(text: string): number {
    return countWordStems(text, DECISION_STEMS).reduce((sum, e) => sum + e.count, 0)
}

/** Join the coach-facing fields of an activity into a single text bundle for scanning. */
export function joinActivityText(activity: ReviewableActivity): string {
    return [
        activity.setup ?? '',
        activity.teams ?? '',
        activity.objective ?? '',
        activity.rules.join(' '),
        activity.scoring ?? '',
        (activity.constraints ?? []).join(' '),
        (activity.coachingFocus ?? []).join(' '),
        activity.winCondition ?? '',
    ]
        .filter(Boolean)
        .join('\n')
}

/** Helper to quote a short snippet from text for use in factual finding sentences. */
export function clipSnippet(text: string, maxLen = 120): string {
    const cleaned = text.trim().replace(/\s+/g, ' ')
    if (cleaned.length <= maxLen) return cleaned
    return `${cleaned.slice(0, maxLen - 1).trim()}…`
}

function escapeRegex(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
