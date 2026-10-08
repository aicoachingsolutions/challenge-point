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

    /**
     * **These baselines have moved twice, both times deliberately, and both reasons are recorded here.**
     *
     * 1. **4 October (C39).** Registering the vocabulary member changed nothing — measured then, and still
     *    proved below by removing it. What moved the FAILED counts was the separate authoring act that put the
     *    token on the Pass Combination Gate's information-rule trigger, closing one failed line in each of the
     *    five goals selecting that contract: A01 and A05 eight to seven, TA01, A02 and TA02 seven to six.
     * 2. **5 October — `GA-TRIGGER-REACHABLE`.** On his ruling that SD-44 supersedes RC-19 and that a
     *    possession change needs a ball, Gate A FAILED wherever a transition was keyed on an unreachable
     *    trigger. Six verdicts moved: A01, TA01, A02, TA02 and A05 from NOT_EVALUABLE, and **A04 from
     *    DEFERRED_TO_REALIZATION**. TD02 and D03 were already FAIL and merely gained a second failing check.
     * 3. **6 October — the Soccer Sport Profile.** It reaches every derivation, so it establishes a ball and
     *    bounds the possession relationship for all thirteen goals, and the six verdicts from (2) move back:
     *    **A04 to DEFERRED_TO_REALIZATION, the other five to NOT_EVALUABLE.** Only TD02 and D03 still fail
     *    reachability, and on the FIRST clause — their transition is keyed on a trigger their own game cannot
     *    construct, which no sport-level carrier fixes.
     *
     * **AND THE FAILED COUNTS DID NOT MOVE — WHICH WAS VERY NEARLY A LIE.** Every count below is byte-identical
     * to the 5 October baseline, so a count-only assertion would have reported perfect containment. The
     * membership changed underneath it: `game::PS1` LEFT the failed set, and `…SPORT-SOCCER-01::O3` — the
     * ball's count, deliberately unconstrained and declared NON_CLAIMED — ARRIVED. One out, one in, in every
     * goal. That is a legitimate exchange and it is also exactly the shape a real regression would hide in,
     * so the assertions below now pin the two lines by name instead of trusting the total.
     */
    /**
     * **4 · 7 October — V8d, and a defect in three goals that nothing could previously see.**
     *
     * The modifier termination row made Gate A FAIL in **D02, A03 and A06**, all three from NOT_EVALUABLE,
     * and it is a real finding rather than a baseline drifting. Each of those three loads only
     * `restated:WIDE-ZONE-ADVANTAGE` plus the Sport Profile — their game form has no contract — so they
     * establish **no P1 class at all**, no opposing teams, and therefore no POSSESSION_CHANGE. Wide Zone's
     * authored termination names exactly that trigger, so in those three games **the value modification can
     * never end**: the indefinite stored entitlement his Coupled criterion exists to forbid, invisible until
     * a clause asked the question.
     *
     * Reported, NOT repaired — the other twelve goals are outside the evidence claim and he instructed that
     * they not be repaired. The cause is that those goals have no game form, not that the Wide Zone authoring
     * is wrong; a game with no teams cannot end a possession.
     *
     * TD02 and D03 move 11 → 13 failed lines: GF4's modifier gains the two new rows and authors neither.
     *
     * **A04 moved 7 → 6 on 8 October, and not because anything here changed.** The attacking-duel
     * signal group resolves A04 to a matched package that no longer includes Wide Zone Advantage, so
     * the one failed line that object contributed went with it. A04 had stayed at 7 while Wide Zone
     * was still selected, because its two new rows resolved; now there is no Wide Zone modifier in
     * A04 at all. Its gate verdict is unchanged.
     */
    const expected: Record<string, { failed: number; gateA: string; reachable: boolean }> = {
        A01: { failed: 7, gateA: 'NOT_EVALUABLE', reachable: true },
        D01: { failed: 6, gateA: 'NOT_EVALUABLE', reachable: true },
        TA01: { failed: 6, gateA: 'NOT_EVALUABLE', reachable: true },
        TD01: { failed: 6, gateA: 'NOT_EVALUABLE', reachable: true },
        A02: { failed: 6, gateA: 'NOT_EVALUABLE', reachable: true },
        D02: { failed: 7, gateA: 'FAIL', reachable: true },
        TA02: { failed: 6, gateA: 'NOT_EVALUABLE', reachable: true },
        TD02: { failed: 13, gateA: 'FAIL', reachable: false },
        A03: { failed: 7, gateA: 'FAIL', reachable: true },
        D03: { failed: 13, gateA: 'FAIL', reachable: false },
        A04: { failed: 6, gateA: 'DEFERRED_TO_REALIZATION', reachable: true },
        A05: { failed: 7, gateA: 'NOT_EVALUABLE', reachable: true },
        A06: { failed: 7, gateA: 'FAIL', reachable: true },
    }
    for (const goal of goals) {
        const input = derivationInputFor(selectFor(goal, null))
        const result: any = runDerivation(input)
        const staged: any = runStages0to10(input)
        const failedLines = (result.resolution ?? []).filter((e: any) => e.state === 'failed').map((e: any) => String(e.lineId))
        assert.equal(failedLines.length, expected[goal].failed, `${goal}: failed LINE count must not move`)
        assert.equal(String(staged.gates?.gateA?.verdict), expected[goal].gateA, `${goal}: Gate A must not move`)

        // The two halves of the exchange, by name, because the count conceals it.
        assert.ok(!failedLines.includes('game::PS1'), `${goal}: the possession relation is bounded now, so it must not be a failed line`)
        assert.ok(
            failedLines.includes('c:sport-profile:soccer:SPORT-SOCCER-01::O3'),
            `${goal}: the ball's count is deliberately unconstrained, so it stays a declared non-requirement and keeps the total steady`,
        )

        const reach = (staged.gates?.gateA?.checks ?? []).find((c: any) => c.checkId === 'GA-TRIGGER-REACHABLE')
        const passes = !reach.clauses.some((l: any) => l.verdict === 'FAIL')
        assert.equal(passes, expected[goal].reachable, `${goal}: reachability verdict must be the one his ruling implies`)
    }
})

test('the member alone closed nothing — it took a separate authoring act', () => {
    /**
     * The sequence matters and is pinned here. Registering the token left the information rule's trigger
     * NOT_AUTHORED in all five goals that select the Pass Combination Gate, because a vocabulary member makes a
     * value *sayable* and does not say it. The line closed only when he authorized the item on 4 October (C39),
     * which is an authoring act on that contract rather than a representational one.
     *
     * So this now asserts the authored outcome, and the member's own inertness is proved by the forced negative
     * below rather than by a current-state baseline — which is the stronger evidence anyway.
     */
    for (const goal of ['A01', 'TA01', 'A02', 'TA02', 'A05']) {
        const result: any = runDerivation(derivationInputFor(selectFor(goal, null)))
        const v17 = (result.resolution ?? []).filter((e: any) => /::V17$/.test(String(e.lineId)))
        assert.equal(v17.length, 1, `${goal}: one information-rule trigger line`)
        assert.equal(v17[0].verdict, 'RESOLVED:ENTAILED', `${goal}: closed by the authored item, not by the vocabulary`)
        assert.equal(v17[0].value, 'COMPLETED_PASS', `${goal}: with the token the 29 September ruling requires`)
    }
    // And the goals that do NOT select that contract have no such line at all, so nothing was created for them.
    for (const goal of ['A04', 'A03', 'A06']) {
        const result: any = runDerivation(derivationInputFor(selectFor(goal, null)))
        assert.deepEqual(
            (result.resolution ?? []).filter((e: any) => /::V17$/.test(String(e.lineId))),
            [],
            `${goal}: selects no information rule, so the authoring reaches it not at all`,
        )
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
