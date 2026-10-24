/**
 * **The goal version, switched on** — K3, 24 October 2026 (the d27 design's stage K3, its sections 2.5, 2.6, 2.8 and 4.2).
 *
 * Christian, reply filed 27 October 2026, item 1: *"I agree with using an established small-sided goal and its corresponding penalty area as
 * the starting configuration for the 40 × 30 m activity."* Item 6: *"A mini-goal is not automatically equivalent to an appropriate
 * goalkeeper-defended goal."* *"Where normal soccer rules remain relevant during live play, they should continue to apply unless explicitly
 * modified."* Item 2: *"I approve no offside for this initial realization, with that modification communicated once to the coach."* Item 4:
 * *"Whenever the ball becomes dead, play resets to a new goalkeeper-initiated build-out."* Item 9: *"The existing target-zone realization
 * remains our validated baseline, while the physical-goal version becomes the preferred candidate when the appropriate resources are
 * available."* His reply filed 26 October 2026, item 11: *"Do not infer a goal from the presence of a goalkeeper or silently treat missing
 * information as confirmation that no goal exists."*
 *
 * His reply filed 27 October 2026 settles the goal version's three decisions (A01's gaps D-GOAL-SUITABILITY, D-PENALTY-AREA, D-DEFAULT-LAWS,
 * each with his words: learning-goal-authorizations.unit.ts), so A01's record lists the goal version (A01-R2) as tried, first. What is pinned
 * here, on the production records through the review route's own function (`reviewActivity`, a stored session as Mongo holds one) and the live
 * pathway (`liveCheckedActivity`), at the 40 x 30 m testing area - the design's 4.2 verification matrix:
 *   1. the FA 5v5 goal (the list's choice: type scaled, 3.6576 m) at 12/1, 12/2 and 11/1: the goal version SERVED - the teams change ends at the
 *      block, the goalkeeper and one outfield player move at 12 players (the goalkeeper alone at 11), the penalty area set out once in its own
 *      Set up sentence, the goalkeeper's colour closing the roster and its marker drawn with the goal in both blocks, the default-laws account
 *      under ENFORCE owing nothing and the normal rules said, one restart rule, "There is no offside" said once, his approved scoring sentences
 *      (A01-W1, A01-W3) byte for byte and the zone version's regain sentence (A01-W2) not said, no 5 m zone, spot or goal area, each team in
 *      one colour in both blocks, no more Details than the zone version, nothing unfaithful; the live pathway serves the same activity;
 *   2. the zone version for none and for every goal that does not suit (a mini-goal at any width, a full-size goal, 3.66 m typed as scaled or
 *      as another goal, 5 m): served, its words, overview, diagram and blocks identical to the build with none, the goal version named with
 *      why it did not apply; the live pathway serves the same activity;
 *   3. a session that has not said what goals it has is ASKED (every choice offered), and 3.6576 m with no type is asked its type; with no
 *      goalkeeper the roster refuses both versions; any area other than 40 x 30 m is refused for both (TESTING_AREA).
 *
 * Re-pointed 24 October 2026 (the completeness audit of the field-test build, item 1; his reply filed 27 October 2026, item 6: "Goalkeeper
 * identification: The goalkeeper should be visually distinguishable from the outfield players. Stable team identities and clear role labels
 * remain important in the diagram."): the colour clause is written for LAW-4-GK (IFAB Law 4.3), so in 1 the account records that law applying
 * in each block too, and in 2 the zone version closes its roster with the colour (once, citing LAW-4-GK) and says none of the goal version's
 * other sentences (no penalty area, no handling, no normal rules); its diagram draws no goalkeeper marker, there being no goal to place one at.
 *
 * Run: npx ts-node --files -r tsconfig-paths/register ./src/system/rendering/goal-version-switch.unit.ts
 */
import assert from 'node:assert/strict'

import { loadSportBoundRegions } from '../derivation/corpus'
import { reviewActivity } from './activity-review'
import { approvedWording } from './approved-wording'
import { RefusedActivity, ServedActivity } from './build-activity'
import { liveCheckedActivity, liveSelectionFor } from './live-activity'
import { specializedRoleNames } from './session-envelope'
import { sessionObjectChoices } from './session-object-choices'

let passed = 0
function test(name: string, body: () => void): void {
    body()
    passed++
    console.log(`  ok  ${name}`)
}
console.log('the goal version, switched on (K3)')

const quiet = console.log
const KEEPER = specializedRoleNames()[0]
const none = Object.fromEntries(specializedRoleNames().map(role => [role, 0]))
const R2 = 'A01-R2'
const FA = loadSportBoundRegions()!.pairings.find(pairing => pairing.id === 'FA-MINI-SOCCER-5V5-2026')!
const FA_GOAL = { goal: { count: 1, type: FA.object.type!, widthM: FA.object.widthM } }
const NO_GOAL = { goal: { count: 0 } }
/** A stored session as Mongo holds one: the playing area as strings, the roles, and its objects where stated. */
const stored = (players: number, keepers: number, objects?: Record<string, unknown>, area: [number, number] = [40, 30]) =>
    ({ playerCount: players, fieldLength: String(area[0]), fieldWidth: String(area[1]), specializedRoles: { ...none, [KEEPER]: keepers }, ...(objects ? { objects } : {}) }) as any
const review = (session: any) => reviewActivity(session, { learningGoalId: 'A01', durationMin: 20 })
console.log = () => undefined
const live = liveSelectionFor('A01', 'medium')
console.log = quiet
const viaLive = (session: any) => {
    console.log = () => undefined
    try {
        return liveCheckedActivity(session, { learningGoalId: 'A01', practiceSituationId: null, durationMin: 20 }, live)
    } finally {
        console.log = quiet
    }
}
const selectionOf = (activity: ServedActivity | RefusedActivity) => (activity.account.realizationSelection ?? []).map(entry => [entry.realization, entry.outcome, entry.cause])
const texts = (activity: ServedActivity) => activity.rendered.instructions.map(instruction => instruction.text)
const ROLE_CASES = [[12, 1], [12, 2], [11, 1]] as const
const BOX = "Mark the goal's penalty area: 15 m wide, centred on the goal, and 9 m deep into the area; inside it the goalkeeper can handle the ball as in a normal game"
const COLOUR = '; give the goalkeeper a colour neither team wears'
const OFFSIDE_AND_NORMAL = 'There is no offside; otherwise, normal soccer rules apply during play'
const RESTART = "The building team's goalkeeper starts play, and restarts it whenever the ball is dead"
const W = (id: string) => approvedWording().find(entry => entry.id === id)!.sentence

// ── 1. The FA goal: the goal version, served ─────────────────────────────────────────────────────────────
test('the FA 5v5 goal at 12/1, 12/2 and 11/1: the goal version served, as the design\'s 4.2 matrix expects, and the live pathway serves the same', () => {
    for (const [players, keepers] of ROLE_CASES) {
        const label = `${players}/${keepers}`
        const session = stored(players, keepers, FA_GOAL)
        const coach = review(session) as ServedActivity
        assert.equal(coach.outcome, 'served', `${label}: ${JSON.stringify((coach as unknown as RefusedActivity).reasons ?? null)}`)
        assert.deepEqual(selectionOf(coach), [[R2, 'SELECTED', null], ['A01-R1', 'NOT_TRIED', null]], label)
        const said = texts(coach)
        // The teams change ends at the coach-called block; the goal and its area stay.
        assert.deepEqual(coach.roleBlocks!.blocks.map(block => block.ends), [
            { TEAM_AT_AXIS_START: 'TEAM_AT_AXIS_START', TEAM_AT_AXIS_END: 'TEAM_AT_AXIS_END' },
            { TEAM_AT_AXIS_START: 'TEAM_AT_AXIS_END', TEAM_AT_AXIS_END: 'TEAM_AT_AXIS_START' },
        ], label)
        assert.ok(said.some(text => text.startsWith('When you call the next block the teams change ends and exchange roles')), label)
        // Who moves at the exchange: the goalkeeper and one outfield player at 12 players, the goalkeeper alone at 11.
        assert.equal(said.filter(text => text.startsWith('When you call the next block, 1 goalkeeper')).length, 1, label)
        assert.ok(said.includes(players === 12 ? 'When you call the next block, 1 goalkeeper and 1 outfield player move to the team that becomes the building team, the goalkeeper staying with the goal' : 'When you call the next block, 1 goalkeeper moves to the team that becomes the building team, staying with the goal'), label)
        // The penalty area set out once, in its own Set up sentence; no spot and no goal area.
        assert.deepEqual(coach.rendered.instructions.filter(instruction => instruction.text === BOX).map(instruction => instruction.section), ['Set up'], label)
        assert.ok(!said.some(text => /penalty (spot|mark)|goal area|\b6 m\b/i.test(text)), label)
        // The goalkeeper's colour closes the roster, and its marker is drawn with the goal in both blocks.
        const roster = coach.rendered.instructions.filter(instruction => instruction.section === 'Players')
        assert.ok(roster.length === 1 && roster[0].text.endsWith(COLOUR), label)
        if (keepers === 2) assert.ok(roster[0].text.includes('1 goalkeeper and 6 other players'), `${label}: the second goalkeeper plays among the other players`)
        for (const block of coach.diagram!.blocks) {
            assert.deepEqual(block.keepers, [{ along: { from: 0, to: 0 }, across: { from: 13.1712, to: 16.8288 }, label: KEEPER }], label)
            assert.deepEqual(block.areas, [{ along: { from: 0, to: 9 }, across: { from: 7.5, to: 22.5 }, label: 'penalty area' }], label)
            assert.deepEqual(block.zones, [], `${label}: no 5 m zone`)
        }
        // Each team keeps one colour in both blocks (the diagram's team identity follows the team, not the role or the end).
        const identities = (blockAt: number) => Object.fromEntries(coach.diagram!.blocks[blockAt].teams.map((team: any) => [team.label, team.identity]))
        assert.deepEqual(identities(0), identities(1), `${label}: team colours stable`)
        // The normal rules said, after the offside sentence, said once; one restart rule.
        assert.equal(said.filter(text => text === OFFSIDE_AND_NORMAL).length, 1, label)
        assert.equal(said.filter(text => text.includes('There is no offside')).length, 1, `${label}: no offside, once`)
        assert.equal(said.filter(text => text.startsWith(RESTART)).length, 1, `${label}: one restart rule`)
        // His approved scoring sentences byte for byte; the zone version's regain sentence is not said (his reply filed 26 October 2026, item 12).
        for (const id of ['A01-W1', 'A01-W3']) assert.equal(said.filter(text => text === W(id)).length, 1, `${label}: ${id}`)
        assert.ok(!said.includes(W('A01-W2')), `${label}: the zone version's regain sentence does not carry into the goal version`)
        // No more Details than the zone version; nothing unfaithful; overview and diagram served.
        const zone = review(stored(players, keepers, NO_GOAL)) as ServedActivity
        assert.ok(said.length <= texts(zone).length && said.length === 28, `${label}: ${said.length} Details`)
        assert.equal(coach.integrity.fidelityViolations, 0, label)
        assert.ok(coach.overview && coach.diagram, label)
        // The administrator's evidence: the account under ENFORCE owes nothing, the goalkeeper's handling applying in each block.
        const admin = reviewActivity(session, { learningGoalId: 'A01', durationMin: 20 }, { includeDrafts: true }) as ServedActivity
        const laws = admin.evidence!.defaultLaws!
        assert.deepEqual([laws.realization, laws.mode, laws.owed, laws.heldSentence!.status], [R2, 'ENFORCE', [], 'DRAFT_SAID_NOTHING_OWED'], label)
        assert.deepEqual(laws.blocks.map(block => block.laws.filter(entry => entry.law === 'LAW-12-GK').map(entry => entry.status)), [['APPLIES'], ['APPLIES']], label)
        // The completeness audit, item 1: the goalkeeper's colours apply in each block, and the colour clause cites that law.
        assert.deepEqual(laws.blocks.map(block => block.laws.filter(entry => entry.law === 'LAW-4-GK').map(entry => entry.status)), [['APPLIES'], ['APPLIES']], label)
        assert.deepEqual(roster[0].parts!.filter(part => part.text === COLOUR).map(part => part.from[0]), ['defaultLaws.applied[LAW-4-GK]'], label)
        assert.deepEqual(admin.evidence!.provenance.lists!.gapsStillNeeded, [], `${label}: no decision is still needed`)
        // The live pathway: the review page's activity, whole.
        const outcome = viaLive(session)
        assert.equal(outcome.outcome, 'served', label)
        assert.deepEqual((outcome as { activity: ServedActivity }).activity, coach, `${label}: live equals review`)
    }
})

// ── 2. The zone version, unchanged ──────────────────────────────────────────────────────────────────────
test('none, and every goal that does not suit: the zone version served exactly as for none, the goal version named with why; live equals review', () => {
    const unsuitable: [string, Record<string, unknown>][] = [
        ['a mini-goal at the FA width', { count: 1, type: 'mini-goal', widthM: FA.object.widthM }],
        ['a mini-goal, no width', { count: 1, type: 'mini-goal' }],
        ['a full-size goal', { count: 1, type: 'full-size', widthM: 7.32 }],
        ['3.66 m typed as scaled', { count: 1, type: 'scaled', widthM: 3.66 }],
        ['another goal, 3.66 m', { count: 1, widthM: 3.66 }],
        ['another goal, 5 m', { count: 1, widthM: 5 }],
    ]
    for (const [players, keepers] of ROLE_CASES) {
        const label = `${players}/${keepers}`
        const zone = review(stored(players, keepers, NO_GOAL)) as ServedActivity
        assert.equal(zone.outcome, 'served', label)
        assert.deepEqual(selectionOf(zone), [[R2, 'NOT_APPLICABLE', 'OBJECT_AVAILABILITY_SHORT'], ['A01-R1', 'SELECTED', null]], label)
        // Re-pointed 24 October 2026 (the completeness audit, item 1): the zone version closes its roster with the goalkeeper's colour, once,
        // citing LAW-4-GK, and says none of the goal version's other sentences; its diagram draws no goalkeeper marker. Was: no colour either.
        assert.ok(!texts(zone).some(text => /penalty area|handle|normal soccer rules/.test(text)), `${label}: the zone version says none of the goal version's other sentences`)
        const zoneRoster = zone.rendered.instructions.filter(instruction => instruction.text.includes('colour'))
        assert.deepEqual(zoneRoster.map(instruction => [instruction.section, instruction.text.endsWith(COLOUR), instruction.text.split('colour').length - 1]), [['Players', true, 1]], `${label}: the colour, once, closing the roster`)
        assert.deepEqual(zoneRoster[0].parts!.filter(part => part.text === COLOUR).map(part => part.from), [['defaultLaws.applied[LAW-4-GK]', `performers.teams[].${KEEPER}`]], label)
        assert.ok(zone.diagram!.blocks.every(block => !('keepers' in block)), `${label}: no goalkeeper marker in the zone version's diagram`)
        assert.deepEqual((viaLive(stored(players, keepers, NO_GOAL)) as { activity: ServedActivity }).activity, zone, `${label}: live equals review`)
        for (const [what, goal] of unsuitable) {
            const activity = review(stored(players, keepers, { goal })) as ServedActivity
            assert.equal(activity.outcome, 'served', `${label} ${what}`)
            assert.deepEqual(selectionOf(activity), [[R2, 'NOT_APPLICABLE', 'OBJECT_NOT_SUITABLE'], ['A01-R1', 'SELECTED', null]], `${label} ${what}`)
            for (const key of ['rendered', 'overview', 'diagram', 'roleBlocks', 'integrity', 'title', 'subtitle'] as const) assert.deepEqual(activity[key], zone[key], `${label} ${what}: ${key}`)
            assert.match(String(activity.account.realizationSelection![0].summary), /do not suit this game; it is built for the goal in The Mini-Soccer and Youth Futsal Handbook .*12 ft x 6 ft \(3\.6576 m x 1\.8288 m\)/, `${label} ${what}`)
        }
    }
})

// ── 3. Asked, and refused ───────────────────────────────────────────────────────────────────────────────
test('goals not stated are asked with every choice; 3.6576 m with no type is asked its type; no goalkeeper or another area refuses both versions', () => {
    const asked = review(stored(12, 1)) as RefusedActivity
    assert.deepEqual([asked.outcome, asked.stage, asked.question?.asks, selectionOf(asked)], ['refused', 'session', 'AVAILABILITY', [[R2, 'ASKED', 'OBJECT_AVAILABILITY_NOT_STATED'], ['A01-R1', 'NOT_TRIED', null]]])
    assert.deepEqual(asked.question!.choices!.map(choice => choice.id), sessionObjectChoices().kinds.find(kind => kind.kind === 'goal')!.choices.map(choice => choice.id))
    const liveAsked = viaLive(stored(12, 1)) as { outcome: string; activity: RefusedActivity }
    assert.deepEqual([liveAsked.outcome, liveAsked.activity], ['refused', asked], 'the live pathway refuses with the same question')
    const type = review(stored(12, 1, { goal: { count: 1, widthM: FA.object.widthM } })) as RefusedActivity
    assert.deepEqual([type.stage, type.question?.asks, (type.question?.attribute as { name: string } | undefined)?.name], ['session', 'ATTRIBUTE', 'type'])
    // No goalkeeper: the roster's sentence, both versions tried and named, with the FA goal or none.
    for (const objects of [FA_GOAL, NO_GOAL]) {
        const keeperless = review(stored(12, 0, objects)) as RefusedActivity
        assert.deepEqual([keeperless.stage, keeperless.summary], ['session', `This game needs 1 ${KEEPER} in all and the session has 0.`], JSON.stringify(objects))
        assert.equal(selectionOf(keeperless)[1].join(' '), 'A01-R1 NOT_APPLICABLE AVAILABILITY_SHORT')
    }
    // Any area other than 40 x 30 m: refused for both versions, each at its testing boundaries.
    for (const area of [[45, 30], [40, 35]] as [number, number][]) {
        for (const objects of [FA_GOAL, NO_GOAL, undefined]) {
            const refused = review(stored(12, 1, objects, area)) as RefusedActivity
            assert.deepEqual([refused.outcome, refused.stage], ['refused', 'session'], `${area} ${JSON.stringify(objects)}`)
            assert.deepEqual(selectionOf(refused), [[R2, 'NOT_APPLICABLE', 'TESTING_AREA'], ['A01-R1', 'NOT_APPLICABLE', 'TESTING_AREA']], `${area} ${JSON.stringify(objects)}`)
        }
    }
})

console.log(`goal-version-switch.unit.ts — ${passed} passed`)
