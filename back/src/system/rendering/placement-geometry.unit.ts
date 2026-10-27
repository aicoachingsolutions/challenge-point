/**
 * **A region is never said to lie where the realized game does not put it** — E5a, 27 October 2026 (the engine design's section 8, made
 * unconditional by the review's S11; Step 0 case e3).
 *
 * Step 0 measured a TEST-ONLY realized end zone in a game whose teams hold no role (so the target-zone sentence has no noun for either team)
 * served with "Mark a zone along the touchline, 6 m long and up to 30 m wide", fidelity 0, while the Coach Overview and the diagram put each
 * zone at an end. The renderer's fallback placed every region it reached "along the touchline", and every line "on the end line itself" or
 * among "both end lines", whatever the game realized. Since E5a each placement is read from the realized intervals, and a region whose
 * geometry does not match is not said at all, so fidelity refuses the activity (Q5: a region with no marking instruction). No new coach
 * words: the no-role end-zone sentence waits on his decision (D5), so such a game is refused, never served with a false sentence.
 *
 * Three cases, each TEST-ONLY and each a copy in memory (no knowledge file is read for writing or changed):
 *   (a) full-width end zones in the no-role possession game, through the real chain (TEST-ONLY depths and the realizer's choices changed on a
 *       copy, the pattern of `realization/target-extents.unit.ts`);
 *   (b) one of two scoring lines moved off its end line, on a copy of the served game's fixture;
 *   (c) the two paired channels moved onto the same touchline, on a copy of the retired specimen fixture.
 * Reverting E5a serves (a) with the false sentence and says (b) "both end lines" and (c) "the opposite touchline" (measured 27 October 2026).
 *
 * Run: npx ts-node --files -r tsconfig-paths/register ./src/system/rendering/placement-geometry.unit.ts
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { LoadedContract } from '../derivation/types'
import { SuppliedRealization } from '../realization/supplied-realization'
import { buildActivityFromKnowledge, RefusedActivity } from './build-activity'
import { checkFidelity } from './fidelity'
import { renderConcreteGame } from './render-concrete-game'
import { specializedRoleNames } from './session-envelope'

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
const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value))

/** Every sentence placing anything along a touchline or on an end line, as the renderer words a placement. */
const PLACEMENT = /touchline|end line itself|both end lines/
const nounPath = (elementId: string) => `space.regions[${elementId}].noun`
const marking = (rendered: ReturnType<typeof renderConcreteGame>, elementId: string) => rendered.instructions.filter(i => i.section === 'Set up' && i.from.includes(nounPath(elementId))).map(i => i.text)
const unmarked = (fixture: any, rendered: ReturnType<typeof renderConcreteGame>) =>
    checkFidelity(fixture, rendered)
        .findings.filter(f => f.question === 5 && f.severity === 'VIOLATION' && f.what.endsWith('has no marking instruction'))
        .map(f => f.what)

/** Moves one region's realized interval on one axis, in both places a fixture holds it (the status geometry the renderer reads, and the game). */
const moveRegion = (fixture: any, elementId: string, axis: 'along' | 'across', interval: { from: number; to: number }) => {
    const entries = (fixture.status.geometry as any[]).filter(g => g.path.includes(`[${elementId}]`) && g.path.endsWith(`.${axis}`))
    assert.ok(entries.length > 0, `the fixture holds the ${axis} geometry of ${elementId}`)
    for (const entry of entries) entry.geometry.interval = { ...interval }
    const region = (fixture.game.space.regions as any[]).find(r => String(r.elementId) === elementId)
    if (region?.realizedGeometry?.position?.[axis]) region.realizedGeometry.position[axis].interval = { ...interval }
}

/* ── (a) full-width end zones in a game whose teams hold no role ─────────────────────────────────────────────────────────────────── */
/** TEST-ONLY depth, never his: where a zone sits is his decision (D3/D5), so nothing here is a value for him. */
const ZONE_TEST_ONLY_M = 6
const depth = (itemId: string, end: 'end-near' | 'end-far') => ({
    itemId,
    row: 'S5',
    selector: `functions CONTAINS objective-area & longitudinal=${end}`,
    requirement: 'RANGE',
    value: `TEST-ONLY depth of the ${end} target`,
    typedBound: { min: ZONE_TEST_ONLY_M, max: ZONE_TEST_ONLY_M },
    strictness: 'REQUIRED',
    valueStatus: 'REQUIRED_RANGE',
    scope: 'WHOLE_GAME',
    basis: 'OWNER_RULING',
    basisEvidence: 'TEST-ONLY: never production data',
    checkability: 'STRUCTURAL',
    structuralClause: 'whole item',
})
const withDepths = (contracts: LoadedContract[]) => {
    const form = contracts.find(contract => contract.contractId === 'restated:GF2') as any
    form.items.push(depth('TEST-ONLY-NEAR', 'end-near'), depth('TEST-ONLY-FAR', 'end-far'))
}
const asZones = (supplied: SuppliedRealization) => {
    for (const choice of supplied.choices as any[]) {
        if (String(choice.lineId).endsWith('::S3')) choice.value = 'zone'
        if (choice.lineId === 'game::V1') choice.value = 'target_zone_entered'
    }
}

test('(a) a full-width end zone in a game with no role nouns is refused, never served as "a zone along the touchline"', () => {
    const { activity, fixture } = buildActivityFromKnowledge(['GF2'], session, { alter: withDepths, alterSupplied: asZones })
    assert.equal(activity.outcome, 'refused', 'served: the false placement reached the coach')
    const refusal = activity as RefusedActivity
    assert.equal(refusal.stage, 'communication', JSON.stringify(refusal.reasons))
    assert.ok(fixture, 'the realized game travels with the refusal')
    const zones = (fixture as any).game.space.regions.filter((r: any) => r.noun === 'zone').map((r: any) => String(r.elementId))
    assert.equal(zones.length, 2)
    // Each realized zone spans the whole width at one end: it meets both touchlines, so it lies along neither.
    for (const id of zones) {
        const region = (fixture as any).game.space.regions.find((r: any) => String(r.elementId) === id)
        assert.deepEqual(region.realizedGeometry.position.across.interval, { from: 0, to: 30 }, id)
        const along = region.realizedGeometry.position.along.interval
        assert.ok(along.from === 0 || along.to === 40, `${id} lies at an end: ${JSON.stringify(along)}`)
    }
    // Refused for the reason that is true: neither zone is set out (and so its positions reach no sentence). Nothing else.
    assert.deepEqual(
        [...refusal.reasons].sort(),
        [
            ...zones.flatMap(id => [`fidelity Q3: space.regions[${id}].position.across is established by the game and no instruction carries it`, `fidelity Q3: space.regions[${id}].position.along is established by the game and no instruction carries it`]),
            ...zones.map(id => `fidelity Q5: region ${id} exists in the game and has no marking instruction`),
        ].sort(),
    )
    // The renderer, read directly on the realized game: no sentence places a zone along a touchline (or anywhere).
    const rendered = renderConcreteGame(fixture as any)
    for (const id of zones) assert.deepEqual(marking(rendered, id), [], `${id} is not said`)
    assert.ok(!rendered.instructions.some(i => /touchline/.test(i.text)), JSON.stringify(rendered.instructions.map(i => i.text)))
})

/* ── (b) a scoring line moved off its end line ───────────────────────────────────────────────────────────────────────────────────── */
test('(b) a line the game does not put on an end line is not said to be on one, nor one of "both end lines"', () => {
    const { activity, fixture } = buildActivityFromKnowledge(['GF2'], session)
    assert.equal(activity.outcome, 'served', 'the possession game as the knowledge builds it')
    const served = renderConcreteGame(fixture as any)
    assert.ok(served.instructions.some(i => i.text === 'Mark both end lines: they are the scoring lines'), 'production: both lines on the end lines, said together')
    assert.deepEqual(unmarked(fixture, served), [])

    const lines = (fixture as any).game.space.regions.filter((r: any) => r.noun === 'line').map((r: any) => String(r.elementId))
    assert.equal(lines.length, 2)
    const far = lines.find((id: string) => (fixture as any).status.geometry.some((g: any) => g.path.includes(`[${id}]`) && g.path.endsWith('.along') && g.geometry.interval.from === 40))
    const near = lines.find((id: string) => id !== far)
    // TEST-ONLY: the far line moved to the middle of the length, on a copy.
    const moved = copy(fixture) as any
    moveRegion(moved, far, 'along', { from: 20, to: 20 })
    const rendered = renderConcreteGame(moved)
    assert.ok(!rendered.instructions.some(i => /both end lines/.test(i.text)), JSON.stringify(rendered.instructions.map(i => i.text)))
    assert.deepEqual(marking(rendered, far), [], 'the moved line is not said')
    assert.ok(marking(rendered, near).every(text => /on the end line itself/.test(text)) && marking(rendered, near).length === 1, `the line still on its end line is said there: ${JSON.stringify(marking(rendered, near))}`)
    assert.deepEqual(unmarked(moved, rendered), [`region ${far} exists in the game and has no marking instruction`])
})

/* ── (c) the paired channels on one touchline ────────────────────────────────────────────────────────────────────────────────────── */
const SPECIMEN = path.resolve(__dirname, '../../../../docs/audits/historical/a04-concrete-game-fixture-2026-10-07-wide-zone-package.json')

test('(c) a pair is said on "one" and "the opposite" touchline only where the game puts them on opposite touchlines', () => {
    const specimen = JSON.parse(fs.readFileSync(SPECIMEN, 'utf8'))
    const channels = (specimen.game.space.regions as any[]).filter(r => r.noun === 'channel').map(r => String(r.elementId))
    assert.equal(channels.length, 2)
    const asIs = renderConcreteGame(specimen)
    assert.deepEqual(
        channels.map(id => marking(asIs, id).filter(text => PLACEMENT.test(text)).length),
        [1, 1],
        'the specimen as frozen: each channel said on its own touchline',
    )
    // TEST-ONLY: the second channel moved onto the first one's touchline, on a copy.
    const moved = copy(specimen)
    moveRegion(moved, channels[1], 'across', { from: 0, to: 7.5 })
    const rendered = renderConcreteGame(moved)
    for (const id of channels) assert.deepEqual(marking(rendered, id), [], `${id} is not said "one" or "the opposite"`)
    assert.ok(!rendered.instructions.some(i => /touchline/.test(i.text)), JSON.stringify(rendered.instructions.map(i => i.text)))
    assert.deepEqual(unmarked(moved, rendered).sort(), channels.map(id => `region ${id} exists in the game and has no marking instruction`).sort())
})

console.log(`placement-geometry: ${passed} passed`)
if (process.exitCode) console.log('placement-geometry: FAILURES ABOVE')
