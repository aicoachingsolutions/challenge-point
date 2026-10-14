/**
 * The activity review's wire types — a hand-kept copy of the back end's, as ROUTES.ts is of `_endpoints.ts`.
 *
 * Source of truth: `back/src/system/rendering` (the builder's `ServedActivity` / `RefusedActivity` /
 * `ActivityAccount`, and `render-concrete-game.ts` for `RenderedActivity`). Nothing here is computed in
 * the browser: the page shows what the server validated and adds no transformation of its own, which is
 * the same promise the builder makes about itself.
 *
 * Two fields are typed more loosely than the back end declares them, on purpose:
 *   - `Instruction.section` and `Instruction.status` are `string`, not the closed unions. A closed union
 *     here would make a section or status the back end adds later disappear from the page without an
 *     error — the page orders the sections it knows and still shows any it does not.
 *   - `integrity` carries an index signature for the same reason: a check added on the server is shown
 *     in the account rather than dropped by a list of known keys.
 */

/** The session an activity was built for. `roles` is AVAILABILITY in the session, role name -> people. */
export interface ActivitySession {
    players: number
    lengthM: number
    widthM: number
    durationMin: number
    roles: Record<string, number>
}

export type ActivityKind = 'learning-goal' | 'mechanism-demonstration'

export type ActivityStage =
    | 'session'
    | 'selection'
    | 'knowledge'
    | 'structure'
    | 'realization'
    | 'validation'
    | 'communication'

/** One rendered instruction. Only `text` is coach-facing; `status` and `from` belong to the account. */
export interface ReviewInstruction {
    section: string
    text: string
    status: string
    /** Concrete-game property paths that produced the sentence. */
    from: string[]
    quantities?: number[]
}

export interface RenderedActivity {
    instructions: ReviewInstruction[]
    /** Observations about the game a coach would question. Reported, never acted on. */
    coachingObservations?: string[]
    /**
     * The same notes under the name and shape the brief gave the page (`{ text }[]`). The renderer sends
     * `coachingObservations`; this is read only where that is absent, so neither spelling is dropped.
     */
    observations?: (string | { text: string })[]
}

export interface ActivityAccount {
    /** Null for a mechanism demonstration, which is built from no Learning Goal. */
    gameProblem: {
        /** UNRESOLVED means no translation is approved: an open learning-design decision, not a value. */
        status: 'APPROVED' | 'UNRESOLVED'
        gameProblemId: string | null
        name: string | null
        /** What the goal's wording alone implies. NEVER shown as the goal's Game Problem. */
        inferredFromWording: string | null
        /** True where the approved translation replaced the candidates the wording produced. */
        governed: boolean
    } | null
    contextId: string | null
    /**
     * The context, with the scoring condition approved for it and whether this activity carries it. Null for
     * a demonstration. Optional because an account built before 14 October has no such field.
     */
    context?: { id: string; name: string | null; approvedScoringCondition: string | null; inThisActivity: boolean } | null
    gameForm: { id: string; name: string | null; contracted: boolean }
    affordanceLenses: string[]
    /** `fromGoalCandidates`: false is a constraint borrowed from the whole library; null for a demonstration. */
    constraints: { id: string; title: string; contracted: boolean; fromGoalCandidates?: boolean | null }[]
    /** Where selection drew its constraints from, and why the goal's own candidates were set aside if they were. */
    constraintSource?: { source: 'GOAL_CANDIDATES' | 'WHOLE_LIBRARY'; setAsideBecause: 'FEWER_THAN_TWO' | 'NO_FOUNDATION_AND_SHAPING' | null; missingRoles: string[] } | null
    selectedWithoutContract: string[]
}

export interface ActivityIntegrity {
    gateA?: string
    realizationAuthorized?: boolean
    acceptance?: Record<string, unknown[]>
    postRealizationValidated?: boolean
    instructions?: number
    fidelityViolations?: number
    [check: string]: unknown
}

export interface ServedActivity {
    outcome: 'served'
    kind: ActivityKind
    /** The goal's name, or the demonstration's. */
    title: string
    /** The goal's Coach Definition, or the demonstration's statement. */
    subtitle: string | null
    session: ActivitySession
    /** What a coach receives — PRIMARY. */
    rendered: RenderedActivity
    /** How it was arrived at — SECONDARY. */
    account: ActivityAccount
    integrity: ActivityIntegrity
}

export interface RefusedActivity {
    outcome: 'refused'
    kind: ActivityKind
    title: string
    stage: ActivityStage
    /** ONE plain sentence a coach can read. No ids, no check names. */
    summary: string
    /** The engine's own reasons, verbatim, for the secondary panel only. */
    reasons: string[]
    /** Whatever was established before the refusal. */
    account: Partial<ActivityAccount>
}

export type ActivityReviewResult = ServedActivity | RefusedActivity

export interface ReviewGoal {
    id: string
    name: string
    definition: string
    phase: string
}

export interface ReviewDemonstration {
    id: string
    name: string
    statement: string
}

/** `GET {ROUTES.app.checkedActivity}` — what the page offers a coach to choose from. */
export interface ActivityReviewOptions {
    goals: ReviewGoal[]
    demonstrations: ReviewDemonstration[]
    /**
     * The specialized roles the register names. The brief states this list two ways (`string[]` for the
     * page, `{ role }[]` for the route), so both are read; see `roleNames` in ActivityReviewPage.
     */
    specializedRoles: (string | { role: string })[]
}

/** `POST {ROUTES.app.checkedActivity}/:sessionId`. Exactly one of the two ids is sent. */
export interface ActivityReviewRequest {
    learningGoalId?: string
    demonstrationId?: string
    durationMin: number
    /** The coach's statement of availability FOR THIS REVIEW. It overrides the stored value. */
    roles: Record<string, number>
}
