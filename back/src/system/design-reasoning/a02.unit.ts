/**
 * **The isolated A02 foundational test, slice S2: High Press Escape's CANDIDATE executable interpretation and the A02 cases**, run through
 * the review pathway's handoff with Steps 1 and 2 consumed by the checked chain (slice S1) — Christian's authorization, the reply about A02
 * pasted 10 November 2026 (stage 9; DESIGN-9 section 2). TEST-ONLY review evidence: nothing here is served, written to production knowledge, or an authorization.
 *
 * The data: the review data file `a02-inputs.review.json` (held to the handoff's own validator; its borrowed rulings and grading tables are
 * read from the handoff's data file, unchanged), the TEST-ONLY draft store folder `docs/audits/drafts/a02-composition` (our CANDIDATE
 * restatement of RPC-002's approved scoring events, primary scoring condition and two identity rows, and a DRAFT A02 record with no ruling
 * field filled and an empty set), and the handoff's chain wiring (`handoff-chain.unit.ts`, the same wiring the handoff's own test runs).
 *
 * What is pinned, every value measured first (the slice's notes give the measurement):
 *   - the draft store folder is admitted whole by the store's own gate, and its gate refuses a copy whose quotation is not verbatim, whose
 *     condition items are gone, or whose record claims a ruling; nothing of it is in production knowledge;
 *   - the review data's new treatment kinds are held to the validator (each defect refuses the file);
 *   - A02-0 (the knowledge as it stands): Steps 1 and 2 run by the handoff and consumed by the chain, refused at structure on our
 *     restatement's own two lines, RESTATEMENT-ONLY; the same case with the handoff placing the form instead (no consumption) reaches the same
 *     refusal over the chain's own pick of another form, so the consumption, not the refusal, is what S1 changed;
 *   - A02-1, A02-1b, A02-2 (each with labelled TEST-ONLY treatments, never the A02 configuration): structure on the control line; validation
 *     on LAW-11 under our DRAFT classification; communication (no approved wording for the condition);
 *   - A02-D (diagnostic): plain GF2, which the chain would serve: structural compatibility only, not representative sufficiency;
 *   - on every run the chain's own account recorded the consumption, nothing was placed, the selection hook only observed, and a structure
 *     refusal carries the chain's own account behind it;
 *   - the wiring refuses a consuming request that places anything, and a declaration treatment naming a declaration the contract does not hold;
 *   - the report's sections (`foundational-test.ts`): the runs and what each refusal rests on, the CANDIDATE mapping line, each restated item
 *     in three columns, the UNRESOLVED list, the smallest-source questions, the Essential Representative Relationships; double quotation marks
 *     only around Christian's words, no gendered pronoun; generated twice, identical.
 * The evidence folder (DESIGN section 7) is a02-evidence.unit.ts's, which imports this file's data (`inputs`, `items`, `experiment`); imported,
 * this file runs none of its tests (they run only when the file itself is run). The report is generated here and compared in memory; under
 * A02_REPORT_OUT=<file> it is also written to that file, for reading only.
 *
 * Run: node node_modules/ts-node/dist/bin.js --files -r tsconfig-paths/register ./src/system/design-reasoning/a02.unit.ts
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { DraftStoreRefused, loadDraftStore } from '../derivation/draft-store'
import { learningGoalAuthorizations } from '../test-library/learning-goal-authorizations'
import { foundationalTestText, RestatedItem, validateFoundationalTest } from './foundational-test'
import { ChainAnswer, ChainRequest, HandoffChain, HandoffInputs, HandoffResult, runHandoff, runHandoffCases, validateHandoffInputs } from './handoff'
import { holdsGenderedPronoun, realChain } from './handoff-chain.unit'
import { handoffReportText } from './handoff-report'
import { committedKnowledge } from './knowledge'
import { runStage1 } from './stage1'

const quiet = console.log
console.log = (...args: unknown[]) => {
    if (typeof args[0] === 'string' && args[0].startsWith('[selection-search]')) return
    quiet(...args)
}
let passed = 0
/** Run itself (npm test runs it so), the tests run; imported (by a02-evidence.unit.ts, for the data below), none does (B4). */
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
if (MAIN) quiet(`the isolated A02 foundational test, slice S2 (Christian's authorization: the reply about A02, pasted 10 November 2026)`)

const HERE = __dirname
const WT = path.resolve(HERE, '..', '..', '..', '..')
const DRAFTS = path.join(WT, 'docs', 'audits', 'drafts')
const STORE = 'a02-composition'
const CONTRACT = 'restated:RPC-002'
const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const readJson = (file: string): any => JSON.parse(fs.readFileSync(file, 'utf8'))

const handoffData = readJson(path.join(HERE, 'handoff-inputs.review.json'))
const raw = readJson(path.join(HERE, 'a02-inputs.review.json'))
/** The review data as the handoff's validator sees it: the borrowed rulings and grading tables read from the handoff's own data, unchanged. */
const composed = (data: any = raw) => ({
    standing: data.standing,
    rulings: [...data.borrowed.rulings.map((id: string) => handoffData.rulings.find((r: { id: string }) => r.id === id)), ...data.rulings],
    cases: data.cases,
    grading: handoffData.grading,
})
export const inputs: HandoffInputs = validateHandoffInputs(composed())
const store = loadDraftStore(STORE)
const contract = store.contracts.find((c) => c.contractId === CONTRACT)
assert.ok(contract, `the draft store holds ${CONTRACT}`)
export const items: RestatedItem[] = contract.items.map((i: any) => ({
    itemId: String(i.itemId),
    row: String(i.row),
    selector: String(i.selector),
    requirement: String(i.requirement),
    value: copy(i.value),
    basis: String(i.basis),
    scope: String(i.scope),
    checkability: String(i.checkability),
    basisEvidence: String(i.basisEvidence ?? ''),
    sources: ((i.source ?? []) as any[]).map((s) => ({ rowId: String(s.rowId).split(' ')[0], table: String(s.table), line: Number(s.line) })),
}))
export const experiment = validateFoundationalTest(raw.experiment, inputs, items)
const k = committedKnowledge()

/** Every case through the handoff and the real chain, each request and answer captured (the answer's own account is read by test 8). */
function runAll(): { results: HandoffResult[]; requests: Map<string, ChainRequest>; answers: Map<string, ChainAnswer> } {
    const requests = new Map<string, ChainRequest>()
    const answers = new Map<string, ChainAnswer>()
    const capture: HandoffChain = {
        build: (r) => {
            const a = realChain.build(r)
            requests.set(r.caseId, copy(r))
            answers.set(r.caseId, a)
            return a
        },
    }
    return { results: runHandoffCases(inputs, capture, k), requests, answers }
}
let made: ReturnType<typeof runAll> | null = null
const once = () => (made ??= runAll())
const byCase = (id: string): HandoffResult => {
    const r = once().results.find((x) => x.caseId === id)
    assert.ok(r, id)
    return r
}
/**
 * The double-quoted spans of a text: Christian's words holding a straight quotation mark are printed in typographic ones (handoff-report.ts
 * `quoted`), so each typographic span is read whole and set aside first; the straight ones must then pair. Throws where either does not pair.
 */
export function quotedSpans(text: string): string[] {
    const OPEN = String.fromCharCode(0x201c)
    const CLOSE = String.fromCharCode(0x201d)
    const STRAIGHT = String.fromCharCode(34)
    const typographic: string[] = []
    const rest = text
        .split(OPEN)
        .map((part, n) => {
            if (n === 0) return part
            const end = part.indexOf(CLOSE)
            assert.ok(end >= 0, 'typographic quotation marks pair')
            typographic.push(part.slice(0, end))
            return part.slice(end + 1)
        })
        .join('')
    assert.equal(rest.indexOf(CLOSE), -1, 'typographic quotation marks pair')
    const parts = rest.split(STRAIGHT)
    assert.ok(parts.length % 2 === 1, 'quotation marks pair')
    return [...typographic, ...parts.filter((_, n) => n % 2 === 1)]
}
const reportOf = (results: HandoffResult[]): string =>`${[...foundationalTestText(results, inputs, experiment, items), handoffReportText(results, inputs, [])].join('\n')}`

const STRUCTURE = ['Gate A is FAIL', 'a pre-realization Gate A invariant fails: GA-NO-FAILED-LINE']
const CONTROL_LINE = 'c:restated:RPC-002:RPC-002-04.a::V5'
const ORIGIN_LINE = 'c:restated:RPC-002:RPC-002-02.a::V6'
const SCORER_LINE = `consumption run: the chain's scorer ranked only GF2 (read from SELECTION_TRACE_RANKING), its candidate forms filtered to Step 2's GF2; the handoff placed no form`
const FINDING = 'OURS: no manipulation has an authorized relationship to RPC-002 and GP-015 in held knowledge; not an authorization of zero and not evidence that GF2 alone is sufficient'

// ---------------------------------------------------------------------------------------------------------------------------------------
// 1. The draft store folder
// ---------------------------------------------------------------------------------------------------------------------------------------

test('the TEST-ONLY draft store folder: admitted whole by its own gate; every item quotes its approved row verbatim (the gate refuses a copy that does not); the DRAFT record claims no ruling; nothing of it is in production knowledge', () => {
    assert.deepEqual([store.files, store.notRead, store.contracts.map((c) => c.contractId)], [['a02-authorization.DRAFT.json', 'rpc-002-contract.DRAFT.json'], [], [CONTRACT]])
    assert.equal(store.records.length, 1)
    const record = store.records[0] as any
    assert.deepEqual(
        [record.learningGoalId, record.contextId, record.gameProblemId, record.knowledgeStatus, record.ruledOn, record.by, record.ruling, record.authorizedConstraints, record.authorizedConstraintsFinding],
        ['A02', 'RPC-002', 'GP-015', 'DRAFT', '', '', [], [], FINDING],
    )
    // The restatement, item by item (measured): the four approved events in the approved order (the intersection with the form's own is made at
    // realization, never written here); the three clauses as conditions of type origin, progression and control with the verbatim values; the
    // two expressible identity rows outside the boundary. No item restates RPC-REL-002 as a team count: measured, every run's outcome is
    // identical with and without it, so it is dropped (D1-12). No item holds the count of primary events (RPC-002-01.b, V0 COUNT 1, ASSUMED from
    // SD-06): measured in review (batch A2), the five cases, every quota run and every safeguard run are identical without it but for the item's
    // own presence, so it is dropped by the same rule (the smallest interpretation Christian asked for); every item now quotes the row it restates.
    assert.deepEqual(
        contract!.items.map((i: any) => [i.itemId, i.row, i.selector, i.requirement, i.value, i.basis, i.category]),
        [
            ['RPC-002-01.a', 'V1', '*', 'EQUALS', ['line_crossed', 'target_zone_entered', 'gate', 'target_player'], 'AUTHORED', 'DRAFT_KNOWLEDGE'],
            ['RPC-002-02.a', 'V3', 'type=origin', 'EXISTS', 'N/A', 'AUTHORED', 'DRAFT_KNOWLEDGE'],
            ['RPC-002-02.b', 'V5', 'type=origin', 'EQUALS', 'established coordinated pressure', 'AUTHORED', 'DRAFT_KNOWLEDGE'],
            ['RPC-002-03.a', 'V3', 'type=progression', 'EXISTS', 'N/A', 'AUTHORED', 'DRAFT_KNOWLEDGE'],
            ['RPC-002-03.b', 'V5', 'type=progression', 'EQUALS', 'the pressing line', 'AUTHORED', 'DRAFT_KNOWLEDGE'],
            ['RPC-002-03.c', 'V6', 'type=progression', 'EQUALS', 'beyond', 'AUTHORED', 'DRAFT_KNOWLEDGE'],
            ['RPC-002-04.a', 'V3', 'type=control', 'EXISTS', 'N/A', 'AUTHORED', 'DRAFT_KNOWLEDGE'],
            ['RPC-002-04.b', 'V6', 'type=control', 'EQUALS', 'retains possession through the next action', 'AUTHORED', 'DRAFT_KNOWLEDGE'],
            ['RPC-002-05', 'P1', '*', 'EXISTS', 'an opposing team applying established coordinated high pressure, the defining condition (play)', 'AUTHORED', 'DRAFT_KNOWLEDGE'],
            ['RPC-002-06', 'P1', '*', 'EXISTS', 'pressure that meaningfully compresses time, space and available action (play)', 'AUTHORED', 'DRAFT_KNOWLEDGE'],
        ],
    )
    assert.ok(contract!.items.every((i: any) => i.scope === 'WHOLE_GAME'), 'every item is scoped WHOLE_GAME (OURS, over-applying)')
    assert.deepEqual(
        ((contract!.declarations ?? []) as any[]).filter((d) => d.declaration === 'UNDECLARED' || d.declaration === 'NOT_AUTHORED').map((d) => [d.row, d.selector, d.declaration]),
        [
            ['V4', '*', 'UNDECLARED'],
            ['V5', 'type=control', 'UNDECLARED'],
            ['V6', 'type=origin', 'NOT_AUTHORED'],
        ],
    )
    // The gate's bites, on TEST-ONLY copies of the folder in a temporary directory.
    const variant = (change: (contractFile: any, recordFile: any) => void): string => {
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'a02-store-'))
        const c = readJson(path.join(DRAFTS, STORE, 'rpc-002-contract.DRAFT.json'))
        const r = readJson(path.join(DRAFTS, STORE, 'a02-authorization.DRAFT.json'))
        change(c, r)
        fs.writeFileSync(path.join(dir, 'rpc-002-contract.DRAFT.json'), JSON.stringify(c, null, 2))
        fs.writeFileSync(path.join(dir, 'a02-authorization.DRAFT.json'), JSON.stringify(r, null, 2))
        try {
            loadDraftStore(dir)
            return 'ADMITTED'
        } catch (error) {
            assert.ok(error instanceof DraftStoreRefused, String(error))
            return (error as Error).message
        }
    }
    assert.equal(variant(() => undefined), 'ADMITTED', 'bite: an unchanged copy is admitted')
    const altered = variant((c) => {
        const origin = c.contractEntry.result.items.find((i: any) => i.id === 'RPC-002-02.a')
        origin.source[0].text = origin.source[0].text.split('established').join('sustained')
    })
    assert.ok(altered.includes('is not verbatim in the field property_text') || altered.includes('is not verbatim in the row it cites'), altered)
    const noCondition = variant((c) => {
        c.contractEntry.result.items = c.contractEntry.result.items.filter((i: any) => ['V3', 'V5', 'V6'].indexOf(i.row) < 0)
    })
    assert.ok(noCondition.includes('RPC-PROP-133 for RPC-002 is cited by no item constituting a scoring condition'), noCondition)
    const ruled = variant((_, r) => {
        r.record.by = 'Christian'
    })
    assert.ok(ruled.includes('the record gate refuses it as a draft'), ruled)
    // Nothing of it is in production knowledge.
    const conformance = path.join(WT, 'docs', 'audits', 'conformance', 'stage-b')
    for (const f of ['contracts.json', 'corpus-restatements.json']) {
        const text = fs.readFileSync(path.join(conformance, f), 'utf8')
        assert.ok(!text.includes(CONTRACT) && !text.includes('RPC-002-01.a'), `${f} holds none of the restatement`)
    }
    assert.equal(learningGoalAuthorizations().some((r) => r.learningGoalId === 'A02'), false, 'A02 has no production record')
})

// ---------------------------------------------------------------------------------------------------------------------------------------
// 2. The review data
// ---------------------------------------------------------------------------------------------------------------------------------------

test(`the review data: held to the handoff's own validator with its borrowed rulings and grading tables, read unchanged; each new treatment kind's defect refuses the file`, () => {
    for (const id of raw.borrowed.rulings) assert.deepEqual(inputs.rulings.find((r) => r.id === id), handoffData.rulings.find((r: { id: string }) => r.id === id), id)
    assert.deepEqual(inputs.grading, handoffData.grading)
    assert.deepEqual(inputs.cases.map((c) => c.id), experiment.runOrder)
    const refuses = (alter: (x: any) => void, pattern: RegExp) => {
        const x = copy(raw)
        alter(x)
        assert.throws(() => validateHandoffInputs(composed(x)), pattern)
    }
    // The reply about A02 was pasted without its mail header: each of its rulings keeps the ISO date (the paste date) and is marked so, with the
    // name a citation gives it; the marker is closed, and it and the name come together (each defect refuses the file).
    assert.deepEqual(inputs.rulings.filter((r) => r.dateBasis).map((r) => [r.id.split('-').slice(0, 2).join('-'), r.dateBasis, r.citedAs, r.received]), inputs.rulings.filter((r) => r.id.indexOf('A02-10NOV-') === 0).map(() => ['A02-10NOV', 'PASTED_WITHOUT_HEADER', 'reply about A02', '2026-11-10']))
    assert.equal(inputs.rulings.filter((r) => r.dateBasis).length, 11)
    const authorization = (x: any) => x.rulings.find((r: any) => r.id === 'A02-10NOV-AUTHORIZATION')
    refuses((x) => (authorization(x).dateBasis = 'RECEIVED'), /dateBasis is PASTED_WITHOUT_HEADER or absent/)
    refuses((x) => delete authorization(x).citedAs, /a dateBasis and the name a citation gives the reply \(citedAs\) come together/)
    refuses((x) => delete authorization(x).dateBasis, /a dateBasis and the name a citation gives the reply \(citedAs\) come together/)
    refuses((x) => (authorization(x).citedAs = ' '), /a dateBasis and the name a citation gives the reply \(citedAs\) come together/)
    const treatment = (x: any, caseIndex: number, id: string) => x.cases[caseIndex].testOnlyTreatments.find((t: any) => t.id === id)
    refuses((x) => delete treatment(x, 2, 'TT-CONTROL-NO-FURTHER-VALUE').declaration, /replaces a declaration: it names its contract and the declaration/)
    refuses((x) => (treatment(x, 2, 'TT-CONTROL-NO-FURTHER-VALUE').itemIds = ['RPC-002-04.a']), /replaces a declaration: it names its contract and the declaration/)
    refuses((x) => (treatment(x, 2, 'TT-LAWS-DRAFT').declaration = { row: 'V5', selector: '*', from: 'A', to: 'B' }), /names a declaration, and only REPLACE_DECLARATION replaces one/)
    refuses((x) => (treatment(x, 0, 'TT-DRAFT-STORE').standIn = { law: 'LAW-11', materiality: 'PROCEDURAL' }), /a stand-in for one law's materiality belongs only to LAWS_CLASSIFICATION/)
    refuses((x) => (treatment(x, 3, 'TT-LAW-11-STAND-IN').standIn.materiality = 'MINOR'), /a stand-in for one law's materiality belongs only to LAWS_CLASSIFICATION/)
    refuses((x) => x.cases[0].testOnlyTreatments.push({ ...treatment(x, 0, 'TT-CONSUMED-STEPS'), id: 'TT-CONSUMED-AGAIN' }), /CONSUMED_STEPS and LAWS_CLASSIFICATION are each declared at most once/)
    refuses((x) => (x.cases[0].form = { named: 'GF2', basis: 'LOGICAL_INFERENCE', rulingRefs: [], why: 'w' }), /CONSUMED_STEPS consumes Step 2's SELECTED form/)
    refuses((x) => (x.cases[0].proposedManipulations = [{ id: 'PM-X', purpose: 'p', manipulation: 'm', relationship: { ref: 'R', label: 'TEST ASSUMPTION', why: 'w' } }]), /a case that consumes Steps 1 and 2 places no manipulation/)
    refuses((x) => (x.cases[0].realization = { id: 'X', by: 'Christian', rulingRefs: [], departures: [], lawsCheck: { mode: 'REPORT', rulingRefs: [], treatmentRef: 'TT-LAWS-DRAFT', because: 'b' } }) && x.cases[0].testOnlyTreatments.push(copy(treatment(x, 2, 'TT-LAWS-DRAFT'))), /LAWS_CLASSIFICATION is not declared beside a TEST-ONLY realization's check/)
})

// ---------------------------------------------------------------------------------------------------------------------------------------
// 3. The cases, each measured and pinned
// ---------------------------------------------------------------------------------------------------------------------------------------

/** What every run shares (measured): Steps 1 and 2 by the handoff, the form SELECTED by Step 2 and consumed, the chain's own Game Problem reading beside Step 1's. */
function sharedOf(r: HandoffResult): void {
    assert.deepEqual([r.receive.step1?.status, r.receive.step1?.basis, r.receive.step1?.primary, r.receive.step1?.contextId], ['RESOLVED', 'APPROVED_TRANSLATION', ['GP-015'], 'RPC-002'], r.caseId)
    assert.deepEqual([r.receive.step2?.status, r.receive.step2?.selected, r.receive.step2?.compatible], ['SELECTED', 'GF2', ['GF2']], r.caseId)
    assert.deepEqual([r.form.decision, r.form.formId, r.form.premise?.sixClass, r.form.premise?.label], ['SELECTED_BY_STEP_2', 'GF2', 3, 'CANDIDATE'], r.caseId)
    assert.equal(r.chain?.scorerPick, SCORER_LINE, r.caseId)
    assert.equal(r.chain?.contextComparison, `the chain's context equals Step 1's (RPC-002)`, r.caseId)
    assert.equal(r.chain?.gameProblemComparison, `the chain's account reads APPROVED GP-015 'Maintain Possession' (inferred from wording: GP-015 'Maintain Possession'); Step 1: primary GP-015, secondary none; no line of the chain reads a Game Problem; a difference is reported, never switched`, r.caseId)
    assert.deepEqual(r.chain?.constraints, [], r.caseId)
    const x = r.consumption
    assert.ok(x, `${r.caseId}: the chain recorded a consumption`)
    assert.deepEqual(x.gameProblem, { gameProblemId: 'GP-015', basis: 'APPROVED_TRANSLATION', label: 'as resolved by Step 1 (review pathway)', source: 'Step 1 (review pathway)' }, r.caseId)
    assert.deepEqual([x.form?.formId, x.form?.cells.find((c) => c.cell.endsWith('game_forms GF2'))?.grade, x.formCandidatesScored, x.formCandidatesFrom, x.constraintAuthority, x.constraintCandidateIds, x.sizeRuleBypassed, x.selectionObservedOnly, x.draftStatus], ['GF2', 'CANDIDATE', ['GF2'], 'SELECTION_TRACE_RANKING', 'AUTHORIZATION_RECORD', [], false, true, 'BUILT_FROM_DRAFT_KNOWLEDGE_NOT_APPROVED'], r.caseId)
    assert.deepEqual(r.notCarried.map((n) => n.id), ['UN-ORIGIN', 'UN-PRESSING-LINE', 'UN-CONTROL-REFERENT', 'UN-SCOPE', 'UN-WORDING', 'UN-RESTART-POSSESSION', 'UN-LAWS', 'UN-IDENTITY', 'UN-PRESSURE-CARRIER', 'UN-AFFORDANCE-TARGETS'], r.caseId)
}
const itemRefs = items.map((i) => `${CONTRACT} ${i.itemId}`)
const withoutOriginProgression = itemRefs.filter((x) => ['02.a', '02.b', '03.a', '03.b', '03.c'].every((s) => !x.endsWith(`RPC-002-${s}`)))

test(`A02-0, the knowledge as it stands: Steps 1 and 2 by the handoff and consumed by the chain; refused at structure on our restatement's own two lines (origin value, control referent); RESTATEMENT-ONLY; placed instead of consumed, the same refusal over the chain's own GF3`, () => {
    const r = byCase('A02-0')
    sharedOf(r)
    assert.deepEqual([r.resultStanding, r.chain?.outcome, r.chain?.stage], ['KNOWLEDGE_AS_IT_STANDS_WITH_A_CANDIDATE_RESTATEMENT', 'refused', 'structure'])
    assert.deepEqual(r.chain?.reasons, [...STRUCTURE, `2 unresolved properties are neither an authorized choice nor an authorized claim: ${CONTROL_LINE}, ${ORIGIN_LINE}`])
    assert.deepEqual([r.refusalBasis?.verdict, r.refusalBasis?.mix, r.refusalBasis?.cited.map((c) => [c.ref, c.itemId, c.premiseKind]), r.refusalBasis?.gaps], ['RESTATEMENT-ONLY', '2 AUTHORED (DRAFT store item)', [[CONTROL_LINE, 'RPC-002-04.a', 'DRAFT_ITEM'], [ORIGIN_LINE, 'RPC-002-02.a', 'DRAFT_ITEM']], []])
    // Which declaration owes each line (the chain's own reach and scope, read by the handoff): V5 by the form's NOT_AUTHORED applied row-wide
    // (our restatement leaves the control referent UNDECLARED); V6 by our restatement's own NOT_AUTHORED on the origin value.
    assert.match(r.refusalBasis?.cited[0].owedBy ?? '', /^the requirement declaration reaching the element: restated:GF2 NOT_AUTHORED \(\*\), a declaration of another contract; applied row-wide/)
    assert.equal(r.refusalBasis?.cited[1].owedBy, 'the requirement declaration reaching the element: restated:RPC-002 NOT_AUTHORED (type=origin), a declaration of the contract establishing the element')
    assert.deepEqual([r.lines.length, r.sentences.length, r.requirementAccount, r.laws], [0, 0, null, null])
    assert.deepEqual(r.consumption?.draftItemsDerived, itemRefs)
    assert.deepEqual(r.consumption?.draftShaped, [])
    // The bite: the same case without its consumption treatment goes the handoff's earlier way: the chain selects on its own (GF3, by its
    // keyword scorer) and the handoff PLACES Step 2's form over it; the refusal is the same, the provenance is not.
    const placedCase = copy(inputs.cases.find((c) => c.id === 'A02-0')!)
    placedCase.id = 'A02-0/placed'
    placedCase.testOnlyTreatments = placedCase.testOnlyTreatments.filter((t) => t.kind !== 'CONSUMED_STEPS')
    const placed = runHandoff(placedCase, inputs, realChain, k)
    assert.deepEqual([placed.chain?.outcome, placed.chain?.stage, placed.chain?.reasons], ['refused', 'structure', r.chain?.reasons])
    assert.equal(placed.chain?.scorerPick, `GF3 (the chain's own keyword-scorer pick: not used; the handoff placed GF2)`)
    assert.equal('consumption' in placed, false, 'no consumption is recorded on the placed route')
})

test('A02-1 (TEST-ONLY: origin and progression withheld): refused at structure on the control line alone, RESTATEMENT-ONLY', () => {
    const r = byCase('A02-1')
    sharedOf(r)
    assert.deepEqual([r.resultStanding, r.chain?.outcome, r.chain?.stage], ['TEST_ONLY_TREATMENT_NEVER_THE_A02_CONFIGURATION', 'refused', 'structure'])
    assert.deepEqual(r.chain?.reasons, [...STRUCTURE, `1 unresolved property is neither an authorized choice nor an authorized claim: ${CONTROL_LINE}`])
    assert.deepEqual([r.refusalBasis?.verdict, r.refusalBasis?.mix, r.refusalBasis?.cited.map((c) => c.ref)], ['RESTATEMENT-ONLY', '1 AUTHORED (DRAFT store item)', [CONTROL_LINE]])
    assert.equal(r.refusalBasis?.cited[0].owedBy, byCase('A02-0').refusalBasis?.cited[0].owedBy)
    assert.deepEqual(r.consumption?.draftItemsDerived, withoutOriginProgression)
})

test('A02-1b (TEST-ONLY: + the control referent declared NO_FURTHER_VALUE, the C55 analog, not ruled; the Laws held to our DRAFT classification): refused at validation on LAW-11, MATERIAL by our DRAFT reading; LAW-8 reported', () => {
    const r = byCase('A02-1b')
    sharedOf(r)
    assert.deepEqual([r.chain?.outcome, r.chain?.stage], ['refused', 'validation'])
    const reasons = r.chain?.reasons ?? []
    assert.equal(reasons.length, 3)
    assert.equal(reasons[0], `the sport's default-laws check (BY_MATERIALITY, [Christian's] reply filed 30 October 2026, item 4) holds this composed activity: 1 material adaptation is owed, which prevents approval`)
    assert.ok(reasons[1].startsWith('LAW-11 (Law 11 (Offside)) at the game: an adaptation is owed') && reasons[1].includes('[MATERIAL, as classified in docs/audits/drafts/laws-materiality.DRAFT.json'), reasons[1])
    assert.ok(reasons[2].startsWith('reported for review, not refused: LAW-8') && reasons[2].includes('[PROCEDURAL, as classified in docs/audits/drafts/laws-materiality.DRAFT.json'), reasons[2])
    assert.ok(reasons.every((x) => !holdsGenderedPronoun(x)), 'the chain\'s own sentences reach the result without a gendered pronoun')
    assert.deepEqual([r.refusalBasis?.verdict, r.refusalBasis?.why], ['NOT KNOWLEDGE', 'the refusal cites no item: an engine check (validation refusal)'])
    assert.deepEqual([r.laws?.mode, r.laws?.owed.map((o) => o.split(' ')[0]), r.laws?.reportedForReview.map((o) => o.split(' ')[0])], ['BY_MATERIALITY', ['LAW-8', 'LAW-11'], ['LAW-8']])
    assert.deepEqual(r.requirementAccount, { status: 'REPORT_ONLY', contract: 'DRAFT', components: [] })
    // A game was built (the refusal comes after it): the control condition's own lines rest on our restatement, and the approved events narrow
    // the event line, as the chain records on it.
    assert.deepEqual(r.lines.filter((l) => l.premises.some((p) => p.ref.startsWith(`${CONTRACT} `))).map((l) => [l.lineId, l.value, l.sixClass, l.label]), [
        ['c:restated:RPC-002:RPC-002-04.a::V4', 'control', 3, 'DRAFT knowledge (ours, unreviewed)'],
        ['c:restated:RPC-002:RPC-002-04.a::V6', 'retains possession through the next action', 3, 'DRAFT knowledge (ours, unreviewed)'],
    ])
    assert.deepEqual(r.consumption?.draftShaped, [{ lineId: 'game::V1', value: 'line_crossed', by: ['restated:RPC-002 RPC-002-01.a NARROWS'] }])
    assert.deepEqual([r.sentences.length, r.sentencesServed], [8, false])
})

test('A02-2 (TEST-ONLY: + the LAW-11 stand-in): refused at communication: no approved wording for the control condition, and no instruction carries it', () => {
    const r = byCase('A02-2')
    sharedOf(r)
    assert.deepEqual([r.chain?.outcome, r.chain?.stage], ['refused', 'communication'])
    const C = 'value.primaryEvent.conditions[c:restated:RPC-002:RPC-002-04.a]'
    assert.deepEqual(r.chain?.reasons, [
        `awaiting approved wording: ${C}.type (V4)`,
        `awaiting approved wording: ${C}.value (V6)`,
        `fidelity Q3: ${C}.type is established by the game and no instruction carries it`,
        `fidelity Q3: ${C}.value is established by the game and no instruction carries it`,
    ])
    assert.deepEqual([r.refusalBasis?.verdict, r.refusalBasis?.why], ['NOT KNOWLEDGE', 'the refusal cites no item: a renderer capability gap: the checked renderer has no sentence for what the game establishes (fidelity Q3)'])
    assert.deepEqual([r.laws?.owed.map((o) => o.split(' ')[0]), r.laws?.reportedForReview.map((o) => o.split(' ')[0])], [['LAW-8', 'LAW-11'], ['LAW-8', 'LAW-11']])
    assert.deepEqual([r.sentences.length, r.sentencesServed, r.chain?.fidelityViolations], [8, false, 2])
})

test('A02-D (diagnostic, TEST-ONLY: every condition item withheld, the LAW-11 stand-in): plain GF2, which the chain would serve: structural compatibility only, not representative sufficiency', () => {
    const r = byCase('A02-D')
    sharedOf(r)
    assert.deepEqual([r.resultStanding, r.chain?.outcome, r.refusal, r.refusalBasis], ['DIAGNOSTIC_STRUCTURAL_COMPATIBILITY_ONLY_NOT_REPRESENTATIVE_SUFFICIENCY', 'served', null, null])
    assert.deepEqual(
        r.sentences.map((s) => `[${s.section}] ${s.text}`),
        [
            '[Set up] Mark out an area 40 m long by 30 m wide',
            '[Set up] Mark both end lines: they are the scoring lines',
            '[Players] Divide 12 players into 2 teams of 6, with no goalkeepers',
            '[How it works] Pick which team starts with the ball and tell both teams before you start',
            '[How it works] When possession changes, play carries on without a stoppage, and each team keeps attacking the same line',
            '[How to score] A team scores 1 point by getting the ball across the line it is attacking',
            '[How to score] Each team defends one line and attacks the other. Decide which team starts at which end; the ends stay the same for the whole game',
            '[When it ends] Play for 18 minutes',
        ],
    )
    // The scoring sentence's class is the event choice's: line_crossed, chosen within the pair the approved events narrow to by a realization
    // choices file of ours (not knowledge), as the chain records it.
    const scoring = r.sentences.find((s) => s.text === 'A team scores 1 point by getting the ball across the line it is attacking')
    assert.deepEqual([scoring?.sixClass, scoring?.label], [6, 'OURS: a realization choice of ours, not knowledge'])
    const v1 = r.lines.find((l) => l.lineId === 'game::V1')
    assert.deepEqual([v1?.kind, v1?.value, v1?.premises.map((p) => p.ref)], ['CHOICE', 'line_crossed', ['a04-realization-choices.json: game::V1']])
    assert.deepEqual(r.consumption?.draftShaped, [{ lineId: 'game::V1', value: 'line_crossed', by: ['restated:RPC-002 RPC-002-01.a NARROWS'] }])
    assert.deepEqual(r.requirementAccount, { status: 'REPORT_ONLY', contract: 'DRAFT', components: [] })
    assert.deepEqual(r.reportNotes.map((n) => [n.section, n.quotes.map((q) => q.words)]), [['standing', ['Please distinguish demonstrated structural compatibility from demonstrated representative sufficiency.']]])
    assert.deepEqual(r.consumption?.draftItemsDerived, itemRefs.filter((x) => ['01.a', '05', '06'].some((s) => x.endsWith(`RPC-002-${s}`))))
})

// ---------------------------------------------------------------------------------------------------------------------------------------
// 4. Every run, and the wiring's refusals
// ---------------------------------------------------------------------------------------------------------------------------------------

test(`every run: the request consumes Steps 1 and 2 and places nothing; the chain's own account recorded the consumption; the selection hook only observed; a structure refusal carries the chain's own account behind it`, () => {
    const { requests, answers } = once()
    for (const id of experiment.runOrder) {
        const q = requests.get(id)
        const a = answers.get(id)
        assert.ok(q && a, id)
        assert.deepEqual(q.place, [], `${id}: nothing is placed`)
        assert.ok(q.consume, `${id}: the request consumes`)
        assert.deepEqual([q.consume.gameProblem.gameProblemId, q.consume.gameForm.formId], ['GP-015', 'GF2'], id)
        assert.deepEqual([q.records, q.draftStore], ['PRODUCTION', STORE], id)
        assert.equal(a.consumption?.selectionObservedOnly, true, id)
        assert.equal(a.scorerPick?.join(','), 'GF2', `${id}: the selection the hook observed holds Step 2's form`)
        if (a.stage === 'structure') assert.ok(a.refusalDetail && a.refusalDetail.failingChecks.length && a.refusalDetail.owedLines.length, `${id}: the structure refusal carries the chain's own account`)
    }
    // The declaration treatment and the laws classification reached the request exactly where the cases declare them.
    assert.deepEqual(experiment.runOrder.map((id) => [id, (requests.get(id)?.replaceDeclarations ?? []).map((d) => d.treatmentId), requests.get(id)?.laws ?? null]), [
        ['A02-0', [], null],
        ['A02-1', [], null],
        ['A02-1b', ['TT-CONTROL-NO-FURTHER-VALUE'], { standIn: null, treatmentId: 'TT-LAWS-DRAFT' }],
        ['A02-2', ['TT-CONTROL-NO-FURTHER-VALUE'], { standIn: { law: 'LAW-11', materiality: 'PROCEDURAL' }, treatmentId: 'TT-LAW-11-STAND-IN' }],
        ['A02-D', [], { standIn: { law: 'LAW-11', materiality: 'PROCEDURAL' }, treatmentId: 'TT-LAW-11-STAND-IN' }],
    ])
})

test('the wiring refuses a consuming request that places anything, a declaration treatment naming a declaration the contract does not hold, and two classifications of the laws', () => {
    const base = copy(once().requests.get('A02-1b')!)
    assert.throws(() => realChain.build({ ...copy(base), place: [{ id: 'tl-v0-constraint-neutral-player-condition', manipulationId: 'PM-X', relationshipRef: 'R' }] }), /a request that consumes Steps 1 and 2 places nothing, and this one places tl-v0-constraint-neutral-player-condition/)
    const wrong = copy(base)
    wrong.replaceDeclarations = [{ ...wrong.replaceDeclarations![0], from: 'CLAIMED' }]
    assert.throws(() => realChain.build(wrong), /treatment TT-CONTROL-NO-FURTHER-VALUE: restated:RPC-002 holds 0 declarations CLAIMED on V5 \(type=control\), and a treatment replaces exactly one/)
    const both = copy(base)
    both.vehicle = { goalId: 'A02', removeContext: false, lawsStandIn: { law: 'LAW-11', materiality: 'PROCEDURAL' }, treatmentRef: 'TT-X' }
    assert.throws(() => realChain.build(both), /a classification of the laws is given either by the vehicle or by the request, not both/)
})

// ---------------------------------------------------------------------------------------------------------------------------------------
// 5. The report
// ---------------------------------------------------------------------------------------------------------------------------------------

test(`the report: the runs and what each refusal rests on, the CANDIDATE mapping line, each restated item in three columns, UNRESOLVED, the smallest-source questions, the Essential Representative Relationships; double quotation marks only around Christian's words; no gendered pronoun; generated twice, identical`, () => {
    const text = reportOf(once().results)
    const lines = text.split('\n')
    const has = (line: string) => assert.ok(lines.includes(line), `the report holds: ${line}`)
    // The runs.
    has(`THE RUNS (5; the knowledge as it stands: A02-0; every other run carries a TEST-ONLY treatment)`)
    has('- A02-0: refused at structure [the knowledge as it stands, with our CANDIDATE restatement]')
    has(`   ${experiment.restatementOnlyWords}`)
    assert.equal(lines.filter((l) => l === `   ${experiment.restatementOnlyWords}`).length, 2, 'A02-0 and A02-1 rest only on our restatement')
    assert.equal(lines.filter((l) => l === `   ${experiment.treatmentRunWords}`).length, 4, 'every treatment run says it is never the A02 configuration')
    has('   what it rests on (OURS): RESTATEMENT-ONLY; basis mix 2 AUTHORED (DRAFT store item); every cited item is ours and unreviewed (2 AUTHORED (DRAFT store item)), with no ruling of Christian\'s among them')
    has(`   the laws check read: our DRAFT classification (TT-LAWS-DRAFT), a reading of ours for Christian's review, not a ruling`)
    // The mapping line.
    has(`HOW TO READ THE BUILD'S LABELS: ${experiment.candidateMapping}`)
    // Three columns per item, an effect per run.
    for (const i of items) {
        const at = lines.indexOf(`- ${i.itemId}`)
        assert.ok(at > 0, i.itemId)
        assert.ok(lines[at + 1].startsWith('   source row and its standing: ') && lines[at + 2].startsWith('   our interpretation: '), i.itemId)
        assert.deepEqual(lines.slice(at + 3, at + 8).map((l) => l.split(':')[0]), experiment.runOrder.map((id) => `   effect in ${id}`), i.itemId)
    }
    const effect = (itemId: string, run: string) => lines[lines.indexOf(`- ${itemId}`) + 3 + experiment.runOrder.indexOf(run)]
    assert.equal(effect('RPC-002-01.a', 'A02-0'), '   effect in A02-0: entered derivation; no line of the built game rests on it (no game was built: refused at structure)')
    assert.equal(effect('RPC-002-01.a', 'A02-D'), `   effect in A02-D: carried: game::V1 resolved to 'line_crossed', which the chain records it NARROWS`)
    assert.equal(effect('RPC-002-02.a', 'A02-0'), `   effect in A02-0: refused on ${ORIGIN_LINE} (at structure)`)
    assert.equal(effect('RPC-002-04.a', 'A02-1'), `   effect in A02-1: refused on ${CONTROL_LINE} (at structure)`)
    assert.equal(effect('RPC-002-04.a', 'A02-1b'), '   effect in A02-1b: carried: c:restated:RPC-002:RPC-002-04.a::V4 rest on it (the run then stopped: refused at validation) (its V5 line declared NON_CLAIMED NO_FURTHER_VALUE by treatment TT-CONTROL-NO-FURTHER-VALUE)')
    assert.equal(effect('RPC-002-03.c', 'A02-D'), '   effect in A02-D: withheld by treatment TT-WITHHOLD-CONDITION')
    assert.equal(lines.indexOf('- RPC-002-01.b'), -1, 'the ASSUMED count is dropped (measured: no run needs it)')
    assert.equal(items.filter((i) => i.basis === 'ASSUMED' || !i.sources.length).length, 0, 'every item restates a row it quotes')
    assert.ok(lines[lines.indexOf('- RPC-002-01.a') + 1].startsWith('   source row and its standing: RPC-REL-075 (relationships, line 1232): APPROVED: '), 'the source row and its standing come first')
    // UNRESOLVED, the questions, the relationships.
    has('UNRESOLVED (10; kept explicit, never closed by an assumption; the same list stands on every run)')
    const q1 = lines.find((l) => l.startsWith('1. '))
    assert.ok(q1 && q1.includes('[the next consequential gap]') && q1.includes('the sequence begins under established coordinated pressure'), q1)
    assert.equal(lines.filter((l) => l.includes('[the next consequential gap]')).length, 1)
    const Q = String.fromCharCode(34)
    const named = inputs.rulings.find((r) => r.id === 'A02-10NOV-ERR')!.words[1]
    has(`ESSENTIAL REPRESENTATIVE RELATIONSHIPS (4), as Christian names them: ${Q}${named}${Q} (reply about A02, pasted 10 November 2026)`)
    // The reply about A02 was pasted without its mail header: no citation of it prints a received date (each prints its paste date).
    assert.equal(text.split('received 10 November 2026').length - 1, 0, 'no received date is printed for the reply about A02')
    assert.ok(text.split('(reply about A02, pasted 10 November 2026)').length - 1 > 1, 'its citations print the paste date')
    for (const rel of ['defining context', 'established opposition pressure', 'relevant attacking opportunities', 'representative consequences and scoring']) has(`- ${rel}`)
    // The CAR notes rest on Step 1's own composite profile (measured): GP-015's row, every requirement Essential, SA flagged.
    const profile = runStage1('A02', k).resolution.profile
    assert.deepEqual(profile?.rows.map((x) => [x.gameProblemId, x.role, x.ratings, x.validationStatus]), [['GP-015', 'PRIMARY', { FOI: 'E', OP: 'E', SA: 'E', CIO: 'E' }, 'Approved; SA flagged for field validation']])
    // The checked pathway's CAR resolution is in shadow mode, as the selector's own source says where it resolves it (read, not run).
    const selector = fs.readFileSync(path.join(HERE, '..', 'test-library', 'generateSelection.ts'), 'utf8')
    assert.equal(selector.split('SHADOW MODE: resolved for inspection only').length - 1, 1, 'the selector resolves the CAR profile in shadow mode, once')
    // Quotation marks: every double-quoted span is, verbatim, words of a ruling the inputs hold; no gendered pronoun anywhere.
    const words = new Set(inputs.rulings.flatMap((r) => r.words))
    const spans = quotedSpans(text)
    assert.ok(spans.length > 0, 'quotation marks pair')
    for (const s of spans) assert.ok(words.has(s), `a double-quoted span that is not Christian's words: ${s}`)
    assert.deepEqual(quotedSpans(`a ${String.fromCharCode(0x201c)}b ${Q}c${Q} d${String.fromCharCode(0x201d)} and ${Q}e${Q}`), [`b ${Q}c${Q} d`, 'e'], 'bite: a typographic span is read whole')
    const hit = lines.findIndex((l) => holdsGenderedPronoun(l))
    assert.equal(hit, -1, `a gendered pronoun at line ${hit + 1}: ${lines[hit]}`)
    // Generated twice, identical (a second run of every case through the chain).
    assert.equal(reportOf(runAll().results), text, 'two runs, identical report')
    if (process.env.A02_REPORT_OUT) fs.writeFileSync(process.env.A02_REPORT_OUT, text)
})

test(`the report data's validator: each defect refuses the data`, () => {
    const refuses = (alter: (x: any) => void, pattern: RegExp) => {
        const x = copy(raw.experiment)
        alter(x)
        assert.throws(() => validateFoundationalTest(x, inputs, items), pattern)
    }
    refuses((x) => (x.knowledgeRun = 'A02-1'), /the knowledge run A02-1 carries a treatment beyond the pathway/)
    refuses((x) => (x.sourceRows = x.sourceRows.filter((s: any) => s.rowId !== 'RPC-PROP-133')), /the source row RPC-PROP-133 an item cites has no standing here/)
    refuses((x) => x.sourceRows.push({ rowId: 'RPC-PROP-019', standing: 'APPROVED', evidence: 'e' }), /the source row RPC-PROP-019 is listed, and no item cites it/)
    refuses((x) => (x.questions[1].next = true), /only the first, the most consequential, is the next gap/)
    refuses((x) => x.relationships[0].items.push('RPC-002-00.a'), /names RPC-002-00.a, which the restatement does not hold/)
    refuses((x) => (x.relationships[0].word = 9), /its words are not words a ruling of the inputs holds/)
    refuses((x) => (x.runOrder = x.runOrder.slice(1)), /the case A02-0 is not among the runs/)
    refuses((x) => (x.surprise = true), /unknown key surprise/)
})

test('registered', () => {
    const registry = readJson(path.resolve(HERE, '..', '..', '..', 'scripts', 'unit-tests.json')) as string[]
    for (const f of ['./src/system/design-reasoning/a02.unit.ts', './src/system/design-reasoning/handoff-chain.unit.ts']) assert.ok(registry.includes(f), f)
})

if (MAIN) quiet(`a02 foundational test (S2): ${passed} passed`)
