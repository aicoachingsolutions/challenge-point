/**
 * Every bound says how binding it is — a requirement, a preference, or an exclusion.
 *
 * Christian, 13 October 2026: *"I agree with preserving authored ranges, selected starting values,
 * alternatives, and the reasons for those selections throughout realization and communication."* That can
 * only be done if the bound keeps its status where it is made, and three of the five shapes `boundsOf`
 * produces did not say. Measured on the corpus before this file existed:
 *
 *   - eight bounds from `PREFERRED_DEFAULT` items carried no flag at all, so nothing downstream could tell
 *     a preferred value from a required one — the target's across-extent and both channels' along-extent
 *     among them;
 *   - an `EXCLUSION` item was shaped as `{ kind: 'SET', members }`, which is the shape of a PERMITTED set.
 *     The scoring kind carries one beside its permitted alternatives, the channels' functions carry one, and
 *     the neutral affiliation carries two.
 *
 * These are read off real resolved games rather than off the function, because a bound is only proved by
 * arriving: it is `resolved.open[].bounds` and `resolved.extentBounds` that realization, rendering and any
 * later adjustment actually receive.
 *
 * Run: npm test
 */
import assert from 'node:assert/strict'

import { isStampedHalt } from './emit'
import { runDerivation, runStages0to10 } from './engine'
import { indexRegister } from './register'
import { assembleResolvedGame, ResolvedGame } from './resolved-game'
import { contractCoverage, derivationInputFor } from './run-bounded-selection'
import { Bounds } from './types'

function resolvedFor(ids: string[], alter?: (contracts: any[]) => void): ResolvedGame {
    const entries = ids.map((id, i) => ({ id, role: i === 0 ? 'game form' : 'constraint' }))
    const input = derivationInputFor({ selected: entries, ...contractCoverage(entries) })
    if (alter) {
        // The loader returns SHARED contract objects, so knowledge altered for a test is altered on a copy.
        input.contracts = JSON.parse(JSON.stringify(input.contracts))
        alter(input.contracts as any[])
    }
    const result = runDerivation(input)
    if (isStampedHalt(result)) throw new Error('unexpected halt')
    return assembleResolvedGame(result, (runStages0to10(input) as any).classes, indexRegister(input.register), input.contracts)
}

const openBounds = (resolved: ResolvedGame, lineId: string): Bounds[] => (resolved.open.find(o => o.lineId === lineId)?.bounds ?? []) as Bounds[]
const beside = (resolved: ResolvedGame, lineId: string): Bounds[] => (resolved.extentBounds[lineId] ?? []) as Bounds[]
const every = (resolved: ResolvedGame): Bounds[] => [...resolved.open.flatMap(o => o.bounds as Bounds[]), ...Object.values(resolved.extentBounds).flat()] as Bounds[]

const wideZone = resolvedFor(['GF2', 'tl-v0-constraint-wide-zone-advantage'])
const neutrals = resolvedFor(['GF2', 'tl-v0-constraint-neutral-player-condition'])

// ── Every bound states whether it is preferred; none is left to be guessed ────────────────────────
for (const [name, resolved] of [['possession + Wide Zone', wideZone], ['possession + neutrals', neutrals]] as const) {
    const bounds = every(resolved)
    assert.ok(bounds.length > 0, `${name}: there must be bounds to make a claim about`)
    for (const bound of bounds) {
        assert.equal(typeof bound.preferred, 'boolean', `${name}: a bound must say whether it is a preference — ${JSON.stringify(bound)}`)
        // Present only where true, so a bound that is not an exclusion reads exactly as it did.
        assert.notEqual(bound.forbidden, false, `${name}: \`forbidden\` is stated only where it holds — ${JSON.stringify(bound)}`)
    }
}

// ── A preferred default is marked preferred on EVERY shape, not only the two that used to say ─────
{
    // A SET: the target's across-extent and each channel's along-extent are assumed preferred defaults.
    for (const lineId of ['c:restated:GF2:GF2-03.e::S6', 'c:restated:GF2:GF2-03.f::S6']) {
        assert.deepEqual(openBounds(wideZone, lineId), [{ kind: 'SET', members: ['extends across the axis: the target lies across the direction of progression'], preferred: true }])
    }
    for (const lineId of ['c:restated:WIDE-ZONE-ADVANTAGE:WIDEZONE-02.a::S5', 'c:restated:WIDE-ZONE-ADVANTAGE:WIDEZONE-03::S5']) {
        assert.deepEqual(openBounds(wideZone, lineId), [{ kind: 'SET', members: ['the full axis extent, end line to end line'], preferred: true }])
    }

    // A typed count and a relative term already said; they still do, and a REQUIREMENT says false.
    assert.deepEqual(beside(wideZone, 'c:restated:WIDE-ZONE-ADVANTAGE:WIDEZONE-02.a::S6'), [
        { kind: 'COUNT', min: 6, max: 10, term: 'across-interval width about 6-10 m', preferred: true },
        { kind: 'COUNT', min: 0.15, max: 0.25, term: 'bounded minority (of an axis)', fractionOfAxis: true, preferred: false },
    ])
    assert.deepEqual(openBounds(neutrals, 'game::P5'), [
        { kind: 'COUNT', min: 1, max: null, term: '>= 1 (no authored maximum)', preferred: false },
        { kind: 'COUNT', min: 1, max: 2, term: '1-2 (one or two)', preferred: true },
    ])

    // A term in words: the initial holder's bound is a requirement, and says so.
    const [holder] = openBounds(wideZone, 'game::PS1')
    assert.equal(holder.kind, 'QUALITATIVE')
    assert.equal(holder.preferred, false)
}

/**
 * ── A PARSED count keeps its status too — and stops being enforced as a ceiling ───────────────────
 *
 * The one shape the corpus does not exercise today, so it is shown on a copy: the neutral preference with
 * its typed bound taken away and its number left in words the parser can read. Before this the result was
 * `{ kind: 'COUNT', min: 1, max: 2 }` — no flag — so realization enforced a PREFERRED 1 to 2 as a hard
 * maximum, which is the conversion his typing ruling of 29 September was written to prevent (*"intersecting
 * the two to [1,2] would turn a preference into a hard ceiling the knowledge never states"*).
 */
{
    const parsed = resolvedFor(['GF2', 'tl-v0-constraint-neutral-player-condition'], contracts => {
        const item = contracts.flatMap(c => c.items ?? []).find((i: any) => i.itemId === 'NEUTRAL-02.a')
        assert.ok(item, 'the preferred neutral count must be in the selected contracts')
        delete item.typedBound
        item.value = 'minimum: 1, maximum: 2'
    })
    assert.deepEqual(openBounds(parsed, 'game::P5')[1], { kind: 'COUNT', min: 1, max: 2, term: 'minimum: 1, maximum: 2', preferred: true }, 'the authored words travel beside the parsed number')
}

// ── An exclusion is marked forbidden wherever it lands, and is never a plain permitted set ────────
{
    const forbidden = (bounds: Bounds[]) => bounds.filter(b => b.forbidden)

    // Beside the scoring kind's permitted alternatives, on an OPEN line.
    const kind = openBounds(wideZone, 'game::V1')
    assert.deepEqual(kind, [
        { kind: 'SET', members: ['{consecutive-pass count, keep-away, time-in-possession} (forbidden: retained possession alone as the scoring event)'], preferred: false, forbidden: true },
    ])

    // Beside a derived value: a function the channels may not have, and an objective reference they may not be.
    for (const lineId of ['c:restated:WIDE-ZONE-ADVANTAGE:WIDEZONE-02.a::S4', 'c:restated:WIDE-ZONE-ADVANTAGE:WIDEZONE-03::S4', 'c:restated:GF2:GF2-08.c::J2', 'c:restated:GF2:GF2-08.e::J2']) {
        const bounds = beside(wideZone, lineId)
        assert.ok(bounds.length > 0 && forbidden(bounds).length === bounds.length, `${lineId}: ${JSON.stringify(bounds)}`)
    }
    assert.equal(forbidden(beside(neutrals, 'game::P6b')).length, 2, 'the two teams a neutral may not be affiliated with')

    // **By strictness and by nothing else.** The members are prose — some say "(forbidden …)" and some do
    // not — so the mark must never depend on reading them. Every bound whose text mentions the word is
    // marked, and the one that does not mention it is marked all the same.
    for (const bound of [...every(wideZone), ...every(neutrals)]) {
        const says = JSON.stringify(bound.members ?? bound.term ?? '').includes('forbidden')
        if (says) assert.equal(bound.forbidden, true, `an exclusion that reads as a permitted set: ${JSON.stringify(bound)}`)
    }
    assert.ok(
        beside(neutrals, 'game::P6b').some(b => b.forbidden && !JSON.stringify(b.members).includes('forbidden')),
        'and it is read from the item, not from its wording: DEFENDING_TEAM carries the mark without the word',
    )
    // A requirement or a preference is never marked.
    for (const lineId of ['c:restated:GF2:GF2-03.e::S6', 'game::PS1']) assert.equal(forbidden(openBounds(wideZone, lineId)).length, 0)
}

console.log('bound-status.unit.ts — ok')
