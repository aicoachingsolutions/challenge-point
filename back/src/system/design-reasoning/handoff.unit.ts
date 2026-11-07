/**
 * **The isolated handoff, wired to the real checked chain and tested** — Christian's reply received 7 November 2026, section 1 ("I authorize the
 * bounded implementation and testing of your proposed handoff between the existing review pathway and the checked configuration/rendering
 * machinery.") and section 11 ("First — The pathways connect correctly.").
 *
 * This file is the one place the review pathway's handoff (`handoff.ts`, a stage file that imports nothing of the chain) meets the checked
 * chain: it implements `HandoffChain` over `buildActivityUnderAuthorizationRecords` (the TEST-ONLY entry), the TEST-ONLY draft store, the
 * realization gate (`loadProvisionalRealizations`, run on a copy before any build) and the review-only wording of decision 1. Every
 * alteration is made on a copy by the entry's own TEST-ONLY options; nothing is written to any production file.
 *
 * What is pinned:
 *   - First, the pathways connect: the three A05 runs go end to end through Steps 1 and 2 and the chain, and the record the assembly
 *     experiment hand-authored (`assembly-experiment.review.json`) is never read: its loaded value is made to throw on any read while the
 *     runs repeat, and every file read is watched; the results are identical. A01 through the handoff, with its production records and
 *     realizations, gives exactly `buildActivity`'s 29 instructions, text and from-paths.
 *   - Each case's outcome (A05-0 and A05-1 at structure, A05-2 served as a conditional diagnostic only, A01 served, the two structural cases
 *     served, TA01 at knowledge).
 *   - Provenance: the grading map per kind; no line graded APPROVED from a restatement of ours; an ILLUSTRATIVE premise never above class 5;
 *     a TEST-ONLY stand-in never above its declared label; the illustrative depth's label on every sentence citing the zone's depth; the
 *     purpose's source and approval evidence printed apart; the grading tables checked against the specification, the contracts and the
 *     choices files; a malformed TEST-ONLY realization refused by the gate before any build.
 *   - Every configuration carries the line that productive, recurring opportunities are not established.
 *   - Since S3b, Tests A, B and C (DESIGN 3.6) as variants: a case copied, changed in one stated respect, held to the same input validator,
 *     run by the same mechanism and chain, and compared with its base (exactly which sentences, quantities, lines, diagram dimensions,
 *     classes and labels change, and which stay identical); the time-boxed restart on A05-1 as well as A05-2 (DESIGN 3.5); and what each
 *     refusal rests on (Christian's second reply of 7 November, section 2). Every listed test is printed in the report's Tests section with
 *     what it shows, what was measured and its verdict, kept apart from ecological suitability, which no test here establishes.
 *   - The evidence (`docs/audits/design-reasoning-handoff/evidence/handoff-report.txt`, `handoff-results.json`) equals what this file
 *     generates, generated twice and identical; rewritten only under `UPDATE_HANDOFF_EVIDENCE=1` (the precedent of `sport-coupling.unit.ts`).
 *   - The stage files import nothing of the chain and name none of the assembly record's readers.
 *   - Since the review of 7 November: the chain's own account behind a refusal met before any game exists (`refusalDetailOf`: the derivation
 *     run again on the very input the build derived from, held to reproduce the build's refusal) feeds the refusal reading; the R1 restart
 *     items are graded by Christian's own label for the restart; the record route's selection refusal and the R1 diagnostic are listed with the
 *     other refusals; the harness's hold on a REPORT check is shown refusing (E3, on labelled TEST-ONLY stand-in classifications); the inputs
 *     validator's new refusals bite (E1); the import allowlist reads both quotation marks (E2); the diagram is compared over its whole projection.
 *
 * Run: node node_modules/ts-node/dist/bin.js --files -r tsconfig-paths/register ./src/system/design-reasoning/handoff.unit.ts
 * Rewrite the evidence: UPDATE_HANDOFF_EVIDENCE=1 (same command).
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { loadCorpusContracts, loadProvisionalRealizations } from '../derivation/corpus'
import { LawsMateriality } from '../derivation/default-laws'
import { loadDraftStore, loadLawsMateriality } from '../derivation/draft-store'
import { isStampedHalt } from '../derivation/emit'
import { runDerivation, runStages0to10 } from '../derivation/engine'
import { knowledgeKey } from '../derivation/knowledge-key'
import { applyRealizationDeferrals, applyRoleYields } from '../derivation/realization-deferral'
import { indexRegister } from '../derivation/register'
import { assembleResolvedGame } from '../derivation/resolved-game'
import { CONTEXT_ROLE, derivationInputFor, DraftStoreContents } from '../derivation/run-bounded-selection'
import { LoadedContract } from '../derivation/types'
import { SuppliedRealization } from '../realization/supplied-realization'
import { buildActivity, buildActivityUnderAuthorizationRecords, RefusedActivity, ServedActivity } from '../rendering/build-activity'
import { reviewDraftOf } from '../rendering/review-draft'
import { withReviewStructureWording } from '../rendering/review-structure-wording'
import { specializedRoleNames } from '../rendering/session-envelope'
import { contextRelationships, learningGoalAuthorizations } from '../test-library/learning-goal-authorizations'
import { classLabel, VALUE_LABELS } from './assembly'
import { displayCell } from './assembly-display'
import {
    CaseInput,
    ChainAnswer,
    ChainLine,
    ChainRequest,
    compareResults,
    GRADING_MAP,
    HandoffChain,
    HandoffComparison,
    HandoffInputs,
    HandoffResult,
    HandoffTestRecord,
    inputCounts,
    OPPORTUNITIES_NOT_ESTABLISHED,
    PREMISE_KINDS,
    RefusalEntry,
    refusalBasisOfBuild,
    runHandoff,
    runHandoffCases,
    validateHandoffInputs,
} from './handoff'
import { comparisonLines, handoffReportText } from './handoff-report'
import { committedKnowledge, sourceStanding } from './knowledge'

const quiet = console.log
console.log = (...args: unknown[]) => {
    if (typeof args[0] === 'string' && args[0].startsWith('[selection-search]')) return
    quiet(...args)
}
let passed = 0
/**
 * Every listed test, in run order, as the report's Tests section prints it (Christian's reply of 7 November, section 13: implemented, passing
 * engineering tests and ecological suitability kept apart). A test is listed where it is given its id, group, citation and what it shows; the
 * evidence check and the registration check are not listed (they run while, or after, the report is generated).
 */
const reported: HandoffTestRecord[] = []
interface TestMeta {
    id: string
    group: string
    cites: string
    shows: string
}
function test(name: string, run: () => string[] | void, given?: TestMeta): void {
    const meta = given ?? LISTED[name]
    const record: HandoffTestRecord | null = meta ? { ...meta, title: name, measured: [], verdict: 'failing: see the unit test output' } : null
    if (record) reported.push(record)
    try {
        const measured = run()
        if (record) {
            record.measured = Array.isArray(measured) ? measured : []
            record.verdict = 'passing engineering test'
        }
        passed++
        quiet(`  ok  ${meta ? `${meta.id} ` : ''}${name}`)
    } catch (error) {
        quiet(`  FAIL ${meta ? `${meta.id} ` : ''}${name}: ${(error as Error).stack ?? (error as Error).message}`)
        process.exitCode = 1
    }
}
const FIRST = 'First: the pathways connect (Christian\'s first reply of 7 November, section 11)'
const SECOND = 'Second: valid changes are reusable (Test A, section 11)'
const THIRD = 'Third: unsupported selections remain unsupported (Test B, section 11)'
const FOURTH = 'Fourth: the mechanism is structurally reusable (Test C, section 11)'
const RESTART = 'The coach-served end-line restart (the time-boxed attempt; Christian\'s first reply of 7 November, section 7)'
const PROVENANCE = 'Provenance handling (section 13)'
const CHECKS = 'Engineering checks of the handoff itself'
/** The listing of the tests written before the Tests section existed (S3a), by their exact names; their bodies are unchanged. */
const LISTED: Record<string, TestMeta> = {
    'First: the A05 runs go end to end through Steps 1 and 2 and the chain with the hand-authored record never read': { id: 'F1', group: FIRST, cites: 'N7:150-151', shows: 'the A05 cases are received, resolved by Steps 1 and 2, and run through the checked chain; the hand-authored A05 record is unreadable while they run and the results are identical' },
    'First: A01 through the handoff, with its production records and realizations, gives buildActivity\'s 29 instructions, text and from-paths': { id: 'F2', group: FIRST, cites: 'N7:150-151', shows: 'the same mechanism carries A01 to exactly the checked game a coach is served' },
    'A05-0, the knowledge as it stands: refused at structure on the drafted origin and control lines': { id: 'F3', group: FIRST, cites: 'N7:155-157, N7:163-166', shows: 'with the knowledge as it stands, the chain refuses A05 at structure and the refusal names the drafted lines; nothing is filled in to make it generate' },
    'A05-1, the starting-condition reading as a TEST-ONLY treatment: refused at structure on the drafted control line alone (measured; our plan expected a refusal at communication)': { id: 'F4', group: FIRST, cites: 'N7:33-37', shows: 'the provisional state reading, carried only as a labelled TEST-ONLY withholding of the origin items, leaves the drafted control line refused at structure' },
    'A05-2, CONDITIONAL and never A05\'s result: served, with the no-offside sentence, the review-only zone sentence and the kick-off reported': { id: 'F5', group: FIRST, cites: 'N7:41-46', shows: 'what the handoff produces once the 13 September wording is verified and corrected offline: a conditional diagnostic, never A05\'s result' },
    'the structural cases (no Learning Goal) are served through the same mechanism; TA01 stops at knowledge with Step 2\'s form': { id: 'F6', group: FIRST, cites: 'N7:150-151, N7:158-161', shows: 'the same mechanism serves the two structural cases and stops TA01 at knowledge with the form Step 2 selected' },
    'the grading map, pinned per kind': { id: 'P1', group: PROVENANCE, cites: 'N7:15, N7:133-134', shows: 'every kind of determining premise has one fixed grading (OURS, for Christian\'s review)' },
    'no line is graded APPROVED from a restatement of ours; ILLUSTRATIVE never above class 5; a stand-in never above its declared label': { id: 'P2', group: PROVENANCE, cites: 'N7:25, N7:157', shows: 'no restatement of ours is graded above class 3, no illustrative value above class 5 and no stand-in above its label, in every case' },
    'the illustrative depth: the stand-ins determine exactly the two zones\' along lines, and every sentence citing them carries the ILLUSTRATIVE label': { id: 'P3', group: PROVENANCE, cites: 'N7:157', shows: 'an illustrative value carried as a stand-in item is labelled ILLUSTRATIVE on every sentence that says it' },
    'the no-offside sentence rests on Christian\'s provisional ruling (class 3), and the session lines are ILLUSTRATIVE (A05) or coach input within a ruled bound (A01)': { id: 'P4', group: PROVENANCE, cites: 'N7:135-136', shows: 'a sentence resting on a provisional ruling is graded by it; session inputs are graded as illustrative or as coach input within a ruled bound' },
    'the purpose\'s source evidence and approval evidence are printed apart, and the approval evidence claims no dated approval': { id: 'P5', group: PROVENANCE, cites: 'N7:137-138', shows: 'the purpose\'s source and its approval evidence are kept apart; an Active status is not offered as a dated approval' },
    'every configuration carries the line that productive, recurring opportunities are not established': { id: 'P6', group: PROVENANCE, cites: 'N7:163-175', shows: 'the critical knowledge gap is printed on every configuration' },
    'the grading tables are checked against their sources: the specification\'s standing decisions, the contracts, the choices files': { id: 'P7', group: PROVENANCE, cites: 'N7:133-134', shows: 'the grading tables are data checked against the specification, the contracts and the choices files' },
    'a malformed TEST-ONLY realization is refused by the realization gate before any build': { id: 'P8', group: PROVENANCE, cites: 'N7:12', shows: 'a TEST-ONLY realization passes the same gate as a production one before any build' },
    'the time-boxed attempt: the coach-served end-line restart in Christian\'s words does not compose; where it stops, pinned': { id: 'R1', group: RESTART, cites: 'N7:96-98, N7:101', shows: 'the restart Christian asked for, typed as TEST-ONLY realization items in Christian\'s words on A05-1 and A05-2: where the checked chain stops, and what a diagnostic TEST ASSUMPTION would meet next' },
    'the inputs are validated by hand: each defect refuses the file': { id: 'E1', group: CHECKS, cites: 'N7:15', shows: 'a malformed handoff input is refused, naming the defect' },
    'the stage files import nothing of the chain and name none of the assembly record\'s readers': { id: 'E2', group: CHECKS, cites: 'N7:11-12', shows: 'the handoff\'s stage files stay isolated from the chain and from the hand-authored record' },
}
quiet('the isolated handoff (Christian\'s reply received 7 November 2026)')

const HERE = __dirname
const WT = path.resolve(HERE, '..', '..', '..', '..')
const AUDITS = path.join(WT, 'docs', 'audits')
const EVIDENCE = path.join(AUDITS, 'design-reasoning-handoff', 'evidence')
const INPUTS_FILE = path.join(HERE, 'handoff-inputs.review.json')
const REC_FILE = path.join(HERE, 'assembly-experiment.review.json')
const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const readJson = (file: string): any => JSON.parse(fs.readFileSync(file, 'utf8'))

const inputs: HandoffInputs = validateHandoffInputs(readJson(INPUTS_FILE))
const productionRecords = learningGoalAuthorizations()
const productionRealizationsFile = readJson(path.join(AUDITS, 'conformance', 'stage-b', 'provisional-realizations.json'))
const lawsMateriality = loadLawsMateriality()

// ---------------------------------------------------------------------------------------------------------------------------------------
// The chain, wired (TEST-ONLY): HandoffChain over buildActivityUnderAuthorizationRecords
// ---------------------------------------------------------------------------------------------------------------------------------------

/** The TEST-ONLY realization as the realization file would hold it: Christian's words only, no item, no choices file. */
function realizationEntry(r: NonNullable<ChainRequest['realization']>): Record<string, unknown> {
    return {
        id: r.id,
        contractId: `provisional:${r.id}`,
        category: 'PROVISIONAL_REALIZATION_CHOICE',
        realizes: r.realizes,
        ruledOn: r.ruledOn,
        by: r.by,
        citedAs: r.citedAs,
        words: [...r.words],
        realizationChoices: null,
        defaultLawsCheck: { mode: r.lawsCheck.mode, because: r.lawsCheck.because, basis: { words: [...r.lawsCheck.words], citedAs: r.lawsCheck.citedAs } },
        departsFrom: r.departures.map((d) => ({ law: d.law, because: d.because, basis: { words: [...d.words], citedAs: d.citedAs }, extent: d.extent })),
        notWithPracticeSituations: [],
        items: [],
        declarations: [],
        relationshipRules: [],
    }
}

/** The realization gate, run on a copy of the production file with the TEST-ONLY realization added (R7 W3: the gate is the caller's duty). */
const gatedRealizations = (entry: Record<string, unknown>) => loadProvisionalRealizations({ ...copy(productionRealizationsFile), realizations: [...copy(productionRealizationsFile.realizations), entry] })

/** Which realization-choices file closed each line, read from the files the supplied realization was read from, in their order. */
function choicesFileOf(supplied: SuppliedRealization): Map<string, string> {
    const byLine = new Map<string, string>()
    for (const file of supplied.from) {
        const contents = readJson(path.join(AUDITS, file))
        for (const entry of (contents.choices ?? []) as Array<{ lineId: string; withdraws?: unknown }>) {
            if (entry.withdraws !== undefined) byLine.delete(entry.lineId)
            else byLine.set(entry.lineId, file)
        }
    }
    return byLine
}

const sessionOf = (s: ChainRequest['session']) => {
    const roles = Object.fromEntries(specializedRoleNames().map((role) => [role, s.specializedRoles]))
    return { players: s.players, lengthM: s.lengthM, widthM: s.widthM, durationMin: s.durationMin, roles, ...(s.goals === null ? {} : { objects: { goal: { count: s.goals } } }) }
}

function linesOf(fixture: any, request: ChainRequest, chosenBy: Map<string, string>): ChainLine[] {
    if (!fixture) return []
    const st = fixture.status
    const term = new Map<string, string | null>((st.geometry ?? []).map((g: any) => [g.lineId, g.geometry?.extentBound?.term ?? null]))
    // The item a line's position is stated relative to, exactly as the chain names it (its relation's `of`); nothing is matched by guess.
    const relationOf = new Map<string, { contractId: string; itemId: string } | null>(
        (st.geometry ?? []).map((g: any) => {
            const of = g.geometry?.relation?.of
            return [g.lineId, of && typeof of.contractId === 'string' && typeof of.itemId === 'string' ? { contractId: of.contractId, itemId: of.itemId } : null]
        }),
    )
    const lines: ChainLine[] = []
    for (const d of st.derived ?? [])
        lines.push({ kind: 'DERIVED', lineId: d.lineId, path: d.path, value: d.value, support: (d.support ?? []).map((s: any) => ({ kind: s.kind, contractId: s.contractId, itemId: s.itemId, id: s.id, row: s.row })), strength: d.strength, extentTerm: term.get(d.lineId) ?? null, relationOf: relationOf.get(d.lineId) ?? null })
    for (const c of st.choices ?? []) {
        const supplied = request.choices.find((x) => x.lineId === c.lineId && JSON.stringify(x.value) === JSON.stringify(c.value))
        lines.push({
            kind: 'CHOICE',
            lineId: c.lineId,
            path: c.path,
            value: c.value,
            because: c.because,
            closure: c.closure,
            defaultedBy: c.defaultedBy ?? null,
            assumedBound: ((c.within?.bounds ?? []) as any[]).some((b) => b.assumed === true),
            permitted: c.within?.permitted ?? null,
            ...(supplied ? { chosenBy: { case: true as const } } : chosenBy.has(c.lineId) && !c.defaultedBy ? { chosenBy: { file: chosenBy.get(c.lineId) as string } } : {}),
        })
    }
    for (const n of st.notEstablished ?? []) lines.push({ kind: 'NOT_ESTABLISHED', lineId: n.lineId, path: n.path, value: null, reason: n.reason })
    const instantiations = (st.instantiations ?? []) as Array<{ path: string; classId: string; handle: string }>
    for (const e of st.entailed ?? []) lines.push({ kind: 'ENTAILED', lineId: e.lineId, path: e.path, value: e.value, because: e.because, classId: instantiations.find((i) => i.handle === e.handle)?.classId })
    const classes = [...new Set(instantiations.map((i) => `${i.classId}|${i.path}`))]
    for (const key of classes) {
        const [classId, at] = key.split('|')
        lines.push({ kind: 'INSTANTIATION', lineId: `${classId}::members`, path: at, value: instantiations.filter((i) => i.classId === classId && i.path === at).length, classId })
    }
    for (const law of (fixture.defaultLaws?.laws ?? []) as Array<{ law: string; end: number | null; status: string; removedByRealization?: boolean }>) {
        const lineId = `defaultLaws:${law.law}${law.end === null || law.end === undefined ? '' : `:end ${law.end}`}`
        lines.push({ kind: 'LAW', lineId, path: `defaultLaws.laws[${law.law}]`, value: law.status, law: law.law, lawStatus: law.status, removedByRealization: law.removedByRealization === true })
        if (law.status === 'APPLIES') lines.push({ kind: 'LAW', lineId: `${lineId}:applied`, path: `defaultLaws.applied[${law.law}]`, value: law.status, law: law.law, lawStatus: law.status })
    }
    if (fixture.defaultLaws) lines.push({ kind: 'LAW', lineId: 'defaultLaws:owed', path: 'defaultLaws.owed', value: ((fixture.defaultLaws.laws ?? []) as any[]).filter((l) => l.status === 'ADAPTATION_OWED').map((l) => l.law), law: 'the owed list', lawStatus: 'OWED_LIST' })
    lines.push({ kind: 'SESSION_ROLES', lineId: 'session::roles', path: 'envelope.roles', value: fixture.envelope?.roles ?? null })
    return lines
}

function sentencesOf(activity: ServedActivity | RefusedActivity, fixture: any): { sentences: ChainAnswer['sentences']; served: boolean | null; withheld: ChainAnswer['withheld'] } {
    if (activity.outcome === 'served') {
        const draft = reviewDraftOf([fixture], activity.rendered, [])
        return {
            served: true,
            withheld: [],
            sentences: activity.rendered.instructions.map((i, n) => ({ section: i.section, block: i.block ?? null, status: i.status, text: i.text, from: [...i.from], wording: draft.instructions[n].wording, reviewOnly: (i as { reviewOnly?: unknown }).reviewOnly !== undefined })),
        }
    }
    const draft = activity.draft
    if (!draft) return { served: null, withheld: [], sentences: [] }
    return {
        served: false,
        withheld: (draft.withheld ?? []).map((w: any) => ({ path: String(w.path), reason: String(w.reason) })),
        sentences: draft.instructions.map((i) => ({ section: i.section, block: i.block ?? null, status: i.status, text: i.text, from: [...i.from], wording: i.wording, reviewOnly: (i as { reviewOnly?: unknown }).reviewOnly !== undefined })),
    }
}

/**
 * The harness's hold on a REPORT check: every owed law must be PROCEDURAL under the classification it is held to (our DRAFT classification;
 * in test E3 only, a labelled TEST-ONLY stand-in for it), else the run is refused here.
 */
function heldLaws(fixture: any, classification: LawsMateriality = lawsMateriality): { owed: string[]; reported: string[]; material: string[] } {
    const owed = ((fixture?.defaultLaws?.laws ?? []) as Array<{ law: string; status: string }>).filter((l) => l.status === 'ADAPTATION_OWED')
    const reported: string[] = []
    const material: string[] = []
    const ours = classification === lawsMateriality
    for (const l of owed) {
        const entry = classification.classifications.find((x) => x.law === l.law)
        const held = ours ? `our DRAFT classification (${classification.file}: our reading, for Christian's review; not a ruling)` : `a TEST-ONLY stand-in classification (${classification.file}: neither our reading nor a ruling)`
        const sentence = `${l.law} at the game: an adaptation is owed; ${entry ? `${entry.materiality} under ${held}` : `MATERIAL: ${ours ? 'our DRAFT classification' : 'the TEST-ONLY stand-in classification'} names no such law (fail safe)`}`
        if (entry && entry.materiality === 'PROCEDURAL') reported.push(sentence)
        else material.push(sentence)
    }
    return { owed: owed.map((l) => l.law), reported, material }
}

/**
 * **The chain's own account behind a refusal met before any game exists** (structure or realization), for the refusal reading (Christian's
 * second reply of 7 November, section 2). The build returns no game there, so the derivation is run again here, by the chain's own functions,
 * on exactly the input the build derived from: the selection and the contracts its own TEST-ONLY options were handed (after the case's
 * alterations), with the build's deferral and role-yield steps. Nothing is read from it unless it reproduces the build's own refusal: at
 * structure its reasons word for word; at realization a game the gate let through to realization. Otherwise this throws (fail closed).
 * It reads what the chain itself reports: each failing Gate A check's own result (its why and subjects), each owed line with the
 * declarations it was decided over, and each open line's permitted alternatives and the items bounding it. It changes no check.
 */
function refusalDetailOf(selection: any, contracts: LoadedContract[], session: ReturnType<typeof sessionOf>, stage: string, reasons: string[]): NonNullable<ChainAnswer['refusalDetail']> {
    // The contracts are the ones the build derived from (its realization's among them), so the selection is read with no realization of its own.
    const input: any = { ...derivationInputFor({ ...selection, realization: null }), envelope: { ...session, roles: { ...session.roles }, ...((session as any).objects ? { objects: copy((session as any).objects) } : {}) } }
    input.contracts = copy(contracts)
    const relationships = contextRelationships()
    const index = indexRegister(input.register)
    const deferral = applyRealizationDeferrals(input.contracts as LoadedContract[], relationships, index)
    input.contracts = applyRoleYields(deferral.contracts, relationships, index)
    const result: any = runDerivation(input)
    if (isStampedHalt(result)) throw new Error('the refusal detail: the derivation halted when run again, so it does not reproduce the build')
    const staged: any = runStages0to10(input)
    const resolved: any = assembleResolvedGame(result, staged.classes, index, input.contracts)
    if (stage === 'structure') {
        const again = [`Gate A is ${resolved.coherence.gateA}`, ...(resolved.coherence.notAuthorizedBecause ?? [])]
        if (JSON.stringify(again) !== JSON.stringify(reasons)) throw new Error(`the refusal detail does not reproduce the build's refusal: ${JSON.stringify(again)} against ${JSON.stringify(reasons)}`)
    } else if (stage === 'realization') {
        if (resolved.coherence.realizationAuthorized !== true) throw new Error('the refusal detail does not reproduce the build: the gate refuses before realization when run again')
    } else throw new Error(`the refusal detail is read only before a game exists (structure, realization), not at ${stage}`)
    const ref = (x: any): { contractId: string; itemId: string } | null => (x && typeof x.contractId === 'string' && typeof x.itemId === 'string' ? { contractId: x.contractId, itemId: x.itemId } : null)
    return {
        failingChecks: ((result.gates?.gateA?.checks ?? []) as any[]).filter((c) => c.verdict === 'FAIL').map((c) => ({ checkId: String(c.checkId), why: String(c.why ?? ''), subjects: ((c.subjects ?? []) as unknown[]).map(String) })),
        owedLines: ((resolved.notEstablished ?? []) as any[])
            .filter((e) => e.reason === 'declared gap' || e.reason === 'claimed but unresolved')
            .map((e) => ({ lineId: String(e.lineId), verdict: String(e.verdict), reason: e.reason === null ? null : String(e.reason), declared: ((e.declared ?? []) as unknown[]).map(String), governedBy: ((e.governedBy ?? []) as any[]).map((g) => ({ contractId: String(g.contractId), declaration: String(g.declaration), selector: g.selector === null || g.selector === undefined ? null : String(g.selector) })) })),
        openLines: ((resolved.open ?? []) as any[]).map((o) => ({
            lineId: String(o.lineId),
            permitted: o.permitted === null || o.permitted === undefined ? null : copy(o.permitted),
            boundedBy: ((o.bounds ?? []) as any[]).map((b) => ref(b?.from) ?? ref(b?.item) ?? ref(b)).filter((x): x is { contractId: string; itemId: string } => x !== null),
        })),
    }
}

/**
 * An item's evidence is printed verbatim in the report (review of 7 November), except where it holds a gendered pronoun, which nothing this
 * report writes may hold: such evidence is named and not printed (measured: four items of the knowledge the cases derive from).
 */
// The words are spelled backwards here, so that this file itself holds none of them (the binding rule: no gendered pronoun anywhere).
const GENDERED = new Set(['eh', 'mih', 'sih', 'flesmih', 'ehs', 'reh', 'sreh', 'flesreh'].map((w) => [...w].reverse().join('')))
const holdsGenderedPronoun = (text: string): boolean => text.toLowerCase().split(/[^a-z]+/).some((t) => GENDERED.has(t))
const EVIDENCE_WITHHELD = 'it holds a gendered pronoun, which this report does not print; it is the item\'s basisEvidence in the knowledge file the chain derived from'

/**
 * The Game Problem library's name for each id, read through the display reader (its allowlist holds that column), after the decisions and for
 * the report only; the stage file reads no name column. An id the library does not hold gets no name.
 */
let namesKnowledge: ReturnType<typeof committedKnowledge> | null = null
function gameProblemNames(ids: Array<string | null>): Record<string, string> {
    namesKnowledge ??= committedKnowledge()
    const out: Record<string, string> = {}
    for (const id of ids) if (id && namesKnowledge.gameProblems.gameProblems.some((g) => g['ID'] === id)) out[id] = displayCell(namesKnowledge, { source: 'gameProblems', table: 'gameProblems', row: id, column: 'Name' }).text
    return out
}

/** The diagram model's blocks as compared and printed: every field, with each label read as its text (a label's word standing is not compared). */
const withLabelText = (entries: unknown[]): unknown[] =>
    entries.map((e) => (e && typeof e === 'object' && 'label' in (e as Record<string, unknown>) ? { ...(e as Record<string, unknown>), label: ((e as { label?: { text?: unknown } | null }).label?.text ?? null) } : e))

/**
 * The chain wired for the handoff. `heldTo` is the classification the harness holds a REPORT check to: our DRAFT classification, except in
 * test E3, which holds it to a labelled TEST-ONLY stand-in to show the hold's refusing branch.
 */
function chainWith(opts: { heldTo?: LawsMateriality } = {}): HandoffChain {
    return {
    build(request: ChainRequest): ChainAnswer {
        const vehicle = request.vehicle
        const goalId = request.goalId ?? vehicle?.goalId
        if (!goalId) throw new Error(`case ${request.caseId}: neither a goal nor a vehicle`)
        let records = productionRecords
        if (request.records !== 'PRODUCTION') {
            // The TEST-ONLY record, in memory, in the production shape (held to the record gate by the build; never written to the file).
            const { provisionalRealization, ...rest } = copy(request.records)
            const record: Record<string, unknown> = { ...rest, excluded: [], manipulations: [] }
            if (provisionalRealization) record.provisionalRealization = provisionalRealization
            records = [...productionRecords, record as unknown as (typeof productionRecords)[number]]
        }
        const realizations = request.realization ? gatedRealizations(realizationEntry(request.realization)) : undefined
        const drafts: DraftStoreContents | undefined = request.draftStore ? loadDraftStore(request.draftStore) : undefined
        const draftIds = new Set((drafts?.contracts ?? []).map((c) => c.contractId))
        let scorerPick: string[] | null = null
        let seen: ChainAnswer['contracts'] = []
        let chosenBy = new Map<string, string>()
        // The selection and the contracts the build derived from, as its own TEST-ONLY options were handed them (for `refusalDetailOf`).
        let selected: any = null
        let derivedFrom: LoadedContract[] | null = null
        const alterSelection = (selection: any) => {
            scorerPick = selection.selected.filter((e: any) => e.role === 'game form').map((e: any) => String(e.id))
            const others = selection.selected.filter((e: any) => e.role !== 'game form' && !(vehicle?.removeContext && e.role === CONTEXT_ROLE))
            // An applied manipulation enters the selection explicitly, as the form does, in the role a demonstration gives its mechanism
            // (`demonstrationSelection`); the record's own authorized set is never widened (a lone one is refused at selection, measured).
            selection.selected = [{ id: request.formId, role: 'game form' }, ...others, ...request.place.map((p) => ({ id: p.id, role: 'constraint' }))]
            selected = selection
        }
        const alter = (contracts: LoadedContract[]) => {
            for (const w of request.withhold) {
                const contract = contracts.find((c) => c.contractId === w.contractId)
                if (!contract) throw new Error(`treatment ${w.treatmentId}: the chain derives from no contract ${w.contractId}`)
                for (const id of w.itemIds) if (!contract.items.some((i) => i.itemId === id)) throw new Error(`treatment ${w.treatmentId}: ${w.contractId} holds no item ${id}`)
                contract.items = contract.items.filter((i) => w.itemIds.indexOf(i.itemId) < 0)
            }
            for (const s of request.standIns) {
                const contract = contracts.find((c) => c.contractId === s.contractId)
                if (!contract) throw new Error(`a stand-in names the contract ${s.contractId}, which the chain does not derive from`)
                contract.items.push(copy(s.item) as any)
            }
            derivedFrom = copy(contracts)
            seen = contracts.map((c) => ({
                contractId: c.contractId,
                origin: draftIds.has(c.contractId) ? ('DRAFT_STORE' as const) : c.contractId.startsWith('provisional:') ? ('REALIZATION' as const) : ('KNOWLEDGE' as const),
                items: c.items.map((i: any) => ({
                    itemId: String(i.itemId),
                    row: String(i.row),
                    basis: String(i.basis),
                    category: i.category ? String(i.category) : null,
                    basisEvidence: typeof i.basisEvidence === 'string' ? i.basisEvidence : JSON.stringify(i.basisEvidence ?? ''),
                    // Only where the item itself records one (measured 7 November: no knowledge item does).
                    provisional: typeof i.provisional === 'boolean' ? i.provisional : null,
                    evidenceWithheld: holdsGenderedPronoun(typeof i.basisEvidence === 'string' ? i.basisEvidence : JSON.stringify(i.basisEvidence ?? '')) ? EVIDENCE_WITHHELD : null,
                })),
            }))
        }
        const alterSupplied = (supplied: SuppliedRealization) => {
            chosenBy = choicesFileOf(supplied)
            for (const ch of request.choices) {
                const existing = supplied.choices.find((c) => c.lineId === ch.lineId)
                if (existing) {
                    existing.value = copy(ch.value) as any
                    existing.because = ch.because
                } else supplied.choices.push({ lineId: ch.lineId, value: copy(ch.value) as any, because: ch.because })
            }
        }
        const standIn: LawsMateriality | undefined = vehicle?.lawsStandIn
            ? {
                  ...copy(lawsMateriality),
                  file: 'TEST-ONLY',
                  // The classification gate requires a standing that begins DRAFT and says TEST-ONLY or OUR READING; within that, the words say
                  // which part is ours and which part is the stand-in (review of 7 November: before, the stand-in's clause was printed on every law).
                  standing: `DRAFT - our DRAFT classification, except ${vehicle.lawsStandIn.law} ${vehicle.lawsStandIn.materiality}: a TEST-ONLY stand-in, neither our reading nor a ruling of Christian's`,
                  classifications: lawsMateriality.classifications.map((e) => (e.law === vehicle.lawsStandIn!.law ? { ...e, materiality: vehicle.lawsStandIn!.materiality as 'PROCEDURAL' | 'MATERIAL', ourReading: 'TEST-ONLY stand-in.' } : { ...e })),
              }
            : undefined
        const built = buildActivityUnderAuthorizationRecords({ kind: 'learning-goal', goalId, session: sessionOf(request.session) }, records, {
            review: { includeDrafts: true },
            alterSelection,
            alter,
            alterSupplied,
            ...(drafts ? { drafts } : {}),
            ...(realizations ? { realizations } : {}),
            ...(standIn ? { lawsMateriality: standIn } : {}),
            ...(request.supplement ? { communicationSupplement: withReviewStructureWording } : {}),
        })
        const activity = built.activity
        const fixture = built.fixture
        let outcome = activity.outcome
        let stage = activity.outcome === 'refused' ? activity.stage : null
        let summary = activity.outcome === 'refused' ? activity.summary : null
        let reasons = activity.outcome === 'refused' ? [...activity.reasons] : []
        let laws: ChainAnswer['laws'] = activity.lawsCheck ? { mode: activity.lawsCheck.mode, owed: [...activity.lawsCheck.owed], reportedForReview: [...(activity.lawsCheck.materiality?.reportedForReview ?? [])] } : null
        // Read before the harness's hold can restate the outcome: only a refusal the chain itself met before any game exists.
        const refusalDetail = activity.outcome === 'refused' && (activity.stage === 'structure' || activity.stage === 'realization') && selected && derivedFrom ? refusalDetailOf(selected, derivedFrom, sessionOf(request.session), activity.stage, activity.reasons) : null
        if (request.holdReportedLawsToMateriality && fixture) {
            const held = heldLaws(fixture, opts.heldTo)
            laws = { mode: 'REPORT (the TEST-ONLY realization\'s check), held by the harness to our DRAFT classification', owed: held.owed, reportedForReview: held.reported }
            if (held.material.length) {
                outcome = 'refused'
                stage = 'validation'
                summary = `the harness holds the TEST-ONLY realization's REPORT check to ${opts.heldTo ? 'a TEST-ONLY stand-in classification' : 'our DRAFT classification'}, and a law it owes is not procedural there`
                reasons = held.material
            }
        }
        const read = sentencesOf(activity, fixture)
        const account = activity.account
        const diagramDraft = (activity as ServedActivity).diagramDraft
        const block = diagramDraft?.diagram?.blocks?.[0] as any
        return {
            outcome,
            stage,
            summary,
            reasons,
            scorerPick,
            account: account
                ? {
                      gameFormId: account.gameForm?.id ?? null,
                      contextId: account.context?.id ?? null,
                      contextContract: (account.context as { contract?: string } | null | undefined)?.contract ?? null,
                      gameProblem: account.gameProblem
                          ? { status: account.gameProblem.status, gameProblemId: account.gameProblem.gameProblemId, inferredFromWording: account.gameProblem.inferredFromWording, names: gameProblemNames([account.gameProblem.gameProblemId, account.gameProblem.inferredFromWording]) }
                          : null,
                      constraints: (account.constraints ?? []).map((c) => c.id),
                      affordanceLenses: [...(account.affordanceLenses ?? [])],
                  }
                : null,
            contracts: seen,
            lines: linesOf(fixture, request, chosenBy),
            sentences: read.sentences,
            sentencesServed: read.served,
            withheld: read.withheld,
            laws,
            requirementAccount: activity.requirementAccount
                ? {
                      status: String(activity.requirementAccount.status),
                      contract: (activity.requirementAccount as { contract?: string }).contract ?? null,
                      components: (((activity.requirementAccount as any).summary?.scoringCondition?.components ?? []) as any[]).map((c) => [String(c.component), String(c.account)] as [string, string]),
                  }
                : null,
            diagram: diagramDraft
                ? {
                      served: !!(activity as ServedActivity).diagram,
                      verdict: diagramDraft.verdict,
                      area: diagramDraft.diagram?.area ? { lengthM: (diagramDraft.diagram.area as any).lengthM, widthM: (diagramDraft.diagram.area as any).widthM } : null,
                      counts: ((diagramDraft.diagram?.counts ?? []) as any[]).map((c) => c?.word?.text ?? c),
                      legend: (diagramDraft.diagram?.legend ?? []).map((l: any) => l.text),
                      zones: ((block?.markings?.zones ?? []) as any[]).map((z) => ({ zone: z.elementId, along: z.along, across: z.across })),
                      findings: copy(diagramDraft.findings ?? []),
                      // Since the review of 7 November the comparison reads these too, so 'exactly' covers the whole diagram block; each label is
                      // read as its text (its word standing is the renderer's wording mark, which the sentences carry; it is not compared here).
                      dimensions: withLabelText(copy(block?.dimensions ?? [])),
                      targets: withLabelText(copy(block?.targets ?? [])),
                      teams: withLabelText(copy(block?.teams ?? [])),
                  }
                : null,
            placed: request.place.map((p) => ({ id: p.id, contractIds: seen.filter((c) => knowledgeKey(c.contractId) === knowledgeKey(p.id)).map((c) => c.contractId) })),
            fidelityViolations: activity.outcome === 'served' ? (activity as ServedActivity).integrity.fidelityViolations : stage === 'communication' && activity.outcome === 'refused' ? reasons.filter((x) => x.startsWith('fidelity ')).length : null,
            refusalDetail,
        }
    },
    }
}

export const realChain: HandoffChain = chainWith()

// ---------------------------------------------------------------------------------------------------------------------------------------
// Run, evidence
// ---------------------------------------------------------------------------------------------------------------------------------------

const k = committedKnowledge()
const once = <T>(make: () => T): (() => T) => {
    let made: { value: T } | null = null
    return () => (made ??= { value: make() }).value
}
const resultsOnce = once(() => runHandoffCases(inputs, realChain, k))
const byCase = (results: HandoffResult[], id: string): HandoffResult => {
    const r = results.find((x) => x.caseId === id)
    assert.ok(r, id)
    return r
}

/** The input counts the report prints, against the hand-authored record they replace (read from the assembly's committed evidence here, never by the handoff). */
function countLines(): string[] {
    const assembly = readJson(path.join(AUDITS, 'design-reasoning-assembly', 'evidence', 'assembly-results.json'))
    const wording = readJson(path.join(HERE, 'assembly-wording.draft.json'))
    const a05 = inputCounts(inputs, 'A05')
    // The routine (C) values the hand-authored record turned into values (OURS: R6 section 2.4's C tally), as its committed evidence holds them.
    // Review of 7 November: the receiving distance is not among them (the record held no value for it), and the restart's location is split:
    // its functional bound is B; only the exact spot within it is C.
    const routine = ['duration.blocks', 'duration.blockMinutes', 'duration.breaks', 'equipment.bibs', 'equipment.markers', 'equipment.balls']
    const valueOf = (p: string) => {
        const c = (assembly.activity.choices as any[]).find((x) => x.path === p)
        assert.ok(c, p)
        return c
    }
    const entered = routine.map((p) => {
        const c = valueOf(p)
        assert.notEqual(c.value, null, `${p}: the record entered a value`)
        return `${p} = ${typeof c.value === 'string' ? `'${c.value}'` : String(c.value)} (class ${c.sixClass}, ${c.howReached})`
    })
    const location = valueOf('restart.endLine.location')
    assert.equal(valueOf('restart.endLine.receivingDistance').value, null, 'the record entered no receiving distance')
    return [
        `A05 (cases ${a05.cases.join(', ')}): ${a05.rulings} of Christian's rulings (${a05.enteringTheChain} entering the chain, ${a05.reportOnly} report only), ${a05.illustrative} illustrative values, ${a05.testOnlyTreatments} TEST-ONLY treatments, ${a05.suppliedChoices} supplied choices, ${a05.standIns} stand-in items; no sentence.`,
        `The hand-authored A05 review record these replace as the activity's source: ${assembly.activity.counts.activityValues} activity values and ${wording.templates.length} coach-text templates (its sentences and notes), every one entered by hand; the handoff's coach text is the checked renderer's and the review-only wording's.`,
        `Routine choices (kind C by our reading) the hand-authored record turned into values, which the handoff leaves to the coach with no value: ${entered.join('; ')}.`,
        `The record's end-line restart location, restart.endLine.location = '${location.value}' (class ${location.sixClass}, ${location.howReached}), is split by our reading: its functional bound (Christian's first reply of 7 November, section 7: a location that avoids producing trivial scores directly from the serve while allowing play to develop naturally) is kind B; the exact spot within that bound is kind C, a coach-adjustable operational detail (the same reply, section 7). The record entered no receiving distance (restart.endLine.receivingDistance held no value), so it is not counted.`,
    ]
}

const purposeTexts = (): Record<string, string> =>
    Object.fromEntries(inputs.cases.filter((c) => c.goalId).map((c) => [c.goalId as string, displayCell(k, { source: 'planning', table: 'learning_goals', row: c.goalId as string, column: 'Coach Definition' }).text]))

/** Each test variant's comparison with its base, and each refusal a test met, in run order (the evidence prints them). */
const testComparisons: Array<{ test: string; comparison: HandoffComparison }> = []
const testRefusals: RefusalEntry[] = []
const GROUP_ORDER = [FIRST, SECOND, THIRD, FOURTH, RESTART, PROVENANCE, CHECKS]

/**
 * The pointer the refusals section carries to the separate correction report (the addendum's item 3: where our runs reproduce its cases, say
 * so in one line, and do not repeat them).
 */
const REFUSAL_NOTES = [
    'Pointer: A05-0 and C2 reproduce cases (1) and (2) of our separate correction report to Christian; that report also covers our DRAFT LAW-11 materiality reading, which the GF2 structural cases here pass only under a TEST-ONLY stand-in (TT-LAW-11-STAND-IN).',
]

/** The refusals of the cases themselves: each stops that case's configuration, so each obstructs the pathway for it. */
const caseRefusals = (results: HandoffResult[]): RefusalEntry[] =>
    results
        .filter((r) => r.refusalBasis)
        .map((r) => ({ where: `case ${r.caseId}`, basis: r.refusalBasis as NonNullable<HandoffResult['refusalBasis']>, obstructs: `yes: the case's configuration stops here (${r.resultStanding})` }))

function evidenceOf(results: HandoffResult[]): { report: string; json: string } {
    const counts = countLines()
    const purposes = purposeTexts()
    const tests = [...reported].sort((a, b) => GROUP_ORDER.indexOf(a.group) - GROUP_ORDER.indexOf(b.group))
    const refusals = [...caseRefusals(results), ...testRefusals]
    const report = handoffReportText(results, inputs, [...counts, ...Object.entries(purposes).map(([goal, text]) => `purpose text of ${goal} (display cell, read after the decisions): '${text}'`)], tests, refusals, REFUSAL_NOTES)
    const json = `${JSON.stringify({ stage: 'DESIGN_REASONING_HANDOFF', standing: inputs.standing, opportunities: OPPORTUNITIES_NOT_ESTABLISHED, counts, tests, comparisons: testComparisons, refusals, cases: results }, null, 1)}\n`
    return { report, json }
}

// ---------------------------------------------------------------------------------------------------------------------------------------
// Variants (Tests A, B and C): a case copied, changed in one stated respect, held to the same validator, and run by the same mechanism
// ---------------------------------------------------------------------------------------------------------------------------------------

/** A variant of a case: copied, its id and label replaced, changed by `vary`, and held to the inputs' own validator before it runs. */
function variantOf(baseId: string, id: string, label: string, vary: (c: CaseInput) => void): CaseInput {
    const base = inputs.cases.find((c) => c.id === baseId)
    assert.ok(base, baseId)
    const c = copy(base)
    delete c.basedOn
    c.id = id
    c.label = label
    vary(c)
    validateHandoffInputs({ standing: inputs.standing, rulings: inputs.rulings, cases: [c], grading: inputs.grading })
    return c
}
const runVariant = (c: CaseInput): HandoffResult => runHandoff(c, inputs, realChain, k)
const byCaseInput = (id: string): CaseInput => {
    const c = inputs.cases.find((x) => x.id === id)
    assert.ok(c, id)
    return c
}

/** Compares a variant with its base (or two cases), records the comparison and any refusal for the evidence, and returns the printed lines. */
function compared(testId: string, base: HandoffResult, variant: HandoffResult, obstructs = 'no: the test exists to show this refusal', notes: string[] = []): { cmp: HandoffComparison; lines: string[] } {
    const cmp = compareResults(base, variant)
    testComparisons.push({ test: testId, comparison: cmp })
    if (variant.refusalBasis && !inputs.cases.some((c) => c.id === variant.caseId)) testRefusals.push({ where: `test ${testId} (${variant.caseId})`, basis: variant.refusalBasis, obstructs, ...(notes.length ? { notes } : {}) })
    return { cmp, lines: comparisonLines(cmp) }
}
const ILLUSTRATIVE_GRADE = `class 5; ${VALUE_LABELS.ILLUSTRATIVE}`
/**
 * Said beside every result on the GF2 structural cases (review of 7 November): they are served only under a TEST ASSUMPTION, measured in C1
 * (without it, our DRAFT classification refuses them at validation on LAW-11; with no classification, the fail safe refuses them on LAW-8
 * and LAW-11); Christian's no-offside ruling is scoped to A05's initial small-sided realization and is not generalized to them.
 */
const GF2_STAND_IN_NOTE = 'the GF2 structural cases are served only under TT-LAW-11-STAND-IN (a TEST ASSUMPTION, neither our reading nor a ruling of Christian\'s); without it, our DRAFT classification (LAW-11 MATERIAL) refuses them at validation, and with no classification the fail safe refuses them on LAW-8 and LAW-11 (measured in C1); Christian\'s no-offside ruling is not generalized to them (Christian\'s first reply of 7 November, section 9, scopes it to the initial small-sided realization)'
/** Said beside the A05-2 halves of Tests A (review of 7 November). */
const A05_2_NOTE = 'A05-2 is CONDITIONAL on the 13 September verification and is not A05\'s result'

// ---------------------------------------------------------------------------------------------------------------------------------------
// First: the pathways connect (section 11)
// ---------------------------------------------------------------------------------------------------------------------------------------

test('First: the A05 runs go end to end through Steps 1 and 2 and the chain with the hand-authored record never read', () => {
    const plainRuns = resultsOnce().filter((r) => r.goalId === 'A05')
    assert.deepEqual(plainRuns.map((r) => r.caseId), ['A05-0', 'A05-1', 'A05-2'])
    // The record's loaded value throws on any read while the runs repeat; every file read is watched.
    const recPath = require.resolve(REC_FILE)
    const loaded = require.cache[recPath]?.exports as Record<string, unknown> | undefined
    assert.ok(loaded && typeof loaded === 'object', 'the record is loaded (assembly.ts imports it)')
    const saved = Object.entries(loaded)
    const reads: string[] = []
    const originalRead = fs.readFileSync
    let poisoned: HandoffResult[] = []
    try {
        for (const [key] of saved) {
            delete loaded[key]
            Object.defineProperty(loaded, key, { configurable: true, enumerable: true, get: () => { throw new Error(`the hand-authored record was read (${key})`) } })
        }
        ;(fs as { readFileSync: unknown }).readFileSync = (file: fs.PathOrFileDescriptor, ...rest: unknown[]) => {
            if (typeof file === 'string' && path.resolve(file) === path.resolve(REC_FILE)) reads.push(file)
            return (originalRead as (...a: unknown[]) => unknown)(file, ...rest)
        }
        assert.throws(() => JSON.stringify(loaded), /the hand-authored record was read/, 'bite: a read of the record throws')
        poisoned = runHandoffCases({ ...inputs, cases: inputs.cases.filter((c) => c.goalId === 'A05') }, realChain, k)
    } finally {
        ;(fs as { readFileSync: unknown }).readFileSync = originalRead
        for (const [key, value] of saved) {
            delete loaded[key]
            loaded[key] = value
        }
    }
    assert.deepEqual(reads, [], 'no file read of the record during the runs')
    assert.equal(JSON.stringify(poisoned), JSON.stringify(plainRuns), 'the A05 runs are identical with the record unreadable')
    for (const r of plainRuns) {
        assert.equal(r.receive.step1?.status, 'RESOLVED')
        assert.deepEqual([r.receive.step1?.primary, r.receive.step1?.secondary, r.receive.step1?.contextId], [['GP-001'], ['GP-002'], 'RPC-003'])
        assert.deepEqual([r.receive.step2?.status, r.receive.step2?.compatible], ['COMPATIBLE_ALTERNATIVES', ['GF2', 'GF3', 'GF7']])
        assert.deepEqual([r.form.decision, r.form.formId, r.form.alternativesRetained, r.form.premise?.sixClass, r.form.premise?.label], ['NAMED', 'GF2', ['GF3', 'GF7'], 5, VALUE_LABELS.ILLUSTRATIVE])
        assert.match(String(r.chain?.scorerPick), /^GF2 \(the chain's own keyword-scorer pick: not used; the handoff placed GF2\)$/)
        assert.equal(r.chain?.contextComparison, 'the chain\'s context equals Step 1\'s (RPC-003)')
        // Re-pinned openly (review of 7 November: a Game Problem id is printed with its library name): before '(inferred from wording: GP-015)'.
        assert.match(String(r.chain?.gameProblemComparison), /^the chain's account reads UNRESOLVED none \(inferred from wording: GP-015 'Maintain Possession'\); Step 1: primary GP-001, secondary GP-002;/)
        assert.deepEqual(r.chain?.constraints, [], 'the TEST-ONLY record\'s empty set: no constraint')
    }
})

test('First: A01 through the handoff, with its production records and realizations, gives buildActivity\'s 29 instructions, text and from-paths', () => {
    const a01 = byCase(resultsOnce(), 'A01')
    assert.deepEqual([a01.form.decision, a01.form.formId, a01.form.alternativesRetained, a01.form.premise?.sixClass, a01.form.premise?.label], ['NAMED', 'GF2', ['GF3', 'GF7'], 6, VALUE_LABELS.OURS])
    assert.equal(a01.chain?.outcome, 'served')
    const live = buildActivity({ kind: 'learning-goal', goalId: 'A01', session: { players: 12, lengthM: 40, widthM: 30, durationMin: 20, roles: Object.fromEntries(specializedRoleNames().map((r) => [r, 1])), objects: { goal: { count: 0 } } } })
    assert.equal(live.outcome, 'served')
    const liveSentences = (live as ServedActivity).rendered.instructions.map((i) => ({ text: i.text, from: i.from }))
    assert.equal(liveSentences.length, 29)
    assert.deepEqual(a01.sentences.map((s) => ({ text: s.text, from: s.from })), liveSentences)
    assert.equal(a01.sentences.filter((s) => s.reviewOnly).length, 0, 'the review-only wording adds nothing to A01')
})

// ---------------------------------------------------------------------------------------------------------------------------------------
// Each case's outcome, as measured
// ---------------------------------------------------------------------------------------------------------------------------------------

test('A05-0, the knowledge as it stands: refused at structure on the drafted origin and control lines', () => {
    const r = byCase(resultsOnce(), 'A05-0')
    assert.deepEqual([r.chain?.outcome, r.chain?.stage], ['refused', 'structure'])
    assert.deepEqual(r.chain?.reasons, ['Gate A is FAIL', 'a pre-realization Gate A invariant fails: GA-NO-FAILED-LINE', '2 unresolved properties are neither an authorized choice nor an authorized claim: c:restated:RPC-003:RPC-003-12.a::V5, c:restated:RPC-003:RPC-003-10.a::V6'])
    assert.deepEqual([r.sentences.length, r.lines.length, r.sentencesServed], [0, 0, null])
})

test('A05-1, the starting-condition reading as a TEST-ONLY treatment: refused at structure on the drafted control line alone (measured; our plan expected a refusal at communication)', () => {
    const r = byCase(resultsOnce(), 'A05-1')
    assert.deepEqual([r.chain?.outcome, r.chain?.stage], ['refused', 'structure'])
    assert.deepEqual(r.chain?.reasons, ['Gate A is FAIL', 'a pre-realization Gate A invariant fails: GA-NO-FAILED-LINE', '1 unresolved property is neither an authorized choice nor an authorized claim: c:restated:RPC-003:RPC-003-12.a::V5'])
    assert.ok(r.testOnlyTreatments.some((t) => t.id === 'TT-ORIGIN-WITHHELD'))
})

test('A05-2, CONDITIONAL and never A05\'s result: served, with the no-offside sentence, the review-only zone sentence and the kick-off reported', () => {
    const r = byCase(resultsOnce(), 'A05-2')
    assert.equal(r.resultStanding, 'CONDITIONAL_NOT_A05_RESULT')
    assert.equal(r.chain?.outcome, 'served')
    assert.deepEqual(
        r.sentences.map((s) => `[${s.section}] ${s.text}`),
        [
            '[Set up] Mark out an area 40 m long by 30 m wide',
            '[Set up] Mark a 5 m end zone across the full width at each end',
            '[Players] Divide 12 players into 2 teams of 6, with no goalkeepers',
            '[How it works] Pick which team starts with the ball and tell both teams before you start',
            '[How it works] When possession changes, play carries on without a stoppage, and each team keeps attacking the same target',
            '[How it works] There is no offside',
            '[How to score] A team scores 1 point by getting the ball under control into its target zone: running it in, or passing to a teammate who receives it under control inside',
            '[How to score] Each team attacks the zone at the other team\'s end. Decide which team starts at which end; the ends stay the same for the whole game',
            '[When it ends] Play for 18 minutes',
        ],
    )
    assert.deepEqual(r.laws?.owed, ['LAW-8'], 'the kick-off\'s centre mark: owed and reported')
    assert.equal(r.laws?.reportedForReview.length, 1)
    assert.deepEqual(r.requirementAccount, { status: 'REPORT_ONLY', contract: 'DRAFT', components: [] })
    assert.equal(r.diagram?.verdict, 'DRAWN')
    assert.equal(r.diagram?.served, true)
})

test('the structural cases (no Learning Goal) are served through the same mechanism; TA01 stops at knowledge with Step 2\'s form', () => {
    const results = resultsOnce()
    const zones = byCase(results, 'GF2-ZONES')
    const lines = byCase(results, 'GF2-LINES')
    for (const r of [zones, lines]) {
        assert.equal(r.label.startsWith('structural cases, no Learning Goal'), true)
        assert.deepEqual([r.receive.step1, r.receive.step2, r.form.decision, r.chain?.outcome], [null, null, 'STRUCTURAL_CASE', 'served'])
        assert.equal(r.sentences.length, 8)
    }
    assert.ok(zones.sentences.some((s) => s.reviewOnly && s.text === 'Mark a 5 m end zone across the full width at each end'))
    assert.ok(lines.sentences.some((s) => !s.reviewOnly && s.text === 'Mark both end lines: they are the scoring lines'))
    const ta01 = byCase(results, 'TA01')
    assert.deepEqual([ta01.form.decision, ta01.form.formId, ta01.form.premise?.sixClass, ta01.form.premise?.label], ['SELECTED_BY_STEP_2', 'GF4', 3, 'CANDIDATE'])
    assert.deepEqual([ta01.chain?.outcome, ta01.chain?.stage], ['refused', 'knowledge'])
    assert.match(ta01.chain?.reasons[0] ?? '', /^the Representative Performance Context RPC-006 has no contribution contract/)
})

// ---------------------------------------------------------------------------------------------------------------------------------------
// Provenance (section 13: "provenance handling")
// ---------------------------------------------------------------------------------------------------------------------------------------

test('the grading map, pinned per kind', () => {
    assert.deepEqual(
        PREMISE_KINDS.map((kind) => `${kind} ${GRADING_MAP[kind].standing ?? '-'}`),
        [
            'RESTATED_ITEM CANDIDATE',
            'KNOWLEDGE_RULING_ITEM RULING',
            'ASSUMED_ITEM OURS',
            'ENGINE_ONLY_ITEM OURS',
            'DRAFT_ITEM CANDIDATE',
            'REALIZATION_ITEM RULING',
            'STANDING_DECISION RULING',
            'CASE_CHOICE_RULING RULING',
            'CASE_CHOICE_ILLUSTRATIVE ILLUSTRATIVE',
            'FILE_CHOICE_RULING RULING',
            'FILE_CHOICE_OURS OURS',
            'COACH -',
            'ASSUMED_BOUND OURS',
            'STAND_IN -',
            'SESSION_ILLUSTRATIVE ILLUSTRATIVE',
            'SESSION_COACH_INPUT RULING',
            'LAWS_DEFAULT_PRINCIPLE RULING',
            'LAWS_ENCODING CANDIDATE',
            'LAW_DEPARTURE RULING',
            'FORM_SELECTED -',
            'FORM_ILLUSTRATIVE ILLUSTRATIVE',
            'FORM_INFERENCE OURS',
            'UNRESOLVED UNRESOLVED',
        ],
    )
    assert.equal(GRADING_MAP.CASE_CHOICE_ILLUSTRATIVE.label, VALUE_LABELS.ILLUSTRATIVE)
    assert.equal(GRADING_MAP.FORM_INFERENCE.label, VALUE_LABELS.OURS)
    assert.equal(GRADING_MAP.UNRESOLVED.label, VALUE_LABELS.UNRESOLVED)
})

test('no line is graded APPROVED from a restatement of ours; ILLUSTRATIVE never above class 5; a stand-in never above its declared label', () => {
    const premises = resultsOnce().flatMap((r) => [...r.lines.flatMap((l) => l.premises), ...(r.form.premise ? [r.form.premise] : [])])
    assert.ok(premises.length > 100, `${premises.length} premises graded`)
    for (const p of premises) {
        if (p.kind === 'RESTATED_ITEM' || p.kind === 'DRAFT_ITEM') assert.ok(p.sixClass !== null && p.sixClass >= 3, `${p.ref}: ${p.sixClass}`)
        if (p.standing === 'ILLUSTRATIVE') assert.equal(p.sixClass, 5, p.ref)
        if (p.kind === 'STAND_IN') assert.ok(p.sixClass === 5 || p.sixClass === 4, p.ref)
    }
    for (const r of resultsOnce()) for (const l of r.lines) assert.ok(l.sixClass !== 1, `${r.caseId} ${l.lineId} is class 1`)
    // A line resting on a restatement shows the restatement's own words and the source's standing beside it.
    const restated = premises.find((p) => p.kind === 'RESTATED_ITEM' && p.ref === 'restated:GF2 GF2-04')
    assert.ok(restated, 'a GF2 restatement premise')
    assert.deepEqual(
        [restated.sixClass, restated.label, restated.sourceStanding],
        [3, 'our restatement of the Soccer Module workbook (soccer-module.rc1-v3.json)', 'DRAFT (the module\'s own status, module_status DRAFT; the review pathway reads its Game Form rows as CANDIDATE)'],
    )
})

test('the illustrative depth: the stand-ins determine exactly the two zones\' along lines, and every sentence citing them carries the ILLUSTRATIVE label', () => {
    for (const id of ['A05-2', 'GF2-ZONES']) {
        const r = byCase(resultsOnce(), id)
        assert.deepEqual(
            r.standIns.map((s) => [s.id, s.determines]),
            [
                ['SI-DEPTH-NEAR', ['c:restated:GF2:GF2-03.e::S5']],
                ['SI-DEPTH-FAR', ['c:restated:GF2:GF2-03.f::S5']],
            ],
        )
        const citing = r.sentences.filter((s) => s.joined.some((j) => j === 'c:restated:GF2:GF2-03.e::S5' || j === 'c:restated:GF2:GF2-03.f::S5'))
        assert.ok(citing.length >= 1, id)
        // The ILLUSTRATIVE label reaches every sentence citing a zone's depth: as its weakest label, or listed among its other labels (the
        // zone sentence also cites the zones' full width, a justified default on an ASSUMED bound, class 6).
        const illustrative = `${classLabel(5)}; ${VALUE_LABELS.ILLUSTRATIVE}`
        for (const s of citing) assert.ok(s.label === VALUE_LABELS.ILLUSTRATIVE || s.otherLabels.indexOf(illustrative) >= 0, `${id}: ${s.text}: ${s.label} / ${s.otherLabels.join(' / ')}`)
        const zone = citing.find((s) => s.text === 'Mark a 5 m end zone across the full width at each end')
        assert.deepEqual([zone?.sixClass, zone?.label, zone?.otherLabels.indexOf(illustrative) !== -1], [6, 'OURS: assumption in our restatement', true], id)
    }
})

test('the no-offside sentence rests on Christian\'s provisional ruling (class 3), and the session lines are ILLUSTRATIVE (A05) or coach input within a ruled bound (A01)', () => {
    const a05 = byCase(resultsOnce(), 'A05-2')
    const offside = a05.sentences.find((s) => s.text === 'There is no offside')
    assert.deepEqual([offside?.sixClass, offside?.label, offside?.joined], [3, 'RULING, provisional', ['defaultLaws:LAW-11']])
    const players = a05.lines.find((l) => l.path === 'envelope.players')
    assert.deepEqual([players?.sixClass, players?.label, players?.decisionKind, players?.decisionKindContextual], [5, VALUE_LABELS.ILLUSTRATIVE, 'A', true])
    const a01Players = byCase(resultsOnce(), 'A01').lines.find((l) => l.path === 'envelope.players')
    assert.deepEqual([a01Players?.sixClass, a01Players?.label], [3, 'coach input, within a ruled bound (RULING, provisional)'])
})

test('the purpose\'s source evidence and approval evidence are printed apart, and the approval evidence claims no dated approval', () => {
    const report = evidenceOf(resultsOnce()).report
    for (const r of resultsOnce().filter((x) => x.purpose)) {
        assert.notEqual(r.purpose?.sourceEvidence, r.purpose?.approvalEvidence)
        assert.ok(report.includes(`   Purpose, source evidence: ${r.purpose?.sourceEvidence}`), r.caseId)
        assert.ok(report.includes(`   Purpose, approval evidence (kept apart): ${r.purpose?.approvalEvidence.split('"').join("'")}`), r.caseId)
    }
    for (const goal of ['A05', 'A01', 'TA01']) assert.equal(k.planning.learning_goals.find((g) => g['ID'] === goal)?.['Status'], 'Active', `${goal}: the row reads Active, as the approval evidence says`)
})

test('every configuration carries the line that productive, recurring opportunities are not established', () => {
    assert.equal(OPPORTUNITIES_NOT_ESTABLISHED, 'Productive, recurring opportunities to meet the intended Game Problem: not established (no approved relationship ties a Game Problem to any line)')
    const report = evidenceOf(resultsOnce()).report
    for (const r of resultsOnce()) {
        assert.equal(r.opportunities, OPPORTUNITIES_NOT_ESTABLISHED, r.caseId)
        const at = report.indexOf(`== CASE ${r.caseId}:`)
        const next = report.indexOf('== CASE ', at + 1)
        assert.ok(report.slice(at, next < 0 ? undefined : next).includes(`17. ${OPPORTUNITIES_NOT_ESTABLISHED}`), r.caseId)
    }
})

test('the grading tables are checked against their sources: the specification\'s standing decisions, the contracts, the choices files', () => {
    const spec = fs.readFileSync(path.join(WT, 'docs', 'design', 'game-representation-spec-2026-09-18.md'), 'utf8').split('\n')
    for (const sd of inputs.grading.standingDecisions) {
        const row = spec[sd.specLine - 1]
        assert.ok(row.startsWith(`| ${sd.id} |`), `${sd.id} at line ${sd.specLine}`)
        const cells = row.split('|').map((x) => x.trim()).filter(Boolean)
        assert.ok(cells[cells.length - 1].includes(sd.sourceCell), `${sd.id}: its source cell names ${sd.sourceCell}`)
        assert.ok(spec[sd.referenceLine - 1].startsWith(`- **${sd.sourceCell}** ${sd.reference}`), `${sd.sourceCell} at line ${sd.referenceLine} is ${sd.reference}`)
    }
    // Every standing decision a case's lines rest on is in the table (the grading throws otherwise): pinned, so a new one is seen.
    const met = [...new Set(resultsOnce().flatMap((r) => r.lines.flatMap((l) => l.premises.filter((p) => p.kind === 'STANDING_DECISION').map((p) => p.ref.split(' ')[0]))))].sort()
    assert.deepEqual(met, inputs.grading.standingDecisions.map((x) => x.id).filter((id) => met.indexOf(id) >= 0))
    // Each source's printed standing is the review pathway's own standing for it (the module's: its own status DRAFT, read as CANDIDATE), and
    // each marker is one that some restated item's evidence really cites.
    const evidence = [...loadCorpusContracts(), ...loadDraftStore('ta02-composition').contracts].flatMap((c) => c.items.map((i) => (typeof i.basisEvidence === 'string' ? i.basisEvidence : JSON.stringify(i.basisEvidence ?? ''))))
    for (const src of inputs.grading.sources) {
        if (src.knowledgeSource === null) {
            // A source the review pathway's table has no entry for (review of 7 November): its printed standing is checked against the file's
            // own status fields, each of whose values it must name.
            assert.ok(src.ownStatus, `${src.id}: a source outside the review pathway's table names the file's own status fields`)
            const own = readJson(path.join(HERE, '..', src.ownStatus.file)).metadata as Record<string, string>
            for (const field of src.ownStatus.fields) assert.ok(own[field] && src.sourceStanding.indexOf(`${field} '${own[field]}'`) >= 0, `${src.id}: the printed standing names ${field} '${own[field]}'`)
            assert.ok(src.sourceStanding.startsWith('CANDIDATE') && own.workbook_version.indexOf('CANDIDATE') >= 0, `${src.id}: CANDIDATE, as the file's own version says`)
        } else {
            const standing = sourceStanding(k, src.knowledgeSource)
            assert.ok(src.sourceStanding.startsWith(standing === 'CANDIDATE' ? 'DRAFT' : standing), `${src.id}: printed ${src.sourceStanding}, the review pathway's standing ${standing}`)
        }
        for (const m of src.markers) assert.ok(evidence.some((e) => e.indexOf(m) >= 0), `${src.id}: no restated item cites ${m}`)
    }
    const moduleFile = readJson(path.join(HERE, '..', 'sport-module', 'soccer-module.rc1-v3.json'))
    assert.equal(moduleFile.metadata.module_status, 'DRAFT', 'the module\'s own status, as the table prints it')
    assert.equal(sourceStanding(k, 'sportModule'), 'CANDIDATE')
    for (const f of inputs.grading.choiceFiles) {
        const file = readJson(path.join(AUDITS, f.file))
        if (f.standing === 'OURS') assert.ok(String(file.note).includes('REALIZER\'s input, not knowledge'), f.file)
        else for (const c of file.choices ?? []) if (c.value !== undefined) assert.equal(c.category, 'PROVISIONAL_REALIZATION_CHOICE', `${f.file} ${c.lineId}`)
    }
})

test('a malformed TEST-ONLY realization is refused by the realization gate before any build', () => {
    const good = realizationEntry({ id: 'TEST-ONLY-H9', realizes: 'RPC-003', ruledOn: '2026-11-07', by: 'Christian', citedAs: 'TEST-ONLY', words: ['TEST-ONLY'], departures: [{ law: 'LAW-11', extent: 'WHOLE', because: 'TEST-ONLY', words: ['TEST-ONLY'], citedAs: 'TEST-ONLY' }], lawsCheck: { mode: 'REPORT', because: 'TEST-ONLY', words: ['TEST-ONLY'], citedAs: 'TEST-ONLY' } })
    assert.ok(gatedRealizations(good).some((r) => r.provisionalId === 'TEST-ONLY-H9'), 'bite: the well-formed copy loads')
    assert.throws(() => gatedRealizations({ ...good, words: [] }), /quotes none of/)
    assert.throws(() => gatedRealizations({ ...good, departsFrom: [{ law: 'LAW-11', because: 'x', basis: { words: ['x'], citedAs: 'x' }, extent: 'WHOLE' }], defaultLawsCheck: undefined }), /declares no default-laws check/)
})

test('the time-boxed attempt: the coach-served end-line restart in Christian\'s words does not compose; where it stops, pinned', () => {
    // A05-2's and A05-1's requests with the restart added to the TEST-ONLY realization as items in Christian's words (N7:96 and N7:89; the
    // typing ours). DESIGN 3.5 asks for both runs; A05-1 is measured since S3b.
    const caseById = (id: string) => {
        const c = inputs.cases.find((x) => x.id === id)
        assert.ok(c, id)
        return c
    }
    const restart = inputs.rulings.find((r) => r.id === 'HO-07NOV-RESTART')
    assert.ok(restart)
    const ITEM = { valueStatus: 'REQUIRED_RANGE', strictness: 'REQUIRED', scope: 'WHOLE_GAME', basis: 'OWNER_RULING', checkability: 'STRUCTURAL', structuralClause: 'whole item', category: 'PROVISIONAL_REALIZATION_CHOICE', words: restart.words[0], citedAs: 'Christian\'s reply received 7 November 2026', basisEvidence: 'TEST-ONLY diagnostic: the typing of these items is ours', choice: 'the coach-served end-line restart (TEST-ONLY diagnostic)' }
    const location = 'The location should avoid producing trivial scores directly from the serve while allowing play to develop naturally.'
    const items = [
        { id: 'A05-H1-T1-1', row: 'T1', selector: 'trigger=OUT_END_LINE', requirement: 'EXISTS', value: 'N/A', ...ITEM, valueStatus: 'N/A' },
        { id: 'A05-H1-T1a-1', row: 'T1a', selector: 'trigger=OUT_END_LINE', requirement: 'EQUALS', value: 'EACH_TEAM', ...ITEM },
        { id: 'A05-H1-T2-1', row: 'T2', selector: 'trigger=OUT_END_LINE', requirement: 'EQUALS', value: 'NOT_LAST_TOUCH', ...ITEM },
        { id: 'A05-H1-T3-1', row: 'T3', selector: 'trigger=OUT_END_LINE', requirement: 'EQUALS', value: 'COACH', ...ITEM },
        { id: 'A05-H1-T5-1', row: 'T5', selector: 'trigger=OUT_END_LINE', requirement: 'EQUALS', value: 'SERVED', ...ITEM },
        { id: 'A05-H1-T6-1', row: 'T6', selector: 'trigger=OUT_END_LINE', requirement: 'EQUALS', value: 'STOP_RESUME', ...ITEM },
        { id: 'A05-H1-T4-1', row: 'T4', selector: 'trigger=OUT_END_LINE', requirement: 'RANGE', value: location, ...ITEM, words: location },
    ]
    const T7_STAND_IN = { id: 'A05-H1-T7-1', row: 'T7', selector: 'trigger=OUT_END_LINE', requirement: 'EQUALS', value: 'true', ...ITEM, basisEvidence: 'TEST-ONLY diagnostic stand-in (TEST ASSUMPTION): no ruling of Christian\'s says whether the restart begins an episode' }
    let seenContracts: ChainAnswer['contracts'] = []
    // The selection and contracts each build derived from (for the chain's own account of a structure refusal, `refusalDetailOf`).
    let seenSelection: any = null
    let seenDerivedFrom: LoadedContract[] = []
    let seenSession: ReturnType<typeof sessionOf> | null = null
    const build = (withItems: Record<string, unknown>[], closeLocation: boolean, caseId = 'A05-2') => {
        let request: ChainRequest | null = null
        const capture: HandoffChain = { build: (r) => ((request = r), realChain.build(r)) }
        runHandoffCases({ ...inputs, cases: [caseById(caseId)] }, capture, k)
        const r = request as unknown as ChainRequest
        seenSession = sessionOf(r.session)
        const entry = { ...realizationEntry(r.realization as NonNullable<ChainRequest['realization']>), items: withItems }
        const sel = (selection: any) => {
            selection.selected = [{ id: r.formId, role: 'game form' }, ...selection.selected.filter((e: any) => e.role !== 'game form')]
            seenSelection = selection
        }
        const alter = (contracts: LoadedContract[]) => {
            for (const w of r.withhold) {
                const contract = contracts.find((c) => c.contractId === w.contractId) as LoadedContract
                contract.items = contract.items.filter((i) => w.itemIds.indexOf(i.itemId) < 0)
            }
            for (const s of r.standIns) (contracts.find((c) => c.contractId === s.contractId) as LoadedContract).items.push(copy(s.item) as any)
            seenDerivedFrom = copy(contracts)
            const drafted = new Set(loadDraftStore('ta02-composition').contracts.map((c) => c.contractId))
            seenContracts = contracts.map((c) => ({
                contractId: c.contractId,
                origin: c.contractId.startsWith('provisional:') ? ('REALIZATION' as const) : drafted.has(c.contractId) ? ('DRAFT_STORE' as const) : ('KNOWLEDGE' as const),
                items: c.items.map((i: any) => ({ itemId: String(i.itemId), row: String(i.row), basis: String(i.basis), category: i.category ? String(i.category) : null, basisEvidence: String(i.basisEvidence ?? '') })),
            }))
        }
        const supplied = (s: SuppliedRealization) => {
            for (const ch of r.choices) (s.choices.find((c) => c.lineId === ch.lineId) as { value: unknown }).value = ch.value
            if (closeLocation) s.choices.push({ lineId: 'c:provisional:A05-H1:A05-H1-T1-1::T4', value: { coachDecides: location } as any, because: 'TEST-ONLY diagnostic: the coach decides, within Christian\'s qualitative condition' })
        }
        const records = [...productionRecords, { ...(r.records as any), excluded: [], manipulations: [] }]
        return buildActivityUnderAuthorizationRecords({ kind: 'learning-goal', goalId: 'A05', session: sessionOf(r.session) }, records, { review: { includeDrafts: true }, drafts: loadDraftStore('ta02-composition'), realizations: gatedRealizations(entry), alterSelection: sel, alter, alterSupplied: supplied, communicationSupplement: withReviewStructureWording }).activity
    }
    // The chain's own account behind a structure refusal of the last build (`refusalDetailOf`, which throws unless it reproduces the refusal).
    const detailOfLast = (a: RefusedActivity) => refusalDetailOf(seenSelection, seenDerivedFrom, seenSession as ReturnType<typeof sessionOf>, a.stage, a.reasons)
    const inWords = build(items, false)
    const inWordsContracts = seenContracts
    assert.deepEqual([inWords.outcome, (inWords as RefusedActivity).stage, (inWords as RefusedActivity).reasons], ['refused', 'structure', ['Gate A is FAIL', 'a pre-realization Gate A invariant fails: GA-NO-FAILED-LINE', '1 unresolved property is neither an authorized choice nor an authorized claim: c:provisional:A05-H1:A05-H1-T1-1::T7']])
    const inWordsDetail = detailOfLast(inWords as RefusedActivity)
    // Diagnostic only (a TEST ASSUMPTION for the episode line, and the coach-decided location closed): structure, realization and validation
    // pass, and the build stops at communication, because no sentence exists for a restart the coach serves.
    const diagnostic = build([...items, T7_STAND_IN], true) as RefusedActivity
    const diagnosticContracts = seenContracts
    assert.deepEqual([diagnostic.outcome, diagnostic.stage], ['refused', 'communication'])
    const T = 'transitions[c:provisional:A05-H1:A05-H1-T1-1]'
    assert.deepEqual(diagnostic.reasons, [
        `fidelity Q3: ${T}.qualifiers.lastTouch is established by the game and no instruction carries it`,
        `fidelity Q3: ${T}.awardedTo is established by the game and no instruction carries it`,
        `fidelity Q3: ${T}.placement.actor is established by the game and no instruction carries it`,
        `fidelity Q3: ${T}.placement.method is established by the game and no instruction carries it`,
        `fidelity Q3: ${T}.playState is established by the game and no instruction carries it`,
        `fidelity Q3: ${T}.placement.region is established by the game and no instruction carries it`,
        `fidelity Q3: ${T}.startsEpisode was excluded as accounting metadata, but its operational consequence(s) ${T}.playState, ${T}.awardedTo reached no instruction — so the exclusion is not permitted`,
    ])
    // A05-1 (S3b): the same items, in Christian's words, on the run that keeps the drafted control items: refused at structure on both the
    // drafted control line and the restart's episode line; with the diagnostic TEST ASSUMPTION and the location closed, the control line alone.
    const a051 = build(items, false, 'A05-1') as RefusedActivity
    const a051Contracts = seenContracts
    assert.deepEqual([a051.outcome, a051.stage, a051.reasons], ['refused', 'structure', ['Gate A is FAIL', 'a pre-realization Gate A invariant fails: GA-NO-FAILED-LINE', '2 unresolved properties are neither an authorized choice nor an authorized claim: c:provisional:A05-H1:A05-H1-T1-1::T7, c:restated:RPC-003:RPC-003-12.a::V5']])
    const a051Detail = detailOfLast(a051)
    const a051Diagnostic = build([...items, T7_STAND_IN], true, 'A05-1') as RefusedActivity
    assert.deepEqual([a051Diagnostic.outcome, a051Diagnostic.stage, a051Diagnostic.reasons], ['refused', 'structure', ['Gate A is FAIL', 'a pre-realization Gate A invariant fails: GA-NO-FAILED-LINE', '1 unresolved property is neither an authorized choice nor an authorized claim: c:restated:RPC-003:RPC-003-12.a::V5']])
    // What the refusals in Christian's words rest on (Christian's second reply of 7 November, section 2). The restart items are graded by
    // Christian's own label for this restart, which the test reads from the ruling's words (the realization gate types them OWNER_RULING
    // only because a provisional realization's items must carry that basis; that typing is not changed).
    assert.ok(restart.words[0].indexOf('illustrative coach-served restart') >= 0, 'Christian labels this restart illustrative')
    const labelled = [{ contractId: 'provisional:A05-H1', itemIds: items.map((i) => i.id), rulingRef: 'HO-07NOV-RESTART', label: 'ILLUSTRATIVE' as const, why: 'these items are our TEST-ONLY typing, for a diagnostic, of the restart that ruling asks for' }]
    const inWordsBasis = refusalBasisOfBuild(caseById('A05-2'), inputs, 'structure', (inWords as RefusedActivity).reasons, inWordsContracts, { detail: inWordsDetail, labelled })
    const a051Basis = refusalBasisOfBuild(caseById('A05-1'), inputs, 'structure', a051.reasons, a051Contracts, { detail: a051Detail, labelled })
    const diagnosticBasis = refusalBasisOfBuild(caseById('A05-2'), inputs, 'communication', diagnostic.reasons, diagnosticContracts, { labelled })
    // Measured (review of 7 November): the chain classes the episode line 'claimed but unresolved' over other objects' declarations alone (the
    // realization that establishes the restart declares nothing on the row), so no item establishes or claims it: a gap. The drafted control
    // line's own contract (our DRAFT) declares on its row, so it is read through its DRAFT item, as in A05-0 and A05-1.
    const T7 = 'c:provisional:A05-H1:A05-H1-T1-1::T7'
    assert.deepEqual([inWordsBasis.verdict, inWordsBasis.cited.map((x) => x.ref), inWordsBasis.gaps.map((g) => g.ref), inWordsBasis.mix], ['NOT KNOWLEDGE', [], [T7], 'none'])
    assert.deepEqual([a051Basis.verdict, a051Basis.cited.map((x) => [x.ref, x.basis, x.premiseKind]), a051Basis.gaps.map((g) => g.ref), a051Basis.mix], ['RESTATEMENT-ONLY', [['c:restated:RPC-003:RPC-003-12.a::V5', 'AUTHORED', 'DRAFT_ITEM']], [T7], '1 AUTHORED (DRAFT store item)'])
    assert.ok(inWordsBasis.gaps[0].element.indexOf(VALUE_LABELS.ILLUSTRATIVE) >= 0, 'the restart item is graded ILLUSTRATIVE, by Christian\'s label')
    assert.deepEqual([diagnosticBasis.verdict, diagnosticBasis.why], ['NOT KNOWLEDGE', 'the refusal cites no item: a renderer capability gap: the checked renderer has no sentence for what the game establishes (fidelity Q3)'])
    // The configurations the chain would serve hold no restart for a ball over an end line (asserted, not assumed).
    for (const id of ['A05-2', 'GF2-ZONES', 'GF2-LINES']) assert.ok(byCase(resultsOnce(), id).gaps.indexOf('game::RP1 (restartPolicy.deadBall): not established') >= 0, `${id}: no dead-ball restart policy is established`)
    assert.deepEqual(byCase(resultsOnce(), 'A05-2').lawEntries.filter((e) => e.law === 'LAW-16' || e.law === 'LAW-17').map((e) => [e.lineId, e.status]), [['defaultLaws:LAW-16:end 0', 'NOT_APPLICABLE'], ['defaultLaws:LAW-16:end 1', 'NOT_APPLICABLE'], ['defaultLaws:LAW-17:end 0', 'NOT_APPLICABLE'], ['defaultLaws:LAW-17:end 1', 'NOT_APPLICABLE']])
    for (const id of ['GF2-ZONES', 'GF2-LINES']) assert.ok((byCase(resultsOnce(), id).laws?.owed ?? []).every((o) => o.slice(0, 6) !== 'LAW-16' && o.slice(0, 6) !== 'LAW-17'), `${id}: no goal-line or corner adaptation is owed`)
    const obstructs = 'not for the configurations the chain would serve, which are built without the restart; but it is a structural refusal, so it is not reported as a refinement. Those configurations (A05-2 and the two GF2 structural cases) hold no restart for a ball over an end line: game::RP1 (the dead-ball restart policy) is not established in any of them; in A05-2 Laws 16 and 17 read not applicable at both ends (no goals), and the GF2 laws accounts owe neither; no departure from either is recorded. Christian\'s first reply of 7 November, section 5, says a game without conventional goals may require a different end-line restart, as an example of a structural adaptation needed to make a Game Form playable, which is still to be examined for unintended effects; whether its absence is a foundational blocker is Christian\'s to place. Only the restart\'s exact location, the coach\'s position and delivery are routine details (Christian\'s second reply of 7 November, section 5)'
    testRefusals.push({ where: 'test R1 (A05-2 with the restart items in Christian\'s words)', basis: inWordsBasis, obstructs })
    testRefusals.push({ where: 'test R1 (A05-1 with the restart items in Christian\'s words)', basis: a051Basis, obstructs })
    testRefusals.push({
        where: 'test R1, diagnostic only (A05-2 with the restart items and a TEST ASSUMPTION that the restart begins an episode; it ran only under that assumption)',
        basis: diagnosticBasis,
        obstructs: 'no for any case: a diagnostic under a TEST ASSUMPTION; it shows what a restart the coach serves would meet next: the checked renderer names no coach as taker and has no served-ball phrase',
    })
    return [
        `A05-2 with the restart items (end-line trigger, last-touch partition for each team, the team that did not touch it last, the coach as taker, a served ball, play stopped and resumed, the location under N7:89): refused at structure: ${(inWords as RefusedActivity).reasons.join('; ')}`,
        `A05-1 with the same items: refused at structure: ${a051.reasons.join('; ')}`,
        'no ruling of Christian\'s says whether this restart begins an episode, so no episode item is added to any case; the restart does not compose from Christian\'s words, and no DRAFT restart sentence was added to the review-only wording',
        `diagnostic only, never a case: with a TEST ASSUMPTION that the restart begins an episode and the coach-decided location closed, A05-2 passes structure, realization and validation and is refused at communication (${diagnostic.reasons.length} fidelity reasons: no instruction carries the restart's last touch, award, taker, method, play state or location; the renderer names no coach as taker and has no served-ball phrase); A05-1 is still refused at structure on the drafted control line alone`,
        `what the refusals rest on: A05-2 ${inWordsBasis.verdict} (${inWordsBasis.why}); A05-1 ${a051Basis.verdict} (${a051Basis.why}); the restart items are graded by Christian's own label for this restart (illustrative), not by the basis the realization gate requires of them`,
        'no engine feature was built (the attempt is time-boxed); the restart stays described in the report only, under the unexpected limitations of the checked pathway',
    ]
})

// ---------------------------------------------------------------------------------------------------------------------------------------
// Second: valid changes are reusable (Test A; Christian's reply of 7 November, section 11: "Changes to authorized parameters or legitimate
// session inputs produce corresponding changes in the structured activity and coach instructions.")
// ---------------------------------------------------------------------------------------------------------------------------------------

/** A session change on a case: the variant's session and its illustrative entry change together. */
const sessionVariant = (baseId: string, tag: string, change: Partial<CaseInput['session']>, illustrative: Record<string, string>) =>
    variantOf(baseId, `${baseId}/${tag}`, `${baseId} with ${tag} (a Test A variant)`, (c) => {
        Object.assign(c.session, change)
        for (const i of c.illustrative) if (illustrative[i.id] !== undefined) i.value = illustrative[i.id]
    })

test(
    '12 -> 10 players on the A05 route (A05-2, CONDITIONAL; not A05\'s result) and on generic GF2 zones: exactly the players sentence, the two team sizes and the diagram\'s counts change',
    () => {
        const out: string[] = []
        for (const baseId of ['A05-2', 'GF2-ZONES']) {
            const v = runVariant(sessionVariant(baseId, 'players-10', { players: 10 }, { 'IL-PLAYERS': '10, no specialized role' }))
            const { cmp, lines } = compared('A1', byCase(resultsOnce(), baseId), v)
            assert.deepEqual(cmp.outcome, ['served', 'served'], baseId)
            assert.deepEqual(cmp.sentences.changed, [{ section: 'Players', before: 'Divide 12 players into 2 teams of 6, with no goalkeepers', after: 'Divide 10 players into 2 teams of 5, with no goalkeepers', fromChanged: false, gradeBefore: ILLUSTRATIVE_GRADE, gradeAfter: ILLUSTRATIVE_GRADE, wordingBefore: 'DRAFT', wordingAfter: 'DRAFT' }], baseId)
            assert.deepEqual(cmp.sentences.keptButChanged, [], baseId)
            assert.deepEqual(cmp.lines.changed.map((l) => [l.lineId, l.before, l.after, l.gradeAfter]), [['game::E1', 12, 10, ILLUSTRATIVE_GRADE], ['assembly:performers.teams[c:restated:GF2:GF2-14.a#1]::P2', 6, 5, ILLUSTRATIVE_GRADE], ['assembly:performers.teams[c:restated:GF2:GF2-14.a#2]::P2', 6, 5, ILLUSTRATIVE_GRADE]], baseId)
            // Re-pinned openly (review of 7 November: the comparison now reads the diagram's dimensions, targets and teams too): before ['counts'].
            assert.deepEqual([cmp.lines.added, cmp.lines.removed, cmp.diagram.changed, cmp.diagram.after?.counts, v.chain?.fidelityViolations], [[], [], ['counts'], ['2 teams of 5'], 0], baseId)
            out.push(...lines, baseId === 'A05-2' ? A05_2_NOTE : GF2_STAND_IN_NOTE)
        }
        return out
    },
    { id: 'A1', group: SECOND, cites: 'N7:152-154, N7:126-128', shows: 'a legitimate session change (players) produces exactly the corresponding changes in lines, text and diagram, on the A05 route and on generic GF2 zones, through the same code; each changed sentence keeps the label of its new premise (an illustrative session input)' },
)

test(
    '40 x 30 -> 50 x 35 m on A05-2 (CONDITIONAL; not A05\'s result) and GF2 zones: exactly the area sentence, the two dimension lines and the diagram\'s area, zones, dimension labels, targets and teams change',
    () => {
        const out: string[] = []
        for (const baseId of ['A05-2', 'GF2-ZONES']) {
            const v = runVariant(sessionVariant(baseId, 'area-50x35', { lengthM: 50, widthM: 35 }, { 'IL-AREA': '50 x 35 m' }))
            const { cmp, lines } = compared('A2', byCase(resultsOnce(), baseId), v)
            assert.deepEqual(cmp.sentences.changed, [{ section: 'Set up', before: 'Mark out an area 40 m long by 30 m wide', after: 'Mark out an area 50 m long by 35 m wide', fromChanged: false, gradeBefore: ILLUSTRATIVE_GRADE, gradeAfter: ILLUSTRATIVE_GRADE, wordingBefore: 'DRAFT', wordingAfter: 'DRAFT' }], baseId)
            assert.deepEqual(cmp.sentences.keptButChanged, [], baseId)
            assert.deepEqual(cmp.lines.changed.map((l) => [l.lineId, l.before, l.after]), [['game::E2', 40, 50], ['game::E3', 30, 35]], baseId)
            // Re-pinned openly (review of 7 November: the comparison now reads the diagram's dimensions, targets and teams too): measured before
            // ['area', 'zones'], after ['area', 'zones', 'dimensions', 'targets', 'teams'] (the dimension labels, the targets and the ends the
            // teams attack follow the new area).
            assert.deepEqual([cmp.lines.added, cmp.lines.removed, cmp.diagram.changed, v.chain?.fidelityViolations], [[], [], ['area', 'zones', 'dimensions', 'targets', 'teams'], 0], baseId)
            assert.deepEqual([cmp.diagram.after?.area, cmp.diagram.after?.zones], [{ lengthM: 50, widthM: 35 }, [{ zone: 'c:restated:GF2:GF2-03.e', along: { from: 0, to: 5 }, across: { from: 0, to: 35 } }, { zone: 'c:restated:GF2:GF2-03.f', along: { from: 45, to: 50 }, across: { from: 0, to: 35 } }]], baseId)
            out.push(...lines, baseId === 'A05-2' ? A05_2_NOTE : GF2_STAND_IN_NOTE)
        }
        return out
    },
    { id: 'A2', group: SECOND, cites: 'N7:152-154, N7:126-128', shows: 'a legitimate session change (dimensions) changes exactly the area sentence, the dimension lines and the diagram (area; the zones, which keep their 5 m depth and run the new full width; and the dimension labels, targets and teams that follow them), over the whole compared diagram' },
)

test(
    '18 -> 24 minutes on A05-2 (CONDITIONAL; not A05\'s result) and GF2 zones: exactly the duration sentence and line change; the diagram is identical',
    () => {
        const out: string[] = []
        for (const baseId of ['A05-2', 'GF2-ZONES']) {
            const v = runVariant(sessionVariant(baseId, 'duration-24', { durationMin: 24 }, { 'IL-DURATION': '24 minutes' }))
            const { cmp, lines } = compared('A3', byCase(resultsOnce(), baseId), v)
            assert.deepEqual(cmp.sentences.changed, [{ section: 'When it ends', before: 'Play for 18 minutes', after: 'Play for 24 minutes', fromChanged: false, gradeBefore: ILLUSTRATIVE_GRADE, gradeAfter: ILLUSTRATIVE_GRADE, wordingBefore: 'DRAFT', wordingAfter: 'DRAFT' }], baseId)
            assert.deepEqual([cmp.sentences.keptButChanged, cmp.lines.changed.map((l) => [l.lineId, l.before, l.after]), cmp.lines.added, cmp.lines.removed, cmp.diagram.changed, v.chain?.fidelityViolations], [[], [['game::E4', 18, 24]], [], [], [], 0], baseId)
            out.push(...lines, baseId === 'A05-2' ? A05_2_NOTE : GF2_STAND_IN_NOTE)
        }
        return out
    },
    { id: 'A3', group: SECOND, cites: 'N7:152-154, N7:126-128', shows: 'a legitimate session change (duration) changes exactly the duration sentence and line' },
)

test(
    'the ILLUSTRATIVE zone depth 5 -> 8 m on A05-2 (CONDITIONAL; not A05\'s result) and GF2 zones: only the zone sentence and the diagram\'s zones, dimension labels and targets change, and the sentence keeps the ILLUSTRATIVE label',
    () => {
        const out: string[] = []
        for (const baseId of ['A05-2', 'GF2-ZONES']) {
            const v = runVariant(
                variantOf(baseId, `${baseId}/depth-8`, `${baseId} with an 8 m illustrative zone depth (a Test A variant)`, (c) => {
                    for (const s of c.standIns) s.item.typedBound = { min: 8, max: 8 }
                    for (const i of c.illustrative) if (i.id === 'IL-DEPTH') i.value = '8 m at each end'
                }),
            )
            const { cmp, lines } = compared('A4', byCase(resultsOnce(), baseId), v)
            const zoneGrade = 'class 6; OURS: assumption in our restatement'
            assert.deepEqual(cmp.sentences.changed, [{ section: 'Set up', before: 'Mark a 5 m end zone across the full width at each end', after: 'Mark a 8 m end zone across the full width at each end', fromChanged: false, gradeBefore: zoneGrade, gradeAfter: zoneGrade, wordingBefore: 'DRAFT', wordingAfter: 'DRAFT' }], baseId)
            // Re-pinned openly (review of 7 November: the comparison now reads the diagram's dimensions, targets and teams too): measured before
            // ['zones'], after ['zones', 'dimensions', 'targets']; the teams do not change.
            assert.deepEqual([cmp.sentences.keptButChanged, cmp.lines.changed, cmp.lines.added, cmp.lines.removed, cmp.diagram.changed, v.chain?.fidelityViolations], [[], [], [], [], ['zones', 'dimensions', 'targets'], 0], baseId)
            assert.deepEqual(cmp.diagram.after?.zones, [{ zone: 'c:restated:GF2:GF2-03.e', along: { from: 0, to: 8 }, across: { from: 0, to: 30 } }, { zone: 'c:restated:GF2:GF2-03.f', along: { from: 32, to: 40 }, across: { from: 0, to: 30 } }], baseId)
            const zone = v.sentences.find((s) => s.text === 'Mark a 8 m end zone across the full width at each end')
            assert.ok(zone && zone.otherLabels.indexOf(`${classLabel(5)}; ${VALUE_LABELS.ILLUSTRATIVE}`) >= 0, `${baseId}: the illustrative depth's label stays on the sentence`)
            out.push(
                ...lines,
                `the variant's zone sentence still lists, among its other classes and labels: '${classLabel(5)}; ${VALUE_LABELS.ILLUSTRATIVE}'`,
                'configuration lines hold position terms, not extents: \'lines identical\' covers the terms\' values only; the depth itself is carried by the two stand-in items, whose change the zone sentence and the diagram show',
                baseId === 'A05-2' ? A05_2_NOTE : GF2_STAND_IN_NOTE,
            )
        }
        return out
    },
    { id: 'A4', group: SECOND, cites: 'N7:152-154, N7:157', shows: 'an illustrative value (the zone depth, carried by a labelled stand-in) changes only what says it: the zone sentence and the drawn zone depths (zones, their dimension labels, targets); it stays labelled ILLUSTRATIVE' },
)

test(
    'A01 12 -> 11 players (within its ruled testing boundaries): exactly 2 of its 29 sentences change, with the lines that carry them',
    () => {
        const v = runVariant(sessionVariant('A01', 'players-11', { players: 11 }, {}))
        const { cmp, lines } = compared('A5', byCase(resultsOnce(), 'A01'), v)
        assert.deepEqual([cmp.outcome, cmp.sentences.before, cmp.sentences.after, cmp.sentences.kept], [['served', 'served'], 29, 29, 27])
        assert.deepEqual(
            cmp.sentences.changed.map((s) => [s.before, s.after, s.fromChanged]),
            [
                ['Divide 12 players into 2 teams: the building team has 6 outfield players and 1 goalkeeper; the pressing team has 5 outfield players', 'Divide 11 players into 2 teams: the building team has 5 outfield players and 1 goalkeeper; the pressing team has 5 outfield players', false],
                ['When you call the next block, 1 goalkeeper and 1 outfield player move to the team that becomes the building team', 'When you call the next block, 1 goalkeeper moves to the team that becomes the building team', true],
            ],
        )
        assert.deepEqual(cmp.lines.changed.map((l) => [l.lineId, l.before, l.after]), [['game::E1', 12, 11], ['assembly:performers.teams[c:restated:GF2:GF2-14.a#1]::P2', 6, 5]])
        assert.deepEqual([cmp.lines.added, cmp.lines.removed], [[], ['c:provisional:A01-R1:A01-R1-B4-2::B5', 'c:provisional:A01-R1:A01-R1-B4-2::B6', 'c:provisional:A01-R1:A01-R1-B4-2::B7']])
        assert.equal(v.lines.find((l) => l.lineId === 'game::E1')?.label, 'coach input, within a ruled bound (RULING, provisional)')
        assert.equal(v.chain?.fidelityViolations, 0)
        return lines
    },
    { id: 'A5', group: SECOND, cites: 'N7:152-154; N7:12', shows: 'on A01\'s production records, a coach\'s session change within the ruled testing boundaries changes exactly the two sentences that depend on it (the team sizes, and who moves at the exchange, whose relative count resolves to none)' },
)

test(
    'GF2\'s open target noun, zone <-> line (an alternative our restatement of the DRAFT soccer module lists, CANDIDATE): structure, text and diagram change together and consistently',
    () => {
        const { cmp, lines } = compared('A6', byCase(resultsOnce(), 'GF2-ZONES'), byCase(resultsOnce(), 'GF2-LINES'))
        assert.deepEqual([cmp.outcome, cmp.sentences.before, cmp.sentences.after, cmp.sentences.kept], [['served', 'served'], 8, 8, 4])
        assert.deepEqual(
            cmp.sentences.changed.map((s) => [s.section, s.before, s.after]),
            [
                ['Set up', 'Mark a 5 m end zone across the full width at each end', 'Mark both end lines: they are the scoring lines'],
                ['How it works', 'When possession changes, play carries on without a stoppage, and each team keeps attacking the same target', 'When possession changes, play carries on without a stoppage, and each team keeps attacking the same line'],
                ['How to score', 'A team scores 1 point by getting the ball under control into its target zone: running it in, or passing to a teammate who receives it under control inside', 'A team scores 1 point by getting the ball across the line it is attacking'],
                ['How to score', 'Each team attacks the zone at the other team\'s end. Decide which team starts at which end; the ends stay the same for the whole game', 'Each team defends one line and attacks the other. Decide which team starts at which end; the ends stay the same for the whole game'],
            ],
        )
        assert.deepEqual(
            cmp.lines.changed.map((l) => [l.lineId, l.before, l.after]),
            [
                ['c:restated:GF2:GF2-03.e::S5', 'attacking end (of the team J3 names for the objective referencing it; EACH_TEAM if shared): touches an end line, not the interior', 'attacking end (of the team J3 names for the objective referencing it; EACH_TEAM if shared): touches an end line, not the interior'],
                ['c:restated:GF2:GF2-03.f::S5', 'attacking end (of the team J3 names for the objective referencing it; EACH_TEAM if shared): touches an end line, not the interior', 'attacking end (of the team J3 names for the objective referencing it; EACH_TEAM if shared): touches an end line, not the interior'],
                ['c:restated:GF2:GF2-03.e::S3', 'zone', 'line'],
                ['c:restated:GF2:GF2-03.f::S3', 'zone', 'line'],
                ['game::V1', 'target_zone_entered', 'line_crossed'],
            ],
        )
        // Re-pinned openly (review of 7 November: the comparison now reads the diagram's dimensions, targets and teams too): measured before
        // ['legend', 'zones'], after ['legend', 'zones', 'dimensions', 'targets']; the teams do not change.
        assert.deepEqual([cmp.diagram.changed, cmp.diagram.after?.legend, cmp.diagram.after?.zones], [['legend', 'zones', 'dimensions', 'targets'], ['target line'], []])
        // The line variant's sentence on who attacks what cites no line for the target noun (the live renderer's from-paths; unchanged).
        const lineSentence = byCase(resultsOnce(), 'GF2-LINES').sentences.find((s) => s.text.startsWith('Each team defends one line and attacks the other'))
        assert.ok(lineSentence && !lineSentence.from.some((p) => p.indexOf('.noun') >= 0) && lineSentence.sixClass === 2, 'the line sentence cites no noun line and grades class 2')
        return [
            ...lines,
            'the two along lines keep their value and change grade only: with zones their extent is the illustrative depth (a stand-in, class 5); with lines nothing bounds an extent',
            'a sentence\'s class covers only what its from-paths cite: \'Each team defends one line and attacks the other...\' says the target noun without citing the noun lines, so its class 2 overstates it (the noun \'line\' is our realization choice, class 6); the live renderer\'s from-paths are not changed',
            'no sentence is authored for either activity; the zone set-up sentence is decision 1\'s review-only template for reciprocal end zones (DRAFT, generic, not per activity)',
            GF2_STAND_IN_NOTE,
        ]
    },
    { id: 'A6', group: SECOND, cites: 'N7:152-154, N7:22-23', shows: 'choosing the other target our CANDIDATE restatement of the DRAFT soccer module lists (lines for zones) changes the open lines, every sentence that says them and the diagram, consistently; no sentence is authored for either activity (the zone set-up sentence is decision 1\'s review-only template for reciprocal end zones)' },
)

// ---------------------------------------------------------------------------------------------------------------------------------------
// Third: unsupported stays unsupported (Test B; section 11: "When knowledge is insufficient, the system identifies the missing relationship,
// retains alternatives where appropriate, and does not fabricate a selection.")
// ---------------------------------------------------------------------------------------------------------------------------------------

const WZA = 'tl-v0-constraint-wide-zone-advantage'
const manipulationVariant = (withRelationship: boolean, manipulation = WZA) =>
    variantOf('A05-2', `A05-2/manipulation${withRelationship ? '+relationship' : ''}/${manipulation}`, `A05-2 with ${manipulation} proposed for Create Space${withRelationship ? ', on a TEST-ONLY relationship stand-in' : ', with no authorized relationship'} (a Test B variant)`, (c) => {
        c.proposedManipulations = [
            {
                id: 'PM-CREATE-SPACE',
                purpose: 'GP-001 (Create Space)',
                manipulation,
                ...(withRelationship ? { relationship: { ref: 'TEST-ONLY-RELATIONSHIP-CS-WZA', label: 'TEST ASSUMPTION' as const, why: 'TEST-ONLY stand-in for an authorized relationship between Create Space and the manipulation, labelled TEST ASSUMPTION (class 4); never knowledge, never written to any knowledge file; it shows the mechanism applies a relationship once one exists' } } : {}),
            },
        ]
    })

test(
    'a manipulation proposed for Create Space with no authorized relationship is reported missing, and the configuration is identical',
    () => {
        const v = runVariant(manipulationVariant(false))
        const { cmp, lines } = compared('B1a', byCase(resultsOnce(), 'A05-2'), v)
        assert.deepEqual(v.manipulations.map((m) => [m.outcome, m.premise, m.placedContracts]), [[`no authorized relationship: GP-001 (Create Space) to ${WZA}; the configuration is unchanged`, null, []]])
        assert.deepEqual(cmp.identical, { lines: true, sentences: true, diagram: true })
        assert.deepEqual(v.chain?.constraints, [])
        return [`manipulation: ${v.manipulations[0].outcome}`, ...lines]
    },
    { id: 'B1a', group: THIRD, cites: 'N7:16, N7:155-157, N7:163-166', shows: 'with no authorized relationship between the Game Problem and the manipulation, nothing is added and the missing relationship is named' },
)

test(
    'the same manipulation on a TEST-ONLY relationship stand-in (TEST ASSUMPTION): applied, and every line it brings is graded no higher than class 4',
    () => {
        let request: ChainRequest | null = null
        const capture: HandoffChain = { build: (r) => ((request = r), realChain.build(r)) }
        const v = runHandoff(manipulationVariant(true), inputs, capture, k)
        const r = request as unknown as ChainRequest
        const { cmp, lines } = compared('B1b', byCase(resultsOnce(), 'A05-2'), v)
        assert.deepEqual([v.chain?.outcome, v.chain?.constraints, v.manipulations[0].placedContracts], ['served', [WZA], ['restated:WIDE-ZONE-ADVANTAGE']])
        assert.deepEqual([(r.records as Exclude<ChainRequest['records'], 'PRODUCTION'>).authorizedConstraints, r.place], [[], [{ id: WZA, manipulationId: 'PM-CREATE-SPACE', relationshipRef: 'TEST-ONLY-RELATIONSHIP-CS-WZA' }]])
        const brought = v.lines.filter((l) => l.kind !== 'NOT_ESTABLISHED' && l.lineId.startsWith('c:restated:WIDE-ZONE-ADVANTAGE:'))
        assert.ok(brought.length > 0)
        for (const l of brought) {
            assert.ok(l.premises.some((p) => p.kind === 'STAND_IN' && p.label === 'TEST ASSUMPTION' && p.sixClass === 4), `${l.lineId} rests on the relationship stand-in`)
            assert.ok(l.sixClass !== null && l.sixClass >= 4, `${l.lineId}: class ${l.sixClass}`)
        }
        const others = v.lines.filter((l) => !l.lineId.startsWith('c:restated:WIDE-ZONE-ADVANTAGE:'))
        assert.ok(others.every((l) => !l.premises.some((p) => p.ref.indexOf('TEST-ONLY-RELATIONSHIP-CS-WZA') >= 0)), 'no other line rests on the relationship')
        const modifier = v.sentences.find((s) => s.text.startsWith('A score is worth 2 instead of 1'))
        assert.deepEqual([modifier?.sixClass, modifier?.label], [4, 'TEST ASSUMPTION'])
        // The text is served (fidelity 0, the five added sentences); the checked coach diagram is withheld, because the channels' width is a
        // range the coach chooses within and the diagram will not draw one size for it (its own rule D0, measured).
        assert.deepEqual([cmp.sentences.after, cmp.sentences.kept, cmp.sentences.changed.filter((s) => s.before === null).length, v.chain?.fidelityViolations], [14, 9, 5, 0])
        assert.deepEqual([cmp.diagram.after?.served, cmp.diagram.after?.verdict, (cmp.diagram.after?.findings as Array<{ rule: string }>).map((f) => f.rule)], [false, 'WITHHELD', ['D0', 'D0']])
        return [
            `manipulation: ${v.manipulations[0].outcome}`,
            `the TEST-ONLY record's authorized set stays empty; the manipulation is placed in the selection; lines it brings (${brought.length}): ${brought.map((l) => `${l.lineId} class ${l.sixClass}`).join('; ')}`,
            'the placement bypasses bounded selection (whose record route refuses a lone manipulation: B1c) and the live route\'s check that refuses a served constraint no record authorizes; derivation, realization, validation, the hold and exclusion guards and communication still run, and no check is widened',
            'no representation or reader of approved relationships exists (none is represented for Create Space), and the input accepts only a TEST-ONLY stand-in: what is shown is the placement and grading path an authorized relationship would take, not that the mechanism reads one',
            ...lines,
        ]
    },
    { id: 'B1b', group: THIRD, cites: 'N7:17-18, N7:155-157', shows: 'the placement and grading path an authorized relationship would take, shown only on a labelled TEST-ONLY stand-in (class 4, never knowledge): the manipulation is applied and every line and sentence it brings carries that relationship as its ceiling; no representation or reader of approved relationships exists yet (none is represented for Create Space)' },
)

test(
    'why the manipulation is placed in the selection and not authorized in the record, and why it is the one used (measured on the chain directly)',
    () => {
        // A record-backed pool holding a lone manipulation: refused at selection. Measured on the chain itself with A05-2's request.
        let request: ChainRequest | null = null
        const capture: HandoffChain = { build: (r) => ((request = r), realChain.build(r)) }
        runHandoff(byCaseInput('A05-2'), inputs, capture, k)
        const r = request as unknown as ChainRequest
        const viaRecord = realChain.build({ ...r, records: { ...(r.records as Exclude<ChainRequest['records'], 'PRODUCTION'>), authorizedConstraints: [WZA] } })
        assert.deepEqual([viaRecord.outcome, viaRecord.stage], ['refused', 'selection'])
        assert.match(viaRecord.reasons[0], /NO_COMPATIBLE_COMBINATION/)
        // The other contracted manipulations, placed the same way on A05-2 with the same stand-in: which compose with GF2.
        const outcomes = ['tl-v0-constraint-neutral-player-condition', 'tl-v0-constraint-variable-target-condition'].map((id) => {
            const v = runVariant(manipulationVariant(true, id))
            return [id, v.chain?.outcome, v.refusal?.stage ?? null, v.refusal?.reasons.slice(1, 2)[0] ?? null]
        })
        assert.deepEqual(outcomes, [
            ['tl-v0-constraint-neutral-player-condition', 'served', null, null],
            ['tl-v0-constraint-variable-target-condition', 'refused', 'structure', 'a pre-realization Gate A invariant fails: GA-INFORMATION, GA-NO-FAILED-LINE'],
        ])
        // The record route's refusal is a refusal of the pathway an authorized manipulation would take (review of 7 November: listed with the
        // others). What it rests on was traced in the selection's source (test-library/generateSelection.ts) and is said in the note.
        const recordRoute = refusalBasisOfBuild(byCaseInput('A05-2'), inputs, String(viaRecord.stage), viaRecord.reasons, viaRecord.contracts)
        assert.deepEqual([recordRoute.verdict, recordRoute.why], ['NOT KNOWLEDGE', 'the refusal cites no item: an engine selection rule (NO_COMPATIBLE_COMBINATION)'])
        testRefusals.push({
            where: 'test B1c (A05-2 with the Wide Zone Advantage as the TEST-ONLY record\'s one authorized constraint: the record route)',
            basis: recordRoute,
            obstructs: 'yes: this is the route an authorized manipulation would take through a record; the handoff places an applied manipulation in the selection instead (B1b), which bypasses this check',
            notes: [
                'traced in the selection\'s source (test-library/generateSelection.ts): the size rule (2 to 3 lenses, and 2 to 4 constraints, or none at all only where a record authorizes none, under Christian\'s general principle of 15 October) and the role-mix rule are the engine\'s; no ruling of Christian\'s is cited for a lower bound of 2 or for the role mix, and the source marks the package checks\' foundation clause as unruled; the roles (foundation, shaping, consequence) are the engine\'s buckets of each Test Library constraint\'s constraintRole field; Christian\'s 14 October ruling that the selection cites governs which constraints may enter the pool (those authorized for the Learning Goal), not how many; with the record\'s one authorized constraint no combination of 2 to 4 exists, and the roles foundation and consequence stay unfilled',
            ],
        })
        const vt = runVariant(manipulationVariant(true, 'tl-v0-constraint-variable-target-condition'))
        if (vt.refusalBasis) testRefusals.push({ where: 'test B1c (A05-2 with the variable target condition placed on the stand-in)', basis: vt.refusalBasis, obstructs: 'no for this pathway: it shows only that this manipulation does not compose with GF2 here; the manipulation Test B uses composes' })
        return [
            `through the TEST-ONLY record's authorized set (${WZA} as its one constraint): refused at selection: ${viaRecord.reasons[0]}`,
            ...outcomes.map((o) => `placed the same way: ${o[0]}: ${o[1]}${o[2] ? ` at ${o[2]} (${o[3]})` : ''}`),
            `used in B1b: ${WZA}, which has a contract and a choices file and composes with GF2; the record route's refusal is reported as a limitation of the checked pathway (a record cannot authorize one manipulation alone)`,
        ]
    },
    { id: 'B1c', group: THIRD, cites: 'N7:188', shows: 'the measured reasons behind B1b\'s route: the checked pathway refuses a record that authorizes one manipulation alone (an unexpected limitation), and of the contracted manipulations two compose with GF2 on A05-2 and one does not' },
)

test(
    'the Game Problem swapped to Gain Access (a candidate) in the TEST-ONLY record: the configuration is identical, and the mismatch is reported, never switched',
    () => {
        const v = runVariant(
            variantOf('A05-2', 'A05-2/game-problem-GP-005', 'A05-2 with Gain Access in the TEST-ONLY record (a Test B variant)', (c) => {
                c.gameProblemOverride = { id: 'GP-005', label: 'TEST ASSUMPTION', why: 'Gain Access, a candidate relationship for A05, put into the record in a test only, to show that no line follows the Game Problem', rulingRefs: ['HO-05NOV-GAIN-ACCESS'] }
                c.rulings.push({ ref: 'HO-05NOV-GAIN-ACCESS', entersAs: 'REPORT_ONLY', how: 'Gain Access is a candidate relationship, not an approved addition: the swap is a TEST ASSUMPTION, never a selection' })
            }),
        )
        const { cmp, lines } = compared('B2', byCase(resultsOnce(), 'A05-2'), v)
        assert.deepEqual(cmp.identical, { lines: true, sentences: true, diagram: true })
        assert.deepEqual([v.receive.step1?.primary, v.receive.step1?.secondary], [['GP-001'], ['GP-002']], 'Step 1 stands')
        assert.match(String(v.chain?.gameProblemOverride), /^MISMATCH, reported and never switched: the TEST-ONLY record carries GP-005 \(TEST ASSUMPTION;/)
        assert.ok(v.lines.every((l) => l.premises.every((p) => p.ref.indexOf('GP-') < 0)), 'no line names a Game Problem among its premises')
        return [`Game Problem: ${v.chain?.gameProblemOverride}`, ...lines]
    },
    { id: 'B2', group: THIRD, cites: 'N7:139, N7:163-166', shows: 'no Game Problem determines any line today (the critical gap): swapping it leaves the configuration identical; the difference is reported and Step 1\'s resolution stands' },
)

test(
    'a value outside an open line\'s alternatives is refused by the chain (GF2 zones with a target noun outside the alternatives our CANDIDATE restatement admits)',
    () => {
        let answer: ChainAnswer | null = null
        const capture: HandoffChain = { build: (r) => (answer = realChain.build(r)) }
        const variant = variantOf('GF2-ZONES', 'GF2-ZONES/noun-outside', 'GF2 zones with a target noun outside the alternatives our CANDIDATE restatement admits (a Test B variant)', (c) => {
            c.proposedChoices = [{ id: 'PC-OUTSIDE', lineId: 'c:restated:GF2:GF2-03.e::S3', value: 'circle', why: 'TEST-ONLY: a value outside the alternatives our CANDIDATE restatement admits', rulingRefs: ['HO-07NOV-ILLUSTRATIVE'] }]
        })
        const v = runHandoff(variant, inputs, capture, k)
        // What bounds the line: the chain's own account names the line's permitted set and no bounding item (measured, review of 7 November), so
        // the reading goes through the element's item; the item on the line's own row is found here, by reading the contract the chain derived from.
        const a = answer as unknown as ChainAnswer
        const open = a.refusalDetail?.openLines.find((o) => o.lineId === 'c:restated:GF2:GF2-03.e::S3')
        assert.deepEqual([open?.permitted, open?.boundedBy], [['zone', 'line'], []], 'the chain names the permitted set and no bounding item')
        const onRow = (a.contracts.find((c) => c.contractId === 'restated:GF2')?.items ?? []).filter((i) => i.row === 'S3')
        assert.deepEqual(onRow.map((i) => [i.itemId, i.basis]), [['GF2-03.b', 'AUTHORED']])
        const element = (a.contracts.find((c) => c.contractId === 'restated:GF2')?.items ?? []).find((i) => i.itemId === 'GF2-03.e')
        assert.equal(element?.basis, 'OWNER_RULING')
        const note = 'the chain names the open line\'s permitted set, [\'zone\', \'line\'], and no item bounding it, so the reading above goes through the element\'s item, GF2-03.e (basis OWNER_RULING, Christian\'s ruling of 9 October; the item establishes that the region exists, on row S2), which does not bound the line; found by this test, the only item on the line\'s own row (S3) in the GF2 contract the chain derived from is GF2-03.b, our restatement of the DRAFT soccer module (AUTHORED, CANDIDATE); read through that bound, the refusal is RESTATEMENT-ONLY (1 AUTHORED, restated item)'
        const { lines } = compared('B3', byCase(resultsOnce(), 'GF2-ZONES'), v, undefined, [note])
        assert.deepEqual([v.proposedChoices[0].applied, v.chain?.outcome, v.refusal?.stage, v.refusal?.reasons], [true, 'refused', 'realization', ['realization refused', 'c:restated:GF2:GF2-03.e::S3: "circle" is not one of the permitted alternatives ["zone","line"]']])
        assert.deepEqual([v.lines.length, v.sentences.length], [0, 0])
        return [`proposed: ${v.proposedChoices[0].outcome}`, ...lines, `what bounds the line: ${note}`, GF2_STAND_IN_NOTE]
    },
    { id: 'B3', group: THIRD, cites: 'N7:155-157', shows: 'a value outside the alternatives our CANDIDATE restatement of the DRAFT soccer module lists for an open line is refused, never served' },
)

test(
    'an ILLUSTRATIVE value on an open line is accepted and labelled on every sentence citing that line',
    () => {
        const r = byCase(resultsOnce(), 'GF2-ZONES')
        const open = ['c:restated:GF2:GF2-03.e::S3', 'c:restated:GF2:GF2-03.f::S3', 'game::V1']
        const graded = open.map((id) => r.lines.find((l) => l.lineId === id))
        assert.deepEqual(graded.map((l) => [l?.value, l?.sixClass, l?.label, l?.premises.map((p) => p.kind)]), [
            ['zone', 5, VALUE_LABELS.ILLUSTRATIVE, ['CASE_CHOICE_ILLUSTRATIVE']],
            ['zone', 5, VALUE_LABELS.ILLUSTRATIVE, ['CASE_CHOICE_ILLUSTRATIVE']],
            ['target_zone_entered', 5, VALUE_LABELS.ILLUSTRATIVE, ['CASE_CHOICE_ILLUSTRATIVE']],
        ])
        const citing = r.sentences.filter((s) => s.joined.some((j) => open.indexOf(j) >= 0))
        const illustrative = `${classLabel(5)}; ${VALUE_LABELS.ILLUSTRATIVE}`
        for (const s of citing) assert.ok(s.label === VALUE_LABELS.ILLUSTRATIVE || s.otherLabels.indexOf(illustrative) >= 0, s.text)
        assert.deepEqual(citing.map((s) => s.text), [
            'Mark a 5 m end zone across the full width at each end',
            'A team scores 1 point by getting the ball under control into its target zone: running it in, or passing to a teammate who receives it under control inside',
            'Each team attacks the zone at the other team\'s end. Decide which team starts at which end; the ends stay the same for the whole game',
        ])
        return citing.map((s) => `'${s.text}': ${s.sixClass === null ? 'no class' : `class ${s.sixClass}`}; ${s.label}${s.label === VALUE_LABELS.ILLUSTRATIVE ? '' : ' (ILLUSTRATIVE among its other labels)'}`)
    },
    { id: 'B4a', group: THIRD, cites: 'N7:157', shows: 'an illustrative choice for an open line is accepted only as illustrative: the line is class 5 and every sentence citing it carries the label' },
)

test(
    'an ILLUSTRATIVE value on a line nothing establishes is refused and reported',
    () => {
        const v = runVariant(
            variantOf('GF2-ZONES', 'GF2-ZONES/restart-policy', 'GF2 zones with an illustrative value for the dead-ball restart policy, which nothing establishes (a Test B variant)', (c) => {
                c.proposedChoices = [{ id: 'PC-NOT-ESTABLISHED', lineId: 'game::RP1', value: 'COACH_SERVES', why: 'TEST-ONLY: a value for a line no knowledge establishes', rulingRefs: ['HO-07NOV-ILLUSTRATIVE'] }]
            }),
        )
        const { lines } = compared('B4b', byCase(resultsOnce(), 'GF2-ZONES'), v)
        assert.deepEqual([v.chain?.outcome, v.refusal?.stage, v.refusal?.reasons], ['refused', 'realization', ['realization refused', 'game::RP1: nobody established this, so it is not a freedom to close — filling it would convert missing knowledge into a choice']])
        assert.ok(v.gaps.some((g) => g.startsWith('the chain refused at realization')))
        return [`proposed: ${v.proposedChoices[0].outcome}`, ...lines]
    },
    { id: 'B4b', group: THIRD, cites: 'N7:16, N7:174', shows: 'missing knowledge is never filled by an illustrative value: a value for a line nothing establishes is refused, and the gap is reported' },
)

test(
    'A05 zone -> line is reported contrary to Christian\'s 28 October ruling and not applied; the configuration is identical',
    () => {
        const v = runVariant(
            variantOf('A05-2', 'A05-2/lines', 'A05-2 with lines proposed for its targets (a Test B variant)', (c) => {
                c.proposedChoices = [
                    { id: 'PC-LINE-NEAR', lineId: 'c:restated:GF2:GF2-03.e::S3', value: 'line', why: 'TEST-ONLY: the form\'s other alternative', rulingRefs: ['HO-05NOV-ILLUSTRATIVE'] },
                    { id: 'PC-LINE-FAR', lineId: 'c:restated:GF2:GF2-03.f::S3', value: 'line', why: 'TEST-ONLY: the form\'s other alternative', rulingRefs: ['HO-05NOV-ILLUSTRATIVE'] },
                    { id: 'PC-LINE-EVENT', lineId: 'game::V1', value: 'line_crossed', why: 'TEST-ONLY: the form\'s other scoring event', rulingRefs: ['HO-05NOV-ILLUSTRATIVE'] },
                ]
            }),
        )
        const { cmp, lines } = compared('B5', byCase(resultsOnce(), 'A05-2'), v)
        assert.deepEqual(v.proposedChoices.map((p) => [p.applied, p.outcome]), [
            [false, 'contrary to Christian\'s ruling HO-28OCT-ENDZONE (received 28 October 2026, provisional), which closes the line as \'zone\': not applied; the line keeps the ruling\'s value'],
            [false, 'contrary to Christian\'s ruling HO-28OCT-ENDZONE (received 28 October 2026, provisional), which closes the line as \'zone\': not applied; the line keeps the ruling\'s value'],
            [false, 'contrary to Christian\'s ruling HO-28OCT-PROVISIONAL (received 28 October 2026, provisional), which closes the line as \'target_zone_entered\': not applied; the line keeps the ruling\'s value'],
        ])
        assert.deepEqual(cmp.identical, { lines: true, sentences: true, diagram: true })
        return [...v.proposedChoices.map((p) => `proposed ${p.lineId} = '${String(p.value)}': ${p.outcome}`), ...lines]
    },
    { id: 'B5', group: THIRD, cites: 'N7:15, N7:155-157', shows: 'a value contrary to a ruling of Christian\'s is reported as contrary and never applied over it' },
)

test(
    'GF3 named for A05 is refused at knowledge (no contract) with the alternatives still listed; with no named form, the alternatives are retained and nothing is selected',
    () => {
        const gf3 = runVariant(
            variantOf('A05-2', 'A05-2/GF3', 'A05-2 with GF3 named (a Test B variant)', (c) => {
                c.form = { named: 'GF3', basis: 'ILLUSTRATIVE', rulingRefs: ['HO-05NOV-ILLUSTRATIVE'], why: 'TEST-ONLY: GF3 named as an illustrative value under Christian\'s general permission for this offline prototype, to show what the chain does with a compatible form that has no contract' }
            }),
        )
        const { lines } = compared('B6', byCase(resultsOnce(), 'A05-2'), gf3)
        assert.deepEqual([gf3.form.decision, gf3.form.formId, gf3.form.alternativesRetained, gf3.chain?.outcome, gf3.refusal?.stage, gf3.refusal?.reasons], ['NAMED', 'GF3', ['GF2', 'GF7'], 'refused', 'knowledge', ['the game form GF3 has no contribution contract']])
        const none = runVariant(
            variantOf('A05-2', 'A05-2/no-form', 'A05-2 with no named form (a Test B variant)', (c) => {
                c.form = { fromStep2: true }
            }),
        )
        const second = compared('B6', byCase(resultsOnce(), 'A05-2'), none)
        assert.deepEqual([none.form.decision, none.form.formId, none.form.stop, none.form.alternativesRetained, none.chain], ['STOP', null, 'alternatives retained; no basis to select', ['GF2', 'GF3', 'GF7'], null])
        return [...lines, ...second.lines, `no named form: ${none.form.stop}; retained with no preference: ${none.form.alternativesRetained.join(', ')}`]
    },
    { id: 'B6', group: THIRD, cites: 'N7:16, N7:53', shows: 'a compatible form without a contract is refused at knowledge with the other forms still visible; with no basis to select, the alternatives are retained and nothing is fabricated' },
)

// ---------------------------------------------------------------------------------------------------------------------------------------
// Fourth: structurally reusable (Test C; section 11: "Please demonstrate that the configuration and rendering process can support more
// than one legitimate structural arrangement.")
// ---------------------------------------------------------------------------------------------------------------------------------------

test(
    'three legitimate arrangements through the same code, each served with no fidelity finding over what its configuration establishes, with the coach diagram: GF2 reciprocal end zones, GF2 on lines, A01\'s asymmetric role blocks',
    () => {
        const out: string[] = []
        for (const [id, sentences, legend] of [
            ['GF2-ZONES', 8, ['target zone']],
            ['GF2-LINES', 8, ['target line']],
            ['A01', 29, ['marked line', 'target zone', 'starting area', 'team colour, kept in every block', 'role in this block', 'attacking direction', 'penalty area']],
        ] as Array<[string, number, string[]]>) {
            const r = byCase(resultsOnce(), id)
            assert.deepEqual([r.chain?.outcome, r.sentences.length, r.sentencesServed, r.chain?.fidelityViolations, r.diagram?.served, r.diagram?.verdict, r.diagram?.legend], ['served', sentences, true, 0, true, 'DRAWN', legend], id)
            const reviewOnly = r.sentences.filter((s) => s.reviewOnly).map((s) => s.text)
            const restart = r.gaps.indexOf('game::RP1 (restartPolicy.deadBall): not established') >= 0 ? '; no end-line restart is established (game::RP1 not established)' : ''
            out.push(`${id}: the chain would serve it; ${r.sentences.length} sentences (${reviewOnly.length} review-only: ${reviewOnly.map((t) => `'${t}'`).join(', ') || 'none'}); no fidelity finding over what its configuration establishes${restart}; the checked chain's diagram verdict: would be served, drawn; legend ${legend.map((l) => `'${l}'`).join(', ')}`)
        }
        // The only review-only sentence across the three is decision 1's generic one, said where its geometric conditions hold.
        assert.deepEqual(['GF2-ZONES', 'GF2-LINES', 'A01'].map((id) => byCase(resultsOnce(), id).sentences.filter((s) => s.reviewOnly).length), [1, 0, 0])
        // A01's own text: the sentences that render A01's activity-scoped words (measured, review of 7 November): Christian's approved A01
        // sentences, word for word, and the Adjusting the activity sentences built from its record's coachWords (our DRAFT wording).
        const a01 = byCase(resultsOnce(), 'A01')
        const approved = (readJson(path.join(AUDITS, 'approved-coach-wording.json')).entries as Array<{ id: string; sentence: string }>).filter((e) => e.id.startsWith('A01-'))
        const approvedSaid = a01.sentences.filter((s) => approved.some((e) => e.sentence === s.text))
        const coachWords = a01.sentences.filter((s) => s.from.some((p) => p.startsWith('adjustments[') && p.endsWith('.coachWords')))
        assert.deepEqual([approved.map((e) => e.id), approvedSaid.length, coachWords.length, coachWords.every((s) => s.section === 'Adjusting the activity' && s.wording === 'DRAFT')], [['A01-W1', 'A01-W2', 'A01-W3'], 3, 4, true])
        // The GF2 structural cases are served only under the TEST ASSUMPTION (measured here): with no classification, and with our DRAFT one.
        assert.equal(lawsMateriality.classifications.find((e) => e.law === 'LAW-11')?.materiality, 'MATERIAL', 'our DRAFT classification reads LAW-11 MATERIAL')
        const withoutStandIn = (tag: string, standIn: { law: string; materiality: string } | null, label: string) =>
            runVariant(
                variantOf('GF2-ZONES', `GF2-ZONES/${tag}`, `GF2 zones ${label} (a Test C control)`, (c) => {
                    ;(c.chain.vehicle as NonNullable<CaseInput['chain']['vehicle']>).lawsStandIn = standIn
                    c.testOnlyTreatments = c.testOnlyTreatments.filter((t) => t.id !== 'TT-LAW-11-STAND-IN')
                }),
            )
        const none = withoutStandIn('no-classification', null, 'with no classification of the Laws (the fail safe)')
        const draft = withoutStandIn('draft-classification', { law: 'LAW-11', materiality: 'MATERIAL' }, 'under our DRAFT classification (LAW-11 MATERIAL, as the DRAFT file reads it)')
        // The laws each refusal holds material: owed, and not among those its laws account reports for review (the account's sentences are the
        // sport check's own; only the laws they name are printed here).
        // Each account sentence begins with the law it is about (a later mention, as in a classification's standing, is not that law).
        const lawIds = (xs: string[]) => [...new Set(xs.map((x) => x.split(' ')[0]))]
        const lawsNamed = (r: HandoffResult) => lawIds(r.laws?.owed ?? []).filter((law) => lawIds(r.laws?.reportedForReview ?? []).indexOf(law) < 0)
        assert.deepEqual([none.chain?.outcome, none.refusal?.stage, lawsNamed(none), draft.chain?.outcome, draft.refusal?.stage, lawsNamed(draft)], ['refused', 'validation', ['LAW-8', 'LAW-11'], 'refused', 'validation', ['LAW-11']])
        const lawsNote = 'the refusal rests on our DRAFT reading of the Laws\' materiality (ours and unreviewed; not a contract item, so the reading above cites no item); the separate correction report to Christian covers it'
        for (const [label, r] of [['with no classification of the Laws (the fail safe)', none], ['under our DRAFT classification (LAW-11 MATERIAL)', draft]] as const)
            if (r.refusalBasis) testRefusals.push({ where: `test C1 (GF2 zones ${label}, without the TEST ASSUMPTION)`, basis: r.refusalBasis, obstructs: 'yes for the GF2 structural cases without the TEST ASSUMPTION', notes: [lawsNote] })
        return [
            ...out,
            `one mechanism (runHandoff) and one chain wiring for all three; no sentence is authored for the two GF2 cases (the text is the checked renderer's, plus decision 1's generic review-only zone sentence); A01's asymmetric arrangement comes from A01's own production record and realizations, and ${approvedSaid.length + coachWords.length} of its ${a01.sentences.length} sentences render A01's activity-scoped text (${approvedSaid.length} of Christian's approved A01 sentences, ${approved.map((e) => e.id).join(', ')}, and ${coachWords.length} 'Adjusting the activity' sentences from the record's coachWords, our DRAFT wording); the handoff carries them unchanged`,
            GF2_STAND_IN_NOTE,
            `GF2 zones with no classification of the Laws (the fail safe): refused at ${none.refusal?.stage}, the laws named as owed and material: ${lawsNamed(none).join(', ')}`,
            `GF2 zones under our DRAFT classification (LAW-11 MATERIAL): refused at ${draft.refusal?.stage}, the law named as owed and material: ${lawsNamed(draft).join(', ')}`,
        ]
    },
    { id: 'C1', group: FOURTH, cites: 'N7:158-160, N7:22-23', shows: 'the same configuration and rendering process supports more than one legitimate structural arrangement (role-less reciprocal zones, lines, asymmetric role blocks), each served with no fidelity finding over what its configuration establishes, with the diagram; the two GF2 configurations establish no end-line restart, and they are served only under a TEST ASSUMPTION about the Laws (measured here)' },
)

test(
    'GF4 after decision 2, through the same code: refused at structure on its trigger reachability alone, no example-incentive line named',
    () => {
        let answer: ChainAnswer | null = null
        const capture: HandoffChain = { build: (r) => (answer = realChain.build(r)) }
        const v = runHandoff(
            variantOf('GF2-LINES', 'GF4-STRUCTURAL', 'GF4 as a structural case through the same vehicle (a Test C variant)', (c) => {
                c.form = { named: 'GF4', basis: 'STRUCTURAL_CASE', rulingRefs: ['HO-07NOV-HANDOFF'], why: 'a structural case with no Learning Goal: GF4 after decision 2, to show what still stops it' }
                c.illustrative = c.illustrative.map((i) => (i.id === 'IL-FORM' ? { ...i, value: 'GF4' } : i))
            }),
            inputs,
            capture,
            k,
        )
        // The failing check's own result names the trigger's item (measured, review of 7 November); the reading cites it. It does not name the
        // items GF4's teams would rest on: those are found here, in the GF4 contract the chain derived from, as its items with basis ASSUMED.
        const a = answer as unknown as ChainAnswer
        assert.deepEqual(a.refusalDetail?.failingChecks.map((c) => [c.checkId, c.why, c.subjects]), [['GA-TRIGGER-REACHABLE', '1 transition trigger(s) checked against 6 reachable trigger(s); 1 not reachable: c:blind:GF4:I06: POSSESSION_CHANGE; 1 turnover transition(s): possession relation FREE(a)', ['game::PS1']]])
        assert.deepEqual([v.refusalBasis?.verdict, v.refusalBasis?.cited.map((x) => [x.ref, x.basis, x.premiseKind, x.via]), v.refusalBasis?.mix], ['RESTATEMENT-ONLY', [['c:blind:GF4:I06', 'AUTHORED', 'RESTATED_ITEM', 'the failing check GA-TRIGGER-REACHABLE\'s own result']], '1 AUTHORED (restated item)'])
        const assumed = (a.contracts.find((c) => c.contractId === 'blind:GF4')?.items ?? []).filter((i) => i.basis === 'ASSUMED')
        // Measured: four ASSUMED items. By their own rows and evidence, I10 (P1), I11 (J1) and I12 (J2) are the assumptions of two opposing
        // teams each attacking one target, on which GF4's teams and objectives would rest; I16 (V23) assumes an example incentive's timing.
        assert.deepEqual(assumed.map((i) => [i.itemId, i.row]), [['I10', 'P1'], ['I11', 'J1'], ['I12', 'J2'], ['I16', 'V23']])
        const teams = assumed.filter((i) => i.row === 'P1' || i.row === 'J1' || i.row === 'J2')
        const assumedNote = `the failing check's own result names only ${v.refusalBasis?.cited.map((x) => x.itemId).join(', ')} (the transition whose trigger, a possession change, cannot be reached); the GF4 contract the chain derived from holds ${assumed.length} items with basis ASSUMED, found by this test: ${assumed.map((i) => `${i.itemId} (row ${i.row})`).join(', ')}; by their own rows and evidence, ${teams.map((i) => i.itemId).join(', ')} assume two opposing teams each attacking one target, on which GF4's teams and objectives would rest, and they establish no team (derivation/gf4-example-incentives.unit.ts pins this), which is why no possession change can be reached; read with them, the basis mix is 1 AUTHORED, ${teams.length} ASSUMED, all ours and unreviewed (RESTATEMENT-ONLY either way)`
        const { lines } = compared('C2', byCase(resultsOnce(), 'GF2-LINES'), v, 'yes for GF4: it does not generate; the trigger the form needs is unreachable because its teams are an assumption of our restatement', [assumedNote])
        assert.deepEqual([v.chain?.outcome, v.refusal?.stage, v.refusal?.reasons], ['refused', 'structure', ['Gate A is FAIL', 'a pre-realization Gate A invariant fails: GA-TRIGGER-REACHABLE']])
        assert.ok(v.refusal?.reasons.every((x) => x.indexOf('I17') < 0), 'no reason names the example incentive item')
        return [...lines, `what it rests on: ${v.refusalBasis?.verdict} (${v.refusalBasis?.why}); ${assumedNote}`, 'the derivation-level account (the example-incentive lines gone, the required structural conditions still enforced) is pinned by derivation/gf4-example-incentives.unit.ts, in the suite']
    },
    { id: 'C2', group: FOURTH, cites: 'N7:161, N7:26-31', shows: 'decision 2 removes the example incentives as requirements, and GF4 still does not generate: it stops at structure for a reason decision 2 does not touch, stated honestly' },
)

test(
    'TA01 through the handoff: Step 2 SELECTED GF4, and the chain refuses at knowledge (its context has no contract)',
    () => {
        const r = byCase(resultsOnce(), 'TA01')
        assert.deepEqual([r.form.decision, r.form.formId, r.chain?.outcome, r.refusal?.stage, r.refusalBasis?.verdict], ['SELECTED_BY_STEP_2', 'GF4', 'refused', 'knowledge', 'NOT KNOWLEDGE'])
        return [`form: ${r.form.decision} ${r.form.formId}; refused at ${r.refusal?.stage}: ${r.refusal?.reasons[0]}`, `what it rests on: ${r.refusalBasis?.verdict}: ${r.refusalBasis?.why}`]
    },
    { id: 'C3', group: FOURTH, cites: 'N7:161, N7:188', shows: 'a goal whose form Step 2 selects is carried by the same mechanism, and stops where the knowledge stops (our 6 November proposal said the GF4 goals stop at the structural check; they stop at knowledge first)' },
)

test(
    'refusal controls: the goals where Step 1 or Step 2 stops are stopped by the handoff before the chain; D02 (Step 2 SELECTED GF4) stops at knowledge',
    () => {
        const out: string[] = []
        const rows: string[][] = []
        for (const goal of ['A03', 'A04', 'A06', 'D01', 'D03', 'TD01', 'TD02', 'D02']) {
            const v = runVariant(variantOf('TA01', `CONTROL-${goal}`, `${goal} through the handoff with its form from Step 2 (a Test C refusal control)`, (c) => (c.goalId = goal)))
            const stop = v.form.stop ?? `${v.refusal?.stage}: ${v.refusal?.reasons[0]}`
            rows.push([goal, v.form.decision, v.refusal?.stage ?? 'none', v.chain === null ? 'not run' : String(v.chain.outcome)])
            if (v.refusalBasis) testRefusals.push({ where: `test C4 (${goal})`, basis: v.refusalBasis, obstructs: `yes for ${goal}: ${goal === 'D02' ? 'its context has no contract' : 'no form can be placed without a basis'}; nothing is fabricated to pass it` })
            out.push(`${goal}: ${v.receive.step1?.status}; Step 2 ${v.receive.step2?.status}; ${stop}`)
        }
        assert.deepEqual(rows, [
            ['A03', 'STOP', 'handoff (form)', 'not run'],
            ['A04', 'STOP', 'handoff (form)', 'not run'],
            ['A06', 'STOP', 'handoff (form)', 'not run'],
            ['D01', 'STOP', 'handoff (form)', 'not run'],
            ['D03', 'STOP', 'handoff (form)', 'not run'],
            ['TD01', 'STOP', 'handoff (form)', 'not run'],
            ['TD02', 'STOP', 'handoff (form)', 'not run'],
            ['D02', 'SELECTED_BY_STEP_2', 'knowledge', 'refused'],
        ])
        return out
    },
    { id: 'C4', group: FOURTH, cites: 'N7:16, N7:155-157', shows: 'where Step 1 or Step 2 gives the handoff nothing to place, it stops before the chain and names why; no goal is routed around its gap' },
)

test('the inputs are validated by hand: each defect refuses the file', () => {
    const raw = readJson(INPUTS_FILE)
    const refuses = (alter: (x: any) => void, pattern: RegExp) => {
        const x = copy(raw)
        alter(x)
        assert.throws(() => validateHandoffInputs(x), pattern)
    }
    refuses((x) => (x.cases[0].form.rulingRefs = ['HO-NOWHERE']), /is not a ruling the file holds/)
    refuses((x) => (x.cases[0].form.basis = 'SELECTED_BY_US'), /none of ILLUSTRATIVE, LOGICAL_INFERENCE, STRUCTURAL_CASE/)
    refuses((x) => (x.cases[0].suppliedChoices[0] = { ...x.cases[0].suppliedChoices[0], standing: 'ILLUSTRATIVE' }), /stands on no ruling and is not labelled ILLUSTRATIVE/)
    refuses((x) => (x.cases[0].standIns[0].label = 'APPROVED'), /labelled neither ILLUSTRATIVE nor TEST ASSUMPTION/)
    refuses((x) => (x.rulings[0].received = '2026-11-31'), /not a real date/)
    refuses((x) => (x.cases[4].goalId = 'A05'), /STRUCTURAL_CASE form is exactly the form of a case with no Learning Goal/)
    refuses((x) => (x.cases[0].surprise = true), /unknown key surprise/)
    // S3b: the Test B inputs are held to the same validator (a relationship stand-in is TEST ASSUMPTION only; a proposed value cites a ruling
    // the file holds; a Game Problem override is TEST ASSUMPTION and enters only a TEST-ONLY record).
    refuses((x) => (x.cases[0].proposedManipulations = [{ id: 'PM-X', purpose: 'a purpose', manipulation: 'a manipulation', relationship: { ref: 'R', label: 'APPROVED', why: 'w' } }]), /labelled TEST ASSUMPTION and says its reference and why/)
    refuses((x) => (x.cases[0].proposedManipulations = [{ id: 'PM-X', purpose: '', manipulation: 'a manipulation' }]), /names its id, its purpose and the manipulation/)
    refuses((x) => (x.cases[0].proposedChoices = [{ id: 'PC-X', lineId: 'game::V1', value: 'line_crossed', why: 'w', rulingRefs: ['HO-NOWHERE'] }]), /is not a ruling the file holds/)
    refuses((x) => (x.cases[0].proposedChoices = [{ id: 'PC-X', lineId: 'game::V1', value: 'line_crossed', why: 'w', rulingRefs: [] }]), /the ruling that permits an illustrative value/)
    refuses((x) => (x.cases[0].gameProblemOverride = { id: 'GP-005', label: 'RULING', why: 'w', rulingRefs: [] }), /is labelled TEST ASSUMPTION and says why/)
    refuses((x) => (x.cases[3].gameProblemOverride = { id: 'GP-005', label: 'TEST ASSUMPTION', why: 'w', rulingRefs: [] }), /enters only a TEST-ONLY record/)
    // Review of 7 November: a coach-input session citing no ruling; a ruled choice whose provisional flag differs from its ruling's; a treatment
    // of an unknown kind, or naming items to withhold when it does not withhold; a note quoting words no ruling holds.
    assert.equal(raw.cases[3].session.label, 'COACH_INPUT', 'the A01 case is the coach-input session')
    refuses((x) => (x.cases[3].session.rulingRefs = []), /a coach-input session cites no ruling/)
    refuses((x) => (x.cases[0].suppliedChoices[0].provisional = false), /is marked provisional false, and its ruling HO-28OCT-ENDZONE is provisional true/)
    refuses((x) => (x.cases[0].testOnlyTreatments[0].kind = 'WITHOLD_ITEMS'), /the kind "WITHOLD_ITEMS" is none of/)
    refuses((x) => (x.cases[0].testOnlyTreatments[0] = { ...x.cases[0].testOnlyTreatments[0], contractId: 'restated:RPC-003', itemIds: ['RPC-003-10.a'] }), /names a contract or items, and only WITHHOLD_ITEMS acts on them/)
    refuses((x) => (x.cases[0].reportNotes = [{ section: 'text', text: 't', quotes: [{ rulingRef: 'HO-28OCT-PROVISIONAL', word: 9 }] }]), /a note quotes words a ruling of the file does not hold/)
    refuses((x) => (x.cases[0].reportNotes = [{ section: 'elsewhere', text: 't' }]), /a note names its section/)
    // Every case is returned as a deep copy (based on another or not): changing the result changes nothing of what was read.
    const read = readJson(INPUTS_FILE)
    const checked = validateHandoffInputs(read)
    checked.cases[3].session.players = 99
    checked.cases[0].suppliedChoices.length = 0
    assert.deepEqual([read.cases[3].session.players, read.cases[0].suppliedChoices.length], [12, 3], 'the validated cases are copies')
})

test(
    'the harness\'s hold on the TEST-ONLY REPORT check refuses at validation when a law the activity owes is not PROCEDURAL under the classification it holds to',
    () => {
        // A05-2 owes LAW-8 (the kick-off's centre mark has no register row). Our DRAFT classification reads it PROCEDURAL, so the run is
        // served (F5). Held instead to a labelled TEST-ONLY stand-in classification marking LAW-8 MATERIAL, or naming no LAW-8 (the fail
        // safe), the same run is refused at validation, naming LAW-8. Nothing else changes: the chain, the case and the check are the same.
        assert.equal(lawsMateriality.classifications.find((e) => e.law === 'LAW-8')?.materiality, 'PROCEDURAL', 'our DRAFT classification reads LAW-8 PROCEDURAL')
        const material: LawsMateriality = { ...copy(lawsMateriality), file: 'TEST-ONLY stand-in (LAW-8 MATERIAL)', classifications: lawsMateriality.classifications.map((e) => (e.law === 'LAW-8' ? { ...e, materiality: 'MATERIAL' as const } : { ...e })) }
        const unnamed: LawsMateriality = { ...copy(lawsMateriality), file: 'TEST-ONLY stand-in (no LAW-8)', classifications: lawsMateriality.classifications.filter((e) => e.law !== 'LAW-8').map((e) => ({ ...e })) }
        const out: string[] = []
        for (const [label, heldTo] of [['LAW-8 MATERIAL', material], ['no LAW-8 named', unnamed]] as const) {
            const r = runHandoff(byCaseInput('A05-2'), inputs, chainWith({ heldTo }), k)
            assert.deepEqual([r.chain?.outcome, r.chain?.stage, r.chain?.summary], ['refused', 'validation', 'the harness holds the TEST-ONLY realization\'s REPORT check to a TEST-ONLY stand-in classification, and a law it owes is not procedural there'], label)
            assert.equal(r.chain?.reasons.length, 1, label)
            assert.ok(r.chain?.reasons[0].startsWith('LAW-8 at the game: an adaptation is owed; '), label)
            out.push(`held to a TEST-ONLY stand-in classification (${label}): A05-2 refused at validation: ${r.chain?.reasons[0]}`)
            if (r.refusalBasis) testRefusals.push({ where: `test E3 (A05-2 held to a TEST-ONLY stand-in classification: ${label})`, basis: r.refusalBasis, obstructs: 'no: a stand-in classification constructed to show that the harness\'s hold refuses; the case itself is held to our DRAFT classification' })
        }
        return [...out, 'with our DRAFT classification (LAW-8 PROCEDURAL) the same run is served (F5): the hold refuses exactly where an owed law is not procedural']
    },
    { id: 'E3', group: CHECKS, cites: 'N7:12, N7:15', shows: 'the guarantee the TEST-ONLY REPORT check rests on: the harness refuses the run at validation when a law the activity owes is not procedural under the classification it is held to (shown on labelled TEST-ONLY stand-in classifications)' },
)

// ---------------------------------------------------------------------------------------------------------------------------------------
// Isolation and the evidence
// ---------------------------------------------------------------------------------------------------------------------------------------

test('the stage files import nothing of the chain and name none of the assembly record\'s readers', () => {
    for (const f of ['handoff.ts', 'handoff-report.ts']) {
        const source = fs.readFileSync(path.join(HERE, f), 'utf8')
        // Both quotation marks (review of 7 November): a double-quoted specifier is read too, so the allowlist below holds for every import.
        const imports = [...source.matchAll(/from\s+['"]([^'"]+)['"]/g)].map((m) => m[1]).sort()
        assert.deepEqual([...'import { x } from "src/system/rendering/build-activity"'.matchAll(/from\s+['"]([^'"]+)['"]/g)].map((m) => m[1]), ['src/system/rendering/build-activity'], 'bite: a double-quoted import is read')
        assert.ok(imports.every((m) => ['./assembly', './handoff', './knowledge', './stage1', './trace'].indexOf(m) >= 0), `${f} imports ${imports.join(', ')}`)
        for (const name of ['committedExperimentData', 'validateExperiment', 'assembleActivity', 'runAssembly', 'assembly-experiment', 'experimentData', 'committedWordingData', 'displayTextsFor', 'require(', 'import(']) assert.ok(!source.includes(name), `${f} names ${name}`)
    }
})

test('the evidence equals what this file generates, generated twice and identical (rewritten only under UPDATE_HANDOFF_EVIDENCE=1)', () => {
    const first = evidenceOf(resultsOnce())
    const second = evidenceOf(runHandoffCases(inputs, realChain, committedKnowledge()))
    assert.equal(second.json, first.json, 'two runs, identical results')
    assert.equal(second.report, first.report, 'two runs, identical report')
    const reportFile = path.join(EVIDENCE, 'handoff-report.txt')
    const jsonFile = path.join(EVIDENCE, 'handoff-results.json')
    if (process.env.UPDATE_HANDOFF_EVIDENCE === '1') {
        fs.mkdirSync(EVIDENCE, { recursive: true })
        fs.writeFileSync(reportFile, first.report)
        fs.writeFileSync(jsonFile, first.json)
        quiet('  (evidence rewritten under UPDATE_HANDOFF_EVIDENCE=1)')
    }
    assert.equal(fs.readFileSync(reportFile, 'utf8'), first.report, 'handoff-report.txt equals the generated report')
    assert.equal(fs.readFileSync(jsonFile, 'utf8'), first.json, 'handoff-results.json equals the generated results')
    // No gendered pronoun anywhere in the evidence (the binding rule; review of 7 November: the evidence now scans itself, as the assembly's does).
    for (const [f, text] of [['handoff-report.txt', first.report], ['handoff-results.json', first.json]]) {
        const hit = text.split('\n').findIndex((l) => holdsGenderedPronoun(l))
        assert.equal(hit, -1, `${f}: a gendered pronoun at line ${hit + 1}`)
    }
    assert.ok(holdsGenderedPronoun(`as quoted in ${[...'sih'].reverse().join('')} reply`) && !holdsGenderedPronoun('whether the heron'), 'bite: the scan sees one, and not inside a word')
    for (const r of resultsOnce()) assert.ok(r.lines.every((l) => l.sixClass === null || classLabel(l.sixClass).startsWith('class ')), r.caseId)
})

test('registered', () => {
    const registry = readJson(path.resolve(HERE, '..', '..', '..', 'scripts', 'unit-tests.json')) as string[]
    assert.ok(registry.includes('./src/system/design-reasoning/handoff.unit.ts'))
})

quiet(`${passed} passed`)
