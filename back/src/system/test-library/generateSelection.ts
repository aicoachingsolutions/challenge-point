import type { InputConstraintHints } from '../input-constraints/deriveInputConstraints'
import { testLibraryRegistry } from './library/registry'
import { normalizeCoachingInput } from './normalizeCoachingInput'
import { isSelectionPackageCompatible } from './selection-compatibility'
import { SELECTION_SUITABILITY_WEIGHTS as W } from './selection-weights'
import type {
    ConstraintBalanceBucket,
    SelectionRankingEntry,
    SelectionReasonEntry,
    SelectionResolution,
    TestLibrarySelectionInput,
    TestLibrarySelectionResult,
    TestLibraryV0AffordanceLens,
    TestLibraryV0Archetype,
    TestLibraryV0Constraint,
} from './types'

function applyArchetypePoolFilter(hints?: InputConstraintHints | null): TestLibraryV0Archetype[] {
    const full = testLibraryRegistry.archetypes()
    const ids = hints?.candidateArchetypeIds
    if (!ids?.length) return full
    const filtered = full.filter((a) => ids.includes(a.game_form_id))
    return filtered.length > 0 ? filtered : full
}

function applyLensPoolFilter(hints?: InputConstraintHints | null): TestLibraryV0AffordanceLens[] {
    const full = testLibraryRegistry.affordanceLenses()
    const ids = hints?.candidateAffordanceLensIds
    if (!ids?.length) return full
    const filtered = full.filter((l) => ids.includes(l.id))
    return filtered.length >= 2 ? filtered : full
}

function constraintPoolSupportsFoundationAndShaping(rows: TestLibraryV0Constraint[]): boolean {
    const buckets = new Set(rows.map((c) => constraintBalanceBucket(c)))
    return buckets.has('foundation') && buckets.has('shaping')
}

function applyConstraintPoolFilter(hints?: InputConstraintHints | null): TestLibraryV0Constraint[] {
    const full = testLibraryRegistry.selectableConstraints()
    const ids = hints?.candidateConstraintIds
    if (!ids?.length) return full
    const filtered = full.filter((c) => ids.includes(c.id))
    if (filtered.length < 2) return full
    // Role-mix rules require foundation + shaping candidates in the pool; hint-only pools (e.g. regain-only)
    // may omit shaping — fall back rather than making selection impossible.
    if (!constraintPoolSupportsFoundationAndShaping(filtered)) return full
    return filtered
}

/** Exact normalized coach phrases that must fail before any scoring (no AI classification). */
const BLOCKED_SINGLE_GOAL_PHRASES = [
    'create a warm-up.',
    'improve fitness.',
    'make a fun activity.',
    'teach better technique.',
] as const

function normalizeGoalPhrase(g: string): string {
    return g.trim().toLowerCase().replace(/\s+/g, ' ')
}

/**
 * Rejects out-of-scope session intents so assembly / AI is never reached for these inputs.
 */
function assertCoachGoalsAllowedForTestLibrary(input: TestLibrarySelectionInput): void {
    for (const g of input.learningGoals || []) {
        const n = normalizeGoalPhrase(g)
        for (const blocked of BLOCKED_SINGLE_GOAL_PHRASES) {
            if (n === blocked) {
                throw new Error(
                    'Selection blocked: coach intent is out of scope for Test Library V0 tactical selection (warm-up, fitness-only, generic fun, or technique-only requests are not supported).'
                )
            }
        }
    }
}

function buildQueryCorpus(input: TestLibrarySelectionInput): string {
    const parts = [
        ...(input.learningGoals || []),
        input.sport || '',
        input.sessionDescription || '',
        input.challengeLevel || '',
    ]
    return parts.join(' ').trim()
}

function tokenize(corpus: string): string[] {
    return corpus
        .toLowerCase()
        .split(/[^a-z0-9_]+/)
        .map((t) => t.trim())
        .filter((t) => t.length >= 2)
}

function uniqueTokens(tokens: string[]): string[] {
    return Array.from(new Set(tokens))
}

/** Reduces noise from generic tokens in naive substring scoring */
const STOPWORDS = new Set([
    'a',
    'an',
    'and',
    'are',
    'as',
    'at',
    'be',
    'but',
    'by',
    'for',
    'from',
    'in',
    'into',
    'is',
    'it',
    'of',
    'on',
    'or',
    'the',
    'to',
    'with',
    'without',
])

/**
 * Soccer-specific token equivalences. The selection engine's literal substring matcher was failing
 * for natural coach vocabulary that doesn't appear verbatim in library text — "pressure" did not
 * match "pressing", "penetrating" did not match "penetration", "passes" did not match "passing",
 * etc. This caused queries like "midfielders breaking through pressure" or "penetrating passes"
 * to score zero hits against the actually-relevant archetypes, falling back to GF1 (End Zone)
 * by alphabetic tie-break. Each row below maps a coach-language form to a canonical root that
 * both the query token and any library word will normalize to.
 */
const SOCCER_TOKEN_EQUIVALENCES: Record<string, string> = {
    pressing: 'press',
    pressure: 'press',
    pressed: 'press',
    presses: 'press',
    penetrating: 'penetrate',
    penetration: 'penetrate',
    penetrated: 'penetrate',
    penetrates: 'penetrate',
    passing: 'pass',
    passes: 'pass',
    passed: 'pass',
    breaking: 'break',
    breaks: 'break',
    broken: 'break',
    dribbling: 'dribble',
    dribbles: 'dribble',
    dribbled: 'dribble',
    midfielder: 'midfield',
    midfielders: 'midfield',
    defender: 'defense',
    defenders: 'defense',
    defending: 'defense',
    defensive: 'defense',
    attacker: 'attack',
    attackers: 'attack',
    attacking: 'attack',
    finishing: 'finish',
    finishes: 'finish',
    finished: 'finish',
    transitioning: 'transition',
    transitions: 'transition',
    regaining: 'regain',
    regains: 'regain',
    regained: 'regain',
    scoring: 'score',
    scored: 'score',
    scores: 'score',
    receiving: 'receive',
    received: 'receive',
    receives: 'receive',
    creating: 'create',
    creates: 'create',
    created: 'create',
    exploiting: 'exploit',
    exploits: 'exploit',
    exploited: 'exploit',
}

/**
 * Normalize a single token for matching. Applies soccer equivalences first (longest-match wins),
 * then falls back to light suffix stripping for words of length >= 5. Returns lowercase root.
 */
function normalizeMatchToken(token: string): string {
    const t = token.toLowerCase()
    if (SOCCER_TOKEN_EQUIVALENCES[t]) return SOCCER_TOKEN_EQUIVALENCES[t]
    if (t.length >= 5) {
        if (t.endsWith('ing')) return t.slice(0, -3)
        if (t.endsWith('ies')) return `${t.slice(0, -3)}y`
        if (t.endsWith('ed')) return t.slice(0, -2)
        if (t.endsWith('s') && !t.endsWith('ss')) return t.slice(0, -1)
    }
    return t
}

function textWordSet(text: string): Set<string> {
    return new Set(
        text
            .toLowerCase()
            .split(/[^a-z0-9_]+/)
            .filter((w) => w.length >= 2)
            .map(normalizeMatchToken)
    )
}

/**
 * Word-level matching with normalization. Each query token is normalized via SOCCER_TOKEN_EQUIVALENCES
 * + light suffix stripping; the text is tokenized into words and normalized the same way; a token
 * matches if its normalized form is in the text's normalized word set. This is symmetric — both
 * the query and the searched text go through the same normalization — so "pressing" in the query
 * matches "press" or "pressure" in text, and vice versa.
 */
function matchReasons(tokens: string[], text: string): string[] {
    const textWords = textWordSet(text)
    const reasons: string[] = []
    for (const tok of tokens) {
        if (tok.length < 2) continue
        if (textWords.has(normalizeMatchToken(tok))) {
            reasons.push(`token:${tok}`)
        }
    }
    return reasons
}

function scoreAgainstFields(tokens: string[], fields: string[]): { score: number; reasons: string[] } {
    const text = fields.join(' │ ')
    const reasons = matchReasons(tokens, text)
    return { score: reasons.length, reasons }
}

function categoryToSlug(category: string): string {
    return category
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_]/g, '')
}

function archetypeAffordanceSlugs(a: TestLibraryV0Archetype): Set<string> {
    return new Set([...a.primaryAffordances, ...a.secondaryAffordances].filter(Boolean))
}

function lensSlug(l: TestLibraryV0AffordanceLens): string {
    return categoryToSlug(l.category)
}

export function constraintBalanceBucket(c: TestLibraryV0Constraint): ConstraintBalanceBucket {
    const role = (c.constraintRole || '').toLowerCase()
    if (role === 'structure') return 'foundation'
    if (role === 'hybrid') return 'shaping'
    return 'consequence'
}

function phaseMatchesAnchor(phaseOfPlay: string, anchor: string): boolean {
    const normPhase = phaseOfPlay.toLowerCase().replace(/[^a-z0-9]+/g, '')
    const normAnchor = anchor.toLowerCase().replace(/_/g, '')
    return normPhase.includes(normAnchor)
}

/** k-combinations without repetition; order within a combination is not significant */
function combinations<T>(items: T[], k: number): T[][] {
    if (k < 0 || k > items.length) return []
    const out: T[][] = []
    const path: T[] = []
    function dfs(start: number) {
        if (path.length === k) {
            out.push([...path])
            return
        }
        for (let i = start; i < items.length; i++) {
            path.push(items[i])
            dfs(i + 1)
            path.pop()
        }
    }
    dfs(0)
    return out
}

function sortedIdsJoin(ids: string[]): string {
    return [...ids].sort().join(',')
}

type LensScored = { lens: TestLibraryV0AffordanceLens; score: number; reasons: string[] }

type ConScored = {
    c: TestLibraryV0Constraint
    score: number
    reasons: string[]
    bucket: ConstraintBalanceBucket
}

function scoreAllLenses(
    tokens: string[],
    archetype: TestLibraryV0Archetype,
    archeAffordances: Set<string>
): LensScored[] {
    const lensScored: LensScored[] = []
    for (const lens of testLibraryRegistry.affordanceLenses()) {
        const fields = [
            lens.title,
            lens.description,
            lens.category,
            lens.designIntent,
            lens.notes,
            ...(lens.coachVocabulary ?? []),
        ]
        const base = scoreAgainstFields(tokens, fields)
        let score = base.score
        const reasons = [...base.reasons]
        const slug = lensSlug(lens)
        if (archeAffordances.has(slug)) {
            score += W.lensArchetypeAffordanceMatch
            reasons.push(`archetypeAffordanceMatch:${slug}`)
        }
        for (const anchor of lens.gameTemplateAnchor) {
            if (phaseMatchesAnchor(archetype.phase_of_play, anchor)) {
                score += W.lensPhaseGameTemplateAnchor
                reasons.push(`phaseGameTemplateAnchor:${anchor}`)
            }
        }
        lensScored.push({ lens, score, reasons })
    }
    return lensScored
}

/**
 * Round 8C lens-coupling fix: when the goal expresses information intent (parser Group K), the
 * information-shaping constraints get this bonus so they surface on INTENT rather than via
 * lens-alignment — they no longer use lens-aligned targets (their targetAffordancePrimary is
 * "perception"), so without this they would never appear, and with the old affordance targets they
 * over-appeared for any space/possession goal.
 */
const INFORMATION_INTENT_BONUS = W.constraintInformationIntentMatch

function scoreConstraintsForLensSlugs(
    tokens: string[],
    archetype: TestLibraryV0Archetype,
    archeAffordances: Set<string>,
    selectedLensSlugs: Set<string>,
    informationIntent = false
): ConScored[] {
    const conScored: ConScored[] = []
    for (const c of testLibraryRegistry.selectableConstraints()) {
        const fields = [
            c.title,
            c.description,
            c.category,
            c.designIntent,
            c.notes,
            c.targetAffordancePrimary,
            c.constraintRole,
            c.primaryConstraintType,
            ...(c.coachVocabulary ?? []),
        ]
        const base = scoreAgainstFields(tokens, fields)
        let score = base.score
        const reasons = [...base.reasons]
        const tgt = c.targetAffordancePrimary
        if (selectedLensSlugs.has(tgt)) {
            score += W.constraintTargetMatchesSelectedLens
            reasons.push(`targetMatchesSelectedLens:${tgt}`)
        }
        if (archeAffordances.has(tgt)) {
            score += W.constraintTargetMatchesArchetypeAffordance
            reasons.push(`targetMatchesArchetypeAffordance:${tgt}`)
        }
        for (const rct of archetype.recommended_constraint_types) {
            if (c.constraintArchetype && rct.toLowerCase() === c.constraintArchetype.toLowerCase()) {
                score += W.constraintArchetypeRecommendedType
                reasons.push(`archetypeRecommendedConstraintType:${rct}`)
                break
            }
        }
        if (informationIntent && (c.primaryConstraintType || '').toLowerCase() === 'information') {
            score += INFORMATION_INTENT_BONUS
            reasons.push('informationIntentMatch')
        }
        conScored.push({ c, score, reasons, bucket: constraintBalanceBucket(c) })
    }
    return conScored
}

function libraryHasBucket(bucket: ConstraintBalanceBucket): boolean {
    return testLibraryRegistry.selectableConstraints().some((c) => constraintBalanceBucket(c) === bucket)
}

/**
 * Preference when the library still carries that balance role.
 * Not a fallback — only adjusts objective among fully valid size-2..4 combos.
 */
function constraintBalanceBonus(combo: TestLibraryV0Constraint[]): number {
    const buckets = new Set(combo.map((c) => constraintBalanceBucket(c)))
    let bonus = 0
    if (libraryHasBucket('foundation') && buckets.has('foundation')) bonus += W.balanceFoundation
    if (libraryHasBucket('shaping') && buckets.has('shaping')) bonus += W.balanceShaping
    if (libraryHasBucket('consequence') && buckets.has('consequence')) bonus += W.balanceConsequence
    return bonus
}

/**
 * True when this constraint is a sensible fit for the current archetype + lenses
 * (used to decide if foundation/shaping must appear in the selection).
 */
function isCompatibleConstraint(row: ConScored): boolean {
    if (row.score > 0) return true
    return row.reasons.some(
        (x) =>
            x.startsWith('targetMatches') ||
            x.startsWith('archetypeAffordance') ||
            x.startsWith('archetypeRecommended')
    )
}

/**
 * Role-mix rules (no AI / Mongo):
 * - If a compatible foundation constraint exists for this context, pick ≥1 foundation.
 * - If a compatible shaping constraint exists for this context, pick ≥1 shaping.
 * - Consequence is optional but preferred (via bonus); not allowed to dominate when both
 *   foundation and shaping are compatible — at most (n−2) consequence slots so F+S can appear.
 * - Never return an all-consequence bundle when a compatible foundation or shaping exists.
 */
function constraintComboPassesRoleMix(combo: TestLibraryV0Constraint[], conScored: ConScored[]): boolean {
    const needFoundation = conScored.some(
        (r) => r.bucket === 'foundation' && isCompatibleConstraint(r)
    )
    const needShaping = conScored.some((r) => r.bucket === 'shaping' && isCompatibleConstraint(r))

    const buckets = combo.map((c) => constraintBalanceBucket(c))
    const hasFoundation = buckets.includes('foundation')
    const hasShaping = buckets.includes('shaping')
    const consequenceCount = buckets.filter((b) => b === 'consequence').length
    const n = combo.length

    if (needFoundation && !hasFoundation) return false
    if (needShaping && !hasShaping) return false

    if ((needFoundation || needShaping) && consequenceCount === n) return false

    if (needFoundation && needShaping && n >= 3) {
        if (consequenceCount > n - 2) return false
    }

    return true
}

function conScoredMap(conScored: ConScored[]): Map<string, ConScored> {
    const m = new Map<string, ConScored>()
    for (const row of conScored) {
        m.set(row.c.id, row)
    }
    return m
}

/**
 * Bounded-search caps. Phase 1 expanded the constraint library from 12 → 19 entries, which made the
 * naive exhaustive search (all lens combos × all constraint combos × isSelectionPackageCompatible
 * per combo) cost ~6× more compatibility checks. Each compat check runs buildConstraintPackage +
 * validateConstraintPackage (~10-20ms synchronous, blocks the event loop). Without bounding, a single
 * request can spend 30+ seconds in selection alone before the AI is even called, causing HTTP
 * timeouts and event-loop starvation under repeated load.
 *
 * These caps reduce worst-case compat checks from ~800k to ~200 while keeping the algorithm
 * mathematically identical inside the bounded space — we still find the global max within
 * the top-K candidate pool. K is set conservatively so the top-scoring candidates per dimension
 * are always represented.
 */
const BOUNDED_SEARCH_TOP_LENSES = 3
const BOUNDED_SEARCH_TOP_CONSTRAINTS_PER_BUCKET = 2

/**
 * Reduce the lens search pool to the top BOUNDED_SEARCH_TOP_LENSES by score, restricted to the
 * input-filtered pool. Tie-break by lens id (stable, deterministic).
 */
function boundedLensCandidates(
    lensScored: LensScored[],
    allowedPool: TestLibraryV0AffordanceLens[]
): TestLibraryV0AffordanceLens[] {
    const allowedIds = new Set(allowedPool.map((l) => l.id))
    return lensScored
        .filter((r) => allowedIds.has(r.lens.id))
        .sort((a, b) => b.score - a.score || a.lens.id.localeCompare(b.lens.id))
        .slice(0, BOUNDED_SEARCH_TOP_LENSES)
        .map((r) => r.lens)
}

/**
 * Reduce the constraint search pool to the top BOUNDED_SEARCH_TOP_CONSTRAINTS_PER_BUCKET per role
 * (foundation / shaping / consequence), restricted to the input-filtered pool. Per-bucket capping
 * guarantees the role-mix rule (need ≥1 foundation + ≥1 shaping) can still be satisfied by the
 * pool — taking only "top N overall" would risk dropping all foundation or shaping options when
 * consequence constraints score higher on a particular input.
 */
function boundedConstraintCandidates(
    conScored: ConScored[],
    allowedPool: TestLibraryV0Constraint[]
): TestLibraryV0Constraint[] {
    const allowedIds = new Set(allowedPool.map((c) => c.id))
    const filtered = conScored
        .filter((r) => allowedIds.has(r.c.id))
        .sort((a, b) => b.score - a.score || a.c.id.localeCompare(b.c.id))

    const byBucket: Record<ConstraintBalanceBucket, ConScored[]> = {
        foundation: [],
        shaping: [],
        consequence: [],
    }
    for (const row of filtered) {
        byBucket[row.bucket].push(row)
    }

    const out: TestLibraryV0Constraint[] = []
    const seen = new Set<string>()
    for (const bucket of ['foundation', 'shaping', 'consequence'] as const) {
        for (const r of byBucket[bucket].slice(0, BOUNDED_SEARCH_TOP_CONSTRAINTS_PER_BUCKET)) {
            if (!seen.has(r.c.id)) {
                seen.add(r.c.id)
                out.push(r.c)
            }
        }
    }
    return out
}

function assertSelectionContract(
    affordanceLenses: TestLibraryV0AffordanceLens[],
    constraints: TestLibraryV0Constraint[]
): void {
    const nl = affordanceLenses.length
    if (nl < 2 || nl > 3) {
        throw new Error(
            `Test Library selection contract violated: expected 2–3 affordance lenses, got ${nl}.`
        )
    }
    const nc = constraints.length
    if (nc < 2 || nc > 4) {
        throw new Error(`Test Library selection contract violated: expected 2–4 constraints, got ${nc}.`)
    }
}

/**
 * Classify how well the coach input resolved to an intent-aligned candidate pool, so a commitment
 * made from a generic/unnarrowed pool is explicit and traceable rather than silent (Batch 2 —
 * Deterministic Design Logic: traceability + defined failure state). Behavior-preserving: this
 * only labels the result; it does not change which package is selected.
 */
function computeResolution(inputConstraints?: InputConstraintHints | null): SelectionResolution {
    const signalGroups = (inputConstraints?.matchedSignals ?? []).filter((s) => s.startsWith('signalGroup:'))
    const specific = signalGroups.filter((s) => s !== 'signalGroup:Z_soccer_general')
    if (specific.length > 0) {
        return {
            status: 'matched',
            reason: `Coach intent resolved via signal group(s): ${specific.map((s) => s.replace('signalGroup:', '')).join(', ')}.`,
            matchedSignalGroups: signalGroups,
        }
    }
    if (signalGroups.includes('signalGroup:Z_soccer_general')) {
        return {
            status: 'fallback',
            reason: 'No specific signal group matched; committed the general soccer default package (Z_soccer_general). Coach intent was not specifically resolved — treat as reduced confidence.',
            matchedSignalGroups: signalGroups,
        }
    }
    return {
        status: 'unresolved',
        reason: inputConstraints
            ? 'No signal group matched the input; selection scored against the full unfiltered library. The Design Commitment is not traceable to resolved coach intent — treat as low confidence.'
            : 'Selection ran without input-constraint hints; no intent resolution was performed and the full library was searched. The Design Commitment is not traceable to resolved coach intent.',
        matchedSignalGroups: signalGroups,
    }
}

/**
 * Deterministic Test Library V0 selection (no AI, no Mongo).
 * Picks the highest-scoring valid joint combination of 2–3 lenses and 2–4 constraints
 * (no truncation, auto-fill, or silent caps).
 */
export function generateSelection(
    input: TestLibrarySelectionInput,
    inputConstraints?: InputConstraintHints | null
): TestLibrarySelectionResult {
    if (!input.learningGoals || !Array.isArray(input.learningGoals) || input.learningGoals.length === 0) {
        throw new Error('Test Library selection requires at least one learning goal.')
    }

    assertCoachGoalsAllowedForTestLibrary(input)

    const selectionCorpusInput: TestLibrarySelectionInput = {
        ...input,
        learningGoals: input.learningGoals.map((g) => normalizeCoachingInput(g)),
        sessionDescription: input.sessionDescription ? normalizeCoachingInput(input.sessionDescription) : undefined,
    }

    if (testLibraryRegistry.archetypes().length === 0) {
        throw new Error('Test Library V0 has no archetypes loaded.')
    }
    if (testLibraryRegistry.affordanceLenses().length < 2) {
        throw new Error('Test Library V0 needs at least two affordance lenses.')
    }
    if (testLibraryRegistry.selectableConstraints().length < 2) {
        throw new Error('Test Library V0 needs at least two constraints.')
    }

    const queryCorpus = buildQueryCorpus(selectionCorpusInput)
    const rawTokens = uniqueTokens(tokenize(queryCorpus))
    const tokens = rawTokens.filter((t) => !STOPWORDS.has(t))
    if (tokens.length === 0) {
        throw new Error(
            'Test Library selection could not derive non-stopword search tokens from learning goals and optional fields. Add more specific terms.'
        )
    }

    // Round 8C: the goal expressed information intent (parser Group K) -> boost information constraints.
    const informationIntent = inputConstraints?.matchedSignals?.includes('signalGroup:K_information') ?? false

    const archetypePool = applyArchetypePoolFilter(inputConstraints)
    const allLenses = applyLensPoolFilter(inputConstraints)
    const allConstraints = applyConstraintPoolFilter(inputConstraints)

    // WORKSTREAM 2 — archetype-selection diversity. The tie-break below previously used the
    // lowest game_form_id (STRING compare: "GF1" < "GF10" < "GF2" ...), which funneled EVERY tie
    // to End Zone (GF1) and then Directional Possession (GF2). Combined with how often distinct
    // goals score-tie, this is the category-collapse mechanism — Target / Channel / Positional Play
    // almost never won a tie. On a tie we now honor the parser's candidate ORDER (the parser lists
    // the most category-specific archetype first per signal group), so distinct categories reach
    // distinct archetypes. game_form_id remains the final deterministic fallback.
    const candidateOrder = inputConstraints?.candidateArchetypeIds ?? []
    const orderRank = (id: string): number => {
        const i = candidateOrder.indexOf(id)
        return i === -1 ? Number.MAX_SAFE_INTEGER : i
    }
    const archetypeScored: { a: TestLibraryV0Archetype; score: number; reasons: string[] }[] = []
    let bestArc: { a: TestLibraryV0Archetype; score: number; reasons: string[] } | null = null
    for (const a of archetypePool) {
        const fields = [
            a.game_form_name,
            a.objective,
            a.interaction_structure,
            a.phase_of_play,
            a.representative_design_notes,
            a.logicUsageNote,
            // Coach-language synonyms / phrases curated per archetype. Extends the searchable
            // text so natural inputs like "midfielders building out" match Directional Possession,
            // "penetrating passes" matches Line-Breaking-leaning archetypes, etc.
            ...(a.coachVocabulary ?? []),
        ]
        const { score, reasons } = scoreAgainstFields(tokens, fields)
        archetypeScored.push({ a, score, reasons })
        if (!bestArc) {
            bestArc = { a, score, reasons }
            continue
        }
        if (score > bestArc.score) {
            bestArc = { a, score, reasons }
            continue
        }
        if (score === bestArc.score) {
            const aRank = orderRank(a.game_form_id)
            const bRank = orderRank(bestArc.a.game_form_id)
            if (aRank < bRank || (aRank === bRank && a.game_form_id < bestArc.a.game_form_id)) {
                bestArc = { a, score, reasons }
            }
        }
    }
    if (!bestArc) {
        throw new Error('Failed to select an archetype.')
    }

    const archetype = bestArc.a
    const archeAffordances = archetypeAffordanceSlugs(archetype)

    const lensScored = scoreAllLenses(tokens, archetype, archeAffordances)
    const lensScoreById = new Map(lensScored.map((r) => [r.lens.id, r] as const))

    // Bound the lens search pool. See BOUNDED_SEARCH_TOP_LENSES doc above for the cost analysis.
    const lensCandidatePool = boundedLensCandidates(lensScored, allLenses)

    let bestTotal = -Infinity
    let bestLensCombo: TestLibraryV0AffordanceLens[] | null = null
    let bestConCombo: TestLibraryV0Constraint[] | null = null

    function comboKey(lenses: TestLibraryV0AffordanceLens[], cons: TestLibraryV0Constraint[]): string {
        return sortedIdsJoin([...lenses.map((l) => l.id), ...cons.map((c) => c.id)])
    }

    const selectionSearchStart = Date.now()

    for (const lensSize of [2, 3]) {
        if (lensCandidatePool.length < lensSize) continue

        for (const lensCombo of combinations(lensCandidatePool, lensSize)) {
            const selectedLensSlugs = new Set(lensCombo.map(lensSlug))
            const conScored = scoreConstraintsForLensSlugs(tokens, archetype, archeAffordances, selectedLensSlugs, informationIntent)
            const conMap = conScoredMap(conScored)

            // Bound the constraint search pool for this lens combo. Per-lens-combo because constraint
            // scoring depends on the selected lens slugs (targetMatchesSelectedLens bonus).
            const constraintCandidatePool = boundedConstraintCandidates(conScored, allConstraints)

            const lensSum = lensCombo.reduce((s, l) => s + (lensScoreById.get(l.id)?.score ?? 0), 0)

            for (const conSize of [2, 3, 4]) {
                if (constraintCandidatePool.length < conSize) continue

                for (const conCombo of combinations(constraintCandidatePool, conSize)) {
                    if (!constraintComboPassesRoleMix(conCombo, conScored)) continue

                    const compat = isSelectionPackageCompatible({
                        archetype,
                        affordanceLenses: lensCombo,
                        constraints: conCombo,
                    })
                    if (!compat.compatible) continue

                    const conSum = conCombo.reduce((s, c) => s + (conMap.get(c.id)?.score ?? 0), 0)
                    const balance = constraintBalanceBonus(conCombo)
                    const total = lensSum + conSum + balance

                    if (total > bestTotal) {
                        bestTotal = total
                        bestLensCombo = [...lensCombo]
                        bestConCombo = [...conCombo]
                    } else if (total === bestTotal && bestLensCombo && bestConCombo) {
                        const key = comboKey(lensCombo, conCombo)
                        const prevKey = comboKey(bestLensCombo, bestConCombo)
                        if (key < prevKey) {
                            bestLensCombo = [...lensCombo]
                            bestConCombo = [...conCombo]
                        }
                    }
                }
            }
        }
    }

    const resolution = computeResolution(inputConstraints)
    const selectionSearchMs = Date.now() - selectionSearchStart
    console.log(
        `[selection-search] lensCandidates=${lensCandidatePool.length} elapsedMs=${selectionSearchMs} bestScore=${bestTotal === -Infinity ? 'none' : bestTotal} resolution=${resolution.status}`
    )

    if (!bestLensCombo || !bestConCombo || bestTotal === -Infinity) {
        throw new Error(
            'Test Library selection could not find a compatible lens and constraint combination that satisfies size (2–3 lenses, 2–4 constraints), role-mix rules, and pre-assembly package validation for this input.'
        )
    }

    assertSelectionContract(bestLensCombo, bestConCombo)

    const selectedLenses = bestLensCombo
    const picked = bestConCombo

    const affordanceTrace: SelectionReasonEntry[] = selectedLenses.map((l) => {
        const row = lensScoreById.get(l.id)
        return { id: l.id, score: row?.score ?? 0, reasons: row?.reasons ?? [] }
    })

    const finalLensSlugs = new Set(selectedLenses.map(lensSlug))
    const finalConScored = scoreConstraintsForLensSlugs(tokens, archetype, archeAffordances, finalLensSlugs, informationIntent)
    const finalConMap = conScoredMap(finalConScored)

    const constraintsTrace: SelectionReasonEntry[] = picked.map((c) => {
        const row = finalConMap.get(c.id)
        const bucket = constraintBalanceBucket(c)
        return {
            id: c.id,
            score: row?.score ?? 0,
            reasons: [...(row?.reasons ?? []), `balanceBucket:${bucket}`],
        }
    })

    // Developer/testing instrumentation: surface the full candidate rankings the selector already
    // computed and otherwise discards ("why it won"). Each list is sorted best-first using the same
    // ordering the selector uses, so the displayed order matches the actual selection logic.
    const selectedLensIds = new Set(selectedLenses.map((l) => l.id))
    const selectedConIds = new Set(picked.map((c) => c.id))
    // `allLenses` / `allConstraints` are the post-routing eligible pools; lenses and constraints are
    // scored across the FULL library, so a high score outside these sets = a routing gap, not coverage.
    const eligibleLensIds = new Set(allLenses.map((l) => l.id))
    const eligibleConIds = new Set(allConstraints.map((c) => c.id))

    const archetypeRankingSorted = [...archetypeScored].sort(
        (x, y) =>
            y.score - x.score ||
            orderRank(x.a.game_form_id) - orderRank(y.a.game_form_id) ||
            x.a.game_form_id.localeCompare(y.a.game_form_id)
    )
    const archetypeRanking: SelectionRankingEntry[] = archetypeRankingSorted.map((r) => ({
        id: r.a.game_form_id,
        name: r.a.game_form_name,
        score: r.score,
        reasons: r.reasons,
        selected: r.a.game_form_id === archetype.game_form_id,
        // Archetype scoring runs over the routed candidate pool only, so every entry here was eligible.
        eligible: true,
    }))
    const archetypeMargin =
        archetypeRankingSorted.length >= 2
            ? archetypeRankingSorted[0].score - archetypeRankingSorted[1].score
            : null

    const affordanceRanking: SelectionRankingEntry[] = [...lensScored]
        .sort((a, b) => b.score - a.score || a.lens.id.localeCompare(b.lens.id))
        .map((r) => ({
            id: r.lens.id,
            name: r.lens.title,
            score: r.score,
            reasons: r.reasons,
            selected: selectedLensIds.has(r.lens.id),
            eligible: eligibleLensIds.has(r.lens.id),
        }))

    const constraintRanking: SelectionRankingEntry[] = [...finalConScored]
        .sort((a, b) => b.score - a.score || a.c.id.localeCompare(b.c.id))
        .map((r) => ({
            id: r.c.id,
            name: r.c.title,
            score: r.score,
            reasons: [...r.reasons, `balanceBucket:${r.bucket}`],
            selected: selectedConIds.has(r.c.id),
            eligible: eligibleConIds.has(r.c.id),
        }))

    return {
        archetype,
        affordanceLenses: selectedLenses,
        constraints: picked,
        resolution,
        selectionTrace: {
            queryCorpus,
            archetype: { id: archetype.id, score: bestArc.score, reasons: bestArc.reasons },
            affordanceLenses: affordanceTrace,
            constraints: constraintsTrace,
            objectiveScore: bestTotal,
            ranking: {
                archetypes: archetypeRanking,
                affordanceLenses: affordanceRanking,
                constraints: constraintRanking,
                archetypeMargin,
            },
        },
    }
}
