/**
 * Unit tests — the six sections a coach reads.
 *
 * Negative fixtures are real generated text from run-coach-view-audit.ts on 2026-09-08. Positive
 * fixtures for the Objective are Christian's own three examples from 2026-09-10, so the test is
 * pinned to his definition of a coaching intention rather than to mine.
 */
import assert from 'node:assert/strict'

import {
    deriveEquipment,
    describeWinCondition,
    gameFormObjective,
    intentionFromLearningGoal,
    isCoachingIntention,
    mergeHowToPlayIntoRules,
    removeScoringFromSetup,
    toCoachingObjective,
} from './coach-facing-sections'

// ------------------------------------------------------------------------------------ OBJECTIVE

/** Christian's examples of what an Objective should be. All must pass. */
function testChristiansExamplesAreCoachingIntentions(): void {
    for (const example of [
        'Build out from the back against high pressure.',
        'Create scoring chances before the defense reorganizes.',
        'Create and use space to play forward.',
    ]) {
        assert.ok(isCoachingIntention(example), `rejected Christian's own example: "${example}"`)
    }
}

/** Real generated Objectives he rejected. None may pass. */
function testExplanationsAreNotCoachingIntentions(): void {
    for (const rejected of [
        'Success depends on recognizing and exploiting space, especially in wide channels.',
        'The focus is on recognizing and using space effectively to break lines.',
        'Recognizing when a channel is open due to defensive shifts is crucial for successful attacks.',
        'The challenge is to read the transition moment and decide whether to press immediately or delay to regain shape.',
        'The objective is to recognize and use open channels effectively to create scoring opportunities.',
    ]) {
        assert.ok(!isCoachingIntention(rejected), `accepted an explanation: "${rejected}"`)
    }
}

/** The first sentence is often a good intention and the second an explanation. Keep the first. */
function testGeneratedIntentionIsKeptAndItsExplanationDropped(): void {
    const out = toCoachingObjective(
        "Exploit wide channels to progress the ball toward the opponent's goal. The objective is to recognize and use open channels effectively to create scoring opportunities.",
        '',
        'Help players recognize space behind the defense.'
    )

    assert.equal(out.source, 'generated')
    assert.equal(out.text, "Exploit wide channels to progress the ball toward the opponent's goal.")
}

/** Nothing generated passes: the coach's own goal is the answer to "what are we working on today?". */
function testLearningGoalIsTheFallback(): void {
    const out = toCoachingObjective(
        'Success depends on recognizing and exploiting space, especially in wide channels.',
        '',
        'Help players break defensive lines.'
    )

    assert.equal(out.source, 'learning-goal')
    assert.equal(out.text, 'Break defensive lines.')
}

/** The guided path composes "Goal. Situation. Note." — only the goal is the objective. */
function testGuidedGoalUsesOnlyTheGoalName(): void {
    assert.equal(
        intentionFromLearningGoal('Break Defensive Lines. Building attacks through midfield. We panic after winning possession.'),
        'Break defensive lines.'
    )
    assert.equal(intentionFromLearningGoal('Beat Defenders 1v1'), 'Beat defenders 1v1.')
}

/**
 * A goal written as a problem cannot honestly be restated as an intention without writing coaching
 * content. It is declined, and the next source is used.
 */
function testProblemDescriptionIsNotTurnedIntoAnIntention(): void {
    assert.equal(intentionFromLearningGoal('Players keep winning the ball but turning away from field vision.'), null)

    const out = toCoachingObjective(
        'The focus is on recognizing the turn.',
        'The focus is on recognizing the turn. Session focus: Maintain possession with forward intent.',
        'Players keep winning the ball but turning away from field vision.'
    )
    assert.equal(out.source, 'game-form')
    assert.equal(out.text, 'Maintain possession with forward intent.')
}

function testGameFormObjectiveIsExtractedFromTheSessionFocusLabel(): void {
    assert.equal(
        gameFormObjective('Players decide when to press. Session focus: Move ball into a target zone.'),
        'Move ball into a target zone.'
    )
    assert.equal(gameFormObjective('No label here.'), null)
}

/** The section must never come back empty. */
function testObjectiveIsNeverEmpty(): void {
    const out = toCoachingObjective('The focus is on recognizing space.', '', undefined)
    assert.ok(out.text.length > 0)
    assert.equal(out.source, 'fallback')
}

// ------------------------------------------------------------------------ HOW TO PLAY -> RULES

const SETUP_1 =
    "Play 6v6 in a 40 x 30 m (44 x 33 yd) area with a central corridor. Teams attack end zones located at each end of the field. Players start within their half, with possession starting from the defending team's end zone."
const RULES_1 = [
    'Play stays live as possession is secured and progressed toward the target under pressure. A forced ball or turnover flips the advantage to the opponent with no reset.',
    'The next action plays immediately after the ball changes hands, while the shape is still unsettled — no reset, no stoppage.',
]

/** Real activity, 2026-09-08. Each How to Play line goes to the section that owns what it says. */
function testHowToPlayMergesIntoRulesByOwnership(): void {
    const merged = mergeHowToPlayIntoRules(
        [
            'Start with a pass from the defending end zone.',
            'Maintain possession while progressing through the central corridor.',
            "Score by reaching the opponent's end zone.",
            'If the ball goes out, restart from the defending end zone.',
            'Switch roles after a score.',
        ],
        RULES_1,
        SETUP_1
    )

    // Setup already says how play begins; Scoring owns how points are earned.
    assert.ok(!merged.some((r) => /^Start with a pass/.test(r)), `kept a line Setup owns: ${JSON.stringify(merged)}`)
    assert.ok(!merged.some((r) => /^Score by/.test(r)), `kept a line Scoring owns: ${JSON.stringify(merged)}`)
    // Setup says nothing about restarts, so that line is new information and stays.
    assert.ok(merged.includes('If the ball goes out, restart from the defending end zone.'), JSON.stringify(merged))
    assert.ok(merged.includes('Switch roles after a score.'), JSON.stringify(merged))
    // Plain-language lines lead; the engine's rules follow, all of them, in order.
    assert.equal(merged[0], 'Maintain possession while progressing through the central corridor.')
    assert.deepEqual(merged.slice(-RULES_1.length), RULES_1)
}

/** "…to score in the small goals" is a scoring claim too, just not at the start of the line. */
function testMidSentenceScoringClaimDefersToScoring(): void {
    const merged = mergeHowToPlayIntoRules(['progress through the central corridor to score in the small goals.'], RULES_1, SETUP_1)
    assert.deepEqual(merged, RULES_1)
}

/** A line about neutral players, when Setup has none, describes players who are not there. */
function testNeutralLinesNeedNeutralsInSetup(): void {
    const line = 'Neutral players in channels assist in maintaining possession.'
    assert.deepEqual(mergeHowToPlayIntoRules([line], RULES_1, SETUP_1), RULES_1)
    assert.ok(mergeHowToPlayIntoRules([line], RULES_1, `${SETUP_1} Two neutrals play in the channels.`).includes(line))
}

/** A restatement of an existing rule adds nothing. */
function testRestatementOfARuleIsDropped(): void {
    const merged = mergeHowToPlayIntoRules(
        ['The next action plays immediately after the ball changes hands.'],
        RULES_1,
        SETUP_1
    )
    assert.deepEqual(merged, RULES_1)
}

/** A bonus-points line is a scoring claim wherever it appears. Real Rules line, 2026-09-10. */
function testBonusPointsLineDefersToScoring(): void {
    assert.deepEqual(mergeHowToPlayIntoRules(['Utilize wide channels for bonus points when scoring.'], RULES_1, SETUP_1), RULES_1)
}

/**
 * REGRESSION — real Setups, 2026-09-10, slot 3. Each stated a scoring method that disagreed with the
 * activity's own Scoring section. Setup keeps everything that organises the game.
 */
function testSetupNoLongerStatesHowTeamsScore(): void {
    const a = removeScoringFromSetup(
        "Set up a 40 x 30 m (44 x 33 yd) field with two 18 m (20 yd) end zones and wide channels. Play starts with a pass from the defending team. Score by completing a pass into the opponent's end zone, with bonus points for using the wide channels."
    )
    assert.ok(!/score by|bonus points/i.test(a), `scoring survived in Setup: "${a}"`)
    assert.ok(a.includes('two 18 m (20 yd) end zones'), `lost the layout: "${a}"`)
    assert.ok(a.includes('Play starts with a pass from the defending team'), `lost how play begins: "${a}"`)

    const b = removeScoringFromSetup(
        'Play 6v6 on a 40 x 30 m (44 x 33 yd) field with wide and central channels. Teams attack end zones. Scoring is weighted: extra points for goals scored from a channel entry.'
    )
    assert.ok(!/scoring is weighted|extra points/i.test(b), `scoring survived in Setup: "${b}"`)
    assert.ok(b.includes('Teams attack end zones'), `lost what teams attack: "${b}"`)
}

/** REGRESSION — real, 2026-09-10: "Scoring is weighted…" starts with "Scoring", not "Score". */
function testWeightedScoringIsAScoringClaim(): void {
    assert.deepEqual(
        mergeHowToPlayIntoRules(
            ['Scoring is weighted: central zone goals are worth more.', 'Scoring is weighted for successful overload use.'],
            RULES_1,
            SETUP_1
        ),
        RULES_1
    )

    // Mid-sentence in Setup: the layout half stays, the scoring clause goes.
    const setup = removeScoringFromSetup(
        'Play 7v5 on a 40 x 30 m (44 x 33 yd) field with three channels: two wide and one central. Teams attack end zones at each end. A numerical overload is created in the central channel, and scoring is weighted for successful use of overloads.'
    )
    assert.ok(!/scoring is weighted/i.test(setup), `scoring clause survived: "${setup}"`)
    assert.ok(setup.includes('A numerical overload is created in the central channel.'), `lost the layout half: "${setup}"`)
}

/** Once the phantom extra player leaves Setup, a Rules line built around it goes too. */
function testExtraPlayerLinesNeedAnExtraPlayerInSetup(): void {
    const line = 'Use the extra player in the attacking zone to create overloads.'
    assert.deepEqual(mergeHowToPlayIntoRules([line], RULES_1, SETUP_1), RULES_1)
    assert.ok(mergeHowToPlayIntoRules([line], RULES_1, `${SETUP_1} The attacking team has an extra player.`).includes(line))
}

/** What teams attack, and restarting after a goal, are Setup's business — not scoring methods. */
function testSetupKeepsWhatTeamsAttackAndRestarts(): void {
    const setup =
        'Play with two teams of 6 players each on a 40 x 30 m (44 x 33 yd) field. Each team attacks a goal at the opposite end. After a goal, the game restarts immediately with the conceding team in possession.'
    assert.equal(removeScoringFromSetup(setup), setup)
}

// ------------------------------------------------------------------------------ WIN CONDITION

const ENGINE_WIN =
    'Teams compete live under two-sided opposition, and the team with more points when play ends wins. The opponent inherits the advantage on every misread or forced action under pressure.'

/** The engine's condition never said when play ends. The coach told us. */
function testWinConditionSaysWhenItEnds(): void {
    assert.equal(describeWinCondition(ENGINE_WIN, 20), 'Play for 20 minutes. The team with more points at the end wins.')
    assert.equal(describeWinCondition(ENGINE_WIN, undefined), 'The team with more points when time is up wins.')
    assert.equal(describeWinCondition('', 30), 'Play for 30 minutes. The team with more points at the end wins.')
}

/** A condition someone wrote on purpose is not ours to replace. */
function testDeliberateWinConditionIsKept(): void {
    assert.equal(describeWinCondition('First team to five points wins.', 20), 'First team to five points wins.')
}

function testWinConditionIsIdempotent(): void {
    const once = describeWinCondition(ENGINE_WIN, 25)
    assert.equal(describeWinCondition(once, 25), once)
}

// ---------------------------------------------------------------------------------- EQUIPMENT

const ENGINE_EQUIPMENT = ['Marking cones or discs if needed for zones described in setup.']

function testEquipmentIsReadOffTheSetup(): void {
    assert.deepEqual(
        deriveEquipment(
            ENGINE_EQUIPMENT,
            'Play 5v5 with two neutrals in a 40 x 30 m area with a central corridor. Two small goals at each end. Neutrals start in the corridor.'
        ),
        ['Cones to mark the area and its zones', 'Bibs for two teams and the neutral players', 'Balls', 'Small goals']
    )
    assert.deepEqual(deriveEquipment(ENGINE_EQUIPMENT, SETUP_1), ['Cones to mark the area and its zones', 'Bibs for two teams', 'Balls'])
}

/** "After a goal" is an event, not something to carry onto the field. */
function testScoringEventsAreNotEquipment(): void {
    const out = deriveEquipment(ENGINE_EQUIPMENT, 'Play 6v6 in a 40 x 30 m area. Restart from the center after a goal or ball out of play.')
    assert.ok(!out.some((e) => /goal/i.test(e)), `a scoring event became equipment: ${JSON.stringify(out)}`)
}

function testGoalsDescribedAsObjectsAreEquipment(): void {
    const out = deriveEquipment(ENGINE_EQUIPMENT, 'Each team attacks a goal located at the end of their attacking corridor.')
    assert.ok(out.includes('Goals'), JSON.stringify(out))
}

/** A coach's own list is theirs. */
function testCoachEquipmentIsKept(): void {
    assert.deepEqual(deriveEquipment(['Cones', 'Two portable goals'], SETUP_1), ['Cones', 'Two portable goals'])
}

testChristiansExamplesAreCoachingIntentions()
testExplanationsAreNotCoachingIntentions()
testGeneratedIntentionIsKeptAndItsExplanationDropped()
testLearningGoalIsTheFallback()
testGuidedGoalUsesOnlyTheGoalName()
testProblemDescriptionIsNotTurnedIntoAnIntention()
testGameFormObjectiveIsExtractedFromTheSessionFocusLabel()
testObjectiveIsNeverEmpty()
testHowToPlayMergesIntoRulesByOwnership()
testMidSentenceScoringClaimDefersToScoring()
testNeutralLinesNeedNeutralsInSetup()
testRestatementOfARuleIsDropped()
testBonusPointsLineDefersToScoring()
testSetupNoLongerStatesHowTeamsScore()
testSetupKeepsWhatTeamsAttackAndRestarts()
testWeightedScoringIsAScoringClaim()
testExtraPlayerLinesNeedAnExtraPlayerInSetup()
testWinConditionSaysWhenItEnds()
testDeliberateWinConditionIsKept()
testWinConditionIsIdempotent()
testEquipmentIsReadOffTheSetup()
testScoringEventsAreNotEquipment()
testGoalsDescribedAsObjectsAreEquipment()
testCoachEquipmentIsKept()

console.log('coach-facing-sections unit tests: all cases passed.')
