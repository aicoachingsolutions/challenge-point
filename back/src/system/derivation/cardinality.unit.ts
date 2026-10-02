/**
 * Authored collection cardinality: read exactly, and made to constrain.
 *
 * His direction of 1 October: *"An authored exact COUNT 2 must remain exactly 2, and an authored collection
 * cardinality must actually constrain resolution rather than becoming dead data. Please regression-test
 * both, including the asymmetry you found between exclusion and establishment."*
 *
 * Two defects, one test file:
 *
 *   1. **An exact COUNT was indistinguishable from a lower bound.** `cardinalityOf` had its own copy of the
 *      count parse, written earlier than the canonical one and never brought forward. Its bare-digit match
 *      was unanchored and it never consulted `item.requirement`, so an authored `COUNT "2"` and a prose
 *      `"2 or more"` parsed alike and the Wide Zone's *exactly two channels* reached the engine as *at
 *      least two*.
 *   2. **The parsed number was then dead data.** It was consumed only through `existential`, and a class
 *      carrying a selector never becomes an existential claim (SD-97) — so a COLLECTION row gets no
 *      resolution line, the class forms no claim, and the authored count constrained nothing at all.
 *
 * And the asymmetry, which is the reason the first defect is a defect rather than a preference: the engine
 * **refuses** to read a count out of prose on the exclusion side, citing SD-32 in terms. The establishing
 * side guessed. One reader now serves both, so the two sides agree by construction rather than by review.
 */
import assert from 'node:assert/strict'

import { loadCorpusContracts } from './corpus'
import { countBounds, establishesExistence } from './derive'
import { runDerivation, runStages0to10 } from './engine'
import { indexRegister } from './register'
import { assembleResolvedGame } from './resolved-game'
import { derivationInputFor, selectFor } from './run-bounded-selection'

// ── 1 · AN EXACT COUNT IS EXACT ───────────────────────────────────────────────────────────────────
{
    assert.deepEqual(countBounds({ requirement: 'COUNT', value: '2' }), { min: 2, max: 2 }, 'an authored exact COUNT 2 must remain exactly 2')
    assert.deepEqual(countBounds({ requirement: 'COUNT', value: 2 }), { min: 2, max: 2 }, 'and the same when authored as a number')
    assert.deepEqual(countBounds({ requirement: 'RANGE', value: '2' }), { min: 2, max: null }, 'a RANGE of 2 is a floor, not an exact count')

    // The distinction the old parser could not make. Both of these used to give {min:2,max:null}.
    assert.deepEqual(countBounds({ requirement: 'COUNT', value: '2' }), { min: 2, max: 2 })
    assert.equal(countBounds({ requirement: 'COUNT', value: '2 or more (forbidden)' }), null, 'a count embedded in prose is not a count')

    // Anchored at both ends: a number that IS the value is read, a number inside prose is not. That is the
    // line SD-32 draws, and the unanchored /^(\d+)/ crossed it.
    assert.equal(countBounds({ requirement: 'COUNT', value: '2 teams of equal size' }), null)
    assert.deepEqual(countBounds({ requirement: 'COUNT', value: ' 2 ' }), { min: 2, max: 2 }, 'surrounding whitespace is not prose')

    // Explicit min/max still read, and a typed bound still wins (SD-86).
    assert.deepEqual(countBounds({ requirement: 'RANGE', value: 'minimum 1, maximum 3' }), { min: 1, max: 3 })
    assert.deepEqual(countBounds({ requirement: 'RANGE', value: 'anything at all', typedBound: { min: 6, max: 10 } }), { min: 6, max: 10 })
    assert.equal(countBounds({ requirement: 'COUNT', value: 'one or two' }), null, 'a spelled-out count is not read; SD-15 forbids inventing the number')
}

// ── 2 · THE ASYMMETRY BETWEEN EXCLUSION AND ESTABLISHMENT ─────────────────────────────────────────
//
// The exclusion side refuses a prose count, saying guessing "would decide the item's meaning". With one
// reader, the establishing side now refuses the same value — so the two agree. Pinned here because the
// defect was precisely that they diverged while both looked correct in isolation.
{
    const proseCount = { requirement: 'COUNT', value: '2 or more (forbidden)', basis: 'AUTHORED', strictness: 'EXCLUSION' }
    assert.equal(countBounds(proseCount), null, 'the establishing side must refuse a prose count, as the exclusion side does')

    const bare = { requirement: 'COUNT', value: '2', basis: 'AUTHORED', strictness: 'REQUIRED' }
    assert.deepEqual(countBounds(bare), { min: 2, max: 2 }, 'and must read a bare one, which is a number rather than prose')

    // The real corpus item that exposed it: an EXCLUSION carrying a prose count forms no class at all, so
    // its value is never asked for — but if it were, it would now read the same as on the other side.
    const widezone = (loadCorpusContracts() as any[]).find(c => /WIDE/i.test(String(c.contractId)))
    const forbidden = (widezone.items ?? []).find((i: any) => String(i.value ?? '').includes('or more (forbidden)'))
    assert.ok(forbidden, 'the corpus must still contain the prose-count exclusion this pins')
    assert.equal(establishesExistence(forbidden), false, 'an EXCLUSION establishes no existence (so no class is formed)')
    assert.equal(countBounds(forbidden), null, 'and its prose count is unreadable from either direction')
}

// ── 3 · THE CORPUS EFFECT IS EXACTLY THE FIVE AUTHORED COUNT-2 ITEMS ──────────────────────────────
// Scoped so a later change to the parse cannot quietly alter other items' cardinality.
{
    const index = indexRegister(derivationInputFor(selectFor('A04', null)).register)
    const exact: string[] = []
    for (const contract of loadCorpusContracts() as any[]) {
        for (const item of contract.items ?? []) {
            if (index.rows.get(String(item.row))?.kind !== 'COLLECTION') continue
            if (!establishesExistence(item)) continue
            const bounds = countBounds(item)
            if (bounds && bounds.min === bounds.max && bounds.min !== null) exact.push(`${contract.contractId}::${item.itemId}`)
        }
    }
    assert.equal(exact.length, 5, `exactly five authored COUNT items state an exact cardinality; got ${JSON.stringify(exact)}`)
    assert.ok(exact.some(id => id.includes('GF2-14.a')), 'including the two teams')
    assert.ok(exact.filter(id => id.includes('WIDEZONE')).length === 2, 'and the two Wide Zone channel counts')
}

// ── 4 · THE CARDINALITY IS NO LONGER DEAD DATA ────────────────────────────────────────────────────
{
    const input = derivationInputFor(selectFor('A04', null))
    const result: any = runDerivation(input)
    const staged: any = runStages0to10(input)
    const resolved: any = assembleResolvedGame(result, staged.classes, indexRegister(input.register), input.contracts)

    assert.ok(Array.isArray(resolved.collectionCardinality), 'the resolved game must report it')
    assert.ok(resolved.collectionCardinality.length > 0, 'a report over nothing would be vacuous')

    const channels = resolved.collectionCardinality.filter((b: any) => b.classId.includes('WIDEZONE'))
    assert.ok(channels.length >= 2, 'the Wide Zone channel counts must be reported')
    for (const bound of channels.filter((b: any) => b.max !== null)) {
        assert.equal(bound.max, 2, 'authored exactly two')
        assert.equal(bound.min, 2)
        assert.equal(bound.scope, 'OWN_INVOLVEMENT', 'the item scopes its count to its own channels')
    }

    /**
     * **The population is the one the item's scope names, not the whole collection.**
     *
     * My first implementation counted every region, so the Wide Zone's "exactly two" was violated by GF2's
     * target line — a region it says nothing about. The authoring note is explicit that the count is
     * "counted over this contract's own channels so another object's channel cannot break it", so an
     * OWN_INVOLVEMENT count that implicated another object would make the author's guard meaningless.
     */
    const wideZoneCount = channels.find((b: any) => b.max === 2)
    assert.equal(wideZoneCount.established, 3, 'three channel classes from this contract, not four regions in the game')
    const regionsInGame = resolved.game.space.regions.length
    assert.equal(regionsInGame, 4, 'the collection really does hold four regions, which is why the scoping matters')
}

// ── 5 · AND IT CONSTRAINS: A04 IS REFUSED WHERE THE AUTHORED COUNT IS EXCEEDED ────────────────────
//
// The whole point of the second fix. Three channel regions against an authored exactly-two is a population
// realization cannot fix by choosing well, so it refuses — naming the item and both numbers.
{
    const input = derivationInputFor(selectFor('A04', null))
    const result: any = runDerivation(input)
    const staged: any = runStages0to10(input)
    const index = indexRegister(input.register)
    const resolved: any = assembleResolvedGame(result, staged.classes, index, input.contracts)

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { realize, isRefused } = require('../realization/realize')
    const outcome = realize(resolved, [], [], index, input.envelope)
    assert.equal(isRefused(outcome), true, 'a game establishing more elements than its knowledge authors must be refused')
    assert.ok(
        outcome.because.some((r: string) => r.includes('at most 2') && r.includes('establishes 3')),
        `the refusal must name the authored bound and the real count; got ${JSON.stringify(outcome.because)}`,
    )

    // TEETH: with the bound removed, that refusal disappears — so it is the bound doing the work.
    const without = { ...resolved, collectionCardinality: [] }
    const permissive = realize(without, [], [], index, input.envelope)
    const stillCardinality = isRefused(permissive)
        ? (permissive.because as string[]).filter(r => r.includes('at most'))
        : []
    assert.deepEqual(stillCardinality, [], 'with no authored cardinality there is no cardinality refusal')
}

console.log('cardinality.unit.ts — ok')
