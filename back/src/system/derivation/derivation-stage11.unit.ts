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

import { corpusInput, loadRegister, loadCorpusContracts, repairTally } from './corpus'
import { repairEncoding } from './corpus-repair'
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

test('phase A repairs encoding only — every remaining refusal needs a semantic decision', () => {
    const result: any = runStages0to10(corpusInput())
    for (const refusal of result.failures.filter((f: any) => f.kind === 'LOAD_REFUSAL')) {
        assert.ok(
            /row is not a register row id|no declared operation/.test(String(refusal.detailRef)),
            `a refusal phase A should have fixed: ${refusal.detailRef}`,
        )
    }
    assert.equal(result.run.counts.contractsAdmitted, 3, 'encoding repair alone admits three contracts')
    assert.equal(result.run.counts.contractsRefused, 5, 'and five still need his ruling')
})

console.log(`\n${passed} assertions passed — increment 5\n`)
