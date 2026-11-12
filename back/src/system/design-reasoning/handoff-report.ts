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
import { citedDateOf, classLabel } from './assembly'
import {
    CLASS_WORDS,
    DECISION_KIND_EXAMINATION,
    DECISION_KIND_RULE,
    GoalStopRun,
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
    const out = [`what it rests on (OURS): ${b.verdict}: ${plain(b.why)}; codes ${b.codes.join(', ')}`, `  basis mix of the cited items: ${b.mix}`]
    for (const c of b.cited) {
        const where = c.origin === 'DRAFT_STORE' ? 'the TEST-ONLY draft store' : c.origin === 'REALIZATION' ? 'a provisional realization' : c.origin === 'KNOWLEDGE' ? 'knowledge' : c.origin
        const whose = c.elementNotBounding ? 'the line is bounded by' : 'its element is established by'
        out.push(`  cites ${c.ref} (found in ${plain(c.via)}): ${whose} item ${c.itemId} of ${c.contractId} (${where}), basis ${c.basis}; graded ${c.premiseKind}, ${c.sixClass === null ? 'no class claimed' : `class ${c.sixClass}`}, '${plain(c.label)}'${c.source ? `; source: ${plain(c.source)}; the source's standing as the review pathway reads its status fields (OURS): ${plain(c.sourceStanding ?? 'not recorded')}` : ''}${c.note ? ` (${plain(c.note)})` : ''}`)
        if (c.elementNotBounding) out.push(`    ${plain(c.elementNotBounding)}`)
        if (c.chainReading) out.push(`    ${plain(c.chainReading)}`)
        if (c.owedBy) out.push(`    which declaration owes it (OURS, read from the chain's reach and scope rule): ${plain(c.owedBy)}`)
    }
    for (const g of b.gaps) out.push(`  a line nobody established (a gap): ${g.ref}: ${plain(g.why)}; ${plain(g.element)}`)
    return out
}

/** An outcome as a comparison prints it: a TEST-ONLY run reaches no coach, so a served outcome is what the chain would serve. */
const outcomeWords = (outcome: string | null, stage: string | null): string => (outcome === 'served' ? 'the chain would serve it' : outcome ? `${outcome}${stage ? ` at ${stage}` : ''}` : `not run${stage ? ` (stopped at ${stage})` : ''}`)

/** A comparison of a case and a variant, as the Tests section prints it: what changed, and how much stayed identical. */
export function comparisonLines(c: HandoffComparison): string[] {
    const out: string[] = []
    out.push(`${c.baseCase} -> ${c.variantCase}: outcome: ${outcomeWords(c.outcome[0], c.stage[0])} -> ${outcomeWords(c.outcome[1], c.stage[1])}`)
    if (c.variantRefusal) out.push(`the variant is refused at ${c.variantRefusal.stage}: ${c.variantRefusal.reasons.map(plain).join('; ')}`)
    if (c.variantRefusal && c.sentences.after === 0 && c.lines.after === 0) {
        // Nothing is configured, so nothing is compared line by line: the base's whole configuration is simply not produced.
        out.push(`no configuration is produced: none of the base's ${c.sentences.before} sentences or ${c.lines.before} lines${c.diagram.before ? ', and no diagram' : ''}`)
        return out
    }
    out.push(`sentences ${c.sentences.before} -> ${c.sentences.after} (${c.sentences.kept} word for word the same); lines ${c.lines.before} -> ${c.lines.after}`)
    for (const s of c.sentences.changed) {
        if (s.before !== null && s.after !== null) out.push(`changed [${s.section}] '${plain(s.before)}' -> '${plain(s.after)}' (wording ${s.wordingBefore}, ${plain(s.gradeBefore ?? '')} -> wording ${s.wordingAfter}, ${plain(s.gradeAfter ?? '')}; from-paths ${s.fromChanged ? 'changed' : 'the same'})`)
        else if (s.before !== null) out.push(`gone [${s.section}] '${plain(s.before)}' (wording ${s.wordingBefore}, ${plain(s.gradeBefore ?? '')})`)
        else out.push(`added [${s.section}] '${plain(s.after ?? '')}' (wording ${s.wordingAfter}, ${plain(s.gradeAfter ?? '')})`)
    }
    for (const s of c.sentences.keptButChanged) out.push(`same words, ${s.fromChanged ? 'other from-paths' : 'same from-paths'}: '${plain(s.text)}' (wording ${s.wording}; ${plain(s.gradeBefore)} -> ${plain(s.gradeAfter)})`)
    for (const l of c.lines.changed) out.push(`line ${l.lineId}: ${show(l.before)} -> ${show(l.after)} (${plain(l.gradeBefore)} -> ${plain(l.gradeAfter)})`)
    if (c.lines.added.length) out.push(`lines added (${c.lines.added.length}): ${c.lines.added.join(', ')}`)
    if (c.lines.removed.length) out.push(`lines gone (${c.lines.removed.length}): ${c.lines.removed.join(', ')}`)
    if (!c.diagram.changed.length) out.push('diagram: identical')
    else
        for (const key of c.diagram.changed) {
            const pick = (d: HandoffComparison['diagram']['before']) => (d ? (d as unknown as Record<string, unknown>)[key] : undefined)
            // The diagram's served flag is said as section 9 says it: a TEST-ONLY run reaches no coach.
            const servedWords = (v: unknown) => (v === true ? 'would be served' : v === false ? 'withheld' : show(v))
            out.push(key === 'the diagram itself' ? `diagram: ${show(c.diagram.before)} -> ${show(c.diagram.after)}` : key === 'served' ? `diagram, the checked chain's verdict: ${servedWords(pick(c.diagram.before))} -> ${servedWords(pick(c.diagram.after))}` : `diagram ${key}: ${show(pick(c.diagram.before))} -> ${show(pick(c.diagram.after))}`)
        }
    out.push(`identical: lines ${c.identical.lines ? 'yes' : 'no'}, sentences ${c.identical.sentences ? 'yes' : 'no'}, diagram ${c.identical.diagram ? 'yes' : 'no'}`)
    return out
}

function premiseLine(p: Premise): string {
    const parts = [`${plain(p.ref)}: ${classWords(p.sixClass)}; ${plain(p.label)}`]
    if (p.source) parts.push(`source: ${plain(p.source)}; the source's standing as the review pathway reads its status fields (OURS): ${plain(p.sourceStanding ?? 'not recorded')}`)
    if (p.note) parts.push(plain(p.note))
    return parts.join(' | ')
}

/**
 * How a citation dates the ruling a result's entry names: the inputs' own ruling, through citedDateOf (a reply pasted without its mail header
 * prints its paste date, never a received date); a ruling the inputs do not hold, the entry's own received words.
 */
function datedRef(inputs: HandoffInputs, ref: string, received: string, dateOnly: boolean): string {
    const r = inputs.rulings.find((x) => x.id === ref)
    return r ? citedDateOf(r, dateOnly) : `received ${dateOnly ? received.split(',')[0] : received}`
}

/** The case's notes for one section, in the data's words, each quotation of Christian's printed verbatim with its received date. */
function noteLines(r: HandoffResult, section: HandoffResult['reportNotes'][number]['section'], inputs: HandoffInputs): string[] {
    return r.reportNotes.filter((n) => n.section === section).map((n) => `${plain(n.text)}${n.quotes.map((q) => ` ${quoted(q.words)} (${datedRef(inputs, q.ref, q.received, true)})`).join('')}`)
}

function caseText(r: HandoffResult, inputs: HandoffInputs): string[] {
    const out: string[] = []
    const push = (s = '') => out.push(s)
    push(`== CASE ${r.caseId}: ${plain(r.label)}`)
    push(`Result standing: ${r.resultStanding}`)
    for (const line of noteLines(r, 'standing', inputs)) push(`   ${line}`)
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
    for (const ruling of r.rulings) push(`   - ${ruling.ref} (${datedRef(inputs, ruling.ref, ruling.received, false)}; ${ruling.provisional ? 'provisional' : 'not provisional'}; scope ${ruling.scope ?? 'none stated'}) enters as ${ruling.entersAs}: ${plain(ruling.how)}`)
    push()
    push('2. Step 1 (run by the handoff)')
    const s1 = r.receive.step1
    if (!s1) push('   none: a structural case has no Learning Goal')
    else {
        push(`   status ${s1.status}; basis ${s1.basis ?? 'none'}; primary ${s1.primary.join(', ') || 'none'}; secondary ${s1.secondary.join(', ') || 'none'}; context ${s1.contextId ?? 'none'}`)
        const qualifier = !s1.qualifier ? 'none' : s1.qualifierRuling ? `${quoted(s1.qualifier)} (${datedRef(inputs, s1.qualifierRuling.ref, s1.qualifierRuling.received, true)}; Christian's words, ${s1.qualifierRuling.ref})` : `'${plain(s1.qualifier)}'`
        push(`   filed scope ${s1.scope ?? 'none'}; qualifier ${qualifier}; established by ${s1.establishedBy}`)
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
        push(`   outcome: ${r.chain.outcome === 'served' ? 'the chain would serve it (a TEST-ONLY run; nothing here reaches a coach)' : `${r.chain.outcome}${r.chain.stage ? ` at ${r.chain.stage}` : ''}`}${r.chain.summary ? `: ${plain(r.chain.summary)}` : ''}`)
        for (const reason of r.chain.reasons) push(`   - ${plain(reason)}`)
        push(`   context: ${plain(r.chain.contextComparison)}`)
        push(`   Game Problems: ${plain(r.chain.gameProblemComparison)}`)
        if (r.chain.gameProblemOverride) push(`   Game Problem in the TEST-ONLY record: ${plain(r.chain.gameProblemOverride)}`)
        push(`   affordance lenses: ${plain(r.chain.affordanceLenses)}`)
        push(`   constraints in the selection: ${r.chain.constraints.join(', ') || 'none'}`)
        if (r.chain.fidelityViolations !== null) push(`   fidelity violations on the text: ${r.chain.fidelityViolations}`)
        // Stage 9, only on a consuming run: what the chain's own account recorded it consumed (never read from the request).
        if (r.consumption === null) push(`   consumption (what the chain's own account recorded): none recorded`)
        else if (r.consumption) {
            const x = r.consumption
            push(`   consumption (what the chain's own account recorded, read from the build, never from the request):`)
            push(`     Game Problem carried from Step 1: ${x.gameProblem ? `${x.gameProblem.gameProblemId} (basis ${x.gameProblem.basis}; ${plain(x.gameProblem.label)}; source ${plain(x.gameProblem.source)}), beside the chain's own reading above, never in its place` : 'none'}`)
            // Stage W1 (a): the Game Problem that governed the lens hints and matched signals, and the hints the selector was handed.
            push(`     Game Problem governing the lens hints and matched signals: ${x.hintsGameProblemId === null ? 'none recorded (the planning model\'s reading governed them)' : `${x.hintsGameProblemId}${x.gameProblem && x.hintsGameProblemId === x.gameProblem.gameProblemId ? ', Step 1\'s' : ''} (its Coverage row replaced the wording's candidates: ${x.hintsGoverned ? 'yes' : 'no'})`}; lens candidates handed to the selector: ${x.lensCandidateIds.join(', ') || 'none'}${x.hintsLensesFrom === 'STEP1_COVERAGE_ROW' ? ' (from Step 1\'s Coverage row, under the TEST-ONLY treatment GP_COVERAGE_LENSES)' : ''}; matched signals: ${x.hintsSignals.join(', ') || 'none'}`)
            push(`     form carried from Step 2: ${x.form ? `${x.form.formId} (${plain(x.form.standing)}); the cells it rests on: ${x.form.cells.map((c) => `${plain(c.cell)} ${c.grade}`).join('; ')}` : 'none'}`)
            push(`     forms the chain's scorer ranked: ${x.formCandidatesScored.join(', ') || 'none'} (read from ${x.formCandidatesFrom})`)
            // Stage W2: under the switch the set is taken whole and every selected member validated; foundation presence only under its treatment.
            push(`     constraints: authority ${x.constraintAuthority}; candidates ${x.constraintCandidateIds.join(', ') || 'none'}; the TEST-ONLY size-rule bypass ${x.sizeRuleBypassed ? 'in force (the authorized set taken whole, every selected member validated)' : 'not in force'}${x.foundationPresenceBypassed ? '; foundation presence not required (the TEST-ONLY treatment FOUNDATION_PRESENCE_BYPASS)' : ''}`)
            // Stage W1 (b): K2's result, consumed in place of a per-goal record, with its rule and its limit in Christian's words.
            if (x.reviewManipulations) {
                const k = x.reviewManipulations
                push(`     manipulations: the review pathway's K2 result (basis ${k.basis}; set ${k.set.join(', ') || 'empty'}), consumed in place of a per-goal authorization record (TEST-ONLY): ${quoted(k.rule)} (${k.cited})`)
                push(`     K2's limit, carried with the result: ${quoted(k.limit)} (${k.cited})`)
            }
            push(`     the selection hook only observed: ${x.selectionObservedOnly === null ? 'it never ran (no selection was returned)' : x.selectionObservedOnly ? 'yes' : 'NO'}; the build's own label for a build from the draft store: ${x.draftStatus ?? 'none'}`)
            push(`     draft store items that entered derivation (${x.draftItemsDerived.length}): ${x.draftItemsDerived.join(', ') || 'none'}`)
        }
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
    push(`8. Coach text (${r.sentences.length} sentences; ${served === null ? 'none' : served ? 'the text the chain would serve, in a TEST-ONLY run' : 'the review draft of a communication refusal: DRAFT, NOT SERVED'})`)
    for (const line of noteLines(r, 'text', inputs)) push(`   note: ${line}`)
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
        const d = r.diagram
        push(`   the checked chain's diagram verdict: ${d.served ? 'would be served' : 'withheld'} (a TEST-ONLY run; nothing here reaches a coach); the review model's verdict: ${d.verdict ?? 'none'}`)
        push(`   area ${show(d.area)}; counts ${show(d.counts)}; legend ${show(d.legend)}`)
        if (d.zones.length) push(`   zones ${show(d.zones)}`)
        if (d.findings.length) push(`   findings ${show(d.findings)}`)
        // The illustrative values this diagram draws (the case's data names where each is drawn), kept apart as section 14 keeps them.
        const drawn = r.illustrative.filter((i) => {
            if (!i.onDiagram) return false
            const v = (d as unknown as Record<string, unknown>)[i.onDiagram]
            return Array.isArray(v) ? v.length > 0 : v !== null && v !== undefined
        })
        push(`   illustrative values on this diagram: ${drawn.map((i) => `${plain(i.what)} ${show(i.value)} (${i.id})`).join('; ') || 'none'}${drawn.length ? ' (see 14. Illustrative values)' : ''}`)
        for (const line of noteLines(r, 'diagram', inputs)) push(`   ${line}`)
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
    if (!r.refusal) push('   none: the chain would serve it (a TEST-ONLY run; nothing here reaches a coach)')
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
    for (const t of r.testOnlyTreatments) {
        // Stage 9: a replaced declaration and a law's stand-in are printed where a treatment names them (no earlier treatment does).
        const declaration = t.declaration ? ` (declaration ${t.contractId} ${t.declaration.row} ${t.declaration.selector}: ${t.declaration.from} -> ${t.declaration.to}${t.declaration.qualifier ? ` ${t.declaration.qualifier}` : ''})` : ''
        const standIn = t.standIn ? ` (stand-in: ${t.standIn.law} ${t.standIn.materiality})` : ''
        push(`   - ${t.id} [${t.label}] ${plain(t.what)}. Effect: ${plain(t.effect)}. Why: ${plain(t.why)}${t.itemIds ? ` (items ${t.itemIds.join(', ')})` : ''}${declaration}${standIn}`)
    }
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

/** Where one run stops, read from its result: before the chain, at a refusal of the chain, or at a game the chain would serve. */
function stopWords(r: HandoffResult): string {
    if (r.form.stop !== null) return `the handoff, before the chain: ${plain(r.form.stop)}`
    if (r.chain === null) return 'not run'
    if (r.chain.outcome === 'served') return 'configuration and text (the chain would serve it)'
    const reasons = r.refusal?.reasons ?? []
    return `the chain refuses at ${r.refusal?.stage ?? 'an unnamed stage'}: '${plain(reasons[reasons.length - 1] ?? 'no reason')}'`
}

/**
 * The 'where each Learning Goal stops' block (review of 7 November, round 3): one line per goal, in the order given, with Step 1's status and
 * context, Step 2's status and the form the handoff decided (with 'never placed' where the chain's own selection refused first), and where each of the goal's runs stops, every value read from the measured runs.
 */
function goalStopsText(runs: GoalStopRun[]): string[] {
    const goals: string[] = []
    for (const run of runs) if (goals.indexOf(run.goalId) < 0) goals.push(run.goalId)
    const out = [`WHERE EACH LEARNING GOAL STOPS (${goals.length} goals; OURS: each value read from the measured run named in brackets: a case, or the test that ran it)`]
    for (const goal of goals) {
        const mine = runs.filter((x) => x.goalId === goal)
        const first = mine[0].result
        const s1 = first.receive.step1
        const s2 = first.receive.step2
        const steps = `Step 1 ${s1 ? `${s1.status}, context ${s1.contextId ?? 'none'}` : 'not run'}; Step 2 ${s2 ? `${s2.status}${s2.selected ? ` ${s2.selected}` : `, selected none${s2.compatible.length ? `, compatible ${s2.compatible.join(', ')}` : ''}`}` : 'not run'}; form ${first.form.decision}${first.form.formId ? ` ${first.form.formId}` : ''}${first.form.formId && first.chain !== null && first.chain.outcome !== 'served' && first.refusal?.stage === 'selection' ? `, never placed: the chain's own selection refused first` : ''}`
        const stops =
            mine.length === 1
                ? `${stopWords(first)} [${mine[0].where}; ${first.resultStanding}]`
                : mine.map((x) => `${x.result.caseId} [${x.where}; ${x.result.resultStanding}]: ${stopWords(x.result)}`).join('; ')
        out.push(`- ${goal}: ${steps}; stops: ${stops}`)
    }
    return out
}

/** The refusals section (Christian's second reply of 7 November, section 2): every refusal in the evidence and what it rests on. */
function refusalsText(refusals: RefusalEntry[], notes: string[]): string[] {
    const out: string[] = []
    const count = (v: string) => refusals.filter((r) => r.basis.verdict === v).length
    out.push(`REFUSALS AND WHAT THEY REST ON (${refusals.length}: ${count('RESTATEMENT-ONLY')} RESTATEMENT-ONLY, ${count('MIXED')} MIXED, ${count('NOT KNOWLEDGE')} NOT KNOWLEDGE; counted from the entries below). OURS, read from each refusal's own reasons and, for a refusal met before any game exists, from the chain's own account behind it (each failing check's own result; each owed line's classification, with the chain's own reach of the line's element for each declaration it was decided over; each open line's permitted alternatives and the items the chain names as bounding it); no check is changed by it (Christian's second reply of 7 November: "No changes to validation behavior are authorized by this email."). The build returns no game at such a refusal, so the unit test runs the chain's own derivation again on the input the build derived from (build-activity's input assembly replicated in the test only) and reads nothing unless it reproduces the build's reasons word for word (at structure the Gate A reasons, at realization the realizer's reasons); otherwise the test fails. A RESTATEMENT-ONLY refusal rests only on items that are ours and unreviewed (our restatements, which are CANDIDATE, DRAFT store items, and assumptions in our restatements): it may be conservative without establishing that the configuration violates approved knowledge. Each cited line is read back to the item that establishes its element, or, for an open line refused for being outside its permitted set (a reason saying the value is not one of the permitted alternatives) whose bounding items the chain names (its narrowing items or bounds), to those items, with the element's item named as not bounding it; each cited item prints its class. The chain's words are kept apart from ours: its line verdict NOT_AUTHORED means nothing authored the line's value, and the chain's reason 'declared gap' is not our gap. The gap rule (OURS): a cited owed line is listed apart as a line nobody established (a gap) when no requirement declaration (NOT_AUTHORED, EXCLUDED or CLAIMED) among those the chain decided it over reaches the line's element class by the chain's own reach function (derivation/reach.ts reaches(), applied by the test to the element class) and the chain's own scope rule; a requirement counts as reaching when its scope reaches the class (an own-involvement declaration reaches only the classes its own object forms) and that function does not answer FALSE, as the chain's classification keeps a requirement in force against a class (classify.ts governingDeclarations, whose requirement kinds this stage file copies and whose scope rule the test wiring mirrors, each held to classify.ts's source text, the mirror's own text included, by an engineering check under TESTS; undetermined is never rounded to false). Every other cited owed line prints which requirement declarations reach its element (which declaration owes it), and, where the chain decided it row-wide, that no contract establishing the element states anything explicit that reaches it. The verdict is computed over the cited items, and a refusal citing only gaps is NOT KNOWLEDGE. Every verdict prints its basis mix.`)
    for (const note of notes) out.push(plain(note))
    for (const r of refusals) {
        out.push(`- ${r.where}: stage ${r.basis.stage}; obstructs the configuration pathway: ${plain(r.obstructs)}`)
        for (const line of basisLines(r.basis)) out.push(`   ${line}`)
        for (const note of r.notes ?? []) out.push(`   note (measured by the test, beside the reading): ${plain(note)}`)
    }
    return out
}

/** The key to the coach text and the quotation marks, printed in the frame (OURS). */
const READING_KEY = [
    'How to read the coach text (OURS): \'wording APPROVED\' means the sentence is, word for word, one of Christian\'s approved coach sentences; it says nothing about the standing of what it states (its class). \'wording DRAFT\' means words that are not approved (the renderer\'s DRAFT wording, or the review-only wording of decision 1).',
    'The renderer\'s own status words: DERIVED, required by the selected knowledge and worded as a requirement of the game; STARTING, where this activity starts (a value chosen inside authored bounds, an alternative taken, or a preferred default), said as a fact about this activity and adjustable; COACH_CHOICE, left to the coach and put to the coach as a choice.',
    'Quotation marks: double, Christian\'s words, verbatim, with their received date; single, ours (labels, values, record text such as an item\'s evidence, and engine sentences, whose own double quotation marks are printed as single ones).',
    'Diagram words (the labels of the diagram\'s dimensions, targets and teams) are compared and printed with their status, CHRISTIANS_TERM (the diagram\'s value for one of Christian\'s terms, printed under this token) or DRAFT, and the sentence of the coach text that carries them, where one does.',
]

/** The whole report: the frame (classes, grading map, decision-kind rule), the tests and the refusals, every case, and the input counts given by the test. */
export function handoffReportText(results: HandoffResult[], inputs: HandoffInputs, counts: string[], tests: HandoffTestRecord[] = [], refusals: RefusalEntry[] = [], refusalNotes: string[] = [], goalStops: GoalStopRun[] = []): string {
    const out: string[] = []
    out.push('HANDOFF REPORT: the isolated reusable configuration handoff (TEST-ONLY review evidence)')
    out.push('')
    out.push('What this is: the review pathway\'s Steps 1 and 2 handed to the checked configuration and rendering chain, case by case, with every line and sentence graded by what determined it. Engineering evidence only: passing these tests is not evidence of ecological suitability or of representative learning quality in the field. Nothing here is served to a coach, written to production knowledge, or an authorization.')
    out.push(`Every configuration below: ${OPPORTUNITIES_NOT_ESTABLISHED}.`)
    // Where a reply pasted without its mail header is cited, the quotation key says it is dated by its paste date (otherwise unchanged).
    const pastedKey = inputs.rulings.some((r) => r.dateBasis) ? ' (or, for a reply pasted without its mail header, its paste date)' : ''
    for (const line of READING_KEY) out.push(line.indexOf('Quotation marks:') === 0 ? line.split('with their received date').join(`with their received date${pastedKey}`) : line)
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
    if (goalStops.length) {
        out.push(...goalStopsText(goalStops))
        out.push('')
    }
    if (refusals.length) {
        out.push(...refusalsText(refusals, refusalNotes))
        out.push('')
    }
    // A reply pasted without its mail header is cited by its paste date, and the header says so only where such a reply is cited.
    const pasted = inputs.rulings.some((r) => r.dateBasis)
    out.push(`Christian's words cited (${inputs.rulings.length} entries, verbatim, each with its received date${pasted ? ', or its paste date where no mail header was kept,' : ''} and the file it is filed in):`)
    for (const ruling of inputs.rulings) {
        out.push(`   ${ruling.id}, ${citedDateOf(ruling)}${ruling.provisional ? ', provisional' : ''}; scope ${ruling.scope ?? 'none stated'}; filed in ${plain(ruling.file)}`)
        for (const w of ruling.words) out.push(`       ${quoted(w)} (${citedDateOf(ruling, true)})`)
    }
    out.push('')
    for (const r of results) out.push(...caseText(r, inputs))
    return `${out.join('\n')}\n`
}
