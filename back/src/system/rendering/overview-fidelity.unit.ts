/**
 * The Coach Overview's agreement check (Q7), and serving the overview — stage 3D, 21 October 2026.
 *
 * His reply filed 22 October 2026, item 2: *"Please ensure that the completeness check verifies that all necessary information remains
 * accessible and that abbreviated statements do not misrepresent the full rules."* Item 4: *"Shortening must not introduce new meanings,
 * omit a condition that changes the essential understanding, or silently turn a qualified rule into an unrestricted one."*
 *
 * Pinned here, on the real chain (design D3's T1-T17, as the BUILD PLAN restates T3, and the plan's additions):
 *
 *   T1  the A01 overview agrees with Details in both blocks (12/1, 12/2, 11/1) and is served to coach and administrator alike; since stage
 *       3F: each team's line saying how it scores first, then the qualifications the meaning test requires, the restart moments behind a
 *       pointer; since polish pass P1, each team's group under its DRAFT heading, its own qualifications after its own line;
 *   T2  without his eligibility sentence the building team's eligibility is unstated, and refused, a pointer never excusing it;
 *   T3  his illustrative building line, not an extract, is DRAFT (marked derived it is refused); without his eligibility and origin
 *       sentences it is refused;
 *   T4  a pressing group omitting the regain inside the zone is refused (a way to score missing; its exclusion then material);
 *   T5  counts that are not the Players sentence's are refused (another session's games; a count changed in place);
 *   T6  "halfway" with the line at 15 m of 40 is refused; the moved build's own overview is served without it;
 *   T7  an extract with one changed word is refused;          T8  keeps and leaves that do not partition the covers are refused;
 *   T9  a pointer to a Details sentence the block does not say is refused;
 *   T10 the regain exclusion left out with no pointer is refused (silent omission);
 *   T11 an overview path no Details sentence cites is refused;
 *   T12 APPROVED with paraphrased words is refused, and DERIVED from a draft source is refused;
 *   T13 block texts differing (nothing told apart by block) are refused;
 *   T14 a purpose other than the Coach Definition, or citing a context he recorded nothing for, is refused;
 *   T15 the demonstrations pass with no bounded roles, with no learning purpose; the refused one has no overview;
 *   T16 an obligation word in a draft is refused;             T17 the restart moments left out with no pointer are refused;
 *   and: the pressing group keeps V30 through the W2 extract (an extract read as not keeping it is refused); the overview is identical in
 *   both blocks (Q7.8); a refused activity has no overview; an overview failure withholds only the overview; the restart sentence rendered as
 *   ONE part (TEST-ONLY, the 3C review's probe) is never cut and a forged cut is refused; the coach receives words and pointers only; word
 *   counts are evidence, never a gate; the module names nothing of the first activity.
 *
 *   Stage 3E (22 October 2026): the extracts kept by the PROPOSED readings record and labelled so for an administrator only; a game sentence
 *   whose role clauses cite the other team's objective or target is refused (Q7.1); a scoring sentence said whole binding other than its
 *   Details sentence's own bindings is refused (Q7.2); the evidence carries the draft's pointers, labels and readings record; a reading label
 *   on a DRAFT sentence, or other than its own, is refused (Q7.3).
 *
 *   Stage 3F (22 October 2026, his reply filed 23 October 2026, items 4 and 6): his example is pinned — his first building sentence with his
 *   eligibility sentence and no statement of the build-out origin is refused and the overview withheld; his wording said whole states only
 *   what its reading gives it; an exception is material where the condition it follows from is unstated; a group sentence stating another
 *   team's field is refused (the 3E review's should-fix 2); each group opens with exactly one line saying how the team scores, served
 *   before any qualification; the administrator's evidence names, per team, the sentence stating each material element; the readings
 *   handed to serving are the ones the draft's account describes.
 *
 *   Polish pass P1 (22 October 2026, the 3F and Stage 4 reviews): a sentence under a team states something that team's group must account
 *   for (Q7.4); a group's noun is the game's (Q7.5); what the coach is served, read back, holds each line, heading and pointer to its own
 *   team, in the game sentence's order, and a pointer after the groups only where every team's group has it (Q7.5).
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { LoadedContract } from '../derivation/types'
import { sessionPlanningModel } from '../session-planning/session-planning-model'
import { learningGoalAuthorizations } from '../test-library/learning-goal-authorizations'
import { reviewActivity } from './activity-review'
import { ApprovedWording, approvedWording } from './approved-wording'
import { readingsLoadOf, recordedReading, recordedReadings } from './approved-wording-readings'
import { buildActivity, buildActivityForReview, buildActivityUnderAuthorizationRecords, buildActivityWithFixture, RefusedActivity, ServedActivity } from './build-activity'
import { CoachOverviewDraft, coachOverviewDraftOf, DetailsPointer, essentialsLoadOf, essentialsTable, FULL_RULE_LABEL, ScoringGroup, scoringRequirementsOf, ScoringSentence } from './coach-overview'
import { CoverReading, NO_RECORDED_READING } from './derived-wording'
import { OBLIGATIONS, ROLE_ORDERING } from './fidelity'
import { MECHANISM_DEMONSTRATIONS } from './mechanism-demonstrations'
import { checkOverview, CoachOverview, coachOverviewOf, OverviewCheck, OverviewCheckInput, overviewEvidenceOf, overviewForServing, presentedOf, servedGroupsHold } from './overview-fidelity'
import { Instruction, renderConcreteGame } from './render-concrete-game'
import { specializedRoleNames } from './session-envelope'

let passed = 0
function test(name: string, body: () => void): void {
    body()
    passed++
    console.log(`  ok  ${name}`)
}
console.log("the Coach Overview's agreement check (Q7) and serving the overview (stage 3D)")

const ROLE = specializedRoleNames()[0]
const none = Object.fromEntries(specializedRoleNames().map(role => [role, 0]))
const sessionAt = (players: number, keepers: number) => ({ players, lengthM: 40, widthM: 30, durationMin: 20, roles: { ...none, [ROLE]: keepers } })
const a01At = (players: number, keepers: number) => ({ kind: 'learning-goal' as const, goalId: 'A01', situationId: null, session: sessionAt(players, keepers) })
const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value))

type Game = { blockId: string; fixture: any; rendered: { instructions: Instruction[] } }
/** One build's games, each with its own Details render, and the Details a coach is served. */
function gamesOf(players: number, keepers: number, wording: ApprovedWording[] = approvedWording()): { games: Game[]; served: Instruction[] } {
    const built = buildActivityWithFixture(a01At(players, keepers))
    assert.equal(built.activity.outcome, 'served', JSON.stringify((built.activity as RefusedActivity).reasons))
    const games = ((built.fixture as any).roleBlocks.blocks as any[]).map(block => ({ blockId: block.blockId, fixture: block.fixture, rendered: renderConcreteGame(block.fixture, wording) }))
    return { games, served: (built.activity as ServedActivity).rendered.instructions }
}
/** Stage 3F: composed with one reading for everything (the extracts and his wording said whole); the PROPOSED record by default. */
const compose = (games: Game[], options: { reading?: CoverReading; wording?: ApprovedWording[]; essentials?: any } = {}): CoachOverviewDraft =>
    coachOverviewDraftOf('A01', games, undefined, { reading: options.reading, wording: options.wording, essentials: options.essentials })
const check = (draft: CoachOverviewDraft, games: Game[], served: Instruction[], options: Partial<OverviewCheckInput> = {}): OverviewCheck =>
    checkOverview({ goalId: 'A01', draft, blocks: games.map(game => ({ blockId: game.blockId, fixture: game.fixture, rendered: game.rendered.instructions })), served, ...options })
const violations = (result: OverviewCheck) => result.findings.filter(finding => finding.severity === 'VIOLATION')
const questions = (result: OverviewCheck) => [...new Set(violations(result).map(finding => finding.question))].sort()
const anyViolation = (result: OverviewCheck, question: string, includes: string) => violations(result).some(finding => finding.question === question && finding.what.includes(includes))
const assertRefused = (result: OverviewCheck, question: string, includes: string, what: string) =>
    assert.ok(result.verdict === 'FAIL' && anyViolation(result, question, includes), `${what}: expected Q${question} "${includes}" in ${JSON.stringify(violations(result).map(f => `Q${f.question} ${f.what}`), null, 1)}`)
const assertPasses = (result: OverviewCheck, what: string) => assert.equal(result.verdict, 'PASS', `${what}: ${JSON.stringify(violations(result).map(f => `Q${f.question} ${f.what}`), null, 1)}`)
/** A copy of the draft with `change` applied to every block's groups (so the blocks still agree, Q7.8, and only the change is tested). */
const everyBlock = (draft: CoachOverviewDraft, change: (groups: ScoringGroup[], block: number) => void): CoachOverviewDraft => {
    const changed = copy(draft)
    changed.scoring.blocks.forEach((block, n) => change(block.groups, n))
    return changed
}
const texts = (group: ScoringGroup) => group.sentences.map(sentence => sentence.text)
/** Every line the coach is served, group by group (polish pass P1; was: the leads, then the qualifications). */
const lines = (overview: ServedActivity['overview']) => overview!.scoring.groups.flatMap(group => group.lines)
/** Every pointer the coach is served: on a line, under a team, or once after the groups. */
const pointersIn = (overview: ServedActivity['overview']) => [...lines(overview).flatMap(line => (line.fullRule ? [line.fullRule] : [])), ...overview!.scoring.groups.flatMap(group => group.fullRules), ...overview!.scoring.fullRules]

const entryOf = (id: string): ApprovedWording => approvedWording().find(entry => entry.id === id)!
const W1 = entryOf('A01-W1')
const W2 = entryOf('A01-W2')
const W3 = entryOf('A01-W3')
const DETAILS_10 = "The building team's goalkeeper restarts play: at the start, after either team scores and whenever you decide that an attack has run its course (at a stoppage or while play is on)"
const DETAILS_14 = 'Pressing team: Score by getting the ball under control into its target zone: running it in, or passing to a teammate who receives it under control inside'
const DETAILS_16 = 'Each score is worth 1 point'
/** The BUILD PLAN's EXPECTED PRESENTATION, overview sentences 4-8 as written there. */
const OVERVIEW_4 = 'Building team: Score by carrying the ball beyond the marked line or passing to a teammate who receives it under control beyond the line.'
const OVERVIEW_5 = W3.sentence
const OVERVIEW_7 = 'Pressing team: Score by getting the ball under control into its target zone.'
const OVERVIEW_8 = 'The pressing team also scores by winning the ball inside that zone, provided it genuinely establishes possession.'
/** His second sentence of the building rule: since stage 3F the overview's statement of the build-out origin. */
const W1_S2 = "The progression must begin with the goalkeeper's build-out and occur before the building team loses possession."
/** Sentence 6 as the composer cuts it from Details 10 (stage 3E): Details 10's own words up to the bracketed aside, no word added or changed. */
const OVERVIEW_6_CUT = "The building team's goalkeeper restarts play: at the start, after either team scores and whenever you decide that an attack has run its course."
/** His illustrative building line (reply filed 22 October 2026, item 5): "illustrative wording for evaluation, not a new canonical knowledge entry". */
const HIS_BUILDING_LINE = 'The building team scores by progressing beyond the line under control.'
/**
 * A TEST-ONLY reading: the PROPOSED record's own reading of every part, handed in as a function that names no record (as in
 * overview-scoring.unit.ts). NOT his reading, and not ours to record. (Re-pointed 22 October 2026, stage 3F: was the record's two stage
 * 3E readings written out.)
 */
const READING: CoverReading = (entry, units) => recordedReading()(entry, units)

const PROD = gamesOf(12, 1)
/** The 12/1 games composed as the build composes them, with the PROPOSED readings record (stage 3E's name, kept). */
const SERVED_DRAFT = coachOverviewDraftOf('A01', PROD.games)
/**
 * Re-pointed 22 October 2026 (stage 3F): the production draft. Was the 12/1 games composed with NO reading, where his sentences were said
 * whole and counted for every field they cite; with no reading his wording now states nothing, so no group of his could be composed.
 */
const PROD_DRAFT = SERVED_DRAFT
const READ_DRAFT = compose(PROD.games, { reading: READING })
const readCheck = (draft: CoachOverviewDraft) => check(draft, PROD.games, PROD.served, { reading: READING })
/** The paths the building team's group requires under a rule (read from the composed draft's own requirement list). */
const requiredBy = (draft: CoachOverviewDraft, block: number, group: number, rule: string) => draft.scoring.blocks[block].groups[group].requirements.filter(r => r.rule === rule).map(r => r.path)
const detailsIndexOf = (game: Game, text: string) => game.rendered.instructions.findIndex(instruction => instruction.text === text)

test('T1. the A01 overview agrees with Details in both blocks and is served to coach and administrator alike', () => {
    for (const [players, keepers] of [[12, 1], [12, 2], [11, 1]] as const) {
        const what = `A01 ${players}/${keepers}`
        const admin = buildActivityForReview(a01At(players, keepers), { includeDrafts: true }) as ServedActivity
        const coach = buildActivity(a01At(players, keepers)) as ServedActivity
        const draft = admin.overviewDraft!
        assertPasses(draft.check!, what)
        assert.deepEqual(violations(draft.check!), [], what)
        // Re-pointed 24 October 2026 (C1, his reply filed 24 October 2026, items 1 and 2): a NOTE naming the rules of the partly approved
        // table still PROPOSED, and one that its words of his are read by readings he approved; none says a PROPOSED reading. Was: a NOTE on
        // the PROPOSED essentials table and one on the PROPOSED readings record.
        assert.ok(draft.check!.findings.some(f => f.severity === 'NOTE' && f.what.includes('partly approved essentials table: he approved EXCLUSION_CONDITION, ALSO_COUNTS_EXCLUSION; these rules remain PROPOSED: EVERY_WAY_TO_SCORE')), what)
        assert.ok(draft.check!.findings.some(f => f.severity === 'NOTE' && f.question === '7.3' && f.what.includes('by readings of his wording he approved (docs/audits/approved-wording-readings.json)')), what)
        assert.ok(!draft.check!.findings.some(f => f.what.includes('by a PROPOSED reading of his wording')), what)
        assert.equal(draft.served, true, what)
        assert.ok(admin.overview && coach.overview, `${what}: served`)
        assert.deepEqual(coach.overview, admin.overview, `${what}: the coach and the administrator are served the same overview`)
        assert.deepEqual(coach.rendered, admin.rendered, what)
        // What is served is what was checked: the first block's words, the same in both (Q7.8).
        const [first, second] = draft.check!.read
        assert.deepEqual(first.groups.map(g => g.sentences.map(s => s.text)), second.groups.map(g => g.sentences.map(s => s.text)), what)
        // Re-pointed 22 October 2026 (stage 3F, his reply filed 23 October 2026, items 4 and 6): each team's line saying how it scores, both
        // first; then his second building sentence (the origin, which his eligibility sentence does not state), his eligibility sentence and
        // the regain clause; the restart moments are left to Coach Details behind a pointer, and "Each score is worth 1 point" is pointed to
        // once. Was (stage 3E): per team, OVERVIEW_4, OVERVIEW_5, OVERVIEW_6_CUT; OVERVIEW_7, OVERVIEW_8.
        // Re-pointed 22 October 2026 (polish pass P1, the 3F and Stage 4 reviews): one group per team, in the game sentence's order, under
        // its DRAFT heading; its line first, then its own qualifications ("The progression must begin..." and W3 under the building team,
        // the regain clause's "that zone" right after the pressing team's line naming it); the restart moments behind the building team's
        // own pointer; "Each score is worth 1 point", every team's, once after the groups. Was (stage 3F): both leads, then the three
        // qualifications, then both pointers.
        assert.deepEqual(
            admin.overview!.scoring.groups.map(group => [group.label, group.lines.map(line => line.text), group.fullRules.map(pointer => [pointer.section, pointer.text])]),
            [
                ['Building team', [OVERVIEW_4, W1_S2, OVERVIEW_5], [['How it works', DETAILS_10]]],
                ['Pressing team', [OVERVIEW_7, OVERVIEW_8], []],
            ],
            what,
        )
        assert.deepEqual(admin.overview!.scoring.fullRules.map(pointer => [pointer.section, pointer.text]), [['How to score', DETAILS_16]], what)
        assert.ok(admin.overview!.game.indexOf('building team') < admin.overview!.game.indexOf('pressing team'), `${what}: the game sentence names the teams in the groups' order`)
        assert.deepEqual(first.groups.map(group => group.sentences.map(sentence => sentence.form)), [['EXTRACT', 'EXTRACT', 'WHOLE'], ['SHORTENING', 'EXTRACT']], what)
        assert.deepEqual(lines(admin.overview).map(line => line.text).sort(), first.groups.flatMap(g => g.sentences.map(s => s.text)).sort(), what)
    }
    // With a TEST-ONLY reading of the same covers (naming no record): the same words, with their statuses; it agrees under that reading.
    assertPasses(readCheck(READ_DRAFT), 'TEST-ONLY reading')
    for (const block of READ_DRAFT.scoring.blocks) {
        const [building, pressing] = block.groups
        assert.deepEqual(texts(building), [OVERVIEW_4, W1_S2, OVERVIEW_5])
        assert.deepEqual(texts(pressing), [OVERVIEW_7, OVERVIEW_8])
        assert.deepEqual([...building.sentences, ...pressing.sentences].map(s => s.wording), ['DERIVED_FROM_APPROVED', 'DERIVED_FROM_APPROVED', 'APPROVED', 'DRAFT', 'DERIVED_FROM_APPROVED'])
        assert.deepEqual([...building.sentences, ...pressing.sentences].map(s => s.place), ['LEAD', 'QUALIFICATION', 'QUALIFICATION', 'LEAD', 'QUALIFICATION'])
        // The restart moments: no sentence of the overview; a pointer to Details 10.
        assert.ok(!texts(building).includes(OVERVIEW_6_CUT) && building.fullRules.some(pointer => pointer.text === DETAILS_10))
    }
})

test("T2. without his eligibility sentence the building team's eligibility is unstated, and refused, even with a pointer to it", () => {
    // Re-pointed 22 October 2026 (stage 3F): his second building sentence states the origin, so only the eligibility goes unstated. Was: the
    // bound and the origin both (his eligibility sentence was counted for the origin it cites).
    const withoutW3 = everyBlock(READ_DRAFT, (groups, n) => {
        const building = groups[0]
        building.sentences = building.sentences.filter(sentence => sentence.text !== W3.sentence)
        const game = PROD.games[n]
        const pointer: DetailsPointer = {
            blockIndex: detailsIndexOf(game, W3.sentence),
            section: 'How to score',
            text: W3.sentence,
            label: FULL_RULE_LABEL,
            labelStatus: 'DRAFT',
            because: ['DETAIL_LEFT_OUT'],
            paths: requiredBy(READ_DRAFT, n, 0, 'BOUNDED_CREDIT'),
        }
        building.fullRules.push(pointer)
    })
    assert.equal(withoutW3.scoring.blocks[0].groups[0].sentences[0].text, OVERVIEW_4)
    const result = readCheck(withoutW3)
    assertRefused(result, '7.4', 'rule BOUNDED_CREDIT) is stated by no sentence of the building team\'s group: a pointer never excuses it', 'bound')
    assert.ok(!anyViolation(result, '7.4', 'rule ORIGIN_CONDITION)'), 'his second sentence states the origin')
    // The pointer itself resolves and cites what it points for: only the unstated ESSENTIAL field refuses it.
    assert.deepEqual(questions(result), ['7.4'])
})

test('T3. his illustrative building line, not an extract, is DRAFT; marked derived it is refused; without his other sentences it is refused', () => {
    const his = (wording: ScoringSentence['wording'], keepOthers: boolean) =>
        everyBlock(READ_DRAFT, groups => {
            const building = groups[0]
            const extract = building.sentences[0]
            Object.assign(extract, {
                text: HIS_BUILDING_LINE,
                wording,
                source: wording === 'DRAFT' ? null : { kind: 'APPROVED_ENTRY', id: W1.id },
                extractId: wording === 'DRAFT' ? null : extract.extractId,
                form: 'SHORTENING',
                fullRule: null,
            })
            if (!keepOthers) building.sentences = building.sentences.filter(sentence => sentence.text !== W3.sentence && sentence.text !== W1_S2)
        })
    // As DRAFT beside his other sentences: its status stands (no Q7.3 finding), and it is read as stating nothing checkable, so the
    // building team's way to score is not shown by it and the group is refused for that.
    const draft = readCheck(his('DRAFT', true))
    assert.ok(!violations(draft).some(f => f.question === '7.3'), JSON.stringify(violations(draft)))
    assert.ok(draft.findings.some(f => f.severity === 'NOTE' && f.what.includes(HIS_BUILDING_LINE) && f.what.includes('read as stating nothing')))
    assertRefused(draft, '7.4', 'rule PROGRESSION_CONDITION) is stated by no sentence', 'his line states no progression it can be shown to')
    assert.ok(!anyViolation(draft, '7.4', 'rule BOUNDED_CREDIT)'), 'with his eligibility sentence the bound is stated')
    // Marked DERIVED_FROM_APPROVED: refused, it is not the extract it names.
    assertRefused(readCheck(his('DERIVED_FROM_APPROVED', true)), '7.3', 'is marked DERIVED_FROM_APPROVED and its words are not its extract', 'his line as derived')
    // Without his eligibility and origin sentences: refused, the bound and the origin unstated as well.
    const alone = readCheck(his('DRAFT', false))
    assertRefused(alone, '7.4', 'rule BOUNDED_CREDIT) is stated by no sentence', 'alone, the bound')
    assertRefused(alone, '7.4', 'rule ORIGIN_CONDITION) is stated by no sentence', 'alone, the origin')
})

test('T4. a pressing group omitting the regain inside the zone is refused: a way to score is missing', () => {
    const result = check(
        everyBlock(PROD_DRAFT, groups => {
            groups[1].sentences = groups[1].sentences.filter(sentence => sentence.text !== OVERVIEW_8)
        }),
        PROD.games,
        PROD.served,
    )
    assertRefused(result, '7.4', 'rule ALSO_COUNTS_TEAM_AND_TRIGGER) is stated by no sentence of the pressing team', 'V28/V29')
    assertRefused(result, '7.4', 'rule ALSO_COUNTS_CONTROL) is stated by no sentence', 'V30')
    assertRefused(result, '7.5', 'alsoCounts', 'the regain way')
    // Stage 3F: the contested-touch exclusion follows from "genuinely establishes possession", now unstated, so it is material and no
    // pointer excuses it. (Re-pointed: was "left out with no pointer".)
    assertRefused(result, '7.4', 'rule ALSO_COUNTS_EXCLUSION) is material in the pressing team\'s group: it follows from ALSO_COUNTS_CONTROL', 'V31 material')
})

test("T5. counts that are not the Players sentence's are refused: another session's games, and a count changed in place", () => {
    // The 12-player overview held to the 11-player games: the building team has 5 outfield players there, and 11 players in all.
    const eleven = gamesOf(11, 1)
    const across = check(PROD_DRAFT, eleven.games, eleven.served)
    assertRefused(across, '7.6', "the building team's counts as the Players sentence does", '12 against 11')
    assertRefused(across, '7.2', 'binds 12 to envelope.players', 'the players parameter')
    // The pressing team's "5 outfield players" said as 6 in place: Details bind 6 at that path (for the building team), so only Q7.6, which
    // reads each team's counts under its role, refuses it.
    const changed = copy(PROD_DRAFT)
    for (const block of changed.blocks) {
        const game = block.game!
        const at = game.parts.findIndex(p => p.text === '5 outfield players')
        assert.ok(at > 0, game.text)
        game.parts[at] = { ...game.parts[at], text: '6 outfield players', quantities: [6], bindings: [{ ...game.parts[at].bindings[0], quantity: 6 }] }
        game.text = game.parts.map(p => p.text).join('')
        game.quantities = game.parts.flatMap(p => p.quantities)
    }
    const inPlace = check(changed, PROD.games, PROD.served)
    assertRefused(inPlace, '7.6', "the pressing team's counts as the Players sentence does", 'pressing 6')
    assert.ok(!violations(inPlace).some(f => f.question === '7.2'), 'Q7.2 alone cannot see it')
    // At 2 of the role, "other players": the goalkeeper-2 overview agrees with its own games and is refused against the goalkeeper-1 games.
    const two = gamesOf(12, 2)
    assertPasses(check(compose(two.games), two.games, two.served), '12/2 own games')
    assertRefused(check(compose(two.games), PROD.games, PROD.served), '7.6', 'the Players sentence', '12/2 against 12/1')
})

test('T6. "halfway" with the line at 15 m of 40 is refused; the moved build\'s own overview is served without it', () => {
    const offsetFifteen = (contracts: LoadedContract[]) => {
        const item: any = contracts.find(contract => contract.contractId === 'provisional:A01-R1')!.items.find(entry => entry.itemId === 'A01-R1-S5-1')
        item.value = { ...item.value, offsetM: { from: 15, to: 15 }, asAuthored: "TEST-ONLY 15 m from the building team's end line" }
    }
    const moved = buildActivityUnderAuthorizationRecords(a01At(12, 1), learningGoalAuthorizations(), { alter: offsetFifteen, review: { includeDrafts: true } })
    const activity = moved.activity as ServedActivity
    assert.equal(activity.outcome, 'served')
    assertPasses(activity.overviewDraft!.check!, 'moved')
    assert.ok(activity.overview && !activity.overview.game.includes('halfway'), activity.overview?.game)
    const games = ((moved.fixture as any).roleBlocks.blocks as any[]).map(block => ({ blockId: block.blockId, fixture: block.fixture, rendered: renderConcreteGame(block.fixture) }))
    const result = check(PROD_DRAFT, games, activity.rendered.instructions)
    assertRefused(result, '7.2', 'says "halfway" from 20 at', 'halfway at 15 m')
    // The term's own rule: values that do not hold it are refused even where Details bind them (TEST-ONLY: the length's value changed).
    const broken = copy(PROD_DRAFT)
    for (const block of broken.blocks) block.game!.derivedTerms[0].values[1] = { ...block.game!.derivedTerms[0].values[1], quantity: 50 }
    assertRefused(check(broken, PROD.games, PROD.served), '7.2', 'do not hold its rule', 'the rule')
    // Said with no term declared: refused.
    const undeclared = copy(PROD_DRAFT)
    for (const block of undeclared.blocks) block.game!.derivedTerms = []
    assertRefused(check(undeclared, PROD.games, PROD.served), '7.2', 'says "halfway" and declares no derived term', 'undeclared')
})

test('T7 and T8. an extract with one changed word, or whose keeps and leaves do not partition the covers, is refused', () => {
    const changeExtract = (change: (extract: any, sentence: ScoringSentence) => void) => {
        const draft = copy(READ_DRAFT)
        draft.scoring.blocks.forEach((block, n) => {
            const sentence = block.groups[0].sentences[0]
            const extract = draft.extracts[n].extracts.find(entry => entry.id === sentence.extractId)!
            change(extract, sentence)
        })
        return readCheck(draft)
    }
    assertRefused(
        changeExtract((extract, sentence) => {
            extract.text = extract.text.replace('carrying', 'running')
            sentence.text = extract.text
        }),
        '7.3',
        'is not usable',
        'T7 one changed word',
    )
    assertRefused(
        changeExtract(extract => {
            extract.leaves = extract.leaves.slice(1)
        }),
        '7.3',
        'do not partition',
        'T8 not a partition',
    )
    // And an extract claiming a reading the check is not given is refused. Re-pointed 22 October 2026 (stage 3E): the check's own default is
    // now the PROPOSED record, so "no reading" is handed explicitly; and under the record, the TEST-ONLY extracts (same covers, naming no
    // record) are refused too: where a reading is recorded is the reading's own. Was: refused under the default, which recorded none.
    assertRefused(check(READ_DRAFT, PROD.games, PROD.served, { reading: NO_RECORDED_READING }), '7.3', 'is not usable', 'no reading recorded')
    assertRefused(check(READ_DRAFT, PROD.games, PROD.served), '7.3', 'it says its reading is recorded at null', 'the record is the reading\'s own')
    // Stage 3F: so is his wording said whole naming no record where the record reads it.
    assertRefused(check(READ_DRAFT, PROD.games, PROD.served), '7.3', 'names the reading null, and his wording said whole is read by', 'his whole sentence under the record')
    assertPasses(check(SERVED_DRAFT, PROD.games, PROD.served), 'the production draft under the PROPOSED record')
})

test('T9. a pointer to a Details sentence the block does not say is refused', () => {
    // Re-pointed 22 October 2026 (stage 3F): the group's first pointer is now to the restart moments (Details 10); the value's is chosen by
    // its words. Was: the group's first pointer, the value's.
    const valuePointer = (group: ScoringGroup) => group.fullRules.find(pointer => pointer.text === DETAILS_16)!
    const result = check(
        everyBlock(PROD_DRAFT, groups => {
            Object.assign(valuePointer(groups[0]), { text: 'TEST-ONLY a sentence no Details say' })
        }),
        PROD.games,
        PROD.served,
    )
    assertRefused(result, '7.4', 'which no Details sentence of this block says', 'missing target')
    assertRefused(result, '7.4', 'rule SCORE_VALUE) is left out', 'the value is then pointed to by nothing')
    // A pointer whose label is not the "full rule" label, or that points for a field its sentence does not cite.
    const relabelled = check(everyBlock(PROD_DRAFT, groups => Object.assign(valuePointer(groups[0]), { label: 'TEST-ONLY' })), PROD.games, PROD.served)
    assertRefused(relabelled, '7.4', 'is labelled "TEST-ONLY"', 'label')
    const wrongField = check(everyBlock(PROD_DRAFT, groups => valuePointer(groups[0]).paths.push('TEST-ONLY.path')), PROD.games, PROD.served)
    assertRefused(wrongField, '7.4', 'points for TEST-ONLY.path', 'field')
})

test('T10. the regain exclusion left out with no pointer is refused: no silent omission', () => {
    const pressing = READ_DRAFT.scoring.blocks[0].groups[1]
    assert.ok(pressing.sentences[1].fullRule, 'the extract carries its pointer to his whole sentence')
    const result = readCheck(
        everyBlock(READ_DRAFT, groups => {
            groups[1].sentences[1].fullRule = null
            groups[1].fullRules = groups[1].fullRules.filter(pointer => pointer.text !== W2.sentence)
        }),
    )
    assertRefused(result, '7.4', 'rule ALSO_COUNTS_EXCLUSION) is left out of the pressing team\'s group with no "full rule" pointer', 'V31')
})

test('T11. an overview path no Details sentence cites is refused', () => {
    const draft = copy(PROD_DRAFT)
    for (const block of draft.blocks) {
        block.game!.parts[0].from.push('TEST-ONLY.path')
        block.game!.from.push('TEST-ONLY.path')
    }
    assertRefused(check(draft, PROD.games, PROD.served), '7.1', 'cites TEST-ONLY.path, which no Details sentence of this block cites', 'game')
    const scoring = everyBlock(PROD_DRAFT, groups => groups[1].sentences[1].from.push('TEST-ONLY.path'))
    assertRefused(check(scoring, PROD.games, PROD.served), '7.1', 'cites TEST-ONLY.path', 'scoring')
})

test('T12. APPROVED with paraphrased words is refused, and DERIVED from a draft source is refused', () => {
    const paraphrased = everyBlock(PROD_DRAFT, groups => {
        const w3 = groups[0].sentences.find(sentence => sentence.text === W3.sentence)!
        w3.text = w3.text.replace('cannot score again', 'may not score again')
    })
    assertRefused(check(paraphrased, PROD.games, PROD.served), '7.3', 'is marked APPROVED and is not his approved wording said whole', 'paraphrase')
    // Re-pointed 22 October 2026 (stage 3F): the DRAFT sentence marked derived is the pressing team's cut (the restart cut is no longer said).
    const fromDraft = everyBlock(PROD_DRAFT, groups => {
        const cut = groups[1].sentences.find(sentence => sentence.text === OVERVIEW_7)!
        Object.assign(cut, { wording: 'DERIVED_FROM_APPROVED', source: { kind: 'APPROVED_ENTRY', id: W2.id }, extractId: null })
    })
    assertRefused(check(fromDraft, PROD.games, PROD.served), '7.3', 'is marked DERIVED_FROM_APPROVED and it names no extract generated for this block', 'derived from a draft')
    // His wording marked DRAFT is a wrong status too; a DRAFT naming an approved source is incoherent.
    const underClaim = everyBlock(PROD_DRAFT, groups => Object.assign(groups[0].sentences.find(sentence => sentence.text === W3.sentence)!, { wording: 'DRAFT', source: null, reading: null }))
    const refused = check(underClaim, PROD.games, PROD.served)
    assertRefused(refused, '7.3', 'is his approved wording and is marked DRAFT', 'under-claim')
    // Stage 3F: and, marked DRAFT, it states nothing: its meaning is its reading's, so the eligibility goes unstated.
    assertRefused(refused, '7.4', 'rule BOUNDED_CREDIT) is stated by no sentence', 'under-claimed, it states nothing')
})

test('T13. block texts differing, nothing told apart by block, are refused (Q7.8)', () => {
    const draft = copy(PROD_DRAFT)
    const game = draft.blocks[1].game!
    const last = game.parts.length - 1
    game.parts[last] = { ...game.parts[last], text: game.parts[last].text.replace("at the building team's end", "at its own end") }
    game.text = game.parts.map(p => p.text).join('')
    assertRefused(check(draft, PROD.games, PROD.served), '7.8', 'says other words in block', 'game')
    const scoring = copy(PROD_DRAFT)
    scoring.scoring.blocks[1].groups[0].sentences.reverse()
    assertRefused(check(scoring, PROD.games, PROD.served), '7.8', 'says other words in block', 'scoring order')
})

test('T14. a purpose other than the Coach Definition, or citing a context he recorded nothing for, is refused', () => {
    const other = copy(PROD_DRAFT)
    other.purpose!.text = `${other.purpose!.text} TEST-ONLY`
    assertRefused(check(other, PROD.games, PROD.served), '7.1', 'is not the Learning Goal\'s "Coach Definition", byte for byte', 'text')
    const context = copy(PROD_DRAFT)
    ;(context.purpose as any).source = { kind: 'KNOWLEDGE', file: 'back/src/system/sport-module/rpc-library.rc1.json', table: 'statements', id: 'TEST-ONLY', column: 'text' }
    assertRefused(check(context, PROD.games, PROD.served), '7.1', 'only the Learning Goal\'s "Coach Definition" is a recorded source of one', 'source')
    // No purpose for a Learning Goal: the overview is incomplete; a demonstration given one is refused too.
    const missing = copy(PROD_DRAFT)
    missing.purpose = null
    assertRefused(check(missing, PROD.games, PROD.served), '7.0', 'states no learning purpose', 'missing')
    assertRefused(check(PROD_DRAFT, PROD.games, PROD.served, { goalId: null }), '7.1', 'claims no Learning Goal', 'demonstration with a purpose')
    // The definition read is the planning model's: another row reader's text is not the purpose served.
    assertRefused(check(PROD_DRAFT, PROD.games, PROD.served, { lookup: () => ({ 'Coach Definition': 'TEST-ONLY' }) }), '7.1', 'byte for byte', 'lookup')
})

test('T15. the demonstrations pass with no bounded roles and no learning purpose; the refused one has no overview', () => {
    let served = 0
    for (const demonstration of MECHANISM_DEMONSTRATIONS) {
        for (const keepers of [0, 1, 2]) {
            const request = { kind: 'mechanism-demonstration' as const, demonstrationId: demonstration.id, session: sessionAt(12, keepers) }
            const admin = buildActivityForReview(request, { includeDrafts: true })
            const coach = buildActivity(request)
            if (admin.outcome !== 'served') {
                assert.equal(demonstration.id, 'pass-combination-gate')
                for (const answer of [admin, coach]) assert.ok(!('overview' in answer) && !('overviewDraft' in answer), demonstration.id)
                continue
            }
            served++
            const draft = (admin as ServedActivity).overviewDraft!
            assertPasses(draft.check!, `${demonstration.id} ${keepers}`)
            const overview = (admin as ServedActivity).overview!
            assert.deepEqual((coach as ServedActivity).overview, overview)
            assert.equal(overview.purpose, null, 'a demonstration claims no goal, so it has no learning purpose')
            // Re-pointed 22 October 2026 (polish pass P1): one group, "Each team", whose line says how every team scores (stage 3F: one lead
            // line; before it, one group).
            assert.equal(overview.scoring.groups.length, 1)
            assert.equal(overview.scoring.groups[0].label, 'Each team')
            assert.deepEqual(overview.scoring.groups[0].lines[0].text, 'A team scores 1 point by getting the ball across the line it is attacking.')
            assert.equal(draft.scoring.blocks[0].groups[0].group, 'EVERY_TEAM')
            assert.equal(draft.presented!.purpose, null)
        }
    }
    assert.equal(served, 6)
})

test('T16. an obligation word in a draft is refused (Q7.7); the Coach Communication Standard is a note', () => {
    // Re-pointed 22 October 2026 (stage 3F): the DRAFT sentence copied is the pressing team's cut (the building team's group holds no DRAFT
    // sentence since the restart cut left it). Was: the restart cut.
    const draftSentence = (groups: ScoringGroup[]): ScoringSentence => ({ ...copy(groups[1].sentences[0]), place: 'QUALIFICATION', fullRule: null })
    const must = everyBlock(PROD_DRAFT, groups => {
        groups[0].sentences.push({ ...draftSentence(groups), text: 'The building team must start every attack from the back.', form: 'SHORTENING', bindings: [] })
    })
    assertRefused(check(must, PROD.games, PROD.served), '7.7', 'states a player obligation or an order of actions in words that are not his', 'must')
    const aimTo = everyBlock(PROD_DRAFT, groups => {
        groups[1].sentences.push({ ...draftSentence(groups), text: 'Teams aim to keep the ball.', form: 'SHORTENING', bindings: [] })
    })
    const noted = check(aimTo, PROD.games, PROD.served)
    assert.ok(noted.findings.some(f => f.severity === 'NOTE' && f.question === '7.7' && f.what.includes('Teams aim to')), JSON.stringify(noted.findings))
    // His own approved words with "cannot" and "until" pass (approved wording said whole).
    assertPasses(check(PROD_DRAFT, PROD.games, PROD.served), 'his words')
})

test('T17. the restart moments left out with no pointer are refused; said, where the table made them ESSENTIAL, their omission is refused', () => {
    // Re-pointed 22 October 2026 (stage 3F, his reply filed 23 October 2026, item 6): the restart moments are restart procedure (DETAIL, the
    // PROPOSED table), so the overview points to Details 10 for them, and dropping that pointer is a silent omission. Was: omitting the
    // restart cut, ESSENTIAL.
    const result = check(
        everyBlock(PROD_DRAFT, groups => {
            groups[0].fullRules = groups[0].fullRules.filter(pointer => pointer.text !== DETAILS_10)
        }),
        PROD.games,
        PROD.served,
    )
    assertRefused(result, '7.4', 'rule BOUNDED_EPISODE_OPENER) is left out of the building team\'s group with no "full rule" pointer', 'restart moments')
    // Under a TEST-ONLY table where they are ESSENTIAL (their class before 3F), the composer says the restart cut, and omitting it is refused.
    const opener = essentialsTable()
    opener.table!.rules.find(rule => rule.id === 'BOUNDED_EPISODE_OPENER')!.class = 'ESSENTIAL'
    const withCut = compose(PROD.games, { essentials: opener })
    assert.ok(texts(withCut.scoring.blocks[0].groups[0]).includes(OVERVIEW_6_CUT))
    assertPasses(check(withCut, PROD.games, PROD.served, { essentials: opener }), 'ESSENTIAL restart moments, said')
    const omitted = everyBlock(withCut, groups => (groups[0].sentences = groups[0].sentences.filter(sentence => sentence.text !== OVERVIEW_6_CUT)))
    assertRefused(check(omitted, PROD.games, PROD.served, { essentials: opener }), '7.4', 'rule BOUNDED_EPISODE_OPENER) is stated by no sentence of the building team', 'ESSENTIAL, omitted')
})

test('the pressing group keeps V30 through the W2 extract; an extract read as not keeping it is refused', () => {
    const control = requiredBy(READ_DRAFT, 0, 1, 'ALSO_COUNTS_CONTROL')
    assert.equal(control.length, 1)
    const result = readCheck(READ_DRAFT)
    for (const block of result.read) {
        const pressing = block.groups.find(group => group.group === READ_DRAFT.scoring.blocks[0].groups[1].group)!
        const extract = pressing.sentences.find(sentence => sentence.text === OVERVIEW_8)!
        assert.equal(extract.form, 'EXTRACT')
        assert.ok(extract.states.some(path => path.endsWith('.control')), JSON.stringify(extract.states))
    }
    // A TEST-ONLY reading in which the clause keeps only the team and trigger: the composer says his regain sentence whole instead ...
    const narrow: CoverReading = (entry, units) => (entry.id === W2.id && units.length === 1 && units[0].part === 'LEADING_CLAUSE' ? [0, 1] : READING(entry, units))
    const composed = compose(PROD.games, { reading: narrow })
    // (Re-pointed 22 October 2026, stage 3E: Details 14 is cut before its elaboration, fix (a). Was: said whole.)
    assert.deepEqual(texts(composed.scoring.blocks[0].groups[1]), [OVERVIEW_7, W2.sentence])
    assertPasses(check(composed, PROD.games, PROD.served, { reading: narrow }), 'narrow reading')
    // ... and the clause standing alone under it (forged, TEST-ONLY) is refused: V30 (ESSENTIAL in the PROPOSED table) unstated.
    const alone = everyBlock(composed, (groups, n) => {
        const clause = composed.extracts[n].extracts.find(extract => extract.id === `${W2.id}:c1`)!
        assert.deepEqual(clause.keeps.map(ref => ref.index), [0, 1])
        const whole = groups[1].sentences.findIndex(sentence => sentence.text === W2.sentence)
        const game = PROD.games[n]
        groups[1].sentences[whole] = {
            ...groups[1].sentences[whole],
            text: clause.text,
            wording: 'DERIVED_FROM_APPROVED',
            source: { kind: 'APPROVED_ENTRY', id: W2.id },
            chosenBy: 'SHORTEST_EXTRACT',
            form: 'EXTRACT',
            extractId: clause.id,
            from: [...clause.from],
            bindings: [],
            reading: null,
            fullRule: { blockIndex: detailsIndexOf(game, W2.sentence), section: 'How to score', text: W2.sentence, label: FULL_RULE_LABEL, labelStatus: 'DRAFT', because: ['DETAIL_LEFT_OUT'], paths: requiredBy(READ_DRAFT, n, 1, 'ALSO_COUNTS_EXCLUSION') },
        }
    })
    const refused = check(alone, PROD.games, PROD.served, { reading: narrow })
    assertRefused(refused, '7.4', 'rule ALSO_COUNTS_CONTROL) is stated by no sentence of the pressing team', 'V30 unstated')
    assert.deepEqual(questions(refused), ['7.4'])
    // An extract claiming more than the reading it is checked under gives it: refused as unusable.
    assertRefused(check(READ_DRAFT, PROD.games, PROD.served, { reading: narrow }), '7.3', 'is not usable', 'extract claiming V30 under the narrow reading')
})

test('the overview is identical in both blocks (Q7.8), shown once; a refused activity has no overview', () => {
    const admin = buildActivityForReview(a01At(12, 1), { includeDrafts: true }) as ServedActivity
    const draft = admin.overviewDraft!
    assert.equal(draft.blocks.length, 2)
    assert.equal(draft.blocks[0].game!.text, draft.blocks[1].game!.text)
    assert.notDeepEqual(draft.blocks[0].game!.from, draft.blocks[1].game!.from, 'each block cites its own targets')
    assert.equal(draft.scoring.sameTextInEveryBlock, true)
    assert.ok(!violations(draft.check!).some(f => f.question === '7.8'))
    assert.ok(!('blocks' in admin.overview!), 'one overview, nothing told apart by block')
    // Refused: at the session (no goalkeeper), for a coach and an administrator.
    for (const answer of [buildActivity(a01At(12, 0)), buildActivityForReview(a01At(12, 0), { includeDrafts: true })]) {
        assert.equal(answer.outcome, 'refused')
        assert.ok(!('overview' in answer) && !('overviewDraft' in answer))
    }
    const stored: any = { _id: 'TEST-ONLY', createdBy: 'TEST-ONLY', playerCount: 12, fieldLength: '40', fieldWidth: '30', specializedRoles: { ...none } }
    const refused = reviewActivity(stored, { learningGoalId: 'A01', durationMin: 20 }, { includeDrafts: true })
    assert.ok(refused.outcome === 'refused' && !('overview' in refused))
})

test('an overview failure withholds only the overview: the activity is served exactly as without it', () => {
    // On the real chain: the Learning Goal's definition emptied in memory (TEST-ONLY), restored whatever happens.
    const production = buildActivityForReview(a01At(12, 1), { includeDrafts: true }) as ServedActivity
    const row: any = sessionPlanningModel.learningGoal('A01')
    const kept = row['Coach Definition']
    let emptied: ServedActivity
    let coach: ServedActivity
    try {
        row['Coach Definition'] = ''
        emptied = buildActivityForReview(a01At(12, 1), { includeDrafts: true }) as ServedActivity
        coach = buildActivity(a01At(12, 1)) as ServedActivity
    } finally {
        row['Coach Definition'] = kept
    }
    assert.equal(sessionPlanningModel.learningGoal('A01')!['Coach Definition'], kept, 'restored')
    for (const activity of [emptied, coach]) {
        assert.equal(activity.outcome, 'served')
        assert.deepEqual(activity.rendered, production.rendered)
        assert.deepEqual(activity.integrity, production.integrity)
        assert.ok(!('overview' in activity), 'the overview is withheld')
    }
    assert.equal(emptied.overviewDraft!.served, false)
    assertRefused(emptied.overviewDraft!.check!, '7.0', 'states no learning purpose', 'emptied definition')
    // The administrator's evidence carries the reasons.
    assert.equal(emptied.evidence!.overview!.served, false)
    assert.ok(emptied.evidence!.overview!.findings.some(f => f.what.includes('states no learning purpose')))
    // An unusable table, or extracts that cannot be generated: withheld, with why; nothing thrown.
    const unusable = overviewForServing({ goalId: 'A01', games: PROD.games, served: PROD.served, options: { essentials: essentialsLoadOf({ status: 'APPROVED' }) } })
    assert.equal(unusable.overview, null)
    assert.ok(anyViolation(unusable.draft.check!, '7.0', 'the essentials table cannot be used'))
    // Stage 3F (the 3E review's bookkeeping item): the evidence carries the table's why.
    // Re-pointed 24 October 2026 (C1: approval is per rule, so a table with no rules is refused for that). Was: "it says APPROVED and
    // carries no approvedBy".
    assert.ok(unusable.evidence.table.why && unusable.evidence.table.why.includes('it has no rules'), JSON.stringify(unusable.evidence.table))
    const throwing = overviewForServing({
        goalId: 'A01',
        games: PROD.games,
        served: PROD.served,
        options: {
            extractsOf: () => {
                throw new Error('TEST-ONLY')
            },
        },
    })
    assert.equal(throwing.overview, null)
    assert.ok(anyViolation(throwing.draft.check!, '7.0', 'TEST-ONLY'))
})

test("the restart sentence rendered as ONE part (TEST-ONLY, the 3C review's probe) is never cut, and a forged cut is refused", () => {
    // Re-pointed 22 October 2026 (stage 3F): the restart moments are DETAIL in the PROPOSED table, so the probe runs under a TEST-ONLY table
    // making them ESSENTIAL (their class when the probe was written). Details 10's words and citations as ONE part: the elaboration cut would
    // keep "restarts play" and drop every restart moment.
    const opener = essentialsTable()
    opener.table!.rules.find(rule => rule.id === 'BOUNDED_EPISODE_OPENER')!.class = 'ESSENTIAL'
    const games = PROD.games.map(game => ({
        ...game,
        rendered: {
            ...game.rendered,
            instructions: game.rendered.instructions.map(instruction =>
                instruction.text === DETAILS_10 ? { ...instruction, parts: [{ text: instruction.text, status: instruction.status, from: [...instruction.from], quantities: [], bindings: [] }] } : instruction,
            ),
        },
    }))
    const draft = compose(games, { essentials: opener })
    for (const block of draft.scoring.blocks) assert.deepEqual(texts(block.groups[0]), [OVERVIEW_4, W1_S2, W3.sentence, `${DETAILS_10}.`])
    assertPasses(check(draft, games, PROD.served, { essentials: opener }), 'one part, said whole')
    // A forged group using the cut, claiming what Details 10 cites: refused (its kept words cite nothing whole; the moments are unstated).
    const at = (group: ScoringGroup) => group.sentences.findIndex(sentence => sentence.text === `${DETAILS_10}.`)
    const forged = everyBlock(draft, groups => Object.assign(groups[0].sentences[at(groups[0])], { text: "The building team's goalkeeper restarts play.", form: 'SHORTENING' }))
    const result = check(forged, games, PROD.served, { essentials: opener })
    assertRefused(result, '7.4', 'rule BOUNDED_EPISODE_OPENER) is stated by no sentence', 'forged cut')
    assertRefused(result, '7.1', 'is a cut of a Details sentence and cites', 'its citations')
})

test('the coach receives words and "full rule" pointers only; every pointer leads to exactly one served Details sentence', () => {
    const stored: any = { _id: 'TEST-ONLY', createdBy: 'TEST-ONLY', playerCount: 12, fieldLength: '40', fieldWidth: '30', specializedRoles: { ...none, [ROLE]: 1 } }
    const coach = reviewActivity(stored, { learningGoalId: 'A01', durationMin: 20 }) as ServedActivity
    const admin = reviewActivity(stored, { learningGoalId: 'A01', durationMin: 20 }, { includeDrafts: true }) as ServedActivity
    assert.ok(!('overviewDraft' in coach) && !('evidence' in coach))
    const overview = coach.overview!
    assert.deepEqual(Object.keys(overview).sort(), ['game', 'parameters', 'purpose', 'scoring'])
    const keysIn = (value: unknown): string[] => (Array.isArray(value) ? value.flatMap(keysIn) : value && typeof value === 'object' ? Object.entries(value).flatMap(([key, inner]) => [key, ...keysIn(inner)]) : [])
    // Re-pointed 22 October 2026 (polish pass P1): the scoring is one group per team (its heading, its lines, its pointers) and the pointers
    // every team's group has. Was (stage 3F): its lead lines, its qualifications and its pointers; before it, groups of sentences.
    assert.deepEqual([...new Set(keysIn(overview))].sort(), ['fullRule', 'fullRules', 'game', 'groups', 'label', 'lines', 'parameters', 'purpose', 'scoring', 'section', 'text'])
    const json = JSON.stringify(overview)
    for (const word of ['APPROVED', 'DRAFT', 'DERIVED', 'PROPOSED', 'from', 'binding', 'c:', 'LEAD', 'QUALIFICATION', 'BUILDING', 'PRESSING', 'EVERY_TEAM']) assert.ok(!json.includes(`"${word}`) && !json.includes(`${word}"`), word)
    const pointers = pointersIn(overview)
    assert.ok(pointers.length > 0)
    for (const pointer of pointers) {
        assert.equal(pointer.label, FULL_RULE_LABEL)
        assert.equal(coach.rendered.instructions.filter(instruction => instruction.section === pointer.section && instruction.text === pointer.text).length, 1, pointer.text)
    }
    // Each pointer once: "Each score is worth 1 point" is pointed to from both teams' groups and served once.
    assert.equal(new Set(pointers.map(pointer => `${pointer.section}|${pointer.text}`)).size, pointers.length)
    // The administrator sees the same overview, with each sentence's status in the draft (never on the coach's). Re-pointed 22 October 2026
    // (stage 3F): his second building sentence is an extract, and his eligibility sentence said whole names the PROPOSED record it is read
    // by. Was (stage 3E): A01-W1:s1, A01-W3 (no reading), the restart cut, the pressing cut, A01-W2:c1. Re-pointed 24 October 2026 (C1):
    // each reading is approved, so each names "reading approved". Was: "reading PROPOSED, awaiting confirmation".
    assert.deepEqual(admin.overview, overview)
    const LABEL = 'reading approved'
    assert.deepEqual(
        admin.overviewDraft!.presented!.scoring.flatMap(group => group.sentences.map(s => [s.place, s.wording, (s.source as any)?.id ?? null, s.reading?.label ?? null])),
        [
            ['LEAD', 'DERIVED_FROM_APPROVED', 'A01-W1', LABEL],
            ['QUALIFICATION', 'DERIVED_FROM_APPROVED', 'A01-W1', LABEL],
            ['QUALIFICATION', 'APPROVED', 'A01-W3', LABEL],
            ['LEAD', 'DRAFT', null, null],
            ['QUALIFICATION', 'DERIVED_FROM_APPROVED', 'A01-W2', LABEL],
        ],
    )
    assert.ok(!json.includes('reading') && !json.includes('awaiting'), 'no reading label in the coach overview')
    assert.deepEqual([admin.overviewDraft!.presented!.purpose!.wording, admin.overviewDraft!.presented!.game.wording, admin.overviewDraft!.presented!.parameters.wording], ['APPROVED', 'DRAFT', 'DRAFT'])
})

test('word counts and reading seconds are evidence, never a gate', () => {
    const admin = buildActivityForReview(a01At(12, 1), { includeDrafts: true }) as ServedActivity
    const reading = admin.overviewDraft!.reading!
    const words = (text: string) => text.split(' ').filter(Boolean).length
    const overview = admin.overview!
    const counted = words(overview.purpose!) + words(overview.game) + words(overview.parameters) + lines(overview).reduce((n, line) => n + words(line.text), 0)
    assert.equal(reading.words, counted)
    assert.equal(reading.secondsAt250Wpm, Math.round((counted / 250) * 60))
    assert.equal(reading.secondsAt200Wpm, Math.round((counted / 200) * 60))
    assert.equal(reading.detailsWords, admin.rendered.instructions.reduce((n, instruction) => n + words(instruction.text), 0))
    assert.ok(reading.basis.startsWith('Evidence only'))
    // A longer overview (his second sentence said twice, TEST-ONLY) is not refused for its length; no finding speaks of words or seconds.
    const longer = everyBlock(PROD_DRAFT, groups => groups[0].sentences.push(copy(groups[0].sentences[1])))
    const result = check(longer, PROD.games, PROD.served)
    assertPasses(result, 'longer')
    assert.ok(!result.findings.some(f => /\b(words?|seconds?|reading time)\b/i.test(f.what)))
    // The administrator's review evidence carries the overview's evidence as the build checked it.
    assert.deepEqual(admin.evidence!.overview, overviewEvidenceOf(admin.overviewDraft!))
    assert.equal(admin.evidence!.overview!.verdict, 'PASS')
    assert.deepEqual(admin.evidence!.overview!.reading, reading)
})

test("stage 3E: in each role clause of the game sentence the objective and target region it cites are its team's; a swapped pair is refused", () => {
    // The 3D review's probe: the two target clauses swapped, each keeping its own citations and bindings. Every word and number is still
    // one Details say, and each team's counts are still its own, so only the clause's citations can show that it contradicts Details.
    const swapped = copy(SERVED_DRAFT)
    for (const block of swapped.blocks) {
        const game = block.game!
        const targets = game.parts.map((p, n) => (p.text.startsWith(') attacks ') ? n : -1)).filter(n => n >= 0)
        assert.equal(targets.length, 2, game.text)
        const [a, b] = targets.map(n => game.parts[n])
        const open = (text: string) => (text.endsWith('.') ? text.slice(0, -1) : text)
        game.parts[targets[0]] = { ...b, text: open(b.text) }
        game.parts[targets[1]] = { ...a, text: `${open(a.text)}.` }
        game.text = game.parts.map(p => p.text).join('')
        game.from = [...new Set(game.parts.flatMap(p => p.from))]
        game.quantities = game.parts.flatMap(p => p.quantities)
    }
    assert.ok(swapped.blocks[0].game!.text.startsWith('The building team (6 outfield players and 1 goalkeeper) attacks the 5 m target zone'), swapped.blocks[0].game!.text)
    const result = check(swapped, PROD.games, PROD.served)
    assertRefused(result, '7.1', "the game sentence's clause for the building team cites objective", 'swapped: the building clause')
    assertRefused(result, '7.1', 'which the pressing team attacks, not the building team', 'swapped: whose objective it is')
    assertRefused(result, '7.1', "the game sentence's clause for the pressing team cites the region", 'swapped: the pressing clause names the other target')
    assert.deepEqual(questions(result), ['7.1'], 'no other question sees it')
    // A clause citing no objective cannot be read as any team's: refused.
    const unowned = copy(SERVED_DRAFT)
    for (const block of unowned.blocks) {
        const game = block.game!
        game.parts = game.parts.map(p => ({ ...p, from: p.from.filter(path => !path.startsWith('objectives[')) }))
        game.from = [...new Set(game.parts.flatMap(p => p.from))]
    }
    assertRefused(check(unowned, PROD.games, PROD.served), '7.1', 'cites no objective', 'no objective')
    // A role that opens no clause (TEST-ONLY words before its noun): its target cannot be read as its own, so it is refused.
    const unopened = copy(SERVED_DRAFT)
    for (const block of unopened.blocks) {
        const game = block.game!
        const at = game.parts.findIndex(p => p.text.startsWith('; the pressing team'))
        assert.ok(at > 0, game.text)
        game.parts[at] = { ...game.parts[at], text: game.parts[at].text.replace('; the pressing team', '; TEST-ONLY the pressing team') }
        game.text = game.parts.map(p => p.text).join('')
    }
    assertRefused(check(unopened, PROD.games, PROD.served), '7.1', 'the game sentence opens 0 clauses with the pressing team', 'a role opening no clause')
    assertPasses(check(SERVED_DRAFT, PROD.games, PROD.served), 'as composed')
})

test('stage 3E: a scoring sentence said whole binds exactly what its Details sentence binds (Q7.2)', () => {
    // TEST-ONLY table: the score's value made ESSENTIAL, so "Each score is worth 1 point." is said whole in each group, bound as Details bind it.
    const load = essentialsTable()
    load.table!.rules.find(rule => rule.id === 'SCORE_VALUE')!.class = 'ESSENTIAL'
    const VALUE = 'Each score is worth 1 point.'
    const draft = coachOverviewDraftOf('A01', PROD.games, undefined, { essentials: load })
    for (const block of draft.scoring.blocks) for (const group of block.groups) assert.deepEqual(group.sentences.find(s => s.text === VALUE)!.bindings, [{ quantity: 1, path: 'value.primaryEvent.value' }])
    assertPasses(check(draft, PROD.games, PROD.served, { essentials: load }), 'the value said whole')
    // Bound instead to another field the block's Details bind with the same number: every binding still is one Details make, so before
    // stage 3E it passed; the sentence's own bindings show that its number is not the one its Details sentence says.
    const rebound = everyBlock(draft, (groups, n) => {
        const other = PROD.games[n].rendered.instructions.flatMap(i => (i.parts ?? []).flatMap(p => p.bindings ?? [])).find(b => b.quantity === 1 && b.path !== 'value.primaryEvent.value')!
        assert.ok(other, 'another field bound to 1 in this block')
        for (const group of groups) for (const sentence of group.sentences) if (sentence.text === VALUE) sentence.bindings = [{ ...other }]
    })
    const result = check(rebound, PROD.games, PROD.served, { essentials: load })
    assertRefused(result, '7.2', 'is a Details sentence said whole and binds', 'rebound')
    assert.deepEqual(questions(result), ['7.2'])
    // A cut binds exactly what the parts it keeps whole bind. TEST-ONLY table on the scoring-modifier demonstration: the bonus's condition
    // and end made DETAIL, so its sentence is cut after its first sentence, keeping "2 instead of 1" bound to the operation and the value.
    // Its 2 bound instead to the number of teams (which the Players sentence binds to 2): every binding still is one Details make.
    const modifier = essentialsTable()
    modifier.table!.rules.find(rule => rule.id === 'MODIFIER_CONDITION_AND_END')!.class = 'DETAIL'
    const built = buildActivityWithFixture({ kind: 'mechanism-demonstration', demonstrationId: 'scoring-modifier', session: sessionAt(12, 1) })
    const games = [{ blockId: 'ONE_GAME', fixture: built.fixture, rendered: renderConcreteGame(built.fixture) }]
    const served = (built.activity as ServedActivity).rendered.instructions
    const demonstration = coachOverviewDraftOf(null, games, undefined, { essentials: modifier })
    const checkDemonstration = (draft: CoachOverviewDraft) =>
        checkOverview({ goalId: null, draft, blocks: games.map(game => ({ blockId: game.blockId, fixture: game.fixture, rendered: game.rendered.instructions })), served, essentials: modifier })
    const cut = demonstration.scoring.blocks[0].groups[0].sentences.find(sentence => sentence.form === 'SHORTENING')!
    assert.equal(cut.text, 'A score is worth 2 instead of 1 once the attacking team has touched the ball inside either channel and kept it after that touch.')
    assert.deepEqual(cut.bindings.map(b => b.quantity), [2, 1])
    assertPasses(checkDemonstration(demonstration), 'the bonus cut, bound as its parts bind')
    const reboundCut = copy(demonstration)
    reboundCut.scoring.blocks[0].groups[0].sentences.find(sentence => sentence.form === 'SHORTENING')!.bindings[0].path = 'performers.teams'
    const cutResult = checkDemonstration(reboundCut)
    assertRefused(cutResult, '7.2', 'is a cut of a Details sentence and binds', 'the cut rebound')
    assert.deepEqual(questions(cutResult), ['7.2'])
})

test("stage 3E: the evidence is the draft's, pointers and labels included; a reading label only where a reading reads his words, its own (Q7.3)", () => {
    const admin = buildActivityForReview(a01At(12, 1), { includeDrafts: true }) as ServedActivity
    const evidence = admin.evidence!.overview!
    const draft = admin.overviewDraft!
    // The 3D review's should-fix 3: the table with its source and label status, each pointer with its label and label status. Stage 3F: and
    // the table's why.
    // C1: partly approved, with its rules by standing (re-pointed 24 October 2026; was PROPOSED).
    assert.deepEqual(evidence.table, { source: draft.scoring.table.source, status: 'PARTLY_APPROVED', label: draft.scoring.table.label, labelStatus: 'DRAFT', why: null, approved: draft.scoring.table.approved, proposed: draft.scoring.table.proposed })
    assert.deepEqual(evidence.table.approved, ['EXCLUSION_CONDITION', 'ALSO_COUNTS_EXCLUSION'])
    assert.deepEqual(evidence.readings, draft.scoring.readings)
    const presented = draft.presented!.scoring.flatMap(group => group.sentences)
    assert.deepEqual(evidence.sentences.filter(s => s.part === 'scoring').map(s => [s.text, s.fullRule, s.reading, s.place]), presented.map(s => [s.text, s.fullRule, s.reading, s.place]))
    const pointed = evidence.sentences.filter(s => s.fullRule)
    assert.deepEqual(pointed.map(s => s.fullRule!.text), [W1.sentence, DETAILS_14, W2.sentence])
    assert.ok(pointed.every(s => s.fullRule!.label === FULL_RULE_LABEL && s.fullRule!.labelStatus === 'DRAFT'))
    assert.deepEqual(evidence.fullRules, draft.presented!.scoring.flatMap(group => group.fullRules.map(pointer => ({ group: group.group, ...pointer }))))
    assert.deepEqual(evidence.fullRules.map(p => [p.group, p.text, p.label, p.labelStatus]), [
        ['BUILDING', DETAILS_10, FULL_RULE_LABEL, 'DRAFT'],
        ['BUILDING', DETAILS_16, FULL_RULE_LABEL, 'DRAFT'],
        ['PRESSING', DETAILS_16, FULL_RULE_LABEL, 'DRAFT'],
    ])
    // Each sentence of his read by the record is labelled with its reading's standing (since stage 3F his eligibility sentence said whole
    // too); nothing else. Re-pointed 24 October 2026 (C1): all four readings approved. Was: 'reading PROPOSED, awaiting confirmation'.
    const LABEL = 'reading approved'
    assert.deepEqual(evidence.sentences.filter(s => s.reading).map(s => [s.text, s.reading!.label, s.reading!.status]), [OVERVIEW_4, W1_S2, OVERVIEW_5, OVERVIEW_8].map(text => [text, LABEL, 'APPROVED']))
    // Q7.7 exempts a verified extract from the general obligation and ordering lexicons (his words verbatim; the role rule still holds it).
    // Re-pointed 22 October 2026 (stage 3F): since his second building sentence is served, the exemption is load-bearing in production —
    // "The progression must begin ..." holds the obligation word "must", in his approved words verbatim (said whole in Details, where
    // fidelity Q4 passes it as approved wording). It names the specialized role, and passes the role rule only because the extract cites the
    // field whose value names that role. Was (stage 3E, c4d426a): neither served extract held a word of either lexicon.
    const derived = evidence.sentences.filter(s => s.wording === 'DERIVED_FROM_APPROVED')
    assert.equal(derived.length, 3)
    const lexical = derived.filter(sentence => [...OBLIGATIONS, ...ROLE_ORDERING].some(word => word.test(sentence.text)))
    assert.deepEqual(lexical.map(sentence => sentence.text), [W1_S2])
    assert.ok(W1.sentence.includes(W1_S2), 'his words verbatim')
    // The exemption holds only for the verified extract: with its citations changed (TEST-ONLY, dropping the field naming the role) it is no
    // longer that extract, so it is refused as derived, and both lexicons and the role rule hold its words.
    const uncited = everyBlock(SERVED_DRAFT, (groups, n) => {
        const second = groups[0].sentences[1]
        second.from = second.from.filter(path => !path.includes('referents'))
        const extract = SERVED_DRAFT.extracts[n].extracts.find(entry => entry.id === second.extractId)!
        assert.ok(extract.from.some(path => path.includes('referents')), 'the extract cites the origin referent')
    })
    const uncitedResult = check(uncited, PROD.games, PROD.served)
    assertRefused(uncitedResult, '7.3', 'is marked DERIVED_FROM_APPROVED and it cites', 'no longer its extract')
    assertRefused(uncitedResult, '7.7', 'states a player obligation or an order of actions in words that are not his', 'the obligation lexicon')
    assertRefused(uncitedResult, '7.7', 'with a word of obligation or order', 'the role rule')
    // Q7.3: a DRAFT sentence naming a reading is refused; his eligibility sentence said whole naming none (it is read by the record), and an
    // extract naming none though its extract is kept by one, too. (Re-pointed 22 October 2026, stage 3F: was his eligibility sentence
    // naming a reading, refused.)
    const draftLabelled = everyBlock(SERVED_DRAFT, groups => (groups[1].sentences[0].reading = { ...groups[0].sentences[0].reading! }))
    assertRefused(check(draftLabelled, PROD.games, PROD.served), '7.3', 'names a reading of his wording', 'a DRAFT sentence labelled')
    const wholeUnlabelled = everyBlock(SERVED_DRAFT, groups => (groups[0].sentences.find(s => s.text === W3.sentence)!.reading = null))
    assertRefused(check(wholeUnlabelled, PROD.games, PROD.served), '7.3', 'names the reading null, and his wording said whole is read by', 'his whole sentence unlabelled')
    const unlabelled = everyBlock(SERVED_DRAFT, groups => (groups[1].sentences[1].reading = null))
    assertRefused(check(unlabelled, PROD.games, PROD.served), '7.3', 'it names the reading null, and its extract is kept by', 'an extract unlabelled')
})

test("stage 3F: his example — his first building sentence with his eligibility sentence, and no statement of the build-out origin, is refused", () => {
    // His reply filed 23 October 2026, item 4: "saying that a new goalkeeper restart is required after possession loss does not, by itself,
    // fully communicate that the original scoring opportunity must begin from the goalkeeper." The overview the 3E composer served (his
    // first sentence's extract beside his eligibility sentence), without the restart moments, as the building team's whole group.
    const example = everyBlock(SERVED_DRAFT, groups => {
        groups[0].sentences = groups[0].sentences.filter(sentence => sentence.text !== W1_S2)
    })
    assert.deepEqual(texts(example.scoring.blocks[0].groups[0]), [OVERVIEW_4, W3.sentence])
    const result = check(example, PROD.games, PROD.served)
    assertRefused(result, '7.4', 'rule ORIGIN_CONDITION) is stated by no sentence of the building team\'s group: a pointer never excuses it', 'his example')
    // Only the origin: the eligibility is stated (by his eligibility sentence), the progression and the control by his first sentence.
    assert.ok(violations(result).every(finding => finding.question === '7.4' && finding.what.includes('rule ORIGIN_CONDITION)')), JSON.stringify(violations(result)))
    // Read by meaning, never by citation: his eligibility sentence cites every field of the origin, and is not counted for any.
    const [first] = result.read
    const building = first.groups.find(group => group.group === 'BUILDING')!
    const origin = building.elements.find(element => element.rule === 'ORIGIN_CONDITION')!
    assert.deepEqual([origin.material, origin.complete, origin.statedBy], [true, false, []])
    assert.deepEqual(origin.notStatedBy.map(entry => entry.sentence), [1])
    assert.ok(origin.notStatedBy[0].why.includes('does not, by itself, fully communicate that the original scoring opportunity must begin from the goalkeeper'), origin.notStatedBy[0].why)
    const w3 = example.scoring.blocks[0].groups[0].sentences[1]
    assert.ok(requiredBy(SERVED_DRAFT, 0, 0, 'ORIGIN_CONDITION').every(path => w3.from.includes(path)), 'his eligibility sentence cites the origin')
    // A pointer to his building rule, which states the origin in full, does not excuse it: the origin is material.
    const pointed = everyBlock(example, (groups, n) => {
        groups[0].sentences[0].fullRule = { ...groups[0].sentences[0].fullRule!, paths: [...groups[0].sentences[0].fullRule!.paths, ...requiredBy(SERVED_DRAFT, n, 0, 'ORIGIN_CONDITION')] }
    })
    assertRefused(check(pointed, PROD.games, PROD.served), '7.4', 'rule ORIGIN_CONDITION) is stated by no sentence', 'pointed to')
    // On the serving path: a TEST-ONLY record with no reading of his second sentence leaves the composer only his first sentence and his
    // eligibility sentence, which state no origin, so the group is withheld, the overview withheld, and the activity served as without it.
    const file = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../../../docs/audits/approved-wording-readings.json'), 'utf8'))
    file.readings = file.readings.filter((reading: any) => !(reading.entry === 'A01-W1' && reading.parts[0].sentence === 2))
    const withoutSecond = readingsLoadOf(file)
    assert.equal(withoutSecond.status, 'PARTLY_APPROVED')
    const outcome = overviewForServing({ goalId: 'A01', games: PROD.games, served: PROD.served, options: { readings: withoutSecond } })
    assert.equal(outcome.overview, null)
    assert.equal(outcome.draft.served, false)
    const withheld = outcome.draft.scoring.blocks[0].groups[0]
    assert.equal(withheld.withheld, true)
    assert.ok(withheld.why.some(why => why.includes('rule ORIGIN_CONDITION) is stated by no sentence of the group (A01-W1 and A01-W3 cite it, and no recorded reading says those words state it)')), JSON.stringify(withheld.why))
    assertRefused(outcome.draft.check!, '7.5', 'how the building team scores is withheld', 'the overview withheld')
    // The record handed in is the one the draft's account describes (the 3E review's bookkeeping item).
    assert.deepEqual(outcome.draft.scoring.readings.status, 'PARTLY_APPROVED')
    assert.equal(outcome.evidence.served, false)
})

test("stage 3F (the 3E review's should-fix 2): a team's group states only how that team scores; another team's sentence under it is refused", () => {
    // The review's probe: the regain clause copied into the building team's group. Every other check passes it (its words, citations and
    // reading are its own, and the building team's group still states all it needs), so only the role check refuses it.
    const misplaced = everyBlock(SERVED_DRAFT, groups => {
        groups[0].sentences.push({ ...copy(groups[1].sentences[1]), place: 'QUALIFICATION' })
    })
    const result = check(misplaced, PROD.games, PROD.served)
    assertRefused(result, '7.4', `the building team's sentence 4 "${OVERVIEW_8}" states value.primaryEvent.alsoCounts`, 'misplaced regain')
    assertRefused(result, '7.4', 'which is how the pressing team scores: a team\'s group says only how that team scores', 'whose it is')
    // Re-pointed 22 October 2026 (polish pass P1): the membership rule now sees it too (it states nothing the building team's group must
    // account for); no other question does. Was: only the role check.
    assert.ok(
        violations(result).every(finding => finding.question === '7.4' && (finding.what.includes('which is how the pressing team scores') || finding.what.includes("states nothing the building team's group must account for"))),
        'no other question sees it',
    )
    // And the reverse: his first building sentence under the pressing team.
    const reverse = everyBlock(SERVED_DRAFT, groups => {
        groups[1].sentences.push({ ...copy(groups[0].sentences[0]), place: 'QUALIFICATION', fullRule: null })
    })
    assertRefused(check(reverse, PROD.games, PROD.served), '7.4', 'which is how the building team scores', 'his first building sentence under the pressing team')
    assertPasses(check(SERVED_DRAFT, PROD.games, PROD.served), 'as composed')
})

test('stage 3F: each group opens with exactly one line saying how the team scores; the coach is served it first in its team\'s group (P1)', () => {
    // Not first, two leads, a lead stating no field of the team's first way to score, a place that is neither: refused (Q7.5).
    const reversed = everyBlock(SERVED_DRAFT, groups => groups[0].sentences.reverse())
    assertRefused(check(reversed, PROD.games, PROD.served), '7.5', "the building team's group opens with a qualification", 'lead not first')
    const twoLeads = everyBlock(SERVED_DRAFT, groups => (groups[0].sentences[1].place = 'LEAD'))
    assertRefused(check(twoLeads, PROD.games, PROD.served), '7.5', "the building team's group opens with 2 lines saying how it scores", 'two leads')
    const wrongLead = everyBlock(SERVED_DRAFT, groups => {
        const [lead, origin, eligibility] = groups[0].sentences
        groups[0].sentences = [{ ...eligibility, place: 'LEAD' }, { ...origin }, { ...lead, place: 'QUALIFICATION' }]
    })
    assertRefused(check(wrongLead, PROD.games, PROD.served), '7.5', `the building team's first line "${OVERVIEW_5}" states no field of the team's first way to score`, 'a lead saying no way to score')
    const unplaced = everyBlock(SERVED_DRAFT, groups => ((groups[1].sentences[1] as any).place = 'TEST-ONLY'))
    assertRefused(check(unplaced, PROD.games, PROD.served), '7.5', 'is placed "TEST-ONLY"', 'a place that is neither')
    // A lead of more than one sentence is a NOTE, never a refusal (under the TEST-ONLY table making the exclusion ESSENTIAL, his building
    // rule said whole leads).
    const load = essentialsTable()
    const exclusion = load.table!.rules.find(rule => rule.id === 'EXCLUSION_CONDITION')!
    exclusion.class = 'ESSENTIAL'
    delete exclusion.followsFrom
    const whole = compose(PROD.games, { essentials: load })
    assert.equal(whole.scoring.blocks[0].groups[0].sentences[0].text, W1.sentence)
    const noted = check(whole, PROD.games, PROD.served, { essentials: load })
    assertPasses(noted, 'a lead of three sentences')
    assert.ok(noted.findings.some(f => f.severity === 'NOTE' && f.question === '7.5' && f.what.includes("the building team's first line is 3 sentences")), JSON.stringify(noted.findings))
    // Served (re-pointed, polish pass P1): each team's group under its heading, its lead first, then its own qualifications; the restart
    // pointer the building team's; the score's value, every team's, once after the groups. Was (stage 3F): every lead, then every
    // qualification, then each pointer no line carries.
    const served = overviewForServing({ goalId: 'A01', games: PROD.games, served: PROD.served })
    const presented = served.draft.presented!
    assert.deepEqual(served.overview!.scoring.groups.map(group => group.label), presented.scoring.map(group => group.label))
    assert.deepEqual(presented.scoring.map(group => [group.label, group.labelStatus]), [['Building team', 'DRAFT'], ['Pressing team', 'DRAFT']])
    served.overview!.scoring.groups.forEach((group, n) => {
        assert.deepEqual(group.lines.map(line => line.text), presented.scoring[n].sentences.map(s => s.text))
        assert.equal(presented.scoring[n].sentences[0].place, 'LEAD', 'each group opens with its lead')
    })
    assert.deepEqual(served.overview!.scoring.groups.map(group => group.fullRules.map(p => p.text)), [[DETAILS_10], []])
    assert.deepEqual(served.overview!.scoring.fullRules.map(p => p.text), [DETAILS_16])
})

test('polish pass P1: each sentence is held to its own team; the coach is served each team\'s group, under its heading, as checked', () => {
    // Q7.4 membership: the pressing team's regain clause moved under the building team (both blocks, so Q7.8 agrees) is refused, by what it
    // states (the pressing team's way to score) and because it states nothing the building team's group must account for.
    const moved = everyBlock(SERVED_DRAFT, groups => {
        const clause = groups[1].sentences.pop()!
        groups[0].sentences.push(clause)
    })
    const movedResult = check(moved, PROD.games, PROD.served)
    assertRefused(movedResult, '7.4', `the building team's sentence 4 "${OVERVIEW_8}" states nothing the building team's group must account for`, 'a sentence under the other team')
    // Q7.5: a group named with a noun the game does not read for its role is refused (its heading would name another team).
    const renamed = everyBlock(SERVED_DRAFT, groups => (groups[0].noun = 'pressing team'))
    assertRefused(check(renamed, PROD.games, PROD.served), '7.5', 'the building team\'s group is named "pressing team"', 'a group under another team\'s noun')
    // Q7.5, what the coach is served, read back against the checked groups (TEST-ONLY mutations of the served shape).
    const presented = presentedOf(SERVED_DRAFT)!
    const spec = scoringRequirementsOf(PROD.games[0].fixture, PROD.games[0].rendered.instructions, essentialsTable().table!)
    const groups = SERVED_DRAFT.scoring.blocks[0].groups
    const findingsFor = (change: (served: CoachOverview) => void, order: string[] = ['BUILDING', 'PRESSING']) => {
        const served = coachOverviewOf(presented)
        change(served)
        const found: string[] = []
        servedGroupsHold(served, groups, spec, order, what => found.push(what))
        return found
    }
    const refusedHere = (found: string[], includes: string, what: string) => assert.ok(found.some(entry => entry.includes(includes)), `${what}: expected "${includes}" in ${JSON.stringify(found, null, 1)}`)
    assert.deepEqual(findingsFor(() => undefined), [], 'the production overview holds')
    refusedHere(findingsFor(served => served.scoring.groups[0].lines.push(served.scoring.groups[1].lines.pop()!)), 'are not the building team\'s group', 'a line moved to the other team')
    refusedHere(findingsFor(served => served.scoring.groups.reverse()), 'is shown under "Pressing team"', 'groups swapped under their headings')
    refusedHere(findingsFor(served => (served.scoring.groups[1].label = 'Building team')), 'where its heading is "Pressing team"', 'a heading changed')
    refusedHere(findingsFor(served => served.scoring.groups[1].fullRules.push(served.scoring.groups[0].fullRules[0])), 'and it is not the pressing team\'s', 'a pointer under the other team')
    refusedHere(findingsFor(served => served.scoring.fullRules.push(served.scoring.groups[0].fullRules.pop()!)), 'not every team\'s group has it', 'one team\'s pointer shown as every team\'s')
    refusedHere(findingsFor(served => served.scoring.groups[0].fullRules.pop()), 'the building team\'s pointer to', 'a team\'s pointer dropped')
    refusedHere(findingsFor(served => (served.scoring.groups[0].lines[0].fullRule = null)), 'carries a pointer that is not its own sentence\'s', 'a line\'s pointer dropped')
    refusedHere(findingsFor(() => undefined, ['PRESSING', 'BUILDING']), 'the game sentence names the teams in the order', 'groups not in the game sentence\'s order')
    // One group (a game without roles): its pointers stay with it; nothing is shown after the groups as every team's.
    const single = { ...presented, scoring: [{ ...presented.scoring[0] }] }
    const one = coachOverviewOf(single)
    assert.deepEqual(one.scoring.fullRules, [])
    assert.deepEqual(one.scoring.groups[0].fullRules.map(pointer => pointer.text), [DETAILS_10, DETAILS_16])
})

test('stage 3F: an exception is material where the condition it follows from is unstated; the evidence names what states each element', () => {
    // A TEST-ONLY table: the exclusion follows from the regain's control, of which the building team's group has no field, so the production
    // overview (which leaves the exclusion to Coach Details) is refused; composed under that table, his building rule is said whole and passes.
    const load = essentialsTable()
    load.table!.rules.find(rule => rule.id === 'EXCLUSION_CONDITION')!.followsFrom = ['ALSO_COUNTS_CONTROL']
    const result = check(SERVED_DRAFT, PROD.games, PROD.served, { essentials: load })
    assertRefused(result, '7.4', "rule EXCLUSION_CONDITION) is material in the building team's group: it follows from ALSO_COUNTS_CONTROL, which the group does not state, so a pointer does not excuse it", 'material exclusion')
    const composed = compose(PROD.games, { essentials: load })
    assertPasses(check(composed, PROD.games, PROD.served, { essentials: load }), 'material exclusion, stated')
    assert.equal(composed.scoring.blocks[0].groups[0].sentences[0].text, W1.sentence)
    // The production evidence: per team, each material element and the sentence stating it; each detail and where it is left.
    const admin = buildActivityForReview(a01At(12, 1), { includeDrafts: true }) as ServedActivity
    const meaning = admin.evidence!.overview!.meaning
    assert.deepEqual(meaning.map(group => [group.group, group.noun]), [['BUILDING', 'building team'], ['PRESSING', 'pressing team']])
    const element = (group: number, rule: string) => meaning[group].elements.find(entry => entry.rule === rule)!
    assert.deepEqual(element(0, 'PROGRESSION_CONDITION').statedBy, [OVERVIEW_4, W1_S2])
    assert.deepEqual(element(0, 'CONTROL_CONDITION').statedBy, [OVERVIEW_4])
    assert.deepEqual(element(0, 'ORIGIN_CONDITION').statedBy, [W1_S2])
    assert.deepEqual(element(0, 'ORIGIN_CONDITION').notStatedBy.map(entry => entry.text), [OVERVIEW_5])
    assert.deepEqual(element(0, 'BOUNDED_CREDIT').statedBy, [OVERVIEW_5])
    assert.deepEqual([element(0, 'EXCLUSION_CONDITION').material, element(0, 'EXCLUSION_CONDITION').pointer?.text], [false, W1.sentence])
    assert.ok(element(0, 'EXCLUSION_CONDITION').because.includes('follows from CONTROL_CONDITION, which this group states'))
    assert.ok(meaning[0].elements.filter(entry => entry.rule === 'BOUNDED_EPISODE_OPENER').every(entry => !entry.material && entry.pointer?.text === DETAILS_10))
    assert.deepEqual(element(1, 'ALSO_COUNTS_CONTROL').statedBy, [OVERVIEW_8])
    assert.deepEqual([element(1, 'ALSO_COUNTS_EXCLUSION').material, element(1, 'ALSO_COUNTS_EXCLUSION').pointer?.text], [false, W2.sentence])
    assert.deepEqual(element(1, 'SCORING_EVENT').statedBy, [OVERVIEW_7])
    // Every material element is stated, completely; every other is stated or pointed to.
    for (const group of meaning) for (const entry of group.elements) assert.ok(entry.material ? entry.complete && entry.statedBy.length > 0 : entry.complete || entry.pointer !== null, `${group.group} ${entry.rule}`)
    // The evidence is the check's own reading of the first block.
    assert.deepEqual(meaning[0].elements.map(entry => entry.rule), admin.overviewDraft!.check!.read[0].groups[0].elements.map(entry => entry.rule))
})

test('stage 3F (the 3E review\'s bookkeeping item): the readings handed to serving are the ones the account describes', () => {
    const unusable = readingsLoadOf({ status: 'APPROVED' })
    const withUnusable = overviewForServing({ goalId: 'A01', games: PROD.games, served: PROD.served, options: { readings: unusable } })
    assert.equal(withUnusable.draft.scoring.readings.status, 'UNUSABLE')
    assert.equal(withUnusable.evidence.readings.why, unusable.why)
    assert.equal(withUnusable.overview, null, 'with no usable record nothing of his can be shown to be stated')
    const testOnly = overviewForServing({ goalId: 'A01', games: PROD.games, served: PROD.served, options: { reading: READING } })
    assert.equal(testOnly.draft.scoring.readings.status, 'UNUSABLE')
    assert.ok(testOnly.draft.scoring.readings.why!.includes('names no record'))
    assert.equal(testOnly.draft.check!.verdict, 'PASS', 'the TEST-ONLY copy is checked under itself')
    const recorded = overviewForServing({ goalId: 'A01', games: PROD.games, served: PROD.served, options: { readings: recordedReadings() } })
    assert.deepEqual(recorded.overview, overviewForServing({ goalId: 'A01', games: PROD.games, served: PROD.served }).overview)
    assert.equal(recorded.draft.scoring.readings.status, 'PARTLY_APPROVED')
})

test('the module names nothing of the first activity', () => {
    const source = fs.readFileSync(path.join(__dirname, 'overview-fidelity.ts'), 'utf8')
    const code = source
        .split('\n')
        .filter(line => !/^\s*(\*|\/\*\*|\/\/)/.test(line))
        .join('\n')
    for (const row of sessionPlanningModel.learningGoals()) assert.ok(!new RegExp(`\\b${row['ID']}\\b`).test(code), String(row['ID']))
    for (const literal of ['RPC-0', 'GF2', 'A01-', 'BUILDING', 'PRESSING', 'goalkeeper', 'halfway', 'BOUNDED_CREDIT', 'ORIGIN_CONDITION', 'CONTROL_CONDITION', 'progression', "'V30'", 'WHOLE_GAME']) assert.ok(!code.includes(literal), literal)
    for (const value of ['5', '20', '30', '40', '12']) assert.ok(!new RegExp(`(^|[^\\w.])${value}([^\\w.]|$)`).test(code), `the number ${value} is typed in the code`)
})

console.log(`overview-fidelity.unit.ts — ${passed} passed`)
