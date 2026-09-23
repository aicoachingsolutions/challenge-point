/**
 * Derivation engine — increment 3 (stages 6 and 8: classify, forward results).
 *
 * The first verdicts. The rule under test above all others is SD-28: **gap before collision**. An
 * engine that reported "two objects disagree" about a value nobody authored would be saying something
 * false about the knowledge.
 *
 * Run: npm test
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { runStages0to8 } from './engine'
import { ContractItem, DerivationInput, LoadedContract, VERDICTS, FORWARD_RESULTS } from './types'

const DOCS = path.resolve(__dirname, '../../../../docs/audits/conformance')
const REGISTER = JSON.parse(fs.readFileSync(path.join(DOCS, 'register-2026-09-18.json'), 'utf8').replace(/^﻿/, ''))

function item(overrides: Partial<ContractItem> = {}): ContractItem {
    return {
        itemId: 'I-1',
        row: 'S2',
        selector: 'noun=channel',
        requirement: 'COUNT',
        value: 2,
        strictness: 'REQUIRED',
        valueStatus: 'REQUIRED_RANGE',
        scope: 'WHOLE_GAME',
        basis: 'AUTHORED',
        basisEvidence: { quote: 'two channels', sourceId: 'SRC-1' },
        checkability: 'STRUCTURAL',
        ...overrides,
    }
}

function contract(items: ContractItem[], overrides: Partial<LoadedContract> = {}): LoadedContract {
    return {
        contractId: 'C-1',
        objectId: 'O-1',
        knowledgeVersion: '1',
        items,
        declarations: [{ row: 'S2', declaration: 'CLAIMED', note: '' }],
        ...overrides,
    }
}

function input(contracts: LoadedContract[]): DerivationInput {
    return {
        selection: contracts.map(c => ({ objectId: c.objectId, knowledgeVersion: '1' })),
        contracts,
        envelope: { players: 12, lengthM: 40, widthM: 30, durationMin: 20 },
        register: REGISTER,
        derivationRules: { version: 'rev-5' },
    }
}

const lineFor = (result: any, suffix: string) => [...result.classified!.values()].find((l: any) => l.lineId.endsWith(suffix)) as any

// ---------------------------------------------------------------------------------------------
// Verdicts.
// ---------------------------------------------------------------------------------------------

function testEntailedLineResolves(): void {
    const result = runStages0to8(input([contract([item(), item({ itemId: 'I-2', row: 'S3', requirement: 'EQUALS', value: 'channel' })])]))
    assert.equal(lineFor(result, '::S3').verdict, 'RESOLVED:ENTAILED')
}

function testUnauthoredLineIsAGapWithItsReason(): void {
    const result = runStages0to8(input([contract([item()])]))
    const line = lineFor(result, '::S3')
    assert.equal(line.verdict, 'NOT_AUTHORED')
    assert.equal(line.reason, 'coverage', 'nobody examined the row, so the reason is coverage')
}

function testDeclaredGapIsDistinguishedFromCoverage(): void {
    const c = contract([item()])
    c.declarations.push({ row: 'S3', declaration: 'NOT_AUTHORED', note: 'needs a noun it cannot author' })
    const result = runStages0to8(input([c]))
    assert.equal(lineFor(result, '::S3').reason, 'declared gap', 'an object that said it cannot author this is a declared gap')
}

/** SD-28 — the ordering that matters. */
function testGapBeforeCollision(): void {
    // Two items disagree, but both are engine-only, so nothing supports the value: it is a gap, and no
    // collision may be raised on it.
    const result = runStages0to8(
        input([
            contract([
                item(),
                item({ itemId: 'I-2', row: 'S3', requirement: 'EQUALS', value: 'channel', basis: 'ENGINE_ONLY' }),
                item({ itemId: 'I-3', row: 'S3', requirement: 'EQUALS', value: 'zone', basis: 'ENGINE_ONLY' }),
            ]),
        ]),
    )
    const line = lineFor(result, '::S3')
    assert.equal(line.verdict, 'NOT_AUTHORED', 'an unauthored dependency is a gap first (SD-28)')
    assert.equal(line.collidingItems.length, 0)
    assert.ok(
        !result.failures.some((f: any) => f.kind === 'COLLISION'),
        'no collision record may exist on a line nothing authored',
    )
}

function testTwoEntailingItemsThatDisagreeCollide(): void {
    const result = runStages0to8(
        input([
            contract([
                item(),
                item({ itemId: 'I-2', row: 'S3', requirement: 'EQUALS', value: 'channel' }),
                item({ itemId: 'I-3', row: 'S3', requirement: 'EQUALS', value: 'zone' }),
            ]),
        ]),
    )
    const line = lineFor(result, '::S3')
    assert.equal(line.verdict, 'UNRESOLVED', 'two support-capable items no single value satisfies')
    assert.equal(line.collidingItems.length, 2)
    const collision = result.failures.find((f: any) => f.kind === 'COLLISION')
    assert.ok(collision, 'the collision is a record in its own right, naming both items')
    assert.equal(collision!.locus.lineId, line.lineId)
}

function testAgreeingItemsDoNotCollide(): void {
    const result = runStages0to8(
        input([
            contract([
                item(),
                item({ itemId: 'I-2', row: 'S3', requirement: 'EQUALS', value: 'channel' }),
                item({ itemId: 'I-3', row: 'S3', requirement: 'EQUALS', value: 'channel' }),
            ]),
        ]),
    )
    assert.equal(lineFor(result, '::S3').verdict, 'RESOLVED:ENTAILED', 'overlapping bounds intersect and do not collide')
}

function testOpenLineTakesAFreeVerdict(): void {
    const result = runStages0to8(
        input([contract([item(), item({ itemId: 'I-2', row: 'S5', requirement: 'RANGE', value: '0-6 m', valueStatus: 'REQUIRED_RANGE' })])]),
    )
    const line = lineFor(result, '::S5')
    assert.ok(String(line.verdict).startsWith('FREE'), 'an authorized freedom is a kind of FREE, keeping the four statuses unchanged')
}

function testEveryVerdictIsFromTheClosedList(): void {
    const result = runStages0to8(input([contract([item()])]))
    for (const line of result.classified!.values()) {
        if (line.verdict === null) continue
        assert.ok(VERDICTS.includes(line.verdict as any), `verdict ${line.verdict} is not in the closed list`)
    }
}

// ---------------------------------------------------------------------------------------------
// Forward results.
// ---------------------------------------------------------------------------------------------

function testOutsideBoundaryIsCountedNotDropped(): void {
    const result = runStages0to8(
        input([contract([item(), item({ itemId: 'I-2', row: 'S3', checkability: 'OUTSIDE_BOUNDARY', requirement: 'EQUALS', value: 'anything' })])]),
    )
    const outcome = result.forward!.find(f => f.item.itemId === 'I-2')!
    assert.equal(outcome.result, 'NOT_CHECKABLE_OUTSIDE_REPRESENTATION')
    assert.equal(result.forward!.length, 2, 'every admitted item gets exactly one result; none is dropped')
}

function testEngineWordingIsInert(): void {
    const result = runStages0to8(
        input([contract([item(), item({ itemId: 'I-2', row: 'S3', basis: 'ENGINE_ONLY', requirement: 'EQUALS', value: 'channel' })])]),
    )
    assert.equal(result.forward!.find(f => f.item.itemId === 'I-2')!.result, 'INERT')
}

/** SD-46 — a supporting contribution whose realization conditions are not satisfied. */
function testSupportingItemThatReachesNothingIsNotRealized(): void {
    const result = runStages0to8(
        input([contract([item(), item({ itemId: 'I-2', row: 'S3', selector: 'noun=zone', requirement: 'EQUALS', value: 'zone', strictness: 'SUPPORTING' })])]),
    )
    const outcome = result.forward!.find(f => f.item.itemId === 'I-2')!
    assert.equal(outcome.result, 'NOT_REALIZED', 'supporting, and its realization conditions are not satisfied')
}

function testRequiredItemThatReachesNothingIsUnmet(): void {
    const result = runStages0to8(
        input([contract([item(), item({ itemId: 'I-2', row: 'S3', selector: 'noun=zone', requirement: 'EQUALS', value: 'zone', strictness: 'REQUIRED' })])]),
    )
    assert.equal(result.forward!.find(f => f.item.itemId === 'I-2')!.result, 'UNMET', 'required, so unmet rather than not realized')
}

function testItemOnAnOpenLineIsPendingNotBroken(): void {
    const result = runStages0to8(
        input([contract([item(), item({ itemId: 'I-2', row: 'S5', requirement: 'RANGE', value: '0-6 m', valueStatus: 'REQUIRED_RANGE' })])]),
    )
    assert.equal(
        result.forward!.find(f => f.item.itemId === 'I-2')!.result,
        'PENDING_CHOICE',
        'the downstream choice process has not run yet: pending, not unmet',
    )
}

function testExistenceItemEstablishesItsClass(): void {
    const result = runStages0to8(input([contract([item()])]))
    assert.equal(result.forward!.find(f => f.item.itemId === 'I-1')!.result, 'SATISFIED')
}

function testEveryResultIsFromTheClosedList(): void {
    const result = runStages0to8(input([contract([item()])]))
    for (const outcome of result.forward!) {
        assert.ok(FORWARD_RESULTS.includes(outcome.result as any), `result ${outcome.result} is not in the closed list`)
    }
}

// ---------------------------------------------------------------------------------------------
// Determinism and no repair.
// ---------------------------------------------------------------------------------------------

function testDeterministicAcrossStages68(): void {
    const a = contract([item()], { contractId: 'C-1', objectId: 'O-1' })
    const b = contract([item({ itemId: 'I-9', selector: 'noun=zone' })], { contractId: 'C-2', objectId: 'O-2' })
    const strip = (r: any) => JSON.stringify({ classified: [...r.classified.entries()], forward: r.forward })
    assert.equal(strip(runStages0to8(input([a, b]))), strip(runStages0to8(input([b, a]))))
}

function testNoVerdictIsInventedInDerivationMode(): void {
    const result = runStages0to8(input([contract([item()])]))
    for (const line of result.classified!.values()) {
        assert.notEqual(line.verdict, 'INVENTED', 'INVENTED is checking-mode only: with no candidate, nothing asserts anything')
    }
}

const TESTS: [string, () => void][] = [
    ['an entailed line resolves', testEntailedLineResolves],
    ['an unauthored line is a gap with its reason', testUnauthoredLineIsAGapWithItsReason],
    ['a declared gap is distinguished from coverage', testDeclaredGapIsDistinguishedFromCoverage],
    ['gap before collision', testGapBeforeCollision],
    ['two entailing items that disagree collide', testTwoEntailingItemsThatDisagreeCollide],
    ['agreeing items do not collide', testAgreeingItemsDoNotCollide],
    ['an open line takes a FREE verdict', testOpenLineTakesAFreeVerdict],
    ['every verdict is from the closed list', testEveryVerdictIsFromTheClosedList],
    ['outside the boundary is counted, not dropped', testOutsideBoundaryIsCountedNotDropped],
    ['engine wording is inert', testEngineWordingIsInert],
    ['a supporting item that reaches nothing is NOT_REALIZED', testSupportingItemThatReachesNothingIsNotRealized],
    ['a required item that reaches nothing is UNMET', testRequiredItemThatReachesNothingIsUnmet],
    ['an item on an open line is pending, not broken', testItemOnAnOpenLineIsPendingNotBroken],
    ['an existence item establishes its class', testExistenceItemEstablishesItsClass],
    ['every forward result is from the closed list', testEveryResultIsFromTheClosedList],
    ['deterministic across stages 6-8', testDeterministicAcrossStages68],
    ['no verdict is invented in derivation mode', testNoVerdictIsInventedInDerivationMode],
]

let failed = 0
for (const [name, run] of TESTS) {
    try {
        run()
        console.log(`  ok  ${name}`)
    } catch (error: any) {
        failed++
        console.error(`  FAIL ${name}: ${error.message}`)
    }
}

if (failed) {
    console.error(`derivation increment 3: ${failed} of ${TESTS.length} failed`)
    process.exit(1)
}
console.log(`derivation increment 3: ${TESTS.length} passed`)
