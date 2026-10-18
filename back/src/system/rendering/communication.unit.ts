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
 *   5. the exchange states the ends fixed AND the markings set out again for the new roles, and separately who changes team;
 *      fidelity Q6 refuses it without the markings clause;
 *   6. no noun the game does not hold, no challenge level, no bare decision imperative, and the Coach Communication Standard
 *      leaves every draft as it is;
 *   7. the start placement says players are free to move once play restarts, and is said only with the restarts that
 *      re-establish it.
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { applyCoachCommunicationStandard, findCommunicationStandardViolations } from '../activity/coach-communication-standard'
import { loadRegister } from '../derivation/corpus'
import { indexRegister } from '../derivation/register'
import { reviewActivity } from './activity-review'
import { buildActivity, buildActivityForReview, buildActivityFromKnowledge, buildActivityWithFixture, RefusedActivity, ServedActivity } from './build-activity'
import { buildPilotActivity } from './build-pilot-activity'
import { checkFidelity, OBLIGATION_ALLOWLIST, OBLIGATIONS } from './fidelity'
import { OUT as A04_FIXTURE } from './freeze-a04-fixture'
import { MECHANISM_DEMONSTRATIONS } from './mechanism-demonstrations'
import { ADJUSTING, Instruction, renderConcreteGame, ROLE_EXCHANGE, roleKeyedPositions } from './render-concrete-game'
import { checkRoleBlockComposition, composeRoleBlockActivity } from './role-blocks'
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

// Built once and read by every test below: the admin review answer, the plain answer, and the fixture the build stopped with.
const review = buildActivityForReview(a01, { includeDrafts: true }) as RefusedActivity
const plain = buildActivity(a01) as RefusedActivity
const { fixture: composedFixture } = buildActivityWithFixture(a01)
const blockFixtures: any[] = ((composedFixture as any)?.roleBlocks?.blocks ?? []).map((block: any) => block.fixture)
const BLOCKS = ['BUILDING=TEAM_AT_AXIS_START,PRESSING=TEAM_AT_AXIS_END', 'BUILDING=TEAM_AT_AXIS_END,PRESSING=TEAM_AT_AXIS_START']

/** The sentences of a rendering by section and block, so a pin reads like the activity. */
const sentences = (instructions: Instruction[]) => instructions.map(i => `${i.section}${i.block ? ` [${BLOCKS.indexOf(i.block) + 1}]` : ''}: ${i.text}`)

test('1. the review draft of A01: every sentence the game holds, each a DRAFT, nothing withheld but the build-out condition', () => {
    assert.equal(review.stage, 'communication')
    assert.ok(review.draft, 'the administrator receives the draft')
    const draft = review.draft!
    assert.equal(draft.status, 'DRAFT_NOT_SERVED')
    // DRAFT coach wording, every sentence listed in the stage report for his approval (approved-coach-wording.json is empty).
    assert.deepEqual(sentences(draft.instructions), [
        'Set up: Mark out an area 40 m long by 30 m wide',
        "Set up: Mark a line across the area, 20 m from the building team's end line",
        "Set up [1]: Mark the pressing team's target zone at the building team's end, 5 m deep, across the full width",
        "Set up [1]: Mark the building team's target zone from the marked line to the pressing team's end line, across the full width",
        `Players: Divide 12 players into 2 teams: the building team has 6 outfield players and 1 ${ROLE}; the pressing team has 5 outfield players`,
        'How it works: Play for 20 minutes',
        'How it works: The building team starts with the ball',
        'How it works: When possession changes, play carries on with no stoppage, and the team that wins possession attacks the same zone it was already attacking',
        `How it works: The building team's ${ROLE} restarts play from the feet, with the ball still or moving: at the start, after either team scores and whenever you decide that an attack has run its course (at a stoppage or while play is on)`,
        // Moved 18 October 2026 (post-K wording, DRAFT): the two choice sentences no longer restate that the choice is the coach's,
        // no longer name the post-regain area by a noun the set-up sentences do not use, and no longer say engine provenance
        // ("using the approved M3 capability") to the coach in brackets. Was: "You choose where each of these restarts is taken: a
        // location the coach chooses, consistent with the intended build-out situation, in front of the pressing team's post-regain
        // area" and "... restarts play; you choose where (a location the coach selects for the restart, using the approved M3
        // capability) and how (a restart method the coach selects, using the approved M3 capability)". The touchline sentence is
        // unchanged: his "conventional throw-in" has no data route to the renderer yet (a wording point put to him).
        "How it works: You choose where each of these restarts is taken, consistent with the intended build-out situation, in front of the pressing team's target zone",
        'How it works: Before each of these restarts, the building team and the pressing team each set up on their own side of the marked line; once play restarts, every player is free to move anywhere',
        'How it works: If the ball goes out over a touchline, a player of the team that did not touch the ball last restarts play where the ball went out, with the ball in hand',
        'How it works: If the ball goes out over either end line, a player of the team that did not touch the ball last restarts play where and how you choose',
        // Moved 17 October 2026 (stage M3, design step L9; his reply filed 19 October 2026, items 1 and 4): the team-neutral "A team
        // scores 1 point by getting the ball under control into the zone it is attacking: ..." is no longer said, because the building
        // role's credit is confined to its build-out episode (row B8). The pressing role, whose bound is the whole game (A01-R1-B8-2),
        // is told how it scores in a sentence of its own (DRAFT), the value is said on its own (DRAFT), and the building role is told
        // only in his approved words (withheld until approved-coach-wording.json holds them, design step L13).
        'How to score: Pressing team: Score by getting the ball under control into the zone it is attacking: running it in, or passing to a teammate who receives it under control inside',
        'How to score: Each score is worth 1 point',
        "How to score: Each team attacks the zone at the other team's end. Decide which team starts at which end; the ends stay the same for the whole game",
        `${ROLE_EXCHANGE}: Play in blocks: in each block one team is the building team and the other is the pressing team`,
        `${ROLE_EXCHANGE}: Each team keeps its end for the whole activity. When you call the next block the teams exchange roles, not ends, and the marked line and both target zones are set out again for the new roles; there is no set block length`,
        `${ROLE_EXCHANGE}: When you call the next block, 1 ${ROLE} and 1 outfield player move to the team that becomes the building team`,
        "Set up [2]: Mark the building team's target zone from the marked line to the pressing team's end line, across the full width",
        "Set up [2]: Mark the pressing team's target zone at the building team's end, 5 m deep, across the full width",
        `${ADJUSTING}: You may choose to add a pressing player, representing an opponent committing additional numbers forward: adding a pressing player can increase pressure but may also expose space behind the press`,
        `${ADJUSTING}: You may choose to remove a build-out player, reducing the building team's available support options`,
        `${ADJUSTING}: You may choose to move the marked line nearer to either end line`,
        `${ADJUSTING}: You may choose to change where the teams start when the pressure you see is not creating an appropriate challenge`,
    ])
    assert.ok(draft.instructions.every(i => i.wording === 'DRAFT'), 'no sentence is approved wording: the table is empty')
    // Provisional sources: the restarts rest on his provisional choices, the area on the session alone.
    assert.deepEqual(draft.instructions[0].provisionalSources, [])
    assert.ok(draft.instructions.find(i => i.text.includes('restarts play from the feet'))!.provisionalSources.includes('provisional:A01-R1::A01-R1-T3-1'))
    assert.ok(draft.instructions.find(i => i.text.includes('nearer to either end line'))!.provisionalSources.includes('record A01-ADJ-3'))
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
    assert.equal(draft.withheld.length, 40)
    assert.deepEqual(draft.withheld.filter(field => !field.path.startsWith('value.primaryEvent.conditions[c:restated:RPC-001:RPC-001-')).map(field => [field.path, field.row]), [[CREDIT_BOUND, 'B8'], ...alsoWithheld, [CREDIT_BOUND, 'B8'], ...alsoWithheld], JSON.stringify(draft.withheld))
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
    assert.equal(draft.fidelity.violations.filter(uncarriedBound).length, 2)
    assert.ok(draft.fidelity.violations.filter(uncarriedBound).every(v => v.includes('A01-R1-B1-1]')))
    assert.equal(draft.fidelity.violations.filter(uncarriedAlso).length, 8)
    assert.equal(draft.fidelity.violations.length, 32)
})

test('2. key identity: the draft reaches the administrator\'s review answer and nothing else', () => {
    // The same build with and without the draft: identical but for the admin-only keys. Moved 15 October 2026 (stage K8): the
    // administrator's answer for a goal whose record carries his review request also carries `evidence` (review-evidence.unit.ts pins
    // it); taken out here beside the draft, the rest is still exactly the coach's answer.
    const { draft, evidence, ...rest } = review
    assert.ok(draft && evidence)
    assert.deepEqual(rest, plain)
    assert.ok(!('draft' in plain), 'buildActivity never carries it')
    assert.deepEqual(buildActivityForReview(a01, { includeDrafts: false }), plain, 'the review build without drafts is buildActivity exactly')
    assert.deepEqual(Object.keys(draft!).sort(), ['fidelity', 'instructions', 'status', 'withheld'])
    assert.deepEqual(Object.keys(draft!.instructions[0]).filter(key => ['wording', 'provisionalSources'].includes(key)).sort(), ['provisionalSources', 'wording'])
    // The review route: the coach whose session it is receives no draft; an administrator does.
    const stored: any = { _id: 'TEST-ONLY', createdBy: 'TEST-ONLY', playerCount: 12, fieldLength: '40', fieldWidth: '30', specializedRoles: { ...none, [ROLE]: 1 } }
    const coach = reviewActivity(stored, { learningGoalId: 'A01', durationMin: 20 }) as RefusedActivity
    assert.ok(!('draft' in coach))
    const admin = reviewActivity(stored, { learningGoalId: 'A01', durationMin: 20 }, { includeDrafts: true }) as RefusedActivity
    assert.deepEqual(admin.draft, review.draft)
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
    assert.ok(!rendered.instructions.some(i => OBLIGATIONS.some(word => word.test(i.text))), 'no obligation word in any A01 sentence')
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
 * wording"), located on the building role's bound and the four conditions, its match values read from the game.
 */
const HIS_ITEM_1 =
    "Building team: Score by carrying the ball beyond the marked line or passing to a teammate who receives it under control beyond the line. The progression must begin with the goalkeeper's build-out and occur before the building team loses possession. Uncontrolled clearances do not score."
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
    const asDraft = checkFidelity(fixture, draft).findings.filter(f => f.question === 4 && f.what.includes('The progression must begin'))
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
    assert.ok(plainScoring.includes(old), JSON.stringify(plainScoring))
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

test('5. the exchange: ends fixed AND the markings set out again for the new roles; separately, who changes team; Q6 needs both halves', () => {
    const exchange = review.draft!.instructions.filter(i => i.section === ROLE_EXCHANGE)
    assert.equal(exchange.length, 3)
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
    const texts = review.draft!.instructions.map(i => i.text)
    for (const forbidden of ['halfway', 'own end', 'near its own goal', 'in goal', 'from the back', 'defending team', 'attacking team', 'pressure line', 'post-regain zone']) {
        assert.ok(!texts.some(t => t.toLowerCase().includes(forbidden)), forbidden)
    }
    for (const level of ['Comfortable', 'Stretch', 'Demanding']) assert.ok(!texts.some(t => t.includes(level)), level)
    assert.ok(!texts.some(t => /^(Choose|Decide) (when|where|whether)\b/.test(t)))
    for (const text of texts) {
        assert.deepEqual(findCommunicationStandardViolations(text), [], text)
        // The standard ends a sentence with a full stop, which the renderer leaves to the page: nothing else changes.
        assert.equal(applyCoachCommunicationStandard(text), `${text}.`, text)
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

console.log(`communication.unit.ts — ${passed} passed`)
