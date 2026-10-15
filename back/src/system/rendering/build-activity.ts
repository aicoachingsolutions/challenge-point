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
import { isStampedHalt } from '../derivation/emit'
import { runDerivation, runStages0to10 } from '../derivation/engine'
import { indexRegister } from '../derivation/register'
import { assembleResolvedGame } from '../derivation/resolved-game'
import { BoundedSelection, CONTEXT_ROLE, contractCoverage, derivationInputFor, GoalSelectionGap, knowledgeKey, KnowledgeSelection, selectFor } from '../derivation/run-bounded-selection'
import { LoadedContract } from '../derivation/types'
import { gpLibrary } from '../knowledge-core/gp-library'
import { completeConcreteGame, rosterRefusal, RosterRefusal } from '../realization/assemble-concrete-game'
import { runPostRealizationGates } from '../realization/post-realization-gate'
import { realizeWithJustifiedDefaults, StrandedCount } from '../realization/justified-defaults'
import { checkRealization, isRefused, Realized } from '../realization/realize'
import { isNoSuppliedRealization, suppliedRealizationFor } from '../realization/supplied-realization'
import { sessionPlanningModel } from '../session-planning/session-planning-model'
import { rpcLibrary } from '../sport-module/rpc-library'
import { TEST_LIBRARY_V0_AFFORDANCE_LENSES, TEST_LIBRARY_V0_ARCHETYPES, TEST_LIBRARY_V0_CONSTRAINTS, TEST_LIBRARY_V0_ENVIRONMENTAL_MANIPULATIONS } from '../test-library'
import type { SelectionKnowledgeGapReason } from '../test-library/generateSelection'
import { learningGoalSelectionHolds } from '../test-library/learning-design-holds'
import type { AuthorizationExclusion, LearningGoalAuthorization } from '../test-library/learning-goal-authorizations'
import { learningGoalAuthorizations } from '../test-library/learning-goal-authorizations'
import type { ConstraintAuthority, ConstraintPoolAccount } from '../test-library/types'
import { contextScoringFindings } from './context-scoring-guard'
import { checkFidelity } from './fidelity'
import { mechanismDemonstration } from './mechanism-demonstrations'
import { RenderedActivity, renderConcreteGame } from './render-concrete-game'
import { assembleRenderingFixture } from './rendering-fixture'
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
        /** The ruling under which a record-backed goal committed no library constraint; null in production. */
        zeroConstraintRuling: { ruledOn: string; by: string } | null
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
}

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
        zeroConstraintRuling: pool.zeroConstraintRuling ? { ...pool.zeroConstraintRuling } : null,
        lensAuthority: 'ENGINE_LENS',
        unfilledRoles: [...pool.unfilledRoles],
        heldByRuling: pool.heldByRuling.map(hold => ({ id: hold.id, title: constraintTitle(hold.id), ruledOn: hold.ruledOn })),
        gap,
    }
}

/** The authorization record as the account carries it: whole, a copy, each exclusion with its library title. */
function authorizationOf(record: LearningGoalAuthorization | null): ActivityAccount['authorization'] {
    if (!record) return null
    const copy: LearningGoalAuthorization = JSON.parse(JSON.stringify(record))
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
        selectedWithoutContract: [],
        ...provisionalOf(gap.gameProblem),
        ...(gap.gap.archetypeId ? { gameForm: gameFormOf(gap.gap.archetypeId, contracted.has(gap.gap.archetypeId)) } : {}),
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
export function buildActivityOverAlteredKnowledge(request: ActivityRequest, alter: (contracts: LoadedContract[]) => void): ServedActivity | RefusedActivity {
    return build(request, alter).activity
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
export function buildActivityFromKnowledge(selected: string[], session: ActivitySession): { activity: ServedActivity | RefusedActivity; fixture: Record<string, unknown> | null } {
    const { activity, fixture } = build({ kind: 'mechanism-demonstration', demonstrationId: '', session }, null, selected)
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
 * His item 1 of that day leaves Play Out from the Back with no authorized library constraint, and whether it may
 * then be built with none is his decision D1, so production data says nothing may be committed. The mechanism that
 * would commit zero constraints under such a ruling has to be proved before he answers, on the real chain and not a
 * copy of it. A test hands this a deep copy of the records with a test-only ruling; the shared records are never
 * touched, and neither entry point above accepts the argument.
 */
export function buildActivityUnderAuthorizationRecords(
    request: Extract<ActivityRequest, { kind: 'learning-goal' }>,
    records: LearningGoalAuthorization[],
    /** Also tests only: alter a copy of the contracts, or of the selection, exactly as the two entries above do. */
    options: { alter?: (contracts: LoadedContract[]) => void; alterSelection?: (selection: BoundedSelection) => void } = {},
): { activity: ServedActivity | RefusedActivity; fixture: Record<string, unknown> | null } {
    const { activity, fixture } = build(request, options.alter ?? null, null, options.alterSelection ?? null, JSON.parse(JSON.stringify(records)))
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

    // The coach's envelope, whole. It used to be spread over the corpus envelope, which is how the pilot
    // came to inherit a statement about specialized roles that nobody had made for it.
    const session = request.session
    const input: any = { ...derivationInputFor(selection), envelope: { ...session, roles: { ...session.roles } } }
    if (alter) {
        // The loader returns SHARED contract objects, so the alteration is made to a copy and to nothing else.
        input.contracts = JSON.parse(JSON.stringify(input.contracts))
        alter(input.contracts)
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
    const supplied = suppliedRealizationFor(selection)
    if (isNoSuppliedRealization(supplied)) {
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
     * **The realized game must carry the context's approved scoring.** A context's contract reaching
     * derivation is not yet proof that its scoring reached the game: a projection is only proved by a
     * consumer. So where the context is contracted, the concrete game's primary event must be one the context
     * approves (`rpcLibrary.scoringEventsForContext`), and every condition the context's contract constitutes
     * must be present in it. What is missing is named; nothing is filled in. Reached by no goal today (A01, the
     * one goal with a contracted context, stops at Gate A), so it is tested on constructed games.
     */
    if (context && selection.contracted.includes(context.id)) {
        const contract = (input.contracts as LoadedContract[]).find(c => knowledgeKey(c.contractId) === knowledgeKey(context.id))
        invalid.push(...contextScoringFindings(context.id, contract, realized.game, rpcLibrary.scoringEventsForContext(context.id)))
    }
    if (invalid.length) return refuse('validation', 'The game built for this activity did not pass its own checks, so it is not being shown.', invalid)

    // The one assembler, shared with the script that freezes the Golden Case, so the frozen fixture cannot
    // come to differ in shape from what is served. Both verdicts are read, not assumed, though a game that
    // failed either was refused above.
    fixture = assembleRenderingFixture({
        resolved,
        realized,
        entailed,
        envelope: { ...session, roles: { ...session.roles } },
        accepted: Object.values(acceptance).every(entries => !(entries as unknown[]).length),
        postRealizationValidated: Boolean(post.validated),
    })

    const rendered = renderConcreteGame(fixture)
    const report = checkFidelity(fixture, rendered)
    const violations = report.findings.filter((f: any) => f.severity === 'VIOLATION')
    /**
     * **Part of the game has no approved wording yet, so the activity is not shown** — chosen from the
     * renderer's typed `withheld` list, never from the fidelity text (which reports the same fields as
     * uncarried, and travels in the reasons beside them). Christian, 14 October 2026: *"Enable accurate
     * coach-facing communication of scoring conditions and information rules, using approved language."* A
     * rule of the game said in words nobody approved would be a rule on the renderer's authority.
     */
    if (rendered.withheld.length) {
        return refuse('communication', 'Part of this activity is still waiting for approved coach wording, so it is not being shown.', [
            ...rendered.withheld.map(field => `awaiting approved wording: ${field.path} (${field.row})`),
            ...violations.map((v: any) => `fidelity Q${v.question}: ${v.what}`),
        ])
    }
    if (violations.length) {
        return refuse(
            'communication',
            'Part of this activity cannot be explained to a coach yet, so it is not being shown.',
            violations.map((v: any) => `fidelity Q${v.question}: ${v.what}`),
        )
    }

    return {
        activity: {
            outcome: 'served',
            kind,
            title,
            subtitle,
            session,
            rendered,
            account: account as ActivityAccount,
            integrity: {
                gateA: String(resolved.coherence.gateA),
                realizationAuthorized: Boolean(resolved.coherence.realizationAuthorized),
                acceptance,
                postRealizationValidated: Boolean(post.validated),
                instructions: rendered.instructions.length,
                fidelityViolations: violations.length,
            },
        },
        selection: goalSelection,
        fixture,
    }
}
