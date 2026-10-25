/**
 * The goal version said to a coach, in DRAFT words — Stage G, 23 October 2026 (the design of 25 October 2026, section 3, Stage G).
 *
 * Christian, reply filed 26 October 2026, item 1: "Pressing team: Scoring in the goalkeeper-protected physical goal." Item 3: "For this
 * activity, the groups exchange ends between blocks while the physical goal and goalkeeper remain at the same end." Item 5: "The goal should
 * be centered on the building team's end line, facing into the playing area, with its structure outside the playing area." Item 6:
 * "'Goalkeeper remains at the goal' should mean remaining associated with that end and goal, not being confined to a particular position."
 * Items 10 and 11: "I agree that an own goal against the building team counts for the pressing team in the goal-based realization." His
 * reply filed 25 October 2026, item 3: "A defensive regain alone does not earn a point." Item 12 (26 October): "Produce the updated Coach
 * Overview, diagram, and Coach Details under the approved communication standards."
 *
 * What is pinned here (every word below is DRAFT except his three approved scoring sentences; nothing is approved wording). Re-pointed 24
 * October 2026 (K3, the d27 design's stage K3): his reply filed 27 October 2026 settles the goal version's three decisions, so it is served
 * for real, and this file builds the REAL records (no TEST-ONLY stand-in: no completed record, no 1-10 m suitability, no REPORT check, no
 * build without the bound-region block, no items left out) with the goal a coach states from the list, the FA 5v5 goal. Until K3 it read
 * "nothing is served for real: the goal version waits on goal suitability and the penalty area, both his", and item 2 below read "the
 * TEST-ONLY completion of the two open decisions (in memory, as in goal-version-knowledge.unit.ts) is now SERVED":
 *   1. the DRAFT wording data loads, keyed by register vocabulary values, and its loader refuses what it must;
 *   2. the real goal version is SERVED at 12/1, 12/2 and 11/1 (through the review route's own builder too), every sentence DRAFT except his
 *      three approved scoring sentences, which are byte-identical to the zone version's;
 *   3. the placing sentence (the goal centred on the building team's end line, facing in, its frame outside, defended by the team with the
 *      active goalkeeper, his item 6 words, since the Stage G review fix), the target sentence, How to score for the pressing team (the goal; an own goal counts; a regain alone earns nothing), the
 *      exchange (the teams change ends and roles; the goal stays; nothing is re-marked) and the goalkeeper who changes team without moving;
 *   4. the overview holds the meaning (Q7): the building team's group is the zone version's, the pressing team's lead says it scores into
 *      the goal and nothing else, no line says a regain scores, and the full rule says it does not;
 *   5. the diagram draws the goal where the game puts it, at the session's width, as the pressing team's target, with each team's colour
 *      kept across the end exchange;
 *   6. what fidelity holds: a kind with no wording data is withheld; the primary event's kind is carried per role only where his approved
 *      words speak for a bounded role (a whole-game role, or no approved speaker, leaves it owed); a pressing sentence naming the building
 *      team is refused; the overview's object target clause belongs to the pressing team;
 *   7. the zone version is said exactly as before.
 *
 * Run: npx ts-node --files -r tsconfig-paths/register ./src/system/rendering/goal-version-communication.unit.ts
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'

import { loadRegister, loadSportBoundRegions } from '../derivation/corpus'
import { indexRegister } from '../derivation/register'
import { learningGoalAuthorizations } from '../test-library/learning-goal-authorizations'
import { buildActivityForReview, buildActivityUnderAuthorizationRecords, RefusedActivity, ServedActivity } from './build-activity'
import { coachOverviewDraftOf } from './coach-overview'
import { DRAFT_COACH_WORDING_FILE, draftCoachWordingLoad, draftCoachWordingLoadOf, draftCoachWordingUnusableBecause, facingWording, scoringAtObjectWording } from './draft-coach-wording'
import { checkFidelity } from './fidelity'
import { checkOverview } from './overview-fidelity'
import { renderConcreteGame } from './render-concrete-game'
import { specializedRoleNames } from './session-envelope'

let passed = 0
function test(name: string, body: () => void): void {
    body()
    passed++
    console.log(`  ok  ${name}`)
}
console.log('the goal version said to a coach (Stage G, DRAFT)')

const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value))
const index = indexRegister(loadRegister())
const KEEPER = specializedRoleNames()[0]
const none = Object.fromEntries(specializedRoleNames().map(role => [role, 0]))
const sessionOf = (players: number, keepers: number, objects?: Record<string, unknown>) => ({ players, lengthM: 40, widthM: 30, durationMin: 20, roles: { ...none, [KEEPER]: keepers }, ...(objects ? { objects } : {}) })
const R2 = 'A01-R2'
/**
 * Re-pointed 24 October 2026 (K3, the d27 design's stage K3; the goal-version tests' TEST-ONLY stand-ins re-pointed to the real records). The
 * goal is the one a coach states from the list (stage I): the FA 5v5 pairing's object, its type and width copied from the Sport Profile, so
 * the exact width match needs no tolerance. Until K3 this was a TEST-ONLY 5 m goal ({ count: 1, widthM: 5 }) built over a completed copy of
 * the record (the goal version listed as tried), a 1-10 m suitability, a REPORT default-laws check, no bound-region block and the five
 * penalty-area items left out - stand-ins for D-GOAL-SUITABILITY, D-DEFAULT-LAWS and D-PENALTY-AREA, which his reply filed 27 October 2026
 * now settles (A01's record, settledBy).
 */
const FA = loadSportBoundRegions()!.pairings.find(pairing => pairing.id === 'FA-MINI-SOCCER-5V5-2026')!
const GOAL = { goal: { count: 1, widthM: FA.object.widthM, type: FA.object.type! } }
const built = new Map<string, { activity: ServedActivity; fixture: any }>()
const goalVersion = (players: number, keepers: number) => {
    const key = `${players}/${keepers}`
    if (!built.has(key)) {
        const request = { kind: 'learning-goal', goalId: 'A01', situationId: null, session: sessionOf(players, keepers, GOAL) } as any
        // The production records, realizations, Sport Profile and default-laws check, exactly as the review route builds them.
        const result = buildActivityUnderAuthorizationRecords(request, learningGoalAuthorizations(), { review: { includeDrafts: true } })
        assert.equal(result.activity.outcome, 'served', `${key}: ${JSON.stringify((result.activity as RefusedActivity).reasons ?? null)}`)
        assert.deepEqual(result.activity, buildActivityForReview(request, { includeDrafts: true }), `${key}: the review route's own builder gives the same activity`)
        built.set(key, { activity: result.activity as ServedActivity, fixture: result.fixture })
    }
    return built.get(key)!
}
/**
 * Re-pointed 24 October 2026 (K3): the zone version is built for a session that states it has no goal. Since K3 the goal version is tried
 * first, so a session that has not said what goals it has is asked before anything is built (his reply filed 26 October 2026, item 11: "Do not
 * infer a goal from the presence of a goalkeeper or silently treat missing information as confirmation that no goal exists."); with none
 * stated the zone version is served exactly as it was for an unstated session before K3 (goal-version-switch.unit.ts pins that identity).
 */
const zoneVersion = (players: number, keepers: number) => buildActivityForReview({ kind: 'learning-goal', goalId: 'A01', situationId: null, session: sessionOf(players, keepers, { goal: { count: 0 } }) } as any, { includeDrafts: true }) as ServedActivity
const textsOf = (activity: ServedActivity) => activity.rendered.instructions.map(instruction => `[${instruction.section}] ${instruction.text}`)
const sentenceOf = (activity: ServedActivity, starts: string) => activity.rendered.instructions.find(instruction => instruction.text.startsWith(starts))!

// ── 1. The DRAFT wording data ────────────────────────────────────────────────────────────────────────────
test('the DRAFT wording data loads, keyed by register vocabulary values, each clause with his words; its loader refuses what it must', () => {
    const load = draftCoachWordingLoad()
    assert.equal(load.why, null)
    const entry = scoringAtObjectWording('goal', 'goal')!
    assert.deepEqual([entry.lead, entry.clauses.map(clause => [clause.text, clause.states])], [
        'by getting the {carrier} into the {target}',
        [
            ['; an own goal also counts', 'MEANING'],
            [', but winning the {carrier} back does not earn a point on its own', 'NO_OTHER_SCORE'],
        ],
    ])
    assert.ok(entry.clauses[0].basis.words.includes('I agree that an own goal against the building team counts for the pressing team in the goal-based realization.'))
    assert.ok(entry.clauses[1].basis.words.includes('A defensive regain alone does not earn a point.'))
    assert.deepEqual(load.wording.objectKinds.map(kind => [kind.kind, kind.standsOutsideArea]), [['goal', ', with its frame outside the area']])
    // The Stage G review fix: the words for a facing are data too, keyed by the register's facing vocabulary, with his item 5 words.
    assert.deepEqual(load.wording.facings.map(facing => [facing.facing, facing.words, facing.basis.citedAs]), [['INTO_THE_AREA', 'facing into the area', 'his reply filed 26 October 2026, item 5']])
    assert.equal(facingWording('INTO_THE_AREA')!.words, 'facing into the area')
    assert.equal(facingWording('TEST-ONLY'), null, 'a facing with no entry has no words')
    const file = JSON.parse(fs.readFileSync(DRAFT_COACH_WORDING_FILE, 'utf8'))
    assert.equal(draftCoachWordingUnusableBecause(file, index), null)
    const refused = (alter: (f: any) => void, pattern: RegExp, what: string) => {
        const damaged = copy(file)
        alter(damaged)
        const why = draftCoachWordingUnusableBecause(damaged, index)
        assert.ok(why && pattern.test(why), `${what}: ${why}`)
        // H2 (23 October 2026): with no held sentence for the normal laws either.
        // R1 (24 October 2026): and with no trigger phrases either (the triggers entry, his reply filed 27 October 2026, item 4).
        // R2 (24 October 2026): nor the common restart's words, nor the restart nouns (dead-ball-wording.unit.ts pins their refusals).
        // Re-pointed 24 October 2026 (R3): the wording gains departedLaws, empty like every other list where the file cannot be used.
        // Re-pointed 24 October 2026 (stage L): and boundRegions and appliedLaws, empty likewise.
        // Re-pointed 24 October 2026 (stage I): the empty wording gains objectChoices.
        // Re-pointed 25 October 2026 (P1): and methods and equipment (his reply filed 28 October 2026, items 1 and 3).
        assert.deepEqual(draftCoachWordingLoadOf(damaged, index).wording, { adjustmentLimits: null, methods: [], equipment: [], objectKinds: [], facings: [], scoringAtObjects: [], normalLaws: null, triggers: [], deadBallRestart: {}, restartLawNouns: [], departedLaws: [], boundRegions: [], appliedLaws: [], objectChoices: [] }, `${what}: an unusable file loads as no wording at all`)
    }
    refused(f => (f.status = 'APPROVED'), /every word here is DRAFT/, 'a file claiming approval')
    refused(f => (f.approvedBy = { who: 'TEST-ONLY' }), /approvedBy/, 'an approval key')
    refused(f => (f.scoringAtObjects[0].event = 'TEST-ONLY'), /no member of the register's scoring-event vocabulary/, 'an event outside the vocabulary')
    refused(f => (f.scoringAtObjects[0].event = 'gate'), /does not say gate scores at an object of the kind goal/, 'an event the target-type map does not score at that kind')
    refused(f => (f.scoringAtObjects[0].lead = 'by getting the {carrier} in'), /exactly the slots \{carrier\} and \{target\}/, 'a lead without its target')
    refused(f => (f.scoringAtObjects[0].clauses[0].text = '; the {target} counts'), /a slot other than \{carrier\}/, 'a clause naming the target')
    refused(f => (f.scoringAtObjects[0].clauses[1].states = 'ALWAYS'), /none of MEANING, NO_OTHER_SCORE/, 'an unknown clause reading')
    refused(f => (f.scoringAtObjects[0].clauses[0].basis = { words: [], citedAs: 'his reply filed 26 October 2026, item 10' }), /quotes none of his words/, 'a clause with no words of his')
    refused(f => (f.objectKinds[0].kind = 'TEST-ONLY'), /no object kind of the register's vocabulary/, 'an object kind outside the vocabulary')
    refused(f => (f.facings[0].facing = 'TEST-ONLY'), /no member of the register's facing vocabulary/, 'a facing outside the vocabulary')
    refused(f => f.facings.push(copy(f.facings[0])), /facing 2 lists INTO_THE_AREA again/, 'a facing listed twice')
    refused(f => (f.facings[0].words = 'facing the {target}'), /its words are missing or hold a slot/, 'facing words holding a slot')
    refused(f => delete f.facings, /holds no objectKinds, facings and scoringAtObjects lists/, 'a file without its facings list')
    // H2 (23 October 2026): the held sentence for the normal laws - whole words, why it is held, his words - refused otherwise.
    refused(f => (f.normalLaws.words = 'Otherwise, normal {sport} rules apply.'), /normalLaws words are missing or hold a slot/, 'held words holding a slot')
    refused(f => delete f.normalLaws.held, /does not say why it is held/, 'a held sentence not saying why')
    refused(f => (f.normalLaws.basis = { words: [], citedAs: 'his reply filed 26 October 2026, item 10' }), /quotes none of his words/, 'a held sentence with no words of his')
    refused(f => (f.normalLaws.servedAs = 'TEST-ONLY'), /normalLaws entry carries "servedAs"/, 'a held sentence with an unknown key')
    // R1 (24 October 2026): the phrases for when a restart happens - a trigger of the register's vocabulary, once, a phrase holding no slot
    // but {carrier}, his words - refused otherwise.
    refused(f => (f.triggers[0].trigger = 'TEST_ONLY'), /no member of the register's trigger vocabulary/, 'a trigger outside the vocabulary')
    // Re-pointed 24 October 2026 (R2): the list opens with SCORE now (the common restart's moments in the order said). Was: OUT_TOUCHLINE.
    refused(f => f.triggers.push(copy(f.triggers[0])), /lists SCORE again/, 'a trigger listed twice')
    refused(f => (f.triggers[0].phrase = 'whenever the {target} goes out'), /a slot other than \{carrier\}/, 'a phrase naming another slot')
    refused(f => (f.triggers[2].basis = { words: [], citedAs: 'his reply filed 27 October 2026, item 4' }), /quotes none of his words/, 'a phrase with no words of his')
    refused(f => (f.triggers[3].approved = true), /carries "approved"/, 'a phrase claiming approval')
    refused(f => (f.triggers = { OUT_TOUCHLINE: 'TEST-ONLY' }), /triggers entry is not a list/, 'triggers not a list')
})

// ── 2 and 3. Served, every sentence ──────────────────────────────────────────────────────────────────────
const SET_UP_PLACING = "Place a goal centred on the building team's end line, facing into the area, with its frame outside the area; the team with the active goalkeeper defends it"
const PRESSING_LINE = 'Pressing team: Score by getting the ball into the goal; an own goal also counts, but winning the ball back does not earn a point on its own'
const EXCHANGE =
    'When you call the next block the teams change ends and exchange roles: each role is played from the same end in every block, so each team now attacks the target of its new role, the goal stays where it is, and nothing is re-marked; there is no set block length'
// Added 24 October 2026 (K3): the real records bind the goal's penalty area (A01-R2-S2-1 to S7-1, the FA 5v5 pairing) and owe nothing, so the
// area's Set up sentence, the goalkeeper's colour and the normal rules are said (stage L's DRAFT words, bound-region-communication.unit.ts).
const BOX = "Mark the goal's penalty area: 15 m wide, centred on the goal, and 9 m deep into the area; inside it the goalkeeper can handle the ball as in a normal game"
const COLOUR = '; give the goalkeeper a colour neither team wears'
const OFFSIDE_AND_NORMAL = 'There is no offside; otherwise, normal soccer rules apply during play'
/**
 * Added 25 October 2026 (P1): his reply filed 28 October 2026, item 3, verbatim (approved wording, the EQUIPMENT template), as an instruction
 * says it; the goal's figures are the FA 5v5 pairing's, in whole feet. It names the goalkeeper's own colour, so the roster no longer closes with
 * COLOUR (RC3 3.4: each idea once within a level; our DRAFT clause yields to his sentence).
 */
const HIS_EQUIPMENT = 'One 12 × 6 ft goalkeeper-defended goal, balls, cones or field markers, and two team colors plus a distinct goalkeeper color'

test('the real goal version is served at 12/1: every sentence, in reading order, his three scoring sentences unchanged', () => {
    const { activity } = goalVersion(12, 1)
    assert.deepEqual(textsOf(activity), [
        // Added 25 October 2026 (P1): his equipment sentence, first in Set up (his reply filed 28 October 2026, item 3).
        `[Set up] ${HIS_EQUIPMENT}`,
        '[Set up] Mark out an area 40 m long by 30 m wide',
        '[Set up] Mark a line across the area at halfway, 20 m from each end line',
        `[Set up] ${SET_UP_PLACING}`,
        // Added 24 October 2026 (K3): the goal's penalty area, set out once, from the FA 5v5 pairing's figures.
        `[Set up] ${BOX}`,
        "[Set up] The building team's target zone is everything beyond the marked line, up to the pressing team's end line",
        "[Set up] The pressing team's target is the goal",
        // Moved 25 October 2026 (P1): his words, reply filed 28 October 2026, item 4. Was "Decide which team starts at which end" (DRAFT).
        '[Set up] Decide which team builds first',
        // Re-pointed 24 October 2026 (K3): the roster closes with the goalkeeper's colour (LAW-12-GK applies at every place). AMENDED 24
        // October 2026 (the completeness audit, item 1): the colour rests on LAW-4-GK (the goalkeeper's colours) since, not on LAW-12-GK; the
        // words are the same. Re-pointed 25 October 2026 (P1): his equipment sentence says the goalkeeper's colour, so the roster does not.
        '[Players] Divide 12 players into 2 teams: the building team has 6 outfield players and 1 goalkeeper; the pressing team has 5 outfield players',
        // Removed 25 October 2026 (P1; his reply filed 28 October 2026, item 6): "The building team starts with the ball", which the start says.
        // Re-pointed 25 October 2026 (P1): "the same target" is now his approved wording (his reply filed 28 October 2026, item 5).
        '[How it works] When possession changes, play carries on without a stoppage, and each team keeps attacking the same target',
        // Re-pointed 24 October 2026 (R1): one restart for every dead ball (his reply filed 27 October 2026, item 4), so the moments widen
        // and the throw-in and end-line sentences below are gone; the place is his item 6 region (DRAFT).
        // Re-pointed 24 October 2026 (R2, DRAFT, the d27 design's section 2.8): the common restart said as one rule, as in the zone version.
        "[How it works] The building team's goalkeeper starts play, and restarts it whenever the ball is dead: after either team scores, whenever the ball goes out of play, whenever you stop play for a foul, when you judge that an attack has run its course, and whenever you stop play for any other reason",
        '[How it works] Before each of these restarts, the building team and the pressing team each set up on their own side of the marked line; once play restarts, every player is free to move anywhere',
        // Added 24 October 2026 (R3, DRAFT): his reply filed 27 October 2026, item 2, said once - the goal version inherits A01-R1's
        // departure from LAW-11 (departed-law-wording.unit.ts). Re-pointed 24 October 2026 (K3): the real account owes nothing, so the normal
        // rules are folded after it (his reply filed 27 October 2026, item 6); the stand-in's REPORT account owed LAW-12-GK and said no more.
        `[How it works] ${OFFSIDE_AND_NORMAL}`,
        "[How to score] Building team: Score by carrying the ball beyond the marked line or passing to a teammate who receives it under control beyond the line. The progression must begin with the goalkeeper's build-out and occur before the building team loses possession. Uncontrolled clearances do not score.",
        // Re-pointed 25 October 2026 (P1): his simplified sentence (his reply filed 28 October 2026, item 9).
        '[How to score] If the building team loses possession, it cannot score again until the next goalkeeper restart.',
        `[How to score] ${PRESSING_LINE}`,
        '[How to score] Each score is worth 1 point',
        '[When it ends] Play for 20 minutes',
        '[Role exchange] Play in blocks: in each block one team is the building team and the other is the pressing team',
        `[Role exchange] ${EXCHANGE}`,
        '[Role exchange] When you call the next block, 1 goalkeeper and 1 outfield player move to the team that becomes the building team, the goalkeeper staying with the goal',
        // Re-pointed 25 October 2026 (P1): his reply filed 28 October 2026, item 1 (DRAFT words for TAKER_CHOOSES). Was "... from the feet, with
        // the ball still or moving".
        "[Restarts and ball out] The building team's goalkeeper restarts play by passing, rolling, throwing or dribbling the ball into play",
        // Re-pointed 25 October 2026 (P1; his reply filed 28 October 2026, item 6): the bound's last clause (", on the building team's side of
        // the marked line") is said once, by the start placement above, which already puts the building team there before every restart.
        "[Restarts and ball out] You choose where the building team's goalkeeper restarts play, consistent with the intended build-out situation",
        // Added 24 October 2026 (R2, DRAFT): the restarts its account departs from, the goal end's too (his reply filed 27 October 2026,
        // item 4: "There should be no separate corners, goal kicks, throw-ins, free kicks, or penalty kicks for this activity.").
        '[Restarts and ball out] There are no throw-ins, corners, goal kicks, free kicks or penalties in this activity; fouls still matter, so deal with them appropriately',
        '[Adjusting the activity] You may choose to add a pressing player; with every player already in a team, reallocate someone or introduce an additional player: adding a pressing player can increase pressure but may also expose space behind the press',
        "[Adjusting the activity] You may choose to remove a build-out player, deciding where that player goes so every player is still accounted for, reducing the building team's available support options",
        // Re-pointed 25 October 2026 (P2; his reply filed 28 October 2026, item 2): the line's bound relative to the penalty area (A01-R2-S5-2)
        // limits how near the building team's end line it may go, said from the bound (DRAFT words, adjustmentLimits).
        "[Adjusting the activity] You may choose to move the marked line nearer to either end line, but no nearer than 9 m to the building team's end line, so that it stays outside the penalty area",
        '[Adjusting the activity] You may choose to change where the teams start when the pressure you see is not creating an appropriate challenge',
    ])
    // Nothing withheld, nothing said for one block only: the blocks say the same words (the ends exchanged, every role at the same end).
    assert.deepEqual(activity.rendered.withheld, [])
    assert.ok(activity.rendered.instructions.every(instruction => instruction.block === undefined))
    // Added 24 October 2026 (K3): no more Details than the zone version (the d27 design's 4.3), and fidelity finds nothing.
    assert.equal(activity.rendered.instructions.length, 28)
    assert.ok(activity.rendered.instructions.length <= zoneVersion(12, 1).rendered.instructions.length)
    assert.equal(activity.integrity.fidelityViolations, 0)
    // His three approved scoring sentences are the zone version's, byte for byte.
    const zone = zoneVersion(12, 1)
    for (const starts of ['Building team: Score', 'If the building team loses possession']) assert.equal(sentenceOf(activity, starts).text, sentenceOf(zone, starts).text, starts)
})

test('at 12/2 and 11/1 the same words, the counts as the roster has them, and the goalkeeper alone at 11 staying with the goal', () => {
    // Re-pointed 24 October 2026 (K3): each roster closes with the goalkeeper's colour, and the area and the normal rules are said too.
    // Re-pointed 25 October 2026 (P1): the colour is said by his equipment sentence, so no roster closes with it (RC3 3.4).
    const at12by2 = goalVersion(12, 2).activity
    assert.equal(sentenceOf(at12by2, 'Divide').text, 'Divide 12 players into 2 teams: the building team has 1 goalkeeper and 6 other players; the pressing team has 5 other players')
    assert.equal(sentenceOf(at12by2, 'When you call the next block, 1').text, 'When you call the next block, 1 goalkeeper and 1 outfield player move to the team that becomes the building team, the goalkeeper staying with the goal')
    const at11 = goalVersion(11, 1).activity
    assert.equal(sentenceOf(at11, 'Divide').text, 'Divide 11 players into 2 teams: the building team has 5 outfield players and 1 goalkeeper; the pressing team has 5 outfield players')
    for (const activity of [at12by2, at11]) {
        assert.equal(activity.rendered.instructions[0].text, HIS_EQUIPMENT)
        assert.ok(!JSON.stringify(activity.rendered.instructions.map(instruction => instruction.text)).includes(COLOUR.slice(2)))
    }
    assert.equal(sentenceOf(at11, 'When you call the next block, 1').text, 'When you call the next block, 1 goalkeeper moves to the team that becomes the building team, staying with the goal')
    for (const activity of [at12by2, at11]) {
        for (const text of [SET_UP_PLACING, BOX, OFFSIDE_AND_NORMAL, PRESSING_LINE, EXCHANGE, "The pressing team's target is the goal"]) assert.ok(activity.rendered.instructions.some(instruction => instruction.text === text), text)
        assert.deepEqual(activity.rendered.withheld, [])
    }
})

test('each new sentence cites what it says: the placing sentence its kind, layout entry, positions, facing and defending row (the register projections read)', () => {
    const { activity, fixture } = goalVersion(12, 1)
    const geometry = index.objectGeometry!
    const goal = (fixture.roleBlocks.blocks[0].fixture.game.objects as any[]).find(object => object.kind === 'goal')
    const base = `objects[${goal.elementId}]`
    const placing = sentenceOf(activity, 'Place a goal')
    assert.deepEqual(
        placing.parts!.map(part => [part.text, part.from]),
        [
            ['Place a goal', [`${base}.${geometry.kindLeaf}`, 'layout.objects[object-1]']],
            [" centred on the building team's end line", [`${base}.${geometry.acrossLeaf}`, `${base}.${geometry.alongLeaf}`]],
            [', facing into the area', [`${base}.${geometry.facingLeaf}`]],
            [', with its frame outside the area', [`${base}.${geometry.alongLeaf}`, `${base}.${geometry.kindLeaf}`]],
            ['; the team with the active goalkeeper defends it', [`${base}.defendedBy`]],
        ],
    )
    assert.ok(placing.parts!.every(part => part.status === 'DERIVED' && part.quantities.length === 0), 'no size is said: the width is the session\'s own goal')
    const pressing = sentenceOf(activity, 'Pressing team:')
    const role = (fixture.roleBlocks.blocks[0].fixture.game.activityRoles as any[]).find(element => element.activityRole === 'PRESSING')
    const kindAt = `activityRoles[${role.elementId}].scoresBy`
    assert.deepEqual(pressing.parts!.map(part => part.text), ['Pressing team: Score by getting the ball into the goal', '; an own goal also counts', ', but winning the ball back does not earn a point on its own'])
    assert.ok(pressing.parts![0].from.includes(kindAt) && pressing.parts![0].from.includes(`activityRoles[${role.elementId}].creditedWithin`) && pressing.parts![0].from.includes(`${base}.kind`))
    assert.deepEqual([pressing.parts![1].from, pressing.parts![2].from], [[kindAt], [kindAt]], 'each clause cites the event it qualifies')
    const stayer = sentenceOf(activity, 'When you call the next block, 1')
    assert.deepEqual(stayer.parts!.map(part => part.text), ['When you call the next block, 1 goalkeeper and 1 outfield player move to the team that becomes the building team', ', the goalkeeper staying with the goal'])
    assert.ok(stayer.parts![1].from.includes(`${base}.defendedBy`) && stayer.parts![1].from.includes('blocks.endAssignment') && stayer.parts![1].from.includes('layout.objects[object-1]'))
    // The exchange cites the end assignment, the positions written for the roles, the layout and the goal set out once.
    const exchange = sentenceOf(activity, 'When you call the next block the teams change ends')
    for (const path of ['blocks.endAssignment', 'layout.policy', 'layout.objects[object-1]', `${base}.kind`]) assert.ok(exchange.from.includes(path), path)
})

// ── 4. The overview holds the meaning ────────────────────────────────────────────────────────────────────
test('the overview holds the meaning (Q7): the building group is the zone version\'s, the pressing team scores into the goal and nothing else', () => {
    for (const [players, keepers] of [[12, 1], [12, 2], [11, 1]]) {
        const label = `${players}/${keepers}`
        const goal = goalVersion(players, keepers).activity
        const zone = zoneVersion(players, keepers)
        assert.ok(goal.overview, `${label}: the overview is served`)
        assert.equal(goal.overviewDraft?.check?.verdict, 'PASS', label)
        const [building, pressing] = goal.overview!.scoring.groups
        // Building unchanged: the same lines, the same pointers, as the zone version.
        assert.deepEqual(building, zone.overview!.scoring.groups[0], `${label}: the building team's group is the zone version's`)
        // Pressing: one line, scoring into the goal; its full rule says the regain alone earns nothing and an own goal counts.
        assert.equal(pressing.label, 'Pressing team')
        assert.deepEqual(pressing.lines.map(line => line.text), ['Pressing team: Score by getting the ball into the goal.'], label)
        assert.equal(pressing.lines[0].fullRule?.text, PRESSING_LINE, `${label}: the full rule is the Details sentence, with both clauses`)
        // No line of the overview says a regain scores (the zone version's second pressing line does).
        const allLines = goal.overview!.scoring.groups.flatMap(group => group.lines.map(line => line.text))
        assert.ok(!allLines.some(text => /also scores|winning the ball inside/.test(text)), `${label}: ${allLines.join(' | ')}`)
        assert.ok(zone.overview!.scoring.groups[1].lines.some(line => line.text.startsWith('The pressing team also scores by winning the ball')), `${label}: the zone version keeps its regain line`)
        // The game sentence names the goal at the building team's end; the parameters are the zone version's.
        assert.match(goal.overview!.game, /; the pressing team \([^)]*\) attacks the goal at the building team's end\.$/, label)
        assert.equal(goal.overview!.parameters, zone.overview!.parameters, label)
    }
    // The pressing group states its own event (SCORING_EVENT, PROPOSED, amended to class row B9) and nothing of the primary event's conditions.
    const { activity } = goalVersion(12, 1)
    const group = activity.overviewDraft!.scoring.blocks[0].groups.find(entry => entry.group === 'PRESSING')!
    assert.deepEqual(group.requirements.map(r => [r.row, r.rule, r.statedBy.length > 0 || r.pointedTo]), [
        ['B9', 'SCORING_EVENT', true],
        ['B8', 'WHOLE_GAME_CREDIT', true],
        ['V2', 'SCORE_VALUE', true],
    ])
})

test('the overview\'s object target clause belongs to the pressing team: moving its citation to the building clause is refused (Q7.1)', () => {
    const { fixture } = goalVersion(12, 1)
    const games = (fixture.roleBlocks.blocks as any[]).map(block => ({ blockId: block.blockId, fixture: block.fixture, rendered: renderConcreteGame(block.fixture) }))
    const served = goalVersion(12, 1).activity.rendered.instructions
    const draft = coachOverviewDraftOf('A01', games)
    const run = (d: any) => checkOverview({ goalId: 'A01', draft: d, blocks: games.map(game => ({ blockId: game.blockId, fixture: game.fixture, rendered: game.rendered.instructions })), served })
    assert.equal(run(draft).verdict, 'PASS')
    const swapped = copy(draft)
    for (const block of swapped.blocks) {
        const parts = block.game!.parts
        const pressingAt = parts.findIndex((part: any) => part.text.startsWith('; the pressing team'))
        const objectPaths = parts.slice(pressingAt).flatMap((part: any) => part.from.filter((path: string) => path.startsWith('objects[')))
        assert.ok(objectPaths.length > 0)
        parts[0].from.push(...objectPaths)
        block.game!.from = [...new Set(parts.flatMap((part: any) => part.from))]
    }
    const result = run(swapped)
    assert.ok(result.verdict === 'FAIL' && result.findings.some(f => f.severity === 'VIOLATION' && f.what.includes("clause for the building team cites the object")), JSON.stringify(result.findings.filter(f => f.severity === 'VIOLATION').map(f => f.what)))
})

// ── 5. The diagram ───────────────────────────────────────────────────────────────────────────────────────
test('the diagram draws the goal where the game puts it, at the session\'s width, as the pressing team\'s target; each team keeps its colour across the exchange', () => {
    const { activity } = goalVersion(12, 1)
    const diagram = activity.diagram!
    assert.ok(diagram, 'the diagram is served')
    const [first, second] = diagram.blocks
    for (const block of [first, second]) {
        // Re-pointed 24 October 2026 (K3): the session's goal is the FA 5v5 goal, 3.6576 m wide, centred (13.1712-16.8288 m across); the
        // stand-in's 5 m goal was drawn at 12.5-17.5 m. The penalty area and the goalkeeper's marker are drawn too, in both blocks.
        assert.deepEqual(block.objects, [{ along: { from: 0, to: 0 }, across: { from: 13.1712, to: 16.8288 }, label: 'goal', target: true }])
        assert.ok(block.desc.includes("The goal is placed on the building team's end line: the pressing team's target."), block.desc)
        assert.deepEqual(block.zones, [], 'no 5 m zone is marked: the former target-zone lines do not carry into the goal version (his item 12)')
        assert.deepEqual(block.areas, [{ along: { from: 0, to: 9 }, across: { from: 7.5, to: 22.5 }, label: 'penalty area' }])
        assert.deepEqual(block.keepers, [{ along: { from: 0, to: 0 }, across: { from: 13.1712, to: 16.8288 }, label: KEEPER }])
    }
    // Team A builds from the goal end in block 1 and presses from the other end in block 2, in its own colour in both.
    const teamA = (block: any) => block.teams.find((team: any) => team.label === 'Team A')
    assert.deepEqual([teamA(first).identity, teamA(first).noun, teamA(first).attacks], [0, 'building team', [40]])
    assert.deepEqual([teamA(second).identity, teamA(second).noun, teamA(second).attacks], [0, 'pressing team', [0]])
    // Re-pointed 25 October 2026 (P1; his reply filed 28 October 2026, item 11: "I'd prefer the selected block's diagram to focus on the
    // immediate configuration, with the role-exchange procedures explained once in Coach Details."): no block carries an exchange sentence,
    // and no description says what moves. Was: block 2's "When you call this block, 1 goalkeeper and 1 outfield player move from Team A to
    // Team B, which becomes the building team." The Role exchange section still says what moves (test 2 above).
    for (const block of [first, second]) {
        assert.ok(!('exchange' in block), 'no exchange sentence beside the drawing')
        assert.ok(!/When you (call|return to) this block|move from Team/.test(block.desc), block.desc)
    }
})

// ── 6. What fidelity holds ───────────────────────────────────────────────────────────────────────────────
test('a kind with no wording data is withheld: the pressing team scoring by a TEST-ONLY gate at the goal is refused, never said in the goal\'s words', () => {
    const { fixture } = goalVersion(12, 1)
    const block = copy(fixture.roleBlocks.blocks[0].fixture)
    const role = (block.game.activityRoles as any[]).find(element => element.activityRole === 'PRESSING')
    role.scoresBy = 'gate'
    const rendered = renderConcreteGame(block)
    assert.ok(rendered.withheld.some(field => field.path === `activityRoles[${role.elementId}].scoresBy` && field.row === 'B9'), JSON.stringify(rendered.withheld))
    assert.ok(!rendered.instructions.some(instruction => instruction.text.startsWith('Pressing team:')))
})

test('a facing with no wording data is not worded: the goal facing a TEST-ONLY way is not placed, and fidelity refuses the game (the Stage G review fix)', () => {
    const { fixture } = goalVersion(12, 1)
    const block = copy(fixture.roleBlocks.blocks[0].fixture)
    const goal = (block.game.objects as any[]).find(object => object.kind === 'goal')
    const before = renderConcreteGame(block)
    assert.ok(before.instructions.some(instruction => instruction.text === SET_UP_PLACING), 'the real build is placed, from the data file\'s words')
    goal[index.objectGeometry!.facingLeaf] = 'TEST-ONLY'
    const rendered = renderConcreteGame(block)
    assert.ok(!rendered.instructions.some(instruction => instruction.text.startsWith('Place a goal')), 'no words for the facing, so the goal is not placed')
    assert.ok(checkFidelity(block, rendered).findings.some(f => f.severity === 'VIOLATION'), 'and the game is refused rather than said without its goal')
})

test('the primary event\'s kind is carried per role only where his approved words speak for a bounded role; otherwise it stays owed (Q3)', () => {
    const { fixture } = goalVersion(12, 1)
    const block = fixture.roleBlocks.blocks[0].fixture
    const rendered = renderConcreteGame(block)
    const kindAt = 'value.primaryEvent.kind'
    const report = checkFidelity(block, rendered)
    assert.ok(!rendered.instructions.some(instruction => instruction.from.includes(kindAt)), 'no sentence cites the kind: the only role scoring by it is told in his approved words')
    assert.ok(report.findings.some(f => f.question === 3 && f.severity === 'NOTE' && f.what.startsWith(`${kindAt} is cited by no instruction and is carried per role`)), JSON.stringify(report.findings.filter(f => f.question === 3)))
    assert.ok(!report.findings.some(f => f.severity === 'VIOLATION'), JSON.stringify(report.findings.filter(f => f.severity === 'VIOLATION')))
    // Without his approved sentence for the building team, the kind is owed again.
    const withoutW1 = { ...rendered, instructions: rendered.instructions.filter(instruction => !instruction.text.startsWith('Building team: Score')) }
    assert.ok(checkFidelity(block, withoutW1).findings.some(f => f.severity === 'VIOLATION' && f.what === `${kindAt} is established by the game and no instruction carries it`))
    // With the building team's credit the whole game (TEST-ONLY), the per-role reading does not apply.
    const whole = copy(block)
    ;(whole.game.activityRoles as any[]).find(element => element.activityRole === 'BUILDING').creditedWithin = 'WHOLE_GAME'
    assert.ok(checkFidelity(whole, rendered).findings.some(f => f.severity === 'VIOLATION' && f.what === `${kindAt} is established by the game and no instruction carries it`))
})

test('a pressing sentence naming the building team is refused (Q2): only his approved words speak for a bounded role', () => {
    const { fixture } = goalVersion(12, 1)
    const block = fixture.roleBlocks.blocks[0].fixture
    const rendered = renderConcreteGame(block)
    const damaged = copy(rendered)
    const pressing = damaged.instructions.find(instruction => instruction.text.startsWith('Pressing team:'))!
    pressing.parts![1].text = '; an own goal by the building team also counts'
    pressing.text = pressing.parts!.map(part => part.text).join('')
    const report = checkFidelity(block, damaged)
    assert.ok(report.findings.some(f => f.question === 2 && f.severity === 'VIOLATION' && f.what.includes('whose credit is confined to an episode')), JSON.stringify(report.findings.filter(f => f.severity === 'VIOLATION')))
})

// ── 7. The zone version ──────────────────────────────────────────────────────────────────────────────────
test('the zone version is said exactly as before: its target words, its exchange, its reassignment, and no goal sentence', () => {
    for (const [players, keepers] of [[12, 1], [12, 2], [11, 1]]) {
        const zone = zoneVersion(players, keepers)
        const texts = zone.rendered.instructions.map(instruction => instruction.text)
        // Re-pointed 25 October 2026 (P1): his reply filed 28 October 2026, item 5 - both versions keep attacking "the same target" now ("This
        // accommodates both scoring configurations without changing the intended meaning."). Was "... the same zone" here.
        assert.ok(texts.includes('When possession changes, play carries on without a stoppage, and each team keeps attacking the same target'))
        assert.ok(!texts.some(text => text.includes('attacking the same zone')))
        assert.ok(texts.includes('Each team keeps its end for the whole activity. When you call the next block the teams exchange roles, not ends: each team now attacks the target zone of its new role, and nothing is re-marked unless you have moved the marked line; there is no set block length'))
        assert.ok(texts.some(text => text.startsWith('The pressing team also scores by winning the ball inside that zone')))
        assert.ok(!texts.some(text => /staying with|Place a|target is the/.test(text)), texts.join(' | '))
    }
})

console.log(`goal-version-communication.unit.ts — ${passed} passed`)
