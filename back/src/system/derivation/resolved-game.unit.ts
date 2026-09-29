/**
 * The resolved game — the object a realization layer and a generator consume.
 *
 * The rule under test above all others is the one that makes it safe to consume: **it adds no
 * semantics**. Every value in it is a value the run derived, every open line is one SD-39 authorized,
 * and nothing that was not established appears as though it were.
 *
 * Run: npm test
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { corpusInput } from './corpus'
import { runDerivation, runStages0to10 } from './engine'
import { indexRegister } from './register'
import { assembleResolvedGame } from './resolved-game'
import { isStampedHalt } from './emit'
import { ContractItem, DerivationInput, LoadedContract } from './types'

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

function input(items: ContractItem[]): DerivationInput {
    const contract: LoadedContract = {
        contractId: 'C-1',
        objectId: 'O-1',
        knowledgeVersion: '1',
        items,
        declarations: [{ row: 'S2', declaration: 'CLAIMED', note: '' }],
    }
    return {
        selection: [{ objectId: 'O-1', knowledgeVersion: '1' }],
        contracts: [contract],
        envelope: { players: 12, lengthM: 40, widthM: 30, durationMin: 20 },
        register: REGISTER,
        derivationRules: { version: 'rev-5' },
    }
}

function assemble(derivationInput: DerivationInput) {
    const result = runDerivation(derivationInput)
    if (isStampedHalt(result)) throw new Error('unexpected halt')
    const staged: any = runStages0to10(derivationInput)
    return assembleResolvedGame(result, staged.classes, indexRegister(derivationInput.register))
}

const tests: [string, () => void][] = []
const test = (name: string, body: () => void) => tests.push([name, body])

// ---------------------------------------------------------------------------------------------
// It adds nothing.
// ---------------------------------------------------------------------------------------------

test('every value in the game is a value the run derived, and nothing else is', () => {
    const derivationInput = corpusInput()
    const result = runDerivation(derivationInput)
    if (isStampedHalt(result)) return assert.fail('unexpected halt')
    const game = assembleResolvedGame(result, (runStages0to10(derivationInput) as any).classes, indexRegister(derivationInput.register))

    const derivedLines = result.resolution.filter(e => e.state === 'derived')
    assert.equal(game.derived.length, derivedLines.length, 'one entry per derived line, no more and no fewer')
    for (const entry of game.derived) {
        const line = result.resolution.find(e => e.lineId === entry.lineId)!
        assert.deepEqual(entry.value, line.value, `${entry.lineId}: the value is carried, not recomputed`)
        assert.deepEqual(entry.support, line.support, `${entry.lineId}: so is its support`)
    }
})

test('an open line is listed with its authority and never given a value', () => {
    const game = assemble(corpusInput())
    assert.ok(game.open.length > 0, 'the corpus does exercise the case')
    for (const choice of game.open) {
        assert.ok(choice.kind.startsWith('FREE'), `${choice.lineId}: ${choice.kind}`)
        assert.ok(!game.derived.some(d => d.lineId === choice.lineId), 'an open line carries no derived value')
        assert.ok(!('value' in choice), 'and none is invented for it here')
    }
})

test('a line that was not established is listed, never omitted', () => {
    const derivationInput = corpusInput()
    const result = runDerivation(derivationInput)
    if (isStampedHalt(result)) return assert.fail('unexpected halt')
    const game = assembleResolvedGame(result, (runStages0to10(derivationInput) as any).classes, indexRegister(derivationInput.register))

    const failed = result.resolution.filter(e => e.state === 'failed' && e.lineState === 'ENUMERATED')
    assert.equal(game.notEstablished.length, failed.length, 'absence is never a decision: every failed line is named')
    for (const entry of game.notEstablished) {
        assert.ok(['NOT_AUTHORED', 'UNRESOLVED'].includes(entry.verdict), `${entry.lineId}: ${entry.verdict}`)
    }
})

test('a withdrawn line is neither in the game nor reported as missing', () => {
    const derivationInput = corpusInput()
    const result = runDerivation(derivationInput)
    if (isStampedHalt(result)) return assert.fail('unexpected halt')
    const game = assembleResolvedGame(result, (runStages0to10(derivationInput) as any).classes, indexRegister(derivationInput.register))

    const withdrawn = result.resolution.filter(e => e.lineState === 'WITHDRAWN')
    assert.ok(withdrawn.length > 0, 'the corpus does exercise the case')
    for (const line of withdrawn) {
        assert.ok(!game.notEstablished.some(n => n.lineId === line.lineId), `${line.lineId}: not applicable is not a gap`)
        assert.ok(!game.derived.some(d => d.lineId === line.lineId))
    }
})

// ---------------------------------------------------------------------------------------------
// What a realization layer has to be told.
// ---------------------------------------------------------------------------------------------

test('SD-97: an existential assertion is carried, because it appears in no line', () => {
    const game = assemble(corpusInput())
    assert.ok(game.existential.length > 0, 'the corpus does exercise the case')
    for (const claim of game.existential) {
        assert.ok(!game.derived.some(d => d.path.includes(claim.classId)), 'it individuates nothing, so it describes nothing')
        assert.ok(!game.notEstablished.some(n => n.elementId === claim.classId), 'and it owes no field, so nothing about it is missing')
        assert.ok(claim.from.contractId && claim.from.itemId, 'the assertion keeps its provenance')
    }
})

test('SD-84: a singleton is a described element, not an existential claim', () => {
    const game = assemble(corpusInput())
    assert.ok(!game.existential.some(c => c.path === 'value.primaryEvent'), 'the schema invariant individuates it')
    assert.equal((game.game as any).value.primaryEvent.kind, 'line_crossed', 'so it appears in the game with its values')
})

test('coherence carries Gate A verbatim and forms no second judgement', () => {
    const derivationInput = corpusInput()
    const result = runDerivation(derivationInput)
    if (isStampedHalt(result)) return assert.fail('unexpected halt')
    const game = assembleResolvedGame(result, (runStages0to10(derivationInput) as any).classes, indexRegister(derivationInput.register))

    assert.equal(game.coherence.gateA, result.gates.gateA.verdict)
    assert.deepEqual(game.coherence.failingChecks, result.gates.gateA.checks.filter(c => c.verdict === 'FAIL').map(c => c.checkId).sort())
    assert.equal(game.coherence.mayRealize, result.gates.gateA.verdict === 'PASS', 'a restatement of Gate A’s own claim, not a new one')
})

// ---------------------------------------------------------------------------------------------
// Shape.
// ---------------------------------------------------------------------------------------------

test('the game is nested by the register’s own paths, including dotted leaves', () => {
    const game = assemble(
        input([
            item({ itemId: 'R-1', selector: 'noun=channel', requirement: 'COUNT', value: 1 }),
            item({ itemId: 'R-2', row: 'S5', selector: 'noun=channel', requirement: 'EQUALS', value: 'end line to end line' }),
        ]),
    )
    const regions = (game.game as any).space.regions
    assert.equal(regions.length, 1)
    assert.equal(regions[0].noun, 'channel', 'SD-92: the selector carried it')
    assert.deepEqual(regions[0].position, { along: 'end line to end line' }, 'a dotted leaf nests rather than becoming a key with a dot in it')
})

test('a game-level row sits at its own path', () => {
    const game = assemble(input([item()]))
    assert.deepEqual((game.game as any).envelope, { players: 12, area: { length_m: 40, width_m: 30 }, duration_min: 20 })
})

test('the same input assembles the same game, byte for byte', () => {
    const one = JSON.stringify(assemble(corpusInput()))
    const two = JSON.stringify(assemble(corpusInput()))
    assert.equal(one, two)
})

test('an element the enumeration individuated is in the game even when nothing about it was derived', () => {
    // Found by the realization layer: an element whose every line was open or failed appeared in
    // `open` and `notEstablished` and in no part of `game`, so the game said the element did not
    // exist rather than that nothing about it was established.
    const game = assemble(corpusInput())
    const inGame = new Set<string>()
    const walk = (node: any): void => {
        if (Array.isArray(node)) return node.forEach(walk)
        if (node && typeof node === 'object') {
            if (typeof node.elementId === 'string') inGame.add(node.elementId)
            Object.values(node).forEach(walk)
        }
    }
    walk(game.game)

    const referenced = new Set([...game.open, ...game.notEstablished].map(e => e.elementId).filter(Boolean) as string[])
    const missing = [...referenced].filter(id => !inGame.has(id))
    assert.deepEqual(missing, [], 'every element an open or unestablished line names is present in the game')
    assert.ok(game.counts.elementsWithNothingEstablished >= 1, 'and the count makes a silent drop visible')
})

test('the declarations reaching a row travel with the line, because a reason code alone cannot express five declarations', () => {
    const game = assemble(corpusInput())
    const unestablished = game.notEstablished.filter(e => e.verdict === 'NOT_AUTHORED')
    assert.ok(unestablished.every(e => Array.isArray(e.declared)))

    // The case that motivated it is now **fixed rather than merely visible**: the six-way codes
    // adopted on 29 September mean a row an object excluded or declared it does not constrain is no
    // longer reported as `coverage` — nobody looked. This asserted the defect yesterday; today it
    // asserts its absence, and the declarations still travel so the code can never again be the only
    // surviving account.
    const misreported = unestablished.filter(e => e.reason === 'coverage' && (e.declared.includes('NON_CLAIMED') || e.declared.includes('EXCLUDED')))
    assert.deepEqual(misreported, [], 'a statement outranks a silence, so no stronger declaration hides behind `coverage`')

    // And each code still means exactly what the declarations say.
    for (const entry of unestablished) {
        if (entry.declared.includes('NOT_AUTHORED')) assert.equal(entry.reason, 'declared gap', entry.lineId)
        else if (entry.declared.includes('EXCLUDED')) assert.equal(entry.reason, 'excluded', entry.lineId)
        else if (entry.declared.includes('NON_CLAIMED')) assert.equal(entry.reason, 'not constrained', entry.lineId)
        else if (!entry.declared.length) assert.equal(entry.reason, 'no coverage', entry.lineId)
    }
})

test('provenance names the run it came from', () => {
    const derivationInput = corpusInput()
    const result = runDerivation(derivationInput)
    if (isStampedHalt(result)) return assert.fail('unexpected halt')
    const game = assembleResolvedGame(result, (runStages0to10(derivationInput) as any).classes, indexRegister(derivationInput.register))
    assert.equal(game.provenance.inputDigest, result.run.inputDigest)
    assert.equal(game.provenance.engineVersion, result.versions.engine)
})

// ---------------------------------------------------------------------------------------------

let failed = 0
for (const [name, run] of tests) {
    try {
        run()
        console.log(`  ok  ${name}`)
    } catch (error: any) {
        failed++
        console.error(`  FAIL ${name}: ${error.message}`)
    }
}
if (failed) {
    console.error(`resolved game: ${failed} of ${tests.length} failed`)
    process.exit(1)
}
console.log(`resolved game: ${tests.length} passed`)
