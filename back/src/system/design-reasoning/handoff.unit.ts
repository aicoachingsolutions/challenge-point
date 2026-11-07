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
 *   - The evidence (`docs/audits/design-reasoning-handoff/evidence/handoff-report.txt`, `handoff-results.json`) equals what this file
 *     generates, generated twice and identical; rewritten only under `UPDATE_HANDOFF_EVIDENCE=1` (the precedent of `sport-coupling.unit.ts`).
 *   - The stage files import nothing of the chain and name none of the assembly record's readers.
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
import { CONTEXT_ROLE, DraftStoreContents } from '../derivation/run-bounded-selection'
import { LoadedContract } from '../derivation/types'
import { SuppliedRealization } from '../realization/supplied-realization'
import { buildActivity, buildActivityUnderAuthorizationRecords, RefusedActivity, ServedActivity } from '../rendering/build-activity'
import { reviewDraftOf } from '../rendering/review-draft'
import { withReviewStructureWording } from '../rendering/review-structure-wording'
import { specializedRoleNames } from '../rendering/session-envelope'
import { learningGoalAuthorizations } from '../test-library/learning-goal-authorizations'
import { classLabel, VALUE_LABELS } from './assembly'
import { displayCell } from './assembly-display'
import {
    ChainAnswer,
    ChainLine,
    ChainRequest,
    GRADING_MAP,
    HandoffChain,
    HandoffInputs,
    HandoffResult,
    inputCounts,
    OPPORTUNITIES_NOT_ESTABLISHED,
    PREMISE_KINDS,
    runHandoffCases,
    validateHandoffInputs,
} from './handoff'
import { handoffReportText } from './handoff-report'
import { committedKnowledge, sourceStanding } from './knowledge'

const quiet = console.log
console.log = (...args: unknown[]) => {
    if (typeof args[0] === 'string' && args[0].startsWith('[selection-search]')) return
    quiet(...args)
}
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
    const lines: ChainLine[] = []
    for (const d of st.derived ?? [])
        lines.push({ kind: 'DERIVED', lineId: d.lineId, path: d.path, value: d.value, support: (d.support ?? []).map((s: any) => ({ kind: s.kind, contractId: s.contractId, itemId: s.itemId, id: s.id, row: s.row })), strength: d.strength, extentTerm: term.get(d.lineId) ?? null })
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

/** The harness's hold on a REPORT check: every owed law must be PROCEDURAL under our DRAFT classification (else the run is refused here). */
function heldLaws(fixture: any): { owed: string[]; reported: string[]; material: string[] } {
    const owed = ((fixture?.defaultLaws?.laws ?? []) as Array<{ law: string; status: string }>).filter((l) => l.status === 'ADAPTATION_OWED')
    const reported: string[] = []
    const material: string[] = []
    for (const l of owed) {
        const entry = lawsMateriality.classifications.find((x) => x.law === l.law)
        const sentence = `${l.law} at the game: an adaptation is owed; ${entry ? `${entry.materiality} under our DRAFT classification (${lawsMateriality.file}: our reading, for Christian's review; not a ruling)` : 'MATERIAL: our DRAFT classification names no such law (fail safe)'}`
        if (entry && entry.materiality === 'PROCEDURAL') reported.push(sentence)
        else material.push(sentence)
    }
    return { owed: owed.map((l) => l.law), reported, material }
}

export const realChain: HandoffChain = {
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
        const alterSelection = (selection: any) => {
            scorerPick = selection.selected.filter((e: any) => e.role === 'game form').map((e: any) => String(e.id))
            const others = selection.selected.filter((e: any) => e.role !== 'game form' && !(vehicle?.removeContext && e.role === CONTEXT_ROLE))
            selection.selected = [{ id: request.formId, role: 'game form' }, ...others]
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
            seen = contracts.map((c) => ({
                contractId: c.contractId,
                origin: draftIds.has(c.contractId) ? ('DRAFT_STORE' as const) : c.contractId.startsWith('provisional:') ? ('REALIZATION' as const) : ('KNOWLEDGE' as const),
                items: c.items.map((i: any) => ({
                    itemId: String(i.itemId),
                    row: String(i.row),
                    basis: String(i.basis),
                    category: i.category ? String(i.category) : null,
                    basisEvidence: typeof i.basisEvidence === 'string' ? i.basisEvidence : JSON.stringify(i.basisEvidence ?? ''),
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
                  standing: `DRAFT - TEST-ONLY stand-in, ${vehicle.lawsStandIn.law} ${vehicle.lawsStandIn.materiality}: neither our reading nor a ruling of Christian`,
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
        if (request.holdReportedLawsToMateriality && fixture) {
            const held = heldLaws(fixture)
            laws = { mode: 'REPORT (the TEST-ONLY realization\'s check), held by the harness to our DRAFT classification', owed: held.owed, reportedForReview: held.reported }
            if (held.material.length) {
                outcome = 'refused'
                stage = 'validation'
                summary = 'the harness holds the TEST-ONLY realization\'s REPORT check to our DRAFT classification, and a law it owes is not procedural there'
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
                      gameProblem: account.gameProblem ? { status: account.gameProblem.status, gameProblemId: account.gameProblem.gameProblemId, inferredFromWording: account.gameProblem.inferredFromWording } : null,
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
                  }
                : null,
        }
    },
}

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
    const routine = ['restart.endLine.location', 'restart.endLine.receivingDistance', 'duration.blocks', 'duration.blockMinutes', 'duration.breaks', 'equipment.bibs', 'equipment.markers', 'equipment.balls']
    const entered = routine.map((p) => {
        const c = (assembly.activity.choices as any[]).find((x) => x.path === p)
        assert.ok(c, p)
        return `${p} = ${typeof c.value === 'string' ? `'${c.value}'` : String(c.value)} (class ${c.sixClass}, ${c.howReached})`
    })
    return [
        `A05 (cases ${a05.cases.join(', ')}): ${a05.rulings} of Christian's rulings (${a05.enteringTheChain} entering the chain, ${a05.reportOnly} report only), ${a05.illustrative} illustrative values, ${a05.testOnlyTreatments} TEST-ONLY treatments, ${a05.suppliedChoices} supplied choices, ${a05.standIns} stand-in items; no sentence.`,
        `The hand-authored A05 review record these replace as the activity's source: ${assembly.activity.counts.activityValues} activity values and ${wording.templates.length} coach-text templates (its sentences and notes), every one entered by hand; the handoff's coach text is the checked renderer's and the review-only wording's.`,
        `Routine choices (kind C by our reading) the hand-authored record turned into values, which the handoff leaves to the coach with no value: ${entered.join('; ')}.`,
    ]
}

const purposeTexts = (): Record<string, string> =>
    Object.fromEntries(inputs.cases.filter((c) => c.goalId).map((c) => [c.goalId as string, displayCell(k, { source: 'planning', table: 'learning_goals', row: c.goalId as string, column: 'Coach Definition' }).text]))

function evidenceOf(results: HandoffResult[]): { report: string; json: string } {
    const counts = countLines()
    const purposes = purposeTexts()
    const report = handoffReportText(results, inputs, [...counts, ...Object.entries(purposes).map(([goal, text]) => `purpose text of ${goal} (display cell, read after the decisions): '${text}'`)])
    const json = `${JSON.stringify({ stage: 'DESIGN_REASONING_HANDOFF', standing: inputs.standing, opportunities: OPPORTUNITIES_NOT_ESTABLISHED, counts, cases: results }, null, 1)}\n`
    return { report, json }
}

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
        assert.match(String(r.chain?.gameProblemComparison), /^the chain's account reads UNRESOLVED none \(inferred from wording: GP-015\); Step 1: primary GP-001, secondary GP-002;/)
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

test('A05-1, the starting-condition reading as a TEST-ONLY treatment: refused at structure on the drafted control line alone (measured; DESIGN expected communication)', () => {
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
        const standing = sourceStanding(k, src.knowledgeSource)
        assert.ok(src.sourceStanding.startsWith(standing === 'CANDIDATE' ? 'DRAFT' : standing), `${src.id}: printed ${src.sourceStanding}, the review pathway's standing ${standing}`)
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

test('DESIGN 3.5, time-boxed: the coach-served end-line restart in Christian\'s words does not compose; where it stops, pinned', () => {
    // A05-2's request with the restart added to its TEST-ONLY realization as items in Christian's words (N7:96 and N7:89; the typing ours).
    const a05 = inputs.cases.find((c) => c.id === 'A05-2')
    assert.ok(a05)
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
    const build = (withItems: Record<string, unknown>[], closeLocation: boolean) => {
        let request: ChainRequest | null = null
        const capture: HandoffChain = { build: (r) => ((request = r), realChain.build(r)) }
        runHandoffCases({ ...inputs, cases: [a05] }, capture, k)
        const r = request as unknown as ChainRequest
        const entry = { ...realizationEntry(r.realization as NonNullable<ChainRequest['realization']>), items: withItems }
        const sel = (selection: any) => {
            selection.selected = [{ id: r.formId, role: 'game form' }, ...selection.selected.filter((e: any) => e.role !== 'game form')]
        }
        const alter = (contracts: LoadedContract[]) => {
            for (const w of r.withhold) {
                const contract = contracts.find((c) => c.contractId === w.contractId) as LoadedContract
                contract.items = contract.items.filter((i) => w.itemIds.indexOf(i.itemId) < 0)
            }
            for (const s of r.standIns) (contracts.find((c) => c.contractId === s.contractId) as LoadedContract).items.push(copy(s.item) as any)
        }
        const supplied = (s: SuppliedRealization) => {
            for (const ch of r.choices) (s.choices.find((c) => c.lineId === ch.lineId) as { value: unknown }).value = ch.value
            if (closeLocation) s.choices.push({ lineId: 'c:provisional:A05-H1:A05-H1-T1-1::T4', value: { coachDecides: location } as any, because: 'TEST-ONLY diagnostic: the coach decides, within Christian\'s qualitative condition' })
        }
        const records = [...productionRecords, { ...(r.records as any), excluded: [], manipulations: [] }]
        return buildActivityUnderAuthorizationRecords({ kind: 'learning-goal', goalId: 'A05', session: sessionOf(r.session) }, records, { review: { includeDrafts: true }, drafts: loadDraftStore('ta02-composition'), realizations: gatedRealizations(entry), alterSelection: sel, alter, alterSupplied: supplied, communicationSupplement: withReviewStructureWording }).activity
    }
    const inWords = build(items, false)
    assert.deepEqual([inWords.outcome, (inWords as RefusedActivity).stage, (inWords as RefusedActivity).reasons], ['refused', 'structure', ['Gate A is FAIL', 'a pre-realization Gate A invariant fails: GA-NO-FAILED-LINE', '1 unresolved property is neither an authorized choice nor an authorized claim: c:provisional:A05-H1:A05-H1-T1-1::T7']])
    // Diagnostic only (a TEST ASSUMPTION for the episode line, and the coach-decided location closed): structure, realization and validation
    // pass, and the build stops at communication, because no sentence exists for a restart the coach serves.
    const diagnostic = build([...items, T7_STAND_IN], true) as RefusedActivity
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
})

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
})

// ---------------------------------------------------------------------------------------------------------------------------------------
// Isolation and the evidence
// ---------------------------------------------------------------------------------------------------------------------------------------

test('the stage files import nothing of the chain and name none of the assembly record\'s readers', () => {
    for (const f of ['handoff.ts', 'handoff-report.ts']) {
        const source = fs.readFileSync(path.join(HERE, f), 'utf8')
        const imports = [...source.matchAll(/from\s+'([^']+)'/g)].map((m) => m[1]).sort()
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
    for (const r of resultsOnce()) assert.ok(r.lines.every((l) => l.sixClass === null || classLabel(l.sixClass).startsWith('class ')), r.caseId)
})

test('registered', () => {
    const registry = readJson(path.resolve(HERE, '..', '..', '..', 'scripts', 'unit-tests.json')) as string[]
    assert.ok(registry.includes('./src/system/design-reasoning/handoff.unit.ts'))
})

quiet(`${passed} passed`)
