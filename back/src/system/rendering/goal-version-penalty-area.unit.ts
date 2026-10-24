/**
 * **The goal version's penalty area, recorded** — K2, 24 October 2026 (the d27 design's stage K2, its sections 1.5, 1.6 and 1.8).
 *
 * Christian, reply filed 27 October 2026, item 1: *"I agree with using an established small-sided goal and its corresponding penalty area as
 * the starting configuration for the 40 × 30 m activity."* *"Please verify the applicable FA specification and keep the goal, penalty area,
 * and penalty spot dimensions from the same authorized source rather than combining unrelated formats."* *"I also approve your proposed
 * general principle in 1b: a goal’s penalty-area geometry should ordinarily come from the same authorized format. Any exception should be
 * explicit and supported by the intended learning design."* Item 3: *"The penalty-area specification may include a penalty spot, but this
 * activity does not need to mark or use it."*
 *
 * A01-R2 now holds its goal's penalty area: five items (A01-R2-S2-1, S5-1, S6-1, S6-2, S7-1) for one zone of the function penalty-area,
 * set out from the goal's end line by the goal's own designation, centred on the goal, as wide and as deep as the FA 5v5 pairing
 * (FA-MINI-SOCCER-5V5-2026, recorded at K1), and bound to the goal with that pairing. No penalty spot and no goal area.
 *
 * What is pinned here:
 *   1. the five items as recorded: rows, requirements, values (the goal's designation, the pairing's width and depth, the binding), his
 *      words and where he said them, no item for a spot or a goal area, and nothing on the realization's check;
 *   2. the notes they made untrue, amended with the old words kept (A01-R2's note and check, the D-PENALTY-AREA and D-DEFAULT-LAWS gaps,
 *      still open);
 *   3. TEST-ONLY, the real records with only A01's three gaps lifted in memory (the real FA entry, ENFORCE as recorded, 40 x 30 m, the FA
 *      goal as a coach states it): served at 12/1, 12/2 and 11/1, coach and administrator; the area 0-9 m along and 7.5-22.5 m across at the
 *      goal's end line in BOTH blocks while the teams change ends; GA-BOUND-REGION passing before and after realization; the account owing
 *      nothing (LAW-12-GK applies in each block); the area set out once (one rectangle, from both blocks), said once and drawn in each block;
 *   4. nothing else changed: each block's game, its bound region set aside, is the game the same build gives without the five items;
 *   5. TEST-ONLY mutations, each on its own copy: off-centre, another width, another depth are refused at validation in both blocks, by
 *      GA-BOUND-REGION, never falling back to the zone version (and the area at the other end, or citing another pairing, at structure);
 *   6. production: A01-R2 is still listed and never tried; A01 serves the zone version, with no bound region.
 *
 * Nothing here changes a production file: every TEST-ONLY change is a copy in memory.
 *
 * Re-pointed 24 October 2026 (K3, the d27 design's stage K3): his reply filed 27 October 2026 settles the goal version's three decisions, so
 * items 2, 3 and 6 now read: 2. the K2 lines stay as written (old words kept), and the gaps are settled by his words (K3); 3. the REAL
 * records, nothing lifted in memory any more; 6. production serves the goal version for the FA goal, exactly as the build in 3 does, with its
 * bound region. Item 5 gains the off-centre mutation in the object form a record would write (the K2 review's should-fix).
 *
 * Run: npx ts-node --files -r tsconfig-paths/register ./src/system/rendering/goal-version-penalty-area.unit.ts
 */
import assert from 'node:assert/strict'

import { regionFunctionsOf } from '../derivation/bound-regions'
import { loadProvisionalRealizations, loadRegister, loadSportBoundRegions, PROVISIONAL_REALIZATIONS_FILE, readJson } from '../derivation/corpus'
import { indexRegister } from '../derivation/register'
import { boundRegionRefusalAfter, boundRegionRefusalBefore } from '../realization/bound-region-check'
import { learningGoalAuthorizations } from '../test-library/learning-goal-authorizations'
import { buildActivityForReview, buildActivityUnderAuthorizationRecords, RefusedActivity, ServedActivity } from './build-activity'
import { specializedRoleNames } from './session-envelope'

let passed = 0
function test(name: string, body: () => void): void {
    body()
    passed++
    console.log(`  ok  ${name}`)
}
console.log("the goal version's penalty area (K2)")

const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value))
const index = indexRegister(loadRegister())
const KEEPER = specializedRoleNames()[0]
const none = Object.fromEntries(specializedRoleNames().map(role => [role, 0]))
const R2 = 'A01-R2'
const PAIRING = 'FA-MINI-SOCCER-5V5-2026'
const SELECTOR = 'noun=zone & functions ∋ penalty-area'
const K2 = ['S2-1', 'S5-1', 'S6-1', 'S6-2', 'S7-1'].map(id => `${R2}-${id}`)
const REGION = `c:provisional:${R2}:${R2}-S2-1`
const GOAL = `c:provisional:${R2}:${R2}-O1-1`
const pairings = loadSportBoundRegions()!
const pairing = pairings.pairings.find(p => p.id === PAIRING)!
// His reply filed 27 October 2026, items 1 and 3 (byte-checked against the reply file when recorded).
const ITEM_1_APPROVAL = 'I agree with using an established small-sided goal and its corresponding penalty area as the starting configuration for the 40 × 30 m activity.'
const ITEM_1_VERIFY = 'Please verify the applicable FA specification and keep the goal, penalty area, and penalty spot dimensions from the same authorized source rather than combining unrelated formats.'
const ITEM_1B = 'I also approve your proposed general principle in 1b: a goal’s penalty-area geometry should ordinarily come from the same authorized format. Any exception should be explicit and supported by the intended learning design.'
const ITEM_3_SPOT = 'The penalty-area specification may include a penalty spot, but this activity does not need to mark or use it.'
const WORDS = `${ITEM_1_APPROVAL} ${ITEM_1_VERIFY} … ${ITEM_1B} … ${ITEM_3_SPOT}`
const CITED = 'his reply filed 27 October 2026, items 1 and 3'
const BOX = "Mark the goal's penalty area: 15 m wide, centred on the goal, and 9 m deep into the area; inside it the goalkeeper can handle the ball as in a normal game"

/** The FA goal as a coach states it, from the list (stage I): count, type and width copied from the entry, so the exact match needs no tolerance. */
const sessionOf = (players = 12, keepers = 1) => ({
    players,
    lengthM: 40,
    widthM: 30,
    durationMin: 20,
    roles: { ...none, [KEEPER]: keepers },
    objects: { goal: { count: 1, widthM: pairing.object.widthM, type: pairing.object.type! } },
})
const requestOf = (players = 12, keepers = 1) => ({ kind: 'learning-goal', goalId: 'A01', situationId: null, session: sessionOf(players, keepers) }) as const
/**
 * Every production realization item, the real FA entry and ENFORCE as recorded. Re-pointed 24 October 2026 (K3): the production records, as
 * they are; until K3 A01's record was copied here listing the goal version as tried (its three gaps lifted in memory, TEST-ONLY), which the
 * record itself now does.
 */
const recordsOf = () => learningGoalAuthorizations()
const productionFile = () => readJson(PROVISIONAL_REALIZATIONS_FILE)
const build = (file = productionFile(), players = 12, keepers = 1, extra: { includeDrafts?: boolean; boundRegions?: null } = {}) =>
    buildActivityUnderAuthorizationRecords(requestOf(players, keepers), recordsOf(), {
        realizations: loadProvisionalRealizations(file),
        review: { includeDrafts: extra.includeDrafts !== false },
        ...(extra.boundRegions === null ? { boundRegions: null } : {}),
    })
const variantOf = (file: any) => file.realizations.find((r: any) => r.id === R2)
const blocksOf = (fixture: any) => fixture.roleBlocks.blocks as any[]
const ROLE_CASES = [[12, 1], [12, 2], [11, 1]] as const

// ── 1. The items ─────────────────────────────────────────────────────────────────────────────────────────
test('the five items: one penalty-area zone, at the goal by its designation, centred, the pairing\'s width and depth, bound to the goal with the pairing; his words', () => {
    const variant = variantOf(productionFile())
    const items = variant.items.filter((i: any) => i.selector === SELECTOR)
    assert.deepEqual(items.map((i: any) => [i.id, i.row, i.requirement, i.strictness, i.scope, i.basis, i.category]), [
        [K2[0], 'S2', 'EXISTS', 'REQUIRED', 'WHOLE_GAME', 'OWNER_RULING', 'PROVISIONAL_REALIZATION_CHOICE'],
        [K2[1], 'S5', 'POSITIONED', 'REQUIRED', 'WHOLE_GAME', 'OWNER_RULING', 'PROVISIONAL_REALIZATION_CHOICE'],
        [K2[2], 'S6', 'POSITIONED', 'REQUIRED', 'WHOLE_GAME', 'OWNER_RULING', 'PROVISIONAL_REALIZATION_CHOICE'],
        [K2[3], 'S6', 'RANGE', 'REQUIRED', 'WHOLE_GAME', 'OWNER_RULING', 'PROVISIONAL_REALIZATION_CHOICE'],
        [K2[4], 'S7', 'EQUALS', 'REQUIRED', 'WHOLE_GAME', 'OWNER_RULING', 'PROVISIONAL_REALIZATION_CHOICE'],
    ])
    const [, along, across, width, binding] = items
    const goalAlong = variant.items.find((i: any) => i.id === `${R2}-O4-1`).value
    const goalAcross = variant.items.find((i: any) => i.id === `${R2}-O5-1`).value
    // The goal's own designation (so the area stays with it under the end exchange), from its end line to the pairing's depth.
    assert.deepEqual([along.value.term, along.value.forTeam, along.value.offsetM], [goalAlong.term, goalAlong.forTeam, { from: 0, to: pairing.region.depthM }])
    assert.deepEqual([along.value.offsetM.to, pairing.region.depthM], [9, 9])
    assert.equal(across.value.term, goalAcross.term)
    assert.equal(across.value.term, 'central')
    assert.deepEqual([width.value, width.typedBound], ['15 m wide', { min: pairing.region.widthM, max: pairing.region.widthM }])
    assert.equal(pairing.region.widthM, 15)
    assert.deepEqual([binding.value.structuralRef, binding.value.pairing], [{ contractId: `provisional:${R2}`, itemId: `${R2}-O1-1` }, PAIRING])
    // His words, whole, and where he said them; the basis evidence quotes each sentence.
    for (const item of items) {
        assert.deepEqual([item.words, item.citedAs], [WORDS, CITED], item.id)
        for (const sentence of [ITEM_1_APPROVAL, ITEM_1_VERIFY, ITEM_1B, ITEM_3_SPOT]) assert.ok(item.basisEvidence.includes(`"${sentence}"`), `${item.id}: ${sentence}`)
    }
    // No spot and no goal area: only these five items sit on the region rows, the pairing's mark is data no item reads.
    assert.deepEqual(variant.items.filter((i: any) => ['S2', 'S3', 'S4', 'S5', 'S6', 'S7'].includes(i.row)).map((i: any) => i.id), K2)
    assert.equal(pairing.markM, 6)
    assert.ok(!variant.items.some((i: any) => /\bspot\b|\bmark\b|goal area/i.test(`${JSON.stringify(i.value ?? null)} ${i.selector}`)), 'no item places a spot, a mark or a goal area')
    // The realization's check is what it was: ENFORCE.
    assert.equal(variant.defaultLawsCheck.mode, 'ENFORCE')
})

// ── 2. The notes ─────────────────────────────────────────────────────────────────────────────────────────
// Re-pointed 24 October 2026 (K3): was "...; the gaps stay open". The K2 lines are pinned as written; the gaps are settled at K3.
test('the notes the items made untrue are amended, dated, the old words kept; the gaps are settled at K3, after them', () => {
    const variant = variantOf(productionFile())
    const amended = (text: string, old: string, what: string) => {
        assert.ok(text.includes(old), `${what}: the old words are kept`)
        const at = text.indexOf('AMENDED 24 October 2026 (K2')
        assert.ok(at > text.indexOf(old), `${what}: a dated AMENDED line after them`)
        return text.slice(at)
    }
    const note = amended(variant.note, "a penalty area, a handling region or a handling rule (D-PENALTY-AREA open;", "A01-R2's note")
    assert.ok(note.includes(`"${ITEM_1_VERIFY}"`) && note.includes(`"${ITEM_3_SPOT}"`) && K2.every(id => note.includes(id.slice(R2.length + 1))))
    assert.ok(variant.note.indexOf('AMENDED 24 October 2026 (K2') > variant.note.indexOf('AMENDED 24 October 2026 (K1)'), 'after the K1 amendment')
    amended(variant.defaultLawsCheck.because, "What its account still owes is the goalkeeper's handling, until its goal's penalty area is bound (his item 1).", "A01-R2's check")
    const record = learningGoalAuthorizations().find(r => r.learningGoalId === 'A01')!
    const gap = (id: string) => record.gaps!.find(g => g.id === id)!
    const penalty = amended(gap('D-PENALTY-AREA').note!, 'Until he decides, no penalty area, handling region or handling rule is written for the goal version and nothing represents one', 'D-PENALTY-AREA')
    assert.ok([ITEM_1_APPROVAL, ITEM_1B, ITEM_3_SPOT].every(sentence => penalty.includes(`"${sentence}"`)))
    amended(gap('D-DEFAULT-LAWS').note!, "What the goal version still owes is the goalkeeper's handling (LAW-12-GK), in each block, until its goal's penalty area is bound (decision 1, his item 1).", 'D-DEFAULT-LAWS')
    // Re-pointed 24 October 2026 (K3): settled by his reply filed 27 October 2026 (pinned whole in learning-goal-authorizations.unit.ts), each
    // note keeping its K2 line and adding a K3 line after it; the goal version waits on nothing and is tried.
    for (const id of ['D-GOAL-SUITABILITY', 'D-PENALTY-AREA', 'D-DEFAULT-LAWS']) {
        assert.ok((gap(id).settledBy ?? []).length > 0, `${id} is settled by his words`)
        assert.ok(gap(id).note!.indexOf('AMENDED 24 October 2026 (K3') > Math.max(gap(id).note!.indexOf('AMENDED 24 October 2026 (K2'), gap(id).note!.indexOf('AMENDED 24 October 2026 (K1')), `${id}: the K3 line after the earlier ones`)
    }
    assert.deepEqual((record.realizations as any[]).map(entry => [entry.realization, entry.status ?? null, entry.gaps ?? null]), [
        [R2, null, null],
        ['A01-R1', null, null],
    ])
    // The K2 lines on the realization stay as written, and K3 adds its own after them.
    for (const text of [variant.note as string, variant.defaultLawsCheck.because as string]) assert.ok(text.indexOf('AMENDED 24 October 2026 (K3') > text.indexOf('AMENDED 24 October 2026 (K2'))
})

// ── 3. The real records, gaps lifted in memory ───────────────────────────────────────────────────────────
// Re-pointed 24 October 2026 (K3): the real records with nothing lifted in memory (was "TEST-ONLY, the real records", A01's gaps lifted).
test('the real records: 0-9 m along and 7.5-22.5 m across at the goal in both blocks while the teams change ends; GA-BOUND-REGION passes; the account owes nothing', () => {
    for (const [players, keepers] of ROLE_CASES) {
        const label = `${players}/${keepers}`
        const built = build(productionFile(), players, keepers)
        const activity = built.activity as ServedActivity
        assert.equal(activity.outcome, 'served', `${label}: ${JSON.stringify((built.activity as RefusedActivity).reasons)}`)
        assert.deepEqual(activity.account.realizationSelection!.map(r => [r.realization, r.outcome]), [[R2, 'SELECTED'], ['A01-R1', 'NOT_TRIED']], label)
        assert.equal(activity.integrity.fidelityViolations, 0, label)
        const blocks = blocksOf(built.fixture)
        assert.equal(blocks.length, 2, label)
        assert.ok((built.fixture as any).roleBlocks.checks.every((c: any) => c.verdict === 'PASS'), `${label}: every cross-block check passes`)
        const holders: string[] = []
        for (const block of blocks) {
            const game = block.fixture.game
            const building = block.fixture.record.roleBlock.holders.BUILDING
            holders.push(block.fixture.record.designationBindings.find((b: any) => b.designation === building).handle)
            const bound = (game.space.regions as any[]).filter(r => r.ofObject)
            assert.equal(bound.length, 1, `${label}: one bound region`)
            const [region] = bound
            assert.deepEqual([region.elementId, region.noun, regionFunctionsOf(region, index), region.ofObject.pairing], [REGION, 'zone', ['penalty-area'], PAIRING], label)
            const goal = (game.objects as any[]).find(o => o.elementId === GOAL)
            assert.deepEqual(goal.realizedGeometry.position.along.interval, { from: 0, to: 0 }, `${label}: the goal on the end line at the axis start`)
            assert.deepEqual(goal.realizedGeometry.position.across.interval, { from: 13.1712, to: 16.8288 }, `${label}: the 3.6576 m goal centred`)
            assert.deepEqual(region.realizedGeometry.position.along.interval, { from: 0, to: 9 }, `${label}: 0-9 m along, from the goal's end line`)
            assert.deepEqual(region.realizedGeometry.position.across.interval, { from: 7.5, to: 22.5 }, `${label}: 7.5-22.5 m across, 15 m centred`)
            assert.equal(boundRegionRefusalBefore(index, game, sessionOf(players, keepers), pairings), null, `${label}: GA-BOUND-REGION before realization`)
            assert.equal(boundRegionRefusalAfter(index, game, sessionOf(players, keepers), pairings), null, `${label}: GA-BOUND-REGION after realization`)
        }
        // Under EXCHANGED the teams change ends and roles; the goal and its area stay at the same end line.
        assert.notEqual(holders[0], holders[1], `${label}: the team holding the building role changes`)
        assert.deepEqual(blocks[1].fixture.record.roleBlock.ends, { TEAM_AT_AXIS_START: 'TEAM_AT_AXIS_END', TEAM_AT_AXIS_END: 'TEAM_AT_AXIS_START' })
        const account = activity.evidence!.boundRegions!
        assert.equal(account.check, 'GA-BOUND-REGION')
        assert.deepEqual(account.blocks.map(b => b.bindings.map(r => [r.region, r.object, r.pairing!.id, r.along, r.across])), [0, 1].map(() => [[REGION, GOAL, PAIRING, { from: 0, to: 9 }, { from: 7.5, to: 22.5 }]]))
        // The goalkeeper's handling applies in each block, so ENFORCE (as recorded) owes nothing.
        const laws = activity.evidence!.defaultLaws!
        assert.deepEqual([laws.realization, laws.mode, laws.owed, laws.heldSentence!.status], [R2, 'ENFORCE', [], 'DRAFT_SAID_NOTHING_OWED'], label)
        assert.deepEqual(laws.blocks.map(b => b.laws.filter(e => e.law === 'LAW-12-GK').map(e => e.status)), [['APPLIES'], ['APPLIES']], label)
        // Set out once (one rectangle, from both blocks), said once, drawn in each block; no spot, no goal area.
        const rectangles = (blocks[0].fixture.layout.rectangles as any[]).map(r => [r.along, r.across, r.depthM, r.widthM, r.end, r.sources.map((s: any) => s.regionId)])
        assert.deepEqual(rectangles, [[{ from: 0, to: 9 }, { from: 7.5, to: 22.5 }, 9, 15, 0, [REGION, REGION]]], label)
        const texts = activity.rendered.instructions.map(i => i.text)
        assert.equal(texts.filter(text => text === BOX).length, 1, `${label}: ${texts.join(' | ')}`)
        assert.ok(!texts.some(text => /penalty spot|penalty mark|goal area/i.test(text)), label)
        assert.ok(activity.rendered.instructions.length <= 28, `${label}: the Details are no more than the zone version's 28`)
        for (const block of activity.diagram!.blocks) assert.deepEqual(block.areas, [{ along: { from: 0, to: 9 }, across: { from: 7.5, to: 22.5 }, label: 'penalty area' }], label)
    }
    // The coach's page is the same activity (served, the same sentences).
    const coach = build(productionFile(), 12, 1, { includeDrafts: false }).activity as ServedActivity
    assert.equal(coach.outcome, 'served')
    assert.ok(coach.rendered.instructions.some(i => i.text === BOX))
})

// ── 4. Nothing else changed ──────────────────────────────────────────────────────────────────────────────
test('nothing else in the goal version changes: each block\'s game, its bound region set aside, is the game the same build gives without the five items', () => {
    /** TEST-ONLY: the same records and session without the five items; no bound-region block and REPORT, which a goal with no area needs. */
    const withoutArea = () => {
        const file = productionFile()
        const variant = variantOf(file)
        variant.items = variant.items.filter((i: any) => !K2.includes(i.id))
        variant.defaultLawsCheck = { mode: 'REPORT', because: 'TEST-ONLY', basis: { words: ['TEST-ONLY'], citedAs: 'TEST-ONLY' } }
        return file
    }
    const aside = (game: any) => {
        const g = copy(game)
        g.space.regions = (g.space.regions as any[]).filter(r => r.elementId !== REGION)
        return g
    }
    for (const [players, keepers] of ROLE_CASES) {
        const withArea = build(productionFile(), players, keepers)
        const without = build(withoutArea(), players, keepers, { boundRegions: null })
        assert.equal(without.activity.outcome, 'served', `${players}/${keepers}`)
        const a = blocksOf(withArea.fixture)
        const b = blocksOf(without.fixture)
        assert.deepEqual(a.map(block => block.blockId), b.map(block => block.blockId))
        a.forEach((block, n) => assert.deepEqual(aside(block.fixture.game), b[n].fixture.game, `${players}/${keepers} block ${n + 1}`))
        assert.equal((b[0].fixture.game.space.regions as any[]).some(r => r.elementId === REGION), false)
    }
})

// ── 5. Mutations ─────────────────────────────────────────────────────────────────────────────────────────
test('TEST-ONLY mutations: off-centre, another width and another depth are each refused at validation in both blocks, never falling back', () => {
    const original = productionFile()
    const refusedBy = (name: string, mutate: (items: any[]) => void, stage: string, reason: string) => {
        const file = copy(original)
        mutate(variantOf(file).items)
        const activity = build(file).activity as RefusedActivity
        assert.deepEqual([activity.outcome, activity.stage], ['refused', stage], `${name}: ${JSON.stringify(activity.reasons ?? null)}`)
        assert.equal(activity.reasons.filter(r => r.includes('GA-BOUND-REGION') && r.includes(reason)).length, 2, `${name}, in both blocks: ${activity.reasons.join(' | ')}`)
        assert.deepEqual(activity.account.realizationSelection!.map(r => [r.realization, r.outcome]), [[R2, 'REFUSED'], ['A01-R1', 'NOT_TRIED']], `${name}: no fall back`)
    }
    const itemOf = (items: any[], id: string) => items.find(i => i.id === `${R2}-${id}`)
    refusedBy('off-centre', items => (itemOf(items, 'S6-1').value = 'touchline-adjacent'), 'validation', 'the region is not centred on the object')
    // Added 24 October 2026 (K3; the K2 review's should-fix): the object form a record would write, { term, asAuthored }, measured on the
    // built layout. Still refused at validation in both blocks, never falling back, by its own message: the term places nothing (no realized
    // position across), and the envelope fit fails beside it.
    {
        const file = copy(original)
        itemOf(variantOf(file).items, 'S6-1').value = { term: 'touchline-adjacent', asAuthored: 'TEST-ONLY' }
        const activity = build(file).activity as RefusedActivity
        assert.deepEqual([activity.outcome, activity.stage], ['refused', 'validation'], `off-centre (object form): ${JSON.stringify(activity.reasons ?? null)}`)
        assert.equal(activity.reasons.filter(r => r.includes('GA-BOUND-REGION') && r.includes('holds no realized position along and across the area')).length, 2, `off-centre (object form), in both blocks: ${activity.reasons.join(' | ')}`)
        assert.ok(activity.reasons.some(r => r.includes('GA-ENVELOPE-FIT')), activity.reasons.join(' | '))
        assert.deepEqual(activity.account.realizationSelection!.map(r => [r.realization, r.outcome]), [[R2, 'REFUSED'], ['A01-R1', 'NOT_TRIED']], 'off-centre (object form): no fall back')
    }
    for (const width of [14, 16]) {
        refusedBy(`${width} m wide`, items => Object.assign(itemOf(items, 'S6-2'), { value: `${width} m wide (TEST-ONLY)`, typedBound: { min: width, max: width } }), 'validation', `is ${width} m wide across the area, and ${PAIRING} gives 15 m`)
    }
    for (const depth of [8, 10]) {
        refusedBy(`${depth} m deep`, items => (itemOf(items, 'S5-1').value.offsetM = { from: 0, to: depth }), 'validation', `lies 0-${depth} m along the area; ${PAIRING} sets it out`)
    }
    refusedBy('at the other end', items => (itemOf(items, 'S5-1').value.forTeam = 'ROLE_HOLDER_PRESSING'), 'structure', 'is not set out from the end line')
    refusedBy('citing another pairing', items => (itemOf(items, 'S7-1').value.pairing = 'IFAB-LAW-1'), 'structure', `the one authorized pairing for ${GOAL} as the session states it is ${PAIRING}`)
    assert.deepEqual(productionFile(), original, 'every mutation was made on a copy')
})

// ── 6. Production ────────────────────────────────────────────────────────────────────────────────────────
// Re-pointed 24 October 2026 (K3): was "production: the goal version is still listed and never tried; A01 serves the zone version with no
// bound region". Production now serves the goal version for the FA goal - exactly the real-record build above - its area bound and said once.
test('production: with the FA goal the goal version is served, its penalty area bound and said once, exactly as the real-record build', () => {
    for (const [players, keepers] of ROLE_CASES) {
        const activity = buildActivityForReview(requestOf(players, keepers), { includeDrafts: true }) as ServedActivity
        assert.equal(activity.outcome, 'served')
        assert.deepEqual(activity.account.realizationSelection!.map(r => [r.realization, r.outcome, r.cause]), [[R2, 'SELECTED', null], ['A01-R1', 'NOT_TRIED', null]])
        assert.deepEqual(activity.evidence!.boundRegions!.blocks.map(b => b.bindings.map(r => [r.region, r.pairing!.id])), [0, 1].map(() => [[REGION, PAIRING]]))
        assert.equal(activity.rendered.instructions.filter(i => i.text === BOX).length, 1)
        assert.deepEqual(activity, build(productionFile(), players, keepers).activity, `${players}/${keepers}: the review route's builder and the real-record build agree`)
    }
})

console.log(`goal-version-penalty-area.unit.ts — ${passed} passed`)
