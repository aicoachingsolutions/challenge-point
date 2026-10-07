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
    // `result` is returned too: the gate report is the only place a check's verdict can be read, and one
    // test below needs to say WHICH check withholds authorization rather than merely that something does.
    return { resolved: assembleResolvedGame(result, staged.classes, index, input.contracts) as any, index, result }
}

const corpus = resolvedFor(corpusInput())

// ── NO unreadable claim remains, because the one this exposed has since been typed ─────────────────
//
// The 3 October correction exposed exactly one: `restated:RPC-001:RPC-001-14.a`, authored `">=1"`, which the
// count reader could not read. It was reported as a gap and deliberately left untyped, because he asked for the
// gaps rather than a corpus-cleanup exercise. He then ruled it typed on 4 October (C38) as the same
// normalization class as PCG-08 and NEUTRAL-01.a. So the end state is a corpus with no unreadable cardinality
// at all — and the mechanism is still exercised below, by forcing one through.
test('no existential claim in the corpus has an unreadable cardinality', () => {
    const unreadable = (corpus.resolved.existential as any[]).filter(c => c.cardinalityUnreadable)
    assert.deepEqual(
        unreadable.map(u => u.classId),
        [],
        'every authored count is now readable; an unreadable one would mean a number is sitting in prose again',
    )
    for (const claim of corpus.resolved.existential as any[]) {
        assert.equal(typeof claim.shortfall, 'number', `${claim.classId}: a readable claim owes a number`)
    }
})

test('the item this exposed is typed, and its authored prose is still unreadable without the typed field', () => {
    const item = (loadCorpusContracts() as any[])
        .flatMap(c => (c.items ?? []).map((i: any) => ({ contractId: c.contractId, ...i })))
        .find(i => String(i.itemId) === 'RPC-001-14.a')
    assert.ok(item, 'the item is loaded')
    assert.equal(String(item.value), '>=1', 'the authored prose is unchanged beside the typed form')
    assert.equal(String(item.requirement), 'RANGE', 'a count requirement, so a claim genuinely exists')
    assert.deepEqual(item.typedBound, { min: 1, max: null }, 'typed under SD-86: the authored 1, and no invented maximum')

    // The teeth: without the typed field the prose really is unreadable, so the typing is carrying the number
    // rather than the parser having learned to read it.
    const { typedBound, ...withoutTyped } = item
    assert.equal(countBounds(withoutTyped), null, 'the canonical count reader still reads nothing from ">=1"')
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

/**
 * **The assertion here has moved twice, and the current form is the strongest of the three.**
 *
 * It began as `realizationAuthorized === true`, used as a proxy for "A04 is unaffected by the cardinality
 * work". The 5 October reachability ruling made that proxy false for a reason with nothing to do with
 * cardinality, so it was replaced by a tighter claim: reachability is the ONLY check with a failing clause.
 * The Soccer Sport Profile of 6 October satisfies reachability, so A04 now has no failing clause at all.
 *
 * Asserting the empty list keeps the property this test actually exists to protect — if a cardinality change
 * ever breaks A04, a check appears in that list and this fails naming it — while no longer carrying a
 * permitted exception that would have to be maintained every time an unrelated ruling lands. An empty list
 * is also the only form that cannot quietly grow a second entry.
 */
test('A04 carries only readable counts, and nothing blocks it', () => {
    const { resolved, result } = resolvedFor(derivationInputFor(selectFor('A04', null)))
    for (const claim of resolved.existential as any[]) {
        assert.equal(claim.cardinalityUnreadable, false, `${claim.classId} must have a readable count`)
        assert.equal(typeof claim.shortfall, 'number', `${claim.classId}: a readable claim owes a number`)
    }
    const failing = (result as any).gates.gateA.checks
        .filter((c: any) => c.clauses.some((l: any) => l.verdict === 'FAIL'))
        .map((c: any) => c.checkId)
        .sort()
    assert.deepEqual(failing, [], `no check may block A04; ${failing.join(', ') || 'none'} does`)
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
