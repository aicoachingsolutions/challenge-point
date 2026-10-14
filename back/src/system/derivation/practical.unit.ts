/**
 * The practical number a configuration is established at — one rule, shared by realization, the renderer and the
 * fidelity check. Added 14 October 2026.
 *
 * Christian that day (§7): *"Where a preferred range barely fits, provide a practical starting recommendation
 * rather than an awkwardly narrow numerical range"* and *"Where practical rounding is appropriate, apply it when
 * the configuration is established so the actual game and its instructions remain consistent."* The grain is
 * data (`docs/audits/practical-rounding.json`) and a PROPOSAL awaiting his confirmation (OD4).
 *
 * What must never happen is a rounded number outside what the knowledge requires, so that is asserted over every
 * range on a fine lattice, not over three examples.
 *
 * Run: npm test
 */
import assert from 'node:assert/strict'

import { grainFor, practical, PRACTICAL_ROUNDING, practicalRequirement } from './practical'
import { buildActivityFromKnowledge, ServedActivity } from '../rendering/build-activity'
import { specializedRoleNames } from '../rendering/session-envelope'

let passed = 0
function test(name: string, body: () => void): void {
    body()
    passed++
    console.log(`  ok  ${name}`)
}

console.log('practical — rounding at establishment')

test('the grain is DATA: 0.5 m below 10 m, 1 m from 10 m, whole counts and minutes (a proposal)', () => {
    assert.deepEqual(PRACTICAL_ROUNDING.extentMetres, [
        { below: 10, step: 0.5 },
        { from: 10, step: 1 },
    ])
    assert.deepEqual([PRACTICAL_ROUNDING.count.step, PRACTICAL_ROUNDING.minutes.step], [1, 1])
    assert.deepEqual([grainFor('EXTENT_METRES', 9.99), grainFor('EXTENT_METRES', 10), grainFor('COUNT', 3)], [0.5, 1, 1])
})

test('inward: a minimum rounds up, a maximum down, exactly', () => {
    assert.deepEqual(practical({ min: 4.5, max: 7.5 }, 'EXTENT_METRES'), { min: 4.5, max: 7.5 }, '40 x 30: already practical, nothing moves')
    assert.deepEqual(practical({ min: 3.75, max: 6.25 }, 'EXTENT_METRES'), { min: 4, max: 6 }, '30 x 25')
    assert.deepEqual(practical({ min: 2.25, max: 3.75 }, 'EXTENT_METRES'), { min: 2.5, max: 3.5 }, '20 x 15')
    assert.deepEqual(practical({ min: 3.45, max: 5.75 }, 'EXTENT_METRES'), { min: 3.5, max: 5.5 }, 'a 23 m width: 0.15 and 0.25 of it')
    assert.deepEqual(practical({ min: 9.8, max: 12.6 }, 'EXTENT_METRES'), { min: 10, max: 12 }, 'across the threshold, each end on its own grain')
    assert.deepEqual(practical({ min: 1, max: null }, 'COUNT'), { min: 1, max: null }, 'an end nobody authored stays unauthored')
})

test('a preference that barely fits is ONE practical value; one that holds none is nothing', () => {
    assert.deepEqual(practical({ min: 6, max: 6.25 }, 'EXTENT_METRES'), { min: 6, max: 6 }, '"Around 6 m", not "6 m to 6.25 m"')
    assert.equal(practical({ min: 6.1, max: 6.4 }, 'EXTENT_METRES'), null, 'never rounded outward to make it fit')
})

test('a requirement that holds no practical value keeps its exact numbers', () => {
    assert.deepEqual(practicalRequirement({ min: 6.1, max: 6.4 }, 'EXTENT_METRES'), { min: 6.1, max: 6.4 })
})

test('PROPERTY: no practical range ever leaves the exact range it came from', () => {
    for (let lo = 0; lo <= 3000; lo += 7) {
        for (let width = 0; width <= 900; width += 13) {
            const min = lo / 100
            const max = (lo + width) / 100
            const p = practical({ min, max }, 'EXTENT_METRES')
            if (!p) continue
            assert.ok(p.min! >= min && p.max! <= max && p.min! <= p.max!, `[${min}, ${max}] -> [${p.min}, ${p.max}]`)
            assert.equal((p.min! * 2) % 1 === 0 || p.min! >= 10, true, `${p.min} is on its grain`)
        }
    }
})

const none = Object.fromEntries(specializedRoleNames().map(role => [role, 0]))

test('the game holds the practical number and the activity says exactly that, at three sizes', () => {
    for (const [length, width, channel, required] of [
        [40, 30, 7.5, [4.5, 7.5]],
        [30, 25, 6, [4, 6]],
        [20, 15, 3.5, [2.5, 3.5]],
    ] as const) {
        const { activity, fixture } = buildActivityFromKnowledge(['GF2', 'tl-v0-constraint-wide-zone-advantage'], { players: 12, lengthM: length, widthM: width, durationMin: 20, roles: none })
        assert.equal(activity.outcome, 'served', `${length} x ${width}`)
        const across = (fixture as any).status.geometry.filter((g: any) => g.path.endsWith('.position.across') && g.path.includes('WIDEZONE'))
        assert.deepEqual(across.map((g: any) => g.geometry.interval.to - g.geometry.interval.from), [channel, channel], `${length} x ${width}: the game holds ${channel} m`)
        assert.deepEqual(across.map((g: any) => [g.geometry.extentBound.requiredWithin.min, g.geometry.extentBound.requiredWithin.max]), [required, required])
        const marking = (activity as ServedActivity).rendered.instructions.filter(i => i.text.startsWith('Mark a channel'))
        for (const sentence of marking) assert.ok(sentence.text.includes(`between ${required[0]} m and ${required[1]} m wide`), sentence.text)
        assert.equal((activity as ServedActivity).integrity.fidelityViolations, 0)
    }
})

/**
 * **PROPERTY, end to end — added in the review of S-C1, 14 October 2026.** The lattice above proves the rule; this
 * proves what is BUILT with it, over areas a coach might type, decimals included (41.7 × 33.3, 55.5 × 26.6): the
 * activity is served with no violation, the game's channel is never wider than the exact authored maximum nor
 * narrower than the exact minimum (0.15 and 0.25 of the width), it holds the practical maximum wherever the rule
 * gives one, the requirement written beside it lies inside the exact one, and every number a coach reads about a
 * channel below 10 m is on the half-metre grain. Measured over 254 areas in the review; a spread of them is kept.
 */
test('PROPERTY: over many areas the game holds a practical width inside the exact requirement, and says it', () => {
    const sizes: [number, number][] = [
        [12, 8], [15, 11], [20, 12.5], [22.5, 17], [25, 19.9], [27, 20], [30, 23], [33.3, 26.6], [35, 23], [40, 24],
        [41.7, 33.3], [45, 35], [50, 45.5], [55.5, 26.6], [60, 40], [64.2, 50], [70, 33.3], [80, 50], [100, 64], [30.5, 22.2],
    ]
    for (const [length, width] of sizes) {
        const { activity, fixture } = buildActivityFromKnowledge(['GF2', 'tl-v0-constraint-wide-zone-advantage'], { players: 12, lengthM: length, widthM: width, durationMin: 20, roles: none })
        assert.equal(activity.outcome, 'served', `${length} x ${width}`)
        assert.equal((activity as ServedActivity).integrity.fidelityViolations, 0, `${length} x ${width}`)
        const exact = { min: 0.15 * Math.min(length, width), max: 0.25 * Math.min(length, width) }
        const rule = practical(exact, 'EXTENT_METRES')
        const across = (fixture as any).status.geometry.filter((g: any) => g.path.endsWith('.position.across') && g.path.includes('WIDEZONE'))
        assert.equal(across.length, 2, `${length} x ${width}`)
        for (const g of across) {
            const held = Math.abs(g.geometry.interval.to - g.geometry.interval.from)
            assert.ok(held <= exact.max + 1e-9 && held >= exact.min - 1e-9, `${length} x ${width}: ${held} m is outside the exact ${exact.min}-${exact.max} m`)
            if (rule) assert.ok(Math.abs(held - rule.max!) < 1e-9, `${length} x ${width}: holds ${held}, the practical maximum is ${rule.max}`)
            const within = g.geometry.extentBound.requiredWithin
            assert.ok(within.min >= exact.min - 1e-9 && within.max <= exact.max + 1e-9 && within.max >= held - 1e-9, `${length} x ${width}: ${JSON.stringify(within)}`)
        }
        for (const sentence of (activity as ServedActivity).rendered.instructions.filter(i => i.text.includes('channel'))) {
            for (const n of sentence.quantities) if (n < 10 && n !== length && n !== width) assert.ok(Number.isInteger(n * 2), `${length} x ${width}: ${n} is off the grain in "${sentence.text}"`)
        }
    }
})

console.log(`practical.unit.ts — ${passed} passed`)
