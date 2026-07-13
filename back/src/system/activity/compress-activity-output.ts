/**
 * Phase 4A — Output Translation & Compression.
 *
 * Christian's directive after the Phase 3.5 test cycle: the ecology now works underneath,
 * but the coach-facing output over-explains itself. The bottleneck has shifted from
 * ecological architecture to sideline usability.
 *
 * This pass runs AFTER the activity has been validated (validateGeneratedActivities) and
 * BEFORE the activity is returned to the frontend. It does five things, none of which
 * change what the activity IS — only what the coach sees:
 *
 *   1. Strip the guardrail closing line ("If the live opportunity is forced after it
 *      closes, the opponent inherits the connected advantage immediately.") from scoring
 *      and rules. It already appears in winCondition and surfacing it three times is the
 *      redundancy Christian named.
 *
 *   2. Strip "Players read / Players decide / Players choose" narration from scoring and
 *      rules. These belong in coachingFocus (where they appear naturally as observation
 *      cues). The validator-required decision STEMS (choose / read / react / based on /
 *      decide / adapt / option) survive in their original rule and scoring positions
 *      naturally; only the meta-narration "Players read X before Y" gets dropped.
 *
 *   3. Cross-field semantic dedup. Nonessential rules that overlap heavily with
 *      winCondition are removed, and scoring sentences that overlap heavily with
 *      winCondition or rules are removed from scoring (the longer field).
 *      Token-Jaccard threshold > 0.6 counts as overlap.
 *
 *   4. Cap section length:
 *        - rules: 5 entries max
 *        - scoringSystem: 4 sentences max
 *        - scaffolding (coachingFocus): 3 entries max
 *      Cap selection is by distinctiveness, with hard must-keep predicates for
 *      rules[0] (the explicit exchange rule) and any line carrying slot-modifier text
 *      (Phase 3.5 value-landscape modifiers must survive the cap).
 *
 *   5. Idempotent. compress(compress(x, m), m) deep-equals compress(x, m).
 *
 * The Phase 3.5 modifier preservation requirement is non-negotiable. If a slot's
 * value-landscape modifier text would be dropped by the cap, it gets prioritized in over
 * higher-distinctiveness shared text — because the modifier IS what differentiates this
 * slot from its siblings, and that's the entire point of Phase 3.5.
 *
 * Christian's "go ruthless" cap settings are deliberately aggressive on the first cut.
 * If the next test cycle shows compression has clipped meaning, the caps relax. We
 * don't widen them speculatively.
 */

import type { IActivity } from '../../models/activity.model'

const RULES_CAP = 5
const SCORING_SENTENCE_CAP = 4
const COACHING_FOCUS_CAP = 3
const SEMANTIC_OVERLAP_THRESHOLD = 0.6

/**
 * The guardrail closing line gets surfaced from assemblyGuardrails.opponentConsequence
 * and appears verbatim (or near-verbatim) in scoring text. The exact wording varies a
 * little across archetypes, so we match by the distinctive opening pattern.
 */
const GUARDRAIL_CLOSE_PATTERN = /\bIf the live opportunity is forced after it closes[^.]*\.\s*/gi

/**
 * Player-narration patterns. These are the meta-pedagogy explanations that should live
 * in coachingFocus only — not in rules and scoring. Match "Players read/decide/choose X"
 * up to the next sentence terminator.
 */
const PLAYER_NARRATION_PATTERNS: RegExp[] = [
    /\bPlayers read [^.]*\.\s*/gi,
    /\bPlayers decide [^.]*\.\s*/gi,
    /\bPlayers choose [^.]*\.\s*/gi,
]

const STOPWORDS = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'with', 'as', 'is', 'are',
    'was', 'were', 'be', 'been', 'being', 'of', 'by', 'from', 'into', 'this', 'that', 'these',
    'those', 'it', 'its', 'their', 'they', 'them', 'when', 'where', 'while', 'than', 'then', 'if',
    'so', 'only', 'also', 'such', 'each', 'every', 'any', 'all', 'some', 'no', 'not', 'do', 'does',
    'did', 'has', 'have', 'had', 'can', 'may', 'will', 'would', 'should', 'must',
])

function tokenize(text: string): Set<string> {
    return new Set(
        (text || '')
            .toLowerCase()
            .replace(/[^a-z0-9 \-']/g, ' ')
            .split(/\s+/)
            .filter((t) => t.length > 2 && !STOPWORDS.has(t))
    )
}

function jaccardOverlap(a: Set<string>, b: Set<string>): number {
    if (a.size === 0 || b.size === 0) return 0
    let intersection = 0
    for (const t of a) if (b.has(t)) intersection += 1
    const union = a.size + b.size - intersection
    return union === 0 ? 0 : intersection / union
}

/**
 * Sentence splitter that handles em-dashes and inline clauses. Returns sentences with
 * trailing punctuation preserved (so the recombined text reads as natural prose).
 */
export function splitSentences(text: string): string[] {
    if (!text) return []
    // Split on sentence terminators followed by whitespace, keeping the terminator.
    const parts = text
        .replace(/\s+/g, ' ')
        .trim()
        .split(/(?<=[.!?])\s+(?=[A-Z])/)
        .map((s) => s.trim())
        .filter(Boolean)
    return parts
}

/**
 * Distinctiveness ranking: each line is scored by the inverse of its average Jaccard
 * overlap against every other line in the candidate set. Higher score = more distinctive.
 * Tie-break by shorter length (we want compression).
 */
function rankByDistinctiveness(lines: string[]): string[] {
    const tokens = lines.map(tokenize)
    const scored = lines.map((line, i) => {
        let overlapSum = 0
        let count = 0
        for (let j = 0; j < lines.length; j++) {
            if (i === j) continue
            overlapSum += jaccardOverlap(tokens[i], tokens[j])
            count += 1
        }
        const avgOverlap = count === 0 ? 0 : overlapSum / count
        const distinctiveness = 1 - avgOverlap
        return { line, distinctiveness, length: line.length }
    })
    scored.sort((a, b) => {
        if (b.distinctiveness !== a.distinctiveness) return b.distinctiveness - a.distinctiveness
        return a.length - b.length
    })
    return scored.map((s) => s.line)
}

/**
 * Given a list of items and a cap, select up to `cap` items: all must-keep items are
 * preserved (even if it exceeds cap — Phase 3.5 modifier preservation is non-negotiable),
 * remaining slots are filled from the most-distinctive candidates.
 *
 * Returns items in their ORIGINAL input order (not selection-order). This is required for
 * idempotency: compress(compress(x)) === compress(x). Reordering by selection rank means
 * a second pass would reshuffle the surviving lines, breaking the idempotency invariant
 * and making the output non-deterministic across re-renders.
 */
function capByDistinctiveness<T>(
    items: T[],
    isMustKeep: (item: T) => boolean,
    cap: number,
    toRankString: (item: T) => string
): T[] {
    const mustKeepSet = new Set<T>()
    const candidates: T[] = []
    for (const item of items) {
        if (isMustKeep(item)) mustKeepSet.add(item)
        else candidates.push(item)
    }
    const remainingSlots = Math.max(0, cap - mustKeepSet.size)
    const rankedCandidateStrings = rankByDistinctiveness(candidates.map(toRankString))
    const stringToItem = new Map<string, T>()
    for (const item of candidates) stringToItem.set(toRankString(item), item)
    const selectedCandidateSet = new Set<T>()
    let slotsUsed = 0
    for (const s of rankedCandidateStrings) {
        if (slotsUsed >= remainingSlots) break
        const found = stringToItem.get(s)
        if (found !== undefined && !selectedCandidateSet.has(found)) {
            selectedCandidateSet.add(found)
            slotsUsed += 1
        }
    }
    return items.filter((item) => mustKeepSet.has(item) || selectedCandidateSet.has(item))
}

/**
 * Does a line contain (in token-overlap terms) text from any of the modifier
 * mechanicLines? Used to make Phase 3.5 modifier lines must-keep across the cap.
 */
function containsModifierText(line: string, modifierMechanicLines: string[]): boolean {
    if (modifierMechanicLines.length === 0) return false
    const lineTokens = tokenize(line)
    for (const mod of modifierMechanicLines) {
        const modTokens = tokenize(mod)
        if (modTokens.size === 0) continue
        // Use containment rather than Jaccard — a sentence "carries" the modifier if it
        // shares most of the modifier's distinctive tokens, even if the sentence is
        // longer or shorter than the modifier itself.
        let hits = 0
        for (const t of modTokens) if (lineTokens.has(t)) hits += 1
        const containmentRatio = hits / modTokens.size
        if (containmentRatio >= 0.55) return true
    }
    return false
}

/**
 * Strip the guardrail closing line and player-narration patterns from a freeform text
 * field. Returns the cleaned text. Repeated whitespace from removed segments is
 * collapsed.
 *
 * Post-strip cleanup: when a stripped clause sat between two clauses joined by an
 * em-dash (e.g. "advantage — Players decide to X. Y starts here"), removing the middle
 * leaves a dangling " — " connecting two independent clauses ("advantage — Y"). That
 * reads bizarrely. We promote those dangling em-dash boundaries back to proper sentence
 * breaks when the following clause clearly starts an independent scoring/rule sentence
 * (whitelist of safe sentence-start patterns).
 */
function stripScaffoldingNarration(text: string): string {
    if (!text) return ''
    let next = text
    next = next.replace(GUARDRAIL_CLOSE_PATTERN, ' ')
    for (const pat of PLAYER_NARRATION_PATTERNS) {
        next = next.replace(pat, ' ')
    }
    next = next.replace(/\s+/g, ' ').trim()
    // Promote dangling em-dash connectors left behind by stripping a middle clause.
    // Safe-to-promote patterns: clauses that virtually always start an independent
    // scoring or rule sentence after a strip.
    const DANGLING_EM_DASH_PROMOTERS = [
        /\s+—\s+(?=Score awarded\b)/gi,
        /\s+—\s+(?=A point counts\b)/gi,
        /\s+—\s+(?=A point or live advantage counts\b)/gi,
        /\s+—\s+(?=A goal\b)/gi,
        /\s+—\s+(?=A bonus\b)/gi,
        /\s+—\s+(?=Possession kept\b)/gi,
        /\s+—\s+(?=Scoring (tied|awarded|completes)\b)/gi,
        /\s+—\s+(?=Defenders score\b)/gi,
        /\s+—\s+(?=The field is treated\b)/gi,
        /\s+—\s+(?=The working area\b)/gi,
        /\s+—\s+(?=The decision window\b)/gi,
        /\s+—\s+(?=On possession change\b)/gi,
    ]
    for (const re of DANGLING_EM_DASH_PROMOTERS) {
        next = next.replace(re, '. ')
    }
    return next
}

/**
 * Same strips applied to an array of rule entries. Empty / whitespace-only entries are
 * dropped since the validator will have already accepted the bundle by this point.
 */
function stripScaffoldingNarrationFromArray(lines: string[]): string[] {
    return lines
        .map((line) => stripScaffoldingNarration(line))
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
}

/**
 * Does `text` share enough distinctive tokens with any candidate line/sentence to
 * count as repeated environmental truth?
 */
function overlapsAnyCandidate(text: string, candidates: string[]): boolean {
    const textTokens = tokenize(text)
    if (textTokens.size === 0) return false
    return candidates.some((candidate) => {
        const candidateTokens = tokenize(candidate)
        return candidateTokens.size > 0 && jaccardOverlap(textTokens, candidateTokens) >= SEMANTIC_OVERLAP_THRESHOLD
    })
}

/**
 * Remove sentences from `text` whose Jaccard token-overlap with any candidate exceeds
 * SEMANTIC_OVERLAP_THRESHOLD. Used to dedupe scoring against winCondition and rules.
 */
function removeSentencesOverlappingWithCandidates(
    text: string,
    candidates: string[],
    modifierMechanicLines: string[]
): string {
    if (!text || candidates.length === 0) return text
    const sentences = splitSentences(text)
    const kept = sentences.filter((s) => {
        if (containsModifierText(s, modifierMechanicLines)) return true
        return !overlapsAnyCandidate(s, candidates)
    })
    return kept.join(' ').trim()
}

function removeLinesOverlappingWithCandidates(
    lines: string[],
    candidates: string[],
    modifierMechanicLines: string[],
    isMustKeep: (line: string) => boolean
): string[] {
    if (candidates.length === 0) return lines
    return lines.filter((line) => {
        if (isMustKeep(line) || containsModifierText(line, modifierMechanicLines)) return true
        return !overlapsAnyCandidate(line, candidates)
    })
}

/**
 * CCS Sec.5 (Round 8D.3 follow-up): translate engine/internal jargon that leaks into coach-facing text
 * into plain coaching language. Christian flagged "decision window", "connected advantage", and "player
 * structure logic" surfacing in outputs. Applied as the FINAL coach-facing pass so the compression /
 * dedup logic above still matches on the original phrasing.
 */
const COACH_LANGUAGE_TRANSLATIONS: Array<[RegExp, string]> = [
    [/\bplayer structure logic:\s*/gi, ''],
    [/\bconnected advantage\b/gi, 'advantage'],
    [/\bdecision window\b/gi, 'window'],
    [/\bopportunity window\b/gi, 'window'],
    [/\bremains live\b/gi, 'stays live'],
    [/\bremain live\b/gi, 'stay live'],
    [/\bdisrupts structure\b/gi, 'disrupts the shape'],
]
/**
 * Decision-verb stutter collapse (Round 9). Upstream rewrites ("players must decide" → "players
 * decide") composed with AI phrasing ("must decide to choose…") produce stutters like "players
 * decide to decide" / "players decide to choose". This is a CATEGORY rule — any chained pair of
 * decision verbs collapses to the second, more specific verb — not a phrase-by-phrase list.
 */
const DECISION_VERBS = '(?:decide|decides|choose|chooses|select|selects)'
const DECISION_STUTTER = new RegExp(`\\b(${DECISION_VERBS})\\s+to\\s+(${DECISION_VERBS})\\b`, 'gi')

function collapseDecisionStutter(value: string): string {
    // "decide to decide when…" → "decide when…"; "decide to choose when…" → "choose when…".
    return value.replace(DECISION_STUTTER, (_m, _a: string, b: string) => b)
}

function translateCoachLanguage(value: string): string {
    let out = String(value ?? '')
    for (const [re, rep] of COACH_LANGUAGE_TRANSLATIONS) out = out.replace(re, rep)
    out = collapseDecisionStutter(out)
    return out
        .replace(/\s{2,}/g, ' ')
        .replace(/\s+([.,;])/g, '$1')
        .trim()
}

/**
 * Compress the activity for coach-facing output. The mechanics that validate the
 * activity must already have been confirmed present (call validateGeneratedActivities
 * BEFORE this). Compression does not re-validate; it presents.
 *
 * @param activity                The activity returned by the assembly pipeline.
 * @param modifierMechanicLines   The mechanicLine text of any Phase 3.5 slot modifiers
 *                                that apply to this activity (from the skeleton bundle's
 *                                slotMechanicalVariations for this slot). Pass [] for
 *                                a baseline slot (applying slot 1).
 */
export function compressActivityForCoach(activity: IActivity, modifierMechanicLines: string[] = []): IActivity {
    // Step 1: strip the guardrail closing line and player-narration patterns from scoring
    // and rules. winCondition retains the closing-line semantics because the template
    // already includes "The opponent inherits the connected advantage on every misread or
    // forced action under pressure" — same meaning, different wording, more compact.
    const strippedScoring = stripScaffoldingNarration(activity.scoringSystem ?? '')
    const strippedRules = stripScaffoldingNarrationFromArray(activity.rules ?? [])

    // Step 2: cross-field dedup. Win condition is the terminal statement, so repeated
    // nonessential rules defer to it; scoring then defers to win condition and rules.
    // Modifier text is protected throughout.
    const winConditionSentences = splitSentences(activity.winCondition ?? '')
    const exchangeRule = strippedRules[0]
    const dedupedRules = removeLinesOverlappingWithCandidates(
        strippedRules,
        winConditionSentences,
        modifierMechanicLines,
        (line) => line === exchangeRule
    )
    const dedupedScoringAgainstWin = removeSentencesOverlappingWithCandidates(
        strippedScoring,
        winConditionSentences,
        modifierMechanicLines
    )
    const dedupedScoring = removeSentencesOverlappingWithCandidates(
        dedupedScoringAgainstWin,
        dedupedRules,
        modifierMechanicLines
    )

    // Step 3: cap rules. rules[0] is the explicit exchange rule (validator requires it
    // there) — must-keep. Any rule that carries Phase 3.5 modifier text — must-keep.
    // capByDistinctiveness preserves input order, so rules[0] stays at index 0.
    const cappedRules = capByDistinctiveness(
        dedupedRules,
        (line) => line === exchangeRule || containsModifierText(line, modifierMechanicLines),
        RULES_CAP,
        (line) => line
    )

    // Step 4: cap scoring sentences. First sentence (consequence rule) must-keep. Any
    // sentence carrying modifier text — must-keep. Input sentence order preserved.
    const scoringSentences = splitSentences(dedupedScoring)
    const firstScoringSentence = scoringSentences[0]
    const cappedScoringSentences = capByDistinctiveness(
        scoringSentences,
        (s) => s === firstScoringSentence || containsModifierText(s, modifierMechanicLines),
        SCORING_SENTENCE_CAP,
        (s) => s
    )
    const finalScoring = cappedScoringSentences.join(' ').trim()

    // Step 5: cap scaffolding (coachingFocus) to 3 entries. No modifier-preservation
    // need here — coachingFocus doesn't carry modifier text; that lives in rules/scoring.
    const cappedScaffolding = (activity.scaffolding ?? []).slice(0, COACHING_FOCUS_CAP)

    // Step 6 (CCS Sec.5): final coach-language translation — strip engine jargon from coach-facing text.
    return {
        ...activity,
        title: translateCoachLanguage(activity.title),
        setup: typeof activity.setup === 'string' ? translateCoachLanguage(activity.setup) : activity.setup,
        rules: cappedRules.map(translateCoachLanguage),
        scoringSystem: translateCoachLanguage(finalScoring),
        winCondition: typeof activity.winCondition === 'string' ? translateCoachLanguage(activity.winCondition) : activity.winCondition,
        scaffolding: cappedScaffolding.map((s) => (typeof s === 'string' ? translateCoachLanguage(s) : s)),
    }
}

/**
 * Apply compression to every activity in an assembly result, using the corresponding
 * slot's modifier mechanicLines from the skeleton bundle.
 */
export function compressActivitiesForCoach<T extends IActivity>(
    activities: T[],
    perSlotModifierLines: string[][]
): T[] {
    if (perSlotModifierLines.length === 0) {
        return activities.map((a) => compressActivityForCoach(a, []) as T)
    }
    return activities.map((a, i) => {
        const mods = perSlotModifierLines[i] ?? []
        return compressActivityForCoach(a, mods) as T
    })
}
