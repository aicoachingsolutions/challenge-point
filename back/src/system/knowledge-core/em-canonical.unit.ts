/**
 * Unit tests — canonical Environmental Manipulation schema ingestion (Package 1.1, Schema v2.0 RC1).
 * Proves the platform can LOAD the canonical library and that its normalized relational structure is
 * intact: unique permanent IDs, every cross-sheet reference resolves, counts match Version Metadata.
 * Run: part of `npm test`.
 */
import assert from 'node:assert/strict'

import { EM_CANONICAL_SCHEMA, emCanonical, validateEmSchemaIntegrity } from './em-canonical'

function testIntegrity(): void {
    const res = validateEmSchemaIntegrity()
    assert.ok(res.valid, `Canonical EM schema failed integrity: ${res.errors.slice(0, 8).join(' | ')}`)
}

function testCanonicalCounts(): void {
    assert.equal(EM_CANONICAL_SCHEMA.families.length, 6, 'RC1 defines exactly 6 families.')
    assert.equal(EM_CANONICAL_SCHEMA.knowledgeObjects.length, 11, 'RC1 defines exactly 11 primitive KOs.')
    assert.equal(EM_CANONICAL_SCHEMA.variableDomains.length, 5, 'RC1 defines exactly 5 Engineering Variable Domains.')
    assert.equal(EM_CANONICAL_SCHEMA.engineeringDimensions.length, 24, 'RC1 defines exactly 24 Engineering Dimensions.')
    assert.ok(EM_CANONICAL_SCHEMA.parameters.length >= 60, 'Parameter registry should be populated.')
}

function testLookupsResolveViaIdsOnly(): void {
    const ko = emCanonical.knowledgeObject('EM-0001')
    assert.ok(ko, 'EM-0001 (Playing Area Configuration) must exist.')
    assert.equal(emCanonical.family(ko!.Family_ID)?.Family_Name, 'Playing Area Geometry')
    const dims = emCanonical.dimensionsForKo('EM-0001')
    assert.equal(dims.length, 3, 'EM-0001 owns Length, Width, Shape.')
    for (const d of dims) {
        assert.ok(emCanonical.parametersForDimension(d.DIM_ID).length >= 1, `${d.DIM_ID} must have parameters.`)
    }
    assert.ok(emCanonical.relationshipsFor('EM-0001').length >= 2, 'EM-0001 has belongs_to + uses_domain edges.')
}

function testVersionMetadataPresent(): void {
    assert.equal(emCanonical.version, '2.0-RC1-Candidate')
    assert.equal(String(EM_CANONICAL_SCHEMA.metadata['Cross_Reference_Policy']), 'IDs only')
}

function runAll(): void {
    testIntegrity()
    testCanonicalCounts()
    testLookupsResolveViaIdsOnly()
    testVersionMetadataPresent()
    console.log('em-canonical unit tests: all cases passed.')
}

runAll()
