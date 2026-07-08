import assert from 'node:assert/strict'

import { testLibraryRegistry } from './registry'
import { validateLibraryComposition } from './composition'

function currentInput() {
    return {
        affordanceLenses: testLibraryRegistry.affordanceLenses(),
        constraints: testLibraryRegistry.constraints(),
        archetypes: testLibraryRegistry.archetypes(),
    }
}

function testCurrentLibraryCompositionPasses(): void {
    assert.deepEqual(validateLibraryComposition(currentInput()).errors, [])
}

function testUnknownConstraintAffordanceReferenceFails(): void {
    const input = currentInput()
    const constraints = [{ ...input.constraints[0], targetAffordancePrimary: 'unknown_affordance' }, ...input.constraints.slice(1)]
    assert.deepEqual(validateLibraryComposition({ ...input, constraints }).errors, [
        {
            field: 'constraints[0].targetAffordancePrimary',
            message: 'unknown target affordance reference: unknown_affordance',
        },
    ])
}

function testUnknownArchetypeRecommendedConstraintTypeFails(): void {
    const input = currentInput()
    const archetypes = [
        { ...input.archetypes[0], recommended_constraint_types: ['Unregistered Type'] },
        ...input.archetypes.slice(1),
    ]
    assert.deepEqual(validateLibraryComposition({ ...input, archetypes }).errors, [
        {
            field: 'archetypes[0].recommended_constraint_types',
            message: 'unknown recommended constraint type: Unregistered Type',
        },
    ])
}

function testInformationConstraintsRequireEnvironmentalRealizations(): void {
    const input = currentInput()
    const infoIndex = input.constraints.findIndex((constraint) => (constraint.primaryConstraintType || '').toLowerCase() === 'information')
    assert.ok(infoIndex >= 0, 'Need at least one information constraint to exercise composition validation.')
    const constraints = input.constraints.map((constraint, index) =>
        index === infoIndex ? { ...constraint, environmentalRealizations: [] } : constraint
    )
    assert.deepEqual(validateLibraryComposition({ ...input, constraints }).errors, [
        {
            field: `constraints[${infoIndex}].environmentalRealizations`,
            message: 'information constraints must define environmentalRealizations',
        },
    ])
}

function testRegistryStoresCompositionValidationResults(): void {
    assert.deepEqual(testLibraryRegistry.compositionValidationResults(), [{ version: 'v0', valid: true, errors: [] }])
}

function runAll(): void {
    testCurrentLibraryCompositionPasses()
    testUnknownConstraintAffordanceReferenceFails()
    testUnknownArchetypeRecommendedConstraintTypeFails()
    testInformationConstraintsRequireEnvironmentalRealizations()
    testRegistryStoresCompositionValidationResults()
    console.log('test-library composition unit tests: all cases passed.')
}

runAll()
