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

import { corpusInput, loadCorpusContracts, loadRegister } from '../derivation/corpus'
import { isStampedHalt } from '../derivation/emit'
import { runDerivation, runStages0to10 } from '../derivation/engine'
import { indexRegister } from '../derivation/register'
import { assembleResolvedGame, ResolvedGame } from '../derivation/resolved-game'
import { a01CompositionUntil15October } from '../derivation/composition-fixtures'
import { derivationInputFor, GoalSelectionGap, selectFor } from '../derivation/run-bounded-selection'
import { sessionPlanningModel } from '../session-planning/session-planning-model'
import { justifiedDefaults } from './justified-defaults'
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

/**
 * **Moved 13 October 2026: the record gained `within` and `closure`, and nothing it held before changed.**
 * Christian that day: *"I agree with preserving authored ranges, selected starting values, alternatives, and
 * the reasons for those selections throughout realization and communication."* The record kept the value and
 * the name of the check it passed and dropped what it was checked against, so the unchosen alternative was
 * nowhere after this point. The six fields asserted until now are asserted still, with the same values.
 */
test('the record says what was chosen, where, on whose authority — and what it was chosen within', () => {
    const result = realize(eligible(), chooseScoring) as Realized
    assert.deepEqual(result.record.choices, [
        {
            lineId: 'L-scoring',
            value: 'TARGET_GOAL',
            because: 'the first permitted alternative',
            path: 'objectives.scoring_method',
            authority: 'GF2-11',
            boundCheck: 'WITHIN_PERMITTED_SET',
            within: { permitted: ['LINE_DRIBBLE', 'TARGET_GOAL'], bounds: [] },
            closure: 'CHOSEN_AMONG_ALTERNATIVES',
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
// The bound stays with the choice (13 October). A value recorded alone cannot say whether it was the
// only one permitted, one of several, a place to start inside a range, or the coach's.
// ---------------------------------------------------------------------------------------------

/** One open line with the given freedom, and nothing else to close. */
const openLine = (line: { permitted?: unknown[] | null; bounds?: unknown[] }, lineId = 'L-x', path = 'space.x') =>
    eligible({ open: [{ path, lineId, elementId: null, permittedBy: null, permitted: line.permitted ?? null, bounds: line.bounds ?? [], kind: 'FREE(a)' }] })

const closed = (resolved: ResolvedGame, value: unknown, lineId = 'L-x') => {
    const result = realize(resolved, [{ lineId, value, because: 'a test' }])
    if (isRefused(result)) return assert.fail(`refused: ${result.because.join('; ')}`)
    return result.record.choices[0]
}

test('each kind of freedom is closed as what it is, and the bound is kept beside the value', () => {
    // The only value an authored bound permits. Nothing was chosen, and the record says so.
    const only = closed(openLine({ bounds: [{ kind: 'SET', members: ['full width'], preferred: true }] }), 'full width')
    assert.equal(only.closure, 'ONLY_VALUE')
    assert.deepEqual(only.within, { permitted: null, bounds: [{ kind: 'SET', members: ['full width'], preferred: true }] })

    // A number inside an authored range: where the activity STARTS. Both ranges travel, each marked.
    const range = [
        { kind: 'COUNT', min: 1, max: null, term: '>= 1 (no authored maximum)', preferred: false },
        { kind: 'COUNT', min: 1, max: 2, term: '1-2 (one or two)', preferred: true },
    ]
    const starting = closed(openLine({ bounds: range }), 2)
    assert.equal(starting.closure, 'STARTING_VALUE_IN_RANGE')
    assert.equal(starting.boundCheck, 'WITHIN_COUNT')
    assert.deepEqual(starting.within.bounds, range, 'the required floor AND the preferred range, so neither can be mistaken for the other later')

    // A range that is only preferred is still a range to start inside.
    assert.equal(closed(openLine({ bounds: [range[1]] }), 2).closure, 'STARTING_VALUE_IN_RANGE')

    // Bounded only by a term in words: SD-15 makes that a coach's judgement.
    const coach = closed(openLine({ bounds: [{ kind: 'QUALITATIVE', term: 'a long kick', preferred: false }] }), 25)
    assert.equal(coach.closure, 'COACH_DECIDES')
    assert.equal(coach.boundCheck, 'UNVERIFIABLE_QUALITATIVE_BOUND')

    // Open, and bounded by nothing at all.
    const free = closed(openLine({}), 'anything')
    assert.equal(free.closure, 'UNBOUNDED')
    assert.deepEqual(free.within, { permitted: null, bounds: [] })

    // A set of alternatives carried as a bound rather than as a permitted set is still a set of alternatives.
    assert.equal(closed(openLine({ bounds: [{ kind: 'SET', members: ['a', 'b'] }] }), 'b').closure, 'CHOSEN_AMONG_ALTERNATIVES')
})

/**
 * **The kind recorded and the check that passed are about the same bound.** Added in the review of
 * 13 October 2026. `closureOf` read a line's sets before its required range while `checkBound` reads the
 * range first, so a line carrying both was checked as a count and recorded as *"the only value"*. No line
 * in the corpus carries both; this pins the order for the first that does.
 */
test('a line with a required range AND a set is recorded as what it was checked as', () => {
    const mixed = openLine({ bounds: [{ kind: 'COUNT', min: 1, max: 3, preferred: false }, { kind: 'SET', members: [2] }] })
    const choice = closed(mixed, 3)
    assert.equal(choice.boundCheck, 'WITHIN_COUNT', 'the required range is what decides')
    assert.equal(choice.closure, 'STARTING_VALUE_IN_RANGE', 'so that is the kind of closing it was — not ONLY_VALUE, which the set alone would say')

    // A range that is only PREFERRED does not decide: the set does, in the check and in the record alike.
    const preferredRange = openLine({ bounds: [{ kind: 'COUNT', min: 1, max: 3, preferred: true }, { kind: 'SET', members: [2] }] })
    const only = closed(preferredRange, 2)
    assert.deepEqual([only.boundCheck, only.closure], ['WITHIN_PERMITTED_SET', 'ONLY_VALUE'])
})

test('what is recorded is a COPY of the bound, so the record cannot be altered through the resolved game', () => {
    const resolved = openLine({ permitted: ['a', 'b'], bounds: [{ kind: 'SET', members: ['x'], forbidden: true }] })
    const result = realize(resolved, [{ lineId: 'L-x', value: 'a', because: 'a test' }]) as Realized
    ;(resolved.open[0].permitted as unknown[]).push('c')
    ;(resolved.open[0].bounds[0] as any).members = ['changed']
    assert.deepEqual(result.record.choices[0].within, { permitted: ['a', 'b'], bounds: [{ kind: 'SET', members: ['x'], forbidden: true }] })
})

/**
 * **A forbidden set is not a permitted one.** An `EXCLUSION` item that does not entail lands in a line's
 * bounds, and it used to arrive as `{ kind: 'SET', members }` — the shape of the values a line MAY hold.
 * Measured on the possession game form with its one narrowing of the scoring kind withheld: the line was
 * left with only the exclusion's bound, and choosing a legitimate kind was refused as *"not among the
 * authored members"* of the very values the item forbids. Latent in every game that realizes, because
 * there the permitted set is checked first.
 */
test('an exclusion carried in the bounds is skipped, never read as the permitted set', () => {
    const forbidden = { kind: 'SET', members: ['{keep-away} (forbidden: retained possession alone as the scoring event)'], preferred: false, forbidden: true }
    const only = closed(openLine({ bounds: [forbidden] }), 'line_crossed')
    assert.equal(only.boundCheck, 'UNBOUNDED', 'nothing permitting bounds this line, and the record does not claim otherwise')
    assert.equal(only.closure, 'UNBOUNDED')
    assert.deepEqual(only.within.bounds, [forbidden], 'the exclusion still travels, marked as what it is')

    // TEETH — the same bound without the mark is a permitted set of one, and refuses everything else.
    const unmarked = realize(openLine({ bounds: [{ kind: 'SET', members: forbidden.members }] }), [{ lineId: 'L-x', value: 'line_crossed', because: 'a test' }])
    assert.ok(isRefused(unmarked) && /not among the authored members/.test(unmarked.because[0]), 'which is the refusal the mark removes')

    // Beside a real bound it changes nothing: the requirement still bites and the forbidden set is not consulted.
    const beside = openLine({ bounds: [{ kind: 'COUNT', min: 1, max: 3 }, forbidden] })
    assert.equal(closed(beside, 2).closure, 'STARTING_VALUE_IN_RANGE')
    assert.ok(isRefused(realize(beside, [{ lineId: 'L-x', value: 4, because: 'above the maximum' }])))
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

    // A contradicted invariant. TD02 selects the blind GF4 restatement, whose POSSESSION_CHANGE transition is
    // keyed on a trigger the game cannot construct — so reachability fails on the FIRST clause, and the
    // failure is named rather than merely reported as a refusal. (This specimen was D03 until 13 October;
    // D03 only ever reached that restatement because selection here ignored the context rule.)
    const d03Input = derivationInputFor(selectFor('TD02', null))
    const d03Result = runDerivation(d03Input)
    if (isStampedHalt(d03Result)) return assert.fail('unexpected halt')
    const d03 = assembleResolvedGame(d03Result, (runStages0to10(d03Input) as any).classes, indexRegister(d03Input.register), d03Input.contracts)
    assert.equal(d03.coherence.preRealization, 'FAIL')
    assert.equal(d03.coherence.realizationAuthorized, false)
    assert.match(d03.coherence.notAuthorizedBecause[0], /fails:.*GA-TRIGGER-REACHABLE/, 'it must name the invariant, not merely refuse')

    // An unevaluable one: the Pass Combination Gate's demonstration composition, the possession game form
    // and the gate, whose prose references Gate A cannot evaluate. (D01 was this specimen until 13 October,
    // when the context rule put it on a contracted game form; A02 until 14 October, when it became a
    // knowledge gap — selection draws only from a goal's own candidates, his ruling of that day — and so
    // selects nothing to derive. The composition is the object the unevaluability always came from.)
    //
    // **On 14 October 2026 his answers moved the composition itself from unevaluable to FAILED** (C44 typed its
    // counting information, so that is evaluable; C45 removed its place, so the condition's place is a declared
    // gap). So the unevaluable specimen is the composition with ONE open-text place given back on a copy — the
    // state its "own half" put it in before C45: open text establishes no identity, so the references cannot be
    // evaluated and nothing fails. A test device, stated as such; the knowledge is not changed.
    const d01Input = gateWithOpenTextPlace()
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
        ['GA-DIRECTION', 'GA-ENVELOPE-FIT', 'GA-LAYOUT-FEASIBLE', 'GA-ONE-PRIMARY-EVENT', 'GA-ROSTER-SUM'],
        'the four he ruled post-realization, and since ruling C42 the direction check as well: with a target per team its ' +
            'opposite-ends clause compares where each target actually sits, and a target position is an authored relative term ' +
            'that becomes an interval only when realization composes it against the envelope. It is owed here and checked there, ' +
            'which is what keeps two targets on the same end a failure rather than something nobody looked at',
    )
    for (const owed of resolved.coherence.postRealizationRequired) assert.ok(owed.owes.length > 0, `${owed.checkId} owes nothing stated`)
})

/**
 * The Pass Combination Gate as its mechanism demonstration composes it: the possession game form and the gate,
 * named directly. No Learning Goal selects the gate since 14 October (his ruling: *"Please keep the current Pass
 * Combination Gate as a mechanism demonstration only"*), so the gate's own behaviour is tested here.
 */
function gateComposition() {
    return derivationInputFor({ selected: [{ id: 'GF2', role: 'game form' }, { id: 'tl-v0-constraint-pass-combination-gate', role: 'constraint' }] })
}

/** The composition with an open-text place added to the gate's condition and claimed — on a copy, a test device. */
function gateWithOpenTextPlace() {
    const input = JSON.parse(JSON.stringify(gateComposition()))
    const gate = input.contracts.find((c: any) => String(c.contractId).includes('PASS-COMBINATION'))
    gate.items.push({
        itemId: 'T-PLACE',
        origId: 'T-PLACE',
        row: 'V5',
        selector: 'type=connected-pass-combination',
        requirement: 'EQUALS',
        value: 'a place named in open text (a test device)',
        strictness: 'REQUIRED',
        valueStatus: 'REQUIRED_RANGE',
        scope: 'WHOLE_GAME',
        basis: 'AUTHORED',
        basisEvidence: 'a test fixture, not authored knowledge',
        checkability: 'STRUCTURAL',
        structuralClause: 'whole item',
    })
    gate.declarations = gate.declarations.filter((d: any) => d.row !== 'V5')
    gate.declarations.push({ row: 'V5', declaration: 'CLAIMED', selector: 'type=connected-pass-combination', scope: 'WHOLE_GAME', note: 'a test fixture' })
    return input
}

test('the gate composition is NOT authorized, and says which pre-realization invariant is unsatisfied', () => {
    // Still refused, and still for a stated reason — but the reason has moved twice. GA-INFORMATION and
    // GA-REFERENCE-INTEGRITY being unevaluable was what stopped A05 originally; on 5 October the reachability
    // ruling made it fail earlier and harder; and on 6 October the Sport Profile satisfied reachability, so the
    // original two are once again what it is waiting on. The point of the test never moved: authorization
    // discriminates, and it says which invariant and in which of the two ways.
    //
    // **The subject moved on 14 October from A05 to the gate composition.** The two unevaluable invariants were
    // always the gate's; A05 carried them only because it selected the gate. His ruling holds the gate out of
    // every Learning Goal's selection, so A05 now selects Wide Zone Advantage from its own candidates and IS
    // authorized (asserted at the end); the assertions about the gate stay on the gate.
    const input = gateComposition()
    const result = runDerivation(input)
    if (isStampedHalt(result)) return assert.fail('unexpected halt')
    const resolved = assembleResolvedGame(result, (runStages0to10(input) as any).classes, indexRegister(input.register), input.contracts)

    assert.equal(resolved.coherence.realizationAuthorized, false)
    // **The reason moved a third time on 14 October 2026, by his answers about the gate.** C44 typed its counting
    // information to its own condition, so GA-INFORMATION is evaluable and passes; C45 removed "in their half",
    // so the condition names no place and — with the possession game's general "the qualifying condition must
    // come from elsewhere" reaching the line — that line is a declared gap, which FAILS. Unevaluable became
    // failed, named, with the line. What moves it is his precedence decision (OD1).
    assert.deepEqual(resolved.coherence.notAuthorizedBecause, [
        'a pre-realization Gate A invariant fails: GA-NO-FAILED-LINE',
        '1 unresolved property is neither an authorized choice nor an authorized claim: c:blind:PASS-COMBINATION-GATE:PCG-02::V5',
    ])
    assert.ok(
        !/GA-TRIGGER-REACHABLE/.test(resolved.coherence.notAuthorizedBecause.join(' ')),
        'and reachability is not among them — the game gets the ball from the Sport Profile like every other',
    )
    // The state before his answers, on a copy with an open-text place: unevaluable, and since component 1 the
    // position clause says so too. Measured 14 October — before component 1 this named GA-INFORMATION and
    // GA-REFERENCE-INTEGRITY; GA-ONE-PRIMARY-EVENT joined them when the clause stopped deferring on the open
    // scoring kind (*"Correct the two reference/condition faults"*), and C44 took GA-INFORMATION out.
    const openInput = gateWithOpenTextPlace()
    const openResult = runDerivation(openInput)
    if (isStampedHalt(openResult)) return assert.fail('unexpected halt')
    const open = assembleResolvedGame(openResult, (runStages0to10(openInput) as any).classes, indexRegister(openInput.register), openInput.contracts)
    assert.deepEqual(open.coherence.notAuthorizedBecause, ['a pre-realization Gate A invariant cannot be evaluated, so it is not satisfied: GA-ONE-PRIMARY-EVENT, GA-REFERENCE-INTEGRITY'])
    const a05Input = derivationInputFor(selectFor('A05', null))
    const a05Result = runDerivation(a05Input)
    if (isStampedHalt(a05Result)) return assert.fail('unexpected halt')
    const a05 = assembleResolvedGame(a05Result, (runStages0to10(a05Input) as any).classes, indexRegister(a05Input.register), a05Input.contracts)
    assert.equal(a05.coherence.realizationAuthorized, true, 'A05 without the held gate: its own Wide Zone candidate, and authorized')
})

/** A04's resolved game, assembled from the live selection. */
function a04(): ResolvedGame {
    const input = derivationInputFor(selectFor('A04', null))
    const result = runDerivation(input)
    if (isStampedHalt(result)) throw new Error('unexpected halt')
    return assembleResolvedGame(result, (runStages0to10(input) as any).classes, indexRegister(input.register), input.contracts)
}

/**
 * A resolved game with more than one region, for the cases that need a populated collection.
 *
 * It names the Wide Zone contract rather than going through a goal's selection. A04 used to serve
 * this because the general default package it committed included Wide Zone, giving it three regions:
 * the target line and two channels. Since the attacking-duel group of 8 October, A04 resolves
 * specifically and holds one region, so a case that needs several has to say which knowledge supplies
 * them.
 */
function multiRegionGame(): ResolvedGame {
    const a04Input = derivationInputFor(selectFor('A04', null))
    const contracts = [
        ...loadCorpusContracts().filter(c => /GF2|WIDE-ZONE/.test(String(c.contractId))),
        ...a04Input.contracts.filter(c => /sport-profile/.test(String(c.contractId))),
    ]
    const input: any = { ...a04Input, contracts, selection: contracts.map((c: any) => ({ objectId: c.objectId, knowledgeVersion: 'stage-b' })) }
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
 *
 * **It needs a game holding more than one region**, or the synthetic bound of "at most one" is not
 * exceeded and nothing is over-populated to refuse. A04 stopped being such a game on 8 October, so the
 * subject is now named by its knowledge.
 */
test('a collection holding more elements than its knowledge authors is refused', () => {
    const resolved = multiRegionGame()
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
 * **A required extent is recorded in metres at BOTH ends** — `requiredWithin`, added 13 October.
 *
 * The requirement on a channel's width is authored as a fraction of the area's width — his ruling of
 * 1 October: *"a minimum of 0.15 and a maximum of 0.25 of the available across dimension"* — and only the
 * maximum ever became metres, because the interval is composed at the widest permitted extent. So the game
 * held 7.5 m and never 4.5 m, and nothing downstream could state the minimum without working it out for
 * itself. It is established here, where the fraction meets the envelope, and multiplied exactly: 0.15 of a
 * 23 m width is 3.45 m, and the float product is 3.4499999999999997.
 */
test('a required extent is recorded in metres at both ends, exactly, with the preference expressed inside it', () => {
    const resolved = multiRegionGame()
    const supplied = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../../../docs/audits/a04-realization-choices.json'), 'utf8'))
    const register = indexRegister(loadRegister())
    const widths = (lengthM: number, widthM: number) => {
        const realized = realize(resolved, supplied.choices, supplied.instantiations, register, { lengthM, widthM }, justifiedDefaults(resolved, supplied.choices))
        if (isRefused(realized)) throw new Error(`refused: ${realized.because.join('; ')}`)
        const bounded = realized.record.geometry.filter(g => g.path.endsWith('.position.across') && g.geometry.extentBound)
        assert.equal(bounded.length, 2, 'the two channels are the lines that carry an extent bound')
        for (const g of bounded) {
            const { requiredWithin } = g.geometry.extentBound!
            assert.equal(g.geometry.interval!.to - g.geometry.interval!.from, requiredWithin!.max, 'the interval is composed at the required maximum, the same number')
        }
        return bounded.map(g => [g.geometry.extentBound!.requiredWithin, g.geometry.extentBound!.preferenceWithin])
    }
    const inside = (min: number, max: number) => ({ min, max, compatible: true, note: 'the preference, expressed inside the requirement, in metres' })

    /**
     * **Moved 14 October 2026: both are recorded at the PRACTICAL grain**, rounded inward, on his §7 —
     * *"Where practical rounding is appropriate, apply it when the configuration is established so the actual game
     * and its instructions remain consistent"* (grain as data, a proposal awaiting his confirmation). 40 x 30 is
     * already on the grain and does not move. On 25 m the requirement 3.75-6.25 m becomes 4-6 m and the preference
     * left inside it, 6-6.25 m, becomes the one practical value 6 m (*"a practical starting recommendation rather
     * than an awkwardly narrow numerical range"*); the exact overlap is kept in the note, in words.
     */
    const rounded = (min: number, max: number, exactly: string) => ({ ...inside(min, max), note: `the preference, expressed inside the requirement, in metres; rounded inward to the practical grain from exactly ${exactly}` })
    assert.deepEqual(widths(40, 30), Array(2).fill([{ min: 4.5, max: 7.5 }, inside(6, 7.5)]))
    assert.deepEqual(widths(30, 25), Array(2).fill([{ min: 4, max: 6 }, rounded(6, 6, '6 to 6.25 m')]), 'a quarter of 25 m is exactly 6.25 m, and the practical channel is 6 m')
    // The decimal the fraction spells, where the float product is not it — and THAT is what is rounded.
    assert.notEqual(0.15 * 23, 3.45, 'the artefact this guards against is real')
    assert.deepEqual(widths(35, 23).map(([required]) => required), Array(2).fill({ min: 3.5, max: 5.5 }), 'exactly 3.45-5.75 m, practically 3.5-5.5 m')
    // On a 15 m width the preferred 6 to 10 m lies wholly outside 2.5 to 3.5 m: recorded as incompatible, never widened into.
    for (const [required, preference] of widths(20, 15)) {
        assert.deepEqual(required, { min: 2.5, max: 3.5 })
        assert.equal((preference as any).compatible, false)
    }
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
    const input = derivationInputFor(selectFor('TD02', null))
    const result = runDerivation(input)
    if (isStampedHalt(result)) return assert.fail('unexpected halt')
    const resolved = assembleResolvedGame(result, (runStages0to10(input) as any).classes, indexRegister(input.register), input.contracts)
    assert.equal(resolved.coherence.realizationAuthorized, false, 'TD02 must still be an unauthorized game for this test to have a subject')

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
 *
 * **13 October — THREE GOALS ARE AUTHORIZED, AND THEY ARE ONE GAME.** That paragraph described a selection
 * the application never makes: `selectFor` had left out the context rule. With it, and with his approved Game
 * Problem translation governing, Stay Organized and Defend 1v1 land on the contracted possession form beside
 * Beat Defenders 1v1. None of the three commits a contracted constraint, so all three resolve to the same
 * game — the last assertion below pins that identity, because "three goals work" would otherwise be exactly
 * the selective report this test exists to prevent. Three goals served is one activity served three times.
 */
test('four goals are realization-authorized, they are two games, and the other nine are accounted for', () => {
    const authorized: string[] = []
    const failed: string[] = []
    const notEvaluable: string[] = []
    const gaps: string[] = []
    const authorizedGames = new Map<string, string[]>()
    for (const goal of (sessionPlanningModel.learningGoals() as any[]).map(g => String(g.ID))) {
        let selection
        try {
            selection = selectFor(goal, null)
        } catch (error) {
            if (!(error instanceof GoalSelectionGap)) throw error
            gaps.push(goal)
            continue
        }
        const input = derivationInputFor(selection)
        const result = runDerivation(input)
        if (isStampedHalt(result)) return assert.fail(`unexpected halt on ${goal}`)
        const r = assembleResolvedGame(result, (runStages0to10(input) as any).classes, indexRegister(input.register), input.contracts)
        if (r.coherence.realizationAuthorized) {
            authorized.push(goal)
            const key = JSON.stringify(r.game)
            authorizedGames.set(key, [...(authorizedGames.get(key) ?? []), goal])
        }
        else if (r.coherence.gateA === 'FAIL') failed.push(goal)
        else notEvaluable.push(goal)
    }
    /**
     * **14 October — FOUR AUTHORIZED, TWO GAMES; measured.** His rulings of that day moved this census three
     * ways. D03 is a knowledge gap (it can no longer borrow, and its own candidates cannot be combined), as is
     * A02. A05 and TA02 no longer select the held Pass Combination Gate, so they select Wide Zone Advantage from
     * their own candidates and are authorized — as the possession game with Wide Zone, which is the scoring-
     * modifier demonstration's game. A01 now carries its contracted context, RPC-001, and FAILS Gate A on the
     * lines that context leaves unestablished. So: two goals on the bare possession game, two on the Wide Zone
     * game. Authorization here is derivation's; the review page still refuses all four, because none of their
     * contexts has a contract. Four goals authorized is two activities, neither a learning-design example.
     */
    assert.deepEqual(authorized.sort(), ['A04', 'A05', 'D01', 'TA02'], 'four goals reach realization')
    assert.deepEqual(
        [...authorizedGames.values()].map(goals => goals.sort().join(',')).sort(),
        ['A04,D01', 'A05,TA02'],
        'and they are two games: the bare possession game, and the possession game with Wide Zone Advantage',
    )
    // A01 joins the gaps on 15 October 2026: its authorization record authorizes no constraint (his item 1 of that day).
    assert.deepEqual(gaps, ['A01', 'A02', 'D03'], 'the knowledge gaps of 14 October, A01 since 15 October, and no others')
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
     *
     * **Six since 13 October.** A03 and A06 fail as described. The other four — D02, TA01, TD01 and TD02 — are
     * every goal that lands on Transition Games, and they fail on that form’s own blind restatement. D02 is no
     * longer a Wide Zone failure at all: as a Regain Possession goal it does not select that object.
     */
    //
    // **Seven since 14 October:** A01 joins them, failing on its context's unestablished lines.
    // **Six again since 15 October:** A01 no longer reaches derivation (a knowledge gap, above). The composition it
    // selected until then — named, composition-fixtures.ts — still fails Gate A on its context's lines, checked here
    // so the finding is not lost with the selection.
    assert.deepEqual(failed.sort(), ['A03', 'A06', 'D02', 'TA01', 'TD01', 'TD02'], 'six goals reach a verdict and fail it')
    {
        const input = derivationInputFor(a01CompositionUntil15October(null))
        const result = runDerivation(input)
        if (isStampedHalt(result)) return assert.fail('unexpected halt on the A01 composition')
        const r = assembleResolvedGame(result, (runStages0to10(input) as any).classes, indexRegister(input.register), input.contracts)
        assert.equal(r.coherence.gateA, 'FAIL', 'the composition A01 selected until 15 October fails Gate A')
    }
    // The four that selected the Pass Combination Gate were the unevaluable ones. No goal selects it now.
    assert.deepEqual(notEvaluable.sort(), [], 'no goal is left that cannot be evaluated')
})

/**
 * **A selected contract refused at load must refuse the game — 13 October.**
 *
 * The specimen is Secure Possession, which selects the possession game form and the Pass Combination Gate.
 * One item of that contract loses its basis evidence, which is the smallest authoring slip stage 0 refuses a
 * contract for. Before this rule the result was an AUTHORIZED game: derivation proceeded without the gate,
 * every check judged the bare possession game that remained, and found it coherent. The goal went from
 * "cannot be evaluated" to "may be realized" by losing knowledge.
 *
 * The second half is the control that gives the first its meaning: the refusal is the ONLY reason the game
 * is withheld. Remove the rule and this exact input realizes.
 */
test('a selected contract refused at load refuses the game instead of quietly leaving it out', () => {
    // The gate composition since 14 October: Secure Possession no longer selects the gate (his ruling holds it
    // out of Learning Goal selection). The specimen is the same knowledge, named directly.
    const input: any = gateComposition()
    // The loader hands back shared contract objects; copy before touching one.
    input.contracts = JSON.parse(JSON.stringify(input.contracts))
    const gate = input.contracts.find((c: any) => /PASS-COMBINATION-GATE/.test(String(c.contractId)))
    assert.ok(gate, 'the composition selects the Pass Combination Gate, or this test has no subject')
    delete gate.items.find((i: any) => i.itemId === 'PCG-05').basisEvidence

    const result = runDerivation(input)
    if (isStampedHalt(result)) return assert.fail('unexpected halt')
    assert.ok(result.failures.some(f => f.kind === 'LOAD_REFUSAL'), 'stage 0 refuses the contract, as it always has')

    const resolved = assembleResolvedGame(result, (runStages0to10(input) as any).classes, indexRegister(input.register), input.contracts)
    assert.equal(resolved.coherence.realizationAuthorized, false, 'a game missing knowledge it selected may not be realized')
    assert.deepEqual(
        resolved.coherence.notAuthorizedBecause,
        ['selected knowledge was refused at load, so the game does not contain what was selected: blind:PASS-COMBINATION-GATE'],
        'and that is the only thing withholding it: the bare game that remains passes every other check',
    )
    assert.ok(isRefused(realize(resolved, [], [])), 'so realization refuses it')
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

    /**
     * **Run as the pathway runs it, 13 October: with the register, and with the justified defaults.** This
     * called `realize` with neither. Without the register a row's declared domain is unknown, so the test
     * was grading a run no caller performs; and two of the six lines this game leaves open are no longer in
     * the choices file at all, because each has exactly one permitted value and is closed by rule.
     */
    const supplied = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../../../docs/audits/a04-realization-choices.json'), 'utf8'))
    const defaults = justifiedDefaults(resolved, supplied.choices)
    const realized = realize(resolved, supplied.choices, supplied.instantiations, indexRegister(loadRegister()), undefined, defaults)
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
    assert.equal(realized.record.choices.length, supplied.choices.length + defaults.length)
    assert.equal(realized.record.choices.length, resolved.open.length, 'one value for every line the game left open, and no other')
    /**
     * **The initial holder is graded as checked against its DECLARED DOMAIN — moved 13 October 2026.**
     *
     * This asserted `UNVERIFIABLE_QUALITATIVE_BOUND`, and that was the honest grading while it stood: PS1's
     * bound is a term in words — the Sport Profile says "one of the participating opposing teams", not an
     * enumerated set — so the realizer compared the value with nothing and said so. What moved is that the
     * register's `fillableFrom: performers.teams[]`, which no code read, is now enforced: the value must be a
     * member of that collection as the game holds it. So the value IS compared with something, and the
     * grading names what. Nothing was loosened to get here — a value that names no team is now refused where
     * it used to be recorded as unverified, and the test after this one shows it.
     *
     * Asserting each grading rather than "every choice is WITHIN_PERMITTED_SET" still keeps the stronger
     * claim for the five that earn it, and stops a future unverifiable choice appearing quietly beside them.
     */
    const grading = new Map(realized.record.choices.map(c => [c.lineId, c.boundCheck]))
    assert.equal(grading.get('game::PS1'), 'WITHIN_DECLARED_DOMAIN', 'the initial holder is a member of the collection its row declares')
    assert.deepEqual(realized.record.unverified, [], 'so no choice in this game is left unverified')
    assert.deepEqual(
        realized.record.choices.filter(c => c.lineId !== 'game::PS1').map(c => c.boundCheck),
        Array(resolved.open.length - 1).fill('WITHIN_PERMITTED_SET'),
        'every other value came from inside an authored set',
    )
    /**
     * **And each says what kind of closing it was, with what it was closed within.** Measured on this game
     * before the record could say it: three design alternatives, two values that are the only one permitted,
     * and one that is the coach's. No authored numeric range is collapsed anywhere in it.
     */
    const closures = Object.fromEntries(realized.record.choices.map(c => [c.lineId, c.closure]))
    assert.deepEqual(closures, {
        'c:restated:GF2:GF2-03.e::S3': 'CHOSEN_AMONG_ALTERNATIVES',
        'c:restated:GF2:GF2-03.f::S3': 'CHOSEN_AMONG_ALTERNATIVES',
        'game::V1': 'CHOSEN_AMONG_ALTERNATIVES',
        'c:restated:GF2:GF2-03.e::S6': 'ONLY_VALUE',
        'c:restated:GF2:GF2-03.f::S6': 'ONLY_VALUE',
        'game::PS1': 'COACH_DECIDES',
    })
    const within = (lineId: string) => realized.record.choices.find(c => c.lineId === lineId)!.within
    assert.deepEqual(within('c:restated:GF2:GF2-03.e::S3').permitted, ['zone', 'line'], 'the alternative that was not chosen is still on the record')
    assert.deepEqual(within('game::PS1').permitted, teams.map((t: any) => t.elementId), "the coach's choice is among the game's own teams, by handle")
    assert.ok(
        within('game::V1').bounds.every(b => b.kind !== 'SET' || b.forbidden === true),
        `the scoring kind's only SET bound is an exclusion, and it is marked as one: ${JSON.stringify(within('game::V1').bounds)}`,
    )
    // The two values nobody chose are recorded as defaults, by rule, and are otherwise ordinary choices.
    assert.deepEqual(
        realized.record.choices.filter(c => c.defaultedBy).map(c => [c.lineId, c.defaultedBy]),
        [
            ['c:restated:GF2:GF2-03.e::S6', 'ONLY_MEMBER_OF_AUTHORED_BOUND'],
            ['c:restated:GF2:GF2-03.f::S6', 'ONLY_MEMBER_OF_AUTHORED_BOUND'],
        ],
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

/**
 * **A row that declares its domain is held to it** — the register's `fillableFrom`, which had no consumer.
 *
 * The handle-shape check above catches one mistake: a handle one ordinal out. Measured on 13 October with
 * the register in hand, exactly as the pathway runs: an initial holder of `banana`, and one naming a REGION
 * of the same game, were each accepted, passed all three acceptance conditions and passed the
 * post-realization gates. The two tests above still hold for a caller with no register, which is told
 * nothing about domains; these are the same line with one.
 */
test('a value for a row with a declared domain must be a member of that collection in this game', () => {
    const register = indexRegister(loadRegister())
    assert.equal(register.fillableFrom.get('PS1'), 'performers.teams[]', 'the register declares where the possession row is filled from')
    const withRegion = () => {
        const resolved = qualitativelyBounded()
        ;(resolved.game as any).space = { regions: [{ elementId: 'c:X:region' }] }
        resolved.derived.push({ path: 'space.regions[c:X:region].noun', lineId: 'c:X:region::S3', value: 'line', resolvedBy: 'ENTAILMENT', support: [] } as any)
        ;((resolved.game as any).space.regions[0] as any).noun = 'line'
        return resolved
    }
    const holder = (value: unknown) => realize(withRegion(), [{ lineId: 'game::PS1', value, because: 'a test' }], twoTeams(), register)

    for (const [value, what] of [
        ['banana', 'a word'],
        ['c:X:region', 'another element of the same game'],
        ['the team starting in zone #2', 'prose'],
        [1, 'a position'],
    ] as const) {
        const refused = holder(value)
        assert.ok(isRefused(refused), `${what} must not realize as the initial holder`)
        assert.ok(
            refused.because.some(b => b.includes('is not a member of performers.teams[]') && b.includes('K-teams#1, K-teams#2')),
            `the refusal names the domain and its members: ${JSON.stringify(refused.because)}`,
        )
    }

    // Either member is accepted, and the record says what it was chosen among and whose choice it is.
    for (const handle of ['K-teams#1', 'K-teams#2']) {
        const ok = holder(handle)
        if (isRefused(ok)) return assert.fail(`refused: ${ok.because.join('; ')}`)
        const [choice] = ok.record.choices
        assert.equal(choice.boundCheck, 'WITHIN_DECLARED_DOMAIN')
        assert.deepEqual(choice.within.permitted, ['K-teams#1', 'K-teams#2'], 'the members of the declared domain, as this game holds them')
        assert.deepEqual(choice.within.bounds, [{ kind: 'QUALITATIVE', term: 'one of the participating opposing teams' }], 'beside the authored term, unchanged')
        assert.equal(choice.closure, 'COACH_DECIDES')
        assert.deepEqual(ok.record.unverified, [], 'a value checked against its domain is not reported as unverified')
    }

    // A row with no declared domain is untouched by this, register or not.
    const elsewhere = realize(eligible(), chooseScoring, [], register)
    assert.equal((elsewhere as Realized).record.choices[0].boundCheck, 'WITHIN_PERMITTED_SET')

    // And a declaration that could never be decided halts the register rather than being carried unread
    // again: a domain on a row with no choice space, or one that is not a collection the register knows.
    const altered = (change: (rows: any[]) => void) => {
        const copy = JSON.parse(JSON.stringify(loadRegister()))
        change(copy.rows)
        return () => indexRegister(copy)
    }
    assert.throws(altered(rows => (rows.find(r => r.id === 'PS1').fillableFrom = 'performers.nobody[]')), /fillableFrom performers\.nobody\[\] of PS1 is not the path of a COLLECTION row/)
    assert.throws(altered(rows => (rows.find(r => r.id === 'PS1').fillableFrom = 'possession.team')), /is not the path of a COLLECTION row/, 'a field is not a collection')
    assert.throws(altered(rows => (rows.find(r => !r.fillable && r.kind === 'FIELD').fillableFrom = 'performers.teams[]')), /which has no fillable choice space/)
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
