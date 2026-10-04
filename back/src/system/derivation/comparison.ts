/**
 * **`COMPARES`** — the requirement kind AM-16 added on 20 September, activated here on his instruction of
 * 3 October:
 *
 *   > *Your semantic-ownership finding is persuasive. AM-16 already introduced `COMPARES` for comparison
 *   > between represented properties, so please don't introduce another mechanism or continue relying on prose
 *   > matching for `"equal"`.*
 *
 * It had been registered and unused: the register carries a thirteen-key `comparison` block and **no corpus
 * item used the kind**, while four P2 items carried fitNotes declaring that *"no requirement kind compares two
 * elements"* — true when they were written and obsolete since AM-16.
 *
 * Everything here implements the register's own block rather than deciding anything. The keys that govern:
 *
 *   - **`form`** — `{ left: <operand>, operator, right: <operand> }`, operator in `{ =, !=, <, <=, >, >= }`.
 *   - **`operandForms`** (SD-23) — either a represented game property `{ row, selector }`, or a
 *     deterministically derived quantity `{ derived, args }` over SUPPORTED properties.
 *   - **`whereItLands`** (SD-26) — *"A comparison takes NO LINE … held in the contribution and reconciliation
 *     record, outside the eight stored areas. It never takes a property's verdict and never changes a line's
 *     status."* So nothing here writes a line or a verdict.
 *   - **`relation`** — `NARROWS`. *"It never entails a value and never entails existence."* So a comparison
 *     may never be the thing that produces a number.
 *   - **`evaluability`** (SD-26) — evaluable only when both operands resolve. *"Otherwise it is unmet
 *     (required) or not evaluable (supporting) … **Never quietly true**."*
 *   - **`stillOpen`** — *"No aggregate function is named (each, some, the sum, the greatest) for a comparison
 *     ranging over several matched elements. An engine refuses such a comparison rather than choosing one."*
 *     This is load-bearing and it is why the roster's equality is declared but not evaluated: see
 *     `REFUSED_MULTI_ELEMENT` below.
 *   - **`assumedCannotCollide`** (SD-27) and **`gapBeforeCollision`** (SD-28) — an assumed or unresolved
 *     comparison is a tension or a gap, never an authoritative failure.
 */
import { RegisterIndex } from './register'

/** An operand: a represented game property, or a derived quantity over supported ones (SD-23). */
export type Operand = { row: string; selector?: string } | { derived: string; args?: unknown[] }

export interface Comparison {
    left: Operand
    operator: '=' | '!=' | '<' | '<=' | '>' | '>='
    right: Operand
    /** The authored words, kept beside the typed form. */
    asAuthored: string
    from: { contractId: string; itemId: string }
    /** AUTHORED / OWNER_RULING may fail authoritatively; anything else reports only (SD-27). */
    authoritative: boolean
}

export const OPERATORS = ['=', '!=', '<', '<=', '>', '>='] as const

export type ComparisonVerdict =
    /** Both operands resolved and the relation holds. */
    | 'HOLDS'
    /** Both operands resolved and the relation does not hold. */
    | 'VIOLATED'
    /** An operand did not resolve. Never quietly true (SD-26). */
    | 'NOT_EVALUABLE'
    /**
     * An operand matched several elements, and the register names no aggregate function for that case.
     * `stillOpen` requires an engine to **refuse** rather than choose one, so this is a refusal to evaluate
     * and never a pass.
     */
    | 'REFUSED_MULTI_ELEMENT'
    /** The comparison is not well formed under SD-23 — an unregistered row, or an unknown operator. */
    | 'MALFORMED'

export interface ComparisonResult {
    comparison: Comparison
    verdict: ComparisonVerdict
    detail: string
    left?: unknown
    right?: unknown
}

/** Read a typed comparison off a contract item. Returns null where the item states none. */
export function comparisonOf(contractId: string, item: Record<string, unknown>): Comparison | null {
    const raw = item.comparison as Record<string, unknown> | undefined
    if (!raw || typeof raw !== 'object') return null
    return {
        left: raw.left as Operand,
        operator: String(raw.operator) as Comparison['operator'],
        right: raw.right as Operand,
        asAuthored: String(item.value ?? ''),
        from: { contractId, itemId: String(item.itemId) },
        authoritative: ['AUTHORED', 'OWNER_RULING'].includes(String(item.basis)),
    }
}

/** Every typed comparison the selected contracts carry. */
export function comparisonsIn(contracts: { contractId: string; items?: Record<string, unknown>[] }[]): Comparison[] {
    const found: Comparison[] = []
    for (const contract of contracts) {
        for (const item of contract.items ?? []) {
            const comparison = comparisonOf(contract.contractId, item)
            if (comparison) found.push(comparison)
        }
    }
    return found.sort((a, b) => `${a.from.contractId}::${a.from.itemId}`.localeCompare(`${b.from.contractId}::${b.from.itemId}`))
}

const readAt = (node: unknown, path: string): unknown =>
    path.split('.').reduce<unknown>((at, key) => (at && typeof at === 'object' ? (at as Record<string, unknown>)[key] : undefined), node)

/**
 * Resolve one operand against the concrete game.
 *
 * A `{ row, selector }` operand names a register row. Where the row belongs to a collection, the operand
 * matches every member that satisfies the selector — and **matching more than one is the case `stillOpen`
 * refuses**, so the count is returned rather than reduced.
 */
function resolveOperand(operand: Operand, game: Record<string, unknown>, index: RegisterIndex): { matched: { element: string; value: unknown }[]; why: string } {
    if ('derived' in operand) {
        // No derived-quantity rule is registered yet. Declaring one would be inventing a named rule the
        // register does not carry, so this says so rather than guessing.
        return { matched: [], why: `the derived quantity "${operand.derived}" names no registered rule` }
    }
    const row = index.rows.get(String(operand.row))
    if (!row) return { matched: [], why: `${operand.row} is not a registered row` }
    const path = String(row.path)
    const match = path.match(/^(.+?)\[\]\.?(.*)$/)
    if (!match) {
        // A game-level field: one value, no members.
        const value = readAt(game, path)
        return value === undefined ? { matched: [], why: `the game holds no value at ${path}` } : { matched: [{ element: path, value }], why: '' }
    }
    const [, container, leaf] = match
    const bucket = readAt(game, container)
    if (!Array.isArray(bucket)) return { matched: [], why: `the game holds no ${container} collection` }
    const matched: { element: string; value: unknown }[] = []
    for (const entry of bucket as Record<string, unknown>[]) {
        if (!entry || typeof entry !== 'object') continue
        const value = leaf ? readAt(entry, leaf) : entry
        if (value === undefined) continue
        matched.push({ element: String(entry.elementId ?? entry.satisfies ?? container), value })
    }
    return { matched, why: matched.length ? '' : `no member of ${container} carries ${leaf || container}` }
}

const holds = (left: unknown, operator: Comparison['operator'], right: unknown): boolean => {
    if (operator === '=') return JSON.stringify(left) === JSON.stringify(right)
    if (operator === '!=') return JSON.stringify(left) !== JSON.stringify(right)
    const a = Number(left)
    const b = Number(right)
    if (!Number.isFinite(a) || !Number.isFinite(b)) return false
    return operator === '<' ? a < b : operator === '<=' ? a <= b : operator === '>' ? a > b : a >= b
}

/**
 * **Evaluate one comparison against the concrete game.** Never quietly true.
 *
 * The `REFUSED_MULTI_ELEMENT` path is the one that matters for the corpus today. The authored equality on team
 * size — *"equal to the other team's outfieldCount"* — names a row owned by a collection with two members, so
 * each operand matches both of them. The register names no aggregate for that, and his guard forbids an
 * authored item naming a member's handle, so there is no well-formed way to write this comparison yet. It is
 * refused rather than resolved, and the refusal is the finding.
 */
export function evaluateComparison(comparison: Comparison, game: Record<string, unknown>, index: RegisterIndex): ComparisonResult {
    if (!OPERATORS.includes(comparison.operator)) {
        return { comparison, verdict: 'MALFORMED', detail: `"${comparison.operator}" is not a registered operator` }
    }
    const left = resolveOperand(comparison.left, game, index)
    const right = resolveOperand(comparison.right, game, index)

    for (const [side, resolved] of [['left', left], ['right', right]] as const) {
        if (!resolved.matched.length) {
            return { comparison, verdict: 'NOT_EVALUABLE', detail: `the ${side} operand does not resolve: ${resolved.why}` }
        }
    }
    if (left.matched.length > 1 || right.matched.length > 1) {
        return {
            comparison,
            verdict: 'REFUSED_MULTI_ELEMENT',
            detail:
                `an operand matches ${Math.max(left.matched.length, right.matched.length)} elements and the register names no ` +
                `aggregate function for a comparison ranging over several matched elements, so it is refused rather than ` +
                `reduced to one (register: comparison.stillOpen)`,
        }
    }
    const a = left.matched[0].value
    const b = right.matched[0].value
    return {
        comparison,
        verdict: holds(a, comparison.operator, b) ? 'HOLDS' : 'VIOLATED',
        detail: `${left.matched[0].element} = ${JSON.stringify(a)} ${comparison.operator} ${right.matched[0].element} = ${JSON.stringify(b)}`,
        left: a,
        right: b,
    }
}

/**
 * Every comparison the selected knowledge states, evaluated against the concrete game.
 *
 * Returned whole — holding, violated, refused and not-evaluable alike — because a comparison that was not
 * evaluated must stay distinguishable from one that passed. That distinction is exactly what the joint
 * condition lost by being silent.
 */
export function evaluateComparisons(
    contracts: { contractId: string; items?: Record<string, unknown>[] }[],
    game: Record<string, unknown>,
    index: RegisterIndex,
): ComparisonResult[] {
    return comparisonsIn(contracts).map(comparison => evaluateComparison(comparison, game, index))
}

/** The comparisons that AUTHORITATIVELY fail — the only ones that may block (SD-27). */
export const authoritativeViolations = (results: ComparisonResult[]): ComparisonResult[] =>
    results.filter(r => r.verdict === 'VIOLATED' && r.comparison.authoritative)
