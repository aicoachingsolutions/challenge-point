/**
 * Unit tests — Representative Intervention Library (Experience Design RC1).
 *
 * The failure mode this library has to defend against is SILENCE. Experience Design legitimately
 * decides not to enhance an activity, so an intervention that is unreachable, ineligible, or
 * unmatchable produces exactly the same observable result as one the runtime chose not to use.
 * Every test here is aimed at that: proving the knowledge can actually be reached, before anything
 * consults it during generation.
 *
 * Run: part of `npm test`.
 */
import assert from 'node:assert/strict'

import { LEARNING_STAGES, learningStageLabel } from '../activity/learning-stage-realization'
import {
    representativeInterventionLibrary as library,
    reportLearningStageVocabulary,
    reportUnresolvedOwnership,
    validateInterventionLibrary,
} from './representative-intervention-library'

function testIntegrityGate(): void {
    const result = validateInterventionLibrary()
    assert.ok(result.valid, `Intervention library failed integrity: ${result.errors.slice(0, 6).join(' | ')}`)
}

/** The RC1 shape, including the pilot limits — a change to any of these should be deliberate. */
function testRc1Shape(): void {
    assert.equal(library.categories().length, 7, 'RC1 declares seven Intervention Categories.')
    assert.equal(library.interventions().length, 10, 'RC1 declares ten Representative Interventions.')

    // Christian kept the pilot narrow on purpose: "one Representative Stakes Variable and one
    // Representative Intervention maximum per activity". Read from the workbook, not assumed.
    assert.equal(library.maxStakesVariablesPerActivity, 1)
    assert.equal(library.maxInterventionsPerActivity, 1)

    assert.deepEqual(
        library.categories().map((c) => c.name),
        ['Pressure', 'Opportunity', 'Numbers', 'Time', 'Territory', 'Information', 'Value'],
        'The seven Stakes Variables named in the Runtime Decision Rules must all exist as categories.'
    )
}

/**
 * Every Stakes Variable must actually lead to at least one intervention.
 *
 * Runtime Decision 3 selects a Stakes Variable, then Decision 4 retrieves interventions for it. A
 * variable with none is a dead end that surfaces as "no enhancement applied" rather than as an error.
 */
function testEveryStakesVariableHasInterventions(): void {
    for (const category of library.categories()) {
        const interventions = library.interventionsForStakesVariable(category.name)
        assert.ok(
            interventions.length > 0,
            `Stakes Variable "${category.name}" has no interventions — selecting it would silently do nothing.`
        )
    }

    // Lookup is by the document's vocabulary, so it must tolerate how a human would type it.
    assert.ok(library.interventionsForStakesVariable('  pressure  ').length > 0, 'Lookup must tolerate case and spacing.')
    assert.deepEqual(library.interventionsForStakesVariable('Nonexistent'), [])
}

/** Every intervention must carry the eligibility and coach-facing content it needs to be usable. */
function testInterventionsAreUsable(): void {
    for (const intervention of library.interventions()) {
        assert.ok(intervention.categoryId, `${intervention.id} has no category.`)
        assert.ok(intervention.coachDescription, `${intervention.id} has no coach description — a coach could not run it.`)
        assert.ok(
            intervention.representativeRationale,
            `${intervention.id} has no representative rationale — the reason it stays representative is missing.`
        )
        assert.ok(
            intervention.challengeLevels.length > 0,
            `${intervention.id} declares no Challenge eligibility, so Decision 4 can never retrieve it.`
        )
        assert.ok(
            intervention.learningStages.length > 0,
            `${intervention.id} declares no Learning Stage eligibility, so Decision 4 can never retrieve it.`
        )
    }
}

/**
 * CHALLENGE vocabulary lines up with the coach-facing experience; LEARNING STAGE does not.
 *
 * This pins both facts. The Challenge match means eligibility on that axis works today. The Learning
 * Stage mismatch means eligibility on THAT axis cannot be implemented without a decision from
 * Christian — and pinning it here stops anyone quietly adding a fuzzy match and believing the
 * problem is solved.
 */
function testEligibilityVocabularyAgreementIsPinned(): void {
    const challengeValues = new Set(library.interventions().flatMap((i) => i.challengeLevels))
    assert.deepEqual(
        [...challengeValues].sort(),
        ['Comfortable', 'Demanding', 'Stretch'],
        'Challenge eligibility must use the same words the coach chooses from.'
    )

    const stageValues = reportLearningStageVocabulary()
    assert.deepEqual(
        stageValues,
        ['Building', 'Exploring', 'Refining'],
        'Learning Stage eligibility vocabulary changed. If it now matches the canonical labels, the ' +
            'bridge question is resolved and this test plus the reporting function should go.'
    )

    // The mismatch itself, asserted rather than described — no workbook value equals a canonical label.
    const canonical = LEARNING_STAGES.map(learningStageLabel)
    for (const value of stageValues) {
        assert.ok(
            !canonical.includes(value),
            `"${value}" now matches a canonical Learning Stage label. The vocabularies have converged — ` +
                `implement eligibility matching and remove this assertion.`
        )
    }
}

/** Unresolved ecological ownership is a knowledge decision, so it is reported rather than assumed. */
function testUnresolvedOwnershipIsReported(): void {
    assert.deepEqual(
        reportUnresolvedOwnership().map((entry) => entry.id).sort(),
        ['RI-004', 'RI-007', 'RI-010'],
        'The set of interventions with unresolved ecological ownership changed — worth noticing either way.'
    )
}

/** Negative cases — proving the gate bites rather than only passing on healthy data. */
function testGateCatchesDamage(): void {
    const healthy = {
        source_workbook: 'test',
        header_row: 1,
        registry: [
            { ID: 'IC-001', 'Object Type': 'Intervention Category', Name: 'Pressure', Definition: 'd' },
            {
                ID: 'RI-001',
                'Object Type': 'Representative Intervention',
                'Parent ID': 'IC-001',
                Name: 'n',
                Definition: 'd',
                'Coach Description': 'c',
            },
        ],
        runtime_data: [{ 'Object ID': 'RI-001', 'Learning Stage': 'Building', 'Challenge Level': 'Stretch' }],
        metadata: {
            'Intervention Categories': 1,
            'Representative Interventions': 1,
            'Maximum Representative Stakes Variables per Activity': 1,
            'Maximum Representative Interventions per Activity': 1,
        },
    }
    const damaged = (mutate: (d: typeof healthy) => void) => {
        const copy = JSON.parse(JSON.stringify(healthy)) as typeof healthy
        mutate(copy)
        return validateInterventionLibrary(copy as never).errors
    }

    assert.deepEqual(validateInterventionLibrary(healthy as never).errors, [], 'A healthy workbook must produce no errors.')

    assert.ok(
        damaged((d) => {
            d.registry[1]['Parent ID'] = 'GONE'
        }).some((e) => e.includes('never be reached')),
        'An intervention with no category must be caught.'
    )
    assert.ok(
        damaged((d) => {
            d.runtime_data = []
        }).some((e) => e.includes('never be selected')),
        'An intervention with no eligibility row must be caught.'
    )
    assert.ok(
        damaged((d) => {
            d.metadata['Representative Interventions'] = 5
        }).some((e) => e.includes('declares 5')),
        'A declared count that disagrees with the registry must be caught.'
    )
    assert.ok(
        damaged((d) => {
            d.registry[1]['Object Type'] = 'Something Else'
        }).some((e) => e.includes('would be ignored')),
        'An unrecognised Object Type must be caught rather than silently dropped.'
    )
    assert.ok(
        damaged((d) => {
            delete (d.metadata as Record<string, unknown>)['Maximum Representative Interventions per Activity']
        }).some((e) => e.includes('pilot limit')),
        'A missing pilot limit must be caught — the runtime would otherwise assume one.'
    )
    assert.ok(
        damaged((d) => {
            d.runtime_data.push({ 'Object ID': 'RI-999', 'Learning Stage': 'Building', 'Challenge Level': 'Stretch' })
        }).some((e) => e.includes('not a Representative Intervention')),
        'Eligibility for a non-existent intervention must be caught.'
    )
}

function runAll(): void {
    testIntegrityGate()
    testRc1Shape()
    testEveryStakesVariableHasInterventions()
    testInterventionsAreUsable()
    testEligibilityVocabularyAgreementIsPinned()
    testUnresolvedOwnershipIsReported()
    testGateCatchesDamage()
    console.log('representative-intervention-library unit tests: all cases passed.')
}

runAll()
