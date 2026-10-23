/**
 * One primary scoring event per role — stage A, 22 October 2026 (register version 16: row B9 `activityRoles[].scoresBy` and the
 * `roleScoring` block; the restatement loader's role-yield marker; GA-ROLE-EVENTS, the twenty-first Gate A check; the one kind reader
 * `eventKindOf`; the per-role "how"; the context-scoring guard's per-role clause; RB-1's roles row; the relationship feed; the deferral
 * tightening).
 *
 * Christian, reply filed 25 October 2026, item 2: *"I approve extending the September 15 decision to support one primary scoring event per
 * role in an asymmetric activity, rather than requiring both teams to use the same scoring event type."* *"Please implement this as a
 * general role-specific scoring capability, preserving structural validation and knowledge authorization."* *"The engine should verify
 * that the objectives are coherent and compatible rather than simply allow any combination of scoring events."* *"This authorization is
 * not a request to introduce arbitrary multiple scoring events for every team or activity."*
 *
 * What is pinned here:
 *   1. the register holds the rows as data, in one versions entry quoting him, and a damaged copy halts H1;
 *   2. the restatement loader writes only keys the engine knows, and the role-yield marker only on an owner ruling, from its closed list;
 *   3. GA-ROLE-EVENTS on production A01, before realization and on every served subject after it (clause 4 measured), and each clause
 *      refusing its own violation on TEST-ONLY copies;
 *   4. a role's event outside a REQUIRED permitted set, or a target's type outside one, is refused without the marker and the relationship
 *      naming the item, and stands with TEST-ONLY ones (clause 6);
 *   5. C56 still defers, and the deferral now needs the same teams: a reference keyed to the other end does not make an end-keyed item defer;
 *   6. the relationship feed passes every recorded kind, and the validator holds them all;
 *   7. THE CONSUMER: a TEST-ONLY game whose building role scores line_crossed at a line and whose pressing role scores target_zone_entered at
 *      a zone (both inside the possession game's permitted sets) changes How to score, the fixture and the review evidence;
 *   8. a kind with no wording is withheld and fidelity refuses it, never given the line wording; the guard's per-role clause;
 *   9. the grep ratchet (only `eventKindOf` reads the primary event's kind) and the no-exception ratchet (no engine file gains a scoring kind,
 *      a role, a sport noun or a knowledge id).
 *
 * The stage A review fixes (22-23 October 2026), each pinned beside the part it fixes: the event a relationship confirms is the one a role
 * may score by, for the one role it is confirmed for (clause 6, `applyRoleYields`, and the records' validator); the marker reaches an item
 * only through a ruled item restatement (added, authored, provisional and Sport Profile items refused); an event written for a role the
 * game does not hold, or for a set of roles, is refused (clause 12); an unsettled objective in a game without roles is owed (clauses 4 and
 * 6); a single required event is a permitted set of one, and a typed exclusion on the event row reaches a role's own event (clause 6); an
 * event the context does not approve stands only on a confirmed scoring relationship (the guard); an adjustment rests on a manipulation
 * relationship only; the provenance-note keys are the ledger's.
 *
 * TEST-ONLY copies are labelled; production files are never written. Nothing here is served, and nothing is knowledge for the goal version.
 *
 * Run: npx ts-node --files -r tsconfig-paths/register ./src/system/derivation/role-events.unit.ts
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { reviewActivity } from '../rendering/activity-review'
import { buildActivityUnderAuthorizationRecords, buildActivityWithFixture, RefusedActivity, ServedActivity } from '../rendering/build-activity'
import { roleEventFindings } from '../rendering/context-scoring-guard'
import { checkFidelity } from '../rendering/fidelity'
import { eventKindOf, eventKindPathsOf } from '../rendering/game-reading'
import { renderConcreteGame, scoringWordingOf } from '../rendering/render-concrete-game'
import { specializedRoleNames } from '../rendering/session-envelope'
import { ContextScoringRelationship, contextManipulationRelationships, contextRelationships, contextScoringRelationships, learningGoalAuthorizations, validateContextManipulationRelationships } from '../test-library/learning-goal-authorizations'
import { loadProvisionalRealizations, loadRegister, loadSportProfile, PROVISIONAL_REALIZATIONS_FILE, readJson, restatementTally } from './corpus'
import { applyNoRowRestatement, ItemRestatement, itemRestatementRefusal, ITEM_RESTATEMENTS, ITEM_RESTATEMENT_KEYS, PROVENANCE_NOTE_KEYS, provenanceNoteKeysOf, restateDeclaration, RestatementTally } from './corpus-restatement'
import { runStages0to10, runStages0to5 } from './engine'
import { ROLE_EVENTS_CHECK, ROLE_EVENTS_CLAUSES } from './gates'
import { applyRealizationDeferrals, applyRoleYields, AuthorizingRelationship } from './realization-deferral'
import { HaltError, indexRegister } from './register'
import { roleBlocksOf } from './role-blocks'
import { derivationInputFor, selectFor } from './run-bounded-selection'
import { DerivationInput, LoadedContract, ROLE_YIELD_KEY, ROLE_YIELD_MARKERS, RoleBlock } from './types'

let passed = 0
function test(name: string, body: () => void): void {
    body()
    passed++
    console.log(`  ok  ${name}`)
}

console.log('one primary scoring event per role (stage A, register version 16)')

const register = loadRegister()
const index = indexRegister(register)
const C = ROLE_EVENTS_CLAUSES
const BLOCK_X = 'BUILDING=TEAM_AT_AXIS_START,PRESSING=TEAM_AT_AXIS_END'
const KEEPER = specializedRoleNames()[0]
const sessionOf = (players = 12, keepers = 1) => ({ players, lengthM: 40, widthM: 30, durationMin: 20, roles: { ...Object.fromEntries(specializedRoleNames().map(r => [r, 0])), [KEEPER]: keepers } })
const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const HIS_ITEM_2 = [
    'I approve extending the September 15 decision to support one primary scoring event per role in an asymmetric activity, rather than requiring both teams to use the same scoring event type.',
    'Please implement this as a general role-specific scoring capability, preserving structural validation and knowledge authorization.',
    'The engine should verify that the objectives are coherent and compatible rather than simply allow any combination of scoring events.',
    'This authorization is not a request to introduce arbitrary multiple scoring events for every team or activity.',
]
const PROVISIONAL = 'provisional:A01-R1'
const GF2 = 'restated:GF2'
const RPC = 'restated:RPC-001'
/** TEST-ONLY items, never production data. */
const testItem = (itemId: string, row: string, selector: string, requirement: string, value: unknown, extra: Record<string, unknown> = {}) => ({
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
    ...extra,
})
const contractOf = (contracts: LoadedContract[], id: string) => contracts.find(c => c.contractId === id)!
const itemOf = (contracts: LoadedContract[], contractId: string, itemId: string) => contractOf(contracts, contractId).items.find(i => i.itemId === itemId)!
/** The occurrence that also counts is for a team scoring by the primary event (clause 11), so a copy giving the pressing role an event of its own takes it out. */
const withoutAlsoCounts = (contracts: LoadedContract[]) => {
    const p = contractOf(contracts, PROVISIONAL)
    p.items = p.items.filter(i => !/^A01-R1-V(27|29|30|31)-1$/.test(i.itemId))
}

/** A01 as derivation receives it: a TEST-ONLY alteration of a copy, then the deferral and the role yields with the given relationships. */
const a01Input = (alter: (contracts: LoadedContract[]) => void = () => undefined, relationships: AuthorizingRelationship[] = contextRelationships(), registerCopy?: any): DerivationInput => {
    const input: any = { ...derivationInputFor(selectFor('A01', null)), envelope: sessionOf() }
    if (registerCopy) input.register = registerCopy
    input.contracts = copy(input.contracts)
    alter(input.contracts)
    const regIndex = indexRegister(input.register)
    input.contracts = applyRoleYields(applyRealizationDeferrals(input.contracts, relationships, regIndex).contracts, relationships, regIndex)
    return input
}
const a01Blocks = (input: DerivationInput): { block: RoleBlock; staged: any }[] => {
    const base: any = runStages0to5(input)
    const found: any = roleBlocksOf(base.classes, base.derived.lines, indexRegister(input.register))
    assert.equal(found?.kind, 'BLOCKS', JSON.stringify(found?.why ?? found))
    return (found.blocks as RoleBlock[]).map(block => ({ block, staged: runStages0to10({ ...input, roleBlock: block }) as any }))
}
const checkOf = (staged: any) => staged.gates.gateA.checks.find((c: any) => c.checkId === ROLE_EVENTS_CHECK)
const verdictOf = (staged: any, clause: string) => checkOf(staged).clauses.find((c: any) => c.clause === clause)?.verdict
const blockX = (input: DerivationInput) => a01Blocks(input).find(entry => entry.block.blockId === BLOCK_X)!.staged

// ── 1. The register ─────────────────────────────────────────────────────────────────────────────────────
test('register version 16 holds the rows as data, in one versions entry quoting him', () => {
    const full = String(register.version)
    assert.ok(full.startsWith('16, adds one primary scoring event per role, for his reply filed 25 October 2026, item 2'))
    for (const quote of HIS_ITEM_2) {
        assert.ok(full.split('Supersedes version 15, ')[0].includes(`"${quote}"`), quote)
        assert.ok(String(register.roleScoring.note).includes(`"${quote}"`), `the block's note quotes it too: ${quote}`)
    }
    assert.equal(full.split('Supersedes version 15, which adds which participant a value names').length - 1, 1, 'version 15 superseded once')
    assert.ok(!full.includes('Supersedes version 16'), 'version 16 is the current entry')
    const b9 = index.rows.get('B9')!
    assert.deepEqual([b9.path, b9.ownerRow, b9.kind, b9.earnsValueOf], ['activityRoles[].scoresBy', 'B1', 'FIELD', 'V2'])
    const spec = index.roleScoring!
    assert.deepEqual(
        [spec.eventRow, spec.kindRow, spec.valueRow, spec.conditionsRow, spec.valueModifiersRow, spec.alsoCountsRow, spec.creditRow, spec.kindVocabulary, spec.eventLeaf, spec.creditLeaf],
        ['B9', 'V1', 'V2', 'V3', 'V7', 'V27', 'B8', 'V1.kind', 'scoresBy', 'creditedWithin'],
    )
    assert.deepEqual(spec.kinds, index.vocabularies.get('V1.kind'), 'the closed list is V1\'s vocabulary, not a copy of it')
    assert.deepEqual(spec.targets, { region: { row: 'S2', typeRow: 'S3' }, object: { row: 'O1', typeRow: 'O2' } })
    assert.deepEqual(spec.targetFunction, { attribute: 'functions', value: 'objective-area' })
    assert.deepEqual(Object.fromEntries(spec.targetTypes), {
        line_crossed: [{ target: 'object', type: 'line' }, { target: 'region', type: 'line' }],
        target_zone_entered: [{ target: 'region', type: null }],
        goal: [{ target: 'object', type: 'goal' }],
        gate: [{ target: 'object', type: 'gate' }],
    })
    assert.equal(register.roleScoring.targetTypes.basis, 'OUR_INTERPRETATION', 'the map is our reading, labelled so')
    assert.deepEqual(spec.roleYield, { key: ROLE_YIELD_KEY, values: [...ROLE_YIELD_MARKERS] })
    // The glosses beside SD-06, V3 and V27 cite his item 2; SD-06's decision itself is unchanged (V0 exactly one element).
    const sd06 = register.citableStandingDecisions.find((d: any) => d.id === 'SD-06')
    assert.deepEqual(sd06.item, { row: 'V0', requirement: 'COUNT', value: 1, relation: 'ENTAILS existence of exactly one primary event' })
    for (const gloss of [sd06.roleScoringNote, register.rows.find((r: any) => r.id === 'V3').roleScoringNote, register.rows.find((r: any) => r.id === 'V27').roleScoringNote]) {
        assert.ok(String(gloss).includes('25 October 2026, item 2'), gloss)
        assert.ok(String(gloss).includes('OUR WORDING'), 'each gloss is labelled ours')
    }
    assert.equal(index.rows.get('V0')!.valueType, 'exactly one element (SD-06)', 'V0 keeps exactly one element')
})

test('a damaged copy halts H1: the marker, the map, the earned value, the roles it needs, a value of its own', () => {
    const damaged = (mutate: (r: any) => void): string => {
        const r = copy(register)
        mutate(r)
        try {
            indexRegister(r)
            return 'admitted'
        } catch (error) {
            assert.ok(error instanceof HaltError && error.halt === 'H1', String(error))
            return (error as Error).message
        }
    }
    assert.equal(damaged(() => undefined), 'admitted')
    assert.match(damaged(r => (r.roleScoring.roleYield.values = ['TEST-ONLY'])), /not the marker the engine implements/)
    assert.match(damaged(r => (r.roleScoring.roleYield.key = 'TEST-ONLY')), /not the marker the engine implements/)
    assert.match(damaged(r => (r.roleScoring.targetTypes.map['TEST-ONLY'] = [{ target: 'region' }])), /is not a member of V1\.kind/)
    assert.match(damaged(r => (r.roleScoring.targetTypes.map.goal = [{ target: 'object', type: 'TEST-ONLY' }])), /not a member of its vocabulary/)
    assert.match(damaged(r => (r.roleScoring.targetTypes.basis = 'GLOSS')), /OUR_INTERPRETATION/)
    assert.match(damaged(r => delete r.rows.find((x: any) => x.id === 'B9').earnsValueOf), /does not earn V2/)
    assert.match(damaged(r => (r.roleScoring.eventRow = 'V1')), /not a FIELD row owned by the roles row/)
    assert.match(damaged(r => (r.roleScoring.targetFunction.value = 'TEST-ONLY')), /not a member of the functions vocabulary/)
    assert.match(damaged(r => void delete r.roleBlocks), /needs role blocks|no roleBlocks block/)
    assert.match(damaged(r => r.rows.push({ id: 'TEST-ONLY-V', path: 'activityRoles[].value', ownerRow: 'B1', kind: 'FIELD', valueType: 'TEST-ONLY' })), /gives the elements of B1 a value of their own/)
    // A register before version 16 holds no role-scoring block: no role scores by an event of its own.
    const before = copy(register)
    delete before.roleScoring
    assert.equal(indexRegister(before).roleScoring, null)
})

// ── 2. The restatement loader ───────────────────────────────────────────────────────────────────────────
test('the restatement loader writes only keys it knows, and the role-yield marker only on an owner ruling from its closed list', () => {
    const contract = (): LoadedContract[] => [{ contractId: 'restated:TEST-ONLY', objectId: 'TEST-ONLY', items: [{ itemId: 'T-1', row: 'V1', selector: '*', requirement: 'EQUALS', value: ['TEST-ONLY'], strictness: 'REQUIRED' }], declarations: [] }]
    const ruling = (set: Record<string, unknown>, extra: Partial<ItemRestatement> = {}): ItemRestatement => ({ item: 'restated:TEST-ONLY::T-1', ruling: 'TEST-ONLY', set, why: 'TEST-ONLY', ...extra })
    const apply = (r: ItemRestatement) => {
        const tally: RestatementTally = { applied: 0, withheld: [], itemsRestated: 0, itemsRemoved: 0, itemsAdded: 0, declarationScopes: 0, declarationsRestated: 0, declarationsAdded: 0, declarationsAddedOnDeclaredRows: 0, notFound: [] }
        const item = applyNoRowRestatement(contract(), tally, [r])[0].items[0] as any
        return { item, refusals: tally.notFound.filter(entry => entry.startsWith('restated:TEST-ONLY::T-1')) }
    }
    // An unknown key is refused and named, and the ruling is NOT applied (nothing else it sets lands either).
    const unknown = apply(ruling({ fitNote: 'TEST-ONLY note', yieldsForRle: 'AUTHORIZED_ROLE_SCORING' }))
    assert.equal(unknown.refusals.length, 1)
    assert.match(unknown.refusals[0], /"yieldsForRle" is not a field an item restatement may write, so the ruling is not applied/)
    assert.equal(unknown.item.yieldsForRle, undefined)
    assert.equal(unknown.item.fitNote, undefined, 'the whole ruling is refused, not part of it')
    // The marker with no words of his, or none of where he said them: refused, not applied.
    for (const extra of [{}, { words: 'TEST-ONLY words' }, { citedAs: 'TEST-ONLY place' }, { words: ' ', citedAs: 'TEST-ONLY place' }]) {
        const noWords = apply(ruling({ [ROLE_YIELD_KEY]: 'AUTHORIZED_ROLE_SCORING' }, extra))
        assert.match(noWords.refusals[0] ?? '', /written only on an owner ruling that quotes his words and says where/, JSON.stringify(extra))
        assert.equal(noWords.item[ROLE_YIELD_KEY], undefined)
    }
    // A value outside the closed list: refused, not applied.
    const outside = apply(ruling({ [ROLE_YIELD_KEY]: 'TEST-ONLY' }, { words: 'TEST-ONLY words', citedAs: 'TEST-ONLY place' }))
    assert.match(outside.refusals[0], /"TEST-ONLY" is not a role-yield marker/)
    assert.equal(outside.item[ROLE_YIELD_KEY], undefined)
    // On an owner ruling, from the list: applied, and the item keeps everything else (it removes nothing).
    const ruled = apply(ruling({ [ROLE_YIELD_KEY]: 'AUTHORIZED_ROLE_SCORING' }, { words: 'TEST-ONLY words', citedAs: 'TEST-ONLY place' }))
    assert.deepEqual(ruled.refusals, [])
    assert.equal(ruled.item[ROLE_YIELD_KEY], 'AUTHORIZED_ROLE_SCORING')
    assert.deepEqual(ruled.item.value, ['TEST-ONLY'])
    assert.equal(itemRestatementRefusal('x', ruling({ fitNote: 'n' })), null)
    // A declaration never carries it.
    const declared = restateDeclaration({ row: 'V1', declaration: 'CLAIMED' }, { contractId: 'restated:TEST-ONLY', row: 'V1', from: 'CLAIMED', to: 'CLAIMED', ruling: 'TEST-ONLY', why: 'TEST-ONLY', [ROLE_YIELD_KEY]: 'AUTHORIZED_ROLE_SCORING' } as any)
    assert.ok('refused' in declared && /never on a declaration/.test(String((declared as any).refused)))
    // Every production ruling writes only known keys, and none carries the marker (restatement S1 is his to rule).
    assert.ok(!restatementTally.notFound.some(entry => /may write|role-yield|provenance note/.test(entry)), restatementTally.notFound.join(' | '))
    assert.ok(!ITEM_RESTATEMENTS.some(r => r.set && ROLE_YIELD_KEY in r.set), 'no production item carries the marker')

    // Review fix: the provenance-note keys are the ledger's (data), never spelled in the engine's list, admitted only as text.
    assert.equal(PROVENANCE_NOTE_KEYS.length, 2)
    assert.ok(!PROVENANCE_NOTE_KEYS.some(key => ITEM_RESTATEMENT_KEYS.includes(key)))
    assert.match(apply(ruling({ [PROVENANCE_NOTE_KEYS[0]]: { 'TEST-ONLY': true } })).refusals[0] ?? '', /is a provenance note and must be written as text, so the ruling is not applied/)
    assert.equal(apply(ruling({ [PROVENANCE_NOTE_KEYS[0]]: 'TEST-ONLY note' })).item[PROVENANCE_NOTE_KEYS[0]], 'TEST-ONLY note')
    for (const [label, damaged] of [
        ['a key the engine knows', { keys: ['row'], note: 'TEST-ONLY' }],
        ['a key twice', { keys: ['TEST-ONLY', 'TEST-ONLY'], note: 'TEST-ONLY' }],
        ['no keys', { keys: [], note: 'TEST-ONLY' }],
        ['no note', { keys: ['TEST-ONLY'] }],
    ] as [string, unknown][]) {
        assert.throws(() => provenanceNoteKeysOf({ provenanceNoteKeys: damaged }), /corpus-restatements\.json failed its integrity gate/, label)
    }

    // Review fix: the marker reaches an item ONLY through a ruled item restatement. An item a ruling ADDS carrying it is refused whole and
    // named, never inserted; an item carrying it as authored keeps everything else it says, and the marker is named and not honoured.
    const fresh = (): RestatementTally => ({ applied: 0, withheld: [], itemsRestated: 0, itemsRemoved: 0, itemsAdded: 0, declarationScopes: 0, declarationsRestated: 0, declarationsAdded: 0, declarationsAddedOnDeclaredRows: 0, notFound: [] })
    const addition = (marked: boolean) => ({ contractId: 'restated:TEST-ONLY', after: 'T-1', ruling: 'TEST-ONLY', why: 'TEST-ONLY', item: { itemId: 'T-2', row: 'V1', selector: '*', requirement: 'EQUALS', value: ['TEST-ONLY'], strictness: 'REQUIRED', ...(marked ? { [ROLE_YIELD_KEY]: 'AUTHORIZED_ROLE_SCORING' } : {}) } })
    const addedTally = fresh()
    assert.deepEqual(applyNoRowRestatement(contract(), addedTally, [], [addition(true)])[0].items.map(i => i.itemId), ['T-1'])
    assert.ok(addedTally.notFound.some(entry => entry.startsWith('restated:TEST-ONLY::T-2 (added by TEST-ONLY): carries the role-yield marker') && entry.endsWith('so the item is not added')), addedTally.notFound.join(' | '))
    assert.deepEqual(applyNoRowRestatement(contract(), fresh(), [], [addition(false)])[0].items.map(i => i.itemId), ['T-1', 'T-2'], 'the same addition without the marker is inserted')
    const markedAsAuthored = contract()
    ;(markedAsAuthored[0].items[0] as any)[ROLE_YIELD_KEY] = 'AUTHORIZED_ROLE_SCORING'
    const authoredTally = fresh()
    const authored = applyNoRowRestatement(markedAsAuthored, authoredTally, [], [])[0].items[0] as any
    assert.equal(authored[ROLE_YIELD_KEY], undefined)
    assert.deepEqual([authored.itemId, authored.value, authored.strictness], ['T-1', ['TEST-ONLY'], 'REQUIRED'], 'the authored item keeps everything else it says')
    assert.ok(authoredTally.notFound.some(entry => entry.startsWith('restated:TEST-ONLY::T-1 (as authored): carries the role-yield marker') && entry.endsWith('so the marker is not honoured')))
    const reRuled = applyNoRowRestatement(markedAsAuthored, fresh(), [ruling({ [ROLE_YIELD_KEY]: 'AUTHORIZED_ROLE_SCORING' }, { words: 'TEST-ONLY words', citedAs: 'TEST-ONLY place' })], [])[0].items[0] as any
    assert.equal(reRuled[ROLE_YIELD_KEY], 'AUTHORIZED_ROLE_SCORING', 'a ruled item restatement still writes it')
    // A provisional realization carrying it fails its integrity gate; the Sport Profile carrying it fails its loader.
    const provisionalFile = copy(readJson(PROVISIONAL_REALIZATIONS_FILE))
    provisionalFile.realizations[0].items[0][ROLE_YIELD_KEY] = 'AUTHORIZED_ROLE_SCORING'
    assert.throws(() => loadProvisionalRealizations(provisionalFile), /failed its integrity gate: .*carries the role-yield marker, which only a ruled item restatement quoting his words writes/)
    assert.doesNotThrow(() => loadProvisionalRealizations(copy(readJson(PROVISIONAL_REALIZATIONS_FILE))))
    assert.throws(() => loadSportProfile(file => {
        const raw = copy(readJson(file))
        raw.result.items[0][ROLE_YIELD_KEY] = 'AUTHORIZED_ROLE_SCORING'
        return raw
    }), /the Sport Profile .* carries the role-yield marker/)
    assert.deepEqual(loadSportProfile(file => copy(readJson(file))), loadSportProfile(), 'the loader reads the same profile through its parameter')
})

// ── 3. GA-ROLE-EVENTS on production, and each clause on its own violation ───────────────────────────────
test('production A01, both blocks before realization: both roles score by the primary event; target and yield owed, nothing failing', () => {
    const blocks = a01Blocks(a01Input())
    assert.equal(blocks.length, 2)
    for (const { block, staged } of blocks) {
        const check = checkOf(staged)
        assert.deepEqual(
            check.clauses.map((c: any) => [c.clause, c.verdict, c.instances ?? null]),
            [
                [C.ONE_EACH, 'PASS', 2],
                [C.BLOCKS, 'PASS', 0],
                [C.PRIMARY, 'PASS', 2],
                [C.TARGET, 'DEFERRED_TO_REALIZATION', null],
                [C.YIELD, 'DEFERRED_TO_REALIZATION', null],
                [C.DISTINCT, 'PASS', 2],
                [C.BOUNDED, 'PASS', 1],
                [C.CONDITIONS, 'PASS', 0],
                [C.VALUE, 'PASS', 0],
                [C.MODIFIER, 'PASS', 0],
                [C.ALSO, 'PASS', 1],
                [C.ALSO_REGION, 'PASS', 1],
                [C.SAME, 'PASS', 0],
            ],
            block.blockId,
        )
        assert.equal(check.verdict, 'DEFERRED_TO_REALIZATION', block.blockId)
        assert.match(check.why, /^2 role\(s\); 2 team\(s\) or objective\(s\) scoring$/, block.blockId)
    }
})

test('clause 4 measured on every served subject: A01 at 12/1, 12/2 and 11/1 in both blocks, and the two served demonstrations', () => {
    for (const [players, keepers] of [[12, 1], [12, 2], [11, 1]]) {
        const what = `A01 ${players}/${keepers}`
        const served = reviewActivity({ playerCount: players, fieldLength: '40', fieldWidth: '30', specializedRoles: { [KEEPER]: keepers } } as any, { learningGoalId: 'A01', durationMin: 20 } as any, { includeDrafts: true }) as ServedActivity
        assert.equal(served.outcome, 'served', `${what}: ${JSON.stringify((served as unknown as RefusedActivity).reasons)}`)
        for (const block of served.roleBlocks!.blocks) assert.deepEqual(block.concreteChecks.find(c => c.checkId === ROLE_EVENTS_CHECK), { checkId: ROLE_EVENTS_CHECK, verdict: 'PASS' }, `${what} ${block.blockId}`)
        for (const block of (served.evidence as any).structure.blocks) {
            const owed = block.owed.filter((o: any) => o.checkId === ROLE_EVENTS_CHECK).map((o: any) => [o.clause, o.verdict])
            // Owed before realization and passing on the teams it examined after it (a vacuous pass would read PASS_VACUOUS).
            assert.deepEqual(owed.sort(), [[C.YIELD, 'PASS'], [C.TARGET, 'PASS']].sort(), `${what}: the owed clauses`)
        }
    }
    // Measured on the served games themselves, through the one kind reader and the register's map: each team's event scores at its target.
    for (const demonstrationId of ['neutral-players', 'scoring-modifier']) {
        const { activity, fixture } = buildActivityWithFixture({ kind: 'mechanism-demonstration', demonstrationId, session: sessionOf() } as any)
        assert.equal(activity.outcome, 'served', demonstrationId)
        const game: any = (fixture as any).game
        const kind = String(eventKindOf(game, null).kind)
        const regions: any[] = game.space?.regions ?? []
        const objectives: any[] = (game.objectives ?? []).filter((o: any) => o.role === 'PRIMARY_SCORING')
        assert.ok(objectives.length > 0, demonstrationId)
        for (const objective of objectives) {
            const ref = objective.reference?.structuralRef
            const region = regions.find(r => r.elementId === `c:${ref.contractId}:${ref.itemId}`)
            const matches = (index.roleScoring!.targetTypes.get(kind) ?? []).some(entry => entry.target === 'region' && (entry.type === null || entry.type === region?.noun))
            assert.ok(matches, `${demonstrationId}: ${objective.elementId} scores by ${kind} at a ${region?.noun}`)
        }
    }
})

test('each clause refuses its own violation on a TEST-ONLY copy (block X before realization)', () => {
    const b9 = (role: string, kind: string, selector = `activityRole=${role}`) => testItem(`TEST-B9-${role}`, 'B9', selector, 'EQUALS', kind)
    const push = (...items: any[]) => (contracts: LoadedContract[]) => contractOf(contracts, PROVISIONAL).items.push(...(items as any[]))
    // 1: a kind outside the vocabulary.
    assert.equal(verdictOf(blockX(a01Input(contracts => (withoutAlsoCounts(contracts), push(b9('PRESSING', 'TEST-ONLY-KIND'))(contracts)))), C.ONE_EACH), 'FAIL')
    // 3 and 8: every role by its own event (the building role's credit is confined to the build-out episode).
    const both = blockX(a01Input(contracts => (withoutAlsoCounts(contracts), push(b9('PRESSING', 'target_zone_entered'), b9('BUILDING', 'target_zone_entered'))(contracts))))
    assert.deepEqual([verdictOf(both, C.PRIMARY), verdictOf(both, C.BOUNDED)], ['FAIL', 'FAIL'])
    // 8 alone: the bounded role by its own event; the pressing role still scores by the primary event.
    const bounded = blockX(a01Input(push(b9('BUILDING', 'target_zone_entered'))))
    assert.deepEqual([verdictOf(bounded, C.PRIMARY), verdictOf(bounded, C.BOUNDED)], ['PASS', 'FAIL'])
    assert.match(checkOf(bounded).why, /earns its credit only within BUILD_OUT_EPISODE and scores by its own event/)
    // 11: the occurrence that also counts stays for the pressing role, which now scores by its own event.
    const also = blockX(a01Input(push(b9('PRESSING', 'target_zone_entered'))))
    assert.equal(verdictOf(also, C.ALSO), 'FAIL')
    assert.match(checkOf(also).why, /A01-R1-V27-1 also counts as the primary event for TEAM_AT_AXIS_END, which scores by its own event/)
    // 12: an event written for every role (selector *), not for the role.
    const every = blockX(a01Input(contracts => (withoutAlsoCounts(contracts), push(b9('EVERY', 'target_zone_entered', '*'))(contracts))))
    assert.deepEqual([verdictOf(every, C.SAME), verdictOf(every, C.PRIMARY)], ['FAIL', 'FAIL'])
    // 12 (review fix): a set of roles is not one role alone (the clause's own claim, not left to clauses 3 and 8) ...
    const roleSet = blockX(a01Input(contracts => (withoutAlsoCounts(contracts), push(b9('BOTH', 'target_zone_entered', 'activityRole ∈ {BUILDING, PRESSING}'))(contracts))))
    assert.equal(verdictOf(roleSet, C.SAME), 'FAIL')
    assert.match(checkOf(roleSet).why, /TEST-B9-BOTH writes the event of (BUILDING|PRESSING) by a selector that is not the role's alone/)
    // ... and an event written for a role the game does not hold reached no line and was SERVED, its scoring knowledge ignored: now named
    // and refused, whatever its kind, before realization (the production game otherwise; the occurrence that also counts stays).
    for (const kind of ['goal', 'target_zone_entered']) {
        const ghost = blockX(a01Input(push(b9('GHOST', kind))))
        assert.equal(verdictOf(ghost, C.SAME), 'FAIL', kind)
        assert.match(checkOf(ghost).why, /provisional:A01-R1::TEST-B9-GHOST writes a scoring event for the role GHOST, which the game holds no element of/)
    }
    // 10: a value modifier beside a role's own event.
    const modifier = blockX(a01Input(contracts => (withoutAlsoCounts(contracts), push(b9('PRESSING', 'target_zone_entered'), testItem('TEST-V7', 'V7', '*', 'EXISTS', 'N/A'))(contracts))))
    assert.deepEqual([verdictOf(modifier, C.MODIFIER), verdictOf(modifier, C.VALUE)], ['FAIL', 'PASS'])
    // 4: a goal scored at a region, and a kind the map does not list (never passed).
    assert.equal(verdictOf(blockX(a01Input(contracts => (withoutAlsoCounts(contracts), push(b9('PRESSING', 'goal'))(contracts)))), C.TARGET), 'FAIL')
    assert.equal(verdictOf(blockX(a01Input(contracts => (withoutAlsoCounts(contracts), push(b9('PRESSING', 'target_player'))(contracts)))), C.TARGET), 'NOT_EVALUABLE')
    // 7: both roles attacking one target (the end-assigned reference of one objective pointed at the other's region).
    const shared = blockX(a01Input(contracts => ((itemOf(contracts, GF2, 'GF2-08.f') as any).value = copy((itemOf(contracts, GF2, 'GF2-08.d') as any).value))))
    assert.equal(verdictOf(shared, C.DISTINCT), 'FAIL')
    // 9: a register copy whose conditions row is selected by a team attribute, beside a role's own event.
    const registerCopy = copy(register)
    registerCopy.rows.find((r: any) => r.id === 'V3').selectorAttributes.push('team')
    registerCopy.teamDesignations.designationAttributes.push({ row: 'V3', attribute: 'team' })
    const conditions = blockX(a01Input(contracts => (withoutAlsoCounts(contracts), push(b9('PRESSING', 'target_zone_entered'))(contracts)), contextRelationships(), registerCopy))
    assert.equal(verdictOf(conditions, C.CONDITIONS), 'FAIL')
    // 2: a role's own event in a game holding one role of the two its role blocks need (derived for no block).
    const input = a01Input(contracts => {
        withoutAlsoCounts(contracts)
        const p = contractOf(contracts, PROVISIONAL)
        p.items = p.items.filter(i => !/^A01-R1-(B1-1|B8-1)$/.test(i.itemId))
        p.items.push(b9('PRESSING', 'target_zone_entered') as any)
    })
    assert.equal(verdictOf(runStages0to10(input) as any, C.BLOCKS), 'FAIL')
    // 4 and 6 (review fix): in a game without roles, an objective whose team is not yet settled is owed, never dropped. TEST-ONLY: the role
    // elements taken out, the primary event and both target nouns fixed, so every settled objective is decided before realization (PASS on
    // two); one more objective written with no team was dropped, and the clauses passed on the two they examined.
    const noRoles = (extra: any[]) =>
        runStages0to10(
            a01Input(contracts => {
                const p = contractOf(contracts, PROVISIONAL)
                p.items = p.items.filter(i => !/^A01-R1-(B1|B8)-/.test(i.itemId))
                p.items.push(
                    testItem('TEST-V1', 'V1', '*', 'EQUALS', 'target_zone_entered') as any,
                    testItem('TEST-S3-S', 'S3', 'targetOf=TEAM_AT_AXIS_START', 'EQUALS', 'zone') as any,
                    testItem('TEST-S3-E', 'S3', 'targetOf=TEAM_AT_AXIS_END', 'EQUALS', 'zone') as any,
                    ...extra,
                )
            }),
        ) as any
    const settled = noRoles([])
    assert.deepEqual([verdictOf(settled, C.TARGET), verdictOf(settled, C.YIELD)], ['PASS', 'PASS'])
    const unsettled = noRoles([testItem('TEST-J1', 'J1', 'role=PRIMARY_SCORING', 'EXISTS', 'N/A')])
    assert.deepEqual([verdictOf(unsettled, C.TARGET), verdictOf(unsettled, C.YIELD)], ['DEFERRED_TO_REALIZATION', 'DEFERRED_TO_REALIZATION'])
})

// ── 4. Clause 6: a departure stands only on a ruled yield and a confirmed relationship naming it ────────
/**
 * TEST-ONLY: the pressing role scores by a goal at a goal object, its end-keyed objective's reference written by the realization. The
 * primary event is fixed on this copy by a REQUIRED single value on the event row (TEST-V1), so the building role's event is read before
 * realization; since the review fix a single required value is a permitted set of one, so it is placed in the game form's copy and yields
 * as the four items do (an item never yields to a citation from its own contract).
 */
const SUPERSEDED = [`${GF2}::GF2-19`, `${GF2}::GF2-03.b`, `${GF2}::GF2-06.a`, `${RPC}::RPC-001-08.a`, `${GF2}::TEST-V1`]
const TEST_RELATIONSHIP = (over: Partial<AuthorizingRelationship> = {}): AuthorizingRelationship => ({ id: 'TEST-ONLY-REL', contextId: 'RPC-001', rows: ['B9', 'J2'], status: 'CONFIRMED', supersedes: [...SUPERSEDED], scoringEvent: 'goal', role: 'PRESSING', ...over })
const goalGame = (options: { marked?: string[]; cite?: { event: boolean; reference: boolean }; kind?: string; extra?: any[] } = {}) => (contracts: LoadedContract[]) => {
    withoutAlsoCounts(contracts)
    const kind = options.kind ?? 'goal'
    const gf2 = contractOf(contracts, GF2)
    gf2.items = gf2.items.filter(i => i.itemId !== 'GF2-08.f')
    gf2.items.push(testItem('TEST-V1', 'V1', '*', 'EQUALS', 'target_zone_entered') as any)
    const cite = options.cite ?? { event: true, reference: true }
    const p = contractOf(contracts, PROVISIONAL)
    p.items.push(
        testItem('TEST-O1-GOAL', 'O1', `kind=${kind}`, 'EXISTS', 'N/A') as any,
        testItem('TEST-J2-END', 'J2', 'role=PRIMARY_SCORING & team=TEAM_AT_AXIS_END', 'EQUALS', { structuralRef: { contractId: PROVISIONAL, itemId: 'TEST-O1-GOAL' }, asAuthored: 'TEST-ONLY goal' }, cite.reference ? { authorizedBy: 'TEST-ONLY-REL' } : {}) as any,
        testItem('TEST-B9-PRESSING', 'B9', 'activityRole=PRESSING', 'EQUALS', kind, cite.event ? { authorizedBy: 'TEST-ONLY-REL' } : {}) as any,
        ...(options.extra ?? []),
    )
    for (const key of options.marked ?? []) {
        const [contractId, itemId] = key.split('::')
        ;(itemOf(contracts, contractId, itemId) as any)[ROLE_YIELD_KEY] = 'AUTHORIZED_ROLE_SCORING'
    }
}
const yieldOf = (alter: (contracts: LoadedContract[]) => void, relationships: AuthorizingRelationship[] = [TEST_RELATIONSHIP()]) => {
    const staged = blockX(a01Input(alter, [...contextRelationships(), ...relationships]))
    return { verdict: verdictOf(staged, C.YIELD), target: verdictOf(staged, C.TARGET), why: String(checkOf(staged).why) }
}

test('clause 6: a goal for the pressing role at a goal object is refused without the marker and the relationship, and stands with TEST-ONLY ones', () => {
    // Without any marker: the event departs from both event sets, and the goal object from both target sets.
    const unmarked = yieldOf(goalGame())
    assert.equal(unmarked.target, 'PASS', 'the goal object is the kind of target a goal scores at, and a zone entry scores at any region')
    assert.equal(unmarked.verdict, 'FAIL')
    for (const key of SUPERSEDED) assert.ok(unmarked.why.includes(`departs from the required permitted set of ${key}`) && unmarked.why.includes(`${key} carries no role-yield marker`), key)
    // Every item marked, the realization's event and reference citing a CONFIRMED relationship of RPC-001 naming every one: it stands. (The
    // clause stays owed only for the building role's region noun, which realization chooses inside the possession game's set.)
    const stands = yieldOf(goalGame({ marked: SUPERSEDED }))
    assert.equal(stands.verdict, 'DEFERRED_TO_REALIZATION')
    for (const key of SUPERSEDED) assert.ok(stands.why.includes(`departs from ${key} on a ruled yield and a confirmed relationship naming it`), key)
    // The target's type alone: every event set marked, the possession game's target noun set not - refused naming that item only.
    const targetOnly = yieldOf(goalGame({ marked: SUPERSEDED.filter(key => !key.endsWith('GF2-03.b')) }))
    assert.equal(targetOnly.verdict, 'FAIL')
    assert.ok(targetOnly.why.includes(`${GF2}::GF2-03.b carries no role-yield marker`))
    assert.ok(!targetOnly.why.includes(`${GF2}::GF2-19 carries no role-yield marker`))
    // Each key missing in turn refuses: the relationship unconfirmed, of another context, not naming the item, or not cited by the event or
    // by the reference.
    for (const [label, relationship] of [
        ['IDENTIFIED', TEST_RELATIONSHIP({ status: 'IDENTIFIED' })],
        ['another context', TEST_RELATIONSHIP({ contextId: 'TEST-ONLY-CONTEXT' })],
        ['naming none of them', TEST_RELATIONSHIP({ supersedes: undefined })],
        ['not authorizing the event row', TEST_RELATIONSHIP({ rows: ['J2'] })],
        // Review fix: a relationship naming no event or no role authorizes no yield, and one confirmed for the other role serves not this one.
        ['naming no scoring event', TEST_RELATIONSHIP({ scoringEvent: undefined })],
        ['naming no role', TEST_RELATIONSHIP({ role: undefined })],
        ['confirmed for the other role', TEST_RELATIONSHIP({ role: 'BUILDING' })],
    ] as [string, AuthorizingRelationship][]) {
        assert.equal(yieldOf(goalGame({ marked: SUPERSEDED }), [relationship]).verdict, 'FAIL', label)
    }
    assert.match(yieldOf(goalGame({ marked: SUPERSEDED }), [TEST_RELATIONSHIP({ scoringEvent: undefined })]).why, /TEST-ONLY-REL names no scoring event it authorizes, so it authorizes no role yield/)
    assert.match(yieldOf(goalGame({ marked: SUPERSEDED }), [TEST_RELATIONSHIP({ role: 'BUILDING' })]).why, /TEST-ONLY-REL is confirmed for the role BUILDING, not PRESSING/)
    assert.match(yieldOf(goalGame({ marked: SUPERSEDED, cite: { event: false, reference: true } })).why, /own event is written by no item citing a confirmed relationship/)
    assert.match(yieldOf(goalGame({ marked: SUPERSEDED, cite: { event: true, reference: false } })).why, /objective reference is written by no item citing a confirmed relationship/)
    // Review fix: THE EVENT A RELATIONSHIP CONFIRMS IS THE ONE THE ROLE MAY SCORE BY. Measured in the review, a relationship confirming a goal,
    // cited by an item writing a gate at a gate object, stood exactly as the goal did. Now it is refused, naming the mismatch; the same game
    // stands on a relationship confirming the gate, and the goal still stands on the one confirming the goal (above).
    const gate = yieldOf(goalGame({ marked: SUPERSEDED, kind: 'gate' }))
    assert.equal(gate.target, 'PASS', 'a gate scores at a gate object')
    assert.equal(gate.verdict, 'FAIL')
    assert.ok(gate.why.includes('provisional:A01-R1::TEST-B9-PRESSING cites TEST-ONLY-REL, which does not count: it writes the event "gate", and TEST-ONLY-REL confirms only "goal"'), gate.why)
    assert.equal(yieldOf(goalGame({ marked: SUPERSEDED, kind: 'gate' }), [TEST_RELATIONSHIP({ scoringEvent: 'gate' })]).verdict, 'DEFERRED_TO_REALIZATION')
    // Review fix: an exclusion on the event row reaches a role's own event by its typed values (forward.ts reads only the primary event's line).
    const excluding = { ...testItem('TEST-V1-EXCLUSION', 'V1', '*', 'EQUALS', 'TEST-ONLY prose'), strictness: 'EXCLUSION', forbiddenValues: ['goal'] }
    const excluded = yieldOf(goalGame({ marked: SUPERSEDED, extra: [excluding] }))
    assert.equal(excluded.verdict, 'FAIL')
    assert.ok(excluded.why.includes('departs from the exclusion provisional:A01-R1::TEST-V1-EXCLUSION (goal, at a goal): provisional:A01-R1::TEST-V1-EXCLUSION carries no role-yield marker'), excluded.why)
    // Nothing is moved: the marked items stay in their contracts, and the record lists the citing items with what their relationship authorizes.
    const input = a01Input(goalGame({ marked: SUPERSEDED }), [...contextRelationships(), TEST_RELATIONSHIP()])
    const gf2 = contractOf(input.contracts, GF2)
    assert.ok(gf2.items.some(i => i.itemId === 'GF2-19') && gf2.items.some(i => i.itemId === 'GF2-03.b'))
    assert.deepEqual(gf2.roleYields!.map(entry => [entry.itemId, entry.citedBy.map(c => c.itemId).sort()]), [
        ['GF2-03.b', ['TEST-B9-PRESSING', 'TEST-J2-END']],
        ['GF2-06.a', ['TEST-B9-PRESSING', 'TEST-J2-END']],
        ['GF2-19', ['TEST-B9-PRESSING', 'TEST-J2-END']],
        ['TEST-V1', ['TEST-B9-PRESSING', 'TEST-J2-END']],
    ].sort())
    assert.ok(gf2.roleYields!.every(entry => entry.citedBy.every(c => c.scoringEvent === 'goal' && c.role === 'PRESSING') && entry.refused === undefined))
    // The mismatch is recorded, never counted.
    const mismatched = contractOf(a01Input(goalGame({ marked: SUPERSEDED, kind: 'gate' }), [...contextRelationships(), TEST_RELATIONSHIP()]).contracts, GF2)
    assert.ok(mismatched.roleYields!.every(entry => entry.citedBy.every(c => c.itemId !== 'TEST-B9-PRESSING') && entry.refused!.some(r => r.itemId === 'TEST-B9-PRESSING')))
})

// ── 5. The deferral: C56 unchanged, and the same teams required ─────────────────────────────────────────
test('C56 still defers on production; an end-keyed item defers only to a reference naming the same end', () => {
    const production = applyRealizationDeferrals(copy(derivationInputFor(selectFor('A01', null)).contracts as LoadedContract[]), contextRelationships(), index)
    assert.deepEqual(production.deferred.map(entry => `${entry.contractId}::${entry.item.itemId}`), [`${GF2}::GF2-14.b`], 'the equal-numbers item defers, as before')
    const relationship: AuthorizingRelationship = { id: 'TEST-ONLY-REL-J2', contextId: 'RPC-001', rows: ['J2'], status: 'CONFIRMED' }
    const deferredWith = (team: string) => {
        const contracts = copy(derivationInputFor(selectFor('A01', null)).contracts as LoadedContract[])
        ;(itemOf(contracts, GF2, 'GF2-08.f') as any).defersTo = 'AUTHORIZED_REALIZATION'
        contractOf(contracts, PROVISIONAL).items.push(testItem('TEST-J2', 'J2', `role=PRIMARY_SCORING & team=${team}`, 'EQUALS', { structuralRef: { contractId: GF2, itemId: 'GF2-03.e' } }, { authorizedBy: relationship.id }) as any)
        return applyRealizationDeferrals(contracts, [...contextRelationships(), relationship], index).deferred.map(entry => entry.item.itemId)
    }
    assert.ok(!deferredWith('TEAM_AT_AXIS_START').includes('GF2-08.f'), 'a reference keyed to the other end does not make the end-keyed item defer')
    assert.ok(deferredWith('TEAM_AT_AXIS_END').includes('GF2-08.f'), 'one keyed to the same end does')
})

// ── 6. The relationship feed ────────────────────────────────────────────────────────────────────────────
test('the relationship feed passes every recorded kind, and the validator holds them all', () => {
    assert.deepEqual(contextScoringRelationships(), [], 'no scoring relationship is recorded on 22 October 2026')
    assert.deepEqual(contextRelationships(), contextManipulationRelationships(), 'so the feed equals the manipulation list, entry for entry')
    // Production compositions are unchanged by the role yields, object for object.
    const contracts = derivationInputFor(selectFor('A01', null)).contracts as LoadedContract[]
    const yielded = applyRoleYields(contracts, contextRelationships(), index)
    assert.ok(yielded.every((contract, i) => contract === contracts[i]))
    const records = learningGoalAuthorizations()
    const scoring: ContextScoringRelationship = {
        id: 'TEST-ONLY-SCORING',
        category: 'CONTEXT_SCORING_RELATIONSHIP',
        contextId: 'RPC-001',
        contextName: 'TEST-ONLY',
        scoringEvent: 'goal',
        role: 'PRESSING',
        rows: ['B9', 'J2'],
        via: ['TEST-ONLY'],
        identified: 'TEST-ONLY',
        status: 'CONFIRMED',
        confirmedOn: 'TEST-ONLY',
        confirmedBy: 'TEST-ONLY',
        citedAs: 'TEST-ONLY',
        words: ['TEST-ONLY'],
        note: null,
        supersedes: [...SUPERSEDED],
    }
    assert.deepEqual(validateContextManipulationRelationships(contextManipulationRelationships(), records, undefined, [scoring]), [])
    assert.ok(validateContextManipulationRelationships(contextManipulationRelationships(), records, undefined, [{ ...scoring, category: 'EXISTING_KNOWLEDGE_RELATIONSHIP' as any }]).some(e => e.includes('CONTEXT_SCORING_RELATIONSHIP')))
    assert.ok(validateContextManipulationRelationships(contextManipulationRelationships(), records, undefined, [{ ...scoring, scoringEvent: '' }]).some(e => e.includes('scoring event')))
    assert.ok(validateContextManipulationRelationships(contextManipulationRelationships(), records, undefined, [{ ...scoring, supersedes: ['TEST-ONLY'] }]).some(e => e.includes('supersedes')))
    assert.ok(validateContextManipulationRelationships(contextManipulationRelationships(), records, undefined, [{ ...scoring, id: contextManipulationRelationships()[0].id }]).some(e => e.includes('defined twice')))
    assert.ok(validateContextManipulationRelationships(contextManipulationRelationships(), records, undefined, [{ ...scoring, status: 'CONFIRMED', words: [] }]).some(e => e.includes('in his words')))
    // Review fix: the event is one member of the register's scoring-event vocabulary and the role one member of its roles, or nothing loads.
    const refusedFor = (over: Partial<ContextScoringRelationship>, register?: unknown) => validateContextManipulationRelationships(contextManipulationRelationships(), records, undefined, [{ ...scoring, ...over }], register)
    assert.ok(refusedFor({ scoringEvent: 'TEST-ONLY-EVENT' }).some(e => e.includes('authorizes the scoring event "TEST-ONLY-EVENT", which is not a member of V1.kind')), refusedFor({ scoringEvent: 'TEST-ONLY-EVENT' }).join(' | '))
    assert.ok(refusedFor({ role: 'TEST-ONLY-ROLE' }).some(e => e.includes('must name the one role it is confirmed for')))
    assert.ok(refusedFor({ role: undefined as any }).some(e => e.includes('must name the one role it is confirmed for')))
    const noRoleScoring = copy(register)
    delete noRoleScoring.roleScoring
    assert.ok(refusedFor({}, noRoleScoring).some(e => e.includes('the register holds no role-scoring block')))
    for (const kind of index.roleScoring!.kinds) assert.deepEqual(refusedFor({ scoringEvent: kind }), [], kind)
    // Only a scoring relationship may supersede items for one role (a manipulation relationship names no event or role it authorizes).
    const manipulation = contextManipulationRelationships()
    assert.ok(validateContextManipulationRelationships([{ ...manipulation[0], supersedes: [...SUPERSEDED] } as any, ...manipulation.slice(1)], records).some(e => e.includes('only a context scoring relationship')))
    // An authorized adjustment rests on a manipulation relationship only: the shared lookup no longer lets it resolve to a scoring one.
    const adjusted = records.find(entry => entry.authorizedAdjustments?.entries?.length)!
    const resting = copy(records).map(entry => (entry.learningGoalId === adjusted.learningGoalId ? { ...entry, authorizedAdjustments: { ...entry.authorizedAdjustments!, entries: entry.authorizedAdjustments!.entries.map(a => ({ ...a, relationship: scoring.id })) } } : entry))
    assert.ok(validateContextManipulationRelationships(manipulation, resting, undefined, [scoring]).some(e => e.includes(`names the relationship ${scoring.id}, which contextManipulationRelationships does not hold`)))
})

// ── 7. THE CONSUMER ─────────────────────────────────────────────────────────────────────────────────────
/**
 * TEST-ONLY copy: the building role scores line_crossed (the primary event's kind, realization choice) at a line, and the pressing role
 * scores target_zone_entered (its own event, row B9) at a zone - both inside the possession game's event and target sets, so no marker is
 * needed. The targets' nouns are written for the role holders, so the building team's target is a line and the pressing team's a zone in
 * each block; the occurrence that also counts is taken out (it is for a team scoring by the primary event, clause 11).
 */
const consumerBuild = () =>
    buildActivityUnderAuthorizationRecords({ kind: 'learning-goal', goalId: 'A01', session: sessionOf() }, learningGoalAuthorizations(), {
        alter: contracts => {
            withoutAlsoCounts(contracts)
            contractOf(contracts, PROVISIONAL).items.push(
                testItem('TEST-S3-B', 'S3', 'targetOf=ROLE_HOLDER_BUILDING', 'EQUALS', 'line') as any,
                testItem('TEST-S3-P', 'S3', 'targetOf=ROLE_HOLDER_PRESSING', 'EQUALS', 'zone') as any,
                testItem('TEST-B9-P', 'B9', 'activityRole=PRESSING', 'EQUALS', 'target_zone_entered') as any,
            )
        },
        alterSupplied: supplied => {
            supplied.choices = supplied.choices.filter(choice => !['c:restated:GF2:GF2-03.e::S3', 'c:restated:GF2:GF2-03.f::S3'].includes(choice.lineId))
            for (const choice of supplied.choices) if (choice.lineId === 'game::V1') (choice as any).value = 'line_crossed'
        },
        review: { includeDrafts: true },
    })
const productionBuild = () => buildActivityUnderAuthorizationRecords({ kind: 'learning-goal', goalId: 'A01', session: sessionOf() }, learningGoalAuthorizations(), { review: { includeDrafts: true } })
const PRESSING_ROLE = 'c:provisional:A01-R1:A01-R1-B1-2'
const PRESSING_EVENT = `activityRoles[${PRESSING_ROLE}].scoresBy`

test('THE CONSUMER: a building role at a line and a pressing role scoring by its own event at a zone change How to score, the fixture and the review evidence', () => {
    const production = productionBuild()
    const consumer = consumerBuild()
    const activity = consumer.activity as RefusedActivity
    // It is coherent: every check before and after realization, and across the blocks, holds; it stops only at communication, on a sentence
    // he has not yet approved for the primary event the building team now scores by (the approved building sentence does not cite it).
    assert.equal(activity.outcome, 'refused')
    assert.equal(activity.stage, 'communication', activity.reasons.join(' | '))
    assert.ok(!activity.reasons.some(reason => reason.includes(ROLE_EVENTS_CHECK)), activity.reasons.join(' | '))
    assert.ok(activity.reasons.some(reason => reason.includes('fidelity Q3: value.primaryEvent.kind is established by the game and no instruction carries it')))
    // The fixture: the pressing role holds its own event and the game's primary event is the building team's.
    const game: any = (consumer.fixture as any).game
    const productionGame: any = (production.fixture as any).game
    assert.equal(game.activityRoles.find((r: any) => r.elementId === PRESSING_ROLE).scoresBy, 'target_zone_entered')
    assert.equal(game.value.primaryEvent.kind, 'line_crossed')
    assert.ok(productionGame.activityRoles.every((r: any) => r.scoresBy === undefined), 'production: no role holds an event of its own')
    assert.deepEqual([eventKindOf(game, 'PRESSING'), eventKindOf(game, 'BUILDING')], [
        { kind: 'target_zone_entered', path: PRESSING_EVENT, byRole: true },
        { kind: 'line_crossed', path: 'value.primaryEvent.kind', byRole: false },
    ])
    assert.deepEqual(eventKindOf(productionGame, 'PRESSING'), { kind: 'target_zone_entered', path: 'value.primaryEvent.kind', byRole: false })
    // How to score: the pressing team's sentence is said from ITS event, citing its own path and its own target's noun only.
    const pressingSentence = (instructions: any[]) => instructions.find(i => i.section === 'How to score' && i.text.startsWith('Pressing team: Score'))
    const said = pressingSentence(activity.draft!.instructions)
    const before = pressingSentence((production.activity as ServedActivity).rendered.instructions)
    assert.equal(said.text, 'Pressing team: Score by getting the ball under control into its target zone: running it in, or passing to a teammate who receives it under control inside')
    assert.equal(before.text, said.text, 'the same words: both are a zone entry')
    assert.ok(said.from.includes(PRESSING_EVENT) && !said.from.includes('value.primaryEvent.kind'), said.from.join(' | '))
    assert.ok(before.from.includes('value.primaryEvent.kind') && !before.from.includes(PRESSING_EVENT))
    const nouns = (from: string[]) => from.filter(p => p.endsWith('.noun'))
    assert.equal(nouns(said.from).length, 1, 'its own target noun, not the building team\'s line')
    assert.equal(nouns(before.from).length, 2, 'production cites both zones, as before')
    // The review evidence reads each role's own event.
    const evidence = JSON.stringify(activity.evidence)
    const productionEvidence = JSON.stringify((production.activity as ServedActivity).evidence)
    assert.ok(evidence.includes(': PRESSING scores by target_zone_entered in') && evidence.includes(': BUILDING scores by line_crossed in'), 'each role by its own event')
    assert.ok(productionEvidence.includes(': PRESSING scores by target_zone_entered in') && productionEvidence.includes(': BUILDING scores by target_zone_entered in'))
    assert.ok(!productionEvidence.includes(': BUILDING scores by line_crossed in'))
})

// ── 8. No wording, no sentence; the guard ───────────────────────────────────────────────────────────────
test('a kind with no wording is withheld and fidelity refuses it, never said with the line wording; the two wordings by kind', () => {
    assert.deepEqual(
        index.vocabularies.get('V1.kind')!.map(kind => [kind, scoringWordingOf(kind)]),
        [['goal', null], ['target_player', null], ['line_crossed', 'LINE_CROSSING'], ['target_zone_entered', 'ZONE_ENTRY'], ['gate', null], ['regain', null], ['denial', null]],
    )
    const consumer = consumerBuild()
    const fixture: any = copy(consumer.fixture)
    const zoneRender = renderConcreteGame(copy(consumer.fixture) as any)
    fixture.game.activityRoles.find((r: any) => r.elementId === PRESSING_ROLE).scoresBy = 'goal'
    const rendered = renderConcreteGame(fixture)
    assert.ok(rendered.withheld.some(field => field.path === PRESSING_EVENT && field.row === 'B9' && field.reason === 'AWAITING_APPROVED_WORDING'), JSON.stringify(rendered.withheld))
    assert.ok(!rendered.instructions.some(i => i.from.includes(PRESSING_EVENT)), 'no sentence says it')
    assert.ok(!rendered.instructions.some(i => /^Pressing team: Score/.test(i.text)), 'and it is never said with the line wording')
    assert.ok(checkFidelity(fixture, rendered).findings.some(f => f.severity === 'VIOLATION' && f.question === 3 && f.what.includes(PRESSING_EVENT)), 'fidelity: carried by nothing')
    // A sentence written for another kind's event, read against a game where the event is a goal: refused as unworded.
    const refused = checkFidelity(fixture, zoneRender).findings.filter(f => f.severity === 'VIOLATION' && f.question === 2 && f.what.includes('for which no wording is written'))
    assert.equal(refused.length, 1)
    assert.ok(refused[0].what.includes(`"goal" (${PRESSING_EVENT})`))
    // Every path a sentence may cite to say how a team scores.
    assert.deepEqual(eventKindPathsOf(fixture.game), ['value.primaryEvent.kind', PRESSING_EVENT])
})

test('the guard: a role\'s own event stands only on his ruling (OWNER_RULING), named otherwise; a game whose roles score by the primary event owes nothing', () => {
    const game: any = (consumerBuild().fixture as any).game
    const support = (basis: string, authorizedBy: string | null = null) => [{ elementId: PRESSING_ROLE, role: 'PRESSING', items: [{ contractId: PROVISIONAL, itemId: 'TEST-B9-P', basis, authorizedBy }] }]
    const approved = ['line_crossed', 'target_zone_entered']
    assert.deepEqual(roleEventFindings('RPC-001', game, approved, support('OWNER_RULING')), [])
    const assumed = roleEventFindings('RPC-001', game, approved, support('ASSUMED'))
    assert.equal(assumed.length, 1)
    assert.match(assumed[0], /scores by its own event "target_zone_entered" on provisional:A01-R1::TEST-B9-P, whose basis is ASSUMED/)
    assert.match(roleEventFindings('RPC-001', game, approved, undefined)[0], /what writes it was not given/)
    assert.deepEqual(roleEventFindings('RPC-001', (productionBuild().fixture as any).game, ['target_zone_entered'], undefined), [])
    // Review fix: an event the context does NOT approve stands only where an item writing it cites a CONFIRMED scoring relationship of the
    // context, confirmed for this role and this event (until then the approved events were read only into the message).
    const unapproved = roleEventFindings('RPC-001', game, ['line_crossed'], support('OWNER_RULING'))
    assert.equal(unapproved.length, 1)
    assert.match(unapproved[0], /scores by its own event "target_zone_entered", which the Representative Performance Context RPC-001 does not approve \(it approves: line_crossed\), and no item writing it cites a confirmed scoring relationship of RPC-001 authorizing "target_zone_entered" for PRESSING/)
    const relationship = { id: 'TEST-ONLY-SCORING', contextId: 'RPC-001', status: 'CONFIRMED', scoringEvent: 'target_zone_entered', role: 'PRESSING' }
    assert.deepEqual(roleEventFindings('RPC-001', game, ['line_crossed'], support('OWNER_RULING', relationship.id), undefined, [relationship]), [])
    for (const [label, over] of [
        ['identified only', { status: 'IDENTIFIED' }],
        ['of another context', { contextId: 'TEST-ONLY-CONTEXT' }],
        ['for another event', { scoringEvent: 'goal' }],
        ['for the other role', { role: 'BUILDING' }],
    ] as [string, object][]) {
        assert.equal(roleEventFindings('RPC-001', game, ['line_crossed'], support('OWNER_RULING', relationship.id), undefined, [{ ...relationship, ...over }]).length, 1, label)
    }
    assert.equal(roleEventFindings('RPC-001', game, ['line_crossed'], support('OWNER_RULING'), undefined, [relationship]).length, 1, 'held but not cited')
})

// ── 9. The ratchets ─────────────────────────────────────────────────────────────────────────────────────
/** A TypeScript source's code with its comments removed (string and template text kept), and its string literals. */
function codeOf(source: string): { code: string; literals: string[] } {
    let code = ''
    const literals: string[] = []
    const depth: number[] = []
    let mode: 'code' | 'line' | 'block' | "'" | '"' | 'tpl' = 'code'
    let text = ''
    for (let i = 0; i < source.length; i++) {
        const c = source[i]
        const d = source[i + 1]
        if (mode === 'line') {
            if (c === '\n') {
                mode = 'code'
                code += c
            }
            continue
        }
        if (mode === 'block') {
            if (c === '*' && d === '/') {
                mode = 'code'
                i++
            }
            continue
        }
        if (mode === "'" || mode === '"' || mode === 'tpl') {
            code += c
            if (c === '\\') {
                code += d
                text += d
                i++
                continue
            }
            if ((mode !== 'tpl' && c === mode) || (mode === 'tpl' && c === '`')) {
                literals.push(text)
                mode = 'code'
                continue
            }
            if (mode === 'tpl' && c === '$' && d === '{') {
                literals.push(text)
                code += d
                i++
                depth.push(0)
                mode = 'code'
                continue
            }
            text += c
            continue
        }
        if (c === '/' && d === '/') {
            mode = 'line'
            i++
            continue
        }
        if (c === '/' && d === '*') {
            mode = 'block'
            i++
            continue
        }
        code += c
        if (c === "'" || c === '"') {
            mode = c
            text = ''
        } else if (c === '`') {
            mode = 'tpl'
            text = ''
        } else if (depth.length && c === '{') depth[depth.length - 1]++
        else if (depth.length && c === '}') {
            if (depth[depth.length - 1] === 0) {
                depth.pop()
                mode = 'tpl'
                text = ''
            } else depth[depth.length - 1]--
        }
    }
    return { code, literals }
}
const SYSTEM = path.resolve(__dirname, '..')
const engineFiles = (): string[] =>
    ['derivation', 'realization', 'rendering'].flatMap(dir =>
        fs
            .readdirSync(path.join(SYSTEM, dir))
            .filter(file => file.endsWith('.ts') && !file.endsWith('.unit.ts'))
            .map(file => `${dir}/${file}`),
    )

test('the grep ratchet: only the one kind reader reads the primary event\'s kind', () => {
    const readers = engineFiles().filter(file => /primaryEvent\??\.kind\b|primaryEvent\??\.\['kind'\]/.test(codeOf(fs.readFileSync(path.join(SYSTEM, file), 'utf8')).code))
    assert.deepEqual(readers, ['rendering/game-reading.ts'])
    // At the derivation layer the gates read the kind line through one reader too (the line is never spelled whole).
    assert.ok(!engineFiles().some(file => codeOf(fs.readFileSync(path.join(SYSTEM, file), 'utf8')).code.includes('game::V1')))
})

/**
 * **The no-exception ratchet** (the design of 22 October 2026, build plan rules): no engine file gains a string naming a scoring kind, a role,
 * a sport noun or a knowledge id. Counted per file and literal, so a new one fails and a removed one is reported stale. Today's baseline,
 * each read in its file: the zone entry's wording constant (render-concrete-game.ts, the design's named exception), the played object in
 * the engine's carrier rule (engine.ts), the word for a Learning Goal in a refusal sentence (build-activity.ts: the subject "goal", not the
 * scoring kind), and the goal ids of the bounded pilot in the contract-coverage report script. The test composition and the demonstrations
 * (composition-fixtures.ts, mechanism-demonstrations.ts) name knowledge by design and are not engine files.
 */
test('the no-exception ratchet: no engine file gains a scoring kind, a role, a sport noun or a knowledge id', () => {
    const terms = [...index.vocabularies.get('V1.kind')!, ...index.roleBlocks!.roles, 'ball']
    const id = /^(A01|RPC-001|GF2)(\b|-|$)/
    const found: Record<string, number> = {}
    for (const file of engineFiles()) {
        if (file === 'derivation/composition-fixtures.ts' || file === 'rendering/mechanism-demonstrations.ts') continue
        for (const literal of codeOf(fs.readFileSync(path.join(SYSTEM, file), 'utf8')).literals) {
            if (terms.includes(literal) || id.test(literal)) found[`${file} ${literal}`] = (found[`${file} ${literal}`] ?? 0) + 1
        }
    }
    assert.deepEqual(found, {
        'derivation/engine.ts ball': 1,
        'derivation/run-contract-coverage.ts A01': 1,
        'rendering/build-activity.ts goal': 1,
        'rendering/render-concrete-game.ts target_zone_entered': 1,
    })
})

console.log(`role-events.unit.ts — ${passed} passed`)
