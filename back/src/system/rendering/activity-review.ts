/**
 * The signed-in activity review, without the request and the database around it.
 *
 * Christian, 13 October 2026: *"The review page should accept any of the thirteen Learning Goals and use the
 * coach's actual session context. … Where an activity cannot be generated, I'd prefer a brief,
 * understandable explanation rather than a generic failure. Please keep the actual coach-facing activity
 * primary, with its selection rationale and technical evidence available separately."*
 *
 * **Why the route's body is here rather than in the route.** A handler that loads a session, validates it,
 * builds an activity and shapes the answer can only be exercised with a server and a database, and this
 * worktree's tests have neither. So everything that decides anything is in the two functions below, which
 * take a plain session and a plain body, and the route does only what needs Express and Mongo: find the
 * session, check whose it is, and send what these return. The unit test calls exactly what the route calls.
 *
 * **It stores nothing and it transforms nothing.** What comes back is the builder's own `ServedActivity` or
 * `RefusedActivity`. The one refusal made here is the session's — a fact the envelope needs and nobody has
 * stated — and it has the same shape as every other, so a page has one thing to render.
 *
 * **A refusal is an ANSWER, not an error.** Whatever a coach can act on — a missing area, nine players, a
 * goal the engine cannot build yet — is returned as a refusal for the caller to send as a 200, because the
 * front end's service layer keeps only five fields of a non-2xx body and the sentence would not survive.
 * The two errors thrown here are for a request that names nothing: there is no activity it could have been.
 */
import { ActivityBuild, ActivityRequest, ActivitySubject, buildActivityForReview, buildActivityWithSelection, describeRequest, RefusedActivity, ServedActivity } from './build-activity'
import { MECHANISM_DEMONSTRATIONS } from './mechanism-demonstrations'
import { sessionEnvelopeFrom, specializedRoleNames, StoredSession } from './session-envelope'
import { sessionPlanningModel } from '../session-planning/session-planning-model'

/** The request body, as it arrives. Nothing in it is trusted to be the type it should be. */
export interface ActivityReviewBody {
    learningGoalId?: unknown
    demonstrationId?: unknown
    /** How long the activity runs. Stated per review because a session holds no duration. */
    durationMin?: unknown
    /** The coach's statement of specialized-role availability for this review. Overrides the stored one. */
    roles?: unknown
    /**
     * The practice situation the coach chose, for a Learning Goal only — added 22 October 2026 for the live route (the live-app fix,
     * design section 4.3 L1), which builds a goal whose authorization record supplies an evaluated design through this function and
     * passes the situation the planning conversation sent. The review page sends none, so its builds are unchanged (null, as before).
     * Checked against the goal's situations by `describeRequest`, which refuses one the planning model does not offer.
     */
    practiceSituationId?: unknown
}

/** The body does not say what to build. A malformed request, answered as one. */
export class ActivityReviewRequestError extends Error {}

const named = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0

/**
 * `includeDrafts` (stage K7, 15 October 2026): the route sets it from its administrator check, and only then does a refusal at
 * communication carry the draft rendering (`review-draft.ts`). Absent or false, the answer is exactly `buildActivity`'s — the same
 * keys, nothing drafted — which is what the coach whose session it is receives.
 */
export function reviewActivity(stored: StoredSession, body: ActivityReviewBody, options: { includeDrafts?: boolean } = {}): ServedActivity | RefusedActivity {
    if (options.includeDrafts === true) {
        const request = reviewRequestOf(stored, body)
        return 'refusal' in request ? request.refusal : buildActivityForReview(request, { includeDrafts: true })
    }
    return reviewActivityBuild(stored, body).activity
}

/**
 * **The coach's review build with the goal's selection and the input digests beside it** — added 22 October 2026 for the live route (the
 * live-app fix, design section 4.3). The SAME request as `reviewActivity` without drafts, built by the same chain (`buildActivityWithSelection`
 * is `buildActivity` with its selection and digests returned), so `activity` is exactly what the review page receives for the same inputs.
 * The live route reads the selection to hold it against its own (G3) and the record behind it (G2), and keeps the digests for the save
 * (L3). A session refusal carries no selection and no digests.
 */
export function reviewActivityBuild(stored: StoredSession, body: ActivityReviewBody): ActivityBuild {
    const request = reviewRequestOf(stored, body)
    return 'refusal' in request ? { activity: request.refusal, selection: null, inputDigests: [] } : buildActivityWithSelection(request)
}

/** The request a review body asks for, or the session's refusal. Throws for a body that names nothing (see the class above). */
function reviewRequestOf(stored: StoredSession, body: ActivityReviewBody): ActivityRequest | { refusal: RefusedActivity } {
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new ActivityReviewRequestError('the request has no body to read')
    const goal = named(body.learningGoalId)
    const demonstration = named(body.demonstrationId)
    if (goal === demonstration) {
        // Both or neither. Choosing one for the caller would build something they did not ask for.
        throw new ActivityReviewRequestError('name exactly one of learningGoalId or demonstrationId')
    }
    // A practice situation belongs to a Learning Goal: named beside a demonstration it names nothing that could be built.
    if (!goal && named(body.practiceSituationId)) throw new ActivityReviewRequestError('a practice situation is chosen for a Learning Goal, not for a demonstration')
    const subject: ActivitySubject = goal
        ? { kind: 'learning-goal', goalId: String(body.learningGoalId).trim(), situationId: named(body.practiceSituationId) ? String(body.practiceSituationId).trim() : null }
        : { kind: 'mechanism-demonstration', demonstrationId: String(body.demonstrationId).trim() }

    // Throws `UnknownActivityRequest` for an id that names nothing — before the session is looked at, so an
    // unknown goal is never reported as a problem with the coach's session.
    const { kind, title } = describeRequest(subject)

    const envelope = sessionEnvelopeFrom(stored, { durationMin: body.durationMin, roles: body.roles })
    if (envelope.outcome === 'not-stated') {
        return { refusal: { outcome: 'refused', kind, title, stage: 'session', summary: envelope.summary, reasons: envelope.reasons, account: {} } }
    }
    return { ...subject, session: envelope.session }
}

export interface ActivityReviewOptions {
    goals: { id: string; name: string; definition: string; phase: string }[]
    demonstrations: { id: string; name: string; statement: string }[]
    /** The specialized roles the register names — what the page must ask availability for. */
    specializedRoles: string[]
}

/**
 * What a page needs in order to offer the choices: the thirteen Learning Goals, the mechanism
 * demonstrations, and the specialized roles to ask about.
 *
 * Served as the registries hold them and in their order — the goals phase by phase, as the Session Planning
 * Model orders them — because per his Governance Standard the planning model owns coach decisions: nothing
 * here ranks, filters or relabels a goal. The demonstrations are a separate list and stay one, so a page
 * cannot offer one as a goal by accident.
 */
export function activityReviewOptions(): ActivityReviewOptions {
    return {
        goals: sessionPlanningModel.phases().flatMap(phase =>
            (sessionPlanningModel.learningGoalsForPhase(phase) as any[]).map(goal => ({
                id: String(goal['ID']),
                name: String(goal['Learning Goal'] ?? ''),
                definition: String(goal['Coach Definition'] ?? ''),
                phase: String(phase),
            })),
        ),
        demonstrations: MECHANISM_DEMONSTRATIONS.map(({ id, name, statement }) => ({ id, name, statement })),
        specializedRoles: specializedRoleNames(),
    }
}
