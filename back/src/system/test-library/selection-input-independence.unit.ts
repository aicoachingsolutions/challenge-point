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
import { constraintPoolFor, generateSelection, isSelectionKnowledgeGap } from './generateSelection'

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

/**
 * The goal id never reaches MATCHING — and since 14 October it scopes the constraint pool, and nothing else.
 *
 * Re-pointed 14 October 2026. This asserted that a selection with the id was identical to one without it,
 * which held because the id was trace-only. His ruling of that day gives the id one job: *"Selection should
 * only use constraints authorized for the Learning Goal, rather than silently drawing from the broader library
 * when a suitable candidate is missing"* — and the Learning Goal is known only by its id. So the id now decides
 * which constraints selection may draw from (`constraintPoolFor`), and the test is moved to what it was really
 * about: the id stays out of the matching corpus, and where it changes a selection, the change is the pool's.
 *
 *   - The matching corpus is identical with and without the id (unchanged).
 *   - Where the goal's own pool is what the wording alone would have drawn from — no fallback, nothing held —
 *     the selection is identical, decision for decision (unchanged).
 *   - Where it is not, the selection with the id draws only from the goal's candidates minus what is held, or
 *     the goal is reported as a knowledge gap. Never anything else.
 */
function testLearningGoalIdDoesNotInfluenceSelection(): void {
    let samePool = 0
    for (const goal of sessionPlanningModel.learningGoals()) {
        const id = String(goal['ID'])
        const name = String(goal['Learning Goal'] ?? '')
        const withoutId = selectionFor(name)
        const hints = deriveInputConstraints(name)
        const wordingPool = constraintPoolFor(hints)
        const goalPool = constraintPoolFor(hints, id)
        let withId: ReturnType<typeof selectionFor> | null = null
        try {
            withId = selectionFor(name, { learningGoalId: id })
        } catch (error) {
            assert.ok(isSelectionKnowledgeGap(error), `${id} ${name}: ${(error as Error).message}`)
            assert.notDeepEqual(goalPool.constraints.map((c) => c.id), wordingPool.constraints.map((c) => c.id), `${id}: a gap only where the goal's pool is not the wording's`)
            continue
        }

        assert.equal(
            withId.selectionTrace.queryCorpus,
            withoutId.selectionTrace.queryCorpus,
            `${id} ${name} changed selectionTrace.queryCorpus. The id has leaked into the matching corpus.`
        )
        const poolIds = new Set(goalPool.constraints.map((c) => c.id))
        if (wordingPool.source === 'GOAL_CANDIDATES' && goalPool.heldByRuling.length === 0) {
            samePool++
            assert.equal(
                decisionFingerprint(name, undefined, id),
                decisionFingerprint(name),
                `${id} ${name} selects differently when the chosen goal id is present, though its pool is the same. The id must stay out of matching.`
            )
        }
        for (const constraint of withId.constraints) {
            assert.ok(poolIds.has(constraint.id), `${id} ${name}: ${constraint.id} is outside the goal's own candidates, or held`)
        }
    }
    assert.ok(samePool > 0, 'at least one goal draws from the same pool either way, so the identity half is exercised')
}

function testLearningGoalIdTraceRecordsRoute(): void {
    for (const goal of sessionPlanningModel.learningGoals()) {
        const id = String(goal['ID'])
        const name = String(goal['Learning Goal'] ?? '')
        let selection: ReturnType<typeof selectionFor>
        try {
            selection = selectionFor(name, { learningGoalId: id })
        } catch (error) {
            // A knowledge gap (14 October) has no trace to record a route in; it names the goal instead.
            assert.ok(isSelectionKnowledgeGap(error) && error.learningGoalId === id, `${id} ${name}: ${(error as Error).message}`)
            continue
        }

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
