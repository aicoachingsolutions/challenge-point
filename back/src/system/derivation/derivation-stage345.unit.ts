/**
 * Derivation engine — increment 2 (stages 3–5: scope, reach, derive).
 *
 * The same seven kinds of evidence, applied to the first stages that derive anything:
 *   approved semantics · expected refusals refuse · canonical ordering and determinism · no OPEN value
 *   silently chosen · no unsupported identity created · no failed or gapped input repaired · version and
 *   provenance surviving.
 *
 * Run: npm test
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { corpusInput } from './corpus'
import { runStages0to5 } from './engine'
import { DerivationInput, LoadedContract, ContractItem } from './types'

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

// ---------------------------------------------------------------------------------------------
// Stage 5 — what entails, and what only bounds.
// ---------------------------------------------------------------------------------------------

function testAuthoredEqualsEntails(): void {
    const result = runStages0to5(input([contract([item(), item({ itemId: 'I-2', row: 'S3', requirement: 'EQUALS', value: 'channel' })])]))
    const line = [...result.derived!.lines.values()].find(l => l.lineId.endsWith('::S3'))!
    assert.equal(line.entailing.length, 1, 'an authored EQUALS item entails its value')
    assert.equal((line.entailing[0].support as any).relation, 'ENTAILS')
}

function testAssumedItemBoundsButNeverEntails(): void {
    const result = runStages0to5(
        input([contract([item(), item({ itemId: 'I-2', row: 'S5', requirement: 'EQUALS', value: 'the attacking end', basis: 'ASSUMED' })])]),
    )
    const line = [...result.derived!.lines.values()].find(l => l.lineId.endsWith('::S5'))!
    assert.equal(line.entailing.length, 0, 'an assumed item never entails (§3)')
    assert.equal(line.bounding.length, 1, 'it bounds instead')
    assert.equal((line.bounding[0].support as any).relation, 'NARROWS')
}

function testEngineWordingSupportsNothing(): void {
    const result = runStages0to5(
        input([contract([item(), item({ itemId: 'I-2', row: 'S5', requirement: 'EQUALS', value: 'the attacking end', basis: 'ENGINE_ONLY' })])]),
    )
    const line = [...result.derived!.lines.values()].find(l => l.lineId.endsWith('::S5'))!
    assert.equal(line.entailing.length + line.bounding.length, 0, 'SD-21: engine wording supports nothing')
}

function testTypicalExampleIsInert(): void {
    const result = runStages0to5(
        input([contract([item(), item({ itemId: 'I-2', row: 'S5', requirement: 'EQUALS', value: 'the attacking end', valueStatus: 'TYPICAL_EXAMPLE' })])]),
    )
    const line = [...result.derived!.lines.values()].find(l => l.lineId.endsWith('::S5'))!
    assert.equal(line.entailing.length + line.bounding.length, 0, 'a typical example is inert')
}

// ---------------------------------------------------------------------------------------------
// SD-39 — OPEN is an authorized degree of freedom, never a synonym for unknown.
// ---------------------------------------------------------------------------------------------

function testOpenWhereTheChoiceSpaceIsSupported(): void {
    // The class supports the property's existence; an authored range supports the choice space.
    const result = runStages0to5(
        input([contract([item(), item({ itemId: 'I-2', row: 'S5', requirement: 'RANGE', value: '0-6 m', valueStatus: 'REQUIRED_RANGE' })])]),
    )
    const line = [...result.derived!.lines.values()].find(l => l.lineId.endsWith('::S5'))!
    assert.ok(line.open, 'existence supported by the class, choice space supported by the authored range')
    assert.equal(line.open!.authority, 'SD-39')
    assert.ok(line.open!.choiceSpace, 'an open line carries the register choice space it rests on')
    assert.ok(line.bounding.length > 0, 'and the bound that supports it')
}

/**
 * SD-39's qualification: "OPEN is not produced by absence of knowledge. The property's existence and
 * legitimate choice space must already be supported." A fillable row nothing has addressed is a gap,
 * not a freedom.
 */
function testAbsenceOfKnowledgeDoesNotProduceOpen(): void {
    const result = runStages0to5(input([contract([item()])]))
    const lines = [...result.derived!.lines.values()]

    const neutrals = lines.find(l => l.lineId === 'game::P5')!
    assert.equal(neutrals.open, null, 'no contract mentions neutrals, so their count is not an authorized freedom')

    const position = lines.find(l => l.lineId.endsWith('::S5'))!
    assert.equal(position.open, null, 'the register bounds this choice space by authored values, and none is authored')
    // SD-50 settled what increment 2 had to leave open: "If a required property must be resolved, its
    // existence is supported, but the legitimate choice space/bounds required to make it OPEN are
    // unsupported, report a GAP." Not a refusal, and no longer an unresolved question.
    assert.equal(
        result.stopped.filter(s => /should instead refuse/.test(s.why)).length,
        0,
        'SD-50 settled it: an unsupported choice space is a GAP',
    )

    for (const line of lines.filter(l => l.lineId.endsWith('::S3'))) {
        assert.equal(line.open, null, 'a row with no registered choice space is never open')
    }
}

function testEntailmentClosesOpenness(): void {
    const result = runStages0to5(
        input([contract([item(), item({ itemId: 'I-2', row: 'S5', requirement: 'POSITIONED', value: '0-6 m' })])]),
    )
    const line = [...result.derived!.lines.values()].find(l => l.lineId.endsWith('::S5'))!
    assert.ok(line.entailing.length > 0)
    assert.equal(line.open, null, 'selected knowledge that determines the value closes the freedom')
}

function testUndeclaredSilenceBarsOpenness(): void {
    const c = contract([item()])
    c.declarations.push({ row: 'S5', declaration: 'UNDECLARED', note: 'never examined' })
    const result = runStages0to5(input([c]))
    const line = [...result.derived!.lines.values()].find(l => l.lineId.endsWith('::S5'))!
    assert.equal(line.open, null, 'AM-04: unexamined silence cannot license a free choice')
}

function testNoOpenLineCarriesAValue(): void {
    const result = runStages0to5(input([contract([item()])]))
    for (const line of result.derived!.lines.values()) {
        if (!line.open) continue
        assert.ok(!('value' in (line as any)), 'no code path writes a value onto an open line (SD-35)')
    }
}

// ---------------------------------------------------------------------------------------------
// Stage 4 — three-valued reach, and the stop it reports (SD-48).
// ---------------------------------------------------------------------------------------------

function testUndeterminedReachDerivesNothingAndReports(): void {
    // The class fixes `noun`; the item selects on `functions`, which the class leaves open.
    const result = runStages0to5(
        input([
            contract([
                item(),
                item({ itemId: 'I-2', row: 'S5', selector: 'functions ∋ perceptual-reference', requirement: 'POSITIONED', value: '0-6 m' }),
            ]),
        ]),
    )
    assert.ok(result.run.counts.undeterminedReaches > 0, 'a selector the class leaves open is undetermined, not false')
    const line = [...result.derived!.lines.values()].find(l => l.lineId.endsWith('::S5'))!
    assert.equal(line.entailing.length, 0, 'nothing is derived from an undetermined reach')
    assert.ok(line.undetermined.length > 0, 'it is recorded against the line')
    // SD-49 established the semantics — "applicability is unresolved; derive nothing from that
    // application … record the indeterminate case rather than resolving it by interpretation" — so the
    // engine follows a rule here rather than stopping on an open question.
    assert.equal(
        result.stopped.filter(s => /stage 4, reach/.test(s.where)).length,
        0,
        'SD-49 settled it; the indeterminate case is recorded, not reported as unestablished',
    )
}

function testContradictedSelectorDoesNotReach(): void {
    const result = runStages0to5(
        input([contract([item(), item({ itemId: 'I-2', row: 'S5', selector: 'noun=zone', requirement: 'EQUALS', value: 'the far end' })])]),
    )
    const line = [...result.derived!.lines.values()].find(l => l.lineId.endsWith('::S5'))!
    assert.equal(line.entailing.length, 0, 'a class fixed to another value is definitely not reached')
    assert.equal(line.undetermined.length, 0, 'and that is a definite false, not an undetermined')
}

// ---------------------------------------------------------------------------------------------
// SD-31 — a declaration survives an empty scope.
// ---------------------------------------------------------------------------------------------

/**
 * SD-31 still holds, but the case that exercises it has changed under SD-93. An own-involvement
 * existence item now populates the scope, so an empty set means the contract establishes no class at
 * all — a contract of field items only.
 */
function testOwnInvolvementEmptyKeepsTheDeclaration(): void {
    const c = contract([item({ itemId: 'I-FIELD', row: 'S5', requirement: 'EQUALS', value: 'the far end', scope: 'OWN_INVOLVEMENT' })])
    c.declarations = [{ row: 'S2', declaration: 'NOT_AUTHORED', scope: 'OWN_INVOLVEMENT', note: 'needs channels' }]
    const result = runStages0to5(input([c]))
    const own = result.scope!.ownInvolvement.get('C-1')!
    assert.equal(own.length, 0, 'the contract establishes no element class, so its own involvement is empty')
    const preserved = result.scope!.declarations.find(d => d.row === 'S2')
    assert.ok(preserved, 'SD-31: the empty scope empties the item application set, not the declaration')
    assert.equal(preserved!.declaration, 'NOT_AUTHORED')

    // SD-93 — and it is no longer silent.
    const named = result.scope!.diagnostics.find(d => d.code === 'OWN_INVOLVEMENT_UNPOPULATED')
    assert.ok(named, 'an own-involvement contribution with nothing to reach is reported by name')
    assert.equal(named!.where, 'C-1')
    assert.match(named!.detail, /I-FIELD/, 'and it names the contributions that reach nothing')
}

/**
 * SD-93 — the amendment to AM-13. Own involvement is *"the authoritative element classes established
 * by that knowledge object, including classes established by its own-involvement existence
 * contributions"*. The restriction that replaces the prohibition is that own-involvement scope only
 * ever **selects**: it establishes no class of its own.
 */
function testOwnInvolvementIncludesItsOwnEstablishedClasses(): void {
    const c = contract([
        item({ itemId: 'I-WHOLE', scope: 'WHOLE_GAME' }),
        item({ itemId: 'I-OWN', scope: 'OWN_INVOLVEMENT', selector: 'noun=zone' }),
    ])
    const result = runStages0to5(input([c]))
    assert.deepEqual(
        result.scope!.ownInvolvement.get('C-1')!,
        ['c:C-1:I-OWN', 'c:C-1:I-WHOLE'],
        'a class established at own-involvement scope now populates the scope it defines',
    )
    assert.deepEqual(result.scope!.diagnostics, [], 'and nothing is reported, because nothing is unreachable')

    // It selects, it does not establish: every class in the set was formed at stage 2, and the set
    // never contains a class another contract established.
    const formed = new Set(result.classes.map(k => k.classId))
    for (const id of result.scope!.ownInvolvement.get('C-1')!) {
        assert.ok(formed.has(id), `${id} is a class stage 2 established, not one this scope created`)
        assert.equal(result.classes.find(k => k.classId === id)!.fromItem.contractId, 'C-1')
    }
}

/** A contract's own-involvement items still reach no other contract's elements. */
function testOwnInvolvementDoesNotReachAnotherContract(): void {
    const mine = contract([item({ itemId: 'I-OWN', scope: 'OWN_INVOLVEMENT' })], { contractId: 'C-1', objectId: 'O-1' })
    const theirs = contract([item({ itemId: 'I-THEIRS', selector: 'noun=zone' })], { contractId: 'C-2', objectId: 'O-2' })
    const result = runStages0to5(input([mine, theirs]))
    assert.deepEqual(result.scope!.ownInvolvement.get('C-1')!, ['c:C-1:I-OWN'])
    const application = result.scope!.applicationSets.find(a => a.item.itemId === 'I-OWN')!
    assert.ok(!application.classIds.includes('c:C-2:I-THEIRS'), 'own involvement is this object’s elements, and only those')
}

// ---------------------------------------------------------------------------------------------
// Determinism, and nothing repaired.
// ---------------------------------------------------------------------------------------------

function testDeterministicAcrossStages345(): void {
    const a = contract([item()], { contractId: 'C-1', objectId: 'O-1' })
    const b = contract([item({ itemId: 'I-9', selector: 'noun=zone' })], { contractId: 'C-2', objectId: 'O-2' })
    const strip = (r: any) =>
        JSON.stringify({
            classes: r.classes,
            lines: r.lines,
            derived: [...r.derived.lines.entries()],
            scope: { sets: r.scope.applicationSets, declarations: r.scope.declarations },
        })
    assert.equal(strip(runStages0to5(input([a, b]))), strip(runStages0to5(input([b, a]))), 'shuffled input, identical output')
}

function testRefusedContractDerivesNothing(): void {
    const bad = contract([item({ basis: 'NOT-A-BASIS' })])
    const result = runStages0to5(input([bad]))
    assert.equal(result.classes.length, 0)
    assert.equal(result.scope!.applicationSets.length, 0, 'a refused contract contributes no application set')
}

function testNoDivergenceIsClaimedFalsely(): void {
    const result = runStages0to5(input([contract([item()])]))
    assert.equal(result.scope!.divergence.length, 0)
    assert.equal(result.run.divergent, false, 'divergence is reported only when the two computations actually disagree')
}

// ---------------------------------------------------------------------------------------------
// SD-91 — a citable standing decision whose condition reads another property's value.
//
// His ruling of 27 September, authorized "as a separate mechanism from SD-88": where the condition is
// explicitly authored and the governing property is authoritatively resolved, evaluate it. "Evaluation
// may read the governing value but may not supply, infer or modify it. If the governing value is
// unresolved, free, failed or valueless, do not infer the condition's result."
//
// He asked for this to be tested generally rather than only against SD-13, so every case below uses a
// standing decision that does not exist in the canonical register, on Space rows, with no transition
// anywhere near it.
// ---------------------------------------------------------------------------------------------

/**
 * A register carrying one extra citable decision: `S5` takes a value, but only where `S6` is the
 * full width. The governing row is deliberately **not** a selector attribute — under SD-92 a
 * selector would carry it, and then the unresolved case could not be constructed at all.
 */
function registerWithConditionalDecision(extra: any[] = []): any {
    const register = JSON.parse(JSON.stringify(REGISTER))
    register.citableStandingDecisions.push({
        id: 'SD-TEST',
        item: { row: 'S5', selector: '*', requirement: 'EQUALS', value: 'end line to end line' },
        condition: { row: 'S6', sameElement: true, state: 'derived', equals: 'the full width' },
    })
    register.citableStandingDecisions.push(...extra)
    return register
}

/** Two regions, each naming its own noun, so one satisfies the condition and one does not. */
function twoRegions(channelNoun: ContractItem | null, zoneNoun: ContractItem | null): LoadedContract {
    const items = [
        item({ itemId: 'R-CH', selector: 'noun=channel', requirement: 'COUNT', value: 1 }),
        item({ itemId: 'R-ZN', selector: 'noun=zone', requirement: 'COUNT', value: 1 }),
    ]
    if (channelNoun) items.push(channelNoun)
    if (zoneNoun) items.push(zoneNoun)
    return contract(items, {
        declarations: [
            { row: 'S2', declaration: 'CLAIMED', note: '' },
            { row: 'S3', declaration: 'CLAIMED', note: '' },
            { row: 'S6', declaration: 'CLAIMED', note: '' },
        ],
    })
}

const nounItem = (itemId: string, selectorNoun: string, value: string, overrides: Partial<ContractItem> = {}) =>
    item({ itemId, row: 'S6', selector: 'noun=' + selectorNoun, requirement: 'EQUALS', value, ...overrides })

const bothWidths = () => twoRegions(nounItem('W-CH', 'channel', 'the full width'), nounItem('W-ZN', 'zone', 'a narrow band'))

function testConditionalDecisionFiresOnAResolvedGoverningValue(): void {
    const register = registerWithConditionalDecision()
    const result: any = runStages0to5({ ...input([bothWidths()]), register })

    const channel = result.derived.lines.get('c:C-1:R-CH::S5')
    const zone = result.derived.lines.get('c:C-1:R-ZN::S5')
    assert.ok(channel && zone, 'both regions enumerate the governed row')

    assert.deepEqual(channel.standingDecisions, ['SD-TEST'], 'the condition held, so the decision applies')
    assert.deepEqual(channel.standingValue, { id: 'SD-TEST', value: 'end line to end line' })
    assert.deepEqual(zone.standingDecisions, [], 'the condition failed on the other element, so it does not')
    assert.equal(zone.standingValue, null)
}

function testConditionalDecisionDoesNotFireWithoutAGoverningValue(): void {
    const register = registerWithConditionalDecision()

    // (a) unresolved / failed: nothing authors the width at all.
    const unauthored: any = runStages0to5({ ...input([twoRegions(null, null)]), register })
    assert.deepEqual(unauthored.derived.lines.get('c:C-1:R-CH::S5').standingDecisions, [], 'no governing value, so no result is inferred')

    // (b) valueless: the governing line is resolved by a route that carries no value. A second
    //     decision claims S6 and states none, so the line has a standing decision and no value.
    const valueless: any = runStages0to5({
        ...input([twoRegions(null, null)]),
        register: registerWithConditionalDecision([{ id: 'SD-TEST-SILENT', item: { row: 'S6', selector: '*', requirement: 'EQUALS' } }]),
    })
    const governing = valueless.derived.lines.get('c:C-1:R-CH::S6')
    assert.deepEqual(governing.standingDecisions, ['SD-TEST-SILENT'], 'the governing line is resolved by a route')
    assert.equal(governing.standingValue, null, 'but that route carries no value')
    assert.deepEqual(
        valueless.derived.lines.get('c:C-1:R-CH::S5').standingDecisions,
        [],
        'derived but valueless is one of his four cases: the condition is not evaluated',
    )
}

function testConditionalEvaluationDoesNotTouchTheGoverningValue(): void {
    const register = registerWithConditionalDecision()
    const result: any = runStages0to5({ ...input([bothWidths()]), register })

    for (const [lineId, expected] of [
        ['c:C-1:R-CH::S6', 'the full width'],
        ['c:C-1:R-ZN::S6', 'a narrow band'],
    ] as [string, string][]) {
        const governing = result.derived.lines.get(lineId)
        assert.equal(governing.entailing.length, 1, `${lineId}: the governing line keeps exactly its own contribution`)
        assert.equal(governing.entailing[0].value, expected)
        assert.deepEqual(governing.standingDecisions, [], `${lineId}: reading a value never writes one back to it`)
        assert.equal(governing.standingValue, null)
    }
}

/** His expectation, asserted rather than assumed: this mechanism moves nothing in today's corpus. */
function testConditionalDecisionsChangeNothingInTheCorpus(): void {
    const result: any = runStages0to5(corpusInput())
    const firing = [...result.derived.lines.entries()].filter(([, r]: any) => r.standingDecisions.includes('SD-13'))
    assert.deepEqual(firing, [], 'SD-13 is the corpus’s only conditional decision and the corpus holds no START element')
}

// ---------------------------------------------------------------------------------------------
// SD-92 — the establishing selector carries its attribute, subordinately, per operator.
// ---------------------------------------------------------------------------------------------

const lineOf = (result: any, suffix: string) => [...(result.derived!.lines as Map<string, any>).entries()].find(([id]) => id.endsWith(suffix))![1]

function testSelectorFixesTheValueWhereNothingEntails(): void {
    // The class is established by a selector reading `noun=channel`; nothing is written on S3.
    const result = runStages0to5(input([contract([item()])]))
    const line = lineOf(result, '::S3')
    assert.equal(line.entailing.length, 1, 'the establishing selector supplies the value')
    assert.equal(line.entailing[0].value, 'channel')
    assert.equal(line.entailing[0].support.relation, 'CARRIES', 'and provenance says it came from the selector, not from an item on the row')
    assert.equal(line.entailing[0].support.itemId, 'I-1', 'the support is the establishing item')
}

function testAnItemOnTheRowIsNotCompetedWith(): void {
    const result = runStages0to5(input([contract([item(), item({ itemId: 'I-2', row: 'S3', requirement: 'EQUALS', value: 'band' })])]))
    const line = lineOf(result, '::S3')
    assert.equal(line.entailing.length, 1, 'the selector does not compete with an item that entails the field')
    assert.equal(line.entailing[0].item.itemId, 'I-2')
    assert.equal(line.entailing[0].value, 'band', 'and it does not override it either — no collision is manufactured')
}

function testMembershipDoesNotDefineTheSet(): void {
    const result = runStages0to5(input([contract([item({ selector: 'noun=channel AND functions ∋ access' })])]))
    const noun = lineOf(result, '::S3')
    const functions = lineOf(result, '::S4')
    assert.equal(noun.entailing.length, 1, 'the = term still fixes its value')
    assert.equal(functions.entailing.length, 0, '∋ establishes membership and does not define the complete set')
    assert.equal(functions.establishedMembers.length, 1)
    assert.equal(functions.establishedMembers[0].member, 'access')
    assert.equal(functions.establishedMembers[0].support.relation, 'CARRIES')
}

function testInNarrowsAndFixesNothing(): void {
    const result = runStages0to5(input([contract([item({ selector: 'noun IN {channel, corridor}' })])]))
    const line = lineOf(result, '::S3')
    assert.equal(line.entailing.length, 0, '∈ fixes no single value')
    assert.deepEqual(line.narrowedTo.members, ['channel', 'corridor'], 'it narrows the allowable set (SD-78)')
}

function testTheCarryReachesOnlyItsOwnElement(): void {
    const c = contract([
        item({ itemId: 'I-CH', selector: 'noun=channel', requirement: 'COUNT', value: 1 }),
        item({ itemId: 'I-ZN', selector: 'noun=zone', requirement: 'COUNT', value: 1 }),
    ])
    const result: any = runStages0to5(input([c]))
    assert.equal(result.derived.lines.get('c:C-1:I-CH::S3').entailing[0].value, 'channel')
    assert.equal(result.derived.lines.get('c:C-1:I-ZN::S3').entailing[0].value, 'zone', 'each element carries its own selector, never the other’s')
}

// ---------------------------------------------------------------------------------------------

const TESTS: [string, () => void][] = [
    ['an authored EQUALS item entails', testAuthoredEqualsEntails],
    ['SD-92: an establishing selector fixes the value where nothing entails', testSelectorFixesTheValueWhereNothingEntails],
    ['SD-92: it does not compete with an item that entails the field', testAnItemOnTheRowIsNotCompetedWith],
    ['SD-92: ∋ establishes membership without defining the set', testMembershipDoesNotDefineTheSet],
    ['SD-92: ∈ narrows and fixes nothing', testInNarrowsAndFixesNothing],
    ['SD-92: the carry reaches only its own element', testTheCarryReachesOnlyItsOwnElement],
    ['an assumed item bounds but never entails', testAssumedItemBoundsButNeverEntails],
    ['engine wording supports nothing', testEngineWordingSupportsNothing],
    ['a typical example is inert', testTypicalExampleIsInert],
    ['open where the choice space is supported', testOpenWhereTheChoiceSpaceIsSupported],
    ['absence of knowledge does not produce open', testAbsenceOfKnowledgeDoesNotProduceOpen],
    ['entailment closes openness', testEntailmentClosesOpenness],
    ['undeclared silence bars openness', testUndeclaredSilenceBarsOpenness],
    ['no open line carries a value', testNoOpenLineCarriesAValue],
    ['an undetermined reach derives nothing and reports', testUndeterminedReachDerivesNothingAndReports],
    ['a contradicted selector does not reach', testContradictedSelectorDoesNotReach],
    ['an empty own-involvement scope keeps the declaration', testOwnInvolvementEmptyKeepsTheDeclaration],
    ['SD-93: own involvement includes its own established classes', testOwnInvolvementIncludesItsOwnEstablishedClasses],
    ['SD-93: own involvement still reaches no other contract', testOwnInvolvementDoesNotReachAnotherContract],
    ['deterministic across stages 3-5', testDeterministicAcrossStages345],
    ['a refused contract derives nothing', testRefusedContractDerivesNothing],
    ['no divergence is claimed falsely', testNoDivergenceIsClaimedFalsely],
    ['SD-91: a conditional standing decision fires on a resolved governing value', testConditionalDecisionFiresOnAResolvedGoverningValue],
    ['SD-91: and does not fire without one', testConditionalDecisionDoesNotFireWithoutAGoverningValue],
    ['SD-91: evaluation never supplies or modifies the governing value', testConditionalEvaluationDoesNotTouchTheGoverningValue],
    ['SD-91: the corpus result is unchanged', testConditionalDecisionsChangeNothingInTheCorpus],
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
    console.error(`derivation increment 2: ${failed} of ${TESTS.length} failed`)
    process.exit(1)
}
console.log(`derivation increment 2: ${TESTS.length} passed`)
