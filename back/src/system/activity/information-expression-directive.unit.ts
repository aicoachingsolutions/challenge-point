/**
 * Unit tests for representative-realization diversity (Batch 2 — Deterministic Design Logic).
 *
 * informationExpressionDirective rotates deterministically through each information mechanic's
 * environmentalRealizations bank by the Decision Context's `variationIndex`, so repeated designs
 * for the same goal land on DIFFERENT valid spines instead of the AI defaulting to the same one.
 * These tests prove the rotation is: full-coverage, wrapping, deterministic, decorrelated across
 * constraints, and defaulting to bank[0] when no index is supplied. No randomness involved.
 *
 * Run: part of `npm test`.
 */
import assert from 'node:assert/strict'

import { informationExpressionDirective } from './build-activity-skeleton'
import { testLibraryRegistry } from '../test-library/library/registry'
import type { TestLibraryV0Constraint } from '../test-library/types'
import type { SystemAssemblyInput } from '../types'

function infoConstraintsWithBank(minBank: number): TestLibraryV0Constraint[] {
    return testLibraryRegistry.selectableConstraints().filter(
        (c) => (c.primaryConstraintType || '').toLowerCase() === 'information' && (c.environmentalRealizations?.length ?? 0) >= minBank
    )
}

/** Minimal Decision Context exercising only the fields the directive reads. */
function inputFor(constraintIds: string[], variationIndex?: number): SystemAssemblyInput {
    const [foundation, shaping, consequence] = constraintIds
    const asMember = (id?: string) => (id ? { constraint: { _id: id } } : undefined)
    return {
        constraintPackage: { foundation: asMember(foundation), shaping: asMember(shaping), consequence: asMember(consequence) },
        variationIndex,
    } as unknown as SystemAssemblyInput
}

/** The designated-realization bullets the directive emits (4-space "• " lines), in order. */
function chosenRealizations(constraintIds: string[], variationIndex?: number): string[] {
    const out = informationExpressionDirective(inputFor(constraintIds, variationIndex))
    return out
        .split('\n')
        .filter((l) => /^ {4}• /.test(l))
        .map((l) => l.replace(/^ {4}• /, ''))
}

function testRotationCoversWholeBank(): void {
    const c = infoConstraintsWithBank(2)[0]
    assert.ok(c, 'Need at least one information constraint with a 2+ realization bank.')
    const bank = c.environmentalRealizations!
    const seen = new Set<string>()
    for (let i = 0; i < bank.length; i++) {
        const [chosen] = chosenRealizations([c.id], i)
        seen.add(chosen)
    }
    assert.equal(
        seen.size,
        bank.length,
        `variationIndex 0..${bank.length - 1} should hit every distinct realization once (got ${seen.size}/${bank.length}).`
    )
}

function testRotationWrapsAndIsDeterministic(): void {
    const c = infoConstraintsWithBank(2)[0]
    const bank = c.environmentalRealizations!
    // Wrap: index === bank.length returns to index 0's pick.
    assert.equal(
        chosenRealizations([c.id], bank.length)[0],
        chosenRealizations([c.id], 0)[0],
        'variationIndex should wrap modulo bank length.'
    )
    // Determinism: same index → identical pick on repeated calls.
    assert.equal(
        chosenRealizations([c.id], 1)[0],
        chosenRealizations([c.id], 1)[0],
        'Same variationIndex must be deterministic.'
    )
}

function testDefaultsToFirstRealization(): void {
    const c = infoConstraintsWithBank(2)[0]
    const bank = c.environmentalRealizations!
    assert.equal(
        chosenRealizations([c.id], undefined)[0],
        bank[0],
        'Missing variationIndex must default to realization[0] (behavior-preserving anchor).'
    )
    assert.equal(chosenRealizations([c.id], 0)[0], bank[0], 'variationIndex 0 must select realization[0].')
}

function testMultipleConstraintsAreDecorrelated(): void {
    const candidates = infoConstraintsWithBank(2)
    if (candidates.length < 2) return // not enough data to exercise; other tests still cover rotation
    const [a, b] = candidates
    // Same seed, two info constraints: the "+ ri" offset must shift the second constraint's pick so
    // both mechanics do not lock onto bank position 0 together.
    const picks = chosenRealizations([a.id, b.id], 0)
    assert.equal(picks.length, 2, 'Both information constraints should emit a designated realization.')
    assert.equal(picks[0], a.environmentalRealizations![0], 'First constraint at seed 0 → its realization[0].')
    assert.equal(
        picks[1],
        b.environmentalRealizations![1 % b.environmentalRealizations!.length],
        'Second constraint at seed 0 must be offset by +1 (decorrelation).'
    )
}

function runAll(): void {
    testRotationCoversWholeBank()
    testRotationWrapsAndIsDeterministic()
    testDefaultsToFirstRealization()
    testMultipleConstraintsAreDecorrelated()
    console.log('information-expression-directive unit tests: all cases passed.')
}

runAll()
