/**
 * **The joint-distinctness condition, built from the real register rather than by hand.**
 *
 * His instruction of 3 October: *"the joint-distinctness condition that currently evaluates no tuples"* —
 * repair it, with focused regression tests.
 *
 * The defect was one line. `jointConditions` took its `path` from `rows.get(item.row).path`, and the item
 * sits on a FIELD row: the corpus's only condition is authored on `O4`, whose path is
 * `objects[].position.along`. The consumer then filtered element paths by
 * `container.startsWith(path.replace(/\[\]$/, ''))`, and that regex strips only a **trailing** `[]` — so the
 * prefix stayed `objects[].position.along` while every real container was `objects`. Nothing matched, no
 * tuple was collected, and the check passed having compared nothing.
 *
 * **Why the existing test could not see it.** `realize.unit.ts` hand-writes `path: 'objects[]'` in its
 * fixture, so it exercised the comparison with a path the builder never produces. The fixture was right
 * about what the condition should do and silent about whether anything built it that way. This file closes
 * that gap by asserting against what `assembleResolvedGame` actually emits for the live corpus.
 *
 * And it pins the three reasons the corpus's condition still does not refuse anything — only the first of
 * which was an engine defect:
 *
 *   1. the path bug, fixed here;
 *   2. `basis: ASSUMED`, so SD-27 forbids it creating an authoritative collision;
 *   3. `scope: PER_OBJECTIVE_SET`, whose set this layer cannot partition — and whose subject is never
 *      instantiated anyway.
 *
 * (2) and (3) are facts about the knowledge, not defects, and are reported rather than repaired.
 */
import assert from 'node:assert/strict'

import { corpusInput } from './corpus'
import { runDerivation, runStages0to10 } from './engine'
import { indexRegister } from './register'
import { assembleResolvedGame } from './resolved-game'

let passed = 0
const test = (name: string, fn: () => void) => {
    try {
        fn()
        passed++
        console.log(`  ok  ${name}`)
    } catch (error) {
        console.log(`  FAIL ${name}: ${(error as Error).message}`)
        process.exitCode = 1
    }
}

const input = corpusInput()
const index = indexRegister(input.register)
const result: any = runDerivation(input)
const staged: any = runStages0to10(input)
const resolved: any = assembleResolvedGame(result, staged.classes, index, input.contracts)
const conditions = (resolved.jointConditions ?? []) as any[]

test('the corpus holds exactly one joint condition, and it is the Variable Target one', () => {
    assert.equal(conditions.length, 1, `expected one DISTINCT_ON corpus-wide, got ${conditions.length}`)
    assert.equal(conditions[0].kind, 'DISTINCT_ON')
    assert.equal(conditions[0].from.itemId, 'VARTARGET-03.a')
    assert.deepEqual(conditions[0].rows, ['O4', 'O5'])
})

// ── THE DEFECT: the path must be the COLLECTION, and must match a real element container ───────────
test('the path is the owning COLLECTION, not the field row the item sits on', () => {
    const condition = conditions[0]
    assert.equal(condition.path, 'objects', `the set is the objects collection, got "${condition.path}"`)
    assert.ok(!condition.path.includes('position'), 'the FIELD row path is not the set')

    // The regression with teeth: the emitted path must actually match the containers element paths use.
    // This is the assertion the hand-written fixture could not make, because it supplied the path itself.
    const containers = new Set(
        (resolved.derived as any[]).map(d => String(d.path).match(/^(.+?)\[/)?.[1]).filter((c): c is string => !!c),
    )
    assert.ok(containers.has(condition.path), `no element container matches the condition's path; containers are ${[...containers].join(', ')}`)
})

// ── The authored scope and basis are CARRIED, not dropped ──────────────────────────────────────────
test('the authored scope is carried, so a fixed path cannot over-reach', () => {
    const condition = conditions[0]
    assert.equal(condition.scope, 'PER_OBJECTIVE_SET', 'the authored scope must survive into the typed condition')
    assert.equal(condition.notEvaluable, null, 'the set itself is identifiable; it is the scope that is not partitionable')
})

test('an ASSUMED condition is marked non-authoritative, so SD-27 is not violated', () => {
    const item = (input.contracts as any[])
        .flatMap(c => (c.items ?? []).map((i: any) => ({ contractId: c.contractId, ...i })))
        .find(i => i.itemId === 'VARTARGET-03.a')
    assert.ok(item, 'the item is loaded')
    assert.equal(String(item.basis), 'ASSUMED', 'this is the fact that makes the condition non-authoritative')
    assert.equal(conditions[0].authoritative, false, 'an assumed item bounds and never entails, so it may report but never refuse')
})

// ── NEGATIVE TEST: force the old path through and show it collects nothing ─────────────────────────
//
// The discipline this project keeps relearning: a passing check proves nothing until a wrong value has been
// forced through it. So reproduce the defect explicitly and assert that it WAS silent.
test('the old field-row path matches no container — the defect, reproduced', () => {
    const fieldRowPath = String(index.rows.get('O4')!.path)
    assert.equal(fieldRowPath, 'objects[].position.along', 'the row the item sits on')

    const stripped = fieldRowPath.replace(/\[\]$/, '')
    assert.equal(stripped, fieldRowPath, 'the trailing-[] strip removes nothing from a path whose [] is interior')

    const containers = (resolved.derived as any[])
        .map(d => String(d.path).match(/^(.+?)\[/)?.[1])
        .filter((c): c is string => !!c)
    assert.equal(
        containers.filter(c => c.startsWith(stripped)).length,
        0,
        'the old prefix matched no container, which is why no tuple was ever collected',
    )
    assert.ok(containers.filter(c => c === conditions[0].path).length > 0, 'and the corrected path does match')
})

console.log(`distinct-on-wiring: ${passed} passed`)
if (process.exitCode) console.log('distinct-on-wiring: FAILURES ABOVE')
