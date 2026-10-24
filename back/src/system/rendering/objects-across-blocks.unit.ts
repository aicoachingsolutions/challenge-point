/**
 * Objects across role blocks, the layout and the exchange sentence — stage C, 23 October 2026 (the design's Stage C, shared by his priorities
 * 3 and 5; findings T19 and T34).
 *
 * Christian, reply filed 25 October 2026, item 3: *"The goal should be positioned at the building team's end."* and his reply filed 23
 * October 2026, item 2: *"Please authorize marking once whenever the system can establish that the physical markings occupy the same
 * locations across all blocks. [...] If markings change location between blocks, the instructions should identify what needs to be
 * adjusted."* Until this stage the cross-block checks and the physical layout read regions only, so a goal moving from one end line to the
 * other between the blocks passed RB-1 to RB-8, RB-M, RB-L and every gate while the exchange said nothing is re-marked (T19, measured before
 * this stage on the same TEST-ONLY build as test 3 here).
 *
 * What is pinned here:
 *   1. production A01 (the zone version, A01-R1) at 12/1, 12/2 and 11/1: the layout is exactly what it was (no objects key), no account of
 *      what moves, every cross-block check passing with its description unchanged, the exchange sentence unchanged;
 *   2. RB-1 compares the objects (O1): an object one block holds and the other does not is refused; RB-3 reads "two targets (a region or an
 *      object)": an object target the game holds passes, a reference naming nothing is refused;
 *   3. a TEST-ONLY UNREFERENCED goal that moves between the blocks is now listed (what moves, per block, and the admin evidence) and refused
 *      (fidelity Q5-L: no exchange sentence names it), and the layout no longer applies;
 *   4. a TEST-ONLY goal fixed at one end is set out once (`layout.objects`), RB-L recomputes it, and Q5-L holds the projection to the game
 *      and to a Set up sentence (Stage G's words do not exist, so it is refused there too);
 *   5. layoutOf on TEST-ONLY copies: an object in one block only, an object placed on one axis only; T34: a line held off half the length
 *      but measured from the same end line in every block is set out once, its sentence cites its mark, and the move-the-line adjustment
 *      moves nothing at the exchange;
 *   6. the exchange says only what actually moves: with nothing moving the account is given empty, the sentence names nothing and says
 *      nothing is set out again, and fidelity refuses "set out again" there; a moving object is accepted only where a part names it.
 *   7. (the stage C review fixes, 23 October 2026) words are read whole (`saysWord`), and a role block positioning an object while carrying
 *      neither the layout nor an account of what moves is refused. Also from that review: in 4, the object set out once is told by exactly
 *      one Set up sentence, citing the layout's object (a second, per-block sentence is refused); in 2, an object a role-keyed selector
 *      created is a third target; in 6, the empty-account sentence says what the markings written for the roles mean.
 *
 * Every goal value here (the goal, its width, its placement) is TEST-ONLY and in memory: no production file is written, nothing here is served,
 * and nothing is knowledge for the goal version (his decisions D1-D5 of the note sent to him).
 *
 * Run: npx ts-node --files -r tsconfig-paths/register ./src/system/rendering/objects-across-blocks.unit.ts
 */
import assert from 'node:assert/strict'

import { loadRegister } from '../derivation/corpus'
import { indexRegister } from '../derivation/register'
import { ContractItem } from '../derivation/types'
import { learningGoalAuthorization, learningGoalAuthorizations } from '../test-library/learning-goal-authorizations'
import { buildActivityUnderAuthorizationRecords, buildActivityWithFixture, RefusedActivity, ServedActivity } from './build-activity'
import { checkFidelity, saysWord } from './fidelity'
import { layoutMoversOf, layoutOf, Remarking, remarkingSummary } from './physical-layout'
import { Instruction, MOVE_MARKINGS, NOTHING_RE_MARKED, renderConcreteGame, ROLE_EXCHANGE, roleKeyedPositions } from './render-concrete-game'
import { checkRoleBlockLayout, checkRoleBlocks } from './role-blocks'
import { specializedRoleNames } from './session-envelope'

let passed = 0
function test(name: string, body: () => void): void {
    body()
    passed++
    console.log(`  ok  ${name}`)
}
console.log('objects across role blocks, the layout and the exchange sentence (stage C)')

const index = indexRegister(loadRegister())
const roles = index.roleBlocks!.roles
const KEEPER = specializedRoleNames()[0]
const none = Object.fromEntries(specializedRoleNames().map(role => [role, 0]))
const sessionOf = (extra: Record<string, unknown> = {}) => ({ players: 12, lengthM: 40, widthM: 30, durationMin: 20, roles: { ...none, [KEEPER]: 1 }, ...extra })
const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value))
const movers = layoutMoversOf(learningGoalAuthorization('A01'))
type Block = { blockId: string; fixture: any }
const blocksOf = (fixture: any): Block[] => ((fixture?.roleBlocks?.blocks ?? []) as any[]).map(block => ({ blockId: block.blockId, fixture: block.fixture }))
const bare = (entry: Block): Block => ({ blockId: entry.blockId, fixture: { ...copy(entry.fixture), layout: undefined, remarking: undefined } })
const P = 'provisional:A01-R1'
const LINE = `c:${P}:A01-R1-S2-1`
const NEAR = 'c:restated:GF2:GF2-03.e'
const FAR = 'c:restated:GF2:GF2-03.f'
const GOAL = `c:${P}:TEST-GOAL`
const along = (id: string) => `space.regions[${id}].position.along`
const q5 = (fixture: any, rendered: any) => checkFidelity(fixture, rendered).findings.filter(f => f.question === 5 && f.severity === 'VIOLATION').map(f => f.what)
/** The descriptions every cross-block check gave before this stage (production reads them unchanged). */
const RB1_WHAT = 'the same regions, objectives, transitions, primary event, conditions and teams in both blocks'
const RB3_WHAT = 'two objectives of the scoring role and two target regions in each block, and no region a role-keyed selector created'
/** The layout's keys before this stage: production's layout gains none. */
const LAYOUT_KEYS = ['because', 'lengthM', 'marks', 'movedBy', 'policy', 'regions', 'widthM', 'zones']
const PRODUCTION_EXCHANGE =
    'Each team keeps its end for the whole activity. When you call the next block the teams exchange roles, not ends: each team now attacks the target zone of its new role, and nothing is re-marked unless you have moved the marked line; there is no set block length'

/** TEST-ONLY items, never production data. */
const testItem = (itemId: string, row: string, selector: string, requirement: string, value: unknown): ContractItem =>
    ({
        itemId,
        row,
        selector,
        requirement,
        value,
        valueStatus: requirement === 'EXISTS' ? 'N/A' : 'REQUIRED_RANGE',
        strictness: 'REQUIRED',
        scope: 'WHOLE_GAME',
        basis: 'OWNER_RULING',
        checkability: 'STRUCTURAL',
        structuralClause: 'whole item',
        category: 'PROVISIONAL_REALIZATION_CHOICE',
        choice: 'TEST-ONLY',
        words: 'TEST-ONLY',
        citedAs: 'TEST-ONLY',
        basisEvidence: 'TEST-ONLY',
        fitNote: 'TEST-ONLY',
    }) as unknown as ContractItem
/**
 * Production A01 with one TEST-ONLY goal no objective references, on the end line the named team defends, centred, 5 m wide (a width the
 * session states, TEST-ONLY). The building role's holder changes ends between the blocks under fixed ends, so the goal moves with it; the
 * team at the axis start does not, so the goal stays.
 */
/**
 * Re-pointed 23 October 2026 (stage E, register version 19): the width the session states is now its statement of its goals (`objects`, one
 * 5 m goal, TEST-ONLY), the one source of an object's width, and the availability rule holds the game's goal to it - so the realization
 * carries a TEST-ONLY suitability for the kind (his decision 4 is open: without one no goal suits, and the build is refused before
 * realization, as `session-resources.unit.ts` shows).
 */
const TEST_SUITABILITY = [{ kind: 'goal', widthM: { min: 1, max: 10 }, ruledOn: 'TEST-ONLY', by: 'TEST-ONLY', citedAs: 'TEST-ONLY', words: ['TEST-ONLY'] }]
const withGoal = (team: string) =>
    buildActivityUnderAuthorizationRecords({ kind: 'learning-goal', goalId: 'A01', session: sessionOf({ objects: { goal: { count: 1, widthM: 5 } } }) } as any, learningGoalAuthorizations(), {
        alter: contracts => {
            ;(contracts.find(contract => contract.contractId === P)! as any).objectSuitability = TEST_SUITABILITY
            contracts
                .find(contract => contract.contractId === P)!
                .items.push(
                    testItem('TEST-GOAL', 'O1', 'kind=goal', 'EXISTS', 'N/A'),
                    testItem('TEST-GOAL-ALONG', 'O4', 'kind=goal', 'POSITIONED', { term: 'own end (of team T)', forTeam: team, offsetM: { from: 0, to: 0 }, asAuthored: `TEST-ONLY on the end line ${team} defends` }),
                    testItem('TEST-GOAL-ACROSS', 'O5', 'kind=goal', 'POSITIONED', { term: 'central', asAuthored: 'TEST-ONLY centred' }),
                )
        },
        review: { includeDrafts: true },
    })
const reasonsOf = (activity: RefusedActivity, blockId: string) => activity.reasons.filter(reason => reason.startsWith(`block ${blockId}: `)).map(reason => reason.slice(`block ${blockId}: `.length))

const production = buildActivityWithFixture({ kind: 'learning-goal', goalId: 'A01', situationId: null, session: sessionOf() } as any)
const productionBlocks = blocksOf(production.fixture)

// ── 1. Production A01: only the recorded delta ──────────────────────────────────────────────────────────
test('production A01 at 12/1, 12/2 and 11/1: the layout as it was (no objects key), nothing moves, every check and description unchanged', () => {
    for (const [label, session] of [
        ['12/1', sessionOf()],
        ['12/2', sessionOf({ roles: { ...none, [KEEPER]: 2 } })],
        ['11/1', sessionOf({ players: 11 })],
    ] as [string, any][]) {
        const built = label === '12/1' ? production : buildActivityWithFixture({ kind: 'learning-goal', goalId: 'A01', situationId: null, session } as any)
        const served = built.activity as ServedActivity
        assert.equal(served.outcome, 'served', label)
        const blocks = blocksOf(built.fixture)
        for (const block of blocks) {
            assert.deepEqual(Object.keys(block.fixture.layout).sort(), LAYOUT_KEYS, `${label} ${block.blockId}: no objects key`)
            assert.equal(block.fixture.remarking, undefined, `${label} ${block.blockId}`)
            assert.deepEqual(block.fixture.layout.marks.map((mark: any) => mark.at), [5, 20, 35], label)
            assert.deepEqual(block.fixture.layout.movedBy.map((move: any) => move.elementId), ['A01-ADJ-3'], `${label}: the line measured from the building team's end still moves with the adjustment`)
        }
        const checks = served.roleBlocks!.checks
        assert.deepEqual(checks.map(check => [check.checkId, check.verdict]), ['RB-1', 'RB-2', 'RB-3', 'RB-4', 'RB-5', 'RB-6', 'RB-7', 'RB-8', 'RB-M', 'RB-L'].map(id => [id, 'PASS']), label)
        assert.deepEqual([checks[0].what, checks[2].what], [RB1_WHAT, RB3_WHAT], label)
        assert.deepEqual(served.rendered.instructions.filter(i => i.section === ROLE_EXCHANGE).map(i => i.text)[1], PRODUCTION_EXCHANGE, label)
    }
    // The one played object is no marking: it is placed on neither axis, so the layout holds none.
    for (const block of productionBlocks) {
        assert.deepEqual(block.fixture.game.objects.map((object: any) => object.elementId), ['c:sport-profile:soccer:SPORT-SOCCER-01'])
        assert.ok(!block.fixture.status.geometry.some((g: any) => g.path.startsWith('objects[')))
    }
})

// ── 2. RB-1 and RB-3 ────────────────────────────────────────────────────────────────────────────────────
test('RB-1 compares the objects (O1); RB-3 reads two targets, a region or an object, and refuses a reference naming nothing', () => {
    const checksOf = (from: Block[]) => checkRoleBlocks(from.map((entry, n) => ({ block: entry.fixture.record.roleBlock ?? { blockId: entry.blockId, holders: {} }, fixture: entry.fixture, contracts: [] })), index, roles)
    const check = (from: Block[], id: string) => checksOf(from).find(entry => entry.checkId === id)!
    const fresh = () => productionBlocks.map(entry => ({ blockId: entry.blockId, fixture: copy(entry.fixture) }))
    assert.equal(check(fresh(), 'RB-1').verdict, 'PASS')
    // An object in one block only (TEST-ONLY): until this stage RB-1 read no object, so it passed.
    const extra = fresh()
    extra[1].fixture.game.objects.push({ elementId: GOAL, kind: 'goal' })
    const rb1 = check(extra, 'RB-1')
    assert.equal(rb1.verdict, 'FAIL')
    assert.deepEqual(rb1.problems, [`objects: ["c:sport-profile:soccer:SPORT-SOCCER-01"] in one block and ${JSON.stringify([GOAL, 'c:sport-profile:soccer:SPORT-SOCCER-01'].sort())} in the other`])
    assert.equal(rb1.what, RB1_WHAT, 'the description is unchanged')
    // RB-3: the pressing objective of each block references a TEST-ONLY object both games hold: two targets, one a region and one an object.
    const objectTarget = fresh()
    for (const entry of objectTarget) {
        entry.fixture.game.objects.push({ elementId: GOAL, kind: 'goal' })
        const pressing = entry.fixture.game.objectives.find((o: any) => o.team === entry.fixture.record.roleBlock.holders.PRESSING)
        pressing.reference = { structuralRef: { contractId: P, itemId: 'TEST-GOAL' } }
    }
    const rb3 = check(objectTarget, 'RB-3')
    assert.deepEqual([rb3.verdict, rb3.problems], ['PASS', []])
    assert.equal(rb3.what, 'two objectives of the scoring role and two targets (a region or an object) in each block, and no region or object a role-keyed selector created')
    // Stage C review fix: an object a role-keyed selector created is a third target, refused as a region is (TEST-ONLY: no such selector can
    // be authored on the objects row today, so the copy carries it directly).
    const roleKeyedObject = fresh()
    const attribute = index.targetOf!.attribute
    for (const entry of roleKeyedObject) entry.fixture.game.objects.push({ elementId: GOAL, kind: 'goal', selector: [{ attribute, op: '=', value: 'TEST-ONLY' }] })
    const third = check(roleKeyedObject, 'RB-3')
    assert.equal(third.verdict, 'FAIL')
    assert.deepEqual(third.problems, roleKeyedObject.map(entry => `block ${entry.blockId}: objects[${GOAL}] was created by a selector on ${attribute}, a third target`))
    // A reference naming neither a region nor an object of the game (TEST-ONLY): until this stage the references were only counted.
    const nothing = fresh()
    const objective = nothing[0].fixture.game.objectives[0]
    objective.reference = { structuralRef: { contractId: 'TEST-ONLY', itemId: 'NOTHING' } }
    const refused = check(nothing, 'RB-3')
    assert.equal(refused.verdict, 'FAIL')
    assert.deepEqual(refused.problems, [`block ${nothing[0].blockId}: objectives[${objective.elementId}] references c:TEST-ONLY:NOTHING, which is no region or object of the block's game`])
    assert.equal(refused.what, RB3_WHAT, 'a game of region targets reads the description it always did')
})

// ── 3. The moving goal ──────────────────────────────────────────────────────────────────────────────────
test('a TEST-ONLY unreferenced goal moving between the blocks is listed and refused (T19: before this stage every check passed and nothing was re-marked)', () => {
    const built = withGoal('ROLE_HOLDER_BUILDING')
    const activity = built.activity as RefusedActivity
    assert.deepEqual([activity.outcome, activity.stage], ['refused', 'communication'])
    const blocks = blocksOf(built.fixture)
    // The goal stands on the building team's end line: the 0 end line in block 1, the 40 m one in block 2.
    assert.deepEqual(
        blocks.map(block => block.fixture.status.geometry.filter((g: any) => g.path.startsWith(`objects[${GOAL}]`)).map((g: any) => [g.path.split('.').pop(), g.geometry.interval.from, g.geometry.interval.to])),
        [
            [['along', 0, 0], ['across', 12.5, 17.5]],
            [['along', 40, 40], ['across', 12.5, 17.5]],
        ],
    )
    // Every cross-block check passes (the goal is one element in both blocks, its move explained by the item written for the role's holder and
    // mirrored), RB-L included: the layout no longer applies, and what moves, recomputed, is what each block carries.
    const checks = (built.fixture as any).roleBlocks.checks as any[]
    assert.deepEqual(checks.map(check => [check.checkId, check.verdict]), ['RB-1', 'RB-2', 'RB-3', 'RB-4', 'RB-5', 'RB-6', 'RB-7', 'RB-8', 'RB-M', 'RB-L'].map(id => [id, 'PASS']))
    const decision = layoutOf(blocks.map(bare), movers)
    assert.equal(decision.applies, false)
    assert.ok(decision.why.some(why => why.startsWith(`the object ${GOAL} (goal) is not at one place in every block (0-0 m along and 12.5-17.5 m across in block ${blocks[0].blockId}; 40-40 m along`)), JSON.stringify(decision.why))
    const listed = decision.remarking!.objects!
    assert.deepEqual(listed, [
        {
            elementId: 'object-change-1',
            objectId: GOAL,
            kind: 'goal',
            path: `objects[${GOAL}].position`,
            places: [
                { blockId: blocks[0].blockId, along: { from: 0, to: 0 }, across: { from: 12.5, to: 17.5 } },
                { blockId: blocks[1].blockId, along: { from: 40, to: 40 }, across: { from: 12.5, to: 17.5 } },
            ],
        },
    ])
    for (const block of blocks) {
        assert.equal(block.fixture.layout, undefined, block.blockId)
        assert.deepEqual(block.fixture.remarking, decision.remarking, block.blockId)
    }
    // Refused at communication, by name in each block: no exchange sentence names the goal (it has no words until Stage G), and nothing says
    // the markings are not re-marked. No gate and no cross-block check refuses, as before.
    for (const block of blocks) {
        const reasons = reasonsOf(activity, block.blockId)
        assert.ok(
            reasons.includes(
                `fidelity Q5: the object ${GOAL} (goal) (0-0 m along and 12.5-17.5 m across in block ${blocks[0].blockId}, 40-40 m along and 12.5-17.5 m across in block ${blocks[1].blockId}) moves at the exchange, and no Role exchange sentence names it and where it goes in block ${block.blockId}`,
            ),
            reasons.join(' | '),
        )
        assert.ok(!reasons.some(reason => /GA-|RB-|realization refused|Gate A/.test(reason)), reasons.join(' | '))
    }
    const draft = (activity as any).draft.instructions as Instruction[]
    assert.ok(!draft.some(i => i.section === ROLE_EXCHANGE && i.text.includes(NOTHING_RE_MARKED)), 'nothing claims the markings stay')
    // Listed for the administrator too (DRAFT admin words): the evidence says why the markings stay block by block, the goal's move among them.
    const said = (activity.evidence!.sections.roleExchange as any[]).find(fact => String(fact.what).startsWith('The markings are presented block by block'))
    const moves = remarkingSummary(decision.remarking)
    assert.ok(moves.includes(`object-change-1 moves: the object ${GOAL} (goal) 0-0 m along and 12.5-17.5 m across in block ${blocks[0].blockId}; 40-40 m along and 12.5-17.5 m across in block ${blocks[1].blockId}`), JSON.stringify(moves))
    assert.ok((said.value as string[]).includes(moves[moves.length - 1]), JSON.stringify(said.value))
})

// ── 4. The fixed goal ───────────────────────────────────────────────────────────────────────────────────
test('a TEST-ONLY goal fixed at one end is set out once: in the layout once, recomputed by RB-L, held by Q5-L to the game and to a Set up sentence', () => {
    const built = withGoal('TEAM_AT_AXIS_START')
    const activity = built.activity as RefusedActivity
    assert.deepEqual([activity.outcome, activity.stage], ['refused', 'communication'])
    const blocks = blocksOf(built.fixture)
    const layout = blocks[0].fixture.layout
    assert.deepEqual(layout.marks.map((mark: any) => mark.at), [5, 20, 35], "the regions' marks are production's")
    assert.deepEqual(layout.objects, [
        {
            elementId: 'object-1',
            objectId: GOAL,
            kind: 'goal',
            along: { from: 0, to: 0 },
            across: { from: 12.5, to: 17.5 },
            sources: blocks.map(block => ({ blockId: block.blockId, path: `objects[${GOAL}].position` })),
        },
    ])
    for (const block of blocks) {
        assert.deepEqual(block.fixture.layout, layout, block.blockId)
        assert.equal(block.fixture.remarking, undefined, block.blockId)
    }
    assert.equal((built.fixture as any).roleBlocks.checks.find((check: any) => check.checkId === 'RB-L').verdict, 'PASS')
    // RB-L refuses a layout that drops the object (the recomputation holds it).
    const dropped = blocks.map(block => ({ blockId: block.blockId, fixture: { ...block.fixture, layout: { ...copy(block.fixture.layout), objects: undefined } } }))
    assert.equal(checkRoleBlockLayout(dropped, movers).verdict, 'FAIL')
    // The exchange says nothing is re-marked (true: the goal stays), with production's qualification for the line. Since Stage G (23 October
    // 2026) it also says, for the object set out once, that it stays where it is (DRAFT), citing its layout entry and its kind.
    const draft = (activity as any).draft.instructions as Instruction[]
    const exchangeWithGoal = PRODUCTION_EXCHANGE.replace('of its new role, and nothing', 'of its new role, the goal stays where it is, and nothing')
    const exchange = draft.find(i => i.section === ROLE_EXCHANGE && i.text === exchangeWithGoal)
    assert.ok(exchange && exchange.from.includes('layout.objects[object-1]') && exchange.from.includes(`objects[${GOAL}].kind`), JSON.stringify(draft.filter(i => i.section === ROLE_EXCHANGE).map(i => i.text)))
    // Refused at communication only for want of the goal's placing words: Q3 for its position, and Q5-L for the object set out once (no Set
    // up sentence places it, and, since the stage C review, its position is denoted by no Set up sentence). Since Stage G an object set out
    // once is placed in DRAFT words only where its position is written for a role's holder (so the words are the same in every block); this
    // TEST-ONLY goal is placed at an end-assigned team's end line, whose role changes between the blocks, so it is still not placed.
    const denotedBy = (n: number) => `objects[${GOAL}].position is denoted by ${n} Set up sentences in a layout set out once, not exactly one`
    for (const block of blocks) {
        const reasons = reasonsOf(activity, block.blockId)
        assert.ok(reasons.includes(`fidelity Q5: the object ${GOAL} (layout.objects[object-1]) is set out once and no Set up sentence tells the coach to place it`), reasons.join(' | '))
        assert.ok(reasons.includes(`fidelity Q5: ${denotedBy(0)}`), reasons.join(' | '))
        assert.ok(reasons.includes(`fidelity Q3: objects[${GOAL}].position.along is established by the game and no instruction carries it`))
        assert.ok(reasons.every(reason => reason.startsWith('fidelity Q3: ') || reason.startsWith('fidelity Q5: the object ') || reason === `fidelity Q5: ${denotedBy(0)}`), reasons.join(' | '))
    }
    // Q5-L holds the projection to the game: a layout recording the goal elsewhere for this block is refused (TEST-ONLY).
    const fixture = blocks[0].fixture
    const elsewhere = { ...fixture, layout: copy(fixture.layout) }
    elsewhere.layout.objects[0].along = { from: 40, to: 40 }
    assert.ok(
        q5(elsewhere, renderConcreteGame(elsewhere)).includes(`objects[${GOAL}].position is realized at 0-0 m along and 12.5-17.5 m across in block ${blocks[0].blockId}, and the layout set out once records 40-40 m along and 12.5-17.5 m across for it there`),
    )
    const unrecorded = { ...fixture, layout: { ...copy(fixture.layout), objects: undefined } }
    assert.ok(q5(unrecorded, renderConcreteGame(unrecorded)).some(what => what.startsWith(`objects[${GOAL}].position is realized at`) && what.endsWith('records nothing for it there')))
    // And a TEST-ONLY Set up sentence citing the layout's object is what the second clause asks for.
    const rendered = renderConcreteGame(fixture)
    const area = rendered.instructions.find(i => i.text.startsWith('Mark out an area'))!
    const sentence = (text: string, from: string[]): Instruction => ({ ...area, text, from, quantities: [], parts: [{ ...area.parts![0], text, from, quantities: [], bindings: [] }] })
    const placing = sentence('TEST-ONLY: place the object', ['layout.objects[object-1]'])
    assert.ok(!q5(fixture, { ...rendered, instructions: [...rendered.instructions, placing] }).some(what => what.includes('layout.objects[object-1]')))
    /**
     * Stage C review fix: the object is told ONCE, from the layout (the review's probe, rvC/probe-fixed-twice). (a) One Set up sentence citing
     * the layout's object and the object's position: nothing of the object is refused. (b) (a) and a second, per-block sentence citing its
     * position again: refused, denoted twice (before the fix it passed). (c) One sentence citing the position but not the layout's object:
     * refused, told for the block and not from the layout. (d) The sentence citing the layout's object only: the position denoted by none.
     */
    const positionPaths = [`objects[${GOAL}].position.along`, `objects[${GOAL}].position.across`]
    const once = sentence('TEST-ONLY: place the object once', ['layout.objects[object-1]', ...positionPaths])
    const again = sentence('TEST-ONLY: place the object on the end line', positionPaths)
    const ofObject = (instructions: Instruction[]) => q5(fixture, { ...rendered, instructions: [...rendered.instructions, ...instructions] }).filter(what => what.includes(GOAL) || what.includes('layout.objects['))
    assert.deepEqual(ofObject([once]), [], '(a) told once, from the layout')
    assert.deepEqual(ofObject([once, again]), [denotedBy(2)], '(b) told twice')
    assert.deepEqual(ofObject([again]), [
        `the object ${GOAL} (layout.objects[object-1]) is set out once and no Set up sentence tells the coach to place it`,
        `objects[${GOAL}].position is denoted by a Set up sentence that does not cite layout.objects[object-1], so it is told for this block and not from the object set out once`,
    ], '(c) told per block')
    assert.deepEqual(ofObject([placing]), [denotedBy(0)], '(d) placed without its position')
    // A PREFERENCE sentence is no denotation (as for a region): (a) with the second sentence a preference is accepted.
    assert.deepEqual(ofObject([once, { ...again, status: 'PREFERENCE', parts: again.parts!.map(p => ({ ...p, status: 'PREFERENCE' })) } as Instruction]), [], 'a preference does not denote')
})

// ── 5. layoutOf on copies; T34 ──────────────────────────────────────────────────────────────────────────
test('layoutOf (TEST-ONLY copies): an object one block places, an object placed on one axis; T34, a line from an end that does not change', () => {
    const geometry = (entry: Block, path: string, interval: { from: number; to: number }, extra: Record<string, unknown> = {}) => {
        const found = entry.fixture.status.geometry.find((g: any) => g.path === path)
        if (found) Object.assign(found.geometry, { interval }, extra)
        else entry.fixture.status.geometry.push({ path, geometry: { axis: path.endsWith('.along') ? 'along' : 'across', interval, ...extra } })
    }
    // An object placed in block 2 only: it moves (it appears), so the markings stay block by block and the account lists it with no place in block 1.
    const appears = productionBlocks.map(bare)
    for (const entry of appears) entry.fixture.game.objects.push({ elementId: GOAL, kind: 'goal' })
    geometry(appears[1], `objects[${GOAL}].position.along`, { from: 0, to: 0 })
    geometry(appears[1], `objects[${GOAL}].position.across`, { from: 12.5, to: 17.5 })
    const appearing = layoutOf(appears, movers)
    assert.equal(appearing.applies, false)
    assert.deepEqual(appearing.remarking!.objects!.map(change => change.places.map(place => place.along)), [[null, { from: 0, to: 0 }]])
    // Placed on one axis only: where it stands cannot be set out, and what moves cannot be read either.
    const half = productionBlocks.map(bare)
    for (const entry of half) {
        entry.fixture.game.objects.push({ elementId: GOAL, kind: 'goal' })
        geometry(entry, `objects[${GOAL}].position.along`, { from: 0, to: 0 })
    }
    const halfPlaced = layoutOf(half, movers)
    assert.deepEqual([halfPlaced.applies, halfPlaced.remarking], [false, null])
    assert.ok(halfPlaced.why.includes(`the object ${GOAL} holds a realized position on one axis only in block ${half[0].blockId}, so where it stands cannot be set out`))
    // T34 (TEST-ONLY geometry): the marked line 15 m from the end line at 0 in BOTH blocks (the end it is measured from does not change, as
    // under the end exchange stage D builds), with a 5 m zone at each end. Until this stage: refused, "not at half of it", although nothing moves.
    const fromOneEnd = productionBlocks.map(bare)
    for (const entry of fromOneEnd) {
        geometry(entry, along(LINE), { from: 15, to: 15 }, { anchor: 0 })
        geometry(entry, along(NEAR), { from: 0, to: 5 })
        geometry(entry, along(FAR), { from: 35, to: 40 })
        entry.fixture.game.space.regions.find((region: any) => region.elementId === LINE).position.along.offsetM = { from: 15, to: 15 }
    }
    const held = layoutOf(fromOneEnd, movers)
    assert.equal(held.applies, true, JSON.stringify(held.why))
    assert.deepEqual(held.layout!.marks.map(mark => [mark.at, mark.line]), [[5, null], [15, LINE], [35, null]])
    assert.deepEqual(held.layout!.movedBy, [], 'the move-the-line adjustment moves it in every block alike, so nothing moves at the exchange')
    // Measured from the end line at 0 in one block and at 40 in the other (production's anchors): refused as before, naming both.
    const twoEnds = fromOneEnd.map(entry => copy(entry))
    twoEnds[1].fixture.status.geometry.find((g: any) => g.path === along(LINE)).geometry.anchor = 40
    const refused = layoutOf(twoEnds, movers)
    assert.equal(refused.applies, false)
    assert.ok(refused.why.some(why => why.includes('not at half of it, and not measured from the same end line in every block (from the end line at 0 m in block') && why.includes('from the end line at 40 m in block')), JSON.stringify(refused.why))
    // The line's sentence in the layout: its own words, citing the mark it is, so Q5-L finds the mark told.
    const fixture = { ...fromOneEnd[0].fixture, layout: held.layout }
    const rendered = renderConcreteGame(fixture)
    const line = rendered.instructions.find(i => i.section === 'Set up' && i.from.includes(along(LINE)))!
    assert.equal(line.text, "Mark a line across the area, 15 m from the building team's end line")
    assert.ok(line.from.includes('layout.marks[mark-2].at'), JSON.stringify(line.from))
    assert.ok(!q5(fixture, rendered).some(what => what.includes('layout.marks[mark-2]')), JSON.stringify(q5(fixture, rendered)))
    // Without the citation (TEST-ONLY), the mark set out once is refused as untold.
    const uncited = { ...rendered, instructions: rendered.instructions.map(i => (i === line ? { ...i, from: i.from.filter(p => !p.startsWith('layout.')), parts: i.parts!.map(p => ({ ...p, from: p.from.filter(f => !f.startsWith('layout.')) })) } : i)) }
    assert.ok(q5(fixture, uncited).includes('the mark at 15 m (layout.marks[mark-2]) is set out once and no Set up sentence tells the coach to make it'))
    // Nothing moves a mark, so the exchange says nothing is re-marked with no qualification.
    assert.ok(rendered.instructions.some(i => i.section === ROLE_EXCHANGE && i.text.includes(`${NOTHING_RE_MARKED};`)), JSON.stringify(rendered.instructions.filter(i => i.section === ROLE_EXCHANGE).map(i => i.text)))
})

// ── 6. Only what actually moves ─────────────────────────────────────────────────────────────────────────
test('the exchange says only what actually moves: an empty account names nothing and sets nothing out again; fidelity refuses "set out again" there', () => {
    // TEST-ONLY: two blocks read alike (block 1's game twice) with the marked line short of a touchline in both, so the layout cannot apply and
    // nothing moves: the account is given, empty. Re-pointed 24 October 2026 (stage L, the d27 design's stage L(a): "physical-layout.ts sets
    // out once any region that is not full width"): was the near ZONE short of a touchline, which is now an area set out once as itself (a
    // rectangle) where it is at one place in every block; a LINE that does not run across the full width still stops the layout.
    const [first] = productionBlocks.map(bare)
    const twin: Block[] = [first, { blockId: productionBlocks[1].blockId, fixture: copy(first.fixture) }]
    for (const entry of twin) entry.fixture.status.geometry.find((g: any) => g.path === `space.regions[${LINE}].position.across`).geometry.interval = { from: 0, to: 29 }
    const still = layoutOf(twin, movers)
    assert.equal(still.applies, false)
    assert.ok(still.why.some(why => why.startsWith(`${LINE} does not run across the full width`)))
    assert.deepEqual(still.remarking, { lengthM: 40, changes: [] })
    // And with no mark inside the area at all (TEST-ONLY: every region on an end line): nothing to set out besides the area, none owed a
    // reason, and nothing moves, so the account is given empty too (until this stage: null in both cases).
    const endLines = productionBlocks.map(bare)
    for (const entry of endLines) {
        for (const g of entry.fixture.status.geometry) {
            if (g.path === along(LINE) || g.path === along(NEAR)) g.geometry.interval = { from: 0, to: 0 }
            if (g.path === along(FAR)) g.geometry.interval = { from: 40, to: 40 }
        }
    }
    assert.deepEqual(layoutOf(endLines, movers), { applies: false, layout: null, why: [], remarking: { lengthM: 40, changes: [] } })
    // The renderer: production's block 1 with that account names nothing moved and says nothing is set out again, while still citing the
    // positions written for the roles (fidelity Q6's half of his D2) and, since the stage C review, saying what they mean in the layout
    // sentence's own words (without "nothing is re-marked", which no layout's movedBy qualifies here). Without any account (what moves not
    // read) it says what it said.
    const fixture = { ...productionBlocks[0].fixture, layout: undefined, remarking: still.remarking as Remarking }
    const rendered = renderConcreteGame(fixture)
    const exchange = rendered.instructions.filter(i => i.section === ROLE_EXCHANGE && i.text.startsWith('Each team keeps its end'))
    assert.deepEqual(exchange.map(i => i.text), [
        'Each team keeps its end for the whole activity. When you call the next block the teams exchange roles, not ends: each team now attacks the target zone of its new role; there is no set block length',
    ])
    assert.ok(!exchange[0].text.includes(NOTHING_RE_MARKED))
    assert.ok(fixture.game.space.regions.filter((region: any) => region.noun === 'zone').every((region: any) => exchange[0].from.includes(`space.regions[${region.elementId}].noun`)), 'the target noun is cited')
    assert.ok(roleKeyedPositions(fixture).every(path => exchange[0].from.includes(path)) && roleKeyedPositions(fixture).length > 0)
    assert.deepEqual(q5(fixture, rendered), [])
    const unread = renderConcreteGame({ ...fixture, remarking: undefined }).instructions.find(i => i.section === ROLE_EXCHANGE && i.text.includes('set out again'))!
    assert.equal(unread.text, 'Each team keeps its end for the whole activity. When you call the next block the teams exchange roles, not ends, and the marked line and both target zones are set out again for the new roles; there is no set block length')
    // The compensating check: that sentence where the account says nothing moves is refused (it was the sentence said before this stage).
    assert.ok(q5(fixture, { ...rendered, instructions: rendered.instructions.map(i => (i === exchange[0] ? unread : i)) }).includes(`"${unread.text}" tells the coach to set the markings out again at the exchange, and nothing moves between the blocks`))
    // And where something moves, "nothing is re-marked" is still refused (stage 2G), now also where only an object moves (TEST-ONLY account).
    const objectMoves: Remarking = {
        lengthM: 40,
        changes: [],
        objects: [{ elementId: 'object-change-1', objectId: GOAL, kind: 'goal', path: `objects[${GOAL}].position`, places: productionBlocks.map((block, n) => ({ blockId: block.blockId, along: { from: n * 40, to: n * 40 }, across: { from: 12.5, to: 17.5 } })) }],
    }
    const moving = { ...fixture, remarking: objectMoves }
    const movingRendered = renderConcreteGame(moving)
    const unnamed = `the object ${GOAL} (goal) (0-0 m along and 12.5-17.5 m across in block ${productionBlocks[0].blockId}, 40-40 m along and 12.5-17.5 m across in block ${productionBlocks[1].blockId}) moves at the exchange, and no Role exchange sentence names it and where it goes in block ${productionBlocks[0].blockId}`
    assert.deepEqual(q5(moving, movingRendered), [unnamed])
    const said = movingRendered.instructions.find(i => i.section === ROLE_EXCHANGE && i.text.startsWith('Each team keeps its end'))!
    assert.ok(q5(moving, { ...movingRendered, instructions: movingRendered.instructions.map(i => (i === said ? { ...i, text: `${i.text}; ${NOTHING_RE_MARKED}`, parts: undefined } : i)) }).some(what => what.endsWith(`says ${NOTHING_RE_MARKED}, and markings move at the exchange`)))
    // A TEST-ONLY part naming the object's move, citing the move and the object's position, with the verb: accepted; without the verb: refused.
    const naming = (words: string): Instruction => {
        const part = { ...said.parts![0], text: words, from: [`remarking.objects[object-change-1]`, `objects[${GOAL}].position.along`], quantities: [], bindings: [] }
        const parts = [said.parts![0], part, ...said.parts!.slice(1)]
        return { ...said, text: parts.map(p => p.text).join(''), from: [...new Set(parts.flatMap(p => p.from))], parts }
    }
    const withPart = (instruction: Instruction) => ({ ...movingRendered, instructions: movingRendered.instructions.map(i => (i === said ? instruction : i)) })
    const KIND = objectMoves.objects![0].kind!
    assert.deepEqual(q5(moving, withPart(naming(`, and ${MOVE_MARKINGS}the TEST-ONLY ${KIND} to the other end line`))), [])
    assert.ok(q5(moving, withPart(naming(`, and the TEST-ONLY ${KIND} goes to the other end line`))).some(what => what.endsWith('names markings that move at the exchange without telling the coach to move them')))
    // Its noun not said (citations kept): not named, as a region's part must say the region's noun.
    assert.deepEqual(q5(moving, withPart(naming(`, and ${MOVE_MARKINGS}the TEST-ONLY object to the other end line`))), [unnamed])
    // Stage C review fix: the kind said only inside a longer word is not said (until the fix a substring match accepted it).
    assert.deepEqual(q5(moving, withPart(naming(`, and ${MOVE_MARKINGS}the TEST-ONLY ${KIND}keeper to the other end line`))), [unnamed])
    assert.deepEqual(q5(moving, withPart(naming(`, and ${MOVE_MARKINGS}the TEST-ONLY ${KIND}'s frame to the other end line`))), [], 'an apostrophe ends the word')
})

// ── 7. The stage C review fixes: whole words, and an object neither the layout nor the account reads ────────────────────────────────
test('saysWord finds whole words only; a role block positioning an object with neither a layout nor an account of what moves is refused', () => {
    // Whole words: bounded by no letter, digit, hyphen or underscore on either side.
    const cases: [string, string, boolean][] = [
        ['move the zone', 'zone', true],
        ['move the zones', 'zone', false],
        ['the end-zone', 'zone', false],
        ['the zone, then', 'zone', true],
        ["the zone's edge", 'zone', true],
        ['ozone', 'zone', false],
        ['a zone2', 'zone', false],
        ['zone', 'zone', true],
        ['the zones and the zone', 'zone', true],
        ['anything', '', false],
    ]
    for (const [text, word, expected] of cases) assert.equal(saysWord(text, word), expected, `${JSON.stringify(text)} says ${JSON.stringify(word)}`)
    // (The region-noun clause reads whole words too: physical-layout.unit.ts test 8 (b2).)
    // (TEST-ONLY) An object realized on both axes in a block that carries neither the markings set out once nor an account of what moves:
    // the exchange would fall back to the sentence naming regions only, so the object is refused rather than moved without a word.
    const block = productionBlocks[0]
    const positioned = { ...copy(block.fixture), layout: undefined, remarking: undefined }
    positioned.game.objects.push({ elementId: GOAL, kind: 'goal' })
    positioned.status.geometry.push(
        { path: `objects[${GOAL}].position.along`, geometry: { axis: 'along', interval: { from: 0, to: 0 } } },
        { path: `objects[${GOAL}].position.across`, geometry: { axis: 'across', interval: { from: 12.5, to: 17.5 } } },
    )
    const unaccounted = `objects[${GOAL}].position is realized (along and across) in block ${block.blockId}, and the fixture carries neither the markings set out once nor an account of what moves, so whether it moves at the exchange is not said`
    assert.ok(q5(positioned, renderConcreteGame(positioned)).includes(unaccounted), JSON.stringify(q5(positioned, renderConcreteGame(positioned))))
    // Placed on one axis only, it is refused too, naming the axis.
    const halfPlaced = { ...positioned, status: { ...positioned.status, geometry: positioned.status.geometry.filter((g: any) => g.path !== `objects[${GOAL}].position.across`) } }
    assert.ok(q5(halfPlaced, renderConcreteGame(halfPlaced)).some(what => what.startsWith(`objects[${GOAL}].position is realized (along) in block`)))
    // Carrying an account (here empty) or the layout, the object is read there instead, so this clause says nothing.
    const accounted = { ...positioned, remarking: { lengthM: 40, changes: [] } }
    assert.ok(!q5(accounted, renderConcreteGame(accounted)).includes(unaccounted))
    const laidOut = { ...positioned, layout: block.fixture.layout }
    assert.ok(!q5(laidOut, renderConcreteGame(laidOut)).some(what => what.includes('carries neither the markings set out once')))
    // Not a block of a game played in role blocks: nothing is exchanged, so nothing is owed here.
    const single = { ...positioned, record: { ...positioned.record, roleBlock: undefined } }
    assert.ok(!q5(single, renderConcreteGame(single)).some(what => what.includes('carries neither the markings set out once')))
    // Production's blocks carry the layout, and their one object is placed on neither axis: nothing here.
    for (const entry of productionBlocks) assert.ok(!q5(entry.fixture, renderConcreteGame(entry.fixture)).some(what => what.includes('carries neither the markings set out once')))
})

console.log(`objects-across-blocks.unit.ts — ${passed} passed`)
