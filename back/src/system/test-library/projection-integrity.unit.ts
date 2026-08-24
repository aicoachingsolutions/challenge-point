/**
 * AUTHORED KNOWLEDGE MUST SURVIVE THE TRIP TO RUNTIME.
 *
 * Four times in one week, authored content reached the engine and was silently discarded by a
 * projection that copies a named list of fields and drops everything else:
 *
 *   setup                 dropped by the output validator's allowlist reconstruction
 *   howToPlay             dropped by the same allowlist, one field further down
 *   incentiveMechanism    dropped by constraintToIConstraint — with visibilityEffect,
 *   visibilityEffect      primaryConstraintType and targetAffordancePrimary, i.e. EVERY field the
 *   primaryConstraintType constraint-metadata overlay reads, so the overlay produced nothing at all
 *
 * None of them failed. The value became `undefined`, some fallback covered for it, and the output
 * stayed plausible — so the loss surfaced weeks later as a design complaint ("the activities don't
 * express different incentive mechanisms") rather than as a bug. Christian's summary is the right
 * one: the architecture was not the problem, the authored knowledge was not reaching the runtime.
 *
 * Discipline cannot maintain this. A projection is written once and read never; the field that
 * matters is the one nobody remembered to add. So this is a guard, in the same spirit as the
 * sport-coupling ratchet: name the fields the runtime actually consumes, and fail the build when one
 * stops arriving.
 *
 * ADDING A FIELD HERE IS THE POINT. If you write code that reads an authored field, add it below. If
 * this test fails, some projection between the workbook and the runtime stopped carrying it — do not
 * relax the assertion, find the projection.
 */
import assert from 'node:assert/strict'

import { SessionStatus, type ISession } from '../../models/session.model'
import type { IActivity } from '../../models/activity.model'
import { deriveInputConstraints } from '../input-constraints/deriveInputConstraints'
import { generateSelection, systemAssemblyInputFromTestLibrarySelection } from '.'
import { expressIncentive } from '../activity/incentive-expression'

/**
 * Fields with live consumers, and where they are read. Each entry is a promise that something in the
 * engine will look for this and quietly do nothing if it is missing.
 */
const CONSTRAINT_FIELDS_WITH_CONSUMERS: Array<{ field: string; readBy: string }> = [
    { field: 'title', readBy: 'coach-facing constraint lines, selection scoring' },
    { field: 'description', readBy: 'incentive-expression conditionPhrase, matching corpus' },
    { field: 'designIntent', readBy: 'incentive-expression conditionPhrase, coach-facing lines' },
    { field: 'incentiveMechanism', readBy: 'incentive-expression — HOW the game rewards' },
    { field: 'visibilityEffect', readBy: 'build-constraint-package visibility overlay' },
    { field: 'primaryConstraintType', readBy: 'build-constraint-package type overlay' },
    { field: 'targetAffordancePrimary', readBy: 'build-constraint-package decision overlay, +10 lens bonus' },
]

/** Goals chosen so the selected packages between them carry every field above. */
const GOALS = [
    'Switch the point of attack',
    'My team struggles to keep possession under pressure',
    'Players keep winning the ball but turning away from field vision',
]

function buildInput(goal: string) {
    const now = new Date()
    const session = {
        _id: 'projection-integrity',
        createdBy: 'projection-integrity' as unknown as ISession['createdBy'],
        name: 'projection-integrity',
        sessionStatus: SessionStatus['In Progress'],
        playerCount: 16,
        fieldLength: '60',
        fieldWidth: '40',
        fieldType: 'grass',
        createdAt: now,
        updatedAt: now,
    } as unknown as ISession

    const inputConstraints = deriveInputConstraints(goal)
    const selection = generateSelection({ learningGoals: [goal], challengeLevel: 'intermediate' }, inputConstraints)
    return systemAssemblyInputFromTestLibrarySelection({
        selection,
        session,
        previousActivities: [] as IActivity[],
        coachInput: { challengeLevel: 'intermediate', duration: 20, learningGoals: [goal] },
    })
}

/**
 * Every field with a consumer must ARRIVE on at least one selected constraint somewhere across the
 * sample. A field that is `undefined` on every constraint of every goal is not sparse authoring —
 * it is a projection dropping it, which is exactly what happened to incentiveMechanism.
 */
function testEveryConsumedFieldSurvivesTheProjection(): void {
    const seen = new Set<string>()

    for (const goal of GOALS) {
        const pkg = buildInput(goal).constraintPackage
        for (const candidate of [pkg.foundation, pkg.shaping, pkg.consequence]) {
            const constraint = candidate?.constraint as unknown as Record<string, unknown> | undefined
            if (!constraint) continue
            for (const { field } of CONSTRAINT_FIELDS_WITH_CONSUMERS) {
                const value = constraint[field]
                if (value !== undefined && value !== null && String(value).trim().length > 0) seen.add(field)
            }
        }
    }

    const missing = CONSTRAINT_FIELDS_WITH_CONSUMERS.filter((f) => !seen.has(f.field))
    assert.equal(
        missing.length,
        0,
        'Authored fields never reached the runtime — a projection is dropping them silently:\n' +
            missing.map((m) => `  - ${m.field}  (read by: ${m.readBy})`).join('\n') +
            '\nCheck constraintToIConstraint in systemAssemblyInputFromSelection.ts first; it is an ' +
            'allowlist and has dropped four of these before.'
    )
}

/**
 * The specific one that cost a week. Incentive mechanisms are authored on the realizations sheet;
 * if none of them reach a selected constraint, every activity collapses to the generic scoring
 * template again and it will look like a wording problem rather than a plumbing one.
 */
function testIncentiveMechanismsReachSelectedConstraints(): void {
    const found: string[] = []

    for (const goal of GOALS) {
        const pkg = buildInput(goal).constraintPackage
        for (const candidate of [pkg.foundation, pkg.shaping, pkg.consequence]) {
            const mechanism = (candidate?.constraint as unknown as { incentiveMechanism?: string })?.incentiveMechanism
            if (typeof mechanism === 'string' && mechanism.trim() && mechanism !== 'none') found.push(mechanism)
        }
    }

    assert.ok(
        found.length > 0,
        'No selected constraint carried an authored incentive mechanism. Either the projection dropped ' +
            'the field again, or every selected constraint is authored as "none" — check which before ' +
            'assuming the scoring language is the problem.'
    )
}

/**
 * THE PATH FOR KNOWLEDGE THAT DOES NOT EXIST YET.
 *
 * `incentive_patterns` is empty on all 23 authored rows, so no assertion about live data can say
 * anything about it — and a test that quietly passes because there is nothing to check is precisely
 * the vacuous-assertion problem found earlier this week. So this proves the PLUMBING instead: a
 * constraint carrying authored phrasing must have that phrasing win over the derived sentence.
 *
 * Wired before the knowledge exists on purpose. The alternative is Christian authoring 23 rows,
 * seeing no change in the output, and concluding the feature does not work.
 */
function testAuthoredPhrasingWouldOutrankTheDerivedSentence(): void {
    const authored = 'A switch that reaches the far channel unlocks a second target goal'
    const derived = expressIncentive('scoring_bonus', {
        designIntent: 'Switch play',
        description: 'Reward switching play across the field',
    })
    const withAuthored = expressIncentive('scoring_bonus', {
        designIntent: 'Switch play',
        description: 'Reward switching play across the field',
        incentivePatterns: [authored],
    })

    assert.ok(derived, 'sanity: the derived sentence should exist to be outranked')
    assert.equal(withAuthored, `${authored}.`, 'authored phrasing must be used verbatim')
    assert.notEqual(withAuthored, derived, 'authored phrasing must replace the derived sentence, not sit beside it')
}

testEveryConsumedFieldSurvivesTheProjection()
testIncentiveMechanismsReachSelectedConstraints()
testAuthoredPhrasingWouldOutrankTheDerivedSentence()

console.log('projection-integrity unit tests: all cases passed.')
