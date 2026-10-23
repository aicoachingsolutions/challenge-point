/**
 * A game played in role blocks, through the one chain — stage K3, 15 October 2026, his M1 in the reply filed 17 October
 * 2026: *"Keep role assignments separate from fixed ends. Allow target configurations to reflect each team's role during the
 * block. The coach controls the exchange. No new block-duration system is needed."* And D2: *"Team ends can remain fixed,
 * while role-specific objectives and target configurations change when the teams exchange roles. Please make that
 * distinction explicit in the coach-facing instructions."*
 *
 * What is pinned here (mechanism proofs on TEST-ONLY copies; the production A01 still stops at its record's gaps):
 *   1. the possession game with two TEST-ONLY roles is served as ONE activity built from TWO complete games, each block with
 *      its own integrity, every cross-block check passing, both renders said once each, and the exchange stated with the
 *      ends kept — the possession game without roles is served exactly as before;
 *   2. key identity: each block's fixture crosses into the composed fixture whole, with the block it was derived for, the
 *      DRAFT role nouns and the checks; the served account carries the same blocks;
 *   3. every cross-block check REFUSES its own violation, made on a copy (RB-1 to RB-8, a mirrored position passing);
 *   4. fidelity Q6 refuses a lost sentence, an invented one, a sentence for the wrong block, the missing ends-fixed or roles
 *      statement, and any sentence saying the ends change;
 *   5. no defending-team noun, and no sentence dividing the session's minutes among blocks;
 *   6. A01 behind its record (gap entries set aside on a COPY): both blocks built, both stopping in the same place — since
 *      stage K5 the progression reference (GA-ONE-PRIMARY-EVENT, GA-REFERENCE-INTEGRITY), until then GA-EPISODE-REACHABLE —
 *      each named by its block. Production A01 is pinned in activity-review.unit.ts.
 *
 * Run: npx ts-node --files -r tsconfig-paths/register ./src/system/rendering/role-blocks.unit.ts
 */
import assert from 'node:assert/strict'

import { loadRegister } from '../derivation/corpus'
import { roleHolderNames } from '../derivation/designation'
import { indexRegister } from '../derivation/register'
import { LoadedContract } from '../derivation/types'
import { learningGoalAuthorizations } from '../test-library/learning-goal-authorizations'
import * as wordingModule from './approved-wording'
import { buildActivityFromKnowledge, buildActivityUnderAuthorizationRecords, RefusedActivity, ServedActivity } from './build-activity'
import { checkFidelity } from './fidelity'
import { Instruction, renderConcreteGame, RenderedActivity, ROLE_EXCHANGE } from './render-concrete-game'
import { checkRoleBlockComposition, checkRoleBlocks, composeRoleBlockActivity, RenderedBlock } from './role-blocks'
import { specializedRoleNames } from './session-envelope'

let passed = 0
function test(name: string, body: () => void): void {
    body()
    passed++
    console.log(`  ok  ${name}`)
}

console.log('a game played in role blocks, through the one chain (his M1)')

const index = indexRegister(loadRegister())
const roles = index.roleBlocks!.roles
const none = Object.fromEntries(specializedRoleNames().map(name => [name, 0]))
const session = { players: 12, lengthM: 40, widthM: 30, durationMin: 20, roles: none }

/** A TEST-ONLY contribution establishing the two roles and their exchange: never production data. */
const testContract = (extra: any[] = [], drop: string[] = []): LoadedContract => ({
    contractId: 'TEST-ONLY:roles',
    objectId: 'TEST-ONLY:roles',
    knowledgeVersion: 'stage-b',
    items: [
        { itemId: 'T-1', row: 'B1', selector: `activityRole=${roles[0]}`, requirement: 'EXISTS', value: 'N/A' },
        { itemId: 'T-2', row: 'B1', selector: `activityRole=${roles[1]}`, requirement: 'EXISTS', value: 'N/A' },
        { itemId: 'T-3', row: 'B3', selector: '*', requirement: 'EQUALS', value: index.roleBlocks!.exchanges[0], valueStatus: 'REQUIRED_RANGE' },
        ...extra,
    ]
        .filter(item => !drop.includes(item.itemId))
        .map(item => ({ valueStatus: 'N/A', strictness: 'REQUIRED', scope: 'WHOLE_GAME', basis: 'OWNER_RULING', checkability: 'STRUCTURAL', structuralClause: 'whole item', basisEvidence: 'TEST-ONLY', ...item })) as any,
    declarations: [],
    relationshipRules: [],
})
const withRoles = (extra: any[] = [], drop: string[] = []) => buildActivityFromKnowledge(['GF2'], session, { alter: contracts => void contracts.push(testContract(extra, drop)) })
const served = (activity: ServedActivity | RefusedActivity, label: string): ServedActivity => {
    assert.equal(activity.outcome, 'served', `${label}: ${JSON.stringify((activity as RefusedActivity).reasons)}`)
    return activity as ServedActivity
}
const refused = (activity: ServedActivity | RefusedActivity, label: string): RefusedActivity => {
    assert.equal(activity.outcome, 'refused', `${label} must be refused`)
    return activity as RefusedActivity
}

const twoBlocks = withRoles()
const activity = served(twoBlocks.activity, 'GF2 with TEST-ONLY roles')
const fixture: any = twoBlocks.fixture
const blocks: { blockId: string; holders: Record<string, string>; fixture: any }[] = fixture.roleBlocks.blocks
const contracts = (() => {
    // The contracts each block was derived from: the possession game's, the Sport Profile's and the TEST-ONLY roles.
    const captured: LoadedContract[][] = []
    buildActivityFromKnowledge(['GF2'], session, { alter: c => void (c.push(testContract()), captured.push(c)) })
    return captured[0]
})()
const built = () => blocks.map(block => ({ block: { blockId: block.blockId, holders: { ...block.holders } }, fixture: JSON.parse(JSON.stringify(block.fixture)), contracts: JSON.parse(JSON.stringify(contracts)) }))
const renders = (from = built()): RenderedBlock[] => from.map(entry => ({ blockId: entry.block.blockId, fixture: entry.fixture, rendered: renderConcreteGame(entry.fixture) }))
const verdicts = (from: ReturnType<typeof built>) => Object.fromEntries(checkRoleBlocks(from, index, roles).map(check => [check.checkId, check.verdict]))
const failing = (from: ReturnType<typeof built>) => checkRoleBlocks(from, index, roles).filter(check => check.verdict === 'FAIL').map(check => check.checkId)

test('one activity from two complete games: each block passed alone, every cross-block check passed, the exchange stated', () => {
    const account = activity.roleBlocks!
    assert.equal(account.blocks.length, 2)
    assert.deepEqual(account.blocks.map(block => block.holders), [
        { BUILDING: 'TEAM_AT_AXIS_START', PRESSING: 'TEAM_AT_AXIS_END' },
        { BUILDING: 'TEAM_AT_AXIS_END', PRESSING: 'TEAM_AT_AXIS_START' },
    ])
    for (const block of account.blocks) {
        assert.equal(block.integrity.realizationAuthorized, true)
        assert.equal(block.integrity.postRealizationValidated, true)
        assert.equal(block.integrity.fidelityViolations, 0)
        assert.deepEqual(Object.values(block.integrity.acceptance).flat(), [], 'all three acceptance conditions hold in each block')
    }
    // RB-M joined 15 October 2026 (stage K4, his RD-1 answer): here no reassignment is recorded and no count differs, so the
    // exchange of roles moved nobody and it passes.
    // RB-L joined 21 October 2026 (stage 2D, physical-layout.ts): no choice to set the markings out once is recorded here, and no block
    // carries a layout, so it passes. Re-pointed in words only (stage 2G, his general rule, reply filed 23 October 2026, item 2: no record
    // is read): the only regions are the two end lines, the area's own edges, so there is nothing to set out once and nothing moves.
    assert.deepEqual(account.checks.map(check => [check.checkId, check.verdict]), ['RB-1', 'RB-2', 'RB-3', 'RB-4', 'RB-5', 'RB-6', 'RB-7', 'RB-8', 'RB-M', 'RB-L'].map(id => [id, 'PASS']))
    assert.equal(account.exchange, 'COACH_CALLS')
    assert.equal(account.firstBlock, 'COACH_CHOICE', 'which block is first is the coach (inferred from his D2, never chosen here)')
    // K3 review, 15 October 2026: labelled INFERRED for the reader (verifier correction, g-part-09), his D2 sentence exact.
    assert.ok(account.firstBlockBasis.startsWith('INFERRED') && account.firstBlockBasis.includes('"The coach determines when the teams exchange roles."'))
    assert.deepEqual(account.roles.map(role => [role.role, role.coachNoun, role.nounStatus]), [['BUILDING', 'building team', 'DRAFT'], ['PRESSING', 'pressing team', 'DRAFT']])

    const exchange = activity.rendered.instructions.filter(i => i.section === ROLE_EXCHANGE).map(i => i.text)
    // Re-pointed 15 October 2026 (K3 review): the second sentence no longer says each team keeps "the target it attacks,
    // for the whole activity". His D2 asks for the opposite half of the distinction to be explicit — "role-specific
    // objectives and target configurations change when the teams exchange roles" — and his M1 "Allow target configurations
    // to reflect each team's role during the block." The ends are fixed (C42); the target configurations are not.
    assert.deepEqual(exchange, [
        'Play in blocks: in each block one team is the building team and the other is the pressing team',
        'Each team keeps its end for the whole activity. When you call the next block the teams exchange roles, not ends; there is no set block length',
    ])
    // The guard: no sentence of the role-exchange section says a team's target stays the same across blocks.
    assert.ok(!exchange.some(text => /\btarget\b/i.test(text) && /\b(keeps?|same|whole activity|does not change|stays?)\b/i.test(text)), 'his D2: target configurations change with the roles')
    // Every sentence of each block's render is said once; in this game the blocks say the same, so none is block-only.
    const texts = activity.rendered.instructions.map(i => i.text)
    assert.equal(new Set(texts).size, texts.length, 'nothing said twice')
    assert.ok(activity.rendered.instructions.every(i => i.block === undefined))
    for (const block of blocks) for (const instruction of renderConcreteGame(block.fixture).instructions) assert.ok(texts.includes(instruction.text), instruction.text)
    assert.equal(activity.integrity.instructions, activity.rendered.instructions.length)
    assert.equal(activity.integrity.fidelityViolations, 0)
})

test('the possession game without roles is served exactly as before: no role section, no role account, no role nouns', () => {
    const plain = buildActivityFromKnowledge(['GF2'], session)
    const one = served(plain.activity, 'GF2 alone')
    assert.equal(one.roleBlocks, undefined)
    assert.ok(!one.rendered.instructions.some(i => i.section === ROLE_EXCHANGE))
    assert.equal((plain.fixture as any).roleNouns, undefined)
    assert.equal((plain.fixture as any).roleBlocks, undefined)
    assert.equal((plain.fixture as any).record.roleBlock, undefined, 'no block recorded for a game derived for none')
    // The shared sentences of the two-block activity are the single game's, word for word.
    const shared = activity.rendered.instructions.filter(i => i.section !== ROLE_EXCHANGE).map(i => [i.section, i.text, i.status])
    assert.deepEqual(shared, one.rendered.instructions.map(i => [i.section, i.text, i.status]))
})

test('key identity: each block fixture crosses whole, with the block it was derived for; the account carries the same blocks', () => {
    const single: any = buildActivityFromKnowledge(['GF2'], session).fixture
    for (const [i, block] of blocks.entries()) {
        // Re-pointed 23 October 2026 (stage C, physical-layout.ts): and the account of what moves at the exchange, given wherever the blocks
        // were read and the markings are not set out once: here the only regions are the end lines, so nothing moves and it is empty.
        assert.deepEqual(Object.keys(block.fixture).sort(), [...Object.keys(single), 'remarking', 'roleNouns'].sort(), 'a block fixture has every key a single fixture has, plus the role nouns and what moves')
        assert.deepEqual(block.fixture.remarking, { lengthM: 40, changes: [] }, 'nothing moves at the exchange')
        assert.deepEqual(block.fixture.record.roleBlock, { blockId: block.blockId, holders: block.holders }, 'the game records the block it was derived for')
        // Moved 15 October 2026 (stage K7): the role nouns cross with which role each block-scoped holder names (`holders`), so a value
        // written for a role holder (a restart's awardee, a start placement's group) is said by that role's noun. Its consumer is the
        // renderer (render-concrete-game.ts `teamNoun`); key identity with the register's holders below.
        assert.deepEqual(block.fixture.roleNouns, { status: 'DRAFT', nouns: { BUILDING: 'building team', PRESSING: 'pressing team' }, holders: { ROLE_HOLDER_BUILDING: 'BUILDING', ROLE_HOLDER_PRESSING: 'PRESSING' } })
        assert.deepEqual(Object.keys(block.fixture.roleNouns.holders), roleHolderNames(index), 'key identity: every holder the register names, and no other')
        assert.equal(activity.roleBlocks!.blocks[i].blockId, block.blockId)
        assert.ok(Array.isArray(block.fixture.game.activityRoles) && block.fixture.game.activityRoles.length === 2, 'the roles are elements of each game')
    }
    assert.notEqual(blocks[0].fixture.provenance.inputDigest, blocks[1].fixture.provenance.inputDigest, 'two blocks are two inputs')
    assert.deepEqual(Object.keys(fixture.roleBlocks).sort(), ['blocks', 'checks', 'exchange', 'roleNouns', 'roles'])
    assert.deepEqual(fixture.roleBlocks.checks.map((c: any) => c.checkId), activity.roleBlocks!.checks.map(c => c.checkId))
    // The one consumer of the composed fixture's blocks: rendered again, they give exactly the served activity.
    const again = composeRoleBlockActivity(blocks.map(b => ({ blockId: b.blockId, fixture: b.fixture, rendered: renderConcreteGame(b.fixture) })), index)
    assert.deepEqual(again.instructions, activity.rendered.instructions)
    for (const block of blocks) assert.equal(checkFidelity(block.fixture, renderConcreteGame(block.fixture)).findings.filter(f => f.severity === 'VIOLATION').length, 0)
})

test('every cross-block check refuses its own violation, made on a copy', () => {
    assert.deepEqual(failing(built()), [])

    // RB-1: an element in one block only.
    const extraRegion = built()
    extraRegion[1].fixture.game.space.regions.push({ elementId: 'c:TEST-ONLY:region' })
    assert.ok(failing(extraRegion).includes('RB-1'))
    // RB-1 (stage M2, 17 October 2026): an occurrence that also counts as the primary event (row V27) in one block only. Before V27
    // joined RB-1's rows, an element missing from one block passed the cross-block check (the design verifier read role-blocks.ts).
    const extraOccurrence = built()
    extraOccurrence[1].fixture.game.value.primaryEvent.alsoCounts = [{ elementId: 'c:TEST-ONLY:also' }]
    assert.deepEqual(failing(extraOccurrence), ['RB-1'])

    // RB-2: an objective's team moved in one block — an end changed with the roles.
    const movedEnd = built()
    const objective = movedEnd[1].fixture.game.objectives[0]
    objective.team = objective.team === 'TEAM_AT_AXIS_START' ? 'TEAM_AT_AXIS_END' : 'TEAM_AT_AXIS_START'
    assert.ok(failing(movedEnd).includes('RB-2'))
    const rebound = built()
    // The two bindings' handles exchanged as whole values (a handle is opaque and never parsed: identity.unit.ts).
    const bound: any[] = rebound[1].fixture.record.designationBindings
    rebound[1].fixture.record.designationBindings = bound.map((b, i) => ({ ...b, handle: bound[bound.length - 1 - i].handle }))
    assert.ok(failing(rebound).includes('RB-2'), 'the end-to-team binding is part of the ends')

    // RB-3: a third region a role-keyed selector created.
    const third = built()
    third[0].fixture.game.space.regions.push({ elementId: 'c:TEST-ONLY:third', selector: [{ attribute: 'targetOf', op: '=', value: 'ROLE_HOLDER_BUILDING' }] })
    assert.ok(failing(third).includes('RB-3'))

    // RB-4: a derived value that differs with nothing role-keyed behind it.
    const unexplained = built()
    const entry = unexplained[1].fixture.status.derived.find((d: any) => typeof d.value === 'number')
    entry.value = entry.value + 1
    assert.ok(failing(unexplained).includes('RB-4'))

    // RB-5: a game that records another block than the one it was derived for; two blocks that are not each other's exchange.
    const misrecorded = built()
    misrecorded[1].fixture.record.roleBlock = misrecorded[0].block
    assert.ok(failing(misrecorded).includes('RB-5'))
    const sameTwice = built()
    sameTwice[1].block = sameTwice[0].block
    sameTwice[1].fixture.record.roleBlock = sameTwice[0].block
    assert.ok(failing(sameTwice).includes('RB-5'))

    // RB-6: a different number of players in one block.
    const morePlayers = built()
    morePlayers[1].fixture.game.performers.teams[0].outfieldCount += 1
    assert.ok(failing(morePlayers).includes('RB-6'))

    // RB-7: a role-keyed time expiry.
    const timed = built()
    for (const entry of timed) entry.contracts.push(testContract([{ itemId: 'T-7', row: 'T1', selector: 'trigger=TIME_EXPIRY', requirement: 'EXISTS', value: 'ROLE_HOLDER_BUILDING' }]))
    assert.ok(failing(timed).includes('RB-7'))
})

test('RB-8: a role-keyed position must mirror between the blocks; the mirror passes, an absolute position is refused', () => {
    // On a copy: the two target regions' along positions are made role-keyed (their support is a TEST-ONLY item written for
    // the building holder) and given depths. The building team's target is region f in block X and region e in block Y.
    const keyed = (from: ReturnType<typeof built>, intervals: [Record<string, [number, number]>, Record<string, [number, number]>]) => {
        from.forEach((entry, i) => {
            entry.contracts.push(testContract([{ itemId: 'T-8', row: 'S5', selector: 'targetOf=ROLE_HOLDER_BUILDING', requirement: 'EQUALS', value: 'TEST-ONLY' }]))
            for (const [region, [a, b]] of Object.entries(intervals[i])) {
                const path = `space.regions[c:restated:GF2:${region}].position.along`
                const derived = entry.fixture.status.derived.find((d: any) => d.path === path)
                derived.support = [{ kind: 'CONTRACT_ITEM', contractId: 'TEST-ONLY:roles', itemId: 'T-8' }]
                derived.value = `TEST-ONLY ${a}-${b}`
                entry.fixture.status.geometry.find((g: any) => g.path === path).geometry.interval = { from: a, to: b }
            }
        })
        return from
    }
    // Block X: f (building) is the last 10 m. Block Y: e (building) is the first 10 m — the mirror along a 40 m axis.
    const mirrored = keyed(built(), [{ 'GF2-03.f': [30, 40], 'GF2-03.e': [0, 5] }, { 'GF2-03.e': [0, 10], 'GF2-03.f': [35, 40] }])
    assert.equal(verdicts(mirrored)['RB-4'], 'PASS', 'the difference is explained by the role-keyed item')
    assert.equal(verdicts(mirrored)['RB-8'], 'PASS', JSON.stringify(checkRoleBlocks(mirrored, index, roles).find(c => c.checkId === 'RB-8')))
    const absolute = keyed(built(), [{ 'GF2-03.f': [30, 40], 'GF2-03.e': [0, 5] }, { 'GF2-03.e': [0, 12], 'GF2-03.f': [35, 40] }])
    assert.equal(verdicts(absolute)['RB-8'], 'FAIL', 'the building target is 10 m deep in one block and 12 m in the other')
})

test('fidelity Q6 refuses a lost, an invented or a misplaced sentence, a missing ends-fixed or roles statement, and the ends changing', () => {
    const blockRenders = renders()
    const composed = composeRoleBlockActivity(blockRenders, index)
    const q6 = (activityText: RenderedActivity, from = blockRenders) => checkRoleBlockComposition(from, activityText, index).filter(f => f.severity === 'VIOLATION').map(f => f.what)
    assert.deepEqual(q6(composed), [])

    const without = (predicate: (i: Instruction) => boolean): RenderedActivity => ({ ...composed, instructions: composed.instructions.filter(i => !predicate(i)) })
    assert.ok(q6(without(i => i.text.startsWith('Mark out an area'))).some(w => w.includes('and the activity does not')), 'a block sentence lost')
    const invented: RenderedActivity = { ...composed, instructions: [...composed.instructions, { ...composed.instructions[0], text: 'TEST-ONLY: a sentence no block says' }] }
    assert.ok(q6(invented).some(w => w.includes('not every block')), 'an invented sentence')
    const misplaced: RenderedActivity = { ...composed, instructions: composed.instructions.map((i, n) => (n === 0 ? { ...i, block: 'TEST-ONLY-block' } : i)) }
    assert.ok(q6(misplaced).some(w => w.includes('whose game does not say it')), 'a sentence put under a block that does not say it')

    // The ends-fixed statement removed from both renders and the activity: refused, his D2 quoted.
    const endsFixed = (i: Instruction) => i.section === ROLE_EXCHANGE && i.text.startsWith('Each team keeps its end')
    const strippedRenders = blockRenders.map(b => ({ ...b, rendered: { ...b.rendered, instructions: b.rendered.instructions.filter(i => !endsFixed(i)) } }))
    assert.ok(q6(without(endsFixed), strippedRenders).some(w => w.includes('Please make that distinction explicit')))
    const rolesLine = (i: Instruction) => i.section === ROLE_EXCHANGE && i.text.startsWith('Play in blocks')
    const noRoles = blockRenders.map(b => ({ ...b, rendered: { ...b.rendered, instructions: b.rendered.instructions.filter(i => !rolesLine(i)) } }))
    assert.ok(q6(without(rolesLine), noRoles).some(w => w.includes('which roles the teams hold')))

    // A sentence saying the ends change, in every render and the activity alike, is still refused (RB-2 says they do not).
    const swap = (i: Instruction) => (endsFixed(i) ? { ...i, text: 'When you call the next block the teams swap ends' } : i)
    const swapRenders = blockRenders.map(b => ({ ...b, rendered: { ...b.rendered, instructions: b.rendered.instructions.map(swap) } }))
    assert.ok(q6({ ...composed, instructions: composed.instructions.map(swap) }, swapRenders).some(w => w.includes('says the ends change')))
    // A sentence only one block says is composed under that block, and that is admitted.
    const oneBlockOnly = blockRenders.map((b, n) => (n === 0 ? { ...b, rendered: { ...b.rendered, instructions: [...b.rendered.instructions, { ...b.rendered.instructions[0], text: 'TEST-ONLY: block one only' }] } } : b))
    const composedOne = composeRoleBlockActivity(oneBlockOnly, index)
    assert.equal(composedOne.instructions.find(i => i.text === 'TEST-ONLY: block one only')!.block, oneBlockOnly[0].blockId)
    assert.deepEqual(q6(composedOne, oneBlockOnly), [])
})

test('no defending-team noun, and no sentence divides the session minutes among blocks', () => {
    const text = activity.rendered.instructions.map(i => i.text).join(' | ')
    assert.ok(!/\bdefending team\b/i.test(text), 'his D7: the assigned team roles, never "the defending team"')
    const minutes = activity.rendered.instructions.filter(i => /\bminutes?\b/i.test(i.text))
    assert.deepEqual(minutes.map(i => i.text), ['Play for 20 minutes'], 'the session minutes are said once, whole')
    assert.ok(!/\bblock (length|duration) of\b|\bminutes? (per|each) block\b/i.test(text))
})

test('part of a role exchange is refused at structure, never completed', () => {
    const oneRole = refused(withRoles([], ['T-2']).activity, 'one role only')
    assert.equal(oneRole.stage, 'structure')
    assert.equal(oneRole.summary, 'The game this demonstration selects is not yet described completely enough to be set up.')
    assert.equal(oneRole.reasons[0], 'the game establishes part of a role exchange, so it cannot be played in role blocks')
    assert.ok(oneRole.reasons.some(r => r.includes('no contribution establishes the role PRESSING')))
    const noExchange = refused(withRoles([], ['T-3']).activity, 'no exchange')
    assert.ok(noExchange.reasons.some(r => r.includes('how the role passes to the other team is not established')))
})

// What moves this stop (K3 review, 15 October 2026): the build-out episode's beginning — capability M3 (stage K5) and the
// typed begin condition C58, held for his acknowledgement (our email of 17 October) — exactly as for the single game
// (activity-review.unit.ts). The role blocks neither cause it nor move it.
//
// **Moved 15 October 2026 (stage K5), as predicted: the work succeeding.** A01-R1's start, after-score and coach-judged
// restarts and C58 (his 18 October acknowledgement) let the build-out episode begin, so GA-EPISODE-REACHABLE passes in each
// block; each block now stops, the same in both, on the progression reference (RPC-001-18.d, open text: what moves it is the
// target placement of stage K6, C54/D3/M7), which leaves GA-ONE-PRIMARY-EVENT and GA-REFERENCE-INTEGRITY unevaluable.
//
// **Moved 15 October 2026 (stage K6), as predicted: the work succeeding.** Ruling C59 typed the progression reference and A01-R1
// places the pressure reference, the targets and the starting placements (his 18 October item 3), so both blocks pass structure,
// realization and the post-realization gates. With no goalkeeper in the session each block is now refused for that (the
// realization's keeper for the building role); with one, each stops at validation in the same place, named by block: the
// context-scoring guard reads only whole-game conditions, and RPC-001's four are authored for the build-out episode.
test('A01 behind its record: two blocks built and SERVED since design step L14; without A01-W2 (TEST-ONLY) each stops in the same place, named by block (stage K7: communication, was validation)', () => {
    const behind = learningGoalAuthorizations().map((record: any) => ({
        ...record,
        manipulations: record.manipulations.map((m: any) => (m.status === 'MISSING_KNOWLEDGE' || m.status === 'MISSING_CAPABILITY' ? { ...m, category: 'EXISTING_KNOWLEDGE_TO_VERIFY', status: 'NOT_SELECTED_FOR_FIRST_DEMO', gaps: [], note: 'TEST-ONLY' } : m)),
        provisionalChoices: (record.provisionalChoices ?? []).map((c: any) => (c.status === 'MISSING_KNOWLEDGE' || c.status === 'MISSING_CAPABILITY' ? { ...c, status: 'AUTHORIZED_BY_RULING', gaps: [], note: 'TEST-ONLY' } : c)),
    }))
    const keeperless = refused(buildActivityUnderAuthorizationRecords({ kind: 'learning-goal', goalId: 'A01', session }, behind as any).activity, 'A01 behind its record, no goalkeeper')
    assert.equal(keeperless.stage, 'session')
    assert.equal(keeperless.summary, `This game needs 1 ${specializedRoleNames()[0]} in all and the session has 0.`)
    const withKeeper = { ...session, roles: { ...none, [specializedRoleNames()[0]]: 1 } }
    /**
     * **Moved 18 October 2026 (design step L14): communication -> SERVED, the work succeeding.** His reply filed 20 October 2026, item 1:
     * "Pressing team's regain score — Approved as written." (entry A01-W2, which says the four fields that were the whole stop pinned
     * below), and item 2, his own eligibility sentence (entry A01-W3). Both blocks are served, every cross-block check passing. The stop
     * as it stood is still pinned, measured on a TEST-ONLY table without A01-W2, so what moved it stays visible.
     */
    const servedNow = served(buildActivityUnderAuthorizationRecords({ kind: 'learning-goal', goalId: 'A01', session: withKeeper }, behind as any).activity, 'A01 behind its record')
    assert.deepEqual(servedNow.roleBlocks!.checks.map(check => check.verdict), servedNow.roleBlocks!.checks.map(() => 'PASS'))
    assert.deepEqual(servedNow.roleBlocks!.blocks.map(block => block.blockId), ['BUILDING=TEAM_AT_AXIS_START,PRESSING=TEAM_AT_AXIS_END', 'BUILDING=TEAM_AT_AXIS_END,PRESSING=TEAM_AT_AXIS_START'])
    const readWording = wordingModule.approvedWording
    const productionWording = readWording()
    let a01: RefusedActivity
    try {
        ;(wordingModule as any).approvedWording = () => JSON.parse(JSON.stringify(productionWording.filter(entry => entry.id !== 'A01-W2')))
        a01 = refused(buildActivityUnderAuthorizationRecords({ kind: 'learning-goal', goalId: 'A01', session: withKeeper }, behind as any).activity, 'A01 behind its record, without A01-W2 (TEST-ONLY)')
    } finally {
        ;(wordingModule as any).approvedWording = readWording
    }
    /**
     * **Moved 15 October 2026 (stage K7): validation -> communication, the work succeeding.** The guard now confirms an episode-scoped
     * condition where the concrete game begins its episode (GA-EPISODE-REACHABLE PASS as rerun on it: context-scoring-guard.ts
     * `episodeConfirmed`), so each block passes validation, the cross-block checks run and pass, and both blocks stop at
     * communication on the same fields: the four build-out conditions (type, referents, value where they hold one, and the scope),
     * which wait on his approved wording, and fidelity's Q3 note of each as uncarried. Every other sentence is said (K7, DRAFT).
     */
    assert.equal(a01.stage, 'communication')
    const fields: [string, string[]][] = [['18.a', ['type', 'referents', 'scope']], ['18.c', ['type', 'referents', 'value', 'scope']], ['18.f', ['type', 'referents', 'value', 'scope']], ['19.a', ['type', 'referents', 'value', 'scope']]]
    const ROW: Record<string, string> = { type: 'V4', referents: 'V5', value: 'V6', scope: 'V3' }
    /**
     * **Moved 17 October 2026 (stage M1): the roles' credit bounds join the same stop, in each block.** Row B8 (his reply filed 19
     * October 2026, item 1 and item 3 C): the building role's BUILD_OUT_EPISODE waits on approved wording first, and fidelity notes
     * both roles' bounds as uncarried - the building role's because it is withheld, the pressing role's WHOLE_GAME because no sentence
     * cites it yet (design step L9, stage M3). Nothing else moves; the stage and the summary are unchanged.
     */
    const bound = (element: string) => `activityRoles[c:provisional:A01-R1:A01-R1-${element}].creditedWithin`
    /**
     * **Moved 17 October 2026 (stage M2): the pressing role's regain score joins the same stop, in each block.** Rows V28-V31 (his
     * reply filed 19 October 2026, item 2): its four fields wait on approved wording, and fidelity notes each as uncarried. The
     * cross-block checks still pass (RB-1 now compares the element in both blocks, and it is one element). Nothing else moves.
     */
    const ALSO: [string, string][] = [['team', 'V28'], ['trigger', 'V29'], ['control', 'V30'], ['exclusion', 'V31']]
    const also = (field: string) => `value.primaryEvent.alsoCounts[c:provisional:A01-R1:A01-R1-V27-1].${field}`
    /**
     * **Moved 18 October 2026 (stage M5, design step L13): the building role's bound and the four build-out conditions leave the stop,
     * in each block.** His approved sentence says them (entry A01-W1, his reply filed 19 October 2026, item 1: "Approved with revised
     * wording"), so what stops both blocks is the regain score alone: its four fields awaiting the sentence put to him (A01-W2) and
     * fidelity's Q3 note of each. Was: the bound, every condition field and the regain fields. The cross-block checks still pass.
     */
    assert.deepEqual(
        a01.reasons,
        ['BUILDING=TEAM_AT_AXIS_START,PRESSING=TEAM_AT_AXIS_END', 'BUILDING=TEAM_AT_AXIS_END,PRESSING=TEAM_AT_AXIS_START'].flatMap(block => [
            ...ALSO.map(([field, row]) => `block ${block}: awaiting approved wording: ${also(field)} (${row})`),
            ...ALSO.map(([field]) => `block ${block}: fidelity Q3: ${also(field)} is established by the game and no instruction carries it`),
        ]),
    )
    const saidByHisSentence = [bound('B1-1'), ...fields.flatMap(([id, held]) => held.map(field => `value.primaryEvent.conditions[c:restated:RPC-001:RPC-001-${id}].${field} (${ROW[field]})`.split(' ')[0]))]
    assert.equal(saidByHisSentence.length, 16, 'the bound and the fifteen condition fields')
    assert.ok(!a01.reasons.some(reason => saidByHisSentence.some(path => reason.includes(path))), 'nothing his A01-W1 sentence says is among the reasons')
    // DRAFT coach sentence for this refusal (existing wording).
    assert.equal(a01.summary, 'Part of this activity is still waiting for approved coach wording, so it is not being shown.')
})

console.log(`role-blocks.unit.ts (rendering) — ${passed} passed`)
