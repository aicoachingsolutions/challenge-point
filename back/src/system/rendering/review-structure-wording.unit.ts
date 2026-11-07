/**
 * **Decision 1, generalized DRAFT coach-text support, tested in isolation** — 7 November 2026 (`review-structure-wording.ts` and the one
 * TEST-ONLY option `communicationSupplement` of `buildActivityUnderAuthorizationRecords`).
 *
 * Christian's reply received 7 November 2026, section 2, decision 1: "Approved for isolated implementation and testing." "Please add the
 * minimum reusable wording support necessary for reciprocal teams, target zones, and other structures already represented in the
 * configuration data." "The coach-facing text and diagram should derive from the structured configuration rather than require separately
 * authored instructions for each activity." "Preserve A01 behavior and keep the new draft functionality outside the live coach experience."
 * "This does not authorize unapproved scoring-condition language or the promotion of illustrative configuration values into canonical
 * knowledge."
 *
 * What is pinned, every build through the real chain and every move on a copy in memory:
 *   1. GF2's reciprocal end zones, 5 m and 8 m, through `buildActivityUnderAuthorizationRecords` with the option: served, fidelity 0, the
 *      one review-only sentence in the renderer's existing layout words (its section, status, citations and binding), the coach diagram
 *      DRAWN and served, the Coach Overview served; a coach's build of the same copy serves the same sentences;
 *   2. without the option, the same game is refused at communication exactly as today (the six fidelity findings, the same as the
 *      mechanism demonstration's route, which no option reaches);
 *   3. the guard, by mutation: unequal depths (a real build: silent, and the build refused exactly as without the option); on copies of
 *      the served game, a zone moved inward, a zone narrowed to half the width, both zones at one end (either one moved), and teams named
 *      by a role: silent, the rendering returned untouched, and fidelity refusing as without it; an unguarded copy of the sentence passes
 *      fidelity on the inward and half-width copies, so the guard is what keeps the sentence true; on A01's own role blocks the targets
 *      are attacked by teams named by a role;
 *   4. A01 byte-identical with and without the option, a coach's build and an administrator's, and equal to the live entries;
 *   5. GF2 on lines unchanged with the option, and the game form's own text;
 *   6. the review draft (`reviewDraftOf`) marks the sentence DRAFT, never APPROVED, and every other sentence as without it;
 *   7. no field only approved words may say is said by the supplement, also on a copy holding such fields (which stay withheld);
 *   8. the option only adds: a TEST-ONLY supplement that drops, reorders or replaces what the renderer said is refused by the build;
 *   9. statically: no non-unit module imports the module, and no non-unit module but `build-activity.ts` names the option, where it is
 *      named exactly twice in code (its declaration and its pass-through to `build`).
 *
 * The vehicle (TEST-ONLY, every part labelled): the GF2 game form alone under a Learning Goal's build, as
 * `realization/default-laws-composition.unit.ts` builds it: the TA02 DRAFT record from the TEST-ONLY draft store, its context taken out of
 * a copy of the selection, and a TEST-ONLY stand-in classification of the Laws with LAW-11 PROCEDURAL (neither our reading nor a ruling of
 * Christian), because a composed Learning Goal's activity is otherwise refused at validation for LAW-8 and LAW-11 before its text is
 * served. The zone depths are TEST-ONLY items (`depth` below), not knowledge: GF2 authors no depth, and the zone choice is the form's own
 * authorized alternative (`zone` for `line`).
 *
 * Run: node node_modules/ts-node/dist/bin.js --files -r tsconfig-paths/register ./src/system/rendering/review-structure-wording.unit.ts
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { LawsMateriality } from '../derivation/default-laws'
import { loadDraftStore, loadLawsMateriality } from '../derivation/draft-store'
import { LoadedContract } from '../derivation/types'
import { SuppliedRealization } from '../realization/supplied-realization'
import { learningGoalAuthorizations } from '../test-library/learning-goal-authorizations'
import { buildActivity, buildActivityForReview, buildActivityFromKnowledge, buildActivityUnderAuthorizationRecords, RefusedActivity, ServedActivity } from './build-activity'
import { checkFidelity } from './fidelity'
import { Instruction, RenderedActivity, renderConcreteGame, wordedFieldRows } from './render-concrete-game'
import { reviewDraftOf } from './review-draft'
import { REVIEW_ONLY, reciprocalEndZonesReading, ReviewOnlyInstruction, reviewStructureSentences, withReviewStructureWording } from './review-structure-wording'
import { specializedRoleNames } from './session-envelope'

const quiet = console.log
console.log = (...args: unknown[]) => {
    if (typeof args[0] === 'string' && args[0].startsWith('[selection-search]')) return
    quiet(...args)
}
let passed = 0
function test(name: string, run: () => void): void {
    try {
        run()
        passed++
        quiet(`  ok  ${name}`)
    } catch (error) {
        quiet(`  FAIL ${name}: ${(error as Error).stack ?? (error as Error).message}`)
        process.exitCode = 1
    }
}
quiet('decision 1, review-only structure wording (7 November 2026)')

const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const none = Object.fromEntries(specializedRoleNames().map(role => [role, 0]))
const session = { players: 12, lengthM: 40, widthM: 30, durationMin: 18, roles: { ...none } }
const records = learningGoalAuthorizations()
const store = loadDraftStore('ta02-composition')
const ours = loadLawsMateriality()
/** TEST-ONLY stand-in: our DRAFT classification with LAW-11 PROCEDURAL, a ruling nobody made (the precedent of default-laws-composition.unit.ts). */
const LAW_11_PROCEDURAL: LawsMateriality = {
    ...copy(ours),
    file: 'TEST-ONLY',
    standing: 'DRAFT - TEST-ONLY stand-in, LAW-11 PROCEDURAL: neither our reading nor a ruling of Christian',
    classifications: ours.classifications.map(entry => (entry.law === 'LAW-11' ? { ...entry, materiality: 'PROCEDURAL' as const, ourReading: 'TEST-ONLY stand-in.' } : { ...entry })),
}
/** TEST-ONLY: the TA02 DRAFT record's selection with its context taken out of a copy, so the game is the game form alone. */
const withoutContext = (selection: any) => {
    selection.selected = selection.selected.filter((entry: { role: string }) => entry.role !== 'representative performance context')
}
/** TEST-ONLY depth items, never knowledge: GF2 authors no depth for a target zone. */
const depth = (itemId: string, end: 'end-near' | 'end-far', metres: number) => ({
    itemId,
    row: 'S5',
    selector: `functions CONTAINS objective-area & longitudinal=${end}`,
    requirement: 'RANGE',
    value: `TEST-ONLY depth of the ${end} target`,
    typedBound: { min: metres, max: metres },
    strictness: 'REQUIRED',
    valueStatus: 'REQUIRED_RANGE',
    scope: 'WHOLE_GAME',
    basis: 'OWNER_RULING',
    basisEvidence: 'TEST-ONLY: never production data',
    checkability: 'STRUCTURAL',
    structuralClause: 'whole item',
})
const withDepths = (near: number, far: number) => (contracts: LoadedContract[]) => {
    const form = contracts.find(contract => contract.contractId === 'restated:GF2') as any
    form.items.push(depth('TEST-ONLY-NEAR', 'end-near', near), depth('TEST-ONLY-FAR', 'end-far', far))
}
/** The form's own authorized alternative for its targets (`zone` for `line`), with the scoring kind it entails, on a copy of the choices. */
const asZones = (supplied: SuppliedRealization) => {
    for (const choice of supplied.choices as any[]) {
        if (String(choice.lineId).endsWith('::S3')) choice.value = 'zone'
        if (choice.lineId === 'game::V1') choice.value = 'target_zone_entered'
    }
}
type Options = NonNullable<Parameters<typeof buildActivityUnderAuthorizationRecords>[2]>
type Built = ReturnType<typeof buildActivityUnderAuthorizationRecords>
const vehicle = (options: Options = {}, includeDrafts = true): Built =>
    buildActivityUnderAuthorizationRecords({ kind: 'learning-goal', goalId: 'TA02', session }, records, { drafts: store, alterSelection: withoutContext, review: { includeDrafts }, lawsMateriality: LAW_11_PROCEDURAL, ...options })
const once = <T>(make: () => T): (() => T) => {
    let made: { value: T } | null = null
    return () => (made ??= { value: make() }).value
}
const SUPPLEMENT = { communicationSupplement: withReviewStructureWording }
const zones = (d: number, e = d) => ({ alter: withDepths(d, e), alterSupplied: asZones })
const zones5With = once(() => vehicle({ ...zones(5), ...SUPPLEMENT }))
const zones5Without = once(() => vehicle(zones(5)))
const zones8With = once(() => vehicle({ ...zones(8), ...SUPPLEMENT }))
const zones8Without = once(() => vehicle(zones(8)))

const NEAR = 'c:restated:GF2:GF2-03.e'
const FAR = 'c:restated:GF2:GF2-03.f'
const NEAR_OBJECTIVE = 'c:restated:GF2:GF2-08.e'
const FAR_OBJECTIVE = 'c:restated:GF2:GF2-08.c'
const along = (id: string) => `space.regions[${id}].position.along`
const across = (id: string) => `space.regions[${id}].position.across`
const SENTENCE_FROM = [`space.regions[${NEAR}].noun`, along(NEAR), across(NEAR), `space.regions[${FAR}].noun`, along(FAR), across(FAR), `objectives[${NEAR_OBJECTIVE}].reference`, `objectives[${FAR_OBJECTIVE}].reference`]
/** The six findings the zone game is refused with today (the E5a refusal, placement-geometry.unit.ts (a)). */
const SIX = [
    `fidelity Q3: ${along(NEAR)} is established by the game and no instruction carries it`,
    `fidelity Q3: ${along(FAR)} is established by the game and no instruction carries it`,
    `fidelity Q3: ${across(NEAR)} is established by the game and no instruction carries it`,
    `fidelity Q3: ${across(FAR)} is established by the game and no instruction carries it`,
    `fidelity Q5: region ${NEAR} exists in the game and has no marking instruction`,
    `fidelity Q5: region ${FAR} exists in the game and has no marking instruction`,
]
const reviewOnly = (instructions: Instruction[]) => instructions.filter(instruction => (instruction as Partial<ReviewOnlyInstruction>).reviewOnly !== undefined) as ReviewOnlyInstruction[]
const violations = (fixture: any, rendered: RenderedActivity) =>
    checkFidelity(fixture, rendered)
        .findings.filter(finding => finding.severity === 'VIOLATION')
        .map(finding => `fidelity Q${finding.question}: ${finding.what}`)
const served = (built: Built): ServedActivity => {
    assert.equal(built.activity.outcome, 'served', JSON.stringify((built.activity as RefusedActivity).reasons))
    return built.activity as ServedActivity
}
const refused = (built: Built): RefusedActivity => {
    assert.equal(built.activity.outcome, 'refused')
    return built.activity as RefusedActivity
}

/* ── 1. Reciprocal end zones served with the supplement ───────────────────────────────────────────────────────────────────────── */
test('GF2 zones, 5 m and 8 m: served with the option, fidelity 0, the one review-only sentence, the diagram DRAWN and served, the overview served', () => {
    for (const [d, built] of [[5, zones5With()], [8, zones8With()]] as [number, Built][]) {
        const activity = served(built)
        assert.equal(activity.integrity.fidelityViolations, 0)
        assert.equal(activity.integrity.instructions, 8)
        assert.deepEqual(
            activity.rendered.instructions.map(instruction => `[${instruction.section}] ${instruction.text}`),
            [
                '[Set up] Mark out an area 40 m long by 30 m wide',
                `[Set up] Mark a ${d} m end zone across the full width at each end`,
                '[Players] Divide 12 players into 2 teams of 6, with no goalkeepers',
                '[How it works] Pick which team starts with the ball and tell both teams before you start',
                '[How it works] When possession changes, play carries on without a stoppage, and each team keeps attacking the same target',
                '[How to score] A team scores 1 point by getting the ball under control into its target zone: running it in, or passing to a teammate who receives it under control inside',
                `[How to score] Each team attacks the zone at the other team's end. Decide which team starts at which end; the ends stay the same for the whole game`,
                '[When it ends] Play for 18 minutes',
            ],
            `${d} m`,
        )
        const [sentence, ...more] = reviewOnly(activity.rendered.instructions)
        assert.deepEqual(more, [], 'exactly one sentence is added')
        const text = `Mark a ${d} m end zone across the full width at each end`
        assert.deepEqual(
            { ...sentence },
            {
                section: 'Set up',
                when: 'UNDERSTAND_AND_BEGIN',
                tier: 'setup',
                text,
                status: 'STARTING',
                from: SENTENCE_FROM,
                quantities: [d],
                parts: [{ text, status: 'STARTING', from: SENTENCE_FROM, quantities: [d], bindings: [{ quantity: d, path: along(NEAR) }] }],
                reviewOnly: REVIEW_ONLY,
            },
        )
        assert.equal(REVIEW_ONLY, 'DRAFT_NOT_SERVED')
        // The diagram: drawn from the configuration (the Set up sentence cites both zones), checked, and served.
        assert.ok(activity.diagram, 'the coach diagram is served')
        assert.equal(activity.diagramDraft!.verdict, 'DRAWN')
        assert.deepEqual(activity.diagramDraft!.findings, [])
        const block = activity.diagramDraft!.diagram!.blocks[0] as any
        assert.deepEqual(
            block.markings.zones.map((zone: any) => [zone.elementId, zone.along, zone.across]),
            [
                [NEAR, { from: 0, to: d }, { from: 0, to: 30 }],
                [FAR, { from: 40 - d, to: 40 }, { from: 0, to: 30 }],
            ],
        )
        assert.deepEqual(
            block.targets.map((target: any) => [target.region, target.attackedBy, target.label.text, target.markedZone]),
            [
                [FAR, 'TEAM_AT_AXIS_START', 'target zone', FAR],
                [NEAR, 'TEAM_AT_AXIS_END', 'target zone', NEAR],
            ],
        )
        assert.deepEqual(
            block.dimensions.filter((dimension: any) => dimension.kind === 'ZONE_DEPTH').map((dimension: any) => [dimension.of, dimension.from, dimension.to, dimension.quantity, dimension.path]),
            [
                [NEAR, 0, d, d, along(NEAR)],
                [FAR, 40 - d, 40, d, along(FAR)],
            ],
        )
        // The overview: served, checked against these Details.
        assert.ok(activity.overview, 'the Coach Overview is served')
        assert.equal(activity.overview!.game, `2 teams of 6: each team attacks the zone at the other team's end.`)
        assert.equal(activity.overview!.parameters, '40 x 30 m, 12 players, 18 minutes')
    }
    // A coach's build of the same TEST-ONLY copy serves the same sentences (the option is not tied to the administrator's review).
    const coach = served(vehicle({ ...zones(5), ...SUPPLEMENT }, false))
    assert.deepEqual(coach.rendered, served(zones5With()).rendered)
})

/* ── 2. Without the option, refused exactly as today ──────────────────────────────────────────────────────────────────────────── */
test('without the option the zone game is refused at communication exactly as today, as on the route no option reaches', () => {
    for (const built of [zones5Without(), zones8Without()]) {
        const activity = refused(built)
        assert.deepEqual([activity.stage, activity.summary], ['communication', 'Part of this activity cannot be explained to a coach yet, so it is not being shown.'])
        assert.deepEqual(activity.reasons, SIX)
    }
    const demonstration = buildActivityFromKnowledge(['GF2'], session, zones(5)).activity as RefusedActivity
    assert.deepEqual([demonstration.outcome, demonstration.stage, demonstration.reasons], ['refused', 'communication', SIX])
    // The option given as undefined is the option absent.
    assert.equal(JSON.stringify(vehicle({ ...zones(5), communicationSupplement: undefined })), JSON.stringify(zones5Without()))
})

/* ── 3. The guard, by mutation ────────────────────────────────────────────────────────────────────────────────────────────────── */
test('unequal depths (5 m and 6 m, a real build): silent, and the build refused exactly as without the option', () => {
    const without = vehicle(zones(5, 6))
    const withIt = vehicle({ ...zones(5, 6), ...SUPPLEMENT })
    assert.equal(JSON.stringify(withIt), JSON.stringify(without))
    assert.deepEqual([refused(withIt).stage, refused(withIt).reasons], ['communication', SIX])
    const fixture = without.fixture as any
    assert.deepEqual(reciprocalEndZonesReading(fixture, renderConcreteGame(fixture).instructions), { said: null, silentBecause: ['the two depths differ'] })
})

/** Moves one region's realized interval on one axis, in both places a fixture holds it (as placement-geometry.unit.ts moves it). */
const moveRegion = (fixture: any, elementId: string, axis: 'along' | 'across', interval: { from: number; to: number }) => {
    const entries = (fixture.status.geometry as any[]).filter(g => g.path === `space.regions[${elementId}].position.${axis}`)
    assert.equal(entries.length, 1, `the fixture holds the ${axis} geometry of ${elementId}`)
    entries[0].geometry.interval = { ...interval }
    const region = (fixture.game.space.regions as any[]).find(r => String(r.elementId) === elementId)
    if (region?.realizedGeometry?.position?.[axis]) region.realizedGeometry.position[axis].interval = { ...interval }
}
test('on copies of the served game: inward, half width, both at one end, teams named by a role: silent, untouched, refused', () => {
    const base = zones5With().fixture as any
    const asBuilt = reviewOnly(served(zones5With()).rendered.instructions)[0]
    const cases: [string, (fixture: any) => void, string[], boolean][] = [
        ['a zone moved inward (2 m to 7 m)', fixture => moveRegion(fixture, NEAR, 'along', { from: 2, to: 7 }), [`${NEAR}: does not touch the end line its attacking team attacks`], true],
        ['a zone narrowed to half the width', fixture => moveRegion(fixture, NEAR, 'across', { from: 0, to: 15 }), [`${NEAR}: not across the full width`], true],
        ['both zones at the near end', fixture => moveRegion(fixture, FAR, 'along', { from: 0, to: 5 }), [`${FAR}: does not touch the end line its attacking team attacks`], false],
        ['both zones at the far end', fixture => moveRegion(fixture, NEAR, 'along', { from: 35, to: 40 }), [`${NEAR}: does not touch the end line its attacking team attacks`], false],
        [
            'teams named by a role (TEST-ONLY nouns)',
            fixture => (fixture.roleNouns = { nouns: { 'TEST-ONLY-R1': 'first team', 'TEST-ONLY-R2': 'second team' }, holders: { TEAM_AT_AXIS_START: 'TEST-ONLY-R1', TEAM_AT_AXIS_END: 'TEST-ONLY-R2' } }),
            [`${NEAR}: the team attacking it is named by a role`, `${FAR}: the team attacking it is named by a role`],
            false,
        ],
    ]
    // As built, the guard holds and says the sentence the build served.
    const control = copy(base)
    const controlRendered = renderConcreteGame(control)
    assert.deepEqual(reciprocalEndZonesReading(control, controlRendered.instructions), { said: asBuilt, silentBecause: [] })
    for (const [label, mutate, why, unguardedPasses] of cases) {
        const fixture = copy(base)
        mutate(fixture)
        const rendered = renderConcreteGame(fixture)
        assert.deepEqual(reciprocalEndZonesReading(fixture, rendered.instructions), { said: null, silentBecause: why }, label)
        assert.equal(withReviewStructureWording(fixture, rendered), rendered, `${label}: the rendering is returned untouched`)
        assert.deepEqual(violations(fixture, withReviewStructureWording(fixture, rendered)), SIX, `${label}: refused as without the supplement`)
        // The guard is load-bearing: fidelity does not read placement words, so an unguarded copy of the sentence would pass it here.
        if (unguardedPasses) assert.deepEqual(violations(fixture, { ...rendered, instructions: [rendered.instructions[0], asBuilt, ...rendered.instructions.slice(1)] }), [], `${label}: an unguarded copy passes fidelity`)
    }
})
test(`on A01's own role blocks: every target is marked by the renderer, and a target unsaid would be attacked by a team named by a role`, () => {
    const keeper = specializedRoleNames()[0]
    const request = { kind: 'learning-goal' as const, goalId: 'A01', situationId: null, session: { players: 12, lengthM: 40, widthM: 30, durationMin: 20, roles: { ...none, [keeper]: 1 }, objects: { goal: { count: 0 } } } }
    const blocks = (buildActivityUnderAuthorizationRecords(request, records, { review: { includeDrafts: true } }).fixture as any).roleBlocks.blocks as any[]
    assert.equal(blocks.length, 2)
    for (const block of blocks) {
        assert.deepEqual(reciprocalEndZonesReading(block.fixture, renderConcreteGame(block.fixture).instructions), { said: null, silentBecause: ['0 unmarked target region(s), not two'] }, block.blockId)
        const unsaid = reciprocalEndZonesReading(block.fixture, [])
        assert.equal(unsaid.said, null, block.blockId)
        assert.ok(unsaid.silentBecause.length > 0 && unsaid.silentBecause.every(why => why.endsWith(': the team attacking it is named by a role')), `${block.blockId}: ${JSON.stringify(unsaid.silentBecause)}`)
    }
})

/* ── 4. A01 byte-identical ────────────────────────────────────────────────────────────────────────────────────────────────────── */
test('A01: byte-identical with and without the option, for a coach and an administrator, and equal to the live entries', () => {
    const keeper = specializedRoleNames()[0]
    const request = { kind: 'learning-goal' as const, goalId: 'A01', situationId: null, session: { players: 12, lengthM: 40, widthM: 30, durationMin: 20, roles: { ...none, [keeper]: 1 }, objects: { goal: { count: 0 } } } }
    for (const includeDrafts of [false, true]) {
        const without = buildActivityUnderAuthorizationRecords(request, records, { review: { includeDrafts } })
        const withIt = buildActivityUnderAuthorizationRecords(request, records, { review: { includeDrafts }, ...SUPPLEMENT })
        assert.equal(JSON.stringify(withIt), JSON.stringify(without), `includeDrafts ${includeDrafts}`)
        const activity = served(withIt)
        assert.equal(activity.rendered.instructions.length, 29)
        assert.deepEqual(reviewOnly(activity.rendered.instructions), [])
        const live = includeDrafts ? buildActivityForReview(request, { includeDrafts: true }) : buildActivity(request)
        assert.equal(JSON.stringify(withIt.activity), JSON.stringify(live), `the live entry, includeDrafts ${includeDrafts}`)
    }
})

/* ── 5. GF2 on lines unchanged ────────────────────────────────────────────────────────────────────────────────────────────────── */
test(`GF2 on lines: unchanged with the option, the game form's own text`, () => {
    const without = vehicle()
    const withIt = vehicle(SUPPLEMENT)
    assert.equal(JSON.stringify(withIt), JSON.stringify(without))
    const activity = served(withIt)
    assert.deepEqual(reviewOnly(activity.rendered.instructions), [])
    assert.equal(activity.rendered.instructions.length, 8)
    assert.ok(activity.rendered.instructions.some(instruction => instruction.text === 'Mark both end lines: they are the scoring lines'))
    const fixture = withIt.fixture as any
    assert.deepEqual(reciprocalEndZonesReading(fixture, renderConcreteGame(fixture).instructions).silentBecause, ['0 unmarked target region(s), not two'])
    const demonstration = buildActivityFromKnowledge(['GF2'], session).activity as ServedActivity
    assert.deepEqual(activity.rendered.instructions, demonstration.rendered.instructions)
})

/* ── 6. The review draft ──────────────────────────────────────────────────────────────────────────────────────────────────────── */
test('the review draft marks the sentence DRAFT, never APPROVED, and every other sentence as without it', () => {
    for (const built of [zones5With(), zones8With()]) {
        const fixture = built.fixture as any
        const activity = served(built)
        const draft = reviewDraftOf([fixture], activity.rendered, [])
        const marks = draft.instructions.map(instruction => [instruction.text, instruction.wording])
        const added = reviewOnly(activity.rendered.instructions)[0]
        assert.deepEqual(
            marks.filter(([text]) => text === added.text),
            [[added.text, 'DRAFT']],
        )
        const plain = reviewDraftOf([fixture], renderConcreteGame(fixture), [])
        assert.deepEqual(
            marks.filter(([text]) => text !== added.text),
            plain.instructions.map(instruction => [instruction.text, instruction.wording]),
        )
        assert.deepEqual(
            marks.filter(([, wording]) => wording === 'APPROVED').map(([text]) => text),
            ['When possession changes, play carries on without a stoppage, and each team keeps attacking the same target'],
        )
        assert.equal(draft.status, 'DRAFT_NOT_SERVED')
    }
})

/* ── 7. No field only approved words may say ──────────────────────────────────────────────────────────────────────────────────── */
test('no field only approved words may say is said by the supplement, also beside such fields, which stay withheld', () => {
    for (const built of [zones5With(), zones8With()]) {
        const fixture = built.fixture as any
        const worded = wordedFieldRows(fixture.game).map(field => field.path)
        for (const sentence of reviewOnly(served(built).rendered.instructions)) {
            const cited = [...sentence.from, ...(sentence.parts ?? []).flatMap(part => part.from)]
            assert.ok(!cited.some(path => path.startsWith('value.') || path.startsWith('activityRoles')), JSON.stringify(cited))
            assert.ok(!cited.some(path => worded.some(field => path === field || path.startsWith(`${field}.`) || path.startsWith(`${field}[`))))
        }
    }
    // A TEST-ONLY copy holding a primary-event condition: the renderer withholds its fields; the supplement says only its own sentence,
    // citing none of them, and the withheld fields are kept, so the build would still refuse it at communication.
    const fixture = copy(zones5With().fixture as any)
    fixture.game.value.primaryEvent.conditions = [{ elementId: 'TEST-ONLY-CONDITION', type: 'control', referents: ['TEST-ONLY'], value: 'TEST-ONLY condition value' }]
    const rendered = renderConcreteGame(fixture)
    const worded = wordedFieldRows(fixture.game).map(field => field.path)
    assert.deepEqual(worded, ['value.primaryEvent.conditions[TEST-ONLY-CONDITION].type', 'value.primaryEvent.conditions[TEST-ONLY-CONDITION].referents', 'value.primaryEvent.conditions[TEST-ONLY-CONDITION].value'])
    assert.deepEqual(rendered.withheld.map(field => field.path), worded)
    const merged = withReviewStructureWording(fixture, rendered)
    assert.equal(merged.withheld, rendered.withheld, 'the withheld fields are kept')
    const added = reviewStructureSentences(fixture, rendered.instructions)
    assert.equal(added.length, 1)
    assert.ok(!added[0].from.some(path => worded.includes(path)))
    assert.deepEqual(reviewOnly(merged.instructions), added)
})

/* ── 8. The option only adds ──────────────────────────────────────────────────────────────────────────────────────────────────── */
test('the option only adds: a TEST-ONLY supplement that drops, reorders or replaces what the renderer said is refused by the build', () => {
    const refusal = /a TEST-ONLY communication supplement may only add sentences/
    const dropsOne = (_fixture: Record<string, unknown>, rendered: RenderedActivity): RenderedActivity => ({ ...rendered, instructions: rendered.instructions.slice(1) })
    const reorders = (_fixture: Record<string, unknown>, rendered: RenderedActivity): RenderedActivity => ({ ...rendered, instructions: [rendered.instructions[1], rendered.instructions[0], ...rendered.instructions.slice(2)] })
    const rewords = (_fixture: Record<string, unknown>, rendered: RenderedActivity): RenderedActivity => ({ ...rendered, instructions: rendered.instructions.map((instruction, n) => (n === 0 ? { ...instruction } : instruction)) })
    const clearsWithheld = (_fixture: Record<string, unknown>, rendered: RenderedActivity): RenderedActivity => ({ ...rendered, withheld: [] })
    const dropsObservations = (_fixture: Record<string, unknown>, rendered: RenderedActivity): RenderedActivity => ({ ...rendered, coachingObservations: [] })
    for (const [label, supplement] of [['drops one', dropsOne], ['reorders', reorders], ['replaces one', rewords], ['clears the withheld fields', clearsWithheld], ['replaces the observations', dropsObservations]] as const) {
        assert.throws(() => vehicle({ communicationSupplement: supplement }), refusal, label)
    }
    // Returning the renderer's rendering itself, or adding only, is accepted.
    const identity = (_fixture: Record<string, unknown>, rendered: RenderedActivity): RenderedActivity => rendered
    assert.equal(JSON.stringify(vehicle({ communicationSupplement: identity })), JSON.stringify(vehicle()))
})

/* ── 9. Static: who imports the module, who names the option ──────────────────────────────────────────────────────────────────── */
test('statically: no non-unit module imports the module; only build-activity.ts names the option, twice in code', () => {
    const SRC = path.resolve(__dirname, '..', '..')
    const files: string[] = []
    const walk = (dir: string) => {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            const full = path.join(dir, entry.name)
            if (entry.isDirectory()) walk(full)
            else if (entry.name.endsWith('.ts') && !entry.name.endsWith('.unit.ts')) files.push(full)
        }
    }
    walk(SRC)
    assert.ok(files.length > 100, 'the scan reads the source tree')
    const relative = (file: string) => path.relative(SRC, file).split(path.sep).join('/')
    // A static import, a require, and a dynamic import() (the forms draft-store.unit.ts scans for).
    const IMPORTS = /(from|require\s*\(|import\s*\()\s*['"][^'"]*review-structure-wording['"]/
    assert.ok([`import('./review-structure-wording')`, `await import ( '../rendering/review-structure-wording' )`, `require('./review-structure-wording')`, `from './review-structure-wording'`].every(text => IMPORTS.test(text)), 'the scan sees each form')
    assert.deepEqual(files.filter(file => IMPORTS.test(fs.readFileSync(file, 'utf8'))).map(relative), [], 'only unit tests import the review-only wording')
    // The option's name: in no non-unit module but build-activity.ts.
    assert.deepEqual(files.filter(file => fs.readFileSync(file, 'utf8').includes('communicationSupplement')).map(relative), ['system/rendering/build-activity.ts'])
    const lines = fs.readFileSync(path.join(__dirname, 'build-activity.ts'), 'utf8').split('\n').filter(line => line.includes('communicationSupplement'))
    assert.deepEqual(
        lines.map(line => line.trim()),
        ['communicationSupplement?: (fixture: Record<string, unknown>, rendered: RenderedActivity) => RenderedActivity', 'options.communicationSupplement ?? null,'],
    )
    // Registered.
    const registry = JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', '..', '..', 'scripts', 'unit-tests.json'), 'utf8')) as string[]
    assert.ok(registry.includes('./src/system/rendering/review-structure-wording.unit.ts'))
})

console.log = quiet
quiet(`review-structure-wording: ${passed} passed`)
if (process.exitCode) quiet('review-structure-wording: FAILURES ABOVE')
