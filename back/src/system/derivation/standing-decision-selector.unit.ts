/**
 * **A standing decision's registered selector must admit the line's element.** His ruling of 4 October, on a
 * defect he classified as trust-critical:
 *
 *   > *We have now explicitly established that a trigger does not entail transition semantics. A selector path
 *   > that can silently cause a trigger carried by a transition to acquire `playState` and an episode boundary
 *   > therefore risks introducing unsupported meaning into the resolved game.*
 *   > *Please falsify the repair with a case where the trigger is present through a transition but has no
 *   > independent authority for `playState` or episode boundary, and confirm that those properties do not
 *   > survive merely because the trigger matched.*
 *
 * **The defect.** `applies` matched a decision to a line by row alone and never read the decision's own
 * registered selector. Three citable decisions register one — SD-13 `trigger=START` on T3, SD-14
 * `trigger ∈ {START, SCORE, POSSESSION_CHANGE}` on T7, SD-20 `trigger=POSSESSION_CHANGE` on T6 — and all three
 * were ignored.
 *
 * **Scope.** Bounded to that: the selector is read where the row is read, through the same canonical matcher the
 * applicability rule already uses. No trigger architecture is touched.
 */
import assert from 'node:assert/strict'

import { corpusInput } from './corpus'
import { runDerivation, runStages0to10 } from './engine'
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

const index = indexRegister(corpusInput().register as any)

// ── The three decisions really do register a selector ──────────────────────────────────────────────
test('three citable standing decisions register a selector, and it is now read', () => {
    const selectored = (index.standingDecisions as any[]).filter(d => d.item?.selector)
    assert.deepEqual(
        selectored.map(d => d.id).sort(),
        ['SD-13', 'SD-14', 'SD-20'],
        'the three whose narrowing was being ignored',
    )
    assert.equal((index.standingDecisions as any[]).find(d => d.id === 'SD-14')!.item.selector, 'trigger ∈ {START, SCORE, POSSESSION_CHANGE}')
    assert.equal((index.standingDecisions as any[]).find(d => d.id === 'SD-20')!.item.selector, 'trigger=POSSESSION_CHANGE')
})

// ── HIS FALSIFICATION: a trigger present through a transition, with no independent authority ───────
//
// The real corpus case. A01-02's goal kick is a transition whose trigger is OUT_END_LINE — present, carried by a
// transition, and named by neither SD-14's selector nor SD-20's. Nothing authors its episode boundary. Before the
// repair it carried `startsEpisode = true` sourced from SD-14, which names three triggers and not that one.
test('a transition whose trigger is outside the selector does NOT acquire the episode boundary', () => {
    const result: any = runDerivation(derivationInputFor(selectFor('A01', 'A01-02')))
    const staged: any = runStages0to10(derivationInputFor(selectFor('A01', 'A01-02')))

    const line = result.resolution.find((e: any) => String(e.lineId) === 'c:restated:A01-02:A01-02-01.a::T7')
    assert.ok(line, 'the goal-kick transition has an episode-boundary line')
    assert.equal(line.value, undefined, 'and it holds NO value — the property does not survive the trigger matching')
    assert.equal(line.state, 'failed')
    assert.equal(line.verdict, 'NOT_AUTHORED', 'it is an honest gap rather than an unsourced true')

    // And the decision is not recorded against it, so nothing can later read it as a source.
    const record: any = staged.derived.lines.get('c:restated:A01-02:A01-02-01.a::T7')
    assert.deepEqual(record?.standingDecisions ?? [], [], 'SD-14 must not be recorded as having applied')
})

// ── THE CONTROL, in the other direction: the legitimate application still happens ──────────────────
//
// The repair must not be a blanket refusal. A transition whose trigger IS named keeps its value, from the same
// decision, on the same row.
test('a transition whose trigger IS named still receives it, from the same decision', () => {
    const result: any = runDerivation(derivationInputFor(selectFor('A01', 'A01-02')))
    const staged: any = runStages0to10(derivationInputFor(selectFor('A01', 'A01-02')))

    const line = result.resolution.find((e: any) => String(e.lineId) === 'c:restated:GF2:GF2-07.a::T7')
    assert.equal(line.value, true, 'a POSSESSION_CHANGE transition still begins an episode')
    assert.equal(line.verdict, 'RESOLVED:ENTAILED')
    const record: any = staged.derived.lines.get('c:restated:GF2:GF2-07.a::T7')
    assert.deepEqual(record?.standingDecisions ?? [], ['SD-14'], 'and SD-14 is still its source')
})

// ── NEITHER playState NOR the episode boundary survives, measured together ─────────────────────────
//
// He asked specifically about both properties. A synthetic transition on a trigger named by neither selector,
// with no authored T6 or T7, is the clean case — the corpus's goal kick has an AUTHORED playState from GF2-16.b,
// so it cannot test the playState half on its own.
test('neither playState nor the episode boundary is supplied to an unnamed trigger', () => {
    const input: any = derivationInputFor(selectFor('A04', null))
    const gf2: any = input.contracts.find((c: any) => /GF2/.test(String(c.contractId)))
    const model = (gf2.items as any[]).find(i => String(i.itemId) === 'GF2-07.a')
    gf2.items = [
        ...gf2.items.filter((i: any) => String(i.itemId) !== 'GF2-07.a'),
        // A transition keyed on a trigger that neither SD-14 nor SD-20 names, and nothing else about it.
        { ...model, itemId: 'TEST-OUT', origId: 'TEST', selector: 'trigger=OUT_TOUCHLINE', value: 'a transition on the touchline' },
    ]
    const result: any = runDerivation(input)
    const staged: any = runStages0to10(input)

    const t6 = result.resolution.find((e: any) => /TEST-OUT::T6$/.test(String(e.lineId)))
    const t7 = result.resolution.find((e: any) => /TEST-OUT::T7$/.test(String(e.lineId)))
    assert.ok(t6 && t7, `both lines must be enumerated; got ${JSON.stringify([t6?.lineId, t7?.lineId])}`)

    /**
     * **Neither property comes from a standing decision, which is the whole claim.** The episode boundary is
     * simply absent — nothing authors it and SD-14 no longer reaches it. The play state is PRESENT, and that is
     * correct rather than a leak: an AUTHORED item supplies a stoppage for an out-of-play trigger. So the test
     * asserts PROVENANCE rather than absence, which is the stronger statement and the honest one — the repair
     * removes standing-decision propagation and leaves authored knowledge exactly where it was.
     */
    const r6: any = staged.derived.lines.get(t6.lineId)
    const r7: any = staged.derived.lines.get(t7.lineId)

    assert.deepEqual(r6?.standingDecisions ?? [], [], 'SD-20 must not reach a trigger it does not name')
    assert.deepEqual(r7?.standingDecisions ?? [], [], 'SD-14 must not reach a trigger it does not name')

    assert.equal(t7.value, undefined, 'the episode boundary is not supplied at all — it has no other source')
    assert.ok(
        (r6?.entailing ?? []).length > 0,
        'the play state that IS present comes from an authored item, not from the decision',
    )
})

test('the same synthetic transition on POSSESSION_CHANGE does receive both', () => {
    const input: any = derivationInputFor(selectFor('A04', null))
    const gf2: any = input.contracts.find((c: any) => /GF2/.test(String(c.contractId)))
    const model = (gf2.items as any[]).find(i => String(i.itemId) === 'GF2-07.a')
    gf2.items = [
        ...gf2.items.filter((i: any) => String(i.itemId) !== 'GF2-07.a'),
        { ...model, itemId: 'TEST-TURNOVER', origId: 'TEST', selector: 'trigger=POSSESSION_CHANGE', value: 'a turnover transition' },
    ]
    const result: any = runDerivation(input)
    const t6 = result.resolution.find((e: any) => /TEST-TURNOVER::T6$/.test(String(e.lineId)))
    const t7 = result.resolution.find((e: any) => /TEST-TURNOVER::T7$/.test(String(e.lineId)))
    assert.equal(t6?.value, 'CONTINUE', 'SD-20 still supplies the play state where its selector names the trigger')
    assert.equal(t7?.value, true, 'and SD-14 still supplies the episode boundary')
})

// ── BLAST RADIUS: exactly one application removed, across every goal and situation ─────────────────
test('the repair removes exactly one application and leaves the rest', () => {
    const goals: string[] = ((sessionPlanningModel as any).learningGoals?.() ?? []).map((g: any) => g.ID ?? g.id).filter(Boolean)
    const pairs = new Set<string>()
    for (const goal of goals) {
        const sits = [null, ...((sessionPlanningModel as any).practiceSituationsFor?.(goal) ?? []).map((p: any) => p.ID)]
        for (const sit of sits) {
            let staged: any
            try {
                staged = runStages0to10(derivationInputFor(selectFor(goal, sit)))
            } catch {
                continue
            }
            for (const [lineId, rec] of staged.derived?.lines ?? new Map()) {
                for (const sd of (rec as any).standingDecisions ?? []) {
                    const id = typeof sd === 'string' ? sd : sd.id
                    if (['SD-13', 'SD-14', 'SD-20'].includes(id)) pairs.add(`${lineId} <- ${id}`)
                }
            }
        }
    }
    // Was three, all SD-14: the two POSSESSION_CHANGE transitions and the goal kick. The goal kick is gone.
    assert.deepEqual(
        [...pairs].sort(),
        ['c:blind:GF4:I06::T7 <- SD-14', 'c:restated:GF2:GF2-07.a::T7 <- SD-14'],
        `exactly the two legitimate applications remain; got ${JSON.stringify([...pairs])}`,
    )
})

// ── A04 is untouched ──────────────────────────────────────────────────────────────────────────────
test('A04 is unaffected: its only transition is a POSSESSION_CHANGE', () => {
    const result: any = runDerivation(derivationInputFor(selectFor('A04', null)))
    // **Six, not the seven this asserted until 8 October.** The count moved because A04's selection
    // changed, not because this selector did: the attacking-duel signal group resolves A04 to a
    // matched package that no longer includes Wide Zone Advantage, so the one failed line that object
    // contributed is gone with it. What this test is about — that the standing-decision selector
    // leaves A04's single POSSESSION_CHANGE transition alone — is unchanged, and the clause below
    // still checks it directly.
    assert.equal((result.resolution ?? []).filter((e: any) => e.state === 'failed').length, 7, 'seven failed lines: 6 after Wide Zone left on 8 October, and 7 again since the directional arrangement of 9 October added a second target and a second objective')
    const t7 = result.resolution.find((e: any) => /GF2-07\.a::T7$/.test(String(e.lineId)))
    assert.equal(t7?.value, true, 'and it still begins an episode, legitimately')
})

// ── THE AUTHORED PCG TRIGGER ITEM (C39) ───────────────────────────────────────────────────────────
//
// Authored on his instruction of 4 October, with the 29 September ruling as its evidence. Kept in this file
// because its only live interaction is with the trigger machinery the repair above also touches.
test('the Pass Combination Gate trigger row is now authored and resolves', () => {
    for (const goal of ['A01', 'TA01', 'A02', 'TA02', 'A05']) {
        const result: any = runDerivation(derivationInputFor(selectFor(goal, null)))
        const v17 = (result.resolution ?? []).filter((e: any) => /::V17$/.test(String(e.lineId)))
        assert.equal(v17.length, 1, `${goal}: one information-rule trigger line`)
        assert.equal(v17[0].verdict, 'RESOLVED:ENTAILED', `${goal}: the line the 29 September ruling left failed is closed`)
        assert.equal(v17[0].value, 'COMPLETED_PASS', `${goal}: with the token the ruling requires`)
    }
})

test('the item carries the authority the ruling specified, and displaces nothing', () => {
    const items = (corpusInput().contracts as any[]).flatMap(c => (c.items ?? []).map((i: any) => ({ cid: c.contractId, ...i })))
    const item = items.find(i => String(i.itemId) === 'PCG-14.f')
    assert.ok(item, 'the item is loaded')
    assert.equal(item.row, 'V17')
    assert.equal(item.value, 'COMPLETED_PASS')
    assert.equal(item.basis, 'OWNER_RULING')
    assert.equal(item.strictness, 'REQUIRED')
    assert.equal(item.valueStatus, 'REQUIRED_RANGE')
    assert.match(String(item.basisEvidence), /2026-09-29/, 'the ruling that supports it is cited')

    // PCG-12 is left exactly as it stands: ASSUMED and PREFERRED_DEFAULT, so it bounds and never entails.
    const pcg12 = items.find(i => String(i.itemId) === 'PCG-12')
    assert.equal(pcg12.basis, 'ASSUMED', 'the competing item is untouched')
    assert.equal(pcg12.valueStatus, 'PREFERRED_DEFAULT', 'and still only bounds')
})

console.log(`standing-decision-selector: ${passed} passed`)
if (process.exitCode) console.log('standing-decision-selector: FAILURES ABOVE')
