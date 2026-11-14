/** Types mirror CSV header rows under `back/src/system/test-library/csv/`. */

export interface TestLibraryV0AffordanceLens {
    /** Stable id derived from title (tl-v0-lens-*) */
    id: string
    title: string
    description: string
    type: string
    affordanceTagGroup: string
    notes: string
    contextualAudit: string
    suggestedConstraintPrompt: string
    category: string
    gameTemplateAnchor: string[]
    designIntent: string
    constraintSupport: string[]
    exampleConsequencePatterns: string[]
    visibilityTriggers: string[]
    logicUsageNote: string
    /**
     * Optional list of coach-language synonyms / common phrases that should match this lens during
     * selection scoring. Bridges the gap between formal library text and natural coach vocabulary.
     * Example: Line-Breaking Opportunity might include ["penetrating pass", "split defenders",
     * "between the lines", "third-man run", "line-breaking"]. Selection adds these to the searchable
     * text for the entry.
     */
    coachVocabulary?: string[]
}

export interface TestLibraryV0Constraint {
    /** Stable id derived from title (tl-v0-constraint-*) */
    id: string
    title: string
    description: string
    type: string
    affordanceTagGroup: string
    notes: string
    contextualAudit: string
    suggestedConstraintPrompt: string
    category: string
    gameTemplateAnchor: string[]
    designIntent: string
    constraintArchetype: string
    constraintRole: string
    primaryConstraintType: string
    includesIncentiveLayer: boolean
    incentiveMechanism: string
    /**
     * Authored coach-facing phrasing for the incentive, from the realizations sheet's
     * `incentive_patterns` column. Preferred over anything expressIncentive derives — a coach's own
     * wording beats a template every time. Empty on every row today.
     */
    exampleIncentivePatterns?: string[]
    visibilityEffect: string
    targetAffordancePrimary: string
    logicUsageNote: string
    /** See TestLibraryV0AffordanceLens.coachVocabulary. */
    coachVocabulary?: string[]
    /**
     * Optional setup-specific parameters this entry implies (field zones, time windows, numerical
     * structures, equipment specifics, etc.). Surfaces in the AI prompt's setupFrame so the
     * generated activity setup includes concrete coaching parameters rather than generic
     * "marking cones if needed" placeholder text. One string per parameter; brief, imperative.
     */
    setupGuidance?: string[]
    /**
     * Concrete environmental REALIZATIONS of an information mechanic (Round 8D.3) — distinct ways the
     * mechanic can actually be built into the environment (e.g. "the live target switches after the
     * first penetrating pass"), NOT prescribed player behaviors. The assembly directive presents these
     * as a "pick one and build the activity around it" menu so the AI instantiates the information
     * problem instead of merely describing it. Used by information constraints.
     */
    environmentalRealizations?: string[]
}

export interface TestLibraryV0Archetype {
    /** Stable id — same as game_form_id */
    id: string
    game_form_id: string
    game_form_name: string
    objective: string
    interaction_structure: string
    directionality_type: string
    phase_of_play: string
    player_structure_logic: string
    typical_affordances: string[]
    recommended_constraint_types: string[]
    representative_design_notes: string
    primaryAffordances: string[]
    secondaryAffordances: string[]
    constraintFit_structural: string
    constraintFit_shaping: string
    constraintFit_consequence: string
    recommendedConstraintTypes: string[]
    exampleConstraintPatterns: string[]
    exampleIncentivePatterns: string[]
    logicUsageNote: string
    /** See TestLibraryV0AffordanceLens.coachVocabulary. */
    coachVocabulary?: string[]
    /**
     * Optional setup-specific parameters this entry implies (field zones, time windows, numerical
     * structures, equipment specifics, etc.). Surfaces in the AI prompt's setupFrame so the
     * generated activity setup includes concrete coaching parameters rather than generic
     * "marking cones if needed" placeholder text. One string per parameter; brief, imperative.
     */
    setupGuidance?: string[]
}

export interface TestLibrarySelectionInput {
    learningGoals: string[]
    /**
     * Set only by the guided planning conversation. This is an id, not coach text; it is carried
     * for context routing traceability and must not influence selection yet.
     */
    learningGoalId?: string
    sport?: string
    sessionDescription?: string
    challengeLevel?: string
}

export type ConstraintBalanceBucket = 'foundation' | 'shaping' | 'consequence'

/**
 * What selection drew its constraints from, without the constraint objects — ids, roles and rulings only, so
 * it can travel in the selection trace and every reader READS what selection used instead of recomputing it.
 * Computed in one place, `constraintPoolFor`; see it for the rule.
 */
export interface ConstraintPoolAccount {
    /**
     * `GOAL_CANDIDATES` for a Learning Goal, always since 14 October; `WHOLE_LIBRARY` only for free text.
     * `AUTHORIZATION_RECORD` since 15 October 2026 for a goal whose constraints come from his authorization record
     * (`learning-goal-authorizations.json`) instead of a vocabulary-derived pool.
     */
    source: 'GOAL_CANDIDATES' | 'WHOLE_LIBRARY' | 'AUTHORIZATION_RECORD'
    /**
     * Whose authority the candidate constraints carry (15 October 2026). `AUTHORIZATION_RECORD`: an owner-ruled
     * record names them. `VOCABULARY_POOL`: they were derived from wording or from a Game Problem's Coverage row —
     * both parser-derived, and not authorized in his sense of 15 October item 1.
     */
    constraintAuthority: ConstraintAuthority
    /**
     * His general principle (16 October reply, item 1 — *"A library constraint is not mandatory unless its inclusion is
     * justified by the approved knowledge and intended learning environment"*) where the record has EVALUATED its
     * authorized set, so the set is read under it: an empty one then commits no library constraint. Null for a
     * vocabulary pool, free text, and a record not yet evaluated. Replaced the per-record `zeroConstraintRuling` on
     * 15 October 2026: the principle is recorded once and names no goal.
     */
    constraintPrinciple: { ruledOn: string; by: string } | null
    /** FREE TEXT ONLY: why the wording's candidates were set aside for the whole library. Null otherwise. */
    setAsideBecause: 'FEWER_THAN_TWO' | 'NO_FOUNDATION_AND_SHAPING' | null
    /** FREE TEXT ONLY: the roles the wording's candidates could not fill, where that is why they were set aside. */
    missingRoles: ConstraintBalanceBucket[]
    /** The candidate ids as stated — a held candidate stays listed here. */
    candidateIds: string[]
    /** Candidates left out of a Learning Goal's selection by an owner ruling, with the ruling. */
    heldByRuling: { id: string; ruledOn: string; ruling: string }[]
    /**
     * LEARNING GOALS: the roles no unheld, selectable candidate fills. Each is a knowledge gap, reported and
     * never filled from elsewhere (his ruling of 14 October). Empty for free text.
     */
    unfilledRoles: ConstraintBalanceBucket[]
    /**
     * **The kind of set the authorization record declares, with the source words that establish it** (13 November 2026,
     * `AuthorizedSetKindDeclaration`). Present only where the pool is an authorization record's set that names a constraint;
     * absent for an empty set, a set not yet evaluated, a vocabulary pool and free text, so every account made before this
     * field existed reads exactly as it did.
     */
    constraintSetKind?: AuthorizedSetKindDeclaration
}

export type ConstraintAuthority = 'AUTHORIZATION_RECORD' | 'VOCABULARY_POOL'

/**
 * **The kind of set an authorization record names** (13 November 2026). Christian, received 13 November 2026, heading 8: "Where a source
 * authorizes a jointly required set, it should be taken whole or refused. However, eligibility among several alternatives does not require
 * all of them to be applied." And: "Please preserve the source authority behind those distinctions rather than assuming every
 * authorization record necessarily represents the same kind of set."
 *   - `JOINTLY_REQUIRED`: the set is taken whole or refused, never reduced (`generateSelection`, as since 12 November 2026);
 *   - `ELIGIBLE_ALTERNATIVES`: selection may apply fewer of its members, never a constraint outside it, and each member not applied is
 *     recorded with the existing rule that left it out (`constraintsNotApplied`, `authorizedSetNotCommitted`).
 * A record that names a constraint declares one of the two with the source's words (`AuthorizedSetKindDeclaration`), or is refused at load
 * as a knowledge gap for Christian: no kind is ever assumed (`validateLearningGoalAuthorizations`). An empty set needs none.
 */
export const AUTHORIZED_SET_KINDS = ['JOINTLY_REQUIRED', 'ELIGIBLE_ALTERNATIVES'] as const
export type AuthorizedSetKind = (typeof AUTHORIZED_SET_KINDS)[number]

/** A record's declared kind of set: the kind, the source's words that establish it, verbatim, and where they are. */
export interface AuthorizedSetKindDeclaration {
    kind: AuthorizedSetKind
    words: string
    citedAs: string
}

/**
 * **Whether a value is a declaration selection may read** (13 November 2026): one of the two kinds, with the source's words and where
 * they are, each a non-empty string. The record gate (`validateLearningGoalAuthorizations`) and the selector's pool (`constraintPoolFor`)
 * both ask this one question, so a record the gate admits is exactly a record the selector reads.
 */
export const isAuthorizedSetKindDeclaration = (value: unknown): value is AuthorizedSetKindDeclaration => {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return false
    const declaration = value as Record<string, unknown>
    const said = (text: unknown) => typeof text === 'string' && text.trim().length > 0
    return (AUTHORIZED_SET_KINDS as readonly unknown[]).includes(declaration.kind) && said(declaration.words) && said(declaration.citedAs)
}

/**
 * **Which existing step of the selector left a member of an ELIGIBLE_ALTERNATIVES set out of the committed combination** (13 November
 * 2026). Read on the lenses the selector committed, and never a new rule: each names a step that ran before this record existed. Each
 * step is true on the committed lenses only: on another lens combination the bounded candidates and the admitted combinations can differ,
 * so a member recorded here may have been a candidate there, or in a combination admitted there (measured 13 November 2026, the VSK
 * verification, F1: a TEST-ONLY copy of A01's record over all 21 usable constraints records `wide-utilization-bonus` as
 * `NOT_AMONG_TWO_PER_ROLE` on the committed lens triple; on the pair possession-stability and space-creation it is in the combination that
 * pair commits).
 *   - `NOT_AMONG_TWO_PER_ROLE`: on the committed lenses the bounded search keeps the two highest-scoring members of each role
 *     (`boundedConstraintCandidates`), and this member was not one of them, so no combination on the committed lenses held it; on another
 *     lens combination it may have been a candidate (Christian's finding kept for later, received 13 November 2026, heading 8: "The
 *     two-per-role candidate cutoff may exclude alternatives before they are fully recorded."; the cut is unchanged);
 *   - `IN_NO_ADMITTED_COMBINATION`: among the bounded candidates on the committed lenses, and no combination on those lenses holding it
 *     passed the size rule, the role mix and the package checks; on another lens combination one may have (measured and pinned in
 *     live-selection-records.unit.ts T7, 'the lens reading');
 *   - `ANOTHER_COMBINATION_COMMITTED`: an admitted combination on the committed lenses holds it, and the selector committed another
 *     (`commitDesignChoice`: the highest total, ties broken by the combination's key).
 */
export type AuthorizedMemberNotCommittedRule = 'NOT_AMONG_TWO_PER_ROLE' | 'IN_NO_ADMITTED_COMBINATION' | 'ANOTHER_COMBINATION_COMMITTED'

/** A member of an ELIGIBLE_ALTERNATIVES set the selector did not commit: never applied, and recorded rather than dropped silently. */
export interface AuthorizedMemberNotCommitted {
    id: string
    title: string
    role: ConstraintBalanceBucket
    rule: AuthorizedMemberNotCommittedRule
}

/**
 * **Which existing rule of the constraint package left a committed constraint out of it** (12 November 2026, Christian's item 4). The
 * package (`buildConstraintPackage`, unchanged) holds at most one member per role and keeps a consequence only where it scores above 12, so
 * a committed combination can hold members the package never holds: they are never validated and never reach the activity. Each such member
 * is recorded with the rule that left it out, read from the package itself, never a new rule:
 *   - `ONE_MEMBER_PER_ROLE`: the package holds another member of the same role (`kept`), chosen by the package's own scoring;
 *   - `CONSEQUENCE_SCORE_AT_OR_BELOW_12`: a consequence member, and the package holds no consequence, because none scores above 12;
 *   - `NO_ROLE_MATCH`: a shaping member, and the package holds no shaping member, because its role scoring admits none for this game form
 *     and these lenses. (A foundation member always has a kept one: a package without a foundation is refused before any commit.)
 */
export type ConstraintNotAppliedRule = 'ONE_MEMBER_PER_ROLE' | 'CONSEQUENCE_SCORE_AT_OR_BELOW_12' | 'NO_ROLE_MATCH'

/** A committed constraint the package does not hold: never validated, never in the activity, and recorded rather than dropped silently. */
export interface ConstraintNotApplied {
    id: string
    title: string
    role: ConstraintBalanceBucket
    rule: ConstraintNotAppliedRule
    /** The member of the same role the package holds instead, or null where it holds none of that role. */
    kept: { id: string; title: string } | null
}

/**
 * What the hints say about where a guided goal's candidate constraints came from (15 October 2026). Set only by
 * `guidedSelectionHints`, and only for a goal with an authorization record; absent means the vocabulary pool.
 */
export interface ConstraintAuthorityHint {
    authority: 'AUTHORIZATION_RECORD'
    learningGoalId: string
    /**
     * The general principle the record's EVALUATED authorized set is read under, or null where the record has not
     * evaluated it yet (`authorizedConstraints: null`). Never per goal: it is the one recorded principle.
     */
    constraintPrinciple: { ruledOn: string; by: string; principle: string } | null
    /**
     * The kind of set the record declares, with its source words (13 November 2026): present only where the record names a constraint.
     * Hints whose record names a constraint and carry no declaration are refused by `constraintPoolFor`: no kind is assumed.
     */
    setKind?: AuthorizedSetKindDeclaration
}

export interface SelectionReasonEntry {
    id: string
    score: number
    reasons: string[]
}

/**
 * One candidate in a "why it won" ranking. The engine already scores every candidate during
 * selection and keeps only the winner; this surfaces the discarded scores for the debug view.
 * `selected` marks whether the candidate ended up in the final activity (since 12 November 2026 a constraint is `selected` only where
 * it is applied, a member of the package: a committed member the package does not hold is in `constraintsNotApplied`, not here).
 */
export interface SelectionRankingEntry {
    id: string
    name: string
    score: number
    reasons: string[]
    /** True when this candidate was chosen for the final activity. */
    selected: boolean
    /**
     * True when routing left this candidate in the eligible pool. A high score with `eligible: false`
     * means the parser routed a relevant candidate OUT — i.e. a routing gap, not a coverage gap.
     */
    eligible: boolean
}

/**
 * How well the coach's input resolved to an intent-aligned candidate pool before selection.
 * Realizes the Deterministic Design Logic traceability requirement (Batch 2): a commitment made
 * from a generic/unnarrowed pool must be distinguishable from an intent-matched one, not silent.
 * - matched    — at least one specific signal group fired; intent resolved.
 * - fallback   — only the generic soccer default (Z_soccer_general) fired; a sensible package was
 *                committed, but coach intent was NOT specifically resolved.
 * - unresolved — no signal group fired; selection scored against the full unfiltered library. The
 *                deterministic "defined failure state": a commitment is still produced, but it is
 *                not traceable to resolved intent — treat as low confidence.
 */
export type SelectionResolutionStatus = 'matched' | 'fallback' | 'unresolved'

export interface SelectionResolution {
    status: SelectionResolutionStatus
    /** Human-readable explanation naming what did or did not resolve (traceability). */
    reason: string
    /** The signalGroup:* signals that drove resolution (empty when unresolved). */
    matchedSignalGroups: string[]
}

export interface TestLibrarySelectionResult {
    archetype: TestLibraryV0Archetype
    affordanceLenses: TestLibraryV0AffordanceLens[]
    /**
     * **The constraints selected for application: the package's members** (12 November 2026, Christian's item 4: the records distinguish
     * "Constraints considered or eligible." "Constraints actually selected for application." "Constraints validated." "Constraints included
     * in the final activity."). Each is validated (the package check runs on exactly these) and, on the generation route, included. Until
     * 12 November 2026 this was the committed combination (`selectionTrace.committedConstraints`), which can hold members the package does
     * not: those are recorded in `selectionTrace.constraintsNotApplied`, never here. Every reader (the usage record, the debug trace, the
     * review account, derivation's input, the live route's G3) reads this one field.
     */
    constraints: TestLibraryV0Constraint[]
    /** Explicit, inspectable resolution status — see SelectionResolution. */
    resolution: SelectionResolution
    selectionTrace: {
        queryCorpus: string
        planning?: {
            learningGoalId: string
            /** Session Planning Model "RPC Routing" for this goal. Trace only - no selection influence yet. */
            routedRpcId: string | null
        }
        /** The pool selection drew its constraints from (`constraintPoolFor`), ids only. */
        constraintPool?: ConstraintPoolAccount
        /**
         * What the selected lenses are (15 October 2026): the engine's own reasoning dimension, never an
         * authorized affordance target — he deferred mapping affordance targets to runtime ids on 13 September,
         * and an authorization record names constraints only.
         */
        lensAuthority?: 'ENGINE_LENS'
        /**
         * RAS RC1 Stage-3 SHADOW artifact: the Resolved Affordance Target Profile for this decision
         * (canonical Game Problems + merged affordance-target ratings from the versioned Affordance
         * Target Matrix). Inspectable in traces/debug; does NOT influence selection in RC1 shadow mode.
         * Typed loosely here to keep the test-library layer decoupled from knowledge-core types.
         */
        affordanceTargetProfile?: unknown
        /** RAS traceability contract: version stamps pinning the reasoning context. */
        versions?: { knowledgeCore: string; reasoningEngine: string }
        archetype: SelectionReasonEntry
        affordanceLenses: SelectionReasonEntry[]
        /** The constraints selected for application (`constraints` above), with their scores. */
        constraints: SelectionReasonEntry[]
        /**
         * **The combination the selector committed** (ids, in its order): what the size rule (2-4) and the role mix were applied to, unchanged.
         * Equal to `constraints` above wherever the package holds every member; otherwise the members it does not hold are in
         * `constraintsNotApplied`. Empty for a zero-constraint commitment.
         */
        committedConstraints: string[]
        /**
         * **Each committed constraint not applied, with the existing package rule that left it out and the member kept** (12 November 2026).
         * Christian, received 12 November 2026: "A jointly required, authorized set should not be silently reduced. However, a pool of
         * eligible alternatives should not automatically become a requirement to use all of them." Only an eligible pool (a vocabulary pool,
         * free text, and since 13 November 2026 an authorization record's set declared ELIGIBLE_ALTERNATIVES) can have entries here; a set
         * declared JOINTLY_REQUIRED is taken whole or refused (`generateSelection`). Empty where the package holds the whole combination.
         */
        constraintsNotApplied: ConstraintNotApplied[]
        /**
         * **Each member of an ELIGIBLE_ALTERNATIVES set the selector did not commit, with the existing step that left it out** (13 November
         * 2026). Present only for an authorization record's set declared ELIGIBLE_ALTERNATIVES (empty where every member was committed), so
         * every other trace reads exactly as it did. With `constraints` and `constraintsNotApplied` it accounts for every member of the set:
         * applied, committed and not applied, or not committed.
         */
        authorizedSetNotCommitted?: AuthorizedMemberNotCommitted[]
        /**
         * Combined objective for the winning lens+constraint combination: the COMMITTED combination's score, so a member not applied
         * (`constraintsNotApplied`) still added its score to the combination that won and can have influenced which lenses were chosen.
         */
        objectiveScore: number
        /**
         * Developer/testing instrumentation — full candidate rankings ("why it won"), not just the
         * selected items. Each list is sorted best-first using the same ordering the selector uses.
         */
        ranking: {
            archetypes: SelectionRankingEntry[]
            affordanceLenses: SelectionRankingEntry[]
            constraints: SelectionRankingEntry[]
            /** Winning archetype score minus the runner-up's; 0 = tie-broken, null = single candidate. */
            archetypeMargin: number | null
        }
    }
}

/** Row skipped while converting CSV → TypeScript (see generate-data-from-csv.mjs). */
export interface TestLibraryConversionSkippedRow {
    sourceFile: string
    /** 1-based row index in the CSV file (header is row 1). */
    csvRowNumber: number
    reason: string
    /** Title, game_form_id, or similar when available */
    identifier?: string
}

export interface TestLibraryConversionValidationError {
    sourceFile: string
    phase: 'header' | 'parse'
    message: string
}

/** Emitted as `libraryConversionReport.ts` when running generate-data-from-csv.mjs */
export interface TestLibraryV0LoadReport {
    generatedAtIso: string
    sourceCsvRelativeDir: string
    counts: {
        totalArchetypesLoaded: number
        totalAffordanceLensesLoaded: number
        totalConstraintsLoaded: number
    }
    csvStats: {
        affordanceLenses: { dataRowsAttempted: number; dataRowsAccepted: number }
        constraints: { dataRowsAttempted: number; dataRowsAccepted: number }
        archetypes: { dataRowsAttempted: number; dataRowsAccepted: number }
    }
    skippedRows: TestLibraryConversionSkippedRow[]
    validationErrors: TestLibraryConversionValidationError[]
}
