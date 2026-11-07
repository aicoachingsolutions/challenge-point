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
import {
    CLASS_WORDS,
    DECISION_KIND_EXAMINATION,
    DECISION_KIND_RULE,
    GRADING_MAP,
    HandoffComparison,
    HandoffInputs,
    HandoffResult,
    HandoffTestRecord,
    OPPORTUNITIES_NOT_ESTABLISHED,
    Premise,
    PREMISE_KINDS,
    RefusalBasis,
    RefusalEntry,
} from './handoff'

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

/** What a refusal rests on, as printed under a case's refusal and in the refusals section. */
export function basisLines(b: RefusalBasis): string[] {
    const out = [`what it rests on (OURS): ${b.verdict}: ${plain(b.why)}; codes ${b.codes.join(', ')}`]
    for (const c of b.cited) out.push(`  cites ${c.ref}: its element is established by item ${c.itemId} of ${c.contractId} (${c.origin === 'DRAFT_STORE' ? 'the TEST-ONLY draft store' : c.origin === 'REALIZATION' ? 'a provisional realization' : c.origin === 'KNOWLEDGE' ? 'knowledge' : c.origin}), basis ${c.basis}; graded ${c.premiseKind}, '${plain(c.label)}'${c.note ? ` (${plain(c.note)})` : ''}`)
    return out
}

/** A comparison of a case and a variant, as the Tests section prints it: what changed, and how much stayed identical. */
export function comparisonLines(c: HandoffComparison): string[] {
    const out: string[] = []
    out.push(`${c.baseCase} -> ${c.variantCase}: outcome ${c.outcome[0] ?? 'not run'}${c.stage[0] ? ` at ${c.stage[0]}` : ''} -> ${c.outcome[1] ?? 'not run'}${c.stage[1] ? ` at ${c.stage[1]}` : ''}`)
    if (c.variantRefusal) out.push(`the variant is refused at ${c.variantRefusal.stage}: ${c.variantRefusal.reasons.map(plain).join('; ')}`)
    if (c.variantRefusal && c.sentences.after === 0 && c.lines.after === 0) {
        // Nothing is configured, so nothing is compared line by line: the base's whole configuration is simply not produced.
        out.push(`no configuration is produced: none of the base's ${c.sentences.before} sentences or ${c.lines.before} lines${c.diagram.before ? ', and no diagram' : ''}`)
        return out
    }
    out.push(`sentences ${c.sentences.before} -> ${c.sentences.after} (${c.sentences.kept} word for word the same); lines ${c.lines.before} -> ${c.lines.after}`)
    for (const s of c.sentences.changed) {
        if (s.before !== null && s.after !== null) out.push(`changed [${s.section}] '${plain(s.before)}' -> '${plain(s.after)}' (${plain(s.gradeBefore ?? '')} -> ${plain(s.gradeAfter ?? '')}; from-paths ${s.fromChanged ? 'changed' : 'the same'})`)
        else if (s.before !== null) out.push(`gone [${s.section}] '${plain(s.before)}' (${plain(s.gradeBefore ?? '')})`)
        else out.push(`added [${s.section}] '${plain(s.after ?? '')}' (${plain(s.gradeAfter ?? '')})`)
    }
    for (const s of c.sentences.keptButChanged) out.push(`same words, ${s.fromChanged ? 'other from-paths' : 'same from-paths'}: '${plain(s.text)}' (${plain(s.gradeBefore)} -> ${plain(s.gradeAfter)})`)
    for (const l of c.lines.changed) out.push(`line ${l.lineId}: ${show(l.before)} -> ${show(l.after)} (${plain(l.gradeBefore)} -> ${plain(l.gradeAfter)})`)
    if (c.lines.added.length) out.push(`lines added (${c.lines.added.length}): ${c.lines.added.join(', ')}`)
    if (c.lines.removed.length) out.push(`lines gone (${c.lines.removed.length}): ${c.lines.removed.join(', ')}`)
    if (!c.diagram.changed.length) out.push('diagram: identical')
    else
        for (const key of c.diagram.changed) {
            const pick = (d: HandoffComparison['diagram']['before']) => (d ? (d as unknown as Record<string, unknown>)[key] : undefined)
            out.push(key === 'the diagram itself' ? `diagram: ${show(c.diagram.before)} -> ${show(c.diagram.after)}` : `diagram ${key}: ${show(pick(c.diagram.before))} -> ${show(pick(c.diagram.after))}`)
        }
    out.push(`identical: lines ${c.identical.lines ? 'yes' : 'no'}, sentences ${c.identical.sentences ? 'yes' : 'no'}, diagram ${c.identical.diagram ? 'yes' : 'no'}`)
    return out
}

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
    for (const m of r.manipulations) {
        push(`   - ${m.id} (purpose ${m.purpose}; ${m.manipulation}): ${plain(m.outcome)}${m.premise ? ` | ${premiseLine(m.premise)}` : ''}`)
        if (m.placedContracts.length) push(`     the chain derived from ${m.placedContracts.join(', ')} for it; every line from it also rests on the relationship premise above`)
    }
    if (r.proposedChoices.length) {
        push('   Proposed values for lines (applied only as ILLUSTRATIVE supplied choices, never over a line Christian\'s ruling closes):')
        for (const p of r.proposedChoices) push(`   - ${p.id}: ${p.lineId} = ${show(p.value)}: ${plain(p.outcome)}`)
    }
    push()
    push('6. The checked chain')
    if (!r.chain) push('   not run: the handoff stopped before the chain (see 4)')
    else {
        push(`   outcome ${r.chain.outcome}${r.chain.stage ? ` at ${r.chain.stage}` : ''}${r.chain.summary ? `: ${plain(r.chain.summary)}` : ''}`)
        for (const reason of r.chain.reasons) push(`   - ${plain(reason)}`)
        push(`   context: ${plain(r.chain.contextComparison)}`)
        push(`   Game Problems: ${plain(r.chain.gameProblemComparison)}`)
        if (r.chain.gameProblemOverride) push(`   Game Problem in the TEST-ONLY record: ${plain(r.chain.gameProblemOverride)}`)
        push(`   affordance lenses: ${plain(r.chain.affordanceLenses)}`)
        push(`   constraints in the selection: ${r.chain.constraints.join(', ') || 'none'}`)
        if (r.chain.fidelityViolations !== null) push(`   fidelity violations on the text: ${r.chain.fidelityViolations}`)
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
        if (r.refusalBasis) for (const line of basisLines(r.refusalBasis)) push(`   ${line}`)
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

/**
 * The Tests section: each test with what it shows, what was measured, and three standings kept apart (Christian's reply of 7 November, section
 * 13): implemented (the mechanism code that ran it), passing engineering test (the unit test's exact assertions, as run), ecological suitability
 * (never established by any test here).
 */
function testsText(tests: HandoffTestRecord[]): string[] {
    const out: string[] = []
    const passing = tests.filter((t) => t.verdict === 'passing engineering test').length
    out.push(`TESTS (${tests.length}; ${passing} passing engineering tests, ${tests.length - passing} failing). Each test keeps three things apart: implemented (what code ran it), passing engineering test (whether its exact assertions held when the unit test ran), and ecological suitability, which no test here establishes: they show what the mechanism does, never that an activity is suitable for its Learning Goal. 'N7:n' cites line n of Christian's first reply of 7 November (the handoff authorization), as filed. A variant is a case copied and changed in one stated respect, held to the same input validator and run by the same mechanism and chain; its comparison with its base is printed under 'measured'.`)
    let group = ''
    for (const t of tests) {
        if (t.group !== group) {
            group = t.group
            out.push('')
            out.push(`-- ${group}`)
        }
        out.push(`${t.id} (${t.cites}): ${plain(t.title)}`)
        out.push(`   shows: ${plain(t.shows)}`)
        out.push(`   implemented: yes (the handoff mechanism with the real checked chain, through the unit test's wiring); passing engineering test: ${t.verdict === 'passing engineering test' ? 'yes' : `NO (${plain(t.verdict)})`}; ecological suitability: not established`)
        for (const m of t.measured) out.push(`   measured: ${plain(m)}`)
    }
    return out
}

/** The refusals section (Christian's second reply of 7 November, section 2): every refusal in the evidence and what it rests on. */
function refusalsText(refusals: RefusalEntry[]): string[] {
    const out: string[] = []
    const count = (v: string) => refusals.filter((r) => r.basis.verdict === v).length
    out.push(`REFUSALS AND WHAT THEY REST ON (${refusals.length}: ${count('RESTATEMENT-ONLY')} RESTATEMENT-ONLY, ${count('MIXED')} MIXED, ${count('NOT KNOWLEDGE')} NOT KNOWLEDGE). OURS, read from each refusal's own reasons; no check is changed by it (Christian's second reply of 7 November: "No changes to validation behavior are authorized by this email."). A RESTATEMENT-ONLY refusal rests only on our restatements, which are CANDIDATE: it may be conservative without establishing that the configuration violates approved knowledge. Each cited line is read back to the item that establishes its element; the line's own bound may come from another item, which this reading does not name.`)
    for (const r of refusals) {
        out.push(`- ${r.where}: stage ${r.basis.stage}; obstructs the configuration pathway: ${plain(r.obstructs)}`)
        for (const line of basisLines(r.basis)) out.push(`   ${line}`)
    }
    return out
}

/** The whole report: the frame (classes, grading map, decision-kind rule), the tests and the refusals, every case, and the input counts given by the test. */
export function handoffReportText(results: HandoffResult[], inputs: HandoffInputs, counts: string[], tests: HandoffTestRecord[] = [], refusals: RefusalEntry[] = []): string {
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
    if (tests.length) {
        out.push(...testsText(tests))
        out.push('')
    }
    if (refusals.length) {
        out.push(...refusalsText(refusals))
        out.push('')
    }
    out.push(`Christian's words cited (${inputs.rulings.length} entries, verbatim, each with its received date and the file it is filed in):`)
    for (const ruling of inputs.rulings) {
        out.push(`   ${ruling.id}, received ${receivedOf(ruling)}${ruling.provisional ? ', provisional' : ''}; scope ${ruling.scope ?? 'none stated'}; filed in ${plain(ruling.file)}`)
        for (const w of ruling.words) out.push(`       ${quoted(w)} (received ${receivedOf(ruling).split(',')[0]})`)
    }
    out.push('')
    for (const r of results) out.push(...caseText(r, inputs))
    return `${out.join('\n')}\n`
}
