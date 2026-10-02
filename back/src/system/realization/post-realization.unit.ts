/**
 * The post-realization entailment pass, and whether its guards can fail.
 *
 * This file exists because of a defect that passed every test the project had: `GA-ROSTER-SUM` derived six
 * outfield players a side, passed on that figure, and the figure was never written into the concrete game.
 * 246 green tests, a game marked render-eligible, and teams with no size. The check was examining its own
 * working.
 *
 * So the tests here are mostly **destructive**. A guard against that defect is worthless if it cannot fail,
 * and a guard that verifies a write made two lines earlier in the same process is exactly the kind that
 * might not be able to. Each one is proved by breaking the thing it guards.
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { isStampedHalt } from '../derivation/emit'
import { runDerivation, runStages0to10 } from '../derivation/engine'
import { indexRegister } from '../derivation/register'
import { assembleResolvedGame } from '../derivation/resolved-game'
import { derivationInputFor, selectFor } from '../derivation/run-bounded-selection'
import { entailOverConcreteGame, runPostRealizationGates } from './post-realization-gate'
import { checkRealization, isRefused, nothingInvented, realize, Realized } from './realize'

const CHOICES = path.resolve(__dirname, '../../../../docs/audits/a04-realization-choices.json')
const SUPPLIED = JSON.parse(fs.readFileSync(CHOICES, 'utf8'))
const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value))

/**
 * The real chain, up to but not including the entailment pass. An envelope override tests refusal paths.
 *
 * **Everything mutable is copied per call.** Writing this test found that `derivationInputFor` returned the
 * module-level `CORPUS_ENVELOPE` itself, so one block setting `players = 13` silently changed every later
 * block in the file — the failure looked like a bug in the code under test. That is fixed at the source
 * now, and the choices are copied here for the same reason: a test that mutates shared input is testing a
 * different run from the one it describes.
 */
function chain(override?: (envelope: Record<string, unknown>) => void) {
    const selection = selectFor('A04', null)
    const input = derivationInputFor(selection)
    const supplied = copy(SUPPLIED)
    if (override) override(input.envelope as Record<string, unknown>)
    const result = runDerivation(input)
    if (isStampedHalt(result)) throw new Error('halted')
    const staged: any = runStages0to10(input)
    const index = indexRegister(input.register)
    const resolved = assembleResolvedGame(result, staged.classes, index, input.contracts)
    const realizationResult = realize(resolved, supplied.choices, supplied.instantiations, index, input.envelope)
    if (isRefused(realizationResult)) throw new Error(`refused: ${realizationResult.because.join('; ')}`)
    return {
        resolved,
        realized: realizationResult as Realized,
        ctx: { ...staged.gateContext, contracts: input.contracts },
        owed: resolved.coherence.postRealizationRequired.map((o: any) => ({ checkId: o.checkId, clause: o.clause })),
    }
}

const teamsOf = (realized: Realized) => (realized.game as any).performers.teams as Record<string, unknown>[]

// ── Two runs do not share an envelope ─────────────────────────────────────────────────────────────
// A guard on the hazard this file uncovered: a run that varies the session must not change the next one.
{
    const a = derivationInputFor(selectFor('A04', null))
    const b = derivationInputFor(selectFor('A04', null))
    assert.notEqual(a.envelope, b.envelope, 'each run must get its own envelope object')
    ;(a.envelope as any).players = 99
    assert.equal((b.envelope as any).players, 12, 'varying one run must not reach another')
    assert.equal((derivationInputFor(selectFor('A04', null)).envelope as any).players, 12, 'nor any later one')
}

// ── The roster is entailed, and it lands in the game ─────────────────────────────────────────────
{
    const { resolved, realized, ctx, owed } = chain()
    const entailed = entailOverConcreteGame(ctx, realized)

    assert.ok(entailed.length > 0, 'the pass must entail something — a vacuous pass proves nothing')
    const outfield = entailed.filter(e => e.leaf === 'outfieldCount')
    assert.equal(outfield.length, 2, 'both teams get a size')
    for (const entry of outfield) assert.equal(entry.value, 6, '12 players, 2 teams, 0 specialized roles, authored equality')

    // The game itself, not the record — that was the whole defect.
    for (const team of teamsOf(realized)) {
        assert.equal(team.outfieldCount, 6, 'the CONCRETE GAME must carry the size')
    }

    // Every entailment names an exact member address and a reason.
    for (const entry of entailed) {
        assert.ok(entry.collection.length > 0 && entry.memberIndex >= 0 && entry.leaf.length > 0, 'an entailment must address a member exactly')
        assert.ok(entry.because.includes(entry.lineId), 'an entailment must carry the line that entails it')
    }

    // The recorded member is deliberately NOT mutated: if the entailed value were written into it,
    // `nothingInvented` would account for it as something the member "carries" and would be confirming
    // this pass's own write instead of an entailment.
    for (const instantiation of realized.record.instantiations) {
        assert.equal(instantiation.member.outfieldCount, undefined, 'the recorded member must stay as realization supplied it')
    }

    const checks = checkRealization(resolved, realized)
    assert.deepEqual(checks.nothingInvented, [], 'the entailed values must be accounted, not reported as inventions')
    assert.deepEqual(checks.nothingLost, [])
    assert.deepEqual(checks.nothingClosedWithoutAuthority, [])

    const post = runPostRealizationGates(ctx, owed, realized)
    assert.equal(post.validated, true, `A04 must still be render-eligible; outstanding: ${post.outstanding.join('; ')}`)
    assert.equal(post.entailed.length, entailed.length)
}

// ── TEETH: a derived value missing from the game blocks render-eligibility ────────────────────────
//
// The exact defect, reconstructed. Without this assertion the guard is decorative.
{
    const { realized, ctx, owed } = chain()
    entailOverConcreteGame(ctx, realized)
    assert.equal(runPostRealizationGates(ctx, owed, realized).validated, true, 'baseline')

    // Strip the value the gate derives, leaving the game exactly as it was before the fix.
    for (const team of teamsOf(realized)) delete team.outfieldCount

    const post = runPostRealizationGates(ctx, owed, realized)
    assert.equal(post.validated, false, 'a game whose teams lack a derived size must NOT be render-eligible')
    assert.ok(
        post.outstanding.some(o => o.includes('does not survive into the concrete game') && o.includes('outfieldCount')),
        `the reason must name the property; got ${JSON.stringify(post.outstanding)}`,
    )
    // And the invariant itself still passes — which is the point. GA-ROSTER-SUM was never wrong; it was
    // passing on a value the artifact did not keep. Both facts must be visible at once.
    const roster = post.gateA.checks.find(c => c.checkId === 'GA-ROSTER-SUM')
    assert.equal(roster?.verdict, 'PASS', 'the invariant passes; persistence is a separate failure')
}

// ── TEETH: a value that disagrees with the derivation is caught, not just an absent one ───────────
{
    const { realized, ctx, owed } = chain()
    entailOverConcreteGame(ctx, realized)
    teamsOf(realized)[0].outfieldCount = 5

    const post = runPostRealizationGates(ctx, owed, realized)
    assert.equal(post.validated, false, 'a contradicted value must block too')
    assert.ok(post.outstanding.some(o => o.includes('the concrete game holds 5')), `got ${JSON.stringify(post.outstanding)}`)
}

// ── TEETH: a value smuggled into an instantiated member is an invention ──────────────────────────
//
// `nothingInvented` used to return as soon as it was inside an instantiated member, so ANY value written
// into a member escaped it. That blind spot is where the roster fix would have landed.
{
    const { resolved, realized, ctx } = chain()
    entailOverConcreteGame(ctx, realized)
    assert.deepEqual(nothingInvented(resolved, realized), [], 'baseline')

    teamsOf(realized)[1].maxTouches = 3
    const problems = nothingInvented(resolved, realized)
    assert.equal(problems.length, 1, `a value inside a member with no authority must be reported; got ${JSON.stringify(problems)}`)
    assert.ok(problems[0].includes('maxTouches'), problems[0])
    assert.ok(problems[0].includes('does not carry it'), problems[0])
}

// ── A member's own authored fields are still accounted ────────────────────────────────────────────
// The tightening must not turn legitimate member content into false violations.
{
    const { resolved, realized, ctx } = chain()
    entailOverConcreteGame(ctx, realized)
    for (const team of teamsOf(realized)) {
        assert.ok(team.designation !== undefined, 'the member carries its designation')
    }
    assert.deepEqual(nothingInvented(resolved, realized), [], 'authored member fields are not inventions')

    // Including a structured one: a member field whose value is an object must not be walked into and
    // reported field by field.
    const instantiation = realized.record.instantiations[0]
    ;(instantiation.member as any).shape = { kind: 'TEAM', note: 'structured' }
    ;(teamsOf(realized)[0] as any).shape = { kind: 'TEAM', note: 'structured' }
    assert.deepEqual(nothingInvented(resolved, realized), [], 'a structured member field is one value, not three inventions')
}

// ── A division that does not come out whole derives NOTHING, rather than rounding ─────────────────
{
    const { realized, ctx, owed } = chain(envelope => {
        ;(envelope as any).players = 13
    })
    const entailed = entailOverConcreteGame(ctx, realized)
    assert.equal(
        entailed.filter(e => e.leaf === 'outfieldCount').length,
        0,
        '13 players across 2 teams is not whole — no size may be entailed, and certainly not 6.5',
    )
    for (const team of teamsOf(realized)) {
        assert.equal(team.outfieldCount, undefined, 'no rounded roster reaches the game')
    }
    // And the honest consequence: nothing is invented, so the check that needs the value cannot pass.
    const post = runPostRealizationGates(ctx, owed, realized)
    assert.equal(post.validated, false, 'an underivable roster must leave the game not render-eligible')
    assert.ok(
        post.outstanding.some(o => o.includes('GA-ROSTER-SUM')),
        `the roster check must be the reason; got ${JSON.stringify(post.outstanding)}`,
    )
}

// ── memberIndex is the exact address, where `satisfies` is not ────────────────────────────────────
// Both teams satisfy the SAME existential claim, so `satisfies` cannot tell them apart. If memberIndex
// were wrong, both entailments would address one member and the other would silently keep nothing.
{
    const { realized, ctx } = chain()
    const claims = new Set(realized.record.instantiations.map(i => i.classId))
    assert.equal(claims.size, 1, 'both teams come from one claim — so a path keyed on `satisfies` is ambiguous')
    const indices = realized.record.instantiations.map(i => i.memberIndex)
    assert.deepEqual([...new Set(indices)].sort(), indices.slice().sort(), 'every member has a distinct index')
    for (const i of indices) assert.ok(i >= 0, 'memberIndex must be assigned, not left at -1')

    const entailed = entailOverConcreteGame(ctx, realized)
    const addressed = new Set(entailed.filter(e => e.leaf === 'outfieldCount').map(e => e.memberIndex))
    assert.equal(addressed.size, 2, 'the two entailments must address two different members')
}

console.log('post-realization.unit.ts — ok')
