/**
 * **The markings set out once wherever they occupy the same places; where they do not, the exchange says what moves** — stage 2D, 21
 * October 2026, made a general presentation rule by stage 2G (21 October 2026).
 *
 * Christian, reply filed 23 October 2026, item 2: *"Please authorize marking once whenever the system can establish that the physical
 * markings occupy the same locations across all blocks. This should be a general presentation rule, not something requiring my approval
 * for each configuration. If markings change location between blocks, the instructions should identify what needs to be adjusted. The
 * distinction between physical markings and role-specific scoring relationships must remain intact in the underlying knowledge."* It
 * supersedes the per-configuration record stage 2D read (MARK_UNION_ONCE for 40 × 30 m, his reply filed 22 October 2026, item 7).
 *
 * What is pinned here, on the real chain or on copies of what it built (TEST-ONLY lines are labelled):
 *
 *   1. A01 at 40 x 30 m, with no record of any choice: the marks are the union of both blocks' realized edges (5, 20, 35 m), admissible,
 *      carried by both blocks whole, resting on his general rule, with what moves a mark; RB-L passes; nothing moves at the exchange;
 *   2. TEST-ONLY blocks on a 50 x 30 m area (the line 20 m from the building team's end, so at 20 m in one block and 30 m in the other):
 *      inadmissible, why is said, and what moves is read: the marked line (with the edge of the target beyond it) and the end zone's mark;
 *   3. the stage 2D record is read by nothing: put back on a TEST-ONLY copy of the records, for 40 x 30 m or for another area, A01 reads
 *      exactly as production does;
 *   4. a TEST-ONLY offset that moves the line off half the length (15 m): built end to end, the markings are presented block by block and
 *      the exchange names each marking that moves and where it goes, from the layout difference;
 *   5. RB-L refuses a layout that is not the recomputed union, a block missing one, one carried where the markings do not coincide, and
 *      an account of what moves that is missing, altered, or carried where the markings are set out once;
 *   6. fidelity Q2 accepts a number bound to the layout only where the layout holds it there, at a leaf;
 *   7. Q5-L with a layout: every mark and zone said by Set up, each block's region denoted exactly once at the interval the layout records,
 *      a mark inert in one block justified by the block it is marked for; the exchange that re-marks nothing carries the moved-line
 *      qualification and cites the layout, and "set out again" put back is refused;
 *   8. Q5-L without a layout, where markings move (stage 2G): every marking that moves is named by the exchange, in words and citations;
 *      TEST-ONLY mutations (a part dropped, its words or citation stripped, the verb dropped, "nothing is re-marked" said, the block-by-block
 *      exchange put back, a place another marking shares) are refused;
 *   9. the composition pairs the target sentences under the role pairing and the layout's axis mirror, and Q6 refuses a pair whose block-2
 *      parts bind a number outside the pairing; with markings that move, the exchange is said once and Q6 passes;
 *  10. the module names no goal, no value and no sport, and quotes his item 2 as its authority; "halfway" is said only where the line is
 *      at half the length;
 *  11. hardening H1, stage 2G: where the markings stay block by block, an administrator is told why and which markings move, with no
 *      recorded choice named; the coach is told nothing of it.
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
import { LAYOUT_NUMBER_LEAVES, layoutLeafNumberAt, layoutMoversOf, layoutNumbersAt, layoutOf, MARK_ONCE_RULE, MARK_UNION_ONCE } from './physical-layout'
import { Instruction, MOVE_MARKINGS, MOVED_MARK_QUALIFICATIONS, NOTHING_RE_MARKED, renderConcreteGame, ROLE_EXCHANGE } from './render-concrete-game'
import { checkRoleBlockComposition, checkRoleBlockLayout, composeRoleBlockActivity, counterpartMap } from './role-blocks'
import { specializedRoleNames } from './session-envelope'

let passed = 0
function test(name: string, body: () => void): void {
    body()
    passed++
    console.log(`  ok  ${name}`)
}
console.log('the markings set out once wherever they occupy the same places (stage 2D, general since stage 2G)')

const ROLE = specializedRoleNames()[0]
const none = Object.fromEntries(specializedRoleNames().map(role => [role, 0]))
const session = { players: 12, lengthM: 40, widthM: 30, durationMin: 20, roles: { ...none, [ROLE]: 1 } }
const a01 = { kind: 'learning-goal' as const, goalId: 'A01', situationId: null, session }
const index = indexRegister(loadRegister())
const record = learningGoalAuthorization('A01')!
const movers = layoutMoversOf(record)
const built = buildActivityWithFixture(a01)
const served = built.activity as ServedActivity
type Block = { blockId: string; fixture: any }
const blocks: Block[] = ((built.fixture as any).roleBlocks.blocks as any[]).map(block => ({ blockId: block.blockId, fixture: block.fixture }))
/** A block as it was before the layout or what moves was attached. */
const bare = (entry: Block): Block => ({ blockId: entry.blockId, fixture: { ...entry.fixture, layout: undefined, remarking: undefined } })
const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value))
const LINE = 'c:provisional:A01-R1:A01-R1-S2-1'
const NEAR = 'c:restated:GF2:GF2-03.e'
const FAR = 'c:restated:GF2:GF2-03.f'
const along = (id: string) => `space.regions[${id}].position.along`
const PRESSING_TARGET_SENTENCE = "The pressing team's target zone is the 5 m end zone at the building team's end"
/** How the admin-only fact saying why the markings stay block by block opens (hardening H1). */
const FALLBACK = 'The markings are presented block by block'
/** His reply filed 23 October 2026, item 2, verbatim (the four sentences after "Yes."). */
const HIS_ITEM_2 =
    'Please authorize marking once whenever the system can establish that the physical markings occupy the same locations across all blocks. This should be a general presentation rule, not something requiring my approval for each configuration. If markings change location between blocks, the instructions should identify what needs to be adjusted. The distinction between physical markings and role-specific scoring relationships must remain intact in the underlying knowledge.'
/** His reply filed 22 October 2026, item 7, as stage 2D recorded it (the record his item 2 superseded). */
const HIS_ITEM_7 =
    'For this particular 40 × 30 m configuration, we can also simplify setup by marking the halfway line and both 5 m end zones at the beginning. Role exchanges should not require unnecessary physical re-marking. The knowledge can continue to represent the distinct targets and relationships for each block, even where the physical markings remain unchanged.'
/** The exchange sentence where the marked line and the end zone move (stage 2G, DRAFT). */
const MOVED_EXCHANGE =
    "Each team keeps its end for the whole activity. When you call the next block the teams exchange roles, not ends, and you move the marked line to the same distance from the new building team's end line and the pressing team's target zone to the new building team's end; there is no set block length"

/** TEST-ONLY: the marked line 15 m from the building team's end line (off half the length), on a copy of the contracts. */
const offsetFifteen = (contracts: LoadedContract[]) => {
    const item: any = contracts.find(contract => contract.contractId === 'provisional:A01-R1')!.items.find(entry => entry.itemId === 'A01-R1-S5-1')
    item.value = { ...item.value, offsetM: { from: 15, to: 15 }, asAuthored: 'TEST-ONLY 15 m from the building team\'s end line' }
}
const fifteen = buildActivityUnderAuthorizationRecords(a01, learningGoalAuthorizations(), { alter: offsetFifteen })
const fifteenServed = fifteen.activity as ServedActivity
const fifteenBlocks: Block[] = ((fifteen.fixture as any)?.roleBlocks?.blocks ?? []).map((block: any) => ({ blockId: block.blockId, fixture: block.fixture }))

test('1. A01 at 40 x 30 m, no record of any choice: the union of both blocks\' edges is 5, 20 and 35 m, admissible, carried whole; RB-L passes', () => {
    assert.equal(served.outcome, 'served')
    // No record is read: the goal's record holds no code or area, and the layout rests on his general rule.
    assert.ok((record.provisionalChoices ?? []).every(choice => !('value' in choice) && !('appliesTo' in choice)))
    assert.deepEqual(MARK_ONCE_RULE, { ruledOn: '2026-10-23', by: 'Christian', citedAs: 'his reply filed 23 October 2026, item 2', words: HIS_ITEM_2 })
    // What moves a mark: the adjustment of a position's magnitude for the building role (A01-ADJ-3, EMP-0011 Magnitude).
    assert.deepEqual(movers, [{ id: 'A01-ADJ-3', role: 'BUILDING' }])
    const decision = layoutOf(blocks.map(bare), movers)
    assert.equal(decision.applies, true, JSON.stringify(decision.why))
    assert.deepEqual([decision.why, decision.remarking], [[], null], 'set out once: nothing moves at the exchange')
    const layout = decision.layout!
    assert.equal(layout.policy, MARK_UNION_ONCE)
    assert.deepEqual(layout.because, MARK_ONCE_RULE)
    assert.deepEqual(layout.marks.map(mark => [mark.elementId, mark.at, mark.line]), [['mark-1', 5, null], ['mark-2', 20, LINE], ['mark-3', 35, null]])
    assert.deepEqual(layout.zones.map(zone => [zone.elementId, zone.from, zone.to, zone.depthM, zone.inner]), [['zone-1', 0, 5, 5, 'mark-1'], ['zone-2', 35, 40, 5, 'mark-3']])
    // Each zone is one block's own target: the near one block 1's pressing target, the far one block 2's.
    assert.deepEqual(layout.zones.map(zone => zone.sources.map(source => [source.blockId, source.regionId])), [[[blocks[0].blockId, NEAR]], [[blocks[1].blockId, FAR]]])
    assert.deepEqual(layout.movedBy, [{ elementId: 'A01-ADJ-3', mark: 'mark-2', line: LINE, role: 'BUILDING', forTeam: 'ROLE_HOLDER_BUILDING' }])
    // Each block's region intervals, as realized (his item 2: the knowledge keeps each block's own targets and relationships).
    for (const block of blocks) {
        for (const entry of layout.regions.filter(region => region.blockId === block.blockId)) {
            const interval = block.fixture.status.geometry.find((g: any) => g.path === entry.path).geometry.interval
            assert.deepEqual([entry.from, entry.to], [interval.from, interval.to], entry.path)
        }
    }
    // Carried whole by both blocks, with nothing moving; and RB-L recomputes exactly it.
    for (const block of blocks) {
        assert.deepEqual(block.fixture.layout, layout, block.blockId)
        assert.equal(block.fixture.remarking, undefined, block.blockId)
    }
    assert.deepEqual(checkRoleBlockLayout(blocks, movers), { checkId: 'RB-L', what: checkRoleBlockLayout(blocks, movers).what, verdict: 'PASS', problems: [] })
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
function onFiftyMetres(): Block[] {
    const geometry: Record<string, [number, number][]> = {
        [along(LINE)]: [[20, 20], [30, 30]],
        [along(NEAR)]: [[0, 5], [0, 30]],
        [along(FAR)]: [[20, 50], [45, 50]],
    }
    return blocks.map((block, n) => {
        const fixture = copy(bare(block).fixture)
        fixture.envelope.lengthM = 50
        fixture.game.envelope.area.length_m = 50
        for (const g of fixture.status.geometry) if (geometry[g.path]) g.geometry.interval = { from: geometry[g.path][n][0], to: geometry[g.path][n][1] }
        return { blockId: block.blockId, fixture }
    })
}

test('2. TEST-ONLY 50 x 30 m: inadmissible, why is said, and what moves is read from the blocks\' realized edges', () => {
    const decision = layoutOf(onFiftyMetres(), movers)
    assert.deepEqual([decision.applies, decision.layout], [false, null])
    assert.ok(decision.why.some(why => why.startsWith(`the line ${LINE} is not held at one position in every block`) && why.includes('so it would be re-marked at the exchange')), JSON.stringify(decision.why))
    // What moves: the marked line with the inner edge of the target that begins at it (one marking, 20 m then 30 m), and the end zone's
    // mark (5 m then 45 m): each named by what it is in each block, lines first.
    const changes = decision.remarking!.changes
    assert.deepEqual(changes.map(change => [change.elementId, change.places.map(place => place.at)]), [['change-1', [20, 30]], ['change-2', [5, 45]]])
    assert.deepEqual(changes[0].places.map(place => place.features.map(feature => [feature.regionId, feature.edge, feature.inner])), [
        [[LINE, 'at', false], [FAR, 'from', true]],
        [[LINE, 'at', false], [NEAR, 'to', true]],
    ])
    assert.deepEqual(changes[1].places.map(place => place.features.map(feature => [feature.regionId, feature.edge, feature.inner])), [[[NEAR, 'to', true]], [[FAR, 'from', true]]])
    assert.ok(changes.every(change => change.places.every(place => !place.shared)))
    // Named by role, the same in both blocks: the region a role's objective references (never a goal's or a sport's word).
    assert.deepEqual(changes.map(change => change.identities), [
        ['region c:provisional:A01-R1:A01-R1-S2-1, at', 'the region the BUILDING objective references, inner edge'],
        ['the region the PRESSING objective references, inner edge'],
    ])
    // A line held at one place in both blocks but not at half the length has no words, so it is inadmissible too (TEST-ONLY).
    const offCentre = blocks.map(bare).map(entry => {
        const fixture = copy(entry.fixture)
        for (const g of fixture.status.geometry) if (g.path === along(LINE)) g.geometry.interval = { from: 15, to: 15 }
        return { blockId: entry.blockId, fixture }
    })
    assert.ok(layoutOf(offCentre, movers).why.some(why => why.includes('not at half of it')))
    // Not played in role blocks: nothing to set out once and nothing moves, and no reason is owed.
    assert.deepEqual(layoutOf(blocks.slice(0, 1).map(bare), movers), { applies: false, layout: null, why: [], remarking: null })
    // Lines only on the end lines (TEST-ONLY: every region degenerate at an end): the area's own edges, so nothing is set out and none is owed a reason.
    const endLines = blocks.map(bare).map(entry => {
        const fixture = copy(entry.fixture)
        for (const g of fixture.status.geometry) {
            if (g.path === along(LINE) || g.path === along(NEAR)) g.geometry.interval = { from: 0, to: 0 }
            if (g.path === along(FAR)) g.geometry.interval = { from: 40, to: 40 }
        }
        return { blockId: entry.blockId, fixture }
    })
    assert.deepEqual(layoutOf(endLines, movers), { applies: false, layout: null, why: [], remarking: null })
})

test('3. the stage 2D record cannot come back: put back on a TEST-ONLY copy, the records\' gate refuses it; production needs none', () => {
    const withRecord = (appliesTo: { lengthM: number; widthM: number }): LearningGoalAuthorization[] => {
        const records = copy(learningGoalAuthorizations())
        const choices = records.find(entry => entry.learningGoalId === 'A01')!.provisionalChoices!
        choices.push({ ...copy(choices[choices.length - 1]), choice: 'TEST-ONLY: the stage 2D record', citedAs: 'his reply filed 22 October 2026, item 7', words: HIS_ITEM_7, value: MARK_UNION_ONCE, appliesTo } as any)
        return records
    }
    // For this area or another, the record is refused at selection by the records' own integrity gate, naming the field: no reader would
    // act on it, so it is never a silent second rule beside his general one.
    for (const appliesTo of [{ lengthM: 40, widthM: 30 }, { lengthM: 50, widthM: 30 }]) {
        const again = buildActivityUnderAuthorizationRecords(a01, withRecord(appliesTo)).activity as any
        assert.deepEqual([again.outcome, again.stage], ['refused', 'selection'], JSON.stringify(appliesTo))
        assert.ok((again.reasons as string[]).some(reason => reason.includes('carries a code or an area a reader would act on (value, appliesTo)')), JSON.stringify(again.reasons))
    }
    // Production, with no such record, sets the markings out once (test 1), and the same records copied unchanged build the same activity.
    const unchanged = buildActivityUnderAuthorizationRecords(a01, copy(learningGoalAuthorizations())).activity as ServedActivity
    assert.deepEqual(unchanged.rendered.instructions, served.rendered.instructions)
    assert.ok(served.rendered.instructions.some(i => i.text === 'Mark a line across the area at halfway, 20 m from each end line'))
    assert.ok(served.rendered.instructions.some(i => i.text === 'Mark a 5 m end zone across the full width at each end'))
    // The served demonstrations hold no layout and read as before: no role blocks.
    for (const demonstration of MECHANISM_DEMONSTRATIONS) {
        const demo = buildActivityWithFixture({ kind: 'mechanism-demonstration', demonstrationId: demonstration.id, session: { ...session, roles: none } })
        assert.equal((demo.fixture as any)?.layout, undefined, demonstration.id)
        assert.equal((demo.fixture as any)?.remarking, undefined, demonstration.id)
        if (demo.activity.outcome === 'served') assert.ok(!(demo.activity as ServedActivity).rendered.instructions.some(i => i.from.some(p => p.startsWith('layout.') || p.startsWith('remarking.'))), demonstration.id)
    }
})

test('4. TEST-ONLY: the line 15 m from the building team\'s end is presented block by block, and the exchange names what moves and where', () => {
    assert.equal(fifteenServed.outcome, 'served', JSON.stringify((fifteenServed as any).reasons))
    const texts = fifteenServed.rendered.instructions.map(i => i.text)
    // The markings per block, said by role (each block's own).
    for (const text of [
        "Mark a line across the area, 15 m from the building team's end line",
        "Mark the pressing team's target zone at the building team's end, 5 m deep, across the full width",
        "Mark the building team's target zone from the marked line to the pressing team's end line, across the full width",
    ]) {
        assert.ok(texts.includes(text), `${text}: ${JSON.stringify(texts)}`)
    }
    assert.ok(!texts.some(text => text.includes('halfway')), 'a moved line never prints "halfway"')
    assert.ok(!texts.some(text => text.includes(NOTHING_RE_MARKED)), 'nor that nothing is re-marked')
    assert.ok(!texts.some(text => text.includes('set out again for the new roles')), 'nor leaves the coach to work out what is set out again')
    assert.ok(!fifteenServed.rendered.instructions.some(i => i.from.some(p => p.startsWith('layout.'))))
    // The exchange says each marking that moves and where it goes, once for both blocks.
    const exchange = fifteenServed.rendered.instructions.filter(i => i.section === ROLE_EXCHANGE && i.from.some(p => p.startsWith('remarking.')))
    assert.deepEqual(exchange.map(i => i.text), [MOVED_EXCHANGE])
    assert.equal(exchange[0].block, undefined)
    assert.deepEqual(exchange[0].parts!.map(part => part.text), [
        'Each team keeps its end for the whole activity. When you call the next block the teams exchange roles, not ends',
        `, and ${MOVE_MARKINGS}the marked line to the same distance from the new building team's end line`,
        " and the pressing team's target zone to the new building team's end",
        '; there is no set block length',
    ])
    const [, line, zone] = exchange[0].parts!
    assert.ok(['remarking.changes[change-1]', along(LINE), along(FAR), `space.regions[${LINE}].noun`].every(p => line.from.includes(p)), JSON.stringify(line.from))
    assert.ok(['remarking.changes[change-2]', along(NEAR), `space.regions[${NEAR}].noun`].every(p => zone.from.includes(p)), JSON.stringify(zone.from))
    assert.deepEqual([line.quantities, zone.quantities], [[], []], 'no number: the distance is the Set up sentence\'s')
    // Every block carries exactly what the general rule reads from the blocks; RB-L passes; nothing refused.
    assert.equal(fifteenBlocks.length, 2)
    const decision = layoutOf(fifteenBlocks.map(bare), movers)
    assert.equal(decision.applies, false)
    for (const block of fifteenBlocks) {
        assert.deepEqual(block.fixture.remarking, decision.remarking, block.blockId)
        assert.equal(block.fixture.layout, undefined, block.blockId)
    }
    assert.deepEqual(decision.remarking!.changes.map(change => change.places.map(place => place.at)), [[15, 25], [5, 35]])
    assert.deepEqual(fifteenServed.roleBlocks!.checks.slice(-1).map(check => [check.checkId, check.verdict]), [['RB-L', 'PASS']])
    assert.equal(fifteenServed.integrity.fidelityViolations, 0)
    // Why stays an administrator's (test 11), never in the account a coach can expand.
    assert.ok(!fifteenServed.rendered.coachingObservations.some(o => o.startsWith(FALLBACK)), JSON.stringify(fifteenServed.rendered.coachingObservations))
})

test('5. RB-L refuses a layout or an account of what moves that is not the recomputed one, missing, or carried where it does not apply', () => {
    const verdict = (from: Block[]) => checkRoleBlockLayout(from, movers)
    const changed = (from: Block[], key: 'layout' | 'remarking', change: (value: any) => void) =>
        from.map((block, n) => {
            const fixture = { ...block.fixture, [key]: copy(block.fixture[key]) }
            if (n === 0) change(fixture[key])
            return { blockId: block.blockId, fixture }
        })
    const moved = verdict(changed(blocks, 'layout', layout => (layout.marks[0].at = 6)))
    assert.equal(moved.verdict, 'FAIL')
    assert.deepEqual(moved.problems, [`block ${blocks[0].blockId} carries a layout that is not the union of every block's realized edges, recomputed from the blocks`])
    assert.equal(verdict(changed(blocks, 'layout', layout => (layout.zones[1].depthM = 6))).verdict, 'FAIL')
    assert.equal(verdict(changed(blocks, 'layout', layout => (layout.movedBy = []))).verdict, 'FAIL', 'what an adjustment moves is part of the layout')
    const missing = verdict([blocks[0], bare(blocks[1])])
    assert.deepEqual(missing.problems, [`block ${blocks[1].blockId} carries no layout, and every block's markings occupy the same places, so they are set out once`])
    // A layout carried where the markings do not coincide (TEST-ONLY: production's layout put on the 15 m blocks).
    const misplaced = verdict(fifteenBlocks.map((block, n) => ({ blockId: block.blockId, fixture: { ...block.fixture, layout: blocks[n].fixture.layout } })))
    assert.equal(misplaced.verdict, 'FAIL')
    assert.ok(misplaced.problems.some(problem => problem.startsWith(`block ${fifteenBlocks[0].blockId} carries a layout, and the markings cannot be set out once here: the line ${LINE} is not held at one position in every block`)), JSON.stringify(misplaced.problems))
    // Stage 2G: what moves at the exchange, held the same way.
    assert.equal(verdict(fifteenBlocks).verdict, 'PASS')
    assert.deepEqual(verdict([fifteenBlocks[0], { blockId: fifteenBlocks[1].blockId, fixture: { ...fifteenBlocks[1].fixture, remarking: undefined } }]).problems, [
        `block ${fifteenBlocks[1].blockId} carries no account of what moves at the exchange, and the markings move between the blocks`,
    ])
    const altered = verdict(changed(fifteenBlocks, 'remarking', remarking => (remarking.changes = remarking.changes.slice(0, 1))))
    assert.deepEqual(altered.problems, [`block ${fifteenBlocks[0].blockId} carries an account of what moves at the exchange that is not the one every block's realized edges give, recomputed from the blocks`])
    const beside = verdict(blocks.map((block, n) => ({ blockId: block.blockId, fixture: { ...block.fixture, remarking: fifteenBlocks[n].fixture.remarking } })))
    assert.ok(beside.problems.includes(`block ${blocks[0].blockId} carries an account of what moves at the exchange, and the markings are set out once`), JSON.stringify(beside.problems))
    assert.equal(verdict(blocks.map(bare)).verdict, 'FAIL', 'a layout that applies must be carried')
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

    /*
     * Hardening H3, 21 October 2026 (the 2D review's should-fix 4), a TIGHTENING: a number of the layout is admitted only through a LEAF
     * path holding it (a mark's `at`, a zone's `from`, `to` or `depthM`). Before, every number held anywhere under the cited path was.
     * Re-pointed 21 October 2026 (stage 2G): the layout no longer carries a recorded area under `layout.because` (it carries his general
     * rule, which holds no number), so the broad nodes holding 40 and 30 are the layout's own length and width.
     */
    assert.deepEqual(LAYOUT_NUMBER_LEAVES, { marks: ['at'], zones: ['from', 'to', 'depthM'] })
    for (const block of blocks) assert.deepEqual(q2(block.fixture, renderConcreteGame(block.fixture)), [], `production passes in block ${block.blockId}`)
    assert.deepEqual(layoutLeafNumberAt(fixture.layout, 'layout.zones[zone-2].to'), [40])
    assert.deepEqual(layoutLeafNumberAt(fixture.layout, 'layout.marks[mark-2].at'), [20])
    for (const broad of ['layout.because', 'layout.lengthM', 'layout.widthM', 'layout.zones[zone-2]', 'layout.zones', 'layout.regions', 'layout', 'layout.zones[zone-2].sources']) {
        assert.deepEqual(layoutLeafNumberAt(fixture.layout, broad), [], broad)
    }
    assert.deepEqual(layoutNumbersAt(fixture.layout, 'layout.because'), [], 'his rule holds no number')
    assert.deepEqual([layoutNumbersAt(fixture.layout, 'layout.lengthM'), layoutNumbersAt(fixture.layout, 'layout.widthM')], [[40], [30]])
    // TEST-ONLY sentences, each binding its number to the path it cites (a Set up sentence copied from the end-zone one).
    const said = (text: string, quantity: number, path: string): Instruction => ({
        ...zones,
        text,
        from: [path],
        quantities: [quantity],
        parts: [{ ...zones.parts![0], text, from: [path], quantities: [quantity], bindings: [{ quantity, path }] }],
    })
    const withSentence = (instruction: Instruction) => ({ ...rendered, instructions: [...rendered.instructions, instruction] })
    for (const [text, quantity, path] of [
        ['TEST-ONLY: the area set out once is 40 m long', 40, 'layout.lengthM'],
        ['TEST-ONLY: the area set out once is 30 m wide', 30, 'layout.widthM'],
        ['TEST-ONLY: the far end zone reaches 40 m', 40, 'layout.zones[zone-2]'],
    ] as [string, number, string][]) {
        const findings = q2(fixture, withSentence(said(text, quantity, path))).map(f => f.what)
        assert.deepEqual(findings, [`"${text}" binds ${quantity} to ${path}, and that is not a number of that property as a ${zones.parts![0].status} statement may say it`], `${path}: ${JSON.stringify(findings)}`)
    }
    // Cited at its leaf, the same number is admitted.
    assert.deepEqual(q2(fixture, withSentence(said('TEST-ONLY: the far end zone reaches 40 m', 40, 'layout.zones[zone-2].to'))), [])
})

test('7. Q5-L with a layout: every mark and zone said, each region denoted once where the layout records it, inert marks justified, the qualified exchange', () => {
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
    assert.ok(twice.includes(`${along(NEAR)} is denoted by 2 Set up sentences in a layout set out once, not exactly one`), JSON.stringify(twice))
    // (c) The layout recording another interval for this block's region (TEST-ONLY): the words would contradict the game.
    const recordedElsewhere = { ...fixture, layout: copy(fixture.layout) }
    recordedElsewhere.layout.regions.find((r: any) => r.blockId === blocks[0].blockId && r.path.includes('GF2-03.e')).to = 6
    assert.ok(q5(recordedElsewhere, rendered).some(what => what.startsWith(`${along(NEAR)} is realized at 0-5 m`) && what.endsWith('records 0-6 m for it there')))
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
    /*
     * (e2) Hardening H2, 21 October 2026 (the 2D review's should-fix 2), a lexicon TIGHTENING: the words taken out and the citation of what
     * moves the mark KEPT (TEST-ONLY). Before, only citations were read and this passed. The words are the renderer's constants, so the test
     * removes exactly what the renderer says.
     */
    assert.ok(exchange.text.includes(`${NOTHING_RE_MARKED}${MOVED_MARK_QUALIFICATIONS.the}`))
    const wordsOnly = (words: string) =>
        rendered.instructions.map(i => (i === exchange ? { ...i, text: i.text.replace(MOVED_MARK_QUALIFICATIONS.the, words), parts: i.parts!.map(p => ({ ...p, text: p.text.replace(MOVED_MARK_QUALIFICATIONS.the, words) })) } : i))
    const stripped = wordsOnly('')
    const strippedExchange = stripped.find(i => i.section === ROLE_EXCHANGE && i.from.includes('layout.policy'))!
    assert.ok(strippedExchange.from.includes('layout.movedBy[A01-ADJ-3]'), 'the citation is kept')
    assert.deepEqual(q5(fixture, { ...rendered, instructions: stripped }), [`"${strippedExchange.text}" says nothing is re-marked without the qualification an adjustment that moves a mark set out once owes it (A01-ADJ-3)`])
    // The renderer's other qualification is the qualification too; and where nothing moves a mark, "nothing is re-marked" owes none.
    assert.deepEqual(q5(fixture, { ...rendered, instructions: wordsOnly(MOVED_MARK_QUALIFICATIONS.a) }), [])
    const unmoved = { ...fixture, layout: { ...copy(fixture.layout), movedBy: [] } }
    const unmovedRendered = renderConcreteGame(unmoved)
    assert.ok(unmovedRendered.instructions.some(i => i.section === ROLE_EXCHANGE && i.text.includes(`${NOTHING_RE_MARKED};`)), 'said without the qualification')
    assert.deepEqual(q5(unmoved, unmovedRendered), [])
    // The words are typed once, in the renderer: neither fidelity nor the renderer's sentence code spells them again (MOVE_MARKINGS since 2G).
    const fidelitySource = fs.readFileSync(path.join(__dirname, 'fidelity.ts'), 'utf8')
    const rendererSource = fs.readFileSync(path.join(__dirname, 'render-concrete-game.ts'), 'utf8')
    const tick = String.fromCharCode(96)
    for (const words of [NOTHING_RE_MARKED, MOVE_MARKINGS, ...Object.values(MOVED_MARK_QUALIFICATIONS)]) {
        assert.ok(!fidelitySource.includes(`'${words}`) && !fidelitySource.includes(`${tick}${words}`), `fidelity.ts types "${words}"`)
        assert.equal(rendererSource.split(`'${words}'`).length - 1, 1, `render-concrete-game.ts types "${words}" once`)
    }
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
    // Without a layout or anything that moves, Q5-L owes nothing.
    const plain = { ...fixture, layout: undefined }
    assert.deepEqual(q5(plain, renderConcreteGame(plain)), [])
})

test('8. Q5-L where markings move (stage 2G): each is named at the exchange; TEST-ONLY mutations of the naming are refused', () => {
    const q5 = (fx: any, r: any) => checkFidelity(fx, r).findings.filter(f => f.question === 5 && f.severity === 'VIOLATION').map(f => f.what)
    for (const block of fifteenBlocks) assert.deepEqual(q5(block.fixture, renderConcreteGame(block.fixture)), [], block.blockId)
    const [{ fixture }] = fifteenBlocks
    const rendered = renderConcreteGame(fixture)
    const exchange = rendered.instructions.find(i => i.section === ROLE_EXCHANGE && i.from.some(p => p.startsWith('remarking.')))!
    assert.equal(exchange.text, MOVED_EXCHANGE)
    /** The exchange rebuilt from parts (TEST-ONLY), the way the renderer joins them. */
    const rebuilt = (parts: NonNullable<Instruction['parts']>): Instruction => ({ ...exchange, text: parts.map(p => p.text).join(''), from: [...new Set(parts.flatMap(p => p.from))], quantities: parts.flatMap(p => p.quantities), parts })
    const replaced = (instruction: Instruction) => ({ ...rendered, instructions: rendered.instructions.map(i => (i === exchange ? instruction : i)) })
    const [opening, line, zone, closing] = exchange.parts!
    const unnamed = (id: string) => `the marking remarking.changes[${id}] (`
    // (a) The end zone's part dropped: that marking moves and nothing names it.
    const noZone = q5(fixture, replaced(rebuilt([opening, line, closing])))
    assert.equal(noZone.length, 1, JSON.stringify(noZone))
    assert.ok(noZone[0].startsWith(unnamed('change-2')) && noZone[0].endsWith(`moves at the exchange, and no Role exchange sentence names it and where it goes in block ${fifteenBlocks[0].blockId}`), noZone[0])
    // The counter-proof: read without the account of what moves (TEST-ONLY), the same dropped part passes every Q5 rule, so it is this
    // check that refuses it.
    assert.deepEqual(q5({ ...fixture, remarking: undefined }, replaced(rebuilt([opening, line, closing]))), [])
    // (b) Its words lose the noun of what moves (citations kept).
    assert.ok(q5(fixture, replaced(rebuilt([opening, line, { ...zone, text: " and the pressing team's target to the new building team's end" }, closing]))).some(what => what.startsWith(unnamed('change-2'))))
    // (c) Its citation of the move dropped (words kept), or of the region edge that is it in this block.
    assert.ok(q5(fixture, replaced(rebuilt([opening, line, { ...zone, from: zone.from.filter(p => !p.startsWith('remarking.')) }, closing]))).some(what => what.startsWith(unnamed('change-2'))))
    assert.ok(q5(fixture, replaced(rebuilt([opening, { ...line, from: line.from.filter(p => p !== along(FAR)) }, zone, closing]))).some(what => what.startsWith(unnamed('change-1'))))
    // (d) The coach is not told to move them.
    const noVerb = q5(fixture, replaced(rebuilt([opening, { ...line, text: line.text.replace(MOVE_MARKINGS, '') }, zone, closing])))
    assert.deepEqual(noVerb.map(what => what.endsWith('names markings that move at the exchange without telling the coach to move them')), [true], JSON.stringify(noVerb))
    // (e) "Nothing is re-marked" said while markings move.
    const contradicted = q5(fixture, replaced(rebuilt([opening, line, zone, { ...closing, text: `; ${NOTHING_RE_MARKED}${closing.text}` }])))
    assert.ok(contradicted.some(what => what.endsWith(`says ${NOTHING_RE_MARKED}, and markings move at the exchange`)), JSON.stringify(contradicted))
    // (f) The block-by-block exchange of stage 2D put back ("... set out again for the new roles"): neither marking is named.
    const before = renderConcreteGame({ ...fixture, remarking: undefined }).instructions.find(i => i.section === ROLE_EXCHANGE && i.text.includes('set out again'))!
    assert.deepEqual(q5(fixture, replaced(before)).map(what => what.slice(0, unnamed('change-1').length)), [unnamed('change-1'), unnamed('change-2')])
    // (g) A place another marking that does not move shares (TEST-ONLY): the mark there must stay, so the renderer cannot say "move" it and
    // fidelity refuses rather than leave it unsaid.
    const shared = { ...fixture, remarking: copy(fixture.remarking) }
    shared.remarking.changes[1].places.forEach((place: any) => (place.shared = true))
    const sharedRendered = renderConcreteGame(shared)
    assert.ok(!sharedRendered.instructions.some(i => i.text.includes("the pressing team's target zone to the new")))
    assert.ok(q5(shared, sharedRendered).some(what => what.startsWith(unnamed('change-2'))))
    // (h) A layout and moves together exclude each other.
    assert.ok(q5({ ...fixture, layout: blocks[0].fixture.layout }, rendered).includes('the fixture carries both the markings set out once and markings that move at the exchange'))
})

test('9. the composition pairs the target sentences under the role pairing and the layout\'s axis mirror; moved markings are said once', () => {
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
    // The 2C review's should-fix, closed in 2D (a Q6 TIGHTENING): block 2's own sentence must bind its numbers as block 1's are, under the
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
                      instructions: entry.rendered.instructions.map(i => (i.text === PRESSING_TARGET_SENTENCE ? { ...i, parts: i.parts!.map(p => ({ ...p, bindings: p.bindings.map(b => ({ ...b, path: along(LINE) })) })) } : i)),
                  },
              }
            : entry,
    )
    assert.ok(q6(rebound).includes(`"${PRESSING_TARGET_SENTENCE}": its parts in block ${blocks[1].blockId} do not say block ${blocks[0].blockId}'s words and numbers bound to their counterparts under the role pairing`), JSON.stringify(q6(rebound)))
    // Stage 2G: with markings that move, both blocks say the exchange in the same words, citing each its own regions, and Q6 passes.
    const moving = fifteenBlocks.map(block => ({ ...block, rendered: renderConcreteGame(block.fixture) }))
    const composed = composeRoleBlockActivity(moving, index)
    assert.deepEqual(checkRoleBlockComposition(moving, composed, index).filter(f => f.severity === 'VIOLATION'), [])
    assert.deepEqual(composed.instructions.filter(i => i.text === MOVED_EXCHANGE).length, 1)
    // Each block's own part names its own region for the same marking: the far target's edge in one block, the near one's in the other.
    const lineParts = moving.map(entry => entry.rendered.instructions.find(i => i.text === MOVED_EXCHANGE)!.parts![1].from.filter(p => p === along(NEAR) || p === along(FAR)))
    assert.deepEqual(lineParts, [[along(FAR)], [along(NEAR)]])
})

test('10. the module names no goal, no value and no sport, and quotes his item 2; "halfway" is said only where the line is at half the length', () => {
    const raw = fs.readFileSync(path.join(__dirname, 'physical-layout.ts'), 'utf8')
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
    for (const value of ['40', '30', '20', '35', '15', '5']) assert.ok(!new RegExp(`[^0-9.]${value}[^0-9]`).test(source), value)
    for (const demonstration of MECHANISM_DEMONSTRATIONS) assert.ok(!source.includes(demonstration.id), demonstration.id)
    // His item 2 is the module's authority: quoted in its doc comment and carried, verbatim, as the rule the layout rests on.
    assert.ok(raw.includes('The authority is Christian\'s reply filed 23 October 2026, item 2:'))
    assert.ok(raw.includes(' *   > *"Please authorize marking once whenever the system can establish that the physical markings occupy the same locations across all'))
    assert.equal(MARK_ONCE_RULE.words, HIS_ITEM_2)
    // No recorded choice is read: the module reads no authorization record's provisional choices.
    assert.ok(!source.includes('provisionalChoices') && !source.includes('appliesTo'))
    // The word is the renderer's, said in one template guarded by the values (2 x the line's position is the length).
    const renderer = code('render-concrete-game.ts')
    assert.equal(renderer.split('halfway').length - 1, 1)
    assert.ok(renderer.includes('once.at * 2 === areaLength'))
    assert.deepEqual(served.rendered.instructions.filter(i => i.text.includes('halfway')).map(i => i.from.filter(p => p === 'envelope.area.length_m' || p.endsWith('.position.along'))), [[along(LINE), 'envelope.area.length_m']])
})

test('11. hardening H1, stage 2G: where the markings stay block by block, an administrator is told why and which move; the coach nothing', () => {
    // The same altered build twice: as a coach's answer, and as an administrator's review asks it.
    const coach = fifteenServed
    const admin = buildActivityUnderAuthorizationRecords(a01, learningGoalAuthorizations(), { alter: offsetFifteen, review: { includeDrafts: true } }).activity as ServedActivity
    assert.deepEqual([coach.outcome, admin.outcome], ['served', 'served'])
    // The administrator: the admin-only evidence says why and which markings move, naming no recorded choice.
    const said = admin.evidence!.sections.roleExchange.filter(fact => fact.what.startsWith(FALLBACK))
    assert.equal(said.length, 1)
    assert.equal(said[0].what, `${FALLBACK}, because they do not occupy the same places in every block`)
    const why = said[0].value as string[]
    assert.ok(why.some(entry => entry.startsWith(`the line ${LINE} is not held at one position in every block (15-15 m in block`)), JSON.stringify(why))
    assert.ok(why.some(entry => entry.startsWith('change-1 moves: at 15 m in block ') && entry.includes(`at 25 m in block ${fifteenBlocks[1].blockId}`)), JSON.stringify(why))
    assert.ok(why.some(entry => entry.startsWith('change-2 moves: at 5 m in block ') && entry.includes(`at 35 m in block ${fifteenBlocks[1].blockId}`)), JSON.stringify(why))
    assert.ok(!JSON.stringify(said).includes('recorded choice') && !JSON.stringify(said).includes(MARK_UNION_ONCE))
    // The coach: nothing of it anywhere in the answer — not the sentence, not any reason it gives.
    const answer = JSON.stringify(coach)
    assert.ok(!('evidence' in coach))
    assert.ok(!answer.includes(FALLBACK))
    for (const entry of why) assert.ok(!answer.includes(entry), entry)
    assert.ok(!coach.rendered.coachingObservations.some(o => o.includes('set out once')), JSON.stringify(coach.rendered.coachingObservations))
    // Nor in the activity the administrator is served: only the evidence beside it says it; the two answers differ by the evidence alone
    // (and, since stage 3A, the admin-only overview draft).
    assert.ok(!JSON.stringify(admin.rendered).includes(FALLBACK))
    const { evidence: _evidence, overviewDraft: _overview, ...rest } = admin
    assert.ok(_overview && !('overviewDraft' in coach))
    assert.deepEqual(rest, coach)
    // The provenance of the moving marks: his general rule, a general mechanism, and our reading of the blocks' edges.
    const instruction = admin.evidence!.sections.instructions.find(entry => entry.text === MOVED_EXCHANGE)!
    assert.ok(instruction.sources.some(source => source.layer === 'GENERAL_ENGINE_MECHANISM' && source.standing === 'APPROVED' && source.detail === 'his reply filed 23 October 2026, item 2'), JSON.stringify(instruction.sources))
    assert.ok(instruction.sources.some(source => source.standing === 'OUR_READING' && String(source.detail).includes('remarking.changes[change-1] = 15 m')), JSON.stringify(instruction.sources))
    // Production (the markings set out once at 40 x 30 m): no such fact.
    const production = buildActivityUnderAuthorizationRecords(a01, learningGoalAuthorizations(), { review: { includeDrafts: true } }).activity as ServedActivity
    assert.ok(!production.evidence!.sections.roleExchange.some(fact => fact.what.startsWith(FALLBACK)))
})

console.log(`physical-layout.unit.ts — ${passed} passed`)
