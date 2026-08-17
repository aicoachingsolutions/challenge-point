/**
 * Pins the arithmetic that four prompt revisions could not hold. No AI required — which is the
 * point: the defect that reached a coach ("12 players, play 7v7 with a neutral in each channel")
 * was pure arithmetic, and arithmetic is exactly what a unit test is for.
 */
import assert from 'node:assert/strict'

import { choosePlayerFormat, parseStatedPlayerTotal, reconcilePlayerFormat } from './player-format'

function testFormatsAlwaysSpendTheWholeSquad(): void {
    for (let total = 6; total <= 24; total++) {
        for (const archetype of ['End Zone Games', 'Overload Games', 'Directional Possession Games']) {
            const f = choosePlayerFormat(total, archetype)
            assert.equal(
                f.perSide[0] + f.perSide[1] + f.neutrals,
                total,
                `${archetype} with ${total} players produced ${f.label}, which is not ${total} players`
            )
            assert.ok(f.perSide[1] >= 2, `${archetype} with ${total} left a side of ${f.perSide[1]}`)
        }
    }
}

function testOverloadMovesAPlayerRatherThanAddingOne(): void {
    const f = choosePlayerFormat(12, 'Overload Games')
    assert.equal(f.perSide[0] + f.perSide[1], 12, 'overload must still total the squad')
    assert.notEqual(f.perSide[0], f.perSide[1], 'an overload game needs uneven sides')
}

function testParsesWhatTheTextActuallyAsksFor(): void {
    assert.equal(parseStatedPlayerTotal('Teams play 6v6 in a central corridor.'), 12)
    // 7+7 plus one neutral in EACH of two channels = 16, which is what the coach was actually asked for.
    assert.equal(parseStatedPlayerTotal('Teams play 7v7 with a neutral player in each wide channel.'), 16)
    assert.equal(parseStatedPlayerTotal('Play 5v5 with two neutral players.'), 12)
    assert.equal(parseStatedPlayerTotal('Each team has equal numbers.'), null)

    // Extra players arrive under many names, and "in each" doubles them. Both learned from real
    // generations that slipped past narrower patterns.
    assert.equal(parseStatedPlayerTotal('Teams play 6v6 with one additional player in each wide zone.'), 14)
    assert.equal(parseStatedPlayerTotal('Play 6v6 with an extra player for the attacking team.'), 13)
    assert.equal(parseStatedPlayerTotal('Play 5v5 with two floating players.'), 12)
}

function testCorrectsExtraPlayersUnderAnyName(): void {
    const before = 'Teams play 6v6 with one additional player in each wide zone. Scoring is weighted.'
    const result = reconcilePlayerFormat(before, 12, 'End Zone Games')

    assert.equal(result.statedTotal, 14)
    assert.equal(result.corrected, true)
    assert.equal(parseStatedPlayerTotal(result.text), 12, `still not 12: "${result.text}"`)
    assert.ok(result.text.includes('Scoring is weighted.'), 'surrounding prose must survive')
}

function testCorrectsTheRealFailureJoeReported(): void {
    // The exact sentence a coach with 12 players was shown.
    const before = 'Teams play 7v7 with a neutral player in each wide channel. The game starts from the corridor.'
    const result = reconcilePlayerFormat(before, 12, 'End Zone Games')

    assert.equal(result.corrected, true)
    assert.equal(result.statedTotal, 16)
    assert.equal(parseStatedPlayerTotal(result.text), 12, `still not 12 players: "${result.text}"`)
    assert.ok(!/neutral/i.test(result.text), 'the neutral clause must go when the format has no neutrals')
    assert.ok(result.text.includes('The game starts from the corridor.'), 'surrounding prose must survive')
}

function testLeavesCorrectAndUnparseableTextAlone(): void {
    const right = 'Teams play 6v6 with end zones at each end.'
    assert.equal(reconcilePlayerFormat(right, 12, 'End Zone Games').text, right)
    assert.equal(reconcilePlayerFormat(right, 12, 'End Zone Games').corrected, false)

    // No stated format: the format is APPENDED rather than left vague. "Teams play with equal
    // numbers" is not wrong, but a coach on a field cannot act on it — and it is what the model
    // produces as soon as the prompt discourages wrong formats firmly enough.
    const vague = 'Each team has equal numbers.'
    const out = reconcilePlayerFormat(vague, 12, 'End Zone Games')
    assert.equal(parseStatedPlayerTotal(out.text), 12, `no usable format supplied: "${out.text}"`)
    assert.ok(out.text.startsWith(vague), 'the original prose must survive intact')
}

/** Whatever the model wrote, a coach always ends up with a format that fits their squad. */
function testEveryRouteEndsWithAUsableFormat(): void {
    const inputs = [
        'Teams play 7v7 with a neutral player in each wide channel.',
        'Teams play 6v6 with one additional player in each wide zone.',
        'Teams play with equal numbers, focusing on the central corridor.',
        'Teams play 6v6.',
        'Designate zones with numerical overloads for the attacking team.',
    ]
    for (const total of [10, 12, 14, 16]) {
        for (const input of inputs) {
            const out = reconcilePlayerFormat(input, total, 'End Zone Games')
            assert.equal(
                parseStatedPlayerTotal(out.text),
                total,
                `"${input}" with ${total} players produced "${out.text}"`
            )
        }
    }
}

testFormatsAlwaysSpendTheWholeSquad()
testOverloadMovesAPlayerRatherThanAddingOne()
testParsesWhatTheTextActuallyAsksFor()
testCorrectsTheRealFailureJoeReported()
testCorrectsExtraPlayersUnderAnyName()
testLeavesCorrectAndUnparseableTextAlone()
testEveryRouteEndsWithAUsableFormat()

console.log('player-format unit tests: all cases passed.')
