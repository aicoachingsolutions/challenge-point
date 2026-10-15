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

import { corpusInput, loadRegister, loadCorpusContracts, readJson, repairTally, restatementTally } from './corpus'
import { repairCorpusEncoding, repairEncoding } from './corpus-repair'
import { DECLARATION_ADDITIONS, NO_ROW_RESTATEMENTS, provenDisjointRefusal } from './corpus-restatement'
import { provablyDisjoint, reaches } from './reach'
import { parsePredicate, parseSelector } from './selector'
import { indexRegister } from './register'
import { assembleResolvedGame } from './resolved-game'
import { derivationInputFor } from './run-bounded-selection'
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
            // The subject row is `S5`, which no selector carries (SD-92), so the only thing that
            // could put a value on it is the item whose reach is indeterminate.
            item({ itemId: 'R-1', row: 'S2', selector: 'noun=channel', requirement: 'EXISTS' }),
            item({ itemId: 'R-2', row: 'S5', selector: 'lateral=left', requirement: 'EQUALS', value: 'the attacking end' }),
        ]),
    ]
    const result: any = runStages0to10(input(contracts))
    assert.ok(result.run.counts.undeterminedReaches > 0, 'the partially overlapping case is detected')
    const s3 = [...result.classified.values()].find((l: any) => /::S5$/.test(l.lineId)) as any
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
    // 45 -> 46 on 15 October 2026 (C51): RPC-001-13's statement of direction loses the engine wording "own-half start
    // area" (his reply received that day, item 9 point 10: "Remove unsupported "own-half start area" wording:
    // Approved."). Pinned in the C51 test below.
    // 55 -> 56 the same day (C54): RPC-001-18.d's referent recorded as the progression reference, distinct from the
    // initial pressure reference (his 9.1, "They are distinct relationships, even when they coincide spatially.").
    // 18.d also carries C52's scope, so it is one item with two rulings and counts once per ruling.
    // 46 -> 55 the same day (C52): the nine items of RPC-001's build-out condition (18.a-18.g, 19.a, 19.b) scoped
    // WHOLE_GAME -> BUILD_OUT_EPISODE, his 16 October 9.3: "Build-out condition applies only to build-out episodes:
    // Approved." Pinned in condition-scope.unit.ts.
    // 56 -> 57 on 15 October 2026 (stage K1, C57): his M8 safeguard recorded verbatim in RPC-001-19.b's fitNote — "Please
    // ensure this does not inadvertently prohibit a functional longer pass that is received under control beyond
    // pressure." — beside the exclusion it guards. 19.b also carries C52's scope: one item, two rulings, counted per ruling.
    assert.equal(
        restatementTally.itemsRestated,
        57,
        'six Phase A rulings, six sets (SD-79), two exclusion bounds (SD-86), eight goal-kick selectors (SD-87), one restart ownership (SD-89), ' +
            'one typed reference (SD-98), one Wide Zone gloss (C29a), one DISTINCT_ON mark (C29b/C29e), two typed neutral bounds (C29c), ' +
            'one typed channel width (C30b), one equal-outfield promotion (C31b), three Wide Zone lateral restatements (C33), ' +
            'three stale comparison claims corrected (C36a/b/c) — the fitNotes that still said no requirement kind compares two ' +
            'elements, which AM-16 made obsolete on 20 September; C31b carries the fourth, on the item it also types as a COMPARES — ' +
            "and ONE TYPED FORBIDDEN VALUE under the same SD-86 treatment (C40) — WIDEZONE-08.c's two wide channels, moved out of a prose value that the new forbidden-value check could not compare, which is what makes that exclusion violable at all — and two typed cardinalities under SD-86 — PCG-08's authored \"at least 2 teams\" (C37) and " +
            "RPC-001-14.a's authored \">=1\" (C38), both moved out of prose where the count reader could not see them, " +
            'and TWO SELECTOR SCOPINGS under ruling C42 of 9 October — GF2-12.a and GF2-08.b narrowed to the shared arrangement they were made ' +
            'about, so the shared target is preserved and inert while the directional one is active — ' +
            'and, from 44 on 14 October 2026, TWO of his answers about the Pass Combination Gate: PCG-11 typed to the gate’s own condition (C44, ' +
            '"the counting information refers to that gate’s own condition") and PCG-04 typed a preferred 4-6, SUPPORTING (C46, "a preferred range ' +
            'of 4–6, not a requirement or a predetermined starting count"). Neither approves the gate for a Learning Goal — ' +
            'and, from 45 the same day, his bibs ruling (C47): NEUTRAL-06.b, the authored means, marked SUPPORTING ("Contrasting bibs should be ' +
            'treated as a practical recommendation for distinguishing neutrals, not a universal requirement"); its value stays a preferred default — ' +
            'and, from 46 on 15 October 2026, RPC-001-13 without "own-half start area" (C51, his 9.10) — ' +
            'and, from 55 the same day, the nine build-out condition items scoped to the build-out episode (C52, his 9.3) — ' +
            'and, from 56, RPC-001-18.d recorded as the progression reference, distinct from the pressure reference (C54, his 9.1) — ' +
            'and, from 57, his M8 safeguard beside the long-clearance exclusion, RPC-001-19.b (C57)',
    )
    // **4 since ruling C42.** GF2-08.a and GF2-03.a are retired — the shared objective's existence and the
    // target it referenced — so the game holds exactly two objectives and two targets rather than three of each.
    // Both items stay in contracts.json verbatim, with the 28 September decision beside them.
    //
    // **6 since ruling C45 of 14 October 2026.** PCG-06 (the gate condition's place, "own half of ATTACKING_TEAM")
    // and PCG-07 (the per-team half it needed) are removed from the active gate knowledge, his words: *"Record this
    // as removed from the active gate knowledge, retaining the original for provenance."* Both stay verbatim in
    // contracts.json.
    //
    // **20 since ruling C51 of 15 October 2026.** Twelve RPC-001 items whose basis is ENGINE_ONLY (04.a, 04.b, 04.c,
    // 05.a, 05.b, 06, 09.a, 09.b, 16.a, 16.b, 16.c, 20 — implementation wording from the engine's own coach rules,
    // in no workbook) are retired as cleanup, his reply of that day, item 8: *"Cleanup that removes redundant or
    // superseded implementation language ... can proceed as proposed."* — and the context's separate scoring
    // objective with its target reference (11.a, 08.c), his 9.5: *"Retire the redundant separate scoring objective:
    // Approved, provided the live attacking objective remains represented."* All fourteen stay verbatim in
    // contracts.json ("Please preserve provenance for the retired engine-authored wording ...").
    //
    // **22 since ruling C53, the same day.** RPC-001-02 and RPC-001-03 — exactly one goalkeeper on every build-out
    // team and on every attacking team — stop being universal, his 9.4: *"Goalkeeper-or-controlled-restart
    // alternative: Approved."* (our change 4, "applying where the activity includes a goalkeeper, not as a
    // requirement on every team"). Both stay verbatim in contracts.json; the roster consequence is pinned in
    // activity-review.unit.ts.
    assert.equal(restatementTally.itemsRemoved, 22, 'WIDEZONE-13.a and 13.b, GF2-08.a and GF2-03.a (C42), PCG-06 and PCG-07 (C45), fourteen RPC-001 items (C51), and RPC-001-02 and -03 (C53)')
    // 23 -> 25 on 15 October 2026 (stage K1, C57): the referents of RPC-001's control condition and long-clearance
    // exclusion, RPC-001-18.h and 19.c, typed as the objective reference of the scoring team — his M8, 17 October:
    // "Apply the qualifying conditions to the target and scoring episode actually being evaluated." Pinned in
    // typed-referent.unit.ts.
    assert.equal(
        restatementTally.itemsAdded,
        25,
        'the recovered GF4 operation, the traced neutral existence, SD-102’s canonical shared objective, the five connected-pass IE dimensions (C29d), ' +
            'the three Wide Zone value-modifier items — existence, magnitude 2 and MULTIPLY (C34) — and its second typed referent (C35), ' +
            'and the required channel extent as a proportion (C31a), ' +
            "and the Pass Combination Gate's information-rule trigger, COMPLETED_PASS (C39) — the row his 29 September " +
            'reveal ruling left unauthored while it filled the five dimensions beside it, ' +
            "and the two halves of the Wide Zone qualifying interaction (C40) — the criterion that satisfies the condition on V8c and the " +
            'POSSESSION_CHANGE that ends the modification on V8d, kept as two items because he instructed that criterion and persistence not be ' +
            'compressed into one field, ' +
            'and the SIX items of the directional arrangement under ruling C42 of 9 October: two target regions told apart by the new ' +
            'along-axis selector attribute, two per-team objectives whose selectors also constitute the team that attacks each, and the ' +
            'two typed references pairing each team with the target at the opposite end, ' +
            'and, from 23 on 14 October 2026, his allegiance ruling as ONE item (C43): NEUTRAL-14.c, P6c = IMMEDIATE, on the new register row ' +
            '(version 7) — "Please add the explicit property governing when a neutral player changes allegiance, using immediate switching ' +
            'upon possession change as the approved behavior for the current mechanism" — ' +
            'and, from 25 on 15 October 2026, the two typed referents of his M8 (C57): RPC-001-18.h and RPC-001-19.c',
    )
    assert.equal(restatementTally.declarationScopes, 64)
    // **New on 14 October 2026, counted apart from scopes.** The gate's V5 and SV1 declarations CLAIMED those rows
    // on the strength of PCG-06 and PCG-07; with the items removed (C45) the claims are restated, or they would
    // assert a place and a half that nobody now authors. SV1 is NON_CLAIMED. V5 was NON_CLAIMED until his reply
    // received 15 October 2026 (16 October, item 8: "removing 'in their half' should not automatically be
    // interpreted as authorizing pass counting anywhere"), and is NOT_AUTHORED since (C45/C49, amended in place, so
    // it still counts once).
    //
    // **2 -> 6 on 15 October 2026 (C50).** His Option A, item 8 of the same reply — "I approve your recommended
    // Option A for the four identified statements" — marks GF2's four NOT_AUTHORED declarations on V3, V4, V5 and V6
    // as deferring to the establishing object. A deferral is a declaration restatement that keeps its kind, so each
    // counts here; which four, and that no other declaration defers, is pinned in governing-declarations.unit.ts.
    //
    // **6 -> 15 on 15 October 2026 (C51).** Nine RPC-001 declarations CLAIMED a row on the strength of items C51
    // retires and nothing else (SV1, P4, P8, P10, S5, O4, J2, V2, T4); each is restated beside the retirement, as C45
    // did for the gate. Which kind each became, and that no line or gate verdict moved, is pinned in the C51 test below.
    // **16 since C53, the same day**: RPC-001's P3 claim cited only 02 and 03, so it is restated NON_CLAIMED beside them.
    assert.equal(restatementTally.declarationsRestated, 16, 'the gate’s V5 and SV1 claims (C45, V5 corrected by C49), GF2’s four deferring V3-V6 gaps (C50), nine RPC-001 claims on retired items (C51), and its P3 claim (C53)')
    // **New on 14 October 2026 (C48), counted apart from both.** Register row P6c was added that day (C43) after
    // every contract was written, so none declared it and every game without neutrals read it as "no coverage" —
    // nobody looked. The seven contracts that declare P6a NON_CLAIMED get the same declaration on P6c; the Neutral
    // Player Condition, which authors P6c through C43, gets none. Which seven is checked from the data below, not
    // pinned here.
    assert.equal(restatementTally.declarationsAdded, 7, 'P6c NON_CLAIMED, beside P6a NON_CLAIMED, on the seven contracts that declare it (C48)')
    // **New on 15 October 2026 (stage K1), counted apart from C48's.** His M6 (17 October): "I approve the narrow
    // authority exception where the added statement provably cannot contradict existing knowledge." One addition joins a
    // row its contract already declares, under that exception: RPC-001's origin needs no further value (C55, his 9.9).
    // The proof and each refusal it gives are pinned in the M6 tests below.
    assert.equal(restatementTally.declarationsAddedOnDeclaredRows, 1, 'RPC-001 V6 NON_CLAIMED NO_FURTHER_VALUE type=origin (C55)')
    assert.deepEqual(restatementTally.notFound, [], 'every item a ruling names was found')

    // A01-02-05.a is the first item two rulings touch: SD-87 set its selector, SD-89 its value and
    // basis. Both must survive. Keying one restatement per item would have let the later entry
    // replace the earlier one without a word, which is this project's costliest recurring failure.
    const goalKick: any = loadCorpusContracts()
        .find(c => c.contractId === 'restated:A01-02')!
        .items.find((i: any) => i.itemId === 'A01-02-05.a')
    assert.match(goalKick.selector, /qualifier\.lastTouch=ATTACKING_TEAM/, 'SD-87 selector kept')
    assert.equal(goalKick.value, 'DEFENDING_TEAM', 'SD-89 value applied')
    assert.equal(goalKick.basis, 'AUTHORED', 'SD-89 made the ownership authoritative; it was ASSUMED')
})

/**
 * C48, 14 October 2026 — the P6a declaration extended to the timing row added that day. Checked against the data
 * rather than a list written here, so a contract that gains or loses its P6a declaration moves this test with it.
 */
test('C48: P6c is declared exactly where P6a is declared NON_CLAIMED, as the same declaration, and nowhere in contracts.json', () => {
    const contracts = loadCorpusContracts()
    const extended: string[] = []
    for (const c of contracts) {
        const p6a = (c.declarations || []).filter((d: any) => d.row === 'P6a' && d.declaration === 'NON_CLAIMED')
        const p6c = (c.declarations || []).filter((d: any) => d.row === 'P6c')
        if (!p6a.length) {
            assert.deepEqual(p6c, [], `${c.contractId} does not declare P6a NON_CLAIMED, so it gains no P6c declaration`)
            continue
        }
        assert.deepEqual(p6c, p6a.map((d: any) => ({ ...d, row: 'P6c' })), `${c.contractId}: the same kind, selector, scope and note as its P6a declaration`)
        extended.push(c.contractId)
    }
    assert.equal(extended.length, restatementTally.declarationsAdded, 'every addition is one of these, and each is counted once')
    const neutral = contracts.find(c => c.contractId === 'restated:NEUTRAL-PLAYER-CONDITION')!
    assert.ok(!extended.includes(neutral.contractId) && neutral.items.some((i: any) => i.row === 'P6c'), 'the Neutral Player Condition authors P6c (C43) and is not given a declaration on it')
    // A restatement, not an edit: the authored file still declares the row nowhere.
    const raw = readJson('stage-b/contracts.json')
    const entries: any[] = Array.isArray(raw) ? raw : Object.values(raw)
    assert.ok(!entries.some(e => (e.result?.declarations || []).some((d: any) => d.row === 'P6c')), 'contracts.json is untouched')
})

test('C48: an added declaration is refused, and said, where the contract is missing or already declares the row', () => {
    const before = DECLARATION_ADDITIONS.length
    // The tally as the data leaves it, read before the refused additions go in. (Until stage K1 this was the length of
    // the additions list, which equalled it; since C55 one addition is counted apart, under his M6 exception.)
    loadCorpusContracts()
    const counted = restatementTally.declarationsAdded
    const declaration = { row: 'P6a', declaration: 'NON_CLAIMED', selector: '*', scope: 'WHOLE_GAME', note: 'test' }
    DECLARATION_ADDITIONS.push(
        { contractId: 'restated:GF2', declaration, ruling: 'TEST', why: 'GF2 already declares P6a' },
        { contractId: 'restated:NO-SUCH-CONTRACT', declaration, ruling: 'TEST', why: 'no such contract' },
    )
    try {
        const gf2 = loadCorpusContracts().find(c => c.contractId === 'restated:GF2')!
        assert.equal(restatementTally.declarationsAdded, counted, 'neither refused addition is counted')
        assert.equal(gf2.declarations.filter((d: any) => d.row === 'P6a').length, 1, 'the authored P6a declaration is not joined by a second account of the row')
        assert.equal(gf2.declarations.find((d: any) => d.row === 'P6a')!.note, 'doesNotConstrain: performers outside the two teams are neither authored nor forbidden.')
        assert.deepEqual(restatementTally.notFound, [
            'restated:GF2 undeclared row P6a (TEST): it already declares NON_CLAIMED, so nothing is added',
            'restated:NO-SUCH-CONTRACT (declaration addition TEST)',
        ])
    } finally {
        DECLARATION_ADDITIONS.splice(before)
        loadCorpusContracts()
    }
    assert.deepEqual(restatementTally.notFound, [], 'restored')
})

/**
 * ── His M6 exception (stage K1, 15 October 2026) ────────────────────────────────────────────────────────────
 *
 * His 17 October words: *"I approve the narrow authority exception where the added statement provably cannot
 * contradict existing knowledge."* C48's rule — an addition only on a row its contract has not declared — stays the
 * default; an addition that opts in (`onDeclaredRow: "PROVEN_DISJOINT"`) may join a declared row only when the proof
 * holds (corpus-restatement.ts `provenDisjointRefusal`). The design analysis's verifier REFUTED a contract-local
 * proof by measurement — under AM-23 a non-claim outranks a claim, so it hid another contract's requirement on a test
 * copy — so the proof covers every contract's CLAIMED and every value-authoring item on the row too.
 */
test('M6: C55 joins a row RPC-001 already declares, as the fourth V6 declaration, qualified, with no deferral; contracts.json untouched', () => {
    const rpc = loadCorpusContracts().find(c => c.contractId === 'restated:RPC-001')!
    const v6 = (rpc.declarations || []).filter((d: any) => d.row === 'V6').map((d: any) => `${d.declaration} ${d.selector}${d.qualifier ? ` ${d.qualifier}` : ''}`)
    assert.deepEqual(v6, ['CLAIMED type ∈ {progression, control, exclusion}', 'NOT_AUTHORED type=control', 'NOT_AUTHORED type=exclusion', 'NON_CLAIMED type=origin NO_FURTHER_VALUE'])
    assert.ok(!('defersTo' in (rpc.declarations || []).find((d: any) => d.qualifier)!), 'an added declaration carries no deferral')
    assert.equal(restatementTally.declarationsAddedOnDeclaredRows, 1)
    assert.deepEqual(restatementTally.notFound, [])
    const raw = readJson('stage-b/contracts.json')
    const authored = (Array.isArray(raw) ? raw : Object.values(raw)).find((e: any) => /RPC-001/.test(e.name))
    assert.equal(authored.result.declarations.filter((d: any) => d.row === 'V6').length, 3, 'the authored file still holds three')
})

test('M6: the proof — FALSE both ways under the reach semantics; *, CONTAINS and undetermined never prove', () => {
    const p = (s: string) => parsePredicate(s).predicate!
    assert.ok(provablyDisjoint(p('type=origin'), p('type=control')))
    assert.ok(provablyDisjoint(p('type=origin'), p('type ∈ {progression, control, exclusion}')))
    assert.ok(provablyDisjoint(p('type ∈ {progression, control, exclusion}'), p('type=origin')), 'symmetric')
    assert.ok(!provablyDisjoint(p('type ∈ {origin, control}'), p('type=control')), 'an overlap is not disjoint')
    assert.ok(!provablyDisjoint(p('type=origin'), p('*')), '* reaches everything')
    assert.ok(!provablyDisjoint(p('*'), p('type=origin')))
    assert.ok(!provablyDisjoint(p('functions ∋ objective-area'), p('functions ∋ access')), 'CONTAINS never proves')
    assert.ok(!provablyDisjoint(p('type=origin'), p('team=TEAM_AT_AXIS_START')), 'different attributes: undetermined, not disjoint')
    assert.ok(!provablyDisjoint(p('type=origin'), p('type=origin')), 'identical selectors overlap')
    // The syntax-only parser reads exactly what the register-validating one reads, wherever both read.
    const index = indexRegister(REGISTER)
    for (const contract of loadCorpusContracts()) {
        for (const d of contract.declarations || []) {
            const checked = parseSelector(d.selector, String(d.row), index)
            if (checked.predicate) assert.deepEqual(parsePredicate(d.selector), checked, `${contract.contractId} ${String(d.row)}`)
        }
    }
})

test('M6: every addition that could contradict is refused with its own reason, and nothing is added', () => {
    const before = DECLARATION_ADDITIONS.length
    const origin = { row: 'V6', declaration: 'NON_CLAIMED', qualifier: 'NO_FURTHER_VALUE', selector: 'type=origin', scope: 'WHOLE_GAME', note: 'TEST-ONLY' }
    const attempts: [Record<string, unknown>, string][] = [
        [{ ...origin, selector: 'type ∈ {origin, control}' }, 'the added declaration is not proven disjoint from its CLAIMED type ∈ {progression, control, exclusion}, so nothing is added'], // the first statement it overlaps is named
        [{ ...origin, selector: '*' }, 'the added declaration is not proven disjoint from its CLAIMED type ∈ {progression, control, exclusion}, so nothing is added'],
        [{ ...origin, qualifier: undefined }, 'only a non-claim qualified with a registered state may join a row the contract already declares, so nothing is added'],
        [{ ...origin, declaration: 'CLAIMED' }, 'only a non-claim qualified with a registered state may join a row the contract already declares, so nothing is added'],
        [{ ...origin, defersTo: 'ESTABLISHING_OBJECT' }, 'an added declaration may not carry a deferral, so nothing is added'],
        [{ ...origin, selector: 'type IN origin' }, 'its own selector cannot be read (malformed IN term: type IN origin), so disjointness cannot be proved and nothing is added'],
    ]
    try {
        for (const [declaration, reason] of attempts) {
            const clean = Object.fromEntries(Object.entries(declaration).filter(([, v]) => v !== undefined))
            DECLARATION_ADDITIONS.push({ contractId: 'restated:RPC-001', declaration: clean as any, onDeclaredRow: 'PROVEN_DISJOINT', ruling: 'TEST', why: 'TEST-ONLY' })
            const rpc = loadCorpusContracts().find(c => c.contractId === 'restated:RPC-001')!
            assert.deepEqual(restatementTally.notFound, [`restated:RPC-001 declared row V6 (TEST): ${reason}`], JSON.stringify(clean))
            assert.equal(restatementTally.declarationsAddedOnDeclaredRows, 1, 'only C55 is counted')
            assert.equal((rpc.declarations || []).filter((d: any) => d.row === 'V6').length, 4, 'nothing is added')
            DECLARATION_ADDITIONS.splice(before)
        }
        // Without the opt-in, C48's rule and C48's words, exactly as before.
        DECLARATION_ADDITIONS.push({ contractId: 'restated:RPC-001', declaration: { ...origin, selector: 'type=eligibility' } as any, ruling: 'TEST', why: 'TEST-ONLY' })
        loadCorpusContracts()
        assert.deepEqual(restatementTally.notFound, ['restated:RPC-001 undeclared row V6 (TEST): it already declares CLAIMED, NOT_AUTHORED, NOT_AUTHORED, so nothing is added']) // C55 joins after every contract is restated, so C48's check reads the authored three
    } finally {
        DECLARATION_ADDITIONS.splice(before)
        loadCorpusContracts()
    }
    assert.deepEqual(restatementTally.notFound, [], 'restored')
})

test("M6: the proof reads OTHER contracts — another contract's claim, or an item authoring a value, on the row refuses the addition", () => {
    // Constructed, TEST-ONLY. The verifier's measured hazard: a GF2 CLAIMED type=origin on V6 would have been hidden by
    // C55 (AM-23 puts a non-claim above a claim), and a contract-local proof admitted it.
    const addition = DECLARATION_ADDITIONS.find(a => a.ruling === 'C55')!
    const contracts = (): LoadedContract[] => JSON.parse(JSON.stringify(loadCorpusContracts())).map((c: any) => (c.contractId === 'restated:RPC-001' ? { ...c, declarations: c.declarations.filter((d: any) => !d.qualifier) } : c))
    assert.equal(provenDisjointRefusal(addition, contracts()), null, 'the real knowledge: proven')
    const claimed = contracts()
    claimed.find(c => c.contractId === 'restated:GF2')!.declarations.push({ row: 'V6', declaration: 'CLAIMED', selector: 'type=origin', scope: 'WHOLE_GAME', note: 'TEST-ONLY' } as any)
    assert.equal(provenDisjointRefusal(addition, claimed), "restated:RPC-001 declared row V6 (C55): the added declaration is not proven disjoint from restated:GF2's CLAIMED type=origin, so nothing is added")
    const valued = contracts()
    valued.find(c => c.contractId === 'restated:A01-02')!.items.push({ itemId: 'T-V6', row: 'V6', selector: 'type=origin', requirement: 'EQUALS', value: 'TEST-ONLY', strictness: 'REQUIRED' } as any)
    assert.equal(provenDisjointRefusal(addition, valued), 'restated:RPC-001 declared row V6 (C55): the added declaration is not proven disjoint from item restated:A01-02::T-V6 type=origin, so nothing is added')
    // Another contract's NON_CLAIMED or EXCLUDED needs no proof (it is not outranked), and an EXCLUSION item forbids a
    // value the field must not take, which "needs no further value" does not contradict — NEUTRAL-16.a is one, `*`.
    const neutral = loadCorpusContracts().find(c => c.contractId === 'restated:NEUTRAL-PLAYER-CONDITION')!
    assert.ok(neutral.items.some((i: any) => i.itemId === 'NEUTRAL-16.a' && i.row === 'V6' && i.selector === '*' && i.strictness === 'EXCLUSION'), 'the exclusion item the proof passes over is real')
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

/**
 * **SD-80, scoped to what it is actually about — and strengthened in the process.**
 *
 * The invariant guards against a NARROWING becoming a value: a composition that leaves more than one member
 * is a downstream choice, and emitting the permitted set as the resolved value is "a wrong answer wearing the
 * label of a right one".
 *
 * A row the register marks `multiplicity: SET` is a different thing. Its value IS a set, because its own
 * valueType says so — "one property per referent" — and his ruling of 2 October is explicit that this "does
 * not mean choose one of the channels". Membership, not alternatives.
 *
 * So the test now asserts BOTH halves, which is stronger than the blanket form it replaces: no line holds a
 * set unless the register declares that row set-valued, AND no narrowing ever becomes a value regardless.
 */
test('SD-80: a set is the value of a line only where the register declares the row set-valued, and never from a narrowing', () => {
    for (const { label, source } of [
        { label: 'corpus', source: corpusInput() },
        { label: 'narrowing', source: input([contract([narrowing('N-1', ['a', 'b'])])]) },
    ]) {
        const result = runDerivation(source)
        if (isStampedHalt(result)) continue
        const index = indexRegister(source.register)
        let setValued = 0
        for (const entry of result.resolution) {
            if (entry.state !== 'derived') continue
            const row = index.rows.get(String(entry.row))
            if (!Array.isArray(entry.value)) continue
            assert.equal(
                row?.multiplicity,
                'SET',
                `${entry.lineId} is derived while holding a set on a row the register does not declare set-valued: ${JSON.stringify(entry.value)}`,
            )
            // And it is membership, not a surviving choice space: a narrowing never becomes the value.
            assert.equal(result.resolution.find(e => e.lineId === entry.lineId)?.permitted, undefined, `${entry.lineId}: a permitted set is not a value`)
            setValued++
        }
        if (label === 'narrowing') {
            assert.equal(setValued, 0, 'a narrowing must produce no set-valued line at all')
        } else {
            assert.ok(setValued > 0, 'the corpus must exercise the set-valued case, or this proves nothing')
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
    assert.equal(result.failures.filter(f => f.kind === 'COLLISION' && f.locus.lineId === 'game::V1').length, 0)
    const v1 = result.resolution.find(e => e.lineId === 'game::V1')!
    assert.equal(v1.value, 'line_crossed', 'three independently authored objects converge on one member')
    assert.equal(v1.support.length, 3)
})

/**
 * SD-89's authored ownership met GF2's authored restart default on one line, and SD-90 settled it.
 * What the engine must **not** do here is as important as what it does: it may not conclude that
 * `DEFENDING_TEAM` and `NOT_LAST_TOUCH` name the same team. They do, on this element — but RC-22 says
 * *"two designations are equal only if they map to one entry"*, and his ruling keeps that question for
 * stage 7. The default is displaced because the property was authoritatively resolved without it, not
 * because the engine decided the two agree.
 */
test('SD-90: GF2 is recorded as adapted, and no equivalence between designations is claimed', () => {
    const result = runDerivation(corpusInput())
    if (isStampedHalt(result)) return assert.fail('unexpected halt')
    const T2 = 'c:restated:A01-02:A01-02-01.a::T2'

    assert.equal(result.failures.filter(f => f.kind === 'COLLISION' && f.locus.lineId === T2).length, 0)
    const line = result.resolution.find(e => e.lineId === T2)!
    assert.equal(line.verdict, 'RESOLVED:ENTAILED')
    assert.equal(line.value, 'DEFENDING_TEAM', 'the required contribution supplies the value')

    assert.deepEqual(
        line.support.map(s => (s.kind === 'CONTRACT_ITEM' ? `${s.contractId}::${s.itemId}` : s.kind)),
        ['restated:A01-02::A01-02-05.a'],
        'adaptation supplies no support: the displaced default is not among the sources',
    )

    const disposition = result.audit.dispositions.find(d => d.lineId === T2)!
    assert.equal(disposition.kind, 'ADAPTED')
    assert.equal(`${disposition.contractId}::${disposition.itemId}`, 'restated:GF2::GF2-16.a')
    assert.equal(disposition.preferred, 'NOT_LAST_TOUCH', 'what it preferred stays visible')
    assert.deepEqual(disposition.displacedBy.map(i => `${i.contractId}::${i.itemId}`), ['restated:A01-02::A01-02-05.a'])
})

/**
 * The cross-cutting form of "adaptation is not support", asserted over the whole corpus rather than
 * over the one case — the shape of assertion that caught the `game::V1` drift.
 */
test('SD-90: no displaced contribution appears in any line’s support, anywhere in the corpus', () => {
    const result = runDerivation(corpusInput())
    if (isStampedHalt(result)) return assert.fail('unexpected halt')

    assert.ok(result.audit.dispositions.length > 0, 'the corpus does exercise displacement')
    for (const d of result.audit.dispositions) {
        const line = result.resolution.find(e => e.lineId === d.lineId)!
        const sources = line.support.map(s => (s.kind === 'CONTRACT_ITEM' ? `${s.contractId}::${s.itemId}` : s.kind))
        assert.ok(!sources.includes(`${d.contractId}::${d.itemId}`), `${d.lineId}: ${d.itemId} was displaced and is still counted as support`)
    }
})

// ---------------------------------------------------------------------------------------------
// SD-83/SD-84/SD-85 — who may establish an element, and the singleton exception.
// ---------------------------------------------------------------------------------------------

const existence = (itemId: string, row: string, overrides: Partial<ContractItem> = {}) =>
    item({ itemId, row, selector: '*', requirement: 'EXISTS', value: 'it exists', valueStatus: 'N/A', ...overrides })

/** The general rule, asserted over the whole corpus rather than over a fixture. */
test('SD-83: no element anywhere is established by a contribution that supports nothing', () => {
    const result: any = runStages0to10(corpusInput())
    const items = new Map<string, any>()
    for (const c of loadCorpusContracts()) for (const i of c.items) items.set(`${c.contractId}::${i.itemId}`, i)

    for (const cls of result.classes) {
        for (const ref of cls.supportedBy) {
            const source = items.get(`${ref.contractId}::${ref.itemId}`)!
            assert.notEqual(source.strictness, 'EXCLUSION', `${cls.classId} established by an exclusion`)
            assert.notEqual(source.basis, 'ASSUMED', `${cls.classId} established by an assumption`)
            assert.notEqual(source.basis, 'ENGINE_ONLY', `${cls.classId} established by engine wording`)
            assert.notEqual(source.checkability, 'OUTSIDE_BOUNDARY', `${cls.classId} established by an out-of-boundary note`)
        }
    }
})

test('SD-83: each disqualifying kind is checked on its own, so none can be reinstated quietly', () => {
    for (const [what, overrides] of [
        ['an exclusion', { strictness: 'EXCLUSION' }],
        ['an assumption', { basis: 'ASSUMED' }],
        ['engine wording', { basis: 'ENGINE_ONLY' }],
        ['an out-of-boundary note', { checkability: 'OUTSIDE_BOUNDARY' }],
        ['a typical example', { valueStatus: 'TYPICAL_EXAMPLE' }],
    ] as const) {
        const result: any = runStages0to10(input([contract([existence('E-1', 'S2', overrides as any)])]))
        assert.equal(result.classes.filter((c: any) => c.row === 'S2').length, 0, `${what} established an element`)
    }
})

test('SD-83: an assumption may still bound something whose existence is established elsewhere', () => {
    const contracts = [
        contract([
            existence('R-1', 'S2', { selector: 'noun=channel' }), // authoritative: establishes the region
            // `S5` is deliberately not a row any selector carries (SD-92), so the assumption is the
            // only thing addressing it.
            item({ itemId: 'A-1', row: 'S5', selector: 'noun=channel', requirement: 'EQUALS', value: 'the attacking end', basis: 'ASSUMED' }),
        ]),
    ]
    const result: any = runStages0to10(input(contracts))
    assert.equal(result.classes.filter((c: any) => c.row === 'S2').length, 1, 'the authoritative item still establishes it')
    const line = [...result.derived.lines.values()].find((l: any) => l.lineId.endsWith('::S5')) as any
    assert.ok(line.bounding.length > 0, 'and the assumption still bounds its value — it constrains, it does not establish')
    assert.equal(line.entailing.length, 0, 'while never entailing one')
})

/** SD-93 — the named diagnostic has to reach the emitted result, or it is still silent. */
test('SD-93: an unpopulated own-involvement scope is emitted by name, not only computed', () => {
    const orphaned = contract([item({ itemId: 'I-FIELD', row: 'S5', requirement: 'EQUALS', value: 'the far end', scope: 'OWN_INVOLVEMENT' })])
    const result = runDerivation(input([orphaned]))
    if (isStampedHalt(result)) return assert.fail('unexpected halt')

    const named = result.diagnostics.find(d => d.code === 'OWN_INVOLVEMENT_UNPOPULATED')
    assert.ok(named, 'the condition survives to the emitted result')
    assert.equal(named!.where, 'C-1')
    assert.match(named!.detail, /I-FIELD/)

    // And the corpus no longer raises it: SD-93 populated both contracts that used the scope.
    const corpus = runDerivation(corpusInput())
    if (isStampedHalt(corpus)) return assert.fail('unexpected halt')
    assert.deepEqual(
        corpus.diagnostics.filter(d => d.code === 'OWN_INVOLVEMENT_UNPOPULATED'),
        [],
        'nothing in the corpus is holding authored knowledge off a line this way any more',
    )
})

test('SD-84: several contributions to a singleton collection support one element, not several', () => {
    const contracts = [
        contract([existence('A-1', 'V0')], { contractId: 'C-A', objectId: 'O-A' }),
        contract([existence('B-1', 'V0')], { contractId: 'C-B', objectId: 'O-B' }),
        contract([existence('C-1', 'V0')], { contractId: 'C-C', objectId: 'O-C' }),
    ]
    const result: any = runStages0to10(input(contracts))
    const v0 = result.classes.filter((c: any) => c.row === 'V0')
    assert.equal(v0.length, 1, 'one singleton, however many contributions establish it')
    assert.equal(v0[0].supportedBy.length, 3, 'each contribution recorded as supporting it')
    assert.equal(v0[0].singletonBy, 'SD-06', 'and the schema invariant that makes it a singleton is named')
    assert.deepEqual(v0[0].cardinality, { min: 1, max: 1 })
})

test('SD-84 is NOT a general relaxation of SD-47: a non-singleton row still forms one class each', () => {
    const contracts = [
        contract([existence('A-1', 'S2', { selector: 'noun=channel' })], { contractId: 'C-A', objectId: 'O-A' }),
        contract([existence('B-1', 'S2', { selector: 'noun=channel' })], { contractId: 'C-B', objectId: 'O-B' }),
    ]
    const result: any = runStages0to10(input(contracts))
    assert.equal(
        result.classes.filter((c: any) => c.row === 'S2').length,
        2,
        'identical selectors on a non-singleton row are still two classes — derivation manufactures no equivalence',
    )
})

/**
 * The singleton rule is read from the schema invariant, so it is tested that way: a register in which a
 * *different* row is fixed at exactly one behaves the same. `V0` registers no selector attributes, so
 * `S2` is used here to exercise contradictory selectors, which `V0` could not express.
 */
function singletonRegister(rowId: string) {
    const modified = JSON.parse(JSON.stringify(REGISTER))
    modified.citableStandingDecisions.push({
        id: 'SD-TEST-SINGLETON',
        item: { row: rowId, requirement: 'COUNT', value: 1, relation: `ENTAILS existence of exactly one ${rowId}` },
    })
    return modified
}

test('SD-84 follows the schema invariant, not the row: any row fixed at one behaves as a singleton', () => {
    const contracts = [
        contract([existence('A-1', 'S2', { selector: 'noun=channel' })], { contractId: 'C-A', objectId: 'O-A' }),
        contract([existence('B-1', 'S2', { selector: 'noun=channel' })], { contractId: 'C-B', objectId: 'O-B' }),
    ]
    const result: any = runStages0to10(input(contracts, singletonRegister('S2')))
    const s2 = result.classes.filter((c: any) => c.row === 'S2')
    assert.equal(s2.length, 1, 'one element, because the schema now fixes this row at one')
    assert.equal(s2[0].singletonBy, 'SD-TEST-SINGLETON', 'and it names the invariant that made it so')
    assert.equal(s2[0].supportedBy.length, 2)
})

test('SD-84: contradictory selectors on a singleton are recorded, never merged or split silently', () => {
    const contracts = [
        contract([existence('A-1', 'S2', { selector: 'noun=channel' })], { contractId: 'C-A', objectId: 'O-A' }),
        contract([existence('B-1', 'S2', { selector: 'noun=zone' })], { contractId: 'C-B', objectId: 'O-B' }),
    ]
    const result: any = runStages0to10(input(contracts, singletonRegister('S2')))
    const s2 = result.classes.filter((c: any) => c.row === 'S2')
    assert.equal(s2.length, 1, 'the incompatible contribution does not create a second element either')
    assert.equal(s2[0].supportedBy.length, 1, 'and is not recorded as supporting the singleton')
    assert.ok(
        result.stopped.some((s: any) => /explicitly establishes incompatibility/.test(s.why)),
        'the incompatibility is reported rather than resolved here',
    )
})

test('SD-85: an exclusion is checked against the structure, and creates none of it', () => {
    const contracts = [
        contract([
            existence('R-1', 'S2', { selector: 'noun=channel' }),
            item({ itemId: 'X-1', row: 'S2', selector: 'noun=lane', requirement: 'EXISTS', strictness: 'EXCLUSION', value: 'no lane' }),
        ]),
    ]
    const result: any = runStages0to10(input(contracts))
    assert.equal(result.classes.filter((c: any) => c.row === 'S2').length, 1, 'the exclusion established nothing')
    const outcome = result.forward.find((f: any) => f.item.itemId === 'X-1')
    assert.equal(outcome.result, 'SATISFIED', 'and is evaluated through the negative-existence path')
    assert.ok(/matches the excluded selector/.test(outcome.why))
})

test('SD-86: an exclusion applies its own authored bound, with the relation as written', () => {
    const result: any = runStages0to10(corpusInput())
    const outcomes = Object.fromEntries(result.forward.map((f: any) => [f.item.itemId, f]))

    // "more than 1" is typed as > 1, and "2 or more" as >= 2. Neither is rewritten as the other.
    assert.equal(outcomes['VARTARGET-12.a'].result, 'SATISFIED')
    assert.ok(/forbidden > 1/.test(outcomes['VARTARGET-12.a'].why), 'the authored relation, not a converted one')
    assert.equal(outcomes['WIDEZONE-16.b'].result, 'SATISFIED')
    assert.ok(/forbidden >= 2/.test(outcomes['WIDEZONE-16.b'].why))

    // The prose stays beside the typed form: the source is preserved, not replaced.
    const item = loadCorpusContracts()
        .find(c => c.contractId === 'restated:WIDE-ZONE-ADVANTAGE')!
        .items.find(i => i.itemId === 'WIDEZONE-16.b') as any
    assert.ok(/2 or more/.test(String(item.value)), 'the authored prose is untouched')
    assert.deepEqual(item.forbiddenCardinality, { operator: '>=', value: 2 })
})

test('SD-86: a bound is never inferred — an exclusion without one stays not evaluable', () => {
    const contracts = [
        contract([
            existence('R-1', 'S2', { selector: 'noun=channel' }),
            item({
                itemId: 'X-1',
                row: 'S2',
                selector: '*',
                requirement: 'COUNT',
                strictness: 'EXCLUSION',
                value: 'too many channels to be workable',
            }),
        ]),
    ]
    const result: any = runStages0to10(input(contracts))
    const outcome = result.forward.find((f: any) => f.item.itemId === 'X-1')
    assert.equal(outcome.result, 'NOT_EVALUABLE', 'no bound is read out of the prose')
    assert.ok(/cannot be read without interpreting it/.test(outcome.why))
})

test('SD-86: the bound comes from the item, never from the schema invariant', () => {
    // A singleton row fixes cardinality at one, but an exclusion on it with no authored bound must
    // not borrow that — deriving the bound from SD-06 is exactly what the ruling forbids.
    const contracts = [
        contract([existence('A-1', 'V0')], { contractId: 'C-A', objectId: 'O-A' }),
        contract([item({ itemId: 'X-1', row: 'V0', selector: '*', requirement: 'COUNT', strictness: 'EXCLUSION', value: 'more than the permitted number' })], {
            contractId: 'C-B',
            objectId: 'O-B',
        }),
    ]
    const result: any = runStages0to10(input(contracts))
    const outcome = result.forward.find((f: any) => f.item.itemId === 'X-1')
    assert.equal(outcome.result, 'NOT_EVALUABLE', 'the singleton invariant does not supply the exclusion its bound')
})

/**
 * SD-87 — the authored goal-kick trigger, mapped through the existing structure. The thing to protect is
 * that the mapping keeps the discriminating information: his specific warning was not to reduce it to
 * `OUT_END_LINE` alone, which would also match a corner.
 */
test('SD-87: the eight reference defects are gone, and the goal kick is selected structurally', () => {
    const result: any = runStages0to10(corpusInput())
    assert.equal(result.failures.filter((f: any) => f.kind === 'REFERENCE_DEFECT').length, 0, 'the whole population cleared')

    const transition = result.classes.find((c: any) => c.classId === 'c:restated:A01-02:A01-02-01.a')
    assert.ok(transition, 'the goal-kick transition now exists as an element')
    assert.equal(transition.row, 'T1')

    // Every discriminating component of his authored state is present in the selector.
    const terms = Object.fromEntries(transition.constraints.terms.map((t: any) => [t.attribute, t.value]))
    assert.equal(terms['trigger'], 'OUT_END_LINE', 'the ball leaves play over a goal line')
    assert.equal(terms['qualifier.endLine'], 'DEFENDING_TEAM', "the defending team's goal line")
    assert.equal(terms['qualifier.lastTouch'], 'ATTACKING_TEAM', 'last touched by an attacking player')
})

test('SD-87: the selector discriminates a goal kick from a corner', () => {
    const result: any = runStages0to10(corpusInput())
    const transition = result.classes.find((c: any) => c.classId === 'c:restated:A01-02:A01-02-01.a')

    // A corner is the same trigger and the same end line, differing only in who touched it last.
    // If the mapping had reduced to OUT_END_LINE alone, this selector would match both.
    const corner = { any: false, terms: [{ attribute: 'qualifier.lastTouch', op: '=', value: 'DEFENDING_TEAM' }] } as any
    assert.equal(reaches(corner, transition), 'FALSE', 'a corner does not reach the goal-kick element')

    const goalKick = { any: false, terms: [{ attribute: 'qualifier.lastTouch', op: '=', value: 'ATTACKING_TEAM' }] } as any
    assert.equal(reaches(goalKick, transition), 'TRUE', 'and the goal kick does')
})

test('the corpus V0 singleton is supported by both legitimate contributions, and only those', () => {
    const result: any = runStages0to10(corpusInput())
    const v0 = result.classes.filter((c: any) => c.row === 'V0')
    assert.equal(v0.length, 1)
    assert.deepEqual(
        v0[0].supportedBy.map((s: any) => s.itemId).sort(),
        ['PCG-01', 'VARTARGET-11.a'],
        'the two authored existence assertions, and neither exclusion nor the assumed restatement',
    )
    const primary = result.gates.gateA.checks.find((c: any) => c.checkId === 'GA-ONE-PRIMARY-EVENT')
    assert.equal(primary.clauses[0].verdict, 'PASS', 'exactly one primary event')
    assert.ok(/^1 primary event/.test(primary.why))
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

/**
 * ── Ruling C51, 15 October 2026: the context's cleanup, with provenance kept and the proviso measured ──────────────
 *
 * Three kinds of change, kept apart because he asked for them to be (his reply of that day, item 8: *"please
 * distinguish between: Cleanup that removes redundant or superseded implementation language. Changes that alter the
 * functional meaning of the approved context. The first can proceed as proposed."*):
 *   - CLEANUP: the twelve RPC-001 items whose basis is ENGINE_ONLY — wording from the engine's own coach rules
 *     (primary-scoring.ts), in no workbook. Inert under SD-21, so retiring them must move nothing; that is checked by
 *     putting them back on a copy, not assumed.
 *   - FUNCTIONAL, identified and approved: the separate scoring objective (11.a) with its target reference (08.c),
 *     his 9.5 — *"Approved, provided the live attacking objective remains represented"* — so the proviso is measured.
 *   - FUNCTIONAL, identified and approved: "own-half start area" out of RPC-001-13, his 9.10.
 * Every retired item stays verbatim in contracts.json: *"Please preserve provenance for the retired engine-authored
 * wording and identify any additional semantic changes before making them authoritative."*
 */
const ENGINE_ONLY_RETIRED = ['RPC-001-04.a', 'RPC-001-04.b', 'RPC-001-04.c', 'RPC-001-05.a', 'RPC-001-05.b', 'RPC-001-06', 'RPC-001-09.a', 'RPC-001-09.b', 'RPC-001-16.a', 'RPC-001-16.b', 'RPC-001-16.c', 'RPC-001-20']
const RPC = 'restated:RPC-001'
/** RPC-001 exactly as contracts.json holds it — the provenance, encoding repaired the way the loader repairs it. */
const rpc001AsAuthored = (): any => {
    const raw: any[] = repairCorpusEncoding(readJson('stage-b/contracts.json'), { strings: 0, charactersRecovered: 0 })
    return raw.find(entry => entry.kind === 'restated' && String(entry.name).startsWith('RPC-001')).result
}
const composeFor = (ids: string[]): DerivationInput => derivationInputFor({ selected: ids.map(id => ({ id, role: 'test composition' })) })
/** Every line whose verdict or reason differs, and every Gate A check that moves, between two runs. */
const movesBetween = (a: any, b: any): string[] => {
    const out: string[] = []
    for (const id of new Set([...a.classified.keys(), ...b.classified.keys()])) {
        const x = a.classified.get(id), y = b.classified.get(id)
        const vx = x ? `${x.verdict}/${x.reason ?? ''}` : 'absent', vy = y ? `${y.verdict}/${y.reason ?? ''}` : 'absent'
        if (vx !== vy) out.push(`${id}: ${vx} -> ${vy}`)
    }
    const va: any = Object.fromEntries([['verdict', a.gates.gateA.verdict], ...a.gates.gateA.checks.map((c: any) => [c.checkId, c.verdict])])
    const vb: any = Object.fromEntries([['verdict', b.gates.gateA.verdict], ...b.gates.gateA.checks.map((c: any) => [c.checkId, c.verdict])])
    for (const k of new Set([...Object.keys(va), ...Object.keys(vb)])) if (va[k] !== vb[k]) out.push(`Gate A ${k}: ${va[k]} -> ${vb[k]}`)
    return out.sort()
}

test('C51: fourteen RPC-001 items leave the active knowledge, each kept verbatim in contracts.json with the basis that put it on the list', () => {
    const authored = rpc001AsAuthored()
    const basisOf = (id: string) => authored.items.find((i: any) => i.id === id)?.basis
    for (const id of ENGINE_ONLY_RETIRED) assert.equal(basisOf(id), 'ENGINE_ONLY', `${id}: verified engine wording before it was retired as cleanup`)
    assert.equal(basisOf('RPC-001-11.a'), 'OWNER_RULING', 'the separate objective is not engine wording: retiring it is functional, and he approved it (9.5)')
    assert.equal(basisOf('RPC-001-08.c'), 'AUTHORED', 'nor is its target reference')
    // Nothing ENGINE_ONLY is left behind in the context, and nothing else of its was retired.
    assert.deepEqual(authored.items.filter((i: any) => i.basis === 'ENGINE_ONLY').map((i: any) => i.id), ENGINE_ONLY_RETIRED, 'exactly the twelve, verified one by one')
    const loaded = loadCorpusContracts().find(c => c.contractId === RPC)!
    const retired = [...ENGINE_ONLY_RETIRED, 'RPC-001-11.a', 'RPC-001-08.c']
    assert.deepEqual(loaded.items.filter(i => retired.includes(i.itemId)), [], 'none reaches derivation')
    // Less the two goalkeeper items C53 retired later the same day (RPC-001-02, -03; their own test is in activity-review),
    // and plus the two referents C57 added in stage K1 (RPC-001-18.h, 19.c — his M8; pinned in typed-referent.unit.ts).
    assert.equal(loaded.items.length, authored.items.length - retired.length - 2 + 2)
    assert.deepEqual(loaded.items.filter(i => !authored.items.some((a: any) => a.id === i.itemId)).map(i => i.itemId), ['RPC-001-18.h', 'RPC-001-19.c'], 'the only items not in contracts.json are C57\'s')
    // "The part that says this objective is live during the build-out is kept" (our change 5, as approved).
    assert.ok(loaded.items.some(i => i.itemId === 'RPC-001-11.b'), 'RPC-001-11.b, the live-in-the-episode clause, is kept')
})

test('C51: retiring the twelve engine-only items moved nothing — measured by putting them back on a copy', () => {
    const authored = rpc001AsAuthored()
    const putBack = (input: DerivationInput) => {
        input.contracts = JSON.parse(JSON.stringify(input.contracts)) // the loader's objects are shared
        const rpc: any = input.contracts.find(c => c.contractId === RPC)
        for (const id of ENGINE_ONLY_RETIRED) {
            const { id: itemId, ...rest } = authored.items.find((i: any) => i.id === id)
            rpc.items.push({ itemId, ...rest })
        }
        return input
    }
    for (const ids of [['restated:GF2', RPC], ['restated:GF2', RPC, 'restated:A01-02'], [RPC]]) {
        const now = runStages0to10(composeFor(ids))
        const before = runStages0to10(putBack(composeFor(ids)))
        assert.deepEqual(movesBetween(before, now), [], `${ids.join(' + ')}: SD-21 kept them inert, so their retirement is cleanup and nothing else`)
    }
    assert.deepEqual(movesBetween(runStages0to10(putBack(corpusInput())), runStages0to10(corpusInput())), [], 'corpus-wide too')
})

test('C51: the proviso — the live attacking objective remains represented, and the redundant one\'s blocker is gone', () => {
    for (const ids of [['restated:GF2', RPC], ['restated:GF2', RPC, 'restated:A01-02']]) {
        const input = composeFor(ids)
        const staged: any = runStages0to10(input)
        const result = runDerivation(input)
        assert.ok(!isStampedHalt(result))
        const game = assembleResolvedGame(result as any, staged.classes, indexRegister(input.register), input.contracts)
        const objectives = (game.game as any).objectives.map((o: any) => `${o.elementId} ${o.role} ${o.team} -> ${o.reference?.structuralRef?.itemId ?? 'NOTHING'}`)
        // Before (measured that day): three — these two and RPC-001-11.a (BUILD_OUT_TEAM -> NOTHING, the failed J2).
        assert.deepEqual(objectives, [
            'c:restated:GF2:GF2-08.c PRIMARY_SCORING TEAM_AT_AXIS_START -> GF2-03.f',
            'c:restated:GF2:GF2-08.e PRIMARY_SCORING TEAM_AT_AXIS_END -> GF2-03.e',
        ], `${ids.join(' + ')}: each team attacks its own target, so whichever team builds out has its live objective`)
        assert.ok(![...staged.classified.keys()].some((id: string) => id.includes('RPC-001-11.a')), 'the separate objective and its unresolved reference are gone')
        const blockers = staged.gates.gateA.checks.find((c: any) => c.checkId === 'GA-NO-FAILED-LINE').subjects.filter((id: string) => id.includes('RPC-001'))
        // **3 -> 0 on 15 October 2026 (stage K1), measured.** 18.a::V6 by C55 — his 9.9, "Build-out origin needs no further
        // value: Approved under the narrow authority ruling." — and 18.f::V5 and 19.a::V5 by C57, his M8: "Apply the
        // qualifying conditions to the target and scoring episode actually being evaluated." No RPC-001 line blocks now;
        // the build-out episode's beginning still does (GA-EPISODE-REACHABLE, capability M3, pinned in condition-scope).
        assert.deepEqual(blockers.sort(), [], 'RPC-001-11.a::J2 cleared (C51); the other three context lines since by C55 and C57')
    }
})

/**
 * **Added in review, 15 October 2026: the one CHECK verdict C51 softens, pinned so it cannot pass unnoticed.**
 * Retiring 11.a and 08.c (his 9.5, *"Retire the redundant separate scoring objective: Approved, provided the live
 * attacking objective remains represented"*) moves GA-DIRECTION and nothing else at check level. Where the
 * possession game is composed — A01's own compositions — it moves NOT_EVALUABLE -> DEFERRED_TO_REALIZATION: the
 * objective whose target nothing positioned is gone, and the post-realization gate still judges the ends clause.
 * Where RPC-001 is composed WITHOUT the possession game (alone, with the goal-kick situation, or with GF4 — no goal
 * selects any of these) it moves FAIL -> NOT_EVALUABLE, because the context's own objective was the only one there:
 * the context no longer gives any team an objective, so the proviso is met only through the game form's objectives.
 * NOT_EVALUABLE still blocks realization, and Gate A stays FAIL in every one of them. Measured by putting the two
 * items and their J2 claim back on a copy.
 */
test('C51: GA-DIRECTION is the only check that moves, and only as pinned here; Gate A stays as it was', () => {
    const authored = rpc001AsAuthored()
    const putBack = (input: DerivationInput) => {
        input.contracts = JSON.parse(JSON.stringify(input.contracts))
        const rpc: any = input.contracts.find(c => c.contractId === RPC)
        for (const id of ['RPC-001-11.a', 'RPC-001-08.c']) {
            const { id: itemId, ...rest } = authored.items.find((i: any) => i.id === id)
            rpc.items.push({ itemId, ...rest })
        }
        const j2 = rpc.declarations.findIndex((d: any) => d.row === 'J2' && d.declaration === 'UNDECLARED' && d.note === 'RPC-001-08.c.')
        assert.ok(j2 >= 0, 'the restated J2 declaration is found')
        rpc.declarations[j2] = { ...rpc.declarations[j2], declaration: 'CLAIMED' }
        return input
    }
    const checks = (staged: any) => Object.fromEntries([['Gate A', staged.gates.gateA.verdict], ...staged.gates.gateA.checks.map((c: any) => [c.checkId, c.verdict])])
    const expected: [string, string[], string, string][] = [
        ['GF2 + RPC-001', ['restated:GF2', RPC], 'NOT_EVALUABLE', 'DEFERRED_TO_REALIZATION'],
        ['GF2 + RPC-001 + A01-02', ['restated:GF2', RPC, 'restated:A01-02'], 'NOT_EVALUABLE', 'DEFERRED_TO_REALIZATION'],
        ['RPC-001', [RPC], 'FAIL', 'NOT_EVALUABLE'],
        ['RPC-001 + A01-02', [RPC, 'restated:A01-02'], 'FAIL', 'NOT_EVALUABLE'],
        ['GF4 + RPC-001', ['blind:GF4', RPC], 'FAIL', 'NOT_EVALUABLE'],
    ]
    for (const [name, ids, before, now] of expected) {
        const was = checks(runStages0to10(putBack(composeFor(ids))))
        const is = checks(runStages0to10(composeFor(ids)))
        const moved = Object.keys({ ...was, ...is }).filter(k => was[k] !== is[k])
        // **Re-pointed 15 October 2026 (stage K1).** In GF2 + RPC-001, and in RPC-001 alone, the retired objective's unresolved target is now
        // the ONLY line GA-NO-FAILED-LINE would fail on if it were put back: C55 and C57 settled the three context
        // lines that failed beside it (their own pins are in governing-declarations.unit.ts and typed-referent.unit.ts).
        // So putting it back moves that check too; what C51 itself moved is unchanged. Measured.
        const alsoMoved = name === 'GF2 + RPC-001' || name === 'RPC-001' ? ['GA-NO-FAILED-LINE'] : []
        assert.deepEqual(moved, ['GA-DIRECTION', ...alsoMoved], `${name}: only the ends clause moves (and, since K1, the failed-line check where 11.a's target would be its only blocker)`)
        if (alsoMoved.length) assert.deepEqual([was['GA-NO-FAILED-LINE'], is['GA-NO-FAILED-LINE']], ['FAIL', 'PASS'], name)
        assert.deepEqual([was['GA-DIRECTION'], is['GA-DIRECTION']], [before, now], name)
        assert.equal(is['Gate A'], 'FAIL', `${name}: still refused`)
    }
})

test('C51: "own-half start area" leaves RPC-001-13, and nothing else about the item changes', () => {
    const authored = rpc001AsAuthored().items.find((i: any) => i.id === 'RPC-001-13')
    const loaded: any = loadCorpusContracts().find(c => c.contractId === RPC)!.items.find(i => i.itemId === 'RPC-001-13')
    assert.ok(authored.value.includes('own-half start area'), 'the provenance keeps the original wording')
    assert.equal(loaded.value, 'BUILD_OUT_TEAM attacks toward its PRIMARY_SCORING reference and defends the opposite')
    assert.ok(!JSON.stringify(loaded.value).includes('own'), 'no "own half" and no "own end" was put in its place')
    for (const field of ['row', 'selector', 'requirement', 'strictness', 'valueStatus', 'scope', 'basis', 'basisEvidence', 'checkability', 'structuralClause']) {
        assert.deepEqual(loaded[field], authored[field], `RPC-001-13 ${field} is unchanged`)
    }
})

test('C51: the nine declarations that claimed a row on retired items alone are restated, and no line or gate verdict moves for it', () => {
    const authored = rpc001AsAuthored()
    const expected: Record<string, string> = { SV1: 'NON_CLAIMED', P4: 'NON_CLAIMED', P8: 'NOT_AUTHORED', P10: 'NOT_AUTHORED', S5: 'NOT_AUTHORED', O4: 'NOT_AUTHORED', J2: 'UNDECLARED', V2: 'NON_CLAIMED', T4: 'NOT_AUTHORED' }
    const loaded = loadCorpusContracts().find(c => c.contractId === RPC)!
    for (const [row, kind] of Object.entries(expected)) {
        const claims = authored.declarations.filter((d: any) => d.row === row && d.declaration === 'CLAIMED')
        assert.equal(claims.length, 1, `${row}: one authored claim`)
        assert.ok(!loaded.declarations.some((d: any) => d.row === row && d.declaration === 'CLAIMED'), `${row}: no claim survives on retired items`)
        assert.ok(loaded.declarations.some((d: any) => d.row === row && d.declaration === kind && d.selector === claims[0].selector && d.note === claims[0].note), `${row}: ${kind}, selector and note kept`)
    }
    // Every claim still standing cites at least one item that is still active (the T3, T6 and J1 claims cite 15.b, 17.b, 14.a).
    const activeIds = new Set(loaded.items.map(i => i.itemId.replace('RPC-001-', '')))
    for (const d of loaded.declarations.filter((x: any) => x.declaration === 'CLAIMED')) {
        assert.ok([...activeIds].some(id => String(d.note).includes(id)), `RPC-001 ${d.row}: "${d.note}" still cites an active item`)
    }
    // Measured: the kind chosen changes no reason (no P8-P10 line exists to govern — the defenders' starting
    // arrangement is surfaced by the authorization record, not here), so putting the claims back moves nothing.
    const claimsBack = (input: DerivationInput) => {
        input.contracts = JSON.parse(JSON.stringify(input.contracts))
        const rpc: any = input.contracts.find(c => c.contractId === RPC)
        for (const row of Object.keys(expected)) {
            const at = rpc.declarations.findIndex((d: any) => d.row === row && d.declaration === expected[row] && d.note === authored.declarations.find((a: any) => a.row === row && a.declaration === 'CLAIMED').note)
            rpc.declarations[at] = { ...rpc.declarations[at], declaration: 'CLAIMED' }
        }
        return input
    }
    for (const ids of [['restated:GF2', RPC], ['restated:GF2', RPC, 'restated:A01-02']]) {
        const now: any = runStages0to10(composeFor(ids))
        assert.deepEqual(movesBetween(runStages0to10(claimsBack(composeFor(ids))), now), [], ids.join(' + '))
        assert.ok(![...now.classified.keys()].some((id: string) => /::P(8|9|10)$/.test(id)), `${ids.join(' + ')}: still no line on P8-P10`)
        assert.equal(now.classified.get('game::V2').verdict, 'RESOLVED:ENTAILED', 'the value line still resolves (SD-25) without RPC-001-20')
    }
})

/**
 * ── Ruling C54, 15 October 2026: two distinct references, recorded apart ───────────────────────────────────────
 *
 * His reply received that day (16 October, item 9 point 1): *"Separate pressure and progression references:
 * Approved. They are distinct relationships, even when they coincide spatially."* RPC-001-18.d's referent named both
 * with one "or" ("the initial pressure or progression line"). It now names the progression reference — where
 * build-out success is measured — and its fitNote records the pressure reference as distinct and unplaced. Our gloss
 * "the pressure line, where defenders start" is NOT carried (his item 3 keeps a designated pressure line as one
 * potential realization only). No engine effect until a typed referent exists (capability M8).
 */
test('C54: RPC-001-18.d names the progression reference; the pressure reference is recorded as distinct and unplaced; no gloss carried', () => {
    const authored = rpc001AsAuthored().items.find((i: any) => i.id === 'RPC-001-18.d')
    const loaded: any = loadCorpusContracts().find(c => c.contractId === RPC)!.items.find(i => i.itemId === 'RPC-001-18.d')
    assert.equal(authored.value, 'the initial pressure or progression line', 'the provenance keeps the authored phrase')
    assert.equal(loaded.value, 'the progression reference: where build-out success is measured')
    assert.ok(loaded.fitNote.includes('THE INITIAL PRESSURE REFERENCE') && loaded.fitNote.includes('is a DISTINCT relationship and is NOT this condition\'s referent'), loaded.fitNote)
    assert.ok(loaded.fitNote.includes('placed nowhere'), 'unplaced: no location is written')
    assert.ok(!String(loaded.value).includes('defenders'), 'the referent says nothing of where defenders start')
    // The gloss appears once, and only as what is NOT carried.
    assert.equal(loaded.fitNote.split('where defenders start').length - 1, 1)
    assert.ok(loaded.fitNote.includes('Not carried: the email\'s gloss of the pressure reference as "the pressure line, where defenders start"'), loaded.fitNote)
    for (const field of ['row', 'selector', 'requirement', 'strictness', 'valueStatus', 'basis', 'basisEvidence', 'checkability', 'structuralClause']) {
        assert.deepEqual(loaded[field], authored[field], `RPC-001-18.d ${field} unchanged`)
    }
    assert.equal(loaded.scope, 'BUILD_OUT_EPISODE', 'and C52 still applies to it — both rulings land on the one item')
    // Open text before, open text after: putting the authored phrase back on a copy moves no line and no gate verdict.
    const putBack = (input: DerivationInput) => {
        input.contracts = JSON.parse(JSON.stringify(input.contracts))
        const item: any = input.contracts.find(c => c.contractId === RPC)!.items.find(i => i.itemId === 'RPC-001-18.d')
        item.value = authored.value
        return input
    }
    for (const ids of [['restated:GF2', RPC], ['restated:GF2', RPC, 'restated:A01-02']]) {
        assert.deepEqual(movesBetween(runStages0to10(putBack(composeFor(ids))), runStages0to10(composeFor(ids))), [], ids.join(' + '))
    }
})

console.log(`\n${passed} assertions passed — increment 5\n`)
