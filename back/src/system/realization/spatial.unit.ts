/**
 * Instantiating an authored relational spatial bound against the concrete envelope.
 *
 * The rule under test is the one that keeps it honest: **a phrase that states both ends yields an
 * interval; a phrase that states one coordinate yields an anchor and leaves the extent unresolved.**
 * No distance is invented for a phrase that does not state one, and the authored words survive as the
 * authority for whatever is derived from them.
 *
 * Run: npm test
 */
import assert from 'node:assert/strict'

import { loadRegister } from '../derivation/corpus'
import { indexRegister } from '../derivation/register'
import { realizeSpatialRelation } from './spatial'

const index = indexRegister(loadRegister())
const ENVELOPE = { lengthM: 40, widthM: 30 }

const tests: [string, () => void][] = []
const test = (name: string, body: () => void) => tests.push([name, body])

test('a phrase stating both ends yields the interval the envelope gives it', () => {
    const along = realizeSpatialRelation('the full axis extent, end line to end line', ENVELOPE, index)!
    assert.equal(along.axis, 'along')
    assert.deepEqual(along.interval, { from: 0, to: 40 }, 'end line to end line on a 40 m axis')
    assert.equal(along.extentUnresolved, false)
    assert.equal(along.asAuthored, 'the full axis extent, end line to end line', 'the authored phrase survives as the authority')

    const across = realizeSpatialRelation('extends across the axis: the target lies across the direction of progression', ENVELOPE, index)!
    assert.deepEqual(across.interval, { from: 0, to: 30 }, 'across the axis is the shorter dimension')
})

test('a phrase stating one coordinate yields an anchor, and NO extent is invented', () => {
    const touchline = realizeSpatialRelation('touchline-adjacent', ENVELOPE, index)!
    assert.equal(touchline.anchor, 0, 'the outer edge is on a touchline')
    assert.equal(touchline.interval, undefined, 'no interval, because no width is authored')
    assert.equal(touchline.extentUnresolved, true)
    assert.match(touchline.why, /WIDTH IS NOT STATED/, 'and it says why, in the register’s own words')
})

test('the axes follow the envelope, not a hardcoded orientation', () => {
    // S1 makes `along` the longer dimension. A portrait envelope must not silently swap them.
    const portrait = realizeSpatialRelation('the full axis extent, end line to end line', { lengthM: 30, widthM: 40 }, index)!
    assert.deepEqual(portrait.interval, { from: 0, to: 40 }, 'along is still the longer dimension')
})

test('an unknown phrase yields nothing rather than a guess', () => {
    assert.equal(realizeSpatialRelation('somewhere near the middle, roughly', ENVELOPE, index), null)
    assert.equal(realizeSpatialRelation(42, ENVELOPE, index), null)
})

test('a missing envelope dimension yields nothing rather than a partial number', () => {
    assert.equal(realizeSpatialRelation('the full axis extent, end line to end line', {}, index), null)
})

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
    console.error(`spatial: ${failed} of ${tests.length} failed`)
    process.exit(1)
}
console.log(`spatial: ${tests.length} passed`)
