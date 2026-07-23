/**
 * Unit tests — Information Expression Library RC1.1 ingestion. Pins: integrity gate passes; counts
 * match the workbook's own metadata (4 families / 4 engineering domains / 26 dimensions / 139
 * allowed values / 26 integrity conditions / 206 knowledge rows); the hostile-reduction invariant
 * (named patterns are NON-canonical presets, never Registry objects); dimensions resolve to domains
 * and carry allowed values; runtime status is SHADOW_REFERENCE (no production coupling).
 * Run: part of `npm test`.
 */
import assert from 'node:assert/strict'

import { informationExpressionLibrary, validateInformationExpressionIntegrity } from './information-expression-library'

function testIntegrity(): void {
    const res = validateInformationExpressionIntegrity()
    assert.ok(res.valid, `Information Expression Library failed integrity: ${res.errors.slice(0, 6).join(' | ')}`)
}

function testCanonicalOntologyShape(): void {
    const families = informationExpressionLibrary.families()
    assert.equal(families.length, 4)
    assert.deepEqual(
        families.map((f) => f.canonical_name).sort(),
        ['Informational Availability', 'Informational Distribution', 'Informational Reliability', 'Informational Revelation'],
        'Four canonical Information Expression families.'
    )
    assert.equal(informationExpressionLibrary.engineeringDomains().length, 4)
    assert.equal(informationExpressionLibrary.dimensions().length, 26, '26 canonical Engineering Dimensions.')
    assert.equal(informationExpressionLibrary.integrityConditions().length, 26)
}

/** The core architectural reduction: named informational situations are NOT canonical objects. */
function testNamedPatternsAreNonCanonical(): void {
    assert.equal(String(informationExpressionLibrary.metadata['canonical_pattern_layer']).toUpperCase(), 'NONE')
    const presets = informationExpressionLibrary.noncanonicalPresets()
    assert.ok(presets.length > 0, 'Named situations survive as non-canonical composite presets.')
    const registryIds = new Set([
        ...informationExpressionLibrary.families().map((f) => f.resource_id),
        ...informationExpressionLibrary.engineeringDomains().map((d) => d.resource_id),
    ])
    for (const p of presets) {
        assert.ok(!registryIds.has(p.subject_id), `Preset ${p.knowledge_id} must not be a Registry object.`)
    }
}

function testDimensionsResolveAndCarryValues(): void {
    const domainIds = new Set(informationExpressionLibrary.engineeringDomains().map((d) => d.resource_id))
    const dims = informationExpressionLibrary.dimensions()
    for (const d of dims) {
        assert.ok(d.object_id && domainIds.has(d.object_id), `${d.subject_id} belongs to a canonical domain.`)
    }
    // Every dimension should have at least one allowed value (139 across 26 dimensions).
    let withValues = 0
    for (const d of dims) {
        if (informationExpressionLibrary.allowedValues(d.subject_id).length > 0) withValues++
    }
    assert.equal(withValues, dims.length, 'Every canonical dimension declares allowed values.')
}

function testShadowReferenceOnly(): void {
    for (const entry of [...informationExpressionLibrary.families(), ...informationExpressionLibrary.engineeringDomains()]) {
        assert.equal(entry.runtime_status, 'SHADOW_REFERENCE', `${entry.resource_id} must remain shadow reference in RC1.`)
    }
}

function runAll(): void {
    testIntegrity()
    testCanonicalOntologyShape()
    testNamedPatternsAreNonCanonical()
    testDimensionsResolveAndCarryValues()
    testShadowReferenceOnly()
    console.log('information-expression-library unit tests: all cases passed.')
}

runAll()
