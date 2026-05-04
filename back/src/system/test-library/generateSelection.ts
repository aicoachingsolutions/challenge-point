import { TEST_LIBRARY_V0_ARCHETYPES } from './archetypes'
import { TEST_LIBRARY_V0_AFFORDANCE_LENSES } from './affordanceLenses'
import { TEST_LIBRARY_V0_CONSTRAINTS } from './constraints'
import type { InputConstraintHints } from '../input-constraints/deriveInputConstraints'
import { normalizeCoachingInput } from './normalizeCoachingInput'
import type {
    ConstraintBalanceBucket,
    SelectionReasonEntry,
    TestLibrarySelectionInput,
    TestLibrarySelectionResult,
    TestLibraryV0AffordanceLens,
    TestLibraryV0Archetype,
    TestLibraryV0Constraint,
} from './types'

function applyArchetypePoolFilter(hints?: InputConstraintHints | null): TestLibraryV0Archetype[] {
    const full = TEST_LIBRARY_V0_ARCHETYPES
    const ids = hints?.candidateArchetypeIds
    if (!ids?.length) return full
    const filtered = full.filter((a) => ids.includes(a.game_form_id))
    return filtered.length > 0 ? filtered : full
}

function applyLensPoolFilter(hints?: InputConstraintHints | null): TestLibraryV0AffordanceLens[] {
    const full = TEST_LIBRARY_V0_AFFORDANCE_LENSES
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
    const full = TEST_LIBRARY_V0_CONSTRAINTS
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

function matchReasons(tokens: string[], text: string): string[] {
    const t = text.toLowerCase()
    const reasons: string[] = []
    for (const tok of tokens) {
        if (tok.length >= 2 && t.includes(tok)) {
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
    for (const lens of TEST_LIBRARY_V0_AFFORDANCE_LENSES) {
        const fields = [lens.title, lens.description, lens.category, lens.designIntent, lens.notes]
        const base = scoreAgainstFields(tokens, fields)
        let score = base.score
        const reasons = [...base.reasons]
        const slug = lensSlug(lens)
        if (archeAffordances.has(slug)) {
            score += 8
            reasons.push(`archetypeAffordanceMatch:${slug}`)
        }
        for (const anchor of lens.gameTemplateAnchor) {
            if (phaseMatchesAnchor(archetype.phase_of_play, anchor)) {
                score += 2
                reasons.push(`phaseGameTemplateAnchor:${anchor}`)
            }
        }
        lensScored.push({ lens, score, reasons })
    }
    return lensScored
}

function scoreConstraintsForLensSlugs(
    tokens: string[],
    archetype: TestLibraryV0Archetype,
    archeAffordances: Set<string>,
    selectedLensSlugs: Set<string>
): ConScored[] {
    const conScored: ConScored[] = []
    for (const c of TEST_LIBRARY_V0_CONSTRAINTS) {
        const fields = [
            c.title,
            c.description,
            c.category,
            c.designIntent,
            c.notes,
            c.targetAffordancePrimary,
            c.constraintRole,
            c.primaryConstraintType,
        ]
        const base = scoreAgainstFields(tokens, fields)
        let score = base.score
        const reasons = [...base.reasons]
        const tgt = c.targetAffordancePrimary
        if (selectedLensSlugs.has(tgt)) {
            score += 10
            reasons.push(`targetMatchesSelectedLens:${tgt}`)
        }
        if (archeAffordances.has(tgt)) {
            score += 6
            reasons.push(`targetMatchesArchetypeAffordance:${tgt}`)
        }
        for (const rct of archetype.recommended_constraint_types) {
            if (c.constraintArchetype && rct.toLowerCase() === c.constraintArchetype.toLowerCase()) {
                score += 3
                reasons.push(`archetypeRecommendedConstraintType:${rct}`)
                break
            }
        }
        conScored.push({ c, score, reasons, bucket: constraintBalanceBucket(c) })
    }
    return conScored
}

function libraryHasBucket(bucket: ConstraintBalanceBucket): boolean {
    return TEST_LIBRARY_V0_CONSTRAINTS.some((c) => constraintBalanceBucket(c) === bucket)
}

/**
 * Preference when the library still carries that balance role.
 * Not a fallback — only adjusts objective among fully valid size-2..4 combos.
 */
function constraintBalanceBonus(combo: TestLibraryV0Constraint[]): number {
    const buckets = new Set(combo.map((c) => constraintBalanceBucket(c)))
    let bonus = 0
    if (libraryHasBucket('foundation') && buckets.has('foundation')) bonus += 6
    if (libraryHasBucket('shaping') && buckets.has('shaping')) bonus += 6
    if (libraryHasBucket('consequence') && buckets.has('consequence')) bonus += 4
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

    if (TEST_LIBRARY_V0_ARCHETYPES.length === 0) {
        throw new Error('Test Library V0 has no archetypes loaded.')
    }
    if (TEST_LIBRARY_V0_AFFORDANCE_LENSES.length < 2) {
        throw new Error('Test Library V0 needs at least two affordance lenses.')
    }
    if (TEST_LIBRARY_V0_CONSTRAINTS.length < 2) {
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

    const archetypePool = applyArchetypePoolFilter(inputConstraints)
    const allLenses = applyLensPoolFilter(inputConstraints)
    const allConstraints = applyConstraintPoolFilter(inputConstraints)

    let bestArc: { a: TestLibraryV0Archetype; score: number; reasons: string[] } | null = null
    for (const a of archetypePool) {
        const fields = [
            a.game_form_name,
            a.objective,
            a.interaction_structure,
            a.phase_of_play,
            a.representative_design_notes,
            a.logicUsageNote,
        ]
        const { score, reasons } = scoreAgainstFields(tokens, fields)
        if (!bestArc || score > bestArc.score || (score === bestArc.score && a.game_form_id < bestArc.a.game_form_id)) {
            bestArc = { a, score, reasons }
        }
    }
    if (!bestArc) {
        throw new Error('Failed to select an archetype.')
    }

    const archetype = bestArc.a
    const archeAffordances = archetypeAffordanceSlugs(archetype)

    const lensScored = scoreAllLenses(tokens, archetype, archeAffordances)
    const lensScoreById = new Map(lensScored.map((r) => [r.lens.id, r] as const))

    let bestTotal = -Infinity
    let bestLensCombo: TestLibraryV0AffordanceLens[] | null = null
    let bestConCombo: TestLibraryV0Constraint[] | null = null

    function comboKey(lenses: TestLibraryV0AffordanceLens[], cons: TestLibraryV0Constraint[]): string {
        return sortedIdsJoin([...lenses.map((l) => l.id), ...cons.map((c) => c.id)])
    }

    for (const lensSize of [2, 3]) {
        if (allLenses.length < lensSize) continue

        for (const lensCombo of combinations(allLenses, lensSize)) {
            const selectedLensSlugs = new Set(lensCombo.map(lensSlug))
            const conScored = scoreConstraintsForLensSlugs(tokens, archetype, archeAffordances, selectedLensSlugs)
            const conMap = conScoredMap(conScored)

            const lensSum = lensCombo.reduce((s, l) => s + (lensScoreById.get(l.id)?.score ?? 0), 0)

            for (const conSize of [2, 3, 4]) {
                if (allConstraints.length < conSize) continue

                for (const conCombo of combinations(allConstraints, conSize)) {
                    if (!constraintComboPassesRoleMix(conCombo, conScored)) continue

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

    if (!bestLensCombo || !bestConCombo || bestTotal === -Infinity) {
        throw new Error(
            'Test Library selection could not find a valid lens and constraint combination that satisfies size (2–3 lenses, 2–4 constraints) and role-mix rules for this input.'
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
    const finalConScored = scoreConstraintsForLensSlugs(tokens, archetype, archeAffordances, finalLensSlugs)
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

    return {
        archetype,
        affordanceLenses: selectedLenses,
        constraints: picked,
        selectionTrace: {
            queryCorpus,
            archetype: { id: archetype.id, score: bestArc.score, reasons: bestArc.reasons },
            affordanceLenses: affordanceTrace,
            constraints: constraintsTrace,
            objectiveScore: bestTotal,
        },
    }
}
