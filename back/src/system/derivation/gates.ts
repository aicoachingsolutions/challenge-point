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

import { AwardeeRelation, awardeeRelation, designationKey, followsPossessionRelation, holderInBlock, isAllTeams, isListedDesignation, resolutionOf, roleHolderNames, roleOfHolder } from './designation'
import { ClassifiedLine, nonClaimState } from './classify'
import { DerivedLine, resolvedValue } from './derive'
import { ItemOutcome } from './forward'
import { RegisterIndex } from './register'
import { add, compare, Interval, lt, lte, Rational, toInterval, toRational, ZERO } from './rational'
import { BeginConditionReferent, beginConditionReferentOf, ElementClass, Envelope, FailureRecord, ItemRef, LoadedContract, NO_FURTHER_VALUE, RefusalRecord, ResolutionLine, RoleBlock, SpecClause, relationalReferentOf, relativePositionOf, structuralRefOf, teamEndPositionOf } from './types'

/**
 * `DEFERRED_TO_REALIZATION` is the clause verdict added on 30 September, and it is a different
 * statement from `NOT_EVALUABLE`.
 *
 * `NOT_EVALUABLE` means *something is missing and I cannot tell*. Four Gate A clauses were reporting
 * that when the truth was *this cannot be answered yet, by anyone*: they read concrete geometry or an
 * instantiated roster, which **realization** supplies. Gate A was asking whether a game's layout is
 * feasible before the game had a layout, and its own verdict gated the step that would produce one.
 *
 * A deferred clause therefore does not block realization — and it is not forgiven either. It is
 * carried as an obligation the concrete game still owes, so nothing claims to have been checked that
 * has not been.
 */
export type ClauseVerdict = 'PASS' | 'FAIL' | 'NOT_CHECKABLE_OUTSIDE_REPRESENTATION' | 'NOT_EVALUABLE' | 'DEFERRED_TO_REALIZATION'
export type GateVerdict = 'PASS' | 'FAIL' | 'NOT_EVALUABLE' | 'NOT_APPLICABLE' | 'DEFERRED_TO_REALIZATION'

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
    /** On a deferred clause: what realization must supply before it can be answered. */
    owes?: string
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
    /** Over every clause. Never PASS while anything is still owed, so the split loses nothing. */
    verdict: GateVerdict
    /**
     * Over the clauses knowledge alone can answer. **This is the verdict that gates realization**: a
     * resolved game may be realized once nothing knowledge could settle is left unsettled.
     */
    knowledgeVerdict?: GateVerdict
    /** Clauses a concrete game still owes, each naming what realization must supply. */
    deferred?: { checkId: string; clause: string; owes: string }[]
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
    /**
     * The role block the game is derived for (stage K3, 15 October 2026, his M1), so a team fact written for a role holder
     * reaches the team that holds the role in this block (the roster, `assemble-concrete-game.ts`). Absent without one.
     */
    roleBlock?: RoleBlock
}

const CLAUSE = (section: string): SpecClause => ({ document: 'derivation-engine-design-package', section })

/** What a line offers a check. `FAILED` is §1.4's `failed`: `NOT_AUTHORED` or `UNRESOLVED`. */
type Cell =
    | { state: 'DERIVED'; value: unknown }
    | { state: 'OPEN'; bounds: DerivedLine['bounding'] }
    | { state: 'FAILED' }
    | { state: 'CONDITIONAL' }
    /**
     * `established` separates the two absences a check meets, 14 October 2026 (Step 4, component 1, which he
     * approved that day: *"Correct the two reference/condition faults"*). A line the knowledge EXCLUDED,
     * declared it does not constrain, or SD-88 withdrew has no value because the question is settled; a line
     * that does not exist at all is missing, and still blocks. Every reader that only asks for `ABSENT` reads
     * both exactly as before — the flag is for the clause that has to tell them apart.
     */
    | { state: 'ABSENT'; established?: true }

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
        if (line.lineState === 'WITHDRAWN') return { state: 'ABSENT', established: true }
        // **An established absence is an answer, not an obstruction** — his governing distinction of
        // 29 September, applied here as well as in GA-NO-FAILED-LINE. A row the knowledge EXCLUDED is
        // stated not to be part of this structure; a row it declared it does not constrain imposes no
        // requirement. Either way the property legitimately has no value, and a check that treats
        // that as "I cannot tell" reports itself unevaluable over a question that is in fact settled.
        // Only a required-but-unestablished line still blocks.
        if (line.verdict === 'NOT_AUTHORED' && (line.reason === 'excluded' || line.reason === 'not constrained')) {
            return { state: 'ABSENT', established: true }
        }
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
        // One shared answer to "what value does this line carry", so the gate can never disagree with
        // the emitted result about it.
        return { state: 'DERIVED', value: resolvedValue(this.ctx.derived.get(lineId))?.value }
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

/**
 * The classes on a row that a check may read fields from.
 *
 * SD-97 — a class formed by an existence assertion with no selector is **existential coverage**: it
 * says something of the kind exists and individuates nothing, so it enumerates no field lines and a
 * check must not ask it for any. `allClassesOn` keeps the unfiltered view for the cardinality
 * questions, where the existential claim is exactly what is being counted.
 */
const classesOn = (ctx: GateContext, row: string) => ctx.classes.filter(c => c.row === row && (!c.constraints.any || !!c.singletonBy))
const allClassesOn = (ctx: GateContext, row: string) => ctx.classes.filter(c => c.row === row)
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

/**
 * **SD-98, his ruling of 27 September — bounded structural restatement, as a reusable rule.**
 *
 *   "An authored reference that unambiguously names an already-held structural class may be restated
 *    as a structural reference to that class, provided the restatement does nothing beyond typing
 *    the referent already named. It may not select between possible referents, infer a referent,
 *    substitute a more convenient referent, or establish identity from textual similarity."
 *
 * A typed reference names the **contribution that established the class**, which is how the engine
 * names classes, so nothing about the id scheme leaks into the corpus. SD-63 is untouched: ordinary
 * open text still establishes no identity, and the typed form is only ever written by a restatement
 * he has ruled on, never inferred from the prose beside it.
 */
export interface StructuralRef {
    structuralRef: { contractId: string; itemId: string }
    /** The authored sentence, kept beside its typed form exactly as SD-86 keeps a prose bound. */
    asAuthored?: string
}

const asStructuralRef = (value: unknown): StructuralRef['structuralRef'] | null => structuralRefOf(value)

/** The class a reference names, whether it was written as a typed reference or as a class id. */
function referentClass(ctx: GateContext, value: unknown): ElementClass | undefined {
    const typed = asStructuralRef(value)
    if (typed) return ctx.classes.find(c => c.fromItem.contractId === typed.contractId && c.fromItem.itemId === typed.itemId)
    return ctx.classes.find(c => c.classId === String(value))
}

/**
 * **Are two referents the same element class?** Step 4, component 1, which he approved on 14 October 2026:
 * *"Correct the two reference/condition faults."* Four sites compared referents as `String(x)`, and a typed
 * reference stringifies to `"[object Object]"`: two typed references always read as equal, and a typed one
 * never equalled the class id it resolves to.
 *
 * Equal when both resolve to one held class — however each was written. Where either resolves to nothing,
 * only two untyped strings with the same text are equal, which is exactly what `String()` compared before
 * for the values that were strings; a typed reference that resolves to nothing is equal to nothing.
 */
function sameReferent(ctx: GateContext, a: unknown, b: unknown): boolean {
    const left = referentClass(ctx, a)
    const right = referentClass(ctx, b)
    if (left && right) return left.classId === right.classId
    if (asStructuralRef(a) || asStructuralRef(b)) return false
    return String(a) === String(b)
}

/** A referent as a reason may print it: `contractId::itemId` for a typed reference, never `[object Object]`. */
function describeReferent(value: unknown): string {
    const typed = asStructuralRef(value)
    if (typed) return `${typed.contractId}::${typed.itemId}`
    const relational = relationalReferentOf(value)
    if (relational) return `the ${relational.role} objective reference of ${relational.objectiveReferenceOf}`
    const begins = beginConditionReferentOf(value)
    return begins ? `the restarts that begin ${begins.beginsEpisodeOf}` : String(value)
}

/**
 * **A relational referent, resolved to the references it designates** (15 October 2026, stage K1, capability M8). His
 * 17 October words: *"Apply the qualifying conditions to the target and scoring episode actually being evaluated."*
 *
 * The referent names "the objective reference of D" (types.ts `RelationalReferent`): the J2 reference of each
 * objective the game holds with the referent's role, attacked by the team D designates. Which team D picks out —
 * the team that scored, for SCORING_TEAM — is decided at the trigger, not at structure, so before any trigger the
 * referent stands for EVERY such objective's reference: per team, the target that team attacks. Every one of them
 * must then be held (and, where a check asks, positioned), which can only make a check stricter, never looser; a
 * later designation resolver may narrow the set, never widen it.
 *
 *   - `dangling` — the designation is not one the register defines, or the game holds no objective of that role and
 *     asserts none it has not individuated: the referent names nothing, which the engine can establish, so the caller
 *     FAILS it;
 *   - otherwise `references` — the objectives' own J2 values, each to be judged exactly as a written referent is
 *     (held, dangling or open text). A role or reference line that is not derived is read through the probe, so it
 *     blocks the check by name (`pending`), and is never resolved by guessing.
 */
function resolveRelational(ctx: GateContext, probe: Probe, referent: { objectiveReferenceOf: string; role: string }, lineId: string): { references: unknown[]; pending: boolean; dangling: string | null } {
    const designated = referent.objectiveReferenceOf
    // Asked of the one resolver since 15 October 2026 (stage K2, his M2). By the list's own spelling (K2 review): a named
    // team or "(= ENTRY)" prose MAPS to an entry for comparison, but is no entry a referent may designate — read as one,
    // it resolved to every objective of the role and a FAIL became a PASS.
    if (!isListedDesignation(ctx.index, designated)) {
        return { references: [], pending: false, dangling: `${designated} is not a team designation the register defines` }
    }
    const references: unknown[] = []
    let objectives = 0
    let pending = false
    for (const objective of classesOn(ctx, 'J1')) {
        const role = probe.cell(lineOf(objective.classId, 'J4'))
        if (role.state !== 'DERIVED') {
            if (!(role.state === 'ABSENT' && role.established)) pending = true
            continue
        }
        if (String(role.value) !== referent.role) continue
        objectives++
        const reference = probe.cell(lineOf(objective.classId, 'J2'))
        if (reference.state !== 'DERIVED') pending = true
        references.push(...referentsOf(reference))
    }
    if (!objectives && !pending) {
        // An objective asserted to exist but individuated by nothing (SD-97's existential coverage) might be one of
        // that role: what the referent designates is then unknown, which is a gap naming this line — not a referent
        // that names nothing. Measured the day it landed: RPC-001 alone, and RPC-001 with GF4, are such games, and
        // reading them as FAILs would have moved two checks from NOT_EVALUABLE on knowledge nobody had changed.
        if (allClassesOn(ctx, 'J1').some(c => c.constraints.any && !c.singletonBy)) {
            probe.unestablished(lineId)
            return { references, pending: true, dangling: null }
        }
        return { references, pending, dangling: `the game holds no objective whose role is ${referent.role}` }
    }
    return { references, pending, dangling: null }
}

function identityOf(ctx: GateContext, value: unknown): ReferenceIdentity {
    const typed = asStructuralRef(value)
    if (typed) return referentClass(ctx, value) ? 'HELD' : 'DANGLING'
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
    // A check with anything still owed is not a check that passed. Without this it read as PASS
    // while naming the lines it was blocked on — which the "no check passes while blocked" invariant
    // caught immediately, and rightly: a deferred obligation reported as a pass is the one outcome
    // the split must never produce.
    if (clauses.some(c => c.verdict === 'DEFERRED_TO_REALIZATION')) return 'DEFERRED_TO_REALIZATION'
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

/**
 * A clause that cannot be answered until realization has chosen or instantiated something. `owes`
 * states what it will need, so the obligation travels with the game rather than living in a comment.
 */
const deferred = (clause: string, owes: string): ClauseResult => ({ clause, verdict: 'DEFERRED_TO_REALIZATION', owes })

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

    // SD-97 — say which of the two it is. "No team class" and "teams are asserted to exist but none
    // is individuated" are different facts, and reporting the second as the first would be false.
    if (!teams.length) {
        probe.missing.push(
            allClassesOn(ctx, 'P1').length
                ? 'P1 (teams are asserted to exist, and no assertion individuates one, so no roster line exists to sum)'
                : 'P1 (no team class is instantiated)',
        )
    }
    if (players.state !== 'DERIVED' || probe.blocked) {
        // SD-97: teams are asserted to exist and nothing individuates one, so there is no roster line
        // to sum. Realization instantiates the teams; until it has, the sum has no terms — which is a
        // different thing from a roster that does not add up.
        if (!teams.length && allClassesOn(ctx, 'P1').length) {
            return result(
                'GA-ROSTER-SUM',
                probe,
                [deferred(CLAUSE_TEXT, 'the instantiated teams, whose existence is asserted and whose members nothing individuates')],
                'teams are asserted to exist and none is individuated, so the sum has no terms until realization instantiates them',
            )
        }
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

/**
 * Is a degenerate extent on this axis **legitimate** for this element, rather than an empty region?
 *
 * His ruling of 1 October: *"If a realized line legitimately has no depth, Gate A should not require a
 * zone-like interval merely to certify its geometry."* A one-dimensional noun has extent on one axis
 * and none on the other, so a zero extent on its thickness axis is the element being what it is — not
 * a region that collapsed.
 *
 * Read from the register's `nounSemantics`, which names no axis: the element is degenerate on this axis
 * only where its OTHER axis carries a real extent, so a line with no extent anywhere is still empty and
 * still fails. That is what keeps this from becoming a way for any region to be zero-sized.
 */
function degenerateIsLegitimate(ctx: GateContext, classId: string, axis: 'along' | 'across'): boolean {
    const nounRow = [...ctx.index.rows.values()].find(r => String(r.path).endsWith('.noun') && ctx.index.ownerRow.get(r.id) === ctx.classes.find(c => c.classId === classId)?.row)
    if (!nounRow) return false
    const noun = resolvedValue(ctx.derived.get(`${classId}::${nounRow.id}`))?.value
    if (typeof noun !== 'string') return false
    if (Number((ctx.index.nounSemantics as any)?.extentDimensions?.[noun]) !== 1) return false

    // The other axis must carry a real extent, or nothing establishes which axis is the length.
    const otherRow = [...ctx.index.rows.values()].find(
        r => String(r.path).endsWith(axis === 'along' ? '.across' : '.along') && ctx.index.ownerRow.get(r.id) === ctx.classes.find(c => c.classId === classId)?.row,
    )
    if (!otherRow) return false
    const other = toInterval(resolvedValue(ctx.derived.get(`${classId}::${otherRow.id}`))?.value)
    return !!other && compare(other.lo, other.hi) < 0
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
        // **Post-realization, on his ruling of 30 September**: the unresolved dependency is a placement,
        // and placement is a value realization is authorized to supply. So the stage is settled, and the
        // invariant is not weakened — it is asked once its subject exists.
        //
        // What that does not fix, and I have said so rather than let the move imply otherwise: this
        // corpus authors placements as PROSE ("touchline-adjacent"), so at the later stage the clause
        // is blocked again for a different reason — §1.9 still has nothing to compare. Moving it is
        // right; it is not sufficient.
        return result(
            'GA-ENVELOPE-FIT',
            probe,
            [deferred(INSIDE, 'the chosen placement of every region and object'), deferred(NON_EMPTY, 'the chosen extent of every region and object')],
            'every placement it would compare is a value realization supplies',
        )
    }
    if (!along || !across || probe.blocked) {
        return result('GA-ENVELOPE-FIT', probe, [notEvaluable(INSIDE), notEvaluable(NON_EMPTY)], probe.blockedWhy || 'the area dimensions are not derived')
    }

    // A zero extent is only empty where the element is not legitimately degenerate on that axis.
    const empty = placed.filter(p => {
        if (compare(p.interval.lo, p.interval.hi) < 0) return false
        const classId = p.lineId.split('::')[0]
        return !degenerateIsLegitimate(ctx, classId, p.interval.axis)
    })
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
    // The wording is part of the correction. "over open lines" was what made the clause empty itself
    // the moment realization closed them; it now says what it actually examines, at either stage.
    const CLAUSE_TEXT = 'every geometric extent, open or realized, admits a joint assignment inside the area'
    const probe = new Probe(ctx, 'GA-LAYOUT-FEASIBLE')

    const length = probe.cell('game::E2')
    const width = probe.cell('game::E3')
    const along = length.state === 'DERIVED' ? toRational(length.value) : null
    const across = width.state === 'DERIVED' ? toRational(width.value) : null

    const geometricRows = new Set(['S5', 'S6', 'O4', 'O5'])
    const open = ctx.lines.filter(l => geometricRows.has(l.row) && ctx.classified.get(l.lineId)?.verdict?.startsWith('FREE'))

    // **Rewritten 30 September, on his ruling: "so that its post-realization form actually tests the
    // realized placements rather than passing vacuously because no OPEN geometry remains. This is a
    // correction to what the invariant examines, not a relaxation of it."**
    //
    // The clause used to range over OPEN geometry. Realization closes those lines, so afterwards there
    // were none and it passed having examined nothing — a vacuous pass reported as evidence. It now
    // ranges over **every geometric line**, open or settled: before realization it checks that the open
    // extents admit a joint assignment, and after it checks that the chosen ones actually do. Same
    // invariant, wider subject, and it can no longer be satisfied by the absence of its own subject.
    const settled = ctx.lines.filter(l => {
        if (!geometricRows.has(l.row)) return false
        const verdict = ctx.classified.get(l.lineId)?.verdict
        return !!verdict && !verdict.startsWith('FREE') && verdict.startsWith('RESOLVED')
    })
    const subject = [...open, ...settled]

    if (!subject.length) return result('GA-LAYOUT-FEASIBLE', probe, [pass(CLAUSE_TEXT, 0)], 'the game has no geometric line at all, so there is no constraint set')
    for (const line of subject) probe.cell(line.lineId)
    if (!along || !across) return result('GA-LAYOUT-FEASIBLE', probe, [notEvaluable(CLAUSE_TEXT)], 'the area dimensions are not derived')

    const infeasible: string[] = []
    for (const line of subject) {
        const limit = line.row === 'S5' || line.row === 'O4' ? along : across

        // A SETTLED line carries its own placement, so feasibility is a question about that value:
        // does the realized interval lie inside the area and is it non-empty? This is the half that
        // was missing, and it is why the clause is no longer vacuous once realization has run.
        const verdict = ctx.classified.get(line.lineId)?.verdict
        if (verdict && verdict.startsWith('RESOLVED')) {
            const read = intervalOf(probe, line.lineId)
            if (!read.interval) {
                if (!read.blocked) {
                    return result(
                        'GA-LAYOUT-FEASIBLE',
                        probe,
                        [notEvaluable(CLAUSE_TEXT, probe.refusals[0]?.refusalId)],
                        `a realized placement on ${line.lineId} is not an interval this check can compare`,
                    )
                }
                continue
            }
            const degenerate = compare(read.interval.lo, read.interval.hi) >= 0
            if (degenerate && !degenerateIsLegitimate(ctx, String(line.elementId), read.interval.axis)) infeasible.push(`${line.lineId} (empty)`)
            else if (compare(read.interval.hi, limit) > 0) infeasible.push(`${line.lineId} (outside the area)`)
            continue
        }

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
                // Post-realization, on his ruling: feasibility is over values realization supplies. The
                // caveat is reported rather than hidden — a value drawn from a qualitative bound is
                // itself qualitative, so at the later stage this is blocked again until geometry is
                // represented as something arithmetic can read.
                return result(
                    'GA-LAYOUT-FEASIBLE',
                    probe,
                    [deferred(CLAUSE_TEXT, `the chosen value for ${line.lineId}, whose ${bound.bound.kind} bound is not itself a linear constraint`)],
                    'feasibility is over values realization supplies',
                )
            }
            if (min && compare(min, lo) > 0) lo = min
            if (max && compare(max, hi) < 0) hi = max
        }
        if (compare(lo, hi) > 0) infeasible.push(line.lineId)
    }

    return result(
        'GA-LAYOUT-FEASIBLE',
        probe,
        [infeasible.length ? fail(CLAUSE_TEXT, subject.length) : pass(CLAUSE_TEXT, subject.length)],
        infeasible.length
            ? `${infeasible.length} of ${subject.length} extent(s) are infeasible: ${infeasible.join(', ')}`
            : `${subject.length} extent(s) examined (${open.length} open, ${settled.length} realized) and all admit a joint assignment inside the area`,
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
        const lineId = lineOf(region.classId, 'S4')
        // **SD-99, his ruling of 27 September.** Both clauses ask only about **membership**, and
        // SD-92 established that a `∋` selector term puts a member in a set-valued field without
        // defining the set. "Where a clause asks only about established membership, it should read
        // established members and must not require the entire set-valued field to resolve first."
        // Reading the line alone made three regions with a known function report as unexamined.
        //
        // This does not close the set: nothing here concludes that the established members are all
        // of them, and a region with none is still unexamined rather than functionless.
        const established = (ctx.derived.get(lineId)?.establishedMembers || []).map(m => m.member)
        const cell = established.length ? probe.peek(lineId) : probe.cell(lineId)
        const members = established.length
            ? established
            : cell.state === 'DERIVED'
              ? Array.isArray(cell.value)
                  ? cell.value
                  : String(cell.value ?? '').split(/\s*,\s*/).filter(Boolean)
              : null
        if (members === null) continue
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
            // A realized coach's decision (COACH_DECIDES, register version 12): the value records that the place is the coach's
            // and within what words; it names no element, so there is nothing for it to dangle from or resolve to. ONLY on a row
            // the register opens as the coach's (`fillableRequires`, T4/T5) — K5 review, 15 October 2026: the exemption read
            // every reference row, so a stand-in written as a condition referent (V5) left this clause unblocked, where before
            // K5 it was read as text and blocked it (measured on a TEST-ONLY copy; pinned in starts-and-restarts.unit.ts).
            if (typeof name === 'object' && typeof (name as any).coachDecides === 'string' && ctx.index.fillableRequires.has(line.row)) continue
            /**
             * A begin-condition referent (C58, 15 October 2026) names no element: it designates the restarts that meet it, and
             * whether any does — and whether they share an awardee — is GA-EPISODE-REACHABLE's question, answered there once.
             * Read here as text it would be a gap it is not; asked here as well, a game with no such restart would fail twice
             * for one fact. Only as a condition referent (V5), the one row whose valueType carries the form (V5 version 3) —
             * K5 review, 15 October 2026: on any other reference row it is read as text, as it was before K5.
             */
            if (line.row === 'V5' && beginConditionReferentOf(name)) continue
            /**
             * A relative position (RC-21 "beyond X (for team T)", register version 13; on P10, a start placement's region, version 2)
             * is one reference: to X, named by a typed reference. Resolved where X is held and T is a registered team designation;
             * dangling where X names no held element or T is no designation the register lists — never read as text. Whether the
             * relation holds of the realized geometry is GA-RELATIVE-PLACEMENT's question, answered there once.
             */
            const relative = relativePositionOf(name)
            if (relative) {
                const identity = identityOf(ctx, relative.of)
                if (identity === 'DANGLING' || !holdsAnEnd(ctx.index, relative.forTeam)) dangling.push(`${line.lineId} → ${describeReferent(relative.of)} (for ${relative.forTeam})`)
                else if (identity === 'HELD') resolved++
                else {
                    openText++
                    probe.unestablished(line.lineId)
                }
                continue
            }
            /**
             * A relational referent (M8, 15 October 2026) is one reference: resolved when everything it designates is
             * held, dangling when it designates nothing (or something held by nobody), and a gap naming this line when
             * what it designates is open text — never itself read as text.
             */
            const relational = relationalReferentOf(name)
            if (relational) {
                const resolution = resolveRelational(ctx, probe, relational, line.lineId)
                const identities = resolution.references.map(reference => identityOf(ctx, reference))
                if (resolution.dangling) dangling.push(`${line.lineId} → ${describeReferent(name)}: ${resolution.dangling}`)
                else if (identities.includes('DANGLING')) dangling.push(`${line.lineId} → ${describeReferent(name)}: it designates a reference that names no held element`)
                else if (identities.includes('OPEN_TEXT')) {
                    openText++
                    probe.unestablished(line.lineId)
                } else if (!resolution.pending) resolved++
                continue
            }
            const identity = identityOf(ctx, name)
            if (identity === 'HELD') resolved++
            else if (identity === 'DANGLING') dangling.push(`${line.lineId} → ${describeReferent(name)}`)
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

/**
 * `GA-TRIGGER-UNIQUE` — classes applying to one trigger are mutually compatible, and none collides.
 *
 * **SD-94, his ruling of 27 September.** The first clause used to read *"no two transitions share a
 * trigger key"*, which asserts one **element** per key. Derivation does not decide that: SD-47 keeps
 * it identity-neutral, and a concrete transition *"may satisfy every supported class whose selectors
 * it matches"*. Three knowledge objects each authoring what happens at a turnover is normal, not an
 * incoherence, and the old clause could never pass a corpus in which it happened.
 *
 * His replacement is the structural question the gate can legitimately establish:
 *
 *   "Where multiple transition classes apply to the same trigger, their required structural
 *    properties must be mutually compatible."
 *
 * Two classes are compared only where a single transition could satisfy both — AM-15 lets a trigger
 * be partitioned by qualifier, and a partition is not a disagreement. Where a property is failed on
 * either side the clause is **blocked**, not failed: gap before collision (SD-28).
 */
function gaTriggerUnique(ctx: GateContext): CheckOutcome {
    const CLAUSE_TEXT = 'transition classes applying to one trigger are mutually compatible'
    const COLLIDES = 'no transition collides'
    const probe = new Probe(ctx, 'GA-TRIGGER-UNIQUE')
    const transitions = classesOn(ctx, 'T1')

    /**
     * **The early return is gone, on his ruling of 5 October — and the reason is worth keeping.**
     *
     * It used to short-circuit at `transitions.length < 2` and report BOTH clauses as
     * `pass(clause, transitions.length)`. With exactly one transition that is `pass(clause, 1)`, and
     * `pass` reads `instances > 0` as basis `EVALUATED` — so the compatibility clause **claimed it had
     * evaluated an instance while comparing no pair at all.** Its unit is PAIRS: fifteen lines below, the
     * same clause correctly reports `comparedPairs`. Reporting transitions there was the wrong unit, and
     * it is what kept the clause out of the `clausesVacuous` tally that exists to surface exactly this
     * (SD-54: a summary may not present a vacuous pass and an evaluated one as equivalent evidence). At
     * zero transitions it was right by accident, because 0 maps to the correct basis.
     *
     * **It also skipped the collision clause.** `collided` is computed per transition LINE, not per pair,
     * so it is perfectly well defined for a single transition — and the early return returned a PASS for
     * it without ever computing it. No corpus case currently has an `UNRESOLVED` line on a transition
     * class, so that was latent rather than live; a synthetic case in the tests proves it would now fail.
     *
     * Deleting the early return needs no replacement guard: with fewer than two transitions the pair
     * loops simply do not execute, `comparedPairs` stays 0, and the clause reports
     * `NO_APPLICABLE_INSTANCES` honestly.
     *
     * **What this does NOT do, recorded because an earlier report of mine implied otherwise and he asked
     * that the correction be preserved: it gives no trigger-reachability enforcement.** `triggerOf`'s
     * value is compared only to another transition's trigger, to decide whether a pair could meet; this
     * check never reads `ctx.triggers` at all. Removing the guard would not have caught a transition on
     * an unreachable trigger. That obligation is `GA-TRIGGER-REACHABLE`, which is its own check.
     */
    const triggerOf = (cls: ElementClass) => {
        const term = (cls.constraints?.terms || []).find(t => t.attribute === 'trigger' && t.op === '=')
        return term && term.op === '=' ? term.value : null
    }
    const fields = [...ctx.index.rows.values()].filter(r => r.kind === 'FIELD' && r.ownerRow === 'T1').map(r => r.id)

    const incompatible: string[] = []
    let comparedPairs = 0
    let blocked = false

    for (let i = 0; i < transitions.length; i++) {
        for (let j = i + 1; j < transitions.length; j++) {
            const a = transitions[i]
            const b = transitions[j]
            const trigger = triggerOf(a)
            if (!trigger || trigger !== triggerOf(b)) continue // different triggers: they never meet
            if (mutuallyExclusive(a, b)) continue // partitioned by qualifier (AM-15)
            comparedPairs++

            for (const row of fields) {
                // Read without blocking: two classes that both leave a property unauthored require
                // nothing of it, so they cannot be incompatible on it and nothing is being hidden.
                const left = probe.peek(`${a.classId}::${row}`)
                const right = probe.peek(`${b.classId}::${row}`)

                if (left.state === 'DERIVED' && right.state === 'DERIVED') {
                    if (JSON.stringify(left.value) !== JSON.stringify(right.value)) {
                        incompatible.push(`${a.classId} and ${b.classId} require different ${row}`)
                    }
                    continue
                }
                // One side requires something and the other's requirement is unknown: a conflict
                // could be hiding there, so the clause is blocked rather than passed (SD-28).
                const unknown = (c: Cell) => c.state === 'FAILED' || c.state === 'CONDITIONAL'
                if ((left.state === 'DERIVED' && unknown(right)) || (right.state === 'DERIVED' && unknown(left))) {
                    blocked = true
                    probe.cell(`${a.classId}::${row}`)
                    probe.cell(`${b.classId}::${row}`)
                }
            }
        }
    }

    // The package's second clause: "none collides". A transition line that stage 6 left UNRESOLVED is a
    // collision on that transition, and the check says so rather than reporting only compatibility.
    const collided = [...ctx.classified.values()].filter(
        l => l.verdict === 'UNRESOLVED' && transitions.some(t => l.lineId.startsWith(`${t.classId}::`)),
    )
    for (const line of collided) probe.cell(line.lineId)

    return result(
        'GA-TRIGGER-UNIQUE',
        probe,
        [
            incompatible.length ? fail(CLAUSE_TEXT, comparedPairs) : blocked ? notEvaluable(CLAUSE_TEXT) : pass(CLAUSE_TEXT, comparedPairs),
            collided.length ? fail(COLLIDES, transitions.length) : pass(COLLIDES, transitions.length),
        ],
        `${comparedPairs} overlapping transition pair(s) compared; ${incompatible.length} incompatible${incompatible.length ? `: ${incompatible.join('; ')}` : ''}; ` +
            `${collided.length} transition line(s) collided`,
    )
}

/**
 * Two transition classes are compared only when a single concrete transition could satisfy both.
 * AM-15 lets a trigger be partitioned by qualifier, and a partition is not a disagreement: classes
 * that fix the same qualifier to different values can never apply to the same instance.
 */
function mutuallyExclusive(a: ElementClass, b: ElementClass): boolean {
    for (const left of a.constraints?.terms || []) {
        if (left.op !== '=') continue
        const right = (b.constraints?.terms || []).find(t => t.attribute === left.attribute && t.op === '=')
        if (right && right.op === '=' && right.value !== left.value) return true
    }
    return false
}

/**
 * `GA-TRIGGER-REACHABLE` — a transition must be keyed on a structurally reachable trigger (SD-44).
 *
 * **His ruling of 5 October, and it settles an authority conflict rather than adding a preference.**
 * `RC-19` — a run convention of 18 September, ours rather than his — said the T1 elements for START,
 * POSSESSION_CHANGE, OUT_TOUCHLINE and OUT_END_LINE "exist by construction", flatly. **SD-44, four days
 * later, is his:** *"A trigger is structurally reachable when the Game Representation contains the
 * resolved structural prerequisites necessary for that trigger to occur."* He has now ruled that SD-44
 * supersedes RC-19 wherever they conflict, and that possession is a relationship involving the ball — so
 * POSSESSION_CHANGE is **not** reachable in a game that establishes no ball.
 *
 * **Why this is a check of its own and not a clause on a neighbour.** `failingChecks` is a list of
 * checkIds, so only a dedicated checkId can make this failure legible in the report; folded into
 * GA-TRANSITION-COHERENCE the same failure would surface as a coherence problem and never name the
 * trigger. He asked for reachability "actually checked rather than merely registered/cited", and being
 * nameable is part of that.
 *
 * **It is deliberately general.** It ranges over every T1 class in any game form. The same defect was
 * measured on two unrelated authored items — GF2's turnover and GF4's — so a repair scoped to either, or
 * to the one goal where it currently reaches a rendered game, would have left the other standing.
 *
 * **This check reads no cell, and that is the finding it enforces.** The register gives a transition's
 * trigger no FIELD row: `trigger` is a selectorAttribute of the T1 COLLECTION, so it is part of which
 * element this is and never becomes a line, a verdict or a probeable cell. Every other Gate A check
 * interrogates lines; this one interrogates the class's own selector, because that is the only place the
 * value exists. That is also why nothing caught this for so long.
 *
 * **Two limits, recorded rather than silently relied on.**
 * 1. A class whose trigger is not fixed by an `=` term (an `IN` over several triggers, say) is not
 *    decided here. The clause reports NOT_EVALUABLE rather than failing it — gap before collision
 *    (SD-28). Nothing in the corpus does this today.
 * 2. `ctx.triggers` is constructed at stage 2 and is **not** recomputed after realization, so the
 *    post-realization pass re-checks against the pre-realization set. If realization ever instantiated a
 *    member that newly satisfied a prerequisite, this check would not see it. The two existing readers of
 *    the set share that limit; it is not introduced here.
 */
function gaTriggerReachable(ctx: GateContext): CheckOutcome {
    const CLAUSE = 'every transition is keyed on a structurally reachable trigger'
    const RELATION_CLAUSE = 'a transition keyed on a possession change has the possession relation established or open'
    const probe = new Probe(ctx, 'GA-TRIGGER-REACHABLE')
    const transitions = classesOn(ctx, 'T1')
    // Both clauses are emitted on every path, including this one. A check whose clause SET varies with its input
    // is a check whose report cannot be compared across games, and SD-53 asks for one clause to one verdict —
    // not for a clause to disappear when it has nothing to range over. With no transition both are vacuous, and
    // `pass(_, 0)` says so in its basis rather than by omission (SD-54).
    if (!transitions.length) {
        return result('GA-TRIGGER-REACHABLE', probe, [pass(CLAUSE, 0), pass(RELATION_CLAUSE, 0)], 'no transition is instantiated')
    }

    const unreachable: string[] = []
    const undecided: string[] = []
    let seen = 0
    let turnovers = 0

    for (const transition of transitions) {
        const term = (transition.constraints?.terms || []).find(t => t.attribute === 'trigger' && t.op === '=')
        const name = term && term.op === '=' ? String(term.value) : null
        if (name === null) {
            undecided.push(transition.classId)
            continue
        }
        seen++
        if (name === 'POSSESSION_CHANGE') turnovers++
        // The parameterised form is `NAME{argument}`: REGION_ENTRY{r} is reachable for the region it names.
        if (!ctx.triggers.some(t => t === name || t.startsWith(`${name}{`))) unreachable.push(`${transition.classId}: ${name}`)
    }

    const clause = unreachable.length
        ? fail(CLAUSE, seen)
        : undecided.length
          ? notEvaluable(CLAUSE)
          : pass(CLAUSE, seen)

    /**
     * **The second clause, on his ruling of 6 October: a turnover needs the relation it changes.**
     *
     * SD-44's own row names two conjuncts — *"turnover when opposing teams and **the relevant possession
     * relationship** exist"* — and the implementation had only ever tested a presupposition of the second one.
     * `constructTriggers` keys POSSESSION_CHANGE on opposing teams and a ball, which are what the relationship
     * is made of; it never asked whether the relationship itself is in the game. So a game could hold the
     * carrier, reach the trigger, realize with nothing lost or invented, and still not hold the relation the
     * trigger exists to change. A01 with its goal-kick situation did exactly that for a week.
     *
     * **His ruling: the ball alone must no longer make a possession change reachable.** The relation must be
     * established or legitimately open — open counts, because a bounds-only contribution makes the initial
     * holder an authorized realization choice, which is the shape the Sport Profile contribution uses.
     *
     * **Why here and not in `constructTriggers`.** That function runs at stage 2, before any line is derived, so
     * it cannot know whether PS1 resolved or opened. The two places together implement the chain: stage 2 tests
     * the material prerequisites the relation needs, and this clause tests the relation SD-44 actually names.
     *
     * Reported as its own clause rather than folded into the one above, so a failure says which half failed
     * (SD-53: one executable clause, one independently reported verdict).
     */
    let relationClause: ClauseResult
    if (!turnovers) {
        relationClause = pass(RELATION_CLAUSE, 0)
    } else {
        /**
         * **Read THROUGH the probe, so the line is a recorded subject whether the clause passes or fails.**
         *
         * The first version of this clause read `ctx.classified` directly and probed only on failure. The
         * verdicts were right and the report was not: a passing run could not show that the clause had ranged
         * over PS1 at all, which is a quiet breach of the Probe's own contract a few hundred lines up —
         * *"Every line a check consults is recorded as a subject, so the report shows what the verdict ranged
         * over rather than only what it concluded."* A check that leaves no trace when it passes is a check
         * nobody can confirm is still running, which is how an enforcement quietly stops enforcing.
         *
         * `DERIVED` is established and `OPEN` is legitimately open — exactly the two states his ruling admits.
         * Everything else, including an established absence, is a game that does not hold the relation its own
         * turnover would change.
         */
        const cell = probe.cell('game::PS1')
        const held = cell.state === 'DERIVED' || cell.state === 'OPEN'
        relationClause = held ? pass(RELATION_CLAUSE, turnovers) : fail(RELATION_CLAUSE, turnovers)
    }

    const relationWhy = turnovers
        ? `; ${turnovers} turnover transition(s): possession relation ${String(ctx.classified.get('game::PS1')?.verdict ?? 'NOT ENUMERATED')}`
        : ''

    return result(
        'GA-TRIGGER-REACHABLE',
        probe,
        [clause, relationClause],
        `${seen} transition trigger(s) checked against ${ctx.triggers.length} reachable trigger(s); ` +
            `${unreachable.length} not reachable${unreachable.length ? `: ${unreachable.join('; ')}` : ''}` +
            `${undecided.length ? `; ${undecided.length} trigger(s) not fixed by an = term and not decided: ${undecided.join('; ')}` : ''}` +
            relationWhy,
    )
}

/**
 * `GA-EPISODE-REACHABLE` — a condition authored for an episode needs a transition that can begin one. Added 15
 * October 2026, beside `GA-TRIGGER-REACHABLE` and for the same reason SD-44 gives there: something the game says
 * must happen has to be able to happen in it.
 *
 * **The scope it reads.** Christian, 20 September (SD-36): the BUILD_OUT_EPISODE scope *"applies to the attacking
 * episode whose beginning satisfies the resolved RPC-001 build-out begin condition. It does NOT automatically extend
 * to subsequent attacking episodes."* KR-03, his words: *"a turnover may begin a new attacking episode while play
 * continues"*, and a return to a build-out *"requires an authored transition/reset rule"* — and his reply
 * received 15 October 2026 (16 October, 9.3): *"Build-out condition applies only to build-out episodes: Approved."*
 * Before the condition element carried its scope (resolved-game.ts, the same day) nothing could ask this.
 *
 * **Strict, so a tightening.** A condition carrying an episode scope:
 *   - FAILS where no transition element can begin such an episode — none keyed on a trigger other than a possession
 *     change whose episode-start is not established false. A possession change never begins one (KR-03: that
 *     episode is a new attacking episode, not a build-out, unless an authored reset says otherwise);
 *   - DEFERS while a candidate's taker is still open — realization chooses it, and only then can the episode's
 *     beginning be compared with the begin condition;
 *   - is NOT_EVALUABLE where a candidate's taker is settled: the begin condition's origin is authored as placement
 *     text (RPC-001-18.b), which establishes no structural identity to compare a taker with (SD-63), so this check
 *     withholds rather than infers that it matches.
 * It never passes a condition whose episode it cannot find. Every condition whose scope is not an episode is outside
 * it (a vacuous pass, SD-54).
 *
 * **Where the begin condition is TYPED, the check decides it — 15 October 2026, stage K5, ruling C58.** His words, reply
 * filed 18 October 2026, item 4, acknowledging the wording of the begin condition (quoted whole in ruling C58,
 * corpus-restatements.json): *"This provides the checkable event distinction needed to separate deliberate build-out starts
 * from ordinary restarts."* C58 types the origin's referent (RPC-001-18.b) as a
 * begin-condition referent (types.ts `BeginConditionReferent`), so the SD-63 withholding above no longer applies where it is
 * held: `buildOutStarters` asks each transition whether it IS such a restart — it stops and restarts play (T6), begins an
 * episode (T7) and meets an arm (its taker, T3; or a restart kind, which no row carries yet, so that arm is met by no
 * transition) — and the reach clause PASSES only where at least one is. A second clause, his D7 (*"Only the building team
 * initiates new build-out episodes."*): every transition that is such a restart is awarded to one and the same designation
 * (T2, compared as canonical entries). Without the typed referent nothing changes: the check withholds exactly as before.
 * Both clauses are reported on every path (SD-53), vacuously where nothing applies.
 */
export const EPISODE_SCOPES = ['BUILD_OUT_EPISODE']

/**
 * The transitions of the game that meet a begin-condition referent (C58), decided line by line, never guessed. A transition
 * is ruled out where an established value says it is not such a restart; it is undecided where a value it needs is still an
 * open choice (realization will close it, and the clause defers); and it blocks where a value it needs is a gap.
 */
function buildOutStarters(
    ctx: GateContext,
    probe: Probe,
    referent: BeginConditionReferent,
): { starters: { classId: string; trigger: string }[]; undecided: string[]; blocked: string[]; ruledOut: string[] } {
    const starters: { classId: string; trigger: string }[] = []
    const undecided: string[] = []
    const blocked: string[] = []
    const ruledOut: string[] = []
    for (const transition of classesOn(ctx, 'T1')) {
        const term = (transition.constraints?.terms || []).find(t => t.attribute === 'trigger' && t.op === '=')
        const trigger = term && term.op === '=' ? String(term.value) : 'not fixed'
        if (trigger === 'POSSESSION_CHANGE') {
            ruledOut.push(`${transition.classId} (a possession change begins an attacking episode, never a build-out one)`)
            continue
        }
        const states: [string, Cell][] = [
            ['T6', probe.cell(lineOf(transition.classId, 'T6'))],
            ['T7', probe.cell(lineOf(transition.classId, 'T7'))],
        ]
        const [[, playState], [, startsEpisode]] = states
        // Read with the other two, so a gap on the taker is named among what the check was blocked on.
        const taker = probe.cell(lineOf(transition.classId, 'T3'))
        if (playState.state === 'DERIVED' && String(playState.value) !== 'STOP_RESUME') {
            ruledOut.push(`${transition.classId} (play continues: it is not a restart)`)
            continue
        }
        if (startsEpisode.state === 'DERIVED' && String(startsEpisode.value) !== 'true') {
            ruledOut.push(`${transition.classId} (begins no episode)`)
            continue
        }
        if (states.some(([, cell]) => cell.state !== 'DERIVED' && cell.state !== 'OPEN')) {
            blocked.push(transition.classId)
            continue
        }
        if (taker.state === 'OPEN' || states.some(([, cell]) => cell.state === 'OPEN')) {
            undecided.push(transition.classId)
            continue
        }
        if (taker.state !== 'DERIVED') {
            blocked.push(transition.classId)
            continue
        }
        // An arm naming a restart kind is met by no transition: no row carries a restart kind (register V5 version 3), so
        // nothing marks a restart as one, and an ordinary restart is never read as a deliberate one (his item 2).
        const meets = referent.arms.some(arm => 'takenBy' in arm && arm.takenBy === String(taker.value))
        if (meets) starters.push({ classId: transition.classId, trigger })
        else ruledOut.push(`${transition.classId} (taken by "${String(taker.value)}": it meets no arm of the begin condition)`)
    }
    return { starters, undecided, blocked, ruledOut }
}

/**
 * **Where a start placement is re-established, and that something re-establishes it** — 15 October 2026 (stage K6, register version
 * 13, rows P10a/P10b bound to EM-0002 Performer Configuration, EMP-0013 Timing). Christian, reply filed 17 October 2026, D4: *"That
 * relationship should be re-established at the beginning of each new build-out episode."* M5: *"Support a relationship-based starting
 * arrangement that can be stated clearly to the coach and re-established at build-out restarts."* A placement timed
 * CONDITIONAL_RESET is re-established at every transition that begins the episode it names (P10b) — the transitions the typed begin
 * condition for that episode picks out (C58, `buildOutStarters`), so an ordinary restart and a change of possession never
 * re-establish it — and it must name an episode some transition begins, or it would silently never be re-established.
 *
 * One clause, vacuous where no placement is re-established. The transitions found are returned so the realized game can say where.
 */
export interface PlacementReset {
    placementClassId: string
    episode: string
    transitions: string[]
}

function placementResets(
    ctx: GateContext,
    probe: Probe,
    typedFor: (scope: string) => BeginConditionReferent | undefined,
): { clause: ClauseResult; why: string; resets: PlacementReset[] } {
    const RESETS = 'every start placement re-established when an episode begins names an episode a transition begins'
    const resetting: { classId: string; episode: string }[] = []
    let gap = false
    for (const placement of classesOn(ctx, 'P8')) {
        const timing = probe.peek(lineOf(placement.classId, 'P10a'))
        if (timing.state !== 'DERIVED') {
            // A placement whose timing is not established says nothing about re-establishment; that gap is GA-NO-FAILED-LINE's.
            continue
        }
        if (String(timing.value) !== 'CONDITIONAL_RESET') continue
        const episode = probe.cell(lineOf(placement.classId, 'P10b'))
        if (episode.state !== 'DERIVED') {
            gap = true
            continue
        }
        resetting.push({ classId: placement.classId, episode: String(episode.value) })
    }
    if (!resetting.length) return { clause: gap ? notEvaluable(RESETS) : pass(RESETS, 0), why: '', resets: [] }
    const resets: PlacementReset[] = []
    let undecided = false
    let blocked = gap
    const none: string[] = []
    for (const placement of resetting) {
        const typed = typedFor(placement.episode)
        if (!typed) {
            blocked = true
            continue
        }
        const found = buildOutStarters(ctx, probe, typed)
        if (found.starters.length) resets.push({ placementClassId: placement.classId, episode: placement.episode, transitions: found.starters.map(starter => starter.classId) })
        else if (found.undecided.length) undecided = true
        else if (found.blocked.length) blocked = true
        else none.push(placement.classId)
    }
    const clause = none.length
        ? fail(RESETS, resetting.length)
        : blocked
          ? notEvaluable(RESETS)
          : undecided
            ? deferred(RESETS, 'which transitions begin the episode each re-established start placement names')
            : pass(RESETS, resetting.length)
    const why =
        `; ${resetting.length} start placement(s) re-established when an episode begins` +
        (resets.length ? ` (${resets.map(reset => `${reset.placementClassId} at ${reset.transitions.join(', ')}`).join('; ')})` : '') +
        (none.length ? `; no transition begins the episode of ${none.join(', ')}` : '')
    return { clause, why, resets }
}

/**
 * **A role whose scoring credit is confined to an episode: who begins that episode, and what ends it** — 17 October 2026 (stage M1,
 * register version 14, row B8 `activityRoles[].creditedWithin`). Christian, reply filed 19 October 2026, item 1: *"If the building
 * team loses possession, that scoring opportunity ends. If it subsequently regains possession, play may continue, but the original
 * build-out scoring opportunity is not restored."* *"Please ensure the underlying scoring eligibility reflects this distinction,
 * rather than relying solely on the coach-facing wording."* Item 3 C: *"Yes. The build-out scoring episode ends."* His D7 of 17
 * October: *"Only the building team initiates new build-out episodes."* (His sentences naming who restarts are quoted whole in
 * register row B8's note; this module names no player role.)
 *
 * For each role element whose B8 value is a scope S other than WHOLE_GAME (the holder: the role holder of its role, register data):
 *
 *   - **clause 4** — every transition the typed begin condition for S picks out (C58, `buildOutStarters`) is awarded to the holder:
 *     NOT_EVALUABLE where nothing types S's beginning, FAIL where nothing begins S or a beginning is awarded to another team,
 *     DEFERRED while a beginning or its awardee is still open;
 *   - **clause 5** — every transition that can take possession from the holder begins another episode, so the credit ends there:
 *     a change of possession must begin one (T7 true; NOT_EVALUABLE where the game holds no change of possession, so the end at a
 *     loss of possession is never assumed), and a restart that begins none must be awarded to the holder (`awardeeRelation`: OTHER
 *     FAILS, UNDETERMINED is NOT_EVALUABLE). A transition in which play continues and that is not a change of possession awards
 *     nothing.
 *
 * Both vacuous where no role carries such a bound (SD-54), and appended after the existing clauses on every path, because
 * `context-scoring-guard.ts` reads the first clause as the reach clause. B8 is read without blocking: a role whose bound nobody
 * stated (NOT_AUTHORED) is unbounded, as a whole-game role is, and that silence is GA-NO-FAILED-LINE's to report; a bound two items
 * disagree on (UNRESOLVED), or one otherwise not established, blocks both clauses by name, and one still open to a choice defers
 * them (stage M1 review). No role, team, trigger or designation is named beyond the register's
 * POSSESSION_CHANGE, already read here.
 */
const CREDIT_ROW = 'B8'
/** The two clauses by name, exported (stage M3) so the review evidence reads their verdicts by name, never by position. */
export const CREDIT_BEGINS_CLAUSE = 'every role whose scoring credit is confined to an episode holds the award of every transition that begins that episode'
export const CREDIT_ENDS_CLAUSE = 'every transition that can take possession from such a role begins another episode'

function creditClauses(ctx: GateContext, probe: Probe, typedFor: (scope: string) => BeginConditionReferent | undefined): { clauses: [ClauseResult, ClauseResult]; why: string } {
    const BEGINS = CREDIT_BEGINS_CLAUSE
    const ENDS = CREDIT_ENDS_CLAUSE
    const spec = ctx.index.roleBlocks
    if (!spec) return { clauses: [pass(BEGINS, 0), pass(ENDS, 0)], why: '' }
    const bounded: { classId: string; role: string; holder: string; scope: string }[] = []
    let gap = false
    let undecided = false
    for (const element of classesOn(ctx, spec.rolesRow)) {
        const lineId = lineOf(element.classId, CREDIT_ROW)
        const cell = probe.peek(lineId)
        /**
         * **Only silence reads as unbounded** — stage M1 review, 17 October 2026. A bound nobody stated (NOT_AUTHORED) or one the
         * knowledge settled as absent is unbounded, and that silence is GA-NO-FAILED-LINE's to report. A bound still open to a choice
         * (FREE) is undecided, and a bound blocked on a gap, invented, or in collision is not established: reading either as the whole
         * game would pass the clauses on a value nobody holds (his 16 October item 8: *"A field whose value remains missing or
         * unresolved."* is not *"A field explicitly defined as not applicable or requiring no further value."*). Measured before this
         * line: a FREE, CONDITIONAL or INVENTED bound on the building role passed both clauses with no applicable instance.
         */
        const silent = (cell.state === 'ABSENT' && cell.established) || (cell.state === 'FAILED' && ctx.classified.get(lineId)?.verdict === 'NOT_AUTHORED')
        if (silent) continue
        if (cell.state === 'OPEN') {
            probe.cell(lineId)
            undecided = true
            continue
        }
        if (cell.state !== 'DERIVED') {
            probe.cell(lineId)
            gap = true
            continue
        }
        if (String(cell.value) === 'WHOLE_GAME') continue
        const term = (element.constraints?.terms || []).find(t => t.attribute === spec.roleAttribute && t.op === '=')
        const role = term && term.op === '=' ? String(term.value) : ''
        const holder = roleHolderNames(ctx.index).find(name => roleOfHolder(ctx.index, name) === role)
        if (!holder) {
            gap = true
            continue
        }
        bounded.push({ classId: element.classId, role, holder, scope: String(cell.value) })
    }
    if (gap && !bounded.length) return { clauses: [notEvaluable(BEGINS), notEvaluable(ENDS)], why: '; a role\'s credit bound is not established' }
    if (undecided && !bounded.length) {
        const owes = 'the credit bound of each role, still open to a choice'
        return { clauses: [deferred(BEGINS, owes), deferred(ENDS, owes)], why: '; a role\'s credit bound is not yet decided' }
    }
    if (!bounded.length) return { clauses: [pass(BEGINS, 0), pass(ENDS, 0)], why: '' }

    // How many teams the game holds, where its team classes fix it (OTHER is decided only between exactly two). One count per
    // establishing item: the members realization instantiates from a claim (post-realization-gate.ts) carry the claim's item and
    // no cardinality of their own, so they are the claim's members, never more teams. An item no class gives a fixed count fixes none.
    const teamGroups = new Map<string, ElementClass[]>()
    for (const c of ctx.index.designations.teamsRow ? allClassesOn(ctx, ctx.index.designations.teamsRow) : []) {
        const key = `${c.fromItem.contractId}::${c.fromItem.itemId}`
        teamGroups.set(key, [...(teamGroups.get(key) ?? []), c])
    }
    const fixedCount = (group: ElementClass[]): number | null => {
        const fixed = group.find(c => c.cardinality.min !== null && c.cardinality.min === c.cardinality.max)
        return fixed ? Number(fixed.cardinality.min) : null
    }
    const counts = [...teamGroups.values()].map(fixedCount)
    const teamCount = counts.length && counts.every(n => n !== null) ? counts.reduce<number>((sum, n) => sum + (n as number), 0) : null
    const termsOf = (transition: ElementClass): Record<string, unknown> =>
        Object.fromEntries((transition.constraints?.terms || []).filter(t => t.op === '=').map(t => [t.attribute, (t as { value: unknown }).value]))
    const triggerOf = (transition: ElementClass): string => String(termsOf(transition).trigger ?? 'not fixed')
    const relationOf = (transition: ElementClass, holder: string): AwardeeRelation | 'OPEN' | 'GAP' => {
        const award = probe.cell(lineOf(transition.classId, 'T2'))
        if (award.state === 'OPEN') return 'OPEN'
        if (award.state !== 'DERIVED') return 'GAP'
        return awardeeRelation(ctx.index, award.value, termsOf(transition), holder, teamCount)
    }
    const verdictOf = (fails: boolean, blocked: boolean, open: boolean, instances: number, clause: string, owes: string): ClauseResult =>
        fails ? fail(clause, instances) : blocked ? notEvaluable(clause) : open ? deferred(clause, owes) : pass(clause, instances)

    let beginsFail = false
    let beginsBlocked = gap
    let beginsOpen = undecided
    let beginsInstances = 0
    let endsFail = false
    let endsBlocked = gap
    let endsOpen = undecided
    let endsInstances = 0
    const said: string[] = []
    for (const role of bounded) {
        // Clause 4: the beginnings of the role's episode, each awarded to its holder.
        const typed = typedFor(role.scope)
        const starters = new Set<string>()
        const awardedAway: string[] = []
        if (!typed) beginsBlocked = true
        else {
            const found = buildOutStarters(ctx, probe, typed)
            if (!found.starters.length && !found.undecided.length && !found.blocked.length) beginsFail = true
            if (found.undecided.length) beginsOpen = true
            if (found.blocked.length) beginsBlocked = true
            for (const starter of found.starters) {
                starters.add(starter.classId)
                beginsInstances++
                const transition = classesOn(ctx, 'T1').find(c => c.classId === starter.classId)!
                const relation = relationOf(transition, role.holder)
                if (relation === 'OTHER') {
                    beginsFail = true
                    awardedAway.push(starter.classId)
                } else if (relation === 'OPEN') beginsOpen = true
                else if (relation !== 'HOLDER') beginsBlocked = true
            }
        }

        // Clause 5: every transition that can take possession from the holder begins an episode.
        const enders: string[] = []
        const keepers: string[] = []
        const kept: string[] = []
        let possessionChanges = 0
        for (const transition of classesOn(ctx, 'T1')) {
            const trigger = triggerOf(transition)
            if (trigger === 'POSSESSION_CHANGE') {
                const starts = probe.cell(lineOf(transition.classId, 'T7'))
                possessionChanges++
                endsInstances++
                if (starts.state === 'DERIVED' && String(starts.value) === 'true') enders.push(transition.classId)
                else if (starts.state === 'DERIVED') {
                    endsFail = true
                    kept.push(`${transition.classId} (a change of possession that begins no episode)`)
                } else if (starts.state === 'OPEN') endsOpen = true
                else endsBlocked = true
                continue
            }
            const playState = probe.cell(lineOf(transition.classId, 'T6'))
            if (playState.state === 'OPEN') {
                endsOpen = true
                continue
            }
            if (playState.state !== 'DERIVED') {
                endsBlocked = true
                continue
            }
            if (String(playState.value) !== 'STOP_RESUME') continue
            endsInstances++
            const starts = probe.cell(lineOf(transition.classId, 'T7'))
            if (starts.state === 'OPEN') {
                endsOpen = true
                continue
            }
            if (starts.state !== 'DERIVED') {
                endsBlocked = true
                continue
            }
            if (String(starts.value) === 'true') {
                if (!starters.has(transition.classId)) enders.push(transition.classId)
                continue
            }
            const relation = relationOf(transition, role.holder)
            if (relation === 'HOLDER') keepers.push(transition.classId)
            else if (relation === 'OTHER') {
                endsFail = true
                kept.push(`${transition.classId} (a restart awarded away from ${role.holder} that begins no episode)`)
            } else if (relation === 'OPEN') endsOpen = true
            else endsBlocked = true
        }
        if (!possessionChanges) endsBlocked = true
        said.push(
            `${role.classId} (${role.holder}) earns its credit within ${role.scope}: begun by ${[...starters].join(', ') || 'no transition'}` +
                (awardedAway.length ? ` (awarded away from ${role.holder}: ${awardedAway.join(', ')})` : '') +
                `; ended by ${enders.join(', ') || 'no transition'}` +
                (possessionChanges ? '' : ' (the game holds no change of possession, so its end at a loss of possession is not established)') +
                `; kept by ${keepers.join(', ') || 'no transition'} (restarts awarded to ${role.holder} that begin no episode)` +
                (kept.length ? `; credit not ended by ${kept.join('; ')}` : ''),
        )
    }
    return {
        clauses: [
            verdictOf(beginsFail, beginsBlocked, beginsOpen, beginsInstances, BEGINS, 'which transitions begin each bounded role\'s episode, and their realized awardees'),
            verdictOf(endsFail, endsBlocked, endsOpen, endsInstances, ENDS, 'the realized play state, episode boundary and awardee of each transition that may take possession from a bounded role'),
        ],
        why: `; credit confined to an episode: ${said.join('; ')}`,
    }
}

function gaEpisodeReachable(ctx: GateContext): CheckOutcome {
    const CLAUSE = 'every condition authored for an episode has a transition that can begin that episode'
    const AWARDEE = 'every transition that begins such an episode is awarded to one and the same team'
    const probe = new Probe(ctx, 'GA-EPISODE-REACHABLE')
    const scopeOf = (cls: ElementClass) =>
        String((ctx.contracts.find(c => c.contractId === cls.fromItem.contractId)?.items ?? []).find(i => i.itemId === cls.fromItem.itemId)?.scope ?? '')
    const scoped = ctx.classes.filter(c => c.row === 'V3' && EPISODE_SCOPES.includes(scopeOf(c)))
    /** The typed begin condition an episode-scoped condition holds for its own episode (C58), for the given scope. */
    const typedFor = (scope: string): BeginConditionReferent | undefined =>
        scoped
            .filter(c => scopeOf(c) === scope)
            .flatMap(c => {
                const cell = probe.peek(lineOf(c.classId, 'V5'))
                const values = cell.state === 'DERIVED' ? (Array.isArray(cell.value) ? cell.value : [cell.value]) : []
                return values.map(beginConditionReferentOf).filter((referent): referent is BeginConditionReferent => referent !== null && referent.beginsEpisodeOf === scope)
            })
            .find(() => true)
    const resets = placementResets(ctx, probe, typedFor)
    // Clauses 4 and 5 (stage M1, register version 14): appended on every path, after the reach clause context-scoring-guard.ts reads first.
    const credit = creditClauses(ctx, probe, typedFor)
    if (!scoped.length) return result('GA-EPISODE-REACHABLE', probe, [pass(CLAUSE, 0), pass(AWARDEE, 0), resets.clause, ...credit.clauses], 'no condition is authored for an episode' + resets.why + credit.why)
    const named = scoped.map(c => `${c.classId} (${scopeOf(c)})`).join(', ')

    // The typed begin condition, where an episode-scoped condition holds one as its referent (C58) — and only one for THAT
    // condition's episode. K5 review, 15 October 2026: the referent's own `beginsEpisodeOf` was never read, so a begin
    // condition naming another episode passed a build-out condition (measured on a TEST-ONLY copy: PASS). Now such a referent
    // types nothing here and the check withholds exactly as it did before C58.
    const typed = scoped
        .flatMap(c => {
            const cell = probe.peek(lineOf(c.classId, 'V5'))
            const values = cell.state === 'DERIVED' ? (Array.isArray(cell.value) ? cell.value : [cell.value]) : []
            return values.map(beginConditionReferentOf).filter((referent): referent is BeginConditionReferent => referent !== null && referent.beginsEpisodeOf === scopeOf(c))
        })
        .find(() => true)
    if (typed) {
        const found = buildOutStarters(ctx, probe, typed)
        const reach = found.starters.length
            ? pass(CLAUSE, scoped.length)
            : found.undecided.length
              ? deferred(CLAUSE, 'the realized play state, episode boundary and taker of each transition that may begin the episode, which fix whether it meets the begin condition')
              : found.blocked.length
                ? notEvaluable(CLAUSE)
                : fail(CLAUSE, scoped.length)
        // D7: one awardee for every transition that meets the begin condition, compared as canonical entries.
        const awardees = found.starters.map(starter => ({ classId: starter.classId, cell: probe.cell(lineOf(starter.classId, 'T2')) }))
        const keys = [...new Set(awardees.filter(a => a.cell.state === 'DERIVED').map(a => designationKey(ctx.index, (a.cell as { value: unknown }).value)))]
        const awardee =
            keys.length > 1
                ? fail(AWARDEE, awardees.length)
                : awardees.some(a => a.cell.state === 'OPEN') || found.undecided.length
                  ? deferred(AWARDEE, 'the realized awardee of each transition that begins the episode, and whether each undecided transition is one')
                  : awardees.some(a => a.cell.state !== 'DERIVED') || found.blocked.length
                    ? notEvaluable(AWARDEE)
                    : pass(AWARDEE, awardees.length)
        return result(
            'GA-EPISODE-REACHABLE',
            probe,
            [reach, awardee, resets.clause, ...credit.clauses],
            `${scoped.length} condition(s) are authored for an episode — ${named}; the begin condition is typed (${typed.asAuthored ?? 'C58'}): ` +
                `${found.starters.length} transition(s) begin one (${found.starters.map(s => `${s.classId}: ${s.trigger}`).join('; ') || 'none'})` +
                (found.starters.length ? `, awarded to ${keys.join(', ') || 'no established team'}` : '') +
                (found.undecided.length ? `; ${found.undecided.length} undecided until realization: ${found.undecided.join('; ')}` : '') +
                (found.blocked.length ? `; ${found.blocked.length} blocked on a gap: ${found.blocked.join('; ')}` : '') +
                (found.ruledOut.length ? `; ruled out: ${found.ruledOut.join('; ')}` : '') +
                resets.why +
                credit.why,
        )
    }

    const candidates: { classId: string; trigger: string }[] = []
    const ruledOut: string[] = []
    for (const transition of classesOn(ctx, 'T1')) {
        const term = (transition.constraints?.terms || []).find(t => t.attribute === 'trigger' && t.op === '=')
        const trigger = term && term.op === '=' ? String(term.value) : null
        if (trigger === 'POSSESSION_CHANGE') {
            ruledOut.push(`${transition.classId} (a possession change begins an attacking episode, never a build-out one)`)
            continue
        }
        const starts = probe.cell(lineOf(transition.classId, 'T7'))
        if (starts.state === 'DERIVED' && String(starts.value) !== 'true') {
            ruledOut.push(`${transition.classId} (begins no episode)`)
            continue
        }
        candidates.push({ classId: transition.classId, trigger: trigger ?? 'not fixed' })
    }

    if (!candidates.length) {
        return result(
            'GA-EPISODE-REACHABLE',
            probe,
            [fail(CLAUSE, scoped.length), pass(AWARDEE, 0), resets.clause, ...credit.clauses],
            `${scoped.length} condition(s) are authored for an episode — ${named} — and no transition can begin one` +
                (ruledOut.length ? `: ${ruledOut.join('; ')}` : ': the game holds no transition element') +
                resets.why +
                credit.why,
        )
    }
    const takers = candidates.map(c => probe.cell(lineOf(c.classId, 'T3')))
    const verdict = takers.some(t => t.state === 'OPEN')
        ? deferred(CLAUSE, 'the realized taker of the episode-starting transition, which fixes whether the episode begins as the begin condition requires')
        : notEvaluable(CLAUSE)
    // Untyped: which transitions begin the episode is not established, so neither is whether they share an awardee.
    return result(
        'GA-EPISODE-REACHABLE',
        probe,
        [verdict, verdict.verdict === 'DEFERRED_TO_REALIZATION' ? deferred(AWARDEE, 'which transitions begin the episode, and their realized awardees') : notEvaluable(AWARDEE), resets.clause, ...credit.clauses],
        `${scoped.length} condition(s) are authored for an episode — ${named}; ${candidates.length} transition(s) may begin one ` +
            `(${candidates.map(c => `${c.classId}: ${c.trigger}`).join('; ')}), and whether one begins as the begin condition requires is not established` +
            resets.why +
            credit.why,
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
    // One blocked flag per clause (SD-65: the categories are reported per clause, not collapsed). A
    // STOP_RESUME transition whose taker is unauthored blocks the resume clause and nothing else; it
    // used to mark the CONTINUE clause not-evaluable too, which reported three real instances the
    // clause had genuinely examined as if it had never run.
    let continueBlocked = false
    let resumeBlocked = false
    /**
     * **An OPEN taker or region is realization's to close, so the clause DEFERS rather than fails on it** — 15 October 2026
     * (register version 12). Christian, reply filed 17 October 2026, M3 (quoted whole in the register's T4 `fillableAuthority`):
     * *"coach-selected restart locations, and activity-specific restart methods."* and D5: *"The coach chooses an appropriate
     * restart location consistent with the intended build-out situation."* A coach-selected location is an open line before
     * realization (closed COACH_DECIDES), and every open line takes exactly one value there, so the region a STOP_RESUME
     * transition carries is owed, not missing: the clause is asked again over the concrete game (post-realization gate), where
     * it passes only if the value is there. Until 15 October an open region counted as a violation, which no coach-selected
     * restart location could ever pass (measured on Play Out from the Back's provisional realization: five transitions).
     * Nothing else moves: a FAILED taker or region still blocks, and a missing one still fails.
     */
    let resumeDeferred = false
    let continueSeen = 0
    let resumeSeen = 0

    for (const transition of transitions) {
        const state = probe.cell(lineOf(transition.classId, 'T6'))
        if (state.state !== 'DERIVED') {
            // Which clause applies is unknown while the play state is, so this one blocks both.
            continueBlocked = true
            resumeBlocked = true
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
                if (actor.state === 'FAILED' || region.state === 'FAILED') resumeBlocked = true
                else if ((actor.state === 'OPEN' || carries(actor)) && (region.state === 'OPEN' || carries(region))) resumeDeferred = true
                else resumeViolations.push(transition.classId)
            }
        }
    }

    const continueClause = continueViolations.length ? fail(CONTINUE_CLAUSE, continueSeen) : continueBlocked ? notEvaluable(CONTINUE_CLAUSE) : pass(CONTINUE_CLAUSE, continueSeen)
    const resumeClause = resumeViolations.length
        ? fail(RESUME_CLAUSE, resumeSeen)
        : resumeBlocked
          ? notEvaluable(RESUME_CLAUSE)
          : resumeDeferred
            ? deferred(RESUME_CLAUSE, 'the realized taker and region of each STOP_RESUME transition whose taker or region is an open choice (a coach-selected restart location closes COACH_DECIDES)')
            : pass(RESUME_CLAUSE, resumeSeen)
    return result(
        'GA-TRANSITION-COHERENCE',
        probe,
        [continueClause, resumeClause],
        `${continueViolations.length} CONTINUE transition(s) carry a placement; ${resumeViolations.length} STOP_RESUME transition(s) lack a taker or region` +
            // Without this, a clause blocked on an unauthored taker reads "0 lack a taker or region",
            // which is true of violations and false of the corpus.
            (resumeBlocked ? '; the resume clause is blocked on an unauthored taker or region, so it counts no violation either way' : '') +
            (!resumeBlocked && !resumeViolations.length && resumeDeferred ? '; the resume clause is owed to realization: a taker or region is an open choice' : ''),
    )
}

/**
 * Is this authored trigger one the register holds?
 *
 * The register writes a parameterised trigger as `REGION_ENTRY {region}` and `TIME_EXPIRY {window}`,
 * so an argument in braces is its own notation and reading past it is reading the register rather
 * than interpreting the author. **Everything else is not.** `REGION_ENTRY {attacking half} + first
 * receiver` is not a registered trigger with an argument — it is a region entry conjoined with a
 * condition the trigger vocabulary has no room for, and saying otherwise would be inventing the
 * qualifier it needs.
 */
function registeredTrigger(name: string, vocabulary: string[]): boolean {
    if (vocabulary.includes(name)) return true
    const parameterised = name.match(/^([A-Z_]+)\s*\{[^{}]*\}$/)
    return !!parameterised && vocabulary.includes(parameterised[1])
}

/**
 * The line a trigger's registered semantics say its evaluability depends on, or null where it names none.
 *
 * Keyed on the bare trigger name, so a parameterised form like `REGION_ENTRY {a wide channel}` consults the
 * same entry as the token itself — the parameter narrows which instance, not what the kind means.
 */
function triggerDependency(ctx: GateContext, name: string): string | null {
    const bare = name.match(/^([A-Z_]+)\s*\{[^{}]*\}$/)?.[1] ?? name
    const entry = ctx.index.triggerSemantics?.[bare]
    const row = entry && typeof entry === 'object' ? entry.evaluabilityDependsOn : undefined
    return row ? `game::${String(row)}` : null
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
        // A rule names a registered trigger when **every trigger it could name** is registered.
        // Restating an authored alternatives set into machine-readable form (SD-79) turns one derived
        // value into a permitted set, and reading only the derived value would then stop examining
        // the very members the clause is about — the failure would disappear without being settled.
        // Reading the permitted set is reading what the run established, as SD-99 requires.
        const triggerLine = lineOf(rule.classId, 'V17')
        const trigger = probe.cell(triggerLine)
        const permitted =
            trigger.state === 'DERIVED'
                ? [trigger.value]
                : trigger.state === 'OPEN'
                  ? (ctx.derived.get(triggerLine)?.narrowedTo?.members ?? [])
                  : []
        for (const member of permitted) {
            const name = typeof member === 'object' && member ? String((member as any).trigger) : String(member)
            if (!registeredTrigger(name, vocabulary)) {
                badTriggers.push(`${rule.classId}:${name}`)
                continue
            }
            /**
             * **A registered trigger's own semantics are consulted, not just its membership of the list.**
             *
             * His ruling of 4 October, as a bounded integrity correction: *"It makes an already-authored
             * semantic dependency enforceable rather than leaving it in prose."*
             *
             * `FIRST_FORWARD_PASS` states its own precondition — *"Forward is relative to the passing team
             * attacking direction, which the representation establishes (SD-95); where that direction is FREE
             * the trigger is NOT EVALUABLE and its line is CONDITIONAL, never failed"* — and nothing enforced
             * it. This check tested list membership alone, so the trigger passed on membership regardless of
             * whether the direction it is defined against existed at all.
             *
             * Only the machine-readable `evaluabilityDependsOn` is acted on; the prose stays prose, because
             * reading a precondition out of prose is what SD-32 forbids. And the consequence is the one the
             * note already asked for: the clause is **blocked**, so the check reports NOT_EVALUABLE rather
             * than failing — a trigger whose definition cannot be evaluated is not a violation.
             */
            const dependsOn = triggerDependency(ctx, name)
            if (dependsOn && probe.cell(dependsOn).state !== 'DERIVED') probe.unestablished(dependsOn)
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
/**
 * `GA-NO-FAILED-LINE`, under his governing distinction of 29 September:
 *
 *   > *A line is a realization-blocking gap only when the resolved game **requires** that property to
 *   > be established and no authority establishes it.*
 *
 * A line with no value is therefore not automatically a failure, and the four cases are kept apart
 * rather than collapsed into one count:
 *
 *   | | |
 *   |---|---|
 *   | **required but unestablished** | an object declares it needs the row, or claims it and nothing resolved — **blocks** |
 *   | **explicitly excluded** | the knowledge establishes the property is not part of this structure — an *established absence*, not a missing value |
 *   | **not constrained** | the object looked and imposes no requirement — no value and no realization authority, but no failure either |
 *   | **open with authority** | a realization choice; never in this check |
 *
 * **The obvious danger is that this becomes a way of not failing.** Two things hold it: requiredness
 * is read from what an object *declared about the row*, never from the mere absence of a value; and
 * every non-blocking line is still counted and named in the reason, so nothing leaves the report. A
 * property nobody requires and nobody excludes is simply not part of this game — and a realization
 * layer may not fill it either, because it never appears as `open`.
 */
function gaNoFailedLine(ctx: GateContext): CheckOutcome {
    const CLAUSE_TEXT = 'every property the resolved game requires is established'
    const probe = new Probe(ctx, 'GA-NO-FAILED-LINE')
    const lines = [...ctx.classified.values()].filter(l => l.lineState === 'ENUMERATED')
    const enumerated = lines.length
    const withoutValue = lines.filter(l => l.verdict === 'NOT_AUTHORED' || l.verdict === 'UNRESOLVED' || l.verdict === 'INVENTED')

    // `UNRESOLVED` and `INVENTED` always block: something did establish a value and it is unusable,
    // which is a different failure from nobody establishing one.
    const blocking = withoutValue
        .filter(l => l.verdict !== 'NOT_AUTHORED' || l.reason === 'declared gap' || l.reason === 'claimed but unresolved')
        .map(l => l.lineId)
        .sort()
    const excluded = withoutValue.filter(l => l.reason === 'excluded').length
    const notConstrained = withoutValue.filter(l => l.reason === 'not constrained').length
    const unspoken = withoutValue.filter(l => l.reason === 'coverage' || l.reason === 'no coverage').length

    // His M6 (17 October): "No further value is required" is kept apart from a non-claim that merely does not constrain,
    // so the aside says how many of the 'not constrained' lines are each — and says nothing new where none is.
    const noFurtherValue = withoutValue.filter(l => nonClaimState(l.reason, l.governedBy) === NO_FURTHER_VALUE).length

    for (const lineId of blocking) if (!probe.subjects.includes(lineId)) probe.subjects.push(lineId)
    const aside =
        `${excluded} excluded, ${notConstrained} not constrained${noFurtherValue ? ` (${noFurtherValue} of them needing no further value)` : ''}, ${unspoken} unspoken` +
        ' — established absences and non-requirements, not missing values'
    return result(
        'GA-NO-FAILED-LINE',
        probe,
        [blocking.length ? fail(CLAUSE_TEXT, enumerated) : pass(CLAUSE_TEXT, enumerated)],
        blocking.length
            ? `${blocking.length} required line(s) are unestablished: ${blocking.slice(0, 6).join(', ')}${blocking.length > 6 ? ', …' : ''}. Beside them, ${aside}`
            : `every required property is established. Beside them, ${aside}`,
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
            // By the referent's resolved class, typed or not (14 October 2026, component 1): a typed reference
            // looked up as `String(value)` was "[object Object]" and failed as naming no held element.
            const target = referentClass(ctx, referent.value)
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
    } else if (kind.state === 'OPEN') {
        // The count is established — it is the *kind* that is an open choice among the members the
        // selection narrowed to. Both halves of this clause are reported in `why`, so nothing hides
        // behind the deferral: the "exactly one" half holds, and "of a registered kind" waits on the
        // choice. Realization can only choose inside the permitted set, so the answer is bounded
        // before it is made — which is why deferring it is safe rather than hopeful.
        oneClause = deferred(ONE, 'the chosen primary-event kind, from the set the selection narrowed')
    } else oneClause = notEvaluable(ONE)

    const valueClause = value.state === 'DERIVED' ? (toRational(value.value) ? pass(VALUE, 1) : fail(VALUE, 1)) : notEvaluable(VALUE)

    // "every member of its reference has a space position" — each condition's referents must name a
    // held element that carries a derived position. Previously claimed and never examined.
    //
    // **Two corrections of 14 October 2026** — Step 4 component 1, which he approved that day (*"Correct the
    // two reference/condition faults"*):
    //
    //   - **An established absence is an answer here too.** A condition whose referent line the knowledge
    //     excluded or declared it does not constrain names no place: it is counted as such, and it is not a
    //     block. Before, anything not DERIVED blocked, so a condition that legitimately names no place could
    //     never be evaluated, before realization or after it. A missing line, or one that is a gap, still
    //     blocks exactly as before.
    //   - **Deferral needs a POSITION to be what is pending.** The clause deferred whenever the check had
    //     anything pending at all, and in every case measured that was the open scoring kind (`game::V1`),
    //     not a position — so a referent that was open text, which nothing realization does can resolve, read
    //     as deferred before realization and unevaluable after it. Now it defers only where a referent's own
    //     position line is open, and anything else that blocks is NOT_EVALUABLE. A tightening, not a relief.
    const positioned: string[] = []
    const unpositioned: string[] = []
    let namesNoPlace = 0
    let positionPending = false
    let otherwiseBlocked = false
    for (const condition of classesOn(ctx, 'V3')) {
        const referents = probe.cell(lineOf(condition.classId, 'V5'))
        if (referents.state === 'ABSENT' && referents.established) {
            namesNoPlace++
            continue
        }
        if (referents.state !== 'DERIVED') {
            otherwiseBlocked = true
            continue
        }
        // A relational referent (M8, 15 October 2026) stands for every reference it designates, and each of those must
        // be positioned: the clause iterates the resolved set, so it neither skips the referent nor reads it as text.
        const named: unknown[] = []
        for (const written of Array.isArray(referents.value) ? referents.value : [referents.value]) {
            // A begin-condition referent (C58, 15 October 2026) names restarts, not a place: where each begins is the
            // transition's own placement (GA-TRANSITION-COHERENCE), and which restarts meet it is GA-EPISODE-REACHABLE's.
            if (beginConditionReferentOf(written)) {
                namesNoPlace++
                continue
            }
            const relational = relationalReferentOf(written)
            if (!relational) {
                named.push(written)
                continue
            }
            const resolution = resolveRelational(ctx, probe, relational, lineOf(condition.classId, 'V5'))
            if (resolution.dangling) unpositioned.push(`${describeReferent(written)}: ${resolution.dangling}`)
            else if (resolution.pending) otherwiseBlocked = true
            named.push(...resolution.references)
        }
        for (const name of named) {
            // SD-63 — open text establishes no identity, so it establishes no violation either.
            if (identityOf(ctx, name) === 'OPEN_TEXT') {
                probe.unestablished(lineOf(condition.classId, 'V5'))
                otherwiseBlocked = true
                continue
            }
            // By resolved class, so a typed reference is looked up as what it names (component 1).
            const target = referentClass(ctx, name)
            if (!target) {
                unpositioned.push(`${describeReferent(name)} names no held element`)
                continue
            }
            const rows = target.row === 'S2' ? ['S5', 'S6'] : target.row === 'O1' ? ['O4', 'O5'] : null
            if (!rows) {
                unpositioned.push(`${describeReferent(name)} is not an element the space positions`)
                continue
            }
            const cells = rows.map(r => probe.cell(lineOf(target.classId, r)))
            if (cells.every(c => c.state === 'DERIVED')) positioned.push(describeReferent(name))
            else if (cells.every(c => c.state === 'DERIVED' || c.state === 'OPEN')) positionPending = true
            else otherwiseBlocked = true
        }
    }
    // Post-realization **where position is the unresolved dependency** — his wording, and the condition
    // matters. A referent that names no held element still FAILS here, and one blocked for any reason
    // other than an open position still blocks; only a position realization is authorized to supply
    // moves the clause downstream.
    const positionClause = unpositioned.length
        ? fail(POSITION, positioned.length + unpositioned.length)
        : otherwiseBlocked
          ? notEvaluable(POSITION)
          : positionPending
            ? deferred(POSITION, 'the chosen position of every referent of the primary event')
            : pass(POSITION, positioned.length)

    // Stage M2 (register version 14, rows V27-V31): appended, and only where the game holds an occurrence that also counts as the
    // primary event, so every other game's clauses and reason read exactly as they did.
    const also = alsoCountsClauses(ctx, probe)
    return result(
        'GA-ONE-PRIMARY-EVENT',
        probe,
        [oneClause, valueClause, positionClause, outside(STATES), ...also.clauses],
        `${events.length || (entailedBySd06 ? 1 : 0)} primary event(s); ${positioned.length} positioned referent(s); ${unpositioned.length} unpositioned` +
            (namesNoPlace ? `; ${namesNoPlace} condition(s) name no place` : '') +
            also.why,
    )
}

/**
 * **An occurrence that also counts as the one primary event, for one team** — 17 October 2026 (stage M2, register version 14, rows
 * V27 `value.primaryEvent.alsoCounts[]`, V28 team, V29 trigger, V30 control, V31 exclusion). Christian, reply filed 19 October 2026,
 * item 2: *"For the previously flagged corner case, I favor allowing a controlled regain inside that area to count as a score,
 * provided the pressing team genuinely establishes possession."* *"A contested touch, deflection, or loose ball should not
 * qualify."* *"This is a provisional scoring choice for the current realization, not a universal rule equating every regain with
 * successful progression."* His 17 October D3: *"Please verify that the two targets can coexist without overlapping or
 * contradictory scoring conditions."* Item 5: *"Any further changes should address general capabilities rather than introduce
 * special cases for this Learning Goal."* (Reading 'count as a score' as counting as the one primary event and earning its value
 * is OUR READING, SD-113; the clauses below are our engineering.)
 *
 * Only tightens: SD-06's "exactly one primary event" is clause 1 above and is unchanged. Eight clauses, each over every element:
 *
 *   - **team** — V28 names exactly one team of the game for the block (a setup assignment, or a role holder through the block);
 *     a designation of every team, or one decided by possession, an episode, a trigger or an outcome, FAILS;
 *   - **trigger** — V29 is a member of its closed list, the game holds a transition keyed on it in which play continues (an event
 *     in play, never a restart award), and the game holds the score transition that follows it (the register's SCORE trigger: it
 *     is a score, so that transition governs play state at that moment);
 *   - **target** — the element's own team attacks exactly one primary objective, whose reference is positioned (deferred until
 *     realization places it): the occurrence lies inside THAT target (the register's targetOf, his "inside that area"), so it can
 *     never reach the other team's target;
 *   - **control** — V30 is stated (the possession relation states nothing about how possession is gained, PS1);
 *   - **one per team** — at most one element per team;
 *   - **episode** — the trigger's transition begins an episode (T7 true), so the occurrence is evaluated in the episode its trigger
 *     begins, and it begins none that an episode-scoped condition of the primary event is authored for, so no such condition can
 *     govern it (OUR INFERENCE from his item 1, *"If the building team loses possession, that scoring opportunity ends."*, and
 *     RPC-001-17.a; labelled so);
 *   - **no whole-game condition** — no condition of the primary event is authored for every score: one would govern this
 *     occurrence too, or not, and the representation does not say which, so the contradiction is refused rather than guessed;
 *   - **credit bound** (added in the stage M2 review, 17 October 2026) — the element's team, in the block, holds no role whose
 *     scoring credit is confined to an episode (row B8 other than WHOLE_GAME) that its trigger does not begin. His item 1:
 *     *"If the building team loses possession, that scoring opportunity ends. If it subsequently regains possession, play may
 *     continue, but the original build-out scoring opportunity is not restored."* and *"Please ensure the underlying scoring
 *     eligibility reflects this distinction, rather than relying solely on the coach-facing wording."* Measured before this
 *     clause on TEST-ONLY copies: an element for the building role's holder, or for a setup team in the block where that team
 *     builds, passed every structural check in both blocks and was refused only at communication (its wording) - a credit outside
 *     the role's own episode that only the coach-facing wording held back. The bound is read as GA-EPISODE-REACHABLE's fourth
 *     clause reads it: only silence is unbounded; a bound still open defers, one not established withholds.
 *
 * No clause is added where the game holds no element. Every name read is the register's (row ids, the closed list, the SCORE and
 * POSSESSION_CHANGE triggers already read in this file); no team, role, kind or sport term is named.
 */
const ALSO_COUNTS_ROW = 'V27'
const SCORE_TRIGGER = 'SCORE'

function alsoCountsClauses(ctx: GateContext, probe: Probe): { clauses: ClauseResult[]; why: string } {
    const elements = classesOn(ctx, ALSO_COUNTS_ROW)
    if (!elements.length) return { clauses: [], why: '' }
    const TEAM = 'every occurrence that also counts as the primary event is for exactly one team'
    const TRIGGER = 'its trigger is an event in play the game holds, and the game holds the score that follows it'
    const TARGET = 'it lies inside the one positioned target its own team attacks'
    const CONTROL = 'it states the control under which the occurrence is established'
    const ONE = 'at most one such occurrence for each team'
    const EPISODE = 'its trigger begins an episode, and none that a condition of the primary event is authored for'
    const WHOLE = 'no condition of the primary event is authored for every score beside it'
    const CREDIT = 'its team holds no role whose scoring credit is confined to an episode its trigger does not begin'
    type Tally = { fail: boolean; blocked: boolean; open: boolean; instances: number }
    const tally = (): Tally => ({ fail: false, blocked: false, open: false, instances: 0 })
    const verdictOf = (t: Tally, clause: string, owes: string): ClauseResult => (t.fail ? fail(clause, t.instances) : t.blocked ? notEvaluable(clause) : t.open ? deferred(clause, owes) : pass(clause, t.instances))
    const team = tally()
    const trigger = tally()
    const target = tally()
    const control = tally()
    const one = tally()
    const episode = tally()
    const whole = tally()
    const credit = tally()
    const said: string[] = []
    const termsOf = (cls: ElementClass): Record<string, unknown> => Object.fromEntries((cls.constraints?.terms || []).filter(t => t.op === '=').map(t => [t.attribute, (t as { value: unknown }).value]))
    const transitionsOn = (value: string) => classesOn(ctx, 'T1').filter(transition => String(termsOf(transition).trigger) === value)
    const scopeOf = (cls: ElementClass) => String((ctx.contracts.find(c => c.contractId === cls.fromItem.contractId)?.items ?? []).find(i => i.itemId === cls.fromItem.itemId)?.scope ?? '')
    const conditions = classesOn(ctx, 'V3')
    const episodeScopes = [...new Set(conditions.map(scopeOf).filter(scope => EPISODE_SCOPES.includes(scope)))]
    // The typed begin condition an episode-scoped condition holds for its own episode (C58), read as GA-EPISODE-REACHABLE reads it.
    const typedFor = (scope: string): BeginConditionReferent | undefined =>
        conditions
            .filter(c => scopeOf(c) === scope)
            .flatMap(c => {
                const cell = probe.peek(lineOf(c.classId, 'V5'))
                const values = cell.state === 'DERIVED' ? (Array.isArray(cell.value) ? cell.value : [cell.value]) : []
                return values.map(beginConditionReferentOf).filter((referent): referent is BeginConditionReferent => referent !== null && referent.beginsEpisodeOf === scope)
            })
            .find(() => true)
    const teams = new Map<string, string[]>()
    // Each role's credit bound (row B8), read as GA-EPISODE-REACHABLE's fourth clause reads it, with the team holding the role in
    // this block (null where no block says it). Stage M2 review, 17 October 2026.
    type Bound = { role: string; team: string | null; state: 'BOUNDED' | 'OPEN' | 'BLOCKED'; scope: string }
    const bounds: Bound[] = []
    const roleSpec = ctx.index.roleBlocks
    for (const roleElement of roleSpec ? classesOn(ctx, roleSpec.rolesRow) : []) {
        const lineId = lineOf(roleElement.classId, CREDIT_ROW)
        const cell = probe.peek(lineId)
        const silent = (cell.state === 'ABSENT' && cell.established) || (cell.state === 'FAILED' && ctx.classified.get(lineId)?.verdict === 'NOT_AUTHORED')
        if (silent || (cell.state === 'DERIVED' && String(cell.value) === 'WHOLE_GAME')) continue
        const term = (roleElement.constraints?.terms || []).find(t => t.attribute === roleSpec!.roleAttribute && t.op === '=')
        const role = term && term.op === '=' ? String(term.value) : ''
        const holder = roleHolderNames(ctx.index).find(name => roleOfHolder(ctx.index, name) === role)
        const holderTeam = holder ? teamOf(ctx, holder) : null
        if (cell.state === 'OPEN') {
            probe.cell(lineId)
            bounds.push({ role, team: holderTeam, state: 'OPEN', scope: '' })
        } else if (cell.state !== 'DERIVED' || !holder) {
            probe.cell(lineId)
            bounds.push({ role, team: holderTeam, state: 'BLOCKED', scope: '' })
        } else bounds.push({ role, team: holderTeam, state: 'BOUNDED', scope: String(cell.value) })
    }

    for (const element of elements) {
        // Team: exactly one team for the block.
        const teamCell = probe.cell(lineOf(element.classId, 'V28'))
        let resolvedTeam: string | null = null
        // Whether this element's team is one team, none, or not yet known. A role holder read outside a block (a derivation with no role
        // block, which the checked pathway never serves: it derives each block) names one team in every block, but which one the block
        // says, so it is owed, as GA-RELATIVE-PLACEMENT defers a direction it cannot read for a role holder there.
        let teamState: 'ONE' | 'NONE' | 'OPEN' | 'BLOCKED' = 'BLOCKED'
        team.instances++
        if (teamCell.state === 'OPEN') teamState = 'OPEN'
        else if (teamCell.state === 'DERIVED') {
            const kind = resolutionOf(ctx.index, teamCell.value)?.kind
            if (kind === 'BLOCK_ROLE' && !ctx.roleBlock) teamState = 'OPEN'
            else if (kind === 'BLOCK_ROLE' || kind === 'SETUP_ASSIGNMENT') {
                resolvedTeam = teamOf(ctx, String(teamCell.value))
                teamState = resolvedTeam ? 'ONE' : 'NONE'
            } else teamState = 'NONE'
        }
        if (teamState === 'OPEN') team.open = true
        else if (teamState === 'BLOCKED') team.blocked = true
        else if (teamState === 'NONE') team.fail = true
        if (resolvedTeam) teams.set(resolvedTeam, [...(teams.get(resolvedTeam) ?? []), element.classId])

        // Trigger: a member of the closed list, an event in play the game holds, followed by a score the game holds.
        const triggerCell = probe.cell(lineOf(element.classId, 'V29'))
        const listed = ctx.index.vocabularies.get('V29.trigger') ?? []
        let keyed: ElementClass[] = []
        const triggerNotes: string[] = []
        trigger.instances++
        if (triggerCell.state === 'OPEN') trigger.open = true
        else if (triggerCell.state !== 'DERIVED') trigger.blocked = true
        else if (!listed.includes(String(triggerCell.value))) {
            trigger.fail = true
            triggerNotes.push('not a member of its closed list')
        } else {
            keyed = transitionsOn(String(triggerCell.value))
            if (!keyed.length) triggerNotes.push('the game holds no transition keyed on it')
            if (!transitionsOn(SCORE_TRIGGER).length) triggerNotes.push('the game holds no score transition')
            if (!keyed.length || !transitionsOn(SCORE_TRIGGER).length) trigger.fail = true
            for (const transition of keyed) {
                const playState = probe.cell(lineOf(transition.classId, 'T6'))
                if (playState.state === 'OPEN') trigger.open = true
                else if (playState.state !== 'DERIVED') trigger.blocked = true
                else if (String(playState.value) !== 'CONTINUE') {
                    trigger.fail = true
                    triggerNotes.push(`${transition.classId} stops play: it is no event in play`)
                }
            }
        }

        // Target: the one primary objective its own team attacks, positioned.
        let targetSaid = 'no target'
        target.instances++
        const spec = ctx.index.targetOf
        if (!spec || teamState === 'BLOCKED') target.blocked = true
        else if (teamState === 'OPEN') target.open = true
        else if (!resolvedTeam) target.fail = true
        else {
            const objectives = classesOn(ctx, spec.objectivesRow)
            const unsettled = objectives.some(objective => [spec.roleRow, spec.teamRow].some(row => probe.peek(lineOf(objective.classId, row)).state !== 'DERIVED'))
            const attacking = objectives.filter(objective => {
                const role = probe.peek(lineOf(objective.classId, spec.roleRow))
                const by = probe.peek(lineOf(objective.classId, spec.teamRow))
                return role.state === 'DERIVED' && String(role.value) === spec.role && by.state === 'DERIVED' && designationKey(ctx.index, by.value) === resolvedTeam
            })
            if (attacking.length !== 1) {
                if (unsettled) target.blocked = true
                else target.fail = true
                targetSaid = `${attacking.length} primary objectives attacked by ${resolvedTeam}`
            } else {
                const reference = probe.cell(lineOf(attacking[0].classId, spec.referenceRow))
                const referent = reference.state === 'DERIVED' ? referentClass(ctx, reference.value) : null
                if (reference.state === 'OPEN') target.open = true
                else if (reference.state !== 'DERIVED') target.blocked = true
                else if (!referent || (referent.row !== 'S2' && referent.row !== 'O1')) target.fail = true
                else {
                    const position = probe.cell(lineOf(referent.classId, referent.row === 'S2' ? 'S5' : 'O4'))
                    if (position.state === 'OPEN') target.open = true
                    else if (position.state !== 'DERIVED') target.blocked = true
                    targetSaid = `the target of ${attacking[0].classId}, ${referent.classId}`
                }
            }
        }

        // Control: stated.
        const controlCell = probe.cell(lineOf(element.classId, 'V30'))
        control.instances++
        if (controlCell.state === 'OPEN') control.open = true
        else if (controlCell.state !== 'DERIVED') control.blocked = true
        else if (typeof controlCell.value !== 'string' || !controlCell.value.trim()) control.fail = true

        // Episode: the trigger begins an episode, and none an episode-scoped condition is authored for.
        episode.instances++
        if (triggerCell.state !== 'DERIVED') episode.blocked = true
        for (const transition of keyed) {
            const starts = probe.cell(lineOf(transition.classId, 'T7'))
            if (starts.state === 'OPEN') episode.open = true
            else if (starts.state !== 'DERIVED') episode.blocked = true
            else if (String(starts.value) !== 'true') {
                episode.fail = true
                triggerNotes.push(`${transition.classId} begins no episode`)
            }
        }
        for (const scope of episodeScopes) {
            const typed = typedFor(scope)
            if (!typed) {
                episode.blocked = true
                continue
            }
            const found = buildOutStarters(ctx, probe, typed)
            const begun = found.starters.filter(starter => keyed.some(transition => transition.classId === starter.classId))
            if (begun.length) {
                episode.fail = true
                triggerNotes.push(`${begun.map(starter => starter.classId).join(', ')} begins ${scope}, which a condition of the primary event is authored for`)
            }
        }

        // Credit bound: the element's team holds no role whose credit is confined to an episode its trigger does not begin.
        credit.instances++
        if (teamState === 'OPEN') credit.open = true
        else if (teamState !== 'ONE') credit.blocked = true
        else
            for (const bound of bounds) {
                if (bound.team === null) {
                    // A role's holder no block names: which team holds it is owed, as the team clause owes it.
                    credit.open = true
                    continue
                }
                if (bound.team !== resolvedTeam) continue
                if (bound.state === 'OPEN') credit.open = true
                else if (bound.state === 'BLOCKED') credit.blocked = true
                else {
                    const typed = typedFor(bound.scope)
                    if (!typed) {
                        credit.blocked = true
                        continue
                    }
                    const begins = new Set(buildOutStarters(ctx, probe, typed).starters.map(starter => starter.classId))
                    if (!keyed.length || keyed.some(transition => !begins.has(transition.classId))) {
                        credit.fail = true
                        triggerNotes.push(`${resolvedTeam} holds the role ${bound.role}, whose scoring credit is confined to ${bound.scope}, which its trigger does not begin`)
                    }
                }
            }
        said.push(
            `${element.classId} for ${teamCell.state === 'DERIVED' ? String(teamCell.value) : 'no established team'}` +
                (resolvedTeam ? ` (${resolvedTeam})` : '') +
                ` at ${triggerCell.state === 'DERIVED' ? String(triggerCell.value) : 'no established trigger'} (${keyed.map(t => t.classId).join(', ') || 'no transition'}` +
                (triggerNotes.length ? `; ${triggerNotes.join('; ')}` : '') +
                `), inside ${targetSaid}`,
        )
    }

    // One per team.
    one.instances = elements.length
    if (team.blocked) one.blocked = true
    else if (team.open) one.open = true
    const shared = [...teams.entries()].filter(([, ids]) => ids.length > 1)
    if (shared.length) one.fail = true

    // No whole-game condition beside it.
    whole.instances = conditions.length
    const wholeGame: string[] = []
    for (const condition of conditions) {
        const scope = scopeOf(condition)
        if (EPISODE_SCOPES.includes(scope)) continue
        if (scope === 'WHOLE_GAME' || scope === '') {
            whole.fail = true
            wholeGame.push(condition.classId)
        } else whole.blocked = true
    }
    if (shared.length) said.push(`more than one for ${shared.map(([teamKey, ids]) => `${teamKey} (${ids.join(', ')})`).join('; ')}`)
    if (wholeGame.length) said.push(`authored for every score beside it: ${wholeGame.join(', ')}`)

    return {
        clauses: [
            verdictOf(team, TEAM, 'the team each occurrence is for'),
            verdictOf(trigger, TRIGGER, 'the realized play state of each transition keyed on the trigger'),
            verdictOf(target, TARGET, 'the realized position of the target each occurrence lies inside'),
            verdictOf(control, CONTROL, 'the control each occurrence states'),
            verdictOf(one, ONE, 'the team each occurrence is for'),
            verdictOf(episode, EPISODE, 'the realized episode boundary of each transition keyed on the trigger'),
            verdictOf(whole, WHOLE, 'the scope of each condition of the primary event'),
            verdictOf(credit, CREDIT, 'the team holding each role whose scoring credit is bounded, and each bound'),
        ],
        why: `; ${elements.length} occurrence(s) also count as the primary event: ${said.join('; ')}`,
    }
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

    const objectives = classesOn(ctx, 'J1')
    probe.cell('game::S1') // the axis
    const length = probe.cell('game::E2')

    if (!objectives.length) {
        probe.missing.push('J1 (no individuated objective class)')
        return result('GA-DIRECTION', probe, [notEvaluable(ATTACKS), notEvaluable(OPPOSITE), noChangeClause, outside(PERCEIVED)], probe.blockedWhy)
    }

    // **SD-95, his ruling of 27 September.** The clause used to require every concrete team class to
    // carry a static designation in its selector, and to pair each with an objective. He ruled that
    // out: the register evaluates a designation "at the trigger or episode it is attached to"
    // (RC-22), so a team element does not hold one, and *"this ruling does not authorize pairing a
    // designation with a concrete team class where derivation has not established that identity."*
    //
    // So the clause asks what the objective structure itself establishes: does it provide an
    // opposing directional relationship? Either one objective both sides attack, or two objectives
    // attacked by designations the register holds as different entries (RC-22). Team classes are not
    // consulted at all, and nothing is paired.
    const attacked = new Map<string, string[]>()
    /**
     * **An objective whose team realization has yet to choose is not an objective with no team.**
     * `probe.cell` already records an open line on `pendingOn`, but reporting the same line as
     * `missing` below would make the check `blocked`, and a blocked check is unevaluable rather than
     * deferred — so the two are kept apart here, or the deferral below can never be reached.
     */
    const pendingTeams: string[] = []
    for (const objective of objectives) {
        const team = probe.cell(lineOf(objective.classId, 'J3'))
        if (team.state === 'OPEN') {
            pendingTeams.push(objective.classId)
            continue
        }
        if (team.state !== 'DERIVED') continue
        // RC-22, "Two designations are equal only if they map to one entry" — asked of the one resolver since 15 October
        // 2026 (stage K2, his M2), so a glossed spelling or a value written "(= ENTRY)" groups with its entry and two named
        // teams stay apart. A value that is no registered designation keys as itself, exactly as the text did.
        const key = designationKey(ctx.index, team.value)
        attacked.set(key, [...(attacked.get(key) || []), objective.classId])
    }

    // A shared target is one every team attacks: the resolution kind ALL, read from the register, not a name written here.
    const shared = [...attacked.keys()].some(d => isAllTeams(ctx.index, d))
    const opposed = [...attacked.keys()].filter(d => !isAllTeams(ctx.index, d))
    const established = shared || opposed.length >= 2
    if (!attacked.size && !pendingTeams.length) probe.missing.push('J3 (no objective names the team that attacks it)')

    const attacksClause = established
        ? pass(ATTACKS, attacked.size)
        : // An objective whose team is an authorized freedom may still name the other side once the
          // choice is made, so the clause is pending on it rather than violated by it (SD-39). Only
          // where every objective's team is settled and they all name one side is this a failure.
          // **A pending freedom is a DEFERRAL, not an unevaluable clause.** Reporting it unevaluable
          // makes Gate A withhold the authorization realization needs in order to make the very
          // choice the clause is waiting for. The distinction is the one the probe already draws:
          // `pendingOn` is an authorized freedom realization will close, `blocked` is a gap nothing
          // has established, and only the second is unevaluable.
          probe.pendingOn.length && !probe.blocked
          ? deferred(ATTACKS, 'the chosen team for every objective, which fixes which end each side attacks')
          : probe.blocked || !attacked.size
            ? notEvaluable(ATTACKS)
            : fail(ATTACKS, attacked.size)

    // Opposite ends: an objective's end is the end of the axis its referent sits in. `lo + hi` against
    // the area length compares the referent's midpoint with the centre without dividing.
    // Each objective's target is read ONCE (stage K6, 15 October 2026): the separation clause below reads the same intervals, and
    // a second read would record a second refusal for one unplaced target, which no game's report should gain.
    const targetIntervals = new Map<string, Interval | null>()
    const targetIntervalOf = (objectiveClassId: string): Interval | null => {
        if (targetIntervals.has(objectiveClassId)) return targetIntervals.get(objectiveClassId)!
        const read = (): Interval | null => {
            const reference = probe.cell(lineOf(objectiveClassId, 'J2'))
            if (reference.state !== 'DERIVED' || length.state !== 'DERIVED') return null
            // SD-63 — an objective reference that is open text establishes no identity, so no end is read.
            if (identityOf(ctx, reference.value) === 'OPEN_TEXT') {
                probe.unestablished(lineOf(objectiveClassId, 'J2'))
                return null
            }
            const referent = referentClass(ctx, reference.value)
            if (!referent) return null
            const alongRow = referent.row === 'S2' ? 'S5' : referent.row === 'O1' ? 'O4' : null
            if (!alongRow) return null
            return intervalOf(probe, lineOf(referent.classId, alongRow)).interval
        }
        const interval = read()
        targetIntervals.set(objectiveClassId, interval)
        return interval
    }
    const endOf = (objectiveClassId: string): 'LOW' | 'HIGH' | 'CENTRE' | null => {
        const interval = targetIntervalOf(objectiveClassId)
        if (!interval || length.state !== 'DERIVED') return null
        const area = toRational(length.value)
        if (!area) return null
        const span = add(interval.lo, interval.hi)
        const side = compare(span, area)
        return side < 0 ? 'LOW' : side > 0 ? 'HIGH' : 'CENTRE'
    }

    // Opposite ends applies only where two sides attack different objectives. A single shared target
    // is a legitimate structure with no two ends to compare, so the clause has no applicable
    // instance and says so rather than passing as though it had checked something (SD-54).
    let oppositeClause: ClauseResult
    if (opposed.length < 2) {
        oppositeClause = pass(OPPOSITE, 0)
    } else {
        const ends = opposed.map(d => endOf(attacked.get(d)![0]))
        /**
         * **An end that only realized geometry can fix is a DEFERRAL.** A target's position is an
         * authored relative term — "the attacking end of the team J3 names" — and a term becomes an
         * interval when realization composes it against the envelope, not before. So with two opposed
         * targets this clause has nothing numeric to compare until realization has run, which is the
         * same reason GA-ENVELOPE-FIT and GA-LAYOUT-FEASIBLE defer rather than report unevaluable.
         *
         * It defers only where a position IS authored and merely unresolved. An objective whose
         * referent carries no position at all is still unevaluable, and two targets that land on the
         * same end, or in the centre, still FAIL — the deferral moves the check to where the numbers
         * exist, it does not excuse the arrangement from it.
         */
        const positionsAuthored = opposed.every(d => {
            const reference = probe.cell(lineOf(attacked.get(d)![0], 'J2'))
            if (reference.state !== 'DERIVED') return false
            const referent = referentClass(ctx, reference.value)
            if (!referent) return false
            return probe.cell(lineOf(referent.classId, referent.row === 'S2' ? 'S5' : 'O4')).state === 'DERIVED'
        })
        if (ends.some(e => e === null)) {
            oppositeClause = positionsAuthored
                ? deferred(OPPOSITE, 'the realized position of each objective target, which fixes which end of the axis each one sits at')
                : notEvaluable(OPPOSITE)
        } else if (ends.some(e => e === 'CENTRE') || new Set(ends).size < ends.length) oppositeClause = fail(OPPOSITE, ends.length)
        else oppositeClause = pass(OPPOSITE, ends.length)
    }

    /**
     * **The opposed targets do not overlap** — added 15 October 2026 (stage K6). Christian, reply filed 17 October 2026, D3:
     * *"Please verify that the two targets can coexist without overlapping or contradictory scoring conditions."* Measured before
     * this clause (design verification of 17 October): overlapping target zones [0,24] and [16,40] passed every gate, because the
     * opposite-ends clause compares only each target's midpoint with the centre. And the register's "does not contain the
     * midpoint" wording, the only written statement that kept targets apart, was enforced by no code and is narrowed in the same
     * change (his M7: *"Do not introduce a universal halfway restriction."*). So: the along intervals of two opposed objectives'
     * targets are strictly apart — a shared boundary is an overlap, a ball on it would be in both. Deferred exactly where the
     * opposite-ends clause is, read from the same intervals (no second refusal), and generic: it names no target and no sport.
     */
    const SEPARATED = "the opposed objectives' targets do not overlap along the axis"
    let separatedClause: ClauseResult
    if (opposed.length < 2) separatedClause = pass(SEPARATED, 0)
    else if (oppositeClause.verdict === 'DEFERRED_TO_REALIZATION' || oppositeClause.verdict === 'NOT_EVALUABLE') {
        separatedClause = oppositeClause.verdict === 'DEFERRED_TO_REALIZATION' ? deferred(SEPARATED, 'the realized extent of each objective target, which fixes whether two of them overlap') : notEvaluable(SEPARATED)
    } else {
        const intervals = opposed.map(d => targetIntervalOf(attacked.get(d)![0]))
        if (intervals.some(i => !i)) separatedClause = notEvaluable(SEPARATED)
        else {
            let overlapping = 0
            for (let i = 0; i < intervals.length; i++)
                for (let j = i + 1; j < intervals.length; j++) {
                    const [a, b] = [intervals[i]!, intervals[j]!]
                    if (!(lt(a.hi, b.lo) || lt(b.hi, a.lo))) overlapping++
                }
            separatedClause = overlapping ? fail(SEPARATED, intervals.length) : pass(SEPARATED, intervals.length)
        }
    }

    return result(
        'GA-DIRECTION',
        probe,
        [attacksClause, oppositeClause, separatedClause, noChangeClause, outside(PERCEIVED)],
        `${objectives.length} individuated objective(s); ${attacked.size} designation(s) attack one` +
            `${shared ? ', including a shared target' : ''}; ${directional.length} direction-changing effect(s) in the register`,
    )
}

/**
 * **Which way a team attacks along the axis, read from the realized position of its target** — stage K6, 15 October 2026. +1
 * toward the far end line, -1 toward the 0 end line, null where it is not established (before realization, or for a designation
 * that stands for no setup assignment in this game). A role holder answers through the role block (his M1); the team's primary
 * objective (the register's `targetOf` rows) references the target, and the target's realized interval says which end it is at
 * — the same reading GA-DIRECTION's opposite-ends clause makes. Read quietly: an unplaced target is a deferral here, not a refusal.
 */
function attackDirection(ctx: GateContext, probe: Probe, designation: string): 1 | -1 | null {
    const length = toRational(resolvedValue(ctx.derived.get('game::E2'))?.value)
    const interval = ownTargetInterval(ctx, probe, designation)
    if (!length || !interval) return null
    const side = compare(add(interval.lo, interval.hi), length)
    return side > 0 ? 1 : side < 0 ? -1 : null
}

/** The team a designation stands for in this game (a role holder through the role block, or a setup assignment), or null. */
function teamOf(ctx: GateContext, designation: string): string | null {
    return holderInBlock(ctx.index, designation, ctx.roleBlock) ?? (resolutionOf(ctx.index, designation)?.kind === 'SETUP_ASSIGNMENT' ? designationKey(ctx.index, designation) : null)
}

/**
 * The realized along interval of the target a designation's team attacks — its one primary objective's reference (the register's
 * `targetOf` rows) — or null where there is no team, not exactly one such objective, or no realized interval yet. Read quietly.
 * (Split out of `attackDirection` in the K6 review, 16 October 2026, so the start-placement clause reads the same target.)
 */
function ownTargetInterval(ctx: GateContext, probe: Probe, designation: string): Interval | null {
    const spec = ctx.index.targetOf
    if (!spec) return null
    const team = teamOf(ctx, designation)
    if (!team) return null
    const attacking = classesOn(ctx, spec.objectivesRow).filter(objective => {
        const role = probe.peek(lineOf(objective.classId, spec.roleRow))
        const by = probe.peek(lineOf(objective.classId, spec.teamRow))
        return role.state === 'DERIVED' && String(role.value) === spec.role && by.state === 'DERIVED' && designationKey(ctx.index, by.value) === team
    })
    if (attacking.length !== 1) return null
    const reference = probe.peek(lineOf(attacking[0].classId, spec.referenceRow))
    if (reference.state !== 'DERIVED') return null
    const referent = referentClass(ctx, reference.value)
    return referent ? quietInterval(probe, lineOf(referent.classId, referent.row === 'S2' ? 'S5' : 'O4')) : null
}

/**
 * The along interval a start placement's region (P10) covers on the realized geometry, or null while it has none: a region
 * reference reads the region's own interval; RC-21's "beyond X (for team T)" (P10 version 2) is the part of the area from X's far
 * edge, in T's attacking direction, to the end line T attacks — the same reading `realizeTypedPosition` composes. (K6 review.)
 */
function startRegionInterval(ctx: GateContext, probe: Probe, placementClassId: string): Interval | null {
    const cell = probe.peek(lineOf(placementClassId, 'P10'))
    if (cell.state !== 'DERIVED') return null
    const relative = relativePositionOf(cell.value)
    const referent = referentClass(ctx, relative ? { structuralRef: relative.of.structuralRef } : cell.value)
    const x = referent ? quietInterval(probe, lineOf(referent.classId, referent.row === 'S2' ? 'S5' : 'O4')) : null
    if (!x) return null
    if (!relative) return x
    const direction = attackDirection(ctx, probe, relative.forTeam)
    const length = toRational(resolvedValue(ctx.derived.get('game::E2'))?.value)
    if (direction === null || !length) return null
    return direction > 0 ? { axis: 'along', lo: x.hi, hi: length } : { axis: 'along', lo: ZERO, hi: x.lo }
}

/**
 * **Can a designation hold an end of the axis?** (stage K6, 15 October 2026.) A position stated "for team T" reads T's direction of
 * attack, so T must be a team whose end is fixed for the game or the block: a setup assignment by its own spelling (TEAM_AT_AXIS_*),
 * or a role holder (ROLE_HOLDER_<role>, a role of the register's role vocabulary), which answers through the role block. A
 * possession-relative, episode or trigger designation holds no end, and a named team or a glossed spelling is not taken for its
 * entry (the K2 review's rule: registration by the list's own spelling, never by mapping).
 */
function holdsAnEnd(index: RegisterIndex, value: string): boolean {
    const resolved = resolutionOf(index, value)
    if (!resolved) return false
    return resolved.kind === 'BLOCK_ROLE' || (resolved.kind === 'SETUP_ASSIGNMENT' && resolved.entry === value)
}

/** A geometric line's interval where it holds one, read without refusing: anything else is simply not placed yet. */
function quietInterval(probe: Probe, lineId: string): Interval | null {
    const cell = probe.peek(lineId)
    return cell.state === 'DERIVED' ? toInterval(cell.value) : null
}

/**
 * `GA-RELATIVE-PLACEMENT` — every position stated relative to another element, or measured from a team's end line, names what it
 * is relative to and holds of the realized geometry. Added 15 October 2026 (stage K6, register version 13), the nineteenth check.
 *
 * Christian, reply filed 17 October 2026, M7: *"M7 — Target relative to pressure reference: Approved if required."* D3: *"I agree
 * with your recommendation to position the building team's progression target relative to the defensive pressure reference, with
 * the coach able to adjust its precise location."* Reply filed 18 October 2026, item 3: *"Please retain the separation between the
 * pressure reference and the progression target in the knowledge representation, even when they occupy the same location in this
 * realization."* So the target and the reference stay two elements, and the relation between them is checked, not assumed:
 *
 *   - **names** — every RC-21 "beyond X (for team T)" (a RELATIVE bound on a line, or a relative position as a line's value) names
 *     an element X the game holds and a team designation the register lists; every position measured from a team's end line names
 *     a listed designation. A name that resolves to nothing FAILS; open text withholds (SD-63).
 *   - **holds** — on realized geometry, RC-21's own test: the element's near edge is at or past X's far edge, in T's attacking
 *     direction; and a position measured from a team's end line is placed from an end the game establishes T attacks. Before
 *     realization the positions are not intervals yet, so the clause is DEFERRED and owed (never passed unexamined). Where a
 *     metric extent is required beside the relation, realization composes the metric one and this clause is what catches a
 *     relation it breaks — measured on a TEST-ONLY copy, a post-regain area deepened past the pressure reference.
 *   - **own target** (K6 review, 16 October 2026) — no start placement lies inside the target its own group attacks (below).
 *
 * Generic: it names no element, no team and no sport; the relation and its test are the register's.
 */
function gaRelativePlacement(ctx: GateContext): CheckOutcome {
    const NAMES = 'every relative position names a held element and a registered team designation'
    const HOLDS = 'every relative position holds of the realized geometry'
    const probe = new Probe(ctx, 'GA-RELATIVE-PLACEMENT')
    const relations: { lineId: string; of: { contractId: string; itemId: string }; forTeam: string; region: boolean }[] = []
    const fromEnds: { lineId: string; forTeam: string }[] = []
    for (const line of ctx.lines) {
        const record = ctx.derived.get(line.lineId)
        for (const bounding of record?.bounding ?? []) {
            const bound = bounding.bound
            if (bound?.kind === 'RELATIVE' && bound.of && bound.forTeam && !bound.forbidden) relations.push({ lineId: line.lineId, of: bound.of, forTeam: bound.forTeam, region: false })
        }
        const value = resolvedValue(record)?.value
        const relative = relativePositionOf(value)
        if (relative) relations.push({ lineId: line.lineId, of: relative.of.structuralRef, forTeam: relative.forTeam, region: true })
        const fromEnd = teamEndPositionOf(value)
        if (fromEnd) fromEnds.push({ lineId: line.lineId, forTeam: fromEnd.forTeam })
    }
    const total = relations.length + fromEnds.length

    /**
     * **No group begins inside the target it attacks** — added in the K6 review, 16 October 2026. The design this stage built
     * asked for it in so many words ("a pressing start overlapping its own target fails GA-RELATIVE-PLACEMENT"), and the stage did
     * not build it: measured on TEST-ONLY copies of A01, the pressing team's start moved to the building team's side of the
     * pressure reference (so it contained the post-regain area it attacks), or the building team's start moved onto its own
     * target, passed every gate in both blocks. His words it protects, reply filed 17 October 2026, D3: *"The target should be
     * positioned so that regaining possession does not automatically constitute successful progression."*; reply filed 18
     * October 2026, item 3: *"Starting placement: building-team outfield players begin short of the pressure/progression line."*
     *
     * A start placement's region (P10, read on the realized geometry) may not share a stretch of the axis with the target its own
     * group's team attacks (its primary objective's reference, the register's `targetOf` rows). Touching at one boundary is not
     * sharing a stretch: RC-21's "beyond" is "at or past", so a region beyond a reference and a target beginning at it meet on
     * the reference line by definition, and a start placement says where a group BEGINS, never where it may go. A group that
     * stands for no team holding an end attacks no target of its own: no applicable instance. Deferred, never passed, while
     * either interval is not yet realized. Generic: rows and the role are the register's; no element, team or sport is named.
     */
    const OWN_TARGET = 'no start placement lies inside the target its own group attacks'
    const inside: string[] = []
    let applicable = 0
    let notYet = 0
    for (const placement of classesOn(ctx, 'P8')) {
        const group = probe.peek(lineOf(placement.classId, 'P9'))
        // A group that is not established is GA-NO-FAILED-LINE's to report; one that is no team holding an end has no own target.
        if (group.state !== 'DERIVED' || typeof group.value !== 'string' || !teamOf(ctx, group.value)) continue
        applicable++
        const target = ownTargetInterval(ctx, probe, group.value)
        const region = startRegionInterval(ctx, probe, placement.classId)
        if (!target || !region) {
            notYet++
            continue
        }
        const lo = compare(target.lo, region.lo) > 0 ? target.lo : region.lo
        const hi = compare(target.hi, region.hi) < 0 ? target.hi : region.hi
        if (lt(lo, hi)) inside.push(`${placement.classId} (${group.value}) begins inside the target its team attacks`)
    }
    const own = inside.length ? fail(OWN_TARGET, applicable) : notYet ? deferred(OWN_TARGET, 'the realized start region of each placement and the target its group attacks') : pass(OWN_TARGET, applicable)
    const ownWhy = applicable ? `; ${applicable} start placement(s) for a team that attacks a target` + (inside.length ? `: ${inside.join('; ')}` : '') + (notYet ? `; ${notYet} not yet placed` : '') : ''

    if (!total) return result('GA-RELATIVE-PLACEMENT', probe, [pass(NAMES, 0), pass(HOLDS, 0), own], 'no position in this game is stated relative to another element or to a team' + ownWhy)

    const dangling: string[] = []
    let openText = false
    for (const relation of relations) {
        probe.peek(relation.lineId)
        const identity = identityOf(ctx, { structuralRef: relation.of })
        if (identity === 'DANGLING') dangling.push(`${relation.lineId} → ${relation.of.contractId}::${relation.of.itemId}`)
        else if (identity === 'OPEN_TEXT') openText = true
        if (!holdsAnEnd(ctx.index, relation.forTeam)) dangling.push(`${relation.lineId}: ${relation.forTeam} is not a team designation that holds an end (a setup assignment, or a role holder answering through the role block)`)
    }
    for (const position of fromEnds) {
        probe.peek(position.lineId)
        if (!holdsAnEnd(ctx.index, position.forTeam)) dangling.push(`${position.lineId}: ${position.forTeam} is not a team designation that holds an end (a setup assignment, or a role holder answering through the role block)`)
    }
    const names = dangling.length ? fail(NAMES, total) : openText ? notEvaluable(NAMES) : pass(NAMES, total)

    const broken: string[] = []
    let unplaced = 0
    for (const relation of relations) {
        const direction = attackDirection(ctx, probe, relation.forTeam)
        const referent = referentClass(ctx, { structuralRef: relation.of })
        const x = referent ? quietInterval(probe, lineOf(referent.classId, referent.row === 'S2' ? 'S5' : 'O4')) : null
        if (direction === null || !x) {
            unplaced++
            continue
        }
        const far = direction > 0 ? x.hi : x.lo
        if (relation.region) {
            // A region stated as the part of the area beyond X: it holds by its own definition, so what is checked is that it is
            // a part of the area at all — X's far edge strictly inside the axis, so the region beyond it is not empty.
            const length = toRational(resolvedValue(ctx.derived.get('game::E2'))?.value)
            if (!length || !(lt(ZERO, far) && lt(far, length))) broken.push(`${relation.lineId}: nothing of the area lies beyond ${relation.of.itemId} for ${relation.forTeam}`)
            continue
        }
        const e = quietInterval(probe, relation.lineId)
        if (!e) {
            unplaced++
            continue
        }
        const near = direction > 0 ? e.lo : e.hi
        const holds = direction > 0 ? compare(near, far) >= 0 : compare(near, far) <= 0
        if (!holds) broken.push(`${relation.lineId}: its near edge is not at or past the far edge of ${relation.of.itemId} in the attacking direction of ${relation.forTeam}`)
    }
    for (const position of fromEnds) {
        if (attackDirection(ctx, probe, position.forTeam) === null || !quietInterval(probe, position.lineId)) unplaced++
    }
    const holds = broken.length
        ? fail(HOLDS, total)
        : unplaced
          ? deferred(HOLDS, 'the realized position of each element stated relative to another, of what it is relative to, and the end each team attacks')
          : pass(HOLDS, total)
    return result(
        'GA-RELATIVE-PLACEMENT',
        probe,
        [names, holds, own],
        `${relations.length} relative position(s), ${fromEnds.length} measured from a team's end line; ${dangling.length} name nothing held or registered; ${broken.length} broken on the realized geometry` +
            (broken.length ? `: ${broken.join('; ')}` : '') +
            (unplaced ? `; ${unplaced} not yet placed` : '') +
            ownWhy,
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
        // SD-97 — an existentially asserted set is not an individuated one. The clauses have no
        // applicable instance either way, and the reason is worth stating correctly.
        const asserted = allClassesOn(ctx, 'J5').length
        return result(
            'GA-OBJECTIVE-SETS',
            probe,
            [pass(MEMBERS, 0), pass(MINIMUM, 0), pass(NAMED, 0), pass(ASSIGNMENT, 0), outside(SCOPE)],
            asserted ? `${asserted} objective set(s) asserted to exist; none is individuated, so no member, cardinality or assignment is examinable` : 'no objective set is instantiated',
        )
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
                if (identity === 'DANGLING') memberProblems.push(`${set.classId}: member ${describeReferent(member)} resolves to no held element`)
            }
            if (minimum.state === 'DERIVED') {
                minimumSeen++
                const min = toRational(minimum.value)
                if (min && compare(min, { n: BigInt(list.length), d: 1n }) > 0) minimumProblems.push(`${set.classId}: live cardinality exceeds the member count`)
            }
            if (initial.state === 'DERIVED' && initial.value !== null) {
                namedSeen++
                // By referent identity (14 October 2026, component 1). `list.map(String)` made any two typed
                // references equal — "[object Object]" both — and a typed member never equal to its class id.
                if (!list.some(member => sameReferent(ctx, member, initial.value))) namedProblems.push(`${set.classId}: the named initial member is not one of the members`)
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
    /**
     * **Two corrections, both general, both found the first time typed referents reached this check.**
     *
     *   - **The key was `String(referent)`**, which is `"[object Object]"` for every typed structural
     *     reference — so ALL typed referents collapsed into one key and any two of them read as the same
     *     region. The referent's resolved class is its identity, and `referentClass` already computes it;
     *     SD-57 asks for structural identity and this is what that means.
     *   - **A modifier cannot overlap itself.** The claimants were collected as a list, so one modifier
     *     naming two referents appeared twice under the collapsed key and was reported as an overlap with
     *     itself. The question is whether TWO modifiers claim one region, so the claimants are a set.
     *
     * Together these made a single modifier with two authored referents fail a check about pairs of
     * modifiers — which is exactly what his "each channel is independently a qualifying referent" requires
     * not to happen.
     */
    const claimed = new Map<string, Set<string>>()
    let comparable = 0
    for (const modifier of regions) {
        const cell = probe.cell(lineOf(modifier.classId, 'V8b'))
        for (const referent of referentsOf(cell)) {
            if (identityOf(ctx, referent) !== 'HELD') {
                probe.unestablished(lineOf(modifier.classId, 'V8b'))
                continue
            }
            comparable++
            const key = referentClass(ctx, referent)?.classId ?? String(referent)
            if (!claimed.has(key)) claimed.set(key, new Set())
            claimed.get(key)!.add(modifier.classId)
        }
    }
    const overlapping = [...claimed.entries()].filter(([, ids]) => ids.size > 1)
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

    /**
     * **A modification that persists must be able to END.** Added 7 October with `V8d`, and it is what makes
     * the persistence half of his ruling executable rather than a sentence:
     *
     *   > *A qualifying controlled attacking-team touch in either established wide channel activates the value
     *   > modification while that team retains possession. A possession change ends that modification.*
     *
     * A modifier that names a terminating trigger the game cannot construct never ends, which is precisely the
     * indefinite stored entitlement his **Coupled** criterion exists to forbid — and it would be invisible,
     * because every other check would pass. So the clause is the same shape as `GA-EFFECT-TYPED`'s
     * `every consequence trigger is structurally reachable`, on the same authority (SD-44), reading `V8d`
     * where that one reads `V12`.
     *
     * **An absent `V8d` is not a failure.** The row's own text says so: an absent value means the modification
     * does not persist beyond the event it is evaluated at. Only a stated termination is checked, so every
     * modifier authored before today is unaffected.
     */
    const ENDS = 'every value modifier that states a termination names a structurally reachable trigger'
    const unreachable: string[] = []
    let endsSeen = 0
    for (const modifier of modifiers) {
        const lineId = lineOf(modifier.classId, 'V8d')
        /**
         * **Membership first, then the probe — and the order matters.**
         *
         * The clause's subject is modifiers that STATE a termination. Whether one does is read from whether any
         * item addressed the row at all, not from the line's value: a modifier that states none has an
         * unaddressed line, which is the row's documented reading and not a defect.
         *
         * Probing first was wrong and a test caught it. `probe.cell` records a `NOT_AUTHORED` line as a BLOCKER,
         * so consulting V8d on every modifier reported an absent termination as an unresolved dependency of this
         * check — and `SD-62`'s block record then named a line nobody had claimed. Reading membership from
         * `ctx.derived` keeps the Probe contract intact in the direction that matters: every line the clause
         * actually consults is still recorded as a subject, and the ones it declines to consult are not
         * invented into dependencies.
         */
        const record = ctx.derived.get(lineId)
        const addressed = !!record && (record.entailing.length > 0 || record.bounding.length > 0 || record.undetermined.length > 0)
        if (!addressed) continue
        const cell = probe.cell(lineId)
        if (cell.state !== 'DERIVED') continue
        endsSeen++
        const name = String(cell.value)
        // The parameterised form is `NAME{argument}`, as in `constructTriggers`.
        if (!ctx.triggers.some(t => t === name || t.startsWith(`${name}{`))) unreachable.push(`${modifier.classId}: ${name}`)
    }
    clauses.push(unreachable.length ? fail(ENDS, endsSeen) : pass(ENDS, endsSeen))
    if (endsSeen) {
        notes.push(
            unreachable.length
                ? `${unreachable.length} modifier termination(s) name an unreachable trigger: ${unreachable.join('; ')}`
                : `${endsSeen} modifier termination(s) name a reachable trigger`,
        )
    }

    if (!modifiers.length) return result('GA-MODIFIER-OVERLAP', probe, clauses, 'no value modifier is instantiated')
    return result(
        'GA-MODIFIER-OVERLAP',
        probe,
        clauses,
        notes.concat(overlapping.length ? [`${overlapping.length} region referent(s) claimed by more than one modifier`] : [`${comparable} region referent(s) compared by structural identity`]).join('; '),
    )
}

/**
 * `GA-AFFILIATION` — when a neutral performer's change of side takes effect (`P6c`), held to what makes it
 * true. Added 14 October 2026 with the row, on his ruling that day: *"Please add the explicit property
 * governing when a neutral player changes allegiance, using immediate switching upon possession change as
 * the approved behavior for the current mechanism."*
 *
 * **Why a check of its own.** A derived FIELD value is never held to its `<row>.<leaf>` vocabulary — realization
 * checks vocabulary only for open choices — so, measured before this, an unregistered timing (`SOMETIME`) passed
 * every gate and reached fidelity. And the value IMMEDIATE is a claim about something else: an immediate change of
 * side presupposes a side that follows possession and a change of possession that can happen. A failure names its
 * subject (SD-53), so the three questions are three clauses here rather than a clause bolted onto a check about
 * something else.
 *
 *   1. *every neutral affiliation timing is a registered member* — the value against its vocabulary;
 *   2. *an immediate change of side follows a reachable change of possession* — the decision is standing (or keyed
 *      on the change itself), the side joined is one the register defines BY the possession relation, the
 *      relation is established or open (the RELATION_CLAUSE reading of `GA-TRIGGER-REACHABLE`), and the change
 *      of possession is a structurally reachable trigger;
 *   3. *a change of side held until the next restart names a registered restart* — the register holds no
 *      machine-readable class of restarts, so any timing other than an immediate one is NOT_EVALUABLE with a
 *      refusal record: gap before collision (SD-28). Such a value cannot authorize until the class exists.
 *
 * **Membership before the probe**, exactly as the V8d clause of `GA-MODIFIER-OVERLAP`: a game with no neutral
 * timing has an unaddressed line, which is the row's documented reading (ABSENT is "not established", never
 * "immediate") and no blocker. All three clauses are emitted on every path (SD-53), vacuous ones as `pass(_, 0)`.
 *
 * Sport-neutral: it reads row ids, the register's vocabulary and its designation glosses — never a value written
 * here. Which designations follow the possession relation is read from the register's own gloss (`(the team the
 * possession relation PS1 currently holds)`), so a designation the register does not define by the relation is
 * not decided here (NOT_EVALUABLE), and one it does not list at all fails.
 */
function gaAffiliation(ctx: GateContext): CheckOutcome {
    const MEMBER = 'every neutral affiliation timing is a registered member'
    const IMMEDIATE = 'an immediate change of side follows a reachable change of possession'
    const RESTART = 'a change of side held until the next restart names a registered restart'
    const probe = new Probe(ctx, 'GA-AFFILIATION')
    const lineId = 'game::P6c'
    const record = ctx.derived.get(lineId)
    const addressed = !!record && (record.entailing.length > 0 || record.bounding.length > 0 || record.undetermined.length > 0)
    if (!addressed) return result('GA-AFFILIATION', probe, [pass(MEMBER, 0), pass(IMMEDIATE, 0), pass(RESTART, 0)], 'no neutral affiliation timing is stated')

    const vocabularyName = [...ctx.index.vocabularies.keys()].find(name => name.startsWith('P6c.'))
    const members = vocabularyName ? ctx.index.vocabularies.get(vocabularyName) ?? [] : []
    const cell = probe.cell(lineId)
    const notes: string[] = []

    // Clause 1 — the value, or every value an open line could still take, is registered.
    let memberClause: ClauseResult
    let value: string | null = null
    if (cell.state === 'DERIVED') {
        value = String(cell.value)
        memberClause = members.includes(value) ? pass(MEMBER, 1) : fail(MEMBER, 1)
        notes.push(`takes effect ${JSON.stringify(cell.value)}${members.includes(value) ? '' : ` — not a member of ${vocabularyName ?? 'any registered vocabulary'} [${members.join(', ')}]`}`)
    } else if (cell.state === 'OPEN') {
        const permitted = cell.bounds.flatMap(b => (b.bound?.kind === 'SET' && Array.isArray(b.bound.members) ? b.bound.members : []))
        memberClause = !permitted.length ? notEvaluable(MEMBER) : permitted.every(m => members.includes(String(m))) ? pass(MEMBER, permitted.length) : fail(MEMBER, permitted.length)
        notes.push(`takes effect is open over [${permitted.join(', ')}]`)
    } else {
        memberClause = notEvaluable(MEMBER)
        notes.push(`takes effect is ${cell.state}`)
    }

    // Clause 2 — an immediate change of side has a side that follows possession and a change that can happen.
    let immediateClause = pass(IMMEDIATE, 0)
    if (value === 'IMMEDIATE') {
        const on = probe.cell('game::P6a')
        const joins = probe.cell('game::P6b')
        const relation = probe.cell('game::PS1')
        const designations = ctx.index.teamDesignations ?? []
        // A line still waiting on knowledge blocks the clause; only an established answer can fail it (SD-28).
        const pending = [on, joins].some(c => c.state !== 'DERIVED') || relation.state === 'FAILED' || relation.state === 'CONDITIONAL' || (relation.state === 'ABSENT' && !relation.established)
        if (pending || on.state !== 'DERIVED' || joins.state !== 'DERIVED') {
            immediateClause = notEvaluable(IMMEDIATE)
            notes.push('the side neutrals take, when it is decided, or the possession relation it follows is not yet established')
        } else {
            const side = String(joins.value)
            // Asked of the one resolver since 15 October 2026 (stage K2, his M2): registered, and defined by the possession
            // relation on the register's own gloss (a POSSESSION_RELATION resolution whose basis is GLOSS). The answers are
            // the ones the gloss substring gave: our reading of an entry with no gloss decides nothing here. Registered means a
            // list entry by its name or whole text (K2 review): a value that only MAPS to one (a named team, another gloss,
            // "(= ENTRY)" prose) is unlisted and FAILS, as it did before the resolver, never undecided.
            const entry = isListedDesignation(ctx.index, side)
            const followsRelation = followsPossessionRelation(ctx.index, side)
            const standing = String(on.value) === 'STANDING' || String(on.value) === 'POSSESSION_CHANGE'
            const relationHeld = relation.state === 'DERIVED' || relation.state === 'OPEN'
            const reachable = ctx.triggers.some(t => t === 'POSSESSION_CHANGE' || t.startsWith('POSSESSION_CHANGE{'))
            if (designations.length && entry && !followsRelation && standing && relationHeld && reachable) {
                immediateClause = notEvaluable(IMMEDIATE)
                notes.push(`the register does not define ${side} by the possession relation, so whether it changes when possession changes is not decided here`)
            } else {
                const held = standing && followsRelation && relationHeld && reachable
                immediateClause = held ? pass(IMMEDIATE, 1) : fail(IMMEDIATE, 1)
                if (!held) {
                    notes.push(
                        [
                            standing ? null : `the side is decided on ${JSON.stringify(on.value)}, not standing`,
                            entry ? (followsRelation ? null : `${side} is not defined by the possession relation`) : `${side} is not a registered team designation`,
                            relationHeld ? null : 'the possession relation is not established or open',
                            reachable ? null : 'a change of possession is not structurally reachable',
                        ]
                            .filter(Boolean)
                            .join('; '),
                    )
                }
            }
        }
    }

    // Clause 3 — any other timing waits for a registered class of restarts.
    let restartClause = pass(RESTART, 0)
    if (value !== null && value !== 'IMMEDIATE' && members.includes(value)) {
        probe.refuse(
            'CHECK_NOT_EXECUTABLE',
            `${lineId} holds ${JSON.stringify(value)}, and the register holds no machine-readable class of restarts for a held change of side to name, so it cannot be checked.`,
            [lineId],
            { clause: CLAUSE('§7.2'), quote: 'add no execution semantics from invented examples' },
        )
        restartClause = notEvaluable(RESTART, probe.refusals[probe.refusals.length - 1].refusalId)
    }

    return result('GA-AFFILIATION', probe, [memberClause, immediateClause, restartClause], notes.join('; '))
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
    gaTriggerReachable,
    gaTransitionCoherence,
    gaInformation,
    gaTimeWindows,
    gaNoFailedLine,
    gaEffectTyped,
    gaOnePrimaryEvent,
    gaDirection,
    gaObjectiveSets,
    gaModifierOverlap,
    // Seventeenth, added 14 October 2026 with register row P6c, on his ruling of that day.
    gaAffiliation,
    // Eighteenth, added 15 October 2026 when conditions began carrying their authored scope (SD-36; his 16 October 9.3).
    gaEpisodeReachable,
    // Nineteenth, added 15 October 2026 (stage K6, register version 13) for his M7 and his 18 October item 3.
    gaRelativePlacement,
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
    const allClauses = checks.flatMap(c => c.clauses.map(l => ({ ...l, checkId: c.checkId })))

    /**
     * **The split, adopted 30 September.** Gate A now reports two verdicts over the same checks.
     *
     * `knowledgeVerdict` ranges over every clause that can be answered from knowledge alone, and it is
     * the one that gates realization: a resolved game may be realized when nothing knowledge could
     * settle is left unsettled. `verdict` ranges over all of them and is therefore never PASS while
     * anything is still owed, so the deferred clauses cannot be lost by the split.
     *
     * Nothing is relaxed. The same clauses must still pass; they are asked at the point where they
     * have something to read.
     */
    const knowledgeClauses = allClauses.filter(l => l.verdict !== 'DEFERRED_TO_REALIZATION')
    const deferredClauses = allClauses
        .filter(l => l.verdict === 'DEFERRED_TO_REALIZATION')
        .map(l => ({ checkId: l.checkId, clause: l.clause, owes: l.owes ?? '' }))
        .sort((a, b) => `${a.checkId}|${a.clause}`.localeCompare(`${b.checkId}|${b.clause}`))

    const knowledgeVerdict: GateVerdict = knowledgeClauses.some(l => l.verdict === 'FAIL')
        ? 'FAIL'
        : knowledgeClauses.some(l => l.verdict === 'NOT_EVALUABLE')
          ? 'NOT_EVALUABLE'
          : 'PASS'

    const gateA: GateReport = {
        verdict:
            checks.some(c => c.verdict === 'FAIL')
                ? 'FAIL'
                : checks.some(c => c.verdict === 'NOT_EVALUABLE')
                  ? 'NOT_EVALUABLE'
                  : deferredClauses.length
                    ? 'DEFERRED_TO_REALIZATION'
                    : 'PASS',
        knowledgeVerdict,
        deferred: deferredClauses,
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
    // It asks the same resolver the emitted result uses, so the two views cannot drift apart. They did
    // once — SD-78 added a route and this invariant alone was not told, so it reported `game::V1`
    // valueless while the emitted result carried its value correctly.
    const valueless = [...ctx.classified.values()]
        .filter(l => l.verdict === 'RESOLVED:ENTAILED')
        .filter(l => resolvedValue(ctx.derived.get(l.lineId))?.value === undefined)
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
