/**
 * Build the A04 pilot activity, once, for every caller that needs it.
 *
 * **Why this exists as its own module.** His instruction for the read-only route is that it must
 * *"serve the same validated, rendered activity without introducing unverified transformations"*. Two
 * copies of the pipeline — one in the script, one in the route — is exactly how that promise breaks:
 * they drift, and the thing the route serves stops being the thing the script validated. So the
 * pipeline lives in one place and both call it.
 *
 * **Since 13 October that place is `build-activity`, and this is a thin caller of it.** The pipeline was
 * generalised to any Learning Goal and any stated session, and keeping a second, A04-only copy here would
 * have been the very fork this header warns about. What is left in this file is only what is the pilot's
 * own: which goal, which session, and the shape its route and script have always been given. That shape is
 * unchanged — the same keys in the same order with the same values — and `activity-review.unit.ts` pins
 * that the rendered activity is the one the general builder serves for the same goal and session.
 *
 * **It refuses rather than degrades.** If anything in the chain fails to authorize, fails acceptance,
 * fails a post-realization gate, or renders with a fidelity violation, this returns a refusal naming
 * what failed. Nothing partial is returned for a caller to serve anyway, because his standing
 * instruction is not to *"substitute generic fallback output"* or present an activity that has not
 * passed. A refusal is the honest response to a pilot that is not ready.
 *
 * **It does not touch generation.** Selection, derivation, the gates, realization, rendering and the
 * fidelity check — nothing here calls the frozen activity-generation path.
 */
import { CORPUS_ENVELOPE } from '../derivation/corpus'
import { buildActivityWithSelection } from './build-activity'
import { RenderedActivity } from './render-concrete-game'

export interface PilotSession {
    players: number
    lengthM: number
    widthM: number
    durationMin: number
}

/** The session the pilot runs at: a 4v4 in a tight box. The envelope is session input, not knowledge. */
export const PILOT_SESSION: PilotSession = { players: 8, lengthM: 30, widthM: 25, durationMin: 20 }

export interface PilotActivity {
    goalId: 'A04'
    goalName: string
    session: PilotSession
    rendered: RenderedActivity
    /** How the activity was arrived at — the selection account, so nothing is taken on trust. */
    provenance: {
        resolution: 'matched'
        signalGroup: string
        gameForm: string
        affordanceLenses: string[]
        contracted: string[]
        selectedWithoutContract: string[]
    }
    /** Every check that had to pass before this could be served. */
    integrity: {
        gateA: string
        realizationAuthorized: boolean
        acceptance: { nothingClosedWithoutAuthority: unknown[]; nothingLost: unknown[]; nothingInvented: unknown[] }
        postRealizationValidated: boolean
        instructions: number
        fidelityViolations: number
    }
}

export interface PilotRefused {
    refused: true
    because: string[]
}

export const isPilotRefused = (result: PilotActivity | PilotRefused): result is PilotRefused =>
    (result as PilotRefused).refused === true

export function buildPilotActivity(session: PilotSession = PILOT_SESSION): PilotActivity | PilotRefused {
    /**
     * **The pilot's specialized-role statement is made HERE, where it can be seen.** His ruling of 1 October:
     * *"This is a session fact for this run, not a default assumption."* The pilot states zero for each
     * specialized role the register names — the stage-B envelope's own statement — and it used to do so by
     * inheriting that envelope under the session it was given. The general builder takes a session whole
     * and inherits nothing, so the statement is passed explicitly, and only the pilot makes it.
     */
    const roles: Record<string, number> = JSON.parse(JSON.stringify(CORPUS_ENVELOPE.roles))
    const { activity, selection } = buildActivityWithSelection({ kind: 'learning-goal', goalId: 'A04', situationId: null, session: { ...session, roles } })

    if (activity.outcome === 'refused' || !selection) return { refused: true, because: activity.outcome === 'refused' ? activity.reasons : ['selection did not resolve'] }
    /**
     * **The pilot serves one game; an activity played in role blocks is never served here** (15 October 2026, stage K3). His
     * authorization of this route is *"the narrow, read-only route serving the validated A04 activity"*; a composition of two
     * block games is reviewed through the checked-activity route only, where its blocks and cross-block checks are shown.
     * A04 establishes no role, so this changes nothing it serves; it keeps the route from ever passing on a shape it was
     * not authorized for.
     */
    if (activity.roleBlocks) return { refused: true, because: ['the activity is played in role blocks; the pilot route serves one validated game and no composition of two'] }

    return {
        goalId: 'A04',
        goalName: activity.title,
        session,
        rendered: activity.rendered,
        provenance: {
            // `selectFor` proceeds only where the selection matched, so a served activity is a matched one.
            resolution: 'matched',
            // Read from the run. It was the literal the selection happened to produce on the day it was typed.
            signalGroup: selection.matchedSignalGroups.map(group => group.replace('signalGroup:', '')).join(', '),
            gameForm: activity.account.gameForm.id,
            affordanceLenses: selection.selected.filter(s => s.role.startsWith('affordance lens')).map(s => s.id.replace('tl-v0-lens-', '')),
            contracted: selection.contracted,
            selectedWithoutContract: selection.missing.map(m => m.replace('tl-v0-constraint-', '')),
        },
        integrity: activity.integrity,
    }
}
