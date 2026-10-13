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
 *     signal-group pools — so no pool is authored here and none is altered.
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
 * Everything selection is told about a guided goal before it scores anything: the approved Game Problem
 * first, then the goal's routed context limiting the game forms.
 */
export function guidedSelectionHints(learningGoalId: string, goalText: string): GuidedSelectionHints {
    const governed = governByApprovedGameProblem(learningGoalId, deriveInputConstraints(goalText))
    const route = sessionPlanningModel.rpcRouting().find((entry) => entry.learningGoalId === learningGoalId)
    const contextId = route?.rpcId ? String(route.rpcId) : null
    return {
        hints: contextId ? gateCandidateGameFormsToContext(governed.hints, contextId) : governed.hints,
        contextId,
        gameProblem: governed.gameProblem,
    }
}
