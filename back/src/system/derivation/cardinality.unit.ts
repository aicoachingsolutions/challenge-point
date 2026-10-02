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

// ── 3 · THE CORPUS EFFECT IS CONFINED TO AUTHORED EXACT COUNTS ────────────────────────────────────
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
    assert.equal(exact.length, 5, `five authored COUNT items state an exact cardinality; got ${JSON.stringify(exact)}`)
    assert.ok(exact.some(id => id.includes('GF2-14.a')), 'including the two teams')
    assert.equal(exact.filter(id => id.includes('WIDEZONE')).length, 2, 'and the two lateral channels, one each')
}

// ── 4 · THE CARDINALITY IS NO LONGER DEAD DATA ────────────────────────────────────────────────────
{
    const input = derivationInputFor(selectFor('A04', null))
    const result: any = runDerivation(input)
    const staged: any = runStages0to10(input)
    const resolved: any = assembleResolvedGame(result, staged.classes, indexRegister(input.register), input.contracts)

    assert.ok(Array.isArray(resolved.collectionCardinality), 'the resolved game must report it')
    assert.ok(resolved.collectionCardinality.length > 0, 'a report over nothing would be vacuous')

    // Since ruling C33 each lateral channel item authors exactly ONE region, and the pair makes two.
    // Scoped to S2: since ruling C34 the Wide Zone also carries a value-modifier class on V7, which has a
    // cardinality of its own and is not a channel.
    const channels = resolved.collectionCardinality.filter((b: any) => b.classId.includes('WIDEZONE') && b.row === 'S2')
    assert.equal(channels.length, 2, 'two channel items, one per side')
    for (const bound of channels) {
        assert.equal(bound.min, 1, 'exactly one of its own side')
        assert.equal(bound.max, 1)
        assert.equal(bound.scope, 'OWN_INVOLVEMENT', 'the item scopes its count to its own channels')
        assert.equal(bound.established, 1, 'and exactly one element satisfies its selector')
    }
    assert.equal(resolved.game.space.regions.length, 3, 'two channels and the target line')
}

// ── 5 · THE POPULATION IS THE ONE THE SELECTOR REACHES, BY SUBSUMPTION ────────────────────────────
//
// Two properties at once, pulling in opposite directions — which is why selector EQUALITY would not do and
// neither would counting the whole collection:
//   · three channels all answering to `noun=channel` DO exceed an authored two;
//   · one `lateral=wide-left` channel does NOT exceed the OTHER side's authored one.
// The first is the pre-restatement defect, kept under test so the restatement cannot hide it. Both go
// through the real `assembleResolvedGame`, with synthetic classes — not through a copy of its logic here.
{
    const input = derivationInputFor(selectFor('A04', null))
    const result: any = runDerivation(input)
    const index = indexRegister(input.register)
    const noun = { attribute: 'noun', op: '=', value: 'channel' }
    const fn = { attribute: 'functions', op: 'CONTAINS', value: 'perceptual-reference' }
    const side = (value: string) => ({ attribute: 'lateral', op: '=', value })
    const cls = (classId: string, terms: unknown[], min: number | null, max: number | null) => ({
        classId,
        row: 'S2',
        fromItem: { contractId: 'restated:WIDE-ZONE-ADVANTAGE', itemId: classId },
        supportedBy: [{ contractId: 'restated:WIDE-ZONE-ADVANTAGE', itemId: classId }],
        constraints: { any: false, terms },
        cardinality: { min, max },
    })
    const boundsFor = (classes: unknown[]) =>
        (assembleResolvedGame(result, classes as any, index, input.contracts) as any).collectionCardinality as {
            classId: string
            max: number | null
            established: number
        }[]

    // Pre-restatement shape: three classes, all `noun=channel`, one authoring exactly two.
    const over = boundsFor([cls('a', [noun], 1, null), cls('b', [noun], 2, 2), cls('c', [noun, fn], 2, 2)]).find(b => b.classId === 'b')!
    assert.equal(over.established, 3, 'all three channels answer to `noun=channel`')
    assert.ok(over.established > (over.max as number), 'so the authored exactly-two is exceeded, as it was before the restatement')

    // Post-restatement shape: two classes, distinct lateral values, each authoring exactly one.
    const pair = [cls('L', [noun, side('wide-left')], 1, 1), cls('R', [noun, side('wide-right')], 1, 1)]
    for (const bound of boundsFor(pair)) {
        assert.equal(bound.established, 1, `${bound.classId}: the other side must not count against this item's bound`)
        assert.ok(bound.established <= (bound.max as number), 'so neither side refuses the other')
    }

    // A broader item still sees both, so the pair genuinely satisfies an authored two.
    const total = boundsFor([...pair, cls('T', [noun], 2, 2)]).find(b => b.classId === 'T')!
    assert.equal(total.established, 3, 'the total item is satisfied by both sides and by itself')
}

console.log('cardinality.unit.ts — ok')
