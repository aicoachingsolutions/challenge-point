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

/**
 * One span of a consolidated sentence (14 October 2026): its own status, sources and numbers. The account shows
 * each part's status, so a reviewer sees that "2 neutral players" is where this activity starts while "2 teams of
 * 5" follows from it. Never coach-facing on its own.
 */
export interface ReviewInstructionPart {
    text: string
    status: string
    from: string[]
    quantities?: number[]
}

/** One rendered instruction. Only `text` is coach-facing; `status` and `from` belong to the account. */
export interface ReviewInstruction {
    section: string
    text: string
    status: string
    /** Concrete-game property paths that produced the sentence. */
    from: string[]
    quantities?: number[]
    /** `setup` for the starting setup and playing instructions; `adjust` for what a coach may change from there. */
    tier?: 'setup' | 'adjust'
    /** The spans the sentence is made of, where the server sent them. */
    parts?: ReviewInstructionPart[]
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

/** One manipulation the goal's context names, evaluated against the knowledge — as the record holds it. */
export interface ReviewManipulation {
    phrase: string
    phraseFrom: string
    aspect: string | null
    tier: 'CORE' | 'COMMON' | null
    source: string
    registerRows: string[]
    /** A string, not the closed union, so a status the back end adds is shown rather than dropped. */
    status: string
    statusBasis: string
    note: string | null
}

/** A Learning Goal's authorization record (back end: `test-library/learning-goal-authorizations.ts`). */
export interface ReviewAuthorization {
    learningGoalId: string
    contextId: string
    gameProblemId: string
    ruledOn: string
    by: string
    ruling: string[]
    authorizedConstraints: string[]
    authorizedConstraintsFinding: string
    zeroConstraintRuling: { ruledOn: string; by: string; ruling: string } | null
    zeroConstraintRulingPending?: string
    excluded: { knowledgeId: string; title: string; ruledOn: string; by: string; ruling: string; heldBy: string | null }[]
    manipulations: ReviewManipulation[]
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
    /**
     * `fromGoalCandidates`: whether the constraint is one of the goal's own candidates — always true for a goal
     * since 14 October, when selection stopped borrowing from the whole library; null for a demonstration.
     */
    constraints: { id: string; title: string; contracted: boolean; fromGoalCandidates?: boolean | null }[]
    /**
     * What selection drew its constraints from (since 14 October, always the goal's own candidates):
     * `unfilledRoles` are roles no designated candidate fills — knowledge gaps, reported and never filled;
     * `heldByRuling` are candidates his rulings keep out of Learning Goal selection; `gap` is set where the
     * candidates could not be combined at all. Null for a demonstration.
     */
    constraintSource?: {
        source: 'GOAL_CANDIDATES' | 'WHOLE_LIBRARY' | 'AUTHORIZATION_RECORD'
        /**
         * 15 October 2026: `AUTHORIZATION_RECORD` where an owner-ruled record names the goal's constraints;
         * `VOCABULARY_POOL` where they were derived from wording or a Coverage row. Optional: older accounts lack it.
         */
        constraintAuthority?: 'AUTHORIZATION_RECORD' | 'VOCABULARY_POOL'
        zeroConstraintRuling?: { ruledOn: string; by: string } | null
        lensAuthority?: 'ENGINE_LENS'
        unfilledRoles: string[]
        heldByRuling: { id: string; title: string; ruledOn: string }[]
        gap: 'NO_COMPATIBLE_COMBINATION' | 'NO_SELECTABLE_CANDIDATES' | 'NO_LENS_CANDIDATES' | 'NO_GAME_FORM_CANDIDATES' | 'NO_AUTHORIZED_CONSTRAINTS' | null
    } | null
    /**
     * The goal's authorization record as selection used it (15 October 2026) — technical account only. Null for a
     * demonstration and a goal with no record. Optional: older accounts lack it.
     */
    authorization?: ReviewAuthorization | null
    selectedWithoutContract: string[]
    /**
     * True where the goal's Game Problem is unresolved: the activity is provisional and not a completed
     * learning-design example (his ruling of 14 October). Optional because an older account has no such field.
     */
    provisional?: boolean
    provisionalReason?: string | null
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
