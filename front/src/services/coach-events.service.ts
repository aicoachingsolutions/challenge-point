/**
 * Client-side pilot evidence.
 *
 * WHY THIS EXISTS AT ALL. Every other usage event in Challenge Point fires server-side, which means
 * it requires a COMPLETED request. So the database records what coaches did and never where they
 * stopped: a coach who opens planning and leaves at step two produces nothing, indistinguishable
 * from a coach who never opened the app.
 *
 * Everything that leaves a record can be re-derived later. Everything that produces silence is gone
 * the moment the tab closes. This file collects only the silent things — it is deliberately not a
 * general analytics layer, because the argument for it is scarcity of a specific kind of evidence
 * rather than a wish for more data.
 *
 * NEVER BLOCKS, NEVER THROWS, NEVER SURFACES. A coach mid-session must not see a telemetry error,
 * and a slow beacon must not delay a screen. Failures are swallowed on purpose: losing one event is
 * a smaller cost than interrupting the thing we are trying to observe.
 */
import ROUTES from '@/ROUTES'
import { api } from '@/services/api.service'

export type CoachEventName =
    /** Planning conversation opened. The denominator for every abandonment figure. */
    | 'planning_started'
    /** Coach left planning without generating. Carries the step they reached. */
    | 'planning_abandoned'
    /** Generated activities were shown to the coach. */
    | 'activities_viewed'
    /** Coach opened the full detail of an activity rather than only its summary. */
    | 'activity_details_expanded'
    /**
     * Coach committed to running THIS activity, and which of the three it was.
     *
     * Deliberately not the same as opening it — `activities_viewed` already covers that, and a coach
     * reads all three. Selection is the moment they choose one, so it fires from Start Activity.
     *
     * The slot is why this matters beyond its own count. The pilot has to decide whether coaches
     * read the three generated activities as genuine alternatives or as the same activity three
     * times, and no question we can ask answers that as honestly as which one they took to the
     * field. Concentration on slot 1 means they took the first thing offered.
     */
    | 'activity_selected'
    /** Session marked complete. Separates "generated some activities" from "ran a practice". */
    | 'session_completed'

export function recordCoachEvent(name: CoachEventName, payload: Record<string, unknown> = {}): void {
    // Fire-and-forget. No await anywhere in the call chain, and errors are absorbed.
    void api(`${ROUTES.app.coachEvent}`, { name, payload }).catch(() => undefined)
}

/**
 * Answer to the pilot's most important question.
 *
 * Christian named "would you use Challenge Point for your next practice?" as the single most
 * valuable thing the pilot could learn, and it is the one thing no instrumentation can infer — it
 * has to be asked. Kept separate from the generic event so it cannot be lost among them.
 */
export function recordWouldUseAgain(answer: 'yes' | 'no' | 'unsure', comment?: string): void {
    void api('app/would-use-again', { answer, comment }).catch(() => undefined)
}
