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
import { assembleResolvedGame, splitPath } from '../derivation/resolved-game'
import { derivationInputFor, selectFor } from '../derivation/run-bounded-selection'
import { completeConcreteGame } from './assemble-concrete-game'
import { runPostRealizationGates } from './post-realization-gate'
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

// ── A member property's address is the WHOLE remainder after `[]`, and addresses never collide ─────
//
// A04's own member properties (`outfieldCount`, `goalkeeper`) are flat, so it cannot catch this: three
// places addressed a member with the LAST dotted segment, which is right for a flat row and wrong for
// every nested one. 20 of the register's member-property rows are nested, and two pairs collapse onto one
// address under last-segment addressing — `transitions[].qualifiers.region` and
// `transitions[].placement.region` would both write to `region`. The adversarial audit found this; the
// test is general so a flat fixture can never hide it again.
{
    const register = derivationInputFor(selectFor('A04', null)).register as any
    const rows: any[] = Array.isArray(register.rows) ? register.rows : Object.values(register.rows ?? {})
    const members = rows.filter(r => r && r.kind === 'FIELD' && r.ownerRow)
    assert.ok(members.length > 20, `expected the register's member-property rows; got ${members.length}`)

    let nested = 0
    for (const row of members) {
        const path = String(row.path)
        const { leaf } = splitPath(path)
        const at = path.indexOf('[]')
        assert.notEqual(at, -1, `${row.id} owns a member property but its path has no [] marker: ${path}`)
        assert.equal(leaf, path.slice(at + 2).replace(/^\./, ''), `${row.id}: the leaf must be the whole remainder`)
        if (leaf.includes('.')) nested++
    }
    assert.ok(nested >= 15, `the nested rows are the point of this test; found only ${nested}`)

    // No two properties of one collection may share an address.
    const byOwner = new Map<string, Map<string, string>>()
    for (const row of members) {
        const owner = String(row.ownerRow)
        if (!byOwner.has(owner)) byOwner.set(owner, new Map())
        const seen = byOwner.get(owner)!
        const { leaf } = splitPath(String(row.path))
        assert.equal(seen.get(leaf), undefined, `${owner}: rows ${seen.get(leaf)} and ${row.id} both address "${leaf}"`)
        seen.set(leaf, String(row.id))
    }

    // And the collision the old rule would have produced is real, not hypothetical — proof that the
    // canonical rule is doing work rather than agreeing with the broken one everywhere.
    const lastSegment = (p: string) => String(p).split('.').pop() as string
    const collisions = [...byOwner.entries()].flatMap(([owner, _]) => {
        const seen = new Map<string, string>()
        const found: string[] = []
        for (const row of members.filter(m => String(m.ownerRow) === owner)) {
            const key = lastSegment(row.path)
            if (seen.has(key)) found.push(`${owner}: ${seen.get(key)} vs ${row.id} both -> "${key}"`)
            seen.set(key, String(row.id))
        }
        return found
    })
    assert.ok(collisions.length > 0, 'the last-segment rule must demonstrably collide, or this test proves nothing')
}

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
    const entailed = completeConcreteGame(ctx, realized)

    assert.ok(entailed.length > 0, 'the pass must entail something — a vacuous pass proves nothing')
    const outfield = entailed.filter(e => e.leaf === 'outfieldCount')
    assert.equal(outfield.length, 2, 'both teams get a size')
    for (const entry of outfield) assert.equal(entry.value, 6, '12 players, 2 teams, 0 specialized roles, authored equality')

    // The game itself, not the record — that was the whole defect.
    for (const team of teamsOf(realized)) {
        assert.equal(team.outfieldCount, 6, 'the CONCRETE GAME must carry the size')
    }

    // Every entailment names an exact member address, and carries its derivation — his ruling asks for the
    // value to survive "with its derivation/provenance intact", so the reason must say what entails it
    // rather than merely that something did.
    for (const entry of entailed) {
        assert.ok(entry.collection.length > 0 && entry.memberIndex >= 0 && entry.leaf.length > 0, 'an entailment must address a member exactly')
        assert.ok(entry.lineId.length > 0 && entry.path.includes(entry.leaf), 'an entailment must be identifiable and addressable')
        assert.match(entry.because, /session|authored|register/i, `the provenance must name its source: "${entry.because}"`)
    }
    const perTeam = entailed.find(e => e.leaf === 'outfieldCount')!
    assert.match(perTeam.because, /12 session performers/, `the roster must carry its chain: "${perTeam.because}"`)
    assert.match(perTeam.because, /2 teams/, perTeam.because)
    assert.match(perTeam.because, /equality authored on P2/, perTeam.because)

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
    completeConcreteGame(ctx, realized)
    assert.equal(runPostRealizationGates(ctx, owed, realized).validated, true, 'baseline')

    // Strip the value the gate derives, leaving the game exactly as it was before the fix.
    for (const team of teamsOf(realized)) delete team.outfieldCount

    const post = runPostRealizationGates(ctx, owed, realized)
    assert.equal(post.validated, false, 'a game whose teams lack a derived size must NOT be render-eligible')
    assert.ok(
        post.outstanding.some(o => o.includes('did not survive into the concrete game') && o.includes('outfieldCount')),
        `the reason must name the property; got ${JSON.stringify(post.outstanding)}`,
    )

    /**
     * **And the invariant can no longer pass on a value the artifact lacks.** This is the substance of his
     * ruling of 1 October — *"the invariant should be checking the same persisted game state that rendering
     * receives"* — so it is asserted rather than described.
     *
     * Before the relocation this same mutation left `GA-ROSTER-SUM` reporting **PASS**: the check read the
     * gate's own derived lines, so the roster was satisfied by a figure the game did not contain, and only
     * a separate persistence guard noticed. Now the check reads the game, so removing the value makes the
     * invariant unevaluable. The defect is structurally impossible rather than detected after the fact.
     */
    const roster = post.gateA.checks.find(c => c.checkId === 'GA-ROSTER-SUM')
    assert.notEqual(roster?.verdict, 'PASS', 'the invariant must NOT pass on a value absent from the game')
    assert.equal(roster?.verdict, 'NOT_EVALUABLE', `got ${roster?.verdict}: ${roster?.why}`)
}

// ── TEETH: a value that disagrees with the derivation is caught, not just an absent one ───────────
{
    const { realized, ctx, owed } = chain()
    completeConcreteGame(ctx, realized)
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
    completeConcreteGame(ctx, realized)
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
    completeConcreteGame(ctx, realized)
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
    const entailed = completeConcreteGame(ctx, realized)
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

    const entailed = completeConcreteGame(ctx, realized)
    const addressed = new Set(entailed.filter(e => e.leaf === 'outfieldCount').map(e => e.memberIndex))
    assert.equal(addressed.size, 2, 'the two entailments must address two different members')
}

// ── The equality licence: an item stating ASYMMETRY must not license equal division ───────────────
//
// `/equal/i` matched its own negation. The corpus really contains an AUTHORED P2 item valued "unequal
// between the teams, e.g. 4 and 6 (4v6)", so an item stating asymmetry licensed dividing equally — the
// precise thing he warned against when he said equal team numbers must not become an engine assumption.
{
    const onlyP2Items = (value: string, basis: string, valueStatus: string) => {
        const { realized, ctx } = chain()
        ctx.contracts = copy(ctx.contracts).map((contract: any) => ({
            ...contract,
            items: (contract.items ?? []).map((item: any) => (String(item.row) === 'P2' ? { ...item, value, basis, valueStatus } : item)),
        }))
        return completeConcreteGame(ctx, realized).filter(e => e.leaf === 'outfieldCount')
    }

    assert.equal(
        onlyP2Items('unequal between the teams, e.g. 4 and 6 (4v6)', 'AUTHORED', 'TYPICAL_EXAMPLE').length,
        0,
        'an item stating UNEQUAL teams must not license equal division',
    )
    // An example is not a requirement, even when it does say "equal".
    assert.equal(
        onlyP2Items("equal to the other team's outfieldCount", 'AUTHORED', 'TYPICAL_EXAMPLE').length,
        0,
        'a TYPICAL_EXAMPLE must not license a universal division',
    )
    assert.equal(
        onlyP2Items("equal to the other team's outfieldCount", 'AUTHORED', 'PREFERRED_DEFAULT').length,
        0,
        'a PREFERRED_DEFAULT must not license it either',
    )
    assert.equal(onlyP2Items('P2 equal for the two teams', 'ASSUMED', 'REQUIRED_RANGE').length, 0, 'an ASSUMED item never licensed it')
    // And the authored requirement he promoted still does, or the licence would be unreachable.
    assert.equal(
        onlyP2Items("equal to the other team's outfieldCount; no absolute number", 'OWNER_RULING', 'REQUIRED_RANGE').length,
        2,
        'an owner-authored REQUIRED_RANGE equality must still license the division',
    )
}

// ── A role count must be a whole, non-negative number of people ───────────────────────────────────
{
    for (const bad of [-1, 1.5, Number.NaN]) {
        const { realized, ctx } = chain()
        ;(ctx.envelope as any) = { ...(ctx.envelope as any), roles: { goalkeeper: bad } }
        assert.equal(
            completeConcreteGame(ctx, realized).filter(e => e.leaf === 'outfieldCount').length,
            0,
            `a stated role count of ${bad} must derive nothing — a negative one would ENLARGE the outfield pool`,
        )
    }
}

// ── Neutrals are READ from P5, not counted from a filter that cannot match ────────────────────────
//
// `classes.filter(c => c.row === 'P5' && ...)` was structurally always 0: P5 is `performers.neutrals.count`,
// a FIELD, and a `realized:` class exists only for an existential claim on a COLLECTION row. A game that
// did establish neutrals would have had them silently ignored and its outfield pool overstated.
{
    const { ctx } = chain()
    const p5 = ctx.lines.filter((l: any) => String(l.row) === 'P5')
    assert.ok(p5.length > 0, 'the P5 line must exist for this to be readable at all')
    assert.equal(
        ctx.classes.filter((c: any) => c.row === 'P5').length,
        0,
        'no element class carries row P5 — which is why counting classes could never work',
    )

    // A resolved neutral count is subtracted: 12 players, 2 neutrals, 2 teams -> 5 a side.
    {
        const { realized, ctx: c2 } = chain()
        for (const line of c2.lines.filter((l: any) => String(l.row) === 'P5')) {
            c2.classified.set(line.lineId, { lineId: line.lineId, lineState: 'ENUMERATED', verdict: 'RESOLVED:ENTAILED', resolvedBy: 'SESSION', reason: null, collidingItems: [] } as any)
            c2.derived.set(line.lineId, { lineId: line.lineId, session: { value: 2, row: 'P5' }, entailing: [], bounding: [], narrowing: [], standingDecisions: [], undetermined: [], open: null } as any)
        }
        const sizes = completeConcreteGame(c2, realized).filter(e => e.leaf === 'outfieldCount')
        assert.equal(sizes.length, 2)
        for (const s of sizes) assert.equal(s.value, 5, '12 - 2 neutrals over 2 teams is 5 a side, not 6')
    }

    // Required but unestablished derives nothing rather than assuming zero.
    {
        const { realized, ctx: c3 } = chain()
        for (const line of c3.lines.filter((l: any) => String(l.row) === 'P5')) {
            c3.classified.set(line.lineId, { lineId: line.lineId, lineState: 'ENUMERATED', verdict: 'NOT_AUTHORED', reason: 'coverage', collidingItems: [] } as any)
            c3.derived.set(line.lineId, { lineId: line.lineId, entailing: [], bounding: [], narrowing: [], standingDecisions: [], undetermined: [], open: null } as any)
        }
        assert.equal(
            completeConcreteGame(c3, realized).filter(e => e.leaf === 'outfieldCount').length,
            0,
            'an unestablished neutral count must not be assumed to be zero',
        )
    }
}

// ── An entailment licenses the VALUE it entails, not merely the leaf ──────────────────────────────
{
    const { resolved, realized, ctx } = chain()
    completeConcreteGame(ctx, realized)
    assert.deepEqual(nothingInvented(resolved, realized), [], 'baseline')

    teamsOf(realized)[0].outfieldCount = 99
    const problems = nothingInvented(resolved, realized)
    assert.equal(problems.length, 1, `a value that disagrees with its entailment must be caught; got ${JSON.stringify(problems)}`)
    assert.ok(problems[0].includes('99') && problems[0].includes('entailment records 6'), problems[0])
}

// ── A member field that is an array of objects is not reported as an invention ────────────────────
// `within.leaf` was not advanced across an array index, so `readAt(member, 'roles.name')` resolved nothing
// and a value the member genuinely carried was reported as invented. A team can own a `roles[]` collection.
{
    const { resolved, realized, ctx } = chain()
    completeConcreteGame(ctx, realized)
    const member = realized.record.instantiations[0].member as any
    member.roles = [{ name: 'PIVOT' }, { name: 'WIDE' }]
    ;(teamsOf(realized)[0] as any).roles = [{ name: 'PIVOT' }, { name: 'WIDE' }]
    assert.deepEqual(nothingInvented(resolved, realized), [], 'an array the member carries is not an invention')

    // And a value NOT in the member is still caught inside that array.
    ;(teamsOf(realized)[0] as any).roles[1].smuggled = true
    const problems = nothingInvented(resolved, realized)
    assert.equal(problems.length, 1, `got ${JSON.stringify(problems)}`)
    assert.ok(problems[0].includes('smuggled'), problems[0])
}

// ── A runner that SKIPS the entailment pass is refused, not quietly given a different game ────────
//
// The pass is a caller's obligation, and a runner that did not know about it produced a different concrete
// game from identical inputs. The gate deliberately does not repair that: repairing it would make the gate
// a writer and would make the persistence guard vacuous, since the repair removes the absence the guard
// exists to detect. So the gate refuses instead, loudly.
{
    const { realized, ctx, owed } = chain()
    assert.equal(realized.record.entailed.length, 0, 'the pass has not run')
    const post = runPostRealizationGates(ctx, owed, realized)
    assert.equal(post.validated, false, 'a game the pass never ran over must not be render-eligible')
    // The refusal comes from the invariant itself, not from a bespoke guard: the roster properties are
    // absent from the game, so the check that needs them cannot be evaluated and says which lines it
    // wanted. That is a better failure than a guard reporting a missing write, because it needs no
    // separate mechanism to notice.
    const roster = post.gateA.checks.find(c => c.checkId === 'GA-ROSTER-SUM')
    assert.equal(roster?.verdict, 'NOT_EVALUABLE', `got ${roster?.verdict}`)
    assert.ok(String(roster?.why).includes('::P2'), `the refusal must name the lines it wanted; got ${roster?.why}`)
    assert.ok(post.outstanding.some(o => o.includes('GA-ROSTER-SUM')), JSON.stringify(post.outstanding))
}

// ── TEETH: a write that silently does not land is caught ──────────────────────────────────────────
//
// Now that the pass always runs before the gate in every runner, the absence the guard catches is a write
// that did not land — a wrong member address, which is exactly what the leaf-addressing defect produced.
// Both the writer and the guard reach a member by index; skew it and the write is skipped by a bare
// `continue`, leaving the line resolved and the game without it.
{
    const { realized, ctx, owed } = chain()
    realized.record.instantiations.forEach(i => {
        i.memberIndex = 99 // a member that is not there
    })
    const entailed = completeConcreteGame(ctx, realized)
    assert.ok(entailed.length > 0, 'the values are still derived')
    for (const team of teamsOf(realized)) {
        assert.equal(team.outfieldCount, undefined, 'and the write silently did not land')
    }
    const post = runPostRealizationGates(ctx, owed, realized)
    assert.equal(post.validated, false, 'a write that did not land must block render-eligibility')
    assert.ok(post.outstanding.some(o => o.includes('did not survive into the concrete game')), JSON.stringify(post.outstanding))
}

console.log('post-realization.unit.ts — ok')
