/**
 * Derivation engine — stage 6, Classify (package §2.2; derivation spec §2, §4.6; SD-28).
 *
 * "Every line gets exactly one verdict. Take the first that applies."
 *
 * The ordering rule that matters most is his, SD-28: **gap before collision**. A dependency that is
 * unauthored or not computable is a GAP first, and nothing downstream converts it into a disagreement.
 * An engine that reported "two objects disagree" about a value nobody authored would be saying
 * something false about the knowledge.
 */

import { DerivedLine } from './derive'
import { DeclarationReach } from './scope'
import { RegisterIndex } from './register'
import { ItemRef, ResolutionLine, Verdict, ReasonCode } from './types'

export interface ClassifiedLine {
    lineId: string
    lineState: ResolutionLine['lineState']
    verdict: Verdict | null
    reason: ReasonCode | null
    /** Items that collide on this line, when the verdict is UNRESOLVED. */
    collidingItems: ItemRef[]
    /** §1.4, iff derived: which of the three routes resolved it. */
    resolvedBy?: 'ENTAILMENT' | 'STANDING_DECISION' | 'SESSION'
    /** The governing line, where applicability left this one conditional. */
    conditionalOn?: string
}

/** Two entailing items collide when no single value satisfies both (§6). */
function collides(line: DerivedLine): ItemRef[] {
    if (line.entailing.length < 2) return []
    const first = JSON.stringify(line.entailing[0].value)
    const disagreeing = line.entailing.filter(e => JSON.stringify(e.value) !== first)
    if (!disagreeing.length) return [] // overlapping bounds intersect and do not collide
    return line.entailing.map(e => e.item)
}

/**
 * AM-23's reason codes, in his order. The two this stage can distinguish:
 *   declared gap — a NOT_AUTHORED declaration reaches the row: an object said it needs this and
 *                  cannot author it;
 *   coverage     — only an UNDECLARED declaration reaches it: nobody looked.
 */
function reasonFor(row: string, declarations: DeclarationReach[]): ReasonCode {
    const reaching = declarations.filter(d => d.row === row)
    if (reaching.some(d => d.declaration === 'NOT_AUTHORED')) return 'declared gap'
    if (reaching.some(d => d.declaration === 'UNDECLARED')) return 'coverage'
    if (reaching.some(d => d.declaration === 'EXCLUDED')) return 'excluded'
    return 'coverage'
}

/**
 * The governing-line rule, held in the register's `applicability` block:
 *   governing derived      → evaluate the condition: true keeps the line, false WITHDRAWS it;
 *   governing FREE(choice) → the line stays CONDITIONAL on that choice;
 *   governing failed       → the line fails as a GAP whose dependency is the governing line, because
 *                            an unresolvable condition is not a false one.
 */
function resolveConditional(
    line: ResolutionLine,
    governing: ClassifiedLine | undefined,
): { lineState: ResolutionLine['lineState']; verdict: Verdict | null; reason: ReasonCode | null } {
    if (!governing) return { lineState: 'CONDITIONAL', verdict: null, reason: null }
    if (governing.verdict === 'RESOLVED:ENTAILED') {
        // The engine does not evaluate the condition's value here: increment 3 derives no transition
        // values, so the governing value is not available to compare. The line stays conditional and
        // the case is reported rather than guessed (SD-48).
        return { lineState: 'CONDITIONAL', verdict: null, reason: null }
    }
    if (governing.verdict && governing.verdict.startsWith('FREE')) return { lineState: 'CONDITIONAL', verdict: null, reason: null }
    return { lineState: 'ENUMERATED', verdict: 'NOT_AUTHORED', reason: 'declared gap' }
}

export function classifyLines(
    lines: ResolutionLine[],
    derived: Map<string, DerivedLine>,
    declarations: DeclarationReach[],
    index: RegisterIndex,
): Map<string, ClassifiedLine> {
    const classified = new Map<string, ClassifiedLine>()

    for (const line of lines) {
        const record = derived.get(line.lineId)
        const result: ClassifiedLine = {
            lineId: line.lineId,
            lineState: line.lineState,
            verdict: null,
            reason: null,
            collidingItems: [],
        }
        if (line.conditionalOn) result.conditionalOn = line.conditionalOn

        if (!record) {
            classified.set(line.lineId, result)
            continue
        }

        // SD-28 — gap first. A line whose value nothing authored is NOT_AUTHORED, and no collision is
        // raised on it, whatever else is true.
        const noDependency =
            record.entailing.length === 0 && record.standingDecisions.length === 0 && !record.open && !record.session && !record.narrowedTo

        if (noDependency) {
            result.verdict = 'NOT_AUTHORED'
            result.reason = reasonFor(line.row, declarations)
            classified.set(line.lineId, result)
            continue
        }

        // SD-78 — the composed narrowings decide the line before anything else looks at it, because
        // they are what the contributions jointly permit. The engine is not choosing among them.
        if (record.narrowedTo && !record.entailing.length && !record.session) {
            const members = record.narrowedTo.members
            if (members.length === 1) {
                result.verdict = 'RESOLVED:ENTAILED'
                result.resolvedBy = 'ENTAILMENT'
            } else if (members.length > 1) {
                // A real downstream choice, within the jointly permitted set (SD-39). The authored order
                // is not consulted to narrow it further: RC-29 remains unresolved.
                result.verdict = 'FREE(choice)'
            } else {
                // Empty intersection: the narrowings exclude one another. A genuine collision, with
                // every contributing narrowing preserved.
                result.verdict = 'UNRESOLVED'
                result.collidingItems = record.narrowedTo.items
            }
            classified.set(line.lineId, result)
            continue
        }

        const colliding = collides(record)
        if (colliding.length) {
            // Only an authored relationship rule, or SD-06/07/08, decides one; none is available to
            // this stage, so the line is unresolved (SD-02).
            result.verdict = 'UNRESOLVED'
            result.collidingItems = colliding
            classified.set(line.lineId, result)
            continue
        }

        // Derived, by any of §1.4's three routes: entailment, a standing decision, or the session.
        // `resolvedBy` keeps them apart on the emitted line; the verdict vocabulary is closed and has
        // one name for derived, so no new verdict is minted for a session value.
        if (record.entailing.length > 0 || record.standingDecisions.length > 0 || record.session) {
            result.verdict = 'RESOLVED:ENTAILED'
            result.resolvedBy = record.session ? 'SESSION' : record.entailing.length > 0 ? 'ENTAILMENT' : 'STANDING_DECISION'
            classified.set(line.lineId, result)
            continue
        }

        if (record.open) {
            // FREE(b) is SD-15's two qualitative terms; FREE(a) a bounded quantity; FREE(choice) a
            // permitted choice. Increment 3 distinguishes the last two by whether a bound was authored.
            result.verdict = record.bounding.length > 0 ? 'FREE(a)' : 'FREE(choice)'
            classified.set(line.lineId, result)
            continue
        }

        result.verdict = 'NOT_AUTHORED'
        result.reason = reasonFor(line.row, declarations)
        classified.set(line.lineId, result)
    }

    // Conditional lines are resolved after their governing lines have verdicts.
    for (const line of lines) {
        if (line.lineState !== 'CONDITIONAL') continue
        const governing = line.conditionalOn ? classified.get(line.conditionalOn) : undefined
        const resolved = resolveConditional(line, governing)
        const current = classified.get(line.lineId)!
        classified.set(line.lineId, { ...current, ...resolved })
    }

    return classified
}
