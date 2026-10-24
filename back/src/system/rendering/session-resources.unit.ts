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
 * Every goal value, suitability, variant and alternative list here is TEST-ONLY and in memory: no production file is written. Since Stage
 * F (26 October 2026) production holds its own goal version (A01-R2, listed waiting on his open decisions; goal-version-knowledge.unit.ts);
 * the TEST-ONLY variant here (A01-RT) is a separate copy and the assertions on production say so where they changed.
 *
 * Run: npx ts-node --files -r tsconfig-paths/register ./src/system/rendering/session-resources.unit.ts
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

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
import { objectAvailabilityQuestion, sessionEnvelopeFrom, sessionResourceAttributes, sessionResourceKinds, specializedRoleNames } from './session-envelope'
import { objectChoicesOf } from './session-object-choices'

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
    // Re-pointed 26 October 2026 (Stage F): version 20 (his rulings filed 26 October 2026 for the goal version) supersedes 19, once.
    // Re-pointed 23 October 2026 (H3): version 21 (a region bound to an object, his reply filed 26 October 2026, item 7) supersedes 20, once.
    // Re-pointed 23 October 2026 (H4): version 22 (the type a session states for its objects, his reply filed 26 October 2026, item 4) supersedes 21.
    // Re-pointed 24 October 2026 (R1): version 23 (one restart for every dead ball, his reply filed 27 October 2026, item 4) supersedes 22.
    assert.match(String(register.version), /^23, adds one restart for every dead ball, .*Supersedes version 22, which adds the type a session states for its objects of a kind, .*Supersedes version 21, which adds a region bound to an object, .*Supersedes version 20, which records his rulings filed 26 October 2026 for the goal version of the build-out activity .*Supersedes version 19, which adds an object's availability as a session resource, for his reply filed 25 October 2026, item 4 /)
    assert.ok(String(register.version).includes('"Please add the general ability to represent goal availability as a session resource and use authorized knowledge relationships when determining which scoring configuration can be selected."'))
    assert.equal(String(register.version).split('Supersedes version 18, which adds the coach-controlled end exchange, ').length - 1, 1, 'version 18 superseded once')
    assert.equal(String(register.version).split('Supersedes version 19, ').length - 1, 1, 'version 19 superseded once')
    assert.equal(String(register.version).split('Supersedes version 20, ').length - 1, 1, 'version 20 superseded once')
    assert.equal(String(register.version).split('Supersedes version 21, ').length - 1, 1, 'version 21 superseded once, by version 22 (H4)')
    assert.equal(String(register.version).split('Supersedes version 22, ').length - 1, 1, 'version 22 superseded once, by version 23 (R1)')
    assert.ok(!String(register.version).includes('Supersedes version 23'), 'version 23 is the current entry')
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

// ── 2b. The type a session states (H4, register version 22; the d26 design's build step 4, its S1) ─────────
test('H4: register version 22 lists one attribute for the kind, type, a closed list in existing words, each quoted; a damaged copy halts H1', () => {
    assert.deepEqual(spec.attributes, [{ kind: KIND, attribute: 'type', values: ['full-size', 'scaled', 'mini-goal'] }])
    assert.deepEqual(sessionResourceAttributes(), spec.attributes, 'the envelope reads the attributes from the register')
    const entry = register.sessionResources.attributes[0]
    // Each value is a word already in use, quoted with where: his item 4 approves the Goalkeeper Included Condition's sentence, and uses "mini-goal".
    assert.deepEqual(entry.valueSources['full-size'].words, 'Use full-size or scaled goals depending on field dimensions.')
    assert.deepEqual(entry.valueSources.scaled.words, 'Use full-size or scaled goals depending on field dimensions.')
    assert.deepEqual(entry.valueSources['mini-goal'], { words: 'This is different from substituting an unattended mini-goal.', citedAs: 'his reply filed 26 October 2026, item 4' })
    // Re-pointed 24 October 2026 (R1): version 23 supersedes 22, so version 22's entry is read where it now stands, whole.
    assert.ok(String(register.version).includes('Supersedes version 22, which adds the type a session states for its objects of a kind, for his reply filed 26 October 2026, item 4 ("I approve using the relevant Goalkeeper Included Condition:" "Use full-size or scaled goals depending on field dimensions."'))
    assert.ok(String(register.version).split('Supersedes version 21, ')[0].includes('"I agree that the coach should identify the available goal type and dimensions, without the engine inventing them."'))
    // The height is not an attribute: no authorized entry reads it, so nothing asks for it.
    assert.ok(!spec.attributes.some(attribute => /height/i.test(attribute.attribute)))
    halts(r => (r.sessionResources.attributes = {}), /attributes must be a list/, 'not a list')
    halts(r => (r.sessionResources.attributes[0].kind = 'TEST-ONLY'), /names the kind "TEST-ONLY", which sessionResources\.kinds does not list/, 'a kind not listed')
    halts(r => (r.sessionResources.attributes[0].attribute = 'widthM'), /must name an attribute other than count and widthM/, 'an attribute a statement already carries')
    halts(r => r.sessionResources.attributes.push(copy(r.sessionResources.attributes[0])), /the attribute type of goal is listed twice/, 'an attribute twice')
    halts(r => (r.sessionResources.attributes[0].values = []), /must list at least one value, each once/, 'no value')
    halts(r => r.sessionResources.attributes[0].values.push('scaled'), /must list at least one value, each once/, 'a value twice')
    halts(r => delete r.sessionResources.attributes[0].valueSources.scaled, /the value scaled must quote the words it is taken from/, 'a value with no source')
    halts(r => (r.sessionResources.attributes[0].valueSources['mini-goal'].words = 'TEST-ONLY'), /the value mini-goal is not in the words it quotes/, 'a value its words do not hold')
    halts(r => (r.sessionResources.attributes[0].valueSources.portable = { words: 'portable', citedAs: 'TEST-ONLY' }), /valueSources names portable, which the list does not hold/, 'a source for no value')
    halts(r => (r.sessionResources.attributes[0].note = ''), /must say what it is and why \(note\)/, 'no note')
    const without = copy(register)
    delete without.sessionResources.attributes
    assert.deepEqual(indexRegister(without).sessionResources!.attributes, [], 'a register before version 22 lists none, and none is read')
})

test('H4: the envelope carries a stated type and nothing else, never infers one, and refuses a value off the list; the model stores it with no default', () => {
    const stored = { playerCount: 12, fieldLength: '40', fieldWidth: '30', specializedRoles: { ...none, [KEEPER]: 1 } }
    const ok = (objects: unknown, review: Record<string, unknown> = {}) => {
        const envelope = sessionEnvelopeFrom({ ...stored, objects }, { durationMin: 20, ...review })
        assert.equal(envelope.outcome, 'stated', JSON.stringify(envelope))
        return (envelope as any).session.objects
    }
    assert.deepEqual(ok({ [KIND]: { count: 1, widthM: 7.32, type: 'full-size' } }), { [KIND]: { count: 1, widthM: 7.32, type: 'full-size' } })
    // Absent, blank or null: not stated, carried as nothing - never inferred from the width (7.32 m is not thereby full-size).
    for (const type of [undefined, '', null]) assert.deepEqual(ok({ [KIND]: { count: 1, widthM: 7.32, ...(type === undefined ? {} : { type }) } }), { [KIND]: { count: 1, widthM: 7.32 } }, String(type))
    // The review's answer replaces the kind's statement whole, as it always has: a type is carried only where the answer states it.
    assert.deepEqual(ok({ [KIND]: { count: 1, widthM: 7.32, type: 'full-size' } }, { objects: { [KIND]: { count: 1, widthM: 5, type: 'scaled' } } }), { [KIND]: { count: 1, widthM: 5, type: 'scaled' } })
    assert.deepEqual(ok({ [KIND]: { count: 1, widthM: 7.32 } }, { objects: { [KIND]: { count: 1, widthM: 7.32, type: 'mini-goal' } } }), { [KIND]: { count: 1, widthM: 7.32, type: 'mini-goal' } })
    const refused = (objects: unknown) => {
        const envelope = sessionEnvelopeFrom({ ...stored, objects }, { durationMin: 20 })
        assert.equal(envelope.outcome, 'not-stated', JSON.stringify(objects))
        assert.ok((envelope as any).reasons.includes(`The type of the ${KIND}s must be one of: full-size, scaled, mini-goal.`), (envelope as any).reasons.join(' | '))
    }
    refused({ [KIND]: { count: 1, widthM: 7.32, type: 'small' } })
    refused({ [KIND]: { count: 1, widthM: 7.32, type: 'FULL-SIZE' } })
    refused({ [KIND]: { count: 1, widthM: 7.32, type: 3 } })
    // A key the register lists for no kind is not read, exactly as before H4 (only the listed attributes are carried).
    assert.deepEqual(ok({ [KIND]: { count: 1, widthM: 5, heightM: 2 } }), { [KIND]: { count: 1, widthM: 5 } })
    const created: any = new Session({ name: 'TEST-ONLY', createdBy: '64b7f0c2a1b2c3d4e5f60719', objects: { [KIND]: { count: 1, widthM: 7.32, type: 'full-size' } } })
    assert.deepEqual(copy(created.toObject().objects), { [KIND]: { count: 1, widthM: 7.32, type: 'full-size' } })
    assert.equal(objectAvailabilityQuestion(KIND, 'ATTRIBUTE', 'type'), `Say what type of ${KIND} this session has before building this activity.`)
})

/**
 * Re-pointed 24 October 2026 (stage I, the d27 design's stage I(a)): the session form no longer lists the register's type values itself (H4's
 * GOAL_TYPE_OPTIONS, kept equal to the register by this test); it offers the server's choices (GET /session/object-choices,
 * session-object-choices.ts), which state the register's values from the knowledge, beside "Not sure yet", which stores nothing. So the
 * test now holds that neither the form nor the review page names any value, and that both read the server's choices.
 */
test("H4 / stage I: the session form and the review page offer the server's choices and name no value; \"Not sure yet\" stores nothing", () => {
    const form = fs.readFileSync(path.join(__dirname, '../../../../front/src/forms/SessionForm.tsx'), 'utf8')
    const values = spec.attributes.find(attribute => attribute.kind === KIND && attribute.attribute === 'type')!.values
    assert.ok(form.includes('`${ROUTES.app.session}/object-choices`') && form.includes('<ObjectChoiceField'), 'the form reads the server\'s choices')
    assert.ok(form.includes("const NOT_SURE_YET = 'Not sure yet'") && form.includes('notSureLabel={NOT_SURE_YET}'), '"Not sure yet" is offered')
    assert.ok(form.includes('if (statement) objects[kind] = statement') && form.includes('else delete objects[kind]'), 'nothing chosen stores nothing')
    assert.ok(!form.includes('GOAL_TYPE_OPTIONS') && !form.includes('step={0.1}'), 'no list of its own, and no width stepping by 0.1 m')
    const field = fs.readFileSync(path.join(__dirname, '../../../../front/src/components/ObjectChoiceField.tsx'), 'utf8')
    // The review page names no value: it offers the question's own choices, and its own list where the server sends no choices.
    const page = fs.readFileSync(path.join(__dirname, '../../../../front/src/app/ActivityReviewPage.tsx'), 'utf8')
    assert.ok(page.includes('asked.values.map((option) =>') && page.includes('choices={question.choices}'))
    for (const value of values) for (const [name, text] of [['form', form], ['field', field], ['page', page]]) assert.ok(!text.includes(`'${value}'`), `the ${name} names no value (${value})`)
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
    // Re-pointed 24 October 2026 (stage I): the not-suitable cause carries the suitability it read (`rules`, empty where nothing is decided),
    // so the builder can say which authorized objects the realization is built for without reading `why`.
    assert.deepEqual(pick(rule(one, { [KIND]: { count: 1, widthM: 5 } })), { cause: 'OBJECT_NOT_SUITABLE', needed: 1, available: 1, widthM: 5, decided: false, rules: [] }, 'no authorized suitability: none suits')
    assert.deepEqual(pick(rule(one, { [KIND]: { count: 1, widthM: 12 } }, suitable(1, 10))), { cause: 'OBJECT_NOT_SUITABLE', needed: 1, available: 1, widthM: 12, decided: true, rules: [{ min: 1, max: 10 }] })
    assert.deepEqual(pick(rule(one, { [KIND]: { count: 1, widthM: 0.5 } }, suitable(1, null))), { cause: 'OBJECT_NOT_SUITABLE', needed: 1, available: 1, widthM: 0.5, decided: true, rules: [{ min: 1, max: null }] })
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
    /** Stage G (23 October 2026): a TEST-ONLY goal this many metres in front of its end line, which no DRAFT placing sentence says. */
    alongOffsetM?: number
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
            item('GOAL-ALONG', 'O4', `kind=${KIND}`, 'POSITIONED', { term: 'own end (of team T)', forTeam: 'ROLE_HOLDER_BUILDING', offsetM: { from: options.alongOffsetM ?? 0, to: options.alongOffsetM ?? 0 }, asAuthored: 'TEST-ONLY' }),
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
    /**
     * H1 (23 October 2026, the d26 design's finding X4): a variant stating another area keeps no value in metres from its base, so this copy
     * withdraws A01-R1's pressure reference distance (A01-R1-S5-1, his 20 m for the 40 x 30 m area) and restates it among its own items for its
     * own area (TEST-ONLY). Until H1 the gate admitted it kept; the outcome it is built for (refused at the testing area) is unchanged.
     */
    if (options.areas) {
        const pressureReference = base.items.find((i: any) => i.id === 'A01-R1-S5-1')
        variant.withdraws.push({ item: pressureReference.id, because: 'TEST-ONLY' })
        variant.items.push(item('S5-1', pressureReference.row, pressureReference.selector, pressureReference.requirement, copy(pressureReference.value)))
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
    // K1: production keeps one variant, A01-R2, whose suitability is now authorized; the other gaps still prevent selection.
    assert.deepEqual(loadProvisionalRealizations().filter(r => r.basedOn !== undefined).map(r => [r.provisionalId, r.basedOn]), [['A01-R2', 'A01-R1']])
    // K1 now records suitability only for the goal variant; the base still states none.
    assert.deepEqual(loadProvisionalRealizations().filter(r => r.objectSuitability !== undefined).map(r => r.provisionalId), ['A01-R2'])
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
    // Since Stage F (26 October 2026) production names its realizations as a list; keeping "the single one" names it beside the list.
    if (keepSingle) a01.provisionalRealization = 'A01-R1'
    else delete a01.provisionalRealization
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
    // A single realization reads as a list of one, tried (production until Stage F).
    assert.deepEqual(realizationAlternativesOf({ provisionalRealization: 'A01-R1' }), [{ realization: 'A01-R1', words: null, citedAs: null, selectable: true, status: null, gaps: [] }])
    // Re-pointed 26 October 2026 (Stage F): production A01 lists the goal version first, waiting on two decisions of his, then the zone
    // version, each with his words for its place; no other record lists alternatives.
    // Re-pointed 24 October 2026 (K3): the goal version is tried now (his reply filed 27 October 2026 settles its three decisions).
    const a01 = learningGoalAuthorizations().find(r => r.learningGoalId === 'A01')!
    assert.deepEqual(realizationAlternativesOf(a01), [
        { realization: 'A01-R2', words: 'My preference is to use the physical-goal version when an appropriate goal and goalkeeper are available and the selected realization supports that relationship.', citedAs: 'his reply filed 25 October 2026, item 3', selectable: true, status: null, gaps: [] },
        { realization: 'A01-R1', words: 'Goalkeeper available, but no appropriate physical goal: The pressing team may attack an authorized target zone.', citedAs: 'his reply filed 25 October 2026, item 4', selectable: true, status: null, gaps: [] },
    ])
    assert.deepEqual(learningGoalAuthorizations().filter(r => r.realizations !== undefined).map(r => r.learningGoalId), ['A01'], 'no other record lists alternatives')
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
    // Re-pointed 24 October 2026 (K3): the record's preferred realization is its first that can be tried, the goal version, since his reply
    // filed 27 October 2026 settles its decisions (was: A01-R1, the goal version listed and never tried).
    assert.deepEqual(contractIds(selection), ['provisional:A01-R2'], 'absent: the preferred (and only) realization of the record')
    assert.equal(realizationOf(selection)!.provisionalId, 'A01-R2')
    assert.deepEqual(contractIds({ ...selection, realization: variant }), [`provisional:${V}`], 'threaded: the variant, and not its base')
    assert.deepEqual(contractIds({ ...selection, realization: null }), [], 'threaded null: none')
    const fromOf = (s: any) => {
        const supplied = suppliedRealizationFor(s)
        assert.ok(!isNoSuppliedRealization(supplied))
        return (supplied as SuppliedRealization).from
    }
    // Re-pointed 24 October 2026 (K3): the preferred realization's own choices, the goal version's file.
    assert.ok(fromOf(selection).includes('realization-choices-a01-r2.json'))
    assert.ok(!fromOf({ ...selection, realization: { ...variant, realizationChoices: null } }).includes('realization-choices-a01-r2.json'), 'the threaded realization\'s choices, not the record\'s')
    assert.ok(!fromOf({ ...selection, realization: null }).includes('realization-choices-a01-r2.json'))
})

// ── 7. The build's loop (TEST-ONLY records and realizations) ─────────────────────────────────────────────
interface LoopOptions extends VariantOptions {
    alternatives?: Record<string, unknown>[]
    situationId?: string
    seen?: string[]
    /** A TEST-ONLY authored comparison attached in memory to one of the variant's items: a real post-realization break of the variant alone. */
    comparison?: Record<string, unknown>
    /**
     * Added 24 October 2026 (K3): the records copy also defines a TEST-ONLY open decision (TEST_OPEN_GAP), for an alternative to wait on.
     * Since K3 every gap A01's record defines is settled by his words, and the record gate refuses an alternative waiting on a settled one.
     */
    openGap?: boolean
}
const TEST_OPEN_GAP = { id: 'TEST-ONLY-OPEN', kind: 'DECISION' as const, description: 'TEST-ONLY: a decision nobody has made', note: null }
const withOpenGap = (records: LearningGoalAuthorization[], open = true): LearningGoalAuthorization[] => {
    if (open) records.find(r => r.learningGoalId === 'A01')!.gaps!.push(copy(TEST_OPEN_GAP))
    return records
}
/** The goal version tried first and the zone version second, each built whole; the GF2 markers and the scoring relationship TEST-ONLY. */
const loopBuild = (session: any, options: LoopOptions = {}) => {
    const read = authorizationRecords.contextRelationships
    ;(authorizationRecords as any).contextRelationships = () => [...read(), copy(REL)]
    try {
        return buildActivityUnderAuthorizationRecords({ kind: 'learning-goal', goalId: 'A01', situationId: options.situationId ?? null, session }, withOpenGap(recordsWith(options.alternatives ?? [PREFERRED, SECOND]), options.openGap === true), {
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
/**
 * Re-pointed 24 October 2026 (K3, the d27 design's stage K3): "production" is A01 for a session stating no goal. Since K3 the goal version is
 * tried first, and a session that has not said what goals it has is asked (his reply filed 26 October 2026, item 11: "Do not infer a goal
 * from the presence of a goalkeeper or silently treat missing information as confirmation that no goal exists."); with none stated the zone
 * version is served exactly as an unstated session was before K3.
 */
const production = buildActivityForReview({ kind: 'learning-goal', goalId: 'A01', situationId: null, session: sessionOf(1, { [KIND]: { count: 0 } }) } as any, { includeDrafts: true }) as ServedActivity
const ACCOUNT_KEYS_BEFORE_E = Object.keys(production.account).filter(key => key !== 'realizationSelection').sort()

test('goals = 0 serves A01-R1 with only the recorded delta: the session it echoes, and the account and evidence naming the realization used', () => {
    const kindsOf = (fixture: any) => (fixture.roleBlocks.blocks as any[]).map(block => (block.fixture.game.objects as any[]).map(object => object.kind))
    // Re-pointed 24 October 2026 (K3): production states no goal (see `production`), so its game is the one compared against.
    const productionKinds = kindsOf(buildActivityUnderAuthorizationRecords({ kind: 'learning-goal', goalId: 'A01', session: sessionOf(1, { [KIND]: { count: 0 } }) }, learningGoalAuthorizations()).fixture)
    for (const objects of [{ [KIND]: { count: 0 } }, GOAL_STATED]) {
        const stated = buildActivityForReview({ kind: 'learning-goal', goalId: 'A01', situationId: null, session: sessionOf(1, objects) } as any, { includeDrafts: true }) as ServedActivity
        assert.equal(stated.outcome, 'served', JSON.stringify(objects))
        assert.deepEqual(stated.session.objects, objects)
        for (const key of ['rendered', 'overview', 'diagram', 'roleBlocks', 'integrity', 'title', 'subtitle'] as const) assert.deepEqual(stated[key], production[key], `${JSON.stringify(objects)}: ${key}`)
        // Re-pointed 24 October 2026 (K3): the goal version is tried first now, so the account's realization selection says why it did not
        // apply - no goal (OBJECT_AVAILABILITY_SHORT) or a 5 m goal its suitability does not admit (OBJECT_NOT_SUITABLE); every other field
        // of the account is production's.
        const { realizationSelection, ...rest } = stated.account
        const { realizationSelection: _productionSelection, ...productionRest } = production.account
        assert.deepEqual(rest, productionRest, `${JSON.stringify(objects)}: the account`)
        assert.deepEqual(realizationSelection!.map(entry => [entry.realization, entry.outcome, entry.cause]), [['A01-R2', 'NOT_APPLICABLE', objects === GOAL_STATED ? 'OBJECT_NOT_SUITABLE' : 'OBJECT_AVAILABILITY_SHORT'], ['A01-R1', 'SELECTED', null]], JSON.stringify(objects))
        // The rule never adds a goal: each block's game holds only the object it held (the one no objective references), none of the kind.
        const kinds = kindsOf(buildActivityUnderAuthorizationRecords({ kind: 'learning-goal', goalId: 'A01', session: sessionOf(1, objects) }, learningGoalAuthorizations()).fixture)
        assert.deepEqual(kinds, productionKinds)
        assert.ok(kinds.every(list => !list.includes(KIND)), JSON.stringify(kinds))
    }
    // The recorded delta on production itself: the account and the evidence name each realization in the record's order and whether it was
    // used. Re-pointed 26 October 2026 (Stage F): the goal version first, listed and never tried (waiting on two decisions of his), then the
    // zone version, used.
    // Re-pointed 24 October 2026 (K3): the goal version is tried first, and with no goal stated it does not apply (it waits on nothing now).
    assert.deepEqual(outcomesOf(production), [['A01-R2', 'NOT_APPLICABLE', 'OBJECT_AVAILABILITY_SHORT'], ['A01-R1', 'SELECTED', null]])
    const fact = production.evidence!.pathway.facts[production.evidence!.pathway.facts.length - 1] as { what: string; value: string[] }
    assert.equal(fact.what, 'the realizations the record authorizes, in its order, and whether each was used (account.realizationSelection)')
    assert.equal(fact.value.length, 2)
    assert.ok(fact.value[0].startsWith('A01-R2: NOT_APPLICABLE (OBJECT_AVAILABILITY_SHORT)') && fact.value[0].endsWith('; its place in the order: his reply filed 25 October 2026, item 3') && !fact.value[0].includes('waits on'), fact.value[0])
    assert.equal(fact.value[1], 'A01-R1: SELECTED; its place in the order: his reply filed 25 October 2026, item 4')
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
    // Re-pointed 26 October 2026 (Stage F): waiting on the record's open decision of goal suitability (a settled gap such as D1 may no longer
    // be waited on by an alternative: the record gate refuses it, as it refuses an entry waiting on a settled gap).
    // Re-pointed 24 October 2026 (K3): D-GOAL-SUITABILITY is settled by his reply filed 27 October 2026 (items 1 and 6), so the alternative
    // waits on a TEST-ONLY open decision of the records copy instead (openGap).
    const waiting = loopBuild(sessionOf(1, GOAL_STATED), { suitability: null, openGap: true, alternatives: [{ ...PREFERRED, status: 'MISSING_KNOWLEDGE', gaps: [TEST_OPEN_GAP.id] }, SECOND] }).activity as ServedActivity
    assert.equal(waiting.outcome, 'served', JSON.stringify((waiting as any).reasons ?? null))
    assert.deepEqual(outcomesOf(waiting), [[V, 'NOT_SELECTABLE', 'MISSING_KNOWLEDGE'], ['A01-R1', 'SELECTED', null]])
})

test('availability not stated: the build asks, and nothing behind the preferred alternative is tried', () => {
    for (const [objects, asks] of [[undefined, 'AVAILABILITY'], [{ [KIND]: { count: 1 } }, 'WIDTH']] as const) {
        const seen: string[] = []
        const refused = loopBuild(sessionOf(1, objects as any), { seen }).activity as RefusedActivity
        assert.equal(refused.outcome, 'refused')
        assert.equal(refused.stage, 'session')
        assert.equal(refused.summary, objectAvailabilityQuestion(KIND, asks))
        // Re-pointed 24 October 2026 (stage I): the question carries the session's own choices for the kind (session-object-choices.ts).
        assert.deepEqual(refused.question, { kind: 'OBJECT_AVAILABILITY', objectKind: KIND, asks, words: refused.summary, status: 'DRAFT', choices: objectChoicesOf(KIND) })
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
    /**
     * Re-pointed 23 October 2026 (Stage G). Exchanged ends: every gate passes and, the goal now having DRAFT words, the goal version is served
     * (until Stage G it was refused at communication for want of them), the variant's own: its game holds the variant's elements (the id
     * reached derivation) and its lists are the variant's.
     */
    const served = loopBuild(sessionOf(1, GOAL_STATED)).activity as ServedActivity
    assert.equal(served.outcome, 'served', JSON.stringify((served as any).reasons ?? null))
    assert.deepEqual(outcomesOf(served), [[V, 'SELECTED', null], ['A01-R1', 'NOT_TRIED', null]])
    assert.ok(served.rendered.instructions.some(instruction => instruction.from.includes(`objects[c:provisional:${V}:${V}-GOAL].kind`)))
    assert.ok(served.account.authorizationLists!.provisionalChoices.some(entry => entry.sources.some(s => s === `provisional:${V}::${V}-GOAL`)))
    // A communication refusal of the preferred alternative still refuses, never the zone version: a TEST-ONLY goal 2 m in front of its end
    // line passes every gate, and no DRAFT sentence places an object off an end line (Stage G), so it is refused at communication.
    const words = loopBuild(sessionOf(1, GOAL_STATED), { alongOffsetM: 2 }).activity as RefusedActivity
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
    // Production A01 (one realization that can be tried, since Stage F beside the goal version waiting on his decisions): the refusal is
    // exactly its own, and the account says why each was not used.
    // Re-pointed 24 October 2026 (K3): both realizations are tried now, so production refuses exactly as the TEST-ONLY loop above does - the
    // roster's sentence, the exhausted alternatives named first - for the FA 5v5 goal and for none; with no goal stated the goals are asked
    // first (the d27 design's 4.2: the required-participants check before the goals, its I(d), is not built).
    for (const [objects, first] of [[{ [KIND]: { count: 1, type: 'scaled', widthM: 3.6576 } }, 'AVAILABILITY_SHORT'], [{ [KIND]: { count: 0 } }, 'OBJECT_AVAILABILITY_SHORT']] as const) {
        const zero = buildActivityForReview({ kind: 'learning-goal', goalId: 'A01', situationId: null, session: sessionOf(0, objects as any) } as any, { includeDrafts: false }) as RefusedActivity
        assert.equal(zero.summary, `This game needs 1 ${KEEPER} in all and the session has 0.`)
        assert.equal(zero.reasons[0], 'none of the 2 realizations the authorization record of A01 authorizes applies to this session; each was tried in its order')
        assert.deepEqual(outcomesOf(zero), [['A01-R2', 'NOT_APPLICABLE', first], ['A01-R1', 'NOT_APPLICABLE', 'AVAILABILITY_SHORT']])
    }
    const unstated = buildActivityForReview({ kind: 'learning-goal', goalId: 'A01', situationId: null, session: sessionOf(0) } as any, { includeDrafts: false }) as RefusedActivity
    assert.deepEqual([unstated.stage, unstated.question?.asks, outcomesOf(unstated)], ['session', 'AVAILABILITY', [['A01-R2', 'ASKED', 'OBJECT_AVAILABILITY_NOT_STATED'], ['A01-R1', 'NOT_TRIED', null]]])
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
    // Designed for it here (TEST-ONLY), the variant is tried; refused, nothing behind it is tried. (Measured 23 October 2026, Stage G: it is
    // refused at structure, the situation's own restart items leaving two lines open; the comment here said "at communication", which only
    // its stage now states.)
    const designed = loopBuild(sessionOf(1, GOAL_STATED), { situationId: 'A01-02', notWith: [] }).activity as RefusedActivity
    assert.deepEqual([outcomesOf(designed)[0], designed.stage], [[V, 'REFUSED', null], 'structure'])
    // Waiting on a gap: listed, never tried.
    const seen: string[] = []
    // Re-pointed 26 October 2026 (Stage F): on an open gap of the record (a settled one may not be waited on).
    // Re-pointed 24 October 2026 (K3): D-PENALTY-AREA is settled by his reply filed 27 October 2026 (item 1), so on a TEST-ONLY open decision.
    const gap = loopBuild(sessionOf(1, GOAL_STATED), { openGap: true, alternatives: [{ ...PREFERRED, status: 'MISSING_KNOWLEDGE', gaps: [TEST_OPEN_GAP.id] }, SECOND], seen }).activity as ServedActivity
    assert.equal(gap.outcome, 'served')
    assert.deepEqual(outcomesOf(gap), [[V, 'NOT_SELECTABLE', 'MISSING_KNOWLEDGE'], ['A01-R1', 'SELECTED', null]])
    assert.deepEqual((gap.account.realizationSelection as any[])[0].gaps, [TEST_OPEN_GAP.id])
    // A settled gap cannot be waited on: the record gate refuses the copy, naming it.
    const settled = loopBuild(sessionOf(1, GOAL_STATED), { alternatives: [{ ...PREFERRED, status: 'MISSING_KNOWLEDGE', gaps: ['D-PENALTY-AREA'] }, SECOND] }).activity as RefusedActivity
    assert.ok(settled.outcome === 'refused' && settled.reasons.some(reason => reason.includes('the gap D-PENALTY-AREA is marked settled, and the alternative realization')), JSON.stringify(settled.reasons))
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
    // Re-pointed 24 October 2026 (K3): the coach's production answer for a session that states no goal (one that states nothing about its
    // goals is asked since K3, his reply filed 26 October 2026, item 11); every comparison below is against it, as before.
    const coachProduction = reviewActivity(storedWith({ [KIND]: { count: 0 } }), body()) as ServedActivity
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
    // Re-pointed 24 October 2026 (stage I): with the session's own choices for the kind.
    assert.deepEqual(asked.question, { kind: 'OBJECT_AVAILABILITY', objectKind: KIND, asks: 'AVAILABILITY', words: asked.summary, status: 'DRAFT', choices: objectChoicesOf(KIND) })
    // Answered "none": the preferred alternative does not apply, and the zone version is served - the question does not come back.
    const none0 = loopBuild(requestFor({ [KIND]: { count: 0 } })).activity as ServedActivity
    assert.equal(none0.outcome, 'served')
    assert.deepEqual(outcomesOf(none0), [[V, 'NOT_APPLICABLE', 'OBJECT_AVAILABILITY_SHORT'], ['A01-R1', 'SELECTED', null]])
    // Answered with a count and no width: asked again, for the width only.
    assert.equal((loopBuild(requestFor({ [KIND]: { count: 1 } })).activity as RefusedActivity).question?.asks, 'WIDTH')
    // Answered with one suitable goal: the variant is tried with it, and (since Stage G, 23 October 2026, its DRAFT words) served; until
    // Stage G it was refused at communication.
    assert.deepEqual(outcomesOf(loopBuild(requestFor(GOAL_STATED)).activity), [[V, 'SELECTED', null], ['A01-R1', 'NOT_TRIED', null]])
})

console.log(`session-resources.unit.ts — ${passed} passed`)
