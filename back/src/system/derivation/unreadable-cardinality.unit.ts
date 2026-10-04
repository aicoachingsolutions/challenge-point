/**
 * **Fail rather than infer** — his ruling of 3 October:
 *
 *   > *If knowledge establishes that a cardinality claim exists but its value cannot be read/established, the
 *   > engine should not silently weaken it to a minimum of one. The governing principle remains: Fail rather
 *   > than infer.*
 *
 * The inference was one expression: `shortfall: Math.max(0, (min ?? 1) - established.length)`. A `COUNT` or
 * `RANGE` requirement whose number the parser could not read became *"at least one"* — weaker than anything
 * any author wrote. The corpus attests the damage rather than merely allowing for it: `PCG-08` authored
 * *"at least 2 teams"*, reached the engine as a minimum of one, and had to be typed under SD-86 (C37).
 *
 * **The distinction that makes the correction safe.** A null minimum is not by itself unreadable. A class is
 * formed only for a requirement in `EXISTS | COUNT | RANGE`; `EXISTS` is given `{min: 1}` outright; so
 * `min === null` beside a `max` is an authored **ceiling with no floor**, which is a complete claim and must
 * keep working. Only `min === null && max === null` is a count requirement that stated nothing readable.
 * Failing on the wrong one of those two would be a new defect, so both are asserted here.
 *
 * **Blast radius, measured before the change and pinned here:** one claim corpus-wide
 * (`restated:RPC-001:RPC-001-14.a`, `objectives[]`, authored `">=1"`), selected by **none** of the thirteen
 * goals, and no goal's authorization changes. The authored `>=1` is the same unreadable-number shape as
 * `PCG-08` and `NEUTRAL-01.a` — reported as a gap, deliberately NOT typed, because he asked for the gaps
 * rather than a corpus-cleanup exercise.
 */
import assert from 'node:assert/strict'

import { corpusInput, loadCorpusContracts } from './corpus'
import { countBounds } from './derive'
import { runDerivation, runStages0to10 } from './engine'
import { indexRegister } from './register'
import { assembleResolvedGame } from './resolved-game'
import { derivationInputFor, selectFor } from './run-bounded-selection'
import { sessionPlanningModel } from '../session-planning/session-planning-model'
import { realize } from '../realization/realize'

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

function resolvedFor(input: any) {
    const result: any = runDerivation(input)
    const staged: any = runStages0to10(input)
    const index = indexRegister(input.register)
    return { resolved: assembleResolvedGame(result, staged.classes, index, input.contracts) as any, index }
}

const corpus = resolvedFor(corpusInput())

// ── The one unreadable claim, and it is reported as unknown rather than as satisfied ───────────────
test('an unreadable cardinality yields shortfall null, not zero and not one', () => {
    const unreadable = (corpus.resolved.existential as any[]).filter(c => c.cardinalityUnreadable)
    assert.equal(unreadable.length, 1, `exactly one corpus-wide, got ${unreadable.map(u => u.classId).join(', ')}`)
    const claim = unreadable[0]
    assert.equal(claim.classId, 'c:restated:RPC-001:RPC-001-14.a')
    assert.equal(claim.cardinality.min, null)
    assert.equal(claim.cardinality.max, null)
    assert.equal(claim.shortfall, null, 'the owed count is UNKNOWN — substituting one is the inference removed')
})

test('the authored value really is unreadable, so the flag is not mislabelling a readable claim', () => {
    const item = (loadCorpusContracts() as any[])
        .flatMap(c => (c.items ?? []).map((i: any) => ({ contractId: c.contractId, ...i })))
        .find(i => String(i.itemId) === 'RPC-001-14.a')
    assert.ok(item, 'the item is loaded')
    assert.equal(String(item.value), '>=1', 'the authored value')
    assert.equal(String(item.requirement), 'RANGE', 'a count requirement, so a claim genuinely exists')
    assert.equal(countBounds(item), null, 'and the one canonical count reader reads nothing from it')
    assert.equal(item.typedBound, undefined, 'deliberately NOT typed — the gap is reported, not repaired')
})

// ── THE DISTINCTION: a ceiling with no floor is a COMPLETE claim and must keep working ─────────────
test('a null minimum beside a maximum is a ceiling with no floor, not an unreadable count', () => {
    // Asserted structurally, because the corpus currently holds no such claim — so without this the
    // discriminator would be untested in the direction that matters for not over-reaching.
    const index = indexRegister(corpusInput().register)
    const ceilingOnly = {
        ...corpus.resolved,
        existential: [
            {
                path: 'objects',
                classId: 'K-ceiling',
                from: { contractId: 'T', itemId: 'T-1' },
                cardinality: { min: null, max: 3 },
                satisfiedBy: [],
                cardinalityUnreadable: false,
                shortfall: 0,
            },
        ],
        coherence: { ...corpus.resolved.coherence, mayRealize: true },
    }
    const out: any = realize(ceilingOnly as any, [], [], index, {})
    const objections = ((out.because ?? []) as string[]).filter(b => /K-ceiling|UNBOUNDED_COUNT_FILL/.test(b))
    assert.deepEqual(objections, [], `a ceiling with no floor must not be refused as unreadable: ${JSON.stringify(objections)}`)
})

// ── FORCE IT THROUGH: the realizer refuses, and names the existing refusal kind ────────────────────
//
// The discipline this project keeps relearning — a check proves nothing until a wrong value has been forced
// through it. So an unreadable claim is driven into the realizer directly.
test('the realizer REFUSES an unreadable claim, however many members are offered', () => {
    const index = indexRegister(corpusInput().register)
    const withUnreadable = {
        ...corpus.resolved,
        existential: [
            {
                path: 'objectives',
                classId: 'K-unreadable',
                from: { contractId: 'T', itemId: 'T-UNREADABLE' },
                cardinality: { min: null, max: null },
                satisfiedBy: [],
                cardinalityUnreadable: true,
                shortfall: null,
            },
        ],
        coherence: { ...corpus.resolved.coherence, mayRealize: true },
    }
    for (const count of [0, 1, 2, 5]) {
        const out: any = realize(
            withUnreadable as any,
            [],
            Array.from({ length: count }, () => ({ classId: 'K-unreadable', member: {}, because: 'probe' })),
            index,
            {},
        )
        const refusal = ((out.because ?? []) as string[]).filter(b => /UNBOUNDED_COUNT_FILL/.test(b))
        assert.equal(refusal.length, 1, `${count} members offered must still refuse: ${JSON.stringify(out.because)}`)
        assert.match(refusal[0], /states no readable number/, refusal[0])
        assert.match(refusal[0], /SD-86/, 'the refusal must say what would fix it')
    }
})

test('UNBOUNDED_COUNT_FILL is the refusal kind the closed list already reserves', () => {
    // Using a reserved kind rather than adding one: "Adding one is a design change" (package §3.3).
    const { REFUSAL_KINDS } = require('./types') as { REFUSAL_KINDS: readonly string[] }
    assert.ok(REFUSAL_KINDS.includes('UNBOUNDED_COUNT_FILL'), 'the kind is in the closed list')
})

// ── BLAST RADIUS: no goal is affected, and A04 is untouched ────────────────────────────────────────
test('no learning goal carries an unreadable claim, so no goal outcome changes', () => {
    const goals: string[] = ((sessionPlanningModel as any).learningGoals?.() ?? []).map((g: any) => g.ID ?? g.id).filter(Boolean)
    assert.equal(goals.length, 13, 'thirteen goals')
    const affected: string[] = []
    for (const goal of goals) {
        const { resolved } = resolvedFor(derivationInputFor(selectFor(goal, null)))
        if ((resolved.existential as any[]).some(c => c.cardinalityUnreadable)) affected.push(goal)
    }
    assert.deepEqual(affected, [], `the correction must touch no goal, and touches ${affected.join(', ') || 'none'}`)
})

test('A04 still authorizes realization, and every claim it carries has a readable count', () => {
    const { resolved } = resolvedFor(derivationInputFor(selectFor('A04', null)))
    assert.equal(resolved.coherence.realizationAuthorized, true, 'A04 is unaffected')
    for (const claim of resolved.existential as any[]) {
        assert.equal(claim.cardinalityUnreadable, false, `${claim.classId} must have a readable count`)
        assert.equal(typeof claim.shortfall, 'number', `${claim.classId}: a readable claim owes a number`)
    }
})

// ── And the display layer must not re-derive the inference the engine refused ──────────────────────
test('no reporter prints "at least one" for an unreadable count', () => {
    const fs = require('node:fs') as typeof import('node:fs')
    const path = require('node:path') as typeof import('node:path')
    for (const rel of [
        'derivation/run-resolved-game.ts',
        'realization/run-first-game.ts',
        'realization/run-realization.ts',
    ]) {
        const text = fs.readFileSync(path.resolve(__dirname, '..', rel), 'utf8')
        assert.doesNotMatch(
            text,
            /'at least one'/,
            `${rel}: a reporter that re-derives the engine's removed inference puts it back in front of a reader`,
        )
    }
})

console.log(`unreadable-cardinality: ${passed} passed`)
if (process.exitCode) console.log('unreadable-cardinality: FAILURES ABOVE')
