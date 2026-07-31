import mongoose, { Schema } from 'mongoose'

/**
 * Observation Event — Runtime Interface Specification RC1.2 §25.
 *
 * WHY THIS IS NOT A USAGE EVENT. `usage_events` is a fire-and-forget telemetry stream: writes are
 * detached, failures are swallowed, and nothing guarantees ordering. Observation Events are a
 * first-class runtime object. §8 makes them immutable historical facts, §9 requires ordered session
 * state, and §34 has the Session Record carry them as an *ordered* list for transfer to Evidence
 * Intelligence. Telemetry that may silently drop a write cannot carry that contract, so this is its
 * own append-only collection.
 *
 * Pilot 1 scope (§42): the coach records these AFTER using an activity. No interpretation, no
 * recommendation, no Experience Intelligence call — the events are stored, ordered, and later
 * transferred as evidence.
 *
 * `sequenceNumber` is assigned per session at write time from the current count. Two observations
 * submitted concurrently for one session could in principle collide; that is acceptable here because
 * Pilot 1 capture is a single coach filling one form, and `observedAt` remains the authoritative
 * tiebreak. If live capture (Pilot 2) makes concurrency real, this needs an atomic counter.
 */
export interface IObservationEvent {
    _id?: string
    /** §12 canonical observation code — NEVER a display label. */
    observationCode: string
    /** §13 canonical session stage at capture. */
    sessionStage: string
    /** §25 capture method. Pilot 1 always POST_USE. */
    captureMethod: string
    /** Position in ordered session history (§9). */
    sequenceNumber: number
    observedAt: Date
    activityId?: string
    sessionId?: string
    userId?: string
    /** §25 optional bounded free-text note. */
    coachNote?: string
    /** §6 — the contract version this object was created under. */
    interfaceVersion: string
    createdAt?: Date
}

const ObservationEventSchema = new Schema<IObservationEvent>(
    {
        observationCode: { type: String, required: true, index: true },
        sessionStage: { type: String, required: true },
        captureMethod: { type: String, required: true, default: 'POST_USE' },
        sequenceNumber: { type: Number, required: true },
        observedAt: { type: Date, required: true },
        activityId: { type: String, index: true },
        sessionId: { type: String, index: true },
        userId: { type: String, index: true },
        coachNote: { type: String },
        interfaceVersion: { type: String, required: true },
    },
    { timestamps: { createdAt: true, updatedAt: false }, collection: 'observation_events' }
)

// Ordered retrieval per session — the access pattern the Session Record needs.
ObservationEventSchema.index({ sessionId: 1, sequenceNumber: 1 })

export default mongoose.model<IObservationEvent>('ObservationEvent', ObservationEventSchema)
