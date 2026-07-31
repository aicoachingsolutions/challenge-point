/**
 * Unit tests — Runtime Interface RC1.2 shared observation vocabulary.
 *
 * These pin the contract, not our convenience. The value of a canonical enumeration is that stored
 * values never drift, so the tests assert the exact code set and reject anything outside it. If a
 * future edit adds a "helpful" synonym or renames a code, this fails — which is the whole point
 * (§12: implementations must not introduce local synonyms as new stored values).
 *
 * Run: part of `npm test`.
 */
import assert from 'node:assert/strict'

import {
    OBSERVATION_CODES,
    OBSERVATION_GROUPS,
    OBSERVATION_LABELS,
    SESSION_STAGES,
    SESSION_STAGE_LABELS,
    parseObservationCode,
    parseSessionStage,
} from './observation-vocabulary'

/** The exact nine codes from RC1.2 §12, verbatim. */
function testObservationCodeSetIsExactlyTheSpec(): void {
    assert.deepEqual(
        [...OBSERVATION_CODES].sort(),
        [
            'ACTIVITY_PREDICTABLE',
            'CHALLENGE_TOO_HIGH',
            'CHALLENGE_TOO_LOW',
            'INTENDED_PROBLEM_NOT_EMERGING',
            'ONE_TEAM_DOMINATING',
            'PARTICIPATION_DECLINING',
            'PLAYERS_CONFUSED',
            'PLAYERS_WAITING',
            'VARIED_SOLUTIONS_EMERGING',
        ],
        'Observation codes must match Runtime Interface RC1.2 §12 exactly.'
    )
}

function testSessionStageSetIsExactlyTheSpec(): void {
    assert.deepEqual([...SESSION_STAGES], ['JUST_STARTED', 'SETTLING_IN', 'ESTABLISHED'])
}

/** Every code needs coach-facing wording, or the UI silently renders a raw enum at a coach. */
function testEveryCodeHasALabel(): void {
    for (const code of OBSERVATION_CODES) {
        const label = OBSERVATION_LABELS[code]
        assert.ok(label && label.trim().length > 0, `${code} has no coach-facing label.`)
        assert.notEqual(label, code, `${code} label is still the raw code.`)
    }
    for (const stage of SESSION_STAGES) {
        assert.ok(SESSION_STAGE_LABELS[stage]?.trim(), `${stage} has no label.`)
    }
}

/**
 * Labels are what the coach reads, so they must not carry internal ontology. This is the same
 * never-display contract the generated activity text is held to.
 */
function testLabelsUseNoInternalVocabulary(): void {
    const banned = /\baffordance|\bgame problem\b|\bconstraint\b|\brepresentative\b|\bontology\b|\benvironmental manipulation\b/i
    for (const code of OBSERVATION_CODES) {
        assert.ok(!banned.test(OBSERVATION_LABELS[code]), `Label for ${code} leaks internal vocabulary.`)
    }
}

/** Presentation grouping must cover every code exactly once — no orphans, no duplicates. */
function testGroupsCoverEveryCodeExactlyOnce(): void {
    const grouped = OBSERVATION_GROUPS.flatMap((g) => g.codes)
    assert.equal(grouped.length, OBSERVATION_CODES.length, 'Grouping count differs from the code set.')
    assert.deepEqual([...grouped].sort(), [...OBSERVATION_CODES].sort(), 'Grouping must cover every code once.')
}

/** §52 — unknown values are rejected, never coerced. §12 — no local synonyms. */
function testParsingRejectsNonCanonicalValues(): void {
    for (const code of OBSERVATION_CODES) {
        assert.equal(parseObservationCode(code), code)
    }
    const rejected = [
        'challenge_too_low', // wrong case
        'CHALLENGE TOO LOW', // display-style
        'Too easy for them', // a label, not a code
        'PLAYERS_BORED', // a plausible-looking synonym
        '',
        null,
        undefined,
        42,
        {},
    ]
    for (const value of rejected) {
        assert.equal(parseObservationCode(value), null, `Non-canonical value accepted: ${String(value)}`)
    }
}

function testSessionStageParsing(): void {
    for (const stage of SESSION_STAGES) {
        assert.equal(parseSessionStage(stage), stage)
    }
    for (const value of ['just_started', 'Just started', 'WARMED_UP', null, 7]) {
        assert.equal(parseSessionStage(value), null, `Non-canonical stage accepted: ${String(value)}`)
    }
}

/**
 * The representative observation must be present and must NOT be grouped with the experiential ones.
 * It routes to a different subsystem (Coach Intelligence §28), so presenting it as just another
 * friction would invite coaches to read it as one.
 */
function testRepresentativeObservationIsSeparated(): void {
    const group = OBSERVATION_GROUPS.find((g) => g.codes.includes('INTENDED_PROBLEM_NOT_EMERGING'))
    assert.ok(group, 'INTENDED_PROBLEM_NOT_EMERGING must be grouped.')
    assert.deepEqual(group.codes, ['INTENDED_PROBLEM_NOT_EMERGING'], 'It must not share a group with experiential codes.')
}

function runAll(): void {
    testObservationCodeSetIsExactlyTheSpec()
    testSessionStageSetIsExactlyTheSpec()
    testEveryCodeHasALabel()
    testLabelsUseNoInternalVocabulary()
    testGroupsCoverEveryCodeExactlyOnce()
    testParsingRejectsNonCanonicalValues()
    testSessionStageParsing()
    testRepresentativeObservationIsSeparated()
    console.log('observation-vocabulary unit tests: all cases passed.')
}

runAll()
