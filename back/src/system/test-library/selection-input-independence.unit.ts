/**
 * Unit tests — selection depends only on what the coach said they want players to learn.
 *
 * WHY THIS EXISTS. `challengeLevel` used to be concatenated into the corpus that selection matches
 * lenses and constraints against, which gave the literal token "low" or "high" a vote as a WORD.
 * It changed real outcomes: for "Help players recognize space behind the defense", Comfortable
 * produced End Zone Games while Stretch and Demanding produced Channel Games with a different
 * constraint package.
 *
 * THE BEHAVIOUR GATE COULD NOT HAVE CAUGHT IT. None of the twelve gate inputs pass a challengeLevel,
 * so removing the dependency left the gate byte-identical — the gate had a blind spot exactly where
 * the defect lived. That is the argument for this file: a gate over fixed inputs proves the engine
 * is stable, not that its inputs are the ones we intend.
 *
 * WHAT IT GUARDS GENERALLY. Any value that is an enum, id or internal code must not reach the
 * matching corpus. Such values match by coincidence, and a coincidental match is indistinguishable
 * from a real one in the generated activity — nothing errors, the coach just gets a different game.
 *
 * Run: part of `npm test`.
 */
import assert from 'node:assert/strict'

import { deriveInputConstraints } from '../input-constraints/deriveInputConstraints'
import { sessionPlanningModel } from '../session-planning/session-planning-model'
import { generateSelection } from './generateSelection'

function selectionFor(goal: string, options: { challengeLevel?: string; learningGoalId?: string } = {}) {
    return generateSelection(
        { learningGoals: [goal], challengeLevel: options.challengeLevel, learningGoalId: options.learningGoalId },
        deriveInputConstraints(goal)
    )
}

/** A selection reduced to the decisions a coach would actually notice. */
function decisionFingerprint(goal: string, challengeLevel?: string, learningGoalId?: string): string {
    const selection = selectionFor(goal, { challengeLevel, learningGoalId })
    return JSON.stringify({
        archetype: selection.archetype.game_form_name,
        lenses: selection.affordanceLenses.map((lens) => lens.title),
        constraints: selection.constraints.map((constraint) => constraint.title),
    })
}

function routeForGoal(learningGoalId: string): string | null {
    return sessionPlanningModel.rpcRouting().find((route) => route.learningGoalId === learningGoalId)?.rpcId ?? null
}

/**
 * Challenge must not influence WHICH activity is selected.
 *
 * Christian's Adaptive Learning Architecture Review is explicit that Challenge is a property of the
 * learner-environment interaction, not a selection input. It still reaches Experience Design, where
 * it is read as a value rather than as text.
 *
 * "Help players recognize space behind the defense" is included deliberately: it is the goal that
 * actually broke, so this would have failed before the fix rather than passing vacuously.
 */
function testChallengeDoesNotInfluenceSelection(): void {
    const goals = [
        'Help players recognize space behind the defense.',
        'We want players to create better support angles under pressure.',
        'Help players break defensive lines.',
        'improve first touch under pressure',
        'Create more attacking opportunities without forcing specific passes.',
    ]

    for (const goal of goals) {
        const fingerprints = new Set(
            [undefined, 'low', 'medium', 'high'].map((challengeLevel) => decisionFingerprint(goal, challengeLevel))
        )
        assert.equal(
            fingerprints.size,
            1,
            `"${goal}" selects differently depending on Challenge. Challenge is not a selection input — ` +
                `check whether it has leaked back into the matching corpus.`
        )
    }
}

/**
 * The general property, tested with a value no coach would ever type.
 *
 * If any future field is concatenated into the corpus without thought, a nonsense token in it will
 * change the outcome and this fails. Cheaper than re-deriving the argument each time someone adds
 * a field to the selection input.
 */
function testUnrelatedInputValuesDoNotInfluenceSelection(): void {
    const goal = 'Help players recognize space behind the defense.'
    const baseline = decisionFingerprint(goal)

    for (const noise of ['low', 'HIGH', 'zzzz-not-a-word', 'break lines finishing possession']) {
        assert.equal(
            decisionFingerprint(goal, noise),
            baseline,
            `Passing "${noise}" as challengeLevel changed the selection. Only the coach's own goal text ` +
                `may reach the matching corpus.`
        )
    }
}

function testLearningGoalIdDoesNotInfluenceSelection(): void {
    for (const goal of sessionPlanningModel.learningGoals()) {
        const id = String(goal['ID'])
        const name = String(goal['Learning Goal'] ?? '')
        const withoutId = selectionFor(name)
        const withId = selectionFor(name, { learningGoalId: id })

        assert.equal(
            decisionFingerprint(name, undefined, id),
            decisionFingerprint(name),
            `${id} ${name} selects differently when the chosen goal id is present. The id must stay out of matching.`
        )
        assert.equal(
            withId.selectionTrace.queryCorpus,
            withoutId.selectionTrace.queryCorpus,
            `${id} ${name} changed selectionTrace.queryCorpus. The id has leaked into the matching corpus.`
        )
    }
}

function testLearningGoalIdTraceRecordsRoute(): void {
    for (const goal of sessionPlanningModel.learningGoals()) {
        const id = String(goal['ID'])
        const name = String(goal['Learning Goal'] ?? '')
        const selection = selectionFor(name, { learningGoalId: id })

        assert.deepEqual(
            selection.selectionTrace.planning,
            { learningGoalId: id, routedRpcId: routeForGoal(id) },
            `${id} ${name} did not record its Session Planning route in the selection trace.`
        )
    }

    const goalName = (id: string): string => String(sessionPlanningModel.learningGoal(id)?.['Learning Goal'] ?? '')
    assert.deepEqual(selectionFor(goalName('A06'), { learningGoalId: 'A06' }).selectionTrace.planning, {
        learningGoalId: 'A06',
        routedRpcId: 'RPC-005',
    })
    assert.deepEqual(selectionFor(goalName('A01'), { learningGoalId: 'A01' }).selectionTrace.planning, {
        learningGoalId: 'A01',
        routedRpcId: 'RPC-001',
    })
}

function testFreeTextRecordsNoPlanning(): void {
    const selection = selectionFor('Help players recognize space behind the defense.')
    assert.equal(selection.selectionTrace.planning, undefined)
}

function testUnknownLearningGoalIdFailsLoudly(): void {
    assert.throws(
        () => selectionFor('Help players recognize space behind the defense.', { learningGoalId: 'NOPE' }),
        /NOPE/
    )
}
function runAll(): void {
    testChallengeDoesNotInfluenceSelection()
    testUnrelatedInputValuesDoNotInfluenceSelection()
    testLearningGoalIdDoesNotInfluenceSelection()
    testLearningGoalIdTraceRecordsRoute()
    testFreeTextRecordsNoPlanning()
    testUnknownLearningGoalIdFailsLoudly()
    console.log('selection-input-independence unit tests: all cases passed.')
}

runAll()
