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
 * A CLAUSE cannot follow "for". "Support lane requirement creates a visible spatial game problem" is
 * a statement about the design; "switching play across the field" is a thing a player does. Only the
 * second can complete "Earn an extra point for …", and the first is what produced engine-voice
 * scoring lines that left Christian asking "what exactly am I rewarding?".
 */
function readsAsClause(phrase: string): boolean {
    return /\b(creates?|is|are|was|were|counts?|decides?|opens?|must|shall|will|should|means?|makes?)\b/i.test(phrase)
}

/**
 * Imperative intents become gerunds so they can follow "for": "Switch play" -> "switching play".
 *
 * The workbook authors design intents as instructions to the designer ("Win the ball back", "Use
 * wide areas"), which is the right voice for a design field and the wrong voice for a coach. The -e
 * rule covers the cases that actually occur ("Use" -> "using", "Penetrate" -> "penetrating"); a word
 * already ending in -ing is left alone.
 */
const IMPERATIVE_VERBS = new Set([
    'switch', 'win', 'use', 'slow', 'exploit', 'penetrate', 'maintain', 'protect', 'recover', 'delay',
    'press', 'create', 'break', 'force', 'keep', 'progress', 'regain', 'deny', 'connect', 'attack',
    'defend', 'score', 'secure', 'exploit', 'occupy', 'stretch', 'overload', 'combine', 'receive',
])

function toGerundPhrase(phrase: string): string {
    const [first, ...rest] = phrase.split(' ')
    if (!first || /ing$/i.test(first)) return phrase

    // ONLY GERUNDIZE AN ACTUAL VERB. Not every design intent is imperative — an authored intent is
    // a noun phrase, and treating its first word as a verb produced "Scores from finaling third
    // entry are worth double." An unrecognised first word is left exactly as authored, which reads
    // slightly stiffly at worst; the alternative invents a word.
    const lower = first.toLowerCase()
    if (!IMPERATIVE_VERBS.has(lower)) return phrase

    const gerund = /e$/.test(lower) && !/ee$/.test(lower) ? `${lower.slice(0, -1)}ing` : `${lower}ing`
    return [gerund, ...rest].join(' ')
}

export function conditionPhrase(source: IncentiveSource): string | null {
    // ONLY A "Reward …" DESCRIPTION NAMES THE TRIGGER. "Reward switching play across the field"
    // means the switch is what earns the reward, so stripping the verb leaves a usable gerund. But
    // Some descriptions instead describe the MECHANISM, and using them as the trigger produced a doubled mechanism with the
    // trigger never named — "Scores from scoring value in <area> are worth double".
    // For those the short design intent is the better trigger, so it is tried first.
    const describesTrigger = /^rewards?\s+/i.test((source.description ?? '').trim())
    const candidates: Array<{ raw?: string; imperative: boolean }> = describesTrigger
        ? [
              { raw: source.description, imperative: false },
              { raw: source.designIntent, imperative: true },
          ]
        : [
              { raw: source.designIntent, imperative: true },
              { raw: source.description, imperative: false },
          ]

    for (const { raw, imperative } of candidates) {
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

        phrase = phrase.charAt(0).toLowerCase() + phrase.slice(1)
        if (imperative) phrase = toGerundPhrase(phrase)

        // A clause here would produce "Earn an extra point for support lane requirement creates a
        // visible spatial game problem." Prefer the next source; if none works, say nothing at all.
        // Silence is a missing line, which the coach can live with; the alternative is a sentence
        // that tells them we are not writing for them.
        if (readsAsClause(phrase)) continue

        return phrase
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
        // LEAD WITH WHAT THE PLAYERS EARN, then what earns it.
        //
        // Christian, 24 Aug: the incentive was reaching the activity but still "communicated from
        // the engine's perspective rather than the coach's", leaving him asking "what exactly am I
        // rewarding?" of lines like "Effective use of wide areas during play — bonus points on top
        // of the normal way of scoring." The information was all there; the sentence just made the
        // coach assemble it. His target shape is the reward first and the condition as a plain
        // trigger — "Earn an extra point if your team switches play before entering the end zone."
        case 'scoring_bonus':
            return `Earn an extra point for ${condition}.`
        case 'value_multiplier':
            return `Scores from ${condition} are worth double.`
        case 'time_window_reward':
            return `Earn an extra point for ${condition} — but only inside a short window, and it is gone once the window closes.`
        case 'defensive_reward':
            return `The defending team earns a point for ${condition}.`
        case 'positional_or_scoring_advantage':
            return `Earn a live advantage instead of a point for ${condition} — your team keeps it until the next change of possession.`
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
    return /(?:earn an extra point for|scores from .+ are worth double|the defending team earns a point for|earn a live advantage instead of a point for)/i.test(
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
