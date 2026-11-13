/**
 * **Stage W4 of the A02 package: ILLUSTRATIVE carriers for High Press Escape's first two clauses and the two third-clause alternatives** (U2 b1,
 * b2, b3), TEST-ONLY. Christian's second reply received 11 November 2026 delegates "Testing legitimate configuration alternatives using clearly
 * labeled provisional or illustrative knowledge." Nothing here is knowledge: every carrier is ours, labelled ILLUSTRATIVE wherever it shows (the
 * chain's support and account, the handoff's grading, the safeguards), and stands for what an approved answer of Christian's must supply.
 *
 * What is pinned, every value measured first (scratchpad/pkg/A02/W4/probe*.txt):
 *   1. the carriers' gate (`draft-store.ts` `loadIllustrativeCarriers`): admitted whole; each defect refuses the file (OWNER_RULING, a basis that
 *      establishes nothing, a source claimed, evidence not labelled, A01's 20 m or another A01 value copied, an undeclared or registered scope);
 *      the production register lists no ILLUSTRATIVE scope; the a02-composition store reads exactly what it read;
 *   2. the composition (`withIllustrativeCarriers`, `registerWith`) and the referent's state (`beginConditionReferentOf`), each refusal named;
 *   3. the review data held to the handoff's own validator, with the new kind's refusals;
 *   4. the runs: where each stops with the carriers on, and the label on every line, account entry and safeguard verdict that rests on a carrier;
 *   5. the new clauses on the chain's own Gate A (observed read-only around the engine's export) and their negative controls on TEST-ONLY copies
 *      of the carriers file: the state clause (U2 b1), the reach without START, the possession change never a starter, the beyond-a-line clause
 *      (U2 b2: a line past the target, a referent typed to the target), and the open-text referent carried as words only;
 *   6. the static scan: no production module reaches the carriers.
 *
 * Run: node node_modules/ts-node/dist/bin.js --files -r tsconfig-paths/register ./src/system/design-reasoning/a02-carriers.unit.ts
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { loadRegister } from '../derivation/corpus'
import { DraftStoreRefused, ILLUSTRATIVE_CARRIERS_FILE, loadDraftStore, loadIllustrativeCarriers, withIllustrativeCarriers } from '../derivation/draft-store'
import { BEYOND_LINE_CLAUSE, CheckResult, episodeCheckDecides, WHILE_STATE_CLAUSE } from '../derivation/gates'
import { indexRegister } from '../derivation/register'
import { registerWith } from '../derivation/run-bounded-selection'
import { beginConditionReferentOf, ILLUSTRATIVE } from '../derivation/types'
import { EPISODE_REACHABLE_CHECK, episodeConfirmed } from '../rendering/context-scoring-guard'
import { conditionEvidenceOf } from '../rendering/requirement-account'
import { itemSource } from '../rendering/review-evidence'
import { ChainAnswer, ChainRequest, HandoffChain, HandoffResult, runHandoffCases, validateHandoffInputs } from './handoff'
import { quotedSpans } from './a02.unit'
import { holdsGenderedPronoun, realChain } from './handoff-chain.unit'
import { handoffReportText } from './handoff-report'
import { committedKnowledge } from './knowledge'
import { ownershipOf, safeguardRunOf } from './safeguards'

const quiet = console.log
console.log = (...args: unknown[]) => {
    if (typeof args[0] === 'string' && args[0].startsWith('[selection-search]')) return
    quiet(...args)
}
let passed = 0
/** Run itself (npm test runs it so), the tests run; imported (by a02-evidence.unit.ts, for the carrier runs' stops, stage W6), none does. */
const MAIN = require.main === module
function test(name: string, run: () => void): void {
    if (!MAIN) return
    try {
        run()
        passed++
        quiet(`  ok  ${name}`)
    } catch (error) {
        quiet(`  FAIL ${name}: ${(error as Error).stack ?? (error as Error).message}`)
        process.exitCode = 1
    }
}
if (MAIN) quiet(`stage W4 of the A02 package: ILLUSTRATIVE carriers (TEST-ONLY), Christian's second reply received 11 November 2026`)

const HERE = __dirname
const WT = path.resolve(HERE, '..', '..', '..', '..')
const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const readJson = (file: string): any => JSON.parse(fs.readFileSync(file, 'utf8'))
const C = 'restated:RPC-002'
// RE-PINNED OPENLY (stage B1 of the A02 complete-activity package, 12 November 2026). BEFORE: four carrier runs, A02-IL-1, A02-IL-2, A02-IL-2r,
// A02-IL-2L. AFTER: two, A02-IL-2 and A02-IL-2L, rebased on IL-LINE and IL-PROGRESSION-TYPED only. WHY: the origin and control clauses are
// carried by our CANDIDATE restatement of Christian's rulings received 12 November 2026 (items 1 and 2), so the origin carriers, the relational
// control alternative and the cases that measured them are retired (superseded by A02-HPE1); the state clause's mechanism is still measured,
// on a TEST-ONLY copy of the restatement as it stood at 7dcb5d6 (`storeAt7dcb5d6`, test U2 b1).
const RUNS = ['A02-IL-2', 'A02-IL-2L']

// The review data: A02's (its borrowed rulings read from the handoff's data, unchanged) with the carrier cases composed onto A02-0.
const handoffData = readJson(path.join(HERE, 'handoff-inputs.review.json'))
const a02Raw = readJson(path.join(HERE, 'a02-inputs.review.json'))
const carriersRaw = readJson(path.join(HERE, 'a02-carriers.review.json'))
const borrowedTreatment = (id: string): any => {
    for (const c of a02Raw.cases) for (const t of c.testOnlyTreatments ?? []) if (t.id === id) return copy(t)
    throw new Error(`no A02 case declares ${id}`)
}
function composedWith(carriers: any = carriersRaw): any {
    const own = (id: string) => copy(carriers.treatments.find((t: any) => t.id === id))
    const cases = carriers.cases.map((c: any) => ({
        id: c.id,
        basedOn: 'A02-0',
        label: c.label,
        resultStanding: 'TEST_ONLY_TREATMENT_NEVER_THE_A02_CONFIGURATION',
        rulings: [...copy(a02Raw.cases.find((x: any) => x.id === 'A02-0').rulings), copy(carriers.rulingEntry)],
        testOnlyTreatments: [...c.borrow.map(borrowedTreatment), ...c.treatments.map(own)],
        suppliedChoices: c.treatments.includes('TT-IL-ORIGIN') ? copy(carriers.suppliedChoices) : [],
    }))
    return {
        standing: carriersRaw.standing,
        rulings: [...a02Raw.borrowed.rulings.map((id: string) => handoffData.rulings.find((r: { id: string }) => r.id === id)), ...a02Raw.rulings, ...carriers.rulings],
        cases: [...a02Raw.cases, ...cases, mechanismCase(carriers)],
        grading: handoffData.grading,
    }
}

/**
 * Stage B1 (12 November 2026): the retired case A02-IL-1, composed again as a MECHANISM MEASUREMENT only (never a case of the review data, never
 * among the carrier runs a02-evidence.unit.ts reads): over the TEST-ONLY copy of the restatement as it stood at 7dcb5d6 (`storeAt7dcb5d6`), with
 * the origin carriers it measured (IL-START, IL-LINE, IL-PLACEMENT, IL-ORIGIN-STATE), the two TEST-ONLY declarations it borrowed (the origin's
 * value and the control referent declared NO_FURTHER_VALUE, written here as they were), the progression items withheld and its START choice,
 * exactly as the case composed them, so the state clause and its negative controls (U2 b1) and the carriers' labels are still measured.
 */
const MECHANISM = 'A02-IL-1m'
/** The mechanism run's scoring-clause verdicts (measured): the origin on carriers, the progression withheld, the control under the TEST-ONLY declaration. */
const MECHANISM_VERDICTS = [['origin', 'CARRIED_UNDER_ILLUSTRATION'], ['progression', 'CITED_NOT_CARRIED'], ['control', 'CARRIED_UNDER_TREATMENT']]
let mechanismStore: string | null = null
function mechanismCase(carriers: any): any {
    mechanismStore ??= storeAt7dcb5d6()
    const declared = (id: string, row: string, selector: string, from: string, what: string) => ({
        id,
        kind: 'REPLACE_DECLARATION',
        contractId: C,
        declaration: { row, selector, from, to: 'NON_CLAIMED', qualifier: 'NO_FURTHER_VALUE' },
        what,
        effect: 'the line is no longer owed (on the 7dcb5d6 copy only)',
        why: 'the retired A02-IL-1 borrowed it; a mechanism measurement',
        label: 'TEST-ONLY: not ruled for A02; superseded by the CANDIDATE restatement of 12 November 2026',
        rulingRefs: ['A02-10NOV-TREATMENTS'],
    })
    return {
        id: MECHANISM,
        basedOn: 'A02-0',
        label: "A02-IL-1m: the retired A02-IL-1's composition over a TEST-ONLY copy of the restatement as it stood at 7dcb5d6 (a mechanism measurement, never the A02 configuration)",
        resultStanding: 'TEST_ONLY_TREATMENT_NEVER_THE_A02_CONFIGURATION',
        chain: { ...copy(a02Raw.cases.find((x: any) => x.id === 'A02-0').chain), draftStore: mechanismStore },
        rulings: [...copy(a02Raw.cases.find((x: any) => x.id === 'A02-0').rulings), copy(carriers.rulingEntry)],
        testOnlyTreatments: [
            ...['TT-CONSUMED-STEPS', 'TT-DRAFT-STORE', 'TT-K2-RETAIN-FORM', 'TT-LAW-11-STAND-IN'].map(borrowedTreatment),
            { id: 'TT-IL-ORIGIN', kind: 'ILLUSTRATIVE_CARRIERS', carriers: { file: 'docs/audits/drafts/a02-illustrative/a02-illustrative.DRAFT.json', groups: ['IL-START', 'IL-LINE', 'IL-PLACEMENT', 'IL-ORIGIN-STATE'] }, what: 'the origin clause carried as a begin condition with a state (retired; a mechanism measurement)', effect: 'GA-EPISODE-REACHABLE decides it over a TEST-ONLY register copy holding the illustrative episode scope', why: 'the state clause and its negative controls', label: 'ILLUSTRATIVE: TEST-ONLY carriers of ours, not knowledge; retired, superseded by the CANDIDATE restatement', rulingRefs: ['A02-11NOV-ILLUSTRATIVE', 'A02-10NOV-TREATMENTS'] },
            declared('TT-ORIGIN-NO-FURTHER-VALUE', 'V6', 'type=origin', 'NOT_AUTHORED', "the origin clause's value declared to need no further value"),
            declared('TT-CONTROL-NO-FURTHER-VALUE', 'V5', 'type=control', 'UNDECLARED', "the control clause's referent declared to need no further value"),
            { id: 'TT-WITHHOLD-PROGRESSION', kind: 'WITHHOLD_ITEMS', contractId: C, itemIds: ['RPC-002-03.a', 'RPC-002-03.b', 'RPC-002-03.c'], what: 'the progression items withheld', effect: 'the origin carrier is measured alone, with the control clause', why: 'a mechanism measurement', label: 'TEST-ONLY: withheld, not removed from the restatement', rulingRefs: ['A02-10NOV-TREATMENTS'] },
        ],
        suppliedChoices: [{ lineId: 'c:restated:RPC-002:IL-T1-1::T4', value: { coachDecides: 'ILLUSTRATIVE: short of the illustrative pressing line' }, rulingRef: null, standing: 'ILLUSTRATIVE', provisional: false }],
    }
}
const all = validateHandoffInputs(composedWith())
const inputs = { ...all, cases: all.cases.filter((c) => RUNS.includes(c.id) || c.id === MECHANISM) }
const k = committedKnowledge()

// Read-only observation of the chain's own Gate A: the engine's export wrapped (the result is returned unchanged), the last result kept.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const engine = require('../derivation/engine')
const derive = engine.runDerivation
let gateA: any[] = []
engine.runDerivation = (input: unknown) => {
    const result = derive(input)
    gateA = result?.gates?.gateA?.checks ?? []
    return result
}
const clauseOf = (checkId: string, clause: string): string | null => {
    const check = gateA.find((c) => c.checkId === checkId)
    return check ? ((check.clauses ?? []).find((x: any) => x.clause === clause)?.verdict ?? 'ABSENT') : null
}
const whyOf = (checkId: string): string => String(gateA.find((c) => c.checkId === checkId)?.why ?? '')

function runAll(): { results: Map<string, HandoffResult>; requests: Map<string, ChainRequest>; answers: Map<string, ChainAnswer>; gates: Map<string, any[]> } {
    const requests = new Map<string, ChainRequest>()
    const answers = new Map<string, ChainAnswer>()
    const gates = new Map<string, any[]>()
    const capture: HandoffChain = {
        build: (r) => {
            const a = realChain.build(r)
            requests.set(r.caseId, copy(r))
            answers.set(r.caseId, a)
            gates.set(r.caseId, copy(gateA))
            return a
        },
    }
    const results = new Map(runHandoffCases(inputs, capture, k).map((r) => [r.caseId, r] as const))
    return { results, requests, answers, gates }
}
const made = runAll()
/** Stage W6 (12 November 2026): the carrier runs' ids and results, read by a02-evidence.unit.ts for appendix E (each run's earliest stop). */
export const CARRIER_RUN_IDS = [...RUNS]
export const carrierResult = (id: string): HandoffResult => {
    const r = made.results.get(id)
    assert.ok(r, `no carrier run ${id}`)
    return r
}

/** A TEST-ONLY copy of the carriers file, changed, in a temporary folder; returns its absolute path. */
function carriersCopy(change: (raw: any) => void): string {
    const raw = readJson(ILLUSTRATIVE_CARRIERS_FILE)
    change(raw)
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'a02-illustrative-'))
    const file = path.join(dir, 'a02-illustrative.DRAFT.json')
    fs.writeFileSync(file, JSON.stringify(raw, null, 2))
    return file
}
const refusedWith = (file: string): string => {
    try {
        loadIllustrativeCarriers(file)
        return 'ADMITTED'
    } catch (error) {
        assert.ok(error instanceof DraftStoreRefused, String(error))
        return (error as Error).message
    }
}
const itemOf = (raw: any, id: string): any => raw.illustrative.groups.flatMap((g: any) => g.items).find((i: any) => i.id === id)

/**
 * Stage B1 (12 November 2026): a TEST-ONLY copy of the a02-composition store folder with our restatement put back as it stood at 7dcb5d6
 * (02.b on V5, V5 CLAIMED for origin and progression, V6 CLAIMED for progression and control, V6 origin NOT_AUTHORED, V5 control UNDECLARED),
 * so the W4 mechanisms built over that restatement (the origin carried as a begin condition with a state, the relational control referent) are
 * still measured on what they were built over. A measurement copy only: the restatement on disk is the CANDIDATE restatement of 12 November.
 */
function storeAt7dcb5d6(): string {
    const from = path.join(WT, 'docs', 'audits', 'drafts', 'a02-composition')
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'a02-composition-7dcb5d6-'))
    for (const name of fs.readdirSync(from)) fs.copyFileSync(path.join(from, name), path.join(dir, name))
    const file = path.join(dir, 'rpc-002-contract.DRAFT.json')
    const raw = readJson(file)
    const result = raw.contractEntry.result
    result.items.find((i: any) => i.id === 'RPC-002-02.b').row = 'V5'
    const declarations = (result.declarations as any[]).filter((d) => !(d.row === 'V5' && d.selector === 'type=origin'))
    declarations.find((d) => d.row === 'V5' && d.declaration === 'CLAIMED').selector = 'type ∈ {origin, progression}'
    declarations.find((d) => d.row === 'V6' && d.declaration === 'CLAIMED').selector = 'type ∈ {progression, control}'
    const control = declarations.find((d) => d.row === 'V5' && d.selector === 'type=control')
    control.declaration = 'UNDECLARED'
    delete control.qualifier
    declarations.push({ row: 'V6', declaration: 'NOT_AUTHORED', selector: 'type=origin', scope: 'WHOLE_GAME', note: 'What makes pressure established is not authored (UNRESOLVED).' })
    result.declarations = declarations
    fs.writeFileSync(file, JSON.stringify(raw, null, 2))
    return dir
}

// ---------------------------------------------------------------------------------------------------------------------------------------
// 1. The carriers' gate
// ---------------------------------------------------------------------------------------------------------------------------------------

test('the ILLUSTRATIVE carriers: admitted whole by their gate, every item stamped ILLUSTRATIVE; each defect refuses the file; the production register holds no ILLUSTRATIVE scope; the A02 store reads what it read', () => {
    const carriers = loadIllustrativeCarriers()
    assert.equal(carriers.file, 'docs/audits/drafts/a02-illustrative/a02-illustrative.DRAFT.json')
    assert.deepEqual(carriers.episodeScopes, ['ILLUSTRATIVE_PRESSURE_SEQUENCE'])
    assert.deepEqual(
        carriers.groups.map((g) => [g.id, g.replaces, g.items.map((i) => i.itemId), g.declarations.length, g.setsAsideChoices]),
        [
            ['IL-START', [], ['IL-T1-1', 'IL-T6-1', 'IL-T7-1', 'IL-T2-1', 'IL-T3-1', 'IL-T4-1', 'IL-T5-1'], 0, ['game::PS1']],
            ['IL-LINE', [], ['IL-S2-1', 'IL-S5-1', 'IL-S6-1'], 0, []],
            ['IL-PLACEMENT', [], ['IL-P8-1', 'IL-P10-1', 'IL-P10a-1', 'IL-P10b-1'], 0, []],
            ['IL-ORIGIN-STATE', ['RPC-002-02.a', 'RPC-002-02.b'], ['IL-02.a', 'IL-02.b'], 0, []],
            ['IL-PROGRESSION-TYPED', ['RPC-002-03.b'], ['IL-03.b'], 0, []],
            ['IL-CONTROL-RELATIONAL', [], ['IL-04.r'], 1, []],
        ],
    )
    const items = carriers.groups.flatMap((g) => g.items) as any[]
    assert.ok(items.every((i) => i.category === ILLUSTRATIVE && i.basis === 'AUTHORED' && String(i.basisEvidence).startsWith('ILLUSTRATIVE')), 'every carrier is ILLUSTRATIVE, AUTHORED only so it establishes, and says so')
    // Never A01's values: the line is 12 m from an end, not 20 m.
    assert.deepEqual((items.find((i) => i.itemId === 'IL-S5-1') as any).value.offsetM, { from: 12, to: 12 })
    // The production register: no ILLUSTRATIVE scope, so `episodeCheckDecides` decides one only over a TEST-ONLY register copy that lists it.
    const register = loadRegister()
    assert.ok(!((register.vocabularies.contractEnums.scope as string[]).some((s) => s.startsWith('ILLUSTRATIVE_'))) && register.vocabularies.contractEnums.illustrativeEpisodeScope === undefined)
    assert.equal(episodeCheckDecides('BUILD_OUT_EPISODE', indexRegister(register)), true)
    assert.equal(episodeCheckDecides('WHOLE_GAME', indexRegister(register)), false)
    // The A02 store is unchanged (the carriers have a folder of their own).
    const store = loadDraftStore('a02-composition')
    assert.deepEqual([store.files, store.notRead, store.illustrative, store.registerOverlay], [['a02-authorization.DRAFT.json', 'rpc-002-contract.DRAFT.json'], [], undefined, undefined])
    // Bites: each defect refuses the whole file.
    assert.equal(refusedWith(carriersCopy(() => undefined)), 'ADMITTED', 'an unchanged copy is admitted')
    const cases: Array<[string, (raw: any) => void, string]> = [
        ['OWNER_RULING', (raw) => (itemOf(raw, 'IL-T2-1').basis = 'OWNER_RULING'), 'claims OWNER_RULING'],
        ['ASSUMED', (raw) => (itemOf(raw, 'IL-T2-1').basis = 'ASSUMED'), 'has basis "ASSUMED"'],
        ['a source', (raw) => (itemOf(raw, 'IL-T2-1').source = [{ rowId: 'RPC-PROP-133' }]), 'carries source, which an ILLUSTRATIVE carrier never writes'],
        ['category', (raw) => (itemOf(raw, 'IL-T2-1').category = 'PROVISIONAL_REALIZATION_CHOICE'), 'carries category'],
        ['evidence', (raw) => (itemOf(raw, 'IL-T2-1').basisEvidence = 'no source'), "does not begin 'ILLUSTRATIVE'"],
        ['A01 20 m', (raw) => (itemOf(raw, 'IL-S5-1').value.offsetM = { from: 20, to: 20 }), 'copies an offset a production provisional realization holds'],
        ['an A01 value', (raw) => (itemOf(raw, 'IL-P10-1').value = readJson(path.join(WT, 'docs', 'audits', 'conformance', 'stage-b', 'provisional-realizations.json')).realizations[0].items.find((i: any) => i.id === 'A01-R1-P10-2').value), 'copies the value a production provisional realization holds on P10'],
        ['an undeclared scope', (raw) => (itemOf(raw, 'IL-02.a').scope = 'ILLUSTRATIVE_OTHER'), 'an episode scope the file does not declare'],
        ['a registered scope', (raw) => (raw.illustrative.episodeScopes[0].scope = 'BUILD_OUT_EPISODE'), "named 'ILLUSTRATIVE_...'"],
        ['a production id', (raw) => (itemOf(raw, 'IL-T2-1').id = 'A01-R1-T2-1'), 'uses an id a production contract'],
        ['the standing', (raw) => (raw.standing = 'DRAFT - TEST-ONLY'), 'does not say DRAFT, ILLUSTRATIVE and TEST-ONLY'],
    ]
    for (const [what, change, words] of cases) {
        const said = refusedWith(carriersCopy(change))
        assert.ok(said.includes(words), `${what}: ${said}`)
    }
})

// ---------------------------------------------------------------------------------------------------------------------------------------
// 2. The composition, the register copy, and the referent's state
// ---------------------------------------------------------------------------------------------------------------------------------------

test('the composition: groups added on a copy, stamped ILLUSTRATIVE, the overlay holding only the scopes they use; each refusal named; the register copied, never written; a state recognized only well formed', () => {
    const carriers = loadIllustrativeCarriers()
    // Re-pinned openly (stage B1): BEFORE the store read from disk; AFTER a TEST-ONLY copy of the restatement as it stood at 7dcb5d6, the one the
    // groups were built over (the relational control group replaces the UNDECLARED control declaration, which the CANDIDATE restatement of 12
    // November 2026 declares NO_FURTHER_VALUE). The store on disk refuses that group, named (below).
    const onDisk = loadDraftStore('a02-composition')
    assert.throws(() => withIllustrativeCarriers(onDisk, carriers, ['IL-CONTROL-RELATIONAL'], 'TT-B'), /holds 0 declarations UNDECLARED on V5 \(type=control\), and a carrier replaces exactly one/)
    const store = loadDraftStore(storeAt7dcb5d6())
    const before = JSON.stringify(store)
    const start = withIllustrativeCarriers(store, carriers, ['IL-START'], 'TT-X')
    assert.equal(JSON.stringify(store), before, 'the store handed in is not changed')
    const contract = start.contracts.find((c) => c.contractId === C)!
    assert.deepEqual(contract.items.filter((i) => i.category === ILLUSTRATIVE).map((i) => i.itemId), ['IL-T1-1', 'IL-T6-1', 'IL-T7-1', 'IL-T2-1', 'IL-T3-1', 'IL-T4-1', 'IL-T5-1'])
    assert.deepEqual([start.illustrative?.map((x) => [x.treatmentId, x.groups, x.setsAsideChoices]), start.registerOverlay], [[['TT-X', ['IL-START'], ['game::PS1']]], undefined])
    const origin = withIllustrativeCarriers(withIllustrativeCarriers(store, carriers, ['IL-START', 'IL-LINE', 'IL-PLACEMENT', 'IL-ORIGIN-STATE'], 'TT-A'), carriers, ['IL-CONTROL-RELATIONAL'], 'TT-B')
    const o = origin.contracts.find((c) => c.contractId === C)!
    assert.ok(!o.items.some((i) => i.itemId === 'RPC-002-02.a' || i.itemId === 'RPC-002-02.b'), 'the replaced items are out of the copy')
    assert.deepEqual(origin.registerOverlay, { episodeScopes: ['ILLUSTRATIVE_PRESSURE_SEQUENCE'], treatmentId: 'TT-A' })
    const declaration = (o.declarations as any[]).find((d) => d.row === 'V5' && d.selector === 'type=control')
    assert.deepEqual([declaration.declaration, declaration.category, String(declaration.note).startsWith('ILLUSTRATIVE carrier IL-CONTROL-RELATIONAL (TEST-ONLY treatment TT-B), no ruling')], ['CLAIMED', ILLUSTRATIVE, true])
    // Refusals.
    assert.throws(() => withIllustrativeCarriers(store, carriers, ['IL-NOWHERE'], 'TT-X'), /holds no ILLUSTRATIVE group IL-NOWHERE/)
    assert.throws(() => withIllustrativeCarriers(origin, carriers, ['IL-ORIGIN-STATE'], 'TT-C'), /replaces RPC-002-02.a, which restated:RPC-002 does not hold/)
    assert.throws(() => withIllustrativeCarriers(origin, carriers, ['IL-CONTROL-RELATIONAL'], 'TT-C'), /adds IL-04.r, which restated:RPC-002 already holds/)
    assert.throws(() => withIllustrativeCarriers({ ...copy(store), contracts: [] }, carriers, ['IL-START'], 'TT-X'), /adds to restated:RPC-002, which the draft store .*a02-composition.* does not hold/)
    assert.throws(() => withIllustrativeCarriers(store, carriers, [], 'TT-X'), /by naming at least one group/)
    // The register: the file's object where there is no overlay; otherwise a copy with the scope added and the version stamped.
    const register = loadRegister()
    assert.equal(registerWith(register, undefined), register)
    const overlaid = registerWith(register, { episodeScopes: ['ILLUSTRATIVE_PRESSURE_SEQUENCE'], treatmentId: 'TT-A' })
    assert.deepEqual([overlaid.vocabularies.contractEnums.scope.slice(-1), overlaid.vocabularies.contractEnums.illustrativeEpisodeScope, String(overlaid.version).endsWith('+ILLUSTRATIVE(TT-A)')], [['ILLUSTRATIVE_PRESSURE_SEQUENCE'], ['ILLUSTRATIVE_PRESSURE_SEQUENCE'], true])
    assert.ok(!register.vocabularies.contractEnums.scope.includes('ILLUSTRATIVE_PRESSURE_SEQUENCE'), 'the register itself is untouched')
    assert.throws(() => registerWith(register, { episodeScopes: ['BUILD_OUT_EPISODE'], treatmentId: 'TT-A' }), /already a scope of the register/)
    // Fix F (verifications V1 and V2, 12 November 2026): the readers that hold the episode check decide a scope from the register the game was
    // derived over (`episodeCheckDecides` over `episodeScopesOf`), never by its spelling. On the copy the listed ILLUSTRATIVE scope is decided;
    // a scope spelled ILLUSTRATIVE_ that the copy does not list is refused; on the production register neither is.
    const onCopy = indexRegister(overlaid)
    const onRegister = indexRegister(register)
    assert.deepEqual(
        [episodeCheckDecides('ILLUSTRATIVE_PRESSURE_SEQUENCE', onCopy), episodeCheckDecides('BUILD_OUT_EPISODE', onCopy), episodeCheckDecides('ILLUSTRATIVE_NOT_LISTED', onCopy), episodeCheckDecides('ILLUSTRATIVE_PRESSURE_SEQUENCE', onRegister)],
        [true, true, false, false],
    )
    // The same through each reader: the guard (`episodeConfirmed`) and the requirement account (`conditionEvidenceOf`), on a passing episode check.
    const passing = { checkId: EPISODE_REACHABLE_CHECK, verdict: 'PASS', subjects: [], why: 'TEST-ONLY', clauses: [{ clause: 'reach', verdict: 'PASS', basis: 'EVALUATED', instances: 1 }], pendingOn: [], blockedBy: [] } as unknown as CheckResult
    assert.deepEqual(
        [episodeConfirmed('ILLUSTRATIVE_PRESSURE_SEQUENCE', passing, onCopy), episodeConfirmed('ILLUSTRATIVE_NOT_LISTED', passing, onCopy), episodeConfirmed('ILLUSTRATIVE_PRESSURE_SEQUENCE', passing), episodeConfirmed('BUILD_OUT_EPISODE', passing)],
        [true, false, false, true],
    )
    const reading = (scope: string) => ({ contractId: C, itemId: 'IL-02.a', type: 'origin', present: true, elementFound: true, authoredScope: scope, carriedScope: scope, scopeMatches: true, notEvaluable: 'TEST-ONLY', episodeConfirmed: false, governs: false, why: 'TEST-ONLY' })
    const evidence = (scope: string, index = onCopy) => JSON.stringify(conditionEvidenceOf(reading(scope), passing, index))
    assert.ok(evidence('ILLUSTRATIVE_NOT_LISTED').includes('does not decide the ILLUSTRATIVE_NOT_LISTED scope'), evidence('ILLUSTRATIVE_NOT_LISTED'))
    assert.ok(evidence('ILLUSTRATIVE_PRESSURE_SEQUENCE', onRegister).includes('does not decide the ILLUSTRATIVE_PRESSURE_SEQUENCE scope'), evidence('ILLUSTRATIVE_PRESSURE_SEQUENCE', onRegister))
    assert.ok(!evidence('ILLUSTRATIVE_PRESSURE_SEQUENCE').includes('does not decide'), evidence('ILLUSTRATIVE_PRESSURE_SEQUENCE'))
    // The referent: a state is a conjunct, recognized only where every entry is a typed reference; without one, as before.
    const arm = { beginsEpisodeOf: 'S', arms: [{ takenBy: 'x' }] }
    assert.ok(beginConditionReferentOf(arm))
    assert.ok(beginConditionReferentOf({ ...arm, whileState: [{ structuralRef: { contractId: C, itemId: 'IL-P8-1' } }] }))
    assert.equal(beginConditionReferentOf({ ...arm, whileState: [] }), null)
    assert.equal(beginConditionReferentOf({ ...arm, whileState: ['IL-P8-1'] }), null)
    assert.equal(beginConditionReferentOf({ beginsEpisodeOf: 'S', arms: [], whileState: [{ structuralRef: { contractId: C, itemId: 'IL-P8-1' } }] }), null, 'never a state alone')
    // The review evidence grades a carrier by its category first: DRAFT and named ILLUSTRATIVE, never CANDIDATE or APPROVED by its AUTHORED basis.
    const items = new Map<string, any>([[`${C}::IL-T2-1`, { basis: 'AUTHORED', category: ILLUSTRATIVE, basisEvidence: 'ILLUSTRATIVE: no source' }]])
    const graded = itemSource({ contractId: C, itemId: 'IL-T2-1' }, items, ILLUSTRATIVE)
    assert.deepEqual([graded.standing, String(graded.detail).startsWith('ILLUSTRATIVE')], ['DRAFT', true])
    assert.equal(itemSource({ contractId: C, itemId: 'IL-T2-1' }, items, undefined).standing, 'DRAFT', 'read from the item too')
})

// ---------------------------------------------------------------------------------------------------------------------------------------
// 3. The review data
// ---------------------------------------------------------------------------------------------------------------------------------------

test(`the review data: the carrier cases held to the handoff's own validator; each defect of the new kind refuses the data`, () => {
    assert.deepEqual(inputs.cases.map((c) => c.id), [...RUNS, MECHANISM])
    for (const c of inputs.cases) assert.ok(c.testOnlyTreatments.filter((t) => t.kind === 'ILLUSTRATIVE_CARRIERS').every((t) => t.label.startsWith('ILLUSTRATIVE')), c.id)
    const refuses = (alter: (x: any) => void, pattern: RegExp) => {
        const x = copy(carriersRaw)
        alter(x)
        assert.throws(() => validateHandoffInputs(composedWith(x)), pattern)
    }
    const t = (x: any, id: string) => x.treatments.find((y: any) => y.id === id)
    // Re-pinned openly (stage B1): the bites read the two treatments that remain (TT-IL-ORIGIN and TT-ORIGIN-NO-FURTHER-VALUE are retired); the
    // third bite gives carriers to a treatment of another kind (was TT-ORIGIN-NO-FURTHER-VALUE, a REPLACE_DECLARATION).
    refuses((x) => (t(x, 'TT-IL-LINE').label = 'TEST-ONLY'), /ILLUSTRATIVE carriers belong only to ILLUSTRATIVE_CARRIERS/)
    refuses((x) => (t(x, 'TT-IL-LINE').carriers.groups = []), /ILLUSTRATIVE carriers belong only to ILLUSTRATIVE_CARRIERS/)
    refuses((x) => (t(x, 'TT-IL-PROGRESSION').kind = 'LAWS_CLASSIFICATION'), /ILLUSTRATIVE carriers belong only to ILLUSTRATIVE_CARRIERS/)
    refuses((x) => (x.cases[0].borrow = x.cases[0].borrow.filter((id: string) => id !== 'TT-CONSUMED-STEPS' && id !== 'TT-K2-RETAIN-FORM')), /ILLUSTRATIVE_CARRIERS adds to a draft store, only on a run that consumes Steps 1 and 2/)
})

// ---------------------------------------------------------------------------------------------------------------------------------------
// 4. The runs with the carriers on: the stop each reaches, and every label
// ---------------------------------------------------------------------------------------------------------------------------------------

const AWAITING = (item: string, fields: string[]) => fields.map((f) => `awaiting approved wording: value.primaryEvent.conditions[c:${C}:${item}].${f}`)

test('the runs (measured): rebased on the line and the typed progression referent, with the origin and control clauses carried by our CANDIDATE restatement, both stop at validation on W4\'s D3 (the line is placed from an end line only, so no position is stated relative to another element: PASS_VACUOUS), before LAW-11', () => {
    const r = (id: string) => made.results.get(id)!
    // RE-PINNED OPENLY (stage B1, 12 November 2026). BEFORE: A02-IL-1, A02-IL-2 and A02-IL-2r at communication, A02-IL-2L at validation on LAW-11.
    // AFTER: A02-IL-2 and A02-IL-2L at validation on GA-RELATIVE-PLACEMENT's 'every relative position holds of the realized geometry':
    // PASS_VACUOUS (W4's D3), DESIGN's expected stop for them. WHY: without the origin carriers' start placement (stated beyond the line) no
    // position of the game is stated relative to another element, so the realized-geometry clause holds of nothing; A02-HPE1 states the escaping
    // team's target beyond the line, and passes it (a02-hpe1.unit.ts).
    assert.deepEqual(RUNS.map((id) => [id, r(id).chain?.outcome, r(id).chain?.stage]), [
        ['A02-IL-2', 'refused', 'validation'],
        ['A02-IL-2L', 'refused', 'validation'],
    ])
    for (const id of RUNS) {
        assert.deepEqual(r(id).chain?.reasons.slice(0, 1), ['a post-realization gate did not validate'], id)
        assert.ok((r(id).chain?.reasons ?? [])[1]?.startsWith('GA-RELATIVE-PLACEMENT — "every relative position holds of the realized geometry": PASS_VACUOUS (no position in this game is stated relative to another element or to a team; 1 condition(s) beyond a typed line (c:restated:RPC-002:RPC-002-03.a beyond c:restated:RPC-002:IL-S2-1)'), JSON.stringify(r(id).chain?.reasons))
        assert.equal((r(id).chain?.reasons ?? []).some((x) => x.startsWith('awaiting approved wording') || x.includes('LAW-11')), false, `${id}: validation's own check stops it first`)
    }
})

test('every label: a line resting on a carrier is graded ILLUSTRATIVE (never DRAFT, never approved); the account lists carriers apart; the opening possession the START awards is entailed (the mechanism run); the rebased runs carry the category on the chain\'s contracts', () => {
    // Re-pinned openly (stage B1): BEFORE every carrier run had lines resting on carriers; AFTER the rebased runs stop at post-realization
    // validation (test 4), where the chain hands back no lines, so their carriers are read on the chain's contracts; the lines are read on the
    // mechanism run (A02-IL-1m, the retired A02-IL-1's composition over the 7dcb5d6 copy), which reaches communication.
    for (const id of RUNS) {
        const a = made.answers.get(id)!
        assert.deepEqual(made.results.get(id)!.lines, [], `${id}: no lines are handed back at a post-realization refusal`)
        assert.ok(a.contracts.filter((c) => c.contractId === C).every((c) => c.items.filter((i) => i.itemId.startsWith('IL-')).length === 4 && c.items.filter((i) => i.itemId.startsWith('IL-')).every((i) => i.category === ILLUSTRATIVE)), `${id}: the chain's contracts carry the category`)
    }
    for (const id of [MECHANISM]) {
        const r = made.results.get(id)!
        const resting = r.lines.filter((l) => l.premises.some((p) => p.ref.includes(' IL-')))
        assert.ok(resting.length > 0, `${id}: lines rest on carriers`)
        for (const l of resting) for (const p of l.premises.filter((x) => x.ref.includes(' IL-'))) assert.deepEqual([p.kind, p.standing, p.label.startsWith('ILLUSTRATIVE')], ['ILLUSTRATIVE_ITEM', 'ILLUSTRATIVE', true], `${id} ${l.lineId}`)
        const x = r.consumption!
        assert.ok(!x.draftItemsDerived.some((i) => i.includes(' IL-')), `${id}: no carrier is listed as a draft restatement`)
        assert.ok((x.illustrativeItemsDerived ?? []).length > 0 && x.illustrativeItemsDerived!.every((i) => i.endsWith('(ILLUSTRATIVE)')), `${id}: the carriers are listed apart`)
        const a = made.answers.get(id)!
        assert.ok(a.contracts.filter((c) => c.contractId === C).every((c) => c.items.filter((i) => i.itemId.startsWith('IL-')).every((i) => i.category === ILLUSTRATIVE)), `${id}: the chain's contracts carry the category`)
    }
    // On the mechanism run: the opening possession its START awards is entailed, the illustrative episode scope read on the carried origin, and
    // the origin's value line established nothing (the TEST-ONLY declaration, not ruled), all as A02-IL-2 read them before stage B1.
    const r = made.results.get(MECHANISM)!
    const ps1 = r.lines.find((l) => l.lineId === 'game::PS1')
    assert.ok(ps1 && ps1.kind !== 'CHOICE' && ps1.value === 'TEAM_AT_AXIS_START' && ps1.premises.some((p) => p.ref.includes('IL-T2-1')), JSON.stringify(ps1))
    const referent = r.lines.find((l) => l.lineId === `c:${C}:IL-02.a::V5`)
    assert.deepEqual([referent?.kind, (referent?.value as any)?.beginsEpisodeOf, (referent?.value as any)?.whileState], ['DERIVED', 'ILLUSTRATIVE_PRESSURE_SEQUENCE', [{ structuralRef: { contractId: C, itemId: 'IL-P8-1' } }]])
    assert.equal(r.lines.find((l) => l.lineId === `c:${C}:IL-02.a::V6`)?.kind, 'NOT_ESTABLISHED')
})

test(`the safeguards: a clause resting on a carrier reads CARRIED_UNDER_ILLUSTRATION, never CARRIED (the mechanism run); the rebased runs, refused after realization with no lines handed back, read every clause CITED_NOT_CARRIED (re-pinned, stage B1)`, () => {
    // RE-PINNED OPENLY (stage B1, 12 November 2026). BEFORE: A02-IL-2 read origin CARRIED_UNDER_ILLUSTRATION, progression CARRIED_UNDER_ILLUSTRATION,
    // control CARRIED_UNDER_TREATMENT, and A02-IL-2r control CARRIED_UNDER_ILLUSTRATION. AFTER: A02-IL-2 stops at post-realization validation and
    // hands back no lines, so the safeguards (which read lines) read every clause CITED_NOT_CARRIED (a detected disconnection, never a pass); the
    // carriers' verdicts are read on the mechanism run (the retired A02-IL-1's composition over the 7dcb5d6 copy). A02-IL-2r is retired.
    const scoring = (id: string) => ({
        contractId: C,
        rowId: 'RPC-PROP-133',
        clauses: [
            { clause: 'origin', items: id === MECHANISM ? ['IL-02.a', 'IL-02.b'] : ['RPC-002-02.a', 'RPC-002-02.b'] },
            { clause: 'progression', items: ['RPC-002-03.a', 'IL-03.b', 'RPC-002-03.c'] },
            { clause: 'control', items: ['RPC-002-04.a', 'RPC-002-04.b'] },
        ],
    })
    const findings = (id: string) => ownershipOf(safeguardRunOf(made.results.get(id)!, made.answers.get(id)!, true, { authorizedSet: null, recordKind: 'NONE', scoring: scoring(id) })).filter((f) => f.row === 'SCORING')
    const verdicts = (id: string) => {
        const found = findings(id)
        if (found.some((f) => f.verdict === 'CITED_NOT_CARRIED')) quiet(found.map((f) => `    ${f.clause}: ${f.verdict}: ${f.why}`).join('\n'))
        return found.map((f) => [f.clause, f.verdict])
    }
    assert.deepEqual(verdicts('A02-IL-2'), [['origin', 'CITED_NOT_CARRIED'], ['progression', 'CITED_NOT_CARRIED'], ['control', 'CITED_NOT_CARRIED']])
    assert.deepEqual(verdicts(MECHANISM), MECHANISM_VERDICTS)
    // Bite (in-test): the same run read with the carriers' category removed from the chain's answer would read the clauses otherwise.
    const a = copy(made.answers.get(MECHANISM)!)
    for (const c of a.contracts) for (const i of c.items) if (i.category === ILLUSTRATIVE) i.category = 'DRAFT_KNOWLEDGE'
    const blind = ownershipOf(safeguardRunOf(made.results.get(MECHANISM)!, a, true, { authorizedSet: null, recordKind: 'NONE', scoring: scoring(MECHANISM) })).filter((f) => f.row === 'SCORING')
    assert.ok(blind.every((f) => f.verdict !== 'CARRIED_UNDER_ILLUSTRATION'), 'without the category the illustration is not seen: the verdict reads the category, nothing else')
})

test(`the report of the carrier runs: every premise resting on a carrier is printed ILLUSTRATIVE, class 5, never DRAFT; double quotation marks only around Christian's words; no gendered pronoun`, () => {
    const text = handoffReportText([...made.results.values()], inputs, [])
    const lines = text.split('\n')
    const carrierPremises = lines.filter((l) => l.includes(`${C} IL-`) && l.includes(': class '))
    assert.ok(carrierPremises.length > 0, 'the report prints the carriers')
    for (const l of carrierPremises) assert.ok(l.includes('class 5') && l.includes('a TEST-ONLY carrier, not knowledge') && !l.includes('DRAFT knowledge'), l)
    const words = new Set(inputs.rulings.flatMap((r) => r.words))
    for (const s of quotedSpans(text)) assert.ok(words.has(s), `a double-quoted span that is not Christian's words: ${s}`)
    const hit = lines.findIndex((l) => holdsGenderedPronoun(l))
    assert.equal(hit, -1, `a gendered pronoun at line ${hit + 1}: ${lines[hit]}`)
})

// ---------------------------------------------------------------------------------------------------------------------------------------
// 5. The new clauses on the chain's own Gate A, and their negative controls
// ---------------------------------------------------------------------------------------------------------------------------------------

function buildWith(base: string, file: string | null, change?: (r: ChainRequest) => void): { answer: ChainAnswer; gates: any[] } {
    const request = copy(made.requests.get(base)!)
    if (file) for (const t of request.illustrative ?? []) t.file = file
    if (change) change(request)
    const answer = realChain.build(request)
    return { answer, gates: copy(gateA) }
}

test('U2 b1 (on the mechanism run A02-IL-1m, over the 7dcb5d6 copy): the state clause PASSES on the carried origin, and FAILS on a placement timed INITIAL; without START the reach FAILS; a possession change is never a starter', () => {
    // Re-pinned openly (stage B1): BEFORE read on the case A02-IL-1; AFTER on the same composition over the 7dcb5d6 copy (A02-IL-1m; the case is
    // retired). Measured: the same verdicts as before, and the run reaches communication as A02-IL-1 did.
    assert.deepEqual([made.results.get(MECHANISM)?.chain?.outcome, made.results.get(MECHANISM)?.chain?.stage], ['refused', 'communication'])
    gateA = made.gates.get(MECHANISM)!
    assert.equal(clauseOf('GA-EPISODE-REACHABLE', WHILE_STATE_CLAUSE), 'PASS')
    assert.equal(gateA.find((c) => c.checkId === 'GA-EPISODE-REACHABLE')?.verdict, 'PASS')
    assert.ok(whyOf('GA-EPISODE-REACHABLE').includes('c:restated:RPC-002:IL-T1-1: START') && whyOf('GA-EPISODE-REACHABLE').includes('(a possession change begins an attacking episode, never a build-out one)'), whyOf('GA-EPISODE-REACHABLE'))
    // Without the state (A01's begin condition, every production game, and every A02 run now): the clause is absent.
    gateA = made.gates.get('A02-IL-2')!
    assert.equal(clauseOf('GA-EPISODE-REACHABLE', WHILE_STATE_CLAUSE), 'ABSENT')
    // Negative control: the placement timed INITIAL holds at the start only: the state clause FAILS and the run is refused at structure.
    const initial = buildWith(MECHANISM, carriersCopy((raw) => (itemOf(raw, 'IL-P10a-1').value = 'INITIAL')))
    gateA = initial.gates
    assert.equal(clauseOf('GA-EPISODE-REACHABLE', WHILE_STATE_CLAUSE), 'FAIL')
    assert.deepEqual([initial.answer.outcome, initial.answer.stage], ['refused', 'structure'])
    assert.ok(whyOf('GA-EPISODE-REACHABLE').includes('is timed INITIAL: it holds at the start only'), whyOf('GA-EPISODE-REACHABLE'))
    // Negative control: without the START carrier no transition begins the episode: the reach clause FAILS.
    const noStart = buildWith(MECHANISM, null, (r) => {
        r.illustrative = r.illustrative!.map((t) => ({ ...t, groups: t.groups.filter((g) => g !== 'IL-START') }))
        r.choices = r.choices.filter((c) => !c.lineId.includes('IL-T1-1'))
    })
    gateA = noStart.gates
    assert.equal(clauseOf('GA-EPISODE-REACHABLE', 'every condition authored for an episode has a transition that can begin that episode'), 'FAIL')
    assert.deepEqual([noStart.answer.outcome, noStart.answer.stage], ['refused', 'structure'])
})

test(`U2 b2: a progression condition 'beyond' a typed line: owed before realization and met after it; on GF2's end-line targets no target can lie short of a line inside the area (measured, a limit); FAILS on a referent typed to the target itself (C54); open text is carried as words only`, () => {
    gateA = made.gates.get('A02-IL-2')!
    assert.equal(clauseOf('GA-RELATIVE-PLACEMENT', BEYOND_LINE_CLAUSE), 'DEFERRED_TO_REALIZATION')
    // After realization it held: a failing (or still owed) clause refuses at validation, and the run's validation refusal (test 4, re-pinned at
    // stage B1) names another clause of the check, never this one.
    assert.ok(!(made.results.get('A02-IL-2')!.chain?.reasons ?? []).some((x) => x.includes(BEYOND_LINE_CLAUSE)))
    // MEASURED, a limit of the geometry (not a pass): GF2's targets are its end lines, so every line inside the area has both teams' targets at or
    // past it; a target short of the line is not constructible on GF2 (the line on an end line still holds, 'at or past'). The comparison is
    // shown live by the code bite (W4 report, bite b2-geometry), and the symmetric arrangement is Q-structure's.
    const onEnd = buildWith('A02-IL-2', carriersCopy((raw) => (itemOf(raw, 'IL-S5-1').value = { term: 'own end (of team T)', forTeam: 'TEAM_AT_AXIS_END', offsetM: { from: 0, to: 0 }, asAuthored: 'ILLUSTRATIVE: a negative control, on the far end line' })))
    assert.ok(!onEnd.answer.reasons.some((x) => x.includes(BEYOND_LINE_CLAUSE)), JSON.stringify(onEnd.answer.reasons))
    // Negative control: the referent typed to a target itself (GF2's objective region), never the pressing line (C54): refused at validation.
    const target = buildWith('A02-IL-2', carriersCopy((raw) => (itemOf(raw, 'IL-03.b').value = { structuralRef: { contractId: 'restated:GF2', itemId: 'GF2-03.f' }, asAuthored: 'ILLUSTRATIVE: a target (a negative control)' })))
    // Measured: the objectives are held before realization, so the clause decides C54 there, at structure.
    gateA = target.gates
    assert.deepEqual([target.answer.outcome, target.answer.stage, clauseOf('GA-RELATIVE-PLACEMENT', BEYOND_LINE_CLAUSE)], ['refused', 'structure', 'FAIL'], JSON.stringify(target.answer.reasons))
    assert.ok(whyOf('GA-RELATIVE-PLACEMENT').includes('C54: the progression reference is not the target'), whyOf('GA-RELATIVE-PLACEMENT'))
    // Open text: on the mechanism run (progression withheld) and on every A02 run of the open text, no condition is beyond a typed line, so the
    // clause is absent: carried as words only.
    gateA = made.gates.get(MECHANISM)!
    assert.equal(clauseOf('GA-RELATIVE-PLACEMENT', BEYOND_LINE_CLAUSE), 'ABSENT')
})

// ---------------------------------------------------------------------------------------------------------------------------------------
// 6. No production module reaches the carriers
// ---------------------------------------------------------------------------------------------------------------------------------------

test('the static scan: the carriers, their loader, their composition and their treatment kind are named by no production module; no production knowledge writes a state or an ILLUSTRATIVE scope', () => {
    const SRC = path.resolve(HERE, '..', '..')
    const files: string[] = []
    const walk = (dir: string) => {
        for (const name of fs.readdirSync(dir)) {
            const full = path.join(dir, name)
            if (fs.statSync(full).isDirectory()) walk(full)
            else if (name.endsWith('.ts') && !name.endsWith('.unit.ts')) files.push(full)
        }
    }
    walk(SRC)
    // The TEST-ONLY modules that may name them: the draft store (no production module imports it, pinned elsewhere), the review pathway's
    // handoff (imported only by unit files and the review pathway), and the engine readers that only read a category or a scope's spelling.
    const allowed = new Set(['derivation/draft-store.ts', 'design-reasoning/handoff.ts'].map((f) => path.join(SRC, 'system', f)))
    for (const word of ['loadIllustrativeCarriers', 'withIllustrativeCarriers', 'ILLUSTRATIVE_CARRIERS', 'a02-illustrative']) {
        const naming = files.filter((f) => !allowed.has(f) && fs.readFileSync(f, 'utf8').includes(word)).map((f) => path.relative(SRC, f))
        assert.deepEqual(naming, [], `${word} is named by: ${naming.join(', ')}`)
    }
    // No production knowledge file writes a state, an ILLUSTRATIVE scope or the ILLUSTRATIVE category.
    const knowledge = ['contracts.json', 'corpus-restatements.json', 'provisional-realizations.json', 'sport-profile-soccer.json'].map((f) => path.join(WT, 'docs', 'audits', 'conformance', 'stage-b', f))
    for (const f of [...knowledge, path.join(WT, 'docs', 'audits', 'conformance', 'register-2026-09-18.json')]) {
        const text = fs.readFileSync(f, 'utf8')
        assert.ok(!text.includes('"whileState"') && !text.includes('ILLUSTRATIVE_PRESSURE') && !text.includes('"category": "ILLUSTRATIVE"'), path.basename(f))
    }
})

test('registered', () => {
    const registry = readJson(path.resolve(HERE, '..', '..', '..', 'scripts', 'unit-tests.json')) as string[]
    assert.ok(registry.includes('./src/system/design-reasoning/a02-carriers.unit.ts'))
})

if (MAIN) quiet(`a02 carriers (W4): ${passed} passed`)
