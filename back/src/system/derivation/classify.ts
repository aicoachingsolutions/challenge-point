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

import { DerivedLine, resolvedValue } from './derive'
import { reaches } from './reach'
import { DeclarationReach } from './scope'
import { ApplicabilityCondition, RegisterIndex } from './register'
import { DEFERS_TO_ESTABLISHING_OBJECT, ElementClass, ItemRef, ResolutionLine, Verdict, ReasonCode } from './types'

/** One declaration that took part in deciding a line's reason: who said it, what kind, about what. */
export interface GoverningDeclaration {
    contractId: string
    declaration: string
    selector: string | null
}

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
    /**
     * Every declaration reaching the row, iff NOT_AUTHORED. AM-23's three reason codes cannot
     * express the five-declaration vocabulary, so this is what the knowledge actually said.
     *
     * It stays ROW-WIDE after 15 October 2026: what governs a line is now a subset of it (`governedBy`), and
     * keeping the whole is what keeps the narrowing from being a loss.
     */
    declared?: string[]
    /**
     * **The declarations the reason was decided over** (15 October 2026, his answer 9), iff NOT_AUTHORED. Equal
     * to every declaration on the row wherever the establishing object said nothing explicit about this
     * element; otherwise its explicit statement plus the general requirements still in force — see
     * `governingDeclarations`.
     */
    governedBy?: GoverningDeclaration[]
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
 *
 * Exported 13 October so the roster rule can ask the same question of a row that has NO line — a
 * per-member property of a class nothing individuates (SD-97) — and get the same answer a line on that
 * row would have carried, rather than keeping a second copy of this precedence.
 *
 * **Since 15 October 2026 the order is applied over `governingDeclarations`**, not over every declaration on the
 * row; the order itself is unchanged. Called without a class it is exactly what it was.
 */
export function reasonFor(row: string, declarations: DeclarationReach[], cls?: ElementClass): ReasonCode {
    const reaching = governingDeclarations(row, declarations, cls)
    if (!reaching.length) return 'no coverage'
    if (reaching.some(d => d.declaration === 'NOT_AUTHORED')) return 'declared gap'
    if (reaching.some(d => d.declaration === 'EXCLUDED')) return 'excluded'
    if (reaching.some(d => d.declaration === 'NON_CLAIMED')) return 'not constrained'
    if (reaching.some(d => d.declaration === 'CLAIMED')) return 'claimed but unresolved'
    return 'coverage'
}

/** The kinds that state a requirement, and so stay in force against a more specific statement. */
const GENERAL_REQUIREMENTS = ['NOT_AUTHORED', 'EXCLUDED', 'CLAIMED']

/**
 * **Which declarations decide a line's reason — his answer 9 of 15 October 2026, in its strict form.**
 *
 * *"Specific knowledge governs where it explicitly defines or specializes a condition. General requirements
 * remain applicable unless the specific knowledge explicitly supersedes them through an authorized
 * relationship."* And the safeguard he put first: *"specificity should not mean that silence automatically
 * overrides requirements established elsewhere."*
 *
 * Until now every declaration on a row reached every line on it, from every object, whatever its selector or
 * scope said it was about. So an object's statement about its OWN element could be outranked by another
 * object's statement about something else entirely: a non-claim whose selector excludes the element hid the
 * establishing object's own claim, and an exclusion scoped to another object's own involvement relabelled
 * regions it never addressed.
 *
 * The rule, for a line on element class `cls`:
 *
 *   1. The ESTABLISHING objects are those whose contributions form the class (`fromItem` and `supportedBy`).
 *   2. Their EXPLICIT statement is every declaration of theirs on the row whose kind is not UNDECLARED, whose
 *      scope reaches the class, and whose selector positively reaches it (`reaches` = TRUE). UNDECLARED is
 *      recorded silence and an undetermined reach is not explicit, so neither counts — silence never overrides.
 *      An OWN_INVOLVEMENT scope reaches only the classes its object FORMS (scope.ts `fixOwnInvolvement`), so a
 *      supporting object's own-involvement declaration says nothing about a class it only supports, and does not
 *      count as speaking about it (review, 15 October 2026: counted, it would have let a statement that never
 *      reached the class switch the precedence on and drop another object's requirement — the relaxing path).
 *   3. If there is no explicit statement — or no class, as for a game-level line — the answer is every
 *      declaration on the row, exactly as before: behaviour is unchanged wherever the specific knowledge is silent.
 *   4. Otherwise it is the explicit statement PLUS every general requirement (NOT_AUTHORED, EXCLUDED, CLAIMED)
 *      that still reaches the class: its selector is not FALSE for it (an unreadable selector keeps reaching, so
 *      a requirement is dropped only where it positively does not address the class), and its scope reaches it.
 *      That holds for the establishing object's OWN requirements too: one whose reach is undetermined is not
 *      explicit, but nothing explicit superseded it either, and *"General requirements remain applicable unless
 *      the specific knowledge explicitly supersedes them"* (review, 15 October 2026; dropped 0 times on that
 *      day's knowledge, kept so the property below holds by construction rather than by luck). A non-claim from
 *      elsewhere is not a requirement and drops out; so does another object's requirement the data marks as
 *      deferring to the establishing object — and the data marks none.
 *
 * AM-23's order is then applied to this set unchanged. Only the membership moves, and by construction it can
 * only lose a declaration that never addressed the class or that requires nothing — never a requirement that does.
 * Selector-honouring alone, without step 3's precedence, would RELAX blocking lines (measured 15 October 2026);
 * it is not available separately.
 */
export function governingDeclarations(row: string, declarations: DeclarationReach[], cls?: ElementClass): DeclarationReach[] {
    const onRow = declarations.filter(d => d.row === row)
    if (!cls) return onRow

    const establishing = new Set([cls.fromItem.contractId, ...cls.supportedBy.map(s => s.contractId)])
    const scopeReaches = (d: DeclarationReach) => d.scope !== 'OWN_INVOLVEMENT' || cls.fromItem.contractId === d.contractId // scope.ts's own-involvement rule
    const explicit = onRow.filter(
        d =>
            establishing.has(d.contractId) &&
            d.declaration !== 'UNDECLARED' &&
            scopeReaches(d) &&
            !!d.parsed.predicate &&
            reaches(d.parsed.predicate, cls) === 'TRUE',
    )
    if (!explicit.length) return onRow

    const general = onRow.filter(
        d =>
            !explicit.includes(d) &&
            GENERAL_REQUIREMENTS.includes(d.declaration) &&
            scopeReaches(d) &&
            (!d.parsed.predicate || reaches(d.parsed.predicate, cls) !== 'FALSE') &&
            !(d.defersTo === DEFERS_TO_ESTABLISHING_OBJECT && !establishing.has(d.contractId)),
    )
    return [...explicit, ...general]
}

/** The governing set as the line carries it, in a stable order. */
function governedByOn(row: string, declarations: DeclarationReach[], cls?: ElementClass): GoverningDeclaration[] {
    return governingDeclarations(row, declarations, cls)
        .map(d => ({ contractId: d.contractId, declaration: d.declaration, selector: d.selector === undefined || d.selector === null ? null : String(d.selector) }))
        .sort((a, b) => `${a.contractId}|${a.declaration}|${a.selector}`.localeCompare(`${b.contractId}|${b.declaration}|${b.selector}`))
}

/**
 * Every declaration that reaches the row, kept beside the reason code.
 *
 * AM-23 gives three reason codes and the vocabulary has five declarations, so two of them have
 * nowhere to land: `NON_CLAIMED` falls through `reasonFor` to `coverage`, and `EXCLUDED` loses to
 * `UNDECLARED` on precedence. On the corpus that makes **12 of 57** unestablished lines report
 * *"nobody looked"* when an object did look and declared either that it does not constrain the row
 * or that it excludes it.
 *
 * The reason codes are his and the precedence between a declaration and a silence is a semantic
 * question, so neither is changed here. What is fixed is the loss: the declarations travel with the
 * line, so the reason code can never be the only surviving account of what the knowledge said.
 */
function declaredOn(row: string, declarations: DeclarationReach[]): string[] {
    return [...new Set(declarations.filter(d => d.row === row).map(d => d.declaration))].sort()
}

/**
 * The governing-line rule, held in the register's `applicability` block:
 *   governing derived      → evaluate the condition: true keeps the line, false WITHDRAWS it;
 *   governing FREE(choice) → the line stays CONDITIONAL on that choice;
 *   governing failed       → the line fails as a GAP whose dependency is the governing line, because
 *                            an unresolvable condition is not a false one.
 *
 * **SD-88, his ruling of 27 September**, which removed the increment-3 stop that sat on the first
 * branch: *"when a conditional line's governing property has been authoritatively resolved, its
 * applicability condition should be evaluated. This is completion of the existing conditional
 * mechanism, not permission to infer a governing value."*
 *
 * The stop it replaces read *"increment 3 derives no transition values, so the governing value is not
 * available to compare"*. That was true when written and stopped being true when transitions began
 * resolving; nothing revisited it, so sixteen conditional lines held a resolved governing value and
 * none had ever been judged.
 *
 * The distinction his ruling draws is kept in the code: **this function reads a governing value, it
 * never supplies one.** Where the governing line carries no value the condition is not evaluated and
 * the line stays conditional — the engine does not manufacture the comparison it needs.
 */
function resolveConditional(
    line: ResolutionLine,
    condition: ApplicabilityCondition | undefined,
    governing: ClassifiedLine | undefined,
    derived: Map<string, DerivedLine>,
    stopped: { where: string; why: string }[],
): { lineState: ResolutionLine['lineState']; verdict: Verdict | null; reason: ReasonCode | null } | null {
    const unevaluated = { lineState: 'CONDITIONAL' as const, verdict: null, reason: null }
    if (!governing || !condition) return unevaluated

    if (governing.verdict === 'RESOLVED:ENTAILED') {
        // The one question this branch may ask: what value does the governing line already hold? It is
        // read through the single resolver, so a route added later cannot leave this view behind.
        const resolved = resolvedValue(derived.get(String(line.conditionalOn)))
        if (!resolved) {
            stopped.push({
                where: `stage 6, line ${line.lineId}`,
                why:
                    `its governing line ${String(line.conditionalOn)} is derived but carries no value, so the applicability ` +
                    'condition cannot be evaluated. Supplying one here is exactly what SD-88 withholds, so the line stays conditional.',
            })
            return unevaluated
        }
        if (typeof resolved.value !== 'string') {
            // The register states each condition as a list of authored member strings. Nothing
            // establishes how a structured value is tested against them, and reading one into a member
            // name would be interpretation, not evaluation (SD-48).
            stopped.push({
                where: `stage 6, line ${line.lineId}`,
                why:
                    `its governing line holds ${JSON.stringify(resolved.value)}, and the register states this condition as a list of ` +
                    'authored member strings. How a structured value is tested for membership is not established, so the condition is not evaluated.',
            })
            return unevaluated
        }
        // True keeps the line — and keeps the verdict the main pass already reached for it, which is
        // the point of the ruling: applicability decides whether the line is judged, never what it
        // holds. A line nothing authored is `NOT_AUTHORED` here exactly as it would be on any other row.
        if (condition.in.includes(resolved.value)) return null
        // False withdraws it: not applicable, and never NOT_AUTHORED.
        return { lineState: 'WITHDRAWN', verdict: null, reason: null }
    }

    if (governing.verdict && governing.verdict.startsWith('FREE')) return unevaluated
    return { lineState: 'ENUMERATED', verdict: 'NOT_AUTHORED', reason: 'declared gap' }
}

export function classifyLines(
    lines: ResolutionLine[],
    derived: Map<string, DerivedLine>,
    declarations: DeclarationReach[],
    index: RegisterIndex,
    stopped: { where: string; why: string }[] = [],
    classes: ElementClass[] = [],
): Map<string, ClassifiedLine> {
    const classified = new Map<string, ClassifiedLine>()
    // The element each line is about, so its reason can be decided by what governs THAT element (answer 9).
    // A line whose element is not given here is read row-wide, exactly as before 15 October 2026.
    const byClass = new Map(classes.map(c => [c.classId, c]))
    const classOf = (line: ResolutionLine) => (line.elementId ? byClass.get(line.elementId) : undefined)

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

        // A line already withdrawn at enumeration is **not judged at all**. Stage 2 settled it from
        // the element's own identity, and giving it a verdict here would report the absence of an
        // inapplicable property as missing knowledge — which is the one thing the applicability rule
        // exists to prevent. The governing-line path reaches the same state later by clearing the
        // verdict it had provisionally assigned; this path never assigns one.
        if (line.lineState === 'WITHDRAWN') {
            classified.set(line.lineId, result)
            continue
        }

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
            result.reason = reasonFor(line.row, declarations, classOf(line))
            result.declared = declaredOn(line.row, declarations)
            result.governedBy = governedByOn(line.row, declarations, classOf(line))
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
        result.reason = reasonFor(line.row, declarations, classOf(line))
        result.governedBy = governedByOn(line.row, declarations, classOf(line))
        classified.set(line.lineId, result)
    }

    // Conditional lines are resolved after their governing lines have verdicts. A null result means the
    // condition evaluated true: the line is applicable, and the verdict the main pass reached for it
    // stands untouched on an ENUMERATED line.
    for (const line of lines) {
        if (line.lineState !== 'CONDITIONAL') continue
        const governing = line.conditionalOn ? classified.get(line.conditionalOn) : undefined
        const condition = index.applicability.get(line.row)
        const resolved = resolveConditional(line, condition, governing, derived, stopped)
        const current = classified.get(line.lineId)!
        classified.set(line.lineId, resolved ? { ...current, ...resolved } : { ...current, lineState: 'ENUMERATED' })
    }

    return classified
}
