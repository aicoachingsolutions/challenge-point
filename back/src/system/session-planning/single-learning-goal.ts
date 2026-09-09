/**
 * ONE PRIMARY LEARNING INTENTION PER GENERATION.
 *
 * Christian's requirement, Path to Pilot Checklist RC4 section 1: if a coach enters more than one
 * coaching intention, tell them Challenge Point currently generates around one, and let them choose
 * which. The success criterion is that generation always proceeds from one representative learning
 * goal.
 *
 * WHAT IT DOES TODAY, AND WHY THAT IS WORSE THAN AN ERROR. Multiple goals are joined with a space
 * and parsed as one blob. Two intentions therefore blend into a third that the coach never asked
 * for: "break defensive lines" plus "press higher after losing it" resolves against the union of
 * both signal sets, and the activity that comes back represents neither cleanly. Nothing fails, the
 * coach gets three plausible activities, and the reason they do not quite fit the session is
 * invisible. Refusing to guess is the honest behaviour, and it is also the only one that keeps the
 * pilot's evidence interpretable — an activity generated from a blend cannot be attributed to a
 * learning goal afterwards.
 *
 * DETECTION IS DELIBERATELY CONSERVATIVE. Only separators that a coach uses to make a LIST count:
 * separate entries, new lines, semicolons, bullets, numbering, and the explicit "and also". Bare
 * "and" and commas are not treated as separators, because they appear constantly inside a single
 * intention — "support angles and depth under pressure" is one goal, not two, and splitting it
 * would interrupt a coach who did nothing wrong. A false positive here costs more than a false
 * negative: being asked to disambiguate something you did not write is worse than the current
 * blending, which at least produces something.
 */

/** List separators a coach uses deliberately. Commas and bare "and" are excluded on purpose. */
const INTENTION_SEPARATOR = /\r?\n|;|\s\|\s|\s+and\s+also\s+|\s+as\s+well\s+as\s+/i

/** Leading bullet or numbering on a pasted list item: "- ", "* ", "1. ", "2) ". */
const LIST_MARKER = /^\s*(?:[-*•]|\d+[.)])\s+/

/**
 * The distinct coaching intentions in what the coach submitted.
 *
 * Returns one entry for a single intention, which is the overwhelmingly common case and the one that
 * must stay silent.
 */
export function splitCoachingIntentions(goals: readonly string[]): string[] {
    const intentions: string[] = []

    for (const goal of goals) {
        if (typeof goal !== 'string') continue
        for (const part of goal.split(INTENTION_SEPARATOR)) {
            const cleaned = part.replace(LIST_MARKER, '').trim()
            // Fragments too short to be a coaching intention are punctuation noise from the split,
            // not something to ask the coach to choose between.
            if (cleaned.length < 3) continue
            if (!intentions.some((existing) => existing.toLowerCase() === cleaned.toLowerCase())) {
                intentions.push(cleaned)
            }
        }
    }

    return intentions
}

export interface MultipleIntentionGuidance {
    message: string
    /** The intentions found, in the order the coach wrote them, for the coach to choose from. */
    intentions: string[]
}

/**
 * What to tell a coach who entered more than one intention.
 *
 * Follows the Coach Communication Standard the same way coach-guidance.ts does: it does not blame
 * the coach, it states the product's current limit as the product's, and it asks for one decision
 * rather than explaining the architecture behind the request. Their own words are echoed back here —
 * unlike an unreadable goal, where quoting reads as correction — because they are the options, and
 * a coach choosing between two things needs to see both.
 */
export function buildMultipleIntentionGuidance(intentions: readonly string[]): MultipleIntentionGuidance {
    return {
        message:
            'Challenge Point builds each activity around one learning intention. ' +
            'Pick the one to focus on for this session — the others stay in your notes for next time.',
        intentions: [...intentions],
    }
}

/**
 * Does this submission need the coach to choose?
 *
 * Separated from the guidance so the route reads as a question and an answer, and so the threshold
 * lives in exactly one place.
 */
export function needsIntentionChoice(goals: readonly string[]): boolean {
    return splitCoachingIntentions(goals).length > 1
}
