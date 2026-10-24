/**
 * **The Sport Profile, and the two halves of SD-44's chain.** Christian's authorizations of 6 October.
 *
 *   > *Authorize the minimal Soccer Sport Profile using the already-intended Sport Profile ownership and the
 *   > existing contribution-contract pathway. Establish only: the game's functional object is a ball; the
 *   > possession relationship is a valid team-valued relationship involving that ball and the participating
 *   > opposing teams, sufficient for the bounds.*
 *
 *   > *Authorize a bounds-only contribution establishing the possession relationship as legitimate game
 *   > structure over the participating opposing teams, while leaving its initial holder as a governed
 *   > realization choice. Do not arbitrarily author an initial team.*
 *
 *   > *Where a transition is keyed on `POSSESSION_CHANGE`, the relevant possession relationship must be
 *   > established or legitimately OPEN. The ball alone must therefore no longer make `POSSESSION_CHANGE`
 *   > reachable.*
 *
 * **What this file is for.** Three of those four sentences are negative — they say what the profile must NOT
 * do — and a negative is the kind of requirement an implementation satisfies on the day it is written and
 * loses quietly afterwards. So each one is pinned as something a run can contradict:
 *
 *   - bounds-only is asserted on the derived record's own shape, not on the artefact's prose about itself;
 *   - "do not author an initial team" is asserted as the absence of any entailed or narrowed value;
 *   - "the ball alone must no longer suffice" is asserted by a CONTROL that removes the relation and keeps
 *     the ball, and the mirror control removes the ball and keeps the relation. Both must fail, each on its
 *     own clause. A chain that only ever runs intact is indistinguishable from the collapsed version it
 *     replaced — that is exactly how the abbreviated `trigger → ball` reading survived for a week.
 *
 * Run: npm test
 */
import assert from 'node:assert/strict'

import fs from 'node:fs'
import path from 'node:path'

import { buildActivityFromKnowledge, buildActivityWithFixture } from '../rendering/build-activity'
import { CONFORMANCE_DIR, loadSportCoachVocabulary, loadSportDefaultLaws, loadSportProfile, readJson, validateSportCoachVocabulary } from './corpus'
import { runDerivation, runStages0to10 } from './engine'
import { indexRegister } from './register'
import { assembleResolvedGame } from './resolved-game'
import { derivationInputFor, selectFor } from './run-bounded-selection'
import { DerivationInput } from './types'

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

const BALL_ITEM = 'SPORT-SOCCER-01'
const RELATION_ITEM = 'SPORT-SOCCER-02'

const selection = selectFor('A04', null)
const base = derivationInputFor(selection)

/** The same derivation with one profile item removed — the knowledge is otherwise untouched. */
function without(itemId: string): DerivationInput {
    return { ...base, contracts: base.contracts.map(c => ({ ...c, items: c.items.filter(i => (i as any).itemId !== itemId) })) }
}

const reachableOf = (input: DerivationInput) => {
    const result: any = runDerivation(input)
    const check = (result.gates?.gateA?.checks || []).find((c: any) => c.checkId === 'GA-TRIGGER-REACHABLE')
    assert.ok(check, 'GA-TRIGGER-REACHABLE must be reported on every run')
    return { gateA: String(result.gates.gateA.verdict), check, clauses: check.clauses as any[] }
}

const TRIGGER_CLAUSE = 0
const RELATION_CLAUSE = 1

// ── The layer: one profile, discovered rather than named ──────────────────────────────────────────

/**
 * The engine must not know which sport it is deriving. `loadSportProfile` finds the profile by pattern in the
 * knowledge directory, so the sport's identity lives in the artefact; the sport-coupling ratchet caught the
 * first version of this, which had the filename written into `corpus.ts`.
 */
test('exactly one Sport Profile is discovered, and it names itself', () => {
    const profiles = loadSportProfile()
    assert.equal(profiles.length, 1, 'more than one would make the sport a sort order rather than a decision')
    const [profile] = profiles
    assert.equal(profile.contractId, profile.objectId, 'the contract is identified by the object it contributes to')
    assert.ok(/^sport-profile:/.test(profile.contractId), `a Sport Profile object id, got ${profile.contractId}`)
    // Restated 23 October 2026 (H2, the d26 design's build step 2): still exactly these two items. His reply filed 26 October 2026, item 10,
    // names the Laws of the Game as the default - "The normal Laws of the Game should apply by default wherever they are applicable, unless an
    // activity introduces an explicit, knowledge-authorized modification." - and the profile carries that as a declaration block beside its
    // contribution (defaultLaws, default-laws.unit.ts), never as items: no law is authored as a line of the game.
    assert.deepEqual(
        profile.items.map(i => (i as any).itemId).sort(),
        [BALL_ITEM, RELATION_ITEM],
        'the profile is minimal: his ruling authorized exactly these two structural facts; the Laws are named as the default (defaultLaws), never authored as items',
    )
    const defaultLaws = loadSportDefaultLaws()
    assert.ok(defaultLaws && defaultLaws.laws.length > 0, 'the default-laws block loads beside the contribution')
    assert.ok(!profile.items.some(item => 'departsFrom' in (item as any)) && !JSON.stringify(profile).includes('LAW-'), 'and nothing of it is a contribution item')
})

/**
 * **Constitutive, not selected.** A05-style selection chooses a game form and constraints; it never chooses
 * the sport. The profile must therefore reach derivation unconditionally — and it must also appear in
 * `selection`, because a contract present only in `contracts` still forms its elements but loses its entry in
 * `versions.objects`, the stamp that lets a stored result be known stale.
 */
test('the Sport Profile reaches derivation without being selected, and is stamped', () => {
    const id = loadSportProfile()[0].objectId
    assert.ok(
        !selection.selected.some(s => s.id === id),
        'nothing in the live selection asks for a sport; if it ever does, this test is the wrong shape',
    )
    assert.ok(base.contracts.some(c => c.contractId === id), 'but it is derived from')
    assert.ok((base.selection as any[]).some(s => s.objectId === id), 'and it is stamped in versions.objects')
})

// ── The ball: it exists, and it is nowhere ────────────────────────────────────────────────────────

/**
 * His boundary, ratified the same day: *"the ball belongs in the resolved representation when game rules key
 * on it. Its live position does not, because that position is game state rather than game structure."* So the
 * assertion is two-sided — the object is present AND carries no position. A ball that acquired a layout
 * position would pass a naive existence test while contradicting the ruling that admitted it.
 */
test('the ball exists in the resolved game and holds no position', () => {
    const staged: any = runStages0to10(base)
    const result: any = runDerivation(base)
    const game: any = assembleResolvedGame(result, staged.classes, indexRegister(base.register), base.contracts).game
    const balls = (game.objects || []).filter((o: any) => o.kind === 'ball')
    assert.equal(balls.length, 1, 'the profile establishes the functional object')
    assert.equal(balls[0].elementId, `c:sport-profile:soccer:${BALL_ITEM}`, 'and it is the profile that established it')
    // The key SET rather than a list of forbidden names. Object placement is emitted at `objects[].position`
    // (row O4) today, but a guard that enumerates the names it knows about is a guard that passes the day
    // someone emits placement under a different one. Anything new appearing on the ball should stop and be
    // looked at: that is the whole content of the boundary his ruling drew.
    assert.deepEqual(
        Object.keys(balls[0]).sort(),
        ['elementId', 'kind', 'selector'],
        'the ball carries its identity and nothing else; a new field here is a claim about game state',
    )
})

// ── The relation: bounded, and deliberately not resolved ──────────────────────────────────────────

/**
 * **Bounds-only is a property of the record, not of the fitNote.** `requirement: RANGE` sits outside the
 * entailing set, and the value is a qualitative term rather than an array, so the contribution can only land
 * in `bounding`. Asserting that here means a later change to `entails()` or `narrowsToSet()` that quietly
 * promoted this item — turning an authorized choice into a resolved value — fails loudly instead.
 */
test('the possession contribution bounds PS1 and entails nothing', () => {
    const staged: any = runStages0to10(base)
    const record = staged.derived.lines.get('game::PS1')
    assert.ok(record, 'PS1 must be derived at all — a missing line is not a passing test')
    assert.deepEqual(record.entailing, [], 'a bounds-only contribution entails nothing')
    assert.deepEqual(record.narrowing, [], 'and narrows to no set')
    assert.equal(record.narrowedTo, null, 'so there is no composed intersection to resolve from')
    assert.equal(record.bounding.length, 1, 'exactly the one contribution')
    assert.equal(record.bounding[0].item.itemId, RELATION_ITEM)
    assert.equal(record.bounding[0].bound.kind, 'QUALITATIVE', 'a term, which is why it cannot resolve the line')
})

/**
 * *"Do not arbitrarily author an initial team."* The relationship is established; who holds it is not. The
 * freedom cites SD-39, whose own qualification is what the bounds exist to satisfy: the property and its
 * choice space must already be supported, and silence authorizes nothing.
 */
test('no initial holder is authored: PS1 is an authorized freedom under SD-39', () => {
    const staged: any = runStages0to10(base)
    const record = staged.derived.lines.get('game::PS1')
    assert.ok(record.open, 'the line is open')
    assert.equal(record.open.authority, 'SD-39', 'the authority for OPEN, not the retired SD-R2')
    assert.match(String(record.open.choiceSpace), /teams the game establishes/, 'and the choice space is the established teams')
    assert.equal(String(staged.classified.get('game::PS1').verdict).startsWith('FREE'), true, 'so it classifies as a free choice')

    const profileText = JSON.stringify(loadSportProfile())
    for (const team of ['GF2-14.a', 'home', 'away', 'TEAM_A', 'teamA']) {
        assert.ok(!profileText.includes(team), `the profile must not name a team; it names ${team}`)
    }
})

// ── The chain, from both ends ─────────────────────────────────────────────────────────────────────

test('intact: both clauses of GA-TRIGGER-REACHABLE pass, and Gate A does not fail', () => {
    const { gateA, clauses } = reachableOf(base)
    assert.equal(clauses.length, 2, 'the chain is two clauses, reported separately (SD-53)')
    assert.equal(clauses[TRIGGER_CLAUSE].verdict, 'PASS')
    assert.equal(clauses[RELATION_CLAUSE].verdict, 'PASS')
    assert.notEqual(gateA, 'FAIL', `A04 must still reach realization; got ${gateA}`)
})

/**
 * **A passing clause must still show what it ranged over.** The first version of the relation clause read the
 * line directly and probed only on failure, so a PASSING report named no subject at all and there was no way to
 * tell from it whether the clause had run. The Probe's contract is explicit — every line a check consults is
 * recorded as a subject — and this is the assertion that keeps the clause visible when it is working, which is
 * the only time the omission would have gone unnoticed.
 */
test('the relation clause records PS1 as a subject when it PASSES, not only when it fails', () => {
    const { check } = reachableOf(base)
    assert.equal(check.verdict, 'PASS', 'this is the passing case')
    assert.ok(check.subjects.includes('game::PS1'), `a passing clause must still name what it read; got ${JSON.stringify(check.subjects)}`)
    assert.ok(check.pendingOn.includes('game::PS1'), 'and an open relation is pending on realization, which the report should say')
    assert.deepEqual(check.blockedBy, [], 'while nothing is blocked')
})

/**
 * **His sentence, as a control.** *"The ball alone must therefore no longer make `POSSESSION_CHANGE`
 * reachable."* The ball stays; the relation goes. The first clause still passes — stage 2 still constructs
 * the trigger, because its material prerequisites are still there — and the second one fails. If this ever
 * passes, the chain has been re-collapsed to `trigger → ball`.
 */
test('CONTROL — the ball alone does not make a possession change reachable', () => {
    const { gateA, check, clauses } = reachableOf(without(RELATION_ITEM))
    assert.equal(clauses[TRIGGER_CLAUSE].verdict, 'PASS', 'the material prerequisites are untouched')
    assert.equal(clauses[RELATION_CLAUSE].verdict, 'FAIL', 'but the relation the trigger changes is not in the game')
    assert.equal(check.verdict, 'FAIL')
    assert.equal(gateA, 'FAIL', 'and that is a blocking failure, not a deferral')
    assert.match(String(check.why), /possession relation NOT_AUTHORED/, 'the report says which half failed')
})

/**
 * The mirror. Without the ball, stage 2 does not construct POSSESSION_CHANGE at all, so the transition keyed
 * on it is unreachable and the FIRST clause fails while the relation clause passes. Together with the control
 * above this shows both halves carry weight: neither test alone is SD-44.
 */
test('CONTROL — the relation alone does not make a possession change reachable either', () => {
    const { gateA, check, clauses } = reachableOf(without(BALL_ITEM))
    assert.equal(clauses[TRIGGER_CLAUSE].verdict, 'FAIL', 'the trigger is never constructed without its carrier')
    assert.equal(clauses[RELATION_CLAUSE].verdict, 'PASS', 'while the relation itself is perfectly well established')
    assert.equal(check.verdict, 'FAIL')
    assert.equal(gateA, 'FAIL')
    assert.match(String(check.why), /POSSESSION_CHANGE/, 'and it names the transition that cannot fire')
})

// ── The sport's coach vocabulary (stage M4, 17 October 2026, design step L10) ───────────────────────────────

/**
 * His reply filed 19 October 2026, item 4: "I approve both of your proposed revisions:" ... Use "throw-in" rather than "with the ball in
 * hand." The noun is the sport's, so it lives in a data file found by pattern beside the profile (never in the sport-neutral code; the
 * coupling ratchet lists the term), carried to the fixture only for a transition the game holds, and read by the renderer from there.
 */
test('the coach vocabulary: one file, tied to the profile, every entry approved in his cited words', () => {
    const vocabulary = loadSportCoachVocabulary()!
    assert.equal(vocabulary.sportId, readJson(`stage-b/${fs.readdirSync(path.join(CONFORMANCE_DIR, 'stage-b')).find(n => n.startsWith('sport-profile-'))}`).sportId)
    assert.deepEqual(vocabulary.restartMethodNouns.map(e => [e.trigger, e.method, e.article, e.noun]), [['OUT_TOUCHLINE', 'IN_HAND', 'a', 'throw-in']])
    assert.deepEqual(vocabulary.restartMethodNouns[0].approvedBy.map(w => w.citedAs), ['his reply filed 19 October 2026, item 4', 'his reply filed 18 October 2026, item 2'])
    assert.equal(vocabulary.restartMethodNouns[0].approvedBy[0].words, 'Use "throw-in" rather than "with the ball in hand."')
    // Not a contribution of the profile: the profile's items and declarations are what they were.
    assert.ok(!JSON.stringify(loadSportProfile()).includes('throw-in'))
})

test('the coach vocabulary refuses an entry without his approval, for another sport, or twice', () => {
    const raw = readJson(loadSportCoachVocabulary()!.file)
    const sportId = raw.sportId
    assert.deepEqual(validateSportCoachVocabulary(raw, sportId), [])
    const copy = () => JSON.parse(JSON.stringify(raw))
    const unapproved = copy()
    delete unapproved.restartMethodNouns.entries[0].approvedBy
    assert.ok(validateSportCoachVocabulary(unapproved, sportId).some(e => e.includes('carries no approval in his cited words')))
    const uncited = copy()
    uncited.restartMethodNouns.entries[0].approvedBy = [{ words: 'TEST-ONLY', citedAs: '' }]
    assert.ok(validateSportCoachVocabulary(uncited, sportId).some(e => e.includes('carries no approval in his cited words')))
    assert.ok(validateSportCoachVocabulary(raw, 'TEST-ONLY').some(e => e.includes('and the Sport Profile is')))
    const twice = copy()
    twice.restartMethodNouns.entries.push(twice.restartMethodNouns.entries[0])
    assert.ok(validateSportCoachVocabulary(twice, sportId).some(e => e.includes('repeats the trigger and method')))
    // Stage M4 review (17 October 2026): an approval in his cited words that does not name the noun approves nothing for it.
    const otherNoun = copy()
    otherNoun.restartMethodNouns.entries[0].noun = 'TEST-ONLY-noun'
    assert.ok(validateSportCoachVocabulary(otherNoun, sportId).some(e => e.includes('the noun "TEST-ONLY-noun" is not in his cited words')))
})

test('key identity: a game carries the vocabulary entry only where a transition uses it; A01 no longer does, and a game with none carries none', () => {
    const vocabulary = loadSportCoachVocabulary()!
    // Re-pointed 24 October 2026 (R1): his reply filed 27 October 2026, item 4 ("There should be no separate corners, goal kicks, throw-ins,
    // free kicks, or penalty kicks for this activity.") withdrew A01's touchline restart taken by hand, so no transition of its game holds that
    // trigger and method and the entry does not cross. The entry itself stays valid sport data.
    assert.deepEqual(vocabulary.restartMethodNouns.map(entry => [entry.trigger, entry.method, entry.noun]), [['OUT_TOUCHLINE', 'IN_HAND', 'throw-in']])
    // Re-pointed 24 October 2026 (K3, the d27 design's stage K3): the session states its goals, since a session that has not said what goals it
    // has is asked first now that A01's record tries the goal version first (his reply filed 26 October 2026, item 11). Both versions are read:
    // no goal (the zone version, A01-R1, as before) and the FA 5v5 goal (the goal version, A01-R2, which inherits the same common restart).
    for (const goal of [{ count: 0 }, { count: 1, type: 'scaled', widthM: 3.6576 }]) {
        const a01: any = buildActivityWithFixture({ kind: 'learning-goal', goalId: 'A01', situationId: null, session: { players: 12, lengthM: 40, widthM: 30, durationMin: 20, roles: { goalkeeper: 1 }, objects: { goal } } } as any).fixture
        assert.equal(a01.roleBlocks.blocks.length, 2, JSON.stringify(goal))
        for (const block of a01.roleBlocks.blocks) assert.equal(block.fixture.methodNouns, undefined, JSON.stringify(goal))
    }
    const plain: any = buildActivityFromKnowledge(['GF2'], { players: 12, lengthM: 40, widthM: 30, durationMin: 20, roles: { goalkeeper: 0 } }).fixture
    assert.ok(plain && plain.game, 'the possession game alone builds a fixture')
    assert.equal(plain.methodNouns, undefined, 'no transition with that trigger and method, so nothing crosses')
})

console.log(`sport-profile: ${passed} passed`)
