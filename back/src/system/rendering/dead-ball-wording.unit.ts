/**
 * **The one restart after every dead ball, said to a coach** — R2, 24 October 2026 (the d27 design's stage R2, its sections 2.8, 2.9 V9 and
 * V10, and 4.3). Every word below is DRAFT.
 *
 * Christian, reply filed 27 October 2026, item 4: *"This is the most important clarification."* *"I want the same restart principle for both
 * the physical-goal and target-zone versions."* *"Whenever the ball becomes dead, play resets to a new goalkeeper-initiated build-out."*
 * *"There should be no separate corners, goal kicks, throw-ins, free kicks, or penalty kicks for this activity."* Item 3: *"If a foul or
 * infringement requires a stoppage, the coach addresses it appropriately and restarts the build-out."* *"Normal expectations for safe and fair
 * play remain in effect. We are simplifying the restart, not disregarding fouls or player safety."* Item 9: *"Our objective remains a
 * sophisticated learning environment that is simple for a coach to organize, explain, and administer."*
 *
 * What is pinned here:
 *   1. the DRAFT wording data: the common restart's moments in their order, its words (`deadBallRestart`, keyed by the register's common
 *      value) and the restart nouns (`restartLawNouns`, keyed by the Sport Profile's restart laws), each with his words; and the loader's V9
 *      refusals: a key other than the common value, wrong slots, no words of his, a law the profile does not name or does not mark a
 *      restart, a law twice, a noun with a slot, and a claim of approval;
 *   2. production A01 (the zone version) at 12/1, 12/2 and 11/1, served: one How it works sentence for every dead ball (the design's sentence,
 *      'whenever' for 'every time'), one Restarts and ball out sentence naming exactly the restarts its account departs from (throw-ins and
 *      free kicks: no goal, so no corner, goal kick or penalty can arise) and citing the policy; 27 Details sentences, not more than the 28
 *      before R1 (4.3); no sentence said twice; each dead ball said once; no sport noun for a method (no methodNouns crosses);
 *   3. the projection proved by its consumers: each block's fixture carries the default-laws account the review evidence shows for it;
 *   4. the overview (V10): the building team's group states the common restart (DEAD_BALL_RESTART, ESSENTIAL, PROPOSED) in the How it works
 *      sentence's own words cut before its moments, with a "full rule" pointer to it; the pressing team's group says nothing of it; and Q7
 *      holds it: the line dropped (TEST-ONLY) is refused;
 *   5. fidelity's V9 clauses, each refusing a TEST-ONLY copy: a dead ball said twice or not at all; a Restarts sentence naming a restart not
 *      departed from, leaving one out, said twice, not citing the policy, said with no account or under a per-trigger policy; the held
 *      normal-rules sentence said where anything is owed or no account is carried (and passing where nothing is owed);
 *   6. a game keeping a restart per trigger reads no data phrase (the R1 review's should-fix): A01's game with its policy set per trigger
 *      (TEST-ONLY) is said in R1's form, its two coach stoppages uncarried and refused, and nothing says "goes out of play" for both lines;
 *   7. the TEST-ONLY goal completion: its Restarts sentence names the goal end's restarts too, and its Details are no more than the zone
 *      version's (4.3).
 *
 * Run: npx ts-node --files -r tsconfig-paths/register ./src/system/rendering/dead-ball-wording.unit.ts
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'

import { loadProvisionalRealizations, loadRegister, loadSportDefaultLaws, PROVISIONAL_REALIZATIONS_FILE, readJson } from '../derivation/corpus'
import { indexRegister } from '../derivation/register'
import { learningGoalAuthorizations } from '../test-library/learning-goal-authorizations'
import { buildActivity, buildActivityUnderAuthorizationRecords, RefusedActivity, ServedActivity } from './build-activity'
import { coachOverviewDraftOf } from './coach-overview'
import { checkOverview } from './overview-fidelity'
import { DRAFT_COACH_WORDING_FILE, draftCoachWordingLoad, draftCoachWordingLoadOf, draftCoachWordingUnusableBecause } from './draft-coach-wording'
import { checkFidelity, FidelityFinding } from './fidelity'
import { Instruction, renderConcreteGame } from './render-concrete-game'
import { DEFAULT_LAWS_OWED } from './rendering-fixture'
import { RESTARTS } from './sections'
import { specializedRoleNames } from './session-envelope'

let passed = 0
function test(name: string, body: () => void): void {
    body()
    passed++
    console.log(`  ok  ${name}`)
}
console.log('the one restart after every dead ball, said to a coach (R2, DRAFT)')

const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const index = indexRegister(loadRegister())
const SPEC = index.deadBallRestart!
const POLICY = SPEC.path
const KEEPER = specializedRoleNames()[0]
const none = Object.fromEntries(specializedRoleNames().map(role => [role, 0]))
const sessionOf = (players: number, keepers: number, objects?: Record<string, unknown>) => ({ players, lengthM: 40, widthM: 30, durationMin: 20, roles: { ...none, [KEEPER]: keepers }, ...(objects ? { objects } : {}) })
const request = (players: number, keepers: number, objects?: Record<string, unknown>) => ({ kind: 'learning-goal', goalId: 'A01', situationId: null, session: sessionOf(players, keepers, objects) }) as any

/** The design's How it works sentence (2.8), with 'whenever' for its 'every time' (fidelity's obligation lexicon refuses "(every|each) time"). */
const HOW_IT_WORKS = `The building team's ${KEEPER} starts play, and restarts it whenever the ball is dead: after either team scores, whenever the ball goes out of play, whenever you stop play for a foul, when you judge that an attack has run its course, and whenever you stop play for any other reason`
/** The design's zone-version Restarts sentence (2.8), without its "before the goalkeeper restarts" (see the renderer's note). */
const ZONE_RESTARTS = 'There are no throw-ins or free kicks in this activity; fouls still matter, so deal with them appropriately'
const GOAL_RESTARTS = 'There are no throw-ins, corners, goal kicks, free kicks or penalties in this activity; fouls still matter, so deal with them appropriately'
/** The overview's line: the How it works sentence cut before its moments (the composer says only Details words). */
const OVERVIEW_LINE = `The building team's ${KEEPER} starts play, and restarts it whenever the ball is dead.`
/** The Details count before R1 (28, measured on H4): the zone version's is never higher (the design's 4.3 pin). */
const DETAILS_BEFORE_R1 = 28

const built = new Map<string, { activity: ServedActivity; fixture: any }>()
const zone = (players: number, keepers: number) => {
    const key = `${players}/${keepers}`
    if (!built.has(key)) {
        const result = buildActivityUnderAuthorizationRecords(request(players, keepers), learningGoalAuthorizations(), { review: { includeDrafts: true } } as any)
        assert.equal(result.activity.outcome, 'served', `${key}: ${JSON.stringify((result.activity as RefusedActivity).reasons ?? null)}`)
        built.set(key, { activity: result.activity as ServedActivity, fixture: result.fixture })
    }
    return built.get(key)!
}
const blocksOf = (fixture: any): { blockId: string; fixture: any }[] => fixture.roleBlocks.blocks
const said = (instructions: Instruction[], text: string) => instructions.filter(instruction => instruction.text === text)
const violations = (findings: FidelityFinding[]) => findings.filter(finding => finding.severity === 'VIOLATION')
const v9 = (findings: FidelityFinding[], includes: string) => violations(findings).filter(finding => finding.what.includes(includes))

// ── 1. The DRAFT wording data ──────────────────────────────────────────────────────────────────────────────────
test('the DRAFT wording data: the common restart\'s moments in order, its words keyed by the register\'s common value, and the restart nouns keyed by the profile\'s restart laws, each with his words', () => {
    const load = draftCoachWordingLoad()
    assert.equal(load.why, null)
    const wording = load.wording
    assert.deepEqual(
        wording.triggers.map(entry => [entry.trigger, entry.phrase]),
        [
            ['SCORE', 'after either team scores'],
            ['OUT_TOUCHLINE', 'whenever the {carrier} goes out of play'],
            ['OUT_END_LINE', 'whenever the {carrier} goes out of play'],
            ['INFRINGEMENT_STOPPAGE', 'whenever you stop play for a foul'],
            ['COACH_JUDGED_EPISODE_CONCLUSION', 'when you judge that an attack has run its course'],
            ['COACH_DIRECTED_STOPPAGE', 'whenever you stop play for any other reason'],
        ],
    )
    assert.deepEqual(Object.keys(wording.deadBallRestart), [SPEC.common], 'only the common restart has words of its own')
    const common = wording.deadBallRestart[SPEC.common]
    assert.deepEqual([common.starts, common.restarts, common.noOtherRestarts], ['{taker} starts play', 'restarts it whenever the {carrier} is dead', 'There are no {restarts} in this activity'])
    assert.ok(common.basis.words.includes('Whenever the ball becomes dead, play resets to a new goalkeeper-initiated build-out.'))
    assert.equal(common.basis.citedAs, 'his reply filed 27 October 2026, item 4')
    assert.deepEqual(
        wording.restartLawNouns.map(entry => [entry.law, entry.noun, entry.then ?? null]),
        [
            ['LAW-15', 'throw-ins', null],
            ['LAW-17', 'corners', null],
            ['LAW-16', 'goal kicks', null],
            ['LAW-13', 'free kicks', 'fouls still matter, so deal with them appropriately'],
            ['LAW-14', 'penalties', null],
        ],
    )
    const laws = loadSportDefaultLaws()!
    for (const entry of wording.restartLawNouns) {
        assert.equal(laws.laws.find(law => law.id === entry.law)?.restart, true, `${entry.law} is a restart law the profile names`)
        assert.ok(entry.basis.words.includes('There should be no separate corners, goal kicks, throw-ins, free kicks, or penalty kicks for this activity.'), entry.law)
    }
    assert.ok(wording.restartLawNouns.find(entry => entry.law === 'LAW-13')!.basis.words.includes('If a foul or infringement requires a stoppage, the coach addresses it appropriately and restarts the build-out.'))
    // The kick-off and the dropped ball have no noun: the How it works sentence says the start and every stoppage.
    assert.deepEqual(laws.laws.filter(law => law.restart && !wording.restartLawNouns.some(entry => entry.law === law.id)).map(law => law.id).sort(), ['LAW-8', 'LAW-8-DB'])
})

test('the loader refuses (V9): a key other than the common value, wrong slots, no words of his, a law the profile does not name or does not mark a restart, a law twice, a noun with a slot, a claim of approval', () => {
    const file = JSON.parse(fs.readFileSync(DRAFT_COACH_WORDING_FILE, 'utf8'))
    assert.equal(draftCoachWordingUnusableBecause(file, index), null)
    const refused = (alter: (f: any) => void, pattern: RegExp, what: string, laws = loadSportDefaultLaws()) => {
        const damaged = copy(file)
        alter(damaged)
        const why = draftCoachWordingUnusableBecause(damaged, index, laws)
        assert.ok(why && pattern.test(why), `${what}: ${why}`)
        // Re-pointed 24 October 2026 (R3): the wording gains departedLaws, empty like every other list where the file cannot be used.
        // Re-pointed 24 October 2026 (stage L): and boundRegions and appliedLaws, empty likewise.
        // Re-pointed 24 October 2026 (stage I): the empty wording gains objectChoices.
        assert.deepEqual(draftCoachWordingLoadOf(damaged, index, laws).wording, { objectKinds: [], facings: [], scoringAtObjects: [], normalLaws: null, triggers: [], deadBallRestart: {}, restartLawNouns: [], departedLaws: [], boundRegions: [], appliedLaws: [], objectChoices: [] }, `${what}: an unusable file loads as no wording at all`)
    }
    refused(f => (f.deadBallRestart[SPEC.perTrigger] = copy(f.deadBallRestart[SPEC.common])), /only the common restart has words of its own/, 'words for the per-trigger value')
    refused(f => (f.deadBallRestart.TEST_ONLY = copy(f.deadBallRestart[SPEC.common])), /keyed by no common value/, 'a key off the register')
    refused(f => (f.deadBallRestart[SPEC.common].basis.words = []), /quotes none of his words/, 'a COMMON entry without his words')
    refused(f => (f.deadBallRestart[SPEC.common].basis.citedAs = 'the design'), /which of his replies/, 'words not said where they are filed')
    refused(f => (f.deadBallRestart[SPEC.common].starts = '{carrier} starts play'), /exactly the slot \{taker\}/, 'a lead naming the object instead of the taker')
    refused(f => (f.deadBallRestart[SPEC.common].restarts = 'restarts it whenever {taker} says'), /a slot other than \{carrier\}/, 'restarts with another slot')
    refused(f => (f.deadBallRestart[SPEC.common].noOtherRestarts = 'There are no other restarts'), /exactly the slot \{restarts\}/, 'no nouns slot')
    refused(f => (f.deadBallRestart[SPEC.common].approvedBy = { who: 'TEST-ONLY' }), /carries "approvedBy"/, 'a claim of approval on the entry')
    refused(f => (f.restartLawNouns[0].law = 'LAW-99'), /no law the Sport Profile's defaultLaws block names/, 'a law off the profile')
    refused(f => (f.restartLawNouns[0].law = 'LAW-11'), /does not mark as a restart law/, 'a law that is no restart')
    refused(f => (f.restartLawNouns[1].law = f.restartLawNouns[0].law), /again/, 'a law twice')
    refused(f => (f.restartLawNouns[0].noun = '{restarts}'), /noun is missing or holds a slot/, 'a noun with a slot')
    refused(f => (f.restartLawNouns[3].then = ''), /then is empty/, 'an empty then')
    refused(f => (f.restartLawNouns[0].approved = true), /carries "approved"/, 'a claim of approval on a noun')
    refused(f => (f.restartLawNouns[0].basis = { words: [], citedAs: f.restartLawNouns[0].basis.citedAs }), /quotes none of his words/, 'a noun without his words')
    refused(() => undefined, /names no default laws/, 'nouns where the profile names no laws', null)
    refused(f => (f.status = 'APPROVED'), /every word here is DRAFT/, 'a file claiming approval')
    refused(f => (f.triggers[0].trigger = 'TEST_ONLY'), /no member of the register's trigger vocabulary/, 'a trigger off the vocabulary')
})

// ── 2-4. Production A01, the zone version ──────────────────────────────────────────────────────────────────────
test('production A01 at 12/1, 12/2 and 11/1: one How it works sentence for every dead ball, one Restarts sentence naming exactly the departed restarts, 27 Details (not more than 28), nothing said twice', () => {
    for (const [players, keepers] of [[12, 1], [12, 2], [11, 1]] as const) {
        const what = `A01 ${players}/${keepers}`
        const { activity, fixture } = zone(players, keepers)
        const details = activity.rendered.instructions
        const how = said(details, HOW_IT_WORKS)
        assert.equal(how.length, 1, `${what}: the common restart is said once`)
        assert.equal(how[0].section, 'How it works', what)
        assert.ok(how[0].from.includes(POLICY), `${what}: it cites the policy`)
        const restarts = said(details, ZONE_RESTARTS)
        assert.equal(restarts.length, 1, `${what}: the Restarts sentence is said once`)
        assert.equal(restarts[0].section, RESTARTS, what)
        assert.ok(restarts[0].from.includes(POLICY), `${what}: it cites the policy`)
        assert.ok(restarts[0].parts!.every(part => part.from.includes(POLICY)), `${what}: each of its parts rests on the policy`)
        // 4.3: the Details are no more than before R1 (the throw-in and end-line sentences gone, the Restarts sentence added). Re-pointed 24
        // October 2026 (R3): 28, with "There is no offside" (departed-law-wording.unit.ts); was 27.
        assert.equal(details.length, 28, what)
        assert.ok(details.length <= DETAILS_BEFORE_R1, what)
        assert.equal(new Set(details.map(instruction => instruction.text)).size, details.length, `${what}: no sentence is said twice`)
        for (const noun of ['throw-ins', 'free kicks', 'goes out of play', 'stop play for a foul', 'restarts it whenever the ball is dead']) {
            assert.equal(details.filter(instruction => instruction.text.includes(noun)).length, 1, `${what}: "${noun}" is said once`)
        }
        for (const absent of ['corners', 'goal kicks', 'penalties', 'throw-in,', 'with a throw-in', '(at a stoppage or while play is on)', 'every time']) {
            assert.ok(!details.some(instruction => instruction.text.includes(absent)), `${what}: "${absent}" is not said`)
        }
        // No sport noun for a restart method crosses (the touchline restart is gone): the design's pin.
        for (const block of blocksOf(fixture)) assert.equal(block.fixture.methodNouns, undefined, `${what}: no methodNouns`)
    }
})

test('the projection is proved by its consumers: each block\'s fixture carries the default-laws account the review evidence shows for that block', () => {
    for (const [players, keepers] of [[12, 1], [12, 2], [11, 1]] as const) {
        const what = `A01 ${players}/${keepers}`
        const { activity, fixture } = zone(players, keepers)
        const account = activity.evidence!.defaultLaws!
        const blocks = blocksOf(fixture)
        assert.equal(blocks.length, 2, what)
        for (const block of blocks) {
            const evidence = account.blocks.find(entry => entry.blockId === block.blockId)!
            assert.ok(evidence, `${what}: ${block.blockId}`)
            // Re-pointed 24 October 2026 (stage L, the R3 review's should-fix): an entry departed from only by what the realization records on
            // itself is marked so, read from the same evidence (each citation is the realization A01-R1).
            assert.deepEqual(
                block.fixture.defaultLaws,
                {
                    status: 'ACCOUNT_OF_THIS_GAME',
                    realization: 'A01-R1',
                    laws: evidence.laws.map(entry => ({ law: entry.law, end: entry.end, status: entry.status, ...(entry.status === 'DEPARTED' && entry.departedBy.length && entry.departedBy.every(citation => citation.item === 'A01-R1') ? { removedByRealization: true } : {}) })),
                },
                `${what}: ${block.blockId}`,
            )
            const departed = block.fixture.defaultLaws.laws.filter((entry: any) => entry.status === 'DEPARTED').map((entry: any) => entry.law)
            // Re-pointed 24 October 2026 (R3): and from offside (LAW-11), which A01-R1 records on itself.
            assert.deepEqual([...new Set(departed)].sort(), ['LAW-11', 'LAW-13', 'LAW-15', 'LAW-8', 'LAW-8-DB'], `${what}: the zone version departs from the throw-in and free kicks, and no goal-end restart can arise`)
            // The renderer and fidelity read it: the block's own render says exactly these nouns, and fidelity finds nothing to refuse.
            const rendered = renderConcreteGame(block.fixture)
            assert.equal(said(rendered.instructions, ZONE_RESTARTS).length, 1, `${what}: ${block.blockId}`)
            assert.deepEqual(violations(checkFidelity(block.fixture, rendered).findings), [], `${what}: ${block.blockId}`)
        }
    }
})

test('the overview (V10): the building team\'s group states the common restart in the Details\' own words, with a pointer to the sentence; the pressing team\'s says nothing of it; served to coach and administrator alike', () => {
    for (const [players, keepers] of [[12, 1], [12, 2], [11, 1]] as const) {
        const what = `A01 ${players}/${keepers}`
        const admin = zone(players, keepers).activity
        const coach = buildActivity(request(players, keepers)) as ServedActivity
        assert.equal(admin.overviewDraft!.served, true, what)
        assert.deepEqual(coach.overview, admin.overview, what)
        const [building, pressing] = admin.overview!.scoring.groups
        assert.equal(building.label, 'Building team', what)
        const line = building.lines.find(entry => entry.text === OVERVIEW_LINE)
        assert.ok(line, `${what}: ${JSON.stringify(building.lines.map(entry => entry.text))}`)
        assert.deepEqual(line!.fullRule, { label: 'full rule', section: 'How it works', text: HOW_IT_WORKS }, what)
        assert.equal(building.fullRules.length, 0, `${what}: the pointer is carried by the line`)
        assert.ok(!pressing.lines.some(entry => entry.text.includes('restarts')), what)
        const requirement = admin.overviewDraft!.scoring.blocks[0].groups[0].requirements.filter(entry => entry.rule === 'DEAD_BALL_RESTART')
        assert.deepEqual(requirement.map(entry => [entry.path, entry.class, entry.statedBy.length > 0]), [[POLICY, 'ESSENTIAL', true]], what)
        assert.ok(!admin.overviewDraft!.scoring.blocks[0].groups[1].requirements.some(entry => entry.rule === 'DEAD_BALL_RESTART'), `${what}: no requirement of the pressing team`)
    }
})

test('the overview (V10): the common restart is held by Q7 - its line dropped (TEST-ONLY) is refused, never served wrong', () => {
    const { activity, fixture } = zone(12, 1)
    const games = blocksOf(fixture).map(block => ({ blockId: block.blockId, fixture: block.fixture, rendered: renderConcreteGame(block.fixture).instructions }))
    const draft = coachOverviewDraftOf('A01', games.map(game => ({ ...game, rendered: { instructions: game.rendered } })))
    const held = checkOverview({ goalId: 'A01', draft, blocks: games, served: activity.rendered.instructions })
    assert.equal(held.verdict, 'PASS', JSON.stringify(held.findings.filter(f => f.severity === 'VIOLATION')))
    const dropped = copy(draft)
    for (const block of dropped.scoring.blocks) block.groups[0].sentences = block.groups[0].sentences.filter(sentence => sentence.text !== OVERVIEW_LINE)
    const refused = checkOverview({ goalId: 'A01', draft: dropped, blocks: games, served: activity.rendered.instructions })
    assert.equal(refused.verdict, 'FAIL')
    assert.ok(refused.findings.some(f => f.severity === 'VIOLATION' && f.question === '7.4' && f.what.includes('rule DEAD_BALL_RESTART) is stated by no sentence of the building team\'s group: a pointer never excuses it')), JSON.stringify(refused.findings.map(f => f.what)))
})

// ── 5. Fidelity's V9 clauses, each on a TEST-ONLY copy of block one ─────────────────────────────────────────────
test('fidelity (V9) refuses a dead ball said twice or not at all, and a Restarts sentence naming a restart not departed from, leaving one out, said twice, not citing the policy, or said with no account or under a per-trigger policy', () => {
    const { fixture } = zone(12, 1)
    const block = copy(blocksOf(fixture)[0].fixture)
    const rendered = renderConcreteGame(block)
    assert.deepEqual(violations(checkFidelity(block, rendered).findings), [])
    const withInstructions = (change: (instructions: Instruction[]) => Instruction[], game = block) => checkFidelity(game, { ...rendered, instructions: change(copy(rendered.instructions)) }).findings
    const restarts = rendered.instructions.find(instruction => instruction.text === ZONE_RESTARTS)!
    const how = rendered.instructions.find(instruction => instruction.text === HOW_IT_WORKS)!
    const foul = (block.game.transitions as any[]).find(t => (t.selector ?? []).some((term: any) => term.value === 'INFRINGEMENT_STOPPAGE'))
    const foulPaths = [`transitions[${foul.elementId}].playState`, `transitions[${foul.elementId}].selector`]
    const sentence = (text: string, from: string[], section = RESTARTS): Instruction => ({ section, text, status: 'DERIVED', from, quantities: [], parts: [{ text, status: 'DERIVED', from, quantities: [], bindings: [] }] }) as Instruction

    // A dead ball said twice: a second sentence saying when the foul restart happens (Q2).
    assert.ok(v9(withInstructions(list => [...list, sentence('When you stop play for a foul, play restarts', foulPaths, 'How it works')]), 'is said by 2 sentences').length, 'said twice')
    // Not at all: the How it works sentence gone (Q3; the path test also refuses it).
    assert.ok(v9(withInstructions(list => list.filter(i => i.text !== HOW_IT_WORKS)), 'no sentence says when it happens and that play restarts').length, 'not said')
    // Naming a restart not departed from: corners, whose law is not applicable without a goal (Q2).
    const corners = 'There are no throw-ins, corners or free kicks in this activity; fouls still matter, so deal with them appropriately'
    assert.ok(v9(withInstructions(list => [...list.filter(i => i !== restarts && i.text !== ZONE_RESTARTS), sentence(corners, [...restarts.from])]), 'says there are no corners, and the game\'s default-laws account does not record LAW-17').length, 'a restart not departed from')
    // Leaving one out: free kicks (Q3).
    assert.ok(v9(withInstructions(list => [...list.filter(i => i.text !== ZONE_RESTARTS), sentence('There are no throw-ins in this activity', [...restarts.from])]), 'no sentence tells the coach there are no free kicks').length, 'a departed restart left out')
    // None at all (Q3, both nouns).
    assert.equal(v9(withInstructions(list => list.filter(i => i.text !== ZONE_RESTARTS)), 'no sentence tells the coach there are no').length, 2, 'the Restarts sentence gone')
    // Said twice (Q2).
    assert.ok(v9(withInstructions(list => [...list, sentence('There are no free kicks here', [...restarts.from])]), '2 sentences name the restarts').length, 'said twice')
    // Not citing the policy (Q2).
    assert.ok(v9(withInstructions(list => [...list.filter(i => i.text !== ZONE_RESTARTS), sentence(ZONE_RESTARTS, restarts.from.filter(path => path !== POLICY))]), 'does not cite the game\'s dead-ball restart policy').length, 'no policy cited')
    // No account carried (Q2, for each noun).
    const noAccount = copy(block)
    delete noAccount.defaultLaws
    // Re-pointed 24 October 2026 (R3): read on the sentences naming restarts - "There is no offside" said with no account is refused too, by
    // its own clause (departed-law-wording.unit.ts).
    assert.equal(v9(checkFidelity(noAccount, rendered).findings, 'the game carries no default-laws account').filter(finding => finding.what.includes('says there are no')).length, 2, 'no account')
    // A per-trigger policy (Q2), and then the dead-ball clause is vacuous.
    const perTrigger = copy(block)
    perTrigger.game.restartPolicy.deadBall = SPEC.perTrigger
    const underPerTrigger = checkFidelity(perTrigger, rendered).findings
    assert.ok(v9(underPerTrigger, 'the game\'s dead-ball restart policy is not the common one').length, 'per trigger')
    assert.equal(v9(underPerTrigger, 'makes the ball dead under the game\'s common restart').length, 0, 'the dead-ball clause is vacuous per trigger')
    assert.ok(how && restarts)
})

test('fidelity (V9) refuses the held normal-rules sentence wherever anything is owed or no account is carried, and passes it where nothing is owed', () => {
    const { fixture } = zone(12, 1)
    const block = copy(blocksOf(fixture)[0].fixture)
    const rendered = renderConcreteGame(block)
    const words = draftCoachWordingLoad().wording.normalLaws!.words.replace(/\.$/, '')
    // Re-pointed 24 October 2026 (stage L): the sentence cites the account as owing nothing, as the renderer's now does (a sentence saying the
    // words without that citation is refused too: departed-law-wording.unit.ts and bound-region-communication.unit.ts pin it). Was: the policy.
    const normal = { section: 'How it works', text: words, status: 'DERIVED', from: [DEFAULT_LAWS_OWED], quantities: [], parts: [{ text: words, status: 'DERIVED', from: [DEFAULT_LAWS_OWED], quantities: [], bindings: [] }] } as Instruction
    const withNormal = (game: any) => checkFidelity(game, { ...rendered, instructions: [...rendered.instructions, normal] }).findings
    const owed = v9(withNormal(block), 'says the normal rules apply')
    assert.equal(owed.length, 1)
    // Re-pointed 24 October 2026 (R3): offside is departed from, so the goalkeeper's handling alone is owed (his item 5 keeps it open).
    assert.ok(owed[0].what.includes('owes an adaptation of LAW-12-GK:'), owed[0].what)
    const noAccount = copy(block)
    delete noAccount.defaultLaws
    assert.ok(v9(withNormal(noAccount), 'the game carries no default-laws account: it is said only where nothing is owed').length)
    const nothingOwed = copy(block)
    nothingOwed.defaultLaws.laws = nothingOwed.defaultLaws.laws.map((entry: any) => (entry.status === 'ADAPTATION_OWED' ? { ...entry, status: 'APPLIES' } : entry))
    assert.equal(v9(withNormal(nothingOwed), 'says the normal rules apply').length, 0, 'TEST-ONLY: nothing owed, so it may be said')
})

// ── 6. A game keeping a restart per trigger reads no data phrase ────────────────────────────────────────────────
test('a game keeping a restart per trigger reads no data phrase (the R1 review\'s should-fix): A01\'s game per trigger (TEST-ONLY) is said in R1\'s form, its coach stoppages uncarried and refused', () => {
    const { fixture } = zone(12, 1)
    const block = copy(blocksOf(fixture)[0].fixture)
    block.game.restartPolicy.deadBall = SPEC.perTrigger
    const rendered = renderConcreteGame(block)
    const texts = rendered.instructions.map(instruction => instruction.text)
    assert.ok(texts.includes(`The building team's ${KEEPER} restarts play: at the start, after either team scores and whenever you decide that an attack has run its course (at a stoppage or while play is on)`), JSON.stringify(texts, null, 1))
    for (const absent of ['goes out of play', 'starts play, and restarts it', 'There are no', 'stop play for a foul', 'any other reason']) {
        assert.ok(!texts.some(text => text.includes(absent)), `"${absent}" is not said per trigger`)
    }
    // Each line's ball-out restart is said by its own out-of-play sentence, as before R1.
    assert.ok(texts.some(text => text.startsWith('If the ball goes out over a touchline')), 'the touchline')
    assert.ok(texts.some(text => text.startsWith('If the ball goes out over either end line')), 'the end lines')
    const uncarried = violations(checkFidelity(block, rendered).findings).filter(finding => finding.question === 3 && finding.what.includes('no instruction carries it'))
    const foul = (block.game.transitions as any[]).find(t => (t.selector ?? []).some((term: any) => term.value === 'INFRINGEMENT_STOPPAGE'))
    assert.ok(uncarried.some(finding => finding.what.includes(String(foul.elementId))), `the foul stoppage has no words per trigger: ${JSON.stringify(uncarried.map(f => f.what))}`)
})

// ── 7. The TEST-ONLY goal completion ────────────────────────────────────────────────────────────────────────────
test('the TEST-ONLY goal completion: its Restarts sentence names the goal end\'s restarts too, and its Details are no more than the zone version\'s', () => {
    const records = learningGoalAuthorizations()
    const record = records.find(r => r.learningGoalId === 'A01') as any
    record.realizations = record.realizations.map((entry: any) => (entry.realization === 'A01-R2' ? { realization: entry.realization, words: entry.words, citedAs: entry.citedAs } : entry))
    const file = readJson(PROVISIONAL_REALIZATIONS_FILE)
    const variant = file.realizations.find((r: any) => r.id === 'A01-R2')
    variant.objectSuitability = [{ kind: 'goal', widthM: { min: 1, max: 10 }, ruledOn: 'TEST-ONLY', by: 'TEST-ONLY', citedAs: 'TEST-ONLY', words: ['TEST-ONLY'] }]
    variant.defaultLawsCheck = { mode: 'REPORT', because: 'TEST-ONLY: D-DEFAULT-LAWS completed in memory', basis: { words: ['TEST-ONLY'], citedAs: 'TEST-ONLY' } }
    for (const [players, keepers] of [[12, 1], [11, 1]] as const) {
        const what = `goal ${players}/${keepers}`
        const result = buildActivityUnderAuthorizationRecords(request(players, keepers, { goal: { count: 1, widthM: 5 } }), records, { realizations: loadProvisionalRealizations(file), review: { includeDrafts: true }, boundRegions: null } as any)
        assert.equal(result.activity.outcome, 'served', `${what}: ${JSON.stringify((result.activity as RefusedActivity).reasons ?? null)}`)
        const details = (result.activity as ServedActivity).rendered.instructions
        assert.equal(said(details, GOAL_RESTARTS).length, 1, `${what}: ${JSON.stringify(details.filter(i => i.section === RESTARTS).map(i => i.text))}`)
        assert.equal(said(details, HOW_IT_WORKS).length, 1, what)
        assert.ok(details.length <= zone(players, keepers).activity.rendered.instructions.length, `${what}: ${details.length} Details`)
        for (const block of blocksOf(result.fixture)) {
            const atGoal = block.fixture.defaultLaws.laws.filter((entry: any) => ['LAW-14', 'LAW-16', 'LAW-17'].includes(entry.law)).map((entry: any) => entry.status)
            assert.ok(atGoal.includes('DEPARTED') && atGoal.includes('NOT_APPLICABLE'), `${what}: departed at the goal end, not applicable at the other`)
        }
    }
})

console.log(`${passed} passed`)
