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
import { derivationInputFor, selectFor } from '../derivation/run-bounded-selection'
import { checkRealization, Choice, isRefused, realize, Realized } from './realize'

const DOCS = path.resolve(__dirname, '../../../../docs/audits/conformance')

/**
 * A resolved game that is eligible and minimal: one derived value, one open choice among stated
 * alternatives, nothing else. Every test below starts here and breaks exactly one thing.
 */
function eligible(overrides: Partial<ResolvedGame> = {}): ResolvedGame {
    return {
        provenance: { inputDigest: 'digest-1', engineVersion: 'e', registerVersion: 'r', derivationRulesVersion: 'd' },
        coherence: {
            gateA: 'PASS',
            failingChecks: [],
            preRealization: 'PRE_REALIZATION_SATISFIED',
            realizationAuthorized: true,
            notAuthorizedBecause: [],
            postRealizationRequired: [],
            mayRealize: true,
            deferred: [],
        },
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
        extentBounds: {},
        jointConditions: [],
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

test('a preferred default is offered, never enforced as a ceiling', () => {
    // The neutral count: one item states a REQUIRED floor of 1 with no authored maximum, another a
    // PREFERRED_DEFAULT of 1-2. Enforcing both would intersect them and turn the preference into a
    // hard limit the knowledge never states — the same shape as a schema default quietly overriding
    // an engine default. 4 is outside the preference and inside the requirement, so it is accepted.
    const resolved = eligible({
        open: [
            {
                path: 'performers.neutrals.count',
                lineId: 'L-neutrals',
                elementId: null,
                permittedBy: null,
                permitted: null,
                bounds: [
                    { kind: 'COUNT', min: 1, max: null, term: '>= 1 (no authored maximum)' },
                    { kind: 'COUNT', min: 1, max: 2, term: '1-2 (one or two)', preferred: true },
                ],
                kind: 'FREE(a)',
            },
        ],
    })
    const result = realize(resolved, [{ lineId: 'L-neutrals', value: 4, because: 'above the preference, inside the requirement' }]) as Realized
    assert.equal(result.outcome, 'REALIZED')
    assert.equal((result.game as any).performers.neutrals.count, 4)

    // The required floor still bites.
    assert.ok(isRefused(realize(resolved, [{ lineId: 'L-neutrals', value: 0, because: 'below the required floor' }])))
})

// ---------------------------------------------------------------------------------------------
// DISTINCT_ON — the case the whole condition exists for.
// ---------------------------------------------------------------------------------------------

/** Two candidate objects, each placeable anywhere inside the same authored bound. */
function twoCandidates(): ResolvedGame {
    return eligible({
        game: { objects: [{ elementId: 'cand-a', kind: 'goal' }, { elementId: 'cand-b', kind: 'goal' }] },
        derived: [
            { path: 'objects[cand-a].kind', lineId: 'L-a-kind', value: 'goal', resolvedBy: 'CONTRACT', support: [] },
            { path: 'objects[cand-b].kind', lineId: 'L-b-kind', value: 'goal', resolvedBy: 'CONTRACT', support: [] },
        ],
        open: [
            { path: 'objects[cand-a].position.along', lineId: 'c:X:a::O4', elementId: 'cand-a', permittedBy: null, permitted: null, bounds: [{ kind: 'COUNT', min: 0, max: 40 }], kind: 'FREE(a)' },
            { path: 'objects[cand-a].position.across', lineId: 'c:X:a::O5', elementId: 'cand-a', permittedBy: null, permitted: null, bounds: [{ kind: 'COUNT', min: 0, max: 30 }], kind: 'FREE(a)' },
            { path: 'objects[cand-b].position.along', lineId: 'c:X:b::O4', elementId: 'cand-b', permittedBy: null, permitted: null, bounds: [{ kind: 'COUNT', min: 0, max: 40 }], kind: 'FREE(a)' },
            { path: 'objects[cand-b].position.across', lineId: 'c:X:b::O5', elementId: 'cand-b', permittedBy: null, permitted: null, bounds: [{ kind: 'COUNT', min: 0, max: 30 }], kind: 'FREE(a)' },
        ],
        jointConditions: [
            {
                kind: 'DISTINCT_ON',
                path: 'objects[]',
                rows: ['O4', 'O5'],
                asAuthored: "each candidate's (along, across) position differs from every other candidate's in the same set; no separation distance",
                from: { contractId: 'restated:VARIABLE-TARGET-CONDITION', itemId: 'VARTARGET-03.a' },
            },
        ],
    })
}

const place = (a: [number, number], b: [number, number]): Choice[] => [
    { lineId: 'c:X:a::O4', value: a[0], because: 'inside its bound' },
    { lineId: 'c:X:a::O5', value: a[1], because: 'inside its bound' },
    { lineId: 'c:X:b::O4', value: b[0], because: 'inside its bound' },
    { lineId: 'c:X:b::O5', value: b[1], because: 'inside its bound' },
]

test('DISTINCT_ON: every individual bound is satisfied and the SET is still refused', () => {
    // This is the whole point of the condition, and the thing a per-element bound could never say.
    // Both candidates sit at (10, 15): inside 0-40 along and 0-30 across, every individual bound
    // honoured, and the set invalid because they are in the same place.
    const resolved = twoCandidates()
    const result = realize(resolved, place([10, 15], [10, 15]))
    assert.ok(isRefused(result), 'independently valid placements can be jointly invalid')
    assert.equal(result.because.length, 1)
    assert.match(result.because[0], /VARTARGET-03\.a/)
    assert.match(result.because[0], /cand-a and cand-b occupy the same O4\/O5/)
    assert.match(result.because[0], /Each placement is inside its own bound; the set is not/)
})

test('DISTINCT_ON: distinct placements pass, and differing on one row is enough', () => {
    assert.equal(realize(twoCandidates(), place([10, 15], [20, 25])).outcome, 'REALIZED')
    // Pairwise distinctness over the tuple, not over each row separately: sharing `along` is fine
    // so long as the pair differs somewhere. No minimum separation is implied or required.
    assert.equal(realize(twoCandidates(), place([10, 15], [10, 16])).outcome, 'REALIZED')
})

test('DISTINCT_ON: the joint check runs only after every individual bound has passed', () => {
    // A value outside its own bound is refused for THAT reason, and the joint condition is not
    // reported on top of it — a realizer should fix the bound violation first.
    const result = realize(twoCandidates(), place([10, 15], [99, 15]))
    assert.ok(isRefused(result))
    assert.equal(result.because.length, 1)
    assert.match(result.because[0], /above the authored maximum 40/)
})

// ---------------------------------------------------------------------------------------------
// Refusals that keep a concrete game concrete.
// ---------------------------------------------------------------------------------------------

test('a game Gate A did not pass may not be realized at all', () => {
    const resolved = eligible({
        coherence: {
            gateA: 'FAIL',
            failingChecks: ['GA-NO-FAILED-LINE'],
            preRealization: 'FAIL',
            realizationAuthorized: false,
            notAuthorizedBecause: ['a pre-realization Gate A invariant fails'],
            postRealizationRequired: [],
            mayRealize: false,
            deferred: [],
        },
    })
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
        coherence: {
            gateA: 'FAIL',
            failingChecks: [],
            preRealization: 'FAIL',
            realizationAuthorized: false,
            notAuthorizedBecause: ['a pre-realization Gate A invariant fails'],
            postRealizationRequired: [],
            mayRealize: false,
            deferred: [],
        },
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
        existential: [{ path: 'performers.teams', classId: 'K-teams', from: { contractId: 'C', itemId: 'I' }, cardinality: { min: 2, max: 2 }, satisfiedBy: [], shortfall: 2 }],
    })
    const result = realize(resolved, chooseScoring)
    assert.ok(isRefused(result))
    assert.match(result.because[0], /asserted to exist and nothing was instantiated/)
})

test('an instantiation satisfies the claim and is recorded as instantiated, not derived', () => {
    const resolved = eligible({
        existential: [{ path: 'performers.teams', classId: 'K-teams', from: { contractId: 'C', itemId: 'I' }, cardinality: { min: 1, max: null }, satisfiedBy: [], shortfall: 1 }],
    })
    const result = realize(resolved, chooseScoring, [{ classId: 'K-teams', member: { designation: 'ATTACKING_TEAM' }, because: 'the claim needs a member' }]) as Realized
    assert.equal(result.outcome, 'REALIZED')
    assert.deepEqual((result.game as any).performers.teams, [{ designation: 'ATTACKING_TEAM', satisfies: 'K-teams' }])
    assert.equal(result.record.instantiations.length, 1)
    // The instantiated member is authorized by the claim and recorded, so it is not an invention —
    // but it is also not derived, and the record is the only place that distinction survives.
    assert.deepEqual(checkRealization(resolved, result).nothingInvented, [])
})

test('a claim already satisfied by an established member authorizes no instantiation', () => {
    // His ruling of 30 September. On A04 this was the difference between a game with two objectives and
    // a game with one: GF2-09.a asserts at least one objective exists, GF2-08.a IS an established
    // objective on that collection, so the claim was met and the second objective carried nothing.
    const resolved = eligible({
        existential: [
            {
                path: 'objectives',
                classId: 'K-objectives',
                from: { contractId: 'C', itemId: 'I' },
                cardinality: { min: 1, max: null },
                satisfiedBy: ['established-objective'],
                shortfall: 0,
            },
        ],
    })
    // Satisfied, so nothing is owed and no instantiation is required.
    assert.equal(realize(resolved, chooseScoring).outcome, 'REALIZED')

    // And instantiating anyway is refused, naming what already satisfied it.
    const extra = realize(resolved, chooseScoring, [{ classId: 'K-objectives', member: {}, because: 'one more' }])
    assert.ok(isRefused(extra))
    assert.match(extra.because[0], /already satisfied by established-objective/)
})

test('only the SHORTFALL is owed, not the whole claim again', () => {
    // Two teams asserted, one already established: one instantiation, not two.
    const resolved = eligible({
        existential: [
            {
                path: 'performers.teams',
                classId: 'K-teams',
                from: { contractId: 'C', itemId: 'I' },
                cardinality: { min: 2, max: null },
                satisfiedBy: ['established-team'],
                shortfall: 1,
            },
        ],
    })
    assert.equal(realize(resolved, chooseScoring, [{ classId: 'K-teams', member: { designation: 'B' }, because: 'the shortfall' }]).outcome, 'REALIZED')
    assert.ok(isRefused(realize(resolved, chooseScoring)), 'and the shortfall is still owed if nothing is supplied')
})

test("a claim's cardinality is part of the claim", () => {
    // "Two teams exist" is not satisfied by one team. A layer that accepted one would have quietly
    // dropped an authored fact while reporting success, which is the failure mode this whole
    // discipline exists to prevent.
    const resolved = eligible({
        existential: [{ path: 'performers.teams', classId: 'K-teams', from: { contractId: 'C', itemId: 'I' }, cardinality: { min: 2, max: 2 }, satisfiedBy: [], shortfall: 2 }],
    })
    const one = realize(resolved, chooseScoring, [{ classId: 'K-teams', member: { designation: 'ATTACKING_TEAM' }, because: 'only one' }])
    assert.ok(isRefused(one))
    assert.match(one.because[0], /still owes 2 member\(s\), and 1 was instantiated/)

    const three = realize(resolved, chooseScoring, [
        { classId: 'K-teams', member: { designation: 'A' }, because: '' },
        { classId: 'K-teams', member: { designation: 'B' }, because: '' },
        { classId: 'K-teams', member: { designation: 'C' }, because: '' },
    ])
    assert.ok(isRefused(three))
    assert.match(three.because[0], /asserts at most 2, and 3 would exist/)

    const two = realize(resolved, chooseScoring, [
        { classId: 'K-teams', member: { designation: 'ATTACKING_TEAM' }, because: 'first' },
        { classId: 'K-teams', member: { designation: 'DEFENDING_TEAM' }, because: 'second' },
    ]) as Realized
    assert.equal(two.outcome, 'REALIZED')
    assert.equal((two.game as any).performers.teams.length, 2)
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

test('A04 is authorized for realization, and the three states stay distinct', () => {
    // His ruling of 30 September split Gate A by evaluability, so the four invariants whose subject
    // realization supplies are evaluated after it. The state is deliberately NOT reported as `PASS`:
    // "this keeps 'may realize' distinct from 'game is validated'."
    const resolved = a04()
    assert.equal(resolved.coherence.preRealization, 'PRE_REALIZATION_SATISFIED')
    assert.notEqual(resolved.coherence.preRealization, 'PASS', 'the pre-realization state must not read as full Gate A passing')
    assert.equal(resolved.coherence.realizationAuthorized, true)
    assert.deepEqual(resolved.coherence.notAuthorizedBecause, [])

    // And what a concrete game still owes is carried, naming what realization must supply for each.
    assert.ok(resolved.coherence.postRealizationRequired.length > 0)
    assert.deepEqual(
        [...new Set(resolved.coherence.postRealizationRequired.map(d => d.checkId))].sort(),
        ['GA-ENVELOPE-FIT', 'GA-LAYOUT-FEASIBLE', 'GA-ONE-PRIMARY-EVENT', 'GA-ROSTER-SUM'],
        'exactly the four he ruled post-realization',
    )
    for (const owed of resolved.coherence.postRealizationRequired) assert.ok(owed.owes.length > 0, `${owed.checkId} owes nothing stated`)
})

test('A05 is NOT authorized, and says which pre-realization invariant is unsatisfied', () => {
    // The counterpart, so the authorization is shown to discriminate rather than to wave things
    // through: A05's GA-INFORMATION and GA-REFERENCE-INTEGRITY are pre-realization and unevaluable, so
    // realization does not proceed.
    const input = derivationInputFor(selectFor('A05', null))
    const result = runDerivation(input)
    if (isStampedHalt(result)) return assert.fail('unexpected halt')
    const resolved = assembleResolvedGame(result, (runStages0to10(input) as any).classes, indexRegister(input.register), input.contracts)

    assert.equal(resolved.coherence.realizationAuthorized, false)
    assert.equal(resolved.coherence.notAuthorizedBecause.length, 1)
    assert.match(resolved.coherence.notAuthorizedBecause[0], /cannot be evaluated/)
})

/** A04's resolved game, assembled from the live selection. */
function a04(): ResolvedGame {
    const input = derivationInputFor(selectFor('A04', null))
    const result = runDerivation(input)
    if (isStampedHalt(result)) throw new Error('unexpected halt')
    return assembleResolvedGame(result, (runStages0to10(input) as any).classes, indexRegister(input.register), input.contracts)
}

test('THE ACCEPTANCE TEST: A04 realizes, and all three conditions hold on the concrete game', () => {
    // The first game through the pathway, on real selected knowledge and through the gate rather than
    // around it. The three conditions are his and unchanged: nothing lost, nothing invented, nothing
    // closed without authority.
    const resolved = a04()
    assert.equal(resolved.coherence.realizationAuthorized, true, 'through the gate, not around it')

    const supplied = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../../../docs/audits/a04-realization-choices.json'), 'utf8'))
    const realized = realize(resolved, supplied.choices, supplied.instantiations)
    if (isRefused(realized)) return assert.fail(`refused: ${realized.because.join('; ')}`)
    const resolvedForChecks = resolved

    assert.deepEqual(checkRealization(resolvedForChecks, realized), {
        nothingClosedWithoutAuthority: [],
        nothingLost: [],
        nothingInvented: [],
    })

    // One collection per collection: the instantiated teams are IN `performers.teams`, not beside it.
    const teams = (realized.game as any).performers.teams
    assert.equal(teams.length, 2, "the claim asserts two teams and the concrete game has two, in the game's own collection")
    assert.ok(teams.every((t: any) => t.satisfies === 'c:restated:GF2:GF2-14.a'), 'each records the claim it satisfies')

    // Every choice is recorded with what bounded it, so none can later read as derived knowledge.
    assert.equal(realized.record.choices.length, supplied.choices.length)
    assert.ok(realized.record.choices.every(c => c.boundCheck === 'WITHIN_PERMITTED_SET'), 'each value came from inside an authored set')
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
