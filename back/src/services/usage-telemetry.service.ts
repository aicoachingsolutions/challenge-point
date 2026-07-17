import Logger from '../logger'
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
    rejectedGoals: Array<{ goalText: string; count: number }>
    feedback: { up: number; down: number; comments: number }
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
    const feedback = { up: 0, down: 0, comments: 0 }

    for (const e of events) {
        totals[e.eventType] = (totals[e.eventType] ?? 0) + 1
        const p = (e.payload ?? {}) as Record<string, unknown>
        if (e.eventType === 'goal_submitted') {
            const status = String(p['resolutionStatus'] ?? 'unknown')
            resolutionBreakdown[status] = (resolutionBreakdown[status] ?? 0) + 1
            for (const sg of (p['signalGroups'] as string[]) ?? []) {
                signalCounts.set(sg, (signalCounts.get(sg) ?? 0) + 1)
            }
        }
        if (e.eventType === 'selection_resolved') {
            const arc = String(p['archetype'] ?? '')
            if (arc) archetypeCounts.set(arc, (archetypeCounts.get(arc) ?? 0) + 1)
        }
        if (e.eventType === 'goal_rejected' && e.goalText) {
            const key = e.goalText.toLowerCase().trim()
            rejectedCounts.set(key, (rejectedCounts.get(key) ?? 0) + 1)
        }
        if (e.eventType === 'coach_feedback') {
            if (p['rating'] === 'up') feedback.up++
            if (p['rating'] === 'down') feedback.down++
            if (typeof p['comment'] === 'string' && (p['comment'] as string).trim()) feedback.comments++
        }
    }

    const topN = (m: Map<string, number>, n: number) =>
        [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n)

    return {
        since: since.toISOString(),
        totals,
        resolutionBreakdown,
        topSignalGroups: topN(signalCounts, 15).map(([signalGroup, count]) => ({ signalGroup, count })),
        topArchetypes: topN(archetypeCounts, 15).map(([archetype, count]) => ({ archetype, count })),
        rejectedGoals: topN(rejectedCounts, 25).map(([goalText, count]) => ({ goalText, count })),
        feedback,
    }
}
