/**
 * A primary-event condition's authored scope, carried and honoured — 15 October 2026 (synthesis step 5).
 *
 * Christian, 20 September (SD-36): the BUILD_OUT_EPISODE scope *"applies to the attacking episode whose beginning
 * satisfies the resolved RPC-001 build-out begin condition. It does NOT automatically extend to subsequent attacking
 * episodes."* His reply received 15 October 2026 (16 October, item 5): *"I agree with the existing decision that the
 * build-out scoring condition applies only to build-out episodes"*; item 9 point 3: *"Build-out condition applies only
 * to build-out episodes: Approved."*
 *
 * Measured that day before the engine change, on a deep copy of the possession game with the build-out context and
 * its four conditions re-scoped to the episode: the resolved game was byte-identical to the unscoped one apart from
 * the input digest, and BUILD_OUT_EPISODE appeared nowhere in it — so restating the scope would have changed nothing.
 * This file pins what replaced that: the scope arrives on the condition element (only where it is not WHOLE_GAME, so
 * every whole-game game assembles exactly as before), every reader honours it or reports that it cannot, and Gate A
 * asks whether the episode can begin at all.
 *
 * Run: npm test
 */
import assert from 'node:assert/strict'

import { conditionScopeNotEvaluable, CONDITION_ROW, EVALUABLE_CONDITION_SCOPE, assembleResolvedGame } from './resolved-game'
import { isStampedHalt } from './emit'
import { runDerivation, runStages0to10 } from './engine'
import { runGates } from './gates'
import { indexRegister } from './register'
import { derivationInputFor, selectFor } from './run-bounded-selection'
import { DerivationInput, ElementClass } from './types'
import { nothingInvented, nothingLost } from '../realization/realize'
import { contextScoringFindings } from '../rendering/context-scoring-guard'
import { checkFidelity } from '../rendering/fidelity'
import { renderConcreteGame } from '../rendering/render-concrete-game'
import { buildActivityFromKnowledge } from '../rendering/build-activity'
import { specializedRoleNames } from '../rendering/session-envelope'
import { loadCorpusContracts } from './corpus'

let passed = 0
function test(name: string, body: () => void): void {
    body()
    passed++
    console.log(`  ok  ${name}`)
}

const RPC = 'restated:RPC-001'
const CONDITION_ITEMS = ['RPC-001-18.a', 'RPC-001-18.b', 'RPC-001-18.c', 'RPC-001-18.d', 'RPC-001-18.e', 'RPC-001-18.f', 'RPC-001-18.g', 'RPC-001-19.a', 'RPC-001-19.b']
const compose = (ids: string[]): DerivationInput => derivationInputFor({ selected: ids.map(id => ({ id, role: 'test composition' })) })

/** GF2 + RPC-001 over a DEEP COPY with the nine condition items given one scope (the loader's objects are shared). */
function resolvedWith(scope: string | null, ids: string[] = ['restated:GF2', RPC]) {
    const input = compose(ids)
    input.contracts = JSON.parse(JSON.stringify(input.contracts))
    const rpc: any = input.contracts.find(c => c.contractId === RPC)
    for (const item of rpc?.items ?? []) {
        if (!CONDITION_ITEMS.includes(item.itemId)) continue
        if (scope === null) delete item.scope
        else item.scope = scope
    }
    const result = runDerivation(input)
    assert.ok(!isStampedHalt(result), 'the composition derives')
    const staged: any = runStages0to10(input)
    return { input, staged, game: assembleResolvedGame(result as any, staged.classes, indexRegister(input.register), input.contracts) }
}
const conditionsOf = (game: any): any[] => game.game.value?.primaryEvent?.conditions ?? []
/**
 * What the resolved game said about the game before conditions carried their scope: everything but its provenance
 * (the input digest differs by construction) and its coherence (Gate A now judges the scope — pinned below), with
 * every condition's `scope` key taken out.
 */
const withoutScopes = (game: any) => {
    const { provenance, coherence, ...rest } = JSON.parse(JSON.stringify(game))
    for (const condition of rest.game.value?.primaryEvent?.conditions ?? []) delete condition.scope
    return JSON.stringify(rest)
}

test('carried only where it is not WHOLE_GAME: a whole-game condition element is exactly what it was', () => {
    const whole = resolvedWith(EVALUABLE_CONDITION_SCOPE)
    assert.equal(conditionsOf(whole.game).length, 4, 'origin, progression, control, exclusion')
    assert.ok(conditionsOf(whole.game).every(c => !Object.prototype.hasOwnProperty.call(c, 'scope')), 'no key, so a whole-game game assembles as it did before 15 October')
})

test('an episode-scoped condition carries its scope — key identity with the item that constitutes it', () => {
    const { game, input } = resolvedWith('BUILD_OUT_EPISODE')
    const rpc = input.contracts.find(c => c.contractId === RPC)!
    for (const condition of conditionsOf(game)) {
        const itemId = String(condition.elementId).split(':').pop()
        const item = rpc.items.find(i => i.itemId === itemId)!
        assert.equal(condition.scope, item.scope, `${condition.elementId}: the scope its item authored`)
    }
    assert.equal(conditionsOf(game).length, 4)
})

test('THE LOSS THIS ENDS: with the scope taken out again, the episode-scoped game is the whole-game game exactly', () => {
    // Before the engine change this held WITHOUT taking anything out (measured 15 October 2026, digests 0c18ea70
    // and 1f5e3cb5, identical otherwise). Now the scope keys are the only difference — so the scope is carried, and
    // nothing else about the game was changed to carry it.
    const whole = resolvedWith(EVALUABLE_CONDITION_SCOPE).game
    const episode = resolvedWith('BUILD_OUT_EPISODE').game
    assert.notEqual(JSON.stringify(episode.game), JSON.stringify(whole.game), 'the scope reaches the game')
    assert.equal(withoutScopes(episode), withoutScopes(whole), 'and it is the only difference in what the game says')
})

test('a condition whose item states no scope carries scope: null — not absent, which would read as whole-game', () => {
    const { game } = resolvedWith(null)
    assert.ok(conditionsOf(game).every(c => Object.prototype.hasOwnProperty.call(c, 'scope') && c.scope === null))
    assert.ok(conditionsOf(game).every(c => conditionScopeNotEvaluable(c)!.includes('states no scope')))
})

test('the one reading: only WHOLE_GAME (or no key) is evaluable by a reader that applies conditions to every score', () => {
    assert.equal(conditionScopeNotEvaluable({ elementId: 'c:T:1' }), null)
    assert.equal(conditionScopeNotEvaluable({ elementId: 'c:T:1', scope: 'WHOLE_GAME' }), null)
    assert.equal(conditionScopeNotEvaluable(undefined), null)
    for (const scope of ['BUILD_OUT_EPISODE', 'PER_TEAM', 'PER_OBJECTIVE_SET', 'OWN_INVOLVEMENT']) {
        assert.ok(conditionScopeNotEvaluable({ elementId: 'c:T:1', scope })!.includes(scope), `${scope} is not read as "every score" here (the joint-condition precedent in realize.ts)`)
    }
    assert.equal(CONDITION_ROW, 'V3')
})

test('the Pass Combination Gate\'s condition carries its authored PER_TEAM — the one non-whole-game condition in the corpus today', () => {
    const input = compose(['restated:GF2', 'blind:PASS-COMBINATION-GATE'])
    const result = runDerivation(input)
    assert.ok(!isStampedHalt(result))
    const staged: any = runStages0to10(input)
    const game: any = assembleResolvedGame(result as any, staged.classes, indexRegister(input.register), input.contracts)
    assert.deepEqual(conditionsOf(game).map(c => [c.elementId, c.scope]), [['c:blind:PASS-COMBINATION-GATE:PCG-02', 'PER_TEAM']])
})

// ── Gate A: GA-EPISODE-REACHABLE ─────────────────────────────────────────────────────────────────────────────

const episodeCheck = (gateA: any) => gateA.checks.find((c: any) => c.checkId === 'GA-EPISODE-REACHABLE')

test('GA-EPISODE-REACHABLE: no episode-scoped condition, a vacuous pass (SD-54)', () => {
    const check = episodeCheck(resolvedWith(EVALUABLE_CONDITION_SCOPE).staged.gates.gateA)
    assert.equal(check.verdict, 'PASS')
    assert.equal(check.clauses[0].basis, 'NO_APPLICABLE_INSTANCES')
})

test('GA-EPISODE-REACHABLE FAILS where the only transition is a possession change — the game has no build-out episode to bind to', () => {
    const { staged, game } = resolvedWith('BUILD_OUT_EPISODE')
    const check = episodeCheck(staged.gates.gateA)
    assert.equal(check.verdict, 'FAIL')
    assert.ok(check.why.includes('c:restated:GF2:GF2-07.a (a possession change begins an attacking episode, never a build-out one)'), check.why)
    assert.ok(game.coherence.failingChecks.includes('GA-EPISODE-REACHABLE'), 'named among the failing checks, so the refusal says which')
    assert.equal(game.coherence.realizationAuthorized, false)
})

test('GA-EPISODE-REACHABLE never passes a candidate it cannot judge: it defers on an open taker and withholds on a settled one', () => {
    // A TEST-ONLY transition element keyed on a trigger that is not a possession change, added to the gate context.
    const { staged } = resolvedWith('BUILD_OUT_EPISODE')
    const ctx = staged.gateContext
    const start: ElementClass = {
        classId: 'c:TEST-ONLY:START', row: 'T1', fromItem: { contractId: 'TEST-ONLY', itemId: 'START' }, supportedBy: [{ contractId: 'TEST-ONLY', itemId: 'START' }],
        constraints: { any: false, terms: [{ attribute: 'trigger', op: '=', value: 'START' }] } as any, cardinality: { min: 1, max: null },
    }
    const settled = runGates({ ...ctx, classes: [...ctx.classes, start] })
    assert.equal(episodeCheck(settled.gateA).verdict, 'NOT_EVALUABLE', 'no T3 line to read: the begin condition cannot be compared, so it is withheld, not passed')
    const classified = new Map(ctx.classified)
    classified.set('c:TEST-ONLY:START::T3', { lineId: 'c:TEST-ONLY:START::T3', verdict: 'FREE(choice)', lineState: 'ENUMERATED' } as any)
    const open = runGates({ ...ctx, classes: [...ctx.classes, start], classified })
    assert.equal(episodeCheck(open.gateA).verdict, 'DEFERRED_TO_REALIZATION', 'the taker is a choice realization still owes')
})

// ── C52, the same day: the build-out condition restated to the build-out episode, in production ──────────────

test('C52: the nine items of the build-out condition carry BUILD_OUT_EPISODE, and nothing else about them moved', () => {
    const rpc = loadCorpusContracts().find(c => c.contractId === RPC)!
    for (const id of CONDITION_ITEMS) assert.equal(rpc.items.find(i => i.itemId === id)?.scope, 'BUILD_OUT_EPISODE', id)
    // No other RPC-001 item is episode-scoped by this ruling (11.b was authored so; nothing else is).
    assert.deepEqual(rpc.items.filter(i => i.scope === 'BUILD_OUT_EPISODE').map(i => i.itemId).sort(), [...CONDITION_ITEMS, 'RPC-001-11.b'].sort())
})

test('C52, EXPECTED AND PINNED: Play Out from the Back is refused at Gate A naming the scope — no transition can begin a build-out episode', () => {
    // A01's real selection (GF2, its lenses, RPC-001; no library constraint under his general principle).
    const input = derivationInputFor(selectFor('A01', null))
    const staged: any = runStages0to10(input)
    const check = episodeCheck(staged.gates.gateA)
    assert.equal(check.verdict, 'FAIL')
    assert.ok(check.why.includes('BUILD_OUT_EPISODE') && check.why.includes('possession change begins an attacking episode, never a build-out one'), check.why)
    const result = runDerivation(input)
    assert.ok(!isStampedHalt(result))
    const game: any = assembleResolvedGame(result as any, staged.classes, indexRegister(input.register), input.contracts)
    assert.deepEqual(conditionsOf(game).map(c => c.scope), ['BUILD_OUT_EPISODE', 'BUILD_OUT_EPISODE', 'BUILD_OUT_EPISODE', 'BUILD_OUT_EPISODE'], 'the four conditions carry it into the resolved game')
    // What would move it: capability M3 (START and SCORE transition elements asserted from knowledge), which goes to
    // him first. The same composition with the goal-kick situation holds a restart transition whose taker is
    // unauthored, so there the check withholds (NOT_EVALUABLE) rather than fails — still never a pass.
    const withGoalKick: any = runStages0to10(compose(['restated:GF2', RPC, 'restated:A01-02']))
    assert.equal(episodeCheck(withGoalKick.gates.gateA).verdict, 'NOT_EVALUABLE')
    assert.deepEqual(episodeCheck(withGoalKick.gates.gateA).blockedBy, ['c:restated:A01-02:A01-02-01.a::T3'])
})

// ── Every downstream reader honours the scope or reports that it cannot ──────────────────────────────────────

const roles = Object.fromEntries(specializedRoleNames().map(r => [r, 0]))
const served = buildActivityFromKnowledge(['GF2'], { players: 12, lengthM: 40, widthM: 30, durationMin: 20, roles })
assert.ok(served.fixture, 'the bare possession game is served and gives a real fixture to build on')
const scopedCondition = { elementId: 'c:TEST-ONLY:C-1', type: 'progression', value: 'beyond', scope: 'BUILD_OUT_EPISODE' }
const withCondition = (condition: Record<string, unknown>) => {
    const fixture = JSON.parse(JSON.stringify(served.fixture))
    fixture.game.value.primaryEvent.conditions = [condition]
    return fixture
}
const approval = { who: 'TEST-ONLY', date: '2026-10-15', quote: 'TEST-ONLY', ccs: 'TEST-ONLY' }
const sentenceFor = [{ id: 'TEST-ONLY', covers: [{ row: 'V4', match: { equals: 'progression' } }], sentence: 'A test sentence', section: 'How to score' as const, approvedBy: approval }]

test('rendering: a scoped condition is withheld whole, scope included, even where an approved sentence covers its type', () => {
    const rendered = renderConcreteGame(withCondition(scopedCondition), sentenceFor)
    assert.ok(!rendered.instructions.some(i => i.text === 'A test sentence'), 'the sentence would state it for every score')
    const base = 'value.primaryEvent.conditions[c:TEST-ONLY:C-1]'
    assert.deepEqual(rendered.withheld.filter(w => w.path.startsWith(base)).map(w => [w.path, w.row]), [[`${base}.type`, 'V4'], [`${base}.value`, 'V6'], [`${base}.scope`, 'V3']])
    // The same condition authored for the whole game is said, as before.
    const { scope, ...whole } = scopedCondition
    assert.ok(renderConcreteGame(withCondition(whole), sentenceFor).instructions.some(i => i.text === 'A test sentence'), `whole-game (not ${scope}) is said`)
})

test('fidelity: an instruction that cites a scoped condition is a violation — the independent check on the renderer', () => {
    const fixture = withCondition(scopedCondition)
    const rendered = renderConcreteGame(fixture, sentenceFor)
    const forced = { ...rendered, instructions: [...rendered.instructions, { section: 'How to score' as const, text: 'A forced sentence', status: 'DERIVED' as const, from: ['value.primaryEvent.conditions[c:TEST-ONLY:C-1].type'], quantities: [] }] }
    const violations = checkFidelity(fixture, forced as any).findings.filter(f => f.severity === 'VIOLATION' && f.what.includes('A forced sentence'))
    assert.equal(violations.length, 1)
    assert.ok(violations[0].what.includes('BUILD_OUT_EPISODE'), violations[0].what)
    assert.equal(checkFidelity(fixture, rendered).findings.filter(f => f.what.includes('states a condition as a rule')).length, 0, 'the renderer itself says nothing of it')
})

test('the context-scoring guard: a scoped condition is present but cannot be confirmed to govern, and a dropped scope is named', () => {
    const rpc: any = JSON.parse(JSON.stringify(loadCorpusContracts().find(c => c.contractId === RPC)))
    for (const item of rpc.items) if (CONDITION_ITEMS.includes(item.itemId)) item.scope = 'BUILD_OUT_EPISODE'
    const conditions = (scope: string | undefined) =>
        ['18.a:origin', '18.c:progression', '18.f:control', '19.a:exclusion'].map(pair => {
            const [id, type] = pair.split(':')
            return { elementId: `c:${RPC}:RPC-001-${id}`, type, ...(scope === undefined ? {} : { scope }) }
        })
    const game = (scope: string | undefined) => ({ value: { primaryEvent: { value: 1, kind: 'line_crossed', conditions: conditions(scope) } } })
    const carried = contextScoringFindings('RPC-001', rpc, game('BUILD_OUT_EPISODE'), ['line_crossed'])
    assert.equal(carried.length, 4)
    assert.ok(carried.every(f => f.includes('cannot be confirmed to govern this game') && f.includes('BUILD_OUT_EPISODE')), JSON.stringify(carried))
    const dropped = contextScoringFindings('RPC-001', rpc, game(undefined), ['line_crossed'])
    assert.ok(dropped.every(f => f.includes('is authored for the BUILD_OUT_EPISODE scope and reached the realized game as "WHOLE_GAME"')), JSON.stringify(dropped))
})

test('realization: the scope must survive into the concrete game, and a scope the resolved game does not carry is an invention', () => {
    const resolved: any = { derived: [], notEstablished: [], game: { value: { primaryEvent: { conditions: [{ elementId: 'c:T:1', scope: 'BUILD_OUT_EPISODE' }] } } } }
    const record = { choices: [], geometry: [], instantiations: [], entailed: [] }
    const kept: any = { game: JSON.parse(JSON.stringify(resolved.game)), record }
    assert.deepEqual(nothingLost(resolved, kept), [])
    assert.deepEqual(nothingInvented(resolved, kept), [], 'carried, so accounted')
    const dropped: any = { game: { value: { primaryEvent: { conditions: [{ elementId: 'c:T:1' }] } } }, record }
    assert.deepEqual(nothingLost(resolved, dropped), ['value.primaryEvent.conditions[c:T:1].scope: authored "BUILD_OUT_EPISODE", concrete absent'])
    const widened: any = { game: { value: { primaryEvent: { conditions: [{ elementId: 'c:T:1', scope: 'WHOLE_GAME' }] } } }, record }
    assert.equal(nothingLost(resolved, widened).length, 1)
    assert.equal(nothingInvented(resolved, widened).length, 1, 'a scope other than the authored one traces to nothing')
})

console.log(`condition scope: ${passed} passed`)
