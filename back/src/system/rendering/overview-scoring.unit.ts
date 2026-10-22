/**
 * How each team scores in the Coach Overview: the PROPOSED essentials table and the scoring-group composer — stage 3C, 21 October 2026.
 *
 * His reply filed 22 October 2026, item 6: *"Yes. The overview should briefly communicate the scoring objectives."* and *"the overview
 * should not reproduce every qualification, exception, and restart condition. Those belong in Coach Details, with any essential
 * qualification included in the overview when omitting it would materially misrepresent the game."* Item 4: *"Shortening must not
 * introduce new meanings, omit a condition that changes the essential understanding, or silently turn a qualified rule into an
 * unrestricted one."*
 *
 * Pinned here, on the real chain:
 *
 *   1. the table: the production file loads as PROPOSED (no approvedBy), keyed by register rows, copied beside the bundle, and every
 *      overview built on it is labelled for an administrator;
 *   2. the loader refuses unknown classes, rules keyed by an activity (a key, a goal, an approved entry, a demonstration, an element), rows
 *      that are no register row, ways that are no collection, an APPROVED status without his approval, and a row classed twice; an
 *      unusable table withholds every group, never the activity;
 *   3. production A01 (12/1, 12/2, 11/1, both blocks): with no reading recorded no extract keeps anything, so his entries holding a DETAIL
 *      are said whole, beside the entry holding none; the restart moments and the pressing team's way to score are DRAFT shortenings of
 *      their Details sentences; every DETAIL left out and every shortened way to score points to its Details sentence; the same words in
 *      both blocks; the built activity's admin draft is exactly this;
 *   4. with a TEST-ONLY reading (not his, and not ours to record) the composer gives the EXPECTED PRESENTATION's overview sentences 4, 5,
 *      7 and 8 word for word with their statuses, and sentence 6 as a cut of Details 10;
 *   5. flipping a class in the table changes the composed group (the table decides, not code);
 *   6. without his building-team eligibility entry the extract of his first sentence never stands alone: another statement of the bound
 *      and the origin is found (his first sentence whole, or its first two sentences under a reading of them);
 *   7. nothing is left out by default: a How to score sentence citing a scoring row the table does not class withholds the groups it
 *      speaks for, and a way to score with no CONSTITUTIVE field cannot be shown to appear;
 *   8. DRAFT shortenings are prefixes of their sentence, never a word added or changed, citing only what the rule of their cut keeps;
 *   9. the demonstrations at every role case (the refused one has none), and a second synthetic Learning Goal (TEST-ONLY), by the same
 *      rules;
 *  10. only an administrator's answer carries it; the module and the table name nothing of the first activity.
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { reviewActivity } from './activity-review'
import { APPROVED_WORDING_FILE, ApprovedWording, approvedWording } from './approved-wording'
import { buildActivity, buildActivityForReview, buildActivityWithFixture, RefusedActivity, ServedActivity } from './build-activity'
import {
    activityNames,
    coachOverviewDraftOf,
    draftShorteningsOf,
    EssentialsLoad,
    essentialsLoadOf,
    essentialsTable,
    essentialsUnusableBecause,
    EVERY_TEAM,
    FULL_RULE_LABEL,
    PROPOSED_TABLE_LABEL,
    ScoringGroup,
    scoringGroupsOf,
} from './coach-overview'
import { CoverReading, extractsFor } from './derived-wording'
import { MECHANISM_DEMONSTRATIONS } from './mechanism-demonstrations'
import { renderConcreteGame } from './render-concrete-game'
import { specializedRoleNames } from './session-envelope'

let passed = 0
function test(name: string, body: () => void): void {
    body()
    passed++
    console.log(`  ok  ${name}`)
}
console.log('how each team scores in the Coach Overview: the PROPOSED essentials table and the scoring-group composer (stage 3C)')

const ROLE = specializedRoleNames()[0]
const none = Object.fromEntries(specializedRoleNames().map(role => [role, 0]))
const sessionAt = (players: number, keepers: number) => ({ players, lengthM: 40, widthM: 30, durationMin: 20, roles: { ...none, [ROLE]: keepers } })
const a01At = (players: number, keepers: number) => ({ kind: 'learning-goal' as const, goalId: 'A01', situationId: null, session: sessionAt(players, keepers) })
const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value))
const blocksOf = (fixture: any): { blockId: string; fixture: any }[] => ((fixture?.roleBlocks?.blocks ?? []) as any[]).map(block => ({ blockId: block.blockId, fixture: block.fixture }))
const admin = (request: any): ServedActivity => {
    const activity = buildActivityForReview(request, { includeDrafts: true }) as ServedActivity
    assert.equal(activity.outcome, 'served', JSON.stringify((activity as unknown as RefusedActivity).reasons))
    return activity
}
const TABLE_FILE = path.resolve(__dirname, '../../../../docs/audits/overview-essentials.json')
const TABLE = JSON.parse(fs.readFileSync(TABLE_FILE, 'utf8'))
/** A TEST-ONLY copy of the table, changed by `change`, loaded through the production loader. */
const tableWith = (change: (file: any) => void): EssentialsLoad => {
    const file = copy(TABLE)
    change(file)
    return essentialsLoadOf(file)
}
const ruleOf = (file: any, id: string) => file.rules.find((rule: any) => rule.id === id)

const entryOf = (id: string): ApprovedWording => approvedWording().find(entry => entry.id === id)!
const W1 = entryOf('A01-W1')
const W2 = entryOf('A01-W2')
const W3 = entryOf('A01-W3')
/** The BUILD PLAN's EXPECTED PRESENTATION, overview sentences 4, 5, 7 and 8, and its sentence 6 as written there (DRAFT). */
const OVERVIEW_4 = 'Building team: Score by carrying the ball beyond the marked line or passing to a teammate who receives it under control beyond the line.'
const OVERVIEW_5 = 'If the building team loses possession or plays the ball out, it cannot score again until the next goalkeeper restart.'
const OVERVIEW_6_AS_WRITTEN = "The building team's goalkeeper restarts play at the start, after either team scores and whenever you decide an attack has run its course."
const OVERVIEW_7 = 'Pressing team: Score by getting the ball under control into its target zone.'
const OVERVIEW_8 = 'The pressing team also scores by winning the ball inside that zone, provided it genuinely establishes possession.'
/** Sentence 6 as the composer cuts it from Details 10: its own words up to the bracketed aside (no word added or changed). */
const OVERVIEW_6_CUT = "The building team's goalkeeper restarts play: at the start, after either team scores and whenever you decide that an attack has run its course."
const DETAILS_10 = "The building team's goalkeeper restarts play: at the start, after either team scores and whenever you decide that an attack has run its course (at a stoppage or while play is on)"
const DETAILS_14 = 'Pressing team: Score by getting the ball under control into its target zone: running it in, or passing to a teammate who receives it under control inside'
const DETAILS_16 = 'Each score is worth 1 point'

/**
 * A TEST-ONLY reading of what parts of his entries state: his first sentence of the building team's rule keeps the progression and
 * control covers (indexes 4-11 of the entry), the leading clause of the regain sentence keeps its team, trigger and control (0-2). NOT his
 * reading and not ours to record (the 3B escalation): a test hands it, to show what the composer does once one is recorded.
 */
const READING: CoverReading = (entry, units) => {
    if (entry.id === 'A01-W1' && units.length === 1 && units[0].sentence === 0 && units[0].part === 'WHOLE_SENTENCE') return [4, 5, 6, 7, 8, 9, 10, 11]
    if (entry.id === 'A01-W2' && units.length === 1 && units[0].part === 'LEADING_CLAUSE') return [0, 1, 2]
    return null
}
const withReading = (reading: CoverReading, wording?: ApprovedWording[]) => (game: any) => extractsFor(game, { reading, ...(wording ? { wording } : {}) })
const groupsOf = (draft: { scoring: { blocks: { groups: ScoringGroup[] }[] } }, block = 0) => draft.scoring.blocks[block].groups
const textsOf = (group: ScoringGroup) => group.sentences.map(sentence => sentence.text)

/** Every CONSTITUTIVE and ESSENTIAL field a served group requires is stated by one of its sentences; every DETAIL is stated or pointed to. */
function assertComplete(group: ScoringGroup, what: string): void {
    assert.equal(group.withheld, false, `${what}: ${JSON.stringify(group.why)}`)
    for (const requirement of group.requirements) {
        if (requirement.class === 'DETAIL') assert.ok(requirement.statedBy.length > 0 || requirement.pointedTo, `${what}: ${requirement.path} neither stated nor pointed to`)
        else assert.ok(requirement.statedBy.length > 0, `${what}: ${requirement.class} ${requirement.path} is stated by no sentence`)
    }
    for (const way of group.ways) assert.ok(way.shownBy.length > 0, `${what}: way ${way.way}`)
}

test('1. the table: PROPOSED (no approvedBy), keyed by register rows, copied beside the bundle; an overview built on it is labelled', () => {
    assert.equal(TABLE.status, 'PROPOSED')
    assert.ok(!('approvedBy' in TABLE), 'the PROPOSED table carries no approval')
    const load = essentialsTable()
    assert.equal(load.why, null)
    assert.equal(load.table!.status, 'PROPOSED')
    assert.equal(load.table!.approvedBy, null)
    assert.deepEqual(load.table!.rules, TABLE.rules)
    // The BUILD PLAN's classes are each carried by a rule (stage 3C): every way to score; a bound other than the whole game, the origin and
    // the transitions beginning a bounded role's episode; the exclusion and the also-counts exclusion.
    const classOf = (id: string) => ruleOf(TABLE, id).class
    assert.deepEqual(
        ['EVERY_WAY_TO_SCORE', 'BOUNDED_CREDIT', 'ORIGIN_CONDITION', 'BOUNDED_EPISODE_OPENER', 'EXCLUSION_CONDITION', 'ALSO_COUNTS_EXCLUSION'].map(classOf),
        ['CONSTITUTIVE', 'ESSENTIAL', 'ESSENTIAL', 'ESSENTIAL', 'DETAIL', 'DETAIL'],
    )
    assert.deepEqual(ruleOf(TABLE, 'EVERY_WAY_TO_SCORE').ways, ['V0', 'V27', 'V7'])
    assert.deepEqual(ruleOf(TABLE, 'BOUNDED_CREDIT').where, { field: 'creditedWithin', notEquals: 'WHOLE_GAME' })
    // build.js copies it into dist/knowledge, where the bundled server reads it.
    assert.ok(fs.readFileSync(path.resolve(__dirname, '../../../build.js'), 'utf8').includes("'overview-essentials.json'"))
    // The administrator's draft names the table and labels it while PROPOSED (DRAFT words).
    const draft = admin(a01At(12, 1)).overviewDraft!
    assert.deepEqual(draft.scoring.table, { source: 'docs/audits/overview-essentials.json', status: 'PROPOSED', label: PROPOSED_TABLE_LABEL, labelStatus: 'DRAFT', why: null })
})

test('2. the loader refuses unknown classes, activity-keyed rules, rows that are not register rows, and an approval it does not carry', () => {
    const refused = (change: (file: any) => void, starts: string) => {
        const file = copy(TABLE)
        change(file)
        const why = essentialsUnusableBecause(file)
        assert.ok(why && why.includes(starts), `${starts} :: ${why}`)
        assert.equal(essentialsLoadOf(file).table, null)
    }
    assert.equal(essentialsUnusableBecause(copy(TABLE)), null)
    refused(file => (ruleOf(file, 'SCORE_VALUE').class = 'OPTIONAL'), 'its class "OPTIONAL" is not one the overview knows')
    refused(file => (file.classes.OPTIONAL = 'TEST-ONLY'), 'the overview knows exactly CONSTITUTIVE, ESSENTIAL, DETAIL')
    // Keyed by activity: a key naming one, or a goal, an approved entry, a demonstration or an element handle as a value.
    refused(file => (ruleOf(file, 'SCORE_VALUE').goal = 'A01'), 'it is keyed by "goal": a rule is keyed by register row and condition type, never by activity')
    refused(file => (ruleOf(file, 'SCORE_VALUE').activity = 'TEST-ONLY'), 'it is keyed by "activity"')
    refused(file => (ruleOf(file, 'ORIGIN_CONDITION').where.equals = 'A01'), 'it names "A01", an activity')
    refused(file => (ruleOf(file, 'ORIGIN_CONDITION').where.equals = 'A01-W3'), 'it names "A01-W3"')
    refused(file => (ruleOf(file, 'ORIGIN_CONDITION').where.equals = 'scoring-modifier'), 'it names "scoring-modifier"')
    refused(file => (ruleOf(file, 'ORIGIN_CONDITION').where.equals = 'c:restated:TEST-ONLY:1'), 'it names "c:restated:TEST-ONLY:1"')
    refused(file => (ruleOf(file, 'SCORE_VALUE').id = 'TA01'), 'it names "TA01"')
    for (const id of ['A01', 'TA01', 'scoring-modifier', 'A01-W1']) assert.ok(activityNames().has(id), id)
    // Rows and ways.
    refused(file => (ruleOf(file, 'SCORE_VALUE').rows = ['TEST-ONLY']), 'it names "TEST-ONLY", which is no register row')
    refused(file => (ruleOf(file, 'EVERY_WAY_TO_SCORE').ways = ['V1']), 'its way V1 is not a collection')
    refused(file => (ruleOf(file, 'EVERY_WAY_TO_SCORE').where = { beginsBoundedEpisode: true }), 'the way-level rule takes no element condition')
    refused(file => (ruleOf(file, 'SCORE_VALUE').ways = ['V0']), 'exactly one of them')
    refused(file => (ruleOf(file, 'ORIGIN_CONDITION').where = { field: 'type', is: 'origin' }), 'its element condition holds "field,is"')
    refused(file => (ruleOf(file, 'BOUNDED_EPISODE_OPENER').where = { beginsBoundedEpisode: false }), 'beginsBoundedEpisode is only ever true')
    refused(file => file.rules.push({ ...copy(ruleOf(file, 'SCORE_VALUE')), id: 'SCORE_VALUE_AGAIN' }), 'row V2 is classed twice on the same element condition')
    refused(file => file.rules.push(copy(ruleOf(file, 'SCORE_VALUE'))), 'is listed twice')
    refused(file => delete ruleOf(file, 'SCORE_VALUE').why, 'it gives no reason')
    // The status: APPROVED only with his approval; a PROPOSED table carries none.
    refused(file => (file.status = 'APPROVED'), 'it says APPROVED and carries no approvedBy')
    refused(file => (file.approvedBy = { who: 'TEST-ONLY', date: '2026-10-21', quote: 'TEST-ONLY' }), 'it carries approvedBy and says it is PROPOSED')
    refused(file => Object.assign(file, { status: 'APPROVED', approvedBy: { who: 'TEST-ONLY' } }), 'its approval does not say who approved it, when, and in his words')
    refused(file => (file.status = 'DRAFT'), 'neither PROPOSED nor APPROVED')
    refused(file => (file.extra = true), 'the table carries "extra"')
    const approved = tableWith(file => Object.assign(file, { status: 'APPROVED', approvedBy: { who: 'TEST-ONLY', date: '2026-10-21', quote: 'TEST-ONLY' } }))
    assert.equal(approved.table!.status, 'APPROVED')
    // An unusable table withholds every group, with why; the purpose, game and parameters stand, and the activity is served as before.
    const blocks = blocksOf(buildActivityWithFixture(a01At(12, 1)).fixture)
    const broken = tableWith(file => (file.status = 'APPROVED'))
    const draft = coachOverviewDraftOf('A01', blocks, undefined, { essentials: broken })
    assert.equal(draft.scoring.table.status, 'UNUSABLE')
    assert.equal(draft.scoring.table.label, null)
    for (const block of draft.scoring.blocks) {
        assert.deepEqual(block.groups.map(group => [group.group, group.withheld, group.sentences.length]), [['BUILDING', true, 0], ['PRESSING', true, 0]])
        for (const group of block.groups) assert.ok(group.why[0].startsWith('the essentials table cannot be used: it says APPROVED and carries no approvedBy'), group.why[0])
    }
    const whole = coachOverviewDraftOf('A01', blocks)
    assert.deepEqual([draft.purpose, draft.blocks, draft.extracts, draft.gaps], [whole.purpose, whole.blocks, whole.extracts, whole.gaps])
})

test('3. production A01: no reading recorded, so his entries holding a DETAIL are said whole; the rest DRAFT shortenings, with pointers', () => {
    for (const [players, keepers] of [[12, 1], [12, 2], [11, 1]] as const) {
        const what = `A01 ${players}/${keepers}`
        const served = admin(a01At(players, keepers))
        const draft = served.overviewDraft!
        assert.deepEqual(draft.gaps, [], what)
        assert.equal(draft.scoring.blocks.length, 2, what)
        assert.equal(draft.scoring.sameTextInEveryBlock, true, what)
        for (const [n, block] of draft.scoring.blocks.entries()) {
            const at = `${what} block ${n + 1}`
            const [building, pressing] = block.groups
            assert.deepEqual([building.group, building.noun, pressing.group, pressing.noun], ['BUILDING', 'building team', 'PRESSING', 'pressing team'], at)
            assertComplete(building, at)
            assertComplete(pressing, at)
            assert.deepEqual(textsOf(building), [W1.sentence, W3.sentence, OVERVIEW_6_CUT], at)
            assert.deepEqual(
                building.sentences.map(s => [s.wording, s.source, s.chosenBy, s.form, s.fullRule]),
                [
                    ['APPROVED', { kind: 'APPROVED_ENTRY', id: 'A01-W1' }, 'DETAILS_SENTENCE', 'WHOLE', null],
                    ['APPROVED', { kind: 'APPROVED_ENTRY', id: 'A01-W3' }, 'APPROVED_ENTRY', 'WHOLE', null],
                    ['DRAFT', null, 'DETAILS_SENTENCE', 'SHORTENING', null],
                ],
                at,
            )
            assert.equal(building.sentences[2].details.text, DETAILS_10, at)
            assert.deepEqual(building.sentences[2].drops, ['(at a stoppage or while play is on)'], at)
            assert.deepEqual(textsOf(pressing), [OVERVIEW_7, W2.sentence], at)
            assert.deepEqual(
                pressing.sentences.map(s => [s.wording, s.source, s.chosenBy, s.form]),
                [
                    ['DRAFT', null, 'DETAILS_SENTENCE', 'SHORTENING'],
                    ['APPROVED', { kind: 'APPROVED_ENTRY', id: 'A01-W2' }, 'DETAILS_SENTENCE', 'WHOLE'],
                ],
                at,
            )
            // The pressing team's way to score is said shortened, so its full rule is pointed to; his regain sentence is said whole.
            const pointer = pressing.sentences[0].fullRule!
            assert.deepEqual([pointer.text, pointer.section, pointer.label, pointer.labelStatus, pointer.because], [DETAILS_14, 'How to score', FULL_RULE_LABEL, 'DRAFT', ['SHORTENED_WAY_TO_SCORE']], at)
            assert.equal(served.rendered.instructions[pointer.blockIndex].text, DETAILS_14, at)
            assert.equal(pressing.sentences[1].fullRule, null, at)
            // The value of a score, a DETAIL said for every team, is left to Details behind a pointer in each team's group.
            for (const group of [building, pressing]) assert.deepEqual(group.fullRules.map(p => [p.text, p.because, p.paths]), [[DETAILS_16, ['DETAIL_LEFT_OUT'], ['value.primaryEvent.value']]], at)
            // Why his sentences are said whole: no reading of what a part of his wording states is recorded. Never decided here.
            assert.deepEqual(building.extractsKeepingNothing, ['A01-W1:s1', 'A01-W1:s2', 'A01-W1:s3', 'A01-W1:s1+s2', 'A01-W1:s1+s3', 'A01-W1:s2+s3'], at)
            assert.deepEqual(pressing.extractsKeepingNothing, ['A01-W2:c1'], at)
            assert.ok(building.notes[0].startsWith('A01-W1 is said whole') && pressing.notes[0].startsWith('A01-W2 is said whole'), at)
            // The restart moments: the transitions beginning the building team's episode, when and who, classed ESSENTIAL.
            assert.ok(building.requirements.filter(r => r.rule === 'BOUNDED_EPISODE_OPENER').length > 0, at)
            assert.ok(building.requirements.filter(r => r.rule === 'BOUNDED_EPISODE_OPENER').every(r => r.statedBy.includes(2)), at)
            assert.deepEqual(building.ways.map(way => way.shownBy), [[0]], at)
            assert.deepEqual(pressing.ways.map(way => way.shownBy), [[0], [1]], at)
        }
        // The draft as built is the draft composed from the block games (each block rendered by the same renderer).
        const blocks = blocksOf(buildActivityWithFixture(a01At(players, keepers)).fixture)
        assert.deepEqual(coachOverviewDraftOf('A01', blocks).scoring, draft.scoring, what)
    }
})

test('4. with a TEST-ONLY reading: the EXPECTED PRESENTATION overview sentences 4, 5, 7 and 8 word for word, with their statuses', () => {
    for (const [players, keepers] of [[12, 1], [12, 2], [11, 1]] as const) {
        const what = `A01 ${players}/${keepers}`
        const draft = coachOverviewDraftOf('A01', blocksOf(buildActivityWithFixture(a01At(players, keepers)).fixture), withReading(READING))
        assert.equal(draft.scoring.sameTextInEveryBlock, true, what)
        for (const [n, block] of draft.scoring.blocks.entries()) {
            const at = `${what} block ${n + 1}`
            const [building, pressing] = block.groups
            assertComplete(building, at)
            assertComplete(pressing, at)
            assert.deepEqual(textsOf(building), [OVERVIEW_4, OVERVIEW_5, OVERVIEW_6_CUT], at)
            assert.deepEqual(textsOf(pressing), [OVERVIEW_7, OVERVIEW_8], at)
            assert.deepEqual(
                [...building.sentences, ...pressing.sentences].map(s => [s.wording, s.source?.kind ?? null, (s.source as any)?.id ?? null, s.extractId]),
                [
                    ['DERIVED_FROM_APPROVED', 'APPROVED_ENTRY', 'A01-W1', 'A01-W1:s1'],
                    ['APPROVED', 'APPROVED_ENTRY', 'A01-W3', null],
                    ['DRAFT', null, null, null],
                    ['DRAFT', null, null, null],
                    ['DERIVED_FROM_APPROVED', 'APPROVED_ENTRY', 'A01-W2', 'A01-W2:c1'],
                ],
                at,
            )
            // "Full rule" on 4 (his first sentence: the exclusion left out, a way to score shortened), 7 and 8 (the also-counts exclusion);
            // none on 5 (said whole) or 6 (the restart moments: no DETAIL, no way to score).
            assert.deepEqual(
                [...building.sentences, ...pressing.sentences].map(s => (s.fullRule ? [s.fullRule.text, s.fullRule.because] : null)),
                [[W1.sentence, ['DETAIL_LEFT_OUT', 'SHORTENED_WAY_TO_SCORE']], null, null, [DETAILS_14, ['SHORTENED_WAY_TO_SCORE']], [W2.sentence, ['DETAIL_LEFT_OUT', 'SHORTENED_WAY_TO_SCORE']]],
                at,
            )
            // The extract keeps the progression and control; the bound and the origin are stated by his eligibility sentence beside it.
            assert.deepEqual([...new Set(building.sentences[0].states.map(s => s.class))], ['CONSTITUTIVE', 'ESSENTIAL'], at)
            for (const r of building.requirements.filter(r => r.rule === 'BOUNDED_CREDIT' || r.rule === 'ORIGIN_CONDITION')) assert.deepEqual(r.statedBy, [1], at)
            // The regain clause keeps "provided it genuinely establishes possession" (ESSENTIAL in the PROPOSED table).
            assert.ok(pressing.sentences[1].states.some(s => s.rule === 'ALSO_COUNTS_CONTROL'), at)
            assert.deepEqual(building.extractsKeepingNothing.includes('A01-W1:s1') || pressing.extractsKeepingNothing.includes('A01-W2:c1'), false, at)
        }
    }
    // Sentence 6 as the EXPECTED PRESENTATION writes it drops the colon and "that": a rewording, which no cut of Details 10 gives.
    assert.notEqual(OVERVIEW_6_CUT, OVERVIEW_6_AS_WRITTEN)
    assert.ok(DETAILS_10.startsWith(OVERVIEW_6_CUT.slice(0, -1)))
})

test('5. flipping a class in the table changes the composed group: the table decides, not code', () => {
    const blocks = blocksOf(buildActivityWithFixture(a01At(12, 1)).fixture)
    const composed = (change: (file: any) => void) => groupsOf(coachOverviewDraftOf('A01', blocks, withReading(READING), { essentials: tableWith(change) }))
    // The exclusion made ESSENTIAL: his first sentence holds no DETAIL, so it is chosen first, said whole as approved wording; it already
    // states every field his eligibility sentence covers, so that one adds nothing and is not chosen.
    const [exclusionEssential] = composed(file => (ruleOf(file, 'EXCLUSION_CONDITION').class = 'ESSENTIAL'))
    assert.deepEqual(textsOf(exclusionEssential), [W1.sentence, OVERVIEW_6_CUT])
    assert.deepEqual(exclusionEssential.sentences.map(s => [s.chosenBy, s.form, s.fullRule]), [['APPROVED_ENTRY', 'WHOLE', null], ['DETAILS_SENTENCE', 'SHORTENING', null]])
    // The also-counts exclusion made ESSENTIAL: the regain sentence is said whole.
    const [, regainEssential] = composed(file => (ruleOf(file, 'ALSO_COUNTS_EXCLUSION').class = 'ESSENTIAL'))
    assert.deepEqual(textsOf(regainEssential), [OVERVIEW_7, W2.sentence])
    // The restart moments made DETAIL: no restart sentence, and a pointer to Details 10 instead.
    const [openerDetail] = composed(file => (ruleOf(file, 'BOUNDED_EPISODE_OPENER').class = 'DETAIL'))
    assert.deepEqual(textsOf(openerDetail), [OVERVIEW_4, OVERVIEW_5])
    assert.ok(openerDetail.fullRules.some(p => p.text === DETAILS_10 && p.because.includes('DETAIL_LEFT_OUT')), JSON.stringify(openerDetail.fullRules))
    // The score's value made ESSENTIAL: "Each score is worth 1 point" is said, in both groups, and no longer pointed to.
    const valueEssential = composed(file => (ruleOf(file, 'SCORE_VALUE').class = 'ESSENTIAL'))
    for (const group of valueEssential) {
        assert.ok(textsOf(group).includes(`${DETAILS_16}.`), JSON.stringify(textsOf(group)))
        assert.deepEqual(group.fullRules.filter(p => p.text === DETAILS_16), [])
    }
    // The way-level rule removed: nothing else changes for this game (every way is also shown by its CONSTITUTIVE fields).
    const noWays = composed(file => (file.rules = file.rules.filter((rule: any) => rule.id !== 'EVERY_WAY_TO_SCORE')))
    assert.deepEqual(noWays.map(textsOf), groupsOf(coachOverviewDraftOf('A01', blocks, withReading(READING))).map(textsOf))
    assert.deepEqual(noWays.map(group => group.ways), [[], []])
})

test("6. without his building-team eligibility entry, the extract of his first sentence never stands alone", () => {
    const fixture = buildActivityWithFixture(a01At(12, 1)).fixture
    const withoutW3 = approvedWording().filter(entry => entry.id !== 'A01-W3')
    // TEST-ONLY: Details rendered without the entry (the build would say his first sentence, which also covers the bound and the origin).
    const blocks = blocksOf(fixture).map(block => ({ ...block, rendered: renderConcreteGame(block.fixture, withoutW3) }))
    for (const block of blocks) assert.ok(!block.rendered.instructions.some(i => i.text === W3.sentence) && block.rendered.instructions.some(i => i.text === W1.sentence))
    const states = (group: ScoringGroup, rule: string) => group.sentences.some(s => s.states.some(x => x.rule === rule))
    // (a) Only the first sentence is read: the bound and origin have no extract keeping them, so his first sentence is said whole, and the
    // extract inside it is dropped.
    const [readOne] = groupsOf(coachOverviewDraftOf('A01', blocks, withReading(READING, withoutW3), { wording: withoutW3 }))
    assert.deepEqual(textsOf(readOne), [W1.sentence, OVERVIEW_6_CUT])
    assert.deepEqual(readOne.sentences.map(s => [s.form, s.chosenBy]), [['WHOLE', 'DETAILS_SENTENCE'], ['SHORTENING', 'DETAILS_SENTENCE']])
    // (b) The first two sentences read as well (TEST-ONLY): the bound and origin are kept by the second, and the two extracts become the one
    // extract of both, listed and keeping what they keep.
    const twoRead: CoverReading = (entry, units) => {
        const id = units.map(u => `${u.part}${u.sentence}`).join('+')
        if (entry.id === 'A01-W2') return READING(entry, units)
        if (entry.id !== 'A01-W1') return null
        if (id === 'WHOLE_SENTENCE0') return [4, 5, 6, 7, 8, 9, 10, 11]
        if (id === 'WHOLE_SENTENCE1') return [0, 1, 2, 3]
        if (id === 'WHOLE_SENTENCE0+WHOLE_SENTENCE1') return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
        return null
    }
    const [readTwo] = groupsOf(coachOverviewDraftOf('A01', blocks, withReading(twoRead, withoutW3), { wording: withoutW3 }))
    assertComplete(readTwo, 'two sentences read')
    assert.deepEqual(readTwo.sentences.map(s => [s.extractId, s.wording]), [['A01-W1:s1+s2', 'DERIVED_FROM_APPROVED'], [null, 'DRAFT']])
    assert.equal(readTwo.sentences[0].text, `${OVERVIEW_4} ${W1.sentence.split('. ')[1]}.`)
    // In no case is the progression said without the bound and the origin.
    for (const group of [readOne, readTwo]) {
        assert.equal(group.withheld, false)
        assert.ok(states(group, 'PROGRESSION_CONDITION') && states(group, 'BOUNDED_CREDIT') && states(group, 'ORIGIN_CONDITION'))
        assert.ok(!(group.sentences.length && textsOf(group).includes(OVERVIEW_4) && !states(group, 'BOUNDED_CREDIT')))
    }
    // With his entry, the extract stands beside it (test 4): the bound and origin are stated by it.
    const [withW3] = groupsOf(coachOverviewDraftOf('A01', blocksOf(fixture), withReading(READING)))
    assert.deepEqual(textsOf(withW3).slice(0, 2), [OVERVIEW_4, OVERVIEW_5])
})

test('7. nothing is left out by default: an unclassed scoring row withholds its groups; a way with no CONSTITUTIVE field cannot be shown', () => {
    const blocks = blocksOf(buildActivityWithFixture(a01At(12, 1)).fixture)
    // The score's value unclassed: "Each score is worth 1 point" (How to score) says it for every team, so both groups are withheld.
    const noValue = tableWith(file => (file.rules = file.rules.filter((rule: any) => rule.id !== 'SCORE_VALUE')))
    const draft = coachOverviewDraftOf('A01', blocks, undefined, { essentials: noValue })
    for (const group of groupsOf(draft)) {
        assert.equal(group.withheld, true)
        assert.deepEqual(group.sentences, [])
        assert.ok(group.why[0].includes('value.primaryEvent.value is on row V2, which the essentials table does not class'), group.why[0])
        assert.ok(group.why[0].endsWith('nothing is left out of the overview by default'))
    }
    // The bounded credit unclassed: only the building team's group is withheld (the sentences citing it speak for that team).
    const [building, pressing] = groupsOf(coachOverviewDraftOf('A01', blocks, undefined, { essentials: tableWith(file => (file.rules = file.rules.filter((rule: any) => rule.id !== 'BOUNDED_CREDIT'))) }))
    assert.equal(building.withheld, true)
    assert.ok(building.why.every(why => why.includes('is on row B8, which the essentials table does not class')))
    assert.equal(pressing.withheld, false)
    // The progression made ESSENTIAL: the building team's way to score has no CONSTITUTIVE field, so it cannot be shown to appear.
    const [noWay] = groupsOf(coachOverviewDraftOf('A01', blocks, withReading(READING), { essentials: tableWith(file => (ruleOf(file, 'PROGRESSION_CONDITION').class = 'ESSENTIAL')) }))
    assert.equal(noWay.withheld, true)
    assert.deepEqual(noWay.why, ['the way to score value.primaryEvent has no field the essentials table classes CONSTITUTIVE, so it cannot be shown to appear'])
    // A field two rules class (conditions that overlap on one element) is ambiguous, never resolved by the rules' order.
    const overlapping = tableWith(file => file.rules.push({ id: 'TEST_ONLY_ORIGIN', class: 'DETAIL', rows: ['V4'], where: { field: 'type', notEquals: 'TEST-ONLY' }, why: 'TEST-ONLY' }))
    assert.equal(overlapping.why, null)
    const [ambiguous] = groupsOf(coachOverviewDraftOf('A01', blocks, undefined, { essentials: overlapping }))
    assert.equal(ambiguous.withheld, true)
    assert.ok(ambiguous.why.some(why => why.includes('is classed by more than one rule (ORIGIN_CONDITION, TEST_ONLY_ORIGIN)')), JSON.stringify(ambiguous.why))
    // The served activity is the coach's activity, whatever the overview composes: the overview is never a reason to refuse or change it.
    const coach = buildActivity(a01At(12, 1)) as ServedActivity
    assert.equal(coach.outcome, 'served')
    assert.deepEqual(admin(a01At(12, 1)).rendered, coach.rendered)
})

test('8. DRAFT shortenings are prefixes of their sentence, citing only what the rule of their cut keeps', () => {
    const part = (text: string, from: string[]) => ({ text, status: 'DERIVED' as const, from, quantities: [], bindings: [] })
    const sentence = { text: 'TEST-ONLY one: two; three. Four: five (six)', parts: [part('TEST-ONLY one', ['p1']), part(': two; three.', ['p2']), part(' Four: five (six)', ['p3'])] }
    const shortenings = draftShorteningsOf(sentence)
    assert.deepEqual(
        shortenings.map(s => [s.cut, s.text, s.drops, s.from]),
        [
            ['CLAUSE', 'TEST-ONLY one: two.', '; three. Four: five (six)', ['p1']],
            ['SENTENCE', 'TEST-ONLY one: two; three.', 'Four: five (six)', ['p1', 'p2']],
            ['ELABORATION', 'TEST-ONLY one: two; three. Four.', ': five (six)', ['p1', 'p2', 'p3']],
            ['ASIDE', 'TEST-ONLY one: two; three. Four: five.', '(six)', ['p1', 'p2', 'p3']],
        ],
    )
    // Never a word added or changed: each is its sentence's first words, closed by a full stop.
    for (const s of shortenings) assert.ok(sentence.text.startsWith(s.text.slice(0, -1)), s.text)
    // Only the last colon is an elaboration: the first one, inside a part, cuts it and keeps none of its citations.
    assert.ok(!shortenings.some(s => s.text === 'TEST-ONLY one.'))
    // Parts that do not make up the sentence: no shortening (its citations cannot be accounted for).
    assert.deepEqual(draftShorteningsOf({ text: 'TEST-ONLY one: two', parts: [part('TEST-ONLY one', ['p1'])] }), [])
    assert.deepEqual(draftShorteningsOf({ text: 'TEST-ONLY one: two' }), [])
    // The production cuts: Details 10 to its aside (its ": " would drop the triggers' part), Details 14 to its last colon.
    const served = admin(a01At(12, 1)).rendered.instructions
    const ten = draftShorteningsOf(served.find(i => i.text === DETAILS_10)!)
    assert.deepEqual(ten.map(s => [s.cut, s.text]), [['ELABORATION', "The building team's goalkeeper restarts play."], ['ASIDE', OVERVIEW_6_CUT]])
    assert.ok(ten[0].from.every(p => !p.endsWith('.selector')) && ten[1].from.some(p => p.endsWith('.selector')))
    const fourteen = draftShorteningsOf(served.find(i => i.text === DETAILS_14)!)
    assert.deepEqual(fourteen.map(s => [s.cut, s.text]), [['ELABORATION', OVERVIEW_7]])
})

test('9. the demonstrations at every role case, and a second synthetic Learning Goal (TEST-ONLY), by the same rules', () => {
    for (const demonstration of MECHANISM_DEMONSTRATIONS) {
        for (const keepers of [0, 1, 2]) {
            const request = { kind: 'mechanism-demonstration' as const, demonstrationId: demonstration.id, session: sessionAt(12, keepers) }
            const activity = buildActivityForReview(request, { includeDrafts: true })
            if (activity.outcome !== 'served') {
                assert.equal(demonstration.id, 'pass-combination-gate')
                assert.ok(!('overviewDraft' in activity))
                continue
            }
            const groups = groupsOf((activity as ServedActivity).overviewDraft!)
            assert.equal(groups.length, 1, demonstration.id)
            assert.equal(groups[0].group, EVERY_TEAM)
            assertComplete(groups[0], `${demonstration.id} ${keepers}`)
            const expected =
                demonstration.id === 'scoring-modifier'
                    ? [
                          'A team scores 1 point by getting the ball across the line it is attacking.',
                          'A score is worth 2 instead of 1 once the attacking team has touched the ball inside either channel and kept it after that touch. The bonus lasts until possession changes.',
                      ]
                    : ['A team scores 1 point by getting the ball across the line it is attacking.']
            assert.deepEqual(textsOf(groups[0]), expected, demonstration.id)
            assert.ok(groups[0].sentences.every(s => s.wording === 'DRAFT' && s.form === 'WHOLE' && s.fullRule === null))
            assert.deepEqual(groups[0].fullRules, [])
        }
    }
    // A second synthetic Learning Goal: the A04 Golden Case with TEST-ONLY conditions and a TEST-ONLY entry holding a DETAIL.
    const golden = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../../../docs/audits/a04-concrete-game-fixture.json'), 'utf8'))
    const fixture = copy(golden)
    const target = fixture.game.space.regions[0].elementId
    fixture.game.value.primaryEvent.conditions = [
        { elementId: 'c:T:T-1', type: 'progression', referents: [target], value: 'TEST-ONLY across' },
        { elementId: 'c:T:T-3', type: 'exclusion', referents: [target], value: 'TEST-ONLY clearance' },
    ]
    const at = (type: string) => ({ base: 'value.primaryEvent.conditions', field: 'type', equals: type })
    const entry: ApprovedWording = {
        id: 'TEST-LOCATED',
        covers: [
            { row: 'V4', match: { equals: 'progression' }, element: at('progression') },
            { row: 'V6', match: { equals: 'TEST-ONLY across' }, element: at('progression') },
            { row: 'V4', match: { equals: 'exclusion' }, element: at('exclusion') },
            { row: 'V6', match: { equals: 'TEST-ONLY clearance' }, element: at('exclusion') },
        ],
        sentence: 'Test team: Score by crossing the test line. A TEST-ONLY clearance does not count.',
        section: 'How to score',
        approvedBy: { who: 'TEST-ONLY', date: '2026-10-21', quote: 'TEST-ONLY, not his words', ccs: 'TEST-ONLY' },
    }
    const wording = [entry]
    const rendered = renderConcreteGame(fixture, wording).instructions
    assert.ok(rendered.some(i => i.text === entry.sentence))
    // No reading: the entry holds a DETAIL and no extract keeps anything, so it is said whole.
    const plain = scoringGroupsOf(fixture, rendered, extractsFor(fixture.game, { wording }).extracts, essentialsTable(), wording)
    assert.equal(plain.length, 1)
    assertComplete(plain[0], 'A04 no reading')
    assert.ok(textsOf(plain[0]).includes(entry.sentence))
    // A TEST-ONLY reading of its first sentence: the extract stands for the progression, the exclusion is pointed to.
    const reading: CoverReading = (e, units) => (e.id === 'TEST-LOCATED' && units.length === 1 && units[0].sentence === 0 && units[0].part === 'WHOLE_SENTENCE' ? [0, 1] : null)
    const read = scoringGroupsOf(fixture, rendered, extractsFor(fixture.game, { wording, reading }).extracts, essentialsTable(), wording)
    assertComplete(read[0], 'A04 read')
    const extract = read[0].sentences.find(s => s.form === 'EXTRACT')!
    assert.deepEqual([extract.text, extract.wording, extract.extractId], ['Test team: Score by crossing the test line.', 'DERIVED_FROM_APPROVED', 'TEST-LOCATED:s1'])
    assert.deepEqual([extract.fullRule!.text, extract.fullRule!.because], [entry.sentence, ['DETAIL_LEFT_OUT', 'SHORTENED_WAY_TO_SCORE']])
    assert.ok(!textsOf(read[0]).includes(entry.sentence))
})

test("10. only an administrator's answer carries it; the module and the table name nothing of the first activity", () => {
    const stored: any = { _id: 'TEST-ONLY', createdBy: 'TEST-ONLY', playerCount: 12, fieldLength: '40', fieldWidth: '30', specializedRoles: { ...none, [ROLE]: 1 } }
    const coach = reviewActivity(stored, { learningGoalId: 'A01', durationMin: 20 }) as ServedActivity
    const asAdmin = reviewActivity(stored, { learningGoalId: 'A01', durationMin: 20 }, { includeDrafts: true }) as ServedActivity
    assert.ok(!('overviewDraft' in coach))
    assert.ok(!JSON.stringify(coach).includes(FULL_RULE_LABEL) && !JSON.stringify(coach).includes('PROPOSED'))
    assert.equal(asAdmin.overviewDraft!.served, false)
    assert.equal(asAdmin.overviewDraft!.scoring.blocks.length, 2)
    assert.ok(!('overviewDraft' in buildActivity(a01At(12, 1))))
    // The table's rules: no goal, entry, demonstration or element, as keys or values (the loader refuses them; checked here on the file).
    const names = activityNames()
    for (const rule of TABLE.rules) for (const value of JSON.stringify(rule).match(/"[^"]*"/g)!.map(v => v.slice(1, -1))) assert.ok(!names.has(value) && !value.startsWith('c:'), `${rule.id}: ${value}`)
    // The module's code: no row, rule id, condition type or value the table holds (the table decides; coach-overview.unit.ts test 10 checks
    // goal ids and the first activity's literals on the whole source).
    const source = fs.readFileSync(path.join(__dirname, 'coach-overview.ts'), 'utf8')
    const code = source
        .split('\n')
        .filter(line => !/^\s*(\*|\/\*\*|\/\/)/.test(line))
        .join('\n')
    for (const literal of ['progression', 'origin', "'control'", 'exclusion', "'V2'", "'V4'", "'B8'", 'V28', 'V31', "'BOUNDED_CREDIT'", 'ORIGIN_CONDITION', 'EVERY_WAY_TO_SCORE', 'goalkeeper', 'WHOLE_GAME'])
        assert.ok(!code.includes(literal), literal)
    // His approved table is unchanged and holds no derived record.
    const approvedTable = fs.readFileSync(APPROVED_WORDING_FILE, 'utf8')
    for (const word of ['DERIVED_FROM_APPROVED', 'CONSTITUTIVE', 'ESSENTIAL', '"keeps"']) assert.ok(!approvedTable.includes(word), word)
    assert.deepEqual(approvedWording().map(entry => entry.id), ['A01-W1', 'A01-W2', 'A01-W3'])
})

console.log(`overview-scoring.unit.ts — ${passed} passed`)
