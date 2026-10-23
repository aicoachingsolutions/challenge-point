/**
 * The coach-controlled end exchange — stage D, 23 October 2026 (the design's Stage D, his priority 5; register version 18, row B10 and the
 * endAssignment block).
 *
 * Christian, reply filed 25 October 2026, item 5: *"I approve revising the earlier fixed-end decision."* *"Team-end assignments may change
 * between coach-controlled blocks when the authorized activity configuration requires it."* *"Please keep the following concepts separate in
 * the general representation: Team identity. Assigned game role. Assigned field end. Participant membership and reassignment."* *"Exchanging
 * roles should not automatically require exchanging ends, and exchanging ends should not inherently require transferring participants."*
 *
 * What is pinned here:
 *   1. the register carries the capability as data (row B10, a game-level FIELD row never owned by the role collection; the closed list
 *      KEPT/EXCHANGED with its versions entry; the endAssignment block naming the two ends) and refuses a damaged copy (halt H1);
 *   2. KEPT ids unchanged: production A01 (the zone version, A01-R1) derives the same two blocks, ids, records and descriptions as before,
 *      and its game states no end assignment;
 *   3. the B10 consumer in derivation: an end assignment EXCHANGED gives two blocks holding the first block's holders, the second with the
 *      ends exchanged (never the role exchange followed by a swap); an explicit KEPT gives exactly the kept blocks; an unresolved one is
 *      refused, never read as kept;
 *   4. EXCHANGED without role blocks is refused (blocks exist only where the roles exchange);
 *   5. realization: the second block's binding is the first's exchanged, with a reason citing B10, entailed and checked (a block and a
 *      game that disagree, a malformed block, an exchange with no binding to exchange: each refused);
 *   6. an end exchange with equal counts moves nobody (the possession game with TEST-ONLY roles, served), and an unrecorded change is
 *      refused (RB-M);
 *   7. EXCHANGED with goalkeeper + 1 passes where the old reading refused ("the BUILDING role stays with one team"): expectedChange with
 *      each block's own binding, and production A01's zone version with a TEST-ONLY B10 served at 12/1 and 11/1 with the membership moved;
 *   8. the cross-block checks under EXCHANGED: RB-2 (holders identical, binding exchanged), RB-5 (role to team), RB-8 (the same place, not
 *      the mirror) and the role pairing (`counterpartMap`, mirroring nothing) each refuse their own violation; RB-M reads each block's binding;
 *   9. fidelity Q6 under EXCHANGED requires a sentence saying the teams change ends (citing B10) and refuses one saying each team keeps its
 *      end; ENDS_CHANGE is refused only under KEPT.
 *
 * Every end-assignment value here is TEST-ONLY and in memory: no production file is written, nothing here is served, and no knowledge item
 * writes B10 (A01-R2's "B10 EXCHANGED" is his decision, the design's F2).
 *
 * Run: npx ts-node --files -r tsconfig-paths/register ./src/system/rendering/end-exchange.unit.ts
 */
import assert from 'node:assert/strict'

import { loadRegister } from '../derivation/corpus'
import { runStages0to5 } from '../derivation/engine'
import { expectedChange } from '../derivation/reassignment'
import { HaltError, indexRegister } from '../derivation/register'
import { blockIdOf, endAssignmentOf, endsExchangeOf, exchangeOf, roleBlocksOf, secondBlockOf } from '../derivation/role-blocks'
import { derivationInputFor } from '../derivation/run-bounded-selection'
import { ResolvedGame } from '../derivation/resolved-game'
import { LoadedContract, RoleBlock } from '../derivation/types'
import { realize, Realized } from '../realization/realize'
import { learningGoalAuthorizations } from '../test-library/learning-goal-authorizations'
import { approvedWording } from './approved-wording'
import { buildActivityFromKnowledge, buildActivityUnderAuthorizationRecords, buildActivityWithFixture, RefusedActivity, ServedActivity } from './build-activity'
import { renderConcreteGame, ROLE_EXCHANGE } from './render-concrete-game'
import { checkRoleBlockComposition, checkRoleBlocks, composeRoleBlockActivity, counterpartMap, ENDS_CHANGE, ENDS_CHANGE_DENIED, ENDS_KEPT, endsExchangedIn, RenderedBlock } from './role-blocks'
import { specializedRoleNames } from './session-envelope'

let passed = 0
function test(name: string, body: () => void): void {
    body()
    passed++
    console.log(`  ok  ${name}`)
}
console.log('the coach-controlled end exchange (stage D)')

const register = loadRegister()
const index = indexRegister(register)
const spec = index.endAssignment!
const roles = index.roleBlocks!.roles
const [START, END] = spec.ends
const KEEPER = specializedRoleNames()[0]
const none = Object.fromEntries(specializedRoleNames().map(role => [role, 0]))
const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value))
const session12 = { players: 12, lengthM: 40, widthM: 30, durationMin: 20, roles: none }
const a01Session = (players = 12, keepers = 1) => ({ players, lengthM: 40, widthM: 30, durationMin: 20, roles: { ...none, [KEEPER]: keepers } })
const P = 'provisional:A01-R1'
/** The teams row's outfield leaf, read from the register (row P2). */
const OUTFIELD = String(index.rows.get('P2')!.path).split('[].').pop()!

/** TEST-ONLY items, never production data. */
const testItem = (itemId: string, row: string, selector: string, requirement: string, value: unknown) =>
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
    }) as any
const testContract = (items: any[]): LoadedContract => ({ contractId: 'TEST-ONLY:roles', objectId: 'TEST-ONLY:roles', knowledgeVersion: 'stage-b', items, declarations: [], relationshipRules: [] }) as any
const ROLE_ITEMS = [
    testItem('T-1', 'B1', `activityRole=${roles[0]}`, 'EXISTS', 'N/A'),
    testItem('T-2', 'B1', `activityRole=${roles[1]}`, 'EXISTS', 'N/A'),
    testItem('T-3', 'B3', '*', 'EQUALS', index.roleBlocks!.exchanges[0]),
]
const endItem = (value: unknown) => testItem('T-B10', spec.row, '*', 'EQUALS', value)
const gf2Input = (items: any[]) => {
    const input = derivationInputFor({ selected: [{ id: 'GF2', role: 'game form' }] })
    return { ...input, contracts: [...copy(input.contracts), testContract(items)] }
}
const blocksFound = (items: any[]) => {
    const base: any = runStages0to5(gf2Input(items))
    return { found: roleBlocksOf(base.classes, base.derived.lines, index), assignment: endAssignmentOf(base.derived.lines, index) }
}
const captured: LoadedContract[][] = []
const gf2 = (items: any[], alterSupplied?: (supplied: any) => void) =>
    buildActivityFromKnowledge(['GF2'], session12 as any, { alter: contracts => void (contracts.push(testContract(items)), captured.push(contracts)), ...(alterSupplied ? { alterSupplied } : {}) })
const a01 = (extra: any[], drop: string[] = [], session = a01Session()) =>
    buildActivityUnderAuthorizationRecords({ kind: 'learning-goal', goalId: 'A01', session } as any, learningGoalAuthorizations(), {
        alter: contracts => {
            const contract = contracts.find(c => c.contractId === P)!
            contract.items = contract.items.filter(item => !drop.includes(item.itemId))
            contract.items.push(...extra)
            captured.push(contracts)
        },
        review: { includeDrafts: true },
    })
type Built = { block: RoleBlock; fixture: any; contracts: LoadedContract[] }
/** The blocks of a composed fixture, each with the block its game records (so `ends` is the record's) and the contracts it was derived from. */
const builtOf = (fixture: any, contracts: LoadedContract[]): Built[] =>
    ((fixture?.roleBlocks?.blocks ?? []) as any[]).map(block => ({ block: copy(block.fixture.record.roleBlock), fixture: copy(block.fixture), contracts: copy(contracts) }))
const verdicts = (built: Built[]) => Object.fromEntries(checkRoleBlocks(built, index, roles).map(check => [check.checkId, check.verdict]))
const failing = (built: Built[]) => checkRoleBlocks(built, index, roles).filter(check => check.verdict === 'FAIL').map(check => check.checkId)
const problemsOf = (built: Built[], id: string) => checkRoleBlocks(built, index, roles).find(check => check.checkId === id)!.problems
const served = (activity: ServedActivity | RefusedActivity, label: string): ServedActivity => {
    assert.equal(activity.outcome, 'served', `${label}: ${JSON.stringify((activity as RefusedActivity).reasons)}`)
    return activity as ServedActivity
}
const KEPT_IDS = [`${roles[0]}=${START},${roles[1]}=${END}`, `${roles[0]}=${END},${roles[1]}=${START}`]

// ── 1. The register ─────────────────────────────────────────────────────────────────────────────────────
test('the register carries the end exchange as data (version 18): a game-level row, a two-member closed list with its versions entry, its own block', () => {
    const row = index.rows.get(spec.row)!
    assert.equal(spec.row, 'B10')
    assert.equal(row.kind, 'FIELD')
    assert.equal(row.ownerRow, undefined, 'game-level: never a field of the role collection (his item 5 keeps role and end apart)')
    assert.equal(spec.path, 'blocks.endAssignment')
    assert.deepEqual(spec.values, ['KEPT', 'EXCHANGED'])
    assert.deepEqual([spec.kept, spec.exchanged], ['KEPT', 'EXCHANGED'])
    assert.deepEqual(spec.ends, ['TEAM_AT_AXIS_START', 'TEAM_AT_AXIS_END'])
    for (const end of spec.ends) assert.equal(index.designations.resolutions.get(end)?.kind, 'SETUP_ASSIGNMENT')
    assert.match(String(index.vocabularyVersions['B10.endAssignment']), /^1 \(2026-10-23, register version 18, draft\)/)
    assert.equal(index.fillable.has(spec.row), false, 'not a realization choice: an authorized realization writes it, nothing chooses it')
    // Re-pointed 23 October 2026 (stage E): version 19 (an object's availability as a session resource, his item 4) supersedes 18, once.
    assert.match(String(register.version), /^19, adds an object's availability as a session resource, .*Supersedes version 18, which adds the coach-controlled end exchange, .*Supersedes version 17, which adds object targets and the geometry a goal needs, .*Supersedes version 16, which adds one primary scoring event per role, /)
    assert.ok(String(register.version).includes('"Team-end assignments may change between coach-controlled blocks when the authorized activity configuration requires it."'), 'the version entry quotes item 5')
    assert.equal(String(register.version).split('Supersedes version 17, ').length - 1, 1)
    assert.equal(String(register.version).split('Supersedes version 18, ').length - 1, 1)
    assert.ok(!String(register.version).includes('Supersedes version 19'), 'version 19 is the current entry')
    // The glosses S3 restates are untouched: C42's fixed ends stay the reading of every game that states no exchange.
    assert.ok(String(register.teamDesignations.resolutions.TEAM_AT_AXIS_START.from).includes('fixed for the activity'))
    assert.ok(String(index.rows.get('B3')!.valueType).includes('change of ends can be stated here'))
})

test('a damaged end-assignment block halts the index (H1)', () => {
    const halts = (alter: (r: any) => void, pattern: RegExp) => {
        const damaged = copy(register)
        alter(damaged)
        assert.throws(() => indexRegister(damaged), (error: unknown) => error instanceof HaltError && pattern.test(error.message), pattern.source)
    }
    halts(r => (r.endAssignment.row = 'B3'), /is not a game-level FIELD row/)
    halts(r => (r.rows.find((row: any) => row.id === 'B10').ownerRow = 'B1'), /is not a game-level FIELD row/)
    halts(r => (r.endAssignment.row = 'B1'), /is not a game-level FIELD row/)
    halts(r => r.vocabularies['B10.endAssignment'].push('SOMETIMES'), /exactly two values/)
    halts(r => (r.endAssignment.exchanged = 'KEPT'), /must be the two different members/)
    halts(r => (r.endAssignment.kept = 'SWAPPED'), /must be the two different members/)
    halts(r => (r.endAssignment.ends = ['TEAM_AT_AXIS_START', 'ROLE_HOLDER_<role>']), /SETUP_ASSIGNMENT designations/)
    halts(r => (r.endAssignment.ends = ['TEAM_AT_AXIS_START', 'TEAM_AT_AXIS_START']), /SETUP_ASSIGNMENT designations/)
    halts(r => (r.endAssignment.ends = ['TEAM_AT_AXIS_START']), /SETUP_ASSIGNMENT designations/)
    halts(r => {
        delete r.roleBlocks
        delete r.reassignment
        delete r.roleScoring
    }, /endAssignment: the ends change only at a coach-called block/)
    // A register written before version 18 has no end exchange, and indexes.
    const before = copy(register)
    delete before.endAssignment
    assert.equal(indexRegister(before).endAssignment, null)
})

// ── 2. KEPT: every id, record and description as before ────────────────────────────────────────────────
const production = buildActivityWithFixture({ kind: 'learning-goal', goalId: 'A01', situationId: null, session: a01Session() } as any)
test('KEPT ids unchanged: production A01 derives the same two blocks, ids and records, states no end assignment, and every description is as before', () => {
    const activity = served(production.activity, 'A01 12/1')
    const blocks: any[] = (production.fixture as any).roleBlocks.blocks
    assert.deepEqual(blocks.map(block => block.blockId), KEPT_IDS)
    assert.deepEqual(activity.roleBlocks!.blocks.map(block => block.blockId), KEPT_IDS)
    for (const block of blocks) {
        assert.deepEqual(block.fixture.record.roleBlock, { blockId: block.blockId, holders: block.holders }, 'no ends recorded for a game that keeps its ends')
        assert.equal(block.fixture.game.blocks, undefined, 'production A01 states no end assignment')
        assert.ok(!(block.fixture.status?.derived ?? []).some((entry: any) => entry.path === spec.path))
    }
    assert.deepEqual(blocks[0].fixture.record.designationBindings, blocks[1].fixture.record.designationBindings, 'the binding is the same in both blocks')
    assert.equal(endsExchangedIn(blocks.map(block => block.fixture.game), index), false)
    const what = Object.fromEntries(activity.roleBlocks!.checks.map(check => [check.checkId, check.what]))
    assert.equal(what['RB-2'], 'each team keeps its end: objectives, references, direction and the end-to-team binding identical')
    assert.equal(what['RB-5'], 'each block binds every role to one end-assigned team, the second is the exchange of the first, and each game records its block')
    assert.equal(what['RB-8'], 'a position written for a role is the same by role and mirrored along the axis')
    assert.ok(activity.rendered.instructions.some(i => i.section === ROLE_EXCHANGE && i.text.startsWith('Each team keeps its end for the whole activity.')))
    assert.ok(!activity.rendered.instructions.some(i => i.from.includes(spec.path)), 'no sentence cites an end assignment the game does not state')
    // The derivation's own blocks, read directly: the role exchange, no ends.
    const kept = blocksFound(ROLE_ITEMS)
    assert.equal(kept.found.kind, 'BLOCKS')
    if (kept.found.kind === 'BLOCKS') assert.deepEqual(kept.found.blocks, [{ blockId: KEPT_IDS[0], holders: { [roles[0]]: START, [roles[1]]: END } }, { blockId: KEPT_IDS[1], holders: { [roles[0]]: END, [roles[1]]: START } }])
    assert.deepEqual(kept.assignment, { value: spec.kept, stated: false, lineId: `game::${spec.row}` }, 'absent means KEPT')
})

// ── 3. The B10 consumer in derivation ───────────────────────────────────────────────────────────────────
test('the B10 consumer: EXCHANGED keeps the first block\'s holders in both blocks and exchanges the ends in the second; KEPT stated gives the kept blocks; unresolved is refused', () => {
    const exchanged = blocksFound([...ROLE_ITEMS, endItem(spec.exchanged)])
    assert.deepEqual(exchanged.assignment, { value: spec.exchanged, stated: true, lineId: `game::${spec.row}` })
    assert.equal(exchanged.found.kind, 'BLOCKS')
    if (exchanged.found.kind !== 'BLOCKS') return
    const [first, second] = exchanged.found.blocks
    const holders = { [roles[0]]: START, [roles[1]]: END }
    assert.deepEqual(first, { blockId: `${KEPT_IDS[0]}|${START}<${START},${END}<${END}`, holders, ends: { [START]: START, [END]: END } })
    assert.deepEqual(second, { blockId: `${KEPT_IDS[0]}|${START}<${END},${END}<${START}`, holders, ends: { [START]: END, [END]: START } })
    assert.deepEqual(first.holders, second.holders, 'each role is played from the same end in both blocks')
    assert.notEqual(first.blockId, second.blockId, 'two blocks, two ids')
    // Never the role exchange followed by a swap of ends: that would give one team the same role in both blocks from opposite ends.
    const roleExchange = exchangeOf(first, roles)!
    assert.notDeepEqual(second.holders, roleExchange.holders)
    assert.deepEqual(secondBlockOf(first, roles, index), second)
    assert.deepEqual(endsExchangeOf(first, roles, spec.ends), second)
    assert.equal(endsExchangeOf({ blockId: 'x', holders }, roles, spec.ends), null, 'the first block must stand each team at its own end')
    // Stated KEPT is the kept blocks, exactly.
    const stated = blocksFound([...ROLE_ITEMS, endItem(spec.kept)])
    assert.deepEqual(stated.assignment, { value: spec.kept, stated: true, lineId: `game::${spec.row}` })
    if (stated.found.kind === 'BLOCKS') assert.deepEqual(stated.found.blocks.map(block => block.blockId), KEPT_IDS)
    else assert.fail('stated KEPT is the kept blocks')
    // A value outside the list, or two values, is refused, never read as kept.
    for (const value of ['SOMETIMES', `{${spec.kept}, ${spec.exchanged}}`]) {
        const odd = blocksFound([...ROLE_ITEMS, endItem(value)])
        assert.equal(odd.found.kind, 'REFUSED', value)
        if (odd.found.kind === 'REFUSED') assert.ok(odd.found.why.some(reason => reason.startsWith(`game::${spec.row}: whether the teams change ends at a coach-called block is`)), odd.found.why.join(' | '))
    }
    assert.equal(blockIdOf(roles, holders), KEPT_IDS[0], 'an id without ends is exactly what it was')
})

// ── 4. EXCHANGED without role blocks ────────────────────────────────────────────────────────────────────
test('EXCHANGED without role blocks is refused at structure: blocks exist only where the roles exchange', () => {
    const alone = blocksFound([endItem(spec.exchanged)])
    assert.equal(alone.found.kind, 'REFUSED')
    const refused = gf2([endItem(spec.exchanged)]).activity as RefusedActivity
    assert.equal(refused.outcome, 'refused')
    assert.equal(refused.stage, 'structure')
    assert.ok(refused.reasons.includes(`game::${spec.row} exchanges the ends at a coach-called block, and the game establishes no role: blocks exist only where the roles exchange, so there is no block for the teams to change ends at`), refused.reasons.join(' | '))
    // Stated KEPT in a game with no role is no role-block game, as before (and is then said by nothing: fidelity's own reading, untouched here).
    assert.equal(blocksFound([endItem(spec.kept)]).found.kind, 'NONE')
    assert.equal(blocksFound([]).found.kind, 'NONE')
})

// ── 5. Realization ──────────────────────────────────────────────────────────────────────────────────────
/** A minimal resolved game (TEST-ONLY), two teams and both ends named, with an end assignment if given. */
const resolvedWith = (endValue: unknown): ResolvedGame =>
    ({
        provenance: { inputDigest: 'digest-1', engineVersion: 'e', registerVersion: 'r', derivationRulesVersion: 'd' },
        coherence: { gateA: 'PASS', failingChecks: [], preRealization: 'PRE_REALIZATION_SATISFIED', realizationAuthorized: true, notAuthorizedBecause: [], postRealizationRequired: [], mayRealize: true, deferred: [] },
        game: {
            envelope: { players: 12 },
            performers: { teams: [{ elementId: 'TEAM-1' }, { elementId: 'TEAM-2' }] },
            objectives: [{ elementId: 'O-1', team: START }, { elementId: 'O-2', team: END }],
            ...(endValue === undefined ? {} : { blocks: { endAssignment: endValue } }),
        },
        derived: [],
        open: [],
        existential: [],
        collectionCardinality: [],
        notEstablished: [],
        extentBounds: {},
        jointConditions: [],
        counts: { derived: 0, open: 0, existential: 0, notEstablished: 0 },
    }) as any
const SUPPLIED = [
    { designation: START, handle: 'TEAM-1', because: 'TEST-ONLY setup' },
    { designation: END, handle: 'TEAM-2', because: 'TEST-ONLY setup' },
]
const holdersX = { [roles[0]]: START, [roles[1]]: END }
const firstX: RoleBlock = { blockId: blockIdOf(roles, holdersX, { [START]: START, [END]: END }), holders: holdersX, ends: { [START]: START, [END]: END } }
const secondX = endsExchangeOf(firstX, roles, spec.ends)!
const realizeWith = (endValue: unknown, block: RoleBlock | null, bindings = SUPPLIED) => realize(resolvedWith(endValue), [], [], index, { lengthM: 40, widthM: 30 }, [], [], bindings, block)
test('realization exchanges the first block\'s binding for the second, citing B10, and records the block with its ends', () => {
    const one = realizeWith(spec.exchanged, firstX) as Realized
    assert.equal(one.outcome, 'REALIZED')
    assert.deepEqual(one.record.designationBindings, SUPPLIED, 'the first block keeps the supplied binding')
    assert.deepEqual(one.record.roleBlock, firstX)
    const two = realizeWith(spec.exchanged, secondX) as Realized
    assert.equal(two.outcome, 'REALIZED', JSON.stringify((two as any).because))
    assert.deepEqual(two.record.designationBindings!.map(binding => [binding.designation, binding.handle]), [[START, 'TEAM-2'], [END, 'TEAM-1']])
    for (const binding of two.record.designationBindings!) {
        assert.ok(binding.because.startsWith(`${spec.path} is ${spec.exchanged} (register row ${spec.row}): at the coach-called block the teams change ends with the roles`), binding.because)
        assert.ok(binding.because.includes('entailed from that binding, never chosen'))
    }
    assert.deepEqual(two.record.roleBlock, secondX, 'the record keeps the block with its ends (RB-5 holds it to the block derived for)')
    // The realization digest is the supplied binding's, as before: the input is what was given.
    assert.equal(one.record.realizationDigest, two.record.realizationDigest)
    // A game that states nothing, with a block without ends, realizes exactly as before.
    const plain = realizeWith(undefined, { blockId: KEPT_IDS[0], holders: holdersX }) as Realized
    assert.deepEqual(plain.record.designationBindings, SUPPLIED)
    assert.deepEqual(plain.record.roleBlock, { blockId: KEPT_IDS[0], holders: holdersX })
})

test('realization refuses an end exchange the block and the game do not agree on, a malformed block, and an exchange with nothing to exchange', () => {
    const because = (result: any) => (result.outcome === 'REFUSED' ? (result.because as string[]) : [])
    assert.ok(because(realizeWith(spec.exchanged, null)).some(reason => reason.includes('it is derived for no role block')))
    assert.ok(because(realizeWith(spec.exchanged, { blockId: KEPT_IDS[0], holders: holdersX })).some(reason => reason.includes('does not say which team stands at each end')))
    assert.ok(because(realizeWith(spec.kept, secondX)).some(reason => reason.includes(`not ${spec.exchanged}`)))
    assert.ok(because(realizeWith(undefined, secondX)).some(reason => reason.includes(`is null, not ${spec.exchanged}`)))
    assert.ok(because(realizeWith(spec.exchanged, { ...secondX, ends: { [START]: END, [END]: END } })).some(reason => reason.includes('does not stand one team at each of')))
    assert.ok(because(realizeWith(spec.exchanged, { ...secondX, ends: { [START]: END } })).some(reason => reason.includes('does not stand one team at each of')))
    assert.ok(because(realizeWith(spec.exchanged, secondX, [])).some(reason => reason.includes('no end-to-team binding was supplied for them to change')))
    // The first block exchanges nothing, so it needs no binding to exchange.
    assert.equal(realizeWith(spec.exchanged, firstX, []).outcome, 'REALIZED')
    // Through the whole chain: the possession game with TEST-ONLY roles, the exchange, and its binding taken away (TEST-ONLY).
    const unbound = gf2([...ROLE_ITEMS, endItem(spec.exchanged)], supplied => void (supplied.designationBindings = [])).activity as RefusedActivity
    assert.equal(unbound.outcome, 'refused')
    assert.ok(unbound.reasons.some(reason => reason.includes('no end-to-team binding was supplied for them to change')), unbound.reasons.join(' | '))
})

// ── 6. Equal counts move nobody; an unrecorded change is refused ──────────────────────────────────────
captured.length = 0
const equal = gf2([...ROLE_ITEMS, endItem(spec.exchanged)])
const equalContracts = captured[captured.length - 1]
const equalBuilt = () => builtOf(equal.fixture, equalContracts)
test('an end exchange with equal counts moves nobody: served, every check passing, each team the same size in both blocks at the other end', () => {
    const activity = served(equal.activity, 'GF2 with TEST-ONLY roles and the end exchange')
    assert.deepEqual(activity.roleBlocks!.checks.map(check => [check.checkId, check.verdict]), ['RB-1', 'RB-2', 'RB-3', 'RB-4', 'RB-5', 'RB-6', 'RB-7', 'RB-8', 'RB-M', 'RB-L'].map(id => [id, 'PASS']))
    const [first, second] = equalBuilt()
    assert.deepEqual(first.block.holders, second.block.holders)
    const teams = (built: Built) => Object.fromEntries((built.fixture.game.performers.teams as any[]).map(team => [team.elementId, team[OUTFIELD]]))
    assert.deepEqual(teams(first), teams(second), 'nobody moves: "exchanging ends should not inherently require transferring participants"')
    assert.deepEqual((first.fixture.game.reassignments ?? []).length, 0)
    const at = (built: Built) => Object.fromEntries((built.fixture.record.designationBindings as any[]).map(binding => [binding.designation, binding.handle]))
    assert.deepEqual(at(second), { [START]: at(first)[END], [END]: at(first)[START] }, 'each team stands at the other end in the second block')
    // The exchange as the coach reads it (DRAFT): the teams change ends and exchange roles; nothing says the ends stay.
    const exchange = activity.rendered.instructions.filter(i => i.section === ROLE_EXCHANGE)
    const sentence = exchange.find(i => i.from.includes(spec.path))!
    assert.equal(sentence.text, 'When you call the next block the teams change ends and exchange roles: each role is played from the same end in every block; there is no set block length')
    // DRAFT wording: the renderer's own words, in no approved entry (his approval of the end-exchange sentence is the design's K17).
    assert.ok(!JSON.stringify(approvedWording()).includes('change ends'))
    assert.ok(ENDS_CHANGE.some(pattern => pattern.test(sentence.text)))
    for (const instruction of activity.rendered.instructions) assert.ok(!ENDS_KEPT.some(pattern => pattern.test(instruction.text)), instruction.text)
    assert.ok(activity.rendered.instructions.some(i => i.text === 'Each team defends one line and attacks the other. Decide which team starts at which end'))
})

test('an unrecorded change of membership under the end exchange is refused (RB-M)', () => {
    const moved = equalBuilt()
    const [a, b] = moved[1].fixture.game.performers.teams
    a[OUTFIELD] += 1
    b[OUTFIELD] -= 1
    assert.deepEqual(failing(moved), ['RB-M'])
    assert.ok(problemsOf(moved, 'RB-M').some(problem => problem.endsWith('and no reassignment is recorded: an exchange of roles moves no player by itself')))
    // And through the whole chain: A01's zone version with a TEST-ONLY exchange and its reassignments taken out (TEST-ONLY) is refused.
    const unrecorded = a01([endItem(spec.exchanged)], ['A01-R1-B4-1', 'A01-R1-B7-1', 'A01-R1-B4-2', 'A01-R1-B7-2']).activity as RefusedActivity
    assert.equal(unrecorded.outcome, 'refused')
    assert.equal(unrecorded.stage, 'validation')
    assert.ok(unrecorded.reasons.some(reason => /^RB-M: the team .* and no reassignment is recorded/.test(reason)), unrecorded.reasons.join(' | '))
})

// ── 7. Goalkeeper + 1 under the end exchange ────────────────────────────────────────────────────────────
test('EXCHANGED with goalkeeper + 1 passes where the old reading refused "the BUILDING role stays with one team"', () => {
    const reassignments = [
        { elementId: 'R-1', toRole: roles[0], performerRow: 'P3', count: 1 },
        { elementId: 'R-2', toRole: roles[0], performerRow: 'P2', count: 1 },
    ]
    const exchangedBinding = [
        { designation: START, handle: 'TEAM-2' },
        { designation: END, handle: 'TEAM-1' },
    ]
    // Before stage D, the end exchange's blocks (holders kept) were read through one binding for both: the S1 refusal (design E2).
    const old = expectedChange(reassignments, firstX, secondX, SUPPLIED, SUPPLIED, index)
    assert.ok(old.problems.some(problem => problem.startsWith(`the ${roles[0]} role stays with one team across the exchange`)), old.problems.join(' | '))
    // With each block's own binding, the goalkeeper and one outfield player go to the team that newly holds the building role.
    const now = expectedChange(reassignments, firstX, secondX, SUPPLIED, exchangedBinding, index)
    assert.deepEqual(now.problems, [])
    assert.deepEqual([...now.change.entries()].map(([handle, rows]) => [handle, Object.fromEntries(rows)]), [
        ['TEAM-2', { P3: 1, P2: 1 }],
        ['TEAM-1', { P3: -1, P2: -1 }],
    ])
    // The kept ends read exactly as before: the role exchange, one binding.
    const kept = expectedChange(reassignments, { blockId: KEPT_IDS[0], holders: holdersX }, exchangeOf({ blockId: KEPT_IDS[0], holders: holdersX }, roles)!, SUPPLIED, SUPPLIED, index)
    assert.deepEqual([kept.problems, [...kept.change.keys()]], [[], ['TEAM-2', 'TEAM-1']])

    // The whole chain: production A01's zone version with a TEST-ONLY end exchange, served at 12/1 (goalkeeper and one outfield player move)
    // and 11/1 (only the goalkeeper), every cross-block check passing, the goalkeeper's team standing at the same end in both blocks.
    const KEEPER_LEAF = index.specializedRoleRows.get('P3')!
    for (const [players, moving] of [
        [12, { [OUTFIELD]: 1, [KEEPER_LEAF]: 1 }],
        [11, { [OUTFIELD]: 0, [KEEPER_LEAF]: 1 }],
    ] as [number, Record<string, number>][]) {
        captured.length = 0
        const built = a01([endItem(spec.exchanged)], [], a01Session(players))
        const activity = served(built.activity, `A01 zone version with a TEST-ONLY exchange at ${players}/1`)
        assert.ok(activity.roleBlocks!.checks.every(check => check.verdict === 'PASS'), JSON.stringify(activity.roleBlocks!.checks.filter(check => check.verdict !== 'PASS')))
        const [first, second] = builtOf(built.fixture, captured[captured.length - 1])
        const byHandle = (entry: Built) => new Map((entry.fixture.game.performers.teams as any[]).map(team => [team.elementId, team]))
        const at = (entry: Built, end: string) => (entry.fixture.record.designationBindings as any[]).find(binding => binding.designation === end).handle
        // The team at the building role's end holds the goalkeeper in each block: a different team each time.
        assert.notEqual(at(first, START), at(second, START))
        assert.equal(byHandle(first).get(at(first, START))[KEEPER_LEAF], 1)
        assert.equal(byHandle(second).get(at(second, START))[KEEPER_LEAF], 1)
        for (const [leaf, n] of Object.entries(moving)) {
            assert.equal(byHandle(second).get(at(second, START))[leaf] - byHandle(first).get(at(second, START))[leaf], n, `${players}: ${leaf}`)
        }
        assert.ok(activity.rendered.instructions.some(i => i.section === ROLE_EXCHANGE && i.from.includes(spec.path) && ENDS_CHANGE.some(pattern => pattern.test(i.text))))
    }
})

// ── 8. The cross-block checks under the exchange ───────────────────────────────────────────────────────
test('under EXCHANGED, RB-2, RB-5 and RB-8 refuse their own violations, the role pairing mirrors nothing, and RB-M reads each block\'s binding', () => {
    assert.deepEqual(failing(equalBuilt()), [])
    const what = Object.fromEntries(checkRoleBlocks(equalBuilt(), index, roles).map(check => [check.checkId, check.what]))
    assert.equal(what['RB-2'], 'each role keeps its end and the teams change ends: objectives, references and direction identical, the role-to-end holders identical, and the end-to-team binding exchanged')

    // RB-2: the second block's binding left as the first's (the ends not exchanged).
    const notExchanged = equalBuilt()
    notExchanged[1].fixture.record.designationBindings = copy(notExchanged[0].fixture.record.designationBindings)
    assert.ok(failing(notExchanged).includes('RB-2'))
    assert.ok(problemsOf(notExchanged, 'RB-2').some(problem => problem.endsWith("the end-to-team binding is not the first block's exchanged")))
    // RB-5 too: the same team now holds the same role in both blocks.
    assert.ok(problemsOf(notExchanged, 'RB-5').some(problem => problem.endsWith('in both blocks: the role does not pass to the other team')))
    // RB-2: a block with no binding.
    const unbound = equalBuilt()
    delete unbound[1].fixture.record.designationBindings
    assert.ok(problemsOf(unbound, 'RB-2').some(problem => problem.includes('a block records no end-to-team binding')))
    // RB-2: the holders differ (the role exchange where the ends are exchanged).
    const roleSwapped = equalBuilt()
    roleSwapped[1].block = { ...roleSwapped[1].block, holders: { [roles[0]]: END, [roles[1]]: START } }
    assert.ok(problemsOf(roleSwapped, 'RB-2').some(problem => problem.includes('the role-to-end holders differ between the blocks')))
    assert.ok(problemsOf(roleSwapped, 'RB-5').some(problem => problem.includes('with the ends exchanged')))

    // RB-8: a role-keyed position at its mirror (A01's zone version, TEST-ONLY exchange): the same place is required, not the mirror.
    captured.length = 0
    const zone = a01([endItem(spec.exchanged)])
    const zoneBuilt = builtOf(zone.fixture, captured[captured.length - 1])
    assert.deepEqual(failing(zoneBuilt), [])
    const mirrored = copy(zoneBuilt)
    const path = 'space.regions[c:restated:GF2:GF2-03.e].position.along'
    const geometry = mirrored[1].fixture.status.geometry.find((g: any) => g.path === path)
    const length = Number(mirrored[1].fixture.envelope.lengthM)
    geometry.geometry.interval = { from: length - geometry.geometry.interval.to, to: length - geometry.geometry.interval.from }
    assert.ok(problemsOf(mirrored, 'RB-8').some(problem => problem.endsWith('which is not the same place')), JSON.stringify(checkRoleBlocks(mirrored, index, roles).filter(c => c.verdict === 'FAIL')))

    // The role pairing: production A01 (a layout set out once, kept ends) pairs each end zone with its mirror; the same blocks recorded as an
    // exchange of ends pair nothing beyond each element itself, and blocks that disagree on it pair nothing.
    const productionBlocks = ((production.fixture as any).roleBlocks.blocks as any[]).map(block => ({ fixture: copy(block.fixture) }))
    const keptMap = counterpartMap(productionBlocks[0], productionBlocks[1], index)
    assert.ok([...keptMap.keys()].some(key => key.startsWith('layout.zones[')), 'kept ends: the end zones mirror')
    const asExchanged = productionBlocks.map((entry, i) => ({ fixture: { ...entry.fixture, record: { ...entry.fixture.record, roleBlock: { ...entry.fixture.record.roleBlock, ends: i === 0 ? { [START]: START, [END]: END } : { [START]: END, [END]: START } } } } }))
    assert.ok(![...counterpartMap(asExchanged[0], asExchanged[1], index).keys()].some(key => key.startsWith('layout.')), 'exchanged ends: no zone or mark is paired with another')
    assert.equal(counterpartMap(asExchanged[0], productionBlocks[1], index).size, 0, 'blocks that disagree on the ends pair nothing')
})

// ── 9. Fidelity Q6 under the exchange ───────────────────────────────────────────────────────────────────
test('Q6 under EXCHANGED: a sentence must say the teams change ends (citing B10), and one saying each team keeps its end is refused; under KEPT the reverse', () => {
    const renders: RenderedBlock[] = equalBuilt().map(entry => ({ blockId: entry.block.blockId, fixture: entry.fixture, rendered: renderConcreteGame(entry.fixture) }))
    const composed = composeRoleBlockActivity(renders, index)
    const q6 = (activity: typeof composed) => checkRoleBlockComposition(renders, activity, index).filter(finding => finding.severity === 'VIOLATION').map(finding => finding.what)
    assert.deepEqual(q6(composed), [])
    const sentence = composed.instructions.find(i => i.section === ROLE_EXCHANGE && i.from.includes(spec.path))!
    // Without the end assignment cited, the change of ends is not said by the knowledge it rests on (and the sentence is then no block's).
    const uncited = { ...composed, instructions: composed.instructions.map(i => (i === sentence ? { ...i, from: i.from.filter(path => path !== spec.path) } : i)) }
    assert.ok(q6(uncited).some(what => what.startsWith('no sentence says that the teams change ends with the roles when the coach calls the next block')))
    // Words that do not say the ends change, with every citation kept.
    const unsaid = { ...composed, instructions: composed.instructions.map(i => (i === sentence ? { ...i, text: 'When you call the next block the teams exchange roles; there is no set block length' } : i)) }
    assert.ok(q6(unsaid).some(what => what.startsWith('no sentence says that the teams change ends with the roles')))
    // A sentence saying each team keeps its end is refused here.
    for (const text of ['Each team keeps its end for the whole activity', 'The teams exchange roles, not ends', 'Decide which team starts at which end; the ends stay the same for the whole game']) {
        const kept = { ...composed, instructions: [...composed.instructions, { ...sentence, text, from: [...sentence.from] }] }
        assert.ok(q6(kept).some(what => what === `"${text}" says each team keeps its end; the teams change ends with the roles in this activity (${spec.path} is ${spec.exchanged}, RB-2)`), text)
    }
    // Under KEPT (production A01) the ends-change words are refused, and the kept-ends words are what is required.
    const productionBlocks = ((production.fixture as any).roleBlocks.blocks as any[]).map(block => ({ blockId: block.blockId, fixture: block.fixture, rendered: renderConcreteGame(block.fixture) }))
    const keptComposed = composeRoleBlockActivity(productionBlocks, index)
    const keptQ6 = (activity: typeof keptComposed) => checkRoleBlockComposition(productionBlocks, activity, index).filter(finding => finding.severity === 'VIOLATION').map(finding => finding.what)
    assert.deepEqual(keptQ6(keptComposed), [])
    const changed = { ...keptComposed, instructions: [...keptComposed.instructions, { ...keptComposed.instructions[0], text: 'The teams change ends at the next block' }] }
    assert.ok(keptQ6(changed).some(what => what === '"The teams change ends at the next block" says the ends change; each team keeps its end in both blocks (RB-2)'))
})

/**
 * The integration review fix, 23 October 2026 (a TIGHTENING under the end exchange only): a sentence denying the change of ends matched
 * ENDS_CHANGE, so it satisfied the requirement that the exchange say the teams change ends, and "stays at its end" passed as not keeping it.
 * Now a denial never counts as saying the change and is refused like ENDS_KEPT; "stays at its end" joins ENDS_KEPT. The renderer's own
 * sentence matches none of them, and under KEPT nothing moves.
 */
test('Q6 under EXCHANGED: a denied change of ends never says the change, and is refused; "stays at its end" is refused too', () => {
    const renders: RenderedBlock[] = equalBuilt().map(entry => ({ blockId: entry.block.blockId, fixture: entry.fixture, rendered: renderConcreteGame(entry.fixture) }))
    const composed = composeRoleBlockActivity(renders, index)
    const q6 = (activity: typeof composed) => checkRoleBlockComposition(renders, activity, index).filter(finding => finding.severity === 'VIOLATION').map(finding => finding.what)
    const sentence = composed.instructions.find(i => i.section === ROLE_EXCHANGE && i.from.includes(spec.path))!
    for (const pattern of [...ENDS_KEPT, ...ENDS_CHANGE_DENIED]) assert.ok(!pattern.test(sentence.text), `the renderer's sentence matches ${pattern}`)
    for (const text of [
        'When you call the next block the teams do not change ends and exchange roles; there is no set block length',
        "When you call the next block the teams don't change ends; there is no set block length",
        'When you call the next block the teams exchange roles without changing ends; there is no set block length',
        'There is no change of ends: when you call the next block the teams exchange roles',
    ]) {
        // In place of the renderer's sentence, every citation kept: the change is not said, and the denial is refused.
        const denied = { ...composed, instructions: composed.instructions.map(i => (i === sentence ? { ...i, text } : i)) }
        const found = q6(denied)
        assert.ok(found.some(what => what.startsWith('no sentence says that the teams change ends with the roles')), `${text}: ${found.join(' | ')}`)
        assert.ok(found.some(what => what === `"${text}" says each team keeps its end; the teams change ends with the roles in this activity (${spec.path} is ${spec.exchanged}, RB-2)`), `${text}: ${found.join(' | ')}`)
    }
    const stays = { ...composed, instructions: [...composed.instructions, { ...sentence, text: 'Each team stays at its end', from: [...sentence.from] }] }
    assert.ok(q6(stays).some(what => what.startsWith('"Each team stays at its end" says each team keeps its end')))
    // The finding cites his item without quoting activity-specific nouns (engine text stays sport-neutral).
    const uncited = { ...composed, instructions: composed.instructions.map(i => (i === sentence ? { ...i, from: i.from.filter(path => path !== spec.path) } : i)) }
    assert.ok(q6(uncited).some(what => what.endsWith(`(${spec.path} is ${spec.exchanged}; his reply filed 25 October 2026, item 5)`)))
})

/**
 * The integration review fix, 23 October 2026: `RoleBlock.ends` reaches the composed fixture, the served account and the review evidence
 * (its consumers: the review page's role blocks and structural report, front/src/app/ActivityReviewPage.tsx), so a reader sees the end and
 * the role kept apart. Under KEPT nothing is added: production A01's account carries no `ends` key.
 */
test('the end-to-team assignment reaches the composed fixture, the served account and the review evidence under EXCHANGED, and nothing is added under KEPT', () => {
    const activity = served(equal.activity, 'GF2 with TEST-ONLY roles and the end exchange')
    const recorded = equalBuilt().map(entry => entry.fixture.record.roleBlock.ends)
    assert.deepEqual(recorded, [{ [START]: START, [END]: END }, { [START]: END, [END]: START }])
    assert.deepEqual(activity.roleBlocks!.blocks.map(block => block.ends), recorded, 'the served account')
    assert.deepEqual(((equal.fixture as any).roleBlocks.blocks as any[]).map(block => block.ends), recorded, 'the composed fixture')
    // The holders alone are identical in both blocks; the ends are what tell them apart.
    assert.deepEqual(activity.roleBlocks!.blocks[0].holders, activity.roleBlocks!.blocks[1].holders)
    // The review evidence: A01's zone version with a TEST-ONLY exchange, built for review (an administrator's request).
    const reviewed = buildActivityUnderAuthorizationRecords({ kind: 'learning-goal', goalId: 'A01', session: a01Session() } as any, learningGoalAuthorizations(), {
        alter: contracts => void contracts.find(c => c.contractId === P)!.items.push(endItem(spec.exchanged)),
        review: { includeDrafts: true },
    }).activity as ServedActivity
    const evidence = served(reviewed, 'A01 zone version with a TEST-ONLY exchange, for review').evidence!
    assert.deepEqual(evidence.structure.blocks.map(block => block.ends), [{ [START]: START, [END]: END }, { [START]: END, [END]: START }])
    assert.deepEqual(
        evidence.sections.roleExchange.filter(fact => fact.what.endsWith(': ends (each end, and the end whose first-block team stands there)')).map(fact => fact.value),
        [{ [START]: START, [END]: END }, { [START]: END, [END]: START }],
    )
    // Under KEPT: no key anywhere.
    const kept = served(production.activity, 'production A01')
    assert.ok(kept.roleBlocks!.blocks.every(block => !('ends' in block)))
    assert.ok(((production.fixture as any).roleBlocks.blocks as any[]).every(block => !('ends' in block)))
})

console.log(`\n${passed} passed`)
