/**
 * An occurrence that also counts as the one primary event, for one team — stage M2, 17 October 2026 (register version 14, rows V27
 * `value.primaryEvent.alsoCounts[]`, V28 team, V29 trigger, V30 control, V31 exclusion; GA-ONE-PRIMARY-EVENT's added clauses; the
 * context-scoring guard; A01-R1-V27-1, V29-1, V30-1 and V31-1).
 *
 * Christian, reply filed 19 October 2026, item 2: *"The pressing team retains its separate objective of regaining possession and
 * attacking the 5 m target area."* *"For the previously flagged corner case, I favor allowing a controlled regain inside that area to
 * count as a score, provided the pressing team genuinely establishes possession."* *"A contested touch, deflection, or loose ball
 * should not qualify."* *"This is a provisional scoring choice for the current realization, not a universal rule equating every regain
 * with successful progression."* His 17 October D3: *"Please verify that the two targets can coexist without overlapping or
 * contradictory scoring conditions."* Item 5: *"Any further changes should address general capabilities rather than introduce special
 * cases for this Learning Goal."* (Reading 'count as a score' as counting as the one primary event and earning its value is OUR
 * READING, SD-113.)
 *
 * What is pinned here:
 *   1. his item 2 is four A01-R1 items for the pressing role only, in his words, our glosses labelled ours, nothing canonical written;
 *   2. key identity: each item reaches its line in both blocks, and the element crosses into both block fixtures and the composed one;
 *   3. on production A01 both blocks pass GA-ONE-PRIMARY-EVENT's seven added clauses (before realization and as rerun on the concrete
 *      game), the occurrence inside the pressing team's own target in each block, and the activity is refused at communication naming
 *      exactly the element's four fields - never for an unnamed reason;
 *   4. on TEST-ONLY copies each clause refuses its own violation at structure, and the guard refuses an element not standing on his
 *      ruling at validation;
 *   5. every other goal and the three demonstrations read exactly as before (no added clause), and a derivation with no role block
 *      defers rather than fails.
 *
 * TEST-ONLY copies are labelled; production files are never written.
 *
 * Run: npx ts-node --files -r tsconfig-paths/register ./src/system/derivation/also-counts.unit.ts
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { ApprovedWording } from '../rendering/approved-wording'
import { buildActivityForReview, buildActivityUnderAuthorizationRecords, RefusedActivity } from '../rendering/build-activity'
import { alsoCountsFindings } from '../rendering/context-scoring-guard'
import { mechanismDemonstration, MECHANISM_DEMONSTRATIONS } from '../rendering/mechanism-demonstrations'
import { renderConcreteGame } from '../rendering/render-concrete-game'
import { specializedRoleNames } from '../rendering/session-envelope'
import { sessionPlanningModel } from '../session-planning/session-planning-model'
import { contextManipulationRelationships, learningGoalAuthorizations } from '../test-library/learning-goal-authorizations'
import { CONFORMANCE_DIR, loadRegister, provisionalRealizationNamed } from './corpus'
import { runStages0to10, runStages0to5 } from './engine'
import { applyRealizationDeferrals } from './realization-deferral'
import { indexRegister } from './register'
import { roleBlocksOf } from './role-blocks'
import { derivationInputFor, selectFor } from './run-bounded-selection'
import { DerivationInput, LoadedContract, RoleBlock } from './types'

let passed = 0
function test(name: string, body: () => void): void {
    body()
    passed++
    console.log(`  ok  ${name}`)
}

console.log('an occurrence that also counts as the primary event (stage M2, register version 14)')

const index = indexRegister(loadRegister())
const CHECK = 'GA-ONE-PRIMARY-EVENT'
const EXISTING = ['exactly one primary event, of a registered kind', 'the base value is derived and numeric', 'every member of the event reference has a space position', 'whenever it can fire']
const ADDED = [
    'every occurrence that also counts as the primary event is for exactly one team',
    'its trigger is an event in play the game holds, and the game holds the score that follows it',
    'it lies inside the one positioned target its own team attacks',
    'it states the control under which the occurrence is established',
    'at most one such occurrence for each team',
    'its trigger begins an episode, and none that a condition of the primary event is authored for',
    'no condition of the primary event is authored for every score beside it',
]
const [TEAM, TRIGGER, TARGET, CONTROL, ONE, EPISODE, WHOLE] = ADDED
const R = (id: string) => `c:provisional:A01-R1:A01-R1-${id}`
const ELEMENT = R('V27-1')
const BLOCK_X = 'BUILDING=TEAM_AT_AXIS_START,PRESSING=TEAM_AT_AXIS_END'
const BLOCK_Y = 'BUILDING=TEAM_AT_AXIS_END,PRESSING=TEAM_AT_AXIS_START'
const KEEPER = specializedRoleNames()[0]
const sessionOf = (players = 12, keepers = 1) => ({ players, lengthM: 40, widthM: 30, durationMin: 20, roles: { ...Object.fromEntries(specializedRoleNames().map(r => [r, 0])), [KEEPER]: keepers } })
const HIS_ITEM_2 = 'For the previously flagged corner case, I favor allowing a controlled regain inside that area to count as a score, provided the pressing team genuinely establishes possession.'
const HIS_EXCLUSION = 'A contested touch, deflection, or loose ball should not qualify.'

/** A01 as derivation receives it, with a TEST-ONLY alteration of a copy of its contracts. */
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
const checkOf = (staged: any) => staged.gates.gateA.checks.find((c: any) => c.checkId === CHECK)
const added = (staged: any) => checkOf(staged).clauses.slice(EXISTING.length)
const verdictOf = (staged: any, clause: string) => added(staged).find((c: any) => c.clause === clause)?.verdict
const provisional = (contracts: LoadedContract[]) => contracts.find(c => c.contractId === 'provisional:A01-R1')!
const itemOf = (contracts: LoadedContract[], contractId: string, itemId: string) => contracts.find(c => c.contractId === contractId)!.items.find(i => i.itemId === itemId)!
/** The whole pathway on the same TEST-ONLY copy: where it stops, and why. */
const builtWith = (alter: (contracts: LoadedContract[]) => void) =>
    buildActivityUnderAuthorizationRecords({ kind: 'learning-goal', goalId: 'A01', session: sessionOf() }, learningGoalAuthorizations(), { alter }).activity as RefusedActivity
const refusedAtStructure = (activity: RefusedActivity, label: string) => {
    assert.equal(activity.outcome, 'refused', label)
    assert.equal(activity.stage, 'structure', `${label}: ${activity.reasons.join(' | ')}`)
    assert.ok(activity.reasons.some(reason => reason.includes(CHECK)), `${label}: the refusal names ${CHECK}: ${activity.reasons.join(' | ')}`)
}
/** TEST-ONLY items for a second occurrence, never production data. */
const testItem = (itemId: string, row: string, selector: string, requirement: string, value: unknown) => ({
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
})

// ── 1. His choice, recorded ─────────────────────────────────────────────────────────────────────────────
test('his item 2 is four A01-R1 items for the pressing role only, in his words, and nothing canonical changes', () => {
    const realization = provisionalRealizationNamed('A01-R1')!
    const item = (id: string) => realization.items.find(i => i.itemId === id) as any
    const rows = ['V27-1', 'V29-1', 'V30-1', 'V31-1'].map(id => item(`A01-R1-${id}`))
    assert.deepEqual(
        rows.map(i => [i.row, i.selector, i.requirement, i.value, i.basis, i.category, i.citedAs]),
        [
            ['V27', 'team=ROLE_HOLDER_PRESSING', 'EXISTS', 'N/A', 'OWNER_RULING', 'PROVISIONAL_REALIZATION_CHOICE', 'his reply filed 19 October 2026, item 2'],
            ['V29', 'team=ROLE_HOLDER_PRESSING', 'EQUALS', 'POSSESSION_CHANGE', 'OWNER_RULING', 'PROVISIONAL_REALIZATION_CHOICE', 'his reply filed 19 October 2026, item 2'],
            ['V30', 'team=ROLE_HOLDER_PRESSING', 'EQUALS', 'genuinely establishes possession', 'OWNER_RULING', 'PROVISIONAL_REALIZATION_CHOICE', 'his reply filed 19 October 2026, item 2'],
            ['V31', 'team=ROLE_HOLDER_PRESSING', 'EQUALS', 'a contested touch, deflection, or loose ball', 'OWNER_RULING', 'PROVISIONAL_REALIZATION_CHOICE', 'his reply filed 19 October 2026, item 2'],
        ],
    )
    // His words, verbatim; the control and the exclusion are his own terms.
    for (const i of rows.slice(0, 3)) assert.equal(i.words, HIS_ITEM_2, i.itemId)
    assert.equal(item('A01-R1-V31-1').words, HIS_EXCLUSION)
    for (const quote of [HIS_ITEM_2, HIS_EXCLUSION, 'This is a provisional scoring choice for the current realization, not a universal rule equating every regain with successful progression.', 'However, please do not automatically add a high-regain bonus.'])
        assert.ok(String(item('A01-R1-V27-1').basisEvidence).includes(`"${quote}"`), quote)
    assert.ok(String(item('A01-R1-V27-1').basisEvidence).includes('"Specific knowledge governs where it explicitly defines or specializes a condition."'), 'the credit rests on his explicit ruling')
    // Our glosses are labelled ours: the element's reading of 'count as a score', and the trigger's exclusion of restart awards.
    assert.ok(String(item('A01-R1-V27-1').fitNote).startsWith('OUR GLOSS, labelled so'))
    assert.ok(String(item('A01-R1-V27-1').fitNote).includes('is OUR READING (SD-113)'))
    assert.ok(String(item('A01-R1-V29-1').fitNote).startsWith('OUR READING, labelled so'))
    // Nothing for the building role, and no other row of the collection: no value of its own, no written referent.
    const own = realization.items.filter(i => ['V27', 'V28', 'V29', 'V30', 'V31'].includes(String(i.row)))
    assert.equal(own.length, 4)
    assert.ok(own.every(i => !JSON.stringify(i).includes('ROLE_HOLDER_BUILDING')), 'no element names the building role')
    // Not knowledge: nothing written into the contracts or the restatements.
    for (const file of ['contracts.json', 'corpus-restatements.json']) {
        const text = fs.readFileSync(path.join(CONFORMANCE_DIR, 'stage-b', file), 'utf8')
        for (const absent of ['A01-R1-V2', 'A01-R1-V3', 'alsoCounts', '"row": "V27"']) assert.ok(!text.includes(absent), `${file} holds ${absent}`)
    }
})

test('key identity: each item reaches its line in both blocks, and the element crosses into every fixture whole', () => {
    for (const { block, staged } of a01Blocks()) {
        const outcome = (id: string) => (staged.forward as any[]).find(f => f.item.contractId === 'provisional:A01-R1' && f.item.itemId === id)
        assert.equal(outcome('A01-R1-V27-1')?.result, 'SATISFIED', block.blockId)
        for (const [id, row, value] of [['A01-R1-V29-1', 'V29', 'POSSESSION_CHANGE'], ['A01-R1-V30-1', 'V30', 'genuinely establishes possession'], ['A01-R1-V31-1', 'V31', 'a contested touch, deflection, or loose ball']]) {
            assert.deepEqual([outcome(id)?.result, outcome(id)?.reach], ['SATISFIED', [`${ELEMENT}::${row}`]], `${block.blockId} ${id}`)
            assert.equal(staged.classified.get(`${ELEMENT}::${row}`)?.verdict, 'RESOLVED:ENTAILED', `${block.blockId} ${row}`)
            assert.deepEqual(staged.derived.lines.get(`${ELEMENT}::${row}`).entailing.map((e: any) => [e.item.itemId, e.value]), [[id, value]])
        }
        // The team is carried from the selector (SD-92).
        assert.equal(staged.classified.get(`${ELEMENT}::V28`)?.verdict, 'RESOLVED:ENTAILED', block.blockId)
    }
    const built = buildActivityUnderAuthorizationRecords({ kind: 'learning-goal', goalId: 'A01', session: sessionOf() }, learningGoalAuthorizations())
    const fixture: any = built.fixture
    const expected = [{ elementId: ELEMENT, selector: [{ attribute: 'team', op: '=', value: 'ROLE_HOLDER_PRESSING' }], team: 'ROLE_HOLDER_PRESSING', trigger: 'POSSESSION_CHANGE', control: 'genuinely establishes possession', exclusion: 'a contested touch, deflection, or loose ball' }]
    assert.deepEqual(fixture.game.value.primaryEvent.alsoCounts, expected, 'the composed fixture')
    for (const block of fixture.roleBlocks.blocks) {
        const event = block.fixture.game.value.primaryEvent
        assert.deepEqual(event.alsoCounts, expected, block.blockId)
        // SD-06 unchanged: one event, one kind, one value; the element holds no value of its own.
        assert.deepEqual([event.kind, event.value], ['target_zone_entered', 1], block.blockId)
        assert.ok(!('value' in event.alsoCounts[0]), 'no value of its own')
    }
})

// ── 3. Production A01 ───────────────────────────────────────────────────────────────────────────────────
test('production A01: the seven added clauses pass in both blocks, each over the one occurrence, inside the pressing team\'s own target', () => {
    const targets: Record<string, [string, string, string]> = { [BLOCK_X]: ['TEAM_AT_AXIS_END', 'GF2-08.e', 'GF2-03.e'], [BLOCK_Y]: ['TEAM_AT_AXIS_START', 'GF2-08.c', 'GF2-03.f'] }
    for (const { block, staged } of a01Blocks()) {
        const check = checkOf(staged)
        assert.deepEqual(check.clauses.map((c: any) => c.clause), [...EXISTING, ...ADDED], 'appended after the four existing clauses')
        assert.deepEqual(added(staged).map((c: any) => [c.verdict, c.basis, c.instances]), [...Array(6).fill(['PASS', 'EVALUATED', 1]), ['PASS', 'EVALUATED', 4]], block.blockId)
        const [team, objective, target] = targets[block.blockId]
        assert.ok(
            check.why.endsWith(`; 1 occurrence(s) also count as the primary event: ${ELEMENT} for ROLE_HOLDER_PRESSING (${team}) at POSSESSION_CHANGE (c:restated:GF2:GF2-07.a), inside the target of c:restated:GF2:${objective}, c:restated:GF2:${target}`),
            check.why,
        )
    }
    // As rerun on the concrete game (post-realization), in the administrator's review evidence: still PASS, eleven clauses, per block.
    const review = buildActivityForReview({ kind: 'learning-goal', goalId: 'A01', session: sessionOf() }, { includeDrafts: true }) as RefusedActivity
    const blocks = review.evidence!.structure.blocks
    assert.deepEqual(blocks.map(b => b.blockId), [BLOCK_X, BLOCK_Y])
    for (const block of blocks) {
        const rows = Object.values(block.sections).flatMap(section => section.checks).filter(row => row.checkId === CHECK)
        assert.deepEqual(rows.map(row => [row.verdict, (row as any).clauseCount]), [['PASS', 11]], block.blockId)
    }
})

test('the whole pathway: refused at communication naming exactly the occurrence\'s four fields in each block, and the guard finds nothing', () => {
    const activity = buildActivityUnderAuthorizationRecords({ kind: 'learning-goal', goalId: 'A01', session: sessionOf() }, learningGoalAuthorizations()).activity as RefusedActivity
    assert.equal(activity.stage, 'communication', activity.reasons.join(' | '))
    const awaiting = activity.reasons.filter(reason => reason.includes('awaiting approved wording: value.primaryEvent.alsoCounts['))
    assert.deepEqual(
        awaiting,
        [BLOCK_X, BLOCK_Y].flatMap(block => [['team', 'V28'], ['trigger', 'V29'], ['control', 'V30'], ['exclusion', 'V31']].map(([field, row]) => `block ${block}: awaiting approved wording: value.primaryEvent.alsoCounts[${ELEMENT}].${field} (${row})`)),
    )
    assert.ok(!activity.reasons.some(reason => reason.includes('also counts as the primary event on')), 'every item behind it is his ruling')
    assert.ok(!activity.reasons.some(reason => reason.includes(CHECK)))
})

test('TEST-ONLY approved entry: covering the four exact values says them once and withholds none; it never reaches another team\'s element', () => {
    // A TEST-ONLY entry, never production data (the table stays empty until he approves a sentence): its covers are the element's
    // exact values, so it is the only kind of entry that can say the occurrence.
    const built = buildActivityUnderAuthorizationRecords({ kind: 'learning-goal', goalId: 'A01', session: sessionOf() }, learningGoalAuthorizations())
    const blockFixture: any = (built.fixture as any).roleBlocks.blocks[0].fixture
    const entry: ApprovedWording = {
        id: 'TEST-ONLY-W',
        covers: [
            { row: 'V28', match: { equals: 'ROLE_HOLDER_PRESSING' } },
            { row: 'V29', match: { equals: 'POSSESSION_CHANGE' } },
            { row: 'V30', match: { equals: 'genuinely establishes possession' } },
            { row: 'V31', match: { equals: 'a contested touch, deflection, or loose ball' } },
        ],
        sentence: 'TEST-ONLY sentence',
        section: 'How to score',
        approvedBy: { who: 'Christian', date: '2026-10-19', quote: 'a test approval, not his words', ccs: 'RC2' },
    } as ApprovedWording
    const alsoWithheld = (fixture: any, wording: ApprovedWording[]) => renderConcreteGame(fixture, wording).withheld.filter(w => w.path.startsWith('value.primaryEvent.alsoCounts['))
    assert.equal(alsoWithheld(blockFixture, []).length, 4, 'with the real (empty) table: withheld')
    const said = renderConcreteGame(blockFixture, [entry])
    assert.equal(alsoWithheld(blockFixture, [entry]).length, 0, 'covered whole: nothing withheld')
    const sentence = said.instructions.filter(i => i.text === 'TEST-ONLY sentence')
    assert.equal(sentence.length, 1, 'said once')
    assert.deepEqual([...sentence[0].from].sort(), ['control', 'exclusion', 'team', 'trigger'].map(field => `value.primaryEvent.alsoCounts[${ELEMENT}].${field}`))
    // The same entry on a TEST-ONLY copy whose element is for the other role: no cover holds, so every field is withheld.
    const other = JSON.parse(JSON.stringify(blockFixture))
    other.game.value.primaryEvent.alsoCounts[0].team = 'ROLE_HOLDER_BUILDING'
    assert.equal(alsoWithheld(other, [entry]).length, 4)
    // An entry covering the primary event's conditions (rows V3-V6) never covers this element.
    const conditionEntry = { ...entry, id: 'TEST-ONLY-C', covers: [{ row: 'V4', match: { equals: 'control' } }] } as ApprovedWording
    assert.equal(alsoWithheld(blockFixture, [conditionEntry]).length, 4)
})

// ── 4. Each violation, refused ─────────────────────────────────────────────────────────────────────────
const withSelector = (selector: string) => (contracts: LoadedContract[]) => {
    for (const i of provisional(contracts).items) if (['V27', 'V29', 'V30', 'V31'].includes(String(i.row))) (i as any).selector = selector
}

test('TEST-ONLY: an occurrence for every team, or for a team decided by possession, fails the team clause and is refused at structure', () => {
    for (const designation of ['EACH_TEAM', 'ATTACKING_TEAM']) {
        const alter = withSelector(`team=${designation}`)
        for (const { block, staged } of a01Blocks(alter)) assert.equal(verdictOf(staged, TEAM), 'FAIL', `${designation} ${block.blockId}`)
        refusedAtStructure(builtWith(alter), designation)
    }
})

test('TEST-ONLY: the trigger with no transition keyed on it, or no score after it, fails the trigger clause and is refused at structure', () => {
    const noTurnover = (contracts: LoadedContract[]) => {
        for (const contract of contracts) contract.items = contract.items.filter(i => !(String(i.row) === 'T1' && String(i.selector) === 'trigger=POSSESSION_CHANGE'))
    }
    for (const { block, staged } of a01Blocks(noTurnover)) {
        assert.equal(verdictOf(staged, TRIGGER), 'FAIL', block.blockId)
        assert.ok(checkOf(staged).why.includes('at POSSESSION_CHANGE (no transition; the game holds no transition keyed on it)'), checkOf(staged).why)
    }
    refusedAtStructure(builtWith(noTurnover), 'no change of possession')
    const noScore = (contracts: LoadedContract[]) => void (provisional(contracts).items = provisional(contracts).items.filter(i => i.itemId !== 'A01-R1-T1-2'))
    for (const { block, staged } of a01Blocks(noScore)) {
        assert.equal(verdictOf(staged, TRIGGER), 'FAIL', block.blockId)
        assert.ok(checkOf(staged).why.includes('the game holds no score transition'), checkOf(staged).why)
    }
    refusedAtStructure(builtWith(noScore), 'no score transition')
})

test('TEST-ONLY: control unstated is withheld, never passed, and refused at structure', () => {
    // A missing value is a gap, not a violation, so the clause is NOT_EVALUABLE (the convention every Gate A clause keeps), and a
    // withheld clause refuses the game exactly as a failed one.
    const alter = (contracts: LoadedContract[]) => void (provisional(contracts).items = provisional(contracts).items.filter(i => i.itemId !== 'A01-R1-V30-1'))
    for (const { block, staged } of a01Blocks(alter)) assert.equal(verdictOf(staged, CONTROL), 'NOT_EVALUABLE', block.blockId)
    refusedAtStructure(builtWith(alter), 'control unstated')
})

test('TEST-ONLY: two occurrences for one team fail the one-per-team clause in the block where they coincide', () => {
    const alter = (contracts: LoadedContract[]) =>
        void provisional(contracts).items.push(
            ...([
                testItem('TEST-ONLY-V27', 'V27', 'team=TEAM_AT_AXIS_END', 'EXISTS', 'N/A'),
                testItem('TEST-ONLY-V29', 'V29', 'team=TEAM_AT_AXIS_END', 'EQUALS', 'POSSESSION_CHANGE'),
                testItem('TEST-ONLY-V30', 'V30', 'team=TEAM_AT_AXIS_END', 'EQUALS', 'TEST-ONLY'),
            ] as any[]),
        )
    const verdicts = Object.fromEntries(a01Blocks(alter).map(({ block, staged }) => [block.blockId, verdictOf(staged, ONE)]))
    // In block X the pressing role is held by the team at the axis end, so both elements are for that one team.
    assert.deepEqual(verdicts, { [BLOCK_X]: 'FAIL', [BLOCK_Y]: 'PASS' })
    refusedAtStructure(builtWith(alter), 'two occurrences for one team')
})

test('TEST-ONLY: a change of possession that begins no episode fails the episode clause and is refused at structure', () => {
    // The value, not its removal (removal leaves the change of possession beginning an episode through SD-14).
    const alter = (contracts: LoadedContract[]) => void ((itemOf(contracts, 'restated:RPC-001', 'RPC-001-17.a') as any).value = 'false')
    for (const { block, staged } of a01Blocks(alter)) {
        assert.equal(verdictOf(staged, EPISODE), 'FAIL', block.blockId)
        assert.ok(checkOf(staged).why.includes('c:restated:GF2:GF2-07.a begins no episode'), checkOf(staged).why)
    }
    refusedAtStructure(builtWith(alter), 'a change of possession beginning no episode')
    // The clause's other half - the trigger's transition beginning an episode a condition is authored for - is entailed today: the
    // typed begin condition never picks out a change of possession (gates.ts buildOutStarters rules it out by the register's trigger
    // term, and a beginning stops play, which an event in play does not). It is checked, and pinned reachable by nothing.
    const [{ staged }] = a01Blocks()
    const reach = staged.gates.gateA.checks.find((c: any) => c.checkId === 'GA-EPISODE-REACHABLE')
    assert.ok(reach.why.includes('c:restated:GF2:GF2-07.a (a possession change begins an attacking episode, never a build-out one)'))
})

test('TEST-ONLY: a condition authored for every score beside the occurrence fails the whole-game clause and is refused at structure', () => {
    const alter = (contracts: LoadedContract[]) => void ((itemOf(contracts, 'restated:RPC-001', 'RPC-001-19.a') as any).scope = 'WHOLE_GAME')
    for (const { block, staged } of a01Blocks(alter)) {
        assert.equal(verdictOf(staged, WHOLE), 'FAIL', block.blockId)
        assert.ok(checkOf(staged).why.includes('authored for every score beside it: c:restated:RPC-001:RPC-001-19.a'), checkOf(staged).why)
    }
    refusedAtStructure(builtWith(alter), 'a whole-game condition')
})

test('the guard: an occurrence not standing on his ruling is refused at validation; with none given it cannot be confirmed', () => {
    const alter = (contracts: LoadedContract[]) => void ((itemOf(contracts, 'provisional:A01-R1', 'A01-R1-V30-1') as any).basis = 'AUTHORED')
    const activity = builtWith(alter)
    assert.equal(activity.stage, 'validation', activity.reasons.join(' | '))
    assert.ok(activity.reasons.some(reason => reason.includes(`the occurrence ${ELEMENT} also counts as the primary event on provisional:A01-R1::A01-R1-V30-1, whose basis is AUTHORED`)), activity.reasons.join(' | '))
    // Read directly: a game holding the element and no support given is not confirmed; a game holding none is unaffected.
    const game = { value: { primaryEvent: { kind: 'K', alsoCounts: [{ elementId: 'TEST-ONLY' }] } } }
    assert.equal(alsoCountsFindings('TEST-ONLY', game, ['K'], undefined).length, 1)
    assert.deepEqual(alsoCountsFindings('TEST-ONLY', game, ['K'], [{ elementId: 'TEST-ONLY', items: [{ contractId: 'c', itemId: 'i', basis: 'OWNER_RULING' }] }]), [])
    assert.deepEqual(alsoCountsFindings('TEST-ONLY', { value: { primaryEvent: { kind: 'K' } } }, ['K'], undefined), [])
})

// ── 5. Everything else ──────────────────────────────────────────────────────────────────────────────────
test('every other goal and the three demonstrations: no clause added and the reason unchanged', () => {
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
        const check = staged.gates?.gateA?.checks?.find((c: any) => c.checkId === CHECK)
        if (!check) continue // halted before Gate A
        assert.deepEqual(check.clauses.map((c: any) => c.clause), EXISTING, label)
        assert.ok(!check.why.includes('also count'), label)
    }
})

test('derived with no role block: the role holder names one team in every block, so what needs that team is owed, never failed', () => {
    const staged: any = runStages0to10(a01Input())
    assert.deepEqual(added(staged).map((c: any) => [c.clause, c.verdict]), [
        [TEAM, 'DEFERRED_TO_REALIZATION'],
        [TRIGGER, 'PASS'],
        [TARGET, 'DEFERRED_TO_REALIZATION'],
        [CONTROL, 'PASS'],
        [ONE, 'DEFERRED_TO_REALIZATION'],
        [EPISODE, 'PASS'],
        [WHOLE, 'PASS'],
    ])
})

console.log(`also-counts.unit.ts — ${passed} passed`)
