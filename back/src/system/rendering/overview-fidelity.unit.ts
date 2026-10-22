/**
 * The Coach Overview's agreement check (Q7), and serving the overview — stage 3D, 21 October 2026.
 *
 * His reply filed 22 October 2026, item 2: *"Please ensure that the completeness check verifies that all necessary information remains
 * accessible and that abbreviated statements do not misrepresent the full rules."* Item 4: *"Shortening must not introduce new meanings,
 * omit a condition that changes the essential understanding, or silently turn a qualified rule into an unrestricted one."*
 *
 * Pinned here, on the real chain (design D3's T1-T17, as the BUILD PLAN restates T3, and the plan's additions):
 *
 *   T1  the A01 overview agrees with Details in both blocks (12/1, 12/2, 11/1) and is served to coach and administrator alike; with a
 *       TEST-ONLY reading the EXPECTED PRESENTATION's sentences 4, 5 and 8 pass word for word; its hand-written 6 and its cut 7 are refused
 *       (their words cannot be shown to state the restart moments or the way to score);
 *   T2  the extract of his first sentence without his eligibility sentence is refused (bound and origin unstated), a pointer never excusing it;
 *   T3  his illustrative building line, not an extract, is DRAFT (marked derived it is refused); without his eligibility sentence it is refused;
 *   T4  a pressing group omitting the regain inside the zone is refused (a way to score missing);
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
 *   T16 an obligation word in a draft is refused;             T17 omitting the restart moments for a bounded role is refused;
 *   and: the pressing group keeps V30 through the W2 extract (an extract read as not keeping it is refused); the overview is identical in
 *   both blocks (Q7.8); a refused activity has no overview; an overview failure withholds only the overview; the restart sentence rendered as
 *   ONE part (TEST-ONLY, the 3C review's probe) is never cut and a forged cut is refused; the coach receives words and pointers only; word
 *   counts are evidence, never a gate; the module names nothing of the first activity.
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { LoadedContract } from '../derivation/types'
import { sessionPlanningModel } from '../session-planning/session-planning-model'
import { learningGoalAuthorizations } from '../test-library/learning-goal-authorizations'
import { reviewActivity } from './activity-review'
import { ApprovedWording, approvedWording } from './approved-wording'
import { buildActivity, buildActivityForReview, buildActivityUnderAuthorizationRecords, buildActivityWithFixture, RefusedActivity, ServedActivity } from './build-activity'
import { CoachOverviewDraft, coachOverviewDraftOf, DetailsPointer, essentialsLoadOf, FULL_RULE_LABEL, ScoringGroup, ScoringSentence } from './coach-overview'
import { CoverReading, extractsFor } from './derived-wording'
import { MECHANISM_DEMONSTRATIONS } from './mechanism-demonstrations'
import { checkOverview, OverviewCheck, OverviewCheckInput, overviewEvidenceOf, overviewForServing } from './overview-fidelity'
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
const compose = (games: Game[], options: { reading?: CoverReading; wording?: ApprovedWording[] } = {}): CoachOverviewDraft =>
    coachOverviewDraftOf('A01', games, game => extractsFor(game, { reading: options.reading, wording: options.wording }), { wording: options.wording })
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

const entryOf = (id: string): ApprovedWording => approvedWording().find(entry => entry.id === id)!
const W1 = entryOf('A01-W1')
const W2 = entryOf('A01-W2')
const W3 = entryOf('A01-W3')
const DETAILS_10 = "The building team's goalkeeper restarts play: at the start, after either team scores and whenever you decide that an attack has run its course (at a stoppage or while play is on)"
const DETAILS_14 = 'Pressing team: Score by getting the ball under control into its target zone: running it in, or passing to a teammate who receives it under control inside'
/** The BUILD PLAN's EXPECTED PRESENTATION, overview sentences 4-8 as written there. */
const OVERVIEW_4 = 'Building team: Score by carrying the ball beyond the marked line or passing to a teammate who receives it under control beyond the line.'
const OVERVIEW_5 = W3.sentence
const OVERVIEW_6 = "The building team's goalkeeper restarts play at the start, after either team scores and whenever you decide an attack has run its course."
const OVERVIEW_7 = 'Pressing team: Score by getting the ball under control into its target zone.'
const OVERVIEW_8 = 'The pressing team also scores by winning the ball inside that zone, provided it genuinely establishes possession.'
/** His illustrative building line (reply filed 22 October 2026, item 5): "illustrative wording for evaluation, not a new canonical knowledge entry". */
const HIS_BUILDING_LINE = 'The building team scores by progressing beyond the line under control.'
/** A TEST-ONLY reading of what parts of his entries state (as in overview-scoring.unit.ts): NOT his reading, and not ours to record. */
const READING: CoverReading = (entry, units) => {
    if (entry.id === 'A01-W1' && units.length === 1 && units[0].sentence === 0 && units[0].part === 'WHOLE_SENTENCE') return [4, 5, 6, 7, 8, 9, 10, 11]
    if (entry.id === 'A01-W2' && units.length === 1 && units[0].part === 'LEADING_CLAUSE') return [0, 1, 2]
    return null
}

const PROD = gamesOf(12, 1)
const PROD_DRAFT = compose(PROD.games)
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
        assert.ok(draft.check!.findings.some(f => f.severity === 'NOTE' && f.what.includes('PROPOSED essentials table')), what)
        assert.equal(draft.served, true, what)
        assert.ok(admin.overview && coach.overview, `${what}: served`)
        assert.deepEqual(coach.overview, admin.overview, `${what}: the coach and the administrator are served the same overview`)
        assert.deepEqual(coach.rendered, admin.rendered, what)
        // What is served is what was checked: the first block's words, the same in both (Q7.8).
        const [first, second] = draft.check!.read
        assert.deepEqual(first.groups.map(g => g.sentences.map(s => s.text)), second.groups.map(g => g.sentences.map(s => s.text)), what)
        assert.deepEqual(admin.overview!.scoring.map(group => group.sentences.map(s => s.text)), first.groups.map(g => g.sentences.map(s => s.text)), what)
        // Production: no reading of his wording is recorded, so his entries are said whole, and (strict cuts, stage 3D) so are the DRAFT
        // Details sentences whose cuts would split the part citing what they must state.
        assert.deepEqual(admin.overview!.scoring.map(group => group.sentences.map(s => s.text)), [
            [W1.sentence, W3.sentence, `${DETAILS_10}.`],
            [`${DETAILS_14}.`, W2.sentence],
        ])
        assert.ok(first.groups.every(group => group.sentences.every(sentence => sentence.form === 'WHOLE')), what)
    }
    // With a TEST-ONLY reading: the EXPECTED PRESENTATION's sentences 4, 5 and 8, word for word, with their statuses; it agrees.
    assertPasses(readCheck(READ_DRAFT), 'TEST-ONLY reading')
    for (const block of READ_DRAFT.scoring.blocks) {
        const [building, pressing] = block.groups
        assert.deepEqual(texts(building), [OVERVIEW_4, OVERVIEW_5, `${DETAILS_10}.`])
        assert.deepEqual(texts(pressing), [`${DETAILS_14}.`, OVERVIEW_8])
        assert.deepEqual([...building.sentences, ...pressing.sentences].map(s => s.wording), ['DERIVED_FROM_APPROVED', 'APPROVED', 'DRAFT', 'DRAFT', 'DERIVED_FROM_APPROVED'])
    }
    // The EXPECTED PRESENTATION's own sentence 6 (a rewording of Details 10) and 7 (a cut inside the one part citing the way to score)
    // are refused: their words cannot be shown to state the restart moments or how the pressing team scores.
    const asExpected = everyBlock(READ_DRAFT, groups => {
        Object.assign(groups[0].sentences[2], { text: OVERVIEW_6, form: 'SHORTENING', bindings: [] })
        Object.assign(groups[1].sentences[0], { text: OVERVIEW_7, form: 'SHORTENING', bindings: [] })
    })
    const refused = readCheck(asExpected)
    assertRefused(refused, '7.4', 'rule BOUNDED_EPISODE_OPENER) is stated by no sentence of the building team', 'EXPECTED sentence 6')
    assertRefused(refused, '7.4', 'rule SCORING_EVENT) is stated by no sentence of the pressing team', 'EXPECTED sentence 7')
    assert.ok(refused.findings.some(f => f.severity === 'NOTE' && f.what.includes(OVERVIEW_6)), 'sentence 6 is read as stating nothing')
})

test('T2. the extract of his first sentence without his eligibility sentence is refused, even with a pointer to it', () => {
    const withoutW3 = everyBlock(READ_DRAFT, (groups, n) => {
        const building = groups[0]
        building.sentences = building.sentences.filter(sentence => sentence.text !== W3.sentence)
        const game = PROD.games[n]
        const pointer: DetailsPointer = {
            blockIndex: detailsIndexOf(game, W1.sentence),
            section: 'How to score',
            text: W1.sentence,
            label: FULL_RULE_LABEL,
            labelStatus: 'DRAFT',
            because: ['DETAIL_LEFT_OUT'],
            paths: [...requiredBy(READ_DRAFT, n, 0, 'BOUNDED_CREDIT'), ...requiredBy(READ_DRAFT, n, 0, 'ORIGIN_CONDITION')],
        }
        building.fullRules.push(pointer)
    })
    assert.equal(withoutW3.scoring.blocks[0].groups[0].sentences[0].text, OVERVIEW_4)
    const result = readCheck(withoutW3)
    assertRefused(result, '7.4', 'rule BOUNDED_CREDIT) is stated by no sentence of the building team\'s group: a pointer never excuses it', 'bound')
    assertRefused(result, '7.4', 'rule ORIGIN_CONDITION) is stated by no sentence', 'origin')
    // The pointer itself resolves and cites what it points for: only the unstated ESSENTIAL fields refuse it.
    assert.deepEqual(questions(result), ['7.4'])
})

test('T3. his illustrative building line, not an extract, is DRAFT; marked derived it is refused; without his eligibility sentence it is refused', () => {
    const his = (wording: ScoringSentence['wording'], keepW3: boolean) =>
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
            if (!keepW3) building.sentences = building.sentences.filter(sentence => sentence.text !== W3.sentence)
        })
    // As DRAFT beside his eligibility sentence: its status stands (no Q7.3 finding), and it is read as stating nothing checkable, so the
    // building team's way to score is not shown by it and the group is refused for that.
    const draft = readCheck(his('DRAFT', true))
    assert.ok(!violations(draft).some(f => f.question === '7.3'), JSON.stringify(violations(draft)))
    assert.ok(draft.findings.some(f => f.severity === 'NOTE' && f.what.includes(HIS_BUILDING_LINE) && f.what.includes('read as stating nothing')))
    assertRefused(draft, '7.4', 'rule PROGRESSION_CONDITION) is stated by no sentence', 'his line states no progression it can be shown to')
    assert.ok(!anyViolation(draft, '7.4', 'rule BOUNDED_CREDIT)'), 'with his eligibility sentence the bound is stated')
    // Marked DERIVED_FROM_APPROVED: refused, it is not the extract it names.
    assertRefused(readCheck(his('DERIVED_FROM_APPROVED', true)), '7.3', 'is marked DERIVED_FROM_APPROVED and its words are not its extract', 'his line as derived')
    // Without his eligibility sentence: refused, the bound and the origin unstated as well.
    const alone = readCheck(his('DRAFT', false))
    assertRefused(alone, '7.4', 'rule BOUNDED_CREDIT) is stated by no sentence', 'without W3, the bound')
    assertRefused(alone, '7.4', 'rule ORIGIN_CONDITION) is stated by no sentence', 'without W3, the origin')
})

test('T4. a pressing group omitting the regain inside the zone is refused: a way to score is missing', () => {
    const result = check(
        everyBlock(PROD_DRAFT, groups => {
            groups[1].sentences = groups[1].sentences.filter(sentence => sentence.text !== W2.sentence)
        }),
        PROD.games,
        PROD.served,
    )
    assertRefused(result, '7.4', 'rule ALSO_COUNTS_TEAM_AND_TRIGGER) is stated by no sentence of the pressing team', 'V28/V29')
    assertRefused(result, '7.4', 'rule ALSO_COUNTS_CONTROL) is stated by no sentence', 'V30')
    assertRefused(result, '7.5', 'alsoCounts', 'the regain way')
    assertRefused(result, '7.4', 'rule ALSO_COUNTS_EXCLUSION) is left out', 'V31 with no pointer')
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
    // And an extract claiming a reading the check is not given: production has none, so it is refused there.
    assertRefused(check(READ_DRAFT, PROD.games, PROD.served), '7.3', 'is not usable', 'no reading recorded')
})

test('T9. a pointer to a Details sentence the block does not say is refused', () => {
    const result = check(
        everyBlock(PROD_DRAFT, groups => {
            groups[0].fullRules[0] = { ...groups[0].fullRules[0], text: 'TEST-ONLY a sentence no Details say' }
        }),
        PROD.games,
        PROD.served,
    )
    assertRefused(result, '7.4', 'which no Details sentence of this block says', 'missing target')
    assertRefused(result, '7.4', 'rule SCORE_VALUE) is left out', 'the value is then pointed to by nothing')
    // A pointer whose label is not the "full rule" label, or that points for a field its sentence does not cite.
    const relabelled = check(everyBlock(PROD_DRAFT, groups => (groups[0].fullRules[0] = { ...groups[0].fullRules[0], label: 'TEST-ONLY' as any })), PROD.games, PROD.served)
    assertRefused(relabelled, '7.4', 'is labelled "TEST-ONLY"', 'label')
    const wrongField = check(everyBlock(PROD_DRAFT, groups => groups[0].fullRules[0].paths.push('TEST-ONLY.path')), PROD.games, PROD.served)
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
    const fromDraft = everyBlock(PROD_DRAFT, groups => {
        const restarts = groups[0].sentences.find(sentence => sentence.text === `${DETAILS_10}.`)!
        Object.assign(restarts, { wording: 'DERIVED_FROM_APPROVED', source: { kind: 'APPROVED_ENTRY', id: W1.id }, extractId: null })
    })
    assertRefused(check(fromDraft, PROD.games, PROD.served), '7.3', 'is marked DERIVED_FROM_APPROVED and it names no extract generated for this block', 'derived from a draft')
    // His wording marked DRAFT is a wrong status too; a DRAFT naming an approved source is incoherent.
    assertRefused(check(everyBlock(PROD_DRAFT, groups => Object.assign(groups[0].sentences[1], { wording: 'DRAFT', source: null })), PROD.games, PROD.served), '7.3', 'is his approved wording and is marked DRAFT', 'under-claim')
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
            assert.equal(overview.scoring.length, 1)
            assert.equal(draft.scoring.blocks[0].groups[0].group, 'EVERY_TEAM')
            assert.equal(draft.presented!.purpose, null)
        }
    }
    assert.equal(served, 6)
})

test('T16. an obligation word in a draft is refused (Q7.7); the Coach Communication Standard is a note', () => {
    const must = everyBlock(PROD_DRAFT, (groups, n) => {
        groups[0].sentences.push({ ...copy(groups[0].sentences[2]), text: 'The building team must start every attack from the back.', form: 'SHORTENING', from: [...groups[0].sentences[2].from], bindings: [] })
    })
    assertRefused(check(must, PROD.games, PROD.served), '7.7', 'states a player obligation or an order of actions in words that are not his', 'must')
    const aimTo = everyBlock(PROD_DRAFT, groups => {
        groups[1].sentences.push({ ...copy(groups[1].sentences[0]), text: 'Teams aim to keep the ball.', form: 'SHORTENING', bindings: [] })
    })
    const noted = check(aimTo, PROD.games, PROD.served)
    assert.ok(noted.findings.some(f => f.severity === 'NOTE' && f.question === '7.7' && f.what.includes('Teams aim to')), JSON.stringify(noted.findings))
    // His own approved words with "cannot" and "until" pass (approved wording said whole).
    assertPasses(check(PROD_DRAFT, PROD.games, PROD.served), 'his words')
})

test('T17. omitting the restart moments for a bounded role is refused', () => {
    const result = check(
        everyBlock(PROD_DRAFT, groups => {
            groups[0].sentences = groups[0].sentences.filter(sentence => sentence.text !== `${DETAILS_10}.`)
        }),
        PROD.games,
        PROD.served,
    )
    assertRefused(result, '7.4', 'rule BOUNDED_EPISODE_OPENER) is stated by no sentence of the building team', 'restart moments')
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
    assert.deepEqual(texts(composed.scoring.blocks[0].groups[1]), [`${DETAILS_14}.`, W2.sentence])
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
    // Details 10's words and citations as ONE part: the elaboration cut would keep "restarts play" and drop every restart moment.
    const games = PROD.games.map(game => ({
        ...game,
        rendered: {
            ...game.rendered,
            instructions: game.rendered.instructions.map(instruction =>
                instruction.text === DETAILS_10 ? { ...instruction, parts: [{ text: instruction.text, status: instruction.status, from: [...instruction.from], quantities: [], bindings: [] }] } : instruction,
            ),
        },
    }))
    const draft = compose(games)
    for (const block of draft.scoring.blocks) assert.deepEqual(texts(block.groups[0]), [W1.sentence, W3.sentence, `${DETAILS_10}.`])
    assertPasses(check(draft, games, PROD.served), 'one part, said whole')
    // A forged group using the cut, claiming what Details 10 cites: refused (its kept words cite nothing whole; the moments are unstated).
    const forged = everyBlock(draft, groups => Object.assign(groups[0].sentences[2], { text: "The building team's goalkeeper restarts play.", form: 'SHORTENING' }))
    const result = check(forged, games, PROD.served)
    assertRefused(result, '7.4', 'rule BOUNDED_EPISODE_OPENER) is stated by no sentence', 'forged cut')
    assertRefused(result, '7.1', 'is a cut of a Details sentence and cites', 'its citations')
    // In production (two parts) the same cut keeps the taker, never the moments: refused as well.
    assertRefused(check(everyBlock(PROD_DRAFT, groups => Object.assign(groups[0].sentences[2], { text: "The building team's goalkeeper restarts play.", form: 'SHORTENING' })), PROD.games, PROD.served), '7.4', 'BOUNDED_EPISODE_OPENER', 'production cut')
})

test('the coach receives words and "full rule" pointers only; every pointer leads to exactly one served Details sentence', () => {
    const stored: any = { _id: 'TEST-ONLY', createdBy: 'TEST-ONLY', playerCount: 12, fieldLength: '40', fieldWidth: '30', specializedRoles: { ...none, [ROLE]: 1 } }
    const coach = reviewActivity(stored, { learningGoalId: 'A01', durationMin: 20 }) as ServedActivity
    const admin = reviewActivity(stored, { learningGoalId: 'A01', durationMin: 20 }, { includeDrafts: true }) as ServedActivity
    assert.ok(!('overviewDraft' in coach) && !('evidence' in coach))
    const overview = coach.overview!
    assert.deepEqual(Object.keys(overview).sort(), ['game', 'parameters', 'purpose', 'scoring'])
    const keysIn = (value: unknown): string[] => (Array.isArray(value) ? value.flatMap(keysIn) : value && typeof value === 'object' ? Object.entries(value).flatMap(([key, inner]) => [key, ...keysIn(inner)]) : [])
    assert.deepEqual([...new Set(keysIn(overview))].sort(), ['fullRule', 'fullRules', 'game', 'label', 'parameters', 'purpose', 'scoring', 'section', 'sentences', 'text'])
    const json = JSON.stringify(overview)
    for (const word of ['APPROVED', 'DRAFT', 'DERIVED', 'PROPOSED', 'from', 'binding', 'c:']) assert.ok(!json.includes(`"${word}`) && !json.includes(`${word}"`), word)
    const pointers = overview.scoring.flatMap(group => [...group.sentences.flatMap(s => (s.fullRule ? [s.fullRule] : [])), ...group.fullRules])
    assert.ok(pointers.length > 0)
    for (const pointer of pointers) {
        assert.equal(pointer.label, FULL_RULE_LABEL)
        assert.equal(coach.rendered.instructions.filter(instruction => instruction.section === pointer.section && instruction.text === pointer.text).length, 1, pointer.text)
    }
    // The administrator sees the same overview, with each sentence's status in the draft (never on the coach's).
    assert.deepEqual(admin.overview, overview)
    assert.deepEqual(
        admin.overviewDraft!.presented!.scoring.flatMap(group => group.sentences.map(s => [s.wording, (s.source as any)?.id ?? null])),
        [['APPROVED', 'A01-W1'], ['APPROVED', 'A01-W3'], ['DRAFT', null], ['DRAFT', null], ['APPROVED', 'A01-W2']],
    )
    assert.deepEqual([admin.overviewDraft!.presented!.purpose!.wording, admin.overviewDraft!.presented!.game.wording, admin.overviewDraft!.presented!.parameters.wording], ['APPROVED', 'DRAFT', 'DRAFT'])
})

test('word counts and reading seconds are evidence, never a gate', () => {
    const admin = buildActivityForReview(a01At(12, 1), { includeDrafts: true }) as ServedActivity
    const reading = admin.overviewDraft!.reading!
    const words = (text: string) => text.split(' ').filter(Boolean).length
    const overview = admin.overview!
    const counted = words(overview.purpose!) + words(overview.game) + words(overview.parameters) + overview.scoring.reduce((n, group) => n + group.sentences.reduce((m, s) => m + words(s.text), 0), 0)
    assert.equal(reading.words, counted)
    assert.equal(reading.secondsAt250Wpm, Math.round((counted / 250) * 60))
    assert.equal(reading.secondsAt200Wpm, Math.round((counted / 200) * 60))
    assert.equal(reading.detailsWords, admin.rendered.instructions.reduce((n, instruction) => n + words(instruction.text), 0))
    assert.ok(reading.basis.startsWith('Evidence only'))
    // A longer overview (his eligibility sentence said twice, TEST-ONLY) is not refused for its length; no finding speaks of words or seconds.
    const longer = everyBlock(PROD_DRAFT, groups => groups[0].sentences.push(copy(groups[0].sentences[1])))
    const result = check(longer, PROD.games, PROD.served)
    assertPasses(result, 'longer')
    assert.ok(!result.findings.some(f => /\b(words?|seconds?|reading time)\b/i.test(f.what)))
    // The administrator's review evidence carries the overview's evidence as the build checked it.
    assert.deepEqual(admin.evidence!.overview, overviewEvidenceOf(admin.overviewDraft!))
    assert.equal(admin.evidence!.overview!.verdict, 'PASS')
    assert.deepEqual(admin.evidence!.overview!.reading, reading)
})

test('the module names nothing of the first activity', () => {
    const source = fs.readFileSync(path.join(__dirname, 'overview-fidelity.ts'), 'utf8')
    const code = source
        .split('\n')
        .filter(line => !/^\s*(\*|\/\*\*|\/\/)/.test(line))
        .join('\n')
    for (const row of sessionPlanningModel.learningGoals()) assert.ok(!new RegExp(`\\b${row['ID']}\\b`).test(code), String(row['ID']))
    for (const literal of ['RPC-0', 'GF2', 'A01-', 'BUILDING', 'PRESSING', 'goalkeeper', 'halfway', 'BOUNDED_CREDIT', 'ORIGIN_CONDITION', 'progression', "'V30'", 'WHOLE_GAME']) assert.ok(!code.includes(literal), literal)
    for (const value of ['5', '20', '30', '40', '12']) assert.ok(!new RegExp(`(^|[^\\w.])${value}([^\\w.]|$)`).test(code), `the number ${value} is typed in the code`)
})

console.log(`overview-fidelity.unit.ts — ${passed} passed`)
