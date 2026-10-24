/**
 * How each team scores in the Coach Overview: the PROPOSED essentials table and the scoring-group composer — stage 3C, 21 October 2026.
 *
 * His reply filed 22 October 2026, item 6: *"Yes. The overview should briefly communicate the scoring objectives."* and *"the overview
 * should not reproduce every qualification, exception, and restart condition. Those belong in Coach Details, with any essential
 * qualification included in the overview when omitting it would materially misrepresent the game."* Item 4: *"Shortening must not
 * introduce new meanings, omit a condition that changes the essential understanding, or silently turn a qualified rule into an
 * unrestricted one."* Since stage 3F, his reply filed 23 October 2026, item 4: *"The system should evaluate the meaning of the complete
 * overview rather than simply confirm that related words or conditions appear somewhere."* Item 6: *"a concise explanation that
 * communicates the opposing objectives immediately, without requiring the coach to read several procedural statements first."*
 *
 * Pinned here, on the real chain:
 *
 *   1. the table: the production file loads as PARTLY_APPROVED (C1, his reply filed 24 October 2026, item 2: exactly the two exclusion
 *      rules APPROVED, each with his words; every other rule PROPOSED, with none; was: PROPOSED, no approvedBy), keyed by register rows,
 *      copied beside the bundle, and every overview built on it is labelled for an administrator, naming the rules still PROPOSED; since
 *      stage 3F the restart moments are DETAIL and the two exclusions follow from the conditions they exclude by (`followsFrom`);
 *   2. the loader refuses unknown classes, rules keyed by an activity (a key, a goal, an approved entry, a demonstration, an element), rows
 *      that are no register row, ways that are no collection, an APPROVED status without his approval, a row classed twice, and (stage 3F)
 *      a `followsFrom` anywhere but on a DETAIL rule, or naming no other rule the overview must state; an unusable table withholds every
 *      group, never the activity;
 *   3. production A01 (12/1, 12/2, 11/1, both blocks), since stage 3F: each team's group opens with its one line saying how it scores (his
 *      first building sentence; the cut of the pressing team's scoring sentence), then what the meaning test requires (his second building
 *      sentence for the origin, his eligibility sentence for the eligibility; the regain clause); the restart moments are left to Coach
 *      Details behind a pointer, as is every DETAIL not stated; the same words in both blocks; the admin draft is this;
 *   4. the readings decide the words, never the composer: a TEST-ONLY copy of the record that names no record gives the same words; with no
 *      reading nothing of his can be shown to be stated, so every group of his is withheld;
 *   5. flipping a class, or what an exception follows from, changes the composed group (the table decides, not code);
 *   6. without his eligibility sentence nothing states the building team's eligibility under the record, so the group is withheld; under a
 *      TEST-ONLY reading in which his second sentence states it, his eligibility sentence adds nothing and is left to Coach Details;
 *   7. nothing is left out by default: a How to score sentence citing a scoring row the table does not class withholds the groups it
 *      speaks for, and a way to score with no CONSTITUTIVE field cannot be shown to appear;
 *   8. DRAFT shortenings are prefixes of their sentence, never a word added or changed, citing only the parts they keep whole (stage 3D);
 *   9. the demonstrations at every role case (the refused one has none), and a second synthetic Learning Goal (TEST-ONLY), by the same
 *      rules: there an exclusion with no condition to follow from is material and stated;
 *  10. only an administrator's answer carries it; the module and the table name nothing of the first activity.
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { reviewActivity } from './activity-review'
import { APPROVED_WORDING_FILE, ApprovedWording, approvedWording } from './approved-wording'
import { APPROVED_READING_RECORD, READINGS_SOURCE, recordedReading } from './approved-wording-readings'
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
    partlyApprovedTableLabel,
    PROPOSED_TABLE_LABEL,
    ScoringGroup,
    scoringGroupsOf,
} from './coach-overview'
import { CoverReading, extractsFor, NO_RECORDED_READING, wholeReadingsFor } from './derived-wording'
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
// Re-pointed 24 October 2026 (K3, the d27 design's stage K3): A01's session states that it has no goal, so the zone version (A01-R1) is built
// exactly as before. Since K3 A01's record tries the goal version first, and a session that has not said what goals it has is asked first
// (his reply filed 26 October 2026, item 11: "Do not infer a goal from the presence of a goalkeeper or silently treat missing information as
// confirmation that no goal exists."). The demonstrations keep the session as it was.
const NO_GOAL = { goal: { count: 0 } }
const a01At = (players: number, keepers: number) => ({ kind: 'learning-goal' as const, goalId: 'A01', situationId: null, session: { ...sessionAt(players, keepers), objects: NO_GOAL } })
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
/** A rule made ESSENTIAL (TEST-ONLY): an ESSENTIAL rule follows from nothing (the loader refuses `followsFrom` on it). */
const essential = (id: string) => (file: any) => {
    const rule = ruleOf(file, id)
    rule.class = 'ESSENTIAL'
    delete rule.followsFrom
}

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
/** His second and third sentences of the building rule (stage 3F: the origin; the exclusion). */
const W1_S2 = "The progression must begin with the goalkeeper's build-out and occur before the building team loses possession."
const W1_S3 = 'Uncontrolled clearances do not score.'
/**
 * Sentence 6 as the composer cut it from Details 10 until R1: its own words up to the bracketed aside (no word added or changed). Since R1
 * (24 October 2026) the aside no longer closes Details 10 (the moments his reply filed 27 October 2026, item 4, adds follow it), so no cut
 * gives it; kept to pin that.
 */
const OVERVIEW_6_CUT = "The building team's goalkeeper restarts play: at the start, after either team scores and whenever you decide that an attack has run its course."
// Re-pointed 24 October 2026 (R1, DRAFT): the ball going out and the coach's two other stoppages join the restart moments (his reply filed
// 27 October 2026, item 4). Was: "... at the start, after either team scores and whenever you decide that an attack has run its course (at a
// stoppage or while play is on)".
// Re-pointed 24 October 2026 (R2, DRAFT, the d27 design's section 2.8): the common restart said as one rule, the start in its lead, the
// moments in the DRAFT data's order. Was (R1): "The building team's goalkeeper restarts play: at the start, after either team scores,
// whenever the ball goes out of play, whenever you decide that an attack has run its course (at a stoppage or while play is on), whenever you
// stop play for a foul and whenever you stop play for any other reason".
const DETAILS_10 = "The building team's goalkeeper starts play, and restarts it whenever the ball is dead: after either team scores, whenever the ball goes out of play, whenever you stop play for a foul, when you judge that an attack has run its course, and whenever you stop play for any other reason"
/**
 * R2 (24 October 2026): the overview's statement of the common restart (DEAD_BALL_RESTART, ESSENTIAL, PROPOSED; the d27 design's O1),
 * Details 10 cut before its moments - the composer says only Details words, so not the design's "Every time the ball is dead, the building
 * team's goalkeeper restarts play.".
 */
const OVERVIEW_RESTART = "The building team's goalkeeper starts play, and restarts it whenever the ball is dead."
const DETAILS_14 = 'Pressing team: Score by getting the ball under control into its target zone: running it in, or passing to a teammate who receives it under control inside'
const DETAILS_16 = 'Each score is worth 1 point'

/**
 * A TEST-ONLY reading: the PROPOSED record's own reading of every part, handed in as a function that names no record. NOT his reading and
 * not ours to record: a test hands it, to show that the words follow the reading and only the record it names is carried. (Re-pointed 22
 * October 2026, stage 3F: was the record's two stage 3E readings written out, which no longer state the origin or the eligibility.)
 */
const READING: CoverReading = (entry, units) => recordedReading()(entry, units)
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
    // Stage 3F: one line, first, says how the team scores.
    assert.deepEqual(group.sentences.map(sentence => sentence.place).filter(place => place === 'LEAD'), ['LEAD'], what)
    assert.equal(group.sentences[0].place, 'LEAD', what)
}

/** His words, verbatim, filed 24 October 2026, item 2 (C1), as each approved exclusion rule records them. */
const HIS_EXCLUSIONS_LEAD = 'Yes, the two exclusions may remain in Coach Details:'
const HIS_EXCLUSIONS_PROVISO =
    "The overview already communicates controlled progression and genuinely established possession. [...] This seems like an appropriate application of progressive disclosure, provided the complete rules remain immediately accessible and the abbreviated overview doesn't misrepresent the scoring conditions."
const exclusionApproval = (exclusion: string) => ({
    who: 'Christian',
    date: '2026-10-24',
    filed: "his reply filed 24 October 2026, item 2, answering item b of our email of 23 October 2026 ('may these two stay in Coach details?')",
    quote: `${HIS_EXCLUSIONS_LEAD} [...] ${exclusion} [...] ${HIS_EXCLUSIONS_PROVISO}`,
})

test('1. the table: PARTLY_APPROVED (C1: his two exclusions), keyed by register rows, copied beside the bundle; an overview built on it is labelled', () => {
    // Re-pointed 24 October 2026 (C1, his reply filed 24 October 2026, item 2). Was: PROPOSED, with no approvedBy.
    assert.equal(TABLE.status, 'PARTLY_APPROVED')
    assert.ok(!('approvedBy' in TABLE), 'the table carries no approval of its own: his approval is of a rule')
    // Exactly the two exclusion rules are APPROVED, each with his words verbatim; every other rule stays PROPOSED with no approval.
    assert.deepEqual(
        TABLE.rules.filter((rule: any) => rule.status === 'APPROVED').map((rule: any) => [rule.id, rule.approvedBy]),
        [
            ['EXCLUSION_CONDITION', exclusionApproval('Uncontrolled clearances do not score.')],
            ['ALSO_COUNTS_EXCLUSION', exclusionApproval('Contested touches, deflections, and loose balls do not count as controlled regains.')],
        ],
    )
    assert.ok(TABLE.rules.every((rule: any) => (rule.status === 'APPROVED') === ('approvedBy' in rule) && (rule.status === 'APPROVED' || rule.status === 'PROPOSED')))
    assert.deepEqual(TABLE.rules.filter((rule: any) => rule.status === 'PROPOSED').length, TABLE.rules.length - 2)
    // He did not rule on the restart timing or the score value: both stay PROPOSED.
    assert.deepEqual(['BOUNDED_EPISODE_OPENER', 'SCORE_VALUE'].map(id => ruleOf(TABLE, id).status), ['PROPOSED', 'PROPOSED'])
    const load = essentialsTable()
    assert.equal(load.why, null)
    assert.equal(load.table!.status, 'PARTLY_APPROVED')
    assert.deepEqual(load.table!.rules, TABLE.rules.map((rule: any) => ({ ...rule, approvedBy: rule.approvedBy ?? null })))
    // The BUILD PLAN's classes are each carried by a rule (stage 3C): every way to score; a bound other than the whole game and the origin;
    // the exclusion and the also-counts exclusion. Re-pointed 22 October 2026 (stage 3F, his reply filed 23 October 2026, item 6: "restart
    // procedures should remain accessible in Coach Details"): the transitions beginning a bounded role's episode are DETAIL. Was: ESSENTIAL.
    const classOf = (id: string) => ruleOf(TABLE, id).class
    assert.deepEqual(
        ['EVERY_WAY_TO_SCORE', 'BOUNDED_CREDIT', 'ORIGIN_CONDITION', 'BOUNDED_EPISODE_OPENER', 'EXCLUSION_CONDITION', 'ALSO_COUNTS_EXCLUSION'].map(classOf),
        ['CONSTITUTIVE', 'ESSENTIAL', 'ESSENTIAL', 'DETAIL', 'DETAIL', 'DETAIL'],
    )
    assert.deepEqual(ruleOf(TABLE, 'EVERY_WAY_TO_SCORE').ways, ['V0', 'V27', 'V7'])
    assert.deepEqual(ruleOf(TABLE, 'BOUNDED_CREDIT').where, { field: 'creditedWithin', notEquals: 'WHOLE_GAME' })
    // Stage 3F (his item 4, "exceptions"): each exclusion follows from the condition it excludes by, and only those two rules follow from any.
    assert.deepEqual(TABLE.rules.filter((rule: any) => rule.followsFrom).map((rule: any) => [rule.id, rule.followsFrom]), [
        ['EXCLUSION_CONDITION', ['CONTROL_CONDITION']],
        ['ALSO_COUNTS_EXCLUSION', ['ALSO_COUNTS_CONTROL']],
    ])
    assert.ok(TABLE.about.includes('AMENDED 22 October 2026 (stage 3F'))
    // build.js copies it into dist/knowledge, where the bundled server reads it.
    assert.ok(fs.readFileSync(path.resolve(__dirname, '../../../build.js'), 'utf8').includes("'overview-essentials.json'"))
    // The administrator's draft names the table and labels it (DRAFT words). Re-pointed 24 October 2026 (C1): partly approved, the label
    // naming the rules he approved and those still PROPOSED. Was: PROPOSED, with PROPOSED_TABLE_LABEL.
    const draft = admin(a01At(12, 1)).overviewDraft!
    const proposedIds = TABLE.rules.filter((rule: any) => rule.status === 'PROPOSED').map((rule: any) => rule.id)
    assert.deepEqual(draft.scoring.table, {
        source: 'docs/audits/overview-essentials.json',
        status: 'PARTLY_APPROVED',
        label: partlyApprovedTableLabel(['EXCLUSION_CONDITION', 'ALSO_COUNTS_EXCLUSION'], proposedIds),
        labelStatus: 'DRAFT',
        why: null,
        approved: ['EXCLUSION_CONDITION', 'ALSO_COUNTS_EXCLUSION'],
        proposed: proposedIds,
    })
    assert.ok(draft.scoring.table.label!.startsWith('Built on a partly approved table') && draft.scoring.table.label!.includes('Still PROPOSED: EVERY_WAY_TO_SCORE'))
    assert.ok(!draft.scoring.table.label!.includes(PROPOSED_TABLE_LABEL))
    // Stage 3E: and the readings record the extracts keep by, named and labelled the same way. Re-pointed 24 October 2026 (C1): partly
    // approved. Was: PROPOSED.
    assert.deepEqual([draft.scoring.readings.source, draft.scoring.readings.status], [READINGS_SOURCE, 'PARTLY_APPROVED'])
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
    // Stage 3D (the 3C review's probe A, a TIGHTENING): a name the list of refused names cannot exhaust is refused too — an element condition
    // comparing with a contract, a context, an element's item id or authored text (only values of a closed register vocabulary), and an id
    // holding an activity's name among its words.
    const notVocabulary = 'which is no value of a closed vocabulary the register records'
    refused(file => (ruleOf(file, 'ORIGIN_CONDITION').where.equals = 'A01-R1'), notVocabulary)
    refused(file => (ruleOf(file, 'ORIGIN_CONDITION').where.equals = 'RPC-001'), notVocabulary)
    refused(file => (ruleOf(file, 'ORIGIN_CONDITION').where.equals = 'RPC-001-18.a'), notVocabulary)
    refused(file => (ruleOf(file, 'EXCLUSION_CONDITION').where = { field: 'value', equals: 'a long clearance that happens to reach the target' }), notVocabulary)
    refused(file => (ruleOf(file, 'BOUNDED_CREDIT').where.notEquals = 7), notVocabulary)
    refused(file => (ruleOf(file, 'ORIGIN_CONDITION').id = 'A01_ORIGIN'), 'its id "A01_ORIGIN" holds "A01"')
    refused(file => (ruleOf(file, 'ORIGIN_CONDITION').id = 'ORIGIN_FOR_A01-W3'), 'holds "A01')
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
    // Stage 3F: an exception follows only from another rule of the table that the overview must state, and only a DETAIL follows from any.
    refused(file => (ruleOf(file, 'CONTROL_CONDITION').followsFrom = ['ORIGIN_CONDITION']), 'only a DETAIL rule follows from another')
    refused(file => (ruleOf(file, 'EXCLUSION_CONDITION').followsFrom = []), 'its followsFrom names no rule')
    refused(file => (ruleOf(file, 'EXCLUSION_CONDITION').followsFrom = ['TEST_ONLY_RULE']), 'follows from "TEST_ONLY_RULE", which is no other rule of the table')
    refused(file => (ruleOf(file, 'EXCLUSION_CONDITION').followsFrom = ['EXCLUSION_CONDITION']), 'which is no other rule of the table')
    refused(file => (ruleOf(file, 'EXCLUSION_CONDITION').followsFrom = ['SCORE_VALUE']), 'a DETAIL: an exception is left to Coach Details only where')
    refused(file => (ruleOf(file, 'EXCLUSION_CONDITION').followsFrom = ['A01']), 'it names "A01", an activity')
    // The status. Re-pointed 24 October 2026 (C1, his reply filed 24 October 2026, item 2, approving two rules): approval is per rule. A
    // rule is APPROVED only with his approval (who, a calendar date, the reply it is filed in by that date, his words), PROPOSED with none;
    // the table carries none of its own, and its status is what its rules make it. Was: one status and one approval for the whole table.
    refused(file => (file.status = 'APPROVED'), 'and its rules make it PARTLY_APPROVED')
    refused(file => (file.status = 'PROPOSED'), 'and its rules make it PARTLY_APPROVED')
    refused(file => (file.approvedBy = { who: 'TEST-ONLY', date: '2026-10-21', quote: 'TEST-ONLY' }), 'it carries approvedBy: his approval is of a rule, never of the table')
    refused(file => (file.status = 'DRAFT'), 'none of PROPOSED, PARTLY_APPROVED and APPROVED')
    refused(file => (file.extra = true), 'the table carries "extra"')
    refused(file => delete ruleOf(file, 'SCORE_VALUE').status, 'its status undefined is neither PROPOSED nor APPROVED')
    refused(file => (ruleOf(file, 'SCORE_VALUE').status = 'APPROVED'), 'it says APPROVED and carries no approvedBy')
    refused(file => (ruleOf(file, 'SCORE_VALUE').approvedBy = exclusionApproval('TEST-ONLY')), 'it is PROPOSED and carries approvedBy')
    refused(file => delete ruleOf(file, 'EXCLUSION_CONDITION').approvedBy, 'it says APPROVED and carries no approvedBy')
    refused(file => (ruleOf(file, 'EXCLUSION_CONDITION').approvedBy.quote = ' '), 'its approval does not give his words')
    refused(file => (ruleOf(file, 'EXCLUSION_CONDITION').approvedBy.date = '2026-10-21'), 'its approval does not name the reply it is filed in, by the date 21 October 2026')
    refused(file => (ruleOf(file, 'EXCLUSION_CONDITION').approvedBy.who = ''), 'its approval does not say who approved it')
    refused(file => Object.assign(ruleOf(file, 'EXCLUSION_CONDITION'), { approvedBy: { who: 'TEST-ONLY' } }), 'is not a calendar date')
    const allApproved = tableWith(file => {
        for (const rule of file.rules) if (rule.status === 'PROPOSED') Object.assign(rule, { status: 'APPROVED', approvedBy: { ...exclusionApproval('TEST-ONLY'), who: 'TEST-ONLY' } })
        file.status = 'APPROVED'
    })
    assert.equal(allApproved.table!.status, 'APPROVED')
    const allProposed = tableWith(file => {
        for (const rule of file.rules) {
            rule.status = 'PROPOSED'
            delete rule.approvedBy
        }
        file.status = 'PROPOSED'
    })
    assert.equal(allProposed.table!.status, 'PROPOSED')
    // An unusable table withholds every group, with why; the purpose, game and parameters stand, and the activity is served as before.
    const blocks = blocksOf(buildActivityWithFixture(a01At(12, 1)).fixture)
    const broken = tableWith(file => (file.status = 'APPROVED'))
    const draft = coachOverviewDraftOf('A01', blocks, undefined, { essentials: broken })
    assert.equal(draft.scoring.table.status, 'UNUSABLE')
    assert.equal(draft.scoring.table.label, null)
    for (const block of draft.scoring.blocks) {
        assert.deepEqual(block.groups.map(group => [group.group, group.withheld, group.sentences.length]), [['BUILDING', true, 0], ['PRESSING', true, 0]])
        for (const group of block.groups) assert.ok(group.why[0].startsWith('the essentials table cannot be used: its status is "APPROVED", and its rules make it PARTLY_APPROVED'), group.why[0])
    }
    const whole = coachOverviewDraftOf('A01', blocks)
    assert.deepEqual([draft.purpose, draft.blocks, draft.extracts, draft.gaps], [whole.purpose, whole.blocks, whole.extracts, whole.gaps])
})

test("3. production A01: each team's line saying how it scores first, then what the meaning test requires; the restart moments behind a pointer", () => {
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
            // Re-pointed 22 October 2026 (stage 3F, his reply filed 23 October 2026, items 4 and 6). His eligibility sentence does not state
            // that the scoring opportunity must begin from the goalkeeper's build-out (his item-4 example; the PROPOSED readings record), so
            // his second building sentence is said for the origin; the restart moments are restart procedure, left to Coach Details. Each
            // group opens with the line saying how the team scores. Was (stage 3E): OVERVIEW_4, OVERVIEW_5, OVERVIEW_6_CUT; OVERVIEW_7, OVERVIEW_8.
            // Re-pointed 24 October 2026 (R2, his reply filed 27 October 2026, item 4: "This is the most important clarification."): the
            // common restart is ESSENTIAL (DEAD_BALL_RESTART, PROPOSED), stated by Details 10 cut before its moments, which carries the pointer
            // to the moments it leaves out. Was: OVERVIEW_4, W1_S2, OVERVIEW_5, with Details 10 pointed to by the group.
            assert.deepEqual(textsOf(building), [OVERVIEW_4, W1_S2, OVERVIEW_5, OVERVIEW_RESTART], at)
            assert.deepEqual(
                building.sentences.map(s => [s.place, s.wording, s.source, s.chosenBy, s.form, s.extractId, s.fullRule ? [s.fullRule.text, s.fullRule.because] : null]),
                [
                    ['LEAD', 'DERIVED_FROM_APPROVED', { kind: 'APPROVED_ENTRY', id: 'A01-W1' }, 'SHORTEST_EXTRACT', 'EXTRACT', 'A01-W1:s1', [W1.sentence, ['DETAIL_LEFT_OUT', 'SHORTENED_WAY_TO_SCORE']]],
                    ['QUALIFICATION', 'DERIVED_FROM_APPROVED', { kind: 'APPROVED_ENTRY', id: 'A01-W1' }, 'SHORTEST_EXTRACT', 'EXTRACT', 'A01-W1:s2', null],
                    ['QUALIFICATION', 'APPROVED', { kind: 'APPROVED_ENTRY', id: 'A01-W3' }, 'APPROVED_ENTRY', 'WHOLE', null, null],
                    ['QUALIFICATION', 'DRAFT', null, 'DETAILS_SENTENCE', 'SHORTENING', null, [DETAILS_10, ['DETAIL_LEFT_OUT']]],
                ],
                at,
            )
            assert.deepEqual(building.sentences[3].drops, [': after either team scores, whenever the ball goes out of play, whenever you stop play for a foul, when you judge that an attack has run its course, and whenever you stop play for any other reason'], at)
            assert.deepEqual(textsOf(pressing), [OVERVIEW_7, OVERVIEW_8], at)
            assert.deepEqual(
                pressing.sentences.map(s => [s.place, s.wording, s.source, s.chosenBy, s.form, s.extractId, s.fullRule ? [s.fullRule.text, s.fullRule.because] : null]),
                [
                    ['LEAD', 'DRAFT', null, 'DETAILS_SENTENCE', 'SHORTENING', null, [DETAILS_14, ['SHORTENED_WAY_TO_SCORE']]],
                    ['QUALIFICATION', 'DERIVED_FROM_APPROVED', { kind: 'APPROVED_ENTRY', id: 'A01-W2' }, 'SHORTEST_EXTRACT', 'EXTRACT', 'A01-W2:c1', [W2.sentence, ['DETAIL_LEFT_OUT', 'SHORTENED_WAY_TO_SCORE']]],
                ],
                at,
            )
            assert.deepEqual(pressing.sentences[0].drops, [': running it in, or passing to a teammate who receives it under control inside'], at)
            // The cut of Details 14 cites everything that sentence cites (its lead part is all of it but the elaboration of the event).
            assert.deepEqual(pressing.sentences[0].from, served.rendered.instructions[pressing.sentences[0].details.blockIndex].from, at)
            // Every sentence of his read by the record names it, his eligibility sentence said whole included (stage 3F); the DRAFT cut names
            // none. Re-pointed 24 October 2026 (C1, his reply filed 24 October 2026, item 1): the four readings these sentences are read by are
            // approved, so each names the approved record ("reading approved"). Was: the PROPOSED record, each.
            // Re-pointed 24 October 2026 (R2): the restart line, a DRAFT cut, names no record. Was: five sentences.
            assert.deepEqual([...building.sentences, ...pressing.sentences].map(s => s.reading), [APPROVED_READING_RECORD, APPROVED_READING_RECORD, APPROVED_READING_RECORD, null, null, APPROVED_READING_RECORD], at)
            // Left to Details behind a pointer each: the restart moments (stage 3F: DETAIL) in the building team's group, the value of a score
            // in both. Re-pointed 24 October 2026 (R2): the restart line states the taker, the start and that every dead ball stops play (the
            // lead's words); each moment it leaves out is pointed to by the line itself, and the group points only to the value. Was: no opener
            // field stated, every one pointed to by the group.
            const opener = building.requirements.filter(r => r.rule === 'BOUNDED_EPISODE_OPENER')
            assert.ok(opener.length > 0 && opener.every(r => r.class === 'DETAIL'), at)
            const left = opener.filter(r => r.statedBy.length === 0)
            assert.ok(left.length > 0 && left.every(r => r.pointedTo) && left.every(r => r.path.endsWith('.selector') || r.path.includes('.qualifiers.')), `${at}: the moments are left out, behind the pointer`)
            assert.ok(opener.filter(r => r.statedBy.length > 0).every(r => JSON.stringify(r.statedBy) === '[3]'), `${at}: what the restart line's words state`)
            assert.deepEqual(building.sentences[3].fullRule!.paths, left.map(r => r.path), at)
            assert.deepEqual(building.fullRules.map(p => [p.text, p.because, p.paths]), [[DETAILS_16, ['DETAIL_LEFT_OUT'], ['value.primaryEvent.value']]], at)
            const restart = building.requirements.filter(r => r.rule === 'DEAD_BALL_RESTART')
            assert.deepEqual(restart.map(r => [r.path, r.class, r.statedBy]), [['restartPolicy.deadBall', 'ESSENTIAL', [3]]], at)
            assert.ok(!pressing.requirements.some(r => r.rule === 'DEAD_BALL_RESTART'), at)
            assert.deepEqual(pressing.fullRules.map(p => [p.text, p.because, p.paths]), [[DETAILS_16, ['DETAIL_LEFT_OUT'], ['value.primaryEvent.value']]], at)
            // Every extract is kept by the record now; no approved sentence is said whole for want of one, so no note.
            assert.deepEqual([building.extractsKeepingNothing, pressing.extractsKeepingNothing], [[], []], at)
            assert.deepEqual([building.notes, pressing.notes], [[], []], at)
            // What states what, by meaning: the eligibility by his eligibility sentence, the origin by his second sentence (never by his
            // eligibility sentence, which cites it), the progression and the control by his first; the exclusion pointed to, since the group
            // states the control it follows from.
            const statedBy = (rule: string) => [...new Set(building.requirements.filter(r => r.rule === rule).flatMap(r => r.statedBy))].sort()
            assert.deepEqual([statedBy('BOUNDED_CREDIT'), statedBy('ORIGIN_CONDITION'), statedBy('PROGRESSION_CONDITION'), statedBy('CONTROL_CONDITION'), statedBy('EXCLUSION_CONDITION')], [[2], [1], [0, 1], [0], []], at)
            assert.ok(building.requirements.filter(r => r.rule === 'EXCLUSION_CONDITION').every(r => r.pointedTo), at)
            // The regain clause keeps "provided it genuinely establishes possession" (ESSENTIAL in the PROPOSED table).
            assert.ok(pressing.sentences[1].states.some(s => s.rule === 'ALSO_COUNTS_CONTROL'), at)
            assert.deepEqual(building.ways.map(way => way.shownBy), [[0, 1]], at)
            assert.deepEqual(pressing.ways.map(way => way.shownBy), [[0], [1]], at)
        }
        // The draft as built is the draft composed from the block games (each block rendered by the same renderer).
        const blocks = blocksOf(buildActivityWithFixture(a01At(players, keepers)).fixture)
        assert.deepEqual(coachOverviewDraftOf('A01', blocks).scoring, draft.scoring, what)
    }
})

test('4. the readings decide the words, never the composer: a TEST-ONLY copy of the record gives the same words; with no reading nothing of his is stated', () => {
    // Re-pointed 22 October 2026 (stage 3F). What stays pinned: the words follow the reading handed in, and only the record it names is
    // carried (a TEST-ONLY reading names none). Changed: with no reading at all his wording is no longer counted for every field it cites
    // (his reply filed 23 October 2026, item 4), so no group of his can be composed. Was: his sentences said whole, with a note.
    for (const [players, keepers] of [[12, 1], [12, 2], [11, 1]] as const) {
        const what = `A01 ${players}/${keepers}`
        const blocks = blocksOf(buildActivityWithFixture(a01At(players, keepers)).fixture)
        const production = coachOverviewDraftOf('A01', blocks)
        const testOnly = coachOverviewDraftOf('A01', blocks, undefined, { reading: READING })
        const unread = coachOverviewDraftOf('A01', blocks, undefined, { reading: NO_RECORDED_READING })
        assert.equal(testOnly.scoring.sameTextInEveryBlock, true, what)
        // The account describes the reading the overview was built with (the 3E review's bookkeeping item): one naming no record is not the record.
        assert.deepEqual([testOnly.scoring.readings.status, unread.scoring.readings.status, production.scoring.readings.status], ['UNUSABLE', 'UNUSABLE', 'PARTLY_APPROVED'], what)
        for (const [n, block] of testOnly.scoring.blocks.entries()) {
            const at = `${what} block ${n + 1}`
            const [building, pressing] = block.groups
            assertComplete(building, at)
            assertComplete(pressing, at)
            assert.deepEqual(block.groups.map(textsOf), production.scoring.blocks[n].groups.map(textsOf), at)
            // Re-pointed 24 October 2026 (R2): six sentences, the common restart's line among them. Was: five.
            assert.deepEqual([...building.sentences, ...pressing.sentences].map(s => s.reading), [null, null, null, null, null, null], at)
            assert.deepEqual([...new Set(building.sentences[0].states.map(s => s.class))], ['CONSTITUTIVE', 'ESSENTIAL'], at)
            // No reading at all: nothing of his can be shown to be stated, so both groups are withheld, each why naming the entry citing it.
            const [unreadBuilding, unreadPressing] = unread.scoring.blocks[n].groups
            assert.deepEqual([unreadBuilding.withheld, unreadPressing.withheld], [true, true], at)
            assert.ok(unreadBuilding.why.some(why => why.includes('rule BOUNDED_CREDIT) is stated by no sentence of the group (A01-W1 and A01-W3 cite it')), JSON.stringify(unreadBuilding.why))
            assert.ok(unreadBuilding.why.some(why => why.includes('rule PROGRESSION_CONDITION) is stated by no sentence of the group (A01-W1 cites it')), JSON.stringify(unreadBuilding.why))
            assert.ok(unreadPressing.why.some(why => why.includes('rule ALSO_COUNTS_TEAM_AND_TRIGGER) is stated by no sentence of the group (A01-W2 cites it')), JSON.stringify(unreadPressing.why))
        }
    }
    // Sentence 6 as the EXPECTED PRESENTATION writes it drops the colon and "that": a rewording, which no cut of Details 10 gives (the
    // composer never adds or changes a word). Since stage 3F neither is in the overview (the restart moments are left to Coach Details).
    assert.notEqual(OVERVIEW_6_CUT, OVERVIEW_6_AS_WRITTEN)
    // Re-pointed 24 October 2026 (R1): the stage 3F cut is no longer a prefix of Details 10 (the aside no longer closes it). Was: it was.
    assert.ok(!DETAILS_10.startsWith(OVERVIEW_6_CUT.slice(0, -1)))
})

test('5. flipping a class, or what an exception follows from, changes the composed group: the table decides, not code', () => {
    const blocks = blocksOf(buildActivityWithFixture(a01At(12, 1)).fixture)
    const composed = (change: (file: any) => void) => groupsOf(coachOverviewDraftOf('A01', blocks, undefined, { essentials: tableWith(change) }))
    // The exclusion made ESSENTIAL: his building rule holds no DETAIL, so it is said whole as approved wording, and it states every field
    // the group needs but the eligibility, which his eligibility sentence states beside it. (Re-pointed 22 October 2026, stage 3F: was his
    // building rule whole and the restart cut; his eligibility sentence then counted as adding nothing because it cited nothing new.)
    const [exclusionEssential] = composed(essential('EXCLUSION_CONDITION'))
    // Re-pointed 24 October 2026 (R2): and the common restart's line, ESSENTIAL (DEAD_BALL_RESTART), in every composition of the building
    // team's group below where Details 10 is not said whole. Was: his two sentences alone.
    assert.deepEqual(textsOf(exclusionEssential), [W1.sentence, W3.sentence, OVERVIEW_RESTART])
    assert.deepEqual(exclusionEssential.sentences.slice(0, 2).map(s => [s.place, s.chosenBy, s.form, s.fullRule]), [['LEAD', 'APPROVED_ENTRY', 'WHOLE', null], ['QUALIFICATION', 'APPROVED_ENTRY', 'WHOLE', null]])
    assert.deepEqual([exclusionEssential.sentences[2].place, exclusionEssential.sentences[2].chosenBy, exclusionEssential.sentences[2].form, exclusionEssential.sentences[2].fullRule?.text], ['QUALIFICATION', 'DETAILS_SENTENCE', 'SHORTENING', DETAILS_10])
    // The also-counts exclusion made ESSENTIAL: the regain sentence is said whole.
    const [, regainEssential] = composed(essential('ALSO_COUNTS_EXCLUSION'))
    assert.deepEqual(textsOf(regainEssential), [OVERVIEW_7, W2.sentence])
    // Stage 3F: the restart moments made ESSENTIAL again (their class before 3F): the restart cut is said, after the scoring sentences, and
    // nothing points to Details 10. (Re-pointed: was the flip to DETAIL, now the production class.)
    const [openerEssential] = composed(file => (ruleOf(file, 'BOUNDED_EPISODE_OPENER').class = 'ESSENTIAL'))
    // Re-pointed 24 October 2026 (R1): with no aside cut left, Details 10 is said whole. Was: the restart cut, OVERVIEW_6_CUT.
    assert.deepEqual(textsOf(openerEssential), [OVERVIEW_4, W1_S2, OVERVIEW_5, `${DETAILS_10}.`])
    assert.ok(!openerEssential.fullRules.some(p => p.text === DETAILS_10), JSON.stringify(openerEssential.fullRules))
    // The score's value made ESSENTIAL: "Each score is worth 1 point" is said, in both groups, and no longer pointed to.
    const valueEssential = composed(file => (ruleOf(file, 'SCORE_VALUE').class = 'ESSENTIAL'))
    for (const group of valueEssential) {
        assert.ok(textsOf(group).includes(`${DETAILS_16}.`), JSON.stringify(textsOf(group)))
        assert.deepEqual(group.fullRules.filter(p => p.text === DETAILS_16), [])
    }
    // The way-level rule removed: nothing else changes for this game (every way is also shown by its CONSTITUTIVE fields).
    const noWays = composed(file => (file.rules = file.rules.filter((rule: any) => rule.id !== 'EVERY_WAY_TO_SCORE')))
    assert.deepEqual(noWays.map(textsOf), groupsOf(coachOverviewDraftOf('A01', blocks)).map(textsOf))
    assert.deepEqual(noWays.map(group => group.ways), [[], []])
    // Stage 3F: the exclusion said to follow from a condition this group has no field of (TEST-ONLY: the regain's control, under another way
    // to score): it is material, so his building rule holds nothing left to Coach Details and is said whole, as with the exclusion
    // ESSENTIAL; nothing points to it for a detail left out.
    const [ungoverned] = composed(file => (ruleOf(file, 'EXCLUSION_CONDITION').followsFrom = ['ALSO_COUNTS_CONTROL']))
    assert.deepEqual(textsOf(ungoverned), [W1.sentence, W3.sentence, OVERVIEW_RESTART])
    assert.ok(ungoverned.requirements.filter(r => r.rule === 'EXCLUSION_CONDITION').every(r => r.statedBy.includes(0) && !r.pointedTo))
    assert.ok(W1.sentence.endsWith(W1_S3))
    // Following from nothing, it stays a DETAIL behind the pointer: what it follows from is a judgement of the table, never needed by code.
    const [plainDetail] = composed(file => delete ruleOf(file, 'EXCLUSION_CONDITION').followsFrom)
    assert.deepEqual(textsOf(plainDetail), [OVERVIEW_4, W1_S2, OVERVIEW_5, OVERVIEW_RESTART])
})

test("6. without his eligibility sentence nothing states the building team's eligibility; read as stating it (TEST-ONLY), his second sentence makes it unnecessary", () => {
    const fixture = buildActivityWithFixture(a01At(12, 1)).fixture
    const withoutW3 = approvedWording().filter(entry => entry.id !== 'A01-W3')
    // TEST-ONLY: Details rendered without the entry (the build would say his first sentence, which also covers the bound and the origin).
    const blocks = blocksOf(fixture).map(block => ({ ...block, rendered: renderConcreteGame(block.fixture, withoutW3) }))
    for (const block of blocks) assert.ok(!block.rendered.instructions.some(i => i.text === W3.sentence) && block.rendered.instructions.some(i => i.text === W1.sentence))
    const states = (group: ScoringGroup, rule: string) => group.sentences.some(s => s.states.some(x => x.rule === rule))
    // (a) Re-pointed 22 October 2026 (stage 3F). Under the PROPOSED record his second sentence states the origin and not the eligibility
    // (FOR HIS CONFIRMATION), and his rule said whole states what its sentences state; so without his eligibility sentence nothing states
    // the eligibility, and the group is withheld, saying which of his entries cites it. Was: his rule said whole, counted for the bound.
    const [recordOnly] = groupsOf(coachOverviewDraftOf('A01', blocks, undefined, { wording: withoutW3 }))
    assert.equal(recordOnly.withheld, true)
    assert.ok(recordOnly.why.some(why => why.includes('rule BOUNDED_CREDIT) is stated by no sentence of the group (A01-W1 cites it, and no recorded reading says those words state it)')), JSON.stringify(recordOnly.why))
    // (b) A TEST-ONLY reading in which his second sentence also states the eligibility (the alternative reading his confirmation decides):
    // the group is complete from his first two sentences, and his eligibility sentence, where it is said in Details, adds nothing to the
    // overview and is left to Coach Details (the most concise set).
    const secondStatesEligibility: CoverReading = (entry, units) => {
        const read = READING(entry, units)
        return read && entry.id === 'A01-W1' && units.some(unit => unit.sentence === 1 && unit.part === 'WHOLE_SENTENCE') ? [...new Set([0, ...read])].sort((a, b) => a - b) : read
    }
    const [readTwo] = groupsOf(coachOverviewDraftOf('A01', blocks, undefined, { reading: secondStatesEligibility, wording: withoutW3 }))
    assertComplete(readTwo, 'second sentence read as stating the eligibility')
    // Re-pointed 24 October 2026 (R2): with the common restart's line (DEAD_BALL_RESTART, ESSENTIAL) after them. Was: his two sentences.
    assert.deepEqual(textsOf(readTwo), [OVERVIEW_4, W1_S2, OVERVIEW_RESTART])
    const [withW3] = groupsOf(coachOverviewDraftOf('A01', blocksOf(fixture), undefined, { reading: secondStatesEligibility }))
    assertComplete(withW3, 'with his eligibility sentence in Details')
    assert.deepEqual(textsOf(withW3), [OVERVIEW_4, W1_S2, OVERVIEW_RESTART])
    // In no case is the progression said without the bound and the origin.
    for (const group of [readTwo, withW3]) {
        assert.ok(states(group, 'PROGRESSION_CONDITION') && states(group, 'BOUNDED_CREDIT') && states(group, 'ORIGIN_CONDITION'))
    }
    // Under the record, with his eligibility sentence: the origin by his second sentence and the eligibility by his eligibility sentence (test 3).
    const [production] = groupsOf(coachOverviewDraftOf('A01', blocksOf(fixture)))
    assert.deepEqual(textsOf(production), [OVERVIEW_4, W1_S2, OVERVIEW_5, OVERVIEW_RESTART])
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
    const [noWay] = groupsOf(coachOverviewDraftOf('A01', blocks, undefined, { essentials: tableWith(file => (ruleOf(file, 'PROGRESSION_CONDITION').class = 'ESSENTIAL')) }))
    assert.equal(noWay.withheld, true)
    assert.deepEqual(noWay.why, ['the way to score value.primaryEvent has no field the essentials table classes CONSTITUTIVE, so it cannot be shown to appear'])
    // A field two rules class (conditions that overlap on one element) is ambiguous, never resolved by the rules' order.
    // (Re-pointed 21 October 2026, stage 3D: an element condition compares with a value of a closed register vocabulary, so the overlapping
    // TEST-ONLY rule compares with one the game does not hold, where it compared with "TEST-ONLY".)
    const overlapping = tableWith(file => file.rules.push({ id: 'TEST_ONLY_ORIGIN', class: 'DETAIL', rows: ['V4'], where: { field: 'type', notEquals: 'eligibility' }, why: 'TEST-ONLY', status: 'PROPOSED' }))
    assert.equal(overlapping.why, null)
    const [ambiguous] = groupsOf(coachOverviewDraftOf('A01', blocks, undefined, { essentials: overlapping }))
    assert.equal(ambiguous.withheld, true)
    assert.ok(ambiguous.why.some(why => why.includes('is classed by more than one rule (ORIGIN_CONDITION, TEST_ONLY_ORIGIN)')), JSON.stringify(ambiguous.why))
    // The served activity is the coach's activity, whatever the overview composes: the overview is never a reason to refuse or change it.
    const coach = buildActivity(a01At(12, 1)) as ServedActivity
    assert.equal(coach.outcome, 'served')
    assert.deepEqual(admin(a01At(12, 1)).rendered, coach.rendered)
})

test('8. DRAFT shortenings are prefixes of their sentence, citing only the parts they keep whole', () => {
    const part = (text: string, from: string[]) => ({ text, status: 'DERIVED' as const, from, quantities: [], bindings: [] })
    const sentence = { text: 'TEST-ONLY one: two; three. Four: five (six)', parts: [part('TEST-ONLY one', ['p1']), part(': two; three.', ['p2']), part(' Four: five (six)', ['p3'])] }
    const shortenings = draftShorteningsOf(sentence)
    // Re-pointed 21 October 2026 (stage 3D, a tightening): an ELABORATION or ASIDE cut splitting a part keeps none of its citations, as
    // every other cut. Was: ['p1', 'p2', 'p3'] for both (the part they cut kept its citations).
    assert.deepEqual(
        shortenings.map(s => [s.cut, s.text, s.drops, s.from]),
        [
            ['CLAUSE', 'TEST-ONLY one: two.', '; three. Four: five (six)', ['p1']],
            ['SENTENCE', 'TEST-ONLY one: two; three.', 'Four: five (six)', ['p1', 'p2']],
            ['ELABORATION', 'TEST-ONLY one: two; three. Four.', ': five (six)', ['p1', 'p2']],
            ['ASIDE', 'TEST-ONLY one: two; three. Four: five.', '(six)', ['p1', 'p2']],
        ],
    )
    // A part an aside closes, rendered as its own part, is kept whole by the cut before it.
    const asidePart = draftShorteningsOf({ text: 'TEST-ONLY one: two (three)', parts: [part('TEST-ONLY one', ['p1']), part(': two', ['p2']), part(' (three)', ['p3'])] })
    assert.deepEqual(asidePart.map(s => [s.cut, s.from]), [['ELABORATION', ['p1']], ['ASIDE', ['p1', 'p2']]])
    // Never a word added or changed: each is its sentence's first words, closed by a full stop.
    for (const s of shortenings) assert.ok(sentence.text.startsWith(s.text.slice(0, -1)), s.text)
    // Only the last colon is an elaboration: the first one, inside a part, cuts it and keeps none of its citations.
    assert.ok(!shortenings.some(s => s.text === 'TEST-ONLY one.'))
    // Parts that do not make up the sentence: no shortening (its citations cannot be accounted for).
    assert.deepEqual(draftShorteningsOf({ text: 'TEST-ONLY one: two', parts: [part('TEST-ONLY one', ['p1'])] }), [])
    assert.deepEqual(draftShorteningsOf({ text: 'TEST-ONLY one: two' }), [])
    // The production cuts: Details 10 to its colon or its aside, Details 14 to its last colon. Re-pointed 22 October 2026 (stage 3E, fix (a)):
    // the renderer makes each restart moment a part citing its trigger, and the aside a part of its own citing the trigger it qualifies, so
    // the cut to the aside keeps every citation of Details 10 and the cut to its colon none of the moments; Details 14's lead is a part, so
    // the cut before its elaboration keeps every citation. Was (stage 3D): neither cut of 10 kept a moment, and 14's cut kept nothing.
    const served = admin(a01At(12, 1)).rendered.instructions
    const tenSaid = served.find(i => i.text === DETAILS_10)!
    const ten = draftShorteningsOf(tenSaid)
    // Re-pointed 24 October 2026 (R1): Details 10 no longer ends with its aside (his reply filed 27 October 2026, item 4, adds moments after
    // it), so its one cut is to its colon. Was: that cut and the cut to the aside (OVERVIEW_6_CUT), which kept every citation.
    // Re-pointed 24 October 2026 (R2): its lead is the common restart's rule, so the cut to its colon is the overview's restart line, keeping
    // the start's trigger (said by "starts play") and the policy, and none of the moments' triggers. Was: "The building team's goalkeeper
    // restarts play.", keeping no trigger.
    assert.deepEqual(ten.map(s => [s.cut, s.text]), [['ELABORATION', OVERVIEW_RESTART]])
    assert.equal(ten[0].from.filter(p => p.endsWith('.selector')).length, 1, 'the start, said by "starts play"')
    assert.ok(ten[0].from.includes('restartPolicy.deadBall'))
    assert.ok(ten[0].from.length < tenSaid.from.length)
    const fourteenSaid = served.find(i => i.text === DETAILS_14)!
    const fourteen = draftShorteningsOf(fourteenSaid)
    assert.deepEqual(fourteen.map(s => [s.cut, s.text, s.from]), [['ELABORATION', OVERVIEW_7, fourteenSaid.from]])
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
            // Stage 3F: the line saying how every team scores leads; the bonus is a qualification.
            assert.deepEqual(groups[0].sentences.map(s => s.place), expected.map((_, n) => (n === 0 ? 'LEAD' : 'QUALIFICATION')))
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
    // Re-pointed 22 October 2026 (stage 3F). No reading: his (TEST-ONLY) wording can be shown to state nothing, so the group is withheld,
    // naming the entry that cites the field. Was: the entry said whole, counted for what it cites.
    const plain = scoringGroupsOf(fixture, rendered, extractsFor(fixture.game, { wording }).extracts, essentialsTable(), wording, wholeReadingsFor(fixture.game, { wording }))
    assert.equal(plain.length, 1)
    assert.equal(plain[0].withheld, true)
    assert.ok(plain[0].why.some(why => why.includes('(TEST-LOCATED cites it, and no recorded reading says those words state it)')), JSON.stringify(plain[0].why))
    // A TEST-ONLY reading of both its sentences. This game has no control condition for the exclusion to follow from, so the exclusion is
    // material (stage 3F, `followsFrom`): the entry then holds nothing left to Coach Details, and is said whole as his wording first.
    const reading: CoverReading = (e, units) => {
        if (e.id !== 'TEST-LOCATED') return null
        const each = units.map(unit => (unit.part !== 'WHOLE_SENTENCE' ? null : unit.sentence === 0 ? [0, 1] : unit.sentence === 1 ? [2, 3] : null))
        return each.every(Boolean) ? (each as number[][]).flat() : null
    }
    const read = scoringGroupsOf(fixture, rendered, extractsFor(fixture.game, { wording, reading }).extracts, essentialsTable(), wording, wholeReadingsFor(fixture.game, { wording, reading }))
    assertComplete(read[0], 'A04 read')
    // The game's own scoring sentence (DRAFT, one sentence) leads; his whole entry follows it.
    const SCORES = 'A team scores 1 point by getting the ball across the line it is attacking.'
    assert.deepEqual(read[0].sentences.map(s => [s.text, s.form, s.place, s.fullRule]), [[SCORES, 'WHOLE', 'LEAD', null], [entry.sentence, 'WHOLE', 'QUALIFICATION', null]])
    assert.ok(read[0].requirements.filter(r => r.rule === 'EXCLUSION_CONDITION').every(r => r.statedBy.length > 0 && !r.pointedTo), 'the material exclusion is stated')
    // The same exclusion following from nothing (TEST-ONLY table): a DETAIL, left to Coach Details behind the pointer, and the extract of
    // the first sentence leads alone.
    const noFollows = essentialsLoadOf((() => {
        const file = copy(TABLE)
        delete ruleOf(file, 'EXCLUSION_CONDITION').followsFrom
        return file
    })())
    const detail = scoringGroupsOf(fixture, rendered, extractsFor(fixture.game, { wording, reading }).extracts, noFollows, wording, wholeReadingsFor(fixture.game, { wording, reading }))
    assertComplete(detail[0], 'A04 exclusion a plain DETAIL')
    assert.ok(!textsOf(detail[0]).includes(entry.sentence))
    const extract = detail[0].sentences.find(s => s.form === 'EXTRACT')!
    assert.deepEqual([extract.text, extract.wording, extract.extractId], ['Test team: Score by crossing the test line.', 'DERIVED_FROM_APPROVED', 'TEST-LOCATED:s1'])
    assert.deepEqual([extract.fullRule!.text, extract.fullRule!.because], [entry.sentence, ['DETAIL_LEFT_OUT', 'SHORTENED_WAY_TO_SCORE']])
    // It states more of the first way to score than the game's own sentence, and both are one sentence: it leads.
    assert.equal(extract.place, 'LEAD')
    assert.deepEqual(textsOf(detail[0]), ['Test team: Score by crossing the test line.', SCORES])
})

test("10. only an administrator's answer carries the draft; the module and the table name nothing of the first activity", () => {
    // Re-pointed 24 October 2026 (K3): the stored session states no goal, as a01At's does.
    const stored: any = { _id: 'TEST-ONLY', createdBy: 'TEST-ONLY', playerCount: 12, fieldLength: '40', fieldWidth: '30', specializedRoles: { ...none, [ROLE]: 1 }, objects: NO_GOAL }
    const coach = reviewActivity(stored, { learningGoalId: 'A01', durationMin: 20 }) as ServedActivity
    const asAdmin = reviewActivity(stored, { learningGoalId: 'A01', durationMin: 20 }, { includeDrafts: true }) as ServedActivity
    assert.ok(!('overviewDraft' in coach))
    // Re-pointed 21 October 2026 (stage 3D): the coach is served the overview's words and its "full rule" pointers (DRAFT label), never the
    // table, its status or its label. Was: no "full rule" in the coach's answer at all. Re-pointed 22 October 2026 (stage 3F): the coach's
    // scoring is its lead lines, its qualifications and the pointers no line carries. Re-pointed 22 October 2026 (polish pass P1): one
    // group per team (its lines and its pointers), then the pointers every team's group has.
    assert.ok(!JSON.stringify(coach).includes('PROPOSED') && !JSON.stringify(coach).includes('essentials'))
    const scoring = coach.overview!.scoring
    const pointers = [...scoring.groups.flatMap(group => [...group.lines.flatMap(line => (line.fullRule ? [line.fullRule] : [])), ...group.fullRules]), ...scoring.fullRules]
    assert.ok(pointers.length > 0 && pointers.every(pointer => pointer.label === FULL_RULE_LABEL))
    assert.equal(asAdmin.overviewDraft!.served, true)
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
    for (const literal of ['progression', 'origin', "'control'", 'exclusion', "'V2'", "'V4'", "'B8'", 'V28', 'V31', "'BOUNDED_CREDIT'", 'ORIGIN_CONDITION', 'EVERY_WAY_TO_SCORE', 'CONTROL_CONDITION', 'goalkeeper', 'WHOLE_GAME'])
        assert.ok(!code.includes(literal), literal)
    // His approved table is unchanged and holds no derived record.
    const approvedTable = fs.readFileSync(APPROVED_WORDING_FILE, 'utf8')
    for (const word of ['DERIVED_FROM_APPROVED', 'CONSTITUTIVE', 'ESSENTIAL', '"keeps"', 'followsFrom', 'doesNotState']) assert.ok(!approvedTable.includes(word), word)
    assert.deepEqual(approvedWording().map(entry => entry.id), ['A01-W1', 'A01-W2', 'A01-W3'])
})

console.log(`overview-scoring.unit.ts — ${passed} passed`)
