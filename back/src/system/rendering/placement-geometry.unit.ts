/**
 * **The renderer's marking sentences place a region along a touchline, or on an end line, only where its realized intervals put it
 * there** — E5a, 27 October 2026 (the engine design's section 8 placement guard, made unconditional now; Step 0 case e3), narrowed after
 * the E5a review the same day.
 *
 * Which mechanism: the design review (its S11) suggested making the design's fidelity Q5 placement CLAUSE unconditional. E5a does not add
 * that clause: it guards the one source of the false sentences, the renderer's marking fallback, which reads the realized geometry rather
 * than words, and leaves an unmatched region unsaid so the existing Q5 marking check refuses the activity.
 *
 * Step 0 measured a TEST-ONLY realized end zone in a game whose teams hold no role (so the target-zone sentence has no noun for either team)
 * served with "Mark a zone along the touchline, 6 m long and up to 30 m wide", fidelity 0, while the Coach Overview and the diagram put each
 * zone at an end. The renderer's fallback placed every region it reached "along the touchline", and every line "on the end line itself" or
 * among "both end lines", whatever the game realized. Since E5a each placement is read from the realized intervals, and a region whose
 * geometry does not match is not said at all, so fidelity refuses the activity (Q5: a region with no marking instruction). No new coach
 * words: the no-role end-zone sentence waits on his decision (D5), so such a game is refused, never served with a false sentence.
 *
 * What is guaranteed, and only for those sentences ("along the touchline", "along one / the opposite / each touchline", "on the end line
 * itself", "both end lines"). None of them says WHICH part of a touchline or an end line, so a region is said along a touchline only where
 * its across interval meets exactly that one touchline AND its along interval runs the area's whole length; a line is said on an end line
 * only where it is one point at an end AND runs the area's whole width; "the touchline" of a region with no pair only in a game holding no
 * pair (beside one it names either touchline: (g)), and only where every region so said lies along the same one; "one" and "the opposite"
 * touchline only where the pair's other region lies along the other; "both end lines" only where the two lines themselves sit at the two ends.
 *
 * And, after the second E5a review (27 October 2026), the sentences that place by a team's end. Until then this header said they "read their
 * own geometry"; they did not read enough of it: a team's target zone was said "at the {defender}'s end" wherever its span touched an end,
 * either end, and a line "{n} from the {team}'s end line" wherever it lay inside the area, at any distance (the review's probes, on the path
 * with no layout). Each team's end is now read from the game's objectives as the realizer placed by it (`gameReadingOf`), and such a sentence
 * is said only where the realized geometry is at the end and the distance its words name: a target's span touches the end its defender
 * defends (which its attacker attacks); a target "from the marked line" begins where the line is realized; a line is realized at its offset
 * from the end line its team defends. Otherwise it is left unsaid and fidelity refuses, as above. A region bound to an object is placed by
 * its own sentences (`bound-region-communication.unit.ts`) and is not this file's subject.
 *
 * Cases, each TEST-ONLY and each a copy in memory (no knowledge file is read for writing or changed):
 *   (a) full-width end zones in the no-role possession game, through the real chain (TEST-ONLY depths and the realizer's choices changed on a
 *       copy, the pattern of `realization/target-extents.unit.ts`);
 *   (b) one of two scoring lines moved off its end line, on a copy of the served game's fixture;
 *   (c) the two paired channels moved onto the same touchline, on a copy of the retired specimen fixture.
 * Reverting E5a serves (a) with the false sentence and says (b) "both end lines" and (c) "the opposite touchline" (measured 27 October 2026).
 * Added after the E5a review (27 October 2026), each on a copy of (a)'s or (b)'s fixture:
 *   (d) a region meeting one touchline but not running the whole length, and a line on an end line not running the whole width;
 *   (e) two regions with no pair along opposite touchlines (and, as a control, the same touchline);
 *   (f) both lines at one end with a degenerate region at the other, which made the degenerate positions differ.
 * Reverting the narrowing says (d) "a zone along the touchline, 6 m long" twice and "on the end line itself" of a 10 m line, (e) "along the
 * touchline" of both, and (f) "Mark both end lines" (measured 27 October 2026).
 * Added after the second E5a review (27 October 2026), on a copy of (c)'s specimen:
 *   (g) the pair plus a region with no lateral of its own, on either touchline: "the touchline" would name either of the pair's, so the
 *       region is not said. Reverting it says "Mark a channel along the touchline" beside the pair, on each touchline alike.
 * And on a copy of A01's first role block as the served goal builds it (the building team at the 0 end line):
 *   (h) with no layout: the 5 m target moved to the other end; the line realized at 12 m; the line's offset 12 m realized 12 m from the other
 *       team's end line; the target beyond the line beginning 5 m past it;
 *   (i) with the layout: the 5 m target moved to the other end; the line realized at 12 m; the target beyond the line beginning past it.
 * Reverting the guard says each where it is not: "at the building team's end" of a target at the pressing team's, "20 m from" (or "12 m
 * from") "the building team's end line" of a line that is not, "from the marked line" of a target that begins elsewhere (on the layout path
 * a target's sentence is reached only for a region the no-layout predicate answers, so there both copies must be reverted; measured 27
 * October 2026).
 *
 * Run: npx ts-node --files -r tsconfig-paths/register ./src/system/rendering/placement-geometry.unit.ts
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { LoadedContract } from '../derivation/types'
import { SuppliedRealization } from '../realization/supplied-realization'
import { buildActivityFromKnowledge, buildActivityWithFixture, RefusedActivity } from './build-activity'
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

/** Each game is built once through the real chain; every TEST-ONLY move is made on a copy, never on the built fixture. */
type Built = ReturnType<typeof buildActivityFromKnowledge>
const once = (make: () => Built): (() => Built) => {
    let built: Built | null = null
    return () => {
        if (!built) built = make()
        return built
    }
}
const zoneGame = once(() => buildActivityFromKnowledge(['GF2'], session, { alter: withDepths, alterSupplied: asZones }))
const servedGame = once(() => buildActivityFromKnowledge(['GF2'], session))
const regionIds = (fixture: any, noun: string): string[] => (fixture.game.space.regions as any[]).filter(r => r.noun === noun).map(r => String(r.elementId))
const alongInterval = (fixture: any, elementId: string) => (fixture.status.geometry as any[]).find(g => g.path.includes(`[${elementId}]`) && g.path.endsWith('.along'))?.geometry?.interval
const unmarkedSentence = (elementId: string) => `region ${elementId} exists in the game and has no marking instruction`
const texts = (rendered: ReturnType<typeof renderConcreteGame>) => JSON.stringify(rendered.instructions.map(i => i.text))

test('(a) a full-width end zone in a game with no role nouns is refused, never served as "a zone along the touchline"', () => {
    const { activity, fixture } = zoneGame()
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
    const { activity, fixture } = servedGame()
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

/* ── (d) part of a touchline, part of an end line (after the E5a review) ─────────────────────────────────────────────────────────── */
test('(d) a region along part of a touchline, or a line along part of an end line, is not said there: the sentence cannot say which part', () => {
    const { fixture } = zoneGame()
    const zones = regionIds(fixture, 'zone')
    assert.equal(zones.length, 2)
    const near = zones.find(id => alongInterval(fixture, id)?.from === 0)!
    const far = zones.find(id => id !== near)!
    assert.deepEqual(alongInterval(fixture, far), { from: 40 - ZONE_TEST_ONLY_M, to: 40 }, 'each zone at its own end')
    // TEST-ONLY: both zones made half-width on the SAME touchline, each still at its own end (so only the length tells them apart).
    const ends = copy(fixture) as any
    for (const id of zones) moveRegion(ends, id, 'across', { from: 0, to: 15 })
    // TEST-ONLY: and the near zone moved to the middle of the length, still on that touchline.
    const middle = copy(ends) as any
    moveRegion(middle, near, 'along', { from: 17, to: 23 })
    for (const [label, moved] of [['at the ends', ends], ['one in the middle', middle]] as const) {
        const rendered = renderConcreteGame(moved)
        for (const id of zones) assert.deepEqual(marking(rendered, id), [], `${label}: ${id} runs part of the touchline and is not said along it`)
        assert.ok(!rendered.instructions.some(i => /touchline/.test(i.text)), `${label}: ${texts(rendered)}`)
        assert.deepEqual(unmarked(moved, rendered).sort(), zones.map(unmarkedSentence).sort(), label)
    }

    const { fixture: served } = servedGame()
    const lines = regionIds(served, 'line')
    assert.equal(lines.length, 2)
    // TEST-ONLY: one line made to cover only 10 m to 20 m of its end line.
    const part = copy(served) as any
    moveRegion(part, lines[0], 'across', { from: 10, to: 20 })
    const one = renderConcreteGame(part)
    assert.deepEqual(marking(one, lines[0]), [], `the part-width line is not said on the end line: ${texts(one)}`)
    assert.ok(!one.instructions.some(i => /both end lines/.test(i.text)), texts(one))
    assert.equal(marking(one, lines[1]).length, 1, texts(one))
    assert.match(marking(one, lines[1])[0], /, 30 m long, on the end line itself$/, 'the whole-width line is still said on its end line')
    assert.deepEqual(unmarked(part, one), [unmarkedSentence(lines[0])])
    // TEST-ONLY: and both lines so, one length: not "both end lines" either.
    const both = copy(part) as any
    moveRegion(both, lines[1], 'across', { from: 10, to: 20 })
    const two = renderConcreteGame(both)
    for (const id of lines) assert.deepEqual(marking(two, id), [], `${id} runs part of its end line and is not said on it`)
    assert.ok(!two.instructions.some(i => /both end lines|end line itself/.test(i.text)), texts(two))
    assert.deepEqual(unmarked(both, two).sort(), lines.map(unmarkedSentence).sort())
})

/* ── (e) two regions with no pair, on opposite touchlines (after the E5a review) ─────────────────────────────────────────────────── */
test('(e) "the touchline" of regions with no pair is said only where every one so said lies along the same touchline', () => {
    const { fixture } = zoneGame()
    const zones = regionIds(fixture, 'zone')
    assert.ok(zones.every(id => !(fixture as any).game.space.regions.find((r: any) => String(r.elementId) === id).selector?.some((t: any) => t.attribute === 'lateral')), 'neither zone has a pair')
    // TEST-ONLY: both zones made to run the whole length, 10 m wide, one on each touchline.
    const opposite = copy(fixture) as any
    for (const id of zones) moveRegion(opposite, id, 'along', { from: 0, to: 40 })
    moveRegion(opposite, zones[0], 'across', { from: 0, to: 10 })
    moveRegion(opposite, zones[1], 'across', { from: 20, to: 30 })
    const apart = renderConcreteGame(opposite)
    for (const id of zones) assert.deepEqual(marking(apart, id), [], `${id} is not said "along the touchline" while the other lies along the other one`)
    assert.ok(!apart.instructions.some(i => /touchline/.test(i.text)), texts(apart))
    assert.deepEqual(unmarked(opposite, apart).sort(), zones.map(unmarkedSentence).sort())
    // Control: both on the same touchline, the sentence that already exists is said of each.
    const same = copy(opposite) as any
    moveRegion(same, zones[1], 'across', { from: 0, to: 5 })
    const together = renderConcreteGame(same)
    for (const id of zones) {
        assert.equal(marking(together, id).length, 1, texts(together))
        assert.match(marking(together, id)[0], /^Mark a zone along the touchline, 40 m long and /, texts(together))
    }
    assert.deepEqual(unmarked(same, together), [])
})

/* ── (f) "both end lines" from the lines' own positions (after the E5a review) ───────────────────────────────────────────────────── */
test('(f) "Mark both end lines" needs the two lines themselves at the two ends, not any two degenerate regions that differ', () => {
    const { fixture } = servedGame()
    const lines = regionIds(fixture, 'line')
    const far = lines.find(id => alongInterval(fixture, id)?.from === 40)!
    // TEST-ONLY: the far line moved onto the near end line, on a copy.
    const moved = copy(fixture) as any
    moveRegion(moved, far, 'along', { from: 0, to: 0 })
    // TEST-ONLY: and a degenerate zone added at the far end (a copy of the far line's region and geometry), so two degenerate positions differ.
    const extraId = 'c:TEST-ONLY:DEGENERATE'
    const extra = copy((moved.game.space.regions as any[]).find(r => String(r.elementId) === far))
    extra.elementId = extraId
    extra.noun = 'zone'
    moved.game.space.regions.push(extra)
    for (const entry of (moved.status.geometry as any[]).filter(g => g.path.includes(`[${far}]`))) {
        const twin = copy(entry)
        twin.path = twin.path.split(`[${far}]`).join(`[${extraId}]`)
        moved.status.geometry.push(twin)
    }
    moveRegion(moved, extraId, 'along', { from: 40, to: 40 })
    moveRegion(moved, extraId, 'across', { from: 0, to: 10 })
    const rendered = renderConcreteGame(moved)
    assert.ok(!rendered.instructions.some(i => /both end lines/.test(i.text)), texts(rendered))
    for (const id of lines) {
        assert.equal(marking(rendered, id).length, 1, texts(rendered))
        assert.match(marking(rendered, id)[0], /^Mark a line across one end of the area, 30 m long, on the end line itself$/, `both lines lie on the one end line: ${texts(rendered)}`)
    }
})

/* ── (g) a region with no pair beside a pair (after the second E5a review) ───────────────────────────────────────────────────────── */
test('(g) beside a pair, a region with no lateral of its own is not said "along the touchline", on either touchline', () => {
    const specimen = JSON.parse(fs.readFileSync(SPECIMEN, 'utf8'))
    const channels = regionIds(specimen, 'channel')
    assert.equal(channels.length, 2)
    const acrossOf = (id: string) => (specimen.status.geometry as any[]).find(g => g.path.includes(`[${id}]`) && g.path.endsWith('.across')).geometry.interval
    assert.notDeepEqual(acrossOf(channels[0]), acrossOf(channels[1]), 'the pair lies along the two touchlines')
    const third = 'c:restated:WIDE-ZONE-ADVANTAGE:TEST-ONLY-THIRD'
    for (const beside of channels) {
        // TEST-ONLY, on a copy: a third channel, the first one's region and geometry with its lateral taken out, referenced by the pair's value
        // modifier (so it changes play, as the pair does), whole length, along the touchline `beside` lies along.
        const moved = copy(specimen) as any
        const twin = copy((moved.game.space.regions as any[]).find(r => String(r.elementId) === channels[0]))
        twin.elementId = third
        twin.selector = (twin.selector ?? []).filter((term: any) => term.attribute !== 'lateral')
        moved.game.space.regions.push(twin)
        for (const list of [moved.status.geometry, moved.status.derived ?? []] as any[][]) {
            for (const entry of list.filter(e => typeof e.path === 'string' && e.path.includes(`[${channels[0]}]`))) {
                const added = copy(entry)
                added.path = added.path.split(`[${channels[0]}]`).join(`[${third}]`)
                if (typeof added.lineId === 'string') added.lineId = added.lineId.split(channels[0]).join(third)
                list.push(added)
            }
        }
        const referents = moved.game.value.valueModifiers[0].condition.referents as any[]
        const reference = copy(referents[0])
        assert.ok(reference.structuralRef, 'the pair is referenced by the value modifier')
        reference.structuralRef.itemId = 'TEST-ONLY-THIRD'
        referents.push(reference)
        moveRegion(moved, third, 'across', acrossOf(beside))
        const rendered = renderConcreteGame(moved)
        assert.deepEqual(marking(rendered, third), [], `beside ${beside}: the region with no lateral is not said: ${texts(rendered)}`)
        assert.ok(!rendered.instructions.some(i => /along the touchline/.test(i.text)), texts(rendered))
        assert.deepEqual(
            channels.map(id => marking(rendered, id).filter(text => PLACEMENT.test(text)).length),
            [1, 1],
            `beside ${beside}: the pair is still said on one and the opposite touchline`,
        )
        assert.deepEqual(unmarked(moved, rendered), [unmarkedSentence(third)], `beside ${beside}`)
    }
})

/* ── (h), (i) a team's end, read from the teams (after the second E5a review) ────────────────────────────────────────────────────── */
/** A01's first role block, built once through the real chain as the served goal builds it (no goal object); every move is on a copy. */
let a01Built: any = null
const a01Block = (): any => {
    if (!a01Built) {
        const roles = { ...none, [specializedRoleNames()[0]]: 1 }
        const built = buildActivityWithFixture({ kind: 'learning-goal', goalId: 'A01', situationId: null, session: { ...session, roles, objects: { goal: { count: 0 } } } } as any)
        assert.equal(built.activity.outcome, 'served', JSON.stringify((built.activity as any).reasons))
        a01Built = (built.fixture as any).roleBlocks.blocks[0].fixture
    }
    return copy(a01Built)
}
/** The block's line, its target with a required depth, and its target beyond the line, found by their geometry, not by id. */
const a01Regions = (block: any) => {
    const along = (id: string) => (block.status.geometry as any[]).find(g => g.path.includes(`[${id}]`) && g.path.endsWith('.along'))?.geometry
    const ids = (block.game.space.regions as any[]).map(r => String(r.elementId))
    const line = ids.find(id => (block.game.space.regions as any[]).find(r => String(r.elementId) === id).noun === 'line' && along(id)?.interval?.from === 20)!
    const deep = ids.find(id => along(id)?.extentBound?.requiredWithin?.min === 5)!
    const beyond = ids.find(id => along(id)?.relation?.of && `c:${along(id).relation.of.contractId}:${along(id).relation.of.itemId}` === line)!
    assert.ok(line && deep && beyond, 'the line at 20 m, the 5 m target and the target beyond the line')
    assert.deepEqual([along(deep).interval, along(beyond).interval], [{ from: 0, to: 5 }, { from: 20, to: 40 }], 'the building team at the 0 end line')
    return { line, deep, beyond }
}

test('(h) with no layout, a target is said at the defender\'s end, and a line at its distance from its team\'s end line, only where realized there', () => {
    const asBuilt = a01Block()
    delete asBuilt.layout
    const { line, deep, beyond } = a01Regions(asBuilt)
    const said = {
        line: "Mark a line across the area, 20 m from the building team's end line",
        deep: "Mark the pressing team's target zone at the building team's end, 5 m deep, across the full width",
        beyond: "Mark the building team's target zone from the marked line to the pressing team's end line, across the full width",
    }
    // Control: as realized, each is said (the target beyond the line also cites the line's noun), and nothing is unmarked.
    const control = renderConcreteGame(asBuilt)
    assert.deepEqual([marking(control, line), marking(control, deep), marking(control, beyond)], [[said.line, said.beyond], [said.deep], [said.beyond]], texts(control))
    assert.deepEqual(unmarked(asBuilt, control), [])
    // Each TEST-ONLY move on a copy, with what must then be left unsaid, and the sentence that must still be said.
    const cases: [string, (block: any) => void, string[], keyof typeof said][] = [
        ['the 5 m target moved to the other end (the pressing team\'s own)', block => moveRegion(block, deep, 'along', { from: 35, to: 40 }), [deep], 'line'],
        ['the line realized at 12 m, its offset still 20 m', block => moveRegion(block, line, 'along', { from: 12, to: 12 }), [line, beyond], 'deep'],
        [
            'the line\'s offset 12 m, realized 12 m from the OTHER team\'s end line (28 m)',
            block => {
                ;(block.game.space.regions as any[]).find(r => String(r.elementId) === line).position.along.offsetM = { from: 12, to: 12 }
                moveRegion(block, line, 'along', { from: 28, to: 28 })
            },
            [line, beyond],
            'deep',
        ],
        ['the target beyond the line beginning at 25 m, the line at 20 m', block => moveRegion(block, beyond, 'along', { from: 25, to: 40 }), [beyond], 'line'],
    ]
    // Every case is run and every failure reported together, so a reverted guard shows each case it lets through.
    const failures = cases.flatMap(([label, move, unsaid, still]) => {
        const moved = copy(asBuilt)
        move(moved)
        const rendered = renderConcreteGame(moved)
        try {
            for (const id of unsaid) assert.deepEqual(marking(rendered, id), [], `${id} is not said`)
            assert.ok(rendered.instructions.some(i => i.text === said[still]), `"${said[still]}" is still said`)
            assert.deepEqual(unmarked(moved, rendered).sort(), unsaid.map(unmarkedSentence).sort())
            return []
        } catch (error) {
            return [`${label}: ${(error as Error).message.split('\n')[0]} | said: ${texts(rendered)}`]
        }
    })
    assert.deepEqual(failures, [])
})

test('(i) with the layout, a target is said at the defender\'s end, and the line at halfway, only where realized there', () => {
    const asBuilt = a01Block()
    assert.ok(asBuilt.layout, 'the block carries its layout')
    const { line, deep, beyond } = a01Regions(asBuilt)
    const said = {
        halfway: 'Mark a line across the area at halfway, 20 m from each end line',
        deep: "The pressing team's target zone is the 5 m end zone at the building team's end",
        beyond: "The building team's target zone is everything beyond the marked line, up to the pressing team's end line, including the end zone there",
    }
    const control = renderConcreteGame(asBuilt)
    for (const text of Object.values(said)) assert.ok(control.instructions.some(i => i.text === text), `as realized: ${texts(control)}`)
    const cases: [string, (block: any) => void, (keyof typeof said)[]][] = [
        ['the 5 m target moved to the other end', block => moveRegion(block, deep, 'along', { from: 35, to: 40 }), ['deep']],
        ['the line realized at 12 m', block => moveRegion(block, line, 'along', { from: 12, to: 12 }), ['halfway', 'beyond']],
        ['the target beyond the line beginning at 25 m', block => moveRegion(block, beyond, 'along', { from: 25, to: 40 }), ['beyond']],
    ]
    const failures = cases.flatMap(([label, move, unsaid]) => {
        const moved = copy(asBuilt)
        move(moved)
        const rendered = renderConcreteGame(moved)
        const found = unsaid.filter(key => rendered.instructions.some(i => i.text === said[key])).map(key => `${label}: "${said[key]}" is said`)
        // Refused either way: fidelity's layout check (Q5-L) or its marking check names what is no longer said where it lies.
        if (!checkFidelity(moved, rendered).findings.some(f => f.question === 5 && f.severity === 'VIOLATION')) found.push(`${label}: not refused`)
        return found
    })
    assert.deepEqual(failures, [])
})

console.log(`placement-geometry: ${passed} passed`)
if (process.exitCode) console.log('placement-geometry: FAILURES ABOVE')
