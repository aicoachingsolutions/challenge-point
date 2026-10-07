/**
 * Derivation engine — increment 4 (stage 10: the gates), plus the three stage 5/6 defects it found.
 *
 * The rules under test above all others:
 *   - Gate A never issues a `PASS` it has not earned, and never reports missing knowledge as a failure
 *     of the game — SD-28's discipline carried into the gate;
 *   - a `PASS` always travels with the exact list of what it did not establish (SD-43);
 *   - `GA-MODIFIER-OVERLAP` refuses rather than inventing a test he has not authored;
 *   - Gate B reverse is `NOT_APPLICABLE` in derivation mode, never a `PASS` it has not earned.
 *
 * Run: npm test
 */
import assert from 'node:assert/strict'

import { corpusInput } from './corpus'
import { runStages0to10 } from './engine'
import { compare, toRational } from './rational'
import { ContractItem, DerivationInput, LoadedContract } from './types'
import { loadCorpusContracts, loadRegister } from './corpus'
import { derivationInputFor, selectFor } from './run-bounded-selection'

const REGISTER = loadRegister()

function item(overrides: Partial<ContractItem> = {}): ContractItem {
    return {
        itemId: 'I-1',
        row: 'S2',
        selector: 'noun=channel',
        requirement: 'EXISTS',
        value: 'a channel',
        strictness: 'REQUIRED',
        valueStatus: 'N/A',
        scope: 'WHOLE_GAME',
        basis: 'AUTHORED',
        basisEvidence: { quote: 'a channel', sourceId: 'SRC-1' },
        checkability: 'STRUCTURAL',
        ...overrides,
    }
}

function contract(items: ContractItem[], overrides: Partial<LoadedContract> = {}): LoadedContract {
    return {
        contractId: 'C-1',
        objectId: 'O-1',
        knowledgeVersion: '1',
        items,
        declarations: [],
        ...overrides,
    }
}

function input(contracts: LoadedContract[], envelope: any = { players: 12, lengthM: 40, widthM: 30, durationMin: 20 }): DerivationInput {
    return {
        selection: contracts.map(c => ({ objectId: c.objectId, knowledgeVersion: '1' })),
        contracts,
        envelope,
        register: REGISTER,
        derivationRules: { version: 'rev-5' },
    }
}

const gateA = (result: any) => result.gates.gateA
const check = (result: any, checkId: string) => gateA(result).checks.find((c: any) => c.checkId === checkId)

let passed = 0
function test(name: string, body: () => void): void {
    body()
    passed++
    console.log(`  ok  ${name}`)
}

console.log('derivation increment 4 — stage 10, the gates')

// ---------------------------------------------------------------------------------------------
// Exact rationals (§1.9). A gate that certifies a layout must not turn on a float artefact.
// ---------------------------------------------------------------------------------------------

test('exact rationals: 0.1 + 0.2 compares equal to 0.3, where floats do not', () => {
    assert.equal(0.1 + 0.2 === 0.3, false, 'the float trap this exists to avoid')
    const tenth = toRational('0.1')!
    const fifth = toRational('0.2')!
    const threeTenths = toRational('0.3')!
    const sum = { n: tenth.n * fifth.d + fifth.n * tenth.d, d: tenth.d * fifth.d }
    assert.equal(compare(sum, threeTenths), 0)
})

test('exact rationals: a value with no exact decimal spelling is rejected, never rounded', () => {
    assert.equal(toRational('about 12'), null)
    assert.equal(toRational(Number.NaN), null)
    assert.equal(toRational(Number.POSITIVE_INFINITY), null)
    assert.equal(toRational({ term: 'beyond' }), null)
})

// ---------------------------------------------------------------------------------------------
// The session as a resolving source (§1.2, §1.4). The first implementation dropped all four values.
// ---------------------------------------------------------------------------------------------

test('the session resolves the four envelope rows, and resolvedBy names it', () => {
    const result: any = runStages0to10(input([contract([item()])]))
    for (const [lineId, expected] of [
        ['game::E1', 12],
        ['game::E2', 40],
        ['game::E3', 30],
        ['game::E4', 20],
    ] as const) {
        const line = result.classified.get(lineId)
        assert.equal(line.verdict, 'RESOLVED:ENTAILED', `${lineId} should be resolved by the session`)
        assert.equal(line.resolvedBy, 'SESSION')
        assert.equal(result.derived.lines.get(lineId).session.value, expected)
    }
})

test('a session row the envelope does not supply stays a gap, and no value is guessed', () => {
    const result: any = runStages0to10(input([contract([item()])], { players: 12 }))
    assert.equal(result.classified.get('game::E1').verdict, 'RESOLVED:ENTAILED')
    assert.equal(result.classified.get('game::E2').verdict, 'NOT_AUTHORED')
    assert.equal(result.derived.lines.get('game::E2').session, null)
})

test('a standing decision carries its stated value onto the line (§1.4 requires one)', () => {
    const result: any = runStages0to10(input([contract([item()])]))
    const line = result.classified.get('game::V2')
    assert.equal(line.verdict, 'RESOLVED:ENTAILED')
    assert.equal(line.resolvedBy, 'STANDING_DECISION')
    assert.equal(result.derived.lines.get('game::V2').standingValue.id, 'SD-25')
    assert.equal(result.derived.lines.get('game::V2').standingValue.value, 1)
})

test('no line is RESOLVED while holding no value', () => {
    const result: any = runStages0to10(input([contract([item()])]))
    const valueless = result.stopped.filter((s: any) => /carry no value/.test(s.why))
    assert.equal(valueless.length, 0, `resolved lines with no value: ${JSON.stringify(valueless)}`)
})

// ---------------------------------------------------------------------------------------------
// The GAP record §3.2 raises at stage 6, which increment 3 omitted.
// ---------------------------------------------------------------------------------------------

test('every NOT_AUTHORED line carries exactly one GAP failure record', () => {
    const result: any = runStages0to10(input([contract([item()])]))
    const gaps = result.failures.filter((f: any) => f.kind === 'GAP')
    const unauthored = [...result.classified.values()].filter((l: any) => l.verdict === 'NOT_AUTHORED')
    assert.equal(gaps.length, unauthored.length)
    assert.deepEqual(
        gaps.map((g: any) => g.locus.lineId).sort(),
        unauthored.map((l: any) => l.lineId).sort(),
    )
    assert.equal(new Set(gaps.map((g: any) => g.failureId)).size, gaps.length, 'one gap, one id')
})

// ---------------------------------------------------------------------------------------------
// The rule that matters most: a gap blocks the gate; it never fails the game.
// ---------------------------------------------------------------------------------------------

test('GA-ROSTER-SUM blocks on an unauthored roster rather than reporting it does not add up', () => {
    const result: any = runStages0to10(input([contract([item()])]))
    const roster = check(result, 'GA-ROSTER-SUM')
    assert.equal(roster.verdict, 'NOT_EVALUABLE')
    assert.notEqual(roster.verdict, 'FAIL', 'an unauthored roster is not a roster that fails to add up')
    assert.ok(roster.blockedBy.includes('game::P5'), 'the blocking line is named')
})

test('a real roster violation does fail — the block is not a way of never failing', () => {
    const contracts = [
        contract([
            item({ itemId: 'T-1', row: 'P1', selector: 'team=A', requirement: 'EXISTS', value: 'a team' }),
            item({ itemId: 'T-2', row: 'P2', selector: 'team=A', requirement: 'EQUALS', value: 4 }),
            item({ itemId: 'T-3', row: 'P3', selector: 'team=A', requirement: 'EQUALS', value: 1 }),
            item({ itemId: 'N-1', row: 'P5', requirement: 'EQUALS', value: 0, selector: '*' }),
        ]),
    ]
    const result: any = runStages0to10(input(contracts, { players: 99, lengthM: 40, widthM: 30, durationMin: 20 }))
    const roster = check(result, 'GA-ROSTER-SUM')
    assert.equal(roster.verdict, 'FAIL')
    assert.equal(roster.blockedBy.length, 0, 'nothing was missing: the sum was computed and disagreed')
})

test('no Gate A check ever returns PASS while naming a line it was blocked on', () => {
    for (const source of [input([contract([item()])]), corpusInput()]) {
        const result: any = runStages0to10(source)
        for (const c of gateA(result).checks) {
            if (c.blockedBy.length) assert.notEqual(c.verdict, 'PASS', `${c.checkId} passed while blocked on ${c.blockedBy.join(', ')}`)
        }
    }
})

// ---------------------------------------------------------------------------------------------
// GA-NO-FAILED-LINE — the check that owns incompleteness (§1.4).
// ---------------------------------------------------------------------------------------------

test('GA-NO-FAILED-LINE fails on a REQUIRED gapped line and names it', () => {
    // Required, because an object declares it needs the row and cannot author it. His governing
    // distinction of 29 September: "a line is a realization-blocking gap only when the resolved game
    // requires that property to be established and no authority establishes it."
    const c = contract([item()])
    c.declarations.push({ row: 'S4', declaration: 'NOT_AUTHORED', note: 'needs a function it cannot author' })
    const noFailed = check(runStages0to10(input([c])), 'GA-NO-FAILED-LINE')
    assert.equal(noFailed.verdict, 'FAIL')
    assert.ok(noFailed.subjects.length > 0, 'the failed lines are named, not merely counted')
    assert.match(noFailed.why, /required line\(s\) are unestablished/)
})

test('GA-NO-FAILED-LINE distinguishes the four cases, and counts what it did not block on', () => {
    // Each of the three non-blocking cases on its own, then all together. None may fail the check,
    // and every one must still be reported — the danger here is a check that stops failing.
    for (const declaration of ['EXCLUDED', 'NON_CLAIMED', 'UNDECLARED']) {
        const c = contract([item()])
        c.declarations.push({ row: 'S4', declaration, note: '' })
        const outcome = check(runStages0to10(input([c])), 'GA-NO-FAILED-LINE')
        assert.equal(outcome.verdict, 'PASS', `${declaration} is an established absence or a non-requirement, not a missing value`)
        assert.match(outcome.why, /excluded, .* not constrained, .* unspoken/, 'the non-blocking lines are still counted in the reason')
    }

    // And a required line beside them still blocks: this must not become a way of never failing.
    const mixed = contract([item()])
    mixed.declarations.push({ row: 'S3', declaration: 'NON_CLAIMED', note: '' })
    mixed.declarations.push({ row: 'S4', declaration: 'NOT_AUTHORED', note: 'needs it, cannot author it' })
    const outcome = check(runStages0to10(input([mixed])), 'GA-NO-FAILED-LINE')
    assert.equal(outcome.verdict, 'FAIL')
    assert.ok(outcome.subjects.some((s: string) => s.endsWith('::S4')), 'the required line is named')
    assert.ok(!outcome.subjects.some((s: string) => s.endsWith('::S3')), 'the non-constrained line is not blamed for it')
})

test('a game selecting no neutral-player knowledge is not incomplete for lacking neutral properties', () => {
    // His explicit test. GF2 declares "performers outside the two teams are neither authored nor
    // forbidden", so P5/P6a/P6b/P7 have no values — and that is a game with no neutrals, not an
    // unfinished one. The second half matters as much: realization gets no authority from this.
    const result: any = runStages0to10(derivationInputFor(selectFor('A01', 'A01-02')))
    const neutralRows = ['P5', 'P6a', 'P6b', 'P7']
    const neutralLines = [...result.classified.values()].filter((l: any) => neutralRows.includes(String(l.lineId).split('::').pop()))
    assert.ok(neutralLines.length > 0, 'the rows are enumerated')
    for (const line of neutralLines) {
        assert.equal(line.reason, 'not constrained', `${line.lineId} is a non-requirement`)
    }
    assert.ok(
        !check(result, 'GA-NO-FAILED-LINE').subjects.some((s: string) => neutralRows.includes(s.split('::').pop()!)),
        'no neutral row blocks the gate',
    )
    // And none of them is open, so a realization layer is never handed authority to invent a neutral.
    for (const line of neutralLines) assert.ok(!String(line.verdict ?? '').startsWith('FREE'), `${line.lineId} is not a realization choice`)
})

test('GA-NO-FAILED-LINE counts an UNRESOLVED line as failed, not only a gap', () => {
    const contracts = [
        contract(
            [
                item({ itemId: 'A-1', row: 'S2', selector: 'noun=channel', requirement: 'EXISTS' }),
                item({ itemId: 'A-2', row: 'S5', selector: 'noun=channel', requirement: 'EQUALS', value: 'the near end' }),
            ],
            { contractId: 'C-A', objectId: 'O-A' },
        ),
        contract(
            [
                item({ itemId: 'B-1', row: 'S2', selector: 'noun=channel', requirement: 'EXISTS' }),
                item({ itemId: 'B-2', row: 'S5', selector: 'noun=channel', requirement: 'EQUALS', value: 'the far end' }),
            ],
            { contractId: 'C-B', objectId: 'O-B' },
        ),
    ]
    const result: any = runStages0to10(input(contracts))
    const unresolved = [...result.classified.values()].filter((l: any) => l.verdict === 'UNRESOLVED')
    assert.ok(unresolved.length > 0, 'the fixture must actually collide')
    const noFailed = check(result, 'GA-NO-FAILED-LINE')
    assert.equal(noFailed.verdict, 'FAIL')
    for (const line of unresolved) assert.ok(noFailed.subjects.includes(line.lineId), `${line.lineId} is a failed line`)
})

// ---------------------------------------------------------------------------------------------
// SD-43 — a PASS travels with what it did not establish.
// ---------------------------------------------------------------------------------------------

test('the four split checks each report their state-of-play clause as not established', () => {
    const result: any = runStages0to10(input([contract([item()])]))
    const reported = gateA(result).notEstablished.map((n: any) => n.checkId)
    for (const checkId of ['GA-EFFECT-TYPED', 'GA-ONE-PRIMARY-EVENT', 'GA-DIRECTION', 'GA-OBJECTIVE-SETS']) {
        assert.ok(reported.includes(checkId), `${checkId} must report its uncheckable clause`)
    }
})

test('a NOT_CHECKABLE_OUTSIDE_REPRESENTATION clause is not counted as a PASS for that clause', () => {
    const result: any = runStages0to10(input([contract([item()])]))
    for (const c of gateA(result).checks) {
        for (const clause of c.clauses) {
            if (clause.verdict !== 'NOT_CHECKABLE_OUTSIDE_REPRESENTATION') continue
            assert.ok(
                gateA(result).notEstablished.some((n: any) => n.checkId === c.checkId && n.clause === clause.clause),
                `${c.checkId} passed a clause outside the representation without listing it`,
            )
        }
    }
})

test('every clause of every check carries a verdict from the closed list', () => {
    // DEFERRED_TO_REALIZATION joined the list on 30 September: a clause that cannot be answered until
    // realization has chosen or instantiated something. It is a fifth verdict, not a synonym for any
    // of the four — and every one that is used must say what it is owed.
    const allowed = new Set(['PASS', 'FAIL', 'NOT_CHECKABLE_OUTSIDE_REPRESENTATION', 'NOT_EVALUABLE', 'DEFERRED_TO_REALIZATION'])
    const result: any = runStages0to10(corpusInput())
    for (const c of gateA(result).checks) {
        assert.ok(allowed.has(c.verdict), `${c.checkId} verdict ${c.verdict}`)
        assert.ok(c.clauses.length > 0, `${c.checkId} reports no clause`)
        for (const clause of c.clauses) {
            assert.ok(allowed.has(clause.verdict))
            if (clause.verdict === 'DEFERRED_TO_REALIZATION') {
                assert.ok(clause.owes && clause.owes.length > 0, `${c.checkId} defers "${clause.clause}" without saying what it is owed`)
            }
        }
    }

    // And a deferred clause never reads as a pass, at either level.
    for (const c of gateA(result).checks) {
        if (c.clauses.some((l: any) => l.verdict === 'DEFERRED_TO_REALIZATION')) assert.notEqual(c.verdict, 'PASS', c.checkId)
    }
    if (gateA(result).deferred.length) assert.notEqual(gateA(result).verdict, 'PASS', 'the overall verdict is never PASS while anything is owed')
})

// ---------------------------------------------------------------------------------------------
// GA-MODIFIER-OVERLAP — the specification gap (F2). Its semantics are not invented here.
// ---------------------------------------------------------------------------------------------

/**
 * Two region modifiers, each naming a held region class by its structural id (SD-57).
 *
 * The selector names the referent itself rather than a label for it. `condition.referents` is a
 * registered selector attribute of `V7`, so under SD-101 it is constitutive of the modifier it
 * establishes: selecting on a handle and then authoring a different referent for the same property
 * would be the modifier's identity disagreeing with its own field.
 */
function regionModifiers(referentOfB: string): LoadedContract[] {
    return [
        contract([
            item({ itemId: 'R-A', row: 'S2', selector: 'noun=channel', requirement: 'EXISTS' }),
            item({ itemId: 'R-B', row: 'S2', selector: 'noun=lane', requirement: 'EXISTS' }),
            item({ itemId: 'M-1', row: 'V7', selector: 'condition.type=region AND condition.referents=c:C-1:R-A', requirement: 'EXISTS' }),
            item({ itemId: 'M-2', row: 'V7', selector: `condition.type=region AND condition.referents=${referentOfB}`, requirement: 'EXISTS' }),
            item({ itemId: 'M-3', row: 'V8b', selector: 'condition.referents=c:C-1:R-A', requirement: 'EQUALS', value: 'c:C-1:R-A' }),
            item({ itemId: 'M-4', row: 'V8b', selector: `condition.referents=${referentOfB}`, requirement: 'EQUALS', value: referentOfB }),
        ]),
    ]
}

test('the region case executes: two modifiers claiming one held referent overlap and fail', () => {
    const result: any = runStages0to10(input(regionModifiers('c:C-1:R-A')))
    const overlap = check(result, 'GA-MODIFIER-OVERLAP')
    const regionClause = overlap.clauses.find((c: any) => /region conditions/.test(c.clause))
    assert.ok(regionClause, 'the region clause is executed rather than withheld')
    assert.equal(regionClause.verdict, 'FAIL', 'two region modifiers claiming the same referent overlap')
    assert.equal(overlap.verdict, 'FAIL')
})

test('two region modifiers on distinct held referents do not overlap', () => {
    const result: any = runStages0to10(input(regionModifiers('c:C-1:R-B')))
    assert.equal(check(result, 'GA-MODIFIER-OVERLAP').verdict, 'PASS')
})

test('SD-57: an open-text referent is not compared as a token — it blocks instead', () => {
    const result: any = runStages0to10(input(regionModifiers('the wide channel on the far side')))
    const overlap = check(result, 'GA-MODIFIER-OVERLAP')
    const regionClause = overlap.clauses.find((c: any) => /region conditions/.test(c.clause))
    assert.equal(regionClause.verdict, 'NOT_EVALUABLE', 'open text establishes no structural identity')
    assert.ok(overlap.blockedBy.length > 0, 'and the dependency is named')
    assert.notEqual(overlap.verdict, 'FAIL', 'SD-58: not representable is a gap, never a violation')
})

test('SD-62: a blocked clause carries a structured block record, and creates no derivation GAP', () => {
    const result: any = runStages0to10(input(regionModifiers('the wide channel on the far side')))
    const blocks = gateA(result).blocks
    const block = blocks.find((b: any) => b.checkId === 'GA-MODIFIER-OVERLAP')
    assert.ok(block, 'the blocked clause has a record of its own')
    assert.ok(block.clause, 'it identifies the clause')
    assert.ok(block.dependency.lineIds.length > 0, 'it identifies the unresolved dependency')
    assert.ok(block.reason, 'it says why evaluation could not be completed')
    assert.equal(block.kind, 'NOT_REPRESENTABLE')

    // It does not create a derivation GAP, nor turn the derived line into a failed one.
    assert.equal(result.failures.filter((f: any) => f.kind === 'GAP' && f.stage === 10).length, 0)
    for (const lineId of block.dependency.lineIds) {
        const line = result.classified.get(lineId)
        if (line) assert.notEqual(line.verdict, 'NOT_AUTHORED', 'a gate block never re-states a derived line as failed')
    }
    assert.equal(result.stopped.length, 0, 'SD-62 settled this; it is no longer an open question')
})

test('SD-62: every NOT_EVALUABLE clause anywhere carries a block record', () => {
    for (const source of [corpusInput(), input(regionModifiers('open text'))]) {
        const result: any = runStages0to10(source)
        const blocked = gateA(result).checks.flatMap((c: any) => c.clauses.filter((l: any) => l.verdict === 'NOT_EVALUABLE').map((l: any) => `${c.checkId}|${l.clause}`))
        const recorded = gateA(result).blocks.map((b: any) => `${b.checkId}|${b.clause}`)
        assert.deepEqual(blocked.sort(), recorded.sort(), 'no blocked clause escapes without a record')
        for (const b of gateA(result).blocks) {
            assert.ok(['KNOWLEDGE_GAP', 'NOT_REPRESENTABLE', 'SPECIFICATION_GAP'].includes(b.kind))
            assert.ok(b.dependency.lineIds.length + b.dependency.rows.length > 0 || b.kind === 'SPECIFICATION_GAP')
        }
    }
})

test('SD-63: the identity rule is general — an open-text objective reference withholds, not fails', () => {
    const contracts = [
        contract([
            item({ itemId: 'P-A', row: 'P1', selector: 'team=A', requirement: 'EXISTS' }),
            item({ itemId: 'P-B', row: 'P1', selector: 'team=B', requirement: 'EXISTS' }),
            // Two opposed objectives, so the opposite-ends clause has instances to examine (SD-95);
            // both references are text, so the identity rule is what decides the outcome.
            item({ itemId: 'J-A', row: 'J1', selector: 'team=A', requirement: 'EXISTS' }),
            item({ itemId: 'JT-A', row: 'J3', selector: 'team=A', requirement: 'EQUALS', value: 'A' }),
            item({ itemId: 'JR-A', row: 'J2', selector: 'team=A', requirement: 'EQUALS', value: 'the goal at the far end' }),
            item({ itemId: 'J-B', row: 'J1', selector: 'team=B', requirement: 'EXISTS' }),
            item({ itemId: 'JT-B', row: 'J3', selector: 'team=B', requirement: 'EQUALS', value: 'B' }),
            item({ itemId: 'JR-B', row: 'J2', selector: 'team=B', requirement: 'EQUALS', value: 'the goal at the near end' }),
        ]),
    ]
    const result: any = runStages0to10(input(contracts))
    const direction = check(result, 'GA-DIRECTION')
    const opposite = direction.clauses.find((c: any) => /opposite ends/.test(c.clause))
    assert.equal(opposite.verdict, 'NOT_EVALUABLE', 'no end is inferred from a text description')
    assert.notEqual(opposite.verdict, 'FAIL', 'withhold the verdict rather than infer identity from text')
})

test('SD-58: event conditions whose referents are open text block as a gap, with no refusal', () => {
    const contracts = [
        contract([
            item({ itemId: 'M-1', row: 'V7', selector: 'condition.type=event AND condition.referents=RA', requirement: 'EXISTS' }),
            item({ itemId: 'M-2', row: 'V8b', selector: 'condition.referents=RA', requirement: 'EQUALS', value: '{regain, shot}' }),
        ]),
    ]
    const result: any = runStages0to10(input(contracts))
    const overlap = check(result, 'GA-MODIFIER-OVERLAP')
    const eventClause = overlap.clauses.find((c: any) => /event conditions/.test(c.clause))
    assert.equal(eventClause.verdict, 'NOT_EVALUABLE')
    assert.equal(eventClause.refusalId, undefined, 'not representable is a gap, not a specification defect')
    assert.equal(
        result.refusals.filter((r: any) => r.kind === 'CHECK_NOT_EXECUTABLE').length,
        0,
        'no event-identity system is invented, and no specification defect is claimed',
    )
})

test('SD-60: an object condition refuses, invents no semantics, and blocks only that clause', () => {
    const contracts = [
        contract([
            item({ itemId: 'M-1', row: 'V7', selector: 'condition.type=object', requirement: 'EXISTS' }),
            item({ itemId: 'M-2', row: 'V8b', selector: 'condition.type=object', requirement: 'EQUALS', value: 'O-1' }),
        ]),
    ]
    const result: any = runStages0to10(input(contracts))
    const overlap = check(result, 'GA-MODIFIER-OVERLAP')
    assert.equal(overlap.verdict, 'NOT_EVALUABLE')

    const objectClause = overlap.clauses.find((c: any) => /object conditions/.test(c.clause))
    assert.equal(objectClause.verdict, 'NOT_EVALUABLE')
    const refusal = result.refusals.find((r: any) => r.refusalId === objectClause.refusalId)
    assert.ok(refusal, 'the clause names the refusal that withheld it')
    assert.ok(refusal.affects.lineIds.length > 0, 'the refusal names the affected cases only')
    assert.ok(/no canonical item exercises this case/i.test(refusal.cause))

    // The region and event clauses are untouched: a game with no such modifier is unaffected.
    assert.ok(overlap.clauses.some((c: any) => /region conditions/.test(c.clause) && c.verdict === 'PASS'))
    assert.ok(overlap.clauses.some((c: any) => /event conditions/.test(c.clause) && c.verdict === 'PASS'))
})

test('a game with no value modifier at all is unaffected by the gap', () => {
    const result: any = runStages0to10(input([contract([item()])]))
    const overlap = check(result, 'GA-MODIFIER-OVERLAP')
    assert.equal(overlap.verdict, 'PASS')
    assert.equal(
        result.refusals.filter((r: any) => r.kind === 'CHECK_NOT_EXECUTABLE').length,
        0,
        'the blocking gap does not block a game that never uses it',
    )
})

// ---------------------------------------------------------------------------------------------
// Values §1.9 cannot compare are refused, not coerced.
// ---------------------------------------------------------------------------------------------

/**
 * **The fixture moved from a ball to a gate on 5 October, and the reason is a finding rather than a tidy-up.**
 *
 * His dynamic-object ruling withdraws the layout-position rows for a ball, so a position authored for a ball no
 * longer reaches the geometric check at all — the line is withdrawn before anything compares it, and this
 * invariant had nothing to fire on. A gate is a static object, keeps its layout rows, and is the better subject
 * anyway: a dynamic location authored onto a STATIC object's position is the genuinely pathological case, and
 * the one the refusal exists for.
 *
 * **What moving it does NOT fix, and is reported to him rather than papered over here:** an authored item whose
 * line is withdrawn has its value silently discarded. Verified general and pre-existing, not introduced by the
 * new entry — an authored `qualifiers.lastTouch` on a POSSESSION_CHANGE transition, withdrawn by an applicability
 * entry that predates it, behaves identically. Measured: on a non-withdrawn row the same item resolves
 * `RESOLVED:ENTAILED`; on a withdrawn row it resolves to nothing. No corpus knowledge authors a ball position, so
 * nothing is lost today; the decision about whether a withdrawal should report what it discards is his.
 */
test('a dynamic location used geometrically is refused as VALUE_NOT_COMPARABLE', () => {
    const contracts = [
        contract([
            item({ itemId: 'O-1', row: 'O1', selector: 'kind=gate', requirement: 'EXISTS' }),
            item({ itemId: 'O-2', row: 'O4', selector: 'kind=gate', requirement: 'EQUALS', value: { dynamic: 'BALL_EXIT_POINT' } }),
            item({ itemId: 'O-3', row: 'O5', selector: 'kind=gate', requirement: 'EQUALS', value: { axis: 'across', lo: 0, hi: 10 } }),
        ]),
    ]
    const result: any = runStages0to10(input(contracts))
    const refusal = result.refusals.find((r: any) => r.kind === 'VALUE_NOT_COMPARABLE')
    assert.ok(refusal, '§1.9: any geometric use of a dynamic location is refused')
    // Since the 30 September split a placement this check cannot read is a value realization supplies,
    // so the invariant moves downstream rather than being abandoned. What must never happen either way
    // is a PASS reached over a placement it could not compare.
    const envelope = check(result, 'GA-ENVELOPE-FIT').verdict
    assert.notEqual(envelope, 'PASS')
    assert.ok(['NOT_EVALUABLE', 'DEFERRED_TO_REALIZATION'].includes(envelope), envelope)
})

test('a placement outside the area fails, and one inside it passes', () => {
    const build = (hi: number) => [
        contract([
            item({ itemId: 'O-1', row: 'O1', selector: 'kind=goal', requirement: 'EXISTS' }),
            item({ itemId: 'O-2', row: 'O4', selector: 'kind=goal', requirement: 'EQUALS', value: { axis: 'along', lo: 0, hi } }),
            item({ itemId: 'O-3', row: 'O5', selector: 'kind=goal', requirement: 'EQUALS', value: { axis: 'across', lo: 0, hi: 10 } }),
        ]),
    ]
    const inside: any = runStages0to10(input(build(35)))
    assert.equal(check(inside, 'GA-ENVELOPE-FIT').verdict, 'PASS', 'a 35 m extent fits a 40 m area')

    const outside: any = runStages0to10(input(build(45)))
    assert.equal(check(outside, 'GA-ENVELOPE-FIT').verdict, 'FAIL', 'a 45 m extent does not fit a 40 m area')
})

// ---------------------------------------------------------------------------------------------
// A clause must not assert more than the code checked. These guard the four that were fused.
// ---------------------------------------------------------------------------------------------

function directionFixture(bHi: number, bLo: number): LoadedContract[] {
    return [
        contract([
            item({ itemId: 'P-A', row: 'P1', selector: 'team=A', requirement: 'EXISTS' }),
            item({ itemId: 'P-B', row: 'P1', selector: 'team=B', requirement: 'EXISTS' }),
            item({ itemId: 'OBJ-A', row: 'O1', selector: 'kind=goalA', requirement: 'EXISTS' }),
            item({ itemId: 'OBJ-B', row: 'O1', selector: 'kind=goalB', requirement: 'EXISTS' }),
            item({ itemId: 'PA-1', row: 'O4', selector: 'kind=goalA', requirement: 'EQUALS', value: { axis: 'along', lo: 0, hi: 5 } }),
            item({ itemId: 'PA-2', row: 'O5', selector: 'kind=goalA', requirement: 'EQUALS', value: { axis: 'across', lo: 0, hi: 5 } }),
            item({ itemId: 'PB-1', row: 'O4', selector: 'kind=goalB', requirement: 'EQUALS', value: { axis: 'along', lo: bLo, hi: bHi } }),
            item({ itemId: 'PB-2', row: 'O5', selector: 'kind=goalB', requirement: 'EQUALS', value: { axis: 'across', lo: 0, hi: 5 } }),
            item({ itemId: 'J-A', row: 'J1', selector: 'team=A', requirement: 'EXISTS' }),
            item({ itemId: 'J-B', row: 'J1', selector: 'team=B', requirement: 'EXISTS' }),
            item({ itemId: 'JT-A', row: 'J3', selector: 'team=A', requirement: 'EQUALS', value: 'A' }),
            item({ itemId: 'JT-B', row: 'J3', selector: 'team=B', requirement: 'EQUALS', value: 'B' }),
            item({ itemId: 'JR-A', row: 'J2', selector: 'team=A', requirement: 'EQUALS', value: 'c:C-1:OBJ-A' }),
            item({ itemId: 'JR-B', row: 'J2', selector: 'team=B', requirement: 'EQUALS', value: 'c:C-1:OBJ-B' }),
        ]),
    ]
}

test('GA-DIRECTION reports its three structural claims separately, not as one fused clause', () => {
    const result: any = runStages0to10(input(directionFixture(40, 35)))
    const direction = check(result, 'GA-DIRECTION')
    assert.equal(direction.clauses.length, 4, 'three structural clauses and one outside the representation')
    assert.ok(direction.clauses.some((c: any) => /attacks/.test(c.clause)))
    assert.ok(direction.clauses.some((c: any) => /opposite ends/.test(c.clause)))
    assert.ok(direction.clauses.some((c: any) => /changes a team's direction/.test(c.clause)))
})

test('objectives at opposite ends pass; objectives at the same end fail', () => {
    const opposite: any = runStages0to10(input(directionFixture(40, 35)))
    const oppositeClause = check(opposite, 'GA-DIRECTION').clauses.find((c: any) => /opposite ends/.test(c.clause))
    assert.equal(oppositeClause.verdict, 'PASS', 'one objective at each end of a 40 m axis')

    const sameEnd: any = runStages0to10(input(directionFixture(8, 3)))
    const sameClause = check(sameEnd, 'GA-DIRECTION').clauses.find((c: any) => /opposite ends/.test(c.clause))
    assert.equal(sameClause.verdict, 'FAIL', 'both objectives in the same half of the axis')
})

test('GA-ONE-PRIMARY-EVENT separates existence, base value and referent position', () => {
    const result: any = runStages0to10(input([contract([item()])]))
    const event = check(result, 'GA-ONE-PRIMARY-EVENT')
    assert.equal(event.clauses.length, 4)
    const value = event.clauses.find((c: any) => /base value/.test(c.clause))
    assert.equal(value.verdict, 'PASS', 'SD-25 supplies 1, so the base value clause is decidable on its own')
})

/**
 * SD-94 — the clause tests compatibility, not element identity. Two objects each authoring what
 * happens at one trigger is ordinary; SD-47 keeps derivation identity-neutral, and one concrete
 * transition may satisfy both classes.
 */
test('SD-94: two transition classes on one trigger pass while their requirements agree', () => {
    const agreeing = [
        contract([
            item({ itemId: 'T-A', row: 'T1', selector: 'trigger=START', requirement: 'EXISTS' }),
            item({ itemId: 'T-B', row: 'T1', selector: 'trigger=START', requirement: 'EXISTS' }),
            item({ itemId: 'T-M', row: 'T6', selector: 'trigger=START', requirement: 'EQUALS', value: 'CONTINUE' }),
        ]),
    ]
    const compatible = check(runStages0to10(input(agreeing)) as any, 'GA-TRIGGER-UNIQUE')
    assert.equal(compatible.clauses.length, 2)
    const clause = compatible.clauses.find((c: any) => /mutually compatible/.test(c.clause))
    assert.equal(clause.verdict, 'PASS')
    assert.equal(clause.instances, 1, 'one overlapping pair was compared, and it is real evidence (SD-54)')
})

/**
 * **This fixture was passing for the wrong reason, and the standing-decision selector repair of 4 October
 * exposed it.** It used to author a stoppage for `T-A` only, and the conflicting `CONTINUE` on `T-B` arrived
 * from **SD-20** — whose registered selector is `trigger=POSSESSION_CHANGE`, which neither class has. The
 * engine was applying a standing decision through a narrowing it never read, so the incompatibility the clause
 * reported rested on a value SD-20 had no authority to supply here.
 *
 * The invariant is real and still worth testing, so the conflict is now **authored on both sides**: each class
 * carries a distinguishing qualifier, and each has its own `T6` item. The clause then compares two genuinely
 * authored play states on one trigger, which is what SD-94 is about.
 */
test('SD-94: and fail when the same trigger is required to be two different things', () => {
    const disagreeing = [
        contract([
            item({ itemId: 'T-A', row: 'T1', selector: 'trigger=START AND qualifier.lastTouch=LAST_TOUCH', requirement: 'EXISTS' }),
            item({ itemId: 'T-B', row: 'T1', selector: 'trigger=START AND qualifier.endLine=DEFENDING_TEAM', requirement: 'EXISTS' }),
            item({ itemId: 'T-M1', row: 'T6', selector: 'qualifier.lastTouch=LAST_TOUCH', requirement: 'EQUALS', value: 'STOP_RESUME' }),
            item({ itemId: 'T-M3', row: 'T6', selector: 'qualifier.endLine=DEFENDING_TEAM', requirement: 'EQUALS', value: 'CONTINUE' }),
            item({ itemId: 'T-M2', row: 'T7', selector: 'trigger=START', requirement: 'EQUALS', value: 'true' }),
        ]),
    ]
    const result: any = runStages0to10(input(disagreeing))
    const clause = check(result, 'GA-TRIGGER-UNIQUE').clauses.find((c: any) => /mutually compatible/.test(c.clause))
    assert.equal(clause.verdict, 'FAIL', 'one START transition is authored STOP_RESUME and the other CONTINUE; the two cannot both hold')
    assert.match(check(result, 'GA-TRIGGER-UNIQUE').why, /incompatible/)
})

/** AM-15 — a trigger partitioned by qualifier is not a disagreement, so the pair is never compared. */
test('SD-94: classes partitioned by a qualifier are not compared', () => {
    const partitioned = [
        contract([
            item({ itemId: 'T-A', row: 'T1', selector: 'trigger=OUT_END_LINE AND qualifier.lastTouch=LAST_TOUCH', requirement: 'EXISTS' }),
            item({ itemId: 'T-B', row: 'T1', selector: 'trigger=OUT_END_LINE AND qualifier.lastTouch=NOT_LAST_TOUCH', requirement: 'EXISTS' }),
            item({ itemId: 'T-M1', row: 'T6', selector: 'qualifier.lastTouch=LAST_TOUCH', requirement: 'EQUALS', value: 'STOP_RESUME' }),
            item({ itemId: 'T-M2', row: 'T6', selector: 'qualifier.lastTouch=NOT_LAST_TOUCH', requirement: 'EQUALS', value: 'CONTINUE' }),
        ]),
    ]
    const clause = check(runStages0to10(input(partitioned)) as any, 'GA-TRIGGER-UNIQUE').clauses.find((c: any) => /mutually compatible/.test(c.clause))
    assert.equal(clause.verdict, 'PASS')
    assert.equal(clause.instances, 0, 'nothing was compared: the two can never apply to one transition')
})

test('GA-LAYOUT-FEASIBLE refuses a bound it cannot read rather than ignoring it', () => {
    const contracts = [
        contract([
            item({ itemId: 'R-1', row: 'S2', selector: 'noun=channel', requirement: 'EXISTS' }),
            // A qualitative narrowing on an open geometric line: not a linear constraint.
            item({ itemId: 'R-2', row: 'S5', selector: 'noun=channel', requirement: 'RANGE', value: 'beyond the first defenders', basis: 'ASSUMED' }),
        ]),
    ]
    const result: any = runStages0to10(input(contracts))
    const feasible = check(result, 'GA-LAYOUT-FEASIBLE')
    // Either the line never became open (so there is nothing to ignore), or the bound was refused —
    // what must never happen is a PASS reached by silently dropping the constraint.
    if (feasible.verdict === 'PASS') {
        assert.ok(/no geometric line is open/.test(feasible.why), `PASS must be because nothing was open, not because a bound was dropped: ${feasible.why}`)
    } else {
        assert.ok(['NOT_EVALUABLE', 'DEFERRED_TO_REALIZATION'].includes(feasible.verdict), feasible.verdict)
    }
})

// ---------------------------------------------------------------------------------------------
// Gate B.
// ---------------------------------------------------------------------------------------------

test('Gate B reverse is NOT_APPLICABLE in derivation mode, never a PASS it has not earned', () => {
    const result: any = runStages0to10(input([contract([item()])]))
    assert.equal(result.gates.gateBReverse.verdict, 'NOT_APPLICABLE')
    assert.equal(result.gates.gateBReverse.checks.length, 0)
})

test('Gate B forward counts every item of every admitted contract, dropping none', () => {
    const contracts = [contract([item({ itemId: 'A' }), item({ itemId: 'B', row: 'S3', requirement: 'EQUALS', value: 'channel' }), item({ itemId: 'C', row: 'S4', requirement: 'EQUALS', value: 'access' })])]
    const result: any = runStages0to10(input(contracts))
    assert.equal(result.gates.gateBForward.verdict, 'PASS')
    assert.ok(/3 admitted item\(s\); 3 forward result\(s\); 0 uncounted/.test(result.gates.gateBForward.checks[0].why))
})

// ---------------------------------------------------------------------------------------------
// Determinism (package §8).
// ---------------------------------------------------------------------------------------------

test('shuffled input produces an identical gate report', () => {
    const items = [
        item({ itemId: 'A', row: 'S2', selector: 'noun=channel', requirement: 'EXISTS' }),
        item({ itemId: 'B', row: 'S4', selector: 'noun=channel', requirement: 'EQUALS', value: 'access' }),
        item({ itemId: 'C', row: 'O1', selector: 'kind=ball', requirement: 'EXISTS' }),
    ]
    const forward: any = runStages0to10(input([contract(items)]))
    const reversed: any = runStages0to10(input([contract([...items].reverse())]))
    assert.deepEqual(JSON.parse(JSON.stringify(forward.gates.gateA)), JSON.parse(JSON.stringify(reversed.gates.gateA)))
})

// ---------------------------------------------------------------------------------------------
// The real corpus. These figures are quoted in the increment report, so they are asserted here
// rather than produced by a script that no longer exists.
// ---------------------------------------------------------------------------------------------

// ---------------------------------------------------------------------------------------------
// SD-95 to SD-100 — the closure rulings of 27 September.
// ---------------------------------------------------------------------------------------------

/** Two teams, and whatever objective structure the case needs. */
const directionCase = (...objectives: any[]) =>
    contract([
        item({ itemId: 'P-A', row: 'P1', selector: 'team=A', requirement: 'EXISTS' }),
        item({ itemId: 'P-B', row: 'P1', selector: 'team=B', requirement: 'EXISTS' }),
        ...objectives,
    ])

test('SD-95: a shared target establishes the opposing relationship, and no team is consulted', () => {
    const shared = directionCase(
        item({ itemId: 'J-S', row: 'J1', selector: 'role=PRIMARY_SCORING', requirement: 'EXISTS' }),
        item({ itemId: 'JT-S', row: 'J3', selector: 'role=PRIMARY_SCORING', requirement: 'EQUALS', value: 'EACH_TEAM' }),
    )
    const direction = check(runStages0to10(input([shared])) as any, 'GA-DIRECTION')
    const attacks = direction.clauses.find((c: any) => /objective it attacks/.test(c.clause))
    assert.equal(attacks.verdict, 'PASS', 'one objective both sides attack is an opposing directional relationship')

    // Opposite ends has no applicable instance with a single shared target, and says so (SD-54).
    const opposite = direction.clauses.find((c: any) => /opposite ends/.test(c.clause))
    assert.equal(opposite.verdict, 'PASS')
    assert.equal(opposite.instances, 0)

    // The team classes carry designations here, and the check must not be using them.
    assert.ok(!direction.subjects.some((s: string) => /::P[0-9]/.test(s)), 'no team property is read')
})

test('SD-95: every objective naming one side is a structural failure, not a gap', () => {
    const oneSided = directionCase(
        item({ itemId: 'J-A', row: 'J1', selector: 'team=A', requirement: 'EXISTS' }),
        item({ itemId: 'JT-A', row: 'J3', selector: 'team=A', requirement: 'EQUALS', value: 'ATTACKING_TEAM' }),
    )
    const attacks = check(runStages0to10(input([oneSided])) as any, 'GA-DIRECTION').clauses.find((c: any) => /objective it attacks/.test(c.clause))
    assert.equal(attacks.verdict, 'FAIL', 'nothing the other side attacks is established, and every objective is settled')
})

test('SD-97: an existence assertion with no selector individuates nothing and owes no fields', () => {
    const existential = contract([item({ itemId: 'J-ANY', row: 'J1', selector: '*', requirement: 'EXISTS' })])
    const result: any = runStages0to10(input([existential]))

    assert.equal(result.classes.filter((c: any) => c.row === 'J1').length, 1, 'the existence claim still holds a class')
    assert.deepEqual(
        result.lines.filter((l: any) => l.elementId === 'c:C-1:J-ANY').map((l: any) => l.row),
        [],
        'and it enumerates no field line: nobody owes a reference, a team or a role for it',
    )
    assert.equal(
        result.forward.find((o: any) => o.item.itemId === 'J-ANY').result,
        'SATISFIED',
        'the assertion is satisfied by the collection membership it established, without pairing',
    )
})

test('SD-98: a typed structural reference resolves, and open text still does not', () => {
    const typed = contract([
        item({ itemId: 'R-1', row: 'S2', selector: 'noun=zone AND functions ∋ objective-area', requirement: 'EXISTS' }),
        item({ itemId: 'R-P', row: 'S5', selector: 'noun=zone', requirement: 'POSITIONED', value: { lo: '0', hi: '5' } }),
        item({ itemId: 'J-A', row: 'J1', selector: 'team=A', requirement: 'EXISTS' }),
        item({ itemId: 'JT-A', row: 'J3', selector: 'team=A', requirement: 'EQUALS', value: 'A' }),
        item({
            itemId: 'JR-A',
            row: 'J2',
            selector: 'team=A',
            requirement: 'EQUALS',
            value: { structuralRef: { contractId: 'C-1', itemId: 'R-1' }, asAuthored: 'the objective-area region of R-1' },
        }),
    ])
    const result: any = runStages0to10(input([typed]))
    const integrity = check(result, 'GA-REFERENCE-INTEGRITY')
    assert.match(integrity.why, /1 reference\(s\) resolved/, 'the typed reference names a held class')
    assert.ok(!/1 established no structural identity/.test(integrity.why), 'and it is not withheld as open text')
})

test('SD-99: a region function clause reads established membership without the set resolving', () => {
    const region = contract([item({ itemId: 'R-1', row: 'S2', selector: 'noun=channel AND functions ∋ access', requirement: 'EXISTS' })])
    const result: any = runStages0to10(input([region]))

    assert.equal(
        result.classified.get('c:C-1:R-1::S4').verdict,
        'NOT_AUTHORED',
        'membership does not close the set: the field itself is still unauthored (SD-92)',
    )
    const fn = check(result, 'GA-REGION-FUNCTION')
    assert.equal(fn.clauses.find((c: any) => /at least one function/.test(c.clause)).verdict, 'PASS')
    assert.equal(fn.clauses.find((c: any) => /registered member/.test(c.clause)).verdict, 'PASS')
})

test('SD-100: EXISTS on a field row asserts nothing and is recorded as inert', () => {
    const asserted = contract([
        item({ itemId: 'R-1', row: 'S2', selector: 'noun=channel', requirement: 'EXISTS' }),
        // `S4`, not `S5`: since the 29 September rulings `S5` is bounded by the session envelope and is
        // therefore a freedom, which would mask the thing under test — that an inert claim leaves the
        // line exactly as it found it. `S4` has no registered choice space and stays a gap.
        item({ itemId: 'F-1', row: 'S4', selector: 'noun=channel', requirement: 'EXISTS', value: 'the functions field is present' }),
    ])
    const result: any = runStages0to10(input([asserted]))
    const line = result.derived.lines.get('c:C-1:R-1::S4')

    assert.equal(line.entailing.length, 0)
    assert.equal(line.bounding.length, 0, 'it is not carried as a bound either — that is one of the readings he excluded')
    assert.equal(result.classified.get('c:C-1:R-1::S4').verdict, 'NOT_AUTHORED')
    assert.equal(result.forward.find((o: any) => o.item.itemId === 'F-1').result, 'INERT', 'provenance is retained and the claim is inert')
})

test('SD-102: direction is established, and the source ambiguity is preserved beside the decision', () => {
    const result: any = runStages0to10(corpusInput())

    const direction = check(result, 'GA-DIRECTION')
    assert.equal(direction.verdict, 'PASS', 'the objective structure provides the opposing relationship')
    assert.equal(direction.clauses.find((c: any) => /objective it attacks/.test(c.clause)).verdict, 'PASS')
    assert.equal(result.classified.get('c:restated:GF2:GF2-08.a::J3').verdict, 'RESOLVED:ENTAILED')

    // The canonical decision and the ambiguous source are two separate records, and the second is
    // untouched: "do not rewrite that ambiguity as though the original source established this".
    const gf2 = loadCorpusContracts().find(c => c.contractId === 'restated:GF2')!
    const decision: any = gf2.items.find((i: any) => i.itemId === 'GF2-12.c')
    const source: any = gf2.items.find((i: any) => i.itemId === 'GF2-12.a')
    assert.equal(decision.basis, 'OWNER_RULING')
    assert.equal(decision.value, 'EACH_TEAM')
    assert.equal(source.basis, 'ASSUMED', 'the source reading is still an assumption')
    assert.match(String(source.basisEvidence), /unreconciled/, 'and its evidence still says the original could not reconcile it')
})

/** SD-101 on the corpus: the build-out objective keeps the team its own selector defines. */
test('SD-101: a canonical decision does not overwrite a class its selector defines otherwise', () => {
    const result: any = runStages0to10(corpusInput())
    const line = 'c:restated:RPC-001:RPC-001-11.a::J3'

    assert.equal(result.classified.get(line).verdict, 'RESOLVED:ENTAILED')
    assert.equal(result.derived.lines.get(line).entailing[0].value, 'BUILD_OUT_TEAM', 'the class-defining value stands')
    const contradiction = result.derived.lines.get(line).contradicted.find((c: any) => c.item.itemId === 'GF2-12.c')
    assert.ok(contradiction, 'and the contribution that disagreed is preserved, not discarded')
    assert.equal(contradiction.value, 'EACH_TEAM')
    assert.ok(
        result.diagnostics.some((d: any) => d.code === 'CONSTITUTIVE_SELECTOR_CONTRADICTED' && d.where === line),
        'reported by name rather than absorbed',
    )

    // Its reach is not suppressed: the same item still reaches, and settles, GF2's own objective.
    assert.equal(result.derived.lines.get('c:restated:GF2:GF2-08.a::J3').entailing[0].item.itemId, 'GF2-12.c')
})

/** The baseline at the Phase A load boundary: all eight contracts load, none refuses. */
test('the corpus run reproduces the reported figures exactly', () => {
    const result: any = runStages0to10(corpusInput())
    assert.equal(result.run.counts.contractsAdmitted, 8)
    assert.equal(result.run.counts.contractsRefused, 0)
    // SD-97 removed twenty-eight lines by ruling that an existence assertion with no selector
    // individuates nothing: three objectives, two teams, two object classes and one objective set
    // were being asked separately for fields nobody owed.
    /**
     * **121, not 125, since ruling C33 of 2 October.** `WIDEZONE-08.d` moved from S2 to S4: it was
     * asserting existence on the collection row while its content was a property of channels already
     * established, so it minted a third region. Moving it removes that element class and the four field
     * lines it owned (S3/S4/S5/S6) — 125 − 4 = 121. His distinction: *"A statement that a property applies
     * to N existing members does not thereby assert the existence of N additional members."*
     */
    /**
     * **126 since ruling C34 of 2 October.** The Wide Zone advantage is now authored as a value modifier, so
     * V7 carries an existence item for the first time and its five owned field rows enumerate (V8a, V8b, V9,
     * V9a, V10): 121 + 5 = 126. Before this, every claim the object made about the advantage reached no line
     * at all and appeared in neither the game, `open` nor `notEstablished`.
     */
    /**
     * **127 since the possession relation (PS1) was authorized on 2 October.** One game-level row, one line.
     * It is `NOT_AUTHORED / no coverage` on this corpus — nothing in the selected knowledge addresses possession,
     * so SD-39's existence condition is unmet and the line is honestly a gap rather than a freedom. That is the
     * representation declining to invent, not a defect.
     */
    assert.equal(result.run.counts.lines, 127)
    /**
     * **61, up from 59.** The same restatement establishes `perceptual-reference` on BOTH channels rather
     * than on a third region of its own, so two S4 lines now resolve where none did. The functions rows
     * were previously reported as excluded and reaching no artifact.
     */
    /**
     * **67 since ruling C35.** The modifier's condition type, magnitude and operation resolve, and so do its
     * referents — now as a SET of two members rather than a collision, which also adds the two per-member
     * lines. `multiplicity: SET` types what V8b's own valueType already said.
     */
    assert.equal(result.run.counts['verdict:RESOLVED:ENTAILED'], 67)
    // **NOT_AUTHORED fell 54 → 26 across the 29 September rulings, and only five of those twenty-eight
    // were closed by authoring anything.**
    //   −9  T1a/T1b/T1c demanded of three POSSESSION_CHANGE transitions. A turnover has no last touch
    //       over a line, no end line and no out-of-play region, so they are withdrawn as inapplicable
    //       — carrying no verdict and emitting no GAP, because the absence of an inapplicable
    //       property must never be reported as missing knowledge.
    //   −9  metric placements on S5/S6/O4/O5, where the session envelope supplies the outer bound
    //       SD-50 asks for and AM-04 no longer lets one object's silence veto another's authority.
    //       They are bounded freedoms now, not gaps.
    //   −5  the connected-pass information rule, authored as ONE decision across the canonical IE
    //       dimensions rather than five fields filled independently.
    //   −4  T1c on the goal kick, and three lines whose relational constraint became DISTINCT_ON.
    //   −1  the target's across-extent, once a typed structural reference was seen to be immune to
    //       geometry: moving the region cannot change what the objectives point at.
    /**
     * **23, down from 26, under ruling C33.** Three of the four `functions` rows previously reported as
     * unauthored belonged to a region the restatement removed or to channels the restatement now
     * establishes the member on. **Nothing was authored to close them** — the member was already authored;
     * it was being asserted of a third region instead of the two that exist.
     */
    // 24: V10, the modifier's combination rule, is enumerated and unauthored — the contract's own
    // declaration says "Combination with an overlapping modifier never addressed".
    // 25: PS1 joins them — nobody addresses possession, so its reason is 'no coverage', an established absence.
    assert.equal(result.run.counts['verdict:NOT_AUTHORED'], 25)
    assert.equal(result.failures.filter((f: any) => f.kind === 'REFERENCE_DEFECT').length, 0, 'cluster 3 cleared the whole population')
    assert.equal(result.failures.filter((f: any) => f.kind === 'GAP').length, 25, 'one GAP per unauthored line, and none for a withdrawn one')
    // 17 since C33: the removed third region took its one open S5 line (a channel's along-extent) with it.
    assert.equal([...result.derived.lines.values()].filter((l: any) => l.open).length, 17, 'five open lines became seventeen')

    // SD-88 evaluated the conditional lines; the selector-based rule settles its own at enumeration.
    // Twelve withdrawals come from the governing-line path (the three CONTINUE transitions carry no
    // placement), nine from the trigger rule.
    //
    // **26 since 5 October, from 22.** His dynamic-object ruling withdraws the two layout-position rows for an
    // object whose location is state-dependent, and the corpus authors two balls — A01-02-08.a and
    // RPC-001-10.a — so four position lines joined the list. Nothing else moved: the conditional count below is
    // still zero, and GF4's static target keeps both of its position lines.
    assert.equal(
        result.lines.filter((l: any) => (result.classified.get(l.lineId)?.lineState ?? l.lineState) === 'CONDITIONAL').length,
        0,
        'no line is left unjudged behind a governing value that has resolved',
    )
    const withdrawn = result.lines.filter((l: any) => (result.classified.get(l.lineId)?.lineState ?? l.lineState) === 'WITHDRAWN')
    assert.equal(withdrawn.length, 26)
    // And the four new ones are the balls' positions specifically, not an accidental widening.
    const ballPositions = withdrawn.filter((l: any) => /::O[45]$/.test(l.lineId))
    assert.equal(ballPositions.length, 4, 'two authored balls, two position rows each')
    for (const line of withdrawn) {
        assert.equal(result.classified.get(line.lineId)?.verdict ?? null, null, `${line.lineId} is withdrawn and must carry no verdict`)
    }

    // SD-89's authored restart ownership met GF2's authored restart default on one line, and SD-90
    // settled it: a required contribution resolves the property, the preferred default is displaced
    // rather than colliding with it. The engine claims nothing about the two designations being the
    // same team — that question stays with stage 7.
    assert.equal(result.classified.get('c:restated:A01-02:A01-02-01.a::T2').verdict, 'RESOLVED:ENTAILED')
    assert.equal(
        result.forward.find((o: any) => o.item.contractId === 'restated:GF2' && o.item.itemId === 'GF2-16.a').result,
        'ADAPTED',
    )

    // SD-93 let Wide Zone's contributions reach its own channels for the first time, and the first
    // thing they showed is that two of them state the same claim in two spellings. Repaired on his
    // 29 September ruling, in the restatement rather than the engine: 04.a and 05.a share one
    // basisEvidence, so the parenthetical is now a gloss beside the value instead of a second
    // REQUIRED_RANGE contribution. They agree, so nothing collides — and the three channel
    // placements they were both describing now derive.
    assert.equal(result.failures.filter((f: any) => f.kind === 'COLLISION').length, 0)
    // TWO channels since ruling C33, not three: WIDEZONE-08.d is a property statement on S4 and establishes
    // no region, so it has no S6 placement line to resolve.
    for (const line of ['WIDEZONE-02.a', 'WIDEZONE-03']) {
        const verdict = result.classified.get(`c:restated:WIDE-ZONE-ADVANTAGE:${line}::S6`)
        assert.equal(verdict.verdict, 'RESOLVED:ENTAILED', `${line} placement resolves once the two spellings agree`)
        assert.deepEqual(verdict.collidingItems, [])
    }
    assert.equal(
        result.classified.get('c:restated:WIDE-ZONE-ADVANTAGE:WIDEZONE-08.d::S6'),
        undefined,
        'the property statement mints no element, so it owns no placement line',
    )
})

test('Gate A fails on the corpus, and says which checks and why', () => {
    const result: any = runStages0to10(corpusInput())
    assert.equal(gateA(result).verdict, 'FAIL')
    const failing = gateA(result).checks.filter((c: any) => c.verdict === 'FAIL').map((c: any) => c.checkId)
    // GA-TRANSITION-COHERENCE left this list under SD-88, and the reason matters more than the
    // membership: it used to report a STOP_RESUME transition as *violating* the clause because its
    // taker line was CONDITIONAL — a line the engine had never judged. Judged, that line is a
    // knowledge gap, and a gap blocks the clause rather than failing it (SD-28, SD-62).
    // GA-TRIGGER-UNIQUE left the list under SD-94. It had been failing because three objects each
    // author what happens at a turnover, which the old clause read as three transitions where a game
    // has one. Asked the question it can establish — are their requirements compatible? — they are.
    //
    // GA-TRIGGER-REACHABLE JOINED the list on 6 October, on his ruling that the ball alone must no
    // longer make a possession change reachable. The corpus is the clause's first real subject and it
    // fails on knowledge nobody wrote for the occasion: **three** transitions are keyed on a possession
    // change, A01-02 and RPC-001 both establish a ball so the first clause passes with four instances,
    // and `game::PS1` is NOT_AUTHORED with reason "no coverage". The corpus has been declaring
    // turnovers with nothing holding the relation a turnover changes.
    //
    // **GA-NO-FAILED-LINE does not and would not catch that**, which is the part worth keeping. Its
    // blocking filter admits an unestablished line only where the reason is a declared gap or a claim
    // left unresolved; "no coverage" is counted under `unspoken` and passes. A row no contract claims
    // is invisible to it. That is why the obligation had to be a reachability clause and not a
    // tightening of the failed-line check.
    assert.deepEqual(failing.sort(), ['GA-INFORMATION', 'GA-NO-FAILED-LINE', 'GA-TRIGGER-REACHABLE'])
    const reach = gateA(result).checks.find((c: any) => c.checkId === 'GA-TRIGGER-REACHABLE')
    assert.equal(reach.clauses[0].verdict, 'PASS', 'the corpus does establish a ball, so the prerequisites are there')
    assert.equal(reach.clauses[1].verdict, 'FAIL', 'and the relation they are prerequisites of is not')
    assert.deepEqual(reach.subjects, ['game::PS1'], 'the report names the line, so the failure is actionable')
    assert.equal(
        gateA(result).checks.find((c: any) => c.checkId === 'GA-NO-FAILED-LINE').subjects.includes('game::PS1'),
        false,
        'the failed-line check excuses an unclaimed row; if it ever stops doing so, this comment is stale',
    )
    for (const c of gateA(result).checks) assert.ok(c.why && c.why.length > 0, `${c.checkId} gives no reason`)
})

test('SD-49: an indeterminate reach is recorded, and is no longer an open question', () => {
    const result: any = runStages0to10(corpusInput())
    assert.ok(result.run.counts.undeterminedReaches > 0, 'the corpus does exercise the case')
    assert.equal(
        result.stopped.filter((s: any) => s.where === 'stage 4, reach').length,
        0,
        'SD-49 established the semantics; the engine is following them, not stopping on them',
    )
})

/**
 * Where the two closed clusters left the corpus, and what remains genuinely open.
 *
 * Cluster 1 (composition) resolved the primary-event **kind**; cluster 2 (establishment) resolved its
 * **count**. Neither was a knowledge defect. What still fails is recorded, not repaired.
 */
test('the two closed clusters hold, and what remains is what is genuinely unresolved', () => {
    const result: any = runStages0to10(corpusInput())

    // Cluster 1 — the kind, by composition. The convergence it settled still holds: three narrowings
    // intersect to one member, and no collision is raised on that line.
    assert.equal(result.classified.get('game::V1').verdict, 'RESOLVED:ENTAILED')
    assert.equal(result.failures.filter((f: any) => f.kind === 'COLLISION' && f.locus.lineId === 'game::V1').length, 0)

    // Cluster 2 — the count, by the establishment boundary and the singleton rule.
    const primary = check(result, 'GA-ONE-PRIMARY-EVENT')
    assert.equal(primary.clauses[0].verdict, 'PASS', 'exactly one primary event')
    assert.ok(/^1 primary event/.test(primary.why))

    // Still open, and untouched: an information rule names an unregistered trigger.
    const information = check(result, 'GA-INFORMATION')
    assert.equal(information.clauses.find((c: any) => /registered trigger/.test(c.clause)).verdict, 'FAIL')
})

test('FIRST_FORWARD_PASS is registered, and it is the only trigger the 29 September ruling admitted', () => {
    // He accepted one bounded vocabulary addition and explicitly held the other two members of
    // VARTARGET-05.b: COACH_CUE, and the compound `REGION_ENTRY {attacking half} + first receiver`
    // which stays recorded as presently unrepresentable rather than being removed or hidden behind a
    // compound trigger. So exactly two unregistered triggers must remain — no more, and no fewer.
    const result: any = runStages0to10(corpusInput())
    assert.match(check(result, 'GA-INFORMATION').why, /2 unregistered trigger\(s\)/, 'FIRST_FORWARD_PASS registered; COACH_CUE and the compound still held')

    const vocabulary: string[] = (corpusInput().register as any).vocabularies.trigger
    assert.ok(vocabulary.includes('FIRST_FORWARD_PASS'))
    assert.ok(!vocabulary.includes('COACH_CUE'), 'COACH_CUE remains held')
    assert.ok(
        !vocabulary.some(t => t.includes('first receiver')),
        'no compound trigger was added to hide the missing qualifier capability',
    )
})

test('the sixteen Gate A checks are all present, and GA-RESIDUAL-SPACE is gone (SD-45)', () => {
    const result: any = runStages0to10(corpusInput())
    const ids = gateA(result).checks.map((c: any) => c.checkId).sort()
    assert.equal(ids.length, 16)
    assert.ok(!ids.includes('GA-RESIDUAL-SPACE'), 'SD-45 removed it; no machine-testable concept is created')
    assert.ok(ids.includes('GA-MODIFIER-OVERLAP'))
    // Sixteenth, added 5 October on his ruling that SD-44 supersedes RC-19: a transition must be keyed on
    // a structurally reachable trigger. It is a check of its own because `failingChecks` carries checkIds,
    // so only a named check can make that failure legible. See trigger-reachability.unit.ts.
    assert.ok(ids.includes('GA-TRIGGER-REACHABLE'))
})

test('SD-52: a blocked clause is NOT_EVALUABLE and cannot contribute to a gate PASS', () => {
    const result: any = runStages0to10(corpusInput())
    // The reading is ruled, so it is no longer carried as an open question.
    assert.equal(
        result.stopped.filter((s: any) => s.where === 'stage 10, Gate A' && /his to confirm/.test(s.why)).length,
        0,
        'SD-52 settled this; it should no longer be reported as unresolved',
    )
    for (const c of gateA(result).checks) {
        for (const clause of c.clauses) {
            if (clause.verdict !== 'NOT_EVALUABLE') continue
            assert.notEqual(c.verdict, 'PASS', `${c.checkId} passed while carrying a blocked clause`)
        }
    }
    assert.notEqual(gateA(result).verdict, 'PASS')
})

test('SD-54: every passing clause states whether it evaluated instances or found none', () => {
    const result: any = runStages0to10(corpusInput())
    for (const c of gateA(result).checks) {
        for (const clause of c.clauses) {
            if (clause.verdict !== 'PASS') continue
            assert.ok(clause.basis, `${c.checkId}: a pass with no stated basis`)
            assert.equal(clause.basis === 'NO_APPLICABLE_INSTANCES', clause.instances === 0)
        }
    }
    const evidence = gateA(result).evidence
    assert.ok(evidence, 'the report carries the vacuous/evaluated split')
    assert.ok(evidence.clausesVacuous > 0, 'this corpus does have vacuous passes, and they are counted as such')
    assert.equal(
        evidence.clausesEvaluated + evidence.clausesVacuous,
        gateA(result).checks.flatMap((c: any) => c.clauses).filter((c: any) => c.verdict === 'PASS').length,
    )
})

test('SD-53: no executable clause fuses independently testable claims', () => {
    const result: any = runStages0to10(corpusInput())
    for (const c of gateA(result).checks) {
        for (const clause of c.clauses) {
            if (clause.verdict === 'NOT_CHECKABLE_OUTSIDE_REPRESENTATION') continue // human wording may stay compound
            assert.ok(
                !/;/.test(clause.clause),
                `${c.checkId} still carries a fused executable clause: "${clause.clause}"`,
            )
        }
    }
})

console.log(`\n${passed} assertions passed — increment 4\n`)
