import assert from 'node:assert/strict'

import { TEST_LIBRARY_V0_CONSTRAINT_POOL_ORDER } from '../constraints'
import { getTestLibraryV0LoadDebug } from '../libraryLoadDebug'
import { registerLibrary, testLibraryRegistry } from './registry'

function testLoadDebugReportsRegisteredVersionsAndValidation(): void {
    const debug = getTestLibraryV0LoadDebug()
    assert.deepEqual(
        debug.registeredLibraries.map((entry) => ({
            type: entry.type,
            versions: entry.versions,
            activeVersion: entry.activeVersion,
            itemCount: entry.itemCount,
        })),
        [
            { type: 'affordanceLenses', versions: ['v0'], activeVersion: 'v0', itemCount: testLibraryRegistry.affordanceLenses().length },
            { type: 'constraints', versions: ['v0'], activeVersion: 'v0', itemCount: testLibraryRegistry.constraints().length },
            {
                type: 'environmentalManipulations',
                versions: ['v0'],
                activeVersion: 'v0',
                itemCount: testLibraryRegistry.environmentalManipulations().length,
            },
            { type: 'archetypes', versions: ['v0'], activeVersion: 'v0', itemCount: testLibraryRegistry.archetypes().length },
        ]
    )
    assert.equal(debug.schemaValidation.length, 4)
    assert.ok(debug.schemaValidation.every((entry) => entry.version === 'v0' && entry.valid))
    assert.deepEqual(debug.compositionValidation, [{ version: 'v0', valid: true, errors: [] }])
    assert.equal(debug.runtimeArrayLengths.constraints, 12)
    assert.equal(debug.runtimeArrayLengths.environmentalManipulations, 11)
    assert.equal(debug.runtimeArrayLengths.selectableConstraints, 23)
}

function testConstraintAndEnvironmentalManipulationPoolsRebuildOriginalSelectablePool(): void {
    assert.equal(testLibraryRegistry.constraints().length, 12)
    assert.equal(testLibraryRegistry.environmentalManipulations().length, 11)
    assert.equal(testLibraryRegistry.constraints().length + testLibraryRegistry.environmentalManipulations().length, 23)
    assert.deepEqual(
        testLibraryRegistry.selectableConstraints().map((constraint) => constraint.id),
        [...TEST_LIBRARY_V0_CONSTRAINT_POOL_ORDER]
    )
}

function testRegistryCanHoldAdditionalVersionAndRestoreActiveV0(): void {
    const original = testLibraryRegistry.affordanceLenses()
    registerLibrary({ type: 'affordanceLenses', version: 'v0-registry-unit', items: original })

    const withExtraVersion = testLibraryRegistry.registeredLibraries().find((entry) => entry.type === 'affordanceLenses')
    assert.ok(withExtraVersion)
    assert.deepEqual(withExtraVersion.versions, ['v0', 'v0-registry-unit'])
    assert.equal(withExtraVersion.activeVersion, 'v0-registry-unit')
    assert.equal(withExtraVersion.itemCount, original.length)

    registerLibrary({ type: 'affordanceLenses', version: 'v0', items: original })
    const restored = testLibraryRegistry.registeredLibraries().find((entry) => entry.type === 'affordanceLenses')
    assert.equal(restored?.activeVersion, 'v0')
}

function runAll(): void {
    testLoadDebugReportsRegisteredVersionsAndValidation()
    testConstraintAndEnvironmentalManipulationPoolsRebuildOriginalSelectablePool()
    testRegistryCanHoldAdditionalVersionAndRestoreActiveV0()
    console.log('test-library registry unit tests: all cases passed.')
}

runAll()
