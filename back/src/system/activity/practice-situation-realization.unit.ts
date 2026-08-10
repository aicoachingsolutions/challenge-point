/**
 * Unit tests — IC-002 Practice Situation Runtime Contract.
 *
 * The contract's invariants are what these assert, driven by the REAL Practice Situation Registry
 * rather than invented fixtures. That matters here: Invariant 1 failed in production against real
 * data while passing any reasonable synthetic test, because the collapse came from two authored
 * situations happening to route identically through the parser. Testing with his actual 20 rows is
 * the only version of this test that would have caught it.
 *
 * Invariants 2 and 3 (changing the situation must not change the Learning Goal or Learning Stage)
 * are structural — this module runs after selection and returns prompt text — so they are argued at
 * the call site rather than asserted here. See learning-stage-realization.unit.ts for why a test
 * that cannot fail is worse than no test.
 *
 * Run: part of `npm test`.
 */
import assert from 'node:assert/strict'

import { practiceSituationDirective } from './practice-situation-realization'
import { sessionPlanningModel } from '../session-planning/session-planning-model'

function allSituations(): Array<{ id: string; name: string; definition: string }> {
    return sessionPlanningModel.learningGoals().flatMap((goal) =>
        sessionPlanningModel.practiceSituationsFor(String(goal['ID'])).map((situation) => ({
            id: String(situation['ID']),
            name: String(situation['Practice Situation'] ?? ''),
            definition: String(situation['Definition'] ?? ''),
        }))
    )
}

/**
 * INVARIANT 1 — changing Practice Situation MUST produce a recognizably different representative
 * context. Checked across EVERY authored situation, because this is precisely where the previous
 * implementation failed: routing "Play Through Pressure" through four situations produced only two
 * distinct activities.
 */
function testEverySituationProducesADistinctContext(): void {
    const situations = allSituations()
    assert.ok(situations.length >= 20, `Expected the registry to be populated; found ${situations.length}.`)

    const byGoal = new Map<string, string[]>()
    for (const goal of sessionPlanningModel.learningGoals()) {
        const id = String(goal['ID'])
        const directives = sessionPlanningModel
            .practiceSituationsFor(id)
            .map((situation) =>
                practiceSituationDirective({
                    id: String(situation['ID']),
                    name: String(situation['Practice Situation'] ?? ''),
                    definition: String(situation['Definition'] ?? ''),
                }).join('\n')
            )
        if (directives.length > 1) byGoal.set(id, directives)
    }

    for (const [goalId, directives] of byGoal) {
        const distinct = new Set(directives)
        assert.equal(
            distinct.size,
            directives.length,
            `Learning Goal ${goalId} has ${directives.length} Practice Situations but only ${distinct.size} distinct ` +
                `contexts. Invariant 1 requires each to produce a recognizably different representative context.`
        )
    }
}

/** Every situation's authored knowledge must actually reach the brief, not be summarised away. */
function testAuthoredKnowledgeIsCarriedThrough(): void {
    for (const situation of allSituations()) {
        const directive = practiceSituationDirective(situation).join('\n')
        assert.ok(
            directive.toUpperCase().includes(situation.name.toUpperCase()),
            `${situation.id} lost its authored name.`
        )
        if (situation.definition.trim()) {
            assert.ok(directive.includes(situation.definition.trim()), `${situation.id} lost its authored definition.`)
        }
    }
}

/**
 * IC-002 §5 — a Practice Situation MUST NOT be interpreted as a synonym for a single Game Problem.
 * The directive has to say so, or the model narrows the activity to whichever problem the name most
 * suggests and discards the others the context should present.
 */
function testDirectiveForbidsCollapsingToOneProblem(): void {
    const directive = practiceSituationDirective({
        id: 'A01-01',
        name: 'Against High Pressure',
        definition: 'Opponents aggressively press.',
    })
        .join(' ')
        .toLowerCase()

    assert.ok(
        directive.includes('do not narrow the activity to only'),
        'The directive must forbid collapsing the context into a single problem.'
    )
    assert.ok(
        /competitive context, not the learning objective/.test(directive),
        'The directive must state that the situation is context rather than objective.'
    )
    // Invariant 4 — changing Practice Situation must not reduce representative fidelity.
    assert.ok(directive.includes('less representative'), 'The directive must protect representative fidelity.')
    // Invariant 2, restated in the prompt so the model cannot drift the goal to fit the context.
    assert.ok(directive.includes('do not rename or replace the learning goal'), 'The directive must protect the goal.')
}

/** No situation selected is a normal state — several goals have none and the step is skipped. */
function testAbsentSituationProducesNoDirective(): void {
    assert.deepEqual(practiceSituationDirective(null), [])
    assert.deepEqual(practiceSituationDirective(undefined), [])
    assert.deepEqual(
        practiceSituationDirective({ id: 'X', name: '   ', definition: 'something' }),
        [],
        'A blank name must produce no framing rather than an empty heading.'
    )
}

function runAll(): void {
    testEverySituationProducesADistinctContext()
    testAuthoredKnowledgeIsCarriedThrough()
    testDirectiveForbidsCollapsingToOneProblem()
    testAbsentSituationProducesNoDirective()
    console.log('practice-situation-realization unit tests: all cases passed.')
}

runAll()
