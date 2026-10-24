/**
 * **The choices a coach states a session's objects by** — stage I, 24 October 2026 (the d27 design's stage I(a), (b) and (c), its risk 3;
 * every label is DRAFT, and nothing new is served to a coach in an activity: the goal version waits on K1 to K3).
 *
 * Christian, reply filed 26 October 2026, item 4: "I agree that the coach should identify the available goal type and dimensions, without
 * the engine inventing them." Item 11: "Do not infer a goal from the presence of a goalkeeper or silently treat missing information as
 * confirmation that no goal exists." His reply filed 27 October 2026, item 6: "A mini-goal is not automatically equivalent to an appropriate
 * goalkeeper-defended goal." Item 1: "Please verify the applicable FA specification and keep the goal, penalty area, and penalty spot
 * dimensions from the same authorized source rather than combining unrelated formats."
 *
 * What is pinned here (TEST-ONLY copies are labelled and held in memory; no pairing below is knowledge):
 *   1. the DRAFT wording data (`objectChoices`): keyed by a kind the register lists, his words for each label, and the loader refusing what
 *      it must;
 *   2. the size a label gives: metres, and feet only where every figure is a whole number of feet (12 ft x 6 ft is 3.6576 m x 1.8288 m; the
 *      regulation goal's 7.32 m x 2.44 m is not, so it reads in metres alone);
 *   3. the production choices (the IFAB goal, a mini-goal, another goal, none) and the route serving them to the session form;
 *   4. with a TEST-ONLY FA 5v5 pairing (the d27 design's section 1.6): its choice states 3.6576 m and 'scaled' EXACTLY as the pairing records
 *      them, so the goal version built from that statement is matched to the pairing with no tolerance (served at 12/1, 12/2 and 11/1), and
 *      two pairings of one object make one choice naming both documents;
 *   5. a goal typed at The FA's own rounded 3.66 m is another goal: with a TEST-ONLY suitability admitting 3.6576 m only (a stand-in for
 *      K1), the goal version does not apply, the zone version is served, and the reason in the closed panel names the authorized goal; with
 *      no authorized goal that suits and fits, the reason is said as before;
 *   6. the build's question carries the choices (AVAILABILITY, WIDTH and ATTRIBUTE, the last only those stating the attribute, and none);
 *      the live route passes them on whole; an answer made by a choice is read through the review route and served;
 *   7. the front: the session form, the review page and the live page answer by the server's choices, and the live page's refusal carries
 *      the question through the API layer (source reads);
 *   8. production unchanged: A01 at 12/1 serves the zone version whatever the session states, and production asks nothing.
 *
 * Run: npx ts-node --files -r tsconfig-paths/register ./src/system/rendering/object-choices.unit.ts
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { SportBoundRegions } from '../derivation/bound-regions'
import { loadProvisionalRealizations, loadRegister, loadSportBoundRegions, PROVISIONAL_REALIZATIONS_FILE, readJson } from '../derivation/corpus'
import { objectAvailabilityRefusal } from '../realization/assemble-concrete-game'
import { validateProvisionalRealizations } from '../derivation/corpus'
import { indexRegister } from '../derivation/register'
import { learningGoalAuthorizations } from '../test-library/learning-goal-authorizations'
import { reviewRequestOf } from './activity-review'
import { buildActivityForReview, buildActivityUnderAuthorizationRecords, RefusedActivity, ServedActivity } from './build-activity'
import { DRAFT_COACH_WORDING_FILE, draftCoachWordingLoadOf, draftCoachWordingUnusableBecause, objectChoiceWording } from './draft-coach-wording'
import { liveRefusalBody } from './live-activity'
import { sessionEnvelopeFrom, specializedRoleNames } from './session-envelope'
import { choicesAnswering, choicesSuitedTo, objectChoicesOf, sessionObjectChoices, sizeWords } from './session-object-choices'

let passed = 0
function test(name: string, body: () => void): void {
    body()
    passed++
    console.log(`  ok  ${name}`)
}
console.log('the choices a coach states a session\'s objects by (stage I, DRAFT)')

const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const index = indexRegister(loadRegister())
const KIND = index.sessionResources!.kinds[0]
const KEEPER = specializedRoleNames()[0]
const none = Object.fromEntries(specializedRoleNames().map(role => [role, 0]))
const R2 = 'A01-R2'
const FA_ID = 'TEST-ONLY-FA-5V5'
const FA_DOCUMENT = 'TEST-ONLY: The Mini-Soccer and Youth Futsal Handbook (England Football / The FA)'
const FA_WIDTH = 3.6576
const FA_LABEL = `the goal in ${FA_DOCUMENT}, 12 ft x 6 ft (3.6576 m x 1.8288 m)`
const IFAB_LABEL = 'the goal in IFAB Laws of the Game, 7.32 m x 2.44 m'

/** TEST-ONLY: the profile's bound-region block with the d27 design's FA 5v5 entry (1.6) beside the IFAB one - a stand-in for K1. */
const blockWithFa = (): SportBoundRegions => {
    const block = copy(loadSportBoundRegions()!)
    // K1: replace the production FA entry with this test's deliberately labelled copy.
    block.pairings = block.pairings.filter(entry => entry.id !== "FA-MINI-SOCCER-5V5-2026")
    block.pairings.push({
        id: FA_ID,
        document: FA_DOCUMENT,
        edition: null,
        citedAs: 'TEST-ONLY',
        formatConditions: { players: null, ageBand: null, pitch: null },
        object: { kind: KIND, type: 'scaled', widthM: FA_WIDTH, heightM: 1.8288 },
        region: { function: 'penalty-area', widthM: 15, depthM: 9 },
        markM: 6,
        borrows: ['object', 'region', 'mark'],
        authority: { words: ['TEST-ONLY'], citedAs: 'TEST-ONLY' },
        note: 'TEST-ONLY',
    })
    return block
}

/** TEST-ONLY: the record lists the goal version as one that can be tried (its open decisions completed in memory, nothing else). */
const recordsOf = () => {
    const records = learningGoalAuthorizations()
    const record = records.find(r => r.learningGoalId === 'A01') as any
    record.realizations = record.realizations.map((entry: any) => (entry.realization === R2 ? { realization: entry.realization, words: entry.words, citedAs: entry.citedAs } : entry))
    return records
}

/**
 * TEST-ONLY realizations file: A01-R2 with a suitability (a stand-in for K1: 1-10 m by default, or the FA width only), a REPORT
 * default-laws check, and the FA area's items (the region, its two positions, its required width and its binding to the goal, citing the
 * TEST-ONLY pairing), as bound-region-communication.unit.ts builds them.
 */
const fileFor = (suitability: { min: number; max: number } = { min: 1, max: 10 }) => {
    const file = readJson(PROVISIONAL_REALIZATIONS_FILE)
    const variant = file.realizations.find((r: any) => r.id === R2)
    variant.objectSuitability = [{ kind: KIND, widthM: suitability, ruledOn: 'TEST-ONLY', by: 'TEST-ONLY', citedAs: 'TEST-ONLY', words: ['TEST-ONLY'] }]
    variant.defaultLawsCheck = { mode: 'REPORT', because: 'TEST-ONLY: D-DEFAULT-LAWS completed in memory', basis: { words: ['TEST-ONLY'], citedAs: 'TEST-ONLY' } }
    const template = variant.items.find((i: any) => i.id === `${R2}-O5-1`)
    const item = (suffix: string, row: string, requirement: string, value: unknown, extra: Record<string, unknown> = {}) => ({
        ...template,
        id: `${R2}-TEST-${suffix}`,
        row,
        selector: 'noun=zone & functions ∋ penalty-area',
        requirement,
        value,
        valueStatus: requirement === 'EXISTS' ? 'N/A' : 'REQUIRED_RANGE',
        choice: 'TEST-ONLY',
        words: 'TEST-ONLY',
        citedAs: 'TEST-ONLY',
        basisEvidence: 'TEST-ONLY',
        fitNote: 'TEST-ONLY',
        ...extra,
    })
    variant.items.push(
        item('S2', 'S2', 'EXISTS', 'N/A'),
        item('S5', 'S5', 'POSITIONED', { term: 'own end (of team T)', forTeam: 'ROLE_HOLDER_BUILDING', offsetM: { from: 0, to: 9 }, asAuthored: 'TEST-ONLY' }),
        item('S6', 'S6', 'POSITIONED', { term: 'central', asAuthored: 'TEST-ONLY' }),
        item('S6-W', 'S6', 'RANGE', '15 m wide (TEST-ONLY)', { typedBound: { min: 15, max: 15 } }),
        item('S7', 'S7', 'EQUALS', { structuralRef: { contractId: `provisional:${R2}`, itemId: `${R2}-O1-1` }, pairing: FA_ID, asAuthored: 'TEST-ONLY' }),
    )
    return file
}
const sessionWith = (objects: Record<string, unknown> | undefined, players = 12, keepers = 1) => ({ players, lengthM: 40, widthM: 30, durationMin: 20, roles: { ...none, [KEEPER]: keepers }, ...(objects ? { objects } : {}) })
const goalBuild = (session: unknown, options: { suitability?: { min: number; max: number }; block?: SportBoundRegions | null; includeDrafts?: boolean } = {}) =>
    buildActivityUnderAuthorizationRecords({ kind: 'learning-goal', goalId: 'A01', situationId: null, session } as any, recordsOf(), {
        realizations: loadProvisionalRealizations(fileFor(options.suitability)),
        review: { includeDrafts: options.includeDrafts !== false },
        boundRegions: options.block === undefined ? blockWithFa() : options.block,
    }).activity
const selectionOf = (activity: ServedActivity | RefusedActivity) => (activity.account.realizationSelection ?? []).map(entry => [entry.realization, entry.outcome, entry.cause])
/** The statement a choice makes beside a count, exactly as the front's ObjectChoiceField makes it (statementOf). */
const stated = (choiceId: string, count: number, widthM?: number) => {
    const choice = objectChoicesOf(KIND, index, blockWithFa()).find(entry => entry.id === choiceId)!
    if (!choice.enters.length) return { ...choice.states }
    return { ...choice.states, count, ...(choice.enters.includes('widthM') ? { widthM } : {}) }
}

// ── 1. The DRAFT wording data ────────────────────────────────────────────────────────────────────────────
test('the DRAFT wording data: one entry per kind the register lists, his words for each label; the loader refuses what it must', () => {
    const words = objectChoiceWording(KIND)!
    assert.deepEqual(
        [words.authorized.label, words.attributeValues.map(entry => [entry.attribute, entry.value, entry.label]), words.other.label, words.none.label],
        ['the {kind} in {document}, {size}', [['type', 'full-size', 'full-size'], ['type', 'scaled', 'scaled'], ['type', 'mini-goal', 'a mini-goal or pop-up goal']], 'another goal (enter its width)', 'none'],
    )
    // His words, verbatim, with where they are filed.
    assert.deepEqual(words.authorized.basis, { words: ['I agree that the coach should identify the available goal type and dimensions, without the engine inventing them.'], citedAs: 'his reply filed 26 October 2026, item 4' })
    assert.deepEqual(words.attributeValues[2].basis, { words: ['A mini-goal is not automatically equivalent to an appropriate goalkeeper-defended goal.'], citedAs: 'his reply filed 27 October 2026, item 6' })
    assert.deepEqual(words.other.basis, words.authorized.basis)
    assert.deepEqual(words.none.basis, { words: ['Do not infer a goal from the presence of a goalkeeper or silently treat missing information as confirmation that no goal exists.'], citedAs: 'his reply filed 26 October 2026, item 11' })
    assert.equal(objectChoiceWording('TEST-ONLY'), null)
    const file = JSON.parse(fs.readFileSync(DRAFT_COACH_WORDING_FILE, 'utf8'))
    assert.equal(draftCoachWordingUnusableBecause(file, index), null)
    const refused = (damage: (entry: any) => void, why: RegExp, label: string) => {
        const damaged = copy(file)
        damage(damaged.objectChoices[0])
        const reason = draftCoachWordingUnusableBecause(damaged, index)
        assert.ok(reason && why.test(reason), `${label}: ${reason}`)
        // A file that cannot be used loads as no wording at all: no choice is offered from it (fail-closed).
        assert.deepEqual(draftCoachWordingLoadOf(damaged, index).wording.objectChoices, [], label)
    }
    refused(entry => (entry.kind = 'ball'), /names "ball", which is no kind the register's sessionResources block lists/, 'a kind not listed')
    refused(entry => (entry.authorized.label = 'the {kind} in {document}'), /its authorized label: its label is missing or does not hold exactly the slots \{kind\}, \{document\}, \{size\}/, 'the size left out')
    refused(entry => (entry.authorized.label = 'the {kind} in {document}, {size} {width}'), /does not hold exactly the slots/, 'a slot of its own')
    refused(entry => (entry.other.label = 'another {kind}'), /its other label: its label is missing or holds a slot/, 'a slot in another')
    refused(entry => (entry.none.label = ''), /its none label: its label is missing or holds a slot/, 'no label')
    refused(entry => (entry.attributeValues[0].value = 'portable'), /names the value "portable", which is none of the type values the register lists/, 'a value off the list')
    refused(entry => (entry.attributeValues[0].attribute = 'colour'), /names the attribute "colour", which the register lists for no goal/, 'an attribute not listed')
    refused(entry => entry.attributeValues.push(copy(entry.attributeValues[0])), /lists type full-size again/, 'a value twice')
    refused(entry => (entry.other.basis = { words: [], citedAs: 'his reply filed 26 October 2026, item 4' }), /its other label: its basis quotes none of his words/, 'no words of his')
    refused(entry => (entry.none.basis.citedAs = 'TEST-ONLY'), /does not say which of his replies/, 'no reply named')
    refused(entry => (entry.approved = true), /carries "approved"/, 'a claim of approval')
    refused(entry => delete entry.attributeValues, /holds no attributeValues list/, 'no attribute list')
    const twice = copy(file)
    twice.objectChoices.push(copy(twice.objectChoices[0]))
    assert.match(String(draftCoachWordingUnusableBecause(twice, index)), /lists goal again/)
})

// ── 2. The size a label gives ────────────────────────────────────────────────────────────────────────────
test('the size: metres, and feet only where every figure is a whole number of feet at 0.3048 m per foot', () => {
    assert.equal(sizeWords(3.6576, 1.8288), '12 ft x 6 ft (3.6576 m x 1.8288 m)')
    assert.equal(sizeWords(7.32, 2.44), '7.32 m x 2.44 m', '24.0157 ft is no whole number of feet: never rounded to one')
    assert.equal(sizeWords(3.66, 1.83), '3.66 m x 1.83 m', "The FA's 2012 rounding reads as itself")
    assert.equal(sizeWords(3.6576, 2.44), '3.6576 m x 2.44 m', 'feet only where every figure is whole')
    assert.equal(sizeWords(3.6576, null), '12 ft (3.6576 m) wide')
    assert.equal(sizeWords(5, null), '5 m wide')
})

// ── 3. The production choices ────────────────────────────────────────────────────────────────────────────
test('production: the regulation goal, a mini-goal, another goal and none, each DRAFT; the route serves them before the session routes\' /:id', () => {
    const choices = objectChoicesOf(KIND)
    assert.deepEqual(choices.map(choice => [choice.id, choice.label, choice.states, choice.enters, choice.status]), [
        ['pairing:IFAB-LAW-1', IFAB_LABEL, { type: 'full-size', widthM: 7.32 }, ['count'], 'DRAFT'],
        // K1 adds exactly one authorized production choice.
        ['pairing:FA-MINI-SOCCER-5V5-2026', 'the goal in The Mini-Soccer and Youth Futsal Handbook (England Football / The FA), 12 ft x 6 ft (3.6576 m x 1.8288 m)', { type: 'scaled', widthM: 3.6576 }, ['count'], 'DRAFT'],
        ['attribute:type=mini-goal', 'a mini-goal or pop-up goal', { type: 'mini-goal' }, ['count'], 'DRAFT'],
        ['other', 'another goal (enter its width)', {}, ['count', 'widthM'], 'DRAFT'],
        ['none', 'none', { count: 0 }, [], 'DRAFT'],
    ])
    assert.deepEqual(choices[0].from, [{ pairing: 'IFAB-LAW-1', document: 'IFAB Laws of the Game', citedAs: 'Law 1.6 (The Penalty Area) and Law 1.10 (Goals)' }])
    // The height is shown in the label and stated by no choice: no rule reads a stated height (the envelope carries no key the register does not list).
    assert.ok(choices.every(choice => !('heightM' in choice.states)))
    assert.deepEqual(sessionObjectChoices(), { kinds: [{ kind: KIND, choices }] })
    assert.deepEqual(objectChoicesOf('TEST-ONLY'), [], 'a kind the register does not list has none')
    assert.deepEqual(objectChoicesOf(KIND, index, null).map(choice => choice.id), ['attribute:type=full-size', 'attribute:type=scaled', 'attribute:type=mini-goal', 'other', 'none'], 'no block: no authorized goal')
    const routes = fs.readFileSync(path.join(__dirname, '../../routes/app.routes.ts'), 'utf8')
    const route = routes.indexOf('router.get(`${ROUTES.session}/object-choices`')
    assert.ok(route > 0 && route < routes.indexOf('model: Session,'), 'registered before the session routes, so the path is never read as an id')
    assert.ok(routes.slice(route, route + 400).includes('res.status(200).json(sessionObjectChoices())'))
})

// ── 4. The FA entry (TEST-ONLY): stated exactly, matched with no tolerance ───────────────────────────────
test('a TEST-ONLY FA 5v5 pairing: its choice states 3.6576 m and scaled exactly, and the goal version built from that statement is matched to it and served', () => {
    const choices = objectChoicesOf(KIND, index, blockWithFa())
    const fa = choices.find(choice => choice.id === `pairing:${FA_ID}`)!
    assert.deepEqual([fa.label, fa.states, fa.enters], [FA_LABEL, { type: 'scaled', widthM: FA_WIDTH }, ['count']])
    assert.ok(Object.is(fa.states.widthM, 3.6576), 'copied, never rounded')
    assert.deepEqual(choices.map(choice => choice.id), ['pairing:IFAB-LAW-1', `pairing:${FA_ID}`, 'attribute:type=mini-goal', 'other', 'none'], 'in the order the profile lists its pairings')
    // The statement the choice makes, carried whole by the envelope (nothing dropped, nothing added).
    const statement = stated(`pairing:${FA_ID}`, 1)
    assert.deepEqual(statement, { type: 'scaled', widthM: FA_WIDTH, count: 1 })
    const envelope = sessionEnvelopeFrom({ playerCount: 12, fieldLength: '40', fieldWidth: '30', specializedRoles: { ...none, [KEEPER]: 1 }, objects: { [KIND]: statement } }, { durationMin: 20 })
    assert.equal(envelope.outcome, 'stated')
    assert.deepEqual((envelope as any).session.objects, { [KIND]: { count: 1, widthM: FA_WIDTH, type: 'scaled' } })
    for (const [players, keepers] of [[12, 1], [12, 2], [11, 1]]) {
        const activity = goalBuild(sessionWith({ [KIND]: statement }, players, keepers)) as ServedActivity
        assert.equal(activity.outcome, 'served', `${players}/${keepers}: ${JSON.stringify((activity as any).reasons?.slice(0, 3) ?? null)}`)
        assert.deepEqual(selectionOf(activity), [[R2, 'SELECTED', null], ['A01-R1', 'NOT_TRIED', null]])
        // GA-BOUND-REGION matched the one pairing the choice names: the area the coach marks is the pairing's.
        const bound = activity.evidence!.boundRegions!.blocks.flatMap(block => block.bindings)
        assert.ok(bound.length > 0 && bound.every(binding => binding.pairing?.id === FA_ID), JSON.stringify(bound.map(b => b.pairing?.id)))
        assert.ok(activity.rendered.instructions.some(instruction => instruction.text.startsWith("Mark the goal's penalty area: 15 m wide")))
    }
    // Two pairings of one object make one choice, naming both documents (its statement is one statement).
    const twice = blockWithFa()
    twice.pairings.push({ ...copy(twice.pairings[1]), id: 'TEST-ONLY-FA-SECOND', document: 'TEST-ONLY: a second document' })
    const merged = objectChoicesOf(KIND, index, twice).filter(choice => choice.from && choice.from.length > 1)
    assert.deepEqual(merged.map(choice => [choice.id, choice.label, choice.from!.map(source => source.pairing)]), [[`pairing:${FA_ID}`, `the goal in ${FA_DOCUMENT} and TEST-ONLY: a second document, 12 ft x 6 ft (3.6576 m x 1.8288 m)`, [FA_ID, 'TEST-ONLY-FA-SECOND']]])
})

// ── 5. A rounded width is another goal ───────────────────────────────────────────────────────────────────
test("a goal typed at The FA's rounded 3.66 m is another goal: it does not suit a realization built for 3.6576 m, the zone version is served, and the reason names the authorized goal", () => {
    const typed = stated('other', 1, 3.66)
    assert.deepEqual(typed, { count: 1, widthM: 3.66 })
    const exactly = { min: FA_WIDTH, max: FA_WIDTH }
    const activity = goalBuild(sessionWith({ [KIND]: typed }), { suitability: exactly }) as ServedActivity
    assert.equal(activity.outcome, 'served', JSON.stringify((activity as any).reasons?.slice(0, 3) ?? null))
    assert.deepEqual(selectionOf(activity), [[R2, 'NOT_APPLICABLE', 'OBJECT_NOT_SUITABLE'], ['A01-R1', 'SELECTED', null]])
    assert.equal((activity.account.realizationSelection as any[])[0].summary, `The goals this session has do not suit this game; it is built for ${FA_LABEL}.`)
    // The zone version, exactly as production serves it.
    const production = buildActivityForReview({ kind: 'learning-goal', goalId: 'A01', situationId: null, session: sessionWith(undefined) } as any, { includeDrafts: true }) as ServedActivity
    assert.deepEqual(activity.rendered, production.rendered)
    // The authorized goals a realization is built for: admitted by its suitability AND with an area that fits the session's.
    assert.deepEqual(choicesSuitedTo(KIND, [exactly], { lengthM: 40, widthM: 30 }, index, blockWithFa()).map(choice => choice.id), [`pairing:${FA_ID}`])
    assert.deepEqual(choicesSuitedTo(KIND, [{ min: 1, max: 10 }], { lengthM: 40, widthM: 30 }, index, blockWithFa()).map(choice => choice.id), [`pairing:${FA_ID}`], "the regulation goal's area does not fit 30 m, so it is not named")
    assert.deepEqual(choicesSuitedTo(KIND, [{ min: 1, max: 10 }], { lengthM: 45, widthM: 42 }, index, blockWithFa()).map(choice => choice.id), ['pairing:IFAB-LAW-1', `pairing:${FA_ID}`])
    assert.deepEqual(choicesSuitedTo(KIND, [], { lengthM: 40, widthM: 30 }, index, blockWithFa()), [], 'nothing decided: nothing named')
    // With no authorized goal that suits and fits, the sentence is said as before.
    const unnamed = goalBuild(sessionWith({ [KIND]: { count: 1, widthM: 12 } }), { block: { ...loadSportBoundRegions()!, pairings: [loadSportBoundRegions()!.pairings[0]] } }) as ServedActivity
    assert.deepEqual(selectionOf(unnamed)[0], [R2, 'NOT_APPLICABLE', 'OBJECT_NOT_SUITABLE'])
    assert.equal((unnamed.account.realizationSelection as any[])[0].summary, 'The goals this session has do not suit this game.')
})

// ── 6. The build's question carries the choices ──────────────────────────────────────────────────────────
test("the build's question carries the choices: all of them where it asks how many or how wide, only those stating the attribute (and none) where it asks one; the live route passes them on", () => {
    const all = objectChoicesOf(KIND, index, blockWithFa())
    for (const [objects, asks] of [[undefined, 'AVAILABILITY'], [{ [KIND]: { count: 1 } }, 'WIDTH']] as const) {
        const asked = goalBuild(sessionWith(objects as any)) as RefusedActivity
        assert.deepEqual([asked.outcome, asked.stage, asked.question?.asks], ['refused', 'session', asks], asked.reasons?.join(' | '))
        assert.deepEqual(asked.question!.choices, all)
        assert.deepEqual(liveRefusalBody(asked, null).question, asked.question, 'whole')
    }
    // A goal of the FA width with no type: asked for the type, by the choices that state one.
    const attribute = goalBuild(sessionWith({ [KIND]: { count: 1, widthM: FA_WIDTH } })) as RefusedActivity
    assert.deepEqual([attribute.stage, attribute.question?.asks, attribute.question?.attribute?.name], ['session', 'ATTRIBUTE', 'type'], attribute.reasons.join(' | '))
    assert.deepEqual(attribute.question!.choices, choicesAnswering(all, 'type', FA_WIDTH, KIND))
    assert.deepEqual(attribute.question!.choices.map(choice => choice.id), [`pairing:${FA_ID}`, 'attribute:type=full-size', 'attribute:type=scaled', 'attribute:type=mini-goal', 'none'])
    // Answered by the FA choice, through the review route's own request builder: served, the goal version.
    const storedSession = { playerCount: 12, fieldLength: '40', fieldWidth: '30', specializedRoles: { ...none, [KEEPER]: 1 } }
    for (const asked of [undefined, { [KIND]: { count: 1, widthM: FA_WIDTH } }]) {
        const request = reviewRequestOf({ ...storedSession, ...(asked ? { objects: asked } : {}) }, { learningGoalId: 'A01', durationMin: 20, objects: { [KIND]: stated(`pairing:${FA_ID}`, 1) } })
        assert.ok(!('refusal' in request), JSON.stringify(request))
        const answered = goalBuild((request as any).session) as ServedActivity
        assert.deepEqual([answered.outcome, selectionOf(answered)[0]], ['served', [R2, 'SELECTED', null]], JSON.stringify((answered as any).reasons?.slice(0, 3) ?? null))
    }
    // Answered "none": the goal version does not apply, and the zone version is served (the question does not come back).
    const noneAnswer = goalBuild(sessionWith({ [KIND]: stated('none', 0) })) as ServedActivity
    assert.deepEqual(selectionOf(noneAnswer), [[R2, 'NOT_APPLICABLE', 'OBJECT_AVAILABILITY_SHORT'], ['A01-R1', 'SELECTED', null]])
})

// ── 7. The front (source reads) ──────────────────────────────────────────────────────────────────────────
test('the front: the session form, the review page and the live page answer by the server\'s choices; the API layer passes a refusal\'s question on', () => {
    const read = (file: string) => fs.readFileSync(path.join(__dirname, '../../../../front/src', file), 'utf8')
    const api = read('services/api.service.ts')
    assert.ok(api.includes("...(errorBody?.question && typeof errorBody.question === 'object' ? { question: errorBody.question } : {})"), 'the thrown error keeps the question')
    assert.ok(api.includes("...(candidate.question && typeof candidate.question === 'object' ? { question: candidate.question } : {})"), 'the normalized error keeps it')
    const live = read('app/ActivityGenerator.tsx')
    assert.ok(live.includes('setPendingQuestion(override?.planning ? questionFrom(res.question) : null)'), 'the live page reads the question of a guided build')
    assert.ok(live.includes('choices={pendingQuestion.choices ?? []}'), 'and answers it by the same choices')
    // The answer is saved to the session (every other kind kept), then the activity is built again from the same planning choices.
    const save = live.slice(live.indexOf('const answerPendingQuestion = async () => {'))
    assert.ok(save.indexOf('`${ROUTES.app.session}/${id}`') < save.indexOf('api(ROUTES.app.session, { _id: id, objects })') && save.indexOf('api(ROUTES.app.session, { _id: id, objects })') < save.indexOf('await generateFromPlanning(lastPlanning)'))
    assert.ok(save.includes('const objects = { ...(stored.data.objects ?? {}), [pendingQuestion.objectKind]: pendingAnswer }'))
    const field = read('components/ObjectChoiceField.tsx')
    assert.ok(field.includes("step='any'") && !field.includes('step={0.1}'), 'a typed width is kept as typed')
    assert.ok(field.includes("if (choice.enters.includes('count') && !(isCount(count) && count >= 1)) return undefined"), 'nothing is stated until the coach says how many')
    assert.ok(read('app/ActivityReviewPage.tsx').includes('<ObjectChoiceField kind={kind} choices={question.choices}'))
})

// ── 8. Production unchanged ──────────────────────────────────────────────────────────────────────────────
test('production unchanged: A01 serves the zone version whatever the session states, and asks nothing', () => {
    const production = buildActivityForReview({ kind: 'learning-goal', goalId: 'A01', situationId: null, session: sessionWith(undefined) } as any, { includeDrafts: true }) as ServedActivity
    assert.equal(production.outcome, 'served')
    for (const objects of [{ [KIND]: stated('pairing:IFAB-LAW-1', 1) }, { [KIND]: { count: 1, widthM: 3.66 } }, { [KIND]: { count: 0 } }]) {
        const activity = buildActivityForReview({ kind: 'learning-goal', goalId: 'A01', situationId: null, session: sessionWith(objects) } as any, { includeDrafts: true }) as ServedActivity
        assert.equal(activity.outcome, 'served', JSON.stringify(objects))
        for (const key of ['rendered', 'overview', 'diagram'] as const) assert.deepEqual(activity[key], production[key], `${JSON.stringify(objects)}: ${key}`)
        assert.deepEqual(selectionOf(activity), [['A01-R2', 'NOT_SELECTABLE', 'MISSING_KNOWLEDGE'], ['A01-R1', 'SELECTED', null]])
    }
})


// K1: production knowledge and serving paths. Later knowledge gaps are lifted only in memory where explicitly stated.
const faProduction = () => loadSportBoundRegions()!.pairings.find(p => p.id === 'FA-MINI-SOCCER-5V5-2026')!
const suitabilityProduction = () => loadProvisionalRealizations().find(r => r.provisionalId === R2)!.objectSuitability!
const k1Build = (statement: Record<string, unknown>, mutate = false) => {
    const file = readJson(PROVISIONAL_REALIZATIONS_FILE)
    if (mutate) delete file.realizations.find((r: any) => r.id === R2).objectSuitability[0].attributes
    return buildActivityUnderAuthorizationRecords({ kind: 'learning-goal', goalId: 'A01', situationId: null, session: sessionWith({ [KIND]: statement }) } as any, recordsOf(), { realizations: loadProvisionalRealizations(file), review: { includeDrafts: true } }).activity
}
test('K1 data: suitability equals exactly the FA object and the production choice reads it', () => {
    const object = faProduction().object
    const rule = suitabilityProduction()[0]
    assert.deepEqual({ kind: rule.kind, type: rule.attributes!.type[0], widthM: rule.widthM.min }, { kind: object.kind, type: object.type, widthM: object.widthM })
    assert.equal(rule.widthM.max, object.widthM)
    assert.deepEqual(rule.attributes, { type: [object.type!] })
    const choice = sessionObjectChoices().kinds.find(k => k.kind === KIND)!.choices.find(c => c.id === 'pairing:' + faProduction().id)!
    assert.deepEqual(choice.states, { type: object.type, widthM: object.widthM })
    assert.ok(choice.label.endsWith('12 ft x 6 ft (3.6576 m x 1.8288 m)'))
    assert.equal(faProduction().markM, 6)
})
test('K1 validation refuses an unlisted attribute, an unlisted value, an empty value list and malformed attributes', () => {
    for (const attributes of [{ colour: ['scaled'] }, { type: ['portable'] }, { type: [] }, []]) {
        const file = readJson(PROVISIONAL_REALIZATIONS_FILE)
        file.realizations.find((r: any) => r.id === R2).objectSuitability[0].attributes = attributes
        assert.ok(validateProvisionalRealizations(file).some(e => /object suitability.*(attribute|values)/.test(e)), JSON.stringify(attributes))
        assert.throws(() => loadProvisionalRealizations(file), /integrity gate/)
    }
})
test('K1 suitability: type precedes width; only the exact scaled object passes; missing type asks', () => {
    const contracts = [{ contractId: 'provisional:' + R2, objectSuitability: suitabilityProduction() }] as any
    const game = { objects: [{ elementId: 'TEST-ONLY', kind: KIND }] }
    const rule = (statement: Record<string, unknown>) => objectAvailabilityRefusal(index, game, { objects: { [KIND]: { count: 1, ...statement } } }, contracts)
    assert.equal(rule({ type: 'scaled', widthM: FA_WIDTH }), null)
    for (const statement of [{type:'full-size',widthM:7.32}, {type:'full-size',widthM:FA_WIDTH}, {type:'mini-goal'}, {type:'mini-goal',widthM:FA_WIDTH}, {type:'mini-goal',widthM:1}, {type:'scaled',widthM:3.66}, {type:'scaled',widthM:4}]) {
        assert.deepEqual([rule(statement)?.cause, (rule(statement) as any)?.decided], ['OBJECT_NOT_SUITABLE', true], JSON.stringify(statement))
        const activity = k1Build({ count: 1, ...statement }) as ServedActivity
        assert.equal(activity.outcome, 'served')
        assert.deepEqual(selectionOf(activity), [[R2, 'NOT_APPLICABLE', 'OBJECT_NOT_SUITABLE'], ['A01-R1', 'SELECTED', null]])
        assert.match((activity.account.realizationSelection as any[])[0].summary, /do not suit this game; it is built for .*12 ft x 6 ft/)
    }
    const asked = k1Build({ count:1, widthM:FA_WIDTH }) as RefusedActivity
    assert.deepEqual([asked.stage, asked.question?.asks], ['session','ATTRIBUTE'])
    assert.deepEqual(liveRefusalBody(asked, null).question, asked.question)
    const production = buildActivityForReview({ kind:'learning-goal', goalId:'A01', situationId:null, session:sessionWith({[KIND]:{count:1,type:'scaled',widthM:FA_WIDTH}}) } as any, { includeDrafts: true }) as ServedActivity
    assert.deepEqual(selectionOf(production), [[R2,'NOT_SELECTABLE','MISSING_KNOWLEDGE'], ['A01-R1','SELECTED',null]])
})
test('K1 ATTRIBUTE choices preserve a stated width, even where no authorized entry matches it', () => {
    for (const widthM of [FA_WIDTH, 4.125]) {
        const choices = choicesAnswering(objectChoicesOf(KIND), 'type', widthM, KIND)
        assert.deepEqual(choices.filter(c => c.from).map(c => c.id), widthM === FA_WIDTH ? ['pairing:' + faProduction().id] : [])
        assert.deepEqual(choices.filter(c => c.id.startsWith('attribute:')).map(c => c.states.type), ['full-size','scaled','mini-goal'])
        for (const choice of choices.filter(c => c.id !== 'none')) {
            assert.equal(choice.states.widthM, widthM)
            const answer = reviewRequestOf({playerCount:12,fieldLength:'40',fieldWidth:'30',specializedRoles:{...none,[KEEPER]:1}}, { learningGoalId:'A01', durationMin:20, objects:{[KIND]:{...choice.states,count:1}} })
            assert.equal((answer as any).session.objects[KIND].widthM, widthM)
        }
        assert.equal(choices[choices.length - 1].id, 'none')
    }
    const attributes = suitabilityProduction()[0].attributes
    assert.deepEqual(choicesSuitedTo(KIND, [{min:FA_WIDTH,max:FA_WIDTH,attributes:{type:['mini-goal']}}], {lengthM:40,widthM:30}), [])
    assert.deepEqual(choicesSuitedTo(KIND, [{min:FA_WIDTH,max:FA_WIDTH,attributes}], {lengthM:40,widthM:30}).map(c=>c.id), ['pairing:' + faProduction().id])
})
test('K1 mutation: dropping suitability attributes exposes GA-BOUND-REGION authorization refusal', () => {
    const activity = k1Build({count:1,type:'mini-goal',widthM:FA_WIDTH}, true) as RefusedActivity
    assert.equal(activity.outcome, 'refused')
    assert.equal(activity.stage, 'knowledge')
    assert.ok(activity.reasons.some(r => r.includes('BOUND_REGION_NOT_AUTHORIZED')), activity.reasons.join(' | '))
    assert.deepEqual(suitabilityProduction()[0].attributes, {type:['scaled']}, 'mutation was held in memory only')
})
test('K1 the FA mark is recorded but never placed, drawn or said to the coach', () => {
    const file = fileFor({min:FA_WIDTH,max:FA_WIDTH})
    const variant = file.realizations.find((r:any)=>r.id===R2)
    variant.objectSuitability = suitabilityProduction()
    for (const item of variant.items) if (item.value?.pairing === FA_ID) item.value.pairing = faProduction().id
    const build = (block: SportBoundRegions) => buildActivityUnderAuthorizationRecords({kind:'learning-goal',goalId:'A01',situationId:null,session:sessionWith({[KIND]:{count:1,type:'scaled',widthM:FA_WIDTH}})} as any, recordsOf(), {realizations:loadProvisionalRealizations(file),boundRegions:block,review:{includeDrafts:true}}).activity as ServedActivity
    const block = loadSportBoundRegions()!
    const activity = build(block)
    assert.equal(activity.outcome, 'served', (activity as any).reasons?.join(' | '))
    const changed = copy(block)
    changed.pairings.find(p=>p.id===faProduction().id)!.markM=123.456
    const other = build(changed)
    assert.equal(other.outcome, 'served')
    for (const key of ['rendered','overview','diagram','diagramDraft'] as const) {
        assert.deepEqual((other as any)[key], (activity as any)[key], key + ' must not consume markM')
    }
    assert.ok(!/penalty (spot|mark)|123\.456|\b6 m/.test(JSON.stringify([activity.rendered,activity.overview,activity.diagram])), 'no spot or mark instruction or shape')
})

console.log(`object-choices.unit.ts — ${passed} passed`)
