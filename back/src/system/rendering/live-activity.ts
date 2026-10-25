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
import { ProvisionalRealization, provisionalRealizationNamed } from '../derivation/corpus'
import { BoundedSelection, contractCoverage, knowledgeKey } from '../derivation/run-bounded-selection'
import { sessionPlanningModel } from '../session-planning/session-planning-model'
import { guidedGoalText, guidedSelectionHints } from '../sport-module/guided-selection'
import { generateSelection } from '../test-library/generateSelection'
import { learningGoalAuthorizations, LearningGoalAuthorization, realizationAlternativesOf } from '../test-library/learning-goal-authorizations'
import type { TestLibrarySelectionResult } from '../test-library/types'
import { ActivityReviewBody, reviewActivityBuild } from './activity-review'
import type { ActivityBuild, InputDigest, RefusedActivity, ServedActivity } from './build-activity'
import { DraftCoachWording, notCheckedNoticeWording } from './draft-coach-wording'
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

/* ------------------------------------------------------- the status of an activity (the notice) ------------------------------------------------------- */

/**
 * **What a coach is told beside an activity the checked pathway did not build** — the live-app status notice, 25 October 2026. Christian,
 * reply filed 26 October 2026, item 9(a): *"The live application should use checked generation whenever an activity has an evaluated,
 * knowledge-authorized design."* *"Other Learning Goals may continue through their existing pathway during this transitional period, provided
 * their status and limitations are not misrepresented."*
 *
 * Until this, nothing told a coach that an activity of the generation route (written by the model from a game and library constraints the
 * code chose, held only to structural validators, never to the checked chain) is not checked, and nothing told the checked activity apart from
 * it. The notice is the short status (`label`, shown where activities are listed) and the words beside the activity, both DRAFT wording data
 * (`draft-coach-wording.json` notCheckedNotice, validated by its loader): no word of it is written here or in the front, and it is marked DRAFT
 * where it is served. Null where the wording file carries no usable notice.
 */
export interface PathwayNotice {
    label: string
    words: string
    status: 'DRAFT'
}

/** The notice beside an activity the checked pathway did not build, from the wording data, or null where it carries none. */
export function notCheckedNotice(wording?: DraftCoachWording): PathwayNotice | null {
    const entry = notCheckedNoticeWording(wording)
    return entry ? { label: entry.label, words: entry.words, status: 'DRAFT' } : null
}

/**
 * **The notice for a stored activity, by its recorded pathway and nothing else**: none where it records the checked pathway (the save of a
 * checked build records CHECKED_CHAIN, and no update writes the pathway, `editableUpdateOf`), the notice otherwise. A generated activity records
 * no pathway, and neither does any activity saved before this notice, so each is said to be unchecked, which it is. No goal, game or
 * context is read.
 */
export function storedPathwayNotice(activity: { pathway?: unknown } | null | undefined, wording?: DraftCoachWording): PathwayNotice | null {
    return activity?.pathway === CHECKED_CHAIN ? null : notCheckedNotice(wording)
}

/** The fields a read of a stored activity adds and the store never holds: no update writes them (`editableUpdateOf`). */
export const READ_ONLY_FIELDS: readonly string[] = ['pathwayNotice']

/**
 * **A stored activity as a read serves it**: its own fields, less any field only a read adds, with the notice beside them where its recorded
 * pathway is not the checked one (`storedPathwayNotice`). The stored copy is not changed. Used by every route that reads activities.
 */
export function withPathwayNotice(activity: Record<string, unknown>, wording?: DraftCoachWording): Record<string, unknown> {
    const own: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(activity)) if (!READ_ONLY_FIELDS.includes(key)) own[key] = value
    const notice = storedPathwayNotice(activity, wording)
    return notice ? { ...own, pathwayNotice: notice } : own
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

/* ----------------------------------------------------------- disclosure before input (H4) ----------------------------------------------------------- */

/**
 * **What the planning conversation asks that the checked pathway does not read — disclosed BEFORE the coach answers** — H4, 23 October 2026
 * (the d26 design's build step 6, its section 5.3, Option A). Christian, reply filed 26 October 2026, item 9(b): *"Your proposed sentence is
 * acceptable in principle:"* *"The practice situation you chose, where your players are with this learning, and any note you added do not
 * change this activity yet."* *"However, I would prefer coaches to receive that information before investing effort in inputs that are not
 * currently used, where practical."* *"Please keep this disclosure concise and ensure that the application does not imply capabilities that
 * are not yet functional."*
 *
 * The three planning inputs the conversation offers after the goal. Which of them the checked pathway reads is decided from data, below.
 */
export type PlanningInput = 'PRACTICE_SITUATION' | 'LEARNING_STAGE' | 'NOTE'

/**
 * **The field of the checked pathway's inputs each planning input reaches, or null for none.** Typed against `LiveCheckedInputs`, so a field
 * named here exists there: the learning stage and the note reach no field (the live route builds a checked activity from the goal, the
 * situation and the length, and selects a guided goal from the registry's own words, never the coach's), and the situation reaches one. A
 * field added to `LiveCheckedInputs` for the stage or the note is read only once it is named here (a test pins the route's call).
 */
export const PLANNING_INPUT_FIELD: Readonly<Record<PlanningInput, keyof LiveCheckedInputs | null>> = { PRACTICE_SITUATION: 'practiceSituationId', LEARNING_STAGE: null, NOTE: null }

/**
 * **The disclosure line — DRAFT.** His accepted sentence put in the present tense, because it is read before the choices are made (OUR
 * READING, put to him in the note sent to him: *"The disclosure sentence you accepted appears before the inputs, in the present tense"*). Said
 * only where the inputs the checked pathway does not read are exactly the three it names (`names`); otherwise withheld, never composed from
 * fragments. `accepted` is his sentence as he accepted it.
 */
export const INPUT_USE_NOTE = {
    status: 'DRAFT' as const,
    words: 'The practice situation you choose, where your players are with this learning, and any note you add do not change this activity yet.',
    names: ['PRACTICE_SITUATION', 'LEARNING_STAGE', 'NOTE'] as PlanningInput[],
    accepted: { words: UNCONSUMED_INPUTS_NOTE.words, citedAs: 'his reply filed 26 October 2026, item 9(b) ("acceptable in principle")' },
}

/** **The mark on a practice situation the activity does not cover — DRAFT.** The d26 design's section 5.3. */
export const NOT_COVERED_WORDS = 'Not covered by this activity yet.'

/** What a goal's checked pathway reads of the planning inputs, as GET /session-planning surfaces it beside each goal (`inputUse`). */
export interface PlanningInputUse {
    learningGoalId: string
    pathway: LivePathway
    /** The planning inputs the checked pathway does not read, in the conversation's order. */
    unread: PlanningInput[]
    /** The offered practice situations every alternative the goal's record lets the build try was not designed for, in the model's order. */
    notCovered: string[]
    /** The disclosure line, where `unread` is exactly what it names; otherwise null. */
    note: { words: string; status: 'DRAFT' } | null
    /** The mark for a situation in `notCovered`, where there is one; otherwise null. */
    notCoveredWords: string | null
}

/** Tests only: COPIES of the records, the realizations and the contract test, run through the identical computation (the G6 pattern). */
export interface PlanningInputUseOptions {
    records?: LearningGoalAuthorization[]
    realizations?: ProvisionalRealization[]
    contracted?: (knowledgeId: string) => boolean
}

let inputUseMemo: Record<string, PlanningInputUse> | null = null

/**
 * **What each guided goal's checked pathway reads of the planning inputs** — for every goal of the planning model's own registry (no goal id
 * is written here), selected as the live route selects it (`liveSelectionFor`; under COPIES of the records, the same text and hints over
 * them). A goal the route builds by generation, or refuses at selection, gets no entry: generation reads all three inputs, and a refusal is
 * said where it happens (the design's F1, which needs his words). For a goal built by the checked pathway:
 *   - `unread`: the inputs that reach no field (`PLANNING_INPUT_FIELD`); and the practice situation where the goal offers some and none of
 *     those it covers has a contract the derivation loads, since only a contract lets a situation change the game (one without is
 *     recorded and contributes nothing, `selectedWithoutContract`) and one not covered is refused before any game is derived;
 *   - `notCovered`: the offered situations that EVERY alternative the record lets the build try lists as one it was not designed for
 *     (`notWithPracticeSituations`), so a later alternative that covers a situation keeps it available; none where no alternative is
 *     listed;
 *   - `note`: the DRAFT line, only where `unread` is exactly the three inputs it names.
 * The default (the files') is computed once per process.
 */
export function planningInputUse(options: PlanningInputUseOptions = {}): Record<string, PlanningInputUse> {
    const testing = options.records !== undefined || options.realizations !== undefined || options.contracted !== undefined
    if (!testing && inputUseMemo) return JSON.parse(JSON.stringify(inputUseMemo)) as Record<string, PlanningInputUse>
    const records = options.records ?? learningGoalAuthorizations()
    const provisionalIds = options.realizations?.map(realization => realization.provisionalId)
    const resolve = (id: string): ProvisionalRealization | null => (options.realizations ? (options.realizations.find(realization => realization.provisionalId === id) ?? null) : provisionalRealizationNamed(id))
    const contracted = options.contracted ?? ((id: string) => contractCoverage([{ id, role: 'practice situation' }]).contracted.length > 0)
    const use: Record<string, PlanningInputUse> = {}
    for (const goal of sessionPlanningModel.learningGoals() as Record<string, unknown>[]) {
        const learningGoalId = String(goal.ID)
        let selection: TestLibrarySelectionResult
        try {
            if (options.records === undefined && options.realizations === undefined) selection = liveSelectionFor(learningGoalId)
            else {
                const text = guidedGoalText(learningGoalId)
                selection = generateSelection({ learningGoals: [text], learningGoalId }, guidedSelectionHints(learningGoalId, text, records, provisionalIds).hints)
            }
        } catch {
            continue // refused at selection: no disclosure here (the route says so where it refuses)
        }
        if (livePathwayOf(selection) !== CHECKED_CHAIN) continue
        const offered = (sessionPlanningModel.practiceSituationsFor(learningGoalId) as Record<string, unknown>[]).map(situation => String(situation.ID))
        const record = records.find(entry => entry.learningGoalId === learningGoalId) ?? null
        const tried = realizationAlternativesOf(record)
            .filter(alternative => alternative.selectable)
            .map(alternative => resolve(alternative.realization))
        const notFor = tried.map(realization => new Set((realization?.notWithPracticeSituations ?? []).map(situation => situation.id)))
        const notCovered = notFor.length ? offered.filter(id => notFor.every(ids => ids.has(id))) : []
        // A situation not covered is refused before any game is derived, so its contract is never loaded: only a covered situation with a
        // contract can change the game (measured 23 October 2026: one of the record-backed goal's situations has a contract and is the one
        // its activity was not designed for).
        const covered = offered.filter(id => !notCovered.includes(id))
        const unread = (Object.keys(PLANNING_INPUT_FIELD) as PlanningInput[]).filter(input =>
            PLANNING_INPUT_FIELD[input] === null ? true : offered.length > 0 && !covered.some(id => contracted(id)),
        )
        const exactly = unread.length === INPUT_USE_NOTE.names.length && INPUT_USE_NOTE.names.every(input => unread.includes(input))
        use[learningGoalId] = {
            learningGoalId,
            pathway: CHECKED_CHAIN,
            unread,
            notCovered,
            note: exactly ? { words: INPUT_USE_NOTE.words, status: INPUT_USE_NOTE.status } : null,
            notCoveredWords: notCovered.length ? NOT_COVERED_WORDS : null,
        }
    }
    if (!testing) inputUseMemo = use
    return JSON.parse(JSON.stringify(use)) as Record<string, PlanningInputUse>
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
 *
 * The live-app status notice (25 October 2026): nor a key whose first path segment is a field only a read adds (`READ_ONLY_FIELDS`, the
 * notice). The activity review form posts back the activity it read, notice and all; the schema would drop it, and this keeps it so whatever
 * the schema says, since the notice is the server's reading of the recorded pathway and never the client's.
 */
export function editableUpdateOf(body: Record<string, unknown>): Record<string, unknown> {
    const update: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(body)) {
        if (key.startsWith('$')) continue
        if (STORED_BUILD_FIELDS.includes(key.split('.')[0])) continue
        if (READ_ONLY_FIELDS.includes(key.split('.')[0])) continue
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
