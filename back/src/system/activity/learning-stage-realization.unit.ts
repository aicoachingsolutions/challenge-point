/**
 * Unit tests — IC-001 Learning Stage Implementation Contract.
 *
 * These test the CONTRACT's invariants, not the implementation's shape. IC-001 is explicit that the
 * runtime may satisfy it however it likes provided the observable behaviour holds, so pinning the
 * exact directive wording would test our choices rather than his requirements — and would have to be
 * rewritten every time the phrasing improved.
 *
 * Invariants 1 and 2 (changing Learning Stage must not change the selected Learning Goal or Practice
 * Situation) are NOT tested here, deliberately. They hold by construction: this module runs after
 * selection is complete and returns prompt text, so it has no route to a selection decision. A test
 * asserting "the goal did not change" would pass forever whether or not the property was real, which
 * is worse than no test — it would look like protection. The structural argument is written down at
 * the call site in build-activity-skeleton instead.
 *
 * Run: part of `npm test`.
 */
import assert from 'node:assert/strict'

import { LEARNING_STAGES, isLearningStage, learningStageDirective, learningStageLabel } from './learning-stage-realization'

/** IC-001 §4 — the three supported values, no more and no fewer. */
function testSupportedValues(): void {
    assert.deepEqual(
        [...LEARNING_STAGES],
        ['first_time_exploring', 'building_understanding', 'reinforcing_refining'],
        'IC-001 §4 defines exactly three Learning Stages.'
    )
    for (const stage of LEARNING_STAGES) {
        assert.ok(isLearningStage(stage))
        assert.ok(learningStageLabel(stage).length > 0, `${stage} must have a coach-facing label.`)
    }
    assert.ok(!isLearningStage('advanced'), 'An unknown stage must not be accepted.')
    assert.ok(!isLearningStage(undefined))
}

/**
 * INVARIANT 4 — changing Learning Stage MUST produce a recognizably different learning experience.
 *
 * Checked as genuine difference in CONTENT, not just in the label. An implementation that emitted
 * the same guidance under three different headings would pass a naive comparison and fail the
 * contract's intent, which is the failure this whole change exists to fix.
 */
function testEachStageIsRecognizablyDifferent(): void {
    const directives = LEARNING_STAGES.map((stage) => learningStageDirective(stage))

    for (const directive of directives) {
        assert.ok(directive.length > 0, 'Every supported stage must produce a directive.')
    }

    // Compare the guidance BODY with labels and shared boilerplate stripped, so the difference has
    // to come from the substance of what each stage asks for.
    const bodies = directives.map((directive) =>
        directive
            .filter((line) => line.trim().startsWith('-'))
            .join(' ')
            .toLowerCase()
    )
    for (let i = 0; i < bodies.length; i += 1) {
        for (let j = i + 1; j < bodies.length; j += 1) {
            assert.notEqual(
                bodies[i],
                bodies[j],
                `${LEARNING_STAGES[i]} and ${LEARNING_STAGES[j]} produce identical guidance — Invariant 4 requires a recognizably different experience.`
            )
        }
    }

    // And the difference should be substantive: each stage must contribute vocabulary the others do
    // not, which is what makes the experiences different in kind rather than in degree.
    for (let i = 0; i < bodies.length; i += 1) {
        const own = new Set(bodies[i].split(/\W+/).filter((w) => w.length > 4))
        const others = new Set(bodies.filter((_, j) => j !== i).join(' ').split(/\W+/))
        const distinctive = [...own].filter((word) => !others.has(word))
        assert.ok(
            distinctive.length >= 3,
            `${LEARNING_STAGES[i]} shares almost all its language with the other stages (distinctive: ${distinctive.join(', ')}).`
        )
    }
}

/**
 * IC-001 §5 — Learning Stage MUST NOT influence WHAT players are learning. The directive must
 * therefore never instruct a change to the selected goal, situation, or constraint package.
 */
function testDirectiveDoesNotTouchSelection(): void {
    for (const stage of LEARNING_STAGES) {
        const text = learningStageDirective(stage).join(' ').toLowerCase()
        assert.ok(
            /already decided|must not change/.test(text),
            `${stage} directive must state that the selection is fixed.`
        )
        for (const forbidden of ['choose a different', 'pick another', 'replace the constraint', 'change the game form']) {
            assert.ok(!text.includes(forbidden), `${stage} directive must not instruct a selection change ("${forbidden}").`)
        }
    }
}

/**
 * INVARIANT 5 — representative information MUST remain representative at every stage. "Simplified
 * constraints" at the exploring stage could otherwise be read as licence to strip the problem out
 * and produce a drill.
 */
function testRepresentativenessIsProtected(): void {
    for (const stage of LEARNING_STAGES) {
        const text = learningStageDirective(stage).join(' ').toLowerCase()
        assert.ok(
            text.includes('representative'),
            `${stage} directive must keep representativeness explicit.`
        )
    }
    const exploring = learningStageDirective('first_time_exploring').join(' ').toLowerCase()
    assert.ok(
        exploring.includes('do not make the activity less representative'),
        'The simplifying stage in particular must forbid trading away representativeness.'
    )
}

/**
 * An ABSENT stage produces nothing. The free-text form never asks, and defaulting would attribute a
 * planning decision the coach never made — IC-001 §4 says the experience provides the stage.
 */
function testAbsentStageProducesNoDirective(): void {
    for (const value of [undefined, null, '', 'not_a_stage', 42]) {
        assert.deepEqual(
            learningStageDirective(value),
            [],
            `An absent or unrecognised stage (${JSON.stringify(value)}) must produce no directive rather than a default.`
        )
    }
}

function runAll(): void {
    testSupportedValues()
    testEachStageIsRecognizablyDifferent()
    testDirectiveDoesNotTouchSelection()
    testRepresentativenessIsProtected()
    testAbsentStageProducesNoDirective()
    console.log('learning-stage-realization unit tests: all cases passed.')
}

runAll()
