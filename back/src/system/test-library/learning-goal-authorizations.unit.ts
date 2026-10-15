/**
 * Unit tests — the Learning Goal authorization record and its integrity gate (15 October 2026, stage G1).
 *
 * Christian, 15 October 2026, item 1: *"approving Gain Access does not automatically authorize the candidate
 * constraints currently derived from vocabulary coverage … Please identify the smallest set of authorized
 * manipulations needed to create a representative build-out problem, and flag any missing knowledge rather than
 * filling gaps through inference."* The record writes that down for Play Out from the Back (A01): his words, the
 * constraints it authorizes (none, with the finding why), what it excludes (item 7), and each manipulation his
 * context names with its source and status. These pin the record's content against his words, and prove the gate
 * refuses each kind of damage it exists to refuse — a gate is not proved by passing a healthy file.
 *
 * Run: part of `npm test`.
 */
import assert from 'node:assert/strict'

import { learningGoalSelectionHolds } from './learning-design-holds'
import {
    learningGoalAuthorization,
    learningGoalAuthorizations,
    LearningGoalAuthorization,
    libraryConstraintPrinciple,
    MANIPULATION_STATUSES,
    validateLearningGoalAuthorizations,
    validateLibraryConstraintPrinciple,
} from './learning-goal-authorizations'
import { testLibraryRegistry } from './library/registry'

const WIDE_ZONE = 'tl-v0-constraint-wide-zone-advantage'
const PCG = 'tl-v0-constraint-pass-combination-gate'

let passed = 0
function test(name: string, run: () => void): void {
    try {
        run()
        passed++
        console.log(`  ok  ${name}`)
    } catch (error) {
        console.log(`  FAIL ${name}: ${(error as Error).message}`)
        process.exitCode = 1
    }
}

const a01 = (): LearningGoalAuthorization => learningGoalAuthorization('A01')!
const damaged = (mutate: (record: LearningGoalAuthorization) => void): string[] => {
    const copy = learningGoalAuthorizations()
    mutate(copy.find(entry => entry.learningGoalId === 'A01')!)
    return validateLearningGoalAuthorizations(copy)
}

test('one record, for A01, and the production records pass the gate', () => {
    assert.deepEqual(learningGoalAuthorizations().map(entry => entry.learningGoalId), ['A01'], 'only the goal he ruled on has a record')
    assert.deepEqual(validateLearningGoalAuthorizations(learningGoalAuthorizations()), [])
    assert.equal(learningGoalAuthorization('D02'), null, 'a goal with no record has none — its candidates stay the vocabulary pool')
})

test('the record carries his item 1 verbatim, the context and the Game Problem he approved', () => {
    const record = a01()
    assert.equal(record.contextId, 'RPC-001')
    assert.equal(record.gameProblemId, 'GP-005')
    assert.equal(record.ruledOn, '2026-10-15')
    assert.equal(record.by, 'Christian')
    assert.equal(record.ruling.length, 7, 'the seven paragraphs of item 1')
    assert.equal(record.ruling[0], 'I approve Gain Access as the primary Game Problem for Play Out from the Back, based on the approved Goalkeeper Build-Out context and its scoring condition.')
    assert.equal(record.ruling[3], 'One important distinction: approving Gain Access does not automatically authorize the candidate constraints currently derived from vocabulary coverage.')
    assert.equal(record.ruling[6], 'Please identify the smallest set of authorized manipulations needed to create a representative build-out problem, and flag any missing knowledge rather than filling gaps through inference.')
})

/**
 * **Re-pointed 15 October 2026.** Until his reply of that day the record left "may this goal carry no library
 * constraint?" to him as decision D1, in a per-record `zeroConstraintRuling` (null). He answered it with a GENERAL
 * PRINCIPLE (16 October reply, item 1) and with Option A for this activity, so the record now says what its evaluation
 * found (none justified) and records Option A as his provisional choice; the per-record flag is gone.
 */
test('it EVALUATED its constraints and found none justified, says why, and records Option A as his provisional choice', () => {
    const record = a01()
    assert.deepEqual(record.authorizedConstraints, [], 'evaluated: no library constraint has a documented relationship (finding of 15 October)')
    assert.ok(record.authorizedConstraintsFinding.startsWith('No library constraint has a documented relationship'), record.authorizedConstraintsFinding)
    assert.ok(!('zeroConstraintRuling' in record) && !('zeroConstraintRulingPending' in record), 'no per-goal zero-constraint flag')
    assert.deepEqual(record.provisionalChoices!.map(choice => [choice.category, choice.words, choice.ruledOn, choice.by]), [
        ['PROVISIONAL_REALIZATION_CHOICE', 'Please proceed with Option A for Play Out from the Back.', '2026-10-15', 'Christian'],
    ])
})

/**
 * **His item 1 of the 16 October reply, recorded ONCE as a general principle** — at the top of the file, not in any
 * record, and applied by selection without a goal id (selection-pool.unit.ts proves both).
 */
test('the general principle is recorded once, in his words, labelled a GENERAL_PRINCIPLE', () => {
    const principle = libraryConstraintPrinciple()
    assert.equal(principle.category, 'GENERAL_PRINCIPLE')
    assert.equal(principle.principle, 'A library constraint is not mandatory unless its inclusion is justified by the approved knowledge and intended learning environment.')
    assert.deepEqual([principle.ruledOn, principle.by], ['2026-10-15', 'Christian'])
    assert.ok(principle.words.includes(principle.principle), 'the rule is one of his recorded sentences')
    assert.ok(principle.words.includes("I understand that applying this immediately to every Learning Goal could interrupt existing functionality. We can implement the correction incrementally, but please don't establish Play Out from the Back as a permanent special-case exception."))
    assert.ok(principle.words.includes('The engine should continue enforcing structural validity and any genuinely required conditions.'))
    // Once: no record restates it.
    for (const record of learningGoalAuthorizations()) assert.ok(!JSON.stringify(record).includes(principle.principle), `${record.learningGoalId}: the principle is not restated per record`)
    // The gate refuses a principle that drifts from his words, or is missing, or uncited.
    assert.deepEqual(validateLibraryConstraintPrinciple(principle), [])
    assert.ok(validateLibraryConstraintPrinciple(null).some(e => e.includes('not recorded')))
    assert.ok(validateLibraryConstraintPrinciple({ ...principle, principle: 'A library constraint is never mandatory.' }).some(e => e.includes('not one of his recorded sentences')))
    assert.ok(validateLibraryConstraintPrinciple({ ...principle, by: '' }).some(e => e.includes('cites no ruling')))
    assert.ok(validateLibraryConstraintPrinciple({ ...principle, category: 'PROVISIONAL_REALIZATION_CHOICE' as any }).some(e => e.includes('not labelled GENERAL_PRINCIPLE')))
    const copy = libraryConstraintPrinciple()
    copy.words.push('edited')
    assert.ok(!libraryConstraintPrinciple().words.includes('edited'), 'handed out as a copy')
})

test('it excludes Wide Zone Advantage by his item 7, and cross-references the existing hold for the gate', () => {
    const [wide, gate] = a01().excluded
    assert.equal(wide.knowledgeId, WIDE_ZONE)
    assert.equal(wide.heldBy, null, 'this record is the ruling for Wide Zone')
    assert.ok(wide.ruling.startsWith('Approved. Please leave Wide Zone Advantage out of this initial Play Out from the Back demonstration.'), wide.ruling)
    assert.equal(gate.knowledgeId, PCG)
    assert.equal(gate.heldBy, 'learning-design-holds.json', 'the gate is cross-referenced, not held a second time')
    assert.equal(gate.ruling, 'The Pass Combination Gate remains excluded under our previous decision.')
    assert.ok(learningGoalSelectionHolds().some(hold => hold.knowledgeId === PCG), 'and the hold it points at exists')
})

/**
 * The manipulations: his seven phrases (one splits in two, starting positions and progression references), plus the
 * pressing condition his item 10 names. Each status is pinned, because each is either his ruling, the game form's
 * knowledge, a gap he asked to be flagged, or our identification of the smallest set — and a change to any of them
 * is a learning-design change to be noticed.
 */
test('each manipulation his context names, with its status', () => {
    const rows = a01().manipulations.map(m => [m.phrase, m.aspect, m.status])
    assert.deepEqual(rows, [
        ['starting positions', 'where the team building out starts', 'AUTHORIZED_BY_RULING'],
        ['starting positions', "the defending team's starting relationship", 'MISSING_KNOWLEDGE'],
        ['field dimensions', null, 'AUTHORIZED_VIA_GAME_FORM_OR_SESSION'],
        ['progression references', 'the target\'s placement at one end, inside the area', 'AUTHORIZED_VIA_GAME_FORM_OR_SESSION'],
        ['progression references', "the zone's depth", 'MISSING_KNOWLEDGE'],
        ['defensive numbers', null, 'NOT_SELECTED_FOR_FIRST_DEMO'],
        ['goalkeeper positioning', null, 'AUTHORIZED_BY_RULING'],
        ['overloads', null, 'NOT_SELECTED_FOR_FIRST_DEMO'],
        ['support spacing', null, 'NOT_SELECTED_FOR_FIRST_DEMO'],
        ['when and how defenders can press', null, 'MISSING_KNOWLEDGE'],
    ])
    // His seven phrases, as item 1 lists them, each present.
    const phrases = new Set(a01().manipulations.map(m => m.phrase))
    for (const phrase of ['starting positions', 'field dimensions', 'progression references', 'defensive numbers', 'goalkeeper positioning', 'overloads', 'support spacing']) {
        assert.ok(phrases.has(phrase), phrase)
        assert.ok(a01().ruling[5].includes(phrase), `"${phrase}" is his word in item 1`)
    }
    // The zone depth records the 5 m prototype as his words, not as a value.
    const depth = a01().manipulations.find(m => m.aspect === "the zone's depth")!
    assert.ok(depth.statusBasis.includes('A 5 m end-zone depth could be considered as an initial prototype for a 40 × 30 m area, but I am not approving it as a canonical value.'))
    for (const manipulation of a01().manipulations) {
        assert.ok((MANIPULATION_STATUSES as readonly string[]).includes(manipulation.status))
        assert.ok(manipulation.source.trim() && manipulation.statusBasis.trim(), `${manipulation.phrase}: cited`)
        // No canonical Environmental Manipulation or Affordance Target id is written in (his 13 September deferral).
        assert.doesNotMatch(JSON.stringify(manipulation), /EM-0|RPC-MAP-|tl-v0-lens/, `${manipulation.phrase}: no mapped id`)
    }
})

test('the gate refuses an entry without a citation', () => {
    assert.ok(damaged(r => (r.ruling = [])).some(e => e.includes('cites no ruling')))
    assert.ok(damaged(r => (r.by = '')).some(e => e.includes('cites no ruling')))
    assert.ok(damaged(r => (r.manipulations[0].source = '')).some(e => e.includes('cites no source')))
    assert.ok(damaged(r => (r.manipulations[0].statusBasis = ' ')).some(e => e.includes('gives no basis for its status')))
    assert.ok(damaged(r => ((r.manipulations[0] as any).status = 'AUTHORIZED')).some(e => e.includes('unknown status AUTHORIZED')))
    assert.ok(damaged(r => (r.excluded[0].ruling = '')).some(e => e.includes(`the exclusion of ${WIDE_ZONE} cites no ruling`)))
    // Re-pointed 15 October 2026: a per-goal zero-constraint ruling is not merely uncited, it is not read at all now —
    // the general principle governs every record alike — so a record carrying one is refused.
    assert.ok(damaged(r => ((r as any).zeroConstraintRuling = { ruledOn: '2026-10-16', by: 'Christian', ruling: 'yes' })).some(e => e.includes('a per-goal zero-constraint ruling is not read')))
    assert.ok(damaged(r => (r.provisionalChoices![0].words = '')).some(e => e.includes('provisional choice 1 must say what it is and cite')))
    assert.ok(damaged(r => ((r.provisionalChoices![0] as any).category = 'GENERAL_PRINCIPLE')).some(e => e.includes('not labelled PROVISIONAL_REALIZATION_CHOICE')))
    assert.ok(damaged(r => delete (r as any).authorizedConstraints).some(e => e.includes('must be a list (the evaluation) or null (not yet evaluated)')))
    assert.deepEqual(damaged(r => (r.authorizedConstraints = null)), [], 'null is an answer: not yet evaluated')
    assert.ok(damaged(r => (r.authorizedConstraintsFinding = '')).some(e => e.includes('carries no finding')))
})

test('the gate refuses an id the selectable library does not hold', () => {
    assert.ok(damaged(r => (r.authorizedConstraints = ['tl-v0-constraint-no-such-object'])).some(e => e.includes('authorizes tl-v0-constraint-no-such-object, which the selectable library does not hold')))
    assert.ok(damaged(r => (r.excluded[0].knowledgeId = 'tl-v0-constraint-nothing')).some(e => e.includes('excludes tl-v0-constraint-nothing')))
})

test('the gate refuses an id both authorized and excluded, or authorized and held — by knowledge key', () => {
    assert.ok(damaged(r => (r.authorizedConstraints = [WIDE_ZONE])).some(e => e.includes(`${WIDE_ZONE} is both authorized and excluded`)))
    assert.ok(damaged(r => (r.authorizedConstraints = ['WIDE-ZONE-ADVANTAGE'])).some(e => e.includes('is both authorized and excluded')), 'another spelling of the same object')
    assert.ok(damaged(r => (r.authorizedConstraints = [PCG])).some(e => e.includes('which a ruling holds out of Learning Goal selection')))
    // A cross-reference to a hold that is not there is refused.
    const errors = validateLearningGoalAuthorizations(learningGoalAuthorizations(), testLibraryRegistry.selectableConstraints().map(c => c.id), [])
    assert.ok(errors.some(e => e.includes(`the exclusion of ${PCG} cross-references learning-design-holds.json, which does not hold it`)), errors.join(' | '))
    // Two records for one goal.
    assert.ok(validateLearningGoalAuthorizations([...learningGoalAuthorizations(), ...learningGoalAuthorizations()]).some(e => e.includes('more than one authorization record')))
    // A selectable id that is neither excluded nor held is admitted: the gate is not a blanket refusal.
    assert.deepEqual(damaged(r => (r.authorizedConstraints = ['tl-v0-constraint-small-area-condition'])), [])
})

test('the record is handed out as copies, so no caller edits a ruling in place', () => {
    a01().authorizedConstraints.push(WIDE_ZONE)
    learningGoalAuthorizations()[0].ruling[0] = 'edited'
    assert.deepEqual(a01().authorizedConstraints, [])
    assert.notEqual(a01().ruling[0], 'edited')
})

console.log(`learning-goal-authorizations: ${passed} passed`)
if (process.exitCode) console.log('learning-goal-authorizations: FAILURES ABOVE')
