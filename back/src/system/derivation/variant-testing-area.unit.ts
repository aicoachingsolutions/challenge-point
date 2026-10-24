/**
 * A variant's testing area — H1, 23 October 2026 (the d26 design's build step 1, its finding X4: *"Defect: a variant does not inherit its
 * base's testing area."*).
 *
 * Christian, reply filed 18 October 2026, item 7: *"The 11–12-player support and 40 × 30 m prototype values are acceptable current testing
 * boundaries, but they should not become permanent architectural limitations."* Item 3: *"Twenty meters is our initial hypothesis, not a
 * canonical distance or a requirement for other field sizes."* His reply filed 25 October 2026, item 4: *"These should be alternative
 * knowledge-authorized realizations, not separate hardcoded implementations of the same Learning Goal."*
 *
 * Until H1 the loader read a realization's testing boundaries from its own field only, so a variant that did not restate them loaded with
 * none, kept its base's values in metres (A01-R1-S5-1, "A starting value for the 40 x 30 m prototype ONLY") and was admitted on every area:
 * the design's probe (d26 gs-variant-area-probe.ts) measured the variant accepted at 60 x 40 m where its base is refused.
 *
 * What is pinned here:
 *   1. the probe's case: a variant stating no testing boundaries inherits its base's, and is refused at 60 x 40 m exactly as its base is;
 *   2. a variant stating another area (or none) that keeps a value in metres from its base is refused by the integrity gate, each kept item
 *      named, and the whole file with it; A01-R2 given a new area while keeping A01-R1-S5-1 is refused for that item alone;
 *   3. withdrawing, or withdrawing and restating, every value in metres admits the new area, and the variant is then held to its own;
 *   4. the same areas compare equal whatever their order, repetition or the player counts beside them;
 *   5. which items carry metres is read structurally - the rows the register bounds by the session envelope and the numbers in an item's
 *      value or typed bound - never from prose, and on production it finds exactly the items the testing-boundary test lists;
 *   6. production: A01-R2, which restates the same boundaries, loads unchanged with its own statement; A01-R1 is untouched.
 *
 * Every variant here is a TEST-ONLY copy in memory. Nothing here changes a production file.
 *
 * Run: npx ts-node --files -r tsconfig-paths/register ./src/system/derivation/variant-testing-area.unit.ts
 */
import assert from 'node:assert/strict'

import { testingAreaRefusal } from '../rendering/build-activity'
import { carriesMetres, envelopeBoundedRows, loadProvisionalRealizations, loadRegister, PROVISIONAL_REALIZATIONS_FILE, provisionalRealizationNamed, readJson, validateProvisionalRealizations } from './corpus'
import { indexRegister } from './register'

let passed = 0
function test(name: string, body: () => void): void {
    body()
    passed++
    console.log(`  ok  ${name}`)
}
console.log("a variant's testing area (H1)")

const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value))
const register = loadRegister()
const ENVELOPE_ROWS = envelopeBoundedRows(indexRegister(register).outerBound)
const V = 'A01-RP'
const at = (lengthM: number, widthM: number) => ({ players: 12, lengthM, widthM, durationMin: 20, roles: {} }) as any
/** A01-R1's two values in metres (his 20 m pressure reference and his 5 m area), the only ones it holds. */
const METRIC = ['A01-R1-S5-1', 'A01-R1-S5-3']

interface ProbeOptions {
    /** The variant's own statement; absent means it states none (the probe's case). */
    boundaries?: unknown
    withdraw?: string[]
    items?: any[]
}
/**
 * The design's probe variant (d26 gs-variant-area-probe.ts), TEST-ONLY: the smallest legal variant of A01-R1, withdrawing one item nothing else
 * references (A01-R1-T4-4, which the goal version also withdraws), plus what `options` adds.
 */
const probeFile = (options: ProbeOptions = {}) => {
    const file = copy(readJson(PROVISIONAL_REALIZATIONS_FILE))
    const base = file.realizations.find((r: any) => r.id === 'A01-R1')
    const variant: any = {
        id: V,
        contractId: `provisional:${V}`,
        category: 'PROVISIONAL_REALIZATION_CHOICE',
        realizes: base.realizes,
        ruledOn: 'TEST-ONLY',
        by: 'TEST-ONLY',
        citedAs: 'TEST-ONLY',
        words: ['TEST-ONLY'],
        realizationChoices: base.realizationChoices,
        notWithPracticeSituations: copy(base.notWithPracticeSituations),
        declarations: [],
        relationshipRules: [],
        basedOn: 'A01-R1',
        withdraws: ['A01-R1-T4-4', ...(options.withdraw ?? [])].map(item => ({ item, because: 'TEST-ONLY' })),
        items: options.items ?? [],
    }
    if ('boundaries' in options) variant.testingBoundaries = options.boundaries
    file.realizations.push(variant)
    return file
}
const baseRaw = () => readJson(PROVISIONAL_REALIZATIONS_FILE).realizations.find((r: any) => r.id === 'A01-R1')
/** A TEST-ONLY statement for one other area, in the base's shape. */
const otherArea = (areas: unknown = [{ lengthM: 60, widthM: 40 }]) => ({ ...copy(baseRaw().testingBoundaries), areas, words: 'TEST-ONLY', citedAs: 'TEST-ONLY', note: null })
const errorsOf = (file: any, id = V) => validateProvisionalRealizations(file).filter(error => error.startsWith(`realization ${id} `) || error.startsWith(`realization ${id}:`))
const refusalFor = (id: string, statedFor: string, itemId: string, givenFor: string) =>
    `realization ${id} states testing boundaries for ${statedFor} and keeps ${itemId}, whose value in metres A01-R1 gives for ${givenFor}: a variant stating another area withdraws every value in metres it would inherit, or withdraws it and restates it among its own items`
const loadedVariant = (file: any, id = V) => loadProvisionalRealizations(file).find(r => r.provisionalId === id)!

// ── 1. The probe's case ──────────────────────────────────────────────────────────────────────────────────
test("the probe's case: a variant stating no testing boundaries inherits its base's and is refused at 60 x 40 m exactly as its base is", () => {
    const file = probeFile()
    assert.deepEqual(errorsOf(file), [], 'the probe variant passes the gate, as it did')
    const loaded = loadProvisionalRealizations(file)
    const base = loaded.find(r => r.provisionalId === 'A01-R1')!
    const variant = loaded.find(r => r.provisionalId === V)!
    assert.deepEqual(base, provisionalRealizationNamed('A01-R1'), 'the base is loaded exactly as the file holds it')
    // Measured before H1: null. Now the base's statement, whole.
    assert.notEqual(variant.testingBoundaries, null)
    assert.deepEqual(variant.testingBoundaries, base.testingBoundaries)
    assert.deepEqual(variant.testingBoundaries!.areas, [{ lengthM: 40, widthM: 30 }])
    assert.ok(variant.items.some(item => item.itemId === 'A01-R1-S5-1'), 'it still holds the 20 m pressure reference, now with the area it was given for')
    // Measured before H1: the variant was admitted at 60 x 40 m (null), its base refused.
    const variantAt = testingAreaRefusal(variant, at(60, 40))
    const baseAt = testingAreaRefusal(base, at(60, 40))
    assert.ok(variantAt && baseAt)
    assert.equal(variantAt!.summary, 'The starting positions for this activity have not been decided for a 60 x 40 m area.')
    assert.equal(variantAt!.summary, baseAt!.summary)
    assert.deepEqual(variantAt!.reasons, [`the provisional realization ${V} gives its starting values for 40 x 30 m only (its testing boundaries, his reply filed 18 October 2026, item 7): 60 x 40 m is not one of them`])
    assert.equal(testingAreaRefusal(variant, at(40, 30)), null, 'the area the values were given for is admitted')
    // Inherited as data: a change to the base's areas reaches the variant, as a copy of its own, never the base's object.
    const moved = probeFile()
    moved.realizations.find((r: any) => r.id === 'A01-R1').testingBoundaries.areas = [{ lengthM: 50, widthM: 35 }]
    // The goal version restates 40 x 30 m and keeps the pressure reference, so moving its base's area away from it refuses it, named.
    assert.deepEqual(errorsOf(moved, 'A01-R2'), [
        'realization A01-R2 states testing boundaries for 40 x 30 m and keeps A01-R1-S5-1, whose value in metres A01-R1 gives for 50 x 35 m: a variant stating another area withdraws every value in metres it would inherit, or withdraws it and restates it among its own items',
    ])
    moved.realizations = moved.realizations.filter((r: any) => r.id !== 'A01-R2')
    const movedLoad = loadProvisionalRealizations(moved)
    const movedVariant = movedLoad.find(r => r.provisionalId === V)!
    assert.deepEqual(movedVariant.testingBoundaries!.areas, [{ lengthM: 50, widthM: 35 }])
    assert.equal(testingAreaRefusal(movedVariant, at(50, 35)), null)
    movedVariant.testingBoundaries!.areas!.push({ lengthM: 1, widthM: 1 })
    assert.deepEqual(movedLoad.find(r => r.provisionalId === 'A01-R1')!.testingBoundaries!.areas, [{ lengthM: 50, widthM: 35 }])
})

// ── 2. Another area, a value in metres kept ──────────────────────────────────────────────────────────────
test('a variant stating another area, or none, that keeps a value in metres from its base is refused, each kept item named', () => {
    // Another area: both of A01-R1's values in metres are named, and nothing else (a count, a fraction of the axis, a relative position).
    const other = probeFile({ boundaries: otherArea() })
    assert.deepEqual(errorsOf(other), METRIC.map(itemId => refusalFor(V, '60 x 40 m', itemId, '40 x 30 m')))
    assert.throws(() => loadProvisionalRealizations(other), /failed its integrity gate: .*states testing boundaries for 60 x 40 m and keeps A01-R1-S5-1/)
    // The design's second case: a new area keeping only the pressure reference (A01-R1-S5-3 withdrawn) is refused for it alone.
    assert.deepEqual(errorsOf(probeFile({ boundaries: otherArea(), withdraw: ['A01-R1-S5-3'] })), [refusalFor(V, '60 x 40 m', 'A01-R1-S5-1', '40 x 30 m')])
    // A statement of no boundaries (null), or boundaries naming no area, is another area too: it would leave the values with none.
    assert.deepEqual(errorsOf(probeFile({ boundaries: null })), METRIC.map(itemId => refusalFor(V, 'no area', itemId, '40 x 30 m')))
    const { areas: _areas, ...noAreas } = otherArea()
    assert.deepEqual(errorsOf(probeFile({ boundaries: noAreas })), METRIC.map(itemId => refusalFor(V, 'no area', itemId, '40 x 30 m')))
    // One area more beside the base's is another set of areas.
    assert.deepEqual(errorsOf(probeFile({ boundaries: otherArea([{ lengthM: 40, widthM: 30 }, { lengthM: 60, widthM: 40 }]) })), METRIC.map(itemId => refusalFor(V, '40 x 30 m, 60 x 40 m', itemId, '40 x 30 m')))
    // The goal version itself, given a new area while keeping the pressure reference: refused for A01-R1-S5-1 alone (its own goal anchor,
    // 0 m from the end line, is its own item, held under its own statement; the 5 m area it already withdraws).
    const goal = copy(readJson(PROVISIONAL_REALIZATIONS_FILE))
    goal.realizations.find((r: any) => r.id === 'A01-R2').testingBoundaries.areas = [{ lengthM: 60, widthM: 40 }]
    assert.deepEqual(errorsOf(goal, 'A01-R2'), [refusalFor('A01-R2', '60 x 40 m', 'A01-R1-S5-1', '40 x 30 m')])
})

// ── 3. Withdrawn, or withdrawn and restated ──────────────────────────────────────────────────────────────
test('withdrawing, or withdrawing and restating, every value in metres admits the new area; the variant is then held to its own', () => {
    const withdrawn = probeFile({ boundaries: otherArea(), withdraw: METRIC })
    assert.deepEqual(errorsOf(withdrawn), [])
    const restated = baseRaw().items.find((i: any) => i.id === 'A01-R1-S5-1')
    const own = { ...copy(restated), id: `${V}-S5-1`, words: 'TEST-ONLY', citedAs: 'TEST-ONLY', choice: 'TEST-ONLY', basisEvidence: 'TEST-ONLY', fitNote: 'TEST-ONLY' }
    const restating = probeFile({ boundaries: otherArea(), withdraw: METRIC, items: [own] })
    assert.deepEqual(errorsOf(restating), [])
    for (const file of [withdrawn, restating]) {
        const variant = loadedVariant(file)
        assert.deepEqual(variant.testingBoundaries!.areas, [{ lengthM: 60, widthM: 40 }], 'its own statement, never the base')
        assert.equal(testingAreaRefusal(variant, at(60, 40)), null)
        assert.ok(testingAreaRefusal(variant, at(40, 30)), 'the base area is no longer its area')
        assert.ok(!variant.items.some(item => METRIC.includes(item.itemId)))
    }
    assert.ok(loadedVariant(restating).items.some(item => item.itemId === `${V}-S5-1` && carriesMetres(item, ENVELOPE_ROWS)), 'the restated value is the variant\'s own')
    // The H1 review's should-fix (carried into H2, 23 October 2026): an explicit null is a statement of none, never "inherits". A variant
    // stating null that withdraws every value in metres is admitted, loads with none (not its base's) and is refused on no area.
    const stated = probeFile({ boundaries: null, withdraw: METRIC })
    assert.deepEqual(errorsOf(stated), [])
    const none = loadedVariant(stated)
    assert.equal(none.testingBoundaries, null, 'null is its own statement: no boundaries, never its base\'s')
    assert.equal(testingAreaRefusal(none, at(60, 40)), null)
})

// ── 4. The same areas ────────────────────────────────────────────────────────────────────────────────────
test('the same areas compare equal whatever their order, repetition or the player counts beside them: nothing is refused', () => {
    assert.deepEqual(errorsOf(probeFile({ boundaries: otherArea([{ lengthM: 40, widthM: 30 }]) })), [])
    assert.deepEqual(errorsOf(probeFile({ boundaries: otherArea([{ lengthM: 40, widthM: 30 }, { lengthM: 40, widthM: 30 }]) })), [])
    assert.deepEqual(errorsOf(probeFile({ boundaries: { ...otherArea([{ lengthM: 40, widthM: 30 }]), players: [12] } })), [], 'player counts are data, not compared')
    // Two areas in either order: the base given two, the variant stating them reversed.
    const two = probeFile({ boundaries: otherArea([{ lengthM: 60, widthM: 40 }, { lengthM: 40, widthM: 30 }]) })
    two.realizations.find((r: any) => r.id === 'A01-R1').testingBoundaries.areas = [{ lengthM: 40, widthM: 30 }, { lengthM: 60, widthM: 40 }]
    assert.deepEqual(errorsOf(two), [])
    // A 30 x 40 m area is not the 40 x 30 m one (the gates read the session's length as the axis length, E2).
    assert.deepEqual(errorsOf(probeFile({ boundaries: otherArea([{ lengthM: 30, widthM: 40 }]) })), METRIC.map(itemId => refusalFor(V, '30 x 40 m', itemId, '40 x 30 m')))
})

// ── 5. Read structurally ─────────────────────────────────────────────────────────────────────────────────
test('which items carry metres is read from the register\'s rows and the item\'s numbers, never from prose', () => {
    // The rows: exactly those the register bounds by the session envelope.
    assert.deepEqual([...ENVELOPE_ROWS].sort(), (register.rows as any[]).filter(row => row.outerBound === 'SESSION_ENVELOPE').map(row => String(row.id)).sort())
    assert.ok(ENVELOPE_ROWS.size > 0)
    const base = baseRaw()
    const itemOf = (id: string) => base.items.find((i: any) => i.id === id)
    // An offset from an end line and a typed bound on an envelope row: metres.
    assert.equal(carriesMetres(itemOf('A01-R1-S5-1'), ENVELOPE_ROWS), true)
    assert.equal(carriesMetres(itemOf('A01-R1-S5-3'), ENVELOPE_ROWS), true)
    // A fraction of the axis (a term's name), a relative position (a typed reference), a count on a row of its own: none.
    assert.equal(carriesMetres(itemOf('A01-R1-S6-1'), ENVELOPE_ROWS), false)
    assert.equal(carriesMetres(itemOf('A01-R1-S5-2'), ENVELOPE_ROWS), false)
    assert.equal(carriesMetres(itemOf('A01-R1-P2-2'), ENVELOPE_ROWS), false)
    assert.equal(carriesMetres(itemOf('A01-R1-B7-1'), ENVELOPE_ROWS), false)
    // Prose is never read: metres in words on an envelope row are no value in metres, and a number off those rows is not one either.
    assert.equal(carriesMetres({ row: 'S5', value: { term: 'beyond X (for team T)', asAuthored: '20 m from the end line' }, words: '20 m' }, ENVELOPE_ROWS), false)
    assert.equal(carriesMetres({ row: 'S5', value: '5 m deep' }, ENVELOPE_ROWS), false)
    assert.equal(carriesMetres({ row: 'P2', value: 6, typedBound: { min: 5, max: 6 } }, ENVELOPE_ROWS), false)
    assert.equal(carriesMetres({ row: 'S6', value: { from: 2, to: 8 } }, ENVELOPE_ROWS), true)
    assert.equal(carriesMetres({ row: 'S5', value: 'N/A', typedBound: { min: null, max: 5 } }, ENVELOPE_ROWS), true)
    assert.equal(carriesMetres(null, ENVELOPE_ROWS), false)
    // On production it finds exactly the items the testing-boundary test lists (target-placement.unit.ts), each in a realization naming its area.
    const metric = loadProvisionalRealizations().flatMap(r => r.items.filter(item => carriesMetres(item, ENVELOPE_ROWS)).map(item => [r.provisionalId, item.itemId, !!r.testingBoundaries?.areas]))
    // Re-pointed 24 October 2026 (K2): the goal version's penalty area adds two values in metres, its depth from the goal's end line
    // (A01-R2-S5-1, an offset of 0-9 m) and its width (A01-R2-S6-2, a typed bound of 15 m), the FA 5v5 pairing's figures; both sit in A01-R2,
    // whose testing boundaries name its area (40 x 30 m), so a variant stating another area would have to withdraw or restate them too (H1).
    assert.deepEqual(metric, [
        ['A01-R1', 'A01-R1-S5-1', true],
        ['A01-R1', 'A01-R1-S5-3', true],
        ['A01-R2', 'A01-R1-S5-1', true],
        ['A01-R2', 'A01-R2-O4-1', true],
        ['A01-R2', 'A01-R2-S5-1', true],
        ['A01-R2', 'A01-R2-S6-2', true],
    ])
})

// ── 6. Production ────────────────────────────────────────────────────────────────────────────────────────
test('production: A01-R2, which restates the same boundaries, loads unchanged with its own statement; A01-R1 is untouched', () => {
    const raw = readJson(PROVISIONAL_REALIZATIONS_FILE)
    assert.deepEqual(validateProvisionalRealizations(raw), [])
    const ownOf = (id: string) => {
        const boundaries = raw.realizations.find((r: any) => r.id === id).testingBoundaries
        return { players: boundaries.players, areas: boundaries.areas, words: boundaries.words, citedAs: boundaries.citedAs, note: boundaries.note }
    }
    const r1 = provisionalRealizationNamed('A01-R1')!
    const r2 = provisionalRealizationNamed('A01-R2')!
    assert.deepEqual(r1.testingBoundaries, ownOf('A01-R1'))
    // Its own statement (its note says it is carried over from A01-R1), never the base's read in its place.
    assert.deepEqual(r2.testingBoundaries, ownOf('A01-R2'))
    assert.notEqual(r2.testingBoundaries!.note, r1.testingBoundaries!.note)
    assert.deepEqual(r2.testingBoundaries!.areas, r1.testingBoundaries!.areas)
    assert.equal(r2.basedOn, 'A01-R1')
})

console.log(`variant-testing-area.unit.ts — ${passed} passed`)
