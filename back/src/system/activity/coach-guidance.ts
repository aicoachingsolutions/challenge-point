/**
 * Coach-facing guidance for goals the engine could not fully resolve.
 *
 * The engine has always known the difference between a goal it understood precisely, one it read
 * only in general terms, and one it could not read at all — `SelectionResolution` reports
 * matched / fallback / unresolved. Until now none of that reached the coach: a precise match and a
 * broad guess produced identical output, and an unreadable goal produced a bare error assembled
 * out of an internal stage name and a validator string.
 *
 * This module owns what the coach is told in each case. It follows the **Coach Communication
 * Standard**: never blame the coach, stay practical, reduce cognitive load, sound like an
 * experienced assistant coach rather than a parser. It also follows the integration spec's
 * **Transparent Failure** principle — when the platform cannot justify its reading, it says so and
 * defers, rather than fabricating certainty.
 *
 * And it follows **Quiet Assistance**: a confident match says NOTHING. A notice is only worth the
 * coach's attention when it could change their next decision — which, for a broad or failed read,
 * it can (rephrase, or accept deliberately). Adding a reassurance banner to every successful
 * generation would be exactly the "visible complexity" the standard warns against.
 *
 * Everything here is pure and data-driven so the copy is testable. In particular, EXAMPLE_GOALS is
 * verified by unit test to actually resolve through `deriveInputConstraints` — suggestions that
 * drift away from what the parser really supports would be worse than no suggestions at all,
 * because the coach would try one and be rejected again.
 */
import type { SelectionResolutionStatus } from '../test-library/types'

/**
 * Concrete goals we suggest when the engine cannot read what a coach typed.
 *
 * These are phrased the way a coach would say them, not the way the engine indexes them. Each one
 * is pinned by unit test to resolve to at least one signal group — if a future parser change
 * breaks one, the test fails rather than the coach.
 */
export const EXAMPLE_GOALS: readonly string[] = [
    'keep possession under pressure',
    'create space in wide areas',
    'break through a compact defence',
    'win the ball back quickly',
    'defend in transition',
    'finish attacks in the box',
] as const

export interface CoachGuidance {
    /** The message to show. One register, no internal vocabulary, no stage names. */
    message: string
    /** Concrete goals the coach can use as-is. May be empty. */
    suggestions: readonly string[]
}

/**
 * What to tell a coach whose goal produced no supported signals at all.
 *
 * Deliberately does NOT echo the coach's own words back. Quoting a rejected phrase reads as
 * correction, and the standard is explicit that we do not blame the coach — the engine's
 * vocabulary is the limitation here, not their phrasing.
 */
export function buildUnsupportedGoalGuidance(): CoachGuidance {
    return {
        message:
            "I couldn't match that to a training problem I know how to build yet. Try naming what you want players working on, and I'll build around it.",
        suggestions: EXAMPLE_GOALS,
    }
}

/**
 * What to tell a coach when generation SUCCEEDED but the engine's reading was broad rather than
 * precise. Returns null for a confident match — silence is the correct output there.
 *
 * `fallback` means only the general-soccer signal fired; `unresolved` means no signal group fired
 * and the engine scored the full library. Both produce usable activities that are less targeted
 * than the coach probably expected, and both are worth one quiet sentence.
 */
export function buildResolutionNotice(status: SelectionResolutionStatus): CoachGuidance | null {
    if (status === 'matched') return null
    return {
        message:
            'I read this as general soccer work, so these activities are broadly representative rather than targeted. Naming the problem players should face will get you something sharper.',
        suggestions: EXAMPLE_GOALS.slice(0, 3),
    }
}
