/**
 * **The handoff's report, in plain text** — review pathway only, TEST-ONLY review evidence (Christian's reply received 7 November 2026, section 1;
 * DESIGN section 3.1, a second stage file for the report text).
 *
 * Per case: the inputs (Christian's words verbatim with their received dates, and how each enters the checked chain), Step 1, Step 2, the form
 * decision, the configuration lines (value, class, label, determining premises and their sources, decision kind), the coach text with each
 * sentence's wording status and class, the diagram summary, the laws and requirement accounts, the refusal, the gaps, and the illustrative
 * values and TEST-ONLY treatments in their own lists; and on every configuration the line that productive, recurring opportunities are not
 * established. Double quotation marks are printed only around Christian's words, verbatim; every value, label and engine sentence is printed
 * in single quotation marks or bare (a double quotation mark inside an engine sentence is printed as a single one).
 */
import { classLabel, receivedOf } from './assembly'
import { CLASS_WORDS, DECISION_KIND_EXAMINATION, DECISION_KIND_RULE, GRADING_MAP, HandoffInputs, HandoffResult, OPPORTUNITIES_NOT_ESTABLISHED, Premise, PREMISE_KINDS } from './handoff'

/** A value as printed: strings in single quotation marks, structures compactly, never a double quotation mark. */
export function show(v: unknown): string {
    if (v === null || v === undefined) return 'none'
    if (typeof v === 'string') return `'${plain(v)}'`
    if (typeof v === 'number' || typeof v === 'boolean') return String(v)
    if (Array.isArray(v)) return `[${v.map(show).join(', ')}]`
    return `{${Object.entries(v as Record<string, unknown>).map(([k, x]) => `${k}: ${show(x)}`).join(', ')}}`
}

/** An engine or record sentence with any double quotation mark printed as a single one (only Christian's words keep double ones). */
export const plain = (s: string): string => s.split('"').join("'")

/** Christian's words in quotation marks: straight ones, or typographic ones where the words themselves hold a straight one. */
const OPEN_QUOTE = String.fromCharCode(0x201c)
const CLOSE_QUOTE = String.fromCharCode(0x201d)
export const quoted = (words: string): string => (words.indexOf('"') >= 0 ? `${OPEN_QUOTE}${words}${CLOSE_QUOTE}` : `"${words}"`)

const classWords = (c: number | null): string => (c === null ? 'no class claimed' : classLabel(c as 1 | 2 | 3 | 4 | 5 | 6))

function premiseLine(p: Premise): string {
    const parts = [`${plain(p.ref)}: ${classWords(p.sixClass)}; ${plain(p.label)}`]
    if (p.source) parts.push(`source: ${plain(p.source)}; the source's own standing: ${plain(p.sourceStanding ?? 'not recorded')}`)
    if (p.note) parts.push(plain(p.note))
    return parts.join(' | ')
}

function caseText(r: HandoffResult, inputs: HandoffInputs): string[] {
    const out: string[] = []
    const push = (s = '') => out.push(s)
    push(`== CASE ${r.caseId}: ${plain(r.label)}`)
    push(`Result standing: ${r.resultStanding}${r.resultStanding === 'CONDITIONAL_NOT_A05_RESULT' ? ' (a conditional diagnostic: never presented as the goal\'s result)' : ''}`)
    push()
    push('1. Inputs')
    push(`   Learning Goal: ${r.goalId ?? 'none (structural case, no Learning Goal)'}`)
    const c = inputs.cases.find((x) => x.id === r.caseId)
    if (c) {
        const s = c.session
        push(`   Session (${s.label}${s.rulingRefs.length ? `; ${s.rulingRefs.join(', ')}` : ''}): ${s.players} players, ${s.lengthM} x ${s.widthM} m, ${s.durationMin} minutes, ${s.specializedRoles} specialized role(s)${s.goals === null ? '' : `, ${s.goals} goal object(s) stated`}`)
    }
    if (r.purpose) {
        push(`   Purpose, source evidence: ${plain(r.purpose.sourceEvidence)}`)
        push(`   Purpose, approval evidence (kept apart): ${plain(r.purpose.approvalEvidence)}`)
    }
    push(`   Christian's rulings, and how each enters the checked chain (${r.rulings.length}; the words are printed once, under 'Christian's words cited'):`)
    for (const ruling of r.rulings) push(`   - ${ruling.ref} (received ${ruling.received}; ${ruling.provisional ? 'provisional' : 'not provisional'}; scope ${ruling.scope ?? 'none stated'}) enters as ${ruling.entersAs}: ${plain(ruling.how)}`)
    push()
    push('2. Step 1 (run by the handoff)')
    const s1 = r.receive.step1
    if (!s1) push('   none: a structural case has no Learning Goal')
    else {
        push(`   status ${s1.status}; basis ${s1.basis ?? 'none'}; primary ${s1.primary.join(', ') || 'none'}; secondary ${s1.secondary.join(', ') || 'none'}; context ${s1.contextId ?? 'none'}`)
        push(`   filed scope ${s1.scope ?? 'none'}; qualifier ${s1.qualifier ? `'${plain(s1.qualifier)}'` : 'none'}; established by ${s1.establishedBy}`)
        for (const x of r.receive.scopeSetBy) push(`   scope set by ${plain(x)}`)
        if (s1.missing.length) push(`   missing: ${s1.missing.map(plain).join('; ')}`)
    }
    push()
    push('3. Step 2 (run by the handoff)')
    const s2 = r.receive.step2
    if (!s2) push('   none: a structural case has no Learning Goal')
    else push(`   status ${s2.status}; selected ${s2.selected ?? 'none'}; compatible ${s2.compatible.join(', ') || 'none'}; preference ${s2.preference}`)
    push()
    push('4. Form decision')
    push(`   ${r.form.decision}: ${r.form.formId ?? 'no form'}`)
    if (r.form.premise) push(`   ${premiseLine(r.form.premise)}`)
    push(`   why: ${plain(r.form.why)}`)
    push(`   alternatives retained, with no preference: ${r.form.alternativesRetained.join(', ') || 'none'}`)
    if (r.chain) push(`   the chain's own pick: ${plain(r.chain.scorerPick ?? 'none: selection refused before the form could be placed')}`)
    if (r.form.stop) push(`   STOP: ${plain(r.form.stop)}`)
    push()
    push('5. Manipulations')
    if (!r.manipulations.length) push('   none proposed: nothing is added (K2, approved for review-only use); the configuration is the form\'s own')
    for (const m of r.manipulations) push(`   - ${m.id}: ${plain(m.outcome)}${m.premise ? ` | ${premiseLine(m.premise)}` : ''}`)
    push()
    push('6. The checked chain')
    if (!r.chain) push('   not run: the handoff stopped before the chain (see 4)')
    else {
        push(`   outcome ${r.chain.outcome}${r.chain.stage ? ` at ${r.chain.stage}` : ''}${r.chain.summary ? `: ${plain(r.chain.summary)}` : ''}`)
        for (const reason of r.chain.reasons) push(`   - ${plain(reason)}`)
        push(`   context: ${plain(r.chain.contextComparison)}`)
        push(`   Game Problems: ${plain(r.chain.gameProblemComparison)}`)
        push(`   affordance lenses: ${plain(r.chain.affordanceLenses)}`)
        push(`   constraints in the selection: ${r.chain.constraints.join(', ') || 'none'}`)
    }
    push()
    push(`7. Configuration lines (${r.lines.length})`)
    for (const l of r.lines) {
        push(`   ${l.lineId} | ${l.path} | ${show(l.value)}`)
        push(`     ${classWords(l.sixClass)}; ${plain(l.label)} | decision kind ${l.decisionKind ?? 'none (no configuration value)'}${l.decisionKindContextual ? ' (contextual)' : ''}${l.note ? ` | ${plain(l.note)}` : ''}`)
        for (const p of l.premises) push(`     premise: ${premiseLine(p)}`)
    }
    push()
    const served = r.sentencesServed
    push(`8. Coach text (${r.sentences.length} sentences; ${served === null ? 'none' : served ? 'served' : 'the review draft of a communication refusal: DRAFT, NOT SERVED'})`)
    for (const s of r.sentences) {
        push(`   [${s.section}${s.block ? ` | ${s.block}` : ''}] ${plain(s.text)}`)
        push(`     wording ${s.wording}${s.reviewOnly ? ' (review-only, DRAFT, not served to any coach)' : ''}; status ${s.status}; ${classWords(s.sixClass)}; ${plain(s.label)}`)
        if (s.otherLabels.length) push(`     other classes and labels among its lines: ${s.otherLabels.map(plain).join(' / ')}`)
        push(`     joins: ${s.joined.join(', ') || 'none'}`)
        for (const t of s.throughElement) push(`     through its element: ${plain(t)}`)
        if (s.unjoined.length) push(`     joins no line: ${s.unjoined.join(', ')}`)
    }
    if (r.withheld.length) {
        push('   withheld fields (said only in approved wording):')
        for (const w of r.withheld) push(`   - ${w.path}: ${plain(w.reason)}`)
    }
    push()
    push('9. Diagram')
    if (!r.diagram) push('   none')
    else {
        push(`   served to a coach: ${r.diagram.served ? 'yes' : 'no'}; the review model's verdict: ${r.diagram.verdict ?? 'none'}`)
        push(`   area ${show(r.diagram.area)}; counts ${show(r.diagram.counts)}; legend ${show(r.diagram.legend)}`)
        if (r.diagram.zones.length) push(`   zones ${show(r.diagram.zones)}`)
        if (r.diagram.findings.length) push(`   findings ${show(r.diagram.findings)}`)
        push('   no team start placement is drawn: the configuration holds none (the kick-off is the Laws\' default and the centre mark has no register row); the own-half schematic Christian permitted is not drawn')
    }
    push()
    push('10. Laws account')
    if (!r.laws && !r.lawEntries.length) push('   none')
    if (r.laws) {
        push(`   mode ${r.laws.mode ?? 'none'}`)
        for (const o of r.laws.owed) push(`   owed: ${plain(o)}`)
        for (const o of r.laws.reportedForReview) push(`   reported for review: ${plain(o)}`)
    }
    for (const e of r.lawEntries) push(`   ${e.lineId}: ${e.status}${e.removedByRealization ? ' (departed from on the realization)' : ''}`)
    push()
    push('11. Requirement account')
    if (!r.requirementAccount) push('   none (the build stopped before the context-scoring guard, or no context role)')
    else {
        push(`   status ${r.requirementAccount.status}; contract ${r.requirementAccount.contract ?? 'none'}`)
        for (const [component, account] of r.requirementAccount.components) push(`   ${component}: ${account}`)
        if (!r.requirementAccount.components.length) push('   no scoring-condition component is carried')
    }
    push()
    push('12. Refusal')
    if (!r.refusal) push('   none: served')
    else {
        push(`   stage ${r.refusal.stage}`)
        for (const reason of r.refusal.reasons) push(`   - ${plain(reason)}`)
    }
    push()
    push(`13. Gaps (${r.gaps.length})`)
    for (const g of r.gaps) push(`   - ${plain(g)}`)
    push()
    push(`14. Illustrative values (${r.illustrative.length}), kept apart from production-authorized values`)
    for (const i of r.illustrative) push(`   - ${i.id} ${plain(i.what)}: ${show(i.value)}; ${plain(i.how)}${i.rulingRefs.length ? `; permitted by ${i.rulingRefs.join(', ')}` : ''}`)
    push(`   stand-in items (${r.standIns.length}):`)
    for (const s of r.standIns) push(`   - ${s.id} (${s.label}): determines ${s.determines.join(', ') || 'no line'}; ${plain(s.why)}`)
    push()
    push(`15. TEST-ONLY treatments (${r.testOnlyTreatments.length})`)
    for (const t of r.testOnlyTreatments) push(`   - ${t.id} [${t.label}] ${plain(t.what)}. Effect: ${plain(t.effect)}. Why: ${plain(t.why)}${t.itemIds ? ` (items ${t.itemIds.join(', ')})` : ''}`)
    push()
    push(`16. Not carried by the chain (${r.notCarried.length})`)
    for (const n of r.notCarried) push(`   - ${n.id} [${n.label}] ${plain(n.what)}: ${plain(n.where)}`)
    push()
    push(`17. ${OPPORTUNITIES_NOT_ESTABLISHED}`)
    push()
    return out
}

/** The whole report: the frame (classes, grading map, decision-kind rule), every case, and the input counts given by the test. */
export function handoffReportText(results: HandoffResult[], inputs: HandoffInputs, counts: string[]): string {
    const out: string[] = []
    out.push('HANDOFF REPORT: the isolated reusable configuration handoff (TEST-ONLY review evidence)')
    out.push('')
    out.push('What this is: the review pathway\'s Steps 1 and 2 handed to the checked configuration and rendering chain, case by case, with every line and sentence graded by what determined it. Engineering evidence only: passing these tests is not evidence of ecological suitability or of representative learning quality in the field. Nothing here is served to a coach, written to production knowledge, or an authorization.')
    out.push(`Every configuration below: ${OPPORTUNITIES_NOT_ESTABLISHED}.`)
    out.push('')
    out.push('Christian\'s six classes:')
    for (const w of CLASS_WORDS) out.push(`   ${w}`)
    out.push('')
    out.push('The grading map (OURS, for Christian\'s review): each line takes the weakest class among its determining premises; each premise is printed with its own standing and, for a restatement, its source\'s standing beside it.')
    for (const k of PREMISE_KINDS) out.push(`   ${k}: ${GRADING_MAP[k].standing ?? 'no standing'}; printed '${plain(GRADING_MAP[k].label)}'; ${plain(GRADING_MAP[k].what)}`)
    out.push('')
    out.push('Decision kinds A, B and C (OURS, for Christian\'s review; computed per line by this rule, with the case\'s contextual overrides):')
    for (const rule of DECISION_KIND_RULE) out.push(`   ${plain(rule)}`)
    out.push('The examination of the existing structures (OURS, for Christian\'s review):')
    for (const line of DECISION_KIND_EXAMINATION) out.push(`   ${plain(line)}`)
    out.push('')
    out.push('Input counts:')
    for (const line of counts) out.push(`   ${plain(line)}`)
    out.push('')
    out.push(`Christian's words cited (${inputs.rulings.length} entries, verbatim, each with its received date and the file it is filed in):`)
    for (const ruling of inputs.rulings) {
        out.push(`   ${ruling.id}, received ${receivedOf(ruling)}${ruling.provisional ? ', provisional' : ''}; scope ${ruling.scope ?? 'none stated'}; filed in ${plain(ruling.file)}`)
        for (const w of ruling.words) out.push(`       ${quoted(w)} (received ${receivedOf(ruling).split(',')[0]})`)
    }
    out.push('')
    for (const r of results) out.push(...caseText(r, inputs))
    return `${out.join('\n')}\n`
}
