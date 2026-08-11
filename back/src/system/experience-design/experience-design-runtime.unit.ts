/**
 * Unit tests — Experience Design Runtime Decision Rules RC1.
 *
 * These assert the CONTRACT's behaviour, driven by the real workbook. The properties that matter are
 * the ones the Decision Rules state as requirements rather than preferences: the entry condition,
 * determinism, the pilot limit of one intervention, the preference ordering, and the recovery path.
 *
 * Run: part of `npm test`.
 */
import assert from 'node:assert/strict'

import {
    type ExperienceDesignInput,
    decideExperienceDesign,
    eligibleInterventions,
    needsEnhancement,
    preferenceRank,
    selectIntervention,
    validateExperience,
} from './experience-design-runtime'
import { representativeInterventionLibrary as library } from './representative-intervention-library'

const input = (overrides: Partial<ExperienceDesignInput> = {}): ExperienceDesignInput => ({
    representativeValidationPassed: true,
    challengeLevel: 'medium',
    targetAffordances: ['Scanning', 'Support'],
    ...overrides,
})

/**
 * THE ENTRY CONDITION, which the Decision Rules state before anything else: Experience Design runs
 * only after Representative Validation succeeds and "never compensates for non-representative
 * activity design". A failing activity must come back untouched.
 */
function testNeverRunsOnFailedValidation(): void {
    const result = decideExperienceDesign(input({ representativeValidationPassed: false, challengeLevel: 'high' }))
    assert.equal(result.applied, false)
    assert.equal(result.intervention, null)
    assert.ok(/never compensates/i.test(result.reason), `Reason should cite the entry condition. Got: ${result.reason}`)
}

/** DECISION 1 — the pilot heuristic. Comfortable normally gets no stakes; Stretch/Demanding evaluate. */
function testDecision1ChallengeHeuristic(): void {
    assert.equal(needsEnhancement('low'), false, 'Comfortable must not normally invite Representative Stakes.')
    assert.equal(needsEnhancement('medium'), true)
    assert.equal(needsEnhancement('high'), true)

    const comfortable = decideExperienceDesign(input({ challengeLevel: 'low' }))
    assert.equal(comfortable.applied, false)
    assert.ok(/comfortable/i.test(comfortable.reason))
}

/** DECISION 4 — Challenge eligibility is real filtering, not a pass-through. */
function testDecision4FiltersByChallenge(): void {
    const stretch = eligibleInterventions(input({ challengeLevel: 'medium' })).map((i) => i.id)
    const demanding = eligibleInterventions(input({ challengeLevel: 'high' })).map((i) => i.id)
    const comfortable = eligibleInterventions(input({ challengeLevel: 'low' })).map((i) => i.id)

    for (const set of [stretch, demanding, comfortable]) {
        assert.ok(set.length > 0, 'Every challenge level must reach some intervention.')
        assert.ok(set.length < library.interventions().length, 'Eligibility must actually exclude something.')
    }
    assert.notDeepEqual(stretch, demanding, 'Different challenge levels must produce different eligibility.')
}

/**
 * DECISION 2 / 5 — the Preference Framework ordering.
 *
 * Its central instruction is that behavioural restrictions come LAST, "because they often reduce
 * affordance diversity". So an environment-owned intervention must be preferred over a rule-owned
 * one, and this asserts the ordering rather than the specific ids it produces today.
 */
function testPreferenceOrderingPrefersEnvironmentOverRules(): void {
    const environmental = library.interventions().find((i) => /environmental manipulation/i.test(i.ecologicalOwner))
    const interaction = library
        .interventions()
        .find((i) => /^interaction regulation$/i.test(i.ecologicalOwner.trim()))
    assert.ok(environmental && interaction, 'The workbook should contain both owner types.')

    assert.ok(
        preferenceRank(environmental) < preferenceRank(interaction),
        'Modifying the environment must rank ahead of modifying interaction rules.'
    )

    // And the selection must honour it when both are available.
    const chosen = selectIntervention([interaction, environmental], [])
    assert.equal(chosen?.id, environmental.id, 'Selection must follow the preference order, not input order.')
}

/** An unresolved owner cannot be ranked honestly, so it must sort last rather than be guessed. */
function testUnresolvedOwnershipRanksLast(): void {
    const unresolved = library.interventions().find((i) => /tbd/i.test(i.ecologicalOwner))
    const resolved = library.interventions().find((i) => /^environmental manipulation$/i.test(i.ecologicalOwner.trim()))
    assert.ok(unresolved && resolved)
    assert.ok(preferenceRank(unresolved) > preferenceRank(resolved), 'An unowned intervention must not be preferred.')

    // And Decision 6 must refuse it — an unowned mechanism could be a behavioural restriction.
    assert.equal(validateExperience(unresolved).valid, false)
}

/**
 * DETERMINISM. The Decision Rules require it outright: "Avoid non-deterministic random selection."
 * The same input must produce the same enhancement every time, and selection must not depend on the
 * order candidates happen to arrive in.
 */
function testDeterminism(): void {
    const results = [0, 1, 2].map(() => decideExperienceDesign(input()))
    const first = JSON.stringify({ v: results[0].stakesVariable, i: results[0].intervention?.id })
    for (const result of results) {
        assert.equal(JSON.stringify({ v: result.stakesVariable, i: result.intervention?.id }), first)
    }

    const candidates = eligibleInterventions(input())
    const forward = selectIntervention(candidates, ['Scanning'])
    const reversed = selectIntervention([...candidates].reverse(), ['Scanning'])
    assert.equal(forward?.id, reversed?.id, 'Selection must not depend on candidate ordering.')
}

/** The pilot limit: at most one Stakes Variable and one Intervention per activity. */
function testPilotLimitOfOne(): void {
    const result = decideExperienceDesign(input({ challengeLevel: 'high', targetAffordances: ['Numerical Advantage'] }))
    assert.ok(result.applied)
    assert.equal(typeof result.stakesVariable, 'string', 'Exactly one Stakes Variable.')
    assert.ok(result.intervention, 'Exactly one Intervention.')
    assert.equal(library.maxInterventionsPerActivity, 1, 'The workbook still declares the pilot limit this assumes.')
}

/**
 * DECISION 6 RECOVERY — "Remove the Representative Intervention. Revalidate. If still unsuccessful,
 * return the activity without Representative Stakes."
 *
 * A rejected candidate must not abandon the whole variable while other candidates remain, and when
 * every candidate is rejected the activity comes back unenhanced rather than with a bad intervention.
 */
function testValidationRecovery(): void {
    // "Time" contains only RI-007, whose ownership is unresolved — so every candidate fails and the
    // result must be no stakes, with the reason naming what was rejected.
    const result = decideExperienceDesign(input({ challengeLevel: 'high', targetAffordances: ['Transition'] }))
    if (!result.applied) {
        assert.ok(/rejected every candidate/i.test(result.reason), `Recovery should report exhaustion. Got: ${result.reason}`)
        assert.equal(result.intervention, null, 'A rejected intervention must never be returned.')
    }

    // Whatever IS applied must always have passed validation — the invariant that matters.
    for (const challenge of ['medium', 'high']) {
        for (const affordances of [['Scanning'], ['Support'], ['Progression'], []]) {
            const decision = decideExperienceDesign(input({ challengeLevel: challenge, targetAffordances: affordances }))
            if (decision.applied) {
                assert.ok(
                    validateExperience(decision.intervention!).valid,
                    `${decision.intervention!.id} was applied but does not pass Decision 6.`
                )
            }
        }
    }
}

/**
 * The Learning Stage filter is NOT applied, and every result says so.
 *
 * This is the honest-reporting property: a missing filter that silently narrowed nothing would be
 * indistinguishable from one that worked. When the vocabularies are reconciled this test fails,
 * which forces the omission to be removed deliberately.
 */
function testUnappliedFilterIsReported(): void {
    for (const decision of [decideExperienceDesign(input()), decideExperienceDesign(input({ challengeLevel: 'low' }))]) {
        assert.ok(
            decision.unappliedFilters.some((f) => /learning stage/i.test(f)),
            'Every result must report that Learning Stage compatibility could not be applied.'
        )
    }
}

function runAll(): void {
    testNeverRunsOnFailedValidation()
    testDecision1ChallengeHeuristic()
    testDecision4FiltersByChallenge()
    testPreferenceOrderingPrefersEnvironmentOverRules()
    testUnresolvedOwnershipRanksLast()
    testDeterminism()
    testPilotLimitOfOne()
    testValidationRecovery()
    testUnappliedFilterIsReported()
    console.log('experience-design-runtime unit tests: all cases passed.')
}

runAll()
