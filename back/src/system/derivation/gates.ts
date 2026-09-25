/**
 * Derivation engine — stage 10, the gates (package §7; SD-43, SD-44, SD-45).
 *
 * Gate A certifies only what the representation makes structurally decidable. Three things it must
 * never do, and each is enforced here rather than trusted:
 *
 *   - it never issues a `PASS` it has not earned. Every clause it could not evaluate blocks, and every
 *     clause it is not entitled to judge travels with the result in `notEstablished`;
 *   - it never converts missing knowledge into a failure of the game. A clause whose subject line is a
 *     gap is `NOT_EVALUABLE` and names the line, which is SD-28's discipline carried into the gate: an
 *     engine that reported "the roster does not add up" where nobody authored a roster would be saying
 *     something false about the knowledge;
 *   - it never invents a semantic. `GA-MODIFIER-OVERLAP` for `object` and `event` conditions has no
 *     authored test, so it refuses with `CHECK_NOT_EXECUTABLE` and blocks the cases that use it.
 *
 * `NOT_EVALUABLE` covers both "the specification defines no test" (with a refusal attached) and "the
 * knowledge this clause needs is a gap" (with the lines named in `blockedBy`). **SD-52** settles the
 * second, in his words of 23 September:
 *
 *   "FAIL = sufficient authoritative information establishes violation. NOT EVALUABLE / BLOCKED =
 *    authoritative information is insufficient to determine the clause. A blocked clause cannot
 *    contribute to a gate PASS."
 *
 * **SD-53** governs the shape: "One executable gate clause → one independently reported verdict …
 * No PASS may imply a claim the engine did not evaluate." Compound wording may survive for human
 * readers; the executable form decomposes every independently testable claim.
 *
 * **SD-54** governs what a pass is worth: every passing clause states whether it evaluated applicable
 * instances or found none, and the report carries that split so a summary cannot flatten it.
 */

import { ClassifiedLine } from './classify'
import { DerivedLine } from './derive'
import { ItemOutcome } from './forward'
import { RegisterIndex } from './register'
import { add, compare, Interval, lt, lte, Rational, toInterval, toRational, ZERO } from './rational'
import { ElementClass, Envelope, FailureRecord, ItemRef, LoadedContract, RefusalRecord, ResolutionLine, SpecClause } from './types'

export type ClauseVerdict = 'PASS' | 'FAIL' | 'NOT_CHECKABLE_OUTSIDE_REPRESENTATION' | 'NOT_EVALUABLE'
export type GateVerdict = 'PASS' | 'FAIL' | 'NOT_EVALUABLE' | 'NOT_APPLICABLE'

/**
 * SD-54, his ruling of 23 September: "A universally stated structural check with zero applicable
 * instances may remain PASS, but its basis must be explicit: PASS — no applicable instances versus
 * PASS — evaluated applicable instances. Do not present those as equivalent evidence."
 */
export type ClauseBasis = 'EVALUATED' | 'NO_APPLICABLE_INSTANCES'

export interface ClauseResult {
    clause: string
    verdict: ClauseVerdict
    /** Set on every PASS: what the pass rests on. A vacuous pass is not evidence of a checked property. */
    basis?: ClauseBasis
    /** How many applicable instances the clause ranged over. Zero is what makes a pass vacuous. */
    instances?: number
    refusalId?: string
}

export interface CheckResult {
    checkId: string
    verdict: ClauseVerdict
    subjects: string[]
    why: string
    clauses: ClauseResult[]
    pendingOn: string[]
    blockedBy: string[]
}

/**
 * SD-62, his ruling of 24 September. A blocked gate clause carries a structured record of its own — it
 * does **not** create a derivation `GAP`:
 *
 *   "GAP = authoritative information required during derivation is missing.
 *    GATE BLOCK = derivation completed as far as authorized, but the gate lacks sufficient structural
 *    authority to evaluate a particular clause.
 *    Both prevent an unearned PASS, but they describe different failures of knowledge."
 *
 * A block never changes a line from derived to failed, never creates a gap retrospectively, never
 * asserts that the game condition failed, and never extends the derivation failure taxonomy. It lives
 * in the gate's own audit trail.
 */
export type GateBlockKind =
    /** The dependency is a line derivation left unauthored or unresolved. */
    | 'KNOWLEDGE_GAP'
    /** A structural identity could not be established through the registered reference system (SD-63). */
    | 'NOT_REPRESENTABLE'
    /** The clause itself has no executable definition; carries a refusal. */
    | 'SPECIFICATION_GAP'

export interface GateBlock {
    checkId: string
    clause: string
    kind: GateBlockKind
    /** The unresolved dependency: lines, and rows named where no line exists at all. */
    dependency: { lineIds: string[]; rows: string[] }
    /** Why evaluation could not be completed. */
    reason: string
    refusalId?: string
}

export interface GateReport {
    verdict: GateVerdict
    checks: CheckResult[]
    notEstablished: { checkId: string; clause: string }[]
    /** SD-62 — one record per blocked clause. Never empty while any clause is NOT_EVALUABLE. */
    blocks?: GateBlock[]
    /**
     * SD-54 — the split a summary must not flatten. A clause that passed with no applicable instances is
     * not evidence that the property holds of anything, and an aggregate count would hide that.
     */
    evidence?: {
        clausesEvaluated: number
        clausesVacuous: number
        clausesFailed: number
        clausesNotEvaluable: number
        clausesOutsideRepresentation: number
    }
}

export interface GateContext {
    classes: ElementClass[]
    lines: ResolutionLine[]
    classified: Map<string, ClassifiedLine>
    derived: Map<string, DerivedLine>
    index: RegisterIndex
    envelope: Envelope
    triggers: string[]
    failures: FailureRecord[]
    forward: ItemOutcome[]
    contracts: LoadedContract[]
}

const CLAUSE = (section: string): SpecClause => ({ document: 'derivation-engine-design-package', section })

/** What a line offers a check. `FAILED` is §1.4's `failed`: `NOT_AUTHORED` or `UNRESOLVED`. */
type Cell =
    | { state: 'DERIVED'; value: unknown }
    | { state: 'OPEN'; bounds: DerivedLine['bounding'] }
    | { state: 'FAILED' }
    | { state: 'CONDITIONAL' }
    | { state: 'ABSENT' }

/**
 * One check's working state. Every line a check consults is recorded as a subject, so the report shows
 * what the verdict ranged over rather than only what it concluded.
 */
class Probe {
    readonly subjects: string[] = []
    readonly pendingOn: string[] = []
    readonly blockedBy: string[] = []
    readonly missing: string[] = []
    readonly refusals: RefusalRecord[] = []

    constructor(
        private readonly ctx: GateContext,
        private readonly checkId: string,
    ) {}

    cell(lineId: string): Cell {
        if (!this.subjects.includes(lineId)) this.subjects.push(lineId)
        const line = this.ctx.classified.get(lineId)
        if (!line) {
            this.missing.push(lineId)
            return { state: 'ABSENT' }
        }
        if (line.lineState === 'WITHDRAWN') return { state: 'ABSENT' }
        if (line.lineState === 'CONDITIONAL' && !line.verdict) {
            if (!this.blockedBy.includes(lineId)) this.blockedBy.push(lineId)
            if (!this.blockKind.has(lineId)) this.blockKind.set(lineId, 'KNOWLEDGE_GAP')
            return { state: 'CONDITIONAL' }
        }
        if (line.verdict === 'NOT_AUTHORED' || line.verdict === 'UNRESOLVED' || line.verdict === 'INVENTED') {
            if (!this.blockedBy.includes(lineId)) this.blockedBy.push(lineId)
            if (!this.blockKind.has(lineId)) this.blockKind.set(lineId, 'KNOWLEDGE_GAP')
            return { state: 'FAILED' }
        }
        if (line.verdict && line.verdict.startsWith('FREE')) {
            if (!this.pendingOn.includes(lineId)) this.pendingOn.push(lineId)
            return { state: 'OPEN', bounds: this.ctx.derived.get(lineId)?.bounding || [] }
        }
        // §1.4's three routes, in the order stage 6 resolved them.
        // §1.4's routes, in the order stage 6 resolved them. A line resolved by composition (SD-78)
        // carries the single surviving member — never the permitted set (SD-80).
        const record = this.ctx.derived.get(lineId)
        const value = record?.session
            ? record.session.value
            : record?.entailing.length
              ? record.entailing[0].value
              : record?.narrowedTo
                ? record.narrowedTo.members.length === 1
                    ? record.narrowedTo.members[0]
                    : undefined
                : record?.standingValue?.value
        return { state: 'DERIVED', value }
    }

    /**
     * Read a line **without** recording it as a blocker, for the one case where an absent value is what
     * the clause asserts rather than something it is waiting on — "a CONTINUE transition carries no
     * placement" is confirmed, not obstructed, by an unauthored placement.
     *
     * It still records the line as a subject, so the check's reach stays visible. It must never be used
     * where the clause needs the value: that would hide a real block behind a pass.
     */
    peek(lineId: string): Cell {
        const blockedBefore = [...this.blockedBy]
        const cell = this.cell(lineId)
        this.blockedBy.length = 0
        this.blockedBy.push(...blockedBefore)
        return cell
    }

    /** §1.9: "A value outside this table, or an operation this table does not define, is refused." */
    refuse(kind: RefusalRecord['kind'], cause: string, lineIds: string[], openQuestion: RefusalRecord['openQuestion'] = null): void {
        this.refusals.push({
            refusalId: `${kind}#${this.checkId}#${this.refusals.length}`,
            kind,
            cause,
            stage: 10,
            clause: CLAUSE('§7.2'),
            openQuestion,
            affects: { lineIds, itemRefs: [], contractIds: [] },
        })
    }

    /**
     * SD-58 — a valid authoritative contribution whose required relationship cannot be established
     * because the necessary reference is not represented. The clause is blocked, naming the dependency;
     * it is not a violation, and never a collision. Gap before collision stays intact.
     */
    unestablishedCount = 0
    /** Why each blocked line blocked — so a block record can say which kind of failure it is. */
    readonly blockKind = new Map<string, GateBlockKind>()

    unestablished(lineId: string): void {
        this.unestablishedCount++
        if (!this.blockedBy.includes(lineId)) this.blockedBy.push(lineId)
        this.blockKind.set(lineId, 'NOT_REPRESENTABLE')
    }

    get blocked(): boolean {
        return this.blockedBy.length > 0 || this.missing.length > 0
    }

    /** The reason a blocked check gives, naming what it was waiting on rather than only that it waited. */
    get blockedWhy(): string {
        const parts: string[] = []
        if (this.blockedBy.length) parts.push(`${this.blockedBy.length} subject line(s) failed: ${this.blockedBy.slice(0, 4).join(', ')}`)
        if (this.missing.length) parts.push(`no line exists for ${[...new Set(this.missing)].slice(0, 4).join(', ')}`)
        return parts.join('; ')
    }
}

const classesOn = (ctx: GateContext, row: string) => ctx.classes.filter(c => c.row === row)
const lineOf = (classId: string, row: string) => `${classId}::${row}`

/**
 * **SD-63**, his generalization of 24 September, replacing the separate event and region rules:
 *
 *   "Open-text equality does not establish identity for a structural referent. Structural identity must
 *    be established through the registered reference/selector system. Where that identity cannot be
 *    established, withhold the verdict rather than infer identity from matching text."
 *
 * One rule, applied wherever a structural referent is read — objective references, information subjects,
 * consequence referents, objective-set members, modifier referents.
 *
 * The engine's registered structural reference is an element class id. So:
 *   HELD       the value names a class this game holds — identity established, comparisons decidable;
 *   DANGLING   the value has the form of a class id but names none — a violation the engine can
 *              establish, so it fails;
 *   OPEN_TEXT  anything else — no identity is established, nothing is compared, and the case is a gap
 *              rather than a failure (SD-58).
 */
type ReferenceIdentity = 'HELD' | 'DANGLING' | 'OPEN_TEXT'

function identityOf(ctx: GateContext, value: unknown): ReferenceIdentity {
    const text = String(value)
    if (ctx.classes.some(c => c.classId === text)) return 'HELD'
    return /^c:[^:]+:.+$/.test(text) ? 'DANGLING' : 'OPEN_TEXT'
}

function referentsOf(cell: Cell): unknown[] {
    if (cell.state !== 'DERIVED') return []
    const value = cell.value
    if (Array.isArray(value)) return value
    return value === null || value === undefined ? [] : [value]
}

/** The check-level rule of §7.1, applied to one check's clauses. */
function combine(clauses: ClauseResult[]): ClauseVerdict {
    if (clauses.some(c => c.verdict === 'FAIL')) return 'FAIL'
    if (clauses.some(c => c.verdict === 'NOT_EVALUABLE')) return 'NOT_EVALUABLE'
    return 'PASS'
}

/** A check returns its verdict and whatever it refused, so nothing is collected through shared state. */
interface CheckOutcome {
    check: CheckResult
    refusals: RefusalRecord[]
    /** SD-62 — one record per blocked clause, built here so none can be emitted without one. */
    blocks: GateBlock[]
}

function result(checkId: string, probe: Probe, clauses: ClauseResult[], why: string): CheckOutcome {
    const rows = [...new Set(probe.missing)]
    const blocks: GateBlock[] = clauses
        .filter(c => c.verdict === 'NOT_EVALUABLE')
        .map(c => {
            // SD-62 requires every block to identify its unresolved dependency. Where a check could not
            // name a specific line, what it consulted is the honest answer — a record that names nothing
            // would say only that something went wrong, which is what this ruling exists to prevent.
            const named = probe.blockedBy.length || rows.length
            return {
                checkId,
                clause: c.clause,
                kind: c.refusalId
                    ? ('SPECIFICATION_GAP' as const)
                    : probe.blockedBy.some(l => probe.blockKind.get(l) === 'NOT_REPRESENTABLE')
                      ? ('NOT_REPRESENTABLE' as const)
                      : ('KNOWLEDGE_GAP' as const),
                dependency: {
                    lineIds: named ? probe.blockedBy : probe.subjects,
                    rows: named || probe.subjects.length ? rows : ['(the check found no instance to range over)'],
                },
                reason: why,
                ...(c.refusalId ? { refusalId: c.refusalId } : {}),
            }
        })

    return {
        check: {
            checkId,
            verdict: combine(clauses),
            subjects: probe.subjects,
            why,
            clauses,
            pendingOn: probe.pendingOn,
            blockedBy: probe.blockedBy,
        },
        refusals: probe.refusals,
        blocks,
    }
}

/**
 * A pass must state how many applicable instances it ranged over (SD-54). `instances` is required
 * rather than optional so that a new clause cannot be added without answering the question.
 */
const pass = (clause: string, instances: number): ClauseResult => ({
    clause,
    verdict: 'PASS',
    basis: instances > 0 ? 'EVALUATED' : 'NO_APPLICABLE_INSTANCES',
    instances,
})
const fail = (clause: string, instances?: number): ClauseResult => ({ clause, verdict: 'FAIL', instances })
const notEvaluable = (clause: string, refusalId?: string): ClauseResult => ({ clause, verdict: 'NOT_EVALUABLE', refusalId })
const outside = (clause: string): ClauseResult => ({ clause, verdict: 'NOT_CHECKABLE_OUTSIDE_REPRESENTATION' })

// =================================================================================================
// The ten fully structural checks.
// =================================================================================================

/**
 * `GA-ROSTER-SUM` — outfield + goalkeepers + neutrals = the session's players.
 *
 * An open term makes this a satisfiability question (§7.1): the sum's reachable range must contain the
 * session's count. A gapped term blocks; it does not fail.
 */
function gaRosterSum(ctx: GateContext): CheckOutcome {
    const CLAUSE_TEXT = 'outfield + goalkeepers + neutrals = the session players'
    const probe = new Probe(ctx, 'GA-ROSTER-SUM')
    const teams = classesOn(ctx, 'P1')

    const players = probe.cell('game::E1')
    const neutrals = probe.cell('game::P5')
    const terms: Cell[] = [neutrals]
    for (const team of teams) {
        terms.push(probe.cell(lineOf(team.classId, 'P2')))
        terms.push(probe.cell(lineOf(team.classId, 'P3')))
    }

    if (!teams.length) probe.missing.push('P1 (no team class is instantiated)')
    if (players.state !== 'DERIVED' || probe.blocked) {
        return result('GA-ROSTER-SUM', probe, [notEvaluable(CLAUSE_TEXT)], probe.blockedWhy || 'the session player count is not derived')
    }

    const target = toRational(players.value)
    if (!target) {
        probe.refuse('VALUE_NOT_COMPARABLE', `the session player count ${JSON.stringify(players.value)} is not an exact number`, ['game::E1'])
        return result('GA-ROSTER-SUM', probe, [notEvaluable(CLAUSE_TEXT, probe.refusals[0].refusalId)], 'the player count is not a value §1.9 can compare')
    }

    // Each term contributes a closed range: a derived term contributes itself; an open term contributes
    // its authored bounds, and an unbounded open term makes the sum unbounded above.
    let low = ZERO
    let high: Rational | null = ZERO
    for (const term of terms) {
        if (term.state === 'DERIVED') {
            const exact = toRational(term.value)
            if (!exact) {
                probe.refuse('VALUE_NOT_COMPARABLE', `a roster term ${JSON.stringify(term.value)} is not an exact number`, [])
                return result('GA-ROSTER-SUM', probe, [notEvaluable(CLAUSE_TEXT, probe.refusals[0].refusalId)], 'a roster term is not a value §1.9 can compare')
            }
            low = add(low, exact)
            if (high) high = add(high, exact)
            continue
        }
        // OPEN — the reachable range widens by the term's bounds.
        const mins = term.state === 'OPEN' ? term.bounds.map(b => toRational(b.bound.min)).filter(Boolean) : []
        const maxes = term.state === 'OPEN' ? term.bounds.map(b => toRational(b.bound.max)).filter(Boolean) : []
        if (mins.length) low = add(low, mins[0] as Rational)
        if (maxes.length && high) high = add(high, maxes[0] as Rational)
        else high = null
    }

    const reachable = compare(low, target) <= 0 && (high === null || compare(target, high) <= 0)
    const clause = reachable ? pass(CLAUSE_TEXT, terms.length) : fail(CLAUSE_TEXT, terms.length)
    const why = reachable
        ? probe.pendingOn.length
            ? 'the sum can reach the session count within the open terms bounds'
            : 'the roster sums to the session count'
        : 'no assignment within the authored bounds sums to the session player count'
    return result('GA-ROSTER-SUM', probe, [clause], why)
}

/** Reads a geometric line as a §1.9 interval, refusing anything the value model cannot compare. */
function intervalOf(probe: Probe, lineId: string): { interval: Interval | null; blocked: boolean } {
    const cell = probe.cell(lineId)
    if (cell.state !== 'DERIVED') return { interval: null, blocked: true }
    const value: any = cell.value
    if (value && typeof value === 'object' && value.dynamic) {
        probe.refuse('VALUE_NOT_COMPARABLE', `a dynamic location (${String(value.dynamic)}) has no position in the representation; §1.9 refuses any geometric use of it`, [lineId])
        return { interval: null, blocked: false }
    }
    if (value && typeof value === 'object' && value.term) {
        probe.refuse('VALUE_NOT_COMPARABLE', `a relative position (${String(value.term)}) converts to an interval only once its referent resolves; §1.9 refuses rather than guesses`, [lineId])
        return { interval: null, blocked: false }
    }
    const interval = toInterval(value)
    if (!interval) {
        probe.refuse('VALUE_NOT_COMPARABLE', `${JSON.stringify(value)} is not an interval of exact rationals`, [lineId])
        return { interval: null, blocked: false }
    }
    return { interval, blocked: false }
}

/** `GA-ENVELOPE-FIT` — every region and object inside the area, non-empty. */
function gaEnvelopeFit(ctx: GateContext): CheckOutcome {
    const INSIDE = 'every region and object lies inside the area'
    const NON_EMPTY = 'every region and object is non-empty'
    const probe = new Probe(ctx, 'GA-ENVELOPE-FIT')

    const length = probe.cell('game::E2')
    const width = probe.cell('game::E3')
    const along = length.state === 'DERIVED' ? toRational(length.value) : null
    const across = width.state === 'DERIVED' ? toRational(width.value) : null

    const placed: { lineId: string; interval: Interval }[] = []
    const targets: { classId: string; alongRow: string; acrossRow: string }[] = [
        ...classesOn(ctx, 'S2').map(c => ({ classId: c.classId, alongRow: 'S5', acrossRow: 'S6' })),
        ...classesOn(ctx, 'O1').map(c => ({ classId: c.classId, alongRow: 'O4', acrossRow: 'O5' })),
    ]

    let refused = false
    for (const target of targets) {
        for (const row of [target.alongRow, target.acrossRow]) {
            const read = intervalOf(probe, lineOf(target.classId, row))
            if (read.interval) placed.push({ lineId: lineOf(target.classId, row), interval: read.interval })
            else if (!read.blocked) refused = true
        }
    }

    if (refused) {
        return result('GA-ENVELOPE-FIT', probe, [notEvaluable(INSIDE, probe.refusals[0]?.refusalId), notEvaluable(NON_EMPTY)], 'a placement is not a value §1.9 can compare')
    }
    if (!along || !across || probe.blocked) {
        return result('GA-ENVELOPE-FIT', probe, [notEvaluable(INSIDE), notEvaluable(NON_EMPTY)], probe.blockedWhy || 'the area dimensions are not derived')
    }

    const empty = placed.filter(p => compare(p.interval.lo, p.interval.hi) >= 0)
    const outsideArea = placed.filter(p => {
        const limit = p.interval.axis === 'along' ? along : across
        return lt(p.interval.lo, ZERO) || !lte(p.interval.hi, limit)
    })

    return result(
        'GA-ENVELOPE-FIT',
        probe,
        [outsideArea.length ? fail(INSIDE, placed.length) : pass(INSIDE, placed.length), empty.length ? fail(NON_EMPTY, placed.length) : pass(NON_EMPTY, placed.length)],
        placed.length
            ? `${placed.length} placement(s) checked; ${outsideArea.length} outside the area, ${empty.length} empty`
            : 'no region or object is placed, so nothing lies outside the area',
    )
}

/**
 * `GA-LAYOUT-FEASIBLE` — the geometric constraints over open lines are jointly satisfiable.
 *
 * The constraints the representation can express over an open geometric line are box constraints: each
 * open extent is bounded independently, and feasibility is the non-emptiness of each box intersected
 * with the area. A coupled constraint — one open extent bounded by another — has no representation
 * today and none occurs in the corpus; were one to appear, its bound would not read as an interval and
 * the check refuses rather than pretending to a general solver.
 */
function gaLayoutFeasible(ctx: GateContext): CheckOutcome {
    const CLAUSE_TEXT = 'the geometric constraints over open lines are jointly satisfiable'
    const probe = new Probe(ctx, 'GA-LAYOUT-FEASIBLE')

    const length = probe.cell('game::E2')
    const width = probe.cell('game::E3')
    const along = length.state === 'DERIVED' ? toRational(length.value) : null
    const across = width.state === 'DERIVED' ? toRational(width.value) : null

    const geometricRows = new Set(['S5', 'S6', 'O4', 'O5'])
    const open = ctx.lines.filter(l => geometricRows.has(l.row) && ctx.classified.get(l.lineId)?.verdict?.startsWith('FREE'))

    if (!open.length) return result('GA-LAYOUT-FEASIBLE', probe, [pass(CLAUSE_TEXT, 0)], 'no geometric line is open, so the constraint set is trivially satisfiable')
    for (const line of open) probe.cell(line.lineId)
    if (!along || !across) return result('GA-LAYOUT-FEASIBLE', probe, [notEvaluable(CLAUSE_TEXT)], 'the area dimensions are not derived')

    const infeasible: string[] = []
    for (const line of open) {
        const limit = line.row === 'S5' || line.row === 'O4' ? along : across
        const bounds = ctx.derived.get(line.lineId)?.bounding || []
        let lo = ZERO
        let hi = limit
        for (const bound of bounds) {
            // A bound this check cannot read is refused, never skipped. Skipping it would let the check
            // report a feasible layout while ignoring a constraint that might make it infeasible — a
            // PASS asserting more than was verified.
            const readable = bound.bound.kind === 'COUNT' || bound.bound.kind === 'INTERVAL'
            const min = readable ? toRational(bound.bound.min) : null
            const max = readable ? toRational(bound.bound.max) : null
            if (!readable || (bound.bound.min !== null && bound.bound.min !== undefined && !min) || (bound.bound.max !== null && bound.bound.max !== undefined && !max)) {
                probe.refuse(
                    'VALUE_NOT_COMPARABLE',
                    `a ${bound.bound.kind} bound on ${line.lineId} is not a linear constraint over exact rationals; feasibility is not decided by ignoring it`,
                    [line.lineId],
                )
                return result('GA-LAYOUT-FEASIBLE', probe, [notEvaluable(CLAUSE_TEXT, probe.refusals[0].refusalId)], 'a geometric bound is not a constraint this check can read')
            }
            if (min && compare(min, lo) > 0) lo = min
            if (max && compare(max, hi) < 0) hi = max
        }
        if (compare(lo, hi) > 0) infeasible.push(line.lineId)
    }

    return result(
        'GA-LAYOUT-FEASIBLE',
        probe,
        [infeasible.length ? fail(CLAUSE_TEXT, open.length) : pass(CLAUSE_TEXT, open.length)],
        infeasible.length ? `${infeasible.length} open extent(s) have no feasible value: ${infeasible.join(', ')}` : `${open.length} open extent(s) admit a joint assignment inside the area`,
    )
}

/** `GA-REGION-FUNCTION` — every instantiated region serves at least one supported function. */
function gaRegionFunction(ctx: GateContext): CheckOutcome {
    const SERVES = 'every instantiated region serves at least one function'
    const REGISTERED = 'every function a region serves is a registered member'
    const probe = new Probe(ctx, 'GA-REGION-FUNCTION')
    const regions = classesOn(ctx, 'S2')
    if (!regions.length) return result('GA-REGION-FUNCTION', probe, [pass(SERVES, 0), pass(REGISTERED, 0)], 'no region is instantiated')

    const vocabulary = ctx.index.vocabularies.get('S4.functions') || []
    const functionless: string[] = []
    const unregistered: string[] = []
    let examined = 0

    for (const region of regions) {
        const cell = probe.cell(lineOf(region.classId, 'S4'))
        if (cell.state !== 'DERIVED') continue
        const members = Array.isArray(cell.value) ? cell.value : String(cell.value ?? '').split(/\s*,\s*/).filter(Boolean)
        if (!members.length) functionless.push(region.classId)
        examined += members.length
        for (const member of members) if (!vocabulary.includes(String(member))) unregistered.push(`${region.classId}:${member}`)
    }

    if (probe.blocked) return result('GA-REGION-FUNCTION', probe, [notEvaluable(SERVES), notEvaluable(REGISTERED)], probe.blockedWhy)
    return result(
        'GA-REGION-FUNCTION',
        probe,
        [
            functionless.length ? fail(SERVES, regions.length) : pass(SERVES, regions.length),
            unregistered.length ? fail(REGISTERED, examined) : pass(REGISTERED, examined),
        ],
        `${regions.length} region(s); ${functionless.length} serve no function; ${unregistered.length} function(s) not in the registered list`,
    )
}

/** `GA-REFERENCE-INTEGRITY` — every reference names a held element; no reference defect implicates it. */
function gaReferenceIntegrity(ctx: GateContext): CheckOutcome {
    const NO_DEFECT = 'no reference defect implicates a reference of this game'
    const NAMES_HELD = 'every derived reference names a held element'
    const probe = new Probe(ctx, 'GA-REFERENCE-INTEGRITY')

    const defects = ctx.failures.filter(f => f.kind === 'REFERENCE_DEFECT')
    const referenceRows = ['J2', 'V5', 'V14b', 'V16', 'T4', 'P10']
    const dangling: string[] = []
    let resolved = 0
    let openText = 0

    for (const line of ctx.lines) {
        if (!referenceRows.includes(line.row)) continue
        const cell = probe.cell(line.lineId)
        for (const name of referentsOf(cell)) {
            if (typeof name === 'object' && (name as any).dynamic) continue // 'where the ball went out' — a token, not an element
            const identity = identityOf(ctx, name)
            if (identity === 'HELD') resolved++
            else if (identity === 'DANGLING') dangling.push(`${line.lineId} → ${String(name)}`)
            else {
                // SD-57/SD-58: open text establishes no identity, so it establishes no violation either.
                // The relationship is unestablished — a gap, naming the line — not a failed reference.
                openText++
                probe.unestablished(line.lineId)
            }
        }
    }

    // A reference defect is a fact about the loaded knowledge, not about a line's value, so it is
    // reported even where every line it touches is a gap. A blocked line only withholds the second
    // clause.
    const loadedItems = ctx.contracts.reduce((total, c) => total + (c.items || []).length, 0)
    const defectClause = defects.length ? fail(NO_DEFECT, loadedItems) : pass(NO_DEFECT, loadedItems)
    const heldClause = dangling.length ? fail(NAMES_HELD, resolved + dangling.length) : probe.blocked ? notEvaluable(NAMES_HELD) : pass(NAMES_HELD, resolved)

    return result(
        'GA-REFERENCE-INTEGRITY',
        probe,
        [defectClause, heldClause],
        `${defects.length} reference defect(s) on the loaded knowledge; ${resolved} reference(s) resolved; ${dangling.length} named no held element; ${openText} established no structural identity`,
    )
}

/** `GA-TRIGGER-UNIQUE` — no two transitions share a trigger key. */
function gaTriggerUnique(ctx: GateContext): CheckOutcome {
    const CLAUSE_TEXT = 'no two transitions share a trigger key'
    const COLLIDES = 'no transition collides'
    const probe = new Probe(ctx, 'GA-TRIGGER-UNIQUE')
    const transitions = classesOn(ctx, 'T1')
    if (transitions.length < 2) {
        return result('GA-TRIGGER-UNIQUE', probe, [pass(CLAUSE_TEXT, transitions.length), pass(COLLIDES, transitions.length)], `${transitions.length} transition(s): no pair can share a key`)
    }

    // The key is the transition's own selector: T1 is "keyed by trigger", and its registered selector
    // attributes are the trigger and its qualifiers.
    const seen = new Map<string, string[]>()
    for (const transition of transitions) {
        const key = transition.constraints.any
            ? '*'
            : transition.constraints.terms
                  .map(t => `${t.attribute}${t.op}${'value' in t ? t.value : (t as any).values.join('|')}`)
                  .sort()
                  .join('&')
        seen.set(key, [...(seen.get(key) || []), transition.classId])
    }

    const shared = [...seen.entries()].filter(([, ids]) => ids.length > 1)

    // The package's second clause: "none collides". A transition line that stage 6 left UNRESOLVED is a
    // collision on that transition, and the check says so rather than reporting only key uniqueness.
    const collided = [...ctx.classified.values()].filter(
        l => l.verdict === 'UNRESOLVED' && transitions.some(t => l.lineId.startsWith(`${t.classId}::`)),
    )
    for (const line of collided) probe.cell(line.lineId)

    return result(
        'GA-TRIGGER-UNIQUE',
        probe,
        [
            shared.length ? fail(CLAUSE_TEXT, transitions.length) : pass(CLAUSE_TEXT, transitions.length),
            collided.length ? fail(COLLIDES, transitions.length) : pass(COLLIDES, transitions.length),
        ],
        `${shared.length} trigger key(s) claimed by more than one transition; ${collided.length} transition line(s) collided`,
    )
}

/** `GA-TRANSITION-COHERENCE` — `CONTINUE` ⇒ no placement; `STOP_RESUME` ⇒ taker and region. */
function gaTransitionCoherence(ctx: GateContext): CheckOutcome {
    const CONTINUE_CLAUSE = 'a CONTINUE transition carries no placement'
    const RESUME_CLAUSE = 'a STOP_RESUME transition carries a taker and a region'
    const probe = new Probe(ctx, 'GA-TRANSITION-COHERENCE')
    const transitions = classesOn(ctx, 'T1')
    if (!transitions.length) return result('GA-TRANSITION-COHERENCE', probe, [pass(CONTINUE_CLAUSE, 0), pass(RESUME_CLAUSE, 0)], 'no transition is instantiated')

    const continueViolations: string[] = []
    const resumeViolations: string[] = []
    let blockedAny = false
    let continueSeen = 0
    let resumeSeen = 0

    for (const transition of transitions) {
        const state = probe.cell(lineOf(transition.classId, 'T6'))
        if (state.state !== 'DERIVED') {
            blockedAny = true
            continue
        }
        const carries = (cell: Cell) => cell.state === 'DERIVED' && cell.value !== null && cell.value !== undefined

        if (String(state.value) === 'CONTINUE') {
            continueSeen++
            // An unauthored placement *confirms* this clause, so it is read without blocking on it.
            const actor = probe.peek(lineOf(transition.classId, 'T3'))
            const region = probe.peek(lineOf(transition.classId, 'T4'))
            const method = probe.peek(lineOf(transition.classId, 'T5'))
            if (carries(actor) || carries(region) || carries(method)) continueViolations.push(transition.classId)
        } else if (String(state.value) === 'STOP_RESUME') {
            resumeSeen++
            // Here the clause needs the values, so an absent one genuinely blocks it.
            const actor = probe.cell(lineOf(transition.classId, 'T3'))
            const region = probe.cell(lineOf(transition.classId, 'T4'))
            if (!carries(actor) || !carries(region)) {
                if (actor.state === 'FAILED' || region.state === 'FAILED') blockedAny = true
                else resumeViolations.push(transition.classId)
            }
        }
    }

    const continueClause = continueViolations.length ? fail(CONTINUE_CLAUSE, continueSeen) : blockedAny ? notEvaluable(CONTINUE_CLAUSE) : pass(CONTINUE_CLAUSE, continueSeen)
    const resumeClause = resumeViolations.length ? fail(RESUME_CLAUSE, resumeSeen) : blockedAny ? notEvaluable(RESUME_CLAUSE) : pass(RESUME_CLAUSE, resumeSeen)
    return result(
        'GA-TRANSITION-COHERENCE',
        probe,
        [continueClause, resumeClause],
        `${continueViolations.length} CONTINUE transition(s) carry a placement; ${resumeViolations.length} STOP_RESUME transition(s) lack a taker or region`,
    )
}

/** `GA-INFORMATION` — information rules name held subjects and registered triggers. */
function gaInformation(ctx: GateContext): CheckOutcome {
    const SUBJECT = 'every information rule names a held subject'
    const TRIGGER = 'every information rule names a registered trigger'
    const probe = new Probe(ctx, 'GA-INFORMATION')
    const rules = classesOn(ctx, 'V15')
    if (!rules.length) return result('GA-INFORMATION', probe, [pass(SUBJECT, 0), pass(TRIGGER, 0)], 'no information rule is instantiated')

    const held = new Set(ctx.classes.map(c => c.classId))
    const vocabulary = ctx.index.vocabularies.get('trigger') || []
    const badSubjects: string[] = []
    const badTriggers: string[] = []

    for (const rule of rules) {
        // SD-63 — a subject that establishes no structural identity withholds the verdict; only a
        // reference that resolves *and* names nothing held is a violation the engine can establish.
        const subjectLine = lineOf(rule.classId, 'V16')
        const subject = probe.cell(subjectLine)
        if (subject.state === 'DERIVED') {
            const identity = identityOf(ctx, subject.value)
            if (identity === 'DANGLING') badSubjects.push(rule.classId)
            else if (identity === 'OPEN_TEXT') probe.unestablished(subjectLine)
        }
        const trigger = probe.cell(lineOf(rule.classId, 'V17'))
        if (trigger.state === 'DERIVED') {
            const name = typeof trigger.value === 'object' && trigger.value ? String((trigger.value as any).trigger) : String(trigger.value)
            if (!vocabulary.includes(name)) badTriggers.push(`${rule.classId}:${name}`)
        }
    }

    const subjectClause = badSubjects.length ? fail(SUBJECT, rules.length) : probe.blocked ? notEvaluable(SUBJECT) : pass(SUBJECT, rules.length)
    const triggerClause = badTriggers.length ? fail(TRIGGER, rules.length) : probe.blocked ? notEvaluable(TRIGGER) : pass(TRIGGER, rules.length)
    return result('GA-INFORMATION', probe, [subjectClause, triggerClause], `${badSubjects.length} unheld subject(s); ${badTriggers.length} unregistered trigger(s)`)
}

/** `GA-TIME-WINDOWS` — window fields in vocabulary; duration inside the session. */
function gaTimeWindows(ctx: GateContext): CheckOutcome {
    const STARTS_ON = 'every window starts on a registered trigger'
    const EXPIRY = 'every window expiry effect is a registered member'
    const DURATION = 'every window duration lies inside the session'
    const probe = new Probe(ctx, 'GA-TIME-WINDOWS')
    const windows = classesOn(ctx, 'V23')
    if (!windows.length) {
        return result('GA-TIME-WINDOWS', probe, [pass(STARTS_ON, 0), pass(EXPIRY, 0), pass(DURATION, 0)], 'no time window is instantiated')
    }

    const triggerVocabulary = ctx.index.vocabularies.get('trigger') || []
    const expiryVocabulary = ctx.index.vocabularies.get('V26.expiryEffect') || []
    const session = probe.cell('game::E4')
    const badStarts: string[] = []
    const badExpiry: string[] = []
    const tooLong: string[] = []
    let startsSeen = 0
    let expirySeen = 0
    let durationSeen = 0

    for (const window of windows) {
        const startsOn = probe.cell(lineOf(window.classId, 'V24'))
        if (startsOn.state === 'DERIVED') {
            startsSeen++
            const name = typeof startsOn.value === 'object' && startsOn.value ? String((startsOn.value as any).trigger) : String(startsOn.value)
            if (!triggerVocabulary.includes(name)) badStarts.push(`${window.classId}:V24=${name}`)
        }
        const expiry = probe.cell(lineOf(window.classId, 'V26'))
        if (expiry.state === 'DERIVED' && expiryVocabulary.length) {
            expirySeen++
            if (!expiryVocabulary.includes(String(expiry.value))) badExpiry.push(`${window.classId}:V26=${String(expiry.value)}`)
        }

        const duration = probe.cell(lineOf(window.classId, 'V25'))
        if (duration.state === 'DERIVED' && session.state === 'DERIVED') {
            durationSeen++
            const seconds = toRational(duration.value)
            const minutes = toRational(session.value)
            // V25 is seconds and E4 is minutes: the comparison is made in seconds, exactly.
            if (seconds && minutes) {
                const sessionSeconds = { n: minutes.n * 60n, d: minutes.d }
                if (compare(seconds, sessionSeconds) > 0) tooLong.push(window.classId)
            }
        }
    }

    const clauseFor = (text: string, problems: string[], seen: number): ClauseResult =>
        problems.length ? fail(text, seen) : seen === 0 && probe.blocked ? notEvaluable(text) : pass(text, seen)

    return result(
        'GA-TIME-WINDOWS',
        probe,
        [clauseFor(STARTS_ON, badStarts, startsSeen), clauseFor(EXPIRY, badExpiry, expirySeen), clauseFor(DURATION, tooLong, durationSeen)],
        `${badStarts.length} unregistered start trigger(s); ${badExpiry.length} unregistered expiry effect(s); ${tooLong.length} window(s) longer than the session`,
    )
}

/**
 * `GA-NO-FAILED-LINE` — no enumerated line is `failed`.
 *
 * §1.4: "`failed` is `NOT_AUTHORED` or `UNRESOLVED`, or an invented line in checking mode." This is the
 * check that owns incompleteness. The others block on the lines they need; this one states plainly that
 * the game is not complete, and names every line.
 */
function gaNoFailedLine(ctx: GateContext): CheckOutcome {
    const CLAUSE_TEXT = 'no enumerated line is failed'
    const probe = new Probe(ctx, 'GA-NO-FAILED-LINE')
    const enumerated = [...ctx.classified.values()].filter(l => l.lineState === 'ENUMERATED').length
    const failed = [...ctx.classified.values()]
        .filter(l => l.lineState === 'ENUMERATED' && (l.verdict === 'NOT_AUTHORED' || l.verdict === 'UNRESOLVED' || l.verdict === 'INVENTED'))
        .map(l => l.lineId)
        .sort()

    for (const lineId of failed) if (!probe.subjects.includes(lineId)) probe.subjects.push(lineId)
    return result(
        'GA-NO-FAILED-LINE',
        probe,
        [failed.length ? fail(CLAUSE_TEXT, enumerated) : pass(CLAUSE_TEXT, enumerated)],
        failed.length ? `${failed.length} enumerated line(s) are failed: ${failed.slice(0, 6).join(', ')}${failed.length > 6 ? ', …' : ''}` : 'every enumerated line is derived or open',
    )
}

// =================================================================================================
// The four checks SD-43 splits: the structural clause executes, the state-of-play clause is reported
// as not established. "Can fire" is read through SD-44 — a structurally reachable trigger.
// =================================================================================================

/** `GA-EFFECT-TYPED`. */
function gaEffectTyped(ctx: GateContext): CheckOutcome {
    const TYPED = "every consequence's effect is a registered member of its vocabulary"
    const UNIQUE = 'every applicable referent resolves to exactly one element'
    const REACHABLE = 'every consequence trigger is structurally reachable'
    const STATES = 'in every state its trigger can fire from'
    const probe = new Probe(ctx, 'GA-EFFECT-TYPED')
    const consequences = classesOn(ctx, 'V11')
    if (!consequences.length) {
        return result('GA-EFFECT-TYPED', probe, [pass(TYPED, 0), pass(UNIQUE, 0), pass(REACHABLE, 0), outside(STATES)], 'no consequence is instantiated')
    }

    const effects = ctx.index.vocabularies.get('V13.effect') || []
    const typedProblems: string[] = []
    const uniqueProblems: string[] = []
    const reachableProblems: string[] = []
    let typedSeen = 0
    let uniqueSeen = 0
    let reachableSeen = 0

    for (const consequence of consequences) {
        const effect = probe.cell(lineOf(consequence.classId, 'V13'))
        if (effect.state === 'DERIVED') {
            typedSeen++
            if (effects.length && !effects.includes(String(effect.value))) typedProblems.push(`${consequence.classId}: effect ${String(effect.value)} is not registered`)
        }

        // The applicable referent is the one its effect selects: ACCESS names a region, COUNT_CHANGE a
        // delta. Only the applicable one is required to resolve.
        const referentRow = String(effect.state === 'DERIVED' ? effect.value : '') === 'ACCESS' ? 'V14b' : 'V14c'
        const referent = probe.cell(lineOf(consequence.classId, referentRow))
        if (referent.state === 'DERIVED' && referentRow === 'V14b' && identityOf(ctx, referent.value) === 'OPEN_TEXT') {
            probe.unestablished(lineOf(consequence.classId, referentRow)) // SD-63
        } else if (referent.state === 'DERIVED' && referentRow === 'V14b') {
            uniqueSeen++
            const target = ctx.classes.find(c => c.classId === String(referent.value))
            if (!target) uniqueProblems.push(`${consequence.classId}: region referent names no held element`)
            // "resolves to exactly one element": under SD-47 a referent names a class, and a class whose
            // cardinality admits more than one element does not resolve uniquely (V14b: "resolving
            // uniquely"). Without this the check would claim a uniqueness it never examined.
            else if (target.cardinality.max === null || target.cardinality.max > 1) {
                uniqueProblems.push(`${consequence.classId}: region referent names a class of up to ${target.cardinality.max ?? 'unbounded'} elements, so it does not resolve to exactly one`)
            }
        }

        const trigger = probe.cell(lineOf(consequence.classId, 'V12'))
        if (trigger.state === 'DERIVED') {
            reachableSeen++
            const name = typeof trigger.value === 'object' && trigger.value ? String((trigger.value as any).trigger) : String(trigger.value)
            // SD-44: only a structurally reachable trigger counts.
            if (!ctx.triggers.some(t => t === name || t.startsWith(`${name}{`))) reachableProblems.push(`${consequence.classId}: trigger ${name} is not structurally reachable`)
        }
    }

    const clauseFor = (text: string, problems: string[], seen: number): ClauseResult =>
        problems.length ? fail(text, seen) : seen === 0 && probe.blocked ? notEvaluable(text) : pass(text, seen)

    return result(
        'GA-EFFECT-TYPED',
        probe,
        [clauseFor(TYPED, typedProblems, typedSeen), clauseFor(UNIQUE, uniqueProblems, uniqueSeen), clauseFor(REACHABLE, reachableProblems, reachableSeen), outside(STATES)],
        [...typedProblems, ...uniqueProblems, ...reachableProblems].slice(0, 3).join('; ') || `${consequences.length} consequence(s) examined`,
    )
}

/** `GA-ONE-PRIMARY-EVENT`. */
function gaOnePrimaryEvent(ctx: GateContext): CheckOutcome {
    const ONE = 'exactly one primary event, of a registered kind'
    const VALUE = 'the base value is derived and numeric'
    const POSITION = 'every member of the event reference has a space position'
    const STATES = 'whenever it can fire'
    const probe = new Probe(ctx, 'GA-ONE-PRIMARY-EVENT')

    // Existence: V0 is "exactly one element (SD-06)". Where no V0 item is authored, SD-06 entails the
    // one primary event itself, so its citability is what makes this clause pass.
    const events = classesOn(ctx, 'V0')
    const entailedBySd06 = ctx.index.citableStandingDecisions.has('SD-06')
    const kind = probe.cell('game::V1')
    const value = probe.cell('game::V2')

    let oneClause: ClauseResult
    const eventCount = events.length || (entailedBySd06 ? 1 : 0)
    if (events.length > 1) oneClause = fail(ONE, events.length)
    else if (events.length === 0 && !entailedBySd06) oneClause = fail(ONE, 0)
    else if (kind.state === 'DERIVED') {
        const kinds = ctx.index.vocabularies.get('V1.kind') || []
        oneClause = kinds.length && !kinds.includes(String(kind.value)) ? fail(ONE, eventCount) : pass(ONE, eventCount)
    } else oneClause = notEvaluable(ONE)

    const valueClause = value.state === 'DERIVED' ? (toRational(value.value) ? pass(VALUE, 1) : fail(VALUE, 1)) : notEvaluable(VALUE)

    // "every member of its reference has a space position" — each condition's referents must name a
    // held element that carries a derived position. Previously claimed and never examined.
    const positioned: string[] = []
    const unpositioned: string[] = []
    let positionBlocked = false
    for (const condition of classesOn(ctx, 'V3')) {
        const referents = probe.cell(lineOf(condition.classId, 'V5'))
        if (referents.state !== 'DERIVED') {
            positionBlocked = true
            continue
        }
        for (const name of Array.isArray(referents.value) ? referents.value : [referents.value]) {
            // SD-63 — open text establishes no identity, so it establishes no violation either.
            if (identityOf(ctx, name) === 'OPEN_TEXT') {
                probe.unestablished(lineOf(condition.classId, 'V5'))
                positionBlocked = true
                continue
            }
            const target = ctx.classes.find(c => c.classId === String(name))
            if (!target) {
                unpositioned.push(`${String(name)} names no held element`)
                continue
            }
            const rows = target.row === 'S2' ? ['S5', 'S6'] : target.row === 'O1' ? ['O4', 'O5'] : null
            if (!rows) {
                unpositioned.push(`${String(name)} is not an element the space positions`)
                continue
            }
            const cells = rows.map(r => probe.cell(lineOf(target.classId, r)))
            if (cells.every(c => c.state === 'DERIVED')) positioned.push(String(name))
            else positionBlocked = true
        }
    }
    const positionClause = unpositioned.length ? fail(POSITION, positioned.length + unpositioned.length) : positionBlocked ? notEvaluable(POSITION) : pass(POSITION, positioned.length)

    return result(
        'GA-ONE-PRIMARY-EVENT',
        probe,
        [oneClause, valueClause, positionClause, outside(STATES)],
        `${events.length || (entailedBySd06 ? 1 : 0)} primary event(s); ${positioned.length} positioned referent(s); ${unpositioned.length} unpositioned`,
    )
}

/**
 * `GA-DIRECTION`.
 *
 * The canonical wording fuses three claims. They are reported separately, because a single clause would
 * make a `PASS` assert things the engine never checked — which is the defect he found in
 * `GA-RESIDUAL-SPACE` ("two claims fused, and neither belongs here") before SD-45 removed it.
 */
function gaDirection(ctx: GateContext): CheckOutcome {
    const ATTACKS = 'each team has an objective it attacks'
    const OPPOSITE = "the two teams' objectives lie at opposite ends of the axis"
    const NO_CHANGE = "no represented transition or consequence changes a team's direction or objective ends"
    const PERCEIVED = 'perceivable, and stable as experienced in play'
    const probe = new Probe(ctx, 'GA-DIRECTION')

    // Nothing the representation can express changes a direction: the effect vocabulary holds only
    // ACCESS and COUNT_CHANGE. This is a structural fact about the register, checked against it rather
    // than asserted, so that adding a direction-changing effect would make this clause start failing.
    const effects = ctx.index.vocabularies.get('V13.effect') || []
    const directional = effects.filter(e => /direction|end|attack|swap|switch/i.test(e))
    const noChangeClause = directional.length ? fail(NO_CHANGE, effects.length) : pass(NO_CHANGE, effects.length)

    const teams = classesOn(ctx, 'P1')
    const objectives = classesOn(ctx, 'J1')
    probe.cell('game::S1') // the axis
    const length = probe.cell('game::E2')

    if (!teams.length || !objectives.length) {
        probe.missing.push(!teams.length ? 'P1 (no team class)' : 'J1 (no objective class)')
        return result('GA-DIRECTION', probe, [notEvaluable(ATTACKS), notEvaluable(OPPOSITE), noChangeClause, outside(PERCEIVED)], probe.blockedWhy)
    }

    // Which designation each team class carries, and which objectives name it.
    const designationOf = (cls: ElementClass) => {
        const term = cls.constraints.terms.find(t => t.attribute === 'team')
        return term && 'value' in term ? String(term.value) : null
    }
    const attacked = new Map<string, string[]>()
    for (const objective of objectives) {
        const team = probe.cell(lineOf(objective.classId, 'J3'))
        if (team.state !== 'DERIVED') continue
        attacked.set(String(team.value), [...(attacked.get(String(team.value)) || []), objective.classId])
    }

    const unattached: string[] = []
    let undesignated = 0
    for (const team of teams) {
        const designation = designationOf(team)
        if (!designation) {
            undesignated++
            probe.missing.push(`${team.classId} (the team class carries no designation)`)
            continue
        }
        if (!attacked.has(designation)) unattached.push(`${team.classId} (${designation}) attacks no objective`)
    }
    if (objectives.length && !attacked.size) probe.missing.push('J3 (no objective names the team that attacks it)')

    const attacksClause = unattached.length ? fail(ATTACKS, teams.length) : undesignated || probe.blocked ? notEvaluable(ATTACKS) : pass(ATTACKS, teams.length)

    // Opposite ends: an objective's end is the end of the axis its referent sits in. `lo + hi` against
    // the area length compares the referent's midpoint with the centre without dividing.
    const endOf = (objectiveClassId: string): 'LOW' | 'HIGH' | 'CENTRE' | null => {
        const reference = probe.cell(lineOf(objectiveClassId, 'J2'))
        if (reference.state !== 'DERIVED' || length.state !== 'DERIVED') return null
        // SD-63 — an objective reference that is open text establishes no identity, so no end is read.
        if (identityOf(ctx, reference.value) === 'OPEN_TEXT') {
            probe.unestablished(lineOf(objectiveClassId, 'J2'))
            return null
        }
        const referent = ctx.classes.find(c => c.classId === String(reference.value))
        if (!referent) return null
        const alongRow = referent.row === 'S2' ? 'S5' : referent.row === 'O1' ? 'O4' : null
        if (!alongRow) return null
        const read = intervalOf(probe, lineOf(referent.classId, alongRow))
        if (!read.interval) return null
        const area = toRational(length.value)
        if (!area) return null
        const span = add(read.interval.lo, read.interval.hi)
        const side = compare(span, area)
        return side < 0 ? 'LOW' : side > 0 ? 'HIGH' : 'CENTRE'
    }

    let oppositeClause: ClauseResult
    if (teams.length !== 2) {
        oppositeClause = notEvaluable(OPPOSITE)
    } else {
        const ends = [...attacked.values()].map(ids => endOf(ids[0]))
        if (ends.length !== 2 || ends.some(e => e === null)) oppositeClause = notEvaluable(OPPOSITE)
        else if (ends[0] === 'CENTRE' || ends[1] === 'CENTRE' || ends[0] === ends[1]) oppositeClause = fail(OPPOSITE, 2)
        else oppositeClause = pass(OPPOSITE, 2)
    }

    return result(
        'GA-DIRECTION',
        probe,
        [attacksClause, oppositeClause, noChangeClause, outside(PERCEIVED)],
        unattached.length
            ? unattached.join('; ')
            : `${teams.length} team class(es), ${attacked.size} designation(s) with an objective; ${directional.length} direction-changing effect(s) in the register`,
    )
}

/** `GA-OBJECTIVE-SETS`. */
function gaObjectiveSets(ctx: GateContext): CheckOutcome {
    const MEMBERS = 'every member of an objective set resolves to a held element'
    const MINIMUM = 'the live cardinality does not exceed the member count'
    const NAMED = 'the named initial member is one of the members'
    const ASSIGNMENT = 'every structurally reachable persistence trigger maps to an assignment entry'
    const SCOPE = 'while the set is in scope, across the states of play between those triggers'
    const probe = new Probe(ctx, 'GA-OBJECTIVE-SETS')
    const sets = classesOn(ctx, 'J5')
    if (!sets.length) {
        return result('GA-OBJECTIVE-SETS', probe, [pass(MEMBERS, 0), pass(MINIMUM, 0), pass(NAMED, 0), pass(ASSIGNMENT, 0), outside(SCOPE)], 'no objective set is instantiated')
    }

    const held = new Set(ctx.classes.map(c => c.classId))
    const memberProblems: string[] = []
    const minimumProblems: string[] = []
    const namedProblems: string[] = []
    const assignmentProblems: string[] = []
    let membersSeen = 0
    let minimumSeen = 0
    let namedSeen = 0
    let assignmentSeen = 0

    for (const set of sets) {
        const members = probe.cell(lineOf(set.classId, 'J7'))
        const minimum = probe.cell(lineOf(set.classId, 'J8'))
        const initial = probe.cell(lineOf(set.classId, 'J9'))
        const persistence = probe.cell(lineOf(set.classId, 'J10'))

        const list = members.state === 'DERIVED' ? (Array.isArray(members.value) ? members.value : [members.value]) : null
        if (list) {
            for (const member of list) {
                // SD-63 — withhold rather than infer identity from text.
                const identity = identityOf(ctx, member)
                if (identity === 'OPEN_TEXT') {
                    probe.unestablished(lineOf(set.classId, 'J7'))
                    continue
                }
                membersSeen++
                if (identity === 'DANGLING') memberProblems.push(`${set.classId}: member ${String(member)} resolves to no held element`)
            }
            if (minimum.state === 'DERIVED') {
                minimumSeen++
                const min = toRational(minimum.value)
                if (min && compare(min, { n: BigInt(list.length), d: 1n }) > 0) minimumProblems.push(`${set.classId}: live cardinality exceeds the member count`)
            }
            if (initial.state === 'DERIVED' && initial.value !== null) {
                namedSeen++
                if (!list.map(String).includes(String(initial.value))) namedProblems.push(`${set.classId}: the named initial member is not one of the members`)
            }
        }

        if (persistence.state === 'DERIVED') {
            const triggers = Array.isArray(persistence.value) ? persistence.value : [persistence.value]
            const entries = classesOn(ctx, 'J11a')
            for (const trigger of triggers) {
                const name = typeof trigger === 'object' && trigger ? String((trigger as any).trigger) : String(trigger)
                // SD-44: "an assignment yields a member under every **structurally reachable** trigger".
                // A trigger the game cannot reach places no demand on the assignment.
                if (!ctx.triggers.some(t => t === name || t.startsWith(`${name}{`))) continue
                assignmentSeen++
                const matching = entries.filter(e => e.constraints.terms.some(t => t.attribute === 'on' && 'value' in t && t.value === name))
                if (!matching.length) assignmentProblems.push(`${set.classId}: structurally reachable persistence trigger ${name} maps to no assignment entry`)
                for (const entry of matching) {
                    const yields = probe.cell(lineOf(entry.classId, 'J11b'))
                    if (yields.state === 'DERIVED' && typeof yields.value === 'object' && yields.value && (yields.value as any).procedure) {
                        probe.refuse('RULE_NOT_EXECUTABLE', `${entry.classId}: an assignment rule authored as a procedure over members has no executable form (§1.9)`, [lineOf(entry.classId, 'J11b')])
                    }
                }
            }
        }
    }

    if (probe.refusals.length) {
        const id = probe.refusals[0].refusalId
        return result(
            'GA-OBJECTIVE-SETS',
            probe,
            [notEvaluable(MEMBERS, id), notEvaluable(MINIMUM, id), notEvaluable(NAMED, id), notEvaluable(ASSIGNMENT, id), outside(SCOPE)],
            probe.refusals[0].cause,
        )
    }

    const clauseFor = (text: string, problems: string[], seen: number): ClauseResult =>
        problems.length ? fail(text, seen) : seen === 0 && probe.blocked ? notEvaluable(text) : pass(text, seen)

    return result(
        'GA-OBJECTIVE-SETS',
        probe,
        [
            clauseFor(MEMBERS, memberProblems, membersSeen),
            clauseFor(MINIMUM, minimumProblems, minimumSeen),
            clauseFor(NAMED, namedProblems, namedSeen),
            clauseFor(ASSIGNMENT, assignmentProblems, assignmentSeen),
            outside(SCOPE),
        ],
        [...memberProblems, ...minimumProblems, ...namedProblems, ...assignmentProblems].slice(0, 3).join('; ') || `${sets.length} objective set(s) examined`,
    )
}

// =================================================================================================
// The specification gap (F2).
// =================================================================================================

/**
 * `GA-MODIFIER-OVERLAP` — the `region` case executes; `object` and `event` have no authored test.
 *
 * His ruling: the information **is** represented, so this is a specification gap, not something outside
 * the representation. It blocks **the affected cases only** — a game with no such modifier is
 * unaffected. Its semantics are not invented here.
 */
function gaModifierOverlap(ctx: GateContext): CheckOutcome {
    const REGION = 'no two value modifiers with region conditions overlap'
    const EVENT = 'no two value modifiers with event conditions overlap'
    const OBJECT = 'no two value modifiers with object conditions overlap'
    const probe = new Probe(ctx, 'GA-MODIFIER-OVERLAP')
    const modifiers = classesOn(ctx, 'V7')

    const typeOf = (cls: ElementClass) => {
        const term = cls.constraints.terms.find(t => t.attribute === 'condition.type')
        return term && 'value' in term ? String(term.value) : null
    }
    const regions = modifiers.filter(m => typeOf(m) === 'region')
    const events = modifiers.filter(m => typeOf(m) === 'event')
    const objects = modifiers.filter(m => typeOf(m) === 'object')

    // The region case executes. Two modifiers overlap when their referent sets intersect **by
    // structural identity** — SD-57. A referent that establishes no identity is not compared as a text
    // token, because that would promote open-text equality into identity; it blocks instead (SD-58).
    const claimed = new Map<string, string[]>()
    let comparable = 0
    for (const modifier of regions) {
        const cell = probe.cell(lineOf(modifier.classId, 'V8b'))
        for (const referent of referentsOf(cell)) {
            if (identityOf(ctx, referent) !== 'HELD') {
                probe.unestablished(lineOf(modifier.classId, 'V8b'))
                continue
            }
            comparable++
            claimed.set(String(referent), [...(claimed.get(String(referent)) || []), modifier.classId])
        }
    }
    const overlapping = [...claimed.entries()].filter(([, ids]) => ids.length > 1)
    const regionClause = overlapping.length
        ? fail(REGION, regions.length)
        : probe.blockedBy.length
          ? notEvaluable(REGION)
          : pass(REGION, regions.length)

    const clauses: ClauseResult[] = [regionClause]
    const notes: string[] = []

    // SD-58/SD-61 — the event case. Identity comes only from a registered structural reference; where the
    // referents are open text the relationship is simply not representable, which is a gap, not a
    // specification defect. Where they do resolve, the overlap test itself remains unspecified (SD-60),
    // and its semantics are not invented here.
    if (!events.length) {
        clauses.push(pass(EVENT, 0))
    } else {
        const unresolved = events.filter(m => referentsOf(probe.cell(lineOf(m.classId, 'V8b'))).some(r => identityOf(ctx, r) !== 'HELD'))
        for (const modifier of unresolved) probe.unestablished(lineOf(modifier.classId, 'V8b'))
        if (unresolved.length === events.length) {
            clauses.push(notEvaluable(EVENT))
            notes.push(`${events.length} event-conditioned modifier(s) whose referents establish no structural identity: the relationship is not representable`)
        } else {
            probe.refuse(
                'CHECK_NOT_EXECUTABLE',
                `${events.length - unresolved.length} event-conditioned modifier(s) resolve structurally, but no overlap test for event conditions is specified. Its semantics are not invented here.`,
                events.map(m => lineOf(m.classId, 'V8b')),
                { clause: CLAUSE('§7.2'), quote: 'modifier-overlap execution is underspecified for future reachable authoritative cases' },
            )
            clauses.push(notEvaluable(EVENT, probe.refusals[probe.refusals.length - 1].refusalId))
            notes.push(`${events.length} event-conditioned modifier(s); overlap execution is unspecified`)
        }
    }

    // SD-60 — object conditions. No canonical corpus item exercises one, so no execution semantics are
    // specified and none are invented. The representational capability is preserved untouched.
    if (!objects.length) {
        clauses.push(pass(OBJECT, 0))
    } else {
        probe.refuse(
            'CHECK_NOT_EXECUTABLE',
            `${objects.length} value modifier(s) carry an object condition, for which no overlap semantics are specified. No canonical item exercises this case, so none are invented from constructed examples.`,
            objects.map(m => lineOf(m.classId, 'V8b')),
            { clause: CLAUSE('§7.2'), quote: 'add no execution semantics from invented examples' },
        )
        clauses.push(notEvaluable(OBJECT, probe.refusals[probe.refusals.length - 1].refusalId))
        notes.push(`${objects.length} object-conditioned modifier(s); no overlap semantics specified`)
    }

    if (!modifiers.length) return result('GA-MODIFIER-OVERLAP', probe, clauses, 'no value modifier is instantiated')
    return result(
        'GA-MODIFIER-OVERLAP',
        probe,
        clauses,
        notes.concat(overlapping.length ? [`${overlapping.length} region referent(s) claimed by more than one modifier`] : [`${comparable} region referent(s) compared by structural identity`]).join('; '),
    )
}

// =================================================================================================
// The gates.
// =================================================================================================

const GATE_A_CHECKS: ((ctx: GateContext) => CheckOutcome)[] = [
    gaRosterSum,
    gaEnvelopeFit,
    gaLayoutFeasible,
    gaRegionFunction,
    gaReferenceIntegrity,
    gaTriggerUnique,
    gaTransitionCoherence,
    gaInformation,
    gaTimeWindows,
    gaNoFailedLine,
    gaEffectTyped,
    gaOnePrimaryEvent,
    gaDirection,
    gaObjectiveSets,
    gaModifierOverlap,
]

export interface GateOutcome {
    gateA: GateReport
    gateBForward: GateReport
    gateBReverse: GateReport
    refusals: RefusalRecord[]
    stopped: { where: string; why: string }[]
}

export function runGates(ctx: GateContext): GateOutcome {
    const refusals: RefusalRecord[] = []
    const checks: CheckResult[] = []

    const blocks: GateBlock[] = []
    for (const check of GATE_A_CHECKS) {
        const outcome = check(ctx)
        checks.push(outcome.check)
        refusals.push(...outcome.refusals)
        blocks.push(...outcome.blocks)
    }
    blocks.sort((a, b) => `${a.checkId}|${a.clause}`.localeCompare(`${b.checkId}|${b.clause}`))

    checks.sort((a, b) => a.checkId.localeCompare(b.checkId))
    const notEstablished = checks
        .flatMap(c => c.clauses.filter(l => l.verdict === 'NOT_CHECKABLE_OUTSIDE_REPRESENTATION').map(l => ({ checkId: c.checkId, clause: l.clause })))
        .sort((a, b) => a.checkId.localeCompare(b.checkId))

    // SD-54 — a summary may not present a vacuous pass and an evaluated one as equivalent evidence, so
    // the report carries the split rather than leaving a reader to compute "N checks passed".
    const passedClauses = checks.flatMap(c => c.clauses).filter(c => c.verdict === 'PASS')
    const gateA: GateReport = {
        verdict: checks.some(c => c.verdict === 'FAIL') ? 'FAIL' : checks.some(c => c.verdict === 'NOT_EVALUABLE') ? 'NOT_EVALUABLE' : 'PASS',
        checks,
        notEstablished,
        blocks,
        evidence: {
            clausesEvaluated: passedClauses.filter(c => c.basis === 'EVALUATED').length,
            clausesVacuous: passedClauses.filter(c => c.basis === 'NO_APPLICABLE_INSTANCES').length,
            clausesFailed: checks.flatMap(c => c.clauses).filter(c => c.verdict === 'FAIL').length,
            clausesNotEvaluable: checks.flatMap(c => c.clauses).filter(c => c.verdict === 'NOT_EVALUABLE').length,
            clausesOutsideRepresentation: notEstablished.length,
        },
    }

    const stopped: { where: string; why: string }[] = []

    // §1.4: `value` is required "iff `derived`". A resolved line holding no value is an engine defect,
    // not a defect of the game, and it would otherwise surface as a check failing for a reason that is
    // not the real one — which is how the standing-decision route was found to carry no value at all.
    const valueless = [...ctx.classified.values()]
        .filter(l => l.verdict === 'RESOLVED:ENTAILED')
        .filter(l => {
            const record = ctx.derived.get(l.lineId)
            if (!record) return true
            if (record.session) return record.session.value === undefined
            if (record.entailing.length) return record.entailing[0].value === undefined
            return !record.standingValue || record.standingValue.value === undefined
        })
        .map(l => l.lineId)
    if (valueless.length) {
        stopped.push({
            where: 'stage 10, Gate A',
            why:
                `${valueless.length} line(s) are RESOLVED but carry no value (${valueless.slice(0, 4).join(', ')}), and §1.4 requires a value wherever a line is derived. ` +
                'The gates treat these as unusable rather than reading absence as a value; the defect is in the stage that resolved them.',
        })
    }

    return {
        gateA,
        gateBForward: gateBForward(ctx),
        gateBReverse: { verdict: 'NOT_APPLICABLE', checks: [], notEstablished: [] },
        refusals,
        stopped,
    }
}

/**
 * Gate B forward — "every admitted item's `ForwardResult`, with every item of every loaded contract
 * counted and none dropped". It re-derives nothing; it checks that stage 8 dropped nothing.
 */
function gateBForward(ctx: GateContext): GateReport {
    const CLAUSE_TEXT = 'every item of every admitted contract carries exactly one forward result'
    const expected = ctx.contracts.reduce((total, c) => total + (c.items || []).length, 0)
    const seen = new Set(ctx.forward.map(f => `${f.item.contractId}:${f.item.itemId}`))
    const dropped = expected - seen.size

    const check: CheckResult = {
        checkId: 'GB-FORWARD-COMPLETE',
        verdict: dropped === 0 && ctx.forward.length === expected ? 'PASS' : 'FAIL',
        subjects: [],
        why: `${expected} admitted item(s); ${ctx.forward.length} forward result(s); ${dropped} uncounted`,
        clauses: [dropped === 0 && ctx.forward.length === expected ? pass(CLAUSE_TEXT, expected) : fail(CLAUSE_TEXT, expected)],
        pendingOn: [],
        blockedBy: [],
    }

    return { verdict: check.verdict === 'PASS' ? 'PASS' : 'FAIL', checks: [check], notEstablished: [] }
}
