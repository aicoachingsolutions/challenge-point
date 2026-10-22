/**
 * **Stage K7, 15 October 2026 — communication of the first complete activity (design step J8, BRIEF-OCT17 §3).**
 *
 * Christian, reply filed 17 October 2026, next review item 8, *"Coach-facing activity instructions."*, and item 6, *"What happens
 * after a regain, score, ball out, and coach-judged episode conclusion."*; D2, *"Team ends can remain fixed, while role-specific
 * objectives and target configurations change when the teams exchange roles. Please make that distinction explicit in the
 * coach-facing instructions."*; D5, *"No mandatory goalkeeper pass, prescribed passing sequence, or fixed restart location is
 * needed."*; D6, *"Those are available solutions, not required behaviors."* And his reply filed 18 October 2026, item 1, *"role
 * exchange and participant reassignment should remain separate capabilities"*; item 7, *"Please keep that distinction visible as
 * we approach acceptance."*
 *
 * What is pinned here, all on the real chain or on copies of what it built (TEST-ONLY lines are labelled):
 *
 *   1. the admin-only review draft of A01 at 12 players, 40 x 30 m: every sentence the game holds, each a DRAFT, and nothing
 *      withheld but the four build-out conditions, which wait on his approved wording;
 *   2. key identity: the draft reaches the administrator's review answer and nothing else (not the coach's, not the pilot route,
 *      not a served activity), and the live route never asks for it;
 *   3. the prescription rule (fidelity Q4): his adversarial lines are refused WITH plausible citations; the one template whose
 *      obligation word restates its element's own value passes, and only as that template; approval exempts a sentence from the
 *      lexicon and never from the specialized-role rule; the residual it cannot see is pinned as a known limit; (3d, stage M3, 17
 *      October 2026, design step L8) one narrow exception, quoting his reply filed 19 October 2026, item 1 ("Approved with revised
 *      wording"): an approved sentence passes the role rule only where the role it names is a value of a field it covers;
 *   8. (stage M3, design step L9, fidelity Q2) where a role's credit is bounded, no scoring sentence speaks for it, or for every
 *      team, unless it is approved wording citing the bound;
 *   4. the restart sentence discharges an episode boundary only with its awardee;
 *   5. the exchange states the ends fixed AND what changes with the roles (since stage 2D, 21 October 2026, with every block's
 *      markings set out once: which marked zone each team attacks, and that nothing is re-marked unless the line was moved; until then,
 *      the markings set out again for the new roles), and separately who changes team; fidelity Q6 refuses it without that clause's
 *      citations;
 *   6. no noun the game does not hold, no challenge level, no bare decision imperative, and the Coach Communication Standard
 *      leaves every draft as it is;
 *   7. the start placement says players are free to move once play restarts, and is said only with the restarts that
 *      re-establish it;
 *   9. (stage 2C, 21 October 2026) a sentence the two blocks say alike by role is said once, block 1's citations exactly and block
 *      2's beside them; Q6 refuses a counterpart one word different, missing or not mapping, and a repetition; the review evidence
 *      shows both blocks' realized positions.
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { applyCoachCommunicationStandard, findCommunicationStandardViolations } from '../activity/coach-communication-standard'
import { loadRegister } from '../derivation/corpus'
import { indexRegister } from '../derivation/register'
import { reviewActivity } from './activity-review'
import * as wordingModule from './approved-wording'
import { buildActivity, buildActivityForReview, buildActivityFromKnowledge, buildActivityWithFixture, RefusedActivity, ServedActivity } from './build-activity'
import { buildPilotActivity } from './build-pilot-activity'
import { checkFidelity, OBLIGATION_ALLOWLIST, OBLIGATIONS } from './fidelity'
import { OUT as A04_FIXTURE } from './freeze-a04-fixture'
import { MECHANISM_DEMONSTRATIONS } from './mechanism-demonstrations'
import { ADJUSTING, Instruction, renderConcreteGame, ROLE_EXCHANGE, roleKeyedPositions } from './render-concrete-game'
import { checkRoleBlockComposition, composeRoleBlockActivity, counterpartMap, counterpartPath } from './role-blocks'
import { specializedRoleNames } from './session-envelope'

let passed = 0
function test(name: string, body: () => void): void {
    body()
    passed++
    console.log(`  ok  ${name}`)
}
console.log('communication of the first complete activity (stage K7)')

const ROLE = specializedRoleNames()[0]
const none = Object.fromEntries(specializedRoleNames().map(role => [role, 0]))
const session = { players: 12, lengthM: 40, widthM: 30, durationMin: 20, roles: { ...none, [ROLE]: 1 } }
const a01 = { kind: 'learning-goal' as const, goalId: 'A01', situationId: null, session }
const index = indexRegister(loadRegister())

/**
 * Built once and read by every test below: the admin review answer, the plain answer, and the fixture the build stopped with.
 *
 * Re-pointed 18 October 2026 (design step L14): production A01 is SERVED since his reply filed 20 October 2026 (item 1, "Pressing team's
 * regain score — Approved as written.", entry A01-W2; item 2, his own eligibility sentence, entry A01-W3), so it carries no draft: a
 * draft belongs to a refusal at communication only. The draft mechanism these tests pin (what the administrator sees, and only he, while
 * a sentence awaits his approval) is therefore measured on the build that last stopped there: a TEST-ONLY table as it stood at stage M5 (A01-W1 alone, neither A01-W2 nor A01-W3), which
 * is refused at communication for the regain score's four fields alone, exactly as production was at stage M5 (`review`, `plain`). The
 * served production answer is `served`; every test that reads the coach's sentences reads it.
 */
const asAtStageM5 = <T>(body: () => T): T => {
    const read = wordingModule.approvedWording
    const production = read()
    try {
        ;(wordingModule as any).approvedWording = () => JSON.parse(JSON.stringify(production.filter(entry => entry.id === 'A01-W1')))
        return body()
    } finally {
        ;(wordingModule as any).approvedWording = read
    }
}
const served = buildActivityForReview(a01, { includeDrafts: true }) as ServedActivity
const servedPlain = buildActivity(a01) as ServedActivity
const review = asAtStageM5(() => buildActivityForReview(a01, { includeDrafts: true })) as RefusedActivity
const plain = asAtStageM5(() => buildActivity(a01)) as RefusedActivity
const { fixture: composedFixture } = buildActivityWithFixture(a01)
const blockFixtures: any[] = ((composedFixture as any)?.roleBlocks?.blocks ?? []).map((block: any) => block.fixture)
const BLOCKS = ['BUILDING=TEAM_AT_AXIS_START,PRESSING=TEAM_AT_AXIS_END', 'BUILDING=TEAM_AT_AXIS_END,PRESSING=TEAM_AT_AXIS_START']
/** His reply filed 19 October 2026, item 1, verbatim ("Approved with revised wording"); production entry A01-W1 since stage M5. */
const HIS_ITEM_1 =
    "Building team: Score by carrying the ball beyond the marked line or passing to a teammate who receives it under control beyond the line. The progression must begin with the goalkeeper's build-out and occur before the building team loses possession. Uncontrolled clearances do not score."
/** His reply filed 20 October 2026, item 1 (our draft, "Approved as written."): production entry A01-W2 since design step L14. */
const HIS_W2 = 'The pressing team also scores by winning the ball inside that zone, provided it genuinely establishes possession; a contested touch, deflection or loose ball does not count.'
/** His reply filed 20 October 2026, item 2 (his own wording): production entry A01-W3 since design step L14. */
const HIS_W3 = 'If the building team loses possession or plays the ball out, it cannot score again until the next goalkeeper restart.'

/** The sentences of a rendering by section and block, so a pin reads like the activity. */
const sentences = (instructions: Instruction[]) => instructions.map(i => `${i.section}${i.block ? ` [${BLOCKS.indexOf(i.block) + 1}]` : ''}: ${i.text}`)

test('1p. production A01 is SERVED (design step L14): every sentence the game holds, his four approved sentences APPROVED and every other DRAFT, nothing withheld, nothing unfaithful', () => {
    // Added 18 October 2026 (design step L14). The served text is test 1's draft with his two new scoring statements in place - A01-W3
    // straight after his build-out sentence, A01-W2 straight after the pressing team's sentence - and no other sentence changed.
    assert.equal(served.outcome, 'served', JSON.stringify((served as unknown as RefusedActivity).reasons))
    assert.deepEqual(served.rendered.withheld, [])
    assert.equal(served.integrity.fidelityViolations, 0)
    assert.ok(!('draft' in served), 'a served activity carries no draft')
    const draftTexts = sentences(review.draft!.instructions)
    const at = (text: string) => draftTexts.indexOf(text)
    const expected = [...draftTexts]
    expected.splice(at(`How to score: ${HIS_ITEM_1}`) + 1, 0, `How to score: ${HIS_W3}`)
    expected.splice(expected.indexOf('How to score: Pressing team: Score by getting the ball under control into its target zone: running it in, or passing to a teammate who receives it under control inside') + 1, 0, `How to score: ${HIS_W2}`)
    assert.deepEqual(sentences(served.rendered.instructions), expected)
    assert.deepEqual(served.evidence!.sections.instructions.filter(i => i.wording === 'APPROVED').map(i => i.text), ['When possession changes, play carries on without a stoppage, and each team keeps attacking the same zone', HIS_ITEM_1, HIS_W3, HIS_W2])
    assert.equal(served.evidence!.sections.instructions.filter(i => i.wording === 'DRAFT').length, served.rendered.instructions.length - 4, 'every other sentence is DRAFT')
})

/*
 * Re-pointed 18 October 2026 (design step L14): read on the TEST-ONLY table as it stood at stage M5 (above), the build that is refused at
 * communication exactly as production was at stage M5; every assertion below is unchanged. Production is served (test 1p).
 */
test('1. the review draft of A01 (TEST-ONLY: the table as at stage M5): every sentence the game holds, each a DRAFT but his approved two, nothing withheld but the regain score (stage M5; was the build-out condition)', () => {
    assert.equal(review.stage, 'communication')
    assert.ok(review.draft, 'the administrator receives the draft')
    const draft = review.draft!
    assert.equal(draft.status, 'DRAFT_NOT_SERVED')
    // DRAFT coach wording, every sentence listed in the stage report for his approval (approved-coach-wording.json is empty).
    // Re-pointed 21 October 2026 (stage 2A, his reply filed 22 October 2026, item 2: "Information should be classified according to
    // when the coach needs it"): every section is assigned in sections.ts from what a sentence cites, and the activity reads in section
    // order. Three moves, no sentence changed: the duration to When it ends (was How it works, first); the two ball-out restarts to
    // Restarts and ball out (were How it works, last); and block 2's two Set up sentences now follow block 1's in Set up (they were
    // listed after Role exchange, and the page already showed them under Set up).
    assert.deepEqual(sentences(draft.instructions), [
        'Set up: Mark out an area 40 m long by 30 m wide',
        // Moved 21 October 2026 (stage 2D, his reply filed 22 October 2026, item 7: "For this particular 40 × 30 m configuration, we can
        // also simplify setup by marking the halfway line and both 5 m end zones at the beginning. Role exchanges should not require
        // unnecessary physical re-marking."; recorded as the choice MARK_UNION_ONCE, physical-layout.unit.ts): every block's markings set
        // out once, and each role's target said by role (DRAFT). "Halfway" is read from the values (the line at 20 m of 40 m). Was:
        // "Mark a line across the area, 20 m from the building team's end line"; then (stage 2C, each said once for both blocks) "Mark the
        // pressing team's target zone at the building team's end, 5 m deep, across the full width" and "Mark the building team's target
        // zone from the marked line to the pressing team's end line, across the full width"; and (How to score) "Each team attacks the
        // zone at the other team's end. Decide which team starts at which end; the ends stay the same for the whole game", whose first
        // clause the target sentences now carry and whose last clause the exchange sentence already says.
        'Set up: Mark a line across the area at halfway, 20 m from each end line',
        'Set up: Mark a 5 m end zone across the full width at each end',
        "Set up: The building team's target zone is everything beyond the marked line, up to the pressing team's end line, including the end zone there",
        "Set up: The pressing team's target zone is the 5 m end zone at the building team's end",
        'Set up: Decide which team starts at which end',
        `Players: Divide 12 players into 2 teams: the building team has 6 outfield players and 1 ${ROLE}; the pressing team has 5 outfield players`,
        'How it works: The building team starts with the ball',
        // Moved 17 October 2026 (stage M4, design step L10): his approved words, reply filed 19 October 2026, item 4 (read from
        // approved-coach-wording.json approvedTemplateSentences). Was: "When possession changes, play carries on with no stoppage, and
        // the team that wins possession attacks the same zone it was already attacking".
        'How it works: When possession changes, play carries on without a stoppage, and each team keeps attacking the same zone',
        // Moved 21 October 2026 (stage 2B, his reply filed 22 October 2026, item 2: "the basic goalkeeper restart condition is essential
        // because it determines when the building team can score again. The complete procedural details of every restart should remain
        // accessible but do not all need to appear in the overview."): the one restart sentence is said as WHEN (here, directly before
        // the start placement, his D4) and HOW (Restarts and ball out, below). Was: "The building team's goalkeeper restarts play from
        // the feet, with the ball still or moving: at the start, after either team scores and whenever you decide that an attack has
        // run its course (at a stoppage or while play is on)".
        `How it works: The building team's ${ROLE} restarts play: at the start, after either team scores and whenever you decide that an attack has run its course (at a stoppage or while play is on)`,
        'How it works: Before each of these restarts, the building team and the pressing team each set up on their own side of the marked line; once play restarts, every player is free to move anywhere',
        // Moved 17 October 2026 (stage M3, design step L9; his reply filed 19 October 2026, items 1 and 4): the team-neutral "A team
        // scores 1 point by getting the ball under control into the zone it is attacking: ..." is no longer said, because the building
        // role's credit is confined to its build-out episode (row B8). The pressing role, whose bound is the whole game (A01-R1-B8-2),
        // is told how it scores in a sentence of its own (DRAFT), the value is said on its own (DRAFT), and the building role is told
        // only in his approved words (withheld until approved-coach-wording.json holds them, design step L13).
        // Added 18 October 2026 (stage M5, design step L13): his approved words, said once for the building role's bound and the four
        // build-out conditions (entry A01-W1, reply filed 19 October 2026, item 1, "Approved with revised wording").
        // Moved 18 October 2026 (review of stage M5): How to score reads role by role where a role's credit is bounded
        // (render-concrete-game.ts scoringInRoleOrder), so his sentence comes first, as the design's coach text and our email of 19
        // October 2026 showed him. Was: after the pressing team's sentence, the value and the ends (the renderer said approved
        // entries last). No sentence changed.
        `How to score: ${HIS_ITEM_1}`,
        // Moved 21 October 2026 (hardening H5, DRAFT): the zone a team enters is named as its target, his term "target zone" (reply filed
        // 22 October 2026, item 7; the build plan's expected Details 14). Was: "... under control into the zone it is attacking: ...".
        'How to score: Pressing team: Score by getting the ball under control into its target zone: running it in, or passing to a teammate who receives it under control inside',
        'How to score: Each score is worth 1 point',
        // Stage 2A: RC2's Win Condition ("When does the activity end?"), a DRAFT section name.
        'When it ends: Play for 20 minutes',
        `${ROLE_EXCHANGE}: Play in blocks: in each block one team is the building team and the other is the pressing team`,
        // Moved 21 October 2026 (stage 2D, his item 7 above): the exchange states what changes, not re-marking, with the qualification an
        // adjustment that moves the marked line owes (DRAFT). Was: "... exchange roles, not ends, and the marked line and both target zones
        // are set out again for the new roles; there is no set block length".
        `${ROLE_EXCHANGE}: Each team keeps its end for the whole activity. When you call the next block the teams exchange roles, not ends: each team now attacks the target zone of its new role, and nothing is re-marked unless you have moved the marked line; there is no set block length`,
        `${ROLE_EXCHANGE}: When you call the next block, 1 ${ROLE} and 1 outfield player move to the team that becomes the building team`,
        // Stage 2A: consulted when needed (his item 1, "restarts ... available when needed"), a DRAFT section name.
        // Moved 17 October 2026 (stage M4, design steps L10 and L11, DRAFT): the touchline restart says his approved noun (reply filed
        // 19 October 2026, item 4), read from the sport's coach vocabulary through the fixture; was "... restarts play where the ball
        // went out, with the ball in hand". The end-line restart says the coach's bound once, our gerund form of his item 3 A; was
        // "... restarts play where and how you choose".
        // Moved 21 October 2026 (stage 2B): the opening restart's HOW, and where it is taken, which names its own restart now that its
        // antecedent is split (the D2 verification: "these restarts" had no referent in this section). Moved 18 October 2026 (post-K
        // wording, DRAFT): the choice sentence no longer restates that the choice is the coach's, no longer names the post-regain area
        // by a noun the set-up sentences do not use, and no longer says engine provenance ("using the approved M3 capability") to the
        // coach in brackets. Was (stage 2A, How it works): "You choose where each of these restarts is taken, consistent with the
        // intended build-out situation, in front of the pressing team's target zone"; before 18 October: "You choose where each of these
        // restarts is taken: a location the coach chooses, consistent with the intended build-out situation, in front of the pressing
        // team's post-regain area" and "... restarts play; you choose where (a location the coach selects for the restart, using the
        // approved M3 capability) and how (a restart method the coach selects, using the approved M3 capability)". The touchline
        // sentence is unchanged: his "conventional throw-in" has no data route to the renderer yet (a wording point put to him).
        `Restarts and ball out: The building team's ${ROLE} restarts play from the feet, with the ball still or moving`,
        `Restarts and ball out: You choose where the building team's ${ROLE} restarts play, consistent with the intended build-out situation, in front of the pressing team's target zone`,
        'Restarts and ball out: If the ball goes out over a touchline, a player of the team that did not touch the ball last restarts play with a throw-in where the ball went out',
        'Restarts and ball out: If the ball goes out over either end line, a player of the team that did not touch the ball last restarts play where and how you choose, preserving meaningful game relationships rather than creating an automatic scoring shortcut',
        // Moved 17 October 2026 (stage M4, design step L11, DRAFT coachWords): his reply filed 19 October 2026, item 4, "The coach-facing
        // suggestions should not imply those changes can occur without accounting for every player." Was "... additional numbers
        // forward: adding ..." and "You may choose to remove a build-out player, reducing the building team's available support options".
        `${ADJUSTING}: You may choose to add a pressing player, representing an opponent committing additional numbers forward; with every player already in a team, reallocate someone or introduce an additional player: adding a pressing player can increase pressure but may also expose space behind the press`,
        `${ADJUSTING}: You may choose to remove a build-out player, deciding where that player goes so every player is still accounted for, reducing the building team's available support options`,
        // Moved 21 October 2026 (stage 2D): the general consequence rule for an adjustment that moves a mark set out once (DRAFT clause,
        // from the line's own position: measured from the building team's end line). Was: "You may choose to move the marked line nearer to
        // either end line".
        `${ADJUSTING}: You may choose to move the marked line nearer to either end line; it is measured from the building team's end line, so when the roles exchange, set it out again at the same distance from the new building team's end line`,
        `${ADJUSTING}: You may choose to change where the teams start when the pressure you see is not creating an appropriate challenge`,
    ])
    // Re-pointed 17 October 2026 (stage M4): one sentence is his approved words - the possession sentence, an approved template
    // sentence (reply filed 19 October 2026, item 4); the entries table is still empty, so every other sentence is DRAFT.
    // Re-pointed 18 October 2026 (stage M5, design step L13): and his build-out sentence, the first approved entry (A01-W1); every
    // other sentence is DRAFT.
    assert.deepEqual(draft.instructions.filter(i => i.wording === 'APPROVED').map(i => i.text), ['When possession changes, play carries on without a stoppage, and each team keeps attacking the same zone', HIS_ITEM_1])
    assert.equal(draft.instructions.filter(i => i.wording === 'DRAFT').length, draft.instructions.length - 2, 'every other sentence is DRAFT')
    // Provisional sources: the restarts rest on his provisional choices, the area on the session alone.
    assert.deepEqual(draft.instructions[0].provisionalSources, [])
    assert.ok(draft.instructions.find(i => i.text.includes('restarts play from the feet'))!.provisionalSources.includes('provisional:A01-R1::A01-R1-T3-1'))
    assert.ok(draft.instructions.find(i => i.text.includes('nearer to either end line'))!.provisionalSources.includes('record A01-ADJ-3'))
    // Stage 2D: the markings set out once rest on his recorded choice, named by its code.
    assert.ok(draft.instructions.find(i => i.text.startsWith('Mark a 5 m end zone'))!.provisionalSources.includes('record MARK_UNION_ONCE'))
    // Withheld: the four build-out conditions in each block (type, referents, value where held, scope) and nothing else.
    // Moved 17 October 2026 (stage M1), 30 -> 32: and the building role's credit bound in each block (row B8, his reply filed 19
    // October 2026, item 1 and item 3 C), said only in approved words. The pressing role's WHOLE_GAME states no condition and is
    // not withheld.
    const CREDIT_BOUND = 'activityRoles[c:provisional:A01-R1:A01-R1-B1-1].creditedWithin'
    // Moved 17 October 2026 (stage M2), 32 -> 40: and the pressing role's regain score in each block (rows V28-V31, his reply filed
    // 19 October 2026, item 2) - exactly its four fields, said only in approved words, so the activity is refused at communication
    // naming them until he approves a sentence.
    const ALSO = (field: string) => `value.primaryEvent.alsoCounts[c:provisional:A01-R1:A01-R1-V27-1].${field}`
    const alsoWithheld = [['team', 'V28'], ['trigger', 'V29'], ['control', 'V30'], ['exclusion', 'V31']].map(([field, row]) => [ALSO(field), row])
    // Moved 18 October 2026 (stage M5, design step L13), 40 -> 8: his approved sentence (A01-W1) says the building role's bound and
    // every field of the four build-out conditions in each block, so exactly the regain score's four fields per block are withheld,
    // awaiting the sentence put to him (A01-W2). Was: the bound, the fifteen condition fields and the regain fields, per block.
    assert.equal(draft.withheld.length, 8)
    assert.deepEqual(draft.withheld.map(field => [field.path, field.row]), [...alsoWithheld, ...alsoWithheld], JSON.stringify(draft.withheld))
    assert.ok(!draft.withheld.some(field => field.path === CREDIT_BOUND || field.path.startsWith('value.primaryEvent.conditions[')))
    // Fidelity on the draft: only the same conditions, noted as uncarried; no sentence lost, invented or changed in status.
    // Moved 17 October 2026 (stage M1), 22 -> 26: both roles' credit bounds per block are uncarried too - the building role's because
    // it is withheld, the pressing role's WHOLE_GAME because no sentence cites it yet (the per-role scoring sentence that will is
    // design step L9, stage M3). Reported, never filtered.
    const uncarriedCondition = (v: string) => v.startsWith('fidelity Q3: value.primaryEvent.conditions[c:restated:RPC-001:RPC-001-') && v.endsWith('is established by the game and no instruction carries it')
    const uncarriedBound = (v: string) => /^fidelity Q3: activityRoles\[c:provisional:A01-R1:A01-R1-B1-[12]\]\.creditedWithin is established by the game and no instruction carries it$/.test(v)
    // Moved 17 October 2026 (stage M2), 26 -> 34: the regain score's four fields per block are uncarried too, because they are withheld.
    const uncarriedAlso = (v: string) => /^fidelity Q3: value\.primaryEvent\.alsoCounts\[c:provisional:A01-R1:A01-R1-V27-1\]\.(team|trigger|control|exclusion) is established by the game and no instruction carries it$/.test(v)
    assert.equal(draft.fidelity.passed, false)
    assert.ok(draft.fidelity.violations.every(v => uncarriedCondition(v) || uncarriedBound(v) || uncarriedAlso(v)), JSON.stringify(draft.fidelity.violations))
    // Moved 17 October 2026 (stage M3, design step L9), 4 -> 2 and 34 -> 32: the pressing role's whole-game bound is now carried by its
    // own scoring sentence; only the building role's bound, withheld, is uncarried in each block.
    // Moved 18 October 2026 (stage M5, design step L13), 2 -> 0, 22 -> 0 and 32 -> 8: his approved sentence carries the building role's
    // bound and the conditions, so the only uncarried fields are the regain score's four per block, which are withheld.
    assert.equal(draft.fidelity.violations.filter(uncarriedBound).length, 0)
    assert.equal(draft.fidelity.violations.filter(uncarriedCondition).length, 0)
    assert.equal(draft.fidelity.violations.filter(uncarriedAlso).length, 8)
    assert.equal(draft.fidelity.violations.length, 8)
})

test('2. key identity: the draft reaches the administrator\'s review answer and nothing else', () => {
    // The same build with and without the draft: identical but for the admin-only keys. Moved 15 October 2026 (stage K8): the
    // administrator's answer for a goal whose record carries his review request also carries `evidence` (review-evidence.unit.ts pins
    // it); taken out here beside the draft, the rest is still exactly the coach's answer.
    const { draft, evidence, ...rest } = review
    assert.ok(draft && evidence)
    assert.deepEqual(rest, plain)
    assert.ok(!('draft' in plain), 'buildActivity never carries it')
    // Re-pointed 18 October 2026 (design step L14): on the TEST-ONLY table as at stage M5, like `plain`; and on production, served.
    assert.deepEqual(asAtStageM5(() => buildActivityForReview(a01, { includeDrafts: false })), plain, 'the review build without drafts is buildActivity exactly')
    assert.deepEqual(buildActivityForReview(a01, { includeDrafts: false }), servedPlain, 'the review build without drafts is buildActivity exactly (served)')
    assert.deepEqual(Object.keys(draft!).sort(), ['fidelity', 'instructions', 'status', 'withheld'])
    assert.deepEqual(Object.keys(draft!.instructions[0]).filter(key => ['wording', 'provisionalSources'].includes(key)).sort(), ['provisionalSources', 'wording'])
    // The review route: the coach whose session it is receives no draft; an administrator does.
    const stored: any = { _id: 'TEST-ONLY', createdBy: 'TEST-ONLY', playerCount: 12, fieldLength: '40', fieldWidth: '30', specializedRoles: { ...none, [ROLE]: 1 } }
    // Re-pointed 18 October 2026 (design step L14): measured on the TEST-ONLY table as at stage M5, the refusal at communication a draft
    // belongs to (production is served: below).
    const coach = asAtStageM5(() => reviewActivity(stored, { learningGoalId: 'A01', durationMin: 20 })) as RefusedActivity
    assert.ok(!('draft' in coach))
    const admin = asAtStageM5(() => reviewActivity(stored, { learningGoalId: 'A01', durationMin: 20 }, { includeDrafts: true })) as RefusedActivity
    assert.deepEqual(admin.draft, review.draft)
    // Production (design step L14): the coach and the administrator are both served the same activity, neither with a draft; the
    // administrator's answer carries the review evidence beside it, and nothing else differs.
    const coachServed = reviewActivity(stored, { learningGoalId: 'A01', durationMin: 20 }) as ServedActivity
    const adminServed = reviewActivity(stored, { learningGoalId: 'A01', durationMin: 20 }, { includeDrafts: true }) as ServedActivity
    assert.deepEqual([coachServed.outcome, adminServed.outcome], ['served', 'served'])
    assert.ok(!('draft' in coachServed) && !('draft' in adminServed))
    assert.ok(!('evidence' in coachServed) && !!adminServed.evidence, 'the evidence is the administrator\'s')
    const { evidence: servedEvidence, ...servedRest } = served
    assert.ok(servedEvidence)
    assert.deepEqual(servedRest, servedPlain, 'the served review answer is the coach\'s answer plus the evidence')
    assert.deepEqual(adminServed.rendered, coachServed.rendered)
    // A served activity never carries a draft, even when asked: a draft belongs to a refusal at communication only.
    for (const demonstration of MECHANISM_DEMONSTRATIONS) {
        const asked = buildActivityForReview({ kind: 'mechanism-demonstration', demonstrationId: demonstration.id, session: { ...session, roles: none } }, { includeDrafts: true })
        assert.ok(!('draft' in asked), `${demonstration.id}: ${asked.outcome}`)
    }
    // An earlier refusal carries none either (A01 with no keeper stops at the session).
    assert.ok(!('draft' in buildActivityForReview({ ...a01, session: { ...session, roles: none } }, { includeDrafts: true })))
    // The pilot route never carries one, whatever it answers.
    assert.ok(!JSON.stringify(buildPilotActivity()).includes('"draft"'))
    // The live route never asks: the routes file sets `includeDrafts` once, in the checked-activity handler, from the admin check.
    const routes = fs.readFileSync(path.join(__dirname, '../../routes/app.routes.ts'), 'utf8')
    assert.equal(routes.split('includeDrafts').length - 1, 1)
    assert.ok(routes.includes('reviewActivity(session, req.body ?? {}, { includeDrafts: viewer?.permissions?.isAdmin === true })'))
    assert.ok(!routes.includes('buildActivityForReview'), 'only the review module calls the review build')
})

test('3. the prescription rule (Q4): his adversarial lines are refused with plausible citations; the residual is pinned', () => {
    const fixture = blockFixtures[0]
    const rendered = renderConcreteGame(fixture)
    const start = 'transitions[c:provisional:A01-R1:A01-R1-T1-1]'
    const origin = 'value.primaryEvent.conditions[c:restated:RPC-001:RPC-001-18.a]'
    // TEST-ONLY lines, built from his 17 October words (D5, D6), each with the citation a prescription would most plausibly carry.
    const adversarial: [string, string[]][] = [
        [`The ${ROLE} must be used before the building team progresses`, [`${origin}.referents`, `${start}.placement.actor`]],
        [`Play the ball back to the ${ROLE} first, then switch it to the other side`, [`${start}.placement.actor`, `${start}.awardedTo`]],
        ['The building team has to complete passes before entering the target zone', [`${origin}.type`]],
        ['Restart from the same spot each time', [`${start}.placement.region`]],
        [`The pressing team waits until the ${ROLE} plays the ball`, [`${start}.placement.actor`, `${start}.playState`]],
        ['The building team plays a set pattern out of the back', [`${start}.awardedTo`]],
    ]
    for (const [text, from] of adversarial) {
        const forced = { ...rendered, instructions: [...rendered.instructions, { section: 'How it works' as const, text, status: 'DERIVED' as const, from, quantities: [] }] }
        const q4 = checkFidelity(fixture, forced as any).findings.filter(f => f.question === 4 && f.severity === 'VIOLATION' && f.what.includes(text))
        assert.ok(q4.length >= 1, `refused: ${text}`)
    }
    // A role named with an obligation word is refused on the role rule too, whatever it cites.
    const roleRule = { ...rendered, instructions: [...rendered.instructions, { section: 'How it works' as const, text: `The ${ROLE} must take every restart`, status: 'DERIVED' as const, from: [`${start}.placement.actor`], quantities: [] }] }
    assert.ok(checkFidelity(fixture, roleRule as any).findings.some(f => f.question === 4 && f.what.includes(`names the ${ROLE}`)))
    // KNOWN LIMIT, pinned (the design's measurement and the verification's): a suggestion-mood line with no obligation word is not
    // seen by the lexicon. His approval of each sentence is the guard that remains.
    const residual = { ...rendered, instructions: [...rendered.instructions, { section: 'How it works' as const, text: `Use the ${ROLE} to recycle possession and change the point of attack`, status: 'DERIVED' as const, from: [`${start}.placement.actor`], quantities: [] }] }
    assert.equal(checkFidelity(fixture, residual as any).findings.filter(f => f.question === 4 && f.what.includes('Use the')).length, 0)
    // The draft itself has no hit: the A01 rendering passes the rule as it stands.
    assert.equal(checkFidelity(fixture, rendered).findings.filter(f => f.question === 4).length, 0)
    // Re-pointed 18 October 2026 (stage M5, design step L13): his approved build-out sentence (A01-W1) says "must" ("The progression
    // must begin with the goalkeeper's build-out ..."), and it is the one sentence with an obligation word. His approval exempts it from
    // the lexicon, never from the role rule (test 3b), and Q4 above finds nothing in it. Every DRAFT sentence still has none.
    // Was: no obligation word in any A01 sentence.
    // Re-pointed 18 October 2026 (design step L14): and his eligibility sentence (A01-W3, his reply filed 20 October 2026, item 2) says
    // "cannot" ("... it cannot score again until the next goalkeeper restart"); approved, so exempt from the lexicon, and it passes the
    // role rule only because it covers the origin condition that names the goalkeeper (approved-wording.unit.ts measures it without).
    // Was: [HIS_ITEM_1].
    const withObligation = rendered.instructions.filter(i => OBLIGATIONS.some(word => word.test(i.text)))
    assert.deepEqual(withObligation.map(i => i.text), [HIS_ITEM_1, HIS_W3], 'no obligation word in any A01 DRAFT sentence')
})

test('3b. the one template whose obligation word is its element\'s own value passes, and only as that template; approval exempts from the lexicon, never from the role rule', () => {
    // Every served demonstration passes the rule (each was served through it); the scoring modifier's "lasts until possession changes"
    // is the one hit, admitted by the pinned template and by nothing else.
    const built = buildActivityWithFixture({ kind: 'mechanism-demonstration', demonstrationId: 'scoring-modifier', session: { ...session, roles: none } })
    assert.equal(built.activity.outcome, 'served')
    const modifier = (built.activity as ServedActivity).rendered.instructions.find(i => i.text.includes('until'))!
    const endsOn = modifier.parts!.find(p => p.text.includes('until'))!
    assert.deepEqual(OBLIGATION_ALLOWLIST.map(t => t.id), ['VALUE_MODIFIER_ENDS_ON'])
    assert.equal(OBLIGATION_ALLOWLIST[0].holds(endsOn, built.fixture), true)
    // The same words citing anything more are not the template: refused (TEST-ONLY alteration of the served rendering).
    const widened = { ...endsOn, from: [...endsOn.from, 'value.primaryEvent.value'] }
    assert.equal(OBLIGATION_ALLOWLIST[0].holds(widened, built.fixture), false)
    const altered = JSON.parse(JSON.stringify((built.activity as ServedActivity).rendered))
    const target = altered.instructions.find((i: any) => i.text.includes('until'))
    target.parts.find((p: any) => p.text.includes('until')).from.push('value.primaryEvent.value')
    target.from = [...new Set(target.parts.flatMap((p: any) => p.from))]
    assert.ok(checkFidelity(built.fixture, altered).findings.some(f => f.question === 4 && f.what.includes('until possession changes')))
    // The frozen A04 fixture: no hit.
    const frozen = JSON.parse(fs.readFileSync(A04_FIXTURE, 'utf8'))
    assert.equal(checkFidelity(frozen, renderConcreteGame(frozen)).findings.filter(f => f.question === 4).length, 0)

    // Approved wording is exempt from the lexicon (TEST-ONLY entry over a whole-game condition) and never from the role rule.
    const gf2 = buildActivityFromKnowledge(['GF2'], { ...session, roles: none })
    const withCondition: any = JSON.parse(JSON.stringify(gf2.fixture))
    withCondition.game.value.primaryEvent.conditions = [{ elementId: 'c:TEST-ONLY:C-1', type: 'progression', value: 'beyond' }]
    const approvedBy = { who: 'TEST-ONLY', date: '2026-10-15', quote: 'TEST-ONLY', ccs: 'TEST-ONLY' }
    const entry = (sentence: string) => [{ id: 'TEST-ONLY', covers: [{ row: 'V4', match: { equals: 'progression' } }, { row: 'V6', match: { equals: 'beyond' } }], sentence, section: 'How to score' as const, approvedBy }] as any
    const lexicon = entry('A score counts only after the test condition')
    const said = renderConcreteGame(withCondition, lexicon)
    assert.ok(said.instructions.some(i => i.text === 'A score counts only after the test condition'))
    assert.equal(checkFidelity(withCondition, said, lexicon).findings.filter(f => f.question === 4).length, 0, 'approved: exempt from the lexicon')
    assert.ok(checkFidelity(withCondition, said).findings.some(f => f.question === 4 && f.what.includes('only after')), 'the same sentence under the real (empty) table is refused')
    const roleLine = entry(`The ${ROLE} must take part before a score counts`)
    const saidRole = renderConcreteGame(withCondition, roleLine)
    assert.ok(checkFidelity(withCondition, saidRole, roleLine).findings.some(f => f.question === 4 && f.what.includes(`names the ${ROLE}`)), 'approval never exempts a role named with an obligation')
})

/**
 * K7 review, 15 October 2026. As landed, the lexicon missed his own words and the standing restrictions, and nothing but a render test
 * kept "the defending team" out: each line below PASSED every rule on the real A01 rendering with the citation shown (measured at
 * 665bc7c). Now each is refused; the two residuals that carry no word of obligation are pinned beside the earlier one.
 */
test('3c. (K7 review) his words "mandatory", "sequence", "required" and the standing restrictions are refused; "the defending team" is refused in role blocks', () => {
    const fixture = blockFixtures[0]
    const rendered = renderConcreteGame(fixture)
    const start = 'transitions[c:provisional:A01-R1:A01-R1-T1-1]'
    const placement = 'performers.startPlacement[c:provisional:A01-R1:A01-R1-P8-1]'
    const refusedAt4 = (text: string, from: string[]) => {
        const forced = { ...rendered, instructions: [...rendered.instructions, { section: 'How it works' as const, text, status: 'DERIVED' as const, from, quantities: [] }] }
        return checkFidelity(fixture, forced as any).findings.filter(f => f.question === 4 && f.severity === 'VIOLATION' && f.what.includes(text))
    }
    // TEST-ONLY lines from his 17 October D5/D6 and 18 October item 3, each citing what a prescription would most plausibly cite.
    for (const [text, from] of [
        [`A pass to the ${ROLE} is mandatory before the building team progresses`, [`${start}.placement.actor`]],
        [`A pass to the ${ROLE} is required before the building team progresses`, [`${start}.placement.actor`]],
        ['The building team passes along a fixed sequence', [`${start}.awardedTo`]],
        [`The ${ROLE} always receives the first pass of each build-out`, [`${start}.placement.actor`]],
        [`The ${ROLE} should take part in every build-out`, [`${start}.placement.actor`]],
        ['Never restart from a different spot', [`${start}.placement.region`]],
        ["The building team's outfield players cannot enter the target zone before the ball is played", [`${placement}.region`, `${placement}.timing`]],
        ["The building team's outfield players stay short of the marked line throughout play", [`${placement}.region`, `${placement}.timing`]],
    ] as [string, string[]][]) {
        assert.ok(refusedAt4(text, from).length >= 1, `refused: ${text}`)
    }
    // A specialized role with an ordering word: refused on the role rule (the general lexicon leaves "before" to the coach's setup).
    const ordering = `The building team plays the ball back to the ${ROLE} before moving forward`
    assert.ok(refusedAt4(ordering, [`${start}.placement.actor`, `${start}.awardedTo`]).some(f => f.what.includes(`names the ${ROLE}`)))
    // KNOWN LIMITS, pinned: no word of obligation, order or role — his approval of each sentence is the guard that remains.
    assert.equal(refusedAt4('The building team plays back before progressing', [`${start}.awardedTo`]).length, 0)
    assert.equal(refusedAt4("The building team's outfield players stay short of the marked line", [`${placement}.region`, `${placement}.timing`]).length, 0)
    // Nothing the activity says moves: the A01 draft and every served activity carry no word of the widened lexicon.
    assert.equal(checkFidelity(fixture, rendered).findings.filter(f => f.question === 4).length, 0)

    // "The defending team": refused by the composition check of a game in role blocks (his D7), whatever it cites.
    const renders = blockFixtures.map((blockFixture, i) => ({ blockId: BLOCKS[i], fixture: blockFixture, rendered: renderConcreteGame(blockFixture) }))
    const composed = composeRoleBlockActivity(renders, index)
    for (const text of ['The defending team presses as soon as play restarts', 'The attacking team restarts play']) {
        const forced = { ...composed, instructions: [...composed.instructions, { section: 'How it works' as const, text, status: 'DERIVED' as const, from: [`${start}.playState`], quantities: [] }] }
        const q6 = checkRoleBlockComposition(renders, forced as any, index).filter(f => f.severity === 'VIOLATION' && f.what.includes(text) && f.what.includes('changes with possession'))
        assert.equal(q6.length, 1, text)
    }
    assert.deepEqual(checkRoleBlockComposition(renders, composed, index).filter(f => f.severity === 'VIOLATION'), [], 'the A01 composition names every team by its role')
})

/*
 * Stage M3, 17 October 2026 (design steps L8 and L9). The entry below is TEST-ONLY (approvedBy names TEST-ONLY; the production table
 * stays empty until design step L13), and its sentence is his reply filed 19 October 2026, item 1, verbatim ("Approved with revised
 * wording"), located on the building role's bound and the four conditions, its match values read from the game. (HIS_ITEM_1 is
 * declared at the top since stage M5, 18 October 2026, because test 1 now reads it: his sentence is production entry A01-W1.)
 */
const testApproval = { who: 'TEST-ONLY', date: '2026-10-19', quote: 'TEST-ONLY', ccs: 'TEST-ONLY' }
function locatedEntry(game: any, sentence: string, types: string[], bound = true): any[] {
    const conditions: any[] = game.value.primaryEvent.conditions.filter((c: any) => types.includes(c.type))
    const covers = [
        ...(bound ? [{ row: 'B8', match: { equals: 'BUILD_OUT_EPISODE' }, element: { base: 'activityRoles', field: 'activityRole', equals: 'BUILDING' } }] : []),
        ...conditions.flatMap(condition => {
            const element = { base: 'value.primaryEvent.conditions', field: 'type', equals: condition.type }
            return [{ row: 'V3', match: { equals: condition.scope }, element }, { row: 'V4', match: { equals: condition.type }, element }, { row: 'V5', match: { equals: condition.referents }, element }, ...('value' in condition ? [{ row: 'V6', match: { equals: condition.value }, element }] : [])]
        }),
    ]
    return [{ id: 'TEST-ONLY', covers, sentence, section: 'How to score', approvedBy: testApproval }]
}
const ALL_TYPES = ['origin', 'progression', 'control', 'exclusion']

test('3d. (M3, L8) the role rule passes over his approved sentence only where the role is a value of a field it covers', () => {
    const fixture = blockFixtures[0]
    const wording = locatedEntry(fixture.game, HIS_ITEM_1, ALL_TYPES)
    const rendered = renderConcreteGame(fixture, wording)
    const his = rendered.instructions.find(i => i.text === HIS_ITEM_1)!
    assert.ok(his, 'said')
    // The origin condition's referents name the role as a value (arms[].takenBy): the sentence restates a rule of the game.
    assert.ok(his.from.includes('value.primaryEvent.conditions[c:restated:RPC-001:RPC-001-18.a].referents'))
    assert.deepEqual(checkFidelity(fixture, rendered, wording).findings.filter(f => f.question === 4), [], 'approved, and the role is a covered value: no Q4 finding')
    // The same words as a DRAFT with the same citations: refused by the role rule (and the lexicon).
    const draft = { ...rendered, instructions: rendered.instructions.map(i => (i === his ? { ...i } : i)) }
    // Re-pointed 18 October 2026 (stage M5): checked with NO approved wording ([]), which is what the default meant while the table was
    // empty; the production table now holds his sentence (A01-W1), so the default would approve it. The intent is unchanged.
    const asDraft = checkFidelity(fixture, draft, []).findings.filter(f => f.question === 4 && f.what.includes('The progression must begin'))
    assert.ok(asDraft.some(f => f.what.includes(`names the ${ROLE}`)), JSON.stringify(asDraft))
    // An approved sentence naming the role whose covered fields hold no such value: refused (progression, control, exclusion and the
    // bound name no role).
    const uncovered = locatedEntry(fixture.game, HIS_ITEM_1, ['progression', 'control', 'exclusion'])
    const renderedUncovered = renderConcreteGame(fixture, uncovered)
    assert.ok(renderedUncovered.instructions.some(i => i.text === HIS_ITEM_1), 'said by the narrower entry')
    assert.ok(checkFidelity(fixture, renderedUncovered, uncovered).findings.some(f => f.question === 4 && f.what.includes(`names the ${ROLE}`)), 'a role no covered field holds is refused')
    // His adversarial lines (tests 3 and 3c) are re-run unchanged above, under the same rule.
})

test('8. (M3, L9) where a role\'s credit is bounded, no scoring sentence speaks for it unless approved (fidelity Q2)', () => {
    const fixture = blockFixtures[0]
    const rendered = renderConcreteGame(fixture)
    const kind = 'value.primaryEvent.kind'
    const building = 'activityRoles[c:provisional:A01-R1:A01-R1-B1-1]'
    const pressing = 'activityRoles[c:provisional:A01-R1:A01-R1-B1-2]'
    const q2 = (text: string, from: string[], wording?: any[]) => {
        const forced = { ...rendered, instructions: [...rendered.instructions, { section: 'How to score' as const, text, status: 'DERIVED' as const, from, quantities: [] }] }
        // Only the bounded-credit rule's findings (a number said without its binding is refused by another Q2 rule as well).
        return checkFidelity(fixture, forced as any, wording).findings.filter(f => f.question === 2 && f.severity === 'VIOLATION' && f.what.includes(text) && f.what.includes('confined to an episode'))
    }
    // As rendered: nothing team-neutral is said, the pressing role's own sentence and the value pass Q2.
    assert.ok(!rendered.instructions.some(i => i.text.startsWith('A team scores')))
    assert.deepEqual(checkFidelity(fixture, rendered).findings.filter(f => f.question === 2), [])
    const pressingLine = rendered.instructions.find(i => i.text.startsWith('Pressing team: Score'))!
    assert.ok(pressingLine.from.includes(kind) && pressingLine.from.includes(`${pressing}.creditedWithin`))
    assert.deepEqual(rendered.instructions.find(i => i.text === 'Each score is worth 1 point')!.from, ['value.primaryEvent.value'])
    // TEST-ONLY adversarial lines on the real A01 fixture, each with the citations it would most plausibly carry.
    const old = 'A team scores 1 point by getting the ball under control into the zone it is attacking: running it in, or passing to a teammate who receives it under control inside'
    assert.equal(q2(old, [kind, 'value.primaryEvent.value', 'objects[c:sport-profile:soccer:SPORT-SOCCER-01].kind', 'space.regions[c:restated:GF2:GF2-03.f].noun', 'space.regions[c:restated:GF2:GF2-03.e].noun', 'objectives[c:restated:GF2:GF2-08.c].role']).length, 1, 'the old team-neutral sentence')
    assert.equal(q2('A team scores by getting the ball into the zone it is attacking', [kind, 'objectives[c:restated:GF2:GF2-08.e].role']).length, 1, 'team-neutral citing only the pressing holder\'s objective still speaks for every team')
    assert.equal(q2('Building team: Score by getting the ball into the zone it is attacking', [kind, `${building}.creditedWithin`]).length, 1, 'a DRAFT citing the bounded role\'s bound')
    assert.equal(q2('Building team: Score by getting the ball into the zone it is attacking', [kind, `${building}.activityRole`]).length, 1, 'a DRAFT for the bounded role citing anything of it')
    assert.equal(q2('The building team scores only in its build-out', [`${building}.creditedWithin`]).length, 1, 'a DRAFT citing the bound, with or without the event')
    assert.equal(q2('Pressing team: Score by getting the ball into the zone it is attacking', [kind, `${pressing}.creditedWithin`]).length, 0, 'the whole-game role may be told in a draft')
    // Added in the M3 review, 17 October 2026 (measured: each of these passed the rule as first built, which read only citations).
    // The old sentence, or the bounded role's own name, cannot borrow the whole-game role's citations; nor does leaving out the kind
    // stop a sentence citing the value with what it is scored by from being a scoring sentence.
    assert.equal(q2(old, [kind, 'value.primaryEvent.value', `${pressing}.creditedWithin`]).length, 1, 'the old team-neutral sentence citing the whole-game role\'s bound')
    assert.equal(q2(old, [kind, 'value.primaryEvent.value', `${pressing}.activityRole`]).length, 1, 'the old team-neutral sentence citing anything of the whole-game role')
    assert.equal(q2('Building team: Score by getting the ball into the zone it is attacking', [kind, `${pressing}.creditedWithin`]).length, 1, 'the bounded role named, the whole-game role cited')
    assert.equal(q2(old, ['value.primaryEvent.value', 'objects[c:sport-profile:soccer:SPORT-SOCCER-01].kind', 'objectives[c:restated:GF2:GF2-08.c].role']).length, 1, 'the old sentence without the kind it scores')
    assert.equal(q2('Building team: Score whenever the ball is in the zone', ['objectives[c:restated:GF2:GF2-08.c].role']).length, 1, 'a How to score sentence naming the bounded role, whatever it cites')
    assert.equal(q2('Each score is worth 1 point', ['value.primaryEvent.value']).length, 0, 'the value alone says how much, never how or when')
    // His approved sentence (TEST-ONLY approval) passes Q2; it cites the building role's bound.
    const wording = locatedEntry(fixture.game, HIS_ITEM_1, ALL_TYPES)
    const approved = renderConcreteGame(fixture, wording)
    assert.deepEqual(checkFidelity(fixture, approved, wording).findings.filter(f => f.question === 2), [])
    // An approved team-neutral sentence that does not cite the bounded role's bound is still refused (TEST-ONLY entry on the four
    // conditions alone, the bound left out).
    const neutral = locatedEntry(fixture.game, 'TEST-ONLY team-neutral sentence', ALL_TYPES, false)
    const neutralRendered = renderConcreteGame(fixture, neutral)
    const forcedNeutral = { ...neutralRendered, instructions: neutralRendered.instructions.map(i => (i.text === 'TEST-ONLY team-neutral sentence' ? { ...i, from: [...i.from, kind] } : i)) }
    assert.ok(checkFidelity(fixture, forcedNeutral as any, neutral).findings.some(f => f.question === 2 && f.what.includes('TEST-ONLY team-neutral sentence')))
    // TEST-ONLY: the same game with the building role's bound the whole game reads as every unbounded game does.
    const unbounded = JSON.parse(JSON.stringify(fixture))
    unbounded.game.activityRoles.find((r: any) => r.activityRole === 'BUILDING').creditedWithin = 'WHOLE_GAME'
    const plainScoring = renderConcreteGame(unbounded).instructions.filter(i => i.section === 'How to score').map(i => i.text)
    // Re-pointed 21 October 2026 (hardening H5, DRAFT): the zone each team enters is named as its target ("into its target zone"); the
    // adversarial `old` lines above keep the earlier words, which the rule refuses by what they cite and speak for, not by their words.
    assert.ok(plainScoring.includes(old.replace('into the zone it is attacking', 'into its target zone')), JSON.stringify(plainScoring))
    assert.ok(!plainScoring.some(t => t.startsWith('Each score is worth') || t.includes(': Score ')))
    // Every served demonstration reads as before: no role there carries a bound.
    for (const demonstration of MECHANISM_DEMONSTRATIONS) {
        const built = buildActivityWithFixture({ kind: 'mechanism-demonstration', demonstrationId: demonstration.id, session: { ...session, roles: none } })
        if (built.activity.outcome !== 'served') continue
        assert.ok(!(built.activity as ServedActivity).rendered.instructions.some(i => i.text.startsWith('Each score is worth')), demonstration.id)
    }
})

test('4. a restart discharges its episode boundary only with its awardee', () => {
    const fixture = blockFixtures[0]
    const rendered = renderConcreteGame(fixture)
    assert.equal(checkFidelity(fixture, rendered).findings.filter(f => f.what.includes('startsEpisode was excluded')).length, 0)
    const stripped = JSON.parse(JSON.stringify(rendered))
    for (const instruction of stripped.instructions) {
        instruction.from = instruction.from.filter((p: string) => !p.endsWith('.awardedTo'))
        for (const part of instruction.parts ?? []) part.from = part.from.filter((p: string) => !p.endsWith('.awardedTo'))
    }
    const undischarged = checkFidelity(fixture, stripped).findings.filter(f => f.severity === 'VIOLATION' && f.what.includes('startsEpisode was excluded'))
    // Every transition that restarts play (seven in A01-R1) loses its awardee; the possession change, which has none, is untouched.
    assert.equal(undischarged.length, 7, JSON.stringify(undischarged.map(f => f.what)))
    assert.ok(undischarged.every(f => f.what.includes('.awardedTo')))
})

test('5. the exchange: ends fixed AND what changes with the roles; separately, who changes team; Q6 needs both halves', () => {
    // Re-pointed 18 October 2026 (design step L14): read from the served activity (was the review draft, which production no longer has).
    const exchange = served.rendered.instructions.filter(i => i.section === ROLE_EXCHANGE)
    assert.equal(exchange.length, 3)
    // Re-pointed 21 October 2026 (stage 2D, his reply filed 22 October 2026, item 7: "Role exchanges should not require unnecessary
    // physical re-marking."): with every block's markings set out once, the half that changes is which marked zone each team attacks, and
    // nothing is re-marked unless the coach has moved the line (physical-layout.unit.ts 7). Was: "..., and the marked line and both target
    // zones are set out again for the new roles; ...". The citations Q6 reads are the same.
    assert.equal(exchange[1].text, 'Each team keeps its end for the whole activity. When you call the next block the teams exchange roles, not ends: each team now attacks the target zone of its new role, and nothing is re-marked unless you have moved the marked line; there is no set block length')
    assert.ok(!served.rendered.instructions.some(i => i.section === ROLE_EXCHANGE && i.text.includes('set out again')))
    const keyed = roleKeyedPositions(blockFixtures[0])
    assert.deepEqual(keyed, ['space.regions[c:provisional:A01-R1:A01-R1-S2-1].position.along', 'space.regions[c:restated:GF2:GF2-03.e].position.along', 'space.regions[c:restated:GF2:GF2-03.f].position.along'])
    assert.deepEqual(roleKeyedPositions(blockFixtures[1]), keyed, 'the same markings in both blocks, so the sentence is said once')
    assert.ok(keyed.every(p => exchange[1].from.includes(p)), 'the ends-fixed sentence cites every marking written for a role')
    assert.ok(exchange[2].from.every(p => p.startsWith('reassignments[')), 'the reassignment is its own sentence (his item 1: separate capabilities)')
    const renders = blockFixtures.map((fixture, i) => ({ blockId: BLOCKS[i], fixture, rendered: renderConcreteGame(fixture) }))
    const composed = composeRoleBlockActivity(renders, index)
    assert.deepEqual(checkRoleBlockComposition(renders, composed, index).filter(f => f.severity === 'VIOLATION'), [])
    // TEST-ONLY: the markings clause's citations taken out of both renders — Q6 refuses (his D2: the half that changes).
    const without = renders.map(entry => {
        const rendered = JSON.parse(JSON.stringify(entry.rendered))
        for (const instruction of rendered.instructions) {
            if (instruction.section !== ROLE_EXCHANGE) continue
            instruction.from = instruction.from.filter((p: string) => !keyed.includes(p))
            for (const part of instruction.parts ?? []) part.from = part.from.filter((p: string) => !keyed.includes(p))
        }
        return { ...entry, rendered }
    })
    const q6 = checkRoleBlockComposition(without, composeRoleBlockActivity(without, index), index).filter(f => f.severity === 'VIOLATION')
    assert.ok(q6.some(f => f.what.includes('the markings written for the roles')), JSON.stringify(q6))
    // A game with no position written for a role owes nothing here (the possession game with roles and no placement).
    assert.deepEqual(roleKeyedPositions(buildActivityFromKnowledge(['GF2'], { ...session, roles: none }).fixture), [])
})

test('6. no noun the game does not hold, no challenge level, no bare decision imperative; the Communication Standard leaves each draft as it is', () => {
    // Re-pointed 18 October 2026 (design step L14): read from the served activity, his two new scoring statements among its sentences
    // (was the review draft, which production no longer has).
    const texts = served.rendered.instructions.map(i => i.text)
    // Re-pointed 21 October 2026 (stage 2D): "halfway" left this list. It is now said, in one sentence, as a term derived from the values
    // the game holds (the line 20 m from the building team's end line on a 40 m length: 2 x 20 = 40), citing both, and only with the
    // markings set out once; a line off half the length never prints it (physical-layout.unit.ts 4 and 9).
    for (const forbidden of ['own end', 'near its own goal', 'in goal', 'from the back', 'defending team', 'attacking team', 'pressure line', 'post-regain zone']) {
        assert.ok(!texts.some(t => t.toLowerCase().includes(forbidden)), forbidden)
    }
    assert.deepEqual(texts.filter(t => t.toLowerCase().includes('halfway')), ['Mark a line across the area at halfway, 20 m from each end line'])
    for (const level of ['Comfortable', 'Stretch', 'Demanding']) assert.ok(!texts.some(t => t.includes(level)), level)
    assert.ok(!texts.some(t => /^(Choose|Decide) (when|where|whether)\b/.test(t)))
    // Re-pointed 18 October 2026 (stage M5, design step L13): his approved sentence (A01-W1) is said exactly as he wrote it, its own
    // full stops included, so the standard leaves it byte for byte as it is; it still finds nothing in it. Every DRAFT is as before.
    const approved = new Set(served.evidence!.sections.instructions.filter(i => i.wording === 'APPROVED').map(i => i.text))
    assert.ok(approved.has(HIS_ITEM_1) && approved.has(HIS_W2) && approved.has(HIS_W3))
    for (const text of texts) {
        assert.deepEqual(findCommunicationStandardViolations(text), [], text)
        // The standard ends a sentence with a full stop, which the renderer leaves to the page: nothing else changes.
        assert.equal(applyCoachCommunicationStandard(text), text.endsWith('.') && approved.has(text) ? text : `${text}.`, text)
    }
})

test('7. the start placement: free to move once play restarts, said only with the restarts that re-establish it', () => {
    const fixture = blockFixtures[0]
    const said = renderConcreteGame(fixture).instructions.find(i => i.text.startsWith('Before each of these restarts'))!
    assert.ok(said.text.endsWith('once play restarts, every player is free to move anywhere'), 'his item 3: the start never prevents players advancing')
    assert.ok(['timing', 'resetsAt'].every(field => said.from.includes(`performers.startPlacement[c:provisional:A01-R1:A01-R1-P8-1].${field}`)))
    // TEST-ONLY: a placement timed INITIAL is not re-established at the restarts, so this sentence is not said for it, and fidelity
    // then finds the placement uncarried (no wording is invented for a timing the sentence does not translate).
    const initial = JSON.parse(JSON.stringify(fixture))
    for (const placement of initial.game.performers.startPlacement) placement.timing = 'INITIAL'
    const rendered = renderConcreteGame(initial)
    assert.ok(!rendered.instructions.some(i => i.text.startsWith('Before each of these restarts')))
    assert.ok(checkFidelity(initial, rendered).findings.some(f => f.question === 3 && f.what.includes('performers.startPlacement[') && f.what.includes('.timing')))
})

/**
 * Stage 2C, 21 October 2026. His reply filed 22 October 2026, item 8: "Correct section assignment, repetition, and information
 * classification in the checked pathway."; item 7: "The knowledge can continue to represent the distinct targets and relationships for
 * each block, even where the physical markings remain unchanged." Each block says the two target sentences in the same words, each
 * citing its own role's target, so each is said once (paired, never pooled), and Q6 accepts the pair only as each block's own sentence.
 */
test('9. (stage 2C) a sentence the role blocks say alike by role is said once: block 1\'s citations exactly, block 2\'s beside them, never pooled; Q6 refuses a counterpart one word different, missing, or whose citations do not map, and a repetition; the evidence shows both blocks\' positions', () => {
    const renders = blockFixtures.map((fixture, i) => ({ blockId: BLOCKS[i], fixture, rendered: renderConcreteGame(fixture) }))
    const composed = composeRoleBlockActivity(renders, index)
    assert.deepEqual(composed.instructions, served.rendered.instructions, 'the served activity is this composition of the two renders')
    // The pairing, read from the two games: each role's objective and target region in block 1, and the same role's in block 2.
    const pairing = counterpartMap(renders[0], renders[1], index)
    // Re-pointed 21 October 2026 (stage 2D): the blocks now carry the markings set out once, so the pairing also mirrors the layout's end
    // zones and their marks along the length (physical-layout.unit.ts 8); the role pairing is unchanged.
    assert.deepEqual(
        [...pairing.entries()].filter(([from]) => !from.startsWith('layout.')).sort(),
        [
            ['objectives[c:restated:GF2:GF2-08.c]', 'objectives[c:restated:GF2:GF2-08.e]'],
            ['objectives[c:restated:GF2:GF2-08.e]', 'objectives[c:restated:GF2:GF2-08.c]'],
            ['space.regions[c:restated:GF2:GF2-03.e]', 'space.regions[c:restated:GF2:GF2-03.f]'],
            ['space.regions[c:restated:GF2:GF2-03.f]', 'space.regions[c:restated:GF2:GF2-03.e]'],
        ],
    )
    // Said once, with no block label; nothing is said twice and nothing is under one block any more.
    // Re-pointed 21 October 2026 (stage 2D): the two mirrored sentences are the target sentences said with the markings set out once, in
    // role order. Was: "Mark the pressing team's target zone at the building team's end, 5 m deep, across the full width" and "Mark the
    // building team's target zone from the marked line to the pressing team's end line, across the full width".
    const mirrored = composed.instructions.filter(i => i.counterparts)
    assert.deepEqual(mirrored.map(i => [i.section, i.text]), [
        ['Set up', "The building team's target zone is everything beyond the marked line, up to the pressing team's end line, including the end zone there"],
        ['Set up', "The pressing team's target zone is the 5 m end zone at the building team's end"],
    ])
    assert.ok(composed.instructions.every(i => i.block === undefined), 'no sentence is said under one block')
    const texts = composed.instructions.map(i => i.text)
    assert.equal(new Set(texts).size, texts.length, 'nothing is said twice')
    assert.equal(composed.instructions.length, renders[0].rendered.instructions.length, 'every sentence of block 1 is said once, and nothing else')
    // Never pooled: `from` is block 1's citations exactly, in order; the counterpart is block 2's exactly; each cites its own block's region.
    for (const instruction of mirrored) {
        const [one, two] = renders.map(entry => entry.rendered.instructions.filter(i => i.section === instruction.section && i.text === instruction.text))
        assert.equal(one.length, 1, instruction.text)
        assert.equal(two.length, 1, instruction.text)
        assert.deepEqual(instruction.from, one[0].from, 'block 1\'s citations, exactly')
        assert.deepEqual(instruction.counterparts, [{ blockId: BLOCKS[1], from: two[0].from }], 'block 2\'s citations, beside them')
        assert.notDeepEqual([...one[0].from].sort(), [...two[0].from].sort(), 'each block cites its own role\'s target')
        assert.deepEqual(two[0].from.map(path => counterpartPath(path, pairing)).sort(), [...one[0].from].sort(), 'block 2\'s citations are block 1\'s under the pairing (it is its own inverse here)')
        assert.deepEqual(instruction.parts, one[0].parts, 'block 1\'s parts, exactly')
    }
    // Production at the other served sessions: two goalkeepers, and 11 players.
    for (const other of [{ ...session, roles: { ...none, [ROLE]: 2 } }, { ...session, players: 11 }]) {
        const activity = buildActivity({ ...a01, session: other }) as ServedActivity
        assert.equal(activity.outcome, 'served', JSON.stringify(other))
        assert.equal(activity.rendered.instructions.filter(i => i.counterparts).length, 2, JSON.stringify(other))
        assert.ok(activity.rendered.instructions.every(i => i.block === undefined), JSON.stringify(other))
    }

    // Fidelity Q6 accepts the composition, and refuses each TEST-ONLY mutation below.
    const q6 = (activity: { instructions: Instruction[]; coachingObservations: string[]; withheld: any[] }, from = renders) =>
        checkRoleBlockComposition(from, activity, index).filter(f => f.severity === 'VIOLATION').map(f => f.what)
    assert.deepEqual(q6(composed), [])
    // Re-pointed 21 October 2026 (stage 2D): the pressing team's target sentence is found by its words (it is now said second, in role order).
    const pressing = mirrored.find(i => i.text.startsWith("The pressing team's"))!
    const pressingInBlock2 = renders[1].rendered.instructions.find(i => i.section === pressing.section && i.text === pressing.text)!
    const changed = (change: (i: Instruction) => Instruction) => ({ ...composed, instructions: composed.instructions.map(i => (i === pressing ? change(i) : i)) })
    // (a) Block 2's sentence one word different (TEST-ONLY): the two are not paired, each is said under its own block, and Q6 accepts that;
    // the activity that still says them as one is refused. (Re-pointed in stage 2D to words the sentence still has: "end" for "end line".)
    const oneWordOf = (text: string) => text.replace(" at the building team's end", " at the building team's end line")
    assert.notEqual(oneWordOf(pressing.text), pressing.text)
    const oneWord = renders.map((entry, n) => (n === 1 ? { ...entry, rendered: { ...entry.rendered, instructions: entry.rendered.instructions.map(i => (i === pressingInBlock2 ? { ...i, text: oneWordOf(i.text) } : i)) } } : entry))
    const apart = composeRoleBlockActivity(oneWord, index)
    assert.deepEqual(apart.instructions.filter(i => i.block).map(i => [i.block, i.text]), [
        [BLOCKS[0], pressing.text],
        [BLOCKS[1], oneWordOf(pressing.text)],
    ])
    assert.deepEqual(q6(apart, oneWord), [])
    const oneWordRefused = q6(composed, oneWord)
    assert.ok(oneWordRefused.includes(`block ${BLOCKS[1]} says "${oneWordOf(pressing.text)}" and the activity does not`), JSON.stringify(oneWordRefused))
    assert.ok(oneWordRefused.includes(`"${pressing.text}" is said for block ${BLOCKS[1]} with citations that block's game does not say it with`), JSON.stringify(oneWordRefused))
    // (b) A missing counterpart: none listed, or the field taken away (then it claims every block with block 1's citations).
    const noCounterpart = q6(changed(i => ({ ...i, counterparts: [] })))
    assert.ok(noCounterpart.includes(`"${pressing.text}" is said once for every block and carries 0 counterparts for block ${BLOCKS[1]}, not one`), JSON.stringify(noCounterpart))
    assert.ok(noCounterpart.includes(`block ${BLOCKS[1]} says "${pressing.text}" and the activity does not`), JSON.stringify(noCounterpart))
    const noField = q6(
        changed(i => {
            const { counterparts: _dropped, ...rest } = i
            return rest
        }),
    )
    assert.ok(noField.includes(`"${pressing.text}" is said for every block, and not every block's game says it`), JSON.stringify(noField))
    // (c) Citations that do not map: block 2 (TEST-ONLY) also says the sentence with block 1's own citations, and the counterpart points
    // there. Block 2's game says it, so only the pairing refuses it; and block 2's real sentence is then said by nothing.
    const unpaired = renders.map((entry, n) => (n === 1 ? { ...entry, rendered: { ...entry.rendered, instructions: [...entry.rendered.instructions, { ...pressingInBlock2, from: [...pressing.from] }] } } : entry))
    const unmapped = q6(changed(i => ({ ...i, counterparts: [{ blockId: BLOCKS[1], from: [...pressing.from] }] })), unpaired)
    assert.ok(unmapped.some(what => what.startsWith(`"${pressing.text}": its citations in block ${BLOCKS[1]} are not block ${BLOCKS[0]}'s under the role pairing`)), JSON.stringify(unmapped))
    assert.ok(unmapped.includes(`block ${BLOCKS[1]} says "${pressing.text}" and the activity does not`), JSON.stringify(unmapped))
    // (d) A counterpart naming a block the activity does not have, and a mirrored sentence also put under a block.
    assert.ok(q6(changed(i => ({ ...i, counterparts: [...i.counterparts!, { blockId: 'TEST-ONLY-block', from: [] }] }))).some(what => what.includes('carries a counterpart for block TEST-ONLY-block')))
    assert.ok(q6(changed(i => ({ ...i, block: BLOCKS[0] }))).some(what => what.includes(`and also under block ${BLOCKS[0]}`)))
    // (e) The tightening: block 2's sentence said again under its block, beside the pair, is a repetition.
    const repeated = q6({ ...composed, instructions: [...composed.instructions, { ...pressingInBlock2, block: BLOCKS[1] }] })
    assert.deepEqual(repeated, [`block ${BLOCKS[1]}'s sentence "${pressing.text}" is said 2 times by the activity`])

    // The review evidence: the pair carries both blocks' citations, and its sources and the element provenance show BOTH blocks' realized
    // positions (the D2 verification's defect: the dedupe kept one source per ref, so block 2's geometry replaced block 1's, and inside
    // one sentence the across position replaced the along one).
    const evidence = served.evidence!
    const said = evidence.sections.instructions.find(i => i.text === pressing.text)!
    assert.equal(said.block, null)
    assert.deepEqual(said.counterparts, [{ blockId: BLOCKS[1], from: pressingInBlock2.from }])
    const geometryOf = (fixture: any, path: string) => fixture.status.geometry.find((g: any) => g.path === path).geometry
    const detailOf = (blockId: string, geometry: any) => `block ${blockId}: ${`${geometry.term ?? ''} ${JSON.stringify(geometry.interval ?? null)}`.trim()}`
    const realized = (sources: { ref: string; detail: string | null }[]) => sources.filter(s => s.ref === 'realization (realized geometry)').map(s => s.detail)
    const regionOf = (from: string[]) => from.find(path => path.endsWith('.position.along'))!.replace('.position.along', '')
    const expected = [
        ...['along', 'across'].map(axis => detailOf(BLOCKS[0], geometryOf(blockFixtures[0], `${regionOf(pressing.from)}.position.${axis}`))),
        ...['along', 'across'].map(axis => detailOf(BLOCKS[1], geometryOf(blockFixtures[1], `${regionOf(pressingInBlock2.from)}.position.${axis}`))),
    ]
    assert.deepEqual(realized(said.sources).sort(), [...new Set(expected)].sort(), 'each block\'s own region, along and across')
    assert.notEqual(expected[0], expected[2], 'the two blocks place the pressing team\'s target at opposite ends')
    // One element held by both blocks at different positions: its provenance shows both.
    const along = `${regionOf(pressing.from)}.position.along`
    const element = evidence.provenance.elements.find(e => e.path === along)!
    assert.deepEqual(realized(element.sources).sort(), BLOCKS.map((blockId, n) => detailOf(blockId, geometryOf(blockFixtures[n], along))).sort())
    assert.notDeepEqual(geometryOf(blockFixtures[0], along).interval, geometryOf(blockFixtures[1], along).interval)
    // With every source kept, an element naming one member rests on that member's entailments alone (in each block), never another
    // member's (the old dedupe hid that it read every member's); a path through every member rests on every member's.
    // Each entailment names its block ("block <id>: <member> = <value>"), as each realized position does.
    const entailments = (sources: { ref: string; detail: string | null }[]) => sources.filter(s => s.ref === 'entailment at assembly').map(s => String(s.detail))
    const unblocked = (detail: string) => {
        const block = BLOCKS.find(blockId => detail.startsWith(`block ${blockId}: `))
        assert.ok(block, `${detail} names its block`)
        return detail.slice(`block ${block}: `.length)
    }
    const members = evidence.provenance.elements.filter(e => !e.path.includes('[]') && entailments(e.sources).length > 0)
    assert.ok(members.length > 0, 'some element naming one member rests on an entailment')
    for (const member of members) {
        const own = entailments(member.sources)
        assert.ok(own.map(unblocked).every(detail => detail.startsWith(`${member.path} = `)), `${member.path}: ${JSON.stringify(own)}`)
        assert.deepEqual(BLOCKS.filter(blockId => own.some(detail => detail.startsWith(`block ${blockId}: `))), BLOCKS, `${member.path}: its entailment in each block`)
    }
    const players = evidence.sections.instructions.find(i => i.section === 'Players')!
    assert.equal(new Set(entailments(players.sources).map(detail => unblocked(detail).split(' = ')[0])).size, members.length, 'the roster sentence, citing every member, rests on every member\'s entailment')
})

console.log(`communication.unit.ts — ${passed} passed`)
