/**
 * **`COMPLETED_PASS`** — the one trigger addition the already-authored knowledge independently supports.
 *
 * His ruling of 4 October: *"Please proceed with only the independently supported `COMPLETED_PASS` trigger and
 * its semantics entry, based on the 29 September Pass Combination Gate ruling. Keep it narrowly bounded to the
 * meaning that ruling actually requires. Do not make `FIRST_FORWARD_PASS` its specialization and do not
 * generalize it into contact/pass ontology."*
 *
 * **What makes it supported, and nothing else is.** On 29 September he ruled the Pass Combination Gate's reveal
 * trigger: *"The current connected-pass count is revealed immediately following each qualifying pass."* That
 * became `PCG-14.a` (V18 = TEAMMATE_ACTION) and `PCG-14.b` (V19 = IMMEDIATE_AFTER_TRIGGER), both OWNER_RULING,
 * REQUIRED, REQUIRED_RANGE. `PCG-14.b` is what makes the trigger row load-bearing *by construction*:
 * "immediately after the trigger" denotes nothing unless a trigger is named. And what *qualifying* means is
 * fixed by `PCG-05`: *"counts ATTACKING_TEAM's connected passes"*. So the kind is a pass that **connects**, and
 * nothing further.
 *
 * **What this file mainly asserts is CONTAINMENT.** A vocabulary member is the smallest possible representational
 * act, and the test that matters is that it changed nothing — no goal's verdicts moved, A04 is untouched, and no
 * other trigger acquired a relationship to it. The one thing it does change is proved by forcing the negative:
 * an item authoring the token is admitted with the member present and rejected without it.
 */
import assert from 'node:assert/strict'

import { corpusInput } from './corpus'
import { runDerivation, runStages0to10 } from './engine'
import { runGates } from './gates'
import { indexRegister } from './register'
import { derivationInputFor, selectFor } from './run-bounded-selection'
import { sessionPlanningModel } from '../session-planning/session-planning-model'

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

// ── Registered, and the vocabulary is versioned as the register requires ──────────────────────────
test('COMPLETED_PASS is a registered trigger, and the vocabulary version records why', () => {
    assert.ok(index.vocabularies.get('trigger')!.includes('COMPLETED_PASS'), 'it is in the closed list')
    assert.equal(index.vocabularies.get('trigger')!.length, 10, 'one member added, not several')
    const version = String(register.vocabularies.versions.trigger)
    assert.match(version, /^3 /, 'the version is bumped, so a stored result can be known stale')
    assert.match(version, /COMPLETED_PASS/, version)
})

// ── The semantics entry carries the ruling, and the whole of the meaning is completion ─────────────
test('its semantics entry makes completion constitutive and nothing else', () => {
    const entry = register.vocabularies.triggerSemantics.COMPLETED_PASS
    assert.ok(entry && typeof entry === 'object', 'it registers semantics, as FIRST_FORWARD_PASS does')
    assert.match(entry.note, /COMPLETION IS CONSTITUTIVE/, 'the meaning the ruling requires')
    assert.match(entry.note, /reaching a player of the passing team/, 'and what connecting means')
    assert.match(entry.basisEvidence, /2026-09-29/, 'the ruling that supports it is cited')
    assert.match(entry.basisEvidence, /revealed immediately following each qualifying pass/, 'verbatim')
})

// ── EVERY forbidden implication is denied explicitly, because he listed them ───────────────────────
test('the entry denies every implication he excluded', () => {
    const note = String(register.vocabularies.triggerSemantics.COMPLETED_PASS.note)
    for (const excluded of [
        'region',
        'direction',
        'receiver identity',
        'distance',
        'intent',
        'possession',
        'possession change',
        'scoring eligibility',
        'transition',
        'episode boundary',
    ]) {
        assert.ok(note.includes(excluded), `the entry must deny implying ${excluded}`)
    }
    assert.match(note, /no qualifier capability is implied/, 'the FIRST_FORWARD_PASS fence is carried too')
    assert.match(note, /does not record occurrences/, 'and it is not an event history')
})

// ── NOT a specialization, in either direction — his explicit instruction ───────────────────────────
test('COMPLETED_PASS and FIRST_FORWARD_PASS are independent, not ordered', () => {
    const entry = register.vocabularies.triggerSemantics.COMPLETED_PASS
    assert.match(entry.independentOf, /NOT a generalization of FIRST_FORWARD_PASS/, entry.independentOf)
    assert.match(entry.independentOf, /not its specialization either/, 'neither direction')
    assert.match(entry.independentOf, /not a hierarchy/, 'the vocabulary is flat')

    // And the reason holds on the other entry's own text, which is what makes this a fact rather than a policy.
    const ffp = register.vocabularies.triggerSemantics.FIRST_FORWARD_PASS
    assert.match(String(ffp.note), /implies NOTHING about pass success/, 'a forward pass need not connect')
})

// ── It declares no evaluability dependency, so the integrity correction imposes nothing ────────────
test('it registers no row dependency, and the integrity check therefore does not block on it', () => {
    const entry = index.triggerSemantics.COMPLETED_PASS as any
    assert.equal(entry.evaluabilityDependsOn, null, 'completion is measured against nothing the game holds')
    assert.match(String(entry.whyNoDependency), /in-play judgement/, 'and the entry says why')

    // The correction of 4 October keys on this field, so a null means no block — asserted, not assumed.
    const declaring = Object.entries(index.triggerSemantics).filter(
        ([, v]) => v && typeof v === 'object' && (v as any).evaluabilityDependsOn,
    )
    assert.deepEqual(declaring.map(([k]) => k), ['FIRST_FORWARD_PASS'], 'still exactly one trigger declares one')
})

// ── CONTAINMENT: registering it changed nothing anywhere ───────────────────────────────────────────
//
// The assertion that matters most. A new vocabulary member must be inert until knowledge authors it, and this
// pins that across every goal rather than on the one that motivated it.
test('registering the member changed no verdict in any of the thirteen goals', () => {
    const goals: string[] = ((sessionPlanningModel as any).learningGoals?.() ?? []).map((g: any) => g.ID ?? g.id).filter(Boolean)
    assert.equal(goals.length, 13)

    // Baselines taken before the addition, recorded here so a future change cannot move them unnoticed.
    const expected: Record<string, { failed: number; gateA: string }> = {
        A01: { failed: 8, gateA: 'NOT_EVALUABLE' },
        D01: { failed: 6, gateA: 'NOT_EVALUABLE' },
        TA01: { failed: 7, gateA: 'NOT_EVALUABLE' },
        TD01: { failed: 6, gateA: 'NOT_EVALUABLE' },
        A02: { failed: 7, gateA: 'NOT_EVALUABLE' },
        D02: { failed: 7, gateA: 'NOT_EVALUABLE' },
        TA02: { failed: 7, gateA: 'NOT_EVALUABLE' },
        TD02: { failed: 11, gateA: 'FAIL' },
        A03: { failed: 7, gateA: 'NOT_EVALUABLE' },
        D03: { failed: 11, gateA: 'FAIL' },
        A04: { failed: 7, gateA: 'DEFERRED_TO_REALIZATION' },
        A05: { failed: 8, gateA: 'NOT_EVALUABLE' },
        A06: { failed: 7, gateA: 'NOT_EVALUABLE' },
    }
    for (const goal of goals) {
        const input = derivationInputFor(selectFor(goal, null))
        const result: any = runDerivation(input)
        const staged: any = runStages0to10(input)
        const failed = (result.resolution ?? []).filter((e: any) => e.state === 'failed').length
        assert.equal(failed, expected[goal].failed, `${goal}: failed lines must not move`)
        assert.equal(String(staged.gates?.gateA?.verdict), expected[goal].gateA, `${goal}: Gate A must not move`)
    }
})

test('the trigger row the ruling needs is still unauthored — the member alone closes nothing', () => {
    // The honest consequence, pinned so it cannot be mistaken for progress. Five goals select the Pass
    // Combination Gate and in every one the information rule's trigger is still NOT_AUTHORED: closing it is an
    // authoring act on that contract, which he has not authorized.
    for (const goal of ['A01', 'TA01', 'A02', 'TA02', 'A05']) {
        const result: any = runDerivation(derivationInputFor(selectFor(goal, null)))
        const v17 = (result.resolution ?? []).filter((e: any) => /::V17$/.test(String(e.lineId)))
        assert.equal(v17.length, 1, `${goal}: one information-rule trigger line`)
        assert.equal(v17[0].verdict, 'NOT_AUTHORED', `${goal}: still unauthored`)
        assert.equal(v17[0].reason, 'not constrained', `${goal}: and the reason is unchanged`)
    }
})

// ── THE FORCED NEGATIVE: the member is exactly and only what an authoring item would need ──────────
//
// A check proves nothing until a wrong value has been forced through it. So author the token on the trigger row
// and run it twice — with the vocabulary member, and with it removed.
test('an item authoring the token is admitted WITH the member and rejected WITHOUT it', () => {
    const triggerClause = (input: any) => {
        const staged: any = runStages0to10(input)
        const information: any = runGates(staged.gateContext).gateA.checks.find((c: any) => c.checkId === 'GA-INFORMATION')
        return information?.clauses.find((l: any) => /registered trigger/.test(String(l.clause)))
    }
    const withItem = (vocabulary: string[]) => {
        const input: any = derivationInputFor(selectFor('A05', null))
        input.register = JSON.parse(JSON.stringify(input.register))
        input.register.vocabularies.trigger = vocabulary
        const pcg: any = input.contracts.find((c: any) => /PASS-COMBINATION/.test(String(c.contractId)))
        const model = (pcg.items as any[]).find(i => i.checkability && i.row === 'V18')
        pcg.items = [
            ...pcg.items,
            { ...model, itemId: 'TEST-V17', origId: 'TEST', row: 'V17', requirement: 'EQUALS', value: 'COMPLETED_PASS', basis: 'OWNER_RULING', strictness: 'REQUIRED', valueStatus: 'REQUIRED_RANGE' },
        ]
        return input
    }
    const full = index.vocabularies.get('trigger')!

    const admitted = triggerClause(withItem([...full]))
    assert.notEqual(admitted?.verdict, 'FAIL', `with the member registered the item must be admitted: ${JSON.stringify(admitted)}`)

    const rejected = triggerClause(withItem(full.filter(t => t !== 'COMPLETED_PASS')))
    assert.equal(rejected?.verdict, 'FAIL', 'without it the same item names an unregistered trigger')
})

// ── A known limit, recorded rather than repaired ───────────────────────────────────────────────────
test('the token is not structurally reachable, and that is reported not hidden', () => {
    const staged: any = runStages0to10(derivationInputFor(selectFor('A05', null)))
    const reachable = JSON.stringify([...(staged.gateContext?.triggers ?? [])])
    assert.ok(!reachable.includes('COMPLETED_PASS'), 'the reachable set is built by a hardcoded function, not from the vocabulary')
    // FIRST_FORWARD_PASS has been in the vocabulary since 29 September and is not reachable either, so this is
    // a pre-existing property of the architecture rather than something this addition introduced.
    assert.ok(!reachable.includes('FIRST_FORWARD_PASS'), 'the same is already true of the trigger added in September')
})

console.log(`completed-pass: ${passed} passed`)
if (process.exitCode) console.log('completed-pass: FAILURES ABOVE')
