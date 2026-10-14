/**
 * Step 4, component 2 — how binding each derived value is, carried across the boundary to rendering.
 *
 * Christian, 14 October 2026: *"Preserve whether each condition is required, preferred, advisory, or left to
 * the coach, all the way through rendering and validation."* And: *"A default should not automatically become
 * a requirement simply because it is the only authored value. The engine should preserve that distinction."*
 *
 * This stage CARRIES the strength; the renderer does not use it yet (that is the next stage, with his
 * wording). So what is asserted is that the strength is computed from the items' own markings, reaches the
 * rendering fixture whole, and that nothing else moved.
 *
 * Run: npm test
 */
import assert from 'node:assert/strict'

import { assembleRenderingFixture } from '../rendering/rendering-fixture'
import { buildGoldenCase } from '../rendering/freeze-a04-fixture'
import { strengthOf } from './strength'
import { SupportRef } from './types'

let passed = 0
function test(name: string, body: () => void): void {
    body()
    passed++
    console.log(`  ok  ${name}`)
}

console.log('strength — Step 4, component 2')

const ref = (itemId: string): SupportRef => ({ kind: 'CONTRACT_ITEM', contractId: 'C', itemId, relation: 'ENTAILS' })
const items = new Map<string, any>([
    ['C:REQ', { strictness: 'REQUIRED', valueStatus: 'REQUIRED_RANGE' }],
    ['C:REQ-NA', { strictness: 'REQUIRED', valueStatus: 'N/A' }],
    ['C:PREF', { strictness: 'SUPPORTING', valueStatus: 'PREFERRED_DEFAULT' }],
    ['C:REQ-PREF', { strictness: 'REQUIRED', valueStatus: 'PREFERRED_DEFAULT' }],
    ['C:SUP', { strictness: 'SUPPORTING', valueStatus: 'REQUIRED_RANGE' }],
])

test('the three readings, from the items\' markings alone', () => {
    assert.equal(strengthOf([ref('REQ')], items), 'REQUIRED')
    assert.equal(strengthOf([ref('REQ-NA')], items), 'REQUIRED')
    // His "a default is not a requirement because it is the only authored value" — on the value-status axis,
    // whatever the strictness says (REQUIRED|PREFERRED_DEFAULT occurs twice in the corpus).
    assert.equal(strengthOf([ref('PREF')], items), 'DEFAULT')
    assert.equal(strengthOf([ref('REQ-PREF')], items), 'DEFAULT')
    assert.equal(strengthOf([ref('SUP')], items), 'ADVISORY', 'computed and carried; rendered as before until his OD2 ruling')
})

test('anything stronger wins, and nothing is softened on a guess', () => {
    assert.equal(strengthOf([ref('PREF'), ref('REQ')], items), 'REQUIRED')
    assert.equal(strengthOf([ref('SUP'), ref('REQ')], items), 'REQUIRED')
    assert.equal(strengthOf([{ kind: 'STANDING_DECISION', id: 'SD-25' }], items), 'REQUIRED')
    assert.equal(strengthOf([{ kind: 'SESSION', row: 'E1' }], items), 'REQUIRED')
    assert.equal(strengthOf([], items), 'REQUIRED', 'no support: rendered exactly as before')
    assert.equal(strengthOf([ref('NOT-HELD')], items), 'REQUIRED', 'an item the contracts do not hold: rendered exactly as before')
})

const golden: any = buildGoldenCase()

test('the Golden Case: what continues at a change of possession is a DEFAULT; the area and the targets are REQUIRED', () => {
    const at = (lineId: string) => golden.status.derived.find((d: any) => d.lineId === lineId)
    // GF2-17 is authored once, SUPPORTING / PREFERRED_DEFAULT — the only authored value, and a default.
    assert.deepEqual([at('c:restated:GF2:GF2-07.a::T6').value, at('c:restated:GF2:GF2-07.a::T6').strength], ['CONTINUE', 'DEFAULT'])
    for (const lineId of ['game::E1', 'game::E2', 'game::E3', 'game::E4', 'game::V2', 'c:restated:GF2:GF2-03.e::S5', 'c:restated:GF2:GF2-08.c::J3']) {
        assert.equal(at(lineId).strength, 'REQUIRED', lineId)
    }
    assert.ok(golden.status.derived.every((d: any) => ['REQUIRED', 'DEFAULT', 'ADVISORY'].includes(d.strength)), 'every derived entry carries a strength')
    assert.deepEqual(
        golden.status.derived.filter((d: any) => d.strength !== 'REQUIRED').map((d: any) => d.lineId),
        ['c:restated:GF2:GF2-07.a::T6'],
        'and it is the only one of the seventeen that is not required',
    )
})

test('an ASSUMED bound says so, and an authored one does not', () => {
    const s1 = golden.status.bounds.find((b: any) => b.lineId === 'game::S1').bounds
    assert.deepEqual(s1, [{ kind: 'SET', members: ['the longer envelope dimension'], preferred: true, assumed: true }])
    const within = golden.status.choices.flatMap((choice: any) => choice.within?.bounds ?? [])
    assert.ok(within.some((bound: any) => bound.assumed === true), 'the targets\' across-position bound is the restater\'s reading')
    assert.ok(!JSON.stringify(golden.status.bounds).includes('"assumed":false'), 'present only where true')
})

test('the fixture boundary carries EVERY key of a derived entry — it is not an allowlist', () => {
    // A key nobody has thought of yet must cross too: the allowlist this replaced dropped each new field.
    const resolved: any = {
        provenance: {},
        coherence: { preRealization: 'P', realizationAuthorized: true },
        derived: [{ path: 'p', lineId: 'l', value: 1, resolvedBy: 'r', support: [], strength: 'DEFAULT', aFieldNotYetInvented: 'x' }],
        extentBounds: {},
        jointConditions: [],
        notEstablished: [],
    }
    const realized: any = { game: {}, record: { choices: [], instantiations: [], geometry: [] } }
    const fixture: any = assembleRenderingFixture({ resolved, realized, entailed: [], envelope: { players: 1, lengthM: 1, widthM: 1, durationMin: 1, roles: {} }, accepted: true, postRealizationValidated: true })
    assert.deepEqual(fixture.status.derived, resolved.derived)
    assert.notEqual(fixture.status.derived[0], resolved.derived[0], 'a copy, so the fixture cannot edit the resolved game')
    for (const entry of golden.status.derived) assert.deepEqual(Object.keys(entry).sort(), ['lineId', 'path', 'resolvedBy', 'strength', 'support', 'value'])
})

console.log(`strength.unit.ts — ${passed} passed`)
