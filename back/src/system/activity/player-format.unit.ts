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

/**
 * REGRESSION — real generation, 2026-09-08, 12-player squad. The setup read "Two teams of 5 players
 * each. … Teams play 6v6." A per-team count was invisible to the scoreline parser, so the text
 * counted as stating no format and a correct one was appended next to the wrong one. The coach is
 * left holding two different squads in one paragraph with no way to tell which the activity assumes.
 */
function testPerTeamCountIsCorrectedRatherThanContradicted(): void {
    const out = reconcilePlayerFormat(
        'Play on a 40x30 yard field with a central corridor. Two teams of 5 players each. Players start in their own half.',
        12,
        'Transition Games'
    )

    assert.equal(parseStatedPlayerTotal(out.text), 12, `wrong squad after correction: "${out.text}"`)
    assert.ok(!/\bTeams play\b/i.test(out.text), `appended a second format: "${out.text}"`)
    assert.ok(!/\b5 players\b/.test(out.text), `left the wrong count standing: "${out.text}"`)
    assert.ok(out.text.includes('Two teams of 6 players each'), `mangled the sentence: "${out.text}"`)
    assert.ok(out.text.includes('40x30 yard field'), `lost the field description: "${out.text}"`)
}

/** A per-team count that already matches the squad must be left completely alone. */
function testCorrectPerTeamCountIsNotTouched(): void {
    const text = 'Two teams of 6 players each attack opposite end zones.'
    const out = reconcilePlayerFormat(text, 12, 'End Zone Games')
    assert.equal(out.text, text, `rewrote already-correct text: "${out.text}"`)
    assert.equal(out.corrected, false)
}

/** An overload cannot say "each" — that would name four teams. */
function testUnevenSidesDropTheEach(): void {
    const out = reconcilePlayerFormat('Two teams of 5 players each.', 12, 'Overload Games')
    assert.equal(parseStatedPlayerTotal(out.text), 12, `wrong squad: "${out.text}"`)
    assert.ok(!/\beach\b/i.test(out.text), `"each" survived uneven sides: "${out.text}"`)
}

/**
 * REGRESSION — real generation, 2026-09-08, 12-player squad. "with two neutrals" was invisible to a
 * pattern that required "neutral player(s)", so fourteen players parsed as twelve and passed.
 */
function testNeutralsAsANounAreCounted(): void {
    const real =
        'Play 6v6 with two neutrals in a 40x30 yard area. A central corridor divides the field into two halves. Neutrals start in the central corridor and play for the team in possession.'

    assert.equal(parseStatedPlayerTotal(real), 14, 'the noun form was not counted')

    const out = reconcilePlayerFormat(real, 12, 'Directional Possession Games')
    assert.equal(out.corrected, true)
    assert.equal(parseStatedPlayerTotal(out.text), 12, `still the wrong squad: "${out.text}"`)
    assert.ok(!/\bneutrals?\b/i.test(out.text), `phantom neutrals survived: "${out.text}"`)
    // The trailing phrase was the playing area, not where the neutrals stood.
    assert.ok(out.text.includes('40x30 yard area'), `lost the playing area: "${out.text}"`)
    assert.ok(out.text.includes('A central corridor divides the field'), `lost the layout: "${out.text}"`)
}

/**
 * The count already spends the whole squad, so neutrals mentioned elsewhere are players the coach
 * does not have. Real shape: "Play 6v6. … Neutrals start in the wide channels."
 */
function testUncountedNeutralsAreRemovedWhenTheSquadIsAlreadySpent(): void {
    const out = reconcilePlayerFormat(
        'Play 6v6 with a central corridor. Players start in their respective halves, with neutrals positioned in the wide channels. Neutrals start in the wide channels and can move freely.',
        12,
        'Channel Games'
    )

    assert.equal(out.corrected, true)
    assert.ok(!/\bneutrals?\b/i.test(out.text), `phantom neutrals survived: "${out.text}"`)
    assert.ok(out.text.includes('Players start in their respective halves'), `took the sentence with the clause: "${out.text}"`)
}

/** Counted neutrals are real structure and must be left exactly alone. */
function testCountedNeutralsAreKept(): void {
    const text = 'Play 5v5 with two neutrals in the wide channels. Neutrals play for the team in possession.'
    const out = reconcilePlayerFormat(text, 12, 'Channel Games')

    assert.equal(parseStatedPlayerTotal(text), 12)
    assert.equal(out.text, text)
    assert.equal(out.corrected, false)
}

/** REGRESSION — real Setup, 2026-09-10, 12 players: two formats in one sentence, count still 12. */
function testTeamSizeContradictingTheScorelineIsRemoved(): void {
    const out = reconcilePlayerFormat(
        'Set up a 40x30 yard field with two end zones. Play 6v6, with the team of 7 defending. Play starts with a pass from the defending team.',
        12,
        'Transition Games'
    )

    assert.ok(!/team of 7/i.test(out.text), `contradiction survived: "${out.text}"`)
    assert.ok(out.text.includes('Play 6v6.'), `mangled the format sentence: "${out.text}"`)
    assert.ok(out.text.includes('Play starts with a pass from the defending team.'), `lost the restart: "${out.text}"`)
    assert.equal(out.corrected, true)
}

/** A team size that IS one side of the stated format is the format, said twice. Leave it. */
function testTeamSizeMatchingTheScorelineIsKept(): void {
    const text = 'Play 7v5, with the team of 7 defending.'
    assert.equal(reconcilePlayerFormat(text, 12, 'Overload Games').text, text)
}

/** REGRESSION — real Setup, 2026-09-10: "teams of 6" without the word "players" was not counted. */
function testPerTeamCountWithoutTheWordPlayers(): void {
    const text =
        'Play with two teams of 6 in a 40x30 yard area. Create a central zone with a 2-player overload for the defending team. Teams start in their defensive half.'

    assert.equal(parseStatedPlayerTotal(text), 12)
    const out = reconcilePlayerFormat(text, 12, 'Transition Games')
    assert.ok(!/Teams play \d+v\d+/.test(out.text), `appended a second format: "${out.text}"`)
    assert.ok(out.text.includes('two teams of 6'), `rewrote a correct count: "${out.text}"`)
}

/** REGRESSION — real Setup, 2026-09-10: "Play 6v6 … One team has an extra player" is thirteen. */
function testExtraPlayerAsTheVerbIsCounted(): void {
    const text =
        'Play 6v6 with two end zones on a 40x30 yard field. One team has an extra player in their attacking end zone. Play begins with a pass from the defending end zone.'

    assert.equal(parseStatedPlayerTotal(text), 13, 'the "has an extra player" form was not counted')
    const out = reconcilePlayerFormat(text, 12, 'Directional Possession Games')
    assert.equal(parseStatedPlayerTotal(out.text), 12, `wrong squad after correction: "${out.text}"`)
    assert.ok(!/extra player/i.test(out.text), `phantom player survived: "${out.text}"`)
    assert.ok(!/\bOne team\.\s/.test(`${out.text} `), `left a fragment behind: "${out.text}"`)
    assert.ok(out.text.includes('Play begins with a pass from the defending end zone.'), `lost the restart: "${out.text}"`)
}

testFormatsAlwaysSpendTheWholeSquad()
testOverloadMovesAPlayerRatherThanAddingOne()
testPerTeamCountWithoutTheWordPlayers()
testExtraPlayerAsTheVerbIsCounted()
testTeamSizeContradictingTheScorelineIsRemoved()
testTeamSizeMatchingTheScorelineIsKept()
testNeutralsAsANounAreCounted()
testUncountedNeutralsAreRemovedWhenTheSquadIsAlreadySpent()
testCountedNeutralsAreKept()
testPerTeamCountIsCorrectedRatherThanContradicted()
testCorrectPerTeamCountIsNotTouched()
testUnevenSidesDropTheEach()
testParsesWhatTheTextActuallyAsksFor()
testCorrectsTheRealFailureJoeReported()
testCorrectsExtraPlayersUnderAnyName()
testLeavesCorrectAndUnparseableTextAlone()
testEveryRouteEndsWithAUsableFormat()

console.log('player-format unit tests: all cases passed.')
