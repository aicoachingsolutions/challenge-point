/**
 * THE CONTRACT BETWEEN THE MAPPER AND THE OUTPUT VALIDATOR.
 *
 * Why this file exists. On 2026-08-16 the app could not generate a single activity. The mapper
 * (`mapStructuredActivityToLegacy`) stopped prepending three constraint titles to the coach-facing
 * `constraint` field, and the output validator still required those titles to be present in it.
 * Two deterministic pieces of our own code, one writing a field and the other asserting its shape,
 * disagreeing — so EVERY generation was rejected, for every goal, on the first activity.
 *
 * Nothing caught it:
 *   - no unit test exercised the mapper and the validator together;
 *   - the generation harness kept its OWN copy of the mapper, so the harness satisfied the validator
 *     while production did not — verification was testing a fork of production;
 *   - a real generation run needs an API key, which the development environment does not have.
 *
 * The third point is why this test is written the way it is. The failure needed no model at all:
 * both halves are deterministic, so a synthetic activity standing in for the model's output is
 * enough to prove they still agree. **The AI was never required to detect this — only assumed to be.**
 *
 * What this pins:
 *   1. Mapper output passes the output validator, for real selections built by the real pipeline.
 *   2. The coach-facing constraint field carries no internal object names.
 */
import assert from 'node:assert/strict'

// Imported from the mapper's own module, NOT from completion.service — that module builds an OpenAI
// client at load time, so importing it here would make this test require an API key and it would
// stop running exactly where it is needed most.
import { mapStructuredActivityToLegacy } from './map-structured-activity-to-legacy'
import { deriveInputConstraints } from '../input-constraints/deriveInputConstraints'
import { generateSelection, systemAssemblyInputFromTestLibrarySelection } from '../test-library'
import { validateGeneratedActivities } from '../validate-generated-activity'
import type { SystemAssemblyInput } from '../types'
import type { Activity } from './activity-schema'
import type { IActivity } from '../../models/activity.model'
import type { ISession } from '../../models/session.model'
import { SessionStatus } from '../../models/session.model'

/** Goals chosen to route through different signal groups, so several constraint packages are covered. */
const GOALS = [
    'Players keep winning the ball but turning away from field vision',
    'My team struggles to keep possession under pressure',
    'We give the ball away trying to play forward too early',
]

function buildSession(): ISession {
    const now = new Date()
    return {
        _id: 'assembly-output-contract-session',
        createdBy: 'assembly-output-contract-user' as unknown as ISession['createdBy'],
        name: 'Assembly Output Contract Session',
        sessionStatus: SessionStatus['In Progress'],
        playerCount: 12,
        fieldLength: '40',
        fieldWidth: '30',
        fieldType: 'grass',
        createdAt: now,
        updatedAt: now,
    }
}

/**
 * Stands in for what the model returns. Deliberately written in plain coaching language that does
 * NOT contain any of our internal object names — if the validator needs one of those to accept an
 * activity, that is the defect this file exists to catch, and the test must fail rather than help it.
 */
function syntheticActivity(index: number): Activity {
    return {
        title: `Contract Test Activity ${index + 1}`,
        setup: 'Two teams play in a 40x30 area with a halfway line and a target zone at each end.',
        teams: 'Two teams of six, each defending one end.',
        objective: 'Players choose when to travel forward and when to keep the ball, based on what the defenders show them.',
        rules: [
            'A team scores by carrying the ball into the far target zone; losing it there hands the opponent an immediate counter from that zone.',
            'Play restarts from the team that did not put the ball out, and stays live until it leaves the area.',
            'Players may move freely between zones and decide their own moment to travel forward.',
        ],
        scoring: 'One point for a controlled entry into the far target zone.\nThe opponent earns one point if they win the ball inside that zone and travel out of it.',
        constraints: [
            'Defenders may only be committed once the ball has crossed the halfway line.',
            'The receiving team must be facing forward before the ball can enter the target zone.',
        ],
        coachingFocus: [
            'Notice when players read the defender before deciding to travel.',
            'Notice which options open up when the ball is played early.',
        ],
        validation: {
            hasOpposition: true,
            hasDecisionMaking: true,
            hasConsequence: true,
            avoidsPrescriptiveActions: true,
        },
    }
}

function buildAssemblyInput(goal: string): SystemAssemblyInput {
    const inputConstraints = deriveInputConstraints(goal)
    const selection = generateSelection({ learningGoals: [goal], challengeLevel: 'intermediate' }, inputConstraints)

    return systemAssemblyInputFromTestLibrarySelection({
        selection,
        session: buildSession(),
        previousActivities: [] as IActivity[],
        coachInput: { challengeLevel: 'intermediate', duration: 20, learningGoals: [goal] },
    })
}

/** Every internal name a coach must never read, taken from the selection actually made. */
function internalNames(input: SystemAssemblyInput): string[] {
    return [
        input.constraintPackage.foundation.constraint.title,
        input.constraintPackage.shaping.constraint.title,
        input.constraintPackage.consequence?.constraint.title,
    ].filter((name): name is string => typeof name === 'string' && name.trim().length > 0)
}

function testMapperOutputSatisfiesValidator(): void {
    for (const goal of GOALS) {
        const input = buildAssemblyInput(goal)
        const generatedActivities = [0, 1, 2].map((index) => mapStructuredActivityToLegacy(syntheticActivity(index), input))

        // The whole point: the two halves are exercised TOGETHER. Either alone proves nothing.
        const validated = validateGeneratedActivities({ generatedActivities }, input)

        assert.equal(validated.length, 3, `Expected 3 validated activities for goal: ${goal}`)
    }
}

function testCoachFacingConstraintCarriesNoInternalNames(): void {
    for (const goal of GOALS) {
        const input = buildAssemblyInput(goal)
        const generatedActivities = [0, 1, 2].map((index) => mapStructuredActivityToLegacy(syntheticActivity(index), input))
        const validated = validateGeneratedActivities({ generatedActivities }, input)

        for (const [index, activity] of validated.entries()) {
            const constraintText = String(activity.constraint ?? '').toLowerCase()

            for (const name of internalNames(input)) {
                assert.ok(
                    !constraintText.includes(name.toLowerCase()),
                    `Activity ${index + 1} for "${goal}" leaks the internal constraint name "${name}" ` +
                        `into the coach-facing constraint field (rendered as "Constraint: ..." in the session view).`
                )
            }
        }
    }
}

/**
 * The validator returns the activity a coach ultimately reads, so a field it silently drops is a
 * field that disappears from the UI. Pinning the coach-facing ones stops a future allowlist edit
 * from removing content without a test noticing.
 */
function testValidatorPreservesCoachFacingFields(): void {
    const input = buildAssemblyInput(GOALS[0])
    const generatedActivities = [0, 1, 2].map((index) => mapStructuredActivityToLegacy(syntheticActivity(index), input))
    const validated = validateGeneratedActivities({ generatedActivities }, input)

    for (const activity of validated) {
        assert.ok(String(activity.constraint ?? '').trim().length > 0, 'constraint must not be empty')
        assert.ok(String(activity.setup ?? '').trim().length > 0, 'setup must survive validation')
        assert.ok(Array.isArray(activity.rules) && activity.rules.length > 0, 'rules must survive validation')
        assert.ok(String(activity.scoringSystem ?? '').trim().length > 0, 'scoringSystem must survive validation')
    }
}

testMapperOutputSatisfiesValidator()
testCoachFacingConstraintCarriesNoInternalNames()
testValidatorPreservesCoachFacingFields()

console.log('assembly-output-contract unit tests: all cases passed.')
