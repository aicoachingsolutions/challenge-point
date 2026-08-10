import Logger from '../logger'
import ObservationEvent from '../models/observation-event.model'
import UsageEvent, { IUsageEvent } from '../models/usage-event.model'

/**
 * MVP usage telemetry — fire-and-forget recording of coach usage + engine outcomes.
 * INVARIANT: recording must never block, slow, or fail the request that triggered it.
 * All writes are detached and swallow their own errors (logged at debug level only).
 */
export function recordUsageEvent(event: IUsageEvent): void {
    void UsageEvent.create(event).catch((err) => {
        Logger.debug(`[usage-telemetry] failed to record ${event.eventType}: ${err instanceof Error ? err.message : String(err)}`)
    })
}

export interface UsageSummary {
    since: string
    totals: Record<string, number>
    resolutionBreakdown: Record<string, number>
    topSignalGroups: Array<{ signalGroup: string; count: number }>
    topArchetypes: Array<{ archetype: string; count: number }>
    /**
     * What the guided planning conversation actually produced. `learningStage` is the reason this
     * exists: coaches are asked for it but nothing consumes it yet, because how it combines with
     * Challenge is a coaching judgement still to be made. This turns that decision into one that can
     * be made against a real distribution. `entryPoint` shows whether coaches are using the guided
     * conversation or falling back to free text, which is the honest measure of whether it works.
     */
    planning: {
        entryPoint: Record<string, number>
        learningStage: Record<string, number>
        topLearningGoals: Array<{ learningGoalId: string; count: number }>
        practiceSituationUsed: number
    }
    rejectedGoals: Array<{ goalText: string; count: number }>
    feedback: { up: number; down: number; comments: number }
    /**
     * Internal ontology terms that survived coach-language translation, most frequent first.
     * This is the worklist for the next Coach Vocabulary & Translation Dictionary revision — each
     * entry is a term coaches actually saw, ranked by how often.
     */
    coachLanguageLeaks: Array<{ term: string; count: number }>
    /**
     * What coaches change about generated activities, most-edited field first, plus how often an
     * edit touched representative structure. This is the calibration data for Representative
     * Validation: a field coaches rewrite constantly is a field the engine is getting wrong.
     */
    activityEdits: {
        total: number
        structural: number
        topFields: Array<{ field: string; count: number }>
    }
    /**
     * Post-use coach observations (Runtime Interface §42, Pilot 1). This is the calibration dataset
     * for Experience Intelligence — which observations coaches actually reach for, and at which
     * session stage. Built before the interpreter exists, on purpose: calibrating against real
     * reports beats calibrating against our assumptions.
     */
    observations: {
        total: number
        byCode: Array<{ code: string; count: number }>
        byStage: Array<{ stage: string; count: number }>
    }
}

/** Aggregate usage since a cutoff (default 30 days) for the debug-usage view. */
export async function summarizeUsage(sinceDays = 30): Promise<UsageSummary> {
    const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000)
    const events = await UsageEvent.find({ createdAt: { $gte: since } })
        .sort({ createdAt: -1 })
        .limit(20000)
        .lean()

    const totals: Record<string, number> = {}
    const resolutionBreakdown: Record<string, number> = {}
    const signalCounts = new Map<string, number>()
    const archetypeCounts = new Map<string, number>()
    const rejectedCounts = new Map<string, number>()
    const leakCounts = new Map<string, number>()
    const editFieldCounts = new Map<string, number>()
    const edits = { total: 0, structural: 0 }
    const feedback = { up: 0, down: 0, comments: 0 }
    const planningEntryPoint: Record<string, number> = {}
    const learningStageCounts: Record<string, number> = {}
    const learningGoalCounts = new Map<string, number>()
    let practiceSituationUsed = 0

    for (const e of events) {
        totals[e.eventType] = (totals[e.eventType] ?? 0) + 1
        const p = (e.payload ?? {}) as Record<string, unknown>
        if (e.eventType === 'goal_submitted') {
            const status = String(p['resolutionStatus'] ?? 'unknown')
            resolutionBreakdown[status] = (resolutionBreakdown[status] ?? 0) + 1
            for (const sg of (p['signalGroups'] as string[]) ?? []) {
                signalCounts.set(sg, (signalCounts.get(sg) ?? 0) + 1)
            }

            const entryPoint = String(p['planningEntryPoint'] ?? 'unknown')
            planningEntryPoint[entryPoint] = (planningEntryPoint[entryPoint] ?? 0) + 1

            const stage = p['learningStage']
            if (typeof stage === 'string' && stage) {
                learningStageCounts[stage] = (learningStageCounts[stage] ?? 0) + 1
            }
            const learningGoalId = p['learningGoalId']
            if (typeof learningGoalId === 'string' && learningGoalId) {
                learningGoalCounts.set(learningGoalId, (learningGoalCounts.get(learningGoalId) ?? 0) + 1)
            }
            // How often the conditional step actually fired — the measure of whether Practice
            // Situations are earning the extra question.
            if (p['practiceSituationId']) practiceSituationUsed += 1
        }
        if (e.eventType === 'selection_resolved') {
            const arc = String(p['archetype'] ?? '')
            if (arc) archetypeCounts.set(arc, (archetypeCounts.get(arc) ?? 0) + 1)
        }
        if (e.eventType === 'goal_rejected' && e.goalText) {
            const key = e.goalText.toLowerCase().trim()
            rejectedCounts.set(key, (rejectedCounts.get(key) ?? 0) + 1)
        }
        if (e.eventType === 'coach_language_leak') {
            for (const term of (p['terms'] as string[]) ?? []) {
                leakCounts.set(term, (leakCounts.get(term) ?? 0) + 1)
            }
        }
        if (e.eventType === 'activity_edited') {
            edits.total++
            if (p['touchesRepresentativeStructure'] === true) edits.structural++
            for (const field of (p['changedFields'] as string[]) ?? []) {
                editFieldCounts.set(field, (editFieldCounts.get(field) ?? 0) + 1)
            }
        }
        if (e.eventType === 'coach_feedback') {
            if (p['rating'] === 'up') feedback.up++
            if (p['rating'] === 'down') feedback.down++
            if (typeof p['comment'] === 'string' && (p['comment'] as string).trim()) feedback.comments++
        }
    }

    // Observation Events live in their own append-only collection, not the telemetry stream — see
    // observation-event.model.ts for why. Read separately and summarized alongside.
    const observationEvents = await ObservationEvent.find({ createdAt: { $gte: since } })
        .limit(20000)
        .lean()
    const observationCodeCounts = new Map<string, number>()
    const observationStageCounts = new Map<string, number>()
    for (const o of observationEvents) {
        observationCodeCounts.set(o.observationCode, (observationCodeCounts.get(o.observationCode) ?? 0) + 1)
        observationStageCounts.set(o.sessionStage, (observationStageCounts.get(o.sessionStage) ?? 0) + 1)
    }

    const topN = (m: Map<string, number>, n: number) =>
        [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n)

    return {
        since: since.toISOString(),
        totals,
        resolutionBreakdown,
        topSignalGroups: topN(signalCounts, 15).map(([signalGroup, count]) => ({ signalGroup, count })),
        planning: {
            entryPoint: planningEntryPoint,
            learningStage: learningStageCounts,
            topLearningGoals: topN(learningGoalCounts, 15).map(([learningGoalId, count]) => ({ learningGoalId, count })),
            practiceSituationUsed,
        },
        topArchetypes: topN(archetypeCounts, 15).map(([archetype, count]) => ({ archetype, count })),
        rejectedGoals: topN(rejectedCounts, 25).map(([goalText, count]) => ({ goalText, count })),
        feedback,
        coachLanguageLeaks: topN(leakCounts, 25).map(([term, count]) => ({ term, count })),
        activityEdits: {
            ...edits,
            topFields: topN(editFieldCounts, 15).map(([field, count]) => ({ field, count })),
        },
        observations: {
            total: observationEvents.length,
            byCode: topN(observationCodeCounts, 20).map(([code, count]) => ({ code, count })),
            byStage: topN(observationStageCounts, 5).map(([stage, count]) => ({ stage, count })),
        },
    }
}
