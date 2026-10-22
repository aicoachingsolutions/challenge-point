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
    /**
     * When the coach needs the sentence (stage 2A, 21 October 2026): `UNDERSTAND_AND_BEGIN`, `ADMINISTER` or `ADJUST`, read from its
     * section by the server. A `string`, not the closed union, for the reason the header gives. Not shown yet.
     */
    when?: string
    /** The spans the sentence is made of, where the server sent them. */
    parts?: ReviewInstructionPart[]
    /**
     * In an activity played in role blocks (15 October 2026), the block a sentence belongs to where the two blocks differ;
     * absent where it holds in both. A technical id — the page shows the block's number, never the id.
     */
    block?: string
    /**
     * Stage 2C (21 October 2026): a sentence the blocks say in the same words, each citing its own role's target, said once. `from` is
     * block 1's citations; each other block's own are here. Such a sentence has no `block` and the page gives it no block label.
     * Account only.
     */
    counterparts?: { blockId: string; from: string[] }[]
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
    /**
     * His category for the entry (15 October 2026, his 16 October item 10): PROVISIONAL_REALIZATION_CHOICE,
     * EXISTING_KNOWLEDGE_TO_VERIFY or GENUINE_GAP. Optional: older accounts lack it.
     */
    category?: string
    /** A string, not the closed union, so a status the back end adds is shown rather than dropped. */
    status: string
    /** The decision and capability ids it waits on (defined in the record's `gaps`). Optional: older accounts lack it. */
    gaps?: string[]
    statusBasis: string
    note: string | null
}

/** One decision or capability a record's entries wait on: OUR wording, as put to him (15 October 2026). */
export interface ReviewRecordGap {
    id: string
    kind: string
    description: string
    note: string | null
    /** His words settling it (stage M4, 17 October 2026); absent while it is still needed. */
    settledBy?: { words: string; citedAs: string }[]
}

/** One line of the three lists, each field copied from the record by the server (15 October 2026). */
export interface ReviewAuthorizationListEntry {
    from: string
    label: string
    words: string | null
    citedAs: string | null
    sources: string[]
    status: string | null
    gaps: string[]
    note: string | null
}

/** The record as three lists: what existing knowledge authorizes, his provisional choices, the gaps (15 October 2026). */
export interface ReviewAuthorizationLists {
    authorizedByExistingKnowledge: ReviewAuthorizationListEntry[]
    provisionalChoices: ReviewAuthorizationListEntry[]
    gaps: (ReviewRecordGap & { neededBy: string[] })[]
}

/** A Learning Goal's authorization record (back end: `test-library/learning-goal-authorizations.ts`). */
export interface ReviewAuthorization {
    learningGoalId: string
    contextId: string
    gameProblemId: string
    ruledOn: string
    by: string
    ruling: string[]
    /** Null: the record has not yet evaluated its constraints (a gap). A list, empty included: the evaluation. */
    authorizedConstraints: string[] | null
    authorizedConstraintsFinding: string
    /** His provisional choices for this goal's activity (15 October 2026), each cited. Optional: older accounts lack it. */
    provisionalChoices?: {
        category: 'PROVISIONAL_REALIZATION_CHOICE'
        choice: string
        ruledOn: string
        by: string
        citedAs: string
        words: string
        /** Whether the activity can carry it now, and what it waits on (15 October 2026). Optional: older accounts lack them. */
        status?: string
        gaps?: string[]
        note: string | null
    }[]
    /** What existing knowledge authorizes, with sources (15 October 2026). Optional: older accounts lack it. */
    existingKnowledge?: { category: string; what: string; sources: string[]; note: string | null }[]
    /** The decisions and capabilities its entries wait on (15 October 2026). Optional: older accounts lack it. */
    gaps?: ReviewRecordGap[]
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
        /**
         * His general principle (15 October 2026) where the goal's record evaluated its constraints — for an empty
         * set, why none was selected. Optional: older accounts lack it.
         */
        constraintPrinciple?: { ruledOn: string; by: string; principle: string } | null
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
    /**
     * The same record as three lists, sorted by the server by the category the record gives each entry (15 October
     * 2026) — technical account only. Optional: older accounts lack it.
     */
    authorizationLists?: ReviewAuthorizationLists | null
    /**
     * The authority behind a per-team allocation (15 October 2026, stage K4) — technical account only, present only where a
     * goal's provisional realization authors counts per team: his principle, the relationship he confirmed, what defers to it
     * (listed as the alternative), his authorized adjustments and the testing boundaries. Optional: absent for every other
     * activity.
     */
    allocation?: ReviewAllocation
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
    /**
     * Present only for a game played in role blocks (15 October 2026, his M1): each block built as a complete game with
     * its own integrity, the cross-block checks, and the roles with their DRAFT coach nouns. `rendered` is the ONE
     * activity composed from both blocks. Technical account only.
     */
    roleBlocks?: ReviewRoleBlocks
    /** The administrator-only review evidence (stage K8), where the goal's record asks for one; see `RefusedActivity.evidence`. */
    evidence?: ReviewEvidence
    /**
     * The Coach Overview (stage 3D, 21 October 2026; `back/src/system/rendering/overview-fidelity.ts`), served to every viewer: words and
     * "full rule" pointers only. Present only where the server's agreement check (Q7) found the overview agrees with the Coach Details in
     * every block; absent otherwise, and the page then shows the Coach Details alone. Shown first since stage 4 (his reply filed 23 October
     * 2026, item 7.4: "Present the overview first, with complete details accessible when needed.").
     */
    overview?: CoachOverview
    /**
     * The overview as an administrator reviews it (stage 3A-3D): only on an administrator's answer. Typed here only as far as the page
     * reads it (stage 4: each sentence's status tag and reading label, the essentials table's label, and why a withheld overview was
     * withheld); the rest is shown as sent.
     */
    overviewDraft?: ReviewOverviewDraft
    /**
     * The field diagram (stage 5B, 22 October 2026; `back/src/system/rendering/coach-diagram.ts`), served to every viewer: geometry in
     * metres and words only. Present only where the server's checks found it agrees with the Coach Details in every block (D0-D8) and with
     * its own checked model (D9); absent otherwise, and the page then draws none. Drawn in the Coach Overview (`FieldDiagram.tsx`).
     */
    diagram?: CoachDiagram
    /** The diagram as an administrator reviews it (stage 5A-5B): only on an administrator's answer. Typed only as far as the page reads it. */
    diagramDraft?: ReviewDiagramDraft
}

/** A stretch in metres: along the area's length (0 at one end line) or across its width. */
export interface DiagramInterval {
    from: number
    to: number
}

/**
 * One block of the field diagram (stage 5B), as the server composed it: what is marked, what each marked zone is in this block, the
 * block's active targets (one look, whichever team attacks them), objects, teams (each with its own look, `identity`, kept across the
 * blocks) and the dimensions a sentence states; `title` and `desc` are the drawing's accessible name and description. Every word is
 * the server's.
 */
export interface CoachDiagramBlock {
    label: string | null
    title: string
    desc: string
    /**
     * Polish pass P7: where the teams have no noun, the server's one sentence for how they attack, shown beside the drawing to explain its
     * neutral arrows; null otherwise (and where none can be said, the arrows of unnamed teams are not drawn).
     */
    caption: string | null
    /**
     * Stage C2 (his reply filed 24 October 2026, item 4): what moves at the exchange into this block, the server's sentences (DRAFT), shown
     * beside the drawing; empty where nothing moves or the game is not played in blocks. Optional for an answer served before C2.
     */
    exchange?: string[]
    lines: { along: DiagramInterval; across: DiagramInterval; markedLine: boolean; label: string | null }[]
    zones: { along: DiagramInterval; across: DiagramInterval; state: 'TARGET' | 'INSIDE_TARGET' | 'MARKED' | string }[]
    targets: { along: DiagramInterval; across: DiagramInterval; line: boolean; label: string | null }[]
    objects: { along: DiagramInterval; across: DiagramInterval; label: string | null; target: boolean }[]
    /**
     * `identity`: the team's look, its place among the realized teams, kept in every block whatever role it holds (since stage C2). `label`
     * (stage C2): its DRAFT neutral label ("Team A") where teams are labelled, its `noun` then the role it holds in this block; else null.
     */
    teams: { identity: number; label?: string | null; noun: string | null; counts: string[]; start: { along: DiagramInterval; across: DiagramInterval } | null; attacks: number[] }[]
    dimensions: { kind: 'AREA_LENGTH' | 'AREA_WIDTH' | 'ZONE_DEPTH' | 'LINE_OFFSET' | string; axis: 'along' | 'across' | string; from: number; to: number; label: string }[]
}

/** The field diagram a coach is served (stage 5B): no id, data key, path or citation. */
export interface CoachDiagram {
    area: { lengthM: number; widthM: number }
    counts: string[]
    /**
     * `TARGET_LINE` (polish pass P7): a target that is a line, named by its own noun (DRAFT). Stage C2, where teams are labelled:
     * `TEAM_COLOUR`, `ROLE` and `ATTACK` (DRAFT words for a team's colour, its role badge and its arrow).
     */
    legend: { kind: 'MARKED_LINE' | 'TARGET_ZONE' | 'TARGET_LINE' | 'STARTING_AREA' | 'TEAM_COLOUR' | 'ROLE' | 'ATTACK' | string; text: string }[]
    /** Polish pass P4: the block switcher's accessible name (DRAFT, the server's); null with one block. */
    tablistLabel: string | null
    blocks: CoachDiagramBlock[]
}

/** One finding of the diagram's checks (D0-D9): any withholds the diagram, never the activity. */
export interface ReviewDiagramFinding {
    rule: string
    blockId: string | null
    what: string
}

/** The administrator's diagram draft, as far as the page reads it (stage 5B): served or not, why, and what is not drawn. */
export interface ReviewDiagramDraft {
    served: boolean
    verdict: 'DRAWN' | 'WITHHELD' | string
    findings: ReviewDiagramFinding[]
    notes: string[]
    [key: string]: unknown
}

/**
 * A "full rule" pointer (stage 3D): its label (DRAFT coach wording) and the Coach Details sentence it leads to, by section and words. The
 * page finds that sentence by section and words, never by position.
 */
export interface OverviewPointer {
    label: string
    section: string
    text: string
}

/** One line of how the teams score (stage 3F): its words and the "full rule" pointer it carries. */
export interface OverviewLine {
    text: string
    fullRule: OverviewPointer | null
}

/**
 * How one team scores (polish pass P1): the heading it is shown under (DRAFT, the server's: the team's noun, or "Each team"), its lines
 * (the line saying how the team scores first, then its own qualifications) and the "full rule" pointers of that team no line carries.
 */
export interface OverviewGroup {
    label: string
    lines: OverviewLine[]
    fullRules: OverviewPointer[]
}

/** The Coach Overview a coach is served (stage 3D): words and pointers only, no status, source or citation. */
export interface CoachOverview {
    /** The Learning Goal's Coach Definition, verbatim; null for a mechanism demonstration, which claims no goal. */
    purpose: string | null
    game: string
    parameters: string
    /**
     * How each team scores (polish pass P1): one group per team in the game sentence's team order, then the "full rule" pointers every
     * team's group has, once. Was (stage 3F): one line per team (`leads`), then the qualifications, then the pointers no line carries; before
     * that (3D-3E), one group of sentences per team.
     */
    scoring: { groups: OverviewGroup[]; fullRules: OverviewPointer[] }
}

/** One of the three wording statuses (his reply filed 22 October 2026, item 4). A `string`, not the closed union, as the header explains. */
export type ReviewWordingStatus = 'APPROVED' | 'DERIVED_FROM_APPROVED' | 'DRAFT' | string

/**
 * Where the reading an extract of his wording keeps by is recorded, and its standing (stage 3E): labelled "reading PROPOSED, awaiting
 * confirmation", or (C1, his reply filed 24 October 2026, item 1) "reading approved" where he approved every reading it stands by (DRAFT
 * words; `status` PROPOSED or APPROVED). For an administrator only; a coach's answer carries none.
 */
export interface ReviewReadingRecord {
    source: string
    status: string
    label: string
    labelStatus: string
}

/**
 * The readings record as the server names it (stage 3E): its standing (C1: PROPOSED, PARTLY_APPROVED or APPROVED, from its readings'
 * own), its label, why it cannot be used, and which readings he approved and which remain PROPOSED.
 */
export interface ReviewReadingsAccount {
    source: string
    status: string
    label: string | null
    labelStatus: string
    why: string | null
    approved?: string[]
    proposed?: string[]
}

/** C1: the essentials table as the server names it: its standing, its label, why it cannot be used, and its rules approved and PROPOSED. */
export interface ReviewEssentialsAccount {
    source: string
    status: string
    label: string | null
    labelStatus: string
    why: string | null
    approved?: string[]
    proposed?: string[]
}

/** The overview as presented, with each sentence's status and source, for an administrator only (stage 3D). */
export interface ReviewPresentedOverview {
    purpose: { text: string; wording: ReviewWordingStatus; source: Record<string, unknown> } | null
    game: { text: string; wording: ReviewWordingStatus }
    parameters: { text: string; wording: ReviewWordingStatus }
    scoring: {
        group: string
        noun: string | null
        /** Polish pass P1: the heading the group is shown under, and its status (DRAFT). */
        label: string
        labelStatus: string
        /** `place` (stage 3F): the team's lead line ("LEAD") or a qualification. */
        sentences: {
            text: string
            wording: ReviewWordingStatus
            source: { kind: string; id?: string } | null
            fullRule: (OverviewPointer & { labelStatus: string }) | null
            reading: ReviewReadingRecord | null
            place: 'LEAD' | 'QUALIFICATION' | string
        }[]
        fullRules: (OverviewPointer & { labelStatus: string })[]
    }[]
}

/**
 * One material element of a team's full rule, as the overview's agreement check read it (stage 3F): the rule classing it, whether the
 * overview must state it and why, the overview sentences stating it (by their words), the Details sentence a pointer leads to where it is
 * left to Coach Details, and each sentence citing it whose words are not read as stating it, with the reason. For an administrator only.
 */
export interface ReviewMeaningElement {
    rule: string
    class: string
    material: boolean
    element: string
    way: string | null
    fields: string[]
    statedBy: string[]
    complete: boolean
    pointer: { section: string; text: string } | null
    notStatedBy: { text: string; why: string }[]
    because: string
}

/** One finding of the overview's agreement check (stage 3D): a VIOLATION withholds the overview, never the activity. */
export interface ReviewOverviewFinding {
    question: string
    severity: 'VIOLATION' | 'NOTE' | string
    blockId: string | null
    what: string
}

/** Word count and reading seconds of the overview: evidence, never a gate (stage 3D). */
export interface ReviewOverviewReading {
    words: number
    byPart: { purpose: number; game: number; parameters: number; scoring: number }
    secondsAt250Wpm: number
    secondsAt200Wpm: number
    detailsWords: number
    basis: string
}

/** The administrator's overview draft, as far as the page reads it (stage 3D). Every other key is shown as sent. */
export interface ReviewOverviewDraft {
    served: boolean
    check: { verdict: 'PASS' | 'FAIL' | string; findings: ReviewOverviewFinding[] } | null
    reading: ReviewOverviewReading | null
    presented: ReviewPresentedOverview | null
    scoring: { table: ReviewEssentialsAccount; readings: ReviewReadingsAccount }
    /** What could not be composed, part by part (stage 3A): one of the reasons a withheld overview gives an administrator (stage 4). */
    gaps?: { part: string; what: string }[]
    [key: string]: unknown
}

/** One cross-block check (RB-1 to RB-8, and RB-M since stage K4). */
export interface ReviewRoleBlockCheck {
    checkId: string
    what: string
    verdict: string
    problems: string[]
}

/** The role blocks of a served activity, as the server sends them. */
export interface ReviewRoleBlocks {
    exchange: string
    roles: { role: string; coachNoun: string; nounStatus: string }[]
    /** `concreteChecks` (stage K4): each block's Gate A rerun on its concrete game, check by check. Optional for older accounts. */
    blocks: { blockId: string; holders: Record<string, string>; integrity: ActivityIntegrity; concreteChecks?: { checkId: string; verdict: string }[] }[]
    checks: ReviewRoleBlockCheck[]
    firstBlock: string
    /** Why the coach picks the first block: OUR inference from his D2, labelled so (K3 review, 15 October 2026). */
    firstBlockBasis: string
}

/** The allocation's authority, as the server sends it (stage K4). Every string is the record's or the realization's. */
export interface ReviewAllocation {
    principle: { ruledOn: string; by: string; citedAs: string; principle: string }
    relationships: {
        id: string
        contextId: string
        manipulationId: string
        manipulationName: string
        manipulationStatus: string
        rows: string[]
        status: string
        confirmedOn: string | null
        citedAs: string
        words: string[]
        identified: string
    }[]
    alternatives: { contractId: string; itemId: string; row: string; value: unknown; defersTo: string; deferredTo: { contractId: string; itemId: string }[]; relationship: string }[]
    adjustments: { id: string; words: string; consequence: string | null; citedAs: string; parameter: string; role: string; relationship: string }[]
    testingBoundaries: { players: number[]; words: string; citedAs: string; note: string | null } | null
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
    /**
     * Only for an administrator, only on a refusal at communication (15 October 2026, stage K7): the rendering the server made before
     * refusing — every sentence it could say, marked APPROVED or DRAFT — the fields it withheld, and its fidelity verdict. Never
     * served to a coach (`back/src/system/rendering/review-draft.ts`).
     */
    draft?: ReviewDraft
    /**
     * Only for an administrator, only for a goal whose record carries Christian's review request (15 October 2026, stage K8): the facts
     * the generated game holds, item by item as he asked, with each sentence's layer and standing (`back/src/system/rendering/
     * review-evidence.ts`). Never served to a coach.
     */
    evidence?: ReviewEvidence
}

/** One fact the review evidence read from the game: what it is, and its value as the server sent it. */
export interface ReviewFact {
    what: string
    value: unknown
}

export interface ReviewCheckRow {
    checkId: string
    verdict: string
    clauseCount: number
    vacuousClauses: string[]
    clausesNotPassing: { clause: string; verdict: string; basis: string | null; instances: number | null }[]
}

export interface ReviewEvidenceSource {
    layer: string
    standing: string
    ref: string
    detail: string | null
}

/** The review evidence (stage K8). Shown as sent, in the technical panel; every quotation is his, from the record. */
export interface ReviewEvidence {
    status: 'EVIDENCE_FOR_REVIEW_NOT_SERVED'
    about: string
    measured: { blocks: { blockId: string; inputDigest: string | null; registerVersion: string | null; engineVersion: string | null }[] }
    pathway: { route: string; facts: ReviewFact[]; his: { words: string; citedAs: string } }
    acceptance: ReviewFact[]
    layers: { code: string; words: string }[]
    items: {
        id: string
        words: string
        citedAs: string
        kind: string
        role: string | null
        blocks: { blockId: string; elements: { path: string; row: string; value: unknown }[] }[]
        checks: { checkId: string; blockId: string | null; verdict: string }[]
        sentences: number[]
        awaiting: string[]
        sections: string[]
        resolved: boolean
        /** Stage M3: per block, the role's scoring credit and the occurrences that also count as the primary event (empty for an item about no role). */
        facts: { blockId: string; facts: ReviewFact[] }[]
    }[]
    structure: {
        blocks: { blockId: string; holders: Record<string, string>; sections: Record<string, { checks: ReviewCheckRow[]; facts: ReviewFact[] }>; owed: { checkId: string; clause: string; verdict: string }[] }[]
        crossBlock: { checkId: string; what: string; verdict: string; problems: string[] }[]
        composition: string[]
        summary: { gateChecks: Record<string, number>; crossBlock: Record<string, number>; owed: Record<string, number>; everyCheckPasses: boolean; vacuousClauses: string[] }
    }
    sections: {
        allocation: ReviewFact[]
        specializedRoles: { role: string; row: string; available: unknown; facts: ReviewFact[] }[]
        pressure: ReviewFact[]
        scoring: ReviewFact[]
        restarts: Record<string, unknown>[]
        roleExchange: ReviewFact[]
        noPrescription: ReviewFact[]
        /** `counterparts` (stage 2C, 21 October 2026): present only on a sentence said once for blocks that say it alike by role. */
        instructions: { index: number; section: string; block: string | null; counterparts?: { blockId: string; from: string[] }[]; text: string; wording: 'APPROVED' | 'DRAFT'; obligationWords: string[]; q4: string[]; layers: string[]; standings: string[]; sources: ReviewEvidenceSource[] }[]
        /**
         * The review of stage 2A (21 October 2026): each section label the activity uses, with when the coach needs it, whose wording the
         * label is, and the indexes of the sentences under it. Optional: evidence built before it lacks it.
         */
        labels?: { section: string; when: string; status: 'APPROVED' | 'DRAFT'; sentences: number[] }[]
    }
    flags: { id: string; kind: string; role: string; his: { words: string; citedAs: string }[]; status: string; settledBy: { words: string; citedAs: string }[]; answer: string; blocks: { blockId: string; facts: ReviewFact[] }[]; knowledge?: { libraryEntries: ReviewFact[]; registerRows: ReviewFact[]; corpusItems: ReviewFact[] } }[]
    /** Stage M3: the limitations he asked to keep visible, each in his words with the facts the game holds. */
    limitations: { id: string; kind: string; his: { words: string; citedAs: string }[]; facts: ReviewFact[] }[]
    evaluation: { his: { words: string; citedAs: string }; points: { id: string; words: string; sections: string[] }[]; judgement: string }
    requests: { words: string; citedAs: string; sections: string[] }[]
    provenance: { elements: { path: string; row: string | null; blocks: string[]; layers: string[]; standings: string[]; sources: ReviewEvidenceSource[] }[]; untraced: string[]; lists: Record<string, unknown> | null; openForReview: ReviewFact[] }
    rationale: { features: { feature: string; featureBasis: 'OURS'; words: { words: string; citedAs: string }[]; statements: { id: string; category: string | null; text: string | null; provenance: string | null }[] }[]; his: { words: string[]; citedAs: string }; judgement: string }
    /**
     * Stage 3D (21 October 2026): the Coach Overview's agreement check as the server ran it — served or withheld, the verdict, every
     * finding, the table it was built on, each presented sentence with its status, and the reading evidence. Present only on a served
     * activity. Shown in the evidence panel since stage 4. Stage 3E: aligned with the draft — the table's source and label status, the PROPOSED readings record, each
     * "full rule" pointer with its label and label status (a sentence's, and each group's own in `fullRules`), each extract's reading label.
     */
    overview?: {
        served: boolean
        verdict: string
        findings: ReviewOverviewFinding[]
        /** Stage 3F: with `why` (why the table cannot be used, or null). C1: and its rules approved and PROPOSED. */
        table: ReviewEssentialsAccount
        readings: ReviewReadingsAccount
        sentences: {
            part: string
            group: string | null
            text: string
            wording: ReviewWordingStatus
            source: Record<string, unknown> | null
            fullRule: (OverviewPointer & { labelStatus: string }) | null
            reading: ReviewReadingRecord | null
            /** Stage 3F: a scoring sentence's place (the team's lead line, or a qualification); null for the other parts. */
            place: string | null
        }[]
        fullRules: (OverviewPointer & { labelStatus: string; group: string })[]
        reading: ReviewOverviewReading | null
        /** Stage 3F: each team's material elements, and the overview sentence(s) stating each. */
        meaning: { group: string; noun: string | null; elements: ReviewMeaningElement[] }[]
    }
}

/** One sentence of the review draft: the instruction, whose wording it is, and the provisional choices it rests on. */
export interface ReviewDraftInstruction extends ReviewInstruction {
    wording: 'APPROVED' | 'DRAFT'
    provisionalSources: string[]
}

export interface ReviewDraft {
    status: 'DRAFT_NOT_SERVED'
    instructions: ReviewDraftInstruction[]
    withheld: { path: string; row: string; reason: string }[]
    fidelity: { passed: boolean; violations: string[] }
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
