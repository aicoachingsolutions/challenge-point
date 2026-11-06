/**
 * **The assembly experiment's reviews and its report** — review pathway only, offline (Christian's second reply of 5 November 2026,
 * Deliverables B to F). Split from `assembly.ts` only for readability. It:
 *   - runs the whole pipeline in one call (Step 1 and Step 2 by the Stage 1/2 code, unchanged; the assembly; the coach text; the
 *     requirement account), with the display texts supplied by a callback, after the decisions;
 *   - reviews representative suitability: the structural conditions of every compatible Game Form, in id order and alike, with the
 *     assembled team sizes labelled with their own standing; his six properties as data entries of ours, joined to the assembled values
 *     (an entry whose values are missing reads NOT_SUPPLIED); scale, exposure, the identity point and the add-nothing finding; no verdict
 *     and no ranking;
 *   - reviews his three scenarios: the Game Problems are resolved again for each (unchanged by construction: the resolution takes no
 *     circumstance input); the recorded requirement is engaged only where its circumstance is supplied true; uncertainty is reported where
 *     a deciding circumstance is not supplied or information is insufficient; the width comparison runs with the configured area as the
 *     limit and its own circumstances not supplied, so it can propose nothing;
 *   - writes the report and the results, with no time stamp (two runs are byte-identical).
 * Nothing here decides a value the record or the Stage 1/2 code did not decide. No goal, Game Problem, context, Game Form or row id, no
 * configuration path and no sport word appears in this file.
 */
import { committedKnowledge, DesignKnowledge, SOURCE } from './knowledge'
import { GameFormSelection, selectGameForm } from './forms'
import { DesignResolution, resolveDesignContext } from './resolve'
import { evaluateStructuralConditions, StructuralEvaluation } from './structural'
import { InfluenceTrace, TraceItem } from './trace'
import { compareWidth } from './width-comparison'
import {
    AccountLine,
    assembleActivity,
    AssembledActivity,
    AssembledChoice,
    classLabel,
    committedExperimentData,
    committedWordingData,
    ComposedActivity,
    composeCoachActivity,
    designBlock,
    DisplayTexts,
    Experiment,
    HOW_REACHED,
    HOW_REACHED_LABEL,
    longDate,
    requirementAccountOf,
    SIX_CLASSES,
    SixClass,
    standingLabel,
    validateExperiment,
    validateWording,
    Wording,
} from './assembly'

export const ASSEMBLY_STAGE = 'DESIGN_REASONING_ASSEMBLY_EXPERIMENT'
const base = (file: string) => file.split('/').pop() as string

// ---------------------------------------------------------------------------------------------------------------------------------------
// Suitability (Deliverable D) and scenarios (Deliverable E)
// ---------------------------------------------------------------------------------------------------------------------------------------

export interface SuitabilityReview {
    standing: string
    structural: StructuralEvaluation[]
    configurationRowsBelongTo: string
    otherForms: Array<{ gameFormId: string; configurationRows: 'MISSING'; reason: string }>
    properties: Array<{ property: string; structural: { status: string; paths: string[]; missingPaths: string[]; rows: string[]; missingRows: string[] }; functional: { status: string }; note: string }>
    scale: Experiment['suitability']['scale']
    exposure: Experiment['suitability']['exposure']
    identityPoint: Experiment['suitability']['identityPoint'] & { missingRows: string[] }
    addNothing: Experiment['suitability']['addNothing']
}

/** Whether a row id exists in the knowledge the stage reads (validation, identity, property or archetype rows; ids only). */
function rowExists(k: DesignKnowledge, id: string): boolean {
    const c = k.contexts as unknown as Record<string, Array<Record<string, unknown>>>
    return (
        (c.validation_rules ?? []).some((r) => r.validation_id === id) ||
        (c.identity_rules ?? []).some((r) => r.identity_rule_id === id) ||
        (c.properties ?? []).some((r) => r.property_id === id) ||
        k.archetypes.knowledge.some((r) => r.Target_ID === id)
    )
}

export function suitabilityReview(k: DesignKnowledge, resolution: DesignResolution, forms: GameFormSelection, experiment: Experiment, activity: AssembledActivity): SuitabilityReview {
    const at = (p: string) => activity.choices.find((c) => c.path === p) as AssembledChoice
    const teamCount = Number(at(experiment.bindings.teamCount).value)
    const perTeam = Number(at(experiment.bindings.playersPerTeam).value)
    const sizes = Array.from({ length: teamCount }, () => perTeam)
    const perTeamStanding = at(experiment.bindings.playersPerTeam).declaredStatus
    const structural = forms.candidates
        .filter((c) => c.compatible)
        .map((c) => evaluateStructuralConditions(k, resolution, c, { playersPerTeam: [...sizes], source: `${base(SOURCE.assemblyExperiment)} ${experiment.bindings.playersPerTeam}`, standing: perTeamStanding, assembled: true }))
    const illustrative = String(at(experiment.bindings.illustrativeForm).value)
    const present = (p: string) => {
        const c = activity.choices.find((x) => x.path === p)
        return Boolean(c) && c?.value !== null && !(Array.isArray(c?.value) && !(c?.value as string[]).length)
    }
    const s = experiment.suitability
    return {
        standing: s.standing,
        structural,
        configurationRowsBelongTo: illustrative,
        otherForms: forms.compatible.filter((id) => id !== illustrative).map((id) => ({ gameFormId: id, configurationRows: 'MISSING' as const, reason: 'no contract and not assembled: the configuration rows belong to the illustrative assembly only' })),
        properties: s.properties.map((p) => {
            const missingPaths = p.structural.paths.filter((x) => !present(x))
            const missingRows = p.structural.rows.filter((x) => !rowExists(k, x))
            return {
                property: p.property,
                structural: { status: missingPaths.length ? 'NOT_SUPPLIED' : p.structural.status, paths: [...p.structural.paths], missingPaths, rows: [...p.structural.rows], missingRows },
                functional: { status: p.functional.status },
                note: p.note,
            }
        }),
        scale: s.scale,
        exposure: s.exposure,
        identityPoint: { ...s.identityPoint, missingRows: s.identityPoint.rows.filter((x) => !rowExists(k, x)) },
        addNothing: s.addNothing,
    }
}

export interface ScenarioResult {
    id: string
    words: string
    circumstances: Array<{ key: string; label: string; value: boolean | 'NOT_SUPPLIED'; valueLabel: string }>
    gameProblems: { primary: string[]; secondary: string[]; unchanged: boolean; why: string }
    mismatch: { reported: boolean; line: string | null; requirementAttached: boolean }
    uncertainty: { reported: boolean; line: string | null; because: string[] }
    width: { outcome: string; basis: string; proposalStatus: string; proposalStatement: string; statement: string }
    expected: { mismatchReported: boolean; uncertaintyReported: boolean }
}

export function scenarioReview(k: DesignKnowledge, base0: DesignResolution, forms: GameFormSelection, experiment: Experiment): ScenarioResult[] {
    const sc = experiment.scenarios
    const link = sc.requirementLink
    return sc.items.map((s) => {
        // The resolution takes no circumstance input, so it is the same for every scenario; it is recomputed here to show that.
        const r = resolveDesignContext(k, experiment.learningGoalId)
        const unchanged = JSON.stringify(r.gameProblems) === JSON.stringify(base0.gameProblems)
        const value = (key: string) => s.configuredActivity[key].value
        const requirementAttached = r.requirements.some((q) => q.id === link.requirementId)
        const engaged = requirementAttached && value(link.circumstanceKey) === link.engagesWhen
        const because = [
            ...sc.decidingCircumstances.filter((key) => value(key) === 'NOT_SUPPLIED').map((key) => `${key}: NOT_SUPPLIED`),
            ...sc.insufficientWhen.filter((w) => value(w.key) === w.value).map((w) => `${w.key}: ${String(w.value)}`),
        ]
        const w = compareWidth(
            k,
            r,
            forms,
            {
                id: `${s.id}-width`,
                label: `the configured area as the limit (${s.id})`,
                configuredArea: { ...sc.widthCheck.configuredArea, standing: sc.widthCheck.standing },
                availableSpace: { ...sc.widthCheck.availableSpace, standing: sc.widthCheck.standing },
                playersPerTeam: { value: [...sc.widthCheck.playersPerTeam], standing: sc.widthCheck.standing },
                decidingCircumstances: {},
            },
            base(SOURCE.assemblyExperiment)
        )
        return {
            id: s.id,
            words: s.words,
            circumstances: sc.circumstances.map((c) => ({ key: c.key, label: c.label, value: s.configuredActivity[c.key].value, valueLabel: s.configuredActivity[c.key].label })),
            gameProblems: { primary: [...r.gameProblems.primary], secondary: [...r.gameProblems.secondary], unchanged, why: 'the resolution takes no circumstance input' },
            mismatch: { reported: engaged, line: engaged ? link.report : null, requirementAttached },
            uncertainty: { reported: because.length > 0, line: because.length ? sc.uncertaintyReport : null, because },
            width: { outcome: w.outcome, basis: w.basis, proposalStatus: w.proposal.status, proposalStatement: w.proposal.statement, statement: w.statement },
            expected: { ...s.expected },
        }
    })
}

// ---------------------------------------------------------------------------------------------------------------------------------------
// The pipeline
// ---------------------------------------------------------------------------------------------------------------------------------------

export interface AssemblyRun {
    experiment: Experiment
    wording: Wording
    resolution: DesignResolution
    forms: GameFormSelection
    display: DisplayTexts
    activity: AssembledActivity
    composed: ComposedActivity
    design: Array<{ text: string; expresses: string[]; marker: string }>
    account: { lines: AccountLine[]; counts: Record<string, number> }
    suitability: SuitabilityReview
    scenarios: ScenarioResult[]
}

/** The whole experiment, in one call. The display texts come from the callback, after Steps 1 and 2 (no decision reads them). */
export function runAssembly(
    displayFor: (k: DesignKnowledge, experiment: Experiment, resolution: DesignResolution, forms: GameFormSelection) => DisplayTexts,
    knowledge: DesignKnowledge = committedKnowledge(),
    experimentRaw: unknown = committedExperimentData(),
    wordingRaw: unknown = committedWordingData()
): AssemblyRun {
    const experiment = validateExperiment(experimentRaw)
    const wording = validateWording(wordingRaw, experiment)
    const resolution = resolveDesignContext(knowledge, experiment.learningGoalId)
    const forms = selectGameForm(knowledge, resolution)
    const display = displayFor(knowledge, experiment, resolution, forms)
    const activity = assembleActivity(knowledge, resolution, forms, experiment, display)
    const composed = composeCoachActivity(wording, activity)
    const design = designBlock(experiment, activity, display)
    const account = requirementAccountOf(knowledge, experiment, activity)
    const suitability = suitabilityReview(knowledge, resolution, forms, experiment, activity)
    const scenarios = scenarioReview(knowledge, resolution, forms, experiment)
    return { experiment, wording, resolution, forms, display, activity, composed, design, account, suitability, scenarios }
}

// ---------------------------------------------------------------------------------------------------------------------------------------
// The report
// ---------------------------------------------------------------------------------------------------------------------------------------

function traceLines(t: InfluenceTrace, indent: string): string[] {
    const out: string[] = []
    for (const [label, items] of [['decided by', t.influencedBy], ['consulted', t.consulted], ['cited only', t.citedOnly]] as const) for (const i of items) out.push(`${indent}${label}: ${i.ref} [${standingLabel(i.standing)}] ${i.role}`)
    return out
}
const itemLine = (label: string, i: TraceItem, indent: string) => `${indent}${label}: ${i.ref} [${standingLabel(i.standing)}] ${i.role}`

/** One line of the generated rationale: the value, what decided it and its class; what was only consulted (refs only, no prose). */
export function rationaleLine(run: AssemblyRun, c: AssembledChoice): string {
    const byId = new Map(run.experiment.rulings.map((r) => [r.id, r]))
    const choice = run.experiment.choices.find((x) => x.path === c.path)
    const decided: string[] = []
    if (c.computed) decided.push(`the Stage 1/2 computation (${c.decidedBy.length - (choice?.decidedBy.length ?? 0)} trace items)`)
    for (const d of choice?.decidedBy ?? []) {
        if (d.rulingRef) {
            const r = byId.get(d.rulingRef)
            decided.push(`${d.rulingRef}, ${r?.provisional ? 'his provisional ruling' : 'his ruling'}, received ${longDate(r?.received ?? '')}: "${d.valueEvidence}"`)
        } else if (d.knowledgeRef) decided.push(`${d.knowledgeRef.source} ${d.knowledgeRef.table} ${d.knowledgeRef.row} [${d.standing}]${d.valueEvidence ? `: "${d.valueEvidence}"` : ''}`)
        else decided.push('no authorized value (UNRESOLVED)')
    }
    const consulted = (choice?.consulted ?? []).map((x) => x.rulingRef ?? (x.knowledgeRef ? `${x.knowledgeRef.table} ${x.knowledgeRef.row}` : x.ref))
    return `${c.path}: "${c.rendered}" [${classLabel(c.sixClass)}]. Decided by: ${decided.join('; ')}.${consulted.length ? ` Consulted only: ${consulted.join('; ')}.` : ''}`
}

function frontAndParts(run: AssemblyRun): string[] {
    const { experiment: x, activity: a } = run
    const byId = new Map(x.rulings.map((r) => [r.id, r]))
    const quote = (id: string, i = 0) => {
        const r = byId.get(id)
        return r ? `"${r.words[i]}" (received ${longDate(r.received)})` : ''
    }
    const L: string[] = []
    const n = a.choices.length
    const exempt = x.exemptions.length
    const readByCode = a.counts.howReached.READ_BY_CODE
    L.push('', '=== FRONT. What was shown, what was not, and the honest answer ===')
    L.push(`His question: ${quote(x.reportRefs.experimentPurpose)}; and earlier: ${quote(x.reportRefs.acceptance)}`)
    L.push(`- COMPUTED by the existing architecture from knowledge (${a.computed.length} conclusions, each with its own influence trace): the Game Problems and context (Step 1); the compatible Game Forms (Step 2); the scoring event's membership in the routed context; and, in Part 3, the structural conditions of each compatible form. ${readByCode} of the ${n} values in the record were read from knowledge by code (the record holds ${n} values: ${n - exempt} material to the coach activity, ${exempt} kept out of it with pinned reasons).`)
    L.push('- NOT COMPUTED: the architecture has no configuration step today (Steps 3-5 are held). The configuration is a labelled decision record we entered: each value is evidenced in his words, illustrative, our inference, or unresolved, and says so.')
    L.push('- The coach text is a DRAFT template fill keyed to configuration paths: not the production renderer, and not approved wording.')
    L.push(`- How the ${n} values reached the activity: ${HOW_REACHED.map((h) => `${HOW_REACHED_LABEL[h]} ${a.counts.howReached[h]}`).join('; ')}.`)
    L.push(`- His six classes over the ${n} values: ${Object.entries(a.counts.classes).map(([c, k]) => `${c} ${k}`).join('; ')}.`)
    L.push(`- So the answer, in counts: the architecture computed the problem, the context and the forms; it could not configure the activity. ${n - readByCode} values were entered by us, ${a.counts.howReached.ENTERED_EVIDENCED} of them with his words stating the value, ${a.counts.howReached.ENTERED_ILLUSTRATIVE} illustrative, ${a.counts.howReached.ENTERED_OUR_INFERENCE} our inference, ${a.counts.howReached.UNRESOLVED} unresolved. The activity is complete enough to run as a review example; it is not a generated activity, and nothing here is evidence of ecological effectiveness.`)
    const blocks = (b: string) => x.openDecisions.filter((d) => d.blocks === b)
    L.push(`- Blocks assembly: ${blocks('ASSEMBLY').length ? blocks('ASSEMBLY').map((d) => d.question).join(' / ') : 'none'}.`)
    L.push(`- Blocks a scoring-fidelity or production claim: ${blocks('SCORING_FIDELITY_OR_PRODUCTION').map((d) => d.question).join(' / ')}`)
    L.push(`- Blocks a suitability claim: ${blocks('SUITABILITY').map((d) => d.question).join(' / ')}`)
    L.push('- Non-blocking calls for him:')
    for (const d of blocks('NON_BLOCKING')) L.push(`    ${d.id}: ${d.question} (${d.handling})`)

    L.push('', `=== PART 0. Reconciliation with the 5 November ${run.display.goalName.text} assessment, and reuse ===`)
    L.push(`His request: ${quote(x.reconciliation.rulingRef)}`)
    for (const i of x.reconciliation.assessmentItems) L.push(`  ${i.item} -> ${i.carriedBy}`)
    L.push('  Reuse:')
    for (const r of x.reconciliation.reuse) L.push(`    ${r.work}: ${r.status}. ${r.why}`)
    L.push(`  Still open: ${x.reconciliation.stillOpen.join('; ')}.`)
    return L
}

function activityPart(run: AssemblyRun): string[] {
    const { experiment: x, activity: a, composed, wording } = run
    const byId = new Map(x.rulings.map((r) => [r.id, r]))
    const L: string[] = ['', '=== PART 1. The activity as assembled (review copy) ===']
    const limits = byId.get(x.reportRefs.limits)
    if (limits) for (const w of limits.words) L.push(`His limits: "${w}" (received ${longDate(limits.received)})`)
    const kickoff = byId.get(x.reportRefs.kickoffCaveat)
    if (kickoff) L.push(`His kickoff caveat: "${kickoff.words[0]}" (received ${longDate(kickoff.received)})`)
    L.push(`Wording: ${wording.standing}`)
    L.push('Markers: each sentence carries, in brackets, the weakest of his classes among the values it expresses (class 1 unmarked). In a coach-facing copy the markers would be hidden from coaches (RC3 6.1); they are shown here for review.')
    L.push('', `LEARNING DESIGN (shown beside the RC3 activity; generated from the assembly, not from the wording file)`)
    for (const d of run.design) L.push(`  ${d.text}${d.marker ? ` ${d.marker}` : ''}`)
    let level = ''
    for (const s of composed.sections) {
        if (s.level !== level) {
            level = s.level
            L.push('', level.toUpperCase())
        }
        L.push(`  ${s.title} (RC3 ${s.rc3})`)
        for (const t of s.sentences) L.push(`    ${t.text}${t.marker ? ` ${t.marker}` : ''}`)
    }
    L.push('', 'DESIGN RATIONALE (generated from the decision trace: each line names the value, what decided it and its class, and what was only consulted; it is not evidence of ecological effectiveness)')
    for (const c of a.choices) L.push(`  ${rationaleLine(run, c)}`)
    return L
}

function tracePart(run: AssemblyRun): string[] {
    const { experiment: x, activity: a, account } = run
    const L: string[] = ['', '=== PART 2. Decision trace ===']
    L.push('His six classes, in his order: ' + SIX_CLASSES.map((c, i) => `${i + 1} ${c}`).join(' / '))
    L.push('A decision\'s class is the weakest, in his order, over everything that decided it and its declared status. His provisional rulings are placed in class 3 ("Candidate or provisional knowledge."), each printed with his words and received date; the code\'s own PROVISIONAL (his words given as an example) is printed HIS EXAMPLE WORDS and never decides anything.')
    L.push('', 'His rulings, each filed once (scope only where his words state one, quoted beside it):')
    for (const r of x.rulings) {
        const covers = r.scopeCovers ? `; ${r.scopeCovers.slice(-1) === '.' ? r.scopeCovers.slice(0, -1) : r.scopeCovers}` : ''
        L.push(`  ${r.id}: ${r.decision} (${r.subject}). Received ${longDate(r.received)}${r.provisional ? '; provisional in his words' : ''}. File: ${r.file}. Scope: ${r.scope ?? 'none stated'}${r.scopeWords ? ` ("${r.scopeWords.join('"; "')}")` : ''}${covers}.`)
        for (const w of r.words) L.push(`    "${w}"`)
    }
    L.push('', 'Every material value (path; value; how it reached the activity; class; what decided it; what was only consulted; what set its status):')
    for (const c of a.choices) {
        const choice = x.choices.find((y) => y.path === c.path)
        L.push(`  ${c.path} = ${JSON.stringify(c.value)} ("${c.rendered}")`)
        L.push(`    how reached: ${HOW_REACHED_LABEL[c.howReached]}; declared ${standingLabel(c.declaredStatus)}; ${classLabel(c.sixClass)}`)
        for (const p of c.provisionalRulings) L.push(`    his provisional ruling, received ${longDate(p.received)}: "${p.words}"`)
        L.push(`    trace: ${c.traceLabel}`)
        for (const i of c.decidedBy) L.push(itemLine('decided by', i, '      '))
        for (const i of c.consulted) L.push(itemLine('consulted', i, '      '))
        for (const i of c.statusSetBy) L.push(itemLine('status set by', i, '      '))
        L.push(`    note: ${c.note}`)
        if (choice?.readBy === 'RESOLUTION_PRIMARY' || choice?.readBy === 'RESOLUTION_SECONDARY') {
            L.push(`    filed scope of the computed designation: ${run.resolution.gameProblems.scope ?? 'none'}${run.resolution.gameProblems.continuedBy ? `, continued by ${run.resolution.gameProblems.continuedBy.ruling}` : ''}; extendsScopeTo (his 5 November words, printed beside, never decisive): ${x.gameProblemScope.rulingRefs.join(', ')}. ${x.gameProblemScope.idResolution} ${x.gameProblemScope.note}`)
        }
    }
    L.push('', 'Values derived in code (never typed):')
    for (const d of a.derived) L.push(`  ${d.id} = ${d.value} (${d.label}); from ${d.fromPaths.join(', ')}; ${classLabel(d.sixClass)}. ${d.note}`)
    L.push('', 'Computed conclusions (the Stage 1/2 code, its traces unchanged):')
    for (const c of a.computed) {
        L.push(`  ${c.id} [${c.establishedBy}]: ${c.statement}`)
        L.push(...traceLines(c.trace, '    '))
    }
    L.push('', 'Status of this example (every value not in class 1, with its class and how it reached the activity):')
    for (const c of a.choices.filter((y) => y.sixClass !== 1)) L.push(`  ${c.path}: ${classLabel(c.sixClass)}; ${HOW_REACHED_LABEL[c.howReached]}`)
    L.push('', 'Not expressed in the coach activity, with the reason (pinned):')
    for (const e of x.exemptions) L.push(`  ${e.path}: ${e.reason}`)
    L.push('', `Requirement account (his ruling of 29 October; each category placement is OURS; category 3 never counts as satisfied), under his three standards:`)
    for (const standard of x.accountStandards) {
        L.push(`  ${standard}:`)
        for (const l of account.lines.filter((y) => y.standard === standard)) {
            L.push(`    ${l.id} ${l.requirementRef.table} ${l.requirementRef.row} (${l.requirementRole}, ${l.requirementStatus})${l.clause ? ` clause "${l.clause}" under the ${l.reading === 'FOR_EXAMPLE' ? '"for example"' : 'colon'} reading` : ''}: "${l.category}"${l.satisfied ? ' (counts as satisfied)' : ' (not counted as satisfied)'}`)
            L.push(`      values: ${l.paths.join(', ')}${l.observableConditions ? `; observable conditions: ${l.observableConditions}` : ''}${l.downgraded ? `; DOWNGRADED: ${l.downgraded}` : ''}`)
            L.push(`      note: ${l.note}`)
        }
    }
    L.push(`  Counts: ${Object.entries(account.counts).map(([c, k]) => `"${c}" ${k}`).join('; ')}.`)
    L.push('', 'Laws account (one entry per law the Sport Profile lists, and the adaptation owed):')
    for (const l of x.laws) L.push(`  ${l.lawId ?? l.situation}: ${l.status}. ${l.reason} (values: ${l.paths.join(', ')})`)
    L.push('', `${x.gameForm.illustrativeChoice} contract items (each mapped to a value, or not used with its reason):`)
    for (const c of x.contractItems) L.push(`  ${c.itemId}: ${c.mappedTo.length ? c.mappedTo.join(', ') : `not used: ${c.notUsed}`}`)
    L.push('  Not authored by the Game Form, reported:')
    for (const d of x.contractDeclarationsReported) L.push(`    ${d.row} ${d.declaration}: ${d.what}; here: ${d.how}`)
    return L
}

function reviewParts(run: AssemblyRun): string[] {
    const { experiment: x, suitability: s, scenarios, forms } = run
    const byId = new Map(x.rulings.map((r) => [r.id, r]))
    const L: string[] = ['', '=== PART 3. Game Form alternatives and representative suitability ===']
    L.push(`Game Forms: ${forms.status}: ${forms.compatible.map((id) => `${id} ${run.display.names[id]?.text ?? ''}`).join('; ')}. Preference: ${forms.preference.status}. ${forms.preference.statement}`)
    for (const c of forms.candidates) L.push(`  ${c.gameFormId} ${c.compatible ? 'compatible' : 'EXCLUDED'}: ${c.compatibilityInformation.contextRelationshipType} ${c.compatibilityInformation.contextRelationshipStrength} [${c.compatibilityInformation.label}]`)
    L.push(`  ${x.gameForm.illustrativeChoice} is the illustrative choice; it is not presented as better than the others because it is the one assembled.`)
    L.push('', `Suitability (${s.standing})`)
    L.push(`  Configuration rows belong to the illustrative assembly (${s.configurationRowsBelongTo}) only:`)
    for (const p of s.properties) {
        L.push(`    ${p.property}: structural presence ${p.structural.status} (values: ${p.structural.paths.join(', ')}; rows: ${p.structural.rows.join(', ')}${p.structural.missingPaths.length ? `; missing values: ${p.structural.missingPaths.join(', ')}` : ''}${p.structural.missingRows.length ? `; ROWS NOT FOUND: ${p.structural.missingRows.join(', ')}` : ''}); functional meaningfulness ${p.functional.status}. ${p.note}`)
    }
    for (const o of s.otherForms) L.push(`  ${o.gameFormId}: configuration rows ${o.configurationRows} (${o.reason}).`)
    L.push(`  Scale: ${s.scale.status}. ${s.scale.statement} (${s.scale.openDecision} open)`)
    for (const e of s.exposure) L.push(`  ${e.aspect}: ${e.status}`)
    L.push(`  Identity: ${s.identityPoint.statement} (rows: ${s.identityPoint.rows.join(', ')}${s.identityPoint.missingRows.length ? `; ROWS NOT FOUND: ${s.identityPoint.missingRows.join(', ')}` : ''})`)
    const addNothing = byId.get(s.addNothing.rulingRef)
    L.push(`  Adding nothing: ${s.addNothing.status}. ${s.addNothing.statement}${addNothing ? ` His words: "${addNothing.words[2]}" (received ${longDate(addNothing.received)})` : ''}`)
    L.push('  No verdict and no ranking. Structural conditions of every compatible form, alike, in id order (team sizes from the illustrative assembly, with their own standing):')
    for (const e of s.structural) {
        L.push(`    ${e.gameFormId} (archetype ${e.archetypeId}; assembled ${e.activity ? e.activity.playersPerTeam.join(' v ') : 'none'}, ${e.activity?.standing ?? 'TEST INPUT'})`)
        for (const p of e.preconditions) L.push(`      precondition '${p.statement}' (${p.requirement}): ${p.status}; evidence status ${p.evidenceStatus}. ${p.detail}`)
        L.push(`      continuous play (${e.continuousPlay.entryId}): ${e.continuousPlay.status}. ${e.continuousPlay.detail}`)
        for (const c of e.integrity.conditions) L.push(`      ${c.conditionId} [${c.class}]: ${c.status}${c.evidenceStatus ? `; evidence status ${c.evidenceStatus}` : ''}. ${c.detail}`)
    }

    L.push('', '=== PART 4. Three hypothetical scenarios ===')
    L.push(x.scenarios.standing)
    for (const r of scenarios) {
        L.push(`  ${r.id}: "${r.words}" (received ${longDate(byId.get(x.scenarios.rulingRef)?.received ?? '')})`)
        for (const c of r.circumstances) L.push(`    ${c.key} = ${String(c.value)} (${c.valueLabel})`)
        L.push(`    Game Problems: primary ${r.gameProblems.primary.join(', ')}; secondary ${r.gameProblems.secondary.join(', ')}; unchanged: ${r.gameProblems.unchanged ? 'yes' : 'NO'} (${r.gameProblems.why})`)
        L.push(`    recorded requirement ${x.scenarios.requirementLink.requirementId} (${r.mismatch.requirementAttached ? 'attached to the resolution' : 'not attached'}): ${r.mismatch.reported ? r.mismatch.line : 'not engaged'}`)
        L.push(`    uncertainty: ${r.uncertainty.reported ? `${r.uncertainty.line} (${r.uncertainty.because.join('; ')})` : 'none reported'}`)
        L.push(`    width check (configured area = available space; its own circumstances not supplied): ${r.width.outcome} [${r.width.basis}]; proposal ${r.width.proposalStatus}. ${r.width.proposalStatement}`)
    }
    const link = x.scenarios.requirementLink
    L.push(`  The recorded requirement rests on: ${link.rulingRefs.map((id) => { const rr = byId.get(id); return rr ? `${id} "${rr.words.join(' ')}" (received ${longDate(rr.received)})` : id }).join('; ')}`)

    L.push('', '=== PART 5. Regression and output checks ===')
    L.push('  The unit tests (assembly.unit.ts, in npm test) check, in plain words: every value reaches the coach text or the learning-design block, or is pinned as exempt with a reason; each sentence says only what its values hold, numbers included; a changed value changes or refuses the text; the scoring sentences name the target zone and never a line; the observation block keeps the starting condition out except one pointer; the rationale makes no effect claim; his words are verbatim in the record; the classes follow his order; the Laws and contract items are all accounted for; Stage 2\'s evidence is byte-identical; two runs are byte-identical.')
    L.push('  The regression results (type check, the full unit suite, the behaviour snapshot, the bundle) are recorded in the evidence README. Passing engineering tests is not evidence of representative learning effectiveness.')

    L.push('', '=== PART 6. His section 8 reconciliations, and the architectural dependencies ===')
    for (const r of x.reconciliations) {
        L.push(`  ${r.id} ${r.title}`)
        for (const rid of r.rulingRefs) {
            const rr = byId.get(rid)
            if (rr) for (const w of rr.words) L.push(`    his words: "${w}" (received ${longDate(rr.received)})`)
        }
        for (const i of r.items) L.push(`    - ${i}`)
        // Side by side, as he asked: each text printed whole, with its class and provenance.
        for (const p of r.showPaths ?? []) {
            const c = run.activity.choices.find((y) => y.path === p) as AssembledChoice
            L.push(`    ${c.path} [${classLabel(c.sixClass)}; ${HOW_REACHED_LABEL[c.howReached]}]: ${c.value === null ? 'no authorized value' : `"${c.rendered}"`}`)
            L.push(`      note: ${c.note}`)
        }
    }
    L.push('  Architectural dependencies (named, none changed):')
    for (const d of x.dependencies) L.push(`    ${d.id} ${d.what}. Options: ${d.options}`)

    L.push('', '=== PART 7. What we recorded, and what a second Learning Goal would need ===')
    L.push(`  Recorded: ${x.rulings.length} rulings of his (verbatim), ${x.choices.length} values, ${x.laws.length} Laws entries, ${x.contractItems.length} contract items, ${x.requirementAccount.length} requirement-account lines, ${x.suitability.properties.length} suitability entries, ${x.scenarios.items.length} scenarios, ${x.openDecisions.length} open decisions.`)
    const question = byId.get(x.reportRefs.futureFeedbackQuestion)
    if (question) L.push(`  His question for future coach feedback, preserved and kept out of the coach activity: "${question.words[1]}" (received ${longDate(question.received)})`)
    L.push('  A second Learning Goal would need authored (the per-goal cost, the honest measure of reuse):')
    for (const s2 of x.secondGoalNeeds) L.push(`    - ${s2}`)
    return L
}

/** The report text and the results value; no time stamp, so two runs on the same inputs are byte-identical. */
export function buildAssemblyReport(run: AssemblyRun): { report: string; results: unknown } {
    const lines: string[] = []
    lines.push(`Bounded ${run.experiment.learningGoalId} activity-assembly experiment (${run.display.goalName.text}): review pathway only, offline`)
    lines.push(`Standing: ${run.experiment.standing}`)
    lines.push(...frontAndParts(run), ...activityPart(run), ...tracePart(run), ...reviewParts(run))
    const results = {
        stage: ASSEMBLY_STAGE,
        standing: run.experiment.standing,
        wordingStanding: run.wording.standing,
        learningGoalId: run.experiment.learningGoalId,
        resolution: { status: run.resolution.status, gameProblems: run.resolution.gameProblems, context: run.resolution.context, requirements: run.resolution.requirements },
        gameForms: { status: run.forms.status, compatible: run.forms.compatible, preference: run.forms.preference, trace: run.forms.trace },
        activity: run.activity,
        coachActivity: run.composed,
        designBlock: run.design,
        requirementAccount: run.account,
        laws: run.experiment.laws,
        contractItems: run.experiment.contractItems,
        suitability: run.suitability,
        scenarios: run.scenarios,
        reconciliations: run.experiment.reconciliations,
        openDecisions: run.experiment.openDecisions,
        dependencies: run.experiment.dependencies,
        sixClasses: SIX_CLASSES.map((c, i) => ({ class: (i + 1) as SixClass, words: c })),
    }
    return { report: `${lines.join('\n')}\n`, results }
}
