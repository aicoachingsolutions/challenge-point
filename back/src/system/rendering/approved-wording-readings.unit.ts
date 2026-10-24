/**
 * What a part of his approved wording states: the PROPOSED record, loaded and checked — stage 3E, 22 October 2026.
 *
 * His reply filed 22 October 2026, item 4: *"I approve generating abbreviated versions of approved statements for the Coach Overview,
 * provided their meaning remains accurate."* and *"Shortening must not introduce new meanings, omit a condition that changes the essential
 * understanding, or silently turn a qualified rule into an unrestricted one."*
 *
 * Pinned here:
 *
 *   1. the production record: PROPOSED, no approvedBy anywhere, copied beside the bundle; the two readings the coordinator decided
 *      (A01-W1 sentence 1: the progression and control covers 4-11; A01-W2's leading clause: V28, V29, V30, leaving V31), unchanged, and
 *      since stage 3F the readings of every other part the overview may use (below); every cover
 *      justified by words of his found verbatim in that part, and by the entry's own note where it maps the field to words; the reading it
 *      gives, with its record; his approved table unchanged;
 *   2. the loader refuses: an unknown entry; a part the entry does not have; words that are not the part's; a cover not in the entry (index,
 *      row or locator); a cover twice; words of his not found verbatim in that part; a note not found verbatim in the entry's note; approvedBy
 *      anywhere; a status other than PROPOSED; an unknown key; a part read twice; a reading stating nothing or giving no reason;
 *   3. an unusable record gives no reading, and the overview then says his sentences whole; a reading applies only to the entry it was
 *      checked against;
 *   4. the module's code names no entry, row, condition type or value of the first activity.
 *
 *   Stage 3F (22 October 2026, his reply filed 23 October 2026, item 4): the record reads every part the overview may use — A01-W1's three
 *   sentences, A01-W2's leading clause and A01-W2 said whole, A01-W3 said whole — and his wording said whole is read like any part; several
 *   parts with no reading of their own state the union of theirs; `doesNotState` records, with a reason, what a reading's parts do not
 *   state (A01-W3: not the origin, his item-4 example) and is checked; the 3E review's should-fix 1: a note fragment must name its cover's
 *   row, and where the entry's note maps a row to quoted words, a reading of that row must cite the mapping and the words must lie in the
 *   parts read (2b); with no usable record his wording can be shown to state nothing, so the overview is withheld (3, re-pointed).
 *
 *   C1 (his reply filed 24 October 2026, item 1: "I agree with your interpretation of the approved scoring statements."): approval is per
 *   reading. Exactly the four readings the overview uses that our 23 October email described are APPROVED (A01-W1 sentences 1 and 2, A01-W2's
 *   leading clause, A01-W3), each with his words verbatim; A01-W1 sentence 3 and A01-W2 said whole stay PROPOSED; the record is
 *   PARTLY_APPROVED (1, re-pointed). The loader refuses an APPROVED reading without his approval (or with one that does not say who, a
 *   calendar date, the reply it is filed in by that date, and his words), a PROPOSED reading with one, approvedBy anywhere but on a reading,
 *   and a record status its readings do not make it (2c). Parts read by readings that are all APPROVED name the approved record; any
 *   PROPOSED reading among them makes it PROPOSED (1c).
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { APPROVED_WORDING_FILE, ApprovedWording, approvedWording } from './approved-wording'
import {
    APPROVED_READING_RECORD,
    coverReadingOf,
    noteMappingsOf,
    PROPOSED_READING_RECORD,
    READING_APPROVED_LABEL,
    READING_PROPOSED_LABEL,
    readingsAccountOf,
    readingsAccountOfReading,
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

/** His words, verbatim, filed 24 October 2026, item 1: his agreement, and each distinction it names (C1). */
const HIS_AGREEMENT = 'I agree with your interpretation of the approved scoring statements.'
const HIS_DISTINCTIONS = {
    W1_S1: 'Controlled progression beyond the marked line.',
    W1_S2: 'The requirement that the build-out begin with the goalkeeper.',
    W3: 'The loss of scoring eligibility following a turnover or ball out.',
    W2_C1: "The pressing team's controlled-entry and controlled-regain objectives.",
}
const approvalOf = (distinction: string) => ({
    who: 'Christian',
    date: '2026-10-24',
    filed: 'his reply filed 24 October 2026, item 1, to our email of 23 October 2026, whose item a described this reading',
    quote: `${HIS_AGREEMENT} [...] The overview appropriately distinguishes: [...] ${distinction}`,
})

test('1. the production record: PARTLY_APPROVED (C1), the decided readings, every cover justified by his words; the reading it gives', () => {
    // Re-pointed 24 October 2026 (C1, his reply filed 24 October 2026, item 1). Was: PROPOSED, with no approvedBy anywhere.
    assert.equal(RECORD.status, 'PARTLY_APPROVED')
    assert.equal(readingsUnusableBecause(RECORD), null)
    const load = recordedReadings()
    assert.deepEqual([load.status, load.why], ['PARTLY_APPROVED', null])
    // Exactly the four readings the overview uses that our 23 October email described are APPROVED, each with his words verbatim; the
    // other two stay PROPOSED with no approval.
    assert.deepEqual(
        load.readings.map(reading => [reading.entry, reading.units.map(unit => [unit.sentence, unit.part]), reading.status, reading.approvedBy]),
        [
            ['A01-W1', [[0, 'WHOLE_SENTENCE']], 'APPROVED', approvalOf(HIS_DISTINCTIONS.W1_S1)],
            ['A01-W1', [[1, 'WHOLE_SENTENCE']], 'APPROVED', approvalOf(HIS_DISTINCTIONS.W1_S2)],
            ['A01-W1', [[2, 'WHOLE_SENTENCE']], 'PROPOSED', null],
            ['A01-W2', [[0, 'LEADING_CLAUSE']], 'APPROVED', approvalOf(HIS_DISTINCTIONS.W2_C1)],
            ['A01-W2', [[0, 'WHOLE_SENTENCE']], 'PROPOSED', null],
            ['A01-W3', [[0, 'WHOLE_SENTENCE']], 'APPROVED', approvalOf(HIS_DISTINCTIONS.W3)],
        ],
    )
    // His approval is a reading's own: nowhere else in the file.
    const approvals = (value: unknown): number => (Array.isArray(value) ? value.reduce((n, item) => n + approvals(item), 0) : value && typeof value === 'object' ? Object.entries(value).reduce((n, [key, item]) => n + (key === 'approvedBy' ? 1 : 0) + approvals(item), 0) : 0)
    assert.equal(approvals(RECORD.readings), 4)
    assert.equal(approvals({ ...RECORD, readings: [], readingShape: {} }), 0, 'none outside its readings (the shape only describes the field)')
    assert.ok(RECORD.readings.every((reading: any) => ('approvedBy' in reading) === (reading.status === 'APPROVED')))
    // build.js copies it into dist/knowledge, where the bundled server reads it.
    assert.ok(fs.readFileSync(path.resolve(__dirname, '../../../build.js'), 'utf8').includes("'approved-wording-readings.json'"))
    // The two readings the coordinator decided for stage 3E, unchanged, and since stage 3F every other part the overview may use, each
    // checked against his entries. (Re-pointed 22 October 2026, stage 3F. Was: exactly the first and fourth below.)
    const whole = (sentence: number) => [{ sentence, part: 'WHOLE_SENTENCE' }]
    assert.deepEqual(
        load.readings.map(reading => [reading.entry, reading.units, reading.states.map(state => [state.coverIndex, state.row]), reading.doesNotState.map(left => [left.coverIndex, left.row])]),
        [
            ['A01-W1', whole(0), [[4, 'V3'], [5, 'V4'], [6, 'V5'], [7, 'V6'], [8, 'V3'], [9, 'V4'], [10, 'V5'], [11, 'V6']], []],
            ['A01-W1', whole(1), [[1, 'V3'], [2, 'V4'], [3, 'V5'], [4, 'V3']], [[0, 'B8']]],
            ['A01-W1', whole(2), [[12, 'V3'], [13, 'V4'], [14, 'V5'], [15, 'V6']], []],
            ['A01-W2', [{ sentence: 0, part: 'LEADING_CLAUSE' }], [[0, 'V28'], [1, 'V29'], [2, 'V30']], []],
            ['A01-W2', whole(0), [[0, 'V28'], [1, 'V29'], [2, 'V30'], [3, 'V31']], []],
            ['A01-W3', whole(0), [[0, 'B8']], [[1, 'V3'], [2, 'V4'], [3, 'V5']]],
        ],
    )
    // His first sentence: the progression covers then the control covers; nothing of the bound, the origin or the exclusion.
    assert.deepEqual(load.readings[0].states.map(state => (state.element as any).equals), ['progression', 'progression', 'progression', 'progression', 'control', 'control', 'control', 'control'])
    // Stage 3F: his second sentence states the origin (and the progression's scope), not the eligibility; his eligibility sentence states
    // the eligibility and NOT the origin (his item-4 example), each with the reason recorded.
    assert.deepEqual(load.readings[1].states.map(state => (state.element as any).equals), ['origin', 'origin', 'origin', 'progression'])
    assert.ok(load.readings[1].doesNotState[0].why.includes('A01-W3') && load.readings[1].doesNotState[0].why.includes('FOR HIS CONFIRMATION'))
    assert.ok(load.readings[5].doesNotState.every(left => (left.element as any).equals === 'origin'))
    assert.ok(load.readings[5].doesNotState[0].why.includes("does not, by itself, fully communicate that the original scoring opportunity must begin from the goalkeeper"))
    assert.deepEqual(W1.covers.filter((_, n) => n < 4 || n > 11).map(cover => [cover.row, cover.element?.equals]), [['B8', 'BUILDING'], ['V3', 'origin'], ['V4', 'origin'], ['V5', 'origin'], ['V3', 'exclusion'], ['V4', 'exclusion'], ['V5', 'exclusion'], ['V6', 'exclusion']])
    // The regain clause leaves the contested-touch exclusion, whose words follow the ";".
    assert.equal(W2.covers[3].row, 'V31')
    // Every cover: its words found verbatim in that part of his sentence; the note, where given, verbatim in the entry's own note.
    for (const reading of load.readings) {
        const entry = entryOf(reading.entry)
        assert.ok(entry.sentence.includes(reading.words.slice(0, -1)), reading.words)
        for (const state of reading.states) {
            assert.ok(reading.words.includes(state.statedBy), `${reading.entry} ${state.coverIndex}: ${state.statedBy}`)
            assert.ok(reading.units.some(unit => sentencesOf(entry.sentence)[unit.sentence].text.includes(state.statedBy)))
            assert.ok(state.why.length > 0)
            if (state.note !== null) assert.ok(String((entry as any).note).includes(state.note), state.note)
            // Stage 3F: a note fragment names its cover's row.
            if (state.note !== null) assert.ok(state.note.split(/[^A-Za-z0-9]+/).includes(state.row), `${state.note} names ${state.row}`)
        }
    }
    // The regain clause's three covers each cite the entry's note, which maps each of its fields to words; his first sentence's note maps none.
    assert.deepEqual(readingOf(RECORD, 'A01-W2').states.map((state: any) => state.note !== null), [true, true, true])
    assert.deepEqual(readingOf(RECORD, 'A01-W1').states.map((state: any) => state.note), [null, null, null, null, null, null, null, null])
    // The words of his excluded touch are not in the clause read.
    assert.ok(!readingOf(RECORD, 'A01-W2').words.includes('contested touch'))
    // The reading it gives: those covers for those parts, with its record and label. Re-pointed 22 October 2026 (stage 3F): his second
    // sentence, A01-W2 and A01-W3 said whole are read now, and two sentences with no reading of their own state the union of theirs. Was:
    // null for each of these.
    const reading = recordedReading()
    const W3 = entryOf('A01-W3')
    assert.deepEqual(reading(W1, [{ sentence: 0, part: 'WHOLE_SENTENCE' }]), [4, 5, 6, 7, 8, 9, 10, 11])
    assert.deepEqual(reading(W2, [{ sentence: 0, part: 'LEADING_CLAUSE' }]), [0, 1, 2])
    assert.deepEqual(reading(W1, [{ sentence: 1, part: 'WHOLE_SENTENCE' }]), [1, 2, 3, 4])
    assert.deepEqual(reading(W1, [{ sentence: 0, part: 'WHOLE_SENTENCE' }, { sentence: 1, part: 'WHOLE_SENTENCE' }]), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11])
    assert.deepEqual(reading(W1, [0, 1, 2].map(sentence => ({ sentence, part: 'WHOLE_SENTENCE' as const }))), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15])
    assert.deepEqual(reading(W2, [{ sentence: 0, part: 'WHOLE_SENTENCE' }]), [0, 1, 2, 3])
    assert.deepEqual(reading(W3, [{ sentence: 0, part: 'WHOLE_SENTENCE' }]), [0])
    // Its explanation: the record's words and reasons; what the parts do not state, unless another part states it.
    const w3 = reading.explain!(W3, [{ sentence: 0, part: 'WHOLE_SENTENCE' }])!
    assert.deepEqual([w3.states.map(state => state.index), w3.doesNotState.map(left => left.index)], [[0], [1, 2, 3]])
    assert.equal(w3.states[0].statedBy, 'it cannot score again until the next goalkeeper restart')
    const firstTwo = reading.explain!(W1, [0, 1].map(sentence => ({ sentence, part: 'WHOLE_SENTENCE' as const })))!
    assert.deepEqual(firstTwo.doesNotState.map(left => left.index), [0], 'neither sentence states the eligibility')
    assert.equal(reading.explain!(W1, [{ sentence: 0, part: 'LEADING_CLAUSE' }]), null)
    // C1 (1c): the record a part names is the standing of exactly the readings it is read by. Re-pointed 24 October 2026: was one PROPOSED
    // record for every part (`reading.record`), which the recorded reading no longer names.
    assert.equal(reading.record, undefined)
    const wholeOf = (...sentences: number[]) => sentences.map(sentence => ({ sentence, part: 'WHOLE_SENTENCE' as const }))
    assert.deepEqual(PROPOSED_READING_RECORD, { source: READINGS_SOURCE, status: 'PROPOSED', label: READING_PROPOSED_LABEL, labelStatus: 'DRAFT' })
    assert.deepEqual(APPROVED_READING_RECORD, { source: READINGS_SOURCE, status: 'APPROVED', label: READING_APPROVED_LABEL, labelStatus: 'DRAFT' })
    assert.equal(READING_PROPOSED_LABEL, 'reading PROPOSED, awaiting confirmation')
    assert.equal(READING_APPROVED_LABEL, 'reading approved')
    assert.deepEqual(reading.recordFor!(W1, wholeOf(0)), APPROVED_READING_RECORD, 'his first building sentence')
    assert.deepEqual(reading.recordFor!(W1, wholeOf(1)), APPROVED_READING_RECORD, 'his second building sentence')
    assert.deepEqual(reading.recordFor!(W1, wholeOf(2)), PROPOSED_READING_RECORD, 'his third building sentence: not described, so PROPOSED')
    assert.deepEqual(reading.recordFor!(W1, wholeOf(0, 1)), APPROVED_READING_RECORD, 'two approved readings together')
    assert.deepEqual(reading.recordFor!(W1, wholeOf(0, 1, 2)), PROPOSED_READING_RECORD, 'his building rule said whole: one of its readings is PROPOSED')
    assert.deepEqual(reading.recordFor!(W2, [{ sentence: 0, part: 'LEADING_CLAUSE' }]), APPROVED_READING_RECORD, 'the regain clause')
    assert.deepEqual(reading.recordFor!(W2, wholeOf(0)), PROPOSED_READING_RECORD, 'his regain sentence said whole')
    assert.deepEqual(reading.recordFor!(W3, wholeOf(0)), APPROVED_READING_RECORD, 'his eligibility sentence')
    assert.equal(reading.recordFor!(W1, [{ sentence: 1, part: 'LEADING_CLAUSE' }]), null, 'no reading, no record')
    // The account an administrator is given names the approved readings and those still PROPOSED.
    const account = readingsAccountOf(load)
    assert.deepEqual([account.status, account.approved, account.proposed], [
        'PARTLY_APPROVED',
        ['A01-W1 sentence 1', 'A01-W1 sentence 2', 'A01-W2 sentence 1, leading clause', 'A01-W3 sentence 1'],
        ['A01-W1 sentence 3', 'A01-W2 sentence 1'],
    ])
    assert.equal(account.label, 'readings partly approved. Approved: A01-W1 sentence 1; A01-W1 sentence 2; A01-W2 sentence 1, leading clause; A01-W3 sentence 1. Still PROPOSED, awaiting confirmation: A01-W1 sentence 3; A01-W2 sentence 1')
    assert.deepEqual(readingsAccountOfReading(reading), account, 'the serving reading is described by the record it was built from')
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
    // Re-pointed 22 October 2026 (stage 3F): his wording said whole is read too, so the whole entry is a part a reading may be of; read
    // with the first sentence's words it is refused for its words. Was: refused as "the whole source".
    refused(file => (w1(file).parts = [1, 2, 3].map(sentence => ({ sentence, part: 'WHOLE_SENTENCE' }))), 'are not those parts of A01-W1')
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
    // Re-pointed 24 October 2026 (C1): approval is a reading's own, never the record's, a part's or a cover's; the record's status is what
    // its readings make it. Was: approvedBy anywhere refused, and the status PROPOSED only. The per-reading rules are pinned in 2c.
    refused(file => (file.approvedBy = { who: 'TEST-ONLY', date: '2026-10-22', quote: 'TEST-ONLY' }), 'it carries approvedBy outside its readings')
    refused(file => (w2(file).states[0].approvedBy = { who: 'TEST-ONLY' }), 'it carries approvedBy inside it')
    refused(file => (file.status = 'APPROVED'), 'and its readings make it PARTLY_APPROVED')
    refused(file => (file.status = 'PROPOSED'), 'and its readings make it PARTLY_APPROVED')
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
    // Stage 3F: what a reading says its parts do not state is a cover of the entry, never also stated, never twice, always with a reason.
    const w3 = (file: any) => readingOf(file, 'A01-W3')
    refused(file => (w3(file).doesNotState[0] = { coverIndex: 0, row: 'B8', element: copy(w3(file).states[0].element), why: 'TEST-ONLY' }), 'it both states and does not state cover 0')
    refused(file => w3(file).doesNotState.push(copy(w3(file).doesNotState[0])), 'it says twice that it does not state cover 1')
    refused(file => (w3(file).doesNotState[0].why = ''), 'it gives no reason why it does not state cover 1')
    refused(file => (w3(file).doesNotState[0].row = 'V4'), 'its cover 1 is named with another row or locator')
    refused(file => (w3(file).doesNotState[0].coverIndex = 9), 'it does not state cover 9, which A01-W3 does not have')
    refused(file => (w3(file).doesNotState[0].statedBy = 'TEST-ONLY'), 'a cover it does not state carries "statedBy"')
    refused(file => (w3(file).doesNotState = []), 'its doesNotState is not a list of covers')
})

test('2b. stage 3F, the 3E review\'s should-fix 1: a reading claiming words his note maps elsewhere, or a note fragment for another row, is refused', () => {
    const refused = (change: (file: any) => void, includes: string) => {
        const file = copy(RECORD)
        change(file)
        const why = readingsUnusableBecause(file)
        assert.ok(why && why.includes(includes), `${includes} :: ${why}`)
    }
    const w2 = (file: any) => readingOf(file, 'A01-W2')
    const v31 = (file: any) => copy(file.readings.find((reading: any) => reading.entry === 'A01-W2' && reading.parts[0].part === 'WHOLE_SENTENCE').states[3])
    // The review's probe: the regain clause also claiming the contested-touch exclusion (V31) by words that are in the clause but do not say
    // it. His entry's note maps V31 to the words after the ";", so the claim must cite that mapping, and those words are not in the clause.
    refused(file => w2(file).states.push({ ...v31(file), statedBy: 'provided it genuinely establishes possession', note: null }), "A01-W2's note maps V31 to \"a contested touch, deflection or loose ball does not count\", and its reading of cover 3 does not cite that mapping")
    refused(file => w2(file).states.push({ ...v31(file), statedBy: 'winning the ball' }), 'which is not in the parts read, so they cannot state cover 3')
    // A note fragment cited for another row: the V28 cover citing the V30 fragment.
    refused(file => (w2(file).states[0].note = w2(file).states[2].note), "does not name the row V28 it is cited for")
    // A row his note maps to words, claimed with no note at all.
    refused(file => (w2(file).states[1].note = null), "A01-W2's note maps V29 to \"winning the ball\", and its reading of cover 1 does not cite that mapping")
    // The mapping is read from the note: each quoted span followed by its row, for a row the entry covers.
    assert.deepEqual(
        noteMappingsOf(String((W2 as any).note), new Set(W2.covers.map(cover => cover.row))).map(mapping => [mapping.row, mapping.words]),
        [
            ['V28', 'The pressing team'],
            ['V29', 'winning the ball'],
            ['V30', 'provided it genuinely establishes possession'],
            ['V31', 'a contested touch, deflection or loose ball does not count'],
        ],
    )
    // His building rule's note maps no row to quoted words, so a claim on it rests on the record's own words (unverifiable here; the record
    // stays PROPOSED for his confirmation). Pinned as the known limit: his first sentence claiming the eligibility is not refused by this rule.
    assert.deepEqual(noteMappingsOf(String((W1 as any).note), new Set(W1.covers.map(cover => cover.row))), [])
    const overreach = copy(RECORD)
    readingOf(overreach, 'A01-W1').states.push({ coverIndex: 0, row: 'B8', element: W1.covers[0].element, statedBy: 'Building team: Score', why: 'TEST-ONLY overreach', note: null })
    assert.equal(readingsUnusableBecause(overreach), null)
    // The production record passes every rule.
    assert.equal(readingsUnusableBecause(copy(RECORD)), null)
})

test('2c. C1: an APPROVED reading carries his approval, in his words; a PROPOSED one carries none; the record says what its readings are', () => {
    const refused = (change: (file: any) => void, includes: string) => {
        const file = copy(RECORD)
        change(file)
        const why = readingsUnusableBecause(file)
        assert.ok(why && why.includes(includes), `${includes} :: ${why}`)
        assert.deepEqual([readingsLoadOf(file).status, readingsLoadOf(file).readings], ['UNUSABLE', []])
    }
    const approved = (file: any) => file.readings.find((reading: any) => reading.entry === 'A01-W3')
    const proposed = (file: any) => file.readings.find((reading: any) => reading.entry === 'A01-W2' && reading.parts[0].part === 'WHOLE_SENTENCE')
    // A reading's status is PROPOSED or APPROVED, and says so.
    refused(file => delete approved(file).status, 'its status is undefined: a reading is PROPOSED or APPROVED')
    refused(file => (approved(file).status = 'PARTLY_APPROVED'), 'a reading is PROPOSED or APPROVED')
    // APPROVED only with his approval: who, a calendar date, the reply it is filed in by that date, and his words.
    refused(file => delete approved(file).approvedBy, 'it is APPROVED and carries no approvedBy')
    refused(file => (approved(file).approvedBy = 'TEST-ONLY'), 'its approval is not an object')
    refused(file => (approved(file).approvedBy.who = ' '), 'its approval does not say who approved it')
    refused(file => (approved(file).approvedBy.date = '24 October 2026'), 'is not a calendar date (YYYY-MM-DD)')
    refused(file => (approved(file).approvedBy.date = '2026-02-30'), 'is not a calendar date (YYYY-MM-DD)')
    refused(file => (approved(file).approvedBy.date = '2026-10-23'), 'its approval does not name the reply it is filed in, by the date 23 October 2026')
    refused(file => (approved(file).approvedBy.filed = 'his reply of 24 October 2026'), 'its approval does not name the reply it is filed in')
    refused(file => (approved(file).approvedBy.quote = ''), 'its approval does not give his words')
    refused(file => (approved(file).approvedBy.ccs = 'TEST-ONLY'), 'its approval carries "ccs"')
    refused(file => (approved(file).approvedBy.note = { approvedBy: 'TEST-ONLY' }), 'it carries approvedBy inside it')
    // A PROPOSED reading carries no approval; a reading made APPROVED without one, or PROPOSED with one, is refused (no silent change).
    refused(file => (proposed(file).approvedBy = approvalOf(HIS_DISTINCTIONS.W2_C1)), 'it is PROPOSED and carries approvedBy')
    refused(file => (proposed(file).status = 'APPROVED'), 'it is APPROVED and carries no approvedBy')
    // The record's status is what its readings make it.
    const allProposed = copy(RECORD)
    for (const reading of allProposed.readings) {
        reading.status = 'PROPOSED'
        delete reading.approvedBy
    }
    assert.ok(readingsUnusableBecause(allProposed)!.includes('and its readings make it PROPOSED'))
    allProposed.status = 'PROPOSED'
    assert.equal(readingsUnusableBecause(allProposed), null)
    const proposedLoad = readingsLoadOf(allProposed)
    assert.equal(proposedLoad.status, 'PROPOSED')
    assert.deepEqual(readingsAccountOf(proposedLoad).label, READING_PROPOSED_LABEL)
    // With every reading PROPOSED, every part names the PROPOSED record, exactly as before C1.
    assert.deepEqual(coverReadingOf(proposedLoad).recordFor!(W1, [{ sentence: 0, part: 'WHOLE_SENTENCE' }]), PROPOSED_READING_RECORD)
    const allApproved = copy(RECORD)
    for (const reading of allApproved.readings) if (reading.status === 'PROPOSED') Object.assign(reading, { status: 'APPROVED', approvedBy: { ...approvalOf('TEST-ONLY'), who: 'TEST-ONLY' } })
    assert.ok(readingsUnusableBecause(allApproved)!.includes('and its readings make it APPROVED'))
    allApproved.status = 'APPROVED'
    assert.equal(readingsLoadOf(allApproved).status, 'APPROVED')
    assert.equal(readingsAccountOf(readingsLoadOf(allApproved)).label, READING_APPROVED_LABEL)
})

test('3. an unusable record gives no reading, and the overview is withheld (since stage 3F); a reading applies only to the entry it was checked on', () => {
    const unusable = readingsLoadOf({ ...copy(RECORD), status: 'APPROVED' })
    assert.equal(unusable.status, 'UNUSABLE')
    assert.equal(coverReadingOf(unusable), NO_RECORDED_READING)
    const ROLE = specializedRoleNames()[0]
    const none = Object.fromEntries(specializedRoleNames().map(role => [role, 0]))
    // Re-pointed 24 October 2026 (K3, the d27 design's stage K3): the session states that it has no goal, so the zone version (A01-R1) is built
    // exactly as before; since K3 a session that has not said what goals it has is asked first (his reply filed 26 October 2026, item 11).
    const fixture: any = buildActivityWithFixture({ kind: 'learning-goal', goalId: 'A01', situationId: null, session: { players: 12, lengthM: 40, widthM: 30, durationMin: 20, roles: { ...none, [ROLE]: 1 }, objects: { goal: { count: 0 } } } }).fixture
    const blocks = (fixture.roleBlocks.blocks as any[]).map(block => ({ blockId: block.blockId, fixture: block.fixture }))
    const withoutRecord = coachOverviewDraftOf('A01', blocks, game => extractsFor(game, { reading: coverReadingOf(unusable) }), { readings: unusable })
    const [building, pressing] = withoutRecord.scoring.blocks[0].groups
    // Re-pointed 22 October 2026 (stage 3F, his reply filed 23 October 2026, item 4): with no usable record, his wording said whole can be
    // shown to state nothing (it is never counted for every field it cites), so neither team's group can be composed and the overview is
    // withheld; each why names his entries that cite the field. Was: his sentences said whole, counted for everything they cite.
    assert.deepEqual([building.withheld, pressing.withheld], [true, true])
    assert.ok(building.why.some(why => why.includes('A01-W1 and A01-W3 cite it, and no recorded reading says those words state it')), JSON.stringify(building.why))
    assert.ok(pressing.why.some(why => why.includes('A01-W2 cites it, and no recorded reading says those words state it')), JSON.stringify(pressing.why))
    assert.ok(withoutRecord.wholes.every(block => block.wholes.every(whole => whole.reading === 'NONE_RECORDED')))
    assert.deepEqual(withoutRecord.scoring.readings, { source: READINGS_SOURCE, status: 'UNUSABLE', label: null, labelStatus: 'DRAFT', why: unusable.why, approved: [], proposed: [] })
    // With the record, the same games: his first sentence and the regain clause as extracts, each naming the record. Re-pointed 24 October
    // 2026 (C1): both readings are approved, so both name the approved record. Was: the PROPOSED record.
    const withRecord = coachOverviewDraftOf('A01', blocks)
    const [readBuilding, readPressing] = withRecord.scoring.blocks[0].groups
    assert.deepEqual([readBuilding.sentences[0].extractId, readPressing.sentences[1].extractId], ['A01-W1:s1', 'A01-W2:c1'])
    assert.deepEqual([readBuilding.sentences[0].reading, readPressing.sentences[1].reading], [APPROVED_READING_RECORD, APPROVED_READING_RECORD])
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
