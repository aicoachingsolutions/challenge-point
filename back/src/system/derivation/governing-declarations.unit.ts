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
 * in force, silence changes nothing, and the set of authorized supersessions is data and EMPTY — whether any
 * statement in the knowledge is such a relationship is his decision, not ours.
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
    const staged: any = runStages0to10(COMPOSITIONS.find(([n]) => n === name)![1]())
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
    for (const [name] of COMPOSITIONS) {
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

test('the supersession set is data, and it is empty', () => {
    // His decision, not ours (the design's decision 1): nothing in the ruled restatements defers, and no loaded
    // declaration carries a deferral.
    const restatements = JSON.parse(fs.readFileSync(path.join(CONFORMANCE_DIR, 'stage-b/corpus-restatements.json'), 'utf8').replace(/^﻿/, ''))
    assert.deepEqual((restatements.declarations ?? []).filter((d: any) => 'defersTo' in d), [])
    for (const [name] of COMPOSITIONS) {
        assert.deepEqual((run(name).staged.scope.declarations as DeclarationReach[]).filter(d => d.defersTo !== undefined), [], name)
    }
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

console.log(`governing declarations: ${passed} passed`)
