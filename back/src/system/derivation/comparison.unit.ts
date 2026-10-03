/**
 * **`COMPARES`, activated** — his instruction of 3 October.
 *
 *   > *AM-16 already introduced `COMPARES` for comparison between represented properties, so please don't
 *   > introduce another mechanism or continue relying on prose matching for `"equal"`.*
 *
 * The kind had been registered since 20 September and **no corpus item used it**, while four P2 items carried
 * fitNotes declaring that no requirement kind compares two elements. This file pins the evaluator against the
 * register's own `comparison` block, and pins what became expressible versus what stayed authoring-limited.
 *
 * The one that stayed: the authored team-size equality. Both its operands name `P2`, a row owned by
 * `performers.teams[]`, so each matches BOTH members — and `comparison.stillOpen` says *"No aggregate function
 * is named (each, some, the sum, the greatest) for a comparison ranging over several matched elements. An
 * engine refuses such a comparison rather than choosing one."* Naming the members individually is not open
 * either, because no knowledge item may target a member's opaque handle. So it is **declared and refused**,
 * which is reported rather than worked around.
 */
import assert from 'node:assert/strict'

import { comparisonOf, comparisonsIn, evaluateComparison, evaluateComparisons, OPERATORS } from './comparison'
import { loadCorpusContracts } from './corpus'
import { indexRegister } from './register'
import { derivationInputFor, selectFor } from './run-bounded-selection'

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

const input = derivationInputFor(selectFor('A04', null))
const index = indexRegister(input.register)
const contracts = input.contracts as any[]

// ── The register's own grammar is what is implemented ──────────────────────────────────────────────
test('the operators are exactly the registered set', () => {
    const registered = String((input.register as any).comparison.form).match(/\{([^}]*)\}\s*$/)?.[1] ?? ''
    for (const operator of OPERATORS) {
        assert.ok(registered.includes(operator), `the register's form must name ${operator}: "${registered}"`)
    }
    assert.equal(OPERATORS.length, 6, 'six operators, as the register states')
})

test('the register still carries stillOpen, which is why the roster equality is refused', () => {
    const stillOpen = String((input.register as any).comparison.stillOpen)
    assert.match(stillOpen, /No aggregate function is named/, stillOpen)
    assert.match(stillOpen, /refuses such a comparison rather than choosing one/, stillOpen)
})

// ── The authored equality is now DECLARED, and prose is no longer consulted ────────────────────────
test('GF2-14.b carries a typed comparison, not just the word "equal" in its prose', () => {
    const found = comparisonsIn(contracts)
    const equality = found.find(c => c.from.itemId === 'GF2-14.b')
    assert.ok(equality, `GF2-14.b must carry a typed comparison; found ${found.map(f => f.from.itemId).join(', ') || 'none'}`)
    assert.equal(equality!.operator, '=')
    assert.deepEqual(equality!.left, { row: 'P2', selector: '*' })
    assert.deepEqual(equality!.right, { row: 'P2', selector: '*' })
    assert.equal(equality!.authoritative, true, 'it is OWNER_RULING, so it may fail authoritatively')
})

// ── NEGATIVE: the "unequal" item must never be read as declaring equality ─────────────────────────
//
// This is the defect class that produced the prose-matching hardening in the first place: an AUTHORED item
// reading "unequal between the teams, e.g. 4 and 6 (4v6)" once licensed an equal division because `/equal/i`
// matched its own negation. Reading a DECLARED relation removes the class — so assert the item declares none.
test('the authored "unequal" item declares no comparison, so it cannot license equality', () => {
    const unequal = contracts
        .flatMap(c => (c.items ?? []).map((i: any) => ({ contractId: c.contractId, item: i })))
        .filter(({ item }) => /unequal/i.test(String(item.value ?? '')))
    for (const { contractId, item } of unequal) {
        assert.equal(
            comparisonOf(contractId, item),
            null,
            `an item valued "${item.value}" must declare no comparison, or asymmetry would read as equality`,
        )
    }
})

// ── Evaluation: the register's rules, each exercised ──────────────────────────────────────────────
const game = {
    performers: { teams: [{ elementId: 'K#1', outfieldCount: 6 }, { elementId: 'K#2', outfieldCount: 6 }] },
    envelope: {},
}
const comparison = (left: any, operator: any, right: any, authoritative = true) =>
    ({ left, operator, right, asAuthored: 'probe', from: { contractId: 'T', itemId: 'T-1' }, authoritative } as any)

test('a comparison over several matched elements is REFUSED, never reduced to one', () => {
    const result = evaluateComparison(comparison({ row: 'P2' }, '=', { row: 'P2' }), game as any, index)
    assert.equal(result.verdict, 'REFUSED_MULTI_ELEMENT', result.detail)
    assert.match(result.detail, /stillOpen/, 'the refusal must cite the register rule that requires it')
})

test('an operand that does not resolve is NOT_EVALUABLE, never quietly true', () => {
    const result = evaluateComparison(comparison({ row: 'P2' }, '=', { row: 'P3' }), { performers: { teams: [] } } as any, index)
    assert.equal(result.verdict, 'NOT_EVALUABLE', result.detail)
})

test('an unregistered row is MALFORMED, and an unknown operator too', () => {
    assert.equal(evaluateComparison(comparison({ row: 'NO-SUCH' }, '=', { row: 'P2' }), game as any, index).verdict, 'NOT_EVALUABLE')
    assert.equal(evaluateComparison(comparison({ row: 'P2' }, '~=', { row: 'P2' }), game as any, index).verdict, 'MALFORMED')
})

test('a derived operand naming no registered rule does not resolve', () => {
    const result = evaluateComparison(comparison({ derived: 'effectiveValue' }, '>', { row: 'P2' }), game as any, index)
    assert.equal(result.verdict, 'NOT_EVALUABLE', result.detail)
    assert.match(result.detail, /names no registered rule/, result.detail)
})

// ── A single-element comparison DOES evaluate — this is what the handles made possible ────────────
test('a comparison whose operands each resolve to one element is evaluated, both ways', () => {
    const oneEach = {
        performers: { teams: [{ elementId: 'K#1', outfieldCount: 6 }] },
        possession: { team: 6 },
    }
    const holdsResult = evaluateComparison(comparison({ row: 'P2' }, '=', { row: 'PS1' }), oneEach as any, index)
    assert.equal(holdsResult.verdict, 'HOLDS', holdsResult.detail)

    const violated = evaluateComparison(comparison({ row: 'P2' }, '=', { row: 'PS1' }), { ...oneEach, possession: { team: 5 } } as any, index)
    assert.equal(violated.verdict, 'VIOLATED', violated.detail)
    assert.match(violated.detail, /6 = .*5|6.*=.*5/, violated.detail)
})

// ── SD-27: an assumed comparison may report but never fail authoritatively ────────────────────────
test('an assumed comparison is not authoritative, so it cannot create a collision', () => {
    const oneEach = { performers: { teams: [{ elementId: 'K#1', outfieldCount: 6 }] }, possession: { team: 5 } }
    const assumed = evaluateComparison(comparison({ row: 'P2' }, '=', { row: 'PS1' }, false), oneEach as any, index)
    assert.equal(assumed.verdict, 'VIOLATED', 'it is still evaluated and still reported')
    assert.equal(assumed.comparison.authoritative, false, 'but it may not drive an authoritative failure (SD-27)')
})

// ── On the live A04 game: declared, and refused for the register's own reason ─────────────────────
test('on A04 the authored equality is declared and REFUSED, and that is the finding', () => {
    const results = evaluateComparisons(contracts, game as any, index)
    const equality = results.find(r => r.comparison.from.itemId === 'GF2-14.b')
    assert.ok(equality, 'the comparison is found and evaluated rather than ignored')
    assert.equal(equality!.verdict, 'REFUSED_MULTI_ELEMENT', equality!.detail)
    // And it is NOT counted as holding — the distinction the whole exercise is about.
    assert.notEqual(equality!.verdict, 'HOLDS', 'a refused comparison must never be mistaken for a satisfied one')
})

// ── THE FOUR STALE fitNotes, corrected — and no authority promoted with them ──────────────────────
//
// His instruction: *"Please trace the four stale P2 fitNotes and correct the claim that no comparison
// requirement exists"*, with the limit: *"Where an item is only a TYPICAL_EXAMPLE or otherwise lacks
// authority, don't promote it merely because COMPARES now exists."*
test('the four stale comparison claims are corrected, and only the authoritative one is typed', () => {
    const expected: Record<string, { basis: string; status: string; typed: boolean }> = {
        'GF2-14.b': { basis: 'OWNER_RULING', status: 'REQUIRED_RANGE', typed: true },
        'NEUTRAL-08.a': { basis: 'AUTHORED', status: 'REQUIRED_RANGE', typed: false },
        'NEUTRAL-09.a': { basis: 'ASSUMED', status: 'PREFERRED_DEFAULT', typed: false },
        'NEUTRAL-10.a': { basis: 'ASSUMED', status: 'REQUIRED_RANGE', typed: false },
    }
    // The Neutral Player Condition is contracted but not selected by A04, so the whole corpus is read here.
    const items = (loadCorpusContracts() as any[]).flatMap(c => (c.items ?? []).map((i: any) => ({ contractId: c.contractId, ...i })))
    for (const [itemId, want] of Object.entries(expected)) {
        const item = items.find(i => String(i.itemId) === itemId)
        assert.ok(item, `${itemId} must be loaded`)
        const note = String(item.fitNote ?? '')
        assert.match(note, /AM-16/, `${itemId}: the correction must cite the amendment that removed the limitation`)
        assert.match(note, /STALE CLAIM CORRECTED|TYPED AS A COMPARISON/, `${itemId}: the correction must be marked`)
        // Authority is untouched by the correction — the mechanism arriving is not a promotion.
        assert.equal(String(item.basis), want.basis, `${itemId}: basis must not move`)
        assert.equal(String(item.valueStatus), want.status, `${itemId}: status must not move`)
        assert.equal(!!item.comparison, want.typed, `${itemId}: only the authoritative equality is typed`)
    }
})

// ── AND NOTHING ELSE WAS SWEPT UP: a genuine schema limitation must still say so ───────────────────
test('SCHEMA LOCAL notes about MISSING ROWS are untouched — only the comparison claim was stale', () => {
    const items = (loadCorpusContracts() as any[]).flatMap(c => (c.items ?? []).map((i: any) => ({ contractId: c.contractId, ...i })))
    const missingRow = items.filter(i => /No row holds|No orientation row|No register row holds/i.test(String(i.fitNote ?? '')))
    assert.ok(missingRow.length > 0, 'the corpus still records genuine missing-row limitations')
    for (const item of missingRow) {
        assert.doesNotMatch(
            String(item.fitNote),
            /STALE CLAIM CORRECTED/,
            `${item.itemId}: a missing ROW is a real limitation and must not be recorded as a stale comparison claim`,
        )
    }
})

console.log(`comparison: ${passed} passed`)
if (process.exitCode) console.log('comparison: FAILURES ABOVE')
