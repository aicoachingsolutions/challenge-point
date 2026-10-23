/**
 * Role blocks in the register and the derivation — stage K3, 15 October 2026, his M1 in the reply filed 17 October 2026:
 * *"M1 — Role exchange by block: Approved. Keep role assignments separate from fixed ends. Allow target configurations to
 * reflect each team's role during the block. The coach controls the exchange. No new block-duration system is needed."*
 *
 * What is pinned here:
 *   1. the register (version 10) carries the capability as data — rows B1-B3, two versioned vocabularies, the block-scoped
 *      designation ROLE_HOLDER_<role> (our extension of AM-01, never GLOSS), the derived region attribute targetOf — and
 *      the index refuses a damaged copy (halt H1); the exchange vocabulary holds one member, so no duration can be stated;
 *   2. the one resolver answers a role holder only through a block: its setup assignment in that block, then the team
 *      realization recorded for it; a possession change moves nothing;
 *   3. targetOf: in the block where the building role is held by the axis-start team, a selector naming the building
 *      holder's target reaches GF2-03.f and not GF2-03.e; in the other block, GF2-03.e; with no block, neither (undetermined,
 *      never rounded); it creates no third region, and a game that never asks carries nothing new;
 *   4. roleBlocksOf: the two bijections for A01 (whose record names A01-R1), NONE for every other goal and every
 *      demonstration, and a refusal — never a completion — for part of a role exchange;
 *   5. no goal, role, designation or vocabulary literal in the two new modules.
 *
 * Run: npx ts-node --files -r tsconfig-paths/register ./src/system/derivation/role-blocks.unit.ts
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { buildActivityFromKnowledge } from '../rendering/build-activity'
import { mechanismDemonstration, MECHANISM_DEMONSTRATIONS } from '../rendering/mechanism-demonstrations'
import { specializedRoleNames } from '../rendering/session-envelope'
import { sessionPlanningModel } from '../session-planning/session-planning-model'
import { loadProvisionalRealizations, loadRegister } from './corpus'
import { designationEntry, designationKey, holderInBlock, memberDesignations, roleHolderNames, roleOfHolder } from './designation'
import { isStampedHalt } from './emit'
import { runDerivation, runStages0to10, runStages0to2, runStages0to5 } from './engine'
import { assembleResolvedGame } from './resolved-game'
import { reaches } from './reach'
import { designationName, HaltError, indexRegister } from './register'
import { blockIdOf, exchangeOf, roleBlocksOf } from './role-blocks'
import { derivationInputFor, selectFor } from './run-bounded-selection'
import { parseSelector } from './selector'
import { DerivationInput, LoadedContract, RoleBlock } from './types'

let passed = 0
function test(name: string, body: () => void): void {
    body()
    passed++
    console.log(`  ok  ${name}`)
}

console.log('role blocks in the register and the derivation (his M1)')

const register = loadRegister()
const index = indexRegister(register)
const roles = index.roleBlocks!.roles
const [START, END] = [...index.designations.resolutions.entries()].filter(([, r]) => r.kind === 'SETUP_ASSIGNMENT').map(([name]) => name)
const holders = roleHolderNames(index)
const blockX: RoleBlock = { blockId: blockIdOf(roles, { [roles[0]]: START, [roles[1]]: END }), holders: { [roles[0]]: START, [roles[1]]: END } }
const blockY = exchangeOf(blockX, roles)!
const session = { players: 12, lengthM: 40, widthM: 30, durationMin: 20, roles: Object.fromEntries(specializedRoleNames().map(name => [name, 0])) }

/** A TEST-ONLY contribution: never production data. */
const testContract = (items: any[]): LoadedContract => ({
    contractId: 'TEST-ONLY:roles',
    objectId: 'TEST-ONLY:roles',
    knowledgeVersion: 'stage-b',
    items: items.map(item => ({ valueStatus: 'N/A', strictness: 'REQUIRED', scope: 'WHOLE_GAME', basis: 'OWNER_RULING', checkability: 'STRUCTURAL', structuralClause: 'whole item', basisEvidence: 'TEST-ONLY', ...item })),
    declarations: [],
    relationshipRules: [],
})
const ROLE_ITEMS = [
    { itemId: 'T-1', row: 'B1', selector: `activityRole=${roles[0]}`, requirement: 'EXISTS', value: 'N/A' },
    { itemId: 'T-2', row: 'B1', selector: `activityRole=${roles[1]}`, requirement: 'EXISTS', value: 'N/A' },
    { itemId: 'T-3', row: 'B3', selector: '*', requirement: 'EQUALS', value: index.roleBlocks!.exchanges[0], valueStatus: 'REQUIRED_RANGE' },
]
const gf2 = (extra: any[] = [], roleBlock?: RoleBlock): DerivationInput => {
    const input = derivationInputFor({ selected: [{ id: 'GF2', role: 'game form' }] })
    return { ...input, contracts: [...JSON.parse(JSON.stringify(input.contracts)), ...(extra.length ? [testContract(extra)] : [])], ...(roleBlock ? { roleBlock } : {}) }
}

test('the register carries the role-block capability as data (version 10), each new vocabulary versioned, the exchange list one member', () => {
    for (const id of ['B1', 'B2', 'B3']) assert.ok(index.rows.has(id), id)
    assert.equal(index.rows.get('B1')!.kind, 'COLLECTION')
    assert.deepEqual(index.rows.get('B1')!.selectorAttributes, ['activityRole'], 'named activityRole, not role: objectives already select on role (J4)')
    assert.equal(index.rows.get('B2')!.selectorAttribute, 'activityRole', 'the role is carried from its establishing selector (SD-92)')
    assert.equal(index.rows.get('B3')!.ownerRow, 'B1', 'owned by the roles, so a game without roles enumerates no line for it')
    for (const id of ['B1', 'B2', 'B3']) assert.equal(index.fillable.has(id), false, `${id}: nothing here is a realization choice`)
    assert.deepEqual(roles, ['BUILDING', 'PRESSING'])
    assert.deepEqual(index.roleBlocks!.exchanges, ['COACH_CALLS'], 'his M1: "No new block-duration system is needed." — no duration, count, timer or trigger can be stated')
    for (const name of ['B1.activityRole', 'B3.exchange']) assert.match(String(index.vocabularyVersions[name]), /^1 \(2026-10-15, register version 10/, `${name} carries a versions entry`)
    // Re-pointed 15 October 2026 (stage K4): version 11 (participant reassignment, his RD-1 answer) supersedes 10 and keeps
    // the whole chain, so version 10's entry for role blocks is still there, word for word.
    // Re-pointed again 15 October 2026 (stage K5): version 12 (starts and restarts, his M3/M4) supersedes 11, and the chain
    // still holds version 10's entry word for word. And again (stage K6): version 13 (relative positions and start placements,
    // his M7/M5) supersedes 12, the chain kept whole. And again 17 October 2026 (stage M1): version 14 (a role's credit confined to
    // an episode, alsoCounts, the relative count; his reply filed 19 October 2026) supersedes 13, the chain kept whole.
    // Re-pointed 22 October 2026: version 15 (which participant a value names, his reply filed 25 October 2026, item 6) supersedes 14.
    // Re-pointed 22 October 2026 (stage A): version 16 (one primary scoring event per role, his reply filed 25 October 2026, item 2) supersedes 15.
    // Re-pointed 23 October 2026 (stage B): version 17 (object targets and the geometry a goal needs, his reply filed 25 October 2026, item 3) supersedes 16.
    // Re-pointed 23 October 2026 (stage D): version 18 (the coach-controlled end exchange, his reply filed 25 October 2026, item 5) supersedes 17.
    assert.match(String(register.version), /^18, adds the coach-controlled end exchange, .*Supersedes version 17, which adds object targets and the geometry a goal needs, .*Supersedes version 16, which adds one primary scoring event per role, .*Supersedes version 15, which adds which participant a value names, .*Supersedes version 14, which adds a role's scoring credit.*Supersedes version 13, which adds positions stated relative .*Supersedes version 12, which adds starts and restarts .*Supersedes version 11, which adds participant reassignment .*Supersedes version 10, which adds role blocks for his M1/)
    assert.ok(String(register.version).includes('Keep role assignments separate from fixed ends.'), 'the version entry quotes M1')
    assert.ok(String(register.version).includes('Supersedes version 9'), 'and keeps the history')
    assert.ok(index.rows.get('S2')!.selectorAttributes!.includes('targetOf'))
    assert.ok(index.designations.attributes.some(entry => entry.row === 'S2' && entry.attribute === 'targetOf'), 'targetOf is designation-valued')
    assert.equal(index.roleBlocks!.coachNouns.BUILDING, 'building team')
    assert.equal(register.roleBlocks.coachNouns.status, 'DRAFT', 'the nouns are DRAFT coach wording, not approved')
})

test('ROLE_HOLDER_<role> is block-scoped and marked as our interpretation — its gloss is ours, never his', () => {
    const entry = (register.teamDesignations.list as string[]).find(e => designationName(e) === 'ROLE_HOLDER_<role>')!
    assert.ok(entry && entry.includes('OUR extension of AM-01'))
    assert.deepEqual(register.teamDesignations.resolutions['ROLE_HOLDER_<role>'], {
        kind: 'BLOCK_ROLE',
        scope: 'BLOCK',
        at: null,
        basis: 'OUR_INTERPRETATION',
        from: register.teamDesignations.resolutions['ROLE_HOLDER_<role>'].from,
    })
    assert.ok(index.designations.standingScopes.includes('BLOCK'), 'a standing team property may be reached through a block role')
    assert.deepEqual(holders, ['ROLE_HOLDER_BUILDING', 'ROLE_HOLDER_PRESSING'])
})

test('the index refuses a damaged role-block or targetOf block (halt H1)', () => {
    const damaged = (mutate: (r: any) => void): string => {
        const copy = JSON.parse(JSON.stringify(register))
        mutate(copy)
        try {
            indexRegister(copy)
            return 'admitted'
        } catch (error) {
            return error instanceof HaltError ? error.halt : 'threw'
        }
    }
    assert.equal(damaged(() => undefined), 'admitted')
    assert.equal(damaged(r => void (r.roleBlocks.rolesRow = 'S3')), 'H1', 'the roles row must be a collection')
    assert.equal(damaged(r => void (r.roleBlocks.exchangeRow = 'T6')), 'H1', 'the exchange row must be owned by the roles row')
    assert.equal(damaged(r => void (r.vocabularies['B1.activityRole'] = ['BUILDING'])), 'H1', 'two roles, one per team')
    assert.equal(damaged(r => void delete r.roleBlocks.coachNouns.nouns.PRESSING), 'H1', 'every role has a noun')
    assert.equal(damaged(r => void (r.roleBlocks.holderDesignation = 'TEAM_<id>')), 'H1', 'the holder must be the BLOCK_ROLE entry')
    assert.equal(damaged(r => void (r.targetOf.role = 'NOT_A_ROLE')), 'H1', 'the role must be a member of its vocabulary')
    assert.equal(damaged(r => void (r.targetOf.referenceRow = 'S5')), 'H1', 'the reference row must be owned by the objectives row')
    // A register written before version 10 has no role blocks: every game derives as before.
    const before = JSON.parse(JSON.stringify(register))
    delete before.roleBlocks
    delete before.targetOf
    // 15 October 2026 (stage K4): nor version 11's reassignment block, which needs role blocks (a register keeping it without
    // them halts H1, allocation.unit.ts) — so the "before version 10" copy drops it too.
    delete before.reassignment
    // 22 October 2026 (stage A): nor version 16's role-scoring block, which needs role blocks too (a register keeping it without them
    // halts H1, role-events.unit.ts) — so the copy drops it as well.
    delete before.roleScoring
    // 23 October 2026 (stage D): nor version 18's end-assignment block, which needs role blocks too (a register keeping it without them
    // halts H1, end-exchange.unit.ts) — so the copy drops it as well.
    delete before.endAssignment
    assert.equal(indexRegister(before).roleBlocks, null)
    assert.equal(indexRegister(before).targetOf, null)
})

test('the resolver answers a role holder ONLY through a block: its setup assignment there, then the team recorded for it', () => {
    assert.equal(designationEntry(index, 'ROLE_HOLDER_BUILDING'), 'ROLE_HOLDER_<role>')
    assert.equal(designationEntry(index, 'ROLE_HOLDER_GOALIE'), null, 'a role nobody registered names nothing')
    assert.equal(roleOfHolder(index, 'ROLE_HOLDER_PRESSING'), 'PRESSING')
    assert.notEqual(designationKey(index, 'ROLE_HOLDER_BUILDING'), designationKey(index, 'ROLE_HOLDER_PRESSING'), 'two roles are two designations (RC-22)')
    assert.equal(holderInBlock(index, 'ROLE_HOLDER_BUILDING', blockX), START)
    assert.equal(holderInBlock(index, 'ROLE_HOLDER_BUILDING', blockY), END)
    assert.equal(holderInBlock(index, 'ROLE_HOLDER_BUILDING', null), null, 'no block, no answer — never a guess')

    const bindings = [
        { designation: START, handle: 'h1', because: 'TEST-ONLY' },
        { designation: END, handle: 'h2', because: 'TEST-ONLY' },
    ]
    const teams = index.designations.teamsRow!
    const x = memberDesignations(index, teams, 'h1', bindings, blockX)
    assert.ok(x.met.includes('ROLE_HOLDER_BUILDING') && x.notMet.includes('ROLE_HOLDER_PRESSING'))
    const y = memberDesignations(index, teams, 'h1', bindings, blockY)
    assert.ok(y.met.includes('ROLE_HOLDER_PRESSING') && y.notMet.includes('ROLE_HOLDER_BUILDING'), 'the same team holds the other role in the other block')
    const none = memberDesignations(index, teams, 'h1', bindings, null)
    assert.ok(holders.every(holder => none.undetermined.some(u => u.designation === holder)), 'without a block every holder is undetermined')
    const unbound = memberDesignations(index, teams, 'h1', [], blockX)
    assert.ok(unbound.undetermined.some(u => u.designation === 'ROLE_HOLDER_BUILDING' && u.why.includes('has not recorded')), 'and without the end binding too')
})

test('a possession change moves no holder: the role answer is the same whichever team realization gives the ball first', () => {
    // GF2 with TEST-ONLY roles, realized twice in block X with the initial holder swapped on a copy of the choices.
    const holderAt = (handle: string) => {
        const { fixture } = buildActivityFromKnowledge(['GF2'], session, {
            alter: contracts => void contracts.push(testContract(ROLE_ITEMS)),
            alterSupplied: supplied => {
                for (const choice of supplied.choices) if (String(choice.lineId).endsWith('::PS1') || choice.lineId === 'game::PS1') (choice as any).value = handle
            },
        })
        const blocks = (fixture as any).roleBlocks.blocks as { blockId: string; fixture: any }[]
        return blocks.map(block => ({ id: block.blockId, roleBlock: block.fixture.record.roleBlock, bindings: block.fixture.record.designationBindings, possession: block.fixture.game.possession }))
    }
    const one = holderAt('c:restated:GF2:GF2-14.a#1')
    const two = holderAt('c:restated:GF2:GF2-14.a#2')
    assert.notDeepEqual(one.map(b => b.possession), two.map(b => b.possession), 'the initial holder did change on the copy')
    assert.deepEqual(one.map(b => [b.id, b.roleBlock, b.bindings]), two.map(b => [b.id, b.roleBlock, b.bindings]), 'and no role binding moved with it')
})

test('targetOf reaches the region its objective references: GF2-03.f for the building holder in block X, GF2-03.e in block Y, nothing without a block', () => {
    const probe = { itemId: 'T-9', row: 'S3', selector: 'targetOf=ROLE_HOLDER_BUILDING', requirement: 'EQUALS', value: 'zone' }
    const regionsIn = (roleBlock?: RoleBlock) => runStages0to2(gf2([probe], roleBlock)).classes.filter(c => c.row === 'S2')
    const selector = (text: string) => parseSelector(text, 'S3', index).predicate!
    const reach = (roleBlock: RoleBlock | undefined, text: string) =>
        Object.fromEntries(regionsIn(roleBlock).map(cls => [cls.classId.split(':').pop(), reaches(selector(text), cls)]))
    assert.deepEqual(reach(blockX, 'targetOf=ROLE_HOLDER_BUILDING'), { 'GF2-03.e': 'FALSE', 'GF2-03.f': 'TRUE' })
    assert.deepEqual(reach(blockY, 'targetOf=ROLE_HOLDER_BUILDING'), { 'GF2-03.e': 'TRUE', 'GF2-03.f': 'FALSE' })
    assert.deepEqual(reach(blockX, 'targetOf=ROLE_HOLDER_PRESSING'), { 'GF2-03.e': 'TRUE', 'GF2-03.f': 'FALSE' })
    assert.deepEqual(reach(undefined, 'targetOf=ROLE_HOLDER_BUILDING'), { 'GF2-03.e': 'UNDETERMINED', 'GF2-03.f': 'UNDETERMINED' }, 'no block: undetermined, never rounded')
    // A setup assignment is answered in every block alike: C42 fixes which target each end's team attacks.
    for (const roleBlock of [blockX, blockY, undefined]) assert.deepEqual(reach(roleBlock, `targetOf=${START}`), { 'GF2-03.e': 'FALSE', 'GF2-03.f': 'TRUE' })
    // No third region: the probe sits on a field row, and the regions are exactly GF2's two.
    assert.deepEqual(regionsIn(blockX).map(cls => cls.classId), runStages0to2(gf2()).classes.filter(c => c.row === 'S2').map(c => c.classId))
})

/**
 * **No third region, in any game** (K3 review, 15 October 2026). The probe above sits on a field row. On the REGION row an
 * establishing item with a targetOf selector created a third region class (measured: `c:TEST-ONLY:roles:T-9` beside
 * GF2-03.e/f), stopped in a role-block game only by RB-3 at validation and in a single game by nothing naming it. It is a
 * selector defect now, reported at stage 2 and failed by GA-REFERENCE-INTEGRITY, with or without a block; C42: "exactly two
 * active objectives and two corresponding target regions, not three".
 */
test('an item establishing a region by targetOf is a reference defect that fails Gate A, block or none; a field item is not', () => {
    const creating = { itemId: 'T-9', row: 'S2', selector: 'targetOf=ROLE_HOLDER_BUILDING', requirement: 'EXISTS', value: 'N/A' }
    const defects = (result: any) => (result.failures ?? []).filter((f: any) => f.kind === 'REFERENCE_DEFECT' && f.locus?.itemRef?.itemId === 'T-9')
    for (const [extra, roleBlock] of [[[creating], undefined], [[...ROLE_ITEMS, creating], blockX], [[{ ...creating, selector: `targetOf=${START}` }], undefined]] as const) {
        const result: any = runStages0to10(gf2([...extra], roleBlock))
        assert.equal(defects(result).length, 1, `${roleBlock?.blockId ?? 'no block'}: ${JSON.stringify(result.failures)}`)
        const integrity = result.gates.gateA.checks.find((c: any) => c.checkId === 'GA-REFERENCE-INTEGRITY')
        assert.equal(integrity.verdict, 'FAIL', `${roleBlock?.blockId ?? 'no block'}: GA-REFERENCE-INTEGRITY`)
    }
    const selecting = { itemId: 'T-9', row: 'S3', selector: 'targetOf=ROLE_HOLDER_BUILDING', requirement: 'EQUALS', value: 'zone', valueStatus: 'REQUIRED_RANGE' }
    assert.equal(defects(runStages0to10(gf2([selecting], blockX))).length, 0, 'selecting a region by targetOf is what the attribute is for')
    assert.equal(defects(runStages0to10(gf2())).length, 0)
})

test('a game that never asks for targetOf carries nothing new on its classes', () => {
    for (const cls of runStages0to2(gf2()).classes) assert.equal(cls.designations, undefined, cls.classId)
    for (const cls of runStages0to2(gf2([], blockX)).classes) assert.equal(cls.designations, undefined, `${cls.classId}, even inside a block`)
})

test('roleBlocksOf: the two entailed blocks for A01, NONE for every other goal and every demonstration', () => {
    const found = (input: DerivationInput) => {
        const staged: any = runStages0to5(input)
        return roleBlocksOf(staged.classes, staged.derived.lines, index)
    }
    const a01 = found(derivationInputFor(selectFor('A01', null)))
    assert.equal(a01.kind, 'BLOCKS')
    if (a01.kind !== 'BLOCKS') return
    assert.deepEqual(a01.blocks, [blockX, blockY], 'the two bijections, in the register list order; which is played first is the coach')
    assert.equal(a01.exchange, 'COACH_CALLS')
    assert.deepEqual(a01.from.map(ref => ref.itemId), ['A01-R1-B1-1', 'A01-R1-B1-2'], 'from his provisional realization, not from canonical knowledge')
    const goals = sessionPlanningModel.phases().flatMap(phase => (sessionPlanningModel.learningGoalsForPhase(phase) as any[]).map(goal => String(goal.ID)))
    assert.equal(goals.length, 13)
    for (const goalId of goals.filter(id => id !== 'A01')) {
        let selection
        try {
            selection = selectFor(goalId, null)
        } catch {
            continue // a goal refused at selection reaches no derivation at all
        }
        assert.equal(found(derivationInputFor(selection)).kind, 'NONE', goalId)
    }
    for (const demonstration of MECHANISM_DEMONSTRATIONS) {
        const selected = mechanismDemonstration(demonstration.id)!.selected.map((id, i) => ({ id, role: i === 0 ? 'game form' : 'constraint' }))
        assert.equal(found(derivationInputFor({ selected })).kind, 'NONE', demonstration.id)
    }
})

test('part of a role exchange is refused with each reason, never completed', () => {
    const found = (items: any[], selected = ['GF2']) => {
        const input = derivationInputFor({ selected: selected.map((id, i) => ({ id, role: i === 0 ? 'game form' : 'constraint' })) })
        const staged: any = runStages0to5({ ...input, contracts: [...input.contracts, testContract(items)] })
        return roleBlocksOf(staged.classes, staged.derived.lines, index)
    }
    const why = (result: ReturnType<typeof found>) => (result.kind === 'REFUSED' ? result.why.join(' | ') : result.kind)
    assert.match(why(found(ROLE_ITEMS.filter(item => item.itemId !== 'T-2'))), /no contribution establishes the role PRESSING/)
    assert.match(why(found(ROLE_ITEMS.filter(item => item.itemId !== 'T-3'))), /how the role passes to the other team is not established/)
    assert.match(why(found([...ROLE_ITEMS, { itemId: 'T-4', row: 'B1', selector: 'activityRole=SWEEPING', requirement: 'EXISTS', value: 'N/A' }])), /the role SWEEPING, which the role vocabulary/)
    assert.match(why(found(ROLE_ITEMS.map(item => (item.itemId === 'T-3' ? { ...item, value: 'TIMER' } : item)))), /must be one of COACH_CALLS/)
    // Roles with no end-assigned teams to hold them: the context alone assigns no end.
    assert.match(why(found(ROLE_ITEMS, ['RPC-001'])), /assigns no team to an end/)
    assert.equal(found([]).kind, 'NONE', 'no role at all is not a role-block game')
})

test('A01-R1 carries the two roles and the exchange, each his choice in his words', () => {
    const realization = loadProvisionalRealizations().find(r => r.provisionalId === 'A01-R1')!
    // Re-pointed 15 October 2026 (stage K4): the realization holds more since (the counts by role, the keeper and the two
    // reassignments, pinned in allocation.unit.ts); this test is about its role-block items, so it reads those.
    const items = realization.items.filter((item: any) => ['B1', 'B3'].includes(String(item.row))).map((item: any) => [item.itemId, item.row, item.selector, item.value, item.category, item.basis])
    assert.deepEqual(items, [
        ['A01-R1-B1-1', 'B1', 'activityRole=BUILDING', 'N/A', 'PROVISIONAL_REALIZATION_CHOICE', 'OWNER_RULING'],
        ['A01-R1-B1-2', 'B1', 'activityRole=PRESSING', 'N/A', 'PROVISIONAL_REALIZATION_CHOICE', 'OWNER_RULING'],
        ['A01-R1-B3-1', 'B3', '*', 'COACH_CALLS', 'PROVISIONAL_REALIZATION_CHOICE', 'OWNER_RULING'],
    ])
    // His sentences, exactly as filed (reply of 17 October 2026, D2 and D7).
    assert.equal((realization.items[2] as any).words, 'Roles exchange when the coach calls for the next block.')
    assert.equal((realization.items[1] as any).words, 'One team builds out while the other presses.')
})

/**
 * **Key identity of the provisional category on the role lines** (K3 review, 15 October 2026). provisional-realization.unit.ts
 * re-pointed its category test to a copy holding the TEST-ONLY item alone, saying A01-R1's own role lines are "pinned in
 * role-blocks.unit.ts" — and nothing here pinned them. His 16 October item 10, "Please keep those categories distinct.":
 * every resolved role line A01-R1 supports carries PROVISIONAL_REALIZATION_CHOICE on its support entry, in each block and
 * with no block, so a reader of the game can tell his first-activity choice from canonical knowledge.
 */
test('A01-R1\'s role lines carry its category on every support entry, in both blocks (key identity, the real chain)', () => {
    const input = derivationInputFor(selectFor('A01', null))
    for (const roleBlock of [undefined, blockX, blockY]) {
        const run = { ...input, ...(roleBlock ? { roleBlock } : {}) }
        const result: any = runDerivation(run)
        assert.ok(!isStampedHalt(result), roleBlock?.blockId ?? 'no block')
        const resolved = assembleResolvedGame(result, (runStages0to10(run) as any).classes, index, input.contracts)
        const own = resolved.derived.filter(entry => String(entry.lineId).startsWith('c:provisional:A01-R1:'))
        // 15 October 2026 (stage K5): the realization's transitions are lines it supports too (pinned in
        // starts-and-restarts.unit.ts); they carry the same category, held to it below with the rest, and the role and
        // reassignment lines are listed apart.
        const transitions = own.filter(entry => String(entry.path).startsWith('transitions['))
        assert.ok(transitions.length > 0, 'the transitions are lines it supports')
        assert.deepEqual(own.filter(entry => !String(entry.path).startsWith('transitions[')).map(entry => entry.path).sort(), [
            'activityRoles[c:provisional:A01-R1:A01-R1-B1-1].activityRole',
            // 17 October 2026 (stage M1): the roles' credit bounds (row B8, his reply filed 19 October 2026, item 1 and item 3 C),
            // lines A01-R1 supports with the same category.
            'activityRoles[c:provisional:A01-R1:A01-R1-B1-1].creditedWithin',
            'activityRoles[c:provisional:A01-R1:A01-R1-B1-1].exchange',
            'activityRoles[c:provisional:A01-R1:A01-R1-B1-2].activityRole',
            'activityRoles[c:provisional:A01-R1:A01-R1-B1-2].creditedWithin',
            'activityRoles[c:provisional:A01-R1:A01-R1-B1-2].exchange',
            // 15 October 2026 (stage K6): the two starting placements (his D4 and his 18 October item 3) and the pressure
            // reference's noun, position and width are lines A01-R1 supports too, with the same category.
            'performers.startPlacement[c:provisional:A01-R1:A01-R1-P8-1].group',
            'performers.startPlacement[c:provisional:A01-R1:A01-R1-P8-1].region',
            'performers.startPlacement[c:provisional:A01-R1:A01-R1-P8-1].resetsAt',
            'performers.startPlacement[c:provisional:A01-R1:A01-R1-P8-1].timing',
            'performers.startPlacement[c:provisional:A01-R1:A01-R1-P8-2].group',
            'performers.startPlacement[c:provisional:A01-R1:A01-R1-P8-2].region',
            'performers.startPlacement[c:provisional:A01-R1:A01-R1-P8-2].resetsAt',
            'performers.startPlacement[c:provisional:A01-R1:A01-R1-P8-2].timing',
            // (reassignments sort before space)
            // 15 October 2026 (stage K4): the two reassignments of his RD-1 answer are lines A01-R1 supports too, and they
            // carry the same category — held to it here with the role lines.
            'reassignments[c:provisional:A01-R1:A01-R1-B4-1].count',
            'reassignments[c:provisional:A01-R1:A01-R1-B4-1].performerRow',
            'reassignments[c:provisional:A01-R1:A01-R1-B4-1].toRole',
            'reassignments[c:provisional:A01-R1:A01-R1-B4-2].count',
            'reassignments[c:provisional:A01-R1:A01-R1-B4-2].performerRow',
            'reassignments[c:provisional:A01-R1:A01-R1-B4-2].toRole',
            'space.regions[c:provisional:A01-R1:A01-R1-S2-1].noun',
            'space.regions[c:provisional:A01-R1:A01-R1-S2-1].position.across',
            'space.regions[c:provisional:A01-R1:A01-R1-S2-1].position.along',
            // 17 October 2026 (stage M2): the occurrence that also counts as the primary event for the pressing role (rows V28-V31,
            // his reply filed 19 October 2026, item 2) - lines A01-R1 supports with the same category, carried into the resolved game.
            'value.primaryEvent.alsoCounts[c:provisional:A01-R1:A01-R1-V27-1].control',
            'value.primaryEvent.alsoCounts[c:provisional:A01-R1:A01-R1-V27-1].exclusion',
            'value.primaryEvent.alsoCounts[c:provisional:A01-R1:A01-R1-V27-1].team',
            'value.primaryEvent.alsoCounts[c:provisional:A01-R1:A01-R1-V27-1].trigger',
        ])
        for (const entry of own) {
            assert.ok(entry.support.length > 0, entry.path)
            // Every support from the realization carries its category. (Since stage K5 some transition lines are supported by
            // canonical knowledge instead, which carries none: SD-14 gives the start and the after-score restart their
            // episode boundary, and the possession game's GF2-16.a gives an out-of-play restart its awardee.)
            for (const support of entry.support as any[]) {
                if (support.contractId !== 'provisional:A01-R1') {
                    assert.ok(String(entry.path).startsWith('transitions[') && (support.id === 'SD-14' || support.itemId === 'GF2-16.a'), `${entry.path}: ${JSON.stringify(support)}`)
                    assert.equal(support.category, undefined)
                    continue
                }
                assert.equal(support.category, 'PROVISIONAL_REALIZATION_CHOICE', `${roleBlock?.blockId ?? 'no block'}: ${entry.path}`)
            }
        }
        // The opening holder of possession, entailed by the start's awardee (stage K5), carries the awardee's category too.
        const holder = resolved.derived.find(entry => entry.lineId === 'game::PS1')!
        assert.deepEqual(holder.support.map((s: any) => [s.itemId, s.category]), [['A01-R1-T2-1', 'PROVISIONAL_REALIZATION_CHOICE']])
    }
})

/**
 * **An assumed reference decides nothing** (K3 review, 15 October 2026). An assumed item bounds and never entails (SD-27);
 * `target-of.ts` skipped it and still read the answer as decided, so on a copy of the possession game whose axis-start
 * objective reference was assumed, `targetOf=TEAM_AT_AXIS_START` reached NEITHER region (FALSE, FALSE) — a configuration
 * written for that team's target would have reached nothing. It is undetermined now; the authored game is unchanged.
 */
test('targetOf never concludes from an assumed reference: undetermined, never FALSE on both regions', () => {
    const probe = { itemId: 'T-9', row: 'S3', selector: `targetOf=${START}`, requirement: 'EQUALS', value: 'zone', valueStatus: 'REQUIRED_RANGE' }
    const reach = (assumed: boolean) => {
        const input = gf2([probe])
        if (assumed) for (const contract of input.contracts) for (const item of contract.items ?? []) if (item.itemId === 'GF2-08.d') (item as any).basis = 'ASSUMED'
        const selector = parseSelector(`targetOf=${START}`, 'S3', index).predicate!
        return Object.fromEntries(runStages0to2(input).classes.filter(c => c.row === 'S2').map(cls => [cls.classId.split(':').pop(), reaches(selector, cls)]))
    }
    assert.deepEqual(reach(false), { 'GF2-03.e': 'FALSE', 'GF2-03.f': 'TRUE' }, 'as authored (GF2-08.d entails the axis-start reference)')
    const assumed = reach(true)
    assert.ok(!Object.values(assumed).every(verdict => verdict === 'FALSE'), JSON.stringify(assumed))
    assert.equal(assumed['GF2-03.f'], 'UNDETERMINED', 'the region the assumed reference names is undecided, not "not the target"')
})

test('no goal, role, designation or vocabulary literal in the two new derivation modules', () => {
    const code = (file: string) =>
        fs
            .readFileSync(path.join(__dirname, file), 'utf8')
            .split('/*')
            .map((part, i) => (i === 0 ? part : part.slice(part.indexOf('*/') + 2)))
            .join(' ')
            .split('\n')
            .map(line => (line.trimStart().startsWith('//') ? '' : line.split(' // ')[0]))
            .join('\n')
    const forbidden = [...roles, ...index.roleBlocks!.exchanges, 'ROLE_HOLDER', START, END, 'A01', 'GF2', 'RPC-001', 'PRIMARY_SCORING', 'B1', 'B3', 'J1', 'J2', 'S2']
    for (const file of ['role-blocks.ts', 'target-of.ts']) {
        const text = code(file)
        assert.deepEqual(forbidden.filter(word => text.includes(`'${word}`) || text.includes(`"${word}`)), [], file)
    }
})

console.log(`role-blocks.unit.ts — ${passed} passed`)
