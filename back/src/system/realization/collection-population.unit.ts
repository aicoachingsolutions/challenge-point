/**
 * **One collection, one population** — his instruction of 3 October to repair *"the collection/co-reference/
 * cardinality hole exposed across A01/A02/A05"*.
 *
 * The defect: every existential claim owned a private population. The realizer counted only that claim's own
 * instantiations and checked that claim's maximum against that count alone. So two claims on
 * `performers.teams[]` — `PCG-08` asserting teams exist, and `GF2-14.a` authoring exactly two — were jointly
 * satisfied by **three teams**, one attributed to the first and two to the second, with no objection from
 * either. And the correct population of two was REFUSED whichever way it was attributed, because neither
 * claim saw the other's members.
 *
 * `collectionCardinality` could not cover for it: it is restricted to individuated classes and is empty for
 * `performers.teams[]` corpus-wide.
 *
 * **The repair decides no co-reference question.** It does not rule that the two claims are about the same
 * teams. It stops each claim behaving as though the collection were its own, which is his own ruling:
 * *"multiple source rows do not by themselves entail multiple physical elements."* The owed count is the
 * greatest any single claim requires rather than the sum, and every claim's maximum binds the whole
 * population.
 *
 * **Scope correction recorded here:** the shape is in FIVE goals, not three. There are 13 learning goals
 * (A01 D01 TA01 TD01 A02 D02 TA02 TD02 A03 D03 A04 A05 A06), and `performers.teams[]` carries two claims in
 * A01, TA01, A02, TA02 and A05 — every goal that selects GF2 beside the Pass Combination Gate. A fix list
 * scoped to A01/A02/A05 would have missed two.
 */
import assert from 'node:assert/strict'

import { runDerivation, runStages0to10 } from '../derivation/engine'
import { indexRegister } from '../derivation/register'
import { assembleResolvedGame } from '../derivation/resolved-game'
import { a01CompositionUntil15October } from '../derivation/composition-fixtures'
import { derivationInputFor, GoalSelectionGap, selectFor } from '../derivation/run-bounded-selection'
import { sessionPlanningModel } from '../session-planning/session-planning-model'
import { realize } from './realize'

let passed = 0
const test = (name: string, fn: () => void) => {
    try {
        fn()
        passed++
        console.log(`  ok  ${name}`)
    } catch (error) {
        console.log(`  FAIL ${name}: ${(error as Error).message}`)
        process.exitCode = 1
    }
}

/**
 * The Pass Combination Gate's demonstration composition — the possession game form and the gate, named
 * directly — and the same with Wide Zone Advantage beside them (the contracted part of A01's selection before
 * 14 October). Since that day no Learning Goal selects the gate (his ruling: *"Please keep the current Pass
 * Combination Gate as a mechanism demonstration only"*), so the shape this file repairs — two claims on one
 * collection, the game form's and the gate's — lives only in compositions, and is tested there.
 */
const GATE = ['GF2', 'tl-v0-constraint-pass-combination-gate']
const GATE_WITH_WIDE_ZONE = [...GATE, 'tl-v0-constraint-wide-zone-advantage']
const composed = (ids: string[]) => ({ selected: ids.map((id, i) => ({ id, role: i ? 'constraint' : 'game form' })) })

function resolvedFor(goalOrComposition: string | string[]) {
    const input = derivationInputFor(typeof goalOrComposition === 'string' ? selectFor(goalOrComposition, null) : composed(goalOrComposition))
    const result: any = runDerivation(input)
    const staged: any = runStages0to10(input)
    const index = indexRegister(input.register)
    return { resolved: assembleResolvedGame(result, staged.classes, index, input.contracts) as any, index, input }
}

// ── The shape, and its real extent ────────────────────────────────────────────────────────────────
//
// **Three since 13 October, not five.** The shape needs a goal to load BOTH the possession game form and the
// Pass Combination Gate, each claiming teams. Play Through Pressure now lands on a game form with no
// contract (the context rule) and Attack Quickly no longer selects the gate (its approved Game Problem),
// so each carries one claim. The repair is asserted on every goal that still has the shape.
test('A01 alone carries two claims on one collection (objectives); the A01 composition and the gate compositions carry the shapes', () => {
    const goals: string[] = ((sessionPlanningModel as any).learningGoals?.() ?? []).map((g: any) => g.ID ?? g.id).filter(Boolean)
    assert.equal(goals.length, 13, `the corpus has 13 learning goals, got ${goals.length}: ${goals.join(' ')}`)

    const affected: string[] = []
    const gaps: string[] = []
    for (const goal of goals) {
        let resolved: any
        try {
            resolved = resolvedFor(goal).resolved
        } catch (error) {
            // A knowledge gap (14 October) selects nothing, so it holds no collection.
            if (!(error instanceof GoalSelectionGap)) throw error
            gaps.push(goal)
            continue
        }
        const byPath = new Map<string, number>()
        for (const claim of resolved.existential as any[]) byPath.set(claim.path, (byPath.get(claim.path) ?? 0) + 1)
        if ([...byPath.values()].some(n => n > 1)) affected.push(goal)
    }
    /**
     * **One since 14 October, measured, and on a different collection.** The three goals that had the TEAMS
     * shape (A01, TA02, A05) had it because they selected the gate beside the possession game form; his ruling
     * holds the gate out of every Learning Goal's selection, so no goal has it, and it is asserted on the
     * gate's compositions instead, where the repair below is exercised. A01 is still here for another reason:
     * selection now carries its context, and RPC-001 claims an objective (RPC-001-14.a) beside the game
     * form's (GF2-09.a) — two claims on `objectives[]`, which the same one-population rule governs.
     */
    /**
     * **None since 15 October 2026.** A01 is a knowledge gap that day (its authorization record authorizes no
     * constraint — his item 1), so it reaches no collection. The shape it carried — RPC-001's objective claim beside
     * the game form's — is a property of the context composed with GF2, not of the goal, so it is asserted on the
     * composition A01 selected until then, named (composition-fixtures.ts): the same two claims.
     */
    /**
     * **A01 again, later on 15 October 2026.** His general principle of that day (16 October reply, item 1) lets its
     * evaluated, empty record select GF2 and RPC-001 with no library constraint, so it reaches the collection once
     * more and carries the same two objective claims as its composition (asserted on both).
     */
    assert.deepEqual(affected, ['A01'], `the multi-claim goals, got ${affected.join(', ')}`)
    {
        const objectives = (resolvedFor('A01').resolved.existential as any[]).filter(claim => claim.path === 'objectives[]').map(claim => claim.classId)
        assert.deepEqual(objectives, ['c:restated:GF2:GF2-09.a', 'c:restated:RPC-001:RPC-001-14.a'], "A01 itself: the game form's objective claim and its context's")
    }
    {
        const input = derivationInputFor(a01CompositionUntil15October(null))
        const result: any = runDerivation(input)
        const staged: any = runStages0to10(input)
        const resolved: any = assembleResolvedGame(result, staged.classes, indexRegister(input.register), input.contracts)
        const objectives = (resolved.existential as any[]).filter(claim => claim.path === 'objectives[]').map(claim => claim.classId)
        assert.deepEqual(objectives, ['c:restated:GF2:GF2-09.a', 'c:restated:RPC-001:RPC-001-14.a'], 'the game form\'s objective claim and its context\'s')
    }
    assert.deepEqual(gaps, ['A02', 'D03'], 'the knowledge gaps of 14 October (A01 was one from 15 October until his general principle that day), and no others')
    for (const composition of [GATE, GATE_WITH_WIDE_ZONE]) {
        const teams = (resolvedFor(composition).resolved.existential as any[]).filter(claim => /teams/.test(claim.path))
        assert.equal(teams.length, 2, `${composition.join(' + ')}: two claims on the teams collection`)
    }
})

// ── THE REPAIR, with teeth in both directions ─────────────────────────────────────────────────────
//
// The gate composition's Gate A is NOT_EVALUABLE for reasons unrelated to teams (it was A01's until 14 October), so the authorization is exercised with that
// one gate lifted and nothing else changed. The point is what the cardinality guard says, not whether the game is
// realizable.
function authorize(composition: string[], counts: { pcg: number; gf2: number }) {
    const { resolved, index, input } = resolvedFor(composition)
    const claims = (resolved.existential as any[]).filter(e => /teams/.test(e.path))
    const pcg = claims.find(c => /PASS-COMBINATION-GATE/.test(c.classId))!.classId
    const gf2 = claims.find(c => /GF2-14/.test(c.classId))!.classId
    const lifted = { ...resolved, coherence: { ...resolved.coherence, mayRealize: true } }
    const instantiations = [
        ...Array.from({ length: counts.pcg }, () => ({ classId: pcg, member: {}, because: 'regression probe' })),
        ...Array.from({ length: counts.gf2 }, () => ({ classId: gf2, member: {}, because: 'regression probe' })),
    ]
    const out: any = realize(lifted as any, [], instantiations, index, input.envelope)
    return ((out.because ?? []) as string[]).filter(b => /teams|PCG-08|GF2-14|at most|owes/i.test(b))
}

test('the correct population of two is AUTHORIZED, whichever claim its members are attributed to', () => {
    // Before the repair BOTH of these were refused — the first because PCG-08 saw no members of its own, the
    // second because GF2-14.a saw only one. The correct game was unreachable.
    assert.deepEqual(authorize(GATE, { pcg: 0, gf2: 2 }), [], 'two members on one claim satisfy the collection')
    assert.deepEqual(authorize(GATE, { pcg: 1, gf2: 1 }), [], 'and so does one attributed to each claim')
})

test('three teams are REFUSED, and the refusal counts every claim on the collection', () => {
    const objections = authorize(GATE, { pcg: 1, gf2: 2 })
    assert.equal(objections.length, 1, `exactly one objection, got ${JSON.stringify(objections)}`)
    assert.match(objections[0], /at most 2, and 3 would exist/, objections[0])
    assert.match(objections[0], /counting every claim on this collection/, 'the refusal must say why 3 was counted')
    assert.match(objections[0], /PASS-COMBINATION-GATE:PCG-08/, 'and name the other claim whose members were counted')
})

test('a maximum binds however the surplus is attributed', () => {
    // Four on one claim, and four split — the guard must not care which claim was named.
    assert.match(authorize(GATE, { pcg: 0, gf2: 4 }).join(' '), /at most 2, and 4 would exist/)
    assert.match(authorize(GATE, { pcg: 2, gf2: 2 }).join(' '), /at most 2, and 4 would exist/)
})

test('the repair holds on every affected goal, not just the one it was found on', () => {
    // Re-pointed 14 October from the three goals that selected the gate to its two compositions (see above).
    for (const composition of [GATE, GATE_WITH_WIDE_ZONE]) {
        const label = composition.join(' + ')
        assert.deepEqual(authorize(composition, { pcg: 0, gf2: 2 }), [], `${label}: two teams must be authorized`)
        assert.match(authorize(composition, { pcg: 1, gf2: 2 }).join(' '), /3 would exist/, `${label}: three teams must be refused`)
    }
})

// ── The owed count is the GREATEST a claim requires, not the sum ───────────────────────────────────
test('owed is the greatest single claim requirement, never the sum', () => {
    const { resolved } = resolvedFor(GATE)
    const claims = (resolved.existential as any[]).filter(e => /teams/.test(e.path))
    const shortfalls = claims.map(c => c.shortfall).sort()
    // Both claims owe two since PCG-08's authored "at least 2 teams" was typed under SD-86 (C37). Before that
    // its 2 sat unreadable in prose and the claim owed one, so the joint figure depended on which claim the
    // parser happened to be able to read — which is why typing it mattered beyond the item itself.
    assert.deepEqual(shortfalls, [2, 2], `both claims owe two once PCG-08's authored 2 is typed, got ${shortfalls.join(',')}`)
    assert.equal(claims.find(c => /PCG-08/.test(c.classId))!.cardinality.min, 2, 'PCG-08 contributes its authored minimum')
    assert.equal(claims.find(c => /PCG-08/.test(c.classId))!.cardinality.max, null, 'and no maximum, because none is authored there')
    // Summing would owe FOUR, which is the wrong answer the old per-claim reading produced.
    assert.deepEqual(authorize(GATE, { pcg: 0, gf2: 2 }), [], 'two satisfies max(2,2), not 2+2')
})

// ── A04 is unaffected: one claim, and it still behaves exactly as before ───────────────────────────
test('a collection with a single claim is unchanged', () => {
    const { resolved } = resolvedFor('A04')
    const claims = (resolved.existential as any[]).filter(e => /teams/.test(e.path))
    assert.equal(claims.length, 1, 'A04 carries one team claim')
    assert.equal(claims[0].shortfall, 2)
})

console.log(`collection-population: ${passed} passed`)
if (process.exitCode) console.log('collection-population: FAILURES ABOVE')
