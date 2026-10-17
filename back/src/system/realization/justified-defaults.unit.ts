/**
 * Justified defaults — tested mostly for what they REFUSE to close.
 *
 * Christian, 13 October 2026: defaults are welcome *"provided they don't silently override important
 * learning-design choices."* So the claim worth testing is the negative one. Two rules produce a default,
 * each only where the knowledge and the session admit exactly one value; everything else — a design
 * alternative, a coach's decision, a range with no preference, a preference the session admits two values
 * of — must still be left open, and realization must still refuse it as open and unchosen.
 *
 * A default machine that only ever closes things is not evidence of anything, which is the SD-54 lesson: a
 * vacuous pass is not a pass.
 *
 * Run: npm test
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { isStampedHalt } from '../derivation/emit'
import { runDerivation, runStages0to10 } from '../derivation/engine'
import { AUDITS_DIR } from '../derivation/knowledge-root'
import { indexRegister } from '../derivation/register'
import { assembleResolvedGame, OpenChoice, ResolvedGame } from '../derivation/resolved-game'
import { contractCoverage, derivationInputFor } from '../derivation/run-bounded-selection'
import { justifiedDefaults, justifiedDefaultsOnPathway, preferredCounts, realizeWithJustifiedDefaults } from './justified-defaults'
import { checkRealization, isRefused, JustifiedDefault, realize, Realized } from './realize'
import { isNoSuppliedRealization, suppliedRealizationFor } from './supplied-realization'

const tests: [string, () => void][] = []
const test = (name: string, body: () => void) => tests.push([name, body])

const line = (lineId: string, freedom: { permitted?: unknown[] | null; bounds?: unknown[] }): OpenChoice => ({
    path: `space.${lineId}`,
    lineId,
    elementId: null,
    permittedBy: null,
    permitted: freedom.permitted ?? null,
    bounds: freedom.bounds ?? [],
    kind: 'FREE(a)',
})

const game = (...open: OpenChoice[]): ResolvedGame =>
    ({
        provenance: { inputDigest: 'digest-1', engineVersion: 'e', registerVersion: 'r', derivationRulesVersion: 'd' },
        coherence: { gateA: 'PASS', failingChecks: [], preRealization: 'PRE_REALIZATION_SATISFIED', realizationAuthorized: true, notAuthorizedBecause: [], postRealizationRequired: [], mayRealize: true, deferred: [] },
        game: {},
        derived: [],
        open,
        existential: [],
        collectionCardinality: [],
        notEstablished: [],
        extentBounds: {},
        jointConditions: [],
        counts: {},
    }) as ResolvedGame

const REQUIRED_FLOOR = { kind: 'COUNT', min: 1, max: null, term: '>= 1 (no authored maximum)', preferred: false }
const PREFERRED_1_TO_2 = { kind: 'COUNT', min: 1, max: 2, term: '1-2 (one or two)', preferred: true }

// ---------------------------------------------------------------------------------------------
// Rule 1 — the only member of an authored bound.
// ---------------------------------------------------------------------------------------------

test('rule 1: a line whose authored bound has exactly one member is closed to that member', () => {
    const resolved = game(line('L-width', { bounds: [{ kind: 'SET', members: ['full width'], preferred: true }] }))
    const defaults = justifiedDefaults(resolved, [])
    assert.deepEqual(
        defaults.map(d => [d.lineId, d.value, d.rule]),
        [['L-width', 'full width', 'ONLY_MEMBER_OF_AUTHORED_BOUND']],
    )
    /**
     * **Re-pinned in the review of 13 October 2026: the reason says WHICH kind of single member it is.**
     * This asserted `/exactly one member/` of a default whose one member comes from a PREFERRED bound, and
     * the sentence around those words went on *"so it is the only value the knowledge permits here and any
     * other would be refused"*. That is false of a preferred default, and it is the case the corpus
     * actually holds: all four lines this rule closes today (each target's across-extent, each channel's
     * along-extent) carry their member from a `PREFERRED_DEFAULT`, `SUPPORTING` item. The default is still
     * justified — it is the only value authored — but a record that calls a preference a requirement has
     * changed its status. So the two kinds are told apart, and each is asserted.
     */
    assert.match(defaults[0].because, /exactly one value is authored for this line/, 'the reason states the rule, not a preference for the value')
    assert.match(defaults[0].because, /PREFERRED default — the value the knowledge gives to start from, not a requirement/)
    assert.doesNotMatch(defaults[0].because, /only value the knowledge permits/, 'a preferred default is not said to be all the knowledge permits')

    const required = justifiedDefaults(game(line('L-width', { bounds: [{ kind: 'SET', members: ['full width'], preferred: false }] })), [])
    assert.match(required[0].because, /exactly one member, "full width", so it is the only value the knowledge permits here/, 'a required one is')
    // A requirement that itself leaves one value is required, whatever a preference beside it also says.
    const both = justifiedDefaults(game(line('L-width', { bounds: [{ kind: 'SET', members: ['full width'], preferred: false }, { kind: 'SET', members: ['full width', 'half'], preferred: true }] })), [])
    assert.match(both[0].because, /only value the knowledge permits here/)

    // Two sets that agree on one member leave one value, however many each offers.
    const narrowed = game(line('L-x', { bounds: [{ kind: 'SET', members: ['a', 'b'] }, { kind: 'SET', members: ['b', 'c'] }] }))
    assert.deepEqual(justifiedDefaults(narrowed, []).map(d => d.value), ['b'])
})

test('rule 1 closes NOTHING else — alternatives, exclusions, words and unbounded lines stay open', () => {
    const untouched: [string, OpenChoice][] = [
        ['a set of alternatives is a design decision', line('L-noun', { permitted: ['zone', 'line'] })],
        ['a set carried as a bound with two members is one too', line('L-two', { bounds: [{ kind: 'SET', members: ['a', 'b'] }] })],
        // The scoring kind's real shape: alternatives, beside an exclusion's single-member set.
        ['an exclusion beside alternatives is not a value', line('L-kind', { permitted: ['line_crossed', 'target_zone_entered'], bounds: [{ kind: 'SET', members: ['{keep-away} (forbidden)'], forbidden: true }] })],
        // TEETH — read as a permitted set, this would default the line to the one value it may NOT hold.
        ['an exclusion alone is never the only member', line('L-forbidden', { bounds: [{ kind: 'SET', members: ['DEFENDING_TEAM'], forbidden: true }] })],
        ['a term in words is the coach\'s', line('L-holder', { bounds: [{ kind: 'QUALITATIVE', term: 'one of the participating opposing teams' }] })],
        ['a required range is not a value', line('L-count', { bounds: [{ kind: 'COUNT', min: 6, max: 12 }] })],
        ['sets with nothing in common leave nothing', line('L-none', { bounds: [{ kind: 'SET', members: ['a'] }, { kind: 'SET', members: ['b'] }] })],
        ['an unbounded line has no member to be the only one', line('L-free', {})],
        // Added in the review of 13 October. Required alternatives with a PREFERRED member: the preference
        // leaves one value, the requirement leaves two — a decision the knowledge has an opinion about.
        ['required alternatives are not closed by a preference among them', line('L-pref', { bounds: [{ kind: 'SET', members: ['a', 'b'], preferred: false }, { kind: 'SET', members: ['a'], preferred: true }] })],
        // And a set beside a required range is not what the value is held to: the range is checked first.
        ['a set beside a required range is not the only member of anything', line('L-mixed', { bounds: [{ kind: 'COUNT', min: 1, max: 3, preferred: false }, { kind: 'SET', members: [2] }] })],
    ]
    for (const [why, open] of untouched) {
        assert.deepEqual(justifiedDefaults(game(open), []), [], why)
        // And with nothing to close it, the line is refused exactly as it always was.
        const refused = realize(game(open), [], [], undefined, undefined, justifiedDefaults(game(open), []))
        assert.ok(isRefused(refused) && refused.because.some(b => b.includes(`${open.lineId} is open and was not chosen`)), `${why}: ${JSON.stringify((refused as any).because)}`)
    }
})

// ---------------------------------------------------------------------------------------------
// Rule 2 — the one preferred count the roster admits.
// ---------------------------------------------------------------------------------------------

test('rule 2: of the preferred counts inside the requirement, the ONE the roster admits is the starting value', () => {
    const resolved = game(line('L-neutrals', { bounds: [REQUIRED_FLOOR, PREFERRED_1_TO_2] }))
    const asked: unknown[] = []
    const defaults = justifiedDefaults(resolved, [], candidate => {
        asked.push(candidate.value)
        return candidate.value === 2
    })
    assert.deepEqual(asked, [1, 2], 'every whole number in the preferred range is put to the roster, and no other')
    assert.deepEqual(
        defaults.map(d => [d.lineId, d.value, d.rule]),
        [['L-neutrals', 2, 'ONLY_PREFERRED_COUNT_THE_ROSTER_ADMITS']],
    )
    assert.match(defaults[0].because, /STARTING value/, 'it is said to be where the activity starts')
    assert.match(defaults[0].because, /preferred range 1 to 2/)
    assert.match(defaults[0].because, /1 does not/, 'and what was passed over is named')
})

test('rule 2 defaults nothing where the session admits two values, or none, or nobody can say', () => {
    const resolved = game(line('L-neutrals', { bounds: [REQUIRED_FLOOR, PREFERRED_1_TO_2] }))
    assert.deepEqual(justifiedDefaults(resolved, [], () => true), [], 'two that fit is a decision, and it is not made here')
    assert.deepEqual(justifiedDefaults(resolved, [], () => false), [], 'none that fit is a session the preference does not reach')
    assert.deepEqual(justifiedDefaults(resolved, []), [], 'and a caller that cannot ask the roster is given no count on trust')
})

test('rule 2 looks only inside BOTH ranges, and only at a line that is a whole-number count with a closed preference', () => {
    const counts = (bounds: unknown[], permitted: unknown[] | null = null) => preferredCounts(line('L-x', { bounds, permitted }))
    assert.deepEqual(counts([REQUIRED_FLOOR, PREFERRED_1_TO_2])?.candidates, [1, 2])
    // The requirement cuts the preference; the preference never widens the requirement.
    assert.deepEqual(counts([{ kind: 'COUNT', min: 2, max: null }, { kind: 'COUNT', min: 1, max: 3, preferred: true }])?.candidates, [2, 3])
    assert.deepEqual(counts([{ kind: 'COUNT', min: 1, max: 2 }, { kind: 'COUNT', min: 1, max: 5, preferred: true }])?.candidates, [1, 2])
    assert.deepEqual(counts([{ kind: 'COUNT', min: 4, max: null }, PREFERRED_1_TO_2])?.candidates, [], 'a preference wholly outside the requirement offers nothing')

    assert.equal(counts([REQUIRED_FLOOR]), null, 'no authored preference: nothing to prefer')
    assert.equal(counts([REQUIRED_FLOOR, { kind: 'COUNT', min: 1, max: null, preferred: true }]), null, 'a preference with no upper end is not a finite set to look in')
    assert.equal(counts([{ kind: 'COUNT', min: 0.15, max: 0.25, fractionOfAxis: true }, { kind: 'COUNT', min: 6, max: 10, preferred: true }]), null, 'a fraction of an axis is an extent, not a count')
    assert.equal(counts([{ kind: 'COUNT', min: 1.5, max: 4, preferred: true }]), null, 'nor is a range whose ends are not whole numbers')
    assert.equal(counts([PREFERRED_1_TO_2, { kind: 'QUALITATIVE', term: 'a few' }]), null, 'a line also bounded in words is not settled by counting')
    assert.equal(counts([PREFERRED_1_TO_2], [1, 2]), null, 'and stated alternatives are a decision whatever else is on the line')
    // An exclusion is not a bound on what the count may be, so it neither blocks the rule nor feeds it.
    assert.deepEqual(counts([REQUIRED_FLOOR, PREFERRED_1_TO_2, { kind: 'COUNT', min: 5, max: 9, forbidden: true }])?.candidates, [1, 2])
})

// ---------------------------------------------------------------------------------------------
// A default never overrides a choice, and is checked and recorded like one.
// ---------------------------------------------------------------------------------------------

test('an explicit choice always wins, and a default for a line that is not open is never looked at', () => {
    const resolved = game(line('L-x', { bounds: [{ kind: 'SET', members: ['a', 'b'] }] }))
    const stray: JustifiedDefault[] = [
        { lineId: 'L-x', value: 'b', because: 'a default', rule: 'ONLY_MEMBER_OF_AUTHORED_BOUND' },
        { lineId: 'L-not-in-this-game', value: 'anything', because: 'a default for another game', rule: 'ONLY_MEMBER_OF_AUTHORED_BOUND' },
    ]
    const realized = realize(resolved, [{ lineId: 'L-x', value: 'a', because: 'somebody decided' }], [], undefined, undefined, stray)
    if (isRefused(realized)) return assert.fail(`refused: ${realized.because.join('; ')}`)
    assert.deepEqual(realized.record.choices.map(c => [c.lineId, c.value, c.defaultedBy]), [['L-x', 'a', undefined]], 'the choice stands, unmarked, and nothing else was closed')

    // The same stray entry as a CHOICE is refused, which is exactly why defaults are a separate input.
    const asChoice = realize(resolved, [{ lineId: 'L-x', value: 'a', because: 'x' }, { lineId: 'L-not-in-this-game', value: 'anything', because: 'x' }])
    assert.ok(isRefused(asChoice) && /does not list this line as open/.test(asChoice.because[0]))

    // And the helper offers nothing for a line somebody has already closed.
    const single = game(line('L-w', { bounds: [{ kind: 'SET', members: ['full width'] }] }))
    assert.deepEqual(justifiedDefaults(single, [{ lineId: 'L-w', value: 'full width', because: 'chosen' }]), [])
})

test('a default is recorded as a choice — with its rule, its reason, and what it was closed within', () => {
    const bound = { kind: 'SET', members: ['full width'], preferred: true }
    const resolved = game(line('L-w', { bounds: [bound] }))
    const defaults = justifiedDefaults(resolved, [])
    const realized = realize(resolved, [], [], undefined, undefined, defaults) as Realized
    assert.equal(realized.outcome, 'REALIZED')
    assert.deepEqual(realized.record.choices, [
        {
            lineId: 'L-w',
            value: 'full width',
            because: defaults[0].because,
            path: 'space.L-w',
            authority: null,
            boundCheck: 'WITHIN_PERMITTED_SET',
            within: { permitted: null, bounds: [bound] },
            closure: 'ONLY_VALUE',
            defaultedBy: 'ONLY_MEMBER_OF_AUTHORED_BOUND',
        },
    ])
    assert.equal((realized.game as any).space['L-w'], 'full width')

    // The audit stamp covers the defaults: the same game closed by a different default is a different realization.
    const other = realize(resolved, [], [], undefined, undefined, [{ ...defaults[0], because: 'another reason' }]) as Realized
    assert.notEqual(other.record.realizationDigest, realized.record.realizationDigest)
    // And a run given none stamps exactly as it did before defaults existed.
    const plain = game(line('L-w', { permitted: ['a', 'b'] }))
    const chosen = [{ lineId: 'L-w', value: 'a', because: 'x' }]
    assert.equal((realize(plain, chosen) as Realized).record.realizationDigest, (realize(plain, chosen, [], undefined, undefined, []) as Realized).record.realizationDigest)
})

test('a default passes every check a choice passes, and two defaults for one line are refused', () => {
    const resolved = game(line('L-count', { bounds: [{ kind: 'COUNT', min: 1, max: 3 }] }))
    const outside = realize(resolved, [], [], undefined, undefined, [{ lineId: 'L-count', value: 9, because: 'a wrong rule', rule: 'ONLY_PREFERRED_COUNT_THE_ROSTER_ADMITS' }])
    assert.ok(isRefused(outside) && /above the authored maximum 3/.test(outside.because[0]), 'a default outside the bound is refused like any value outside it')

    const twice = realize(resolved, [], [], undefined, undefined, [
        { lineId: 'L-count', value: 1, because: 'one answer', rule: 'ONLY_PREFERRED_COUNT_THE_ROSTER_ADMITS' },
        { lineId: 'L-count', value: 2, because: 'another', rule: 'ONLY_PREFERRED_COUNT_THE_ROSTER_ADMITS' },
    ])
    assert.ok(isRefused(twice) && /2 defaults were offered for one line/.test(twice.because[0]))
})

/**
 * **`realize` holds a default to its rule; it does not take one on the producer's word.** Added in the
 * review of 13 October 2026.
 *
 * Measured before this, on the possession game with the scoring modifier: with the target's noun withheld,
 * a default of `zone` handed to `realize` under `ONLY_MEMBER_OF_AUTHORED_BOUND` REALIZED, and the record
 * said a rule had closed a line that holds two design alternatives (`closure: CHOSEN_AMONG_ALTERNATIVES`,
 * `defaultedBy: ONLY_MEMBER_OF_AUTHORED_BOUND`). The same for who starts with the ball, and for the scoring
 * kind under the count rule. `justifiedDefaults` produces none of those, so nothing served was wrong — but
 * "a default never closes an alternative set or a coach's row" was true of one caller and not of the
 * realizer. It is true of the realizer now, and a refused default leaves the line refused.
 */
test('realize refuses a default its rule does not earn — an alternative set, a coach row, the wrong rule, the wrong value', () => {
    const offered = (open: OpenChoice, value: unknown, rule: JustifiedDefault['rule']) =>
        realize(game(open), [], [], undefined, undefined, [{ lineId: open.lineId, value, because: 'handed in', rule }])
    const refusedFor = (open: OpenChoice, value: unknown, rule: JustifiedDefault['rule'], why: RegExp, what: string) => {
        const result = offered(open, value, rule)
        assert.ok(isRefused(result), `${what}: must not realize`)
        assert.equal(result.because.length, 1, `${what}: ${JSON.stringify(result.because)}`)
        assert.match(result.because[0], why, what)
        assert.match(result.because[0], /anything else is a decision, and needs a choice/, what)
    }
    const only = 'ONLY_MEMBER_OF_AUTHORED_BOUND' as const
    const count = 'ONLY_PREFERRED_COUNT_THE_ROSTER_ADMITS' as const

    refusedFor(line('L-noun', { permitted: ['zone', 'line'] }), 'zone', only, /offered under ONLY_MEMBER_OF_AUTHORED_BOUND.*it holds a set of alternatives/, 'a design alternative')
    refusedFor(line('L-two', { bounds: [{ kind: 'SET', members: ['a', 'b'] }] }), 'a', only, /do not come to exactly one member/, 'alternatives carried as a bound')
    refusedFor(line('L-holder', { bounds: [{ kind: 'QUALITATIVE', term: 'one of the participating opposing teams' }] }), 'K-teams#1', only, /do not come to exactly one member/, "the coach's row")
    refusedFor(line('L-free', {}), 'anything', only, /do not come to exactly one member/, 'an unbounded line')
    refusedFor(line('L-pref', { bounds: [{ kind: 'SET', members: ['a', 'b'], preferred: false }, { kind: 'SET', members: ['a'], preferred: true }] }), 'a', only, /do not come to exactly one member/, 'a preferred member of required alternatives')

    // The count rule, on a line that is not its subject, and for a value that is not one it yields.
    refusedFor(line('L-kind', { permitted: ['line_crossed', 'target_zone_entered'] }), 'line_crossed', count, /not a whole-number count with an authored preferred range/, 'alternatives under the count rule')
    refusedFor(line('L-count', { bounds: [{ kind: 'COUNT', min: 1, max: 3 }] }), 2, count, /not a whole-number count with an authored preferred range/, 'a required range with no preference: inside the bound, and still not defaultable')
    refusedFor(line('L-neutrals', { bounds: [REQUIRED_FLOOR, PREFERRED_1_TO_2] }), 3, count, /3 is not a whole number inside both the preferred range 1 to 2 and what is required/, 'inside the requirement, outside the preference')
    // A rule that does not exist closes nothing.
    refusedFor(line('L-w', { bounds: [{ kind: 'SET', members: ['full width'] }] }), 'full width', 'BECAUSE_IT_IS_CONVENIENT' as any, /it names no rule there is/, 'a made-up rule')

    // What each rule DOES yield is still taken — the check refuses the unearned, not the default.
    for (const [open, value, rule] of [
        [line('L-w', { bounds: [{ kind: 'SET', members: ['full width'], preferred: true }] }), 'full width', only],
        [line('L-neutrals', { bounds: [REQUIRED_FLOOR, PREFERRED_1_TO_2] }), 2, count],
    ] as const) {
        const result = offered(open, value, rule)
        if (isRefused(result)) return assert.fail(`refused: ${result.because.join('; ')}`)
        assert.deepEqual(result.record.choices.map(c => [c.value, c.defaultedBy]), [[value, rule]])
    }
})

test('on the corpus: a default handed in for a design alternative, the scoring kind or who starts is refused, for that line and no other', () => {
    const { resolved, supplied, index, envelope, ctx } = pathway(['GF2', 'tl-v0-constraint-wide-zone-advantage'])
    const real = justifiedDefaultsOnPathway(resolved, supplied, index, envelope, ctx)
    const forged: [string, unknown, JustifiedDefault['rule']][] = [
        ['c:restated:GF2:GF2-03.e::S3', 'zone', 'ONLY_MEMBER_OF_AUTHORED_BOUND'],
        ['game::V1', 'line_crossed', 'ONLY_PREFERRED_COUNT_THE_ROSTER_ADMITS'],
        ['game::PS1', 'c:restated:GF2:GF2-14.a#2', 'ONLY_MEMBER_OF_AUTHORED_BOUND'],
    ]
    for (const [lineId, value, rule] of forged) {
        const withheld = supplied.choices.filter(c => c.lineId !== lineId)
        assert.equal(withheld.length, supplied.choices.length - 1, `${lineId} is one of the four real decisions`)
        const result = realize(resolved, withheld, supplied.instantiations, index, envelope, [...real, { lineId, value, because: 'handed in', rule }])
        assert.ok(isRefused(result), `${lineId} must not be closed by a default`)
        assert.equal(result.because.length, 1, JSON.stringify(result.because))
        assert.ok(result.because[0].startsWith(`${lineId}: a default was offered under ${rule}, and that rule does not close this line`), result.because[0])
    }
})

// ---------------------------------------------------------------------------------------------
// On the corpus, through the pathway's own calls.
// ---------------------------------------------------------------------------------------------

/** The chain for a named set of knowledge objects, as a mechanism demonstration composes one. */
function pathway(ids: string[], players?: number) {
    const entries = ids.map((id, i) => ({ id, role: i === 0 ? 'game form' : 'constraint' }))
    const selection = { selected: entries, ...contractCoverage(entries) }
    const input = derivationInputFor(selection)
    if (players !== undefined) (input.envelope as Record<string, unknown>).players = players
    const result = runDerivation(input)
    if (isStampedHalt(result)) throw new Error('unexpected halt')
    const staged: any = runStages0to10(input)
    const index = indexRegister(input.register)
    const resolved = assembleResolvedGame(result, staged.classes, index, input.contracts)
    const supplied = suppliedRealizationFor(selection)
    if (isNoSuppliedRealization(supplied)) throw new Error(`no realization input for ${supplied.missingFor}`)
    return { resolved, supplied, index, envelope: input.envelope as any, ctx: { ...staged.gateContext, contracts: input.contracts } as any }
}

/**
 * **Baseline of 13 October 2026.** The possession game form with Wide Zone Advantage leaves eight lines
 * open. Four have one permitted value each and are closed by rule 1 — and the choices files no longer hold
 * them. The other four are three design alternatives and the coach's, and each still needs its entry.
 */
test('possession game + Wide Zone: four lines closed by rule, four still decided by an entry', () => {
    const { resolved, supplied, index, envelope, ctx } = pathway(['GF2', 'tl-v0-constraint-wide-zone-advantage'])
    assert.equal(resolved.open.length, 8)
    const defaults = justifiedDefaultsOnPathway(resolved, supplied, index, envelope, ctx)
    assert.deepEqual(
        defaults.map(d => [d.lineId, d.rule]).sort(),
        [
            ['c:restated:GF2:GF2-03.e::S6', 'ONLY_MEMBER_OF_AUTHORED_BOUND'],
            ['c:restated:GF2:GF2-03.f::S6', 'ONLY_MEMBER_OF_AUTHORED_BOUND'],
            ['c:restated:WIDE-ZONE-ADVANTAGE:WIDEZONE-02.a::S5', 'ONLY_MEMBER_OF_AUTHORED_BOUND'],
            ['c:restated:WIDE-ZONE-ADVANTAGE:WIDEZONE-03::S5', 'ONLY_MEMBER_OF_AUTHORED_BOUND'],
        ],
    )
    assert.deepEqual(
        supplied.choices.map(c => c.lineId).sort(),
        ['c:restated:GF2:GF2-03.e::S3', 'c:restated:GF2:GF2-03.f::S3', 'game::PS1', 'game::V1'],
        'what the files still hold is exactly what a rule may not close',
    )

    const { realization } = realizeWithJustifiedDefaults(resolved, supplied, index, envelope, ctx)
    if (isRefused(realization)) return assert.fail(`refused: ${realization.because.join('; ')}`)
    assert.deepEqual(checkRealization(resolved, realization), { nothingClosedWithoutAuthority: [], nothingLost: [], nothingInvented: [] })
    // The values are the ones the pruned entries used to write out by hand.
    const closed = Object.fromEntries(realization.record.choices.filter(c => c.defaultedBy).map(c => [c.lineId.split('::').pop(), c.value]))
    assert.deepEqual(closed, { S6: 'extends across the axis: the target lies across the direction of progression', S5: 'the full axis extent, end line to end line' })

    // TEETH — take away any one of the four real decisions and the game is refused for that line and no other.
    for (const withheld of supplied.choices) {
        const fewer = { ...supplied, choices: supplied.choices.filter(c => c !== withheld) }
        const refused = realizeWithJustifiedDefaults(resolved, fewer, index, envelope, ctx).realization
        assert.ok(isRefused(refused), `${withheld.lineId} must not be closed by any rule`)
        assert.deepEqual(refused.because, [`${withheld.lineId} is open and was not chosen: a concrete game leaves no freedom unclosed`])
    }
})

/**
 * **The neutral count is the one line in the corpus rule 2 is for** — at least 1 required, 1 to 2 preferred.
 *
 * **MOVED 13 October 2026 (Stage B3), as the note that stood here said it would.** Until then this block
 * asserted that NO neutral count was defaulted, and said why: rule 2 asks the roster rule whether each
 * candidate leaves whole equal teams, and the roster rule could not see a count realization had chosen — it
 * read the line from the derived context, found nothing settled, and refused every candidate alike. A count
 * was not defaulted on the strength of a rule that could not be asked. The roster rule now reads the chosen
 * count (`assemble-concrete-game`), so it can be asked, and for a given session exactly one candidate is
 * admitted: with equal teams required, an even squad admits 2 and not 1, an odd squad 1 and not 2.
 *
 * Nothing about the rule changed, and nothing about what it refuses to close: a session that admits neither
 * candidate still gets no default.
 */
test('possession game + neutral players: the one preferred count the roster admits is where the activity starts', () => {
    for (const [players, starts, other] of [[12, 2, 1], [13, 1, 2], [8, 2, 1], [15, 1, 2], [3, 1, 2]] as const) {
        const { resolved, supplied, index, envelope, ctx } = pathway(['GF2', 'tl-v0-constraint-neutral-player-condition'], players)
        const open = resolved.open.find(o => o.lineId === 'game::P5')!
        assert.deepEqual(preferredCounts(open)?.candidates, [1, 2], 'the authored preference, inside the authored requirement')

        const [count] = justifiedDefaultsOnPathway(resolved, supplied, index, envelope, ctx).filter(d => d.lineId === 'game::P5')
        assert.deepEqual([count?.value, count?.rule], [starts, 'ONLY_PREFERRED_COUNT_THE_ROSTER_ADMITS'], `${players} players`)
        assert.ok(count.because.includes(`${starts} is the only one for which this session's roster comes out whole (${other} does not)`), count.because)
        assert.ok(count.because.includes('as a STARTING value') && count.because.includes('not where it must stay'), 'and it is recorded as where the activity starts')

        const { realization, stranded } = realizeWithJustifiedDefaults(resolved, supplied, index, envelope, ctx)
        if (isRefused(realization)) return assert.fail(`${players} players refused: ${realization.because.join('; ')}`)
        assert.deepEqual(stranded, [])
        assert.deepEqual(checkRealization(resolved, realization), { nothingClosedWithoutAuthority: [], nothingLost: [], nothingInvented: [] })
        const recorded = realization.record.choices.find(c => c.lineId === 'game::P5')!
        assert.deepEqual([recorded.value, recorded.closure, recorded.defaultedBy, recorded.boundCheck], [starts, 'STARTING_VALUE_IN_RANGE', 'ONLY_PREFERRED_COUNT_THE_ROSTER_ADMITS', 'WITHIN_COUNT'])
        assert.deepEqual(recorded.within.bounds.map(b => [b.min, b.max, !!b.preferred]), [[1, null, false], [1, 2, true]], 'the range it was closed within stays beside it')
    }
})

/**
 * **A session no preferred count fits gets NO default — and the caller is told it is the session.**
 *
 * With two players, one neutral leaves one for two teams and two neutrals leave nobody; with one player both
 * leave nobody. Neither candidate is admitted, so rule 2 closes nothing and the line is refused as open and
 * unchosen, exactly as before. What is new is `stranded`: the roster rule's own cause for each candidate, so
 * a caller can say the numbers do not fit rather than that a set-up decision is missing. An explicit choice
 * still wins and is never second-guessed here.
 */
test('possession game + neutral players: a session that fits no preferred count is left open, with the roster\'s cause for each candidate', () => {
    for (const [players, causes] of [[2, ['DOES_NOT_DIVIDE', 'NO_OUTFIELD_PLAYERS']], [1, ['NO_OUTFIELD_PLAYERS', 'NO_OUTFIELD_PLAYERS']]] as const) {
        const { resolved, supplied, index, envelope, ctx } = pathway(['GF2', 'tl-v0-constraint-neutral-player-condition'], players)
        assert.ok(!justifiedDefaultsOnPathway(resolved, supplied, index, envelope, ctx).some(d => d.lineId === 'game::P5'), `${players} players: no neutral count is defaulted`)
        const { realization, stranded } = realizeWithJustifiedDefaults(resolved, supplied, index, envelope, ctx)
        assert.ok(isRefused(realization))
        assert.deepEqual(realization.because, ['game::P5 is open and was not chosen: a concrete game leaves no freedom unclosed'])
        assert.deepEqual(stranded.map(s => [s.lineId, s.path, s.candidates, s.admitted]), [['game::P5', 'performers.neutrals.count', [1, 2], []]])
        assert.deepEqual(stranded[0].refusals.map(r => r.cause), causes, `${players} players`)
    }

    // A count somebody chose is not a count rule 2 looked at, so nothing is reported as stranded for it —
    // even where the roster then refuses it. That refusal is assembly's, with its own cause.
    const { resolved, supplied, index, envelope, ctx } = pathway(['GF2', 'tl-v0-constraint-neutral-player-condition'], 12)
    const chosen = { ...supplied, choices: [...supplied.choices, { lineId: 'game::P5', value: 1, because: 'a test' }] }
    const { realization, stranded, defaults } = realizeWithJustifiedDefaults(resolved, chosen, index, envelope, ctx)
    assert.ok(!isRefused(realization), 'one neutral is inside the authored bound, so realization takes it')
    assert.deepEqual(stranded, [])
    assert.ok(!defaults.some(d => d.lineId === 'game::P5'), 'and an explicit choice is never replaced by a default')
})

test('the choices files hold no entry a rule would close', () => {
    const index = JSON.parse(fs.readFileSync(path.join(AUDITS_DIR, 'realization-choices-index.json'), 'utf8')).byKnowledgeObject as Record<string, string>
    assert.deepEqual(JSON.parse(fs.readFileSync(path.join(AUDITS_DIR, index['WIDE-ZONE-ADVANTAGE']), 'utf8')).choices, [], 'everything this object left open had one permitted value')
    const { resolved, supplied } = pathway(['GF2', 'tl-v0-constraint-wide-zone-advantage'])
    const byRule = new Set(justifiedDefaults(resolved, []).map(d => d.lineId))
    assert.deepEqual(supplied.choices.filter(c => byRule.has(c.lineId)), [], 'an entry for a line with one permitted value is a decision nobody is making')
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
    console.error(`justified-defaults: ${failed} of ${tests.length} failed`)
    process.exit(1)
}
console.log(`justified-defaults: ${tests.length} passed`)
