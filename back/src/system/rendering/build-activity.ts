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
import { loadSportCoachVocabulary, ProvisionalRealization, provisionalRealizationNamed, TestingBoundaries } from '../derivation/corpus'
import { isStampedHalt } from '../derivation/emit'
import { runDerivation, runStages0to10, runStages0to5 } from '../derivation/engine'
import { resolveRelativeCounts } from '../derivation/reassignment'
import { indexRegister } from '../derivation/register'
import { assembleResolvedGame, splitPath } from '../derivation/resolved-game'
import { roleHolderNames, roleOfHolder } from '../derivation/designation'
import { roleBlocksOf } from '../derivation/role-blocks'
import { BoundedSelection, CONTEXT_ROLE, contractCoverage, derivationInputFor, GoalSelectionGap, knowledgeKey, KnowledgeSelection, selectFor } from '../derivation/run-bounded-selection'
import { LoadedContract, RoleBlock } from '../derivation/types'
import { gpLibrary } from '../knowledge-core/gp-library'
import { completeConcreteGame, rosterRefusal, RosterRefusal } from '../realization/assemble-concrete-game'
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
import { allocationPrinciple, authorizationLists, contextManipulationRelationships, learningGoalAuthorizations, libraryConstraintPrinciple, neededRecordGaps } from '../test-library/learning-goal-authorizations'
import { applyRealizationDeferrals } from '../derivation/realization-deferral'
import type { ConstraintAuthority, ConstraintPoolAccount } from '../test-library/types'
import { CoachOverviewDraft, failedOverviewDraft } from './coach-overview'
import { CoachOverview, OverviewEvidence, overviewEvidenceOf, overviewForServing, OverviewOutcome } from './overview-fidelity'
import { contextScoringFindings, EPISODE_REACHABLE_CHECK } from './context-scoring-guard'
import { checkFidelity, FidelityFinding } from './fidelity'
import { ReviewDraft, reviewDraftOf } from './review-draft'
import { EvidenceBlock, LayoutFallback, ReviewEvidence, reviewEvidenceOf } from './review-evidence'
import { mechanismDemonstration } from './mechanism-demonstrations'
import { Instruction, RenderedActivity, renderConcreteGame } from './render-concrete-game'
import { assembleRenderingFixture } from './rendering-fixture'
import { layoutChoicesOf, layoutMoversOf, layoutOf, MARK_UNION_ONCE } from './physical-layout'
import { checkRoleBlockComposition, checkRoleBlockLayout, checkRoleBlocks, composeRoleBlockActivity, RoleBlockCheck, roleBlockFixture } from './role-blocks'
import { ActivitySession, availabilityQuestion } from './session-envelope'

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
     */
    context: { id: string; name: string | null; approvedScoringCondition: string | null; inThisActivity: boolean } | null
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
}

/**
 * The allocation's authority as the review page shows it (stage K4): his principle (recorded once), the relationships the
 * realization's items cite, what defers to them and is listed as the alternative, the adjustments he authorized, and the
 * realization's testing boundaries. Every string is copied from the record or the realization, never written here.
 */
export interface AllocationAccount {
    principle: { ruledOn: string; by: string; citedAs: string; principle: string }
    relationships: Pick<ContextManipulationRelationship, 'id' | 'contextId' | 'manipulationId' | 'manipulationName' | 'manipulationStatus' | 'rows' | 'status' | 'confirmedOn' | 'citedAs' | 'words' | 'identified'>[]
    /** What defers in this composition (ruling C56): the alternative, with what it defers to. */
    alternatives: { contractId: string; itemId: string; row: string; value: unknown; defersTo: string; deferredTo: { contractId: string; itemId: string }[]; relationship: string }[]
    adjustments: AuthorizedAdjustment[]
    testingBoundaries: TestingBoundaries | null
}

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
        relationships: contextManipulationRelationships()
            .filter(entry => cited.has(entry.id))
            .map(({ id, contextId, manipulationId, manipulationName, manipulationStatus, rows, status, confirmedOn, citedAs: where, words, identified }) => ({ id, contextId, manipulationId, manipulationName, manipulationStatus, rows: [...rows], status, confirmedOn, citedAs: where, words: [...words], identified })),
        alternatives: deferred.map(entry => ({
            contractId: entry.contractId,
            itemId: entry.item.itemId,
            row: String(entry.item.row),
            value: entry.item.value,
            defersTo: entry.defersTo,
            deferredTo: entry.deferredTo.map(ref => ({ ...ref })),
            relationship: entry.relationship,
        })),
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
     * The diagram is a later stage.
     */
    overview?: CoachOverview
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
    blocks: { blockId: string; holders: Record<string, string>; integrity: ServedActivity['integrity']; concreteChecks: { checkId: string; verdict: string }[] }[]
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

/** The selection account, as far as the selection alone establishes it. */
function accountOf(selection: KnowledgeSelection, goal: BoundedSelection | null): Partial<ActivityAccount> {
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
        authorizationLists: goal?.authorization ? authorizationLists(goal.authorization, provisionalRealizationNamed(goal.authorization.provisionalRealization)) : null,
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
function gapAccountOf(gap: GoalSelectionGap): Partial<ActivityAccount> {
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
        authorizationLists: gap.authorization ? authorizationLists(gap.authorization, provisionalRealizationNamed(gap.authorization.provisionalRealization)) : null,
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

/** A build, with the goal's selection beside it for a caller that has to account for it in its own shape. */
export interface ActivityBuild {
    activity: ServedActivity | RefusedActivity
    /** The Learning Goal's selection. Null for a demonstration, and where selection did not resolve. */
    selection: BoundedSelection | null
}

export function buildActivity(request: ActivityRequest): ServedActivity | RefusedActivity {
    return buildActivityWithSelection(request).activity
}

export function buildActivityWithSelection(request: ActivityRequest): ActivityBuild {
    const { activity, selection } = build(request, null)
    return { activity, selection }
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
    options: { alter?: (contracts: LoadedContract[]) => void; alterSupplied?: (supplied: SuppliedRealization) => void } = {},
): { activity: ServedActivity | RefusedActivity; fixture: Record<string, unknown> | null } {
    const { activity, fixture } = build({ kind: 'mechanism-demonstration', demonstrationId: '', session }, options.alter ?? null, selected, null, learningGoalAuthorizations(), options.alterSupplied ?? null)
    return { activity, fixture }
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
        alterSupplied?: (supplied: SuppliedRealization) => void
        /**
         * Hardening H1, 21 October 2026, tests only: the same build as an administrator's review asks it (`buildActivityForReview`), so a
         * test can read the admin-only evidence and the coach's answer of one altered build side by side. Absent: a coach's build.
         */
        review?: { includeDrafts: boolean }
    } = {},
): { activity: ServedActivity | RefusedActivity; fixture: Record<string, unknown> | null } {
    const { activity, fixture } = build(request, options.alter ?? null, null, options.alterSelection ?? null, JSON.parse(JSON.stringify(records)), options.alterSupplied ?? null, { includeDrafts: options.review?.includeDrafts === true })
    return { activity, fixture }
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
    /** Tests only (`buildActivityOverAlteredKnowledge`): alters a copy of the realization choices. */
    alterSupplied: ((supplied: SuppliedRealization) => void) | null = null,
    /** The admin-only review (`buildActivityForReview`, stage K7): attach the draft to a refusal at communication. */
    review: { includeDrafts: boolean } = { includeDrafts: false },
): ActivityBuild & { fixture: Record<string, unknown> | null } {
    const { kind, title, subtitle } = composed ? { kind: 'mechanism-demonstration' as const, title: composed.join(' + '), subtitle: null } : describeRequest(request)
    // "This goal …" for a Learning Goal and "This demonstration …" for a demonstration: a demonstration is
    // never described to a coach as a goal, in a refusal any more than in a title.
    const subject = kind === 'learning-goal' ? 'goal' : 'demonstration'
    let account: Partial<ActivityAccount> = {}
    let goalSelection: BoundedSelection | null = null
    // Set once the game is closed and assembled; null for every refusal before that.
    let fixture: any = null
    const refuse = (stage: ActivityStage, summary: string, reasons: string[]): ActivityBuild & { fixture: Record<string, unknown> | null } => ({
        activity: { outcome: 'refused', kind, title, stage, summary, reasons, account },
        selection: goalSelection,
        fixture,
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
            goalSelection = selectFor(request.goalId, request.situationId ?? null, records)
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
                account = gapAccountOf(error)
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
            Object.assign(goalSelection, contractCoverage(goalSelection.selected))
        }
        selection = goalSelection
    } else {
        selection = demonstrationSelection(mechanismDemonstration(request.demonstrationId)!.selected)
    }
    account = accountOf(selection, goalSelection)

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
     */
    const provisionalRealization = provisionalRealizationNamed(goalSelection?.authorization?.provisionalRealization)
    const notFor = provisionalRealization && goalSelection?.chosenSituation ? provisionalRealization.notWithPracticeSituations.find(situation => situation.id === goalSelection!.chosenSituation!.id) : null
    if (provisionalRealization && notFor) {
        return refuse('knowledge', "This goal's first activity was not designed for the chosen practice situation, so no activity can be built for it.", [
            `the provisional realization ${provisionalRealization.provisionalId} named by the authorization record of ${goalSelection!.goalId} was not designed for the practice situation ${notFor.id} (${notFor.basis}): ${notFor.because}`,
        ])
    }

    // The coach's envelope, whole. It used to be spread over the corpus envelope, which is how the pilot
    // came to inherit a statement about specialized roles that nobody had made for it.
    const session = request.session
    const input: any = { ...derivationInputFor(selection), envelope: { ...session, roles: { ...session.roles } } }
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
    const deferral = applyRealizationDeferrals(input.contracts as LoadedContract[], contextManipulationRelationships(), indexRegister(input.register))
    input.contracts = deferral.contracts
    /**
     * **The record's lists read the provisional realization derivation actually received** (15 October 2026, stage K2), so
     * the review page and the game can never disagree about which provisional choices shaped it. Production passes the
     * file's own copy; a test that altered a copy of the contracts sees its copy listed.
     */
    if (goalSelection?.authorization?.provisionalRealization) {
        const received = (input.contracts as LoadedContract[]).find(contract => contract.contractId === `provisional:${goalSelection!.authorization!.provisionalRealization}`) as ProvisionalRealization | undefined
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
     */
    {
        const received = (input.contracts as LoadedContract[]).find(contract => contract.contractId === `provisional:${goalSelection?.authorization?.provisionalRealization}`) as ProvisionalRealization | undefined
        const refusal = received ? testingAreaRefusal(received, session) : null
        if (refusal) return refuse('session', refusal.summary, refusal.reasons)
    }

    /**
     * What crosses with every game of this build into its fixture (stage K4): the adjustments the goal's record authorizes, in
     * his words, and what defers in this composition, listed as the alternative. Both absent for every other activity.
     */
    // `coachWords` (stage K7): our DRAFT coach wording beside his words, carried only where an entry has it (his words are not always
    // a sentence a coach can be given as a choice: "The pressure reference should be adjustable in either direction.").
    const adjustments = (goalSelection?.authorization?.authorizedAdjustments?.entries ?? []).map(entry => ({
        id: entry.id,
        words: entry.words,
        consequence: entry.consequence,
        citedAs: entry.citedAs,
        ...(typeof entry.coachWords === 'string' ? { coachWords: entry.coachWords } : {}),
    }))
    const alternatives = deferral.deferred.map(entry => ({
        contractId: entry.contractId,
        itemId: entry.item.itemId,
        row: String(entry.item.row),
        value: entry.item.value,
        defersTo: entry.defersTo,
        deferredTo: entry.deferredTo.map(ref => ({ ...ref })),
        relationship: entry.relationship,
    }))
    const game: GameContext = { subject, session, selection, context, alterSupplied, adjustments, alternatives }
    /** A game built through to communication becomes the served activity; one refused on the way says where. */
    const serve = (built: Extract<GameOutcome, { outcome: 'built' }>, extra: Partial<ServedActivity> = {}): ActivityBuild & { fixture: Record<string, unknown> | null } => ({
        activity: { outcome: 'served', kind, title, subtitle, session, rendered: built.rendered, account: account as ActivityAccount, integrity: built.integrity, ...extra },
        selection: goalSelection,
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
    const rolesRow = roleIndex.roleBlocks?.rolesRow
    if (rolesRow && (input.contracts as LoadedContract[]).some(contract => (contract.items ?? []).some(item => String(item.row) === rolesRow))) {
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
                fixture = first.outcome.fixture
                return refuse(first.outcome.stage, first.outcome.summary, stoppedReasons)
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
                return refuse('validation', membershipOnly ? `Who changes team when the roles exchange has not been decided for ${session.players} players, so this activity is not being shown.` : 'The game built for this activity did not pass its own checks, so it is not being shown.', [
                    'the two role blocks do not agree as the exchange of each other',
                    ...failing.flatMap(check => check.problems.map(problem => `${check.checkId}: ${problem}`)),
                ])
            }
            /**
             * **Every block's markings set out once, where his recorded choice applies and they can be** — stage 2D, 21 October 2026. His reply
             * filed 22 October 2026, item 7: *"For this particular 40 × 30 m configuration, we can also simplify setup by marking the halfway
             * line and both 5 m end zones at the beginning. Role exchanges should not require unnecessary physical re-marking."* Once the two
             * blocks agree as the exchange of each other, the physical layout is read from both realized games and the goal's record
             * (`layoutOf`: his recorded choice for this area, the adjustments that move a position's magnitude). Where it applies, each block
             * is rendered and checked again with it (`recommunicate`), replacing its first render, findings and evidence, and the blocks are
             * read again from there (a block the layout render refuses at communication is refused like any other). Then RB-L recomputes the
             * layout from the blocks and holds every block's to it. Where it does not apply, nothing is re-rendered: the per-block text stays
             * exactly as it was, and, where a choice was recorded, the admin-only review evidence says why (hardening H1, below).
             */
            const layoutChoices = layoutChoicesOf(goalSelection?.authorization)
            const layoutMovers = layoutMoversOf(goalSelection?.authorization)
            const layoutDecision = layoutOf(
                games.map(entry => ({ blockId: entry.block.blockId, fixture: entry.fixture })),
                layoutChoices,
                layoutMovers,
            )
            if (layoutDecision.applies) {
                blocks = blocks.map(entry => {
                    const again = entry.outcome.recommunicate
                    return { block: entry.block, outcome: again ? again({ layout: layoutDecision.layout }) : entry.outcome }
                })
                stopped = stoppedOf(blocks)
                first = firstOf(stopped)
                stoppedReasons = reasonsOf(stopped)
                games = gamesOf(blocks)
            }
            const layoutCheck = checkRoleBlockLayout(
                games.map(entry => ({ blockId: entry.block.blockId, fixture: entry.fixture })),
                layoutChoices,
                layoutMovers,
            )
            checks.push(layoutCheck)
            fixture = { ...games[0].fixture, roleBlocks: roleBlockFixture(found, games.map(entry => ({ block: entry.block, fixture: entry.fixture })), checks, roleIndex) }
            if (layoutCheck.verdict === 'FAIL') {
                return refuse('validation', 'The game built for this activity did not pass its own checks, so it is not being shown.', [
                    'the markings set out once are not the blocks\' own',
                    ...layoutCheck.problems.map(problem => `${layoutCheck.checkId}: ${problem}`),
                ])
            }
            const renders = games.map(entry => ({ blockId: entry.block.blockId, rendered: entry.rendered, fixture: entry.fixture }))
            const composed = composeRoleBlockActivity(renders, roleIndex)
            /**
             * Stage 2D: where his choice is recorded and the markings stay block by block, why is said (DRAFT words) — to an administrator
             * only. Hardening H1, 21 October 2026 (the 2D review's should-fix 1): it was pushed onto `coachingObservations`, which every
             * viewer can expand under "How this was arrived at", and it carries internal ids (an element id, block ids, the choice's code).
             * It now goes to the admin-only review evidence (`reviewEvidenceOf`, `layoutFallback`), and the composed activity a coach is
             * served is exactly the composition of the block renders.
             */
            const layoutFallback = !layoutDecision.applies && layoutDecision.recorded ? { choice: MARK_UNION_ONCE, why: [...layoutDecision.why] } : null
            const composition = checkRoleBlockComposition(renders, composed, roleIndex)
            const violations = composition.filter(finding => finding.severity === 'VIOLATION')
            /**
             * The admin-only review evidence of the composed activity (stage K8), for a goal whose record asks for one: read from the two
             * games as built, the cross-block checks and the composition. Never on a coach's answer.
             */
            const evidenceOf = (outcome: string, overview: OverviewEvidence | null = null) =>
                reviewEvidenceFor(review, goalSelection, account, roleIndex, session, outcome, composed, composition, checks, games.map(entry => ({ blockId: entry.block.blockId, holders: { ...entry.block.holders }, fixture: entry.fixture, contracts: entry.contracts, rendered: entry.rendered, ...entry.evidence })), layoutFallback, overview)
            /** The admin-only draft of the composed activity (stage K7), attached to a refusal at communication where it was asked for. */
            const withDraft = (refusal: ReturnType<typeof refuse>) => {
                if (review.includeDrafts) (refusal.activity as RefusedActivity).draft = reviewDraftOf(games.map(entry => entry.fixture), composed, [...games.flatMap(entry => entry.violations), ...violations])
                const evidence = evidenceOf(refusal.activity.outcome === 'refused' ? refusal.activity.stage : 'served')
                if (evidence) (refusal.activity as RefusedActivity).evidence = evidence
                return refusal
            }
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
                        blocks: built.map(entry => ({ blockId: entry.block.blockId, holders: { ...entry.block.holders }, integrity: entry.built.integrity, concreteChecks: entry.built.concreteChecks.map(check => ({ ...check })) })),
                        checks: checks.map(check => ({ ...check, problems: [...check.problems] })),
                        firstBlock: 'COACH_CHOICE',
                        firstBlockBasis: FIRST_BLOCK_BASIS,
                    },
                    // Stage K8: the admin-only review evidence, where the goal's record asks for one; absent on every coach's answer.
                    ...((evidence => (evidence ? { evidence } : {}))(evidenceOf('served', overview.evidence))),
                    // Stage 3D: the overview where it agrees (every viewer); its draft and the check's findings for an administrator only.
                    ...overviewKeys(overview),
                },
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
        const refusal = refuse(one.stage, one.summary, one.reasons)
        // The admin-only draft (stage K7): only on a refusal at communication, only where the review asked for it.
        if (review.includeDrafts && one.communication) (refusal.activity as RefusedActivity).draft = reviewDraftOf([one.fixture], one.communication.rendered, one.communication.violations)
        // And the admin-only review evidence (stage K8), where the goal's record asks for one.
        const evidence = one.communication && one.fixture ? reviewEvidenceFor(review, goalSelection, account, roleIndex, session, one.stage, one.communication.rendered, [], [], [{ blockId: ONE_GAME, holders: {}, fixture: one.fixture, contracts: one.communication.contracts, rendered: one.communication.rendered, ...one.communication.evidence }]) : null
        if (evidence) (refusal.activity as RefusedActivity).evidence = evidence
        return refusal
    }
    // Stage 3D: the overview of the one game, checked against its Details (which are what a coach is served).
    const overview = overviewOf([{ blockId: ONE_GAME, fixture: one.fixture, rendered: one.rendered }], one.rendered.instructions)
    const evidence = reviewEvidenceFor(review, goalSelection, account, roleIndex, session, 'served', one.rendered, [], [], [{ blockId: ONE_GAME, holders: {}, fixture: one.fixture, contracts: one.contracts, rendered: one.rendered, ...one.evidence }], null, overview.evidence)
    return serve(one, { ...(evidence ? { evidence } : {}), ...overviewKeys(overview) })
}

/** The block id the review evidence gives a game not played in role blocks. */
const ONE_GAME = 'ONE_GAME'

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
    /** Hardening H1: where a recorded choice to set the markings out once does not apply, why (admin-only). Null everywhere else. */
    layoutFallback: LayoutFallback | null = null,
    /** Stage 3D: the overview's verdict, findings, statuses and reading evidence (admin-only); null on a refusal, where there is none. */
    overview: OverviewEvidence | null = null,
): ReviewEvidence | null {
    const record = goalSelection?.authorization
    if (!review.includeDrafts || !record?.reviewRequest) return null
    return reviewEvidenceOf({
        outcome,
        session,
        blocks,
        composed,
        compositionFindings,
        crossBlock,
        layoutFallback,
        record: record as LearningGoalAuthorization & { reviewRequest: NonNullable<LearningGoalAuthorization['reviewRequest']> },
        lists: account.authorizationLists ?? null,
        relationships: contextManipulationRelationships(),
        selectedConstraints: (account.constraints ?? []).map(constraint => constraint.id),
        index,
        overview,
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
    alterSupplied: ((supplied: SuppliedRealization) => void) | null
    /** The record's authorized adjustments, in his words, for the fixture (stage K4). Empty for every other activity. */
    adjustments: { id: string; words: string; consequence: string | null; citedAs: string; coachWords?: string }[]
    /** What defers in this composition (ruling C56), for the fixture. Empty wherever nothing defers. */
    alternatives: { contractId: string; itemId: string; row: string; value: unknown; defersTo: string; deferredTo: { contractId: string; itemId: string }[]; relationship: string }[]
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
          /** Stage 2D: the same game rendered and checked again with these fields added to its fixture (its physical layout). */
          recommunicate: (extra: Record<string, unknown>) => GameOutcome
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
function buildOneGame(input: any, { subject, session, selection, context, alterSupplied, adjustments, alternatives }: GameContext): GameOutcome {
    let fixture: any = null
    const refuse = (stage: ActivityStage, summary: string, reasons: string[]): GameOutcome => ({ outcome: 'refused', stage, summary, reasons, fixture })

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

    /**
     * **Realization input, by the selected game form.** See `supplied-realization`: the choices close what a
     * knowledge object leaves open, so they are found by the object and not by the goal that selected it.
     */
    let supplied = suppliedRealizationFor(selection)
    if (alterSupplied && !isNoSuppliedRealization(supplied)) {
        supplied = JSON.parse(JSON.stringify(supplied)) as SuppliedRealization
        alterSupplied(supplied)
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
    const acceptance = checkRealization(resolved, realized)
    const post = runPostRealizationGates(
        ctx,
        resolved.coherence.postRealizationRequired.map((o: any) => ({ checkId: o.checkId, clause: o.clause })),
        realized,
    )

    const invalid: string[] = []
    for (const [name, entries] of Object.entries(acceptance)) if ((entries as unknown[]).length) invalid.push(`${name}: ${JSON.stringify(entries)}`)
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
        if (said) return refuse(said.stage, said.summary, invalid)
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
        const earning = [...index.rows.values()].filter(row => row.earnsValueOf !== undefined).map(row => row.id)
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
        invalid.push(...contextScoringFindings(context.id, contract, realized.game, rpcLibrary.scoringEventsForContext(context.id), episodeCheck, alsoCountsSupport))
    }
    if (invalid.length) return refuse('validation', 'The game built for this activity did not pass its own checks, so it is not being shown.', invalid)

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
    })

    /**
     * **Rendering and fidelity, as one step that can be run again on the same game** — stage 2D, 21 October 2026. A game played in role
     * blocks may be given its physical layout once both blocks are built (`physical-layout.ts`: every block's markings set out once, his
     * reply filed 22 October 2026, item 7), and then each block is rendered and checked again WITH it (`recommunicate`): the outcome,
     * render, fidelity findings, integrity counts and evidence of the first render are replaced, never kept beside the new ones. Nothing
     * before rendering is re-run: the layout is a reading of the realized games, not a change to them. Every game without a layout is
     * rendered once, exactly as before.
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
        const atCommunication = (summary: string, reasons: string[]): GameOutcome => ({ outcome: 'refused', stage: 'communication', summary, reasons, fixture: assembled, communication: { rendered, violations, contracts: input.contracts, evidence }, recommunicate })
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

        return {
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
        }
    }
    return communicate(fixture)
}
