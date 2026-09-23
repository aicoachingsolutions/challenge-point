/**
 * Derivation engine — increment 1 (stages 0–2): refusal coverage and the invariants.
 *
 * The refusals are the design, so refusal coverage is the primary suite. Each test below is one of the
 * seven kinds of evidence Christian asked every increment to carry:
 *   approved semantics implemented · expected refusals refuse · canonical ordering and determinism ·
 *   no OPEN value silently chosen · no unsupported identity created · no failed or gapped input
 *   repaired · version and provenance information surviving.
 *
 * Run: npm test
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { runStages0to2, ENGINE_VERSION } from './engine'
import { parseSelector } from './selector'
import { indexRegister } from './register'
import { DerivationInput, LoadedContract } from './types'

const DOCS = path.resolve(__dirname, '../../../../docs/audits/conformance')

function readJson(file: string): any {
    return JSON.parse(fs.readFileSync(file, 'utf8').replace(/^﻿/, ''))
}

const REGISTER = readJson(path.join(DOCS, 'register-2026-09-18.json'))

/** A minimal admissible contract, built from the register's own enums. */
function contract(overrides: Partial<LoadedContract> = {}): LoadedContract {
    return {
        contractId: 'TEST-1',
        objectId: 'OBJ-1',
        knowledgeVersion: '1',
        items: [
            {
                itemId: 'TEST-1-01',
                row: 'S2',
                selector: 'noun=channel',
                requirement: 'COUNT',
                value: 2,
                strictness: 'REQUIRED',
                valueStatus: 'REQUIRED_RANGE',
                scope: 'WHOLE_GAME',
                basis: 'AUTHORED',
                basisEvidence: { quote: 'two channels', sourceId: 'TEST-SRC-1' },
                checkability: 'STRUCTURAL',
            },
        ],
        declarations: [{ row: 'S2', declaration: 'CLAIMED', note: '' }],
        ...overrides,
    }
}

function input(overrides: Partial<DerivationInput> = {}): DerivationInput {
    return {
        selection: [{ objectId: 'OBJ-1', knowledgeVersion: '1' }],
        contracts: [contract()],
        envelope: { players: 12, lengthM: 40, widthM: 30, durationMin: 20 },
        register: REGISTER,
        derivationRules: { version: 'rev-5' },
        ...overrides,
    }
}

// ---------------------------------------------------------------------------------------------
// 1. Expected refusals refuse — the primary suite.
// ---------------------------------------------------------------------------------------------

function testLoadRefusesUnknownRow(): void {
    const bad = contract()
    bad.items[0].row = 'NOT-A-ROW'
    const result = runStages0to2(input({ contracts: [bad] }))
    const refusal = result.failures.find(f => f.kind === 'LOAD_REFUSAL')
    assert.ok(refusal, 'an unknown row must refuse the contract')
    assert.match(String(refusal!.detailRef), /row is not a register row id/)
    assert.equal(result.run.counts.contractsAdmitted, 0)
}

function testLoadRefusesThePlaceholderGlyph(): void {
    const bad = contract()
    bad.items[0].structuralClause = 'â€”'
    const result = runStages0to2(input({ contracts: [bad] }))
    const refusal = result.failures.find(f => f.kind === 'LOAD_REFUSAL')
    assert.ok(refusal, 'the mojibake placeholder must refuse: it is not the registered spelling of absence')
    assert.match(String(refusal!.detailRef), /placeholder glyph/)
}

function testLoadRefusesComparativeWrittenAsExclusion(): void {
    const bad = contract()
    bad.items[0].requirement = 'COMPARES'
    bad.items[0].strictness = 'EXCLUSION'
    const result = runStages0to2(input({ contracts: [bad] }))
    assert.ok(
        result.failures.some(f => /EXCLUSION strictness/.test(String(f.detailRef))),
        'a comparative is a relationship, not a prohibition (SD-26)',
    )
}

function testLoadRefusesMagnitudeWithNoOperation(): void {
    const bad = contract()
    bad.items[0] = {
        ...bad.items[0],
        itemId: 'TEST-1-V9',
        row: 'V9',
        selector: 'condition.type=region',
        requirement: 'EQUALS',
        value: 2,
    }
    const result = runStages0to2(input({ contracts: [bad] }))
    assert.ok(
        result.failures.some(f => /no declared operation/.test(String(f.detailRef))),
        'SD-30: a magnitude with no operation is incomplete and effective value is not computable',
    )
}

function testLoadRefusalIsPerContractAndTheRunContinues(): void {
    const good = contract()
    const bad = contract({ contractId: 'TEST-2', objectId: 'OBJ-2' })
    bad.items[0].basis = 'NOT-A-BASIS'
    const result = runStages0to2(
        input({
            contracts: [good, bad],
            selection: [
                { objectId: 'OBJ-1', knowledgeVersion: '1' },
                { objectId: 'OBJ-2', knowledgeVersion: '1' },
            ],
        }),
    )
    assert.equal(result.run.counts.contractsAdmitted, 1, 'one mistyped value must not annihilate the report')
    assert.equal(result.run.counts.contractsRefused, 1)
    assert.equal(result.run.halted, false)
}

function testUnregisteredSelectorAttributeIsAReferenceDefect(): void {
    const bad = contract()
    bad.items[0].selector = 'restart=GOAL_KICK'
    const result = runStages0to2(input({ contracts: [bad] }))
    const defect = result.failures.find(f => f.kind === 'REFERENCE_DEFECT')
    assert.ok(defect, 'an unregistered attribute makes the selector unnormalisable (SD-32)')
    assert.equal(defect!.offendingInput, 'restart=GOAL_KICK', 'the unresolvable text is carried verbatim')
}

function testSelectionWithNoAdmittedContractRefuses(): void {
    const bad = contract()
    bad.items[0].row = 'NOT-A-ROW'
    const result = runStages0to2(input({ contracts: [bad] }))
    assert.ok(
        result.refusals.some(r => r.kind === 'SELECTION_CONTRACT_MISMATCH'),
        'a selected object with no admitted contract is a run-level refusal',
    )
}

function testHaltsWhenTheRegisterCannotBeRead(): void {
    const result = runStages0to2(input({ register: { rows: [{ path: 'x', kind: 'FIELD' }] } }))
    assert.equal(result.run.halted, true, 'H1: the engine cannot name what it is talking about')
    assert.equal(result.versions, null)
    assert.ok(result.refusals.length === 1 && /H1/.test(result.refusals[0].cause))
}

function testHaltsWhenVersionsCannotBeBuilt(): void {
    const result = runStages0to2(input({ derivationRules: { version: '' } }))
    assert.equal(result.run.halted, true, 'H2: under SD-30 an unstamped result asserts nothing')
    assert.ok(/H2/.test(result.refusals[0].cause))
}

// ---------------------------------------------------------------------------------------------
// 2. Canonical ordering and determinism.
// ---------------------------------------------------------------------------------------------

function testDeterministicAndOrderIndependent(): void {
    const a = contract()
    const b = contract({ contractId: 'TEST-2', objectId: 'OBJ-2' })
    const selection = [
        { objectId: 'OBJ-1', knowledgeVersion: '1' },
        { objectId: 'OBJ-2', knowledgeVersion: '1' },
    ]
    const first = runStages0to2(input({ contracts: [a, b], selection }))
    const second = runStages0to2(input({ contracts: [a, b], selection }))
    const shuffled = runStages0to2(input({ contracts: [b, a], selection: [...selection].reverse() }))

    const strip = (r: any) => JSON.stringify({ ...r, run: { ...r.run, inputDigest: null } })
    assert.equal(strip(first), strip(second), 'two runs on the same input must be byte-identical')
    assert.equal(strip(first), strip(shuffled), 'a shuffled input must produce identical output')
}

function testLinesAreSortedByTheCanonicalKey(): void {
    const result = runStages0to2(input())
    const index = indexRegister(REGISTER)
    const ordinals = result.lines.map(l => index.rowOrdinal.get(l.row) ?? -1)
    for (let i = 1; i < ordinals.length; i++) {
        assert.ok(ordinals[i] >= ordinals[i - 1], 'lines must be ordered by register row ordinal, not insertion')
    }
}

// ---------------------------------------------------------------------------------------------
// 3. No unsupported identity — SD-47.
// ---------------------------------------------------------------------------------------------

function testExistenceItemsMakeClassesNotIndividuals(): void {
    const result = runStages0to2(input())
    assert.equal(result.classes.length, 1, 'one existence item makes exactly one class')
    const cls = result.classes[0]
    assert.equal(cls.cardinality.min, 2, 'the class carries the cardinality; it does not become two elements')
    assert.equal(cls.classId, 'c:TEST-1:TEST-1-01', 'a class is named by its item, so no ordering decides which exist')
    assert.ok(!('elements' in (cls as any)), 'no individual is ever minted')
}

function testTwoItemsWithTheSameSelectorMakeTwoClasses(): void {
    const c = contract()
    c.items.push({ ...c.items[0], itemId: 'TEST-1-02' })
    const result = runStages0to2(input({ contracts: [c] }))
    assert.equal(result.classes.length, 2, 'classes are never merged, even where their selectors coincide (SD-47)')
}

function testInSelectorKeepsItsSetAndChoosesNothing(): void {
    const index = indexRegister(REGISTER)
    const parsed = parseSelector('noun ∈ {band, zone}', 'S2', index)
    assert.ok(parsed.predicate, 'an IN selector must parse')
    const term: any = parsed.predicate!.terms[0]
    assert.equal(term.op, 'IN')
    assert.deepEqual(term.values, ['band', 'zone'], 'the set is kept whole; no member is chosen')
}

function testDottedAttributeNamesAreTakenWhole(): void {
    const index = indexRegister(REGISTER)
    const ok = parseSelector('condition.type=region', 'V8b', index)
    assert.ok(ok.predicate, 'condition.type is the registered attribute name, dots included')
}

// ---------------------------------------------------------------------------------------------
// 4. Nothing is repaired, and nothing is silently chosen.
// ---------------------------------------------------------------------------------------------

function testNoLineCarriesAValue(): void {
    const result = runStages0to2(input())
    for (const line of result.lines) {
        assert.ok(!('value' in (line as any)), 'stages 0–2 derive no value, so none may appear')
    }
}

function testConditionalRowsAreConditionalNotAuthored(): void {
    const c = contract()
    c.items[0] = { ...c.items[0], itemId: 'TEST-1-T', row: 'T1', selector: '*', requirement: 'EXISTS', value: 'a transition' }
    const result = runStages0to2(input({ contracts: [c] }))
    const conditional = result.lines.filter(l => l.lineState === 'CONDITIONAL')
    assert.ok(conditional.length > 0, 'a row whose applicability depends on another line is CONDITIONAL, never NOT_AUTHORED')
    for (const line of conditional) assert.ok(line.conditionalOn, 'a conditional line names its governing line')
}

function testRefusedContractContributesNothing(): void {
    const bad = contract()
    bad.items[0].scope = 'NOT-A-SCOPE'
    const result = runStages0to2(input({ contracts: [bad] }))
    assert.equal(result.classes.length, 0, 'a refused contract is not partially loaded')
}

/**
 * SD-51, his ruling of 23 September, settling what increment 1 had to stop on: "Do not enumerate member
 * lines before membership is authoritatively resolved … OPEN, failed or gapped membership does not
 * authorize creation of member identities."
 *
 * Stage 2 therefore enumerates the membership line and nothing else. Materialization from a resolved
 * member set is tested in the increment 5 suite.
 */
function testSetValuedRowsEnumerateMembershipOnly(): void {
    const result = runStages0to2(input())
    assert.ok(
        result.lines.some(l => l.row === 'S4' && l.member === null),
        'the membership line itself is enumerated',
    )
    assert.equal(
        result.lines.filter(l => l.member !== null).length,
        0,
        'no member identity exists before membership is authoritatively resolved',
    )
    assert.equal(
        result.stopped.filter(s => /member set is not known/.test(s.why)).length,
        0,
        'SD-51 settled this; it is no longer carried as unestablished',
    )
}

// ---------------------------------------------------------------------------------------------
// 5. Versions and provenance survive.
// ---------------------------------------------------------------------------------------------

function testVersionsAreStamped(): void {
    const result = runStages0to2(input())
    const versions = result.versions!
    assert.ok(versions.register, 'the register version is stamped verbatim')
    assert.equal(versions.engine, ENGINE_VERSION)
    assert.equal(versions.derivation, 'rev-5')
    assert.deepEqual(versions.contracts, [{ id: 'TEST-1', version: '1' }])
    assert.deepEqual(versions.objects, [{ id: 'OBJ-1', version: '1' }])
    assert.ok(Object.keys(versions.vocabularies).length > 0, 'every closed vocabulary carries its own version')
}

function testClassCarriesItsProvenance(): void {
    const result = runStages0to2(input())
    assert.deepEqual(result.classes[0].fromItem, { contractId: 'TEST-1', itemId: 'TEST-1-01' })
}

// ---------------------------------------------------------------------------------------------
// 6. Approved semantics — structurally reachable triggers (SD-44).
// ---------------------------------------------------------------------------------------------

function testTriggersFollowTheirStructuralPrerequisites(): void {
    const result = runStages0to2(input())
    assert.ok(result.triggers.includes('START'), 'START is reachable by construction for a playable game')
    assert.ok(result.triggers.includes('OUT_END_LINE'), 'ball out is reachable when a bounded area exists')
    assert.ok(
        result.triggers.some(t => t.startsWith('REGION_ENTRY{')),
        'region entry is reachable per existing region class',
    )
    assert.ok(!result.triggers.includes('POSSESSION_CHANGE'), 'no ball object class, so no turnover prerequisite')

    const noArea = runStages0to2(input({ envelope: { players: 12, durationMin: 20 } }))
    assert.ok(!noArea.triggers.includes('OUT_END_LINE'), 'without a bounded area, ball out is not structurally reachable')
}

// ---------------------------------------------------------------------------------------------

const TESTS: [string, () => void][] = [
    ['load refuses an unknown row', testLoadRefusesUnknownRow],
    ['load refuses the placeholder glyph', testLoadRefusesThePlaceholderGlyph],
    ['load refuses a comparative written as an exclusion', testLoadRefusesComparativeWrittenAsExclusion],
    ['load refuses a magnitude with no operation', testLoadRefusesMagnitudeWithNoOperation],
    ['a load refusal is per contract and the run continues', testLoadRefusalIsPerContractAndTheRunContinues],
    ['an unregistered selector attribute is a reference defect', testUnregisteredSelectorAttributeIsAReferenceDefect],
    ['a selection with no admitted contract refuses', testSelectionWithNoAdmittedContractRefuses],
    ['halts when the register cannot be read', testHaltsWhenTheRegisterCannotBeRead],
    ['halts when versions cannot be built', testHaltsWhenVersionsCannotBeBuilt],
    ['deterministic and order-independent', testDeterministicAndOrderIndependent],
    ['lines are sorted by the canonical key', testLinesAreSortedByTheCanonicalKey],
    ['existence items make classes, not individuals', testExistenceItemsMakeClassesNotIndividuals],
    ['two items with the same selector make two classes', testTwoItemsWithTheSameSelectorMakeTwoClasses],
    ['an IN selector keeps its set and chooses nothing', testInSelectorKeepsItsSetAndChoosesNothing],
    ['dotted attribute names are taken whole', testDottedAttributeNamesAreTakenWhole],
    ['no line carries a value', testNoLineCarriesAValue],
    ['SD-51: set-valued rows enumerate membership only', testSetValuedRowsEnumerateMembershipOnly],
    ['conditional rows are conditional, not unauthored', testConditionalRowsAreConditionalNotAuthored],
    ['a refused contract contributes nothing', testRefusedContractContributesNothing],
    ['versions are stamped', testVersionsAreStamped],
    ['a class carries its provenance', testClassCarriesItsProvenance],
    ['triggers follow their structural prerequisites', testTriggersFollowTheirStructuralPrerequisites],
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
    console.error(`derivation increment 1: ${failed} of ${TESTS.length} failed`)
    process.exit(1)
}
console.log(`derivation increment 1: ${TESTS.length} passed`)
