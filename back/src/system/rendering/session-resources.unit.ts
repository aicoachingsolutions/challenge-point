/**
 * Resource-aware realization selection — stage E, 23 October 2026 (the design's Stage E, his priority 4; register version 19, the
 * sessionResources block).
 *
 * Christian, reply filed 25 October 2026, item 4: *"I approve retaining both alternatives."* *"These should be alternative
 * knowledge-authorized realizations, not separate hardcoded implementations of the same Learning Goal."* *"Please add the general ability to
 * represent goal availability as a session resource and use authorized knowledge relationships when determining which scoring configuration
 * can be selected."* *"A goalkeeper being available must not automatically force a goalkeeper or goal into an activity that does not require
 * one."* *"Likewise, the system should not assume a physical goal exists simply because a goalkeeper was selected."*
 *
 * What is pinned here:
 *   1. the register carries the capability as data (version 19, the sessionResources block) and refuses a damaged copy (halt H1);
 *   2. the session model stores the objects with no schema default; the envelope carries what is stated and nothing else, never asks, and
 *      refuses what it cannot read;
 *   3. the availability rule: it covers involvement for the listed kinds with typed causes, reads the game and never writes it, and asks
 *      nothing of a game holding no such object;
 *   4. a variant realization composed from its base (`basedOn`, `withdraws`, its own items) equals the base minus the withdrawals plus the
 *      additions, element for element, through an integrity gate; suitability is his and is refused without his words;
 *   5. the record's ordered alternatives: read whole or refused; the single realization read as a list of one;
 *   6. the alternative being tried reaches every reader of the realization (derivation's input, the realization choices, the account);
 *   7. the build's loop on TEST-ONLY records: goals = 0 serves A01-R1 with only the recorded delta; a TEST-ONLY preferred alternative needing
 *      a goal falls back to A01-R1 when no goal is stated as available, asks when availability is not stated, and refuses instead of falling
 *      back on a structural break or any other refusal; goalkeepers = 0 gives the roster refusal naming each alternative's need; the testing
 *      area and the practice situation are typed; an alternative waiting on a gap is listed and never tried; the account and the review
 *      evidence name every alternative and why it was or was not used;
 *   8. the live route's refusal carries the question;
 *   9. (the stage E fix, after the stage E review) the review page's answer reaches the build through the review route - the body's objects
 *      are read, laid over the stored statement and validated, through `reviewActivity` as the route calls it, and the request the route
 *      builds from an answer turns the loop's question into a selection; a staffing shortfall beside a real break, and suitability nobody
 *      has decided, refuse the activity instead of falling back.
 *
 * Every goal value, suitability, variant and alternative list here is TEST-ONLY and in memory: no production file is written, and no
 * production record or realization changes (A01-R2 is the design's Stage F, after his rulings; his decision 4 decides suitability).
 *
 * Run: npx ts-node --files -r tsconfig-paths/register ./src/system/rendering/session-resources.unit.ts
 */
import assert from 'node:assert/strict'

import Session from '../../models/session.model'
import * as corpus from '../derivation/corpus'
import { loadProvisionalRealizations, loadRegister, PROVISIONAL_REALIZATIONS_FILE, ProvisionalRealization, provisionalRealizationNamed, readJson, validateProvisionalRealizations } from '../derivation/corpus'
import { HaltError, indexRegister } from '../derivation/register'
import { derivationInputFor, realizationOf, selectFor } from '../derivation/run-bounded-selection'
import { DEFERS_TO_AUTHORIZED_REALIZATION } from '../derivation/types'
import { objectAvailabilityRefusal, objectInvolvementOf } from '../realization/assemble-concrete-game'
import { isNoSuppliedRealization, suppliedRealizationFor, SuppliedRealization } from '../realization/supplied-realization'
import * as authorizationRecords from '../test-library/learning-goal-authorizations'
import { learningGoalAuthorizations, LearningGoalAuthorization, realizationAlternativesOf, validateLearningGoalAuthorizations } from '../test-library/learning-goal-authorizations'
import { reviewActivity, reviewRequestOf } from './activity-review'
import { buildActivityForReview, buildActivityUnderAuthorizationRecords, onlyTheRosterStopped, RefusedActivity, ServedActivity } from './build-activity'
import { liveRefusalBody } from './live-activity'
import { objectAvailabilityQuestion, sessionEnvelopeFrom, sessionResourceKinds, specializedRoleNames } from './session-envelope'

let passed = 0
function test(name: string, body: () => void): void {
    body()
    passed++
    console.log(`  ok  ${name}`)
}
console.log('resource-aware realization selection (stage E)')

const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value))
const register = loadRegister()
const index = indexRegister(register)
const spec = index.sessionResources!
const [KIND] = spec.kinds
const KEEPER = specializedRoleNames()[0]
const none = Object.fromEntries(specializedRoleNames().map(role => [role, 0]))
const sessionOf = (keepers = 1, objects?: Record<string, { count: number; widthM?: number }>, players = 12) => ({ players, lengthM: 40, widthM: 30, durationMin: 20, roles: { ...none, [KEEPER]: keepers }, ...(objects ? { objects } : {}) })
const halts = (damage: (r: any) => void, message: RegExp, label: string) => {
    const damaged = copy(register)
    damage(damaged)
    assert.throws(() => indexRegister(damaged), (error: unknown) => error instanceof HaltError && message.test(error.message), label)
}

// ── 1. The register ──────────────────────────────────────────────────────────────────────────────────────
test('register version 19 holds the session resources as data, in one versions entry quoting him, chained after 18', () => {
    assert.match(String(register.version), /^19, adds an object's availability as a session resource, for his reply filed 25 October 2026, item 4 /)
    assert.ok(String(register.version).includes('"Please add the general ability to represent goal availability as a session resource and use authorized knowledge relationships when determining which scoring configuration can be selected."'))
    assert.equal(String(register.version).split('Supersedes version 18, which adds the coach-controlled end exchange, ').length - 1, 1, 'version 18 superseded once')
    assert.ok(!String(register.version).includes('Supersedes version 19'), 'version 19 is the current entry')
    assert.deepEqual([spec.row, spec.attribute, spec.countRow, spec.kinds], ['O1', 'kind', 'O3', ['goal']])
    assert.deepEqual([spec.path, spec.kindLeaf, spec.countLeaf], ['objects[]', 'kind', 'count'])
    assert.deepEqual(sessionResourceKinds(), spec.kinds, 'the envelope reads the kinds from the register')
    // No row and no list entry is added by version 19.
    assert.ok(!register.rows.some((row: any) => String(row.note ?? '').includes('register version 19')))
})

test('a damaged copy halts H1; a register without the block has no session resource', () => {
    halts(r => (r.sessionResources.row = 'O2'), /sessionResources\.row O2 is not a COLLECTION row/, 'a field as the row')
    halts(r => (r.sessionResources.attribute = 'TEST-ONLY'), /sessionResources\.attribute TEST-ONLY is not a selector attribute of O1/, 'an unknown attribute')
    halts(r => (r.sessionResources.countRow = 'P2'), /sessionResources\.countRow P2 is not a FIELD row owned by O1/, 'a count row of another collection')
    halts(r => (r.sessionResources.kinds = []), /must list at least one kind, each once/, 'no kind')
    halts(r => (r.sessionResources.kinds = [KIND, KIND]), /must list at least one kind, each once/, 'a kind twice')
    halts(r => (r.sessionResources.kinds = ['TEST-ONLY']), /TEST-ONLY is not a member of the O2\.kind vocabulary/, 'a kind outside the vocabulary')
    halts(r => (r.sessionResources.note = ''), /must say what it is and why/, 'no note')
    const without = copy(register)
    delete without.sessionResources
    assert.equal(indexRegister(without).sessionResources, null)
})

// ── 2. The session model and the envelope ────────────────────────────────────────────────────────────────
test('the session model stores objects with no schema default: an untouched session states nothing', () => {
    const created: any = new Session({ name: 'TEST-ONLY', createdBy: '64b7f0c2a1b2c3d4e5f60719' })
    assert.equal(created.objects, undefined, 'no default: absent means not stated, never none')
    const stated: any = new Session({ name: 'TEST-ONLY', createdBy: '64b7f0c2a1b2c3d4e5f60719', objects: { [KIND]: { count: 0 } } })
    assert.deepEqual(copy(stated.toObject().objects), { [KIND]: { count: 0 } })
})

test('the envelope carries what is stated and nothing else, never asks for objects, and refuses what it cannot read', () => {
    const stored = { playerCount: 12, fieldLength: '40', fieldWidth: '30', specializedRoles: { ...none, [KEEPER]: 1 } }
    const ok = (extra: Record<string, unknown> = {}, review: Record<string, unknown> = {}) => {
        const envelope = sessionEnvelopeFrom({ ...stored, ...extra }, { durationMin: 20, ...review })
        assert.equal(envelope.outcome, 'stated', JSON.stringify(envelope))
        return (envelope as any).session
    }
    // Absent: the session carries exactly what it did before stage E (no objects key), and nothing is asked.
    assert.ok(!('objects' in ok()), 'nothing stated, nothing carried')
    assert.deepEqual(ok({ objects: { [KIND]: { count: 0 } } }).objects, { [KIND]: { count: 0 } }, 'a stated none is a statement')
    assert.deepEqual(ok({ objects: { [KIND]: { count: 1, widthM: 5 } } }).objects, { [KIND]: { count: 1, widthM: 5 } })
    // The review's statement is laid over the stored one, kind by kind; a kind named with nothing beside it is not stated.
    assert.deepEqual(ok({ objects: { [KIND]: { count: 0 } } }, { objects: { [KIND]: { count: 1, widthM: 3 } } }).objects, { [KIND]: { count: 1, widthM: 3 } })
    assert.deepEqual(ok({ objects: { [KIND]: { count: 2, widthM: 3 } } }, { objects: { [KIND]: null } }).objects, { [KIND]: { count: 2, widthM: 3 } })
    assert.ok(!('objects' in ok({ objects: { [KIND]: null } })), 'named and not stated')
    const refused = (objects: unknown, why: RegExp) => {
        const envelope = sessionEnvelopeFrom({ ...stored, objects }, { durationMin: 20 })
        assert.equal(envelope.outcome, 'not-stated', JSON.stringify(objects))
        assert.ok((envelope as any).reasons.some((reason: string) => why.test(reason)), `${JSON.stringify(objects)}: ${(envelope as any).reasons.join(' | ')}`)
    }
    refused({ cones: { count: 4 } }, /names a kind of equipment the activity engine does not know: cones/)
    refused(JSON.parse('{"__proto__": {"count": 1}}'), /does not know: __proto__/)
    refused({ [KIND]: { count: -1 } }, new RegExp(`The number of ${KIND}s must be a whole number, 0 or more`))
    refused({ [KIND]: { count: 1.5 } }, new RegExp(`The number of ${KIND}s must be a whole number`))
    refused({ [KIND]: 2 }, new RegExp(`The number of ${KIND}s must be a whole number`))
    refused({ [KIND]: { count: 1, widthM: 0 } }, new RegExp(`The width of the ${KIND}s must be a number of metres, more than zero`))
    refused({ [KIND]: { count: 1, widthM: '5' } }, new RegExp(`The width of the ${KIND}s must be a number of metres`))
    refused([1], /list of equipment could not be read/)
    // Never asked here: a session with everything else stated and no objects is stated; the question is a build's (below).
    const quiet = sessionEnvelopeFrom(stored, { durationMin: 20 })
    assert.equal(quiet.outcome, 'stated')
    assert.equal(objectAvailabilityQuestion(KIND, 'AVAILABILITY'), `Say how many ${KIND}s this session has, and how wide they are, before building this activity.`)
})

// ── 3. The availability rule ─────────────────────────────────────────────────────────────────────────────
const gameWith = (objects: Record<string, unknown>[]) => ({ objects: [{ elementId: 'TEST-BALL', kind: 'ball' }, ...objects] })
const suitable = (min: number | null, max: number | null) => [{ contractId: 'provisional:TEST-ONLY', objectSuitability: [{ kind: KIND, widthM: { min, max }, ruledOn: 'TEST-ONLY', by: 'TEST-ONLY', citedAs: 'TEST-ONLY', words: ['TEST-ONLY'] }] }] as any[]
const rule = (game: unknown, objects: unknown, contracts: any[] = []) => objectAvailabilityRefusal(index, game, objects === undefined ? {} : { objects }, contracts)

test('the availability rule covers involvement with typed causes, and a game holding no listed object never reads the session', () => {
    // A game holding none of the kind needs none: nothing stated, a stated none and a stated one all pass, unread.
    for (const objects of [undefined, { [KIND]: { count: 0 } }, { [KIND]: { count: 1, widthM: 5 } }]) assert.equal(rule(gameWith([]), objects), null, JSON.stringify(objects))
    assert.deepEqual(objectInvolvementOf(gameWith([]), index), [{ kind: KIND, needed: 0, elements: [], unsettled: null }])
    const one = gameWith([{ elementId: 'TEST-TARGET', kind: KIND }])
    assert.deepEqual(objectInvolvementOf(one, index), [{ kind: KIND, needed: 1, elements: ['TEST-TARGET'], unsettled: null }])
    assert.deepEqual(pick(rule(one, undefined)), { cause: 'OBJECT_AVAILABILITY_NOT_STATED', asks: 'AVAILABILITY', needed: 1 })
    assert.deepEqual(pick(rule(one, { cones: { count: 3 } })), { cause: 'OBJECT_AVAILABILITY_NOT_STATED', asks: 'AVAILABILITY', needed: 1 }, 'another kind says nothing of this one')
    assert.deepEqual(pick(rule(one, { [KIND]: { count: 0 } })), { cause: 'OBJECT_AVAILABILITY_SHORT', needed: 1, available: 0 })
    assert.deepEqual(pick(rule(one, { [KIND]: { count: 1 } })), { cause: 'OBJECT_AVAILABILITY_NOT_STATED', asks: 'WIDTH', needed: 1 })
    assert.deepEqual(pick(rule(one, { [KIND]: { count: 1, widthM: 5 } })), { cause: 'OBJECT_NOT_SUITABLE', needed: 1, available: 1, widthM: 5, decided: false }, 'no authorized suitability: none suits')
    assert.deepEqual(pick(rule(one, { [KIND]: { count: 1, widthM: 12 } }, suitable(1, 10))), { cause: 'OBJECT_NOT_SUITABLE', needed: 1, available: 1, widthM: 12, decided: true })
    assert.deepEqual(pick(rule(one, { [KIND]: { count: 1, widthM: 0.5 } }, suitable(1, null))), { cause: 'OBJECT_NOT_SUITABLE', needed: 1, available: 1, widthM: 0.5, decided: true })
    assert.equal(rule(one, { [KIND]: { count: 1, widthM: 5 } }, suitable(1, 10)), null)
    assert.equal(rule(one, { [KIND]: { count: 3, widthM: 5 } }, suitable(null, 5)), null, 'more available than needed covers it')
    // An element counts as many objects as its count row says; a count that is no whole number leaves the need unsettled.
    const two = gameWith([{ elementId: 'TEST-TARGET', kind: KIND, count: 2 }])
    assert.deepEqual(pick(rule(two, { [KIND]: { count: 1, widthM: 5 } }, suitable(1, 10))), { cause: 'OBJECT_AVAILABILITY_SHORT', needed: 2, available: 1 })
    assert.deepEqual(pick(rule(gameWith([{ elementId: 'TEST-TARGET', kind: KIND, count: 'two' }]), { [KIND]: { count: 5, widthM: 5 } })), { cause: 'OBJECT_INVOLVEMENT_NOT_SETTLED' })
    // The rule reads and never writes: the game, the envelope and the contracts are what they were (it never adds an object or a performer).
    const game = gameWith([{ elementId: 'TEST-TARGET', kind: KIND }])
    const envelope = { players: 12, roles: { [KEEPER]: 1 }, objects: { [KIND]: { count: 2, widthM: 5 } } }
    const contracts = suitable(1, 10)
    const before = JSON.stringify([game, envelope, contracts])
    objectAvailabilityRefusal(index, game, envelope, contracts)
    assert.equal(JSON.stringify([game, envelope, contracts]), before)
    // A register without the block: no session resource, nothing asked.
    const without = copy(register)
    delete without.sessionResources
    assert.equal(objectAvailabilityRefusal(indexRegister(without), one, {}, []), null)
})
function pick(refusal: any): any {
    if (!refusal) return refusal
    const { why: _why, kind, ...rest } = refusal
    assert.equal(kind, KIND)
    return rest
}

// ── 4. A variant realization, composed ───────────────────────────────────────────────────────────────────
const GF2 = 'restated:GF2'
const RPC = 'restated:RPC-001'
const SUPERSEDED = [`${GF2}::GF2-19`, `${GF2}::GF2-03.b`, `${GF2}::GF2-06.a`, `${RPC}::RPC-001-08.a`]
/** The design's F2 withdrawals from A01-R1, TEST-ONLY here. */
const WITHDRAW = ['A01-R1-S5-3', 'A01-R1-S5-4', 'A01-R1-V27-1', 'A01-R1-V29-1', 'A01-R1-V30-1', 'A01-R1-V31-1', 'A01-R1-T4-4']
const REL = { id: 'TEST-ONLY-SCORING', category: 'CONTEXT_SCORING_RELATIONSHIP', contextId: 'RPC-001', contextName: 'TEST-ONLY', scoringEvent: 'goal', role: 'PRESSING', rows: ['B9', 'J2'], supersedes: SUPERSEDED, via: ['TEST-ONLY'], identified: 'TEST-ONLY', status: 'CONFIRMED', confirmedOn: 'TEST-ONLY', confirmedBy: 'TEST-ONLY', citedAs: 'TEST-ONLY', words: ['TEST-ONLY'], note: null }
const V = 'A01-RT'
const item = (id: string, row: string, selector: string, requirement: string, value: unknown, extra: Record<string, unknown> = {}) => ({
    id: `${V}-${id}`,
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
interface VariantOptions {
    exchanged?: boolean
    suitability?: { min: number | null; max: number | null } | null
    areas?: { lengthM: number; widthM: number }[]
    notWith?: { id: string; basis: string; because: string }[]
}
/** A TEST-ONLY copy of the provisional realizations file holding the goal version of A01-R1 as a variant (the design's F2, every value TEST-ONLY). */
const variantFile = (options: VariantOptions = {}) => {
    const file = copy(readJson(PROVISIONAL_REALIZATIONS_FILE))
    const base = file.realizations.find((r: any) => r.id === 'A01-R1')
    const variant: any = {
        id: V,
        contractId: `provisional:${V}`,
        category: 'PROVISIONAL_REALIZATION_CHOICE',
        realizes: base.realizes,
        ruledOn: 'TEST-ONLY',
        by: 'TEST-ONLY',
        citedAs: 'TEST-ONLY',
        words: ['TEST-ONLY'],
        realizationChoices: base.realizationChoices,
        notWithPracticeSituations: options.notWith ?? copy(base.notWithPracticeSituations),
        testingBoundaries: copy(options.areas ? { ...base.testingBoundaries, areas: options.areas } : base.testingBoundaries),
        declarations: [],
        relationshipRules: [],
        basedOn: 'A01-R1',
        withdraws: WITHDRAW.map(id => ({ item: id, because: 'TEST-ONLY' })),
        items: [
            item('GOAL', 'O1', `kind=${KIND}`, 'EXISTS', 'N/A'),
            item('GOAL-ALONG', 'O4', `kind=${KIND}`, 'POSITIONED', { term: 'own end (of team T)', forTeam: 'ROLE_HOLDER_BUILDING', offsetM: { from: 0, to: 0 }, asAuthored: 'TEST-ONLY' }),
            item('GOAL-ACROSS', 'O5', `kind=${KIND}`, 'POSITIONED', { term: 'central', asAuthored: 'TEST-ONLY' }),
            item('J2-END', 'J2', 'role=PRIMARY_SCORING & team=TEAM_AT_AXIS_END', 'EQUALS', { structuralRef: { contractId: `provisional:${V}`, itemId: `${V}-GOAL` }, asAuthored: 'TEST-ONLY' }, { authorizedBy: REL.id }),
            item('B9-PRESSING', 'B9', 'activityRole=PRESSING', 'EQUALS', 'goal', { authorizedBy: REL.id }),
            ...(options.exchanged === false ? [] : [item('B10', 'B10', '*', 'EQUALS', 'EXCHANGED')]),
        ],
    }
    if (options.suitability !== null) {
        const range = options.suitability ?? { min: 1, max: 10 }
        variant.objectSuitability = [{ kind: KIND, widthM: range, ruledOn: 'TEST-ONLY', by: 'TEST-ONLY', citedAs: 'TEST-ONLY', words: ['TEST-ONLY'] }]
    }
    file.realizations.push(variant)
    return file
}

test('a variant equals its base minus its withdrawals plus its additions, element for element, its references re-pointed to it', () => {
    const file = variantFile()
    assert.deepEqual(validateProvisionalRealizations(file), [], 'the TEST-ONLY variant passes the gate')
    const loaded = loadProvisionalRealizations(file)
    const base = loaded.find(r => r.provisionalId === 'A01-R1')!
    const variant = loaded.find(r => r.provisionalId === V)!
    assert.deepEqual(base, provisionalRealizationNamed('A01-R1'), 'the base is loaded exactly as the file holds it')
    const repoint = (value: unknown) => JSON.parse(JSON.stringify(value).split('"contractId":"provisional:A01-R1"').join(`"contractId":"provisional:${V}"`))
    const expected = [
        ...base.items.filter(i => !WITHDRAW.includes(i.itemId)).map(repoint),
        ...file.realizations.find((r: any) => r.id === V).items.map(({ id, ...rest }: any) => ({ itemId: id, ...rest })),
    ]
    assert.deepEqual(variant.items, expected)
    assert.equal(variant.items.length, base.items.length - WITHDRAW.length + 6)
    assert.deepEqual([variant.basedOn, variant.withdrawn!.map(w => w.itemId)], ['A01-R1', WITHDRAW])
    // A kept item's reference to another item of its base reads as a reference in the variant; none still names the base.
    assert.ok(!JSON.stringify(variant.items).includes('"contractId":"provisional:A01-R1"'))
    assert.ok(JSON.stringify(variant.items).includes(`"contractId":"provisional:${V}"`))
    assert.deepEqual(variant.objectSuitability![0].widthM, { min: 1, max: 10 })
    // Production holds no variant and no suitability.
    assert.ok(loadProvisionalRealizations().every(r => r.basedOn === undefined && r.objectSuitability === undefined))
})

test('the integrity gate refuses a variant that would drop, duplicate or dangle, and a suitability without his words', () => {
    const errorsOf = (damage: (variant: any, file: any) => void) => {
        const file = variantFile()
        damage(file.realizations.find((r: any) => r.id === V), file)
        return validateProvisionalRealizations(file).filter(error => error.includes(V))
    }
    const refusedFor = (damage: (variant: any, file: any) => void, why: RegExp, label: string) => assert.ok(errorsOf(damage).some(error => why.test(error)), `${label}: ${errorsOf(damage).join(' | ')}`)
    refusedFor(v => (v.basedOn = 'TEST-ONLY'), /is based on "TEST-ONLY", which is no other realization of the file/, 'an unknown base')
    refusedFor(v => (v.basedOn = V), /which is no other realization of the file/, 'itself as its base')
    refusedFor((_v, f) => f.realizations.push({ ...copy(f.realizations.find((r: any) => r.id === V)), id: 'A01-RU', contractId: 'provisional:A01-RU', basedOn: V, withdraws: [], items: [{ ...item('X', 'S2', '*', 'EXISTS', 'N/A'), id: 'A01-RU-X' }] }), /is based on A01-RT, which is itself a variant/, 'a chain')
    refusedFor(v => (v.realizes = 'TEST-ONLY'), /its base A01-R1 realizes/, 'another context')
    refusedFor(v => v.withdraws.push({ item: 'A01-R1-TEST-ONLY', because: 'TEST-ONLY' }), /withdraws A01-R1-TEST-ONLY, which is no item of A01-R1/, 'withdrawing nothing')
    refusedFor(v => v.withdraws.push({ item: WITHDRAW[0], because: 'TEST-ONLY' }), /withdraws A01-R1-S5-3 twice/, 'withdrawing twice')
    refusedFor(v => (v.withdraws[0].because = ''), /must name the item and say why/, 'a withdrawal without why')
    refusedFor(v => ((v.withdraws = []), (v.items = [])), /withdraws nothing from A01-R1 and adds nothing to it/, 'a second name')
    refusedFor(v => v.items.push({ ...item('X', 'S2', '*', 'EXISTS', 'N/A'), id: `${V}-GOAL` }), /is defined twice|carry A01-RT-GOAL twice/, 'an id twice')
    // A kept item referring to a withdrawn one: A01-R1-P10-1 and its kin place teams relative to the target region A01-R1-S2-1.
    refusedFor(v => v.withdraws.push({ item: 'A01-R1-S2-1', because: 'TEST-ONLY' }), /refers to A01-R1-S2-1, which it withdraws/, 'a dangling reference')
    refusedFor(v => v.items.push(item('REF', 'P10', '*', 'EQUALS', { structuralRef: { contractId: 'provisional:A01-R1', itemId: 'A01-R1-NOT-THERE' } })), /refers to A01-R1-NOT-THERE, which its composed items do not hold/, 'a reference to nothing')
    {
        const file = variantFile()
        file.realizations.find((r: any) => r.id === 'A01-R1').withdraws = []
        assert.ok(validateProvisionalRealizations(file).some(error => /realization A01-R1 withdraws items and is based on no realization/.test(error)), 'a withdrawal on no variant')
    }
    refusedFor(v => (v.objectSuitability[0].words = []), /object suitability 1 does not quote him/, 'suitability without his words')
    refusedFor(v => (v.objectSuitability[0].kind = 'ball'), /speaks of "ball", which is no kind a session states its availability of/, 'suitability of an unlisted kind')
    refusedFor(v => (v.objectSuitability[0].widthM = { min: 10, max: 1 }), /must state a width range in metres/, 'an inverted range')
    refusedFor(v => (v.objectSuitability[0].widthM = { min: null, max: null }), /must state a width range in metres/, 'no bound')
    refusedFor(v => v.objectSuitability.push(copy(v.objectSuitability[0])), /speaks of goal a second time/, 'one kind twice')
    assert.throws(() => loadProvisionalRealizations((() => { const f = variantFile(); f.realizations.find((r: any) => r.id === V).basedOn = 'TEST-ONLY'; return f })()), /failed its integrity gate/)
})

// ── 5. The record's ordered alternatives ─────────────────────────────────────────────────────────────────
const IDS = [...loadProvisionalRealizations(variantFile()).map(r => r.provisionalId)]
const recordsWith = (alternatives: Record<string, unknown>[], keepSingle = false): LearningGoalAuthorization[] => {
    const records = learningGoalAuthorizations()
    const a01 = records.find(r => r.learningGoalId === 'A01')!
    if (!keepSingle) delete a01.provisionalRealization
    ;(a01 as any).realizations = alternatives
    return records
}
const PREFERRED = { realization: V, words: 'TEST-ONLY: the goal version when a suitable goal is available', citedAs: 'TEST-ONLY' }
const SECOND = { realization: 'A01-R1', words: 'TEST-ONLY: the zone version otherwise', citedAs: 'TEST-ONLY' }

test("a record's alternatives are read whole or refused; its single realization reads as a list of one", () => {
    assert.deepEqual(validateLearningGoalAuthorizations(recordsWith([PREFERRED, SECOND]), undefined, undefined, IDS), [])
    const errors = (alternatives: Record<string, unknown>[], keepSingle = false) => validateLearningGoalAuthorizations(recordsWith(alternatives, keepSingle), undefined, undefined, IDS).join(' | ')
    assert.match(errors([PREFERRED, SECOND], true), /names its realizations twice/)
    assert.match(errors([]), /lists no realization/)
    assert.match(errors([{ ...PREFERRED, realization: 'TEST-ONLY' }, SECOND]), /names the provisional realization TEST-ONLY, which provisional-realizations\.json does not hold/)
    assert.match(errors([PREFERRED, PREFERRED]), /names A01-RT a second time/)
    assert.match(errors([{ ...PREFERRED, words: '' }, SECOND]), /does not quote him for its place in the order/)
    assert.match(errors([{ ...PREFERRED, status: 'MISSING_KNOWLEDGE', gaps: [] }, SECOND]), /is MISSING_KNOWLEDGE and names no decision or capability/)
    assert.match(errors([{ ...PREFERRED, status: 'MISSING_KNOWLEDGE', gaps: ['TEST-ONLY'] }, SECOND]), /names the gap TEST-ONLY, which the record does not define/)
    assert.match(errors([{ ...PREFERRED, status: 'NOT_SELECTED_FOR_FIRST_DEMO', gaps: [] }, SECOND]), /an alternative is AUTHORIZED_BY_RULING or waits on a gap/)
    assert.match(errors([{ ...PREFERRED, status: 'MISSING_KNOWLEDGE', gaps: ['D1'] }]), /no alternative realization it lists can be tried/)
    // Production: one realization, read as a list of one, tried.
    const a01 = learningGoalAuthorizations().find(r => r.learningGoalId === 'A01')!
    assert.deepEqual(realizationAlternativesOf(a01), [{ realization: 'A01-R1', words: null, citedAs: null, selectable: true, status: null, gaps: [] }])
    assert.ok(learningGoalAuthorizations().every(r => r.realizations === undefined), 'no production record lists alternatives')
    assert.deepEqual(
        realizationAlternativesOf(recordsWith([{ ...PREFERRED, status: 'MISSING_KNOWLEDGE', gaps: ['D1'] }, SECOND]).find(r => r.learningGoalId === 'A01')).map(a => [a.realization, a.selectable, a.gaps]),
        [[V, false, ['D1']], ['A01-R1', true, []]],
    )
})

// ── 6. The alternative being tried reaches every reader ──────────────────────────────────────────────────
test('the alternative being tried reaches derivation and the realization choices; absent, the record\'s preferred one', () => {
    const selection = selectFor('A01', null)
    const [variant] = loadProvisionalRealizations(variantFile()).filter(r => r.provisionalId === V)
    const contractIds = (s: any) => derivationInputFor(s).contracts.map((c: any) => c.contractId).filter((id: string) => id.startsWith('provisional:'))
    assert.deepEqual(contractIds(selection), ['provisional:A01-R1'], 'absent: the preferred (and only) realization of the record')
    assert.equal(realizationOf(selection)!.provisionalId, 'A01-R1')
    assert.deepEqual(contractIds({ ...selection, realization: variant }), [`provisional:${V}`], 'threaded: the variant, and not its base')
    assert.deepEqual(contractIds({ ...selection, realization: null }), [], 'threaded null: none')
    const fromOf = (s: any) => {
        const supplied = suppliedRealizationFor(s)
        assert.ok(!isNoSuppliedRealization(supplied))
        return (supplied as SuppliedRealization).from
    }
    assert.ok(fromOf(selection).includes('realization-choices-a01-r1.json'))
    assert.ok(!fromOf({ ...selection, realization: { ...variant, realizationChoices: null } }).includes('realization-choices-a01-r1.json'), 'the threaded realization\'s choices, not the record\'s')
    assert.ok(!fromOf({ ...selection, realization: null }).includes('realization-choices-a01-r1.json'))
})

// ── 7. The build's loop (TEST-ONLY records and realizations) ─────────────────────────────────────────────
interface LoopOptions extends VariantOptions {
    alternatives?: Record<string, unknown>[]
    situationId?: string
    seen?: string[]
    /** A TEST-ONLY authored comparison attached in memory to one of the variant's items: a real post-realization break of the variant alone. */
    comparison?: Record<string, unknown>
}
/** The goal version tried first and the zone version second, each built whole; the GF2 markers and the scoring relationship TEST-ONLY. */
const loopBuild = (session: any, options: LoopOptions = {}) => {
    const read = authorizationRecords.contextRelationships
    ;(authorizationRecords as any).contextRelationships = () => [...read(), copy(REL)]
    try {
        return buildActivityUnderAuthorizationRecords({ kind: 'learning-goal', goalId: 'A01', situationId: options.situationId ?? null, session }, recordsWith(options.alternatives ?? [PREFERRED, SECOND]), {
            realizations: loadProvisionalRealizations(variantFile(options)),
            // The GF2 markers stay inert for A01-R1, whose items cite no scoring relationship (asserted below: it is served as production).
            alter: contracts => {
                const gf2 = contracts.find(c => c.contractId === GF2)!
                const of = (id: string, contract = gf2) => contract.items.find(i => i.itemId === id)! as any
                of('GF2-08.f').defersTo = DEFERS_TO_AUTHORIZED_REALIZATION
                of('GF2-03.e').defersWith = 'GF2-08.f'
                for (const key of SUPERSEDED) of(key.split('::')[1], contracts.find(c => c.contractId === key.split('::')[0])!).yieldsForRole = 'AUTHORIZED_ROLE_SCORING'
                const variant = contracts.find(c => c.contractId === `provisional:${V}`)
                if (options.comparison && variant) of(`${V}-B9-PRESSING`, variant).comparison = copy(options.comparison)
            },
            // The variant's own choices file is the design's F2: here A01-R1's, re-pointed to the variant and without the yielding region's.
            alterSupplied: (supplied, realization) => {
                options.seen?.push(realization?.provisionalId ?? 'none')
                if (realization?.provisionalId !== V) return
                const repoint = (text: unknown) => (typeof text === 'string' ? text.split('c:provisional:A01-R1:').join(`c:provisional:${V}:`) : text)
                supplied.choices = supplied.choices.filter(choice => !choice.lineId.includes('GF2-03.e')).map(choice => ({ ...choice, lineId: String(repoint(choice.lineId)), ...((choice as any).path ? { path: repoint((choice as any).path) } : {}) }) as any)
            },
            review: { includeDrafts: true },
        })
    } finally {
        ;(authorizationRecords as any).contextRelationships = read
    }
}
const outcomesOf = (activity: any) => (activity.account.realizationSelection as any[]).map(entry => [entry.realization, entry.outcome, entry.cause])
const GOAL_STATED = { [KIND]: { count: 1, widthM: 5 } }
const production = buildActivityForReview({ kind: 'learning-goal', goalId: 'A01', situationId: null, session: sessionOf(1) } as any, { includeDrafts: true }) as ServedActivity
const ACCOUNT_KEYS_BEFORE_E = Object.keys(production.account).filter(key => key !== 'realizationSelection').sort()

test('goals = 0 serves A01-R1 with only the recorded delta: the session it echoes, and the account and evidence naming the realization used', () => {
    const kindsOf = (fixture: any) => (fixture.roleBlocks.blocks as any[]).map(block => (block.fixture.game.objects as any[]).map(object => object.kind))
    const productionKinds = kindsOf(buildActivityUnderAuthorizationRecords({ kind: 'learning-goal', goalId: 'A01', session: sessionOf(1) }, learningGoalAuthorizations()).fixture)
    for (const objects of [{ [KIND]: { count: 0 } }, GOAL_STATED]) {
        const stated = buildActivityForReview({ kind: 'learning-goal', goalId: 'A01', situationId: null, session: sessionOf(1, objects) } as any, { includeDrafts: true }) as ServedActivity
        assert.equal(stated.outcome, 'served', JSON.stringify(objects))
        assert.deepEqual(stated.session.objects, objects)
        for (const key of ['rendered', 'overview', 'diagram', 'roleBlocks', 'integrity', 'title', 'subtitle'] as const) assert.deepEqual(stated[key], production[key], `${JSON.stringify(objects)}: ${key}`)
        assert.deepEqual(stated.account, production.account, `${JSON.stringify(objects)}: the account`)
        // The rule never adds a goal: each block's game holds only the object it held (the one no objective references), none of the kind.
        const kinds = kindsOf(buildActivityUnderAuthorizationRecords({ kind: 'learning-goal', goalId: 'A01', session: sessionOf(1, objects) }, learningGoalAuthorizations()).fixture)
        assert.deepEqual(kinds, productionKinds)
        assert.ok(kinds.every(list => !list.includes(KIND)), JSON.stringify(kinds))
    }
    // The recorded delta on production itself: the account and the evidence name the one realization, used.
    assert.deepEqual(outcomesOf(production), [['A01-R1', 'SELECTED', null]])
    assert.deepEqual(production.evidence!.pathway.facts[production.evidence!.pathway.facts.length - 1], { what: 'the realizations the record authorizes, in its order, and whether each was used (account.realizationSelection)', value: ['A01-R1: SELECTED'] })
    assert.ok(ACCOUNT_KEYS_BEFORE_E.length > 0 && !ACCOUNT_KEYS_BEFORE_E.includes('realizationSelection'))
})

test('the TEST-ONLY preferred alternative needing a goal falls back to A01-R1 where no goal is available, and A01-R1 is served exactly as production', () => {
    const seen: string[] = []
    const built = loopBuild(sessionOf(1, { [KIND]: { count: 0 } }), { seen })
    const served = built.activity as ServedActivity
    assert.equal(served.outcome, 'served', (built.activity as RefusedActivity).reasons?.join(' | '))
    assert.deepEqual(outcomesOf(served), [[V, 'NOT_APPLICABLE', 'OBJECT_AVAILABILITY_SHORT'], ['A01-R1', 'SELECTED', null]])
    assert.equal((served.account.realizationSelection as any[])[0].summary, `This game needs 1 ${KIND} and the session has 0.`)
    for (const key of ['rendered', 'overview', 'diagram', 'integrity'] as const) assert.deepEqual(served[key], production[key], key)
    // The alternative id reached every reader: the variant was tried (its choices altered for it alone), then A01-R1, whose game was built.
    assert.ok(seen.length > 0 && seen.every(id => id === 'A01-R1'), `the variant stopped before realization, A01-R1 was realized: ${seen.join(', ')}`)
    // Each block's game is A01-R1's: its elements are A01-R1's own, and none is the variant's.
    for (const block of (built.fixture as any).roleBlocks.blocks as any[]) {
        const game = JSON.stringify(block.fixture.game)
        assert.ok(game.includes('c:provisional:A01-R1:') && !game.includes(`c:provisional:${V}:`), block.blockId)
    }
    assert.ok(served.account.authorizationLists!.provisionalChoices.filter(entry => entry.from === 'provisional realization').every(entry => entry.sources.every(s => s.startsWith('provisional:A01-R1::'))))
    // The evidence names both, in order.
    const fact = served.evidence!.pathway.facts[served.evidence!.pathway.facts.length - 1]
    assert.deepEqual(fact.value, [`${V}: NOT_APPLICABLE (OBJECT_AVAILABILITY_SHORT) at session: This game needs 1 ${KIND} and the session has 0.; its place in the order: TEST-ONLY`, 'A01-R1: SELECTED; its place in the order: TEST-ONLY'])
    // A goal his words for the realization do not admit (decided) is the same fallback, typed NOT_SUITABLE.
    assert.deepEqual(outcomesOf(loopBuild(sessionOf(1, { [KIND]: { count: 1, widthM: 12 } })).activity), [[V, 'NOT_APPLICABLE', 'OBJECT_NOT_SUITABLE'], ['A01-R1', 'SELECTED', null]])
    // With no suitability recorded, too few goals is still a shortfall, said before suitability is read: the fallback, typed SHORT.
    assert.deepEqual(outcomesOf(loopBuild(sessionOf(1, { [KIND]: { count: 0 } }), { suitability: null }).activity), [[V, 'NOT_APPLICABLE', 'OBJECT_AVAILABILITY_SHORT'], ['A01-R1', 'SELECTED', null]])
})

test('suitability nobody has decided is a knowledge gap, not a shortfall: it refuses the activity instead of falling back (the stage E fix)', () => {
    // His decision 4 is open: a selectable alternative whose objects nobody has said suit it is refused at knowledge, typed as nothing, and
    // nothing behind it is tried. (Before the fix it was typed NOT_SUITABLE and fell back quietly to A01-R1, visible only in the account.)
    const undecided = loopBuild(sessionOf(1, GOAL_STATED), { suitability: null }).activity as RefusedActivity
    assert.deepEqual([undecided.outcome, undecided.stage, undecided.summary], ['refused', 'knowledge', `Which ${KIND}s suit this game has not been decided yet.`], undecided.reasons?.join(' | '))
    assert.ok(!undecided.question, 'nothing is asked of the coach: the session cannot cure it')
    assert.deepEqual(outcomesOf(undecided), [[V, 'REFUSED', null], ['A01-R1', 'NOT_TRIED', null]])
    assert.ok(undecided.reasons.some(reason => reason.includes('(OBJECT_NOT_SUITABLE)') && reason.includes('decision 4')), undecided.reasons.join(' | '))
    // The way to list such an alternative until he decides: waiting on its gap, never tried, and the zone version served.
    const waiting = loopBuild(sessionOf(1, GOAL_STATED), { suitability: null, alternatives: [{ ...PREFERRED, status: 'MISSING_KNOWLEDGE', gaps: ['D1'] }, SECOND] }).activity as ServedActivity
    assert.equal(waiting.outcome, 'served')
    assert.deepEqual(outcomesOf(waiting), [[V, 'NOT_SELECTABLE', 'MISSING_KNOWLEDGE'], ['A01-R1', 'SELECTED', null]])
})

test('availability not stated: the build asks, and nothing behind the preferred alternative is tried', () => {
    for (const [objects, asks] of [[undefined, 'AVAILABILITY'], [{ [KIND]: { count: 1 } }, 'WIDTH']] as const) {
        const seen: string[] = []
        const refused = loopBuild(sessionOf(1, objects as any), { seen }).activity as RefusedActivity
        assert.equal(refused.outcome, 'refused')
        assert.equal(refused.stage, 'session')
        assert.equal(refused.summary, objectAvailabilityQuestion(KIND, asks))
        assert.deepEqual(refused.question, { kind: 'OBJECT_AVAILABILITY', objectKind: KIND, asks, words: refused.summary, status: 'DRAFT' })
        assert.deepEqual(outcomesOf(refused), [[V, 'ASKED', 'OBJECT_AVAILABILITY_NOT_STATED'], ['A01-R1', 'NOT_TRIED', null]])
        assert.ok(!seen.length, 'asked before realization: no realization input was read')
        // The live route passes the question on beside its sentence.
        assert.deepEqual(liveRefusalBody(refused, null), { error: refused.summary, resolutionStatus: 'refused', question: refused.question })
    }
    // Production A01 never asks: its game holds no object of the kind.
    assert.equal(production.outcome, 'served')
})

test('a structural break, or any other refusal, of the preferred alternative refuses the activity instead of falling back', () => {
    // Fixed ends (KEPT): the second block's pressing role holds a region with a goal event - GA-ROLE-EVENTS, before realization.
    const kept = loopBuild(sessionOf(1, GOAL_STATED), { exchanged: false }).activity as RefusedActivity
    assert.deepEqual([kept.outcome, kept.stage], ['refused', 'structure'], kept.reasons.join(' | '))
    assert.ok(kept.reasons.some(reason => reason.endsWith('GA-ROLE-EVENTS')), kept.reasons.join(' | '))
    assert.deepEqual(outcomesOf(kept), [[V, 'REFUSED', null], ['A01-R1', 'NOT_TRIED', null]])
    // Even with no goal stated, a block that breaks structurally keeps the activity refused (the other block's question does not decide it).
    assert.deepEqual(outcomesOf(loopBuild(sessionOf(1), { exchanged: false }).activity), [[V, 'REFUSED', null], ['A01-R1', 'NOT_TRIED', null]])
    // Exchanged ends: every gate passes and the goal version still has no approved words (Stage G) - refused at communication, never the zone version.
    const words = loopBuild(sessionOf(1, GOAL_STATED)).activity as RefusedActivity
    assert.deepEqual([words.outcome, words.stage], ['refused', 'communication'], words.reasons.join(' | '))
    assert.deepEqual(outcomesOf(words), [[V, 'REFUSED', null], ['A01-R1', 'NOT_TRIED', null]])
    // The refusal is the variant's own: its game holds the variant's elements (the id reached derivation), and its lists are the variant's.
    assert.ok(words.reasons.some(reason => reason.includes(`objects[c:provisional:${V}:${V}-GOAL]`)), words.reasons.join(' | '))
    assert.ok(words.account.authorizationLists!.provisionalChoices.some(entry => entry.sources.some(s => s === `provisional:${V}::${V}-GOAL`)))
    assert.ok(words.evidence!.pathway.facts.some(fact => JSON.stringify(fact.value).includes(`${V}: REFUSED at communication`)))
})

test('goalkeepers = 0: the existing roster refusal, naming each alternative\'s need', () => {
    for (const [objects, first] of [[GOAL_STATED, 'AVAILABILITY_SHORT'], [{ [KIND]: { count: 0 } }, 'OBJECT_AVAILABILITY_SHORT']] as const) {
        const refused = loopBuild(sessionOf(0, objects as any)).activity as RefusedActivity
        assert.deepEqual([refused.outcome, refused.stage, refused.summary], ['refused', 'session', `This game needs 1 ${KEEPER} in all and the session has 0.`])
        assert.deepEqual(outcomesOf(refused), [[V, 'NOT_APPLICABLE', first], ['A01-R1', 'NOT_APPLICABLE', 'AVAILABILITY_SHORT']])
        assert.equal(refused.reasons[0], 'none of the 2 realizations the authorization record of A01 authorizes applies to this session; each was tried in its order')
        assert.ok(refused.reasons.some(reason => reason.startsWith('A01-R1: ') && reason.includes(`roster (AVAILABILITY_SHORT): the game involves 1 ${KEEPER}`)), refused.reasons.join(' | '))
        const need = first === 'AVAILABILITY_SHORT' ? `roster (AVAILABILITY_SHORT): the game involves 1 ${KEEPER}` : '(OBJECT_AVAILABILITY_SHORT)'
        assert.ok(refused.reasons.some(reason => reason.startsWith(`${V}: `) && reason.includes(need)), refused.reasons.join(' | '))
    }
    // Production A01 (one realization): the refusal is exactly its own, and the account says why it was not used.
    const zero = buildActivityForReview({ kind: 'learning-goal', goalId: 'A01', situationId: null, session: sessionOf(0) } as any, { includeDrafts: false }) as RefusedActivity
    assert.equal(zero.summary, `This game needs 1 ${KEEPER} in all and the session has 0.`)
    assert.ok(!zero.reasons.some(reason => reason.startsWith('none of the')))
    assert.deepEqual(outcomesOf(zero), [['A01-R1', 'NOT_APPLICABLE', 'AVAILABILITY_SHORT']])
})

test('the testing area and the practice situation are typed applicability refusals; an alternative waiting on a gap is listed and never tried', () => {
    const area = loopBuild(sessionOf(1, GOAL_STATED), { areas: [{ lengthM: 50, widthM: 30 }] }).activity as ServedActivity
    assert.equal(area.outcome, 'served')
    assert.deepEqual(outcomesOf(area), [[V, 'NOT_APPLICABLE', 'TESTING_AREA'], ['A01-R1', 'SELECTED', null]])
    // A practice situation neither was designed for: each is typed, and the activity is refused in the last one's words.
    const situation = loopBuild(sessionOf(1, GOAL_STATED), { situationId: 'A01-02' }).activity as RefusedActivity
    assert.deepEqual([situation.outcome, situation.stage], ['refused', 'knowledge'])
    assert.deepEqual(outcomesOf(situation), [[V, 'NOT_APPLICABLE', 'PRACTICE_SITUATION'], ['A01-R1', 'NOT_APPLICABLE', 'PRACTICE_SITUATION']])
    // Refused in the last alternative's words, with its lists (read for the realization tried, never the record's preferred one).
    const listed = situation.account.authorizationLists!.provisionalChoices.filter(entry => entry.from === 'provisional realization').flatMap(entry => entry.sources)
    assert.ok(listed.length > 0 && listed.every(source => source.startsWith('provisional:A01-R1::')), listed.join(', '))
    // Designed for it here (TEST-ONLY), the variant is tried; refused at communication, nothing behind it is tried.
    assert.deepEqual(outcomesOf(loopBuild(sessionOf(1, GOAL_STATED), { situationId: 'A01-02', notWith: [] }).activity)[0], [V, 'REFUSED', null])
    // Waiting on a gap: listed, never tried.
    const seen: string[] = []
    const gap = loopBuild(sessionOf(1, GOAL_STATED), { alternatives: [{ ...PREFERRED, status: 'MISSING_KNOWLEDGE', gaps: ['D1'] }, SECOND], seen }).activity as ServedActivity
    assert.equal(gap.outcome, 'served')
    assert.deepEqual(outcomesOf(gap), [[V, 'NOT_SELECTABLE', 'MISSING_KNOWLEDGE'], ['A01-R1', 'SELECTED', null]])
    assert.deepEqual((gap.account.realizationSelection as any[])[0].gaps, ['D1'])
    assert.ok(!seen.includes(V), 'never tried')
})

// ── 9. The stage E fix ───────────────────────────────────────────────────────────────────────────────────
const rowAt = (path: string): string => String(register.rows.find((row: any) => row.path === path)!.id)
/** A TEST-ONLY authored comparison the concrete game violates (its length is not less than its width): a real break, after realization. */
const VIOLATED = { left: { row: rowAt('envelope.area.length_m') }, operator: '<', right: { row: rowAt('envelope.area.width_m') } }

test('a staffing shortfall beside a real break refuses the activity instead of falling back (the stage E fix)', () => {
    // The break alone: the variant is refused at validation, nothing behind it tried.
    const alone = loopBuild(sessionOf(1, GOAL_STATED), { comparison: VIOLATED }).activity as RefusedActivity
    assert.deepEqual([alone.outcome, alone.stage], ['refused', 'validation'], alone.reasons.join(' | '))
    assert.ok(alone.reasons.some(reason => reason.includes(`an authored comparison does not hold of the concrete game: provisional:${V}::${V}-B9-PRESSING`)), alone.reasons.join(' | '))
    assert.deepEqual(outcomesOf(alone), [[V, 'REFUSED', null], ['A01-R1', 'NOT_TRIED', null]])
    // The break beside a goalkeeper shortfall: still refused, never typed AVAILABILITY_SHORT, so the build does not move on with it hidden.
    const both = loopBuild(sessionOf(0, GOAL_STATED), { comparison: VIOLATED }).activity as RefusedActivity
    assert.equal(both.outcome, 'refused')
    assert.deepEqual(outcomesOf(both), [[V, 'REFUSED', null], ['A01-R1', 'NOT_TRIED', null]])
    assert.ok(both.reasons.some(reason => reason.includes('an authored comparison does not hold of the concrete game')), both.reasons.join(' | '))
    assert.ok(both.reasons.some(reason => reason.includes(`roster (AVAILABILITY_SHORT): the game involves 1 ${KEEPER}`)), both.reasons.join(' | '))
    assert.ok(!both.reasons.some(reason => reason.startsWith('none of the')), 'not the exhausted-alternatives refusal: A01-R1 was never tried')
    // The shortfall alone stays typed (every gate reason is a check the refused roster left unevaluable), as production at 0 does.
    assert.deepEqual(outcomesOf(loopBuild(sessionOf(0, GOAL_STATED)).activity), [[V, 'NOT_APPLICABLE', 'AVAILABILITY_SHORT'], ['A01-R1', 'NOT_APPLICABLE', 'AVAILABILITY_SHORT']])
    // The rule itself, on the gates' typed record: typed only where acceptance is clean and every reason is an owed check left unevaluable.
    const owed = (...verdicts: string[]) => verdicts.map((verdict, i) => ({ checkId: `TEST-ONLY-${i}`, clause: 'TEST-ONLY', verdict, why: '' }))
    const post = (verdicts: string[], extra = 0) => {
        const entries = owed(...verdicts)
        return { owed: entries, outstanding: [...entries.filter(e => e.verdict !== 'PASS').map(e => e.checkId), ...Array.from({ length: extra }, (_, i) => `TEST-ONLY extra ${i}`)] }
    }
    assert.equal(onlyTheRosterStopped(false, post(['NOT_EVALUABLE', 'PASS', 'STILL_NOT_EVALUABLE'])), true, 'checks left unevaluable')
    assert.equal(onlyTheRosterStopped(true, post(['NOT_EVALUABLE'])), false, 'realization acceptance found something')
    for (const verdict of ['FAIL', 'PASS_VACUOUS', 'NOT_FOUND']) assert.equal(onlyTheRosterStopped(false, post(['NOT_EVALUABLE', verdict])), false, `an owed check ${verdict}`)
    assert.equal(onlyTheRosterStopped(false, post(['NOT_EVALUABLE'], 1)), false, 'a reason beyond the owed checks')
})

test("the review page's answer reaches the build through the review route: read, laid over the stored statement, validated (the stage E fix)", () => {
    const stored = { playerCount: 12, fieldLength: '40', fieldWidth: '30', specializedRoles: { ...none, [KEEPER]: 1 } }
    const storedWith = (objects: unknown) => ({ ...stored, objects })
    const body = (objects?: unknown) => ({ learningGoalId: 'A01', durationMin: 20, ...(objects === undefined ? {} : { objects }) })
    const coachProduction = reviewActivity(stored, body()) as ServedActivity
    for (const includeDrafts of [false, true]) {
        const review = (session: Record<string, unknown>, request: Record<string, unknown>) => reviewActivity(session as any, request as any, { includeDrafts })
        const label = includeDrafts ? 'administrator' : 'coach'
        // Stored none, answered in the body: the answer is the session's statement for this review, exactly as if it were stored.
        const answered = review(stored, body({ [KIND]: { count: 0 } })) as ServedActivity
        assert.equal(answered.outcome, 'served', `${label}: ${(answered as any).summary}`)
        assert.deepEqual(answered.session.objects, { [KIND]: { count: 0 } }, `${label}: the body's answer reaches the session`)
        assert.deepEqual(answered, review(storedWith({ [KIND]: { count: 0 } }), body()), `${label}: answered = stored, key for key`)
        if (!includeDrafts) for (const key of ['rendered', 'overview', 'diagram', 'roleBlocks', 'account'] as const) assert.deepEqual(answered[key], coachProduction[key], `${label}: ${key}`)
        // Laid over a stored statement kind by kind: the answer replaces the stored statement of its kind; a kind named with null keeps it.
        assert.deepEqual((review(storedWith({ [KIND]: { count: 2, widthM: 3 } }), body({ [KIND]: { count: 1, widthM: 5 } })) as ServedActivity).session.objects, { [KIND]: { count: 1, widthM: 5 } })
        assert.deepEqual((review(storedWith({ [KIND]: { count: 2, widthM: 3 } }), body({ [KIND]: null })) as ServedActivity).session.objects, { [KIND]: { count: 2, widthM: 3 } })
        assert.deepEqual((review(storedWith({ [KIND]: { count: 2, widthM: 3 } }), body({})) as ServedActivity).session.objects, { [KIND]: { count: 2, widthM: 3 } })
        // Validated as the stored statement is, and refused at session - over a stored statement that is fine.
        const refusedFor = (answer: unknown, why: RegExp) => {
            const refused = review(storedWith({ [KIND]: { count: 0 } }), body(answer)) as RefusedActivity
            assert.deepEqual([refused.outcome, refused.stage], ['refused', 'session'], `${label} ${JSON.stringify(answer)}`)
            assert.ok(refused.reasons.some(reason => why.test(reason)), `${label} ${JSON.stringify(answer)}: ${refused.reasons.join(' | ')}`)
        }
        refusedFor({ 'TEST-ONLY-KIND': { count: 1 } }, /names a kind of equipment the activity engine does not know: TEST-ONLY-KIND/)
        refusedFor(JSON.parse('{"__proto__": {"count": 1}}'), /does not know: __proto__/)
        refusedFor({ [KIND]: { count: -1 } }, new RegExp(`The number of ${KIND}s must be a whole number, 0 or more`))
        refusedFor({ [KIND]: { count: 1, widthM: 0 } }, new RegExp(`The width of the ${KIND}s must be a number of metres, more than zero`))
        refusedFor([1], /The review's list of equipment could not be read/)
    }
    // The question and its answer, end to end over TEST-ONLY records: the request the route builds from the body reaches the loop.
    const requestFor = (objects?: unknown) => {
        const request = reviewRequestOf(stored, body(objects))
        assert.ok(!('refusal' in request), JSON.stringify(request))
        return (request as any).session
    }
    const asked = loopBuild(requestFor()).activity as RefusedActivity
    assert.deepEqual(asked.question, { kind: 'OBJECT_AVAILABILITY', objectKind: KIND, asks: 'AVAILABILITY', words: asked.summary, status: 'DRAFT' })
    // Answered "none": the preferred alternative does not apply, and the zone version is served - the question does not come back.
    const none0 = loopBuild(requestFor({ [KIND]: { count: 0 } })).activity as ServedActivity
    assert.equal(none0.outcome, 'served')
    assert.deepEqual(outcomesOf(none0), [[V, 'NOT_APPLICABLE', 'OBJECT_AVAILABILITY_SHORT'], ['A01-R1', 'SELECTED', null]])
    // Answered with a count and no width: asked again, for the width only.
    assert.equal((loopBuild(requestFor({ [KIND]: { count: 1 } })).activity as RefusedActivity).question?.asks, 'WIDTH')
    // Answered with one suitable goal: the variant is tried with it (and refused at communication until his wording, Stage G).
    assert.deepEqual(outcomesOf(loopBuild(requestFor(GOAL_STATED)).activity), [[V, 'REFUSED', null], ['A01-R1', 'NOT_TRIED', null]])
})

console.log(`session-resources.unit.ts — ${passed} passed`)
