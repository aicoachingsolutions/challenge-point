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
import { contextScoringFindings, EPISODE_REACHABLE_CHECK, episodeConfirmed } from '../rendering/context-scoring-guard'
import { EPISODE_SCOPES } from './gates'
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
function resolvedWith(scope: string | null, ids: string[] = ['restated:GF2', RPC], untypedOrigin = false) {
    const input = compose(ids)
    input.contracts = JSON.parse(JSON.stringify(input.contracts))
    const rpc: any = input.contracts.find(c => c.contractId === RPC)
    // TEST-ONLY (stage K5): the origin's referent as it was before ruling C58 — two placement texts, no structural identity.
    if (untypedOrigin) rpc.items.find((i: any) => i.itemId === 'RPC-001-18.b').value = ["the goalkeeper's START/restart placement", 'a controlled defensive restart placement']
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
    //
    // **Re-pointed 15 October 2026 (stage K5) onto a copy whose begin condition is UNTYPED**, as it was until ruling C58: his
    // 18 October acknowledgement typed the origin's referent (RPC-001-18.b) as the restarts that begin a build-out episode,
    // and with it held the check decides rather than withholds (starts-and-restarts.unit.ts). The untyped path — any context
    // whose begin condition is placement text — still behaves exactly as pinned here, so the copy restores 18.b's original
    // value (TEST-ONLY) and nothing else. Under C58 the same element, with no play state or episode line to read, blocks
    // (pinned at the end).
    const { staged } = resolvedWith('BUILD_OUT_EPISODE', ['restated:GF2', RPC], true)
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
    // Typed (production, C58): an element with no play state or episode line cannot be shown to meet the begin condition.
    const typed = resolvedWith('BUILD_OUT_EPISODE').staged.gateContext
    assert.equal(episodeCheck(runGates({ ...typed, classes: [...typed.classes, start] }).gateA).verdict, 'NOT_EVALUABLE')
})

// ── C52, the same day: the build-out condition restated to the build-out episode, in production ──────────────

test('C52: the nine items of the build-out condition carry BUILD_OUT_EPISODE, and nothing else about them moved', () => {
    const rpc = loadCorpusContracts().find(c => c.contractId === RPC)!
    for (const id of CONDITION_ITEMS) assert.equal(rpc.items.find(i => i.itemId === id)?.scope, 'BUILD_OUT_EPISODE', id)
    // No other RPC-001 item is episode-scoped by this ruling (11.b was authored so; nothing else is).
    // **Since stage K1 (15 October 2026), two more, by another ruling and in the same scope:** C57's referents of the
    // control condition and the long-clearance exclusion (18.h, 19.c) — his M8, "Apply the qualifying conditions to the
    // target and scoring episode actually being evaluated" — take the scope of the conditions they belong to.
    assert.deepEqual(rpc.items.filter(i => i.scope === 'BUILD_OUT_EPISODE').map(i => i.itemId).sort(), [...CONDITION_ITEMS, 'RPC-001-11.b', 'RPC-001-18.h', 'RPC-001-19.c'].sort())
})

test('C52, EXPECTED AND PINNED: Play Out from the Back is refused at Gate A naming the scope — no transition can begin a build-out episode', () => {
    // A01's real selection (GF2, its lenses, RPC-001; no library constraint under his general principle).
    //
    // **Re-pointed 15 October 2026 (stage K5): the stop moved, as predicted — the work succeeding.** A01's selection now carries
    // the provisional realization A01-R1 (its record names it), whose start, after-score and coach-judged restarts begin the
    // build-out episode under the begin condition C58 types; GA-EPISODE-REACHABLE passes in each role block
    // (starts-and-restarts.unit.ts). The FAIL this test pinned is kept where it still holds: the possession game with the
    // context and NO realization — no transition but the possession change.
    const selection = derivationInputFor(selectFor('A01', null))
    const input = { ...selection, contracts: selection.contracts.filter(c => !c.contractId.startsWith('provisional:')) }
    const staged: any = runStages0to10(input)
    const check = episodeCheck(staged.gates.gateA)
    assert.equal(check.verdict, 'FAIL')
    assert.ok(check.why.includes('BUILD_OUT_EPISODE') && check.why.includes('possession change begins an attacking episode, never a build-out one'), check.why)
    assert.ok(selection.contracts.some(c => c.contractId === 'provisional:A01-R1'), "A01's own selection carries the realization")
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

/**
 * ── Stage K7, 15 October 2026: the guard confirms an episode-scoped condition where the concrete game begins its episode ──────
 *
 * The K6 review measured A01 stopping at validation on this guard with no decision of his behind it, and named what would move it.
 * K7 built it (context-scoring-guard.ts `episodeConfirmed`): his 16 October 9.3 approves the scope, and the Gate A check deciding the
 * episode, rerun on the concrete game, shows the game begins it. Pinned here: exactly that confirms, and nothing weaker.
 */
test('the context-scoring guard confirms an episode-scoped condition only where the concrete game begins that episode (stage K7)', () => {
    const rpc: any = JSON.parse(JSON.stringify(loadCorpusContracts().find(c => c.contractId === RPC)))
    for (const item of rpc.items) if (CONDITION_ITEMS.includes(item.itemId)) item.scope = 'BUILD_OUT_EPISODE'
    const conditions = (scope: string | undefined) =>
        ['18.a:origin', '18.c:progression', '18.f:control', '19.a:exclusion'].map(pair => {
            const [id, type] = pair.split(':')
            return { elementId: `c:${RPC}:RPC-001-${id}`, type, ...(scope === undefined ? {} : { scope }) }
        })
    const game = (scope: string | undefined) => ({ value: { primaryEvent: { value: 1, kind: 'line_crossed', conditions: conditions(scope) } } })
    const clause = (verdict: string, extra: Record<string, unknown> = {}) => ({ clause: 'TEST-ONLY', verdict, basis: 'EVALUATED', instances: 4, ...extra })
    const checkWith = (verdict: string, clauses: any[], checkId = EPISODE_REACHABLE_CHECK): any => ({ checkId, verdict, subjects: [], why: 'TEST-ONLY', clauses, pendingOn: [], blockedBy: [] })
    const passing = checkWith('PASS', [clause('PASS'), clause('PASS'), clause('PASS')])
    assert.deepEqual(contextScoringFindings('RPC-001', rpc, game('BUILD_OUT_EPISODE'), ['line_crossed'], passing), [], 'carried with its scope, and the game begins its episode: confirmed')
    const unconfirmed = (check: any) => contextScoringFindings('RPC-001', rpc, game('BUILD_OUT_EPISODE'), ['line_crossed'], check)
    for (const [why, check] of [
        ['no check given', undefined],
        ['deferred', checkWith('DEFERRED_TO_REALIZATION', [clause('DEFERRED_TO_REALIZATION'), clause('PASS'), clause('PASS')])],
        ['withheld', checkWith('NOT_EVALUABLE', [clause('NOT_EVALUABLE'), clause('NOT_EVALUABLE'), clause('PASS')])],
        ['a second awardee', checkWith('FAIL', [clause('PASS'), clause('FAIL'), clause('PASS')])],
        ['a vacuous pass', checkWith('PASS', [clause('PASS', { basis: 'NO_APPLICABLE_INSTANCES', instances: 0 }), clause('PASS'), clause('PASS')])],
        ['another check', checkWith('PASS', [clause('PASS'), clause('PASS'), clause('PASS')], 'GA-TRIGGER-REACHABLE')],
        ['a PASS verdict over a failing clause', checkWith('PASS', [clause('PASS'), clause('FAIL'), clause('PASS')])],
    ] as [string, any][]) {
        const found = unconfirmed(check)
        assert.equal(found.length, 4, `${why}: nothing is confirmed`)
        assert.ok(found.every(f => f.includes('cannot be confirmed to govern this game')), `${why}: ${JSON.stringify(found)}`)
    }
    // A dropped scope is named even where the episode is begun: present is not carried with its authored scope.
    const dropped = contextScoringFindings('RPC-001', rpc, game(undefined), ['line_crossed'], passing)
    assert.ok(dropped.length === 4 && dropped.every(f => f.includes('reached the realized game as "WHOLE_GAME"')), JSON.stringify(dropped))
    // A scope the episode check does not decide is never confirmed by it (PER_TEAM, the gate condition's own scope).
    for (const item of rpc.items) if (CONDITION_ITEMS.includes(item.itemId)) item.scope = 'PER_TEAM'
    assert.equal(contextScoringFindings('RPC-001', rpc, game('PER_TEAM'), ['line_crossed'], passing).length, 4, 'only an episode scope the check decides')
    assert.deepEqual(EPISODE_SCOPES, ['BUILD_OUT_EPISODE'])
    assert.equal(episodeConfirmed('BUILD_OUT_EPISODE', passing), true)
    // The event is still read first: an unapproved event is named whatever the episode check says.
    for (const item of rpc.items) if (CONDITION_ITEMS.includes(item.itemId)) item.scope = 'BUILD_OUT_EPISODE'
    assert.equal(contextScoringFindings('RPC-001', rpc, game('BUILD_OUT_EPISODE'), ['regain'], passing).length, 1)
})

/**
 * ── Stage K7 (design step B2, as the verification g-part-08 corrected it): a scoped condition said by an approved sentence carrying
 * its exact scope, and only so ──────────────────────────────────────────────────────────────────────────────────────────────────
 */
test('B2: a scoped condition is said only by an approved entry covering its exact scope, and fidelity admits only that sentence', () => {
    const base = 'value.primaryEvent.conditions[c:TEST-ONLY:C-1]'
    const scoped = (scope: unknown) => [
        { id: 'TEST-ONLY-SCOPED', covers: [{ row: 'V3', match: { equals: scope } }, { row: 'V4', match: { equals: 'progression' } }, { row: 'V6', match: { equals: 'beyond' } }], sentence: 'In a TEST-ONLY episode, a test sentence', section: 'How to score' as const, approvedBy: approval },
    ]
    const fixture = withCondition(scopedCondition)
    const rendered = renderConcreteGame(fixture, scoped('BUILD_OUT_EPISODE') as any)
    const said = rendered.instructions.find(i => i.text === 'In a TEST-ONLY episode, a test sentence')
    assert.ok(said, 'said by the entry covering its exact scope')
    assert.deepEqual([...said!.from].sort(), [`${base}.scope`, `${base}.type`, `${base}.value`].sort(), 'it cites the scope with the fields it covers')
    assert.deepEqual(rendered.withheld.filter(w => w.path.startsWith(base)), [], 'nothing of it withheld')
    assert.deepEqual(checkFidelity(fixture, rendered, scoped('BUILD_OUT_EPISODE') as any).findings.filter(f => f.severity === 'VIOLATION' && f.what.includes('states a condition as a rule')), [], 'fidelity admits the approved sentence')
    // The same sentence checked against the real (empty) table is not approved wording, so it is refused: the check reads the table.
    assert.equal(checkFidelity(fixture, rendered).findings.filter(f => f.severity === 'VIOLATION' && f.what.includes('In a TEST-ONLY episode')).length, 1)
    // A cover of another scope, or a scope cover that is not an exact value, leaves it withheld whole, as before B2.
    for (const other of ['WHOLE_GAME', 'TEST-ONLY-EPISODE']) {
        const again = renderConcreteGame(fixture, scoped(other) as any)
        assert.ok(!again.instructions.some(i => i.text.includes('TEST-ONLY episode')), other)
        assert.deepEqual(again.withheld.filter(w => w.path.startsWith(base)).map(w => w.row), ['V4', 'V6', 'V3'], other)
    }
    const notExact = [{ ...scoped('BUILD_OUT_EPISODE')[0], covers: [{ row: 'V3', match: { refersToOwnCondition: true } }, { row: 'V4', match: { equals: 'progression' } }] }]
    assert.ok(!renderConcreteGame(fixture, notExact as any).instructions.some(i => i.text.includes('TEST-ONLY episode')), 'only an exact value covers a scope')
    // A citation alone never satisfies the guard: a sentence citing the condition AND its scope that is not approved wording is refused.
    const forced = { ...rendered, instructions: [...rendered.instructions, { section: 'How to score' as const, text: 'A forced sentence', status: 'DERIVED' as const, from: [`${base}.type`, `${base}.scope`], quantities: [] }] }
    assert.equal(checkFidelity(fixture, forced as any, scoped('BUILD_OUT_EPISODE') as any).findings.filter(f => f.severity === 'VIOLATION' && f.what.includes('A forced sentence') && f.what.includes('states a condition')).length, 1)
    // A whole-game condition carries no scope field, so B2 moves nothing for it.
    const { scope, ...whole } = scopedCondition
    assert.ok(renderConcreteGame(withCondition(whole), sentenceFor).instructions.some(i => i.text === 'A test sentence'), `whole-game (not ${scope}) is said as before`)
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
