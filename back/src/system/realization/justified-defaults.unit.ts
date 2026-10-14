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
    assert.match(defaults[0].because, /exactly one member/, 'the reason states the rule, not a preference for the value')

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

// ---------------------------------------------------------------------------------------------
// On the corpus, through the pathway's own calls.
// ---------------------------------------------------------------------------------------------

/** The chain for a named set of knowledge objects, as a mechanism demonstration composes one. */
function pathway(ids: string[]) {
    const entries = ids.map((id, i) => ({ id, role: i === 0 ? 'game form' : 'constraint' }))
    const selection = { selected: entries, ...contractCoverage(entries) }
    const input = derivationInputFor(selection)
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
 * **The neutral count is NOT defaulted yet, and that is deliberate — this block moves in Stage B3.**
 *
 * It is the one line in the corpus rule 2 is for: at least 1 required, 1 to 2 preferred. Rule 2 asks the
 * roster rule whether each candidate leaves whole equal teams, and today the roster rule cannot see a
 * neutral count that realization chose — it reads the line from the derived context, finds nothing settled,
 * and refuses every candidate alike. So no candidate is admitted and no default is produced, which is the
 * honest outcome: a count is not defaulted on the strength of a rule that could not be asked. When the
 * roster rule reads the chosen count (B3), exactly one candidate will be admitted for a given session and
 * this assertion changes to that value.
 */
test('possession game + neutral players: the count is put to the roster, and is not defaulted while the roster cannot answer', () => {
    const { resolved, supplied, index, envelope, ctx } = pathway(['GF2', 'tl-v0-constraint-neutral-player-condition'])
    const open = resolved.open.find(o => o.lineId === 'game::P5')!
    assert.deepEqual(preferredCounts(open)?.candidates, [1, 2], 'the authored preference, inside the authored requirement')

    const defaults = justifiedDefaultsOnPathway(resolved, supplied, index, envelope, ctx)
    assert.ok(!defaults.some(d => d.lineId === 'game::P5'), 'no neutral count is defaulted')
    const refused = realizeWithJustifiedDefaults(resolved, supplied, index, envelope, ctx).realization
    assert.ok(isRefused(refused))
    assert.deepEqual(refused.because, ['game::P5 is open and was not chosen: a concrete game leaves no freedom unclosed'])
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
