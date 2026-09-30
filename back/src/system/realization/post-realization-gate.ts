/**
 * Gate A, run again over the concrete game.
 *
 * His ruling of 30 September, and the reason this is not a second, weaker gate:
 *
 *   > *A structural invariant should be evaluated at the earliest stage at which all information
 *   > required to evaluate it exists. … The same invariant is not weakened or removed. It is evaluated
 *   > once its subject exists.*
 *
 * So **the checks are not rewritten here.** The same fifteen functions run, against a context in which
 * every realization decision has been folded in as though it were established: a chosen value takes
 * the place of its open line, and an instantiated member takes the place of an existential claim.
 * Anything this stage reports is therefore the same invariant's verdict, not a relaxed cousin of it.
 *
 * What it does **not** do is pretend a decision was knowledge. The folding is local to this evaluation
 * and never returned; the resolved game and the realization record stay exactly as they were, so the
 * distinction between what was derived and what was chosen survives untouched.
 */

import { ClassifiedLine } from '../derivation/classify'
import { DerivedLine } from '../derivation/derive'
import { GateContext, GateReport, runGates } from '../derivation/gates'
import { ElementClass, ResolutionLine } from '../derivation/types'
import { Realized } from './realize'

export interface PostRealizationResult {
    /** The rerun report. Compare its checks against what the resolved game said was owed. */
    gateA: GateReport
    /** The owed invariants, and what the rerun made of each. */
    owed: { checkId: string; clause: string; verdict: string; why: string }[]
    /** True only where every owed invariant now passes. This is render-eligibility, not realization. */
    validated: boolean
    /** Where it is not validated, every reason — including an invariant still not evaluable. */
    outstanding: string[]
}

/**
 * Fold the realization decisions into a copy of the derivation context.
 *
 * A chosen value becomes a derived line, because at this stage it **is** established — the concrete
 * game holds it. An instantiated member becomes an element class, so a check that counts members can
 * see them. Both are copies: nothing here mutates the run.
 */
function concreteContext(ctx: GateContext, realized: Realized): GateContext {
    const classified = new Map<string, ClassifiedLine>(ctx.classified)
    const derived = new Map<string, DerivedLine>(ctx.derived)

    // **The geometric checks read the realized geometry, not the prose.** An authored relation that
    // entails both ends becomes the interval it entails, in the `{axis, lo, hi}` form §1.9 compares —
    // so `"end line to end line"` arrives as `[0, 40]` on a 40 m axis. A relation that entails only an
    // anchor is deliberately NOT substituted: its extent is unauthored, and handing the check a made-up
    // interval is exactly what his ruling forbids. Those lines keep their phrase and the check still
    // refuses them, which is the honest answer.
    for (const entry of realized.record.geometry) {
        if (!entry.geometry.interval) continue
        const record = derived.get(entry.lineId)
        const before = classified.get(entry.lineId)
        if (!record || !before) continue
        const interval = { axis: entry.geometry.axis, lo: entry.geometry.interval.from, hi: entry.geometry.interval.to }
        classified.set(entry.lineId, { ...before, verdict: 'RESOLVED:ENTAILED', resolvedBy: 'ENTAILMENT', reason: null })
        derived.set(entry.lineId, {
            ...record,
            open: null,
            entailing: [
                {
                    item: { contractId: 'realization', itemId: entry.lineId },
                    value: interval,
                    support: { kind: 'CONTRACT_ITEM', contractId: 'realization', itemId: entry.lineId, relation: 'ENTAILS' },
                },
            ],
        } as DerivedLine)
    }

    for (const choice of realized.record.choices) {
        const before = classified.get(choice.lineId)
        if (!before) continue
        // A choice whose value the geometry already instantiated must not be written back as prose over
        // the interval — the geometric substitution above is the one the checks need.
        if (realized.record.geometry.some(g => g.lineId === choice.lineId && g.geometry.interval)) continue
        classified.set(choice.lineId, { ...before, verdict: 'RESOLVED:ENTAILED', resolvedBy: 'ENTAILMENT', reason: null })
        const record = derived.get(choice.lineId)
        if (record) {
            // The chosen value is presented the way a derived value is, through the same entailing
            // slot the gate reads, so no check needs to know this was a realization decision.
            derived.set(choice.lineId, {
                ...record,
                open: null,
                entailing: [
                    ...record.entailing,
                    {
                        item: { contractId: 'realization', itemId: choice.lineId },
                        value: choice.value,
                        support: { kind: 'CONTRACT_ITEM', contractId: 'realization', itemId: choice.lineId, relation: 'ENTAILS' },
                    },
                ],
            } as DerivedLine)
        }
    }

    // **An instantiated member acquires the applicable property schema** — his ruling of 30 September:
    //
    //   > *When realization instantiates an authorized member of a represented class, it must also
    //   > instantiate the applicable property schema for that member. It does not thereby supply the
    //   > values of those properties. Creating a property location is not authoring its value.*
    //
    // Before this, `GA-ROSTER-SUM` could not run even with both teams instantiated, because SD-97
    // enumerates no lines for a class nothing individuates — so no `outfieldCount` line existed and
    // realization had never been asked for one. The property was not unauthored; it was **unaskable**.
    //
    // So each member gets a line for every FIELD row its collection owns, and each such line is
    // **unresolved unless the member itself carries a value**. A location is created; no value is
    // invented. The rule is general and applies to every existentially instantiated class — objectives,
    // performers, regions, objects alike — so none of them can acquire different semantics by accident.
    const classes: ElementClass[] = [...ctx.classes]
    const lines: ResolutionLine[] = [...ctx.lines]

    realized.record.instantiations.forEach((instantiation, i) => {
        const claim = ctx.classes.find(c => c.classId === instantiation.classId)
        if (!claim) return
        const classId = `realized:${instantiation.classId}:${i}`
        classes.push({ ...claim, classId, constraints: { any: false, terms: [] }, cardinality: { min: null, max: null } })

        for (const row of ctx.index.rows.values()) {
            if (row.kind !== 'FIELD' || ctx.index.ownerRow.get(row.id) !== claim.row) continue
            const lineId = `${classId}::${row.id}`
            lines.push({ lineId, elementId: classId, row: row.id, member: null, lineState: 'ENUMERATED' })

            // The member may carry a value for this property; the register's own leaf name is how it
            // says so. Where it does, the line is resolved by the realization decision. Where it does
            // not, the line exists and is unresolved — which is the honest state, and the one that lets
            // a check say "the outfield count is unresolved" instead of "no such line exists".
            const leaf = String(row.path).split('.').pop() ?? row.id
            const supplied = (instantiation.member as Record<string, unknown>)[leaf]
            if (supplied === undefined) {
                classified.set(lineId, { lineId, lineState: 'ENUMERATED', verdict: 'NOT_AUTHORED', reason: 'coverage', collidingItems: [] })
                derived.set(lineId, { lineId, entailing: [], bounding: [], narrowing: [], standingDecisions: [], undetermined: [], open: null } as unknown as DerivedLine)
                continue
            }
            classified.set(lineId, { lineId, lineState: 'ENUMERATED', verdict: 'RESOLVED:ENTAILED', resolvedBy: 'ENTAILMENT', reason: null, collidingItems: [] })
            derived.set(lineId, {
                lineId,
                entailing: [
                    {
                        item: { contractId: 'realization', itemId: lineId },
                        value: supplied,
                        support: { kind: 'CONTRACT_ITEM', contractId: 'realization', itemId: lineId, relation: 'ENTAILS' },
                    },
                ],
                bounding: [],
                narrowing: [],
                standingDecisions: [],
                undetermined: [],
                open: null,
            } as unknown as DerivedLine)
        }
    })

    return { ...ctx, classes, lines, classified, derived }
}

export function runPostRealizationGates(ctx: GateContext, resolvedOwed: { checkId: string; clause: string }[], realized: Realized): PostRealizationResult {
    const gateA = runGates(concreteContext(ctx, realized)).gateA

    const owed = resolvedOwed.map(entry => {
        const check = gateA.checks.find(c => c.checkId === entry.checkId)
        const clause = check?.clauses.find(l => l.clause === entry.clause)
        let verdict = String(clause?.verdict ?? 'NOT_FOUND')

        // **This IS the realization stage, so nothing here can be deferred to it.** A clause that
        // still reports DEFERRED_TO_REALIZATION is saying it needs a value realization supplies while
        // holding that value — which means the block was never really about the stage. Relabelled so
        // the report cannot claim a further stage that does not exist.
        if (verdict === 'DEFERRED_TO_REALIZATION') verdict = 'STILL_NOT_EVALUABLE'

        // **SD-54 applies with full force here.** A clause phrased over *open* lines has no open lines
        // left once realization has closed them, so it passes with nothing examined — and a vacuous
        // pass is not evidence that the property holds of the concrete game. Reported as what it is.
        if (verdict === 'PASS' && clause?.basis === 'NO_APPLICABLE_INSTANCES') verdict = 'PASS_VACUOUS'

        return { checkId: entry.checkId, clause: entry.clause, verdict, why: check?.why ?? '' }
    })

    const outstanding: string[] = []
    for (const entry of owed) {
        if (entry.verdict === 'PASS') continue
        outstanding.push(`${entry.checkId} — "${entry.clause}": ${entry.verdict}${entry.why ? ` (${entry.why})` : ''}`)
    }
    // A check that was fine before realization and is not now is the failure this rerun exists to
    // catch: a decision that broke something the knowledge had already settled.
    for (const check of gateA.checks) {
        if (check.verdict !== 'FAIL') continue
        if (resolvedOwed.some(o => o.checkId === check.checkId)) continue
        outstanding.push(`${check.checkId} FAILS on the concrete game though it did not on the resolved game: ${check.why}`)
    }

    return { gateA, owed, validated: outstanding.length === 0, outstanding }
}
