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
    /**
     * The evidence that cannot be reconstructed after the fact. `abandonedAtStep` is the one that
     * matters most: a coach who leaves planning makes no server request, so without this they are
     * indistinguishable from a coach who never opened the app.
     */
    pilotEvidence: {
        planningStarted: number
        planningAbandoned: number
        abandonedAtStep: Record<string, number>
        activitiesViewed: number
        /**
         * Which of the three generated activities a coach actually took to the field.
         *
         * The checklist lists "Activity selected" as automatic collection, and it was the one line
         * nothing recorded. It carries more than its own count: the pilot's variety question — do
         * coaches read the three as genuine alternatives, minor variations, or the same activity —
         * has no other observable. If selection concentrates on slot 1, they are taking the first
         * thing offered; if it spreads, the alternatives are doing work. Nothing a coach says
         * afterwards substitutes for what they picked.
         */
        activitiesSelected: number
        selectedBySlot: Record<string, number>
        /** Reached the end of a session. Distinguishes "generated and abandoned" from "actually ran". */
        sessionsCompleted: number
        wouldUseAgain: Record<string, number>
        /**
         * "Would you run this activity as written?" — answerable the moment a coach reads the
         * activity, so it captures the ones who never reach the field. Christian's point: what we
         * don't capture at the moment it happens gets reconstructed later from memory, and the
         * specific detail is what goes missing.
         */
        runAsWritten: Record<string, number>
        /** Free-text from a coach who said they would change something, most recent first. */
        wouldChange: Array<{ answer: string; text: string }>
        /** Free-text answers to "anything confusing, unclear, or unrealistic?" */
        unclearNotes: string[]
        /**
         * "Was it immediately clear how players succeed?" — yes / had_to_reread / no.
         * Christian's one-read test, turned from something only he could judge into pilot evidence.
         */
        successClarity: Record<string, number>
        /**
         * "Did you modify the activity?" — asked AFTER practice, and deliberately not the same
         * question as "would you run this as written?" asked before it.
         *
         * The pair is the measurement. A coach who says they would run it as written and then
         * modifies it on the field has told us something neither answer contains alone: the activity
         * read as usable and turned out not to be. That gap is invisible to either question by
         * itself, and it is the one the pilot most needs, because it separates a communication
         * problem from a design problem.
         */
        modifiedActivity: Record<string, number>
        /** What changed, verbatim, with the answer beside it. */
        modifications: Array<{ answer: string; text: string }>
        /**
         * "Did your players discover an unexpected way to succeed?"
         *
         * Degenerate solutions are the failure mode representative design is most exposed to, and
         * they are invisible from our side: the activity ran, the points were scored, the telemetry
         * looks healthy. Only the coach standing on the field sees players satisfying the scoring
         * condition without engaging the intended problem. The checklist defers the Degenerate
         * Solution Pattern Catalogue to post-pilot, which makes collecting the raw reports now the
         * whole point — the catalogue cannot be built later from evidence nobody captured.
         */
        unexpectedSuccess: Record<string, number>
        /** What happened, verbatim. The seed corpus for the post-pilot catalogue. */
        unexpectedSuccessNotes: string[]
    }
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
    const pilot = {
        planningStarted: 0,
        planningAbandoned: 0,
        activitiesViewed: 0,
        activitiesSelected: 0,
        sessionsCompleted: 0,
    }
    const abandonedAtStep: Record<string, number> = {}
    const selectedBySlot: Record<string, number> = {}
    const wouldUseAgain: Record<string, number> = {}
    const runAsWritten: Record<string, number> = {}
    const successClarity: Record<string, number> = {}
    const wouldChange: Array<{ answer: string; text: string }> = []
    const unclearNotes: string[] = []
    const modifiedActivity: Record<string, number> = {}
    const modifications: Array<{ answer: string; text: string }> = []
    const unexpectedSuccess: Record<string, number> = {}
    const unexpectedSuccessNotes: string[] = []

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
        if (e.eventType === 'feature_used') {
            const name = String(p['name'] ?? '')
            if (name === 'planning_started') pilot.planningStarted += 1
            if (name === 'activities_viewed') pilot.activitiesViewed += 1
            if (name === 'planning_abandoned') {
                pilot.planningAbandoned += 1
                const step = String(p['atStep'] ?? 'unknown')
                abandonedAtStep[step] = (abandonedAtStep[step] ?? 0) + 1
            }
            if (name === 'activity_selected') {
                pilot.activitiesSelected += 1
                // Slot, not activity id: the question is whether coaches spread across the three
                // alternatives, and ids differ on every generation so they cannot answer that.
                const slot = String(p['slot'] ?? 'unknown')
                selectedBySlot[slot] = (selectedBySlot[slot] ?? 0) + 1
            }
            if (name === 'session_completed') pilot.sessionsCompleted += 1
        }
        if (e.eventType === 'coach_feedback' && p['question'] === 'would_use_again') {
            const answer = String(p['answer'] ?? 'unknown')
            wouldUseAgain[answer] = (wouldUseAgain[answer] ?? 0) + 1
        }
        if (e.eventType === 'coach_feedback' && p['question'] === 'run_as_written') {
            const answer = String(p['answer'] ?? 'unknown')
            runAsWritten[answer] = (runAsWritten[answer] ?? 0) + 1
            const clarity = typeof p['successClarity'] === 'string' ? (p['successClarity'] as string) : ''
            if (clarity) successClarity[clarity] = (successClarity[clarity] ?? 0) + 1
            const change = typeof p['whatWouldChange'] === 'string' ? (p['whatWouldChange'] as string).trim() : ''
            // Kept verbatim, with the answer beside it. "I'd change X" is only interpretable next to
            // whether they would have run it at all.
            if (change) wouldChange.push({ answer, text: change })
            const unclear = typeof p['unclear'] === 'string' ? (p['unclear'] as string).trim() : ''
            if (unclear) unclearNotes.push(unclear)
        }
        if (e.eventType === 'coach_feedback' && p['question'] === 'practice_report') {
            const modified = typeof p['didModify'] === 'string' ? (p['didModify'] as string) : ''
            if (modified) {
                modifiedActivity[modified] = (modifiedActivity[modified] ?? 0) + 1
                const detail = typeof p['modificationDetail'] === 'string' ? (p['modificationDetail'] as string).trim() : ''
                // Kept with the yes/no beside it: "we added a third team" only means something once
                // you know whether the coach considered that a modification at all.
                if (detail) modifications.push({ answer: modified, text: detail })
            }

            const unexpected = typeof p['unexpectedSuccess'] === 'string' ? (p['unexpectedSuccess'] as string) : ''
            if (unexpected) {
                unexpectedSuccess[unexpected] = (unexpectedSuccess[unexpected] ?? 0) + 1
                const detail =
                    typeof p['unexpectedSuccessDetail'] === 'string' ? (p['unexpectedSuccessDetail'] as string).trim() : ''
                if (detail) unexpectedSuccessNotes.push(detail)
            }
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
        pilotEvidence: {
            ...pilot,
            abandonedAtStep,
            selectedBySlot,
            wouldUseAgain,
            runAsWritten,
            successClarity,
            // Newest first: during a pilot the most recent comment is the one still actionable.
            wouldChange: wouldChange.slice(-50).reverse(),
            unclearNotes: unclearNotes.slice(-50).reverse(),
            modifiedActivity,
            modifications: modifications.slice(-50).reverse(),
            unexpectedSuccess,
            unexpectedSuccessNotes: unexpectedSuccessNotes.slice(-50).reverse(),
        },
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
