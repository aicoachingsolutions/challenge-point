/**
 * What a part of his approved wording states: the PROPOSED record, loaded and checked — stage 3E, 22 October 2026.
 *
 * His reply filed 22 October 2026, item 4: *"I approve generating abbreviated versions of approved statements for the Coach Overview,
 * provided their meaning remains accurate."* and *"Shortening must not introduce new meanings, omit a condition that changes the essential
 * understanding, or silently turn a qualified rule into an unrestricted one."*
 *
 * Pinned here:
 *
 *   1. the production record: PROPOSED, no approvedBy anywhere, copied beside the bundle; exactly the two readings the coordinator decided
 *      (A01-W1 sentence 1: the progression and control covers 4-11; A01-W2's leading clause: V28, V29, V30, leaving V31); every cover
 *      justified by words of his found verbatim in that part, and by the entry's own note where it maps the field to words; the reading it
 *      gives, with its record; his approved table unchanged;
 *   2. the loader refuses: an unknown entry; a part the entry does not have; words that are not the part's; a cover not in the entry (index,
 *      row or locator); a cover twice; words of his not found verbatim in that part; a note not found verbatim in the entry's note; approvedBy
 *      anywhere; a status other than PROPOSED; an unknown key; a part read twice; a reading stating nothing or giving no reason;
 *   3. an unusable record gives no reading, and the overview then says his sentences whole; a reading applies only to the entry it was
 *      checked against;
 *   4. the module's code names no entry, row, condition type or value of the first activity.
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { APPROVED_WORDING_FILE, ApprovedWording, approvedWording } from './approved-wording'
import {
    coverReadingOf,
    PROPOSED_READING_RECORD,
    READING_PROPOSED_LABEL,
    readingsLoadOf,
    readingsUnusableBecause,
    recordedReading,
    recordedReadings,
    READINGS_SOURCE,
} from './approved-wording-readings'
import { buildActivityWithFixture } from './build-activity'
import { coachOverviewDraftOf } from './coach-overview'
import { extractsFor, NO_RECORDED_READING, sentencesOf } from './derived-wording'
import { specializedRoleNames } from './session-envelope'

let passed = 0
function test(name: string, body: () => void): void {
    body()
    passed++
    console.log(`  ok  ${name}`)
}
console.log('what a part of his approved wording states: the PROPOSED readings record (stage 3E)')

const RECORD_FILE = path.resolve(__dirname, '../../../../docs/audits/approved-wording-readings.json')
const RECORD = JSON.parse(fs.readFileSync(RECORD_FILE, 'utf8'))
const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value))
const entryOf = (id: string): ApprovedWording => approvedWording().find(entry => entry.id === id)!
const W1 = entryOf('A01-W1')
const W2 = entryOf('A01-W2')
const readingOf = (file: any, entry: string) => file.readings.find((reading: any) => reading.entry === entry)

test('1. the production record: PROPOSED, the two decided readings, every cover justified by his words; the reading it gives', () => {
    assert.equal(RECORD.status, 'PROPOSED')
    assert.ok(!JSON.stringify(RECORD).includes('"approvedBy"'), 'a reading of his wording carries no approval of its own')
    assert.equal(readingsUnusableBecause(RECORD), null)
    const load = recordedReadings()
    assert.deepEqual([load.status, load.why], ['PROPOSED', null])
    // build.js copies it into dist/knowledge, where the bundled server reads it.
    assert.ok(fs.readFileSync(path.resolve(__dirname, '../../../build.js'), 'utf8').includes("'approved-wording-readings.json'"))
    // Exactly the two readings the coordinator decided for stage 3E, checked against his entries.
    assert.deepEqual(
        load.readings.map(reading => [reading.entry, reading.units, reading.states.map(state => [state.coverIndex, state.row])]),
        [
            ['A01-W1', [{ sentence: 0, part: 'WHOLE_SENTENCE' }], [[4, 'V3'], [5, 'V4'], [6, 'V5'], [7, 'V6'], [8, 'V3'], [9, 'V4'], [10, 'V5'], [11, 'V6']]],
            ['A01-W2', [{ sentence: 0, part: 'LEADING_CLAUSE' }], [[0, 'V28'], [1, 'V29'], [2, 'V30']]],
        ],
    )
    // His first sentence: the progression covers then the control covers; nothing of the bound, the origin or the exclusion.
    assert.deepEqual(load.readings[0].states.map(state => (state.element as any).equals), ['progression', 'progression', 'progression', 'progression', 'control', 'control', 'control', 'control'])
    assert.deepEqual(W1.covers.filter((_, n) => n < 4 || n > 11).map(cover => [cover.row, cover.element?.equals]), [['B8', 'BUILDING'], ['V3', 'origin'], ['V4', 'origin'], ['V5', 'origin'], ['V3', 'exclusion'], ['V4', 'exclusion'], ['V5', 'exclusion'], ['V6', 'exclusion']])
    // The regain clause leaves the contested-touch exclusion, whose words follow the ";".
    assert.equal(W2.covers[3].row, 'V31')
    // Every cover: its words found verbatim in that part of his sentence; the note, where given, verbatim in the entry's own note.
    for (const reading of load.readings) {
        const entry = entryOf(reading.entry)
        const part = sentencesOf(entry.sentence)[reading.units[0].sentence]
        assert.ok(entry.sentence.includes(reading.words.slice(0, -1)), reading.words)
        for (const state of reading.states) {
            assert.ok(reading.words.includes(state.statedBy), `${reading.entry} ${state.coverIndex}: ${state.statedBy}`)
            assert.ok(part.text.includes(state.statedBy))
            assert.ok(state.why.length > 0)
            if (state.note !== null) assert.ok(String((entry as any).note).includes(state.note), state.note)
        }
    }
    // The regain clause's three covers each cite the entry's note, which maps each of its fields to words; his first sentence's note maps none.
    assert.deepEqual(readingOf(RECORD, 'A01-W2').states.map((state: any) => state.note !== null), [true, true, true])
    assert.deepEqual(readingOf(RECORD, 'A01-W1').states.map((state: any) => state.note), [null, null, null, null, null, null, null, null])
    // The words of his excluded touch are not in the clause read.
    assert.ok(!readingOf(RECORD, 'A01-W2').words.includes('contested touch'))
    // The reading it gives: those covers for those parts, none for any other part, with its record and label.
    const reading = recordedReading()
    assert.deepEqual(reading(W1, [{ sentence: 0, part: 'WHOLE_SENTENCE' }]), [4, 5, 6, 7, 8, 9, 10, 11])
    assert.deepEqual(reading(W2, [{ sentence: 0, part: 'LEADING_CLAUSE' }]), [0, 1, 2])
    assert.equal(reading(W1, [{ sentence: 1, part: 'WHOLE_SENTENCE' }]), null)
    assert.equal(reading(W1, [{ sentence: 0, part: 'WHOLE_SENTENCE' }, { sentence: 1, part: 'WHOLE_SENTENCE' }]), null)
    assert.equal(reading(W2, [{ sentence: 0, part: 'WHOLE_SENTENCE' }]), null)
    assert.equal(reading(entryOf('A01-W3'), [{ sentence: 0, part: 'WHOLE_SENTENCE' }]), null)
    assert.deepEqual(reading.record, { source: READINGS_SOURCE, status: 'PROPOSED', label: READING_PROPOSED_LABEL, labelStatus: 'DRAFT' })
    assert.deepEqual(PROPOSED_READING_RECORD, reading.record)
    assert.equal(READING_PROPOSED_LABEL, 'reading PROPOSED, awaiting confirmation')
    // His approved table is unchanged: no reading is written into it.
    const approved = fs.readFileSync(APPROVED_WORDING_FILE, 'utf8')
    for (const word of ['statedBy', 'coverIndex', 'readings', 'PROPOSED']) assert.ok(!approved.includes(word), word)
    assert.deepEqual(approvedWording().map(entry => entry.id), ['A01-W1', 'A01-W2', 'A01-W3'])
})

test('2. the loader refuses what it cannot check against his entries', () => {
    const refused = (change: (file: any) => void, includes: string) => {
        const file = copy(RECORD)
        change(file)
        const why = readingsUnusableBecause(file)
        assert.ok(why && why.includes(includes), `${includes} :: ${why}`)
        const load = readingsLoadOf(file)
        assert.deepEqual([load.status, load.readings], ['UNUSABLE', []])
    }
    const w1 = (file: any) => readingOf(file, 'A01-W1')
    const w2 = (file: any) => readingOf(file, 'A01-W2')
    // An unknown entry; a part the entry does not have.
    refused(file => (w1(file).entry = 'TEST-ONLY'), 'which is not an approved entry')
    refused(file => (w1(file).parts = [{ sentence: 4, part: 'WHOLE_SENTENCE' }]), 'it names a sentence its source does not have')
    refused(file => (w1(file).parts = [{ sentence: 1, part: 'LEADING_CLAUSE' }]), 'has no leading clause ending at ";"')
    refused(file => (w1(file).parts = [{ sentence: 0, part: 'WHOLE_SENTENCE' }]), 'names no sentence (numbered from 1)')
    refused(file => (w1(file).parts = [1, 2, 3].map(sentence => ({ sentence, part: 'WHOLE_SENTENCE' }))), 'it is the whole source')
    refused(file => (w1(file).parts = [{ sentence: 2, part: 'WHOLE_SENTENCE' }, { sentence: 1, part: 'WHOLE_SENTENCE' }]), "its parts are not in the source's order")
    refused(file => (w1(file).parts = []), 'it names no part of its entry')
    // Its words are that part's, verbatim.
    refused(file => (w1(file).words = w1(file).words.replace('carrying', 'running')), 'are not those parts of A01-W1')
    refused(file => (w2(file).words = W2.sentence), 'are not those parts of A01-W2')
    // A cover not in the entry (its index, its row, its locator), or one twice.
    refused(file => (w1(file).states[0].coverIndex = 16), 'it states cover 16, which A01-W1 does not have')
    refused(file => (w1(file).states[0].coverIndex = -1), 'which A01-W1 does not have')
    refused(file => (w1(file).states[0].row = 'V4'), 'its cover 4 is named with another row or locator than A01-W1 gives it')
    refused(file => (w1(file).states[0].element.equals = 'origin'), 'named with another row or locator')
    refused(file => (w2(file).states[2].coverIndex = 3), 'named with another row or locator')
    refused(file => w2(file).states.push(copy(w2(file).states[0])), 'it states cover 0 twice')
    // Words of his not found verbatim in that part: words he did not write, or words of another sentence of the entry.
    refused(file => (w1(file).states[1].statedBy = 'under controlled'), 'are not found verbatim in those parts of A01-W1')
    refused(file => (w1(file).states[0].statedBy = "The progression must begin with the goalkeeper's build-out"), 'are not found verbatim')
    refused(file => (w2(file).states[2].statedBy = 'a contested touch, deflection or loose ball does not count'), 'are not found verbatim in those parts of A01-W2')
    refused(file => (w1(file).states[0].statedBy = ''), 'it gives no words of his for cover 4')
    refused(file => (w1(file).states[0].why = ' '), 'it gives no reason for cover 4')
    // A note not found verbatim in the entry's own note.
    refused(file => (w2(file).states[0].note = "'The pressing team' (V28, the team that presses)"), "is not found verbatim in A01-W2's own note")
    refused(file => (w1(file).states[0].note = 'TEST-ONLY'), "is not found verbatim in A01-W1's own note")
    // No approval of its own, anywhere; PROPOSED only.
    refused(file => (file.approvedBy = { who: 'TEST-ONLY', date: '2026-10-22', quote: 'TEST-ONLY' }), 'it carries approvedBy')
    refused(file => (w2(file).approvedBy = { who: 'TEST-ONLY' }), 'it carries approvedBy')
    refused(file => (w2(file).states[0].approvedBy = { who: 'TEST-ONLY' }), 'it carries approvedBy')
    refused(file => (file.status = 'APPROVED'), 'the record is PROPOSED until he confirms it')
    refused(file => delete file.status, 'its status is undefined')
    // Its shape.
    refused(file => (file.extra = true), 'the record carries "extra"')
    refused(file => (w1(file).keeps = [4]), 'it carries "keeps", which no reading holds')
    refused(file => (w1(file).states[0].index = 4), 'a cover it states carries "index"')
    refused(file => file.readings.push(copy(w1(file))), 'is read twice')
    refused(file => (w1(file).states = []), 'it states nothing')
    refused(file => delete file.readings, 'it has no list of readings')
    // Against another approved table (a TEST-ONLY copy whose entry has other words), the same record is refused.
    const reworded = approvedWording().map(entry => (entry.id === 'A01-W1' ? { ...entry, sentence: entry.sentence.replace('carrying', 'running') } : entry))
    assert.ok(readingsUnusableBecause(copy(RECORD), reworded)!.includes('are not those parts of A01-W1'))
})

test('3. an unusable record gives no reading, and the overview says his sentences whole; a reading applies only to the entry it was checked on', () => {
    const unusable = readingsLoadOf({ ...copy(RECORD), status: 'APPROVED' })
    assert.equal(unusable.status, 'UNUSABLE')
    assert.equal(coverReadingOf(unusable), NO_RECORDED_READING)
    const ROLE = specializedRoleNames()[0]
    const none = Object.fromEntries(specializedRoleNames().map(role => [role, 0]))
    const fixture: any = buildActivityWithFixture({ kind: 'learning-goal', goalId: 'A01', situationId: null, session: { players: 12, lengthM: 40, widthM: 30, durationMin: 20, roles: { ...none, [ROLE]: 1 } } }).fixture
    const blocks = (fixture.roleBlocks.blocks as any[]).map(block => ({ blockId: block.blockId, fixture: block.fixture }))
    const withoutRecord = coachOverviewDraftOf('A01', blocks, game => extractsFor(game, { reading: coverReadingOf(unusable) }), { readings: unusable })
    const [building, pressing] = withoutRecord.scoring.blocks[0].groups
    assert.equal(building.sentences[0].text, W1.sentence)
    assert.equal(pressing.sentences[1].text, W2.sentence)
    assert.ok(withoutRecord.scoring.blocks[0].groups.every(group => group.sentences.every(sentence => sentence.reading === null)))
    assert.deepEqual(withoutRecord.scoring.readings, { source: READINGS_SOURCE, status: 'UNUSABLE', label: null, labelStatus: 'DRAFT', why: unusable.why })
    // With the record, the same games: his first sentence and the regain clause as extracts, each naming the record.
    const withRecord = coachOverviewDraftOf('A01', blocks)
    const [readBuilding, readPressing] = withRecord.scoring.blocks[0].groups
    assert.deepEqual([readBuilding.sentences[0].extractId, readPressing.sentences[1].extractId], ['A01-W1:s1', 'A01-W2:c1'])
    assert.deepEqual([readBuilding.sentences[0].reading, readPressing.sentences[1].reading], [PROPOSED_READING_RECORD, PROPOSED_READING_RECORD])
    // A copy of his entry with other words or covers (TEST-ONLY) is not the entry the reading was checked against: it gives nothing.
    const reading = recordedReading()
    const units = [{ sentence: 0, part: 'WHOLE_SENTENCE' as const }]
    assert.equal(reading({ ...W1, sentence: W1.sentence.replace('carrying', 'running') }, units), null)
    assert.equal(reading({ ...W1, covers: W1.covers.slice(1) }, units), null)
    assert.deepEqual(reading(copy(W1), units), [4, 5, 6, 7, 8, 9, 10, 11])
})

test('4. the module names no entry, row, condition type or value of the first activity: the record is data', () => {
    const source = fs.readFileSync(path.join(__dirname, 'approved-wording-readings.ts'), 'utf8')
    const code = source
        .split('\n')
        .filter(line => !/^\s*(\*|\/\*\*|\/\/)/.test(line))
        .join('\n')
    for (const literal of ['A01', 'A0', 'RPC-0', 'GF2', 'BUILDING', 'PRESSING', 'progression', 'origin', 'control', 'exclusion', 'V28', 'V30', 'V31', 'B8', "'V3'", 'goalkeeper']) assert.ok(!code.includes(literal), literal)
    for (const value of ['5', '20', '30', '40', '12']) assert.ok(!new RegExp(`(^|[^\\w.])${value}([^\\w.]|$)`).test(code), `the number ${value} is typed in the code`)
})

console.log(`approved-wording-readings.unit.ts — ${passed} passed`)
