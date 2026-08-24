/**
 * Fixtures are the REAL authored rows from the Soccer Module, so this measures what coaches would
 * actually read rather than what I imagined the workbook contains.
 */
import assert from 'node:assert/strict'

import { conditionPhrase, expressIncentive, isGenericPointTemplate } from './incentive-expression'

/** Verbatim from soccer-module.rc1-v3: mechanism, designIntent, description. */
const AUTHORED = [
    { mechanism: 'scoring_bonus', designIntent: 'Switch play', description: 'Reward switching play across the field' },
    { mechanism: 'scoring_bonus', designIntent: 'Penetrate into final third', description: 'Reward advancement into attacking areas through successful progression' },
    { mechanism: 'defensive_reward', designIntent: 'Win the ball back', description: 'Reward defensive interceptions' },
    { mechanism: 'defensive_reward', designIntent: 'Slow attacking progression', description: 'Reward slowing attacking progression' },
    { mechanism: 'time_window_reward', designIntent: 'Exploit transitions', description: 'Reward quick attacking actions after regain' },
    { mechanism: 'value_multiplier', designIntent: 'Final third entry', description: 'Increase scoring value in final third' },
    { mechanism: 'positional_or_scoring_advantage', designIntent: 'Use wide areas', description: 'Provide scoring or positional advantage in wide areas' },
]

function testEveryAuthoredMechanismProducesSomething(): void {
    for (const row of AUTHORED) {
        const line = expressIncentive(row.mechanism, row)
        assert.ok(line, `${row.mechanism} produced nothing — this is the defect: four of five mechanisms were ignored`)
        assert.ok(line!.length > 20, `${row.mechanism} produced a stub: "${line}"`)
        assert.ok(
            !isGenericPointTemplate(line!),
            `${row.mechanism} fell back to the generic template it exists to replace: "${line}"`
        )
    }
}

/** The actual complaint: three activities that reward the same behaviour identically. */
function testMechanismsReadDifferentlyFromEachOther(): void {
    const shared = { designIntent: 'Switch play', description: 'Reward switching play across the field' }
    const lines = (['scoring_bonus', 'value_multiplier', 'time_window_reward', 'defensive_reward', 'positional_or_scoring_advantage'] as const).map(
        (m) => expressIncentive(m, shared)
    )

    assert.equal(new Set(lines).size, lines.length, `mechanisms must not collapse into one another:\n${lines.join('\n')}`)

    // And they must differ structurally, not merely by a synonym.
    const [bonus, multiplier, window, defensive, advantage] = lines as string[]
    assert.match(bonus, /^Earn an extra point for /i)
    assert.match(multiplier, /are worth double/i)
    assert.match(window, /only inside a short window/i)
    assert.match(defensive, /^The defending team earns a point for /i)
    assert.match(advantage, /^Earn a live advantage instead of a point for /i)
}

/**
 * Christian's test, 24 Aug: reading the scoring section, a coach must be able to answer "what
 * exactly am I rewarding?" without interpreting how the engine thinks. Every line must therefore
 * lead with what is EARNED and name the condition plainly.
 */
function testEveryLineAnswersWhatAmIRewarding(): void {
    for (const row of AUTHORED) {
        const line = expressIncentive(row.mechanism, row)
        if (!line) continue
        assert.match(
            line,
            /^(Earn an extra point for|Earn a live advantage instead of a point for|The defending team earns a point for|Scores from)/,
            `line does not open with what the players earn: "${line}"`
        )
        // Engine vocabulary a coach should never have to decode.
        assert.ok(
            !/\b(mechanism|design intent|constraint|affordance|must shape|lane access)\b/i.test(line),
            `engine vocabulary reached the coach: "${line}"`
        )
    }
}

/** A clause cannot follow "for"; silence beats a sentence written from the engine's point of view. */
function testClauseShapedKnowledgeProducesSilenceNotGibberish(): void {
    const line = expressIncentive('scoring_bonus', {
        designIntent: 'Support lane requirement creates a visible spatial game problem',
        description: 'A penetrating pass or forward run into a scoring area counts only when a supporting player has occupied the required lane',
    })
    assert.equal(line, null, `expected silence, got: "${line}"`)
}

function testSilenceWhenNothingIsAuthored(): void {
    // 9 of 23 realizations carry mechanism 'none'. They must contribute nothing — a placeholder is
    // what "Additional point awarded when condition is met" was.
    assert.equal(expressIncentive('none', { designIntent: 'Switch play' }), null)
    assert.equal(expressIncentive(undefined, { designIntent: 'Switch play' }), null)
    // An unknown mechanism is knowledge we do not understand; guessing would teach the wrong game.
    assert.equal(expressIncentive('teleport_reward', { designIntent: 'Switch play' }), null)
    // No authored words to build from.
    assert.equal(expressIncentive('scoring_bonus', {}), null)
}

function testAuthoredPatternsWinOutright(): void {
    const line = expressIncentive('scoring_bonus', {
        designIntent: 'Switch play',
        description: 'Reward switching play across the field',
        incentivePatterns: ['A switch that reaches the far channel unlocks a second target goal'],
    })
    assert.equal(line, 'A switch that reaches the far channel unlocks a second target goal.')
}

function testLongProseIsCutAtAClauseAndRejectedIfItStillReadsAsOne(): void {
    // The counter-press constraint's design intent is a paragraph. Cutting at the clause boundary
    // leaves "live counter-press window creates a contested advantage on every possession change",
    // which is a STATEMENT, and no statement can complete "Earn an extra point for …". Silence is
    // the right answer: this is exactly what the incentive_patterns column is for.
    const prose =
        'Live counter-press window creates a contested advantage on every possession change; the team losing the ball decides whether to commit to the press or recover shape'
    assert.equal(conditionPhrase({ description: prose }), null, 'a clause must be refused, not reworded')

    // Long prose that reduces to a usable phrase is still cut at the clause boundary and kept.
    const usable = conditionPhrase({
        description: 'Reward switching play across the field before the defence can shift across to cover the far side',
    })
    assert.ok(usable, 'long but phrase-shaped knowledge must still produce a condition')
    assert.ok(!usable!.includes(';'), 'cut at the clause boundary')
    assert.ok(usable!.length <= 90, `phrase too long to read mid-sentence: ${usable!.length}`)
}

function testGenericTemplateIsRecognizable(): void {
    assert.ok(isGenericPointTemplate('A point or live advantage counts when the team progresses possession toward the target.'))
    assert.ok(!isGenericPointTemplate('Earn an extra point for switching play across the field.'))
}

testEveryAuthoredMechanismProducesSomething()
testMechanismsReadDifferentlyFromEachOther()
testEveryLineAnswersWhatAmIRewarding()
testClauseShapedKnowledgeProducesSilenceNotGibberish()
testSilenceWhenNothingIsAuthored()
testAuthoredPatternsWinOutright()
testLongProseIsCutAtAClauseAndRejectedIfItStillReadsAsOne()
testGenericTemplateIsRecognizable()

console.log('incentive-expression unit tests: all cases passed.')
