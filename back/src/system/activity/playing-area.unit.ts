/**
 * Unit tests — the playing area a coach is told to set up.
 *
 * Fixtures are real generated setups, taken from run-coach-view-audit.ts output on 2026-09-08. Every
 * one of them is a sentence a coach was actually shown.
 */
import assert from 'node:assert/strict'

import { describeArea, parseSessionArea, reconcilePlayingArea } from './playing-area'

const AREA = describeArea(40, 30)

/** Metric leads, yards follow. Christian's pilot requirement, stated as an example in the checklist. */
function testLabelIsMetricFirst(): void {
    assert.equal(AREA.label, '40 x 30 m (44 x 33 yd)')
    assert.equal(describeArea(25, 20).label, '25 x 20 m (27 x 22 yd)')
}

/** REAL OUTPUT: the model wrote yards for an area given in metres. */
function testWrongUnitIsCorrected(): void {
    const out = reconcilePlayingArea(
        'Play 6v6 with two 10-yard wide central corridors in a 40x30 yard area. Teams defend end zones located at each end.',
        AREA
    )

    assert.ok(out.text.includes('40 x 30 m (44 x 33 yd)'), `area not corrected: "${out.text}"`)
    assert.ok(!/40x30 yard/i.test(out.text), `wrong unit survived: "${out.text}"`)
    assert.equal(out.corrected, true)
}

/**
 * REAL OUTPUT: no dimensions at all. The worst case, and the one a coach cannot work around — they
 * are standing on a field with cones and no number.
 */
function testMissingAreaIsSupplied(): void {
    const out = reconcilePlayingArea(
        'Play 6v6. A central corridor is marked, with teams attacking end zones at each end.',
        AREA
    )

    assert.ok(out.text.includes('40 x 30 m (44 x 33 yd)'), `no area supplied: "${out.text}"`)
    assert.equal(out.supplied, true)
    assert.ok(out.text.startsWith('Play 6v6.'), `mangled the setup: "${out.text}"`)
}

/** REAL OUTPUT: correct numbers, no unit. Still wrong — a coach cannot pace out a unitless 40. */
function testUnitlessAreaGetsItsUnit(): void {
    const out = reconcilePlayingArea('Set up a 40x30 area with two wide channels on each side.', AREA)
    assert.ok(out.text.includes('40 x 30 m (44 x 33 yd)'), `unit not added: "${out.text}"`)
}

/**
 * Zones keep their OWN size — they are structure inside the area, not the area — but they are put
 * into the same units as it. Resizing them to the area would destroy the activity; leaving them in
 * yards beside a metric area gives the coach one paragraph in two unit systems.
 */
function testZonesKeepTheirSizeAndGainMetricUnits(): void {
    const out = reconcilePlayingArea(
        'Play in a 40x30 yard area with two 20-yard end zones and a 10-yard corridor.',
        AREA
    )

    assert.ok(out.text.includes('40 x 30 m (44 x 33 yd)'), `did not fix the area: "${out.text}"`)
    // 20 yd = 18 m, 10 yd = 9 m. Converted, not relabelled.
    assert.ok(out.text.includes('two 18 m (20 yd) end zones'), `end zone wrong: "${out.text}"`)
    assert.ok(out.text.includes('9 m (10 yd) corridor'), `corridor wrong: "${out.text}"`)
    assert.ok(!/\b20-yard\b/.test(out.text), `stale yard-only measurement: "${out.text}"`)
}

/** The area label's own "33 yd" must not be re-converted into metres. */
function testAreaLabelIsNotReconverted(): void {
    const out = reconcilePlayingArea('Play 6v6 in a 40x30 yard area with two 20-yard end zones.', AREA)

    assert.equal(
        (out.text.match(/44 x 33 yd/g) ?? []).length,
        1,
        `area label damaged or duplicated: "${out.text}"`
    )
    assert.ok(!/30 m \(33 yd\)/.test(out.text), `converted the label's own yards: "${out.text}"`)
}

/** Already correct and already metric-first: touch nothing. */
function testCorrectTextIsUntouched(): void {
    const text = 'Play 6v6 in a 40 x 30 m (44 x 33 yd) area with two wide channels.'
    const out = reconcilePlayingArea(text, AREA)

    assert.equal(out.text, text)
    assert.equal(out.corrected, false)
    assert.equal(out.supplied, false)
}

/**
 * REGRESSION — real generation, 2026-09-08. An unlabelled area let the optional-unit group swallow
 * the space after the number, and the coach was shown "…(44 x 33 yd)area".
 */
function testUnitlessAreaKeepsTheFollowingSpace(): void {
    const out = reconcilePlayingArea(
        'Play 6v6 with two 20-yard end zones at either end of a 40x30 area. Teams start in their halves.',
        AREA
    )

    assert.ok(!/yd\)\S/.test(out.text), `lost the space after the area: "${out.text}"`)
    assert.ok(out.text.includes('(44 x 33 yd) area'), `area not followed by its noun: "${out.text}"`)
}

/** Idempotent — running the pass twice must not nest or duplicate the conversion. */
function testIdempotent(): void {
    const once = reconcilePlayingArea('Play 6v6 in a 40x30 yard area.', AREA)
    const twice = reconcilePlayingArea(once.text, AREA)

    assert.equal(twice.text, once.text, `second pass changed the text: "${twice.text}"`)
    assert.equal((once.text.match(/yd\)/g) ?? []).length, 1, `duplicated the conversion: "${once.text}"`)
}

/** No usable session dimensions: leave the text alone rather than invent a size. */
function testMissingSessionDimensionsChangeNothing(): void {
    assert.equal(parseSessionArea(undefined, '30'), null)
    assert.equal(parseSessionArea('0', '30'), null)
    assert.equal(parseSessionArea('abc', '30'), null)

    const text = 'Play 6v6 in a suitable area.'
    assert.equal(reconcilePlayingArea(text, null).text, text)
}

/** Every route ends with a concrete area in the text. */
function testEveryRouteStatesAnArea(): void {
    const inputs = [
        'Play 6v6. A central corridor is marked.',
        'Play 6v6 in a 40x30 yard area.',
        'Set up a 60 by 40 metre pitch with end zones.',
        'Play 6v6 in a 40 x 30 m (44 x 33 yd) area.',
    ]
    for (const input of inputs) {
        const out = reconcilePlayingArea(input, AREA)
        assert.ok(out.text.includes(AREA.label), `"${input}" produced "${out.text}"`)
    }
}

testLabelIsMetricFirst()
testWrongUnitIsCorrected()
testMissingAreaIsSupplied()
testUnitlessAreaGetsItsUnit()
testZonesKeepTheirSizeAndGainMetricUnits()
testAreaLabelIsNotReconverted()
testUnitlessAreaKeepsTheFollowingSpace()
testCorrectTextIsUntouched()
testIdempotent()
testMissingSessionDimensionsChangeNothing()
testEveryRouteStatesAnArea()

console.log('playing-area unit tests: all cases passed.')
