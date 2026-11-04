/**
 * **Structural conditions of a compatible Game Form** — Stage 2, review pathway only, test-only where it reads a test input (Christian's
 * reply to the Stage 2 decision package, received 4 November 2026, D6: *"I agree that the ball as task object and the opposing team as
 * competitor can serve as explicit structural preconditions in the isolated tests, without being treated as sufficient evidence of
 * ecological relevance."* / *"A structural condition does not prove that an affordance will emerge."*; and his classification of one
 * archetype's integrity conditions into required conditions and descriptions of breaches, quoted with its ids in `stage2-rulings.json`;
 * D5: *"I also support retaining continuous play as a baseline representative condition where applicable, separate from specific
 * Interaction Regulations."*).
 *
 * For one compatible Game Form and a configured activity's team sizes (a test input), this reports three things, each with its influence
 * trace and its `establishedBy`:
 *   1. Structural preconditions (test-only, evidence status INFERRED: each rests on one identification of ours, held in
 *      `stage2-rulings.json`). Present for a form whose archetype the data lists, with two teams that each have players. Each is labelled
 *      as present, not as evidence of ecological relevance, and as not distinguishing one Game Problem from another.
 *   2. The continuous-play baseline (the conditions-of-use entry whose data lists the form's archetype): it holds by design wherever no
 *      authorized departure is recorded. It is a baseline representative condition, not an Interaction Regulation.
 *   3. The archetype's organizational integrity conditions, read by id and role from the archetype workbook, each classified by his D6 as
 *      data (required condition or breach description). Integrity is a continuum, so no pass-or-fail verdict is printed. Before an activity
 *      is assembled (Step 3 is held), each required condition is to be expressed by the assembled activity and is not evaluable, except
 *      where the data records a structural signal (opposition present by design; the continuous-play baseline). Each breach description is
 *      a risk: indicated by the design, not indicated, or not evaluable.
 *
 * No condition's statement is read: the classification and the signals are his and ours, as data. No element-to-affordance relevance join
 * is made, and nothing here excludes a design. No goal, Game Problem, context, Game Form, archetype or row id appears in this file.
 */
import { archetypeIntegrityConditions, Cite, conditionOfUse, DesignKnowledge, IntegrityClassification, ruling, SOURCE, sourceStanding } from './knowledge'
import { FormCandidate } from './forms'
import { DesignResolution, MissingKnowledge } from './resolve'
import { citeRef, Conclusion, EstablishedBy, InfluenceTrace, item, TraceItem } from './trace'

/** The configured activity the structural conditions are read against: team sizes only, a test input. */
export interface StructuralActivity {
    playersPerTeam: number[]
    source: string
}

export interface PreconditionResult {
    id: string
    statement: string
    requirement: string
    status: 'PRESENT' | 'ABSENT' | 'NOT_APPLICABLE' | 'NOT_EVALUATED'
    evidenceStatus: 'INFERRED'
    testOnly: true
    label: string
    detail: string
    establishedBy: EstablishedBy
    trace: InfluenceTrace
}

export type IntegrityStatus =
    | 'NOT_EVALUABLE_BEFORE_ACTIVITY_ASSEMBLY'
    | 'STRUCTURAL_SIGNAL_PRESENT'
    | 'STRUCTURAL_SIGNAL_ABSENT'
    | 'RISK_INDICATED_BY_DESIGN'
    | 'RISK_NOT_INDICATED_BY_DESIGN'
    | 'RISK_NOT_EVALUABLE'
    | 'UNCLASSIFIED'

export interface IntegrityConditionResult {
    conditionId: string
    recordId: string
    workbookRole: string
    class: IntegrityClassification['class'] | 'UNCLASSIFIED'
    structuralSignal: IntegrityClassification['structuralSignal']
    status: IntegrityStatus
    detail: string
    cite: Cite
    establishedBy: EstablishedBy
    testOnly: boolean
    trace: InfluenceTrace
}

export interface ContinuousPlayResult {
    entryId: string
    status: 'HOLDS_BY_DESIGN' | 'DEPARTURE_RECORDED' | 'NOT_APPLICABLE'
    detail: string
    notAnInteractionRegulation: true
    establishedBy: EstablishedBy
    trace: InfluenceTrace
}

export interface StructuralEvaluation {
    learningGoalId: string
    gameFormId: string
    archetypeId: string
    activity: StructuralActivity | null
    preconditions: PreconditionResult[]
    continuousPlay: ContinuousPlayResult
    integrity: { standing: string; noVerdict: string; noVerdictSource: string; conditions: IntegrityConditionResult[] }
    conclusions: Conclusion[]
    missing: MissingKnowledge[]
}

/** Whether the activity has two teams that each have players; null when no activity is supplied. */
export function twoTeamsWithPlayers(activity: StructuralActivity | null): boolean | null {
    if (!activity) return null
    return activity.playersPerTeam.length === 2 && activity.playersPerTeam.every((n) => Number.isInteger(n) && n > 0)
}

export function evaluateStructuralConditions(k: DesignKnowledge, resolution: DesignResolution, form: FormCandidate, activity: StructuralActivity | null): StructuralEvaluation {
    const missing: MissingKnowledge[] = []
    const d6 = k.stage2Rulings.relevance
    const d6Ruling = ruling(k, d6.ruling)
    const d6Item = item(`stage2-rulings.json ${d6Ruling.id}`, sourceStanding(k, 'stage2Rulings'), `his ${d6Ruling.decision}`, { file: SOURCE.stage2Rulings, table: 'rulings', row: d6Ruling.id })
    const archetypeId = form.declaration?.archetypeId ?? ''
    const formItem = form.declaration ? item(citeRef(form.declaration.cite), sourceStanding(k, 'sportModule'), `the form's archetype cell reads ${archetypeId}`, form.declaration.cite) : null
    const activityItem = activity ? item(`${activity.source} playersPerTeam ${activity.playersPerTeam.join(' v ')}`, 'TEST INPUT', 'the configured activity\'s team sizes') : null
    const teams = twoTeamsWithPlayers(activity)
    const conclusions: Conclusion[] = []
    const step = `structural conditions of ${form.gameFormId}`

    // 1. Structural preconditions (test-only, INFERRED).
    const pre = d6.structuralPreconditions
    const preApplies = pre.appliesToArchetypeIds.includes(archetypeId)
    const preconditions: PreconditionResult[] = pre.items.map((p) => {
        const status: PreconditionResult['status'] = !preApplies ? 'NOT_APPLICABLE' : teams === null ? 'NOT_EVALUATED' : teams ? 'PRESENT' : 'ABSENT'
        const detail =
            status === 'NOT_APPLICABLE'
                ? `The form's archetype ${archetypeId || '(none)'} is not one the preconditions are listed for.`
                : status === 'NOT_EVALUATED'
                  ? 'No configured activity was supplied, so team sizes are unknown.'
                  : status === 'PRESENT'
                    ? `Two teams, each with players (${(activity as StructuralActivity).playersPerTeam.join(' v ')}): ${pre.label}.`
                    : `The activity does not have two teams that each have players (${(activity as StructuralActivity).playersPerTeam.join(' v ')}).`
        const trace: InfluenceTrace = {
            influencedBy: [d6Item, item(`stage2-rulings.json relevance.structuralPreconditions ${p.id}`, 'OURS', p.ourIdentification), ...(formItem ? [formItem] : []), ...(activityItem ? [activityItem] : [])],
            consulted: [],
            citedOnly: [],
        }
        const establishedBy: EstablishedBy = status === 'NOT_EVALUATED' ? 'INSUFFICIENT EVIDENCE' : 'LOGICAL INFERENCE'
        conclusions.push({ id: `${form.gameFormId} ${p.id}`, step, statement: `'${p.statement}' (${p.requirement}): ${status}. ${detail}`, establishedBy, testOnly: true, trace })
        return { id: p.id, statement: p.statement, requirement: p.requirement, status, evidenceStatus: 'INFERRED' as const, testOnly: true as const, label: pre.label, detail, establishedBy, trace }
    })
    const signalling = pre.items.filter((p) => p.signal === 'OPPOSITION_PRESENT').map((p) => p.id)
    const competitorPresent = preconditions.some((p) => signalling.includes(p.id) && p.status === 'PRESENT')
    const competitorAbsent = preconditions.some((p) => signalling.includes(p.id) && p.status === 'ABSENT')

    // 2. The continuous-play baseline: the entry the data names, where its data lists the form's archetype.
    const entry = conditionOfUse(k, d6.continuousPlayBaselineEntry)
    const departures = d6.authorizedDepartures.filter((d) => d.learningGoalId === resolution.learningGoalId)
    const d5Ruling = ruling(k, d6.conditionsOfUseRuling)
    let continuousPlay: ContinuousPlayResult
    if (!(entry.appliesToArchetypeIds ?? []).includes(archetypeId)) {
        continuousPlay = { entryId: entry.id, status: 'NOT_APPLICABLE', detail: `The continuous-play baseline is not listed for the form's archetype ${archetypeId || '(none)'}.`, notAnInteractionRegulation: true, establishedBy: 'LOGICAL INFERENCE', trace: { influencedBy: formItem ? [formItem] : [], consulted: [], citedOnly: [] } }
    } else {
        const basisItems: TraceItem[] = [
            item(`conditions-of-use.stage2.json ${entry.id}`, 'OURS', `${entry.evidenceClass}; ${entry.permittedEngineUse}`, { file: SOURCE.conditionsOfUse, table: 'entries', row: entry.id }),
            item(`stage2-rulings.json ${d5Ruling.id}`, sourceStanding(k, 'stage2Rulings'), `his ${d5Ruling.decision}: continuous play as a baseline representative condition`, { file: SOURCE.stage2Rulings, table: 'rulings', row: d5Ruling.id }),
            ...(formItem ? [formItem] : []),
            item('stage2-rulings.json relevance.authorizedDepartures', 'OURS', departures.length ? `${departures.length} authorized departure(s) recorded for the goal` : 'no authorized departure recorded for the goal'),
        ]
        const ecological = entry.sources.filter((s) => s.standing === 'APPROVED').map((s) => item(s.ref, s.standing, 'the baseline\'s ecological basis; shown, not decisive'))
        continuousPlay = departures.length
            ? { entryId: entry.id, status: 'DEPARTURE_RECORDED', detail: `Continuous play is the baseline, except where an authorized departure states otherwise: ${departures.map((d) => d.departure).join('; ')}.`, notAnInteractionRegulation: true, establishedBy: 'RULING', trace: { influencedBy: basisItems, consulted: ecological, citedOnly: [] } }
            : {
                  entryId: entry.id,
                  status: 'HOLDS_BY_DESIGN',
                  detail: 'Play continues through a change of possession by design: no authorized departure is recorded. A baseline representative condition, not an Interaction Regulation; it implies nothing about what players do after a change of possession.',
                  notAnInteractionRegulation: true,
                  establishedBy: 'LOGICAL INFERENCE',
                  trace: { influencedBy: basisItems, consulted: ecological, citedOnly: [] },
              }
    }
    conclusions.push({ id: `${form.gameFormId} continuous play`, step, statement: `Continuous-play baseline: ${continuousPlay.status}. ${continuousPlay.detail}`, establishedBy: continuousPlay.establishedBy, testOnly: false, trace: continuousPlay.trace })

    // 3. Integrity conditions: read by id and role; classified by his D6 as data; no pass-or-fail verdict.
    const classification = d6.integrityConditions.classification
    const rows = archetypeId ? archetypeIntegrityConditions(k, archetypeId) : []
    for (const c of classification.filter((c) => c.conditionId.startsWith(`${archetypeId}-`) && !rows.some((r) => r.conditionId === c.conditionId))) {
        missing.push({ kind: 'CLASSIFIED_CONDITION_NOT_IN_WORKBOOK', detail: `stage2-rulings.json classifies ${c.conditionId}, which the archetype workbook does not hold for ${archetypeId}.`, cites: [{ file: SOURCE.stage2Rulings, table: 'relevance.integrityConditions', row: c.conditionId }] })
    }
    const conditions: IntegrityConditionResult[] = rows.map((row) => {
        const cls = classification.find((c) => c.conditionId === row.conditionId)
        const rowItem = item(citeRef(row.cite), sourceStanding(k, 'archetypes'), `${row.conditionId}, role ${row.role}`, row.cite)
        const clsItem = item(`stage2-rulings.json relevance.integrityConditions ${row.conditionId}`, sourceStanding(k, 'stage2Rulings'), cls ? `his D6 classification: ${cls.class}` : 'not classified')
        if (!cls) {
            missing.push({ kind: 'INTEGRITY_CONDITION_UNCLASSIFIED', detail: `${row.conditionId} has no classification in stage2-rulings.json.`, cites: [row.cite] })
            return { conditionId: row.conditionId, recordId: row.recordId, workbookRole: row.role, class: 'UNCLASSIFIED', structuralSignal: null, status: 'UNCLASSIFIED', detail: 'Not classified; not evaluated.', cite: row.cite, establishedBy: 'INSUFFICIENT EVIDENCE', testOnly: false, trace: { influencedBy: [rowItem, clsItem], consulted: [], citedOnly: [] } }
        }
        let status: IntegrityStatus
        let detail: string
        let establishedBy: EstablishedBy = 'INSUFFICIENT EVIDENCE'
        let testOnly = false
        const influencedBy: TraceItem[] = [rowItem, clsItem, d6Item]
        if (cls.class === 'REQUIRED CONDITION') {
            if (cls.structuralSignal === 'OPPOSITION_PRESENT' && (competitorPresent || competitorAbsent)) {
                status = competitorPresent ? 'STRUCTURAL_SIGNAL_PRESENT' : 'STRUCTURAL_SIGNAL_ABSENT'
                detail = competitorPresent
                    ? 'Opposition is present by design (an opposing team with players). Whether the condition is expressed is emergent: to be expressed by the assembled activity; not evaluable before activity assembly.'
                    : 'No opposing team with players: the design gives this condition nothing to be expressed through.'
                establishedBy = 'LOGICAL INFERENCE'
                testOnly = true
                if (activityItem) influencedBy.push(activityItem)
            } else if (cls.structuralSignal === 'CONTINUOUS_PLAY_BASELINE' && continuousPlay.status === 'HOLDS_BY_DESIGN') {
                status = 'STRUCTURAL_SIGNAL_PRESENT'
                detail = `Supported by the continuous-play baseline (${continuousPlay.entryId}): play continues through changes of possession by design. Whether the condition is expressed is emergent: to be expressed by the assembled activity; not evaluable before activity assembly.`
                establishedBy = 'LOGICAL INFERENCE'
                influencedBy.push(item(`conditions-of-use.stage2.json ${continuousPlay.entryId}`, 'OURS', `continuous-play baseline ${continuousPlay.status}`))
            } else {
                status = 'NOT_EVALUABLE_BEFORE_ACTIVITY_ASSEMBLY'
                detail = 'To be expressed by the assembled activity; not evaluable before activity assembly (Step 3 is held).'
            }
        } else {
            if (cls.structuralSignal === 'OPPOSITION_PRESENT' && (competitorPresent || competitorAbsent)) {
                status = competitorPresent ? 'RISK_NOT_INDICATED_BY_DESIGN' : 'RISK_INDICATED_BY_DESIGN'
                detail = competitorPresent
                    ? 'A risk, not a verdict. Not indicated by the design: an opposing team with players is present. Whether it can change progression is emergent.'
                    : 'A risk, not a verdict. Indicated by the design: no opposing team with players.'
                establishedBy = 'LOGICAL INFERENCE'
                testOnly = true
                if (activityItem) influencedBy.push(activityItem)
            } else {
                status = 'RISK_NOT_EVALUABLE'
                detail = 'A risk, not a verdict. Not evaluable before activity assembly (Step 3 is held).'
            }
        }
        if (row.role !== 'CONDITION') missing.push({ kind: 'INTEGRITY_ROLE_CHANGED', detail: `${row.conditionId} has workbook role ${row.role}; his D6 classification was confirmed against role CONDITION.`, cites: [row.cite] })
        const trace: InfluenceTrace = { influencedBy, consulted: [], citedOnly: [item(d6.integrityConditions.noVerdictSource.ref, d6.integrityConditions.noVerdictSource.standing, 'integrity is a continuum, so no pass-or-fail verdict is printed')] }
        conclusions.push({ id: `${form.gameFormId} ${row.conditionId}`, step, statement: `${row.conditionId} (${cls.class}): ${status}. ${detail}`, establishedBy, testOnly, trace })
        return { conditionId: row.conditionId, recordId: row.recordId, workbookRole: row.role, class: cls.class, structuralSignal: cls.structuralSignal, status, detail, cite: row.cite, establishedBy, testOnly, trace }
    })

    return {
        learningGoalId: resolution.learningGoalId,
        gameFormId: form.gameFormId,
        archetypeId,
        activity,
        preconditions,
        continuousPlay,
        integrity: { standing: d6.integrityConditions.standing, noVerdict: d6.integrityConditions.noVerdictQuote, noVerdictSource: d6.integrityConditions.noVerdictSource.ref, conditions },
        conclusions,
        missing,
    }
}
