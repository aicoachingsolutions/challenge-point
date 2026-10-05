/**
 * **A transition must be keyed on a structurally reachable trigger, and a clause must report its own unit.**
 * His rulings of 5 October, two separate things that this file keeps separate:
 *
 *   > *SD-44 supersedes RC-19 wherever the two conflict. A trigger is reachable only when the resolved game
 *   > contains the structural prerequisites necessary for that trigger to occur. So POSSESSION_CHANGE is not
 *   > unconditional merely because the trigger exists in the grammar. In soccer, possession is a relationship
 *   > involving the ball; a possession change therefore cannot be considered structurally reachable when the
 *   > resolved game does not establish the prerequisites for that relationship.*
 *
 *   > *If the clause's unit is transition pairs, the early-return path must report the number of applicable
 *   > pairs, not the number of transitions. With one transition and zero comparisons, that should surface as
 *   > NO_APPLICABLE_INSTANCES, including in clausesVacuous.*
 *
 * **And the correction he asked to have preserved.** An earlier report of mine named GA-TRIGGER-UNIQUE's
 * early return as the reason A04's unreachable trigger went unflagged. Every fact in that was true and the
 * implication was false: `triggerOf`'s value is compared only to another transition's trigger, and the check
 * never reads the reachable set at all, so removing the guard would have caught nothing. The missing
 * enforcement was the absence of any comparison between a transition's trigger and the reachable set. A test
 * below pins that distinction so it cannot be re-blurred.
 *
 * Run: npm test
 */
import assert from 'node:assert/strict'

import { corpusInput, loadRegister } from './corpus'
import { runDerivation, runStages0to10 } from './engine'
import { derivationInputFor, selectFor } from './run-bounded-selection'
import { ContractItem, DerivationInput, LoadedContract } from './types'

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

const REGISTER = loadRegister()

const item = (overrides: Partial<ContractItem> = {}): ContractItem => ({
    itemId: 'I-1',
    row: 'T1',
    selector: 'trigger=START',
    requirement: 'EXISTS',
    value: 'a transition',
    strictness: 'REQUIRED',
    valueStatus: 'N/A',
    scope: 'WHOLE_GAME',
    basis: 'AUTHORED',
    basisEvidence: { quote: 'a transition', sourceId: 'SRC-1' },
    checkability: 'STRUCTURAL',
    ...overrides,
})

const contract = (items: ContractItem[]): LoadedContract => ({
    contractId: 'C-1',
    objectId: 'O-1',
    knowledgeVersion: '1',
    items,
    declarations: [],
})

const input = (contracts: LoadedContract[]): DerivationInput => ({
    selection: contracts.map(c => ({ objectId: c.objectId, knowledgeVersion: '1' })),
    contracts,
    envelope: { players: 12, lengthM: 40, widthM: 30, durationMin: 20 },
    register: REGISTER,
    derivationRules: { version: 'rev-5' },
})

const check = (result: any, checkId: string) => result.gates.gateA.checks.find((c: any) => c.checkId === checkId)
const clauseOf = (result: any, checkId: string) => check(result, checkId).clauses[0]
/**
 * A team and a ball: the structural prerequisites SD-44 requires for a possession change.
 *
 * P1's only registered selector attribute is `team` — my first version of this fixture used
 * `designation`, which formed no class at all and raised nothing, so the test failed and was right to.
 * Worth keeping the note: a selector naming an unregistered attribute is dropped silently here.
 */
const TEAM_AND_BALL = [
    item({ itemId: 'P-1', row: 'P1', selector: 'team=ATTACKING_TEAM', value: 'a team' }),
    item({ itemId: 'O-B', row: 'O1', selector: 'kind=ball', requirement: 'COUNT', value: '1', valueStatus: 'REQUIRED_RANGE' }),
]

// ── The check is registered ────────────────────────────────────────────────────────────────────────
test('GA-TRIGGER-REACHABLE is one of the Gate A checks, and it is named in failingChecks when it fails', () => {
    const result: any = runStages0to10(corpusInput())
    const ids = result.gates.gateA.checks.map((c: any) => c.checkId)
    assert.ok(ids.includes('GA-TRIGGER-REACHABLE'), 'the obligation must be a named check, not a clause folded into a neighbour')
    // Why a check of its own: failingChecks is a list of checkIds, so only a dedicated id can make this
    // failure legible. Folded into GA-TRANSITION-COHERENCE it would never name the trigger.
    const a04: any = runDerivation(derivationInputFor(selectFor('A04', null)))
    const failing = a04.gates.gateA.checks.filter((c: any) => c.clauses.some((l: any) => l.verdict === 'FAIL')).map((c: any) => c.checkId)
    assert.ok(failing.includes('GA-TRIGGER-REACHABLE'), 'A04 must fail by name')
})

// ── HIS RULING: a possession change needs the ball ─────────────────────────────────────────────────
test("SD-44: a POSSESSION_CHANGE transition FAILS where no ball establishes possession's prerequisites", () => {
    const result: any = runStages0to10(input([contract([item({ itemId: 'T-A', selector: 'trigger=POSSESSION_CHANGE' })])]))
    const clause = clauseOf(result, 'GA-TRIGGER-REACHABLE')
    assert.equal(clause.verdict, 'FAIL', 'the trigger is in the vocabulary, and the game lacks its prerequisites')
    assert.match(check(result, 'GA-TRIGGER-REACHABLE').why, /POSSESSION_CHANGE/)
    assert.match(check(result, 'GA-TRIGGER-REACHABLE').why, /not reachable/)
})

/**
 * **The same fixture passes once the prerequisites exist — the value forced through in both directions.**
 * Without this, a check that failed everything would look identical to one that worked. The corpus could not
 * supply the contrast on its own: with no practice situation selected, every transition in every one of the
 * thirteen goals is on an unreachable trigger, so there is no passing case to compare against.
 */
test('SD-44: and the SAME transition PASSES once a team and a ball are established', () => {
    const result: any = runStages0to10(input([contract([item({ itemId: 'T-A', selector: 'trigger=POSSESSION_CHANGE' }), ...TEAM_AND_BALL])]))
    const clause = clauseOf(result, 'GA-TRIGGER-REACHABLE')
    assert.equal(clause.verdict, 'PASS', 'a team and a ball are the prerequisites SD-44 names')
    assert.equal(clause.basis, 'EVALUATED')
    assert.equal(clause.instances, 1)
})

test('a transition on a trigger that exists by construction passes without any object', () => {
    const clause = clauseOf(runStages0to10(input([contract([item({ itemId: 'T-A', selector: 'trigger=START' })])])) as any, 'GA-TRIGGER-REACHABLE')
    assert.equal(clause.verdict, 'PASS')
    assert.equal(clause.basis, 'EVALUATED', 'START is reachable for any playable game, and that is real evidence')
})

/** Gap before collision (SD-28): a trigger the check cannot read is not a trigger it may condemn. */
test('a trigger not fixed by an `=` term is NOT_EVALUABLE, never a failure', () => {
    const result: any = runStages0to10(input([contract([item({ itemId: 'T-A', selector: 'trigger ∈ {START, SCORE}' })])]))
    const clause = clauseOf(result, 'GA-TRIGGER-REACHABLE')
    assert.ok(clause.verdict === 'NOT_EVALUABLE' || clause.verdict === 'PASS', `undecidable must not FAIL; got ${clause.verdict}`)
    assert.notEqual(clause.verdict, 'FAIL', 'the check may not condemn a trigger it cannot read')
})

test('a game with no transition passes vacuously, and says so', () => {
    const clause = clauseOf(runStages0to10(input([contract([item({ itemId: 'S-1', row: 'S2', selector: 'noun=channel', value: 'a channel' })])])) as any, 'GA-TRIGGER-REACHABLE')
    assert.equal(clause.verdict, 'PASS')
    assert.equal(clause.basis, 'NO_APPLICABLE_INSTANCES', 'no transition is not evidence of reachability')
})

// ── THE POSITIVE CONTROL HE NAMED, measured on real knowledge ──────────────────────────────────────
//
// A01 with "From Goal Kicks" is the one corpus case whose transitions are all reachable: A01-02-08.a
// authors "none (at least one ball)" as AUTHORED/REQUIRED, a ball class forms, and POSSESSION_CHANGE
// becomes reachable. It is what makes the new check falsifiable against authored knowledge rather than
// only against a synthetic fixture.
test('POSITIVE CONTROL: A01 + From Goal Kicks establishes a ball, and every transition is reachable', () => {
    const result: any = runDerivation(derivationInputFor(selectFor('A01', 'A01-02')))
    const staged: any = runStages0to10(derivationInputFor(selectFor('A01', 'A01-02')))
    assert.ok(staged.triggers.includes('POSSESSION_CHANGE'), 'the authored ball makes the trigger reachable')
    const clause = clauseOf(result, 'GA-TRIGGER-REACHABLE')
    assert.equal(clause.verdict, 'PASS')
    assert.equal(clause.basis, 'EVALUATED')
    assert.ok(clause.instances >= 2, `both of its transitions were checked; got ${clause.instances}`)
    const failing = result.gates.gateA.checks.filter((c: any) => c.clauses.some((l: any) => l.verdict === 'FAIL')).map((c: any) => c.checkId)
    assert.ok(!failing.includes('GA-TRIGGER-REACHABLE'), 'the control must not be collateral damage')
})

// ── The same goal WITHOUT the situation fails: the defect is the knowledge, not the goal ───────────
test('A01 without a practice situation has no ball, and the same transition is then unreachable', () => {
    const clause = clauseOf(runDerivation(derivationInputFor(selectFor('A01', null))) as any, 'GA-TRIGGER-REACHABLE')
    assert.equal(clause.verdict, 'FAIL', 'the goal is the same; only the established knowledge differs')
})

/** Not scoped to one row: the same defect was authored in two unrelated game forms. */
test('the check is general — it catches the defect in GF4 as well as GF2', () => {
    for (const goal of ['A04', 'A05', 'D03', 'TD02']) {
        const result: any = runDerivation(derivationInputFor(selectFor(goal, null)))
        assert.equal(clauseOf(result, 'GA-TRIGGER-REACHABLE').verdict, 'FAIL', `${goal} must fail`)
    }
    const a04: any = runDerivation(derivationInputFor(selectFor('A04', null)))
    const d03: any = runDerivation(derivationInputFor(selectFor('D03', null)))
    assert.match(check(a04, 'GA-TRIGGER-REACHABLE').why, /GF2/, 'A04 fails on GF2 knowledge')
    assert.match(check(d03, 'GA-TRIGGER-REACHABLE').why, /GF4/, 'D03 fails on GF4 knowledge — a one-row repair would have missed it')
})

// =================================================================================================
// HIS SECOND RULING — the clause-unit evidence defect in GA-TRIGGER-UNIQUE.
// =================================================================================================

/**
 * The compatibility clause's unit is PAIRS. The early return reported `transitions.length`, so with one
 * transition it claimed `EVALUATED, instances: 1` having compared no pair — and that is what kept it out of
 * the `clausesVacuous` tally built to surface exactly this (SD-54).
 */
test('one transition: the compatibility clause reports ZERO pairs and NO_APPLICABLE_INSTANCES', () => {
    const result: any = runStages0to10(input([contract([item({ itemId: 'T-A', selector: 'trigger=START' })])]))
    const uniq = check(result, 'GA-TRIGGER-UNIQUE')
    const compat = uniq.clauses.find((c: any) => /mutually compatible/.test(c.clause))
    assert.equal(compat.verdict, 'PASS')
    assert.equal(compat.instances, 0, 'no pair exists, so no pair was compared')
    assert.equal(compat.basis, 'NO_APPLICABLE_INSTANCES', 'it must not claim to have evaluated an instance')
})

test('and that vacuous pass is counted as vacuous rather than as evidence', () => {
    const result: any = runStages0to10(input([contract([item({ itemId: 'T-A', selector: 'trigger=START' })])]))
    const vacuous = result.gates.gateA.evidence.clausesVacuous
    const evaluated = result.gates.gateA.evidence.clausesEvaluated
    assert.ok(vacuous > 0 && evaluated >= 0, 'the split exists')
    const compat = check(result, 'GA-TRIGGER-UNIQUE').clauses.find((c: any) => /mutually compatible/.test(c.clause))
    assert.equal(compat.basis, 'NO_APPLICABLE_INSTANCES', 'so the tally above includes it')
})

/**
 * **The latent failure the early return was hiding.** `collided` is computed per transition LINE, not per
 * pair, so it is well defined for a single transition — and the early return returned a PASS for it without
 * ever computing it. No corpus case has an `UNRESOLVED` line on a transition class today, so this was latent;
 * forcing one proves the clause now reports it instead of passing.
 */
test('one transition with a collided line now FAILS the collision clause instead of passing unexamined', () => {
    const result: any = runStages0to10(
        input([
            contract([
                item({ itemId: 'T-A', selector: 'trigger=START' }),
                item({ itemId: 'T-M1', row: 'T6', selector: 'trigger=START', requirement: 'EQUALS', value: 'CONTINUE' }),
                item({ itemId: 'T-M2', row: 'T6', selector: 'trigger=START', requirement: 'EQUALS', value: 'STOP_RESUME' }),
            ]),
        ]),
    )
    const collides = check(result, 'GA-TRIGGER-UNIQUE').clauses.find((c: any) => /collides/.test(c.clause))
    assert.equal(collides.verdict, 'FAIL', 'one transition can collide with itself on a line; the old path never looked')
})

/**
 * **The corrected causal account, pinned.** On a fixture whose only transition is on an unreachable trigger,
 * GA-TRIGGER-UNIQUE PASSES and GA-TRIGGER-REACHABLE FAILS. Removing the early return did not and could not
 * provide reachability enforcement — the two obligations are separate, and only the second one reads the
 * reachable set.
 */
test('GA-TRIGGER-UNIQUE is silent about reachability, and GA-TRIGGER-REACHABLE is what reports it', () => {
    const result: any = runStages0to10(input([contract([item({ itemId: 'T-A', selector: 'trigger=POSSESSION_CHANGE' })])]))
    const uniq = check(result, 'GA-TRIGGER-UNIQUE')
    assert.ok(
        uniq.clauses.every((c: any) => c.verdict !== 'FAIL'),
        'compatibility and collision say nothing about whether the trigger can occur',
    )
    assert.ok(
        !/reachab/i.test(JSON.stringify(uniq)),
        'and it must not start claiming to, now that the guard is gone',
    )
    assert.equal(clauseOf(result, 'GA-TRIGGER-REACHABLE').verdict, 'FAIL', 'the obligation lives here')
})

console.log(`trigger-reachability: ${passed} passed`)
