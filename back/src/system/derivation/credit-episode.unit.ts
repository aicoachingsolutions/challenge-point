/**
 * A role's scoring credit confined to an episode — stage M1, 17 October 2026 (register version 14, row B8; GA-EPISODE-REACHABLE
 * clauses 4 and 5; A01-R1-B8-1 and A01-R1-B8-2).
 *
 * Christian, reply filed 19 October 2026, item 1: *"The important distinction is that the building team's scoring opportunity
 * applies only during an active build-out episode."* *"If the building team loses possession, that scoring opportunity ends. If it
 * subsequently regains possession, play may continue, but the original build-out scoring opportunity is not restored. A deliberate
 * goalkeeper restart is required to initiate another opportunity to earn a build-out point."* *"Please ensure the underlying scoring
 * eligibility reflects this distinction, rather than relying solely on the coach-facing wording."* Item 3 C: *"Yes. The build-out
 * scoring episode ends. Ordinary play may continue following the restart, but build-out scoring eligibility does not return until a
 * new deliberate goalkeeper restart."* Item 5: *"Any further changes should address general capabilities rather than introduce
 * special cases for this Learning Goal."*
 *
 * What is pinned here:
 *   1. register version 14 holds the rows as data (B8; V27-V31 with no value of their own; the closed list V29.trigger; V27's team
 *      among the designation-valued attributes; B7 version 2), one versions entry quoting him, and a damaged copy halts H1;
 *   2. his item 1 and 3 C are A01-R1 items on the ROLE elements, in his words (never RPC-001, GF2 or a restatement), and each reaches
 *      its line in both blocks (key identity: an UNMET forward result refuses nothing, so the reach itself is pinned);
 *   3. on production A01 both blocks pass GA-EPISODE-REACHABLE with clauses 4 and 5 evaluated: begun by the three goalkeeper
 *      restarts, ended by the change of possession and the two restarts after the building team plays the ball out, kept by the two
 *      restarts after the pressing team does;
 *   4. on TEST-ONLY copies each reversal is refused at structure naming GA-EPISODE-REACHABLE: a regain restoring credit (RPC-001-17.a
 *      value "false"), his 3 C reversed (A01-R1-T7-3 "false"), a beginning awarded to the presser (A01-R1-T2-1), and withheld where
 *      the begin condition is untyped or no change of possession exists;
 *   5. every other goal and the three demonstrations pass the two clauses vacuously, and the context-scoring guard still reads the
 *      reach clause first;
 *   6. the fixture carries the bound on the building role in both blocks and the composed fixture, the bound is withheld from the
 *      coach as awaiting approved wording, and the whole-game value is not.
 *
 * TEST-ONLY copies are labelled; production files are never written.
 *
 * Run: npx ts-node --files -r tsconfig-paths/register ./src/system/derivation/credit-episode.unit.ts
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { buildActivityForReview, buildActivityUnderAuthorizationRecords, RefusedActivity } from '../rendering/build-activity'
import { episodeConfirmed } from '../rendering/context-scoring-guard'
import { mechanismDemonstration, MECHANISM_DEMONSTRATIONS } from '../rendering/mechanism-demonstrations'
import { specializedRoleNames } from '../rendering/session-envelope'
import { sessionPlanningModel } from '../session-planning/session-planning-model'
import { contextManipulationRelationships, learningGoalAuthorizations } from '../test-library/learning-goal-authorizations'
import { CONFORMANCE_DIR, loadRegister, provisionalRealizationNamed } from './corpus'
import { runStages0to10, runStages0to5 } from './engine'
import { applyRealizationDeferrals } from './realization-deferral'
import { HaltError, indexRegister } from './register'
import { roleBlocksOf } from './role-blocks'
import { derivationInputFor, selectFor } from './run-bounded-selection'
import { DerivationInput, LoadedContract, RoleBlock } from './types'

let passed = 0
function test(name: string, body: () => void): void {
    body()
    passed++
    console.log(`  ok  ${name}`)
}

console.log("a role's scoring credit confined to an episode (stage M1, register version 14)")

const register = loadRegister()
const index = indexRegister(register)
const CHECK = 'GA-EPISODE-REACHABLE'
const BEGINS = 'every role whose scoring credit is confined to an episode holds the award of every transition that begins that episode'
const ENDS = 'every transition that can take possession from such a role begins another episode'
const R = (id: string) => `c:provisional:A01-R1:A01-R1-${id}`
const KEEPER = specializedRoleNames()[0]
const sessionOf = (players = 12, keepers = 1) => ({ players, lengthM: 40, widthM: 30, durationMin: 20, roles: { ...Object.fromEntries(specializedRoleNames().map(r => [r, 0])), [KEEPER]: keepers } })

/** A01 as derivation receives it, per block, with a TEST-ONLY alteration of a copy of its contracts. */
const a01Input = (alter: (contracts: LoadedContract[]) => void = () => undefined): DerivationInput => {
    const input: any = { ...derivationInputFor(selectFor('A01', null)), envelope: sessionOf() }
    input.contracts = JSON.parse(JSON.stringify(input.contracts))
    alter(input.contracts)
    input.contracts = applyRealizationDeferrals(input.contracts, contextManipulationRelationships(), index).contracts
    return input
}
const a01Blocks = (alter?: (contracts: LoadedContract[]) => void): { block: RoleBlock; staged: any }[] => {
    const input = a01Input(alter)
    const base: any = runStages0to5(input)
    const found: any = roleBlocksOf(base.classes, base.derived.lines, index)
    assert.equal(found?.kind, 'BLOCKS')
    return (found.blocks as RoleBlock[]).map(block => ({ block, staged: runStages0to10({ ...input, roleBlock: block }) as any }))
}
const reachOf = (staged: any) => staged.gates.gateA.checks.find((c: any) => c.checkId === CHECK)
const verdicts = (staged: any) => reachOf(staged).clauses.map((c: any) => c.verdict)
const itemOf = (contracts: LoadedContract[], contractId: string, itemId: string) => contracts.find(c => c.contractId === contractId)!.items.find(i => i.itemId === itemId)!
/** The whole pathway on the same TEST-ONLY copy: where it stops, and why. */
const builtWith = (alter: (contracts: LoadedContract[]) => void) =>
    buildActivityUnderAuthorizationRecords({ kind: 'learning-goal', goalId: 'A01', session: sessionOf() }, learningGoalAuthorizations(), { alter }).activity as RefusedActivity
const refusedAtStructure = (activity: RefusedActivity, label: string) => {
    assert.equal(activity.outcome, 'refused', label)
    assert.equal(activity.stage, 'structure', `${label}: ${activity.reasons.join(' | ')}`)
    assert.ok(activity.reasons.some(reason => reason.includes(CHECK)), `${label}: the refusal names ${CHECK}`)
}

// ── 1. The register ─────────────────────────────────────────────────────────────────────────────────────
test('register version 14 holds the rows as data, in one versions entry quoting him', () => {
    const version = String(register.version)
    assert.ok(version.startsWith("14, adds a role's scoring credit confined to an episode"))
    for (const quote of [
        'Please ensure the underlying scoring eligibility reflects this distinction, rather than relying solely on the coach-facing wording.',
        'For the previously flagged corner case, I favor allowing a controlled regain inside that area to count as a score, provided the pressing team genuinely establishes possession.',
        'This is a provisional scoring choice for the current realization, not a universal rule equating every regain with successful progression.',
        'With 5 outfield players plus a goalkeeper against 5 outfield players, only the goalkeeper changes teams at a role exchange. No additional outfield player transfer is required.',
        'Any further changes should address general capabilities rather than introduce special cases for this Learning Goal.',
    ])
        assert.ok(version.includes(`"${quote}"`), quote)
    assert.ok(version.includes('Supersedes version 13, which adds positions stated relative to another element or to a team'), 'version 13 kept in the history')
    assert.equal(version.split('Supersedes version ').length - 1, 7, 'one new entry: versions 13 back to 7 are superseded, each once')
    assert.ok(!version.includes('Supersedes version 14'), 'no second bump for these rows')
    const row = (id: string) => index.rows.get(id)!
    assert.deepEqual([row('B8').path, row('B8').ownerRow, row('B8').kind], ['activityRoles[].creditedWithin', 'B1', 'FIELD'])
    assert.deepEqual([row('V27').path, row('V27').kind, row('V27').selectorAttributes, row('V27').earnsValueOf], ['value.primaryEvent.alsoCounts[]', 'COLLECTION', ['team'], 'V2'])
    for (const [id, leaf] of [['V28', 'team'], ['V29', 'trigger'], ['V30', 'control'], ['V31', 'exclusion']]) {
        assert.deepEqual([row(id).path, row(id).ownerRow, row(id).kind], [`value.primaryEvent.alsoCounts[].${leaf}`, 'V27', 'FIELD'], id)
    }
    assert.equal(row('V28').selectorAttribute, 'team', 'the team is carried from the selector (SD-92)')
    assert.ok(![...index.rows.values()].some(r => r.ownerRow === 'V27' && r.path.endsWith('.value')), 'no value of its own')
    assert.ok(![...index.rows.keys()].some(id => /^V3[2-9]$/.test(id)), 'no row id beyond V31 is claimed')
    assert.deepEqual(index.vocabularies.get('V29.trigger'), ['POSSESSION_CHANGE'], 'a closed list of one member')
    assert.ok(String(index.vocabularyVersions['V29.trigger']).startsWith('1 (2026-10-17, register version 14'))
    assert.ok(String(index.vocabularyVersions['B7.valueType']).startsWith('2 (2026-10-17, register version 14'))
    assert.ok(String(row('B7').valueType).includes('{keepsCountOf: R}'), 'B7 version 2: the relative count')
    assert.ok(index.designations.attributes.some(a => a.row === 'V27' && a.attribute === 'team'), "V27's team is designation-valued")
    assert.ok(index.contractEnums.scope.includes('WHOLE_GAME') && index.contractEnums.scope.includes('BUILD_OUT_EPISODE'), "B8's values are the scope list's")
})

test('a damaged copy halts H1: a value of its own on V27, or earnsValueOf naming no field or set on a field', () => {
    const damaged = (mutate: (r: any) => void): string => {
        const copy = JSON.parse(JSON.stringify(register))
        mutate(copy)
        try {
            indexRegister(copy)
            return 'admitted'
        } catch (error) {
            assert.ok(error instanceof HaltError && error.halt === 'H1', String(error))
            return error.message
        }
    }
    assert.equal(damaged(() => undefined), 'admitted')
    assert.match(damaged(r => r.rows.push({ id: 'TEST-ONLY-V', path: 'value.primaryEvent.alsoCounts[].value', ownerRow: 'V27', kind: 'FIELD', valueType: 'TEST-ONLY' })), /gives V27 a value of its own/)
    assert.match(damaged(r => (r.rows.find((x: any) => x.id === 'V27').earnsValueOf = 'V0')), /not a FIELD row/)
    assert.match(damaged(r => (r.rows.find((x: any) => x.id === 'V28').earnsValueOf = 'V2')), /not a COLLECTION row/)
})

// ── 2. His choice, recorded on the role elements ────────────────────────────────────────────────────────
test('his item 1 and 3 C are A01-R1 items on the role elements, in his words, and nothing canonical changes', () => {
    const realization = provisionalRealizationNamed('A01-R1')!
    const item = (id: string) => realization.items.find(i => i.itemId === id)!
    const building = item('A01-R1-B8-1')
    assert.deepEqual([building.row, building.selector, building.requirement, building.value, building.basis, (building as any).category], ['B8', 'activityRole=BUILDING', 'EQUALS', 'BUILD_OUT_EPISODE', 'OWNER_RULING', 'PROVISIONAL_REALIZATION_CHOICE'])
    assert.equal((building as any).citedAs, 'his reply filed 19 October 2026, item 1; item 3 C')
    for (const quote of [
        "The important distinction is that the building team's scoring opportunity applies only during an active build-out episode.",
        'If the building team loses possession, that scoring opportunity ends. If it subsequently regains possession, play may continue, but the original build-out scoring opportunity is not restored. A deliberate goalkeeper restart is required to initiate another opportunity to earn a build-out point.',
        'Yes. The build-out scoring episode ends. Ordinary play may continue following the restart, but build-out scoring eligibility does not return until a new deliberate goalkeeper restart.',
    ])
        assert.ok(String((building as any).basisEvidence).includes(`"${quote}"`), quote)
    assert.ok(String((building as any).basisEvidence).includes('CONSISTENT existing knowledge, cited as consistent and not as the authority'), 'RPC-001-11.b, KR-02, KR-03 and SD-36 are consistent knowledge, not his authority')
    const pressing = item('A01-R1-B8-2')
    assert.deepEqual([pressing.row, pressing.selector, pressing.value, pressing.basis], ['B8', 'activityRole=PRESSING', 'WHOLE_GAME', 'OWNER_RULING'])
    assert.equal((pressing as any).words, 'The pressing team retains its separate objective of regaining possession and attacking the 5 m target area.')
    assert.ok(String((item('A01-R1-T7-3') as any).basisEvidence).includes('CONFIRMED in his reply filed 19 October 2026, item 3 C'), 'T7-3 cites his 3 C confirmation')
    // Not knowledge: no A01-R1 text, no B8 row and no bound written into the contracts or the restatements.
    for (const file of ['contracts.json', 'corpus-restatements.json']) {
        const text = fs.readFileSync(path.join(CONFORMANCE_DIR, 'stage-b', file), 'utf8')
        for (const absent of ['A01-R1', 'creditedWithin', '"row": "B8"', 'alsoCounts']) assert.ok(!text.includes(absent), `${file} holds ${absent}`)
    }
})

test('key identity: each item reaches its role element in both blocks, and the bound is a derived line', () => {
    for (const { block, staged } of a01Blocks()) {
        for (const [id, element, value] of [['A01-R1-B8-1', 'B1-1', 'BUILD_OUT_EPISODE'], ['A01-R1-B8-2', 'B1-2', 'WHOLE_GAME']]) {
            const outcome = (staged.forward as any[]).find(f => f.item.contractId === 'provisional:A01-R1' && f.item.itemId === id)
            assert.deepEqual([outcome?.result, outcome?.reach], ['SATISFIED', [`${R(element)}::B8`]], `${block.blockId} ${id}`)
            assert.equal(staged.classified.get(`${R(element)}::B8`)?.verdict, 'RESOLVED:ENTAILED', `${block.blockId} ${element}`)
            const entailing = staged.derived.lines.get(`${R(element)}::B8`).entailing
            assert.deepEqual(entailing.map((e: any) => [e.item.itemId, e.value]), [[id, value]])
        }
    }
})

// ── 3. Production A01 ───────────────────────────────────────────────────────────────────────────────────
test('production A01: GA-EPISODE-REACHABLE passes in both blocks with clauses 4 and 5 evaluated', () => {
    for (const { block, staged } of a01Blocks()) {
        const reach = reachOf(staged)
        assert.equal(reach.verdict, 'PASS', `${block.blockId}: ${reach.why}`)
        assert.deepEqual(reach.clauses.map((c: any) => c.clause).slice(3), [BEGINS, ENDS], 'appended after the three existing clauses')
        assert.deepEqual(reach.clauses.map((c: any) => [c.verdict, c.basis]), Array(5).fill(['PASS', 'EVALUATED']))
        assert.equal(reach.clauses[3].instances, 3, 'three beginnings, each awarded to the building role')
        assert.equal(reach.clauses[4].instances, 8, 'the change of possession and the seven restarts')
        const said = reach.why.slice(reach.why.indexOf('credit confined to an episode'))
        assert.ok(said.includes(`${R('B1-1')} (ROLE_HOLDER_BUILDING) earns its credit within BUILD_OUT_EPISODE`), said)
        assert.ok(said.includes(`begun by ${R('T1-1')}, ${R('T1-2')}, ${R('T1-3')}`), 'begun by the start, the restart after a score and the coach-judged conclusion')
        assert.ok(said.includes(`ended by ${R('T1-5')}, ${R('T1-7')}, c:restated:GF2:GF2-07.a`), 'ended by the restarts after the building team plays the ball out, and the change of possession')
        assert.ok(said.includes(`kept by ${R('T1-4')}, ${R('T1-6')} (restarts awarded to ROLE_HOLDER_BUILDING that begin no episode)`), 'kept by the restarts after the pressing team plays the ball out')
        assert.ok(!said.includes(R('B1-2')), 'the pressing role carries the whole game, so it is bound by nothing')
    }
})

test('the whole pathway: production A01 still reaches communication, its build-out conditions confirmed by the rerun check', () => {
    const review = buildActivityForReview({ kind: 'learning-goal', goalId: 'A01', session: sessionOf() }, { includeDrafts: true }) as RefusedActivity
    assert.equal(review.stage, 'communication', review.reasons.join(' | '))
    assert.ok(!review.reasons.some(reason => reason.includes('cannot be confirmed to govern this game')), 'the context-scoring guard confirms the four BUILD_OUT_EPISODE conditions in both blocks')
})

// ── 4. Each reversal, refused at structure ─────────────────────────────────────────────────────────────
test('TEST-ONLY: a regain that would restore credit (RPC-001-17.a value "false") fails clause 5 and is refused at structure', () => {
    // The value, not its removal: removing the item leaves the change of possession beginning an episode through SD-14 (measured by
    // the design verifier).
    const alter = (contracts: LoadedContract[]) => void ((itemOf(contracts, 'restated:RPC-001', 'RPC-001-17.a') as any).value = 'false')
    for (const { block, staged } of a01Blocks(alter)) {
        assert.deepEqual(verdicts(staged), ['PASS', 'PASS', 'PASS', 'PASS', 'FAIL'], block.blockId)
        assert.ok(reachOf(staged).why.includes('c:restated:GF2:GF2-07.a (a change of possession that begins no episode)'))
    }
    refusedAtStructure(builtWith(alter), 'a regain restoring credit')
})

test('TEST-ONLY: his 3 C reversed (A01-R1-T7-3 "false") fails clause 5 and is refused at structure', () => {
    const alter = (contracts: LoadedContract[]) => void ((itemOf(contracts, 'provisional:A01-R1', 'A01-R1-T7-3') as any).value = 'false')
    for (const { block, staged } of a01Blocks(alter)) {
        assert.deepEqual(verdicts(staged), ['PASS', 'PASS', 'PASS', 'PASS', 'FAIL'], block.blockId)
        for (const id of ['T1-5', 'T1-7']) assert.ok(reachOf(staged).why.includes(`${R(id)} (a restart awarded away from ROLE_HOLDER_BUILDING that begins no episode)`), id)
    }
    refusedAtStructure(builtWith(alter), 'his 3 C reversed')
})

test('TEST-ONLY: the build-out beginnings awarded to the presser fail clause 4 while his D7 one-awardee clause still passes', () => {
    const alter = (contracts: LoadedContract[]) => void ((itemOf(contracts, 'provisional:A01-R1', 'A01-R1-T2-1') as any).value = 'ROLE_HOLDER_PRESSING')
    for (const { block, staged } of a01Blocks(alter)) {
        const clauses = verdicts(staged)
        assert.equal(clauses[1], 'PASS', `${block.blockId}: one awardee, so D7's clause alone would not see it`)
        assert.equal(clauses[3], 'FAIL', block.blockId)
        assert.ok(reachOf(staged).why.includes(`(awarded away from ROLE_HOLDER_BUILDING: ${R('T1-1')}, ${R('T1-2')}, ${R('T1-3')})`))
    }
    refusedAtStructure(builtWith(alter), 'beginnings awarded to the presser')
})

test('TEST-ONLY: withheld, never passed, where the begin condition is untyped or the game holds no change of possession', () => {
    // C58's referent replaced by the origin's original placement texts: nothing types where the episode begins.
    const untyped = (contracts: LoadedContract[]) => void ((itemOf(contracts, 'restated:RPC-001', 'RPC-001-18.b') as any).value = ["the goalkeeper's START/restart placement", 'a controlled defensive restart placement'])
    for (const { block, staged } of a01Blocks(untyped)) assert.equal(reachOf(staged).clauses[3].verdict, 'NOT_EVALUABLE', block.blockId)
    const refused = builtWith(untyped)
    assert.equal(refused.stage, 'structure', refused.reasons.join(' | '))
    // No transition keyed on a change of possession: the end of the credit at a loss of possession is not established.
    const noTurnover = (contracts: LoadedContract[]) => {
        for (const contract of contracts) contract.items = contract.items.filter(i => !(String(i.row) === 'T1' && String(i.selector) === 'trigger=POSSESSION_CHANGE'))
    }
    for (const { block, staged } of a01Blocks(noTurnover)) {
        assert.equal(reachOf(staged).clauses[4].verdict, 'NOT_EVALUABLE', block.blockId)
        assert.ok(reachOf(staged).why.includes('the game holds no change of possession, so its end at a loss of possession is not established'))
    }
})

// ── 5. Everything else, and the guard ───────────────────────────────────────────────────────────────────
test('every other goal and the three demonstrations pass clauses 4 and 5 with no applicable instance, and their reason says nothing new', () => {
    const inputs: [string, DerivationInput][] = []
    const goals = sessionPlanningModel.phases().flatMap(phase => (sessionPlanningModel.learningGoalsForPhase(phase) as any[]).map(goal => String(goal.ID)))
    for (const goalId of goals.filter(id => id !== 'A01')) {
        try {
            inputs.push([goalId, derivationInputFor(selectFor(goalId, null))])
        } catch {
            continue // refused at selection: no derivation, nothing to check
        }
    }
    for (const demonstration of MECHANISM_DEMONSTRATIONS) {
        inputs.push([demonstration.id, derivationInputFor({ selected: mechanismDemonstration(demonstration.id)!.selected.map((id, i) => ({ id, role: i === 0 ? 'game form' : 'constraint' })) })])
    }
    assert.ok(inputs.length >= 3)
    for (const [label, input] of inputs) {
        const staged: any = runStages0to10(input)
        const reach = reachOf(staged)
        if (!reach) continue // halted before Gate A
        assert.equal(reach.clauses.length, 5, label)
        assert.deepEqual(reach.clauses.slice(3).map((c: any) => [c.clause, c.verdict, c.basis, c.instances]), [[BEGINS, 'PASS', 'NO_APPLICABLE_INSTANCES', 0], [ENDS, 'PASS', 'NO_APPLICABLE_INSTANCES', 0]], label)
        assert.ok(!reach.why.includes('credit confined to an episode'), `${label}: the reason is unchanged`)
    }
})

test('the context-scoring guard still reads the first clause as the reach clause, and any clause short of PASS confirms nothing', () => {
    const [{ staged }] = a01Blocks()
    const reach = reachOf(staged)
    assert.equal(episodeConfirmed('BUILD_OUT_EPISODE', reach), true)
    const vacuousReach = { ...reach, clauses: [{ ...reach.clauses[0], basis: 'NO_APPLICABLE_INSTANCES', instances: 0 }, ...reach.clauses.slice(1)] }
    assert.equal(episodeConfirmed('BUILD_OUT_EPISODE', vacuousReach), false, 'clauses[0] is still the reach clause')
    const failingCredit = { ...reach, clauses: [...reach.clauses.slice(0, 4), { ...reach.clauses[4], verdict: 'FAIL' }] }
    assert.equal(episodeConfirmed('BUILD_OUT_EPISODE', failingCredit), false, 'a failing credit clause confirms nothing')
})

// ── 6. The fixture and the coach text ───────────────────────────────────────────────────────────────────
test('the fixture carries the bound in both blocks and the composed fixture; the coach is not told it in words nobody approved', () => {
    const built = buildActivityUnderAuthorizationRecords({ kind: 'learning-goal', goalId: 'A01', session: sessionOf() }, learningGoalAuthorizations())
    const fixture: any = built.fixture
    assert.ok(fixture, 'a composed fixture')
    const bounds = (game: any) => (game.activityRoles as any[]).map(role => [role.elementId, role.creditedWithin])
    const expected = [[R('B1-1'), 'BUILD_OUT_EPISODE'], [R('B1-2'), 'WHOLE_GAME']]
    assert.deepEqual(bounds(fixture.game), expected, 'the composed fixture')
    assert.equal(fixture.roleBlocks.blocks.length, 2)
    for (const block of fixture.roleBlocks.blocks) assert.deepEqual(bounds(block.fixture.game), expected, block.blockId)
    const activity = built.activity as RefusedActivity
    assert.equal(activity.stage, 'communication')
    const awaiting = activity.reasons.filter(reason => reason.includes('awaiting approved wording: activityRoles['))
    assert.equal(awaiting.length, 2, 'one per block')
    assert.ok(awaiting.every(reason => reason.endsWith(`awaiting approved wording: activityRoles[${R('B1-1')}].creditedWithin (B8)`)), awaiting.join(' | '))
    assert.ok(!activity.reasons.some(reason => reason.includes(`awaiting approved wording: activityRoles[${R('B1-2')}]`)), 'the whole game bounds nothing, so no approved wording is owed for it')
})

console.log(`credit-episode.unit.ts — ${passed} passed`)
