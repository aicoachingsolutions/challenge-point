/**
 * **The isolated A02 foundational test, slice B4: the brief A02/TA02 reuse comparison and the evidence** (stage 9; DESIGN-9 sections 5 and 7;
 * Christian's reply about A02, pasted and filed 10 November 2026, sections 4 and 8). TEST-ONLY review evidence: nothing here is served,
 * written to production knowledge, or an authorization.
 *
 * The comparison (DESIGN-9 section 5, brief; no family analysis): TA02 runs through the same consumption as A02 (Steps 1 and 2 run by the
 * handoff and consumed by the chain's TEST-ONLY option), over our DRAFT restatement of RPC-003, read from the TEST-ONLY draft store
 * ta02-composition (as the handoff's A05 cases read it), and, since stage W1 (b), the review pathway's K2 result in place of a per-goal record
 * (the store's DRAFT TA02 record set aside, as A02's is), each run labelled TA02's context pending: TA02-0 (the knowledge
 * as it stands) and TA02-D (every condition item withheld, the LAW-11 stand-in, as A02-D). One test measures, from both goals' own results,
 * which decisions are shared and which differ, whether the two built outputs collapse into one activity, and that the TA02 runs' Game Form
 * and constraints are consumed and, since stage W1 (a) (11 November 2026), their Game Problem too: it governs the chain's lens hints (the
 * safeguard check of a02-safeguards.unit.ts, run on them).
 *
 * Stage W5 of the A02 package (12 November 2026), U3 (b) after the merge of the program branch, one more test: (1) the shared rows SHARED;
 * (2) TA02's binding items (REQUIRED or EXCLUSION) are those before the merge less exactly the six example-only items, RPC-003-05, 10.a and
 * 10.b kept; (3) no TA02 refusal cites an example-only item, with a TEST-ONLY copy of the store in the pre-merge class as its bite; (4) the swap
 * control: A02 over our restatement of RPC-003 and TA02 over our restatement of RPC-002, exchanged on the chain's copy after both stores' gates
 * (handoff-chain.unit.ts, RestatementSwap), each row classed shared, swaps or stays; (5) the collapse kept visible, each differing row grouped by
 * a measured predicate and printed 'distinctions recorded, not executing'; and stages W1 to W4 where they apply to TA02 (TA02-0 under
 * GP_COVERAGE_LENSES; the switch not applicable; the carriers' mechanism read for context names). Row (6), B13 over the RPC-002 store, is in
 * requirement-bindings.unit.ts. The swap runs, the pre-merge class run and the GP_COVERAGE_LENSES run are built once per process.
 *
 * The evidence (docs/audits/design-reasoning-a02/evidence/): `a02-report.txt`, organized by Christian's seven report items (each keeping the
 * implemented and tested behaviour apart from what stays open, our proposals, our assumptions and ecological suitability), then the detailed
 * texts the A02 tests generate; and `a02-results.json`. Both are generated here twice (the second time from a second build of the A02 cases
 * and the TA02 runs through the chain) and must be identical; they are written only under UPDATE_A02_EVIDENCE=1 and compared otherwise.
 * The runs of a02-safeguards.unit.ts and the data of a02.unit.ts are imported; neither runs its own tests when imported.
 *
 * Run: node node_modules/ts-node/dist/bin.js --files -r tsconfig-paths/register ./src/system/design-reasoning/a02-evidence.unit.ts
 * Rewrite the evidence: UPDATE_A02_EVIDENCE=1 (same command). Under A02_EVIDENCE_MEASURE=<file> the comparison and the report's uncovered
 * identifiers are written there (the measurement the pins were taken from).
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { loadDraftStore } from '../derivation/draft-store'
import { experiment, inputs, items as a02Items, quotedSpans } from './a02.unit'
import * as S from './a02-safeguards.unit'
import { citedDateOf } from './assembly'
import { foundationalTestText } from './foundational-test'
import { CaseInput, ChainAnswer, ChainRequest, HandoffChain, HandoffResult, runHandoff, runHandoffCases, validateHandoffInputs } from './handoff'
import { chainWith, holdsGenderedPronoun, realChain, swappedStore } from './handoff-chain.unit'
import { handoffReportText, plain, quoted, show } from './handoff-report'
import { carRequirementNames, cell, committedKnowledge } from './knowledge'
import { blockerSequence, classOf, detectedByVerdict, DISPOSITION, Finding, OpenDisconnection, ownershipMessage, ownershipOf, OWNERSHIP_TABLE, SafeguardRun, safeguardRunOf, stale, unlisted, DETECTED_VERDICTS, VIOLATION_VERDICTS } from './safeguards'
import { runStage1 } from './stage1'

const quiet = console.log
let passed = 0
function test(name: string, run: () => void): void {
    try {
        run()
        passed++
        quiet(`  ok  ${name}`)
    } catch (error) {
        quiet(`  FAIL ${name}: ${(error as Error).stack ?? (error as Error).message}`)
        process.exitCode = 1
    }
}
quiet(`the isolated A02 foundational test, slice B4: the A02/TA02 comparison and the evidence`)

const HERE = __dirname
const WT = path.resolve(HERE, '..', '..', '..', '..')
const FOLDER = path.join(WT, 'docs', 'audits', 'design-reasoning-a02')
const EVIDENCE = path.join(FOLDER, 'evidence')
const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const json = (v: unknown) => JSON.stringify(v)
const k = committedKnowledge()
const Q = String.fromCharCode(34)

/**
 * Christian's words with the reply's date, as every report of this branch cites them: the received date, or, for the reply about A02 (pasted
 * without its mail header, so its received date is not recorded), its paste date (assembly.ts citedDateOf).
 */
const ruling = (id: string) => {
    const r = inputs.rulings.find((x) => x.id === id)
    assert.ok(r, `the inputs hold the ruling ${id}`)
    return r
}
const cite = (id: string, n: number): string => `${quoted(ruling(id).words[n])} (${citedDateOf(ruling(id))})`

/**
 * RC3-N4: how the report and the README speak of the regression record follows the record's own status: while it is the placeholder, 'a
 * placeholder until that regression is run'; once the lead fills it, 'recorded on <its build>'. Filling it then changes only the record, the
 * regenerated evidence and the README's lines about it, never this file.
 */
const RECORD_PENDING = 'NOT YET RECORDED for this build'
interface RecordState {
    status: string
    build: string | null
}
const recordWords = (record: RecordState) => {
    const pending = record.status === RECORD_PENDING
    assert.ok(pending || (typeof record.build === 'string' && record.build.length > 0), 'a filled regression record names the build it was run on')
    return {
        disclosure: pending ? 'which the evidence folder\'s regression record holds once the regression is run on the committed tree' : `which the evidence folder's regression record holds (recorded on ${record.build})`,
        item7: pending ? 'a placeholder until that regression is run on the committed tree' : `recorded on ${record.build}`,
        /** What the README's lines about the record must hold, and must not, for this status. */
        readmeHolds: pending ? [`PLACEHOLDER: ${RECORD_PENDING}.`, '(a placeholder until then)'] : [`recorded on ${record.build}`],
        readmeOmits: pending ? [] : ['PLACEHOLDER', 'a placeholder until', RECORD_PENDING],
    }
}
const RECORD = JSON.parse(fs.readFileSync(path.join(EVIDENCE, 'regression-record.json'), 'utf8')) as RecordState
const RECORD_WORDS = recordWords(RECORD)

// ---------------------------------------------------------------------------------------------------------------------------------------
// S5: TA02 through the same consumption, over our DRAFT restatement of RPC-003 (TA02's context pending)
// ---------------------------------------------------------------------------------------------------------------------------------------

const TA02_STORE = 'ta02-composition'
const TA02_CONTRACT = 'restated:RPC-003'
const ta02Store = loadDraftStore(TA02_STORE)
const ta02Contract = ta02Store.contracts.find((c) => c.contractId === TA02_CONTRACT)
assert.ok(ta02Contract, `the draft store ${TA02_STORE} holds ${TA02_CONTRACT}`)
const ta02Items = ta02Contract.items as any[]
/** The clauses of RPC-003's approved scoring condition and the items of our restatement constituting each (selector type=<clause>), as for RPC-002. */
const ta02Clauses = (() => {
    const out: Array<{ clause: string; items: string[] }> = []
    for (const item of ta02Items) {
        const selector = String(item.selector)
        if (selector.indexOf('type=') !== 0) continue
        const clause = selector.slice('type='.length)
        const at = out.find((x) => x.clause === clause)
        if (at) at.items.push(String(item.itemId))
        else out.push({ clause, items: [String(item.itemId)] })
    }
    return out
})()
const conditionRowOf = (contractItems: any[]): string => String(((contractItems.find((i) => String(i.selector) === 'type=origin')?.source ?? [])[0]?.rowId ?? '').split(' ')[0])
const TA02_SCORING = { contractId: TA02_CONTRACT, rowId: conditionRowOf(ta02Items), clauses: ta02Clauses }
const TA02_CONDITION_ITEMS = ta02Clauses.flatMap((c) => c.items)

const TA02_RULINGS: CaseInput['rulings'] = [
    { ref: 'A02-10NOV-AUTHORIZATION', entersAs: 'REPORT_ONLY', how: 'the authority for the isolated experiment and for the chain\'s TEST-ONLY consumption of Steps 1 and 2 (TT-CONSUMED-STEPS), applied to TA02 only for the brief reuse comparison; none of its words enters the chain as a value' },
    { ref: 'A02-10NOV-REUSE', entersAs: 'REPORT_ONLY', how: 'the brief reuse comparison: TA02 run through the same consumption as A02, and the shared and differing decisions measured from both results' },
    { ref: 'TA02-27OCT-CONTEXT', entersAs: 'REPORT_ONLY', how: 'TA02\'s context pending: Step 1 routes TA02 to Attack Development by the planning model, which this reply says does not adequately represent the moment' },
    { ref: 'TA02-28OCT-DEFERRED', entersAs: 'REPORT_ONLY', how: 'the proposed ninth context stays deferred: nothing here builds it, and no TA02 run is a TA02 configuration' },
    { ref: 'A02-10NOV-TREATMENTS', entersAs: 'REPORT_ONLY', how: 'every TEST-ONLY treatment is labelled, and no run with one is a configuration' },
    { ref: 'A02-10NOV-GF2', entersAs: 'REPORT_ONLY', how: 'the diagnostic shows structural compatibility only, not representative sufficiency' },
    { ref: 'HO-07NOV-ILLUSTRATIVE', entersAs: 'ILLUSTRATIVE_PERMISSION', how: 'the basis for the labelled illustrative session, the same as the A02 cases\' (so the two goals differ only in their knowledge)' },
    { ref: 'HO-07NOV-PURPOSE', entersAs: 'REPORT_ONLY', how: 'the purpose\'s source and approval evidence printed apart' },
    { ref: 'HO-23OCT-LAWS', entersAs: 'REPORT_ONLY', how: 'the Laws apply by default: nothing enters; the chain\'s laws account reports each law' },
    { ref: 'HO-07NOV-OFFSIDE-SCOPE', entersAs: 'REPORT_ONLY', how: 'the provisional no-offside ruling is scoped to the initial small-sided realization: nothing enters; the LAW-11 stand-in of TA02-D is a TEST-ONLY treatment, never this ruling generalized' },
    // Stage W1 (b): the TA02 runs take K2's result as the A02 runs do (the same treatment, inherited from the A02 case each mirrors).
    { ref: 'HO-07NOV-K2', entersAs: 'EMPTY_CONSTRAINT_SET', how: 'the review pathway\'s K2 result (no manipulation proposed for TA02) handed to the chain in place of a per-goal authorization record (TT-K2-RETAIN-FORM), as for A02: the empty set only; its rule and its limit are carried into the account and the report' },
    { ref: 'A02-03NOV-DESIGN-AUTHORIZATION', entersAs: 'REPORT_ONLY', how: 'E5: our reading of it is why K2\'s result stands in for a per-goal record, as for A02' },
]
const TA02_PENDING_NOTE = {
    section: 'standing' as const,
    text: 'TA02\'s context pending: Step 1 routes TA02 to Attack Development by the planning model; Christian has said that context does not adequately represent the moment, and deferred the proposed ninth context; a run of the reuse comparison, never a TA02 configuration;',
    quotes: [
        { rulingRef: 'TA02-27OCT-CONTEXT', word: 0 },
        { rulingRef: 'TA02-28OCT-DEFERRED', word: 0 },
    ],
}
const TA02_NOT_CARRIED: CaseInput['notCarried'] = [
    {
        id: 'UN-TA02-CONTEXT',
        what: 'TA02\'s own context',
        rulingRefs: ['TA02-27OCT-CONTEXT', 'TA02-28OCT-DEFERRED'],
        where: 'Step 1 routes TA02 to RPC-003 (Attack Development) by the planning model; Christian\'s replies of 27 and 28 October say that context does not adequately represent the moment and defer the proposed ninth context; these runs measure the reuse on the routing as it stands, not a TA02 activity',
        label: 'UNRESOLVED',
    },
    {
        id: 'UN-TA02-CONDITION',
        what: 'the origin value of RPC-003\'s approved scoring condition (and the control referent its example names, which no line owes since the merge of 11 November 2026)',
        rulingRefs: ['A02-10NOV-TREATMENTS'],
        where: 'our DRAFT restatement of RPC-003 declares the origin value NOT_AUTHORED, so TA02-0 is refused on that line alone (A02-0 is refused on RPC-002\'s control referent and origin value); TA02-D withholds every condition item. Not like for like: TA02\'s progression and control items (RPC-003-11.a to 11.c, RPC-003-12.a and 12.b) restate the clause Christian wrote as an example on 13 September; since the merge of the program branch (11 November 2026) they are held as examples (SUPPORTING, TYPICAL_EXAMPLE), under Christian\'s reply received 11 November 2026 (second reply), item 3, so they constitute no condition and the control referent, still UNDECLARED, is owed by no line. Before that merge RPC-003-12.a made the example\'s possession condition a required control clause, which Christian\'s first reply of 7 November, section 4, says not to do without an authoritative basis (quoted in item 6), and TA02-0 was refused on that referent as well',
        label: 'UNRESOLVED',
    },
]
/** A TA02 case built from the A02 case it mirrors: the same session and treatments, TA02's goal, store, rulings and unresolved list. */
function ta02Case(baseId: 'A02-0' | 'A02-D', id: string): CaseInput {
    const base = inputs.cases.find((c) => c.id === baseId)
    assert.ok(base, baseId)
    const c = copy(base)
    delete c.basedOn
    c.id = id
    c.goalId = 'TA02'
    c.chain.draftStore = TA02_STORE
    c.rulings = copy(TA02_RULINGS)
    c.notCarried = copy(TA02_NOT_CARRIED)
    c.reportNotes = [copy(TA02_PENDING_NOTE)]
    c.testOnlyTreatments = c.testOnlyTreatments.map((t) => {
        if (t.kind === 'DRAFT_STORE')
            return {
                ...t,
                what: `our DRAFT restatement of RPC-003 (CANDIDATE: ours, unreviewed) read from the TEST-ONLY draft store ${TA02_STORE}, as the handoff's A05 cases read it; the store's DRAFT TA02 record (no ruling field filled, an empty set, our finding of 27 October) is held to the store's gate and set aside under TT-K2-RETAIN-FORM, as for A02`,
                effect: 'the context\'s items enter derivation as DRAFT knowledge (ours, unreviewed: CANDIDATE); the constraints come from the review pathway\'s K2 result (TT-K2-RETAIN-FORM), as for A02',
                why: 'RPC-003 has no production contract and TA02 no production record; writing either would change the live route',
                rulingRefs: ['A02-10NOV-REUSE'],
            }
        if (t.kind === 'WITHHOLD_ITEMS')
            return {
                ...t,
                contractId: TA02_CONTRACT,
                itemIds: [...TA02_CONDITION_ITEMS],
                what: 'every condition item of our restatement of RPC-003 withheld from derivation, on the chain\'s copy (after the draft store\'s own gate admitted the restatement whole)',
                effect: 'only the rest of the restatement (with the form\'s own items) reaches derivation: plain GF2',
                why: 'the diagnostic beside A02-D: structural compatibility only; the items are withheld after the store\'s gate, never dropped from it',
            }
        return t
    })
    if (baseId === 'A02-0') {
        c.label = `${id}: TA02 with the knowledge as it stands and our DRAFT (CANDIDATE) restatement of RPC-003 (Steps 1 and 2 consumed by the chain, as for A02; the review pathway's K2 result, no manipulation, in place of a per-goal record, as for A02); TA02's context pending`
        c.resultStanding = 'REUSE_COMPARISON_KNOWLEDGE_AS_IT_STANDS_TA02_CONTEXT_PENDING'
    } else {
        c.label = `${id}, diagnostic: as A02-D, every condition item of our restatement of RPC-003 withheld (TEST-ONLY), with the TEST-ONLY LAW-11 stand-in: plain GF2; TA02's context pending`
        c.resultStanding = 'DIAGNOSTIC_STRUCTURAL_COMPATIBILITY_ONLY_NOT_REPRESENTATIVE_SUFFICIENCY'
        c.reportNotes.push({ section: 'standing', text: 'A diagnostic only: plain GF2, which shows structural compatibility, not representative sufficiency;', quotes: [{ rulingRef: 'A02-10NOV-GF2', word: 6 }] })
    }
    return c
}
const TA02_CASES = [ta02Case('A02-0', 'TA02-0'), ta02Case('A02-D', 'TA02-D')]
const ta02Inputs = { standing: inputs.standing, rulings: inputs.rulings, cases: [...inputs.cases, ...TA02_CASES], grading: inputs.grading }

interface Built {
    result: HandoffResult
    answer: ChainAnswer | null
    request?: ChainRequest | null
}
/** The TA02 runs through the handoff and the real chain, each request and answer captured. */
function buildTa02(): Map<string, Built> {
    const out = new Map<string, Built>()
    for (const c of TA02_CASES) {
        let answer: ChainAnswer | null = null
        let request: ChainRequest | null = null
        const capture: HandoffChain = {
            build: (r) => {
                request = copy(r)
                answer = realChain.build(r)
                return answer
            },
        }
        out.set(c.id, { result: runHandoff(c, ta02Inputs, capture, k), answer, request })
    }
    return out
}
const ta02 = buildTa02()
const ta02At = (id: string): Built => {
    const b = ta02.get(id)
    assert.ok(b, id)
    return b
}
/** The safeguard check (a02-safeguards.unit.ts) run on the TA02 runs: the same facts as the A02 base cases (an empty set, a TEST-ONLY record). */
const ta02Safeguard = (id: string): { run: SafeguardRun; findings: Finding[] } => {
    const b = ta02At(id)
    const run = safeguardRunOf(b.result, b.answer, true, { ...S.K2_FACTS, standIns: [], scoring: TA02_SCORING, engineRule: null })
    return { run, findings: ownershipOf(run) }
}
const TA02_IDS = TA02_CASES.map((c) => c.id)
/**
 * The open disconnections the TA02 runs carry: the same two the A02 runs carry, measured on these runs (a detected disconnection, never a pass).
 * OD-HINT-GAME-PROBLEM left the list in stage W1 (a), 11 November 2026: Step 1's GP-015 now governs the TA02 runs' hints as it does A02's.
 */
const TA02_DISCONNECTIONS: OpenDisconnection[] = ['OD-CONTEXT', 'OD-DISPLAY'].map((id) => {
    const e = S.OPEN_DISCONNECTIONS.find((x) => x.id === id)
    assert.ok(e, id)
    return { ...copy(e), runs: [...TA02_IDS] }
})

// ---------------------------------------------------------------------------------------------------------------------------------------
// The comparison, measured from both goals' results
// ---------------------------------------------------------------------------------------------------------------------------------------

interface ReuseRow {
    aspect: string
    kind: 'SHARED' | 'DIFFERS'
    a02: string
    ta02: string
    note: string
}
interface Pair {
    zero: Built
    diag: Built
    goal: string
    contractId: string
    items: any[]
    lenses: string[]
}
const nameOfContext = (id: string | null | undefined) => (id ? String(k.contexts.registry.find((r) => cell(r, 'rpc_id') === id)?.['rpc_name'] ?? '') : '')
const itemsOf = (p: Pair, selector: string, row: string) => p.items.filter((i) => String(i.selector) === selector && String(i.row) === row).map((i) => show(i.value))
const lineKey = (l: HandoffResult['lines'][number]) => `${show(l.value)} [${l.premises.map((x) => x.ref).join('; ')}] class ${l.sixClass === null ? 'none' : l.sixClass}`
function affordanceTargets(contextId: string): Array<{ id: string; name: string; status: string }> {
    const staging = ((k.contexts as unknown as Record<string, unknown>)['implementation_staging'] ?? []) as Array<Record<string, unknown>>
    return staging.filter((r) => r['rpc_id'] === contextId && r['target_library'] === 'AFFORDANCE').map((r) => ({ id: String(r['mapping_id']), name: String(r['candidate_name']), status: String(r['mapping_status']) }))
}
function comparisonOf(a: Pair, t: Pair): { rows: ReuseRow[]; differingLines: string[]; sentencesIdentical: boolean } {
    const rows: ReuseRow[] = []
    const row = (aspect: string, x: string, y: string, note: string, kind?: 'SHARED' | 'DIFFERS') => rows.push({ aspect, kind: kind ?? (x === y ? 'SHARED' : 'DIFFERS'), a02: x, ta02: y, note })
    const s1 = (p: Pair) => p.zero.result.receive.step1
    const s2 = (p: Pair) => p.zero.result.receive.step2
    row('Step 1: the resolved Game Problem', `${s1(a)?.status} ${s1(a)?.primary.join(', ')} (${s1(a)?.basis})`, `${s1(t)?.status} ${s1(t)?.primary.join(', ')} (${s1(t)?.basis})`, 'each from its own goal\'s approved translation row in the planning model')
    const profile = (p: Pair) => (runStage1(p.goal, k).resolution.profile?.rows ?? []).map((r) => `${r.gameProblemId} ${r.role} ${Object.entries(r.ratings).map(([req, v]) => `${req} ${v}`).join(', ')} (${r.validationStatus})`).join('; ')
    row('Step 1: the CAR profile it consults', profile(a), profile(t), 'consulted in Step 1 only: the checked pathway resolves CAR in shadow mode, and changing these ratings changes nothing in the chain (measured in item 3)')
    row('Step 2: the Game Form result', `${s2(a)?.status} ${s2(a)?.selected} (compatible: ${s2(a)?.compatible.join(', ')})`, `${s2(t)?.status} ${s2(t)?.selected} (compatible: ${s2(t)?.compatible.join(', ')})`, 'from the same relationship: GF2\'s Game Problem cell names GP-015')
    const cells = (p: Pair) => p.zero.result.consumption?.form?.cells ?? []
    const gf2Grade = (p: Pair) => String(cells(p).find((c) => c.cell.endsWith('game_forms GF2'))?.grade)
    row('Step 2: the grade of GF2\'s Game Problem cell', gf2Grade(a), gf2Grade(t), 'our restatement of the DRAFT module; Christian has left its approval unresolved')
    // Each cell without its file name (its table and row, or its ruling), with its grade.
    const cellNames = (p: Pair) => cells(p).map((c) => `${c.cell.split(' ').length > 2 ? c.cell.split(' ').slice(1).join(' ') : c.cell.split(' ').slice(-1)[0]} ${c.grade}`)
    const common = cellNames(a).filter((c) => cellNames(t).indexOf(c) >= 0)
    row(
        'Step 2: the cells its result rests on',
        cellNames(a).filter((c) => common.indexOf(c) < 0).join(', '),
        cellNames(t).filter((c) => common.indexOf(c) < 0).join(', '),
        `shared: ${common.join(', ')}; the rest are each goal's own translation row and its context's own declared-form relationships`,
    )
    const handed = (p: Pair) => {
        const x = p.zero.result.consumption
        return x ? `Game Problem ${x.gameProblem?.gameProblemId} from ${x.gameProblem?.source}; scorer handed ${x.formCandidatesScored.join(', ')} (${x.formCandidatesFrom}); constraints ${x.constraintAuthority} [${x.constraintCandidateIds.join(', ')}]; size-rule bypass ${x.sizeRuleBypassed}` : 'none recorded'
    }
    row('the consumption (what the chain records it was handed)', handed(a), handed(t), 'the same TEST-ONLY option and the same K2 result, the empty set, for each goal (each goal\'s DRAFT record set aside, since stage W1 (b))')
    row('the context', `${s1(a)?.contextId} '${nameOfContext(s1(a)?.contextId)}'`, `${s1(t)?.contextId} '${nameOfContext(s1(t)?.contextId)}'`, 'routed by the planning model and read by the chain from the same routing; TA02\'s context pending')
    const eventsOf = (p: Pair) => itemsOf(p, '*', 'V1').filter((v) => v.indexOf('[') === 0)
    const asSet = (vs: string[]) => vs.map((v) => v.slice(1, -1).split(', ').sort().join(', ')).join('; ')
    row('the approved scoring events (our restatement, as a set)', asSet(eventsOf(a)), asSet(eventsOf(t)), `the same four kinds; restated in the approved order of each context: ${eventsOf(a).join('; ')} | ${eventsOf(t).join('; ')}`)
    const v1 = (p: Pair) => {
        const l = p.diag.answer?.lines.find((x) => x.lineId === 'game::V1')
        return `${show(l?.value)} within ${show(l?.permitted ?? null)}`
    }
    const narrowedBy = (p: Pair) => (p.diag.result.consumption?.draftShaped ?? []).filter((s) => s.lineId === 'game::V1').flatMap((s) => s.by).join(', ')
    row('the built scoring event (diagnostic runs)', v1(a), v1(t), `narrowed by ${narrowedBy(a)} | by ${narrowedBy(t)} (the chain's own records); the value is closed by a realization choices file of ours, not knowledge`)
    const condition = (p: Pair) => {
        const c = p.diag.answer?.observed?.scoringCondition
        return c ? `${c.rowId}: ${c.state}, carried ${c.carried ? 'yes' : 'no'}` : 'none'
    }
    row('the approved scoring condition (its row, on the diagnostic runs)', condition(a), condition(t), 'the chain is handed no requirement bindings for either row on these runs (none exists for RPC-002; a DRAFT set of ours for RPC-003 sits outside the store and the handoff\'s wiring does not hand it), so the requirement account cannot classify the condition; nothing carries it')
    for (const clause of ['origin', 'progression', 'control']) {
        const vals = (p: Pair) => [...itemsOf(p, `type=${clause}`, 'V5'), ...itemsOf(p, `type=${clause}`, 'V6')].join(', ') || 'none'
        row(`the condition's ${clause} clause (our restatement's values)`, vals(a), vals(t), clause === 'origin' ? 'the value is declared NOT_AUTHORED in both restatements; neither origin has a carrier' : clause === 'control' ? 'the referent is UNDECLARED in both restatements; TA02\'s items (RPC-003-12.a, 12.b) restate the possession condition of a clause Christian wrote as an example (13 September) and, since the merge of the program branch (11 November 2026), are held as examples (SUPPORTING, TYPICAL_EXAMPLE), so TA02 constitutes no control clause (before that merge RPC-003-12.a made it required, contrary to Christian\'s first reply of 7 November, section 4)' : 'carried as open text and a value; not executed in either built game; TA02\'s items (RPC-003-11.a to 11.c) restate the clause Christian wrote as an example (13 September) and, since the merge of the program branch (11 November 2026), are held as examples (SUPPORTING, TYPICAL_EXAMPLE), constituting no condition')
    }
    const stop = (p: Pair) => `${p.zero.result.refusal?.stage}: ${(p.zero.result.refusalBasis?.cited ?? []).map((c) => c.ref).join(', ')} (${p.zero.result.refusalBasis?.verdict})`
    row('where the knowledge as it stands stops', stop(a), stop(t), 'the same stage, each on its own context\'s restatement: A02 on two kinds of line, the control clause\'s referent and the origin clause\'s value; TA02 on the origin clause\'s value alone, since the merge of the program branch (11 November 2026) holds our RPC-003 control items as examples (before that merge TA02 also stopped on the control line, our item RPC-003-12.a, which made the illustrative clause\'s possession condition a required one, contrary to Christian\'s first reply of 7 November, section 4, quoted in item 6)')
    const opposition = (p: Pair) => {
        const ps = p.items.filter((i) => String(i.row) === 'P1')
        const resting = p.diag.result.lines.filter((l) => l.premises.some((x) => ps.some((i) => x.ref === `${p.contractId} ${i.itemId}`))).length
        return `${ps.map((i) => `${i.itemId} ${i.requirement} ${show(i.value)} (${i.checkability})`).join('; ')}; lines resting on them in the diagnostic build: ${resting}`
    }
    row('opposition (our restatement\'s participant rows)', opposition(a), opposition(t), 'recorded in each restatement; no line of either built game rests on them, so neither built game carries its context\'s opposition')
    row('the engine lenses (wording-derived engine inputs)', a.lenses.join(', '), t.lenses.join(', '), 'scored from each goal\'s wording; not an owned decision; with an empty authorized set they decide no selection')
    const targets = (id: string) => affordanceTargets(id)
    const tA = targets(String(s1(a)?.contextId))
    const tT = targets(String(s1(t)?.contextId))
    const names = tA.map((x) => x.name).filter((n) => tT.some((y) => y.name === n))
    row(
        'the context\'s affordance targets (the library\'s mapping rows)',
        `${tA.map((x) => x.id).join(', ')}: ${[...new Set(tA.map((x) => x.status))].join(', ')}`,
        `${tT.map((x) => x.id).join(', ')}: ${[...new Set(tT.map((x) => x.status))].join(', ')}`,
        `every one DEFERRED (Christian, 13 September: not to be inferred to reach runtime), so no engine reads them; names in both lists: ${names.map((n) => `'${n}'`).join(', ') || 'none'}`,
    )
    const la = new Map(a.diag.result.lines.map((l) => [l.lineId, lineKey(l)]))
    const lt = new Map(t.diag.result.lines.map((l) => [l.lineId, lineKey(l)]))
    const ids = [...new Set([...la.keys(), ...lt.keys()])].sort()
    const differingLines = ids.filter((id) => la.get(id) !== lt.get(id)).map((id) => `${id}: ${la.get(id) ?? 'absent'} | ${lt.get(id) ?? 'absent'}`)
    row(
        'the configuration lines (diagnostic runs)',
        `${la.size} lines`,
        `${lt.size} lines`,
        differingLines.length ? `identical except: ${differingLines.join('; ')}` : 'identical',
        differingLines.length ? 'DIFFERS' : 'SHARED',
    )
    const sa = a.diag.result.sentences.map((s) => `[${s.section}] ${s.text}`)
    const st = t.diag.result.sentences.map((s) => `[${s.section}] ${s.text}`)
    const sentencesIdentical = json(sa) === json(st)
    row('the coach text (diagnostic runs)', `${sa.length} sentences`, `${st.length} sentences`, sentencesIdentical ? 'identical, sentence for sentence' : 'different', sentencesIdentical ? 'SHARED' : 'DIFFERS')
    const owed = (p: Pair) => (p.diag.result.laws?.owed ?? []).map((o) => o.split(' ')[0]).join(', ')
    row('the laws owed an adaptation (diagnostic runs)', owed(a), owed(t), 'the same laws, under the same TEST-ONLY LAW-11 stand-in')
    return { rows, differingLines, sentencesIdentical }
}
const pairOf = (goal: 'A02' | 'TA02', zero: Built, diag: Built, lenses: string[]): Pair => ({
    goal,
    zero,
    diag,
    contractId: goal === 'A02' ? 'restated:RPC-002' : TA02_CONTRACT,
    items: goal === 'A02' ? (loadDraftStore('a02-composition').contracts.find((c) => c.contractId === 'restated:RPC-002')!.items as any[]) : ta02Items,
    lenses,
})
const a02Built = (id: string): Built => ({ result: S.at(id).result, answer: S.at(id).answer })
const COMPARISON = comparisonOf(
    pairOf('A02', a02Built('A02-0'), a02Built('A02-D'), S.at('A02-D').run.chain?.lenses ?? []),
    pairOf('TA02', ta02At('TA02-0'), ta02At('TA02-D'), ta02Safeguard('TA02-D').run.chain?.lenses ?? []),
)

// ---------------------------------------------------------------------------------------------------------------------------------------
// Stage W5 of the A02 package (12 November 2026): reuse, U3 (b) rows (1) to (6), now that the program branch is merged. Christian:
// "Investigating whether A02 and TA02 can reuse common reasoning without losing their contextual distinctions." (received 11 November 2026,
// second reply); "We should not force artificial activity differences merely because the Learning Goals have different names." (reply about
// A02, pasted 10 November 2026). TEST-ONLY; no TA02 configuration (its context is pending); nothing here is knowledge.
// ---------------------------------------------------------------------------------------------------------------------------------------

/** (1) The rows the two goals must share: Step 1, Step 2, the cell grade, the consumption, and the CAR profile Step 1 only consults. */
const SHARED_ROWS = [
    'Step 1: the resolved Game Problem',
    'Step 1: the CAR profile it consults',
    'Step 2: the Game Form result',
    'Step 2: the grade of GF2\'s Game Problem cell',
    'the consumption (what the chain records it was handed)',
]

/**
 * (2) TA02's binding items (strictness REQUIRED or EXCLUSION) in our restatement of RPC-003 before the merge of the program branch, measured on
 * the A02 line before it (2bc198f, docs/audits/drafts/ta02-composition/rpc-003-contract.DRAFT.json): 17 REQUIRED and 4 EXCLUSION.
 */
const TA02_BINDING_BEFORE = [
    'RPC-003-01.a', 'RPC-003-01.b', 'RPC-003-02', 'RPC-003-03.a', 'RPC-003-03.b', 'RPC-003-04.b', 'RPC-003-05', 'RPC-003-06', 'RPC-003-08', 'RPC-003-09.a', 'RPC-003-09.b',
    'RPC-003-10.a', 'RPC-003-10.b', 'RPC-003-11.a', 'RPC-003-11.b', 'RPC-003-11.c', 'RPC-003-12.a', 'RPC-003-12.b', 'RPC-003-14.a', 'RPC-003-14.b', 'RPC-003-15',
]
/**
 * The six items that rest only on the corrected row's example, kept as examples since the merge (requirement-bindings.unit.ts, B13b, pins the
 * same six by its own reading), each with the valueStatus it held before the merge (2bc198f); the strictness of each was REQUIRED.
 */
const TA02_EXAMPLE_ONLY: Record<string, string> = {
    'RPC-003-02': 'N/A',
    'RPC-003-11.a': 'N/A',
    'RPC-003-11.b': 'REQUIRED_RANGE',
    'RPC-003-11.c': 'REQUIRED_RANGE',
    'RPC-003-12.a': 'N/A',
    'RPC-003-12.b': 'REQUIRED_RANGE',
}
/**
 * Independently authorized conditions the correction must keep binding: the exclusion 'possession alone' (RPC-003-05) and the origin clause
 * (RPC-003-10.a, 10.b). Christian: "Do not remove independently authorized structural or scoring conditions" (received 11 November 2026,
 * second reply).
 */
const TA02_KEPT = ['RPC-003-05', 'RPC-003-10.a', 'RPC-003-10.b']
const BINDING = ['REQUIRED', 'EXCLUSION']
const bindingIds = (items: any[]): string[] => items.filter((i) => BINDING.indexOf(String(i.strictness)) >= 0).map((i) => String(i.itemId))
/** Every way a restatement's items depart from 'before minus exactly the example-only items, the independently authorized ones kept'. */
function bindingDefects(items: any[]): string[] {
    const now = bindingIds(items)
    const expected = TA02_BINDING_BEFORE.filter((id) => !(id in TA02_EXAMPLE_ONLY))
    const out: string[] = []
    for (const id of expected) if (now.indexOf(id) < 0) out.push(`${id} is no longer binding`)
    for (const id of now) if (expected.indexOf(id) < 0) out.push(`${id} is binding and is not among the items binding before the merge less the example-only items`)
    for (const id of TA02_KEPT) if (now.indexOf(id) < 0) out.push(`${id}, an independently authorized condition, is not kept binding`)
    for (const id of Object.keys(TA02_EXAMPLE_ONLY)) {
        const item = items.find((i) => String(i.itemId) === id)
        if (!item) out.push(`${id} is gone, and its provenance with it`)
        else if (item.strictness !== 'SUPPORTING' || item.valueStatus !== 'TYPICAL_EXAMPLE') out.push(`${id} is not kept as an example (${item.strictness}, ${item.valueStatus})`)
    }
    return out
}

/** (3) The example-only items a run's refusal cites (its basis's cited lines and its reasons, as c:<contract>:<item>::<row> or [c:<contract>:<item>]). */
const exampleItemsCited = (r: HandoffResult): string[] =>
    Object.keys(TA02_EXAMPLE_ONLY).filter((id) => [...(r.refusalBasis?.cited ?? []).map((c) => c.ref), ...(r.chain?.reasons ?? [])].some((x) => x.indexOf(`:${id}::`) >= 0 || x.indexOf(`:${id}]`) >= 0))
/**
 * The bite of (3): TA02-0 over a TEST-ONLY copy of the store with the six items put back to the class they held before the merge (strictness
 * REQUIRED, each its pre-merge valueStatus; every quotation as the corrected row reads now, so the store's gate admits it whole), in a folder of
 * the system's temporary directory, removed after the run. Nothing is written to the drafts.
 */
function ta02OverPreMergeClass(): Built {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'a02-evidence-w5-'))
    try {
        const from = path.join(WT, 'docs', 'audits', 'drafts', TA02_STORE)
        const contract = JSON.parse(fs.readFileSync(path.join(from, 'rpc-003-contract.DRAFT.json'), 'utf8'))
        for (const item of contract.contractEntry.result.items as any[])
            if (item.id in TA02_EXAMPLE_ONLY) {
                item.strictness = 'REQUIRED'
                item.valueStatus = TA02_EXAMPLE_ONLY[item.id]
            }
        fs.writeFileSync(path.join(dir, 'rpc-003-contract.DRAFT.json'), JSON.stringify(contract, null, 2))
        fs.copyFileSync(path.join(from, 'ta02-authorization.DRAFT.json'), path.join(dir, 'ta02-authorization.DRAFT.json'))
        assert.doesNotThrow(() => loadDraftStore(dir), 'the store\'s gate admits the copy whole')
        const c = ta02Case('A02-0', 'TA02-0/pre-merge-class')
        c.chain.draftStore = dir
        let answer: ChainAnswer | null = null
        const result = runHandoff(c, ta02Inputs, { build: (r) => (answer = realChain.build(r)) }, k)
        return { result, answer }
    } finally {
        fs.rmSync(dir, { recursive: true, force: true })
    }
}
const TA02_PRE_MERGE_CLASS = ta02OverPreMergeClass()

/**
 * (4) The swap control: A02 over our restatement of RPC-003, TA02 over our restatement of RPC-002, each on the chain's copy of its own store
 * (handoff-chain.unit.ts, RestatementSwap: both stores held to their own gates first, the other context's restatement then put in place of the
 * routed context's under its id, its items' ids and sources kept). Everything else is the run it mirrors: the same goal, wording, routing,
 * Steps 1 and 2, consumption, K2's result and session; on the diagnostic, the other restatement's condition items withheld.
 */
/**
 * Why the swap is made on the chain's copy and not as a copy on disk (measured, never loosened): the store's gate refuses our restatement of
 * RPC-003 relabelled as RPC-002's, because no item constituting a scoring condition then cites RPC-002's approved condition row; the same file
 * not relabelled is admitted (the control). Each copy in a folder of the system's temporary directory, removed after.
 */
function relabelledCopyGate(relabel: boolean): string {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'a02-evidence-w5-swap-'))
    try {
        const contract = JSON.parse(fs.readFileSync(path.join(WT, 'docs', 'audits', 'drafts', TA02_STORE, 'rpc-003-contract.DRAFT.json'), 'utf8'))
        if (relabel) contract.contractEntry.name = 'RPC-002 High Press Escape'
        fs.writeFileSync(path.join(dir, 'rpc-003-contract.DRAFT.json'), JSON.stringify(contract, null, 2))
        try {
            loadDraftStore(dir)
            return 'ADMITTED'
        } catch (error) {
            return (error as Error).message
        }
    } finally {
        fs.rmSync(dir, { recursive: true, force: true })
    }
}
const SWAP_TREATMENT = 'TT-SWAP-RESTATEMENT'
const A02_CONTRACT = 'restated:RPC-002'
const A02_STORE = 'a02-composition'
const A02_CONDITION_ITEMS = S.SCORING.clauses.flatMap((c) => c.items)
const a02StoreItems = loadDraftStore(A02_STORE).contracts.find((c) => c.contractId === A02_CONTRACT)!.items as any[]
interface SwapSide {
    goal: 'A02' | 'TA02'
    into: string
    store: string
    fromStore: string
    fromContract: string
    fromItems: any[]
    fromConditionItems: string[]
    fromName: string
}
const SWAP_SIDES: SwapSide[] = [
    { goal: 'A02', into: A02_CONTRACT, store: A02_STORE, fromStore: TA02_STORE, fromContract: TA02_CONTRACT, fromItems: ta02Items, fromConditionItems: TA02_CONDITION_ITEMS, fromName: 'our DRAFT restatement of RPC-003 (Attack Development)' },
    { goal: 'TA02', into: TA02_CONTRACT, store: TA02_STORE, fromStore: A02_STORE, fromContract: A02_CONTRACT, fromItems: a02StoreItems, fromConditionItems: A02_CONDITION_ITEMS, fromName: 'our CANDIDATE restatement of RPC-002 (High Press Escape)' },
]
const SWAP = '/swap'
function swapCase(side: SwapSide, base: CaseInput): CaseInput {
    const c = copy(base)
    delete c.basedOn
    c.id = `${base.id}${SWAP}`
    c.label = `${c.id}: the swap control (TEST-ONLY): ${base.id} with ${side.fromName} in place of its routed context's own restatement, on the chain's copy; never a configuration of either goal`
    c.resultStanding = 'SWAP_CONTROL_TEST_ONLY_NEVER_A_CONFIGURATION'
    c.testOnlyTreatments = c.testOnlyTreatments.map((t) => {
        if (t.kind === 'DRAFT_STORE')
            return {
                ...t,
                id: SWAP_TREATMENT,
                what: `the TEST-ONLY draft store ${side.store}, read through its gate, with ${side.fromName} (read through the gate of ${side.fromStore}) put in place of ${side.into} on the chain's copy, under that id; its items' ids and sources kept`,
                effect: `the chain derives the routed context from the other context's restatement; every other input is the run's own`,
                why: 'the swap control of the reuse comparison: whether the differences between the two goals come from each context\'s knowledge or from the goals\' names',
                rulingRefs: ['A02-10NOV-REUSE'],
            }
        if (t.kind === 'WITHHOLD_ITEMS') return { ...t, itemIds: [...side.fromConditionItems], what: `every condition item of ${side.fromName} withheld from derivation, on the chain's copy, after the swap` }
        return t
    })
    if (!c.rulings.some((r) => r.ref === 'A02-10NOV-REUSE')) c.rulings.push({ ref: 'A02-10NOV-REUSE', entersAs: 'REPORT_ONLY', how: 'the swap control of the reuse comparison: the two contexts\' restatements exchanged on the chain\'s copy; none of its words enters the chain as a value' })
    c.notCarried = [{ id: 'UN-SWAP-CONTROL', what: 'the routed context\'s own restatement', rulingRefs: ['A02-10NOV-REUSE'], where: `replaced on the chain's copy by ${side.fromName}: a control, never a configuration`, label: 'UNRESOLVED' }]
    c.reportNotes = [{ section: 'standing', text: 'The swap control: the two contexts\' restatements exchanged on the chain\'s copy (TEST-ONLY); never a configuration of either goal;' }]
    return c
}
const SWAP_CASES = SWAP_SIDES.flatMap((side) => {
    const bases = side.goal === 'A02' ? ['A02-0', 'A02-D'].map((id) => copy(inputs.cases.find((x) => x.id === id)!)) : TA02_CASES
    return bases.map((b) => ({ side, c: swapCase(side, b) }))
})
const swapInputs = { ...ta02Inputs, cases: [...ta02Inputs.cases, ...SWAP_CASES.map((x) => x.c)] }
function buildSwap(): Map<string, Built> {
    const out = new Map<string, Built>()
    for (const { side, c } of SWAP_CASES) {
        const chain = chainWith({ swap: { treatmentId: SWAP_TREATMENT, into: side.into, fromStore: side.fromStore, fromContract: side.fromContract } })
        let answer: ChainAnswer | null = null
        const result = runHandoff(c, swapInputs, { build: (r) => (answer = chain.build(r)) }, k)
        out.set(c.id, { result, answer })
    }
    return out
}
const swapBuilt = buildSwap()
const swapAt = (id: string): Built => {
    const b = swapBuilt.get(id)
    assert.ok(b, id)
    return b
}
const lensesOf = (b: Built): string[] => [...(b.answer?.account?.affordanceLenses ?? [])]
const swapPair = (side: SwapSide): Pair => {
    const [zero, diag] = side.goal === 'A02' ? ['A02-0', 'A02-D'] : ['TA02-0', 'TA02-D']
    return { goal: side.goal, zero: swapAt(`${zero}${SWAP}`), diag: swapAt(`${diag}${SWAP}`), contractId: side.into, items: side.fromItems, lenses: lensesOf(swapAt(`${diag}${SWAP}`)) }
}
const SWAP_PAIRS = SWAP_SIDES.map(swapPair)
const SWAP_COMPARISON = comparisonOf(SWAP_PAIRS[0], SWAP_PAIRS[1])

type SwapClass = 'shared' | 'swaps' | 'stays' | 'other'
/** A value with the two restatements' contract ids read as one (under the swap the other context's items carry the routed context's id). */
const unlabelled = (s: string): string => s.split(A02_CONTRACT).join('<restatement>').split(TA02_CONTRACT).join('<restatement>')
/** The two sides of the configuration lines' difference (its row's values are counts; the difference is in the lines). */
const lineSides = (cmp: { differingLines: string[] }): [string, string] => {
    const sides = cmp.differingLines.map((l) => {
        const at = l.indexOf(': ')
        const [x, y] = l.slice(at + 2).split(' | ')
        return [`${l.slice(0, at)}: ${x}`, `${l.slice(0, at)}: ${y}`]
    })
    return [sides.map((s) => s[0]).join('; '), sides.map((s) => s[1]).join('; ')]
}
/**
 * How each row moves under the swap: 'shared' (shared before and after, values unchanged), 'swaps' (each goal now reads what the other read),
 * 'stays' (each goal reads what it read: the row comes from the goal or its routing, not the restatement), 'other' (anything else).
 */
function swapClasses(before: ReturnType<typeof comparisonOf>, after: ReturnType<typeof comparisonOf>): Array<{ aspect: string; move: SwapClass }> {
    return before.rows.map((b) => {
        const a = after.rows.find((x) => x.aspect === b.aspect)
        if (!a) return { aspect: b.aspect, move: 'other' as SwapClass }
        const lines = b.aspect === 'the configuration lines (diagnostic runs)'
        const [ba, bt] = (lines ? lineSides(before) : [b.a02, b.ta02]).map(unlabelled)
        const [aa, at] = (lines ? lineSides(after) : [a.a02, a.ta02]).map(unlabelled)
        let move: SwapClass = 'other'
        if (b.kind === 'SHARED') move = a.kind === 'SHARED' && aa === ba && at === bt ? 'shared' : 'other'
        else if (ba !== bt && aa === bt && at === ba) move = 'swaps'
        else if (aa === ba && at === bt) move = 'stays'
        return { aspect: b.aspect, move }
    })
}
const SWAP_CLASSES = swapClasses(COMPARISON, SWAP_COMPARISON)
const rowsThat = (move: SwapClass) => SWAP_CLASSES.filter((x) => x.move === move).map((x) => x.aspect)

/**
 * (5) The diagnostic collapse kept visible: each differing row of the comparison put in one group by a measured predicate. 'executing': the
 * difference reaches a run's outcome or a built line; 'recorded, not executing': each context's knowledge records it, and no line of either
 * goal's runs rests on it (nothing carries it); 'not a distinction': an engine input or a row's name, with the same result.
 */
type Group = 'executing' | 'recorded, not executing' | 'not a distinction' | 'unassigned'
const restingOn = (p: Pair, ids: string[]): number =>
    [p.zero, p.diag].reduce((n, b) => n + b.result.lines.filter((l) => l.premises.some((x) => ids.some((id) => x.ref === `${p.contractId} ${id}`))).length, 0)
const clauseIds = (p: Pair, clause: string) => p.items.filter((i) => String(i.selector) === `type=${clause}`).map((i) => String(i.itemId))
function distinctionsOf(cmp: ReturnType<typeof comparisonOf>, a: Pair, t: Pair): Array<{ aspect: string; group: Group }> {
    const both = (f: (p: Pair) => boolean) => f(a) && f(t)
    const groupOf = (aspect: string): Group => {
        if (aspect === 'where the knowledge as it stands stops') return json(a.zero.result.refusalBasis?.cited) !== json(t.zero.result.refusalBasis?.cited) ? 'executing' : 'unassigned'
        if (aspect === 'the configuration lines (diagnostic runs)') return cmp.differingLines.length > 0 ? 'executing' : 'unassigned'
        if (aspect === 'the context') return both((p) => (p.zero.answer?.contracts ?? []).some((c) => c.origin === 'DRAFT_STORE' && c.contractId === p.contractId)) ? 'executing' : 'unassigned'
        const clause = ['origin', 'progression', 'control'].find((c) => aspect === `the condition's ${c} clause (our restatement's values)`)
        if (clause) return both((p) => restingOn(p, clauseIds(p, clause)) === 0) ? 'recorded, not executing' : 'executing'
        if (aspect === 'opposition (our restatement\'s participant rows)') return both((p) => restingOn(p, p.items.filter((i) => String(i.row) === 'P1').map((i) => String(i.itemId))) === 0) ? 'recorded, not executing' : 'executing'
        if (aspect === 'the approved scoring condition (its row, on the diagnostic runs)') return both((p) => p.diag.answer?.observed?.scoringCondition?.carried === false) ? 'recorded, not executing' : 'executing'
        if (aspect === 'the context\'s affordance targets (the library\'s mapping rows)') return both((p) => affordanceTargets(String(p.zero.result.receive.step1?.contextId)).every((x) => x.status === 'DEFERRED')) ? 'recorded, not executing' : 'executing'
        if (aspect === 'the engine lenses (wording-derived engine inputs)') return both((p) => (p.zero.result.consumption?.constraintCandidateIds ?? ['?']).length === 0) ? 'not a distinction' : 'executing'
        if (aspect === 'Step 2: the cells its result rests on') return cmp.rows.find((r) => r.aspect === 'Step 2: the Game Form result')?.kind === 'SHARED' ? 'not a distinction' : 'executing'
        return 'unassigned'
    }
    return cmp.rows.filter((r) => r.kind === 'DIFFERS').map((r) => ({ aspect: r.aspect, group: groupOf(r.aspect) }))
}
const A02_PAIR = pairOf('A02', a02Built('A02-0'), a02Built('A02-D'), S.at('A02-D').run.chain?.lenses ?? [])
const TA02_PAIR = pairOf('TA02', ta02At('TA02-0'), ta02At('TA02-D'), ta02Safeguard('TA02-D').run.chain?.lenses ?? [])
const DISTINCTIONS = distinctionsOf(COMPARISON, A02_PAIR, TA02_PAIR)
const inGroup = (group: Group, ds = DISTINCTIONS) => ds.filter((d) => d.group === group).map((d) => d.aspect)
const NOT_EXECUTING_WORDS = 'distinctions recorded, not executing'

/** W1 (c1) applied to TA02: TA02-0 under the declared TEST-ONLY treatment GP_COVERAGE_LENSES (the lens candidates from Step 1's Coverage row). */
const TA02_GPCL = (() => {
    const c = ta02Case('A02-0', `TA02-0${S.GPCL}`)
    c.label = `${c.id}: TA02-0 with the TEST-ONLY treatment GP_COVERAGE_LENSES (the lens candidates and signal groups from Step 1's Coverage row); TA02's context pending`
    c.resultStanding = 'TEST_ONLY_TREATMENT_NEVER_A_TA02_CONFIGURATION'
    c.testOnlyTreatments.push(copy(S.COVERAGE_LENSES))
    let answer: ChainAnswer | null = null
    const result = runHandoff(c, { ...ta02Inputs, cases: [...ta02Inputs.cases, c] }, { build: (r) => (answer = realChain.build(r)) }, k)
    return { result, answer } as Built
})()

/**
 * W4 applied to TA02: the carriers are not run for TA02 (a carrier for its origin would be a TA02 configuration, and its context is pending);
 * the mechanism they run on names no context, so one mechanism could carry both contexts' origin values once Christian's knowledge exists. Held
 * by a reading of each top-level block of the mechanism: no context id, goal id of the two goals, or context name.
 */
const CARRIER_MECHANISM: Array<[string, string[]]> = [
    ['derivation/gates.ts', ['episodeScopesOf', 'episodeCheckDecides', 'WHILE_STATE_CLAUSE', 'whileStateClause', 'BEYOND_LINE_CLAUSE', 'beyondLineClause']],
    ['derivation/run-bounded-selection.ts', ['registerWith']],
    ['derivation/draft-store.ts', ['loadIllustrativeCarriers', 'withIllustrativeCarriers']],
]
const TOP_LEVEL = ['export ', 'function ', 'const ', 'let ', 'interface ', 'type ', '/**', '//']
const CONTEXT_NAMES = ['High Press', 'Attack Development', 'A02', 'TA02']
/** The top-level block of a source text that declares `name`, from its line to the next top-level line; null where none declares it. */
function topLevelBlock(source: string, name: string): string | null {
    const lines = source.split(/\r?\n/)
    const starts = (l: string) => TOP_LEVEL.some((p) => l.indexOf(p) === 0)
    const at = lines.findIndex((l) => starts(l) && (l.includes(`function ${name}(`) || l.includes(`const ${name} =`)))
    if (at < 0) return null
    let end = at + 1
    while (end < lines.length && !starts(lines[end])) end++
    return lines.slice(at, end).join('\n')
}
/** The context ids, goal ids and context names a block names. */
const contextNamesIn = (block: string): string[] => [...new Set([...(block.match(/RPC-\d{3}/g) ?? []), ...CONTEXT_NAMES.filter((n) => new RegExp(`\\b${n}\\b`).test(block))])]
const carrierMechanismNames = (read: (file: string) => string = (file) => fs.readFileSync(path.join(HERE, '..', file), 'utf8')): string[] =>
    CARRIER_MECHANISM.flatMap(([file, names]) =>
        names.map((name) => {
            const block = topLevelBlock(read(file), name)
            return block === null ? `${file} ${name}: not found` : contextNamesIn(block).map((n) => `${file} ${name}: ${n}`).join('; ')
        }),
    ).filter(Boolean)

const shortLens = (id: unknown) => String(id).split('tl-v0-lens-').join('').split('-opportunity').join('')
const citedOf = (r: HandoffResult) => (r.refusalBasis?.cited ?? []).map((c) => c.ref).join(', ')
/** Item 6's stage-W5 sentences, each built from its measurement (a sentence the measurement contradicts says so in capitals). */
function w5Lines(): string[] {
    const now = bindingIds(ta02Items)
    const examples = Object.keys(TA02_EXAMPLE_ONLY)
    const defects = bindingDefects(ta02Items)
    const t0 = ta02At('TA02-0').result
    const pm = TA02_PRE_MERGE_CLASS.result
    const stopOf = (id: string) => `${swapAt(id).result.refusal?.stage} on ${citedOf(swapAt(id).result)}`
    const swapped = rowsThat('other').length === 0 && rowsThat('swaps').indexOf('where the knowledge as it stands stops') >= 0
    const gA = S.at(`A02-0${S.GPCL}`)
    const samePool = json(TA02_GPCL.result.consumption?.lensCandidateIds) === json(gA.result.consumption?.lensCandidateIds)
    const sameCommitted = json(TA02_GPCL.answer?.observed?.lensIds) === json(gA.answer?.observed?.lensIds)
    const carriers = carrierMechanismNames()
    return [
        `- TA02's binding items (strictness REQUIRED or EXCLUSION; stage W5): ${now.length} since the merge of the program branch (11 November 2026), ${TA02_BINDING_BEFORE.length} before it; ${defects.length === 0 ? `the difference is exactly the ${examples.length} items that rest only on the corrected row's example (${examples.join(', ')}), each kept as an example with its provenance` : `NOT exactly the example-only items: ${defects.join('; ')}`}; kept binding: ${TA02_KEPT.join(', ')} (the exclusion of possession alone and the origin clause), which no example authorizes.`,
        `- No TA02 refusal cites an example-only item (${TA02_IDS.map((id) => `${id}: ${exampleItemsCited(ta02At(id).result).join(', ') || 'none'}`).join('; ')}); TA02-0, re-measured, is refused at ${t0.refusal?.stage} on ${citedOf(t0)} alone. The negative control: over a TEST-ONLY copy of the store with those items put back to their class before the merge, TA02-0 is refused at ${pm.refusal?.stage} on ${citedOf(pm)} (example-only items cited: ${exampleItemsCited(pm).join(', ') || 'none'}).`,
        `- The swap control (stage W5, TEST-ONLY: the two contexts' restatements exchanged on the chain's copy, after each store's own gate admitted it whole; every other input each run's own): A02 then stops at ${stopOf(`A02-0${SWAP}`)}, where TA02 stopped, and TA02 at ${stopOf(`TA02-0${SWAP}`)}, where A02 stopped; ${swapped ? 'the rows that come from each context\'s restatement swap' : 'NOT every row from the restatements swaps'} (${rowsThat('swaps').join('; ')}); the shared rows do not move (${rowsThat('shared').join('; ')}); the rows read from the goal or its routing stay (${rowsThat('stays').join('; ')}). So the differences between the two goals' runs come from each context's knowledge and its routing, not from the goals' names: ${cite('A02-10NOV-REUSE', 2)}`,
        `- ${NOT_EXECUTING_WORDS}: ${inGroup('recorded, not executing').join('; ')}. Executing: ${inGroup('executing').join('; ')}. Not a distinction (an engine input, or a row's name with the same result): ${inGroup('not a distinction').join('; ')}. So today the two contexts stay apart in a run only where each stops (and in the source of one transition line): with every condition item withheld (the diagnostic), the two built activities collapse into one (${COMPARISON.sentencesIdentical ? 'identical coach text' : 'different coach text'}), the outcome Christian asked to avoid: ${cite('A02-10NOV-REUSE', 3)}`,
        `- Stages W1 to W4 where they apply to TA02 (no TA02 configuration; its context pending): K2's result in place of a per-goal record, and Step 1's Game Problem governing the hints, as for A02 (above). Under GP_COVERAGE_LENSES (TEST-ONLY), TA02-0's lens candidates are ${samePool ? 'the pool A02-0 has under it' : 'NOT the pool A02-0 has under it'}, CV-015's ${(TA02_GPCL.result.consumption?.lensCandidateIds ?? []).length}, and the lenses committed are ${sameCommitted ? 'the same three in the same order' : 'NOT the same'} (${(TA02_GPCL.answer?.observed?.lensIds ?? []).map(shortLens).join(', ')}): the lens difference above comes from the wording alone. The quota switch and FOUNDATION_PRESENCE_BYPASS do not apply: both goals take K2's empty set, which the zero branch commits before any size, role-mix or package check. The High Press Escape coach-rule correction is RPC-002's; the action-word check reads both restatements. The ILLUSTRATIVE carriers are not run for TA02 (a carrier of its origin would configure TA02): their mechanism ${carriers.length === 0 ? 'names no context, neither goal and no context name' : `NAMES ${carriers.join('; ')}`} (read block by block), so one mechanism could carry either context's origin value once Christian's knowledge exists.`,
    ]
}
/** Appendix C's stage-W5 part: the swap control row by row, the swap runs, the distinctions, TA02's binding items, TA02 under GP_COVERAGE_LENSES. */
function w5Appendix(): string[] {
    const out: string[] = []
    out.push('THE SWAP CONTROL (stage W5; TEST-ONLY: A02 over our restatement of RPC-003, TA02 over our restatement of RPC-002, each on the chain\'s copy of its own store; how each row moves: shared, swaps, stays):')
    for (const r of SWAP_COMPARISON.rows) {
        out.push(`- ${r.aspect}: ${SWAP_CLASSES.find((x) => x.aspect === r.aspect)?.move}`)
        out.push(`   A02 over RPC-003's restatement: ${plain(r.a02)}`)
        out.push(`   TA02 over RPC-002's restatement: ${plain(r.ta02)}`)
    }
    out.push(`the configuration lines that differ under the swap: ${SWAP_COMPARISON.differingLines.map(plain).join('; ') || 'none'}`)
    for (const id of [...swapBuilt.keys()]) {
        const r = swapAt(id).result
        out.push(`- ${id}: ${r.chain?.outcome}${r.chain?.stage ? ` at ${r.chain.stage}` : ''}${r.refusalBasis ? ` on ${citedOf(r)} (${r.refusalBasis.verdict})` : ''}; ${r.lines.length} lines, ${r.sentences.length} sentences`)
    }
    out.push(`THE DISTINCTIONS (stage W5; each differing row of the comparison above, by a measured predicate):`)
    for (const g of ['executing', 'recorded, not executing', 'not a distinction'] as Group[]) out.push(`- ${g === 'recorded, not executing' ? NOT_EXECUTING_WORDS : g}: ${inGroup(g).join('; ')}`)
    out.push(`TA02'S BINDING ITEMS (stage W5; strictness REQUIRED or EXCLUSION): before the merge of the program branch ${TA02_BINDING_BEFORE.join(', ')}; since it ${bindingIds(ta02Items).join(', ')}; kept as examples ${Object.keys(TA02_EXAMPLE_ONLY).join(', ')}; defects: ${bindingDefects(ta02Items).join('; ') || 'none'}`)
    out.push(`TA02-0 over the TEST-ONLY copy with the example-only items in their class before the merge (the negative control): ${TA02_PRE_MERGE_CLASS.result.chain?.outcome} at ${TA02_PRE_MERGE_CLASS.result.chain?.stage} on ${citedOf(TA02_PRE_MERGE_CLASS.result)}`)
    out.push(`TA02-0 under GP_COVERAGE_LENSES (stage W5, the treatment of stage W1 (c1)): ${TA02_GPCL.result.chain?.outcome} at ${TA02_GPCL.result.chain?.stage}; lens candidates ${(TA02_GPCL.result.consumption?.lensCandidateIds ?? []).map(shortLens).join(', ')}; committed ${(TA02_GPCL.answer?.observed?.lensIds ?? []).map(shortLens).join(', ')}`)
    out.push('')
    return out
}

/** A01, built by the production entry after the TA02 runs (beside the safeguard test's before and after). */
const A01_END = S.a01Hash()

// ---------------------------------------------------------------------------------------------------------------------------------------
// The constraint selector's TEST-ONLY hunks: disclosed first in the report and in the README, each held to the file's text by the test
// ---------------------------------------------------------------------------------------------------------------------------------------

const SELECTOR_FILE = 'generateSelection.ts'
const SELECTOR_PATH = path.join(HERE, '..', 'test-library', SELECTOR_FILE)
/**
 * Re-pinned openly in stage W2 (11 November 2026): every place renumbered by the stage's hunks above it (700-702 -> 704-705, 715-718 ->
 * 718-721, 784-785 -> 787-790, 798 -> 803, 835 -> 840, 885-895 -> 891-906, 1031-1037 -> 1040-1048, 1061 -> 1072-1073, 1083 -> 1095); two
 * reworded for what the switch now does (the size rule admits exactly the set's size, was 1 up to it; the sizes tried are the set's own only,
 * were 2, 3, 4 and the set's own); and the stage's places added: the pool searched whole (662-667, 685, 836), the package check's options
 * (852-853), the treatment's parameter (in 891-906) and SwitchChecks (1213-1232).
 */
const SELECTOR_HUNKS: Array<{ lines: string; at: number; holds: string; what: string }> = [
    { lines: '662-667', at: 666, holds: 'wholePool = false', what: 'the bounded search over constraints takes whether to search the pool whole, false unless the switch is on (stage W2)' },
    { lines: '685', at: 685, holds: 'wholePool ? byBucket[bucket] : byBucket[bucket].slice(0, BOUNDED_SEARCH_TOP_CONSTRAINTS_PER_BUCKET)', what: 'searched whole, its cap of 2 per role is not applied' },
    { lines: '704-705', at: 705, holds: 'quotaBypassOwnSize: number | null = null', what: 'the size rule\'s function takes the authorized set\'s own size, null unless the switch is on' },
    { lines: '718-721', at: 718, holds: 'if (quotaBypassOwnSize !== null) {', what: 'given that size, the size rule admits exactly it instead of 2 to 4 (the first of the two places the size rule lives; the set whole, stage W2)' },
    { lines: '787-790', at: 788, holds: 'constraintSizes: number[]', what: 'the enumeration takes the list of sizes it tries, and the switch\'s checks (stage W2)' },
    { lines: '803', at: 803, holds: 'constraintSizes, switchChecks } = ctx', what: 'the enumeration reads them' },
    { lines: '836', at: 836, holds: 'boundedConstraintCandidates(conScored, allConstraints, switchChecks.wholePool)', what: 'the enumeration searches the record\'s pool whole under the switch' },
    { lines: '840', at: 840, holds: 'for (const conSize of constraintSizes) {', what: 'the enumeration tries the listed sizes instead of the fixed 2, 3 and 4 (the second place)' },
    { lines: '852-853', at: 853, holds: '...switchChecks.packageCheck,', what: 'the package check receives the switch\'s options: every selected member validated and, under its treatment, no foundation presence; nothing without the switch' },
    { lines: '891-906', at: 903, holds: 'quotaBypass = false,', what: 'the selector takes the switch, off unless a caller passes it, and (stage W2) the treatment FOUNDATION_PRESENCE_BYPASS, off unless a caller passes it' },
    { lines: '1040-1048', at: 1043, holds: 'if (quotaBypass && !(recordBacked && constraintPool.constraintPrinciple !== null)) {', what: 'the switch is honoured only for an evaluated authorization record and throws for any other pool; under it the only size tried is the set\'s own, and the switch\'s checks are made (the treatment refused without the switch)' },
    { lines: '1072-1073', at: 1072, holds: 'constraintSizes,', what: 'the sizes and the switch\'s checks are handed to the enumeration' },
    { lines: '1095', at: 1095, holds: 'assertSelectionContract(bestLensCombo, bestConCombo, zeroConstraintCommitment, quotaBypassOwnSize)', what: 'the own size is handed to the size rule' },
    { lines: '1213-1232', at: 1227, holds: 'type SwitchChecks = ', what: 'what the switch adds (the set whole, the pool whole, every selected member validated) and the treatment (no foundation presence), and the treatment refused without the switch (stage W2)' },
]
/**
 * Stage W2 (11 November 2026): the places of the selector's package check, and of the package builder and validator it calls, that the switch
 * reaches (every selected member validated) and the treatment FOUNDATION_PRESENCE_BYPASS reaches (no foundation member required), each held to
 * its file's text. Only the package check passes them (the static test of upstream-consumption.unit.ts pins it); without them each reads every
 * production package exactly as before.
 */
const PACKAGE_HUNKS: Array<{ file: string; lines: string; at: number; holds: string; what: string }> = [
    { file: 'test-library/selection-compatibility.ts', lines: '25-41', at: 32, holds: 'everyMemberValidated?: true', what: 'the package check takes two TEST-ONLY options, every selected member validated and no foundation presence, and names the words of the tightening\'s refusal' },
    { file: 'test-library/selection-compatibility.ts', lines: '110-123', at: 111, holds: 'if (input.foundationPresenceBypass && !input.everyMemberValidated) throw', what: 'the treatment only with the tightening (refused otherwise); under it the package built and validated without the foundation clause, then every member\'s presence checked' },
    { file: 'test-library/selection-compatibility.ts', lines: '127-128', at: 128, holds: 'if (input.everyMemberValidated) refuseAbsentMembers(', what: 'without the treatment, under the switch only, every member\'s presence checked after the package\'s own checks' },
    { file: 'test-library/selection-compatibility.ts', lines: '137-145', at: 141, holds: 'function refuseAbsentMembers(', what: 'the tightening: a selected constraint absent from the checked package is refused, named' },
    { file: 'build-constraint-package.ts', lines: '349-350', at: 350, holds: 'foundation: ConstraintSelectionCandidate | undefined,', what: 'the exchange builder tolerates an absent foundation (read only into the overlay\'s list, which skips it)' },
    { file: 'build-constraint-package.ts', lines: '606-629', at: 623, holds: 'testOnly: FoundationPresenceBypass): FoundationOptionalPackage', what: 'the treatment\'s type and the builder\'s TEST-ONLY fourth parameter; three arguments return the package as before' },
    { file: 'build-constraint-package.ts', lines: '635', at: 635, holds: 'if (!foundation && testOnly?.foundationPresenceBypass !== true) {', what: 'the foundation clause, not applied under the treatment' },
    { file: 'build-constraint-package.ts', lines: '651-654', at: 651, holds: 'foundation ? [foundation.constraint._id] : []', what: 'the shaping and consequence picks exclude the foundation only where one was picked' },
    { file: 'validate-constraint-package.ts', lines: '2', at: 2, holds: 'import type { FoundationOptionalPackage, FoundationPresenceBypass }', what: 'a type-only import of the treatment\'s types' },
    { file: 'validate-constraint-package.ts', lines: '302-313', at: 307, holds: 'testOnly: FoundationPresenceBypass): void', what: 'the validator\'s TEST-ONLY fourth parameter; three arguments validate as before' },
    { file: 'validate-constraint-package.ts', lines: '333', at: 333, holds: 'if (!constraintPackage.foundation && testOnly?.foundationPresenceBypass !== true) {', what: 'the foundation clause, not applied under the treatment; every other check unchanged' },
]
/**
 * Stage W1 (b), 11 November 2026: the selector's places for the review pathway's K2 result, disclosed apart from the switch (they are not the
 * switch), each held to the file's text. No production pool carries REVIEW_PATHWAY_K2 (the static test of upstream-consumption.unit.ts pins
 * that selectFor's upstream branch alone writes it), so each reads every production pool exactly as before.
 */
// Stage W2, re-pinned openly (renumbered by the stage's hunks above them): 1029 -> 1039 (its text's :1033 -> :1043), 1186-1199 -> 1198-1211.
const K2_SELECTOR_HUNKS: Array<{ lines: string; at: number; holds: string; what: string }> = [
    { lines: '152', at: 152, holds: 'constraintAuthority: authority ? authority.authority : (\'VOCABULARY_POOL\' as const),', what: 'the pool\'s authority is read from the hint (AUTHORIZATION_RECORD for every production hint), so K2\'s is never relabelled' },
    { lines: '168', at: 168, holds: 'source: authority ? authority.authority : \'GOAL_CANDIDATES\',', what: 'the pool\'s source likewise' },
    { lines: '1039', at: 1039, holds: 'const authorizesNone = (recordBacked || reviewPathwayK2EmptySet(constraintPool)) && constraintPool.candidateIds.length === 0', what: 'the zero branch admits K2\'s result, as an empty set only (the quota bypass stays record-only, :1043)' },
    { lines: '1198-1211', at: 1205, holds: 'function reviewPathwayK2EmptySet(pool: ConstraintPoolAccount): boolean {', what: 'the guard: false for every other pool, true for K2\'s empty set, and it throws for a K2 pool with any candidate (K2 authorizes no manipulation)' },
]

// ---------------------------------------------------------------------------------------------------------------------------------------
// The key: every identifier the report's frame and seven items use (names read from the knowledge files where they hold them)
// ---------------------------------------------------------------------------------------------------------------------------------------

const goalName = (id: string) => String(k.planning.learning_goals.find((g) => cell(g, 'ID') === id)?.['Learning Goal'] ?? '')
const gpName = (id: string) => String(k.gameProblems.gameProblems.find((g) => cell(g, 'ID') === id)?.['Name'] ?? '')
const formName = (id: string) => String(k.sportModule.game_forms.find((f) => cell(f, 'game_form_id') === id)?.['game_form_name'] ?? '')
const CAR_NAMES = carRequirementNames(k)
/** An exact identifier, or (family) every identifier beginning with it. */
const KEY: Array<{ id: string; family?: boolean; means: string }> = [
    // Stage W2: the other goals whose production selections item 4 measures.
    ...['A01', 'A02', 'TA02', 'A03', 'A04', 'A05', 'A06', 'D01', 'D02', 'TA01', 'TD01', 'TD02'].map((id) => ({ id, means: `the Learning Goal '${goalName(id)}' (the planning model)` })),
    ...['GP-015', 'GP-002', 'GP-001'].map((id) => ({ id, means: `the Game Problem '${gpName(id)}' (the Game Problem library)` })),
    ...['GF2', 'GF3', 'GF7'].map((id) => ({ id, means: `the Game Form '${formName(id)}' (the sport module, a DRAFT module whose Game Problem cells we restate as CANDIDATE)` })),
    ...['RPC-002', 'RPC-003'].map((id) => ({ id, means: `the Representative Performance Context '${nameOfContext(id)}' (the context library)` })),
    { id: 'CAR', means: `the CAR Matrix: each Game Problem's rating of four affordance requirements, ${Object.entries(CAR_NAMES).map(([x, n]) => `${x} '${n}'`).join(', ')} (E: Essential)` },
    { id: 'RPC-PROP-133', means: 'the approved primary scoring condition of High Press Escape (a row of the context library)' },
    { id: 'RPC-PROP-134', means: 'the approved primary scoring condition of Attack Development (a row of the context library)' },
    { id: 'RPC-PROP-018', means: 'a begin condition of High Press Escape (a row of the context library)' },
    { id: 'RPC-PROP-030..033', means: 'the behaviour-adjustment rows of High Press Escape (the context library): support angles, pressing numbers, spacing and progression corridors, field dimensions' },
    { id: 'RPC-REL-', family: true, means: 'a relationship row of the context library (RPC-REL-075..078: the four approved primary scoring events of High Press Escape)' },
    { id: 'RPC-ID-', family: true, means: 'an identity row of the context library' },
    { id: 'RPC-MAP-', family: true, means: 'a mapping row of the context library staging a context\'s affordance target (each DEFERRED)' },
    { id: 'RPC-002-', family: true, means: 'an item of our CANDIDATE restatement of High Press Escape (TEST-ONLY draft store), each beside the approved row it restates in appendix A' },
    { id: 'RPC-003-', family: true, means: 'an item of our DRAFT (CANDIDATE) restatement of Attack Development (TEST-ONLY draft store, 27 October)' },
    { id: 'c:restated:', family: true, means: 'a configuration line of the built game: c:<contract>:<item>::<register row>, the item that forms it and the property it sets (V5 a scoring condition\'s referent, V6 its value)' },
    { id: 'A02-0', means: 'the A02 run of the knowledge as it stands, with our CANDIDATE restatement (no TEST-ONLY treatment beyond the consumption and the draft store)' },
    { id: 'A02-1', means: 'the A02 run with the origin and progression items withheld (TEST-ONLY)' },
    { id: 'A02-1b', means: 'A02-1 with the control referent declared to need no further value (TEST-ONLY, not ruled) and the Laws held to our DRAFT classification' },
    { id: 'A02-2', means: 'A02-1b with the TEST-ONLY stand-in that reads the offside law procedural' },
    { id: 'A02-2~', family: true, means: 'A02-2 under a reworded goal (~reversed, ~neutral: the goal\'s wording rewritten in the knowledge copy and in the row the chain reads, as in item 1)' },
    { id: 'A02-D', means: 'the A02 diagnostic: every condition item withheld (TEST-ONLY), the offside stand-in: plain GF2' },
    { id: 'TA02-0', means: 'the TA02 run of the knowledge as it stands, with our DRAFT restatement of Attack Development (the reuse comparison)' },
    { id: 'TA02-D', means: 'the TA02 diagnostic, as A02-D (the reuse comparison)' },
    { id: 'L1', means: 'the legacy route: A02 on the production records, nothing consumed (the route the production chain takes)' },
    { id: 'L2', means: 'the chain\'s own route: A02 with our TEST-ONLY draft store (our DRAFT record and our restatement), nothing consumed, nothing placed' },
    { id: 'S4-', family: true, means: 'a run of item 4: manipulations entered only through the DRAFT record\'s authorized set (NP Neutral Player, WZA Wide Zone Advantage, TR Turnover Reward, CDC Central Density Condition, IR Interception Reward; /no-bypass: without the switch, the size-rule bypass; /foundation-kept: under the switch without FOUNDATION_PRESENCE_BYPASS, its reversal arm; @A02-D: on the diagnostic base A02-D; ~reversed, ~neutral: under a reworded goal, as A02-2~)' },
    { id: 'OD-', family: true, means: 'an open disconnection the safeguards detect, listed with its measured evidence in appendix B; printed as open, never as a pass' },
    { id: 'TT-', family: true, means: 'a TEST-ONLY treatment, labelled where it enters (appendix A and appendix D)' },
    { id: 'W-DROPS-UPSTREAM', means: 'a control of item 3: A02-0 under a reworded goal, with a TEST-ONLY wrapper that drops the decisions handed to the chain' },
    { id: 'NO-RESTATEMENT', means: 'the A02 run consumed with the DRAFT record only, no restatement of High Press Escape in the store (item 5)' },
    { id: 'V5', means: 'the register row of a scoring condition\'s referent' },
    { id: 'V6', means: 'the register row of a scoring condition\'s value' },
    { id: 'LAW-11', means: 'Law 11 (Offside)' },
    { id: 'LAW-8', means: 'Law 8 (The Start and Restart of Play)' },
    { id: 'D3', means: 'Christian\'s decision D3 (received 4 November 2026): Game Form relationships are compatibility information unless approved knowledge establishes a preference' },
    { id: 'M6', means: 'one of the eight A01 safeguards Christian approved: no further value required, explicitly unrestricted, and a necessary value missing stay three distinct states' },
    { id: 'K2', means: 'the K2 wording we proposed (retaining a basic Game Form), approved by Christian for review-only use (received 7 November 2026, first reply); under it the review pathway proposes no manipulation where none has an authorized basis (appendix D, 5. Manipulations); quoted in item 5' },
    { id: 'E5', means: 'Christian\'s E5, design authorization (received 3 November 2026); quoted in item 5' },
    { id: 'W1', means: 'stage W1 of the A02 package (engineering Christian delegated, received 11 November 2026, second reply), built 11 November 2026: (a) Step 1\'s Game Problem governs the chain\'s lens hints and matched signals on the isolated pathway; (b) the review pathway\'s K2 result is consumed in place of a per-goal authorization record; (c1) the TEST-ONLY treatment GP_COVERAGE_LENSES, both lens arms measured' },
    { id: 'W2', means: 'stage W2 of the A02 package (engineering Christian delegated, received 11 November 2026, second reply), built 11 November 2026: quotas against justified validation; under the TEST-ONLY switch the authorized set is taken whole, its pool uncapped and every selected member validated, and foundation presence is bypassed only under FOUNDATION_PRESENCE_BYPASS' },
    // Stage W5 (12 November 2026): item 6 names stages W4 and W5.
    { id: 'W4', means: 'stage W4 of the A02 package (engineering Christian delegated, received 11 November 2026, second reply), built 11 November 2026: ILLUSTRATIVE carriers (TEST-ONLY, never knowledge) for High Press Escape\'s origin and progression clauses and both third-clause alternatives, run by their own registered test, not in this report' },
    { id: 'W5', means: 'stage W5 of the A02 package (engineering Christian delegated, received 11 November 2026, second reply), built 12 November 2026: the reuse comparison after the merge of the program branch: TA02\'s binding items, the example-only items no refusal cites, the swap control, the distinctions recorded and executing, and stages W1 to W4 where they apply to TA02' },
    { id: 'FOUNDATION_PRESENCE_BYPASS', means: 'a TEST-ONLY treatment (stage W2), declared beside the switch on the quota runs: a package need hold no foundation (structure-role) member; our classification of foundation presence as a quota, which Christian can reverse by its removal (its reversal arm, /foundation-kept, is kept beside it)' },
    { id: 'MEMBER_PRESENCE', means: 'a selection check added under the switch (stage W2, a tightening): a set any member of which is absent from the checked package (it holds one member per role, and drops a consequence scoring 12 or less) is refused, never committed unvalidated' },
    { id: 'PACKAGE_OTHER', means: 'the other package checks of the selection (rows h-j, l-n, p: a one-sided package, vague language, compliance-heavy members and the like)' },
    { id: 'PACKAGE_ROW_K', means: 'the selection check that each member of a package supports the selected affordance tag group (row k)' },
    { id: 'Q-a1', means: 'our question to Christian (stage W2): may an authorization record ever be a menu to choose among, and on what learning-design basis; until it is answered the set is taken whole, and a strict subset built reads UNAUTHORIZED_SOURCE' },
    { id: 'GP_COVERAGE_LENSES', means: 'a TEST-ONLY treatment (stage W1 (c1)), never the default: the chain\'s lens candidates and signal groups taken from Step 1\'s Game Problem Coverage row in both branches, so they no longer follow the wording' },
    { id: 'CV-015', means: 'the sport module\'s Coverage row for GP-015: the candidate knowledge it records for that Game Problem (its lenses read under GP_COVERAGE_LENSES)' },
    { id: 'Q-a2', means: 'our question to Christian, open since 10 November 2026: whether the kept checks that read lenses should read the wording\'s top three, any combination of the Game Problem\'s lenses, or every combination' },
    { id: 'REVIEW_PATHWAY_K2', means: 'the constraints\' authority where the chain takes the review pathway\'s K2 result in place of a per-goal authorization record (TEST-ONLY, stage W1 (b)): the empty set only, never relabelled AUTHORIZATION_RECORD' },
    { id: 'K2_NOT_TAKEN', means: 'a verdict (stage W1 (b)): the review pathway proposed no manipulation, so its K2 result applies, and a TEST-ONLY record of ours stood in for it (the DRAFT-record comparison arm; a detected disconnection, never a pass)' },
    { id: 'RC1.1', means: 'the version of the Representative Performance Context Library the program holds (its rows\' last verified version)' },
    { id: SELECTOR_FILE, family: true, means: 'the constraint selector\'s source file, with line numbers; any other name ending .ts is an engine source file, with line numbers, and a short hexadecimal string after one (its origin) is a commit, found by git blame, that introduced the rule or the part of it named beside it' },
    { id: 'TEST-ONLY', means: 'code, data or a treatment no route, controller or service reaches' },
    { id: 'RESTATEMENT-ONLY', means: 'a refusal whose cited items are all ours and unreviewed (Christian\'s second reply of 7 November, section 2)' },
    { id: 'APPROVED_TRANSLATION', means: 'Step 1\'s basis: the goal\'s approved translation row in the planning model' },
    { id: 'SELECTION_TRACE_RANKING', means: 'where the chain\'s record of the forms its scorer ranked is read (its selection trace)' },
    { id: 'AUTHORIZATION_RECORD', means: 'the constraints\' authority: the authorization record\'s set (here a DRAFT record of ours, no ruling field filled)' },
    { id: 'VOCABULARY_POOL', means: 'the constraints\' authority the engine records where no authorization record governs: the goal\'s own candidate constraints (from its Game Problem\'s Coverage row, or the wording), which no record authorizes; nothing is drawn from outside them' },
    { id: 'ENGINE_LENS', means: 'an affordance lens the engine scores from the goal\'s wording: an engine input, not knowledge' },
    { id: 'NO_COMPATIBLE_COMBINATION', means: 'the selector\'s refusal: no combination of lenses and constraints passed its checks' },
    { id: 'FOUNDATION_CLAUSE', means: 'the selection check that a non-empty package holds a foundation constraint (its keyword threshold decides which structure member is picked); since stage W2 bypassed only under FOUNDATION_PRESENCE_BYPASS' },
    { id: 'PACKAGE_ROW_O', means: 'the selection check that a package shows a clear relationship to the selected affordance (row o)' },
    { id: 'CONSUMED', means: 'a verdict: the value equals the upstream one and the chain\'s own record shows the decision was made from it (the forms its scorer was handed; the record\'s pool)' },
    { id: 'CARRIED_NOT_READ', means: 'a verdict: the chain carries the upstream value as a record that no decision of the chain reads (a detected disconnection, never a pass, never consumption)' },
    { id: 'AGREES_INDEPENDENTLY', means: 'a verdict: equal values with no record of consumption (a latent disconnection, never counted as consumption)' },
    { id: 'CONTRADICTED', means: 'a verdict: the value used downstream differs from the upstream one' },
    { id: 'REFUSED_ON_OWN_CHOICE', means: 'a verdict: the chain refused on its own choice before consuming the upstream one' },
    { id: 'ENGINE_RULE_DECIDED', means: 'a verdict: after the form was consumed, an engine rule refused the selection (a detected disconnection where attributed to a check kept under the authorization\'s section 5; a violation otherwise)' },
    { id: 'CARRIED', means: 'a verdict: every open item constituting the clause reached derivation and lines of the built game rest on each, none of them without a value; no declaration replaced' },
    { id: 'CARRIED_UNDER_TREATMENT', means: 'a verdict: the clause is carried only with a declaration replaced by a TEST-ONLY treatment (a detected disconnection, never a pass)' },
    { id: 'CITED_NOT_CARRIED', means: 'a verdict: an approved row is cited (or displayed) while nothing carries it, or only part of it' },
    { id: 'WITHHELD_BY_TREATMENT', means: 'a verdict: a declared TEST-ONLY treatment withheld it (a detected disconnection, never a pass)' },
    { id: 'REFUSED_ON_CLAUSE_LINE', means: 'a verdict: the run\'s refusal cites a line of the clause\'s own items, so the clause was decided and stays explicitly unresolved (a detected disconnection, never a pass); read from the lines a refusal cites as c:<contract>:<item>::<row>; a later refusal naming the item by its value path leaves the clause\'s carriage verdict in place (item 2 says where)' },
    { id: 'NOT_REACHED', means: 'a verdict: the run stopped before the decision' },
    { id: 'NOT_CLASSIFIED', means: 'the requirement account\'s state for a scoring condition with no requirement bindings: never a pass' },
    { id: 'NOT_AUTHORED', means: 'a restatement declaration: nothing authored the value' },
    { id: 'UNDECLARED', means: 'a restatement declaration: whether a value is owed is not stated' },
    { id: 'NO_FURTHER_VALUE', means: 'a declaration that a value needs no further referent: here only a TEST-ONLY treatment, not ruled' },
    { id: 'OUTSIDE_BOUNDARY', means: 'an item recorded outside what the engine can check: it establishes nothing' },
    { id: 'TEST ASSUMPTION', means: 'Christian\'s class 4: a stated test assumption, never knowledge' },
    { id: 'UNAUTHORIZED_SOURCE', means: 'a verdict: constraints built from a source the authorization record does not authorize (the goal\'s own candidate constraints where no record authorizes them, VOCABULARY_POOL, or a constraint outside the record\'s set)' },
    { id: 'violation verdict', means: `a verdict that fails the assertion every experiment run must pass: ${VIOLATION_VERDICTS.map((v) => (v === 'MISSING' ? 'MISSING (a reached decision without its record)' : v)).join(', ')}, or ENGINE_RULE_DECIDED where no kept check is attributed; each one on the experiment path is listed as an open disconnection` },
    // A02 package W4 (11 November 2026): CARRIED_UNDER_ILLUSTRATION (detected, never a pass) is read only on the carrier runs of
    // a02-carriers.unit.ts, which this report does not hold yet (W6 consolidates them), so the key lists the verdicts this report's runs can read.
    { id: 'detected disconnection', means: `a verdict printed as an open finding, never a pass and never a violation: ${DETECTED_VERDICTS.filter((v) => v !== 'CARRIED_UNDER_ILLUSTRATION').join(', ')}, or ENGINE_RULE_DECIDED attributed to a kept check` },
    // The chain's stages a run of this report stops at, in chain order (R4-11): a run is refused at the first stage whose check fails.
    { id: 'selection', means: 'the chain\'s stage that chooses the engine lenses and the constraints on the candidate forms (on the legacy route also the form); refused where no combination passes its checks' },
    { id: 'knowledge', means: 'the stage after selection that checks the knowledge the build needs; in these runs, that the form, the context and each authorized constraint have a contribution contract' },
    { id: 'structure', means: 'the stage that derives the game\'s configuration lines from the contracts and checks them; in these runs, a line that must hold a value and holds none refuses the run' },
    { id: 'realization', means: 'the stage that closes the open lines with the realization choices, within their authored bounds' },
    { id: 'validation', means: 'the stage that checks the realized game; in these runs, the Laws check' },
    { id: 'communication', means: 'the last stage, the coach text; in these runs, a line with no approved wording, or that no sentence carries, refuses the run' },
    { id: 'contribution contract', means: 'the engine-readable form of a knowledge row (a form, a context or a constraint), without which the row cannot shape a game' },
    { id: 'row k', means: 'the selection check that each member of a package supports the selected affordance tag group (a package check, beside row o)' },
    { id: 'zero branch', means: 'the selector\'s commitment of an evaluated, empty authorized set, before the size, role-mix and package checks (which then do not run)' },
    { id: 'passed by', means: 'printed after a stop as (passed by X): the later path X gets past that stop' },
    { id: 'inThisActivity', means: 'the chain\'s account field saying whether the context\'s approved condition is in this activity' },
]
/** The key entry for a token: exact, or a family the token begins with (a family's id without its last separator counts). */
const keyOf = (token: string) =>
    /\.ts(?::|$)/.test(token) ? KEY.find((e) => e.id === SELECTOR_FILE) : KEY.find((e) => (e.family ? token.indexOf(e.id) === 0 || `${token}-` === e.id || `${token}:` === e.id : token === e.id))
/**
 * The identifiers a text uses outside Christian's quoted words: a token holding a capital and a digit, capitals joined by a hyphen or an
 * underscore, or a source file name.
 */
function identifiersOf(text: string): string[] {
    const found = new Set<string>()
    text.split(Q).forEach((segment, n) => {
        if (n % 2 === 1) return
        for (const raw of segment.split(/[\s,;()[\]'/]+/)) {
            const token = raw.replace(/^[^A-Za-z0-9]+/, '').replace(/[^A-Za-z0-9]+$/, '')
            if (!token) continue
            if ((/[A-Z]/.test(token) && /[0-9]/.test(token)) || /^[A-Z][A-Z0-9]*(?:[-_][A-Z0-9]+)+$/.test(token) || /\.ts(?::|$)/.test(token)) found.add(token)
        }
    })
    return [...found].sort()
}

// ---------------------------------------------------------------------------------------------------------------------------------------
// The report: the frame, the disclosure, the key, Christian's seven items, then the detailed texts
// ---------------------------------------------------------------------------------------------------------------------------------------

const A02_RUN_IDS = experiment.runOrder
const reachedChain = S.EXPERIMENT_RUNS.filter((id) => S.at(id).run.chain !== null)
const verdictOn = (row: string, verdict: string) => reachedChain.filter((id) => S.verdictOf(id, row) === verdict).length
const clauseCounts = (clause: string) => {
    const counts: Record<string, number> = {}
    for (const id of S.EXPERIMENT_RUNS) {
        const v = S.verdictOf(id, 'SCORING', clause)
        counts[v] = (counts[v] ?? 0) + 1
    }
    return counts
}
const failureOf = (findings: Finding[]): string => {
    try {
        S.assertExperimentRun(findings)
    } catch (error) {
        return (error as Error).message
    }
    return 'PASSED'
}
/** A02-D with its declared treatment removed (a doctored copy of its own result, as test 6 of the safeguards does): the clauses' verdicts. */
const doctoredA02D = (() => {
    const d = S.at('A02-D')
    const doctored = copy(d.result)
    doctored.testOnlyTreatments = doctored.testOnlyTreatments.filter((t) => t.id !== 'TT-WITHHOLD-CONDITION')
    return ownershipOf(safeguardRunOf(doctored, d.answer, true, { ...S.K2_FACTS, standIns: [], scoring: S.SCORING, engineRule: null }))
})()
const entry = (id: string): OpenDisconnection => {
    const e = S.OPEN_DISCONNECTIONS.find((x) => x.id === id)
    assert.ok(e, id)
    return e
}
const standInLines = (id: string) => S.at(id).result.lines.filter((l) => l.premises.some((p) => p.kind === 'STAND_IN'))
const disposition = (id: string) => {
    const d = DISPOSITION.find((x) => x.id === id)
    assert.ok(d, id)
    return d
}
const verdictsOf = (findings: Finding[], row: string) => findings.filter((f) => f.row === row).map((f) => f.verdict)
/** The experiment runs that commit a lone set of one manipulation under the size-rule bypass: those the switch's removal would refuse (NF-02). */
const LONE_RUNS = S.EXPERIMENT_RUNS.filter((id) => S.at(id).result.consumption?.sizeRuleBypassed === true && (S.at(id).run.chain?.constraints ?? []).length === 1)
/**
 * RC1-N3: the runs whose clause reads CARRIED_UNDER_TREATMENT and whose later refusal names one of that clause's items by its value path
 * (conditions[c:<contract>:<item>]), not as a cited line: the verdict, read from the lines a refusal cites, keeps the carriage verdict.
 */
const valuePathRefusals = (clause: string) => {
    const items = S.SCORING.clauses.find((c) => c.clause === clause)?.items ?? []
    return S.EXPERIMENT_RUNS.filter((id) => S.verdictOf(id, 'SCORING', clause) === 'CARRIED_UNDER_TREATMENT')
        .map((id) => ({ id, stage: S.at(id).result.chain?.stage ?? null, reasons: (S.at(id).result.chain?.reasons ?? []).filter((x) => items.some((i) => x.indexOf(`[c:${S.SCORING.contractId}:${i}]`) >= 0)) }))
        .filter((x) => x.reasons.length > 0)
}

/**
 * Batch A4 (the lead's decision, from the delivery review): a gap found in review that the safeguards could not detect, said in items 1 and 3
 * and in the README's known limitations. Since stage W1 (b) (11 November 2026) the experiment path takes K2's result and the safeguards see the
 * difference: their ownership row names every upstream result the chain can take, and a run where our record stood in reads K2_NOT_TAKEN.
 */
const K2_NOT_TAKEN = 'Taken since stage W1 (b) (11 November 2026), our reading, put to Christian (item 5): on the experiment path the checked pathway takes the review pathway\'s proposal of no manipulation under K2 in place of a per-goal authorization record (REVIEW_PATHWAY_K2, the empty set only, K2\'s limit carried into the account); the safeguards\' ownership row now names every upstream result the chain can take, and the DRAFT-record comparison arm, where our TEST-ONLY record stands in for K2\'s result, reads K2_NOT_TAKEN (a detected disconnection, never a pass).'

function bodyLines(): string[] {
    const out: string[] = []
    const add = (...l: string[]) => out.push(...l)
    const a0 = S.at('A02-0').result
    const aD = S.at('A02-D').result
    const s1 = a0.receive.step1
    const s2 = a0.receive.step2
    const all = [...S.runs.values()].flatMap((r) => r.findings)
    const violations = all.filter((f) => classOf(f) === 'VIOLATION').length
    const detected = all.filter((f) => classOf(f) === 'DETECTED').length
    const seq = blockerSequence(S.stopsOf())
    const bare = (w: string) => (w.slice(-1) === '.' ? w.slice(0, -1) : w)
    const cats = (ids: number[]) => ids.map((i) => bare(S.CATEGORIES[i])).join('; and ')
    const v1 = S.at('A02-D').answer?.lines.find((l) => l.lineId === 'game::V1')

    add('A02 FOUNDATIONAL TEST: REPORT (TEST-ONLY review evidence)')
    add('')
    add(`What this is: the isolated A02 engineering experiment Christian authorized, ${cite('A02-10NOV-AUTHORIZATION', 0)}: Steps 1 and 2 of the review pathway, run by the handoff and consumed by the checked configuration chain through a TEST-ONLY option no route passes; High Press Escape's approved identity and scoring rows restated by us as CANDIDATE; the reasoning-disconnection safeguards; the zero-, one- and two-manipulation runs; the earliest consequential blocker; a brief A02/TA02 comparison.`)
    add(`Standing: TEST-ONLY. Isolated: nothing a coach or an administrator can reach runs it. Not deployed. Not merged. Not an authorization, not approved wording, not a selection input. Engineering evidence only: no run here establishes ecological suitability or representative sufficiency. ${cite('A02-10NOV-AUTHORIZATION', 4)}`)
    add(`Dates: Christian's reply about A02 was pasted on 10 November 2026 without its mail header, so its received date is not recorded; every citation of it is dated 'reply about A02, pasted 10 November 2026', its paste date, never a received date. Every other reply is cited by its received date. The chain's own sentences cite one reply by our old filing date: 'reply filed 30 October 2026' is Christian's second reply received 27 October 2026.`)
    add(`Quotation marks: double, Christian's words, verbatim, with the reply's date (typographic ones where the words themselves hold a straight one); single, ours (values, labels, engine sentences). Inside an engine line, the text after 'Christian, <date>:' is the knowledge item's stored evidence, close to Christian's words but not checked here as verbatim.`)
    add(`How each item is told, as Christian asked, ${cite('A02-10NOV-REPORT', 7)}: IMPLEMENTED AND TESTED (what the code does, measured by a registered test of this build); OPEN (unresolved, or detected as an open disconnection: never a pass); PROPOSALS (ours, for Christian's decision); ASSUMPTIONS (ours, each labelled where it enters); ECOLOGICAL SUITABILITY (not established by any run).`)
    add('')
    add('FIRST, FOR CHRISTIAN\'S DECISION: THE CONSTRAINT SELECTOR')
    add(`- To bypass the numerical quota in the isolated experiment, the constraint selector's source file (${SELECTOR_FILE}) gained one TEST-ONLY parameter, a switch that is off unless a caller passes it, and since stage W2 (11 November 2026) a second, the declared treatment FOUNDATION_PRESENCE_BYPASS, honoured only with the switch, in ${SELECTOR_HUNKS.length} places (each held to the file's text by this report's test):`)
    for (const h of SELECTOR_HUNKS) add(`   ${SELECTOR_FILE}:${h.lines}: ${h.what}`)
    add(`- Since stage W2, the selector's package check and the package builder and validator it calls gained TEST-ONLY options the selector passes only under the switch, in ${PACKAGE_HUNKS.length} places (each held to its file's text; only the package check passes them):`)
    for (const h of PACKAGE_HUNKS) add(`   ${h.file.split('/').slice(-1)[0]}:${h.lines}: ${h.what}`)
    add(`- Since stage W1 (b) (11 November 2026), to take the review pathway's K2 result in place of a per-goal authorization record, the same file reads the pool's authority from the hint and admits K2's result only as the empty set, in ${K2_SELECTOR_HUNKS.length} places (each held to the file's text; production never hands it that authority):`)
    for (const h of K2_SELECTOR_HUNKS) add(`   ${SELECTOR_FILE}:${h.lines}: ${h.what}`)
    add(`- No route, controller or service passes them (a registered static test reads every non-test source file). With them off, the selector's behaviour is compared with main's by the behaviour snapshot, ${RECORD_WORDS.disclosure}.`)
    const npWza = S.at('S4-NP+WZA/no-bypass').result.chain
    const npWzaSame = json([npWza?.outcome, npWza?.stage, npWza?.reasons, S.at('S4-NP+WZA/no-bypass').run.chain?.constraints]) === json([S.at('S4-NP+WZA').result.chain?.outcome, S.at('S4-NP+WZA').result.chain?.stage, S.at('S4-NP+WZA').result.chain?.reasons, S.at('S4-NP+WZA').run.chain?.constraints])
    // Stage W2, re-pinned openly: the floor for subsets is gone under the switch (E1), so the sentence naming its measurement (FLOOR_RUNS) is
    // removed; the places deleted would now also restore the cap, unchecked presence and the foundation clause on the switched runs.
    add(
        `- Question: is a TEST-ONLY parameter that no route passes within ${cite('A02-10NOV-SELECTOR', 0)}? It is removable: deleting the ${SELECTOR_HUNKS.length} places and the package check's ${PACKAGE_HUNKS.length} returns the files to main's text. The lone Neutral Player runs of item 4 (${LONE_RUNS.join(', ')}) would then change outcome, refused by the size rule as before (S4-NP/no-bypass: refused at ${S.at('S4-NP/no-bypass').result.chain?.stage}); the other lone sets, and the sets with no foundation member, would be refused by the size rule or the foundation clause instead of by the kept checks; a set of two or three would again be enumerated with its subsets of 2 or more, its pool capped at 2 per role, a member absent from the checked package unchecked (Neutral Player with Central Density Condition, refused by MEMBER_PRESENCE with the switch, is admitted without it by the production check: item 4); and Neutral Player with Wide Zone Advantage, a set of two that passes every check, selects the same either way (measured: without the switch it is ${npWzaSame ? `selected the same and refused at ${npWza?.stage}, as with it` : 'NOT the same'}).`,
    )
    add('')
    add('KEY (the identifiers the frame and the seven items use; names read from the knowledge files)')
    for (const e of KEY) add(`- ${e.id}${e.family ? '...' : ''}: ${e.means}`)
    add('The appendices are the detailed texts the A02 tests generate; they use these identifiers and the chain\'s own line, item and row identifiers, read as the key\'s c:restated: entry says.')
    add('')

    add('1. CONSUMPTION OF STEP 1 AND STEP 2')
    add(`Christian asked: ${cite('A02-10NOV-REPORT', 0)}`)
    const gp2 = S.at('GP-002')
    add(
        `Answer (OURS): on the isolated pathway, yes. The chain takes Step 2's form as its form, its scorer handed only that form; Step 2 chooses the form from Step 1's Game Problem (with Step 1's primary swapped to ${gp2.result.receive.step1?.primary.join(', ')}, the chain takes ${gp2.result.consumption?.form?.formId} as its form). Since stage W1 (a) (11 November 2026), Step 1's Game Problem also governs the chain's Game-Problem-dependent inputs, the lens hints and matched signals (${S.verdictOf('A02-0', 'GAME_PROBLEM')}; on ${gp2.id} the lens candidates are ${gp2.result.consumption?.hintsGameProblemId}'s Coverage row's ${gp2.result.consumption?.lensCandidateIds.length}, while the planning model's reading ${gp2.run.chain?.gameProblemId} stays in the account beside it, never in its place). The context is still read from the routing (open, below). The production route is unchanged and still picks A02's form from the wording.`,
    )
    add('Implemented and tested:')
    add('- A TEST-ONLY option of the checked chain hands it Step 1\'s resolved Game Problem and Step 2\'s SELECTED form: its candidate forms become the routed context\'s declared forms filtered to Step 2\'s form (never replaced by it), a form outside them is refused, and its constraints come only from the authorization record or, since stage W1 (b), from the review pathway\'s K2 result in its place. Since stage W1 (a), Step 1\'s Game Problem is handed on to the guided selection hints (one TEST-ONLY option no route passes), which read it as the approved Game Problem; the chain records which Game Problem governed its hints and the hints its selector was handed.')
    add(`- The ${A02_RUN_IDS.length} A02 runs (${A02_RUN_IDS.join(', ')}): Step 1 ${s1?.status} ${s1?.primary.join(', ')} at ${s1?.contextId} (${s1?.basis}); Step 2 ${s2?.status} ${s2?.selected} (compatible: ${s2?.compatible.join(', ')}); the chain took ${a0.consumption?.form?.formId} as its form, its scorer handed only ${a0.consumption?.formCandidatesScored.join(', ')}; the handoff placed nothing.`)
    add(
        `- On ${reachedChain.length} of the ${S.EXPERIMENT_RUNS.length} experiment runs (every one that reaches the chain): the Game Form reads CONSUMED (${verdictOn('GAME_FORM', 'CONSUMED')} runs), equal to Step 2's form, and the chain's own record shows its scorer was handed only it; the constraints read CONSUMED (${verdictOn('CONSTRAINTS', 'CONSUMED')} runs): on the review pathway's K2 result (the empty set, no record of ours; ${S.EXPERIMENT_RUNS.filter((id) => S.at(id).result.consumption?.constraintAuthority === 'REVIEW_PATHWAY_K2').length} runs), or, on the runs of item 4, against the authorized set of a TEST-ONLY copy of our DRAFT A02 record (no ruling; the finding is ours), never against a decision of Step 1 or Step 2; Step 1's Game Problem reads CONSUMED (${verdictOn('GAME_PROBLEM', 'CONSUMED')} runs), and so does the Game Problem that governs the hints (${verdictOn('GAME_PROBLEM_HINTS', 'CONSUMED')} runs): the chain's own record shows Step 1's value governed its lens hints and matched signals (before stage W1 (a) the Game Problem read CARRIED_NOT_READ, carried in the account and read by no chain decision). The one other run (Step 1's primary swapped to GP-001) is reconsidered by Step 2, which retains ${S.at('GP-001').result.receive.step2?.compatible.join(', ')} with no basis to select, and stops before the chain.`,
    )
    const legacyPicks = [...new Set(['GP-002/legacy', 'GF7-CELL/legacy'].map((id) => S.at(id).run.chain?.ownPick?.join(', ')))]
    const refusedAs = (id: string) => `refused at ${S.at(id).result.chain?.stage} (${(S.at(id).result.chain?.reasons ?? []).map(plain).join('; ')})`
    add(
        `- Dependency: with Step 1's primary swapped to GP-002 in a test copy of the knowledge (TEST ASSUMPTION), Step 2 selects ${S.at('GP-002').result.receive.step2?.selected} and the chain takes ${S.at('GP-002').result.consumption?.form?.formId} as its form, carrying ${S.at('GP-002').result.consumption?.gameProblem?.gameProblemId}, and is ${refusedAs('GP-002')}; with GF2's GP-015 cell moved to GF7 there, Step 2 selects ${S.at('GF7-CELL').result.receive.step2?.selected} and the chain takes ${S.at('GF7-CELL').result.consumption?.form?.formId} as its form and is ${refusedAs('GF7-CELL')}. The legacy route on the same two inputs stays on ${legacyPicks.join(' and ')}${legacyPicks.length === 1 ? ' in both' : ''}, its pick from the wording, and is ${[...new Set(['GP-002/legacy', 'GF7-CELL/legacy'].map(refusedAs))].join(' or ')}.`,
    )
    add(`- Wording: with the goal's wording rewritten twice (in the knowledge copy and in the row the chain reads; restored, the restore asserted), Steps 1 and 2 and the consumed form do not move (${json(S.at('A02-0~reversed').result.receive) === json(a0.receive) && json(S.at('A02-0~neutral').result.receive) === json(a0.receive) ? 'identical' : 'CHANGED'}), while the chain's own route moves from ${S.at('L2').run.chain?.ownPick?.join(', ')} to ${S.at('L2~reversed').run.chain?.ownPick?.join(', ')}, which proves the rewrite reached the chain.`)
    add('Open (detected and listed as open disconnections, never passes):')
    for (const id of ['OD-CONTEXT', 'OD-A02-LEGACY-FORM']) add(`- ${id}: ${plain(entry(id).what)}`)
    add('- the engine lenses still follow the wording where Step 1\'s Game Problem and the wording agree (the wording\'s own pool is kept then), and on one two-manipulation set the wording decides the selection (item 3).')
    add(K2_NOT_TAKEN)
    add('Proposals: none in this item. The Game Problem reading that governs the engine\'s lens hints is now taken from Step 1 on the isolated pathway (stage W1 (a)), as engineering under the package Christian delegated; OD-HINT-GAME-PROBLEM, listed open before, is closed.')
    add('Assumptions (OURS): the consumption is itself a TEST-ONLY treatment (TT-CONSUMED-STEPS); GF2\'s Game Problem cell keeps its grade, CANDIDATE.')
    add('Ecological suitability: not established; consuming GF2 shows structural compatibility only.')
    add('')

    add('2. HIGH PRESS ESCAPE\'S IDENTITY AND SCORING')
    add(`Christian asked: ${cite('A02-10NOV-REPORT', 1)}`)
    const builtRuns = A02_RUN_IDS.filter((id) => S.at(id).result.lines.length > 0)
    add(
        `Answer (OURS): partly. As the knowledge stands no game is built: ${A02_RUN_IDS[0]} stops at ${a0.refusal?.stage} on two clauses of the approved scoring condition, which enter derivation through our CANDIDATE restatement. A game is built only under labelled TEST-ONLY treatments of the condition (${builtRuns.join(', ')}); there the approved scoring events bound the event line, and the value within them is our realization choice, not knowledge. Nothing in a built game carries established pressure.`,
    )
    add('Implemented and tested:')
    add(`- Our CANDIDATE restatement of RPC-002 in the TEST-ONLY draft store: ${a02Items.length} items, each quoting its approved row verbatim (the store's gate refuses a copy that does not); none of it is in production knowledge. Rows restated: ${[...new Set(a02Items.flatMap((i) => i.sources.map((s) => s.rowId)))].join(', ')}.`)
    add(
        `- Carried (only on ${builtRuns.join(', ')}, each with TEST-ONLY treatments): the four approved events, narrowed with GF2's own to ${show(v1?.permitted ?? null)} on the built event line (the chain records our item as narrowing it); the value ${show(v1?.value ?? null)} within that pair is a realization choice of ours (class ${aD.lines.find((l) => l.lineId === 'game::V1')?.sixClass ?? 'none'}), not knowledge. The values ${a02Items.filter((i) => i.row === 'V6').map((i) => show(i.value)).join(' and ')} enter derivation.`,
    )
    add(`- A02-0, the knowledge as it stands: refused at ${a0.refusal?.stage} on ${(a0.refusalBasis?.cited ?? []).map((c) => c.ref).join(' (the control clause\'s referent) and ')} (the origin clause's value): ${plain(experiment.restatementOnlyWords)}.`)
    for (const clause of ['origin', 'progression', 'control']) {
        const c = clauseCounts(clause)
        // RC1-N3, documented, not widened: where such a run is later refused on this clause's item named by its value path, say so (measured).
        const later = valuePathRefusals(clause)
        const stages = [...new Set(later.map((x) => x.stage))]
        const laterWords = later.length
            ? `; on ${later.length} of them (${later.map((x) => x.id).join(', ')}) the run is then refused at ${stages.join(' or ')} on this clause's own item, named by its value path${later.every((x) => x.reasons.some((r) => r.indexOf('awaiting approved wording') === 0)) ? ', for want of approved wording' : ''}; the verdict reads only the lines a refusal cites, so the clause keeps CARRIED_UNDER_TREATMENT`
            : ''
        add(
            `- The ${clause} clause over the ${S.EXPERIMENT_RUNS.length} experiment runs: ${Object.entries(c)
                .map(([v, n]) => `${v} on ${n}${v === 'CARRIED_UNDER_TREATMENT' ? ` (carried only under the TEST-ONLY declaration that its referent needs no further value, which Christian has not ruled; its referent line holds no value${laterWords})` : ''}`)
                .join(', ')}.`,
        )
    }
    add(`- A02-D, the diagnostic (every condition item withheld): the chain would serve plain GF2 (${aD.sentences.length} sentences): structural compatibility only, not representative sufficiency.`)
    add('Unsupported (UNRESOLVED, kept explicit, never closed by an assumption; where each stands: appendix A):')
    for (const n of a0.notCarried) add(`- ${plain(n.what)}`)
    add('Smallest specific source material (questions only, in order of consequence):')
    for (const q of experiment.questions) add(`${q.order}. ${plain(q.question)}${q.next ? ' [the next consequential gap]' : ''}`)
    add('Essential Representative Relationships (each with what executes it in this run; appendix A gives the rows):')
    for (const r of experiment.relationships) add(`- ${plain(r.relationship)}: ${plain(r.executable)}`)
    add('Proposals: none; the questions above ask for Christian\'s source material and propose no knowledge.')
    add('Assumptions (OURS): the restatement itself (CANDIDATE, unreviewed); every condition item scoped to the whole game.')
    add('Ecological suitability: not established: nothing in a built game carries established coordinated pressure.')
    add('')

    add('3. THE SAFEGUARDS AGAINST REASONING DISCONNECTIONS')
    add(`Christian asked: ${cite('A02-10NOV-REPORT', 2)}`)
    add('Answer (OURS): yes, for the known failure and for each substitution tested; they also detect disconnections that remain open, listed below and never counted as passes.')
    add(`Implemented and tested (one pure check over each run's result, run by registered tests; no library, layer or monitoring system):`)
    add(`- Decision ownership: an ownership table names the owner, input, output and authority of each of ${OWNERSHIP_TABLE.length} decisions (appendix B).`)
    add(`- The known failure: on L1 the chain refuses at selection on its own ${S.at('L1').run.chain?.form} before consuming Step 2's ${s2?.selected}: ${S.verdictOf('L1', 'GAME_FORM')}; the assertion every experiment run must pass fails on it: '${plain(failureOf(S.at('L1').findings).split(' | ')[1] ?? '')}'.`)
    const fails = (findings: Finding[]) => (failureOf(findings) === 'PASSED' ? 'the assertion PASSES on it' : 'the assertion fails on it')
    add(`- A comparable substitution: a test-only wrapper that drops the handed decisions, on a wording where the chain's own pick equals ${s2?.selected}: the form reads ${S.verdictOf('W-DROPS-UPSTREAM', 'GAME_FORM')} and ${fails(S.at('W-DROPS-UPSTREAM').findings)}; the same run with the decisions handed reads ${S.verdictOf('A02-0~pressure', 'GAME_FORM')} and ${failureOf(S.at('A02-0~pressure').findings) === 'PASSED' ? 'passes' : 'FAILS'}.`)
    add(`- Dependency verification: a changed Game Problem and a moved cell are reconsidered by Step 2, whose form the chain consumes (item 1); with Step 1 saying GP-002, the chain's hints follow GP-002 (${S.verdictOf('GP-002', 'GAME_PROBLEM_HINTS')}: its lens candidates are GP-002's Coverage row's, the divergent arm of test 3, whose negative control, the option not handed on, leaves them the wording's), while the planning model's reading GP-015 stays in the account beside it (the Game Problem ${S.verdictOf('GP-002', 'GAME_PROBLEM')}).`)
    for (const id of ['OD-WORDING-LENSES', 'OD-WORDING-FLIP']) add(`- Safeguard B fails on ${id}: ${plain(entry(id).what)}; before: ${plain(entry(id).measured?.before ?? '')}; after: ${plain(entry(id).measured?.after ?? '')}.`)
    add(`- Consumption tracing: with one cited event removed from our restatement, A02-2 moves from ${S.at('A02-2').result.chain?.stage} to ${S.at('A02-2/no-line-crossed').result.chain?.stage}, on the event line that item shaped; with A02-D's treatment declaration removed, its three clauses read ${[...new Set(doctoredA02D.filter((f) => f.row === 'SCORING').map((f) => f.verdict))].join(', ')} and ${fails(doctoredA02D)}; with GP-015's CAR ratings changed, the chain's result is identical (consulted, not determining).`)
    // The total is never read alone (R3-06, R4-09): it is split by where the runs run, each number counted from the runs.
    const kindOf = (kind: S.Kind) => {
        const rs = [...S.runs.values()].filter((r) => r.kind === kind)
        const fs = rs.flatMap((r) => r.findings)
        return { rs, v: fs.filter((f) => classOf(f) === 'VIOLATION'), d: fs.filter((f) => classOf(f) === 'DETECTED'), fs }
    }
    const [exp, ctl, leg] = [kindOf('EXPERIMENT'), kindOf('CONTROL'), kindOf('LEGACY')]
    const listing = S.OPEN_DISCONNECTIONS.filter((e) => e.scope === 'EXPERIMENT')
        .map((e) => ({ id: e.id, n: exp.v.filter((f) => unlisted([f], [e], ['EXPERIMENT']).length === 0).length }))
        .filter((x) => x.n > 0)
    add(`- Over the ${S.runs.size} runs: ${violations} violation verdicts and ${detected} detected disconnections, none of them a pass. Told apart by where the runs run:`)
    add(`   the experiment path (${exp.rs.length} runs, each held to the assertion every experiment run must pass): ${exp.v.length} violation verdicts, every one a finding of an open disconnection listed below, counted once per run (${listing.map((x) => `${x.id} ${x.n}`).join(', ')}), and ${exp.d.length} detected disconnections (by verdict: ${detectedByVerdict(exp.fs)});`)
    const CONTROL_WORDS: Record<string, string> = {
        'S4-NP/no-bypass': 'the lone Neutral Player without the switch',
        'S4-NP+WZA/no-bypass': 'two manipulations without the switch',
        'A02-2/CAR': 'A02-2 with GP-015\'s CAR ratings changed',
        'W-DROPS-UPSTREAM': 'the wrapper that drops the handed decisions (on the DRAFT-record arm)',
        // Stage W1 (b): the DRAFT-record comparison arm, kept beside K2's result.
        ...Object.fromEntries(S.BASE_IDS.map((id) => [`${id}${S.DRAFT_ARM}`, `${id} on the DRAFT-record comparison arm (our record in place of K2's result: K2_NOT_TAKEN)`])),
        // Stage W2: the reversal arm of FOUNDATION_PRESENCE_BYPASS (foundation presence kept, under the switch).
        ...Object.fromEntries(S.FOUNDATION_KEPT_SETS.map((name) => [`S4-${name}${S.FOUNDATION_KEPT}`, `${name} with foundation presence kept (the reversal arm of FOUNDATION_PRESENCE_BYPASS: the foundation clause decides)`])),
    }
    const controlWords = (id: string) => {
        assert.ok(CONTROL_WORDS[id], `the control ${id} is described`)
        return CONTROL_WORDS[id]
    }
    add(`   the controls (${ctl.rs.length} runs built beside the experiment to show whether a check bites, not held to that assertion; violation verdicts per run: ${ctl.rs.map((r) => `${r.id}, ${controlWords(r.id)}, ${r.findings.filter((f) => classOf(f) === 'VIOLATION').length}`).join('; ')}): ${ctl.v.length} violation verdicts and ${ctl.d.length} detected disconnections;`)
    add(`   the legacy route (${leg.rs.length} runs, the production route and its variants, reported only): ${leg.v.length} violation verdicts and ${leg.d.length} detected disconnections.`)
    add(`Open disconnections (${S.OPEN_DISCONNECTIONS.length}; each with its evidence and runs in appendix B):`)
    for (const e of S.OPEN_DISCONNECTIONS) add(`- ${e.id} [${e.scope === 'EXPERIMENT' ? 'experiment path' : 'legacy route, reported only'}]: ${plain(e.what)}`)
    add(K2_NOT_TAKEN)
    add(`Proposals (OURS, for Christian's decision): whether the kept package checks that read the wording-derived lenses fall under ${cite('A02-10NOV-QUOTA', 1)}, or are a selection from wording the consumption is meant to remove; they are kept, enforced and reported here.`)
    // Stage W1 (c1): the two lens arms measured for that question (Q-a2), from the runs; neither adopted as the default.
    const gpclLenses = S.GPCL_RUNS.map((id) => json(S.at(id).result.consumption?.lensCandidateIds))
    const gpclCommitted = S.GPCL_RUNS.map((id) => json([...(S.at(id).answer?.observed?.lensIds ?? [])].sort()))
    const gpclOrder = S.GPCL_RUNS.map((id) => (S.at(id).answer?.observed?.lensIds ?? [])[0])
    add(
        `- Measured for that question (Q-a2, open since 10 November 2026; stage W1 (c1)): with the TEST-ONLY treatment GP_COVERAGE_LENSES the lens candidates and signal groups are Step 1's Coverage row's (CV-015) under the goal's wording and both rewordings (${new Set(gpclLenses).size === 1 ? 'one pool for all three' : 'NOT one pool'}), where without it the pool follows the wording (${S.at('A02-0').result.consumption?.lensCandidateIds.length} lenses under the goal's wording, ${S.at('A02-0~reversed').result.consumption?.lensCandidateIds.length} under a rewording); the lenses committed are ${new Set(gpclCommitted).size === 1 ? 'the same three' : 'NOT the same three'}, but their order, and so the primary lens the foundation threshold and row o read, still follows the wording (${gpclOrder.map((id) => String(id).split('tl-v0-lens-').join('').split('-opportunity').join('')).join(', ')} first); per S4 set, the lens combinations the package check admits on each arm are in appendix B (LENS ARMS). The ranking by wording tokens, the top-3 cap and the commit are not changed. The treatment is not the default: which lenses the kept checks should read (the wording's top three, any combination of the Game Problem's, or every combination) is Christian's.`,
    )
    add('Assumptions (OURS): the verdicts, the ownership table and the attribution of each refusal to a check.')
    add('Ecological suitability: not addressed by the safeguards.')
    add('')

    add('4. ZERO, ONE OR MORE MANIPULATIONS WITHOUT THE QUOTA')
    add(`Christian asked: ${cite('A02-10NOV-REPORT', 3)}`)
    const flipRuns = S.OPEN_DISCONNECTIONS.find((e) => e.id === 'OD-WORDING-FLIP')?.runs ?? []
    // Stage W2, re-pinned openly: the answer said zero and one could be represented where the record authorizes exactly that many, and that the
    // floor of 2 for subsets stopped the reworded Neutral Player with Turnover Reward; under the switch the set is now taken whole (E1).
    const selectedWhole = S.W2_RUNS_TABLE.filter(([, n, , by]) => n > 0 && by === 'selected').map(([id]) => id)
    add(
        `Answer (OURS): zero, one, two or three manipulations can be represented without a quota interfering (stage W2, 11 November 2026): under the TEST-ONLY switch the record's authorized set is taken whole, whatever its size, its pool uncapped, every selected member validated, and, under the declared TEST-ONLY treatment FOUNDATION_PRESENCE_BYPASS, with no foundation member required; each run is selected whole (${selectedWhole.join(', ')}) or refused by a named kept check, never by the size rule, foundation presence, the role mix or the bounded search. No manipulation is justified for A02 in anything we hold, so what is shown is the representation, not a justified configuration.`,
    )
    add('Implemented and tested:')
    add(`- Zero: the ${A02_RUN_IDS.length} A02 runs commit the review pathway's K2 result, the empty set (constraints ${[...new Set(A02_RUN_IDS.map((id) => S.verdictOf(id, 'CONSTRAINTS')))].join(', ')}, none built, since stage W1 (b)): representable, not shown to be justified; K2's limit travels with the result into the account, ${cite('HO-07NOV-K2', 2)}. On the DRAFT-record comparison arm the same runs commit our DRAFT record's empty set (${[...new Set(A02_RUN_IDS.map((id) => S.verdictOf(`${id}${S.DRAFT_ARM}`, 'CONSTRAINTS')))].join(', ')}), with the same outcome, stage and reasons; the record's finding is ours: no manipulation has an authorized relationship to RPC-002 and GP-015 in held knowledge.`)
    const sameAsA02 = json(S.at('S4-NP').result.chain?.reasons) === json(a0.chain?.reasons) ? `, on the same lines as ${A02_RUN_IDS[0]}` : ''
    add(`- One: a lone Neutral Player in the DRAFT record's set (a TEST-ONLY relationship stand-in, TEST ASSUMPTION) is selected with the TEST-ONLY size-rule bypass (S4-NP: selected, then refused at ${S.at('S4-NP').result.chain?.stage}${sameAsA02}) and refused without it (S4-NP/no-bypass: refused at ${S.at('S4-NP/no-bypass').result.chain?.stage}, attributed to the size rule): the quota interfered, and the bypass removed only it.`)
    const ruleWords = (id: string) => {
        const e = S.at(id).run.engineRule
        return e ? (e.rules && e.rules.length ? e.rules.join(' and ') : String(e.rule)) : 'none'
    }
    add(`- One, refused by kept checks (stage W2, under FOUNDATION_PRESENCE_BYPASS): a lone Wide Zone Advantage is first refused as one-sided (the other package checks), a lone Turnover Reward by row k on one lens combination and row o on the others, Central Density Condition, alone and with Interception Reward, by the package relationship check (row o); each attributed by re-running the selector's own exported package check on GF2 and each lens combination with the run's options, which returns the first reason it meets (${S.QUOTA_REFUSED.map((id) => `${id} ${ruleWords(id)}`).join(', ')}).`)
    add(`- Two: Neutral Player with Wide Zone Advantage is selected whole, then refused at ${S.at('S4-NP+WZA').result.chain?.stage}, and without the switch it selects the same (S4-NP+WZA/no-bypass); with Turnover Reward it is selected, then refused at ${S.at('S4-NP+TR').result.chain?.stage} (Turnover Reward has no contribution contract); Wide Zone Advantage with Turnover Reward, no foundation member, is selected whole, then refused at ${S.at('S4-WZA+TR').result.chain?.stage}; Neutral Player with Central Density Condition, two members of one role, is refused by ${ruleWords('S4-NP+CDC')} (the package holds one member per role, so Central Density Condition would never be validated).`)
    add(`- Three: Neutral Player, Wide Zone Advantage and Turnover Reward are selected whole, then refused at ${S.at('S4-NP+WZA+TR').result.chain?.stage}; Neutral Player, Wide Zone Advantage and Central Density Condition are refused whole by ${ruleWords('S4-NP+WZA+CDC')}, while the pair Neutral Player with Wide Zone Advantage passes every lens combination: with the sizes as they were (2 to 4 for a set of three) the selector would have committed that pair, a choice no record made (the negative control of the set whole: such a strict subset built reads UNAUTHORIZED_SOURCE).`)
    add(
        `- The set whole (stage W2): under the switch the only size tried is the set's own (${SELECTOR_FILE}:1047), so the scorer chooses the lenses only, never how many or which of the record's constraints. Under the reworded wordings Neutral Player with Turnover Reward is refused at selection by row k on every lens combination (${flipRuns.join(', ')}); a lone Neutral Player, selected as ${flipRuns.map((id) => id.split('+TR').join('')).join(' and ')}, is another authorized set, never a subset the selector may choose.`,
    )
    add(`- The pool whole: the bounded search's cap of 2 per role is not applied to the record's pool under the switch (a probe on the package check shows a set of three members of one role reaching it whole on every lens combination, and never without the switch). Every selected member validated: a set any member of which is absent from the checked package is refused, never committed unvalidated.`)
    add(`- Every line a manipulation brings rests on its stand-in, class 4 (TEST ASSUMPTION) at best: ${standInLines('S4-NP@A02-D').length} lines for Neutral Player alone, ${standInLines('S4-NP+WZA@A02-D').length} with Wide Zone Advantage (on the diagnostic base, where a game is built).`)
    add(`- Of the ${DISPOSITION.length} selection checks, under the switch the size rule with its floor and the bounded search over constraints are bypassed and every selected member is validated (a tightening); foundation presence is bypassed only under its declared treatment, which Christian can reverse by its removal (the reversal arm, ${S.FOUNDATION_KEPT_SETS.map((name) => `S4-${name}${S.FOUNDATION_KEPT}`).join(', ')}: refused by the foundation clause on every lens combination); every other check runs and enforces wherever its path is reached. On the empty-set runs the role mix, the package checks, the size rule, the bounded search and the tightening are not run at all: the zero branch commits the empty set first, and its authority is ${plain(disposition('ZERO_BRANCH').authority)}.`)
    for (const id of ['ROLE_MIX', 'FOUNDATION_CLAUSE']) {
        const d = disposition(id)
        add(`- Reported with source and authority, as Christian asked: ${plain(d.check)}: source ${d.where}; origin ${plain(d.origin)}; authority ${plain(d.authority)}; ${d.disposition === 'KEPT_ENFORCED' ? 'kept and enforced' : 'bypassed only under its declared TEST-ONLY treatment (our classification, reversible)'}, not treated as canonical.`)
    }
    add('- The role mix refuses no set run here: under the switch a set is enumerated only whole and its needs are read over the set itself (generateSelection.ts:832, :840-841, :591-613); a registered test pins it over every singleton, pair and triple of the library.')
    add(`- On the production route (reported only, not changed): the package check holds one member per role and drops a consequence scoring 12 or less, so a selection of four, or of two members of one role, commits a member it never validated; measured on the production selections, ${S.PRODUCTION_ABSENT.length} goals commit such a member (${S.PRODUCTION_ABSENT.map(([goal, absent]) => `${goal}: ${absent}`).join('; ')}).`)
    add('Open: the wording decides one two-manipulation selection (item 3), by row k alone now that the set is taken whole. Whether a record may ever be a menu to choose among, and on what learning-design basis, is Christian\'s question Q-a1 (until it is answered the set is taken whole).')
    add('Proposals (OURS, for Christian\'s decision): whether the TEST-ONLY switch in the constraint selector may stay (the disclosure above); it is removable. Our classification of foundation presence as a quota, reversible by removing FOUNDATION_PRESENCE_BYPASS. Whether the production route\'s unvalidated members (above) should be refused as the switch refuses them: a production change, not made here.')
    add('Assumptions (OURS): every manipulation here is a TEST-ONLY stand-in, never knowledge; foundation presence classified as a quota.')
    add('Ecological suitability: not established: selected means only that the kept checks did not refuse it.')
    add('')

    add('5. THE EARLIEST CONSEQUENTIAL BLOCKER')
    add(`Christian asked: ${cite('A02-10NOV-REPORT', 4)}`)
    const first = seq.sequence[0]
    add(
        `Answer (OURS): in reasoning order, the first stop is the production route's: it accepts manipulations only on a per-goal authorization record's authority (the live route hands it only goals with a record), which A02 lacks (${cats(first.categories)}; the category ours). On the isolated pathway, since stage W1 (b) (11 November 2026), the checked pathway takes the review pathway's K2 result in its place: for every A02 run the review pathway proposes no manipulation (appendix D, 5. Manipulations) under K2, ${cite('HO-07NOV-K2', 1)}, and E5 reads, ${cite('A02-03NOV-DESIGN-AUTHORIZATION', 1)}; taking K2's result for review is our reading of those two rulings (stated in the request below so Christian can reverse it), it yields only the empty set, and its limit travels with it, ${cite('HO-07NOV-K2', 2)}. Past that stop, standing on K2's result with no record of ours, the earliest consequential blocker is the origin clause of High Press Escape's approved scoring condition (the sequence begins under established coordinated pressure): ${cats(seq.earliest.categories)}. A02-0's single refusal cites the origin clause's value and the control clause's referent together; placing the origin clause first is ours (an assumption, below).`,
    )
    add('Implemented and tested (computed from the runs, in chain order):')
    for (const s of seq.sequence) add(`- ${plain(s.path)}: ${s.stage}: ${plain(s.reason)} [${cats(s.categories)}] ${s.passed ? `(passed by ${s.passedBy})` : '(remains)'}`)
    add(`- The first stop: ${plain(first.why)}.`)
    const comparisonSame = S.BASE_IDS.every((id) => json([S.at(id).result.chain?.outcome, S.at(id).result.chain?.stage, S.at(id).result.chain?.reasons]) === json([S.at(`${id}${S.DRAFT_ARM}`).result.chain?.outcome, S.at(`${id}${S.DRAFT_ARM}`).result.chain?.stage, S.at(`${id}${S.DRAFT_ARM}`).result.chain?.reasons]))
    add(`- Every consumed path past the first stop, and the zero-manipulation base of every A02 run, stands on the review pathway's K2 result (the empty set, REVIEW_PATHWAY_K2, no record of ours; on item 4's runs a TEST-ONLY copy of our DRAFT record holds the stand-in manipulations instead). The DRAFT-record comparison arm (${S.BASE_IDS.map((id) => `${id}${S.DRAFT_ARM}`).join(', ')}), with our TEST-ONLY record in place of K2's result as before stage W1 (b), ${comparisonSame ? 'stops where each K2 run stops, on the same reasons' : 'DOES NOT stop where the K2 runs stop'}, and reads K2_NOT_TAKEN.`)
    add(`- Earliest remaining: ${plain(seq.earliest.path)}: ${plain(seq.earliest.why)}.`)
    add('- Downstream, recorded and not investigated:')
    for (const s of seq.downstream) add(`   ${plain(s.path)}: ${s.stage} [${cats(s.categories)}]`)
    add(`The categories are Christian's: ${cite('A02-10NOV-FAILURE-SOURCES', 0)} ${S.CATEGORIES.slice(1).map((w) => quoted(w)).join(' ')}`)
    add('Proposals: none. The requests: for the first stop, our reading, which Christian may reverse: in the isolated experiment the checked pathway takes the review pathway\'s K2 result (no manipulation proposed) in place of a per-goal authorization record, under E5 and K2 (reversing it costs one treatment; the DRAFT-record arm is kept beside it); whether A02 needs any manipulation to represent High Press Escape stays open (item 2, questions 1 and 5). For the blocker past it, question 1 of item 2. Each is a request, not a proposal of knowledge.')
    add('Assumptions (OURS): the assignment of each stop to Christian\'s categories (the first blocker\'s included); the order of the questions; placing the origin clause before the control clause\'s referent, which A02-0\'s single refusal cites together.')
    add('Ecological suitability: not addressed: the first blocker is a question of decision authority, and the earliest consequential blocker a gap of knowledge and of a carrier; both are met before any activity is built.')
    add('')

    add('6. REUSE BETWEEN A02 AND TA02 (brief)')
    add(`Christian asked: ${cite('A02-10NOV-REPORT', 5)}`)
    const shared = COMPARISON.rows.filter((r) => r.kind === 'SHARED')
    const differs = COMPARISON.rows.filter((r) => r.kind === 'DIFFERS')
    add(`Answer (OURS): ${REUSE_FINDING}`)
    add(`Implemented and tested: TA02 run through the same consumption (TA02-0, the knowledge as it stands; TA02-D, the diagnostic), over our DRAFT restatement of RPC-003 (TEST-ONLY draft store) and, as for A02, the review pathway's K2 result in place of a per-goal record (the DRAFT TA02 record set aside): ${[['its Game Problem', 'GAME_PROBLEM', 'reads'], ['its Game Form', 'GAME_FORM', 'reads'], ['its constraints', 'CONSTRAINTS', 'read']].map(([what, row, verb]) => `${what} ${verb} ${[...new Set(TA02_IDS.flatMap((id) => verdictsOf(ta02Safeguard(id).findings, row)))].join(', ')}`).join(', ')}. Measured from both goals' results (appendix C):`)
    add(`- shared (${shared.length}): ${shared.map((r) => r.aspect).join('; ')}.`)
    add(`- differing (${differs.length}): ${differs.map((r) => r.aspect).join('; ')}.`)
    for (const r of differs.filter((x) => x.aspect === 'the context' || x.aspect.indexOf('the condition\'s') === 0)) add(`   ${r.aspect}: A02 ${plain(r.a02)} | TA02 ${plain(r.ta02)}`)
    add(`- the two diagnostic builds: ${COMPARISON.sentencesIdentical ? 'identical coach text' : 'different coach text'}, and configuration lines identical but ${COMPARISON.differingLines.length} (${COMPARISON.differingLines.map((l) => l.split(': ')[0]).join(', ')}: the same transition value, from a different source).`)
    // Stage W5 (12 November 2026): U3 (b) rows (2) to (5) and stages W1 to W4 where they apply to TA02, each sentence built from its measurement.
    for (const l of w5Lines()) add(l)
    add(`Open: TA02's context is pending. ${cite('TA02-27OCT-CONTEXT', 0)} ${cite('TA02-28OCT-DEFERRED', 0)} The TA02 runs measure the reuse on the planning model's routing as it stands; neither is a TA02 configuration.`)
    add(
        `Since the merge of the program branch (11 November 2026): the 13 September correction of Attack Development's approved scoring condition (RPC-PROP-134, restoring the words that make its final clause an example) is in the program's library on this branch, under Christian's approval of the canonical correction (received 11 November 2026, first reply), and our DRAFT restatement of RPC-003 holds the example's items as examples, under Christian's reply received 11 November 2026 (second reply), item 3; the TA02 runs read RPC-PROP-134 as this branch holds it, with the restored words. Christian asked for its verification against the original 13 September email, ${cite('HO-07NOV-SCORING-ROW', 0)}; that verification was done against that email as Joe pasted it on 13 and 14 September (two identical copies): the original holds the words that make the final clause an example, so the colon the RC1.1 workbook held until that correction was our transcription. Nothing here changes the live application: neither branch is merged into the live line or deployed.`,
    )
    add(`Proposals: none; no new structure is proposed (${cite('A02-10NOV-REUSE', 5)}).`)
    add('Assumptions (OURS): our restatement of RPC-003 (DRAFT, 27 October, unreviewed; its progression and control items held as examples since the merge of the program branch, 11 November 2026, as said above); the same illustrative session for both goals, so that they differ only in their knowledge.')
    add('Ecological suitability: not established for either goal.')
    add('')

    add('7. THE EXISTING APPLICATION AND A01')
    add(`Christian asked: ${cite('A02-10NOV-REPORT', 6)}`)
    const a01Main = S.A01_BEFORE === S.A01_MAIN_SHA256
    add(
        `Answer (OURS): unchanged where this build compares with main: A01 is built ${a01Main ? 'exactly as main builds it (measured on the commit this branch starts from)' : 'DIFFERENTLY from main'}; with the option absent, every goal builds as the same tree's production entry builds it. The rest of the comparison with main (the behaviour snapshot, the whole suite, the bundle) is the regression record's, run apart on the committed tree.`,
    )
    add('Implemented and tested:')
    add(`- A01, built by the production entry before and after every run of the safeguard test and after the TA02 runs: the same build each time (sha-256 ${S.A01_BEFORE === S.A01_AFTER && S.A01_AFTER === A01_END ? S.A01_BEFORE : 'CHANGED'}), ${a01Main ? 'equal to main\'s build measured at 0b60f26, the base this branch starts from (main 9919ea3 merged), with the same request' : 'NOT equal to main\'s build measured at 0b60f26'} (a registered test pins main's value).`)
    add('- The TEST-ONLY option is passed by no route, controller or service (a registered static test reads every non-test source file); with it absent, every one of the 13 Learning Goals builds exactly as the production entry builds it, and A01 with it is identical once its two TEST-ONLY account fields are set aside (registered tests).')
    add('- No production knowledge file holds our restatement of RPC-002 or the DRAFT A02 record, and A02 has no production record (tested).')
    add(`Recorded apart, not in this report: the regression on the committed tree (the type check, the whole suite, the behaviour snapshot against main's baseline, the bundle compared with main), in the evidence folder's regression record (${RECORD_WORDS.item7}).`)
    add('Open: eight bundled files differ from main by TEST-ONLY additions no route passes (the selector\'s are disclosed first, above; the guided selection hints\' one option since stage W1 (a); the authority of the review pathway\'s K2 result in the types since stage W1 (b); the package check, the package builder and its validator since stage W2); isolation rests on the branch staying unmerged and undeployed.')
    add('Proposals: none.')
    add('Assumptions (OURS): none beyond the TEST-ONLY option itself, which no route passes.')
    add('Ecological suitability: not addressed: an unchanged application is an engineering claim.')
    add('')
    return out
}

const REUSE_FINDING = [
    `Measured, the Game Problem and Game Form reasoning is shared without any new structure: both goals resolve to GP-015 through their own approved translation rows, and Step 2 selects GF2 through GF2's same GP-015 cell (graded CANDIDATE in both), each over its own context's declared-form rows; the same TEST-ONLY consumption carries both results to the chain. On the affordance side only the CAR profile Step 1 consults is shared, and it determines nothing downstream; the engine lenses, scored from each goal's wording, differ, and each context's affordance targets stay deferred.`,
    `What would set the two contexts apart lives in each context's own rows (its identity, its opposition and its scoring condition), which the chain applies after the shared reasoning, through each context's restatement: the existing architecture already has that place.`,
    // Stage W5 (12 November 2026): the swap control, said only as measured.
    rowsThat('other').length === 0 && rowsThat('swaps').indexOf('where the knowledge as it stands stops') >= 0
        ? `A swap control measures it (stage W5): with the two restatements exchanged on the chain's copy, each goal stops where the other stopped and its restatement's rows move with it, while the shared reasoning does not move.`
        : `A swap control (stage W5) does NOT show the rows of the restatements moving with them.`,
    `It does not execute yet: as the knowledge stands both goals stop at structure on their own restatements, A02 on its control clause's referent and its origin clause's value, TA02 on its origin clause's value alone; TA02's control items, which restate the possession condition of a clause Christian wrote as an example, have been held as examples since the merge of the program branch (11 November 2026), as Christian's first reply of 7 November, section 4, asked: ${cite('HO-07NOV-SCORING-ROW', 4)}.`,
    `With every condition item withheld the two built activities collapse into one plain GF2 activity (identical coach text; identical configuration lines but one transition value's source).`,
    `So the existing relationships appear capable of the reuse Christian describes; what keeps the two contexts from collapsing is the missing operational interpretation and carrier of each context's condition, not a missing goal-family structure.`,
].join(' ')

function appendixC(): string[] {
    const out: string[] = []
    out.push('APPENDIX C: THE A02/TA02 COMPARISON (measured from both goals\' results; OURS, for Christian\'s review)')
    for (const r of COMPARISON.rows) {
        out.push(`- ${r.aspect}: ${r.kind}`)
        out.push(`   A02: ${plain(r.a02)}`)
        out.push(`   TA02: ${plain(r.ta02)}`)
        out.push(`   note: ${plain(r.note)}`)
    }
    out.push('The safeguard check on the TA02 runs (the same check as the A02 runs; detected disconnections listed, never passes):')
    for (const id of TA02_IDS) for (const f of ta02Safeguard(id).findings) out.push(`- ${id} ${f.row}${f.clause ? ` (${f.clause})` : ''}: ${f.verdict} [${classOf(f)}]: ${plain(f.why)}`)
    out.push(`open disconnections carried by the TA02 runs: ${TA02_DISCONNECTIONS.map((e) => e.id).join(', ')}`)
    out.push('')
    out.push(...w5Appendix())
    return out
}

interface Evidence {
    report: string
    json: string
}
function evidenceOf(a02Results: HandoffResult[], ta02Results: HandoffResult[]): Evidence {
    const report = [
        ...bodyLines(),
        'APPENDIX A: THE A02 CASES IN DETAIL (the runs, what each refusal rests on, the restatement item by item, UNRESOLVED, the questions, the Essential Representative Relationships)',
        ...foundationalTestText(a02Results, inputs, experiment, a02Items),
        'APPENDIX B: THE SAFEGUARDS IN DETAIL',
        ...S.reportLines(),
        '',
        ...appendixC(),
        'APPENDIX D: THE CASES AS THE HANDOFF REPORTS THEM (the A02 runs and the TA02 runs: inputs, Steps 1 and 2, the form, the chain, configuration lines, coach text, laws and requirement accounts, refusals and what they rest on)',
        handoffReportText([...a02Results, ...ta02Results], ta02Inputs, []),
    ].join('\n')
    const results = {
        stage: 'DESIGN_REASONING_A02_FOUNDATIONAL_TEST',
        standing: 'TEST-ONLY review evidence; isolated; not deployed; not merged; not an authorization. Engineering evidence only: no run establishes ecological suitability or representative sufficiency.',
        selectorHunks: SELECTOR_HUNKS.map((h) => ({ file: SELECTOR_FILE, lines: h.lines, what: h.what })),
        k2SelectorHunks: K2_SELECTOR_HUNKS.map((h) => ({ file: SELECTOR_FILE, lines: h.lines, what: h.what })),
        // Stage W2: the package check's, the builder's and the validator's places.
        packageHunks: PACKAGE_HUNKS.map((h) => ({ file: h.file.split('/').slice(-1)[0], lines: h.lines, what: h.what })),
        a01: { before: S.A01_BEFORE, afterSafeguards: S.A01_AFTER, afterTa02: A01_END },
        comparison: COMPARISON,
        reuseFinding: REUSE_FINDING,
        ta02Safeguards: TA02_IDS.map((id) => ({ id, ...ta02Safeguard(id) })),
        openDisconnections: S.OPEN_DISCONNECTIONS,
        ta02OpenDisconnections: TA02_DISCONNECTIONS,
        // Stage W5 (12 November 2026): the reuse comparison after the merge.
        w5: {
            swapComparison: SWAP_COMPARISON,
            swapMoves: SWAP_CLASSES,
            swapRuns: [...swapBuilt.keys()].map((id) => ({ id, outcome: swapAt(id).result.chain?.outcome ?? null, stage: swapAt(id).result.chain?.stage ?? null, cited: (swapAt(id).result.refusalBasis?.cited ?? []).map((c) => c.ref) })),
            distinctions: DISTINCTIONS,
            ta02Binding: { before: TA02_BINDING_BEFORE, now: bindingIds(ta02Items), keptAsExamples: Object.keys(TA02_EXAMPLE_ONLY), keptBinding: TA02_KEPT, defects: bindingDefects(ta02Items) },
            ta02ExampleItemsCited: TA02_IDS.map((id) => ({ id, cited: exampleItemsCited(ta02At(id).result) })),
            ta02PreMergeClass: { outcome: TA02_PRE_MERGE_CLASS.result.chain?.outcome ?? null, stage: TA02_PRE_MERGE_CLASS.result.chain?.stage ?? null, cited: (TA02_PRE_MERGE_CLASS.result.refusalBasis?.cited ?? []).map((c) => c.ref), exampleItemsCited: exampleItemsCited(TA02_PRE_MERGE_CLASS.result) },
            ta02CoverageLenses: { lensCandidateIds: TA02_GPCL.result.consumption?.lensCandidateIds ?? [], committed: TA02_GPCL.answer?.observed?.lensIds ?? [], from: TA02_GPCL.result.consumption?.hintsLensesFrom ?? null },
            carrierMechanismNames: carrierMechanismNames(),
        },
        ownership: OWNERSHIP_TABLE,
        disposition: DISPOSITION,
        blocker: blockerSequence(S.stopsOf()),
        safeguardRuns: [...S.runs.values()].map((r) => ({ id: r.id, kind: r.kind, label: r.label, run: r.run, findings: r.findings })),
        a02Cases: a02Results,
        ta02Runs: ta02Results,
    }
    return { report: `${report}\n`, json: `${JSON.stringify(results, null, 1)}\n` }
}
const FIRST = evidenceOf(
    A02_RUN_IDS.map((id) => S.at(id).result),
    TA02_IDS.map((id) => ta02At(id).result),
)
const BODY = bodyLines().join('\n')

if (process.env.A02_EVIDENCE_MEASURE) {
    const lines: string[] = []
    for (const r of COMPARISON.rows) lines.push(`${r.kind} | ${r.aspect} | A02: ${r.a02} | TA02: ${r.ta02} | ${r.note}`)
    lines.push(`differing lines: ${json(COMPARISON.differingLines)}; sentences identical: ${COMPARISON.sentencesIdentical}`)
    // Stage W5: the swap control, the binding items, the distinctions, the pre-merge class bite, TA02 under GP_COVERAGE_LENSES, the carriers.
    for (const r of SWAP_COMPARISON.rows) lines.push(`SWAP ${r.kind} | ${r.aspect} | A02: ${r.a02} | TA02: ${r.ta02}`)
    lines.push(`swap differing lines: ${json(SWAP_COMPARISON.differingLines)}; sentences identical: ${SWAP_COMPARISON.sentencesIdentical}`)
    for (const x of SWAP_CLASSES) lines.push(`MOVE ${x.move} | ${x.aspect}`)
    for (const d of DISTINCTIONS) lines.push(`GROUP ${d.group} | ${d.aspect}`)
    for (const id of [...swapBuilt.keys()]) lines.push(`${id}: ${swapAt(id).result.chain?.outcome} ${swapAt(id).result.chain?.stage} ${json((swapAt(id).result.refusalBasis?.cited ?? []).map((c) => c.ref))} sentences ${swapAt(id).result.sentences.length} lines ${swapAt(id).result.lines.length}`)
    lines.push(`binding now ${json(bindingIds(ta02Items))}; defects ${json(bindingDefects(ta02Items))}`)
    lines.push(`pre-merge class: ${TA02_PRE_MERGE_CLASS.result.chain?.outcome} ${TA02_PRE_MERGE_CLASS.result.chain?.stage} ${json((TA02_PRE_MERGE_CLASS.result.refusalBasis?.cited ?? []).map((c) => c.ref))} example items cited ${json(exampleItemsCited(TA02_PRE_MERGE_CLASS.result))}`)
    lines.push(`TA02 runs example items cited ${json(TA02_IDS.map((id) => exampleItemsCited(ta02At(id).result)))}`)
    lines.push(`TA02-0+GPCL: ${TA02_GPCL.result.chain?.outcome} ${TA02_GPCL.result.chain?.stage}; lens candidates ${json(TA02_GPCL.result.consumption?.lensCandidateIds)} from ${TA02_GPCL.result.consumption?.hintsLensesFrom}; committed ${json(TA02_GPCL.answer?.observed?.lensIds)}; A02-0+GPCL ${json(S.at(`A02-0${S.GPCL}`).result.consumption?.lensCandidateIds)} committed ${json(S.at(`A02-0${S.GPCL}`).answer?.observed?.lensIds)}`)
    lines.push(`carrier mechanism names: ${json(carrierMechanismNames())}`)
    for (const id of TA02_IDS) for (const f of ta02Safeguard(id).findings) lines.push(`${id} ${f.row}${f.clause ? `(${f.clause})` : ''} ${f.verdict} [${classOf(f)}] ${f.why}`)
    lines.push(`identifiers in the body not in the key: ${json(identifiersOf(BODY).filter((t) => !keyOf(t)))}`)
    lines.push(`key entries the body does not use: ${json(KEY.filter((e) => !identifiersOf(BODY).some((t) => (e.family ? t.indexOf(e.id) === 0 : t === e.id)) && BODY.indexOf(e.id) < 0).map((e) => e.id))}`)
    lines.push(`report ${FIRST.report.length} chars, ${FIRST.report.split('\n').length} lines; results ${FIRST.json.length} chars; A01 ${S.A01_BEFORE} ${S.A01_AFTER} ${A01_END}`)
    fs.writeFileSync(process.env.A02_EVIDENCE_MEASURE, lines.join('\n'))
    if (process.env.A02_EVIDENCE_BODY) fs.writeFileSync(process.env.A02_EVIDENCE_BODY, FIRST.report)
}

// ---------------------------------------------------------------------------------------------------------------------------------------
// The tests (every value pinned below was measured first; the slice's notes give the measurement)
// ---------------------------------------------------------------------------------------------------------------------------------------

/** The comparison's aspects with their kinds (measured). */
const ASPECTS: Array<[string, 'SHARED' | 'DIFFERS']> = [
    ['Step 1: the resolved Game Problem', 'SHARED'],
    ['Step 1: the CAR profile it consults', 'SHARED'],
    ['Step 2: the Game Form result', 'SHARED'],
    ['Step 2: the grade of GF2\'s Game Problem cell', 'SHARED'],
    ['Step 2: the cells its result rests on', 'DIFFERS'],
    ['the consumption (what the chain records it was handed)', 'SHARED'],
    ['the context', 'DIFFERS'],
    ['the approved scoring events (our restatement, as a set)', 'SHARED'],
    ['the built scoring event (diagnostic runs)', 'SHARED'],
    ['the approved scoring condition (its row, on the diagnostic runs)', 'DIFFERS'],
    ['the condition\'s origin clause (our restatement\'s values)', 'DIFFERS'],
    ['the condition\'s progression clause (our restatement\'s values)', 'DIFFERS'],
    ['the condition\'s control clause (our restatement\'s values)', 'DIFFERS'],
    ['where the knowledge as it stands stops', 'DIFFERS'],
    ['opposition (our restatement\'s participant rows)', 'DIFFERS'],
    ['the engine lenses (wording-derived engine inputs)', 'DIFFERS'],
    ['the context\'s affordance targets (the library\'s mapping rows)', 'DIFFERS'],
    ['the configuration lines (diagnostic runs)', 'DIFFERS'],
    ['the coach text (diagnostic runs)', 'SHARED'],
    ['the laws owed an adaptation (diagnostic runs)', 'SHARED'],
]
const rowOf = (aspect: string): ReuseRow => {
    const r = COMPARISON.rows.find((x) => x.aspect === aspect)
    assert.ok(r, aspect)
    return r
}

test(`S5. reuse, brief: TA02 through the same consumption over our DRAFT restatement of RPC-003 (TA02's context pending); one comparison measured from both goals' results, the shared decisions (Step 1's GP-015, the CAR profile, Step 2's GF2 and its cell grade, the consumption, the events) against the differing ones (the context, the scoring condition and its clauses, where each stops, opposition, the lenses, the targets); the two diagnostic builds collapse into one activity; the TA02 runs' Game Form, constraints and Game Problem consumed (the Game Problem since stage W1 (a): it governs their hints), their detected disconnections listed`, () => {
    // The TA02 cases are held to the handoff's own validator; the store is admitted whole by its gate (loadDraftStore, above).
    assert.doesNotThrow(() => validateHandoffInputs(ta02Inputs))
    assert.deepEqual(
        [ta02Store.files, ta02Store.contracts.map((c) => c.contractId), ta02Store.records.map((r: any) => [r.learningGoalId, r.contextId, r.gameProblemId, r.authorizedConstraints, r.ruledOn, r.by])],
        [['rpc-003-contract.DRAFT.json', 'ta02-authorization.DRAFT.json'], [TA02_CONTRACT], [['TA02', 'RPC-003', 'GP-015', [], '', '']]],
    )
    assert.deepEqual([TA02_SCORING.rowId, ta02Clauses], [
        'RPC-PROP-134',
        [
            { clause: 'origin', items: ['RPC-003-10.a', 'RPC-003-10.b'] },
            { clause: 'progression', items: ['RPC-003-11.a', 'RPC-003-11.b', 'RPC-003-11.c'] },
            { clause: 'control', items: ['RPC-003-12.a', 'RPC-003-12.b'] },
        ],
    ])
    for (const id of TA02_IDS) {
        const b = ta02At(id)
        assert.deepEqual(b.request?.place, [], `${id}: nothing is placed`)
        assert.deepEqual([b.request?.consume?.gameProblem.gameProblemId, b.request?.consume?.gameForm.formId, b.request?.draftStore, b.request?.records], ['GP-015', 'GF2', TA02_STORE, 'PRODUCTION'], id)
        const r = b.result
        assert.deepEqual([r.receive.step1?.status, r.receive.step1?.basis, r.receive.step1?.primary, r.receive.step1?.contextId, r.receive.step2?.status, r.receive.step2?.selected, r.receive.step2?.compatible], ['RESOLVED', 'APPROVED_TRANSLATION', ['GP-015'], 'RPC-003', 'SELECTED', 'GF2', ['GF2']], id)
        // Stage W1 (b), re-pinned openly: the constraints' authority was AUTHORIZATION_RECORD (the DRAFT TA02 record's empty set); the TA02 runs
        // inherit TT-K2-RETAIN-FORM from the A02 case each mirrors and take K2's result, the empty set, with its limit carried.
        assert.deepEqual([r.consumption?.selectionObservedOnly, r.consumption?.formCandidatesScored, r.consumption?.constraintAuthority, r.consumption?.constraintCandidateIds, r.consumption?.reviewManipulations?.limit], [true, ['GF2'], 'REVIEW_PATHWAY_K2', [], ruling('HO-07NOV-K2').words[2]], id)
        // The same safeguard check as the A02 runs: the owned decisions consumed; every detected disconnection listed; none stale.
        const { findings } = ta02Safeguard(id)
        // Re-pinned openly in stage W1 (a): the Game Problem was CARRIED_NOT_READ (read by no decision of the chain); Step 1's GP-015 now governs
        // the hints, so it and the hints read CONSUMED.
        assert.deepEqual(['GAME_PROBLEM', 'GAME_PROBLEM_HINTS', 'GAME_FORM', 'CONSTRAINTS'].map((row) => verdictsOf(findings, row).join(',')), ['CONSUMED', 'CONSUMED', 'CONSUMED', 'CONSUMED'], id)
        assert.deepEqual(unlisted(findings, TA02_DISCONNECTIONS, ['EXPERIMENT']).map(ownershipMessage), [], id)
        // Never a TA02 configuration: each run carries the context-pending note.
        assert.ok(r.reportNotes.some((n) => n.text.indexOf('TA02\'s context pending') === 0), id)
    }
    assert.deepEqual(stale(TA02_IDS.flatMap((id) => ta02Safeguard(id).findings), TA02_DISCONNECTIONS), [], 'no TA02 entry names a run where it is not detected')
    assert.ok(unlisted(ta02Safeguard('TA02-0').findings, [], ['EXPERIMENT']).length > 0, 'bite: without the entries, the detected disconnections are unlisted')
    // TA02-0: refused at structure on its own restatement's origin value, RESTATEMENT-ONLY (A02-0 is refused on RPC-002's control referent and
    // origin value). Re-pinned at the merge of the program branch (08223ea, 11 November 2026). Before: cited
    // ['c:restated:RPC-003:RPC-003-12.a::V5', 'c:restated:RPC-003:RPC-003-10.a::V6']. After: ['c:restated:RPC-003:RPC-003-10.a::V6'] alone,
    // because our DRAFT restatement's control items (RPC-003-12.a, 12.b) are examples there (SUPPORTING, TYPICAL_EXAMPLE), so no control
    // condition is constituted and its referent is owed by no line.
    const t0 = ta02At('TA02-0').result
    assert.deepEqual([t0.chain?.outcome, t0.chain?.stage, t0.refusalBasis?.verdict, t0.refusalBasis?.cited.map((c) => c.ref)], ['refused', 'structure', 'RESTATEMENT-ONLY', ['c:restated:RPC-003:RPC-003-10.a::V6']])
    const tD = ta02At('TA02-D').result
    assert.deepEqual([tD.chain?.outcome, tD.sentences.length, tD.resultStanding], ['served', 8, 'DIAGNOSTIC_STRUCTURAL_COMPATIBILITY_ONLY_NOT_REPRESENTATIVE_SUFFICIENCY'])
    // The comparison, aspect by aspect (measured).
    assert.deepEqual(COMPARISON.rows.map((r) => [r.aspect, r.kind]), ASPECTS)
    assert.deepEqual([rowOf('Step 1: the resolved Game Problem').a02, rowOf('Step 2: the Game Form result').a02, rowOf('Step 2: the grade of GF2\'s Game Problem cell').a02], ['RESOLVED GP-015 (APPROVED_TRANSLATION)', 'SELECTED GF2 (compatible: GF2)', 'CANDIDATE'])
    assert.equal(rowOf('Step 1: the CAR profile it consults').a02, 'GP-015 PRIMARY FOI E, OP E, SA E, CIO E (Approved; SA flagged for field validation)')
    assert.deepEqual([rowOf('the context').a02, rowOf('the context').ta02], [`RPC-002 'High Press Escape'`, `RPC-003 'Attack Development'`])
    assert.deepEqual([rowOf('the approved scoring condition (its row, on the diagnostic runs)').a02, rowOf('the approved scoring condition (its row, on the diagnostic runs)').ta02], ['RPC-PROP-133: NOT_CLASSIFIED, carried no', 'RPC-PROP-134: NOT_CLASSIFIED, carried no'])
    assert.deepEqual(
        ['origin', 'progression', 'control'].map((c) => [rowOf(`the condition's ${c} clause (our restatement's values)`).a02, rowOf(`the condition's ${c} clause (our restatement's values)`).ta02]),
        [
            [`'established coordinated pressure'`, `'the attack's starting condition'`],
            [`'the pressing line', 'beyond'`, `'a more advanced representative area', 'more advanced'`],
            [`'retains possession through the next action'`, `'while maintaining attacking possession'`],
        ],
    )
    assert.equal(rowOf('the approved scoring events (our restatement, as a set)').a02, `'gate', 'line_crossed', 'target_player', 'target_zone_entered'`)
    assert.equal(rowOf('the built scoring event (diagnostic runs)').a02, `'line_crossed' within ['line_crossed', 'target_zone_entered']`)
    assert.ok(rowOf('opposition (our restatement\'s participant rows)').a02.endsWith('lines resting on them in the diagnostic build: 0') && rowOf('opposition (our restatement\'s participant rows)').ta02.endsWith('lines resting on them in the diagnostic build: 0'))
    assert.deepEqual([rowOf('the context\'s affordance targets (the library\'s mapping rows)').a02, rowOf('the context\'s affordance targets (the library\'s mapping rows)').ta02], [
        'RPC-MAP-097, RPC-MAP-098, RPC-MAP-099, RPC-MAP-100, RPC-MAP-101, RPC-MAP-102: DEFERRED',
        'RPC-MAP-103, RPC-MAP-104, RPC-MAP-105, RPC-MAP-106, RPC-MAP-107: DEFERRED',
    ])
    // The collapse: the two diagnostic builds hold the same coach text, and the same lines but one transition value's source.
    assert.equal(COMPARISON.sentencesIdentical, true)
    assert.deepEqual(COMPARISON.differingLines, [`c:restated:GF2:GF2-07.a::T7: true [SD-14 (records Christian's decisions of 18 September on revision 2)] class 2 | 'true' [restated:RPC-003 RPC-003-09.a] class 3`])
    // Bite: the comparison sees sameness as well as difference: A02 compared with itself is SHARED on every aspect.
    const a = pairOf('A02', a02Built('A02-0'), a02Built('A02-D'), S.at('A02-D').run.chain?.lenses ?? [])
    assert.deepEqual([...new Set(comparisonOf(a, a).rows.map((r) => r.kind))], ['SHARED'])
    // A01 unchanged by the TA02 runs.
    assert.deepEqual([S.A01_BEFORE, S.A01_AFTER], [A01_END, A01_END])
})

/** Stage W5: how each row moves under the swap (measured 12 November 2026). */
const SWAP_MOVES: Record<SwapClass, string[]> = {
    shared: [
        ...SHARED_ROWS.slice(0, 4),
        'the consumption (what the chain records it was handed)',
        'the approved scoring events (our restatement, as a set)',
        'the built scoring event (diagnostic runs)',
        'the coach text (diagnostic runs)',
        'the laws owed an adaptation (diagnostic runs)',
    ],
    swaps: [
        'the condition\'s origin clause (our restatement\'s values)',
        'the condition\'s progression clause (our restatement\'s values)',
        'the condition\'s control clause (our restatement\'s values)',
        'where the knowledge as it stands stops',
        'opposition (our restatement\'s participant rows)',
        'the configuration lines (diagnostic runs)',
    ],
    stays: [
        'Step 2: the cells its result rests on',
        'the context',
        'the approved scoring condition (its row, on the diagnostic runs)',
        'the engine lenses (wording-derived engine inputs)',
        'the context\'s affordance targets (the library\'s mapping rows)',
    ],
    other: [],
}
/** Stage W5: the differing rows by group (measured 12 November 2026). */
const GROUPS: Record<Group, string[]> = {
    executing: ['the context', 'where the knowledge as it stands stops', 'the configuration lines (diagnostic runs)'],
    'recorded, not executing': [
        'the approved scoring condition (its row, on the diagnostic runs)',
        'the condition\'s origin clause (our restatement\'s values)',
        'the condition\'s progression clause (our restatement\'s values)',
        'the condition\'s control clause (our restatement\'s values)',
        'opposition (our restatement\'s participant rows)',
        'the context\'s affordance targets (the library\'s mapping rows)',
    ],
    'not a distinction': ['Step 2: the cells its result rests on', 'the engine lenses (wording-derived engine inputs)'],
    unassigned: [],
}

test(`W5 (A02 package, 12 November 2026). reuse after the merge of the program branch, U3 (b) rows (1) to (5) (row (6), B13 over the RPC-002 store, is in requirement-bindings.unit.ts): (1) the shared rows SHARED; (2) TA02's binding items are those before the merge less exactly the six example-only items, RPC-003-05, 10.a and 10.b kept (bite: dropping 05 fails); (3) no TA02 refusal cites an example-only item, TA02-0 re-measured (bite: the pre-merge class copy cites 12.a); (4) the swap control: the rows from the restatements and the stops swap, the shared rows do not move, the rows of the goal and its routing stay (bites: no swap, a moved shared row); (5) the collapse kept visible, 'distinctions recorded, not executing' (bite: a line resting on an opposition item); stages W1 to W4 where they apply to TA02 (GP_COVERAGE_LENSES run; the switch not applicable; the carriers' mechanism names no context, with its bite)`, () => {
    const item = (id: string) => ta02Items.find((i) => String(i.itemId) === id)
    // (1) The shared rows, K2's result among what the consumption row holds (stage W1 (b)), the CAR profile consulted only.
    for (const aspect of SHARED_ROWS) assert.equal(rowOf(aspect).kind, 'SHARED', aspect)
    assert.ok(rowOf('the consumption (what the chain records it was handed)').a02.includes('constraints REVIEW_PATHWAY_K2 []; size-rule bypass false'))
    assert.ok(rowOf('Step 1: the CAR profile it consults').note.indexOf('consulted in Step 1 only') === 0)

    // (2) TA02's binding items: before the merge less exactly the six example-only items; the independently authorized ones kept.
    assert.deepEqual([TA02_BINDING_BEFORE.length, bindingIds(ta02Items).length], [21, 15])
    assert.deepEqual(bindingIds(ta02Items), TA02_BINDING_BEFORE.filter((id) => !(id in TA02_EXAMPLE_ONLY)))
    assert.deepEqual(bindingDefects(ta02Items), [])
    assert.deepEqual([item('RPC-003-05')?.strictness, item('RPC-003-05')?.row, item('RPC-003-05')?.value], ['EXCLUSION', 'V1', 'possession alone'])
    assert.deepEqual(['RPC-003-10.a', 'RPC-003-10.b'].map((id) => [item(id)?.strictness, item(id)?.selector]), [['REQUIRED', 'type=origin'], ['REQUIRED', 'type=origin']])
    // The bites (TEST-ONLY copies of the items, never written): 05 dropped, 05 made SUPPORTING, 12.a made REQUIRED again, 12.a deleted.
    assert.deepEqual(bindingDefects(ta02Items.filter((i) => i.itemId !== 'RPC-003-05')), ['RPC-003-05 is no longer binding', 'RPC-003-05, an independently authorized condition, is not kept binding'])
    assert.deepEqual(bindingDefects(copy(ta02Items).map((i) => (i.itemId === 'RPC-003-05' ? { ...i, strictness: 'SUPPORTING' } : i))), ['RPC-003-05 is no longer binding', 'RPC-003-05, an independently authorized condition, is not kept binding'])
    assert.deepEqual(bindingDefects(copy(ta02Items).map((i) => (i.itemId === 'RPC-003-12.a' ? { ...i, strictness: 'REQUIRED' } : i))), [
        'RPC-003-12.a is binding and is not among the items binding before the merge less the example-only items',
        'RPC-003-12.a is not kept as an example (REQUIRED, TYPICAL_EXAMPLE)',
    ])
    assert.deepEqual(bindingDefects(ta02Items.filter((i) => i.itemId !== 'RPC-003-12.a')), ['RPC-003-12.a is gone, and its provenance with it'])

    // (3) No TA02 refusal cites an example-only item; TA02-0 re-measured; the pre-merge class copy cites 12.a (the bite).
    for (const id of TA02_IDS) assert.deepEqual(exampleItemsCited(ta02At(id).result), [], id)
    const t0 = ta02At('TA02-0').result
    assert.deepEqual([t0.chain?.outcome, t0.chain?.stage, t0.refusalBasis?.cited.map((c) => c.ref)], ['refused', 'structure', ['c:restated:RPC-003:RPC-003-10.a::V6']])
    const pm = TA02_PRE_MERGE_CLASS.result
    assert.deepEqual([pm.chain?.outcome, pm.chain?.stage, pm.refusalBasis?.verdict, pm.refusalBasis?.cited.map((c) => c.ref)], ['refused', 'structure', 'RESTATEMENT-ONLY', ['c:restated:RPC-003:RPC-003-12.a::V5', 'c:restated:RPC-003:RPC-003-10.a::V6']])
    assert.deepEqual(exampleItemsCited(pm), ['RPC-003-12.a'], 'bite: the pre-merge class copy is caught citing RPC-003-12.a')

    // (4) The swap control. The cases are held to the handoff's own validator; each swap run keeps its own goal, routing, Steps 1 and 2 and
    // consumption, and derives the routed context from the other context's restatement (its items under the routed id).
    assert.doesNotThrow(() => validateHandoffInputs(swapInputs))
    assert.deepEqual([...swapBuilt.keys()], ['A02-0/swap', 'A02-D/swap', 'TA02-0/swap', 'TA02-D/swap'])
    for (const { side, c } of SWAP_CASES) {
        const b = swapAt(c.id)
        const own = side.goal === 'A02' ? a02Built(c.id.split(SWAP).join('')) : ta02At(c.id.split(SWAP).join(''))
        assert.deepEqual([b.result.goalId, json(b.result.receive), json(b.result.consumption?.form), b.result.consumption?.constraintAuthority], [own.result.goalId, json(own.result.receive), json(own.result.consumption?.form), 'REVIEW_PATHWAY_K2'], c.id)
        const derived = (b.answer?.contracts ?? []).find((x) => x.contractId === side.into)
        assert.equal(derived?.origin, 'DRAFT_STORE', c.id)
        assert.ok((derived?.items ?? []).every((i) => side.fromItems.some((f) => String(f.itemId) === i.itemId)), `${c.id}: the routed context derived from the other restatement's items only`)
        assert.ok(b.result.testOnlyTreatments.some((t) => t.id === SWAP_TREATMENT), `${c.id}: the swap is a declared TEST-ONLY treatment`)
    }
    // How each row moves (measured).
    for (const move of ['shared', 'swaps', 'stays', 'other'] as SwapClass[]) assert.deepEqual(rowsThat(move), SWAP_MOVES[move], move)
    for (const r of COMPARISON.rows.filter((x) => x.kind === 'SHARED')) assert.equal(SWAP_CLASSES.find((x) => x.aspect === r.aspect)?.move, 'shared', r.aspect)
    // The stops swap: each goal now stops on the other's lines, the restatement's id aside.
    assert.deepEqual(
        [`A02-0${SWAP}`, `TA02-0${SWAP}`].map((id) => unlabelled(citedOf(swapAt(id).result))),
        [unlabelled(citedOf(t0)), unlabelled(citedOf(S.at('A02-0').result))],
    )
    // The diagnostic builds swap line for line: TA02 over RPC-002's restatement builds A02-D's lines exactly; A02 over RPC-003's builds
    // TA02-D's, the restatement's id aside; the coach text is one text throughout.
    const keys = (r: HandoffResult) => r.lines.map((l) => unlabelled(`${l.lineId} ${lineKey(l)}`))
    assert.deepEqual(keys(swapAt(`TA02-D${SWAP}`).result), keys(S.at('A02-D').result))
    assert.deepEqual(keys(swapAt(`A02-D${SWAP}`).result), keys(ta02At('TA02-D').result))
    assert.equal(SWAP_COMPARISON.sentencesIdentical, true)
    // The bites: compared with no swap at all, no row swaps (the context rows read 'stays'); a shared row that moves is 'other'; the
    // exchange refuses a missing contract and a contract exchanged with itself.
    const noSwap = swapClasses(COMPARISON, COMPARISON)
    assert.deepEqual([noSwap.filter((x) => x.move === 'swaps').length, SWAP_MOVES.swaps.every((a) => noSwap.find((x) => x.aspect === a)?.move === 'stays')], [0, true], 'bite: without the swap the restatement rows stay')
    const moved = copy(SWAP_COMPARISON)
    moved.rows.find((r) => r.aspect === 'Step 1: the resolved Game Problem')!.ta02 = 'RESOLVED GP-099 (APPROVED_TRANSLATION)'
    assert.equal(swapClasses(COMPARISON, moved).find((x) => x.aspect === 'Step 1: the resolved Game Problem')?.move, 'other', 'bite: a shared row that moves under the swap is caught')
    const store = loadDraftStore(A02_STORE, { recordsSetAsideBy: 'TT-K2-RETAIN-FORM' })
    assert.throws(() => swappedStore(store, store, { treatmentId: 'TT-X', into: 'restated:RPC-099', fromStore: A02_STORE, fromContract: A02_CONTRACT }), /holds no contract restated:RPC-099/)
    assert.throws(() => swappedStore(store, store, { treatmentId: 'TT-X', into: A02_CONTRACT, fromStore: A02_STORE, fromContract: A02_CONTRACT }), /exchanges two different restatements/)
    // Why on the chain's copy: the store's gate refuses the relabelled copy on disk (RPC-002's approved condition row cited by no constituting
    // item), and admits the same file not relabelled (the control).
    assert.equal(relabelledCopyGate(false), 'ADMITTED')
    assert.ok(relabelledCopyGate(true).includes('row RPC-PROP-133 for RPC-002 is cited by no item constituting a scoring condition'), 'the gate refuses a relabelled restatement')

    // (5) The collapse kept visible: each differing row in one group, by a measured predicate; the report says it in those words.
    for (const group of ['executing', 'recorded, not executing', 'not a distinction', 'unassigned'] as Group[]) assert.deepEqual(inGroup(group), GROUPS[group], group)
    assert.ok(FIRST.report.split('\n').some((l) => l.indexOf(`- ${NOT_EXECUTING_WORDS}: ${GROUPS['recorded, not executing'].join('; ')}.`) === 0), 'item 6 prints the distinctions recorded, not executing')
    // The bite: one line of A02-D's build resting on an opposition item moves opposition to 'executing'.
    const doctored = copy(A02_PAIR.diag.result)
    doctored.lines = [...doctored.lines, { ...doctored.lines[0], lineId: 'probe::P1', premises: [{ ...doctored.lines[0].premises[0], ref: `${A02_CONTRACT} RPC-002-05` }] }]
    const bit = distinctionsOf(COMPARISON, { ...A02_PAIR, diag: { result: doctored, answer: A02_PAIR.diag.answer } }, TA02_PAIR)
    assert.equal(bit.find((d) => d.aspect === 'opposition (our restatement\'s participant rows)')?.group, 'executing', 'bite: a line resting on an opposition item is executing')

    // Stages W1 to W4 where they apply to TA02. W1 (c1): under GP_COVERAGE_LENSES TA02-0's lens pool and committed lenses are A02-0's under it
    // (CV-015's five; the same three in the same order), while without it the lens rows differ (the comparison's own row: the negative control).
    const gA = S.at(`A02-0${S.GPCL}`)
    assert.deepEqual([TA02_GPCL.result.consumption?.hintsLensesFrom, TA02_GPCL.result.consumption?.lensCandidateIds.length], ['STEP1_COVERAGE_ROW', 5])
    assert.deepEqual([TA02_GPCL.result.consumption?.lensCandidateIds, TA02_GPCL.answer?.observed?.lensIds], [gA.result.consumption?.lensCandidateIds, gA.answer?.observed?.lensIds])
    assert.deepEqual((TA02_GPCL.answer?.observed?.lensIds ?? []).map(shortLens), ['possession-stability', 'line-breaking', 'space-creation'])
    assert.equal(rowOf('the engine lenses (wording-derived engine inputs)').kind, 'DIFFERS', 'without the treatment the lenses follow each goal\'s wording')
    // W2: the switch and FOUNDATION_PRESENCE_BYPASS are not declared on any TA02 run, which commit K2's empty set (the zero branch).
    for (const id of TA02_IDS) {
        const r = ta02At(id).result
        assert.deepEqual([r.consumption?.sizeRuleBypassed, r.consumption?.constraintCandidateIds, r.testOnlyTreatments.filter((t) => t.kind === 'SIZE_RULE_BYPASS' || t.kind === 'FOUNDATION_PRESENCE_BYPASS').length], [false, [], 0], id)
    }
    // W4: the carriers' mechanism names no context, neither goal and no context name; the bite: a copy of a block naming RPC-003 is caught,
    // and a block the reading cannot find is named.
    assert.deepEqual(carrierMechanismNames(), [])
    const real = (file: string) => fs.readFileSync(path.join(HERE, '..', file), 'utf8')
    const named = carrierMechanismNames((file) => (file === 'derivation/gates.ts' ? real(file).replace('function whileStateClause(ctx: GateContext, probe: Probe, typed: BeginConditionReferent)', 'function whileStateClause(ctx: GateContext, probe: Probe, typed: BeginConditionReferent) /* RPC-003 */') : real(file)))
    assert.deepEqual(named, ['derivation/gates.ts whileStateClause: RPC-003'], 'bite: a context id in the mechanism is caught')
    assert.deepEqual(carrierMechanismNames((file) => (file === 'derivation/draft-store.ts' ? real(file).split('withIllustrativeCarriers').join('withCarriers') : real(file))), ['derivation/draft-store.ts withIllustrativeCarriers: not found'])
    // A01 unchanged by the stage's runs (A01_END is built after them).
    assert.deepEqual([S.A01_BEFORE, S.A01_AFTER], [A01_END, A01_END])
})

/** Every object of the results with a ruling's `ref` and a `received` date (a ruling's serialized entry), wherever it sits. */
function datedEntries(value: unknown, out: Array<{ ref: string; entry: Record<string, unknown> }> = []): Array<{ ref: string; entry: Record<string, unknown> }> {
    if (Array.isArray(value)) for (const v of value) datedEntries(v, out)
    else if (value && typeof value === 'object') {
        const o = value as Record<string, unknown>
        if (typeof o.ref === 'string' && typeof o.received === 'string') out.push({ ref: o.ref, entry: o })
        for (const v of Object.values(o)) datedEntries(v, out)
    }
    return out
}
/** The entries whose date basis disagrees with their ruling's (RC3-N1): an entry of a marked ruling must carry its marker and name; no other may. */
const undatedEntries = (results: unknown): string[] =>
    datedEntries(results).flatMap(({ ref, entry }) => {
        const r = inputs.rulings.find((x) => x.id === ref)
        if (!r) return [`${ref}: no such ruling`]
        if (r.dateBasis) return entry.dateBasis === r.dateBasis && entry.citedAs === r.citedAs ? [] : [`${ref}: dateBasis ${String(entry.dateBasis)}, citedAs ${String(entry.citedAs)}`]
        return 'dateBasis' in entry || 'citedAs' in entry ? [`${ref}: a date basis on an unmarked ruling`] : []
    })

const APPENDIX_A = 'APPENDIX A: THE A02 CASES IN DETAIL (the runs, what each refusal rests on, the restatement item by item, UNRESOLVED, the questions, the Essential Representative Relationships)'
const HEADINGS = [
    '1. CONSUMPTION OF STEP 1 AND STEP 2',
    '2. HIGH PRESS ESCAPE\'S IDENTITY AND SCORING',
    '3. THE SAFEGUARDS AGAINST REASONING DISCONNECTIONS',
    '4. ZERO, ONE OR MORE MANIPULATIONS WITHOUT THE QUOTA',
    '5. THE EARLIEST CONSEQUENTIAL BLOCKER',
    '6. REUSE BETWEEN A02 AND TA02 (brief)',
    '7. THE EXISTING APPLICATION AND A01',
]

test(`the report: the constraint selector disclosed first, each of its places held to the file's text; the key covers every identifier of the frame and the seven items, and each key entry is used; Christian's seven items in order, each asked in Christian's words, each answer kept apart from the implemented and tested behaviour; the appendices in order; double quotation marks only around Christian's words; no gendered pronoun`, () => {
    const lines = FIRST.report.split('\n')
    const first = (prefix: string) => lines.findIndex((l) => l.indexOf(prefix) === 0)
    // The selector, first.
    const disclosure = first('FIRST, FOR CHRISTIAN\'S DECISION: THE CONSTRAINT SELECTOR')
    assert.ok(disclosure > 0 && disclosure < first('KEY (') && first('KEY (') < lines.indexOf(HEADINGS[0]), 'the disclosure comes before the key and the items')
    const source = fs.readFileSync(SELECTOR_PATH, 'utf8').split('\n')
    for (const h of [...SELECTOR_HUNKS, ...K2_SELECTOR_HUNKS]) {
        assert.ok(source[h.at - 1].includes(h.holds), `${SELECTOR_FILE}:${h.at} holds ${h.holds}`)
        assert.ok(lines.includes(`   ${SELECTOR_FILE}:${h.lines}: ${h.what}`), h.lines)
    }
    // Stage W1 (b): every line of the selector naming K2's authority or its guard lies inside a disclosed K2 place.
    const insideK2 = (n: number) => K2_SELECTOR_HUNKS.some((h) => n >= Number(h.lines.split('-')[0]) && n <= Number(h.lines.split('-')[1] ?? h.lines))
    const namingK2 = source.map((l, n) => ({ n: n + 1, l })).filter((x) => x.l.indexOf('REVIEW_PATHWAY_K2') >= 0 || x.l.indexOf('reviewPathwayK2EmptySet') >= 0 || x.l.indexOf('authority.authority') >= 0)
    assert.ok(namingK2.length > 0)
    assert.deepEqual(namingK2.filter((x) => !insideK2(x.n)).map((x) => x.n), [], 'a line naming K2 outside the disclosed places')
    // Every line of the selector naming the switch, the own size or the sizes list lies inside a disclosed place (measured: none outside). Stage
    // W2: also the switch's checks and the treatment (switchChecks, SwitchChecks, wholePool, everyMemberValidated, foundationPresenceBypass).
    const inside = (n: number) =>
        SELECTOR_HUNKS.some((h) => {
            const [from, to] = h.lines.split('-').map(Number)
            return n >= from && n <= (to ?? from)
        })
    const SWITCH_WORDS = ['quotaBypass', 'constraintSizes', 'switchChecks', 'SwitchChecks', 'wholePool', 'everyMemberValidated', 'foundationPresenceBypass']
    const naming = source.map((l, n) => ({ n: n + 1, l })).filter((x) => SWITCH_WORDS.some((w) => x.l.indexOf(w) >= 0))
    assert.ok(naming.length > 0)
    assert.deepEqual(naming.filter((x) => !inside(x.n)).map((x) => x.n), [], 'a line naming the switch outside the disclosed places')
    // Stage W2: the package check's, the builder's and the validator's places, each held to its file's text, and every line of those files naming
    // the stage's identifiers inside one of them.
    for (const h of PACKAGE_HUNKS) {
        const text = fs.readFileSync(path.join(HERE, '..', h.file), 'utf8').split(/\r?\n/)
        assert.ok(text[h.at - 1].includes(h.holds), `${h.file}:${h.at} holds ${h.holds}`)
        assert.ok(lines.includes(`   ${h.file.split('/').slice(-1)[0]}:${h.lines}: ${h.what}`), `${h.file}:${h.lines}`)
    }
    const PACKAGE_WORDS = ['everyMemberValidated', 'foundationPresenceBypass', 'FoundationPresenceBypass', 'FoundationOptionalPackage', 'refuseAbsentMembers', 'ABSENT_MEMBER_WORDS']
    for (const file of [...new Set(PACKAGE_HUNKS.map((h) => h.file))]) {
        const text = fs.readFileSync(path.join(HERE, '..', file), 'utf8').split(/\r?\n/)
        const insideOf = (n: number) => PACKAGE_HUNKS.filter((h) => h.file === file).some((h) => n >= Number(h.lines.split('-')[0]) && n <= Number(h.lines.split('-')[1] ?? h.lines))
        assert.deepEqual(text.map((l, n) => ({ n: n + 1, l })).filter((x) => PACKAGE_WORDS.some((w) => x.l.indexOf(w) >= 0) && !insideOf(x.n)).map((x) => x.n), [], `${file}: a line naming the stage's identifiers outside the disclosed places`)
    }
    // The key.
    const keyAt = first('KEY (')
    const keyEnd = first('The appendices are the detailed texts')
    const body = lines.slice(0, lines.indexOf(APPENDIX_A))
    assert.equal(body.join('\n'), BODY.split('\n').slice(0, body.length).join('\n'))
    // Each key entry is used somewhere in the report outside the key (the seven items or the appendices the key also serves).
    const withoutKey = [...lines.slice(0, keyAt), ...lines.slice(keyEnd + 1)].join('\n')
    assert.deepEqual(identifiersOf(body.join('\n')).filter((t) => !keyOf(t)), [], 'every identifier of the frame and the seven items is in the key')
    assert.deepEqual(KEY.filter((e) => withoutKey.indexOf(e.id) < 0).map((e) => e.id), [], 'each key entry is used')
    assert.deepEqual(identifiersOf(`GF9 and OD-NEW and build.ts:3 and ${Q}GF8 quoted${Q} and plain words`), ['GF9', 'OD-NEW', 'build.ts:3'], 'bite: the identifiers are seen, Christian\'s quoted words are not')
    assert.equal(keyOf('GF9'), undefined, 'bite: an identifier the key does not hold is found')
    // The seven items, in order, each asked in Christian's words.
    const starts = HEADINGS.map((h) => lines.indexOf(h))
    assert.ok(starts.every((s, n) => s > 0 && (n === 0 || s > starts[n - 1])), 'the seven items, in order')
    starts.forEach((s, n) => {
        assert.equal(lines[s + 1], `Christian asked: ${cite('A02-10NOV-REPORT', n)}`, HEADINGS[n])
        const block = lines.slice(s, n < starts.length - 1 ? starts[n + 1] : lines.indexOf(APPENDIX_A))
        // Each part told apart, in this order: the answer (ours), the implemented and tested behaviour, our proposals, our assumptions, ecological suitability.
        const parts = ['Answer (OURS): ', 'Implemented and tested', 'Proposals', 'Assumptions', 'Ecological suitability: not'].map((p) => block.findIndex((l) => l.indexOf(p) === 0))
        assert.ok(parts.every((p, m) => p > 0 && (m === 0 || p > parts[m - 1])), `${HEADINGS[n]}: its parts told apart, in order (${parts.join(', ')})`)
    })
    assert.ok(lines.some((l) => l.includes(cite('A02-10NOV-REPORT', 7))), 'the distinction Christian asked for is quoted')
    const appendices = ['APPENDIX A:', 'APPENDIX B:', 'APPENDIX C:', 'APPENDIX D:'].map(first)
    assert.ok(appendices.every((s, n) => s > starts[6] && (n === 0 || s > appendices[n - 1])), 'the appendices, in order, after the seven items')
    // Quotation marks: every double-quoted span (typographic ones read whole first) is, verbatim, words of a ruling the inputs hold.
    const words = new Set(inputs.rulings.flatMap((r) => r.words))
    const spans = quotedSpans(FIRST.report)
    assert.ok(spans.length > 1, 'quotation marks pair')
    for (const s of spans) assert.ok(words.has(s), `a double-quoted span that is not Christian's words: ${s}`)
    // The reply about A02 is cited by its paste date, never a received date (its mail header was not kept).
    assert.equal(FIRST.report.split('received 10 November 2026').length - 1, 0, 'no received date for the reply about A02')
    // RC3-N1: in the results too, every serialized entry of the reply about A02 carries its date basis and the name a citation gives it beside
    // the paste date its `received` field holds; no entry of another reply carries either (measured: 40 entries, all of A02-10NOV-* rulings).
    const results = JSON.parse(FIRST.json)
    const dated = datedEntries(results)
    assert.equal(dated.filter((e) => e.ref.indexOf('A02-10NOV-') === 0).length, 40, 'the serialized entries of the reply about A02 (measured)')
    assert.deepEqual([...new Set(dated.filter((e) => e.ref.indexOf('A02-10NOV-') === 0).map((e) => `${String(e.entry.dateBasis)} ${String(e.entry.citedAs)}`))], ['PASTED_WITHOUT_HEADER reply about A02'])
    assert.deepEqual(undatedEntries(results), [], 'every A02-10NOV-* entry carries dateBasis PASTED_WITHOUT_HEADER, and no other entry a date basis')
    const doctored = copy(results)
    delete datedEntries(doctored).find((e) => e.ref.indexOf('A02-10NOV-') === 0)!.entry.dateBasis
    assert.equal(undatedEntries(doctored).length, 1, 'bite: an A02-10NOV-* entry without its date basis is found')
    // NF-02: the runs the switch's removal would refuse are the lone Neutral Player runs, each committing S4-NP's set (measured). Stage W2,
    // re-pinned openly: the assertion that they held item 4's floor measurement (FLOOR_RUNS, ['S4-NP~reversed', 'S4-NP~neutral']) is removed,
    // because under the switch the set is taken whole (E1) and no floor for subsets remains to be measured.
    assert.deepEqual(LONE_RUNS, ['S4-NP', 'S4-NP@A02-D', 'S4-NP~reversed', 'S4-NP~neutral'])
    for (const id of LONE_RUNS) assert.deepEqual(S.at(id).run.chain?.constraints, S.at('S4-NP').run.chain?.constraints, id)
    // RC1-N3 (documented, not widened): the control clause carried under the treatment and then refused on its item named by its value path
    // (measured), said in item 2; no other clause has such a run.
    assert.deepEqual(['origin', 'progression', 'control'].map((c) => valuePathRefusals(c).map((x) => `${x.id} ${x.stage}`)), [[], [], ['A02-2 communication', 'A02-2~reversed communication', 'A02-2~neutral communication']])
    assert.ok(lines.some((l) => l.indexOf('- The control clause over the ') === 0 && l.includes('on 3 of them (A02-2, A02-2~reversed, A02-2~neutral) the run is then refused at communication on this clause\'s own item, named by its value path, for want of approved wording; the verdict reads only the lines a refusal cites, so the clause keeps CARRIED_UNDER_TREATMENT')), 'item 2 says which carried runs are then refused on the clause\'s item')
    // The experiment path's violation verdicts, as item 3 splits them: each listed by exactly one open disconnection (so the split adds up).
    const experimentViolations = S.EXPERIMENT_RUNS.flatMap((id) => S.at(id).findings).filter((f) => classOf(f) === 'VIOLATION')
    const listedBy = (f: Finding) => S.OPEN_DISCONNECTIONS.filter((e) => e.scope === 'EXPERIMENT' && unlisted([f], [e], ['EXPERIMENT']).length === 0).length
    assert.deepEqual([...new Set(experimentViolations.map(listedBy))], [1], 'every experiment violation is listed by exactly one open disconnection')
    // No gendered pronoun in the evidence.
    for (const [file, text] of [['a02-report.txt', FIRST.report], ['a02-results.json', FIRST.json]]) {
        const hit = text.split('\n').findIndex((l) => holdsGenderedPronoun(l))
        assert.equal(hit, -1, `${file}: a gendered pronoun at line ${hit + 1}`)
    }
})

test('the evidence equals what this file generates, generated twice and identical (rewritten only under UPDATE_A02_EVIDENCE=1); the folder holds its README (the disposition table, the open disconnections, the selector\'s places), the regression record and its line-end rule', () => {
    const again = buildTa02()
    const second = evidenceOf(
        runHandoffCases(inputs, realChain, committedKnowledge()),
        TA02_IDS.map((id) => again.get(id)!.result),
    )
    assert.equal(second.json, FIRST.json, 'two builds, identical results')
    assert.equal(second.report, FIRST.report, 'two builds, identical report')
    const reportFile = path.join(EVIDENCE, 'a02-report.txt')
    const jsonFile = path.join(EVIDENCE, 'a02-results.json')
    if (process.env.UPDATE_A02_EVIDENCE === '1') {
        fs.mkdirSync(EVIDENCE, { recursive: true })
        fs.writeFileSync(reportFile, FIRST.report)
        fs.writeFileSync(jsonFile, FIRST.json)
        quiet('  (evidence rewritten under UPDATE_A02_EVIDENCE=1)')
    }
    assert.equal(fs.readFileSync(reportFile, 'utf8'), FIRST.report, 'a02-report.txt equals the generated report')
    assert.equal(fs.readFileSync(jsonFile, 'utf8'), FIRST.json, 'a02-results.json equals the generated results')
    assert.equal(fs.readFileSync(path.join(FOLDER, '.gitattributes'), 'utf8'), '* text eol=lf\n')
    const record = JSON.parse(fs.readFileSync(path.join(EVIDENCE, 'regression-record.json'), 'utf8'))
    assert.ok(typeof record.status === 'string' && record.status.length > 0, 'the regression record says its status')
    const readme = fs.readFileSync(path.join(FOLDER, 'README.md'), 'utf8')
    // RC3-N4: the report and the README speak of the record as its status says (the record itself stays the lead's to fill).
    assert.equal(record.status, RECORD.status)
    for (const phrase of RECORD_WORDS.readmeHolds) assert.ok(readme.includes(phrase), `the README says ${phrase} (the record: ${record.status})`)
    for (const phrase of RECORD_WORDS.readmeOmits) assert.ok(!readme.includes(phrase), `the README no longer says ${phrase} (the record: ${record.status})`)
    assert.ok(FIRST.report.includes(`(${RECORD_WORDS.item7})`) && FIRST.report.includes(`${RECORD_WORDS.disclosure}.`), 'the report speaks of the record as its status says')
    // Bites, whatever the record's status (so filling it needs no change here): a filled record (doctored in memory) switches the wording to its
    // build; the README as it stands fails the other status; a filled record without its build is refused.
    const filled = recordWords({ status: 'RECORDED', build: 'abc1234' })
    assert.deepEqual([filled.item7, filled.disclosure.endsWith('(recorded on abc1234)')], ['recorded on abc1234', true])
    const other = RECORD.status === RECORD_PENDING ? filled : recordWords({ status: RECORD_PENDING, build: null })
    assert.ok(other.readmeOmits.some((phrase) => readme.includes(phrase)) || !other.readmeHolds.every((phrase) => readme.includes(phrase)), 'bite: the README as it stands fails the other status')
    assert.throws(() => recordWords({ status: 'RECORDED', build: null }), /a filled regression record names the build/)
    for (const d of DISPOSITION) assert.ok(readme.includes(`| ${d.id} | ${d.disposition} |`), `the README's disposition table holds ${d.id}`)
    for (const e of S.OPEN_DISCONNECTIONS) assert.ok(readme.includes(`| ${e.id} |`), `the README lists ${e.id}`)
    for (const h of [...SELECTOR_HUNKS, ...K2_SELECTOR_HUNKS]) assert.ok(readme.includes(`${SELECTOR_FILE}:${h.lines}`), `the README discloses ${SELECTOR_FILE}:${h.lines}`)
    // Stage W2: the package places too.
    for (const h of PACKAGE_HUNKS) assert.ok(readme.includes(`${h.file.split('/').slice(-1)[0]}:${h.lines}`), `the README discloses ${h.file}:${h.lines}`)
    // The README's counts are held to the runs (batch A2): the safeguard runs, the restatement's items, and the date of the reply about A02.
    // Batch A3: the lone runs the switch's removal would refuse (NF-02); the first stop and the DRAFT record standing in (RC3-N2); the TA02
    // stop's parallel as the report words it (NF-05). Batch A4, re-pinned openly: the DRAFT record stands in for the review pathway's K2
    // result, in place of a per-goal authorization record (was: in place of Christian's evaluation of A02's manipulations); the K2 gap is
    // said in the known limitations and is not an open disconnection.
    const firstStop = blockerSequence(S.stopsOf()).sequence[0]
    assert.equal(firstStop.id, 'L1', 'the first stop is the legacy route\'s (A02 has no authorization record)')
    for (const phrase of [
        `over ${S.runs.size} runs`,
        `The ${S.runs.size} runs,`,
        `the ${S.runs.size} safeguard runs`,
        `${a02Items.length} items, each quoting its approved row verbatim`,
        `'reply about A02, pasted 10 November 2026'`,
        `the lone Neutral Player runs of item 4 (${LONE_RUNS.join(', ')})`,
        // Stage W1 (b), re-pinned openly: were 'A02 has no authorization record, and that is the first stop', 'stands in for the review
        // pathway's K2 result, in place of a per-goal authorization record', 'is not among the open disconnections' and 'never by the
        // consumption (report item 5)'; the experiment path now takes K2's result and the DRAFT record stands in only on the comparison arm.
        'A02 has no authorization record; on the production route that is the first stop',
        'our DRAFT record stands in for the review pathway\'s K2 result, as before the stage',
        'reads K2_NOT_TAKEN, a detected disconnection',
        'by the consumption of the review pathway\'s K2 result (report item 5',
        'not a like-for-like parallel',
    ])
        assert.ok(readme.includes(phrase), `the README says ${phrase}`)
    // Batch A4: no text says the first stop is closed by an evaluation of A02's manipulations any longer.
    for (const [name, text] of [['README.md', readme], ['a02-report.txt', FIRST.report], ['a02-results.json', FIRST.json]]) assert.equal(text.indexOf('evaluation of A02\'s manipulations'), -1, `${name} no longer names an evaluation of A02's manipulations`)
    assert.equal(readme.split('received 10 November').length - 1, 0, 'the README gives the reply about A02 no received date')
    assert.ok(holdsGenderedPronoun(`as quoted in ${[...'sih'].reverse().join('')} reply`) && !holdsGenderedPronoun('whether the heron'), 'bite: the scan sees one, and not inside a word')
})

test('registered', () => {
    const registry = JSON.parse(fs.readFileSync(path.resolve(HERE, '..', '..', '..', 'scripts', 'unit-tests.json'), 'utf8')) as string[]
    for (const f of ['./src/system/design-reasoning/a02-evidence.unit.ts', './src/system/design-reasoning/a02-safeguards.unit.ts', './src/system/design-reasoning/a02.unit.ts']) assert.ok(registry.includes(f), f)
})

quiet(`a02 evidence (B4): ${passed} passed`)
