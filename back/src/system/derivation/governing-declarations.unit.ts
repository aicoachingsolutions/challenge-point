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

import { ClassifiedLine, governingDeclarations, nonClaimState, reasonFor } from './classify'
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

/**
 * **The line his 9.9 settles** (C55, stage K1, 15 October 2026). His 16 October reply, item 9 point 9: *"Build-out
 * origin needs no further value: Approved under the narrow authority ruling."* RPC-001 now states it explicitly
 * (NON_CLAIMED, NO_FURTHER_VALUE, `type=origin`), so this line is decided by that statement alone wherever GF2's
 * deferring gap would otherwise govern — a move between the row-wide reading and the rule that is his ruling at work,
 * not a relaxation the rule found. It is the ONE line exempted below, and every exemption names it.
 */
const ORIGIN_VALUE = 'c:restated:RPC-001:RPC-001-18.a::V6'

test('corpus-wide, exactly five lines move, each as the design analysis predicted — and, since C55, the origin line his 9.9 settles', () => {
    // 30 lines are decided from declarations (derivation-stage10 pins the count, unchanged by this rule).
    // 30 -> 29 on 15 October 2026 (C51): RPC-001-11.a::J2 was one of them ('excluded' corpus-wide). His reply of that
    // day (9.5, "Retire the redundant separate scoring objective: Approved, provided the live attacking objective
    // remains represented") retired the objective it belonged to, so the line no longer exists. It never moved here.
    // 29 -> 27 on 15 October 2026 (stage K1, C57): RPC-001-18.f::V5 and 19.a::V5 — the referents of the control
    // condition and the long-clearance exclusion — are no longer decided from declarations: his M8 (17 October,
    // "Apply the qualifying conditions to the target and scoring episode actually being evaluated") types each as
    // the objective reference of the scoring team, so both lines are derived. Pinned in typed-referent.unit.ts.
    // 27 -> 28 on 23 October 2026 (stage B): register version 17 adds row O6 (the way a set-out object faces); the transition game's
    // object (c:blind:GF4:I02) gains one line no item speaks for, decided from declarations as 'no coverage'. It never moves here.
    // 28 -> 29 on 23 October 2026 (stage D): register version 18 adds the game-level row B10 (whether the teams change ends); game::B10
    // is a line no item speaks for, decided from declarations as 'no coverage'. It never moves here.
    // 29 -> 30 on 26 October 2026 (Stage F): register version 20 adds row O7 (the specialized performer whose team defends an object); the
    // transition game's object (c:blind:GF4:I02) gains one line no item speaks for, decided from declarations as 'no coverage'. It never moves here.
    // 30 -> 36 on 23 October 2026 (H3): register version 21 adds row S7 (the object a region is bound to); each of the corpus's six region
    // classes gains one line no item speaks for, decided from declarations as 'no coverage'. None moves here.
    const corpus = run('corpus')
    assert.equal(corpus.reasons.size, 36)
    assert.deepEqual(moves(corpus), [
        // An exclusion scoped to Wide Zone's OWN involvement had been relabelling regions it never addressed.
        'c:blind:GF4:I03::S4: excluded -> not constrained',
        // Another object's gap whose selector is FALSE for the element had been reported over the establishing
        // object's own claim. Both codes block: the line is attributed to the object that actually requires it.
        'c:blind:GF4:I17::V9: declared gap -> claimed but unresolved',
        'c:restated:GF2:GF2-03.e::S4: excluded -> not constrained',
        'c:restated:GF2:GF2-03.f::S4: excluded -> not constrained',
        // C55 (stage K1): RPC-001's explicit "no further value" for the origin, under C50's deferral. Corpus-wide it
        // reads 'excluded', not 'not constrained': the Neutral Player Condition's own EXCLUDED * on V6 is a general
        // requirement and stays in force, outranking the non-claim under AM-23.
        `${ORIGIN_VALUE}: declared gap -> excluded`,
        'c:restated:VARIABLE-TARGET-CONDITION:VARTARGET-13.a::V20: declared gap -> claimed but unresolved',
    ])
})

test('no blocking line becomes non-blocking, in the corpus or in any composition — except the origin line his 9.9 settles (C55)', () => {
    // Re-pointed 15 October 2026 (stage K1). The rule itself relaxes nothing; the one line that moves from blocking
    // to non-blocking does so because RPC-001 now SAYS, explicitly, that it needs no further value (C55), and C50's
    // deferral — his Option A — is the authorized relationship that lets the establishing object's explicit
    // statement govern. Pinned by name so nothing else can join it unnoticed.
    for (const [name] of [...COMPOSITIONS, ...GF4_COMPOSITIONS]) {
        const relaxed = [...run(name).reasons.entries()].filter(([, [now, before]]) => BLOCKING.includes(before) && !BLOCKING.includes(now)).map(([lineId]) => lineId)
        const expected = name === 'corpus' || name.includes('RPC-001') ? [ORIGIN_VALUE] : []
        assert.deepEqual(relaxed, expected, `${name}: a requirement that blocked still blocks`)
    }
})

test('Gate A check verdicts are unchanged everywhere; the blockers the rule exposed are pinned (RPC-001-11.a::J2 was one, until C51 retired it)', () => {
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
        // **15 October 2026 (stage K1, C55): one check moves, in one composition, and it is his 9.9.** In GF2 + RPC-001
        // the origin's value line was the last line GA-NO-FAILED-LINE failed on once C57 typed the two referents; read
        // row-wide it is a declared gap, read by the rule it is RPC-001's explicit "no further value". Measured: no
        // other check moves anywhere, and Gate A stays FAIL (GA-EPISODE-REACHABLE).
        const moved = name === 'GF2 + RPC-001' ? { 'GA-NO-FAILED-LINE': ['FAIL', 'PASS'] } : {}
        for (const [checkId, [was, is]] of Object.entries(moved)) {
            assert.deepEqual([verdicts(before)[checkId], verdicts(now)[checkId]], [was, is], `${name}: ${checkId} moves as pinned`)
        }
        const rest = (g: any) => Object.fromEntries(Object.entries(verdicts(g)).filter(([checkId]) => !(checkId in moved)))
        assert.deepEqual(rest(now), rest(before), `${name}: no other check verdict moves`)

        const blockers = (g: any) => g.checks.find((c: any) => c.checkId === 'GA-NO-FAILED-LINE').subjects as string[]
        const added = blockers(now).filter(id => !blockers(before).includes(id))
        const removed = blockers(before).filter(id => !blockers(now).includes(id))
        // Re-pointed 15 October 2026 (stage K1): the origin line is the one blocker the rule sets aside, by C55 alone.
        assert.deepEqual(removed, name === 'corpus' || name.includes('RPC-001') ? [ORIGIN_VALUE] : [], `${name}: no blocker is lost but the origin line his 9.9 settles`)
        // The context's objective claimed its own target and nothing resolved it. GF2's non-claim on REPRESENTATIVE
        // objectives — whose selector is FALSE for a PRIMARY_SCORING one — had been hiding that claim.
        // **Re-pointed 15 October 2026 (C51).** That gain, RPC-001-11.a::J2 in both GF2 + RPC-001 compositions, is
        // gone with the line: his 9.5 retired the context's separate objective ("Approved, provided the live attacking
        // objective remains represented"; the proviso is measured in derivation-stage11.unit.ts). The rule exposed a
        // real blocker; the knowledge then removed the redundant objective that carried it.
        const gains = name === 'GF2 + Variable Target' ? ['c:restated:VARIABLE-TARGET-CONDITION:VARTARGET-13.a::V20'] : []
        assert.deepEqual(added, gains, `${name}: blockers gained`)
    }
})

/** C55's declaration and C57's two items taken off a deep copy: the knowledge as it stood before stage K1. */
const withoutK1 = (contracts: any[]) => {
    for (const contract of contracts) {
        contract.declarations = (contract.declarations ?? []).filter((d: any) => d.qualifier === undefined)
        contract.items = (contract.items ?? []).filter((i: any) => !['RPC-001-18.h', 'RPC-001-19.c'].includes(i.itemId))
    }
}

test('silence never overrides: RPC-001\'s control, exclusion and origin lines were declared gaps decided row-wide, and move only by what his rulings made explicit', () => {
    // RPC-001 said nothing explicit about these (its control/exclusion place is UNDECLARED, "Referents never
    // examined", and nothing of its own reached the origin's value), so GF2's general gap governed. His answer 9
    // did not unblock A01; only explicit knowledge about these details could.
    //
    // **Re-pointed 15 October 2026 (stage K1).** That explicit knowledge now exists, written by his rulings and by
    // nothing else: C57 (his M8) types the two referents, so those lines are DERIVED, and C55 (his 9.9) states that
    // the origin's value needs no further value, so that line is decided by that statement alone. On a copy without
    // the two rulings the three lines are exactly what they were — declared gaps over the whole row.
    for (const name of ['GF2 + RPC-001', 'GF2 + RPC-001 + A01-02']) {
        const r = run(name)
        for (const lineId of ['c:restated:RPC-001:RPC-001-18.f::V5', 'c:restated:RPC-001:RPC-001-19.a::V5']) {
            assert.equal((r.staged.classified.get(lineId) as ClassifiedLine).verdict, 'RESOLVED:ENTAILED', `${name} ${lineId}: derived from C57`)
        }
        const origin = r.staged.classified.get(ORIGIN_VALUE) as ClassifiedLine
        assert.equal(origin.reason, 'not constrained', `${name}: the origin's value needs no further value`)
        assert.deepEqual(origin.governedBy, [{ contractId: 'restated:RPC-001', declaration: 'NON_CLAIMED', selector: 'type=origin', qualifier: 'NO_FURTHER_VALUE' }], `${name}: decided by C55 alone`)

        const before = stagedOver(COMPOSITIONS.find(([n]) => n === name)![1], withoutK1)
        for (const lineId of ['c:restated:RPC-001:RPC-001-18.f::V5', 'c:restated:RPC-001:RPC-001-19.a::V5', ORIGIN_VALUE]) {
            const line = before.classified.get(lineId) as ClassifiedLine
            assert.equal(line.reason, 'declared gap', `${name} ${lineId}, without C55 and C57`)
            const rowWide = before.scope.declarations.filter((d: DeclarationReach) => d.row === lineId.slice(lineId.lastIndexOf('::') + 2))
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

test('Option A moves exactly the origin line since C55, and nothing else, in the corpus or any composition (the four deferrals stripped)', () => {
    // Measured by probe on 15 October 2026 before this test was written (the design analysis predicted it): with C49
    // in place, Option A's four deferrals change no line anywhere. They are not idle — the constructed cases below
    // show each one bite — but no object in the corpus speaks explicitly about V3-V6 where GF2's gap reaches today
    // except the gate, whose own statement is now a gap too.
    //
    // **Re-pointed 15 October 2026 (stage K1): "moves nothing" -> "moves exactly 18.a::V6".** C55 is the first statement
    // that speaks explicitly about V3-V6 where GF2's gap reaches, and it is exactly what his Option A was approved for:
    // *"A context may explicitly establish that a particular scoring-condition detail requires no additional value."*
    // Wherever GF2's deferring gap reaches the origin's value, stripping the deferral puts the gap back; and in GF2 +
    // RPC-001, where it is the last blocker, GA-NO-FAILED-LINE with it. Nothing else moves (measured).
    const ORIGIN_MOVE = (now: string) => `${ORIGIN_VALUE}: NOT_AUTHORED/declared gap -> NOT_AUTHORED/${now}`
    const expected: Record<string, string[]> = {
        corpus: [ORIGIN_MOVE('excluded')],
        'GF2 + RPC-001': ['Gate A GA-NO-FAILED-LINE: FAIL -> PASS', ORIGIN_MOVE('not constrained')],
        'GF2 + RPC-001 + A01-02': [ORIGIN_MOVE('not constrained')],
    }
    for (const [name, make] of [...COMPOSITIONS, ...GF4_COMPOSITIONS, ...PCG_COMPOSITIONS]) {
        assert.deepEqual(differences(stagedOver(make, stripDeferrals), stagedOver(make, () => undefined)), expected[name] ?? [], `${name}: what Option A moves`)
    }
})

test('WHY C49 had to land with Option A, on a TEST-ONLY copy without it: the deferral read the gate\'s non-claim as "count anywhere" — until the K1 tightening, which closes it in the mechanism too', () => {
    // The gate's V5 put back to C45's NON_CLAIMED on a copy. With the four deferrals, the possession game's gap
    // steps aside for the gate's explicit statement, and that statement is a non-claim: the gate's condition would
    // count passes anywhere — exactly the reading his 16 October item 8 rejected ("removing 'in their half' should not
    // automatically be interpreted as authorizing pass counting anywhere"). Without the deferrals, or with C49, it
    // stays a declared gap. The demonstration-level consequence (structure -> communication) is pinned in
    // activity-review.unit.ts.
    //
    // **Re-pointed 15 October 2026 (stage K1): since the deferral tightening the MECHANISM closes this too.** A ruled
    // deferral now steps aside only for a statement that specifies (classify.ts, recorded beside C50), and C45's
    // non-claim was a legacy one: it said only that the gate does not constrain its place. So without C49 the line
    // stays a declared gap — measured, the design analysis predicted it — and the "count anywhere" reading cannot
    // come back through an unqualified non-claim. It comes back only through a statement that the place needs no
    // further value (the third column, a TEST-ONLY qualifier on the copy): exactly the explicit statement his item 8
    // says a context MAY make, and that nobody has made for the gate.
    const line = `c:${GATE}:PCG-02::V5`
    const qualifiedAsBeforeC49 = (contracts: any[]) => {
        gateV5AsBeforeC49(contracts)
        contracts.find(c => c.contractId === GATE).declarations.find((d: any) => d.row === 'V5').qualifier = 'NO_FURTHER_VALUE' // TEST-ONLY
    }
    const expected: Record<string, [string, string, string, string]> = {
        // [with C49 and Option A, without C49 but with Option A, without C49 qualified NO_FURTHER_VALUE (TEST-ONLY), without C49 and without Option A]
        corpus: ['declared gap', 'declared gap', 'excluded', 'declared gap'],
        'GF2 + Pass Combination Gate': ['declared gap', 'declared gap', 'not constrained', 'declared gap'],
        'GF2 + Neutral + Pass Combination Gate': ['declared gap', 'declared gap', 'not constrained', 'declared gap'],
    }
    for (const [name, make] of [...COMPOSITIONS, ...PCG_COMPOSITIONS].filter(([n]) => n in expected)) {
        const now = stagedOver(make, () => undefined)
        const withoutC49 = stagedOver(make, gateV5AsBeforeC49)
        const qualified = stagedOver(make, qualifiedAsBeforeC49)
        const neither = stagedOver(make, contracts => (gateV5AsBeforeC49(contracts), stripDeferrals(contracts)))
        assert.deepEqual([now, withoutC49, qualified, neither].map(s => s.classified.get(line).reason), expected[name], name)
        // Without C49 nothing moves at all now; only the qualified statement moves that line (and the checks it feeds).
        assert.deepEqual(differences(now, withoutC49), [], name)
        assert.deepEqual(differences(now, qualified).filter(d => !d.startsWith('Gate A')), [`${line}: NOT_AUTHORED/declared gap -> NOT_AUTHORED/${expected[name][2]}`], name)
    }
    const gf2Gate = stagedOver(() => compose(['restated:GF2', GATE]), gateV5AsBeforeC49)
    assert.equal(gf2Gate.gates.gateA.verdict, 'FAIL', 'without C49 the gate composition no longer passes Gate A (before the K1 tightening it read DEFERRED_TO_REALIZATION)')
    assert.equal(stagedOver(() => compose(['restated:GF2', GATE]), qualifiedAsBeforeC49).gates.gateA.verdict, 'DEFERRED_TO_REALIZATION', 'only an explicit "no further value" would let it through')
    assert.equal(stagedOver(() => compose(['restated:GF2', GATE]), () => undefined).gates.gateA.verdict, 'FAIL', 'with C49, it does not')
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
            // Since C57 (stage K1, 15 October 2026) RPC-001 authors this referent, so the line is derived and no
            // declaration decides it. The item is taken off the copy, so the declarations alone decide it again.
            rpc.items = rpc.items.filter((i: any) => i.itemId !== 'RPC-001-18.h')
            if (strip) stripDeferrals(contracts)
        },
    )
    return staged.classified.get('c:restated:RPC-001:RPC-001-18.f::V5') as ClassifiedLine
}

test('his item 8 distinction, constructed on copies: an explicit "no further value" is valid, a missing value still blocks — and since M6 "explicit" means QUALIFIED', () => {
    // RPC-001-18.f establishes a control condition (type=control). TEST-ONLY: RPC-001 is made to say, explicitly, that
    // its control condition's place needs no further value — NON_CLAIMED for type=control. Nothing authored says so.
    //
    // **Re-pointed 15 October 2026 (stage K1).** "Explicitly" is now machine-readable: his M6 (17 October) keeps "no
    // further value is required" apart from a non-claim that merely does not constrain, so the TEST-ONLY statement
    // carries the qualifier NO_FURTHER_VALUE. The same statement unqualified is a legacy non-claim and, under the
    // deferral tightening recorded beside C50, no longer sets GF2's gap aside: a declared gap, as below.
    const explicit = controlLineWithRpc001([{ declaration: 'NON_CLAIMED', selector: 'type=control', qualifier: 'NO_FURTHER_VALUE' }])
    assert.equal(explicit.reason, 'not constrained', '"A field explicitly defined as not applicable or requiring no further value ... should be valid"')
    assert.deepEqual(explicit.governedBy!.map(d => `${d.contractId} ${d.declaration} ${d.qualifier}`), ['restated:RPC-001 NON_CLAIMED NO_FURTHER_VALUE'], 'decided by the establishing object; GF2\'s gap deferred')
    assert.equal(nonClaimState(explicit.reason, explicit.governedBy), 'NO_FURTHER_VALUE', 'and the line says which state it is in')
    assert.equal(controlLineWithRpc001([{ declaration: 'NON_CLAIMED', selector: 'type=control' }]).reason, 'declared gap', 'an unqualified non-claim is not "explicitly defined": the gap governs')
    // Missing: RPC-001 silent, or UNDECLARED (recorded silence) — the gap governs.
    assert.equal(controlLineWithRpc001([]).reason, 'declared gap', '"A field whose value remains missing or unresolved" stays a gap')
    assert.equal(controlLineWithRpc001([{ declaration: 'UNDECLARED', selector: 'type=control' }]).reason, 'declared gap', 'UNDECLARED is not an explicit statement')
    // The production state: RPC-001's own V5 for control is UNDECLARED and, since C57, an item authors the referent.
    assert.equal(run('GF2 + RPC-001').staged.classified.get('c:restated:RPC-001:RPC-001-18.f::V5').verdict, 'RESOLVED:ENTAILED', 'derived from C57 (his M8)')
    // Only the ruled relationship lets it through: without the deferral, the explicit statement is not enough.
    assert.equal(controlLineWithRpc001([{ declaration: 'NON_CLAIMED', selector: 'type=control', qualifier: 'NO_FURTHER_VALUE' }], true).reason, 'declared gap', 'strict without the ruling')
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
    // Re-pointed 15 October 2026 (stage K1): the deferral steps aside for a statement that SPECIFIES — a requirement
    // kind or a qualified non-claim — and not for a legacy non-claim, which says only that E does not constrain X.
    const noFurtherValue = reach('E', 'NON_CLAIMED', { qualifier: 'NO_FURTHER_VALUE' })
    assert.equal(reasonFor('X', [noFurtherValue, deferring], cls), 'not constrained', 'superseded only through the marked relationship, by a statement that specifies')
    assert.equal(reasonFor('X', [reach('E', 'NON_CLAIMED'), deferring], cls), 'declared gap', 'an unqualified non-claim does not set the deferral aside')
    assert.equal(reasonFor('X', [reach('E', 'CLAIMED'), deferring], cls), 'claimed but unresolved', 'a requirement kind does — and it still blocks on its own')    // Establishing object silent: nothing is superseded, deferral or not.
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
        // Re-pointed 15 October 2026 (stage K1): with RPC-001 composed, the origin line his 9.9 settles (C55) is the
        // one blocker the rule sets aside; GF4 states nothing that is a requirement on V6, so no deferral is involved.
        assert.deepEqual(blockers(before).filter(id => !blockers(now).includes(id)), name === 'GF4 + RPC-001' ? [ORIGIN_VALUE] : [], `${name}: no blocker is lost but the origin line`)
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
    // The line as it was before C57 (stage K1, 15 October 2026), so the declarations alone decide it.
    const rpc: any = input.contracts.find(c => c.contractId === 'restated:RPC-001')
    rpc.items = rpc.items.filter((i: any) => i.itemId !== 'RPC-001-18.h')
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

// ---------------------------------------------------------------------------------------------
// Stage K1, 15 October 2026 — his M6 (17 October): three states, kept apart.
//
//   *"the machine-readable representation must preserve the distinction between: No further value is required. The
//   value is explicitly unrestricted. A necessary value is missing. These must not collapse into the same operational
//   meaning, even if their current surface representation is similar."*
// ---------------------------------------------------------------------------------------------

/** The origin's statement (C55) on a copy, with its qualifier set to `qualifier` — or removed, for `undefined`. */
const originQualified = (qualifier: string | undefined) => (contracts: any[]) => {
    const statement = contracts.find(c => c.contractId === 'restated:RPC-001').declarations.find((d: any) => d.row === 'V6' && d.selector === 'type=origin')
    assert.ok(statement, 'the copy starts from C55')
    if (qualifier === undefined) delete statement.qualifier
    else statement.qualifier = qualifier
}
const gf2Rpc001 = () => compose(['restated:GF2', 'restated:RPC-001'])

test('M6: three states, three outcomes — no further value passes, missing blocks, unrestricted is refused at load; none reads as another', () => {
    const blockers = (staged: any) => staged.gates.gateA.checks.find((c: any) => c.checkId === 'GA-NO-FAILED-LINE')
    // No further value is required: an established absence. It is not a blocker, and the line says which state it is.
    const now = stagedOver(gf2Rpc001, () => undefined)
    const origin = now.classified.get(ORIGIN_VALUE) as ClassifiedLine
    assert.equal(nonClaimState(origin.reason, origin.governedBy), 'NO_FURTHER_VALUE')
    assert.ok(!blockers(now).subjects.includes(ORIGIN_VALUE))
    assert.equal(blockers(now).verdict, 'PASS', 'the last blocker in GF2 + RPC-001 since C57')
    // A necessary value is missing: the statement taken off the copy — the gap governs and blocks, naming the line.
    const gap = stagedOver(gf2Rpc001, contracts => {
        const rpc = contracts.find(c => c.contractId === 'restated:RPC-001')
        rpc.declarations = rpc.declarations.filter((d: any) => d.qualifier === undefined)
    })
    assert.equal((gap.classified.get(ORIGIN_VALUE) as ClassifiedLine).reason, 'declared gap')
    assert.equal(nonClaimState('declared gap', (gap.classified.get(ORIGIN_VALUE) as ClassifiedLine).governedBy), null, 'missing is never a non-claim state')
    assert.equal(blockers(gap).verdict, 'FAIL')
    assert.deepEqual(blockers(gap).subjects, [ORIGIN_VALUE])
    // The value is explicitly unrestricted: registered, so the state exists and is distinct, but refused at load —
    // the contract that says it is refused whole, so it can never be read as absent, as zero, or as open.
    const unrestricted = stagedOver(gf2Rpc001, originQualified('UNRESTRICTED'))
    const refusal = unrestricted.failures.find((f: any) => f.kind === 'LOAD_REFUSAL' && f.locus?.contractId === 'restated:RPC-001')
    assert.ok(refusal, 'RPC-001 is refused at load')
    assert.ok(String(refusal.detailRef).includes('UNRESTRICTED is registered, but no operational reading of "any value" has been ruled'), String(refusal.detailRef))
    assert.ok(!unrestricted.classified.has(ORIGIN_VALUE), 'and nothing of it reaches a line')
    // A legacy non-claim — the same statement unqualified — is a fourth reading the engine keeps apart from all three:
    // it does not constrain, and it cannot set the ruled deferral aside, so here the gap governs (the qualifier is load-bearing).
    const legacy = stagedOver(gf2Rpc001, originQualified(undefined))
    assert.equal((legacy.classified.get(ORIGIN_VALUE) as ClassifiedLine).reason, 'declared gap')
})

test('M6: a qualifier is registered data, valid only on a non-claim — anything else refuses its contract at load, naming why', () => {
    const reasonOf = (alter: (contracts: any[]) => void) => {
        const staged = stagedOver(gf2Rpc001, alter)
        return staged.failures.filter((f: any) => f.kind === 'LOAD_REFUSAL').map((f: any) => `${f.locus?.contractId}: ${f.detailRef}`).join(' | ')
    }
    assert.match(reasonOf(originQualified('ANY_VALUE_AT_ALL')), /declaration qualifier is not registered/)
    assert.match(
        reasonOf(contracts => {
            const claim = contracts.find(c => c.contractId === 'restated:RPC-001').declarations.find((d: any) => d.row === 'V6' && d.declaration === 'CLAIMED')
            claim.qualifier = 'NO_FURTHER_VALUE'
        }),
        /only a NON_CLAIMED declaration may carry one/,
    )
    assert.equal(reasonOf(() => undefined), '', 'the knowledge as it stands loads whole')
    // Every qualifier the engine loads traces to a ruling that added it; contracts.json carries none.
    const raw = JSON.parse(fs.readFileSync(path.join(CONFORMANCE_DIR, 'stage-b/contracts.json'), 'utf8'))
    assert.ok(!JSON.stringify(raw).includes('"qualifier"'), 'contracts.json carries no qualifier')
    const restatements = JSON.parse(fs.readFileSync(path.join(CONFORMANCE_DIR, 'stage-b/corpus-restatements.json'), 'utf8').replace(/^﻿/, ''))
    const ruled = (restatements.declarationsAdded ?? []).filter((a: any) => 'qualifier' in a.declaration).map((a: any) => `${a.contractId} ${a.declaration.row} ${a.declaration.selector} ${a.declaration.qualifier} ${a.ruling}`)
    assert.deepEqual(ruled, ['restated:RPC-001 V6 type=origin NO_FURTHER_VALUE C55'])
    const loaded = (run('corpus').staged.scope.declarations as DeclarationReach[]).filter(d => d.qualifier !== undefined).map(d => `${d.contractId} ${d.row} ${d.selector} ${d.qualifier}`)
    assert.deepEqual(loaded, ['restated:RPC-001 V6 type=origin NO_FURTHER_VALUE'], 'the one qualifier loaded is C55\'s')
})

test('the deferral tightening (recorded beside C50) moves NOTHING: every reason and Gate A check equals its value under the untightened rule, computed here', () => {
    // The untightened rule let ANY explicit statement set a deferral aside, a legacy non-claim included. Emulated on a
    // copy by qualifying every legacy non-claim NO_FURTHER_VALUE — which changes no reason code (AM-23 reads kinds),
    // only whether a non-claim counts as specifying. Measured the day it landed, and predicted by the design analysis:
    // 0 moves. It closes the C45 hazard in the mechanism, not only in the data.
    const untightened = (contracts: any[]) => {
        for (const contract of contracts) for (const d of contract.declarations ?? []) if (d.declaration === 'NON_CLAIMED' && d.qualifier === undefined) d.qualifier = 'NO_FURTHER_VALUE'
    }
    for (const [name, make] of [...COMPOSITIONS, ...GF4_COMPOSITIONS, ...PCG_COMPOSITIONS]) {
        assert.deepEqual(differences(stagedOver(make, untightened), stagedOver(make, () => undefined)), [], `${name}: the tightening moves nothing`)
    }
})

test('C55 moves exactly the origin line, wherever RPC-001 is composed — and one check, where it was the last blocker', () => {
    // Measured by taking the statement off a copy. His 9.9 settles one field, and nothing else in any composition moves.
    const strip = (contracts: any[]) => {
        for (const contract of contracts) contract.declarations = (contract.declarations ?? []).filter((d: any) => d.qualifier === undefined)
    }
    const ORIGIN_MOVE = (now: string) => `${ORIGIN_VALUE}: NOT_AUTHORED/declared gap -> NOT_AUTHORED/${now}`
    const expected: Record<string, string[]> = {
        corpus: [ORIGIN_MOVE('excluded')],
        'GF2 + RPC-001': ['Gate A GA-NO-FAILED-LINE: FAIL -> PASS', ORIGIN_MOVE('not constrained')],
        'GF2 + RPC-001 + A01-02': [ORIGIN_MOVE('not constrained')],
        'GF4 + RPC-001': [ORIGIN_MOVE('not constrained')],
    }
    for (const [name, make] of [...COMPOSITIONS, ...GF4_COMPOSITIONS, ...PCG_COMPOSITIONS]) {
        assert.deepEqual(differences(stagedOver(make, strip), stagedOver(make, () => undefined)), expected[name] ?? [], `${name}: what C55 moves`)
    }
    // **Added at the K1 review, 15 October 2026: the context alone, which none of the lists above holds.** Measured by
    // probe: there too the origin's line was the last one GA-NO-FAILED-LINE failed on once C57 typed the two referents,
    // so the check moves with it. C55's own record said "no Gate A check verdict moves", which held only without C57;
    // it now names both compositions.
    const alone = () => compose(['restated:RPC-001'])
    assert.deepEqual(differences(stagedOver(alone, strip), stagedOver(alone, () => undefined)), ['Gate A GA-NO-FAILED-LINE: FAIL -> PASS', ORIGIN_MOVE('not constrained')], 'RPC-001 alone: what C55 moves')
    assert.equal(stagedOver(alone, () => undefined).gates.gateA.verdict, 'FAIL', 'RPC-001 alone: Gate A stays FAIL')
    // Gate A stays FAIL where the context is composed with the possession game: the build-out episode cannot begin yet.
    assert.equal(run('GF2 + RPC-001').staged.gates.gateA.verdict, 'FAIL')
    assert.equal(run('GF2 + RPC-001').staged.gates.gateA.checks.find((c: any) => c.checkId === 'GA-EPISODE-REACHABLE').verdict, 'FAIL')
})

console.log(`governing declarations: ${passed} passed`)
