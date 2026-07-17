import mongoose, { Schema } from 'mongoose'

/**
 * MVP field-evidence collection (Joe's requirement): append-only usage events recording what
 * coaches ask for, how the engine resolved it, what got generated, and in-app feedback. This is
 * the data source for prioritizing post-MVP work (what's used, what's rejected, what coaches say)
 * and feeds the Knowledge Core's evidence-driven governance (reasoning traces → field evidence).
 *
 * Design: fire-and-forget writes (never block or fail generation), no coach-identifying content
 * beyond ids, payload kept small (ids + statuses, not full activity text).
 */
export type UsageEventType =
    | 'goal_submitted' // coach asked for activities: goals + resolution status + signal groups
    | 'goal_rejected' // parser found no supported signals (the exact text coaches typed — vocabulary gaps)
    | 'selection_resolved' // archetype/lenses/constraints ids + shadow ATP summary + versions
    | 'generation_succeeded' // activity count + duration
    | 'generation_failed' // stage + reason (incl. output-validation rejections)
    | 'coach_feedback' // in-app rating/comment on an activity
    | 'feature_used' // generic UI feature event (extensible from the front-end)

export interface IUsageEvent {
    _id?: string
    eventType: UsageEventType
    sessionId?: string
    activityId?: string
    userId?: string
    /** Raw coach goal text where relevant (goal_submitted / goal_rejected) — the vocabulary evidence. */
    goalText?: string
    /** Small structured details per event type (ids, statuses, counts — not full generated text). */
    payload?: Record<string, unknown>
    createdAt?: Date
}

const UsageEventSchema = new Schema<IUsageEvent>(
    {
        eventType: { type: String, required: true, index: true },
        sessionId: { type: String, index: true },
        activityId: { type: String, index: true },
        userId: { type: String, index: true },
        goalText: { type: String },
        payload: { type: Schema.Types.Mixed },
    },
    { timestamps: { createdAt: true, updatedAt: false }, collection: 'usage_events' }
)

UsageEventSchema.index({ eventType: 1, createdAt: -1 })

export default mongoose.model<IUsageEvent>('UsageEvent', UsageEventSchema)
