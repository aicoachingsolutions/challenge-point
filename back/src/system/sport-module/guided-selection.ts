/**
 * The selection hints for a guided Learning Goal — one function, so every pathway asks the same question.
 *
 * Christian, 13 October 2026: *"the approved Game Problem translation should govern wherever it disagrees
 * with inference from Learning Goal wording. A Learning Goal should not silently acquire a different Game
 * Problem simply because certain words appear in its description. Where the approved translation is
 * incomplete, please identify that as an unresolved learning-design decision rather than substituting an
 * inferred mapping."* And of the context rule he approved on 12–13 September: *"Please ensure the checked
 * pathway and application follow the same authoritative knowledge and selection rules."*
 *
 * WHY THIS IS A FUNCTION AND NOT A CONVENTION. The context rule existed and was applied by the application
 * route alone. The integrity-checked pathway composed its own hints and left it out, so for a month it
 * reported game forms for seven of the thirteen goals that the application would never have selected. Two
 * call sites each composing the rule by hand is how one of them came to lack it. Both now call this.
 *
 * WHAT THE GAME PROBLEM AUTHORITY DOES, AND WHAT IT DELIBERATELY DOES NOT.
 *   - The Game Problem the wording implies is read the way the engine has always read it: the first matched
 *     signal group that maps to a canonical Game Problem.
 *   - Where the Session Planning Model holds an approved translation and the two AGREE, nothing changes.
 *   - Where they DISAGREE, the approved Game Problem governs: the candidate lenses, game forms and
 *     constraints become the ones the sport module's own Coverage row records for that Game Problem. That
 *     row is the existing candidate knowledge re-keyed by Game Problem — it was derived from the same
 *     signal-group pools — so no pool is authored here and none is altered. (Since 15 October 2026 the
 *     CONSTRAINTS of a goal with an authorization record come from that record instead: see
 *     `hintsUnderAuthorization`.)
 *   - Where NO translation is approved, the hints are left exactly as the wording produced them and the
 *     Game Problem is reported as UNRESOLVED. The inference is never presented as the goal's Game Problem.
 *
 * It sits in front of the context gate and goes through the candidate-pool hint for the same reason that
 * gate does: the sport-neutral selector never imports the sport layer.
 */
import type { InputConstraintHints } from '../input-constraints/deriveInputConstraints'
import { deriveInputConstraints } from '../input-constraints/deriveInputConstraints'
import { SIGNAL_GROUP_TO_GAME_PROBLEM } from '../knowledge-core/affordance-target-matrix'
import { gameProblemsForLearningGoal, sessionPlanningModel } from '../session-planning/session-planning-model'
import { learningGoalAuthorization, learningGoalAuthorizations, LearningGoalAuthorization } from '../test-library/learning-goal-authorizations'
import { gateCandidateGameFormsToContext } from './context-selection'
import { soccerModule } from './soccer-module'

export interface GameProblemAuthority {
    /** UNRESOLVED means no translation is approved: an open learning-design decision, not a value. */
    status: 'APPROVED' | 'UNRESOLVED'
    /** The approved Game Problem, or null while the translation is unresolved. */
    gameProblemId: string | null
    /** What the wording alone implies. Recorded so a disagreement stays visible; never used as the answer. */
    inferredFromWording: string | null
    /** True where the approved translation replaced the candidates the wording produced. */
    governed: boolean
}

export interface GuidedSelectionHints {
    hints: InputConstraintHints
    /** The Representative Performance Context the goal routes to, or null when it routes to none. */
    contextId: string | null
    gameProblem: GameProblemAuthority
    /**
     * The goal's authorization record (15 October 2026), as a copy, or null where it has none — in which case its
     * candidate constraints are the vocabulary pool and are labelled so. Carried so the account shows the record
     * selection actually used, never a second read of it.
     */
    authorization: LearningGoalAuthorization | null
}

const SIGNAL_GROUP = 'signalGroup:'

/** The Game Problem the wording implies: the first matched signal group that maps to one. */
export function gameProblemInferredFromWording(hints: InputConstraintHints): string | null {
    for (const signal of hints.matchedSignals ?? []) {
        const mapped = SIGNAL_GROUP_TO_GAME_PROBLEM[signal]
        if (mapped?.length) return mapped[0]
    }
    return null
}

const list = (value: unknown): string[] =>
    String(value ?? '')
        .split(';')
        .map((entry) => entry.trim())
        .filter(Boolean)

/**
 * The candidate knowledge the sport module records for one Game Problem.
 *
 * `matchedSignals` names the signal groups that belong to the Game Problem, because the selector decides
 * whether a selection resolved from those and the affordance profile is read from them. They are the
 * groups the Coverage row was derived from, taken from the same map rather than parsed out of its notes.
 */
function hintsForGameProblem(gameProblemId: string, wording: InputConstraintHints): InputConstraintHints {
    const coverage = soccerModule.coverageForGameProblem(gameProblemId)
    if (!coverage || String(coverage['coverage_status'] ?? '') !== 'SUPPORTED') {
        // No candidate knowledge exists for the approved Game Problem. Returning nothing lets the selector
        // report the goal as unresolved, which is true; borrowing the wording's pool would be the
        // substitution this function exists to prevent.
        return { candidateArchetypeIds: [], candidateAffordanceLensIds: [], candidateConstraintIds: [], matchedSignals: [] }
    }
    const groups = Object.entries(SIGNAL_GROUP_TO_GAME_PROBLEM)
        .filter(([, gameProblems]) => gameProblems[0] === gameProblemId)
        .map(([group]) => group)
    // Signals that claim no Game Problem of their own — an information intent, an unresolved title — say
    // nothing about which problem the goal is, so they travel with it.
    const neutral = (wording.matchedSignals ?? []).filter(
        (signal) => !signal.startsWith(SIGNAL_GROUP) || SIGNAL_GROUP_TO_GAME_PROBLEM[signal] === undefined
    )
    return {
        candidateArchetypeIds: list(coverage['supported_game_form_ids']),
        candidateAffordanceLensIds: list(coverage['lens_ids']),
        candidateConstraintIds: list(coverage['supported_realization_group_ids']),
        matchedSignals: [...groups, ...neutral.filter((signal) => signal !== `${SIGNAL_GROUP}Z_soccer_general`)],
    }
}

/**
 * Apply the approved Game Problem translation to the hints a goal's wording produced.
 *
 * `approved` is read from the Session Planning Model and is a parameter only so a test can force the case
 * the registry does not currently contain: an approved Game Problem the sport module holds nothing for.
 */
export function governByApprovedGameProblem(
    learningGoalId: string,
    wording: InputConstraintHints,
    approved: string | null = gameProblemsForLearningGoal(learningGoalId)?.primary[0] ?? null
): { hints: InputConstraintHints; gameProblem: GameProblemAuthority } {
    const inferredFromWording = gameProblemInferredFromWording(wording)

    if (!approved) {
        return { hints: wording, gameProblem: { status: 'UNRESOLVED', gameProblemId: null, inferredFromWording, governed: false } }
    }
    if (approved === inferredFromWording) {
        return { hints: wording, gameProblem: { status: 'APPROVED', gameProblemId: approved, inferredFromWording, governed: false } }
    }
    return {
        hints: hintsForGameProblem(approved, wording),
        gameProblem: { status: 'APPROVED', gameProblemId: approved, inferredFromWording, governed: true },
    }
}

/**
 * **The one text a guided Learning Goal is selected from — in BOTH pathways.** Added 14 October 2026 (stage S-C2).
 *
 * Christian, 13 October: one selection rule for both pathways (*"Please ensure the checked pathway and application
 * follow the same authoritative knowledge and selection rules"*). The rule was shared and the TEXT was not: the
 * checked pathway selected from the goal's own name and Coach Definition, while the application route selected from
 * whatever the planning conversation composed — the goal's name, the practice situation and the coach's free note.
 * Measured in the S-A review: Play Through Pressure (A02) landed on one game form live and another checked, and Play
 * Out from the Back (A01) drew different candidates with the wording. A guided goal is a goal from the registry, so
 * it is selected from the registry's words for it; the coach's situation and note still reach generation, and never
 * selection. Free text is untouched — it has no registry entry, and nothing is inferred onto it.
 */
export function guidedGoalText(learningGoalId: string): string {
    const goal: any = sessionPlanningModel.learningGoal(learningGoalId)
    if (!goal) throw new Error(`no such learning goal: ${learningGoalId}`)
    return `${goal['Learning Goal']}. ${goal['Coach Definition']}`
}

/**
 * **The candidate constraints of a goal with an authorization record are the record's, and nothing else's.**
 * Added 15 October 2026. Christian (item 1): *"approving Gain Access does not automatically authorize the
 * candidate constraints currently derived from vocabulary coverage. I would prefer that the activity's
 * constraints be selected based on their documented relationship to the approved context, Game Problem, and
 * target affordances."*
 *
 * So for such a goal the constraints replace BOTH vocabulary sources — the wording pool and the approved Game
 * Problem's Coverage row, which this file's header already calls the same signal-group pools re-keyed — and the
 * hints say whose authority they carry. The Game Problem authority is untouched (status, Game Problem, governed),
 * the game forms still pass the context gate, and the lenses stay as they were: they are the engine's reasoning
 * dimension and the selection trace labels them so. Recording a Game Problem therefore cannot move a recorded
 * goal's constraints — measured before this landed, recording Gain Access alone would have handed Play Out from
 * the Back the Coverage row's four constraints, Wide Zone Advantage among them, which his item 7 excludes.
 */
export function hintsUnderAuthorization(hints: InputConstraintHints, record: LearningGoalAuthorization): InputConstraintHints {
    const ruling = record.zeroConstraintRuling
    return {
        ...hints,
        candidateConstraintIds: [...record.authorizedConstraints],
        constraintAuthority: {
            authority: 'AUTHORIZATION_RECORD',
            learningGoalId: record.learningGoalId,
            zeroConstraintRuling: ruling ? { ruledOn: ruling.ruledOn, by: ruling.by, ruling: ruling.ruling } : null,
        },
    }
}

/**
 * Everything selection is told about a guided goal before it scores anything: the approved Game Problem
 * first, then the goal's authorization record (where it has one) for its constraints, then the goal's routed
 * context limiting the game forms.
 *
 * `records` is the authorization records in force; a parameter ONLY so a test can run the identical function
 * over a copy carrying a test-only ruling. Every pathway that serves anything calls it with the default.
 */
export function guidedSelectionHints(
    learningGoalId: string,
    goalText: string,
    records: LearningGoalAuthorization[] = learningGoalAuthorizations()
): GuidedSelectionHints {
    const governed = governByApprovedGameProblem(learningGoalId, deriveInputConstraints(goalText))
    const authorization = learningGoalAuthorization(learningGoalId, records)
    const authorized = authorization ? hintsUnderAuthorization(governed.hints, authorization) : governed.hints
    const route = sessionPlanningModel.rpcRouting().find((entry) => entry.learningGoalId === learningGoalId)
    const contextId = route?.rpcId ? String(route.rpcId) : null
    return {
        hints: contextId ? gateCandidateGameFormsToContext(authorized, contextId) : authorized,
        contextId,
        gameProblem: governed.gameProblem,
        authorization,
    }
}
