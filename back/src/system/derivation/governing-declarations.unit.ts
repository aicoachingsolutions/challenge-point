/**
 * His answer 9 of 15 October 2026 — which declarations decide a line's reason.
 *
 *   *"I agree that the knowledge establishing a specific condition should govern that condition's details.
 *   However, specificity should not mean that silence automatically overrides requirements established
 *   elsewhere. My preferred rule is: Specific knowledge governs where it explicitly defines or specializes a
 *   condition. General requirements remain applicable unless the specific knowledge explicitly supersedes them
 *   through an authorized relationship."*
 *
 * `governingDeclarations` (classify.ts) is that rule in its strict form: the object establishing an element
 * governs where it speaks explicitly about it, every general requirement that still addresses the element stays
 * in force, silence changes nothing, and the set of authorized supersessions is data — whether any statement in
 * the knowledge is such a relationship is his decision, not ours. It was EMPTY until his reply received 15 October
 * 2026 approved Option A (16 October, item 8) for exactly four statements, GF2's gaps on V3-V6 (C50), together with
 * the correction of the Pass Combination Gate's place to "not yet authored" (C49) that has to land with it.
 *
 * Every "before" below is computed IN the test, by the same AM-23 order over the row-wide set the engine used
 * until today (`reasonFor` with no element), so the pins compare the rule against its own predecessor rather
 * than against a number copied from a probe. The measured moves were first taken by probe on 15 October 2026
 * against 902a4b5 and match the design analysis's prediction exactly: five lines corpus-wide.
 *
 * Run: npm test
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { ClassifiedLine, governingDeclarations, reasonFor } from './classify'
import { CONFORMANCE_DIR, corpusInput, loadRegister } from './corpus'
import { restateDeclaration } from './corpus-restatement'
import { runStages0to10 } from './engine'
import { runGates } from './gates'
import { reaches } from './reach'
import { indexRegister } from './register'
import { derivationInputFor } from './run-bounded-selection'
import { DeclarationReach } from './scope'
import { DEFERS_TO_ESTABLISHING_OBJECT, DerivationInput, ElementClass, ReasonCode } from './types'

let passed = 0
function test(name: string, body: () => void): void {
    body()
    passed++
    console.log(`  ok  ${name}`)
}

const BLOCKING: ReasonCode[] = ['declared gap', 'claimed but unresolved']
const compose = (ids: string[]): DerivationInput => derivationInputFor({ selected: ids.map(id => ({ id, role: 'test composition' })) })

/** The compositions the rule was measured on: the corpus, the game form alone, and with each object a demonstration or A01 uses. */
const COMPOSITIONS: [string, () => DerivationInput][] = [
    ['corpus', () => corpusInput()],
    ['GF2', () => compose(['restated:GF2'])],
    ['GF2 + Wide Zone', () => compose(['restated:GF2', 'restated:WIDE-ZONE-ADVANTAGE'])],
    ['GF2 + Neutral', () => compose(['restated:GF2', 'restated:NEUTRAL-PLAYER-CONDITION'])],
    ['GF2 + Pass Combination Gate', () => compose(['restated:GF2', 'blind:PASS-COMBINATION-GATE'])],
    ['GF2 + RPC-001', () => compose(['restated:GF2', 'restated:RPC-001'])],
    ['GF2 + RPC-001 + A01-02', () => compose(['restated:GF2', 'restated:RPC-001', 'restated:A01-02'])],
    ['GF2 + Variable Target', () => compose(['restated:GF2', 'restated:VARIABLE-TARGET-CONDITION'])],
]

/**
 * **The second game form's compositions — added in review, 15 October 2026.** The implementing stage measured GF4
 * alone; composed with anything else it moves, and two Gate A verdicts move with it (pinned below). Every move is
 * a TIGHTENING: GF4 explicitly claims its modifier's V8b and V9, which it leaves unresolved (GF4 alone already
 * blocks on both), and another object's "not mine to say" — a non-claim, not a requirement — had been outranking
 * that claim under AM-23 and reading the lines "not constrained" the moment anything was composed beside it.
 */
const GF4_COMPOSITIONS: [string, () => DerivationInput][] = [
    ['GF4', () => compose(['blind:GF4'])],
    ['GF4 + GF2', () => compose(['blind:GF4', 'restated:GF2'])],
    ['GF4 + Pass Combination Gate', () => compose(['blind:GF4', 'blind:PASS-COMBINATION-GATE'])],
    ['GF4 + RPC-001', () => compose(['blind:GF4', 'restated:RPC-001'])],
    ['GF4 + Wide Zone', () => compose(['blind:GF4', 'restated:WIDE-ZONE-ADVANTAGE'])],
    ['GF4 + A01-02', () => compose(['blind:GF4', 'restated:A01-02'])],
    ['GF4 + Neutral', () => compose(['blind:GF4', 'restated:NEUTRAL-PLAYER-CONDITION'])],
    ['GF4 + Variable Target', () => compose(['blind:GF4', 'restated:VARIABLE-TARGET-CONDITION'])],
]

interface Run {
    staged: any
    rowOf: Map<string, string>
    /** Each NOT_AUTHORED line whose reason came from declarations: [reason under the rule, reason row-wide]. */
    reasons: Map<string, [ReasonCode, ReasonCode]>
}

const runs = new Map<string, Run>()
function run(name: string): Run {
    const cached = runs.get(name)
    if (cached) return cached
    const staged: any = runStages0to10([...COMPOSITIONS, ...GF4_COMPOSITIONS].find(([n]) => n === name)![1]())
    const rowOf = new Map<string, string>(staged.lines.map((l: any) => [l.lineId, l.row]))
    const reasons = new Map<string, [ReasonCode, ReasonCode]>()
    for (const line of staged.classified.values() as Iterable<ClassifiedLine>) {
        if (line.verdict !== 'NOT_AUTHORED' || !line.governedBy) continue
        reasons.set(line.lineId, [line.reason as ReasonCode, reasonFor(rowOf.get(line.lineId)!, staged.scope.declarations)])
    }
    const result = { staged, rowOf, reasons }
    runs.set(name, result)
    return result
}

/** Gate A over the same run with every declaration-decided reason put back to its row-wide value. */
function gateAsBefore(r: Run) {
    const classified = new Map<string, ClassifiedLine>()
    for (const [lineId, line] of r.staged.classified as Map<string, ClassifiedLine>) {
        const pair = r.reasons.get(lineId)
        classified.set(lineId, pair ? { ...line, reason: pair[1] } : line)
    }
    return runGates({ ...r.staged.gateContext, classified }).gateA
}

const moves = (r: Run) =>
    [...r.reasons.entries()]
        .filter(([, [now, before]]) => now !== before)
        .map(([lineId, [now, before]]) => `${lineId}: ${before} -> ${now}`)
        .sort()

test('corpus-wide, exactly five lines move, each as the design analysis predicted', () => {
    // 30 lines are decided from declarations (derivation-stage10 pins the count, unchanged by this rule).
    const corpus = run('corpus')
    assert.equal(corpus.reasons.size, 30)
    assert.deepEqual(moves(corpus), [
        // An exclusion scoped to Wide Zone's OWN involvement had been relabelling regions it never addressed.
        'c:blind:GF4:I03::S4: excluded -> not constrained',
        // Another object's gap whose selector is FALSE for the element had been reported over the establishing
        // object's own claim. Both codes block: the line is attributed to the object that actually requires it.
        'c:blind:GF4:I17::V9: declared gap -> claimed but unresolved',
        'c:restated:GF2:GF2-03.e::S4: excluded -> not constrained',
        'c:restated:GF2:GF2-03.f::S4: excluded -> not constrained',
        'c:restated:VARIABLE-TARGET-CONDITION:VARTARGET-13.a::V20: declared gap -> claimed but unresolved',
    ])
})

test('no blocking line becomes non-blocking, in the corpus or in any composition', () => {
    for (const [name] of [...COMPOSITIONS, ...GF4_COMPOSITIONS]) {
        const relaxed = [...run(name).reasons.entries()].filter(([, [now, before]]) => BLOCKING.includes(before) && !BLOCKING.includes(now))
        assert.deepEqual(relaxed, [], `${name}: a requirement that blocked still blocks`)
    }
})

test('Gate A check verdicts are unchanged everywhere; RPC-001-11.a::J2 joins the GF2 + RPC-001 blockers', () => {
    const expected: Record<string, string> = {
        corpus: 'FAIL',
        GF2: 'DEFERRED_TO_REALIZATION',
        'GF2 + Wide Zone': 'DEFERRED_TO_REALIZATION',
        'GF2 + Neutral': 'DEFERRED_TO_REALIZATION',
        'GF2 + Pass Combination Gate': 'FAIL',
        'GF2 + RPC-001': 'FAIL',
        'GF2 + RPC-001 + A01-02': 'FAIL',
        'GF2 + Variable Target': 'FAIL',
    }
    for (const [name] of COMPOSITIONS) {
        const r = run(name)
        const now = r.staged.gates.gateA
        const before = gateAsBefore(r)
        assert.equal(now.verdict, expected[name], `${name}: Gate A`)
        assert.equal(before.verdict, now.verdict, `${name}: Gate A is what it was`)
        const verdicts = (g: any) => Object.fromEntries(g.checks.map((c: any) => [c.checkId, c.verdict]))
        assert.deepEqual(verdicts(now), verdicts(before), `${name}: no check verdict moves`)

        const blockers = (g: any) => g.checks.find((c: any) => c.checkId === 'GA-NO-FAILED-LINE').subjects as string[]
        const added = blockers(now).filter(id => !blockers(before).includes(id))
        const removed = blockers(before).filter(id => !blockers(now).includes(id))
        assert.deepEqual(removed, [], `${name}: no blocker is lost`)
        // The context's objective claims its own target and nothing resolves it. GF2's non-claim on REPRESENTATIVE
        // objectives — whose selector is FALSE for a PRIMARY_SCORING one — had been hiding that claim.
        const gains =
            name.startsWith('GF2 + RPC-001') ? ['c:restated:RPC-001:RPC-001-11.a::J2']
            : name === 'GF2 + Variable Target' ? ['c:restated:VARIABLE-TARGET-CONDITION:VARTARGET-13.a::V20']
            : []
        assert.deepEqual(added, gains, `${name}: blockers gained`)
    }
})

test('silence never overrides: RPC-001\'s control, exclusion and origin lines stay declared gaps, decided row-wide', () => {
    // RPC-001 says nothing explicit about these (its control/exclusion place is UNDECLARED, "Referents never
    // examined", and nothing of its own reaches the origin's value), so GF2's general gap still governs. His
    // answer 9 does not unblock A01; only explicit knowledge about these details could.
    for (const name of ['GF2 + RPC-001', 'GF2 + RPC-001 + A01-02']) {
        const r = run(name)
        for (const lineId of ['c:restated:RPC-001:RPC-001-18.f::V5', 'c:restated:RPC-001:RPC-001-19.a::V5', 'c:restated:RPC-001:RPC-001-18.a::V6']) {
            const line = r.staged.classified.get(lineId) as ClassifiedLine
            assert.equal(line.reason, 'declared gap', `${name} ${lineId}`)
            const rowWide = r.staged.scope.declarations.filter((d: DeclarationReach) => d.row === r.rowOf.get(lineId))
            assert.equal(line.governedBy!.length, rowWide.length, `${name} ${lineId}: the establishing object is silent, so the whole row decides`)
        }
    }
})

test('guard: honouring selectors WITHOUT the establishing precedence would relax two blocking lines', () => {
    // The design analysis measured it and DONOTDO 1 forbids it: drop the declarations that do not address the
    // element but keep AM-23 over the rest, and a non-claim from elsewhere outranks the establishing object's own
    // claim. Pinned so the precedence can never be removed while selector-honouring stays.
    const corpus = run('corpus')
    const classOf = new Map<string, ElementClass>(corpus.staged.classes.map((c: ElementClass) => [c.classId, c]))
    for (const lineId of ['c:blind:GF4:I17::V9', 'c:restated:VARIABLE-TARGET-CONDITION:VARTARGET-13.a::V20']) {
        const row = corpus.rowOf.get(lineId)!
        const cls = classOf.get(lineId.slice(0, lineId.lastIndexOf('::')))!
        const selectorOnly = (corpus.staged.scope.declarations as DeclarationReach[]).filter(
            d =>
                d.row === row &&
                (d.scope !== 'OWN_INVOLVEMENT' || cls.fromItem.contractId === d.contractId) &&
                (!d.parsed.predicate || reaches(d.parsed.predicate, cls) !== 'FALSE'),
        )
        assert.equal(reasonFor(row, selectorOnly), 'not constrained', `${lineId}: selector-honouring alone relaxes it`)
        assert.equal(corpus.reasons.get(lineId)![0], 'claimed but unresolved', `${lineId}: under the rule it still blocks`)
        assert.equal(corpus.reasons.get(lineId)![1], 'declared gap', `${lineId}: as it blocked before`)
    }
})

test('the roster asks the same question: a specialized role read through the team class agrees with today', () => {
    // assemble-concrete-game.ts reads a role row that has no line by `reasonFor(row, declarations, teamClass)` —
    // the same function, so the precedence exists once. Measured: no team row reads differently.
    for (const name of ['GF2 + RPC-001', 'GF2 + RPC-001 + A01-02', 'GF2 + Wide Zone', 'GF2 + Neutral']) {
        const r = run(name)
        const index = indexRegister(loadRegister())
        const teams = (r.staged.classes as ElementClass[]).filter(c => c.row === 'P1')
        assert.ok(teams.length > 0, `${name}: the composition has teams`)
        for (const rowId of index.specializedRoleRows.keys()) {
            for (const team of teams) {
                assert.equal(reasonFor(rowId, r.staged.scope.declarations, team), reasonFor(rowId, r.staged.scope.declarations), `${name} ${team.classId} ${rowId}`)
            }
        }
    }
})

/**
 * **The supersession set is data, and since 15 October 2026 it holds exactly four statements (C50).**
 *
 * Re-pointed from "…and it is empty". His reply of that day (16 October, item 8): *"I approve your recommended
 * Option A for the four identified statements. A context may explicitly establish that a particular scoring-condition
 * detail requires no additional value. However, the engine must distinguish between: A field explicitly defined as
 * not applicable or requiring no further value. A field whose value remains missing or unresolved. The former should
 * be valid. The latter should remain a knowledge gap when that information is necessary. This is not permission for
 * the engine to fill missing values through inference."* The four are GF2's NOT_AUTHORED declarations on V3-V6 —
 * "any control requirement must come from elsewhere", OUR 17 September wording, shown to him as ours. Nothing else
 * defers: not GF2's NON_CLAIMED statements on the same rows, nor any other object's.
 */
const OPTION_A = ['restated:GF2 V3 NOT_AUTHORED', 'restated:GF2 V4 NOT_AUTHORED', 'restated:GF2 V5 NOT_AUTHORED', 'restated:GF2 V6 NOT_AUTHORED']

test('the supersession set is data, and it is exactly these four GF2 statements, each tracing to his Option A (C50)', () => {
    const restatements = JSON.parse(fs.readFileSync(path.join(CONFORMANCE_DIR, 'stage-b/corpus-restatements.json'), 'utf8').replace(/^﻿/, ''))
    const deferrals = (restatements.declarations ?? []).filter((d: any) => 'defersTo' in d)
    assert.deepEqual(deferrals.map((d: any) => `${d.contractId} ${d.row} ${d.to}`), OPTION_A)
    for (const d of deferrals) {
        assert.equal(d.ruling, 'C50', `${d.contractId} ${d.row}: the ruling that wrote it`)
        assert.equal(d.from, d.to, `${d.contractId} ${d.row}: a deferral keeps its kind, so a missing value still blocks`)
        assert.equal(d.defersTo, DEFERS_TO_ESTABLISHING_OBJECT)
        assert.ok(d.why.includes('I approve your recommended Option A for the four identified statements.'), `${d.contractId} ${d.row}: his words travel with it`)
    }
    for (const [name] of [...COMPOSITIONS, ...GF4_COMPOSITIONS]) {
        const loaded = (run(name).staged.scope.declarations as DeclarationReach[]).filter(d => d.defersTo !== undefined)
        const expected = name === 'corpus' || name.includes('GF2') ? OPTION_A : []
        assert.deepEqual(loaded.map(d => `${d.contractId} ${d.row} ${d.declaration}`).sort(), expected, `${name}: the loaded deferrals`)
    }
})

/** A composition over a DEEP COPY of its knowledge, altered (the loader's objects are shared, brief rule 0.7). */
function stagedOver(make: () => DerivationInput, alter: (contracts: any[]) => void): any {
    const input = make()
    input.contracts = JSON.parse(JSON.stringify(input.contracts))
    alter(input.contracts as any[])
    return runStages0to10(input)
}
const stripDeferrals = (contracts: any[]) => {
    for (const contract of contracts) for (const d of contract.declarations ?? []) delete d.defersTo
}
const GATE = 'blind:PASS-COMBINATION-GATE'
/** The gate's V5 statement as C45 wrote it before C49 corrected it: NON_CLAIMED, "explicitly unrestricted". */
const gateV5AsBeforeC49 = (contracts: any[]) => {
    const v5 = contracts.find(c => c.contractId === GATE)?.declarations.find((d: any) => d.row === 'V5')
    if (!v5) return
    assert.equal(v5.declaration, 'NOT_AUTHORED', 'the copy starts from C49')
    v5.declaration = 'NON_CLAIMED'
}
/** Every line whose verdict or reason differs between two runs, and every Gate A check that moves. */
function differences(a: any, b: any): string[] {
    const out: string[] = []
    for (const [lineId, line] of a.classified as Map<string, ClassifiedLine>) {
        const other = b.classified.get(lineId) as ClassifiedLine | undefined
        if (!other || other.verdict !== line.verdict || other.reason !== line.reason) out.push(`${lineId}: ${line.verdict}/${line.reason} -> ${other ? `${other.verdict}/${other.reason}` : 'absent'}`)
    }
    for (const lineId of b.classified.keys()) if (!a.classified.has(lineId)) out.push(`${lineId}: absent -> present`)
    const verdicts = (g: any) => Object.fromEntries([['verdict', g.verdict], ...g.checks.map((c: any) => [c.checkId, c.verdict])])
    const va = verdicts(a.gates.gateA)
    const vb = verdicts(b.gates.gateA)
    for (const key of new Set([...Object.keys(va), ...Object.keys(vb)])) if (va[key] !== vb[key]) out.push(`Gate A ${key}: ${va[key]} -> ${vb[key]}`)
    return out.sort()
}

const PCG_COMPOSITIONS: [string, () => DerivationInput][] = [
    ['GF2 + Neutral + Pass Combination Gate', () => compose(['restated:GF2', 'restated:NEUTRAL-PLAYER-CONDITION', GATE])],
]

test('Option A moves nothing, in the corpus or any composition: every reason and every Gate A check is what it is with the four deferrals stripped', () => {
    // Measured by probe on 15 October 2026 before this test was written (the design analysis predicted it): with C49
    // in place, Option A's four deferrals change no line anywhere. They are not idle — the constructed cases below
    // show each one bite — but no object in the corpus speaks explicitly about V3-V6 where GF2's gap reaches today
    // except the gate, whose own statement is now a gap too.
    for (const [name, make] of [...COMPOSITIONS, ...GF4_COMPOSITIONS, ...PCG_COMPOSITIONS]) {
        assert.deepEqual(differences(stagedOver(make, stripDeferrals), stagedOver(make, () => undefined)), [], `${name}: Option A moves nothing`)
    }
})

test('WHY C49 had to land with Option A, on a TEST-ONLY copy without it: the deferral would read the gate\'s non-claim as "count anywhere"', () => {
    // The gate's V5 put back to C45's NON_CLAIMED on a copy. With the four deferrals, the possession game's gap
    // steps aside for the gate's explicit statement, and that statement is a non-claim: the gate's condition would
    // count passes anywhere — exactly the reading his 16 October item 8 rejected ("removing 'in their half' should not
    // automatically be interpreted as authorizing pass counting anywhere"). Without the deferrals, or with C49, it
    // stays a declared gap. The demonstration-level consequence (structure -> communication) is pinned in
    // activity-review.unit.ts.
    const line = `c:${GATE}:PCG-02::V5`
    const expected: Record<string, [string, string, string]> = {
        // [with C49 and Option A, without C49 but with Option A, without C49 and without Option A]
        corpus: ['declared gap', 'excluded', 'declared gap'],
        'GF2 + Pass Combination Gate': ['declared gap', 'not constrained', 'declared gap'],
        'GF2 + Neutral + Pass Combination Gate': ['declared gap', 'not constrained', 'declared gap'],
    }
    for (const [name, make] of [...COMPOSITIONS, ...PCG_COMPOSITIONS].filter(([n]) => n in expected)) {
        const now = stagedOver(make, () => undefined)
        const withoutC49 = stagedOver(make, gateV5AsBeforeC49)
        const neither = stagedOver(make, contracts => (gateV5AsBeforeC49(contracts), stripDeferrals(contracts)))
        assert.deepEqual([now, withoutC49, neither].map(s => s.classified.get(line).reason), expected[name], name)
        // Nothing but that line (and the checks it feeds) moves.
        assert.deepEqual(differences(now, withoutC49).filter(d => !d.startsWith('Gate A')), [`${line}: NOT_AUTHORED/declared gap -> NOT_AUTHORED/${expected[name][1]}`], name)
    }
    const gf2Gate = stagedOver(() => compose(['restated:GF2', GATE]), gateV5AsBeforeC49)
    assert.equal(gf2Gate.gates.gateA.verdict, 'DEFERRED_TO_REALIZATION', 'without C49 the gate composition would pass Gate A')
    assert.equal(stagedOver(() => compose(['restated:GF2', GATE]), () => undefined).gates.gateA.verdict, 'FAIL', 'with it, it does not')
})

test('TIGHTENED by C49 (15 October 2026): the gate composed with the second game form, or alone, no longer counts passes anywhere', () => {
    // Measured by probe that day. GF4 says nothing that is a requirement on V5, so under establishing-object
    // precedence the gate's C45 non-claim governed its own condition alone: 'not constrained', the position clause
    // deferred and the reference check passed — "explicitly unrestricted", in a composition no pathway reaches (the
    // gate is held from every Learning Goal). With the gate's place not yet authored it is a declared gap that
    // blocks, and the two checks cannot be evaluated. A tightening; nothing relaxes.
    const make = () => compose(['blind:GF4', GATE])
    assert.deepEqual(differences(stagedOver(make, gateV5AsBeforeC49), stagedOver(make, () => undefined)), [
        'Gate A GA-ONE-PRIMARY-EVENT: DEFERRED_TO_REALIZATION -> NOT_EVALUABLE',
        'Gate A GA-REFERENCE-INTEGRITY: PASS -> NOT_EVALUABLE',
        `c:${GATE}:PCG-02::V5: NOT_AUTHORED/not constrained -> NOT_AUTHORED/declared gap`,
    ])
    // **H1 review, 15 October 2026 — the gate ALONE moves too, and was in no composition list.** Measured by diffing
    // every line and every Gate A check over twenty compositions with the restatements before and after C49: besides
    // GF4 + gate, the gate composed with nothing tightens the same way (its place was 'not constrained' with no other
    // object to speak), and here the failed line also fails GA-NO-FAILED-LINE, so Gate A goes NOT_EVALUABLE -> FAIL.
    // Reachable by no pathway (the gate is held from every Learning Goal and its demonstration composes GF2). A
    // tightening; nothing relaxes. With C49 and C50 together no other composition moves (the test above).
    const alone = () => compose([GATE])
    const before = stagedOver(alone, gateV5AsBeforeC49)
    const now = stagedOver(alone, () => undefined)
    assert.deepEqual(differences(before, now), [
        'Gate A GA-NO-FAILED-LINE: PASS -> FAIL',
        'Gate A GA-REFERENCE-INTEGRITY: PASS -> NOT_EVALUABLE',
        'Gate A verdict: NOT_EVALUABLE -> FAIL',
        `c:${GATE}:PCG-02::V5: NOT_AUTHORED/not constrained -> NOT_AUTHORED/declared gap`,
    ])
})

/** RPC-001-18.f's control line in GF2 + RPC-001 over a copy, with RPC-001's V5 statements replaced; GF2's loaded statements kept. */
function controlLineWithRpc001(rpc001V5: Record<string, unknown>[], strip = false): ClassifiedLine {
    const staged = stagedOver(
        () => compose(['restated:GF2', 'restated:RPC-001']),
        contracts => {
            const rpc: any = contracts.find(c => c.contractId === 'restated:RPC-001')
            rpc.declarations = [
                ...rpc.declarations.filter((d: any) => String(d.row) !== 'V5'),
                ...rpc001V5.map(d => ({ row: 'V5', scope: 'WHOLE_GAME', note: 'TEST-ONLY construction', ...d })),
            ]
            if (strip) stripDeferrals(contracts)
        },
    )
    return staged.classified.get('c:restated:RPC-001:RPC-001-18.f::V5') as ClassifiedLine
}

test('his item 8 distinction, constructed on copies: an explicit "no further value" is valid, a missing value still blocks', () => {
    // RPC-001-18.f establishes a control condition (type=control). TEST-ONLY: RPC-001 is made to say, explicitly, that
    // its control condition's place needs no further value — NON_CLAIMED for type=control. Nothing authored says so.
    const explicit = controlLineWithRpc001([{ declaration: 'NON_CLAIMED', selector: 'type=control' }])
    assert.equal(explicit.reason, 'not constrained', '"A field explicitly defined as not applicable or requiring no further value ... should be valid"')
    assert.deepEqual(explicit.governedBy!.map(d => `${d.contractId} ${d.declaration}`), ['restated:RPC-001 NON_CLAIMED'], 'decided by the establishing object; GF2\'s gap deferred')
    // Missing: RPC-001 silent, or UNDECLARED (recorded silence) — the gap governs.
    assert.equal(controlLineWithRpc001([]).reason, 'declared gap', '"A field whose value remains missing or unresolved" stays a gap')
    assert.equal(controlLineWithRpc001([{ declaration: 'UNDECLARED', selector: 'type=control' }]).reason, 'declared gap', 'UNDECLARED is not an explicit statement')
    // The production state: RPC-001's own V5 for control is UNDECLARED, so the line is still a declared gap.
    assert.equal(run('GF2 + RPC-001').staged.classified.get('c:restated:RPC-001:RPC-001-18.f::V5').reason, 'declared gap')
    // Only the ruled relationship lets it through: without the deferral, the explicit statement is not enough.
    assert.equal(controlLineWithRpc001([{ declaration: 'NON_CLAIMED', selector: 'type=control' }], true).reason, 'declared gap', 'strict without the ruling')
})

test('the supersession mechanism: written only by a restatement, honoured only where the establishing object is explicit', () => {
    const restated = restateDeclaration(
        { row: 'X', declaration: 'NOT_AUTHORED', selector: '*', scope: 'WHOLE_GAME', note: 'from elsewhere' },
        { contractId: 'G', row: 'X', from: 'NOT_AUTHORED', to: 'NOT_AUTHORED', defersTo: DEFERS_TO_ESTABLISHING_OBJECT, ruling: 'TEST-ONLY', why: 'test' },
    )
    assert.ok(!('refused' in restated))
    assert.equal(restated.defersTo, DEFERS_TO_ESTABLISHING_OBJECT, 'the kind is kept and the deferral recorded')
    const refused = restateDeclaration({ row: 'X', declaration: 'NOT_AUTHORED' }, { contractId: 'G', row: 'X', from: 'NOT_AUTHORED', to: 'NOT_AUTHORED', defersTo: 'ANYONE', ruling: 'TEST-ONLY', why: 'test' })
    assert.ok('refused' in refused, 'a supersession the engine does not know is refused, never applied')

    // A synthetic element established by E, with a general gap from G.
    const cls: ElementClass = {
        classId: 'c:E:1', row: 'X', fromItem: { contractId: 'E', itemId: '1' }, supportedBy: [{ contractId: 'E', itemId: '1' }],
        constraints: { any: true, terms: [] }, cardinality: { min: null, max: null },
    }
    const reach = (contractId: string, declaration: string, extra: Partial<DeclarationReach> = {}): DeclarationReach => ({
        contractId, row: 'X', declaration, scope: 'WHOLE_GAME', preserved: true, selector: '*', parsed: { predicate: { any: true, terms: [] } }, note: '', ...extra,
    })
    const general = reach('G', 'NOT_AUTHORED')
    const deferring = reach('G', 'NOT_AUTHORED', { defersTo: DEFERS_TO_ESTABLISHING_OBJECT })

    // Explicit establishing statement: the general gap stays in force unless it defers.
    assert.equal(reasonFor('X', [reach('E', 'NON_CLAIMED'), general], cls), 'declared gap', 'a general requirement remains applicable')
    assert.equal(reasonFor('X', [reach('E', 'NON_CLAIMED'), deferring], cls), 'not constrained', 'superseded only through the marked relationship')
    // Establishing object silent: nothing is superseded, deferral or not.
    assert.equal(reasonFor('X', [reach('E', 'UNDECLARED'), deferring], cls), 'declared gap', 'silence never overrides')
    assert.equal(reasonFor('X', [deferring], cls), 'declared gap')
    // A non-claim from elsewhere is not a requirement; an exclusion scoped to another object's own involvement does not reach.
    assert.deepEqual(governingDeclarations('X', [reach('E', 'CLAIMED'), reach('G', 'NON_CLAIMED'), reach('G', 'EXCLUDED', { scope: 'OWN_INVOLVEMENT' })], cls).map(d => d.contractId + ' ' + d.declaration), ['E CLAIMED'])
    // An unreadable selector keeps reaching: a requirement is dropped only where it positively does not address the element.
    assert.equal(reasonFor('X', [reach('E', 'NON_CLAIMED'), reach('G', 'EXCLUDED', { selector: 'nonsense', parsed: { defect: 'unreadable' } })], cls), 'excluded')
    // An undetermined establishing statement is not explicit.
    const narrow = { ...cls, constraints: { any: false, terms: [] } }
    const undetermined = reach('E', 'NON_CLAIMED', { selector: 'k=v', parsed: { predicate: { any: false, terms: [{ attribute: 'k', op: '=', value: 'v' }] } } })
    assert.equal(reasonFor('X', [undetermined, reach('G', 'NON_CLAIMED'), general], narrow), 'declared gap')
    assert.equal(governingDeclarations('X', [undetermined, general], narrow).length, 2, 'row-wide: the establishing object did not speak explicitly')
})

// ---------------------------------------------------------------------------------------------
// Added in review, 15 October 2026.
// ---------------------------------------------------------------------------------------------

test('GF4 composed with anything: only tightenings, two Gate A verdicts move NOT_EVALUABLE -> FAIL, each pinned', () => {
    // Measured in review over GF4 with every other corpus object. GF4 alone does not move: its own claims on
    // V8b and V9 already block there. Composed, another object's non-claim had been hiding them.
    const expected: Record<string, { before: string; now: string; gains: string[] }> = {
        GF4: { before: 'FAIL', now: 'FAIL', gains: [] },
        'GF4 + GF2': { before: 'NOT_EVALUABLE', now: 'FAIL', gains: ['c:blind:GF4:I17::V8b', 'c:blind:GF4:I17::V9'] },
        // `before` NOT_EVALUABLE -> FAIL on 15 October 2026 (C49): the gate's own place is a declared gap row-wide too
        // now ("not yet authored", his 16 October item 8), so the row-wide reading fails on it as well. The gains are
        // unchanged; the C49 tightening itself is pinned in its own test above.
        'GF4 + Pass Combination Gate': { before: 'FAIL', now: 'FAIL', gains: ['c:blind:GF4:I17::V8b', 'c:blind:GF4:I17::V9'] },
        'GF4 + RPC-001': { before: 'FAIL', now: 'FAIL', gains: ['c:blind:GF4:I17::V8b', 'c:blind:GF4:I17::V9'] },
        'GF4 + Wide Zone': { before: 'FAIL', now: 'FAIL', gains: ['c:blind:GF4:I17::V8b'] },
        'GF4 + A01-02': { before: 'FAIL', now: 'FAIL', gains: ['c:blind:GF4:I17::V9'] },
        'GF4 + Neutral': { before: 'FAIL', now: 'FAIL', gains: [] },
        'GF4 + Variable Target': { before: 'FAIL', now: 'FAIL', gains: ['c:restated:VARIABLE-TARGET-CONDITION:VARTARGET-13.a::V20'] },
    }
    for (const [name] of GF4_COMPOSITIONS) {
        const r = run(name)
        const now = r.staged.gates.gateA
        const before = gateAsBefore(r)
        assert.equal(before.verdict, expected[name].before, `${name}: Gate A row-wide`)
        assert.equal(now.verdict, expected[name].now, `${name}: Gate A under the rule`)
        const blockers = (g: any) => (g.checks.find((c: any) => c.checkId === 'GA-NO-FAILED-LINE')?.subjects ?? []) as string[]
        assert.deepEqual(blockers(before).filter(id => !blockers(now).includes(id)), [], `${name}: no blocker is lost`)
        assert.deepEqual(blockers(now).filter(id => !blockers(before).includes(id)).sort(), expected[name].gains, `${name}: blockers gained`)
        // The only other check that may move is GA-NO-FAILED-LINE itself, from PASS to FAIL.
        const verdicts = (g: any) => Object.fromEntries(g.checks.filter((c: any) => c.checkId !== 'GA-NO-FAILED-LINE').map((c: any) => [c.checkId, c.verdict]))
        assert.deepEqual(verdicts(now), verdicts(before), `${name}: no other check moves`)
    }
})

/** One line of GF2 + RPC-001 over a DEEP COPY of the knowledge with RPC-001's and GF2's V5 statements replaced. */
function v5Under(gf2: Record<string, unknown>[], rpc001: Record<string, unknown>[]): ClassifiedLine {
    const input = compose(['restated:GF2', 'restated:RPC-001'])
    input.contracts = JSON.parse(JSON.stringify(input.contracts)) // the loader's objects are shared (brief rule 0.7)
    const setV5 = (contractId: string, declarations: Record<string, unknown>[]) => {
        const contract: any = input.contracts.find(c => c.contractId === contractId)
        contract.declarations = [
            ...contract.declarations.filter((d: any) => String(d.row) !== 'V5'),
            ...declarations.map(d => ({ row: 'V5', scope: 'WHOLE_GAME', note: 'TEST-ONLY construction', ...d })),
        ]
    }
    setV5('restated:GF2', gf2)
    setV5('restated:RPC-001', rpc001)
    const staged: any = runStages0to10(input)
    return staged.classified.get('c:restated:RPC-001:RPC-001-18.f::V5') as ClassifiedLine
}

test('silence never overrides, constructed: a general NOT_AUTHORED, EXCLUDED or CLAIMED governs wherever the establishing object is silent or UNDECLARED', () => {
    // RPC-001-18.f establishes a control condition (type=control). On deep copies its V5 statement is removed
    // entirely, or left as UNDECLARED, and GF2's general statement on V5 is each requirement kind in turn.
    const kinds: [string, ReasonCode][] = [['NOT_AUTHORED', 'declared gap'], ['EXCLUDED', 'excluded'], ['CLAIMED', 'claimed but unresolved']]
    for (const [kind, code] of kinds) {
        const general = { declaration: kind, selector: '*' }
        const silent = v5Under([general], [])
        assert.equal(silent.verdict, 'NOT_AUTHORED', `${kind}: the line is still unauthored`)
        assert.equal(silent.reason, code, `${kind}: RPC-001 says nothing, so GF2's ${kind} governs`)
        assert.ok(silent.governedBy!.some(g => g.contractId === 'restated:GF2' && g.declaration === kind), `${kind}: and decided it`)

        const undeclared = v5Under([general], [{ declaration: 'UNDECLARED', selector: 'type=control' }])
        assert.equal(undeclared.reason, code, `${kind}: RPC-001's UNDECLARED is recorded silence, not a statement`)
        assert.ok(undeclared.governedBy!.some(g => g.contractId === 'restated:GF2' && g.declaration === kind), `${kind}: GF2 still decides`)

        // Explicit establishing statement: the general requirement STAYS in force (it reaches the class).
        const explicit = v5Under([general], [{ declaration: 'NON_CLAIMED', selector: 'type=control' }])
        assert.ok(explicit.governedBy!.some(g => g.contractId === 'restated:GF2' && g.declaration === kind), `${kind}: a general requirement remains applicable`)
        assert.equal(explicit.reason, reasonFor('V5', [
            { contractId: 'E', row: 'V5', declaration: 'NON_CLAIMED', scope: null, preserved: true, selector: '*', parsed: { predicate: { any: true, terms: [] } }, note: '' },
            { contractId: 'G', row: 'V5', declaration: kind, scope: null, preserved: true, selector: '*', parsed: { predicate: { any: true, terms: [] } }, note: '' },
        ]), `${kind}: decided by AM-23 over both, unchanged`)
    }
})

test('an unparseable general selector keeps reaching; a FALSE one is the only kind the explicit statement sets aside', () => {
    const explicitNonClaim = [{ declaration: 'NON_CLAIMED', selector: 'type=control' }]
    for (const [kind, code] of [['NOT_AUTHORED', 'declared gap'], ['EXCLUDED', 'excluded']] as [string, ReasonCode][]) {
        const unreadable = v5Under([{ declaration: kind, selector: 'nonsense=1' }], explicitNonClaim)
        assert.equal(unreadable.reason, code, `${kind} with an unreadable selector: still in force`)
    }
    // The rule does bite, and only where the general statement positively addresses another element...
    assert.equal(v5Under([{ declaration: 'NOT_AUTHORED', selector: 'type=origin' }], explicitNonClaim).reason, 'not constrained')
    // ...and only where the establishing object speaks: silent, the whole row decides, selectors unread.
    assert.equal(v5Under([{ declaration: 'NOT_AUTHORED', selector: 'type=origin' }], []).reason, 'declared gap')
    assert.equal(v5Under([{ declaration: 'NOT_AUTHORED', selector: 'type=origin' }], [{ declaration: 'UNDECLARED', selector: 'type=control' }]).reason, 'declared gap')
})

test("the establishing object's own requirement with an undetermined reach is not dropped by its explicit statement elsewhere", () => {
    // Review fix, 15 October 2026. The implementation took general requirements only from OTHER objects, so the
    // establishing object's own NOT_AUTHORED whose selector cannot be decided against the element vanished the
    // moment that object said something explicit — a requirement dropped with nothing superseding it.
    const narrow: ElementClass = {
        classId: 'c:E:1', row: 'X', fromItem: { contractId: 'E', itemId: '1' }, supportedBy: [{ contractId: 'E', itemId: '1' }],
        constraints: { any: false, terms: [] }, cardinality: { min: null, max: null },
    }
    const d = (declaration: string, parsed: DeclarationReach['parsed'], selector = '*'): DeclarationReach => ({
        contractId: 'E', row: 'X', declaration, scope: 'WHOLE_GAME', preserved: true, selector, parsed, note: '',
    })
    const any = { predicate: { any: true, terms: [] } }
    const undetermined = { predicate: { any: false, terms: [{ attribute: 'k', op: '=', value: 'v' }] } } as DeclarationReach['parsed']
    assert.equal(reaches(undetermined.predicate!, narrow), 'UNDETERMINED', 'the construction is what it says')
    assert.equal(reasonFor('X', [d('NON_CLAIMED', any), d('NOT_AUTHORED', undetermined, 'k=v')], narrow), 'declared gap')
    assert.equal(reasonFor('X', [d('NON_CLAIMED', any), d('EXCLUDED', { defect: 'unreadable' }, 'nonsense')], narrow), 'excluded')
    // Its own requirement about ANOTHER element is still set aside.
    const elsewhere = { predicate: { any: false, terms: [{ attribute: 'k', op: '=', value: 'v' }] } } as DeclarationReach['parsed']
    const fixed: ElementClass = { ...narrow, constraints: { any: false, terms: [{ attribute: 'k', op: '=', value: 'w' }] } as any }
    assert.equal(reaches(elsewhere.predicate!, fixed), 'FALSE', 'the construction is what it says')
    assert.equal(reasonFor('X', [d('NON_CLAIMED', any), d('NOT_AUTHORED', elsewhere, 'k=v')], fixed), 'not constrained')
})

test("a supporting object's own-involvement declaration does not reach a class it only supports, so it cannot switch the precedence on", () => {
    // Review fix, 15 October 2026. Class formed by F and supported by S. S's OWN_INVOLVEMENT non-claim does not reach
    // it (own involvement is the classes an object FORMS, scope.ts), yet it counted as S speaking explicitly, which
    // dropped G's gap whose selector is FALSE for the class: "declared gap" relaxed to "not constrained" through a
    // statement that never addressed the element. With no explicit statement the whole row decides.
    const cls: ElementClass = {
        classId: 'c:F:1', row: 'X', fromItem: { contractId: 'F', itemId: '1' }, supportedBy: [{ contractId: 'F', itemId: '1' }, { contractId: 'S', itemId: '9' }],
        constraints: { any: false, terms: [{ attribute: 'k', op: '=', value: 'w' }] } as any, cardinality: { min: null, max: null },
    }
    const any = { predicate: { any: true, terms: [] } }
    const notThisOne = { predicate: { any: false, terms: [{ attribute: 'k', op: '=', value: 'v' }] } } as DeclarationReach['parsed']
    const supporter: DeclarationReach = { contractId: 'S', row: 'X', declaration: 'NON_CLAIMED', scope: 'OWN_INVOLVEMENT', preserved: true, selector: '*', parsed: any, note: '' }
    const gap: DeclarationReach = { contractId: 'G', row: 'X', declaration: 'NOT_AUTHORED', scope: 'WHOLE_GAME', preserved: true, selector: 'k=v', parsed: notThisOne, note: '' }
    assert.equal(reaches(notThisOne.predicate!, cls), 'FALSE')
    assert.equal(governingDeclarations('X', [supporter, gap], cls).length, 2, 'not explicit: the whole row decides')
    assert.equal(reasonFor('X', [supporter, gap], cls), 'declared gap', 'and nothing relaxes')
    // The same statement scoped to the whole game DOES reach, and then the precedence applies as designed.
    assert.equal(reasonFor('X', [{ ...supporter, scope: 'WHOLE_GAME' }, gap], cls), 'not constrained')
})

test('every deferral the engine loads traces to a ruled declaration restatement', () => {
    // Durable form of "the supersession set is data and only a ruling writes it": it still holds once he rules and
    // the set is no longer empty. A deferral written straight into the contracts, or into a declaration a ruling
    // ADDS (which bypasses restateDeclaration's check), would be honoured without a restatement naming it.
    const restatements = JSON.parse(fs.readFileSync(path.join(CONFORMANCE_DIR, 'stage-b/corpus-restatements.json'), 'utf8').replace(/^﻿/, ''))
    const ruled = new Set((restatements.declarations ?? []).filter((d: any) => 'defersTo' in d).map((d: any) => `${d.contractId}|${d.row}|${d.to}|${d.defersTo}`))
    for (const added of restatements.declarationsAdded ?? []) assert.ok(!('defersTo' in added.declaration), `${added.contractId} ${added.ruling}: an added declaration may not carry a deferral`)
    const corpus = run('corpus')
    for (const d of corpus.staged.scope.declarations as DeclarationReach[]) {
        if (d.defersTo === undefined) continue
        assert.ok(ruled.has(`${d.contractId}|${d.row}|${d.declaration}|${d.defersTo}`), `${d.contractId} ${d.row}: a deferral no ruling wrote`)
    }
})

console.log(`governing declarations: ${passed} passed`)
