/**
 * The goal version's knowledge, recorded from his rulings — Stage F, 26 October 2026 (the design's Stage F; register version 20).
 *
 * Christian, reply filed 26 October 2026, item 1: *"The opposing team may have a different primary scoring event where authorized by the
 * selected context."* Item 2: *"Change "two corresponding target regions, not three" to "two corresponding targets, not three.""* Item 3:
 * *"I approve both statements:"* Item 5: *"The goal should be centered on the building team's end line, facing into the playing area, with
 * its structure outside the playing area."* Item 6: *"Record that the physical goal is defended by the team with the active goalkeeper
 * during that block, and validate this relationship in both blocks."* Item 12: *"The former 5 m target-zone scoring lines should not carry
 * into it."* *"Please keep the existing zone-based activity as the validated alternative."*
 *
 * What is pinned here:
 *   1. the restatements load as ruled: S1's four role-yield markers (ruling C60, each quoting him and saying where) and RPC-001-08.b's note
 *      read per role; the deferral of GF2-08.f with GF2-03.e paired to it (ruling C63); S2 and S3 in the register's words; and a marker
 *      reaches an item only through a ruled restatement - the same rulings without his words write nothing;
 *   2. the context scoring relationship he confirmed, its role, event and rows, the four items it supersedes, and who cites it;
 *   3. A01's record: the goal version first, listed waiting on the two decisions still open (goal suitability, the penalty area), never
 *      tried; the zone version second; the two decisions defined, open and his;
 *   4. A01-R2 composes as its base minus its withdrawals plus its additions, element for element, each addition his words, the protection
 *      link PROVISIONAL with that status stated, the restart bound's binding PROPOSED, and its own realization choices;
 *   5. with goals stated or not, the served activity is the zone version exactly as before, and the account and the review evidence name
 *      the goal version and why it was not tried; it never reaches the realizer;
 *   6. a TEST-ONLY completion of the two open decisions (in memory only) builds A01-R2 through every structural, realization and cross-block
 *      check in both blocks at 12/1, 12/2 and 11/1, stopping only at communication (Stage G): 6+GK v 5 by role, the pressing role scoring
 *      by the goal, the ends exchanged, the goal set out once at the building team's end; and the protection link refuses a goal its
 *      goalkeeper's team attacks, after realization, in both blocks, and a defended-by row that is no specialized performer, before it.
 *
 * Nothing here changes a production file. The TEST-ONLY completion is a copy of the record and of the realizations file, in memory.
 *
 * Run: npx ts-node --files -r tsconfig-paths/register ./src/system/rendering/goal-version-knowledge.unit.ts
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { AUDITS_DIR } from '../derivation/knowledge-root'
import { loadCorpusContracts, loadProvisionalRealizations, loadRegister, PROVISIONAL_REALIZATIONS_FILE, provisionalRealizationNamed, readJson, restatementTally } from '../derivation/corpus'
import { applyNoRowRestatement, ITEM_RESTATEMENTS, pairingRefusal, RestatementTally } from '../derivation/corpus-restatement'
import { ROLE_EVENTS_CLAUSES } from '../derivation/gates'
import { indexRegister } from '../derivation/register'
import { DEFERS_TO_AUTHORIZED_REALIZATION, ROLE_YIELD_KEY } from '../derivation/types'
import { contextScoringRelationships, learningGoalAuthorizations, LearningGoalAuthorization, realizationAlternativesOf, validateLearningGoalAuthorizations } from '../test-library/learning-goal-authorizations'
import { buildActivityForReview, buildActivityUnderAuthorizationRecords, RefusedActivity, ServedActivity } from './build-activity'
import { specializedRoleNames } from './session-envelope'

let passed = 0
function test(name: string, body: () => void): void {
    body()
    passed++
    console.log(`  ok  ${name}`)
}
console.log("the goal version's knowledge (Stage F)")

const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value))
const register = loadRegister()
const index = indexRegister(register)
const KEEPER = specializedRoleNames()[0]
const none = Object.fromEntries(specializedRoleNames().map(role => [role, 0]))
const sessionOf = (players: number, keepers: number, objects?: Record<string, unknown>) => ({ players, lengthM: 40, widthM: 30, durationMin: 20, roles: { ...none, [KEEPER]: keepers }, ...(objects ? { objects } : {}) })
const GOAL = { goal: { count: 1, widthM: 5 } }
const SUPERSEDED = ['restated:GF2::GF2-19', 'restated:GF2::GF2-03.b', 'restated:GF2::GF2-06.a', 'restated:RPC-001::RPC-001-08.a']
const HIS_ITEM_1 = 'The opposing team may have a different primary scoring event where authorized by the selected context.'
const R2 = 'A01-R2'
const OPEN = ['D-GOAL-SUITABILITY', 'D-PENALTY-AREA']
const itemOf = (contractId: string, itemId: string) => loadCorpusContracts().find(c => c.contractId === contractId)!.items.find(i => i.itemId === itemId)! as any
const a01 = (records: LearningGoalAuthorization[] = learningGoalAuthorizations()) => records.find(r => r.learningGoalId === 'A01')!

// ── 1. The restatements ──────────────────────────────────────────────────────────────────────────────────
test('S1 (ruling C60): the four role-yield markers, each on an owner ruling quoting him and saying where; RPC-001-08.b read per role', () => {
    const c60 = ITEM_RESTATEMENTS.filter(r => r.ruling === 'C60')
    assert.deepEqual(c60.map(r => r.item), [...SUPERSEDED, 'restated:RPC-001::RPC-001-08.b'])
    for (const ruling of c60) assert.deepEqual([ruling.words, ruling.citedAs], [HIS_ITEM_1, 'his reply filed 26 October 2026, item 1'], ruling.item)
    for (const key of SUPERSEDED) {
        const [contractId, itemId] = key.split('::')
        const ruling = c60.find(r => r.item === key)!
        assert.deepEqual(Object.keys(ruling.set!), [ROLE_YIELD_KEY], `${key}: the marker and nothing else`)
        assert.equal(itemOf(contractId, itemId)[ROLE_YIELD_KEY], 'AUTHORIZED_ROLE_SCORING', key)
        assert.ok(ruling.why.startsWith('RESTATEMENT S1') || ruling.why.includes('ruling C60'), key)
    }
    // Each item keeps every value it holds: the marker removes nothing.
    assert.deepEqual(itemOf('restated:GF2', 'GF2-19').value, ['line_crossed', 'target_zone_entered'])
    assert.deepEqual(itemOf('restated:RPC-001', 'RPC-001-08.a').value, ['line_crossed', 'target_zone_entered', 'gate', 'target_player'])
    // RPC-001-08.b: only its note changes, read as one primary scoring event per role; the count of one on V0 stands.
    const count = itemOf('restated:RPC-001', 'RPC-001-08.b')
    assert.deepEqual([count.row, count.requirement, count.value, count.basis, count[ROLE_YIELD_KEY]], ['V0', 'COUNT', '1', 'ASSUMED', undefined])
    assert.ok(String(count.fitNote).startsWith('RESTATED 26 October 2026 (ruling C60, restatement S1') && String(count.fitNote).includes('one primary scoring event PER ROLE'))
    // Nothing named in a ruling went missing or was refused.
    assert.ok(!restatementTally.notFound.some(entry => /C6[0-3]|role-yield|defersWith|GF2-08\.f|GF2-03\.e/.test(entry)), restatementTally.notFound.join(' | '))
})

test('a marker reaches an item only through a ruled restatement: the same rulings without his words write nothing', () => {
    const tally = (): RestatementTally => ({ applied: 0, withheld: [], itemsRestated: 0, itemsRemoved: 0, itemsAdded: 0, declarationScopes: 0, declarationsRestated: 0, declarationsAdded: 0, declarationsAddedOnDeclaredRows: 0, notFound: [] })
    // A raw corpus copy, restated by a copy of the ledger in which C60 quotes no one.
    const raw = (loadCorpusContracts() as any[]).map(contract => ({ ...contract, items: contract.items.map((item: any) => { const { [ROLE_YIELD_KEY]: _marker, ...rest } = item; return rest }) }))
    const unquoted = ITEM_RESTATEMENTS.filter(r => r.ruling === 'C60' && r.set && ROLE_YIELD_KEY in r.set).map(r => ({ ...r, words: undefined, citedAs: undefined }))
    const t = tally()
    const restated = applyNoRowRestatement(raw as any, t, unquoted, [])
    for (const key of SUPERSEDED) {
        const [contractId, itemId] = key.split('::')
        assert.equal((restated.find(c => c.contractId === contractId)!.items.find(i => i.itemId === itemId) as any)[ROLE_YIELD_KEY], undefined, key)
    }
    assert.equal(t.notFound.filter(entry => entry.includes('the role-yield marker is written only on an owner ruling that quotes his words and says where')).length, 4)
    // As ruled (his words, where he said them), the same four land.
    const ruled = applyNoRowRestatement(raw as any, tally(), ITEM_RESTATEMENTS.filter(r => r.ruling === 'C60' && r.set && ROLE_YIELD_KEY in r.set), [])
    for (const key of SUPERSEDED) {
        const [contractId, itemId] = key.split('::')
        assert.equal((ruled.find(c => c.contractId === contractId)!.items.find(i => i.itemId === itemId) as any)[ROLE_YIELD_KEY], 'AUTHORIZED_ROLE_SCORING', key)
    }
})

test('ruling C63: GF2-08.f defers to an authorized realization, GF2-03.e paired to it; S2 and S3 in the register and the ledger', () => {
    const reference = itemOf('restated:GF2', 'GF2-08.f')
    const region = itemOf('restated:GF2', 'GF2-03.e')
    assert.equal(reference.defersTo, DEFERS_TO_AUTHORIZED_REALIZATION)
    assert.ok(String(reference.defersToNote).startsWith('RULED 26 October 2026 (C63)'))
    assert.equal(region.defersWith, 'GF2-08.f')
    const gf2 = loadCorpusContracts().find(c => c.contractId === 'restated:GF2')!
    assert.equal(pairingRefusal('restated:GF2::GF2-03.e', region, gf2.items), null, 'the pairing stands beside the deferral it names')
    // Their other fields are C42's, untouched: the same selector, reference and value.
    assert.deepEqual([reference.row, reference.selector, reference.value.structuralRef], ['J2', 'role=PRIMARY_SCORING & team=TEAM_AT_AXIS_END', { contractId: 'restated:GF2', itemId: 'GF2-03.e' }])
    // S2 (ruling C61): C42's words restated where they are quoted.
    const s2 = 'Change "two corresponding target regions, not three" to "two corresponding targets, not three."'
    const targetOfValues = String(register.rows.find((row: any) => row.id === 'S2').targetOfValues)
    assert.ok(targetOfValues.includes(`"${s2}"`) && targetOfValues.includes('ruling C61'))
    const ledger = readJson('stage-b/corpus-restatements.json')
    assert.ok(String(ledger.items.find((r: any) => r.item === 'restated:GF2::GF2-03.a').why).includes(`RESTATED 26 October 2026 by ruling C61 (restatement S2 of the note sent to him), his reply filed 26 October 2026, item 2: "${s2}"`))
    // S3 (ruling C62): the two statements he approved word for word, in the glosses the fixed ends lived in.
    for (const statement of ['Team-end assignments may change between coach-controlled blocks when the authorized activity configuration requires it.', 'Within a block, each team keeps its end and direction, regardless of possession changes.']) {
        assert.ok(register.teamDesignations.list.find((entry: string) => entry.startsWith('TEAM_AT_AXIS_START ')).includes(`"${statement}"`), statement)
        assert.ok(String(register.rows.find((row: any) => row.id === 'B10').note).includes(`"${statement}"`), statement)
    }
    assert.ok(String(register.rows.find((row: any) => row.id === 'B1').valueType).includes('RESTATED by ruling C62'))
})

// ── 2. The scoring relationship ──────────────────────────────────────────────────────────────────────────
test('the context scoring relationship he confirmed: one role, one event, two rows, the four items it supersedes, cited by A01-R2 alone', () => {
    const [relationship, ...others] = contextScoringRelationships()
    assert.equal(others.length, 0)
    assert.deepEqual(
        [relationship.id, relationship.category, relationship.contextId, relationship.scoringEvent, relationship.role, relationship.rows, relationship.status, relationship.confirmedBy, relationship.confirmedOn],
        ['RPC-001~SCORING-goal', 'CONTEXT_SCORING_RELATIONSHIP', 'RPC-001', 'goal', 'PRESSING', ['B9', 'J2'], 'CONFIRMED', 'Christian', '2026-10-26'],
    )
    assert.deepEqual(relationship.supersedes, SUPERSEDED)
    assert.equal(relationship.citedAs, 'his reply filed 26 October 2026, item 1; his reply filed 25 October 2026, items 2 and 3')
    assert.ok(relationship.words.includes(HIS_ITEM_1) && relationship.words.includes('Pressing team: Scoring in the goalkeeper-protected physical goal.'))
    assert.ok(relationship.words.includes('I approve a goalkeeper-protected physical goal as an authorized alternative to the pressing team\'s 5 m target zone within the Goalkeeper Build-Out context.'))
    // Every item it supersedes carries the marker - the two keys of clause 6, both in place.
    for (const key of relationship.supersedes!) assert.equal(itemOf(key.split('::')[0], key.split('::')[1])[ROLE_YIELD_KEY], 'AUTHORIZED_ROLE_SCORING', key)
    // Own goals are read by the event's meaning, his items 10 and 11 quoted; no row is added.
    assert.ok(String(relationship.note).includes('"I agree that an own goal against the building team counts for the pressing team in the goal-based realization."') && String(relationship.note).includes('"Own goals: Apply the normal soccer rule."'))
    // Cited by the goal version's pressing event and objective reference, and by nothing of the zone version.
    const citing = loadProvisionalRealizations().flatMap(r => r.items.filter(i => i.authorizedBy === relationship.id).map(i => `${r.provisionalId}::${i.itemId}`))
    assert.deepEqual(citing, [`${R2}::${R2}-J2-1`, `${R2}::${R2}-B9-1`])
})

// ── 3. The record ────────────────────────────────────────────────────────────────────────────────────────
test("A01's record: the goal version first, listed waiting on the two open decisions and never tried; the zone version second", () => {
    const record = a01()
    assert.equal(record.provisionalRealization, undefined, 'one way of naming realizations: the list')
    assert.deepEqual(realizationAlternativesOf(record).map(a => [a.realization, a.selectable, a.status, a.gaps, a.citedAs]), [
        [R2, false, 'MISSING_KNOWLEDGE', OPEN, 'his reply filed 25 October 2026, item 3'],
        ['A01-R1', true, null, [], 'his reply filed 25 October 2026, item 4'],
    ])
    const gaps = OPEN.map(id => record.gaps!.find(gap => gap.id === id)!)
    for (const gap of gaps) {
        assert.equal(gap.kind, 'DECISION')
        assert.equal(gap.settledBy, undefined, `${gap.id} is open: no words of his settle it`)
        assert.ok(gap.note!.startsWith('OPEN, his (added 26 October 2026, Stage F).'), gap.id)
    }
    assert.ok(gaps[0].note!.includes('"However, the presence of a full-size goal should not automatically establish its suitability for every playing area."'))
    assert.ok(gaps[1].note!.includes('"Please investigate the smallest reusable method for representing an authorized penalty area, including its geometry and relationship to the goal and playing space. Do not assume a scaled dimension without knowledge support."'))
    // Settling either while the goal version waits on it is refused, as for an entry.
    for (const id of OPEN) {
        const damaged = learningGoalAuthorizations()
        a01(damaged).gaps!.find(gap => gap.id === id)!.settledBy = [{ words: 'TEST-ONLY', citedAs: 'TEST-ONLY' }]
        assert.ok(validateLearningGoalAuthorizations(damaged).some(error => error.includes(`the gap ${id} is marked settled, and the alternative realization ${R2} still waits on it`)), id)
    }
    // His provisional choices that described the zone are scoped to it, in his words.
    assert.ok(record.provisionalChoices![3].note!.includes('SUPERSEDED FOR THE GOAL VERSION, 26 October 2026 (Stage F)'))
    assert.ok(record.provisionalChoices![6].note!.includes('"The existing automatic controlled-regain score inside the 5 m zone does not carry into this version."'))
})

// ── 4. A01-R2, composed ──────────────────────────────────────────────────────────────────────────────────
const WITHDRAWN = ['A01-R1-S5-3', 'A01-R1-S5-4', 'A01-R1-V27-1', 'A01-R1-V29-1', 'A01-R1-V30-1', 'A01-R1-V31-1', 'A01-R1-T4-4', 'A01-R1-B8-2']
const ADDED = ['O1-1', 'O4-1', 'O5-1', 'O6-1', 'O7-1', 'J2-1', 'B9-1', 'B10-1', 'B8-2', 'T4-5'].map(id => `${R2}-${id}`)

test('A01-R2 is A01-R1 minus its withdrawals plus its additions, element for element, its references re-pointed to it', () => {
    const base = provisionalRealizationNamed('A01-R1')!
    const variant = provisionalRealizationNamed(R2)!
    const raw = readJson(PROVISIONAL_REALIZATIONS_FILE).realizations.find((r: any) => r.id === R2)
    const repoint = (value: unknown) => JSON.parse(JSON.stringify(value).split('"contractId":"provisional:A01-R1"').join(`"contractId":"provisional:${R2}"`))
    assert.deepEqual(variant.items, [...base.items.filter(i => !WITHDRAWN.includes(i.itemId)).map(repoint), ...raw.items.map(({ id, ...rest }: any) => ({ itemId: id, ...rest }))])
    assert.equal(variant.items.length, base.items.length - WITHDRAWN.length + ADDED.length)
    assert.deepEqual([variant.basedOn, variant.withdrawn!.map(w => w.itemId), raw.items.map((i: any) => i.id)], ['A01-R1', WITHDRAWN, ADDED])
    assert.ok(variant.withdrawn!.every(w => /his reply filed 2[56] October 2026/.test(w.because)), 'each withdrawal says why, in his words')
    assert.ok(!JSON.stringify(variant.items).includes('"contractId":"provisional:A01-R1"'))
    // Every addition is his choice for this activity, in his words of 25 or 26 October.
    for (const item of raw.items) {
        assert.deepEqual([item.category, item.basis], ['PROVISIONAL_REALIZATION_CHOICE', 'OWNER_RULING'], item.id)
        assert.match(item.citedAs, /^his reply filed 2[56] October 2026, item \d+$/, item.id)
    }
    const byId = new Map(variant.items.map(item => [item.itemId, item as any]))
    // The goal: on the building team's end line, centred, facing in, no depth, defended by the goalkeeper's team.
    assert.deepEqual([byId.get(`${R2}-O4-1`).value.term, byId.get(`${R2}-O4-1`).value.forTeam, byId.get(`${R2}-O4-1`).value.offsetM], ['own end (of team T)', 'ROLE_HOLDER_BUILDING', { from: 0, to: 0 }])
    assert.equal(byId.get(`${R2}-O5-1`).value.term, 'central')
    assert.equal(byId.get(`${R2}-O6-1`).value, 'INTO_THE_AREA')
    const protection = byId.get(`${R2}-O7-1`)
    assert.deepEqual([protection.row, protection.value, protection.authorizedBy], ['O7', 'P3', undefined])
    assert.ok(protection.choice.startsWith('PROVISIONAL (his item 6)') && protection.fitNote.startsWith('STATUS: PROVISIONAL, by his item 6'), 'the provisional status is stated, never silent')
    // The pressing role scores by the goal, its objective referencing it, each citing the relationship; the ends exchanged.
    assert.deepEqual([byId.get(`${R2}-B9-1`).value, byId.get(`${R2}-B9-1`).authorizedBy], ['goal', 'RPC-001~SCORING-goal'])
    assert.deepEqual([byId.get(`${R2}-J2-1`).value.structuralRef, byId.get(`${R2}-J2-1`).authorizedBy], [{ contractId: `provisional:${R2}`, itemId: `${R2}-O1-1` }, 'RPC-001~SCORING-goal'])
    assert.equal(byId.get(`${R2}-B10-1`).value, 'EXCHANGED')
    // The restart bound: his words, the binding PROPOSED.
    const bound = byId.get(`${R2}-T4-5`)
    assert.equal(bound.words, 'This flexibility should operate within the authorized deep starting environment, rather than permit arbitrary locations anywhere on the field.')
    assert.ok(bound.fitNote.includes('THE BINDING IS PROPOSED, NOT RULED') && !JSON.stringify(bound.value).includes('structuralRef'))
    // No suitability is stated and none is invented; the testing boundaries are A01-R1's.
    assert.equal(variant.objectSuitability, undefined)
    assert.deepEqual([variant.testingBoundaries!.players, variant.testingBoundaries!.areas], [base.testingBoundaries!.players, base.testingBoundaries!.areas])
    // Nothing for a penalty area, a handling region or a handling rule (his item 7 open), and no regain score.
    assert.ok(!variant.items.some(item => ['V27', 'V29', 'V30', 'V31'].includes(String(item.row))))
    assert.ok(!variant.items.some(item => item.row === 'S5' && String(item.selector).includes('ROLE_HOLDER_PRESSING')))
})

test("A01-R2's realization choices: A01-R1's re-pointed, the game form's noun for the yielding region withdrawn, his item 8 as the restart bound", () => {
    const variant = provisionalRealizationNamed(R2)!
    assert.equal(variant.realizationChoices, 'realization-choices-a01-r2.json')
    const choices = JSON.parse(fs.readFileSync(path.join(AUDITS_DIR, 'realization-choices-a01-r2.json'), 'utf8')).choices as any[]
    assert.deepEqual(choices.map(c => [c.lineId, c.withdraws ?? c.replaces ?? null]), [
        ['c:restated:GF2:GF2-03.e::S3', 'a04-realization-choices.json'],
        ['c:restated:GF2:GF2-03.f::S3', 'a04-realization-choices.json'],
        ['game::V1', 'a04-realization-choices.json'],
        [`c:provisional:${R2}:A01-R1-T1-1::T4`, null],
        [`c:provisional:${R2}:A01-R1-T1-2::T4`, null],
        [`c:provisional:${R2}:A01-R1-T1-3::T4`, null],
        [`c:provisional:${R2}:A01-R1-T1-6::T4`, null],
        [`c:provisional:${R2}:A01-R1-T1-7::T4`, null],
        [`c:provisional:${R2}:A01-R1-T1-6::T5`, null],
        [`c:provisional:${R2}:A01-R1-T1-7::T5`, null],
        ['game::PS1', 'a04-realization-choices.json'],
    ])
    assert.equal(choices[0].value, undefined, 'a withdrawal carries no value')
    assert.deepEqual([choices[1].value, choices[2].value], ['zone', 'target_zone_entered'])
    for (const c of choices.slice(3, 6)) assert.equal(c.value.coachDecides, 'consistent with the intended build-out situation, within the authorized deep starting environment')
    assert.ok(!JSON.stringify(choices).includes('target zone"') && !JSON.stringify(choices).includes('post-regain area,'), 'no stand-in names the area the goal version does not hold')
})

// ── 5. Listed, never tried ───────────────────────────────────────────────────────────────────────────────
const outcomesOf = (activity: any) => (activity.account.realizationSelection as any[]).map(entry => [entry.realization, entry.outcome, entry.cause, entry.gaps])
const NOT_TRIED = [R2, 'NOT_SELECTABLE', 'MISSING_KNOWLEDGE', OPEN]

test('with goals stated or not, the zone version is served exactly as before, and the account and evidence name the goal version and why', () => {
    for (const [players, keepers] of [[12, 1], [12, 2], [11, 1]]) {
        const plain = buildActivityForReview({ kind: 'learning-goal', goalId: 'A01', situationId: null, session: sessionOf(players, keepers) } as any, { includeDrafts: true }) as ServedActivity
        assert.equal(plain.outcome, 'served', `${players}/${keepers}`)
        assert.deepEqual(outcomesOf(plain), [NOT_TRIED, ['A01-R1', 'SELECTED', null, []]], `${players}/${keepers}`)
        const fact = plain.evidence!.pathway.facts[plain.evidence!.pathway.facts.length - 1]
        assert.equal(fact.value[0], `${R2}: NOT_SELECTABLE (MISSING_KNOWLEDGE); waits on ${OPEN.join(', ')}; its place in the order: his reply filed 25 October 2026, item 3`)
        for (const objects of [{ goal: { count: 0 } }, GOAL]) {
            const stated = buildActivityForReview({ kind: 'learning-goal', goalId: 'A01', situationId: null, session: sessionOf(players, keepers, objects) } as any, { includeDrafts: true }) as ServedActivity
            assert.equal(stated.outcome, 'served', `${players}/${keepers} ${JSON.stringify(objects)}`)
            for (const key of ['rendered', 'overview', 'diagram', 'roleBlocks', 'integrity', 'account', 'title', 'subtitle'] as const) assert.deepEqual(stated[key], plain[key], `${players}/${keepers} ${JSON.stringify(objects)}: ${key}`)
        }
    }
    // The goal version never reaches the realizer: only A01-R1's choices are read.
    const seen: string[] = []
    const built = buildActivityUnderAuthorizationRecords({ kind: 'learning-goal', goalId: 'A01', situationId: null, session: sessionOf(12, 1, GOAL) } as any, learningGoalAuthorizations(), { alterSupplied: (_supplied, realization) => void seen.push(realization?.provisionalId ?? 'none') })
    assert.equal(built.activity.outcome, 'served')
    assert.ok(seen.length > 0 && seen.every(id => id === 'A01-R1'), seen.join(', '))
    for (const block of (built.fixture as any).roleBlocks.blocks as any[]) assert.ok(!(block.fixture.game.objects as any[]).some(object => object.kind === 'goal'), 'no goal is added to the zone version')
})

// ── 6. The TEST-ONLY completion of the two open decisions ────────────────────────────────────────────────
/** TEST-ONLY, in memory: the record lists the goal version as one that can be tried, and its goal a suitability; nothing else changes. */
const completed = (alter: (variant: any) => void = () => undefined) => {
    const records = learningGoalAuthorizations()
    const record = a01(records) as any
    record.realizations = record.realizations.map((entry: any) => (entry.realization === R2 ? { realization: entry.realization, words: entry.words, citedAs: entry.citedAs } : entry))
    const file = readJson(PROVISIONAL_REALIZATIONS_FILE)
    const variant = file.realizations.find((r: any) => r.id === R2)
    variant.objectSuitability = [{ kind: 'goal', widthM: { min: 1, max: 10 }, ruledOn: 'TEST-ONLY', by: 'TEST-ONLY', citedAs: 'TEST-ONLY', words: ['TEST-ONLY'] }]
    alter(variant)
    return { records, realizations: loadProvisionalRealizations(file) }
}
const buildCompleted = (players: number, keepers: number, alter?: (variant: any) => void) => {
    const { records, realizations } = completed(alter)
    return buildActivityUnderAuthorizationRecords({ kind: 'learning-goal', goalId: 'A01', situationId: null, session: sessionOf(players, keepers, GOAL) } as any, records, { realizations, review: { includeDrafts: true } })
}
/** A reason that is not a communication-stage one: anything structural, from realization, from validation or from the cross-block checks. */
const STRUCTURAL = /Gate A|GA-[A-Z-]+|realization refused|post-realization|RB-[0-9ML]|cross-block|does not list this line as open/

test('completed in memory, A01-R2 passes every structural, realization and cross-block check in both blocks at 12/1, 12/2 and 11/1, stopping only at communication', () => {
    for (const [players, keepers] of [[12, 1], [12, 2], [11, 1]]) {
        const label = `${players}/${keepers}`
        const built = buildCompleted(players, keepers)
        const refused = built.activity as RefusedActivity
        assert.deepEqual([refused.outcome, refused.stage], ['refused', 'communication'], `${label}: ${refused.reasons?.join(' | ')}`)
        assert.deepEqual(outcomesOf(refused), [[R2, 'REFUSED', null, []], ['A01-R1', 'NOT_TRIED', null, []]], label)
        assert.deepEqual(refused.reasons.filter(reason => STRUCTURAL.test(reason)), [], `${label}: nothing structural`)
        assert.ok(refused.reasons.every(reason => /awaiting approved wording|fidelity Q[0-9]/.test(reason)), `${label}: ${refused.reasons.filter(reason => !/awaiting approved wording|fidelity Q[0-9]/.test(reason)).join(' | ')}`)
        // Both blocks were built and checked: each says only what it still cannot say.
        const blocks = (built.fixture as any).roleBlocks.blocks as any[]
        assert.equal(blocks.length, 2, label)
        for (const block of blocks) assert.ok(refused.reasons.some(reason => reason.startsWith(`block ${block.blockId}: `)), `${label}: ${block.blockId}`)
        // In each block: the building team holds the goalkeeper (6 + GK v 5 at 12 players, 5 + GK v 5 at 11), the pressing role scores by
        // the goal, the goal stands at the axis-start end line - the building team's - centred, defended by the goalkeeper's row.
        const ownEnds: string[] = []
        for (const block of blocks) {
            const game = block.fixture.game
            const building = block.fixture.record.roleBlock.holders.BUILDING
            const handle = (block.fixture.record.designationBindings as any[]).find(binding => binding.designation === building).handle
            ownEnds.push(handle)
            const teams = game.performers.teams as any[]
            assert.deepEqual(teams.map(team => [team.elementId === handle, team.outfieldCount, team.goalkeeper]).sort(), [[false, 5, 0], [true, players - 6, 1]].sort(), `${label} ${block.blockId}: counts by role`)
            assert.deepEqual((game.activityRoles as any[]).map(role => [role.activityRole, role.scoresBy ?? null]), [['BUILDING', null], ['PRESSING', 'goal']])
            const [goal] = (game.objects as any[]).filter(object => object.kind === 'goal')
            assert.deepEqual([goal.defendedBy, goal.facing], ['P3', 'INTO_THE_AREA'])
            assert.deepEqual([goal.realizedGeometry.position.along.interval, goal.realizedGeometry.position.across.interval], [{ from: 0, to: 0 }, { from: 12.5, to: 17.5 }])
        }
        // The teams change ends: a different team builds from the same end in each block.
        assert.notEqual(ownEnds[0], ownEnds[1], `${label}: the ends are exchanged`)
        assert.deepEqual(blocks.map(block => block.fixture.record.roleBlock.ends ?? null)[1], { TEAM_AT_AXIS_START: 'TEAM_AT_AXIS_END', TEAM_AT_AXIS_END: 'TEAM_AT_AXIS_START' })
        // The goal is set out once, at one place in both blocks (it stays when the teams change ends).
        const layout = blocks[0].fixture.layout.objects as any[]
        assert.deepEqual(layout.map(object => [object.objectId, object.along, object.across, object.sources.length]), [[`c:provisional:${R2}:${R2}-O1-1`, { from: 0, to: 0 }, { from: 12.5, to: 17.5 }, 2]], label)
    }
})

test('the protection link is validated in both blocks: a goal its goalkeeper\'s team attacks is refused after realization, a row that is no specialized performer before it', () => {
    const clause = ROLE_EVENTS_CLAUSES.DEFENDED
    // TEST-ONLY: the goalkeeper with the pressing team (A01-R1-P3-1 withdrawn, a P3 item for the pressing role in its place).
    const pressing = buildCompleted(12, 1, variant => {
        variant.withdraws.push({ item: 'A01-R1-P3-1', because: 'TEST-ONLY' })
        variant.items.push({ ...variant.items.find((i: any) => i.id === `${R2}-O7-1`), id: `${R2}-TEST-P3`, row: 'P3', selector: 'team=ROLE_HOLDER_PRESSING', requirement: 'EQUALS', value: '1', scope: 'PER_TEAM' })
    }).activity as RefusedActivity
    assert.deepEqual([pressing.outcome, pressing.stage], ['refused', 'validation'])
    const blocks = [...new Set(pressing.reasons.filter(reason => reason.includes(`GA-ROLE-EVENTS — "${clause}": FAIL`)).map(reason => reason.split(': ')[0]))]
    assert.equal(blocks.length, 2, `refused in both blocks: ${pressing.reasons.join(' | ')}`)
    assert.ok(pressing.reasons.some(reason => reason.includes('attacks it (')), 'the team holding the goalkeeper attacks the goal it would defend')
    // TEST-ONLY: the defended-by row naming the outfield count, which is no specialized performer row - refused at structure.
    const outfield = buildCompleted(12, 1, variant => void (variant.items.find((i: any) => i.id === `${R2}-O7-1`).value = 'P2')).activity as RefusedActivity
    assert.deepEqual([outfield.outcome, outfield.stage], ['refused', 'structure'])
    assert.equal(outfield.reasons.filter(reason => reason.endsWith('a pre-realization Gate A invariant fails: GA-ROLE-EVENTS')).length, 2)
    // TEST-ONLY: the ends kept - the second block's pressing role would attack the zone at the other end with a goal event - refused at structure.
    const kept = buildCompleted(12, 1, variant => void (variant.items = variant.items.filter((i: any) => i.row !== 'B10'))).activity as RefusedActivity
    assert.deepEqual([kept.outcome, kept.stage], ['refused', 'structure'])
    assert.ok(kept.reasons.some(reason => reason.endsWith('GA-ROLE-EVENTS')))
})

test('the register carries the protection link as data: row O7, its applicability and the role-scoring block naming it', () => {
    const row = index.rows.get('O7')!
    assert.deepEqual([row.path, row.ownerRow, row.kind], ['objects[].defendedBy', 'O1', 'FIELD'])
    assert.deepEqual(index.applicability.get('O7'), { selectorAttribute: 'kind', sameElement: true, notIn: ['ball'] })
    assert.equal(index.roleScoring!.defendedByRow, 'O7')
    assert.ok(String((row as any).note).includes('PROVISIONAL, and labelled so wherever it is written'))
    const damaged = copy(register)
    damaged.roleScoring.defendedByRow = 'J2'
    assert.throws(() => indexRegister(damaged), /roleScoring\.defendedByRow J2 is not a FIELD row owned by the object target row O1/)
    const without = copy(register)
    delete without.roleScoring.defendedByRow
    assert.equal(indexRegister(without).roleScoring!.defendedByRow, null)
})

console.log(`goal-version-knowledge.unit.ts — ${passed} passed`)
