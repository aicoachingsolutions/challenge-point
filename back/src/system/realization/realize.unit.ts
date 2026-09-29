/**
 * The realization layer — the smallest possible test.
 *
 * Acceptance is exactly the three conditions Christian set: **nothing derived is lost; nothing is
 * invented; nothing is closed without authority.** Most of what follows tests refusals, because the
 * realization layer's value is almost entirely in what it declines to do. A layer that produces a
 * complete-looking game by filling a gap is worse than one that refuses, and the difference is
 * invisible in the output — which is why it is tested here rather than read off a rendered game.
 *
 * Run: npm test
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { corpusInput } from '../derivation/corpus'
import { isStampedHalt } from '../derivation/emit'
import { runDerivation, runStages0to10 } from '../derivation/engine'
import { indexRegister } from '../derivation/register'
import { assembleResolvedGame, ResolvedGame } from '../derivation/resolved-game'
import { checkRealization, isRefused, realize, Realized } from './realize'

const DOCS = path.resolve(__dirname, '../../../../docs/audits/conformance')

/**
 * A resolved game that is eligible and minimal: one derived value, one open choice among stated
 * alternatives, nothing else. Every test below starts here and breaks exactly one thing.
 */
function eligible(overrides: Partial<ResolvedGame> = {}): ResolvedGame {
    return {
        provenance: { inputDigest: 'digest-1', engineVersion: 'e', registerVersion: 'r', derivationRulesVersion: 'd' },
        coherence: { gateA: 'PASS', failingChecks: [], mayRealize: true },
        game: { envelope: { players: 12 } },
        derived: [{ path: 'envelope.players', lineId: 'L-players', value: 12, resolvedBy: 'SESSION', support: [] }],
        open: [
            {
                path: 'objectives.scoring_method',
                lineId: 'L-scoring',
                elementId: null,
                permittedBy: { authority: 'GF2-11', choiceSpace: 'either scoring method' },
                permitted: ['LINE_DRIBBLE', 'TARGET_GOAL'],
                bounds: [],
                kind: 'FREE(choice)',
            },
        ],
        existential: [],
        notEstablished: [],
        counts: { derived: 1, open: 1, existential: 0, notEstablished: 0 },
        ...overrides,
    }
}

const chooseScoring = [{ lineId: 'L-scoring', value: 'TARGET_GOAL', because: 'the first permitted alternative' }]

const tests: [string, () => void][] = []
const test = (name: string, body: () => void) => tests.push([name, body])

// ---------------------------------------------------------------------------------------------
// The happy path, and the three acceptance conditions on it.
// ---------------------------------------------------------------------------------------------

test('a resolved game with one open line realizes into one concrete game', () => {
    const result = realize(eligible(), chooseScoring)
    if (isRefused(result)) return assert.fail(`refused: ${result.because.join('; ')}`)
    assert.equal((result.game as any).envelope.players, 12)
    assert.equal((result.game as any).objectives.scoring_method, 'TARGET_GOAL')
})

test('the record says what was chosen, where, and on whose authority', () => {
    const result = realize(eligible(), chooseScoring) as Realized
    assert.deepEqual(result.record.choices, [
        {
            lineId: 'L-scoring',
            value: 'TARGET_GOAL',
            because: 'the first permitted alternative',
            path: 'objectives.scoring_method',
            authority: 'GF2-11',
            boundCheck: 'WITHIN_PERMITTED_SET',
        },
    ])
    assert.equal(result.record.fromDigest, 'digest-1')
})

test('all three acceptance conditions hold on the realized game', () => {
    const resolved = eligible()
    const realized = realize(resolved, chooseScoring) as Realized
    assert.deepEqual(checkRealization(resolved, realized), {
        nothingClosedWithoutAuthority: [],
        nothingLost: [],
        nothingInvented: [],
    })
})

// ---------------------------------------------------------------------------------------------
// **Nothing closed without authority** — the condition that fails silently, so it is tested hardest.
// ---------------------------------------------------------------------------------------------

test('a line nobody established is not a freedom, and filling it is refused', () => {
    const resolved = eligible({
        notEstablished: [{ path: 'space.regions', lineId: 'L-regions', elementId: null, verdict: 'NOT_AUTHORED', reason: 'NO_ITEM_ON_ROW', declared: ['UNDECLARED'] }],
        open: [],
    })
    const result = realize(resolved, [{ lineId: 'L-regions', value: 3, because: 'a game needs regions' }])
    assert.ok(isRefused(result))
    assert.match(result.because[0], /not a freedom to close/)
    assert.match(result.because[0], /missing knowledge into a choice/)
})

test('the check catches a value on an unestablished path even when no choice claimed it', () => {
    // The realizer's own guards can be bypassed; the acceptance check reads the finished game, so it
    // catches a gap filled by any route — including a future bug in the writer above it.
    const resolved = eligible({
        notEstablished: [{ path: 'envelope.players', lineId: 'L-players2', elementId: null, verdict: 'NOT_AUTHORED', reason: null, declared: [] }],
    })
    const realized = realize(eligible(), chooseScoring) as Realized
    const problems = checkRealization(resolved, realized).nothingClosedWithoutAuthority
    assert.equal(problems.length, 1)
    assert.match(problems[0], /nobody established it and the concrete game holds 12/)
})

test('a line the resolved game never listed as open cannot be given a value', () => {
    const result = realize(eligible(), [...chooseScoring, { lineId: 'L-invented', value: 'x', because: 'seems right' }])
    assert.ok(isRefused(result))
    assert.ok(result.because.some(b => /does not list this line as open/.test(b)))
})

// ---------------------------------------------------------------------------------------------
// Bounds. A choice inside the authored space is the only kind of choice there is.
// ---------------------------------------------------------------------------------------------

test('a value outside the permitted alternatives is refused, and the alternatives are named', () => {
    const result = realize(eligible(), [{ lineId: 'L-scoring', value: 'PENALTY_SHOOTOUT', because: 'why not' }])
    assert.ok(isRefused(result))
    assert.match(result.because[0], /is not one of the permitted alternatives/)
    assert.match(result.because[0], /LINE_DRIBBLE/)
})

test('a count below the authored minimum is refused', () => {
    const resolved = eligible({
        open: [{ path: 'performers.count', lineId: 'L-count', elementId: null, permittedBy: null, permitted: null, bounds: [{ kind: 'COUNT', min: 6, max: 12 }], kind: 'FREE(b)' }],
    })
    const result = realize(resolved, [{ lineId: 'L-count', value: 4, because: 'small group' }])
    assert.ok(isRefused(result))
    assert.match(result.because[0], /below the authored minimum 6/)
})

test('a count inside the authored range is accepted and recorded as bounded', () => {
    const resolved = eligible({
        open: [{ path: 'performers.count', lineId: 'L-count', elementId: null, permittedBy: null, permitted: null, bounds: [{ kind: 'COUNT', min: 6, max: 12 }], kind: 'FREE(b)' }],
    })
    const result = realize(resolved, [{ lineId: 'L-count', value: 8, because: 'mid-range' }]) as Realized
    assert.equal(result.outcome, 'REALIZED')
    assert.equal(result.record.choices[0].boundCheck, 'WITHIN_COUNT')
})

test('a qualitative bound is recorded as unverified rather than silently treated as checked', () => {
    // SD-15: no number may be invented for "long kick", so there is nothing to compare the value
    // against. Saying so is the honest outcome; claiming the bound was satisfied would not be.
    const resolved = eligible({
        open: [{ path: 'objects.distance', lineId: 'L-dist', elementId: null, permittedBy: null, permitted: null, bounds: [{ kind: 'QUALITATIVE', term: 'a long kick' }], kind: 'FREE(b)' }],
    })
    const result = realize(resolved, [{ lineId: 'L-dist', value: 25, because: 'a coach judgement' }]) as Realized
    assert.equal(result.outcome, 'REALIZED')
    assert.deepEqual(result.record.unverified, ['L-dist'])
    assert.equal(result.record.choices[0].boundCheck, 'UNVERIFIABLE_QUALITATIVE_BOUND')
})

// ---------------------------------------------------------------------------------------------
// Refusals that keep a concrete game concrete.
// ---------------------------------------------------------------------------------------------

test('a game Gate A did not pass may not be realized at all', () => {
    const resolved = eligible({ coherence: { gateA: 'FAIL', failingChecks: ['GA-NO-FAILED-LINE'], mayRealize: false } })
    const result = realize(resolved, chooseScoring)
    assert.ok(isRefused(result))
    assert.match(result.because[0], /may not be realized: Gate A is FAIL \(GA-NO-FAILED-LINE\)/)
})

test('an open line left unchosen is refused — a concrete game has no remaining freedom', () => {
    const result = realize(eligible(), [])
    assert.ok(isRefused(result))
    assert.match(result.because[0], /is open and was not chosen/)
})

test('every reason is reported, not just the first', () => {
    const resolved = eligible({
        coherence: { gateA: 'FAIL', failingChecks: [], mayRealize: false },
        open: [...eligible().open, { path: 'space.shape', lineId: 'L-shape', elementId: null, permittedBy: null, permitted: null, bounds: [], kind: 'FREE(a)' }],
    })
    const result = realize(resolved, [])
    assert.ok(isRefused(result))
    assert.equal(result.because.length, 3) // Gate A, and each of the two unchosen lines.
})

test('one line cannot be chosen twice', () => {
    const result = realize(eligible(), [...chooseScoring, { lineId: 'L-scoring', value: 'LINE_DRIBBLE', because: 'second thoughts' }])
    assert.ok(isRefused(result))
    assert.match(result.because[0], /chosen twice/)
})

// ---------------------------------------------------------------------------------------------
// Existential claims (SD-97) — asserted to exist, described by nobody.
// ---------------------------------------------------------------------------------------------

test('an unsatisfied existential claim refuses the realization', () => {
    const resolved = eligible({
        existential: [{ path: 'performers.teams', classId: 'K-teams', from: { contractId: 'C', itemId: 'I' }, cardinality: { min: 2, max: 2 } }],
    })
    const result = realize(resolved, chooseScoring)
    assert.ok(isRefused(result))
    assert.match(result.because[0], /asserted to exist and nothing was instantiated/)
})

test('an instantiation satisfies the claim and is recorded as instantiated, not derived', () => {
    const resolved = eligible({
        existential: [{ path: 'performers.teams', classId: 'K-teams', from: { contractId: 'C', itemId: 'I' }, cardinality: { min: 2, max: 2 } }],
    })
    const result = realize(resolved, chooseScoring, [{ classId: 'K-teams', member: { designation: 'ATTACKING_TEAM' }, because: 'the claim needs a member' }]) as Realized
    assert.equal(result.outcome, 'REALIZED')
    assert.deepEqual((result.game as any).performers.teams, [{ designation: 'ATTACKING_TEAM', satisfies: 'K-teams' }])
    assert.equal(result.record.instantiations.length, 1)
    // The instantiated member is authorized by the claim and recorded, so it is not an invention —
    // but it is also not derived, and the record is the only place that distinction survives.
    assert.deepEqual(checkRealization(resolved, result).nothingInvented, [])
})

test('instantiating where no claim exists is refused', () => {
    const result = realize(eligible(), chooseScoring, [{ classId: 'K-nothing', member: {}, because: 'a game needs one' }])
    assert.ok(isRefused(result))
    assert.match(result.because[0], /no existential claim authorizes instantiating/)
})

// ---------------------------------------------------------------------------------------------
// **Nothing lost** and **nothing invented**, caught on a game that was tampered with after the fact.
// ---------------------------------------------------------------------------------------------

test('a derived value altered after realization is caught as lost', () => {
    const resolved = eligible()
    const realized = realize(resolved, chooseScoring) as Realized
    ;(realized.game as any).envelope.players = 10
    const problems = checkRealization(resolved, realized).nothingLost
    assert.equal(problems.length, 1)
    assert.match(problems[0], /derived 12, concrete 10/)
})

test('a value added after realization is caught as invented', () => {
    const resolved = eligible()
    const realized = realize(resolved, chooseScoring) as Realized
    ;(realized.game as any).space = { shape: 'RECTANGLE' }
    const problems = checkRealization(resolved, realized).nothingInvented
    assert.equal(problems.length, 1)
    assert.match(problems[0], /space\.shape.*traces to nothing derived, chosen or instantiated/)
})

test('element paths are matched by element id, not by position', () => {
    const resolved = eligible({
        game: { space: { regions: [{ elementId: 'r2', noun: 'channel' }, { elementId: 'r1', noun: 'zone' }] } },
        derived: [
            { path: 'space.regions[r1].noun', lineId: 'L-r1', value: 'zone', resolvedBy: 'CONTRACT', support: [] },
            { path: 'space.regions[r2].noun', lineId: 'L-r2', value: 'channel', resolvedBy: 'CONTRACT', support: [] },
        ],
        open: [{ path: 'space.regions[r1].position.along', lineId: 'L-r1-pos', elementId: 'r1', permittedBy: null, permitted: null, bounds: [], kind: 'FREE(a)' }],
    })
    const result = realize(resolved, [{ lineId: 'L-r1-pos', value: 'LENGTH', because: 'the only axis left' }]) as Realized
    assert.equal(result.outcome, 'REALIZED')
    const r1 = (result.game as any).space.regions.find((r: any) => r.elementId === 'r1')
    assert.equal(r1.position.along, 'LENGTH')
    assert.deepEqual(checkRealization(resolved, result), { nothingClosedWithoutAuthority: [], nothingLost: [], nothingInvented: [] })
})

// ---------------------------------------------------------------------------------------------
// Against the live corpus. The refusal here is the current honest state of the system.
// ---------------------------------------------------------------------------------------------

test('the live corpus resolved game is refused, and the refusal names Gate A', () => {
    const derivationInput = corpusInput()
    const result = runDerivation(derivationInput)
    if (isStampedHalt(result)) return assert.fail('unexpected halt')
    const resolved = assembleResolvedGame(result, (runStages0to10(derivationInput) as any).classes, indexRegister(derivationInput.register))
    assert.equal(resolved.coherence.mayRealize, false)
    const realized = realize(resolved, [])
    assert.ok(isRefused(realized))
    assert.match(realized.because[0], /may not be realized: Gate A is FAIL/)
})

test('the docs directory the corpus reads from is the one under audit', () => {
    assert.ok(fs.existsSync(path.join(DOCS, 'register-2026-09-18.json')))
})

// ---------------------------------------------------------------------------------------------

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
    console.error(`realization: ${failed} of ${tests.length} failed`)
    process.exit(1)
}
console.log(`realization: ${tests.length} passed`)
