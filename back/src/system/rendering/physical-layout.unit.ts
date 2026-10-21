/**
 * **Stage 2D, 21 October 2026 — the markings set out once, from his recorded choice; the exchange states what changes, not re-marking.**
 *
 * Christian, reply filed 22 October 2026, item 7: *"For this particular 40 × 30 m configuration, we can also simplify setup by marking the
 * halfway line and both 5 m end zones at the beginning. Role exchanges should not require unnecessary physical re-marking."* and *"The
 * knowledge can continue to represent the distinct targets and relationships for each block, even where the physical markings remain
 * unchanged."*
 *
 * What is pinned here, on the real chain or on copies of what it built (TEST-ONLY lines are labelled):
 *
 *   1. A01 at 40 x 30 m: the marks are the union of both blocks' realized edges (5, 20, 35 m), admissible, carried by both blocks
 *      whole, with his recorded choice and what moves a mark; RB-L passes;
 *   2. TEST-ONLY blocks on a 50 x 30 m area (the line 20 m from the building team's end, so at 20 m in one block and 30 m in the other):
 *      inadmissible, and why is said; the production choice does not apply to that area at all;
 *   3. with no recorded choice (TEST-ONLY records), A01 reads exactly as the block-by-block renders compose, with nothing of a layout;
 *      with a choice recorded for another area, the same text plus a technical observation saying why;
 *   4. a TEST-ONLY offset that moves the line off half the length: built end to end, the markings stay block by block and why is said;
 *   5. RB-L refuses a layout that differs from the recomputed union, a block missing one, and one carried with no choice recorded;
 *   6. fidelity Q2 accepts a number bound to the layout only where the layout holds it there;
 *   7. Q5-L: every mark and zone said by Set up, each block's region denoted exactly once at the interval the layout records, a mark
 *      inert in one block justified by the block it is marked for; the exchange that re-marks nothing carries the moved-line
 *      qualification and cites the layout, and "set out again" put back is refused;
 *   8. the composition pairs the two target sentences under the role pairing with the layout's axis mirror, and Q6 refuses a pair
 *      whose block-2 parts bind a number outside the pairing (the 2C review's should-fix);
 *   9. the module names no goal, no value and no sport.
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { loadRegister } from '../derivation/corpus'
import { indexRegister } from '../derivation/register'
import { LoadedContract } from '../derivation/types'
import { learningGoalAuthorization, learningGoalAuthorizations, LearningGoalAuthorization } from '../test-library/learning-goal-authorizations'
import { buildActivityUnderAuthorizationRecords, buildActivityWithFixture, ServedActivity } from './build-activity'
import { checkFidelity } from './fidelity'
import { MECHANISM_DEMONSTRATIONS } from './mechanism-demonstrations'
import { layoutChoicesOf, layoutMoversOf, layoutNumbersAt, layoutOf, MARK_UNION_ONCE } from './physical-layout'
import { Instruction, renderConcreteGame, ROLE_EXCHANGE } from './render-concrete-game'
import { checkRoleBlockComposition, checkRoleBlockLayout, composeRoleBlockActivity, counterpartMap } from './role-blocks'
import { specializedRoleNames } from './session-envelope'

let passed = 0
function test(name: string, body: () => void): void {
    body()
    passed++
    console.log(`  ok  ${name}`)
}
console.log('the markings set out once, from his recorded choice (stage 2D)')

const ROLE = specializedRoleNames()[0]
const none = Object.fromEntries(specializedRoleNames().map(role => [role, 0]))
const session = { players: 12, lengthM: 40, widthM: 30, durationMin: 20, roles: { ...none, [ROLE]: 1 } }
const a01 = { kind: 'learning-goal' as const, goalId: 'A01', situationId: null, session }
const index = indexRegister(loadRegister())
const record = learningGoalAuthorization('A01')!
const choices = layoutChoicesOf(record)
const movers = layoutMoversOf(record)
const built = buildActivityWithFixture(a01)
const served = built.activity as ServedActivity
const blocks: { blockId: string; fixture: any }[] = ((built.fixture as any).roleBlocks.blocks as any[]).map(block => ({ blockId: block.blockId, fixture: block.fixture }))
const bare = (entry: { blockId: string; fixture: any }) => ({ blockId: entry.blockId, fixture: { ...entry.fixture, layout: undefined } })
const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value))
const LINE = 'c:provisional:A01-R1:A01-R1-S2-1'
const PRESSING_TARGET_SENTENCE = "The pressing team's target zone is the 5 m end zone at the building team's end"
const HIS_ITEM_7 =
    'For this particular 40 × 30 m configuration, we can also simplify setup by marking the halfway line and both 5 m end zones at the beginning. Role exchanges should not require unnecessary physical re-marking. The knowledge can continue to represent the distinct targets and relationships for each block, even where the physical markings remain unchanged.'
/** The A01 records with his recorded layout choice taken out (TEST-ONLY), or its scope replaced. */
const recordsWith = (change: (a01Record: LearningGoalAuthorization) => void): LearningGoalAuthorization[] => {
    const records = copy(learningGoalAuthorizations())
    change(records.find(entry => entry.learningGoalId === 'A01')!)
    return records
}

test('1. A01 at 40 x 30 m: the union of both blocks\' edges is 5, 20 and 35 m, admissible, carried whole by both blocks; RB-L passes', () => {
    assert.equal(served.outcome, 'served')
    // His recorded choice, read from the record: his words verbatim, his scope as data.
    assert.equal(choices.length, 1)
    assert.deepEqual(choices[0], { value: MARK_UNION_ONCE, appliesTo: { lengthM: 40, widthM: 30 }, ruledOn: '2026-10-22', by: 'Christian', citedAs: 'his reply filed 22 October 2026, item 7', words: HIS_ITEM_7 })
    // What moves a mark: the adjustment of a position's magnitude for the building role (A01-ADJ-3, EMP-0011 Magnitude).
    assert.deepEqual(movers, [{ id: 'A01-ADJ-3', role: 'BUILDING' }])
    const decision = layoutOf(blocks.map(bare), choices, movers)
    assert.equal(decision.applies, true, JSON.stringify(decision.why))
    const layout = decision.layout!
    assert.deepEqual(layout.marks.map(mark => [mark.elementId, mark.at, mark.line]), [['mark-1', 5, null], ['mark-2', 20, LINE], ['mark-3', 35, null]])
    assert.deepEqual(layout.zones.map(zone => [zone.elementId, zone.from, zone.to, zone.depthM, zone.inner]), [['zone-1', 0, 5, 5, 'mark-1'], ['zone-2', 35, 40, 5, 'mark-3']])
    // Each zone is one block's own target: the near one block 1's pressing target, the far one block 2's.
    assert.deepEqual(layout.zones.map(zone => zone.sources.map(source => [source.blockId, source.regionId])), [[[blocks[0].blockId, 'c:restated:GF2:GF2-03.e']], [[blocks[1].blockId, 'c:restated:GF2:GF2-03.f']]])
    assert.deepEqual(layout.movedBy, [{ elementId: 'A01-ADJ-3', mark: 'mark-2', line: LINE, role: 'BUILDING', forTeam: 'ROLE_HOLDER_BUILDING' }])
    // Each block's region intervals, as realized (the knowledge keeps each block's own targets).
    for (const block of blocks) {
        for (const entry of layout.regions.filter(region => region.blockId === block.blockId)) {
            const interval = block.fixture.status.geometry.find((g: any) => g.path === entry.path).geometry.interval
            assert.deepEqual([entry.from, entry.to], [interval.from, interval.to], entry.path)
        }
    }
    assert.equal(layout.because.words, HIS_ITEM_7)
    // Carried whole by both blocks, and RB-L recomputes exactly it.
    for (const block of blocks) assert.deepEqual(block.fixture.layout, layout, block.blockId)
    assert.deepEqual(checkRoleBlockLayout(blocks, choices, movers), { checkId: 'RB-L', what: checkRoleBlockLayout(blocks, choices, movers).what, verdict: 'PASS', problems: [] })
    assert.deepEqual(served.roleBlocks!.checks.map(check => [check.checkId, check.verdict]).slice(-1), [['RB-L', 'PASS']])
    // The same layout at 2 goalkeepers and at 11 players.
    for (const other of [{ ...session, roles: { ...none, [ROLE]: 2 } }, { ...session, players: 11 }]) {
        const again = buildActivityWithFixture({ ...a01, session: other })
        assert.equal(again.activity.outcome, 'served', JSON.stringify(other))
        const otherBlocks: any[] = (again.fixture as any).roleBlocks.blocks
        const { regions: _regions, ...rest } = otherBlocks[0].fixture.layout
        const { regions: _ownRegions, ...own } = layout
        assert.deepEqual(rest.marks.map((mark: any) => mark.at), own.marks.map(mark => mark.at), JSON.stringify(other))
        assert.deepEqual(rest.zones.map((zone: any) => [zone.from, zone.to]), own.zones.map(zone => [zone.from, zone.to]), JSON.stringify(other))
    }
})

/** TEST-ONLY blocks on a 50 m length: the line 20 m from the building team's end (20 m in one block, 30 m in the other), targets moved with it. */
function onFiftyMetres(): { blockId: string; fixture: any }[] {
    const geometry: Record<string, [number, number][]> = {
        [`space.regions[${LINE}].position.along`]: [[20, 20], [30, 30]],
        'space.regions[c:restated:GF2:GF2-03.e].position.along': [[0, 5], [0, 30]],
        'space.regions[c:restated:GF2:GF2-03.f].position.along': [[20, 50], [45, 50]],
    }
    return blocks.map((block, n) => {
        const fixture = copy(bare(block).fixture)
        fixture.envelope.lengthM = 50
        fixture.game.envelope.area.length_m = 50
        for (const g of fixture.status.geometry) if (geometry[g.path]) g.geometry.interval = { from: geometry[g.path][n][0], to: geometry[g.path][n][1] }
        return { blockId: block.blockId, fixture }
    })
}

test('2. TEST-ONLY 50 x 30 m: inadmissible, and why is said; the production choice does not apply to that area at all', () => {
    const fifty = onFiftyMetres()
    const thereChoice = [{ ...choices[0], appliesTo: { lengthM: 50, widthM: 30 } }]
    const decision = layoutOf(fifty, thereChoice, movers)
    assert.equal(decision.applies, false)
    assert.equal(decision.recorded, true)
    assert.ok(decision.why.some(why => why.startsWith(`the line ${LINE} is not held at one position in every block`) && why.includes('so it would be re-marked at the exchange')), JSON.stringify(decision.why))
    // His choice is for 40 x 30 m; at 50 x 30 m it is recorded and does not apply.
    const production = layoutOf(fifty, choices, movers)
    assert.deepEqual([production.applies, production.recorded], [false, true])
    assert.deepEqual(production.why, ["the recorded choice MARK_UNION_ONCE (his reply filed 22 October 2026, item 7) applies to an area 40 m long by 30 m wide, and this session's area is 50 m long by 30 m wide"])
    // A line held at one place in both blocks but not at half the length has no words, so it is inadmissible too (TEST-ONLY).
    const offCentre = blocks.map(bare).map(entry => {
        const fixture = copy(entry.fixture)
        for (const g of fixture.status.geometry) if (g.path === `space.regions[${LINE}].position.along`) g.geometry.interval = { from: 15, to: 15 }
        return { blockId: entry.blockId, fixture }
    })
    assert.ok(layoutOf(offCentre, choices, movers).why.some(why => why.includes('not at half of it')))
})

test('3. with no recorded choice, A01 reads exactly as the block-by-block renders compose; a choice for another area adds only why', () => {
    const decision = layoutOf(blocks.map(bare), [], movers)
    assert.deepEqual(decision, { applies: false, layout: null, recorded: false, why: [] })
    const without = buildActivityUnderAuthorizationRecords(a01, recordsWith(a01Record => (a01Record.provisionalChoices = (a01Record.provisionalChoices ?? []).filter(choice => choice.value === undefined))))
    assert.equal(without.activity.outcome, 'served')
    const withoutServed = without.activity as ServedActivity
    // Exactly the composition of the two renders without a layout: nothing re-rendered, nothing of the layout cited or said.
    const perBlock = blocks.map(bare).map(entry => ({ ...entry, rendered: renderConcreteGame(entry.fixture) }))
    assert.deepEqual(withoutServed.rendered.instructions, composeRoleBlockActivity(perBlock, index).instructions)
    assert.ok(!withoutServed.rendered.instructions.some(i => i.from.some(p => p.startsWith('layout.'))))
    assert.ok(((without.fixture as any).roleBlocks.blocks as any[]).every(block => block.fixture.layout === undefined))
    const texts = withoutServed.rendered.instructions.map(i => i.text)
    assert.ok(texts.includes("Mark a line across the area, 20 m from the building team's end line"))
    assert.ok(texts.includes('Each team keeps its end for the whole activity. When you call the next block the teams exchange roles, not ends, and the marked line and both target zones are set out again for the new roles; there is no set block length'))
    assert.ok(texts.includes('You may choose to move the marked line nearer to either end line'))
    assert.ok(!texts.some(text => text.includes('halfway')))
    assert.deepEqual(withoutServed.rendered.coachingObservations, served.rendered.coachingObservations, 'no observation: nothing was recorded')
    assert.deepEqual(withoutServed.roleBlocks!.checks.slice(-1).map(check => [check.checkId, check.verdict]), [['RB-L', 'PASS']])
    // A choice recorded for another area (TEST-ONLY scope): the same text, and the technical account says why.
    const elsewhere = buildActivityUnderAuthorizationRecords(a01, recordsWith(a01Record => (a01Record.provisionalChoices!.find(choice => choice.value)!.appliesTo = { lengthM: 50, widthM: 30 })))
    const elsewhereServed = elsewhere.activity as ServedActivity
    assert.equal(elsewhereServed.outcome, 'served')
    assert.deepEqual(elsewhereServed.rendered.instructions, withoutServed.rendered.instructions)
    assert.deepEqual(
        elsewhereServed.rendered.coachingObservations.filter(o => !withoutServed.rendered.coachingObservations.includes(o)),
        ["The markings are presented block by block, and not set out once as the recorded choice MARK_UNION_ONCE asks: the recorded choice MARK_UNION_ONCE (his reply filed 22 October 2026, item 7) applies to an area 50 m long by 30 m wide, and this session's area is 40 m long by 30 m wide."],
    )
    // The served demonstrations hold no layout and read as before: no record, no role blocks.
    for (const demonstration of MECHANISM_DEMONSTRATIONS) {
        const demo = buildActivityWithFixture({ kind: 'mechanism-demonstration', demonstrationId: demonstration.id, session: { ...session, roles: none } })
        assert.equal((demo.fixture as any)?.layout, undefined, demonstration.id)
        if (demo.activity.outcome === 'served') assert.ok(!(demo.activity as ServedActivity).rendered.instructions.some(i => i.from.some(p => p.startsWith('layout.'))), demonstration.id)
    }
})

test('4. TEST-ONLY: the line 15 m from the building team\'s end (off half the length) is built end to end, presented block by block, and why is said', () => {
    const alter = (contracts: LoadedContract[]) => {
        const item: any = contracts.find(contract => contract.contractId === 'provisional:A01-R1')!.items.find(entry => entry.itemId === 'A01-R1-S5-1')
        item.value = { ...item.value, offsetM: { from: 15, to: 15 }, asAuthored: 'TEST-ONLY 15 m from the building team\'s end line' }
    }
    const moved = buildActivityUnderAuthorizationRecords(a01, learningGoalAuthorizations(), { alter })
    assert.equal(moved.activity.outcome, 'served', JSON.stringify((moved.activity as any).reasons))
    const activity = moved.activity as ServedActivity
    const texts = activity.rendered.instructions.map(i => i.text)
    assert.ok(texts.includes("Mark a line across the area, 15 m from the building team's end line"), JSON.stringify(texts))
    assert.ok(!texts.some(text => text.includes('halfway')), 'a moved line never prints "halfway"')
    assert.ok(!texts.some(text => text.includes('nothing is re-marked')), 'nor that nothing is re-marked')
    assert.ok(texts.some(text => text.includes('set out again for the new roles')))
    assert.ok(!activity.rendered.instructions.some(i => i.from.some(p => p.startsWith('layout.'))))
    assert.ok(activity.rendered.coachingObservations.some(o => o.startsWith('The markings are presented block by block') && o.includes(`the line ${LINE} is not held at one position in every block (15-15 m in block`)), JSON.stringify(activity.rendered.coachingObservations))
})

test('5. RB-L refuses a layout that is not the recomputed union, a block carrying none, and one carried with no choice recorded', () => {
    const verdict = (from: { blockId: string; fixture: any }[], withChoices = choices) => checkRoleBlockLayout(from, withChoices, movers)
    const changed = (change: (layout: any) => void) =>
        blocks.map((block, n) => {
            const fixture = { ...block.fixture, layout: copy(block.fixture.layout) }
            if (n === 0) change(fixture.layout)
            return { blockId: block.blockId, fixture }
        })
    const moved = verdict(changed(layout => (layout.marks[0].at = 6)))
    assert.equal(moved.verdict, 'FAIL')
    assert.deepEqual(moved.problems, [`block ${blocks[0].blockId} carries a layout that is not the union of every block's realized edges, recomputed from the blocks and the record`])
    assert.equal(verdict(changed(layout => (layout.zones[1].depthM = 6))).verdict, 'FAIL')
    assert.equal(verdict(changed(layout => (layout.movedBy = []))).verdict, 'FAIL', 'what an adjustment moves is part of the layout')
    const missing = verdict([blocks[0], bare(blocks[1])])
    assert.deepEqual(missing.problems, [`block ${blocks[1].blockId} carries no layout, and the recorded choice applies and every block's markings can be set out once`])
    const unrecorded = verdict(blocks, [])
    assert.equal(unrecorded.problems.length, 2)
    assert.ok(unrecorded.problems.every(problem => problem.endsWith('carries a layout, and no choice to set the markings out once is recorded for this activity')))
    assert.equal(verdict(blocks.map(bare), []).verdict, 'PASS', 'no layout and no choice: nothing to hold')
})

test('6. fidelity Q2 accepts a number bound to the layout only where the layout holds it at that path', () => {
    const [{ fixture }] = blocks
    const rendered = renderConcreteGame(fixture)
    const zones = rendered.instructions.find(i => i.text.startsWith('Mark a 5 m end zone'))!
    assert.deepEqual(zones.parts![0].bindings, [{ quantity: 5, path: 'layout.zones[zone-1].depthM' }])
    assert.deepEqual(layoutNumbersAt(fixture.layout, 'layout.zones[zone-1].depthM'), [5])
    const q2 = (fx: any, r: any) => checkFidelity(fx, r).findings.filter(f => f.question === 2 && f.severity === 'VIOLATION')
    assert.deepEqual(q2(fixture, rendered), [])
    // TEST-ONLY: the layout holding 6 there, the sentence still saying 5.
    const deeper = { ...fixture, layout: copy(fixture.layout) }
    deeper.layout.zones[0].depthM = 6
    assert.ok(q2(deeper, rendered).some(f => f.what.includes('binds 5 to layout.zones[zone-1].depthM')), JSON.stringify(q2(deeper, rendered)))
    // TEST-ONLY: the sentence saying 6, bound there, where the layout holds 5.
    const said6 = copy(rendered)
    const target = said6.instructions.find((i: Instruction) => i.text.startsWith('Mark a 5 m end zone'))!
    target.text = target.text.replace('5 m', '6 m')
    target.quantities = [6]
    target.parts[0] = { ...target.parts[0], text: target.text, quantities: [6], bindings: [{ quantity: 6, path: 'layout.zones[zone-1].depthM' }] }
    assert.ok(q2(fixture, said6).some(f => f.what.includes('binds 6 to layout.zones[zone-1].depthM')))
    // Without a layout, a layout path holds nothing, so nothing bound to it is admitted.
    assert.ok(q2({ ...fixture, layout: undefined }, rendered).some(f => f.what.includes('layout.zones[zone-1].depthM')))
})

test('7. Q5-L: every mark and zone said, each region denoted once where the layout records it, inert marks justified, the qualified exchange', () => {
    const q5 = (fx: any, r: any) => checkFidelity(fx, r).findings.filter(f => f.question === 5 && f.severity === 'VIOLATION').map(f => f.what)
    for (const block of blocks) assert.deepEqual(q5(block.fixture, renderConcreteGame(block.fixture)), [], block.blockId)
    const [{ fixture }] = blocks
    const rendered = renderConcreteGame(fixture)
    const without = (pick: (i: Instruction) => boolean) => ({ ...rendered, instructions: rendered.instructions.filter(i => !pick(i)) })
    // (a) The end zones' sentence taken out (TEST-ONLY): its two marks are made by nothing.
    const noZones = q5(fixture, without(i => i.text.startsWith('Mark a 5 m end zone')))
    assert.ok(noZones.includes('the mark at 5 m (layout.marks[mark-1]) is set out once and no Set up sentence tells the coach to make it'), JSON.stringify(noZones))
    assert.ok(noZones.includes('the mark at 35 m (layout.marks[mark-3]) is set out once and no Set up sentence tells the coach to make it'))
    // (b) A target said twice (TEST-ONLY): its region is denoted by two Set up sentences.
    const pressing = rendered.instructions.find(i => i.text === PRESSING_TARGET_SENTENCE)!
    const twice = q5(fixture, { ...rendered, instructions: [...rendered.instructions, { ...pressing, text: `${pressing.text} (TEST-ONLY)`, parts: undefined }] })
    assert.ok(twice.includes('space.regions[c:restated:GF2:GF2-03.e].position.along is denoted by 2 Set up sentences in a layout set out once, not exactly one'), JSON.stringify(twice))
    // (c) The layout recording another interval for this block's region (TEST-ONLY): the words would contradict the game.
    const recordedElsewhere = { ...fixture, layout: copy(fixture.layout) }
    recordedElsewhere.layout.regions.find((r: any) => r.blockId === blocks[0].blockId && r.path.includes('GF2-03.e')).to = 6
    assert.ok(q5(recordedElsewhere, rendered).some(what => what.startsWith('space.regions[c:restated:GF2:GF2-03.e].position.along is realized at 0-5 m') && what.endsWith('records 0-6 m for it there')))
    // (d) The far mark bounds nothing in block 1 and is marked for block 2, which the layout records; without that record it is refused.
    const unsourced = { ...fixture, layout: copy(fixture.layout) }
    unsourced.layout.marks[2].sources = []
    assert.ok(q5(unsourced, rendered).includes(`the mark at 35 m bounds nothing in block ${blocks[0].blockId}, and the layout records no other block it is marked for`))
    // (e) The exchange that re-marks nothing without the moved-line qualification (TEST-ONLY): refused.
    const exchange = rendered.instructions.find(i => i.section === ROLE_EXCHANGE && i.from.includes('layout.policy'))!
    assert.ok(exchange.text.includes('nothing is re-marked unless you have moved the marked line'))
    const unqualified = rendered.instructions.map(i =>
        i === exchange ? { ...i, text: i.text.replace(' unless you have moved the marked line', ''), from: i.from.filter(p => !p.startsWith('layout.movedBy')), parts: i.parts!.map(p => ({ ...p, text: p.text.replace(' unless you have moved the marked line', ''), from: p.from.filter(f => !f.startsWith('layout.movedBy')) })) } : i,
    )
    assert.ok(q5(fixture, { ...rendered, instructions: unqualified }).includes('A01-ADJ-3 moves the mark at 20 m, and the exchange sentence says nothing is re-marked without saying so'))
    // (f) The adjustment that moves the line without its consequence (TEST-ONLY): refused.
    const moving = rendered.instructions.find(i => i.from.includes('layout.movedBy[A01-ADJ-3]') && i.section !== ROLE_EXCHANGE)!
    assert.equal(moving.text, "You may choose to move the marked line nearer to either end line; it is measured from the building team's end line, so when the roles exchange, set it out again at the same distance from the new building team's end line")
    const bareChoice = rendered.instructions.map(i => (i === moving ? { ...i, text: i.parts![0].text, from: i.parts![0].from, parts: [i.parts![0]] } : i))
    assert.ok(q5(fixture, { ...rendered, instructions: bareChoice }).includes('A01-ADJ-3 moves a mark set out once, and its sentence does not say what that means when the roles exchange'))
    // (g) "Set out again" put back (TEST-ONLY): the block-by-block exchange in a layout set out once is refused, by citation and by words.
    const perBlockExchange = renderConcreteGame({ ...fixture, layout: undefined }).instructions.find(i => i.section === ROLE_EXCHANGE && i.text.includes('set out again'))!
    const reMarked = q5(fixture, { ...rendered, instructions: rendered.instructions.map(i => (i === exchange ? perBlockExchange : i)) })
    assert.ok(reMarked.includes('the markings are set out once, and the exchange sentence citing the positions written for a role is the block-by-block one (it does not cite the layout)'), JSON.stringify(reMarked))
    assert.ok(reMarked.some(what => what.startsWith(`"${perBlockExchange.text}" tells the coach to set the markings out again at the exchange`)))
    const sameCitations = q5(fixture, { ...rendered, instructions: rendered.instructions.map(i => (i === exchange ? { ...i, text: `${i.text}, and set out again`, parts: undefined } : i)) })
    assert.ok(sameCitations.some(what => what.includes('tells the coach to set the markings out again at the exchange')), 'the words alone are refused too')
    // Without a layout Q5-L owes nothing (every game but one with his recorded choice).
    const plain = { ...fixture, layout: undefined }
    assert.deepEqual(q5(plain, renderConcreteGame(plain)), [])
})

test('8. the composition pairs the target sentences under the role pairing and the layout\'s axis mirror; a layout in one block pairs nothing', () => {
    const renders = blocks.map(block => ({ ...block, rendered: renderConcreteGame(block.fixture) }))
    const pairing = counterpartMap(renders[0], renders[1], index)
    assert.deepEqual([...pairing.entries()].filter(([from]) => from.startsWith('layout.')).sort(), [
        ['layout.marks[mark-1]', 'layout.marks[mark-3]'],
        ['layout.marks[mark-3]', 'layout.marks[mark-1]'],
        ['layout.zones[zone-1]', 'layout.zones[zone-2]'],
        ['layout.zones[zone-2]', 'layout.zones[zone-1]'],
    ])
    assert.deepEqual(served.rendered.instructions.filter(i => i.counterparts).map(i => i.text), [
        "The building team's target zone is everything beyond the marked line, up to the pressing team's end line, including the end zone there",
        PRESSING_TARGET_SENTENCE,
    ])
    // A layout carried by one block only empties the map: nothing pairs.
    assert.equal(counterpartMap(renders[0], { ...renders[1], fixture: bare(blocks[1]).fixture }, index).size, 0)
    // The 2C review's should-fix, closed here (a Q6 TIGHTENING): block 2's own sentence must bind its numbers as block 1's are, under the
    // pairing. TEST-ONLY: block 2's pressing-target sentence binds its 5 to the marked line instead of its own zone; the words and
    // citations still pair, so only the parts refuse it.
    const q6 = (from: typeof renders) => checkRoleBlockComposition(from, composeRoleBlockActivity(renders, index), index).filter(f => f.severity === 'VIOLATION').map(f => f.what)
    assert.deepEqual(q6(renders), [])
    const rebound = renders.map((entry, n) =>
        n === 1
            ? {
                  ...entry,
                  rendered: {
                      ...entry.rendered,
                      instructions: entry.rendered.instructions.map(i => (i.text === PRESSING_TARGET_SENTENCE ? { ...i, parts: i.parts!.map(p => ({ ...p, bindings: p.bindings.map(b => ({ ...b, path: `space.regions[${LINE}].position.along` })) })) } : i)),
                  },
              }
            : entry,
    )
    assert.ok(q6(rebound).includes(`"${PRESSING_TARGET_SENTENCE}": its parts in block ${blocks[1].blockId} do not say block ${blocks[0].blockId}'s words and numbers bound to their counterparts under the role pairing`), JSON.stringify(q6(rebound)))
})

test('9. the module names no goal, no value and no sport; "halfway" is said only where the line is at half the length', () => {
    const code = (file: string) =>
        fs
            .readFileSync(path.join(__dirname, file), 'utf8')
            .split('/*')
            .map((part, i) => (i === 0 ? part : part.slice(part.indexOf('*/') + 2)))
            .join(' ')
            .split('\n')
            .map(line => (line.trimStart().startsWith('//') ? '' : line.split(' // ')[0]))
            .join('\n')
    const source = code('physical-layout.ts')
    for (const word of ['A01', 'GF2', 'RPC-001', 'ADJ-', 'EMP-0011', 'BUILDING', 'PRESSING', String(ROLE)]) assert.ok(!source.includes(word), word)
    for (const value of ['40', '30', '20', '35']) assert.ok(!new RegExp(`[^0-9.]${value}[^0-9]`).test(source), value)
    for (const demonstration of MECHANISM_DEMONSTRATIONS) assert.ok(!source.includes(demonstration.id), demonstration.id)
    // The word is the renderer's, said in one template guarded by the values (2 x the line's position is the length).
    const renderer = code('render-concrete-game.ts')
    assert.equal(renderer.split('halfway').length - 1, 1)
    assert.ok(renderer.includes('once.at * 2 === areaLength'))
    assert.deepEqual(served.rendered.instructions.filter(i => i.text.includes('halfway')).map(i => i.from.filter(p => p === 'envelope.area.length_m' || p.endsWith('.position.along'))), [['space.regions[c:provisional:A01-R1:A01-R1-S2-1].position.along', 'envelope.area.length_m']])
})

console.log(`physical-layout.unit.ts — ${passed} passed`)
