/**
 * Unit tests — a MECHANISM PROOF: the two target regions of the possession game take SEPARATE extents under ONE
 * primary scoring event of a zone being entered (stage H3, 15 October 2026; synthesis step 10). Test only.
 *
 * Christian, 16 October reply, item 4: *"I therefore favor an intermediate progression reference or target over a
 * distant terminal end zone for this first activity."* — and item 5, for the pressing team after a regain: *"I favor a
 * target area representing successful progression toward a higher attacking player or attacking space"*, reached by
 * *"controlled entry, either by carrying the ball or by passing to a teammate who receives under control."* — and, of
 * both, *"If the existing game form cannot support an intermediate progression target alongside a separate
 * defensive-regain objective, please report that limitation rather than forcing both teams to use the same end-zone
 * scoring structure."*
 *
 * So, before he decides where each target sits (decision D3), this proves the FORM his choices need already exists:
 * each team attacks its own region (ruling C42: GF2-08.c to GF2-03.f, GF2-08.e to GF2-03.e), and the two regions can
 * be realized as zones of DIFFERENT depths under the single event the game holds (SD-06), which RPC-001's approved
 * events admit (RPC-REL-072). Nothing here is a value for him: the depths are TEST-ONLY, written onto a deep COPY of
 * the contracts through the builder's tests-only entries, and the realization choices for the target's noun and the
 * scoring kind are changed on a copy for the same reason. No knowledge file is read for writing or changed.
 *
 * **Reported, not fixed (communication):** the activity built here is served with no fidelity violation, yet its text
 * describes each full-width end zone as "a zone along the touchline" and its scoring sentence speaks of the ball going
 * "across the line it is attacking" — the renderer was written for line targets and does not read the scoring kind,
 * and the fidelity check does not compare the two. Unreachable in production (the possession game's realization
 * choices close both targets as lines), so no coach is served it; it must be repaired before a zone target is used.
 * That is why the assertions below read the realized GAME, never the rendered text.
 *
 * **Re-pointed 27 October 2026 (E5a, `rendering/placement-geometry.unit.ts`):** the renderer no longer places a region along a
 * touchline its realized geometry does not meet, and has no words yet for a zone at an end in a game whose teams hold no role
 * (his decision, D5), so each zone is left unsaid and the activity is REFUSED at communication (fidelity Q5: no marking
 * instruction) instead of served with the false sentence. The mechanism proof stands on the realized game, which travels with the
 * refusal; the scoring sentence's line words are still to repair before a zone target is used, and are not served either.
 *
 * Run: part of `npm test`.
 */
import assert from 'node:assert/strict'

import { buildActivityFromKnowledge, buildActivityOverAlteredKnowledge, RefusedActivity, ServedActivity } from '../rendering/build-activity'
import { specializedRoleNames } from '../rendering/session-envelope'
import { LoadedContract } from '../derivation/types'
import { SuppliedRealization } from './supplied-realization'

let passed = 0
function test(name: string, run: () => void): void {
    try {
        run()
        passed++
        console.log(`  ok  ${name}`)
    } catch (error) {
        console.log(`  FAIL ${name}: ${(error as Error).message}`)
        process.exitCode = 1
    }
}

const none = Object.fromEntries(specializedRoleNames().map(role => [role, 0]))
const session = { players: 12, lengthM: 40, widthM: 30, durationMin: 20, roles: none }

/** TEST-ONLY depths, never his: a shallow region at one end and a deep one at the other, so they cannot coincide. */
const NEAR_TEST_ONLY_M = 6
const FAR_TEST_ONLY_M = 15

/** A TEST-ONLY required depth for the target region at one end, selected exactly as C42's region items select it. */
const depth = (itemId: string, end: 'end-near' | 'end-far', metres: number) => ({
    itemId,
    row: 'S5',
    selector: `functions CONTAINS objective-area & longitudinal=${end}`,
    requirement: 'RANGE',
    value: `TEST-ONLY depth of the ${end} target`,
    typedBound: { min: metres, max: metres },
    strictness: 'REQUIRED',
    valueStatus: 'REQUIRED_RANGE',
    scope: 'WHOLE_GAME',
    basis: 'OWNER_RULING',
    basisEvidence: 'TEST-ONLY: never production data',
    checkability: 'STRUCTURAL',
    structuralClause: 'whole item',
})
const withDepths = (contracts: LoadedContract[]) => {
    const gf2 = contracts.find(contract => contract.contractId === 'restated:GF2') as any
    gf2.items.push(depth('TEST-ONLY-NEAR', 'end-near', NEAR_TEST_ONLY_M), depth('TEST-ONLY-FAR', 'end-far', FAR_TEST_ONLY_M))
}
/** The realizer's choices on a copy: both targets zones, and the game's one event a zone being entered. */
const asZones = (supplied: SuppliedRealization) => {
    for (const choice of supplied.choices as any[]) {
        if (String(choice.lineId).endsWith('::S3')) choice.value = 'zone'
        if (choice.lineId === 'game::V1') choice.value = 'target_zone_entered'
    }
}

const regionsOf = (fixture: any) => fixture.game.space.regions as any[]
const alongOf = (fixture: any, itemId: string) => regionsOf(fixture).find(region => region.elementId === `c:restated:GF2:${itemId}`)?.realizedGeometry?.position?.along
/** E5a: refused at communication for exactly this, each zone unsaid: no marking instruction, so its positions reach no sentence. */
const zonesUnsaid = (activity: ServedActivity | RefusedActivity) => {
    assert.equal(activity.outcome, 'refused', 'served: a zone at an end was said somewhere it is not (E5a)')
    const refusal = activity as RefusedActivity
    assert.equal(refusal.stage, 'communication', JSON.stringify(refusal.reasons))
    const ids = ['GF2-03.e', 'GF2-03.f'].map(itemId => `c:restated:GF2:${itemId}`)
    assert.deepEqual(
        [...refusal.reasons].sort(),
        [
            ...ids.flatMap(id => ['along', 'across'].map(axis => `fidelity Q3: space.regions[${id}].position.${axis} is established by the game and no instruction carries it`)),
            ...ids.map(id => `fidelity Q5: region ${id} exists in the game and has no marking instruction`),
        ].sort(),
    )
}

test('the two target regions take separate extents under one event of a zone being entered', () => {
    const { activity, fixture } = buildActivityFromKnowledge(['GF2'], session, { alter: withDepths, alterSupplied: asZones })
    // Re-pointed 27 October 2026 (E5a): was served, with each zone said "along the touchline"; refused now, the realized game read below.
    zonesUnsaid(activity)
    const game = (fixture as any).game
    // One primary event, one kind, for both teams (SD-06).
    assert.deepEqual(game.value.primaryEvent, { value: 1, kind: 'target_zone_entered' })
    // Each team attacks its own region (C42), exactly as in the game the review page serves today.
    assert.deepEqual(
        game.objectives.map((o: any) => [o.team, o.role, o.reference.structuralRef.itemId]),
        [
            ['TEAM_AT_AXIS_START', 'PRIMARY_SCORING', 'GF2-03.f'],
            ['TEAM_AT_AXIS_END', 'PRIMARY_SCORING', 'GF2-03.e'],
        ],
    )
    // Two zones, each anchored at its own end line and grown inward by its own extent: different intervals.
    assert.deepEqual(regionsOf(fixture).map(region => region.noun), ['zone', 'zone'])
    const near = alongOf(fixture, 'GF2-03.e')
    const far = alongOf(fixture, 'GF2-03.f')
    assert.deepEqual(near.interval, { from: 0, to: NEAR_TEST_ONLY_M })
    assert.deepEqual(far.interval, { from: 40 - FAR_TEST_ONLY_M, to: 40 })
    assert.equal(near.extentBound.term, 'TEST-ONLY depth of the end-near target', 'each extent came from its own item')
    assert.equal(far.extentBound.term, 'TEST-ONLY depth of the end-far target')
    assert.notDeepEqual(near.interval.to - near.interval.from, far.interval.to - far.interval.from, 'the depths differ')
})

test('the same game through the altered-knowledge builder the review chain lends tests', () => {
    // The neutral-players demonstration is the possession game plus neutrals, which touch neither target.
    // Re-pointed 27 October 2026 (E5a): it read each extent from the instruction citing the zone's position, the sentence that said the
    // zone was "along the touchline"; that sentence is not said now, so the same game is refused for the same reason as above, and the
    // extents are proved on the realized game (the first test).
    zonesUnsaid(buildActivityOverAlteredKnowledge({ kind: 'mechanism-demonstration', demonstrationId: 'neutral-players', session }, withDepths, { alterSupplied: asZones }))
})

test('without a depth the zones cannot be set out: where each target sits is his decision (D3), not filled in', () => {
    // The production knowledge with only the realizer's choices changed: no extent is authored (GF2 declares the depth
    // of a zone NOT_AUTHORED), so nothing composes one and the build does not serve a zone of an invented depth.
    // Measured 15 October 2026: refused at validation, the layout and placement checks unable to compare a zone that
    // has no extent — refused, never served at a depth nobody authored.
    const { activity } = buildActivityFromKnowledge(['GF2'], session, { alterSupplied: asZones })
    assert.equal(activity.outcome, 'refused')
    const refusal = activity as any
    assert.equal(refusal.stage, 'validation', JSON.stringify(refusal.reasons))
    assert.ok(
        refusal.reasons.includes('GA-LAYOUT-FEASIBLE — "every geometric extent, open or realized, admits a joint assignment inside the area": NOT_EVALUABLE (a realized placement on c:restated:GF2:GF2-03.e::S5 is not an interval this check can compare)'),
        JSON.stringify(refusal.reasons),
    )
    // And nothing was written: the production game still closes both targets as lines, scored on a line crossed.
    const { fixture: production } = buildActivityFromKnowledge(['GF2'], session)
    assert.deepEqual(regionsOf(production).map(region => region.noun), ['line', 'line'])
    assert.equal((production as any).game.value.primaryEvent.kind, 'line_crossed')
})

console.log(`target-extents: ${passed} passed`)
if (process.exitCode) console.log('target-extents: FAILURES ABOVE')
