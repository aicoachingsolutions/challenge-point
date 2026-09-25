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
import { loadRegister } from './corpus'

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

test('GA-NO-FAILED-LINE fails on a gapped line and names it', () => {
    const result: any = runStages0to10(input([contract([item()])]))
    const noFailed = check(result, 'GA-NO-FAILED-LINE')
    assert.equal(noFailed.verdict, 'FAIL')
    assert.ok(noFailed.subjects.length > 0, 'the failed lines are named, not merely counted')
    assert.ok(/enumerated line\(s\) are failed/.test(noFailed.why))
})

test('GA-NO-FAILED-LINE counts an UNRESOLVED line as failed, not only a gap', () => {
    const contracts = [
        contract(
            [
                item({ itemId: 'A-1', row: 'S2', selector: 'noun=channel', requirement: 'EXISTS' }),
                item({ itemId: 'A-2', row: 'S3', selector: 'noun=channel', requirement: 'EQUALS', value: 'channel' }),
            ],
            { contractId: 'C-A', objectId: 'O-A' },
        ),
        contract(
            [
                item({ itemId: 'B-1', row: 'S2', selector: 'noun=channel', requirement: 'EXISTS' }),
                item({ itemId: 'B-2', row: 'S3', selector: 'noun=channel', requirement: 'EQUALS', value: 'lane' }),
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
    const allowed = new Set(['PASS', 'FAIL', 'NOT_CHECKABLE_OUTSIDE_REPRESENTATION', 'NOT_EVALUABLE'])
    const result: any = runStages0to10(corpusInput())
    for (const c of gateA(result).checks) {
        assert.ok(allowed.has(c.verdict), `${c.checkId} verdict ${c.verdict}`)
        assert.ok(c.clauses.length > 0, `${c.checkId} reports no clause`)
        for (const clause of c.clauses) assert.ok(allowed.has(clause.verdict))
    }
})

// ---------------------------------------------------------------------------------------------
// GA-MODIFIER-OVERLAP — the specification gap (F2). Its semantics are not invented here.
// ---------------------------------------------------------------------------------------------

/** Two region modifiers, each naming a held region class by its structural id (SD-57). */
function regionModifiers(referentOfB: string): LoadedContract[] {
    return [
        contract([
            item({ itemId: 'R-A', row: 'S2', selector: 'noun=channel', requirement: 'EXISTS' }),
            item({ itemId: 'R-B', row: 'S2', selector: 'noun=lane', requirement: 'EXISTS' }),
            item({ itemId: 'M-1', row: 'V7', selector: 'condition.type=region AND condition.referents=RA', requirement: 'EXISTS' }),
            item({ itemId: 'M-2', row: 'V7', selector: 'condition.type=region AND condition.referents=RB', requirement: 'EXISTS' }),
            item({ itemId: 'M-3', row: 'V8b', selector: 'condition.referents=RA', requirement: 'EQUALS', value: 'c:C-1:R-A' }),
            item({ itemId: 'M-4', row: 'V8b', selector: 'condition.referents=RB', requirement: 'EQUALS', value: referentOfB }),
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
            item({ itemId: 'J-A', row: 'J1', selector: 'team=A', requirement: 'EXISTS' }),
            item({ itemId: 'JT-A', row: 'J3', selector: 'team=A', requirement: 'EQUALS', value: 'A' }),
            item({ itemId: 'JR-A', row: 'J2', selector: 'team=A', requirement: 'EQUALS', value: 'the goal at the far end' }),
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

test('a dynamic location used geometrically is refused as VALUE_NOT_COMPARABLE', () => {
    const contracts = [
        contract([
            item({ itemId: 'O-1', row: 'O1', selector: 'kind=ball', requirement: 'EXISTS' }),
            item({ itemId: 'O-2', row: 'O4', selector: 'kind=ball', requirement: 'EQUALS', value: { dynamic: 'BALL_EXIT_POINT' } }),
            item({ itemId: 'O-3', row: 'O5', selector: 'kind=ball', requirement: 'EQUALS', value: { axis: 'across', lo: 0, hi: 10 } }),
        ]),
    ]
    const result: any = runStages0to10(input(contracts))
    const refusal = result.refusals.find((r: any) => r.kind === 'VALUE_NOT_COMPARABLE')
    assert.ok(refusal, '§1.9: any geometric use of a dynamic location is refused')
    assert.equal(check(result, 'GA-ENVELOPE-FIT').verdict, 'NOT_EVALUABLE')
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

test('GA-TRIGGER-UNIQUE reports key uniqueness and collision as separate clauses', () => {
    const shared = [
        contract([
            item({ itemId: 'T-A', row: 'T1', selector: 'trigger=START', requirement: 'EXISTS' }),
            item({ itemId: 'T-B', row: 'T1', selector: 'trigger=START', requirement: 'EXISTS' }),
        ]),
    ]
    const result: any = runStages0to10(input(shared))
    const trigger = check(result, 'GA-TRIGGER-UNIQUE')
    assert.equal(trigger.clauses.length, 2)
    assert.equal(trigger.clauses.find((c: any) => /share a trigger key/.test(c.clause)).verdict, 'FAIL')
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
        assert.equal(feasible.verdict, 'NOT_EVALUABLE')
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

/** The baseline at the Phase A load boundary: all eight contracts load, none refuses. */
test('the corpus run reproduces the reported figures exactly', () => {
    const result: any = runStages0to10(corpusInput())
    assert.equal(result.run.counts.contractsAdmitted, 8)
    assert.equal(result.run.counts.contractsRefused, 0)
    assert.equal(result.run.counts.lines, 144)
    assert.equal(result.run.counts['verdict:RESOLVED:ENTAILED'], 32)
    assert.equal(result.run.counts['verdict:NOT_AUTHORED'], 90)
    assert.equal(result.failures.filter((f: any) => f.kind === 'REFERENCE_DEFECT').length, 8)
    assert.equal(result.failures.filter((f: any) => f.kind === 'COLLISION').length, 0, 'cluster 1 removed the only collision: it was convergence, not conflict')
    assert.equal(result.failures.filter((f: any) => f.kind === 'GAP').length, 90)
})

test('Gate A fails on the corpus, and says which checks and why', () => {
    const result: any = runStages0to10(corpusInput())
    assert.equal(gateA(result).verdict, 'FAIL')
    const failing = gateA(result).checks.filter((c: any) => c.verdict === 'FAIL').map((c: any) => c.checkId)
    assert.deepEqual(failing.sort(), [
        'GA-INFORMATION',
        'GA-NO-FAILED-LINE',
        'GA-REFERENCE-INTEGRITY',
        'GA-TRIGGER-UNIQUE',
    ])
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

    // Cluster 1 — the kind, by composition. No collision remains.
    assert.equal(result.failures.filter((f: any) => f.kind === 'COLLISION').length, 0)
    assert.equal(result.classified.get('game::V1').verdict, 'RESOLVED:ENTAILED')

    // Cluster 2 — the count, by the establishment boundary and the singleton rule.
    const primary = check(result, 'GA-ONE-PRIMARY-EVENT')
    assert.equal(primary.clauses[0].verdict, 'PASS', 'exactly one primary event')
    assert.ok(/^1 primary event/.test(primary.why))

    // Still open, and untouched: an information rule names an unregistered trigger.
    const information = check(result, 'GA-INFORMATION')
    assert.equal(information.clauses.find((c: any) => /registered trigger/.test(c.clause)).verdict, 'FAIL')
})

test('the fifteen Gate A checks are all present, and GA-RESIDUAL-SPACE is gone (SD-45)', () => {
    const result: any = runStages0to10(corpusInput())
    const ids = gateA(result).checks.map((c: any) => c.checkId).sort()
    assert.equal(ids.length, 15)
    assert.ok(!ids.includes('GA-RESIDUAL-SPACE'), 'SD-45 removed it; no machine-testable concept is created')
    assert.ok(ids.includes('GA-MODIFIER-OVERLAP'))
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
