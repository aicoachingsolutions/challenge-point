const STOP_WORDS = new Set([
    'a',
    'an',
    'and',
    'are',
    'as',
    'at',
    'be',
    'by',
    'for',
    'from',
    'how',
    'in',
    'into',
    'is',
    'it',
    'of',
    'on',
    'or',
    'that',
    'the',
    'their',
    'this',
    'to',
    'with',
    'your',
])

export function normalizeText(value?: string | null): string {
    return String(value ?? '')
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
}

export function tokenize(value?: string | null): string[] {
    return normalizeText(value)
        .split(' ')
        .map((token) => token.trim())
        .filter((token) => token.length > 2 && !STOP_WORDS.has(token))
}

export function uniqueTokens(values: Array<string | null | undefined>): string[] {
    return Array.from(new Set(values.flatMap((value) => tokenize(value))))
}

export function includesNormalizedPhrase(haystack: string, needle: string): boolean {
    const normalizedNeedle = normalizeText(needle)
    if (!normalizedNeedle) {
        return false
    }

    return normalizeText(haystack).includes(normalizedNeedle)
}

export function scoreKeywordMatches(haystack: string, keywords: string[], weight = 1): number {
    return keywords.reduce((score, keyword) => {
        return score + (includesNormalizedPhrase(haystack, keyword) ? weight : 0)
    }, 0)
}

export function countPatternHits(haystack: string, patterns: string[]): number {
    return patterns.reduce((count, pattern) => count + (includesNormalizedPhrase(haystack, pattern) ? 1 : 0), 0)
}

export function overlapScore(left: string[], right: string[], weight = 1): number {
    const leftSet = new Set(left)
    return right.reduce((score, token) => score + (leftSet.has(token) ? weight : 0), 0)
}
