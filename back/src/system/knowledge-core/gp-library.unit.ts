/**
 * Unit tests — Game Problem Library RC1 ingestion (workbook v1.0). Pins: integrity gate passes on
 * the shipped data; counts match the workbook's own metadata (6 domains / 17 Game Problems);
 * every Game Problem sits in a canonical Relationship Domain; relationships are IDs-only and
 * resolve; known register facts hold (permanent IDs; the 5 name-overlaps with the ATM registry).
 * Run: part of `npm test`.
 */
import assert from 'node:assert/strict'

import { gpLibrary, validateGpLibraryIntegrity } from './gp-library'
import { AFFORDANCE_TARGET_MATRIX } from './affordance-target-matrix'

function testIntegrity(): void {
    const res = validateGpLibraryIntegrity()
    assert.ok(res.valid, `GP Library failed integrity: ${res.errors.slice(0, 6).join(' | ')}`)
}

function testCanonicalCounts(): void {
    assert.equal(gpLibrary.relationshipDomains().length, 6)
    assert.equal(gpLibrary.gameProblems().length, 17)
    assert.equal(gpLibrary.gameProblem('GP-015')?.Name, 'Maintain Possession')
    assert.equal(gpLibrary.gameProblem('GP-012')?.Name, 'Protect Space')
    assert.equal(gpLibrary.gameProblem('GP-004')?.Name, 'Recover Position')
    assert.equal(gpLibrary.gameProblem('GP-017')?.Name, 'Force Turnover')
    // Every GP names a Domain × Operation.
    for (const gp of gpLibrary.gameProblems()) {
        assert.ok(gp.Operation, `${gp.ID} must declare an Operation.`)
    }
}

function testRelationshipsResolve(): void {
    for (const rel of gpLibrary.relationships()) {
        assert.ok(gpLibrary.gameProblem(rel.Source_ID), `Unresolvable relationship source ${rel.Source_ID}`)
        assert.ok(gpLibrary.gameProblem(rel.Target_ID), `Unresolvable relationship target ${rel.Target_ID}`)
    }
    const inverse = gpLibrary.relationships().find((r) => r.Relationship === 'inverse_of')
    assert.ok(inverse, 'Register declares at least one inverse_of pair (Gain/Escape Performer Control).')
}

/**
 * Documents the KNOWN version skew flagged to Christian: the ATM RC1.1 is keyed to an earlier
 * 11-name registry; exactly these 5 names overlap the canonical register. If this changes (ATM
 * re-keyed or register revised), this pin fails and the integration should be revisited.
 */
function testKnownAtmOverlap(): void {
    const gpNames = new Set(gpLibrary.gameProblems().map((g) => g.Name))
    const overlap = Object.keys(AFFORDANCE_TARGET_MATRIX).filter((name) => gpNames.has(name))
    assert.deepEqual(
        overlap.sort(),
        ['Create Space', 'Maintain Possession', 'Protect Space', 'Regain Possession'].sort(),
        'ATM↔GP-register name overlap changed — revisit the ATM re-keying integration.'
    )
}

function runAll(): void {
    testIntegrity()
    testCanonicalCounts()
    testRelationshipsResolve()
    testKnownAtmOverlap()
    console.log('gp-library unit tests: all cases passed.')
}

runAll()
