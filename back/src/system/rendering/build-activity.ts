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
import { BoundedSelection, contractCoverage, derivationInputFor, KnowledgeSelection, selectFor } from '../derivation/run-bounded-selection'
import { LoadedContract } from '../derivation/types'
import { gpLibrary } from '../knowledge-core/gp-library'
import { completeConcreteGame, rosterRefusal, RosterRefusal } from '../realization/assemble-concrete-game'
import { runPostRealizationGates } from '../realization/post-realization-gate'
import { checkRealization, isRefused, realize, Realized } from '../realization/realize'
import { isNoSuppliedRealization, suppliedRealizationFor } from '../realization/supplied-realization'
import { sessionPlanningModel } from '../session-planning/session-planning-model'
import { TEST_LIBRARY_V0_AFFORDANCE_LENSES, TEST_LIBRARY_V0_ARCHETYPES, TEST_LIBRARY_V0_CONSTRAINTS, TEST_LIBRARY_V0_ENVIRONMENTAL_MANIPULATIONS } from '../test-library'
import { checkFidelity } from './fidelity'
import { mechanismDemonstration } from './mechanism-demonstrations'
import { RenderedActivity, renderConcreteGame } from './render-concrete-game'
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
    gameForm: { id: string; name: string | null; contracted: boolean }
    affordanceLenses: string[]
    /** `contracted` is whether the constraint actually shapes the game. One without a contract contributes nothing. */
    constraints: { id: string; title: string; contracted: boolean }[]
    selectedWithoutContract: string[]
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

/** The selection account, as far as the selection alone establishes it. */
function accountOf(selection: KnowledgeSelection, goal: BoundedSelection | null): Partial<ActivityAccount> {
    const contracted = new Set(selection.contracted)
    const form = selection.selected.find(entry => entry.role === 'game form')
    const constraints = selection.selected.filter(entry => entry.role.includes('constraint'))
    const account: Partial<ActivityAccount> = {
        gameProblem: goal
            ? {
                  status: goal.gameProblem.status,
                  gameProblemId: goal.gameProblem.gameProblemId,
                  name: goal.gameProblem.gameProblemId ? (gpLibrary.gameProblem(goal.gameProblem.gameProblemId)?.Name ?? null) : null,
                  inferredFromWording: goal.gameProblem.inferredFromWording,
                  governed: goal.gameProblem.governed,
              }
            : null,
        contextId: goal ? goal.contextId : null,
        affordanceLenses: selection.selected
            .filter(entry => entry.role.startsWith(LENS))
            .map(entry => String(TEST_LIBRARY_V0_AFFORDANCE_LENSES.find(lens => lens.id === entry.id)?.title ?? entry.id)),
        constraints: constraints.map(entry => ({
            id: entry.id,
            title: constraintTitle(entry.id),
            contracted: contracted.has(entry.id),
        })),
        selectedWithoutContract: [...selection.missing],
    }
    if (form) {
        const library: any = TEST_LIBRARY_V0_ARCHETYPES.find(archetype => archetype.id === form.id)
        account.gameForm = { id: form.id, name: library?.game_form_name ? String(library.game_form_name) : null, contracted: contracted.has(form.id) }
    }
    return account
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
            return { stage: 'session', summary: `${roster.players} player${roster.players === 1 ? '' : 's'} cannot be split into the equal teams this game needs.` }
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
    return build(request, null)
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

function build(request: ActivityRequest, alter: ((contracts: LoadedContract[]) => void) | null): ActivityBuild {
    const { kind, title, subtitle } = describeRequest(request)
    // "This goal …" for a Learning Goal and "This demonstration …" for a demonstration: a demonstration is
    // never described to a coach as a goal, in a refusal any more than in a title.
    const subject = kind === 'learning-goal' ? 'goal' : 'demonstration'
    let account: Partial<ActivityAccount> = {}
    let goalSelection: BoundedSelection | null = null
    const refuse = (stage: ActivityStage, summary: string, reasons: string[]): ActivityBuild => ({
        activity: { outcome: 'refused', kind, title, stage, summary, reasons, account },
        selection: goalSelection,
    })

    /**
     * **Selection first, and for a goal it must have RESOLVED.** `selectFor` throws where the status is
     * `fallback` or `unresolved`, which is the invariant his 8 October ruling put at that boundary: *"fallback
     * and unresolved selections must not proceed as successful Learning Goal selections."* The goal and its
     * practice situation were checked to exist above, so a throw here is that invariant and nothing else.
     */
    let selection: KnowledgeSelection
    if (request.kind === 'learning-goal') {
        try {
            goalSelection = selectFor(request.goalId, request.situationId ?? null)
        } catch (error) {
            return refuse('selection', `This ${subject} does not yet connect to any game knowledge, so no activity can be built for it.`, [
                `selection: ${error instanceof Error ? error.message : String(error)}`,
            ])
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
    const realization = realize(resolved, supplied.choices, supplied.instantiations, index, input.envelope)
    if (isRefused(realization)) {
        // Told apart by the open lines themselves: one with no choice against it is a decision nobody has
        // made. Anything else is a decision that was made and that this game, in this session, refuses.
        const chosen = new Set(supplied.choices.map(choice => choice.lineId))
        const unmade = ((resolved.open ?? []) as { lineId: string }[]).some(open => !chosen.has(open.lineId))
        return refuse(
            'realization',
            unmade ? 'A set-up decision for this game has not been made yet.' : 'This game cannot be set out in this session with the set-up decisions made for it.',
            ['realization refused', ...(realization.because ?? [])],
        )
    }
    const realized = realization as Realized

    // Same order as the closure run: entail over the concrete game, THEN check it, THEN gate it.
    const ctx = { ...staged.gateContext, contracts: input.contracts }
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
    if (invalid.length) return refuse('validation', 'The game built for this activity did not pass its own checks, so it is not being shown.', invalid)

    const fixture: any = {
        provenance: resolved.provenance,
        closure: { renderEligible: true },
        envelope: { ...session, roles: { ...session.roles } },
        game: realized.game,
        record: realized.record,
        status: {
            derived: resolved.derived.map((d: any) => ({ path: d.path, lineId: d.lineId, value: d.value })),
            choices: realized.record.choices.map((c: any) => ({ path: c.path, lineId: c.lineId, value: c.value })),
            instantiations: realized.record.instantiations.map((i: any) => ({
                path: i.path,
                classId: i.classId,
                handle: i.handle,
                memberIndex: i.memberIndex,
                member: i.member,
            })),
            entailed,
            geometry: realized.record.geometry,
            jointConditions: resolved.jointConditions,
            notEstablished: resolved.notEstablished.map((n: any) => ({ path: n.path, lineId: n.lineId, reason: n.reason, declared: n.declared })),
        },
    }

    const rendered = renderConcreteGame(fixture)
    const report = checkFidelity(fixture, rendered)
    const violations = report.findings.filter((f: any) => f.severity === 'VIOLATION')
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
    }
}
