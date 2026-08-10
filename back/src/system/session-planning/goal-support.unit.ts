/**
 * Unit tests — measured goal support.
 *
 * The value of this module is that it MEASURES what the engine can serve instead of declaring it,
 * so the tests check the measurement is real rather than pinning a list. Pinning the exact supported
 * goals would defeat the point: the whole design is that improving vocabulary changes the answer
 * without anyone editing code, and a test asserting today's list would just have to be edited too.
 *
 * What IS pinned: the two known gaps. Those are findings, and if either starts routing that is a
 * meaningful change someone should notice deliberately rather than absorb silently.
 *
 * Run: part of `npm test`.
 */
import assert from 'node:assert/strict'

import { describeUnsupportedGoal, goalSupport, isKnownUnsupportedGoal } from './goal-support'
import { sessionPlanningModel } from './session-planning-model'

/** Every Learning Goal must be classified — a goal in neither list would be invisible. */
function testEveryGoalIsClassified(): void {
    const { supported, unsupported } = goalSupport()
    assert.equal(
        supported.length + unsupported.length,
        sessionPlanningModel.learningGoals().length,
        'Every Learning Goal must be either supported or unsupported; none may be unclassified.'
    )
    assert.ok(supported.length > 0, 'No Learning Goal routes at all — the parser or the model is broken.')

    const overlap = supported.filter((name) => unsupported.includes(name))
    assert.deepEqual(overlap, [], 'A goal cannot be both supported and unsupported.')
}

/**
 * THE TWO KNOWN GAPS. Pinned because they are findings, not because they should stay true — the
 * intent is to close them. When one starts routing, this test fails and the change gets noticed.
 */
function testKnownGapsArePinned(): void {
    assert.deepEqual(
        goalSupport().unsupported,
        ['Play Out from the Back', 'Beat Defenders 1v1'],
        'The known unsupported goals changed. If one now routes, that is progress — update this test ' +
            'deliberately. If a new one appeared, something regressed.'
    )
}

/** A known gap must be recognisable from the goal text a coach actually submits. */
function testKnownGapDetection(): void {
    assert.ok(isKnownUnsupportedGoal('Play Out from the Back'), 'The exact goal name must be recognised.')
    assert.ok(
        isKnownUnsupportedGoal('Play Out from the Back. Against High Pressure'),
        'The planning flow appends the practice situation, so the goal must still be recognised inside it.'
    )
    assert.ok(!isKnownUnsupportedGoal('keep possession under pressure'), 'A supported goal must not be flagged.')
    assert.ok(!isKnownUnsupportedGoal(''), 'Empty text must not be flagged.')
}

/**
 * The two messages must actually differ. A known gap is our problem and an unrecognised phrase is
 * fixable by rephrasing — telling a coach the wrong one of those wastes their time.
 */
function testMessagesDistinguishTheTwoCases(): void {
    const gap = describeUnsupportedGoal('Play Out from the Back')
    const unknown = describeUnsupportedGoal('asdfgh qwerty')

    assert.notEqual(gap.error, unknown.error, 'A known gap and an unrecognised phrase must not read identically.')
    assert.ok(/yet|gap/i.test(gap.error), `A known gap should own the limitation. Got: ${gap.error}`)

    for (const response of [gap, unknown]) {
        assert.ok(response.suggestions.length > 0, 'A refusal must always offer somewhere to go.')
        assert.ok(response.suggestions.length <= 5, 'A wall of options is its own kind of unhelpful.')
    }
}

/**
 * Suggestions must be things that actually work. Offering a coach a goal that then fails is worse
 * than offering nothing, and this is exactly the drift a hardcoded list would develop.
 */
function testSuggestionsAreGenuinelySupported(): void {
    const { supported } = goalSupport()
    for (const suggestion of describeUnsupportedGoal('asdfgh').suggestions) {
        assert.ok(
            supported.includes(suggestion),
            `Suggested "${suggestion}" is not in the measured supported set — a coach would hit a dead end.`
        )
    }
}

function runAll(): void {
    testEveryGoalIsClassified()
    testKnownGapsArePinned()
    testKnownGapDetection()
    testMessagesDistinguishTheTwoCases()
    testSuggestionsAreGenuinelySupported()
    console.log('goal-support unit tests: all cases passed.')
}

runAll()
