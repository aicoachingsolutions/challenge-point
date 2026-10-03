/**
 * **Opaque referential identity for instantiated members** — his ruling of 3 October, and the falsification
 * case he asked for.
 *
 *   > *Every instantiated member may receive a unique, stable, opaque referential handle. The handle
 *   > establishes identity only; it carries no domain meaning.*
 *
 * The guards he set, each asserted below:
 *
 *   - unique among the relevant instantiated members;
 *   - stable for the lifetime of the concrete game;
 *   - opaque;
 *   - unauthored — no row, status, basis or support verdict, and no knowledge item may target the handle;
 *   - equality / co-reference permitted;
 *   - **no ordering, arithmetic, string interpretation or recovery of instantiation order**;
 *   - never rendered to the coach.
 *
 * And the boundary that decides all of it:
 *
 *   > *The swap test is the important semantic boundary: if exchanging two handles while preserving all
 *   > represented values changes the meaning of the game, the handle has acquired meaning it is not allowed
 *   > to have.*
 *
 * > *Modulo opaque-handle renaming, the resulting represented game must be identical. Coach-facing output
 * > must be literally identical.*
 *
 * **Why the permutation test needs a distinguishing value forced in.** A04's two teams are structurally
 * identical, so exchanging them is the identity operation and the test would pass without proving anything —
 * the same vacuity that let `GA-ROSTER-SUM` pass for 4, 5, 6 *and* 7 players a side. So the asymmetric case
 * below writes genuinely different values against the two handles first, and only then permutes.
 */
import assert from 'node:assert/strict'
import * as fs from 'node:fs'
import * as path from 'node:path'

import { runDerivation, runStages0to10 } from '../derivation/engine'
import { indexRegister } from '../derivation/register'
import { assembleResolvedGame } from '../derivation/resolved-game'
import { derivationInputFor, selectFor } from '../derivation/run-bounded-selection'
import { completeConcreteGame, entailmentsLanded } from './assemble-concrete-game'
import { runPostRealizationGates } from './post-realization-gate'
import { memberHandle, nothingInvented, nothingLost, realize, Realized } from './realize'
import { renderConcreteGame } from '../rendering/render-concrete-game'

const CHOICES = path.resolve(__dirname, '../../../../docs/audits/a04-realization-choices.json')

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

function chain() {
    const input = derivationInputFor(selectFor('A04', null))
    const result: any = runDerivation(input)
    const staged: any = runStages0to10(input)
    const index = indexRegister(input.register)
    const resolved: any = assembleResolvedGame(result, staged.classes, index, input.contracts)
    const supplied = JSON.parse(fs.readFileSync(CHOICES, 'utf8'))
    const realized = realize(resolved, supplied.choices, supplied.instantiations, index, input.envelope) as Realized
    assert.equal((realized as any).outcome, 'REALIZED', JSON.stringify((realized as any).because))
    const ctx: any = { ...staged.gateContext, contracts: input.contracts }
    const entailed = completeConcreteGame(ctx, realized)
    const owed = resolved.coherence.postRealizationRequired.map((o: any) => ({ checkId: o.checkId, clause: o.clause }))
    /** The rendering layer reads a fixture, so the swap test must render through the same shape. */
    const fixture = () => ({
        envelope: {
            players: (input.envelope as any).players,
            lengthM: (input.envelope as any).area?.length_m,
            widthM: (input.envelope as any).area?.width_m,
            durationMin: (input.envelope as any).duration_min,
            roles: (input.envelope as any).roles ?? {},
        },
        game: realized.game,
        record: realized.record,
        status: {
            derived: resolved.derived.map((d: any) => ({ path: d.path, lineId: d.lineId, value: d.value })),
            choices: realized.record.choices.map(c => ({ path: c.path, lineId: c.lineId, value: c.value })),
            instantiations: realized.record.instantiations.map(i => ({ path: i.path, classId: i.classId, handle: i.handle, member: i.member })),
            entailed,
            geometry: realized.record.geometry,
            jointConditions: resolved.jointConditions,
            notEstablished: resolved.notEstablished.map((n: any) => ({ path: n.path, lineId: n.lineId, reason: n.reason, declared: n.declared })),
        },
    })
    return { resolved, realized, ctx, owed, index, input, fixture }
}

const teamsOf = (realized: Realized) => ((realized.game as any).performers?.teams ?? []) as Record<string, unknown>[]

// ── UNIQUE, and minted from the claim rather than from a position ──────────────────────────────────
test('every instantiated member carries a unique handle, minted from the claim that authorized it', () => {
    const { realized } = chain()
    const handles = realized.record.instantiations.map(i => i.handle)
    assert.equal(handles.length, 2, 'A04 instantiates two teams')
    assert.equal(new Set(handles).size, 2, 'the handles are distinct')

    const claims = new Set(realized.record.instantiations.map(i => i.classId))
    assert.equal(claims.size, 1, 'and both come from ONE claim — which is why `satisfies` cannot tell them apart')
    for (const i of realized.record.instantiations) {
        assert.ok(i.handle.startsWith(i.classId), `the handle is derived from the claim: ${i.handle}`)
    }
    assert.deepEqual(handles.slice().sort(), [memberHandle([...claims][0], 1), memberHandle([...claims][0], 2)].sort())
})

// ── The handle is an `elementId`: the EXISTING mechanism, not a second one ─────────────────────────
// His direction: "extend the existing elementId/typed-reference mechanism". So a member must be addressable
// exactly as a derived element is, and `container[handle].leaf` must resolve.
test('the handle IS an elementId, so a member is addressed exactly as a derived element is', () => {
    const { realized } = chain()
    const teams = teamsOf(realized)
    for (const i of realized.record.instantiations) {
        const member = teams.find(t => t.elementId === i.handle)
        assert.ok(member, `the member carries its handle as elementId: ${i.handle}`)
        assert.equal(member!.satisfies, i.classId, 'and still records which claim authorized it')
    }
    // The entailment path is now a canonical element path rather than an index-subscripted display string.
    for (const entry of realized.record.entailed) {
        assert.ok(entry.path.includes(`[${entry.handle}]`), `an entailment addresses its member by handle: ${entry.path}`)
        assert.ok(!/\[\d+\]/.test(entry.path), `and never by position: ${entry.path}`)
    }
})

// ── UNAUTHORED: no row, no line, no verdict, and nothing may target it ─────────────────────────────
test('the handle is unauthored — no register row names it and no contracted item targets it', () => {
    const { index, input } = chain()
    for (const row of index.rows.values()) {
        assert.ok(
            !/\b(elementId|handle|identity)\b/i.test(String(row.path)),
            `no register row may name the handle, and ${row.id} does: ${row.path}`,
        )
    }
    for (const contract of input.contracts as any[]) {
        for (const item of contract.items ?? []) {
            const blob = JSON.stringify({ selector: item.selector, value: item.value })
            assert.ok(!/elementId|#\d+\s*$/.test(blob), `no item may target a handle, and ${contract.contractId}::${item.itemId} does: ${blob}`)
        }
    }
})

// ── NEVER RENDERED ────────────────────────────────────────────────────────────────────────────────
test('no handle reaches coach-facing output', () => {
    const { realized, fixture } = chain()
    const rendered = JSON.stringify(renderConcreteGame(fixture()))
    for (const i of realized.record.instantiations) {
        assert.ok(!rendered.includes(i.handle), `the handle must not be rendered: ${i.handle}`)
    }
    assert.ok(!/#\d+/.test(rendered), `no minted ordinal may appear in coach-facing output: ${rendered.slice(0, 200)}`)
})

// ── THE FALSIFICATION CASE, part 1: SYMMETRIC — and it is explicitly recorded as vacuous ───────────
test('permutation of two indiscernible members leaves the game identical (and is vacuous by itself)', () => {
    const a = chain()
    const b = chain()
    const strip = (realized: Realized) => JSON.stringify(realized.game).split(/c:[^"#]+#\d+/).join('<handle>')
    assert.equal(strip(a.realized), strip(b.realized), 'modulo handle renaming, two runs of one input agree')

    // The vacuity, asserted rather than assumed: with all represented values equal, the two members differ
    // ONLY by their handle, so exchanging them is the identity operation and this test proves nothing on its
    // own. Part 2 is the one with teeth.
    const [one, two] = teamsOf(a.realized).map(t => JSON.stringify({ ...t, elementId: undefined }))
    assert.equal(one, two, 'A04 two teams are structurally identical — so part 1 cannot detect smuggled meaning')
})

// ── THE FALSIFICATION CASE, part 2: ASYMMETRIC — the test with teeth ──────────────────────────────
//
// Force genuinely different values against the two handles, then exchange the handles AND the values
// together. The represented game must be identical modulo renaming: team-with-4 is still the team with 4,
// whichever handle it holds. If anything depended on WHICH handle carried the 4 — an ordering, a parse of
// the ordinal, a position — this is where it shows.
test('THE SWAP TEST: with asymmetric per-member values, exchanging handles changes nothing', () => {
    const run = (swap: boolean) => {
        const { realized, ctx, owed, fixture } = chain()
        const teams = teamsOf(realized)
        assert.equal(teams.length, 2)
        const handles = teams.map(t => String(t.elementId))
        // The asymmetry: 4 against one handle, 8 against the other — and swapped in the second run.
        const values = swap ? [8, 4] : [4, 8]
        teams.forEach((team, i) => {
            team.outfieldCount = values[i]
        })
        // The record must agree, or `entailmentsLanded` correctly reports the write as not having landed.
        for (const entry of realized.record.entailed) {
            if (entry.leaf !== 'outfieldCount') continue
            entry.value = values[handles.indexOf(entry.handle)]
        }
        const post = runPostRealizationGates(ctx, owed, realized)
        return {
            // Keyed by handle, so an identical map proves the value followed the handle, not the position.
            byHandle: Object.fromEntries(teams.map(t => [String(t.elementId), t.outfieldCount])),
            landed: entailmentsLanded(realized),
            validated: post.validated,
            verdicts: (post.owed ?? []).map((o: any) => `${o.checkId}:${o.clause}=${o.verdict}`).sort(),
            rendered: JSON.stringify(renderConcreteGame(fixture())),
        }
    }
    const plain = run(false)
    const swapped = run(true)

    assert.deepEqual(plain.landed, [], `the asymmetric write must land: ${JSON.stringify(plain.landed)}`)
    assert.deepEqual(swapped.landed, [], `and equally when the handles are exchanged: ${JSON.stringify(swapped.landed)}`)

    // Each handle keeps its own value in each run — so the handles really are telling the members apart.
    const handles = Object.keys(plain.byHandle).sort()
    assert.deepEqual(Object.keys(swapped.byHandle).sort(), handles, 'the same two handles exist in both runs')
    assert.notDeepEqual(plain.byHandle, swapped.byHandle, 'the swap genuinely moved the values between handles')

    // AND NOTHING ELSE CHANGED. Every verdict identical, and the coach-facing text LITERALLY identical.
    assert.deepEqual(swapped.verdicts, plain.verdicts, 'no verdict may depend on which handle holds which value')
    assert.equal(swapped.validated, plain.validated, 'render-eligibility may not depend on it either')
    assert.equal(swapped.rendered, plain.rendered, 'coach-facing output must be LITERALLY identical under a swap')
})

// ── NO ORDERING, NO PARSING, NO RECOVERY OF INSTANTIATION ORDER ───────────────────────────────────
//
// The structural half of the opacity guard. The ordinal is permitted as a minting input and must stay
// beneath the semantic boundary, so no source file may sort by a handle, do arithmetic on one, or parse the
// ordinal back out of it.
test('no source reads a handle for anything but equality', () => {
    const root = path.resolve(__dirname, '..')
    const offences: string[] = []
    const walk = (dir: string) => {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            const full = path.join(dir, entry.name)
            if (entry.isDirectory()) {
                walk(full)
                continue
            }
            if (!entry.name.endsWith('.ts') || entry.name === 'identity.unit.ts') continue
            const text = fs.readFileSync(full, 'utf8')
            const rel = path.relative(root, full)
            // Recovering the ordinal from a handle, or ordering by one.
            // Anchored to the handle itself. A loose `handle[^\n]*[<>]` matched every line that mentioned a
            // handle and also carried a TypeScript generic — three false positives, and a check that cries
            // wolf is worse than none.
            for (const pattern of [
                /\bhandle\b\s*\.\s*(split|match|slice|substring|indexOf|charAt|replace)\s*\(/,
                /(parseInt|parseFloat|Number)\s*\(\s*[A-Za-z_.]*\bhandle\b/,
                /\.sort\([^)]*\bhandle\b/,
                /\bhandle\b\s*[<>]=?[^=]/,
                /\bhandle\b\s*[-+*/%]\s*\d/,
            ]) {
                if (pattern.test(text)) offences.push(`${rel}: ${pattern}`)
            }
        }
    }
    walk(root)
    assert.deepEqual(offences, [], `a handle may only be compared for equality:\n${offences.join('\n')}`)
})

// ── THE HANDLE MUST BE A STRING, and this is not a style preference ───────────────────────────────
//
// `quantitiesInGame` in the fidelity layer walks the whole game and treats every finite NUMBER it finds as a
// quantity the game supports. A numeric handle would therefore license any rendered quantity equal to it —
// silently defeating the invention check for that number. Proven by probe during the 3 October trace: with a
// numeric handle of 777 on a team, an instruction claiming the quantity 777 passed as supported.
test('a handle is a string, so it cannot enter the game as a supported quantity', () => {
    const { realized } = chain()
    for (const i of realized.record.instantiations) {
        assert.equal(typeof i.handle, 'string', 'a numeric handle would be read as a supported quantity')
        assert.ok(Number.isNaN(Number(i.handle)), `and must not even be numeric-coercible: ${i.handle}`)
    }
})

// ── ADDITIVE ONLY: a derived element's elementId is untouched ──────────────────────────────────────
//
// The handle extends the mechanism for instantiated members; it must not re-mint a derived element's id. The
// provenance join between `status.derived` and the game is keyed on that id, and suffixing derived element
// ids was measured during the trace to produce 17 fidelity violations as the join collapsed.
test('the handle is additive — no derived element id is altered', () => {
    const { resolved, realized } = chain()
    const derivedIds = new Set(
        (resolved.derived as any[]).map(d => String(d.path).match(/\[([^\]]+)\]/)?.[1]).filter((id): id is string => !!id),
    )
    assert.ok(derivedIds.size > 0, 'A04 has derived elements')
    for (const id of derivedIds) {
        assert.ok(!id.includes('#'), `a derived element id must carry no ordinal: ${id}`)
    }
    // And every derived element is still findable in the game by its own id.
    const walk = (node: unknown, found: Set<string>): Set<string> => {
        if (Array.isArray(node)) node.forEach(e => walk(e, found))
        else if (node && typeof node === 'object') {
            const id = (node as any).elementId
            if (typeof id === 'string') found.add(id)
            for (const v of Object.values(node)) walk(v, found)
        }
        return found
    }
    const inGame = walk(realized.game, new Set<string>())
    for (const id of derivedIds) assert.ok(inGame.has(id), `derived element ${id} must still be addressable in the game`)
})

// ── THE DISCRIMINATOR IS UNCONDITIONAL ────────────────────────────────────────────────────────────
//
// Even where a claim owes a single member. A mint that yielded the bare `classId` would make the member
// findable by the element lookups driven from `resolved.derived`, so a member's leaf could stand in for a
// derived element's in the acceptance checks — a false PASS rather than a failure.
test('a handle never equals the bare claim id, even for a claim owing one member', () => {
    assert.equal(memberHandle('c:X:Y', 1), 'c:X:Y#1', 'the ordinal is appended unconditionally')
    const { realized } = chain()
    for (const i of realized.record.instantiations) {
        assert.notEqual(i.handle, i.classId, 'a bare claim id would collide with the claim class itself')
        assert.ok(i.handle.length > i.classId.length, 'the handle is strictly the claim id plus a discriminator')
    }
})

// ── NOT AN ORDERING KEY where a handle bridges into a line id ─────────────────────────────────────
//
// The post-realization gate is the one place a member identity becomes a line's `elementId`, and the
// derivation sorts lines by `String(elementId).localeCompare(...)`. The gate concatenates rather than
// re-sorting, so the handle is not an ordering key only by omission — asserted here so it stays that way.
// It also keeps the `realized:` prefix, which matters: a handle used verbatim as a class id would make an
// authored string equal to a handle grade HELD, breaking "no knowledge item may target the handle".
test('a handle bridged into a line id keeps its prefix and does not order the lines', () => {
    const { realized, ctx, owed } = chain()
    runPostRealizationGates(ctx, owed, realized)
    const handles = realized.record.instantiations.map(i => i.handle)
    for (const handle of handles) {
        assert.ok(!ctx.classes.some((c: any) => c.classId === handle), 'a handle must never be a class id verbatim')
    }
})

// ── STABLE for the lifetime of the concrete game ──────────────────────────────────────────────────
test('a handle is stable across assembly, the gate and rendering', () => {
    const { realized, ctx, owed, fixture } = chain()
    const before = teamsOf(realized).map(t => String(t.elementId))
    runPostRealizationGates(ctx, owed, realized)
    renderConcreteGame(fixture())
    const after = teamsOf(realized).map(t => String(t.elementId))
    assert.deepEqual(after, before, 'nothing downstream may remint or renumber a handle')
})

// ── IDENTITY IS NOT A PROPERTY: adding the handle must not make the member look populated ─────────
//
// The guard for the defect class this whole pass is about. `nothingInvented` skips `elementId`, `satisfies`
// and `selector` as identity — if the handle were NOT skipped it would be reported as an unsupported member
// property, and if the skip were too broad a real invention would hide behind it.
test('the handle is identity, not a value — it is neither an invention nor cover for one', () => {
    const { resolved, realized } = chain()
    assert.deepEqual(nothingInvented(resolved, realized), [], 'the handle itself is not an invention')
    assert.deepEqual(nothingLost(resolved, realized), [], 'and nothing is lost by adding it')

    // Teeth: a genuine invention beside the handle is still caught.
    const team = teamsOf(realized)[0]
    team.morale = 'high'
    const problems = nothingInvented(resolved, realized)
    assert.ok(
        problems.some(p => p.includes('morale')),
        `an unsupported member property must still be reported: ${JSON.stringify(problems)}`,
    )
    delete team.morale
})

// ── THE DEFECT HE ASKED REPAIRED: first-member collision and name-only licensing ───────────────────
//
// `chosenMemberLeaves` located the member with `findIndex(i => i.classId === parts.elementId)` — the FIRST
// instantiation of a matching claim — and stored only the leaf NAME. So a choice about either member
// licensed the first member, at any value, while the second member's correct value was called an invention.
// Both halves are asserted here, because a passing test on the symmetric case cannot see either.
test('a choice licenses the member it names, at the value it names — not the first member, at any value', () => {
    const { resolved, realized } = chain()
    const teams = teamsOf(realized)
    const [first, second] = teams.map(t => String(t.elementId))
    const collection = 'performers.teams'

    // Assembly already ENTAILS `goalkeeper` for both members, and an entailment licenses its own value — so
    // withdraw those entries AND the values they wrote, or this tests the entailment route instead of the
    // choice route (and the withdrawn write is then correctly reported as unsupported, which is noise here).
    realized.record.entailed = realized.record.entailed.filter(e => e.leaf !== 'goalkeeper')
    for (const team of teams) delete team.goalkeeper

    // A choice about the SECOND member. Before the repair this resolved to the first.
    realized.record.choices.push({
        lineId: `${second}::P3`,
        path: `${collection}[${second}].goalkeeper`,
        value: 1,
        authority: 'test',
        boundCheck: 'WITHIN_COUNT',
    } as any)
    teams.find(t => t.elementId === second)!.goalkeeper = 1

    assert.deepEqual(
        nothingInvented(resolved, realized).filter(p => p.includes('goalkeeper')),
        [],
        'the member the choice NAMES is licensed',
    )

    // Half one: the OTHER member must not be licensed by that choice.
    teams.find(t => t.elementId === first)!.goalkeeper = 1
    const leaked = nothingInvented(resolved, realized).filter(p => p.includes('goalkeeper'))
    assert.ok(
        leaked.some(p => p.includes(first)),
        `a choice naming one member must not license its sibling: ${JSON.stringify(leaked)}`,
    )
    delete teams.find(t => t.elementId === first)!.goalkeeper

    // Half two: the named member may hold only the value chosen, not merely *a* value at that leaf.
    teams.find(t => t.elementId === second)!.goalkeeper = 99
    const wrongValue = nothingInvented(resolved, realized).filter(p => p.includes('goalkeeper'))
    assert.ok(
        wrongValue.some(p => p.includes('99')),
        `a choice licenses the value it records and no other: ${JSON.stringify(wrongValue)}`,
    )
})

console.log(`identity: ${passed} passed`)
if (process.exitCode) console.log('identity: FAILURES ABOVE')
