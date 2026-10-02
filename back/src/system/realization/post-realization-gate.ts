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
import { DerivedLine, resolvedValue } from '../derivation/derive'
import { GateContext, GateReport, runGates } from '../derivation/gates'
import { ElementClass, ResolutionLine } from '../derivation/types'
import { collectionPath, place, readAt, Realized, RealizationRecord } from './realize'

/** A value entailed once the concrete game exists, with the member address it belongs at. */
export type Entailment = RealizationRecord['entailed'][number]

export interface PostRealizationResult {
    /** The rerun report. Compare its checks against what the resolved game said was owed. */
    gateA: GateReport
    /** The owed invariants, and what the rerun made of each. */
    owed: { checkId: string; clause: string; verdict: string; why: string }[]
    /** True only where every owed invariant now passes. This is render-eligibility, not realization. */
    validated: boolean
    /** Where it is not validated, every reason — including an invariant still not evaluable. */
    outstanding: string[]
    /** Values this stage derived for instantiated members and wrote back into the concrete game. */
    entailed: Entailment[]
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

    deriveRosterFromSession(ctx, classes, classified, derived)
    return { ...ctx, classes, lines, classified, derived }
}

/**
 * The roster, derived from the session and the authored knowledge — never chosen, and never assumed.
 *
 * His stated chain of 1 October: *"12 available performers → 0 specialized roles available → 0 neutrals
 * → 2 teams → equal outfield counts → 6 outfield players per team."* Every step of that comes from a
 * legitimate source, which is the whole condition:
 *
 *   - **12** from the session envelope (`players`);
 *   - **0 specialized-role performers** from the session envelope's stated `roles`, as an explicit zero. An absent entry
 *     means NOT STATED and derives nothing — which is what stops this from treating every available
 *     performer as an outfield player whenever nobody mentioned a specialized role;
 *   - **0 neutrals** because no neutral is instantiated in this game. Nothing is inferred from `P5`
 *     being unconstrained: a game with no neutrals in it has none;
 *   - **2 teams** from the instantiated members of the authored claim;
 *   - **equality** from `GF2-14.b`, now owner-authored, and read from the knowledge rather than assumed
 *     here. **Equality is not an engine rule**: this derivation fires only where an authored item states
 *     it, so a game form authoring asymmetry simply does not reach this path.
 *
 * It refuses on anything missing. A division that does not come out whole derives nothing rather than
 * rounding, because a rounded roster is an invented one.
 */
function deriveRosterFromSession(
    ctx: GateContext,
    classes: ElementClass[],
    classified: Map<string, ClassifiedLine>,
    derived: Map<string, DerivedLine>,
): void {
    const players = Number((ctx.envelope as any)?.players)
    const roles = (ctx.envelope as any)?.roles as Record<string, number> | undefined
    if (!Number.isFinite(players) || !roles) return

    const teams = classes.filter(c => c.row === 'P1' && c.classId.startsWith('realized:'))
    if (!teams.length) return

    // Equality must be AUTHORED. Without an item stating it, nothing here divides anything.
    const equality = ctx.contracts.some(contract =>
        (contract.items ?? []).some(
            item =>
                String(item.row) === 'P2' &&
                String((item as any).basis) !== 'ASSUMED' &&
                /equal/i.test(String(item.value ?? '')),
        ),
    )
    if (!equality) return

    // Specialized roles the session states, per team. A stated zero is a fact; an absent role is not.
    const specialized = Object.values(roles).reduce((sum, count) => sum + (Number.isFinite(count) ? Number(count) : NaN), 0)
    if (!Number.isFinite(specialized)) return

    // Neutrals: however many the game actually instantiated, which for a game with none is zero.
    const neutrals = classes.filter(c => c.row === 'P5' && c.classId.startsWith('realized:')).length

    const outfieldTotal = players - specialized * teams.length - neutrals
    if (outfieldTotal < 0 || outfieldTotal % teams.length !== 0) return // does not come out whole; derive nothing
    const perTeam = outfieldTotal / teams.length

    const support = [
        { kind: 'SESSION' as const, row: 'E1' },
        { kind: 'SESSION' as const, row: 'roles' },
    ]

    // The specialized-role rows come from the register, which carries the role NAME; this layer knows
    // none of them. A role the session has not stated derives nothing, because absent means NOT STATED.
    const specializedRows: [string, number][] = []
    for (const [rowId, roleName] of ctx.index.specializedRoleRows) {
        if (ctx.index.ownerRow.get(rowId) !== 'P1') continue
        const stated = roles[roleName]
        if (!Number.isFinite(stated)) return
        specializedRows.push([rowId, Number(stated)])
    }

    for (const team of teams) {
        for (const [row, value] of [['P2', perTeam] as [string, number], ...specializedRows]) {
            const lineId = `${team.classId}::${row}`
            if (resolvedValue(derived.get(lineId))?.value !== undefined) continue
            classified.set(lineId, { lineId, lineState: 'ENUMERATED', verdict: 'RESOLVED:ENTAILED', resolvedBy: 'SESSION', reason: null, collidingItems: [] })
            derived.set(lineId, {
                lineId,
                entailing: [{ item: { contractId: 'session', itemId: row }, value, support: support[0] }],
                bounding: [],
                narrowing: [],
                standingDecisions: [],
                undetermined: [],
                open: null,
            } as unknown as DerivedLine)
        }
    }
}

/**
 * **Every value this stage derives for an instantiated member, and where it belongs in the game.**
 *
 * This exists because of a defect the rendering layer found, and the defect is worth stating because the
 * shape recurs: `GA-ROSTER-SUM` derived six outfield players a side, passed on that figure, and **the
 * figure was never written anywhere.** It lived in the gate's own evaluation context and died with it.
 * So A04 was marked render-eligible while its teams carried no size at all, and a coach reading the
 * output could not pick sides. The invariant genuinely passed; what it passed on was its own working.
 *
 * The rule now: **a value a check derives in order to pass must end up in the artifact.** `render-eligible`
 * otherwise means less than it sounds — the game satisfies a property whose value nothing downstream can
 * read.
 *
 * It is deliberately NOT roster-specific. It asks the general question — which member-property lines did
 * this stage resolve that the recorded member does not carry? — so any future property derived once its
 * subject exists is carried on the same route, rather than each one needing to remember to persist itself.
 *
 * What it is not: these are not realization choices. Nothing is selected and nothing bounded. The value
 * is entailed, it is recorded under its own name with the chain that entails it, and `nothingInvented`
 * accounts for it by that name rather than by the blanket permission membership used to confer.
 */
export function entailOverConcreteGame(ctx: GateContext, realized: Realized): Entailment[] {
    const concrete = concreteContext(ctx, realized)
    const entailments: Entailment[] = []

    for (const cls of concrete.classes) {
        const match = /^realized:(.+):(\d+)$/.exec(cls.classId)
        if (!match) continue
        const instantiation = realized.record.instantiations[Number(match[2])]
        if (!instantiation || instantiation.memberIndex < 0) continue

        for (const row of ctx.index.rows.values()) {
            if (row.kind !== 'FIELD' || ctx.index.ownerRow.get(row.id) !== cls.row) continue
            const lineId = `${cls.classId}::${row.id}`
            const resolved = resolvedValue(concrete.derived.get(lineId))
            if (resolved?.value === undefined) continue

            const leaf = String(row.path).split('.').pop() as string
            // Already carried by the member realization supplied — nothing owed, and nothing to write.
            if ((instantiation.member as Record<string, unknown>)[leaf] !== undefined) continue

            const collection = collectionPath(instantiation.path)
            const support = concrete.derived.get(lineId)?.entailing?.[0]?.support as { kind?: string } | undefined
            entailments.push({
                lineId,
                collection,
                memberIndex: instantiation.memberIndex,
                leaf,
                path: `${collection}[${instantiation.memberIndex}].${leaf}`,
                value: resolved.value,
                because: `entailed over the concrete game once ${collection} existed; resolved by ${support?.kind ?? 'the derivation'} on line ${lineId}`,
            })
        }
    }

    // Written into the game, and recorded. The recorded member is deliberately left alone: if the
    // entailed value were written into it, `nothingInvented` would account for it as something the
    // member "carries", and the check would be confirming my own write rather than an entailment.
    for (const entailment of entailments) {
        const bucket = readAt(realized.game, entailment.collection)
        const member = Array.isArray(bucket) ? (bucket as Record<string, unknown>[])[entailment.memberIndex] : null
        if (!member) continue
        place(member, entailment.leaf, entailment.value)
    }
    realized.record.entailed = entailments
    return entailments
}

/**
 * **Did the artifact keep what the checks derived?** The guard for the whole class of defect above.
 *
 * Any member-property line this stage resolves must be readable from the concrete game at the member's
 * own address. A value that is present in the evaluation context and absent from the game is reported,
 * and it blocks render-eligibility — because a game that passes an invariant on a value it does not
 * contain is not a game anything can render.
 */
function entailmentsPersist(ctx: GateContext, realized: Realized): string[] {
    const concrete = concreteContext(ctx, realized)
    const problems: string[] = []

    for (const cls of concrete.classes) {
        const match = /^realized:(.+):(\d+)$/.exec(cls.classId)
        if (!match) continue
        const instantiation = realized.record.instantiations[Number(match[2])]
        if (!instantiation || instantiation.memberIndex < 0) continue

        for (const row of ctx.index.rows.values()) {
            if (row.kind !== 'FIELD' || ctx.index.ownerRow.get(row.id) !== cls.row) continue
            const lineId = `${cls.classId}::${row.id}`
            const resolved = resolvedValue(concrete.derived.get(lineId))
            if (resolved?.value === undefined) continue

            const leaf = String(row.path).split('.').pop() as string
            const collection = collectionPath(instantiation.path)
            const bucket = readAt(realized.game, collection)
            const member = Array.isArray(bucket) ? (bucket as Record<string, unknown>[])[instantiation.memberIndex] : null
            const inGame = member ? readAt(member, leaf) : undefined

            if (inGame === undefined) {
                problems.push(
                    `${lineId} resolves to ${JSON.stringify(resolved.value)} in this stage's context, and ` +
                        `${collection}[${instantiation.memberIndex}].${leaf} is absent from the concrete game — the check would pass on a value nothing can read`,
                )
            } else if (JSON.stringify(inGame) !== JSON.stringify(resolved.value)) {
                problems.push(
                    `${lineId} resolves to ${JSON.stringify(resolved.value)} but the concrete game holds ${JSON.stringify(inGame)} at ` +
                        `${collection}[${instantiation.memberIndex}].${leaf}`,
                )
            }
        }
    }
    return problems
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

    // **And a value a check derived must be in the game.** This blocks render-eligibility rather than
    // merely reporting, because the alternative is what A04 did: pass every invariant while missing a
    // property a coach needs. An invariant satisfied by the gate's own scratch space has proved nothing
    // about the artifact.
    for (const problem of entailmentsPersist(ctx, realized)) {
        outstanding.push(`a derived value does not survive into the concrete game: ${problem}`)
    }

    return { gateA, owed, validated: outstanding.length === 0, outstanding, entailed: realized.record.entailed }
}
