/**
 * Every production derivation result, pinned to the one at 734cfa6 (fix F of the A02 package, after verification V1, 12 November 2026).
 *
 * Christian, received 11 November 2026, second reply, among the work delegated: "Preserving A01 regressions and existing production behavior."
 * And the question asked of every defect: "What automated safeguard could have detected this problem before it affected another activity?"
 *
 * The defect this test would have caught: stage W4's beyond clause (gates.ts `beyondLineClause`) found its conditions through `Probe.peek`, which
 * still records each line it reads as a subject of the check. It ran on every production derivation, so A01's derivation result gained five
 * subjects on GA-RELATIVE-PLACEMENT (7 -> 12) though no clause was added. Nothing caught it: the served activity carries each check's verdict
 * and clauses only, so the behaviour snapshot and A01's build hash (a02-safeguards.unit.ts A01_MAIN_SHA256) were unchanged; the derivation
 * result itself is read by the scripts and by the review pathway's citation of a failing check's subjects.
 *
 * What is pinned: for every learning goal of the planning model, with no practice situation and with each one it offers, the production
 * selection (`selectFor(goal, situation)`) derived by the production engine (`runDerivation(derivationInputFor(...))`), serialized canonically
 * (keys sorted at every depth, then JSON) and hashed (sha-256). A goal whose selection refuses is pinned by its refusal message the same way.
 *
 * How the pins were measured: the 734cfa6 tree (the A02 line before the package's nine commits) extracted with `git archive 734cfa6 back docs`
 * into scratch (scratchpad/pkg/A02/F/old), run from its back/ directory by ts-node with NODE_PATH pointed at this worktree's node_modules (no
 * link made), by a probe (scratchpad/pkg/A02/F/derivation-pins.ts) that computes exactly what `entryOf` below computes; two runs identical. The
 * tree before this fix differed from 734cfa6 on A01's five entries only (every A01 entry, A01-02's included); after the fix all 33 are equal.
 * 13 goals, 33 (goal, situation) entries: 27 derive, 6 refuse at selection (A02 and its four situations, D03).
 *
 * A pin moves only openly: a deliberate change to a production derivation re-pins here with the before value and the reason beside it.
 *
 * Run: npm test
 */
import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

import { sessionPlanningModel } from '../session-planning/session-planning-model'
import { runDerivation } from './engine'
import { derivationInputFor, selectFor } from './run-bounded-selection'

let passed = 0
function test(name: string, body: () => void): void {
    body()
    passed++
    console.log(`  ok  ${name}`)
}

console.log('production derivation results pinned to 734cfa6 (fix F)')

/** Keys sorted at every depth, so the hash reads the result, not the order its fields were written in. */
const canonical = (v: any): any => (Array.isArray(v) ? v.map(canonical) : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, canonical(v[k])])) : v)
const sha = (v: unknown): string => crypto.createHash('sha256').update(JSON.stringify(canonical(v))).digest('hex')

/** The derivations write progress lines; they are not the result, so they are held back while one runs. */
function quietly<T>(body: () => T): T {
    const log = console.log
    const warn = console.warn
    console.log = () => {}
    console.warn = () => {}
    try {
        return body()
    } finally {
        console.log = log
        console.warn = warn
    }
}

type Entry = { kind: 'DERIVED' | 'THREW'; sha256: string }
const resultFor = (goal: string, situation: string | null): any => quietly(() => runDerivation(derivationInputFor(selectFor(goal, situation))))
function entryOf(goal: string, situation: string | null): Entry {
    try {
        return { kind: 'DERIVED', sha256: sha(resultFor(goal, situation)) }
    } catch (e: any) {
        return { kind: 'THREW', sha256: sha({ threw: String(e?.message ?? e) }) }
    }
}

/** Every (goal, situation) the production route can derive: no situation, and each situation the planning model offers for the goal. */
const PRODUCTION_ENTRIES: { label: string; goal: string; situation: string | null }[] = (sessionPlanningModel.learningGoals() as any[]).flatMap((g) => {
    const goal = String(g.ID)
    return [null, ...(sessionPlanningModel.practiceSituationsFor(goal) as any[]).map((p) => String(p.ID))].map((situation) => ({ label: situation ? `${goal}@${situation}` : goal, goal, situation }))
})

/** Measured at 734cfa6 (see the header). DERIVED: the derivation result's hash; THREW: the refusal message's hash. */
const PINNED_AT_734CFA6: Record<string, Entry> = {
    A01: { kind: 'DERIVED', sha256: 'c3f7da9afae04b08da087acb58ecce4302519a3714cc5d724ca6dc34545b6b83' },
    'A01@A01-01': { kind: 'DERIVED', sha256: 'c3f7da9afae04b08da087acb58ecce4302519a3714cc5d724ca6dc34545b6b83' },
    'A01@A01-02': { kind: 'DERIVED', sha256: '23e37eb640f96eea4705e88f6e08eb0d1af508a7e411e6b626c8c42f07edd3c4' },
    'A01@A01-03': { kind: 'DERIVED', sha256: 'c3f7da9afae04b08da087acb58ecce4302519a3714cc5d724ca6dc34545b6b83' },
    'A01@A01-04': { kind: 'DERIVED', sha256: 'c3f7da9afae04b08da087acb58ecce4302519a3714cc5d724ca6dc34545b6b83' },
    D01: { kind: 'DERIVED', sha256: '1a3a29eb0f1bdc9aeddfbc80ff31c27da4a893a8d8d5d6e1e6645b5c72b529c1' },
    'D01@D01-01': { kind: 'DERIVED', sha256: '1a3a29eb0f1bdc9aeddfbc80ff31c27da4a893a8d8d5d6e1e6645b5c72b529c1' },
    'D01@D01-02': { kind: 'DERIVED', sha256: '1a3a29eb0f1bdc9aeddfbc80ff31c27da4a893a8d8d5d6e1e6645b5c72b529c1' },
    TA01: { kind: 'DERIVED', sha256: 'ee8f8d63004fd8a20fcdb33db8d1825ac321f433794015fe88f825d0db712bb7' },
    'TA01@TA01-01': { kind: 'DERIVED', sha256: 'ee8f8d63004fd8a20fcdb33db8d1825ac321f433794015fe88f825d0db712bb7' },
    TD01: { kind: 'DERIVED', sha256: '78e38d620741408cff5d27b4bfe0c0e042524011543c4cb4c4e2084c048dab93' },
    'TD01@TD01-01': { kind: 'DERIVED', sha256: '78e38d620741408cff5d27b4bfe0c0e042524011543c4cb4c4e2084c048dab93' },
    A02: { kind: 'THREW', sha256: 'a07cfc33baee8caee60790f7b9329d4f4fd63a04fbe2e2982e6be54f66f678e6' },
    'A02@A02-01': { kind: 'THREW', sha256: 'a07cfc33baee8caee60790f7b9329d4f4fd63a04fbe2e2982e6be54f66f678e6' },
    'A02@A02-02': { kind: 'THREW', sha256: 'a07cfc33baee8caee60790f7b9329d4f4fd63a04fbe2e2982e6be54f66f678e6' },
    'A02@A02-03': { kind: 'THREW', sha256: 'a07cfc33baee8caee60790f7b9329d4f4fd63a04fbe2e2982e6be54f66f678e6' },
    'A02@A02-04': { kind: 'THREW', sha256: 'a07cfc33baee8caee60790f7b9329d4f4fd63a04fbe2e2982e6be54f66f678e6' },
    D02: { kind: 'DERIVED', sha256: '78e38d620741408cff5d27b4bfe0c0e042524011543c4cb4c4e2084c048dab93' },
    'D02@D02-01': { kind: 'DERIVED', sha256: '78e38d620741408cff5d27b4bfe0c0e042524011543c4cb4c4e2084c048dab93' },
    'D02@D02-02': { kind: 'DERIVED', sha256: '78e38d620741408cff5d27b4bfe0c0e042524011543c4cb4c4e2084c048dab93' },
    TA02: { kind: 'DERIVED', sha256: 'e30462af1ddae424303737a4d20d4825fcb34d5cbd89c58365045d91d6205ec3' },
    'TA02@TA02-01': { kind: 'DERIVED', sha256: 'e30462af1ddae424303737a4d20d4825fcb34d5cbd89c58365045d91d6205ec3' },
    TD02: { kind: 'DERIVED', sha256: '78e38d620741408cff5d27b4bfe0c0e042524011543c4cb4c4e2084c048dab93' },
    'TD02@TD02-01': { kind: 'DERIVED', sha256: '78e38d620741408cff5d27b4bfe0c0e042524011543c4cb4c4e2084c048dab93' },
    A03: { kind: 'DERIVED', sha256: '9deedc6795471d4c5baa761d56b0920240b8e4780d8c052fd732ffeaf48ac9eb' },
    'A03@A03-01': { kind: 'DERIVED', sha256: '9deedc6795471d4c5baa761d56b0920240b8e4780d8c052fd732ffeaf48ac9eb' },
    'A03@A03-02': { kind: 'DERIVED', sha256: '9deedc6795471d4c5baa761d56b0920240b8e4780d8c052fd732ffeaf48ac9eb' },
    'A03@A03-03': { kind: 'DERIVED', sha256: '9deedc6795471d4c5baa761d56b0920240b8e4780d8c052fd732ffeaf48ac9eb' },
    'A03@A03-04': { kind: 'DERIVED', sha256: '9deedc6795471d4c5baa761d56b0920240b8e4780d8c052fd732ffeaf48ac9eb' },
    D03: { kind: 'THREW', sha256: '7ac0c37f039e00786da43e02fc52bda7a0511e7e11bee3446d282a67a2d2cf3e' },
    A04: { kind: 'DERIVED', sha256: '1a3a29eb0f1bdc9aeddfbc80ff31c27da4a893a8d8d5d6e1e6645b5c72b529c1' },
    A05: { kind: 'DERIVED', sha256: 'e30462af1ddae424303737a4d20d4825fcb34d5cbd89c58365045d91d6205ec3' },
    A06: { kind: 'DERIVED', sha256: '9deedc6795471d4c5baa761d56b0920240b8e4780d8c052fd732ffeaf48ac9eb' },
}

test('the pins cover every (goal, situation) the production route can derive, and nothing else', () => {
    assert.deepEqual(PRODUCTION_ENTRIES.map((e) => e.label).sort(), Object.keys(PINNED_AT_734CFA6).sort(), 'a goal or situation added or removed is named here, never skipped')
    assert.equal(PRODUCTION_ENTRIES.length, 33)
    assert.equal(new Set(PRODUCTION_ENTRIES.map((e) => e.goal)).size, 13)
    assert.equal(Object.values(PINNED_AT_734CFA6).filter((e) => e.kind === 'DERIVED').length, 27)
})

test('every production derivation result equals its result at 734cfa6', () => {
    const moved = PRODUCTION_ENTRIES.flatMap(({ label, goal, situation }) => {
        const now = entryOf(goal, situation)
        const pin = PINNED_AT_734CFA6[label]
        return now.kind === pin.kind && now.sha256 === pin.sha256 ? [] : [`${label}: ${now.kind} ${now.sha256} (734cfa6: ${pin.kind} ${pin.sha256})`]
    })
    assert.deepEqual(moved, [], `production derivation results that moved:\n${moved.join('\n')}`)
})

test('negative controls: the hash reads a check subject, and not the order of keys', () => {
    // In-test bite: the side effect fix F removed, re-made on a copy of A01's result (one subject added to GA-RELATIVE-PLACEMENT), is caught.
    const a01 = JSON.parse(JSON.stringify(resultFor('A01', null)))
    assert.equal(sha(a01), PINNED_AT_734CFA6.A01.sha256)
    const check = a01.gates.gateA.checks.find((c: any) => c.checkId === 'GA-RELATIVE-PLACEMENT')
    assert.ok(check && Array.isArray(check.subjects), 'A01 holds GA-RELATIVE-PLACEMENT with its subjects')
    check.subjects.push('c:restated:RPC-001:RPC-001-18.a::V6')
    assert.notEqual(sha(a01), PINNED_AT_734CFA6.A01.sha256, 'bite: one added subject moves the hash')
    check.subjects.pop()
    // The same result written with its top-level keys in reverse order hashes the same (the serialization is canonical).
    const reversed = Object.fromEntries(Object.keys(a01).reverse().map((k) => [k, a01[k]]))
    assert.equal(sha(reversed), PINNED_AT_734CFA6.A01.sha256)
})

test('registered', () => {
    const registry = JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', '..', '..', 'scripts', 'unit-tests.json'), 'utf8')) as string[]
    assert.ok(registry.includes('./src/system/derivation/production-derivation-pins.unit.ts'))
})

console.log(`production derivation pins (fix F): ${passed} passed`)
