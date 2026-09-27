/**
 * Derivation engine — increment 3 (stages 6 and 8: classify, forward results).
 *
 * The first verdicts. The rule under test above all others is SD-28: **gap before collision**. An
 * engine that reported "two objects disagree" about a value nobody authored would be saying something
 * false about the knowledge.
 *
 * Run: npm test
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { classifyLines } from './classify'
import { DerivedLine, resolvedValue } from './derive'
import { runStages0to5, runStages0to8 } from './engine'
import { indexRegister } from './register'
import { ContractItem, DerivationInput, LoadedContract, ResolutionLine, VERDICTS, FORWARD_RESULTS } from './types'

const DOCS = path.resolve(__dirname, '../../../../docs/audits/conformance')
const REGISTER = JSON.parse(fs.readFileSync(path.join(DOCS, 'register-2026-09-18.json'), 'utf8').replace(/^﻿/, ''))

function item(overrides: Partial<ContractItem> = {}): ContractItem {
    return {
        itemId: 'I-1',
        row: 'S2',
        selector: 'noun=channel',
        requirement: 'COUNT',
        value: 2,
        strictness: 'REQUIRED',
        valueStatus: 'REQUIRED_RANGE',
        scope: 'WHOLE_GAME',
        basis: 'AUTHORED',
        basisEvidence: { quote: 'two channels', sourceId: 'SRC-1' },
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
        declarations: [{ row: 'S2', declaration: 'CLAIMED', note: '' }],
        ...overrides,
    }
}

function input(contracts: LoadedContract[]): DerivationInput {
    return {
        selection: contracts.map(c => ({ objectId: c.objectId, knowledgeVersion: '1' })),
        contracts,
        envelope: { players: 12, lengthM: 40, widthM: 30, durationMin: 20 },
        register: REGISTER,
        derivationRules: { version: 'rev-5' },
    }
}

const lineFor = (result: any, suffix: string) => [...result.classified!.values()].find((l: any) => l.lineId.endsWith(suffix)) as any

// ---------------------------------------------------------------------------------------------
// Verdicts.
// ---------------------------------------------------------------------------------------------

function testEntailedLineResolves(): void {
    const result = runStages0to8(input([contract([item(), item({ itemId: 'I-2', row: 'S3', requirement: 'EQUALS', value: 'channel' })])]))
    assert.equal(lineFor(result, '::S3').verdict, 'RESOLVED:ENTAILED')
}

function testUnauthoredLineIsAGapWithItsReason(): void {
    const result = runStages0to8(input([contract([item()])]))
    const line = lineFor(result, '::S3')
    assert.equal(line.verdict, 'NOT_AUTHORED')
    assert.equal(line.reason, 'coverage', 'nobody examined the row, so the reason is coverage')
}

function testDeclaredGapIsDistinguishedFromCoverage(): void {
    const c = contract([item()])
    c.declarations.push({ row: 'S3', declaration: 'NOT_AUTHORED', note: 'needs a noun it cannot author' })
    const result = runStages0to8(input([c]))
    assert.equal(lineFor(result, '::S3').reason, 'declared gap', 'an object that said it cannot author this is a declared gap')
}

/** SD-28 — the ordering that matters. */
function testGapBeforeCollision(): void {
    // Two items disagree, but both are engine-only, so nothing supports the value: it is a gap, and no
    // collision may be raised on it.
    const result = runStages0to8(
        input([
            contract([
                item(),
                item({ itemId: 'I-2', row: 'S3', requirement: 'EQUALS', value: 'channel', basis: 'ENGINE_ONLY' }),
                item({ itemId: 'I-3', row: 'S3', requirement: 'EQUALS', value: 'zone', basis: 'ENGINE_ONLY' }),
            ]),
        ]),
    )
    const line = lineFor(result, '::S3')
    assert.equal(line.verdict, 'NOT_AUTHORED', 'an unauthored dependency is a gap first (SD-28)')
    assert.equal(line.collidingItems.length, 0)
    assert.ok(
        !result.failures.some((f: any) => f.kind === 'COLLISION'),
        'no collision record may exist on a line nothing authored',
    )
}

function testTwoEntailingItemsThatDisagreeCollide(): void {
    const result = runStages0to8(
        input([
            contract([
                item(),
                item({ itemId: 'I-2', row: 'S3', requirement: 'EQUALS', value: 'channel' }),
                item({ itemId: 'I-3', row: 'S3', requirement: 'EQUALS', value: 'zone' }),
            ]),
        ]),
    )
    const line = lineFor(result, '::S3')
    assert.equal(line.verdict, 'UNRESOLVED', 'two support-capable items no single value satisfies')
    assert.equal(line.collidingItems.length, 2)
    const collision = result.failures.find((f: any) => f.kind === 'COLLISION')
    assert.ok(collision, 'the collision is a record in its own right, naming both items')
    assert.equal(collision!.locus.lineId, line.lineId)
}

function testAgreeingItemsDoNotCollide(): void {
    const result = runStages0to8(
        input([
            contract([
                item(),
                item({ itemId: 'I-2', row: 'S3', requirement: 'EQUALS', value: 'channel' }),
                item({ itemId: 'I-3', row: 'S3', requirement: 'EQUALS', value: 'channel' }),
            ]),
        ]),
    )
    assert.equal(lineFor(result, '::S3').verdict, 'RESOLVED:ENTAILED', 'overlapping bounds intersect and do not collide')
}

function testOpenLineTakesAFreeVerdict(): void {
    const result = runStages0to8(
        input([contract([item(), item({ itemId: 'I-2', row: 'S5', requirement: 'RANGE', value: '0-6 m', valueStatus: 'REQUIRED_RANGE' })])]),
    )
    const line = lineFor(result, '::S5')
    assert.ok(String(line.verdict).startsWith('FREE'), 'an authorized freedom is a kind of FREE, keeping the four statuses unchanged')
}

function testEveryVerdictIsFromTheClosedList(): void {
    const result = runStages0to8(input([contract([item()])]))
    for (const line of result.classified!.values()) {
        if (line.verdict === null) continue
        assert.ok(VERDICTS.includes(line.verdict as any), `verdict ${line.verdict} is not in the closed list`)
    }
}

// ---------------------------------------------------------------------------------------------
// Forward results.
// ---------------------------------------------------------------------------------------------

function testOutsideBoundaryIsCountedNotDropped(): void {
    const result = runStages0to8(
        input([contract([item(), item({ itemId: 'I-2', row: 'S3', checkability: 'OUTSIDE_BOUNDARY', requirement: 'EQUALS', value: 'anything' })])]),
    )
    const outcome = result.forward!.find(f => f.item.itemId === 'I-2')!
    assert.equal(outcome.result, 'NOT_CHECKABLE_OUTSIDE_REPRESENTATION')
    assert.equal(result.forward!.length, 2, 'every admitted item gets exactly one result; none is dropped')
}

function testEngineWordingIsInert(): void {
    const result = runStages0to8(
        input([contract([item(), item({ itemId: 'I-2', row: 'S3', basis: 'ENGINE_ONLY', requirement: 'EQUALS', value: 'channel' })])]),
    )
    assert.equal(result.forward!.find(f => f.item.itemId === 'I-2')!.result, 'INERT')
}

/** SD-46 — a supporting contribution whose realization conditions are not satisfied. */
function testSupportingItemThatReachesNothingIsNotRealized(): void {
    const result = runStages0to8(
        input([contract([item(), item({ itemId: 'I-2', row: 'S3', selector: 'noun=zone', requirement: 'EQUALS', value: 'zone', strictness: 'SUPPORTING' })])]),
    )
    const outcome = result.forward!.find(f => f.item.itemId === 'I-2')!
    assert.equal(outcome.result, 'NOT_REALIZED', 'supporting, and its realization conditions are not satisfied')
}

function testRequiredItemThatReachesNothingIsUnmet(): void {
    const result = runStages0to8(
        input([contract([item(), item({ itemId: 'I-2', row: 'S3', selector: 'noun=zone', requirement: 'EQUALS', value: 'zone', strictness: 'REQUIRED' })])]),
    )
    assert.equal(result.forward!.find(f => f.item.itemId === 'I-2')!.result, 'UNMET', 'required, so unmet rather than not realized')
}

function testItemOnAnOpenLineIsPendingNotBroken(): void {
    const result = runStages0to8(
        input([contract([item(), item({ itemId: 'I-2', row: 'S5', requirement: 'RANGE', value: '0-6 m', valueStatus: 'REQUIRED_RANGE' })])]),
    )
    assert.equal(
        result.forward!.find(f => f.item.itemId === 'I-2')!.result,
        'PENDING_CHOICE',
        'the downstream choice process has not run yet: pending, not unmet',
    )
}

function testExistenceItemEstablishesItsClass(): void {
    const result = runStages0to8(input([contract([item()])]))
    assert.equal(result.forward!.find(f => f.item.itemId === 'I-1')!.result, 'SATISFIED')
}

function testEveryResultIsFromTheClosedList(): void {
    const result = runStages0to8(input([contract([item()])]))
    for (const outcome of result.forward!) {
        assert.ok(FORWARD_RESULTS.includes(outcome.result as any), `result ${outcome.result} is not in the closed list`)
    }
}

// ---------------------------------------------------------------------------------------------
// Determinism and no repair.
// ---------------------------------------------------------------------------------------------

function testDeterministicAcrossStages68(): void {
    const a = contract([item()], { contractId: 'C-1', objectId: 'O-1' })
    const b = contract([item({ itemId: 'I-9', selector: 'noun=zone' })], { contractId: 'C-2', objectId: 'O-2' })
    const strip = (r: any) => JSON.stringify({ classified: [...r.classified.entries()], forward: r.forward })
    assert.equal(strip(runStages0to8(input([a, b]))), strip(runStages0to8(input([b, a]))))
}

function testNoVerdictIsInventedInDerivationMode(): void {
    const result = runStages0to8(input([contract([item()])]))
    for (const line of result.classified!.values()) {
        assert.notEqual(line.verdict, 'INVENTED', 'INVENTED is checking-mode only: with no candidate, nothing asserts anything')
    }
}

// ---------------------------------------------------------------------------------------------
// SD-88 — evaluating a conditional line whose governing property is authoritatively resolved.
//
// His ruling of 27 September, and the four demonstrations he asked for: a resolved governing value
// causes the condition to be evaluated; an unresolved one does not; evaluation cannot itself supply or
// infer the governing value; and the change works through the general mechanism rather than through
// transition-specific handling.
//
// The transitions are deliberately **not** the subject here. Every case below runs on consequences
// (`V11`/`V13`/`V14a-c`, the Interaction Rules area) or on a Space row given an applicability entry
// the canonical register does not carry — because a mechanism demonstrated only where it was noticed
// is not a mechanism.
// ---------------------------------------------------------------------------------------------

const linesFor = (result: any, suffix: string) => [...result.classified!.values()].filter((l: any) => l.lineId.endsWith(suffix)) as any[]

/** A consequence whose effect is authored, so `V13` resolves and the `V14` conditions can be read. */
function consequenceContract(withEffect: boolean): LoadedContract {
    const items = [item({ itemId: 'CQ-1', row: 'V11', selector: 'effect=ACCESS', requirement: 'EXISTS', value: 'a consequence changing access' })]
    if (withEffect) items.push(item({ itemId: 'CQ-2', row: 'V13', selector: 'effect=ACCESS', requirement: 'EQUALS', value: 'ACCESS' }))
    return contract(items, { declarations: [{ row: 'V13', declaration: 'CLAIMED', note: '' }] })
}

function emptyRecord(overrides: Partial<DerivedLine> = {}): DerivedLine {
    return {
        lineId: 'X',
        entailing: [],
        bounding: [],
        undetermined: [],
        open: null,
        standingDecisions: [],
        standingValue: null,
        narrowing: [],
        narrowedTo: null,
        session: null,
        displaced: [],
        ...overrides,
    }
}

function testResolvedGoverningValueIsEvaluated(): void {
    const result = runStages0to8(input([consequenceContract(true)]))
    assert.equal(linesFor(result, '::V13')[0].verdict, 'RESOLVED:ENTAILED', 'the governing line is authoritatively resolved')

    // ACCESS satisfies V14a and V14b; V14c applies only to COUNT_CHANGE.
    assert.equal(linesFor(result, '::V14a')[0].lineState, 'ENUMERATED', 'the condition held, so the line is judged instead of left conditional')
    assert.equal(linesFor(result, '::V14b')[0].lineState, 'ENUMERATED')
    const withdrawn = linesFor(result, '::V14c')[0]
    assert.equal(withdrawn.lineState, 'WITHDRAWN', 'the condition failed: not applicable')
    assert.equal(withdrawn.verdict, null, 'a withdrawn line is not NOT_AUTHORED — nobody owes a value on a line that does not apply')
}

function testUnresolvedGoverningValueIsNotEvaluated(): void {
    // (a) Nothing authors the effect, so the governing line has no value. The dependents fail as gaps
    //     on the governing line — and crucially none of them is WITHDRAWN, which would be the engine
    //     reading "unknown" as "the condition is false".
    const result = runStages0to8(input([consequenceContract(false)]))
    assert.equal(linesFor(result, '::V13')[0].verdict, 'NOT_AUTHORED')
    for (const suffix of ['::V14a', '::V14b', '::V14c']) {
        const line = linesFor(result, suffix)[0]
        assert.notEqual(line.lineState, 'WITHDRAWN', `${suffix}: an unresolved governing value must never withdraw its dependent`)
        assert.equal(line.verdict, 'NOT_AUTHORED', `${suffix}: an unresolvable condition is not a false one (SD-28)`)
    }

    // (b) A governing line that is FREE is a downstream choice, not a resolved value. The dependent
    //     stays CONDITIONAL on that choice; the condition is not evaluated against a value nobody has.
    const index = indexRegister(REGISTER)
    const lines: ResolutionLine[] = [
        { lineId: 'X::V13', elementId: 'X', row: 'V13', member: null, lineState: 'ENUMERATED' },
        { lineId: 'X::V14a', elementId: 'X', row: 'V14a', member: null, lineState: 'CONDITIONAL', conditionalOn: 'X::V13' },
    ]
    const derived = new Map<string, DerivedLine>([
        ['X::V13', emptyRecord({ lineId: 'X::V13', open: { authority: 'SD-39', choiceSpace: 'either effect' } })],
        ['X::V14a', emptyRecord({ lineId: 'X::V14a' })],
    ])
    const classified = classifyLines(lines, derived, [], index)
    assert.ok(String(classified.get('X::V13')!.verdict).startsWith('FREE'), 'the governing line is an authorized choice')
    assert.equal(classified.get('X::V14a')!.lineState, 'CONDITIONAL', 'the dependent stays conditional on the choice')
}

function testEvaluationCannotSupplyTheGoverningValue(): void {
    // (a) The governing line is derived by a route that carries no value. Comparing against the
    //     condition would mean inventing one, so the condition is not evaluated and the stop is
    //     reported rather than absorbed.
    const index = indexRegister(REGISTER)
    const lines: ResolutionLine[] = [
        { lineId: 'X::V13', elementId: 'X', row: 'V13', member: null, lineState: 'ENUMERATED' },
        { lineId: 'X::V14a', elementId: 'X', row: 'V14a', member: null, lineState: 'CONDITIONAL', conditionalOn: 'X::V13' },
    ]
    const derived = new Map<string, DerivedLine>([
        ['X::V13', emptyRecord({ lineId: 'X::V13', standingDecisions: ['SD-20'] })],
        ['X::V14a', emptyRecord({ lineId: 'X::V14a' })],
    ])
    const stopped: { where: string; why: string }[] = []
    const classified = classifyLines(lines, derived, [], index, stopped)
    assert.equal(classified.get('X::V13')!.verdict, 'RESOLVED:ENTAILED', 'the governing line is derived')
    assert.equal(classified.get('X::V14a')!.lineState, 'CONDITIONAL', 'derived but valueless: the condition is not evaluated')
    assert.ok(
        stopped.some(s => s.where.includes('X::V14a')),
        'the engine reports that it could not evaluate the condition rather than completing it from judgement (SD-48)',
    )

    // (b) Where the condition does hold, the line is judged — and judged on its own contributions. A
    //     line nothing authored is NOT_AUTHORED: applicability decides whether a line is judged, never
    //     what it holds. Classification also writes nothing back into the derived records.
    const staged: any = runStages0to5(input([consequenceContract(true)]))
    const snapshot = JSON.stringify([...staged.derived.lines.entries()])
    const out = classifyLines(staged.lines, staged.derived.lines, staged.scope.declarations, indexRegister(REGISTER))
    assert.equal(JSON.stringify([...staged.derived.lines.entries()]), snapshot, 'classification reads derived values and writes none')
    const applicable = [...out.values()].find(l => l.lineId.endsWith('::V14a'))!
    assert.equal(applicable.lineState, 'ENUMERATED')
    assert.equal(applicable.verdict, 'NOT_AUTHORED', 'the condition made the line judged; it supplied no value for it')
}

function testConditionalMechanismIsGeneral(): void {
    // A register entry the canonical file does not carry: a Space row made conditional on another
    // Space row. Nothing about transitions is involved, and the same code path decides it.
    const register = JSON.parse(JSON.stringify(REGISTER))
    register.applicability.S5 = { when: { row: 'S3', sameElement: true, in: ['channel'] }, text: 'fixture: position along applies only to a channel' }

    const regions = contract([
        item({ itemId: 'R-1', row: 'S2', selector: 'noun=channel', requirement: 'COUNT', value: 1 }),
        item({ itemId: 'R-2', row: 'S3', selector: 'noun=channel', requirement: 'EQUALS', value: 'channel' }),
        item({ itemId: 'R-3', row: 'S2', selector: 'noun=zone', requirement: 'COUNT', value: 1 }),
        item({ itemId: 'R-4', row: 'S3', selector: 'noun=zone', requirement: 'EQUALS', value: 'zone' }),
    ])
    const result = runStages0to8({ ...input([regions]), register })

    const channel = result.classified!.get('c:C-1:R-1::S5')
    const zone = result.classified!.get('c:C-1:R-3::S5')
    assert.ok(channel && zone, 'both regions enumerate the conditional row')
    assert.equal(channel!.lineState, 'ENUMERATED', 'the channel satisfies the condition, so its line is judged')
    assert.equal(zone!.lineState, 'WITHDRAWN', 'the zone does not, so its line is withdrawn')

    // And the mechanism names no row: it reads the register's applicability block, whatever is in it.
    const source = fs.readFileSync(path.join(__dirname, 'classify.ts'), 'utf8')
    const rowIds = source.match(/\b(T[1-9]|V1[1-9][a-c]?|S[1-9])\b/g)
    assert.equal(rowIds, null, `classify.ts must name no register row: found ${JSON.stringify(rowIds)}`)
}

// ---------------------------------------------------------------------------------------------
// SD-90 — the ADAPTED disposition, his ruling of 27 September.
//
// "A PREFERRED_DEFAULT contribution is displaced when an applicable, support-capable required
// contribution authoritatively resolves the same property." Then the required contribution supplies
// the value, the default takes no part in collision resolution, the default receives the disposition,
// its source stays visible, and adaptation supplies no support.
//
// The five cases below are the five he asked for. The distinction between the first two is his: a
// default whose value *differs* has adapted; one that *matches* has not adapted at all, and the only
// thing displacement does to it is stop it counting as a second support.
// ---------------------------------------------------------------------------------------------

/** A region class, plus whatever contributions the case needs on its noun. */
function regionWith(...noun: ContractItem[]): LoadedContract {
    return contract([item(), ...noun], {
        declarations: [
            { row: 'S2', declaration: 'CLAIMED', note: '' },
            { row: 'S3', declaration: 'CLAIMED', note: '' },
        ],
    })
}

const noun = (itemId: string, value: string, valueStatus: string, overrides: Partial<ContractItem> = {}): ContractItem =>
    item({ itemId, row: 'S3', requirement: 'EQUALS', value, valueStatus: valueStatus as any, strictness: 'SUPPORTING', ...overrides })

const required = (itemId: string, value: string) => noun(itemId, value, 'REQUIRED_RANGE', { strictness: 'REQUIRED' })
const preferred = (itemId: string, value: string, overrides: Partial<ContractItem> = {}) => noun(itemId, value, 'PREFERRED_DEFAULT', overrides)

function recordFor(result: any, suffix: string): DerivedLine {
    return [...(result.derived!.lines as Map<string, DerivedLine>).entries()].find(([id]) => id.endsWith(suffix))![1]
}
const outcomeFor = (result: any, itemId: string) => result.forward!.find((o: any) => o.item.itemId === itemId)!

function testDisplacedDifferingDefaultIsAdapted(): void {
    const result = runStages0to8(input([regionWith(required('R', 'channel'), preferred('P', 'zone'))]))
    const line = linesFor(result, '::S3')[0]
    const record = recordFor(result, '::S3')

    assert.equal(line.verdict, 'RESOLVED:ENTAILED', 'the required contribution resolves the property')
    assert.equal(resolvedValue(record)!.value, 'channel', 'and supplies its own value, not the default')
    assert.deepEqual(
        record.entailing.map(e => e.item.itemId),
        ['R'],
        'the displaced default is out of `entailing`, which is what support is read from',
    )
    assert.equal(record.displaced.length, 1)
    assert.equal(record.displaced[0].item.itemId, 'P')
    assert.equal(record.displaced[0].agreed, false)
    assert.equal(record.displaced[0].preferred, 'zone', 'what it preferred stays visible in provenance')
    assert.deepEqual(
        record.displaced[0].displacedBy.map(i => i.itemId),
        ['R'],
        'and so does what displaced it',
    )
    assert.equal(outcomeFor(result, 'P').result, 'ADAPTED')
    assert.deepEqual(outcomeFor(result, 'P').reach, [line.lineId], 'a displaced contribution still reached the line — that is why it could be displaced')
}

function testDisplacedMatchingDefaultAddsNoSupport(): void {
    const result = runStages0to8(input([regionWith(required('R', 'channel'), preferred('P', 'channel'))]))
    const record = recordFor(result, '::S3')

    assert.equal(resolvedValue(record)!.value, 'channel')
    assert.deepEqual(record.entailing.map(e => e.item.itemId), ['R'], 'the matching default adds no second support')
    assert.equal(record.displaced.length, 1)
    assert.equal(record.displaced[0].agreed, true)
    assert.equal(record.displaced[0].preferred, 'channel', 'still visible in provenance')
    assert.equal(
        outcomeFor(result, 'P').result,
        'SATISFIED',
        'it adapted to nothing: the game holds the value it preferred, so calling it ADAPTED would be false',
    )
}

function testPreferredDefaultAloneIsUnchanged(): void {
    const result = runStages0to8(input([regionWith(preferred('P', 'zone'))]))
    const record = recordFor(result, '::S3')

    assert.equal(linesFor(result, '::S3')[0].verdict, 'RESOLVED:ENTAILED', 'with nothing required on the line, the default keeps its existing behaviour')
    assert.equal(resolvedValue(record)!.value, 'zone')
    assert.deepEqual(record.entailing.map(e => e.item.itemId), ['P'])
    assert.deepEqual(record.displaced, [], 'nothing displaced it, so nothing is recorded')
    assert.equal(outcomeFor(result, 'P').result, 'SATISFIED')
}

function testTwoRequiredContributionsStillCollide(): void {
    const plain = runStages0to8(input([regionWith(required('R1', 'channel'), required('R2', 'zone'))]))
    const collided = linesFor(plain, '::S3')[0]
    assert.equal(collided.verdict, 'UNRESOLVED', 'displacement is not a precedence hierarchy: two required contributions still collide')
    assert.deepEqual(collided.collidingItems.map((i: any) => i.itemId).sort(), ['R1', 'R2'])

    // And with a preferred default alongside them: it is displaced, and it is **not** one of the
    // colliding items. "The PREFERRED_DEFAULT does not participate in collision resolution."
    const withDefault = runStages0to8(input([regionWith(required('R1', 'channel'), required('R2', 'zone'), preferred('P', 'band'))]))
    const line = linesFor(withDefault, '::S3')[0]
    assert.equal(line.verdict, 'UNRESOLVED')
    assert.deepEqual(line.collidingItems.map((i: any) => i.itemId).sort(), ['R1', 'R2'], 'the default is absent from the collision')
    assert.deepEqual(recordFor(withDefault, '::S3').displaced.map(d => d.item.itemId), ['P'])
}

function testAdaptationCannotCreateSupport(): void {
    const result = runStages0to8(
        input([
            regionWith(
                required('R', 'channel'),
                preferred('E', 'zone', { basis: 'ENGINE_ONLY' }),
                preferred('A', 'zone', { basis: 'ASSUMED' }),
                preferred('O', 'zone', { checkability: 'OUTSIDE_BOUNDARY' }),
                noun('T', 'zone', 'TYPICAL_EXAMPLE'),
            ),
        ]),
    )
    const record = recordFor(result, '::S3')

    assert.deepEqual(record.entailing.map(e => e.item.itemId), ['R'], 'nothing unsupported became support')
    assert.deepEqual(record.displaced, [], 'and nothing unsupported was displaced: it never contributed a value to displace')
    assert.equal(outcomeFor(result, 'E').result, 'INERT', 'engine wording supports nothing, adapted or not (SD-21)')
    assert.equal(outcomeFor(result, 'T').result, 'INERT')
    assert.equal(outcomeFor(result, 'O').result, 'NOT_CHECKABLE_OUTSIDE_REPRESENTATION')
    assert.notEqual(outcomeFor(result, 'A').result, 'ADAPTED', 'an assumption bounds and never entailed, so it was never displaced (SD-83)')
}

const TESTS: [string, () => void][] = [
    ['an entailed line resolves', testEntailedLineResolves],
    ['an unauthored line is a gap with its reason', testUnauthoredLineIsAGapWithItsReason],
    ['a declared gap is distinguished from coverage', testDeclaredGapIsDistinguishedFromCoverage],
    ['gap before collision', testGapBeforeCollision],
    ['two entailing items that disagree collide', testTwoEntailingItemsThatDisagreeCollide],
    ['agreeing items do not collide', testAgreeingItemsDoNotCollide],
    ['an open line takes a FREE verdict', testOpenLineTakesAFreeVerdict],
    ['every verdict is from the closed list', testEveryVerdictIsFromTheClosedList],
    ['outside the boundary is counted, not dropped', testOutsideBoundaryIsCountedNotDropped],
    ['engine wording is inert', testEngineWordingIsInert],
    ['a supporting item that reaches nothing is NOT_REALIZED', testSupportingItemThatReachesNothingIsNotRealized],
    ['a required item that reaches nothing is UNMET', testRequiredItemThatReachesNothingIsUnmet],
    ['an item on an open line is pending, not broken', testItemOnAnOpenLineIsPendingNotBroken],
    ['an existence item establishes its class', testExistenceItemEstablishesItsClass],
    ['every forward result is from the closed list', testEveryResultIsFromTheClosedList],
    ['deterministic across stages 6-8', testDeterministicAcrossStages68],
    ['no verdict is invented in derivation mode', testNoVerdictIsInventedInDerivationMode],
    ['SD-88: a resolved governing value causes the condition to be evaluated', testResolvedGoverningValueIsEvaluated],
    ['SD-88: an unresolved governing value does not', testUnresolvedGoverningValueIsNotEvaluated],
    ['SD-88: evaluation cannot supply or infer the governing value', testEvaluationCannotSupplyTheGoverningValue],
    ['SD-88: the mechanism is general, not transition-specific', testConditionalMechanismIsGeneral],
    ['SD-90: a differing preferred default is displaced and ADAPTED', testDisplacedDifferingDefaultIsAdapted],
    ['SD-90: a matching preferred default stays visible but adds no support', testDisplacedMatchingDefaultAddsNoSupport],
    ['SD-90: a preferred default alone keeps its existing behaviour', testPreferredDefaultAloneIsUnchanged],
    ['SD-90: two required contributions still collide', testTwoRequiredContributionsStillCollide],
    ['SD-90: adaptation cannot turn an unsupported contribution into support', testAdaptationCannotCreateSupport],
]

let failed = 0
for (const [name, run] of TESTS) {
    try {
        run()
        console.log(`  ok  ${name}`)
    } catch (error: any) {
        failed++
        console.error(`  FAIL ${name}: ${error.message}`)
    }
}

if (failed) {
    console.error(`derivation increment 3: ${failed} of ${TESTS.length} failed`)
    process.exit(1)
}
console.log(`derivation increment 3: ${TESTS.length} passed`)
