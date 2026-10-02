/**
 * Instantiating an authored relational spatial bound against the concrete envelope.
 *
 * Two rules under test, and both are about not claiming more than the knowledge states:
 *
 *   - a predicate that fixes both ends yields an **interval**; one that fixes a single edge yields an
 *     **anchor**, and no extent is invented for it;
 *   - an anchor closes only where something entails the extent — a **required** bound, or a
 *     **one-dimensional noun** whose extent sits on the other axis. A *preferred* bound never closes it.
 *
 * And one structural rule: **everything here comes from the canonical `relativeTerms` block**, never
 * from a second mechanism beside it.
 *
 * Run: npm test
 */
import assert from 'node:assert/strict'

import { loadRegister } from '../derivation/corpus'
import { indexRegister } from '../derivation/register'
import { realizeSpatialRelation, SpatialContext } from './spatial'

const index = indexRegister(loadRegister())
const ENVELOPE = { lengthM: 40, widthM: 30 }
const ctx = (over: Partial<SpatialContext> = {}): SpatialContext => ({ envelope: ENVELOPE, axis: 'along', ...over })

const FULL_ALONG = 'the full axis extent, end line to end line'
const FULL_ACROSS = 'extends across the axis: the target lies across the direction of progression'
const TOUCHLINE = 'touchline-adjacent'
const ATTACKING_END =
    'attacking end (of the team J3 names for the objective referencing it; EACH_TEAM if shared): touches an end line, not the interior'

const tests: [string, () => void][] = []
const test = (name: string, body: () => void) => tests.push([name, body])

// ---------------------------------------------------------------------------------------------
// It reads the canonical mechanism, and only that.
// ---------------------------------------------------------------------------------------------

test('ONE canonical home: the parallel spatialRelations block is gone', () => {
    // The lesson from 1 October, kept as a test rather than a comment: a new mechanism must not be
    // introduced where an existing canonical one already owns the concept.
    const register: any = loadRegister()
    assert.equal(register.spatialRelations, undefined, 'the parallel block must not come back')
    assert.ok(register.relativeTerms.machineReadable?.terms, 'RC-21 owns the machine-readable form')
    assert.ok(register.relativeTerms.phraseIndex?.map, 'and the phrase index that reaches it')

    // Every phrase the index names must resolve to a term the same block defines. A map entry pointing
    // at nothing would be a second vocabulary by accident.
    for (const [phrase, term] of Object.entries(register.relativeTerms.phraseIndex.map as Record<string, string>)) {
        assert.ok(register.relativeTerms.machineReadable.terms[term], `${phrase} maps to ${term}, which is not defined`)
    }
})

test('the term, not the phrase, is the provenance', () => {
    const touchline = realizeSpatialRelation(TOUCHLINE, index, ctx({ axis: 'across' }))!
    assert.equal(touchline.term, 'touchline-adjacent', 'the canonical term is recorded')
    assert.equal(touchline.asAuthored, TOUCHLINE, 'and the authored phrase survives beside it')
})

// ---------------------------------------------------------------------------------------------
// Interval vs anchor.
// ---------------------------------------------------------------------------------------------

test('a predicate fixing both ends yields the interval the axis gives it', () => {
    assert.deepEqual(realizeSpatialRelation(FULL_ALONG, index, ctx({ axis: 'along' }))!.interval, { from: 0, to: 40 })
    assert.deepEqual(realizeSpatialRelation(FULL_ACROSS, index, ctx({ axis: 'across' }))!.interval, { from: 0, to: 30 })
})

test('an axis-free term takes the axis of the row it is read for', () => {
    // "full extent" is one term serving both axes; it must not carry an axis of its own.
    assert.equal(realizeSpatialRelation(FULL_ALONG, index, ctx({ axis: 'along' }))!.axis, 'along')
    assert.equal(realizeSpatialRelation(FULL_ALONG, index, ctx({ axis: 'across' }))!.axis, 'across')
})

test('a predicate fixing one edge yields an anchor, and NO extent is invented', () => {
    const touchline = realizeSpatialRelation(TOUCHLINE, index, ctx({ axis: 'across' }))!
    assert.equal(touchline.anchor, 0)
    assert.equal(touchline.interval, undefined)
    assert.equal(touchline.extentUnresolved, true)
})

// ---------------------------------------------------------------------------------------------
// What closes an anchor — and what must not.
// ---------------------------------------------------------------------------------------------

test('a ONE-DIMENSIONAL noun closes the anchor to zero on its thickness axis', () => {
    // A line has extent on one axis. Where the other axis carries that extent, this one is its
    // thickness and its extent here is zero. Entailment, not assumption.
    const line = realizeSpatialRelation(ATTACKING_END, index, ctx({ axis: 'along', nounExtentDimensions: 1, otherAxisHasExtent: true }))!
    assert.deepEqual(line.interval, { from: 40, to: 40 }, 'degenerate at the end line it touches')
    assert.equal(line.extentUnresolved, false)
})

test('and it does NOT encode "line = end line": the same rule works in the other orientation', () => {
    // A line whose length runs ALONG the axis is zero-extent ACROSS it — the mirror case. If the rule
    // had named an axis, this would come out wrong.
    const lengthwise = realizeSpatialRelation(TOUCHLINE, index, ctx({ axis: 'across', nounExtentDimensions: 1, otherAxisHasExtent: true }))!
    assert.deepEqual(lengthwise.interval, { from: 0, to: 0 }, 'degenerate at the touchline it touches')
})

test('a one-dimensional noun whose other axis has NO extent closes nothing', () => {
    // Without an extent somewhere, nothing says which axis is the length — so the anchor stands.
    const unresolved = realizeSpatialRelation(ATTACKING_END, index, ctx({ axis: 'along', nounExtentDimensions: 1, otherAxisHasExtent: false }))!
    assert.equal(unresolved.interval, undefined)
    assert.equal(unresolved.extentUnresolved, true)
})

test('a TWO-dimensional noun never closes an anchor', () => {
    const zone = realizeSpatialRelation(ATTACKING_END, index, ctx({ axis: 'along', nounExtentDimensions: 2, otherAxisHasExtent: true }))!
    assert.equal(zone.interval, undefined, 'a zone has depth, and nobody authored it')
    assert.equal(zone.extentUnresolved, true)
})

test('a PREFERRED extent is offered and never composed into a requirement', () => {
    const preferred = realizeSpatialRelation(TOUCHLINE, index, ctx({ axis: 'across', extentBound: { min: 6, max: 10, preferred: true } }))!
    assert.equal(preferred.interval, undefined, 'a preference may not become a required interval')
    assert.equal(preferred.extentUnresolved, true)
    assert.deepEqual(preferred.extentBound, { min: 6, max: 10, preferred: true }, 'but it is carried and offered')
    assert.match(preferred.why, /PREFERRED_DEFAULT/)
})

test('a REQUIRED extent composes, at the widest permitted extent', () => {
    const required = realizeSpatialRelation(TOUCHLINE, index, ctx({ axis: 'across', extentBound: { min: 6, max: 10 } }))!
    assert.deepEqual(required.interval, { from: 0, to: 10 }, 'containment is checked at the widest permitted extent')
    assert.equal(required.extentUnresolved, false)
})

// ---------------------------------------------------------------------------------------------
// Refusals.
// ---------------------------------------------------------------------------------------------

test('an unindexed phrase yields nothing rather than a guess', () => {
    assert.equal(realizeSpatialRelation('somewhere near the middle, roughly', index, ctx()), null)
    assert.equal(realizeSpatialRelation(42, index, ctx()), null)
})

test('a missing envelope dimension yields nothing rather than a partial number', () => {
    assert.equal(realizeSpatialRelation(FULL_ALONG, index, ctx({ envelope: {} })), null)
})

test('the axes follow the envelope, not a hardcoded orientation', () => {
    const portrait = realizeSpatialRelation(FULL_ALONG, index, ctx({ envelope: { lengthM: 30, widthM: 40 }, axis: 'along' }))!
    assert.deepEqual(portrait.interval, { from: 0, to: 40 }, 'along is still the longer dimension')
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
