/**
 * INCENTIVE MECHANISMS — expressing HOW a game rewards, not just THAT it awards a point.
 *
 * Christian, 22 Aug, after generating many activities from the same planning selections: "It isn't
 * really a scoring problem. I think it's an incentive problem." Every activity fell back to a
 * variant of "A point or live advantage counts…", so three activities built to teach switching play
 * all rewarded it the same way, differing only in wording.
 *
 * He was right, and the cause is flatter than he suspected. "A point or live advantage counts…" was
 * never a fallback the generator reached for — it is a sentence hardcoded fifteen times across two
 * files, one per game form. The pipeline had exactly one incentive mechanism (award a point when a
 * condition is met) and varied only the condition text. There was no range to collapse from.
 *
 * MEANWHILE THE KNOWLEDGE WAS ALREADY AUTHORED. The sport module carries an `incentive_mechanism`
 * on each realization, with five distinct values — and `build-constraint-package.ts` had a single
 * branch matching `scoring_bonus`. The other four contributed nothing at all, so a constraint
 * authored as a time-window reward produced no scoring content and the generic template filled the
 * silence. The one mechanism that was handled emitted "Additional point awarded when condition is
 * met", which does not say which condition.
 *
 * WHAT THIS FILE DOES AND DELIBERATELY DOES NOT DO. It gives each mechanism a distinct STRUCTURE —
 * a bonus reads differently from a multiplier, which reads differently from a time window — and
 * fills that structure with the constraint's OWN authored words. It does not invent coaching
 * content: the phrase describing what earns the reward always comes from the workbook, never from
 * here. The realizations sheet has an `incentive_patterns` column intended for exactly that
 * phrasing and it is currently empty on all 23 rows; when Christian fills it, it should be preferred
 * over the derivation below, and the templates here become the fallback rather than the ceiling.
 *
 * Sport-neutral by construction: every sport-specific word in the output arrives from the module.
 */

/** The mechanism values currently authored in the sport module. */
export type IncentiveMechanism =
    | 'scoring_bonus'
    | 'value_multiplier'
    | 'time_window_reward'
    | 'defensive_reward'
    | 'positional_or_scoring_advantage'

export interface IncentiveSource {
    /** Authored short intent — an imperative phrase naming what the constraint is for. */
    designIntent?: string
    /** Authored description, e.g. "Reward switching play across the field". */
    description?: string
    /** Authored coach-facing phrasing, once the incentive_patterns column is populated. */
    incentivePatterns?: string[]
}

const MAX_CONDITION_CHARS = 90

/**
 * The phrase naming what earns the reward, taken from authored knowledge.
 *
 * `description` is preferred because it is authored as "Reward switching play across the field",
 * and stripping the leading verb yields a phrase that drops straight into a sentence. `designIntent`
 * is the fallback — it is shorter and imperative, so it reads less naturally mid-
 * sentence. Long prose entries are cut at the first clause boundary rather than mid-word.
 */
export function conditionPhrase(source: IncentiveSource): string | null {
    const candidates = [source.description, source.designIntent]

    for (const raw of candidates) {
        if (typeof raw !== 'string' || raw.trim().length === 0) continue

        let phrase = raw
            .trim()
            .replace(/^(rewards?|increases?|provides?|encourages?)\s+/i, '')
            .replace(/\s+/g, ' ')

        // Prose entries describe a whole mechanism across several clauses; the first clause is the
        // part that names the trigger.
        if (phrase.length > MAX_CONDITION_CHARS) {
            phrase = phrase.split(/[;:]|(?<=[.!?])\s/)[0]?.trim() ?? phrase
        }
        if (phrase.length > MAX_CONDITION_CHARS) continue

        phrase = phrase.replace(/[.]+$/, '')
        if (phrase.length < 3) continue

        // Mid-sentence position: drop a capital that only exists because it started a field.
        return phrase.charAt(0).toLowerCase() + phrase.slice(1)
    }

    return null
}

/**
 * One coach-facing sentence expressing the mechanism, or null when nothing is authored.
 *
 * Returning null matters: a mechanism of `none` (9 of 23 rows) must produce nothing rather than a
 * placeholder, because a placeholder is what "Additional point awarded when condition is met" was.
 */
export function expressIncentive(mechanism: string | undefined, source: IncentiveSource): string | null {
    if (!mechanism || mechanism === 'none') return null

    // Authored phrasing wins outright when it exists — the whole point of the incentive_patterns
    // column is that a coach's wording beats anything derived.
    const authored = source.incentivePatterns?.find((p) => typeof p === 'string' && p.trim().length > 0)
    if (authored) return authored.trim().replace(/[.]*$/, '.')

    const condition = conditionPhrase(source)
    if (!condition) return null

    switch (mechanism as IncentiveMechanism) {
        // APPENDED, NOT EMBEDDED. Authored phrases are not all noun phrases — some are whole clauses
        // ("Support lane requirement creates a visible spatial game problem") — and dropping those
        // into "bonus points for {X}" produced sentences no coach would read twice. Appending the
        // mechanism after the authored phrase is grammatical whatever shape the phrase takes.
        case 'scoring_bonus':
            return `${capitalize(condition)} — bonus points on top of the normal way of scoring.`
        case 'value_multiplier':
            return `${capitalize(condition)} — worth double.`
        case 'time_window_reward':
            return `${capitalize(condition)} — but only inside a short live window; once it closes the extra value is gone.`
        case 'defensive_reward':
            return `${capitalize(condition)} — the defending team scores this way too, without needing to attack.`
        case 'positional_or_scoring_advantage':
            return `${capitalize(condition)} — earns a live advantage rather than a point, held until the next change of possession.`
        default:
            // An unrecognized mechanism is authored knowledge we do not understand yet. Say nothing
            // rather than guess: silence is recoverable, a wrong incentive teaches the wrong game.
            return null
    }
}

function capitalize(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1)
}

/**
 * Recognises a sentence produced by expressIncentive, so the coach-facing cap treats it as
 * must-keep.
 *
 * Without this the incentive is generated correctly, reaches the mechanics, and is then dropped by
 * the scoring cap in favour of longer, more "distinctive" boilerplate — leaving the coach with the
 * generic material and none of the mechanism. Same class of loss as the slot modifiers, which are
 * protected for the same reason: the differentiating line is the one worth keeping.
 */
export function isIncentiveExpression(sentence: string): boolean {
    return /— (?:bonus points on top of|worth double|but only inside a short live window|the defending team scores this way too|earns a live advantage rather than a point)/i.test(
        sentence
    )
}

/**
 * The hardcoded per-archetype template, recognizable so presentation can suppress it once a real
 * mechanism has spoken. Keeping both produces exactly the repetition Christian reported: a specific
 * incentive followed by a generic restatement of it.
 */
export function isGenericPointTemplate(sentence: string): boolean {
    return /\ba point or live advantage counts\b/i.test(sentence)
}
