/**
 * Derivation engine — increment 5 (stage 11: emit), and his rulings of 23 September.
 *
 * The rules under test:
 *   - SD-30, the stamp: "an unstamped result asserts nothing" — so it is not emitted as a result;
 *   - §1.4 field presence: no field is assembled outside the condition that licenses it;
 *   - SD-50, an unsupported choice space is a GAP, not an OPEN and not a refusal;
 *   - SD-51, no member identity is created from membership that is open, failed or gapped;
 *   - SD-49, reach against a class is three-valued and the indeterminate case derives nothing.
 *
 * Run: npm test
 */
import assert from 'node:assert/strict'

import { corpusInput, loadRegister, loadCorpusContracts, repairTally, restatementTally } from './corpus'
import { repairEncoding } from './corpus-repair'
import { NO_ROW_RESTATEMENTS } from './corpus-restatement'
import { runDerivation, runStages0to10 } from './engine'
import { isStampedHalt } from './emit'
import { ContractItem, DerivationInput, LoadedContract } from './types'

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
    return { contractId: 'C-1', objectId: 'O-1', knowledgeVersion: '1', items, declarations: [], ...overrides }
}

function input(contracts: LoadedContract[], register: any = REGISTER): DerivationInput {
    return {
        selection: contracts.map(c => ({ objectId: c.objectId, knowledgeVersion: '1' })),
        contracts,
        envelope: { players: 12, lengthM: 40, widthM: 30, durationMin: 20 },
        register,
        derivationRules: { version: 'rev-5' },
    }
}

let passed = 0
function test(name: string, body: () => void): void {
    body()
    passed++
    console.log(`  ok  ${name}`)
}

console.log('derivation increment 5 — stage 11, emit')

// ---------------------------------------------------------------------------------------------
// SD-30 — the stamp.
// ---------------------------------------------------------------------------------------------

test('a result that cannot be stamped is emitted as a stamped halt, never as a result', () => {
    const unversioned = JSON.parse(JSON.stringify(REGISTER))
    delete unversioned.version
    const result = runDerivation(input([contract([item()])], unversioned))
    assert.ok(isStampedHalt(result), 'an unstamped result asserts nothing')
    assert.equal(result.versions, null)
    assert.equal(result.run.halted, true)
    assert.ok(result.refusals.length > 0, 'the halt says why')
    assert.deepEqual(result.resolution, [], 'and asserts no resolution')
})

test('a stamped result carries every version the run depended on', () => {
    const result = runDerivation(input([contract([item()])]))
    assert.ok(!isStampedHalt(result))
    if (isStampedHalt(result)) return
    assert.ok(result.versions.register)
    assert.ok(result.versions.derivation)
    assert.ok(result.versions.engine)
    assert.ok(Object.keys(result.versions.vocabularies).length > 0, 'each vocabulary versioned separately')
    assert.equal(result.versions.contracts.length, 1)
})

// ---------------------------------------------------------------------------------------------
// §1.4 — a field only where its condition licenses it.
// ---------------------------------------------------------------------------------------------

test('no entry carries a field outside the condition that licenses it', () => {
    const result = runDerivation(corpusInput())
    assert.ok(!isStampedHalt(result))
    if (isStampedHalt(result)) return

    for (const entry of result.resolution) {
        if (entry.lineState !== 'ENUMERATED') {
            assert.equal(entry.state, undefined, `${entry.lineId}: only an ENUMERATED line carries a state`)
        }
        if (entry.state !== 'derived') {
            assert.equal(entry.value, undefined, `${entry.lineId}: value only where derived`)
            assert.equal(entry.resolvedBy, undefined, `${entry.lineId}: resolvedBy only where derived`)
            assert.deepEqual(entry.support, [], `${entry.lineId}: support is [] unless derived`)
        } else {
            assert.notEqual(entry.value, undefined, `${entry.lineId}: a derived line must carry a value`)
            assert.ok(entry.resolvedBy, `${entry.lineId}: a derived line names how it resolved`)
            assert.ok(entry.support.length > 0, `${entry.lineId}: a derived line names its support`)
        }
        if (entry.state !== 'open') {
            assert.equal(entry.bounds, undefined, `${entry.lineId}: bounds only where open`)
            assert.equal(entry.permittedBy, undefined, `${entry.lineId}: permittedBy only where open`)
        }
        if (entry.verdict !== 'NOT_AUTHORED') {
            assert.equal(entry.reason, undefined, `${entry.lineId}: reason only on NOT_AUTHORED`)
        }
        if (entry.lineState !== 'CONDITIONAL') {
            assert.equal(entry.conditionalOn, undefined, `${entry.lineId}: conditionalOn only where CONDITIONAL`)
        }
    }
})

test('every failed line is traceable to the failure record that failed it', () => {
    const result = runDerivation(corpusInput())
    if (isStampedHalt(result)) return
    const failed = result.resolution.filter(e => e.state === 'failed')
    assert.ok(failed.length > 0, 'this corpus does have failed lines')
    for (const entry of failed) {
        assert.ok(entry.failureIds && entry.failureIds.length > 0, `${entry.lineId} is failed but names no failure record`)
    }
})

test('the audit counts every admitted item and drops none', () => {
    const result = runDerivation(corpusInput())
    if (isStampedHalt(result)) return
    const staged: any = runStages0to10(corpusInput())
    assert.equal(result.audit.items.length, staged.forward.length)
    assert.equal(result.audit.properties.length, result.resolution.length)
})

test('tensions are unrepresentable (SD-27) and no gate can read one', () => {
    const result = runDerivation(corpusInput())
    if (isStampedHalt(result)) return
    assert.deepEqual(result.audit.tensions, [])
})

test('candidate is null in derivation mode, not an empty check list standing in for a check', () => {
    const result = runDerivation(corpusInput())
    if (isStampedHalt(result)) return
    assert.equal(result.candidate, null)
    assert.equal(result.gates.gateBReverse.verdict, 'NOT_APPLICABLE')
})

test('the emitted result is byte-identical for shuffled input (§8)', () => {
    const items = [
        item({ itemId: 'A', row: 'S2', selector: 'noun=channel', requirement: 'EXISTS' }),
        item({ itemId: 'B', row: 'S4', selector: 'noun=channel', requirement: 'EQUALS', value: 'access' }),
        item({ itemId: 'C', row: 'O1', selector: 'kind=ball', requirement: 'EXISTS' }),
    ]
    const forward = runDerivation(input([contract(items)]))
    const reversed = runDerivation(input([contract([...items].reverse())]))
    assert.equal(JSON.stringify(forward), JSON.stringify(reversed))
})

// ---------------------------------------------------------------------------------------------
// SD-50 — an unsupported choice space is a GAP.
// ---------------------------------------------------------------------------------------------

test('SD-50: a supported existence with an unsupported choice space is a GAP, not OPEN', () => {
    const result: any = runStages0to10(input([contract([item()])]))
    // No line may be open whose choice space the register bounds by authored values with none authored.
    const open = [...result.classified.values()].filter((l: any) => l.verdict && l.verdict.startsWith('FREE'))
    for (const line of open) {
        const record = result.derived.lines.get(line.lineId)
        assert.ok(record.open, `${line.lineId} is FREE but carries no authority`)
    }
    // And the question that used to be carried as unresolved is settled.
    assert.equal(
        result.stopped.filter((s: any) => /Whether it should instead refuse/.test(s.why)).length,
        0,
        'SD-50 settled it: a GAP, not a refusal',
    )
})

// ---------------------------------------------------------------------------------------------
// SD-51 — no member identity from unresolved membership.
// ---------------------------------------------------------------------------------------------

test('SD-51: a set-valued row with gapped membership materializes no member lines', () => {
    const result: any = runStages0to10(input([contract([item()])]))
    const s4 = [...result.classified.values()].find((l: any) => /::S4$/.test(l.lineId)) as any
    assert.ok(s4, 'the membership line itself is enumerated')
    assert.equal(s4.verdict, 'NOT_AUTHORED', 'nothing authored the function set')
    const members = [...result.classified.keys()].filter((id: string) => /::S4::/.test(id))
    assert.deepEqual(members, [], 'gapped membership authorizes no member identities')
})

test('SD-51: member lines are materialized from an authoritatively resolved member set', () => {
    const contracts = [
        contract([
            item({ itemId: 'R-1', row: 'S2', selector: 'noun=channel', requirement: 'EXISTS' }),
            item({ itemId: 'R-2', row: 'S4', selector: 'noun=channel', requirement: 'EQUALS', value: '{access,trigger}' }),
        ]),
    ]
    const result: any = runStages0to10(input(contracts))
    const members = [...result.classified.keys()].filter((id: string) => /::S4::/.test(id)).sort()
    assert.equal(members.length, 2, `expected two member lines, got ${JSON.stringify(members)}`)
    assert.ok(members[0].endsWith('::access'))
    assert.ok(members[1].endsWith('::trigger'))
    for (const id of members) assert.equal(result.classified.get(id).verdict, 'RESOLVED:ENTAILED')
})

test('SD-51: a resolved value that is not an enumerable member set yields no members', () => {
    const contracts = [
        contract([
            item({ itemId: 'R-1', row: 'S2', selector: 'noun=channel', requirement: 'EXISTS' }),
            item({ itemId: 'R-2', row: 'S4', selector: 'noun=channel', requirement: 'EQUALS', value: 'whatever the coach decides on the day' }),
        ]),
    ]
    const result: any = runStages0to10(input(contracts))
    const members = [...result.classified.keys()].filter((id: string) => /::S4::/.test(id))
    assert.deepEqual(members, [], 'prose is not a member set; SD-32 forbids meaning matching')
    assert.ok(result.run.counts.memberSetsUnresolved > 0, 'and the case is counted rather than passed over')
})

// ---------------------------------------------------------------------------------------------
// SD-49 — reach against a class.
// ---------------------------------------------------------------------------------------------

test('SD-49: an indeterminate reach derives nothing and is recorded', () => {
    const contracts = [
        contract([
            // The class fixes `noun`; the item selects on `lateral`, which the class leaves open.
            item({ itemId: 'R-1', row: 'S2', selector: 'noun=channel', requirement: 'EXISTS' }),
            item({ itemId: 'R-2', row: 'S3', selector: 'lateral=left', requirement: 'EQUALS', value: 'channel' }),
        ]),
    ]
    const result: any = runStages0to10(input(contracts))
    assert.ok(result.run.counts.undeterminedReaches > 0, 'the partially overlapping case is detected')
    const s3 = [...result.classified.values()].find((l: any) => /::S3$/.test(l.lineId)) as any
    assert.notEqual(s3.verdict, 'RESOLVED:ENTAILED', 'nothing is derived from an indeterminate application')
    const record = result.derived.lines.get(s3.lineId)
    assert.equal(record.entailing.length, 0)
    assert.ok(record.undetermined.length > 0, 'and it is recorded rather than rounded to false')
})

// ---------------------------------------------------------------------------------------------
// Corpus repair, phase A — encoding only. It restores authored text and decides nothing.
// ---------------------------------------------------------------------------------------------

test('the encoding repair is the exact inverse of the corruption, not a character list', () => {
    // Each of these is a UTF-8 sequence that was read as CP1252. None is special-cased in the code.
    assert.equal(repairEncoding('a â€” b'), 'a — b')
    assert.equal(repairEncoding('Â§1'), '§1')
    assert.equal(repairEncoding('x â‰¥ 2'), 'x ≥ 2')
    assert.equal(repairEncoding('p â†’ q'), 'p → q')
})

test('anything that is not this defect is left exactly as it was', () => {
    assert.equal(repairEncoding('plain ascii'), null)
    assert.equal(repairEncoding('already — correct'), null, 'a real em dash is not re-repaired')
    assert.equal(repairEncoding('café'), null, 'a legitimate Latin-1 character is not touched')
    assert.equal(repairEncoding(''), null)
})

test('the repair restores authored text and changes no structure', () => {
    const contracts = loadCorpusContracts()
    assert.ok(repairTally.strings > 0, 'the corpus does carry the defect')
    const text = JSON.stringify(contracts)
    assert.ok(!text.includes('â€”'), 'no mojibake em dash survives')
    assert.ok(!text.includes('Â§'), 'no mojibake section sign survives')
    assert.ok(text.includes('—'), 'the authored em dashes are back')
})

/**
 * Phase A's boundary, in his words: a contract either loads from mechanically- or
 * restatement-corrected authored knowledge, **or** has a specific unresolved semantic issue that
 * deliberately prevents it. This test is the boundary — every remaining refusal must be one of the
 * three known semantic issues, and a new kind of refusal appearing here is a finding, not a failure.
 */
test('the Phase A load boundary is reached: every contract loads, none refuses', () => {
    const result: any = runStages0to10(corpusInput())
    const refusals = result.failures.filter((f: any) => f.kind === 'LOAD_REFUSAL')
    assert.deepEqual(
        refusals.map((f: any) => `${f.locus.contractId}: ${f.detailRef}`),
        [],
        'after the ruled repairs no contract refuses at load',
    )
    assert.equal(result.run.counts.contractsAdmitted, 8)
    assert.equal(result.run.counts.contractsRefused, 0)
})

test('the ruled restatements each land, and nothing named in a ruling goes missing', () => {
    loadCorpusContracts()
    assert.equal(restatementTally.applied, 20, 'the twenty NO_ROW items')
    assert.deepEqual(restatementTally.withheld, [], 'none was named but disqualified')
    assert.equal(restatementTally.itemsRestated, 11, 'six Phase A rulings, plus the five sets made machine-readable (SD-79)')
    assert.equal(restatementTally.itemsRemoved, 2, 'WIDEZONE-13.a and 13.b')
    assert.equal(restatementTally.itemsAdded, 2, 'the recovered GF4 operation, and the traced neutral existence')
    assert.equal(restatementTally.declarationScopes, 64)
    assert.deepEqual(restatementTally.notFound, [], 'every item a ruling names was found')
})

/**
 * SD-75 — negative existence. The risk he named: the treatment must not pull inside the structural
 * boundary anything his ruling placed outside it.
 */
test('SD-75: negative existence is satisfied, unmet or not evaluable — and never reaches outside items', () => {
    const result: any = runStages0to10(corpusInput())
    const notExists = loadCorpusContracts().flatMap(c => c.items.filter(i => i.requirement === 'NOT_EXISTS').map(i => ({ c: c.contractId, i: i as any })))
    assert.equal(notExists.length, 9, 'the corpus-wide population')

    let outside = 0
    for (const { c, i } of notExists) {
        const outcome = result.forward.find((f: any) => f.item.contractId === c && f.item.itemId === i.itemId)
        if (i.checkability === 'OUTSIDE_BOUNDARY') {
            outside++
            assert.equal(
                outcome.result,
                'NOT_CHECKABLE_OUTSIDE_REPRESENTATION',
                `${i.itemId} is outside the representation and must stay there`,
            )
        } else {
            assert.ok(['SATISFIED', 'UNMET', 'NOT_EVALUABLE'].includes(outcome.result), `${i.itemId} gave ${outcome.result}`)
        }
    }
    assert.equal(outside, 7, 'all seven outside-the-representation cases are still outside')

    // The structural pair, each behaving as the ruling states.
    const excluded = result.forward.find((f: any) => f.item.itemId === 'GF2-22')
    assert.equal(excluded.result, 'SATISFIED', 'no action restriction is represented, so the exclusion holds')
})

test('SD-75: negative existence is unmet when a matching element does exist', () => {
    const contracts = [
        contract([
            item({ itemId: 'R-1', row: 'S2', selector: 'noun=channel', requirement: 'EXISTS' }),
            item({ itemId: 'X-1', row: 'S2', selector: 'noun=channel', requirement: 'NOT_EXISTS', value: 'no channel' }),
        ]),
    ]
    const result: any = runStages0to10(input(contracts))
    const outcome = result.forward.find((f: any) => f.item.itemId === 'X-1')
    assert.equal(outcome.result, 'UNMET')
    assert.ok(outcome.reach.length > 0, 'and it names the element that contradicts it')
})

test('SD-76: neutral existence is independently supported, so the property has an element', () => {
    const result: any = runStages0to10(corpusInput())
    const existence = result.forward.find((f: any) => f.item.itemId === 'NEUTRAL-01.b')
    assert.ok(existence, 'the traced existence contribution is present')
    assert.equal(existence.result, 'SATISFIED', 'it establishes the neutral participant group')

    const property = result.forward.find((f: any) => f.item.itemId === 'NEUTRAL-05.a')
    assert.equal(property.result, 'SATISFIED', 'and the participation-state property now reaches its element')

    // The existence rests on its own source, not on the property that needed it.
    const item01b = loadCorpusContracts()
        .find(c => c.contractId === 'restated:NEUTRAL-PLAYER-CONDITION')!
        .items.find(i => i.itemId === 'NEUTRAL-01.b') as any
    assert.equal(item01b.origId, 'NEUTRAL-01', 'traced to the count contribution, not to NEUTRAL-05')
    assert.ok(/One or more neutral players/.test(String(item01b.basisEvidence)), 'the source is visible on the item')
})

// ---------------------------------------------------------------------------------------------
// SD-78/SD-80 — composing narrowings. A set of permitted alternatives is never a resolved value.
// ---------------------------------------------------------------------------------------------

const narrowing = (itemId: string, members: string[], row = 'V1') =>
    item({ itemId, row, selector: '*', requirement: 'EQUALS', value: members as any, valueStatus: 'REQUIRED_RANGE', strictness: 'REQUIRED' })

/**
 * **The regression he asked for by name.** A single `REQUIRED_RANGE` set reaching a line must not be
 * emitted as that line's resolved value. This is the silent half of the defect — a wrong answer wearing
 * the label of a right one — and it is worse than the visible collision that led us to it.
 */
test('SD-80: one set-valued contribution does NOT resolve the line to the set', () => {
    const result = runDerivation(input([contract([narrowing('N-1', ['zone', 'line'])])]))
    if (isStampedHalt(result)) return assert.fail('unexpected halt')
    const line = result.resolution.find(e => e.lineId === 'game::V1')!
    assert.equal(line.verdict, 'FREE(choice)', 'two permitted alternatives are a downstream choice, not a value')
    assert.equal(line.value, undefined, 'and a free line carries no value at all')
    assert.notDeepEqual(line.value, ['zone', 'line'], 'the permitted set is never the value')
})

test('SD-80: no resolved line anywhere ever holds a set as its value', () => {
    for (const source of [corpusInput(), input([contract([narrowing('N-1', ['a', 'b'])])])]) {
        const result = runDerivation(source)
        if (isStampedHalt(result)) continue
        for (const entry of result.resolution) {
            if (entry.state !== 'derived') continue
            assert.ok(!Array.isArray(entry.value), `${entry.lineId} is derived while holding a set: ${JSON.stringify(entry.value)}`)
        }
    }
})

test('SD-78: narrowings that intersect to one member resolve, keeping every contributor as support', () => {
    const contracts = [
        contract([narrowing('A-1', ['goal', 'line_crossed'])], { contractId: 'C-A', objectId: 'O-A' }),
        contract([narrowing('B-1', ['line_crossed', 'target_zone_entered'])], { contractId: 'C-B', objectId: 'O-B' }),
        contract([narrowing('C-1', ['line_crossed', 'target_zone_entered', 'gate'])], { contractId: 'C-C', objectId: 'O-C' }),
    ]
    const result = runDerivation(input(contracts))
    if (isStampedHalt(result)) return assert.fail('unexpected halt')
    const line = result.resolution.find(e => e.lineId === 'game::V1')!
    assert.equal(line.verdict, 'RESOLVED:ENTAILED')
    assert.equal(line.value, 'line_crossed', 'the one member all three permit')
    assert.equal(line.support.length, 3, 'every contributing narrowing is retained as support')
    assert.equal(result.failures.filter(f => f.kind === 'COLLISION').length, 0, 'converging narrowings are not a collision')
})

test('SD-78: an intersection with several members is FREE(choice), and order does not narrow it', () => {
    const contracts = [
        // The first carries an authored order. RC-29 keeps it and does not apply it.
        contract([{ ...narrowing('A-1', ['gate', 'line_crossed', 'target_zone_entered']), authoredOrder: true } as any], { contractId: 'C-A', objectId: 'O-A' }),
        contract([narrowing('B-1', ['line_crossed', 'target_zone_entered'])], { contractId: 'C-B', objectId: 'O-B' }),
    ]
    const result = runDerivation(input(contracts))
    if (isStampedHalt(result)) return assert.fail('unexpected halt')
    const line = result.resolution.find(e => e.lineId === 'game::V1')!
    assert.equal(line.verdict, 'FREE(choice)', 'two members survive, so the choice is real')
    assert.equal(line.value, undefined, 'and the authored order does not pick one (RC-29 unresolved)')
})

test('SD-78: narrowings that exclude each other are a genuine collision, contributors preserved', () => {
    const contracts = [
        contract([narrowing('A-1', ['goal'])], { contractId: 'C-A', objectId: 'O-A' }),
        contract([narrowing('B-1', ['target_zone_entered'])], { contractId: 'C-B', objectId: 'O-B' }),
    ]
    const result: any = runStages0to10(input(contracts))
    const line = result.classified.get('game::V1')
    assert.equal(line.verdict, 'UNRESOLVED', 'an empty intersection is a real disagreement')
    assert.equal(line.collidingItems.length, 2, 'and both contributing narrowings are preserved')
})

test('SD-78: a REQUIRED_RANGE carrying a scalar still fixes what it states', () => {
    const scalar = item({ itemId: 'S-1', row: 'V1', selector: '*', requirement: 'EQUALS', value: 'line_crossed', valueStatus: 'REQUIRED_RANGE' })
    const result = runDerivation(input([contract([scalar])]))
    if (isStampedHalt(result)) return assert.fail('unexpected halt')
    const line = result.resolution.find(e => e.lineId === 'game::V1')!
    assert.equal(line.verdict, 'RESOLVED:ENTAILED', 'the narrowing rule is triggered by a set, not by the status alone')
    assert.equal(line.value, 'line_crossed')
})

/**
 * His acceptance condition for cluster 1: the emitted diagnostic and the cluster evidence must agree on
 * `game::V1`, proven **through final assembly** rather than during derivation.
 *
 * The discrepancy that prompted this was not a lost value. Four places independently answered "how does
 * a derived line get its value"; SD-78 added a route and the gate's own valueless invariant was the one
 * not told. All four now ask a single resolver, and the two tests below hold that from both ends.
 */
test('game::V1 carries line_crossed through final assembly, not merely during derivation', () => {
    const emitted = runDerivation(corpusInput())
    if (isStampedHalt(emitted)) return assert.fail('unexpected halt')

    const entry = emitted.resolution.find(e => e.lineId === 'game::V1')!
    assert.equal(entry.verdict, 'RESOLVED:ENTAILED')
    assert.equal(entry.state, 'derived')
    assert.equal(entry.value, 'line_crossed', 'the value survives to the emitted result')
    assert.equal(entry.support.length, 3, 'with all three narrowings retained as support')

    // The audit view of the same line must agree with the resolution view.
    const property = emitted.audit.properties.find(p => p.lineId === 'game::V1')!
    assert.equal(property.sources.length, 3)
    assert.equal(property.collisionId, null, 'and it is not recorded as a collision anywhere')

    // And the gate must not contradict either of them.
    assert.deepEqual(
        emitted.stopped.filter(s => /carry no value/.test(s.why)),
        [],
        'the gate agrees the line carries a value',
    )
})

test('no line is reported derived-with-a-value by one view and valueless by another', () => {
    for (const source of [corpusInput(), input([contract([narrowing('N-1', ['only_member'])])])]) {
        const emitted = runDerivation(source)
        if (isStampedHalt(emitted)) continue

        // Every line the emitted result gives a value to must be absent from the gate's valueless stop,
        // and every line it leaves without one must not claim to be derived. This is the cross-check
        // that would have caught the drift, so it is asserted rather than left to inspection.
        const withValue = emitted.resolution.filter(e => e.state === 'derived').map(e => e.lineId)
        const flagged = emitted.stopped
            .filter(s => /carry no value/.test(s.why))
            .flatMap(s => withValue.filter(lineId => s.why.includes(lineId)))
        assert.deepEqual(flagged, [], `the two views disagree about: ${flagged.join(', ')}`)

        for (const entry of emitted.resolution) {
            if (entry.state !== 'derived') continue
            assert.notEqual(entry.value, undefined, `${entry.lineId} is derived but carries no value`)
        }
    }
})

test('the corpus collision is gone, because it was never a collision', () => {
    const result = runDerivation(corpusInput())
    if (isStampedHalt(result)) return assert.fail('unexpected halt')
    assert.equal(result.failures.filter(f => f.kind === 'COLLISION').length, 0)
    const v1 = result.resolution.find(e => e.lineId === 'game::V1')!
    assert.equal(v1.value, 'line_crossed', 'three independently authored objects converge on one member')
    assert.equal(v1.support.length, 3)
})

test('BY_CONSTRUCTION is satisfied by its named invariant, not excused by it', () => {
    const result: any = runStages0to10(corpusInput())
    const outcome = result.forward.find((f: any) => f.item.itemId === 'GF2-01')
    assert.equal(outcome.result, 'SATISFIED', 'the schema entails the claim, so the claim is met')
    assert.ok(/SINGLE_RECTANGULAR_PLAYING_AREA/.test(outcome.why), 'and the invariant that entails it is named')
})

test('BY_CONSTRUCTION refuses an invariant that is absent, untestable, or does not hold', () => {
    const base = item({ itemId: 'BC-1', row: 'BY_CONSTRUCTION', requirement: 'EQUALS', value: 'x' })
    const refusalOf = (result: any) => String((result.failures.find((f: any) => f.kind === 'LOAD_REFUSAL') || {}).detailRef)

    assert.ok(/name a registered schema invariant/.test(refusalOf(runStages0to10(input([contract([base])])))), 'no invariant named')

    const wrong = runStages0to10(input([contract([{ ...base, satisfiedBy: 'NO_SUCH_INVARIANT' } as any])]))
    assert.ok(/name a registered schema invariant/.test(refusalOf(wrong)), 'an unregistered invariant')

    // An invariant whose test would not hold must refuse rather than be taken on trust.
    const broken = JSON.parse(JSON.stringify(REGISTER))
    broken.contractSentinels.BY_CONSTRUCTION.invariants.SINGLE_RECTANGULAR_PLAYING_AREA.test.fieldRowsPresent = ['E2', 'NOT_A_ROW']
    const failing = runStages0to10(input([contract([{ ...base, satisfiedBy: 'SINGLE_RECTANGULAR_PLAYING_AREA' } as any])], broken))
    assert.ok(/does not hold/.test(refusalOf(failing)), 'an invariant that does not hold')

    // And one that cannot be executed at all is not assumed true.
    const untestable = JSON.parse(JSON.stringify(REGISTER))
    untestable.contractSentinels.BY_CONSTRUCTION.invariants.SINGLE_RECTANGULAR_PLAYING_AREA.test = { somethingElse: true }
    const unexecutable = runStages0to10(input([contract([{ ...base, satisfiedBy: 'SINGLE_RECTANGULAR_PLAYING_AREA' } as any])], untestable))
    assert.ok(/cannot execute/.test(refusalOf(unexecutable)), 'an invariant this engine cannot test')
})

// ---------------------------------------------------------------------------------------------
// The NO_ROW contract sentinel. Its whole risk is becoming a way to bypass a structural claim.
// ---------------------------------------------------------------------------------------------

const noRowItem = (overrides: Partial<ContractItem> = {}) =>
    item({ itemId: 'N-1', row: 'NO_ROW', requirement: 'EXISTS', selector: '*', checkability: 'OUTSIDE_BOUNDARY', structuralClause: 'none', ...overrides })

test('NO_ROW is a contract sentinel, not a row: it creates no property, line, class or element', () => {
    const result: any = runStages0to10(input([contract([item(), noRowItem()])]))
    assert.equal(result.run.counts.contractsRefused, 0, 'a well-formed NO_ROW item loads')
    assert.equal(result.lines.filter((l: any) => l.row === 'NO_ROW').length, 0, 'no line')
    assert.equal(result.classes.filter((c: any) => c.row === 'NO_ROW').length, 0, 'no class')
    const outcome = result.forward.find((f: any) => f.item.itemId === 'N-1')
    assert.equal(outcome.result, 'NOT_CHECKABLE_OUTSIDE_REPRESENTATION', 'the established outside-representation treatment')
    assert.deepEqual(outcome.reach, [], 'it reaches nothing')
})

test('NO_ROW may not carry a structural claim — condition one is enforced, not trusted', () => {
    const result: any = runStages0to10(input([contract([noRowItem({ checkability: 'STRUCTURAL' })])]))
    const refusal = result.failures.find((f: any) => f.kind === 'LOAD_REFUSAL')
    assert.ok(refusal, 'a structural item may not hide behind the sentinel')
    assert.ok(/classified outside the representation/.test(String(refusal.detailRef)))
})

test('NO_ROW may not carry a structural requirement — condition two is enforced', () => {
    const result: any = runStages0to10(input([contract([noRowItem({ structuralClause: 'whole item' })])]))
    const refusal = result.failures.find((f: any) => f.kind === 'LOAD_REFUSAL')
    assert.ok(refusal, 'an item stating a structural requirement may not hide behind the sentinel')
    assert.ok(/carry no structural requirement/.test(String(refusal.detailRef)))
})

test('a sentinel may never collide with a register row id', () => {
    const colliding = JSON.parse(JSON.stringify(REGISTER))
    colliding.contractSentinels = { P1: { meaning: 'not allowed' } }
    const result = runDerivation(input([contract([item()])], colliding))
    assert.ok(isStampedHalt(result), 'the register itself is refused')
    assert.ok(/collides with a register row id/.test(String(result.refusals[0].cause)))
})

test('the twenty ruled restatements apply, and none is applied against its conditions', () => {
    loadCorpusContracts()
    assert.equal(restatementTally.applied, 20, 'exactly the twenty he ruled')
    assert.deepEqual(restatementTally.withheld, [], 'none was named but disqualified')
})

/**
 * The five structural items were never swept into the blanket NO_ROW list — each was ruled
 * individually, and two of them only *look* alike in their outcome. The guard that matters is that
 * none reached its treatment through the generic list.
 */
test('each of the five structural items got its own ruled treatment, not the blanket one', () => {
    const contracts = loadCorpusContracts()
    const rowOf = (contractId: string, itemId: string) =>
        String(contracts.find(c => c.contractId === contractId)!.items.find(i => i.itemId === itemId)!.row)

    assert.equal(rowOf('restated:GF2', 'GF2-01'), 'BY_CONSTRUCTION', 'satisfied by a named schema invariant')
    assert.equal(rowOf('restated:GF2', 'GF2-02'), 'NO_ROW', 'restated back to what its source supports')
    assert.equal(rowOf('restated:GF2', 'GF2-15'), 'NO_ROW', 'its structural typing retired')
    assert.equal(rowOf('restated:GF2', 'GF2-22'), 'R1', 'the new Action Restriction capability')
    assert.equal(rowOf('restated:NEUTRAL-PLAYER-CONDITION', 'NEUTRAL-05.a'), 'P12', 'Performer Participation State')

    for (const id of [
        'restated:GF2::GF2-01',
        'restated:GF2::GF2-02',
        'restated:GF2::GF2-15',
        'restated:GF2::GF2-22',
        'restated:NEUTRAL-PLAYER-CONDITION::NEUTRAL-05.a',
    ]) {
        assert.ok(!NO_ROW_RESTATEMENTS.has(id), `${id} must never reach its row through the blanket list`)
    }

    // No item anywhere still carries an unregistered no-row spelling.
    const leftover = contracts.flatMap(c => c.items.filter(i => ['NONE', '—'].includes(String(i.row))).map(i => `${c.contractId}::${i.itemId}`))
    assert.deepEqual(leftover, [])
})

console.log(`\n${passed} assertions passed — increment 5\n`)
