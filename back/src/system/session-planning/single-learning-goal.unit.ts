/**
 * Unit tests — one primary learning intention per generation.
 *
 * The false-positive cases matter more than the true positives here. Interrupting a coach who wrote
 * one goal containing the word "and" is a worse failure than quietly blending two, because it makes
 * the product argue with someone who did nothing wrong — so most of these tests assert SILENCE.
 */
import assert from 'node:assert/strict'

import {
    buildMultipleIntentionGuidance,
    needsIntentionChoice,
    splitCoachingIntentions,
} from './single-learning-goal'

/** One intention stays one, however it is phrased. This is the common path and it must be silent. */
function testSingleIntentionsAreNotSplit(): void {
    const singles = [
        'Help players break defensive lines.',
        'Support angles and depth under pressure.',
        'We want players to create better support angles under pressure, especially in wide areas.',
        'Players keep winning the ball but turning away from field vision.',
        'Build out from the back and keep possession',
        'Improve first touch, awareness, and scanning',
    ]

    for (const goal of singles) {
        assert.equal(splitCoachingIntentions([goal]).length, 1, `split a single intention: "${goal}"`)
        assert.equal(needsIntentionChoice([goal]), false, `asked to choose for: "${goal}"`)
    }
}

/** Separate entries are separate intentions — the coach used separate boxes. */
function testSeparateEntriesAreSeparateIntentions(): void {
    const goals = ['Help players break defensive lines.', 'Press higher after losing the ball.']

    assert.deepEqual(splitCoachingIntentions(goals), goals)
    assert.equal(needsIntentionChoice(goals), true)
}

/** Deliberate list separators inside one box. */
function testDeliberateListSeparatorsSplit(): void {
    const cases: Array<[string, number]> = [
        ['Break defensive lines\nPress after losing the ball', 2],
        ['Break defensive lines; press after losing the ball', 2],
        ['Break defensive lines | press after losing the ball', 2],
        ['Break defensive lines and also press after losing it', 2],
        ['Break defensive lines as well as pressing after losing it', 2],
        ['- Break defensive lines\n- Press after losing the ball\n- Keep the ball under pressure', 3],
        ['1. Break defensive lines\n2) Press after losing the ball', 2],
    ]

    for (const [goal, expected] of cases) {
        assert.equal(splitCoachingIntentions([goal]).length, expected, `wrong split for: "${goal}"`)
    }
}

/** List markers come off, so the coach sees their intention rather than their formatting. */
function testListMarkersAreStripped(): void {
    const found = splitCoachingIntentions(['- Break defensive lines\n- Press after losing the ball'])

    assert.deepEqual(found, ['Break defensive lines', 'Press after losing the ball'])
}

/** The same intention twice is one choice, not two identical buttons. */
function testDuplicatesCollapse(): void {
    assert.deepEqual(splitCoachingIntentions(['Break lines', 'break lines']), ['Break lines'])
    assert.equal(needsIntentionChoice(['Break lines', 'break lines']), false)
}

/** Punctuation noise from a split is not an option to choose. */
function testFragmentsAreDropped(): void {
    assert.deepEqual(splitCoachingIntentions(['Break defensive lines;;']), ['Break defensive lines'])
    assert.equal(needsIntentionChoice(['Break defensive lines;']), false)
}

/** Empty and malformed input never asks the coach anything. */
function testEmptyInputAsksNothing(): void {
    assert.deepEqual(splitCoachingIntentions([]), [])
    assert.equal(needsIntentionChoice([]), false)
    assert.equal(needsIntentionChoice(['']), false)
    assert.equal(needsIntentionChoice([undefined as unknown as string]), false)
}

/** The guidance offers the coach's own words back as the options. */
function testGuidanceOffersTheCoachTheirOwnWords(): void {
    const intentions = ['Break defensive lines', 'Press after losing the ball']
    const guidance = buildMultipleIntentionGuidance(intentions)

    assert.deepEqual(guidance.intentions, intentions)
    assert.ok(guidance.message.length > 0)
    // Coach Communication Standard: no internal vocabulary in coach-facing copy.
    for (const jargon of ['signal', 'parser', 'archetype', 'constraint', 'affordance', 'representative']) {
        assert.ok(!guidance.message.toLowerCase().includes(jargon), `guidance leaks "${jargon}"`)
    }
}

testSingleIntentionsAreNotSplit()
testSeparateEntriesAreSeparateIntentions()
testDeliberateListSeparatorsSplit()
testListMarkersAreStripped()
testDuplicatesCollapse()
testFragmentsAreDropped()
testEmptyInputAsksNothing()
testGuidanceOffersTheCoachTheirOwnWords()

console.log('single-learning-goal unit tests: all cases passed.')
