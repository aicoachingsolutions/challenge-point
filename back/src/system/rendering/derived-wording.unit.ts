/**
 * The three wording statuses as data, and verbatim extracts of approved wording — stage 3B, 21 October 2026.
 *
 * His reply filed 22 October 2026, item 4: *"I approve generating abbreviated versions of approved statements for the Coach Overview,
 * provided their meaning remains accurate. The full approved wording should be preserved in Coach Details."* and *"Please distinguish
 * between: Approved canonical wording. An abbreviated presentation derived from approved wording. Newly proposed language awaiting
 * approval."* and *"This should be handled as a general communication capability, not as a special case for Play Out from the Back."*
 *
 * Pinned here:
 *
 *   1. Coach Details: every sentence's status is the rule's as before (decided by text), now with the entry or template it is; approved
 *      wording is said whole, so no Details sentence is DERIVED_FROM_APPROVED;
 *   2. the extracts generated for A01 in each block: whole sentences, or a leading clause ending at ";", in order, each DERIVED_FROM_APPROVED
 *      with its source entry and a cover accounting that exactly partitions the entry's covers; since stage 3E the two parts the PROPOSED
 *      readings record reads keep what it gives them, named with that record, and every other keeps nothing and leaves every cover, at the
 *      field the Details sentence cites; the administrator's overview draft carries them;
 *   3. an extract with one changed word (or any other departure from its source's parts) is refused; so is one relabelled, or one hiding
 *      the sentence it skips between its parts (`omitsBetween`, structural only);
 *   4. a cover accounting that does not partition the source's covers, or (against the game) leaves a cover at another field, is refused;
 *      a recorded reading (TEST-ONLY) is carried and checked; an extract declaring a reading for itself is refused unless the caller
 *      hands the reading it was built from (none is recorded in production);
 *   5. an approved entry that stops matching the game demotes its extracts to withheld (TEST-ONLY copies); an entry about nothing the
 *      game holds has none; the documented limit: a located entry whose locator changes gives nothing, and Details then refuse;
 *   6. a part of a DRAFT sentence is DRAFT, never derived;
 *   7. generality: a second synthetic Learning Goal fixture (the A04 Golden Case, with TEST-ONLY conditions and TEST-ONLY entries, one
 *      located and one with a slot) generates, cites and withholds by the same rules;
 *   8. only an administrator's answer carries extracts; the module writes no goal, entry, condition type or value; the approved table holds
 *      no derived record;
 *   9. a block whose extracts cannot be generated lists none, with a gap for an administrator, and the overview's other parts stand.
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { reviewActivity } from './activity-review'
import { APPROVED_WORDING_FILE, approvedTemplateSentences, ApprovedWording, approvedWording } from './approved-wording'
import { PROPOSED_READING_RECORD, recordedReading } from './approved-wording-readings'
import { buildActivity, buildActivityForReview, buildActivityWithFixture, RefusedActivity, ServedActivity } from './build-activity'
import { coachOverviewDraftOf } from './coach-overview'
import {
    approvedEntriesSaid,
    CoverReading,
    DerivedExtract,
    detailsWordingOf,
    draftExtractsOf,
    extractStatusOf,
    extractsFor,
    extractUnusableBecause,
    omittedBetweenOf,
    sentencesOf,
    unitSelectionsOf,
} from './derived-wording'
import { MECHANISM_DEMONSTRATIONS } from './mechanism-demonstrations'
import { approvedSentences, renderConcreteGame } from './render-concrete-game'
import { specializedRoleNames } from './session-envelope'

let passed = 0
function test(name: string, body: () => void): void {
    body()
    passed++
    console.log(`  ok  ${name}`)
}
console.log('the three wording statuses and verbatim extracts of approved wording (stage 3B)')

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

/** His sentences, as approved-coach-wording.json holds them (read through the loader, so a test of the file's words is the loader's). */
const entryOf = (id: string): ApprovedWording => approvedWording().find(entry => entry.id === id)!
const W1 = entryOf('A01-W1')
const W2 = entryOf('A01-W2')
const W3 = entryOf('A01-W3')
/** The BUILD PLAN's EXPECTED PRESENTATION, overview sentences 4 and 8 ([derived from approved: W1, sentence 1 extract] and [W2, leading-clause extract]). */
const OVERVIEW_4 = 'Building team: Score by carrying the ball beyond the marked line or passing to a teammate who receives it under control beyond the line.'
const OVERVIEW_8 = 'The pressing team also scores by winning the ball inside that zone, provided it genuinely establishes possession.'
const W1_S2 = "The progression must begin with the goalkeeper's build-out and occur before the building team loses possession."
const W1_S3 = 'Uncontrolled clearances do not score.'
/**
 * Stage 3E: the covers the PROPOSED record (docs/audits/approved-wording-readings.json, not his reading) says these two parts state — his
 * first sentence of the building rule the progression and control covers (4-11), the regain sentence's leading clause its team, trigger
 * and control (0-2). approved-wording-readings.unit.ts pins the record itself.
 */
const PROPOSED_KEEPS: Record<string, number[]> = { 'A01-W1:s1': [4, 5, 6, 7, 8, 9, 10, 11], 'A01-W2:c1': [0, 1, 2] }

test('1. Coach Details: each sentence\'s status is the rule\'s as before, now naming the entry or template it is; none is derived', () => {
    for (const [players, keepers] of [[12, 1], [12, 2], [11, 1]] as const) {
        const what = `A01 ${players}/${keepers}`
        const served = admin(a01At(players, keepers))
        const games = blocksOf(buildActivityWithFixture(a01At(players, keepers)).fixture).map(block => block.fixture.game)
        assert.equal(games.length, 2, what)
        // The rule before stage 3B, recomputed here: approved where the text is a sentence approved wording says for a block's game, or one
        // of his template sentences without its final full stop.
        const said = games.flatMap(game => approvedSentences(game))
        const templates = approvedTemplateSentences().map(template => template.sentence.replace(/\.$/, ''))
        const instructions = served.evidence!.sections.instructions
        for (const instruction of instructions) {
            const before = said.some(sentence => sentence.text === instruction.text) || templates.includes(instruction.text) ? 'APPROVED' : 'DRAFT'
            assert.equal(instruction.wording, before, `${what}: ${instruction.text}`)
            assert.equal(instruction.wordingSource === null, instruction.wording === 'DRAFT', `${what}: a source exactly where approved`)
        }
        assert.deepEqual(
            instructions.filter(i => i.wording === 'APPROVED').map(i => [i.wordingSource, i.text === W1.sentence || i.text === W2.sentence || i.text === W3.sentence]),
            [
                [{ kind: 'APPROVED_TEMPLATE', id: 'POSSESSION_CONTINUES' }, false],
                [{ kind: 'APPROVED_ENTRY', id: 'A01-W1' }, true],
                [{ kind: 'APPROVED_ENTRY', id: 'A01-W3' }, true],
                [{ kind: 'APPROVED_ENTRY', id: 'A01-W2' }, true],
            ],
            what,
        )
        assert.ok(!instructions.some(i => (i.wording as string) === 'DERIVED_FROM_APPROVED'), `${what}: Details say approved wording whole`)
        // The entries said, entry by entry, are exactly what the renderer says with the whole table.
        for (const game of games) {
            const byEntry = approvedEntriesSaid(game)
            assert.deepEqual(byEntry.map(entry => entry.text).sort(), approvedSentences(game).map(sentence => sentence.text).sort(), what)
            assert.deepEqual(byEntry.map(entry => entry.id), ['A01-W1', 'A01-W2', 'A01-W3'], what)
            for (const entry of byEntry) assert.deepEqual(entry.from, approvedSentences(game).find(sentence => sentence.text === entry.text)!.from, what)
        }
    }
    // At the function: his template sentence word for word (no final full stop) is approved; filled with any other value it is DRAFT.
    assert.deepEqual(detailsWordingOf('When possession changes, play carries on without a stoppage, and each team keeps attacking the same zone', []), { wording: 'APPROVED', source: { kind: 'APPROVED_TEMPLATE', id: 'POSSESSION_CONTINUES' } })
    assert.deepEqual(detailsWordingOf('When possession changes, play carries on without a stoppage, and each team keeps attacking the same line', []), { wording: 'DRAFT', source: null })
    assert.deepEqual(detailsWordingOf('TEST-ONLY words', [{ id: 'T', text: 'TEST-ONLY words', from: [] }]), { wording: 'APPROVED', source: { kind: 'APPROVED_ENTRY', id: 'T' } })
})

test('2. the A01 extracts, per block: whole sentences or a leading clause, in order, derived, sourced, each partitioning its entry\'s covers', () => {
    // The sentences and leading clauses of his entries.
    assert.deepEqual(sentencesOf(W1.sentence).map(s => [s.text, s.clause]), [[OVERVIEW_4, null], [W1_S2, null], [W1_S3, null]])
    assert.deepEqual(sentencesOf(W2.sentence).map(s => s.clause), ['The pressing team also scores by winning the ball inside that zone, provided it genuinely establishes possession'])
    assert.equal(sentencesOf(W3.sentence).length, 1)
    assert.deepEqual(unitSelectionsOf(sentencesOf(W3.sentence)), [], 'one sentence with no leading clause admits no extract: said whole, it is approved')
    const expected: [string, string][] = [
        ['A01-W1:s1', OVERVIEW_4],
        ['A01-W1:s2', W1_S2],
        ['A01-W1:s3', W1_S3],
        ['A01-W1:s1+s2', `${OVERVIEW_4} ${W1_S2}`],
        ['A01-W1:s1+s3', `${OVERVIEW_4} ${W1_S3}`],
        ['A01-W1:s2+s3', `${W1_S2} ${W1_S3}`],
        ['A01-W2:c1', OVERVIEW_8],
    ]
    for (const [players, keepers] of [[12, 1], [12, 2], [11, 1]] as const) {
        const what = `A01 ${players}/${keepers}`
        const served = admin(a01At(players, keepers))
        const blocks = blocksOf(buildActivityWithFixture(a01At(players, keepers)).fixture)
        assert.deepEqual(served.overviewDraft!.extracts.map(block => block.blockId), blocks.map(block => block.blockId), what)
        for (const { blockId, fixture } of blocks) {
            const listed = served.overviewDraft!.extracts.find(block => block.blockId === blockId)!
            // The administrator's draft carries exactly what the generator gives for this block's own game. Re-pointed 22 October 2026
            // (stage 3E): generated with the PROPOSED record of what parts of his wording state (`recordedReading`), as the serving path
            // generates them. Was: `extractsFor(fixture.game)`, with no reading.
            assert.deepEqual(listed, { blockId, ...extractsFor(fixture.game, { reading: recordedReading() }) }, `${what} ${blockId}`)
            assert.deepEqual(listed.withheld, [], `${what} ${blockId}`)
            assert.deepEqual(listed.extracts.map(e => [e.id, e.text]), expected, `${what} ${blockId}`)
            // What each omits between its parts, structurally: only sentences 1 and 3 together skip one (the build-out sentence, 2).
            assert.deepEqual(listed.extracts.filter(e => e.omitsBetween.length).map(e => [e.id, e.omitsBetween]), [['A01-W1:s1+s3', [2]]], `${what} ${blockId}`)
            // Each Details sentence of his, in this block's own render, cites what its extracts account for.
            const details = renderConcreteGame(fixture).instructions
            for (const extract of listed.extracts) {
                const entry = entryOf(extract.source.id)
                assert.equal(extract.wording, 'DERIVED_FROM_APPROVED')
                assert.equal(extractUnusableBecause(extract, { game: fixture.game, reading: recordedReading() }), null, extract.id)
                assert.deepEqual([...extract.keeps, ...extract.leaves].map(ref => ref.index).sort((a, b) => a - b), entry.covers.map((_, n) => n), `${extract.id}: a partition`)
                // Re-pointed 22 October 2026 (stage 3E): the two parts the PROPOSED record reads are kept by it, named with its record and
                // label, citing exactly their kept covers' fields; every other extract has no reading: it keeps nothing, cites nothing, and
                // leaves every cover to his entry said whole in Details. Was: every extract NONE_RECORDED.
                const kept = PROPOSED_KEEPS[extract.id]
                if (kept) {
                    assert.deepEqual([extract.reading, extract.readingRecord, extract.keeps.map(ref => ref.index)], ['RECORDED', PROPOSED_READING_RECORD, kept], extract.id)
                    assert.deepEqual(extract.from, extract.keeps.map(ref => ref.path), extract.id)
                    assert.equal(extract.readingRecord!.label, 'reading PROPOSED, awaiting confirmation')
                } else {
                    assert.equal(extract.reading, 'NONE_RECORDED')
                    assert.deepEqual([extract.keeps, extract.from, extract.bindings, extract.readingRecord], [[], [], [], null], extract.id)
                }
                const whole = details.find(i => i.text === entry.sentence)!
                assert.ok(whole, `${extract.id}: its source is said whole in Details`)
                assert.deepEqual(new Set([...extract.keeps, ...extract.leaves].map(ref => ref.path)), new Set(whole.from), `${extract.id}: each cover kept or left at the field Details cite`)
                ;[...extract.keeps, ...extract.leaves].forEach(ref => assert.deepEqual([ref.row, ref.element], [entry.covers[ref.index].row, entry.covers[ref.index].element ?? null], extract.id))
            }
        }
    }
    // The demonstrations' games hold none of the elements his entries speak about: no extract, and nothing withheld.
    for (const demonstration of MECHANISM_DEMONSTRATIONS) {
        const asked = buildActivityForReview({ kind: 'mechanism-demonstration', demonstrationId: demonstration.id, session: sessionAt(12, 1) }, { includeDrafts: true })
        if (asked.outcome !== 'served') continue
        assert.deepEqual((asked as ServedActivity).overviewDraft!.extracts, [{ blockId: 'ONE_GAME', extracts: [], withheld: [] }], demonstration.id)
    }
})

/** The production W1 extract of sentence 1 in A01 block 1, and that block's game. */
const [BLOCK_1] = blocksOf(buildActivityWithFixture(a01At(12, 1)).fixture)
const FIRST = (id: string): DerivedExtract => extractsFor(BLOCK_1.fixture.game).extracts.find(extract => extract.id === id)!

test('3. an extract with one changed word, or any other departure from its source\'s parts, is refused', () => {
    const extract = FIRST('A01-W1:s1')
    assert.equal(extractUnusableBecause(extract), null)
    const refused = (change: (e: any) => void): string => {
        const changed: any = copy(extract)
        change(changed)
        const why = extractUnusableBecause(changed)
        assert.ok(why, JSON.stringify(changed.text))
        assert.ok(extractUnusableBecause(changed, { game: BLOCK_1.fixture.game }), 'refused against the game too')
        return why!
    }
    assert.ok(refused(e => (e.text = e.text.replace('carrying', 'running'))).startsWith('its words are not its source\'s'))
    refused(e => (e.text = e.text.replace('under control ', '')))
    refused(e => (e.text = `${e.text} TEST-ONLY`))
    refused(e => (e.text = e.text.replace(/\.$/, '')))
    assert.equal(refused(e => (e.units = [{ sentence: 2, part: 'WHOLE_SENTENCE' }, { sentence: 0, part: 'WHOLE_SENTENCE' }])), "its parts are not in the source's order, each sentence at most once")
    assert.equal(refused(e => (e.units = [0, 1, 2].map(sentence => ({ sentence, part: 'WHOLE_SENTENCE' })))), 'it is the whole source, which is approved wording said whole, not an extract')
    assert.equal(refused(e => (e.units = [{ sentence: 0, part: 'LEADING_CLAUSE' }])), 'sentence 1 of its source has no leading clause ending at ";"')
    assert.equal(refused(e => (e.units = [{ sentence: 7, part: 'WHOLE_SENTENCE' }])), 'it names a sentence its source does not have')
    assert.equal(refused(e => (e.approvedBy = { who: 'TEST-ONLY' })), 'an extract carries no approval of its own: only his entries do')
    refused(e => (e.wording = 'APPROVED'))
    refused(e => (e.source = { kind: 'APPROVED_ENTRY', id: 'TEST-ONLY' }))
    refused(e => (e.source = { kind: 'APPROVED_TEMPLATE', id: 'POSSESSION_CONTINUES' }))
    // Its name is its source and parts: relabelled as another extract, or given an element a located entry is never said for, it is refused.
    assert.equal(refused(e => (e.id = 'A01-W1:s3')), 'it is named "A01-W1:s3", and those parts of A01-W1 are named "A01-W1:s1"')
    refused(e => (e.id = 'A01-W1:s1@activityRoles[TEST-ONLY]'))
    refused(e => delete e.id)
    // What it omits between its parts is recorded, and an extract hiding the sentence it skips is refused.
    const skipping: any = copy(FIRST('A01-W1:s1+s3'))
    assert.deepEqual(skipping.omitsBetween, [2])
    assert.equal(extractUnusableBecause(skipping, { game: BLOCK_1.fixture.game }), null)
    skipping.omitsBetween = []
    assert.equal(extractUnusableBecause(skipping), 'it says it omits [] between its parts, and its parts omit [2]')
    assert.ok(extractUnusableBecause(skipping, { game: BLOCK_1.fixture.game }))
    refused(e => (e.omitsBetween = [1]))
    refused(e => delete e.omitsBetween)
    // The rule, at the function: a skipped sentence, or the rest of one cut to its leading clause before a later part; never a stop or a late start.
    assert.deepEqual(omittedBetweenOf([{ sentence: 0, part: 'LEADING_CLAUSE' }, { sentence: 1, part: 'WHOLE_SENTENCE' }]), [1])
    assert.deepEqual(omittedBetweenOf([{ sentence: 0, part: 'WHOLE_SENTENCE' }, { sentence: 3, part: 'LEADING_CLAUSE' }]), [2, 3])
    assert.deepEqual(omittedBetweenOf([{ sentence: 1, part: 'WHOLE_SENTENCE' }, { sentence: 2, part: 'LEADING_CLAUSE' }]), [])
    // The leading clause of the regain sentence: closed by its sentence's own full stop in place of ";", and nothing more.
    const clause = FIRST('A01-W2:c1')
    assert.equal(clause.text, OVERVIEW_8)
    const longer: any = copy(clause)
    longer.text = 'The pressing team also scores by winning the ball inside that zone, provided it genuinely establishes possession; a contested touch.'
    assert.ok(extractUnusableBecause(longer))
})

test('4. a cover accounting that does not partition the source\'s covers is refused; a recorded reading (TEST-ONLY) is carried and checked', () => {
    const extract = FIRST('A01-W2:c1')
    const refused = (change: (e: any) => void, starts: string) => {
        const changed: any = copy(extract)
        change(changed)
        const why = extractUnusableBecause(changed)
        assert.ok(why && why.startsWith(starts), String(why))
    }
    refused(e => e.leaves.pop(), 'its keeps and leaves account for 3 of its source\'s 4 covers')
    refused(e => e.keeps.push(copy(e.leaves[0])), 'cover 1 of its source is accounted for twice')
    refused(e => (e.leaves[0].index = 9), 'it accounts for a cover its source does not have')
    refused(e => (e.leaves[1].row = 'V30'), 'cover 2 is named with another row or element')
    refused(e => (e.leaves[2].element = { ...e.leaves[2].element, equals: 'TEST-ONLY' }), 'cover 3 is named with another row or element')
    refused(e => delete e.keeps, 'it does not account for its source\'s covers')
    // Each cover is left at the field this game holds it on (where a full-rule pointer will look): another path is refused against the game.
    const moved: any = copy(extract)
    moved.leaves[0].path = 'space.regions[TEST-ONLY].position.along'
    assert.equal(extractUnusableBecause(moved, { game: BLOCK_1.fixture.game }), 'its keeps and leaves are not its source\'s covers as this game holds them (in order, each at the field this game says it on)')
    const reordered: any = copy(extract)
    reordered.leaves.reverse()
    assert.ok(extractUnusableBecause(reordered, { game: BLOCK_1.fixture.game })!.startsWith('its keeps and leaves are not'))
    // Keeping a cover with no reading recorded is refused, however exact the partition: what a part states is never assumed.
    refused(e => e.keeps.push(e.leaves.shift()), 'it keeps covers with no reading recorded')
    refused(e => delete e.reading, 'it does not say whether what it keeps comes from a recorded reading')
    // A TEST-ONLY reading (not his, and not ours to record): the regain clause keeping its first three covers. It is carried as RECORDED,
    // the extract cites exactly the kept covers' fields in this game, the rest are left, and the check holds it to that.
    const reading: CoverReading = (entry, units) => (entry.id === 'A01-W2' && units.length === 1 && units[0].part === 'LEADING_CLAUSE' ? [0, 1, 2] : null)
    const read = extractsFor(BLOCK_1.fixture.game, { reading }).extracts.find(e => e.id === 'A01-W2:c1')!
    assert.equal(read.reading, 'RECORDED')
    assert.deepEqual(read.keeps.map(ref => ref.row), ['V28', 'V29', 'V30'])
    assert.deepEqual(read.leaves.map(ref => ref.row), ['V31'])
    assert.deepEqual(read.from, read.keeps.map(ref => ref.path))
    // Accepted only against the reading it was built from: handed none, no reading is recorded (production), so its claim is refused.
    const NO_READING = 'it says what it keeps comes from a recorded reading, and none is recorded for its parts'
    assert.ok(extractUnusableBecause(read, { game: BLOCK_1.fixture.game })!.startsWith(NO_READING))
    assert.ok(extractUnusableBecause(read)!.startsWith(NO_READING))
    assert.equal(extractUnusableBecause(read, { game: BLOCK_1.fixture.game, reading }), null)
    assert.equal(extractUnusableBecause(read, { reading }), null)
    // Stage 3E: where its reading is recorded (and its standing) is the reading's own, never the extract's word. A TEST-ONLY reading names
    // no record, so an extract claiming the PROPOSED record under it is refused; the PROPOSED record's own extract passes under that record
    // and is refused under the TEST-ONLY reading, though its covers are the same; an extract not saying where its reading is recorded is
    // refused.
    assert.equal(read.readingRecord, null)
    const claimsRecord: any = copy(read)
    claimsRecord.readingRecord = { ...PROPOSED_READING_RECORD }
    assert.ok(extractUnusableBecause(claimsRecord, { game: BLOCK_1.fixture.game, reading })!.startsWith('it says its reading is recorded at'))
    const proposed = extractsFor(BLOCK_1.fixture.game, { reading: recordedReading() }).extracts.find(e => e.id === 'A01-W2:c1')!
    assert.deepEqual(proposed.keeps.map(ref => ref.index), read.keeps.map(ref => ref.index))
    assert.equal(extractUnusableBecause(proposed, { game: BLOCK_1.fixture.game, reading: recordedReading() }), null)
    assert.ok(extractUnusableBecause(proposed, { game: BLOCK_1.fixture.game, reading })!.startsWith('it says its reading is recorded at'))
    const unnamed: any = copy(read)
    delete unnamed.readingRecord
    assert.equal(extractUnusableBecause(unnamed, { reading }), 'it does not say where the reading it keeps by is recorded')
    // Held to the reading it claims: against no reading, or another one, what it keeps is refused.
    assert.ok(extractUnusableBecause(read, { reading: () => null })!.startsWith(NO_READING))
    assert.equal(extractUnusableBecause(read, { reading: () => [0, 1] }), 'what it keeps is not what the recorded reading gives it')
    assert.equal(extractUnusableBecause(FIRST('A01-W2:c1'), { reading }), 'what it keeps is not what the recorded reading gives it')
    const miscited: any = copy(read)
    miscited.from = [...read.from, read.leaves[0].path]
    assert.ok(extractUnusableBecause(miscited, { game: BLOCK_1.fixture.game, reading })!.startsWith('it cites'))
    // An extract that declares a reading for itself is refused, however exact its partition and citations: "Uncontrolled clearances do
    // not score." claiming to keep all of its entry's covers, and the regain clause claiming the excluded touch its words drop.
    const selfDeclared = (id: string): any => {
        const claimed: any = copy(FIRST(id))
        claimed.reading = 'RECORDED'
        claimed.keeps = claimed.leaves
        claimed.leaves = []
        claimed.from = [...new Set(claimed.keeps.map((ref: any) => ref.path))]
        return claimed
    }
    const clearances = selfDeclared('A01-W1:s3')
    assert.equal(clearances.keeps.length, W1.covers.length)
    const regainAll = selfDeclared('A01-W2:c1')
    assert.deepEqual(regainAll.keeps.map((ref: any) => ref.row), ['V28', 'V29', 'V30', 'V31'])
    for (const claimed of [clearances, regainAll]) {
        assert.ok(extractUnusableBecause(claimed)!.startsWith(NO_READING), claimed.id)
        assert.ok(extractUnusableBecause(claimed, { game: BLOCK_1.fixture.game })!.startsWith(NO_READING), claimed.id)
        assert.ok(extractUnusableBecause(claimed, { game: BLOCK_1.fixture.game, reading: () => null })!.startsWith(NO_READING), claimed.id)
    }
    // And against a recorded reading that gives it less than it claims (the TEST-ONLY one leaves the contested touch to the entry).
    assert.equal(extractUnusableBecause(regainAll, { game: BLOCK_1.fixture.game, reading }), 'what it keeps is not what the recorded reading gives it')
    // A reading naming a cover the entry does not have withholds that extract, with why; nothing is listed for it.
    const bad = extractsFor(BLOCK_1.fixture.game, { reading: entry => (entry.id === 'A01-W2' ? [9] : null) })
    assert.ok(!bad.extracts.some(e => e.source.id === 'A01-W2'))
    assert.deepEqual(bad.withheld.map(w => [w.id, w.why]), [['A01-W2:c1', 'its reading names a cover its source does not have, or one twice']])
})

test('5. an approved entry that stops matching the game demotes its extracts to withheld (TEST-ONLY copies); one about nothing held has none', () => {
    const withheldBy = (game: any, id: string) => extractsFor(game).withheld.filter(w => w.source.id === id)
    // The regain's control no longer his value: his regain sentence is not said, so its clause is withheld; W1's extracts stand.
    const regain = copy(BLOCK_1.fixture)
    regain.game.value.primaryEvent.alsoCounts[0].control = 'TEST-ONLY'
    const afterRegain = extractsFor(regain.game)
    assert.ok(!afterRegain.extracts.some(e => e.source.id === 'A01-W2'))
    assert.deepEqual(withheldBy(regain.game, 'A01-W2').map(w => [w.id, w.text]), [['A01-W2:c1', OVERVIEW_8]])
    assert.ok(withheldBy(regain.game, 'A01-W2')[0].why.startsWith('its source entry A01-W2 is not said for this game'))
    assert.equal(afterRegain.extracts.filter(e => e.source.id === 'A01-W1').length, 6)
    // The extract as listed for the production game is refused against this one.
    assert.equal(extractUnusableBecause(FIRST('A01-W2:c1'), { game: regain.game }), 'its source entry A01-W2 is not said for this game')
    // An exclusion value changed: all six of W1's extracts withheld, the regain clause listed.
    const clearance = copy(BLOCK_1.fixture)
    clearance.game.value.primaryEvent.conditions.find((c: any) => c.type === 'exclusion').value = 'TEST-ONLY'
    const afterClearance = extractsFor(clearance.game)
    assert.deepEqual(afterClearance.withheld.map(w => w.id), ['A01-W1:s1', 'A01-W1:s2', 'A01-W1:s3', 'A01-W1:s1+s2', 'A01-W1:s1+s3', 'A01-W1:s2+s3'])
    assert.deepEqual(afterClearance.extracts.map(e => e.id), ['A01-W2:c1'])
    // Never listed as derived while withheld.
    for (const game of [regain.game, clearance.game]) {
        const { extracts, withheld } = extractsFor(game)
        assert.ok(!withheld.some(w => extracts.some(e => e.id === w.id)))
    }
    // A game holding none of the elements his entries speak about (the A04 Golden Case): nothing listed, nothing withheld.
    const golden = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../../../docs/audits/a04-concrete-game-fixture.json'), 'utf8'))
    assert.deepEqual(extractsFor(golden.game), { extracts: [], withheld: [] })
    // The limit of the withheld record (module comment): a located entry whose locator value changes picks out no element, so it gives no
    // extract and no withheld record. Never shown as derived, and its element's fields are then said by no entry, so the renderer withholds
    // them and Coach Details refuse the activity at communication (no overview draft exists for it).
    const relocated = copy(BLOCK_1.fixture)
    relocated.game.value.primaryEvent.alsoCounts[0].team = 'TEST-ONLY'
    const afterRelocated = extractsFor(relocated.game)
    assert.ok(!afterRelocated.extracts.some(e => e.source.id === 'A01-W2') && !afterRelocated.withheld.some(w => w.source.id === 'A01-W2'))
    assert.deepEqual(renderConcreteGame(relocated).withheld.filter(w => w.reason === 'AWAITING_APPROVED_WORDING').map(w => w.row), W2.covers.map(cover => cover.row))
    // Its element gone: the game no longer holds what the entry said, and it gives nothing.
    const gone = copy(BLOCK_1.fixture)
    gone.game.value.primaryEvent.alsoCounts = []
    assert.ok(!extractsFor(gone.game).withheld.some(w => w.source.id === 'A01-W2') && !extractsFor(gone.game).extracts.some(e => e.source.id === 'A01-W2'))
})

test('6. a part of a DRAFT sentence is DRAFT, never derived', () => {
    assert.equal(extractStatusOf('APPROVED'), 'DERIVED_FROM_APPROVED')
    assert.equal(extractStatusOf('DRAFT'), 'DRAFT')
    assert.equal(extractStatusOf('DERIVED_FROM_APPROVED'), 'DRAFT', 'a part of a part is not re-derived: only the entry itself gives a derived extract')
    const served = admin(a01At(12, 1))
    const drafts = served.evidence!.sections.instructions.filter(i => i.wording === 'DRAFT')
    let parts = 0
    for (const instruction of drafts) {
        for (const extract of draftExtractsOf(instruction.text)) {
            parts++
            assert.equal(extract.wording, 'DRAFT', extract.text)
        }
    }
    assert.ok(parts >= 2, `${parts} parts of DRAFT sentences`)
    // The set-up-before-restarts sentence: its leading clause, DRAFT (a Details sentence carries no final full stop, so neither does it).
    const before = drafts.find(i => i.text.startsWith('Before each of these restarts'))!
    assert.deepEqual(draftExtractsOf(before.text).map(e => [e.text, e.wording]), [['Before each of these restarts, the building team and the pressing team each set up on their own side of the marked line', 'DRAFT']])
    // His template filled with another value is DRAFT in Details, and so is any part of it.
    assert.equal(detailsWordingOf('When possession changes, play carries on without a stoppage, and each team keeps attacking the same line', []).wording, 'DRAFT')
    assert.deepEqual(draftExtractsOf('TEST-ONLY one; two. Three', 'DRAFT').map(e => [e.text, e.wording]), [
        ['TEST-ONLY one; two.', 'DRAFT'],
        ['TEST-ONLY one.', 'DRAFT'],
        ['Three', 'DRAFT'],
        ['TEST-ONLY one. Three', 'DRAFT'],
    ])
    assert.ok(draftExtractsOf('TEST-ONLY one; two. Three', 'DERIVED_FROM_APPROVED').every(e => e.wording === 'DRAFT'))
})

test('7. generality: a second synthetic Learning Goal fixture (the A04 Golden Case, TEST-ONLY conditions and entries) by the same rules', () => {
    const golden = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../../../docs/audits/a04-concrete-game-fixture.json'), 'utf8'))
    const fixture = copy(golden)
    const target = fixture.game.space.regions[0].elementId
    fixture.game.value.primaryEvent.conditions = [
        { elementId: 'c:T:T-1', type: 'progression', referents: [target], value: 'TEST-ONLY across' },
        { elementId: 'c:T:T-2', type: 'control', referents: [target], value: 'TEST-ONLY held' },
        { elementId: 'c:T:T-3', type: 'exclusion', referents: [target], value: 3 },
    ]
    const approval = { who: 'TEST-ONLY', date: '2026-10-21', quote: 'TEST-ONLY, not his words', ccs: 'TEST-ONLY' }
    const at = (type: string) => ({ base: 'value.primaryEvent.conditions', field: 'type', equals: type })
    // A located entry: two sentences, the second with a leading clause.
    const located: ApprovedWording = {
        id: 'TEST-LOCATED',
        covers: [
            { row: 'V4', match: { equals: 'progression' }, element: at('progression') },
            { row: 'V6', match: { equals: 'TEST-ONLY across' }, element: at('progression') },
            { row: 'V4', match: { equals: 'control' }, element: at('control') },
            { row: 'V6', match: { equals: 'TEST-ONLY held' }, element: at('control') },
        ],
        sentence: 'Test team: Score by crossing the test line. The ball must be held there; a TEST-ONLY touch is not enough.',
        section: 'How to score',
        approvedBy: approval,
    }
    // An entry matched element by element, with a slot: the number it says is cited and bound wherever a kept part says it.
    const slotted: ApprovedWording = {
        id: 'TEST-SLOTTED',
        covers: [
            { row: 'V4', match: { equals: 'exclusion' } },
            { row: 'V6', match: { equals: 3 } },
        ],
        sentence: 'A TEST-ONLY exclusion holds. It allows {count} tries; after that it stops.',
        slots: { count: { field: 'value' } },
        section: 'How to score',
        approvedBy: approval,
    }
    const wording = [located, slotted]
    // Details say both entries whole, as approved wording.
    const details = renderConcreteGame(fixture, wording).instructions.map(i => i.text)
    assert.ok(details.includes(located.sentence) && details.includes('A TEST-ONLY exclusion holds. It allows 3 tries; after that it stops.'))
    const { extracts, withheld } = extractsFor(fixture.game, { wording })
    assert.deepEqual(withheld, [])
    assert.deepEqual(
        extracts.map(e => [e.id, e.text]),
        [
            ['TEST-LOCATED:s1', 'Test team: Score by crossing the test line.'],
            ['TEST-LOCATED:s2', 'The ball must be held there; a TEST-ONLY touch is not enough.'],
            ['TEST-LOCATED:c2', 'The ball must be held there.'],
            ['TEST-LOCATED:s1+c2', 'Test team: Score by crossing the test line. The ball must be held there.'],
            ['TEST-SLOTTED:s1@value.primaryEvent.conditions[c:T:T-3]', 'A TEST-ONLY exclusion holds.'],
            ['TEST-SLOTTED:s2@value.primaryEvent.conditions[c:T:T-3]', 'It allows 3 tries; after that it stops.'],
            ['TEST-SLOTTED:c2@value.primaryEvent.conditions[c:T:T-3]', 'It allows 3 tries.'],
            ['TEST-SLOTTED:s1+c2@value.primaryEvent.conditions[c:T:T-3]', 'A TEST-ONLY exclusion holds. It allows 3 tries.'],
        ],
    )
    for (const extract of extracts) assert.equal(extractUnusableBecause(extract, { wording, game: fixture.game }), null, extract.id)
    // The slot said in a kept part is cited and its number bound; a part without it cites nothing.
    const slotPath = 'value.primaryEvent.conditions[c:T:T-3].value'
    assert.deepEqual(extracts.find(e => e.id.startsWith('TEST-SLOTTED:c2'))!.from, [slotPath])
    assert.deepEqual(extracts.find(e => e.id.startsWith('TEST-SLOTTED:c2'))!.bindings, [{ quantity: 3, path: slotPath }])
    assert.deepEqual(extracts.find(e => e.id.startsWith('TEST-SLOTTED:s1@'))!.from, [])
    // Changing a slot's number in an extract is a changed word.
    const renumbered: any = copy(extracts.find(e => e.id.startsWith('TEST-SLOTTED:c2'))!)
    renumbered.text = 'It allows 4 tries.'
    assert.ok(extractUnusableBecause(renumbered, { wording, game: fixture.game }))
    assert.ok(extractUnusableBecause(renumbered, { wording })!.startsWith('an extract of an entry with slots is checked only against the game'))
    // A TEST-ONLY reading on this goal's entry: the first sentence keeps the progression covers; cited at this game's fields.
    const reading: CoverReading = (entry, units) => (entry.id === 'TEST-LOCATED' && units.length === 1 && units[0].sentence === 0 && units[0].part === 'WHOLE_SENTENCE' ? [0, 1] : null)
    const first = extractsFor(fixture.game, { wording, reading }).extracts.find(e => e.id === 'TEST-LOCATED:s1')!
    assert.deepEqual(first.from, ['value.primaryEvent.conditions[c:T:T-1].type', 'value.primaryEvent.conditions[c:T:T-1].value'])
    assert.deepEqual(first.leaves.map(ref => ref.path), ['value.primaryEvent.conditions[c:T:T-2].type', 'value.primaryEvent.conditions[c:T:T-2].value'])
    // The game changed so a cover no longer holds: that entry's extracts are withheld, the other's stand.
    const changed = copy(fixture)
    changed.game.value.primaryEvent.conditions[2].value = 4
    const after = extractsFor(changed.game, { wording })
    assert.deepEqual(after.extracts.map(e => e.source.id), ['TEST-LOCATED', 'TEST-LOCATED', 'TEST-LOCATED', 'TEST-LOCATED'])
    assert.deepEqual(after.withheld.map(w => [w.id, w.text]), [
        ['TEST-SLOTTED:s1', 'A TEST-ONLY exclusion holds.'],
        ['TEST-SLOTTED:s2', 'It allows {count} tries; after that it stops.'],
        ['TEST-SLOTTED:c2', 'It allows {count} tries.'],
        ['TEST-SLOTTED:s1+c2', 'A TEST-ONLY exclusion holds. It allows {count} tries.'],
    ])
    // His production entries on this goal's game: the TEST-ONLY conditions are of the types W1 names, so W1 speaks about them, does not
    // hold on their values, and its extracts are withheld; no extract of his is listed as derived for another goal's game.
    const production = extractsFor(fixture.game)
    assert.deepEqual(production.extracts, [])
    assert.ok(production.withheld.every(w => w.source.id === 'A01-W1' && w.why.startsWith('its source entry A01-W1 is not said for this game')), JSON.stringify(production.withheld.map(w => w.id)))
})

test('8. only an administrator\'s answer carries extracts; the module writes no goal, entry, condition type or value; the table holds no derived record', () => {
    const stored: any = { _id: 'TEST-ONLY', createdBy: 'TEST-ONLY', playerCount: 12, fieldLength: '40', fieldWidth: '30', specializedRoles: { ...none, [ROLE]: 1 } }
    const coach = reviewActivity(stored, { learningGoalId: 'A01', durationMin: 20 }) as ServedActivity
    const asAdmin = reviewActivity(stored, { learningGoalId: 'A01', durationMin: 20 }, { includeDrafts: true }) as ServedActivity
    assert.ok(!('overviewDraft' in coach) && !('evidence' in coach))
    assert.equal(asAdmin.overviewDraft!.extracts.length, 2)
    assert.ok(!('overviewDraft' in buildActivity(a01At(12, 1))))
    assert.ok(!JSON.stringify(coach).includes('DERIVED_FROM_APPROVED') && !JSON.stringify(coach).includes('wordingSource'))
    // The module's code names nothing of the first activity.
    const source = fs.readFileSync(path.join(__dirname, 'derived-wording.ts'), 'utf8')
    const code = source
        .split('\n')
        .filter(line => !/^\s*(\*|\/\*\*|\/\/)/.test(line))
        .join('\n')
    for (const literal of ['A01', 'A0', 'RPC-0', 'GF2', 'BUILDING', 'PRESSING', 'POSSESSION_CONTINUES', 'progression', 'origin', 'control', 'exclusion', 'V28', 'V30', 'B8']) assert.ok(!code.includes(literal), literal)
    for (const value of ['5', '20', '30', '40', '12']) assert.ok(!new RegExp(`(^|[^\\w.])${value}([^\\w.]|$)`).test(code), `the number ${value} is typed in the code`)
    // The approved table stays approved-only: no extract, derived status or cover accounting is written into it.
    const table = fs.readFileSync(APPROVED_WORDING_FILE, 'utf8')
    for (const word of ['DERIVED_FROM_APPROVED', '"keeps"', '"leaves"', '"derivedFrom"', '"units"']) assert.ok(!table.includes(word), word)
    assert.deepEqual(approvedWording().map(entry => entry.id), ['A01-W1', 'A01-W2', 'A01-W3'])
})

test('9. a block whose extracts cannot be generated lists none, with a gap; the purpose, game, parameters and other blocks stand', () => {
    const games = blocksOf(buildActivityWithFixture(a01At(12, 1)).fixture)
    assert.equal(games.length, 2)
    const whole = coachOverviewDraftOf('A01', games)
    // Re-pointed 22 October 2026 (stage 3E): the failing generator's working block uses the reading the default generator uses (the PROPOSED
    // record), so that block's extracts equal the whole draft's. Was: `extractsFor(game)`, with no reading, the default before 3E.
    const failing = coachOverviewDraftOf('A01', games, game => {
        if (game === games[1].fixture.game) throw new Error('TEST-ONLY extractor failure')
        return extractsFor(game, { reading: recordedReading() })
    })
    assert.deepEqual([failing.purpose, failing.blocks, failing.sameTextInEveryBlock], [whole.purpose, whole.blocks, whole.sameTextInEveryBlock])
    assert.deepEqual(failing.extracts, [whole.extracts[0], { blockId: games[1].blockId, extracts: [], withheld: [] }])
    assert.deepEqual(whole.gaps, [])
    assert.deepEqual(failing.gaps, [{ part: 'extracts', blockId: games[1].blockId, what: 'the extracts of approved wording could not be generated: TEST-ONLY extractor failure' }])
    // The administrator's draft as built is the whole one (re-pointed 21 October 2026, stage 3D: plus the agreement check's verdict, the
    // overview as presented and its reading evidence, which serving adds; the composed parts are unchanged).
    const { served, check, reading, presented, ...built } = admin(a01At(12, 1)).overviewDraft!
    const { served: _served, check: _check, reading: _reading, presented: _presented, ...composed } = whole
    assert.deepEqual(built, composed)
    assert.deepEqual([served, check!.verdict, !!reading, !!presented], [true, 'PASS', true, true])
    assert.deepEqual([_served, _check, _reading, _presented], [false, null, null, null])
})

console.log(`derived-wording.unit.ts — ${passed} passed`)
