/**
 * Every fixture here is a real line from the activity Christian reviewed on 17 Aug, so the test
 * measures his actual complaint rather than my paraphrase of it.
 */
import assert from 'node:assert/strict'

import {
    isDesignRationale,
    isImpliedSportKnowledge,
    isScoringStatement,
    leadWithClearestScoringSentence,
    routeRulesForCoach,
} from './coach-section-ownership'

/** The Rules block exactly as a coach was shown it. */
const RULES_AS_SHOWN = [
    'Play stays live as possession is secured and progressed toward the target under pressure. A forced ball or turnover flips the immediate attacking advantage to the opponent with no reset.',
    'Teams attack toward a defined goal or end, so every progression has a direction.',
    'Support options and spacing must shape available passes and outlets.',
    'Score awarded for plays that visibly create or open space for a teammate — stretching, unbalancing, or pulling defenders out of position so a teammate has a free option.',
    'On possession change, both teams stay live in the same space with no reset: defenders re-press immediately from wherever they were standing when the ball changed hands, and play continues until the next decision resolves.',
]

function testReadAloudTest(): void {
    const routed = routeRulesForCoach(RULES_AS_SHOWN)

    // Two survive: the exchange rule and the live-transition rule. Both are things a coach can say
    // to players before kick-off.
    assert.equal(routed.rules.length, 2, `expected 2 player-action rules, got:\n${routed.rules.join('\n')}`)
    assert.ok(routed.rules[0].startsWith('Play stays live'), 'the two-sided exchange rule must always survive')
    assert.ok(routed.rules[1].startsWith('On possession change'), 'the live-transition rule is a player action')

    assert.equal(routed.movedToScoring.length, 1, 'the "Score awarded for..." line belongs to Scoring')
    // The support principle is RELOCATED to Coaching Focus, not lost; only the statement that
    // restates ordinary play is dropped, because moving a sentence that says nothing helps no one.
    assert.equal(routed.movedToCoachingFocus.length, 1, 'the support principle belongs in Coaching Focus')
    assert.equal(routed.removed.length, 1, 'only the "every progression has a direction" line is dropped outright')
}

function testEachCategoryOnItsOwn(): void {
    assert.ok(isScoringStatement('Score awarded for winning the ball back or forcing a turnover.'))
    assert.ok(isScoringStatement('A point or live advantage counts when the team progresses possession.'))
    assert.ok(!isScoringStatement('Play continues immediately after every possession change with no reset.'))

    assert.ok(isDesignRationale('Support options and spacing must shape available passes and outlets.'))
    assert.ok(isDesignRationale('Two-sided contest: the team in possession finds a positional advantage.'))
    assert.ok(!isDesignRationale('Defenders re-press immediately from wherever they were standing.'))

    assert.ok(isImpliedSportKnowledge('Teams attack toward a defined goal or end, so every progression has a direction.'))
    assert.ok(isImpliedSportKnowledge('Live opposition contests every attempt to progress.'))
    assert.ok(!isImpliedSportKnowledge('Play restarts from the central corridor after a goal.'))
}

function testTheExchangeRuleIsNeverDropped(): void {
    // Even if rules[0] happens to read like a scoring statement, it is structural and must stay.
    const routed = routeRulesForCoach(['A point counts when the team enters the end zone.', 'Live opposition contests every attempt to progress.'])
    assert.equal(routed.rules.length, 1)
    assert.ok(routed.rules[0].startsWith('A point counts'))
}

function testProtectedSlotVariationSurvives(): void {
    const modifier = 'regains in the central zone count higher'
    const routed = routeRulesForCoach(
        ['Exchange rule.', `Score awarded where ${modifier} than elsewhere.`],
        [modifier]
    )
    assert.equal(routed.rules.length, 2, 'per-slot variation is what makes the three activities differ; never drop it')
}

function testScoringLeadsWithThePlainestSentence(): void {
    const sentences = [
        'A point or live advantage counts only when possession is maintained under pressure and the ball is progressed toward the target before the space closes.',
        'Teams earn 1 point when they keep the ball under pressure and move it toward the goal.',
        'The field is treated as three value zones: regains in the central zone count higher than regains in the wide zones.',
    ]
    const led = leadWithClearestScoringSentence(sentences)

    assert.ok(led[0].startsWith('Teams earn 1 point'), `expected the plainest sentence first, got: "${led[0]}"`)
    assert.equal(led.length, sentences.length, 'detail is reordered, never discarded')
    for (const s of sentences) assert.ok(led.includes(s), 'every sentence must survive reordering')
}

testReadAloudTest()
testEachCategoryOnItsOwn()
testTheExchangeRuleIsNeverDropped()
testProtectedSlotVariationSurvives()
testScoringLeadsWithThePlainestSentence()

console.log('coach-section-ownership unit tests: all cases passed.')
