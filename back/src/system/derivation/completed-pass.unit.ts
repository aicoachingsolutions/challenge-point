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
import { a01CompositionUntil15October } from './composition-fixtures'
import { derivationInputFor, GoalSelectionGap, selectFor } from './run-bounded-selection'
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
     * **The six game-form goals moved again on 9 October (ruling C42), and again not because anything
     * here changed.** The shared target was replaced by one per team, so every goal selecting that form
     * gained two target regions and two objectives in place of one of each. A04 returns to 7; A01 and A05
     * reach 8; TA01, A02 and TA02 reach 7. Only the goals selecting that form move, and no gate verdict
     * does — A04 is still the only one that reaches realization.
     *
     * **A04 moved 7 → 6 on 8 October, and not because anything here changed.** The attacking-duel
     * signal group resolves A04 to a matched package that no longer includes Wide Zone Advantage, so
     * the one failed line that object contributed went with it. A04 had stayed at 7 while Wide Zone
     * was still selected, because its two new rows resolved; now there is no Wide Zone modifier in
     * A04 at all. Its gate verdict is unchanged.
     *
     * **5 · 13 October — SEVEN ROWS MOVED AT ONCE, AND THIS TIME THE CAUSE IS THAT THE TABLE HAD BEEN
     * DESCRIBING THE WRONG SELECTION.** `selectFor` composed its own hints and left out the context
     * rule the application applies (his ruling of 12–13 September), so every row here recorded the game
     * form a goal would take if that rule did not exist. It now calls the one function both pathways
     * share (`sport-module/guided-selection.ts`), which also lets his approved Game Problem translation
     * govern where the wording implies a different one. What moved, and why:
     *
     *   - **The context rule:** A02 and A03 land on Positional Play (no contract), D01 and D03 on
     *     Directional Possession, TD01 on Transition Games. D01 and D03 therefore reach
     *     DEFERRED_TO_REALIZATION beside A04 — the same bare game, since none of the three commits a
     *     contracted constraint. That identity is a finding about coverage, not about this table.
     *   - **The approved Game Problem:** Win the Ball Back (D02) is a Regain Possession goal and Attack
     *     Quickly (TA01) an Exploit Space goal; both had been selected as possession goals because their
     *     definitions contain the word. Both now land on Transition Games, whose own restatement fails
     *     reachability — the defect D03 and TD02 used to show, now shown by D02, TA01, TD01 and TD02.
     *   - A01, A04, A05, A06, TA02 and TD02 select exactly what they did. Their rows are unchanged.
     *
     * No gate, no contract and no register row changed. Every number that moved did so because a goal
     * now loads the contracts the application would load for it.
     *
     * **6 · 14 October — FOUR ROWS MOVED AND TWO LEFT, by his two rulings of that day; measured.**
     *
     *   - *"Selection should only use constraints authorized for the Learning Goal"* and *"keep the current
     *     Pass Combination Gate as a mechanism demonstration only."* The gate is held out of every Learning
     *     Goal's selection, so A05 and TA02 lose their only NOT_EVALUABLE contract and keep Wide Zone
     *     Advantage, one of their own candidates: both reach DEFERRED_TO_REALIZATION with 8 failed lines (TA02
     *     had 7 with the gate). A02 and D03 can no longer borrow and their own candidates cannot be combined:
     *     they are knowledge gaps, select nothing, and leave the table (asserted below as the gap list).
     *   - *"the Primary Scoring Event and qualifying condition approved for each Representative Performance
     *     Context should govern the generated activity."* Selection now carries the goal's context, and
     *     RPC-001 is the one context with a contract: A01 loads it, and Gate A FAILS on the lines that context
     *     leaves unestablished (8 → 13 failed lines). The other contexts have no contract, so they load
     *     nothing and no other row moves for this reason.
     *
     * Every other row is unchanged. The gate's own information rule (the V17 line) is now measured on the
     * gate's demonstration composition, in the next test, because no goal selects the gate.
     */
    /**
     * **7 · 14 October — EVERY ROW MOVED BY ONE, and no verdict did.** Register version 7 adds the game-level
     * row P6c (when a neutral player's change of side takes effect), on his ruling of that day: *"Please add the
     * explicit property governing when a neutral player changes allegiance."* A game-level row is a line in every
     * game, and none of these goals selects the neutral condition, so in each the line is `NOT_AUTHORED / no
     * coverage`: no contract speaks of the timing — the contracts that declare the neutral rows free (P5, P6a,
     * P6b, P7) were written before the row existed, and a restatement cannot add a declaration. It is an
     * established absence ("unspoken" in GA-NO-FAILED-LINE), so no Gate A verdict moves.
     */
    /**
     * **8 · 15 October — A01 LEAVES THE TABLE FOR THE GAP LIST, and its row is kept on its composition.** His item 1
     * of that day: approving Gain Access *"does not automatically authorize the candidate constraints currently
     * derived from vocabulary coverage."* A01's authorization record authorizes no constraint, so it selects nothing
     * (NO_AUTHORIZED_CONSTRAINTS). Its row — 14 failed lines, Gate A FAIL, reachable — described derivation over the
     * objects it selected, so it is asserted on exactly those, named (composition-fixtures.ts), after the loop.
     */
    /**
     * **9 · 15 October, later — A01 RETURNS TO THE TABLE, with no library constraint; measured.** His reply of that
     * day (16 October, item 1) answered the zero-constraint question with a general principle: *"A library constraint
     * is not mandatory unless its inclusion is justified by the approved knowledge and intended learning
     * environment."* A01's record evaluated its set as empty, so it selects GF2, three lenses and RPC-001 and nothing
     * else: 13 failed lines (one fewer than its vocabulary composition, which carried constraints of its own), Gate A
     * FAIL, reachable. The composition row above is kept on its named objects.
     */
    /**
     * **10 · 15 October, later still — A01 13 → 12 and its old composition 14 → 13, measured; no verdict moves.** His
     * reply of that day (16 October, item 9 point 5) retired the context's separate scoring objective: *"Retire the
     * redundant separate scoring objective: Approved, provided the live attacking objective remains represented"*
     * (ruling C51). That objective's target reference, RPC-001-11.a::J2, was a failed line nothing resolved; with the
     * objective gone so is the line. Each team keeps its own live objective (GF2-08.c, GF2-08.e), pinned in
     * derivation-stage11.unit.ts.
     */
    const A01_COMPOSITION = { failed: 13, gateA: 'FAIL', reachable: true }
    const expected: Record<string, { failed: number; gateA: string; reachable: boolean }> = {
        A01: { failed: 12, gateA: 'FAIL', reachable: true },
        D01: { failed: 8, gateA: 'DEFERRED_TO_REALIZATION', reachable: true },
        TA01: { failed: 15, gateA: 'FAIL', reachable: false },
        TD01: { failed: 14, gateA: 'FAIL', reachable: false },
        D02: { failed: 14, gateA: 'FAIL', reachable: false },
        TA02: { failed: 9, gateA: 'DEFERRED_TO_REALIZATION', reachable: true },
        TD02: { failed: 14, gateA: 'FAIL', reachable: false },
        A03: { failed: 8, gateA: 'FAIL', reachable: true },
        A04: { failed: 8, gateA: 'DEFERRED_TO_REALIZATION', reachable: true },
        A05: { failed: 9, gateA: 'DEFERRED_TO_REALIZATION', reachable: true },
        A06: { failed: 8, gateA: 'FAIL', reachable: true },
    }
    const gaps: string[] = []
    for (const goal of [...goals, 'A01 composition until 15 October']) {
        let selection
        if (goal === 'A01 composition until 15 October') {
            selection = a01CompositionUntil15October(null)
            expected[goal] = A01_COMPOSITION
        } else {
            try {
                selection = selectFor(goal, null)
            } catch (error) {
                if (!(error instanceof GoalSelectionGap)) throw error
                gaps.push(goal)
                continue
            }
        }
        const input = derivationInputFor(selection)
        const result: any = runDerivation(input)
        const staged: any = runStages0to10(input)
        const failedLines = (result.resolution ?? []).filter((e: any) => e.state === 'failed').map((e: any) => String(e.lineId))
        assert.equal(failedLines.length, expected[goal].failed, `${goal}: failed LINE count must not move`)
        assert.equal(String(staged.gates?.gateA?.verdict), expected[goal].gateA, `${goal}: Gate A must not move`)

        // The two halves of the exchange, by name, because the count conceals it.
        assert.ok(!failedLines.includes('game::PS1'), `${goal}: the possession relation is bounded now, so it must not be a failed line`)
        assert.ok(failedLines.includes('game::P6c'), `${goal}: the neutral timing is spoken of by no contract this goal selects (row added 14 October 2026)`)
        assert.ok(
            failedLines.includes('c:sport-profile:soccer:SPORT-SOCCER-01::O3'),
            `${goal}: the ball's count is deliberately unconstrained, so it stays a declared non-requirement and keeps the total steady`,
        )

        const reach = (staged.gates?.gateA?.checks ?? []).find((c: any) => c.checkId === 'GA-TRIGGER-REACHABLE')
        const passes = !reach.clauses.some((l: any) => l.verdict === 'FAIL')
        assert.equal(passes, expected[goal].reachable, `${goal}: reachability verdict must be the one his ruling implies`)
    }
    // A01 was a gap from 15 October until his general principle later that day (note 9).
    assert.deepEqual(gaps, ['A02', 'D03'], 'the knowledge gaps of 14 October, and no others')
})

/**
 * The Pass Combination Gate as a mechanism demonstration composes it: the possession game form and the gate,
 * named directly, through the same selection shape a demonstration uses. Since 14 October no Learning Goal
 * selects the gate (his ruling: *"Please keep the current Pass Combination Gate as a mechanism demonstration
 * only"*), so every test of the gate's own lines is made here rather than through a goal.
 */
const gateComposition = () =>
    derivationInputFor({ selected: [{ id: 'GF2', role: 'game form' }, { id: 'tl-v0-constraint-pass-combination-gate', role: 'constraint' }] })

test('the member alone closed nothing — it took a separate authoring act', () => {
    /**
     * The sequence matters and is pinned here. Registering the token left the information rule's trigger
     * NOT_AUTHORED in all five goals that select the Pass Combination Gate, because a vocabulary member makes a
     * value *sayable* and does not say it. The line closed only when he authorized the item on 4 October (C39),
     * which is an authoring act on that contract rather than a representational one.
     *
     * So this now asserts the authored outcome, and the member's own inertness is proved by the forced negative
     * below rather than by a current-state baseline — which is the stronger evidence anyway.
     *
     * **Four goals since 13 October, not five.** Attack Quickly selected this contract only while it was
     * being read as a possession goal. Under its approved Game Problem it selects no information rule,
     * so it moves to the list below, where the absence is asserted rather than left unexamined.
     *
     * **None since 14 October: measured on the gate's demonstration composition.** The four goals that
     * selected the gate (A01, A02, TA02, A05) no longer do — his ruling holds it out of Learning Goal
     * selection, and A02 is now a knowledge gap — so the authored outcome is asserted where the gate now
     * lives, and the three goals that still exist join the list of goals with no such line.
     */
    {
        const result: any = runDerivation(gateComposition())
        const v17 = (result.resolution ?? []).filter((e: any) => /::V17$/.test(String(e.lineId)))
        assert.equal(v17.length, 1, 'the gate composition: one information-rule trigger line')
        assert.equal(v17[0].verdict, 'RESOLVED:ENTAILED', 'closed by the authored item, not by the vocabulary')
        assert.equal(v17[0].value, 'COMPLETED_PASS', 'with the token the 29 September ruling requires')
    }
    // And the goals that do NOT select that contract have no such line at all, so nothing was created for them.
    // A01 by its composition until 15 October (composition-fixtures.ts), and since his general principle later that day
    // by its own selection again (no library constraint): neither carries the gate.
    for (const goal of ['A04', 'A03', 'A06', 'TA01', 'A01 composition', 'A01', 'TA02', 'A05']) {
        const result: any = runDerivation(derivationInputFor(goal === 'A01 composition' ? a01CompositionUntil15October(null) : selectFor(goal, null)))
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
        // The gate's demonstration composition since 14 October: no goal selects the gate any more.
        const input: any = gateComposition()
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
    // The gate's demonstration composition since 14 October: no goal selects the gate any more.
    const staged: any = runStages0to10(gateComposition())
    const reachable = JSON.stringify([...(staged.gateContext?.triggers ?? [])])
    assert.ok(!reachable.includes('COMPLETED_PASS'), 'the reachable set is built by a hardcoded function, not from the vocabulary')
    // FIRST_FORWARD_PASS has been in the vocabulary since 29 September and is not reachable either, so this is
    // a pre-existing property of the architecture rather than something this addition introduced.
    assert.ok(!reachable.includes('FIRST_FORWARD_PASS'), 'the same is already true of the trigger added in September')
})

console.log(`completed-pass: ${passed} passed`)
if (process.exitCode) console.log('completed-pass: FAILURES ABOVE')
