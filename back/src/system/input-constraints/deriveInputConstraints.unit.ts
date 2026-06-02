/**
 * Parser coverage tests for deriveInputConstraints.
 *
 * Field-test readiness (Christian's report): natural coaching language must not be
 * hard-rejected with "No supported soccer training signals". These cases lock in the
 * Overload (Group G), Transition (Group H), and general soccer fallback (Group Z)
 * coverage, and confirm genuinely off-topic input still rejects.
 *
 * Run: npm test
 */
import assert from 'node:assert/strict'

import { deriveInputConstraints } from './deriveInputConstraints'

function accepts(input: string): boolean {
    const r = deriveInputConstraints(input)
    return r.matchedSignals.length > 0 && r.candidateArchetypeIds.length > 0
}

// Natural coaching language that previously hard-rejected — must now ACCEPT.
const MUST_ACCEPT = [
    'Creating attacking numerical advantage off transition from defense to offense',
    'Creating overloads on attack',
    'Creating attacking advantage off transition',
    'counter attack quickly',
    '3v2 in the final third',
    'help players defend better',
    'create an overload',
    'transition to offense',
    'play out of the back',
    'keep possession',
]

// Off-topic input with no soccer vocabulary — must still REJECT (the fallback must not
// be so broad it accepts anything).
const MUST_REJECT = ['make a sandwich', 'paint the fence', '']

function testMustAccept(): void {
    for (const input of MUST_ACCEPT) {
        assert.ok(accepts(input), `Expected ACCEPT (natural coaching language): ${JSON.stringify(input)}`)
    }
}

function testMustReject(): void {
    for (const input of MUST_REJECT) {
        assert.ok(!accepts(input), `Expected REJECT (off-topic): ${JSON.stringify(input)}`)
    }
}

function testOverloadAndTransitionSignalsFire(): void {
    assert.ok(
        deriveInputConstraints('create an overload').matchedSignals.includes('signalGroup:G_overload'),
        'overload input should fire G_overload'
    )
    assert.ok(
        deriveInputConstraints('counter attack').matchedSignals.includes('signalGroup:H_transition'),
        'counter-attack input should fire H_transition'
    )
}

function runAll(): void {
    testMustAccept()
    testMustReject()
    testOverloadAndTransitionSignalsFire()
    console.log('deriveInputConstraints unit tests: all cases passed.')
}

runAll()
