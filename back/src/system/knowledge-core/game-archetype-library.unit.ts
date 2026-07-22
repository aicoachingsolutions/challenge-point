/**
 * Unit tests — Game Archetype Library RC1.1 ingestion (workbook v1.0-RC1.1). Pins: integrity gate
 * passes; counts match the workbook's own metadata (6 archetypes / 216 knowledge rows split
 * 102/48/36/30 by type); Game-Problem-relationship rows reference canonical GP-IDs; role accessors
 * work; the six canonical archetype names are present.
 * Run: part of `npm test`.
 */
import assert from 'node:assert/strict'

import { gameArchetypeLibrary, validateGameArchetypeIntegrity } from './game-archetype-library'
import { gpLibrary } from './gp-library'

function testIntegrity(): void {
    const res = validateGameArchetypeIntegrity()
    assert.ok(res.valid, `Game Archetype Library failed integrity: ${res.errors.slice(0, 6).join(' | ')}`)
}

function testCanonicalCounts(): void {
    assert.equal(gameArchetypeLibrary.archetypes().length, 6)
    assert.equal(gameArchetypeLibrary.knowledge().length, 216)
    const names = gameArchetypeLibrary.archetypes().map((a) => a.Canonical_Name).sort()
    assert.deepEqual(
        names,
        ['Invasion', 'Net/Wall', 'Pursuit–Evasion', 'Retention', 'State Construction', 'Striking/Fielding'].sort(),
        'Six canonical Game Archetypes.'
    )
    assert.equal(gameArchetypeLibrary.archetype('GA-001')?.Canonical_Name, 'Invasion')
}

function testGameProblemRelationshipsReferenceCanonicalGpIds(): void {
    const gpIds = new Set(gpLibrary.gameProblems().map((g) => g.ID))
    const gpRows = gameArchetypeLibrary.knowledge().filter((k) => k.Knowledge_Type === 'GAME_PROBLEM_RELATIONSHIP')
    assert.equal(gpRows.length, 102, 'Six archetypes × 17 Game Problems = 102 relationship rows.')
    for (const row of gpRows) {
        assert.ok(row.Target_ID && gpIds.has(row.Target_ID), `GP relationship targets a canonical GP-ID: ${row.Target_ID}`)
    }
}

function testRoleAccessors(): void {
    // Invasion must have constitutive Game Problems (Create Space, Deny Access, Protect Space per the workbook).
    const constitutive = gameArchetypeLibrary.gameProblemsAtRole('GA-001', 'CONSTITUTIVE')
    assert.ok(constitutive.length > 0, 'Invasion should declare constitutive Game Problems.')
    assert.ok(constitutive.includes('GP-012'), 'Invasion constitutively expresses Protect Space (GP-012).')
    // Every archetype declares its four knowledge types.
    for (const a of gameArchetypeLibrary.archetypes()) {
        assert.ok(gameArchetypeLibrary.knowledgeFor(a.Archetype_ID, 'GAME_PROBLEM_RELATIONSHIP').length === 17,
            `${a.Archetype_ID} relates to all 17 Game Problems.`)
    }
}

function runAll(): void {
    testIntegrity()
    testCanonicalCounts()
    testGameProblemRelationshipsReferenceCanonicalGpIds()
    testRoleAccessors()
    console.log('game-archetype-library unit tests: all cases passed.')
}

runAll()
