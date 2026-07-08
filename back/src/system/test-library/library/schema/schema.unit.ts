import assert from 'node:assert/strict'

import { testLibraryRegistry } from '../registry'
import {
    validateAffordanceLensSchema,
    validateArchetypeSchema,
    validateConstraintSchema,
    validateEnvironmentalManipulationSchema,
} from './index'

function testCurrentLibrariesPassSchemaValidation(): void {
    for (const lens of testLibraryRegistry.affordanceLenses()) {
        assert.deepEqual(validateAffordanceLensSchema(lens).errors, [], `Affordance lens should validate: ${lens.id}`)
    }
    for (const constraint of testLibraryRegistry.constraints()) {
        assert.deepEqual(validateConstraintSchema(constraint).errors, [], `Constraint should validate: ${constraint.id}`)
    }
    for (const environmentalManipulation of testLibraryRegistry.environmentalManipulations()) {
        assert.deepEqual(
            validateEnvironmentalManipulationSchema(environmentalManipulation).errors,
            [],
            `Environmental manipulation should validate: ${environmentalManipulation.id}`
        )
    }
    for (const archetype of testLibraryRegistry.archetypes()) {
        assert.deepEqual(validateArchetypeSchema(archetype).errors, [], `Archetype should validate: ${archetype.id}`)
    }
}

function testInvalidRowsReportFieldErrors(): void {
    const lens = { ...testLibraryRegistry.affordanceLenses()[0], id: '', gameTemplateAnchor: ['ok', 7] as unknown as string[] }
    const constraint = { ...testLibraryRegistry.constraints()[0], includesIncentiveLayer: 'true' as unknown as boolean }
    const archetype = { ...testLibraryRegistry.archetypes()[0], recommendedConstraintTypes: 'structural' as unknown as string[] }

    assert.deepEqual(validateAffordanceLensSchema(lens).errors, [
        { field: 'id', message: 'must be a non-empty string' },
        { field: 'gameTemplateAnchor', message: 'must be an array of strings' },
    ])
    assert.deepEqual(validateConstraintSchema(constraint).errors, [{ field: 'includesIncentiveLayer', message: 'must be a boolean' }])
    assert.deepEqual(validateArchetypeSchema(archetype).errors, [
        { field: 'recommendedConstraintTypes', message: 'must be an array of strings' },
    ])
}

function testRegistryStoresSchemaValidationResults(): void {
    const summaries = testLibraryRegistry.schemaValidationResults()
    assert.equal(summaries.length, 4)
    assert.deepEqual(
        summaries.map((s) => `${s.type}@${s.version}:${s.valid}:${s.errors.length}`).sort(),
        [
            'affordanceLenses@v0:true:0',
            'archetypes@v0:true:0',
            'constraints@v0:true:0',
            'environmentalManipulations@v0:true:0',
        ]
    )
}

function runAll(): void {
    testCurrentLibrariesPassSchemaValidation()
    testInvalidRowsReportFieldErrors()
    testRegistryStoresSchemaValidationResults()
    console.log('test-library schema unit tests: all cases passed.')
}

runAll()
