/**
 * **The isolated foundational test: what its report prints beside the handoff's cases** — review pathway only, TEST-ONLY review evidence
 * (stage 9; Christian's authorization, pasted 10 November 2026, sections 1, 6 and 7):
 *   "High Press Escape's existing identity and scoring conditions should be represented through the smallest necessary executable interpretation, clearly identified as CANDIDATE until reviewed."
 *
 * Pure. It reads three things handed to it: the test's own data (`FoundationalTestData`, validated here by hand), the restated context's items
 * as the unit test read them from the TEST-ONLY draft store (`RestatedItem`), and the handoff's results for the test's runs. It imports nothing
 * of the checked chain and names no goal, context, Game Problem, Game Form, law or row id: every such value lives in the data file.
 *
 * What it prints, in this order:
 *   - the runs, each with its TEST-ONLY treatments, where it stops, and what each refusal rests on (the handoff's `RefusalBasis`, verdict and
 *     mix); the run of the knowledge as it stands is told apart from every run with a treatment, which is never the goal's configuration;
 *   - one line mapping the build's draft labels to CANDIDATE (the build has no CANDIDATE label);
 *   - each restated item in three columns: the source row and its standing; our interpretation (CANDIDATE, authored by us and unreviewed, an
 *     ASSUMED value marked OURS, the scope marked OURS); its effect in each run (carried, refused on a line, withheld by a treatment, entered
 *     derivation with no line resting on it, or not reached), computed from the run's own result;
 *   - what stays UNRESOLVED (the knowledge run's not-carried list, in the data's words);
 *   - the smallest specific source material, as questions only, in order of consequence;
 *   - the Essential Representative Relationships, one row each: the rows that state it, the CAR rating if any, whether it is executable, what
 *     the engine does with it, and, per run, the effect of the restated items that bear on it.
 * Double quotation marks are printed only around Christian's words, verbatim, with their date (`quoted`, `citedDateOf`); every other text through
 * `plain`, so a double quotation mark in the data is printed as a single one.
 */
import { citedDateOf } from './assembly'
import { HandoffInputs, HandoffResult } from './handoff'
import { plain, quoted, show } from './handoff-report'

/** One item of the restated context, as the unit test read it from the TEST-ONLY draft store (plain data). */
export interface RestatedItem {
    itemId: string
    row: string
    selector: string
    requirement: string
    value: unknown
    basis: string
    scope: string
    checkability: string
    basisEvidence: string
    sources: Array<{ rowId: string; table: string; line: number }>
}

/** The test's own data (the `experiment` section of its review data file): ours, for Christian's review, except the quoted words. */
export interface FoundationalTestData {
    standing: string
    /** The restated contract the items belong to, and the TEST-ONLY draft store folder it is read from. */
    contractId: string
    draftStore: string
    /** The one line mapping the build's draft labels to CANDIDATE. */
    candidateMapping: string
    /** The standing of every source row an item cites, with its evidence. */
    sourceRows: Array<{ rowId: string; standing: 'APPROVED'; evidence: string }>
    /** The runs in report order, and the one run of the knowledge as it stands (every other run carries a TEST-ONLY treatment). */
    runOrder: string[]
    knowledgeRun: string
    /** The kinds of treatment that make up the test's pathway itself (every run carries them; they alone do not make a run a treatment run). */
    pathwayTreatmentKinds: string[]
    /** Said beside every run with any other treatment. */
    treatmentRunWords: string
    /** Said beside a refusal resting only on our restatement. */
    restatementOnlyWords: string
    questions: Array<{ order: number; question: string; why: string; next: boolean }>
    relationships: Array<{ id: string; relationship: string; rulingRef: string; word: number; rows: string[]; car: string; items: string[]; executable: string; engineUse: string }>
    /** Notes on the CAR row, printed under the relationships. */
    car: string[]
}

const isObject = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v)
const filled = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0
const DATA_KEYS = ['standing', 'contractId', 'draftStore', 'candidateMapping', 'sourceRows', 'runOrder', 'knowledgeRun', 'pathwayTreatmentKinds', 'treatmentRunWords', 'restatementOnlyWords', 'questions', 'relationships', 'car']

/**
 * The test's data, checked by hand against the handoff inputs it travels with and the restated items: closed keys; every source row an item
 * cites has a standing (and no row is listed that no item cites); every run is a case of the inputs, the knowledge run among them, carrying
 * only the pathway's treatments, and every other run carrying at least one more; the questions in order with exactly the first marked next;
 * each relationship quoting words a ruling of the inputs holds and naming only items of the restatement. Throws, naming every defect.
 */
export function validateFoundationalTest(raw: unknown, inputs: HandoffInputs, items: RestatedItem[]): FoundationalTestData {
    const errors: string[] = []
    if (!isObject(raw)) throw new Error('foundational test data: not an object')
    for (const key of Object.keys(raw)) if (DATA_KEYS.indexOf(key) < 0) errors.push(`unknown key ${key}`)
    for (const key of ['standing', 'contractId', 'draftStore', 'candidateMapping', 'knowledgeRun', 'treatmentRunWords', 'restatementOnlyWords']) if (!filled(raw[key])) errors.push(`${key} says nothing`)
    const sourceRows = Array.isArray(raw.sourceRows) ? (raw.sourceRows as unknown[]) : []
    const cited = [...new Set(items.flatMap((i) => i.sources.map((s) => s.rowId)))]
    for (const s of sourceRows) if (!isObject(s) || !filled(s.rowId) || s.standing !== 'APPROVED' || !filled(s.evidence)) errors.push('a source row names its row, the standing APPROVED and its evidence')
    const listed = sourceRows.filter(isObject).map((s) => String(s.rowId))
    for (const id of cited) if (listed.indexOf(id) < 0) errors.push(`the source row ${id} an item cites has no standing here`)
    for (const id of listed) if (cited.indexOf(id) < 0) errors.push(`the source row ${id} is listed, and no item cites it`)
    const runOrder = Array.isArray(raw.runOrder) ? (raw.runOrder as unknown[]).map(String) : []
    const kinds = Array.isArray(raw.pathwayTreatmentKinds) ? (raw.pathwayTreatmentKinds as unknown[]).map(String) : []
    if (!kinds.length) errors.push('the pathway names its treatment kinds')
    for (const id of runOrder) {
        const c = inputs.cases.find((x) => x.id === id)
        if (!c) {
            errors.push(`the run ${id} is not a case of the inputs`)
            continue
        }
        const beyond = c.testOnlyTreatments.filter((t) => kinds.indexOf(t.kind) < 0)
        if (id === raw.knowledgeRun && beyond.length) errors.push(`the knowledge run ${id} carries a treatment beyond the pathway (${beyond.map((t) => t.id).join(', ')})`)
        if (id !== raw.knowledgeRun && !beyond.length) errors.push(`the run ${id} carries no treatment beyond the pathway, so it would be a second knowledge run`)
        for (const kind of kinds) if (!c.testOnlyTreatments.some((t) => t.kind === kind)) errors.push(`the run ${id} does not carry the pathway's ${kind}`)
    }
    if (runOrder.indexOf(String(raw.knowledgeRun)) < 0) errors.push('the knowledge run is not among the runs')
    for (const c of inputs.cases) if (runOrder.indexOf(c.id) < 0) errors.push(`the case ${c.id} is not among the runs`)
    const questions = Array.isArray(raw.questions) ? (raw.questions as unknown[]) : []
    questions.forEach((q, n) => {
        if (!isObject(q) || q.order !== n + 1 || !filled(q.question) || !filled(q.why) || typeof q.next !== 'boolean') errors.push(`question ${n + 1} names its order, the question, why, and whether it is next`)
        else if (q.next !== (n === 0)) errors.push(`question ${n + 1}: only the first, the most consequential, is the next gap`)
    })
    if (!questions.length) errors.push('no question')
    const ids = new Set(items.map((i) => i.itemId))
    for (const r of Array.isArray(raw.relationships) ? (raw.relationships as unknown[]) : []) {
        if (!isObject(r) || !filled(r.id) || !filled(r.relationship) || !filled(r.car) || !filled(r.executable) || !filled(r.engineUse) || !Array.isArray(r.rows) || !r.rows.length || !Array.isArray(r.items)) {
            errors.push('a relationship names its id, the relationship, the rows that state it, the CAR rating, whether it is executable, what the engine does with it, and its items')
            continue
        }
        const ruling = inputs.rulings.find((x) => x.id === r.rulingRef)
        if (!ruling || typeof r.word !== 'number' || r.word < 0 || r.word >= ruling.words.length) errors.push(`relationship ${r.id}: its words are not words a ruling of the inputs holds`)
        for (const id of r.items as unknown[]) if (!ids.has(String(id))) errors.push(`relationship ${r.id} names ${String(id)}, which the restatement does not hold`)
    }
    if (!Array.isArray(raw.relationships) || !raw.relationships.length) errors.push('no relationship')
    if (!Array.isArray(raw.car) || !(raw.car as unknown[]).every(filled)) errors.push('the CAR notes are a list of words')
    if (errors.length) throw new Error(`foundational test data refused: ${errors.join(' | ')}`)
    return JSON.parse(JSON.stringify(raw)) as FoundationalTestData
}

/** Where a run stops, in a few words. */
export function stopOf(r: HandoffResult): string {
    if (r.form.stop !== null) return `stopped before the chain: ${r.form.stop}`
    if (!r.chain) return 'not run'
    if (r.chain.outcome === 'served') return 'the chain would serve it (a TEST-ONLY run; nothing here reaches a coach)'
    return `refused at ${r.refusal?.stage ?? 'an unnamed stage'}`
}

/**
 * **One restated item's effect in one run**, read from the run's own result (OURS): withheld by a declared TEST-ONLY treatment; refused on a
 * line the refusal cites (the line's element is established by the item, or the line is the item's own); carried, where a line of the built
 * game rests on it, or where the chain records it as shaping a line it built (its own record on the line, e.g. NARROWS); entered derivation
 * with no line resting on it; or not reached. A REPLACE_DECLARATION treatment on a declaration with the item's selector is said beside the
 * effect.
 */
export function effectOf(contractId: string, item: RestatedItem, r: HandoffResult): string {
    const withheld = r.testOnlyTreatments.find((t) => t.kind === 'WITHHOLD_ITEMS' && t.contractId === contractId && (t.itemIds ?? []).indexOf(item.itemId) >= 0)
    if (withheld) return `withheld by treatment ${withheld.id}`
    const declared = r.testOnlyTreatments
        .filter((t) => t.kind === 'REPLACE_DECLARATION' && t.contractId === contractId && t.declaration && t.declaration.selector === item.selector)
        .map((t) => ` (its ${t.declaration!.row} line declared ${t.declaration!.to}${t.declaration!.qualifier ? ` ${t.declaration!.qualifier}` : ''} by treatment ${t.id})`)
        .join('')
    const own = `c:${contractId}:${item.itemId}::`
    const basis = r.refusalBasis
    const refusedOn = basis ? [...new Set([...basis.cited.filter((c) => c.contractId === contractId && c.itemId === item.itemId).map((c) => c.ref), ...basis.gaps.filter((g) => g.ref.slice(0, own.length) === own).map((g) => g.ref)])] : []
    if (refusedOn.length) return `refused on ${refusedOn.join(', ')} (at ${r.refusal?.stage ?? 'an unnamed stage'})${declared}`
    const ref = `${contractId} ${item.itemId}`
    const then = r.chain?.outcome === 'served' ? '' : ` (the run then stopped: ${stopOf(r)})`
    const carried = r.lines.filter((l) => l.premises.some((p) => p.ref === ref)).map((l) => l.lineId)
    if (carried.length) return `carried: ${carried.join(', ')} rest on it${then}${declared}`
    // A line the chain records the item as shaping (e.g. narrowing the line's permitted set), where no line names it as a premise.
    const shaped = (r.consumption?.draftShaped ?? []).filter((s) => s.by.some((b) => b.split(' ').slice(0, 2).join(' ') === ref))
    if (shaped.length) return `carried: ${shaped.map((s) => `${s.lineId} resolved to ${show(s.value)}, which the chain records it ${s.by.filter((b) => b.split(' ').slice(0, 2).join(' ') === ref).map((b) => b.split(' ').slice(2).join(' ')).join(', ')}`).join('; ')}${then}${declared}`
    if (r.consumption && r.consumption.draftItemsDerived.indexOf(ref) >= 0) return `entered derivation; no line of the built game rests on it${r.lines.length ? '' : ` (no game was built: ${stopOf(r)})`}${declared}`
    return `not reached (${stopOf(r)})${declared}`
}

/** Our interpretation of an item, said in the middle column. */
function interpretationOf(i: RestatedItem): string {
    const who = i.basis === 'ASSUMED' ? 'ASSUMED, OURS (an assumption in our restatement; no source row states it)' : 'CANDIDATE: authored by us, unreviewed'
    return `${i.row} ${i.selector} ${i.requirement} ${show(i.value)}; ${who}; scope ${i.scope} (OURS, over-applying: the scope stays UNRESOLVED); checkability ${i.checkability}`
}

/** The left column: each source row with its standing and evidence, or, for an item with no source row, its own evidence. */
function sourceColumnOf(i: RestatedItem, data: FoundationalTestData): string {
    if (!i.sources.length) return `no source row: ${plain(i.basisEvidence)}`
    return i.sources
        .map((s) => {
            const row = data.sourceRows.find((x) => x.rowId === s.rowId)
            return `${s.rowId} (${s.table}, line ${s.line}): ${row ? `${row.standing}: ${plain(row.evidence)}` : 'no standing given'}`
        })
        .join('; ')
}

/** The report's sections for the test, in the order the head of this file lists them. */
export function foundationalTestText(results: HandoffResult[], inputs: HandoffInputs, data: FoundationalTestData, items: RestatedItem[]): string[] {
    const out: string[] = []
    const runs = data.runOrder.map((id) => {
        const r = results.find((x) => x.caseId === id)
        if (!r) throw new Error(`foundational test: no result for the run ${id}`)
        return r
    })
    const beyond = (r: HandoffResult) => r.testOnlyTreatments.filter((t) => data.pathwayTreatmentKinds.indexOf(t.kind) < 0)
    out.push(plain(data.standing))
    out.push('The chain\'s own sentences (a refusal\'s summary and reasons, the laws account) are printed with each gendered pronoun replaced by [Christian\'s] or [Christian], to whom each refers; every other word is the chain\'s.')
    out.push('')
    out.push(`THE RUNS (${runs.length}; the knowledge as it stands: ${data.knowledgeRun}; every other run carries a TEST-ONLY treatment)`)
    for (const r of runs) {
        const extra = beyond(r)
        out.push(`- ${r.caseId}: ${stopOf(r)}${r.caseId === data.knowledgeRun ? ' [the knowledge as it stands, with our CANDIDATE restatement]' : ` [TEST-ONLY: ${extra.map((t) => `${t.id} (${plain(t.label)})`).join('; ')}]`}`)
        if (r.caseId !== data.knowledgeRun) out.push(`   ${plain(data.treatmentRunWords)}`)
        for (const reason of r.refusal?.reasons ?? []) out.push(`   reason: ${plain(reason)}`)
        if (r.refusalBasis) {
            out.push(`   what it rests on (OURS): ${r.refusalBasis.verdict}; basis mix ${r.refusalBasis.mix}; ${plain(r.refusalBasis.why)}`)
            if (r.refusalBasis.verdict === 'RESTATEMENT-ONLY') out.push(`   ${plain(data.restatementOnlyWords)}`)
        }
        for (const t of extra.filter((x) => x.kind === 'LAWS_CLASSIFICATION')) out.push(`   the laws check read: ${t.standIn ? `our DRAFT classification with the TEST-ONLY stand-in ${t.standIn.law} ${t.standIn.materiality} (${t.id})` : `our DRAFT classification (${t.id}), a reading of ours for Christian's review, not a ruling`}`)
    }
    out.push('')
    out.push(`HOW TO READ THE BUILD'S LABELS: ${plain(data.candidateMapping)}`)
    out.push('')
    out.push(`THE RESTATEMENT, ITEM BY ITEM (${data.contractId}, read from the TEST-ONLY draft store ${data.draftStore}; ${items.length} items; three columns: the source row and its standing | our interpretation | its effect in each run)`)
    for (const i of items) {
        out.push(`- ${i.itemId}`)
        out.push(`   source row and its standing: ${sourceColumnOf(i, data)}`)
        out.push(`   our interpretation: ${interpretationOf(i)}`)
        for (const r of runs) out.push(`   effect in ${r.caseId}: ${effectOf(data.contractId, i, r)}`)
    }
    out.push('')
    const known = runs.find((r) => r.caseId === data.knowledgeRun) as HandoffResult
    out.push(`UNRESOLVED (${known.notCarried.length}; kept explicit, never closed by an assumption; the same list stands on every run)`)
    for (const n of known.notCarried) out.push(`- ${n.id} [${n.label}] ${plain(n.what)}: ${plain(n.where)}`)
    out.push('')
    out.push(`SMALLEST SPECIFIC SOURCE MATERIAL (questions only, in order of consequence; nothing is drafted as knowledge)`)
    for (const q of data.questions) out.push(`${q.order}. ${plain(q.question)}${q.next ? ' [the next consequential gap]' : ''}: ${plain(q.why)}`)
    out.push('')
    const first = data.relationships[0]
    const ruling = inputs.rulings.find((x) => x.id === first.rulingRef)
    out.push(`ESSENTIAL REPRESENTATIVE RELATIONSHIPS (${data.relationships.length})${ruling ? `, as Christian names them: ${quoted(ruling.words[first.word])} (${citedDateOf(ruling, true)})` : ''}`)
    for (const rel of data.relationships) {
        out.push(`- ${rel.relationship}`)
        out.push(`   rows that state it: ${rel.rows.map(plain).join('; ')}`)
        out.push(`   CAR rating: ${plain(rel.car)}`)
        out.push(`   executable: ${plain(rel.executable)}`)
        out.push(`   engine use: ${plain(rel.engineUse)}`)
        const mine = items.filter((i) => rel.items.indexOf(i.itemId) >= 0)
        if (!mine.length) out.push('   restated items bearing on it: none')
        else for (const r of runs) out.push(`   in ${r.caseId}: ${mine.map((i) => `${i.itemId} ${effectOf(data.contractId, i, r)}`).join('; ')}`)
    }
    for (const note of data.car) out.push(`CAR: ${plain(note)}`)
    out.push('')
    return out
}
