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
import fs from 'node:fs'
import path from 'node:path'

import { loadCorpusContracts } from '../derivation/corpus'
import { AUDITS_DIR } from '../derivation/knowledge-root'
import rpcLibraryJson from '../sport-module/rpc-library.rc1.json'
import { learningGoalSelectionHolds } from './learning-design-holds'
import {
    authorizationLists,
    learningGoalAuthorization,
    learningGoalAuthorizations,
    LearningGoalAuthorization,
    libraryConstraintPrinciple,
    MANIPULATION_STATUSES,
    neededRecordGaps,
    validateLearningGoalAuthorizations,
    validateLibraryConstraintPrinciple,
} from './learning-goal-authorizations'
import recordFile from './library/learning-goal-authorizations.json'
import { testLibraryRegistry } from './library/registry'

const learningGoalAuthorizationsAbout = (): string => String((recordFile as { about: string }).about)

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
/**
 * **A01's record as it stood before stage K6 (15 October 2026), on a COPY (TEST-ONLY)**: the pressing team's starting
 * relationship and where the targets sit as genuine gaps, the asymmetric structure as a missing capability. Stage K6 carried all
 * three, so the production record names no gap; the gate's refusals and the gap reader are proved on this copy instead.
 */
const asBeforeK6 = (record: LearningGoalAuthorization): LearningGoalAuthorization => {
    Object.assign(record.manipulations[1], { category: 'GENUINE_GAP', status: 'MISSING_KNOWLEDGE', gaps: ['D4', 'M5'] })
    Object.assign(record.manipulations[4], { category: 'GENUINE_GAP', status: 'MISSING_KNOWLEDGE', gaps: ['D3'] })
    Object.assign(record.provisionalChoices![1], { status: 'MISSING_CAPABILITY', gaps: ['D2', 'D7', 'M1', 'M2'] })
    return record
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
    // Option A first; the rest of his 16 October provisional choices since stage H3 (pinned below).
    assert.deepEqual(record.provisionalChoices!.slice(0, 1).map(choice => [choice.category, choice.words, choice.ruledOn, choice.by, choice.status]), [
        ['PROVISIONAL_REALIZATION_CHOICE', 'Please proceed with Option A for Play Out from the Back.', '2026-10-15', 'Christian', 'AUTHORIZED_BY_RULING'],
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
/**
 * **Re-pointed 15 October 2026 (stage H3): the statuses brought up to his 16 October reply, each with its category.**
 * His item 10 asks for *"General learning-design principles. Provisional realization choices for the first activity.
 * Existing knowledge relationships that require verification. Genuine implementation or knowledge gaps."* kept
 * distinct, so every entry now names its category beside its status. What moved, and why:
 *   - press timing MISSING_KNOWLEDGE -> AUTHORIZED_BY_RULING: his item 3 answers it (immediate pressing; *"I do not
 *     favor a timed release."*);
 *   - the zone's depth -> where each target sits, still MISSING_KNOWLEDGE (D3): his item 4 supersedes the far-end 5 m
 *     prototype (*"I therefore favor an intermediate progression reference or target over a distant terminal end
 *     zone"*); the target-per-team entry's aspect drops "at one end", which predates item 4;
 *   - goalkeeper positioning AUTHORIZED_BY_RULING -> MISSING_CAPABILITY: his item 7 approves two goalkeepers *"if that
 *     configuration is supported by the selected game form"*, and nothing gives a team its goalkeeper (M2, M3; D6);
 *   - defensive numbers and overloads NOT_SELECTED_FOR_FIRST_DEMO -> MISSING_KNOWLEDGE (D6): item 7, the allocation
 *     must *"support the chosen asymmetrical game structure, rather than automatically inheriting"* the symmetric one;
 *   - where the build-out starts AUTHORIZED_BY_RULING -> MISSING_CAPABILITY (M3): still his choice, and no game holds a
 *     start element. MISSING_CAPABILITY did not exist as a status before this stage.
 */
test('each manipulation his context names, with its category and status', () => {
    const rows = a01().manipulations.map(m => [m.phrase, m.aspect, m.category, m.status, m.gaps])
    assert.deepEqual(rows, [
        // Moved 15 October 2026 (stage K5): capability M3 is built (register version 12) and A01-R1 carries his D5 start and
        // restarts (taken by the building team's goalkeeper from the feet, at a location the coach chooses). It read
        // MISSING_CAPABILITY ['M3'] until then.
        ['starting positions', 'where the team building out starts', 'PROVISIONAL_REALIZATION_CHOICE', 'AUTHORIZED_BY_RULING', []],
        // Moved 15 October 2026 (stage K6): capability M5 is built (register version 13, P10a/P10b bound to EM-0002) and A01-R1
        // carries his D4 starting relationship through the Performer Configuration relationship he confirmed on 18 October; the
        // aspect names the role (his D7). It read "the defending team's starting relationship", GENUINE_GAP / MISSING_KNOWLEDGE
        // ['D4', 'M5'] until then.
        ['starting positions', "the pressing team's starting relationship", 'PROVISIONAL_REALIZATION_CHOICE', 'AUTHORIZED_BY_RULING', []],
        ['field dimensions', null, 'EXISTING_KNOWLEDGE_TO_VERIFY', 'AUTHORIZED_VIA_GAME_FORM_OR_SESSION', []],
        ['progression references', "each team's own target, in a different place, inside the area", 'EXISTING_KNOWLEDGE_TO_VERIFY', 'AUTHORIZED_VIA_GAME_FORM_OR_SESSION', []],
        // Moved 15 October 2026 (stage K6): his 18 October item 3 values, for the 40 x 30 m prototype, carried by A01-R1 on
        // capability M7 (register version 13). It read GENUINE_GAP / MISSING_KNOWLEDGE ['D3'] until then.
        ['progression references', 'where each target sits: the build-out progression target and the post-regain area', 'PROVISIONAL_REALIZATION_CHOICE', 'AUTHORIZED_BY_RULING', []],
        // Moved 15 October 2026 (stage K4): his D6 of 17 October and his confirmation of the Participant Composition
        // relationship on 18 October (item 5) are carried by the provisional realization's counts by role — so the numbers
        // entries are his provisional choice, authorized by his ruling, and the goalkeeper entry waits on M3 alone (its start
        // role). They read GENUINE_GAP / MISSING_KNOWLEDGE ['D6'] and ['D6', 'M2', 'M3'] until then.
        ['defensive numbers', null, 'PROVISIONAL_REALIZATION_CHOICE', 'AUTHORIZED_BY_RULING', []],
        // 15 October 2026 (stage K5): the goalkeeper's start role is carried too (A01-R1-T3-1, M3); it read MISSING_CAPABILITY ['M3'].
        ['goalkeeper positioning', null, 'PROVISIONAL_REALIZATION_CHOICE', 'AUTHORIZED_BY_RULING', []],
        ['overloads', null, 'PROVISIONAL_REALIZATION_CHOICE', 'AUTHORIZED_BY_RULING', []],
        ['support spacing', null, 'EXISTING_KNOWLEDGE_TO_VERIFY', 'NOT_SELECTED_FOR_FIRST_DEMO', []],
        ['when and how defenders can press', null, 'PROVISIONAL_REALIZATION_CHOICE', 'AUTHORIZED_BY_RULING', []],
    ])
    // His seven phrases, as item 1 lists them, each present.
    const phrases = new Set(a01().manipulations.map(m => m.phrase))
    for (const phrase of ['starting positions', 'field dimensions', 'progression references', 'defensive numbers', 'goalkeeper positioning', 'overloads', 'support spacing']) {
        assert.ok(phrases.has(phrase), phrase)
        assert.ok(a01().ruling[5].includes(phrase), `"${phrase}" is his word in item 1`)
    }
    // Where the targets sit rests on his item 4, and the superseded 5 m prototype is kept as his words — in the note,
    // labelled superseded, and never as a value (re-pointed 15 October 2026 from the statusBasis, where it was the basis).
    const placement = a01().manipulations.find(m => m.aspect === 'where each target sits: the build-out progression target and the post-regain area')!
    assert.ok(placement.statusBasis.includes('I therefore favor an intermediate progression reference or target over a distant terminal end zone for this first activity.'))
    assert.ok(placement.statusBasis.includes('A midfield line or zone may be appropriate, but I do not want to mandate midfield or prescribe a universal depth.'))
    // 15 October 2026 (stage K6): his 18 October values lead the basis; the item 4 words stay beside them as the earlier basis.
    assert.ok(placement.statusBasis.startsWith("His reply filed 18 October 2026, item 3: 'I approve the following provisional values:'"))
    assert.ok(placement.note!.includes('A 5 m end-zone depth could be considered as an initial prototype for a 40 × 30 m area, but I am not approving it as a canonical value.'))
    assert.ok(placement.note!.includes('superseded by item 4'))
    // Press timing is answered by his item 3, and what he kept as potential realizations is not built.
    const press = a01().manipulations.find(m => m.phrase === 'when and how defenders can press')!
    assert.ok(press.statusBasis.includes('I do not favor a timed release.'))
    assert.ok(press.note!.includes('potential realizations only'))
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
    // E2 (27 October 2026): a record with no manipulations list passed this gate and crashed the build (a TypeError in the record's
    // readers); it is refused here now. An empty list is an answer: the record records none.
    assert.ok(damaged(r => delete (r as any).manipulations).some(e => e.includes('A01: lists no manipulations (an empty list says it records none)')))
    assert.ok(damaged(r => ((r as any).manipulations = null)).some(e => e.includes('lists no manipulations')))
    // After the E2 review: a value present but not a list slipped past the gate's own `?? []` reads and crashed the gate with a TypeError;
    // it is refused by the same sentence now, never thrown.
    for (const notAList of [{}, 'none', 3]) {
        assert.ok(damaged(r => ((r as any).manipulations = notAList)).some(e => e.includes('A01: lists no manipulations (an empty list says it records none)')), JSON.stringify(notAList))
    }
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

/**
 * ── Stage H3, 15 October 2026: his 16 October reply in the record, in his four categories ─────────────
 *
 * His item 10: *"Please keep those categories distinct."* — and *"I would rather see a clear refusal and a narrowly
 * described gap than an activity that is technically valid but solves a different problem."* The record now carries
 * his provisional choices of that reply (each cited, each with whether the engine can carry it), what existing
 * knowledge already authorizes (each with its sources), and the decisions and capabilities the activity waits on
 * (our wording, as put to him, never his).
 */
test('his 16 October provisional choices, each cited, with whether the activity can carry it now', () => {
    const rows = a01().provisionalChoices!.map(choice => [choice.citedAs.split('), ').pop(), choice.status, choice.gaps])
    assert.deepEqual(rows, [
        ['item 1', 'AUTHORIZED_BY_RULING', []],
        // 15 October 2026 (stage K6): carried since K3 (M1 role blocks, his D2(a) roles and exchange in A01-R1) and K2 (M2), his D7
        // wording through the targets keyed by role; moved now, flagged stale by the K4 and K5 reviews. It read
        // MISSING_CAPABILITY ['D2', 'D7', 'M1', 'M2'] until then.
        ['item 2', 'AUTHORIZED_BY_RULING', []],
        ['item 4', 'AUTHORIZED_BY_RULING', []],
        ['item 5', 'AUTHORIZED_BY_RULING', []],
        // 15 October 2026 (stage K5): his 17 October D1, D5, M3 and M4 and 18 October items 2 and 4 are carried by A01-R1's
        // transitions and ruling C58. It read MISSING_CAPABILITY ['D1', 'D5', 'M3', 'M4'] until then.
        ['item 6 and 6.ii', 'AUTHORIZED_BY_RULING', []],
        ['item 6', 'AUTHORIZED_BY_RULING', []],
        // Added 17 October 2026 (stage M2): his reply filed 19 October 2026, item 2 (a controlled regain inside the pressing team's own
        // target counts as a score), carried by A01-R1-V27-1; the six entries of his 16 October reply above are unchanged.
        ['his reply filed 19 October 2026, item 2', 'AUTHORIZED_BY_RULING', []],
        // Stage 2D (21 October 2026) added an eighth, his reply filed 22 October 2026, item 7 (the markings set out once, MARK_UNION_ONCE,
        // for the area his words name). Removed 21 October 2026 (stage 2G): his reply filed 23 October 2026, item 2 makes marking once a
        // general presentation rule, "not something requiring my approval for each configuration" (test (2G) below).
    ])
    const regainScores = a01().provisionalChoices![6]
    assert.equal(regainScores.ruledOn, '2026-10-19')
    assert.ok(regainScores.words.startsWith('For the previously flagged corner case, I favor allowing a controlled regain inside that area to count as a score, provided the pressing team genuinely establishes possession. A contested touch, deflection, or loose ball should not qualify.'))
    assert.ok(regainScores.words.endsWith('This is a provisional scoring choice for the current realization, not a universal rule equating every regain with successful progression.'))
    const [, asymmetry, intermediate, regain, restarts, thirdOrigin] = a01().provisionalChoices!
    // His words, verbatim (16 October reply). The asymmetry is HIS provisional choice, and he said so.
    assert.ok(asymmetry.words.startsWith('For the first demonstration, I favor an asymmetrical game structure.'))
    assert.ok(asymmetry.words.endsWith('This is a provisional realization choice, not a universal requirement for Play Out from the Back.'))
    assert.equal(intermediate.words, 'I therefore favor an intermediate progression reference or target over a distant terminal end zone for this first activity.')
    assert.ok(regain.words.includes('Success should be possible through controlled entry, either by carrying the ball or by passing to a teammate who receives under control.'))
    assert.ok(restarts.words.includes('For this first activity, I favor returning to a goalkeeper or controlled defensive restart when an episode has meaningfully concluded.'))
    assert.ok(restarts.words.includes(' … After a score: Yes, play stops and restarts.'), 'non-adjacent passages joined by an ellipsis')
    assert.ok(thirdOrigin.note!.includes('docs/audits/rpc-001-document-workbook-reconciliation-2026-10-16.md'))
    // Nothing he refused is recorded as a choice.
    const all = JSON.stringify(a01())
    for (const refused of ['5 m zone at the far end', 'high-regain bonus is added', 'transition window applies']) assert.ok(!all.includes(refused), refused)
})

test('the decisions and capabilities the activity waits on: D1-D7 and M1-M5 and M7, each defined once, each named entry resolving', () => {
    const gaps = a01().gaps!
    // **M6 and M8 leave the gaps on 15 October 2026 (stage K1): built, and each now what existing knowledge authorizes.**
    // His 17 October reply approved both — M6 ("I approve the narrow authority exception where the added statement
    // provably cannot contradict existing knowledge") and M8 ("Apply the qualifying conditions to the target and scoring
    // episode actually being evaluated") — and rulings C55 and C57 record them; the three context lines they named are
    // no longer stops (activity-review.unit.ts). Their entries in existingKnowledge cite the rulings and the items.
    // Stage F (26 October 2026): the two decisions the goal version waits on join last, open (his replies filed 26 October 2026, items 4 and 7).
    // H2 (23 October 2026): and a third, the adaptations its default-laws account names as owed (his reply filed 26 October 2026, item 10).
    assert.deepEqual(gaps.map(gap => gap.id), ['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'M1', 'M2', 'M3', 'M4', 'M5', 'M7', 'D-GOAL-SUITABILITY', 'D-PENALTY-AREA', 'D-DEFAULT-LAWS'])
    assert.ok(gaps.every(gap => gap.kind === (gap.id.startsWith('D') ? 'DECISION' : 'CAPABILITY') && gap.description.trim()), 'each a decision or a capability, with a line saying what it is')
    // D8 (the gate's place) was recorded as not yet authored rather than put to him, and affects no Learning Goal.
    assert.ok(!gaps.some(gap => gap.id === 'D8'))
    // Every gap an entry names is defined; the conditional capability (M7) is defined and named by no entry.
    const named = new Set([...a01().manipulations.flatMap(m => m.gaps), ...a01().provisionalChoices!.flatMap(c => c.gaps)])
    // D6 is named by no entry since 15 October 2026 (stage K4): his D6 of 17 October and his 18 October answers are carried by
    // the provisional realization's counts by role; its definition stays, as M7's does, so the record keeps what it asked.
    // D1, D5, M3 and M4 are named by no entry since 15 October 2026 (stage K5): his D1/D5 decisions and the M3/M4 capabilities
    // are carried by A01-R1's transitions; their definitions stay, as D6's and M7's do.
    // None is named by any entry since 15 October 2026 (stage K6): D3, D4 and M5 by the starting values and placements A01-R1
    // carries (his 18 October item 3, the Performer Configuration relationship he confirmed), D2, D7, M1 and M2 by the
    // asymmetric-structure entry, moved at last (stale since K3). Every definition stays, so the record keeps what it asked.
    assert.deepEqual([...named].sort(), [])
    const known = a01().existingKnowledge!
    const origin = known.find(entry => entry.what === 'The origin of a build-out needs no further value.')!
    assert.ok(origin.sources.includes('ruling C55') && origin.note!.includes('RPC-001-18.a::V6') && origin.note!.includes('capability M6'))
    const referents = known.find(entry => entry.what.startsWith('Controlled arrival and the long-clearance exclusion are judged against the target the scoring team attacks'))!
    assert.ok(referents.sources.includes('ruling C57') && referents.note!.includes('RPC-001-18.f::V5 and 19.a::V5') && referents.note!.includes('capability M8'))
    assert.ok(referents.note!.includes('is our M8 wording, which he approved; it is not his sentence'), 'our wording is never presented as his')
    // Our wording, as put to him — never presented as his.
    assert.ok(learningGoalAuthorizationsAbout().includes('The decision and capability ids (D1-D7, M1-M8) and their one-line descriptions are OUR wording, as put to him; none is his.'))
})

/**
 * **What existing knowledge authorizes, each source checked against the knowledge itself.** A source that names
 * nothing would be authority by assertion: every library id must be in the RPC library, and every contract item must
 * be in the loaded corpus and not retired.
 */
test('what existing knowledge already authorizes, every source resolving to the knowledge', () => {
    const known = a01().existingKnowledge!
    // 10 -> 12 on 15 October 2026 (stage K1): the origin needing no further value (C55) and the two referents judged
    // against the target the scoring team attacks (C57), each built from his 17 October M6 / M8 approvals.
    // 12 -> 13 on 15 October 2026 (stage K5): the typed build-out begin condition (C58), on his 18 October acknowledgement.
    assert.equal(known.length, 13)
    const begins = known.find(entry => entry.sources.includes('ruling C58'))!
    assert.ok(begins.note!.includes('"A restart, taken by the goalkeeper or as a controlled defensive restart, that begins a build-out episode."'))
    assert.ok(begins.note!.includes('The wording of this line is ours.'))
    assert.ok(known.every(entry => entry.category === 'EXISTING_KNOWLEDGE_TO_VERIFY' && entry.sources.length > 0))
    const library = JSON.stringify(rpcLibraryJson)
    const items = new Set(loadCorpusContracts().flatMap(contract => contract.items.map(item => item.itemId)))
    let checked = 0
    for (const source of known.flatMap(entry => entry.sources)) {
        for (const id of source.match(/RPC-(PROP|ID|REL|VAL|TR)-\d+/g) ?? []) {
            assert.ok(library.includes(`"${id}"`), `${id} is in the RPC library`)
            checked++
        }
        const item = source.match(/^contract item ([A-Z0-9-]+\.?[a-z]?)/)
        if (item) {
            assert.ok(items.has(item[1]), `${item[1]} is a live contract item`)
            checked++
        }
    }
    // 19 -> 23 on 15 October 2026 (stage K1): RPC-001-18.a (C55), and RPC-PROP-132 with C57's two referent items
    // RPC-001-18.h and 19.c — live in the loaded corpus, added by the ruling, never in contracts.json.
    // 23 -> 25 on 15 October 2026 (stage K5): RPC-PROP-132 and RPC-001-18.b (restated by C58), cited by the begin condition.
    assert.equal(checked, 25, 'every library id and contract item cited is checked')
    /**
     * **Added at the stage H3 review, 15 October 2026: the specification decisions too, and what the one about the
     * session says.** The session entry cited SD-33, which exists — it is the engine's report-only rule — but says
     * nothing about the coach's inputs reaching the game; an existence check alone would not have caught it. So every
     * SD and KR id cited must be a decision the specification or the derivation rules define, and the session entry's
     * decision must be the one about session-supplied values (SD-55: "Supplied values must survive").
     */
    const spec = fs.readFileSync(path.join(AUDITS_DIR, '..', 'design', 'game-representation-spec-2026-09-18.md'), 'utf8')
    const rules = fs.readFileSync(path.join(AUDITS_DIR, 'conformance', 'derivation-rules-2026-09-18.md'), 'utf8')
    const decisionRow = (id: string): string => spec.split('\n').find(line => line.startsWith(`| ${id} |`)) ?? ''
    const decisions = known.flatMap(entry => entry.sources).flatMap(source => source.match(/\b(SD|KR)-\d+\b/g) ?? [])
    assert.deepEqual(decisions, ['SD-06', 'SD-36', 'KR-03', 'SD-20', 'SD-55'])
    for (const id of decisions) assert.ok(id.startsWith('SD') ? decisionRow(id) : rules.includes(`- **${id}.**`), `${id} is a decision the specification or the rules define`)
    const session = known.find(entry => entry.what.startsWith("The coach's player count and playing area"))!
    assert.ok(session.sources.includes('SD-55') && !session.sources.includes('SD-33'), JSON.stringify(session.sources))
    assert.ok(decisionRow('SD-55').includes('Supplied values must survive') && decisionRow('SD-55').includes('session-supplied'))
    assert.ok(decisionRow('SD-33').includes('The engine is report-only') && !decisionRow('SD-33').includes('session-supplied'), 'why SD-33 was the wrong source')
    // Equal numbers are named as what knowledge authorizes, and NOT as the allocation. Re-pointed 15 October 2026 (stage K4):
    // the note said the allocation was decision D6 and equality "not applied as a default"; his D6 is answered, and the entry
    // now says equality is the ALTERNATIVE (his "preserving equal numbers as an alternative"), deferring by ruling C56.
    const equal = known.find(entry => entry.what.startsWith('Equal outfield numbers'))!
    assert.ok(equal.what.includes('remain the alternative allocation'))
    assert.ok(equal.note!.includes('ruling C56') && equal.note!.includes("'preserving equal numbers as an alternative'") && equal.note!.includes('listed as the alternative'))
})

test('the gate refuses a category or a status that does not agree, and a gap nobody defined', () => {
    assert.deepEqual(validateLearningGoalAuthorizations(learningGoalAuthorizations()), [])
    assert.ok(damaged(r => ((r.manipulations[2] as any).category = undefined)).some(e => e.includes('names no category of his')))
    assert.ok(damaged(r => ((r.manipulations[2] as any).category = 'GENERAL_PRINCIPLE')).some(e => e.includes('names no category of his')), 'a principle is recorded once, never as an entry')
    assert.ok(damaged(r => (asBeforeK6(r).manipulations[1].status = 'AUTHORIZED_VIA_GAME_FORM_OR_SESSION')).some(e => e.includes('is a GENUINE_GAP with the status')))
    assert.ok(damaged(r => (asBeforeK6(r).manipulations[1].gaps = [])).some(e => e.includes('names no decision or capability that would supply it')))
    assert.ok(damaged(r => (r.manipulations[2].gaps = ['D1'])).some(e => e.includes('only a missing entry waits on one')))
    assert.ok(damaged(r => (asBeforeK6(r).manipulations[1].gaps = ['D99'])).some(e => e.includes('names the gap D99, which the record does not define')))
    assert.ok(damaged(r => ((asBeforeK6(r).manipulations[1] as any).gaps = undefined)).some(e => e.includes('lists no gaps')))
    assert.ok(damaged(r => (r.manipulations[2].category = 'PROVISIONAL_REALIZATION_CHOICE')).some(e => e.includes('AUTHORIZED_VIA_GAME_FORM_OR_SESSION but not EXISTING_KNOWLEDGE_TO_VERIFY')))
    assert.ok(damaged(r => (r.manipulations[9].category = 'EXISTING_KNOWLEDGE_TO_VERIFY')).some(e => e.includes('AUTHORIZED_BY_RULING but not his PROVISIONAL_REALIZATION_CHOICE')))
    assert.ok(damaged(r => ((r.provisionalChoices![1] as any).status = 'BUILT')).some(e => e.includes('provisional choice 2 has the unknown status BUILT')))
    assert.ok(damaged(r => (asBeforeK6(r).provisionalChoices![1].gaps = [])).some(e => e.includes('provisional choice 2 is MISSING_CAPABILITY and names no decision')))
    assert.ok(damaged(r => r.gaps!.push({ ...r.gaps![0] })).some(e => e.includes('the gap D1 is defined twice')))
    assert.ok(damaged(r => ((r.gaps![0] as any).kind = 'WISH')).some(e => e.includes('gap 1 must have an id, a kind')))
    assert.ok(damaged(r => (r.existingKnowledge![0].sources = [])).some(e => e.includes('existing knowledge 1 must say what is authorized and cite at least one source')))
    assert.ok(damaged(r => ((r.existingKnowledge![0] as any).category = 'GENUINE_GAP')).some(e => e.includes('existing knowledge 1 is not labelled EXISTING_KNOWLEDGE_TO_VERIFY')))
    // Removing a definition an entry names is refused: a refusal must never cite a decision nobody can find.
    // Re-pointed 15 October 2026 (stage K4) from D6, which no entry names now (its entries are carried): D3 still is.
    // Re-pointed again 15 October 2026 (stage K6): no production entry names D3 now, so the record as it stood before K6 (a copy).
    // The four refusals above on manipulation 1 and provisional choice 2 are re-pointed to the same copy for the same reason.
    assert.ok(damaged(r => (asBeforeK6(r).gaps = r.gaps!.filter(gap => gap.id !== 'D3'))).some(e => e.includes('names the gap D3, which the record does not define')))
})

/**
 * **The build refuses on exactly the entries that are not in place** (`neededRecordGaps`), each with the decisions and
 * capabilities that would supply it, read from the record — for any goal's record alike.
 */
test('neededRecordGaps: the six parts of the activity not in place, each with what would supply it', () => {
    // Three -> none on 15 October 2026 (stage K6): his 18 October starting values and the Performer Configuration relationship
    // carry the two spatial entries, and the asymmetric-structure entry (stale since K3) is moved. Production A01 names no gap.
    assert.deepEqual(neededRecordGaps(a01()), [])
    // What follows is re-pointed to the record as it stood before K6, on a copy (TEST-ONLY), so the reader stays proved.
    const before = asBeforeK6(JSON.parse(JSON.stringify(a01())))
    const needed = neededRecordGaps(before)
    // Eight -> six on 15 October 2026 (stage K4): 'defensive numbers' and 'overloads' (both D6) are carried by the
    // provisional realization's counts by role, and 'goalkeeper positioning' waits on M3 alone (it read D6, M2, M3).
    // Six -> three on 15 October 2026 (stage K5): where the building team starts and the goalkeeper's part (both M3) and the
    // episodes and restarts (D1, D5, M3, M4) are carried by A01-R1's transitions. What remains is stage K6's (D3, D4/M5) and
    // the asymmetric-structure entry, which still names D2, D7, M1 and M2 though M1/M2 were built and D2 is answered (a stale
    // entry the K4 review flagged for the lead; left as recorded).
    assert.deepEqual(needed.map(gap => [gap.from, gap.status, gap.gaps.map(named => named.id)]), [
        ['manipulation', 'MISSING_KNOWLEDGE', ['D4', 'M5']],
        ['manipulation', 'MISSING_KNOWLEDGE', ['D3']],
        ['provisional choice', 'MISSING_CAPABILITY', ['D2', 'D7', 'M1', 'M2']],
    ])
    assert.deepEqual(needed.slice(0, 2).map(gap => gap.label), [
        "starting positions — the pressing team's starting relationship",
        'progression references — where each target sits: the build-out progression target and the post-regain area',
    ])
    assert.equal(needed[0].gaps[0].description, a01().gaps!.find(gap => gap.id === 'D4')!.description, 'the description is the record\'s')
    // No goal is special: the same entries under another goal's id give the same gaps, and a record with no gap entry
    // (or an evaluated-empty test record with no entries) gives none.
    assert.deepEqual(neededRecordGaps({ ...before, learningGoalId: 'TEST-ONLY' }), needed)
    assert.deepEqual(neededRecordGaps({ ...before, manipulations: [], provisionalChoices: [] }), [])
    const handed = neededRecordGaps(before)
    handed[0].gaps[0].description = 'edited'
    assert.notEqual(neededRecordGaps(before)[0].gaps[0].description, 'edited', 'handed out as copies')
})

/**
 * **The review page's three lists are the record's own entries, sorted by the category the record gives them.**
 * Key identity: every existing-knowledge entry and every provisional choice reaches its list whole, every
 * manipulation is accounted for (a list, a gap it waits on, or not selected), and every gap carries the entries
 * that wait on it.
 */
test('authorizationLists: authorized by existing knowledge, his provisional choices, and the gaps', () => {
    const record = a01()
    const lists = authorizationLists(record)
    assert.deepEqual(lists.authorizedByExistingKnowledge.map(entry => entry.label), [
        ...record.existingKnowledge!.map(known => known.what),
        'field dimensions',
        "progression references — each team's own target, in a different place, inside the area",
    ])
    assert.deepEqual(lists.authorizedByExistingKnowledge.slice(0, record.existingKnowledge!.length).map(entry => entry.sources), record.existingKnowledge!.map(known => known.sources))
    assert.deepEqual(lists.provisionalChoices.map(entry => entry.label), [
        ...record.provisionalChoices!.map(choice => choice.choice),
        'starting positions — where the team building out starts',
        // 15 October 2026 (stage K6): the two spatial entries are his provisional choices now (they were gaps).
        "starting positions — the pressing team's starting relationship",
        'progression references — where each target sits: the build-out progression target and the post-regain area',
        // 15 October 2026 (stage K4): the two numbers entries are his provisional choices now (they were gaps).
        'defensive numbers',
        'goalkeeper positioning',
        'overloads',
        'when and how defenders can press',
    ])
    // Re-pointed 17 October 2026 (stage M2): the record holds seven provisional choices (his reply filed 19 October 2026, item 2, joins
    // the six of his 16 October reply), and each still opens the list in order, whole.
    // Re-pointed 21 October 2026 (stage 2D): eight, his reply filed 22 October 2026, item 7, joining them last.
    // Re-pointed 21 October 2026 (stage 2G): seven again; his reply filed 23 October 2026, item 2 superseded that record with a general rule.
    assert.equal(record.provisionalChoices!.length, 7)
    assert.deepEqual(lists.provisionalChoices.slice(0, 7).map(entry => [entry.words, entry.citedAs, entry.status, entry.gaps]), record.provisionalChoices!.map(choice => [choice.words, choice.citedAs, choice.status, choice.gaps]))
    assert.deepEqual(lists.gaps.map(({ neededBy, ...gap }) => gap), record.gaps, 'each definition whole')
    // Re-pointed 15 October 2026 (stage K4): D6 is needed by no entry now (it was needed by 'defensive numbers', 'goalkeeper
    // positioning' and 'overloads'); M3 is needed by the goalkeeper entry among others.
    assert.deepEqual(lists.gaps.find(gap => gap.id === 'D6')!.neededBy, [])
    // Re-pointed 15 October 2026 (stage K5): M3 is needed by no entry now (it was needed by the two starting entries and the
    // episodes-and-restarts choice), and neither are D1, D5 or M4.
    for (const id of ['M3', 'M4', 'D1', 'D5']) assert.deepEqual(lists.gaps.find(gap => gap.id === id)!.neededBy, [], id)
    // Re-pointed 15 October 2026 (stage K6): no decision or capability is needed by any entry now.
    // Stage F (26 October 2026): except the two the goal version is listed waiting on, which name it (and no entry).
    // Re-pointed 24 October 2026 (K3): the goal version waits on none of them now (A01's record lists it as tried; his reply filed 27 October
    // 2026 settles the three), so no gap is needed by anything. Was: the D- gaps needed by 'the alternative realization A01-R2'.
    for (const gap of lists.gaps) assert.deepEqual(gap.neededBy, [], gap.id)
    // Re-pointed 15 October 2026 (stage K1) from M8, which left the gaps when it was built (C57).
    assert.deepEqual(lists.gaps.find(gap => gap.id === 'M7')!.neededBy, [], 'the conditional capability waits on no entry here')
    const accounted = new Set([...lists.authorizedByExistingKnowledge, ...lists.provisionalChoices].map(entry => entry.label).concat(lists.gaps.flatMap(gap => gap.neededBy)))
    for (const manipulation of record.manipulations) {
        const label = manipulation.aspect ? `${manipulation.phrase} — ${manipulation.aspect}` : manipulation.phrase
        assert.ok(accounted.has(label) || manipulation.status === 'NOT_SELECTED_FOR_FIRST_DEMO', `${label} is in a list`)
    }
    // A record with nothing in a category gives an empty list, not a missing one.
    assert.deepEqual(authorizationLists({ ...record, existingKnowledge: undefined, gaps: undefined, provisionalChoices: undefined, manipulations: [] }), { authorizedByExistingKnowledge: [], provisionalChoices: [], gaps: [] })
})

/**
 * **Every gap the record names is settled by his words — stage M4, 17 October 2026 (design step L11).** His reply filed 17 October 2026
 * asked for "Provenance distinguishing approved knowledge, provisional realization choices, and any remaining gaps."; the review page
 * listed all thirteen as "still needed". A gap is settled only by his cited words (`settledBy`), never by an empty `neededBy`, and never
 * while an entry still waits on it; the lists carry the words, and the page splits the list.
 */
test('(M4, L11) every record gap is settled by his cited words, and the gate refuses settled words that are uncited or premature', () => {
    const record = a01()
    assert.deepEqual(record.gaps!.map(gap => gap.id), ['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'M1', 'M2', 'M3', 'M4', 'M5', 'M7', 'D-GOAL-SUITABILITY', 'D-PENALTY-AREA', 'D-DEFAULT-LAWS'])
    // Stage F (26 October 2026): the two decisions the goal version waits on are OPEN - his, and settled by no words of his. H2 (23 October
    // 2026): the third, D-DEFAULT-LAWS, likewise.
    // Re-pointed 24 October 2026 (K3, the d27 design's stage K3): his reply filed 27 October 2026 settles all three - D-GOAL-SUITABILITY by
    // items 1 and 6, D-PENALTY-AREA by item 1 (the 1b principle he approves in it), D-DEFAULT-LAWS by items 2, 3, 4 and 6 - each entry one
    // sentence of his (byte-checked against the reply file when recorded). The notes keep their opening "OPEN, his" and every old word, a
    // dated AMENDED (K3) line saying what is no longer true. The Stage F rule held: the gaps left A01-R2's entry before they were settled.
    // The K3 review's should-fix (24 October 2026): D-DEFAULT-LAWS's goalkeeper's-handling part is settled by the penalty area his reply
    // filed 27 October 2026, item 1 gives the goal together with his reply filed 26 October 2026, item 7, so that sentence is cited too
    // (last; byte-checked against the reply file).
    const settledByK3 = record.gaps!.filter(gap => gap.id.startsWith('D-'))
    assert.deepEqual(settledByK3.map(gap => [gap.id, gap.kind, (gap.settledBy ?? []).map(said => said.citedAs.replace('his reply filed 27 October 2026, item ', ''))]), [
        ['D-GOAL-SUITABILITY', 'DECISION', ['1', '1', '1', '6']],
        ['D-PENALTY-AREA', 'DECISION', ['1', '1', '1']],
        ['D-DEFAULT-LAWS', 'DECISION', ['2', '3', '4', '4', '4', '6', 'his reply filed 26 October 2026, item 7']],
    ])
    const handlingWords = settledByK3[2].settledBy![settledByK3[2].settledBy!.length - 1]
    assert.deepEqual(handlingWords, {
        words: 'My preference is for standard soccer goalkeeper handling rules to apply, using a regulation penalty area whenever the playing environment can accommodate it appropriately.',
        citedAs: 'his reply filed 26 October 2026, item 7',
    })
    assert.ok(settledByK3[1].settledBy!.some(said => said.words.startsWith('I also approve your proposed general principle in 1b: ')), 'the 1b principle, quoted inside item 1 (there is no item 1b)')
    for (const gap of settledByK3.slice(0, 2)) assert.ok(gap.note!.startsWith('OPEN, his (added 26 October 2026, Stage F).'), gap.id)
    assert.ok(settledByK3[2].note!.startsWith('OPEN, his (added 23 October 2026, H2, the d26 design\'s build step 2).'))
    for (const gap of settledByK3) {
        const at = gap.note!.indexOf('AMENDED 24 October 2026 (K3, the d27 design\'s stage K3)')
        assert.ok(at > gap.note!.indexOf('This gap stays open, and the goal version stays listed and never tried, until K3 lifts it.'), `${gap.id}: the old words kept, then the K3 line`)
        assert.ok(gap.note!.slice(at).includes('The gap left the goal version\'s entry in the record (realizations) before it was marked settled'), gap.id)
    }
    // The K2 review's should-fix: D-DEFAULT-LAWS's description keeps its words and says, dated, what is no longer true of them.
    const description = settledByK3[2].description
    assert.ok(description.startsWith("The adaptation the goal version still owes where a normal Law of the Game cannot apply directly: the goalkeeper's handling until a penalty area exists (LAW-12-GK)."))
    assert.ok(description.indexOf("AMENDED 24 October 2026 (K3, the K2 review's should-fix): 'The adaptation the goal version still owes' is no longer true.") > description.indexOf("Was: '"))
    // The K3 review's should-fix: its 'until a penalty area exists' words, kept, and a dated line after the K2 review's one saying they are no
    // longer true of the goal version, with what settles the handling; the note says, dated, that its citation of the handling was incomplete.
    const handlingLine = "AMENDED 24 October 2026 (K3, the K3 review's should-fix): 'the goalkeeper's handling until a penalty area exists (LAW-12-GK)' is no longer true of the goal version."
    assert.ok(description.indexOf(handlingLine) > description.indexOf("AMENDED 24 October 2026 (K3, the K2 review's should-fix)"))
    assert.ok(description.slice(description.indexOf(handlingLine)).includes('his reply filed 26 October 2026, item 7 (settledBy)'))
    const note = settledByK3[2].note!
    const noteLine = note.indexOf("AMENDED 24 October 2026 (K3, the K3 review's should-fix): 'and the goalkeeper's handling by item 6, inside the penalty area item 1 gives the goal (D-PENALTY-AREA)' did not cite the words that settle the handling.")
    assert.ok(noteLine > note.indexOf("The decision is settled by his reply filed 27 October 2026, items 2, 3, 4 and 6 (settledBy): offside by item 2; penalty kicks and every other restart by items 3 and 4, one goalkeeper restart at every dead ball, the goal line included, the same in both versions; and the goalkeeper's handling by item 6, inside the penalty area item 1 gives the goal (D-PENALTY-AREA)."), 'the old words kept, then the line')
    assert.ok(note.slice(noteLine).includes(`"${handlingWords.words}"`))
    // A gap an alternative realization still waits on may not be marked settled, as for an entry. Re-pointed 24 October 2026 (K3): the order
    // the Stage F rule asks is pinned the other way round now - on a copy, A01-R2 listed waiting again on any of the three settled gaps
    // is refused, naming the gap and the alternative (was: a TEST-ONLY settledBy on the open gaps, refused the same way).
    for (const id of ['D-GOAL-SUITABILITY', 'D-PENALTY-AREA', 'D-DEFAULT-LAWS']) {
        const waitingAgain = (r: LearningGoalAuthorization) => {
            const alternative = (r.realizations as any[]).find(entry => entry.realization === 'A01-R2')
            alternative.status = 'MISSING_KNOWLEDGE'
            alternative.gaps = [id]
        }
        assert.ok(damaged(waitingAgain).some(e => e.includes(`the gap ${id} is marked settled, and the alternative realization A01-R2 still waits on it`)), id)
    }
    for (const gap of record.gaps!.filter(gap => !gap.id.startsWith('D-'))) {
        assert.ok((gap.settledBy ?? []).length > 0, `${gap.id} is settled`)
        for (const said of gap.settledBy!) assert.match(said.citedAs, /^his reply filed 1[789] October 2026, /, `${gap.id}: ${said.citedAs}`)
    }
    assert.deepEqual(record.gaps!.find(gap => gap.id === 'M1')!.settledBy, [{ words: 'M1 — Role exchange by block: Approved.', citedAs: 'his reply filed 17 October 2026, M1' }])
    // The lists carry the words whole beside each definition.
    assert.deepEqual(authorizationLists(record).gaps.map(gap => [gap.id, gap.settledBy]), record.gaps!.map(gap => [gap.id, gap.settledBy]))
    // Refused: words that are not cited, an empty list, and a gap marked settled while an entry still waits on it.
    assert.ok(damaged(r => (r.gaps![0].settledBy = [{ words: 'TEST-ONLY', citedAs: '' }])).some(e => e.includes('the gap D1 is settled by no cited words of his')))
    assert.ok(damaged(r => (r.gaps![0].settledBy = [])).some(e => e.includes('the gap D1 is settled by no cited words of his')))
    assert.ok(damaged(r => void asBeforeK6(r)).some(e => e.includes('the gap D3 is marked settled, and') && e.includes('still waits on it')))
    // Without settledBy a gap stays unsettled, and nothing else is refused for it.
    assert.deepEqual(damaged(r => delete r.gaps![0].settledBy), [])
})

/**
 * **Stage 2G, 21 October 2026: his reply filed 23 October 2026, item 2, supersedes the per-configuration record of stage 2D.** *"Please
 * authorize marking once whenever the system can establish that the physical markings occupy the same locations across all blocks. This
 * should be a general presentation rule, not something requiring my approval for each configuration."* Stage 2D recorded his item 7 of
 * 22 October as the one choice a reader acted on (MARK_UNION_ONCE, scoped to 40 × 30 m). That entry is removed, and the file's `about`
 * records why, as the file records every amendment. The two fields only it carried are refused on any choice, so a per-configuration
 * record cannot come back unread (a code nobody reads would be a value acted on by nobody).
 */
test('(2G) no provisional choice carries a code or an area; either field is refused, MARK_UNION_ONCE with his old scope included', () => {
    const record = a01()
    assert.ok(record.provisionalChoices!.every(choice => !('value' in choice) && !('appliesTo' in choice)))
    assert.ok(!record.provisionalChoices!.some(choice => choice.citedAs === 'his reply filed 22 October 2026, item 7'), 'the stage 2D entry is gone')
    // The amendment is recorded in the file's own `about`, citing his item 2 verbatim.
    const about = String((recordFile as { about: string }).about)
    assert.ok(about.includes('AMENDED 21 October 2026 (stage 2G of the communication work), narrowly, for his reply filed 23 October 2026, item 2:'))
    assert.ok(about.includes("'Please authorize marking once whenever the system can establish that the physical markings occupy the same locations across all blocks. This should be a general presentation rule, not something requiring my approval for each configuration.'"))
    const last = record.provisionalChoices!.length
    const refusal = `provisional choice ${last} carries a code or an area a reader would act on (value, appliesTo)`
    assert.ok(damaged(r => Object.assign(r.provisionalChoices![last - 1], { value: 'MARK_UNION_ONCE', appliesTo: { lengthM: 40, widthM: 30 } })).some(e => e.includes(refusal)), 'the stage 2D record itself')
    assert.ok(damaged(r => Object.assign(r.provisionalChoices![last - 1], { value: 'TEST-ONLY' })).some(e => e.includes(refusal)), 'a code alone')
    assert.ok(damaged(r => Object.assign(r.provisionalChoices![last - 1], { appliesTo: { lengthM: 40, widthM: 30 } })).some(e => e.includes(refusal)), 'an area alone')
    assert.deepEqual(damaged(() => undefined), [], 'the record as it stands loads')
})

test('the record is handed out as copies, so no caller edits a ruling in place', () => {
    a01().authorizedConstraints.push(WIDE_ZONE)
    learningGoalAuthorizations()[0].ruling[0] = 'edited'
    assert.deepEqual(a01().authorizedConstraints, [])
    assert.notEqual(a01().ruling[0], 'edited')
})

console.log(`learning-goal-authorizations: ${passed} passed`)
if (process.exitCode) console.log('learning-goal-authorizations: FAILURES ABOVE')
