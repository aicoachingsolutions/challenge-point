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
    assert.equal(restatementTally.itemsRestated, 6)
    assert.equal(restatementTally.itemsRemoved, 2, 'WIDEZONE-13.a and 13.b')
    assert.equal(restatementTally.itemsAdded, 1, 'the recovered GF4 operation')
    assert.equal(restatementTally.declarationScopes, 64)
    assert.deepEqual(restatementTally.notFound, [], 'every item a ruling names was found')
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
