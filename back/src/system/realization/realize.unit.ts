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

import { corpusInput, loadRegister } from '../derivation/corpus'
import { isStampedHalt } from '../derivation/emit'
import { runDerivation, runStages0to10 } from '../derivation/engine'
import { indexRegister } from '../derivation/register'
import { assembleResolvedGame, ResolvedGame } from '../derivation/resolved-game'
import { derivationInputFor, selectFor } from '../derivation/run-bounded-selection'
import { sessionPlanningModel } from '../session-planning/session-planning-model'
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
        collectionCardinality: [],
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

/**
 * **Nothing in this file is suspended as of 6 October.** A `suspended()` reporter stood here from 5 October,
 * holding the acceptance test open while A04 had no authorized subject. The Sport Profile restored the subject,
 * so the reporter has no job and is removed rather than left as scaffolding — a suspension mechanism sitting
 * unused in a test file is an invitation to suspend the next inconvenient failure instead of reading it.
 */

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

test('a choice must satisfy the canonical register as well as the authored narrowing', () => {
    // His ruling of 1 October, and the case that exposed it: GF2-03.b narrowed the noun to
    // [zone, line] while `line` was not in S3.noun, and realization wrote an unregistered value into
    // the concrete game with every check reporting success. A permitted set cannot extend a closed
    // vocabulary, so the two disagreeing is the thing to report.
    const resolved = eligible({
        game: { envelope: { players: 12 }, space: { regions: [{ elementId: 'r1' }] } },
        open: [
            {
                path: 'space.regions[r1].noun',
                lineId: 'c:X:r1::S3',
                elementId: 'r1',
                permittedBy: null,
                permitted: ['zone', 'invented-noun'],
                bounds: [],
                kind: 'FREE(choice)',
            },
        ],
    })
    const registerIndex = indexRegister(loadRegister())
    const refused = realize(resolved, [{ lineId: 'c:X:r1::S3', value: 'invented-noun', because: 'the permitted set offers it' }], [], registerIndex)
    assert.ok(isRefused(refused))
    assert.match(refused.because[0], /not a member of the canonical vocabulary S3\.noun/)
    assert.match(refused.because[0], /a permitted set cannot extend a closed vocabulary/)

    // A member of BOTH is accepted, and `line` is now in both since the owner-authorized extension.
    assert.equal(realize(resolved, [{ lineId: 'c:X:r1::S3', value: 'zone', because: 'in both' }], [], registerIndex).outcome, 'REALIZED')
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
                // WHOLE_GAME and authoritative so this fixture exercises the comparison itself. The corpus's
                // real condition is neither, and `distinct-on-wiring.unit.ts` builds it from the register
                // rather than by hand — which is what this fixture could not do, and why it passed while the
                // real condition evaluated no tuples at all.
                scope: 'WHOLE_GAME',
                notEvaluable: null,
                authoritative: true,
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
        existential: [{ path: 'performers.teams', classId: 'K-teams', from: { contractId: 'C', itemId: 'I' }, cardinality: { min: 2, max: 2 }, satisfiedBy: [], cardinalityUnreadable: false, shortfall: 2 }],
    })
    const result = realize(resolved, chooseScoring)
    assert.ok(isRefused(result))
    assert.match(result.because[0], /asserted to exist and nothing was instantiated/)
})

test('an instantiation satisfies the claim and is recorded as instantiated, not derived', () => {
    const resolved = eligible({
        existential: [{ path: 'performers.teams', classId: 'K-teams', from: { contractId: 'C', itemId: 'I' }, cardinality: { min: 1, max: null }, satisfiedBy: [], cardinalityUnreadable: false, shortfall: 1 }],
    })
    const result = realize(resolved, chooseScoring, [{ classId: 'K-teams', member: {}, because: 'the claim needs a member' }]) as Realized
    assert.equal(result.outcome, 'REALIZED')
    // The member carries its opaque handle as `elementId` — the same field a derived element is addressed by —
    // beside `satisfies`, which says which claim authorized it. Identity and authorization are both recorded
    // and are different questions.
    assert.deepEqual((result.game as any).performers.teams, [{ satisfies: 'K-teams', elementId: 'K-teams#1' }])
    assert.equal(result.record.instantiations.length, 1)
    assert.equal(result.record.instantiations[0].handle, 'K-teams#1', 'the record carries the handle it minted')
    // The member is authorized by the claim and recorded, so it is not an invention — but it is also not
    // derived, and the record is the only place that distinction survives.
    assert.deepEqual(checkRealization(resolved, result).nothingInvented, [])
})

/**
 * **Authority to instantiate an element does not entail authority to populate its properties.** His ruling of
 * 2 October, asserted here because this test previously encoded the opposite.
 *
 * It used to instantiate `member: { designation: 'ATTACKING_TEAM' }` and assert that nothing was invented, on
 * the reasoning that the claim authorized the member. That reasoning is what let an unregistered `designation`
 * carrying a token canonical knowledge defines as "the team currently in possession" into A04's concrete game
 * with the positional reason "first of the two".
 */
test('a property the instantiation simply asserts is an invention, however well-formed the member is', () => {
    const resolved = eligible({
        existential: [{ path: 'performers.teams', classId: 'K-teams', from: { contractId: 'C', itemId: 'I' }, cardinality: { min: 1, max: null }, satisfiedBy: [], cardinalityUnreadable: false, shortfall: 1 }],
    })
    const result = realize(resolved, chooseScoring, [
        { classId: 'K-teams', member: { designation: 'ATTACKING_TEAM' }, because: 'the claim needs a member' },
    ]) as Realized
    assert.equal(result.outcome, 'REALIZED', 'the instantiation itself is still authorized by the claim')

    const problems = checkRealization(resolved, result).nothingInvented
    assert.equal(problems.length, 1, `the unsupported property must be reported; got ${JSON.stringify(problems)}`)
    assert.ok(problems[0].includes('designation'), problems[0])
    assert.ok(problems[0].includes('no support of its own'), problems[0])
    assert.ok(problems[0].includes('the claim establishes the element, not its properties'), problems[0])
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
                cardinalityUnreadable: false,
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
                cardinalityUnreadable: false,
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
        existential: [{ path: 'performers.teams', classId: 'K-teams', from: { contractId: 'C', itemId: 'I' }, cardinality: { min: 2, max: 2 }, satisfiedBy: [], cardinalityUnreadable: false, shortfall: 2 }],
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

/**
 * **A04 IS AUTHORIZED AGAIN, and the three coherence states remain distinct.**
 *
 * From 5 October to 6 October this test asserted the opposite. His reachability ruling withheld authorization
 * from A04 — possession is a relationship involving the ball, and A04's game established no ball — and he
 * directed that the failure stay visible rather than be patched away. It was not patched away: the Soccer Sport
 * Profile supplies the ball and bounds the possession relationship from authorized knowledge, so A04 passes the
 * invariant instead of being excused from it.
 *
 * The contrast this test exists to protect is between three different things, and all three now have a live
 * example, which they did not while everything failed at once:
 *
 *   - **A04** — `PRE_REALIZATION_SATISFIED`: every pre-realization invariant holds, the rest is deferred.
 *   - **D03** — `FAIL`: an invariant is contradicted, and the reason names it.
 *   - **D01** — `NOT_EVALUABLE`: an invariant cannot be judged at all. A gap, not a contradiction (SD-28).
 *
 * What his 30 September split guarantees is unchanged and still asserted: the pre-realization state never reads
 * as a full `PASS`, and what a concrete game owes is carried whichever of the three states it is in.
 */
test('A04 is authorized again, the reason is stated, and the three states stay distinct', () => {
    const resolved = a04()
    assert.equal(resolved.coherence.preRealization, 'PRE_REALIZATION_SATISFIED')
    assert.notEqual(resolved.coherence.preRealization, 'PASS', 'satisfied pre-realization is not full Gate A passing')
    assert.equal(resolved.coherence.realizationAuthorized, true)
    assert.deepEqual(resolved.coherence.notAuthorizedBecause, [], 'nothing is withheld, so nothing is owed a reason')
    assert.equal(resolved.coherence.gateA, 'DEFERRED_TO_REALIZATION', 'the remaining checks are deferred, not passed')

    // A contradicted invariant. D03 selects the blind GF4 restatement, whose POSSESSION_CHANGE transition is
    // keyed on a trigger the game cannot construct — so reachability fails on the FIRST clause, and the
    // failure is named rather than merely reported as a refusal.
    const d03Input = derivationInputFor(selectFor('D03', null))
    const d03Result = runDerivation(d03Input)
    if (isStampedHalt(d03Result)) return assert.fail('unexpected halt')
    const d03 = assembleResolvedGame(d03Result, (runStages0to10(d03Input) as any).classes, indexRegister(d03Input.register), d03Input.contracts)
    assert.equal(d03.coherence.preRealization, 'FAIL')
    assert.equal(d03.coherence.realizationAuthorized, false)
    assert.match(d03.coherence.notAuthorizedBecause[0], /fails:.*GA-TRIGGER-REACHABLE/, 'it must name the invariant, not merely refuse')

    // An unevaluable one. D01 has no transition at all, so it cannot fail on reachability; it is blocked
    // earlier by invariants there is nothing to judge.
    const d01Input = derivationInputFor(selectFor('D01', null))
    const d01Result = runDerivation(d01Input)
    if (isStampedHalt(d01Result)) return assert.fail('unexpected halt')
    const d01 = assembleResolvedGame(d01Result, (runStages0to10(d01Input) as any).classes, indexRegister(d01Input.register), d01Input.contracts)
    assert.equal(d01.coherence.preRealization, 'NOT_EVALUABLE')
    assert.match(d01.coherence.notAuthorizedBecause[0], /cannot be evaluated/)

    assert.equal(
        new Set([resolved.coherence.preRealization, d03.coherence.preRealization, d01.coherence.preRealization]).size,
        3,
        'satisfied, failed and unevaluable are three states, not two with a shared spelling',
    )

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
    // Still refused, and still for a stated reason — but the reason has moved twice. GA-INFORMATION and
    // GA-REFERENCE-INTEGRITY being unevaluable was what stopped A05 originally; on 5 October the reachability
    // ruling made it fail earlier and harder; and on 6 October the Sport Profile satisfied reachability, so the
    // original two are once again what it is waiting on. The point of the test never moved: authorization
    // discriminates, and it says which invariant and in which of the two ways.
    const input = derivationInputFor(selectFor('A05', null))
    const result = runDerivation(input)
    if (isStampedHalt(result)) return assert.fail('unexpected halt')
    const resolved = assembleResolvedGame(result, (runStages0to10(input) as any).classes, indexRegister(input.register), input.contracts)

    assert.equal(resolved.coherence.realizationAuthorized, false)
    assert.equal(resolved.coherence.notAuthorizedBecause.length, 1)
    assert.match(resolved.coherence.notAuthorizedBecause[0], /GA-INFORMATION, GA-REFERENCE-INTEGRITY/, 'it must name the invariants, not merely refuse')
    assert.match(resolved.coherence.notAuthorizedBecause[0], /cannot be evaluated/, 'an unevaluable, not a failure')
    assert.ok(
        !/GA-TRIGGER-REACHABLE/.test(resolved.coherence.notAuthorizedBecause[0]),
        'and reachability is no longer among them — A05 gets the ball from the Sport Profile like every other goal',
    )
})

/** A04's resolved game, assembled from the live selection. */
function a04(): ResolvedGame {
    const input = derivationInputFor(selectFor('A04', null))
    const result = runDerivation(input)
    if (isStampedHalt(result)) throw new Error('unexpected halt')
    return assembleResolvedGame(result, (runStages0to10(input) as any).classes, indexRegister(input.register), input.contracts)
}

/**
 * **An authored collection cardinality refuses an over-populated game.** Synthetic, deliberately.
 *
 * A04 WAS this test until ruling C33 of 2 October: its knowledge authored exactly two channels and three
 * contributions each minted their own region. The restatement fixed the knowledge, so the live corpus no
 * longer exhibits it — which is why the case is kept here by construction. The capability must stay under
 * test after the defect that motivated it is gone.
 */
test('a collection holding more elements than its knowledge authors is refused', () => {
    const resolved = a04()
    const regions = (resolved.game as any).space.regions as { elementId: string }[]
    const over = {
        ...resolved,
        collectionCardinality: [
            {
                path: 'space.regions[]',
                row: 'S2',
                classId: 'synthetic:exactly-one',
                from: { contractId: 'X', itemId: 'I' },
                min: 1,
                max: 1,
                scope: 'WHOLE_GAME' as const,
                established: regions.length,
            },
        ],
    }
    const refused = realize(over as typeof resolved, [], [])
    assert.equal(isRefused(refused), true, 'an over-produced collection is refused, not silently realized')
    assert.ok(
        (refused as any).because.some((r: string) => r.includes('at most 1') && r.includes(`establishes ${regions.length}`)),
        `the refusal must name the authored bound and the real count; got ${JSON.stringify((refused as any).because)}`,
    )
})

/**
 * **`realize()` enforces Gate A itself, and the subject of that test had to change.**
 *
 * It used to run on A04, which the 5 October reachability ruling had made unauthorized. The Sport Profile of
 * 6 October gives A04 the ball and the possession relationship it was missing, so A04 is authorized again and
 * is no longer a specimen of refusal. The capability is unchanged and still worth pinning, so it is pinned on
 * a goal that genuinely fails: D03 selects the blind GF4 restatement, whose POSSESSION_CHANGE transition is
 * keyed on a trigger the game cannot construct.
 *
 * `realize()` checks `mayRealize` rather than the authorization field, so the refusal is real rather than
 * advisory — which is the whole point of asserting it here instead of reading the report.
 */
test('realization REFUSES a game whose Gate A fails, and names the check that refused it', () => {
    const input = derivationInputFor(selectFor('D03', null))
    const result = runDerivation(input)
    if (isStampedHalt(result)) return assert.fail('unexpected halt')
    const resolved = assembleResolvedGame(result, (runStages0to10(input) as any).classes, indexRegister(input.register), input.contracts)
    assert.equal(resolved.coherence.realizationAuthorized, false, 'D03 must still be an unauthorized game for this test to have a subject')

    const attempted = realize(resolved, [], [])
    assert.ok(isRefused(attempted), 'an unauthorized game must not realize')
    assert.ok(
        (attempted as any).because.some((b: string) => /GA-TRIGGER-REACHABLE/.test(b)),
        `the refusal must name the check: ${JSON.stringify((attempted as any).because)}`,
    )
})

/**
 * **What authorization measures today, stated rather than assumed.**
 *
 * The old form of this test asserted that NO goal is authorized, which was true from 5 October until the Sport
 * Profile landed. Exactly one is authorized now, and saying "A04 works" without saying what the other twelve do
 * would be the kind of selective report that made the previous state look healthier than it was.
 *
 * Eleven are `NOT_EVALUABLE`, which is not a reachability problem: their selections resolve to knowledge objects
 * with no restated contract, so there is no game to judge. Two — D03 and TD02 — reach a verdict and FAIL. So the
 * pilot path is one goal wide, and this test is where that stops being a claim in a report.
 */
test('exactly one goal is realization-authorized, and the other twelve are accounted for', () => {
    const authorized: string[] = []
    const failed: string[] = []
    const notEvaluable: string[] = []
    for (const goal of (sessionPlanningModel.learningGoals() as any[]).map(g => String(g.ID))) {
        const input = derivationInputFor(selectFor(goal, null))
        const result = runDerivation(input)
        if (isStampedHalt(result)) return assert.fail(`unexpected halt on ${goal}`)
        const r = assembleResolvedGame(result, (runStages0to10(input) as any).classes, indexRegister(input.register), input.contracts)
        if (r.coherence.realizationAuthorized) authorized.push(goal)
        else if (r.coherence.gateA === 'FAIL') failed.push(goal)
        else notEvaluable.push(goal)
    }
    assert.deepEqual(authorized, ['A04'], 'the pilot path is one goal wide')
    /**
     * **FIVE goals now reach a verdict and fail it, up from two on 7 October — and the three new ones are a
     * finding rather than a drift.** D02, A03 and A06 each load only the Wide Zone object plus the Sport
     * Profile, their game form having no contract, so they establish no team class at all and therefore no
     * POSSESSION_CHANGE. Wide Zone's authored termination (V8d) names exactly that trigger, so in those three
     * games the value modification can never end — the indefinite stored entitlement Coupled forbids, which
     * nothing could see until GA-MODIFIER-OVERLAP asked whether a stated termination can occur.
     *
     * Reported and NOT repaired: those goals are outside the pilot evidence claim and he instructed that the
     * other twelve not be repaired. The cause is the absent game form, not the Wide Zone authoring.
     */
    assert.deepEqual(failed.sort(), ['A03', 'A06', 'D02', 'D03', 'TD02'], 'five goals reach a verdict and fail it')
    assert.equal(notEvaluable.length, 7, `the rest have no contracted knowledge to judge; got ${notEvaluable.join(', ')}`)
})

/**
 * **THE ACCEPTANCE TEST, restored 6 October.** Suspended on 5 October when his reachability ruling removed its
 * subject, and restored by the Sport Profile rather than by relaxing anything: A04 now holds a ball and a
 * possession relationship from legitimate knowledge, so it passes Gate A on the way through instead of around.
 * `realizationAuthorized === true` is asserted first for exactly that reason.
 *
 * The three conditions it checks — nothing lost, nothing invented, nothing closed without authority — are the
 * realization pathway's actual subject, on real selected knowledge rather than a fixture.
 */
test('A04 realizes and all three conditions hold', () => {
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
    /**
     * **One choice is reported as unverified, and that is the honest grading rather than a weakening.**
     *
     * PS1's bound is a qualitative term — the Sport Profile says "one of the participating opposing teams", not
     * an enumerated set — so there is nothing for the realizer to compare a value against and `boundCheck` says
     * so. Asserting the SET rather than "every choice is WITHIN_PERMITTED_SET" keeps the stronger claim for the
     * five choices that earn it, and stops a future unverifiable choice from appearing quietly beside them.
     */
    const grading = new Map(realized.record.choices.map(c => [c.lineId, c.boundCheck]))
    assert.equal(grading.get('game::PS1'), 'UNVERIFIABLE_QUALITATIVE_BOUND', 'the initial holder is bounded qualitatively (SD-15)')
    assert.deepEqual(
        realized.record.choices.filter(c => c.lineId !== 'game::PS1').map(c => c.boundCheck),
        Array(supplied.choices.length - 1).fill('WITHIN_PERMITTED_SET'),
        'every other value came from inside an authored set',
    )
    /**
     * And the unverifiable one still names something real. `#0` sat here until 6 October: the realizer mints
     * handles from 1, so the chosen initial holder named no team, and a qualitative bound meant nothing
     * compared it to anything. `realize()` refuses that shape now; this asserts the game it produced agrees.
     */
    assert.ok(
        teams.some((t: any) => t.elementId === (realized.game as any).possession.team),
        `the initial holder must be one of the game's own teams; it is ${(realized.game as any).possession.team}`,
    )
})

/**
 * **A chosen value that names a member the game does not hold is refused — and this one escaped for a day.**
 *
 * The initial possession holder was recorded as `…#0` while `memberHandle` mints ordinals from 1, so the one
 * realized game on the pilot path carried a reference to a team that does not exist. Three independent things
 * had to be true for it to pass: PS1's bound is qualitative so `boundCheck` is `UNVERIFIABLE_QUALITATIVE_BOUND`
 * and nothing compared the value to anything; no consumer reads `possession.team`, so nothing downstream
 * tripped over it; and the acceptance account reported nothing lost and nothing invented, because a dangling
 * reference is neither. A test for each of those three would still have passed.
 *
 * So the check is on the one thing that cannot be argued with: a handle either names a member this realization
 * produced, or it names nothing. An unverifiable bound means the TERM cannot be checked, not that any string
 * will do.
 */
/** PS1's live shape, as a fixture: an unenumerated choice space bounded only by a qualitative term. */
const qualitativelyBounded = () =>
    eligible({
        open: [
            {
                path: 'possession.team',
                lineId: 'game::PS1',
                elementId: null,
                permittedBy: { authority: 'SD-39', choiceSpace: 'one of the teams the game establishes' },
                permitted: null,
                bounds: [{ kind: 'QUALITATIVE', term: 'one of the participating opposing teams' }],
                kind: 'FREE(a)',
            },
        ],
        existential: [
            { path: 'performers.teams', classId: 'K-teams', from: { contractId: 'C', itemId: 'I' }, cardinality: { min: 2, max: 2 }, satisfiedBy: [], cardinalityUnreadable: false, shortfall: 2 },
        ],
    } as any)

const twoTeams = () => [1, 2].map(() => ({ classId: 'K-teams', member: {}, because: 'the claim asserts two and individuates neither' })) as any[]

test('a chosen member handle that names no member is refused, even under an unverifiable bound', () => {
    const refused = realize(qualitativelyBounded(), [{ lineId: 'game::PS1', value: 'K-teams#0', because: 'off by one' }], twoTeams())
    assert.ok(isRefused(refused), 'a value naming no member must not realize')
    assert.ok(
        (refused as any).because.some((b: string) => b.includes('K-teams#0') && b.includes('names no member')),
        `the refusal must name the dangling handle: ${JSON.stringify((refused as any).because)}`,
    )

    // The same choice, one ordinal later, names a member that was actually minted — and realizes.
    const ok = realize(qualitativelyBounded(), [{ lineId: 'game::PS1', value: 'K-teams#1', because: 'the first of two indiscernible teams' }], twoTeams())
    if (isRefused(ok)) return assert.fail(`refused: ${ok.because.join('; ')}`)
    assert.equal((ok.game as any).possession.team, 'K-teams#1')
    assert.equal(ok.record.choices[0].boundCheck, 'UNVERIFIABLE_QUALITATIVE_BOUND', 'the bound is still unverifiable; the reference is not')
})

/**
 * A value that merely contains a `#` is not a handle, and must not be dragged into the check. The guard is on
 * the shape `memberHandle` mints — a `c:`-prefixed class id, a hash, and digits to the end — so ordinary prose
 * passes through a qualitatively bounded line untouched.
 */
test('an ordinary value containing a hash is not treated as a member handle', () => {
    const result = realize(qualitativelyBounded(), [{ lineId: 'game::PS1', value: 'the team starting in zone #2', because: 'prose' }], twoTeams())
    if (isRefused(result)) return assert.fail(`refused: ${result.because.join('; ')}`)
    assert.equal((result.game as any).possession.team, 'the team starting in zone #2')
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
