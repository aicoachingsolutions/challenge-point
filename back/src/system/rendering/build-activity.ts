/**
 * Build one activity through the integrity-checked pathway — for any Learning Goal, or for a mechanism
 * demonstration — from a stated session. The single implementation every caller uses.
 *
 * Christian, 13 October 2026: *"The review page should accept any of the thirteen Learning Goals and use the
 * coach's actual session context. … Where an activity cannot be generated, I'd prefer a brief,
 * understandable explanation rather than a generic failure. Please keep the actual coach-facing activity
 * primary, with its selection rationale and technical evidence available separately."*
 *
 * **Why it is one function.** His instruction for the pilot route was that it *"serve the same validated,
 * rendered activity without introducing unverified transformations"*, and two copies of the chain is how
 * that promise breaks: they drift, and what one serves stops being what the other validated. That was true
 * of a script and a route and it is truer of thirteen goals and a page. So the sequence lives here —
 * selection, derivation, the gates, realization, assembly, the gates again, rendering, fidelity — and the
 * pilot (`build-pilot-activity`) is now a thin caller of it rather than a second copy.
 *
 * **It refuses rather than degrades, and it says at which stage.** Nothing partial is returned for a caller
 * to serve anyway; his standing instruction is not to *"substitute generic fallback output"* or present an
 * activity that has not passed. What changed is what a refusal carries. It used to be a list of the
 * engine's own reasons, which name check ids and line ids and which no coach should be shown. A refusal now
 * has a `stage`, ONE plain `summary` sentence, and those same reasons verbatim as `reasons` for the
 * technical account — the activity primary, the evidence separate, as he asked.
 *
 * **The summary is chosen from structure, never from prose.** Which sentence a coach reads is decided by the
 * stage reached and by typed facts at that stage — which checks failed, whether a load was refused, the
 * roster rule's named cause — and never by matching words in an engine reason. A sentence chosen by matching
 * text changes meaning the day somebody rewords the reason.
 *
 * **An UNRESOLVED Game Problem does not stop a build, and is never filled in.** Where no translation is
 * approved the goal is built from exactly what selection committed to, and the account says the Game Problem
 * is an open learning-design decision. What the wording alone implies is carried as `inferredFromWording`
 * so a disagreement stays visible; it is never presented as the goal's Game Problem.
 *
 * It does not touch generation. Nothing here calls the frozen activity-generation path.
 */
import { bindingOf, boundRegionsRefusals, SportBoundRegions } from '../derivation/bound-regions'
import { loadRegister, loadSportBoundRegions, loadSportCoachVocabulary, loadSportDefaultLaws, loadSportEnvironmentElements, ProvisionalRealization, provisionalRealizationNamed, TestingBoundaries } from '../derivation/corpus'
import { LawsMateriality, lawsMaterialityRefusals } from '../derivation/default-laws'
import { duplicateEnvironmentElements, SportEnvironmentElements } from '../derivation/environment-elements'
import { isStampedHalt } from '../derivation/emit'
import { runDerivation, runStages0to10, runStages0to5 } from '../derivation/engine'
import { resolveRelativeCounts } from '../derivation/reassignment'
import { indexRegister } from '../derivation/register'
import { assembleResolvedGame, splitPath } from '../derivation/resolved-game'
import { roleHolderNames, roleOfHolder } from '../derivation/designation'
import { MissingParticipant, missingParticipantsIn, PARTICIPANTS_CHECK } from '../derivation/gates'
import { roleBlocksOf } from '../derivation/role-blocks'
import { BoundedSelection, CONTEXT_ROLE, contractCoverage, derivationInputFor, DraftStoreContents, GoalSelectionGap, knowledgeKey, KnowledgeSelection, realizationOf, selectFor } from '../derivation/run-bounded-selection'
import { DRAFT_KNOWLEDGE, DRAFT_KNOWLEDGE_VERSION, LoadedContract, RoleBlock } from '../derivation/types'
import { gpLibrary } from '../knowledge-core/gp-library'
import { completeConcreteGame, ObjectAvailabilityRefusal, objectAvailabilityRefusal, rosterRefusal, RosterRefusal } from '../realization/assemble-concrete-game'
import { boundRegionAccountOf, BoundRegionRefusal, boundRegionRefusalAfter, boundRegionRefusalBefore } from '../realization/bound-region-check'
import { blockLawAccountOf, DefaultLawsAccount, defaultLawsAccountOf } from '../realization/default-laws-check'
import { runPostRealizationGates } from '../realization/post-realization-gate'
import { realizeWithJustifiedDefaults, StrandedCount } from '../realization/justified-defaults'
import { checkRealization, isRefused, Realized } from '../realization/realize'
import { isNoSuppliedRealization, SuppliedRealization, suppliedRealizationFor } from '../realization/supplied-realization'
import { sessionPlanningModel } from '../session-planning/session-planning-model'
import { rpcLibrary } from '../sport-module/rpc-library'
import { TEST_LIBRARY_V0_AFFORDANCE_LENSES, TEST_LIBRARY_V0_ARCHETYPES, TEST_LIBRARY_V0_CONSTRAINTS, TEST_LIBRARY_V0_ENVIRONMENTAL_MANIPULATIONS } from '../test-library'
import type { SelectionKnowledgeGapReason } from '../test-library/generateSelection'
import { learningGoalSelectionHolds } from '../test-library/learning-design-holds'
import type { AuthorizationExclusion, AuthorizationLists, AuthorizedAdjustment, ContextManipulationRelationship, LearningGoalAuthorization } from '../test-library/learning-goal-authorizations'
import { allocationPrinciple, authorizationLists, contextRelationships, learningGoalAuthorizations, libraryConstraintPrinciple, neededRecordGaps, realizationAlternativesOf } from '../test-library/learning-goal-authorizations'
import { applyRealizationDeferrals, applyRoleYields } from '../derivation/realization-deferral'
import type { ConstraintAuthority, ConstraintPoolAccount } from '../test-library/types'
import { CoachOverviewDraft, failedOverviewDraft } from './coach-overview'
import { CoachDiagram, DiagramOutcome, diagramForServing } from './coach-diagram'
import { failedDiagramDraft, FieldDiagramDraft } from './field-diagram'
import { CoachOverview, OverviewEvidence, overviewEvidenceOf, overviewForServing, OverviewOutcome } from './overview-fidelity'
import { contextScoringFindings, EPISODE_REACHABLE_CHECK, eventKindReadingOf } from './context-scoring-guard'
import { BlockRequirementAccount, blockRequirementAccountOf, BlockRequirementInputs, failedBlockRequirementAccount, failedRequirementAccount, RequirementAccount, requirementAccountOf } from './requirement-account'
import { BINDINGS_MODES, RequirementBindings, requirementBindingsLoad, requirementBindingsRefusals } from './requirement-bindings'
import { draftCoachWordingLoad } from './draft-coach-wording'
import { checkFidelity, FidelityFinding } from './fidelity'
import { ReviewDraft, reviewDraftOf } from './review-draft'
import { RelevanceJoinRules, RelevanceTrace, relevanceTraceOf } from './relevance-trace'
import { ElementProvenance, elementProvenanceOf, EvidenceBlock, LayoutFallback, ReviewEvidence, reviewEvidenceOf, withRealizationSelection } from './review-evidence'
import { mechanismDemonstration } from './mechanism-demonstrations'
import { Instruction, RenderedActivity, renderConcreteGame } from './render-concrete-game'
import { assembleRenderingFixture } from './rendering-fixture'
import { layoutMoversOf, layoutOf, remarkingSummary } from './physical-layout'
import { checkRoleBlockComposition, checkRoleBlockLayout, checkRoleBlocks, composeRoleBlockActivity, RoleBlockCheck, roleBlockFixture } from './role-blocks'
import { ActivitySession, availabilityQuestion, objectAvailabilityQuestion, ObjectQuestionAsks } from './session-envelope'
import { choicesAnswering, choicesSuitedTo, ObjectChoice, objectChoicesOf } from './session-object-choices'

export type { ActivitySession } from './session-envelope'

/** What an activity is asked FOR: a Learning Goal, or a mechanism demonstration — which is not one. */
export type ActivitySubject =
    | { kind: 'learning-goal'; goalId: string; situationId?: string | null }
    | { kind: 'mechanism-demonstration'; demonstrationId: string }

export type ActivityRequest =
    | { kind: 'learning-goal'; goalId: string; situationId?: string | null; session: ActivitySession }
    | { kind: 'mechanism-demonstration'; demonstrationId: string; session: ActivitySession }

/** Where a build stopped. In pathway order, so an earlier stage always wins. */
export type ActivityStage = 'session' | 'selection' | 'knowledge' | 'structure' | 'realization' | 'validation' | 'communication'

/** How the activity was arrived at — the selection account, so nothing is taken on trust. SECONDARY to the activity. */
export interface ActivityAccount {
    /**
     * Whose Game Problem the selection was made for. `UNRESOLVED` is an open learning-design decision, not
     * a value. Null for a mechanism demonstration, which is built from no Learning Goal.
     */
    gameProblem: {
        status: 'APPROVED' | 'UNRESOLVED'
        gameProblemId: string | null
        name: string | null
        /** What the wording alone implies. Kept so a disagreement stays visible; NEVER the goal's Game Problem. */
        inferredFromWording: string | null
        governed: boolean
    } | null
    contextId: string | null
    /**
     * The Representative Performance Context, with the qualifying condition he approved for its Primary
     * Scoring Event (RC1.1, 13 September) and whether this activity carries it. Null for a demonstration.
     *
     * Added 14 October because his context rule has two halves and the checked pathway carried one. Since his
     * ruling later that day, selection carries the context too, and a goal whose context has no contract is
     * refused rather than scored by a set-up choice. `inThisActivity` is READ from the selection - is the
     * context's own contract among what shapes the game - not asserted: true for RPC-001 (A01), false for
     * every context without a contract.
     *
     * `contract` (B2, 28 October 2026; the review's M3): `DRAFT` where the context's contract in this build is one of the TEST-ONLY draft
     * store's, so `inThisActivity` can never read as his knowledge applied; absent wherever the contract is production knowledge (always, in
     * production).
     */
    context: { id: string; name: string | null; approvedScoringCondition: string | null; inThisActivity: boolean; contract?: 'DRAFT' } | null
    gameForm: { id: string; name: string | null; contracted: boolean }
    affordanceLenses: string[]
    /**
     * `contracted` is whether the constraint actually shapes the game. One without a contract contributes
     * nothing. `fromGoalCandidates` is whether it was among the goal's own candidate constraints — always
     * true for a goal since his ruling of 14 October, and kept as a checked invariant rather than assumed.
     * Null for a demonstration.
     */
    constraints: { id: string; title: string; contracted: boolean; fromGoalCandidates: boolean | null }[]
    /**
     * What selection drew its constraints from, READ from the selection trace (`constraintPoolFor`). Null for
     * a demonstration, which involves no candidates.
     *
     *   - `unfilledRoles`: roles none of the goal's designated candidates fills. Each is a knowledge gap,
     *     reported and never filled from elsewhere — his ruling of 14 October.
     *   - `heldByRuling`: candidates his rulings keep out of Learning Goal selection, still listed as
     *     designated.
     *   - `gap`: set where the candidates cannot be combined at all and the goal was refused at `selection`.
     */
    constraintSource: {
        source: 'GOAL_CANDIDATES' | 'WHOLE_LIBRARY' | 'AUTHORIZATION_RECORD'
        /**
         * 15 October 2026: whether the candidates carry an owner-ruled authorization (`AUTHORIZATION_RECORD`) or
         * were derived from vocabulary (`VOCABULARY_POOL` — the wording pool or a Coverage row, never authorized in
         * his sense of that day's item 1). Read from the pool account selection produced.
         */
        constraintAuthority: ConstraintAuthority
        /**
         * His general principle (16 October reply, item 1), where the goal's record has evaluated its authorized set and
         * the set is read under it — for an empty set, why no library constraint was selected. Null for a vocabulary
         * pool and for a record not yet evaluated. The sentence is read from the record file, never restated here.
         * Replaced `zeroConstraintRuling` on 15 October 2026.
         */
        constraintPrinciple: { ruledOn: string; by: string; principle: string } | null
        /** The lenses are the engine's reasoning dimension, not authorized affordance targets (13 September deferral). */
        lensAuthority: 'ENGINE_LENS'
        unfilledRoles: string[]
        heldByRuling: { id: string; title: string; ruledOn: string }[]
        gap: SelectionKnowledgeGapReason | null
    } | null
    /**
     * **The goal's authorization record, as selection used it — for the TECHNICAL account only** (15 October 2026).
     * Christian, item 1: *"Please identify the smallest set of authorized manipulations needed to create a
     * representative build-out problem, and flag any missing knowledge rather than filling gaps through
     * inference."* So the account carries the record whole — his ruling, the constraints it authorizes (none, for
     * Play Out from the Back, with the finding why), what it excludes, and each manipulation his context names with
     * its source, register rows and status — copied from the record and never restated in code. Exclusions gain the
     * library title. Null for a demonstration and for a goal with no record (its constraints are vocabulary-derived).
     * None of it is coach-facing.
     */
    authorization: (Omit<LearningGoalAuthorization, 'excluded'> & { excluded: (AuthorizationExclusion & { title: string })[] }) | null
    /**
     * **The same record as three lists — added 15 October 2026 (stage H3), TECHNICAL account only.** His 16 October
     * reply asks the next review to *"distinguish what was authorized by existing knowledge from what remains a
     * provisional design choice"*, with the gaps kept visible (item 10). `authorizationLists` sorts the record's own
     * entries by the category the record gives them; every string is the record's. Null wherever `authorization` is.
     */
    authorizationLists: AuthorizationLists | null
    selectedWithoutContract: string[]
    /**
     * **Provisional: the goal's Game Problem is UNRESOLVED.** Christian, 14 October 2026: *"they should not be
     * presented as completed learning-design examples until the relevant Game Problem relationships are
     * approved. … If a provisional output is useful for internal review, please label it explicitly as
     * provisional."* Decided from the Game Problem authority selection carried, never from wording. False for
     * a demonstration, which claims no goal.
     */
    provisional: boolean
    /** Why it is provisional, for the technical account. Null where it is not. */
    provisionalReason: string | null
    /**
     * **The authority behind a per-team allocation — TECHNICAL account only, present only where one applies** (15 October
     * 2026, stage K4). His reply filed 17 October 2026, D6: *"please document it as a knowledge-authorized realization,
     * preserving equal numbers as an alternative."* Absent for every other activity, so what they serve is unchanged.
     */
    allocation?: AllocationAccount
    /**
     * **Every realization the goal's record names, in the order it authorizes them, with whether each was used and why** — TECHNICAL account
     * only, present only for a goal whose record names a realization (stage E, 23 October 2026). His reply filed 25 October 2026, item 4:
     * *"These should be alternative knowledge-authorized realizations, not separate hardcoded implementations of the same Learning Goal."*;
     * and the note sent to him: *"Chosen automatically; the review shows which version was used and why."* Read from the build's own loop
     * (`realizationOutcomes`), never restated; the review evidence names the same entries. Absent for every other activity.
     */
    realizationSelection?: RealizationSelectionEntry[]
}

/**
 * **One alternative realization as the build used it** (stage E). `outcome`: SELECTED (the activity is built with it); NOT_APPLICABLE (it
 * does not apply to this session: a typed applicability refusal, `cause`, and the build moved to the next); ASKED (the session must say
 * something first, so the build stopped to ask); REFUSED (any other refusal, which refuses the activity: nothing behind it is tried);
 * NOT_SELECTABLE (the record lists it waiting on a gap, `gaps`, so it is never tried); NOT_TRIED (an alternative behind the one that decided).
 * `stage` and `summary` are its refusal's, where it was refused. `words` and `citedAs` are his, for its place in the order; null for a record
 * naming one realization.
 */
export interface RealizationSelectionEntry {
    realization: string
    words: string | null
    citedAs: string | null
    outcome: 'SELECTED' | 'NOT_APPLICABLE' | 'ASKED' | 'REFUSED' | 'NOT_SELECTABLE' | 'NOT_TRIED'
    cause: string | null
    stage: ActivityStage | null
    summary: string | null
    gaps: string[]
}

/**
 * **Why an alternative realization does not apply to this session, typed** (stage E, 23 October 2026; the design's Stage E: *"Fall back to
 * the next alternative ONLY on a typed applicability refusal: a resource shortfall, the testing area, or the practice situation"*). The
 * build moves to the next alternative on these causes alone: a specialized role the session cannot staff (the roster's AVAILABILITY_SHORT,
 * where nothing else is wrong with the game: `onlyTheRosterStopped`), objects the session has too few of or none that suit what his words for
 * the realization admit (OBJECT_AVAILABILITY_SHORT, OBJECT_NOT_SUITABLE where suitability is decided; undecided, it refuses), an area the realization's starting
 * values were not given for (TESTING_AREA), and a practice situation it was not designed for (PRACTICE_SITUATION). It stops to ask on the
 * two the session has not stated (AVAILABILITY_NOT_STATED, OBJECT_AVAILABILITY_NOT_STATED). Any refusal without a cause refuses the
 * activity, so a broken alternative is never hidden behind the next one (the design's risk 7).
 *
 * **BOUND_REGION_DOES_NOT_FIT** (H3, 23 October 2026; the d26 design's build step 3, its N5): the region the one authorized pairing gives
 * the session's object does not fit inside the session's area, so the realization does not apply to this session (`bound-region-check.ts`).
 * Typed only where nothing else about the bound regions is wrong; a region nobody has authorized for the object (BOUND_REGION_NOT_AUTHORIZED)
 * is a knowledge gap and refuses, never falls back. Christian, reply filed 26 October 2026, item 7: *"Use an existing regulation [handling
 * area] when the activity dimensions and setup permit it."* (His noun bracketed for the coupling ratchet.)
 */
export type NotApplicableCause = 'AVAILABILITY_SHORT' | 'OBJECT_AVAILABILITY_SHORT' | 'OBJECT_NOT_SUITABLE' | 'TESTING_AREA' | 'PRACTICE_SITUATION' | 'BOUND_REGION_DOES_NOT_FIT'
export type AskCause = 'AVAILABILITY_NOT_STATED' | 'OBJECT_AVAILABILITY_NOT_STATED'
export type Applicability = { verdict: 'NOT_APPLICABLE'; cause: NotApplicableCause } | { verdict: 'ASK'; cause: AskCause }

/**
 * **What a refusal asks the coach, where the build stopped to ask** (stage E, 23 October 2026): the new question channel from a build, read
 * by the review page and passed on by the live route (the design's Stage E, *"NOT_STATED reaches the coach as a question through both the
 * review route and the live route"*). Today one kind: the session's objects of a kind the activity's game holds and the session has not
 * stated (`asks`: whether it has any and how wide, or only how wide). `words` is the summary sentence itself, DRAFT. Absent on every other
 * refusal.
 */
export interface SessionQuestion {
    kind: 'OBJECT_AVAILABILITY'
    objectKind: string
    asks: ObjectQuestionAsks
    /**
     * H4 (23 October 2026, register version 22): where `asks` is ATTRIBUTE, the attribute asked for and its closed list of values, both the
     * register's (`sessionResources.attributes`), so the review page offers exactly those and names none itself. Absent on every other ask.
     */
    attribute?: { name: string; values: string[] }
    words: string
    status: 'DRAFT'
    /**
     * **The choices the coach answers it by** — stage I, 24 October 2026 (the d27 design's stage I(a) and (c): the build's question offers the
     * same choices as the session's own, including the ATTRIBUTE question; `session-object-choices.ts`). For the kind asked: each authorized
     * object a Sport Profile pairing gives a region for, named with its document and size and stating its width and type exactly as the
     * pairing records them; each attribute value the wording lists; another object whose width the coach enters; none. For an ATTRIBUTE ask,
     * only those stating a value of the attribute, and none. Empty where the wording labels none for the kind (then the question is answered
     * as before). DRAFT labels.
     */
    choices: ObjectChoice[]
}

/**
 * The allocation's authority as the review page shows it (stage K4): his principle (recorded once), the relationships the
 * realization's items cite, what defers to them and is listed as the alternative, the adjustments he authorized, and the
 * realization's testing boundaries. Every string is copied from the record or the realization, never written here.
 */
export interface AllocationAccount {
    principle: { ruledOn: string; by: string; citedAs: string; principle: string }
    /**
     * The relationships the realization's items and the adjustments cite, of every recorded kind (stage A, 22 October 2026). A relationship
     * that is no manipulation (a context scoring relationship; none recorded today) carries null in the three manipulation fields.
     */
    relationships: (Pick<ContextManipulationRelationship, 'id' | 'contextId' | 'rows' | 'status' | 'confirmedOn' | 'citedAs' | 'words' | 'identified'> & { manipulationId: string | null; manipulationName: string | null; manipulationStatus: string | null })[]
    /** What defers in this composition (ruling C56): the alternative, with what it defers to. */
    alternatives: Alternative[]
    adjustments: AuthorizedAdjustment[]
    testingBoundaries: TestingBoundaries | null
}

/**
 * **One item moved aside as the alternative, as every reader of the composition sees it** (ruling C56; the account, the fixture, the review
 * evidence). `defersWith` (stage B review fix, 23 October 2026) is carried where the item yields TOGETHER WITH the item it names rather than in
 * its own right (realization-deferral.ts, the design's K2): `defersTo`, `deferredTo` and `relationship` are then its partner's, and a reader
 * must say so - until this fix both projections below dropped it, so a paired item was listed as deferring, by its partner's relationship,
 * to items that write another row. Absent on every unpaired entry, so they are exactly what they were.
 */
export interface Alternative {
    contractId: string
    itemId: string
    row: string
    value: unknown
    defersTo: string
    deferredTo: { contractId: string; itemId: string }[]
    relationship: string
    defersWith?: string
}

/** The one projection of a deferral entry onto an `Alternative` (both the account and the fixture read it). */
const alternativeOf = (entry: ReturnType<typeof applyRealizationDeferrals>['deferred'][number]): Alternative => ({
    contractId: entry.contractId,
    itemId: entry.item.itemId,
    row: String(entry.item.row),
    value: entry.item.value,
    defersTo: entry.defersTo,
    deferredTo: entry.deferredTo.map(ref => ({ ...ref })),
    relationship: entry.relationship,
    ...(typeof entry.defersWith === 'string' ? { defersWith: entry.defersWith } : {}),
})

/**
 * The allocation account of a goal whose record names a provisional realization, or null where its items cite no
 * relationship and the record authorizes no adjustment (stage K4). Read from the record, the realization derivation received
 * and the deferral this composition made.
 */
function allocationAccountOf(record: LearningGoalAuthorization, realization: ProvisionalRealization | null, deferred: ReturnType<typeof applyRealizationDeferrals>['deferred']): AllocationAccount | null {
    const cited = new Set((realization?.items ?? []).map(item => item.authorizedBy).filter((id): id is string => typeof id === 'string'))
    const adjustments = record.authorizedAdjustments?.entries ?? []
    for (const adjustment of adjustments) cited.add(adjustment.relationship)
    if (!cited.size) return null
    const { ruledOn, by, citedAs, principle } = allocationPrinciple()
    return {
        principle: { ruledOn, by, citedAs, principle },
        // Stage A (22 October 2026): read from every recorded kind (`contextRelationships`); a relationship that is no manipulation (a
        // context scoring relationship, none recorded today) names no manipulation, and says so (null) rather than borrowing a field.
        relationships: contextRelationships()
            .filter(entry => cited.has(entry.id))
            .map(entry => {
                const { id, contextId, rows, status, confirmedOn, citedAs: where, words, identified } = entry
                const manipulation = 'manipulationId' in entry ? entry : null
                return { id, contextId, manipulationId: manipulation?.manipulationId ?? null, manipulationName: manipulation?.manipulationName ?? null, manipulationStatus: manipulation?.manipulationStatus ?? null, rows: [...rows], status, confirmedOn, citedAs: where, words: [...words], identified }
            }),
        alternatives: deferred.map(alternativeOf),
        adjustments: JSON.parse(JSON.stringify(adjustments)),
        testingBoundaries: realization?.testingBoundaries ? JSON.parse(JSON.stringify(realization.testingBoundaries)) : null,
    }
}

export interface ServedActivity {
    outcome: 'served'
    kind: 'learning-goal' | 'mechanism-demonstration'
    /** The goal's name, or the demonstration's. */
    title: string
    /** The goal's Coach Definition, or the demonstration's statement. */
    subtitle: string | null
    session: ActivitySession
    /** What a coach receives — PRIMARY. */
    rendered: RenderedActivity
    account: ActivityAccount
    /** Every check that had to pass before this could be served. */
    integrity: {
        gateA: string
        realizationAuthorized: boolean
        acceptance: { nothingClosedWithoutAuthority: unknown[]; nothingLost: unknown[]; nothingInvented: unknown[] }
        postRealizationValidated: boolean
        instructions: number
        fidelityViolations: number
    }
    /**
     * **Present only for a game played in role blocks** (15 October 2026, stage K3, his M1) — TECHNICAL account: each block's
     * own bindings and integrity (both blocks were built as complete games and both passed), the cross-block checks, and
     * the roles with their DRAFT coach nouns. `rendered` above is the ONE activity composed from the two blocks' renders.
     * Absent for every other activity, so what they serve is unchanged.
     */
    roleBlocks?: RoleBlockAccount
    /** The admin-only review evidence (stage K8), where the goal's record asks for one; see `RefusedActivity.evidence`. */
    evidence?: ReviewEvidence
    /**
     * **The Coach Overview's learning purpose, game sentence and basic parameters, for an administrator only** (stage 3A, 21 October
     * 2026; `coach-overview.ts`). Computed from the same games the served activity was rendered from (each role block, or the one game),
     * only by the review build with drafts (`buildActivityForReview`, the route's administrator check), for every served activity that
     * build makes. Not served to a coach: stage 3D serves the overview once its agreement check (Q7) is in place. It never decides
     * whether an activity is served; whatever it cannot say is a gap inside it. Since stage 3B it also lists, per block, the verbatim
     * extracts of the approved wording that block's game says (`derived-wording.ts`), each DERIVED_FROM_APPROVED with its source entry and
     * cover accounting, and those withheld with why. Since stage 3C, how each team scores, per block (`scoring`), composed through the
     * PROPOSED essentials table and labelled as built on it. Since stage 3D, the agreement check's verdict and findings (`check`), whether
     * the overview is served (`served`), the overview as presented with each sentence's status (`presented`) and its word count and reading
     * seconds (`reading`, evidence only).
     */
    overviewDraft?: CoachOverviewDraft
    /**
     * **The Coach Overview, served to every viewer** — stage 3D, 21 October 2026 (`overview-fidelity.ts`). His reply filed 22 October 2026,
     * item 1: *"Coach Overview — The immediate understanding of the activity: learning purpose, one-sentence game description, basic
     * parameters, essential scoring objectives, and a simple diagram."* Words and "full rule" pointers only (no status, source, citation or
     * binding: those are the administrator's, in `overviewDraft`). Present only where the overview agrees with Coach Details in every block
     * (Q7); withheld otherwise, the activity served exactly as without it. Every word is DRAFT except his purpose and his approved wording.
     * The diagram is served beside it, as its own layer (`diagram`, stage 5B): either may be withheld without the other.
     */
    overview?: CoachOverview
    /**
     * **The field diagram as a model, and its agreement check, for an administrator only** — stage 5A, 22 October 2026
     * (`field-diagram.ts`). His reply filed 22 October 2026, item 1, puts *"a simple diagram"* in the Coach Overview; his reply filed 23
     * October 2026, item 5, says what it shows and when missing information may prevent it. Computed from the same games the activity was
     * rendered from, for every served activity; checked against each block's Coach Details. DRAWN where it agrees, WITHHELD with every
     * finding otherwise; it never decides whether an activity is served. Only the review build with drafts carries it. Since stage 5B,
     * `served` says whether every viewer was served the diagram (`diagram`), and a finding of D9 (the coach's diagram against this model)
     * withholds it too. Every word is DRAFT except his terms "marked line" and "target zone".
     */
    diagramDraft?: FieldDiagramDraft
    /**
     * **The field diagram, served to every viewer** — stage 5B, 22 October 2026 (`coach-diagram.ts`). His reply filed 22 October 2026,
     * item 1: the Coach Overview holds *"a simple diagram"*; his reply filed 23 October 2026, item 5, says what it shows. Geometry in
     * metres and words only (no id, data key, path or citation: those are the administrator's, in `diagramDraft`), block by block. Present
     * only where the model agrees with Coach Details in every block (D0-D8) and this diagram with the model (D9); withheld otherwise, the
     * activity served exactly as without it. Every word is DRAFT except his terms "marked line" and "target zone" and the nouns and counts
     * a served sentence carries.
     */
    diagram?: CoachDiagram
    /** TEST-ONLY (B2, 28 October 2026): the account of a build made from the draft store; see `DraftKnowledgeAccount`. */
    draftKnowledge?: DraftKnowledgeAccount
    /** TEST-ONLY (B3, 28 October 2026): the relevance trace of a composition-test build or a demonstration; see `relevanceOfBuilt`. */
    relevance?: RelevanceTrace
    /**
     * **The sport's check of a composed activity, for an administrator only** (B4, 28 October 2026; `default-laws-check.ts`): the default-laws
     * account the sport's check declared (`declaredBy: 'SPORT_PROFILE'`), with each owed adaptation MATERIAL or PROCEDURAL; on a served
     * activity, what it owes is only PROCEDURAL, reported here for review. Carried only by the review build with drafts, and only where the
     * sport's check (not a realization's own) held the activity, so the report never depends on a record asking for review evidence. Absent on
     * every coach's answer and on every activity a realization's check holds (its account is in `evidence`, where the record asks for one).
     */
    lawsCheck?: DefaultLawsAccount
    /**
     * **The requirement account, for an administrator only** (29 October 2026; `requirement-account.ts`). Christian, his reply filed 3 November
     * 2026, section 2: *"Each generated activity should be evaluated against the applicable, approved context requirements, accounting for each
     * component of a scoring condition rather than simply confirming that the condition exists."* Each applicable requirement of the context,
     * part by part, in his four categories and three standards, every classification ours and DRAFT. Carried only by the review build with
     * drafts (`buildActivityForReview`, the route's administrator check), served or refused after realization (wherever a block reached the
     * context-scoring guard), never depending on a record asking for review evidence. It refuses nothing (*"let's verify the classifications
     * before enabling refusals broadly"*): absent on every coach's, live, saved and pilot answer, and every other key of the activity is what it
     * was without it.
     */
    requirementAccount?: RequirementAccount
}

/**
 * **What a build made from the TEST-ONLY draft store rested on, graded as the review evidence grades it** — B2, 28 October 2026 (E1-lite;
 * the review's M2, M5 and M6). Present only on a build `buildActivityUnderAuthorizationRecords` made with a draft store, served or refused,
 * and never on any route: no in-app view reads drafts. For an administrator's and a test's reading, never a coach's.
 */
export interface DraftKnowledgeAccount {
    status: 'BUILT_FROM_DRAFT_KNOWLEDGE_NOT_APPROVED'
    /** The store: its folder, every DRAFT file it read, and every DRAFT file of the folder it does not read, with why. */
    store: { folder: string; files: string[]; notRead: { file: string; why: string }[] }
    /** The draft records the selection was offered (their goals). */
    records: string[]
    /** Every contract of this build's derivation input that the store loaded, with its items; empty where the build stopped before. */
    contracts: { contractId: string; items: string[] }[]
    /** Every draft declaration of this build's derivation input (a declaration can resolve lines on another contract's elements). */
    declarations: { contractId: string; row: string; selector: string | null; declaration: string; note: string | null }[]
    /**
     * The provenance of every element of the game as built (the first block, for a game played in role blocks), by the review evidence's own
     * reading (`elementProvenanceOf`): an element resting on a draft item shows the standing DRAFT and that item as a DRAFT source. Null where
     * no game was assembled.
     */
    elements: ElementProvenance[] | null
}

/** The role blocks of a served activity, for the technical account (stage K3). */
export interface RoleBlockAccount {
    /** How the roles pass between the teams (the exchange vocabulary's member the knowledge established). */
    exchange: string
    roles: { role: string; coachNoun: string; nounStatus: 'DRAFT' }[]
    /**
     * `concreteChecks` (stage K4, 15 October 2026): each block's Gate A as rerun on its own concrete game, check by check —
     * so "the roster sums to the session players in every block" (GA-ROSTER-SUM per block, his 17 October request to
     * "verify the configuration's structural consistency, including player totals") is read as the gate's verdict in each
     * block, not inferred from `postRealizationValidated`.
     */
    /**
     * `ends` (the integration review, 23 October 2026): for each end, the end whose first-block team stands there in this block
     * (`RoleBlock.ends`: the identity in the first block, the two ends exchanged in the second), carried only where the block records one (the
     * end exchange, register row B10), so the account shows the end and the role apart (his reply filed 25 October 2026, item 5: "Please keep the following concepts separate in the general representation");
     * absent wherever each team keeps its end, as before.
     */
    blocks: { blockId: string; holders: Record<string, string>; ends?: Record<string, string>; integrity: ServedActivity['integrity']; concreteChecks: { checkId: string; verdict: string }[] }[]
    checks: RoleBlockCheck[]
    /**
     * Which block is played first is the coach's. INFERRED from his D2 (*"The coach determines when the teams exchange
     * roles."*) and stated beside the possession game's own governed choice of which team starts; never chosen here.
     */
    firstBlock: 'COACH_CHOICE'
    /**
     * The same label carried to the reader (K3 review, 15 October 2026): the verifier's correction (g-part-09) asks that
     * "the coach decides which block is played first" be labelled INFERRED wherever it is stated, because he did not say
     * it. Without this the page showed `COACH_CHOICE` bare, as if it were his.
     */
    firstBlockBasis: typeof FIRST_BLOCK_BASIS
}

/** Our inference, said as ours: which block is played first. His sentence is quoted exactly (D2, reply filed 17 October 2026). */
export const FIRST_BLOCK_BASIS = 'INFERRED from his D2, "The coach determines when the teams exchange roles." — not his words. The possession game\'s own governed choice of which team starts is listed with the realization choices.' as const

export interface RefusedActivity {
    outcome: 'refused'
    kind: 'learning-goal' | 'mechanism-demonstration'
    title: string
    stage: ActivityStage
    /** ONE plain sentence a coach can read. No ids, no check names. */
    summary: string
    /** The engine's own reasons, verbatim, for the technical account. */
    reasons: string[]
    /** Whatever was established before the refusal. */
    account: Partial<ActivityAccount>
    /**
     * **What the coach is asked, where the build stopped to ask** (stage E, 23 October 2026; `SessionQuestion`): present only on a refusal
     * whose game holds an object of a kind the session has not stated. Its words are `summary`'s. Absent on every other refusal.
     */
    question?: SessionQuestion
    /**
     * **Only for an administrator's review, only on a refusal at communication** (stage K7, 15 October 2026): the rendering the
     * builder made before refusing — every sentence it could say, marked APPROVED or DRAFT, with the provisional choices behind it —
     * the withheld fields, and the fidelity verdict (`review-draft.ts`). Produced only by `buildActivityForReview` with
     * `includeDrafts`; `buildActivity`, the pilot and the live route never carry the key.
     */
    draft?: ReviewDraft
    /**
     * **Only for an administrator's review of a goal whose record asks for one** (stage K8, 15 October 2026): the facts the generated
     * game holds, item by item as he asked, with each element's and sentence's layer and standing (`review-evidence.ts`). Produced only
     * by `buildActivityForReview` with `includeDrafts`, on a refusal at communication; never on a coach's, the pilot's or the live answer.
     */
    evidence?: ReviewEvidence
    /** TEST-ONLY (B2, 28 October 2026): the account of a build made from the draft store; see `DraftKnowledgeAccount`. */
    draftKnowledge?: DraftKnowledgeAccount
    /** TEST-ONLY (B3, 28 October 2026): the relevance trace of a composition-test build or a demonstration; see `relevanceOfBuilt`. */
    relevance?: RelevanceTrace
    /** B4 (28 October 2026), for an administrator only: the sport's check of a composed activity; see `ServedActivity.lawsCheck`. */
    lawsCheck?: DefaultLawsAccount
    /** 29 October 2026, for an administrator only, on a refusal after realization: the requirement account; see `ServedActivity.requirementAccount`. */
    requirementAccount?: RequirementAccount
}

/**
 * The request names a goal, a practice situation or a demonstration that does not exist. That is a
 * malformed request and not a refusal: there is no activity it could have been, so there is nothing to
 * explain to a coach, and a caller answers it as a bad request rather than as an outcome.
 */
export class UnknownActivityRequest extends Error {}

/** What is being asked for, in the words a coach knows it by. Throws `UnknownActivityRequest` where it names nothing. */
export function describeRequest(request: ActivitySubject): { kind: ActivitySubject['kind']; title: string; subtitle: string | null } {
    if (request.kind === 'mechanism-demonstration') {
        const demonstration = mechanismDemonstration(request.demonstrationId)
        if (!demonstration) throw new UnknownActivityRequest(`no such mechanism demonstration: ${request.demonstrationId}`)
        return { kind: request.kind, title: demonstration.name, subtitle: demonstration.statement }
    }
    const goalId = request.goalId
    const goal: any = sessionPlanningModel.learningGoal(goalId)
    if (!goal) throw new UnknownActivityRequest(`no such learning goal: ${goalId}`)
    if (request.situationId) {
        const offered = (sessionPlanningModel.practiceSituationsFor(goalId) as any[]).map(situation => String(situation.ID))
        if (!offered.includes(request.situationId)) {
            throw new UnknownActivityRequest(`${request.situationId} is not a practice situation of ${goalId}: the planning model offers ${offered.join(', ') || 'none'}`)
        }
    }
    const definition = String(goal['Coach Definition'] ?? '').trim()
    return { kind: 'learning-goal', title: String(goal['Learning Goal']), subtitle: definition || null }
}

/**
 * The knowledge a mechanism demonstration is made of, shaped as a selection.
 *
 * It is built directly, and that is the point: no goal is asked, no candidate pool is consulted, and nothing
 * scores anything. The first object is the game form and the rest carry the mechanism, exactly as listed.
 */
function demonstrationSelection(selected: string[]): KnowledgeSelection {
    const entries = selected.map((id, i) => ({ id, role: i === 0 ? 'game form' : 'constraint' }))
    return { selected: entries, ...contractCoverage(entries) }
}

const LENS = 'affordance lens'

/**
 * A selected constraint's name, from whichever library holds it.
 *
 * The library keeps its entries in two lists — constraints, and the environmental manipulations that were
 * split out of them — under one id scheme, and selection draws from both. This looked in the first only
 * and fell back to the id, so the account named by a library id every constraint held in the second list.
 * Measured in review on 13 October: that was at least one constraint of every one of the thirteen goals,
 * and the only constraint of each mechanism demonstration.
 */
const constraintTitle = (id: string): string =>
    String([...TEST_LIBRARY_V0_CONSTRAINTS, ...TEST_LIBRARY_V0_ENVIRONMENTAL_MANIPULATIONS].find(entry => entry.id === id)?.title ?? id)

/** A context as the account names it: its name, its approved scoring condition as authored, and whether it is in the game. */
function contextOf(contextId: string, selection: KnowledgeSelection): ActivityAccount['context'] {
    const condition = rpcLibrary.primaryScoringCondition(contextId)
    return {
        id: contextId,
        name: rpcLibrary.context(contextId)?.name ?? null,
        // Narrative, carried and never parsed - the library's own rule for this property.
        approvedScoringCondition: condition || null,
        inThisActivity: selection.contracted.some(id => knowledgeKey(id) === knowledgeKey(contextId)),
        // B2: only where the context's contract is the draft store's (never in production).
        ...((selection.draftContracts ?? []).some(contract => knowledgeKey(contract.contractId) === knowledgeKey(contextId)) ? { contract: 'DRAFT' as const } : {}),
    }
}

/** A goal's Game Problem authority, as the account names it. */
function gameProblemOf(authority: BoundedSelection['gameProblem']): ActivityAccount['gameProblem'] {
    return {
        status: authority.status,
        gameProblemId: authority.gameProblemId,
        name: authority.gameProblemId ? (gpLibrary.gameProblem(authority.gameProblemId)?.Name ?? null) : null,
        inferredFromWording: authority.inferredFromWording,
        governed: authority.governed,
    }
}

/** Provisional exactly where the Game Problem is UNRESOLVED (his ruling of 14 October, section 5). */
function provisionalOf(authority: BoundedSelection['gameProblem'] | null): Pick<ActivityAccount, 'provisional' | 'provisionalReason'> {
    if (authority?.status !== 'UNRESOLVED') return { provisional: false, provisionalReason: null }
    return {
        provisional: true,
        provisionalReason:
            'no Game Problem is approved for this Learning Goal, so selection followed its wording - which is not an authoritative substitute for an approved mapping (ruling of 14 October)',
    }
}

/** The pool account as the account names it: held constraints by title, and the gap where there is one. */
function constraintSourceOf(pool: ConstraintPoolAccount, gap: SelectionKnowledgeGapReason | null): ActivityAccount['constraintSource'] {
    return {
        source: pool.source,
        constraintAuthority: pool.constraintAuthority,
        constraintPrinciple: pool.constraintPrinciple ? { ...pool.constraintPrinciple, principle: libraryConstraintPrinciple().principle } : null,
        lensAuthority: 'ENGINE_LENS',
        unfilledRoles: [...pool.unfilledRoles],
        heldByRuling: pool.heldByRuling.map(hold => ({ id: hold.id, title: constraintTitle(hold.id), ruledOn: hold.ruledOn })),
        gap,
    }
}

/** The authorization record as the account carries it: whole, a copy, each exclusion with its library title. */
function authorizationOf(record: LearningGoalAuthorization | null): ActivityAccount['authorization'] {
    if (!record) return null
    // His review request (stage K8) is read only by the administrator's review evidence, which quotes it; the account a coach's answer
    // carries leaves it out, so what the coach receives is what it was before the request was recorded.
    const { reviewRequest: _reviewRequest, ...copy }: LearningGoalAuthorization = JSON.parse(JSON.stringify(record))
    return { ...copy, excluded: copy.excluded.map(exclusion => ({ ...exclusion, title: constraintTitle(exclusion.knowledgeId) })) }
}

/** A game form as the account names it. */
function gameFormOf(id: string, contracted: boolean): ActivityAccount['gameForm'] {
    const library: any = TEST_LIBRARY_V0_ARCHETYPES.find(archetype => archetype.id === id)
    return { id, name: library?.game_form_name ? String(library.game_form_name) : null, contracted }
}

/**
 * The selection account, as far as the selection alone establishes it. `preferred` (stage E): the record's preferred realization, as the
 * build resolved it, for the record's lists before any alternative is tried; each alternative tried lists its own.
 */
function accountOf(selection: KnowledgeSelection, goal: BoundedSelection | null, preferred: ProvisionalRealization | null): Partial<ActivityAccount> {
    const contracted = new Set(selection.contracted)
    const form = selection.selected.find(entry => entry.role === 'game form')
    const constraints = selection.selected.filter(entry => entry.role.includes('constraint'))
    // The context has its own entry below, so it is never listed again as a raw id among what has no contract.
    const contexts = new Set(selection.selected.filter(entry => entry.role === CONTEXT_ROLE).map(entry => entry.id))
    const account: Partial<ActivityAccount> = {
        gameProblem: goal ? gameProblemOf(goal.gameProblem) : null,
        contextId: goal ? goal.contextId : null,
        context: goal?.contextId ? contextOf(goal.contextId, selection) : null,
        affordanceLenses: selection.selected
            .filter(entry => entry.role.startsWith(LENS))
            .map(entry => String(TEST_LIBRARY_V0_AFFORDANCE_LENSES.find(lens => lens.id === entry.id)?.title ?? entry.id)),
        constraints: constraints.map(entry => ({
            id: entry.id,
            title: constraintTitle(entry.id),
            contracted: contracted.has(entry.id),
            fromGoalCandidates: goal ? goal.constraintPool.candidateIds.includes(entry.id) : null,
        })),
        constraintSource: goal ? constraintSourceOf(goal.constraintPool, null) : null,
        authorization: goal ? authorizationOf(goal.authorization) : null,
        // Stage E: the record's preferred realization; each alternative the build tries lists its own (below).
        authorizationLists: goal?.authorization ? authorizationLists(goal.authorization, preferred) : null,
        selectedWithoutContract: selection.missing.filter(id => !contexts.has(id)),
        ...provisionalOf(goal ? goal.gameProblem : null),
    }
    if (form) account.gameForm = gameFormOf(form.id, contracted.has(form.id))
    return account
}

/**
 * The account of a goal refused as a knowledge gap: everything selection established before it found the gap
 * — the game form it had committed to, the Game Problem, the context, the roles no candidate fills, what is
 * held — and no constraints, because none was selected.
 */
function gapAccountOf(gap: GoalSelectionGap, preferred: ProvisionalRealization | null): Partial<ActivityAccount> {
    const empty: KnowledgeSelection = { selected: [], contracted: [], missing: [] }
    const contracted = new Set(contractCoverage(gap.gap.archetypeId ? [{ id: gap.gap.archetypeId, role: 'game form' }] : []).contracted)
    return {
        gameProblem: gameProblemOf(gap.gameProblem),
        contextId: gap.contextId,
        context: gap.contextId ? contextOf(gap.contextId, empty) : null,
        affordanceLenses: [],
        constraints: [],
        constraintSource: constraintSourceOf(gap.gap.pool, gap.gap.reason),
        authorization: authorizationOf(gap.authorization),
        authorizationLists: gap.authorization ? authorizationLists(gap.authorization, preferred) : null,
        selectedWithoutContract: [],
        ...provisionalOf(gap.gameProblem),
        ...(gap.gap.archetypeId ? { gameForm: gameFormOf(gap.gap.archetypeId, contracted.has(gap.gap.archetypeId)) } : {}),
    }
}

/**
 * **A session area a realization's starting values were not given for** (15 October 2026, stage K6), or null. The areas are the
 * realization's testing boundaries (data); an area matches as recorded, length and width: the gates read the session's length as the
 * axis length (E2), so a 30 x 40 m session is not the 40 x 30 m area (measured 15 October 2026: its far-end target fell outside).
 * The summary is a DRAFT for his approval; the numbers in it are the session's, never the realization's.
 */
export function testingAreaRefusal(realization: ProvisionalRealization, session: ActivitySession): { summary: string; reasons: string[] } | null {
    const areas = realization.testingBoundaries?.areas
    if (!areas || !areas.length) return null
    const [long, short] = [Number(session.lengthM), Number(session.widthM)]
    if (areas.some(area => area.lengthM === long && area.widthM === short)) return null
    const given = areas.map(area => `${area.lengthM} x ${area.widthM} m`).join(', ')
    const asked = Number.isFinite(long) && Number.isFinite(short) ? `${session.lengthM} x ${session.widthM} m` : 'this'
    return {
        summary: `The starting positions for this activity have not been decided for a ${asked} area.`,
        reasons: [
            `the provisional realization ${realization.provisionalId} gives its starting values for ${given} only (its testing boundaries, ${realization.testingBoundaries!.citedAs}): ${asked} is not one of them`,
        ],
    }
}

/**
 * **The roster rule's cause, as the sentence a coach can act on.** Each is built from the numbers the rule
 * reports and from the role's name as the register gave it; none is written for a particular role.
 *
 * A cause the SESSION can cure is a session refusal — the coach changes the numbers and tries again. A cause
 * in the knowledge is not theirs to cure, so it is reported as the game failing its checks.
 */
function rosterSummary(roster: RosterRefusal): { stage: ActivityStage; summary: string } | null {
    switch (roster.cause) {
        case 'DOES_NOT_DIVIDE':
            // With neutral players in the game the count that fails to divide is what is left once they are
            // taken out, so the sentence says how many there are — or a coach with twelve players is told
            // that twelve cannot be split in two.
            return {
                stage: 'session',
                summary: roster.neutrals
                    ? `${roster.players} player${roster.players === 1 ? '' : 's'} with ${roster.neutrals} neutral player${roster.neutrals === 1 ? '' : 's'} cannot be split into the equal teams this game needs.`
                    : `${roster.players} player${roster.players === 1 ? '' : 's'} cannot be split into the equal teams this game needs.`,
            }
        case 'NO_OUTFIELD_PLAYERS':
            return {
                stage: 'session',
                summary: `${roster.players} player${roster.players === 1 ? ' is' : 's are'} not enough for this game — every team needs at least one outfield player.`,
            }
        case 'CONFIGURATION_DOES_NOT_FIT': {
            /**
             * DRAFT (15 October 2026, stage K4). The counts authored per team fit no allocation of this session's players. His
             * reply filed 18 October 2026, item 7: *"The 11–12-player support and 40 × 30 m prototype values are acceptable
             * current testing boundaries, but they should not become permanent architectural limitations."* So the coach is
             * told the set-up has not been decided for this count — never that the count is wrong. The counts the per-team
             * counts fit stay in the technical reasons only: the K4 work-in-progress told the coach "it has been decided for 11
             * and 12 players", and measured, 11 is then refused at the membership check (his 1(a) keeps 6 + GK v 5, which 11
             * players cannot), so the coach would have been told a count works that does not.
             */
            return {
                stage: 'session',
                summary: `The team set-up for this activity has not been decided for ${roster.players} player${roster.players === 1 ? '' : 's'}.`,
            }
        }
        case 'AVAILABILITY_SHORT':
            return {
                stage: 'session',
                summary:
                    roster.perTeam === null
                        ? `This game needs ${roster.needed} ${roster.role}${roster.needed === 1 ? '' : 's'} in all and the session has ${roster.available}.`
                        : `This game needs ${roster.perTeam} ${roster.role}${roster.perTeam === 1 ? '' : 's'} per team and the session has ${roster.available}.`,
            }
        case 'AVAILABILITY_NOT_STATED':
            return {
                stage: 'session',
                summary: roster.role ? availabilityQuestion(roster.role) : 'Say which specialized players this session has before building an activity.',
            }
        case 'AVAILABILITY_NOT_A_COUNT':
            return { stage: 'session', summary: `The number of ${roster.role}s must be a whole number, 0 or more.` }
        case 'PLAYERS_NOT_STATED':
            return { stage: 'session', summary: 'This session has no player count yet — add the number of players.' }
        default:
            return null
    }
}

/**
 * **The availability rule's cause for the session's objects, as the sentence a coach can act on** — stage E, 23 October 2026 (DRAFT words,
 * built from the kind's name as the register gives it; none is written for a particular kind). Beside the roster's sentences, and typed for
 * the build's loop (`Applicability`): a kind the session has not stated is ASKED (the question channel, `SessionQuestion`), never assumed;
 * too few objects, or none that suit what his words for the realization admit, means this alternative does not apply to the session, so the
 * build may try the next one; suitability nobody has decided, and a count the game itself leaves unsettled, are the knowledge's and the game's,
 * typed as nothing, so they refuse the activity.
 */
function objectSummary(
    refusal: ObjectAvailabilityRefusal,
    subject: string,
    session: ActivitySession,
    boundRegions: SportBoundRegions | null,
    index: ReturnType<typeof indexRegister>,
): { stage: ActivityStage; summary: string; applicability: Applicability | null; question?: SessionQuestion } {
    switch (refusal.cause) {
        case 'OBJECT_ATTRIBUTE_NOT_STATED': {
            const words = objectAvailabilityQuestion(refusal.kind, 'ATTRIBUTE', refusal.attribute)
            const choices = choicesAnswering(objectChoicesOf(refusal.kind, index, boundRegions), refusal.attribute, refusal.widthM, refusal.kind)
            return { stage: 'session', summary: words, applicability: { verdict: 'ASK', cause: 'OBJECT_AVAILABILITY_NOT_STATED' }, question: { kind: 'OBJECT_AVAILABILITY', objectKind: refusal.kind, asks: 'ATTRIBUTE', attribute: { name: refusal.attribute, values: [...refusal.values] }, words, status: 'DRAFT', choices } }
        }
        case 'OBJECT_AVAILABILITY_NOT_STATED': {
            const words = objectAvailabilityQuestion(refusal.kind, refusal.asks)
            // Stage I: the session's own choices for the kind, so the coach can state an authorized object exactly (`SessionQuestion.choices`).
            const choices = objectChoicesOf(refusal.kind, index, boundRegions)
            return { stage: 'session', summary: words, applicability: { verdict: 'ASK', cause: 'OBJECT_AVAILABILITY_NOT_STATED' }, question: { kind: 'OBJECT_AVAILABILITY', objectKind: refusal.kind, asks: refusal.asks, words, status: 'DRAFT', choices } }
        }
        case 'OBJECT_AVAILABILITY_SHORT':
            return {
                stage: 'session',
                summary: `This game needs ${refusal.needed} ${refusal.kind}${refusal.needed === 1 ? '' : 's'} and the session has ${refusal.available}.`,
                applicability: { verdict: 'NOT_APPLICABLE', cause: 'OBJECT_AVAILABILITY_SHORT' },
            }
        case 'OBJECT_NOT_SUITABLE':
            /**
             * Undecided suitability is no fact about the session the coach could change, so it is the knowledge's to say - and, since the
             * stage E fix (23 October 2026, after the stage E review), typed as nothing: it is a gap in the knowledge (his decision 4), not a
             * resource the session lacks, and the design falls back ONLY on a resource shortfall, the testing area or the practice situation.
             * Typed, an alternative nobody has decided the objects of would fall back to the next one quietly, visible only in the account. An
             * alternative waiting on that decision is listed with a gap status instead, and never tried (`realizationAlternativesOf`).
             */
            if (!refusal.decided) return { stage: 'knowledge', summary: `Which ${refusal.kind}s suit this game has not been decided yet.`, applicability: null }
            {
                /**
                 * Stage I (24 October 2026; the d27 design's stage I(b)): the sentence names the authorized objects this realization is built
                 * for in this session (`choicesSuitedTo`: admitted by every suitability rule it reads, with a region that fits the area), by the
                 * labels the session's question offers them under, so a coach who typed a rounded width can choose the object itself (DRAFT).
                 * Where none is, it is said as before.
                 */
                const suited = choicesSuitedTo(refusal.kind, refusal.rules, session, index, boundRegions)
                const builtFor = suited.length ? `; it is built for ${suited.map(choice => choice.label).join(' or ')}` : ''
                return { stage: 'session', summary: `The ${refusal.kind}s this session has do not suit this game${builtFor}.`, applicability: { verdict: 'NOT_APPLICABLE', cause: 'OBJECT_NOT_SUITABLE' } }
            }
        case 'OBJECT_INVOLVEMENT_NOT_SETTLED':
            return { stage: 'structure', summary: `The game this ${subject} selects is not yet described completely enough to be set up.`, applicability: null }
    }
}

/**
 * **The bound-region check's cause, as the sentence a coach can act on** — H3, 23 October 2026 (DRAFT words, built from the region function's
 * token and the object kind as the profile and the register give them, the session's numbers and the area's; none is written for a particular
 * kind). A region the one authorized pairing gives that does not fit the area is the session's (the build may try the next alternative); a
 * region nobody has authorized for the session's object is the knowledge's, typed as nothing, so it refuses (his decision, not the coach's);
 * a binding that is not whole is the game's (structure before realization, validation after it).
 */
function boundRegionSummary(
    refusal: BoundRegionRefusal,
    subject: string,
    session: ActivitySession,
    stage: 'structure' | 'validation',
    boundRegions: SportBoundRegions | null,
    index: ReturnType<typeof indexRegister>,
): { stage: ActivityStage; summary: string; applicability: Applicability | null; question?: SessionQuestion } {
    const words = (token: string) => token.split('-').join(' ')
    switch (refusal.cause) {
        case 'BOUND_REGION_NOT_AUTHORIZED': {
            // H4: the attributes the session states that the pairings were read by, after the width (DRAFT), so a coach sees why a goal of
            // a width an entry pairs is still not paired.
            const stated = Object.entries(refusal.stated ?? {}).map(([attribute, value]) => ` (${attribute}: ${value})`).join('')
            return {
                stage: 'knowledge',
                summary: `The ${words(refusal.regionFunction)} that goes with ${refusal.widthM === null ? `this session's ${refusal.kind}` : `a ${refusal.kind} ${refusal.widthM} m wide${stated}`} has not been decided yet.`,
                applicability: null,
            }
        }
        /**
         * H4 (23 October 2026; register version 22): an attribute of the object a pairing of the stated width reads, which the session does not
         * state - the session's to say, so ASKED through the question channel (reaching the review page and the live route), exactly as an
         * unstated count or width is; the question names the attribute and its closed list, both the register's (DRAFT words).
         */
        case 'BOUND_REGION_OBJECT_NOT_STATED': {
            const asked = objectAvailabilityQuestion(refusal.kind, 'ATTRIBUTE', refusal.attribute)
            // Stage I: the session's own choices that state a value of the attribute, and none (`choicesAnswering`).
            const width = session.objects?.[refusal.kind]?.widthM
            const choices = choicesAnswering(objectChoicesOf(refusal.kind, index, boundRegions), refusal.attribute, width, refusal.kind)
            return {
                stage: 'session',
                summary: asked,
                applicability: { verdict: 'ASK', cause: 'OBJECT_AVAILABILITY_NOT_STATED' },
                question: { kind: 'OBJECT_AVAILABILITY', objectKind: refusal.kind, asks: 'ATTRIBUTE', attribute: { name: refusal.attribute, values: [...refusal.values] }, words: asked, status: 'DRAFT', choices },
            }
        }
        case 'BOUND_REGION_DOES_NOT_FIT':
            return {
                stage: 'session',
                // Z (25 October 2026): a region at a performer's end goes with no object, so it is named by its function alone (DRAFT words).
                summary:
                    refusal.kind === null || refusal.widthM === null
                        ? `The ${words(refusal.regionFunction)} this activity marks does not fit in a ${session.lengthM} x ${session.widthM} m area.`
                        : `The ${words(refusal.regionFunction)} that goes with a ${refusal.kind} ${refusal.widthM} m wide does not fit in a ${session.lengthM} x ${session.widthM} m area.`,
                applicability: { verdict: 'NOT_APPLICABLE', cause: 'BOUND_REGION_DOES_NOT_FIT' },
            }
        case 'BOUND_REGION_INVALID':
            return {
                stage,
                summary: stage === 'structure' ? `The game this ${subject} selects is not yet described completely enough to be set up.` : 'The game built for this activity did not pass its own checks, so it is not being shown.',
                applicability: null,
            }
    }
}

/**
 * **A count the session cannot field at ANY preferred value, as the sentence a coach can act on.**
 *
 * Where the knowledge prefers a range for a count and this session's roster admits none of it, no rule
 * closes the line and realization refuses it as open and unchosen. That is the coach's numbers to change,
 * so it is a `session` refusal and says which counts were tried. It is decided from the roster rule's typed
 * cause for every candidate: where each fails because the players do not come out as whole teams, the
 * sentence below; where each fails for another cause the session can cure, that cause's own sentence; and
 * where a trial never reached the roster, nothing is concluded and the caller falls back to what it said
 * before. The count is the neutral count, the one count the roster rule reads.
 */
function strandedCountSummary(stranded: StrandedCount): { stage: ActivityStage; summary: string } | null {
    if (stranded.path !== 'performers.neutrals.count') return null
    if (!stranded.refusals.length || stranded.refusals.length !== stranded.candidates.length) return null
    const whole = stranded.refusals.filter((roster): roster is Extract<RosterRefusal, { cause: 'DOES_NOT_DIVIDE' | 'NO_OUTFIELD_PLAYERS' }> => roster.cause === 'DOES_NOT_DIVIDE' || roster.cause === 'NO_OUTFIELD_PLAYERS')
    if (whole.length !== stranded.refusals.length) return rosterSummary(stranded.refusals[0])
    const [{ players }] = whole
    const counts = stranded.candidates.length > 1 ? `${stranded.candidates.slice(0, -1).join(', ')} or ${stranded.candidates[stranded.candidates.length - 1]}` : String(stranded.candidates[0])
    const many = stranded.candidates[stranded.candidates.length - 1] !== 1
    return {
        stage: 'session',
        summary: `${players} player${players === 1 ? '' : 's'} cannot be split into equal teams with ${counts} neutral player${many ? 's' : ''}.`,
    }
}

/**
 * **A participant the game requires and its team set-up lacks, as one sentence a coach can read** — 22 October 2026, his reply filed
 * 25 October 2026, item 6: *"Any participant or role required by an activity must actually be present in the authorized
 * configuration."* Chosen from GA-PARTICIPANTS-PRESENT's typed records (`MissingParticipant`), never from the check's prose: the
 * participant by the name the register gives it (a specialized role's own name, a form's DRAFT coachNoun, the outfield noun), the
 * team by the DRAFT role noun of the role it holds in the block. The first record in clause order is said; every record stays in the
 * technical reasons. Not a session refusal: the game's own description names a participant its own set-up does not hold, which no
 * change of the coach's numbers cures (a session that cannot staff a role the game DOES involve is the roster's AVAILABILITY_SHORT,
 * said before this). DRAFT wording.
 *
 * Said at the stage the check decided it (P1b, 22 October 2026, after the P1 review): `validation` over the concrete game, and
 * `structure` where the configuration is already known to lack the participant before realization (a counted group whose count is
 * 0, say) — which used to be told the generic structure sentence, that the game was not described completely enough, though its
 * description was complete and named a participant the game cannot hold. A restart for no particular team (a counted group as
 * taker) is said without one.
 */
function participantSummary(missing: MissingParticipant[], index: ReturnType<typeof indexRegister>, stage: ActivityStage): { stage: ActivityStage; summary: string } | null {
    const [first] = missing
    if (!first) return null
    const noun = first.missing.name ?? 'participant'
    const a = `${/^[aeiou]/i.test(noun) ? 'an' : 'a'} ${noun}`
    const nounsOf = (designations: string[]) =>
        designations.map(name => roleOfHolder(index, name)).filter((role): role is string => !!role && !!index.roleBlocks?.coachNouns[role]).map(role => index.roleBlocks!.coachNouns[role])
    let team: string | null = null
    let gives = 'has none'
    if (first.teams.length === 1) {
        const nouns = nounsOf(first.teams[0].designations)
        team = nouns.length === 1 ? `the ${nouns[0]}` : 'one of the teams'
        gives = nouns.length === 1 ? `gives the ${nouns[0]} none` : 'gives that team none'
    } else if (first.teams.length > 1) {
        team = first.teams.length === 2 ? 'either team' : 'any team'
        gives = first.teams.length === 2 ? 'gives neither team one' : 'gives no team one'
    }
    const summary =
        first.requirement === 'TAKER' || first.requirement === 'BEGIN_ARM'
            ? `This game needs ${a} to restart play${team ? ` for ${team}` : ''}, and the team set-up ${gives}.`
            : first.requirement === 'MOVED'
              ? `This game moves ${a} from ${team ?? 'a team'} when the roles exchange, and the team set-up ${gives}.`
              : `This game needs ${a}${team ? ` for ${team}` : ''}, and the team set-up ${gives}.`
    return { stage, summary }
}

/**
 * **Each missing participant as an administrator's reason** (P1b, 22 October 2026): the requiring element, the row its requirement is
 * read from, what it requires, and what each team (or the game's count row) holds — from the same typed records the coach's sentence is
 * chosen from. Added to a structure refusal, whose reasons otherwise name only the failing check; a validation refusal already carries
 * the check's account in the gates' outstanding entries.
 */
function participantReasons(missing: MissingParticipant[]): string[] {
    return missing.map(entry => {
        const what =
            entry.missing.kind === 'ANY_PERFORMER'
                ? 'performer of any kind'
                : entry.missing.kind === 'COUNTED_GROUP'
                  ? `${entry.missing.name ?? 'member'} counted by ${entry.missing.row}`
                  : `${entry.missing.name ?? entry.missing.row} (${entry.missing.row})`
        const holds = entry.teams.length
            ? entry.teams.map(team => `${team.classId}${team.designations.length ? ` (${team.designations.join(', ')})` : ''} holds ${team.holds}`).join('; ')
            : `game::${entry.missing.row} holds 0`
        return `a participant the game requires is missing (${PARTICIPANTS_CHECK}, ${entry.requirement}): ${entry.element} (${entry.row}) requires ${entry.needed} ${what}; ${holds}`
    })
}

/** A build, with the goal's selection beside it for a caller that has to account for it in its own shape. */
export interface ActivityBuild {
    activity: ServedActivity | RefusedActivity
    /** The Learning Goal's selection. Null for a demonstration, and where selection did not resolve. */
    selection: BoundedSelection | null
    /**
     * **Each served game's input digest, block by block** (the live-app fix, design section 4.3 L3, 22 October 2026): the digest derivation
     * stamps on each block's game (`derivation/engine.ts canonicalInput`: the selection, the contracts, the coach's session, the register's
     * version, the rules and the role block), read from the fixture each block was rendered from. Empty for a refusal. Never part of the
     * served activity, so what a coach is served is unchanged; read only by the live save (`live-activity.ts`), which rebuilds the activity
     * and stores it only where every digest is the one the coach was shown.
     */
    inputDigests: InputDigest[]
}

/** One served game's input digest (L3): the block (ONE_GAME for a game not played in role blocks) and the digest, null where none was stamped. */
export interface InputDigest {
    blockId: string
    inputDigest: string | null
}

export function buildActivity(request: ActivityRequest): ServedActivity | RefusedActivity {
    return buildActivityWithSelection(request).activity
}

export function buildActivityWithSelection(request: ActivityRequest): ActivityBuild {
    const { activity, selection, inputDigests } = build(request, null)
    return { activity, selection, inputDigests }
}

/**
 * **The checked review's build: the same pathway, and — for an administrator only — the draft beside a refusal at communication**
 * (stage K7, 15 October 2026). With `includeDrafts` false this is `buildActivity` exactly (same result, same keys). With it true, a
 * refusal at communication also carries `draft` (`review-draft.ts`): what was rendered and withheld, and fidelity's verdict, never
 * served. The review route sets `includeDrafts` from its existing administrator check (`viewer.permissions.isAdmin === true`); the
 * pilot and the live route never call this.
 */
export function buildActivityForReview(request: ActivityRequest, options: { includeDrafts: boolean }): ServedActivity | RefusedActivity {
    return build(request, null, null, null, learningGoalAuthorizations(), null, { includeDrafts: options.includeDrafts === true }).activity
}

/**
 * **For tests, and for nothing that serves a coach.** The activity together with the rendering fixture it
 * was rendered and checked from — null where the build stopped before there was one.
 *
 * The fidelity check is tested by handing it altered renderings of a real game and asserting that it
 * refuses them, and the game has to be the one a coach would actually be served: the same selection, the
 * same defaults, the same assembler. The only other way to get that fixture into a test is to copy this
 * chain there, which is the fork this module exists to prevent. Neither entry point above returns it, so
 * nothing that serves an activity can come to depend on the fixture's shape.
 */
export function buildActivityWithFixture(request: ActivityRequest): { activity: ServedActivity | RefusedActivity; fixture: Record<string, unknown> | null } {
    const { activity, fixture } = build(request, null)
    return { activity, fixture }
}

/**
 * **For tests, and for nothing that serves a coach.** The identical pathway, run over a COPY of the selected
 * contracts that the caller has altered first.
 *
 * It exists because some of what this pathway must do cannot be shown on the corpus as it stands. No
 * selected game form involves a specialized role today, so the roster rule's whole positive half — a team
 * that HOLDS one, a session that cannot staff it, the sentence a coach is given for each — is unreachable
 * through any goal or demonstration. The first version of the repair was tested only by writing the count
 * straight onto a realized team, and it passed while no authored count could reach a team at all. The other
 * way to test it is a second copy of this chain inside a test, which is the fork this module exists to
 * prevent. So the chain is lent out instead, whole.
 *
 * **It is a separate function so that the two entry points above CANNOT alter knowledge**: neither takes the
 * argument, and the review and the pilot call only those. His rule of 13 October is that learning-design
 * knowledge is never bent *"merely to make those demonstrations pass"*; nothing here is a way to serve an
 * activity, and the copy is discarded with the call — the loader's shared contracts are never touched.
 */
export function buildActivityOverAlteredKnowledge(
    request: ActivityRequest,
    alter: (contracts: LoadedContract[]) => void,
    /**
     * Also tests only, added 15 October 2026 (stage H3): alter a COPY of the realization choices read for the selection.
     * A mechanism proof that changes what a game form leaves open (a target that may be a zone, say) must also change
     * the realizer's choice for that line, or the realizer refuses a choice the copy no longer admits. The files are
     * never written; the copy is discarded with the call.
     */
    options: { alterSupplied?: (supplied: SuppliedRealization) => void } = {},
): ServedActivity | RefusedActivity {
    return build(request, alter, null, null, learningGoalAuthorizations(), options.alterSupplied ?? null).activity
}

/**
 * **For tests, and for nothing that serves a coach.** The identical pathway over a set of knowledge objects
 * named directly — a game form and the objects composed with it — with the fixture it was rendered from.
 *
 * A mechanism has to be shown to COMPOSE with another before it can be called reusable, and his instruction
 * of 13 October is that demonstrations stay few and clearly labelled: a composition is not to become a third
 * demonstration on the page merely so that it can be tested. So the composition is constructed here, by the
 * test that needs it, and run through this one chain rather than through a copy of it. The corpus is not
 * altered and no goal is involved; what comes back is labelled a mechanism demonstration and titled by the
 * ids it was made of, which no page offers.
 */
export function buildActivityFromKnowledge(
    selected: string[],
    session: ActivitySession,
    /**
     * Also tests only, added 15 October 2026 (stage H3): the same COPIES `buildActivityOverAlteredKnowledge` alters — the
     * contracts and the realization choices — for a mechanism proof that needs the fixture it was realized into.
     */
    options: {
        alter?: (contracts: LoadedContract[]) => void
        alterSupplied?: (supplied: SuppliedRealization) => void
        /**
         * B3 (28 October 2026), tests only: attach the relevance trace (`relevance-trace.ts`) for this Game Problem, with the DRAFT join rules the
         * test loaded (`draft-store.ts` `loadRelevanceJoinRules`). A demonstration resolves no Game Problem, so the test names it.
         */
        relevance?: { joinRules: RelevanceJoinRules; gameProblemId: string }
    } = {},
): { activity: ServedActivity | RefusedActivity; fixture: Record<string, unknown> | null } {
    const observed = options.relevance ? { contracts: null as LoadedContract[] | null } : null
    const built = build({ kind: 'mechanism-demonstration', demonstrationId: '', session }, options.alter ?? null, selected, null, learningGoalAuthorizations(), options.alterSupplied ?? null, { includeDrafts: false }, null, undefined, null, observed)
    if (options.relevance && observed) built.activity.relevance = relevanceOfBuilt(built, observed.contracts, null, options.relevance)
    return { activity: built.activity, fixture: built.fixture }
}

/**
 * **For tests, and for nothing that serves a coach.** The identical pathway for a Learning Goal, with the goal's
 * selection altered on a COPY after selection made it.
 *
 * It exists for one state the corpus cannot reach today: a goal whose Game Problem is UNRESOLVED and whose
 * activity is nevertheless served. His ruling of 14 October is that such output is labelled provisional, and
 * no goal is served at all while the contexts lack contracts, so the label could otherwise be shown only on a
 * refusal. A test takes a goal's real selection, changes what it must (for instance, leaves the context out),
 * and sees the label on a served activity. Nothing a coach is served passes through here.
 */
export function buildActivityOverAlteredSelection(
    request: Extract<ActivityRequest, { kind: 'learning-goal' }>,
    alterSelection: (selection: BoundedSelection) => void,
): ServedActivity | RefusedActivity {
    return build(request, null, null, alterSelection).activity
}

/**
 * **For tests, and for nothing that serves a coach.** The identical pathway for a Learning Goal, selected under a
 * COPY of the authorization records — added 15 October 2026.
 *
 * Added to prove, on the real chain, a zero-constraint commitment that production data did not yet allow (his 15
 * October item 1 left Play Out from the Back with no authorized library constraint, and whether it could be built
 * with none was put to him). Since his general principle later that day (16 October reply, item 1) production
 * commits it for any record whose evaluated set is empty, so tests now hand this a deep copy of the records to show
 * the OTHER states — a record not yet evaluated (`authorizedConstraints: null`) staying the gap, or any goal given an
 * evaluated, empty record behaving as Play Out from the Back does. The shared records are never touched, and neither
 * entry point above accepts the argument. (H1 review, 15 October 2026: this note still described the retired
 * per-goal ruling.)
 */
export function buildActivityUnderAuthorizationRecords(
    request: Extract<ActivityRequest, { kind: 'learning-goal' }>,
    records: LearningGoalAuthorization[],
    /**
     * Also tests only: alter a copy of the contracts, or of the selection, exactly as the two entries above do — and (stage K5,
     * 15 October 2026) a copy of the realization input, as `buildActivityOverAlteredKnowledge` does, for a proof that takes a
     * provisional realization's items out on a copy and must take the choices made for them out too.
     */
    options: {
        alter?: (contracts: LoadedContract[]) => void
        alterSelection?: (selection: BoundedSelection) => void
        /** Since stage E (23 October 2026) handed the realization being tried too, so an alteration can be one alternative's alone. */
        alterSupplied?: (supplied: SuppliedRealization, realization: ProvisionalRealization | null) => void
        /**
         * Hardening H1, 21 October 2026, tests only: the same build as an administrator's review asks it (`buildActivityForReview`), so a
         * test can read the admin-only evidence and the coach's answer of one altered build side by side. Absent: a coach's build.
         */
        review?: { includeDrafts: boolean }
        /**
         * Stage E (23 October 2026), tests only: the provisional realizations the records' alternatives are resolved in, in place of the
         * file's - loaded by the same gate (`loadProvisionalRealizations` over a TEST-ONLY copy of the file), so a TEST-ONLY variant is
         * composed exactly as a real one would be. Absent: the file's.
         */
        realizations?: ProvisionalRealization[]
        /**
         * H3 (23 October 2026), tests only: the Sport Profile's bound-region block in place of the file's - a TEST-ONLY copy held to the same
         * validator the file's block is (`boundRegionsRefusals`, which `loadSportBoundRegions` runs), so a TEST-ONLY pairing is held to the
         * gate a real one would be and a copy it refuses throws; or null, none, which stands in for an open decision about the region an
         * object needs (a TEST-ONLY completion naming it so). Absent: the file's. (Until the H4 carry of the H3 review this comment said the
         * validator ran here, and it did not: the copy was only deep-copied.)
         */
        boundRegions?: SportBoundRegions | null
        /**
         * B2 (28 October 2026; E1-lite), tests only: the draft store to build over (`draft-store.ts` `loadDraftStore`, which no production
         * module imports), its contracts made visible to selection's contract coverage and to derivation's input through the selection, its
         * DRAFT records offered beside `records` under their own inverted gate, and the build's answer given a `draftKnowledge` account.
         * Absent: no draft is read, and the build is exactly what it was.
         */
        drafts?: DraftStoreContents
        /**
         * B3 (28 October 2026), tests only: attach the relevance trace (`relevance-trace.ts`) of this build — a composition test made from the
         * draft store, or a goal's build compared beside one — with the DRAFT join rules the test loaded (`loadRelevanceJoinRules`). The Game
         * Problem is the goal's, as selection resolved it, unless the test names one. Absent: no trace, and the build is exactly what it was.
         */
        relevance?: { joinRules: RelevanceJoinRules; gameProblemId?: string }
        /**
         * B4 (28 October 2026), tests only: the classification of the profile's laws by his materiality test that the sport's check reads for
         * a composed activity (`draft-store.ts` `loadLawsMateriality`, our DRAFT reading; or a TEST-ONLY copy of it), held again here to the
         * gate the file is (`lawsMaterialityRefusals`), so a copy it refuses throws. Absent: nothing is classified, as in production, and every
         * owed adaptation counts as MATERIAL.
         */
        lawsMateriality?: LawsMateriality
        /**
         * 29 October 2026, tests only: the requirement bindings an administrator's review build accounts with (`review.includeDrafts`), in place
         * of the production file's — a TEST-ONLY copy, the draft store's (`draft-store.ts` `loadDraftRequirementBindings`), or the two merged
         * (`mergeRequirementBindings`) — held again here to the gate the file is, in the mode it is stamped with (a draft's against `drafts`'
         * contracts), so a copy it refuses throws. Absent: the production file's, read once.
         */
        requirementBindings?: RequirementBindings
        /**
         * 29 October 2026, tests only: handed, block by block, exactly the inputs the requirement account read (`BlockRequirementInputs`), so a
         * test can read the account again over a TEST-ONLY change to the finished game (a value blanked, an element removed) without a second
         * copy of the chain. Only an administrator's review build computes the account, so only it calls this.
         */
        observeRequirementInputs?: (inputs: BlockRequirementInputs) => void
    } = {},
): ActivityBuild & { fixture: Record<string, unknown> | null } {
    // Round 2, R3 NIT 12: a TEST-ONLY option the build would ignore throws, as a refused copy does: only an administrator's review computes the account.
    if ((options.requirementBindings || options.observeRequirementInputs) && options.review?.includeDrafts !== true) {
        throw new Error('TEST-ONLY requirement bindings and their observer are read only by an administrator\'s review build (review: { includeDrafts: true })')
    }
    const givenBindings = (given: RequirementBindings | undefined): RequirementBindings | null => {
        if (!given) return null
        const copy = JSON.parse(JSON.stringify(given)) as RequirementBindings
        const { file: _file, mode, ...raw } = copy
        if (!(BINDINGS_MODES as readonly string[]).includes(mode)) throw new Error(`TEST-ONLY requirement bindings are stamped with no known mode (${JSON.stringify(mode)}; ${BINDINGS_MODES.join(', ')})`)
        const errors = requirementBindingsRefusals(raw, { mode, draftContracts: options.drafts?.contracts })
        if (errors.length) throw new Error(`TEST-ONLY requirement bindings are refused by the gate the file is held to: ${errors.join('; ')}`)
        return copy
    }
    const givenMateriality = (given: LawsMateriality | undefined): LawsMateriality | null => {
        if (!given) return null
        const copy = JSON.parse(JSON.stringify(given)) as LawsMateriality
        const { file: _file, ...raw } = copy
        const errors = lawsMaterialityRefusals(raw, loadSportDefaultLaws())
        if (errors.length) throw new Error(`a TEST-ONLY classification of the laws is refused by the gate the DRAFT file is held to: ${errors.join('; ')}`)
        return copy
    }
    const givenBoundRegions = (block: SportBoundRegions | null | undefined): SportBoundRegions | null | undefined => {
        if (block === undefined || block === null) return block
        const copy = JSON.parse(JSON.stringify(block)) as SportBoundRegions
        const errors = boundRegionsRefusals({ authority: copy.authority, requirements: copy.requirements, pairings: copy.pairings }, indexRegister(loadRegister()))
        if (errors.length) throw new Error(`a TEST-ONLY bound-region block is refused by the validator the Sport Profile's is held to: ${errors.join('; ')}`)
        return copy
    }
    // The selection and the digests (live-app fix, 22 October 2026) are returned too, so a test of the live pathway can run it over COPIES of the
    // records exactly as the live route runs it over the file's (`live-activity.ts`); nothing that serves a coach calls this.
    const drafts = options.drafts ? { store: JSON.parse(JSON.stringify(options.drafts)) as DraftStoreContents, seen: { contracts: null as LoadedContract[] | null } } : null
    const observed = options.relevance ? { contracts: null as LoadedContract[] | null } : null
    const built = build(
        request,
        options.alter ?? null,
        null,
        options.alterSelection ?? null,
        JSON.parse(JSON.stringify(drafts ? [...records, ...drafts.store.records] : records)),
        options.alterSupplied ?? null,
        { includeDrafts: options.review?.includeDrafts === true },
        options.realizations ? JSON.parse(JSON.stringify(options.realizations)) : null,
        givenBoundRegions(options.boundRegions),
        drafts,
        observed,
        givenMateriality(options.lawsMateriality),
        givenBindings(options.requirementBindings),
        options.observeRequirementInputs ?? null,
    )
    if (drafts) built.activity.draftKnowledge = draftKnowledgeAccountOf(drafts.store, built, drafts.seen.contracts)
    if (options.relevance && observed) built.activity.relevance = relevanceOfBuilt(built, observed.contracts, request.goalId, options.relevance)
    return built
}

/**
 * **The relevance trace of a TEST-ONLY build** (B3, 28 October 2026; `relevance-trace.ts`): read from what the build hands back — the review
 * evidence's own element provenance where the build made one (merged across role blocks), else the reading the draft account uses on the one
 * game (`elementProvenanceOf` over the contracts this attempt derived from) — with every block's game, and the Game Problem selection resolved
 * unless the test names one. Never called on a route: only `buildActivityUnderAuthorizationRecords` and `buildActivityFromKnowledge` reach it.
 */
function relevanceOfBuilt(
    built: { activity: ServedActivity | RefusedActivity; fixture: Record<string, unknown> | null },
    contracts: LoadedContract[] | null,
    learningGoalId: string | null,
    given: { joinRules: RelevanceJoinRules; gameProblemId?: string },
): RelevanceTrace {
    const activity = built.activity
    const fixture: any = built.fixture
    const index = indexRegister(loadRegister())
    const blocks: any[] = Array.isArray(fixture?.roleBlocks?.blocks) ? fixture.roleBlocks.blocks : []
    const games = fixture ? (blocks.length ? blocks.map(block => ({ blockId: String(block.blockId), holders: { ...(block.holders ?? {}) }, fixture: block.fixture })) : [{ blockId: ONE_GAME, holders: {}, fixture }]) : []
    const composed: RenderedActivity =
        activity.outcome === 'served'
            ? activity.rendered
            : activity.draft
              ? ({ instructions: activity.draft.instructions, withheld: activity.draft.withheld } as unknown as RenderedActivity)
              : ({ instructions: [], withheld: [] } as unknown as RenderedActivity)
    const elements =
        activity.evidence?.provenance?.elements ??
        (fixture && contracts
            ? elementProvenanceOf({
                  blocks: [{ blockId: ONE_GAME, holders: {}, fixture, contracts, rendered: composed, findings: [], gateChecks: [], owed: [] }],
                  composed,
                  adjustments: new Map(),
                  relationships: new Map(contextRelationships().map(relationship => [relationship.id, relationship] as const)),
                  index,
                  defaultLaws: null,
              }).elements
            : [])
    return relevanceTraceOf({
        elements,
        contracts: contracts ?? [],
        games,
        gameProblemId: given.gameProblemId ?? activity.account?.gameProblem?.gameProblemId ?? null,
        learningGoalId,
        index,
        joinRules: given.joinRules,
    })
}

/**
 * **The account of a build made from the draft store** (B2, 28 October 2026; `DraftKnowledgeAccount`): read from the derivation input the
 * build last assembled (after any TEST-ONLY alteration, so it describes what was derived), the selection, and the game as built.
 */
function draftKnowledgeAccountOf(store: DraftStoreContents, built: ActivityBuild & { fixture: Record<string, unknown> | null }, derived: LoadedContract[] | null): DraftKnowledgeAccount {
    const isDraft = (contract: LoadedContract) => contract.knowledgeVersion === DRAFT_KNOWLEDGE_VERSION || (contract.items ?? []).some(item => item.category === DRAFT_KNOWLEDGE)
    const input = derived ?? []
    const activity = built.activity
    const composed: RenderedActivity =
        activity.outcome === 'served'
            ? activity.rendered
            : activity.draft
              ? ({ instructions: activity.draft.instructions, withheld: activity.draft.withheld } as unknown as RenderedActivity)
              : ({ instructions: [], withheld: [] } as unknown as RenderedActivity)
    const block: EvidenceBlock = { blockId: ONE_GAME, holders: {}, fixture: built.fixture, contracts: input, rendered: composed, findings: [], gateChecks: [], owed: [] }
    return {
        status: 'BUILT_FROM_DRAFT_KNOWLEDGE_NOT_APPROVED',
        store: { folder: store.folder, files: [...store.files], notRead: store.notRead.map(entry => ({ ...entry })) },
        records: store.records.map(record => record.learningGoalId),
        contracts: input.filter(isDraft).map(contract => ({ contractId: contract.contractId, items: (contract.items ?? []).filter(item => item.category === DRAFT_KNOWLEDGE).map(item => item.itemId) })),
        declarations: input.flatMap(contract =>
            ((contract.declarations ?? []) as any[])
                .filter(declaration => declaration?.category === DRAFT_KNOWLEDGE)
                .map(declaration => ({ contractId: contract.contractId, row: String(declaration.row), selector: declaration.selector ?? null, declaration: String(declaration.declaration), note: declaration.note ?? null })),
        ),
        elements:
            built.fixture && derived
                ? elementProvenanceOf({
                      blocks: [block],
                      composed,
                      adjustments: new Map(),
                      relationships: new Map(contextRelationships().map(relationship => [relationship.id, relationship] as const)),
                      index: indexRegister(loadRegister()),
                      defaultLaws: null,
                  }).elements
                : null,
    }
}

function build(
    request: ActivityRequest,
    alter: ((contracts: LoadedContract[]) => void) | null,
    /** Tests only (`buildActivityFromKnowledge`): the knowledge objects to compose, in place of a named demonstration's. */
    composed: string[] | null = null,
    /** Tests only (`buildActivityOverAlteredSelection`): alters a copy of a goal's selection. */
    alterSelection: ((selection: BoundedSelection) => void) | null = null,
    /** Tests only (`buildActivityUnderAuthorizationRecords`): the authorization records selection consults. */
    records: LearningGoalAuthorization[] = learningGoalAuthorizations(),
    /** Tests only (`buildActivityOverAlteredKnowledge`): alters a copy of the realization choices (since stage E, given the realization tried). */
    alterSupplied: ((supplied: SuppliedRealization, realization: ProvisionalRealization | null) => void) | null = null,
    /** The admin-only review (`buildActivityForReview`, stage K7): attach the draft to a refusal at communication. */
    review: { includeDrafts: boolean } = { includeDrafts: false },
    /**
     * Tests only (`buildActivityUnderAuthorizationRecords`, stage E): the provisional realizations a record's alternatives are resolved in, in
     * place of the file's (a TEST-ONLY variant, say). Null: the file's (`provisionalRealizationNamed`).
     */
    realizations: ProvisionalRealization[] | null = null,
    /**
     * Tests only (`buildActivityUnderAuthorizationRecords`, H3): the Sport Profile's bound-region block in place of the file's (a TEST-ONLY
     * copy), or null for none. Undefined: the file's (`loadSportBoundRegions`), read once here for every game of this build.
     */
    boundRegionsGiven: SportBoundRegions | null | undefined = undefined,
    /**
     * B2, tests only (`buildActivityUnderAuthorizationRecords` with a draft store): the store, threaded into the goal's selection, and where
     * the derivation input each attempt assembles is noted for the build's `draftKnowledge` account. Null: no draft is read.
     */
    drafts: { store: DraftStoreContents; seen: { contracts: LoadedContract[] | null } } | null = null,
    /** B3, tests only (a build asked for its relevance trace): where the derivation input each attempt assembles is noted. Null: nothing is. */
    observed: { contracts: LoadedContract[] | null } | null = null,
    /**
     * B4, tests only (`buildActivityUnderAuthorizationRecords` `lawsMateriality`): the classification the sport's check reads for a composed
     * activity. Null: none, as in production, so every owed adaptation counts as MATERIAL.
     */
    lawsMateriality: LawsMateriality | null = null,
    /** 29 October 2026, tests only (`buildActivityUnderAuthorizationRecords` `requirementBindings`): the bindings, already held to their gate. Null: the file's. */
    requirementBindingsGiven: RequirementBindings | null = null,
    /** 29 October 2026, tests only (`observeRequirementInputs`): handed each block's requirement-account inputs. Null: nothing is. */
    observeRequirements: ((inputs: BlockRequirementInputs) => void) | null = null,
): ActivityBuild & { fixture: Record<string, unknown> | null } {
    const boundRegions: SportBoundRegions | null = boundRegionsGiven === undefined ? loadSportBoundRegions() : boundRegionsGiven
    // B2 (28 October 2026): the playing environment's elements, read once for every game of this build (the guard in `buildOneGame`).
    const environment: SportEnvironmentElements | null = loadSportEnvironmentElements()
    /**
     * The requirement account's bindings (his reply filed 3 November 2026, section 2), for an administrator's review build only: null for every
     * other build, so a coach's, the live route's, the save's and the pilot's never read the file, never compute the account, and cannot be
     * touched by either, even by a throw. Read once (`requirementBindingsLoad`); a refused file becomes the account's own status.
     */
    const requirements: GameContext['requirements'] = !review.includeDrafts
        ? null
        : requirementBindingsGiven
          ? { bindings: requirementBindingsGiven, refused: null, observe: observeRequirements }
          : (load => ({ bindings: load.bindings, refused: load.why ? [load.why] : null, observe: observeRequirements }))(requirementBindingsLoad())
    const { kind, title, subtitle } = composed ? { kind: 'mechanism-demonstration' as const, title: composed.join(' + '), subtitle: null } : describeRequest(request)
    // "This goal …" for a Learning Goal and "This demonstration …" for a demonstration: a demonstration is
    // never described to a coach as a goal, in a refusal any more than in a title.
    const subject = kind === 'learning-goal' ? 'goal' : 'demonstration'
    let account: Partial<ActivityAccount> = {}
    let goalSelection: BoundedSelection | null = null
    // Set once the game is closed and assembled; null for every refusal before that.
    let fixture: any = null
    /**
     * Stage E: where a record's realization is found - the file's (`provisionalRealizationNamed`), or a test's TEST-ONLY set - read once
     * here for every reader in this build (the account below, and each alternative the loop tries), so none re-reads the file.
     */
    const resolveRealization = (id: string): ProvisionalRealization => {
        if (!realizations) return provisionalRealizationNamed(id)!
        const found = realizations.find(candidate => candidate.provisionalId === id)
        if (!found) throw new Error(`a record names the provisional realization ${id}, which the realizations given do not hold`)
        return JSON.parse(JSON.stringify(found)) as ProvisionalRealization
    }
    const preferredRealizationOf = (record: LearningGoalAuthorization | null): ProvisionalRealization | null => {
        const preferred = realizationAlternativesOf(record).find(alternative => alternative.selectable)
        return preferred ? resolveRealization(preferred.realization) : null
    }
    // Stage E: a typed applicability refusal carries its type for the realization loop, and an ASK its question for the coach.
    const refuse = (stage: ActivityStage, summary: string, reasons: string[], applicability: Applicability | null = null, question: SessionQuestion | null = null): Attempt => ({
        activity: { outcome: 'refused', kind, title, stage, summary, reasons, account, ...(question ? { question } : {}) },
        selection: goalSelection,
        inputDigests: [],
        fixture,
        ...(applicability ? { applicability } : {}),
    })

    /**
     * **Selection first, and for a goal it must have RESOLVED.** `selectFor` throws where the status is
     * `fallback` or `unresolved`, which is the invariant his 8 October ruling put at that boundary: *"fallback
     * and unresolved selections must not proceed as successful Learning Goal selections."* The goal and its
     * practice situation were checked to exist above, so a throw here is that invariant and nothing else.
     */
    let selection: KnowledgeSelection
    if (composed) {
        selection = demonstrationSelection(composed)
    } else if (request.kind === 'learning-goal') {
        try {
            goalSelection = selectFor(
                request.goalId,
                request.situationId ?? null,
                records,
                realizations ? realizations.map(realization => realization.provisionalId) : undefined,
                drafts ? { contracts: drafts.store.contracts, draftsAdmitted: true } : undefined,
            )
        } catch (error) {
            /**
             * **A knowledge gap is told apart from a selection that did not resolve.** Christian, 14 October
             * 2026: *"If no appropriate shaping constraint is available, please report that as a knowledge gap
             * … Please keep those gaps visible rather than compensating through fallback selection."* The
             * goal's own candidates cannot be combined on the game form selection chose, so it is refused with
             * its own sentence and an account that shows how far selection got — not the generic sentence,
             * with an empty account, that said the goal connects to no game knowledge.
             */
            if (error instanceof GoalSelectionGap) {
                account = gapAccountOf(error, preferredRealizationOf(error.authorization))
                return refuse('selection', "This goal's designated constraints cannot yet be combined into a game, so no activity can be built for it.", [
                    `selection: ${error.message}`,
                ])
            }
            return refuse('selection', `This ${subject} does not yet connect to any game knowledge, so no activity can be built for it.`, [
                `selection: ${error instanceof Error ? error.message : String(error)}`,
            ])
        }
        if (alterSelection) {
            goalSelection = JSON.parse(JSON.stringify(goalSelection)) as BoundedSelection
            alterSelection(goalSelection)
            Object.assign(goalSelection, contractCoverage(goalSelection.selected, goalSelection.draftContracts ?? []))
        }
        selection = goalSelection
    } else {
        selection = demonstrationSelection(mechanismDemonstration(request.demonstrationId)!.selected)
    }
    account = accountOf(selection, goalSelection, preferredRealizationOf(goalSelection?.authorization ?? null))

    /**
     * **A game form with no contract is refused HERE, before derivation, and in its own words.** Derivation
     * would run without it — it derives from whatever contracts it is given — and what comes out is a game
     * made of the constraints alone, which then fails a gate for a reason about a modifier or a direction.
     * That reason is true and it is not the reason: the game form has not been built. Measured 13 October on
     * the goals whose form is uncontracted, each of which reported a different downstream check.
     */
    if (!account.gameForm) {
        return refuse('selection', `This ${subject} does not yet connect to any game knowledge, so no activity can be built for it.`, [
            'selection committed to no game form',
        ])
    }
    if (!account.gameForm.contracted) {
        return refuse('knowledge', `This ${subject} uses a game form that has not been built into the activity engine yet.`, [
            `the game form ${account.gameForm.id} has no contribution contract`,
        ])
    }

    /**
     * **A held object never reaches a Learning Goal's activity — made structural, not left to selection.**
     * Christian, 14 October 2026: *"Please keep the current Pass Combination Gate as a mechanism demonstration
     * only. I do not want it reintroduced into learning-design examples until we've reviewed its ecological
     * suitability"* — and of his answers about the gate's knowledge, *"This does not approve the gate for use
     * with any Learning Goal."*
     *
     * Selection already leaves a held object out of every goal's pool (`constraintPoolFor`). This is the belt
     * beside those braces, read from the SAME holds file, so the two can never disagree about what is held:
     * his answers change the gate's knowledge, and once that knowledge can pass its gates nothing else would
     * stop a goal's activity carrying it. Demonstrations are untouched — that is where a held object stays
     * usable — and so is every candidate pool.
     *
     * **Matched by knowledge key, the key derivation loads a contract by** (S-B review, 14 October 2026).
     * `derivationInputFor` folds every spelling of an object — library id, contract id, bare key, any case — to
     * one `knowledgeKey` and loads its contract; compared as text, the gate under another spelling reached
     * derivation past this guard (measured). The guard must hold exactly what derivation would load.
     */
    if (kind === 'learning-goal') {
        const holdOf = (id: string) => learningGoalSelectionHolds().find(hold => knowledgeKey(hold.knowledgeId) === knowledgeKey(id)) ?? null
        const held = selection.selected.filter(entry => holdOf(entry.id))
        if (held.length) {
            return refuse('knowledge', 'This goal selects a rule that has not been approved for learning-design activities yet.', [
                ...held.map(entry => {
                    const hold = holdOf(entry.id)!
                    return `${entry.id} is held out of Learning Goal activities by ruling of ${hold.ruledOn}: a mechanism demonstration only (${hold.mechanismDemonstration})`
                }),
            ])
        }

        /**
         * **What a goal's authorization record excludes never reaches THAT goal's activity** — 15 October 2026, the
         * same belt-and-braces as the hold above, for one goal rather than all. Christian, item 7: *"Please leave
         * Wide Zone Advantage out of this initial Play Out from the Back demonstration."* The record authorizes
         * nothing it excludes (its loader refuses that), so selection cannot pick it; this guard is what stops a later
         * selection change, or an altered selection, carrying it in anyway. Matched by knowledge key, as the hold is,
         * and read from the record selection used. An exclusion that cross-references the holds file is refused above.
         */
        const exclusions = goalSelection?.authorization?.excluded ?? []
        const excludedOf = (id: string) => exclusions.find(exclusion => knowledgeKey(exclusion.knowledgeId) === knowledgeKey(id)) ?? null
        const excluded = selection.selected.filter(entry => excludedOf(entry.id))
        if (excluded.length) {
            return refuse('knowledge', "This goal selects a rule that has been excluded from this goal's activities.", [
                ...excluded.map(entry => `${entry.id} is excluded from ${goalSelection!.goalId}'s activities by ruling of ${excludedOf(entry.id)!.ruledOn} (its authorization record)`),
            ])
        }
    }

    /**
     * **A goal whose context has no contract is refused HERE, before derivation.** Christian, 14 October
     * 2026: *"the Primary Scoring Event and qualifying condition approved for each Representative Performance
     * Context should govern the generated activity … an activity intended to develop defensive organization
     * should not rely exclusively on the attacking team's progression as its measure of success when the
     * approved context specifies a defensive outcome."*
     *
     * Derivation would run without the context, and the game would be scored by the game form's set-up
     * choice — which is how A04, D01 and D03 came to be served scored on an event their contexts do not
     * approve. Without a contract the approved event and condition cannot reach the game, so nothing is
     * served in their place. After the game-form check, so a goal with no game at all says that first.
     */
    const context = selection.selected.find(entry => entry.role === CONTEXT_ROLE)
    if (context && !selection.contracted.includes(context.id)) {
        return refuse('knowledge', "The scoring this goal's context calls for has not been built into the activity engine yet, so no activity can be built for it.", [
            `the Representative Performance Context ${context.id} has no contribution contract, so its approved primary scoring event and qualifying condition cannot govern the game`,
        ])
    }

    /**
     * **A constraint the goal's record authorizes and the engine cannot build is refused, never dropped** (E2, 27 October 2026; the summary
     * is DRAFT coach wording, for his review). Until E2 a selected constraint with no contribution contract was only listed
     * (`selectedWithoutContract`) and the game was derived without it, so an activity his record governs could be served without a
     * constraint the record authorizes, and nothing a coach reads said so. Read from the record and the selection alone, for any record
     * (no goal, context or constraint is named): only on a record-backed selection, and only for a constraint the record authorizes, matched
     * by knowledge key as the hold and the exclusion are. A constraint a record does not authorize is the live route's G2 refusal
     * (`unauthorizedConstraints`), and a goal whose pool comes from vocabulary keeps listing what has no contract.
     */
    const recordBacked = goalSelection?.constraintPool.source === 'AUTHORIZATION_RECORD'
    const authorizedByRecord = new Set((goalSelection?.authorization?.authorizedConstraints ?? []).map(knowledgeKey))
    const unbuilt = recordBacked ? selection.selected.filter(entry => entry.role.includes('constraint') && selection.missing.includes(entry.id) && authorizedByRecord.has(knowledgeKey(entry.id))) : []
    if (unbuilt.length) {
        return refuse(
            'knowledge',
            "This goal's authorized constraints have not all been built into the activity engine yet, so no activity can be built for it.",
            unbuilt.map(entry => `the authorized constraint ${entry.id} has no contribution contract, so it cannot shape the game, and it is not dropped silently`),
        )
    }

    /**
     * **One alternative realization, built through to communication or to the stage it stopped at** — stage E, 23 October 2026. Everything
     * from here on is what this function always did for the one realization a goal's record named (unchanged, and measured so: every goal
     * and demonstration answers as before), now run once per alternative the build tries, with the realization being tried threaded through
     * the selection (`KnowledgeSelection.realization`) so that derivation's input, the realization choices, the practice situations it was
     * designed for, its testing area, the record's lists and the allocation account all read the SAME realization: the design's Stage E,
     * *"Thread the alternative being tried through every reader of the single id, or the loop would derive A01-R1's items and choices under
     * an A01-R2 label"*. `undefined` threads nothing (a demonstration, or a goal whose record names no realization), exactly as before.
     */
    const chosenSelection = selection
    const attempt = (realization: ProvisionalRealization | null | undefined): Attempt => {
        const selection: KnowledgeSelection = realization === undefined ? chosenSelection : { ...chosenSelection, realization }
        /**
         * **A goal whose authorization record names something the activity needs and does not have is refused HERE,
         * naming each one** — added 15 October 2026 (stage H3). Christian, 16 October reply, item 10: *"if the existing
         * game form cannot represent the intended learning environment, I would rather see a clear refusal and a narrowly
         * described gap than an activity that is technically valid but solves a different problem."* A record entry whose
         * status is MISSING_KNOWLEDGE or MISSING_CAPABILITY is exactly such a gap, with the decisions and capabilities that
         * would close it; `neededRecordGaps` reads them, for whichever goal the record belongs to (no goal is named here).
         *
         * **Why before derivation, not after `structure`.** The record speaks about the activity his rulings ask for (for
         * the first such goal, an asymmetric game with its roles, targets, starts and restarts). Derivation can only check the game
         * the knowledge holds today, and a game that passed every structural check would still be the "technically valid"
         * game that "solves a different problem". So the record's gaps come first, at `knowledge` beside the other
         * knowledge refusals (which they follow, so a game form or context that is not built at all still says that first).
         * Nothing is hidden: the structural stops behind them are measured and pinned on copies whose record has no gap
         * entry (activity-review.unit.ts). A tightening: a record with no such entry, and every goal without a record,
         * goes on exactly as before.
         */
        /**
         * **A provisional realization is built only for the practice situations it was designed for** — 15 October 2026 (stage
         * K2). His decisions of 17 October describe one activity; where the coach chooses a practice situation the realization
         * his record names lists as not designed for, the combination is refused, naming it, rather than built from choices made
         * for another situation. Read from the realization's own data (`notWithPracticeSituations`), so no goal and no
         * situation is named here. Before the record's gaps: it says what this request asks for that the activity does not
         * cover, which no answer to those gaps would change.
         *
         * Stage E (23 October 2026): of the realization being tried (`realizationOf`, the alternative threaded through the selection), and
         * typed PRACTICE_SITUATION, so the build may try the next alternative the record authorizes.
         */
        const provisionalRealization = realizationOf(selection)
        // Stage E: an alternative's refusal before derivation (its practice situation) carries that alternative's lists, never those of the
        // record's preferred one; the lists are read again below from the realization derivation received. Untouched where none is threaded.
        if (realization !== undefined && goalSelection?.authorization) account.authorizationLists = authorizationLists(goalSelection.authorization, provisionalRealization)
        const notFor = provisionalRealization && goalSelection?.chosenSituation ? provisionalRealization.notWithPracticeSituations.find(situation => situation.id === goalSelection!.chosenSituation!.id) : null
        if (provisionalRealization && notFor) {
            return refuse(
                'knowledge',
                "This goal's first activity was not designed for the chosen practice situation, so no activity can be built for it.",
                [`the provisional realization ${provisionalRealization.provisionalId} named by the authorization record of ${goalSelection!.goalId} was not designed for the practice situation ${notFor.id} (${notFor.basis}): ${notFor.because}`],
                { verdict: 'NOT_APPLICABLE', cause: 'PRACTICE_SITUATION' },
            )
        }

        // The coach's envelope, whole. It used to be spread over the corpus envelope, which is how the pilot
        // came to inherit a statement about specialized roles that nobody had made for it. The session's objects (stage E) are copied
        // with it where it states them, so a session stating none hands derivation exactly the envelope it did.
        const session = request.session
        const input: any = {
            ...derivationInputFor(selection),
            envelope: { ...session, roles: { ...session.roles }, ...(session.objects ? { objects: JSON.parse(JSON.stringify(session.objects)) } : {}) },
        }
        if (alter) {
            // The loader returns SHARED contract objects, so the alteration is made to a copy and to nothing else.
            input.contracts = JSON.parse(JSON.stringify(input.contracts))
            alter(input.contracts)
        }
        /**
         * **What defers to a knowledge-authorized realization is set aside HERE, once, for every reader** — 15 October 2026 (stage
         * K4, ruling C56). Christian, reply filed 17 October 2026, D6: *"please document it as a knowledge-authorized realization,
         * preserving equal numbers as an alternative."* After any alteration (so a test's copy is judged as it stands) and before
         * anything reads the contracts, so derivation, the role blocks, the roster and the post-realization comparisons all see
         * the same composition; the deferred item travels beside its contract and into the fixture as the alternative. Where no
         * selected contribution cites a confirmed relationship nothing moves, and the input is the same objects as before.
         */
        /**
         * Stage A (22 October 2026): read with the context relationships of every kind the records hold (`contextRelationships`, the design's
         * X3: the deferral's input is kind-neutral), and the items a ruled restatement marked as yielding for one role recorded beside their
         * contracts in the same pass (`applyRoleYields`, which moves nothing; GA-ROLE-EVENTS clause 6 reads it). Neither changes anything in a
         * composition that cites no such relationship, so every activity's input is the same objects as before.
         */
        const relationships = contextRelationships()
        const deferral = applyRealizationDeferrals(input.contracts as LoadedContract[], relationships, indexRegister(input.register))
        input.contracts = applyRoleYields(deferral.contracts, relationships, indexRegister(input.register))
        // B2, tests only: what this attempt derives from, for the draft-knowledge account (a copy; nothing reads it back into the build).
        if (drafts) drafts.seen.contracts = JSON.parse(JSON.stringify(input.contracts)) as LoadedContract[]
        // B3, tests only: the same, for a build asked for its relevance trace.
        if (observed) observed.contracts = JSON.parse(JSON.stringify(input.contracts)) as LoadedContract[]
        /**
         * **The record's lists read the provisional realization derivation actually received** (15 October 2026, stage K2), so
         * the review page and the game can never disagree about which provisional choices shaped it. Production passes the
         * file's own copy; a test that altered a copy of the contracts sees its copy listed. Stage E: the realization being tried.
         */
        if (goalSelection?.authorization && provisionalRealization) {
            const received = (input.contracts as LoadedContract[]).find(contract => contract.contractId === provisionalRealization.contractId) as ProvisionalRealization | undefined
            account.authorizationLists = authorizationLists(goalSelection.authorization, received ?? null)
            const allocation = allocationAccountOf(goalSelection.authorization, received ?? null, deferral.deferred)
            if (allocation) account.allocation = allocation
        }

        /**
         * The record's gaps refuse here — after the input is assembled (stage K4 moved this below it, so the technical account of
         * a refusal carries the allocation's authority too; assembling the input refuses nothing, so the order of refusals a
         * coach can meet is unchanged).
         */
        const recordGaps = goalSelection?.authorization ? neededRecordGaps(goalSelection.authorization) : []
        if (recordGaps.length) {
            return refuse('knowledge', "This goal's activity depends on set-up decisions and engine capabilities that are not in place yet, so no activity can be built for it.", [
                `${recordGaps.length} part${recordGaps.length === 1 ? '' : 's'} of the activity the authorization record of ${goalSelection!.goalId} asks for ${recordGaps.length === 1 ? 'is' : 'are'} not in place yet`,
                ...recordGaps.map(gap => `${gap.from} "${gap.label}" is ${gap.status} (${gap.category}), waiting on ${gap.gaps.map(named => named.id).join(', ')}`),
            ])
        }

        /**
         * **Starting values given for one area are built for that area only** — 15 October 2026 (stage K6); the coach's sentence is a
         * DRAFT. Christian, reply filed 18 October 2026, item 3: *"The pressure reference should be adjustable in either direction. Twenty
         * meters is our initial hypothesis, not a canonical distance or a requirement for other field sizes."* Item 7: *"The 11–12-player
         * support and 40 × 30 m prototype values are acceptable current testing boundaries, but they should not become permanent
         * architectural limitations."* His values are metres for the prototype area, so a realization whose testing boundaries list the
         * areas they were given for is built only for those areas, as recorded; any other area is told the starting positions have
         * not been decided for it, never that it is wrong. Read from the realization derivation received, so no area, goal or value is
         * named here; a realization listing no areas is untouched. A session refusal: the coach can change the area.
         *
         * Stage E (23 October 2026): of the realization being tried, and typed TESTING_AREA, so the build may try the next alternative.
         */
        {
            const received = provisionalRealization ? ((input.contracts as LoadedContract[]).find(contract => contract.contractId === provisionalRealization.contractId) as ProvisionalRealization | undefined) : undefined
            const refusal = received ? testingAreaRefusal(received, session) : null
            if (refusal) return refuse('session', refusal.summary, refusal.reasons, { verdict: 'NOT_APPLICABLE', cause: 'TESTING_AREA' })
        }

        /**
         * What crosses with every game of this build into its fixture (stage K4): the adjustments the goal's record authorizes, in
         * his words, and what defers in this composition, listed as the alternative. Both absent for every other activity.
         */
        // `coachWords` (stage K7): our DRAFT coach wording beside his words, carried only where an entry has it (his words are not always
        // a sentence a coach can be given as a choice: "The pressure reference should be adjustable in either direction.").
        /**
         * `moves` (P2, 25 October 2026): the role whose position an adjustment's magnitude changes, carried only for such an adjustment (the
         * same reading the physical layout makes, `layoutMoversOf`: its parameter a Position Magnitude of the EM schema, and its role), so the
         * renderer can say how far the line it moves may go, read from the bounds on that line (`adjustment-range.ts`), and fidelity can hold
         * that to the bounds. His reply filed 28 October 2026, item 2: "The coach should retain flexibility to adjust it within a valid range".
         */
        const movers = new Map(layoutMoversOf(goalSelection?.authorization).map(mover => [mover.id, mover.role]))
        const adjustments = (goalSelection?.authorization?.authorizedAdjustments?.entries ?? []).map(entry => ({
            id: entry.id,
            words: entry.words,
            consequence: entry.consequence,
            citedAs: entry.citedAs,
            ...(typeof entry.coachWords === 'string' ? { coachWords: entry.coachWords } : {}),
            ...(movers.has(entry.id) ? { moves: { role: movers.get(entry.id)! } } : {}),
        }))
        const alternatives = deferral.deferred.map(alternativeOf)
        const game: GameContext = { subject, session, selection, context, alterSupplied, adjustments, alternatives, boundRegions, environment, requirements }
        /**
         * A game built through to communication becomes the served activity; one refused on the way says where. `games` are the games it was
         * rendered from, each with its block id, for the input digests the live save compares (L3, 22 October 2026); nothing served carries them.
         */
        const serve = (built: Extract<GameOutcome, { outcome: 'built' }>, extra: Partial<ServedActivity>, games: { blockId: string; fixture: any }[]): ActivityBuild & { fixture: Record<string, unknown> | null } => ({
            activity: { outcome: 'served', kind, title, subtitle, session, rendered: built.rendered, account: account as ActivityAccount, integrity: built.integrity, ...extra },
            selection: goalSelection,
            inputDigests: games.map(game => ({ blockId: game.blockId, inputDigest: typeof game.fixture?.provenance?.inputDigest === 'string' ? game.fixture.provenance.inputDigest : null })),
            fixture: built.fixture,
        })
        /**
         * Stage 3A: the Coach Overview's purpose, game sentence and parameters, for an administrator's review only (`overviewDraft`). The
         * purpose is the goal's (a demonstration has none); the game and parameters are read from each game served. Whatever goes wrong is a
         * gap inside it, never a refusal: the activity is served or refused exactly as it would be without it. Stage 3C: each game's own render
         * is handed in, so how each team scores is composed from exactly the Details that game says.
         */
        const purposeGoal = kind === 'learning-goal' && request.kind === 'learning-goal' ? request.goalId : null
        /**
         * Stage 3D: the overview, composed from the games as served, checked against each game's own Details (Q7) and against the Details a
         * coach is served, for EVERY build that serves (a coach's and an administrator's alike). Served (`overview`) only where it agrees; the
         * draft with the check's findings goes to an administrator only (`overviewDraft`, and the review evidence where the record asks for
         * one). Whatever fails withholds the overview only.
         */
        const overviewOf = (games: { blockId: string; fixture: any; rendered: { instructions: Instruction[] } }[], served: Instruction[]): OverviewOutcome => {
            try {
                return overviewForServing({ goalId: purposeGoal, games, served })
            } catch (error) {
                const draft = failedOverviewDraft(error instanceof Error ? error.message : String(error))
                return { overview: null, draft, evidence: overviewEvidenceOf(draft) }
            }
        }
        const overviewKeys = (outcome: OverviewOutcome): Partial<ServedActivity> => ({
            ...(outcome.overview ? { overview: outcome.overview } : {}),
            ...(review.includeDrafts ? { overviewDraft: outcome.draft } : {}),
        })

        /**
         * **A game played in role blocks is built twice: one complete game per block, then the blocks against each other** —
         * added 15 October 2026 (stage K3). Christian, reply filed 17 October 2026, M1: *"Keep role assignments separate from
         * fixed ends. Allow target configurations to reflect each team's role during the block. The coach controls the
         * exchange. No new block-duration system is needed."*
         *
         * Whether a game is one is read from its own base derivation (`roleBlocksOf`): the roles its contributions establish
         * and how they pass between the teams. Two roles and two end-assigned teams admit exactly two bindings, so the two
         * blocks are entailed and neither is chosen. Each block is then built by the SAME chain as every other game —
         * derivation, Gate A, realization, assembly, the acceptance conditions, the post-realization gates, the context's
         * scoring, rendering and fidelity — so "both blocks valid" holds by construction and nothing downstream has had to
         * learn an overlay. A block that stops refuses the activity at that stage, its reasons named by block; both blocks are
         * built first, so a refusal shows every block that stopped. Then the cross-block checks (`checkRoleBlocks`, RB-1 to
         * RB-8) prove what the two share and that they differ only by the role, and the coach reads ONE activity composed from
         * the two renders (`composeRoleBlockActivity`), checked to have lost and invented nothing (fidelity Q6).
         *
         * A game establishing no role skips this whole branch without a second derivation: only a selection carrying an item
         * on the register's roles row is even asked. A game establishing part of a role exchange is refused here.
         */
        const roleIndex = indexRegister(input.register)
        /**
         * Stage 5A: the field diagram's model and agreement check (`field-diagram.ts`), read from the games as served and held to each block's
         * Details, the Details a coach is served and the served role-block account. Stage 5B (`coach-diagram.ts`): for EVERY build that serves
         * (a coach's and an administrator's alike), the diagram a coach reads is composed from that model and held to it (D9), and served
         * (`diagram`) only where everything agrees; the model, the findings and the notes go to an administrator only (`diagramDraft`). Whatever
         * fails, including the computation itself, withholds the diagram only: the activity, and its overview, are served exactly as without it.
         */
        const diagramKeys = (games: { blockId: string; holders: Record<string, string>; fixture: any; rendered: Instruction[] }[], served: Instruction[], roleBlocks: { blockId: string; holders: Record<string, string> }[] | null): Partial<ServedActivity> => {
            let outcome: DiagramOutcome
            try {
                outcome = diagramForServing({ session, games, served, roleBlocks, index: roleIndex }, { title })
            } catch (error) {
                outcome = { diagram: null, draft: failedDiagramDraft(error instanceof Error ? error.message : String(error)) }
            }
            return { ...(outcome.diagram ? { diagram: outcome.diagram } : {}), ...(review.includeDrafts ? { diagramDraft: outcome.draft } : {}) }
        }
        /**
         * **The default-laws account, and its strictness** — H2, 23 October 2026 (the d26 design's build step 2, its section 3.2). Christian,
         * reply filed 26 October 2026, item 10: *"Where a normal law cannot apply directly because of the modified field, scoring structure, or
         * game format, the system should identify the relevant adaptation rather than silently assume conventional conditions exist."* Only
         * for a game derived through the realization being tried where it declares `defaultLawsCheck`, read from the realization derivation
         * received (its composed items carry the departures) and from each game as built - after realization and every cross-block check, so
         * the account reads the games a coach would be served. Null for every other game, which gains no account and is not checked. Under
         * ENFORCE a game owing an adaptation is refused at validation, naming each law owed, and never falls back (a law owed waits on his
         * decision, not on the session); under REPORT nothing is refused and the account goes to the administrator's review evidence only.
         * The design's DRAFT sentence for the coach is shown there as held, and nothing a coach reads changes.
         */
        const receivedRealization = provisionalRealization ? (((input.contracts as LoadedContract[]).find(contract => contract.contractId === provisionalRealization.contractId) as ProvisionalRealization | undefined) ?? null) : null
        /**
         * B4, 28 October 2026 (R8's E4a): a Learning Goal's activity is a composed one, held to the sport's own check where its realization
         * declares none (`defaultLawsAccountOf` decides; a realization's own check still wins). Christian, his reply filed 30 October 2026,
         * item 4: *"Material unresolved conflicts affecting the activity's meaning, safety, or structural validity should prevent approval."*
         * Branches on the build's subject kind only, as the holds above do, naming no goal: an engineering demonstration is never held (his
         * 13 October standard keeps engineering demonstrations apart from learning-design activities).
         */
        const composedCheck = kind === 'learning-goal' ? { materiality: lawsMateriality } : null
        const lawAccountOf = (games: { blockId: string; game: unknown; roleBlock: RoleBlock | null }[]): DefaultLawsAccount | null => {
            if (!receivedRealization?.defaultLawsCheck && !composedCheck) return null
            const held = receivedRealization?.defaultLawsCheck ? draftCoachWordingLoad().wording.normalLaws : null
            return defaultLawsAccountOf({
                realization: receivedRealization,
                laws: loadSportDefaultLaws(),
                blocks: games,
                index: roleIndex,
                session,
                heldSentence: held ? { text: held.words, status: 'DRAFT_HELD_NOT_SERVED', basis: { words: [...held.basis.words], citedAs: held.basis.citedAs } } : null,
                // H3: the bound-region block this build checked the games against, whose pairings give a bound region's mark.
                boundRegions,
                composed: composedCheck,
            })
        }
        // The summary is DRAFT coach wording (H3 carries the H2 review's should-fix 6: it was not labelled so), reachable only where a
        // realization declares ENFORCE and owes an adaptation - on 23 October 2026 only a TEST-ONLY completion of the goal version does.
        // B4: and where the sport's check holds a composed activity owing a MATERIAL adaptation (the same summary; the reasons name the check,
        // each material adaptation, and then each procedural one, reported). A PROCEDURAL adaptation alone refuses nothing.
        const lawRefusalOf = (lawAccount: DefaultLawsAccount | null): ReturnType<typeof refuse> | null => {
            const summary = `Where this activity departs from the sport's normal rules has not all been decided yet, so it is not being shown.`
            const materiality = lawAccount?.materiality
            if (lawAccount && materiality) {
                const n = materiality.material.length
                return n
                    ? refuse('validation', summary, [
                          `the sport's default-laws check (${lawAccount.mode}, ${lawAccount.check.basis.citedAs}) holds this composed activity: ${n} material adaptation${n === 1 ? ' is' : 's are'} owed, which prevent${n === 1 ? 's' : ''} approval`,
                          ...materiality.material,
                          ...materiality.reportedForReview.map(sentence => `reported for review, not refused: ${sentence}`),
                      ])
                    : null
            }
            return lawAccount && lawAccount.mode === 'ENFORCE' && lawAccount.owed.length
                ? refuse('validation', summary, [
                      `the provisional realization ${lawAccount.realization} holds its activity to the normal laws (ENFORCE), and ${lawAccount.owed.length} adaptation${lawAccount.owed.length === 1 ? ' is' : 's are'} owed`,
                      ...lawAccount.owed,
                  ])
                : null
        }
        /** B4: the sport's check of a composed activity, for an administrator's review build only (`ServedActivity.lawsCheck`). */
        const lawsCheckKeys = (lawAccount: DefaultLawsAccount | null): { lawsCheck?: DefaultLawsAccount } =>
            review.includeDrafts && lawAccount?.declaredBy === 'SPORT_PROFILE' ? { lawsCheck: JSON.parse(JSON.stringify(lawAccount)) as DefaultLawsAccount } : {}
        /**
         * **The requirement account of this activity, for an administrator's review build only** (29 October 2026; `ServedActivity.requirementAccount`):
         * merged over the blocks, served or refused after realization, wherever a block reached the context-scoring guard; `{}` for every other
         * build, so a coach's answer is exactly what it was. It refuses nothing, and a throw while merging becomes the account's own ERROR (the
         * R-engine review's S4), never the route's 500.
         */
        const requirementKeys = (outcome: string, blocks: { blockId: string; requirements?: BlockRequirementAccount }[]): { requirementAccount?: RequirementAccount } => {
            if (!requirements || !context || !blocks.some(block => block.requirements)) return {}
            const draftContract = account.context?.contract === 'DRAFT'
            try {
                return {
                    requirementAccount: requirementAccountOf({
                        contextId: context.id,
                        outcome,
                        bindings: requirements.bindings,
                        refused: requirements.refused,
                        blocks: blocks.map(block => ({ blockId: block.blockId, account: block.requirements ?? null })),
                        draftContract,
                    }),
                }
            } catch (error) {
                return { requirementAccount: failedRequirementAccount(context.id, outcome, error instanceof Error ? error.message : String(error), draftContract) }
            }
        }
        const blockRequirementsOf = (list: { block: RoleBlock; outcome: GameOutcome }[]) => list.map(entry => ({ blockId: entry.block.blockId, requirements: entry.outcome.requirements }))
        const rolesRow = roleIndex.roleBlocks?.rolesRow
        /**
         * Stage D (23 October 2026, register version 18): a selection carrying an item on the end-assignment row (B10) is asked too, so an
         * exchange of ends in a game establishing no role is refused here (`roleBlocksOf`: blocks exist only where the roles exchange), never
         * built as a single game with the exchange left unread. Every other selection is asked exactly as before.
         */
        const endRow = roleIndex.endAssignment?.row
        if (rolesRow && (input.contracts as LoadedContract[]).some(contract => (contract.items ?? []).some(item => String(item.row) === rolesRow || (!!endRow && String(item.row) === endRow)))) {
            const base: any = runStages0to5(input)
            const found = base.run.halted || !base.derived ? null : roleBlocksOf(base.classes, base.derived.lines, roleIndex)
            if (found?.kind === 'REFUSED') {
                return refuse('structure', `The game this ${subject} selects is not yet described completely enough to be set up.`, [
                    'the game establishes part of a role exchange, so it cannot be played in role blocks',
                    ...found.why,
                ])
            }
            if (found?.kind === 'BLOCKS') {
                let blocks = found.blocks.map(block => ({ block, outcome: buildOneGame({ ...input, roleBlock: block }, game) }))
                const stoppedOf = (list: typeof blocks) => list.filter((entry): entry is { block: RoleBlock; outcome: Extract<GameOutcome, { outcome: 'refused' }> } => entry.outcome.outcome === 'refused')
                let stopped = stoppedOf(blocks)
                // The earliest stage any block stopped at, in pathway order; every block that stopped is named.
                const firstOf = (list: typeof stopped) => [...list].sort((a, b) => STAGE_ORDER.indexOf(a.outcome.stage) - STAGE_ORDER.indexOf(b.outcome.stage))[0]
                const reasonsOf = (list: typeof stopped) => list.flatMap(entry => entry.outcome.reasons.map(reason => `block ${entry.block.blockId}: ${reason}`))
                let first = firstOf(stopped)
                let stoppedReasons = reasonsOf(stopped)
                /**
                 * **A block refused at communication passed validation, so the cross-block checks still run before the refusal** (stage K7, 15
                 * October 2026). The cross-block checks are validation (a refusal there says "did not pass its own checks"), which comes
                 * before communication in the pathway; until this stage a block stopping at communication skipped them, so a disagreement
                 * between the blocks could hide behind a wording refusal. Where every block was built or refused only at communication, both
                 * games are complete through validation and are checked against each other first; any earlier stop refuses as before.
                 */
                const throughValidation = blocks.every(entry => entry.outcome.outcome === 'built' || !!entry.outcome.communication)
                if (stopped.length && !throughValidation) {
                    /**
                     * Stage E (23 October 2026): where EVERY block that stopped stopped on a typed applicability refusal, the activity's refusal is
                     * typed too (`typedStopOf`), said in the words of the block it is typed by; one block stopping on anything else leaves it
                     * untyped, so a broken block is never hidden behind the next alternative. Every reason of every block is kept, as before.
                     */
                    const typed = typedStopOf(stopped)
                    if (typed) {
                        fixture = typed.outcome.fixture
                        // A typed refusal is a session refusal the next alternative may answer: it carries no requirement account (the R-engine review's N6).
                        return refuse(typed.outcome.stage, typed.outcome.summary, stoppedReasons, typed.outcome.applicability, typed.outcome.question)
                    }
                    fixture = first.outcome.fixture
                    const stoppedRefusal = refuse(first.outcome.stage, first.outcome.summary, stoppedReasons)
                    // A block that reached the guard is accounted; one that stopped before it is listed as not accounted (administrator only).
                    Object.assign(stoppedRefusal.activity, requirementKeys(first.outcome.stage, blockRequirementsOf(blocks)))
                    return stoppedRefusal
                }
                const gamesOf = (list: typeof blocks) =>
                    list.map(entry =>
                        entry.outcome.outcome === 'built'
                            ? { block: entry.block, fixture: entry.outcome.fixture, contracts: entry.outcome.contracts, rendered: entry.outcome.rendered, violations: [] as FidelityFinding[], evidence: entry.outcome.evidence }
                            : { block: entry.block, fixture: entry.outcome.fixture as Record<string, unknown>, contracts: entry.outcome.communication!.contracts, rendered: entry.outcome.communication!.rendered, violations: entry.outcome.communication!.violations, evidence: entry.outcome.communication!.evidence },
                    )
                let games = gamesOf(blocks)
                const checks = checkRoleBlocks(
                    games.map(entry => ({ block: entry.block, fixture: entry.fixture, contracts: entry.contracts })),
                    roleIndex,
                    found.roles,
                )
                fixture = { ...games[0].fixture, roleBlocks: roleBlockFixture(found, games.map(entry => ({ block: entry.block, fixture: entry.fixture })), checks, roleIndex) }
                const failing = checks.filter(check => check.verdict === 'FAIL')
                /**
                 * **Where only the membership check fails, the coach is told what has not been decided** (15 October 2026, stage K4,
                 * DRAFT). Both blocks were built and every other cross-block check holds, so what is missing is who changes team at
                 * the exchange for this session's numbers — measured: at 11 players the A01 realization's teams are 5 + 1 against 5
                 * in both blocks, and his 1(a) moves an outfield player too ("This preserves the 6 + GK versus 5 relationship in both
                 * blocks."), which that configuration does not keep. Never resolved here.
                 */
                const membershipOnly = failing.length > 0 && failing.every(check => check.checkId === 'RB-M')
                if (failing.length) {
                    const crossBlockRefusal = refuse('validation', membershipOnly ? `Who changes team when the roles exchange has not been decided for ${session.players} players, so this activity is not being shown.` : 'The game built for this activity did not pass its own checks, so it is not being shown.', [
                        'the two role blocks do not agree as the exchange of each other',
                        ...failing.flatMap(check => check.problems.map(problem => `${check.checkId}: ${problem}`)),
                    ])
                    Object.assign(crossBlockRefusal.activity, requirementKeys('validation', blockRequirementsOf(blocks)))
                    return crossBlockRefusal
                }
                /**
                 * **Every block's markings set out once, wherever they occupy the same places** — stage 2D, 21 October 2026; a general
                 * presentation rule since stage 2G, his reply filed 23 October 2026, item 2: *"Please authorize marking once whenever the system
                 * can establish that the physical markings occupy the same locations across all blocks. This should be a general presentation
                 * rule, not something requiring my approval for each configuration."* Once the two blocks agree as the exchange of each other,
                 * the physical layout is read from both realized games (`layoutOf`, with the adjustments that move a position's magnitude; no
                 * record is read). Where it applies, each block is rendered and checked again with it (`recommunicate`), replacing its first
                 * render, findings and evidence, and the blocks are read again from there (a block the layout render refuses at communication
                 * is refused like any other). Where it does not, and some marking moves between the blocks, each block is rendered and checked
                 * again with what moves (`remarking`), so its exchange sentence says what to adjust: *"If markings change location between
                 * blocks, the instructions should identify what needs to be adjusted."* Then RB-L recomputes both from the blocks and holds
                 * every block's to them. Where neither applies, nothing is re-rendered, and where a reason is known the admin-only review
                 * evidence says why (hardening H1, below).
                 */
                const layoutMovers = layoutMoversOf(goalSelection?.authorization)
                const layoutDecision = layoutOf(
                    games.map(entry => ({ blockId: entry.block.blockId, fixture: entry.fixture })),
                    layoutMovers,
                )
                const addedForBlocks = layoutDecision.applies ? { layout: layoutDecision.layout } : layoutDecision.remarking ? { remarking: layoutDecision.remarking } : null
                if (addedForBlocks) {
                    blocks = blocks.map(entry => {
                        const again = entry.outcome.recommunicate
                        return { block: entry.block, outcome: again ? again(addedForBlocks) : entry.outcome }
                    })
                    stopped = stoppedOf(blocks)
                    first = firstOf(stopped)
                    stoppedReasons = reasonsOf(stopped)
                    games = gamesOf(blocks)
                }
                const layoutCheck = checkRoleBlockLayout(
                    games.map(entry => ({ blockId: entry.block.blockId, fixture: entry.fixture })),
                    layoutMovers,
                )
                checks.push(layoutCheck)
                fixture = { ...games[0].fixture, roleBlocks: roleBlockFixture(found, games.map(entry => ({ block: entry.block, fixture: entry.fixture })), checks, roleIndex) }
                if (layoutCheck.verdict === 'FAIL') {
                    const layoutRefusal = refuse('validation', 'The game built for this activity did not pass its own checks, so it is not being shown.', [
                        'the markings set out once are not the blocks\' own',
                        ...layoutCheck.problems.map(problem => `${layoutCheck.checkId}: ${problem}`),
                    ])
                    Object.assign(layoutRefusal.activity, requirementKeys('validation', blockRequirementsOf(blocks)))
                    return layoutRefusal
                }
                // H2: the default-laws account of the games as built, one per block, where the realization being tried declares the check.
                const lawAccount = lawAccountOf(games.map(entry => ({ blockId: entry.block.blockId, game: (entry.fixture as any)?.game, roleBlock: entry.block })))
                const renders = games.map(entry => ({ blockId: entry.block.blockId, rendered: entry.rendered, fixture: entry.fixture }))
                const composed = composeRoleBlockActivity(renders, roleIndex)
                /**
                 * Stage 2D: where the markings stay block by block, why is said (DRAFT words) — to an administrator only. Hardening H1, 21
                 * October 2026 (the 2D review's should-fix 1): it was pushed onto `coachingObservations`, which every viewer can expand under
                 * "How this was arrived at", and it carries internal ids (element ids, block ids). It goes to the admin-only review evidence
                 * (`reviewEvidenceOf`, `layoutFallback`), and the composed activity a coach is served is exactly the composition of the block
                 * renders. Stage 2G: said wherever a reason is known (no recorded choice is read any longer), with which markings move.
                 */
                const layoutFallback = !layoutDecision.applies && layoutDecision.why.length ? { why: [...layoutDecision.why], moves: remarkingSummary(layoutDecision.remarking) } : null
                const composition = checkRoleBlockComposition(renders, composed, roleIndex)
                const violations = composition.filter(finding => finding.severity === 'VIOLATION')
                /**
                 * The admin-only review evidence of the composed activity (stage K8), for a goal whose record asks for one: read from the two
                 * games as built, the cross-block checks and the composition. Never on a coach's answer.
                 */
                const evidenceOf = (outcome: string, overview: OverviewEvidence | null = null) =>
                    reviewEvidenceFor(review, goalSelection, account, roleIndex, session, outcome, composed, composition, checks, games.map(entry => ({ blockId: entry.block.blockId, holders: { ...entry.block.holders }, ...(entry.block.ends ? { ends: { ...entry.block.ends } } : {}), fixture: entry.fixture, contracts: entry.contracts, rendered: entry.rendered, ...entry.evidence })), layoutFallback, overview, lawAccount, boundRegions)
                /** The admin-only draft of the composed activity (stage K7), attached to a refusal at communication where it was asked for. */
                const withDraft = (refusal: ReturnType<typeof refuse>) => {
                    if (review.includeDrafts) (refusal.activity as RefusedActivity).draft = reviewDraftOf(games.map(entry => entry.fixture), composed, [...games.flatMap(entry => entry.violations), ...violations], games.flatMap(entry => entry.contracts))
                    const evidence = evidenceOf(refusal.activity.outcome === 'refused' ? refusal.activity.stage : 'served')
                    if (evidence) (refusal.activity as RefusedActivity).evidence = evidence
                    Object.assign(refusal.activity, lawsCheckKeys(lawAccount))
                    Object.assign(refusal.activity, requirementKeys(refusal.activity.outcome === 'refused' ? refusal.activity.stage : 'served', blockRequirementsOf(blocks)))
                    return refusal
                }
                // H2: under ENFORCE a game owing an adaptation is refused at validation, before any refusal at communication.
                const lawRefusal = lawRefusalOf(lawAccount)
                if (lawRefusal) return withDraft(lawRefusal)
                if (stopped.length) return withDraft(refuse(first.outcome.stage, first.outcome.summary, [...stoppedReasons, ...violations.map(v => `fidelity Q${v.question}: ${v.what}`)]))
                if (violations.length) {
                    return withDraft(
                        refuse(
                            'communication',
                            'Part of this activity cannot be explained to a coach yet, so it is not being shown.',
                            violations.map(v => `fidelity Q${v.question}: ${v.what}`),
                        ),
                    )
                }
                const built = games.map(entry => ({ block: entry.block, built: blocks.find(b => b.block === entry.block)!.outcome as Extract<GameOutcome, { outcome: 'built' }> }))
                // Stage 3D: the overview, read from each block's own game as served and checked against it and the composed Details.
                const overview = overviewOf(
                    games.map(entry => ({ blockId: entry.block.blockId, fixture: entry.fixture, rendered: entry.rendered })),
                    composed.instructions,
                )
                return serve(
                    {
                        ...built[0].built,
                        fixture,
                        rendered: composed,
                        integrity: {
                            gateA: [...new Set(built.map(entry => entry.built.integrity.gateA))].join(' / '),
                            realizationAuthorized: built.every(entry => entry.built.integrity.realizationAuthorized),
                            acceptance: {
                                nothingClosedWithoutAuthority: built.flatMap(entry => entry.built.integrity.acceptance.nothingClosedWithoutAuthority),
                                nothingLost: built.flatMap(entry => entry.built.integrity.acceptance.nothingLost),
                                nothingInvented: built.flatMap(entry => entry.built.integrity.acceptance.nothingInvented),
                            },
                            postRealizationValidated: built.every(entry => entry.built.integrity.postRealizationValidated),
                            instructions: composed.instructions.length,
                            fidelityViolations: built.reduce((n, entry) => n + entry.built.integrity.fidelityViolations, 0) + violations.length,
                        },
                    },
                    {
                        roleBlocks: {
                            exchange: found.exchange,
                            roles: found.roles.map(role => ({ role, coachNoun: roleIndex.roleBlocks!.coachNouns[role], nounStatus: 'DRAFT' as const })),
                            blocks: built.map(entry => ({ blockId: entry.block.blockId, holders: { ...entry.block.holders }, ...(entry.block.ends ? { ends: { ...entry.block.ends } } : {}), integrity: entry.built.integrity, concreteChecks: entry.built.concreteChecks.map(check => ({ ...check })) })),
                            checks: checks.map(check => ({ ...check, problems: [...check.problems] })),
                            firstBlock: 'COACH_CHOICE',
                            firstBlockBasis: FIRST_BLOCK_BASIS,
                        },
                        // Stage K8: the admin-only review evidence, where the goal's record asks for one; absent on every coach's answer.
                        ...((evidence => (evidence ? { evidence } : {}))(evidenceOf('served', overview.evidence))),
                        // B4: the sport's check of a composed activity, for an administrator only (what it owes is procedural, reported).
                        ...lawsCheckKeys(lawAccount),
                        // The requirement account, for an administrator only (report only).
                        ...requirementKeys('served', blockRequirementsOf(blocks)),
                        // Stage 3D: the overview where it agrees (every viewer); its draft and the check's findings for an administrator only.
                        ...overviewKeys(overview),
                        // Stage 5A/5B: the diagram where it agrees (every viewer); its model and the checks' findings for an administrator only.
                        ...diagramKeys(
                            games.map(entry => ({ blockId: entry.block.blockId, holders: { ...entry.block.holders }, fixture: entry.fixture, rendered: entry.rendered.instructions })),
                            composed.instructions,
                            built.map(entry => ({ blockId: entry.block.blockId, holders: { ...entry.block.holders } })),
                        ),
                    },
                    games.map(entry => ({ blockId: entry.block.blockId, fixture: entry.fixture })),
                )
            }
        }

        /**
         * **A reassignment happens at an exchange of roles and nowhere else** (15 October 2026, stage K4, his RD-1 answer: *"This
         * particular realization uses both mechanisms"*). A game that establishes who changes team at an exchange and is not
         * played in role blocks has no exchange for it to happen at, so it is refused as part of a description, never built as
         * though the reassignment were not there. DRAFT refusal reason.
         */
        const reassignmentRow = roleIndex.reassignment?.row
        if (reassignmentRow && (input.contracts as LoadedContract[]).some(contract => (contract.items ?? []).some(item => String(item.row) === reassignmentRow))) {
            return refuse('structure', `The game this ${subject} selects is not yet described completely enough to be set up.`, [
                'the game establishes players changing team at an exchange of roles, and it is not played in role blocks, so there is no exchange for them to change at',
            ])
        }

        const one = buildOneGame(input, game)
        if (one.outcome === 'refused') {
            fixture = one.fixture
            // H2: a game refused only at communication passed validation, so its default-laws account is read (and, under ENFORCE, refuses
            // first, at validation), as in role blocks; every other refusal stopped before the game was complete, and gains none.
            const lawAccount = one.communication && one.fixture ? lawAccountOf([{ blockId: ONE_GAME, game: (one.fixture as any).game, roleBlock: null }]) : null
            const lawRefusal = lawRefusalOf(lawAccount)
            // Stage E: a typed applicability refusal keeps its type (and an ASK its question), exactly as a role block's does.
            const refusal = lawRefusal ?? refuse(one.stage, one.summary, one.reasons, one.applicability ?? null, one.question ?? null)
            // The admin-only draft (stage K7): only on a refusal at communication, only where the review asked for it.
            if (review.includeDrafts && one.communication) (refusal.activity as RefusedActivity).draft = reviewDraftOf([one.fixture], one.communication.rendered, one.communication.violations, one.communication.contracts)
            // And the admin-only review evidence (stage K8), where the goal's record asks for one.
            const evidence = one.communication && one.fixture ? reviewEvidenceFor(review, goalSelection, account, roleIndex, session, lawRefusal ? 'validation' : one.stage, one.communication.rendered, [], [], [{ blockId: ONE_GAME, holders: {}, fixture: one.fixture, contracts: one.communication.contracts, rendered: one.communication.rendered, ...one.communication.evidence }], null, null, lawAccount, boundRegions) : null
            if (evidence) (refusal.activity as RefusedActivity).evidence = evidence
            Object.assign(refusal.activity, lawsCheckKeys(lawAccount))
            // The requirement account (administrator only): only where the game reached the guard; a refusal before it carries none.
            Object.assign(refusal.activity, requirementKeys(refusal.activity.outcome === 'refused' ? refusal.activity.stage : 'served', [{ blockId: ONE_GAME, requirements: one.requirements }]))
            return refusal
        }
        // H2: the default-laws account of the one game, where the realization being tried declares the check; under ENFORCE, owed refuses.
        const oneLawAccount = lawAccountOf([{ blockId: ONE_GAME, game: (one.fixture as any).game, roleBlock: null }])
        const oneLawRefusal = lawRefusalOf(oneLawAccount)
        if (oneLawRefusal) {
            fixture = one.fixture
            const evidence = reviewEvidenceFor(review, goalSelection, account, roleIndex, session, 'validation', one.rendered, [], [], [{ blockId: ONE_GAME, holders: {}, fixture: one.fixture, contracts: one.contracts, rendered: one.rendered, ...one.evidence }], null, null, oneLawAccount, boundRegions)
            if (evidence) (oneLawRefusal.activity as RefusedActivity).evidence = evidence
            Object.assign(oneLawRefusal.activity, lawsCheckKeys(oneLawAccount))
            Object.assign(oneLawRefusal.activity, requirementKeys('validation', [{ blockId: ONE_GAME, requirements: one.requirements }]))
            return oneLawRefusal
        }
        // Stage 3D: the overview of the one game, checked against its Details (which are what a coach is served).
        const overview = overviewOf([{ blockId: ONE_GAME, fixture: one.fixture, rendered: one.rendered }], one.rendered.instructions)
        const evidence = reviewEvidenceFor(review, goalSelection, account, roleIndex, session, 'served', one.rendered, [], [], [{ blockId: ONE_GAME, holders: {}, fixture: one.fixture, contracts: one.contracts, rendered: one.rendered, ...one.evidence }], null, overview.evidence, oneLawAccount, boundRegions)
        return serve(
            one,
            {
                ...(evidence ? { evidence } : {}),
                ...lawsCheckKeys(oneLawAccount),
                ...requirementKeys('served', [{ blockId: ONE_GAME, requirements: one.requirements }]),
                ...overviewKeys(overview),
                ...diagramKeys([{ blockId: ONE_GAME, holders: {}, fixture: one.fixture, rendered: one.rendered.instructions }], one.rendered.instructions, null),
            },
            [{ blockId: ONE_GAME, fixture: one.fixture }],
        )
    }

    /**
     * **The realizations a goal's record authorizes, tried in its order** — stage E, 23 October 2026 (the design's Stage E). Christian, reply
     * filed 25 October 2026, item 4: *"I approve retaining both alternatives."* *"These should be alternative knowledge-authorized
     * realizations, not separate hardcoded implementations of the same Learning Goal."* *"Please add the general ability to represent [object]
     * availability as a session resource and use authorized knowledge relationships when determining which scoring configuration can be
     * selected."* (His nouns bracketed for the coupling ratchet.)
     *
     * Read from the record (`realizationAlternativesOf`), so no goal and no realization is named here. Each alternative that can be tried is
     * built whole by `attempt`, in the order the record gives:
     *   - served: the activity, and nothing behind it is tried;
     *   - refused on a typed applicability refusal (`Applicability` NOT_APPLICABLE: a resource the session lacks, its testing area, a
     *     practice situation it was not designed for): the next alternative is tried;
     *   - refused because the session must say something first (ASK): the coach is asked (`RefusedActivity.question`), and nothing behind it
     *     is tried, because an alternative behind it would be chosen on a fact nobody stated ("never silently none");
     *   - refused for any other reason: the activity is refused, and nothing behind it is tried, so a broken alternative is never hidden
     *     behind the next one (the design's risk 7, "Silent fallback masking a broken goal version").
     * An alternative waiting on a gap is listed and never tried. Where every alternative tried did not apply, the activity is refused in the
     * words of the last one tried (the one a session change would most directly reach), with each alternative's reasons named by it. Every
     * alternative and why it was or was not used is recorded on the account (`realizationSelection`) and, for an administrator's review, in
     * the evidence. A record naming one realization is tried exactly as before: its refusal is its own, and the account says it was used.
     */
    const alternatives = goalSelection ? realizationAlternativesOf(goalSelection.authorization) : []
    const untyped = ({ applicability: _typed, ...built }: Attempt): ActivityBuild & { fixture: Record<string, unknown> | null } => built
    if (!alternatives.length) return untyped(attempt(undefined))
    const baseAccount: Partial<ActivityAccount> = JSON.parse(JSON.stringify(account))
    const outcomes: RealizationSelectionEntry[] = alternatives.map(alternative => ({
        realization: alternative.realization,
        words: alternative.words,
        citedAs: alternative.citedAs,
        outcome: alternative.selectable ? 'NOT_TRIED' : 'NOT_SELECTABLE',
        cause: alternative.selectable ? null : alternative.status,
        stage: null,
        summary: null,
        gaps: [...alternative.gaps],
    }))
    const tried: { at: number; built: Attempt }[] = []
    let decided: Attempt | null = null
    for (const [at, alternative] of alternatives.entries()) {
        if (!alternative.selectable) continue
        account = JSON.parse(JSON.stringify(baseAccount))
        fixture = null
        const built = attempt(resolveRealization(alternative.realization))
        tried.push({ at, built })
        const entry = outcomes[at]
        if (built.activity.outcome === 'served') {
            entry.outcome = 'SELECTED'
            decided = built
            break
        }
        entry.stage = built.activity.stage
        entry.summary = built.activity.summary
        entry.cause = built.applicability?.cause ?? null
        if (built.applicability?.verdict === 'NOT_APPLICABLE') {
            entry.outcome = 'NOT_APPLICABLE'
            continue
        }
        entry.outcome = built.applicability?.verdict === 'ASK' ? 'ASKED' : 'REFUSED'
        decided = built
        break
    }
    if (!decided) {
        if (!tried.length) {
            // Unreachable on a record the loader admits (it refuses a list none of whose entries can be tried); refused, never built.
            account = JSON.parse(JSON.stringify(baseAccount))
            fixture = null
            decided = refuse(
                'knowledge',
                "This goal's activity depends on set-up decisions and engine capabilities that are not in place yet, so no activity can be built for it.",
                outcomes.map(entry => `the realization ${entry.realization} the authorization record of ${goalSelection!.goalId} lists is ${entry.cause}, waiting on ${entry.gaps.join(', ') || 'nothing named'}`),
            )
        } else if (tried.length === 1) {
            decided = tried[0].built
        } else {
            const last = tried[tried.length - 1].built
            const refused = last.activity as RefusedActivity
            decided = {
                ...last,
                activity: {
                    ...refused,
                    reasons: [
                        `none of the ${tried.length} realizations the authorization record of ${goalSelection!.goalId} authorizes applies to this session; each was tried in its order`,
                        ...tried.flatMap(({ at, built }) => (built.activity as RefusedActivity).reasons.map(reason => `${alternatives[at].realization}: ${reason}`)),
                    ],
                },
            }
        }
    }
    decided.activity.account.realizationSelection = outcomes.map(entry => ({ ...entry, gaps: [...entry.gaps] }))
    if (decided.activity.evidence) decided.activity.evidence = withRealizationSelection(decided.activity.evidence, outcomes)
    return untyped(decided)
}

/** The block id the review evidence gives a game not played in role blocks. */
const ONE_GAME = 'ONE_GAME'

/**
 * **The block a role-block activity's typed refusal is said by, or null** (stage E, 23 October 2026): only where every block that stopped
 * stopped on a typed applicability refusal. A block on which the alternative does not apply decides it (it cannot be played whatever else
 * the session says); otherwise the first block, which asks. Null where any block stopped on anything else.
 */
function typedStopOf<T extends { outcome: { applicability?: Applicability } }>(stopped: T[]): T | null {
    if (!stopped.length || !stopped.every(entry => !!entry.outcome.applicability)) return null
    return stopped.find(entry => entry.outcome.applicability!.verdict === 'NOT_APPLICABLE') ?? stopped[0]
}

/**
 * The verdicts an owed check takes when the values it reads were never written: a roster that refuses writes nothing at all (`deriveRoster`),
 * so every check reading a team's size or its specialized-role count is left NOT_EVALUABLE, and a clause deferred to realization is
 * relabelled STILL_NOT_EVALUABLE (`post-realization-gate.ts`). A FAIL, a vacuous pass and a clause not found are none of these.
 */
const UNWRITTEN_VERDICTS = new Set(['NOT_EVALUABLE', 'STILL_NOT_EVALUABLE'])

/**
 * **Is the roster's refusal the one thing wrong with this game?** (stage E fix, 23 October 2026, after the stage E review.) The roster's
 * AVAILABILITY_SHORT is typed for the realization loop, which then tries the next alternative; typed whatever else was wrong, an alternative
 * with a real break beside a staffing shortfall would fall back and hide the break (the design's risk 7, measured with a TEST-ONLY authored
 * comparison violated beside it: the variant was NOT_APPLICABLE and the build moved on). So it is typed only where realization's acceptance
 * found nothing, and every reason the gates give is an owed check left unevaluable by what the refused roster did not write: nothing else was
 * added (a check that FAILS though it was not owed, a value entailed at assembly that did not land, an authoritative comparison violated).
 * Read from the gates' typed record (`owed`, `outstanding`), never from their prose. A served game asked of a session with none of a
 * specialized role it involves is exactly this case (measured on the snapshot), so it stays typed and its answer does not move. Exported for
 * its unit test only.
 */
export function onlyTheRosterStopped(acceptanceBroken: boolean, post: Pick<ReturnType<typeof runPostRealizationGates>, 'owed' | 'outstanding'>): boolean {
    if (acceptanceBroken) return false
    const unpaid = post.owed.filter(entry => entry.verdict !== 'PASS')
    return unpaid.length === post.outstanding.length && unpaid.every(entry => UNWRITTEN_VERDICTS.has(entry.verdict))
}

/** One build as the realization loop sees it (stage E): the build, and its typed applicability where it was refused for one. */
type Attempt = ActivityBuild & { fixture: Record<string, unknown> | null; applicability?: Applicability }

/**
 * **The admin-only review evidence of a build, or null** (stage K8, 15 October 2026). Only for the review build asked with drafts (the
 * route's administrator check), and only for a goal whose authorization record carries his review request — read from data, so no goal
 * is named here; every other build, and every coach's answer, carries nothing. `reviewEvidence.ts` reads the games as built.
 */
function reviewEvidenceFor(
    review: { includeDrafts: boolean },
    goalSelection: BoundedSelection | null,
    account: Partial<ActivityAccount>,
    index: ReturnType<typeof indexRegister>,
    session: ActivitySession,
    outcome: string,
    composed: RenderedActivity,
    compositionFindings: FidelityFinding[],
    crossBlock: RoleBlockCheck[],
    blocks: EvidenceBlock[],
    /** Hardening H1 (stage 2G): where the markings are presented block by block for a known reason, why and what moves (admin-only). Null everywhere else. */
    layoutFallback: LayoutFallback | null = null,
    /** Stage 3D: the overview's verdict, findings, statuses and reading evidence (admin-only); null on a refusal, where there is none. */
    overview: OverviewEvidence | null = null,
    /** H2: the default-laws account, where the realization the games were derived through declares the check (admin-only); null elsewhere. */
    defaultLaws: DefaultLawsAccount | null = null,
    /** H3: the bound-region block the games were checked against; the account of their bound regions is read from it (admin-only). */
    boundRegions: SportBoundRegions | null = null,
): ReviewEvidence | null {
    const record = goalSelection?.authorization
    if (!review.includeDrafts || !record?.reviewRequest) return null
    return reviewEvidenceOf({
        // H3: every region bound to an object in the games as built, with the pairing it cites; null (and so absent) where no game holds one.
        boundRegions: boundRegionAccountOf(
            index,
            blocks.map(block => ({ blockId: block.blockId, game: (block.fixture as { game?: unknown } | null)?.game })),
            boundRegions,
        ),
        outcome,
        session,
        blocks,
        composed,
        compositionFindings,
        crossBlock,
        layoutFallback,
        record: record as LearningGoalAuthorization & { reviewRequest: NonNullable<LearningGoalAuthorization['reviewRequest']> },
        lists: account.authorizationLists ?? null,
        // Stage A (22 October 2026): every recorded kind of context relationship (`contextRelationships`), equal to the manipulation list today.
        relationships: contextRelationships(),
        selectedConstraints: (account.constraints ?? []).map(constraint => constraint.id),
        // 22 October 2026 (the live-app fix): the authority the live route decides its pathway by, read from the account selection made.
        constraintAuthority: account.constraintSource?.constraintAuthority ?? null,
        index,
        overview,
        defaultLaws,
    })
}

/** What one game's build needs beyond its derivation input. */
interface GameContext {
    /** "goal" or "demonstration", for the refusal sentences. */
    subject: string
    session: ActivitySession
    selection: KnowledgeSelection
    /** The selected context, where there is one. */
    context: { id: string; role: string } | undefined
    /** Tests only. Since stage E it is handed the realization being tried as well, so an alteration can be one alternative's alone. */
    alterSupplied: ((supplied: SuppliedRealization, realization: ProvisionalRealization | null) => void) | null
    /** The record's authorized adjustments, in his words, for the fixture (stage K4). Empty for every other activity. */
    adjustments: { id: string; words: string; consequence: string | null; citedAs: string; coachWords?: string; moves?: { role: string } }[]
    /** What defers in this composition (ruling C56), for the fixture. Empty wherever nothing defers. */
    alternatives: Alternative[]
    /** H3: the Sport Profile's bound-region block the bound-region check reads (the file's, or a test's copy); null where there is none. */
    boundRegions: SportBoundRegions | null
    /** B2: the Sport Profile's record of the playing environment's elements (`environment-elements.ts`); null where the profile carries none. */
    environment: SportEnvironmentElements | null
    /**
     * 29 October 2026: the requirement account's bindings (or why they were refused), for an administrator's review build only; null for every
     * other build, which then computes no account. `observe` is TEST-ONLY (`observeRequirementInputs`).
     */
    requirements: { bindings: RequirementBindings | null; refused: string[] | null; observe: ((inputs: BlockRequirementInputs) => void) | null } | null
}

/** One game built from its derivation input to communication, or the stage it stopped at. */
type GameOutcome =
    | {
          outcome: 'refused'
          stage: ActivityStage
          summary: string
          reasons: string[]
          fixture: Record<string, unknown> | null
          /**
           * Only on a refusal AT communication (stage K7, 15 October 2026): the game passed every earlier stage, so what the renderer
           * could say, what it withheld and what fidelity found are carried for the admin-only review draft and for the cross-block
           * checks, which belong to validation and so still run before the activity is refused at communication. Never served.
           */
          communication?: { rendered: RenderedActivity; violations: FidelityFinding[]; contracts: LoadedContract[]; evidence: GameEvidence }
          /** Only beside `communication` (stage 2D): the same game rendered and checked again with these fields added to its fixture. */
          recommunicate?: (extra: Record<string, unknown>) => GameOutcome
          /**
           * Stage E (23 October 2026): where the refusal is a typed applicability refusal - the alternative does not apply to this session, or
           * the session must say something first - so the build's loop can tell it from every other refusal. Absent on every other refusal.
           */
          applicability?: Applicability
          /** Stage E: what the coach is asked, beside an ASK. */
          question?: SessionQuestion
          /** 29 October 2026, administrator only: this block's requirement account, where it reached the context-scoring guard. */
          requirements?: BlockRequirementAccount
      }
    | {
          outcome: 'built'
          fixture: Record<string, unknown>
          rendered: RenderedActivity
          integrity: ServedActivity['integrity']
          contracts: LoadedContract[]
          /** Every Gate A check as rerun on this game's concrete game (stage K4): read only into a role block's account. */
          concreteChecks: { checkId: string; verdict: string }[]
          evidence: GameEvidence
          /** Stage 2D: the same game rendered and checked again with these fields added to its fixture (its physical layout, or since stage 2G what moves at the exchange). */
          recommunicate: (extra: Record<string, unknown>) => GameOutcome
          /** 29 October 2026, administrator only: this block's requirement account. */
          requirements?: BlockRequirementAccount
      }

/**
 * **What the review evidence reads of one game beyond its fixture** (stage K8, 15 October 2026): Gate A as rerun on the concrete game,
 * clause by clause, the post-realization owed invariants, and every fidelity finding. Carried on a game that reached communication only,
 * and read only by `reviewEvidenceOf` for an administrator's review; nothing a coach is served carries it.
 */
interface GameEvidence {
    gateChecks: EvidenceBlock['gateChecks']
    owed: EvidenceBlock['owed']
    findings: FidelityFinding[]
}

/**
 * The DRAFT noun for each kind of performer a reassignment may move (stage K4): the register's outfield noun, and a
 * specialized role by its own name as the session states it. Read from the register, never written here.
 */
function reassignmentNounsOf(index: ReturnType<typeof indexRegister>): Record<string, { singular: string; plural: string }> {
    const spec = index.reassignment!
    return Object.fromEntries(
        spec.performerRows.map(rowId => {
            if (rowId === spec.outfieldRow) return [rowId, { ...spec.outfieldNoun }]
            const role = index.specializedRoleRows.get(rowId) ?? rowId
            return [rowId, { singular: role, plural: `${role}s` }]
        }),
    )
}

/** The pathway's stages in order, so an earlier stop wins when two blocks stop at different stages. */
const STAGE_ORDER: ActivityStage[] = ['session', 'selection', 'knowledge', 'structure', 'realization', 'validation', 'communication']

/**
 * **One game, from derivation to fidelity** — the body `build` always ran, extracted unchanged on 15 October 2026 (stage
 * K3) so that a game played in role blocks runs it once per block. Every refusal sentence, reason and order is what it
 * was: measured, every goal and demonstration answers byte-identically through the review route.
 */
function buildOneGame(input: any, { subject, session, selection, context, alterSupplied, adjustments, alternatives, boundRegions, environment, requirements }: GameContext): GameOutcome {
    let fixture: any = null
    /** 29 October 2026: this block's requirement account, read right after the context-scoring guard; null where the build is not an administrator's review, or stopped before the guard. */
    let blockRequirements: BlockRequirementAccount | null = null
    const withRequirements = (outcome: GameOutcome): GameOutcome => (blockRequirements ? { ...outcome, requirements: blockRequirements } : outcome)
    // Stage E: a typed applicability refusal carries its type (and an ASK its question) for the build's loop; every other refusal is as before.
    const refuse = (stage: ActivityStage, summary: string, reasons: string[], typed: { applicability?: Applicability | null; question?: SessionQuestion } = {}): GameOutcome => ({
        outcome: 'refused',
        stage,
        summary,
        reasons,
        fixture,
        ...(typed.applicability ? { applicability: typed.applicability } : {}),
        ...(typed.question ? { question: typed.question } : {}),
    })
    /**
     * **The session's objects must cover the objects the game holds** (stage E, 23 October 2026; `objectAvailabilityRefusal`). Read twice: on
     * the resolved game before realization, because an object's width is a realization input and a kind nobody stated is asked, never left
     * for realization to refuse for want of a width; and on the concrete game after assembly, so an object realization instantiated is held
     * to the same statement. A game holding no object of a listed kind passes both without reading the session.
     */
    const objectsRefused = (refusal: ObjectAvailabilityRefusal, when: string): GameOutcome => {
        // Stage I: with the session, the bound-region block and the register, for the question's choices and the objects a realization is built for.
        const said = objectSummary(refusal, subject, session, boundRegions, indexRegister(input.register))
        return refuse(said.stage, said.summary, [`the session's objects do not cover the game's ${when} (${refusal.cause}): ${refusal.why}`], { applicability: said.applicability, question: said.question })
    }

    const result: any = runDerivation(input)
    if (isStampedHalt(result)) {
        return refuse('structure', `The game this ${subject} selects is not yet described completely enough to be set up.`, [
            'the derivation halted, so there is no game to assemble',
            ...((result.stopped ?? []) as { where: string; why: string }[]).map(stop => `${stop.where}: ${stop.why}`),
        ])
    }
    const staged: any = runStages0to10(input)
    const index = indexRegister(input.register)
    const resolved: any = assembleResolvedGame(result, staged.classes, index, input.contracts)

    if (!resolved.coherence.realizationAuthorized) {
        /**
         * Two sentences, told apart by what Gate A itself reports. A check that FAILS has found the game
         * wrong as described. A check that cannot be evaluated — or a selected contract refused at load —
         * means a rule's description is incomplete, so the game could not be checked at all. Those are
         * different states of the knowledge and a coach is told which.
         */
        const failing: string[] = resolved.coherence.failingChecks ?? []
        /**
         * A third, told apart the same way (P1b, 22 October 2026, after the P1 review): GA-PARTICIPANTS-PRESENT FAILS before realization
         * where the configuration is already known to lack a participant the game requires (a counted group whose count is 0). The game
         * is described completely and names a participant it cannot hold, so the coach is told which one, from the check's typed
         * records read from the staged context (`missingParticipantsIn`), at structure; every reason stays, and each missing
         * participant is added as one naming its element. It is said even where another check also fails, as at validation.
         *
         * Why the order differs from validation's (P1b review): there the roster's sentence is said first, because it names what the
         * session must change, and the participant sentence second. Before realization there is no roster sentence to put first — a
         * failing GA-ROSTER-SUM, or any other failing check, is said here only in the generic sentence below, which names nothing —
         * so the participant sentence is the one specific sentence available and is said, with every other failing check kept in the
         * reasons. Both stages put the most specific sentence they have first.
         */
        const lacking = failing.includes(PARTICIPANTS_CHECK) ? missingParticipantsIn({ ...staged.gateContext, contracts: input.contracts }) : []
        const lackingSaid = participantSummary(lacking, index, 'structure')
        if (lackingSaid) {
            return refuse(lackingSaid.stage, lackingSaid.summary, [`Gate A is ${resolved.coherence.gateA}`, ...(resolved.coherence.notAuthorizedBecause ?? []), ...participantReasons(lacking)])
        }
        const notEvaluable = ((result.gates?.gateA?.checks ?? []) as { verdict: string }[]).some(check => check.verdict === 'NOT_EVALUABLE')
        const refusedAtLoad = ((result.failures ?? []) as { kind: string }[]).some(failure => failure.kind === 'LOAD_REFUSAL')
        return refuse(
            'structure',
            !failing.length && (notEvaluable || refusedAtLoad)
                ? `This ${subject} selects a rule whose description is still incomplete, so the activity cannot be checked yet.`
                : `The game this ${subject} selects is not yet described completely enough to be set up.`,
            [`Gate A is ${resolved.coherence.gateA}`, ...(resolved.coherence.notAuthorizedBecause ?? [])],
        )
    }

    // Stage E: before realization, the objects the resolved game holds (see `objectsRefused`).
    {
        const refusal = objectAvailabilityRefusal(index, resolved.game, input.envelope, input.contracts)
        if (refusal) return objectsRefused(refusal, 'before realization')
    }
    /**
     * **H3 (23 October 2026; the d26 design's build step 3, its N5): the regions bound to the game's objects, before realization**
     * (`bound-region-check.ts`, GA-BOUND-REGION) - after the objects, so the order a session meets is its testing area, its objects, then this.
     * Before the realizer, because a region an authorized pairing gives that does not fit the area is a typed applicability refusal (the
     * build may try the next alternative), which the realizer's own refusal of a centred extent reaching a touchline would not be. A game
     * holding no defended object of a kind the Sport Profile binds a region to, and no region of a function it binds, passes untouched.
     */
    {
        // Z (25 October 2026): with the block's role holders, read only where a region is bound to a performer's end.
        const refusal = boundRegionRefusalBefore(index, resolved.game, input.envelope, boundRegions, { roleBlock: input.roleBlock ?? null })
        if (refusal) {
            const said = boundRegionSummary(refusal, subject, session, 'structure', boundRegions, index)
            return refuse(said.stage, said.summary, [`the regions bound to the game's objects do not hold before realization (${refusal.cause}): ${refusal.why}`], { applicability: said.applicability, question: said.question })
        }
    }

    /**
     * **Realization input, by the selected game form.** See `supplied-realization`: the choices close what a
     * knowledge object leaves open, so they are found by the object and not by the goal that selected it.
     */
    let supplied = suppliedRealizationFor(selection)
    if (alterSupplied && !isNoSuppliedRealization(supplied)) {
        supplied = JSON.parse(JSON.stringify(supplied)) as SuppliedRealization
        // Stage E: with the realization being tried, so a test's alteration can be one alternative's alone.
        alterSupplied(supplied, realizationOf(selection))
    }
    if (isNoSuppliedRealization(supplied)) {
        // Two answers to one line, or a replacement nobody can trace (15 October 2026): set-up decisions that were made
        // and contradict each other, so the game cannot be set out with them — never resolved by which file came first.
        if (supplied.conflicts?.length) return refuse('realization', 'This game cannot be set out in this session with the set-up decisions made for it.', ['the realization input contradicts itself', ...supplied.conflicts])
        return refuse('realization', 'A set-up decision for this game has not been made yet.', [
            `no realization choices are recorded for the game form ${supplied.missingFor}`,
        ])
    }
    /**
     * **What nobody chose is closed by rule where a rule applies, and only there** (`justified-defaults`):
     * the one member of an authored single-member bound, and the one preferred count this session's roster
     * admits. Everything else still needs an entry — a design alternative and a coach's decision are not a
     * rule's to make — so a game with a line of that kind and no entry is refused below, as before.
     */
    const ctx = { ...staged.gateContext, contracts: input.contracts }
    const { realization, defaults, stranded } = realizeWithJustifiedDefaults(resolved, supplied, index, input.envelope, ctx)
    if (isRefused(realization)) {
        // A count the session's roster admits no preferred value of is the session's to cure, and is said
        // so before the line is reported as a decision nobody made.
        for (const count of stranded) {
            const said = strandedCountSummary(count)
            if (!said) continue
            return refuse(said.stage, said.summary, [
                'realization refused',
                ...(realization.because ?? []),
                ...count.refusals.map((roster, i) => `roster with ${count.path} = ${count.candidates[i]} (${roster.cause}): ${roster.why}`),
            ])
        }
        // Told apart by the open lines themselves: one with neither a choice nor a default against it is a
        // decision nobody has made. Anything else is a decision that was made and that this game, in this
        // session, refuses.
        const closed = new Set([...supplied.choices, ...defaults].map(choice => choice.lineId))
        const unmade = ((resolved.open ?? []) as { lineId: string }[]).some(open => !closed.has(open.lineId))
        return refuse(
            'realization',
            unmade ? 'A set-up decision for this game has not been made yet.' : 'This game cannot be set out in this session with the set-up decisions made for it.',
            ['realization refused', ...(realization.because ?? [])],
        )
    }
    const realized = realization as Realized

    // Same order as the closure run: entail over the concrete game, THEN check it, THEN gate it.
    const entailed = completeConcreteGame(ctx, realized)
    // Stage E: after assembly, the objects the concrete game holds (see `objectsRefused`).
    {
        const refusal = objectAvailabilityRefusal(index, realized.game, input.envelope, input.contracts)
        if (refusal) return objectsRefused(refusal, 'after realization')
    }
    const acceptance = checkRealization(resolved, realized)
    const post = runPostRealizationGates(
        ctx,
        resolved.coherence.postRealizationRequired.map((o: any) => ({ checkId: o.checkId, clause: o.clause })),
        realized,
    )

    const invalid: string[] = []
    for (const [name, entries] of Object.entries(acceptance)) if ((entries as unknown[]).length) invalid.push(`${name}: ${JSON.stringify(entries)}`)
    const acceptanceBroken = invalid.length > 0
    /**
     * H3: the regions bound to the game's objects, after realization - each lies from its object's end line exactly as its pairing says,
     * centred on it, inside the touchlines (`bound-region-check.ts`). A break here is a validation refusal, and it keeps a staffing shortfall
     * beside it from being typed (below): the roster is then not the one thing wrong with this game.
     */
    // Z: with the block's role holders and its designation bindings (which realized team is which end-assigned team).
    const boundAfter = boundRegionRefusalAfter(index, realized.game, input.envelope, boundRegions, {
        roleBlock: (realized.record as any).roleBlock ?? input.roleBlock ?? null,
        designationBindings: (realized.record as any).designationBindings ?? null,
    })
    if (boundAfter) invalid.push(`the regions bound to the game's objects do not hold after realization (${boundAfter.cause}): ${boundAfter.why}`)
    /**
     * **One element of the playing environment, not a second one because two components refer to it** — B2, 28 October 2026
     * (`environment-elements.ts`, which quotes his reply filed 30 October 2026, item 6). After realization (a recorded identification has been
     * applied, so the element it lets the environment's stand for is gone) and before communication: a second element beside an environment
     * element, in its collection with its authored selector, is named and refuses the game here, where until now it was refused only at
     * communication, indirectly (the renderer said the element once). Like a bound-region break, it keeps a staffing shortfall beside it
     * from being typed: the roster is then not the one thing wrong. Empty for every game holding one such element.
     */
    const duplicates = duplicateEnvironmentElements(realized.game, environment)
    invalid.push(...duplicates)
    if (!post.validated) {
        /**
         * **What the gates reported is carried, not summarised away.** This used to push one fixed sentence —
         * that a post-realization gate did not validate — and drop `post.outstanding`, so nine players, a
         * missing availability and an area too small for its regions all refused identically.
         */
        invalid.push('a post-realization gate did not validate', ...post.outstanding)
        const roster = rosterRefusal(ctx, realized)
        const said = roster ? rosterSummary(roster) : null
        if (roster) invalid.push(`roster (${roster.cause}): ${roster.why}`)
        // Stage E: a specialized role the session cannot staff is a resource shortfall (the build may try the next alternative); one it has not
        // stated is asked. Every other roster cause is typed as nothing, as before. Typed ONLY where the roster is the one thing wrong with
        // this game (`onlyTheRosterStopped`, the stage E fix): beside a broken realization or a check that fails, it is typed as nothing, so
        // the alternative refuses the activity rather than falling back with the break behind it.
        const typedRoster = !boundAfter && !duplicates.length && onlyTheRosterStopped(acceptanceBroken, post)
        const rosterApplicability: Applicability | null = !typedRoster
            ? null
            : roster?.cause === 'AVAILABILITY_SHORT'
              ? { verdict: 'NOT_APPLICABLE', cause: 'AVAILABILITY_SHORT' }
              : roster?.cause === 'AVAILABILITY_NOT_STATED'
                ? { verdict: 'ASK', cause: 'AVAILABILITY_NOT_STATED' }
                : null
        if (said) return refuse(said.stage, said.summary, invalid, { applicability: rosterApplicability })
        // A participant the game requires and its configuration lacks (GA-PARTICIPANTS-PRESENT, 22 October 2026): said by name.
        const lacking = participantSummary(post.missingParticipants, index, 'validation')
        if (lacking) return refuse(lacking.stage, lacking.summary, invalid)
    }
    /**
     * **A relative reassignment count is resolved from this block's own game** (register B7 version 2, stage M4, 17 October 2026;
     * his reply filed 19 October 2026, item 3 F). Once the teams' counts are entailed and the realization is checked as realized
     * (nothing lost, nothing invented: the count is still exactly what was derived), `{keepsCountOf: R}` becomes the number that
     * keeps each role's count across the exchange, and at 0 the element is not established (`derivation/reassignment.ts`). Read
     * from this block only, so the cross-block membership check still compares the other block, built independently. Recorded on
     * the realization record only where the game held one (every other record is exactly what it was); a count that does not
     * resolve is named and refuses the game.
     */
    const relativeCounts = resolveRelativeCounts(realized.game, index, (realized.record as any).roleBlock ?? null, (realized.record as any).designationBindings ?? [])
    if (relativeCounts.resolved.length || relativeCounts.removed.length || relativeCounts.problems.length) (realized.record as any).relativeCounts = relativeCounts
    invalid.push(...relativeCounts.problems)
    // An element not established is not established anywhere downstream either: the lines derived for its fields go with it, so
    // nothing owes the coach a sentence about performers who do not move (fidelity reads the derived lines as what is established).
    if (relativeCounts.removed.length) {
        const gone = (path: unknown) => relativeCounts.removed.some(id => String(path).includes(`[${id}]`))
        resolved.derived = (resolved.derived as { path: string }[]).filter(line => !gone(line.path))
        realized.record.choices = realized.record.choices.filter((choice: { path?: string; lineId?: string }) => !gone(choice.path) && !gone(choice.lineId))
    }
    /**
     * **The realized game must carry the context's approved scoring.** A context's contract reaching
     * derivation is not yet proof that its scoring reached the game: a projection is only proved by a
     * consumer. So where the context is contracted, the concrete game's primary event must be one the context
     * approves (`rpcLibrary.scoringEventsForContext`), and every condition the context's contract constitutes
     * must be present in it. What is missing is named; nothing is filled in. Reached by no goal today (A01, the
     * one goal with a contracted context, stops earlier: on its record's gaps, and at Gate A behind them), so it is tested on constructed games.
     */
    if (context && selection.contracted.includes(context.id)) {
        const contract = (input.contracts as LoadedContract[]).find(c => knowledgeKey(c.contractId) === knowledgeKey(context.id))
        // Stage K7: the episode check as rerun on this concrete game, so a condition authored for an episode the game is shown to
        // begin is confirmed (context-scoring-guard.ts `episodeConfirmed`); every other condition is read as before.
        const episodeCheck = post.gateA.checks.find(check => check.checkId === EPISODE_REACHABLE_CHECK)
        // Stage M2: what establishes and fills each occurrence that also counts as the primary event (a collection whose elements earn
        // another row's value, register `earnsValueOf`), read from the derived lines, so the guard can require his ruling behind it.
        // A collection whose elements earn a value (V27); a member field earning one (B9, stage A) is a role's own event, read just below.
        const earning = [...index.rows.values()].filter(row => row.earnsValueOf !== undefined && row.kind === 'COLLECTION').map(row => row.id)
        const basisOf = (ref: { contractId: string; itemId: string }) =>
            String((input.contracts as LoadedContract[]).find(c => c.contractId === ref.contractId)?.items.find(i => i.itemId === ref.itemId)?.basis ?? 'not found')
        const alsoCountsSupport = ctx.classes
            .filter((c: any) => earning.includes(c.row))
            .map((c: any) => {
                const fields = [...index.rows.values()].filter(row => row.ownerRow === c.row).map(row => row.id)
                const refs: { contractId: string; itemId: string }[] = [c.fromItem, ...fields.flatMap(row => (ctx.derived.get(`${c.classId}::${row}`)?.entailing ?? []).map((e: any) => e.item))]
                const unique = refs.filter((ref, i) => refs.findIndex(other => other.contractId === ref.contractId && other.itemId === ref.itemId) === i)
                return { elementId: String(c.classId), items: unique.map(ref => ({ contractId: ref.contractId, itemId: ref.itemId, basis: basisOf(ref) })) }
            })
        /**
         * Stage A (22 October 2026, register version 16): what writes each role's own scoring event (the register's `roleScoring.eventRow`
         * on each role element), read from the derived lines exactly as the occurrences above are, so the guard can require his ruling
         * behind it (`roleEventFindings`). Empty for every game whose roles score by the game's primary event.
         */
        const scoringSpec = index.roleScoring
        const rolesSpec = index.roleBlocks
        const roleEventSupport =
            scoringSpec && rolesSpec
                ? ctx.classes
                      .filter((c: any) => c.row === rolesSpec.rolesRow)
                      .map((c: any) => {
                          const term = (c.constraints?.terms ?? []).find((t: any) => t.attribute === rolesSpec.roleAttribute && t.op === '=')
                          const refs: { contractId: string; itemId: string }[] = (ctx.derived.get(`${c.classId}::${scoringSpec.eventRow}`)?.entailing ?? []).map((e: any) => e.item)
                          const unique = refs.filter((ref, i) => refs.findIndex(other => other.contractId === ref.contractId && other.itemId === ref.itemId) === i)
                          // Stage A review fix: with the relationship each item cites, so an event the context does not approve is confirmed only
                          // on a confirmed scoring relationship of the context for that role and event (`roleEventFindings`).
                          const authorizedByOf = (ref: { contractId: string; itemId: string }) => {
                              const cited = (input.contracts as LoadedContract[]).find(x => x.contractId === ref.contractId)?.items.find(i => i.itemId === ref.itemId)?.authorizedBy
                              return typeof cited === 'string' ? cited : null
                          }
                          // Stage A re-review fix (23 October 2026): with the context the item's contribution realizes, so a citation counts only
                          // from a contribution realizing the context, as the role yields require (`applyRoleYields`).
                          const realizesOf = (ref: { contractId: string; itemId: string }) => {
                              const realizes = ((input.contracts as LoadedContract[]).find(x => x.contractId === ref.contractId) as { realizes?: unknown } | undefined)?.realizes
                              return typeof realizes === 'string' ? realizes : null
                          }
                          return {
                              elementId: String(c.classId),
                              role: String(term?.value ?? ''),
                              items: unique.map(ref => ({ contractId: ref.contractId, itemId: ref.itemId, basis: basisOf(ref), authorizedBy: authorizedByOf(ref), realizes: realizesOf(ref) })),
                          }
                      })
                : []
        invalid.push(...contextScoringFindings(context.id, contract, realized.game, rpcLibrary.scoringEventsForContext(context.id), episodeCheck, alsoCountsSupport, roleEventSupport, index, contextRelationships()))
        /**
         * **The requirement account of this block, report only** (29 October 2026; `requirement-account.ts`), for an administrator's review build
         * only: read after the guard, from the same realized game, the same episode check and the same readings of the event and of each
         * condition (`eventKindReadingOf`, `conditionReadingOf`), with the forward results, classes and line verdicts derivation computed for
         * this block. It pushes nothing onto `invalid` and changes no stage, summary or reason; a throw becomes the block account's ERROR.
         * The checked pathway returns one activity, so the rows evaluated over returned alternatives do not apply (`alternativesReturned`).
         */
        if (requirements) {
            const blockId = input.roleBlock?.blockId ?? ONE_GAME
            try {
                const inputs: BlockRequirementInputs = {
                    blockId,
                    contextId: context.id,
                    bindings: requirements.bindings,
                    refused: requirements.refused,
                    contracts: input.contracts as LoadedContract[],
                    forward: staged.forward ?? [],
                    classes: staged.classes ?? [],
                    classified: staged.classified ?? null,
                    game: realized.game,
                    standsFor: new Map(((realized.record as any).satisfiedByEstablished ?? []).map((entry: { classId: string; satisfiedBy: string }) => [entry.classId, entry.satisfiedBy] as [string, string])),
                    episodeCheck,
                    gameFormId: selection.selected.find(entry => entry.role === 'game form')?.id ?? null,
                    selected: selection.selected.map(entry => ({ id: entry.id, role: entry.role })),
                    eventKind: eventKindReadingOf(context.id, realized.game, rpcLibrary.scoringEventsForContext(context.id), alsoCountsSupport, roleEventSupport, index, contextRelationships()),
                    alternativesReturned: false,
                    index,
                }
                blockRequirements = blockRequirementAccountOf(inputs)
                // TEST-ONLY: handed after the account is read, so an observer can never change what was read (R3 NIT 11); it must not mutate.
                if (requirements.observe) requirements.observe(inputs)
            } catch (error) {
                blockRequirements = failedBlockRequirementAccount(blockId, context.id, error instanceof Error ? error.message : String(error))
            }
        }
    }
    if (invalid.length) return withRequirements(refuse('validation', 'The game built for this activity did not pass its own checks, so it is not being shown.', invalid))

    // The one assembler, shared with the script that freezes the Golden Case, so the frozen fixture cannot
    // come to differ in shape from what is served. Both verdicts are read, not assumed, though a game that
    // failed either was refused above.
    // The DRAFT role nouns cross with the game only where the game holds roles (stage K3), so the renderer reads them
    // from the fixture like everything else it says, and every game without roles assembles exactly as before.
    const rolesAt = index.roleBlocks ? splitPath(String(index.rows.get(index.roleBlocks.rolesRow)?.path ?? '')).container : null
    const holdsRoles = !!rolesAt && Array.isArray(rolesAt.split('.').reduce<any>((node, key) => (node == null ? node : node[key]), realized.game))
    // The DRAFT nouns for the performers a reassignment moves cross the same way, only where the game holds one (stage K4).
    const reassignmentsAt = index.reassignment ? splitPath(String(index.rows.get(index.reassignment.row)?.path ?? '')).container : null
    const holdsReassignments = !!reassignmentsAt && Array.isArray(reassignmentsAt.split('.').reduce<any>((node, key) => (node == null ? node : node[key]), realized.game))
    // The sport's approved noun for a restart method crosses only for a transition the game holds with that trigger and method
    // (stage M4, his reply filed 19 October 2026, item 4), so every game without one assembles exactly as before.
    const triggerOfTransition = (transition: any) => (transition?.selector ?? []).find((term: any) => term?.attribute === 'trigger' && term?.op === '=')?.value
    const methodNouns = (loadSportCoachVocabulary()?.restartMethodNouns ?? []).filter(entry =>
        ((realized.game as any).transitions ?? []).some((transition: any) => triggerOfTransition(transition) === entry.trigger && transition?.placement?.method === entry.method),
    )
    /**
     * **This game's default-laws account, for the renderer and fidelity** — R2, 24 October 2026 (the d27 design's section 2.8: *"under COMMON
     * the Restarts sentence is added from the account"*). Christian, reply filed 27 October 2026, item 4: *"There should be no separate
     * [restarts of the sport] for this activity."* (his nouns bracketed: the coupling ratchet keeps a sport's nouns out of this layer). The
     * same reading the build makes for the administrator once both blocks are built (`lawAccountOf`, above: `blockLawAccountOf` over this
     * realized game, the composed items of the realization being tried and the session), made here for this one game before it is rendered,
     * and only where that realization declares `defaultLawsCheck`; every other game assembles exactly as before. Carried as each law's id,
     * place and status (`rendering-fixture.ts`); a test holds it equal to the review evidence's account, block by block.
     *
     * B4 (28 October 2026): only a realization's own check crosses here. The sport's check of a composed activity (`lawAccountOf`, above)
     * goes to the build's refusal and the administrator only, never to the renderer, so it adds no coach wording: a composition's coach text
     * is what it was without the check (`default-laws-composition.unit.ts` holds it so).
     */
    const tried = realizationOf(selection)
    const triedReceived = tried ? ((input.contracts as LoadedContract[]).find(contract => contract.contractId === tried.contractId) as ProvisionalRealization | undefined) : undefined
    const lawsForAccount = triedReceived?.defaultLawsCheck ? loadSportDefaultLaws() : null
    const gameLaws =
        tried && triedReceived && lawsForAccount
            ? blockLawAccountOf({
                  blockId: input.roleBlock?.blockId ?? 'game',
                  game: realized.game,
                  roleBlock: input.roleBlock ?? null,
                  index,
                  session,
                  laws: lawsForAccount,
                  items: triedReceived.items,
                  boundRegions,
                  // R3 (24 October 2026): the departures the realization records on itself, read as the administrator's account reads them.
                  realizationDepartures: triedReceived.realizationDepartures ?? null,
              })
            : null
    /**
     * **The pairing each bound region cites, for the renderer and fidelity** — stage L, 24 October 2026 (the d27 design's stage L(b): *"The Set
     * up sentence for the box, figures read from the cited pairing"*). Christian, reply filed 26 October 2026, item 7: *"Use an existing
     * regulation [handling area] when the activity dimensions and setup permit it."* (his noun bracketed for the coupling ratchet). For every
     * region this realized game binds to an object (register row S7, read by `bindingOf`), the entry of the bound-region block this build
     * checked it against (GA-BOUND-REGION held the realized region to that entry above), whole; null where the block holds no entry of the id
     * cited (GA-BOUND-REGION refuses that before here). Every game binding no region assembles exactly as before.
     */
    /**
     * Z (25 October 2026): a region bound to a performer's end (row S7's second form) carries its pairing too, with the row in place of an
     * object (`performerEnd`) and what it borrows, so its Set up sentence and fidelity read its figures from the entry GA-BOUND-REGION held it
     * to. A region bound to an object is carried exactly as before.
     */
    const boundForFixture = ((((realized.game as any).space?.regions ?? []) as any[]) ?? []).flatMap(region => {
        const binding = bindingOf(region, index)
        if (!binding) return []
        const pairing = (boundRegions?.pairings ?? []).find(entry => entry.id === binding.pairing) ?? null
        return binding.to === 'OBJECT'
            ? [{ region: String(region?.elementId), objectId: binding.objectId, pairing }]
            : [{ region: String(region?.elementId), objectId: null, performerEnd: binding.row, borrows: [...binding.borrows], pairing }]
    })
    fixture = assembleRenderingFixture({
        resolved,
        realized,
        entailed,
        envelope: { ...session, roles: { ...session.roles } },
        accepted: Object.values(acceptance).every(entries => !(entries as unknown[]).length),
        postRealizationValidated: Boolean(post.validated),
        ...(holdsRoles ? { roleNouns: { ...index.roleBlocks!.coachNouns }, roleHolders: Object.fromEntries(roleHolderNames(index).map(name => [name, String(roleOfHolder(index, name))])) } : {}),
        ...(holdsReassignments ? { reassignmentNouns: reassignmentNounsOf(index) } : {}),
        ...(adjustments.length ? { adjustments } : {}),
        ...(alternatives.length ? { alternatives } : {}),
        // What a provisional realization withdrew from the game form's choices, with why (stage K5); absent elsewhere.
        ...(supplied.withdrawn.length ? { withdrawnChoices: supplied.withdrawn } : {}),
        ...(methodNouns.length ? { methodNouns } : {}),
        /**
         * Stage L (the R3 review's should-fix): a law departed from at a place only by the departures the realization records on itself (a
         * law its activity removes without replacing it) is marked so, so fidelity can hold its one sentence to the departure rather than to
         * the wording data alone (his reply filed 27 October 2026, item 2: "communicated once to the coach").
         */
        ...(gameLaws
            ? {
                  defaultLaws: {
                      realization: tried!.provisionalId,
                      laws: gameLaws.laws.map(entry => ({
                          law: entry.law,
                          end: entry.end,
                          status: entry.status,
                          ...(entry.status === 'DEPARTED' && entry.departedBy.length > 0 && triedReceived?.realizationDepartures && entry.departedBy.every(citation => citation.item === triedReceived.realizationDepartures!.recordedBy) ? { removedByRealization: true } : {}),
                      })),
                  },
              }
            : {}),
        ...(boundForFixture.length ? { boundRegions: boundForFixture } : {}),
    })

    /**
     * **Rendering and fidelity, as one step that can be run again on the same game** — stage 2D, 21 October 2026. A game played in role
     * blocks may be given its physical layout once both blocks are built (`physical-layout.ts`: every block's markings set out once, his
     * reply filed 22 October 2026, item 7, a general rule since his reply filed 23 October 2026, item 2), or, since stage 2G, what moves at
     * the exchange where the markings do not occupy the same places, and then each block is rendered and checked again WITH it
     * (`recommunicate`): the outcome, render, fidelity findings, integrity counts and evidence of the first render are replaced, never kept
     * beside the new ones. Nothing before rendering is re-run: either is a reading of the realized games, not a change to them. Every game
     * given neither is rendered once, exactly as before.
     */
    const communicate = (assembled: any): GameOutcome => {
        const rendered = renderConcreteGame(assembled)
        const report = checkFidelity(assembled, rendered)
        const violations = report.findings.filter((f: any) => f.severity === 'VIOLATION')
        const recommunicate = (extra: Record<string, unknown>): GameOutcome => communicate({ ...assembled, ...extra })
        // Stage K8: what the admin-only review evidence reads of this game (the gate rerun clause by clause, the owed invariants, every finding).
        const evidence: GameEvidence = {
            gateChecks: post.gateA.checks.map(check => ({ checkId: check.checkId, verdict: String(check.verdict), clauses: check.clauses.map(clause => ({ clause: clause.clause, verdict: String(clause.verdict), ...(clause.basis ? { basis: String(clause.basis) } : {}), ...(typeof clause.instances === 'number' ? { instances: clause.instances } : {}) })) })),
            owed: post.owed.map(entry => ({ checkId: entry.checkId, clause: entry.clause, verdict: entry.verdict })),
            findings: report.findings.map((finding: FidelityFinding) => ({ ...finding })),
        }
        // Stage K7: a refusal at communication carries what was rendered, for the admin-only review draft and the cross-block checks.
        const atCommunication = (summary: string, reasons: string[]): GameOutcome =>
            withRequirements({ outcome: 'refused', stage: 'communication', summary, reasons, fixture: assembled, communication: { rendered, violations, contracts: input.contracts, evidence }, recommunicate })
        /**
         * **Part of the game has no approved wording yet, so the activity is not shown** — chosen from the
         * renderer's typed `withheld` list, never from the fidelity text (which reports the same fields as
         * uncarried, and travels in the reasons beside them). Christian, 14 October 2026: *"Enable accurate
         * coach-facing communication of scoring conditions and information rules, using approved language."* A
         * rule of the game said in words nobody approved would be a rule on the renderer's authority.
         */
        if (rendered.withheld.length) {
            return atCommunication('Part of this activity is still waiting for approved coach wording, so it is not being shown.', [
                ...rendered.withheld.map(field => `awaiting approved wording: ${field.path} (${field.row})`),
                ...violations.map((v: any) => `fidelity Q${v.question}: ${v.what}`),
            ])
        }
        if (violations.length) {
            return atCommunication(
                'Part of this activity cannot be explained to a coach yet, so it is not being shown.',
                violations.map((v: any) => `fidelity Q${v.question}: ${v.what}`),
            )
        }

        return withRequirements({
            outcome: 'built',
            fixture: assembled,
            rendered,
            integrity: {
                gateA: String(resolved.coherence.gateA),
                realizationAuthorized: Boolean(resolved.coherence.realizationAuthorized),
                acceptance,
                postRealizationValidated: Boolean(post.validated),
                instructions: rendered.instructions.length,
                fidelityViolations: violations.length,
            },
            contracts: input.contracts,
            concreteChecks: post.gateA.checks.map(check => ({ checkId: check.checkId, verdict: String(check.verdict) })),
            evidence,
            recommunicate,
        })
    }
    return communicate(fixture)
}
