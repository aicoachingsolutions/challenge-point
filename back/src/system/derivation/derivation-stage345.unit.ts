/**
 * Derivation engine — increment 2 (stages 3–5: scope, reach, derive).
 *
 * The same seven kinds of evidence, applied to the first stages that derive anything:
 *   approved semantics · expected refusals refuse · canonical ordering and determinism · no OPEN value
 *   silently chosen · no unsupported identity created · no failed or gapped input repaired · version and
 *   provenance surviving.
 *
 * Run: npm test
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { runStages0to5 } from './engine'
import { DerivationInput, LoadedContract, ContractItem } from './types'

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

// ---------------------------------------------------------------------------------------------
// Stage 5 — what entails, and what only bounds.
// ---------------------------------------------------------------------------------------------

function testAuthoredEqualsEntails(): void {
    const result = runStages0to5(input([contract([item(), item({ itemId: 'I-2', row: 'S3', requirement: 'EQUALS', value: 'channel' })])]))
    const line = [...result.derived!.lines.values()].find(l => l.lineId.endsWith('::S3'))!
    assert.equal(line.entailing.length, 1, 'an authored EQUALS item entails its value')
    assert.equal((line.entailing[0].support as any).relation, 'ENTAILS')
}

function testAssumedItemBoundsButNeverEntails(): void {
    const result = runStages0to5(
        input([contract([item(), item({ itemId: 'I-2', row: 'S3', requirement: 'EQUALS', value: 'channel', basis: 'ASSUMED' })])]),
    )
    const line = [...result.derived!.lines.values()].find(l => l.lineId.endsWith('::S3'))!
    assert.equal(line.entailing.length, 0, 'an assumed item never entails (§3)')
    assert.equal(line.bounding.length, 1, 'it bounds instead')
    assert.equal((line.bounding[0].support as any).relation, 'NARROWS')
}

function testEngineWordingSupportsNothing(): void {
    const result = runStages0to5(
        input([contract([item(), item({ itemId: 'I-2', row: 'S3', requirement: 'EQUALS', value: 'channel', basis: 'ENGINE_ONLY' })])]),
    )
    const line = [...result.derived!.lines.values()].find(l => l.lineId.endsWith('::S3'))!
    assert.equal(line.entailing.length + line.bounding.length, 0, 'SD-21: engine wording supports nothing')
}

function testTypicalExampleIsInert(): void {
    const result = runStages0to5(
        input([contract([item(), item({ itemId: 'I-2', row: 'S3', requirement: 'EQUALS', value: 'channel', valueStatus: 'TYPICAL_EXAMPLE' })])]),
    )
    const line = [...result.derived!.lines.values()].find(l => l.lineId.endsWith('::S3'))!
    assert.equal(line.entailing.length + line.bounding.length, 0, 'a typical example is inert')
}

// ---------------------------------------------------------------------------------------------
// SD-39 — OPEN is an authorized degree of freedom, never a synonym for unknown.
// ---------------------------------------------------------------------------------------------

function testOpenWhereTheChoiceSpaceIsSupported(): void {
    // The class supports the property's existence; an authored range supports the choice space.
    const result = runStages0to5(
        input([contract([item(), item({ itemId: 'I-2', row: 'S5', requirement: 'RANGE', value: '0-6 m', valueStatus: 'REQUIRED_RANGE' })])]),
    )
    const line = [...result.derived!.lines.values()].find(l => l.lineId.endsWith('::S5'))!
    assert.ok(line.open, 'existence supported by the class, choice space supported by the authored range')
    assert.equal(line.open!.authority, 'SD-39')
    assert.ok(line.open!.choiceSpace, 'an open line carries the register choice space it rests on')
    assert.ok(line.bounding.length > 0, 'and the bound that supports it')
}

/**
 * SD-39's qualification: "OPEN is not produced by absence of knowledge. The property's existence and
 * legitimate choice space must already be supported." A fillable row nothing has addressed is a gap,
 * not a freedom.
 */
function testAbsenceOfKnowledgeDoesNotProduceOpen(): void {
    const result = runStages0to5(input([contract([item()])]))
    const lines = [...result.derived!.lines.values()]

    const neutrals = lines.find(l => l.lineId === 'game::P5')!
    assert.equal(neutrals.open, null, 'no contract mentions neutrals, so their count is not an authorized freedom')

    const position = lines.find(l => l.lineId.endsWith('::S5'))!
    assert.equal(position.open, null, 'the register bounds this choice space by authored values, and none is authored')
    // SD-50 settled what increment 2 had to leave open: "If a required property must be resolved, its
    // existence is supported, but the legitimate choice space/bounds required to make it OPEN are
    // unsupported, report a GAP." Not a refusal, and no longer an unresolved question.
    assert.equal(
        result.stopped.filter(s => /should instead refuse/.test(s.why)).length,
        0,
        'SD-50 settled it: an unsupported choice space is a GAP',
    )

    for (const line of lines.filter(l => l.lineId.endsWith('::S3'))) {
        assert.equal(line.open, null, 'a row with no registered choice space is never open')
    }
}

function testEntailmentClosesOpenness(): void {
    const result = runStages0to5(
        input([contract([item(), item({ itemId: 'I-2', row: 'S5', requirement: 'POSITIONED', value: '0-6 m' })])]),
    )
    const line = [...result.derived!.lines.values()].find(l => l.lineId.endsWith('::S5'))!
    assert.ok(line.entailing.length > 0)
    assert.equal(line.open, null, 'selected knowledge that determines the value closes the freedom')
}

function testUndeclaredSilenceBarsOpenness(): void {
    const c = contract([item()])
    c.declarations.push({ row: 'S5', declaration: 'UNDECLARED', note: 'never examined' })
    const result = runStages0to5(input([c]))
    const line = [...result.derived!.lines.values()].find(l => l.lineId.endsWith('::S5'))!
    assert.equal(line.open, null, 'AM-04: unexamined silence cannot license a free choice')
}

function testNoOpenLineCarriesAValue(): void {
    const result = runStages0to5(input([contract([item()])]))
    for (const line of result.derived!.lines.values()) {
        if (!line.open) continue
        assert.ok(!('value' in (line as any)), 'no code path writes a value onto an open line (SD-35)')
    }
}

// ---------------------------------------------------------------------------------------------
// Stage 4 — three-valued reach, and the stop it reports (SD-48).
// ---------------------------------------------------------------------------------------------

function testUndeterminedReachDerivesNothingAndReports(): void {
    // The class fixes `noun`; the item selects on `functions`, which the class leaves open.
    const result = runStages0to5(
        input([
            contract([
                item(),
                item({ itemId: 'I-2', row: 'S5', selector: 'functions ∋ perceptual-reference', requirement: 'POSITIONED', value: '0-6 m' }),
            ]),
        ]),
    )
    assert.ok(result.run.counts.undeterminedReaches > 0, 'a selector the class leaves open is undetermined, not false')
    const line = [...result.derived!.lines.values()].find(l => l.lineId.endsWith('::S5'))!
    assert.equal(line.entailing.length, 0, 'nothing is derived from an undetermined reach')
    assert.ok(line.undetermined.length > 0, 'it is recorded against the line')
    assert.ok(
        result.stopped.some(s => /stage 4, reach/.test(s.where)),
        'and reported as a stop under SD-48 rather than resolved here',
    )
}

function testContradictedSelectorDoesNotReach(): void {
    const result = runStages0to5(
        input([contract([item(), item({ itemId: 'I-2', row: 'S3', selector: 'noun=zone', requirement: 'EQUALS', value: 'zone' })])]),
    )
    const line = [...result.derived!.lines.values()].find(l => l.lineId.endsWith('::S3'))!
    assert.equal(line.entailing.length, 0, 'a class fixed to another value is definitely not reached')
    assert.equal(line.undetermined.length, 0, 'and that is a definite false, not an undetermined')
}

// ---------------------------------------------------------------------------------------------
// SD-31 — a declaration survives an empty scope.
// ---------------------------------------------------------------------------------------------

function testOwnInvolvementEmptyKeepsTheDeclaration(): void {
    const c = contract([item({ scope: 'OWN_INVOLVEMENT' })])
    c.declarations = [{ row: 'S2', declaration: 'NOT_AUTHORED', scope: 'OWN_INVOLVEMENT', note: 'needs channels' }]
    const result = runStages0to5(input([c]))
    const own = result.scope!.ownInvolvement.get('C-1')!
    assert.equal(own.length, 0, 'no other-scoped existence item, so the own-involvement set is empty')
    const preserved = result.scope!.declarations.find(d => d.row === 'S2')
    assert.ok(preserved, 'SD-31: the empty scope empties the item application set, not the declaration')
    assert.equal(preserved!.declaration, 'NOT_AUTHORED')
}

function testOwnInvolvementUsesOnlyOtherScopedItems(): void {
    const c = contract([
        item({ itemId: 'I-WHOLE', scope: 'WHOLE_GAME' }),
        item({ itemId: 'I-OWN', scope: 'OWN_INVOLVEMENT', selector: 'noun=zone' }),
    ])
    const result = runStages0to5(input([c]))
    const own = result.scope!.ownInvolvement.get('C-1')!
    assert.deepEqual(own, ['c:C-1:I-WHOLE'], 'the restricted computation sees only other-scoped items, and cannot broaden (SD-42)')
}

// ---------------------------------------------------------------------------------------------
// Determinism, and nothing repaired.
// ---------------------------------------------------------------------------------------------

function testDeterministicAcrossStages345(): void {
    const a = contract([item()], { contractId: 'C-1', objectId: 'O-1' })
    const b = contract([item({ itemId: 'I-9', selector: 'noun=zone' })], { contractId: 'C-2', objectId: 'O-2' })
    const strip = (r: any) =>
        JSON.stringify({
            classes: r.classes,
            lines: r.lines,
            derived: [...r.derived.lines.entries()],
            scope: { sets: r.scope.applicationSets, declarations: r.scope.declarations },
        })
    assert.equal(strip(runStages0to5(input([a, b]))), strip(runStages0to5(input([b, a]))), 'shuffled input, identical output')
}

function testRefusedContractDerivesNothing(): void {
    const bad = contract([item({ basis: 'NOT-A-BASIS' })])
    const result = runStages0to5(input([bad]))
    assert.equal(result.classes.length, 0)
    assert.equal(result.scope!.applicationSets.length, 0, 'a refused contract contributes no application set')
}

function testNoDivergenceIsClaimedFalsely(): void {
    const result = runStages0to5(input([contract([item()])]))
    assert.equal(result.scope!.divergence.length, 0)
    assert.equal(result.run.divergent, false, 'divergence is reported only when the two computations actually disagree')
}

// ---------------------------------------------------------------------------------------------

const TESTS: [string, () => void][] = [
    ['an authored EQUALS item entails', testAuthoredEqualsEntails],
    ['an assumed item bounds but never entails', testAssumedItemBoundsButNeverEntails],
    ['engine wording supports nothing', testEngineWordingSupportsNothing],
    ['a typical example is inert', testTypicalExampleIsInert],
    ['open where the choice space is supported', testOpenWhereTheChoiceSpaceIsSupported],
    ['absence of knowledge does not produce open', testAbsenceOfKnowledgeDoesNotProduceOpen],
    ['entailment closes openness', testEntailmentClosesOpenness],
    ['undeclared silence bars openness', testUndeclaredSilenceBarsOpenness],
    ['no open line carries a value', testNoOpenLineCarriesAValue],
    ['an undetermined reach derives nothing and reports', testUndeterminedReachDerivesNothingAndReports],
    ['a contradicted selector does not reach', testContradictedSelectorDoesNotReach],
    ['an empty own-involvement scope keeps the declaration', testOwnInvolvementEmptyKeepsTheDeclaration],
    ['own involvement uses only other-scoped items', testOwnInvolvementUsesOnlyOtherScopedItems],
    ['deterministic across stages 3-5', testDeterministicAcrossStages345],
    ['a refused contract derives nothing', testRefusedContractDerivesNothing],
    ['no divergence is claimed falsely', testNoDivergenceIsClaimedFalsely],
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
    console.error(`derivation increment 2: ${failed} of ${TESTS.length} failed`)
    process.exit(1)
}
console.log(`derivation increment 2: ${TESTS.length} passed`)
