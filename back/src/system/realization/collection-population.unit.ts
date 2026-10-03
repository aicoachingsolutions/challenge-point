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
import { derivationInputFor, selectFor } from '../derivation/run-bounded-selection'
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

function resolvedFor(goal: string) {
    const input = derivationInputFor(selectFor(goal, null))
    const result: any = runDerivation(input)
    const staged: any = runStages0to10(input)
    const index = indexRegister(input.register)
    return { resolved: assembleResolvedGame(result, staged.classes, index, input.contracts) as any, index, input }
}

// ── The shape, and its real extent ────────────────────────────────────────────────────────────────
test('five of the thirteen goals carry two claims on one collection', () => {
    const goals: string[] = ((sessionPlanningModel as any).learningGoals?.() ?? []).map((g: any) => g.ID ?? g.id).filter(Boolean)
    assert.equal(goals.length, 13, `the corpus has 13 learning goals, got ${goals.length}: ${goals.join(' ')}`)

    const affected: string[] = []
    for (const goal of goals) {
        const { resolved } = resolvedFor(goal)
        const byPath = new Map<string, number>()
        for (const claim of resolved.existential as any[]) byPath.set(claim.path, (byPath.get(claim.path) ?? 0) + 1)
        if ([...byPath.values()].some(n => n > 1)) affected.push(goal)
    }
    assert.deepEqual(affected, ['A01', 'TA01', 'A02', 'TA02', 'A05'], `the multi-claim goals, got ${affected.join(', ')}`)
})

// ── THE REPAIR, with teeth in both directions ─────────────────────────────────────────────────────
//
// A01's Gate A is NOT_EVALUABLE for reasons unrelated to teams, so the authorization is exercised with that
// one gate lifted and nothing else changed. The point is what the cardinality guard says, not whether A01 is
// realizable.
function authorize(goal: string, counts: { pcg: number; gf2: number }) {
    const { resolved, index, input } = resolvedFor(goal)
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
    assert.deepEqual(authorize('A01', { pcg: 0, gf2: 2 }), [], 'two members on one claim satisfy the collection')
    assert.deepEqual(authorize('A01', { pcg: 1, gf2: 1 }), [], 'and so does one attributed to each claim')
})

test('three teams are REFUSED, and the refusal counts every claim on the collection', () => {
    const objections = authorize('A01', { pcg: 1, gf2: 2 })
    assert.equal(objections.length, 1, `exactly one objection, got ${JSON.stringify(objections)}`)
    assert.match(objections[0], /at most 2, and 3 would exist/, objections[0])
    assert.match(objections[0], /counting every claim on this collection/, 'the refusal must say why 3 was counted')
    assert.match(objections[0], /PASS-COMBINATION-GATE:PCG-08/, 'and name the other claim whose members were counted')
})

test('a maximum binds however the surplus is attributed', () => {
    // Four on one claim, and four split — the guard must not care which claim was named.
    assert.match(authorize('A01', { pcg: 0, gf2: 4 }).join(' '), /at most 2, and 4 would exist/)
    assert.match(authorize('A01', { pcg: 2, gf2: 2 }).join(' '), /at most 2, and 4 would exist/)
})

test('the repair holds on every affected goal, not just the one it was found on', () => {
    for (const goal of ['A01', 'TA01', 'A02', 'TA02', 'A05']) {
        assert.deepEqual(authorize(goal, { pcg: 0, gf2: 2 }), [], `${goal}: two teams must be authorized`)
        assert.match(authorize(goal, { pcg: 1, gf2: 2 }).join(' '), /3 would exist/, `${goal}: three teams must be refused`)
    }
})

// ── The owed count is the GREATEST a claim requires, not the sum ───────────────────────────────────
test('owed is the greatest single claim requirement, never the sum', () => {
    const { resolved } = resolvedFor('A01')
    const claims = (resolved.existential as any[]).filter(e => /teams/.test(e.path))
    const shortfalls = claims.map(c => c.shortfall).sort()
    assert.deepEqual(shortfalls, [1, 2], `the two claims owe 1 and 2 separately, got ${shortfalls.join(',')}`)
    // Summing would owe three, which is exactly the wrong answer the old reading produced.
    assert.deepEqual(authorize('A01', { pcg: 0, gf2: 2 }), [], 'two satisfies max(1,2), not 1+2')
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
