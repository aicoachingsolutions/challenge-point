/**
 * Unit tests for the Knowledge Core Package #1 foundation (Q1 two-layer separation).
 *
 * Proves: (1) the canonical KO types accept a well-formed Environmental Manipulation and Interaction
 * Regulation (compile-time contract); (2) the engine selection-metadata layer projects cleanly from
 * every current working object, with valid structural roles and matching keys. This is the scaffold
 * Christian's populated Knowledge Objects join onto by id.
 *
 * Run: part of `npm test`.
 */
import assert from 'node:assert/strict'

import { testLibraryRegistry } from '../test-library/library/registry'
import type { EnvironmentalManipulationKnowledgeObject, InteractionRegulationKnowledgeObject } from './knowledge-objects'
import { buildSelectionMetadataLayer, projectSelectionMetadata } from './project-test-library'

const VALID_ROLES = new Set(['foundation', 'shaping', 'consequence'])

/** Compile-time contract check: a well-formed KO of each type is assignable. */
function testCanonicalKoTypesAcceptWellFormedObjects(): void {
    const em: EnvironmentalManipulationKnowledgeObject = {
        id: 'EM-001',
        name: 'Narrow Playing Area',
        family: 'Playing Area Geometry',
        dimension: 'Width',
        definition: 'Reduces the lateral extent of the playing area.',
        directlyManipulates: 'Playing area width',
        designIntent: 'Increase interaction density.',
        evidenceStatus: 'Supported',
        status: 'Stable',
    }
    const ir: InteractionRegulationKnowledgeObject = {
        id: 'CR-001',
        name: 'Restrict Scoring by Actor',
        purpose: 'Restricts scoring eligibility based on performer identity.',
        regulatedInteraction: 'Scoring',
        availabilityChange: 'Restricted',
        conditionSources: ['Actor', 'Role'],
        commonParameters: ['player role'],
        exampleRealizations: ['Only defenders may score.'],
    }
    assert.equal(em.family, 'Playing Area Geometry')
    assert.equal(ir.availabilityChange, 'Restricted')
}

function testSelectionMetadataProjectsForEveryObject(): void {
    const objects = testLibraryRegistry.selectableConstraints()
    const layer = buildSelectionMetadataLayer()
    assert.equal(layer.size, objects.length, 'Every working object must project to selection metadata.')
    for (const c of objects) {
        const meta = layer.get(c.id)
        assert.ok(meta, `Missing selection metadata for ${c.id}`)
        assert.equal(meta!.koId, c.id, 'Metadata must key back to the KO id.')
        assert.ok(VALID_ROLES.has(meta!.structuralRole), `Invalid structural role for ${c.id}: ${meta!.structuralRole}`)
        assert.ok(Array.isArray(meta!.matchingVocabulary), 'matchingVocabulary must be an array.')
    }
}

function testAffordanceTargetPreserved(): void {
    // An information constraint carries a perception affordance target; the projection must keep it.
    const info = testLibraryRegistry
        .selectableConstraints()
        .find((c) => (c.primaryConstraintType || '').toLowerCase() === 'information')
    if (!info) return
    const meta = projectSelectionMetadata(info)
    assert.equal(meta.affordanceTarget, info.targetAffordancePrimary, 'Affordance target must project through.')
}

function runAll(): void {
    testCanonicalKoTypesAcceptWellFormedObjects()
    testSelectionMetadataProjectsForEveryObject()
    testAffordanceTargetPreserved()
    console.log('knowledge-core unit tests: all cases passed.')
}

runAll()
