/**
 * **The isolated A02 foundational test, slice B4: the brief A02/TA02 reuse comparison and the evidence** (stage 9; DESIGN-9 sections 5 and 7;
 * Christian's reply about A02, pasted and filed 10 November 2026, sections 4 and 8). TEST-ONLY review evidence: nothing here is served,
 * written to production knowledge, or an authorization.
 *
 * The comparison (DESIGN-9 section 5, brief; no family analysis): TA02 runs through the same consumption as A02 (Steps 1 and 2 run by the
 * handoff and consumed by the chain's TEST-ONLY option), over our DRAFT restatement of RPC-003 and the DRAFT TA02 record, both read from the
 * TEST-ONLY draft store ta02-composition (as the handoff's A05 cases read it), each run labelled TA02's context pending: TA02-0 (the knowledge
 * as it stands) and TA02-D (every condition item withheld, the LAW-11 stand-in, as A02-D). One test measures, from both goals' own results,
 * which decisions are shared and which differ, whether the two built outputs collapse into one activity, and that the TA02 runs' Game Form
 * and constraints are consumed and their Game Problem carried, read by no decision (the safeguard check of a02-safeguards.unit.ts, run on them).
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
import path from 'node:path'

import { loadDraftStore } from '../derivation/draft-store'
import { experiment, inputs, items as a02Items, quotedSpans } from './a02.unit'
import * as S from './a02-safeguards.unit'
import { citedDateOf } from './assembly'
import { foundationalTestText } from './foundational-test'
import { CaseInput, ChainAnswer, ChainRequest, HandoffChain, HandoffResult, runHandoff, runHandoffCases, validateHandoffInputs } from './handoff'
import { holdsGenderedPronoun, realChain } from './handoff-chain.unit'
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
        what: 'the origin value and the control referent of RPC-003\'s approved scoring condition',
        rulingRefs: ['A02-10NOV-TREATMENTS'],
        where: 'our DRAFT restatement of RPC-003 declares the origin value NOT_AUTHORED and leaves the control referent UNDECLARED, so TA02-0 is refused on those two lines, as A02-0 is on RPC-002\'s; TA02-D withholds every condition item. Not like for like: TA02\'s progression and control items (RPC-003-11.a, RPC-003-12.a) restate the clause Christian wrote as an example on 13 September, which the pending 13 September correction is to restore as illustrative, and RPC-003-12.a makes its possession condition a required control clause, which Christian\'s first reply of 7 November, section 4, says not to do without an authoritative basis (quoted in item 6); the restatement is unchanged here',
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
                what: `our DRAFT restatement of RPC-003 (CANDIDATE: ours, unreviewed) and the DRAFT TA02 record (no ruling field filled, an empty set, our finding of 27 October) read from the TEST-ONLY draft store ${TA02_STORE}, as the handoff's A05 cases read it`,
                effect: 'the context\'s items enter derivation as DRAFT knowledge (ours, unreviewed: CANDIDATE); the record route governs the constraints with the DRAFT TA02 record\'s empty authorized set',
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
        c.label = `${id}: TA02 with the knowledge as it stands and our DRAFT (CANDIDATE) restatement of RPC-003 (Steps 1 and 2 consumed by the chain, as for A02; the DRAFT TA02 record with an empty set); TA02's context pending`
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
    const run = safeguardRunOf(b.result, b.answer, true, { authorizedSet: [], recordKind: 'TEST_ONLY_RECORD', standIns: [], scoring: TA02_SCORING, engineRule: null })
    return { run, findings: ownershipOf(run) }
}
const TA02_IDS = TA02_CASES.map((c) => c.id)
/** The open disconnections the TA02 runs carry: the same three the A02 runs carry, measured on these runs (a detected disconnection, never a pass). */
const TA02_DISCONNECTIONS: OpenDisconnection[] = ['OD-HINT-GAME-PROBLEM', 'OD-CONTEXT', 'OD-DISPLAY'].map((id) => {
    const e = S.OPEN_DISCONNECTIONS.find((x) => x.id === id)
    assert.ok(e, id)
    // An entry's measured pairs are measured again on these runs: the hint-governing reading equals Step 1's GP-015 on both by agreement.
    return { ...copy(e), runs: [...TA02_IDS], ...(e.pairs ? { pairs: TA02_IDS.map((run) => ({ run, verdict: 'AGREES_INDEPENDENTLY' as const })) } : {}) }
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
    row('the consumption (what the chain records it was handed)', handed(a), handed(t), 'the same TEST-ONLY option and the same record route, each goal\'s DRAFT record with an empty set')
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
        row(`the condition's ${clause} clause (our restatement's values)`, vals(a), vals(t), clause === 'origin' ? 'the value is declared NOT_AUTHORED in both restatements; neither origin has a carrier' : clause === 'control' ? 'the referent is UNDECLARED in both restatements; TA02\'s item (RPC-003-12.a) makes required the possession condition of a clause Christian wrote as an example (13 September), contrary to Christian\'s first reply of 7 November, section 4' : 'carried as open text and a value; not executed in either built game; TA02\'s item (RPC-003-11.a) restates the clause Christian wrote as an example (13 September), which the pending 13 September correction is to restore as illustrative')
    }
    const stop = (p: Pair) => `${p.zero.result.refusal?.stage}: ${(p.zero.result.refusalBasis?.cited ?? []).map((c) => c.ref).join(', ')} (${p.zero.result.refusalBasis?.verdict})`
    row('where the knowledge as it stands stops', stop(a), stop(t), 'the same stage and the same two kinds of line, the control clause\'s referent and the origin clause\'s value, each on its own context\'s restatement; not like for like: on TA02\'s side the control line is our item RPC-003-12.a, which makes the illustrative clause\'s possession condition a required one, contrary to Christian\'s first reply of 7 November, section 4 (quoted in item 6)')
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

/** A01, built by the production entry after the TA02 runs (beside the safeguard test's before and after). */
const A01_END = S.a01Hash()

// ---------------------------------------------------------------------------------------------------------------------------------------
// The constraint selector's TEST-ONLY hunks: disclosed first in the report and in the README, each held to the file's text by the test
// ---------------------------------------------------------------------------------------------------------------------------------------

const SELECTOR_FILE = 'generateSelection.ts'
const SELECTOR_PATH = path.join(HERE, '..', 'test-library', SELECTOR_FILE)
const SELECTOR_HUNKS: Array<{ lines: string; at: number; holds: string; what: string }> = [
    { lines: '700-702', at: 702, holds: 'quotaBypassOwnSize: number | null = null', what: 'the size rule\'s function takes the authorized set\'s own size, null unless the switch is on' },
    { lines: '715-718', at: 715, holds: 'if (quotaBypassOwnSize !== null) {', what: 'given that size, the size rule admits 1 up to it instead of 2 to 4 (the first of the two places the size rule lives)' },
    { lines: '784-785', at: 785, holds: 'constraintSizes: number[]', what: 'the enumeration takes the list of sizes it tries' },
    { lines: '798', at: 798, holds: 'constraintSizes } = ctx', what: 'the enumeration reads that list' },
    { lines: '835', at: 835, holds: 'for (const conSize of constraintSizes) {', what: 'the enumeration tries the listed sizes instead of the fixed 2, 3 and 4 (the second place)' },
    { lines: '885-895', at: 895, holds: 'quotaBypass = false', what: 'the selector takes the switch, off unless a caller passes it' },
    { lines: '1031-1037', at: 1033, holds: 'if (quotaBypass && !(recordBacked && constraintPool.constraintPrinciple !== null)) {', what: 'the switch is honoured only for an evaluated authorization record and throws for any other pool; under it the sizes tried are 2, 3, 4 and the set\'s own size' },
    { lines: '1061', at: 1061, holds: 'constraintSizes,', what: 'the sizes are handed to the enumeration' },
    { lines: '1083', at: 1083, holds: 'assertSelectionContract(bestLensCombo, bestConCombo, zeroConstraintCommitment, quotaBypassOwnSize)', what: 'the own size is handed to the size rule' },
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
    ...['A01', 'A02', 'TA02'].map((id) => ({ id, means: `the Learning Goal '${goalName(id)}' (the planning model)` })),
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
    { id: 'S4-', family: true, means: 'a run of item 4: manipulations entered only through the DRAFT record\'s authorized set (NP Neutral Player, WZA Wide Zone Advantage, TR Turnover Reward, CDC Central Density Condition, IR Interception Reward; /no-bypass: without the size-rule bypass; @A02-D: on the diagnostic base A02-D; ~reversed, ~neutral: under a reworded goal, as A02-2~)' },
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
    { id: 'FOUNDATION_CLAUSE', means: 'the selection check that a package holds a foundation constraint (with its keyword threshold)' },
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
    { id: 'detected disconnection', means: `a verdict printed as an open finding, never a pass and never a violation: ${DETECTED_VERDICTS.join(', ')}, or ENGINE_RULE_DECIDED attributed to a kept check` },
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
    return ownershipOf(safeguardRunOf(doctored, d.answer, true, { authorizedSet: [], recordKind: 'TEST_ONLY_RECORD', standIns: [], scoring: S.SCORING, engineRule: null }))
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
/** The lone runs item 4's floor rests on: the reworded runs' Neutral Player alone (OD-WORDING-FLIP's runs without Turnover Reward). */
const FLOOR_RUNS = (S.OPEN_DISCONNECTIONS.find((e) => e.id === 'OD-WORDING-FLIP')?.runs ?? []).map((id) => id.split('+TR').join(''))
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
 * Batch A4 (the lead's decision, from the delivery review): a gap found in review that the safeguards cannot detect, said in items 1 and 3
 * and in the README's known limitations. It is not an open disconnection: an entry there lists the safeguards' measured verdicts, and the
 * ownership table gives the constraints to the authorization record, so no verdict of theirs reads the review pathway's K2 result.
 */
const K2_NOT_TAKEN = 'Open, found in review, not detected by the safeguards: the checked pathway does not take the review pathway\'s proposal of no manipulation under K2 (item 5); the safeguards cannot see it because their ownership table gives the constraints to the authorization record (not an open disconnection: it has no measured verdict).'

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
    add(`- To bypass the numerical quota in the isolated experiment, the constraint selector's source file (${SELECTOR_FILE}) gained one TEST-ONLY parameter, a switch that is off unless a caller passes it, in ${SELECTOR_HUNKS.length} places (each held to the file's text by this report's test):`)
    for (const h of SELECTOR_HUNKS) add(`   ${SELECTOR_FILE}:${h.lines}: ${h.what}`)
    add(`- No route, controller or service passes it (a registered static test reads every non-test source file). With it off, the selector's behaviour is compared with main's by the behaviour snapshot, ${RECORD_WORDS.disclosure}.`)
    const npWza = S.at('S4-NP+WZA/no-bypass').result.chain
    const npWzaSame = json([npWza?.outcome, npWza?.stage, npWza?.reasons, S.at('S4-NP+WZA/no-bypass').run.chain?.constraints]) === json([S.at('S4-NP+WZA').result.chain?.outcome, S.at('S4-NP+WZA').result.chain?.stage, S.at('S4-NP+WZA').result.chain?.reasons, S.at('S4-NP+WZA').run.chain?.constraints])
    add(
        `- Question: is a TEST-ONLY parameter that no route passes within ${cite('A02-10NOV-SELECTOR', 0)}? It is removable: deleting the ${SELECTOR_HUNKS.length} places returns the file to main's text. Only the lone Neutral Player runs of item 4 (${LONE_RUNS.join(', ')}) would then change outcome, refused by the size rule as before (S4-NP/no-bypass: refused at ${S.at('S4-NP/no-bypass').result.chain?.stage})${FLOOR_RUNS.length && FLOOR_RUNS.every((id) => LONE_RUNS.indexOf(id) >= 0) ? `, and with ${FLOOR_RUNS.join(' and ')} the measurement behind item 4's floor for subsets would go` : ''}; the other lone sets would be refused by the size rule instead of by the kept checks; and a set of two lies inside 2 to 4, so it selects the same with or without the switch (read from the code, ${SELECTOR_FILE}:1037, and measured on Neutral Player with Wide Zone Advantage: without the switch it is ${npWzaSame ? `selected the same and refused at ${npWza?.stage}, as with it` : 'NOT the same'}).`,
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
        `Answer (OURS): on the isolated pathway, yes for the Game Form: the chain takes Step 2's form as its form, its scorer handed only that form. The Game Problem reaches the chain only through Step 2's form: Step 2 chooses the form from Step 1's Game Problem (with Step 1's primary swapped to ${gp2.result.receive.step1?.primary.join(', ')}, the chain takes ${gp2.result.consumption?.form?.formId} as its form). The chain also carries Step 1's Game Problem in its account, but no chain decision reads it (${S.verdictOf('A02-0', 'GAME_PROBLEM')}): its Game-Problem-dependent inputs (the lens hints and matched signals) still read the planning model (OD-HINT-GAME-PROBLEM; on ${gp2.id} they read ${gp2.run.chain?.gameProblemId} while the account carries ${gp2.result.consumption?.gameProblem?.gameProblemId}), and the context is read from the routing (open, below). The production route is unchanged and still picks A02's form from the wording.`,
    )
    add('Implemented and tested:')
    add('- A TEST-ONLY option of the checked chain hands it Step 1\'s resolved Game Problem and Step 2\'s SELECTED form: its candidate forms become the routed context\'s declared forms filtered to Step 2\'s form (never replaced by it), a form outside them is refused, and its constraints come only from the authorization record.')
    add(`- The ${A02_RUN_IDS.length} A02 runs (${A02_RUN_IDS.join(', ')}): Step 1 ${s1?.status} ${s1?.primary.join(', ')} at ${s1?.contextId} (${s1?.basis}); Step 2 ${s2?.status} ${s2?.selected} (compatible: ${s2?.compatible.join(', ')}); the chain took ${a0.consumption?.form?.formId} as its form, its scorer handed only ${a0.consumption?.formCandidatesScored.join(', ')}; the handoff placed nothing.`)
    add(
        `- On ${reachedChain.length} of the ${S.EXPERIMENT_RUNS.length} experiment runs (every one that reaches the chain): the Game Form reads CONSUMED (${verdictOn('GAME_FORM', 'CONSUMED')} runs), equal to Step 2's form, and the chain's own record shows its scorer was handed only it; the constraints read CONSUMED (${verdictOn('CONSTRAINTS', 'CONSUMED')} runs) against the authorized set of our TEST-ONLY DRAFT A02 record, or of a TEST-ONLY copy of it on the runs of item 4 (no ruling; the finding is ours), not against any decision of Step 1 or Step 2; Step 1's Game Problem is carried in the account and read by no chain decision: CARRIED_NOT_READ (${verdictOn('GAME_PROBLEM', 'CARRIED_NOT_READ')} runs, a detected disconnection). The one other run (Step 1's primary swapped to GP-001) is reconsidered by Step 2, which retains ${S.at('GP-001').result.receive.step2?.compatible.join(', ')} with no basis to select, and stops before the chain.`,
    )
    const legacyPicks = [...new Set(['GP-002/legacy', 'GF7-CELL/legacy'].map((id) => S.at(id).run.chain?.ownPick?.join(', ')))]
    const refusedAs = (id: string) => `refused at ${S.at(id).result.chain?.stage} (${(S.at(id).result.chain?.reasons ?? []).map(plain).join('; ')})`
    add(
        `- Dependency: with Step 1's primary swapped to GP-002 in a test copy of the knowledge (TEST ASSUMPTION), Step 2 selects ${S.at('GP-002').result.receive.step2?.selected} and the chain takes ${S.at('GP-002').result.consumption?.form?.formId} as its form, carrying ${S.at('GP-002').result.consumption?.gameProblem?.gameProblemId}, and is ${refusedAs('GP-002')}; with GF2's GP-015 cell moved to GF7 there, Step 2 selects ${S.at('GF7-CELL').result.receive.step2?.selected} and the chain takes ${S.at('GF7-CELL').result.consumption?.form?.formId} as its form and is ${refusedAs('GF7-CELL')}. The legacy route on the same two inputs stays on ${legacyPicks.join(' and ')}${legacyPicks.length === 1 ? ' in both' : ''}, its pick from the wording, and is ${[...new Set(['GP-002/legacy', 'GF7-CELL/legacy'].map(refusedAs))].join(' or ')}.`,
    )
    add(`- Wording: with the goal's wording rewritten twice (in the knowledge copy and in the row the chain reads; restored, the restore asserted), Steps 1 and 2 and the consumed form do not move (${json(S.at('A02-0~reversed').result.receive) === json(a0.receive) && json(S.at('A02-0~neutral').result.receive) === json(a0.receive) ? 'identical' : 'CHANGED'}), while the chain's own route moves from ${S.at('L2').run.chain?.ownPick?.join(', ')} to ${S.at('L2~reversed').run.chain?.ownPick?.join(', ')}, which proves the rewrite reached the chain.`)
    add('Open (detected and listed as open disconnections, never passes):')
    for (const id of ['OD-HINT-GAME-PROBLEM', 'OD-CONTEXT', 'OD-A02-LEGACY-FORM']) add(`- ${id}: ${plain(entry(id).what)}`)
    add('- the engine lenses still follow the wording, and on one two-manipulation set the wording decides the selection (item 3).')
    add(K2_NOT_TAKEN)
    add('Proposals (OURS, for Christian\'s decision): whether the Game Problem reading that governs the engine\'s lens hints should also be taken from Step 1; it lives in the guided selection module, which this experiment leaves untouched by design.')
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
    add(`- Dependency verification: a changed Game Problem and a moved cell are reconsidered by Step 2, whose form the chain consumes (item 1); the planning model's hint-governing reading stays GP-015 when Step 1 says GP-002 (${S.verdictOf('GP-002', 'GAME_PROBLEM_HINTS')}, listed), and the GP-002 the chain carries is read by no chain decision (${S.verdictOf('GP-002', 'GAME_PROBLEM')}).`)
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
        'W-DROPS-UPSTREAM': 'the wrapper that drops the handed decisions',
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
    add('Assumptions (OURS): the verdicts, the ownership table and the attribution of each refusal to a check.')
    add('Ecological suitability: not addressed by the safeguards.')
    add('')

    add('4. ZERO, ONE OR MORE MANIPULATIONS WITHOUT THE QUOTA')
    add(`Christian asked: ${cite('A02-10NOV-REPORT', 3)}`)
    const flipRuns = S.OPEN_DISCONNECTIONS.find((e) => e.id === 'OD-WORDING-FLIP')?.runs ?? []
    add(
        `Answer (OURS): zero and one manipulation can be represented without the quota interfering where the record authorizes exactly that many. Where it authorizes two and only one of them passes the kept checks, the floor of 2 that remains for subsets stops the run (${flipRuns.join(', ')}). No manipulation is justified for A02 in anything we hold, so what is shown is the representation, not a justified configuration.`,
    )
    add('Implemented and tested:')
    add(`- Zero: the ${A02_RUN_IDS.length} A02 runs commit the DRAFT record's empty set (constraints ${[...new Set(A02_RUN_IDS.map((id) => S.verdictOf(id, 'CONSTRAINTS')))].join(', ')}, none built): representable, not shown to be justified; the record's finding is ours: no manipulation has an authorized relationship to RPC-002 and GP-015 in held knowledge.`)
    const sameAsA02 = json(S.at('S4-NP').result.chain?.reasons) === json(a0.chain?.reasons) ? `, on the same lines as ${A02_RUN_IDS[0]}` : ''
    add(`- One: a lone Neutral Player in the DRAFT record's set (a TEST-ONLY relationship stand-in, TEST ASSUMPTION) is selected with the TEST-ONLY size-rule bypass (S4-NP: selected, then refused at ${S.at('S4-NP').result.chain?.stage}${sameAsA02}) and refused without it (S4-NP/no-bypass: refused at ${S.at('S4-NP/no-bypass').result.chain?.stage}, attributed to the size rule): the quota interfered, and the bypass removed only it.`)
    add(`- One, refused by kept checks: a lone Wide Zone Advantage or Turnover Reward is first refused by the foundation clause; Central Density Condition, alone and with Interception Reward, first by the package relationship check (row o); each attributed by re-running the selector's own exported package check on GF2 and each lens combination, which returns the first reason it meets (${S.QUOTA_REFUSED.map((id) => `${id} ${S.at(id).run.engineRule?.rule}`).join(', ')}).`)
    add(`- Two: Neutral Player with Wide Zone Advantage is selected whole, then refused at ${S.at('S4-NP+WZA').result.chain?.stage}, and without the switch it selects the same (S4-NP+WZA/no-bypass); with Turnover Reward it is selected, then refused at ${S.at('S4-NP+TR').result.chain?.stage} (Turnover Reward has no contribution contract).`)
    add(
        `- The floor that remains: under the bypass the sizes tried are the set's own size and 2 to 4 (${SELECTOR_FILE}:1037), so a one-manipulation subset of a set of 2 to 4 is never tried. Under the reworded wordings Neutral Player with Turnover Reward is refused at selection (row k on every lens combination), although a lone Neutral Player passes the package check on every one of those lens combinations and is selected as ${flipRuns.map((id) => id.split('+TR').join('')).join(' and ')} (measured).`,
    )
    add(`- Every line a manipulation brings rests on its stand-in, class 4 (TEST ASSUMPTION) at best: ${standInLines('S4-NP@A02-D').length} lines for Neutral Player alone, ${standInLines('S4-NP+WZA@A02-D').length} with Wide Zone Advantage (on the diagnostic base, where a game is built).`)
    add(`- Of the ${DISPOSITION.length} selection checks only the numerical size rule is bypassed; every other check runs and enforces wherever its path is reached. On the empty-set runs the role mix, the package checks and the size rule are not run at all: the zero branch commits the empty set first, and its authority is ${plain(disposition('ZERO_BRANCH').authority)}.`)
    for (const id of ['ROLE_MIX', 'FOUNDATION_CLAUSE']) {
        const d = disposition(id)
        add(`- Reported with source and authority, as Christian asked: ${plain(d.check)}: source ${d.where}; origin ${plain(d.origin)}; authority ${plain(d.authority)}; kept and enforced, not treated as canonical.`)
    }
    add('- The role mix refuses no set run here (read from the code, not observed: a set of 1 or 2 is enumerated only whole, and its needs are read over the pool: generateSelection.ts:827, :835-836, :590-612).')
    add('Open: the wording decides one two-manipulation selection (item 3); the floor of 2 for subsets decides it together with row k (above).')
    add('Proposals (OURS, for Christian\'s decision): whether the TEST-ONLY switch in the constraint selector may stay (the disclosure above); it is removable. Whether a one-manipulation subset of an authorized set of 2 to 4 may be tried, put together with the commit rule\'s open question (commit the whole authorized set, or choose among it); the selector is not changed before that answer.')
    add('Assumptions (OURS): every manipulation here is a TEST-ONLY stand-in, never knowledge.')
    add('Ecological suitability: not established: selected means only that the kept checks did not refuse it.')
    add('')

    add('5. THE EARLIEST CONSEQUENTIAL BLOCKER')
    add(`Christian asked: ${cite('A02-10NOV-REPORT', 4)}`)
    const first = seq.sequence[0]
    add(
        `Answer (OURS): in reasoning order, the first blocker is that the checked pathway accepts manipulations only on a per-goal authorization record's authority (the live route hands it only goals with a record), which A02 lacks, and does not take the review pathway's K2 result (${cats(first.categories)}; the category ours): for every A02 run the review pathway proposes no manipulation (appendix D, 5. Manipulations) under K2, ${cite('HO-07NOV-K2', 1)}; Christian's E5 also bears on this stop, ${cite('A02-03NOV-DESIGN-AUTHORIZATION', 0)}; neither standing ruling is read here as deciding it (the request below). The experiment passes this stop only with our TEST-ONLY DRAFT record standing in for the review pathway's result (an empty set; the finding ours; no ruling). Past it, the earliest consequential blocker is the origin clause of High Press Escape's approved scoring condition (the sequence begins under established coordinated pressure): ${cats(seq.earliest.categories)}. A02-0's single refusal cites the origin clause's value and the control clause's referent together; placing the origin clause first is ours (an assumption, below).`,
    )
    add('Implemented and tested (computed from the runs, in chain order):')
    for (const s of seq.sequence) add(`- ${plain(s.path)}: ${s.stage}: ${plain(s.reason)} [${cats(s.categories)}] ${s.passed ? `(passed by ${s.passedBy})` : '(remains)'}`)
    add(`- The first stop: ${plain(first.why)}.`)
    add(`- Every experiment path past the first stop, and the zero-manipulation base of every A02 run, stands on our TEST-ONLY DRAFT A02 record (an empty set, or on item 4's runs a TEST-ONLY copy holding the stand-in manipulations; the finding ours, no ruling) in place of a per-goal authorization record, which A02 lacks; its empty set stands in for the review pathway's K2 result, which the checked pathway does not take.`)
    add(`- Earliest remaining: ${plain(seq.earliest.path)}: ${plain(seq.earliest.why)}.`)
    add('- Downstream, recorded and not investigated:')
    for (const s of seq.downstream) add(`   ${plain(s.path)}: ${s.stage} [${cats(s.categories)}]`)
    add(`The categories are Christian's: ${cite('A02-10NOV-FAILURE-SOURCES', 0)} ${S.CATEGORIES.slice(1).map((w) => quoted(w)).join(' ')}`)
    add('Proposals: none. The requests: for the first blocker, Christian\'s decision whether, in the isolated experiment, the checked pathway may take the review pathway\'s K2 result (no manipulation proposed) in place of a per-goal authorization record; whether A02 needs any manipulation to represent High Press Escape stays open (item 2, questions 1 and 5). For the blocker past it, question 1 of item 2. Each is a request, not a proposal of knowledge.')
    add('Assumptions (OURS): the assignment of each stop to Christian\'s categories (the first blocker\'s included); the order of the questions; placing the origin clause before the control clause\'s referent, which A02-0\'s single refusal cites together.')
    add('Ecological suitability: not addressed: the first blocker is a question of decision authority, and the earliest consequential blocker a gap of knowledge and of a carrier; both are met before any activity is built.')
    add('')

    add('6. REUSE BETWEEN A02 AND TA02 (brief)')
    add(`Christian asked: ${cite('A02-10NOV-REPORT', 5)}`)
    const shared = COMPARISON.rows.filter((r) => r.kind === 'SHARED')
    const differs = COMPARISON.rows.filter((r) => r.kind === 'DIFFERS')
    add(`Answer (OURS): ${REUSE_FINDING}`)
    add(`Implemented and tested: TA02 run through the same consumption (TA02-0, the knowledge as it stands; TA02-D, the diagnostic), over our DRAFT restatement of RPC-003 and the DRAFT TA02 record (TEST-ONLY draft store): ${[['its Game Problem', 'GAME_PROBLEM', 'reads'], ['its Game Form', 'GAME_FORM', 'reads'], ['its constraints', 'CONSTRAINTS', 'read']].map(([what, row, verb]) => `${what} ${verb} ${[...new Set(TA02_IDS.flatMap((id) => verdictsOf(ta02Safeguard(id).findings, row)))].join(', ')}`).join(', ')}. Measured from both goals' results (appendix C):`)
    add(`- shared (${shared.length}): ${shared.map((r) => r.aspect).join('; ')}.`)
    add(`- differing (${differs.length}): ${differs.map((r) => r.aspect).join('; ')}.`)
    for (const r of differs.filter((x) => x.aspect === 'the context' || x.aspect.indexOf('the condition\'s') === 0)) add(`   ${r.aspect}: A02 ${plain(r.a02)} | TA02 ${plain(r.ta02)}`)
    add(`- the two diagnostic builds: ${COMPARISON.sentencesIdentical ? 'identical coach text' : 'different coach text'}, and configuration lines identical but ${COMPARISON.differingLines.length} (${COMPARISON.differingLines.map((l) => l.split(': ')[0]).join(', ')}: the same transition value, from a different source).`)
    add(`Open: TA02's context is pending. ${cite('TA02-27OCT-CONTEXT', 0)} ${cite('TA02-28OCT-DEFERRED', 0)} The TA02 runs measure the reuse on the planning model's routing as it stands; neither is a TA02 configuration.`)
    add(
        `Open: the 13 September correction of Attack Development's approved scoring condition (RPC-PROP-134, restoring the words that make its final clause an example) is outside this experiment and not applied. Christian asked for its verification against the original 13 September email, ${cite('HO-07NOV-SCORING-ROW', 0)}; that verification is now done, against that email as Joe pasted it on 13 and 14 September (two identical copies): the original holds the words that make the final clause an example, so the colon in our RC1.1 workbook is our transcription; the offline correction follows under the earlier authorization, outside this experiment; nothing here changes the offline record, the canonical workbook or the live application, and the TA02 runs read RPC-PROP-134 as the program holds it, without the restored words.`,
    )
    add(`Proposals: none; no new structure is proposed (${cite('A02-10NOV-REUSE', 5)}).`)
    add('Assumptions (OURS): our restatement of RPC-003 (DRAFT, 27 October, unreviewed; its control item stands against Christian\'s first reply of 7 November, section 4, as said above); the same illustrative session for both goals, so that they differ only in their knowledge.')
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
    add('Open: three bundled files differ from main by TEST-ONLY additions no route passes (the selector\'s are disclosed first, above); isolation rests on the branch staying unmerged and undeployed.')
    add('Proposals: none.')
    add('Assumptions (OURS): none beyond the TEST-ONLY option itself, which no route passes.')
    add('Ecological suitability: not addressed: an unchanged application is an engineering claim.')
    add('')
    return out
}

const REUSE_FINDING = [
    `Measured, the Game Problem and Game Form reasoning is shared without any new structure: both goals resolve to GP-015 through their own approved translation rows, and Step 2 selects GF2 through GF2's same GP-015 cell (graded CANDIDATE in both), each over its own context's declared-form rows; the same TEST-ONLY consumption carries both results to the chain. On the affordance side only the CAR profile Step 1 consults is shared, and it determines nothing downstream; the engine lenses, scored from each goal's wording, differ, and each context's affordance targets stay deferred.`,
    `What would set the two contexts apart lives in each context's own rows (its identity, its opposition and its scoring condition), which the chain applies after the shared reasoning, through each context's restatement: the existing architecture already has that place.`,
    `It does not execute yet: as the knowledge stands both goals stop at structure on the same two kinds of line of their own restatements, but not like for like: on TA02's side the control line is our item RPC-003-12.a, which makes the possession condition of a clause Christian wrote as an example a required one, contrary to Christian's first reply of 7 November, section 4: ${cite('HO-07NOV-SCORING-ROW', 4)}.`,
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
        a01: { before: S.A01_BEFORE, afterSafeguards: S.A01_AFTER, afterTa02: A01_END },
        comparison: COMPARISON,
        reuseFinding: REUSE_FINDING,
        ta02Safeguards: TA02_IDS.map((id) => ({ id, ...ta02Safeguard(id) })),
        openDisconnections: S.OPEN_DISCONNECTIONS,
        ta02OpenDisconnections: TA02_DISCONNECTIONS,
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

test(`S5. reuse, brief: TA02 through the same consumption over our DRAFT restatement of RPC-003 (TA02's context pending); one comparison measured from both goals' results, the shared decisions (Step 1's GP-015, the CAR profile, Step 2's GF2 and its cell grade, the consumption, the events) against the differing ones (the context, the scoring condition and its clauses, where each stops, opposition, the lenses, the targets); the two diagnostic builds collapse into one activity; the TA02 runs' Game Form and constraints consumed and their Game Problem carried and read by no decision, their detected disconnections listed`, () => {
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
        assert.deepEqual([r.consumption?.selectionObservedOnly, r.consumption?.formCandidatesScored, r.consumption?.constraintAuthority, r.consumption?.constraintCandidateIds], [true, ['GF2'], 'AUTHORIZATION_RECORD', []], id)
        // The same safeguard check as the A02 runs: the owned decisions consumed; every detected disconnection listed; none stale.
        const { findings } = ta02Safeguard(id)
        assert.deepEqual(['GAME_PROBLEM', 'GAME_FORM', 'CONSTRAINTS'].map((row) => verdictsOf(findings, row).join(',')), ['CARRIED_NOT_READ', 'CONSUMED', 'CONSUMED'], id)
        assert.deepEqual(unlisted(findings, TA02_DISCONNECTIONS, ['EXPERIMENT']).map(ownershipMessage), [], id)
        // Never a TA02 configuration: each run carries the context-pending note.
        assert.ok(r.reportNotes.some((n) => n.text.indexOf('TA02\'s context pending') === 0), id)
    }
    assert.deepEqual(stale(TA02_IDS.flatMap((id) => ta02Safeguard(id).findings), TA02_DISCONNECTIONS), [], 'no TA02 entry names a run where it is not detected')
    assert.ok(unlisted(ta02Safeguard('TA02-0').findings, [], ['EXPERIMENT']).length > 0, 'bite: without the entries, the detected disconnections are unlisted')
    // TA02-0: refused at structure on its own restatement's control referent and origin value, RESTATEMENT-ONLY, as A02-0 is on RPC-002's.
    const t0 = ta02At('TA02-0').result
    assert.deepEqual([t0.chain?.outcome, t0.chain?.stage, t0.refusalBasis?.verdict, t0.refusalBasis?.cited.map((c) => c.ref)], ['refused', 'structure', 'RESTATEMENT-ONLY', ['c:restated:RPC-003:RPC-003-12.a::V5', 'c:restated:RPC-003:RPC-003-10.a::V6']])
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
    for (const h of SELECTOR_HUNKS) {
        assert.ok(source[h.at - 1].includes(h.holds), `${SELECTOR_FILE}:${h.at} holds ${h.holds}`)
        assert.ok(lines.includes(`   ${SELECTOR_FILE}:${h.lines}: ${h.what}`), h.lines)
    }
    // Every line of the selector naming the switch, the own size or the sizes list lies inside a disclosed place (measured: none outside).
    const inside = (n: number) =>
        SELECTOR_HUNKS.some((h) => {
            const [from, to] = h.lines.split('-').map(Number)
            return n >= from && n <= (to ?? from)
        })
    const naming = source.map((l, n) => ({ n: n + 1, l })).filter((x) => x.l.indexOf('quotaBypass') >= 0 || x.l.indexOf('constraintSizes') >= 0)
    assert.ok(naming.length > 0)
    assert.deepEqual(naming.filter((x) => !inside(x.n)).map((x) => x.n), [], 'a line naming the switch outside the disclosed places')
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
    // NF-02: the runs the switch's removal would refuse are the lone Neutral Player runs, each committing S4-NP's set (measured), and they hold
    // item 4's floor measurement.
    assert.deepEqual(LONE_RUNS, ['S4-NP', 'S4-NP@A02-D', 'S4-NP~reversed', 'S4-NP~neutral'])
    for (const id of LONE_RUNS) assert.deepEqual(S.at(id).run.chain?.constraints, S.at('S4-NP').run.chain?.constraints, id)
    assert.deepEqual(FLOOR_RUNS, ['S4-NP~reversed', 'S4-NP~neutral'])
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
    for (const h of SELECTOR_HUNKS) assert.ok(readme.includes(`${SELECTOR_FILE}:${h.lines}`), `the README discloses ${SELECTOR_FILE}:${h.lines}`)
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
        'A02 has no authorization record, and that is the first stop',
        'stands in for the review pathway\'s K2 result, in place of a per-goal authorization record',
        'is not among the open disconnections',
        'never by the consumption (report item 5)',
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
