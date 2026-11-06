/**
 * **The assembly experiment's reviews and its report** — review pathway only, offline (Christian's second reply of 5 November 2026,
 * Deliverables B to F). Split from `assembly.ts` only for readability. It:
 *   - runs the whole pipeline in one call (Step 1 and Step 2 by the Stage 1/2 code, unchanged; the assembly; the coach text; the
 *     requirement account), with the display texts supplied by a callback, after the decisions; it fails closed if the names of the Game
 *     Problems the resolution returns are not in his scope words;
 *   - reviews representative suitability: the structural conditions of every compatible Game Form, in id order and alike, the
 *     illustrative form with the assembled team sizes and every other with the same sizes applied hypothetically (not assembled), labelled
 *     with their own standing; his six properties as data entries of ours, joined to the assembled values (an entry whose values are missing
 *     reads NOT_SUPPLIED); scale, exposure, the identity point, the scope tension, the add-nothing finding and the known risks; no verdict
 *     and no ranking;
 *   - reviews his three scenarios: the Game Problems are resolved again for each (unchanged by construction: the resolution takes no
 *     circumstance input); every circumstance not supplied is reported as unknown; the scope circumstance of his designation is read, and
 *     where it is not established the designation's scope is reported uncertain (the primary never switches); the recorded requirement is
 *     engaged only where its circumstance is supplied as the value that engages it; the width comparison reads the assembled area and team
 *     sizes, with the configured area as the limit and its own circumstances not supplied, so it can propose nothing;
 *   - runs the mutation loop (every recorded value changed in a copy of the record, the pipeline re-run, each outcome classified as
 *     substituted, refused by a sentence written for the recorded value, refused for a structural reason, or exempt and printed in the
 *     report only; it fails closed on any other outcome), whose counts the front and Part 5 print;
 *   - writes the report and the results, with no time stamp (two runs are byte-identical); Part 5 prints the committed regression record.
 * Nothing here decides a value the record or the Stage 1/2 code did not decide. No goal, Game Problem, context, Game Form or row id, no
 * configuration path and no sport term the coupling ratchet lists appears in this file.
 */
import { committedKnowledge, contextIdentityRules, contextProperty, contextValidationRules, DesignKnowledge, SOURCE } from './knowledge'
import { GameFormSelection, selectGameForm } from './forms'
import { DesignResolution, resolveDesignContext } from './resolve'
import { evaluateStructuralConditions, StructuralEvaluation } from './structural'
import { InfluenceTrace, TraceItem, weakestStanding } from './trace'
import { compareWidth } from './width-comparison'
import {
    AccountCounts,
    AccountLine,
    assembleActivity,
    AssembledActivity,
    AssembledChoice,
    AssemblyRuling,
    basisShort,
    basisWords,
    Choice,
    ChoiceValue,
    classLabel,
    committedExperimentData,
    committedWordingData,
    ComposedActivity,
    composeCoachActivity,
    decidingWords,
    designBlock,
    DisplayTexts,
    Experiment,
    HOW_REACHED,
    HOW_REACHED_LABEL,
    HowReached,
    longDate,
    requirementAccountOf,
    sentenceMarker,
    SIX_CLASSES,
    SixClass,
    sixClassOf,
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
    scopeTension: Experiment['suitability']['scopeTension']
    addNothing: Experiment['suitability']['addNothing']
    reviewPoints: Experiment['suitability']['reviewPoints']
}

/**
 * Whether a row id the suitability entries cite exists, read through the stage's readers (ids only): a validation rule, identity rule or
 * property of the routed context (a row of another context does not count), or an archetype knowledge row.
 */
function rowExists(k: DesignKnowledge, rpcId: string, id: string): boolean {
    return (
        contextValidationRules(k, rpcId).some((r) => r.validationId === id) ||
        contextIdentityRules(k, rpcId).some((r) => r.identityRuleId === id) ||
        contextProperty(k, id)?.rpcId === rpcId ||
        k.archetypes.knowledge.some((r) => r.Target_ID === id)
    )
}

export function suitabilityReview(k: DesignKnowledge, resolution: DesignResolution, forms: GameFormSelection, experiment: Experiment, activity: AssembledActivity): SuitabilityReview {
    const at = (p: string) => activity.choices.find((c) => c.path === p) as AssembledChoice
    const teamCount = Number(at(experiment.bindings.teamCount).value)
    const perTeam = Number(at(experiment.bindings.playersPerTeam).value)
    const sizes = Array.from({ length: teamCount }, () => perTeam)
    const perTeamStanding = at(experiment.bindings.playersPerTeam).declaredStatus
    const illustrative = String(at(experiment.bindings.illustrativeForm).value)
    const source = `${base(SOURCE.assemblyExperiment)} ${experiment.bindings.playersPerTeam}`
    // Only the illustrative form is assembled; every other compatible form is read with the same team sizes, applied hypothetically.
    const structural = forms.candidates
        .filter((c) => c.compatible)
        .map((c) =>
            evaluateStructuralConditions(
                k,
                resolution,
                c,
                c.gameFormId === illustrative
                    ? { playersPerTeam: [...sizes], source, standing: perTeamStanding, assembled: true }
                    : { playersPerTeam: [...sizes], source: `${source} (the ${illustrative} illustrative team sizes, applied hypothetically; this form is not assembled)`, standing: perTeamStanding, appliedHypothetically: true }
            )
        )
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
            const missingRows = p.structural.rows.filter((x) => !rowExists(k, activity.rpcId, x))
            return {
                property: p.property,
                structural: { status: missingPaths.length ? 'NOT_SUPPLIED' : p.structural.status, paths: [...p.structural.paths], missingPaths, rows: [...p.structural.rows], missingRows },
                functional: { status: p.functional.status },
                note: p.note,
            }
        }),
        scale: s.scale,
        exposure: s.exposure,
        identityPoint: { ...s.identityPoint, missingRows: s.identityPoint.rows.filter((x) => !rowExists(k, activity.rpcId, x)) },
        scopeTension: s.scopeTension,
        addNothing: s.addNothing,
        reviewPoints: s.reviewPoints,
    }
}

export interface ScenarioResult {
    id: string
    words: string
    circumstances: Array<{ key: string; label: string; value: boolean | 'NOT_SUPPLIED'; valueLabel: string }>
    known: string[]
    unknown: string[]
    gameProblems: { primary: string[]; secondary: string[]; unchanged: boolean; why: string }
    scope: { key: string; established: boolean; line: string | null }
    mismatch: { reported: boolean; line: string | null; requirementAttached: boolean }
    uncertainty: { reported: boolean; line: string | null; because: string[] }
    width: { outcome: string; basis: string; proposalStatus: string; proposalStatement: string; statement: string; configuredArea: { lengthM: number; widthM: number; standing: string }; playersPerTeam: number[] }
    expected: { mismatchReported: boolean; uncertaintyReported: boolean; scopeEstablished: boolean }
}

export function scenarioReview(k: DesignKnowledge, base0: DesignResolution, forms: GameFormSelection, experiment: Experiment, activity: AssembledActivity): ScenarioResult[] {
    const sc = experiment.scenarios
    const link = sc.requirementLink
    // The width comparison reads the assembled values (no typed copy): the configured area, its standing, and the team sizes.
    const at = (p: string) => activity.choices.find((c) => c.path === p) as AssembledChoice
    const num = (p: string) => Number(at(p).value)
    const b = experiment.bindings
    const configuredArea = { lengthM: num(b.areaLength), widthM: num(b.areaWidth), standing: at(b.areaWidth).declaredStatus }
    const sizes = Array.from({ length: num(b.teamCount) }, () => num(b.playersPerTeam))
    return sc.items.map((s) => {
        // The resolution takes no circumstance input, so it is the same for every scenario; it is recomputed here to show that.
        const r = resolveDesignContext(k, experiment.learningGoalId)
        const unchanged = JSON.stringify(r.gameProblems) === JSON.stringify(base0.gameProblems)
        const value = (key: string) => s.configuredActivity[key].value
        const unknown = sc.circumstances.map((c) => c.key).filter((key) => value(key) === 'NOT_SUPPLIED')
        const known = sc.circumstances.map((c) => c.key).filter((key) => value(key) !== 'NOT_SUPPLIED')
        const requirementAttached = r.requirements.some((q) => q.id === link.requirementId)
        const engaged = requirementAttached && value(link.circumstanceKey) === link.engagesWhen
        const scopeValue = value(sc.scopeCircumstance.key)
        const established = scopeValue === sc.scopeCircumstance.holdsWhen
        const because = [
            ...unknown.map((key) => `${key}: NOT_SUPPLIED`),
            ...(scopeValue !== 'NOT_SUPPLIED' && !established ? [`${sc.scopeCircumstance.key}: ${String(scopeValue)} (the scoped circumstance does not hold)`] : []),
            ...sc.insufficientWhen.filter((w) => value(w.key) === w.value).map((w) => `${w.key}: ${String(w.value)}`),
        ]
        const w = compareWidth(
            k,
            r,
            forms,
            {
                id: `${s.id}-width`,
                label: `the configured area as the limit (${s.id})`,
                configuredArea: { ...configuredArea },
                availableSpace: { ...configuredArea },
                playersPerTeam: { value: [...sizes], standing: at(b.playersPerTeam).declaredStatus },
                decidingCircumstances: {},
            },
            base(SOURCE.assemblyExperiment)
        )
        return {
            id: s.id,
            words: s.words,
            circumstances: sc.circumstances.map((c) => ({ key: c.key, label: c.label, value: s.configuredActivity[c.key].value, valueLabel: s.configuredActivity[c.key].label })),
            known,
            unknown,
            gameProblems: { primary: [...r.gameProblems.primary], secondary: [...r.gameProblems.secondary], unchanged, why: 'the resolution takes no circumstance input' },
            scope: { key: sc.scopeCircumstance.key, established, line: established ? null : sc.scopeCircumstance.whenNotEstablished },
            mismatch: { reported: engaged, line: engaged ? link.report : null, requirementAttached },
            uncertainty: { reported: because.length > 0, line: because.length ? sc.uncertaintyReport : null, because },
            width: { outcome: w.outcome, basis: w.basis, proposalStatus: w.proposal.status, proposalStatement: w.proposal.statement, statement: w.statement, configuredArea: { ...configuredArea }, playersPerTeam: [...sizes] },
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
    account: { lines: AccountLine[]; counts: AccountCounts }
    suitability: SuitabilityReview
    scenarios: ScenarioResult[]
}

/** The Game Problems the resolution returns must be the ones his scope words name, by their names (a re-keyed or renamed problem refuses). */
function gameProblemsNamedInHisWords(experiment: Experiment, resolution: DesignResolution, display: DisplayTexts): void {
    const words = experiment.gameProblemScope.rulingRefs.flatMap((id) => (experiment.rulings.find((r) => r.id === id) as AssemblyRuling).words)
    for (const id of [...resolution.gameProblems.primary, ...resolution.gameProblems.secondary]) {
        const name = display.names[id]?.text ?? ''
        if (!name || !words.some((w) => w.indexOf(name) >= 0)) throw new Error(`the Game Problem ${id} ("${name}") is not named in his scope words`)
    }
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
    gameProblemsNamedInHisWords(experiment, resolution, display)
    const composed = composeCoachActivity(wording, activity)
    const design = designBlock(experiment, activity, display, forms, resolution.gameProblems.basis)
    const account = requirementAccountOf(knowledge, experiment, activity)
    const suitability = suitabilityReview(knowledge, resolution, forms, experiment, activity)
    const scenarios = scenarioReview(knowledge, resolution, forms, experiment, activity)
    return { experiment, wording, resolution, forms, display, activity, composed, design, account, suitability, scenarios }
}

// ---------------------------------------------------------------------------------------------------------------------------------------
// The mutation loop (Part 5 and the front print its counts): every recorded value changed in a copy of the record, the pipeline re-run
// ---------------------------------------------------------------------------------------------------------------------------------------

/**
 * What became of one changed value: substituted into the coach text (the sentence that expresses it changes); refused because a sentence
 * written for the recorded value (whenValue) accepts no other; refused for a structural reason (the validator or the assembly names the
 * value); or, for a value exempt from the coach text, accepted and printed in the report only.
 */
export const MUTATION_OUTCOMES = ['SUBSTITUTED', 'WHEN_VALUE_PINNED', 'STRUCTURAL', 'EXEMPT_PRINTED_ONLY'] as const
export type MutationOutcome = (typeof MUTATION_OUTCOMES)[number]

export interface MutationResult {
    path: string
    howReached: HowReached
    mutatedTo: ChoiceValue
    outcome: MutationOutcome
    reason: string
}

export interface MutationLoop {
    values: number
    counts: Record<MutationOutcome, number>
    results: MutationResult[]
}

/** The changed value: a number plus one, a true or false flipped, anything else (null included) a sentinel no record holds. */
export const mutatedValue = (v: ChoiceValue): ChoiceValue => (typeof v === 'number' ? v + 1 : typeof v === 'boolean' ? !v : 'SENTINEL_MUTATION')

/**
 * Change every recorded value, one at a time, in a copy of the record, and re-run the whole pipeline. Fails closed: a refusal whose message
 * does not name the changed value (a crash, or a check firing for another reason), or a changed value accepted but shown in no sentence that
 * expresses it (nor, for an exempt value, in the report), throws, so the counts can only describe outcomes the checks actually produced.
 */
export function mutationLoop(
    displayFor: (k: DesignKnowledge, experiment: Experiment, resolution: DesignResolution, forms: GameFormSelection) => DisplayTexts,
    knowledge: DesignKnowledge = committedKnowledge(),
    experimentRaw: unknown = committedExperimentData(),
    wordingRaw: unknown = committedWordingData()
): MutationLoop {
    const recorded = validateExperiment(JSON.parse(JSON.stringify(experimentRaw)))
    const results = recorded.choices.map((c): MutationResult => {
        const raw = JSON.parse(JSON.stringify(experimentRaw)) as { choices: Array<{ path: string; value: ChoiceValue }> }
        const target = raw.choices.find((y) => y.path === c.path) as { value: ChoiceValue }
        const next = mutatedValue(target.value)
        target.value = next
        const result = (outcome: MutationOutcome, reason: string): MutationResult => ({ path: c.path, howReached: c.howReached, mutatedTo: next, outcome, reason })
        let changed: AssemblyRun
        try {
            changed = runAssembly(displayFor, knowledge, raw, wordingRaw)
        } catch (e) {
            const message = e instanceof Error ? e.message : String(e)
            if (message.indexOf(`whenValue ${c.path} = `) >= 0) return result('WHEN_VALUE_PINNED', message.slice(message.indexOf('template ')))
            if (message.indexOf(`(${c.path})`) >= 0) return result('STRUCTURAL', message.slice(message.indexOf(`(${c.path})`) + c.path.length + 2).replace(/^[^\s:]*:\s*/, '').trim())
            throw new Error(`mutation loop: changing ${c.path} was refused for a reason that does not name it: ${message}`)
        }
        const exempt = changed.experiment.exemptions.some((e) => e.path === c.path)
        const shown = changed.activity.choices.find((y) => y.path === c.path)?.rendered ?? ''
        const texts = exempt
            ? [buildAssemblyReport(changed).report]
            : [...changed.composed.sections.flatMap((s) => s.sentences).filter((s) => s.expresses.indexOf(c.path) >= 0).map((s) => s.text), ...changed.design.filter((d) => d.expresses.indexOf(c.path) >= 0).map((d) => d.text)]
        if (!texts.some((t) => t.indexOf(String(next)) >= 0 || (shown !== String(next) && t.indexOf(shown) >= 0))) throw new Error(`mutation loop: ${c.path} changed to ${String(next)} and accepted, but no sentence expressing it shows it`)
        return exempt ? result('EXEMPT_PRINTED_ONLY', 'exempt from the coach text; the changed value is printed in the report only') : result('SUBSTITUTED', 'the changed value is printed in the sentence that expresses it')
    })
    const counts = Object.fromEntries(MUTATION_OUTCOMES.map((o) => [o, results.filter((r) => r.outcome === o).length])) as Record<MutationOutcome, number>
    return { values: results.length, counts, results }
}

/** The mutation loop in plain words, for Part 5 (the front prints its first sentence). */
function mutationWords(m: MutationLoop): { front: string; part5: string[] } {
    const of = (o: MutationOutcome) => m.results.filter((r) => r.outcome === o)
    const structural = of('STRUCTURAL')
    const byCode = structural.filter((r) => r.howReached === 'READ_BY_CODE')
    const unresolved = structural.filter((r) => r.howReached === 'UNRESOLVED')
    const other = structural.filter((r) => r.howReached !== 'READ_BY_CODE' && r.howReached !== 'UNRESOLVED')
    const c = m.counts
    const front = `Of the ${m.values} recorded values, changed one at a time in a copy of the record: ${c.SUBSTITUTED} are substituted into the coach text (the sentence changes with the value); ${c.WHEN_VALUE_PINNED} are expressed by sentences written for the recorded value, which refuse any other (whenValue), so a changed value is refused, not re-worded; ${c.STRUCTURAL} are refused for structural reasons; ${c.EXEMPT_PRINTED_ONLY} are exempt from the coach text and appear only in the report.`
    const part5 = [
        `  Mutation loop (every one of the ${m.values} recorded values changed in a copy of the record, a number by one, a true or false value flipped, any other value to a sentinel, and the whole pipeline re-run; a refusal must name the changed value, and an accepted change must show in a sentence that expresses it, or the loop fails):`,
        `    substituted into the coach text, ${c.SUBSTITUTED}: ${of('SUBSTITUTED').map((r) => r.path).join(', ') || 'none'};`,
        `    refused by a sentence written for the recorded value (whenValue), ${c.WHEN_VALUE_PINNED}: the composer cannot re-word these sentences, and whether each sentence's wording matches its value is checked by the unit test's own phrase table (VALUE_PHRASES), not by substitution;`,
        `    refused for structural reasons, ${c.STRUCTURAL}: ${byCode.length} read by code (they cannot be typed; the unit tests flip the knowledge they read instead: ${byCode.map((r) => r.path).join(', ')}); ${unresolved.length} unresolved (no value may be entered: ${unresolved.map((r) => r.path).join(', ')}); ${other.map((r) => `${r.path} (${r.reason})`).join('; ') || 'no other'};`,
        `    exempt from the coach text and printed in the report only, ${c.EXEMPT_PRINTED_ONLY}: ${of('EXEMPT_PRINTED_ONLY').map((r) => r.path).join(', ') || 'none'}.`,
    ]
    return { front, part5 }
}

// ---------------------------------------------------------------------------------------------------------------------------------------
// The regression record (committed beside the evidence; filled after the final regression run)
// ---------------------------------------------------------------------------------------------------------------------------------------

export interface RegressionRecord {
    standing: string
    status: 'PLACEHOLDER' | 'RECORDED'
    build: string | null
    results: Array<{ check: string; result: string }>
}

/** The committed regression record, validated by hand (Part 5 prints it; it is never typed into the report). */
export function validateRegressionRecord(raw: unknown): RegressionRecord {
    const where = 'regression-record.json'
    if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) throw new Error(`${where}: not an object`)
    const o = raw as Record<string, unknown>
    for (const key of Object.keys(o)) if (['standing', 'status', 'build', 'results'].indexOf(key) < 0) throw new Error(`${where}: unknown key "${key}"`)
    if (typeof o.standing !== 'string' || !o.standing) throw new Error(`${where}: standing must be a string`)
    if (o.status !== 'PLACEHOLDER' && o.status !== 'RECORDED') throw new Error(`${where}: status is PLACEHOLDER or RECORDED`)
    if (!(o.build === null || (typeof o.build === 'string' && o.build.length > 0))) throw new Error(`${where}: build is null or the build's name`)
    if (!Array.isArray(o.results)) throw new Error(`${where}: results must be a list`)
    for (const r of o.results as unknown[]) {
        const x = r as Record<string, unknown>
        if (!x || typeof x.check !== 'string' || typeof x.result !== 'string' || Object.keys(x).length !== 2) throw new Error(`${where}: each result is { check, result }`)
    }
    if (o.status === 'RECORDED' && (o.build === null || !(o.results as unknown[]).length)) throw new Error(`${where}: a recorded record names its build and its results`)
    return o as unknown as RegressionRecord
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
const rulingsById = (x: Experiment) => new Map(x.rulings.map((r) => [r.id, r]))
const choiceOf = (x: Experiment, p: string) => x.choices.find((c) => c.path === p) as Choice
/** Where his six classes are filed: the registry entry holding his words for them, with its received date. */
const classesSource = (x: Experiment): string => {
    const r = rulingsById(x).get(x.reportRefs.sixClasses.rulingRef) as AssemblyRuling
    return `his words, ${r.id}, received ${longDate(r.received)}`
}

/** A computed conclusion's weakest decisive standing and the class it gives (so "established by RULING" is never read as its standing). */
function weakestOf(t: InfluenceTrace): string {
    const w = weakestStanding(t)
    return w === null ? 'nothing decisive (class 6)' : `weakest decisive standing ${w}, ${classLabel(sixClassOf(t.influencedBy.map((i) => ({ standing: i.standing }))))}`
}

/** One line of the generated rationale: the value, what decided it, its class, and his words in any non-decisive role; consulted by id. */
export function rationaleLine(run: AssemblyRun, c: AssembledChoice): string {
    const byId = rulingsById(run.experiment)
    const choice = choiceOf(run.experiment, c.path)
    const parts: string[] = []
    if (c.computed) {
        const own = c.decidedBy.slice(0, c.decidedBy.length - choice.decidedBy.length)
        parts.push(`Decided by: the Stage 1/2 computation (${own.length <= 4 ? own.map((i) => `${i.ref} [${i.standing}]`).join('; ') : `${own.length} trace items, in Part 2`})`)
    }
    for (const d of choice.decidedBy) {
        if (d.rulingRef) parts.push(`Decided by: ${d.rulingRef}, ${decidingWords(byId.get(d.rulingRef) as AssemblyRuling, d.valueEvidence as string, d.standing, choice)}`)
        else if (d.knowledgeRef) parts.push(`Decided by: ${d.knowledgeRef.source} ${d.knowledgeRef.table} ${d.knowledgeRef.row} [${d.standing}]${d.valueEvidence ? `: "${d.valueEvidence}"` : ''}`)
        else if (d.ref === 'ILLUSTRATIVE') parts.push('Chosen by us (ILLUSTRATIVE)')
        else if (d.ref === 'OURS') parts.push('Decided by our own reading (OURS)')
        else parts.push('No authorized value (UNRESOLVED)')
    }
    for (const x of choice.permittedBy ?? []) parts.push(`Permitted by ${x.rulingRef}, received ${longDate((byId.get(x.rulingRef) as AssemblyRuling).received)}: "${x.quote}" (${x.namesValue ? 'a permission that names this value; the choice to use it is ours' : 'a permission; it does not state the value'})`)
    for (const x of choice.readingOf ?? []) parts.push(`Our reading of ${x.rulingRef}, received ${longDate((byId.get(x.rulingRef) as AssemblyRuling).received)}: "${x.quote}"`)
    for (const x of choice.scopeSetBy ?? []) parts.push(`Scope for this experiment set by ${x.rulingRef}, received ${longDate((byId.get(x.rulingRef) as AssemblyRuling).received)}: "${x.quote}"`)
    const consulted = choice.consulted.map((x) => x.rulingRef ?? (x.knowledgeRef ? `${x.knowledgeRef.table} ${x.knowledgeRef.row}` : x.ref))
    const provenance = choice.valueIsEvidence ? ` (${choice.note})` : ''
    return `${c.path}: "${c.rendered}"${provenance} [${classLabel(c.sixClass)}]. ${parts.join('. ')}.${consulted.length ? ` Consulted only: ${consulted.join('; ')}.` : ''}`
}

function frontAndParts(run: AssemblyRun, mutation: MutationLoop | null): string[] {
    const { experiment: x, activity: a } = run
    const byId = rulingsById(x)
    const ref = (key: keyof Experiment['reportRefs']) => {
        const r = x.reportRefs[key]
        const ruling = byId.get(r.rulingRef) as AssemblyRuling
        return `"${r.quote ?? ruling.words.join(' ')}" (received ${longDate(ruling.received)})`
    }
    const L: string[] = []
    const n = a.counts.activityValues
    const h = a.counts.howReached
    const nonActivity = new Set(a.counts.nonActivity)
    const activityChoices = a.choices.filter((c) => !nonActivity.has(c.path))
    const entered = h.ENTERED_EVIDENCED + h.ENTERED_ILLUSTRATIVE + h.ENTERED_OUR_INFERENCE
    const laws = x.reportRefs.lawsPrinciple
    const lawsRuling = byId.get(laws.rulingRef) as AssemblyRuling
    const viaLaws = activityChoices.filter((c) => {
        const rulings = choiceOf(x, c.path).decidedBy.filter((d) => d.rulingRef)
        return c.howReached === 'ENTERED_EVIDENCED' && rulings.length > 0 && rulings.every((d) => d.rulingRef === laws.rulingRef)
    }).length
    const eventValue = String(choiceOf(x, x.bindings.scoringEvent).value)
    L.push('', '=== FRONT. What was shown, what was not, and the honest answer ===')
    L.push(`His question: ${ref('experimentPurpose')}; and earlier, his test: ${ref('acceptance')}`)
    L.push(`- The answer to that test is No: the activity was not constructed from reusable, authorized knowledge alone. The review pathway's code routed the goal to its context (${a.rpcId}) from the approved planning model; the Game Problems were ${basisWords(run.resolution.gameProblems.basis)}; it found ${run.forms.compatible.length} compatible Game Forms (${run.forms.compatible.join(', ')}) without ranking them; and it confirmed that the scoring event (${eventValue}) is one of the context's approved scoring events. It configured nothing: of the ${n} values the activity rests on, ${h.READ_BY_CODE} were read from knowledge by code and ${entered} were entered by hand in a labelled record written for this goal (${h.ENTERED_EVIDENCED} stated in his words, ${viaLaws} of them only through his ${longDate(lawsRuling.received)} principle that the Laws apply by default; ${h.ENTERED_ILLUSTRATIVE} illustrative; ${h.ENTERED_OUR_INFERENCE} our own readings); ${h.UNRESOLVED} are left unresolved, with no value. A second Learning Goal would need its own record (Part 7). Nothing here is evidence of ecological effectiveness.`)
    L.push(`- Recorded beside the activity but not part of it (${a.counts.nonActivity.length}): ${a.counts.nonActivity.join('; ')} (Part 2 gives each one's reason). The record holds ${a.counts.values} values in all.`)
    // The Game Problems are listed with how they were read: from his scoped ruling where the planning model's translation is unpopulated.
    const computedList = a.computed.map((c) => (c.trace === run.resolution.gameProblems.trace ? `${c.id} (${basisShort(run.resolution.gameProblems.basis)})` : c.id))
    L.push(`- COMPUTED (Part 2 prints each with its own influence trace): ${computedList.join('; ')}; and, counted separately, the structural conditions of each compatible form (Part 3).`)
    L.push(`- NOT COMPUTED: the architecture has no configuration step today (Steps 3-5 are held). The configuration is a labelled decision record we entered, which holds every value of the activity: each of its ${entered} entered values is evidenced in his words, illustrative, or our inference; each of its ${h.READ_BY_CODE} values read by code names the cell or the computation it is read from; each of its ${h.UNRESOLVED} unresolved values has no value; and each says which.`)
    L.push('- The coach text is a DRAFT template fill keyed to configuration paths: not the production renderer, and not approved wording.')
    L.push(`- How far the text follows the record: ${mutation ? `${mutationWords(mutation).front} (Part 5 lists each.)` : 'the mutation loop was not run for this report.'}`)
    L.push(`- How the ${n} activity values reached it: ${HOW_REACHED.map((key) => `${HOW_REACHED_LABEL[key]} ${h[key]}`).join('; ')}.`)
    L.push(`- His six classes (${classesSource(x)}; printed in full in Part 2) over the ${n} activity values: ${Object.entries(a.counts.classes).map(([c, k]) => `${c} ${k}`).join('; ')}.`)
    const class1 = activityChoices.filter((c) => c.sixClass === 1)
    const partlyApproved = activityChoices.filter((c) => c.sixClass > 1 && c.decidedBy.some((i) => i.standing === 'APPROVED'))
    L.push(`- Why class 1 is small: ${class1.length} value${class1.length === 1 ? '' : 's'} (${class1.map((c) => c.path).join(', ') || 'none'}). A value takes the weakest class of what decided it, so the ${partlyApproved.length} other values that rest partly on approved knowledge (an APPROVED item among what decided them) take a weaker class from a ruling, candidate data or our record beside it: ${partlyApproved.map((c) => `${c.path} (class ${c.sixClass})`).join(', ')}.`)
    const class6 = activityChoices.filter((c) => c.sixClass === 6)
    const c6Unresolved = class6.filter((c) => c.howReached === 'UNRESOLVED').length
    const c6Ours = class6.filter((c) => c.howReached === 'ENTERED_OUR_INFERENCE').length
    L.push(`- What class 6 holds: ${class6.length} values, ${c6Unresolved} unresolved and ${c6Ours} of our own readings (OURS)${class6.length - c6Unresolved - c6Ours ? `, and ${class6.length - c6Unresolved - c6Ours} other` : ''}. His list has no separate place for our readings, so they are placed in class 6 with the unresolved items; Part 2 shows, for each, the words of his it reads.`)
    L.push(`- Identity: ${run.suitability.identityPoint.statement} ${run.suitability.scopeTension.statement} Suitability: ${run.suitability.addNothing.status} (${run.suitability.addNothing.statement})`)
    L.push(`- Diagram: none is drawn, so the Coach Overview is incomplete against RC3 4.5 and against his 21 October list, ${ref('diagram')}. The cause is an architectural dependency (Part 6), not missing information.`)
    const blocks = (b: string) => x.openDecisions.filter((d) => d.blocks === b)
    L.push(`- Blocks assembly: ${blocks('ASSEMBLY').length ? blocks('ASSEMBLY').map((d) => `${d.id}: ${d.question} (${d.handling})`).join(' / ') : 'none'}.`)
    L.push(`- Blocks a scoring-fidelity or production claim: ${blocks('SCORING_FIDELITY_OR_PRODUCTION').map((d) => `${d.id}: ${d.question} (${d.handling})`).join(' / ')}`)
    L.push(`- Blocks a suitability claim: ${blocks('SUITABILITY').map((d) => `${d.id}: ${d.question} (${d.handling})`).join(' / ')}`)
    for (const r of x.reconciliations.filter((y) => y.smallest)) L.push(`- Section ${r.id}, the smallest decision: ${r.smallest}`)
    L.push('- Non-blocking calls for him:')
    for (const d of blocks('NON_BLOCKING')) L.push(`    ${d.id}: ${d.question} (${d.handling})`)
    L.push('- Our readings (he can tell us if they are wrong; his standing words already answer them, so they are not asked):')
    for (const d of blocks('OUR_READING')) L.push(`    ${d.id}: ${d.question} (${d.handling})`)
    L.push('- Known risks to review in play (no rule is imposed):')
    for (const d of blocks('KNOWN_RISK')) L.push(`    ${d.id}: ${d.question} (${d.handling})`)

    L.push('', `=== PART 0. Reconciliation with the 5 November ${run.display.goalName.text} assessment, and reuse ===`)
    const reconcile = byId.get(x.reconciliation.rulingRef) as AssemblyRuling
    L.push(`His request: "${reconcile.words.join(' ')}" (received ${longDate(reconcile.received)})`)
    for (const i of x.reconciliation.assessmentItems) L.push(`  ${i.item} -> ${i.carriedBy}`)
    L.push('  Reuse:')
    for (const r of x.reconciliation.reuse) L.push(`    ${r.work}: ${r.status}. ${r.why}`)
    L.push(`  Still open: ${x.reconciliation.stillOpen.join('; ')}.`)
    return L
}

function activityPart(run: AssemblyRun): string[] {
    const { experiment: x, activity: a, composed, wording } = run
    const byId = rulingsById(x)
    const L: string[] = ['', '=== PART 1. The activity as assembled (review copy) ===']
    const limits = byId.get(x.reportRefs.limits.rulingRef) as AssemblyRuling
    for (const w of limits.words) L.push(`His limits: "${w}" (received ${longDate(limits.received)})`)
    const caveat = x.reportRefs.caveat
    L.push(`His caveat on the start: "${caveat.quote}" (received ${longDate((byId.get(caveat.rulingRef) as AssemblyRuling).received)})`)
    L.push(`Wording: ${wording.standing}`)
    L.push(`Wording keyed for: ${wording.keyedFor.gameForm} and the scoring event ${wording.keyedFor.scoringEvent}. ${wording.keyedFor.note}`)
    L.push(`Coach terms: "${wording.coachTerms.targetZone}" and "${wording.coachTerms.markedLine}" (${wording.coachTerms.source})`)
    L.push(`Markers: each sentence carries, in brackets, the weakest of his classes (${classesSource(x)}) among the values it expresses (class 1 unmarked); where its values differ in class, each value's class is listed too. A sentence marked review only is a review disclosure, dropped from a coach copy. In a coach-facing copy every marker would be hidden from coaches (RC3 6.1); they are shown here for review. A sentence whose wording status is not newly proposed says so.`)
    L.push('', 'LEARNING DESIGN (shown beside the RC3 activity; generated from the assembly, not from the wording file)')
    for (const d of run.design) L.push(`  ${d.text}${d.marker ? ` ${d.marker}` : ''}`)
    L.push('', 'WHY THIS DESIGN (our summary, from the record: each sentence carries the weakest class among the values it names; not evidence of ecological effectiveness)')
    const at = (p: string) => a.choices.find((c) => c.path === p) as AssembledChoice
    for (const w of x.whyThisDesign) {
        const text = w.text.replace(/\{([A-Za-z0-9.]+)\}/g, (_, p: string) => at(p).rendered)
        const marker = w.paths.length ? sentenceMarker(w.paths.map((p) => ({ path: p, sixClass: at(p).sixClass }))) : '[OURS: our summary]'
        L.push(`  ${text}${marker ? ` ${marker}` : ''}`)
    }
    let level = ''
    for (const s of composed.sections) {
        if (s.level !== level) {
            level = s.level
            L.push('', level.toUpperCase())
        }
        L.push(`  ${s.title} (RC3 ${s.rc3})`)
        for (const t of s.sentences) L.push(`    ${t.text}${t.marker ? ` ${t.marker}` : ''}${t.status !== 'NEWLY PROPOSED' ? ` {wording: ${t.status}}` : ''}`)
    }
    L.push('', 'DESIGN RATIONALE (generated from the decision trace: each line names the value, what decided it and its class, his words in any role beside it, and what was only consulted; it is not evidence of ecological effectiveness)')
    for (const c of a.choices) L.push(`  ${rationaleLine(run, c)}`)
    return L
}

function tracePart(run: AssemblyRun): string[] {
    const { experiment: x, activity: a, account } = run
    const byId = rulingsById(x)
    const L: string[] = ['', '=== PART 2. Decision trace ===']
    L.push(`His six classes, in his order (${classesSource(x)}): ${SIX_CLASSES.map((c, i) => `${i + 1} "${c}"`).join(' / ')}`)
    L.push('A decision\'s class is the weakest, in his order, over everything that decided it and its declared status. His provisional rulings are placed in class 3 ("Candidate or provisional knowledge."), each printed with his words and received date; the code\'s own PROVISIONAL (his words given as an example) is printed HIS EXAMPLE WORDS and never decides anything. A value his words do not state is decided by our illustrative choice or our own reading, never by his words: the words that permit it, or that our reading reads, are printed beside it, and so are the words that set a computed value\'s scope. Where the code reads a value from a knowledge cell, his words that decide it select what the code reads, and the cell states the value.')
    L.push(`Class 2 holds every ruling of his that is not provisional, scoped or general (our placement): his words name it "${SIX_CLASSES[1]}", and a ruling that states no scope is placed there too, its decided-by line saying 'general, no scope stated' (or, where the entry's scope words are said of another value, 'no scope stated for this decision').`)
    L.push('', 'His words, each filed once (with their kind; scope only where his words state one, quoted beside it; the file, with our filed copy where one exists). The received date is the one that counts: our old filing dates, named beside some filed copies, ran ahead of the calendar, so some are later than this report.')
    for (const r of x.rulings) {
        const covers = r.scopeCovers ? `; ${r.scopeCovers.slice(-1) === '.' ? r.scopeCovers.slice(0, -1) : r.scopeCovers}` : ''
        L.push(`  ${r.id} [${r.kind}]: ${r.decision} (${r.subject}). Received ${longDate(r.received)}${r.provisional ? '; provisional in his words' : ''}${r.establishesCanonicalKnowledge ? '; his words make the item owner-authored canonical knowledge' : ''}. File: ${r.file}. Scope: ${r.scope ?? 'none stated'}${r.scopeWords ? ` ("${r.scopeWords.join('"; "')}")` : ''}${r.scopePaths ? `, said of ${r.scopePaths.join(', ')} only` : ''}${covers}.`)
        for (const w of r.words) L.push(`    "${w}"`)
    }
    const parts = byId.get(x.requiredPartsRulingRef) as AssemblyRuling
    L.push('', `His nine parts (received ${longDate(parts.received)}), each with the values that carry it:`)
    for (const p of x.requiredParts) L.push(`  ${p.id} "${p.part}" -> ${p.paths.length ? p.paths.join(', ') : ''}${p.generatedFromTrace ? 'generated from the trace (the design rationale and the why-this-design summary in Part 1)' : ''}`)
    L.push('', 'Every material value (path; value; how it reached the activity; class; what decided it; his words in a non-decisive role; what was only consulted; what set its status):')
    let scopeParagraphPrinted = false
    for (const c of a.choices) {
        const choice = choiceOf(x, c.path)
        L.push(`  ${c.path} = ${JSON.stringify(c.value)} ("${c.rendered}")`)
        L.push(`    how reached: ${HOW_REACHED_LABEL[c.howReached]}; declared ${standingLabel(c.declaredStatus)}${c.allDecisiveRulingsProvisional ? ' (his provisional ruling: class 3)' : ''}; ${classLabel(c.sixClass)}`)
        L.push(`    trace: ${c.traceLabel}`)
        for (const i of c.decidedBy) L.push(itemLine('decided by', i, '      '))
        for (const i of c.permittedBy) L.push(itemLine('permitted by', i, '      '))
        for (const i of c.readingOf) L.push(itemLine('our reading of', i, '      '))
        for (const i of c.scopeSetBy) L.push(itemLine('scope set by', i, '      '))
        for (const i of c.consulted) L.push(itemLine('consulted', i, '      '))
        for (const i of c.statusSetBy) L.push(itemLine('status set by', i, '      '))
        L.push(`    note: ${c.note}`)
        if (!scopeParagraphPrinted && (choice.readBy === 'RESOLUTION_PRIMARY' || choice.readBy === 'RESOLUTION_SECONDARY')) {
            scopeParagraphPrinted = true
            L.push(`    filed scope of the computed designation: ${run.resolution.gameProblems.scope ?? 'none'}${run.resolution.gameProblems.continuedBy ? `, continued by ${run.resolution.gameProblems.continuedBy.ruling}` : ''}; the scope for this experiment is set by his 5 November words (${x.gameProblemScope.rulingRefs.join(', ')}), printed as scope set by and never decisive. ${x.gameProblemScope.idResolution} ${x.gameProblemScope.note}`)
        }
    }
    L.push('', 'Values derived in code (never typed):')
    for (const d of a.derived) L.push(`  ${d.id} = ${d.value} (${d.label}); from ${d.fromPaths.join(', ')}; ${classLabel(d.sixClass)}. ${d.note}`)
    L.push('', 'Computed conclusions (the Stage 1/2 code, its traces unchanged; "established by" is the conclusion\'s basis, not its standing):')
    for (const c of a.computed) {
        L.push(`  ${c.id} (established by ${c.establishedBy}; ${weakestOf(c.trace)}): ${c.statement}`)
        L.push(...traceLines(c.trace, '    '))
    }
    L.push('', 'Status of this example (every value not in class 1, with its class and how it reached the activity):')
    for (const c of a.choices.filter((y) => y.sixClass !== 1)) L.push(`  ${c.path}: ${classLabel(c.sixClass)}; ${HOW_REACHED_LABEL[c.howReached]}`)
    L.push('', 'Not expressed in the coach activity, with the reason (pinned):')
    for (const e of x.exemptions) L.push(`  ${e.path}${e.nonActivity ? ' [not part of the activity]' : ''}: ${e.reason}`)
    const readingLabel = (r: string | null) => (r === 'FOR_EXAMPLE' ? 'the "for example" reading' : r === 'COLON' ? 'the colon reading' : `the ${String(r)} reading`)
    L.push('', `Requirement account (his ruling of 29 October; each category placement is OURS; only active requirements are counted; categories 3 and 4 never count as satisfied, and categories 1 and 2 hold only where every cited value is present), under his three standards; each line prints the requirement as its statement cell holds it, read after the decisions:`)
    const statementOf = (l: AccountLine) => {
        const s = run.display.statements[`${l.requirementRef.table} ${l.requirementRef.row}`]
        if (!s) throw new Error(`${l.id}: no statement supplied for ${l.requirementRef.table} ${l.requirementRef.row}`)
        return s
    }
    for (const standard of x.accountStandards) {
        L.push(`  ${standard}:`)
        for (const l of account.lines.filter((y) => y.standard === standard)) {
            const counted = l.excluded ? ` (EXCLUDED: ${l.excluded})` : l.satisfied ? ' (counts as satisfied)' : ' (not counted as satisfied)'
            L.push(`    ${l.id} ${l.requirementRef.table} ${l.requirementRef.row} (${l.requirementRole}, ${l.requirementStatus})${l.clause ? ` clause "${l.clause}" under ${readingLabel(l.reading)}` : ''}: "${l.category}"${counted}`)
            L.push(`      requirement (${statementOf(l).cite.row}): "${statementOf(l).text}"`)
            const conditions = l.observableConditions ? `; observable conditions: ${l.observableConditions} (${l.inCoachGuidance ? 'in the coach guidance (What to Watch)' : 'identified for review; not yet in the coach guidance'})` : ''
            L.push(`      values: ${l.paths.join(', ')}${conditions}${l.downgraded ? `; DOWNGRADED: ${l.downgraded}` : ''}`)
            L.push(`      note: ${l.note}`)
        }
    }
    for (const [reading, counts] of Object.entries(account.counts.byReading)) L.push(`  Counts under ${readingLabel(reading)} (the identity rules count under both readings): ${Object.entries(counts).map(([c, k]) => `"${c}" ${k}`).join('; ')}.`)
    L.push(`  Excluded (not an active requirement): ${account.counts.excluded.length ? account.counts.excluded.join(', ') : 'none'}.`)
    L.push('', 'Laws account (one entry per law the Sport Profile lists; an adaptation owed is named, never silently assumed):')
    for (const l of x.laws) L.push(`  ${l.lawId ?? l.situation}: ${l.status}. ${l.reason} (values: ${l.paths.join(', ')})`)
    L.push('', `${x.gameForm.illustrativeChoice} contract items (each mapped to a value, or not used with its reason):`)
    for (const c of x.contractItems) L.push(`  ${c.itemId}: ${c.mappedTo.length ? c.mappedTo.join(', ') : `not used: ${c.notUsed}`}`)
    L.push('  Not authored by the Game Form, reported:')
    for (const d of x.contractDeclarationsReported) L.push(`    ${d.row} ${d.declaration}: ${d.what}; here: ${d.how}`)
    return L
}

/** One structural evaluation's rows, as compared across forms (statuses only; the details are in the results file). */
function structuralRows(e: StructuralEvaluation): string[] {
    return [
        ...e.preconditions.map((p) => `precondition ${p.requirement}: ${p.status} (${p.evidenceStatus})`),
        `continuous play ${e.continuousPlay.entryId}: ${e.continuousPlay.status}`,
        ...e.integrity.conditions.map((c) => `${c.conditionId} [${c.class}]: ${c.status}${c.evidenceStatus ? ` (${c.evidenceStatus})` : ''}`),
    ]
}

function reviewParts(run: AssemblyRun, regression: RegressionRecord | null, mutation: MutationLoop | null): string[] {
    const { experiment: x, suitability: s, scenarios, forms } = run
    const byId = rulingsById(x)
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
    L.push(`  Scope: ${s.scopeTension.statement} (his words: ${s.scopeTension.rulingRefs.join(', ')})`)
    const addNothing = byId.get(s.addNothing.rulingRef) as AssemblyRuling
    L.push(`  Adding nothing: ${s.addNothing.status}. ${s.addNothing.statement} His words: "${s.addNothing.quote}" (received ${longDate(addNothing.received)})`)
    L.push('  Known risks to review (OURS; visible only in play; no rule is imposed):')
    for (const p of s.reviewPoints) L.push(`    ${p.id}: ${p.statement} (his words: ${p.rulingRefs.join(', ')})`)
    const illustrative = s.structural.find((e) => e.gameFormId === s.configurationRowsBelongTo) as StructuralEvaluation
    L.push(`  No verdict and no ranking. Structural conditions of every compatible form, alike, in id order: the illustrative form with the assembled team sizes; each other form with the same team sizes applied hypothetically (not assembled), compared row by row with the illustrative form:`)
    for (const e of s.structural) {
        const sizes = e.activity ? e.activity.playersPerTeam.join(' v ') : 'none'
        if (e === illustrative) {
            L.push(`    ${e.gameFormId} (archetype ${e.archetypeId}; assembled ${sizes}, ${e.activity?.standing ?? 'TEST INPUT'})`)
            for (const p of e.preconditions) L.push(`      precondition '${p.statement}' (${p.requirement}): ${p.status}; evidence status ${p.evidenceStatus}. ${p.detail}`)
            L.push(`      continuous play (${e.continuousPlay.entryId}): ${e.continuousPlay.status}. ${e.continuousPlay.detail}`)
            for (const c of e.integrity.conditions) L.push(`      ${c.conditionId} [${c.class}]: ${c.status}${c.evidenceStatus ? `; evidence status ${c.evidenceStatus}` : ''}. ${c.detail}`)
            continue
        }
        const mine = structuralRows(e)
        const theirs = structuralRows(illustrative)
        const differences = mine.filter((row, i) => row !== theirs[i]).concat(theirs.length > mine.length ? theirs.slice(mine.length).map((row) => `missing here: ${row}`) : [])
        L.push(`    ${e.gameFormId} (archetype ${e.archetypeId}; NOT ASSEMBLED: the ${illustrative.gameFormId} illustrative team sizes, ${sizes} (${e.activity?.standing ?? 'TEST INPUT'}), applied hypothetically): ${differences.length ? `differs from ${illustrative.gameFormId} in: ${differences.join('; ')}` : `the same status as ${illustrative.gameFormId} on every row (${mine.length} rows)`}; its rows, with their wording, are in the results file.`)
    }

    L.push('', '=== PART 4. Three hypothetical scenarios ===')
    L.push(x.scenarios.standing)
    const scenarioRuling = byId.get(x.scenarios.rulingRef) as AssemblyRuling
    const rules = byId.get(x.scenarios.rulesRef) as AssemblyRuling
    for (const w of rules.words) L.push(`  His words for the scenarios: "${w}" (received ${longDate(rules.received)})`)
    L.push(`  Width check: ${x.scenarios.widthCheck.note}`)
    for (const r of scenarios) {
        L.push(`  ${r.id}: "${r.words}" (received ${longDate(scenarioRuling.received)})`)
        for (const c of r.circumstances) L.push(`    ${c.key} (${c.label}) = ${String(c.value)} (${c.valueLabel})`)
        L.push(`    known: ${r.known.join(', ') || 'none'}; unknown: ${r.unknown.join(', ') || 'none'}`)
        L.push(`    Game Problems: primary ${r.gameProblems.primary.join(', ')}; secondary ${r.gameProblems.secondary.join(', ')}; unchanged: ${r.gameProblems.unchanged ? 'yes' : 'NO'} (${r.gameProblems.why}; unchanged by construction, not a tested outcome)`)
        L.push(`    scope of his designation (${r.scope.key}): ${r.scope.established ? 'established in this scenario' : r.scope.line}`)
        L.push(`    recorded requirement ${x.scenarios.requirementLink.requirementId} (${r.mismatch.requirementAttached ? 'attached to the resolution' : 'not attached'}): ${r.mismatch.reported ? r.mismatch.line : 'not engaged'}`)
        L.push(`    ${r.uncertainty.reported ? `${r.uncertainty.line} (${r.uncertainty.because.join('; ')})` : 'uncertainty: none (every circumstance is supplied)'}`)
        L.push(`    width check (configured area ${r.width.configuredArea.lengthM} x ${r.width.configuredArea.widthM} m, ${r.width.configuredArea.standing}, = available space; team sizes ${r.width.playersPerTeam.join(' v ')} from the assembly; its own circumstances not supplied): ${r.width.outcome} [${r.width.basis}]; proposal ${r.width.proposalStatus}. ${r.width.proposalStatement}`)
    }
    const link = x.scenarios.requirementLink
    L.push(`  The recorded requirement rests on: ${link.rulingRefs.map((id) => { const rr = byId.get(id) as AssemblyRuling; return `${id} "${rr.words.join(' ')}" (received ${longDate(rr.received)})` }).join('; ')}`)
    L.push(`  The scope circumstance is read from his words: ${x.scenarios.scopeCircumstance.rulingRefs.join(', ')}.`)

    L.push('', '=== PART 5. Regression and output checks ===')
    L.push('  The unit tests (assembly.unit.ts, in npm test) check, in plain words: every value reaches the coach text or the learning-design block, or is pinned as exempt with a reason; each number sits beside the word it counts (pinned per value), and a sentence\'s numbers come only from its values; a template written for one value (whenValue) refuses any other value, so the wording of those sentences is not checked by substitution: an independent phrase table in the test requires and forbids phrases for each value such a sentence is written for, and the keyword checks bind words to the values they concern; the scoring, direction and win sentences name the target zone and never a line; no scoring sentence makes keeping possession a condition; the What to Watch block says nothing about the starting condition; no coach sentence carries a status word or an unquoted quotation; no report line outside quotation marks makes an effect claim; no value his words do not state is printed as stated by him, and each value his words do state, with its class, is pinned in the test independently of the record; his words are verbatim in the record (their hashes pinned after the external quote check); the classes follow his order; the Laws (status per law) and contract items (load-bearing mappings and ranges) are all accounted for; the requirement account counts no unsupported, unresolved or observation-only component; no decision moves when the display texts are rewritten; Stage 2\'s evidence is byte-identical; two runs, and the committed evidence, are byte-identical. That the Game Problems are unchanged across the three scenarios holds by construction (the resolution takes no circumstance input); it is not a tested outcome.')
    if (mutation) L.push(...mutationWords(mutation).part5)
    else L.push('  Mutation loop: not run for this report.')
    L.push('  What the runner alone does not refuse: the validator binds only numbers to the words his evidence uses for them. A non-numeric value his words state, changed in the record together with every whenValue that names it, is refused by the runner only where a structural check reads it (Part 5 above lists those); otherwise the runner prints it, and the unit test\'s phrase table (VALUE_PHRASES) and its table of each stated value (EXPECTED_VALUE_EVIDENCE) refuse it in npm test.')
    if (!regression) L.push('  Regression record: not supplied to this run.')
    else {
        L.push(`  Regression record (evidence/regression-record.json): ${regression.status}. ${regression.standing}`)
        if (regression.build) L.push(`  Build: ${regression.build}`)
        for (const r of regression.results) L.push(`    ${r.check}: ${r.result}`)
    }
    L.push('  Passing engineering tests is not evidence of representative learning effectiveness.')

    L.push('', '=== PART 6. His section 8 reconciliations, and the architectural dependencies ===')
    for (const r of x.reconciliations) {
        L.push(`  ${r.id} ${r.title}`)
        for (const rid of r.rulingRefs) {
            const rr = byId.get(rid) as AssemblyRuling
            for (const w of rr.words) L.push(`    his words: "${w}" (received ${longDate(rr.received)})`)
        }
        for (const i of r.items) L.push(`    - ${i}`)
        if (r.smallest) L.push(`    - ${r.smallest}`)
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
    const kinds = [...new Set(x.rulings.map((r) => r.kind))].map((k) => `${x.rulings.filter((r) => r.kind === k).length} ${k}`)
    L.push(`  Recorded: ${x.rulings.length} entries of his words, verbatim (${kinds.join(', ')}), ${x.choices.length} values, ${x.laws.length} Laws entries, ${x.contractItems.length} contract items, ${x.requirementAccount.length} requirement-account lines, ${x.suitability.properties.length} suitability entries, ${x.suitability.reviewPoints.length} known risks, ${x.scenarios.items.length} scenarios, ${x.openDecisions.length} open decisions.`)
    const question = x.reportRefs.futureFeedbackQuestion
    L.push(`  His question for future coach feedback, preserved and kept out of the coach activity: "${question.quote}" (received ${longDate((byId.get(question.rulingRef) as AssemblyRuling).received)})`)
    L.push('  A second Learning Goal would need authored (the per-goal cost, the honest measure of reuse):')
    for (const s2 of x.secondGoalNeeds) L.push(`    - ${s2}`)
    const templates = run.wording.templates
    const locked = templates.filter((t) => Object.keys(t.whenValue ?? {}).length > 0)
    const scoped = templates.filter((t) => t.scope)
    L.push(`  Wording reuse, counted: ${templates.length} DRAFT templates; ${locked.length} are locked by whenValue to this record's exact values (a changed value is refused, not re-worded); ${scoped.length} are scoped to this goal or its context (${scoped.map((t) => `${t.id} ${t.scope}`).join(', ')}); ${templates.length - locked.length} carry no whenValue (their values arrive through placeholders, or they express none).`)
    return L
}

/** The report text and the results value; no time stamp, so two runs on the same inputs are byte-identical. */
export function buildAssemblyReport(run: AssemblyRun, regression: RegressionRecord | null = null, mutation: MutationLoop | null = null): { report: string; results: unknown } {
    const lines: string[] = []
    lines.push(`Bounded ${run.experiment.learningGoalId} activity-assembly experiment (${run.display.goalName.text}): review pathway only, offline`)
    lines.push(`Standing: ${run.experiment.standing}`)
    lines.push(...frontAndParts(run, mutation), ...activityPart(run), ...tracePart(run), ...reviewParts(run, regression, mutation))
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
        regressionRecord: regression,
        mutationLoop: mutation,
        sixClasses: SIX_CLASSES.map((c, i) => ({ class: (i + 1) as SixClass, words: c })),
        sixClassesFiledAs: run.experiment.reportRefs.sixClasses.rulingRef,
    }
    return { report: `${lines.join('\n')}\n`, results }
}
