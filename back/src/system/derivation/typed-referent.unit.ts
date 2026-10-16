/**
 * Step 4, component 1 — the two reference/condition faults, corrected. Christian, 14 October 2026: *"Please
 * proceed with the three components you've proposed: Correct the two reference/condition faults. … I agree
 * that these capabilities should be independent of whether we ultimately retain the Pass Combination Gate."*
 *
 * The two faults:
 *
 *   1. **Typed referents read as text.** Four gate sites compared a referent as `String(x)`, and a typed
 *      structural reference (SD-98) stringifies to `"[object Object]"` — so a typed referent to a held region
 *      FAILED as naming no held element, and two typed objective-set members always read as equal. SD-101
 *      likewise never compared a typed value with a class's own selector: it was not a string, so it stood.
 *   2. **An established absence read as an obstruction at the position clause**, and that clause deferred
 *      whenever ANYTHING in its check was pending — in every case measured, the open scoring kind rather than
 *      a position.
 *
 * Today's corpus has no positive V14b, J7 or J9 item and no typed value on a selector-constituted line, so the
 * typed half can only be shown over ALTERED COPIES. Every alteration below is made to a deep copy of the
 * derivation input for the possession game form and the Pass Combination Gate — the gate's mechanism
 * demonstration's own knowledge — and is a test device, not authored knowledge. The "before" behaviour quoted
 * in each test was measured on 14 October against the code at 2406881, with the same alterations.
 *
 * Run: npm test
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { justifiedDefaults } from '../realization/justified-defaults'
import { CONFORMANCE_DIR, corpusInput, loadCorpusContracts, loadRegister } from './corpus'
import { runDerivation, runStages0to10 } from './engine'
import { runGates } from './gates'
import { indexRegister } from './register'
import { assembleResolvedGame } from './resolved-game'
import { derivationInputFor } from './run-bounded-selection'
import { relationalReferentOf } from './types'

let passed = 0
function test(name: string, body: () => void): void {
    body()
    passed++
    console.log(`  ok  ${name}`)
}

console.log('typed referents and the position clause — Step 4, component 1')

const GATE = 'blind:PASS-COMBINATION-GATE'
const gateComposition = (): any =>
    JSON.parse(JSON.stringify(derivationInputFor({ selected: [{ id: 'GF2', role: 'game form' }, { id: 'tl-v0-constraint-pass-combination-gate', role: 'constraint' }] })))
const contractOf = (input: any, id: string) => input.contracts.find((c: any) => c.contractId === id)
const typed = (contractId: string, itemId: string) => ({ structuralRef: { contractId, itemId }, asAuthored: `${itemId} (a test device)` })
const testItem = (itemId: string, row: string, selector: string, requirement: string, value: unknown, over: Record<string, unknown> = {}) => ({
    itemId,
    origId: itemId,
    row,
    selector,
    requirement,
    value,
    strictness: 'REQUIRED',
    valueStatus: 'REQUIRED_RANGE',
    scope: 'WHOLE_GAME',
    basis: 'AUTHORED',
    basisEvidence: 'a test fixture, not authored knowledge',
    checkability: 'STRUCTURAL',
    structuralClause: 'whole item',
    ...over,
})
/** Claim a row on a copy, replacing whatever the contract declared there. */
const claim = (contract: any, row: string, selector = '*') => {
    contract.declarations = (contract.declarations ?? []).filter((d: any) => String(d.row) !== row)
    contract.declarations.push({ row, declaration: 'CLAIMED', selector, scope: 'WHOLE_GAME', note: 'a test fixture' })
}
const check = (result: any, checkId: string) => result.gates.gateA.checks.find((c: any) => c.checkId === checkId)
const clause = (result: any, checkId: string, starts: string) => check(result, checkId).clauses.find((c: any) => c.clause.startsWith(starts))
const codes = (result: any) => (result.diagnostics ?? []).map((d: any) => `${d.code}@${d.where}`)

// ── (a) GA-EFFECT-TYPED: a typed V14b referent is looked up as the class it names ─────────────────────
{
    /** One ACCESS consequence whose region referent is a typed reference to a region class of `count`. */
    const consequenceTo = (count: number) => {
        const input = gateComposition()
        const gf2 = contractOf(input, 'restated:GF2')
        gf2.items.push(testItem('T-REGION', 'S2', 'noun=zone', 'COUNT', count))
        gf2.items.push(testItem('T-V11', 'V11', 'effect=ACCESS', 'EXISTS', 'n/a', { valueStatus: 'N/A' }))
        gf2.items.push(testItem('T-V12', 'V12', 'effect=ACCESS', 'EQUALS', 'POSSESSION_CHANGE'))
        gf2.items.push(testItem('T-V14b', 'V14b', 'effect=ACCESS', 'EQUALS', typed('restated:GF2', 'T-REGION')))
        for (const row of ['V11', 'V12', 'V13', 'V14b']) claim(gf2, row, row === 'V11' ? '*' : 'effect=ACCESS')
        return runStages0to10(input) as any
    }
    test('a typed referent to ONE held region passes the uniqueness clause (it failed as "names no held element")', () => {
        const one = consequenceTo(1)
        assert.equal(clause(one, 'GA-EFFECT-TYPED', 'every applicable referent').verdict, 'PASS')
        assert.equal(clause(one, 'GA-EFFECT-TYPED', 'every applicable referent').instances, 1)
        assert.equal(check(one, 'GA-EFFECT-TYPED').verdict, 'PASS')
    })
    test('a typed referent to a class of more than one region still FAILS, now for cardinality and not for a lookup', () => {
        const three = consequenceTo(3)
        assert.equal(clause(three, 'GA-EFFECT-TYPED', 'every applicable referent').verdict, 'FAIL')
        assert.match(check(three, 'GA-EFFECT-TYPED').why, /names a class of up to 3 elements, so it does not resolve to exactly one/)
        assert.doesNotMatch(check(three, 'GA-EFFECT-TYPED').why, /names no held element/)
    })
}

// ── (b) GA-OBJECTIVE-SETS: a typed initial member is compared by identity ────────────────────────────
{
    const objectiveSet = (members: string[], initial: string) => {
        const input = gateComposition()
        const gf2 = contractOf(input, 'restated:GF2')
        gf2.items.push(testItem('T-J5', 'J5', 'scope=BOTH', 'EXISTS', 'n/a', { valueStatus: 'N/A' }))
        members.forEach((member, i) => gf2.items.push(testItem(`T-J7-${i}`, 'J7', 'scope=BOTH', 'EQUALS', typed('restated:GF2', member))))
        gf2.items.push(testItem('T-J9', 'J9', 'scope=BOTH', 'EQUALS', typed('restated:GF2', initial)))
        for (const row of ['J5', 'J6', 'J7', 'J9']) claim(gf2, row, row === 'J5' ? '*' : 'scope=BOTH')
        return runStages0to10(input) as any
    }
    test('a typed initial member that IS a member passes', () => {
        const result = objectiveSet(['GF2-08.c', 'GF2-08.e'], 'GF2-08.c')
        assert.equal(clause(result, 'GA-OBJECTIVE-SETS', 'the named initial member').verdict, 'PASS')
        assert.equal(clause(result, 'GA-OBJECTIVE-SETS', 'every member of an objective set').instances, 2)
    })
    test('a typed initial member that is NOT a member FAILS (it passed: both sides were "[object Object]")', () => {
        const result = objectiveSet(['GF2-08.c'], 'GF2-08.e')
        assert.equal(clause(result, 'GA-OBJECTIVE-SETS', 'the named initial member').verdict, 'FAIL')
        assert.match(check(result, 'GA-OBJECTIVE-SETS').why, /the named initial member is not one of the members/)
    })
}

// ── (c) GA-ONE-PRIMARY-EVENT: a typed V5 referent reaches the position question ──────────────────────
/**
 * The gate's own condition given a place again, ON A COPY — an added V5 item and the gate's V5 claim restored —
 * because his answer of 14 October (C45) removed the place it was authored with ("own half of ATTACKING_TEAM",
 * PCG-06). A test device for the referent reading, not a proposal for the gate.
 */
const withPlace = (value: unknown) => {
    const input = gateComposition()
    const gate = contractOf(input, GATE)
    gate.items.push(testItem('T-V5', 'V5', 'type=connected-pass-combination', 'EQUALS', value))
    claim(gate, 'V5', 'type=connected-pass-combination')
    return runStages0to10(input) as any
}
test('a typed V5 referent to a region is looked up as that region, not reported as "[object Object] names no held element"', () => {
    // Its place typed to the possession game's near-end target region. Before (measured at 2406881 with the
    // gate's own PCG-06 typed the same way): the position clause FAILED with 1 unpositioned referent. Now the
    // referent resolves, its position is a value realization supplies, and the clause defers on exactly that.
    const result = withPlace(typed('restated:GF2', 'GF2-03.e'))
    const position = clause(result, 'GA-ONE-PRIMARY-EVENT', 'every member of the event reference')
    assert.equal(position.verdict, 'DEFERRED_TO_REALIZATION')
    assert.match(check(result, 'GA-ONE-PRIMARY-EVENT').why, /0 unpositioned/)
    assert.match(check(result, 'GA-REFERENCE-INTEGRITY').why, /0 named no held element/)
})

// ── S1b: an established absence is an answer; deferral needs a position to be pending ────────────────
{
    const v5Line = `c:${GATE}:PCG-02::V5`
    test('the gate as his answers leave it: its condition names no place, and the line is a DECLARED GAP that still blocks', () => {
        // C45 removed the place. Until 15 October 2026 the gate's V5 claim was restated NON_CLAIMED and the line was
        // a declared gap only because the possession game's general "the qualifying condition must come from
        // elsewhere" (V5 NOT_AUTHORED) still reached it. **Re-pointed 15 October 2026 (C49, C50).** His reply of that
        // day (16 October, item 8): "removing 'in their half' should not automatically be interpreted as authorizing
        // pass counting anywhere. Please distinguish whether location is explicitly unrestricted or simply not yet
        // authored." The gate's own statement is now NOT_AUTHORED — the place is not yet authored — and the possession
        // game's gap DEFERS to it (Option A, same item). The line is the same declared gap, decided by the gate.
        const result: any = runStages0to10(gateComposition())
        assert.deepEqual([result.classified.get(v5Line).verdict, result.classified.get(v5Line).reason], ['NOT_AUTHORED', 'declared gap'])
        assert.deepEqual(
            result.classified.get(v5Line).governedBy.map((d: any) => `${d.contractId} ${d.declaration}`),
            [`${GATE} NOT_AUTHORED`],
            'the gate says its own place is not yet authored, and that is what governs',
        )
        assert.equal(clause(result, 'GA-ONE-PRIMARY-EVENT', 'every member of the event reference').verdict, 'NOT_EVALUABLE')
        assert.ok(check(result, 'GA-ONE-PRIMARY-EVENT').blockedBy.includes(v5Line))
    })
    test('a condition whose referent line is an established absence names no place: the position clause PASSES (it blocked)', () => {
        // One alteration on top of his answers, **TEST-ONLY and stated as such**: the gate's own V5 statement put
        // back to the NON_CLAIMED C45 wrote before C49 — the "explicitly unrestricted" reading his 16 October item 8
        // rejected — so that, with the possession game's gap deferring (C50), the line is 'not constrained' rather
        // than a declared gap. Re-pointed 15 October 2026: until C49 the same state was reached by dropping the
        // possession game's gap, which no longer suffices once the gate's own statement is a gap. Nothing here
        // authors the place; it shows what the clause does once a line IS an established absence.
        //
        // **Re-pointed 15 October 2026 (stage K1).** Since the deferral tightening recorded beside C50, an UNQUALIFIED
        // non-claim no longer sets the possession game's gap aside (his M6: "No further value is required" must not
        // collapse into a mere non-claim), so the TEST-ONLY statement says explicitly that the place needs no further
        // value — the qualifier is part of the same test device, and still nothing authors the place.
        const input = gateComposition()
        const gateV5 = contractOf(input, GATE).declarations.find((d: any) => d.row === 'V5')
        assert.equal(gateV5.declaration, 'NOT_AUTHORED', 'the copy starts from his answers')
        gateV5.declaration = 'NON_CLAIMED'
        gateV5.qualifier = 'NO_FURTHER_VALUE' // TEST-ONLY
        const result: any = runStages0to10(input)
        assert.deepEqual([result.classified.get(v5Line).verdict, result.classified.get(v5Line).reason], ['NOT_AUTHORED', 'not constrained'])
        const position = clause(result, 'GA-ONE-PRIMARY-EVENT', 'every member of the event reference')
        assert.deepEqual([position.verdict, position.instances], ['PASS', 0])
        assert.match(check(result, 'GA-ONE-PRIMARY-EVENT').why, /1 condition\(s\) name no place/)
        assert.deepEqual(check(result, 'GA-ONE-PRIMARY-EVENT').blockedBy, [])

        /**
         * **A MISSING line still blocks — only an established absence is an answer** (S-B review, 14 October
         * 2026; the case the component left untested). No derivation input can omit a condition's V5 line, so
         * the same gate context is re-run with that one line taken out of the classification: the clause is
         * NOT_EVALUABLE, the check names the line as one that does not exist, and nothing counts it as naming
         * no place.
         */
        const classified = new Map(result.gateContext.classified)
        classified.delete(v5Line)
        const missing: any = runGates({ ...result.gateContext, classified })
        const missingCheck = missing.gateA.checks.find((c: any) => c.checkId === 'GA-ONE-PRIMARY-EVENT')
        assert.equal(missingCheck.clauses.find((c: any) => c.clause.startsWith('every member of the event reference')).verdict, 'NOT_EVALUABLE')
        const block = missing.gateA.blocks.find((b: any) => b.checkId === 'GA-ONE-PRIMARY-EVENT' && b.clause.startsWith('every member of the event reference'))
        assert.deepEqual(block.dependency.rows, [v5Line], 'the block names the line that does not exist (SD-62)')
        assert.doesNotMatch(missingCheck.why, /name no place/)
        assert.equal(missing.gateA.verdict, 'NOT_EVALUABLE')
    })
    test('TIGHTENED: an open-text referent with only the scoring kind pending is NOT_EVALUABLE, no longer DEFERRED', () => {
        // The gate's state until C45: its place was open text, which no realization can resolve. The only line
        // pending was the open scoring kind (`game::V1`), not a position, and the clause deferred on it all the
        // same — measured DEFERRED_TO_REALIZATION at 2406881. A deliberate tightening (14 October 2026): it
        // relieves nothing, and the gate composition was unauthorized before and after.
        const result = withPlace('a place named in open text (a test device)')
        assert.equal(result.classified.get('game::V1').verdict, 'FREE(choice)')
        assert.equal(clause(result, 'GA-ONE-PRIMARY-EVENT', 'every member of the event reference').verdict, 'NOT_EVALUABLE')
    })
}

// ── S1c: SD-101 compares a typed value by class identity ─────────────────────────────────────────────
{
    const v16 = `c:${GATE}:PCG-10::V16`
    const asAuthored = () => {
        // PCG-11 as authored, before his C44 answer typed it: an open-text count.
        const input = gateComposition()
        contractOf(input, GATE).items.find((i: any) => i.itemId === 'PCG-11').value = 'current connected-pass count of ATTACKING_TEAM'
        return runStages0to10(input) as any
    }
    test('a string value that differs from the class-defining term is still CONTRADICTED (today\'s reading kept)', () => {
        assert.ok(codes(asAuthored()).includes(`CONSTITUTIVE_SELECTOR_CONTRADICTED@${v16}`), JSON.stringify(codes(asAuthored())))
    })
    test('a typed value against an open-text term is NOT_COMPARED and stands (it stood only because it was not a string)', () => {
        // PCG-11 as his C44 answer types it — a reference to the gate's own condition — against the selector's
        // open text "connected-pass count".
        const result: any = runStages0to10(gateComposition())
        assert.deepEqual(contractOf(gateComposition(), GATE).items.find((i: any) => i.itemId === 'PCG-11').value.structuralRef, { contractId: GATE, itemId: 'PCG-02' })
        assert.ok(codes(result).includes(`CONSTITUTIVE_SELECTOR_NOT_COMPARED@${v16}`), JSON.stringify(codes(result)))
        assert.ok(!codes(result).includes(`CONSTITUTIVE_SELECTOR_CONTRADICTED@${v16}`))
        // One diagnostic replaced by another: the count does not fall, so nothing is silently decided.
        assert.equal(codes(result).length, codes(asAuthored()).length)
        assert.equal(result.classified.get(v16).verdict, 'RESOLVED:ENTAILED', 'the contribution stands (SD-92)')
    })
    test('a typed value against a class-id term: the same class stands, a different class is CONTRADICTED', () => {
        const against = (target: string) => {
            const input = gateComposition()
            const gate = contractOf(input, GATE)
            // A constructed copy: the information subject re-keyed to a class id the possession game holds.
            for (const i of gate.items) if (String(i.selector).startsWith('subject=')) i.selector = 'subject=c:restated:GF2:GF2-03.e'
            for (const d of gate.declarations) if (String(d.selector).startsWith('subject=')) d.selector = 'subject=c:restated:GF2:GF2-03.e'
            gate.items.find((i: any) => i.itemId === 'PCG-11').value = typed('restated:GF2', target)
            return codes(runStages0to10(input) as any).filter((code: string) => code.endsWith('::V16'))
        }
        assert.deepEqual(against('GF2-03.e'), [])
        assert.equal(against('GF2-03.f').length, 1)
        assert.match(against('GF2-03.f')[0], /^CONSTITUTIVE_SELECTOR_CONTRADICTED@/)
    })

    /**
     * **S-B review, 14 October 2026.** Two readings the component left wrong, each measured at aafef55 over the
     * same copies: an `∈` selector listing a held class id beside open text reported a reference to THAT class
     * as "not compared" — an established agreement reported as undecided — and a reference resolving to no class
     * was described as being compared with "open text" when the selector held only a class id.
     */
    const over = (selector: string, value: unknown) => {
        const input = gateComposition()
        const gate = contractOf(input, GATE)
        for (const i of gate.items) if (String(i.selector).startsWith('subject=')) i.selector = selector
        for (const d of gate.declarations) if (String(d.selector).startsWith('subject=')) d.selector = selector
        gate.items.find((i: any) => i.itemId === 'PCG-11').value = value
        return ((runStages0to10(input) as any).diagnostics ?? []).filter((d: any) => d.where === v16)
    }
    test('an `∈` selector mixing a class id with open text: its own class AGREES, another class is NOT_COMPARED, never CONTRADICTED', () => {
        const mixed = 'subject ∈ {c:restated:GF2:GF2-03.e, a count in open text (a test device)}'
        assert.deepEqual(over(mixed, typed('restated:GF2', 'GF2-03.e')), [], 'identity with one listed member is established (it read NOT_COMPARED)')
        assert.deepEqual(over(mixed, typed('restated:GF2', 'GF2-03.f')).map((d: any) => d.code), ['CONSTITUTIVE_SELECTOR_NOT_COMPARED'], 'the open-text member may be it')
    })
    test('a typed value that resolves to no class is NOT_COMPARED, and the report says so rather than blaming open text', () => {
        const [only, ...rest] = over('subject=c:restated:GF2:GF2-03.e', typed('restated:GF2', 'NO-SUCH-ITEM'))
        assert.deepEqual(rest, [])
        assert.equal(only.code, 'CONSTITUTIVE_SELECTOR_NOT_COMPARED')
        assert.match(only.detail, /resolves to no element class/)
        assert.doesNotMatch(only.detail, /open text/)
    })
}

// ── His answers about the Pass Combination Gate, as knowledge (C44, C45, C46 — 14 October 2026) ──────
{
    const input = gateComposition()
    const result: any = runDerivation(input)
    const staged: any = runStages0to10(input)
    const resolved = assembleResolvedGame(result, staged.classes, indexRegister(input.register), input.contracts)
    const v6 = `c:${GATE}:PCG-02::V6`

    test('"removed from the active gate knowledge, retaining the original for provenance" (C45)', () => {
        const gate = contractOf(input, GATE)
        assert.ok(!gate.items.some((i: any) => ['PCG-06', 'PCG-07'].includes(i.itemId)), 'neither reaches derivation')
        const original = fs.readFileSync(path.join(CONFORMANCE_DIR, 'stage-b/contracts.json'), 'utf8')
        assert.ok(original.includes('"PCG-06"') && original.includes('own half of ATTACKING_TEAM') && original.includes('"PCG-07"'), 'and both stay verbatim in contracts.json')
        // The claims that cited them are restated with them. The place, V5, was NON_CLAIMED until 15 October 2026 and
        // is NOT_AUTHORED since (C45/C49): his reply of that day (16 October, item 8) — "Please distinguish whether
        // location is explicitly unrestricted or simply not yet authored" — and it is not yet authored. The half,
        // SV1, is unchanged: with the place gone nothing in the gate needs it.
        assert.deepEqual(
            gate.declarations.filter((d: any) => ['V5', 'SV1'].includes(d.row)).map((d: any) => [d.row, d.declaration]).sort(),
            [['SV1', 'NON_CLAIMED'], ['V5', 'NOT_AUTHORED']],
        )
    })

    test('"a preferred range of 4–6, not a requirement or a predetermined starting count" (C46): guidance beside the value, never a value', () => {
        const pcg04 = contractOf(input, GATE).items.find((i: any) => i.itemId === 'PCG-04')
        assert.deepEqual([pcg04.typedBound, pcg04.strictness, pcg04.valueStatus], [{ min: 4, max: 6 }, 'SUPPORTING', 'PREFERRED_DEFAULT'])
        // The condition's value is entailed by PCG-05 alone; the 4-6 sits beside it as a preferred bound.
        assert.equal(staged.classified.get(v6).verdict, 'RESOLVED:ENTAILED')
        const derived = resolved.derived.find(d => d.lineId === v6)!
        assert.deepEqual(derived.support.map((s: any) => s.itemId), ['PCG-05'])
        assert.deepEqual(resolved.extentBounds[v6], [{ kind: 'COUNT', min: 4, max: 6, term: 'minimum connected passes: 4 to 6', preferred: true }])
        // **No justified default and no choice ever picks a pass count.** The line is never open, so no rule can
        // close it, and no realization choices are recorded for the gate.
        assert.ok(!resolved.open.some(o => o.lineId === v6))
        assert.ok(!justifiedDefaults(resolved, []).some((d: any) => d.lineId === v6 || String(d.path ?? '').startsWith('value.primaryEvent.conditions')))
        const index = fs.readFileSync(path.join(CONFORMANCE_DIR, '../realization-choices-index.json'), 'utf8')
        assert.ok(!index.includes('PASS-COMBINATION'), 'no realization choice is recorded for the gate')
    })

    test('"the counting information refers to that gate\'s own condition" (C44) — and Gate A now stops on the place alone', () => {
        assert.equal(check(staged, 'GA-INFORMATION').verdict, 'PASS', 'the typed subject is evaluable: GA-INFORMATION no longer blocks')
        // Measured 14 October: FAIL on GA-NO-FAILED-LINE, at the condition's place, a declared gap — the design's
        // own measurement. Moving it needs his precedence decision (OD1); nothing here supplies it.
        assert.equal(resolved.coherence.gateA, 'FAIL')
        assert.deepEqual(resolved.coherence.notAuthorizedBecause, [
            'a pre-realization Gate A invariant fails: GA-NO-FAILED-LINE',
            `1 unresolved property is neither an authorized choice nor an authorized claim: c:${GATE}:PCG-02::V5`,
        ])
    })
}

// ── The corpus-wide run: nothing typed reaches these sites, and the one clause S1b tightened ─────────
test('the corpus-wide Gate A, check by check', () => {
    // Pinned 14 October 2026 after component 1. Every check's verdict is what it was at 2406881 except
    // GA-ONE-PRIMARY-EVENT, which moved DEFERRED_TO_REALIZATION → NOT_EVALUABLE: its position clause had
    // deferred on whatever was pending in the check while none of what it was blocked on was a position.
    // **Corrected in the S-B review (14 October)**, measured line by line: at 2406881 the blockers were the
    // gate's open-text "own half"; RPC-001's control and exclusion places (18.f, 19.a), which are DECLARED GAPS,
    // not open text; RPC-001's progression place (18.c), open text; and its origin place (18.a), a FREE choice
    // between two open-text placements. After C45 the gate's place is a declared gap too. The tightening above,
    // and the only check that moved (re-measured in the review against 2406881, corpus-wide and for GF2 with
    // each contract: no other check moved). His gate answers (C44-C46) moved no check verdict on the corpus-wide
    // run: GA-NO-FAILED-LINE gained the gate's V5 as a 13th unestablished line, and one diagnostic changed kind.
    //
    // Note the FREE origin place: an open REFERENT line counts as blocked, not as a position pending, so it does
    // not defer either. Here that is right — realization would close it to open text, which no realization can
    // position — and it is pinned so a change to it is a visible decision (raised with the lead).
    const result: any = runStages0to10(corpusInput())
    const primaryEvent = check(result, 'GA-ONE-PRIMARY-EVENT')
    for (const [id, verdict] of [[`c:${GATE}:PCG-02::V5`, 'NOT_AUTHORED']]) {
        assert.ok(primaryEvent.blockedBy.includes(id) || primaryEvent.pendingOn.includes(id), id)
        assert.equal(result.classified.get(id).verdict, verdict, id)
    }
    // **15 October 2026 (stage K5, C58): the origin place is no longer an open choice between two placement texts.** His 18
    // October acknowledgement types it as the restarts that begin a build-out episode, so the line is derived, names no
    // place, and blocks nothing here (which restarts meet it is GA-EPISODE-REACHABLE's question). It read FREE(choice).
    const origin = 'c:restated:RPC-001:RPC-001-18.a::V5'
    assert.equal(result.classified.get(origin).verdict, 'RESOLVED:ENTAILED')
    assert.ok(!primaryEvent.blockedBy.includes(origin) && !primaryEvent.pendingOn.includes(origin))
    // **15 October 2026 (stage K1, C57): RPC-001's control and exclusion places are no longer declared gaps.** His M8
    // typed each as the objective reference of the scoring team, so both lines are derived (section (f) below).
    for (const id of ['c:restated:RPC-001:RPC-001-18.f::V5', 'c:restated:RPC-001:RPC-001-19.a::V5']) {
        assert.equal(result.classified.get(id).verdict, 'RESOLVED:ENTAILED', id)
    }
    const verdicts = Object.fromEntries(result.gates.gateA.checks.map((c: any) => [c.checkId, c.verdict]))
    assert.deepEqual(verdicts, {
        // Added 14 October 2026 with register row P6c (his allegiance ruling). On the corpus-wide run the neutral
        // timing is IMMEDIATE (C43) and the possession relation is a gap ('no coverage' with the gate's knowledge
        // around it), so whether an immediate switch has a change of possession to follow is not yet decidable.
        'GA-AFFILIATION': 'NOT_EVALUABLE',
        // NOT_EVALUABLE -> DEFERRED_TO_REALIZATION on 15 October 2026 (C51, his 9.5: "Retire the redundant separate
        // scoring objective: Approved, provided the live attacking objective remains represented"). The context's
        // separate objective, whose target nothing resolved (RPC-001-11.a::J2), was what made the ends clause
        // unevaluable; the two per-team targets left are positioned only by realization. derivation-stage10 pins why.
        'GA-DIRECTION': 'DEFERRED_TO_REALIZATION',
        'GA-EFFECT-TYPED': 'PASS',
        'GA-ENVELOPE-FIT': 'DEFERRED_TO_REALIZATION',
        // Added 15 October 2026 (the eighteenth check), passing with no applicable instance until C52 the same day
        // scoped RPC-001's four build-out conditions to the build-out episode (his 9.3). Corpus-wide the goal-kick
        // situation (A01-02) holds a restart transition that might begin one, and its taker is unauthored, so the
        // check cannot tell and withholds: NOT_EVALUABLE, never a pass. Composed without A01-02 it FAILS
        // (condition-scope.unit.ts).
        'GA-EPISODE-REACHABLE': 'NOT_EVALUABLE',
        'GA-INFORMATION': 'FAIL',
        'GA-LAYOUT-FEASIBLE': 'DEFERRED_TO_REALIZATION',
        'GA-MODIFIER-OVERLAP': 'NOT_EVALUABLE',
        'GA-NO-FAILED-LINE': 'FAIL',
        'GA-OBJECTIVE-SETS': 'PASS',
        'GA-ONE-PRIMARY-EVENT': 'NOT_EVALUABLE',
        'GA-REFERENCE-INTEGRITY': 'NOT_EVALUABLE',
        'GA-REGION-FUNCTION': 'PASS',
        // Added 15 October 2026 (stage K6, the nineteenth check, his M7). The corpus holds no position stated relative to another
        // element or to a team (a provisional realization joins only the goal its record names), so it passes with no applicable
        // instance.
        'GA-RELATIVE-PLACEMENT': 'PASS',
        'GA-ROSTER-SUM': 'DEFERRED_TO_REALIZATION',
        'GA-TIME-WINDOWS': 'PASS',
        'GA-TRANSITION-COHERENCE': 'NOT_EVALUABLE',
        'GA-TRIGGER-REACHABLE': 'FAIL',
        'GA-TRIGGER-UNIQUE': 'PASS',
    })
    assert.equal(result.gates.gateA.verdict, 'FAIL')
    assert.equal(check(result, 'GA-RELATIVE-PLACEMENT').clauses.every((c: any) => c.basis === 'NO_APPLICABLE_INSTANCES'), true)
    // 13 -> 10 on 15 October 2026 (stage K1): RPC-001-18.f::V5 and 19.a::V5 derived by C57 (his M8), and 18.a::V6
    // 'excluded' corpus-wide by C55 (his 9.9, decided with the Neutral Player Condition's own exclusion beside it).
    assert.match(check(result, 'GA-NO-FAILED-LINE').why, /^10 required line\(s\) are unestablished/)
    // PCG-11's CONTRADICTED became NOT_COMPARED when C44 typed it (S1c); the other two are untouched.
    assert.deepEqual(codes(result).sort(), [
        `CONSTITUTIVE_SELECTOR_CONTRADICTED@c:${GATE}:PCG-02::V4`,
        'CONSTITUTIVE_SELECTOR_CONTRADICTED@c:restated:VARIABLE-TARGET-CONDITION:VARTARGET-13.a::V16',
        `CONSTITUTIVE_SELECTOR_NOT_COMPARED@c:${GATE}:PCG-10::V16`,
    ])
    // No report prints a typed referent as "[object Object]" any more.
    assert.ok(!JSON.stringify(result.gates).includes('[object Object]'))
    // The copies above reached nothing shared.
    assert.ok(!JSON.stringify(loadCorpusContracts()).includes('a test fixture, not authored knowledge'))
})

// ── (f) M8: the relational referent — "the objective reference of SCORING_TEAM" (C57, stage K1) ──────────────
/**
 * His 17 October words: *"M8 — Controlled arrival and long-clearance validation: Approved. Apply the qualifying
 * conditions to the target and scoring episode actually being evaluated. The purpose is to recognize controlled,
 * functional progression rather than reward an uncontrolled clearance. Please ensure this does not inadvertently
 * prohibit a functional longer pass that is received under control beyond pressure."* And 16 October, 9.2: *"provided
 * they are evaluated against the intended progression outcome and not merely whichever target the current engine can
 * represent."*
 *
 * C57 types the referents of RPC-001's control condition (18.f) and long-clearance exclusion (19.a) as the objective
 * reference of SCORING_TEAM (register V5, version 2). "The objective reference of SCORING_TEAM" is OUR M8 wording,
 * approved by his "M8 ... Approved."; it is not his sentence. 18.d — the progression reference — is NOT retyped by
 * M8 (C54/D3/M7), and it is still open text; where a test needs every referent typed, a TEST-ONLY copy types it too,
 * and says so.
 */
{
    const RPC = 'restated:RPC-001'
    const A01_FORMS = () => JSON.parse(JSON.stringify(derivationInputFor({ selected: [{ id: 'restated:GF2', role: 'game form' }, { id: RPC, role: 'context' }] })))
    const CONTROL = `c:${RPC}:RPC-001-18.f::V5`
    const EXCLUSION = `c:${RPC}:RPC-001-19.a::V5`
    const relational = { objectiveReferenceOf: 'SCORING_TEAM', role: 'PRIMARY_SCORING' }
    /** TEST-ONLY: 18.d's open-text progression reference typed the same way, so nothing else blocks the referent checks. */
    const progressionTyped = (input: any) => {
        contractOf(input, RPC).items.find((i: any) => i.itemId === 'RPC-001-18.d').value = { ...relational, asAuthored: 'TEST-ONLY: not a ruling' }
        return input
    }

    test('C57: the control and long-clearance referents are derived as the objective reference of SCORING_TEAM, and no longer block', () => {
        const result = runStages0to10(A01_FORMS()) as any
        for (const lineId of [CONTROL, EXCLUSION]) {
            assert.equal(result.classified.get(lineId).verdict, 'RESOLVED:ENTAILED', lineId)
            const value = result.derived.lines.get(lineId).entailing[0].value
            assert.deepEqual({ objectiveReferenceOf: value.objectiveReferenceOf, role: value.role }, relational, lineId)
            assert.ok(!check(result, 'GA-NO-FAILED-LINE').subjects.includes(lineId), `${lineId} leaves the blockers`)
        }
        // Carried onto the resolved game's conditions whole, beside the scope C52 gave them: within a build-out episode.
        const game: any = assembleResolvedGame(runDerivation(A01_FORMS()) as any, result.classes, indexRegister(loadRegister()), A01_FORMS().contracts)
        const conditions = game.game.value.primaryEvent.conditions.filter((c: any) => ['control', 'exclusion'].includes(c.type))
        assert.deepEqual(conditions.map((c: any) => [c.type, c.scope, c.referents.objectiveReferenceOf, c.referents.role]), [
            ['control', 'BUILD_OUT_EPISODE', 'SCORING_TEAM', 'PRIMARY_SCORING'],
            ['exclusion', 'BUILD_OUT_EPISODE', 'SCORING_TEAM', 'PRIMARY_SCORING'],
        ])
    })

    test('C57: it resolves to the target each team attacks — per team, that team\'s own target — and the referent checks pass on it', () => {
        // With the progression reference typed too (TEST-ONLY), every referent of every condition is typed: the
        // reference check resolves them all and the position clause waits only on where realization puts the targets.
        const result = runStages0to10(progressionTyped(A01_FORMS())) as any
        assert.equal(check(result, 'GA-REFERENCE-INTEGRITY').verdict, 'PASS')
        assert.match(check(result, 'GA-REFERENCE-INTEGRITY').why, /0 named no held element; 0 established no structural identity/)
        // **Re-pointed 15 October 2026 (stage K5, C58).** The position clause was withheld by the ORIGIN's referent alone (18.a::V5,
        // then a free choice between two open-text placements). His 18 October acknowledgement typed it as the restarts that
        // begin a build-out episode, which names no place, so with the progression reference typed too (TEST-ONLY) the clause
        // waits only on where realization puts the targets: DEFERRED, not withheld. Nothing it designates is unpositioned,
        // and neither relational line is what it waits on.
        const primaryEvent = check(result, 'GA-ONE-PRIMARY-EVENT')
        assert.equal(clause(result, 'GA-ONE-PRIMARY-EVENT', 'every member of the event reference').verdict, 'DEFERRED_TO_REALIZATION')
        assert.match(primaryEvent.why, /0 unpositioned; 1 condition\(s\) name no place/)
        assert.ok(!primaryEvent.pendingOn.includes(`c:${RPC}:RPC-001-18.a::V5`), 'the origin is no longer what it waits on')
        for (const lineId of [CONTROL, EXCLUSION]) assert.ok(!primaryEvent.blockedBy.includes(lineId), `${lineId} does not block the position clause`)
        // What it designates: the two PRIMARY_SCORING objectives' own references — each team's target at the opposite end.
        const objectives = result.classes.filter((c: any) => c.row === 'J1' && !c.constraints.any)
        const targets = objectives.map((o: any) => result.derived.lines.get(`${o.classId}::J2`).entailing[0].value.structuralRef.itemId).sort()
        assert.deepEqual(targets, ['GF2-03.e', 'GF2-03.f'])
    })

    test('C57: a relational referent that designates nothing FAILS, one that designates open text is a gap — it is never read as text', () => {
        const withControl = (value: unknown, alter: (input: any) => void = () => undefined) => {
            const input = progressionTyped(A01_FORMS())
            contractOf(input, RPC).items.find((i: any) => i.itemId === 'RPC-001-18.h').value = value
            alter(input)
            return runStages0to10(input) as any
        }
        // A designation the register does not define (TEST-ONLY).
        const unregistered = withControl({ objectiveReferenceOf: 'NO_SUCH_TEAM', role: 'PRIMARY_SCORING' })
        assert.equal(check(unregistered, 'GA-REFERENCE-INTEGRITY').verdict, 'FAIL')
        assert.match(check(unregistered, 'GA-REFERENCE-INTEGRITY').why, /1 named no held element/)
        assert.equal(clause(unregistered, 'GA-ONE-PRIMARY-EVENT', 'every member of the event reference').verdict, 'FAIL')
        // K2 review, 15 October 2026: since the designation resolver landed (stage K2) a value it can MAP to an entry -- a
        // team named by its own id, prose ending "(= ENTRY)" -- is not thereby an entry the referent may designate. Before K2
        // both FAILED here as unregistered; at K2 they were read as registered and resolved to every objective of the role
        // (a FAIL that became a resolution, with no ruling for it). The referent names a register entry or nothing.
        for (const designated of ['TEAM_RED', 'the scorers (= SCORING_TEAM)']) {
            const mapped = withControl({ objectiveReferenceOf: designated, role: 'PRIMARY_SCORING' })
            assert.equal(check(mapped, 'GA-REFERENCE-INTEGRITY').verdict, 'FAIL', `${designated}: TEST-ONLY`)
        }
        // A role no individuated objective of this game has. The possession game also asserts, without individuating
        // them, that each side has at least one objective (GF2-09.a, existential coverage under SD-97), so one of that
        // role might exist: what the referent designates is unknown — a gap naming the line, never a pass and never a
        // failure the knowledge does not establish.
        const noRole = withControl({ objectiveReferenceOf: 'SCORING_TEAM', role: 'REPRESENTATIVE' })
        assert.equal(check(noRole, 'GA-REFERENCE-INTEGRITY').verdict, 'NOT_EVALUABLE')
        assert.ok(check(noRole, 'GA-REFERENCE-INTEGRITY').blockedBy.includes(CONTROL), 'blocked on the relational line')
        // An objective whose reference is open text: what it designates has no identity — a gap naming the line, not a pass.
        const openText = withControl({ ...relational }, input => {
            contractOf(input, 'restated:GF2').items.find((i: any) => i.itemId === 'GF2-08.d').value = 'the far target (TEST-ONLY open text)'
        })
        assert.equal(check(openText, 'GA-REFERENCE-INTEGRITY').verdict, 'NOT_EVALUABLE')
        assert.ok(check(openText, 'GA-REFERENCE-INTEGRITY').blockedBy.includes(CONTROL), 'the block names the relational line')
        // Written as a SET of referents it is one member per designation, never "[object Object]". (TEST-ONLY: the copy's
        // value status is set so the array is a set of members, not SD-78's set of permitted alternatives.)
        const asSet = withControl([{ ...relational }], input => {
            contractOf(input, RPC).items.find((i: any) => i.itemId === 'RPC-001-18.h').valueStatus = 'N/A'
        })
        assert.ok([...asSet.classified.keys()].includes(`${CONTROL}::objective-reference-of:SCORING_TEAM:PRIMARY_SCORING`))
        assert.ok(!JSON.stringify([...asSet.classified.keys()]).includes('[object Object]'))
    })

    test("C57 / his M8 safeguard: a longer pass received under control is not excluded — the exclusion is the authored term only, and 'long' has no threshold", () => {
        const loaded: any = loadCorpusContracts().find(c => c.contractId === RPC)!
        const item = (id: string) => loaded.items.find((i: any) => i.itemId === id)
        // His sentence, verbatim, beside the exclusion it guards.
        assert.ok(item('RPC-001-19.b').fitNote.includes('"Please ensure this does not inadvertently prohibit a functional longer pass that is received under control beyond pressure."'))
        // The exclusion excludes what was authored and nothing more: a clearance that HAPPENS to reach the target.
        assert.equal(item('RPC-001-19.b').value, 'a long clearance that happens to reach the target')
        // Nothing gives "long" a number: the exclusion's value stays the qualitative term, and RPC-001 still says no
        // threshold is authored for it.
        assert.ok(loaded.declarations.some((d: any) => d.row === 'V6' && d.declaration === 'NOT_AUTHORED' && d.selector === 'type=exclusion'))
        assert.ok(!loaded.items.some((i: any) => ['V3', 'V5', 'V6'].includes(String(i.row)) && /\d+\s*m\b|metre|meter|distance|length/i.test(JSON.stringify(i.value))), 'no pass length or distance anywhere in the build-out condition')
        // No condition of the game is about pass length: the four authored types and no other.
        const result = runStages0to10(A01_FORMS()) as any
        const types = result.classes.filter((c: any) => c.row === 'V3').map((c: any) => c.constraints.terms.find((t: any) => t.attribute === 'type')?.value).sort()
        assert.deepEqual(types, ['control', 'exclusion', 'origin', 'progression'])
        // And the control condition is judged on arrival at the target the scoring team attacks — wherever the pass
        // came from: its value is the authored "controlled on arrival", typed to no pass length or origin of the ball.
        assert.equal(item('RPC-001-18.g').value, 'controlled on arrival')
        assert.deepEqual({ objectiveReferenceOf: item('RPC-001-18.h').value.objectiveReferenceOf, role: item('RPC-001-18.h').value.role }, relational)
    })

    test('C57 and C59: a relational referent enters the knowledge only through a ruling — the three loaded are C57\'s and C59\'s, and no authored file carries one', () => {
        // Added at the K1 review, 15 October 2026. The register's V5 text says the relational form is "Written only by a
        // ruled restatement (C57), never inferred from prose"; until now nothing held the knowledge to that sentence.
        // Every value the engine loads, a set's members included, is read by the one recogniser the gates use.
        const relationalIn = (value: unknown) => (Array.isArray(value) ? value : [value]).some(member => relationalReferentOf(member) !== null)
        const loaded = loadCorpusContracts().flatMap(contract => contract.items.filter(item => relationalIn(item.value)).map(item => `${contract.contractId}::${item.itemId}`))
        // 15 October 2026 (stage K6): ruling C59 restates RPC-001-18.d's value to the same form - the progression reference C54
        // recorded, typed as C54 said M8 would type it. The third, and the one item restatement that writes one.
        assert.deepEqual(loaded, [`${RPC}::RPC-001-18.d`, `${RPC}::RPC-001-18.h`, `${RPC}::RPC-001-19.c`])
        const restatements = JSON.parse(fs.readFileSync(path.join(CONFORMANCE_DIR, 'stage-b/corpus-restatements.json'), 'utf8').replace(/^﻿/, ''))
        const ruled = (restatements.added ?? []).filter((entry: any) => relationalIn(entry.item?.value)).map((entry: any) => `${entry.item.itemId} ${entry.ruling}`)
        assert.deepEqual(ruled, ['RPC-001-18.h C57', 'RPC-001-19.c C57'], 'each added by the ruling that records his M8')
        // Nor does an authored file carry one, and the one value restatement that writes one is C59's (stage K6).
        assert.deepEqual((restatements.items ?? []).filter((entry: any) => relationalIn(entry.set?.value)).map((entry: any) => `${entry.item} ${entry.ruling}`), [`${RPC}::RPC-001-18.d C59`])
        for (const file of ['stage-b/contracts.json', 'stage-b/sport-profile-soccer.json']) {
            assert.ok(!fs.readFileSync(path.join(CONFORMANCE_DIR, file), 'utf8').includes('objectiveReferenceOf'), `${file} carries none`)
        }
    })
}

console.log(`typed-referent.unit.ts — ${passed} passed`)
