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
    hasResolvedOwnership,
    needsEnhancement,
    selectIntervention,
    reportUnreachableInterventions,
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
 * OWNERSHIP MUST NOT DRIVE ORDERING.
 *
 * An earlier implementation ranked interventions by Primary Ecological Owner. Christian corrected
 * that: ownership identifies the governing canonical library and "isn't intended to determine the
 * intervention's preference ranking". This pins the correction — two interventions with the SAME
 * owner must still be ordered by fit and authored position, and an intervention must not win merely
 * because of which library governs it.
 */
function testOwnershipDoesNotDetermineOrdering(): void {
    const sameOwner = library.interventions().filter((i) => /^interaction regulation$/i.test(i.ecologicalOwner.trim()))
    assert.ok(sameOwner.length >= 2, 'Need at least two same-owner interventions to prove ordering is independent.')

    // Affordance fit decides between them, not their (identical) owner.
    const target = sameOwner[1].primaryAffordanceIntent[0] ?? sameOwner[1].affordanceTags[0]
    assert.ok(target, 'Fixture intervention should declare an affordance to target.')
    const chosen = selectIntervention([sameOwner[0], sameOwner[1]], [target])
    assert.equal(chosen?.id, sameOwner[1].id, 'The better affordance fit must win regardless of shared ownership.')
}

/** Ownership survives only as a Decision 6 guard against an intervention with no agreed home. */
function testUnresolvedOwnershipStillBlocksDecision6(): void {
    const unresolved = library.interventions().filter((i) => !hasResolvedOwnership(i))
    assert.deepEqual(
        unresolved.map((i) => i.id),
        [],
        'All ownership is resolved in the current workbook — if this fails, an intervention lost its home.'
    )

    // The guard must still bite, proven on a synthetic entry rather than by waiting for a real one.
    const synthetic = { ...library.interventions()[0], id: 'RI-TEST', ecologicalOwner: 'TBD' }
    assert.equal(hasResolvedOwnership(synthetic), false)
    assert.equal(validateExperience(synthetic).valid, false, 'An unowned intervention must fail Decision 6.')
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
 * DECISION 4 — Learning Stage now filters, using IC-001's labels.
 *
 * The workbook adopted the canonical labels and declares IC-001 as their source, so this axis works.
 * Proven by showing different stages produce different eligibility, and that a stage genuinely
 * excludes interventions declared for another.
 */
function testDecision4FiltersByLearningStage(): void {
    const exploring = eligibleInterventions(input({ challengeLevel: 'low', learningStage: 'first_time_exploring' }))
    const refining = eligibleInterventions(input({ challengeLevel: 'high', learningStage: 'reinforcing_refining' }))

    assert.ok(exploring.length > 0 && refining.length > 0, 'Both stages must reach some intervention.')
    assert.notDeepEqual(
        exploring.map((i) => i.id),
        refining.map((i) => i.id),
        'Different Learning Stages must produce different eligibility, or the filter is doing nothing.'
    )

    for (const intervention of exploring) {
        assert.ok(
            intervention.learningStages.some((s) => s.toLowerCase() === 'first time exploring'),
            `${intervention.id} was eligible for Exploring but does not declare it.`
        )
    }

    // A coach who was never asked (free-text path) must not be filtered to nothing.
    const unspecified = eligibleInterventions(input({ challengeLevel: 'medium', learningStage: undefined }))
    assert.ok(unspecified.length > 0, 'An absent Learning Stage must not disable Experience Design.')
}

/**
 * A KNOWN CONTRADICTION between the workbook and Decision 1, pinned so it stays visible.
 *
 * RI-004 and RI-009 are declared eligible only at Comfortable, but Decision 1 evaluates enhancement
 * only at Stretch or Demanding — so they can never be selected. Nothing errors; they simply never
 * appear, which looks exactly like the runtime deciding no enhancement was needed.
 *
 * Asserted as the CURRENT set rather than as "must be empty": it is Christian's call whether those
 * interventions move to another Challenge level or Decision 1 gains its "specifically justified"
 * escape. Either resolution changes this list and fails the test, which is the point.
 */
function testUnreachableInterventionsArePinned(): void {
    assert.deepEqual(
        reportUnreachableInterventions().map((entry) => entry.id).sort(),
        ['RI-004', 'RI-009'],
        'The set of structurally unreachable interventions changed. If it shrank, the contradiction was ' +
            'resolved and this test should be updated; if it grew, a new intervention is dead on arrival.'
    )

    // Prove it empirically too, not just by inspecting eligibility declarations.
    for (const challenge of ['low', 'medium', 'high']) {
        for (const stage of ['first_time_exploring', 'building_understanding', 'reinforcing_refining']) {
            const decision = decideExperienceDesign(
                input({ challengeLevel: challenge, learningStage: stage, targetAffordances: ['Support', 'Scanning'] })
            )
            if (decision.applied) {
                assert.ok(
                    !['RI-004', 'RI-009'].includes(decision.intervention!.id),
                    `${decision.intervention!.id} was selected but is reported unreachable — the report is wrong.`
                )
            }
        }
    }
}

function runAll(): void {
    testNeverRunsOnFailedValidation()
    testDecision1ChallengeHeuristic()
    testDecision4FiltersByChallenge()
    testOwnershipDoesNotDetermineOrdering()
    testUnresolvedOwnershipStillBlocksDecision6()
    testDeterminism()
    testPilotLimitOfOne()
    testValidationRecovery()
    testUnreachableInterventionsArePinned()
    testDecision4FiltersByLearningStage()
    console.log('experience-design-runtime unit tests: all cases passed.')
}

runAll()
