/**
 * **The live route's checked pathway** — the live-app fix, 22 October 2026 (design section 4, decision 9(a) of the note sent to Christian).
 *
 * Christian, reply filed 25 October 2026, item 8: *"Separately, we still need to close the gap between the checked review pathway and the
 * live application. The live application's requirement for at least one library constraint remains a pilot blocker and should be
 * corrected systemically, without inserting an unjustified constraint into this activity."*
 *
 * **The choice, read from data and never from a goal.** A selection whose constraints carry an authorization record's authority
 * (`constraintAuthority === 'AUTHORIZATION_RECORD'`, set where the goal's record supplies them) is built on the live route by the SAME
 * checked process the review page runs (`reviewActivityBuild`, which is `buildActivity` with its selection and digests beside it). No
 * library constraint is inserted, no model is called and nothing falls back to free generation: the checked chain's refusal is the
 * answer (G4). Every other selection keeps today's generation, unchanged; each of those carries library constraints, so the generation
 * route's foundation requirement never blocks one of them for lack of one. His general principle (16 October reply, item 1, *"A library
 * constraint is not mandatory unless its inclusion is justified by the approved knowledge and intended learning environment"*) is kept by
 * never handing a selection with no constraint to a route that requires one. Whether this is the systemic correction he wants is his to
 * confirm (decision 9(a), D-L0): the other differences between the generation route and the review page stay open for every goal that has
 * no evaluated record yet, and close only as each gets one.
 *
 * **What the live route then holds the checked build to, before it serves it:**
 *   - G1: the pathway is decided by `livePathwayOf` alone, which reads only the selection trace's constraint authority, so free text can
 *     never reach the checked branch (its hints carry no authority) and no goal, form or context id is read;
 *   - G2: every constraint the checked build serves is one the goal's record authorizes (none, today, for the one goal that has one);
 *   - G3: the live selection and the checked selection agree on the game form, the constraints and the lenses (challenge level takes no
 *     part in selection, `generateSelection.ts`), or nothing is served;
 *   - G4: a refusal of the checked chain is final and is said in the checked chain's own sentence.
 * A disagreement under G2 or G3 is refused with the checked pathway's own validation sentence, so no new sentence reaches a coach.
 *
 * **Saving (L3).** Start Activity sends what the activity was built from and the input digests of what the coach was shown, never the
 * activity itself. `checkedSave` builds it again through the same function and stores the server's own build only where every digest is
 * the one the coach saw; otherwise the coach is asked, in one DRAFT sentence, to build the activity again.
 *
 * Nothing here names a Learning Goal, a game form, a context, a role or a scoring kind.
 */
import { BoundedSelection, knowledgeKey } from '../derivation/run-bounded-selection'
import { guidedGoalText, guidedSelectionHints } from '../sport-module/guided-selection'
import { generateSelection } from '../test-library/generateSelection'
import type { TestLibrarySelectionResult } from '../test-library/types'
import { ActivityReviewBody, reviewActivityBuild } from './activity-review'
import type { ActivityBuild, InputDigest, RefusedActivity, ServedActivity } from './build-activity'
import type { StoredSession } from './session-envelope'

/** Which pathway the live route builds a selection by. */
export type LivePathway = 'CHECKED_CHAIN' | 'GENERATION'
export const CHECKED_CHAIN: LivePathway = 'CHECKED_CHAIN'

/**
 * **G1: the pathway, from the selection trace's constraint authority and nothing else.** `AUTHORIZATION_RECORD` exactly where the goal's
 * authorization record supplied the candidates (`guidedSelectionHints` -> `constraintPoolFor`); a record not yet evaluated never gets here,
 * because selection refuses it as a knowledge gap first, which the live route answers as before.
 */
export function livePathwayOf(selection: Pick<TestLibrarySelectionResult, 'selectionTrace'>): LivePathway {
    return selection.selectionTrace?.constraintPool?.constraintAuthority === 'AUTHORIZATION_RECORD' ? CHECKED_CHAIN : 'GENERATION'
}

/** What the live route builds a checked activity from: the guided goal, the situation the coach chose, and the activity's length. */
export interface LiveCheckedInputs {
    learningGoalId: string
    practiceSituationId: string | null
    durationMin: unknown
}

/** Why a checked build was not served: its own refusal (G4), or a disagreement the live route found (G2, G3). */
export type LiveRefusalCause = 'CHECKED_REFUSAL' | 'SELECTIONS_DISAGREE' | 'CONSTRAINT_NOT_AUTHORIZED'

export type LiveCheckedOutcome =
    | { outcome: 'served'; activity: ServedActivity; inputDigests: InputDigest[] }
    | { outcome: 'refused'; activity: RefusedActivity; cause: LiveRefusalCause }

/**
 * The checked pathway's own sentence for a game that did not pass its checks (`build-activity.ts`, the validation refusal), reused for a
 * disagreement under G2 or G3 so that no new coach sentence is served. DRAFT, as it is there.
 */
const NOT_PASSED = 'The game built for this activity did not pass its own checks, so it is not being shown.'

/**
 * **The checked build of a record-backed selection, held to G2-G4.** `build` is the review build for the coach whose session it is
 * (`reviewActivityBuild`); a parameter only so a test can run the identical pathway over COPIES of the authorization records
 * (`buildActivityUnderAuthorizationRecords`). The live route and the save call it with the default.
 */
export function liveCheckedActivity(
    stored: StoredSession,
    inputs: LiveCheckedInputs,
    live: TestLibrarySelectionResult,
    build: (body: ActivityReviewBody) => ActivityBuild = body => reviewActivityBuild(stored, body),
): LiveCheckedOutcome {
    const built = build({ learningGoalId: inputs.learningGoalId, practiceSituationId: inputs.practiceSituationId, durationMin: inputs.durationMin })
    // G4: the checked chain's refusal is the answer, exactly as the review page gives it.
    if (built.activity.outcome === 'refused') return { outcome: 'refused', activity: built.activity, cause: 'CHECKED_REFUSAL' }
    const served = built.activity
    const refuse = (cause: LiveRefusalCause, reasons: string[]): LiveCheckedOutcome => ({
        outcome: 'refused',
        cause,
        activity: { outcome: 'refused', kind: served.kind, title: served.title, stage: 'validation', summary: NOT_PASSED, reasons, account: served.account },
    })
    if (!built.selection) return refuse('SELECTIONS_DISAGREE', ['the checked build served an activity with no Learning Goal selection beside it'])
    const disagreements = selectionDisagreements(live, built.selection)
    if (disagreements.length) return refuse('SELECTIONS_DISAGREE', disagreements.map(what => `the live and checked selections disagree: ${what}`))
    const unauthorized = unauthorizedConstraints(served, built.selection)
    if (unauthorized.length) return refuse('CONSTRAINT_NOT_AUTHORIZED', unauthorized)
    return { outcome: 'served', activity: served, inputDigests: built.inputDigests.map(entry => ({ ...entry })) }
}

/**
 * **G3: where the two selections differ, one line per dimension**, empty where they agree. The checked selection's entries are read by the
 * roles `build-activity.ts` reads them by (`game form`; a role naming a constraint; a role opening `affordance lens`); every id is compared
 * by knowledge key, the key derivation loads a contract by, so two spellings of one object are one object.
 */
export function selectionDisagreements(live: TestLibrarySelectionResult, checked: BoundedSelection): string[] {
    const keys = (ids: string[]) => [...new Set(ids.map(id => knowledgeKey(id)))].sort()
    const checkedIds = (keep: (role: string) => boolean) => keys(checked.selected.filter(entry => keep(entry.role)).map(entry => entry.id))
    const dimensions: [string, string[], string[]][] = [
        ['game form', keys([String(live.archetype.game_form_id)]), checkedIds(role => role === 'game form')],
        ['constraints', keys(live.constraints.map(constraint => constraint.id)), checkedIds(role => role.includes('constraint'))],
        ['lenses', keys(live.affordanceLenses.map(lens => lens.id)), checkedIds(role => role.startsWith('affordance lens'))],
    ]
    return dimensions
        .filter(([, a, b]) => JSON.stringify(a) !== JSON.stringify(b))
        .map(([what, a, b]) => `${what}: live [${a.join(', ')}], checked [${b.join(', ')}]`)
}

/**
 * **The live route's answer to a refused checked build** — `{ error, resolutionStatus: 'refused' }` with the checked chain's own sentence, as
 * since the live-app fix, and (stage E, 23 October 2026) the build's question beside it where the build stopped to ask one
 * (`RefusedActivity.question`: the session's objects of a kind the activity needs and the session has not stated). The design's Stage E:
 * *"NOT_STATED reaches the coach as a question through both the review route and the live route."* `debug` adds the stage and reasons as
 * before. Every refusal without a question answers exactly what it did.
 */
export function liveRefusalBody(activity: RefusedActivity, debug: Record<string, unknown> | null): Record<string, unknown> {
    return {
        error: activity.summary,
        resolutionStatus: 'refused',
        ...(activity.question ? { question: { ...activity.question } } : {}),
        ...(debug ?? {}),
    }
}

/** **G2: each constraint the checked build serves that its goal's record does not authorize**, as a reason; empty where all are authorized. */
export function unauthorizedConstraints(served: ServedActivity, checked: BoundedSelection): string[] {
    const record = checked.authorization
    if (!record) return ['the checked selection carries no authorization record, though the live selection drew its constraints from one']
    const authorized = new Set((record.authorizedConstraints ?? []).map(id => knowledgeKey(id)))
    return (served.account.constraints ?? [])
        .filter(constraint => !authorized.has(knowledgeKey(constraint.id)))
        .map(constraint => `${constraint.id} is served, and the authorization record of ${record.learningGoalId} does not authorize it`)
}

/**
 * **The live route's selection for a guided goal**, made as the route makes it: the goal's own registry words, the hints
 * `guidedSelectionHints` gives every pathway (approved Game Problem, then the record's constraints, then the context's game forms), and
 * the goal's id. Challenge level is passed through and takes no part in selection. Used by the save, which must build exactly what the
 * route built; the route itself keeps its own call, so the generation pathway is unchanged.
 */
export function liveSelectionFor(learningGoalId: string, challengeLevel?: string): TestLibrarySelectionResult {
    const text = guidedGoalText(learningGoalId)
    return generateSelection({ learningGoals: [text], challengeLevel, learningGoalId }, guidedSelectionHints(learningGoalId, text).hints)
}

/**
 * **One sentence the coach would read beside a checked activity — DRAFT, NOT SERVED** (decision 9(b) of the note sent to Christian on
 * 22 October 2026). The checked chain does not consume the practice situation's wording, the learning stage or the coach's note (a
 * situation with no contract changes no game; the stage and the note reach only the generation route). *"Unless you object, (a) goes ahead;
 * until you approve (b), live shows exactly what the review page shows."* So the flag stays off until he approves the sentence, and while it
 * is off nothing is served; a test pins that.
 */
export const UNCONSUMED_INPUTS_NOTE = {
    status: 'DRAFT' as const,
    approved: false,
    words: 'The practice situation you chose, where your players are with this learning, and any note you added do not change this activity yet.',
}

/** The note for a checked activity built from these planning choices, or null: always null while it is not approved. */
export function unconsumedInputsNote(planning: { practiceSituationId?: unknown; learningStage?: unknown } | null | undefined): string | null {
    if (!UNCONSUMED_INPUTS_NOTE.approved) return null
    return planning && (planning.practiceSituationId || planning.learningStage) ? UNCONSUMED_INPUTS_NOTE.words : null
}

/* ------------------------------------------------------------------ saving (L3) ------------------------------------------------------------------ */

/** A save request that names nothing that could be built. Answered as a malformed request, never as a refusal of an activity. */
export class CheckedSaveRequestError extends Error {}

/** The fields of a stored activity that hold the server's checked build: what it is, what it was built from, its digests, its pathway. */
export const STORED_BUILD_FIELDS: readonly string[] = ['checkedActivity', 'checkedInputs', 'inputDigests', 'pathway']

/**
 * **What a coach's edit of a stored activity may write** (L3 hardening, stage A re-review, 23 October 2026). A stored checked build is the
 * server's: no update replaces it, what it was built from, or its pathway. Until this the edit route removed only the four top-level keys
 * and handed the rest of the body to Mongo, so the same fields could still be written under a spelling Mongo applies: an update operator
 * (`$set: { checkedActivity: ... }`) or a dotted path (`checkedActivity.rendered`, the build being a Mixed path). Now the update keeps every
 * key except an update operator (any key beginning `$`: the edit route writes a document, never an operator, and no client sends one) and
 * any key whose first path segment is a stored-build field. Every other key passes exactly as before. Ownership is still not checked on this
 * route, as recorded.
 */
export function editableUpdateOf(body: Record<string, unknown>): Record<string, unknown> {
    const update: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(body)) {
        if (key.startsWith('$')) continue
        if (STORED_BUILD_FIELDS.includes(key.split('.')[0])) continue
        update[key] = value
    }
    return update
}

/**
 * The stage an unexpected failure of the checked pathway is recorded at (stage A re-review, 23 October 2026). The live route's outer handler
 * recorded every exception it caught as `ai-assembly`, a stage of the generation route; the checked pathway calls no model, so a failure
 * there is recorded under its own stage, with its pathway. It still never falls back to generation.
 */
export const CHECKED_PATHWAY_FAILURE_STAGE = 'checked-pathway'

/**
 * The coach's sentence when the activity cannot be saved as it was shown — DRAFT. Said when building it again now refuses, and when any
 * input digest differs from the one the coach saw (the session's availability changed in between, say, or the knowledge did).
 */
export const SAVE_NOT_AS_SHOWN = 'This activity has changed since it was shown, so it was not saved. Please build the activity again.'

/** What a checked activity was built from, as stored beside it. */
export interface CheckedInputs {
    learningGoalId: string
    practiceSituationId: string | null
    durationMin: number
}

export type CheckedSave =
    | { outcome: 'saved'; activity: ServedActivity; inputs: CheckedInputs; inputDigests: InputDigest[] }
    | { outcome: 'refused'; summary: string; reasons: string[] }

const named = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0

/** The digests a save request says the coach was shown, or null where they are not a list of named blocks with named digests. */
function statedDigests(value: unknown): InputDigest[] | null {
    if (!Array.isArray(value) || !value.length) return null
    const digests = value.map(entry => (entry && typeof entry === 'object' ? (entry as Record<string, unknown>) : {}))
    if (!digests.every(entry => named(entry.blockId) && named(entry.inputDigest))) return null
    return digests.map(entry => ({ blockId: String(entry.blockId), inputDigest: String(entry.inputDigest) }))
}

/**
 * **Build the activity again and keep the server's own build, only where it is the one the coach was shown** (L3). The rebuild is the live
 * route's, step for step: the guided selection (`liveSelectionFor`), the pathway (G1), and `liveCheckedActivity` (G2-G4). It is stored only
 * where the rebuild serves and every block's input digest equals the one the request states, in the same blocks and order; anything else
 * is refused with `SAVE_NOT_AS_SHOWN`, the reasons naming what differed. The client's copy of the activity is never read.
 *
 * `select` and `build` are the live route's own, parameters only so a test can run the identical save over COPIES of the records.
 */
export function checkedSave(
    stored: StoredSession,
    body: Record<string, unknown>,
    select: (learningGoalId: string, challengeLevel?: string) => TestLibrarySelectionResult = liveSelectionFor,
    build?: (body: ActivityReviewBody) => ActivityBuild,
): CheckedSave {
    const inputs = body.checkedInputs && typeof body.checkedInputs === 'object' ? (body.checkedInputs as Record<string, unknown>) : null
    if (!inputs || !named(inputs.learningGoalId)) throw new CheckedSaveRequestError('a checked save names the Learning Goal it was built for (checkedInputs.learningGoalId)')
    const shown = statedDigests(body.inputDigests)
    if (!shown) throw new CheckedSaveRequestError('a checked save states the input digest of each block the coach was shown (inputDigests)')
    const learningGoalId = String(inputs.learningGoalId).trim()
    const practiceSituationId = named(inputs.practiceSituationId) ? String(inputs.practiceSituationId).trim() : null
    const refused = (reasons: string[]): CheckedSave => ({ outcome: 'refused', summary: SAVE_NOT_AS_SHOWN, reasons })

    let live: TestLibrarySelectionResult
    try {
        live = select(learningGoalId, typeof body.challengeLevel === 'string' ? body.challengeLevel : undefined)
    } catch (error) {
        return refused([`the selection now refuses: ${error instanceof Error ? error.message : String(error)}`])
    }
    if (livePathwayOf(live) !== CHECKED_CHAIN) return refused([`${learningGoalId} is no longer built by the checked pathway on the live route`])
    const outcome = liveCheckedActivity(stored, { learningGoalId, practiceSituationId, durationMin: inputs.durationMin }, live, build)
    if (outcome.outcome === 'refused') return refused([`building it again now refuses (${outcome.cause}): ${outcome.activity.summary}`, ...outcome.activity.reasons])
    const now = outcome.inputDigests
    const same = now.length === shown.length && now.every((entry, at) => entry.blockId === shown[at].blockId && entry.inputDigest !== null && entry.inputDigest === shown[at].inputDigest)
    if (!same) {
        return refused([`the input digests differ: shown ${shown.map(entry => `${entry.blockId}=${entry.inputDigest}`).join(', ')}; built now ${now.map(entry => `${entry.blockId}=${entry.inputDigest ?? 'none'}`).join(', ')}`])
    }
    return { outcome: 'saved', activity: outcome.activity, inputs: { learningGoalId, practiceSituationId, durationMin: outcome.activity.session.durationMin }, inputDigests: now }
}
