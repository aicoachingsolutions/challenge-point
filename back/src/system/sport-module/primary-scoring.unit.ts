/**
 * Unit tests — primary scoring event resolution (RC1.1, Christian 2026-09-13).
 *
 * What these pin is the failure the layer exists to end: nine real activities where seven setups
 * marked a scoring object and none scored it — finishing games with goals rewarding "attacking the
 * open space", counter-attack games rewarding the regain. So the tests are about WHICH SIDE of the
 * representative problem earns the point, that the setup has to make the event physically possible,
 * and that compression can no longer demote the resolved rule.
 *
 * Run: part of `npm test`.
 */
import assert from 'node:assert/strict'

import type { ActivitySkeletonSlot } from '../activity/build-activity-skeleton'
import { findCommunicationStandardViolations } from '../activity/coach-communication-standard'
import { toCoachScoringSentence } from '../activity/coach-voice'
import { compressActivityForCoach } from '../activity/compress-activity-output'
import { validateActivityAgainstSkeleton, withScoringObjectInSetup } from '../activity/validate-activity-skeleton'
import { deriveInputConstraints } from '../input-constraints/deriveInputConstraints'
import { sessionPlanningModel } from '../session-planning/session-planning-model'
import { generateSelection } from '../test-library/generateSelection'
import { gateCandidateGameFormsToContext } from './context-selection'
import {
    COACH_RULES,
    PrimaryScoringResolutionError,
    REALIZATION_COVERAGE,
    authoredScoringObjects,
    availableScoringEvents,
    resolvePrimaryScoring,
    resolvePrimaryScoringDirectives,
} from './primary-scoring'
import { rpcLibrary } from './rpc-library'
import { soccerModule } from './soccer-module'

function compatiblePairs(): Array<{ rpcId: string; gameFormId: string }> {
    return rpcLibrary
        .contexts()
        .flatMap((c) => rpcLibrary.gameFormsForContext(c.id).map((f) => ({ rpcId: c.id, gameFormId: f.relatedId })))
}

/** Christian: "the eight-row structure is approved". Every compatible pair must reach an approved event. */
function testEveryCompatiblePairResolvesToAnApprovedEvent(): void {
    const pairs = compatiblePairs()
    assert.equal(pairs.length, 22, 'RC1.1 declares 22 context x game form pairs.')
    for (const { rpcId, gameFormId } of pairs) {
        const directives = resolvePrimaryScoringDirectives(rpcId, gameFormId)
        assert.equal(directives.length, 3)
        const valid = rpcLibrary.scoringEventsForContext(rpcId)
        for (const d of directives) {
            assert.ok(valid.includes(d.eventKey), `${rpcId} x ${gameFormId} resolved to "${d.eventKey}", which the context does not score through.`)
            assert.equal(d.qualifyingCondition, rpcLibrary.primaryScoringCondition(rpcId), 'the condition must travel with the event')
            assert.ok(d.qualifyingCondition.length > 0)
        }
    }
}

/** The two gaps Christian asked to be closed rather than worked around. */
function testTheApprovedGapsAreClosedByCoverage(): void {
    assert.deepEqual(authoredScoringObjects('GF7'), [], 'Channel Games author no scoring object of their own.')
    for (const rpcId of ['RPC-001', 'RPC-002', 'RPC-003', 'RPC-004']) {
        assert.equal(resolvePrimaryScoring(rpcId, 'GF7', 1).realizationCoverage, 'channel-attacking-object', `${rpcId} x GF7`)
    }
    assert.equal(resolvePrimaryScoring('RPC-008', 'GF7', 1).realizationCoverage, 'channel-protected-zone')

    assert.ok(!authoredScoringObjects('GF3').includes('goal'), 'Positional Play authors no goal.')
    const finishingThroughGrid = resolvePrimaryScoring('RPC-005', 'GF3', 1)
    assert.equal(finishingThroughGrid.eventKey, 'goal')
    assert.equal(finishingThroughGrid.realizationCoverage, 'positional-play-finishing-goal')

    // Coverage is credited only where it supplied the object.
    assert.equal(resolvePrimaryScoring('RPC-005', 'GF9', 1).realizationCoverage, null)
    assert.equal(resolvePrimaryScoring('RPC-003', 'GF3', 1).realizationCoverage, null)

    // Coverage may only close a gap on a pair the knowledge declares compatible.
    for (const coverage of REALIZATION_COVERAGE) {
        for (const rpcId of coverage.rpcIds) {
            assert.ok(
                rpcLibrary.gameFormsForContext(rpcId).some((f) => f.relatedId === coverage.gameFormId),
                `${coverage.id} covers ${rpcId}, which is not compatible with ${coverage.gameFormId}.`
            )
        }
    }
}

/** The motivating evidence, as assertions: the right side of each problem earns the point. */
function testTheRightSideOfTheProblemEarnsThePoint(): void {
    for (const { rpcId, gameFormId } of compatiblePairs()) {
        for (const d of resolvePrimaryScoringDirectives(rpcId, gameFormId)) {
            if (rpcId === 'RPC-005') assert.equal(d.eventKey, 'goal', `Finishing x ${gameFormId} must score goals.`)
            if (rpcId === 'RPC-006') assert.notEqual(d.eventKey, 'regain', `Counterattack x ${gameFormId} rewards the regain.`)
            if (rpcId === 'RPC-004') assert.notEqual(d.eventKey, 'goal', 'Chance Creation ends before the goal.')
        }
    }
}

/** Both approved defensive events reach coaches; a first-match rule would never reach Denial. */
function testBothApprovedDefensiveEventsReachCoaches(): void {
    assert.deepEqual(resolvePrimaryScoringDirectives('RPC-007', 'GF4').map((d) => d.eventKey), ['regain', 'denial', 'regain'])
    assert.deepEqual(
        resolvePrimaryScoringDirectives('RPC-008', 'GF3').map((d) => [d.eventKey, d.objectKey]),
        [
            ['regain', 'zone'],
            ['denial', 'zone'],
            ['regain', 'zone'],
        ]
    )
    // Counter-Press judges its regain against the window alone.
    assert.equal(resolvePrimaryScoring('RPC-007', 'GF4', 1).objectKey, null)
}

/** "Validation should fail rather than infer if the selected realization cannot produce a valid event." */
function testEmptyIntersectionFailsInsteadOfInferring(): void {
    const isResolutionError = (e: unknown) => e instanceof PrimaryScoringResolutionError
    assert.throws(() => resolvePrimaryScoring('RPC-005', 'GF1', 1), isResolutionError, 'End Zone Games mark no goal.')
    assert.throws(() => resolvePrimaryScoring('RPC-004', 'GF10', 1), isResolutionError, 'Open play marks nothing to create a chance into.')
    assert.throws(() => resolvePrimaryScoring('RPC-999', 'GF9', 1), /Unknown Representative Performance Context/)
    assert.throws(() => availableScoringEvents('RPC-005', 'GF99'), /Unknown game form/)
}

/** The game form column speaks the controlled vocabulary, and never asserts the derived events. */
function testGameFormStructureUsesTheControlledVocabulary(): void {
    const vocabulary = new Set(rpcLibrary.scoringEvents().map((e) => e.key))
    assert.deepEqual([...vocabulary], ['goal', 'target_player', 'line_crossed', 'target_zone_entered', 'gate', 'regain', 'denial'])
    for (const form of soccerModule.gameForms()) {
        const id = String(form['game_form_id'])
        const objects = authoredScoringObjects(id)
        for (const event of objects) assert.ok(vocabulary.has(event), `${id} names "${event}", outside the vocabulary.`)
        assert.ok(!objects.includes('regain') && !objects.includes('denial'), `${id} asserts a derived event.`)
    }
    assert.deepEqual(availableScoringEvents('RPC-005', 'GF9').events, ['goal', 'regain', 'denial'])
    assert.deepEqual(availableScoringEvents('RPC-005', 'GF5').events, ['regain'], 'no object, so nothing to deny')
}

/** Wording exists for exactly the approved events, and a coach can read every rule aloud unchanged. */
function testCoachWordingIsCompleteApprovedAndCoachFacing(): void {
    const keys = Object.keys(COACH_RULES)
    for (const key of keys) {
        const [rpcId, eventKey] = key.split('|')
        assert.ok(rpcLibrary.scoringEventsForContext(rpcId!).includes(eventKey!), `${key} words an event the context does not score through.`)
    }
    for (const context of rpcLibrary.contexts()) {
        for (const event of rpcLibrary.scoringEventsForContext(context.id)) {
            assert.ok(keys.some((key) => key.startsWith(`${context.id}|${event}|`)), `${context.id} ${event} has no coach wording.`)
        }
    }
    for (const [key, wording] of Object.entries(COACH_RULES)) {
        assert.deepEqual(findCommunicationStandardViolations(wording.rule), [], `${key}: ${wording.rule}`)
        assert.equal(toCoachScoringSentence(wording.rule), wording.rule, `${key} would be rewritten by the engine-voice translation.`)
        assert.match(wording.rule, /\bpoint\b/, `${key} does not say how a point is earned.`)
        assert.ok(wording.evidence.every((group) => group.length > 0), `${key} has an empty evidence group.`)
        // Only an event judged on time alone needs nothing marked out.
        if (key !== 'RPC-007|regain|') assert.ok(wording.evidence.length > 0, `${key} has no setup evidence.`)
        // The setup's object must carry the rule's own name for it, so a coach can tell which one scores.
        for (const group of wording.evidence) {
            assert.ok(
                group.some((word) => wording.rule.toLowerCase().includes(word) || wording.setup.toLowerCase().includes(word)),
                `${key}: evidence "${group.join('/')}" is named in neither the rule nor the setup requirement.`
            )
        }
    }
}

function slotFor(rpcId: string, gameFormId: string, slotIndex: 1 | 2 | 3 = 1): ActivitySkeletonSlot {
    return {
        activityIndex: 1,
        archetypeName: 'Test Games',
        titleFrame: '',
        setupFrame: '',
        slotProgressionEmphasis: '',
        requiredRuleMechanics: [],
        requiredScoringMechanics: [],
        requiredAffordanceMechanics: [],
        requiredConstraintMechanics: [],
        coachFacingConstraints: [],
        requiredArchetypeMechanics: [],
        requiredDecisionLanguage: [],
        slotMechanicalVariations: [],
        primaryScoring: resolvePrimaryScoring(rpcId, gameFormId, slotIndex),
    }
}

function setupFailures(setup: string, slot: ActivitySkeletonSlot): string[] {
    const activity = { title: 't', setup, teams: '', objective: '', rules: [], scoring: '', constraints: [], coachingFocus: [], howToPlay: [] }
    return validateActivityAgainstSkeleton(activity as never, slot, 1).filter((reason) =>
        reason.includes('the setup must mark what this activity scores on')
    )
}

/** The setup check must BITE — a check that cannot fail is worse than none. */
function testSetupMustMarkTheScoringObject(): void {
    const finishing = slotFor('RPC-005', 'GF9')
    assert.equal(setupFailures('Play 6v6 in a 40 x 30 m area with goalkeepers.', finishing).length, 1, '"goalkeepers" is not a goal')
    assert.equal(setupFailures('Play 6v6 with a goal at each end.', finishing).length, 0)

    const buildOut = slotFor('RPC-001', 'GF2')
    assert.equal(setupFailures('Mark a line beyond the first defenders.', buildOut).length, 1, 'the goalkeeper start is part of the condition')
    assert.equal(setupFailures('The goalkeeper starts every attack. Mark a line beyond the first defenders.', buildOut).length, 0)

    const counterPressDenial = slotFor('RPC-007', 'GF4', 2)
    assert.equal(counterPressDenial.primaryScoring?.eventKey, 'denial')
    assert.equal(setupFailures('Count to five out loud each time a team loses the ball.', counterPressDenial).length, 1)
    assert.equal(setupFailures('Mark an escape line across the pitch for each team.', counterPressDenial).length, 0)

    // A regain judged on the five-second window alone has nothing to mark out, so nothing is demanded.
    assert.equal(setupFailures('Play 6v6 in a 40 x 30 m area.', slotFor('RPC-007', 'GF4', 1)).length, 0)

    // The object must carry the rule's own name: the game form's "end zones" are not a finishing zone.
    const chanceCreationZone = slotFor('RPC-004', 'GF3')
    assert.equal(setupFailures('Play in a 40 x 30 m area with two end zones.', chanceCreationZone).length, 1)
    assert.equal(setupFailures('Mark a finishing zone at each end.', chanceCreationZone).length, 0)
}

/**
 * When generation omits the object, the system writes the sentence it already knows, once. Every
 * first-attempt failure on 13 Sep was an omitted or renamed object, and Play Out from the Back failed
 * outright after its retry, so without this a coach gets an error instead of activities.
 */
function testSetupGainsTheObjectWhenGenerationOmitsIt(): void {
    const directive = resolvePrimaryScoring('RPC-004', 'GF3', 1)
    const omitted = 'Play 6v6 in a 40 x 30 m (44 x 33 yd) area with two end zones.'
    const repaired = withScoringObjectInSetup(omitted, directive)
    assert.ok(repaired.startsWith(omitted), "the model's own layout is kept")
    assert.ok(repaired.endsWith(directive.setupRequirement), repaired)
    assert.equal(setupFailures(repaired, slotFor('RPC-004', 'GF3')).length, 0, 'the repaired setup passes the check')
    assert.equal(withScoringObjectInSetup(repaired, directive), repaired, 'idempotent')

    const alreadyMarked = 'Mark a finishing zone at each end. Play 6v6.'
    assert.equal(withScoringObjectInSetup(alreadyMarked, directive), alreadyMarked, 'a setup that marks it is untouched')
    assert.equal(withScoringObjectInSetup('Play 6v6', undefined), 'Play 6v6', 'free-text goals are untouched')
    assert.equal(withScoringObjectInSetup('Play 6v6 in a grid', directive), `Play 6v6 in a grid. ${directive.setupRequirement}`)
}

/** Compression pins the resolved rule; the competing reward from the real evidence cannot lead. */
function testCompressionPinsTheResolvedRule(): void {
    const directive = resolvePrimaryScoring('RPC-005', 'GF9', 1)
    const activity = {
        title: 'Finishing game',
        intent: 'Finish the chances you create.',
        constraint: '',
        setup: 'Play 6v6 with a goal at each end and goalkeepers.',
        rules: [
            'Finishing chances remain live under defensive pressure, with rebounds, clearances, and counter-attacks continuing from the result. A forced chance or turnover gives the defending team immediate access to counter-attack with no reset.',
        ],
        scoringSystem: [
            'A goal or live advantage counts only when the team creates a genuine scoring chance under live defensive pressure and converts it.',
            directive.scoringRule,
            'Score awarded for attacks that use available space to gain advantage — players must progress into the open space before defensive pressure recovers, or the chance is lost.',
        ].join('\n'),
        winCondition: 'Teams compete live under two-sided opposition, and the team with more points when play ends wins.',
        scaffolding: [],
        extensions: [],
        equipmentNeeded: [],
        duration: 20,
        systemTrace: {
            primaryScoring: {
                contextId: directive.contextId,
                eventKey: directive.eventKey,
                objectKey: directive.objectKey,
                scoringRule: directive.scoringRule,
                realizationCoverage: directive.realizationCoverage,
            },
        },
    }
    const scoring = String(compressActivityForCoach(activity as never, []).scoringSystem)
    assert.ok(scoring.startsWith('Earn a point for every goal.'), `Scoring does not lead with the resolved rule: "${scoring}"`)
    assert.doesNotMatch(scoring, /open space|genuine scoring chance/i, `A competing reward survived: "${scoring}"`)

    // Idempotent, like the rest of compression.
    const twice = String(compressActivityForCoach(compressActivityForCoach(activity as never, []), []).scoringSystem)
    assert.equal(twice, scoring)
}

/**
 * CONTEXT-GATED SELECTION. Measured before gating: through the live selector only 9 of 13 guided goals
 * landed on a game form their routed context declares, and Create Scoring Chances landed on Finishing
 * Games, where Chance Creation has no valid event, so primary scoring could only refuse. With the
 * candidate pool gated to the context, every guided goal must land on a declared realization and
 * resolve. A future selector change that breaks this fails here, not in front of a coach.
 */
function testEveryGuidedGoalResolvesThroughContextGatedSelection(): void {
    const originalLog = console.log
    console.log = () => undefined
    try {
        for (const goal of sessionPlanningModel.learningGoals()) {
            const id = String(goal['ID'])
            const name = String(goal['Learning Goal'])
            const rpcId = sessionPlanningModel.rpcRouting().find((route) => route.learningGoalId === id)!.rpcId
            const hints = gateCandidateGameFormsToContext(deriveInputConstraints(name), rpcId)
            const selection = generateSelection({ learningGoals: [name], learningGoalId: id }, hints)
            const formId = selection.archetype.game_form_id
            assert.ok(
                rpcLibrary.gameFormsForContext(rpcId).some((form) => form.relatedId === formId),
                `${id} ${name} selected ${formId}, which ${rpcId} does not declare.`
            )
            assert.equal(resolvePrimaryScoringDirectives(rpcId, formId).length, 3, `${id} ${name} does not resolve.`)
        }
    } finally {
        console.log = originalLog
    }

    // Parser order survives among declared forms; undeclared parser candidates are dropped.
    const gated = gateCandidateGameFormsToContext(
        { candidateArchetypeIds: ['GF9', 'GF3', 'GF1'], candidateAffordanceLensIds: [], candidateConstraintIds: [], matchedSignals: [] },
        'RPC-004'
    )
    assert.deepEqual(gated.candidateArchetypeIds, ['GF3', 'GF2', 'GF7'])
}

testEveryCompatiblePairResolvesToAnApprovedEvent()
testEveryGuidedGoalResolvesThroughContextGatedSelection()
testTheApprovedGapsAreClosedByCoverage()
testTheRightSideOfTheProblemEarnsThePoint()
testBothApprovedDefensiveEventsReachCoaches()
testEmptyIntersectionFailsInsteadOfInferring()
testGameFormStructureUsesTheControlledVocabulary()
testCoachWordingIsCompleteApprovedAndCoachFacing()
testSetupMustMarkTheScoringObject()
testSetupGainsTheObjectWhenGenerationOmitsIt()
testCompressionPinsTheResolvedRule()

console.log('primary-scoring unit tests: all cases passed.')
