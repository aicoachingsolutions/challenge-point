/**
 * **What satisfies a value modifier's condition, what ends the modification, and an exclusion that can
 * finally be violated.** Christian's rulings of 7 October, implemented as `V8c`, `V8d`, and a general
 * treatment for exclusions that forbid a VALUE rather than an existence.
 *
 *   > *Please implement the smallest general representation necessary for an existing value modifier to carry
 *   > the criterion that satisfies it and the condition governing its persistence/termination. Do not
 *   > special-case A04 or Wide Zone. If criterion and persistence cannot truthfully be represented as one
 *   > field, keep them distinct rather than compressing semantics merely to minimize schema.*
 *
 *   > *Please repair the bounded enforcement defect you found for the authored exclusion preventing a
 *   > primary-event condition from naming a wide channel. Preserve a regression case demonstrating that the
 *   > exclusion actually changes the verdict when violated.*
 *
 * **The regression case he asked for is the three-way test below, and it is three-way on purpose.** Before the
 * repair, naming a forbidden channel and naming a permitted line produced the SAME verdict — SATISFIED, with
 * the reason "the line it reaches is entailed", because the exclusion's own forbidden value was compared with
 * nothing. A two-case test would have passed against that defect: it reported SATISFIED when respected, which
 * is correct, and SATISFIED when violated, which is the bug. Only a case that VIOLATES it can tell the two
 * apart, which is what "actually changes the verdict when violated" asks for.
 *
 * Run: npm test
 */
import assert from 'node:assert/strict'

import { runDerivation, runStages0to10 } from './engine'
import { derivationInputFor, selectFor } from './run-bounded-selection'
import { ContractItem, DerivationInput } from './types'

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

const base = derivationInputFor(selectFor('A04', null))
const MODIFIER = 'c:restated:WIDE-ZONE-ADVANTAGE:WIDEZONE-18.a'
const CHANNEL = 'c:restated:WIDE-ZONE-ADVANTAGE:WIDEZONE-02.a'
const SCORING_LINE = 'c:restated:GF2:GF2-03.a'

const probeItem = (o: Partial<ContractItem>): ContractItem =>
    ({
        itemId: 'PROBE',
        row: 'V3',
        selector: '*',
        requirement: 'EXISTS',
        value: 'v',
        strictness: 'REQUIRED',
        valueStatus: 'N/A',
        scope: 'WHOLE_GAME',
        basis: 'AUTHORED',
        basisEvidence: { quote: 'constructed for this test', sourceId: 'TEST' },
        checkability: 'STRUCTURAL',
        structuralClause: 'whole item',
        ...o,
    }) as ContractItem

/** A04, with extra items spliced into the Wide Zone contract — the object that carries the exclusion. */
const withItems = (extra: ContractItem[], edit?: (i: ContractItem) => ContractItem): DerivationInput => ({
    ...base,
    contracts: base.contracts.map(c =>
        !/WIDE/.test(c.contractId) ? c : { ...c, items: [...(edit ? c.items.map(edit) : c.items), ...extra] },
    ),
})

/** A primary-event condition whose single referent is whatever is under test. */
const conditionNaming = (referent: string): ContractItem[] => [
    probeItem({ itemId: 'PROBE-COND', row: 'V3', selector: 'type=origin', requirement: 'EXISTS', value: 'a primary-event condition' }),
    probeItem({ itemId: 'PROBE-TYPE', row: 'V4', selector: 'type=origin', requirement: 'EQUALS', value: 'origin', valueStatus: 'REQUIRED_RANGE' }),
    probeItem({ itemId: 'PROBE-REF', row: 'V5', selector: 'type=origin', requirement: 'EQUALS', value: referent, valueStatus: 'REQUIRED_RANGE' }),
]

const outcomeOf = (input: DerivationInput, itemId: string) =>
    (runStages0to10(input) as any).forward.find((o: any) => o.item?.itemId === itemId)

// ── THE REGRESSION CASE HE ASKED FOR ──────────────────────────────────────────────────────────────

test('EXCLUSION: naming a forbidden wide channel is UNMET, and the report names what it forbids', () => {
    const outcome = outcomeOf(withItems(conditionNaming(CHANNEL)), 'WIDEZONE-08.c')
    assert.equal(outcome.result, 'UNMET', `the exclusion must be violated; got ${outcome.result}: ${outcome.why}`)
    assert.match(String(outcome.why), /WIDEZONE-02\.a/, 'and say which values it forbids')
    assert.ok(outcome.reach.length, 'naming the line that breached it, so the finding is actionable')
})

test('EXCLUSION: naming a permitted referent is SATISFIED — and that is a DIFFERENT verdict', () => {
    const violated = outcomeOf(withItems(conditionNaming(CHANNEL)), 'WIDEZONE-08.c')
    const respected = outcomeOf(withItems(conditionNaming(SCORING_LINE)), 'WIDEZONE-08.c')
    assert.equal(respected.result, 'SATISFIED', `naming the scoring line is permitted; got ${respected.result}`)
    assert.notEqual(
        violated.result,
        respected.result,
        'THE WHOLE POINT: before the repair both were SATISFIED, so the exclusion reported a compliance it never checked',
    )
})

test('EXCLUSION: with nothing in scope to compare, it is NOT_EVALUABLE rather than satisfied', () => {
    // A04 as it stands authors no primary-event condition at all, so no V5 line exists.
    const outcome = outcomeOf(base, 'WIDEZONE-08.c')
    assert.equal(outcome.result, 'NOT_EVALUABLE', `got ${outcome.result}: ${outcome.why}`)
    assert.match(String(outcome.why), /nothing can carry a forbidden value/)
})

/**
 * **The general mechanism refuses to read a bound out of prose (SD-32, and SD-86's precedent).** Strip the
 * typed `forbiddenValues` and the exclusion stops being evaluable — it does not fall back to guessing from the
 * authored sentence, and it does not quietly report SATISFIED, which is the failure mode being repaired.
 */
test('EXCLUSION: without a TYPED forbidden value it is NOT_EVALUABLE, never satisfied by default', () => {
    const untyped = withItems(conditionNaming(CHANNEL), item =>
        item.itemId === 'WIDEZONE-08.c' ? ({ ...item, forbiddenValues: undefined } as any) : item,
    )
    const outcome = outcomeOf(untyped, 'WIDEZONE-08.c')
    assert.equal(outcome.result, 'NOT_EVALUABLE', `got ${outcome.result}: ${outcome.why}`)
    assert.match(String(outcome.why), /stated in prose/, 'and it says why it cannot be compared')
})

// ── V8c AND V8d: the criterion and the termination ────────────────────────────────────────────────

test('the criterion and the termination both derive, and both reach the resolved game', () => {
    const result: any = runDerivation(base)
    const lineValue = (row: string) => result.resolution.find((e: any) => e.lineId === `${MODIFIER}::${row}`)
    const criterion = lineValue('V8c')
    const ends = lineValue('V8d')
    assert.equal(criterion?.verdict, 'RESOLVED:ENTAILED', 'the criterion is entailed by an owner ruling')
    assert.match(String(criterion?.value), /touch/, 'and it is the touch his ruling settled')
    assert.match(String(criterion?.value), /retains possession/, 'including what "controlled" means')
    assert.equal(ends?.verdict, 'RESOLVED:ENTAILED')
    assert.equal(ends?.value, 'POSSESSION_CHANGE', 'a possession change ends the modification')
})

/**
 * **Two fields and not one, which is his instruction and not a filing preference.** The criterion is a
 * qualitative term naming a kind of occurrence nothing can check; the termination is a registered trigger the
 * engine checks for reachability. This asserts they stay separately addressable, because compressing them
 * would have to type the pair as the weaker of the two and would discard that check.
 */
test('criterion and termination are distinct fields, on distinct rows', () => {
    const staged: any = runStages0to10(base)
    const rows = [...staged.classified.keys()].filter((k: string) => k.startsWith(`${MODIFIER}::V8`))
    assert.ok(rows.includes(`${MODIFIER}::V8c`), 'the criterion has its own line')
    assert.ok(rows.includes(`${MODIFIER}::V8d`), 'and the termination has its own')
    assert.equal(staged.classified.get(`${MODIFIER}::V8c`).verdict, 'RESOLVED:ENTAILED')
    assert.equal(staged.classified.get(`${MODIFIER}::V8d`).verdict, 'RESOLVED:ENTAILED')
})

// ── A MODIFICATION THAT PERSISTS MUST BE ABLE TO END ──────────────────────────────────────────────

const endsClause = (input: DerivationInput) => {
    const result: any = runDerivation(input)
    const check = result.gates.gateA.checks.find((c: any) => c.checkId === 'GA-MODIFIER-OVERLAP')
    return { check, clause: check.clauses.find((c: any) => /termination/.test(c.clause)) }
}

test('a termination on a reachable trigger passes, and the clause says it ranged over one', () => {
    const { clause } = endsClause(base)
    assert.ok(clause, 'the clause is reported on every run')
    assert.equal(clause.verdict, 'PASS')
    assert.equal(clause.instances, 1, 'one modifier states a termination')
})

/**
 * **CONTROL.** The same modifier terminating on a trigger this game never constructs. `COMPLETED_PASS` is in
 * the vocabulary and `constructTriggers` never emits it, so a modification ending on it would never end —
 * the indefinite stored entitlement his Coupled criterion forbids, and invisible without this clause.
 */
test('CONTROL — a termination on an unreachable trigger FAILS, and names the modifier and the trigger', () => {
    const unreachable = withItems([], item => (item.row === 'V8d' ? { ...item, value: 'COMPLETED_PASS' } : item))
    const { check, clause } = endsClause(unreachable)
    assert.equal(clause.verdict, 'FAIL')
    assert.equal(check.verdict, 'FAIL', 'and it brings the check down with it')
    assert.match(String(check.why), /COMPLETED_PASS/, 'the report names the trigger')
    assert.match(String(check.why), /WIDEZONE-18\.a/, 'and the modifier')
})

/**
 * **An absent termination is not a failure**, which is what keeps this general rather than a Wide Zone rule:
 * every modifier authored before 7 October states none, and the row's own text says an absent value means the
 * modification does not persist beyond the event it is evaluated at.
 */
test('a modifier that states NO termination is unaffected', () => {
    const none = {
        ...base,
        contracts: base.contracts.map(c => (!/WIDE/.test(c.contractId) ? c : { ...c, items: c.items.filter(i => i.row !== 'V8d') })),
    }
    const { check, clause } = endsClause(none)
    assert.equal(clause.verdict, 'PASS')
    assert.equal(clause.instances, 0, 'nothing to check')
    assert.notEqual(check.verdict, 'FAIL')
})

console.log(`modifier-criterion: ${passed} passed`)
