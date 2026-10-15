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

// ---------------------------------------------------------------------------------------------
// Added in review, 15 October 2026.
// ---------------------------------------------------------------------------------------------

test('GF4 composed with anything: only tightenings, two Gate A verdicts move NOT_EVALUABLE -> FAIL, each pinned', () => {
    // Measured in review over GF4 with every other corpus object. GF4 alone does not move: its own claims on
    // V8b and V9 already block there. Composed, another object's non-claim had been hiding them.
    const expected: Record<string, { before: string; now: string; gains: string[] }> = {
        GF4: { before: 'FAIL', now: 'FAIL', gains: [] },
        'GF4 + GF2': { before: 'NOT_EVALUABLE', now: 'FAIL', gains: ['c:blind:GF4:I17::V8b', 'c:blind:GF4:I17::V9'] },
        'GF4 + Pass Combination Gate': { before: 'NOT_EVALUABLE', now: 'FAIL', gains: ['c:blind:GF4:I17::V8b', 'c:blind:GF4:I17::V9'] },
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
