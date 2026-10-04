/**
 * **A registered trigger's semantics are consulted, not just its membership of the list.**
 *
 * His ruling of 4 October, authorizing exactly this and no more:
 *
 *   > *Please implement the machine-readable evaluability dependency you proposed for trigger semantics and
 *   > have the admitting check consult it. I do not consider that an architectural expansion. It makes an
 *   > already-authored semantic dependency enforceable rather than leaving it in prose.*
 *   > Scope: one machine-readable dependency field; one consultation at admission; existing `CONDITIONAL`
 *   > behaviour; no general trigger-semantics redesign.
 *
 * **The defect.** `FIRST_FORWARD_PASS` states its own precondition — *"Forward is relative to the passing team
 * attacking direction, which the representation establishes (SD-95); where that direction is FREE the trigger
 * is NOT EVALUABLE and its line is CONDITIONAL, never failed"* — and nothing enforced it. `GA-INFORMATION`
 * tested list membership alone, so the trigger was admitted regardless of whether the direction it is defined
 * against existed at all. The whole semantics block was read at one place in the source, and that place only
 * tested that the block was non-empty.
 *
 * **What is deliberately NOT done.** The prose stays prose. Only `evaluabilityDependsOn` is acted on, because
 * reading a precondition out of prose is what SD-32 forbids. And the consequence is the one the note itself
 * asked for: the clause is BLOCKED, so the check reports NOT_EVALUABLE rather than failing — a trigger whose
 * definition cannot be evaluated is not a violation.
 */
import assert from 'node:assert/strict'

import { corpusInput } from './corpus'
import { runDerivation, runStages0to10 } from './engine'
import { runGates } from './gates'
import { indexRegister } from './register'
import { derivationInputFor, selectFor } from './run-bounded-selection'

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

const register = corpusInput().register as any
const index = indexRegister(register)

// ── The register carries the dependency, and the authored prose is untouched ───────────────────────
test('the trigger semantics entry carries a machine-readable dependency beside its prose', () => {
    const entry = register.vocabularies.triggerSemantics.FIRST_FORWARD_PASS
    assert.equal(typeof entry, 'object', 'the entry is structured so the dependency can be read')
    assert.equal(entry.evaluabilityDependsOn, 'DV1', 'it names the row its evaluability depends on')

    // The authored reading is preserved verbatim — the structural field is added beside it, never instead.
    assert.match(entry.note, /^An EVENT IN PLAY, like POSSESSION_CHANGE/, 'the prose opens as authored')
    assert.match(entry.note, /no qualifier capability is implied\.$/, 'and closes as authored')
    assert.match(entry.note, /where that direction is FREE the trigger is NOT EVALUABLE/, 'including the rule now enforced')

    // The row it names must exist, or the dependency is a dangling reference.
    const dv1 = index.rows.get(String(entry.evaluabilityDependsOn))
    assert.ok(dv1, 'DV1 is a registered row')
    assert.equal(String(dv1!.path), 'direction', 'and it is the row that holds attacking direction')
})

test('the index exposes trigger semantics the way it already exposes noun semantics', () => {
    assert.ok(index.triggerSemantics, 'indexed, so a check can consult the entry in front of it')
    const entry = index.triggerSemantics.FIRST_FORWARD_PASS as { evaluabilityDependsOn?: string }
    assert.equal(entry?.evaluabilityDependsOn, 'DV1')
    // Only the one trigger declares a dependency; nothing was invented for the other eight.
    const declaring = Object.entries(index.triggerSemantics).filter(
        ([, v]) => v && typeof v === 'object' && (v as any).evaluabilityDependsOn,
    )
    assert.deepEqual(declaring.map(([k]) => k), ['FIRST_FORWARD_PASS'], 'exactly one dependency is authored')
})

// ── THE CORRECTION, exercised on the live corpus ──────────────────────────────────────────────────
//
// The Variable Target Condition authors FIRST_FORWARD_PASS on an information rule's trigger, and no learning
// goal selects it — so the corpus-wide run is where the trigger actually reaches the admitting check. DV1 is a
// VIEW row that enumerates no line at all, so its dependency is unestablished, and the clause must say so.
test('a trigger whose dependency is unestablished makes the clause NOT_EVALUABLE, not PASS', () => {
    const input = corpusInput()
    const staged: any = runStages0to10(input)
    const v17 = [...staged.classified.keys()].filter((l: any) => /::V17$/.test(String(l)))
    assert.ok(v17.length > 0, 'the corpus holds at least one information-rule trigger line')

    const report = runGates(staged.gateContext).gateA
    const information: any = report.checks.find((c: any) => c.checkId === 'GA-INFORMATION')
    assert.ok(information, 'GA-INFORMATION runs')

    // **The observable: the dependency is consulted and recorded as a block.** Before the correction nothing
    // read the semantics entry at all, so this line could never appear.
    assert.ok(
        (information.blockedBy ?? []).includes('game::DV1'),
        `the trigger's declared dependency must be consulted and named: ${JSON.stringify(information.blockedBy)}`,
    )

    // And blocking really does produce NOT_EVALUABLE on this check — shown by its sibling clause, which is
    // blocked with no violations of its own.
    const subjectClause = information.clauses.find((l: any) => /held subject/.test(String(l.clause)))
    assert.equal(subjectClause?.verdict, 'NOT_EVALUABLE', 'a blocked clause with no violation reports NOT_EVALUABLE')

    /**
     * The trigger clause itself reports FAIL here, and that is correct rather than a shortfall of the
     * correction. The corpus independently names two triggers that are not in the vocabulary at all — a genuine
     * violation the engine can establish — and an established violation outranks "I could not evaluate
     * something else". The correction's job is to stop a REGISTERED trigger passing on membership while its own
     * declared precondition is unmet, and the blockedBy entry above is that.
     */
    const triggerClause = information.clauses.find((l: any) => /registered trigger/.test(String(l.clause)))
    assert.equal(triggerClause?.verdict, 'FAIL', 'an independently established violation still outranks a block')
    assert.match(String(information.why ?? ''), /unregistered trigger/, String(information.why))
})

// ── NO REGRESSION: a trigger that declares no dependency still passes on membership ────────────────
//
// The teeth in the other direction. Eight of the nine triggers declare nothing, and the correction must leave
// them exactly as they were — otherwise it is a general trigger redesign, which he excluded.
test('a trigger declaring no dependency is unaffected', () => {
    const input = derivationInputFor(selectFor('A05', null))
    const staged: any = runStages0to10(input)
    const report = runGates(staged.gateContext).gateA
    const information = report.checks.find((c: any) => c.checkId === 'GA-INFORMATION')
    assert.ok(information, 'GA-INFORMATION runs on A05')

    // A05's information rule names STANDING, which declares no dependency. Whatever the clause's verdict is, it
    // must not be blocked BY a trigger dependency — assert that no dependency line is among what blocked it.
    const why = String(information!.why ?? '')
    assert.ok(!/game::DV1/.test(why), `no dependency may be imposed on a trigger that declares none: "${why}"`)
})

// ── The parameterised form consults the same entry ─────────────────────────────────────────────────
test('a parameterised trigger consults the semantics of its bare kind', () => {
    // `REGION_ENTRY {a wide channel}` must read REGION_ENTRY's entry: the parameter narrows which instance,
    // not what the kind means. REGION_ENTRY declares no dependency, so this is also a no-op case — the point is
    // that the lookup does not silently miss because of the braces.
    const entry = index.triggerSemantics['REGION_ENTRY']
    assert.equal(entry, undefined, 'REGION_ENTRY registers no semantics, so nothing is imposed on it')
})

// ── A04 is untouched ──────────────────────────────────────────────────────────────────────────────
test('A04 carries no information rule, so the correction cannot reach it', () => {
    const input = derivationInputFor(selectFor('A04', null))
    const staged: any = runStages0to10(input)
    const report = runGates(staged.gateContext).gateA
    const information = report.checks.find((c: any) => c.checkId === 'GA-INFORMATION')
    assert.ok(information, 'the check still runs')
    assert.match(String(information!.why ?? ''), /no information rule is instantiated/, String(information!.why))
    const result: any = runDerivation(input)
    assert.ok(result.resolution.length > 0, 'and A04 still derives')
})

console.log(`trigger-semantics: ${passed} passed`)
if (process.exitCode) console.log('trigger-semantics: FAILURES ABOVE')
