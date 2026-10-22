/**
 * His four distinctions held by the general completeness mechanism, and adjustments kept out of the overview — C1, 24 October 2026.
 *
 * His reply filed 24 October 2026, item 1: *"I agree with your interpretation of the approved scoring statements."* *"The overview
 * appropriately distinguishes: Controlled progression beyond the marked line. The requirement that the build-out begin with the goalkeeper.
 * The loss of scoring eligibility following a turnover or ball out. The pressing team's controlled-entry and controlled-regain
 * objectives."* *"Please preserve these distinctions in the general abbreviation and completeness mechanisms."* *"An overview should be
 * evaluated for whether its combined meaning accurately represents the full rules, not merely whether particular phrases or citations
 * appear."* Item 3: *"I would retain brief, knowledge-grounded explanations of the potential consequences of adjustments, but place them in
 * Coach Details rather than the initial overview."*
 *
 * Pinned here on the real chain, through the general mechanism only — the essentials table's rules, the recorded readings of his wording and
 * the agreement check (Q7); the distinctions below are this test's data, never a code path:
 *
 *   1. in the served A01 overview (12/1, 12/2, 11/1, both blocks) each distinction is STATED by meaning: the check's own reading gives every
 *      field of the rules carrying it as stated, completely, by the sentence carrying it; his words there are read by a reading he approved
 *      (the pressing team's line, a DRAFT cut of a DRAFT Details sentence, by the words of the parts it keeps whole), and the reading's own
 *      words of his for those fields are found in that sentence;
 *   2. one mutation per distinction (two for the pressing team's: its entry and its regain): removing the sentence carrying it is refused
 *      (Q7.4, and Q7.5 where it is a way to score), so the overview is withheld — even where another sentence still cites the same fields,
 *      or a "full rule" pointer still leads to the sentence saying it in full: meaning, never citations or phrases;
 *   3. adjustments (his item 3): the brief consequence explanations stay in Coach Details, DRAFT and unchanged, and appear nowhere in the
 *      overview; Q7.4 refuses an overview sentence said from an adjustment sentence, one carrying a clause of one (his consequence example
 *      among them), and one citing a field only adjustment sentences cite.
 */
import assert from 'node:assert/strict'

import { ApprovedWording, approvedWording } from './approved-wording'
import { APPROVED_READING_RECORD, recordedReading } from './approved-wording-readings'
import { buildActivityForReview, buildActivityWithFixture, RefusedActivity, ServedActivity } from './build-activity'
import { CoachOverviewDraft, coachOverviewDraftOf, DetailsPointer, FULL_RULE_LABEL, ScoringGroup, ScoringSentence } from './coach-overview'
import { checkOverview, OverviewCheck } from './overview-fidelity'
import { Instruction, renderConcreteGame } from './render-concrete-game'
import { ADJUSTING } from './sections'
import { specializedRoleNames } from './session-envelope'

let passed = 0
function test(name: string, body: () => void): void {
    body()
    passed++
    console.log(`  ok  ${name}`)
}
console.log('his four distinctions in the general completeness mechanism, and adjustments kept out of the overview (C1)')

const ROLE = specializedRoleNames()[0]
const none = Object.fromEntries(specializedRoleNames().map(role => [role, 0]))
const a01At = (players: number, keepers: number) => ({
    kind: 'learning-goal' as const,
    goalId: 'A01',
    situationId: null,
    session: { players, lengthM: 40, widthM: 30, durationMin: 20, roles: { ...none, [ROLE]: keepers } },
})
const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value))
const entryOf = (id: string): ApprovedWording => approvedWording().find(entry => entry.id === id)!

type Game = { blockId: string; fixture: any; rendered: { instructions: Instruction[] } }
/** One build's games, each with its own Details render, and the Details a coach is served. */
function gamesOf(players: number, keepers: number): { games: Game[]; served: Instruction[] } {
    const built = buildActivityWithFixture(a01At(players, keepers))
    assert.equal(built.activity.outcome, 'served', JSON.stringify((built.activity as RefusedActivity).reasons))
    const games = ((built.fixture as any).roleBlocks.blocks as any[]).map(block => ({ blockId: block.blockId, fixture: block.fixture, rendered: renderConcreteGame(block.fixture) }))
    return { games, served: (built.activity as ServedActivity).rendered.instructions }
}
const check = (draft: CoachOverviewDraft, games: Game[], served: Instruction[]): OverviewCheck =>
    checkOverview({ goalId: 'A01', draft, blocks: games.map(game => ({ blockId: game.blockId, fixture: game.fixture, rendered: game.rendered.instructions })), served })
const violations = (result: OverviewCheck) => result.findings.filter(finding => finding.severity === 'VIOLATION')
const anyViolation = (result: OverviewCheck, question: string, includes: string) => violations(result).some(finding => finding.question === question && finding.what.includes(includes))
const assertRefused = (result: OverviewCheck, question: string, includes: string, what: string) =>
    assert.ok(result.verdict === 'FAIL' && anyViolation(result, question, includes), `${what}: expected Q${question} "${includes}" in ${JSON.stringify(violations(result).map(f => `Q${f.question} ${f.what}`), null, 1)}`)
/** A copy of the draft with `change` applied to every block's groups (so the blocks still agree, Q7.8, and only the change is tested). */
const everyBlock = (draft: CoachOverviewDraft, change: (groups: ScoringGroup[], block: number) => void): CoachOverviewDraft => {
    const changed = copy(draft)
    changed.scoring.blocks.forEach((block, n) => change(block.groups, n))
    return changed
}

const W1 = entryOf('A01-W1')
const W2 = entryOf('A01-W2')
const W3 = entryOf('A01-W3')
/** The served overview's scoring lines (the 23 October email's "WHAT A COACH SEES FIRST"). */
const LINE_W1_S1 = 'Building team: Score by carrying the ball beyond the marked line or passing to a teammate who receives it under control beyond the line.'
const LINE_W1_S2 = "The progression must begin with the goalkeeper's build-out and occur before the building team loses possession."
const LINE_W3 = W3.sentence
const LINE_PRESSING = 'Pressing team: Score by getting the ball under control into its target zone.'
const LINE_REGAIN = 'The pressing team also scores by winning the ball inside that zone, provided it genuinely establishes possession.'

/**
 * **His four distinctions, as this test reads them onto the general mechanism** (his item 1's words; the rules are the essentials table's,
 * by id, and carry no activity): each with the team's group, the rules whose fields together are the distinction, and the overview line
 * carrying it. His fourth names two objectives, so it is two rows here: the controlled entry (the event the pressing team scores by) and the
 * controlled regain (the occurrence that also counts, with its genuine-possession condition).
 */
const DISTINCTIONS: { his: string; part: string; group: 'BUILDING' | 'PRESSING'; rules: string[]; carriedBy: string; approvedReading: boolean }[] = [
    { his: 'Controlled progression beyond the marked line.', part: 'controlled progression', group: 'BUILDING', rules: ['PROGRESSION_CONDITION', 'CONTROL_CONDITION'], carriedBy: LINE_W1_S1, approvedReading: true },
    { his: 'The requirement that the build-out begin with the goalkeeper.', part: 'the goalkeeper origin', group: 'BUILDING', rules: ['ORIGIN_CONDITION'], carriedBy: LINE_W1_S2, approvedReading: true },
    { his: 'The loss of scoring eligibility following a turnover or ball out.', part: 'the loss of eligibility', group: 'BUILDING', rules: ['BOUNDED_CREDIT'], carriedBy: LINE_W3, approvedReading: true },
    { his: "The pressing team's controlled-entry and controlled-regain objectives.", part: 'controlled entry', group: 'PRESSING', rules: ['SCORING_EVENT'], carriedBy: LINE_PRESSING, approvedReading: false },
    { his: "The pressing team's controlled-entry and controlled-regain objectives.", part: 'controlled regain', group: 'PRESSING', rules: ['ALSO_COUNTS_TEAM_AND_TRIGGER', 'ALSO_COUNTS_CONTROL'], carriedBy: LINE_REGAIN, approvedReading: true },
]

const PROD = gamesOf(12, 1)
const SERVED_DRAFT = coachOverviewDraftOf('A01', PROD.games)

test('1. in the served overview each of his distinctions is STATED by meaning, by the sentence carrying it, read by a reading he approved', () => {
    for (const [players, keepers] of [[12, 1], [12, 2], [11, 1]] as const) {
        const what = `A01 ${players}/${keepers}`
        const admin = buildActivityForReview(a01At(players, keepers), { includeDrafts: true }) as ServedActivity
        const draft = admin.overviewDraft!
        assert.equal(draft.check!.verdict, 'PASS', what)
        assert.ok(admin.overview, `${what}: served`)
        for (const read of draft.check!.read) {
            const scoring = draft.scoring.blocks.find(block => block.blockId === read.blockId)!
            for (const distinction of DISTINCTIONS) {
                const at = `${what} ${read.blockId}: ${distinction.part}`
                const group = read.groups.find(entry => entry.group === distinction.group)!
                const composed = scoring.groups.find(entry => entry.group === distinction.group)!
                const carrying = composed.sentences.findIndex(sentence => sentence.text === distinction.carriedBy)
                assert.ok(carrying >= 0, `${at}: the line carrying it is in the team's group`)
                // Every element of every rule carrying it: material, stated completely, and by the line carrying it.
                for (const rule of distinction.rules) {
                    const elements = group.elements.filter(element => element.rule === rule)
                    assert.ok(elements.length > 0, `${at}: the team's full rule holds ${rule}`)
                    for (const element of elements) {
                        assert.deepEqual([element.material, element.complete], [true, true], `${at}: ${rule} ${element.element}`)
                        assert.ok(element.statedBy.includes(carrying), `${at}: ${rule} is stated by "${distinction.carriedBy}" (stated by ${JSON.stringify(element.statedBy)})`)
                        // What the check read that line as stating holds each field of it: its meaning, not its citations.
                        assert.ok(element.fields.every(field => group.sentences[carrying].states.includes(field)), `${at}: ${rule}: every field read as stated by the line`)
                    }
                }
                // His words in that line are read by a reading he approved; the pressing team's DRAFT line names none.
                const sentence: ScoringSentence = composed.sentences[carrying]
                if (distinction.approvedReading) assert.deepEqual(sentence.reading, APPROVED_READING_RECORD, `${at}: read by a reading he approved`)
                else assert.deepEqual([sentence.wording, sentence.reading], ['DRAFT', null], `${at}: DRAFT, read by the words of the parts it keeps whole`)
            }
        }
    }
    // The readings' own words of his for those fields lie in the lines carrying them (the record's statedBy, checked against his entries).
    const reading = recordedReading()
    const whole = (sentence: number) => [{ sentence, part: 'WHOLE_SENTENCE' as const }]
    const wordsOf = (entry: ApprovedWording, units: { sentence: number; part: 'WHOLE_SENTENCE' | 'LEADING_CLAUSE' }[]) => reading.explain!(entry, units)!.states.map(state => state.statedBy)
    for (const [entry, units, line] of [
        [W1, whole(0), LINE_W1_S1],
        [W1, whole(1), LINE_W1_S2],
        [W3, whole(0), LINE_W3],
        [W2, [{ sentence: 0, part: 'LEADING_CLAUSE' as const }], LINE_REGAIN],
    ] as const) {
        const words = wordsOf(entry, [...units])
        assert.ok(words.length > 0 && words.every(said => line.includes(said)), `${entry.id}: ${JSON.stringify(words)}`)
        assert.deepEqual(reading.recordFor!(entry, [...units]), APPROVED_READING_RECORD, entry.id)
    }
    assert.ok(wordsOf(W1, whole(0)).includes('under control') && wordsOf(W1, whole(0)).includes('beyond the marked line'), 'controlled, and beyond the marked line')
    assert.ok(wordsOf(W1, whole(1)).includes("the goalkeeper's build-out"), 'the build-out begins with the goalkeeper')
    assert.ok(wordsOf(W2, [{ sentence: 0, part: 'LEADING_CLAUSE' }]).includes('provided it genuinely establishes possession'), 'genuinely established possession')
})

test('2. removing the sentence carrying each distinction withholds the overview, whatever still cites its fields or points to them', () => {
    // The unmutated draft agrees (the baseline every mutation departs from).
    assert.equal(check(SERVED_DRAFT, PROD.games, PROD.served).verdict, 'PASS')
    for (const distinction of DISTINCTIONS) {
        const without = everyBlock(SERVED_DRAFT, groups => {
            const group = groups.find(entry => entry.group === distinction.group)!
            const before = group.sentences.length
            group.sentences = group.sentences.filter(sentence => sentence.text !== distinction.carriedBy)
            assert.equal(group.sentences.length, before - 1, `${distinction.part}: exactly the line carrying it is removed`)
            // Keep exactly one line saying how the team scores, first, so only the distinction's absence is tested.
            if (group.sentences.length && !group.sentences.some(sentence => sentence.place === 'LEAD')) group.sentences[0].place = 'LEAD'
        })
        const result = check(without, PROD.games, PROD.served)
        assert.equal(result.verdict, 'FAIL', `${distinction.part}: the overview is withheld`)
        for (const rule of distinction.rules) assertRefused(result, '7.4', `rule ${rule}) is stated by no sentence`, `${distinction.part}: ${rule}`)
    }
    // Citations are not meaning: without his second building sentence his eligibility sentence still cites every field of the origin, and
    // the origin is still refused as unstated.
    const origin = DISTINCTIONS[1]
    const withoutOrigin = everyBlock(SERVED_DRAFT, groups => {
        groups[0].sentences = groups[0].sentences.filter(sentence => sentence.text !== origin.carriedBy)
    })
    const originFields = SERVED_DRAFT.scoring.blocks[0].groups[0].requirements.filter(requirement => requirement.rule === 'ORIGIN_CONDITION').map(requirement => requirement.path)
    const eligibility = withoutOrigin.scoring.blocks[0].groups[0].sentences.find(sentence => sentence.text === LINE_W3)!
    assert.ok(originFields.length > 0 && originFields.every(path => eligibility.from.includes(path)), 'his eligibility sentence cites the origin')
    assertRefused(check(withoutOrigin, PROD.games, PROD.served), '7.4', 'rule ORIGIN_CONDITION) is stated by no sentence', 'cited, not stated')
    // A pointer is not meaning either: without his eligibility sentence, a "full rule" pointer to it, for the eligibility, does not excuse it.
    const pointed = everyBlock(SERVED_DRAFT, (groups, n) => {
        const building = groups[0]
        building.sentences = building.sentences.filter(sentence => sentence.text !== LINE_W3)
        const instructions = PROD.games[n].rendered.instructions
        const pointer: DetailsPointer = {
            blockIndex: instructions.findIndex(instruction => instruction.text === W3.sentence),
            section: 'How to score',
            text: W3.sentence,
            label: FULL_RULE_LABEL,
            labelStatus: 'DRAFT',
            because: ['DETAIL_LEFT_OUT'],
            paths: SERVED_DRAFT.scoring.blocks[n].groups[0].requirements.filter(requirement => requirement.rule === 'BOUNDED_CREDIT').map(requirement => requirement.path),
        }
        building.fullRules.push(pointer)
    })
    assertRefused(check(pointed, PROD.games, PROD.served), '7.4', 'rule BOUNDED_CREDIT) is stated by no sentence of the building team\'s group: a pointer never excuses it', 'pointed to, not stated')
    // The pressing team's ways to score: without its entry line or its regain clause, that way is said by no sentence (Q7.5) as well.
    const withoutRegain = everyBlock(SERVED_DRAFT, groups => {
        groups[1].sentences = groups[1].sentences.filter(sentence => sentence.text !== LINE_REGAIN)
    })
    assertRefused(check(withoutRegain, PROD.games, PROD.served), '7.5', 'is said by no sentence of the pressing team\'s group', 'the regain, a way to score')
})

test("3. his adjustments' consequences stay in Coach Details, and Q7.4 refuses an adjustment, or a clause or field of one, in the overview", () => {
    const admin = buildActivityForReview(a01At(12, 1), { includeDrafts: true }) as ServedActivity
    const adjusting = admin.rendered.instructions.filter(instruction => instruction.section === ADJUSTING)
    // In Coach Details, under adjusting, unchanged and DRAFT (his item 3 keeps them; no wording changed): his example's consequence and the
    // other one.
    const consequence = 'adding a pressing player can increase pressure but may also expose space behind the press'
    const support = "reducing the building team's available support options"
    assert.ok(adjusting.some(instruction => instruction.text.endsWith(`: ${consequence}`)), 'the added pressing player, with its consequence')
    assert.ok(adjusting.some(instruction => instruction.text.endsWith(support)), 'the removed build-out player, with its consequence')
    const statuses = admin.evidence!.sections.instructions.filter(sentence => sentence.text.includes(consequence) || sentence.text.includes(support)).map(sentence => sentence.wording)
    assert.deepEqual(statuses, ['DRAFT', 'DRAFT'])
    // Nowhere in the overview: not in what a coach is served, nor in any sentence of the draft, in either block.
    const said = JSON.stringify(admin.overview).toLowerCase()
    for (const instruction of adjusting) for (const clause of instruction.text.split(/: |; /)) assert.ok(!said.includes(clause.toLowerCase()), clause)
    assert.ok(!violations(admin.overviewDraft!.check!).length)

    const games = PROD.games
    const atBlock = (n: number) => games[n].rendered.instructions
    const adjustmentOf = (n: number) => atBlock(n).findIndex(instruction => instruction.section === ADJUSTING && instruction.text.endsWith(`: ${consequence}`))
    assert.ok(games.every((_, n) => adjustmentOf(n) >= 0), 'each block says it')
    // (a) The adjustment sentence said whole in the pressing team's group (DRAFT, its own citations).
    const whole = everyBlock(SERVED_DRAFT, (groups, n) => {
        const instruction = atBlock(n)[adjustmentOf(n)]
        groups[1].sentences.push({
            ...copy(groups[1].sentences[0]),
            text: `${instruction.text}.`,
            wording: 'DRAFT',
            source: null,
            chosenBy: 'DETAILS_SENTENCE',
            form: 'WHOLE',
            extractId: null,
            details: { blockIndex: adjustmentOf(n), section: instruction.section, text: instruction.text },
            drops: [],
            from: [...instruction.from],
            bindings: [],
            states: [],
            fullRule: null,
            reading: null,
            place: 'QUALIFICATION',
        })
    })
    assertRefused(check(whole, games, PROD.served), '7.4', 'a sentence for adjusting the activity: adjustments and their consequences stay in Coach Details', 'the adjustment said whole')
    // (b) His consequence example carried inside the pressing team's own line (its words and citations otherwise its own).
    const carried = everyBlock(SERVED_DRAFT, groups => {
        const lead = groups[1].sentences[0]
        lead.text = `${lead.text.slice(0, -1)}; ${consequence.charAt(0).toUpperCase()}${consequence.slice(1)}.`
    })
    assertRefused(check(carried, games, PROD.served), '7.4', `carries the words "${consequence}"`, 'the consequence inside a line')
    // (c) In the game sentence.
    const inGame = copy(SERVED_DRAFT)
    for (const block of inGame.blocks) {
        const sentence = block.game!
        const last = sentence.parts[sentence.parts.length - 1]
        last.text = `${last.text.slice(0, -1)}: ${consequence}.`
        sentence.text = sentence.parts.map(part => part.text).join('')
    }
    assertRefused(check(inGame, games, PROD.served), '7.4', `the game sentence "${inGame.blocks[0].game!.text}" carries the words "${consequence}"`, 'the consequence in the game sentence')
    // (d) A line citing a field only adjustment sentences cite (the consequence's own field).
    const cited = everyBlock(SERVED_DRAFT, (groups, n) => {
        const field = atBlock(n)[adjustmentOf(n)].from.find(path => path.endsWith('.consequence'))!
        groups[1].sentences[1].from.push(field)
    })
    assertRefused(check(cited, games, PROD.served), '7.4', 'which only sentences for adjusting the activity cite', 'a field of an adjustment')
})

console.log(`overview-distinctions.unit.ts — ${passed} passed`)
