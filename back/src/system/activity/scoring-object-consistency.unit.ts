/**
 * Unit tests — one way to score in what a coach reads (RC1.1).
 *
 * The fixtures are the coach view of three real runs on 13 Sep, 39 activities each across the 13 guided
 * goals, every one scored on its resolved primary event:
 *   * the first, before this cleaning existed: Scoring was right in all 39, while Setup, Rules and the
 *     Objective still named the game form's default objects ("Teams attack the end zones" in a game
 *     scored on a line);
 *   * the second, the first run with RC1.1 ACTIVE and this cleaning live, which found what the first
 *     version missed ("Play 6v6 with two 18 m (20 yd) end zones at either end of a 40 x 30 m area");
 *   * the third, read slot by slot, where all three Finishing setups marked no goal ("Restart with a
 *     goal kick" had satisfied the check) and both Counterattack goal games never said what "the
 *     countdown" in their Scoring was.
 * So these tests run the cleaning over REAL text rather than over sentences written to pass, and pin
 * the repairs a coach would otherwise have to make in their head.
 *
 * Run: part of `npm test`.
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { resolvePrimaryScoring } from '../sport-module/primary-scoring'
import { namesUnscoredObject, rulesForScoredObject, withoutUnscoredObjects, type ScoredObject } from './scoring-object-consistency'
import { setupMarksScoringObject, withScoringObjectInSetup } from './validate-activity-skeleton'

interface GeneratedCase {
    learningGoalId: string
    gameFormId: string
    slot: 1 | 2 | 3
    contextId: string
    eventKey: string
    intent: string
    setup: string
    rules: string[]
}

function load(file: string): GeneratedCase[] {
    return (JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', file), 'utf8')) as { cases: GeneratedCase[] }).cases
}

const firstRun = load('primary-scoring-generated-2026-09-13.json')
const activeRun = load('primary-scoring-generated-2026-09-13-active.json')
const finalRun = load('primary-scoring-generated-2026-09-13-final.json')
// The fourth run, read slot by slot after the setup repairs: a goal defended in a protected-zone game,
// "scoring bonuses", "Weighted scoring", "these zones".
const confirmingRun = load('primary-scoring-generated-2026-09-13-final3.json')

const sentencesOf = (text: string) => text.split(/(?<=[.!?])\s+/).filter(Boolean)

function prepared(c: GeneratedCase) {
    const directive = resolvePrimaryScoring(c.contextId, c.gameFormId, c.slot)
    const scored: ScoredObject = { eventKey: directive.eventKey, names: directive.setupEvidence.flat() }
    const label = `${c.learningGoalId} slot ${c.slot} (${c.contextId} ${directive.eventKey})`
    const setup = withScoringObjectInSetup(withoutUnscoredObjects(c.setup, scored), directive)
    return { directive, scored, label, setup }
}

function find(run: GeneratedCase[], goalId: string, slot: number): GeneratedCase {
    const found = run.find((c) => c.learningGoalId === goalId && c.slot === slot)
    assert.ok(found, `fixture has no ${goalId} slot ${slot}`)
    return found
}

/**
 * Across all 117 real activities: Setup carries everything the Scoring rule needs, no unscored object
 * or second way to score survives, and nothing a coach needs is lost.
 */
function testRealOutputNamesOnlyWhatItScoresOn(): void {
    for (const run of [firstRun, activeRun, finalRun, confirmingRun]) assert.equal(run.length, 39)
    const FORMAT = /\b\d+\s*v\s*\d+\b|\bteams?\s+of\s+\d+\b/i
    const AREA = /\b\d+\s*x\s*\d+\s*m\b/i
    const DANGLING = /\b(?:with|and|plus|the|a)\s*[.,!?]|,\s*[.!?]|\s{2,}|,\s+(?:(?:each|both)\s+)?\w+ing\s*[.!?]|\b(?:attacking|defending)\s+and\s+(?:attacking|defending)\s+end\b|\bteams\s+attacking\s+end\b/i

    for (const c of [...firstRun, ...activeRun, ...finalRun, ...confirmingRun]) {
        const { directive, scored, label, setup } = prepared(c)
        assert.equal(directive.eventKey, c.eventKey, `${label} resolves to a different event than it was generated with`)

        assert.ok(!namesUnscoredObject(setup, scored), `${label} Setup still names an object nothing scores on: "${setup}"`)
        assert.ok(setupMarksScoringObject(setup, directive), `${label} Setup lost its scoring object: "${setup}"`)
        for (const sentence of sentencesOf(directive.setupRequirement)) {
            const namesTheObject = directive.setupEvidence.flat().some((word) => new RegExp(`\\b${word}\\b`, 'i').test(sentence))
            if (!namesTheObject) assert.ok(setup.includes(sentence), `${label} Setup lacks "${sentence}", which Scoring depends on: "${setup}"`)
        }
        assert.doesNotMatch(
            setup,
            /\bto score\b|\bscores?\s+(?:by|in|into|on|through)\b|\bweighted scoring\b|\bbonus(?:es)?\b|\bpoints?\s+system\b/i,
            `${label} Setup states a second way to score: "${setup}"`
        )
        assert.doesNotMatch(setup, /\b(?:these|those)\s+zones\b/i, `${label} Setup points back at removed objects: "${setup}"`)
        assert.doesNotMatch(setup, DANGLING, `${label} Setup was left broken: "${setup}"`)
        assert.ok(!sentencesOf(setup).some((s) => s.split(/\s+/).length < 2), `${label} Setup has a one-word sentence: "${setup}"`)
        for (const needed of [FORMAT, AREA]) {
            const before = c.setup.match(needed)?.[0]
            if (before) assert.ok(setup.includes(before), `${label} Setup lost "${before}": "${setup}"`)
        }
        assert.equal(
            withScoringObjectInSetup(withoutUnscoredObjects(setup, scored), directive),
            setup,
            `${label} cleaning is not idempotent`
        )

        const rules = rulesForScoredObject(c.rules, scored, () => false)
        for (const rule of rules) {
            assert.ok(!namesUnscoredObject(rule, scored), `${label} rule names an unscored object: "${rule}"`)
            assert.doesNotMatch(rule, /\bweighted\b|\bbonus(?:es)?\b|\b\d+\s+points\b/i, `${label} rule states a second way to score: "${rule}"`)
            if (directive.eventKey !== 'regain') assert.doesNotMatch(rule, /^a regain\b/i, `${label} keeps a regain condition it never scores`)
        }
        assert.ok(rules.length >= 2, `${label} Rules were emptied: ${JSON.stringify(rules)}`)

        const objective = withoutUnscoredObjects(c.intent, scored, 'drop')
        assert.ok(!namesUnscoredObject(objective, scored), `${label} Objective names an unscored object: "${objective}"`)
    }
}

/** The exact repairs, on the real sentences, so a regression shows what a coach would now read. */
function testRepairsReadAsACoachWouldWriteThem(): void {
    // A clause goes; the area, corridor and team format in the same sentence stay. Restarts keep meaning.
    assert.equal(
        prepared(find(firstRun, 'A05', 1)).setup,
        'Set up a 40 x 30 m (44 x 33 yd) field with a central corridor. Play 6v6. Restart from the defensive end after a score or ball out. Mark an attacking zone across the far third of the pitch at each end.'
    )
    // "with two end zones and a central overload zone" -> "with a central overload zone".
    assert.equal(
        prepared(find(firstRun, 'TA01', 3)).setup,
        'Set up a 40 x 30 m (44 x 33 yd) field with a central overload zone. Play 7v5, with the attacking team having a numerical advantage in the central zone. Put a goal at each end. Before you start, pick a countdown between 6 and 10 seconds that starts each time a team wins the ball.'
    )
    // Counter-Press, regain: an escape line to attack replaces the end zones nothing scored on.
    assert.equal(
        prepared(find(firstRun, 'D02', 1)).setup,
        'Set up a 40 x 30 m (44 x 33 yd) field with a central corridor. Play 6v6 with two teams. Players start within their half, and play begins with a pass from the defending end. After a score or out of play, restart with a pass from their own end. Mark an escape line across the pitch for each team to attack. Every time a team loses the ball, count to five out loud.'
    )
    // "no fixed zones" beside the protected zone the game is scored on.
    assert.equal(
        prepared(find(firstRun, 'D01', 2)).setup,
        'Use a 40 x 30 m (44 x 33 yd) field. Play 6v6. Start with a pass from the defending team. After a score, play restarts immediately with the team that conceded. Mark a protected zone at each end.'
    )
    // The object shares its clause with the area: only the object goes.
    assert.equal(
        prepared(find(activeRun, 'A01', 1)).setup,
        'Play 6v6 in a 40 x 30 m (44 x 33 yd) area. A central corridor runs through the middle of the field. Teams start in their defensive half, and possession begins with a pass from the defensive end. Play restarts from the defensive end after a score or ball out of play. Mark a line across the pitch beyond the first defenders. Start each attack from your goalkeeper or a restart in your own half.'
    )
    // A second way to score, stated in Setup.
    assert.equal(
        prepared(find(activeRun, 'A04', 1)).setup,
        'Two teams of 6 players each. Play occurs in a 40 x 30 m (44 x 33 yd) area with a central corridor and two wide channels. Players start in their designated areas, and play begins with a pass from the defending team. After a score or ball out of play, restart with a pass from the defending team. Mark a finishing zone at each end, with defenders free to defend it.'
    )
    assert.doesNotMatch(prepared(find(activeRun, 'D02', 3)).setup, /weighted/i)

    // Finishing: "a goal kick" marked no goal. The goal is written in, and Equipment follows from it.
    assert.equal(
        prepared(find(finalRun, 'A06', 1)).setup,
        'Play in a 40 x 30 m (44 x 33 yd) area. Use wide channels on each side. Restart with a goal kick or corner after a score or ball out. Put a goal at each end.'
    )
    assert.match(prepared(find(finalRun, 'A06', 2)).setup, /Put a goal at each end\./)
    // Counterattack: "Two score in small goals" is a way to score, not a layout; the goal and the
    // countdown the Scoring rule depends on are written in.
    assert.equal(
        prepared(find(finalRun, 'TA01', 1)).setup,
        'Play 6v6 in a 40 x 30 m (44 x 33 yd) area with a central corridor. Players start in their half, and play begins with a drop ball in the central corridor. After a score or ball out of play, restart with a drop ball in the central corridor. Put a goal at each end. Before you start, pick a countdown between 6 and 10 seconds that starts each time a team wins the ball.'
    )
    // The model's own goal sentence stands; only the countdown is added.
    const ownGoalSentence = prepared(find(finalRun, 'TA01', 3)).setup
    assert.match(ownGoalSentence, /Each team defends a goal/)
    assert.doesNotMatch(ownGoalSentence, /Put a goal at each end/)
    assert.ok(ownGoalSentence.endsWith('Before you start, pick a countdown between 6 and 10 seconds that starts each time a team wins the ball.'))
    // "Restart." was all that remained of a cut sentence.
    assert.equal(
        prepared(find(finalRun, 'A01', 1)).setup,
        'Play 6v6 with two 5 m (5 yd) wide channels on either side of a central 40 x 30 m (44 x 33 yd) area. Players start in the central area, and play begins with a pass from the coach. Mark a line across the pitch beyond the first defenders. Start each attack from your goalkeeper or a restart in your own half.'
    )

    // A goal defended in a game scored on a protected zone, kept only because "7 players" looked like
    // format that "Play 6v6" already states.
    assert.equal(
        prepared(find(confirmingRun, 'D01', 3)).setup,
        'Play 6v6 in a 40 x 30 m (44 x 33 yd) area with two wide channels. Play starts with a pass from the coach to the team with 6 players. Mark a protected zone at each end.'
    )
    assert.doesNotMatch(prepared(find(confirmingRun, 'D02', 3)).setup, /these zones/i)
    assert.doesNotMatch(prepared(find(confirmingRun, 'TA01', 3)).setup, /bonus/i)

    // Rules: a restart after "a goal" in a game with no goals is a restart after a score.
    const chanceCreation = prepared(find(firstRun, 'A03', 3))
    assert.ok(
        rulesForScoredObject(find(firstRun, 'A03', 3).rules, chanceCreation.scored, () => false).includes(
            "Restart with a coach's pass after a score or ball out of play."
        )
    )

    // Objectives aimed somewhere nothing scores give way to the coach's goal.
    for (const [run, goalId, slot] of [
        [firstRun, 'A02', 2],
        [firstRun, 'A02', 3],
        [firstRun, 'A05', 3],
        [firstRun, 'TA01', 1],
        [activeRun, 'A04', 3],
        [confirmingRun, 'TA02', 3],
    ] as const) {
        const c = find(run, goalId, slot)
        assert.equal(withoutUnscoredObjects(c.intent, prepared(c).scored, 'drop'), '', `${goalId} slot ${slot}: "${c.intent}"`)
    }
}

/** What cleaning must never touch. */
function testTheScoredObjectAndEverythingElseSurvive(): void {
    const endZoneGame: ScoredObject = { eventKey: 'target_zone_entered', names: ['end zone', 'end zones'] }
    const sentence = 'Mark an end zone for each team. Teams attack the end zones.'
    assert.equal(withoutUnscoredObjects(sentence, endZoneGame), sentence, 'the object a game scores on is never removed')
    assert.equal(
        withoutUnscoredObjects('Score in the end zone as quickly as you can.', endZoneGame, 'drop'),
        'Score in the end zone as quickly as you can.',
        'an intention naming the scored object stays'
    )

    const goalGame: ScoredObject = { eventKey: 'goal', names: ['goal', 'goals'] }
    assert.equal(withoutUnscoredObjects('Put two small goals at each end.', goalGame), 'Put two small goals at each end.')

    // Real output, fourth run on 13 Sep (Counterattack, slot 3): the model's own points, in Setup and Rules.
    assert.equal(
        withoutUnscoredObjects(
            'Play 7v5 in a 40 x 30 m (44 x 33 yd) area with wide channels. Teams attack large goals at each end. Use a 2-point scoring system for goals scored from overload situations.',
            goalGame
        ),
        'Play 7v5 in a 40 x 30 m (44 x 33 yd) area with wide channels. Teams attack large goals at each end.'
    )
    assert.deepEqual(
        rulesForScoredObject(['Use wide channels to create overloads.', 'Goals from overloads earn 2 points.'], goalGame, () => false),
        ['Use wide channels to create overloads.']
    )
    // Fifth run, what cuts left behind, pinned from the sentences that produce it.
    const protectedZoneRegain: ScoredObject = { eventKey: 'regain', names: ['protected zone', 'protected zones'] }
    const escapeLineRegain: ScoredObject = { eventKey: 'regain', names: ['escape line', 'escape lines'] }
    assert.equal(
        withoutUnscoredObjects(
            'Play in a 40 x 30 m (44 x 33 yd) area with a central corridor. Two teams of 6 players each, defending and attacking end zones. Players start in their respective halves.',
            protectedZoneRegain
        ),
        'Play in a 40 x 30 m (44 x 33 yd) area with a central corridor. Two teams of 6 players each. Players start in their respective halves.',
        '"Two teams of 6 players each, defending." was left of this (Stay Organized)'
    )
    assert.equal(
        withoutUnscoredObjects('Set up a 40 x 30 m (44 x 33 yd) field with three zones: a central zone and two end zones.', escapeLineRegain),
        'Set up a 40 x 30 m (44 x 33 yd) field with a central zone.',
        '"…with three zones: a central zone." was left of this (Win the Ball Back)'
    )
    assert.equal(
        withoutUnscoredObjects('Play 6v6. Divide the field into three zones: a 9 m (10 yd) central corridor and two end zones.', escapeLineRegain),
        'Play 6v6. Divide the field into a 9 m (10 yd) central corridor.'
    )

    // Fifth run (Defend 1v1, slot 1): an objective naming end zones was the only place the area was
    // stated, so it was kept whole. The area stays; the end zones go.
    assert.equal(
        withoutUnscoredObjects(
            "Play with two teams of 6v6 including goalkeepers. The field is divided into three zones: two wide channels and a central corridor. Teams attack end zones located at each end of a 40 x 30 m (44 x 33 yd) field. Play begins with a goalkeeper's pass from their own end. Mark a protected zone at each end.",
            { eventKey: 'regain', names: ['protected zone', 'protected zones'] }
        ),
        "Play with two teams of 6v6 including goalkeepers. The field is divided into three zones: two wide channels and a central corridor. Play in a 40 x 30 m (44 x 33 yd) area. Play begins with a goalkeeper's pass from their own end. Mark a protected zone at each end."
    )

    // What the live cut left in the fourth run, pinned from the sentences that produced it.
    const regainLineGame: ScoredObject = { eventKey: 'regain', names: ['escape line', 'escape lines'] }
    assert.equal(
        withoutUnscoredObjects('Play 6v6 in a 40 x 30 m (44 x 33 yd) area with a central corridor. Two teams attack and defend end zones.', regainLineGame),
        'Play 6v6 in a 40 x 30 m (44 x 33 yd) area with a central corridor.',
        '"Two teams attack." was left of this'
    )
    assert.equal(
        withoutUnscoredObjects('Set up a 40 x 30 m (44 x 33 yd) grid with central and end zones. Play 6v6.', { eventKey: 'target_zone_entered', names: ['finishing zone', 'finishing zones'] }),
        'Set up a 40 x 30 m (44 x 33 yd) grid with a central zone. Play 6v6.',
        '"…grid with central." was left of this'
    )
    assert.equal(
        withoutUnscoredObjects('Use a 40 x 30 m (44 x 33 yd) field. Teams attack and defend these zones. Play 6v6.', regainLineGame),
        'Use a 40 x 30 m (44 x 33 yd) field. Play 6v6.'
    )

    // Same run (Attack Prevention, slot 2): "No zones" beside the protected zone the game is scored on.
    assert.equal(
        withoutUnscoredObjects(
            'Play 6v6 with goalkeepers on a 40 x 30 m (44 x 33 yd) field. No zones; play is continuous with live transitions. Start with a goalkeeper pass, and possession flips immediately upon a turnover.',
            { eventKey: 'denial', names: ['protected zone', 'protected zones'] }
        ),
        'Play 6v6 with goalkeepers on a 40 x 30 m (44 x 33 yd) field. Play is continuous with live transitions. Start with a goalkeeper pass, and possession flips immediately upon a turnover.'
    )

    const lineGame: ScoredObject = { eventKey: 'line_crossed', names: ['line', 'lines', 'goalkeeper', 'goalkeepers'] }
    assert.ok(!namesUnscoredObject('Start each attack from your goalkeeper.', lineGame), 'a goalkeeper is not a goal')
    assert.ok(!namesUnscoredObject('Restart with a goal kick.', lineGame), 'a goal kick is not a goal')
    assert.ok(namesUnscoredObject('Attack the goal.', lineGame))
    assert.equal(withoutUnscoredObjects('Play 6v6.', lineGame), 'Play 6v6.', 'a short sentence carrying the format stays')

    // The area is never lost, even when no clause boundary allows a clean cut.
    assert.match(withoutUnscoredObjects('Two end zones sit in a 40 x 30 m area.', lineGame), /40 x 30 m/)
    assert.equal(
        withoutUnscoredObjects('Play 6v6 with two 18 m (20 yd) end zones at either end of a 40 x 30 m (44 x 33 yd) area.', lineGame),
        'Play 6v6 in a 40 x 30 m (44 x 33 yd) area.'
    )
    assert.equal(withoutUnscoredObjects('Play 6v6 with two end zones in a 40 x 30 m area.', lineGame), 'Play 6v6 in a 40 x 30 m area.')

    // The slot variation survives cleaning, except the regain condition in a game that scores no regain.
    const modifier = 'Points earned in a forward zone count higher.'
    const regainCondition = 'A regain completes only when followed by a connected forward action under opposition.'
    const mustKeep = (line: string) => line === modifier || line === regainCondition
    assert.deepEqual(rulesForScoredObject([modifier, regainCondition], lineGame, mustKeep), [modifier])
    assert.deepEqual(
        rulesForScoredObject([modifier, regainCondition], { eventKey: 'regain', names: ['escape line'] }, mustKeep),
        [modifier, regainCondition]
    )

    assert.equal(withoutUnscoredObjects('', lineGame), '')
}

testRealOutputNamesOnlyWhatItScoresOn()
testRepairsReadAsACoachWouldWriteThem()
testTheScoredObjectAndEverythingElseSurvive()

console.log('scoring-object-consistency unit tests: all cases passed.')
