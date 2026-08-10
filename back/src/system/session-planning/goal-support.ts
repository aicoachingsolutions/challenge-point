/**
 * What the platform can actually build today, expressed in the coach's own planning language.
 *
 * THE PROBLEM THIS SOLVES. When a goal cannot be routed, the coach gets one generic refusal —
 * identical whether they asked for something we will never support, something we simply have not
 * populated yet, or something we support perfectly well but they phrased unusually. Those are three
 * different situations and only one of them is the coach's to fix. The suggestions offered alongside
 * the refusal were also a hardcoded list, which drifts from what the engine can really do the moment
 * either side changes.
 *
 * SUPPORT IS MEASURED, NOT DECLARED. At module load each Learning Goal from the Session Planning
 * Model is run through the live parser to see whether it reaches a specific signal group. Goals that
 * do are offered as suggestions; goals that do not are known-unsupported. Nothing is asserted by
 * hand, so this cannot drift: improve the vocabulary and a goal starts being suggested on the next
 * boot, with no list to remember to update.
 *
 * WHY THE SUGGESTIONS COME FROM THE PLANNING MODEL rather than from our own vocabulary sheet: they
 * are shown to a coach, and the planning model is the layer that owns coach-facing language. Our
 * vocabulary phrases are internal routing tokens ("shot", "compact") — accurate, but not the words
 * a coach would choose to describe a session.
 *
 * COMPUTED ONCE. The result is fixed for the lifetime of the process because both inputs are
 * static — a committed workbook and a compiled parser. Doing it per request would repeat identical
 * work on a path a coach is already waiting on.
 */
import { deriveInputConstraints } from '../input-constraints/deriveInputConstraints'
import { sessionPlanningModel } from './session-planning-model'

/** The approved general fallback. Reaching only this is the absence of a route, not a route. */
const GENERAL_FALLBACK = 'signalGroup:Z_soccer_general'

export interface GoalSupport {
    /** Learning Goal names that reach a specific signal group today. */
    supported: string[]
    /** Learning Goal names that reach nothing specific — a real gap, not a phrasing problem. */
    unsupported: string[]
}

function routesSpecifically(text: string): boolean {
    return deriveInputConstraints(text).matchedSignals.some(
        (signal) => signal.startsWith('signalGroup:') && signal !== GENERAL_FALLBACK
    )
}

function computeGoalSupport(): GoalSupport {
    const supported: string[] = []
    const unsupported: string[] = []

    for (const goal of sessionPlanningModel.learningGoals()) {
        const name = String(goal['Learning Goal'] ?? '')
        if (!name) continue

        // The goal's own entry phrases count too — a coach reaching it by search should not be told
        // it is unsupported just because its title happens to route poorly.
        const phrases = [
            name,
            ...sessionPlanningModel
                .entryLanguage()
                .filter((entry) => String(entry['Learning Goal ID']) === String(goal['ID']))
                .map((entry) => String(entry['Coach Phrase'])),
        ]

        if (phrases.some(routesSpecifically)) supported.push(name)
        else unsupported.push(name)
    }

    return { supported, unsupported }
}

let cached: GoalSupport | null = null

export function goalSupport(): GoalSupport {
    if (!cached) cached = computeGoalSupport()
    return cached
}

/**
 * Is this Learning Goal one we already know we cannot build? Distinguishing a KNOWN gap from an
 * unrecognised phrase is the whole point — the first deserves an apology and the second deserves a
 * nudge, and giving a coach the wrong one of those wastes their time.
 */
export function isKnownUnsupportedGoal(goalText: string): boolean {
    const needle = goalText.trim().toLowerCase()
    if (!needle) return false
    return goalSupport().unsupported.some((name) => needle.includes(name.toLowerCase()))
}

export interface UnsupportedGoalResponse {
    error: string
    suggestions: string[]
    detail: string
}

/**
 * The coach-facing answer when a goal cannot be routed.
 *
 * Two different messages, because they are two different situations:
 *   * a KNOWN gap — we recognise exactly what they asked for and cannot build it yet. Saying so is
 *     more respectful of their time than implying they phrased it badly, and it is true.
 *   * an unrecognised goal — rephrasing genuinely might work, so nudge rather than apologise.
 *
 * Suggestions are real supported goals in coach language, never a fixed list.
 */
export function describeUnsupportedGoal(goalText: string): UnsupportedGoalResponse {
    const { supported } = goalSupport()
    // A handful, not all of them — a wall of options is its own kind of unhelpful.
    const suggestions = supported.slice(0, 5)

    if (isKnownUnsupportedGoal(goalText)) {
        return {
            error:
                'We can’t build that one yet — it’s a gap on our side, not something you phrased wrong. ' +
                'Here’s what we can build today:',
            suggestions,
            detail: 'Goal recognised as a known unsupported planning intention.',
        }
    }

    return {
        error: 'I need a bit more to go on to build an activity. Try describing it like one of these:',
        suggestions,
        detail: 'No specific signal group was matched; goal reached only the general fallback or nothing.',
    }
}
